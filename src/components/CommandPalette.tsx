'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bug } from '@/types';
import { cyberSound } from '@/lib/cyber-sound';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  bugs: Bug[];
  onSelectBug: (bug: Bug) => void;
  onOpenReportModal: () => void;
  onOpenAIPromptModal: () => void;
  onOpenShareModal: () => void;
  onSetViewMode: (mode: 'list' | 'kanban' | 'virtual-radar') => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  bugs,
  onSelectBug,
  onOpenReportModal,
  onOpenAIPromptModal,
  onOpenShareModal,
  onSetViewMode,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      cyberSound.playBlip(700);
      const timer = setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Quick actions
  const actionItems = useMemo(
    () => [
      {
        id: 'action-create',
        title: 'Yangi Bug yaratish (Report Defect)',
        icon: '🐛',
        category: 'Harakatlar',
        action: () => {
          onClose();
          onOpenReportModal();
        },
      },
      {
        id: 'action-radar',
        title: 'Virtual 3D Radar Studioni ochish',
        icon: '📡',
        category: 'Harakatlar',
        action: () => {
          onClose();
          onSetViewMode('virtual-radar');
        },
      },
      {
        id: 'action-kanban',
        title: 'Kanban taxtasiga o‘tish',
        icon: '📋',
        category: 'Harakatlar',
        action: () => {
          onClose();
          onSetViewMode('kanban');
        },
      },
      {
        id: 'action-list',
        title: 'Ro‘yxat ko‘rinishiga o‘tish',
        icon: '📜',
        category: 'Harakatlar',
        action: () => {
          onClose();
          onSetViewMode('list');
        },
      },
      {
        id: 'action-ai',
        title: 'AI Fix Promptlarini ochish (Cursor/Claude)',
        icon: '✨',
        category: 'Harakatlar',
        action: () => {
          onClose();
          onOpenAIPromptModal();
        },
      },
      {
        id: 'action-share',
        title: 'Loyiha Taklif Havolasi & Telegram Bot',
        icon: '🔗',
        category: 'Harakatlar',
        action: () => {
          onClose();
          onOpenShareModal();
        },
      },
      {
        id: 'action-sound',
        title: `Cyber Audio Sound FX: ${cyberSound.isEnabled() ? 'O‘chirish' : 'Yoqish'}`,
        icon: '🔊',
        category: 'Harakatlar',
        action: () => {
          cyberSound.toggle();
          onClose();
        },
      },
    ],
    [onClose, onOpenReportModal, onOpenAIPromptModal, onOpenShareModal, onSetViewMode]
  );

  // Filtered bug items
  const bugItems = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return bugs
      .filter(
        (b) =>
          b.code.toLowerCase().includes(q) ||
          b.title.toLowerCase().includes(q) ||
          b.section.toLowerCase().includes(q) ||
          b.actual_behavior.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map((b) => ({
        id: `bug-${b.id}`,
        title: `${b.code}: ${b.title}`,
        icon: '🐞',
        category: 'Xatolar',
        action: () => {
          onClose();
          onSelectBug(b);
        },
      }));
  }, [bugs, query, onClose, onSelectBug]);

  // Combined selectable list
  const combinedItems = useMemo(() => {
    if (!query.trim()) return actionItems;
    const filteredActions = actionItems.filter((a) =>
      a.title.toLowerCase().includes(query.toLowerCase())
    );
    return [...bugItems, ...filteredActions];
  }, [query, actionItems, bugItems]);

  // Key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        cyberSound.playBlip(600);
        setSelectedIndex((prev) => (prev + 1) % (combinedItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        cyberSound.playBlip(600);
        setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % (combinedItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (combinedItems[selectedIndex]) {
          cyberSound.playClick();
          combinedItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, combinedItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl border border-emerald-500/40 bg-zinc-900/95 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800 bg-zinc-950/70">
          <span className="text-emerald-400 font-mono text-sm mr-2.5">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buyruq yoki xatoni qidiring (masalan: B01, Radar, AI, Telegram)..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {combinedItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              Hech qanday natija topilmadi
            </div>
          ) : (
            combinedItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  cyberSound.playClick();
                  item.action();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                  selectedIndex === idx
                    ? 'bg-emerald-500/20 text-white border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'text-zinc-300 hover:bg-zinc-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm">{item.icon}</span>
                  <span className="truncate font-medium">{item.title}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  {item.category}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/80 bg-zinc-950 text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Harakatlanish</span>
            <span>↵ Tanlash</span>
          </div>
          <span>IFound_a_Bugs Spotlight</span>
        </div>
      </div>
    </div>
  );
}
