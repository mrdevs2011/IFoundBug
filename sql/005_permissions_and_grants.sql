-- ====================================================================
-- IFoundBug (IFB) - Migration: 005_permissions_and_grants.sql
-- Description: Explicit grants for PostgREST API access and schema reload.
-- Run this in your Supabase SQL Editor if you see PGRST205 errors.
-- ====================================================================

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant Table Access
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Set Default Privileges for Future Tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 4. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
