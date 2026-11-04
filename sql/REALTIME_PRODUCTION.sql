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
