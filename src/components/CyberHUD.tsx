'use client';

import React, { useState, useEffect } from 'react';
import { Bug } from '@/types';
import { cyberSound } from '@/lib/cyber-sound';

interface CyberHUDProps {
  bugs: Bug[];
  viewMode: 'list' | 'kanban' | 'virtual-radar';
  onChangeViewMode: (mode: 'list' | 'kanban' | 'virtual-radar') => void;
  onOpenCommandPalette: () => void;
  onOpenReportModal: () => void;
}

export default function CyberHUD({
  bugs,
  viewMode,
  onChangeViewMode,
  onOpenCommandPalette,
  onOpenReportModal,
}: CyberHUDProps) {
  const [soundOn, setSoundOn] = useState(() => (typeof window !== 'undefined' ? cyberSound.isEnabled() : true));
  const [latency, setLatency] = useState(24);

  useEffect(() => {
    // Subtle realistic latency fluctuation simulation
    const interval = setInterval(() => {
      setLatency((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(16, Math.min(38, prev + delta));
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const counts = {
    critical: bugs.filter((b) => b.severity === 'CRITICAL').length,
    high: bugs.filter((b) => b.severity === 'HIGH').length,
    medium: bugs.filter((b) => b.severity === 'MEDIUM').length,
    low: bugs.filter((b) => b.severity === 'LOW').length,
    fixed: bugs.filter((b) => b.status === 'FIXED').length,
  };

  const handleSoundToggle = () => {
    const newState = cyberSound.toggle();
    setSoundOn(newState);
  };

  return (
    <div className="w-full bg-zinc-950/90 border-y border-zinc-800/80 px-4 py-2.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left Telemetry Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Connection Pulse */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-zinc-400">SUPABASE RT:</span>
            <span className="text-emerald-400 font-bold">{latency}ms</span>
          </div>

          {/* Severity Breakdown Bar */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-300 font-bold">
              CRIT: {counts.critical}
            </span>
            <span className="px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-300 font-bold">
              HIGH: {counts.high}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
              MED: {counts.medium}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
              LOW: {counts.low}
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
              FIXED: {counts.fixed}
            </span>
          </div>
        </div>

        {/* Center / Right: Interactive View Switcher & Audio Controls */}
        <div className="flex items-center gap-2">
          {/* 3-Way Mode Switcher */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => {
                cyberSound.playClick();
                onChangeViewMode('list');
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-white shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>📋</span>
              <span>Ro‘yxat</span>
            </button>

            <button
              onClick={() => {
                cyberSound.playClick();
                onChangeViewMode('kanban');
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-zinc-800 text-white shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>📊</span>
              <span>Kanban</span>
            </button>

            <button
              onClick={() => {
                cyberSound.playRadarPing();
                onChangeViewMode('virtual-radar');
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'virtual-radar'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>📡 Virtual 3D Radar</span>
            </button>
          </div>

          {/* Spotlight Palette Button */}
          <button
            onClick={() => {
              cyberSound.playClick();
              onOpenCommandPalette();
            }}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 text-xs font-mono transition"
            title="Command Spotlight (Ctrl+K)"
          >
            <span>⌘K</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={handleSoundToggle}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition flex items-center gap-1.5 ${
              soundOn
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title="Cybernetic Web Audio FX"
          >
            <span>{soundOn ? '🔊' : '🔇'}</span>
            <span className="hidden xl:inline">{soundOn ? 'SFX ON' : 'SFX MUTE'}</span>
          </button>

          {/* Quick Create Bug */}
          <button
            onClick={() => {
              cyberSound.playClick();
              onOpenReportModal();
            }}
            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <span>+</span>
            <span className="hidden sm:inline">Bug Qo‘shish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
