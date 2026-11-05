-- FoundBug V7: outgoing webhooks + Telegram notifications.
-- Additive. Delivery is done by the database (pg_net), so it works no matter how an
-- issue changes (web UI, MCP, API). A failing hook never blocks the original write.

begin;

create extension if not exists pg_net;
create extension if not exists pgcrypto with schema extensions;

-- Public base URL used in links inside notifications. Change here if the domain changes.
create or replace function public.ifb_app_url() returns text language sql immutable as $$
  select 'https://i-found-bug.vercel.app'::text
$$;

create table if not exists public.ifb_webhooks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ifb_projects(id) on delete cascade,
  kind text not null check (kind in ('http','telegram')),
  name text not null default '' check (length(name) <= 80),
  url text check (url is null or length(url) <= 500),
  secret text,
  telegram_bot_token text,
  telegram_chat_id text check (telegram_chat_id is null or telegram_chat_id ~ '^(-?[0-9]{1,20}|@[A-Za-z0-9_]{5,32})$'),
  events text[] not null default array['issue.created','issue.status_changed','comment.created'],
  active boolean not null default true,
  created_by uuid references public.ifb_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ifb_webhooks_target check (
    (kind = 'http' and url is not null and secret is not null) or
    (kind = 'telegram' and telegram_bot_token is not null and telegram_chat_id is not null)),
  constraint ifb_webhooks_events check (events <@ array['issue.created','issue.status_changed','issue.assigned','comment.created']::text[] and cardinality(events) > 0)
);
create index if not exists ifb_webhooks_project_idx on public.ifb_webhooks (project_id) where active;

create table if not exists public.ifb_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.ifb_webhooks(id) on delete cascade,
  event text not null,
  request_id bigint,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists ifb_webhook_deliveries_hook_idx on public.ifb_webhook_deliveries (webhook_id, created_at desc);

-- Secrets never leave the database through the API: no direct table access at all.
alter table public.ifb_webhooks enable row level security;
alter table public.ifb_webhook_deliveries enable row level security;
revoke all on public.ifb_webhooks, public.ifb_webhook_deliveries from anon, authenticated;

-- Reject obviously internal targets (SSRF guard). HTTPS only.
create or replace function public.ifb_webhook_url_ok(p_url text) returns boolean language sql immutable as $$
  select p_url ~ '^https://[A-Za-z0-9.-]+(:[0-9]{2,5})?(/[^\s]*)?$'
     and lower(substring(p_url from '^https://([^/:]+)')) !~ '(^localhost$|\.local$|\.internal$|^[0-9.]+$|^\[|supabase\.co$|supabase\.com$)'
$$;

