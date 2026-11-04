'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project, Bug, UserProfile, BugNotification } from '@/types';
import { DataService } from '@/lib/supabase/data-service';
import { AppNavbar } from '@/components/AppNavbar';
import { BugIcon, PlusIcon, ShareIcon, ExternalLinkIcon, CheckIcon } from '@/components/icons';
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
                Workspace Hub
              </span>
              <span className="text-zinc-500 text-xs font-mono">Linear-Grade Bug Triage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Boshqaruv Paneli & Faol Loyihalar
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Barcha ilovalaringiz xatoliklarini bitta markaziy platformada real-time kuzating,
              Telegram guruhlar bilan sinxronlashtiring va jamoaviy yechim toping.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-[0_0_20px_-3px_rgba(16,185,129,0.3)] hover:scale-[1.02] cursor-pointer"
            >
              <PlusIcon className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
              <span>Yangi Loyiha Ochish</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Cards with Sleek Linear Styling */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="linear-card rounded-2xl p-4.5 space-y-2.5 border border-white/[0.06]">
            <span className="text-xs font-medium text-zinc-400">Jami Qayd Etilgan Buglar</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{totalBugs}</span>
              <span className="text-[11px] text-zinc-500 font-mono">Barcha loyihalar</span>
            </div>
            <div className="w-full bg-zinc-800/60 h-1.5 rounded-full overflow-hidden">
              <div className="bg-zinc-400 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="linear-card rounded-2xl p-4.5 space-y-2.5 border border-red-500/20 bg-red-950/10">
            <span className="text-xs font-medium text-red-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Kritik (CRITICAL / P0)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-red-400">{criticalBugs}</span>
              <span className="text-[11px] text-red-400/70 font-mono">Tezkor e&apos;tibor</span>
            </div>
            <div className="w-full bg-red-950/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all duration-500"
                style={{ width: totalBugs > 0 ? `${(criticalBugs / totalBugs) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div className="linear-card rounded-2xl p-4.5 space-y-2.5 border border-amber-500/20 bg-amber-950/10">
            <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Jarayonda (In Progress)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">{inProgressBugs}</span>
              <span className="text-[11px] text-amber-400/70 font-mono">Ishlanmoqda</span>
            </div>
            <div className="w-full bg-amber-950/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: totalBugs > 0 ? `${(inProgressBugs / totalBugs) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div className="linear-card rounded-2xl p-4.5 space-y-2.5 border border-emerald-500/20 bg-emerald-950/10">
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              Tuzatildi (Fixed & QA)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">{fixedBugs}</span>
              <span className="text-[11px] text-emerald-400/70 font-mono">
                {totalBugs > 0 ? `${Math.round((fixedBugs / totalBugs) * 100)}% barqarorlik` : '100%'}
              </span>
            </div>
            <div className="w-full bg-emerald-950/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: totalBugs > 0 ? `${(fixedBugs / totalBugs) * 100}%` : '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Faol Loyihalar & Ish Maydonlari</span>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
                {projects.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 animate-pulse p-6" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const projectBugs = bugs.filter((b) => b.project_id === project.id);
                const projOpen = projectBugs.filter((b) => !['FIXED', 'CLOSED'].includes(b.status)).length;
                const projFixed = projectBugs.filter((b) => ['FIXED', 'VERIFIED'].includes(b.status)).length;
                const projCritical = projectBugs.filter((b) => b.severity === 'CRITICAL' && b.status !== 'FIXED').length;

                return (
                  <div
                    key={project.id}
                    className="linear-card rounded-2xl p-5 flex flex-col justify-between transition-all group border border-white/[0.08]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-sm border border-white/10"
                            style={{ backgroundColor: `${project.color || '#10b981'}15`, color: project.color || '#10b981' }}
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
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            project.is_public
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {project.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {project.description || 'Bu loyiha uchun qisqacha tavsif yozilmagan.'}
                      </p>

                      {/* Tech stack tags */}
                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {project.tech_stack.slice(0, 4).map((tech, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Stats & Actions */}
                    <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-xs font-mono">
                        <span className="text-zinc-400">
                          <strong className="text-white">{projOpen}</strong> ochiq
                        </span>
                        {projCritical > 0 && (
                          <span className="text-red-400 font-bold">
                            {projCritical} kritik
                          </span>
                        )}
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
                          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition"
                          title="Taklif havolasi & Telegram"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </button>

                        <Link
                          href={`/p/${project.slug}`}
                          className="text-xs font-bold text-zinc-100 hover:text-black hover:bg-emerald-400 flex items-center gap-1 transition px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700"
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
                className="min-h-[190px] border border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all group cursor-pointer space-y-2.5"
              >
                <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/50 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 group-hover:scale-105 transition">
                  <PlusIcon className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white transition">
                    Yangi Loyiha Ochish
                  </h4>
                  <p className="text-[11px] text-zinc-500 max-w-[200px] mt-0.5">
                    Yangi ilovangiz uchun workspace va Telegram integratsiyasini boshlang
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Global Recent Bugs Feed */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Eng So‘nggi Xatoliklar Oqimi</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Barcha loyihalar bo‘yicha</span>
          </div>

          <div className="linear-card rounded-2xl overflow-hidden divide-y divide-zinc-800/80 border border-white/[0.06]">
            {bugs.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs font-mono">
                Hozircha hech qanday bug kiritilmagan
              </div>
            ) : (
              bugs.slice(0, 8).map((b) => {
                const project = projects.find((p) => p.id === b.project_id);
                const projSlug = project?.slug || 'barbershop';

                return (
                  <Link
                    key={b.id}
                    href={`/p/${projSlug}/bugs/${b.code || b.id}`}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-800/40 transition group block"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-mono font-bold text-xs bg-zinc-900 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-800 shrink-0 group-hover:border-zinc-700 transition">
                        {b.code}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-emerald-400 transition truncate">
                          {b.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                          <span className="text-zinc-400 font-medium">{project?.name || 'Loyiha'}</span>
                          <span>•</span>
                          <span>{b.section}</span>
                          <span>•</span>
                          <span>{new Date(b.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                          b.severity === 'CRITICAL'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : b.severity === 'HIGH'
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {b.severity}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800">
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
