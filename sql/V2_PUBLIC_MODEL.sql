-- ============================================================================
-- IFOUNDBUG v2 — PUBLIC-BY-DEFAULT MODEL (migration on top of IFOUNDBUG_UNIVERSAL.sql)
-- Idempotent. Run once in Supabase SQL Editor AFTER taking a backup.
--
-- Rules after this migration
--   * Everyone can READ public projects, listed bugs and their public comments.
--   * Logged-in users can create bugs, comment and "me too" any visible bug.
--   * Triage (status / severity / priority / assignee / notes) = project members
--     with a non-viewer role. Project settings/team = owner/admin.
--   * A bug is LISTED (public) unless it has a share_token. A bug with a
--     share_token is "link-only": hidden from lists/search/API, opened only with
--     the long secret link /s/<token> (or by its reporter / project members).
--   * Bugs that were hidden before (is_sensitive or in a non-public project)
--     are migrated to link-only so nothing private becomes public by accident.
-- ============================================================================
begin;

-- 1. SCHEMA -------------------------------------------------------------------
alter table public.ifb_bugs add column if not exists share_token text;
create unique index if not exists ifb_bugs_share_token_uidx on public.ifb_bugs(share_token) where share_token is not null;

-- Keep previously hidden content hidden: convert to link-only BEFORE opening reads.
update public.ifb_bugs b
   set share_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
 where b.share_token is null
   and (b.is_sensitive or exists (select 1 from public.ifb_projects p where p.id = b.project_id and not p.is_public));
-- Keep private project metadata private; public bug listing is only for public projects.
-- Attachments are private objects. The application serves them only after checking
-- issue visibility or the secret issue token in /api/attachments.
update storage.buckets set public = false, file_size_limit = 10485760
 where id = 'bug-attachments';
drop policy if exists ifb_public_read_bug_attachments on storage.objects;
drop policy if exists ifb_authenticated_read_bug_attachments on storage.objects;

-- Convert existing public object URLs to the guarded application proxy without
-- changing the underlying Storage object keys.
update public.ifb_bugs b
set evidence_urls = array(
  select case
    when u ~ '^https?://[^/]+/storage/v1/object/public/bug-attachments/'
      then regexp_replace(u, '^https?://[^/]+/storage/v1/object/public/bug-attachments/', '/api/attachments/')
    else u
  end
  from unnest(b.evidence_urls) as u
)
where exists (
  select 1 from unnest(b.evidence_urls) as u
  where u ~ '^https?://[^/]+/storage/v1/object/public/bug-attachments/'
);

-- 2. HELPERS (security definer so RLS policies never recurse) ------------------
create or replace function public.ifb_my_profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.ifb_profiles where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.ifb_is_member(p_project uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ifb_project_members m
                 where m.project_id = p_project and m.user_id = public.ifb_my_profile_id())
$$;

-- triage = may change status/severity/priority/assignee/notes
create or replace function public.ifb_can_triage(p_project uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ifb_project_members m
                 where m.project_id = p_project and m.user_id = public.ifb_my_profile_id()
                   and m.role not in ('viewer','hunter'))
$$;

create or replace function public.ifb_is_project_admin(p_project uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ifb_project_members m
                 where m.project_id = p_project and m.user_id = public.ifb_my_profile_id()
                   and m.role in ('owner','admin'))
$$;

