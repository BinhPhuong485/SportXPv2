import React from 'react';
import { Zap, CircleDot, X, Award, Flame, ShieldCheck } from 'lucide-react';
import { PlayerProfile } from '../../../../core/types/database.types';
import { rankTierFromElo } from '../../domain/rankTier';
import { getPlayerInitials } from '../../data/leaderboardRepository';
import { Button } from '../../../../shared/components/Button';

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] bg-app-surface rounded-t-bento border-t border-app-border p-6 pb-8 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-app-border rounded-full mx-auto" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black tracking-widest text-app-muted uppercase">
            HỒ SƠ TAY VỢT
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4 p-4 rounded-bento bg-app-background/60 border border-app-border">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${
              isCurrentUser
                ? 'bg-app-mint text-app-primary ring-4 ring-app-primary/30 font-black'
                : 'bg-app-surface text-app-text border-2 border-app-border font-bold'
            }`}
          >
            <span className="text-xl uppercase">
              {initials}
            </span>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-app-text truncate">
                {player.displayName}
              </span>
              {isCurrentUser && (
                <span className="px-1.5 py-0.5 rounded-badge bg-app-primary text-app-on-primary text-[10px] font-black tracking-wider uppercase shrink-0">
                  BẠN
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-app-primary">
                Hạng #{rank}
              </span>
              <span className="text-xs text-app-muted">•</span>
              <span className="text-xs text-app-muted">
                {tier.label} ({tier.group})
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 bg-app-background/60 rounded-btn border border-app-border flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-black text-app-muted tracking-wider uppercase">
              <Award size={12} className="text-app-primary" />
              <span>ĐIỂM ELO</span>
            </div>
            <span className="text-xl font-black text-app-text tabular-nums mt-1">
              {elo}
            </span>
          </div>

          <div className="p-3.5 bg-app-background/60 rounded-btn border border-app-border flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-black text-app-muted tracking-wider uppercase">
              <Flame size={12} className="text-app-streak" />
              <span>CHUỖI THẮNG</span>
            </div>
            <span className="text-xl font-black text-app-streak tabular-nums mt-1">
              {player.winStreak}
            </span>
          </div>

          <div className="p-3.5 bg-app-background/60 rounded-btn border border-app-border flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-black text-app-muted tracking-wider uppercase">
              <ShieldCheck size={12} className="text-app-primary" />
              <span>UY TÍN</span>
            </div>
            <span className="text-xl font-black text-app-primary tabular-nums mt-1">
              {player.trustScore}%
            </span>
          </div>
        </div>

        {/* Home Court Info */}
        {player.homeCourtName && (
          <div className="w-full px-4 py-3 rounded-btn bg-app-background/60 border border-app-border flex items-center gap-3">
            <CircleDot size={18} className="text-app-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-app-muted">Sân hoạt động chính</span>
              <span className="text-xs font-bold text-app-text truncate">
                {player.homeCourtName}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isCurrentUser && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              onInvite(player.displayName);
              onClose();
            }}
            icon={<Zap size={18} fill="currentColor" />}
            className="w-full mt-2"
          >
            Mời giao lưu / Thách đấu
          </Button>
        )}
      </div>
    </div>
  );
};
