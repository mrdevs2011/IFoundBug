'use client';

import React, { useState } from 'react';
import { Bug } from '@/types';
import { SparklesIcon, CopyIcon, CheckIcon, XIcon, DownloadIcon } from './icons';

interface AIPromptModalProps {
  bugs: Bug[];
  onClose: () => void;
}

export const AIPromptModal: React.FC<AIPromptModalProps> = ({ bugs, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [selectedBugIds, setSelectedBugIds] = useState<string[]>(bugs.map((b) => b.id));

  const isMultiple = bugs.length > 1;

  const generatePrompt = (): string => {
    const selected = bugs.filter((b) => selectedBugIds.includes(b.id));

    if (selected.length === 0) return 'Iltimos, kamida bitta bug tanlang.';

    if (selected.length === 1) {
      const b = selected[0];
      return `# VAZIFA: [${b.code}] ${b.title}

Sen ushbu loyihaning yetakchi dasturchisisan. Quyidagi xatolikni tuzatib, to‘liq tekshiruvdan o‘tkaz.

## Asosiy ma'lumotlar
- **Ekran / Bo‘lim:** ${b.screen || b.section}
- **Jiddiylik:** ${b.severity} (Prioritet: ${b.priority})
- **Muhit:** ${b.environment}
- **Xabar beruvchi:** ${b.reporter_name}

## Hozirgi xato (Actual Behavior)
${b.actual_behavior}

## Kutilgan natija (Expected Behavior)
${b.expected_behavior}

## Qayta hosil qilish qadamlari (Steps to Reproduce)
${b.steps_to_reproduce.length > 0 ? b.steps_to_reproduce.map((s, idx) => `${idx + 1}. ${s}`).join('\n') : '1. Ilovani oching va tegishli ekranga o‘ting.'}

${b.dev_notes ? `## Texnik tahlil va Ko‘rsatmalar (Dev Notes)\n${b.dev_notes}\n` : ''}

## Qabul mezonlari (Acceptance Criteria)
${b.acceptance_criteria.length > 0 ? b.acceptance_criteria.map((ac) => `- [${ac.checked ? 'x' : ' '}] ${ac.text}`).join('\n') : '- [ ] Xatolik to‘liq bartaraf etildi\n- [ ] Hech qanday regressiya yuzaga kelmadi'}

${b.evidence_urls.length > 0 ? `## Dalillar (Evidence Screenshots)\n${b.evidence_urls.map((u) => `- ${u}`).join('\n')}\n` : ''}

## Talablar va Cheklovlar:
1. Boshqa ekranlar va mavjud biznes mantiqini aslo buzmang.
2. O‘zgarishlarni minimal va xavfsiz bajaring.
3. Ish yakunlangach, o‘zgargan fayllar va qanday tekshirilganini qisqa hisobot qilib yozing.
`;
    }

    // Multi-bug Master Sprint Prompt
    return `# SPRINT MASTER PROMPT — ${selected.length} ta xatolikni bartaraf etish

Sen shu loyihaning dasturchisisan. Quyidagi ${selected.length} ta bugni ko‘rsatilgan ketma-ketlikda tuzat. Har bosqichdan keyin ilovani tekshir va qisqa hisobot yoz.

${selected
  .map(
    (b, idx) => `---

### ${idx + 1}. [${b.code}] ${b.title}
- **Bo‘lim:** ${b.section} (${b.screen || 'Umumiy'})
- **Jiddiylik:** ${b.severity} (${b.priority})
- **Muammo:** ${b.actual_behavior}
- **Kutilgan natija:** ${b.expected_behavior}
${b.dev_notes ? `- **Tavsiya:** ${b.dev_notes}` : ''}
- **Qabul mezonlari:**
${b.acceptance_criteria.map((ac) => `  - [ ] ${ac.text}`).join('\n')}
`
  )
  .join('\n')}

---

## Umumiy qoidalar:
1. Har doim kod bazasidagi mavjud konvensiyalarni saqlang.
2. Xatolikni bartaraf etgach, loyihani build/test qilib tekshiring.
3. Har bir bug bo‘yicha o‘zgartirilgan fayllar ro‘yxatini keltiring.
`;
  };

  const promptText = generatePrompt();

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([promptText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isMultiple ? `IFB_MASTER_PROMPT_${Date.now()}.md` : `IFB_PROMPT_${bugs[0]?.code || 'BUG'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleBugSelection = (id: string) => {
    setSelectedBugIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <SparklesIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                AI Coding Fix Prompt Synthesizer
              </h3>
              <p className="text-xs text-zinc-400">
                Claude Code, Cursor, Codex yoki Antigravity uchun 1-bosqichli tayyor prompt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-select filter pills if multiple */}
        {isMultiple && (
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/30 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-zinc-400 font-medium whitespace-nowrap">Buglarni tanlash:</span>
            {bugs.map((b) => {
              const isSelected = selectedBugIds.includes(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => toggleBugSelection(b.id)}
                  className={`px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-zinc-800/40 text-zinc-400 border-zinc-700/50 hover:border-zinc-500'
                  }`}
                >
                  {b.code}
                </button>
              );
            })}
          </div>
        )}

        {/* Prompt Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <pre className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 text-xs font-mono text-zinc-300 whitespace-pre-wrap select-all leading-relaxed max-h-[50vh] overflow-y-auto">
            {promptText}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/70">
          <span className="text-xs text-zinc-500">
            {selectedBugIds.length} ta bug kiritildi
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-zinc-700 transition"
            >
              <DownloadIcon className="w-3.5 h-3.5" /> .md Yuklab olish
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-emerald-500/20 transition"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 text-black" /> Nusxalandi!
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4 text-black" /> Promptni nusxalash
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
