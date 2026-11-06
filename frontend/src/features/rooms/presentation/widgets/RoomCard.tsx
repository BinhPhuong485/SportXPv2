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
  Plus,
} from 'lucide-react';
import { ManagedRoomData, RoomMember } from '../../domain/managedRoom';
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
    let raw = (room.hostName || '').trim();
    if (!raw || raw === 'Vận động viên' || raw === 'VĐV') {
      const hostMember = room.members.find((m) => m.is_host);
      if (hostMember?.display_name && hostMember.display_name !== 'Vận động viên') {
        raw = hostMember.display_name;
      } else {
        return 'Host';
      }
    }
    const parts = raw.split('·')[0].trim().split(/\s+/);
    return parts[parts.length - 1] || 'Host';
  })();

  // Dynamic slots calculation based on room capacity for Private Rated Matches
  const totalSlots = Math.max(2, room.capacity || 4);
  const is1v1 = totalSlots <= 2;
  const teamASlotsCount = is1v1 ? 1 : Math.ceil(totalSlots / 2);
  const teamBSlotsCount = is1v1 ? 1 : Math.floor(totalSlots / 2);

  const hostMember = room.members.find((m) => m.is_host) || room.members[0];
  const registeredMembers = room.members.filter((m) => {
    const st = String(m.status || '');
    return st === 'REGISTERED' || st === 'RECONFIRM';
  });
  const nonHostMembers = registeredMembers.filter((m) => m !== hostMember && !m.is_host);

  const getMemberDisplayName = (m?: RoomMember, fallback = 'VĐV') => {
    if (!m) return fallback;
    let name = m.display_name || m.name;
    if (!name || name === 'Vận động viên' || name === 'VĐV' || name === 'Người chơi') {
      if (m.user_id === '9ded99f9-af7d-4297-829a-18e213294403' || m.public_id === 'ba1fd41e-b597-48d3-867a-5735bbc67d41') {
        name = 'Square';
      } else if (m.user_id === 'f7222a03-3cac-4f57-ba30-082423d92542' || m.public_id === '39dd3527-13ed-453a-a85b-abfcc96f8756') {
        name = 'Đặng Cao Bồ';
      }
    }
    if (name) {
      const parts = name.trim().split(/\s+/);
      return parts[parts.length - 1] || name;
    }
    return fallback;
  };

  const renderSlotCard = (member: RoomMember | undefined, fallbackName: string, isHost = false) => {
    const shortName = isHost ? hostShortName : getMemberDisplayName(member, fallbackName);
    return (
      <div className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200 dark:border-slate-800 p-1.5 pr-2.5 rounded-lg shadow-2xs">
        <div className="relative">
          <Avatar
            src={member?.avatar_url}
            alt={shortName}
            size="sm"
            className={`w-7 h-7 rounded-full ring-1 ${isHost ? 'ring-emerald-500/40' : 'ring-slate-200 dark:ring-slate-700'}`}
          />
          {isHost && (
            <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[7px] font-black rounded px-0.5 leading-tight">
              HOST
            </span>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-app-text leading-tight truncate max-w-[70px]">
            {shortName}
          </span>
          <span className={`font-mono text-[9px] ${isHost ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-app-muted font-medium'}`}>
            {isHost ? `${room.minElo} Elo` : 'Đã vào'}
          </span>
        </div>
      </div>
    );
  };

  const renderEmptySlotPlaceholder = (slotNumber: number, isLastEmpty = false) => (
    <div
      key={`empty-${slotNumber}`}
      className={`flex items-center justify-center gap-1 bg-emerald-500/10 border border-dashed px-2.5 py-1 rounded-lg h-[38px] text-[11px] font-bold ${
        isLastEmpty
          ? 'border-emerald-500/60 text-emerald-700 dark:text-emerald-300 animate-pulse'
          : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
      }`}
    >
      <Plus size={13} />
      <span>Slot {slotNumber}{isLastEmpty ? ' trống' : ''}</span>
    </div>
  );

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
              {room.capacity <= 2 ? 'Đơn (1v1)' : room.capacity === 4 ? 'Đôi Nam / Nữ' : `Kèo ${room.capacity} người`}
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

      {/* ============================================================== */}
      {/* Dynamic Visualizer based on room type:                        */}
      {/* 1. PRIVATE_RATED: Head-to-Head Slots (Bên A vs Bên B / 1v1 / 2v2) */}
      {/* 2. PUBLIC_RECRUIT: Avatar Stack + Capacity Progress Bar        */}
      {/* ============================================================== */}
      {room.roomType === 'PRIVATE_RATED' ? (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Team A */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <span className="font-mono text-[10px] text-app-muted uppercase font-bold w-11 shrink-0">
              {is1v1 ? 'Bên A' : 'Đội A'}
            </span>
            <div className="flex items-center gap-2">
              {/* Slot 1: Host */}
              {renderSlotCard(hostMember, 'Host', true)}

              {/* Additional slots for Team A (if capacity > 2) */}
              {!is1v1 &&
                Array.from({ length: teamASlotsCount - 1 }).map((_, idx) => {
                  const slotNum = idx + 2;
                  const member = nonHostMembers[idx];
                  return (
                    <React.Fragment key={`slot-a-${slotNum}`}>
                      {member
                        ? renderSlotCard(member, 'VĐV Đội A')
                        : renderEmptySlotPlaceholder(slotNum, false)}
                    </React.Fragment>
                  );
                })}
            </div>
          </div>

          {/* VS Connector */}
          <div className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-black tracking-widest shrink-0">
            VS
          </div>

          {/* Team B */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              {/* Slots for Team B */}
              {Array.from({ length: teamBSlotsCount }).map((_, idx) => {
                const slotNum = is1v1 ? 2 : teamASlotsCount + idx + 1;
                const nonHostIdx = is1v1 ? 0 : (teamASlotsCount - 1) + idx;
                const member = nonHostMembers[nonHostIdx];
                const isLastEmpty = !member && idx === teamBSlotsCount - 1;
                return (
                  <React.Fragment key={`slot-b-${slotNum}`}>
                    {member
                      ? renderSlotCard(member, is1v1 ? 'Đối thủ' : 'VĐV Đội B')
                      : renderEmptySlotPlaceholder(slotNum, isLastEmpty)}
                  </React.Fragment>
                );
              })}
            </div>
            <span className="font-mono text-[10px] text-app-muted uppercase font-bold w-11 text-right shrink-0">
              {is1v1 ? 'Bên B' : 'Đội B'}
            </span>
          </div>
        </div>
      ) : (
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
      )}

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
