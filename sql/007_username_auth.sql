-- ====================================================================
-- IFoundBug (IFB) - Migration: 007_username_auth.sql
-- Description: Dedicated Username Authentication & Profile Synchronization
-- ====================================================================

-- 1. Ensure Case-Insensitive Unique Index on Username in ifb_profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_ifb_profiles_username_lower 
ON public.ifb_profiles (LOWER(username));

-- 2. Trigger function to auto-create / sync public.ifb_profiles when a user signs up in auth.users
CREATE OR REPLACE FUNCTION public.ifb_handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    extracted_username TEXT;
    extracted_full_name TEXT;
    extracted_role TEXT;
BEGIN
    -- Extract username from raw_user_meta_data, or fallback to email prefix
    extracted_username := LOWER(TRIM(COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1)
    )));

    -- Extract full name
    extracted_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        extracted_username
    );

    -- Extract role
    extracted_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'developer'
    );

    -- Insert or update profile
    INSERT INTO public.ifb_profiles (auth_user_id, username, full_name, role)
    VALUES (NEW.id, extracted_username, extracted_full_name, extracted_role)
    ON CONFLICT (username) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id,
        full_name = EXCLUDED.full_name,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Register the trigger on auth.users (if permission allows)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.ifb_handle_new_auth_user();

-- 4. Helper function to find user email by username (for seamless username login)
CREATE OR REPLACE FUNCTION public.ifb_get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
    found_email TEXT;
BEGIN
    SELECT au.email INTO found_email
    FROM auth.users au
    JOIN public.ifb_profiles p ON p.auth_user_id = au.id
    WHERE LOWER(p.username) = LOWER(TRIM(p_username))
    LIMIT 1;

    RETURN found_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant access to anon & authenticated roles
GRANT EXECUTE ON FUNCTION public.ifb_get_email_by_username(TEXT) TO anon, authenticated, service_role;

-- 6. Ensure RLS on ifb_profiles allows reading usernames
ALTER TABLE public.ifb_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ifb_profiles' AND policyname = 'Allow public read of profiles for username check'
    ) THEN
        CREATE POLICY "Allow public read of profiles for username check" 
        ON public.ifb_profiles FOR SELECT 
        USING (true);
    END IF;
END $$;
