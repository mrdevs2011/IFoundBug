-- ============================================================================
-- IFOUNDBUG — SINGLE UNIVERSAL DATABASE SETUP
-- Supabase / PostgreSQL | Idempotent | Safe to re-run | No existing app rows dropped
-- Run this ONE file in Supabase SQL Editor.
--
-- AUTH REQUIREMENT (not configurable through SQL):
-- Supabase Dashboard -> Authentication -> Providers -> Email -> turn OFF
-- "Confirm email". IFoundBug uses username@ ifoundbug.dev as an internal
-- Supabase identity; users do not receive email at that synthetic address.
-- Keep password minimum length enabled (8+ recommended).
-- ============================================================================

begin;

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- 1. CORE TABLES --------------------------------------------------------------
create table if not exists public.ifb_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  username text not null,
  full_name text not null,
  avatar_url text,
  role text not null default 'developer',
  reputation_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ifb_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  icon text not null default 'bug',
  color text not null default '#10b981',
  is_public boolean not null default true,
  allow_guest_reports boolean not null default false,
  tech_stack text[] not null default array['Next.js','TypeScript','Supabase'],
  telegram_webhook_enabled boolean not null default false,
  telegram_bot_token text,
  telegram_chat_id text,
  github_repo_url text,
  created_by uuid references public.ifb_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ifb_project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ifb_projects(id) on delete cascade,
  user_id uuid not null references public.ifb_profiles(id) on delete cascade,
  role text not null default 'developer',
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table if not exists public.ifb_project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ifb_projects(id) on delete cascade,
  token text not null unique,
  role text not null default 'developer',
  max_uses integer not null default 100 check (max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  expires_at timestamptz,
  created_by uuid references public.ifb_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ifb_bugs (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  project_id uuid not null references public.ifb_projects(id) on delete cascade,
  title text not null,
  summary text,
  section text not null default 'General',
  screen text,
  severity text not null default 'MEDIUM',
  priority text not null default 'P2',
  status text not null default 'REPORTED',
  environment text not null default 'PRODUCTION',
  actual_behavior text not null default '',
  expected_behavior text not null default '',
  steps_to_reproduce jsonb not null default '[]'::jsonb,
  acceptance_criteria jsonb not null default '[]'::jsonb,
  device_telemetry jsonb not null default '{}'::jsonb,
  dev_notes text,
  search_keys text[] not null default '{}',
  evidence_urls text[] not null default '{}',
  is_sensitive boolean not null default false,
  upvotes_count integer not null default 0,
  reproduced_count integer not null default 0,
  views_count integer not null default 0,
  assigned_to uuid references public.ifb_profiles(id) on delete set null,
  reported_by uuid references public.ifb_profiles(id) on delete set null,
  reporter_name text not null default 'Bug Hunter',
  claude_code_prompt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(project_id, code)
);

create table if not exists public.ifb_bug_comments (
  id uuid primary key default gen_random_uuid(),
  bug_id uuid not null references public.ifb_bugs(id) on delete cascade,
  author_id uuid references public.ifb_profiles(id) on delete set null,
  author_name text not null,
  author_avatar text,
  content text not null,
  is_internal boolean not null default false,
  reactions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ifb_bug_audit_logs (
  id uuid primary key default gen_random_uuid(),
  bug_id uuid not null references public.ifb_bugs(id) on delete cascade,
  actor_name text not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ifb_bug_upvotes (
  id uuid primary key default gen_random_uuid(),
  bug_id uuid not null references public.ifb_bugs(id) on delete cascade,
  user_identifier text not null,
  is_reproduced boolean not null default false,
  created_at timestamptz not null default now(),
  unique(bug_id, user_identifier)
);

-- Persistent, per-user notifications. No browser/localStorage notification data.
create table if not exists public.ifb_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.ifb_profiles(id) on delete cascade,
  project_id uuid not null references public.ifb_projects(id) on delete cascade,
  bug_id uuid references public.ifb_bugs(id) on delete cascade,
  bug_code text,
  title text not null,
  message text not null,
  type text not null check (type in ('status_change','new_comment','new_bug','mention')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Add columns that may be missing on installations created by older revisions.
alter table public.ifb_profiles add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;
alter table public.ifb_profiles add column if not exists avatar_url text;
alter table public.ifb_profiles add column if not exists reputation_score integer not null default 0;
alter table public.ifb_profiles add column if not exists updated_at timestamptz not null default now();
alter table public.ifb_projects add column if not exists telegram_webhook_enabled boolean not null default false;
alter table public.ifb_projects add column if not exists telegram_bot_token text;
alter table public.ifb_projects add column if not exists telegram_chat_id text;
alter table public.ifb_projects add column if not exists github_repo_url text;
alter table public.ifb_projects add column if not exists created_by uuid references public.ifb_profiles(id) on delete set null;
alter table public.ifb_bugs add column if not exists screen text;
alter table public.ifb_bugs add column if not exists acceptance_criteria jsonb not null default '[]'::jsonb;
alter table public.ifb_bugs add column if not exists device_telemetry jsonb not null default '{}'::jsonb;
alter table public.ifb_bugs add column if not exists dev_notes text;
alter table public.ifb_bugs add column if not exists search_keys text[] not null default '{}';
alter table public.ifb_bugs add column if not exists evidence_urls text[] not null default '{}';
alter table public.ifb_bugs add column if not exists is_sensitive boolean not null default false;
alter table public.ifb_bugs add column if not exists upvotes_count integer not null default 0;
alter table public.ifb_bugs add column if not exists reproduced_count integer not null default 0;
alter table public.ifb_bugs add column if not exists views_count integer not null default 0;
alter table public.ifb_bugs add column if not exists assigned_to uuid references public.ifb_profiles(id) on delete set null;
alter table public.ifb_bugs add column if not exists reported_by uuid references public.ifb_profiles(id) on delete set null;
alter table public.ifb_bugs add column if not exists reporter_name text not null default 'Bug Hunter';
alter table public.ifb_bugs add column if not exists claude_code_prompt text;
alter table public.ifb_bugs add column if not exists resolved_at timestamptz;
alter table public.ifb_bug_comments add column if not exists author_avatar text;
alter table public.ifb_bug_comments add column if not exists is_internal boolean not null default false;
alter table public.ifb_bug_comments add column if not exists reactions jsonb not null default '{}'::jsonb;
alter table public.ifb_bug_audit_logs add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.ifb_bug_upvotes add column if not exists is_reproduced boolean not null default false;

-- Normalize role/status constraints across old and new deployments.
alter table public.ifb_profiles drop constraint if exists ifb_profiles_role_check;
alter table public.ifb_profiles add constraint ifb_profiles_role_check
  check (role in ('owner','admin','developer','qa_tester','hunter','viewer','team_lead','product_manager'));
alter table public.ifb_project_members drop constraint if exists ifb_project_members_role_check;
alter table public.ifb_project_members add constraint ifb_project_members_role_check
  check (role in ('owner','admin','developer','qa_tester','hunter','viewer','team_lead','product_manager'));
alter table public.ifb_project_invites drop constraint if exists ifb_project_invites_role_check;
alter table public.ifb_project_invites add constraint ifb_project_invites_role_check
  check (role in ('admin','developer','qa_tester','hunter','viewer','team_lead','product_manager'));
alter table public.ifb_bugs drop constraint if exists ifb_bugs_severity_check;
alter table public.ifb_bugs add constraint ifb_bugs_severity_check check (severity in ('CRITICAL','HIGH','MEDIUM','LOW'));
alter table public.ifb_bugs drop constraint if exists ifb_bugs_priority_check;
alter table public.ifb_bugs add constraint ifb_bugs_priority_check check (priority in ('P0','P1','P2','P3'));
alter table public.ifb_bugs drop constraint if exists ifb_bugs_status_check;
alter table public.ifb_bugs add constraint ifb_bugs_status_check check (status in ('REPORTED','TRIAGED','IN_PROGRESS','READY_FOR_QA','VERIFIED','FIXED','CLOSED','WONT_FIX'));
alter table public.ifb_bugs drop constraint if exists ifb_bugs_environment_check;
alter table public.ifb_bugs add constraint ifb_bugs_environment_check check (environment in ('PRODUCTION','STAGING','DEVELOPMENT','LOCAL'));

-- 2. INDEXES ------------------------------------------------------------------
create unique index if not exists ifb_profiles_auth_user_id_uidx on public.ifb_profiles(auth_user_id) where auth_user_id is not null;
create unique index if not exists ifb_profiles_username_lower_uidx on public.ifb_profiles(lower(username));
create unique index if not exists ifb_projects_slug_uidx on public.ifb_projects(slug);
create index if not exists ifb_project_members_user_idx on public.ifb_project_members(user_id);
create index if not exists ifb_bugs_project_created_idx on public.ifb_bugs(project_id, created_at desc);
create index if not exists ifb_bugs_status_idx on public.ifb_bugs(status);
create index if not exists ifb_bugs_severity_idx on public.ifb_bugs(severity);
create index if not exists ifb_comments_bug_created_idx on public.ifb_bug_comments(bug_id, created_at);
create index if not exists ifb_audit_bug_created_idx on public.ifb_bug_audit_logs(bug_id, created_at desc);
create index if not exists ifb_notifications_recipient_created_idx on public.ifb_notifications(recipient_id, created_at desc);

-- 3. AUTH PROFILE AUTOMATION ---------------------------------------------------
create or replace function public.ifb_handle_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.ifb_handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare
  v_username text;
  v_full_name text;
  v_role text;
begin
  v_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))));
  v_full_name := nullif(trim(new.raw_user_meta_data->>'full_name'), '');
  v_role := coalesce(new.raw_user_meta_data->>'role', 'developer');

  if v_username is null or v_username !~ '^[a-z0-9_.-]{3,32}$' then
    raise exception 'Username must be 3-32 characters: a-z, 0-9, dot, underscore or hyphen';
  end if;
  if v_role not in ('developer','qa_tester','team_lead','product_manager') then
    v_role := 'developer';
  end if;

  insert into public.ifb_profiles(auth_user_id, username, full_name, role)
  values (new.id, v_username, coalesce(v_full_name, v_username), v_role)
  on conflict (auth_user_id) where auth_user_id is not null
  do update set username = excluded.username, full_name = excluded.full_name, role = excluded.role, updated_at = now();
  return new;
