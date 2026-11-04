import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const cryptoRandomToken = () => randomBytes(24).toString('base64url');
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');
const jsonRpc = (id: unknown, result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result });
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const tool = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []) => ({ name, description, inputSchema: { type: 'object', properties, required, additionalProperties: false } });

const tools = [
  tool('who_am_i', 'Return the authenticated IFoundBug account identity and effective permissions.'),
  tool('create_project', 'Create a new workspace owned by this account.', { name: { type: 'string' }, description: { type: 'string' }, is_public: { type: 'boolean', default: false }, allow_guest_reports: { type: 'boolean', default: false }, tech_stack: { type: 'array', items: { type: 'string' } } }, ['name']),
  tool('list_projects', 'List projects and workspaces visible to this account, including public spaces.', { include_public: { type: 'boolean', default: true } }),
  tool('discover_public_spaces', 'Discover public community spaces that accept bug reports.', { search: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 } }),
  tool('list_bugs', 'List bugs in a project by project UUID or slug. Only visible bugs are returned.', { project: { type: 'string' }, status: { type: 'string' }, severity: { type: 'string' }, search: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 } }, ['project']),
  tool('get_bug', 'Read one bug by UUID or bug code in a project.', { project: { type: 'string' }, bug: { type: 'string' } }, ['project','bug']),
  tool('create_bug', 'Create a bug in a project you belong to, or in a public space that allows guest reports.', { project: { type: 'string' }, title: { type: 'string' }, summary: { type: 'string' }, section: { type: 'string' }, severity: { type: 'string', enum: ['CRITICAL','HIGH','MEDIUM','LOW'] }, priority: { type: 'string', enum: ['P0','P1','P2','P3'] }, environment: { type: 'string', enum: ['PRODUCTION','STAGING','DEVELOPMENT','LOCAL'] }, actual_behavior: { type: 'string' }, expected_behavior: { type: 'string' }, steps_to_reproduce: { type: 'array', items: { type: 'string' } }, evidence_urls: { type: 'array', items: { type: 'string' } } }, ['project','title']),
  tool('update_bug', 'Update bug status, severity, priority, assignment, notes or descriptive fields. Membership/role is enforced.', { bug: { type: 'string' }, status: { type: 'string', enum: ['REPORTED','TRIAGED','IN_PROGRESS','READY_FOR_QA','VERIFIED','FIXED','CLOSED','WONT_FIX'] }, severity: { type: 'string', enum: ['CRITICAL','HIGH','MEDIUM','LOW'] }, priority: { type: 'string', enum: ['P0','P1','P2','P3'] }, assigned_to: { type: 'string' }, dev_notes: { type: 'string' }, title: { type: 'string' }, summary: { type: 'string' } }, ['bug']),
  tool('list_comments', 'List discussion comments for a bug. Internal comments are hidden from non-privileged members.', { bug: { type: 'string' } }, ['bug']),
  tool('add_comment', 'Add a comment to a bug in a project where you have write access.', { bug: { type: 'string' }, content: { type: 'string' }, internal: { type: 'boolean', default: false } }, ['bug','content']),
  tool('list_members', 'List members and roles for a project you can access.', { project: { type: 'string' } }, ['project']),
  tool('create_invite', 'Create a role-limited invitation link for a project. Only owners/admins can invite.', { project: { type: 'string' }, role: { type: 'string', enum: ['admin','developer','qa_tester','hunter','viewer','team_lead','product_manager'] }, max_uses: { type: 'integer', minimum: 1, maximum: 500 }, expires_in_days: { type: 'integer', minimum: 1, maximum: 365 } }, ['project']),
  tool('list_invites', 'List invitation links for a project. Only owners/admins can view them.', { project: { type: 'string' } }, ['project']),
  tool('revoke_invite', 'Revoke an invitation link. Only owners/admins can revoke it.', { invite_id: { type: 'string' } }, ['invite_id']),
];

