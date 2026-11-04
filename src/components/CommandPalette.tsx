'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bug, Project } from '@/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  bugs: Bug[];
  currentProject?: Project;
  onSelectBug: (bug: Bug) => void;
  onOpenReportModal?: () => void;
  onOpenAIPromptModal?: () => void;
  onOpenAIPrompt?: () => void;
  onOpenShareModal?: () => void;
  onSetViewMode?: (mode: 'list' | 'kanban') => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  bugs,
  onSelectBug,
  onOpenReportModal,
  onOpenAIPromptModal,
  onOpenAIPrompt,
  onOpenShareModal,
  onSetViewMode,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
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
          if (onOpenReportModal) onOpenReportModal();
        },
      },
      {
        id: 'action-kanban',
        title: 'Kanban taxtasiga o‘tish',
        icon: '📋',
        category: 'Harakatlar',
        action: () => {
          onClose();
          if (onSetViewMode) onSetViewMode('kanban');
        },
      },
      {
        id: 'action-list',
        title: 'Ro‘yxat ko‘rinishiga o‘tish',
        icon: '📜',
        category: 'Harakatlar',
        action: () => {
          onClose();
          if (onSetViewMode) onSetViewMode('list');
        },
      },
      {
        id: 'action-ai',
        title: 'AI Fix Promptlarini ochish (Cursor/Claude)',
        icon: '✨',
        category: 'Harakatlar',
        action: () => {
          onClose();
          if (onOpenAIPromptModal) onOpenAIPromptModal();
          if (onOpenAIPrompt) onOpenAIPrompt();
        },
      },
      {
        id: 'action-share',
        title: 'Loyiha Taklif Havolasi & Telegram Bot',
        icon: '🔗',
        category: 'Harakatlar',
        action: () => {
          onClose();
          if (onOpenShareModal) onOpenShareModal();
        },
      },
    ],
    [onClose, onOpenReportModal, onOpenAIPromptModal, onOpenAIPrompt, onOpenShareModal, onSetViewMode]
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
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, combinedItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % Math.max(1, combinedItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const active = combinedItems[selectedIndex];
        if (active) {
          active.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, combinedItems, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/70">
          <span className="text-zinc-500 mr-2.5 text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buyruqlar, amallar yoki buglarni qidiring..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-zinc-500 border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* List items */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-800/40">
          {combinedItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              Hech qanday buyruq yoki bug topilmadi
            </div>
          ) : (
            combinedItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs transition ${
                    isSelected ? 'bg-emerald-500/10 text-white' : 'text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm shrink-0">{item.icon}</span>
                    <span className="font-medium truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0 uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3 font-mono">
            <span>↑↓ tanlash</span>
            <span>↵ ochish</span>
          </div>
          <span className="font-mono text-[10px]">IFB Spotlight</span>
        </div>
      </div>
    </div>
  );
}
