import React from 'react';
import { Flame, Shield } from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';
import { PlayerProfile, getTrustStatusText } from '../../domain/playerProfile';

interface PerformanceMetricsCardProps {
  player: PlayerProfile;
}

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({ player }) => {
  const hasMatchHistory = player.confirmedMatchesCount > 0;
  const trustText = getTrustStatusText(player.trustScore, hasMatchHistory);

  return (
    <BentoCard>
      <div className="grid grid-cols-2 gap-4 divide-x divide-app-border">
        {/* Cột 1: Chuỗi thắng */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-app-streak">
            <Flame size={17} className="shrink-0" />
            <span className="text-[11px] font-bold tracking-wider uppercase">
              CHUỖI THẮNG
            </span>
          </div>
          <div className="text-[28px] font-extrabold text-app-text mt-2 leading-none tabular-nums">
            {player.winStreak}
          </div>
          <p className="text-[11px] text-app-muted mt-1">Set thắng liên tục</p>
        </div>

        {/* Cột 2: Điểm uy tín */}
        <div className="flex flex-col pl-4">
          <div className="flex items-center gap-1.5 text-app-primary">
            <Shield size={17} className="shrink-0" />
            <span className="text-[11px] font-bold tracking-wider uppercase">
              ĐIỂM UY TÍN
            </span>
          </div>
          <div className="text-[28px] font-extrabold text-app-text mt-2 leading-none tabular-nums">
            {player.trustScore}
          </div>
          <p className="text-[11px] text-app-muted mt-1 truncate" title={trustText}>
            {trustText}
          </p>
        </div>
      </div>
    </BentoCard>
  );
};

