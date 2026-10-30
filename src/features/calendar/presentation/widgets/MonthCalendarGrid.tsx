import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CalendarEvent, CalendarEventType } from '../../domain/calendarEvent';

interface MonthCalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onChangeMonth: (delta: number) => void;
  onGoToday: () => void;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

interface EventIndicatorProps {
  type: CalendarEventType;
  isCancelled: boolean;
  isSelected?: boolean;
}

export const EventIndicatorBadge: React.FC<EventIndicatorProps> = ({
  type,
  isCancelled,
  isSelected,
}) => {
  if (isCancelled) {
    return (
      <span
        title="Đã hủy (Gạch ngang)"
        className={`w-2 h-0.5 rounded-full ${isSelected ? 'bg-white' : 'bg-app-event-cancelled'}`}
      />
    );
  }

  switch (type) {
    case 'hosting':
      return (
        <span
          title="Host (Hình tròn)"
          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-app-event-hosting'}`}
        />
      );
    case 'joined':
      return (
        <span
          title="Đã tham gia (Hình thoi)"
          className={`w-1.5 h-1.5 rotate-45 rounded-[0.5px] ${isSelected ? 'bg-white' : 'bg-app-event-joined'}`}
        />
      );
    case 'waitlist':
      return (
        <span
          title="Chờ chỗ (Vòng rỗng)"
          className={`w-1.5 h-1.5 rounded-full border border-current bg-transparent ${
            isSelected ? 'text-white' : 'text-app-event-waitlist'
          }`}
        />
      );
    case 'tournament':
      return (
        <span
          title="Giải đấu (Hình vuông)"
          className={`w-1.5 h-1.5 rounded-[1px] ${isSelected ? 'bg-white' : 'bg-app-event-tournament'}`}
        />
      );
  }
};

export const MonthCalendarGrid: React.FC<MonthCalendarGridProps> = ({
  currentDate,
  selectedDate,
  events,
  onSelectDate,
  onChangeMonth,
  onGoToday,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // In Vietnam, Monday is first day of week. Monday = 0, ..., Sunday = 6.
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  // Previous month padding days
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from({ length: startDayIndex }, (_, i) => {
    return daysInPrevMonth - startDayIndex + 1 + i;
  });

  // Current month days (1..daysInMonth)
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Next month padding to complete 35 or 42 cells (multiple of 7)
  const totalCells = Math.ceil((startDayIndex + daysInMonth) / 7) * 7;
  const nextMonthDaysCount = totalCells - (startDayIndex + daysInMonth);
  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1);

  const today = new Date();

  return (
    <div className="w-full bg-app-surface rounded-[20px] p-4 border border-app-border shadow-xs flex flex-col gap-3">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-app-text tracking-tight">
            Tháng {month + 1}, {year}
          </h2>
          <button
            type="button"
            onClick={onGoToday}
            className="px-2.5 py-1 rounded-lg border border-app-border bg-app-background hover:bg-app-surface text-[11px] font-bold text-app-primary transition-colors flex items-center gap-1 active:scale-95"
          >
            <CalendarIcon size={12} />
            <span>Hôm nay</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChangeMonth(-1)}
            className="w-8 h-8 rounded-lg border border-app-border bg-app-background hover:bg-app-surface text-app-muted hover:text-app-text flex items-center justify-center transition-colors active:scale-95"
            title="Tháng trước"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onChangeMonth(1)}
            className="w-8 h-8 rounded-lg border border-app-border bg-app-background hover:bg-app-surface text-app-muted hover:text-app-text flex items-center justify-center transition-colors active:scale-95"
            title="Tháng sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekdays Row (T2 to CN) */}
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`text-[11px] font-extrabold uppercase py-1 ${
              i === 6 ? 'text-app-loss/80' : 'text-app-muted'
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Prev month padding */}
        {prevMonthDays.map((day) => (
          <div
            key={`prev-${day}`}
            className="h-10 sm:h-12 flex flex-col items-center justify-center rounded-xl opacity-30 select-none text-xs text-app-muted font-medium"
          >
            {day}
          </div>
        ))}

        {/* Current month days */}
        {currentMonthDays.map((day) => {
          const cellDate = new Date(year, month, day);
          const isToday = isSameDay(cellDate, today);
          const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false;

          // Events on this day
          const dayEvents = events.filter((ev) => {
            const evDate = new Date(ev.startsAt);
            return (
              evDate.getFullYear() === year &&
              evDate.getMonth() === month &&
              evDate.getDate() === day
            );
          });

          return (
            <button
              key={`curr-${day}`}
              type="button"
              onClick={() => onSelectDate(cellDate)}
              className={`h-10 sm:h-12 flex flex-col items-center justify-center rounded-xl transition-all relative group ${
                isSelected
                  ? 'bg-app-primary text-app-on-primary font-black shadow-xs'
                  : isToday
                  ? 'border border-app-primary bg-app-mint/30 text-app-primary font-bold'
                  : 'hover:bg-app-background text-app-text font-semibold'
              }`}
            >
              <span className="text-xs leading-none tabular-nums">{day}</span>

              {/* Event indicators with distinct shapes */}
              {dayEvents.length > 0 && (
                <div className="flex items-center gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <EventIndicatorBadge
                      key={ev.id}
                      type={ev.type}
                      isCancelled={ev.isCancelled}
                      isSelected={isSelected}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span
                      className={`text-[8px] font-black leading-none ${
                        isSelected ? 'text-white' : 'text-app-muted'
                      }`}
                    >
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Next month padding */}
        {nextMonthDays.map((day) => (
          <div
            key={`next-${day}`}
            className="h-10 sm:h-12 flex flex-col items-center justify-center rounded-xl opacity-30 select-none text-xs text-app-muted font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Legend with distinct shapes & semantic tokens */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-2 border-t border-app-border/40 text-[11px] text-app-muted font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-app-event-hosting" />
          <span>Host (Tròn)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rotate-45 rounded-[0.5px] bg-app-event-joined" />
          <span>Tham gia (Thoi)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border-2 border-app-event-waitlist bg-transparent" />
          <span>Chờ chỗ (Vòng)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-[1px] bg-app-event-tournament" />
          <span>Giải đấu (Vuông)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-full bg-app-event-cancelled" />
          <span>Đã hủy (Gạch)</span>
        </div>
      </div>
    </div>
  );
};

