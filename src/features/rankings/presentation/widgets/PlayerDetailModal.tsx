import React from 'react';
import { Zap, CircleDot } from 'lucide-react';
import { PlayerProfile } from '../../../../core/types/database.types';
import { rankTierFromElo } from '../../domain/rankTier';
import { getPlayerInitials } from '../../data/leaderboardRepository';

interface PlayerDetailModalProps {
  player: PlayerProfile;
  rank: number;
  isCurrentUser: boolean;
  onClose: () => void;
  onInvite: (name: string) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  rank,
  isCurrentUser,
  onClose,
  onInvite,
}) => {
  const elo = player.eloRating ?? 750;
  const tier = rankTierFromElo(elo);
  const initials = getPlayerInitials(player.displayName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] bg-app-surface rounded-t-[20px] border-t border-app-border p-6 pb-8 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-app-border rounded-full mx-auto" />

        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full bg-app-background flex items-center justify-center border-2 shrink-0 ${
              isCurrentUser ? 'border-app-primary' : 'border-app-border'
            }`}
          >
            <span
              className={`text-xl font-bold ${
                isCurrentUser ? 'text-app-primary' : 'text-app-text'
              }`}
            >
              {initials}
            </span>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-app-text truncate">
                {player.displayName}
              </span>
              {isCurrentUser && (
                <span className="px-1.5 py-0.5 rounded bg-app-primary text-app-on-primary text-[10px] font-extrabold tracking-wider shrink-0">
                  BẠN
                </span>
              )}
            </div>
            <span className="text-xs text-app-muted mt-1">
              Hạng #{rank} · {tier.label} ({tier.group})
            </span>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-app-background rounded-xl border border-app-border flex flex-col items-center">
            <span className="text-[10px] font-bold text-app-muted tracking-wider uppercase">
              ĐIỂM ELO
            </span>
            <span className="text-lg font-extrabold text-app-text tabular-nums mt-1">
              {elo}
            </span>
          </div>

          <div className="p-3 bg-app-background rounded-xl border border-app-border flex flex-col items-center">
            <span className="text-[10px] font-bold text-app-muted tracking-wider uppercase">
              CHUỖI THẮNG
            </span>
            <span className="text-lg font-extrabold text-app-streak tabular-nums mt-1">
              {player.winStreak} 🔥
            </span>
          </div>

          <div className="p-3 bg-app-background rounded-xl border border-app-border flex flex-col items-center">
            <span className="text-[10px] font-bold text-app-muted tracking-wider uppercase">
              UY TÍN
            </span>
            <span className="text-lg font-extrabold text-app-primary tabular-nums mt-1">
              {player.trustScore}%
            </span>
          </div>
        </div>

        {/* Home Court Info */}
        {player.homeCourtName && (
          <div className="w-full px-3.5 py-2.5 rounded-xl bg-app-background border border-app-border flex items-center gap-2">
            <CircleDot size={16} className="text-app-primary shrink-0" />
            <span className="text-xs text-app-muted shrink-0">Sân hoạt động chính:</span>
            <span className="text-xs font-semibold text-app-text truncate">
              {player.homeCourtName}
            </span>
          </div>
        )}

        {/* Action Button */}
        {!isCurrentUser && (
          <button
            type="button"
            onClick={() => {
              onInvite(player.displayName);
              onClose();
            }}
            className="w-full h-12 rounded-[14px] bg-app-primary text-app-on-primary font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition-all shadow-xs mt-2"
          >
            <Zap size={16} fill="currentColor" />
            <span>Mời giao lưu / Thách đấu</span>
          </button>
        )}
      </div>
    </div>
  );
};
