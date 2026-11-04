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
  onOpenAuthModal,
  onLogout,
  onMarkNotificationRead = () => {},
  onClearNotifications = () => {},
  onSelectBug = () => {},
}) => {

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-3">
        {/* Left: Brand & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 transition">
              <BugIcon className="w-4 h-4 text-emerald-400 group-hover:scale-105 transition" />
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
                  className="text-xs font-semibold text-zinc-300 hover:text-white px-2 py-1 rounded-md hover:bg-zinc-900 transition flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="max-w-[130px] sm:max-w-[180px] truncate">{currentProject.name}</span>
                </Link>
              </div>
            </div>
          )}

          {/* Realtime Supabase Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isSupabaseConfigured ? 'Supabase Realtime' : 'Lokal rejim'}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Share / Invite */}
          {onOpenShareModal && currentProject && (
            <button
              onClick={onOpenShareModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition"
              title="Jamoani taklif qilish va Telegram webhook"
            >
              <ShareIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ulashish</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition shadow-sm"
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
                className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs"
                title={user.email}
              >
                {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'U'}
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-zinc-500 hover:text-rose-400 text-xs p-1 transition"
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
                className="text-xs font-semibold text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition"
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
