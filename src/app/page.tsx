'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bug, Project, BugComment, BugStatus, Severity, UserProfile } from '@/types';
import { INITIAL_PROJECTS, INITIAL_BUGS, INITIAL_COMMENTS } from '@/lib/mock-data';
import {
  BugIcon,
  SparklesIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  ShareIcon,
  ThumbsUpIcon,
  EyeIcon,
  EyeOffIcon,
  KanbanIcon,
  ListIcon,
  ExternalLinkIcon,
} from '@/components/icons';
import { BugDetailModal } from '@/components/BugDetailModal';
import { ReportBugModal } from '@/components/ReportBugModal';
import { AIPromptModal } from '@/components/AIPromptModal';
import { ShareInviteModal } from '@/components/ShareInviteModal';
import { KanbanBoard } from '@/components/KanbanBoard';
import CyberBackground from '@/components/CyberBackground';
import CyberHUD from '@/components/CyberHUD';
import VirtualDeviceRadar from '@/components/VirtualDeviceRadar';
import CommandPalette from '@/components/CommandPalette';
import AuthModal from '@/components/AuthModal';
import OnboardingModal from '@/components/OnboardingModal';
import NewProjectModal from '@/components/NewProjectModal';
import { cyberSound } from '@/lib/cyber-sound';

