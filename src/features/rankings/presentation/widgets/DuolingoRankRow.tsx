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

  const getRankColor = () => {
    if (rank === 1) return 'text-[#F59E0B]';
    if (rank === 2) return 'text-[#94A3B8]';
    if (rank === 3) return 'text-[#D97706]';
    return isCurrentUser ? 'text-app-primary' : 'text-[#64748B]';
  };

  const getTierColorStyle = () => {
    switch (tier.group) {
      case 'Nhập môn':
      case 'Yếu':
        return { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' };
      case 'Trung bình yếu':
      case 'Trung bình':
        return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'Trung bình khá':
        return { color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)' };
      case 'Khá':
        return { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' };
      case 'Tốt':
        return { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' };
      case 'Cao thủ phong trào':
      default:
        return { color: 'rgb(var(--color-primary))', bg: 'rgba(var(--color-primary), 0.15)' };
    }
  };

  const tierStyle = getTierColorStyle();
  const initials = getPlayerInitials(player.displayName);

  return (
    <div
      onClick={onTap}
      className={`w-full px-3.5 py-2.5 flex items-center cursor-pointer transition-colors ${
        isCurrentUser ? 'bg-app-primary/10 border-l-[3.5px] border-l-app-primary' : 'hover:bg-app-background/50'
      } ${showDivider ? 'border-b border-app-border/40' : ''}`}
    >
      {/* Rank Number & Delta */}
      <div className="w-11 flex flex-col items-center justify-center shrink-0">
        <span
          className={`text-sm tabular-nums ${
            rank <= 3 || isCurrentUser ? 'font-black' : 'font-bold'
          } ${getRankColor()}`}
        >
          #{rank}
        </span>
        <div className="flex items-center text-[10px] font-extrabold mt-0.5">
          {player.rankDelta > 0 ? (
            <span className="text-[#10B981] flex items-center">
              ▲{player.rankDelta}
            </span>
          ) : player.rankDelta < 0 ? (
            <span className="text-[#EF4444] flex items-center">
              ▼{Math.abs(player.rankDelta)}
            </span>
          ) : (
            <span className="text-[#64748B] font-bold">–</span>
          )}
        </div>
      </div>

      {/* Avatar Initials Circle */}
      <div
        className={`w-9 h-9 rounded-full bg-app-background flex items-center justify-center shrink-0 mx-2 border ${
          isCurrentUser ? 'border-1.5 border-app-primary' : 'border-app-border'
        }`}
      >
        <span
          className={`text-xs font-bold ${
            isCurrentUser ? 'text-app-primary' : 'text-app-text'
          }`}
        >
          {initials}
        </span>
      </div>

      {/* Name, Tier & Streak */}
      <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm truncate ${
              isCurrentUser ? 'font-extrabold text-app-text' : 'font-semibold text-app-text'
            }`}
          >
            {player.displayName}
          </span>
          {isCurrentUser && (
            <span className="px-1.5 py-0.5 rounded bg-app-primary text-app-on-primary text-[9px] font-black tracking-wider shrink-0">
              BẠN
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Tier badge */}
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
            style={{ color: tierStyle.color, backgroundColor: tierStyle.bg }}
          >
            {tier.label}
          </span>

          {/* Win streak */}
          {player.winStreak > 0 && (
            <span className="flex items-center text-[10px] font-extrabold text-app-streak shrink-0">
              🔥 {player.winStreak}
            </span>
          )}
        </div>
      </div>

      {/* Elo Score */}
      <div className="flex flex-col items-end justify-center shrink-0">
        <span
          className={`text-base font-extrabold tabular-nums ${
            isCurrentUser ? 'text-app-primary' : 'text-app-text'
          }`}
        >
          {elo}
        </span>
        <span className="text-[10px] font-semibold text-app-muted">Elo</span>
      </div>
    </div>
  );
};
