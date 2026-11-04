'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BugNotification } from '@/types';

interface NotificationDropdownProps {
  notifications: BugNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSelectBug: (bugId: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onSelectBug,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition"
        title="Bildirishnomalar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-zinc-950 ring-2 ring-zinc-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Bildirishnomalar</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {unreadCount} ta yangi
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                Tozalash
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Hozircha hech qanday yangi bildirishnoma yo‘q
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    onMarkAsRead(n.id);
                    onSelectBug(n.bug_id);
                    setIsOpen(false);
                  }}
                  className={`p-3.5 text-left cursor-pointer transition hover:bg-zinc-800/60 flex items-start gap-3 ${
                    !n.read ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <div
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      !n.read ? 'bg-emerald-400 ring-2 ring-emerald-500/30' : 'bg-transparent'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        <span className="font-mono text-emerald-400 mr-1.5">{n.bug_code}</span>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
