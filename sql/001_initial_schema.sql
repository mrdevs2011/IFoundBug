-- ====================================================================
-- IFoundBug (IFB) - Apex Collaborative Bug Tracking Platform
-- Migration: 001_initial_schema.sql
-- Description: Core tables for Workspaces, Projects, Bugs, Comments,
--              Telemetry, Invites, and Audit Logs.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Extends auth.users or supports guest/developer profiles)
CREATE TABLE IF NOT EXISTS public.ifb_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'qa_tester', 'hunter', 'viewer')),
    reputation_score INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Projects Table (Workspaces / Applications)
CREATE TABLE IF NOT EXISTS public.ifb_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'bug',
    color TEXT DEFAULT '#10b981',
    is_public BOOLEAN DEFAULT true,
    allow_guest_reports BOOLEAN DEFAULT true,
    tech_stack TEXT[] DEFAULT ARRAY['React', 'Next.js', 'PostgreSQL'],
    telegram_webhook_enabled BOOLEAN DEFAULT false,
    telegram_bot_token TEXT,
    telegram_chat_id TEXT,
    github_repo_url TEXT,
    created_by UUID REFERENCES public.ifb_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Project Members
CREATE TABLE IF NOT EXISTS public.ifb_project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.ifb_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.ifb_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'qa_tester', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- 4. Project Invites (Shareable invite links with role and expiry)
CREATE TABLE IF NOT EXISTS public.ifb_project_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.ifb_projects(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'developer' CHECK (role IN ('admin', 'developer', 'qa_tester', 'viewer')),
    max_uses INT DEFAULT 100,
    uses_count INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.ifb_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Bugs Table (Rich bug data, client telemetry, reproduction steps)
CREATE TABLE IF NOT EXISTS public.ifb_bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL, -- e.g. "B01", "B02", "IFB-101"
    project_id UUID NOT NULL REFERENCES public.ifb_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    section TEXT DEFAULT 'General',
    screen TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    priority TEXT NOT NULL DEFAULT 'P2' CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
    status TEXT NOT NULL DEFAULT 'REPORTED' CHECK (status IN (
        'REPORTED', 'TRIAGED', 'IN_PROGRESS', 'READY_FOR_QA', 'VERIFIED', 'FIXED', 'CLOSED', 'WONT_FIX'
    )),
    environment TEXT NOT NULL DEFAULT 'PRODUCTION' CHECK (environment IN (
        'PRODUCTION', 'STAGING', 'DEVELOPMENT', 'LOCAL'
    )),
    actual_behavior TEXT NOT NULL,
    expected_behavior TEXT NOT NULL,
    steps_to_reproduce JSONB DEFAULT '[]'::jsonb, -- Array of strings or step objects
    acceptance_criteria JSONB DEFAULT '[]'::jsonb, -- Array of { id: string, text: string, checked: boolean }
    device_telemetry JSONB DEFAULT '{}'::jsonb, -- Browser, OS, resolution, viewport, UA
    dev_notes TEXT, -- Root causes, regex patterns, suggested files
    search_keys TEXT[] DEFAULT ARRAY[]::TEXT[],
    evidence_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_sensitive BOOLEAN DEFAULT false, -- If true, masks/blurs evidence by default
    upvotes_count INT DEFAULT 0,
    reproduced_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    assigned_to UUID REFERENCES public.ifb_profiles(id) ON DELETE SET NULL,
    reported_by UUID REFERENCES public.ifb_profiles(id) ON DELETE SET NULL,
    reporter_name TEXT DEFAULT 'Bug Hunter',
    claude_code_prompt TEXT, -- Ready-to-execute AI prompt for this bug
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Create index on project_id and code
CREATE INDEX IF NOT EXISTS idx_ifb_bugs_project_code ON public.ifb_bugs(project_id, code);
CREATE INDEX IF NOT EXISTS idx_ifb_bugs_status ON public.ifb_bugs(status);
CREATE INDEX IF NOT EXISTS idx_ifb_bugs_severity ON public.ifb_bugs(severity);

-- 6. Bug Comments (Realtime discussions)
CREATE TABLE IF NOT EXISTS public.ifb_bug_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_id UUID NOT NULL REFERENCES public.ifb_bugs(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.ifb_profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '{}'::jsonb, -- e.g. { "👍": ["Ali", "Vali"], "🔥": ["Sardor"] }
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ifb_comments_bug_id ON public.ifb_bug_comments(bug_id);

-- 7. Bug Audit Logs (Activity history: status changes, assignment, checklist edits)
CREATE TABLE IF NOT EXISTS public.ifb_bug_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_id UUID NOT NULL REFERENCES public.ifb_bugs(id) ON DELETE CASCADE,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'STATUS_CHANGED', 'ASSIGNED', 'CRITERIA_TOGGLED', etc.
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ifb_audit_bug_id ON public.ifb_bug_audit_logs(bug_id);

-- 8. Bug Upvotes & Confirmations
CREATE TABLE IF NOT EXISTS public.ifb_bug_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_id UUID NOT NULL REFERENCES public.ifb_bugs(id) ON DELETE CASCADE,
    user_identifier TEXT NOT NULL, -- User UUID or fingerprint
    is_reproduced BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bug_id, user_identifier)
);
