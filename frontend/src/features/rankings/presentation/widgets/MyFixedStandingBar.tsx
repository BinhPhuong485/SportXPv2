import React from 'react';
import { ArrowUp, AlertCircle } from 'lucide-react';
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
  const isProvisional = rankSummary.isProvisional ?? ((userProfile.confirmedMatchesCount ?? 0) < 5);
  const matchesNeeded = rankSummary.matchesNeeded ?? Math.max(0, 5 - (userProfile.confirmedMatchesCount ?? 0));

  return (
    <div
      onClick={onScrollToMyRank}
      className="w-full bg-app-surface border-t border-app-border md:border md:rounded-2xl md:shadow-xl md:backdrop-blur-md md:bg-app-surface/95 cursor-pointer hover:bg-app-background/40 transition-all"
    >
      <div className="w-full px-5 md:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Rank # or Provisional tag */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[22px] font-extrabold text-app-primary tabular-nums">
            #{rankSummary.rank}
          </span>
          {isProvisional && (
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">
              Tập sự
            </span>
          )}
        </div>

        {/* Middle: Name & Gap to rank above / qualification notice */}
        <div className="flex-1 flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sm font-bold text-app-text truncate">
              {userProfile.displayName} · Bạn
            </span>
            {isProvisional && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {userProfile.confirmedMatchesCount ?? 0}/5 trận
              </span>
            )}
          </div>
          <span className="text-[12px] text-app-muted truncate mt-0.5">
            {isProvisional ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                <AlertCircle size={12} />
                Cần thêm {matchesNeeded} trận để xếp hạng chính thức
              </span>
            ) : rankSummary.pointsToNextRank != null ? (
              `Cách #${rankSummary.rank - 1}: ${rankSummary.pointsToNextRank} Elo`
            ) : (
              'Vị trí dẫn đầu'
            )}
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
