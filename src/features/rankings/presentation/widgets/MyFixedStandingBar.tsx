import React from 'react';
import { ArrowUp } from 'lucide-react';
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
      className="w-full bg-app-surface border-t border-app-border cursor-pointer hover:bg-app-background/40 transition-colors shadow-lg"
    >
      <div className="max-w-[720px] mx-auto px-5 py-3 flex items-center justify-between gap-3">
        {/* Left: Rank # */}
        <span className="text-[23px] font-extrabold text-app-primary tabular-nums shrink-0">
          #{rankSummary.rank}
        </span>

        {/* Middle: Name & Gap to rank above */}
        <div className="flex-1 flex flex-col min-w-0 pr-2">
          <span className="text-sm font-bold text-app-text truncate">
            {userProfile.displayName} · Bạn
          </span>
          <span className="text-[12px] text-app-muted truncate mt-0.5">
            {rankSummary.pointsToNextRank != null
              ? `Cách #${rankSummary.rank - 1}: ${rankSummary.pointsToNextRank} Elo`
              : 'Vị trí dẫn đầu'}
          </span>
        </div>

        {/* Right: Elo & Jump Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[21px] font-extrabold text-app-primary tabular-nums">
            {userProfile.eloRating ?? '—'}
          </span>
          <ArrowUp size={18} className="text-app-primary" />
        </div>
      </div>
    </div>
  );
};

