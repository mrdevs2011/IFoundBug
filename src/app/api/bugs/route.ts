import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      project_id,
      title,
      summary,
      section = 'UI',
      screen = 'Main',
      severity = 'MEDIUM',
      priority = 'P2',
      environment = 'PRODUCTION',
      actual_behavior,
      expected_behavior,
      steps_to_reproduce = [],
      acceptance_criteria = [],
      device_telemetry = {},
      dev_notes = '',
      evidence_urls = [],
      is_sensitive = false,
      reporter_name = 'Web Widget User',
    } = body;

    const newBug = {
      code: `IFB-${Math.floor(100 + Math.random() * 900)}`,
      project_id: project_id || 'b0000000-0000-0000-0000-000000000001',
      title,
      summary: summary || actual_behavior,
      section,
      screen,
      severity,
      priority,
      status: 'REPORTED',
      environment,
      actual_behavior: actual_behavior || title,
      expected_behavior: expected_behavior || 'To‘g‘ri ishlashi kerak',
      steps_to_reproduce,
      acceptance_criteria,
      device_telemetry,
      dev_notes,
      evidence_urls,
      is_sensitive,
      reporter_name,
      upvotes_count: 1,
      reproduced_count: 1,
      views_count: 1,
    };

    // If Supabase is connected, save into ifb_bugs
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('ifb_bugs').insert([newBug]);
      if (error) {
        console.error('Supabase insert bug error:', error);
      }
    }

    // Optional Telegram notification if bot token & chat id env exist
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChat) {
      try {
        const text = `🚨 *Yangi Bug Topildi!* [${newBug.code}]\n\n📌 *Sarlavha:* ${title}\n📍 *Bo‘lim:* ${section}\n🔴 *Jiddiylik:* ${severity} (${priority})\n📱 *Telemetriya:* ${device_telemetry.os || 'N/A'}, ${device_telemetry.browser || 'N/A'}\n\n❌ *Xato:* ${actual_behavior}\n✅ *Kutilgan:* ${expected_behavior}\n\n👤 *Xabar beruvchi:* ${reporter_name}`;
        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChat,
            text,
            parse_mode: 'Markdown',
          }),
        });
      } catch (tgErr) {
        console.warn('Telegram notification failed:', tgErr);
      }
    }

    return NextResponse.json({ success: true, bug: newBug });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Error reporting bug:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
