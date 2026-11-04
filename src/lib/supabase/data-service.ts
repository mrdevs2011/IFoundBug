import { supabase, isSupabaseConfigured } from './client';
import { Bug, Project, BugComment, BugStatus, AcceptanceCriterion, BugNotification } from '@/types';

export const DataService = {
  async fetchProfile(authUserId: string, authEmail = ''): Promise<import('@/types').UserProfile> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('ifb_profiles')
      .select('id, auth_user_id, username, full_name, avatar_url, role, created_at')
      .eq('auth_user_id', authUserId)
      .single();
    if (error) throw error;
    if (!data) throw new Error('Foydalanuvchi profili database ichida topilmadi.');
    return {
      id: authUserId,
      email: authEmail,
      full_name: data.full_name,
      avatar_url: data.avatar_url || undefined,
      role: data.role,
      created_at: data.created_at,
    } as import('@/types').UserProfile;
  },

  async fetchNotifications(authUserId: string): Promise<BugNotification[]> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { data: profile, error: profileError } = await supabase
      .from('ifb_profiles').select('id').eq('auth_user_id', authUserId).single();
    if (profileError) throw profileError;
    const { data, error } = await supabase
      .from('ifb_notifications').select('*').eq('recipient_id', profile.id)
      .order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return (data || []).map((row) => ({ ...row, read: Boolean(row.read_at) })) as BugNotification[];
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.rpc('ifb_mark_notification_read', { target_notification_id: notificationId });
    if (error) throw error;
  },

  async clearNotifications(authUserId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { data: profile, error: profileError } = await supabase
      .from('ifb_profiles').select('id').eq('auth_user_id', authUserId).single();
    if (profileError) throw profileError;
    const { error } = await supabase.from('ifb_notifications').delete().eq('recipient_id', profile.id);
    if (error) throw error;
  },

  subscribeToNotifications(authUserId: string, onChange: (notification: BugNotification, eventType: string) => void) {
    if (!isSupabaseConfigured || !supabase) return null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    void supabase.from('ifb_profiles').select('id').eq('auth_user_id', authUserId).single().then(({ data, error }) => {
      if (error || !data || cancelled) return;
      channel = supabase!.channel(`user-notifications-${data.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_notifications', filter: `recipient_id=eq.${data.id}` }, (payload) => {
          const row = (payload.new || payload.old) as Record<string, unknown>;
          if (row) onChange({ ...row, read: Boolean(row.read_at) } as unknown as BugNotification, payload.eventType);
        }).subscribe();
    });
    return { unsubscribe: () => { cancelled = true; if (channel) void channel.unsubscribe(); } };
  },
  // 1. Projects
  async fetchProjects(): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ifb_projects')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []) as Project[];
      } catch (err) {
        console.error('Supabase fetchProjects failed:', err);
        throw err;
      }
    }
    throw new Error('Supabase is not configured; cloud data is unavailable.');
  },

  async fetchProjectBySlug(slug: string): Promise<Project | null> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('ifb_projects')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data as Project | null;
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    const newProj: Partial<Project> & Pick<Project, 'name'> = {
      // Let PostgreSQL generate the UUID and database defaults.
      name: project.name?.trim() || '',
      ...(project.description !== undefined && { description: project.description }),
      ...(project.icon !== undefined && { icon: project.icon }),
      ...(project.color !== undefined && { color: project.color }),
      ...(project.is_public !== undefined && { is_public: project.is_public }),
      ...(project.allow_guest_reports !== undefined && { allow_guest_reports: project.allow_guest_reports }),
      ...(project.tech_stack !== undefined && { tech_stack: project.tech_stack }),
      ...(project.github_repo_url !== undefined && { github_repo_url: project.github_repo_url }),
      ...(project.telegram_bot_token !== undefined && { telegram_bot_token: project.telegram_bot_token }),
      ...(project.telegram_chat_id !== undefined && { telegram_chat_id: project.telegram_chat_id }),
      ...(project.telegram_webhook_enabled !== undefined && { telegram_webhook_enabled: project.telegram_webhook_enabled }),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ifb_projects')
          .insert([newProj])
          .select()
          .single();
        if (error) throw error;
        if (data) return data as Project;
        throw new Error('Project creation returned no row.');
      } catch (err) {
        const detail = err && typeof err === 'object' ? err as { message?: string; code?: string; details?: string; hint?: string } : null;
        console.error('Supabase createProject failed:', { message: detail?.message || String(err), code: detail?.code, details: detail?.details, hint: detail?.hint });
        throw new Error(detail?.message || 'Supabase loyiha yaratishni rad etdi. Database schema va permissions ni tekshir.');
      }
    }
    throw new Error('Supabase is not configured; project creation is disabled.');
  },

  // 2. Bugs
  async fetchBugs(projectId: string): Promise<Bug[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ifb_bugs')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Bug[];
      } catch (err) {
        console.error('Supabase fetchBugs failed:', err);
        throw err;
      }
    }
    throw new Error('Supabase is not configured; cloud data is unavailable.');
  },

  async fetchBugByIdOrCode(
    projectSlugOrId: string,
    bugIdOrCode: string
  ): Promise<{ bug: Bug; project: Project } | null> {
    const project = await this.fetchProjectBySlug(projectSlugOrId);
    if (!project) return null;
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bugIdOrCode);
    const query = supabase.from('ifb_bugs').select('*').eq('project_id', project.id);
    const { data, error } = isUuid
      ? await query.eq('id', bugIdOrCode).maybeSingle()
      : await query.eq('code', bugIdOrCode).maybeSingle();
    if (error) throw error;
    return data ? { bug: data as Bug, project } : null;
  },

  async createBug(newBug: Partial<Bug>, project?: Project): Promise<Bug> {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = Object.fromEntries(Object.entries(newBug).filter(([key]) => !['id', 'code', 'created_at', 'updated_at', 'reporter_name', 'reported_by', 'upvotes_count', 'reproduced_count', 'views_count', 'status'].includes(key)));
        const { data, error } = await supabase
          .from('ifb_bugs')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        if (data) {
          // Send Telegram notification if enabled
          if (project?.telegram_bot_token && project?.telegram_chat_id) {
            this.notifyTelegram(project, data as Bug);
          }
          return data as Bug;
        }
      } catch (err) {
        const detail = err && typeof err === 'object' ? err as { message?: string; code?: string; details?: string; hint?: string } : null;
        console.error('Supabase createBug failed:', { message: detail?.message || String(err), code: detail?.code, details: detail?.details, hint: detail?.hint });
        throw new Error(detail?.message || 'Supabase bug yozuvini saqlashni rad etdi. Database schema va permissions ni tekshir.');
      }
    }
    throw new Error('Supabase is not configured; bug creation is disabled.');
  },

  async updateBugStatus(bugId: string, status: BugStatus): Promise<Bug> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('ifb_update_bug_status', { target_bug_id: bugId, new_status: status });
    if (error) throw error;
    if (!data) throw new Error('Status update returned no database row.');
    return data as Bug;
  },

  async updateBugCriteria(bugId: string, criteria: AcceptanceCriterion[]): Promise<Bug> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('ifb_update_bug_criteria', {
      target_bug_id: bugId,
      new_criteria: criteria,
    });
    if (error) throw error;
    if (!data) throw new Error('Acceptance criteria update returned no database row.');
    return data as Bug;
  },

  async toggleUpvote(bugId: string): Promise<{ voted: boolean; count: number; reproducedCount: number }> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('ifb_toggle_bug_upvote', {
      target_bug_id: bugId,
      user_id_str: '',
      reproduced_flag: true,
    });
    if (error) throw error;
    if (!data) throw new Error('Upvote operation returned no database result.');
    return { voted: Boolean(data.voted), count: Number(data.upvotes ?? 0), reproducedCount: Number(data.reproduced ?? 0) };
  },

  // 3. Comments
  async fetchComments(bugId: string): Promise<BugComment[]> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('ifb_bug_comments')
      .select('*')
      .eq('bug_id', bugId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as BugComment[];
  },

  async createComment(comment: Partial<BugComment>): Promise<BugComment> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const payload = Object.fromEntries(Object.entries(comment).filter(([key]) => key !== 'id' && key !== 'created_at'));
    const { data, error } = await supabase
      .from('ifb_bug_comments')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error('Comment insert returned no database row.');
    return data as BugComment;
  },

  // 4. Realtime Subscriptions
  subscribeToWorkspace(
    onChange: (event: { table: string; eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void,
    onStatus?: (status: string) => void,
  ) {
    if (!isSupabaseConfigured || !supabase) return null;
    const tables = [
      'ifb_profiles', 'ifb_projects', 'ifb_project_members', 'ifb_project_invites',
      'ifb_bugs', 'ifb_bug_comments', 'ifb_bug_audit_logs', 'ifb_bug_upvotes', 'ifb_notifications',
    ] as const;
    let channel = supabase.channel(`ifb-workspace-${crypto.randomUUID()}`);
    for (const table of tables) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        onChange({
          table,
          eventType: payload.eventType,
          new: (payload.new || {}) as Record<string, unknown>,
          old: (payload.old || {}) as Record<string, unknown>,
        });
      });
    }
    return channel.subscribe((status) => onStatus?.(status));
  },

  subscribeToProject(
    projectId: string,
    onBugChange: (bug: Bug, eventType: string) => void,
    onProjectChange?: (project: Project, eventType: string) => void,
    onStatus?: (status: string) => void,
  ) {
    if (!isSupabaseConfigured || !supabase) return null;
    const channel = supabase
      .channel(`project-live-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_bugs', filter: `project_id=eq.${projectId}` }, (payload) => {
        const row = (payload.new || payload.old) as Bug | undefined;
        if (row) onBugChange(row, payload.eventType);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_projects', filter: `id=eq.${projectId}` }, (payload) => {
        const row = (payload.new || payload.old) as Project | undefined;
        if (row) onProjectChange?.(row, payload.eventType);
      })
      .subscribe((status) => onStatus?.(status));
    return channel;
  },

  subscribeToBug(
    bugId: string,
    onChange: (bug: Bug, eventType: string) => void,
    onStatus?: (status: string) => void,
  ) {
    if (!isSupabaseConfigured || !supabase) return null;
    return supabase.channel(`bug-live-${bugId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_bugs', filter: `id=eq.${bugId}` }, (payload) => {
        const row = (payload.new || payload.old) as Bug | undefined;
        if (row) onChange(row, payload.eventType);
      })
      .subscribe((status) => onStatus?.(status));
  },

  subscribeToBugComments(
    bugId: string,
    onCommentChange: (comment: BugComment, eventType: string) => void,
    onStatus?: (status: string) => void,
  ) {
    if (!isSupabaseConfigured || !supabase) return null;
    return supabase.channel(`bug-comments-${bugId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_bug_comments', filter: `bug_id=eq.${bugId}` }, (payload) => {
        const row = (payload.new || payload.old) as BugComment | undefined;
        if (row) onCommentChange(row, payload.eventType);
      })
      .subscribe((status) => onStatus?.(status));
  },

  // 5. Invites
  async validateInvite(token: string): Promise<{ project: Project; role: string } | null> {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('ifb_project_invites')
      .select('*, project:ifb_projects(*)')
      .eq('token', token)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    if (!data || data.uses_count >= data.max_uses) return null;
    const { error: updateError } = await supabase
      .from('ifb_project_invites')
      .update({ uses_count: data.uses_count + 1 })
      .eq('id', data.id);
    if (updateError) throw updateError;
    return { project: data.project as Project, role: data.role };
  },

  // 6. Telegram webhook sender
  async notifyTelegram(project: Project, bug: Bug) {
    if (!project.telegram_bot_token || !project.telegram_chat_id) return;
    try {
      await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: project.telegram_bot_token,
          chat_id: project.telegram_chat_id,
          project_name: project.name,
          project_slug: project.slug,
          bug,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        }),
      });
    } catch (err) {
      console.warn('Failed to send telegram notification:', err);
    }
  },
};
