import { createAuthenticatedServerClient } from '@/lib/supabase/server-auth';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']);

export async function POST(req: Request) {
  const auth = await createAuthenticatedServerClient();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file was provided' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'This file type is not supported.' }, { status: 415 });
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File size must be between 1 byte and 10 MB.' }, { status: 413 });

    const fileExt = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf', 'text/plain': 'txt' } as const)[file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'application/pdf' | 'text/plain'];
    const filePath = `bugs/${crypto.randomUUID()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await auth.client.storage
      .from('bug-attachments')
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('Supabase storage upload failed:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 502 });
    }

    return NextResponse.json({ url: `/api/attachments/${filePath}` }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Upload handler error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
