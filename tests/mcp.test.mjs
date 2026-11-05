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