end;
$$;

drop trigger if exists ifb_auth_user_created on auth.users;
create trigger ifb_auth_user_created after insert on auth.users
for each row execute function public.ifb_handle_new_auth_user();

-- 4. PROJECT OWNER + MEMBERSHIP AUTOMATION -----------------------------------
create or replace function public.ifb_set_project_owner()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_profile_id uuid;
begin
  if auth.uid() is not null then
    select id into v_profile_id from public.ifb_profiles where auth_user_id = auth.uid();
    if v_profile_id is null then raise exception 'Authenticated profile not found'; end if;
    -- Do not allow clients to assign project ownership to another profile.
    new.created_by := v_profile_id;
  end if;
  return new;
end;
$$;

drop trigger if exists ifb_project_owner_before_insert on public.ifb_projects;
create trigger ifb_project_owner_before_insert before insert on public.ifb_projects
for each row execute function public.ifb_set_project_owner();

create or replace function public.ifb_add_project_owner_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into public.ifb_project_members(project_id, user_id, role)
    values (new.id, new.created_by, 'owner') on conflict (project_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists ifb_project_owner_member_after_insert on public.ifb_projects;
create trigger ifb_project_owner_member_after_insert after insert on public.ifb_projects
for each row execute function public.ifb_add_project_owner_member();

-- 5. BUG COUNTERS + RPCS -------------------------------------------------------
create or replace function public.ifb_increment_bug_views(target_bug_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.ifb_bugs set views_count = views_count + 1 where id = target_bug_id;
  if not found then raise exception 'Bug not found'; end if;
end;
$$;

create or replace function public.ifb_toggle_bug_upvote(target_bug_id uuid, user_id_str text, reproduced_flag boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_existing uuid; v_existing_reproduced boolean; v_upvotes integer; v_reproduced integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  -- Serialize a user's toggle for this bug and never trust a client-supplied user id.
  perform pg_advisory_xact_lock(hashtextextended(target_bug_id::text || ':' || auth.uid()::text, 0));
  select id, is_reproduced into v_existing, v_existing_reproduced
    from public.ifb_bug_upvotes
    where bug_id = target_bug_id and user_identifier = auth.uid()::text
    for update;
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
end;
$$;

-- Project slug is generated server-side from the name and a collision-resistant suffix.
create or replace function public.ifb_prepare_project_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := coalesce(nullif(trim(both '-' from lower(regexp_replace(coalesce(new.name, 'project'), '[^a-zA-Z0-9]+', '-', 'g'))), ''), 'project')
      || '-' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  end if;
  return new;
end;
$$;
drop trigger if exists ifb_projects_prepare_insert on public.ifb_projects;
create trigger ifb_projects_prepare_insert before insert on public.ifb_projects
for each row execute function public.ifb_prepare_project_insert();

-- Generate bug code and author identity in PostgreSQL, never in browser code.
create or replace function public.ifb_prepare_bug_insert()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_profile public.ifb_profiles%rowtype;
begin
  select * into v_profile from public.ifb_profiles where auth_user_id = auth.uid();
  if auth.uid() is not null and v_profile.id is null then raise exception 'Authenticated profile not found'; end if;
  if new.code is null or btrim(new.code) = '' then
    new.code := 'B' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  end if;
  if v_profile.id is not null then
    new.reported_by := v_profile.id;
    new.reporter_name := v_profile.full_name;
  end if;
  return new;
end;
$$;
drop trigger if exists ifb_bugs_prepare_insert on public.ifb_bugs;
create trigger ifb_bugs_prepare_insert before insert on public.ifb_bugs
for each row execute function public.ifb_prepare_bug_insert();

create or replace function public.ifb_prepare_comment_insert()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_profile public.ifb_profiles%rowtype;
begin
  select * into v_profile from public.ifb_profiles where auth_user_id = auth.uid();
  if auth.uid() is not null and v_profile.id is null then raise exception 'Authenticated profile not found'; end if;
  if v_profile.id is not null then
    new.author_id := v_profile.id;
    new.author_name := v_profile.full_name;
    new.author_avatar := v_profile.avatar_url;
  end if;
  return new;
end;
$$;
drop trigger if exists ifb_comments_prepare_insert on public.ifb_bug_comments;
create trigger ifb_comments_prepare_insert before insert on public.ifb_bug_comments
for each row execute function public.ifb_prepare_comment_insert();

create or replace function public.ifb_notify_bug_event()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_actor uuid; v_type text; v_message text;
begin
  select id into v_actor from public.ifb_profiles where auth_user_id = auth.uid();
  if tg_op = 'INSERT' then
    v_type := 'new_bug'; v_message := 'Yangi bug qo‘shildi';
  elsif new.status is distinct from old.status then
    v_type := 'status_change'; v_message := 'Bug holati: ' || new.status;
  else
    return new;
  end if;
  insert into public.ifb_notifications(recipient_id, project_id, bug_id, bug_code, title, message, type)
  select pm.user_id, new.project_id, new.id, new.code, new.title, v_message, v_type
  from public.ifb_project_members pm
  where pm.project_id = new.project_id and (v_actor is null or pm.user_id <> v_actor);
  return new;
end;
$$;
drop trigger if exists ifb_bugs_notify_after_change on public.ifb_bugs;
drop trigger if exists ifb_bugs_notify_after_insert on public.ifb_bugs;
create trigger ifb_bugs_notify_after_insert after insert on public.ifb_bugs
for each row execute function public.ifb_notify_bug_event();
drop trigger if exists ifb_bugs_notify_after_status_update on public.ifb_bugs;
create trigger ifb_bugs_notify_after_status_update after update of status on public.ifb_bugs
for each row execute function public.ifb_notify_bug_event();

create or replace function public.ifb_notify_comment()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_project_id uuid; v_code text; v_title text;
begin
  select project_id, code, title into v_project_id, v_code, v_title from public.ifb_bugs where id = new.bug_id;
  insert into public.ifb_notifications(recipient_id, project_id, bug_id, bug_code, title, message, type)
  select pm.user_id, v_project_id, new.bug_id, v_code, v_title, 'Yangi izoh qo‘shildi', 'new_comment'
  from public.ifb_project_members pm
  where pm.project_id = v_project_id and pm.user_id is distinct from new.author_id;
  return new;
end;
$$;
drop trigger if exists ifb_comments_notify_after_insert on public.ifb_bug_comments;
create trigger ifb_comments_notify_after_insert after insert on public.ifb_bug_comments
for each row execute function public.ifb_notify_comment();

-- Atomic status update + audit trail; actor and timestamps are database-owned.
create or replace function public.ifb_update_bug_status(target_bug_id uuid, new_status text)
returns public.ifb_bugs language plpgsql security definer set search_path = public, auth as $$
declare v_profile public.ifb_profiles%rowtype; v_bug public.ifb_bugs%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_profile from public.ifb_profiles where auth_user_id = auth.uid();
  if v_profile.id is null then raise exception 'Authenticated profile not found'; end if;
  select * into v_bug from public.ifb_bugs where id = target_bug_id for update;
  if not found then raise exception 'Bug not found'; end if;
  if v_bug.status = new_status then return v_bug; end if;
  update public.ifb_bugs
    set status = new_status,
        resolved_at = case when new_status = 'FIXED' then now() else null end
    where id = target_bug_id
    returning * into v_bug;
  insert into public.ifb_bug_audit_logs(bug_id, actor_name, action, details)
    values (target_bug_id, v_profile.full_name, 'STATUS_CHANGED', jsonb_build_object('new_status', new_status));
  return v_bug;
end;
$$;

create or replace function public.ifb_update_bug_criteria(target_bug_id uuid, new_criteria jsonb)
returns public.ifb_bugs language plpgsql security definer set search_path = public, auth as $$
declare v_profile public.ifb_profiles%rowtype; v_bug public.ifb_bugs%rowtype; v_old_status text; v_all_checked boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_profile from public.ifb_profiles where auth_user_id = auth.uid();
  if v_profile.id is null then raise exception 'Authenticated profile not found'; end if;
  select * into v_bug from public.ifb_bugs where id = target_bug_id for update;
  if not found then raise exception 'Bug not found'; end if;
  v_old_status := v_bug.status;
  if jsonb_typeof(new_criteria) <> 'array' then raise exception 'Acceptance criteria must be a JSON array'; end if;
  v_all_checked := jsonb_array_length(new_criteria) > 0
    and not exists (select 1 from jsonb_array_elements(new_criteria) as criteria_item(item) where coalesce(criteria_item.item->>'checked', 'false') <> 'true');
  update public.ifb_bugs
    set acceptance_criteria = new_criteria,
        status = case when v_all_checked and status <> 'FIXED' then 'READY_FOR_QA' else status end
    where id = target_bug_id returning * into v_bug;
  if v_bug.status is distinct from v_old_status then
    insert into public.ifb_bug_audit_logs(bug_id, actor_name, action, details)
      values (target_bug_id, v_profile.full_name, 'STATUS_CHANGED', jsonb_build_object('new_status', v_bug.status, 'source', 'acceptance_criteria'));
  end if;
  return v_bug;
end;
$$;

create or replace function public.ifb_mark_notification_read(target_notification_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_profile_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select id into v_profile_id from public.ifb_profiles where auth_user_id = auth.uid();
  update public.ifb_notifications set read_at = now()
    where id = target_notification_id and recipient_id = v_profile_id;
  if not found then raise exception 'Notification not found or access denied'; end if;
end;
$$;

-- 6. UPDATED_AT TRIGGERS -------------------------------------------------------
drop trigger if exists ifb_profiles_updated_at on public.ifb_profiles;
create trigger ifb_profiles_updated_at before update on public.ifb_profiles for each row execute function public.ifb_handle_updated_at();
drop trigger if exists ifb_projects_updated_at on public.ifb_projects;
create trigger ifb_projects_updated_at before update on public.ifb_projects for each row execute function public.ifb_handle_updated_at();
drop trigger if exists ifb_bugs_updated_at on public.ifb_bugs;
create trigger ifb_bugs_updated_at before update on public.ifb_bugs for each row execute function public.ifb_handle_updated_at();
drop trigger if exists ifb_comments_updated_at on public.ifb_bug_comments;
create trigger ifb_comments_updated_at before update on public.ifb_bug_comments for each row execute function public.ifb_handle_updated_at();

-- 7. ROW LEVEL SECURITY — NO ANONYMOUS APP DATA ACCESS ------------------------
alter table public.ifb_profiles enable row level security;
alter table public.ifb_projects enable row level security;
alter table public.ifb_project_members enable row level security;
alter table public.ifb_project_invites enable row level security;
alter table public.ifb_bugs enable row level security;
alter table public.ifb_bug_comments enable row level security;
alter table public.ifb_bug_audit_logs enable row level security;
alter table public.ifb_bug_upvotes enable row level security;
alter table public.ifb_notifications enable row level security;
alter table public.ifb_notifications replica identity full;

do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in (
      'ifb_profiles','ifb_projects','ifb_project_members','ifb_project_invites',
      'ifb_bugs','ifb_bug_comments','ifb_bug_audit_logs','ifb_bug_upvotes','ifb_notifications'
    )
  loop execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename); end loop;
end $$;

-- Shared-workspace model: authenticated collaborators can work together.
-- Anonymous users cannot query or mutate application tables.
create policy ifb_profiles_authenticated_all on public.ifb_profiles for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy ifb_projects_authenticated_all on public.ifb_projects for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy ifb_project_members_authenticated_all on public.ifb_project_members for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy ifb_project_invites_authenticated_all on public.ifb_project_invites for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy ifb_bugs_authenticated_all on public.ifb_bugs for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy ifb_bug_comments_authenticated_all on public.ifb_bug_comments for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy ifb_bug_audit_logs_authenticated_all on public.ifb_bug_audit_logs for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy ifb_bug_upvotes_authenticated_all on public.ifb_bug_upvotes for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
create policy ifb_notifications_read_own on public.ifb_notifications for select to authenticated
  using (recipient_id = (select id from public.ifb_profiles where auth_user_id = auth.uid()));
create policy ifb_notifications_delete_own on public.ifb_notifications for delete to authenticated
  using (recipient_id = (select id from public.ifb_profiles where auth_user_id = auth.uid()));

-- 8. STORAGE ------------------------------------------------------------------
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('bug-attachments', 'bug-attachments', true, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists ifb_public_read_bug_attachments on storage.objects;
drop policy if exists ifb_authenticated_upload_bug_attachments on storage.objects;
drop policy if exists ifb_authenticated_delete_bug_attachments on storage.objects;
drop policy if exists "Public can view bug attachments" on storage.objects;
drop policy if exists "Anyone can upload bug attachments" on storage.objects;
drop policy if exists "Anyone can delete their attachments" on storage.objects;
drop policy if exists "Authenticated users can upload bug attachments" on storage.objects;
drop policy if exists "Authenticated users can delete bug attachments" on storage.objects;
create policy ifb_public_read_bug_attachments on storage.objects for select to anon, authenticated
  using (bucket_id = 'bug-attachments');
create policy ifb_authenticated_upload_bug_attachments on storage.objects for insert to authenticated
  with check (bucket_id = 'bug-attachments' and owner_id = auth.uid()::text);
create policy ifb_authenticated_delete_bug_attachments on storage.objects for delete to authenticated
  using (bucket_id = 'bug-attachments' and owner_id = auth.uid()::text);

-- 9. REALTIME -----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ifb_bugs') then
    alter publication supabase_realtime add table public.ifb_bugs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ifb_bug_comments') then
    alter publication supabase_realtime add table public.ifb_bug_comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ifb_bug_audit_logs') then
    alter publication supabase_realtime add table public.ifb_bug_audit_logs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ifb_notifications') then
    alter publication supabase_realtime add table public.ifb_notifications;
  end if;
end $$;

-- 10. API PERMISSIONS + SCHEMA CACHE ------------------------------------------
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.ifb_profiles, public.ifb_projects,
  public.ifb_project_members, public.ifb_project_invites, public.ifb_bugs,
  public.ifb_bug_comments, public.ifb_bug_audit_logs, public.ifb_bug_upvotes to authenticated;
grant select, delete on public.ifb_notifications to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.ifb_increment_bug_views(uuid) to authenticated;
grant execute on function public.ifb_toggle_bug_upvote(uuid, text, boolean) to authenticated;
grant execute on function public.ifb_update_bug_status(uuid, text) to authenticated;
grant execute on function public.ifb_update_bug_criteria(uuid, jsonb) to authenticated;
grant execute on function public.ifb_mark_notification_read(uuid) to authenticated;
revoke all on public.ifb_profiles, public.ifb_projects, public.ifb_project_members,
  public.ifb_project_invites, public.ifb_bugs, public.ifb_bug_comments,
  public.ifb_bug_audit_logs, public.ifb_bug_upvotes, public.ifb_notifications from anon;
revoke execute on function public.ifb_increment_bug_views(uuid) from public, anon;
revoke execute on function public.ifb_toggle_bug_upvote(uuid, text, boolean) from public, anon;
revoke execute on function public.ifb_update_bug_status(uuid, text) from public, anon;
revoke execute on function public.ifb_update_bug_criteria(uuid, jsonb) from public, anon;
revoke execute on function public.ifb_mark_notification_read(uuid) from public, anon;
revoke all on function public.ifb_handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.ifb_handle_updated_at() from public, anon, authenticated;
revoke all on function public.ifb_set_project_owner() from public, anon, authenticated;
revoke all on function public.ifb_add_project_owner_member() from public, anon, authenticated;
revoke all on function public.ifb_prepare_project_insert() from public, anon, authenticated;
revoke all on function public.ifb_prepare_bug_insert() from public, anon, authenticated;
revoke all on function public.ifb_prepare_comment_insert() from public, anon, authenticated;
revoke all on function public.ifb_notify_bug_event() from public, anon, authenticated;
revoke all on function public.ifb_notify_comment() from public, anon, authenticated;

notify pgrst, 'reload schema';
notify pgrst, 'reload config';

commit;

-- Quick verification after execution:
-- select tablename, rowsecurity from pg_tables where schemaname='public' and tablename like 'ifb_%' order by tablename;
-- select policyname, tablename, roles, cmd from pg_policies where schemaname='public' and tablename like 'ifb_%';