create or replace function public.ifb_bug_project(p_bug uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select project_id from public.ifb_bugs where id = p_bug
$$;

-- A bug is visible if it is listed, or the caller reported it / is a member.
create or replace function public.ifb_bug_visible(p_bug uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ifb_bugs b
                 where b.id = p_bug
                   and ((b.share_token is null and not b.is_sensitive and exists (
                          select 1 from public.ifb_projects p where p.id = b.project_id and p.is_public))
                        or b.reported_by = public.ifb_my_profile_id()
                        or public.ifb_is_member(b.project_id)))
$$;

-- Repair owner memberships on existing installations without changing project data.
update public.ifb_project_members m set role = 'developer'
  from public.ifb_projects p
 where p.id = m.project_id and m.role = 'owner'
   and p.created_by is not null and m.user_id <> p.created_by;
insert into public.ifb_project_members(project_id, user_id, role)
  select id, created_by, 'owner' from public.ifb_projects where created_by is not null
  on conflict (project_id, user_id) do update set role = 'owner';

-- 3. INSERT / UPDATE GUARDS ----------------------------------------------------
-- Client roles (authenticated) cannot forge ownership, counters or triage fields.
-- SECURITY DEFINER RPCs and the service role (MCP) run as another user and bypass this.
-- NOTE: must be SECURITY INVOKER so current_user is the calling role (authenticated), not the owner.
create or replace function public.ifb_guard_bug_write() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if tg_op = 'INSERT' then
    new.share_token := null;
    new.upvotes_count := 0; new.reproduced_count := 0; new.views_count := 0;
    if not public.ifb_can_triage(new.project_id) then
      new.status := 'REPORTED'; new.priority := 'P2'; new.assigned_to := null;
      new.dev_notes := null; new.acceptance_criteria := '[]'::jsonb;
    end if;
  else
    new.share_token := old.share_token; new.reported_by := old.reported_by;
    new.reporter_name := old.reporter_name; new.code := old.code; new.project_id := old.project_id;
    new.upvotes_count := old.upvotes_count; new.reproduced_count := old.reproduced_count;
    new.views_count := old.views_count; new.resolved_at := old.resolved_at;
    if not public.ifb_can_triage(old.project_id) then
      new.status := old.status; new.priority := old.priority; new.severity := old.severity;
      new.assigned_to := old.assigned_to; new.dev_notes := old.dev_notes;
      new.acceptance_criteria := old.acceptance_criteria;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists ifb_bugs_guard_write on public.ifb_bugs;
create trigger ifb_bugs_guard_write before insert or update on public.ifb_bugs
for each row execute function public.ifb_guard_bug_write();

-- Simple anti-spam: per-account rate limits.
create or replace function public.ifb_rate_limit() returns trigger
language plpgsql set search_path = public as $$
declare v_me uuid; v_n integer;
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  v_me := public.ifb_my_profile_id();
  if tg_table_name = 'ifb_bugs' then
    select count(*) into v_n from public.ifb_bugs where reported_by = v_me and created_at > now() - interval '1 hour';
    if v_n > 20 then raise exception 'Rate limit: at most 20 bugs per hour'; end if;
  else
    select count(*) into v_n from public.ifb_bug_comments where author_id = v_me and created_at > now() - interval '10 minutes';
    if v_n > 30 then raise exception 'Rate limit: at most 30 comments per 10 minutes'; end if;
  end if;
  return new;
end; $$;
drop trigger if exists ifb_bugs_rate_limit on public.ifb_bugs;
create trigger ifb_bugs_rate_limit after insert on public.ifb_bugs for each row execute function public.ifb_rate_limit();
drop trigger if exists ifb_comments_rate_limit on public.ifb_bug_comments;
create trigger ifb_comments_rate_limit after insert on public.ifb_bug_comments for each row execute function public.ifb_rate_limit();

-- Ownership is immutable through normal client writes. A project owner can
-- delegate admin rights, but admins cannot promote themselves or replace owner.
create or replace function public.ifb_guard_project_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.created_by := old.created_by;
  end if;
  return new;
end; $$;
drop trigger if exists ifb_projects_guard_update on public.ifb_projects;
create trigger ifb_projects_guard_update before update on public.ifb_projects
for each row execute function public.ifb_guard_project_update();

create or replace function public.ifb_guard_member_write() returns trigger
language plpgsql set search_path = public, auth as $$
declare v_owner uuid; v_me uuid;
begin
  if current_user not in ('authenticated', 'anon') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  v_me := public.ifb_my_profile_id();
  if tg_op = 'DELETE' then
    select created_by into v_owner from public.ifb_projects where id = old.project_id;
    if old.role = 'owner' then raise exception 'Project ownership cannot be removed'; end if;
    if old.role = 'admin' and v_me is distinct from v_owner then raise exception 'Only the project owner can remove an admin'; end if;
    return old;
  end if;
  select created_by into v_owner from public.ifb_projects where id = new.project_id;
  if new.role = 'owner' and new.user_id is distinct from v_owner then
    raise exception 'Only the original project owner can hold the owner role';
  end if;
  if new.role = 'admin' and v_me is distinct from v_owner then
    raise exception 'Only the project owner can grant admin role';
  end if;
  if tg_op = 'UPDATE' and old.role = 'owner' and
     (new.role <> old.role or new.user_id <> old.user_id or new.project_id <> old.project_id) then
    raise exception 'Project ownership cannot be changed through membership edits';
  end if;
  if tg_op = 'UPDATE' and old.role = 'admin' and v_me is distinct from v_owner then
    raise exception 'Only the project owner can edit an admin membership';
  end if;
  return new;
end; $$;
drop trigger if exists ifb_project_members_guard_write on public.ifb_project_members;
create trigger ifb_project_members_guard_write before insert or update or delete on public.ifb_project_members
for each row execute function public.ifb_guard_member_write();

create or replace function public.ifb_guard_invite_write() returns trigger
language plpgsql set search_path = public, auth as $$
declare v_owner uuid;
begin
  if current_user not in ('authenticated', 'anon') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  select created_by into v_owner from public.ifb_projects where id = new.project_id;
  if new.role = 'admin' and public.ifb_my_profile_id() is distinct from v_owner then
    raise exception 'Only the project owner can create admin invitations';
  end if;
  new.created_by := public.ifb_my_profile_id();
  if tg_op = 'UPDATE' then
    new.token := old.token;
    new.project_id := old.project_id;
    new.uses_count := old.uses_count;
    new.created_by := old.created_by;
  end if;
  return new;
end; $$;
drop trigger if exists ifb_project_invites_guard_write on public.ifb_project_invites;
create trigger ifb_project_invites_guard_write before insert or update or delete on public.ifb_project_invites
for each row execute function public.ifb_guard_invite_write();

-- 4. RPCs ----------------------------------------------------------------------
-- Open a link-only bug by its secret token (works logged out).
create or replace function public.ifb_get_shared_bug(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_bug public.ifb_bugs%rowtype; v_project jsonb; v_comments jsonb;
begin
  if p_token is null or length(p_token) < 32 then return null; end if;
  select * into v_bug from public.ifb_bugs where share_token = p_token;
  if not found then return null; end if;
  select jsonb_build_object('id', p.id, 'name', p.name, 'slug', p.slug, 'color', p.color)
    into v_project from public.ifb_projects p where p.id = v_bug.project_id;
  select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]'::jsonb) into v_comments
    from public.ifb_bug_comments c where c.bug_id = v_bug.id and not c.is_internal;
  return jsonb_build_object('bug', to_jsonb(v_bug) - 'share_token', 'project', v_project, 'comments', v_comments);
end; $$;

create or replace function public.ifb_add_shared_comment(p_token text, p_content text) returns public.ifb_bug_comments
language plpgsql security definer set search_path = public, auth as $$
declare v_bug uuid; v_row public.ifb_bug_comments%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_content is null or btrim(p_content) = '' or length(p_content) > 5000 then raise exception 'Invalid comment'; end if;
  select id into v_bug from public.ifb_bugs where share_token = p_token;
  if v_bug is null then raise exception 'Link not found'; end if;
  insert into public.ifb_bug_comments(bug_id, author_name, content) values (v_bug, 'x', btrim(p_content)) returning * into v_row;
  return v_row;
end; $$;

-- Create / rotate / revoke the secret link. Returns the token (or null when revoked).
create or replace function public.ifb_set_bug_link(p_bug uuid, p_enabled boolean, p_rotate boolean default false) returns text
language plpgsql security definer set search_path = public, auth as $$
declare v_bug public.ifb_bugs%rowtype; v_token text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_bug from public.ifb_bugs where id = p_bug for update;
  if not found then raise exception 'Bug not found'; end if;
  if not (v_bug.reported_by = public.ifb_my_profile_id() or public.ifb_can_triage(v_bug.project_id)) then
    raise exception 'Only the reporter or project team can change link access';
  end if;
  if not p_enabled then
    update public.ifb_bugs set share_token = null where id = p_bug;
    return null;
  end if;
  v_token := case when v_bug.share_token is not null and not p_rotate then v_bug.share_token
                  else replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') end;
  update public.ifb_bugs set share_token = v_token where id = p_bug;
  return v_token;
end; $$;

-- "Me too" / reproduced toggle, one vote per account.
create or replace function public.ifb_toggle_bug_upvote(target_bug_id uuid, user_id_str text, reproduced_flag boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_existing uuid; v_existing_reproduced boolean; v_upvotes integer; v_reproduced integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.ifb_bug_visible(target_bug_id) then raise exception 'Bug not found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_bug_id::text || ':' || auth.uid()::text, 0));
  select id, is_reproduced into v_existing, v_existing_reproduced
    from public.ifb_bug_upvotes where bug_id = target_bug_id and user_identifier = auth.uid()::text for update;
  if v_existing is not null then
    delete from public.ifb_bug_upvotes where id = v_existing;
    update public.ifb_bugs set upvotes_count = greatest(0, upvotes_count - 1),
      reproduced_count = case when v_existing_reproduced then greatest(0, reproduced_count - 1) else reproduced_count end
      where id = target_bug_id returning upvotes_count, reproduced_count into v_upvotes, v_reproduced;
    return jsonb_build_object('voted', false, 'upvotes', v_upvotes, 'reproduced', v_reproduced);
  end if;
  insert into public.ifb_bug_upvotes(bug_id, user_identifier, is_reproduced)
    values (target_bug_id, auth.uid()::text, reproduced_flag);
  update public.ifb_bugs set upvotes_count = upvotes_count + 1,
    reproduced_count = reproduced_count + case when reproduced_flag then 1 else 0 end
    where id = target_bug_id returning upvotes_count, reproduced_count into v_upvotes, v_reproduced;
  return jsonb_build_object('voted', true, 'upvotes', v_upvotes, 'reproduced', v_reproduced);
end; $$;

-- Status / criteria: team only.
create or replace function public.ifb_update_bug_status(target_bug_id uuid, new_status text)
returns public.ifb_bugs language plpgsql security definer set search_path = public, auth as $$
declare v_profile public.ifb_profiles%rowtype; v_bug public.ifb_bugs%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_profile from public.ifb_profiles where auth_user_id = auth.uid();
  select * into v_bug from public.ifb_bugs where id = target_bug_id for update;
  if not found then raise exception 'Bug not found'; end if;
  if not public.ifb_can_triage(v_bug.project_id) then raise exception 'Only the project team can change status'; end if;
  if v_bug.status = new_status then return v_bug; end if;
  update public.ifb_bugs set status = new_status, resolved_at = case when new_status = 'FIXED' then now() else null end
    where id = target_bug_id returning * into v_bug;
  insert into public.ifb_bug_audit_logs(bug_id, actor_name, action, details)
    values (target_bug_id, v_profile.full_name, 'STATUS_CHANGED', jsonb_build_object('new_status', new_status));
  return v_bug;
end; $$;

-- MCP writes use the same database-owned validation and audit transaction.
-- The caller must be the server's service-role client and must pass the profile
-- resolved from a verified, scoped MCP token. No browser role can invoke this.
create or replace function public.ifb_mcp_update_bug(
  p_bug_id uuid,
  p_actor_profile_id uuid,
  p_patch jsonb
) returns public.ifb_bugs
language plpgsql security definer set search_path = public, auth as $$
declare
  v_bug public.ifb_bugs%rowtype;
  v_actor public.ifb_profiles%rowtype;
  v_project public.ifb_projects%rowtype;
  v_member_role text;
  v_status text;
  v_old_status text;
  v_severity text;
  v_priority text;
  v_assignee uuid;
  v_fields text[];
begin
  if coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role',
    ''
  ) <> 'service_role' then
    raise exception 'Server authorization required';
  end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb then
    raise exception 'A non-empty object patch is required';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_patch) as supplied(key)
    where supplied.key not in ('status','severity','priority','assigned_to','dev_notes','title','summary')
  ) then
    raise exception 'Unsupported issue fields supplied';
  end if;

  select * into v_actor from public.ifb_profiles where id = p_actor_profile_id;
  if not found then raise exception 'Actor profile not found'; end if;
  select * into v_bug from public.ifb_bugs where id = p_bug_id for update;
  if not found then raise exception 'Issue not found'; end if;
  v_old_status := v_bug.status;
  select * into v_project from public.ifb_projects where id = v_bug.project_id;
  select role into v_member_role from public.ifb_project_members
    where project_id = v_bug.project_id and user_id = p_actor_profile_id;

  if coalesce(v_member_role, '') not in ('owner','admin','developer','qa_tester','team_lead','product_manager')
     and v_project.created_by is distinct from p_actor_profile_id
     and v_actor.role not in ('owner','admin') then
    raise exception 'Issue update permission denied';
  end if;

  if p_patch ? 'status' then
    v_status := p_patch->>'status';
    if v_status is null or v_status not in ('REPORTED','TRIAGED','IN_PROGRESS','READY_FOR_QA','VERIFIED','FIXED','CLOSED','WONT_FIX') then
      raise exception 'Invalid issue status';
    end if;
  end if;
  if p_patch ? 'severity' then
    v_severity := p_patch->>'severity';
    if v_severity is null or v_severity not in ('CRITICAL','HIGH','MEDIUM','LOW') then raise exception 'Invalid severity'; end if;
  end if;
  if p_patch ? 'priority' then
    v_priority := p_patch->>'priority';
    if v_priority is null or v_priority not in ('P0','P1','P2','P3') then raise exception 'Invalid priority'; end if;
  end if;
  if p_patch ? 'title' and (length(btrim(coalesce(p_patch->>'title',''))) not between 1 and 180) then
    raise exception 'Title must be 1-180 characters';
  end if;
  if p_patch ? 'summary' and length(coalesce(p_patch->>'summary','')) > 10000 then
    raise exception 'Summary is too long';
  end if;
  if p_patch ? 'dev_notes' and length(coalesce(p_patch->>'dev_notes','')) > 10000 then
    raise exception 'Developer notes are too long';
  end if;
  if p_patch ? 'assigned_to' then
    v_assignee := nullif(p_patch->>'assigned_to','')::uuid;
    if v_assignee is not null and not exists (
      select 1 from public.ifb_project_members
      where project_id = v_bug.project_id and user_id = v_assignee
    ) then
      raise exception 'Assignee must be a member of this repository';
    end if;
  end if;

  v_fields := array(select jsonb_object_keys(p_patch) order by 1);
  update public.ifb_bugs set
    status = case when p_patch ? 'status' then v_status else status end,
    severity = case when p_patch ? 'severity' then v_severity else severity end,
    priority = case when p_patch ? 'priority' then v_priority else priority end,
    assigned_to = case when p_patch ? 'assigned_to' then v_assignee else assigned_to end,
    dev_notes = case when p_patch ? 'dev_notes' then p_patch->>'dev_notes' else dev_notes end,
    title = case when p_patch ? 'title' then btrim(p_patch->>'title') else title end,
    summary = case when p_patch ? 'summary' then p_patch->>'summary' else summary end,
    resolved_at = case
      when p_patch ? 'status' and v_status = 'FIXED' then coalesce(resolved_at, now())
      when p_patch ? 'status' and v_status <> 'FIXED' then null
      else resolved_at
    end
  where id = p_bug_id returning * into v_bug;

  insert into public.ifb_bug_audit_logs(bug_id, actor_name, action, details)
  values (
    p_bug_id,
    v_actor.full_name,
    case when p_patch ? 'status' and v_old_status is distinct from v_bug.status then 'STATUS_CHANGED' else 'MCP_ISSUE_UPDATED' end,
    jsonb_build_object('fields', v_fields, 'source', 'mcp')
  );

  return v_bug;
