import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';

interface MiniDatePickerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose?: () => void;
  minDate?: Date;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export const MiniDatePicker: React.FC<MiniDatePickerProps> = ({
  selectedDate,
  onSelectDate,
  onClose,
  minDate,
}) => {
  const [viewDate, setViewDate] = useState<Date>(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMinDate = minDate ? new Date(minDate) : new Date(today);
  startOfMinDate.setHours(0, 0, 0, 0);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // First day of month
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday = 0, ..., Sunday = 6
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  // Previous month padding days
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from({ length: startDayIndex }, (_, i) => {
    return daysInPrevMonth - startDayIndex + 1 + i;
  });

  const nextMonthPadding = (7 - ((startDayIndex + daysInMonth) % 7)) % 7;

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    handleDayClick(now);
  };

  const handleDayClick = (date: Date) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    onSelectDate(newDate);
    if (onClose) onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="p-3.5 bg-app-surface rounded-2xl border border-app-border shadow-xl select-none animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Month & Year Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-app-border/40 mb-2">
        <div className="flex items-center gap-1.5">
          <CalendarIcon size={16} className="text-app-primary" />
          <span className="text-sm font-black text-app-text tracking-tight">
            Tháng {month + 1}, {year}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleGoToday}
            className="px-2 py-1 rounded-md text-[11px] font-bold text-app-primary hover:bg-app-primary/10 transition-colors"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            title="Tháng trước"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            title="Tháng sau"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Đóng lịch"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background ml-1 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Weekday Labels (T2 -> CN) */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`text-[11px] font-bold py-0.5 ${
              i >= 5 ? 'text-app-streak font-extrabold' : 'text-app-muted'
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Previous Month Days */}
        {prevMonthDays.map((d) => (
          <div
            key={`prev-${d}`}
            className="h-8 flex items-center justify-center text-xs text-app-muted/30 font-medium cursor-default"
          >
            {d}
          </div>
        ))}

        {/* Current Month Days */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
          const currentDayDate = new Date(year, month, d);
          const isSelected = isSameDay(currentDayDate, selectedDate);
          const isCurrentToday = isSameDay(currentDayDate, today);
          const isPast = currentDayDate < startOfMinDate;

          return (
            <button
              key={`day-${d}`}
              type="button"
              disabled={isPast}
              onClick={() => handleDayClick(currentDayDate)}
              className={`h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center relative ${
                isSelected
                  ? 'bg-app-primary text-app-on-primary font-black shadow-xs scale-105'
                  : isCurrentToday
                  ? 'border border-app-primary text-app-primary hover:bg-app-primary/10'
                  : isPast
                  ? 'text-app-muted/30 cursor-not-allowed'
                  : 'text-app-text hover:bg-app-background hover:scale-105'
              }`}
            >
              {d}
              {isCurrentToday && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-app-primary" />
              )}
            </button>
          );
        })}

        {/* Next Month Days Padding */}
        {Array.from({ length: nextMonthPadding }, (_, i) => i + 1).map((d) => (
          <div
            key={`next-${d}`}
            className="h-8 flex items-center justify-center text-xs text-app-muted/30 font-medium cursor-default"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Quick Date Presets */}
      <div className="mt-3 pt-2.5 border-t border-app-border/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { label: 'Hôm nay', days: 0 },
          { label: 'Ngày mai', days: 1 },
          { label: 'Thứ 7 tuần này', isSaturday: true },
          { label: 'Chủ nhật tuần này', isSunday: true },
        ].map((preset, idx) => {
          const targetDate = new Date(today);
          if (preset.isSaturday) {
            const dayOfWeek = today.getDay(); // 0 is Sun, 6 is Sat
            const diff = (6 - dayOfWeek + 7) % 7;
            targetDate.setDate(today.getDate() + (diff === 0 ? 7 : diff));
          } else if (preset.isSunday) {
            const dayOfWeek = today.getDay(); // 0 is Sun
            const diff = (7 - dayOfWeek) % 7;
            targetDate.setDate(today.getDate() + (diff === 0 ? 7 : diff));
          } else if (typeof preset.days === 'number') {
            targetDate.setDate(today.getDate() + preset.days);
          }

          const isCurrentMatch = isSameDay(targetDate, selectedDate);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDayClick(targetDate)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${
                isCurrentMatch
                  ? 'bg-app-primary text-app-on-primary'
                  : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
