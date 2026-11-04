'use client';

import React from 'react';
import Link from 'next/link';
import { Project, UserProfile, BugNotification } from '@/types';
import { BugIcon, PlusIcon, ShareIcon } from '@/components/icons';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface AppNavbarProps {
  currentProject?: Project;
  projects?: Project[];
  user?: UserProfile | null;
  notifications?: BugNotification[];
  onOpenReportModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenNewProjectModal?: () => void;
  onOpenSettings?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onMarkNotificationRead?: (id: string) => void;
  onClearNotifications?: () => void;
  onSelectBug?: (bugId: string) => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  currentProject,
  user,
  notifications = [],
  onOpenReportModal,
  onOpenShareModal,
  onOpenSettings,
  onOpenAuthModal,
  onLogout,
  onMarkNotificationRead = () => {},
  onClearNotifications = () => {},
  onSelectBug = () => {},
}) => {
  return (
    <header className="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 group-hover:border-emerald-500/50 transition">
              <BugIcon className="w-4 h-4 text-emerald-400 transition" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-black text-sm tracking-widest text-emerald-400">IFB</span>
              <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">IFoundBug</span>
            </div>
          </Link>

          {/* Project Switcher Breadcrumb */}
          {currentProject && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <span className="text-zinc-600 text-xs hidden sm:inline">/</span>
              <div className="relative flex items-center">
                <Link
                  href={`/p/${currentProject.slug}`}
                  className="text-xs font-semibold text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="max-w-[130px] sm:max-w-[180px] truncate">{currentProject.name}</span>
                </Link>
              </div>
            </div>
          )}

          {/* Realtime Supabase Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-[10px] text-zinc-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-amber-400'}`} />
            <span className="font-mono">{isSupabaseConfigured ? 'Supabase Live' : 'Lokal rejim'}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Share / Invite */}
          {onOpenShareModal && currentProject && (
            <button
              onClick={onOpenShareModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition cursor-pointer"
              title="Jamoani taklif qilish va Telegram webhook"
            >
              <ShareIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ulashish</span>
            </button>
          )}

          {user && onOpenSettings && (
            <button onClick={onOpenSettings} title="Settings" aria-label="Settings" className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.07] bg-zinc-900/80 text-zinc-400 transition hover:border-emerald-500/30 hover:bg-zinc-800 hover:text-emerald-300">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path strokeLinecap="round" strokeLinejoin="round" d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z"/></svg>
            </button>
          )}

          {/* Notifications */}
          <NotificationDropdown
            notifications={notifications}
            onMarkAsRead={onMarkNotificationRead}
            onClearAll={onClearNotifications}
            onSelectBug={onSelectBug}
          />

          {/* Primary: Report Bug */}
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-[0_0_15px_-2px_rgba(16,185,129,0.4)] hover:scale-[1.02] cursor-pointer"
              title="Yangi xatolik kiritish (Ctrl+C)"
            >
              <PlusIcon className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
              <span>Bug yozish</span>
            </button>
          )}

          {/* User Profile */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs shadow-inner cursor-default"
                title={`${user.full_name} (${user.email})`}
              >
                {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-200 leading-tight truncate max-w-[100px]">
                  {user.full_name?.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-zinc-500 hover:text-rose-400 text-xs p-1.5 rounded-lg hover:bg-zinc-900 transition cursor-pointer"
                  title="Chiqish"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
              >
                Kirish
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
