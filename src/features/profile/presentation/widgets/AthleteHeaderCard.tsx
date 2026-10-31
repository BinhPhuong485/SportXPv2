import React, { useState, useEffect } from 'react';
import { Edit2, CheckCircle2, Sparkles, MapPin, Award, Calendar } from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';
import {
  PlayerProfile,
  getInitials,
  formatMemberSince,
  getNextTierProgress,
  getPlacementMatchesCompleted,
  isProfileCalibrated,
} from '../../domain/playerProfile';
import { leaderboardRepository, PlayerCourtRank } from '../../../rankings/data/leaderboardRepository';
import { getTierRingStyle } from '../../domain/profileStats';

interface AthleteHeaderCardProps {
  player: PlayerProfile;
  onEdit?: () => void;
  homeCourtRankOverride?: PlayerCourtRank | null;
}

export const AthleteHeaderCard: React.FC<AthleteHeaderCardProps> = ({
  player,
  onEdit,
  homeCourtRankOverride,
}) => {
  const [courtRank, setCourtRank] = useState<PlayerCourtRank | null>(
    homeCourtRankOverride ?? null
  );

  useEffect(() => {
    if (homeCourtRankOverride !== undefined) {
      setCourtRank(homeCourtRankOverride);
      return;
    }
    if (player.id && player.homeCourtId) {
      leaderboardRepository
        .getPlayerCourtRank(player.id, player.homeCourtId)
        .then((res) => setCourtRank(res))
        .catch(() => setCourtRank(null));
    }
  }, [player.id, player.homeCourtId, homeCourtRankOverride]);

  const calibrated = isProfileCalibrated(player.confirmedMatchesCount);
  const placementCompleted = getPlacementMatchesCompleted(player.confirmedMatchesCount);
  const next = getNextTierProgress(player.eloRating);
  const tierStyle = getTierRingStyle(player.eloRating);

  const progressRatio = calibrated ? next.progress : placementCompleted / 5;
  const circumference = 452.39; // 2 * Math.PI * 72
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progressRatio, 0.03), 1.0));

  return (
    <BentoCard highlighted doubleBezel courtPattern className="relative overflow-hidden">
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-app-primary/[0.04] via-transparent to-transparent pointer-events-none" />

      <div className="relative flex flex-col gap-4">
        {/* Header row: Avatar (initials with tier ring), Name, Home court, Rank, Edit button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Initials Avatar with Tier-Colored Ring */}
            <div className="relative shrink-0">
              <div
                className={`w-16 h-16 rounded-full bg-app-surface border-3 ${tierStyle.ringColor} ring-4 ring-offset-2 ring-offset-app-surface flex items-center justify-center text-xl font-black uppercase shadow-md select-none`}
              >
                <span>{getInitials(player.displayName)}</span>
              </div>
              {player.isIdentityVerified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-app-surface flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={16} className="text-app-primary" />
                </div>
              )}
            </div>

            {/* Name, Home court & Rank at court */}
            <div className="min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-app-text leading-tight truncate">
                  {player.displayName}
                </h2>
                {/* Tier Badge */}
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border tracking-wider shrink-0 ${tierStyle.badgeBg} ${tierStyle.badgeText}`}
                >
                  {player.tierName || 'Nhập môn'}
                </span>
              </div>

              {/* Home Court & Leaderboard Rank */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-app-muted font-medium">
                <span className="flex items-center gap-1 truncate text-app-text font-bold">
                  <MapPin size={13} className="text-app-primary shrink-0" />
                  <span className="truncate">
                    {player.homeCourtName || 'Chưa đăng ký sân nhà'}
                  </span>
                </span>
                {courtRank && (
                  <span className="flex items-center gap-1 text-app-streak font-extrabold text-[11px] shrink-0">
                    <Award size={12} />
                    <span>Hạng #{courtRank.rank}/{courtRank.totalPlayers}</span>
                  </span>
                )}
              </div>

              {/* Member Since Date */}
              {player.createdAt && (
                <div className="flex items-center gap-1 text-[11px] text-app-muted/80">
                  <Calendar size={11} className="shrink-0" />
                  <span>Gia nhập {formatMemberSince(player.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="w-10 h-10 rounded-full border border-app-border bg-app-surface flex items-center justify-center text-app-muted hover:text-app-text hover:border-app-primary/40 active:scale-95 transition-all shrink-0 shadow-2xs"
              title="Chỉnh sửa hồ sơ"
              aria-label="Chỉnh sửa thông tin hồ sơ"
            >
              <Edit2 size={17} />
            </button>
          )}
        </div>

        {/* 164x164 Circular Elo Gauge */}
        <div className="relative w-[164px] h-[164px] mx-auto my-3 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 drop-shadow-xs"
            viewBox="0 0 164 164"
            role="img"
            aria-label={`Chỉ số Elo hiện tại: ${player.eloRating ?? 750}`}
          >
            {/* Background ring */}
            <circle
              cx="82"
              cy="82"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              className="text-app-border/80"
            />
            {/* Progress ring */}
            <circle
              cx="82"
              cy="82"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-app-primary transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[42px] font-black leading-none tracking-tight text-app-primary tabular-nums">
              {player.eloRating ?? '—'}
            </span>
            <span className="text-[11px] font-bold text-app-muted mt-2 tracking-wide uppercase flex items-center gap-1">
              <Sparkles size={11} className="text-app-streak" />
              {calibrated ? player.tierName : 'Đang phân hạng'}
            </span>
          </div>
        </div>

        {/* Calibration or Next Tier Target */}
        <div className="text-center flex flex-col items-center">
          {!calibrated ? (
            <div className="w-full px-4 py-2.5 rounded-btn bg-app-mint/50 border border-app-primary/20 flex flex-col items-center">
              <p className="text-xs font-black text-app-primary">
                {placementCompleted}/5 trận phân hạng
              </p>
              <p className="text-[11px] text-app-muted mt-0.5 font-medium">
                Điểm tạm tính · Hoàn tất 5 trận để kích hoạt bảng xếp hạng chính thức.
              </p>
            </div>
          ) : (
            <div className="w-full px-4 py-2.5 rounded-btn bg-app-mint/50 border border-app-primary/20 flex flex-col items-center">
              <p className="text-xs font-black text-app-primary">
                {next.pointsNeeded > 0
                  ? `Còn ${next.pointsNeeded} Elo để thăng hạng ${next.nextTier}`
                  : next.nextTier}
              </p>
              <p className="text-[11px] text-app-muted mt-0.5 font-medium">
                {next.pointsNeeded > 0
                  ? `Mục tiêu kế tiếp: mốc ${next.targetElo} Elo`
                  : 'Bạn đã đạt bậc xếp hạng cao nhất hiện tại'}
              </p>
            </div>
          )}
        </div>
      </div>
    </BentoCard>
  );
};
