-- FoundBug V8: organizations (several teams/repositories under one account).
-- Additive. Access is inherited by materialising project memberships marked with
-- via_org, so every existing RLS rule keeps working unchanged. Explicit memberships
-- (via_org is null) always win and are never modified by the sync.

begin;

create table if not exists public.ifb_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  description text not null default '' check (length(description) <= 300),
  created_by uuid references public.ifb_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ifb_org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ifb_organizations(id) on delete cascade,
  user_id uuid not null references public.ifb_profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index if not exists ifb_org_members_user_idx on public.ifb_org_members (user_id);

alter table public.ifb_projects add column if not exists org_id uuid references public.ifb_organizations(id) on delete set null;
create index if not exists ifb_projects_org_idx on public.ifb_projects (org_id) where org_id is not null;
alter table public.ifb_project_members add column if not exists via_org uuid references public.ifb_organizations(id) on delete cascade;

-- Reads go through RLS; all writes go through the audited RPCs below.
alter table public.ifb_organizations enable row level security;
alter table public.ifb_org_members enable row level security;
revoke all on public.ifb_organizations, public.ifb_org_members from anon, authenticated;
grant select on public.ifb_organizations, public.ifb_org_members to authenticated;

create or replace function public.ifb_org_role(p_org uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.ifb_org_members where org_id = p_org and user_id = public.ifb_my_profile_id()
$$;
grant execute on function public.ifb_org_role(uuid) to authenticated;

drop policy if exists orgs_read on public.ifb_organizations;
create policy orgs_read on public.ifb_organizations for select to authenticated using (public.ifb_org_role(id) is not null);
drop policy if exists org_members_read on public.ifb_org_members;
create policy org_members_read on public.ifb_org_members for select to authenticated using (public.ifb_org_role(org_id) is not null);

-- Materialise org access into project memberships for one organization.
create or replace function public.ifb_sync_org_access(p_org uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- remove inherited rows that no longer apply
  delete from public.ifb_project_members pm
  where pm.via_org = p_org and (
    not exists (select 1 from public.ifb_projects p where p.id = pm.project_id and p.org_id = p_org) or
    not exists (select 1 from public.ifb_org_members om where om.org_id = p_org and om.user_id = pm.user_id));
  -- refresh roles of inherited rows
  update public.ifb_project_members pm set role = case om.role when 'member' then 'developer' else 'admin' end
  from public.ifb_org_members om
  where pm.via_org = p_org and om.org_id = p_org and om.user_id = pm.user_id
    and pm.role is distinct from (case om.role when 'member' then 'developer' else 'admin' end);
  -- add missing rows; explicit memberships win (do nothing on conflict)
  insert into public.ifb_project_members(project_id, user_id, role, via_org)
  select p.id, om.user_id, case om.role when 'member' then 'developer' else 'admin' end, p_org
  from public.ifb_projects p join public.ifb_org_members om on om.org_id = p.org_id
  where p.org_id = p_org
  on conflict (project_id, user_id) do nothing;
end; $$;
revoke all on function public.ifb_sync_org_access(uuid) from public, anon, authenticated;

create or replace function public.ifb_org_members_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.ifb_sync_org_access(coalesce(new.org_id, old.org_id));
  return null;
end; $$;
drop trigger if exists ifb_org_members_sync on public.ifb_org_members;
create trigger ifb_org_members_sync after insert or update or delete on public.ifb_org_members
  for each row execute function public.ifb_org_members_changed();

create or replace function public.ifb_project_org_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.org_id is not null then perform public.ifb_sync_org_access(old.org_id); end if;
  if new.org_id is not null then perform public.ifb_sync_org_access(new.org_id); end if;
  return null;
end; $$;
drop trigger if exists ifb_projects_org_sync on public.ifb_projects;
create trigger ifb_projects_org_sync after update of org_id on public.ifb_projects
  for each row when (old.org_id is distinct from new.org_id) execute function public.ifb_project_org_changed();

-- org_id can only change through ifb_org_set_project (never by a direct PATCH).
create or replace function public.ifb_guard_project_org() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated','anon') and new.org_id is distinct from old.org_id then
    new.org_id := old.org_id;
  end if;
  return new;
end; $$;
drop trigger if exists ifb_projects_guard_org on public.ifb_projects;
create trigger ifb_projects_guard_org before update on public.ifb_projects
  for each row execute function public.ifb_guard_project_org();
-- Inherited memberships cannot be edited or forged by clients either.
create or replace function public.ifb_guard_via_org() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated','anon') then
    if tg_op = 'DELETE' then return old; end if; return new;
  end if;
  if tg_op = 'INSERT' and new.via_org is not null then raise exception 'Organization access is managed by the organization'; end if;
  if tg_op = 'UPDATE' and (old.via_org is not null or new.via_org is not null) then raise exception 'Organization access is managed by the organization'; end if;
  -- cascades from deleting the repository itself are allowed
  if tg_op = 'DELETE' and old.via_org is not null and exists (select 1 from public.ifb_projects where id = old.project_id) then
    raise exception 'Remove this person from the organization instead';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end; $$;
drop trigger if exists ifb_project_members_guard_via_org on public.ifb_project_members;
create trigger ifb_project_members_guard_via_org before insert or update or delete on public.ifb_project_members
  for each row execute function public.ifb_guard_via_org();

-- ---- RPCs -----------------------------------------------------------------------
create or replace function public.ifb_create_org(p_name text, p_slug text, p_description text default '')
returns text language plpgsql security definer set search_path = public as $$
declare v_me uuid := public.ifb_my_profile_id(); v_id uuid; v_slug text := lower(btrim(p_slug));
begin
  if v_me is null then raise exception 'Authentication required'; end if;
  if (select count(*) from public.ifb_org_members where user_id = v_me and role = 'owner') >= 10 then
    raise exception 'You can own at most 10 organizations';
  end if;
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' then raise exception 'URL name must be 3-40 characters: a-z, 0-9 and dashes'; end if;
  if exists (select 1 from public.ifb_organizations where slug = v_slug) then raise exception 'This URL name is taken'; end if;
  insert into public.ifb_organizations(name, slug, description, created_by) values (btrim(p_name), v_slug, coalesce(p_description, ''), v_me) returning id into v_id;
  insert into public.ifb_org_members(org_id, user_id, role) values (v_id, v_me, 'owner');
  return v_slug;
end; $$;

create or replace function public.ifb_org_require(p_org uuid, p_roles text[]) returns text
language plpgsql stable security definer set search_path = public as $$
declare v_role text := public.ifb_org_role(p_org);
begin
  if v_role is null or not (v_role = any(p_roles)) then raise exception 'You do not have permission for this organization'; end if;
  return v_role;
end; $$;
revoke all on function public.ifb_org_require(uuid, text[]) from public, anon, authenticated;

create or replace function public.ifb_org_add_member(p_org uuid, p_username text, p_role text default 'member')
returns void language plpgsql security definer set search_path = public as $$
declare v_my text := public.ifb_org_require(p_org, array['owner','admin']); v_user uuid;
begin
  if p_role not in ('owner','admin','member') then raise exception 'Unknown role'; end if;
  if p_role = 'owner' and v_my <> 'owner' then raise exception 'Only owners can add owners'; end if;
  select id into v_user from public.ifb_profiles where lower(username) = lower(btrim(p_username, ' @'));
  if v_user is null then raise exception 'No user with username "%"', p_username; end if;
  insert into public.ifb_org_members(org_id, user_id, role) values (p_org, v_user, p_role)
  on conflict (org_id, user_id) do nothing;
  if not found then raise exception 'This person is already a member'; end if;
end; $$;

create or replace function public.ifb_org_set_role(p_org uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare v_my text := public.ifb_org_require(p_org, array['owner','admin']); v_old text;
begin
  if p_role not in ('owner','admin','member') then raise exception 'Unknown role'; end if;
  select role into v_old from public.ifb_org_members where org_id = p_org and user_id = p_user for update;
  if v_old is null then raise exception 'Member not found'; end if;
  if (v_old = 'owner' or p_role = 'owner') and v_my <> 'owner' then raise exception 'Only owners can change owner roles'; end if;
  if v_old = 'owner' and p_role <> 'owner' and (select count(*) from public.ifb_org_members where org_id = p_org and role = 'owner') <= 1 then
    raise exception 'An organization needs at least one owner';
  end if;
  update public.ifb_org_members set role = p_role where org_id = p_org and user_id = p_user;
end; $$;

create or replace function public.ifb_org_remove_member(p_org uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_me uuid := public.ifb_my_profile_id(); v_my text := public.ifb_org_role(p_org); v_old text;
begin
  select role into v_old from public.ifb_org_members where org_id = p_org and user_id = p_user for update;
  if v_old is null then raise exception 'Member not found'; end if;
  if p_user <> v_me and (v_my is null or v_my not in ('owner','admin') or (v_old = 'owner' and v_my <> 'owner')) then
    raise exception 'You do not have permission for this organization';
  end if;
  if v_old = 'owner' and (select count(*) from public.ifb_org_members where org_id = p_org and role = 'owner') <= 1 then
    raise exception 'An organization needs at least one owner';
  end if;
  delete from public.ifb_org_members where org_id = p_org and user_id = p_user;
end; $$;

-- Move a repository into (p_org) or out of (null) an organization.
create or replace function public.ifb_org_set_project(p_project uuid, p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_me uuid := public.ifb_my_profile_id(); v_p public.ifb_projects%rowtype; v_explicit_admin boolean;
begin
  select * into v_p from public.ifb_projects where id = p_project for update;
  if not found then raise exception 'Repository not found'; end if;
  v_explicit_admin := v_p.created_by = v_me or exists (select 1 from public.ifb_project_members
    where project_id = p_project and user_id = v_me and role in ('owner','admin') and via_org is null);
  if p_org is not null then
    if not v_explicit_admin then raise exception 'Only the repository owner or an admin can move it into an organization'; end if;
    perform public.ifb_org_require(p_org, array['owner','admin']);
  else
    if v_p.org_id is null then return; end if;
    if not v_explicit_admin and coalesce(public.ifb_org_role(v_p.org_id), '') not in ('owner','admin') then
      raise exception 'Only the repository owner or an organization admin can remove it';
    end if;
  end if;
  update public.ifb_projects set org_id = p_org where id = p_project;
end; $$;

create or replace function public.ifb_delete_org(p_org uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.ifb_org_require(p_org, array['owner']);
  delete from public.ifb_organizations where id = p_org; -- repos stay, inherited access is removed
end; $$;

create or replace function public.ifb_my_orgs() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name, 'slug', o.slug, 'description', o.description, 'role', m.role,
    'members', (select count(*) from public.ifb_org_members x where x.org_id = o.id),
    'repositories', (select count(*) from public.ifb_projects p where p.org_id = o.id)) order by o.name), '[]'::jsonb)
  from public.ifb_organizations o join public.ifb_org_members m on m.org_id = o.id and m.user_id = public.ifb_my_profile_id()
$$;

create or replace function public.ifb_org_overview(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare o public.ifb_organizations%rowtype; v_role text;
begin
  select * into o from public.ifb_organizations where slug = lower(p_slug);
  if not found then raise exception 'Organization not found'; end if;
  v_role := public.ifb_org_role(o.id);
  if v_role is null then raise exception 'Organization not found'; end if;
  return jsonb_build_object(
    'id', o.id, 'name', o.name, 'slug', o.slug, 'description', o.description, 'my_role', v_role,
    'members', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'username', p.username, 'full_name', p.full_name, 'avatar_url', p.avatar_url, 'role', m.role) order by m.role, p.username), '[]'::jsonb)
                from public.ifb_org_members m join public.ifb_profiles p on p.id = m.user_id where m.org_id = o.id),
    'repositories', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'slug', p.slug, 'is_public', p.is_public,
                       'open', (select count(*) from public.ifb_bugs b where b.project_id = p.id and b.status in ('REPORTED','TRIAGED','IN_PROGRESS','READY_FOR_QA'))) order by p.name), '[]'::jsonb)
                     from public.ifb_projects p where p.org_id = o.id));
end; $$;

revoke all on function public.ifb_create_org(text, text, text), public.ifb_org_add_member(uuid, text, text), public.ifb_org_set_role(uuid, uuid, text),
  public.ifb_org_remove_member(uuid, uuid), public.ifb_org_set_project(uuid, uuid), public.ifb_delete_org(uuid), public.ifb_my_orgs(), public.ifb_org_overview(text) from public, anon;
grant execute on function public.ifb_create_org(text, text, text), public.ifb_org_add_member(uuid, text, text), public.ifb_org_set_role(uuid, uuid, text),
  public.ifb_org_remove_member(uuid, uuid), public.ifb_org_set_project(uuid, uuid), public.ifb_delete_org(uuid), public.ifb_my_orgs(), public.ifb_org_overview(text) to authenticated;
revoke all on function public.ifb_org_members_changed(), public.ifb_project_org_changed() from public, anon, authenticated;

commit;