create or replace function public.ifb_html(p text) returns text language sql immutable as $$
  select replace(replace(replace(coalesce(p, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;

-- Sends one event to every matching active hook of a project. Never raises.
create or replace function public.ifb_dispatch_webhooks(p_project uuid, p_event text, p_payload jsonb, p_text text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  h public.ifb_webhooks%rowtype;
  v_body jsonb;
  v_req bigint;
  v_delivery uuid;
begin
  for h in select * from public.ifb_webhooks where project_id = p_project and active and p_event = any(events) loop
    v_delivery := gen_random_uuid();
    begin
      if h.kind = 'http' then
        v_body := jsonb_build_object('id', v_delivery, 'event', p_event, 'created_at', now(), 'data', p_payload);
        select net.http_post(
          url := h.url,
          body := v_body,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'User-Agent', 'IFoundBug-Webhooks/1',
            'X-IFB-Event', p_event,
            'X-IFB-Delivery', v_delivery::text,
            'X-IFB-Signature', 'sha256=' || encode(extensions.hmac(v_body::text, h.secret, 'sha256'), 'hex')),
          timeout_milliseconds := 5000) into v_req;
      else
        select net.http_post(
          url := 'https://api.telegram.org/bot' || h.telegram_bot_token || '/sendMessage',
          body := jsonb_build_object('chat_id', h.telegram_chat_id, 'text', left(p_text, 4000), 'parse_mode', 'HTML', 'disable_web_page_preview', true),
          timeout_milliseconds := 5000) into v_req;
      end if;
      insert into public.ifb_webhook_deliveries(id, webhook_id, event, request_id) values (v_delivery, h.id, p_event, v_req);
    exception when others then
      insert into public.ifb_webhook_deliveries(id, webhook_id, event, error) values (v_delivery, h.id, p_event, left(sqlerrm, 500));
    end;
  end loop;
exception when others then
  -- Never let notifications break the user's write.
  raise warning 'ifb_dispatch_webhooks failed: %', sqlerrm;
end; $$;
revoke all on function public.ifb_dispatch_webhooks(uuid, text, jsonb, text) from public, anon, authenticated;

create or replace function public.ifb_webhooks_on_bug() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_project public.ifb_projects%rowtype;
  v_event text;
  v_link text;
  v_head text;
  v_assignee text;
begin
  if not exists (select 1 from public.ifb_webhooks where project_id = new.project_id and active) then return new; end if;
  if tg_op = 'INSERT' then v_event := 'issue.created';
  elsif new.status is distinct from old.status then v_event := 'issue.status_changed';
  elsif new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then v_event := 'issue.assigned';
  else return new; end if;
  select * into v_project from public.ifb_projects where id = new.project_id;
  v_link := public.ifb_app_url() || '/p/' || v_project.slug || '/b/' || new.code;
  select full_name into v_assignee from public.ifb_profiles where id = new.assigned_to;
  v_head := case v_event
    when 'issue.created' then '🐞 <b>New issue</b>'
    when 'issue.status_changed' then '🔄 <b>Status:</b> ' || public.ifb_html(old.status) || ' → <b>' || public.ifb_html(new.status) || '</b>'
    else '👤 <b>Assigned to</b> ' || public.ifb_html(v_assignee) end;
  perform public.ifb_dispatch_webhooks(new.project_id, v_event,
    jsonb_build_object(
      'repository', jsonb_build_object('id', v_project.id, 'name', v_project.name, 'slug', v_project.slug),
      'issue', jsonb_build_object('id', new.id, 'code', new.code, 'title', new.title, 'status', new.status,
        'previous_status', case when tg_op = 'UPDATE' then old.status end,
        'severity', new.severity, 'priority', new.priority, 'environment', new.environment,
        'reporter', new.reporter_name, 'assignee', v_assignee, 'url', v_link,
        'created_at', new.created_at, 'updated_at', new.updated_at)),
    v_head || E'\n<b>' || public.ifb_html(new.code) || '</b> · ' || public.ifb_html(new.title)
      || E'\n' || public.ifb_html(new.severity) || ' · ' || public.ifb_html(new.priority) || ' · ' || public.ifb_html(v_project.name)
      || case when tg_op = 'INSERT' then E'\nby ' || public.ifb_html(new.reporter_name) else '' end
      || E'\n' || v_link);
  return new;
end; $$;

create or replace function public.ifb_webhooks_on_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_bug public.ifb_bugs%rowtype;
  v_project public.ifb_projects%rowtype;
  v_link text;
begin
  if new.is_internal then return new; end if;  -- team-only notes never leave IFB
  select * into v_bug from public.ifb_bugs where id = new.bug_id;
  if not exists (select 1 from public.ifb_webhooks where project_id = v_bug.project_id and active) then return new; end if;
  select * into v_project from public.ifb_projects where id = v_bug.project_id;
  v_link := public.ifb_app_url() || '/p/' || v_project.slug || '/b/' || v_bug.code;
  perform public.ifb_dispatch_webhooks(v_bug.project_id, 'comment.created',
    jsonb_build_object(
      'repository', jsonb_build_object('id', v_project.id, 'name', v_project.name, 'slug', v_project.slug),
      'issue', jsonb_build_object('id', v_bug.id, 'code', v_bug.code, 'title', v_bug.title, 'url', v_link),
      'comment', jsonb_build_object('id', new.id, 'author', new.author_name, 'content', new.content, 'created_at', new.created_at)),
    '💬 <b>' || public.ifb_html(new.author_name) || '</b> commented on <b>' || public.ifb_html(v_bug.code) || '</b> · ' || public.ifb_html(v_bug.title)
      || E'\n\n' || public.ifb_html(left(new.content, 1500)) || E'\n' || v_link);
  return new;
end; $$;

drop trigger if exists ifb_bugs_webhooks on public.ifb_bugs;
create trigger ifb_bugs_webhooks after insert or update of status, assigned_to on public.ifb_bugs
  for each row execute function public.ifb_webhooks_on_bug();
drop trigger if exists ifb_comments_webhooks on public.ifb_bug_comments;
create trigger ifb_comments_webhooks after insert on public.ifb_bug_comments
  for each row execute function public.ifb_webhooks_on_comment();

-- Management API (owner/admin only). p_actor is honoured only for the service role (REST API/MCP).
create or replace function public.ifb_webhook_actor(p_actor uuid) returns uuid language sql stable security definer set search_path = public as $$
  select case when coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                            nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', '') = 'service_role'
              then p_actor else public.ifb_my_profile_id() end
$$;
revoke all on function public.ifb_webhook_actor(uuid) from public, anon, authenticated;

create or replace function public.ifb_require_project_admin(p_project uuid, p_actor uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if p_actor is null or not exists (
    select 1 from public.ifb_projects p where p.id = p_project and (p.created_by = p_actor or exists (
      select 1 from public.ifb_project_members m where m.project_id = p_project and m.user_id = p_actor and m.role in ('owner','admin')))) then
    raise exception 'Only repository owners and admins can manage integrations';
  end if;
end; $$;
revoke all on function public.ifb_require_project_admin(uuid, uuid) from public, anon, authenticated;

create or replace function public.ifb_list_webhooks(p_project uuid, p_actor uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public, net as $$
declare v_actor uuid := public.ifb_webhook_actor(p_actor);
begin
  perform public.ifb_require_project_admin(p_project, v_actor);
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', h.id, 'kind', h.kind, 'name', h.name, 'url', h.url, 'telegram_chat_id', h.telegram_chat_id,
      'telegram_bot', case when h.telegram_bot_token is not null then split_part(h.telegram_bot_token, ':', 1) end,
      'events', h.events, 'active', h.active, 'created_at', h.created_at,
      'recent', (select coalesce(jsonb_agg(jsonb_build_object('event', d.event, 'at', d.created_at,
                   'status', r.status_code, 'error', coalesce(d.error, r.error_msg,
                     case when r.status_code >= 400 then left(r.content, 200) end),
                   'pending', d.error is null and r.id is null) order by d.created_at desc), '[]'::jsonb)
                 from (select * from public.ifb_webhook_deliveries where webhook_id = h.id order by created_at desc limit 5) d
                 left join net._http_response r on r.id = d.request_id)
    ) order by h.created_at) from public.ifb_webhooks h where h.project_id = p_project), '[]'::jsonb);
end; $$;

create or replace function public.ifb_create_webhook(p_project uuid, p_kind text, p_name text, p_url text,
  p_telegram_bot_token text, p_telegram_chat_id text, p_events text[], p_actor uuid default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_actor uuid := public.ifb_webhook_actor(p_actor);
  v_secret text;
  v_id uuid;
begin
  perform public.ifb_require_project_admin(p_project, v_actor);
  if (select count(*) from public.ifb_webhooks where project_id = p_project) >= 10 then
    raise exception 'A repository can have at most 10 integrations';
  end if;
  if p_kind = 'http' then
    if not public.ifb_webhook_url_ok(p_url) then raise exception 'Webhook URL must be a public https:// address'; end if;
    v_secret := 'whsec_' || encode(extensions.gen_random_bytes(24), 'hex');
  elsif p_kind = 'telegram' then
    if p_telegram_bot_token is null or p_telegram_bot_token !~ '^[0-9]{5,15}:[A-Za-z0-9_-]{30,64}$' then
      raise exception 'Telegram bot token looks wrong. Copy it from @BotFather (format 123456:ABC...)';
    end if;
  else raise exception 'Unknown integration type'; end if;
  insert into public.ifb_webhooks(project_id, kind, name, url, secret, telegram_bot_token, telegram_chat_id, events, created_by)
  values (p_project, p_kind, coalesce(left(p_name, 80), ''), case when p_kind = 'http' then p_url end, v_secret,
          case when p_kind = 'telegram' then p_telegram_bot_token end, case when p_kind = 'telegram' then p_telegram_chat_id end,
          coalesce(p_events, array['issue.created','issue.status_changed','comment.created']), v_actor)
  returning id into v_id;
  -- The signing secret is returned exactly once.
  return jsonb_build_object('id', v_id, 'secret', v_secret);
end; $$;

create or replace function public.ifb_update_webhook(p_id uuid, p_active boolean, p_events text[], p_actor uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_project uuid;
begin
  select project_id into v_project from public.ifb_webhooks where id = p_id;
  if v_project is null then raise exception 'Integration not found'; end if;
  perform public.ifb_require_project_admin(v_project, public.ifb_webhook_actor(p_actor));
  update public.ifb_webhooks set active = coalesce(p_active, active), events = coalesce(p_events, events) where id = p_id;
end; $$;

create or replace function public.ifb_delete_webhook(p_id uuid, p_actor uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_project uuid;
begin
  select project_id into v_project from public.ifb_webhooks where id = p_id;
  if v_project is null then raise exception 'Integration not found'; end if;
  perform public.ifb_require_project_admin(v_project, public.ifb_webhook_actor(p_actor));
  delete from public.ifb_webhooks where id = p_id;
end; $$;

create or replace function public.ifb_test_webhook(p_id uuid, p_actor uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare h public.ifb_webhooks%rowtype; p public.ifb_projects%rowtype;
begin
  select * into h from public.ifb_webhooks where id = p_id;
  if not found then raise exception 'Integration not found'; end if;
  perform public.ifb_require_project_admin(h.project_id, public.ifb_webhook_actor(p_actor));
  select * into p from public.ifb_projects where id = h.project_id;
  -- Sends a ping to this hook only.
  perform public.ifb_dispatch_test(h, p);
end; $$;

create or replace function public.ifb_dispatch_test(h public.ifb_webhooks, p public.ifb_projects)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_body jsonb; v_req bigint; v_delivery uuid := gen_random_uuid();
begin
  if h.kind = 'http' then
    v_body := jsonb_build_object('id', v_delivery, 'event', 'ping', 'created_at', now(),
      'data', jsonb_build_object('repository', jsonb_build_object('id', p.id, 'name', p.name, 'slug', p.slug)));
    select net.http_post(url := h.url, body := v_body,
      headers := jsonb_build_object('Content-Type', 'application/json', 'User-Agent', 'IFoundBug-Webhooks/1', 'X-IFB-Event', 'ping',
        'X-IFB-Delivery', v_delivery::text, 'X-IFB-Signature', 'sha256=' || encode(extensions.hmac(v_body::text, h.secret, 'sha256'), 'hex')),
      timeout_milliseconds := 5000) into v_req;
  else
    select net.http_post(url := 'https://api.telegram.org/bot' || h.telegram_bot_token || '/sendMessage',
      body := jsonb_build_object('chat_id', h.telegram_chat_id, 'parse_mode', 'HTML', 'disable_web_page_preview', true,
        'text', '✅ <b>IFoundBug is connected</b>' || E'\n' || 'Repository: ' || public.ifb_html(p.name) || E'\n' || 'You will get new issues, status changes and comments here.'),
      timeout_milliseconds := 5000) into v_req;
  end if;
  insert into public.ifb_webhook_deliveries(id, webhook_id, event, request_id) values (v_delivery, h.id, 'ping', v_req);
end; $$;

revoke all on function public.ifb_dispatch_test(public.ifb_webhooks, public.ifb_projects) from public, anon, authenticated;
revoke all on function public.ifb_list_webhooks(uuid, uuid), public.ifb_create_webhook(uuid, text, text, text, text, text, text[], uuid),
  public.ifb_update_webhook(uuid, boolean, text[], uuid), public.ifb_delete_webhook(uuid, uuid), public.ifb_test_webhook(uuid, uuid) from public, anon;
grant execute on function public.ifb_list_webhooks(uuid, uuid), public.ifb_create_webhook(uuid, text, text, text, text, text, text[], uuid),
  public.ifb_update_webhook(uuid, boolean, text[], uuid), public.ifb_delete_webhook(uuid, uuid), public.ifb_test_webhook(uuid, uuid) to authenticated, service_role;
revoke all on function public.ifb_webhooks_on_bug(), public.ifb_webhooks_on_comment() from public, anon, authenticated;

commit;
