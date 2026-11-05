import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMcpCurl } from '../src/lib/mcp.ts';

test('MCP cURL setup includes the one-time token and configured endpoint', () => {
  const command = buildMcpCurl('https://ifoundbug.example/api/mcp', 'ifbm_test-token');
  assert.match(command, /--oauth2-bearer 'ifbm_test-token'/);
  assert.match(command, /'https:\/\/ifoundbug\.example\/api\/mcp'/);
  assert.match(command, /tools\/list/);
});

test('MCP cURL setup safely quotes shell values', () => {
  const command = buildMcpCurl("https://example.test/o'hare", "token'with-quote");
  assert.match(command, /token'\\''with-quote/);
  assert.match(command, /o'\\''hare/);
});

test('attachment proxy accepts only UUID-backed bug object paths', () => {
  const valid = /^bugs\/[0-9a-f-]{36}\.(?:jpe?g|png|webp|gif|pdf|txt)$/i;
  assert.equal(valid.test('bugs/123e4567-e89b-12d3-a456-426614174000.png'), true);
  assert.equal(valid.test('bugs/../../secrets.txt'), false);
  assert.equal(valid.test('avatars/123e4567-e89b-12d3-a456-426614174000.png'), false);
  assert.equal(valid.test('bugs/123e4567-e89b-12d3-a456-426614174000.svg'), false);
});

test('MCP issue updates are delegated to the transactional database contract', async () => {
  const { readFile } = await import('node:fs/promises');
  const route = await readFile(new URL('../src/lib/ifb-tools.ts', import.meta.url), 'utf8');
  const sql = await readFile(new URL('../sql/V2_PUBLIC_MODEL.sql', import.meta.url), 'utf8');
  assert.match(route, /rpc\('ifb_mcp_update_bug'/);
  assert.doesNotMatch(route, /from\('ifb_bugs'\)\.update\(patch\)/);
  assert.match(sql, /create or replace function public\.ifb_mcp_update_bug/);
  assert.match(sql, /request\.jwt\.claim\.role/);
  assert.match(sql, /<> 'service_role'/);
  assert.match(sql, /grant execute on function public\.ifb_mcp_update_bug\(uuid, uuid, jsonb\) to service_role/);
});


test('MCP service-role paths explicitly enforce private project visibility and guest reporting policy', async () => {
  const { readFile } = await import('node:fs/promises');
  const route = await readFile(new URL('../src/lib/ifb-tools.ts', import.meta.url), 'utf8');
  assert.match(route, /project\.is_public !== true/);
  assert.match(route, /project\.allow_guest_reports !== true/);
  assert.match(route, /Project not found or access denied/);
  assert.match(route, /does not accept guest issue reports/);
});

test('ifb_help returns topic sections and rejects unknown topics', async () => {
  const { helpText } = await import('../src/lib/mcp-help.ts');
  assert.match(helpText(), /import_github_images/);
  assert.match(helpText('images'), /GitHub/);
  assert.throws(() => helpText('nope'), /Unknown topic/);
});

test('GitHub evidence source validation blocks traversal and bad repos', async () => {
  const { parseGithubSource, sniffImage } = await import('../src/lib/github-evidence.ts');
  assert.equal(parseGithubSource({ repo: 'https://github.com/a/b.git', path: '/x/y.png' }).repo, 'a/b');
  assert.throws(() => parseGithubSource({ repo: 'a/b', path: '../secret' }), /Invalid path/);
  assert.throws(() => parseGithubSource({ repo: 'evil.com/x/y', path: 'a' }), /owner\/name/);
  assert.equal(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0])), 'png');
  assert.equal(sniffImage(new TextEncoder().encode('<svg></svg>')), null);
});

test('GitHub evidence fetch rejects non-raw download hosts', async () => {
  const { fetchGithubImages } = await import('../src/lib/github-evidence.ts');
  const fake = async () => new Response(JSON.stringify([{ type: 'file', name: 'a.png', size: 10, download_url: 'http://169.254.169.254/x' }]), { status: 200 });
  await assert.rejects(fetchGithubImages({ repo: 'a/b', path: 'x' }, fake), /downloadable/);
});

test('agent helpers: since windows, duplicate detection', async () => {
  const { parseSince, titleSimilarity, findDuplicate } = await import('../src/lib/mcp-agent.ts');
  const now = Date.parse('2026-11-05T12:00:00Z');
  assert.equal(parseSince('24h', now), '2026-11-04T12:00:00.000Z');
  assert.equal(parseSince('7d', now), '2026-10-29T12:00:00.000Z');
  assert.equal(parseSince('', now), '2026-11-04T12:00:00.000Z');
  assert.equal(parseSince('2026-11-01', now), '2026-11-01T00:00:00.000Z');
  assert.throws(() => parseSince('yesterday', now), /ISO date/);
  assert.throws(() => parseSince('9999d', now), /365/);
  assert.ok(titleSimilarity('Login button crashes on Safari', 'login button crashes on safari!') === 1);
  const pool = [{ code: 'IFB-1', title: 'Login button crashes on Safari' }, { code: 'IFB-2', title: 'Booking page shows wrong price' }];
  assert.equal(findDuplicate('Safari: login button crashes', pool)?.code, 'IFB-1');
  assert.equal(findDuplicate('Payment form freezes', pool), null);
});

