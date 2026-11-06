import React from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { PlayerProfile } from '../../../../core/types/database.types';
import { Avatar } from '../../../../shared/components/Avatar';

interface LeaderboardPodiumProps {
  eligibleForPodium: PlayerProfile[];
  onSelectPlayer: (player: PlayerProfile, rank: number) => void;
  onlyQualified: boolean;
  isDesktop?: boolean;
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  eligibleForPodium,
  onSelectPlayer,
  onlyQualified,
  isDesktop = false,
}) => {
  const p1 = eligibleForPodium[0];
  const p2 = eligibleForPodium[1];
  const p3 = eligibleForPodium[2];

  return (
    <div className="flex flex-col gap-3 bg-white dark:bg-app-surface border border-app-border/80 rounded-2xl p-4 md:p-6 shadow-2xs">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-amber-500 shrink-0" />
          <span className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Vinh danh Top 3 VĐV
          </span>
        </div>
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">
          {onlyQualified ? 'VĐV chính thức (≥ 5 trận)' : 'Mọi VĐV phong trào'}
        </span>
      </div>

      <div
        className={`grid grid-cols-3 items-end gap-2.5 sm:gap-4 md:gap-8 pt-3 pb-1 w-full ${
          isDesktop ? 'max-w-3xl mx-auto' : 'max-w-2xl mx-auto'
        }`}
      >
        {/* ================= Rank #2 (Left - Silver) ================= */}
        {p2 ? (
          <div
            onClick={() => onSelectPlayer(p2, 2)}
            className="flex flex-col items-center cursor-pointer group select-none transition-transform hover:-translate-y-1"
          >
            <div className="relative mb-2">
              <Avatar
                src={p2.avatarUrl}
                alt={p2.displayName}
                size={isDesktop ? 'lg' : 'md'}
                className="ring-3 ring-slate-300 dark:ring-slate-600 shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-400 text-white text-[11px] font-black flex items-center justify-center ring-2 ring-white dark:ring-app-surface shadow-xs">
                2
              </span>
            </div>

            <Medal
              size={isDesktop ? 30 : 24}
              className="text-slate-400 mb-1 drop-shadow-xs"
            />
            <span className="text-xs font-bold text-app-text text-center truncate max-w-full px-1">
              {p2.displayName}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
              {p2.eloRating ?? '—'} Elo
            </span>

            {/* Pedestal */}
            <div
              className={`w-full mt-3 rounded-t-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-t-3 border-t-slate-400 flex flex-col items-center justify-center shadow-xs ${
                isDesktop ? 'h-20' : 'h-13'
              }`}
            >
              <span className="text-lg md:text-xl font-black text-slate-600 dark:text-slate-300">
                #2
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                Á quân
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-40 select-none">
            <Medal size={isDesktop ? 30 : 24} className="text-app-muted/40 mb-2" />
            <span className="text-xs font-medium text-app-muted text-center truncate max-w-full px-1">
              Trống
            </span>
            <span className="text-[11px] text-app-muted tabular-nums mt-0.5">—</span>
            <div
              className={`w-full mt-3 rounded-t-2xl bg-app-surface/60 border-t-3 border-t-app-border flex items-center justify-center shadow-xs ${
                isDesktop ? 'h-20' : 'h-13'
              }`}
            >
              <span className="text-lg font-extrabold text-app-muted">#2</span>
            </div>
          </div>
        )}

        {/* ================= Rank #1 (Center - Gold Champion) ================= */}
        {p1 ? (
          <div
            onClick={() => onSelectPlayer(p1, 1)}
            className="flex flex-col items-center cursor-pointer group select-none transition-transform hover:-translate-y-1.5 z-10"
          >
            <div className="relative mb-2">
              <Avatar
                src={p1.avatarUrl}
                alt={p1.displayName}
                size={isDesktop ? 'xl' : 'lg'}
                className="ring-4 ring-amber-400 shadow-lg group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-900 text-xs font-black flex items-center justify-center ring-2 ring-white dark:ring-app-surface shadow-md">
                1
              </span>
            </div>

            <Trophy
              size={isDesktop ? 38 : 30}
              className="text-amber-500 mb-1 drop-shadow-sm animate-pulse"
            />
            <span className="text-xs sm:text-sm font-black text-app-text text-center truncate max-w-full px-1">
              {p1.displayName}
            </span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
              {p1.eloRating ?? '—'} Elo
            </span>

            {/* Pedestal */}
            <div
              className={`w-full mt-3 rounded-t-2xl bg-gradient-to-b from-amber-50 to-amber-100/80 dark:from-amber-950/40 dark:to-slate-900 border-t-4 border-t-amber-400 flex flex-col items-center justify-center shadow-sm ${
                isDesktop ? 'h-28' : 'h-18'
              }`}
            >
              <span className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400">
                #1
              </span>
              <span className="text-[10px] md:text-[11px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-tight">
                Quán quân
              </span>
            </div>
          </div>
        ) : null}

        {/* ================= Rank #3 (Right - Bronze) ================= */}
        {p3 ? (
          <div
            onClick={() => onSelectPlayer(p3, 3)}
            className="flex flex-col items-center cursor-pointer group select-none transition-transform hover:-translate-y-1"
          >
            <div className="relative mb-2">
              <Avatar
                src={p3.avatarUrl}
                alt={p3.displayName}
                size={isDesktop ? 'lg' : 'md'}
                className="ring-3 ring-amber-700/60 shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white text-[11px] font-black flex items-center justify-center ring-2 ring-white dark:ring-app-surface shadow-xs">
                3
              </span>
            </div>

            <Medal
              size={isDesktop ? 28 : 22}
              className="text-amber-700 dark:text-amber-500 mb-1 drop-shadow-xs"
            />
            <span className="text-xs font-bold text-app-text text-center truncate max-w-full px-1">
              {p3.displayName}
            </span>
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 tabular-nums mt-0.5">
              {p3.eloRating ?? '—'} Elo
            </span>

            {/* Pedestal */}
            <div
              className={`w-full mt-3 rounded-t-2xl bg-gradient-to-b from-orange-50 to-amber-100/50 dark:from-amber-950/20 dark:to-slate-900 border-t-3 border-t-amber-700 flex flex-col items-center justify-center shadow-xs ${
                isDesktop ? 'h-16' : 'h-11'
              }`}
            >
              <span className="text-base md:text-lg font-black text-amber-800 dark:text-amber-500">
                #3
              </span>
              <span className="text-[10px] font-bold text-amber-700/70 dark:text-amber-400 uppercase tracking-tight">
                Hạng 3
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-40 select-none">
            <Medal size={isDesktop ? 28 : 22} className="text-app-muted/40 mb-2" />
            <span className="text-xs font-medium text-app-muted text-center truncate max-w-full px-1">
              Trống
            </span>
            <span className="text-[11px] text-app-muted tabular-nums mt-0.5">—</span>
            <div
              className={`w-full mt-3 rounded-t-2xl bg-app-surface/60 border-t-3 border-t-app-border flex items-center justify-center shadow-xs ${
                isDesktop ? 'h-16' : 'h-11'
              }`}
            >
              <span className="text-base font-extrabold text-app-muted">#3</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

