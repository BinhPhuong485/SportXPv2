import React from 'react';
import { CircleDot, MapPin, Globe } from 'lucide-react';
import { LeaderboardScope } from '../../data/leaderboardRepository';

interface LeaderboardScopeTabsProps {
  scope: LeaderboardScope;
  onSelectScope: (s: LeaderboardScope) => void;
  className?: string;
}

export const LeaderboardScopeTabs: React.FC<LeaderboardScopeTabsProps> = ({
  scope,
  onSelectScope,
  className = '',
}) => {
  return (
    <div
      className={`grid grid-cols-3 p-1 rounded-2xl bg-white dark:bg-app-surface border border-app-border/80 gap-1 shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => onSelectScope('court')}
        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          scope === 'court'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-app-muted hover:text-app-text hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <CircleDot size={15} />
        <span>Cụm sân</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectScope('district')}
        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          scope === 'district'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-app-muted hover:text-app-text hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <MapPin size={15} />
        <span>Quận / Huyện</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectScope('national')}
        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          scope === 'national'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-app-muted hover:text-app-text hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <Globe size={15} />
        <span>Toàn quốc</span>
      </button>
    </div>
  );
};
