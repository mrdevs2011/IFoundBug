import { createAuthenticatedServerClient } from '@/lib/supabase/server-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const auth = await createAuthenticatedServerClient();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const projectId = typeof body.project_id === 'string' ? body.project_id : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';

    if (!projectId || !title) {
      return NextResponse.json({ error: 'project_id va title majburiy.' }, { status: 400 });
    }

    // PostgreSQL generates the UUID, bug code, timestamps, counters and reporter identity.
    const payload = {
      project_id: projectId,
      title,
      ...(body.summary !== undefined && { summary: body.summary }),
      ...(body.section !== undefined && { section: body.section }),
      ...(body.screen !== undefined && { screen: body.screen }),
      ...(body.severity !== undefined && { severity: body.severity }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.environment !== undefined && { environment: body.environment }),
      ...(body.actual_behavior !== undefined && { actual_behavior: body.actual_behavior }),
      ...(body.expected_behavior !== undefined && { expected_behavior: body.expected_behavior }),
      ...(body.steps_to_reproduce !== undefined && { steps_to_reproduce: body.steps_to_reproduce }),
      ...(body.acceptance_criteria !== undefined && { acceptance_criteria: body.acceptance_criteria }),
      ...(body.device_telemetry !== undefined && { device_telemetry: body.device_telemetry }),
      ...(body.dev_notes !== undefined && { dev_notes: body.dev_notes }),
      ...(body.evidence_urls !== undefined && { evidence_urls: body.evidence_urls }),
      ...(body.is_sensitive !== undefined && { is_sensitive: body.is_sensitive }),
    };

    const { data: bug, error } = await auth.client
      .from('ifb_bugs')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('API bug insert failed:', error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }

    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChat) {
      const text = `*[Yangi Bug Qayd Etildi]* [${bug.code}]\n\n*Sarlavha:* ${bug.title}\n*Bo‘lim:* ${bug.section}\n*Jiddiylik:* ${bug.severity} (${bug.priority})\n*Xabar beruvchi:* ${bug.reporter_name}`;
      try {
        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChat, text, parse_mode: 'Markdown' }),
        });
      } catch (telegramError) {
        console.warn('Telegram notification failed:', telegramError);
      }
    }

    return NextResponse.json({ success: true, bug }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Error reporting bug:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
