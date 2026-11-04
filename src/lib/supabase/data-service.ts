import { supabase, isSupabaseConfigured } from './client';
import { Bug, Project, BugComment, BugStatus, AcceptanceCriterion } from '@/types';
import { INITIAL_BUGS, INITIAL_COMMENTS } from '@/lib/mock-data';

const STORAGE_PROJECTS_KEY = 'ifb_cached_projects';
const STORAGE_BUGS_KEY = 'ifb_cached_bugs';
const STORAGE_COMMENTS_KEY = 'ifb_cached_comments';

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export const DataService = {
  // 1. Projects
  async fetchProjects(): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ifb_projects')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        const projects = (data || []) as Project[];
        setLocal(STORAGE_PROJECTS_KEY, projects);
        return projects;
      } catch (err) {
        console.error('Supabase fetchProjects failed:', err);
        throw err;
      }
    }
    throw new Error('Supabase is not configured; cloud data is unavailable.');
  },

  async fetchProjectBySlug(slug: string): Promise<Project | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ifb_projects')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!error && data) return data as Project;
      } catch (err) {
        console.warn('Supabase fetchProjectBySlug error:', err);
      }
    }
    const projects = await this.fetchProjects();
    return projects.find((p) => p.slug === slug || p.id === slug) || null;
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    const newProj: Project = {
      // Database primary key is UUID. Ignore legacy UI IDs such as `proj_123`.
      id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(project.id || '')
        ? project.id as string
        : crypto.randomUUID(),
      name: project.name?.trim() || 'Yangi Loyiha',
      // Slugs are unique in the database; add a short suffix to avoid collisions.
      slug: `${(project.slug || `proj-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'project'}-${crypto.randomUUID().slice(0, 8)}`,
      description: project.description || '',
      icon: project.icon || 'bug',
      color: project.color || '#10b981',
      is_public: project.is_public ?? true,
      allow_guest_reports: project.allow_guest_reports ?? true,
      tech_stack: project.tech_stack || ['React', 'Next.js'],
      created_at: new Date().toISOString(),
      github_repo_url: project.github_repo_url,
      telegram_bot_token: project.telegram_bot_token,
      telegram_chat_id: project.telegram_chat_id,
      telegram_webhook_enabled: project.telegram_webhook_enabled,
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

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ifb_bugs')
          .select('*')
          .eq('project_id', project.id)
          .or(`id.eq.${bugIdOrCode},code.eq.${bugIdOrCode}`)
          .single();

        if (!error && data) {
          return { bug: data as Bug, project };
        }
      } catch (err) {
        console.warn('Supabase fetchBugByIdOrCode error:', err);
      }
    }

    const bugs = await this.fetchBugs(project.id);
    const foundBug = bugs.find(
      (b) => b.id === bugIdOrCode || b.code.toLowerCase() === bugIdOrCode.toLowerCase()
    );
    if (foundBug) return { bug: foundBug, project };
    return null;
  },

  async createBug(newBug: Bug, project?: Project): Promise<Bug> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ifb_bugs')
          .insert([newBug])
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

  async updateBugStatus(bugId: string, status: BugStatus, actorName = 'Dasturchi'): Promise<void> {
    const resolvedAt = status === 'FIXED' ? new Date().toISOString() : null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: updateError } = await supabase
          .from('ifb_bugs')
          .update({ status, resolved_at: resolvedAt, updated_at: new Date().toISOString() })
          .eq('id', bugId);
        if (updateError) throw updateError;

        const { error: auditError } = await supabase.from('ifb_bug_audit_logs').insert([
          {
            bug_id: bugId,
            actor_name: actorName,
            action: 'STATUS_CHANGED',
            details: { new_status: status },
          },
        ]);
        if (auditError) throw auditError;
      } catch (err) {
        console.error('Supabase updateBugStatus failed:', err);
        throw err;
      }
    } else {
      throw new Error('Supabase is not configured; bug updates are disabled.');
    }

    const allBugs = getLocal<Bug[]>(STORAGE_BUGS_KEY, INITIAL_BUGS);
    const updated = allBugs.map((b) =>
      b.id === bugId ? { ...b, status, resolved_at: resolvedAt || b.resolved_at } : b
    );
    setLocal(STORAGE_BUGS_KEY, updated);
  },

  async updateBugCriteria(bugId: string, criteria: AcceptanceCriterion[]): Promise<void> {
    const allChecked = criteria.length > 0 && criteria.every((c) => c.checked);

    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: Record<string, unknown> = {
          acceptance_criteria: criteria,
          updated_at: new Date().toISOString(),
        };
        if (allChecked) {
          updatePayload.status = 'READY_FOR_QA';
        }
        const { error } = await supabase.from('ifb_bugs').update(updatePayload).eq('id', bugId);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase updateBugCriteria failed:', err);
        throw err;
      }
    } else {
      throw new Error('Supabase is not configured; bug updates are disabled.');
    }

    const allBugs = getLocal<Bug[]>(STORAGE_BUGS_KEY, INITIAL_BUGS);
    const updated = allBugs.map((b) =>
      b.id === bugId
        ? {
            ...b,
            acceptance_criteria: criteria,
            status: allChecked && b.status !== 'FIXED' ? ('READY_FOR_QA' as BugStatus) : b.status,
          }
        : b
    );
    setLocal(STORAGE_BUGS_KEY, updated);
  },

  async toggleUpvote(bugId: string, userId: string): Promise<{ voted: boolean; count: number }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('ifb_toggle_bug_upvote', {
          target_bug_id: bugId,
          user_id_str: userId,
          reproduced_flag: true,
        });
        if (!error && data) {
          return { voted: data.voted, count: data.upvotes };
        }
      } catch (err) {
        console.warn('Supabase toggleUpvote RPC fallback:', err);
      }
    }

    const allBugs = getLocal<Bug[]>(STORAGE_BUGS_KEY, INITIAL_BUGS);
    let newCount = 1;
    const updated = allBugs.map((b) => {
      if (b.id === bugId) {
        newCount = b.upvotes_count + 1;
        return { ...b, upvotes_count: newCount, reproduced_count: b.reproduced_count + 1 };
      }
      return b;
    });
    setLocal(STORAGE_BUGS_KEY, updated);
    return { voted: true, count: newCount };
  },

  // 3. Comments
  async fetchComments(bugId: string): Promise<BugComment[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ifb_bug_comments')
          .select('*')
          .eq('bug_id', bugId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as BugComment[];
        }
      } catch (err) {
        console.warn('Supabase fetchComments fallback:', err);
      }
    }

    const allComments = getLocal<BugComment[]>(STORAGE_COMMENTS_KEY, INITIAL_COMMENTS);
    return allComments.filter((c) => c.bug_id === bugId);
  },

  async createComment(comment: BugComment): Promise<BugComment> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ifb_bug_comments')
          .insert([comment])
          .select()
          .single();
        if (!error && data) return data as BugComment;
      } catch (err) {
        console.warn('Supabase createComment fallback:', err);
      }
    }

    const allComments = getLocal<BugComment[]>(STORAGE_COMMENTS_KEY, INITIAL_COMMENTS);
    setLocal(STORAGE_COMMENTS_KEY, [comment, ...allComments]);
    return comment;
  },

  // 4. Realtime Subscriptions
  subscribeToProject(projectId: string, onBugChange: (bug: Bug, eventType: string) => void) {
    if (!isSupabaseConfigured || !supabase) return null;

    const channel = supabase
      .channel(`project-bugs-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ifb_bugs', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.new) {
            onBugChange(payload.new as Bug, payload.eventType);
          }
        }
      )
      .subscribe();

    return channel;
  },

  subscribeToBugComments(bugId: string, onNewComment: (comment: BugComment) => void) {
    if (!isSupabaseConfigured || !supabase) return null;

    const channel = supabase
      .channel(`bug-comments-${bugId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ifb_bug_comments', filter: `bug_id=eq.${bugId}` },
        (payload) => {
          if (payload.new) {
            onNewComment(payload.new as BugComment);
          }
        }
      )
      .subscribe();

    return channel;
  },

  // 5. Invites
  async validateInvite(token: string): Promise<{ project: Project; role: string } | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ifb_project_invites')
          .select('*, project:ifb_projects(*)')
          .eq('token', token)
          .single();

        if (!error && data) {
          await supabase
            .from('ifb_project_invites')
            .update({ uses_count: (data.uses_count || 0) + 1 })
            .eq('id', data.id);

          return { project: data.project as Project, role: data.role };
        }
      } catch (err) {
        console.warn('Supabase validateInvite error:', err);
      }
    }

    // Local fallback
    const projects = await this.fetchProjects();
    const found = projects.find((p) => token.includes(p.slug));
    if (found) {
      return { project: found, role: 'developer' };
    }
    return null;
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
