import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAuthenticatedServerClient } from '@/lib/supabase/server-auth';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

export async function GET(request: NextRequest) {
  const context = await createAuthenticatedServerClient();
  if (!context) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { data: profile, error: profileError } = await context.client.from('ifb_profiles').select('id').eq('auth_user_id', context.user.id).single();
  if (profileError || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  const { data, error } = await context.client.from('ifb_mcp_tokens').select('id,name,token_prefix,scopes,expires_at,last_used_at,revoked_at,created_at').eq('profile_id', profile.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tokens: data || [], endpoint: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/api/mcp` });
}

export async function POST(request: NextRequest) {
  const context = await createAuthenticatedServerClient();
  if (!context) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const action = body.action;
  const { data: profile, error: profileError } = await context.client.from('ifb_profiles').select('id').eq('auth_user_id', context.user.id).single();
  if (profileError || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  if (action === 'revoke') {
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'Token id required' }, { status: 400 });
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    if (!adminKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: 'Server MCP secret is not configured.' }, { status: 503 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, adminKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.from('ifb_mcp_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', body.id).eq('profile_id', profile.id).is('revoked_at', null).select('id').maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ revoked: Boolean(data) });
  }

  if (action !== 'create') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 64) : 'AI Agent';
  const allowed = ['projects:read','projects:create','projects:update','notifications:read','notifications:update','activity:read','invites:create','invites:read','invites:revoke','bugs:read','bugs:create','bugs:update','comments:read','comments:create','members:read','spaces:discover'];
  const scopes = Array.isArray(body.scopes) ? [...new Set(body.scopes.filter((s: unknown) => typeof s === 'string' && allowed.includes(s as string)))] : allowed;
  if (!scopes.length) return NextResponse.json({ error: 'At least one permission is required' }, { status: 400 });
  const token = `ifbm_${randomBytes(32).toString('base64url')}`;
  const expiresAt = body.expiresInDays === 30 ? new Date(Date.now() + 30 * 86400000).toISOString() : body.expiresInDays === 90 ? new Date(Date.now() + 90 * 86400000).toISOString() : null;
  const { data, error } = await context.client.from('ifb_mcp_tokens').insert({ profile_id: profile.id, name: name || 'AI Agent', token_hash: hash(token), token_prefix: token.slice(0, 13), scopes, expires_at: expiresAt }).select('id,name,token_prefix,scopes,expires_at,created_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token, record: data }, { status: 201 });
}
