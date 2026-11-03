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
        <span className="px-2 py-0.5 rounded-[6px] bg-app-loss/12 text-app-loss border border-app-loss/40 text-[10px] font-extrabold tracking-wider">
          ĐÃ HỦY
        </span>
      );
    }

    if (room.status === 'IN_PROGRESS') {
      return (
        <span className="px-2 py-0.5 rounded-[6px] bg-app-primary/15 text-app-primary border border-app-primary text-[10px] font-extrabold tracking-wider flex items-center gap-1">
          <Activity size={11} />
          <span>ĐANG ĐẤU</span>
        </span>
      );
    }

    if (room.status === 'COMPLETED') {
      return (
        <span className="px-2 py-0.5 rounded-[6px] bg-app-border text-app-muted text-[10px] font-bold tracking-wider">
          ĐÃ KẾT THÚC
        </span>
      );
    }

    if (room.status === 'DRAFT') {
      return (
        <span className="px-2 py-0.5 rounded-[6px] bg-app-border text-app-muted text-[10px] font-bold tracking-wider">
          BẢN NHÁP
        </span>
      );
    }

    if (availableSlots > 0) {
      return (
        <span className="px-2 py-0.5 rounded-[6px] bg-app-primary/12 text-app-primary border border-app-primary/40 text-[10px] font-extrabold tracking-wider flex items-center gap-1 tabular-nums">
          <Users size={11} />
          <span>
            CÒN {availableSlots}/{room.capacity} CHỖ
          </span>
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded-[6px] bg-app-border text-app-muted text-[10px] font-bold tracking-wider tabular-nums">
        ĐỦ NGƯỜI ({room.capacity}/{room.capacity})
      </span>
    );
  };

  const renderRegistrationBadge = () => {
    if (room.isHost) {
      return (
        <span className="px-1.5 py-0.5 rounded-[6px] bg-app-primary/15 text-app-primary border border-app-primary/50 text-[10px] font-extrabold tracking-wider">
          HOST
        </span>
      );
    }

    if (room.myStatus === 'REGISTERED') {
      return (
        <span className="px-1.5 py-0.5 rounded-[6px] bg-app-primary/15 text-app-primary border border-app-primary/50 text-[10px] font-extrabold">
          ĐÃ VÀO
        </span>
      );
    }

    if (room.myStatus === 'WAITLIST') {
      return (
        <span className="px-1.5 py-0.5 rounded-[6px] bg-app-streak/15 text-app-streak border border-app-streak/60 text-[10px] font-extrabold">
          CHỜ CHỖ
        </span>
      );
    }

    if (room.myStatus === 'RECONFIRM') {
      return (
        <span className="px-1.5 py-0.5 rounded-[6px] bg-app-loss/15 text-app-loss border border-app-loss/60 text-[10px] font-extrabold">
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
      className={`w-full bg-app-surface rounded-[20px] p-[18px] border cursor-pointer select-none transition-all duration-150 hover:shadow-xs active:scale-[0.99] flex flex-col ${
        needsConfirm
          ? 'border-app-loss'
          : active
          ? 'border-app-primary shadow-xs'
          : 'border-app-border'
      }`}
    >
      {/* Top Badges Row */}
      <div className="flex flex-wrap items-center gap-2 mb-3.5">
        {renderSlotBadge()}
        {renderRegistrationBadge()}
        {room.visibility === 'PRIVATE' && (
          <div className="flex items-center gap-1 text-xs text-app-muted">
            <Lock size={13} />
            <span className="text-[11px] font-medium">Riêng tư · Vào bằng mã</span>
          </div>
        )}
      </div>

      {/* Room Title */}
      <h3 className="text-[19px] font-extrabold text-app-text tracking-[-0.3px] leading-tight mb-2.5">
        {room.title}
      </h3>

      {/* Date & Schedule */}
      <div className="flex items-start gap-1.5 text-sm font-semibold text-app-text mb-2">
        <Clock size={18} className="text-app-primary shrink-0 mt-0.5" />
        <span className="tabular-nums">
          {RoomUiFormatters.dateRange(room.startsAt, room.endsAt)}
        </span>
      </div>

      {/* Court Location */}
      <div className="flex items-start gap-1.5 text-[13px] text-app-muted mb-3">
        <MapPin size={18} className="text-app-muted shrink-0 mt-0.5" />
        <span className="line-clamp-1">
          {room.courtLabel ? `${room.courtName} · ${room.courtLabel}` : room.courtName}
        </span>
      </div>

      {/* Divider */}
      <hr className="border-app-border/60 my-1" />

      {/* Skill Range & Fee */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2">
        <span className="text-[13px] font-semibold text-app-text">
          {RoomUiFormatters.skillRange(room.minElo, room.maxElo)}
        </span>
        <span className="text-sm font-extrabold text-app-primary tabular-nums">
          {RoomUiFormatters.currency(room.fee)} / người
        </span>
      </div>

      {/* Host Row */}
      <div className="flex items-center gap-2 pt-1 text-xs text-app-muted">
        <div className="w-6 h-6 rounded-full bg-app-mint text-app-primary flex items-center justify-center font-bold text-[11px] shrink-0">
          {hostInitial}
        </div>
        <span className="flex-1 truncate text-xs text-app-muted">
          Host · {hostShortName}
        </span>
        <ChevronRight size={20} className="text-app-muted shrink-0" />
      </div>

      {/* Call to action if needs reconfirm or in progress */}
      {(needsConfirm || room.status === 'IN_PROGRESS') && (
        <div className="mt-3.5 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTap();
            }}
            className={`w-full h-11 rounded-[12px] font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              needsConfirm
                ? 'bg-app-loss text-white hover:brightness-105'
                : 'bg-app-primary text-app-on-primary hover:brightness-105'
            }`}
          >
            {needsConfirm ? (
              <>
                <AlertTriangle size={16} />
                <span>CẦN XÁC NHẬN ĐIỀU KIỆN MỚI</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>VÀO PHÒNG ĐẤU</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

