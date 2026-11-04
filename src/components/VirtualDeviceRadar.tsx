'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Bug, Severity } from '@/types';
import { cyberSound } from '@/lib/cyber-sound';

interface VirtualDeviceRadarProps {
  bugs: Bug[];
  onSelectBug: (bug: Bug) => void;
}

type DeviceType = 'iphone' | 'ipad' | 'desktop';

// Screen templates with authentic screenshots from our evidence base
const DEVICE_SCREENS = [
  {
    id: 'auth',
    name: 'Kirish / SMS / Til',
    image: '/evidence/B01-01.jpg',
    tag: 'Kirish & Ro‘yxatdan o‘tish',
  },
  {
    id: 'booking',
    name: 'Bron qilish & Xizmatlar',
    image: '/evidence/B03-01.jpg',
    tag: 'Bron qilish',
  },
  {
    id: 'barber',
    name: 'Sartarosh Profili & Xarita',
    image: '/evidence/B04-01.jpg',
    tag: 'Sartarosh Sahifasi',
  },
  {
    id: 'queue',
    name: 'Jonli Navbat & Vaqt',
    image: '/evidence/B11-01.jpg',
    tag: 'Jonli Navbat',
  },
  {
    id: 'payment',
    name: 'To‘lov & Chek / Kassa',
    image: '/evidence/B05-01.jpg',
    tag: 'To‘lovlar',
  },
  {
    id: 'profile',
    name: 'Sozlamalar & Profil',
    image: '/evidence/B09-01.jpg',
    tag: 'Mening Profilim',
  },
];

