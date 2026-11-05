import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-auth';
import { parseIssueQuery } from '@/lib/issues/search';
import type { BugStatus, Severity } from '@/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DONE = ['FIXED', 'CLOSED', 'WONT_FIX', 'VERIFIED'] as const;
const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES: BugStatus[] = ['REPORTED', 'TRIAGED', 'IN_PROGRESS', 'READY_FOR_QA', 'VERIFIED', 'FIXED', 'CLOSED', 'WONT_FIX'];

function safeLike(value: string) {
  return value.replace(/[\\%_(),]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

export async function GET(request: NextRequest) {
  const db = await createServerSupabaseClient();
  if (!db) return NextResponse.json({ error: 'Issue search is not configured.' }, { status: 503 });

  const params = request.nextUrl.searchParams;
  const projectId = params.get('project') || '';
  if (projectId && !UUID.test(projectId)) return NextResponse.json({ error: 'A valid project ID is required.' }, { status: 400 });

  const parsed = parseIssueQuery(params.get('q') || '');
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const page = Math.max(1, Math.min(10_000, Number.parseInt(params.get('page') || '1', 10) || 1));
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(params.get('page_size') || '50', 10) || 50));
  const tab = params.get('tab') || (projectId ? 'open' : 'all');
  const severity = params.get('severity') || '';
  const status = params.get('status') || '';
  const sort = params.get('sort') || 'new';
  if (!['open', 'done', 'all'].includes(tab)) return NextResponse.json({ error: 'Invalid issue tab.' }, { status: 400 });
  if (severity && !SEVERITIES.includes(severity as Severity)) return NextResponse.json({ error: 'Invalid severity filter.' }, { status: 400 });
  if (status && !STATUSES.includes(status as BugStatus)) return NextResponse.json({ error: 'Invalid status filter.' }, { status: 400 });
  if (!['new', 'votes', 'severity'].includes(sort)) return NextResponse.json({ error: 'Invalid sort order.' }, { status: 400 });

  const { data: authData } = await db.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return NextResponse.json({ error: 'Sign in to search issues.' }, { status: 401 });
  let query = db.from('ifb_bugs').select('*, project:ifb_projects!inner(id,name,slug)', { count: 'exact' });
  if (projectId) query = query.eq('project_id', projectId);
  if (tab === 'done') query = query.in('status', [...DONE]);
  if (tab === 'open') query = query.not('status', 'in', `(${DONE.join(',')})`);
  if (severity) query = query.eq('severity', severity);
  if (status) query = query.eq('status', status);

  for (const term of parsed.terms) {
    switch (term.kind) {
      case 'text': {
        const value = safeLike(term.value);
        if (value) query = query.or(['title', 'code', 'summary', 'section', 'actual_behavior', 'expected_behavior', 'reporter_name'].map((field) => `${field}.ilike.%${value}%`).join(','));
        break;
      }
      case 'status': query = query.eq('status', term.value); break;
      case 'priority': query = query.eq('priority', term.value); break;
      case 'severity': query = query.eq('severity', term.value); break;
      case 'created_after': query = query.gte('created_at', term.value); break;
      case 'created_before': query = query.lt('created_at', term.value); break;
      case 'updated_after': query = query.gte('updated_at', term.value); break;
      case 'updated_before': query = query.lt('updated_at', term.value); break;
      case 'author': {
        const value = safeLike(term.value);
        if (value) query = query.ilike('reporter_name', `%${value}%`);
        break;
      }
      case 'project': {
        const value = safeLike(term.value);
        if (value) query = query.or(`slug.ilike.%${value}%,name.ilike.%${value}%`, { referencedTable: 'project' });
        break;
      }
      case 'assignee': {
        let profileId = term.value;
        if (term.value === 'me') {
          if (!userId) return NextResponse.json({ data: [], total: 0, page, page_size: pageSize, counts: { open: 0, done: 0, all: 0 } });
          const { data: profile } = await db.from('ifb_profiles').select('id').eq('auth_user_id', userId).maybeSingle();
          if (!profile) return NextResponse.json({ data: [], total: 0, page, page_size: pageSize, counts: { open: 0, done: 0, all: 0 } });
          profileId = profile.id;
        } else if (!UUID.test(term.value)) {
          const value = safeLike(term.value);
          const { data: profiles } = await db.from('ifb_profiles').select('id').or(`username.ilike.%${value}%,full_name.ilike.%${value}%`).limit(2);
          if (!profiles?.length) return NextResponse.json({ data: [], total: 0, page, page_size: pageSize, counts: { open: 0, done: 0, all: 0 } });
          if (profiles.length > 1) return NextResponse.json({ error: `Assignee "${term.value}" is ambiguous. Use a unique username.` }, { status: 400 });
          profileId = profiles[0].id;
        }
        query = query.eq('assigned_to', profileId);
        break;
      }
    }
  }

  const order = sort === 'votes' ? { column: 'upvotes_count', ascending: false } : sort === 'severity' ? { column: 'severity', ascending: true } : { column: 'created_at', ascending: false };
  const from = (page - 1) * pageSize;
  const allQuery = () => { const q = db.from('ifb_bugs').select('id', { count: 'exact', head: true }); return projectId ? q.eq('project_id', projectId) : q; };
  const [{ data, error, count }, { count: allCount, error: allError }, { count: openCount, error: openError }, { count: doneCount, error: doneError }] = await Promise.all([
    query.order(order.column, { ascending: order.ascending }).range(from, from + pageSize - 1),
    allQuery(),
    allQuery().not('status', 'in', `(${DONE.join(',')})`),
    allQuery().in('status', [...DONE]),
  ]);
  const failure = error || allError || openError || doneError;
  if (failure) {
    console.error('Issue search failed:', failure.code || failure.message);
    return NextResponse.json({ error: 'Unable to search issues.' }, { status: 500 });
  }
  return NextResponse.json({
    data: data || [], total: count || 0, page, page_size: pageSize,
    counts: { all: allCount || 0, open: openCount || 0, done: doneCount || 0 },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
