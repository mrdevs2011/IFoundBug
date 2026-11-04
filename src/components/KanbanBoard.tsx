'use client';

import React from 'react';
import { Bug, BugStatus } from '@/types';
import { ThumbsUpIcon, CheckIcon, ImageIcon, SmartphoneIcon } from './icons';

interface KanbanBoardProps {
  bugs: Bug[];
  privacyMode: boolean;
  onSelectBug: (bug: Bug) => void;
  onStatusChange: (bugId: string, newStatus: BugStatus) => void;
}

const COLUMNS: { status: BugStatus; label: string; color: string }[] = [
  { status: 'REPORTED', label: 'Reported (Ochiq)', color: 'border-zinc-700 bg-zinc-800/30' },
  { status: 'TRIAGED', label: 'Triaged (Ko‘rildi)', color: 'border-sky-500/30 bg-sky-500/5' },
  { status: 'IN_PROGRESS', label: 'In Progress (Jarayonda)', color: 'border-amber-500/30 bg-amber-500/5' },
  { status: 'READY_FOR_QA', label: 'Ready for QA (Testda)', color: 'border-purple-500/30 bg-purple-500/5' },
  { status: 'FIXED', label: 'Fixed (Tuzatildi ✓)', color: 'border-emerald-500/30 bg-emerald-500/5' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  bugs,
  privacyMode,
  onSelectBug,
  onStatusChange,
}) => {
  const severityColors = {
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/20',
    HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
      {COLUMNS.map((col) => {
        const columnBugs = bugs.filter((b) => b.status === col.status);

        return (
          <div
            key={col.status}
            className="w-80 shrink-0 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex flex-col max-h-[75vh]"
          >
            {/* Column Header */}
            <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200">{col.label}</span>
                <span className="text-[11px] font-semibold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                  {columnBugs.length}
                </span>
              </div>
            </div>

            {/* Column Body / Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {columnBugs.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-xs italic">
                  Bu holatda buglar yo‘q
                </div>
              ) : (
                columnBugs.map((bug) => {
                  const completedCriteria = bug.acceptance_criteria.filter((c) => c.checked).length;
                  const totalCriteria = bug.acceptance_criteria.length;

                  return (
                    <div
                      key={bug.id}
                      onClick={() => onSelectBug(bug)}
                      className="bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 rounded-xl p-3.5 cursor-pointer transition shadow-md hover:shadow-xl group space-y-2.5"
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                          {bug.code}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            severityColors[bug.severity]
                          }`}
                        >
                          {bug.severity} ({bug.priority})
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-400 transition line-clamp-2 leading-relaxed">
                        {bug.title}
                      </h4>

                      {/* Screen / Section */}
                      <div className="text-[11px] text-zinc-400 truncate">
                        📍 {bug.section} • {bug.screen || 'Main'}
                      </div>

                      {/* Acceptance Criteria progress */}
                      {totalCriteria > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500">
                            <span>Mezonlar:</span>
                            <span>{completedCriteria}/{totalCriteria}</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full transition-all"
                              style={{ width: `${(completedCriteria / totalCriteria) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Bottom row icons & quick actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-zinc-400">
                            <ThumbsUpIcon className="w-3 h-3 text-amber-400" />
                            {bug.upvotes_count}
                          </span>
                          {bug.evidence_urls.length > 0 && (
                            <span className="flex items-center gap-0.5 text-zinc-400">
                              <ImageIcon className="w-3 h-3" />
                              {bug.evidence_urls.length}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">
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
