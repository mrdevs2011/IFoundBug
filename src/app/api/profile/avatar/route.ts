import { NextResponse } from 'next/server';
import { createAuthenticatedServerClient } from '@/lib/supabase/server-auth';
import { sniffImage } from '@/lib/github-evidence';
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '@/lib/avatar';

const BUCKET = 'avatars';

// Removes every object in the caller's own folder except `keep`. Storage RLS limits
// this to avatars/<auth uid>/, so a user can never touch someone else's files.
async function cleanFolder(client: NonNullable<Awaited<ReturnType<typeof createAuthenticatedServerClient>>>['client'], uid: string, keep?: string) {
  const { data } = await client.storage.from(BUCKET).list(uid, { limit: 100 });
  const stale = (data || []).map((f) => `${uid}/${f.name}`).filter((p) => p !== keep);
  if (stale.length) await client.storage.from(BUCKET).remove(stale);
}

export async function POST(req: Request) {
  const auth = await createAuthenticatedServerClient();
  if (!auth) return NextResponse.json({ error: 'Sign in to change your picture.' }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No image was provided.' }, { status: 400 });
  if (file.size <= 0 || file.size > AVATAR_MAX_BYTES) return NextResponse.json({ error: 'Image must be at most 2 MB.' }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniffImage(bytes);
  if (!ext || !AVATAR_TYPES[ext]) return NextResponse.json({ error: 'Use a PNG, JPG or WebP image.' }, { status: 415 });

  const uid = auth.user.id;
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await auth.client.storage.from(BUCKET).upload(path, bytes, { contentType: AVATAR_TYPES[ext], upsert: false, cacheControl: '31536000' });
  if (upErr) return NextResponse.json({ error: 'Upload failed. Try again.' }, { status: 502 });
  const url = auth.client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: dbErr } = await auth.client.from('ifb_profiles').update({ avatar_url: url }).eq('auth_user_id', uid);
  if (dbErr) {
    await auth.client.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 });
  }
  await cleanFolder(auth.client, uid, path);
  return NextResponse.json({ avatar_url: url }, { status: 201 });
}

export async function DELETE() {
  const auth = await createAuthenticatedServerClient();
  if (!auth) return NextResponse.json({ error: 'Sign in to change your picture.' }, { status: 401 });
  const { error } = await auth.client.from('ifb_profiles').update({ avatar_url: null }).eq('auth_user_id', auth.user.id);
  if (error) return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 });
  await cleanFolder(auth.client, auth.user.id);
  return NextResponse.json({ avatar_url: null });
}
