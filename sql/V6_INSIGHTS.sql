-- FoundBug V6: reliable close timestamps + repository insights.
-- Additive. Only the new closed_at column is backfilled; no other data changes.

begin;

-- 1. closed_at is derived from status by the database (clients cannot forge it).
alter table public.ifb_bugs add column if not exists closed_at timestamptz;

create or replace function public.ifb_set_closed_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.closed_at := case when new.status in ('VERIFIED','FIXED','CLOSED','WONT_FIX') then now() else null end;
  elsif new.status is distinct from old.status then
    new.closed_at := case
      when new.status in ('VERIFIED','FIXED','CLOSED','WONT_FIX') then coalesce(old.closed_at, now())
      else null end;
  else
    new.closed_at := old.closed_at;
  end if;
  return new;
end; $$;

-- "zz" makes it the last BEFORE trigger, after ifb_bugs_guard_write has normalised status.
drop trigger if exists ifb_bugs_zz_closed_at on public.ifb_bugs;
create trigger ifb_bugs_zz_closed_at before insert or update on public.ifb_bugs
  for each row execute function public.ifb_set_closed_at();

-- Backfill: last status change in the audit log, else updated_at.
-- Triggers are skipped for this statement so updated_at and the derive trigger are untouched.
set local session_replication_role = replica;
update public.ifb_bugs b set closed_at = coalesce(
  (select max(l.created_at) from public.ifb_bug_audit_logs l where l.bug_id = b.id and l.action = 'STATUS_CHANGED'),
  b.updated_at)
where b.status in ('VERIFIED','FIXED','CLOSED','WONT_FIX') and b.closed_at is null;
set local session_replication_role = origin;

create index if not exists ifb_bugs_project_closed_idx on public.ifb_bugs (project_id, closed_at desc) where closed_at is not null;

-- 2. Insights for one repository. Members, owners and public repositories only.
-- p_actor lets the service-role API/MCP pass a verified profile; browsers pass null.
create or replace function public.ifb_project_insights(p_project uuid, p_actor uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare
  v_project public.ifb_projects%rowtype;
  v_actor uuid;
  v_is_service boolean := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                                   nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', '') = 'service_role';
  v_member boolean;
  v_hide_private boolean;
  v_result jsonb;
begin
  select * into v_project from public.ifb_projects where id = p_project;
  if not found then raise exception 'Repository not found'; end if;
  v_actor := case when v_is_service then p_actor else public.ifb_my_profile_id() end;
  v_member := v_actor is not null and (v_project.created_by = v_actor or exists (
    select 1 from public.ifb_project_members m where m.project_id = p_project and m.user_id = v_actor));
  if not v_member and not v_project.is_public then raise exception 'Repository not found'; end if;
  -- Non-members never see link-only or sensitive issues in aggregates.
  v_hide_private := not v_member;

  with b as (
    select * from public.ifb_bugs
    where project_id = p_project and (not v_hide_private or (share_token is null and not coalesce(is_sensitive, false)))
  ),
  closed90 as (
    select extract(epoch from (closed_at - created_at)) / 3600.0 as hours
    from b where closed_at is not null and closed_at >= now() - interval '90 days' and closed_at >= created_at
  ),
  weeks as (
    select generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') as wk
  )
  select jsonb_build_object(
    'generated_at', now(),
    'totals', jsonb_build_object(
      'all', (select count(*) from b),
      'open', (select count(*) from b where closed_at is null),
      'closed', (select count(*) from b where closed_at is not null),
      'created_30d', (select count(*) from b where created_at >= now() - interval '30 days'),
      'closed_30d', (select count(*) from b where closed_at >= now() - interval '30 days')),
    'time_to_close_hours', jsonb_build_object(
      'samples', (select count(*) from closed90),
      'average', (select round(avg(hours)::numeric, 1) from closed90),
      'median', (select round((percentile_cont(0.5) within group (order by hours))::numeric, 1) from closed90),
      'p90', (select round((percentile_cont(0.9) within group (order by hours))::numeric, 1) from closed90)),
    'open_by_severity', (select coalesce(jsonb_object_agg(severity, n), '{}'::jsonb) from (select severity, count(*) n from b where closed_at is null group by 1) x),
    'open_by_priority', (select coalesce(jsonb_object_agg(priority, n), '{}'::jsonb) from (select priority, count(*) n from b where closed_at is null group by 1) x),
    'by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from b group by 1) x),
    'weekly', (select jsonb_agg(jsonb_build_object(
        'week', to_char(w.wk, 'YYYY-MM-DD'),
        'created', (select count(*) from b where created_at >= w.wk and created_at < w.wk + interval '1 week'),
        'closed', (select count(*) from b where closed_at >= w.wk and closed_at < w.wk + interval '1 week')) order by w.wk) from weeks w),
    'assignees', case when v_member then (select coalesce(jsonb_agg(row_to_json(a) order by a.open desc, a.closed_30d desc), '[]'::jsonb) from (
        select p.id, p.username, p.full_name,
               count(*) filter (where b.closed_at is null) as open,
               count(*) filter (where b.closed_at >= now() - interval '30 days') as closed_30d,
               round((avg(extract(epoch from (b.closed_at - b.created_at)) / 3600.0) filter (where b.closed_at >= now() - interval '90 days'))::numeric, 1) as avg_close_hours
        from b join public.ifb_profiles p on p.id = b.assigned_to group by p.id, p.username, p.full_name) a)
      else '[]'::jsonb end,
    'unassigned_open', (select count(*) from b where closed_at is null and assigned_to is null),
    'oldest_open', (select coalesce(jsonb_agg(row_to_json(o)), '[]'::jsonb) from (
        select code, title, severity, priority, created_at from b where closed_at is null order by created_at asc limit 5) o)
  ) into v_result;
  return v_result;
end; $$;

revoke all on function public.ifb_project_insights(uuid, uuid) from public;
grant execute on function public.ifb_project_insights(uuid, uuid) to anon, authenticated, service_role;

commit;
