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

import { parseIssueQuery, matchesIssueQuery } from '../src/lib/issues/search.ts';

test('issue search parses validated filters and quoted phrases', () => {
  const parsed = parseIssueQuery('status:in-progress priority:p1 severity:critical "login crash"');
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.terms.map((term) => term.kind), ['status', 'priority', 'severity', 'text']);
  assert.equal(parsed.terms[3].value, 'login crash');
});

test('issue search rejects unsupported fields, invalid values and unclosed quotes', () => {
  assert.equal(parseIssueQuery('label:security').ok, false);
  assert.equal(parseIssueQuery('status:banana').ok, false);
  assert.equal(parseIssueQuery('"unclosed phrase').ok, false);
  assert.equal(parseIssueQuery('created:>2026-02-31').ok, false);
});

test('issue search applies all filters without interpreting input as SQL', () => {
  const issue = {
    title: 'Login crashes after submit', code: 'B-12', summary: 'Auth regression',
    section: 'Authentication', actual_behavior: 'Page closes', expected_behavior: 'Stay open',
    reporter_name: 'MR', steps_to_reproduce: ['Open login'], search_keys: [],
    status: 'IN_PROGRESS', priority: 'P1', severity: 'CRITICAL', assigned_to: 'profile-1',
    created_at: '2026-11-01T10:00:00.000Z', updated_at: '2026-11-02T10:00:00.000Z',
  };
  const parsed = parseIssueQuery('status:in_progress assignee:me "login crashes" created:>2026-10-31');
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(matchesIssueQuery(issue, parsed.terms, 'profile-1'), true);
  assert.equal(matchesIssueQuery(issue, parsed.terms, 'profile-2'), false);
});


test('issue search supports quoted field values, escaped quotes and empty queries', () => {
  assert.deepEqual(parseIssueQuery('').ok && parseIssueQuery('').terms, []);
  const quoted = parseIssueQuery(`assignee:"Jane Doe" author:'QA Team'`);
  assert.equal(quoted.ok, true);
  if (quoted.ok) {
    assert.deepEqual(quoted.terms, [
      { kind: 'assignee', value: 'jane doe' },
      { kind: 'author', value: 'qa team' },
    ]);
  }
  const escaped = parseIssueQuery(['"', 'login ', '\\', '"', 'crash', '\\', '"', '"'].join(''));
  assert.equal(escaped.ok, true);
  if (escaped.ok) assert.equal(escaped.terms[0].value, 'login "crash"');
});

test('issue search date operators validate calendar dates and preserve inclusive/exclusive bounds', () => {
  const after = parseIssueQuery('created:>2026-11-01 updated:<2026-11-05');
  assert.equal(after.ok, true);
  if (after.ok) {
    assert.deepEqual(after.terms, [
      { kind: 'created_after', value: '2026-11-01T00:00:00.000Z' },
      { kind: 'updated_before', value: '2026-11-05T00:00:00.000Z' },
    ]);
  }
  assert.equal(parseIssueQuery('updated:>2026-13-01').ok, false);
  assert.equal(parseIssueQuery('created:2026-11-01').ok, false);
});

test('issue search normalizes case and rejects empty or unknown filter values', () => {
  const normalized = parseIssueQuery('STATUS:ready-for-qa PRIORITY:p0 ASSIGNEE:ME');
  assert.equal(normalized.ok, true);
  if (normalized.ok) assert.deepEqual(normalized.terms, [
    { kind: 'status', value: 'READY_FOR_QA' },
    { kind: 'priority', value: 'P0' },
    { kind: 'assignee', value: 'me' },
  ]);
  assert.equal(parseIssueQuery('status:').ok, false);
  assert.equal(parseIssueQuery('unknown:value').ok, false);
  assert.equal(parseIssueQuery('a'.repeat(513)).ok, false);
  assert.equal(parseIssueQuery(Array(22).fill('word').join(' ')).ok, false);
  assert.equal(parseIssueQuery('""').ok, true);
});

test('issue search API is paginated and uses the cookie-authenticated RLS client', async () => {
  const { readFile } = await import('node:fs/promises');
  const route = await readFile(new URL('../src/app/api/issues/search/route.ts', import.meta.url), 'utf8');
  assert.match(route, /createServerSupabaseClient/);
  assert.match(route, /\.range\(from, from \+ pageSize - 1\)/);
  assert.match(route, /select\('\*, project:ifb_projects!inner/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/);
  assert.match(route, /parseIssueQuery/);
});


test('issue search supports project and repository aliases for global and scoped queries', () => {
  const parsed = parseIssueQuery('project:foundbug repo:"web client"');
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.deepEqual(parsed.terms, [
      { kind: 'project', value: 'foundbug' },
      { kind: 'project', value: 'web client' },
    ]);
    const issue = { title: 'Issue', code: 'FB-1', status: 'REPORTED', priority: 'P2', severity: 'LOW', created_at: '2026-11-01', updated_at: '2026-11-01', reporter_name: 'QA' };
    assert.equal(matchesIssueQuery(issue, [parsed.terms[0]], undefined, { name: 'FoundBug', slug: 'foundbug' }), true);
    assert.equal(matchesIssueQuery(issue, [parsed.terms[0]], undefined, { name: 'Other', slug: 'other' }), false);
  }
});
