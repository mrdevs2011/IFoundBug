'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Bug, Project, BugComment, BugStatus, UserProfile } from '@/types';
import { DataService } from '@/lib/supabase/data-service';
import { AppNavbar } from '@/components/AppNavbar';
import { AIPromptModal } from '@/components/AIPromptModal';
import { ImageAnnotator } from '@/components/ImageAnnotator';
import OnboardingView from '@/components/OnboardingView';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  SparklesIcon,
  ThumbsUpIcon,
  CheckIcon,
  SmartphoneIcon,
  EyeIcon,
  EyeOffIcon,
  MessageSquareIcon,
  SendIcon,
  CopyIcon,
  TelegramIcon,
} from '@/components/icons';

function getSavedUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ifb_active_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function BugDetailPage() {
  const params = useParams();
  const projectSlug = params.projectSlug as string;
  const bugId = params.bugId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [bug, setBug] = useState<Bug | null>(null);
  const [comments, setComments] = useState<BugComment[]>([]);
  const [loading, setLoading] = useState(true);

  // States
  const [activeTab, setActiveTab] = useState<'details' | 'discussion'>('details');
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [annotatingImageUrl, setAnnotatingImageUrl] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(getSavedUser);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Load Bug & Project & Session
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

    async function loadBugData() {
      setLoading(true);
      try {
        const result = await DataService.fetchBugByIdOrCode(projectSlug, bugId);
        if (result) {
          setProject(result.project);
          setBug(result.bug);
          setPrivacyMode(Boolean(result.bug.is_sensitive));

          // Fetch comments
          const comms = await DataService.fetchComments(result.bug.id);
          setComments(comms);
        }
      } catch (err) {
        console.error('Error loading bug detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBugData();
  }, [projectSlug, bugId]);

  // 2. Realtime Comments Channel
  useEffect(() => {
    if (!bug) return;

    const channel = DataService.subscribeToBugComments(bug.id, (newComment) => {
      setComments((prev) => [newComment, ...prev.filter((c) => c.id !== newComment.id)]);
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [bug]);

  // 3. Clipboard Paste Listener (Ctrl+V) for screenshots
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob && bug) {
            e.preventDefault();
            setIsUploading(true);
            try {
              const formData = new FormData();
              formData.append('file', blob);
              const res = await fetch('/api/upload', { method: 'POST', body: formData });
              const data = await res.json();
              if (data.url) {
                const newUrls = [...(bug.evidence_urls || []), data.url];
                setBug((prev) => (prev ? { ...prev, evidence_urls: newUrls } : null));
              }
            } catch (err) {
              console.error('Clipboard upload error:', err);
            } finally {
              setIsUploading(false);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [bug]);

  // Status Colors
  const statusColors: Record<BugStatus, { bg: string; text: string; border: string }> = {
    REPORTED: { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' },
    TRIAGED: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
    IN_PROGRESS: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    READY_FOR_QA: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    VERIFIED: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
    FIXED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    CLOSED: { bg: 'bg-zinc-900', text: 'text-zinc-500', border: 'border-zinc-800' },
    WONT_FIX: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  const severityColors = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  };

  // Handlers
  const handleStatusChange = async (newStatus: BugStatus) => {
    if (!bug) return;
    setBug((prev) => (prev ? { ...prev, status: newStatus } : null));
    await DataService.updateBugStatus(bug.id, newStatus);
  };

  const handleToggleAcceptance = async (criterionId: string) => {
    if (!bug) return;
    const updated = bug.acceptance_criteria.map((c) =>
      c.id === criterionId ? { ...c, checked: !c.checked } : c
    );
    setBug((prev) => (prev ? { ...prev, acceptance_criteria: updated } : null));
    await DataService.updateBugCriteria(bug.id, updated);
  };

  const handleUpvote = async () => {
    if (!bug) return;
    setBug((prev) =>
      prev
        ? {
            ...prev,
            upvotes_count: prev.upvotes_count + 1,
            reproduced_count: prev.reproduced_count + 1,
          }
        : null
    );
    await DataService.toggleUpvote(bug.id, 'dev-user');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !bug) return;

    const newComment: BugComment = {
      id: `comm-${Date.now()}`,
      bug_id: bug.id,
      author_name: 'Dasturchi',
      author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      content: commentText.trim(),
      is_internal: isInternalComment,
      reactions: {},
      created_at: new Date().toISOString(),
    };

    setComments((prev) => [newComment, ...prev]);
    setCommentText('');
    await DataService.createComment(newComment);
  };

  const handleShareTelegram = () => {
    if (!bug || !project) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `*[${bug.code}] ${bug.title}*\n*Loyiha:* ${project.name}\n*Daraja:* ${bug.severity} | *Holat:* ${bug.status}\n*Bo'lim:* ${bug.section} (${bug.screen || 'Asosiy'})\n*Ko'rish:*`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs text-zinc-500 font-mono">Xatolik yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!bug || !project) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <h2 className="text-lg font-bold text-white">Xatolik topilmadi</h2>
            <p className="text-xs text-zinc-400">&quot;{bugId}&quot; kodi yoki ID si bo‘yicha xatolik mavjud emas.</p>
            <Link
              href={`/p/${projectSlug}`}
              className="inline-block text-xs font-bold px-4 py-2 bg-emerald-500 text-black rounded-lg"
            >
              Loyihaga qaytish
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
      <AppNavbar currentProject={project} user={user} onLogout={handleLogout} />

      {/* Breadcrumb Navigation */}
      <div className="border-b border-white/[0.06] bg-zinc-950/70 sticky top-16 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Link href="/" className="text-zinc-500 hover:text-zinc-300">
              Loyihalar
            </Link>
            <span className="text-zinc-600">/</span>
            <Link href={`/p/${project.slug}`} className="text-zinc-400 hover:text-white font-semibold">
              {project.name}
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
              {bug.code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Telegram Share */}
            <button
              onClick={handleShareTelegram}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition cursor-pointer"
              title="Telegram guruhga yuborish"
            >
              <TelegramIcon className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition cursor-pointer"
              title="Havolani nusxalash"
            >
              {copiedLink ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Nusxalandi!' : 'Havola'}</span>
            </button>

            {/* AI Fix Prompt */}
            <button
              onClick={() => setShowAIPrompt(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              title="Claude Code / Cursor uchun prompt"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Fix</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Bug Header Card */}
        <div className="linear-card rounded-2xl p-6 space-y-4 border border-white/[0.08] shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-sm bg-zinc-800 text-white px-2.5 py-1 rounded border border-zinc-700">
                {bug.code}
              </span>

              {/* Status Selector Dropdown */}
              <select
                value={bug.status}
                onChange={(e) => handleStatusChange(e.target.value as BugStatus)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition ${
                  statusColors[bug.status].bg
                } ${statusColors[bug.status].text} ${statusColors[bug.status].border}`}
              >
                <option value="REPORTED">REPORTED (Ochiq)</option>
                <option value="TRIAGED">TRIAGED (Ko‘rildi)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Jarayonda)</option>
                <option value="READY_FOR_QA">READY_FOR_QA (QA Testda)</option>
                <option value="VERIFIED">VERIFIED (Tasdiqlandi)</option>
                <option value="FIXED">FIXED (Tuzatildi)</option>
                <option value="CLOSED">CLOSED (Yopildi)</option>
                <option value="WONT_FIX">WONT_FIX (Bekor)</option>
              </select>

              {/* Severity */}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${severityColors[bug.severity]}`}>
                {bug.severity} ({bug.priority})
              </span>

              {/* Section & Screen */}
              <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60 font-medium">
                {bug.section} • {bug.screen || 'Asosiy'}
              </span>

              <span className="text-xs font-mono text-zinc-500">[{bug.environment}]</span>
            </div>

            {/* Upvote & Reproduce Button */}
            <button
              onClick={handleUpvote}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition shadow-sm"
              title="Men ham bu xatoni qayta hosil qildim (+1)"
            >
              <ThumbsUpIcon className="w-4 h-4 text-amber-400" />
              <span>Qayta hosil qildim ({bug.upvotes_count})</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug tracking-tight">
            {bug.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-zinc-500 pt-1 border-t border-zinc-800/60">
            <span>
              Muallif: <strong className="text-zinc-300">{bug.reporter_name || 'Dasturchi'}</strong>
            </span>
            <span>•</span>
            <span>{new Date(bug.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Telemetry Bar */}
        {bug.device_telemetry && (
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-zinc-400 shadow-inner">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold">
              <SmartphoneIcon className="w-4 h-4 text-emerald-400" />
              <span>Qurilma & Telemetriya:</span>
            </div>
            <span>
              OS: <strong className="text-white font-mono">{bug.device_telemetry.os}</strong>
            </span>
            <span>
              Brauzer: <strong className="text-white font-mono">{bug.device_telemetry.browser}</strong>
            </span>
            <span>
              Ekran: <strong className="text-white font-mono">{bug.device_telemetry.resolution}</strong>
            </span>
            <span>
              Viewport: <strong className="text-white font-mono">{bug.device_telemetry.viewport}</strong>
            </span>
          </div>
        )}

        {/* Navigation Tabs: Details vs Discussion */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 rounded-t-xl px-4 pt-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Bug Anatomiyasi & Dalillar
          </button>

          <button
            onClick={() => setActiveTab('discussion')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'discussion'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquareIcon className="w-3.5 h-3.5" />
            <span>Jonli Muhokama & Chat ({comments.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === 'details' ? (
          <div className="space-y-6">
            {/* Behavior Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 space-y-2">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Kuzatilgan Noto‘g‘ri Holat (Actual Behavior)
                </span>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {bug.actual_behavior}
                </p>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Kutilayotgan To‘g‘ri Holat (Expected Behavior)
                </span>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {bug.expected_behavior}
                </p>
              </div>
            </div>

            {/* Reproduction Steps */}
            {bug.steps_to_reproduce && bug.steps_to_reproduce.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-zinc-200">Qadam-baqadam takrorlash (Steps to Reproduce)</h3>
                <div className="space-y-2 font-mono text-xs">
                  {bug.steps_to_reproduce.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                      <span className="text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-zinc-300 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acceptance Criteria Checklists */}
            {bug.acceptance_criteria && bug.acceptance_criteria.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200">
                    Qabul Qilish Mezonlari (Acceptance Criteria)
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {bug.acceptance_criteria.filter((c) => c.checked).length} / {bug.acceptance_criteria.length} bajarildi
                  </span>
                </div>

                <div className="space-y-2">
                  {bug.acceptance_criteria.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition select-none"
                    >
                      <input
                        type="checkbox"
                        checked={c.checked}
                        onChange={() => handleToggleAcceptance(c.id)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                      />
                      <span className={`text-xs font-medium leading-relaxed ${c.checked ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                        {c.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Dev Notes & Code Hints */}
            {bug.dev_notes && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
                <h3 className="text-xs font-bold text-zinc-200">Dasturchi Eslatmalari & Ildiz Sababi (Root Cause)</h3>
                <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {bug.dev_notes}
                </div>
              </div>
            )}

            {/* Evidence & Screenshots Gallery */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-zinc-200">Skrinshotlar & Dalillar (Evidence Gallery)</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">(Skrinshotni Ctrl+V qilib tashlang)</span>
                </div>

                <button
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${
                    privacyMode
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                  title="Maxfiy rejim: PII ma'lumotlarni xiralashtirish"
                >
                  {privacyMode ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                  <span>{privacyMode ? 'Blur Yoqilgan' : 'Ochiq'}</span>
                </button>
              </div>

              {isUploading && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 text-center font-mono">
                  Rasm yuklanmoqda...
                </div>
              )}

              {bug.evidence_urls && bug.evidence_urls.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {bug.evidence_urls.map((url, i) => (
                    <div
                      key={i}
                      className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/80 aspect-video flex items-center justify-center cursor-pointer shadow"
                    >
                      <img
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        onClick={() => setZoomedImage(url)}
                        className={`w-full h-full object-cover transition duration-200 group-hover:scale-105 ${
                          privacyMode ? 'filter blur-md' : ''
                        }`}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
                        <button
                          onClick={() => setZoomedImage(url)}
                          className="px-2.5 py-1 text-xs font-bold bg-white text-black rounded-lg shadow"
                        >
                          Kattalashtirish
                        </button>
                        <button
                          onClick={() => setAnnotatingImageUrl(url)}
                          className="px-2.5 py-1 text-xs font-bold bg-emerald-500 text-black rounded-lg shadow"
                        >
                          Chizish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                  Hozircha hech qanday rasm ilova qilinmagan. Klaviaturadan <strong>Ctrl+V</strong> orqali skrinshot tashlashingiz mumkin.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Realtime Comments Discussion Tab */
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
              <MessageSquareIcon className="w-4 h-4 text-emerald-400" />
              <span>Jonli Muhokama & Jamoa Izohlari</span>
            </h3>

            {/* Comment Submission Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                rows={3}
                placeholder="Fikr, taklif yoki kod yozing... (Markdown va kod bloklari qo‘llab-quvvatlanadi)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-amber-500"
                  />
                  <span>Maxfiy ichki izoh (faqat jamoa ko‘radi)</span>
                </label>

                <button
                  type="submit"
                  className="bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
                >
                  <SendIcon className="w-3.5 h-3.5" />
                  <span>Yuborish</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Hozircha birorta ham izoh yo‘q. Birinchi bo‘lib fikr bildiring!
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border text-left space-y-1.5 ${
                      c.is_internal
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-zinc-950/70 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{c.author_name}</span>
                        {c.is_internal && (
                          <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                            Faqat Jamoa uchun
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* AI Prompt Synthesizer Modal */}
      {showAIPrompt && <AIPromptModal bugs={[bug]} onClose={() => setShowAIPrompt(false)} />}

      {/* Image Annotator */}
      {annotatingImageUrl && (
        <ImageAnnotator
          imageUrl={annotatingImageUrl}
          onSave={(annotatedUrl) => {
            if (bug.evidence_urls) {
              const updated = bug.evidence_urls.map((u) => (u === annotatingImageUrl ? annotatedUrl : u));
              setBug((prev) => (prev ? { ...prev, evidence_urls: updated } : null));
            }
            setAnnotatingImageUrl(null);
          }}
          onClose={() => setAnnotatingImageUrl(null)}
        />
      )}

      {/* Lightbox Zoom */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={zoomedImage} alt="Zoomed" className="max-h-[95vh] max-w-[95vw] object-contain rounded" />
        </div>
      )}
    </div>
  );
}