test('agent MCP tools are registered and reuse the audited update RPC', async () => {
  const { readFile } = await import('node:fs/promises');
  const route = await readFile(new URL('../src/lib/ifb-tools.ts', import.meta.url), 'utf8');
  for (const name of ['whats_new', 'search_bugs', 'create_bugs', 'bulk_update_bugs']) {
    assert.match(route, new RegExp(`tool\\('${name}'`));
    assert.match(route, new RegExp(`case '${name}'`));
  }
  assert.equal((route.match(/rpc\('ifb_mcp_update_bug'/g) || []).length, 2);
  assert.doesNotMatch(route, /from\('ifb_bugs'\)\.update\(patch\)/);
});

test('ifb_help documents every MCP tool and its topics match the tool schema', async () => {
  const { readFile } = await import('node:fs/promises');
  const { helpText, HELP_TOPICS } = await import('../src/lib/mcp-help.ts');
  const route = await readFile(new URL('../src/lib/ifb-tools.ts', import.meta.url), 'utf8');
  const tools = [...route.matchAll(/tool\('([a-z_]+)'/g)].map((m) => m[1]);
  assert.ok(tools.length >= 20);
  const manual = helpText();
  for (const name of tools) assert.match(manual, new RegExp(`\\b${name}\\b`), `${name} missing from ifb_help`);
  for (const topic of HELP_TOPICS) { assert.match(route, new RegExp(`'${topic}'`)); assert.match(helpText(topic), new RegExp(`ifb_help: ${topic}`)); }
});

test('only avatars from our own public bucket are rendered', async () => {
  const { trustedAvatar } = await import('../src/lib/avatar.ts');
  const base = 'https://abc.supabase.co';
  const ok = `${base}/storage/v1/object/public/avatars/123e4567-e89b-12d3-a456-426614174000/123e4567-e89b-12d3-a456-426614174001.png`;
  assert.equal(trustedAvatar(ok, base), ok);
  assert.equal(trustedAvatar('https://images.unsplash.com/photo-1', base), null);
  assert.equal(trustedAvatar(`${base}/storage/v1/object/public/bug-attachments/x.png`, base), null);
  assert.equal(trustedAvatar(`${base}/storage/v1/object/public/avatars/../bug-attachments/x.png`, base), null);
  assert.equal(trustedAvatar(null, base), null);
});

test('V4 migration closes public storage read on bug attachments and scopes avatar writes to the owner folder', async () => {
  const { readFile } = await import('node:fs/promises');
  const sql = await readFile(new URL('../sql/V4_AVATARS.sql', import.meta.url), 'utf8');
  assert.match(sql, /drop policy if exists ifb_public_read_bug_attachments/);
  assert.equal((sql.match(/\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/g) || []).length, 4);
  assert.doesNotMatch(sql, /for select/i);
});

test('V7 webhooks: secrets are not exposed, SSRF guard and owner-only management exist', async () => {
  const { readFile } = await import('node:fs/promises');
  const sql = await readFile(new URL('../sql/V7_WEBHOOKS.sql', import.meta.url), 'utf8');
  assert.match(sql, /revoke all on public\.ifb_webhooks, public\.ifb_webhook_deliveries from anon, authenticated/);
  assert.match(sql, /function public\.ifb_webhook_url_ok/);
  assert.match(sql, /localhost/);
  assert.match(sql, /if new\.is_internal then return new; end if;/);
  assert.match(sql, /Only repository owners and admins can manage integrations/);
  assert.match(sql, /X-IFB-Signature/);
  // list never returns secret or the full bot token
  const list = sql.slice(sql.indexOf('function public.ifb_list_webhooks'), sql.indexOf('function public.ifb_create_webhook'));
  assert.doesNotMatch(list, /'secret'/);
  assert.match(list, /split_part\(h\.telegram_bot_token, ':', 1\)/);
});

test('REST router maps resources to the shared tools and errors to HTTP codes', async () => {
  const { routeRest, statusForError } = await import('../src/lib/rest-router.ts');
  const q = (s = '') => new URLSearchParams(s);
  assert.deepEqual(routeRest('GET', ['repos', 'barbershop', 'issues'], q('status=REPORTED&limit=5'), {}), { tool: 'list_bugs', args: { project: 'barbershop', status: 'REPORTED', limit: 5 } });
  assert.equal(routeRest('POST', ['repos', 'x', 'issues'], q(), { bugs: [{ title: 'a' }] }).tool, 'create_bugs');
  assert.equal(routeRest('POST', ['repos', 'x', 'issues'], q(), { title: 'a' }).tool, 'create_bug');
  assert.deepEqual(routeRest('PATCH', ['issues', 'BRB-1'], q(), { status: 'CLOSED' }), { tool: 'update_bug', args: { status: 'CLOSED', bug: 'BRB-1' } });
  // path wins over body: a caller cannot retarget another issue through the body
  assert.equal(routeRest('PATCH', ['issues', 'BRB-1'], q(), { bug: 'OTHER-9' }).args.bug, 'BRB-1');
  assert.equal(routeRest('GET', ['inbox'], q('since=7d'), {}).tool, 'whats_new');
  assert.equal(routeRest('DELETE', ['repos', 'x'], q(), {}), null);
  assert.equal(statusForError('Permission denied: missing bugs:update'), 403);
  assert.equal(statusForError('Bug "X" not found.'), 404);
  assert.equal(statusForError('Title is required'), 400);
});
