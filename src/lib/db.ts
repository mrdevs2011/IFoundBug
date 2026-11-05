import { supabase } from '@/lib/supabase/client';
import type { Bug, BugAuditLog, BugComment, BugStatus, Project, ProjectInvite, UserProfile } from '@/types';

function sb() {
  if (!supabase) throw new Error('Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / KEY).');
  return supabase;
}

export interface Me { id: string; authId: string; username: string; full_name: string; avatar_url?: string }
export interface ProjectCard extends Project { open_count: number; total_count: number }
export interface Member { role: string; profile: { id: string; username: string; full_name: string } }
export interface SharedBug { bug: Bug; project: Pick<Project, 'id' | 'name' | 'slug' | 'color'>; comments: BugComment[] }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE_COLS = 'id,username,full_name,avatar_url';

/** Current account. Clears a dead/expired session so later requests fall back to anonymous. */
export async function getMe(): Promise<Me | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    return null;
  }
  const { data } = await supabase.from('ifb_profiles').select(PROFILE_COLS).eq('auth_user_id', user.id).maybeSingle();
  if (!data) return null;
  return { id: data.id, authId: user.id, username: data.username, full_name: data.full_name, avatar_url: data.avatar_url ?? undefined };
}

// ---- projects -------------------------------------------------------------
export async function listProjects(search = ''): Promise<ProjectCard[]> {
  const me = await getMe();
  if (!me) return [];

  const [{ data: memberships, error: membershipError }, { data: owned, error: ownedError }] = await Promise.all([
    sb().from('ifb_project_members').select('project_id').eq('user_id', me.id),
    sb().from('ifb_projects').select('id').eq('created_by', me.id),
  ]);
  if (membershipError) throw membershipError;
  if (ownedError) throw ownedError;

  const accessibleIds = [...new Set([
    ...(memberships ?? []).map((row) => row.project_id),
    ...(owned ?? []).map((row) => row.id),
  ])];
  if (!accessibleIds.length) return [];

  let q = sb().from('ifb_projects').select('*, bugs:ifb_bugs(status)')
    .in('id', accessibleIds).order('created_at', { ascending: false }).limit(200);
  const term = search.trim().replace(/[(),.%_*\\"']/g, ' ').slice(0, 100);
  if (term) q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((project) => {
    const bugs = (project.bugs ?? []) as { status: BugStatus }[];
    const { bugs: _omit, ...record } = project;
    void _omit;
    return {
      ...(record as Project),
      total_count: bugs.length,
      open_count: bugs.filter((bug) => !['FIXED', 'CLOSED', 'WONT_FIX', 'VERIFIED'].includes(bug.status)).length,
    };
  });
}

export async function getProject(slug: string): Promise<Project | null> {
  const { data, error } = await sb().from('ifb_projects').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data as Project | null;
}

export async function createProject(input: { name: string; description?: string; tech_stack?: string[]; is_public?: boolean; allow_guest_reports?: boolean }): Promise<Project> {
  const { data, error } = await sb().from('ifb_projects')
    .insert({ name: input.name, description: input.description || null, tech_stack: input.tech_stack ?? [], is_public: input.is_public ?? false, allow_guest_reports: input.allow_guest_reports ?? false })
    .select('*').single();
  if (error) throw error;
  return data as Project;
}

export async function myRole(projectId: string, profileId: string): Promise<string | null> {
  const { data } = await sb().from('ifb_project_members').select('role').eq('project_id', projectId).eq('user_id', profileId).maybeSingle();
  return data?.role ?? null;
}

export async function listMembers(projectId: string): Promise<Member[]> {
  const { data, error } = await sb().from('ifb_project_members').select('role, profile:ifb_profiles(id,username,full_name)').eq('project_id', projectId);
  if (error) throw error;
  return (data ?? []) as unknown as Member[];
}

export async function removeMember(projectId: string, profileId: string) {
  const { error } = await sb().from('ifb_project_members').delete().eq('project_id', projectId).eq('user_id', profileId);
  if (error) throw error;
}

// ---- invites ------------------------------------------------------------------
export async function listInvites(projectId: string): Promise<ProjectInvite[]> {
  const { data, error } = await sb().from('ifb_project_invites').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectInvite[];
}
export async function createInvite(projectId: string, role: string): Promise<ProjectInvite> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');
  const { data, error } = await sb().from('ifb_project_invites')
    .insert({ project_id: projectId, token, role, max_uses: 100, expires_at: new Date(Date.now() + 30 * 864e5).toISOString() })
    .select('*').single();
  if (error) throw error;
  return data as ProjectInvite;
}
export async function revokeInvite(id: string) {
  const { error } = await sb().from('ifb_project_invites').delete().eq('id', id);
  if (error) throw error;
}
export async function previewInvite(token: string): Promise<{ role: string; project: Project } | null> {
  const { data, error } = await sb().rpc('ifb_preview_invite', { p_token: token });
  if (error) throw error;
  return data as { role: string; project: Project } | null;
}
export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await sb().rpc('ifb_accept_invite', { p_token: token });
  if (error) throw error;
  return data as string;
}

