import { NextRequest, NextResponse } from 'next/server';
import { openToolSession, tools } from '@/lib/ifb-tools';

const jsonRpc = (id: unknown, result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result });
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

async function handle(request: NextRequest) {
  const opened = await openToolSession(request);
  if (!opened.ok) {
    if (opened.status === 429) return NextResponse.json(rpcError(null, -32000, opened.error), { status: 429 });
    return NextResponse.json({ error: opened.error }, { status: opened.status, headers: opened.status === 401 ? { 'WWW-Authenticate': 'Bearer' } : undefined });
  }
  const { profile, scopes, callTool, audit } = opened.session;
  const body = await request.json().catch(() => null);
  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') return NextResponse.json(rpcError(null,-32600,'Invalid JSON-RPC request.'),{status:400});
  if (body.method === 'initialize') return NextResponse.json(jsonRpc(body.id,{protocolVersion:'2025-03-26',capabilities:{tools:{listChanged:false}},serverInfo:{name:'foundbug-mcp',version:'1.0.0'}}));
  if (body.method === 'notifications/initialized' || body.method === 'ping') return body.id === undefined ? new NextResponse(null,{status:202}) : NextResponse.json(jsonRpc(body.id,{}));
  if (body.method === 'tools/list') { await audit(body.method,null,true); return NextResponse.json(jsonRpc(body.id,{tools})); }
  if (body.method === 'tools/call') {
    const name=body.params?.name;const args=body.params?.arguments||{};if(typeof name!=='string')return NextResponse.json(rpcError(body.id,-32602,'Tool name is required.'));
    try {
      const result = await callTool(name, args);
      await audit(body.method, name, true);
      const structuredContent: Record<string, unknown> = Array.isArray(result)
        ? { items: result, count: result.length, [name]: result }
        : (typeof result === 'object' && result !== null
            ? (result as Record<string, unknown>)
            : { value: result });
      return NextResponse.json(jsonRpc(body.id, {
        content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
        structuredContent,
        isError: false,
      }));
    }
    catch(error){ await audit(body.method,name,false,'TOOL_EXECUTION_FAILED'); return NextResponse.json(jsonRpc(body.id,{content:[{type:'text',text:error instanceof Error?error.message:'Tool execution failed.'}],isError:true}));}
  }
  if (body.method === 'resources/list') { await audit(body.method,null,true); return NextResponse.json(jsonRpc(body.id,{resources:[{uri:'ifoundbug://account',name:'Account context',description:'Authenticated account and token scopes.',mimeType:'application/json'}]})); }
  if (body.method === 'resources/read') { if(body.params?.uri!=='ifoundbug://account')return NextResponse.json(rpcError(body.id,-32602,'Unknown resource.'));return NextResponse.json(jsonRpc(body.id,{contents:[{uri:'ifoundbug://account',mimeType:'application/json',text:JSON.stringify({id:profile.id,username:profile.username,full_name:profile.full_name,scopes:[...scopes]})}]})); }
  return NextResponse.json(rpcError(body.id,-32601,`Method not found: ${body.method}`));
}

export async function POST(request: NextRequest) { return handle(request); }
export async function GET() { return NextResponse.json({name:'FoundBug MCP Server',version:'1.0.0',transport:'Streamable HTTP',endpoint:'/api/mcp',authentication:'Bearer token',protocol:'2025-03-26'}); }
