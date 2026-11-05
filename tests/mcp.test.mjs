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
  const route = await readFile(new URL('../src/app/api/mcp/route.ts', import.meta.url), 'utf8');
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
  const route = await readFile(new URL('../src/app/api/mcp/route.ts', import.meta.url), 'utf8');
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
