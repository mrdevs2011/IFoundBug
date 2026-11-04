'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project, Bug, BugStatus, BugNotification, UserProfile } from '@/types';
import { DataService } from '@/lib/supabase/data-service';
import { AppNavbar } from '@/components/AppNavbar';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ReportBugModal } from '@/components/ReportBugModal';
import { ShareInviteModal } from '@/components/ShareInviteModal';
import { AIPromptModal } from '@/components/AIPromptModal';
import CommandPalette from '@/components/CommandPalette';
import AuthModal from '@/components/AuthModal';
import OnboardingView from '@/components/OnboardingView';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  SearchIcon,
  SparklesIcon,
  KanbanIcon,
  ListIcon,
  ThumbsUpIcon,
} from '@/components/icons';


export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.projectSlug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<BugNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIPromptModal, setShowAIPromptModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Load project & bugs & session
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data: { user: authUser, }, error }) => {
        if (!error && authUser) {
          const profile: UserProfile = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: (authUser.user_metadata?.full_name as string) || authUser.email?.split('@')[0] || 'Dasturchi',
            role: (authUser.user_metadata?.role as UserProfile['role']) || 'developer',
            created_at: authUser.created_at,
          };
          setUser(profile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ifb_active_user', JSON.stringify(profile));
          }
        }
      });
    }

    async function loadWorkspace() {
      setLoading(true);
      try {
        const projs = await DataService.fetchProjects();
        setAllProjects(projs);

        const current = await DataService.fetchProjectBySlug(projectSlug);
        if (current) {
          setProject(current);
          const projectBugs = await DataService.fetchBugs(current.id);
          setBugs(projectBugs);
        }
      } catch (err) {
        console.error('Error loading workspace:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [projectSlug]);

  // Realtime subscription on project bugs
  useEffect(() => {
    if (!project) return;

    const channel = DataService.subscribeToProject(project.id, (updatedBug, eventType) => {
      setBugs((prev) => {
        if (eventType === 'INSERT') {
          return [updatedBug, ...prev.filter((b) => b.id !== updatedBug.id)];
        }
        if (eventType === 'UPDATE') {
          return prev.map((b) => (b.id === updatedBug.id ? updatedBug : b));
        }
        if (eventType === 'DELETE') {
          return prev.filter((b) => b.id !== updatedBug.id);
        }
        return prev;
      });

      // Add Notification
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          bug_id: updatedBug.id,
          bug_code: updatedBug.code,
          title: updatedBug.title,
          message:
            eventType === 'INSERT'
              ? 'Yangi bug qo‘shildi'
              : `Status: ${updatedBug.status}`,
          type: eventType === 'INSERT' ? 'new_bug' : 'status_change',
          read: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [project]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setShowReportModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered Bugs
  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          bug.code.toLowerCase().includes(q) ||
          bug.title.toLowerCase().includes(q) ||
          bug.section.toLowerCase().includes(q) ||
          (bug.screen || '').toLowerCase().includes(q) ||
          bug.actual_behavior.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedSeverity !== 'ALL' && bug.severity !== selectedSeverity) return false;
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'OPEN' && ['FIXED', 'CLOSED', 'WONT_FIX'].includes(bug.status)) return false;
        if (selectedStatus === 'RESOLVED' && !['FIXED', 'CLOSED'].includes(bug.status)) return false;
        if (bug.status !== selectedStatus) return false;
      }
      if (selectedSection !== 'ALL' && bug.section !== selectedSection) return false;

      return true;
    });
  }, [bugs, searchQuery, selectedSeverity, selectedStatus, selectedSection]);

  const sections = useMemo(() => {
    const s = new Set<string>();
    bugs.forEach((b) => s.add(b.section));
    return Array.from(s);
  }, [bugs]);

  // Handlers
  const handleStatusChange = async (bugId: string, newStatus: BugStatus) => {
    setBugs((prev) =>
      prev.map((b) => (b.id === bugId ? { ...b, status: newStatus } : b))
    );
    await DataService.updateBugStatus(bugId, newStatus, user?.full_name || 'Dasturchi');
  };

  const handleCreateBug = async (bugData: Partial<Bug>) => {
    if (!project) return;
    const nextCodeNumber = bugs.length + 1;
    const newBug: Bug = {
      id: `bug-${Date.now()}`,
      code: `B${nextCodeNumber < 10 ? '0' + nextCodeNumber : nextCodeNumber}`,
      project_id: project.id,
      title: bugData.title || 'Nomsiz bug',
      summary: bugData.actual_behavior || '',
      section: bugData.section || 'UI',
      screen: bugData.screen || 'Main',
      severity: bugData.severity || 'MEDIUM',
      priority: bugData.priority || 'P2',
      status: 'REPORTED',
      environment: bugData.environment || 'PRODUCTION',
      actual_behavior: bugData.actual_behavior || '',
      expected_behavior: bugData.expected_behavior || '',
      steps_to_reproduce: bugData.steps_to_reproduce || [],
      acceptance_criteria: bugData.acceptance_criteria || [],
      device_telemetry: bugData.device_telemetry,
      dev_notes: bugData.dev_notes || '',
      evidence_urls: bugData.evidence_urls || [],
      is_sensitive: bugData.is_sensitive || false,
      upvotes_count: 1,
      reproduced_count: 1,
      views_count: 1,
      reporter_name: bugData.reporter_name || user?.full_name || 'Dasturchi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await DataService.createBug(newBug, project);
    setBugs((prev) => [saved, ...prev]);
    setShowReportModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs text-zinc-500 font-mono">Loyiha yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <h2 className="text-lg font-bold text-white">Loyiha topilmadi</h2>
            <p className="text-xs text-zinc-400">/{projectSlug} manzili bo‘yicha loyiha mavjud emas.</p>
            <Link
              href="/"
              className="inline-block text-xs font-bold px-4 py-2 bg-emerald-500 text-black rounded-lg"
            >
              Asosiy sahifaga qaytish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ifb_active_user');
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
  };

  if (!user && !loading) {
    return <OnboardingView onAuthSuccess={(loggedUser) => setUser(loggedUser)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <AppNavbar
        currentProject={project}
        projects={allProjects}
        user={user}
        notifications={notifications}
        onOpenReportModal={() => setShowReportModal(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onSelectBug={(bId) => router.push(`/p/${project.slug}/bugs/${bId}`)}
      />

      {/* Workspace Subheader & Toolbar */}
      <div className="border-b border-white/[0.06] bg-zinc-950/70 sticky top-16 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <SearchIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Qidirish (kod, nom, bo'lim)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-14 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-500 hover:text-zinc-300 text-xs p-1"
                >
                  ✕
                </button>
              ) : (
                <kbd>/</kbd>
              )}
            </div>
          </div>

          {/* Filters & View Switches */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="ALL">Barcha darajalar</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="ALL">Barcha holatlar</option>
              <option value="OPEN">Faqat Ochiq</option>
              <option value="IN_PROGRESS">Jarayonda</option>
              <option value="RESOLVED">Tuzatilgan</option>
            </select>

            {/* Section Filter */}
            {sections.length > 0 && (
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-700 cursor-pointer hidden md:block"
              >
                <option value="ALL">Barcha bo‘limlar</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            {/* AI Sprint Prompt */}
            <button
              onClick={() => setShowAIPromptModal(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition cursor-pointer"
              title="Claude Code / Cursor uchun Sprint Prompt"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Prompt</span>
            </button>

            {/* View Mode Toggle: Kanban vs List */}
            <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Kanban Taxtasi"
              >
                <KanbanIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>

              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Ro'yxat (List)"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ro‘yxat</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredBugs.length === 0 ? (
          <div className="py-20 text-center space-y-3 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-zinc-400 text-sm">Tanlangan filtrlar bo‘yicha buglar topilmadi.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSeverity('ALL');
                setSelectedStatus('ALL');
                setSelectedSection('ALL');
              }}
              className="text-xs text-emerald-400 hover:underline font-mono"
            >
              Filtrlarni tozalash
            </button>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            bugs={filteredBugs}
            privacyMode={false}
            onSelectBug={(bug) => router.push(`/p/${project.slug}/bugs/${bug.code || bug.id}`)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          /* High-Density List View */
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/80">
            {filteredBugs.map((bug) => (
              <div
                key={bug.id}
                onClick={() => router.push(`/p/${project.slug}/bugs/${bug.code || bug.id}`)}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-zinc-800/50 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono font-bold text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700 shrink-0">
                    {bug.code}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-emerald-400 transition truncate">
                      {bug.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                      <span>{bug.section}</span>
                      <span>•</span>
                      <span>{bug.screen || 'Asosiy'}</span>
                      <span>•</span>
                      <span className="font-mono">{bug.environment}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      bug.severity === 'CRITICAL'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : bug.severity === 'HIGH'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {bug.severity}
                  </span>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {bug.status}
                  </span>

                  <span className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 font-mono">
                    <ThumbsUpIcon className="w-3 h-3 text-zinc-500" />
                    <span>{bug.upvotes_count}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showReportModal && (
        <ReportBugModal
          project={project}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleCreateBug}
        />
      )}

      {showShareModal && (
        <ShareInviteModal
          project={project}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showAIPromptModal && (
        <AIPromptModal
          bugs={filteredBugs.filter((b) => b.status !== 'FIXED')}
          onClose={() => setShowAIPromptModal(false)}
        />
      )}

      {showCommandPalette && (
        <CommandPalette
          isOpen={showCommandPalette}
          bugs={bugs}
          currentProject={project}
          onClose={() => setShowCommandPalette(false)}
          onSelectBug={(b) => router.push(`/p/${project.slug}/bugs/${b.code || b.id}`)}
          onOpenReportModal={() => setShowReportModal(true)}
          onOpenShareModal={() => setShowShareModal(true)}
          onOpenAIPrompt={() => setShowAIPromptModal(true)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
            setShowAuthModal(false);
          }}
        />
      )}
    </div>
  );
}
