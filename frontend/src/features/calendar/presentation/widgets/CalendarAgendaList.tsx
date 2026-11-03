import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Trophy,
  ChevronRight,
  X,
  AlertTriangle,
  Crown,
  CheckCircle2,
  XCircle,
  CalendarPlus,
} from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';
import { CalendarEvent } from '../../domain/calendarEvent';
import { downloadIcs } from '../../utils/icsExport';
import { EventReminderToggle } from '../../../reminders/presentation/widgets/EventReminderToggle';

interface CalendarAgendaListProps {
  events: CalendarEvent[];
  selectedDate: Date | null;
  onClearDateFilter: () => void;
}

type EventFilterType = 'all' | 'rooms' | 'tournaments';

function formatEventTime(start: Date, end: Date, isAllDay?: boolean): string {
  if (isAllDay) return 'Cả ngày';
  const startStr = start.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  const endStr = end.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  return `${startStr} - ${endStr}`;
}

function formatEventDate(d: Date): string {
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

export const CalendarAgendaList: React.FC<CalendarAgendaListProps> = ({
  events,
  selectedDate,
  onClearDateFilter,
}) => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<EventFilterType>('all');
  const [showCancelled, setShowCancelled] = useState(false);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    // 1. Filter by cancelled
    if (!showCancelled && ev.isCancelled) return false;

    // 2. Filter by type
    if (filterType === 'rooms' && ev.type === 'tournament') return false;
    if (filterType === 'tournaments' && ev.type !== 'tournament') return false;

    // 3. Filter by selected date
    if (selectedDate) {
      const evDate = new Date(ev.startsAt);
      const isMatch =
        evDate.getFullYear() === selectedDate.getFullYear() &&
        evDate.getMonth() === selectedDate.getMonth() &&
        evDate.getDate() === selectedDate.getDate();
      if (!isMatch) return false;
    }

    return true;
  });

  const handleCardClick = (ev: CalendarEvent) => {
    if (ev.rawRoom) {
      navigate(`/rooms/${ev.rawRoom.id}`);
    } else if (ev.rawTournament) {
      navigate('/tournaments');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter Bar & Toggle */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-app-primary text-app-on-primary shadow-2xs'
                : 'bg-app-surface border border-app-border text-app-muted hover:text-app-text'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setFilterType('rooms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'rooms'
                ? 'bg-app-primary text-app-on-primary shadow-2xs'
                : 'bg-app-surface border border-app-border text-app-muted hover:text-app-text'
            }`}
          >
            Kèo của tôi
          </button>
          <button
            type="button"
            onClick={() => setFilterType('tournaments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'tournaments'
                ? 'bg-app-primary text-app-on-primary shadow-2xs'
                : 'bg-app-surface border border-app-border text-app-muted hover:text-app-text'
            }`}
          >
            Giải đấu
          </button>
        </div>

        {/* Cancelled toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-app-muted font-bold shrink-0 pl-2">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-app-border text-app-loss accent-app-loss cursor-pointer"
          />
          <span>Hiện kèo đã huỷ</span>
        </label>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-sm font-extrabold text-app-text uppercase tracking-wider flex items-center gap-2">
          {selectedDate ? (
            <>
              <span>Lịch ngày {selectedDate.toLocaleDateString('vi-VN')}</span>
              <button
                type="button"
                onClick={onClearDateFilter}
                className="p-1 rounded-full text-app-muted hover:text-app-loss transition-colors"
                title="Hiện tất cả ngày"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <span>Danh sách lịch thi đấu ({filteredEvents.length})</span>
          )}
        </h3>

        {selectedDate && (
          <button
            type="button"
            onClick={onClearDateFilter}
            className="text-[11px] font-bold text-app-primary hover:underline"
          >
            Xem tất cả
          </button>
        )}
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <BentoCard>
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
            <Trophy size={32} className="text-app-muted/50 mb-2" />
            <p className="text-sm font-bold text-app-text">Không có lịch thi đấu</p>
            <p className="text-xs text-app-muted mt-1 max-w-xs leading-relaxed">
              {selectedDate
                ? 'Bạn không có buổi chơi hoặc giải đấu nào trong ngày này.'
                : 'Bạn chưa có buổi chơi hay giải đấu nào được lưu.'}
            </p>
          </div>
        </BentoCard>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredEvents.map((ev) => {
            const isNear =
              !ev.isCancelled &&
              ev.startsAt.getTime() - Date.now() > 0 &&
              ev.startsAt.getTime() - Date.now() <= 24 * 3600 * 1000;

            return (
              <div
                key={ev.id}
                onClick={() => handleCardClick(ev)}
                className={`w-full text-left p-4 rounded-[18px] bg-app-surface border transition-all cursor-pointer shadow-2xs hover:border-app-primary/40 active:scale-[0.99] flex flex-col gap-2.5 ${
                  ev.isCancelled
                    ? 'border-app-loss/30 opacity-70'
                    : isNear
                    ? 'border-app-primary/40 bg-app-mint/10'
                    : 'border-app-border'
                }`}
              >
                {/* Header row: time + badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-app-primary tabular-nums">
                    <Clock size={14} className="shrink-0" />
                    <span>{formatEventTime(ev.startsAt, ev.endsAt, ev.isAllDay)}</span>
                    {!selectedDate && (
                      <span className="text-app-muted font-normal text-[11px] ml-1">
                        · {formatEventDate(ev.startsAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {ev.isCancelled ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-app-event-cancelled/15 text-app-event-cancelled flex items-center gap-1">
                        <XCircle size={11} />
                        <span>ĐÃ HỦY</span>
                      </span>
                    ) : ev.type === 'tournament' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-app-event-tournament/15 text-app-event-tournament flex items-center gap-1">
                        <Trophy size={11} />
                        <span>GIẢI ĐẤU</span>
                      </span>
                    ) : ev.type === 'hosting' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-app-event-hosting/15 text-app-event-hosting flex items-center gap-1">
                        <Crown size={11} />
                        <span>HOST (TỔ CHỨC)</span>
                      </span>
                    ) : ev.type === 'waitlist' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-app-event-waitlist/15 text-app-event-waitlist flex items-center gap-1">
                        <Clock size={11} />
                        <span>DANH SÁCH CHỜ</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-app-event-joined/15 text-app-event-joined flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        <span>ĐÃ THAM GIA</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 24h warning banner */}
                {isNear && (
                  <div className="px-2.5 py-1 rounded-lg bg-app-streak/15 text-app-streak text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>Sắp diễn ra trong vòng 24 giờ tới!</span>
                  </div>
                )}

                {/* Title & Venue */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-app-text leading-snug truncate">
                      {ev.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-app-muted mt-1 truncate">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{ev.subtitle}</span>
                      {ev.roomCode && (
                        <span className="font-mono font-bold text-app-primary ml-1 shrink-0">
                          {ev.roomCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Per-event In-App Reminder Override Toggle */}
                    <EventReminderToggle eventId={ev.id} isCancelled={ev.isCancelled} compact />

                    {/* Add to Calendar button on card (Disabled on cancelled items) */}
                    <button
                      type="button"
                      disabled={ev.isCancelled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (ev.isCancelled) return;
                        downloadIcs([ev], `sportxp-${ev.id}.ics`);
                      }}
                      title={
                        ev.isCancelled
                          ? 'Không thể thêm buổi đã bị hủy vào lịch'
                          : 'Thêm buổi này vào lịch (.ics)'
                      }
                      className={`h-7 px-2 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all ${
                        ev.isCancelled
                          ? 'opacity-40 cursor-not-allowed border-app-border text-app-muted'
                          : 'border-app-border bg-app-background hover:bg-app-surface text-app-text hover:text-app-primary active:scale-95'
                      }`}
                    >
                      <CalendarPlus size={12} />
                      <span className="hidden sm:inline">Thêm lịch</span>
                    </button>

                    <ChevronRight size={17} className="text-app-muted" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

