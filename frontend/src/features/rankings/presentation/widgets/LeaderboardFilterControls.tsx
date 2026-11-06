import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { LeaderboardViewMode } from '../../types';

interface LeaderboardFilterControlsProps {
  onlyQualified: boolean;
  onToggleQualified: () => void;
  viewMode: LeaderboardViewMode;
  onSelectViewMode: (m: LeaderboardViewMode) => void;
  totalCount: number;
  className?: string;
}

export const LeaderboardFilterControls: React.FC<LeaderboardFilterControlsProps> = ({
  onlyQualified,
  onToggleQualified,
  viewMode,
  onSelectViewMode,
  totalCount,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2.5 ${className}`}>
      {/* Official Qualification Filter Toggle */}
      <button
        type="button"
        onClick={onToggleQualified}
        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer select-none ${
          onlyQualified
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-xs'
            : 'bg-white dark:bg-app-surface text-app-muted border-app-border/80 hover:text-app-text hover:border-app-border'
        }`}
      >
        <ShieldCheck
          size={15}
          className={onlyQualified ? 'text-emerald-600 dark:text-emerald-400' : 'text-app-muted'}
        />
        <span>Chỉ hiện VĐV chính thức (≥ 5 trận)</span>
      </button>

      {/* All vs Near Me Segmented Switch */}
      <div className="p-1 bg-white dark:bg-app-surface rounded-[14px] border border-app-border/80 flex gap-1 shadow-2xs">
        <button
          type="button"
          onClick={() => onSelectViewMode('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-app-muted hover:text-app-text hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          Tất cả ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => onSelectViewMode('nearMe')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'nearMe'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-app-muted hover:text-app-text hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          Quanh bạn (±5)
        </button>
      </div>
    </div>
  );
};
