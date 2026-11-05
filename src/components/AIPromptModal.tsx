'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bug } from '@/types';
import { copyToClipboard } from '@/lib/clipboard';
import { SparklesIcon, CopyIcon, CheckIcon, XIcon, DownloadIcon } from './icons';

interface AIPromptModalProps {
  bugs: Bug[];
  onClose: () => void;
}

export const AIPromptModal: React.FC<AIPromptModalProps> = ({ bugs, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  const [selectedBugIds, setSelectedBugIds] = useState<string[]>(bugs.map((b) => b.id));

  const isMultiple = bugs.length > 1;

  const generatePrompt = (): string => {
    const selected = bugs.filter((b) => selectedBugIds.includes(b.id));

    if (selected.length === 0) return 'Select at least one issue.';

    if (selected.length === 1) {
      const b = selected[0];
      return `# TASK: [${b.code}] ${b.title}

You are the lead engineer for this repository. Fix the issue below and verify the result thoroughly.

## Issue details
- **Screen / section:** ${b.screen || b.section}
- **Severity:** ${b.severity} (Priority: ${b.priority})
- **Environment:** ${b.environment}
- **Reporter:** ${b.reporter_name}

## Actual behavior
${b.actual_behavior}

## Expected behavior
${b.expected_behavior}

## Steps to reproduce
${b.steps_to_reproduce.length > 0 ? b.steps_to_reproduce.map((s, idx) => `${idx + 1}. ${s}`).join('\n') : '1. Open the application and navigate to the relevant screen.'}

${b.dev_notes ? `## Developer notes\n${b.dev_notes}\n` : ''}

## Acceptance criteria
${b.acceptance_criteria.length > 0 ? b.acceptance_criteria.map((ac) => `- [${ac.checked ? 'x' : ' '}] ${ac.text}`).join('\n') : '- [ ] The issue is fully resolved\n- [ ] No regressions were introduced'}

${b.evidence_urls.length > 0 ? `## Evidence\n${b.evidence_urls.map((u) => `- ${u}`).join('\n')}\n` : ''}

## Requirements and constraints:
1. Do not break other screens or existing business logic.
2. Keep changes minimal and safe.
3. At the end, summarize the changed files and verification performed.
`;
    }

    // Multi-bug Master Sprint Prompt
    return `# SPRINT MASTER PROMPT — Resolve ${selected.length} issues

You are the engineer for this repository. Resolve the ${selected.length} issues below in order. Verify the application after each change and provide a concise report.

${selected
  .map(
    (b, idx) => `---

### ${idx + 1}. [${b.code}] ${b.title}
- **Section:** ${b.section} (${b.screen || 'General'})
- **Severity:** ${b.severity} (${b.priority})
- **Problem:** ${b.actual_behavior}
- **Expected result:** ${b.expected_behavior}
${b.dev_notes ? `- **Recommendation:** ${b.dev_notes}` : ''}
- **Acceptance criteria:**
${b.acceptance_criteria.map((ac) => `  - [ ] ${ac.text}`).join('\n')}
`
  )
  .join('\n')}

---

## General requirements:
1. Preserve the existing codebase conventions.
2. Run the build and tests after fixing each issue.
3. List the files changed for each issue.
`;
  };

  const promptText = generatePrompt();

  const handleCopy = async () => {
    const ok = await copyToClipboard(promptText);
    if (ok) {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    }
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
                A ready-to-use prompt for Claude Code, Cursor, Codex, or Antigravity
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
            <span className="text-zinc-400 font-medium whitespace-nowrap">Select issues:</span>
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
            {selectedBugIds.length} issues selected
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-zinc-700 transition"
            >
              <DownloadIcon className="w-3.5 h-3.5" /> .md Download
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-emerald-500/20 transition"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 text-black" /> Copied!
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4 text-black" /> Copy prompt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
