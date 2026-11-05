import { NextResponse } from 'next/server';
import { createAuthenticatedServerClient } from '@/lib/supabase/server-auth';

// Lists chats that recently messaged the bot, so the owner can pick a chat id
// without fiddling with the Telegram API. The token is used once and never stored here.
export async function POST(req: Request) {
  const auth = await createAuthenticatedServerClient();
  if (!auth) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const body = await req.json().catch(() => null) as { token?: string } | null;
  const token = String(body?.token || '').trim();
  if (!/^[0-9]{5,15}:[A-Za-z0-9_-]{30,64}$/.test(token)) return NextResponse.json({ error: 'Bot token looks wrong. Copy it from @BotFather.' }, { status: 400 });
  const [me, updates] = await Promise.all([
    fetch(`https://api.telegram.org/bot${token}/getMe`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100&allowed_updates=${encodeURIComponent('["message","my_chat_member","channel_post"]')}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
  ]);
  if (!me?.ok) return NextResponse.json({ error: 'Telegram rejected this token. Check it in @BotFather.' }, { status: 400 });
  if (updates && !updates.ok && updates.error_code === 409) {
    return NextResponse.json({ bot: me.result.username, chats: [], hint: 'This bot uses a webhook, so chats cannot be listed. Enter the chat id manually.' });
  }
  const chats = new Map<string, { id: string; title: string; type: string }>();
  for (const u of updates?.result || []) {
    const chat = u.message?.chat || u.my_chat_member?.chat || u.channel_post?.chat;
    if (!chat) continue;
    chats.set(String(chat.id), { id: String(chat.id), title: chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || String(chat.id), type: chat.type });
  }
  return NextResponse.json({ bot: me.result.username, chats: [...chats.values()].reverse() });
}
