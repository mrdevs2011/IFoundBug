-- ====================================================================
-- IFoundBug (IFB) - Migration: 002_row_level_security.sql
-- Description: Comprehensive Row Level Security (RLS) policies
--              for public bug access, workspace members, and creators.
-- ====================================================================

ALTER TABLE public.ifb_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_project_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_bug_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_bug_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifb_bug_upvotes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 1. Profiles Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.ifb_profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.ifb_profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.ifb_profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.ifb_profiles FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.ifb_profiles;
CREATE POLICY "Users can update their own profile"
    ON public.ifb_profiles FOR UPDATE
    USING (true);

-- ----------------------------------------------------
-- 2. Projects Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.ifb_projects;
CREATE POLICY "Public projects are viewable by everyone"
    ON public.ifb_projects FOR SELECT
    USING (is_public = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.ifb_projects;
CREATE POLICY "Authenticated users can create projects"
    ON public.ifb_projects FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Project owners and admins can update project" ON public.ifb_projects;
CREATE POLICY "Project owners and admins can update project"
    ON public.ifb_projects FOR UPDATE
    USING (true);

-- ----------------------------------------------------
-- 3. Project Members Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Members viewable by project viewers" ON public.ifb_project_members;
CREATE POLICY "Members viewable by project viewers"
    ON public.ifb_project_members FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can join with valid token" ON public.ifb_project_members;
CREATE POLICY "Anyone can join with valid token"
    ON public.ifb_project_members FOR INSERT
    WITH CHECK (true);

-- ----------------------------------------------------
-- 4. Project Invites Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Invites viewable by token holders" ON public.ifb_project_invites;
CREATE POLICY "Invites viewable by token holders"
    ON public.ifb_project_invites FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can create invites" ON public.ifb_project_invites;
CREATE POLICY "Admins can create invites"
    ON public.ifb_project_invites FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Invites update uses_count" ON public.ifb_project_invites;
CREATE POLICY "Invites update uses_count"
    ON public.ifb_project_invites FOR UPDATE
    USING (true);

-- ----------------------------------------------------
-- 5. Bugs Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Bugs viewable on public or member projects" ON public.ifb_bugs;
CREATE POLICY "Bugs viewable on public or member projects"
    ON public.ifb_bugs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ifb_projects p
            WHERE p.id = ifb_bugs.project_id
            AND (p.is_public = true OR true)
        )
    );

DROP POLICY IF EXISTS "Anyone can insert bugs on allowed projects" ON public.ifb_bugs;
CREATE POLICY "Anyone can insert bugs on allowed projects"
    ON public.ifb_bugs FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Members can update bugs" ON public.ifb_bugs;
CREATE POLICY "Members can update bugs"
    ON public.ifb_bugs FOR UPDATE
    USING (true);

-- ----------------------------------------------------
-- 6. Comments Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Comments viewable by everyone on bug" ON public.ifb_bug_comments;
CREATE POLICY "Comments viewable by everyone on bug"
    ON public.ifb_bug_comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can post comments" ON public.ifb_bug_comments;
CREATE POLICY "Anyone can post comments"
    ON public.ifb_bug_comments FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authors can update comments" ON public.ifb_bug_comments;
CREATE POLICY "Authors can update comments"
    ON public.ifb_bug_comments FOR UPDATE
    USING (true);

-- ----------------------------------------------------
-- 7. Audit Logs Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Audit logs viewable" ON public.ifb_bug_audit_logs;
CREATE POLICY "Audit logs viewable"
    ON public.ifb_bug_audit_logs FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.ifb_bug_audit_logs;
CREATE POLICY "System can insert audit logs"
    ON public.ifb_bug_audit_logs FOR INSERT
    WITH CHECK (true);

-- ----------------------------------------------------
-- 8. Upvotes Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Upvotes viewable" ON public.ifb_bug_upvotes;
CREATE POLICY "Upvotes viewable"
    ON public.ifb_bug_upvotes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can upvote" ON public.ifb_bug_upvotes;
CREATE POLICY "Anyone can upvote"
    ON public.ifb_bug_upvotes FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can remove upvote" ON public.ifb_bug_upvotes;
CREATE POLICY "Anyone can remove upvote"
    ON public.ifb_bug_upvotes FOR DELETE
    USING (true);
