-- ====================================================================
-- IFoundBug (IFB) - Migration: 003_realtime_and_triggers.sql
-- Description: Realtime subscriptions and automatic timestamp triggers.
-- ====================================================================

-- 1. Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.ifb_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Triggers for updated_at
DROP TRIGGER IF EXISTS ifb_projects_updated_at ON public.ifb_projects;
CREATE TRIGGER ifb_projects_updated_at
    BEFORE UPDATE ON public.ifb_projects
    FOR EACH ROW EXECUTE FUNCTION public.ifb_handle_updated_at();

DROP TRIGGER IF EXISTS ifb_bugs_updated_at ON public.ifb_bugs;
CREATE TRIGGER ifb_bugs_updated_at
    BEFORE UPDATE ON public.ifb_bugs
    FOR EACH ROW EXECUTE FUNCTION public.ifb_handle_updated_at();

DROP TRIGGER IF EXISTS ifb_comments_updated_at ON public.ifb_bug_comments;
CREATE TRIGGER ifb_comments_updated_at
    BEFORE UPDATE ON public.ifb_bug_comments
    FOR EACH ROW EXECUTE FUNCTION public.ifb_handle_updated_at();

-- 3. Atomic counter increment helper functions
CREATE OR REPLACE FUNCTION public.ifb_increment_bug_views(target_bug_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.ifb_bugs
    SET views_count = views_count + 1
    WHERE id = target_bug_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.ifb_toggle_bug_upvote(target_bug_id UUID, user_id_str TEXT, reproduced_flag BOOLEAN DEFAULT false)
RETURNS JSONB AS $$
DECLARE
    existing_id UUID;
    new_upvotes INT;
    new_reproduced INT;
BEGIN
    SELECT id INTO existing_id FROM public.ifb_bug_upvotes
    WHERE bug_id = target_bug_id AND user_identifier = user_id_str;

    IF existing_id IS NOT NULL THEN
        DELETE FROM public.ifb_bug_upvotes WHERE id = existing_id;
        UPDATE public.ifb_bugs
        SET upvotes_count = GREATEST(0, upvotes_count - 1),
            reproduced_count = CASE WHEN reproduced_flag THEN GREATEST(0, reproduced_count - 1) ELSE reproduced_count END
        WHERE id = target_bug_id
        RETURNING upvotes_count, reproduced_count INTO new_upvotes, new_reproduced;
        RETURN jsonb_build_object('voted', false, 'upvotes', new_upvotes, 'reproduced', new_reproduced);
    ELSE
        INSERT INTO public.ifb_bug_upvotes(bug_id, user_identifier, is_reproduced)
        VALUES (target_bug_id, user_id_str, reproduced_flag);
        UPDATE public.ifb_bugs
        SET upvotes_count = upvotes_count + 1,
            reproduced_count = CASE WHEN reproduced_flag THEN reproduced_count + 1 ELSE reproduced_count END
        WHERE id = target_bug_id
        RETURNING upvotes_count, reproduced_count INTO new_upvotes, new_reproduced;
        RETURN jsonb_build_object('voted', true, 'upvotes', new_upvotes, 'reproduced', new_reproduced);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Supabase Realtime Publications
-- Add tables to realtime publication (wrapped in DO block for safety)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ifb_bug_comments;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ifb_bugs;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ifb_bug_audit_logs;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
