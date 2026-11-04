'use client';

import React, { useState } from 'react';
import { Project } from '@/types';
import { ShareIcon, CopyIcon, CheckIcon, XIcon } from './icons';
import { copyToClipboard } from '@/lib/clipboard';

interface ShareInviteModalProps {
  project: Project;
  onClose: () => void;
}

export const ShareInviteModal: React.FC<ShareInviteModalProps> = ({ project, onClose }) => {
  const [activeTab, setActiveTab] = useState<'invite' | 'widget'>('invite');
  const [role, setRole] = useState<'developer' | 'qa_tester' | 'viewer'>('developer');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWidget, setCopiedWidget] = useState(false);
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ifoundbug.app';
  const inviteLink = `${baseUrl}/invite/${project.slug}-${role}-invite`;
  const publicShareLink = `${baseUrl}/p/${project.slug}`;

  const widgetSnippet = `<!-- IFoundBug Instant Reporter Widget -->
<script 
  src="${baseUrl}/widget.js" 
  data-ifb-project="${project.slug}"
  data-ifb-theme="dark" 
  defer>
</script>`;

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(inviteLink);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyWidget = async () => {
    const ok = await copyToClipboard(widgetSnippet);
    if (ok) {
      setCopiedWidget(true);
      setTimeout(() => setCopiedWidget(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShareIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Ulashish & Jamoani Taklif Qilish</h3>
              <p className="text-xs text-zinc-400">{project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/30 px-6 pt-2">
          <button
            onClick={() => setActiveTab('invite')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'invite'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Invite Havolasi
          </button>
          <button
            onClick={() => setActiveTab('widget')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'widget'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Saytga Widget Qo‘yish
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'invite' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Taklif qilinayotgan a&apos;zoning roli:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'developer' as const, label: 'Developer', desc: 'Buglarni ko‘rish va tuzatish' },
                    { id: 'qa_tester' as const, label: 'QA Tester', desc: 'Yangi bug qo‘shish & test' },
                    { id: 'viewer' as const, label: 'Viewer', desc: 'Faqat kuzatish' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        role === r.id
                          ? 'border-emerald-500/80 bg-emerald-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{r.label}</div>
                      <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Xavfsiz Taklif Linki (Tokenli):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
                  >
                    {copiedLink ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                    {copiedLink ? 'Nusxalandi' : 'Nusxalash'}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Ushbu havola orqali kirgan a&apos;zolar avtomatik ravishda <strong className="text-zinc-400">{role}</strong> huquqi bilan loyihaga qo‘shiladi.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Ochiq Public Ko‘rish Havolasi (Hamma uchun):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={publicShareLink}
                    className="flex-1 bg-zinc-950/60 border border-zinc-800/80 rounded-lg px-3 py-1.5 text-xs text-zinc-400 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={async () => {
                      await copyToClipboard(publicShareLink);
                      alert('Public havola nusxalandi!');
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-lg border border-zinc-700 transition cursor-pointer"
                  >
                    Nusxa
                  </button>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'widget' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-300">
                Ushbu kodni o‘z mijoz ilovangiz (masalan veb-sayt yoki admin panel) <code>&lt;body&gt;</code> tegi oxiriga joylashtiring. Foydalanuvchilar ekran skrinshotini bitta bosish orqali to‘g‘ridan-to‘g‘ri IFoundBug tizimiga yubora olishadi:
              </p>
              <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap select-all">
                {widgetSnippet}
              </pre>
              <button
                onClick={handleCopyWidget}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs py-2 rounded-lg border border-zinc-700 flex items-center justify-center gap-2 transition"
              >
                {copiedWidget ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                {copiedWidget ? 'Widget kodi nusxalandi!' : 'Widget kodini nusxalash'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
