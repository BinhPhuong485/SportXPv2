import React from 'react';
import { MapPin, Calendar, Activity, Award, Trophy, Users } from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';
import {
  Tournament,
  getFormatLabel,
  getRankRequirement,
  formatDate,
  formatPrizeCurrency,
} from '../../domain/tournament';

interface TournamentCardProps {
  tournament: Tournament;
  isRegistered?: boolean;
  onRegister: () => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  isRegistered = false,
  onRegister,
}) => {
  const isRegistering = tournament.status === 'registering';
  const isFull = tournament.currentSlots >= tournament.maxSlots;

  return (
    <BentoCard>
      <div className="flex flex-col gap-3">
        {/* Title & Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-app-text leading-tight flex-1">
            {tournament.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-[6px] text-[10px] font-extrabold uppercase shrink-0 ${
              isRegistering
                ? 'bg-app-primary/12 text-app-primary'
                : 'bg-app-streak/12 text-app-streak'
            }`}
          >
            {isRegistering ? 'ĐANG NHẬN ĐĂNG KÝ' : 'ĐANG THI ĐẤU'}
          </span>
        </div>

        {/* Venue & Time */}
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-start gap-1.5 text-app-text">
            <MapPin size={14} className="text-app-muted shrink-0 mt-0.5" />
            <span className="font-semibold truncate">{tournament.venueName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-app-muted">
            <Calendar size={14} className="shrink-0" />
            <span>Khởi tranh: {formatDate(tournament.startDate)}</span>
          </div>
        </div>

        <div className="h-px bg-app-border my-1" />

        {/* Spec Badges */}
        <div className="flex flex-wrap gap-2 text-[11.5px]">
          {/* Format badge */}
          <div className="px-2 py-1 rounded-[6px] bg-app-background border border-app-border text-app-text font-semibold flex items-center gap-1">
            <Activity size={13} className="text-app-muted" />
            <span>{getFormatLabel(tournament.format)}</span>
          </div>

          {/* Rank requirement badge */}
          <div className="px-2 py-1 rounded-[6px] bg-app-background border border-app-border text-app-text font-semibold flex items-center gap-1">
            <Award size={13} className="text-app-muted" />
            <span>Hạng: {getRankRequirement(tournament.minTier, tournament.maxTier)}</span>
          </div>

          {/* Prize pool badge (highlighted) */}
          {tournament.prizePool > 0 && (
            <div className="px-2 py-1 rounded-[6px] bg-app-streak/12 border border-app-streak/30 text-app-streak font-semibold flex items-center gap-1">
              <Trophy size={13} className="text-app-streak" />
              <span>Thưởng: {formatPrizeCurrency(tournament.prizePool)}</span>
            </div>
          )}

          {/* Slots badge */}
          <div className="px-2 py-1 rounded-[6px] bg-app-background border border-app-border text-app-text font-semibold flex items-center gap-1">
            <Users size={13} className="text-app-muted" />
            <span>
              Chỗ: {tournament.currentSlots}/{tournament.maxSlots}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          {isRegistered ? (
            <button
              type="button"
              onClick={onRegister}
              className="w-full h-11 rounded-[12px] bg-app-mint text-app-primary border border-app-primary/30 text-xs font-bold hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              <span>✓ ĐÃ ĐĂNG KÝ (XEM THÔNG TIN)</span>
            </button>
          ) : isFull ? (
            <button
              type="button"
              disabled
              className="w-full h-11 rounded-[12px] bg-app-surface border border-app-border text-app-muted text-xs font-bold cursor-not-allowed opacity-75"
            >
              ĐÃ ĐỦ CHỖ ĐĂNG KÝ
            </button>
          ) : isRegistering ? (
            <button
              type="button"
              onClick={onRegister}
              className="w-full h-11 rounded-[12px] bg-app-primary text-app-on-primary text-xs font-bold uppercase tracking-wide hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center shadow-xs"
            >
              ĐĂNG KÝ THAM GIA
            </button>
          ) : (
            <button
              type="button"
              onClick={onRegister}
              className="w-full h-11 rounded-[12px] bg-app-surface border border-app-border text-app-muted text-xs font-bold hover:bg-app-background transition-all"
            >
              XEM BẢNG ĐẤU & KẾT QUẢ
            </button>
          )}
        </div>
      </div>
    </BentoCard>
  );
};
