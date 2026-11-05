-- FOUNDBUG CANONICAL DATABASE SNAPSHOT
-- Generated from the ordered incremental SQL files listed below.
-- Fresh install only: do not run this together with the individual scripts.
-- Existing production data is preserved; review V2 visibility/data updates before applying.

-- ===== Base schema: sql/IFOUNDBUG_UNIVERSAL.sql =====
-- ============================================================================
-- IFOUNDBUG — SINGLE UNIVERSAL DATABASE SETUP
-- Supabase / PostgreSQL | Idempotent | Safe to re-run | No existing app rows dropped
-- Run this base schema first, then REQUIRED sql/V2_PUBLIC_MODEL.sql before production.
-- Re-running this base file never installs permissive authenticated policies or grants.
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

-- Reset every application policy so re-running this base file after V2 is
-- genuinely fail-closed until the reviewed role-aware V2 policies are restored.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'ifb_profiles','ifb_projects','ifb_project_members','ifb_project_invites',
        'ifb_bugs','ifb_bug_comments','ifb_bug_audit_logs','ifb_bug_upvotes','ifb_notifications'
      ])
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- Notification access is account-scoped and safe to retain in the base schema.
create policy ifb_notifications_read_own on public.ifb_notifications for select to authenticated
  using (recipient_id = (select id from public.ifb_profiles where auth_user_id = auth.uid()));
create policy ifb_notifications_delete_own on public.ifb_notifications for delete to authenticated
  using (recipient_id = (select id from public.ifb_profiles where auth_user_id = auth.uid()));

