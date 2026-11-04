import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { bot_token, chat_id, bug, project_name, project_slug, origin } = await req.json();

    if (!bot_token || !chat_id) {
      return NextResponse.json({ success: false, message: 'Telegram bot_token yoki chat_id berilmagan' }, { status: 400 });
    }

    const appOrigin = origin || process.env.NEXT_PUBLIC_APP_URL || 'https://i-found-bug.vercel.app';
    const bugUrl = `${appOrigin}/p/${project_slug}/bugs/${bug.code || bug.id}`;

    const severityTag = {
      CRITICAL: '[CRITICAL]',
      HIGH: '[HIGH]',
      MEDIUM: '[MEDIUM]',
      LOW: '[LOW]',
    }[bug.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'] || '[BUG]';

    const text = `
${severityTag} *${bug.title}*
━━━━━━━━━━━━━━━━━━
*Kod:* \`${bug.code}\`
*Loyiha:* *${project_name}*
*Bo'lim:* ${bug.section} • ${bug.screen || 'Asosiy'}
*Holat:* ${bug.status} | *Muhit:* ${bug.environment}
*Report:* ${bug.reporter_name || 'Dasturchi'}

*Haqiqiy holat:*
${bug.actual_behavior}

*Havola:*
[IFoundBug orqali ochish](${bugUrl})
`.trim();

    const response = await fetch(`https://api.telegram.org/bot${bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ success: data.ok, result: data });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Telegram notification error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