export default function VirtualDeviceRadar({ bugs, onSelectBug }: VirtualDeviceRadarProps) {
  const [device, setDevice] = useState<DeviceType>('iphone');
  const [activeScreenId, setActiveScreenId] = useState<string>('auth');
  const [hoveredBug, setHoveredBug] = useState<Bug | null>(null);
  const [laserActive, setLaserActive] = useState<boolean>(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const currentScreen = useMemo(() => {
    return DEVICE_SCREENS.find((s) => s.id === activeScreenId) || DEVICE_SCREENS[0];
  }, [activeScreenId]);

  // Map each bug deterministically to a coordinate on the virtual device screen
  const screenBugs = useMemo(() => {
    return bugs
      .filter((b) => (filterSeverity === 'ALL' ? true : b.severity === filterSeverity))
      .map((b, index) => {
        // Deterministic pseudo-random position based on bug code hash
        let hash = 0;
        for (let i = 0; i < b.code.length; i++) {
          hash = (hash << 5) - hash + b.code.charCodeAt(i);
          hash |= 0;
        }
        const x = 18 + Math.abs(hash % 64); // 18% to 82%
        const y = 20 + Math.abs((hash * 7) % 65); // 20% to 85%

        return {
          bug: b,
          x,
          y,
          index,
        };
      });
  }, [bugs, filterSeverity]);

  const getSeverityColor = (sev: Severity) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-500',
          border: 'border-red-400',
          glow: 'rgba(239, 68, 68, 0.7)',
          ring: 'border-red-500/60',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500',
          border: 'border-orange-400',
          glow: 'rgba(249, 115, 22, 0.7)',
          ring: 'border-orange-500/60',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500',
          border: 'border-amber-400',
          glow: 'rgba(245, 158, 11, 0.7)',
          ring: 'border-amber-500/60',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-500',
          border: 'border-emerald-400',
          glow: 'rgba(16, 185, 129, 0.7)',
          ring: 'border-emerald-500/60',
        };
    }
  };

  return (
    <div className="relative w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 radar-grid-bg opacity-40 pointer-events-none" />

      {/* Control Header */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Virtual Device & Defect Radar Studio
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              LIVE 3D
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Ilovani virtual qurilmada ko‘ring, ekran koordinatalari bo‘yicha radar orqali xatolarni aniqlang va bevosita bosing.
          </p>
        </div>

        {/* Studio Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Laser Scan Toggle */}
          <button
            onClick={() => {
              cyberSound.playLaserScan();
              setLaserActive(!laserActive);
            }}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition ${
              laserActive
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${laserActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            {laserActive ? 'Lazer Skaner: Yoqilgan' : 'Lazer Skaner: O‘chiq'}
          </button>

          {/* Device Model Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => {
                cyberSound.playClick();
                setDevice('iphone');
              }}
              className={`px-2.5 py-1 rounded font-medium transition ${
                device === 'iphone' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              📱 iPhone 16
            </button>
            <button
              onClick={() => {
                cyberSound.playClick();
                setDevice('ipad');
              }}
              className={`px-2.5 py-1 rounded font-medium transition ${
                device === 'ipad' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              📲 iPad Air
            </button>
            <button
              onClick={() => {
                cyberSound.playClick();
                setDevice('desktop');
              }}
              className={`px-2.5 py-1 rounded font-medium transition ${
                device === 'desktop' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              💻 Web / Desk
            </button>
          </div>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => {
              cyberSound.playBlip(750);
              setFilterSeverity(e.target.value);
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="ALL">Barcha darajalar ({bugs.length})</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Screen Selector Pills */}
      <div className="relative z-10 flex items-center gap-2 py-3 overflow-x-auto scrollbar-none border-b border-zinc-800/40">
        <span className="text-[11px] font-mono uppercase text-zinc-500 whitespace-nowrap px-1">
          Simulyatsiya qilinayotgan ekran:
        </span>
        {DEVICE_SCREENS.map((scr) => (
          <button
            key={scr.id}
            onClick={() => {
              cyberSound.playClick();
              setActiveScreenId(scr.id);
            }}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition border ${
              activeScreenId === scr.id
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            {scr.name}
          </button>
        ))}
      </div>

      {/* Main Studio Arena */}
      <div className="relative z-10 mt-6 flex flex-col xl:flex-row items-center justify-center gap-8 py-4">
        {/* Device Frame Wrapper */}
        <div className="relative flex items-center justify-center perspective-1000">
          {/* Virtual Chassis */}
          <div
            className={`relative transition-all duration-500 rounded-[44px] p-3.5 bg-gradient-to-b from-zinc-700 via-zinc-850 to-zinc-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(16,185,129,0.15)] border-4 border-zinc-700/60 ${
              device === 'iphone'
                ? 'w-[320px] sm:w-[350px] h-[640px] sm:h-[680px]'
                : device === 'ipad'
                ? 'w-[480px] sm:w-[560px] h-[640px]'
                : 'w-[640px] sm:w-[720px] h-[480px] rounded-[24px]'
            }`}
          >
            {/* Dynamic Island / Speaker Notch for phone */}
            {device === 'iphone' && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-between px-3 border border-zinc-800">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700" />
                <span className="w-2 h-2 rounded-full bg-blue-950 border border-blue-600/40" />
              </div>
            )}

            {/* Simulated Screen Inner Glass */}
            <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-zinc-950 border border-zinc-800/80 select-none">
              {/* Screen Base Visual */}
              <div className="relative w-full h-full">
                <Image
                  src={currentScreen.image}
                  alt={currentScreen.name}
                  fill
                  className="object-cover opacity-85 hover:opacity-95 transition"
                  priority
                />

                {/* Dark Vignette Overlay for Radar High-Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/50" />
              </div>

              {/* Animated Laser Scan Beam */}
              {laserActive && (
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981,0_0_30px_#10b981] scan-laser-line z-30 pointer-events-none" />
              )}

              {/* Sonar Radar Wave Sweep Background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-emerald-500/20 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-emerald-500/25 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-emerald-500/30 rounded-full" />
              </div>

              {/* Radar Pins Placed on Coordinates */}
              {screenBugs.map(({ bug, x, y, index }) => {
                const colors = getSeverityColor(bug.severity);
                const isHovered = hoveredBug?.id === bug.id;

                return (
                  <div
                    key={bug.id}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-150 ${
                      isHovered ? 'z-40 scale-125' : 'z-35'
                    }`}
                    onClick={() => {
                      cyberSound.playClick();
                      onSelectBug(bug);
                    }}
                    onMouseEnter={() => {
                      cyberSound.playBlip(900 + (index % 5) * 80);
                      setHoveredBug(bug);
                    }}
                    onMouseLeave={() => setHoveredBug(null)}
                  >
                    {/* Pulsing Sonar Ring */}
                    <div
                      className={`absolute -inset-2.5 rounded-full border ${colors.ring} sonar-ring pointer-events-none`}
                    />

                    {/* Pin Center Glow */}
                    <div
                      className={`relative w-6 h-6 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center text-[10px] font-mono font-black text-black shadow-[0_0_16px_${colors.glow}] transition-transform duration-200 group-hover:scale-125`}
                    >
                      {bug.code.slice(1)}
                    </div>
                  </div>
                );
              })}

              {/* Floating Interactive HUD Popover (When pin hovered) */}
              {hoveredBug && (
                <div className="absolute bottom-4 left-4 right-4 z-40 bg-zinc-900/95 border border-emerald-500/60 rounded-xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.2)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {hoveredBug.code}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {hoveredBug.severity}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate">
                          {hoveredBug.screen || hoveredBug.section}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white line-clamp-1">
                        {hoveredBug.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => onSelectBug(hoveredBug)}
                      className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] whitespace-nowrap transition"
                    >
                      Batafsil →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Radar Telemetry Side Panel */}
        <div className="w-full xl:w-96 flex flex-col gap-4">
          {/* Radar Status Monitor Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Telemetriya & Koordinator
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Radar Pinlar: <strong className="text-white">{screenBugs.length} ta</strong>
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Ekran:</span>
                <span className="font-semibold text-zinc-200">{currentScreen.name}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Qurilma o‘lchami:</span>
                <span className="font-mono text-zinc-200">
                  {device === 'iphone' ? '390 × 844 px (Retina)' : device === 'ipad' ? '820 × 1180 px' : '1920 × 1080 px'}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Xatolar zichligi (Heatmap):</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {(screenBugs.length / 1.5).toFixed(1)} / ekranga
                </span>
              </div>
            </div>
          </div>

          {/* Quick Clickable Pin List */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 backdrop-blur-md max-h-[360px] overflow-y-auto">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 font-mono">
              Ekrandagi Xatolar Ro‘yxati
            </h3>
            <div className="space-y-1.5">
              {screenBugs.map(({ bug }) => (
                <div
                  key={bug.id}
                  onClick={() => {
                    cyberSound.playClick();
                    onSelectBug(bug);
                  }}
                  onMouseEnter={() => {
                    cyberSound.playBlip(800);
                    setHoveredBug(bug);
                  }}
                  onMouseLeave={() => setHoveredBug(null)}
                  className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 text-xs ${
                    hoveredBug?.id === bug.id
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-emerald-400 text-[11px]">
                      {bug.code}
                    </span>
                    <span className="truncate">{bug.title}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      bug.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-300'
                        : bug.severity === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-300'
                        : bug.severity === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {bug.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
