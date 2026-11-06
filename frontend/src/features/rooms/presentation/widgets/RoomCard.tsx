import React from 'react';
import {
  Users,
  MapPin,
  Clock,
  ChevronRight,
  Activity,
  Trophy,
  ShieldCheck,
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
  const fillPercentage = room.capacity > 0 ? Math.round((room.reserved / room.capacity) * 100) : 0;
  const otherMembers = (room.members || []).filter((m) => !m.is_host);
  const extraJoinedCount = Math.max(0, otherMembers.length - 3);

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

      {/* Lobby Roster & Capacity Bar (Avatar Stack + Progress) */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-3">
        {/* Left: Avatar Stack of joined players + Host name */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Overlapping Avatar Stack */}
          <div className="flex items-center -space-x-2 shrink-0">
            {/* Host Avatar */}
            <div className="relative z-30">
              <Avatar size="sm" className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-900 border border-emerald-500/50 shadow-xs" />
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[7px] font-black rounded-full px-1 py-0.5 ring-1 ring-white dark:ring-slate-900 leading-none">
                H
              </span>
            </div>

            {/* Other Members (max 3 displayed) */}
            {otherMembers.slice(0, 3).map((m, idx) => (
              <div
                key={m.user_id || m.id || idx}
                className="relative w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-app-text shadow-xs overflow-hidden"
                style={{ zIndex: 20 - idx }}
              >
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.name || 'Member'} className="w-full h-full object-cover" />
                ) : (
                  <span>{(m.display_name || m.name || 'V').charAt(0).toUpperCase()}</span>
                )}
              </div>
            ))}

            {/* If no real members array but reserved > 1 (synthetic placeholders) */}
            {otherMembers.length === 0 && room.reserved > 1 &&
              Array.from({ length: Math.min(room.reserved - 1, 3) }).map((_, idx) => (
                <div
                  key={idx}
                  className="relative w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-app-muted shadow-xs"
                  style={{ zIndex: 20 - idx }}
                >
                  <Users size={12} />
                </div>
              ))}

            {/* Extra overflow count (+N) */}
            {(extraJoinedCount > 0 || (otherMembers.length === 0 && room.reserved > 4)) && (
              <div
                className="relative w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] shadow-xs"
                style={{ zIndex: 10 }}
              >
                +{extraJoinedCount > 0 ? extraJoinedCount : room.reserved - 4}
              </div>
            )}
          </div>

          {/* Player info summary */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-bold text-app-text truncate">
                {hostShortName}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                (Host)
              </span>
            </div>
            <span className="text-[11px] text-app-muted truncate">
              {room.reserved <= 1
                ? 'Đang đợi thêm VĐV vào kèo'
                : `${room.reserved} VĐV đã vào phòng`}
            </span>
          </div>
        </div>

        {/* Right: Slot Fill Status + Mini Progress Bar */}
        <div className="flex flex-col items-end shrink-0 w-28 sm:w-32">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="font-mono text-[10px] text-app-muted font-bold uppercase tracking-wider">
              {room.reserved}/{room.capacity} VĐV
            </span>
            <span
              className={`font-mono text-[10px] font-black uppercase tracking-wider ${
                availableSlots <= 2 && availableSlots > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : availableSlots === 0
                  ? 'text-red-500'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {availableSlots > 0 ? `Còn ${availableSlots} chỗ` : 'Đã kín'}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                availableSlots === 0
                  ? 'bg-slate-400'
                  : fillPercentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(8, fillPercentage))}%` }}
            />
          </div>
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
