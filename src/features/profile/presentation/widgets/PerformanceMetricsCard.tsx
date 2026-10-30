import React from 'react';
import { Flame, ShieldCheck } from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';
import { PlayerProfile, getTrustStatusText } from '../../domain/playerProfile';

interface PerformanceMetricsCardProps {
  player: PlayerProfile;
}

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({ player }) => {
  const hasMatchHistory = player.confirmedMatchesCount > 0;
  const trustText = getTrustStatusText(player.trustScore, hasMatchHistory);

  return (
    <BentoCard doubleBezel>
      <div className="grid grid-cols-2 gap-4 divide-x divide-app-border/60">
        {/* Cột 1: Chuỗi thắng */}
        <div className="flex flex-col pr-2">
          <div className="flex items-center gap-1.5 text-app-streak">
            <Flame size={16} className="shrink-0" />
            <span className="text-[11px] font-black tracking-wider uppercase">
              CHUỖI THẮNG
            </span>
          </div>
          <div className="text-[32px] font-black text-app-text mt-2 leading-none tabular-nums">
            {player.winStreak}
          </div>
          <p className="text-[11px] text-app-muted mt-1.5 font-medium">Set thắng liên tục</p>
        </div>

        {/* Cột 2: Điểm uy tín */}
        <div className="flex flex-col pl-4">
          <div className="flex items-center gap-1.5 text-app-primary">
            <ShieldCheck size={16} className="shrink-0" />
            <span className="text-[11px] font-black tracking-wider uppercase">
              ĐIỂM UY TÍN
            </span>
          </div>
          <div className="text-[32px] font-black text-app-text mt-2 leading-none tabular-nums">
            {player.trustScore}%
          </div>
          <p className="text-[11px] text-app-muted mt-1.5 truncate font-medium" title={trustText}>
            {trustText}
          </p>
        </div>
      </div>
    </BentoCard>
  );
};