// ---- bugs ----------------------------------------------------------------------
export async function listBugs(projectId: string): Promise<Bug[]> {
  const { data, error } = await sb().from('ifb_bugs').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(500);
  if (error) throw error;
  return (data ?? []) as Bug[];
}

export async function getBug(projectId: string, codeOrId: string): Promise<Bug | null> {
  const q = sb().from('ifb_bugs').select('*').eq('project_id', projectId);
  const { data, error } = await (UUID.test(codeOrId) ? q.eq('id', codeOrId) : q.eq('code', codeOrId)).maybeSingle();
  if (error) throw error;
  return data as Bug | null;
}

export type NewBug = Pick<Bug, 'title' | 'severity' | 'environment'> & Partial<Pick<Bug, 'summary' | 'section' | 'screen' | 'actual_behavior' | 'expected_behavior' | 'steps_to_reproduce' | 'evidence_urls' | 'device_telemetry'>>;
export async function createBug(projectId: string, bug: NewBug): Promise<Bug> {
  const { data, error } = await sb().from('ifb_bugs').insert({ ...bug, project_id: projectId }).select('*').single();
  if (error) throw error;
  return data as Bug;
}

export async function updateBug(id: string, patch: Partial<Pick<Bug, 'title' | 'severity' | 'priority' | 'assigned_to' | 'dev_notes' | 'actual_behavior' | 'expected_behavior'>>): Promise<Bug> {
  const { data, error } = await sb().from('ifb_bugs').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Bug;
}

export async function setStatus(id: string, status: BugStatus): Promise<Bug> {
  const { data, error } = await sb().rpc('ifb_update_bug_status', { target_bug_id: id, new_status: status });
  if (error) throw error;
  return data as Bug;
}

export async function deleteBug(id: string) {
  const { error } = await sb().from('ifb_bugs').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleVote(id: string): Promise<{ voted: boolean; count: number }> {
  const { data, error } = await sb().rpc('ifb_toggle_bug_upvote', { target_bug_id: id, user_id_str: '', reproduced_flag: true });
  if (error) throw error;
  return { voted: Boolean(data.voted), count: Number(data.upvotes ?? 0) };
}

export async function myVote(bugId: string, authId: string): Promise<boolean> {
  const { data } = await sb().from('ifb_bug_upvotes').select('id').eq('bug_id', bugId).eq('user_identifier', authId).maybeSingle();
  return Boolean(data);
}

/** Secret link: returns the token, or null when link-only mode is turned off. */
export async function setBugLink(id: string, enabled: boolean, rotate = false): Promise<string | null> {
  const { data, error } = await sb().rpc('ifb_set_bug_link', { p_bug: id, p_enabled: enabled, p_rotate: rotate });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function getSharedBug(token: string): Promise<SharedBug | null> {
  const { data, error } = await sb().rpc('ifb_get_shared_bug', { p_token: token });
  if (error) throw error;
  return data as SharedBug | null;
}

// ---- comments / activity ---------------------------------------------------------
export async function listComments(bugId: string): Promise<BugComment[]> {
  const { data, error } = await sb().from('ifb_bug_comments').select('*').eq('bug_id', bugId).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as BugComment[];
}
export async function addComment(bugId: string, content: string): Promise<BugComment> {
  const { data, error } = await sb().from('ifb_bug_comments').insert({ bug_id: bugId, content, author_name: 'x' }).select('*').single();
  if (error) throw error;
  return data as BugComment;
}
export async function addSharedComment(token: string, content: string): Promise<BugComment> {
  const { data, error } = await sb().rpc('ifb_add_shared_comment', { p_token: token, p_content: content });
  if (error) throw error;
  return data as BugComment;
}
export async function deleteComment(id: string) {
  const { error } = await sb().from('ifb_bug_comments').delete().eq('id', id);
  if (error) throw error;
}
export async function listActivity(bugId: string): Promise<BugAuditLog[]> {
  const { data, error } = await sb().from('ifb_bug_audit_logs').select('*').eq('bug_id', bugId).order('created_at', { ascending: false }).limit(30);
  if (error) throw error;
  return (data ?? []) as BugAuditLog[];
}

// ---- auth ----------------------------------------------------------------------------
export async function signOut() { await sb().auth.signOut(); }
export type { UserProfile };

export async function uploadFile(file: Blob, name = 'screenshot.png'): Promise<string> {
  const form = new FormData();
  form.append('file', file, name);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Could not upload the file');
  return json.url as string;
}

export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return 'Unknown error';
}
