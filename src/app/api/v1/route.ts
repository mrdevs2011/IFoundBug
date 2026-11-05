import { NextResponse } from 'next/server';
import { tools } from '@/lib/ifb-tools';
import { REST_ENDPOINTS } from '@/lib/rest-router';

export function GET() {
  return NextResponse.json({
    name: 'IFoundBug REST API',
    version: 'v1',
    auth: 'Authorization: Bearer ifbm_... (create a token in Account menu → MCP settings; scopes apply)',
    rate_limit: '120 requests per minute per token (shared with MCP)',
    errors: '{ "error": "message" } with 400/401/403/404/429',
    endpoints: REST_ENDPOINTS,
    tools: tools.map((t) => ({ name: t.name, description: t.description })),
    webhooks: 'Repository → Settings → Integrations. Signed with X-IFB-Signature: sha256=HMAC(secret, raw body).',
  }, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
