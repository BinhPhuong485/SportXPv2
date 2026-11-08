import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Shield,
  Activity,
  Plus,
  Radio,
  UserCheck,
} from 'lucide-react';
import { ManagedRoomData } from '../../rooms/domain/managedRoom';
import { Avatar } from '../../../shared/components/Avatar';
import { RoomUiFormatters } from '../../rooms/presentation/widgets/roomUiFormatters';

export interface UrgentRoomCardProps {
  urgentRoom?: ManagedRoomData | null;
}

/**
 * UrgentRoomCard - Atomic Organism component
 * Renders the Featured Urgent Matchmaking Broadcast card in the feed
 * Fully protected against text overflows with responsive Atomic Design.
 */
export const UrgentRoomCard: React.FC<UrgentRoomCardProps> = ({ urgentRoom }) => {
  const navigate = useNavigate();

  if (!urgentRoom) {
    return (
      <article className="bg-white dark:bg-app-surface border border-dashed border-emerald-500/30 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-app-text truncate">
              Chưa có kèo tuyển gấp nào đang mở
            </h3>
            <p className="text-xs text-app-muted line-clamp-2">
              Bạn đang thiếu người ghép đội? Tạo kèo ngay để tuyển đồng đội trong khu vực!
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto cursor-pointer"
        >
          <Plus size={14} />
          <span>Tạo kèo tuyển slot</span>
        </button>
      </article>
    );
  }

  const remainingSlots = Math.max(0, urgentRoom.capacity - urgentRoom.reserved);
  const hostMember = urgentRoom.members.find((m) => m.is_host);

  return (
    <article className="bg-white dark:bg-app-surface border border-emerald-500/40 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5 relative overflow-hidden w-full min-w-0">
      {/* 1. Header: Host information & Urgent Badge */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar
            src={hostMember?.avatar_url}
            alt={urgentRoom.hostName}
            size="md"
            className="w-10 h-10 ring-1 ring-app-border shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-app-text truncate max-w-[160px] sm:max-w-[220px]">
                {urgentRoom.hostName || 'Chủ phòng'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold shrink-0">
                Host
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-app-muted font-medium min-w-0 mt-0.5">
              <span className="truncate max-w-[180px] sm:max-w-[280px]" title={urgentRoom.courtName}>
                {urgentRoom.courtName}
              </span>
              <span className="shrink-0">•</span>
              <span className="shrink-0 text-emerald-600 dark:text-emerald-400 font-semibold">Sắp diễn ra</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {urgentRoom.targetGender === 'female' ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold border border-rose-500/20 whitespace-nowrap">
              <span>♀</span>
              <span>Kèo Nữ</span>
            </span>
          ) : urgentRoom.targetGender === 'male' ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold border border-blue-500/20 whitespace-nowrap">
              <span>♂</span>
              <span>Kèo Nam</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold border border-purple-500/20 whitespace-nowrap">
              <span>⚥</span>
              <span>Nam & Nữ</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold border border-rose-500/20 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            CẦN TUYỂN GẤP
          </span>
        </div>
      </div>

      {/* 2. Lobby Brief Box */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-3 min-w-0 overflow-hidden">
        {/* Title and Fee */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <h3
            className="text-xs sm:text-sm font-bold text-app-text min-w-0 flex-1 line-clamp-2 break-words"
            title={urgentRoom.title || 'Kèo giao lưu cầu lông tuyển slot'}
          >
            {urgentRoom.title || 'Kèo giao lưu cầu lông tuyển slot'}
          </h3>
          <span className="font-mono text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-black shrink-0 whitespace-nowrap">
            {RoomUiFormatters.currency(urgentRoom.fee)}{' '}
            <span className="text-xs text-app-muted font-normal">/ slot</span>
          </span>
        </div>

        {/* 2x2 Court & Slot Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-app-muted font-medium min-w-0">
          {/* Box 1: Time */}
          <div className="flex items-start gap-2.5 bg-white dark:bg-app-surface border border-slate-200/70 dark:border-slate-800 p-2.5 rounded-lg shadow-2xs min-w-0 min-h-[58px]">
            <Clock size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="text-app-muted/70 block text-[10px] font-mono font-bold leading-none mb-1">
                THỜI GIAN
              </span>
              <span
                className="text-app-text font-bold block truncate"
                title={RoomUiFormatters.dateRange(urgentRoom.startsAt, urgentRoom.endsAt)}
              >
                {RoomUiFormatters.dateRange(urgentRoom.startsAt, urgentRoom.endsAt)}
              </span>
            </div>
          </div>

          {/* Box 2: Location */}
          <div className="flex items-start gap-2.5 bg-white dark:bg-app-surface border border-slate-200/70 dark:border-slate-800 p-2.5 rounded-lg shadow-2xs min-w-0 min-h-[58px]">
            <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="text-app-muted/70 block text-[10px] font-mono font-bold leading-none mb-1">
                ĐỊA ĐIỂM
              </span>
              <span
                className="text-app-text font-bold block line-clamp-2 break-words text-xs leading-snug"
                title={`${urgentRoom.courtName} ${urgentRoom.address ? `• ${urgentRoom.address}` : ''}`}
              >
                {urgentRoom.courtName} {urgentRoom.address ? `• ${urgentRoom.address}` : ''}
              </span>
            </div>
          </div>

          {/* Box 3: Skill Requirement */}
          <div className="flex items-start gap-2.5 bg-white dark:bg-app-surface border border-slate-200/70 dark:border-slate-800 p-2.5 rounded-lg shadow-2xs min-w-0 min-h-[58px]">
            <Shield size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="text-app-muted/70 block text-[10px] font-mono font-bold leading-none mb-1">
                YÊU CẦU TRÌNH ĐỘ
              </span>
              <span
                className="text-app-text font-bold block truncate"
                title={RoomUiFormatters.skillRange(urgentRoom.minElo, urgentRoom.maxElo)}
              >
                {RoomUiFormatters.skillRange(urgentRoom.minElo, urgentRoom.maxElo)}
              </span>
            </div>
          </div>

          {/* Box 4: Notes (Overflow-safe with 2-line clamp and break-words) */}
          <div className="flex items-start gap-2.5 bg-white dark:bg-app-surface border border-slate-200/70 dark:border-slate-800 p-2.5 rounded-lg shadow-2xs min-w-0 min-h-[58px]">
            <Radio size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="text-app-muted/70 block text-[10px] font-mono font-bold leading-none mb-1">
                CẦU / GHI CHÚ
              </span>
              <span
                className="text-app-text font-bold block line-clamp-2 break-words text-xs leading-snug"
                title={urgentRoom.notes || 'Cầu lông tiêu chuẩn'}
              >
                {urgentRoom.notes || 'Cầu lông tiêu chuẩn'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Rosters & Visual Slot Indicator */}
        <div className="pt-1 min-w-0">
          <div className="flex items-center justify-between text-app-muted font-mono text-[10px] mb-2 font-bold uppercase gap-2 min-w-0">
            <span className="truncate">
              DANH SÁCH LOBBY ({urgentRoom.reserved}/{urgentRoom.capacity} VĐV)
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
              {remainingSlots > 0 ? `CHỈ CÒN ${remainingSlots} SLOT` : 'ĐÃ ĐỦ CHỖ'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {urgentRoom.members.map((member, idx) => (
              <div
                key={member.user_id || idx}
                className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg shadow-2xs min-w-0 max-w-full"
              >
                <Avatar
                  src={member.avatar_url}
                  alt={member.display_name || member.name}
                  size="sm"
                  className="w-6 h-6 rounded-full shrink-0"
                />
                <span className="text-xs font-bold text-app-text truncate max-w-[120px] sm:max-w-[150px]">
                  {member.display_name || member.name || `VĐV ${idx + 1}`}
                </span>
              </div>
            ))}

            {Array.from({ length: remainingSlots }).map((_, slotIdx) => (
              <button
                key={`empty-${slotIdx}`}
                type="button"
                onClick={() => navigate('/rooms')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-dashed border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <Plus size={14} />
                <span>Slot trống (Nhấn vào)</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Footer Join Action CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-app-muted font-medium min-w-0 flex-1">
          <Activity size={14} className="text-emerald-500 shrink-0" />
          <span className="truncate">Đang mở đăng ký cho mọi VĐV đủ điều kiện Elo</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer w-full sm:w-auto"
        >
          <UserCheck size={14} />
          <span>
            Tham gia ngay (Còn {remainingSlots} slot)
          </span>
        </button>
      </div>
    </article>
  );
};

