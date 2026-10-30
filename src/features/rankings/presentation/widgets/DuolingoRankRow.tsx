import React from 'react';
import { PlayerProfile } from '../../../../core/types/database.types';
import { rankTierFromElo } from '../../domain/rankTier';
import { getPlayerInitials } from '../../data/leaderboardRepository';

interface DuolingoRankRowProps {
  player: PlayerProfile;
  rank: number;
  isCurrentUser: boolean;
  showDivider?: boolean;
  onTap: () => void;
}

export const DuolingoRankRow: React.FC<DuolingoRankRowProps> = ({
  player,
  rank,
  isCurrentUser,
  showDivider = true,
  onTap,
}) => {
  const elo = player.eloRating ?? 750;
  const tier = rankTierFromElo(elo);

  const getRankBadgeStyle = () => {
    if (rank === 1) return 'text-app-gold font-black';
    if (rank === 2) return 'text-app-muted font-black';
    if (rank === 3) return 'text-amber-600 dark:text-amber-400 font-black';
    return isCurrentUser ? 'text-app-primary font-black' : 'text-app-muted font-bold';
  };

  const getTierClasses = (group: string) => {
    switch (group) {
      case 'Nhập môn':
      case 'Yếu':
        return 'bg-app-surface text-app-muted border-app-border';
      case 'Trung bình yếu':
      case 'Trung bình':
        return 'bg-app-streak/15 text-app-streak border-app-streak/30';
      case 'Trung bình khá':
        return 'bg-app-event-joined/15 text-app-event-joined border-app-event-joined/30';
      case 'Khá':
        return 'bg-app-event-tournament/15 text-app-event-tournament border-app-event-tournament/30';
      case 'Tốt':
        return 'bg-app-loss/15 text-app-loss border-app-loss/30';
      case 'Cao thủ phong trào':
      default:
        return 'bg-app-primary/15 text-app-primary border-app-primary/30';
    }
  };

  const initials = getPlayerInitials(player.displayName);

  return (
    <div
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
      className={`w-full px-4 py-3 flex items-center cursor-pointer transition-all duration-200 active:scale-[0.99] select-none ${
        isCurrentUser
          ? 'bg-app-primary/10 border-l-4 border-l-app-primary shadow-xs'
          : 'hover:bg-app-surface/60'
      } ${showDivider ? 'border-b border-app-border/40' : ''}`}
    >
      {/* Rank Number & Delta */}
      <div className="w-11 flex flex-col items-center justify-center shrink-0">
        <span className={`text-sm tabular-nums ${getRankBadgeStyle()}`}>
          #{rank}
        </span>
        <div className="flex items-center text-[10px] font-extrabold mt-0.5 tabular-nums">
          {player.rankDelta > 0 ? (
            <span className="text-app-primary flex items-center font-bold">
              ▲{player.rankDelta}
            </span>
          ) : player.rankDelta < 0 ? (
            <span className="text-app-loss flex items-center font-bold">
              ▼{Math.abs(player.rankDelta)}
            </span>
          ) : (
            <span className="text-app-muted font-bold">–</span>
          )}
        </div>
      </div>

      {/* Avatar Initials Circle */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mx-2.5 transition-transform ${
          isCurrentUser
            ? 'bg-app-mint text-app-primary ring-2 ring-app-primary/50 font-black'
            : 'bg-app-background text-app-text border border-app-border font-bold'
        }`}
      >
        <span className="text-xs uppercase">
          {initials}
        </span>
      </div>

      {/* Name, Tier & Streak */}
      <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm truncate ${
              isCurrentUser ? 'font-black text-app-text' : 'font-semibold text-app-text'
            }`}
          >
            {player.displayName}
          </span>
          {isCurrentUser && (
            <span className="px-1.5 py-0.5 rounded-badge bg-app-primary text-app-on-primary text-[9px] font-black tracking-wider uppercase shrink-0">
              BẠN
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          {/* Tier badge */}
          <span
            className={`px-2 py-0.5 rounded-badge text-[10px] font-bold border shrink-0 ${getTierClasses(
              tier.group
            )}`}
          >
            {tier.label}
          </span>

          {/* Win streak */}
          {player.winStreak > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] font-extrabold text-app-streak shrink-0">
              🔥 {player.winStreak}
            </span>
          )}
        </div>
      </div>

      {/* Elo Score */}
      <div className="flex flex-col items-end justify-center shrink-0">
        <span
          className={`text-base font-black tabular-nums tracking-tight ${
            isCurrentUser ? 'text-app-primary' : 'text-app-text'
          }`}
        >
          {elo}
        </span>
        <span className="text-[10px] font-semibold text-app-muted uppercase tracking-wider">
          Elo
        </span>
      </div>
    </div>
  );
};
