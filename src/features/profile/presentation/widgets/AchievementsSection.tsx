import React from 'react';
import {
  Trophy,
  Zap,
  Shield,
  Flame,
  Sparkles,
  Award,
  Crown,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';
import { ClientAchievement } from '../../domain/profileStats';

interface AchievementsSectionProps {
  achievements: ClientAchievement[];
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  achievements,
}) => {
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  const renderBadgeIcon = (iconName: string) => {
    const props = { size: 20 };
    switch (iconName) {
      case 'zap':
        return <Zap {...props} />;
      case 'shield':
        return <Shield {...props} />;
      case 'flame':
        return <Flame {...props} />;
      case 'sparkles':
        return <Sparkles {...props} />;
      case 'award':
        return <Award {...props} />;
      case 'crown':
        return <Crown {...props} />;
      case 'trophy':
      default:
        return <Trophy {...props} />;
    }
  };

  return (
    <BentoCard doubleBezel className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-app-border/40">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-app-text">
            Huy hiệu thành tích
          </h3>
          <p className="text-[11px] text-app-muted">
            Cột mốc thi đấu & tinh thần thể thao
          </p>
        </div>

        <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-app-mint text-app-primary border border-app-primary/25">
          {unlockedCount}/{achievements.length} Đạt được
        </span>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {achievements.map((badge) => (
          <div
            key={badge.id}
            className={`p-3 rounded-[16px] border transition-all flex items-start gap-3 ${
              badge.isUnlocked
                ? 'bg-app-surface border-app-border hover:border-app-primary/40 shadow-xs'
                : 'bg-app-background/40 border-app-border/40 opacity-60'
            }`}
          >
            {/* Badge Icon */}
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                badge.isUnlocked
                  ? 'bg-app-mint text-app-primary border border-app-primary/30'
                  : 'bg-app-surface text-app-muted border border-app-border'
              }`}
            >
              {renderBadgeIcon(badge.iconName)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-app-text truncate">
                  {badge.title}
                </span>
                {badge.isUnlocked ? (
                  <CheckCircle2 size={14} className="text-app-primary shrink-0" />
                ) : (
                  <Lock size={12} className="text-app-muted shrink-0" />
                )}
              </div>

              <p className="text-[11px] text-app-muted leading-tight mt-0.5 line-clamp-2">
                {badge.description}
              </p>

              {/* Status Hint or Progress */}
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                {badge.isUnlocked ? (
                  <span className="font-extrabold text-app-primary">
                    ✓ Đã hoàn thành
                  </span>
                ) : (
                  <span className="font-bold text-app-streak italic">
                    Gợi ý: {badge.unlockHint}
                  </span>
                )}

                {badge.progressText && (
                  <span className="font-mono font-bold text-app-muted">
                    {badge.progressText}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
};
