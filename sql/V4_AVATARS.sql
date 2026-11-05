-- FoundBug V4: profile pictures + close public read on bug attachments.
-- Additive and idempotent. No rows in application tables are changed.

begin;

-- 1. Public avatars bucket (2 MB, raster images only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Each user may only write inside their own folder: avatars/<auth uid>/<file>.
drop policy if exists ifb_avatars_insert on storage.objects;
drop policy if exists ifb_avatars_update on storage.objects;
drop policy if exists ifb_avatars_delete on storage.objects;
create policy ifb_avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy ifb_avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy ifb_avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
-- No SELECT policy: public objects are served by the public URL; listing stays closed.

-- 2. Security fix: bug attachments must never be readable through the storage API.
-- The app serves them via /api/attachments after issue-level authorization.
drop policy if exists ifb_public_read_bug_attachments on storage.objects;

commit;