async function handle(request: NextRequest) {
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.match(/^Bearer\s+(ifbm_[A-Za-z0-9_-]{30,})$/i)?.[1];
  if (!bearer) return NextResponse.json({ error: 'A valid Bearer token is required.' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return NextResponse.json({ error: 'MCP server is not configured. Set SUPABASE_SERVICE_ROLE_KEY (server-only) in Vercel.' }, { status: 503 });
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: tokenRow, error: tokenError } = await db.from('ifb_mcp_tokens').select('id,profile_id,scopes,expires_at,revoked_at').eq('token_hash', sha256(bearer)).maybeSingle();
  if (tokenError || !tokenRow || tokenRow.revoked_at || (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() <= Date.now())) return NextResponse.json({ error: 'Token is invalid, expired, or revoked.' }, { status: 401 });
  const scopes = new Set<string>(tokenRow.scopes || []);
  const { data: profile } = await db.from('ifb_profiles').select('id,auth_user_id,username,full_name,role').eq('id', tokenRow.profile_id).single();
  if (!profile) return NextResponse.json({ error: 'Account profile not found.' }, { status: 401 });
  await db.from('ifb_mcp_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', tokenRow.id);

  const has = (scope: string) => scopes.has(scope);
  const { count: recentCalls } = await db.from('ifb_mcp_audit_logs').select('id', { count: 'exact', head: true }).eq('token_id', tokenRow.id).gte('created_at', new Date(Date.now()-60_000).toISOString());
  if ((recentCalls || 0) >= 120) return NextResponse.json(rpcError(null,-32000,'Rate limit exceeded: max 120 MCP requests per minute.'),{status:429});
  const audit = async (method:string, toolName:string|null, success:boolean, errorCode:string|null=null) => { await db.from('ifb_mcp_audit_logs').insert({token_id:tokenRow.id,profile_id:profile.id,method,tool_name:toolName,success,error_code:errorCode}); };
  
  const requireScope = (scope: string) => { if (!has(scope)) throw new Error(`Permission denied: missing ${scope}`); };
  const resolveProject = async (value: string) => {
    const query = db.from('ifb_projects').select('*');
    const { data, error } = /^[0-9a-f-]{36}$/i.test(value) ? await query.eq('id', value).maybeSingle() : await query.eq('slug', value).maybeSingle();
    if (error || !data) throw new Error('Project/space not found.');
    const { data: member } = await db.from('ifb_project_members').select('role').eq('project_id', data.id).eq('user_id', profile.id).maybeSingle();
    if (!member && !data.is_public) throw new Error('You do not have access to this private space.');
    return { project: data, member };
  };
  const resolveBug = async (value: string) => {
    const query = db.from('ifb_bugs').select('*');
    const { data: bug, error } = /^[0-9a-f-]{36}$/i.test(value) ? await query.eq('id', value).maybeSingle() : await query.eq('code', value).maybeSingle();
    if (error || !bug) throw new Error('Bug not found.');
    const { project, member } = await resolveProject(bug.project_id);
    return { bug, project, member };
  };
  const canWrite = (member: { role: string } | null) => Boolean(member && ['owner','admin','developer','qa_tester','team_lead','product_manager'].includes(member.role));

  const callTool = async (name: string, a: Record<string, unknown>) => {
    switch (name) {
      case 'who_am_i': return { id: profile.id, username: profile.username, full_name: profile.full_name, role: profile.role, scopes: [...scopes] };
      case 'create_project': {
        requireScope('projects:create'); const name=String(a.name||'').trim(); if(!name||name.length>100)throw new Error('Project name must be 1-100 characters.');
        const {data,error}=await db.from('ifb_projects').insert({name,description:String(a.description||''),is_public:Boolean(a.is_public),allow_guest_reports:Boolean(a.allow_guest_reports),tech_stack:Array.isArray(a.tech_stack)?a.tech_stack.slice(0,20):[],created_by:profile.id}).select('id,name,slug,description,is_public,allow_guest_reports,tech_stack,created_at').single(); if(error)throw error; return data;
      }
      case 'list_projects': {
        requireScope('projects:read');
        const { data: memberships } = await db.from('ifb_project_members').select('project_id,role').eq('user_id', profile.id);
        const ids = (memberships || []).map((m) => m.project_id);
        const q = db.from('ifb_projects').select('id,name,slug,description,is_public,allow_guest_reports,tech_stack,created_at').order('created_at', { ascending: false }).limit(100);
        const { data: rows, error } = await q;
        if (error) throw error;
        return (rows || []).filter((p) => ids.includes(p.id) || (a.include_public !== false && p.is_public)).map((p) => ({ ...p, membership_role: (memberships || []).find((m) => m.project_id === p.id)?.role || null }));
      }
      case 'discover_public_spaces': {
        requireScope('spaces:discover');
        let q = db.from('ifb_projects').select('id,name,slug,description,tech_stack,allow_guest_reports,created_at').eq('is_public', true).order('created_at', { ascending: false }).limit(Math.min(Math.max(Number(a.limit) || 20,1),50));
        if (typeof a.search === 'string' && a.search.trim()) q = q.or(`name.ilike.%${a.search.trim().replace(/[(),]/g,' ')}%,description.ilike.%${a.search.trim().replace(/[(),]/g,' ')}%`);
        const { data, error } = await q; if (error) throw error; return data || [];
      }
      case 'list_bugs': {
        requireScope('bugs:read'); const { project } = await resolveProject(String(a.project));
        let q = db.from('ifb_bugs').select('id,code,project_id,title,summary,section,severity,priority,status,environment,actual_behavior,expected_behavior,steps_to_reproduce,evidence_urls,reporter_name,created_at,updated_at').eq('project_id', project.id).order('created_at',{ascending:false}).limit(Math.min(Math.max(Number(a.limit)||50,1),100));
        if (a.status) q=q.eq('status',a.status); if(a.severity) q=q.eq('severity',a.severity); if(a.search) q=q.ilike('title',`%${String(a.search).slice(0,80)}%`);
        const {data,error}=await q;if(error)throw error;return data||[];
      }
      case 'get_bug': { requireScope('bugs:read'); const {project}=await resolveProject(String(a.project)); const {data,error}=await db.from('ifb_bugs').select('*').eq('project_id',project.id).or(`id.eq.${String(a.bug)},code.eq.${String(a.bug)}`).maybeSingle(); if(error||!data)throw new Error('Bug not found in this project.'); return {project:{id:project.id,name:project.name,slug:project.slug},bug:data}; }
      case 'create_bug': {
        requireScope('bugs:create'); const {project,member}=await resolveProject(String(a.project)); if(!member && !(project.is_public && project.allow_guest_reports))throw new Error('This public space does not accept guest bug reports.');
        const title=String(a.title||'').trim();if(!title||title.length>180)throw new Error('Title is required and must be at most 180 characters.');
        const payload={project_id:project.id,title,summary:String(a.summary||''),section:String(a.section||'General'),severity:a.severity||'MEDIUM',priority:a.priority||'P2',environment:a.environment||'PRODUCTION',actual_behavior:String(a.actual_behavior||''),expected_behavior:String(a.expected_behavior||''),steps_to_reproduce:Array.isArray(a.steps_to_reproduce)?a.steps_to_reproduce.slice(0,30):[],evidence_urls:Array.isArray(a.evidence_urls)?a.evidence_urls.slice(0,10):[],reported_by:profile.id,reporter_name:profile.full_name};
        const {data,error}=await db.from('ifb_bugs').insert(payload).select('*').single();if(error)throw error;
        await db.from('ifb_bug_audit_logs').insert({bug_id:data.id,actor_name:profile.full_name,action:'MCP_BUG_CREATED',details:{token_id:tokenRow.id}});return data;
      }
      case 'update_bug': {
        requireScope('bugs:update'); const {bug,member}=await resolveBug(String(a.bug));if(!canWrite(member))throw new Error('Only project members with a write role can update bugs.');
        const allowed=['status','severity','priority','assigned_to','dev_notes','title','summary'];const patch:Record<string,unknown>={};for(const k of allowed)if(a[k]!==undefined)patch[k]=a[k];if(!Object.keys(patch).length)throw new Error('No supported fields provided.');patch.updated_at=new Date().toISOString();
        const {data,error}=await db.from('ifb_bugs').update(patch).eq('id',bug.id).select('*').single();if(error)throw error;
        await db.from('ifb_bug_audit_logs').insert({bug_id:bug.id,actor_name:profile.full_name,action:'MCP_BUG_UPDATED',details:{fields:Object.keys(patch),token_id:tokenRow.id}});return data;
      }
      case 'list_comments': { requireScope('comments:read');const {bug,member}=await resolveBug(String(a.bug));let q=db.from('ifb_bug_comments').select('id,bug_id,author_name,content,is_internal,created_at').eq('bug_id',bug.id).order('created_at',{ascending:true}).limit(100);if(!member||!['owner','admin','developer','team_lead','product_manager'].includes(member.role))q=q.eq('is_internal',false);const {data,error}=await q;if(error)throw error;return data||[]; }
      case 'add_comment': { requireScope('comments:create');const {bug,member}=await resolveBug(String(a.bug));if(!member && !(await resolveProject(bug.project_id)).project.allow_guest_reports)throw new Error('No permission to comment in this space.');if(a.internal&&!member?.role.match(/owner|admin|developer|team_lead|product_manager/))throw new Error('Internal comments require a project team role.');const content=String(a.content||'').trim();if(!content||content.length>10000)throw new Error('Comment must be 1-10000 characters.');const {data,error}=await db.from('ifb_bug_comments').insert({bug_id:bug.id,author_id:profile.id,author_name:profile.full_name,content,is_internal:Boolean(a.internal)}).select('*').single();if(error)throw error;return data; }
      case 'list_members': { requireScope('members:read');const {project}=await resolveProject(String(a.project));const {data,error}=await db.from('ifb_project_members').select('role,user:ifb_profiles(id,username,full_name,avatar_url)').eq('project_id',project.id);if(error)throw error;return data||[]; }
      case 'create_invite': { requireScope('invites:create'); const {project,member}=await resolveProject(String(a.project)); if(!member||!['owner','admin'].includes(member.role))throw new Error('Only project owners/admins can create invites.'); const token=cryptoRandomToken(); const days=Math.min(Math.max(Number(a.expires_in_days)||30,1),365); const {data,error}=await db.from('ifb_project_invites').insert({project_id:project.id,token,role:a.role||'developer',max_uses:Math.min(Math.max(Number(a.max_uses)||100,1),500),expires_at:new Date(Date.now()+days*86400000).toISOString(),created_by:profile.id}).select('id,role,max_uses,uses_count,expires_at,created_at').single(); if(error)throw error; return {...data,url:`${process.env.NEXT_PUBLIC_APP_URL||'https://ifoundbug.vercel.app'}/invite/${token}`}; }
      case 'list_invites': { requireScope('invites:read');const {project,member}=await resolveProject(String(a.project));if(!member||!['owner','admin'].includes(member.role))throw new Error('Only project owners/admins can view invites.');const {data,error}=await db.from('ifb_project_invites').select('id,role,max_uses,uses_count,expires_at,created_at').eq('project_id',project.id).order('created_at',{ascending:false});if(error)throw error;return data||[]; }
      case 'revoke_invite': { requireScope('invites:revoke');const {data:invite,error}=await db.from('ifb_project_invites').select('id,project_id').eq('id',String(a.invite_id)).maybeSingle();if(error||!invite)throw new Error('Invite not found.');const {member}=await resolveProject(invite.project_id);if(!member||!['owner','admin'].includes(member.role))throw new Error('Only project owners/admins can revoke invites.');const {error:deleteError}=await db.from('ifb_project_invites').delete().eq('id',invite.id);if(deleteError)throw deleteError;return {revoked:true,id:invite.id}; }
      default: throw new Error(`Unknown tool: ${name}`);
    }
  };

  const body = await request.json().catch(() => null);
  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') return NextResponse.json(rpcError(null,-32600,'Invalid JSON-RPC request.'),{status:400});
  if (body.method === 'initialize') return NextResponse.json(jsonRpc(body.id,{protocolVersion:'2025-03-26',capabilities:{tools:{listChanged:false}},serverInfo:{name:'ifoundbug-mcp',version:'1.0.0'}}));
  if (body.method === 'notifications/initialized' || body.method === 'ping') return body.id === undefined ? new NextResponse(null,{status:202}) : NextResponse.json(jsonRpc(body.id,{}));
  if (body.method === 'tools/list') { await audit(body.method,null,true); return NextResponse.json(jsonRpc(body.id,{tools})); }
  if (body.method === 'tools/call') {
    const name=body.params?.name;const args=body.params?.arguments||{};if(typeof name!=='string')return NextResponse.json(rpcError(body.id,-32602,'Tool name is required.'));
    try { const result=await callTool(name,args); await audit(body.method,name,true); return NextResponse.json(jsonRpc(body.id,{content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result,isError:false})); }
    catch(error){ await audit(body.method,name,false,'TOOL_EXECUTION_FAILED'); return NextResponse.json(jsonRpc(body.id,{content:[{type:'text',text:error instanceof Error?error.message:'Tool execution failed.'}],isError:true}));}
  }
  if (body.method === 'resources/list') { await audit(body.method,null,true); return NextResponse.json(jsonRpc(body.id,{resources:[{uri:'ifoundbug://account',name:'Account context',description:'Authenticated account and token scopes.',mimeType:'application/json'}]})); }
  if (body.method === 'resources/read') { if(body.params?.uri!=='ifoundbug://account')return NextResponse.json(rpcError(body.id,-32602,'Unknown resource.'));return NextResponse.json(jsonRpc(body.id,{contents:[{uri:'ifoundbug://account',mimeType:'application/json',text:JSON.stringify({id:profile.id,username:profile.username,full_name:profile.full_name,scopes:[...scopes]})}]})); }
  return NextResponse.json(rpcError(body.id,-32601,`Method not found: ${body.method}`));
}

export async function POST(request: NextRequest) { return handle(request); }
export async function GET() { return NextResponse.json({name:'IFoundBug MCP Server',version:'1.0.0',transport:'Streamable HTTP',endpoint:'/api/mcp',authentication:'Bearer token',protocol:'2025-03-26'}); }
