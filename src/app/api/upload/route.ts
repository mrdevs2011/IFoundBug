import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `evidence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `bugs/${fileName}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from('bug-attachments')
          .upload(filePath, buffer, {
            contentType: file.type || 'image/png',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('bug-attachments')
            .getPublicUrl(filePath);

          return NextResponse.json({ url: publicUrlData.publicUrl });
        }
      } catch (err) {
        console.warn('Supabase storage upload error:', err);
      }
    }

    // Fallback: Convert to Base64 data URL
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type || 'image/png'};base64,${buffer.toString('base64')}`;
    return NextResponse.json({ url: base64 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
