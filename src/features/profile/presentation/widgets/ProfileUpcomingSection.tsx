import React from 'react';
import { Calendar, Crown, Users, Trophy, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarEvent } from '../../../calendar/domain/calendarEvent';
import { ProfileSectionCard } from './ProfileSectionCard';

interface ProfileUpcomingSectionProps {
  events: CalendarEvent[];
  roomsHostedCount: number;
  roomsJoinedCount: number;
  tournamentsCount: number;
}

export const ProfileUpcomingSection: React.FC<ProfileUpcomingSectionProps> = ({
  events,
  roomsHostedCount,
  roomsJoinedCount,
  tournamentsCount,
}) => {
  const navigate = useNavigate();

  // Next 2 future non-cancelled events
  const now = Date.now();
  const upcoming = events
    .filter((e) => !e.isCancelled && e.startsAt.getTime() >= now - 1800 * 1000)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, 2);

  const viewAllLink = (
    <Link
      to="/calendar"
      className="text-xs font-black text-app-primary hover:underline flex items-center gap-1"
    >
      <span>Xem tất cả</span>
      <ChevronRight size={14} />
    </Link>
  );

  return (
    <ProfileSectionCard
      id="profile-upcoming-card"
      icon={<Calendar size={16} />}
      title="LỊCH SẮP TỚI & HOẠT ĐỘNG"
      subtitle="Tổng hợp phòng chơi và giải đấu đã ghi danh"
      action={viewAllLink}
    >

      {/* Counts Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-app-background/60 border border-app-border flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-[11px] font-bold text-app-event-hosting">
            <Crown size={12} />
            <span>Tổ chức</span>
          </div>
          <span className="text-lg font-black text-app-text mt-0.5 tabular-nums">
            {roomsHostedCount}
          </span>
          <span className="text-[9px] text-app-muted">phòng host</span>
        </div>

        <div className="p-2.5 rounded-xl bg-app-background/60 border border-app-border flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-[11px] font-bold text-app-event-joined">
            <Users size={12} />
            <span>Tham gia</span>
          </div>
          <span className="text-lg font-black text-app-text mt-0.5 tabular-nums">
            {roomsJoinedCount}
          </span>
          <span className="text-[9px] text-app-muted">buổi chơi</span>
        </div>

        <div className="p-2.5 rounded-xl bg-app-background/60 border border-app-border flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-[11px] font-bold text-app-event-tournament">
            <Trophy size={12} />
            <span>Giải đấu</span>
          </div>
          <span className="text-lg font-black text-app-text mt-0.5 tabular-nums">
            {tournamentsCount}
          </span>
          <span className="text-[9px] text-app-muted">đã ghi danh</span>
        </div>
      </div>

      {/* Upcoming Events List */}
      {upcoming.length === 0 ? (
        <div className="py-4 px-3 rounded-xl bg-app-surface border border-app-border/70 text-center flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-app-text">
            Chưa có buổi chơi nào sắp diễn ra
          </span>
          <p className="text-[11px] text-app-muted">
            Hãy khám phá các phòng chơi quanh bạn hoặc tạo kèo mới để rủ bạn bè!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {upcoming.map((ev) => (
            <div
              key={ev.id}
              onClick={() => {
                if (ev.rawRoom) navigate(`/rooms/${ev.rawRoom.id}`);
                else if (ev.rawTournament) navigate('/tournaments');
              }}
              className="p-3 rounded-xl bg-app-background/70 border border-app-border hover:border-app-primary/40 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs active:scale-[0.99]"
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-app-primary">
                  <Clock size={12} className="shrink-0" />
                  <span>
                    {ev.startsAt.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}
                    {' · '}
                    {ev.startsAt.toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'numeric',
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-app-text truncate mt-0.5">
                  {ev.title}
                </h4>
                <p className="text-[11px] text-app-muted truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">{ev.subtitle}</span>
                </p>
              </div>

              <ChevronRight size={16} className="text-app-muted shrink-0" />
            </div>
          ))}
        </div>
      )}
    </ProfileSectionCard>
  );
};