end;
$$;

revoke all on function public.ifb_mcp_update_bug(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.ifb_mcp_update_bug(uuid, uuid, jsonb) to service_role;

-- Views and acceptance criteria are SECURITY DEFINER RPCs: enforce visibility and
-- team permissions here rather than relying on table RLS.
create or replace function public.ifb_increment_bug_views(target_bug_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.ifb_bug_visible(target_bug_id) then raise exception 'Bug not found'; end if;
  update public.ifb_bugs set views_count = views_count + 1 where id = target_bug_id;
end; $$;

create or replace function public.ifb_update_bug_criteria(target_bug_id uuid, new_criteria jsonb)
returns public.ifb_bugs language plpgsql security definer set search_path = public, auth as $$
declare v_profile public.ifb_profiles%rowtype; v_bug public.ifb_bugs%rowtype; v_all_checked boolean; v_old_status text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if new_criteria is null or jsonb_typeof(new_criteria) <> 'array' or jsonb_array_length(new_criteria) > 100 then
    raise exception 'Acceptance criteria must be an array with at most 100 items';
  end if;
  if exists (select 1 from jsonb_array_elements(new_criteria) item
             where jsonb_typeof(item) <> 'object'
                or jsonb_typeof(item->'text') <> 'string'
                or length(item->>'text') > 500
                or (item ? 'checked' and jsonb_typeof(item->'checked') <> 'boolean')) then
    raise exception 'Each acceptance criterion must contain text and an optional boolean checked field';
  end if;
  select * into v_bug from public.ifb_bugs where id = target_bug_id for update;
  if not found then raise exception 'Bug not found'; end if;
  if not public.ifb_can_triage(v_bug.project_id) then
    raise exception 'Only project team members can update acceptance criteria';
  end if;
  select * into v_profile from public.ifb_profiles where auth_user_id = auth.uid();
  if v_profile.id is null then raise exception 'Authenticated profile not found'; end if;
  v_old_status := v_bug.status;
  v_all_checked := jsonb_array_length(new_criteria) > 0
    and not exists (select 1 from jsonb_array_elements(new_criteria) as criteria(item) where coalesce(item->>'checked', 'false') <> 'true');
  update public.ifb_bugs
     set acceptance_criteria = new_criteria,
         status = case when v_all_checked and status not in ('FIXED','CLOSED','WONT_FIX') then 'READY_FOR_QA' else status end
   where id = target_bug_id returning * into v_bug;
  if v_bug.status is distinct from v_old_status then
    insert into public.ifb_bug_audit_logs(bug_id, actor_name, action, details)
    values (target_bug_id, v_profile.full_name, 'STATUS_CHANGED', jsonb_build_object('new_status', v_bug.status, 'source', 'acceptance_criteria'));
  end if;
  return v_bug;
end; $$;

-- Invites: preview (public) + accept (logged in).
create or replace function public.ifb_preview_invite(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('role', i.role, 'project', jsonb_build_object('id', p.id, 'name', p.name, 'slug', p.slug, 'description', p.description, 'color', p.color))
  from public.ifb_project_invites i join public.ifb_projects p on p.id = i.project_id
  where i.token = p_token and (i.expires_at is null or i.expires_at > now()) and i.uses_count < i.max_uses
$$;

create or replace function public.ifb_accept_invite(p_token text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare v_inv public.ifb_project_invites%rowtype; v_me uuid; v_slug text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  v_me := public.ifb_my_profile_id();
  select * into v_inv from public.ifb_project_invites where token = p_token for update;
  if not found or (v_inv.expires_at is not null and v_inv.expires_at <= now()) or v_inv.uses_count >= v_inv.max_uses then
    raise exception 'Invite is invalid or expired';
  end if;
  if not exists (select 1 from public.ifb_project_members where project_id = v_inv.project_id and user_id = v_me) then
    insert into public.ifb_project_members(project_id, user_id, role) values (v_inv.project_id, v_me, v_inv.role);
    update public.ifb_project_invites set uses_count = uses_count + 1 where id = v_inv.id;
  end if;
  select slug into v_slug from public.ifb_projects where id = v_inv.project_id;
  return v_slug;
end; $$;

-- 5. ROW LEVEL SECURITY ---------------------------------------------------------
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in (
      'ifb_profiles','ifb_projects','ifb_project_members','ifb_project_invites',
      'ifb_bugs','ifb_bug_comments','ifb_bug_audit_logs','ifb_bug_upvotes')
  loop execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename); end loop;
end $$;

create policy profiles_read   on public.ifb_profiles for select to anon, authenticated using (true);
create policy profiles_update on public.ifb_profiles for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create policy projects_read on public.ifb_projects for select to anon, authenticated using (is_public or public.ifb_is_member(id));
create policy projects_insert on public.ifb_projects for insert to authenticated with check (auth.uid() is not null);
create policy projects_update on public.ifb_projects for update to authenticated using (public.ifb_is_project_admin(id)) with check (public.ifb_is_project_admin(id));
create policy projects_delete on public.ifb_projects for delete to authenticated using (public.ifb_is_project_admin(id));

create policy members_read on public.ifb_project_members for select to anon, authenticated using (exists (select 1 from public.ifb_projects p where p.id = project_id and p.is_public) or public.ifb_is_member(project_id));
create policy members_write  on public.ifb_project_members for all to authenticated using (public.ifb_is_project_admin(project_id)) with check (public.ifb_is_project_admin(project_id));
create policy members_leave  on public.ifb_project_members for delete to authenticated using (user_id = public.ifb_my_profile_id() and role <> 'owner');

create policy invites_read on public.ifb_project_invites for select to authenticated
  using (public.ifb_is_project_admin(project_id));
create policy invites_insert on public.ifb_project_invites for insert to authenticated
  with check (public.ifb_is_project_admin(project_id));
create policy invites_delete on public.ifb_project_invites for delete to authenticated
  using (public.ifb_is_project_admin(project_id));

create policy bugs_read   on public.ifb_bugs for select to anon, authenticated
  using ((share_token is null and not is_sensitive and exists (select 1 from public.ifb_projects p where p.id = project_id and p.is_public)) or reported_by = public.ifb_my_profile_id() or public.ifb_is_member(project_id));
create policy bugs_insert on public.ifb_bugs for insert to authenticated
  with check (auth.uid() is not null and (public.ifb_is_member(project_id) or exists (
    select 1 from public.ifb_projects p where p.id = project_id and p.is_public and p.allow_guest_reports)));
create policy bugs_update on public.ifb_bugs for update to authenticated
  using (reported_by = public.ifb_my_profile_id() or public.ifb_can_triage(project_id))
  with check (reported_by = public.ifb_my_profile_id() or public.ifb_can_triage(project_id));
create policy bugs_delete on public.ifb_bugs for delete to authenticated
  using (public.ifb_is_project_admin(project_id) or reported_by = public.ifb_my_profile_id());

create policy comments_read   on public.ifb_bug_comments for select to anon, authenticated
  using (public.ifb_bug_visible(bug_id) and (not is_internal or public.ifb_can_triage(public.ifb_bug_project(bug_id))));
create policy comments_insert on public.ifb_bug_comments for insert to authenticated
  with check (auth.uid() is not null and public.ifb_bug_visible(bug_id)
              and (not is_internal or public.ifb_can_triage(public.ifb_bug_project(bug_id))));
-- Comment editing is intentionally disabled until a dedicated, audited edit flow exists.
create policy comments_delete on public.ifb_bug_comments for delete to authenticated
  using (author_id = public.ifb_my_profile_id() or public.ifb_can_triage(public.ifb_bug_project(bug_id)));

create policy audit_read   on public.ifb_bug_audit_logs for select to anon, authenticated using (public.ifb_bug_visible(bug_id));
create policy upvotes_read on public.ifb_bug_upvotes    for select to authenticated using (user_identifier = auth.uid()::text);

-- 6. GRANTS -----------------------------------------------------------------------
revoke all on public.ifb_profiles, public.ifb_projects, public.ifb_project_members, public.ifb_project_invites,
  public.ifb_bugs, public.ifb_bug_comments, public.ifb_bug_audit_logs, public.ifb_bug_upvotes from anon, authenticated;
grant select (id, username, full_name, avatar_url, role, reputation_score, created_at) on public.ifb_profiles to anon;
grant select (id, username, full_name, avatar_url) on public.ifb_profiles to authenticated;
grant update (full_name, avatar_url) on public.ifb_profiles to authenticated;
grant select on public.ifb_projects, public.ifb_project_members, public.ifb_bugs, public.ifb_bug_comments, public.ifb_bug_audit_logs to anon, authenticated;
grant insert, update, delete on public.ifb_projects, public.ifb_project_members, public.ifb_bugs to authenticated;
grant select, insert, delete on public.ifb_project_invites to authenticated;
grant insert, delete on public.ifb_bug_comments to authenticated;
grant select on public.ifb_bug_upvotes to authenticated;

revoke execute on function public.ifb_get_shared_bug(text), public.ifb_preview_invite(text) from public;
grant  execute on function public.ifb_get_shared_bug(text), public.ifb_preview_invite(text) to anon, authenticated;
revoke execute on function public.ifb_add_shared_comment(text, text), public.ifb_set_bug_link(uuid, boolean, boolean),
  public.ifb_accept_invite(text), public.ifb_toggle_bug_upvote(uuid, text, boolean), public.ifb_update_bug_status(uuid, text),
  public.ifb_update_bug_criteria(uuid, jsonb), public.ifb_increment_bug_views(uuid) from public, anon;
grant execute on function public.ifb_mark_notification_read(uuid) to authenticated;
grant  execute on function public.ifb_add_shared_comment(text, text), public.ifb_set_bug_link(uuid, boolean, boolean),
  public.ifb_accept_invite(text), public.ifb_toggle_bug_upvote(uuid, text, boolean), public.ifb_update_bug_status(uuid, text),
  public.ifb_update_bug_criteria(uuid, jsonb), public.ifb_increment_bug_views(uuid) to authenticated;
grant  execute on function public.ifb_my_profile_id(), public.ifb_is_member(uuid), public.ifb_can_triage(uuid),
  public.ifb_is_project_admin(uuid), public.ifb_bug_project(uuid), public.ifb_bug_visible(uuid) to anon, authenticated;
revoke all on function public.ifb_guard_bug_write(), public.ifb_rate_limit(), public.ifb_guard_project_update(),
  public.ifb_guard_member_write(), public.ifb_guard_invite_write() from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;

-- Verify after running (as anon / logged out these must work):
--   select count(*) from ifb_bugs;                       -- only listed bugs
--   select ifb_get_shared_bug('<token>');                -- link-only bug
-- and these must FAIL for a normal logged-in non-member:
--   update ifb_bugs set status='CLOSED' where code='...'; -- status silently unchanged
