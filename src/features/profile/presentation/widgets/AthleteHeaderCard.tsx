import React from 'react';
import { Edit2, CheckCircle2 } from 'lucide-react';
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
    <BentoCard highlighted>
      <div className="flex flex-col">
        {/* Header row: Avatar, Name, Home court, Verified badge, Edit button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[54px] h-[54px] rounded-full bg-app-mint text-app-primary flex items-center justify-center text-lg font-extrabold uppercase shrink-0 overflow-hidden">
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt={player.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>{getInitials(player.displayName)}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[22px] font-extrabold text-app-text leading-tight truncate">
                  {player.displayName}
                </h2>
                {player.isIdentityVerified && (
                  <CheckCircle2 size={18} className="text-app-primary shrink-0" />
                )}
              </div>
              <p className="text-xs text-app-muted mt-0.5 truncate">
                {player.homeCourtName || 'Hồ sơ vận động viên'}
              </p>
            </div>
          </div>

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-2 text-app-muted hover:text-app-text rounded-full transition-colors shrink-0"
              title="Chỉnh sửa hồ sơ"
            >
              <Edit2 size={19} />
            </button>
          )}
        </div>

        {/* 164x164 Circular Elo Meter matching Flutter */}
        <div className="relative w-[164px] h-[164px] mx-auto my-6 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 164 164">
            {/* Background ring */}
            <circle
              cx="82"
              cy="82"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-app-border"
            />
            {/* Progress ring */}
            <circle
              cx="82"
              cy="82"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-app-primary transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[40px] font-extrabold leading-none tracking-tight text-app-primary tabular-nums">
              {player.eloRating ?? '—'}
            </span>
            <span className="text-xs font-semibold text-app-muted mt-1.5">
              {calibrated ? player.tierName : 'Đang phân hạng'}
            </span>
          </div>
        </div>

        {/* Calibration or Tier Progression Info */}
        <div className="text-center flex flex-col items-center">
          {!calibrated ? (
            <>
              <p className="text-sm font-bold text-app-text">
                {placementCompleted}/5 trận
              </p>
              <p className="text-xs text-app-muted mt-1">
                Điểm tạm tính · Hoàn tất phân hạng để xác định trình độ.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-app-text">
                {next.pointsNeeded > 0
                  ? `Còn ${next.pointsNeeded} Elo đến ${next.nextTier}`
                  : next.nextTier}
              </p>
              <p className="text-xs text-app-muted mt-1">
                {next.pointsNeeded > 0
                  ? `Tiến độ trong bậc hiện tại · Mốc ${next.targetElo} Elo`
                  : 'Bạn đã đạt bậc cao nhất hiện tại'}
              </p>
            </>
          )}

          {player.createdAt && (
            <p className="text-[11px] text-app-muted mt-3">
              Tham gia {formatMemberSince(player.createdAt)}
            </p>
          )}
        </div>
      </div>
    </BentoCard>
  );
};

