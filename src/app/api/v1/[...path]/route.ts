import { NextRequest, NextResponse } from 'next/server';
import { openToolSession } from '@/lib/ifb-tools';
import { routeRest, statusForError } from '@/lib/rest-router';

// Token auth only (no cookies), so cross-origin use is safe.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS' };
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => NextResponse.json(body, { status, headers: { ...CORS, 'Cache-Control': 'no-store', ...extra } });

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  let body: Record<string, unknown> = {};
  if (request.method !== 'GET') {
    const parsed = await request.json().catch(() => undefined);
    if (parsed !== undefined && (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))) return json({ error: 'Body must be a JSON object.' }, 400);
    body = (parsed as Record<string, unknown>) || {};
  }
  const call = routeRest(request.method, path, request.nextUrl.searchParams, body);
  if (!call) return json({ error: `No endpoint for ${request.method} /api/v1/${path.join('/')}. See GET /api/v1.` }, 404);
  const opened = await openToolSession(request);
  if (!opened.ok) return json({ error: opened.error }, opened.status, opened.status === 401 ? { 'WWW-Authenticate': 'Bearer' } : {});
  const { callTool, audit } = opened.session;
  try {
    const data = await callTool(call.tool, call.args);
    await audit('rest', call.tool, true);
    return json({ data }, request.method === 'POST' && !call.tool.startsWith('list') ? 201 : 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : 'Request failed.');
    await audit('rest', call.tool, false, 'TOOL_EXECUTION_FAILED');
    return json({ error: message }, statusForError(message));
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }); }
