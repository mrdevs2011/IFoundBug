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
    if (!(file instanceof File)) return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Fayl turi qo‘llab-quvvatlanmaydi.' }, { status: 415 });
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Fayl hajmi 10 MB dan oshmasligi kerak.' }, { status: 413 });

    const fileExt = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'bin';
    const filePath = `bugs/${crypto.randomUUID()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await auth.client.storage
      .from('bug-attachments')
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('Supabase storage upload failed:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 502 });
    }

    const { data } = auth.client.storage.from('bug-attachments').getPublicUrl(filePath);
    if (!data.publicUrl) return NextResponse.json({ error: 'Storage public URL qaytarmadi.' }, { status: 502 });
    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Upload handler error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
