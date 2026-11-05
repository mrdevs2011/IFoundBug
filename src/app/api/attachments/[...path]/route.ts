import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedServerClient } from '@/lib/supabase/server-auth';

const BUCKET = 'bug-attachments';
const OBJECT_PATH = /^bugs\/[0-9a-f-]{36}\.(?:jpe?g|png|webp|gif|pdf|txt)$/i;

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Attachment storage is not configured.' }, { status: 503 });
  }

  const { path } = await context.params;
  const objectPath = path.join('/');
  if (!OBJECT_PATH.test(objectPath)) return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
  const storedUrl = `/api/attachments/${objectPath}`;
  const shareToken = request.nextUrl.searchParams.get('share_token');
  const auth = await createAuthenticatedServerClient();
  const accessClient = auth?.client ?? createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // A secret-link attachment is authorized by the same RPC that resolves its issue.
  if (shareToken) {
    const { data, error } = await accessClient.rpc('ifb_get_shared_bug', { p_token: shareToken });
    const shared = data as { bug?: { evidence_urls?: string[] } } | null;
    if (error || !shared?.bug?.evidence_urls?.includes(storedUrl)) {
      return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
    }
  } else {
    // RLS is the authorization boundary for public issues, reporters and project members.
    const { data, error } = await accessClient.from('ifb_bugs').select('id').contains('evidence_urls', [storedUrl]).limit(1).maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
  }

  // Storage is private. The service key is used only after the caller's issue-level
  // access has been verified by the anon/authenticated client above.
  const storageAdmin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: file, error } = await storageAdmin.storage.from(BUCKET).download(objectPath);
  if (error || !file) return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });

  return new NextResponse(file.stream(), {
    status: 200,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Content-Length': String(file.size),
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  });
}
