import React from 'react';
import { Edit2, CheckCircle2, Sparkles } from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';
import {
  PlayerProfile,
  getInitials,
  formatMemberSince,
  getNextTierProgress,
  getPlacementMatchesCompleted,
  isProfileCalibrated,
} from '../../domain/playerProfile';

interface AthleteHeaderCardProps {
  player: PlayerProfile;
  onEdit?: () => void;
}

export const AthleteHeaderCard: React.FC<AthleteHeaderCardProps> = ({
  player,
  onEdit,
}) => {
  const calibrated = isProfileCalibrated(player.confirmedMatchesCount);
  const placementCompleted = getPlacementMatchesCompleted(player.confirmedMatchesCount);
  const next = getNextTierProgress(player.eloRating);

  const progressRatio = calibrated ? next.progress : placementCompleted / 5;
  const circumference = 452.39; // 2 * Math.PI * 72
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progressRatio, 0.03), 1.0));

  return (
    <BentoCard highlighted doubleBezel courtPattern className="relative overflow-hidden">
      <div className="flex flex-col">
        {/* Header row: Avatar, Name, Home court, Verified badge, Edit button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-app-mint text-app-primary border-2 border-app-primary/30 flex items-center justify-center text-lg font-black uppercase shrink-0 overflow-hidden shadow-xs">
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{getInitials(player.displayName)}</span>
                )}
              </div>
              {player.isIdentityVerified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-app-surface flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={16} className="text-app-primary" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-black text-app-text leading-tight truncate">
                  {player.displayName}
                </h2>
              </div>
              <p className="text-xs text-app-muted mt-0.5 truncate font-medium">
                {player.homeCourtName || 'Hồ sơ vận động viên'}
              </p>
            </div>
          </div>

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="w-10 h-10 rounded-full border border-app-border bg-app-surface flex items-center justify-center text-app-muted hover:text-app-text hover:border-app-primary/40 active:scale-95 transition-all shrink-0 shadow-2xs"
              title="Chỉnh sửa hồ sơ"
            >
              <Edit2 size={17} />
            </button>
          )}
        </div>

        {/* 164x164 Circular Elo Meter matching Flutter */}
        <div className="relative w-[164px] h-[164px] mx-auto my-6 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 drop-shadow-xs" viewBox="0 0 164 164">
            {/* Background ring */}
            <circle
              cx="82"
              cy="82"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              className="text-app-border"
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
              <Sparkles size={11} className="text-app-gold" />
              {calibrated ? player.tierName : 'Đang phân hạng'}
            </span>
          </div>
        </div>

        {/* Calibration or Tier Progression Info */}
        <div className="text-center flex flex-col items-center">
          {!calibrated ? (
            <div className="px-4 py-2.5 rounded-btn bg-app-mint/50 border border-app-primary/20 flex flex-col items-center">
              <p className="text-xs font-black text-app-primary">
                {placementCompleted}/5 trận phân hạng
              </p>
              <p className="text-[11px] text-app-muted mt-0.5 font-medium">
                Điểm tạm tính · Hoàn tất 5 trận để chính thức kích hoạt xếp hạng.
              </p>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-btn bg-app-mint/50 border border-app-primary/20 flex flex-col items-center">
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

          {player.createdAt && (
            <p className="text-[11px] text-app-muted mt-3 font-medium">
              Thành viên từ {formatMemberSince(player.createdAt)}
            </p>
          )}
        </div>
      </div>
    </BentoCard>
  );
};
