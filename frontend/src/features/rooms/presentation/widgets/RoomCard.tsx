import React from 'react';
import {
  Users,
  MapPin,
  Clock,
  ChevronRight,
  Activity,
  Trophy,
  ShieldCheck,
  Plus,
  Sparkles,
} from 'lucide-react';
import { ManagedRoomData } from '../../domain/managedRoom';
import { RoomUiFormatters } from './roomUiFormatters';
import { Avatar } from '../../../../shared/components/Avatar';

interface RoomCardProps {
  room: ManagedRoomData;
  onTap: () => void;
  isHighlight?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onTap,
  isHighlight = false,
}) => {
  const availableSlots = Math.max(0, Math.min(room.capacity - room.reserved, room.capacity));

  const hostShortName = (() => {
    const raw = (room.hostName || '').trim();
    if (!raw) return 'Host';
    const parts = raw.split('·')[0].trim().split(/\s+/);
    return parts[parts.length - 1] || 'Host';
  })();

  const renderSlotBadge = () => {
    if (room.status === 'CANCELLED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-mono font-bold tracking-wide">
          ĐÃ HỦY
        </span>
      );
    }

    if (room.status === 'IN_PROGRESS') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold tracking-wide flex items-center gap-1">
          <Activity size={11} className="animate-pulse" />
          <span>ĐANG ĐẤU</span>
        </span>
      );
    }

    if (room.status === 'COMPLETED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-app-muted border border-app-border text-[10px] font-mono font-bold">
          ĐÃ KẾT THÚC
        </span>
      );
    }

    if (availableSlots > 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold tracking-wide flex items-center gap-1 tabular-nums">
          <Users size={11} />
          <span>
            CÒN {availableSlots}/{room.capacity} CHỖ
          </span>
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-app-muted border border-app-border text-[10px] font-mono font-bold tabular-nums">
        ĐỦ NGƯỜI ({room.capacity}/{room.capacity})
      </span>
    );
  };

  const active = room.status === 'IN_PROGRESS' || isHighlight;
  const needsConfirm = room.myStatus === 'RECONFIRM';

  return (
    <div
      onClick={onTap}
      className={`group w-full bg-white dark:bg-app-surface rounded-xl p-4 sm:p-5 border cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-500/50 active:scale-[0.99] flex flex-col gap-3.5 shadow-2xs ${
        needsConfirm
          ? 'border-rose-500 ring-1 ring-rose-500/30'
          : active
          ? 'border-emerald-500 shadow-xs'
          : 'border-app-border/80'
      }`}
    >
      {/* Top Header: Category Chips, Time, and Price */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase font-bold">
              Cầu Lông
            </span>
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-app-text border border-app-border font-medium">
              Elo {room.minElo} - {room.maxElo} ({RoomUiFormatters.skillRange(room.minElo, room.maxElo)})
            </span>
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-app-muted border border-app-border font-medium">
              Đôi Nam / Nữ
            </span>
            {renderSlotBadge()}
            {room.isRated && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/25 text-[10px] font-mono font-bold flex items-center gap-1">
                <Trophy size={10} />
                <span>TÍNH ELO</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-app-text group-hover:text-emerald-600 transition-colors mt-1 leading-snug">
            {room.title}
          </h3>

          {/* Venue & Time Location */}
          <div className="flex items-center gap-2 text-xs text-app-muted flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <MapPin size={13} className="text-emerald-600" />
              <span className="truncate">{room.courtName}</span>
            </span>
            <span className="text-app-muted/60">•</span>
            <span className="flex items-center gap-1 font-medium">
              <Clock size={13} className="text-emerald-600" />
              <span>{RoomUiFormatters.dateRange(room.startsAt, room.endsAt)}</span>
            </span>
          </div>
        </div>

        {/* Price Tag */}
        <div className="flex flex-col items-end shrink-0">
          <div className="font-mono text-base sm:text-lg text-emerald-600 dark:text-emerald-400 font-black leading-none">
            {room.fee > 0 ? `${room.fee.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
            <span className="text-[11px] text-app-muted font-normal ml-0.5">/người</span>
          </div>
          <span className="font-mono text-[10px] text-app-muted mt-1 font-medium">
            Bao gồm cầu & nước
          </span>
        </div>
      </div>

      {/* Lobby Slot Visualizer: Team A vs Team B (Stitch Screen 2 Pattern) */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Team A */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <span className="font-mono text-[10px] text-app-muted uppercase font-bold w-11 shrink-0">Đội A</span>
          <div className="flex items-center gap-2">
            {/* Slot 1: Host */}
            <div className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200 dark:border-slate-800 p-1.5 pr-2.5 rounded-lg shadow-2xs">
              <div className="relative">
                <Avatar size="sm" className="w-7 h-7 rounded-full ring-1 ring-emerald-500/40" />
                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[7px] font-black rounded px-0.5 leading-tight">
                  HOST
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-app-text leading-tight truncate max-w-[70px]">
                  {hostShortName}
                </span>
                <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {room.minElo} Elo
                </span>
              </div>
            </div>

            {/* Slot 2 */}
            {room.reserved >= 2 ? (
              <div className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200 dark:border-slate-800 p-1.5 pr-2.5 rounded-lg shadow-2xs">
                <Avatar size="sm" className="w-7 h-7 rounded-full ring-1 ring-slate-200 dark:ring-slate-700" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-app-text leading-tight truncate max-w-[70px]">
                    VĐV Đội A
                  </span>
                  <span className="font-mono text-[9px] text-app-muted font-medium">Đã vào</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 bg-emerald-500/10 border border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg h-[38px] text-[11px] font-bold">
                <Plus size={13} />
                <span>Slot 2</span>
              </div>
            )}
          </div>
        </div>

        {/* VS Connector */}
        <div className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-black tracking-widest shrink-0">
          VS
        </div>

        {/* Team B */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            {/* Slot 3 */}
            {room.reserved >= 3 ? (
              <div className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200 dark:border-slate-800 p-1.5 pr-2.5 rounded-lg shadow-2xs">
                <Avatar size="sm" className="w-7 h-7 rounded-full ring-1 ring-slate-200 dark:ring-slate-700" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-app-text leading-tight truncate max-w-[70px]">
                    VĐV Đội B
                  </span>
                  <span className="font-mono text-[9px] text-app-muted font-medium">Đã vào</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 bg-emerald-500/10 border border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg h-[38px] text-[11px] font-bold">
                <Plus size={13} />
                <span>Slot 3</span>
              </div>
            )}

            {/* Slot 4 */}
            {room.reserved >= 4 ? (
              <div className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200 dark:border-slate-800 p-1.5 pr-2.5 rounded-lg shadow-2xs">
                <Avatar size="sm" className="w-7 h-7 rounded-full ring-1 ring-slate-200 dark:ring-slate-700" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-app-text leading-tight truncate max-w-[70px]">
                    VĐV Đội B
                  </span>
                  <span className="font-mono text-[9px] text-app-muted font-medium">Đã vào</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 bg-emerald-500/10 border border-dashed border-emerald-500/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg h-[38px] text-[11px] font-bold animate-pulse">
                <Plus size={13} />
                <span>Slot 4 trống</span>
              </div>
            )}
          </div>
          <span className="font-mono text-[10px] text-app-muted uppercase font-bold w-11 text-right shrink-0">Đội B</span>
        </div>
      </div>

      {/* Perks and Action Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-app-border/60">
        <div className="flex items-center gap-3 text-app-muted text-xs font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Trọng tài tính điểm app</span>
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Sân thảm mới</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onTap}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 shrink-0"
        >
          <span>Vào phòng đấu</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
