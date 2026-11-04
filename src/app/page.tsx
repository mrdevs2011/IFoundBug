'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project, Bug, UserProfile, BugNotification } from '@/types';
import { DataService } from '@/lib/supabase/data-service';
import { AppNavbar } from '@/components/AppNavbar';
import { BugIcon, PlusIcon, ShareIcon, ExternalLinkIcon } from '@/components/icons';
import { ReportBugModal } from '@/components/ReportBugModal';
import { ShareInviteModal } from '@/components/ShareInviteModal';
import NewProjectModal from '@/components/NewProjectModal';
import AuthModal from '@/components/AuthModal';
import OnboardingView from '@/components/OnboardingView';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

function getSavedUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ifb_active_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [user, setUser] = useState<UserProfile | null>(getSavedUser);
  const [notifications] = useState<BugNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: (session.user.user_metadata?.full_name as string) || session.user.email?.split('@')[0] || 'Dasturchi',
            role: (session.user.user_metadata?.role as UserProfile['role']) || 'developer',
            created_at: session.user.created_at,
          };
          setUser(profile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ifb_active_user', JSON.stringify(profile));
          }
        }
      });
    }

    async function loadData() {
      setLoading(true);
      try {
        const projs = await DataService.fetchProjects();
        setProjects(projs);

        // Fetch bugs for all projects
        const bugsList: Bug[] = [];
        for (const p of projs) {
          const projectBugs = await DataService.fetchBugs(p.id);
          bugsList.push(...projectBugs);
        }
        setBugs(bugsList);

        if (projs.length > 0) {
          setSelectedProjectForModal(projs[0]);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateProject = async (projData: Partial<Project>) => {
    const created = await DataService.createProject(projData);
    setProjects((prev) => [created, ...prev]);
    setShowNewProjectModal(false);
  };

  const handleCreateBug = async (bugData: Partial<Bug>) => {
    if (!selectedProjectForModal) return;
    const nextCodeNumber = bugs.length + 1;
    const newBug: Bug = {
      id: `bug-${Date.now()}`,
      code: `B${nextCodeNumber < 10 ? '0' + nextCodeNumber : nextCodeNumber}`,
      project_id: selectedProjectForModal.id,
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

    const saved = await DataService.createBug(newBug, selectedProjectForModal);
    setBugs((prev) => [saved, ...prev]);
    setShowReportModal(false);
  };

  // Metrics
  const totalBugs = bugs.length;
  const criticalBugs = bugs.filter((b) => b.severity === 'CRITICAL' && b.status !== 'FIXED').length;
  const inProgressBugs = bugs.filter((b) => b.status === 'IN_PROGRESS').length;
  const fixedBugs = bugs.filter((b) => b.status === 'FIXED' || b.status === 'VERIFIED').length;

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
        projects={projects}
        user={user}
        notifications={notifications}
        onOpenReportModal={() => {
          if (projects.length > 0) {
            setSelectedProjectForModal(projects[0]);
            setShowReportModal(true);
          }
        }}
        onOpenNewProjectModal={() => setShowNewProjectModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                IFoundBug v2.0
              </span>
              <span className="text-zinc-500 text-xs">Linear-grade Bug Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Boshqaruv Paneli & Loyihalar
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Telegram guruhlardagi tartibsizlikka chek qo‘ying. Barcha ilovalaringiz xatolarini bitta joyda
              real-time kuzating, jamoani taklif qiling va 1-bosishda xatolarni ulashing.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-lg shadow-emerald-500/10"
            >
              <PlusIcon className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
              <span>Yangi Loyiha Ochish</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4.5 space-y-2">
            <span className="text-xs font-medium text-zinc-400">Jami Qayd Etilgan Buglar</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{totalBugs}</span>
              <span className="text-xs text-zinc-500 font-mono">Barcha loyihalar</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4.5 space-y-2">
            <span className="text-xs font-medium text-red-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Kritik (CRITICAL / P0)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-red-400">{criticalBugs}</span>
              <span className="text-xs text-zinc-500 font-mono">Tezkor e&apos;tibor</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4.5 space-y-2">
            <span className="text-xs font-medium text-amber-400">Jarayonda (In Progress)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">{inProgressBugs}</span>
              <span className="text-xs text-zinc-500 font-mono">Ishlanmoqda</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4.5 space-y-2">
            <span className="text-xs font-medium text-emerald-400">Tuzatildi (Fixed & Verified)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">{fixedBugs}</span>
              <span className="text-xs text-zinc-500 font-mono">
                {totalBugs > 0 ? `${Math.round((fixedBugs / totalBugs) * 100)}% unumdorlik` : '100%'}
              </span>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Faol Loyihalar & Ish Maydonlari</span>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {projects.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse p-6" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const projectBugs = bugs.filter((b) => b.project_id === project.id);
                const projOpen = projectBugs.filter((b) => !['FIXED', 'CLOSED'].includes(b.status)).length;
                const projFixed = projectBugs.filter((b) => ['FIXED', 'VERIFIED'].includes(b.status)).length;

                return (
                  <div
                    key={project.id}
                    className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between transition group shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-inner"
                            style={{ backgroundColor: `${project.color || '#10b981'}20`, color: project.color || '#10b981' }}
                          >
                            <BugIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white group-hover:text-emerald-400 transition text-sm sm:text-base leading-tight">
                              {project.name}
                            </h3>
                            <span className="font-mono text-[11px] text-zinc-500">/p/{project.slug}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            project.is_public
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {project.is_public ? 'Ochiq (Public)' : 'Maxfiy'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {project.description || 'Bu loyiha uchun tavsif yozilmagan.'}
                      </p>

                      {/* Tech stack */}
                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {project.tech_stack.slice(0, 4).map((tech, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Stats & Actions */}
                    <div className="pt-5 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-zinc-400">
                          <strong className="text-white">{projOpen}</strong> ochiq
                        </span>
                        <span className="text-emerald-400">
                          <strong>{projFixed}</strong> tuzatildi
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProjectForModal(project);
                            setShowShareModal(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                          title="Taklif havolasi & Telegram"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </button>

                        <Link
                          href={`/p/${project.slug}`}
                          className="text-xs font-bold text-zinc-200 hover:text-emerald-400 flex items-center gap-1 transition px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700"
                        >
                          <span>Doska</span>
                          <ExternalLinkIcon className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Project Card */}
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="h-full min-h-[200px] border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/30 rounded-2xl flex flex-col items-center justify-center p-6 text-center transition group cursor-pointer space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/50 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 transition">
                  <PlusIcon className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-xs font-bold text-zinc-300 group-hover:text-white">Yangi Loyiha Qo‘shish</span>
                <span className="text-[11px] text-zinc-500 max-w-[200px]">
                  Yangi ilovangiz uchun workspace va Telegram guruh oching
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Global Recent Bugs Feed */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Eng So‘nggi Xatoliklar Oqimi</span>
            </h2>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/80">
            {bugs.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs">Hozircha hech qanday bug kiritilmagan</div>
            ) : (
              bugs.slice(0, 10).map((b) => {
                const project = projects.find((p) => p.id === b.project_id);
                const projSlug = project?.slug || 'barbershop';

                return (
                  <Link
                    key={b.id}
                    href={`/p/${projSlug}/bugs/${b.code || b.id}`}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-800/50 transition group block"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono font-bold text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700 shrink-0">
                        {b.code}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-emerald-400 transition truncate">
                          {b.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                          <span>{project?.name || 'Loyiha'}</span>
                          <span>•</span>
                          <span>{b.section}</span>
                          <span>•</span>
                          <span>{new Date(b.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          b.severity === 'CRITICAL'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : b.severity === 'HIGH'
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {b.severity}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {b.status}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showNewProjectModal && (
        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          onCreate={handleCreateProject}
        />
      )}

      {showReportModal && selectedProjectForModal && (
        <ReportBugModal
          project={selectedProjectForModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleCreateBug}
        />
      )}

      {showShareModal && selectedProjectForModal && (
        <ShareInviteModal
          project={selectedProjectForModal}
          onClose={() => setShowShareModal(false)}
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
