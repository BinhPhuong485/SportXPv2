import React from 'react';
import { MapPin, Calendar, Activity, Award, Trophy, Users, CheckCircle2 } from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';
import { Badge } from '../../../../shared/components/Badge';
import { Button } from '../../../../shared/components/Button';
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
    <BentoCard doubleBezel className="transition-all hover:border-app-primary/40 group">
      <div className="flex flex-col gap-3.5">
        {/* Title & Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-app-text leading-snug group-hover:text-app-primary transition-colors">
              {tournament.title}
            </h3>
          </div>
          <Badge
            variant={isRegistering ? 'primary' : 'warning'}
            className="shrink-0"
          >
            {isRegistering ? 'ĐANG NHẬN ĐĂNG KÝ' : 'ĐANG THI ĐẤU'}
          </Badge>
        </div>

        {/* Venue & Time */}
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-app-text">
            <div className="w-5 h-5 rounded-full bg-app-primary/10 flex items-center justify-center shrink-0">
              <MapPin size={12} className="text-app-primary" />
            </div>
            <span className="font-bold truncate">{tournament.venueName}</span>
          </div>
          <div className="flex items-center gap-2 text-app-muted">
            <div className="w-5 h-5 rounded-full bg-app-surface flex items-center justify-center shrink-0 border border-app-border">
              <Calendar size={12} className="text-app-muted" />
            </div>
            <span className="font-medium">Khởi tranh: {formatDate(tournament.startDate)}</span>
          </div>
        </div>

        <div className="h-px bg-app-border/60 my-0.5" />

        {/* Spec Badges Grid */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          {/* Format badge */}
          <div className="px-2.5 py-1 rounded-badge bg-app-background border border-app-border text-app-text font-bold flex items-center gap-1.5 shadow-2xs">
            <Activity size={12} className="text-app-primary" />
            <span>{getFormatLabel(tournament.format)}</span>
          </div>

          {/* Rank requirement badge */}
          <div className="px-2.5 py-1 rounded-badge bg-app-background border border-app-border text-app-text font-bold flex items-center gap-1.5 shadow-2xs">
            <Award size={12} className="text-app-muted" />
            <span>Hạng: {getRankRequirement(tournament.minTier, tournament.maxTier)}</span>
          </div>

          {/* Prize pool badge (highlighted) */}
          {tournament.prizePool > 0 && (
            <div className="px-2.5 py-1 rounded-badge bg-app-streak/15 border border-app-streak/30 text-app-streak font-black flex items-center gap-1.5 shadow-2xs">
              <Trophy size={13} className="text-app-streak" />
              <span>Thưởng: {formatPrizeCurrency(tournament.prizePool)}</span>
            </div>
          )}

          {/* Slots badge */}
          <div className="px-2.5 py-1 rounded-badge bg-app-background border border-app-border text-app-text font-bold flex items-center gap-1.5 shadow-2xs">
            <Users size={12} className="text-app-muted" />
            <span>
              Chỗ: <strong className="tabular-nums font-black text-app-text">{tournament.currentSlots}</strong>/{tournament.maxSlots}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-1">
          {isRegistered ? (
            <button
              type="button"
              onClick={onRegister}
              className="w-full min-h-[48px] px-4 rounded-btn bg-app-mint text-app-primary border border-app-primary/30 text-xs font-black hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <CheckCircle2 size={16} />
              <span>ĐÃ ĐĂNG KÝ (XEM THÔNG TIN)</span>
            </button>
          ) : isFull ? (
            <button
              type="button"
              disabled
              className="w-full min-h-[48px] px-4 rounded-btn bg-app-surface border border-app-border text-app-muted text-xs font-bold cursor-not-allowed opacity-60"
            >
              ĐÃ ĐỦ CHỖ ĐĂNG KÝ
            </button>
          ) : isRegistering ? (
            <Button
              variant="primary"
              size="lg"
              onClick={onRegister}
              className="w-full uppercase tracking-wider text-xs font-black shadow-xs"
            >
              ĐĂNG KÝ THAM GIA
            </Button>
          ) : (
            <button
              type="button"
              onClick={onRegister}
              className="w-full min-h-[48px] px-4 rounded-btn bg-app-surface border border-app-border text-app-text text-xs font-bold hover:bg-app-background active:scale-[0.99] transition-all"
            >
              XEM BẢNG ĐẤU & KẾT QUẢ
            </button>
          )}
        </div>
      </div>
    </BentoCard>
  );
};
