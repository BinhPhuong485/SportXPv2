import React from 'react';
import {
  Users,
  MapPin,
  Clock,
  Lock,
  ChevronRight,
  AlertTriangle,
  Play,
  Activity,
  Trophy,
  MessageCircle,
} from 'lucide-react';
import { ManagedRoomData } from '../../domain/managedRoom';
import { RoomUiFormatters } from './roomUiFormatters';

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

  const hostInitial = hostShortName.charAt(0).toUpperCase() || 'H';

  const renderSlotBadge = () => {
    if (room.status === 'CANCELLED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-app-loss/12 text-app-loss border border-app-loss/40 text-[10px] font-black tracking-wide">
          ĐÃ HỦY
        </span>
      );
    }

    if (room.status === 'IN_PROGRESS') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black tracking-wide flex items-center gap-1">
          <Activity size={11} className="animate-pulse" />
          <span>ĐANG ĐẤU</span>
        </span>
      );
    }

    if (room.status === 'COMPLETED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-app-background text-app-muted border border-app-border text-[10px] font-bold">
          ĐÃ KẾT THÚC
        </span>
      );
    }

    if (room.status === 'DRAFT') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-app-background text-app-muted border border-app-border text-[10px] font-bold">
          BẢN NHÁP
        </span>
      );
    }

    if (availableSlots > 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-app-mint text-app-primary border border-app-primary/20 text-[10px] font-black tracking-wide flex items-center gap-1 tabular-nums">
          <Users size={11} />
          <span>
            CÒN {availableSlots}/{room.capacity} CHỖ
          </span>
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded-full bg-app-background text-app-muted border border-app-border text-[10px] font-bold tabular-nums">
        ĐỦ NGƯỜI ({room.capacity}/{room.capacity})
      </span>
    );
  };

  const renderRegistrationBadge = () => {
    if (room.isHost) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-app-primary/10 text-app-primary border border-app-primary/20 text-[10px] font-black">
          HOST
        </span>
      );
    }

    if (room.myStatus === 'REGISTERED') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-app-mint text-app-primary border border-app-primary/25 text-[10px] font-black">
          ĐÃ VÀO
        </span>
      );
    }

    if (room.myStatus === 'WAITLIST') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-app-streak/15 text-app-streak border border-app-streak/40 text-[10px] font-black">
          CHỜ CHỖ
        </span>
      );
    }

    if (room.myStatus === 'RECONFIRM') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-app-loss/15 text-app-loss border border-app-loss/40 text-[10px] font-black">
          CẦN XÁC NHẬN
        </span>
      );
    }

    return null;
  };

  const active = room.status === 'IN_PROGRESS' || isHighlight;
  const needsConfirm = room.myStatus === 'RECONFIRM';

  return (
    <div
      onClick={onTap}
      className={`group w-full bg-app-surface rounded-[26px] p-5 border cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-app-primary/40 active:scale-[0.99] flex flex-col gap-3 shadow-xs ${
        needsConfirm
          ? 'border-app-loss ring-1 ring-app-loss/30'
          : active
          ? 'border-app-primary shadow-xs'
          : 'border-app-border/80'
      }`}
    >
      {/* Top Badges Row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {renderSlotBadge()}
        {renderRegistrationBadge()}
        {room.roomType === 'PRIVATE_RATED' || room.isRated ? (
          <span className="px-2 py-0.5 rounded-full bg-app-streak/10 text-app-streak border border-app-streak/25 text-[10px] font-black flex items-center gap-1">
            <Trophy size={11} />
            <span>TÍNH ELO</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-app-background text-app-muted border border-app-border text-[10px] font-bold">
            GIAO LƯU
          </span>
        )}
        {room.zaloGroupLink && (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold flex items-center gap-1">
            <MessageCircle size={10} />
            <span>Zalo</span>
          </span>
        )}
        {room.visibility === 'PRIVATE' && (
          <div className="flex items-center gap-1 text-[11px] text-app-muted ml-auto">
            <Lock size={12} />
            <span>Kèo riêng tư</span>
          </div>
        )}
      </div>

      {/* Room Title */}
      <h3 className="text-base sm:text-[17px] font-black text-app-text tracking-tight leading-snug group-hover:text-app-primary transition-colors">
        {room.title}
      </h3>

      {/* Date & Schedule */}
      <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-app-text">
        <Clock size={15} className="text-app-primary shrink-0" />
        <span className="tabular-nums">
          {RoomUiFormatters.dateRange(room.startsAt, room.endsAt)}
        </span>
      </div>

      {/* Court Location */}
      <div className="flex items-start gap-2 text-xs text-app-muted">
        <MapPin size={15} className="text-app-muted shrink-0 mt-0.5" />
        <span className="line-clamp-1">
          {room.courtLabel ? `${room.courtName} · ${room.courtLabel}` : room.courtName}
        </span>
      </div>

      {/* Skill Range & Fee Box */}
      <div className="p-3 rounded-xl bg-app-background/70 border border-app-border/60 flex items-center justify-between gap-2 mt-0.5">
        <span className="text-xs font-bold text-app-text">
          {RoomUiFormatters.skillRange(room.minElo, room.maxElo)}
        </span>
        <span className="text-sm font-black text-app-primary tabular-nums">
          {RoomUiFormatters.currency(room.fee)} / người
        </span>
      </div>

      {/* Host Row */}
      <div className="flex items-center gap-2 pt-1 border-t border-app-border/50 text-xs text-app-muted">
        <div className="w-6 h-6 rounded-full bg-app-mint text-app-primary flex items-center justify-center font-bold text-[11px] shrink-0">
          {hostInitial}
        </div>
        <span className="flex-1 truncate text-xs text-app-muted">
          Host: <span className="font-bold text-app-text">{hostShortName}</span>
        </span>
        <ChevronRight size={16} className="text-app-muted group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Call to action if needs reconfirm or in progress */}
      {(needsConfirm || room.status === 'IN_PROGRESS') && (
        <div className="pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTap();
            }}
            className={`w-full h-11 rounded-xl font-black text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] ${
              needsConfirm
                ? 'bg-app-loss text-white hover:brightness-105'
                : 'bg-app-primary text-app-on-primary hover:brightness-105'
            }`}
          >
            {needsConfirm ? (
              <>
                <AlertTriangle size={15} />
                <span>CẦN XÁC NHẬN ĐIỀU KIỆN MỚI</span>
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" />
                <span>VÀO PHÒNG ĐẤU</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