-- 8. STORAGE ------------------------------------------------------------------
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('bug-attachments', 'bug-attachments', false, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists ifb_public_read_bug_attachments on storage.objects;
drop policy if exists ifb_authenticated_read_bug_attachments on storage.objects;
drop policy if exists ifb_authenticated_upload_bug_attachments on storage.objects;
drop policy if exists ifb_authenticated_delete_bug_attachments on storage.objects;
drop policy if exists "Public can view bug attachments" on storage.objects;
drop policy if exists "Anyone can upload bug attachments" on storage.objects;
drop policy if exists "Anyone can delete their attachments" on storage.objects;
drop policy if exists "Authenticated users can upload bug attachments" on storage.objects;
drop policy if exists "Authenticated users can delete bug attachments" on storage.objects;
-- Downloads are served through /api/attachments after issue-level RLS or secret-link validation.
-- Never grant direct public reads on this bucket.
create policy ifb_authenticated_upload_bug_attachments on storage.objects for insert to authenticated
  with check (bucket_id = 'bug-attachments' and owner_id = auth.uid()::text);
create policy ifb_authenticated_delete_bug_attachments on storage.objects for delete to authenticated
  using (bucket_id = 'bug-attachments' and owner_id = auth.uid()::text);

-- 9. REALTIME -----------------------------------------------------------------
-- Publish every user-visible workspace entity so dashboards, boards, comments,
-- profiles and team changes stay synchronized across sessions/devices.
alter table public.ifb_profiles replica identity full;
alter table public.ifb_projects replica identity full;
alter table public.ifb_project_members replica identity full;
alter table public.ifb_project_invites replica identity full;
alter table public.ifb_bugs replica identity full;
alter table public.ifb_bug_comments replica identity full;
alter table public.ifb_bug_audit_logs replica identity full;
alter table public.ifb_bug_upvotes replica identity full;
alter table public.ifb_notifications replica identity full;

do $$
declare target_table text;
begin
  foreach target_table in array array[
    'ifb_profiles','ifb_projects','ifb_project_members','ifb_project_invites',
    'ifb_bugs','ifb_bug_comments','ifb_bug_audit_logs','ifb_bug_upvotes','ifb_notifications'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=target_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    end if;
  end loop;
end $$;

-- 10. API PERMISSIONS + SCHEMA CACHE ------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
-- Application table grants are intentionally installed by V2_PUBLIC_MODEL.sql only.
revoke all on public.ifb_profiles, public.ifb_projects, public.ifb_project_members,
  public.ifb_project_invites, public.ifb_bugs, public.ifb_bug_comments,
  public.ifb_bug_audit_logs, public.ifb_bug_upvotes, public.ifb_notifications
  from anon, authenticated;
grant select, delete on public.ifb_notifications to authenticated;
-- Keep privileged RPCs closed in the base migration. V2 grants only the
-- reviewed functions after role-aware visibility and write guards are installed.
revoke execute on function public.ifb_increment_bug_views(uuid) from public, anon, authenticated;
revoke execute on function public.ifb_toggle_bug_upvote(uuid, text, boolean) from public, anon, authenticated;
revoke execute on function public.ifb_update_bug_status(uuid, text) from public, anon, authenticated;
revoke execute on function public.ifb_update_bug_criteria(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.ifb_mark_notification_read(uuid) from public, anon, authenticated;
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

-- 8. ACCOUNT-SCOPED MCP ACCESS TOKENS ----------------------------------------
-- Raw bearer tokens are NEVER stored. The application stores SHA-256 digests.
create table if not exists public.ifb_mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.ifb_profiles(id) on delete cascade,
  name text not null default 'AI Agent' check (char_length(name) between 1 and 64),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  token_prefix text not null,
  scopes text[] not null default array['projects:read','projects:create','projects:update','notifications:read','notifications:update','activity:read','invites:create','invites:read','invites:revoke','spaces:discover','bugs:read','bugs:create','bugs:update','comments:read','comments:create','members:read'],
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.ifb_mcp_tokens alter column scopes set default array['projects:read','projects:create','projects:update','notifications:read','notifications:update','activity:read','invites:create','invites:read','invites:revoke','spaces:discover','bugs:read','bugs:create','bugs:update','comments:read','comments:create','members:read'];
create index if not exists ifb_mcp_tokens_profile_created_idx on public.ifb_mcp_tokens(profile_id, created_at desc);
create index if not exists ifb_mcp_tokens_active_hash_idx on public.ifb_mcp_tokens(token_hash) where revoked_at is null;

create table if not exists public.ifb_mcp_audit_logs (
  id uuid primary key default gen_random_uuid(), token_id uuid references public.ifb_mcp_tokens(id) on delete set null, profile_id uuid references public.ifb_profiles(id) on delete set null, method text not null, tool_name text, success boolean not null default true, error_code text, created_at timestamptz not null default now()
);
create index if not exists ifb_mcp_audit_token_time_idx on public.ifb_mcp_audit_logs(token_id, created_at desc);
create index if not exists ifb_mcp_audit_profile_time_idx on public.ifb_mcp_audit_logs(profile_id, created_at desc);
alter table public.ifb_mcp_audit_logs enable row level security;
revoke all on public.ifb_mcp_audit_logs from anon, authenticated;
alter table public.ifb_mcp_tokens enable row level security;
drop policy if exists ifb_mcp_tokens_select_own on public.ifb_mcp_tokens;
create policy ifb_mcp_tokens_select_own on public.ifb_mcp_tokens for select to authenticated
  using (profile_id = (select id from public.ifb_profiles where auth_user_id = auth.uid()));
drop policy if exists ifb_mcp_tokens_insert_own on public.ifb_mcp_tokens;
create policy ifb_mcp_tokens_insert_own on public.ifb_mcp_tokens for insert to authenticated
  with check (profile_id = (select id from public.ifb_profiles where auth_user_id = auth.uid()));
drop policy if exists ifb_mcp_tokens_revoke_own on public.ifb_mcp_tokens;
revoke update on public.ifb_mcp_tokens from authenticated;
grant select, insert on public.ifb_mcp_tokens to authenticated;
revoke all on public.ifb_mcp_tokens from anon;

notify pgrst, 'reload schema';
notify pgrst, 'reload config';

commit;

-- Quick verification after execution:
-- select tablename, rowsecurity from pg_tables where schemaname='public' and tablename like 'ifb_%' order by tablename;
-- select policyname, tablename, roles, cmd from pg_policies where schemaname='public' and tablename like 'ifb_%';

-- ===== Role-aware public/private model and MCP transactional RPC: sql/V2_PUBLIC_MODEL.sql =====
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

-- ===== Issue search and filtering indexes: sql/V3_ISSUE_SEARCH_INDEXES.sql =====
-- FoundBug V3: additive indexes for server-side issue search and filtering.
-- Safe to run repeatedly. No application rows are deleted or rewritten.
-- Apply only after reviewing the target project's current extensions/schema.

begin;

create extension if not exists pg_trgm;

create index if not exists ifb_bugs_title_trgm_idx
  on public.ifb_bugs using gin (title gin_trgm_ops);
create index if not exists ifb_bugs_code_trgm_idx
  on public.ifb_bugs using gin (code gin_trgm_ops);
create index if not exists ifb_bugs_summary_trgm_idx
  on public.ifb_bugs using gin (summary gin_trgm_ops);
create index if not exists ifb_bugs_section_trgm_idx
  on public.ifb_bugs using gin (section gin_trgm_ops);
create index if not exists ifb_bugs_reporter_trgm_idx
  on public.ifb_bugs using gin (reporter_name gin_trgm_ops);
create index if not exists ifb_bugs_actual_behavior_trgm_idx
  on public.ifb_bugs using gin (actual_behavior gin_trgm_ops);
create index if not exists ifb_bugs_expected_behavior_trgm_idx
  on public.ifb_bugs using gin (expected_behavior gin_trgm_ops);

create index if not exists ifb_bugs_project_status_created_idx
  on public.ifb_bugs (project_id, status, created_at desc);
create index if not exists ifb_bugs_project_priority_created_idx
  on public.ifb_bugs (project_id, priority, created_at desc);
create index if not exists ifb_bugs_project_assignee_created_idx
  on public.ifb_bugs (project_id, assigned_to, created_at desc)
  where assigned_to is not null;
create index if not exists ifb_bugs_project_updated_idx
  on public.ifb_bugs (project_id, updated_at desc);

commit;

-- ===== Realtime publication and replica identity: sql/REALTIME_PRODUCTION.sql =====
-- IFoundBug: enable low-latency database change streams for all live app data.
-- Safe to re-run. Does not delete or rewrite application rows.
-- Run once in Supabase SQL Editor after deploying the matching frontend.

begin;

-- DELETE events need old primary/foreign keys so clients can remove stale rows.
alter table public.ifb_profiles replica identity full;
alter table public.ifb_projects replica identity full;
alter table public.ifb_project_members replica identity full;
alter table public.ifb_project_invites replica identity full;
alter table public.ifb_bugs replica identity full;
alter table public.ifb_bug_comments replica identity full;
alter table public.ifb_bug_audit_logs replica identity full;
alter table public.ifb_bug_upvotes replica identity full;
alter table public.ifb_notifications replica identity full;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'ifb_profiles',
    'ifb_projects',
    'ifb_project_members',
    'ifb_project_invites',
    'ifb_bugs',
    'ifb_bug_comments',
    'ifb_bug_audit_logs',
    'ifb_bug_upvotes',
    'ifb_notifications'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    end if;
  end loop;
end
$$;

commit;

-- Verify publication coverage:
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename like 'ifb_%'
order by tablename;