export default function IFoundBugApp() {
  // State
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [currentProject, setCurrentProject] = useState<Project>(INITIAL_PROJECTS[0]);
  const [bugs, setBugs] = useState<Bug[]>(INITIAL_BUGS);
  const [comments, setComments] = useState<BugComment[]>(INITIAL_COMMENTS);

  // User & Auth State
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ifb_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'virtual-radar'>('virtual-radar');
  const [privacyMode, setPrivacyMode] = useState(true);

  // Selection & Active Modal State
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIPromptModal, setShowAIPromptModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [selectedBugIdsForSprint, setSelectedBugIdsForSprint] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const handleAuthSuccess = (u: UserProfile, isNewUser?: boolean) => {
    setUser(u);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ifb_user', JSON.stringify(u));
    }
    if (isNewUser) {
      setShowOnboardingModal(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ifb_user');
    }
    cyberSound.playClick();
  };

  const handleCreateProject = (newProj: Project) => {
    setProjects((prev) => [newProj, ...prev]);
    setCurrentProject(newProj);
    cyberSound.playSuccess();
  };

  const handleLoadSampleBugs = () => {
    const sampleBugs = INITIAL_BUGS.map((b) => ({
      ...b,
      project_id: currentProject.id,
    }));
    setBugs((prev) => [
      ...prev.filter((b) => b.project_id !== currentProject.id),
      ...sampleBugs,
    ]);
    cyberSound.playSuccess();
  };

  // Audio chimes (synthesized via Web Audio API)
  const playChime = (type: 'resolve' | 'vote') => {
    if (type === 'resolve') {
      cyberSound.playSuccess();
    } else {
      cyberSound.playBlip(750);
    }
  };

  // Filtered bugs
  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      if (bug.project_id !== currentProject.id) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = bug.code.toLowerCase().includes(q);
        const matchesTitle = bug.title.toLowerCase().includes(q);
        const matchesSection = bug.section.toLowerCase().includes(q);
        const matchesScreen = (bug.screen || '').toLowerCase().includes(q);
        const matchesActual = bug.actual_behavior.toLowerCase().includes(q);
        const matchesExpected = bug.expected_behavior.toLowerCase().includes(q);
        const matchesSearchKeys = (bug.search_keys || []).some((k) => k.toLowerCase().includes(q));

        if (!matchesCode && !matchesTitle && !matchesSection && !matchesScreen && !matchesActual && !matchesExpected && !matchesSearchKeys) {
          return false;
        }
      }

      // Severity filter
      if (selectedSeverity !== 'ALL' && bug.severity !== selectedSeverity) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'OPEN') {
          if (['FIXED', 'CLOSED', 'WONT_FIX'].includes(bug.status)) return false;
        } else if (selectedStatus === 'RESOLVED') {
          if (!['FIXED', 'CLOSED'].includes(bug.status)) return false;
        } else if (bug.status !== selectedStatus) {
          return false;
        }
      }

      // Section filter
      if (selectedSection !== 'ALL' && bug.section !== selectedSection) {
        return false;
      }

      return true;
    });
  }, [bugs, currentProject.id, searchQuery, selectedSeverity, selectedStatus, selectedSection]);

  const filteredBugsRef = useRef(filteredBugs);
  useEffect(() => {
    filteredBugsRef.current = filteredBugs;
  }, [filteredBugs]);

  // Keyboard Shortcuts (Linear / Vim style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      const list = filteredBugsRef.current;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        cyberSound.playRadarPing();
        setViewMode((prev) => (prev === 'virtual-radar' ? 'list' : 'virtual-radar'));
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPrivacyMode((prev) => !prev);
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setShowReportModal(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSelectedBug(null);
        setShowReportModal(false);
        setShowShareModal(false);
        setShowAIPromptModal(false);
        setShowShortcutsModal(false);
        setShowCommandPalette(false);
      } else if (e.key === 'j') {
        setSelectedIndex((prev) => Math.min(list.length - 1, prev + 1));
      } else if (e.key === 'k') {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Enter') {
        if (list[selectedIndex]) {
          setSelectedBug(list[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  // Statistics
  const stats = useMemo(() => {
    const projectBugs = bugs.filter((b) => b.project_id === currentProject.id);
    const total = projectBugs.length;
    const critical = projectBugs.filter((b) => b.severity === 'CRITICAL' && b.status !== 'FIXED').length;
    const inProgress = projectBugs.filter((b) => b.status === 'IN_PROGRESS').length;
    const fixed = projectBugs.filter((b) => b.status === 'FIXED' || b.status === 'VERIFIED').length;
    const rate = total > 0 ? Math.round((fixed / total) * 100) : 0;
    return { total, critical, inProgress, fixed, rate };
  }, [bugs, currentProject.id]);

  // Available sections for filter dropdown
  const sections = useMemo(() => {
    const set = new Set<string>();
    bugs.filter((b) => b.project_id === currentProject.id).forEach((b) => set.add(b.section));
    return Array.from(set);
  }, [bugs, currentProject.id]);

  // Handlers
  const handleStatusChange = (bugId: string, newStatus: BugStatus) => {
    setBugs((prev) =>
      prev.map((b) => {
        if (b.id === bugId) {
          const updated = {
            ...b,
            status: newStatus,
            resolved_at: newStatus === 'FIXED' ? new Date().toISOString() : b.resolved_at,
          };
          if (newStatus === 'FIXED') playChime('resolve');
          return updated;
        }
        return b;
      })
    );

    if (selectedBug && selectedBug.id === bugId) {
      setSelectedBug((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleToggleAcceptance = (bugId: string, criterionId: string) => {
    setBugs((prev) =>
      prev.map((b) => {
        if (b.id === bugId) {
          const updatedCriteria = b.acceptance_criteria.map((ac) =>
            ac.id === criterionId ? { ...ac, checked: !ac.checked } : ac
          );
          const allChecked = updatedCriteria.length > 0 && updatedCriteria.every((c) => c.checked);
          const newStatus = allChecked && b.status !== 'FIXED' ? 'READY_FOR_QA' : b.status;
          return {
            ...b,
            acceptance_criteria: updatedCriteria,
            status: newStatus,
          };
        }
        return b;
      })
    );

    if (selectedBug && selectedBug.id === bugId) {
      setSelectedBug((prev) => {
        if (!prev) return null;
        const updatedCriteria = prev.acceptance_criteria.map((ac) =>
          ac.id === criterionId ? { ...ac, checked: !ac.checked } : ac
        );
        return { ...prev, acceptance_criteria: updatedCriteria };
      });
    }
  };

  const handleUpvote = (bugId: string) => {
    playChime('vote');
    setBugs((prev) =>
      prev.map((b) => {
        if (b.id === bugId) {
          return {
            ...b,
            upvotes_count: b.upvotes_count + 1,
            reproduced_count: b.reproduced_count + 1,
          };
        }
        return b;
      })
    );

    if (selectedBug && selectedBug.id === bugId) {
      setSelectedBug((prev) => (prev ? { ...prev, upvotes_count: prev.upvotes_count + 1 } : null));
    }
  };

  const handleAddComment = (bugId: string, content: string, isInternal: boolean) => {
    const newComment: BugComment = {
      id: `comm-${Date.now()}`,
      bug_id: bugId,
      author_name: 'Muhamad R. (Lead)',
      author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      content,
      is_internal: isInternal,
      reactions: {},
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [newComment, ...prev]);
  };

  const handleCreateBug = (newBugData: Partial<Bug>) => {
    const nextCodeNumber = bugs.length + 1;
    const newBug: Bug = {
      id: `bug-${Date.now()}`,
      code: `B${nextCodeNumber < 10 ? '0' + nextCodeNumber : nextCodeNumber}`,
      project_id: currentProject.id,
      title: newBugData.title || 'Nomsiz bug',
      summary: newBugData.actual_behavior || '',
      section: newBugData.section || 'UI',
      screen: newBugData.screen || 'Main',
      severity: newBugData.severity || 'MEDIUM',
      priority: newBugData.priority || 'P2',
      status: 'REPORTED',
      environment: newBugData.environment || 'PRODUCTION',
      actual_behavior: newBugData.actual_behavior || '',
      expected_behavior: newBugData.expected_behavior || '',
      steps_to_reproduce: newBugData.steps_to_reproduce || [],
      acceptance_criteria: newBugData.acceptance_criteria || [],
      device_telemetry: newBugData.device_telemetry,
      dev_notes: newBugData.dev_notes || '',
      evidence_urls: newBugData.evidence_urls || [],
      is_sensitive: newBugData.is_sensitive || false,
      upvotes_count: 1,
      reproduced_count: 1,
      views_count: 1,
      reporter_name: newBugData.reporter_name || 'Anonymous Hunter',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBugs([newBug, ...bugs]);
    setSelectedBug(newBug);
    playChime('resolve');
  };

  const severityBadges: Record<Severity, string> = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  const statusBadges: Record<BugStatus, { label: string; cls: string }> = {
    REPORTED: { label: 'Ochiq', cls: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
    TRIAGED: { label: 'Ko‘rildi', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
    IN_PROGRESS: { label: 'Jarayonda', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    READY_FOR_QA: { label: 'QA Testda', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    VERIFIED: { label: 'Tasdiqlandi', cls: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
    FIXED: { label: 'Tuzatildi ✓', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    CLOSED: { label: 'Yopildi', cls: 'bg-zinc-900 text-zinc-500 border-zinc-800' },
    WONT_FIX: { label: 'Bekor', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Top Cyber Ribbon */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 h-1 w-full" />

      {/* Primary Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="relative group flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <BugIcon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition duration-200" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent inline-flex items-baseline">
                  IFound<sub className="text-emerald-400 text-xs font-mono font-bold px-0.5 relative -bottom-0.5 not-italic select-none">a</sub>Bug
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 hidden sm:block">
                Stop Debugging in Telegram. Ship Flawless Software.
              </p>
            </div>
          </div>

          {/* Project Selector & New Project Button */}
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-2 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-1.5 shadow-inner">
              <span className="text-zinc-500 text-xs hidden md:inline">Loyiha:</span>
              <select
                value={currentProject.id}
                onChange={(e) => {
                  const found = projects.find((p) => p.id === e.target.value);
                  if (found) setCurrentProject(found);
                }}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                cyberSound.playClick();
                setShowNewProjectModal(true);
              }}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-400 hover:text-emerald-300 transition text-xs flex items-center gap-1"
              title="Yangi Loyiha Yaratish"
            >
              <span>+</span>
              <span className="hidden xl:inline font-semibold">Loyiha</span>
            </button>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Privacy Mode Toggle */}
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                privacyMode
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
              }`}
              title="Maxfiy rejim (P): Barcha rasmlarni xiralashtirish"
            >
              {privacyMode ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              <span className="hidden lg:inline">{privacyMode ? 'PII Blur Yoqilgan' : 'Ochiq'}</span>
            </button>

            {/* AI Sprint Prompt Generator Button */}
            <button
              onClick={() => {
                setSelectedBugIdsForSprint(filteredBugs.filter((b) => b.status !== 'FIXED').map((b) => b.id));
                setShowAIPromptModal(true);
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
              title="Claude Code va AI uchun Sprint Prompt"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Sprint Prompt</span>
            </button>

            {/* Invite & Share Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
              title="Jamoani taklif qilish va Telegram webhook"
            >
              <ShareIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ulashish</span>
            </button>

            {/* User Auth Profile / Login Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                <div
                  onClick={() => setShowOnboardingModal(true)}
                  className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs cursor-pointer hover:border-emerald-400 transition"
                  title="Profil sozlamalari & Onboarding"
                >
                  {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-none truncate max-w-[100px]">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono capitalize">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-zinc-500 hover:text-red-400 text-xs p-1 transition"
                  title="Hisobdan chiqish (Logout)"
                >
                  🚪
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
                <button
                  onClick={() => {
                    cyberSound.playClick();
                    setShowAuthModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                >
                  Kirish
                </button>
                <button
                  onClick={() => {
                    cyberSound.playClick();
                    setShowAuthModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition hidden sm:inline"
                >
                  Ro‘yxatdan o‘tish
                </button>
              </div>
            )}

            {/* + Report Bug Button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Bug Qo‘shish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Ambient Neural Cyber Particle Mesh */}
      <CyberBackground />

      {/* Realtime Cyber Telemetry & Mode Controller */}
      <CyberHUD
        bugs={bugs}
        viewMode={viewMode}
        onChangeViewMode={(mode) => setViewMode(mode)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenReportModal={() => setShowReportModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Statistics & Health Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Jami Buglar</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-white">{stats.total}</span>
              <span className="text-xs text-zinc-500 font-mono">100%</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-red-950/40 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Kritik (P0)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-red-400">{stats.critical}</span>
              <span className="text-xs text-zinc-500">Blockers</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-amber-950/40 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Jarayonda</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-amber-400">{stats.inProgress}</span>
              <span className="text-xs text-zinc-500">Active</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-emerald-950/40 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Tuzatildi</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-emerald-400">{stats.fixed}</span>
              <span className="text-xs text-emerald-400/80 font-bold">{stats.rate}%</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Tuzatish Darajasi</span>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs font-bold text-white">
                <span>Progress:</span>
                <span className="text-emerald-400">{stats.rate}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${stats.rate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buglarni qidirish (kod, sarlavha, ekran, muammo... yoki '/' bosing)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none transition shadow-inner"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                >
                  Tozalash
                </button>
              ) : (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                  /
                </kbd>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
              <button
                onClick={() => {
                  cyberSound.playClick();
                  setViewMode('list');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" /> Jadval
              </button>
              <button
                onClick={() => {
                  cyberSound.playClick();
                  setViewMode('kanban');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'kanban'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <KanbanIcon className="w-3.5 h-3.5" /> Kanban
              </button>
              <button
                onClick={() => {
                  cyberSound.playRadarPing();
                  setViewMode('virtual-radar');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'virtual-radar'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-zinc-400 hover:text-emerald-300'
                }`}
              >
                <span>📡</span> Virtual Radar
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/60 text-xs">
            <span className="text-zinc-500 flex items-center gap-1">
              <FilterIcon className="w-3.5 h-3.5" /> Filtrlar:
            </span>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Barcha Jiddiylik</option>
              <option value="CRITICAL">🔴 CRITICAL</option>
              <option value="HIGH">🟠 HIGH</option>
              <option value="MEDIUM">🟡 MEDIUM</option>
              <option value="LOW">🟢 LOW</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Barcha Holatlar</option>
              <option value="OPEN">Faqat Ochiqlar</option>
              <option value="IN_PROGRESS">Faqat Jarayonda</option>
              <option value="RESOLVED">Faqat Tuzatilganlar</option>
            </select>

            {/* Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Barcha Bo‘limlar</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            {(selectedSeverity !== 'ALL' || selectedStatus !== 'ALL' || selectedSection !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedSeverity('ALL');
                  setSelectedStatus('ALL');
                  setSelectedSection('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-emerald-400 hover:underline ml-2"
              >
                Filtrlarni tozalash
              </button>
            )}

            <div className="ml-auto text-zinc-400 text-xs font-mono">
              Topildi: <strong className="text-white">{filteredBugs.length}</strong> / {stats.total}
            </div>
          </div>
        </div>

        {/* Content View: Virtual Radar, Kanban, or List */}
        {viewMode === 'virtual-radar' ? (
          <VirtualDeviceRadar
            bugs={filteredBugs}
            onSelectBug={(bug) => setSelectedBug(bug)}
          />
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            bugs={filteredBugs}
            privacyMode={privacyMode}
            onSelectBug={(bug) => setSelectedBug(bug)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            {filteredBugs.length === 0 ? (
              <div className="py-16 text-center space-y-4 px-4">
                <BugIcon className="w-12 h-12 text-zinc-600 mx-auto" />
                <div>
                  <h4 className="text-base font-bold text-zinc-200">
                    {stats.total === 0
                      ? `"${currentProject.name}" loyihasida hali xatoliklar yo‘q!`
                      : 'Qidiruv bo‘yicha hech qanday bug topilmadi'}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                    {stats.total === 0
                      ? 'Bu toza real loyiha. Birinchi haqiqiy xatolikni qo‘shing yoki tekshirib ko‘rish uchun namunaviy ma’lumotlarni yuklang.'
                      : 'Filtrlarni tozalang yoki yangi xatolik qo‘shing.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <PlusIcon className="w-4 h-4" /> + Birinchi Bugni Qo‘shish
                  </button>
                  {stats.total === 0 && (
                    <button
                      onClick={handleLoadSampleBugs}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 transition inline-flex items-center gap-1.5"
                    >
                      📦 Namunaviy Buglarni Yuklash (Demo)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {filteredBugs.map((bug, index) => {
                  const isSelected = selectedIndex === index;
                  const completedCriteria = bug.acceptance_criteria.filter((c) => c.checked).length;
                  const totalCriteria = bug.acceptance_criteria.length;

                  return (
                    <div
                      key={bug.id}
                      onClick={() => {
                        cyberSound.playClick();
                        setSelectedIndex(index);
                        setSelectedBug(bug);
                      }}
                      onMouseEnter={() => {
                        cyberSound.playBlip(700 + (index % 6) * 60);
                      }}
                      className={`p-4 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group ${
                        isSelected
                          ? 'bg-zinc-800/60 border-l-4 border-l-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.06)]'
                          : 'hover:bg-zinc-800/40 hover:border-l-2 hover:border-l-emerald-500/50'
                      }`}
                    >
                      {/* Left: Code, Status, Title, Telemetry */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-zinc-800 text-zinc-200 px-2.5 py-0.5 rounded border border-zinc-700">
                            {bug.code}
                          </span>

                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${severityBadges[bug.severity]}`}>
                            {bug.severity} ({bug.priority})
                          </span>

                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${statusBadges[bug.status]?.cls}`}>
                            {statusBadges[bug.status]?.label}
                          </span>

                          <span className="text-xs text-zinc-400 font-medium truncate">
                            📍 {bug.section} • {bug.screen || 'General'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition leading-snug">
                          {bug.title}
                        </h3>

                        {/* Summary / Actual */}
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          ❌ {bug.actual_behavior}
                        </p>
                      </div>

                      {/* Right: Evidence thumbnail, Checklist progress, Upvotes */}
                      <div className="flex items-center space-x-4 shrink-0 self-end md:self-center">
                        {/* Acceptance progress */}
                        {totalCriteria > 0 && (
                          <div className="hidden sm:flex flex-col items-end text-xs text-zinc-400">
                            <span className="text-[11px] font-mono">
                              Mezon: {completedCriteria}/{totalCriteria}
                            </span>
                            <div className="w-16 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${(completedCriteria / totalCriteria) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Evidence preview thumbnail */}
                        {bug.evidence_urls.length > 0 && (
                          <div
                            className={`w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center transition ${
                              privacyMode ? 'blur-[3px]' : ''
                            }`}
                          >
                            <img
                              src={bug.evidence_urls[0]}
                              alt={bug.code}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Upvote button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(bug.id);
                          }}
                          className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1 transition"
                          title="Men ham bu bugni qayta hosil qildim (+1)"
                        >
                          <ThumbsUpIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>{bug.upvotes_count}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-zinc-300 inline-flex items-baseline">
              IFound<sub className="text-emerald-400 text-[10px] font-mono font-bold px-0.5 relative -bottom-0.5 not-italic select-none">a</sub>Bug (IFB)
            </span>
            <span>—</span>
            <span>Dasturchilar va Bug Hunterlar uchun mukammal hamkorlik platformasi.</span>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={() => setShowShortcutsModal(true)} className="hover:text-zinc-300 underline">
              Tugmalar kombinatsiyasi (?)
            </button>
            <a
              href="https://github.com/mrdevs2011/bor1BUGS"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 flex items-center gap-1 transition"
            >
              <ExternalLinkIcon className="w-3 h-3" /> GitHub Repo
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedBug && (
        <BugDetailModal
          bug={selectedBug}
          comments={comments.filter((c) => c.bug_id === selectedBug.id)}
          privacyMode={privacyMode}
          onClose={() => setSelectedBug(null)}
          onStatusChange={(status) => handleStatusChange(selectedBug.id, status)}
          onToggleAcceptance={(cId) => handleToggleAcceptance(selectedBug.id, cId)}
          onUpvote={() => handleUpvote(selectedBug.id)}
          onAddComment={(content, isInternal) => handleAddComment(selectedBug.id, content, isInternal)}
          onUpdateEvidence={(urls) => {
            setBugs((prev) =>
              prev.map((b) => (b.id === selectedBug.id ? { ...b, evidence_urls: urls } : b))
            );
            setSelectedBug((prev) => (prev ? { ...prev, evidence_urls: urls } : null));
          }}
        />
      )}

      {showReportModal && (
        <ReportBugModal
          project={currentProject}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleCreateBug}
        />
      )}

      {showShareModal && (
        <ShareInviteModal
          project={currentProject}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showAIPromptModal && (
        <AIPromptModal
          bugs={filteredBugs.filter((b) => selectedBugIdsForSprint.includes(b.id))}
          onClose={() => setShowAIPromptModal(false)}
        />
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              ⌨️ Klaviatura Tugmalari (Shortcuts)
            </h3>
            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Spotlight Command Palette</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">⌘K / Ctrl+K</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Virtual 3D Radar Studio</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">V</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Qidiruvga o‘tish</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">/</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Yangi bug qo‘shish</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">C</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Maxfiy PII rejimini yoqish/o‘chirish</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">P</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Keyingi bugga o‘tish</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">J</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Oldingi bugga o‘tish</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">K</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Tanlangan bugni ochish</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">Enter</kbd>
              </div>
              <div className="flex justify-between py-1">
                <span>Modalni yopish</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-white font-mono">Esc</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs py-2 rounded-xl transition"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}
      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        bugs={bugs}
        onSelectBug={(bug) => setSelectedBug(bug)}
        onOpenReportModal={() => setShowReportModal(true)}
        onOpenAIPromptModal={() => setShowAIPromptModal(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onSetViewMode={(mode) => setViewMode(mode)}
      />

      {/* Auth Modal (Login & Signup) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Onboarding Wizard (Profile & First Real Project) */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        user={user}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={(newProj, profileUpdates) => {
          handleCreateProject(newProj);
          if (user && profileUpdates) {
            setUser({
              ...user,
              ...profileUpdates,
            });
          }
        }}
      />

      {/* New Project Creator Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
