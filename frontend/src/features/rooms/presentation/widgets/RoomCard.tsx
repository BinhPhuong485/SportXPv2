import React from 'react';
import {
  MapPin,
  Clock,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { ManagedRoomData } from '../../domain/managedRoom';
import { RoomUiFormatters } from './roomUiFormatters';
import { RoomCourtVisualizer } from './RoomCourtVisualizer';

interface RoomCardProps {
  room: ManagedRoomData;
  onTap: () => void;
  isHighlight?: boolean;
}

/**
 * RoomCard - Atomic Organism Component
 * Redesigned with a visual badminton court representation.
 * Streamlined and clutter-free: displays players and open slots on the court.
 */
export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onTap,
  isHighlight = false,
}) => {
  const active = room.status === 'IN_PROGRESS' || isHighlight;
  const needsConfirm = room.myStatus === 'RECONFIRM';

  return (
    <article
      onClick={onTap}
      className={`group w-full bg-white dark:bg-app-surface rounded-2xl p-4 sm:p-5 border cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-500/50 active:scale-[0.99] flex flex-col gap-3.5 shadow-2xs ${
        needsConfirm
          ? 'border-rose-500 ring-1 ring-rose-500/30'
          : active
          ? 'border-emerald-500 shadow-xs'
          : 'border-app-border/80'
      }`}
    >
      {/* 1. Card Header: Title, Venue, Time, and Fee */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-app-text group-hover:text-emerald-600 transition-colors leading-snug line-clamp-2">
            {room.title}
          </h3>

          {/* Venue & Time Location */}
          <div className="flex items-center gap-2 text-xs text-app-muted flex-wrap">
            <span className="flex items-center gap-1 font-medium truncate max-w-[200px] sm:max-w-none">
              <MapPin size={13} className="text-emerald-600 shrink-0" />
              <span className="truncate">{room.courtName}</span>
            </span>
            <span className="text-app-muted/60">•</span>
            <span className="flex items-center gap-1 font-medium shrink-0">
              <Clock size={13} className="text-emerald-600 shrink-0" />
              <span>{RoomUiFormatters.dateRange(room.startsAt, room.endsAt)}</span>
            </span>
          </div>
        </div>

        {/* Price Tag & Rated Badge */}
        <div className="flex flex-col items-end shrink-0">
          <div className="font-mono text-base sm:text-lg text-emerald-600 dark:text-emerald-400 font-black leading-none">
            {room.fee > 0 ? `${room.fee.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
            <span className="text-[11px] text-app-muted font-normal ml-0.5">/người</span>
          </div>
          <div className="flex items-center gap-1 mt-1 font-mono text-[10px]">
            {room.isRated && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-bold flex items-center gap-0.5">
                <Trophy size={10} />
                <span>ELO</span>
              </span>
            )}
            <span className="text-app-muted font-medium">Bao gồm cầu & nước</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Tactical Badminton Court (Replaces cluttered badges & avatar stack) */}
      <RoomCourtVisualizer room={room} />

      {/* 3. Perks and Action Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-app-border/60">
        <div className="flex items-center gap-3 text-app-muted text-xs font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Trọng tài tính điểm app</span>
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Sparkles size={14} className="text-emerald-600 shrink-0" />
            <span>Sân thảm mới</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onTap}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 shrink-0 cursor-pointer"
        >
          <span>Vào phòng đấu</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </article>
  );
};
