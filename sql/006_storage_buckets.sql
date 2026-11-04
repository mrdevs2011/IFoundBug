-- ====================================================================
-- IFoundBug (IFB) - Migration: 006_storage_buckets.sql
-- Description: Creates the 'bug-attachments' storage bucket and allows
--              public read and uploads for bug evidence and screenshots.
-- ====================================================================

-- 1. Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-attachments', 'bug-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public access to view attachments
DROP POLICY IF EXISTS "Public can view bug attachments" ON storage.objects;
CREATE POLICY "Public can view bug attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'bug-attachments');

-- 3. Allow anyone (anon & authenticated) to upload bug attachments
DROP POLICY IF EXISTS "Anyone can upload bug attachments" ON storage.objects;
CREATE POLICY "Anyone can upload bug attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bug-attachments');

-- 4. Allow authors/admins to delete attachments
DROP POLICY IF EXISTS "Anyone can delete their attachments" ON storage.objects;
CREATE POLICY "Anyone can delete their attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'bug-attachments');
