import React from 'react';
import { ChevronUp } from 'lucide-react';
import { PlayerProfile } from '../../../../core/types/database.types';
import { PlayerCourtRank } from '../../data/leaderboardRepository';

interface MyFixedStandingBarProps {
  userProfile: PlayerProfile;
  rankSummary: PlayerCourtRank;
  onScrollToMyRank: () => void;
}

export const MyFixedStandingBar: React.FC<MyFixedStandingBarProps> = ({
  userProfile,
  rankSummary,
  onScrollToMyRank,
}) => {
  return (
    <div
      onClick={onScrollToMyRank}
      role="button"
      tabIndex={0}
      className="w-full bg-app-surface/90 backdrop-blur-md border-t border-app-border cursor-pointer hover:bg-app-surface transition-all shadow-xl active:scale-[0.99] select-none"
    >
      <div className="max-w-[720px] mx-auto px-5 py-3 flex items-center justify-between gap-3">
        {/* Left: Rank Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-app-primary/15 border border-app-primary/30 flex items-center justify-center">
            <span className="text-lg font-black text-app-primary tabular-nums">
              #{rankSummary.rank}
            </span>
          </div>
        </div>

        {/* Middle: Name & Gap to rank above */}
        <div className="flex-1 flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-app-text truncate">
              {userProfile.displayName}
            </span>
            <span className="px-1.5 py-0.2 rounded-badge bg-app-primary text-app-on-primary text-[9px] font-black tracking-wider uppercase shrink-0">
              BẠN
            </span>
          </div>
          <span className="text-xs text-app-muted truncate mt-0.5 font-medium">
            {rankSummary.pointsToNextRank != null
              ? `Cách #${rankSummary.rank - 1}: ${rankSummary.pointsToNextRank} Elo`
              : 'Đang dẫn đầu bảng xếp hạng!'}
          </span>
        </div>

        {/* Right: Elo & Jump Pill */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-lg font-black text-app-primary tabular-nums">
              {userProfile.eloRating ?? '—'}
            </span>
            <span className="text-[10px] font-bold text-app-muted uppercase">Elo</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-app-primary/10 flex items-center justify-center text-app-primary">
            <ChevronUp size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};
