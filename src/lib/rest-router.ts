// Maps REST requests to the shared IFB tools. Pure function so it can be unit-tested.
export type RestCall = { tool: string; args: Record<string, unknown> };

const num = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : undefined);
const clean = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export function routeRest(method: string, path: string[], query: URLSearchParams, body: Record<string, unknown>): RestCall | null {
  const m = method.toUpperCase();
  const [a, b, c, d, e] = path.map((p) => decodeURIComponent(p));
  const n = path.length;
  if (m === 'POST' && a === 'tools' && n === 2) return { tool: b, args: body };
  if (m === 'GET' && a === 'me' && n === 1) return { tool: 'who_am_i', args: {} };
  if (m === 'GET' && a === 'search' && n === 1) return { tool: 'search_bugs', args: clean({ q: query.get('q') || '', project: query.get('repo'), limit: num(query.get('limit')) }) };
  if (m === 'GET' && a === 'inbox' && n === 1) return { tool: 'whats_new', args: clean({ since: query.get('since'), project: query.get('repo'), only_open: query.get('only_open') === 'false' ? false : undefined, limit: num(query.get('limit')) }) };
  if (m === 'GET' && a === 'notifications' && n === 1) return { tool: 'list_notifications', args: clean({ limit: num(query.get('limit')), unread_only: query.get('unread') === 'true' ? true : undefined }) };
  if (a === 'repos') {
    if (m === 'GET' && n === 1) return { tool: 'list_projects', args: clean({ include_public: query.get('include_public') === 'false' ? false : undefined }) };
    if (m === 'POST' && n === 1) return { tool: 'create_project', args: body };
    if (m === 'PATCH' && n === 2) return { tool: 'update_project', args: { ...body, project: b } };
    if (m === 'GET' && n === 3 && c === 'issues') return { tool: 'list_bugs', args: clean({ project: b, status: query.get('status'), severity: query.get('severity'), search: query.get('search'), limit: num(query.get('limit')) }) };
    if (m === 'POST' && n === 3 && c === 'issues') return Array.isArray(body.bugs) ? { tool: 'create_bugs', args: { ...body, project: b } } : { tool: 'create_bug', args: { ...body, project: b } };
    if (m === 'GET' && n === 4 && c === 'issues') return { tool: 'get_bug', args: { project: b, bug: d } };
    if (m === 'GET' && n === 3 && c === 'members') return { tool: 'list_members', args: { project: b } };
    if (m === 'GET' && n === 3 && c === 'insights') return { tool: 'get_insights', args: { project: b } };
    if (m === 'GET' && n === 3 && c === 'invites') return { tool: 'list_invites', args: { project: b } };
    if (m === 'POST' && n === 3 && c === 'invites') return { tool: 'create_invite', args: { ...body, project: b } };
  }
  if (a === 'issues') {
    if (m === 'PATCH' && n === 1) return { tool: 'bulk_update_bugs', args: body };
    if (m === 'PATCH' && n === 2) return { tool: 'update_bug', args: { ...body, bug: b } };
    if (m === 'GET' && n === 3 && c === 'comments') return { tool: 'list_comments', args: { bug: b } };
    if (m === 'POST' && n === 3 && c === 'comments') return { tool: 'add_comment', args: { ...body, bug: b } };
    if (m === 'GET' && n === 3 && c === 'activity') return { tool: 'get_bug_activity', args: { bug: b } };
    if (m === 'POST' && n === 3 && c === 'images') return { tool: 'import_github_images', args: { ...body, bug: b } };
  }
  void e;
  return null;
}

/** HTTP status for a tool error message. */
export function statusForError(message: string): number {
  if (/^Permission denied|^Only |require[s]? a|write role|cannot|not accept/i.test(message)) return 403;
  if (/not found|access denied/i.test(message)) return 404;
  if (/rate limit/i.test(message)) return 429;
  return 400;
}

export const REST_ENDPOINTS = [
  'GET    /api/v1/me',
  'GET    /api/v1/repos',
  'POST   /api/v1/repos                         {name, description?, is_public?}',
  'PATCH  /api/v1/repos/{repo}',
  'GET    /api/v1/repos/{repo}/issues?status=&severity=&search=&limit=',
  'POST   /api/v1/repos/{repo}/issues            {title, ...} or {bugs:[...]} for batch',
  'GET    /api/v1/repos/{repo}/issues/{code}',
  'GET    /api/v1/repos/{repo}/members',
  'GET    /api/v1/repos/{repo}/insights',
  'GET    /api/v1/repos/{repo}/invites | POST {role?, max_uses?, expires_in_days?}',
  'PATCH  /api/v1/issues/{code}                 {status?, severity?, priority?, assigned_to?, dev_notes?, title?, summary?}',
  'PATCH  /api/v1/issues                        {bugs:[codes], status?, ..., comment?}',
  'GET    /api/v1/issues/{code}/comments | POST {content, internal?}',
  'GET    /api/v1/issues/{code}/activity',
  'POST   /api/v1/issues/{code}/images          {repo, path, ref?}',
  'GET    /api/v1/search?q=&repo=&limit=',
  'GET    /api/v1/inbox?since=24h&repo=',
  'GET    /api/v1/notifications?unread=true',
  'POST   /api/v1/tools/{tool}                  any MCP tool with its JSON arguments',
];
