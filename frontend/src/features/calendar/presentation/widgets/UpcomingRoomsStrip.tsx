import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, AlertTriangle, ChevronRight } from 'lucide-react';
import { CalendarEvent } from '../../domain/calendarEvent';

interface UpcomingRoomsStripProps {
  events: CalendarEvent[];
}

export const UpcomingRoomsStrip: React.FC<UpcomingRoomsStripProps> = ({ events }) => {
  const navigate = useNavigate();

  // Find next 2 upcoming non-cancelled events
  const now = Date.now();
  const upcoming = events
    .filter((e) => !e.isCancelled && e.startsAt.getTime() >= now - 3600 * 1000)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, 2);

  if (upcoming.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2 p-3.5 rounded-[18px] bg-app-surface border border-app-primary/20 shadow-xs mb-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5 text-xs font-black text-app-primary uppercase tracking-wider">
          <Calendar size={14} />
          <span>SẮP TỚI</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/calendar')}
          className="text-[11px] font-bold text-app-primary hover:underline flex items-center gap-0.5"
        >
          <span>Xem lịch đầy đủ</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* 2 Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {upcoming.map((ev) => {
          const diffMs = ev.startsAt.getTime() - now;
          const isUnder24h = diffMs > 0 && diffMs <= 24 * 3600 * 1000;

          return (
            <div
              key={ev.id}
              onClick={() => {
                if (ev.rawRoom) navigate(`/rooms/${ev.rawRoom.id}`);
                else if (ev.rawTournament) navigate('/tournaments');
              }}
              className="p-3 rounded-xl bg-app-background border border-app-border/70 hover:border-app-primary/40 transition-all cursor-pointer flex flex-col gap-1.5"
            >
              {/* Highlight note for items <= 24h */}
              {isUnder24h && (
                <div className="px-2 py-0.5 rounded-md bg-app-streak/15 text-app-streak text-[10px] font-extrabold flex items-center gap-1 w-fit">
                  <AlertTriangle size={11} className="shrink-0" />
                  <span>Sắp diễn ra trong 24 giờ!</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-app-primary">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>
                    {ev.startsAt.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}
                    {' · '}
                    {ev.startsAt.toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'numeric',
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}
                  </span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-app-primary/10 text-app-primary">
                  {ev.type === 'tournament'
                    ? 'Giải đấu'
                    : ev.type === 'hosting'
                    ? 'Host'
                    : ev.type === 'waitlist'
                    ? 'Chờ chỗ'
                    : 'Đã tham gia'}
                </span>
              </div>

              <h5 className="text-xs font-bold text-app-text leading-tight truncate">
                {ev.title}
              </h5>

              <p className="text-[11px] text-app-muted flex items-center gap-1 truncate">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{ev.subtitle}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

