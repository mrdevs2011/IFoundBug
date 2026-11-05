import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTH_EMAIL_DOMAIN,
  authErrorToEnglish,
  normalizeUsername,
  usernameToAuthEmail,
} from '../src/lib/supabase/username-auth.ts';
import {
  DONE_STATUSES,
  ENV_LABEL,
  SEVERITY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  timeAgo,
} from '../src/lib/constants.ts';

test('username normalization is deterministic and strips unsupported characters', () => {
  assert.equal(normalizeUsername('  MR Dev!  '), 'mrdev');
  assert.equal(normalizeUsername('User.Name_01-'), 'user.name_01-');
  assert.equal(normalizeUsername('A'), 'a');
});

test('username auth email keeps the established synthetic domain', () => {
  assert.equal(AUTH_EMAIL_DOMAIN, 'ifoundbug.dev');
  assert.equal(usernameToAuthEmail(' MR.Dev '), 'mr.dev@ifoundbug.dev');
});

test('auth errors are mapped to actionable English messages', () => {
  assert.match(authErrorToEnglish({ message: 'Email rate limit exceeded' }), /Email confirmation/);
  assert.match(authErrorToEnglish({ message: 'User already registered' }), /already taken/);
  assert.match(authErrorToEnglish({ status: 401, message: 'Unauthorized' }), /API key is invalid/);
});

test('issue status labels cover every persisted status and completed states', () => {
  assert.deepEqual(STATUS_ORDER, [
    'REPORTED', 'TRIAGED', 'IN_PROGRESS', 'READY_FOR_QA',
    'VERIFIED', 'FIXED', 'CLOSED', 'WONT_FIX',
  ]);
  for (const status of STATUS_ORDER) assert.equal(typeof STATUS_LABEL[status], 'string');
  assert.deepEqual(DONE_STATUSES, ['FIXED', 'CLOSED', 'WONT_FIX', 'VERIFIED']);
});

test('severity and environment labels cover their supported values', () => {
  assert.deepEqual(SEVERITY_LABEL, {
    CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low',
  });
  assert.deepEqual(ENV_LABEL, {
    PRODUCTION: 'Production', STAGING: 'Staging',
    DEVELOPMENT: 'Development', LOCAL: 'Local',
  });
});

test('relative timestamps remain English and use stable ranges', () => {
  const now = Date.now();
  assert.equal(timeAgo(new Date(now - 45_000).toISOString()), 'just now');
  assert.equal(timeAgo(new Date(now - 5 * 60_000).toISOString()), '5m ago');
  assert.equal(timeAgo(new Date(now - 3 * 60 * 60_000).toISOString()), '3h ago');
});
