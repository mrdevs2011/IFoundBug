'use client';

import React from 'react';
import { Bug, BugStatus } from '@/types';
import { ThumbsUpIcon, ImageIcon } from './icons';

interface KanbanBoardProps {
  bugs: Bug[];
  privacyMode: boolean;
  onSelectBug: (bug: Bug) => void;
  onStatusChange: (bugId: string, newStatus: BugStatus) => void;
}

const COLUMNS: { status: BugStatus; label: string; dot: string }[] = [
  { status: 'REPORTED', label: 'Reported', dot: 'bg-zinc-400' },
  { status: 'TRIAGED', label: 'Triaged', dot: 'bg-sky-400' },
  { status: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-amber-400' },
  { status: 'READY_FOR_QA', label: 'Ready for QA', dot: 'bg-purple-400' },
  { status: 'FIXED', label: 'Fixed', dot: 'bg-emerald-400' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  bugs,
  onSelectBug,
}) => {
  const severityColors = {
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
    HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
      {COLUMNS.map((col) => {
        const columnBugs = bugs.filter((b) => b.status === col.status);

        return (
          <div
            key={col.status}
            className="w-80 shrink-0 bg-zinc-950/60 border border-white/[0.06] rounded-2xl flex flex-col max-h-[76vh]"
          >
            {/* Column Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-bold text-zinc-200 tracking-wide">{col.label}</span>
                <span className="text-[10px] font-mono font-semibold bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800">
                  {columnBugs.length}
                </span>
              </div>
            </div>

            {/* Column Body / Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {columnBugs.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 text-xs italic">
                  Bu ustunda buglar yo‘q
                </div>
              ) : (
                columnBugs.map((bug) => {
                  const completedCriteria = bug.acceptance_criteria.filter((c) => c.checked).length;
                  const totalCriteria = bug.acceptance_criteria.length;

                  return (
                    <div
                      key={bug.id}
                      onClick={() => onSelectBug(bug)}
                      className="linear-card rounded-xl p-3.5 cursor-pointer transition group space-y-2.5 border border-white/[0.06] hover:border-zinc-700"
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800">
                          {bug.code}
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            severityColors[bug.severity]
                          }`}
                        >
                          {bug.severity}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-400 transition line-clamp-2 leading-snug">
                        {bug.title}
                      </h4>

                      {/* Screen / Section */}
                      <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <span>{bug.section}</span>
                        {bug.screen && <span className="text-zinc-600">/</span>}
                        {bug.screen && <span>{bug.screen}</span>}
                      </div>

                      {/* Acceptance Criteria progress */}
                      {totalCriteria > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                            <span>Mezonlar</span>
                            <span>{completedCriteria}/{totalCriteria}</span>
                          </div>
                          <div className="w-full bg-zinc-800/80 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full transition-all"
                              style={{ width: `${(completedCriteria / totalCriteria) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Bottom row icons & quick actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-zinc-400 font-mono text-[10px]">
                            <ThumbsUpIcon className="w-3 h-3 text-amber-400" />
                            {bug.upvotes_count}
                          </span>
                          {bug.evidence_urls.length > 0 && (
                            <span className="flex items-center gap-0.5 text-zinc-400 font-mono text-[10px]">
                              <ImageIcon className="w-3 h-3" />
                              {bug.evidence_urls.length}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-zinc-500 truncate max-w-[100px] font-mono">
                          {bug.reporter_name}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
