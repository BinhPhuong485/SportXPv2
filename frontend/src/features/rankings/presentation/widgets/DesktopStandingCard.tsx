import React from 'react';
import { ArrowUp, Award, Zap, AlertCircle, TrendingUp } from 'lucide-react';
import { PlayerProfile } from '../../../../core/types/database.types';
import { PlayerCourtRank } from '../../data/leaderboardRepository';
import { Avatar } from '../../../../shared/components/Avatar';
import { rankTierFromElo } from '../../domain/rankTier';

interface DesktopStandingCardProps {
  userProfile?: PlayerProfile;
  rankSummary: PlayerCourtRank | null;
  onScrollToMyRank: () => void;
}

export const DesktopStandingCard: React.FC<DesktopStandingCardProps> = ({
  userProfile,
  rankSummary,
  onScrollToMyRank,
}) => {
  if (!userProfile || !rankSummary) {
    return (
      <div className="bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 p-5 shadow-2xs text-center">
        <span className="text-xs text-app-muted">Chưa có dữ liệu xếp hạng cá nhân</span>
      </div>
    );
  }

  const elo = userProfile.eloRating ?? 750;
  const tier = rankTierFromElo(elo);
  const isProvisional = rankSummary.isProvisional ?? ((userProfile.confirmedMatchesCount ?? 0) < 5);
  const matchesNeeded = rankSummary.matchesNeeded ?? Math.max(0, 5 - (userProfile.confirmedMatchesCount ?? 0));
  const matchesCount = userProfile.confirmedMatchesCount ?? 0;
  const streak = userProfile.winStreak ?? 0;

  return (
    <div className="bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 shadow-2xs overflow-hidden flex flex-col select-none">
      {/* Top Banner Gradient */}
      <div className="h-16 w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 relative px-4 py-2.5 flex justify-between items-start">
        <span className="text-[11px] font-black text-white/90 uppercase tracking-wider flex items-center gap-1.5">
          <Award size={14} />
          Vị trí của bạn
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-xs text-[10px] font-extrabold text-white">
          {rankSummary.courtName}
        </span>
      </div>

      {/* Avatar & Basic Info */}
      <div className="px-5 pt-0 pb-5 flex flex-col">
        <div className="flex items-end justify-between -mt-6">
          <Avatar
            src={userProfile.avatarUrl}
            alt={userProfile.displayName}
            size="lg"
            className="ring-4 ring-white dark:ring-app-surface shadow-md bg-white shrink-0"
          />
          <div className="flex flex-col items-end bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-xl shadow-2xs">
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums leading-none">
              #{rankSummary.rank}
            </span>
            <span className="text-[9px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-tight mt-0.5">
              Thứ hạng
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {userProfile.displayName}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20">
              Bạn
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Cấp bậc: <span className="font-bold text-slate-700 dark:text-slate-200">{tier.label} ({tier.group})</span>
          </p>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Điểm Elo
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
              {elo}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Trận đấu
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
              {matchesCount}
              {streak > 0 && (
                <span className="text-xs font-bold text-amber-500 ml-1">
                  ({streak}W)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Progress or Qualification alert */}
        <div className="mt-3.5">
          {isProvisional ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold">Đang trong giai đoạn tập sự</span>
                <span className="text-[11px] text-amber-600/90 dark:text-amber-400/90 mt-0.5">
                  Cần thêm <strong>{matchesNeeded} trận</strong> được xác nhận để hiển thị chính thức trên bảng phong thần.
                </span>
              </div>
            </div>
          ) : rankSummary.pointsToNextRank != null ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <TrendingUp size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="flex flex-col flex-1">
                <span className="font-bold">Mục tiêu thăng hạng</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300/90 mt-0.5">
                  Còn <strong>{rankSummary.pointsToNextRank} Elo</strong> để vượt{' '}
                  <strong>{rankSummary.nextPlayerName ?? `vị trí #${rankSummary.rank - 1}`}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Zap size={16} className="text-amber-500" />
              <span>Bạn đang dẫn đầu bảng xếp hạng này! Xuất sắc!</span>
            </div>
          )}
        </div>

        {/* Action Button: Scroll to row */}
        <button
          type="button"
          onClick={onScrollToMyRank}
          className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
        >
          <ArrowUp size={14} />
          <span>Cuộn tới dòng của bạn</span>
        </button>
      </div>
    </div>
  );
};
