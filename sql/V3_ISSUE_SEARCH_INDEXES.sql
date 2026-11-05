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
