import type { Bug, BugStatus, Priority, Severity } from '@/types';

export type IssueSearchTerm =
  | { kind: 'text'; value: string }
  | { kind: 'status'; value: BugStatus }
  | { kind: 'priority'; value: Priority }
  | { kind: 'severity'; value: Severity }
  | { kind: 'assignee'; value: string }
  | { kind: 'author'; value: string }
  | { kind: 'project'; value: string }
  | { kind: 'created_after' | 'created_before' | 'updated_after' | 'updated_before'; value: string };

export type IssueSearchResult =
  | { ok: true; terms: IssueSearchTerm[] }
  | { ok: false; error: string };

const STATUSES = new Set<BugStatus>([
  'REPORTED', 'TRIAGED', 'IN_PROGRESS', 'READY_FOR_QA',
  'VERIFIED', 'FIXED', 'CLOSED', 'WONT_FIX',
]);
const PRIORITIES = new Set<Priority>(['P0', 'P1', 'P2', 'P3']);
const SEVERITIES = new Set<Severity>(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function tokenize(input: string): string[] | null {
  const tokens: string[] = [];
  let token = '';
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (const char of input.trim()) {
    if (escaped) {
      token += char;
      escaped = false;
      continue;
    }
    if (char === '\\' && quote) {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      else token += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (token) { tokens.push(token); token = ''; }
      continue;
    }
    token += char;
  }

  if (quote || escaped) return null;
  if (token) tokens.push(token);
  return tokens;
}

function parseDateFilter(field: 'created' | 'updated', value: string): IssueSearchTerm | null {
  const match = value.match(/^([<>])(.+)$/);
  if (!match || !DATE_ONLY.test(match[2])) return null;
  const parsed = new Date(match[2] + 'T00:00:00.000Z');
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== match[2]) return null;
  const kind = (field + (match[1] === '>' ? '_after' : '_before')) as 'created_after' | 'created_before' | 'updated_after' | 'updated_before';
  return { kind, value: parsed.toISOString() };
}

export function parseIssueQuery(input: string): IssueSearchResult {
  if (input.length > 512) return { ok: false, error: 'Search query is too long. Use at most 512 characters.' };
  const tokens = tokenize(input);
  if (tokens && tokens.length > 20) return { ok: false, error: 'Search query has too many terms. Use at most 20.' };
  if (!tokens) return { ok: false, error: 'Unclosed quote or invalid escape in search query.' };

  const terms: IssueSearchTerm[] = [];
  for (const token of tokens) {
    const separator = token.indexOf(':');
    if (separator < 0) {
      terms.push({ kind: 'text', value: token.toLowerCase() });
      continue;
    }

    const field = token.slice(0, separator).toLowerCase();
    const rawValue = token.slice(separator + 1);
    if (!rawValue) return { ok: false, error: `Add a value after "${field}:".` };
    const value = rawValue.toUpperCase().replace(/[ -]+/g, '_');

    if (field === 'status') {
      if (!STATUSES.has(value as BugStatus)) return { ok: false, error: `Unknown status "${rawValue}".` };
      terms.push({ kind: 'status', value: value as BugStatus });
    } else if (field === 'priority') {
      if (!PRIORITIES.has(value as Priority)) return { ok: false, error: `Unknown priority "${rawValue}". Use P0, P1, P2 or P3.` };
      terms.push({ kind: 'priority', value: value as Priority });
    } else if (field === 'severity') {
      if (!SEVERITIES.has(value as Severity)) return { ok: false, error: `Unknown severity "${rawValue}".` };
      terms.push({ kind: 'severity', value: value as Severity });
    } else if (field === 'assignee') {
      terms.push({ kind: 'assignee', value: rawValue.toLowerCase() });
    } else if (field === 'author') {
      terms.push({ kind: 'author', value: rawValue.toLowerCase() });
    } else if (field === 'project' || field === 'repo' || field === 'repository') {
      terms.push({ kind: 'project', value: rawValue.toLowerCase() });
    } else if (field === 'created' || field === 'updated') {
      const dateTerm = parseDateFilter(field, rawValue);
      if (!dateTerm) return { ok: false, error: `Use ${field}:>YYYY-MM-DD or ${field}:<YYYY-MM-DD.` };
      terms.push(dateTerm);
    } else {
      return { ok: false, error: `Unsupported search field "${field}:". Supported fields: status, priority, severity, assignee, author, project, repo, created, updated.` };
    }
  }

  return { ok: true, terms };
}

export function matchesIssueQuery(issue: Bug, terms: IssueSearchTerm[], currentProfileId?: string, project?: { name: string; slug: string }): boolean {
  const haystack = [
    issue.title, issue.code, issue.summary, issue.section,
    issue.actual_behavior, issue.expected_behavior, issue.reporter_name,
    ...(issue.steps_to_reproduce ?? []), ...(issue.search_keys ?? []),
  ].filter(Boolean).join(' ').toLowerCase();

  return terms.every((term) => {
    switch (term.kind) {
      case 'text': return haystack.includes(term.value);
      case 'status': return issue.status === term.value;
      case 'priority': return issue.priority === term.value;
      case 'severity': return issue.severity === term.value;
      case 'assignee':
        return term.value === 'me'
          ? Boolean(currentProfileId && issue.assigned_to === currentProfileId)
          : (issue.assigned_to ?? '').toLowerCase() === term.value;
      case 'author': return (issue.reporter_name ?? '').toLowerCase().includes(term.value);
      case 'project': return Boolean(project && (project.name.toLowerCase().includes(term.value) || project.slug.toLowerCase().includes(term.value)));
      case 'created_after': return new Date(issue.created_at).getTime() >= new Date(term.value).getTime();
      case 'created_before': return new Date(issue.created_at).getTime() < new Date(term.value).getTime();
      case 'updated_after': return new Date(issue.updated_at).getTime() >= new Date(term.value).getTime();
      case 'updated_before': return new Date(issue.updated_at).getTime() < new Date(term.value).getTime();
    }
  });
}
