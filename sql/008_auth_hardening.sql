-- IFoundBug security hardening: anonymous users must not read or mutate app data.
-- Run after 001-007 in the Supabase SQL Editor.
DO $$
DECLARE policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'ifb_profiles', 'ifb_projects', 'ifb_project_members', 'ifb_project_invites',
        'ifb_bugs', 'ifb_bug_comments', 'ifb_bug_audit_logs', 'ifb_bug_upvotes'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END $$;

ALTER TABLE public.ifb_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_project_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_bug_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_bug_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_bug_upvotes ENABLE ROW LEVEL SECURITY;

-- The application currently uses a shared workspace model. This policy layer
-- blocks anonymous/unauthenticated access; project-level membership policies
-- can be tightened independently without reopening anonymous access.
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'ifb_profiles', 'ifb_projects', 'ifb_project_members', 'ifb_project_invites',
    'ifb_bugs', 'ifb_bug_comments', 'ifb_bug_audit_logs', 'ifb_bug_upvotes'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      'authenticated users only', table_name
    );
  END LOOP;
END $$;

-- Remove anonymous write grants; authenticated access remains subject to RLS.
REVOKE ALL ON public.ifb_profiles, public.ifb_projects, public.ifb_project_members,
  public.ifb_project_invites, public.ifb_bugs, public.ifb_bug_comments,
  public.ifb_bug_audit_logs, public.ifb_bug_upvotes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ifb_profiles, public.ifb_projects,
  public.ifb_project_members, public.ifb_project_invites, public.ifb_bugs,
  public.ifb_bug_comments, public.ifb_bug_audit_logs, public.ifb_bug_upvotes TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Storage writes also require a signed-in user; public reads remain available
-- for existing shared evidence URLs.
DROP POLICY IF EXISTS "Anyone can upload bug attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete their attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload bug attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload bug attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bug-attachments' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete bug attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'bug-attachments' AND auth.uid() IS NOT NULL);
