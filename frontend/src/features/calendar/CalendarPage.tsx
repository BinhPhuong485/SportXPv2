import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { CalendarEvent } from './domain/calendarEvent';
import { calendarRepository } from './data/calendarRepository';
import { downloadIcs } from './utils/icsExport';
import { MonthCalendarGrid } from './presentation/widgets/MonthCalendarGrid';
import { CalendarAgendaList } from './presentation/widgets/CalendarAgendaList';

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await calendarRepository.loadUserCalendarEvents();
      setEvents(data);
    } catch (e) {
      console.error('Failed to load calendar events:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleChangeMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      return next;
    });
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleSelectDate = (date: Date) => {
    if (
      selectedDate &&
      selectedDate.getFullYear() === date.getFullYear() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getDate() === date.getDate()
    ) {
      setSelectedDate(null); // toggle off
    } else {
      setSelectedDate(date);
    }
  };

  const handleExportIcs = () => {
    if (events.length === 0) return;
    downloadIcs(events, 'sportxp-schedule.ics');
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  return (
    <PageContent>
      {/* Top Bar with Navigation & ICS Export */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-app-border/40">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/rooms')}
            className="w-9 h-9 rounded-xl border border-app-border bg-app-surface text-app-muted hover:text-app-text flex items-center justify-center transition-colors active:scale-95 shadow-2xs"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-app-text tracking-tight flex items-center gap-2 leading-tight">
              <span>Lịch thi đấu</span>
              <CalendarIcon size={18} className="text-app-primary" />
            </h1>
            <p className="text-xs text-app-muted mt-0.5">
              Lịch thi đấu và buổi chơi cá nhân
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadEvents}
            disabled={loading}
            className="w-9 h-9 rounded-xl border border-app-border bg-app-surface text-app-muted hover:text-app-text flex items-center justify-center transition-colors active:scale-95 shadow-2xs disabled:opacity-50"
            title="Tải lại"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-app-primary' : ''} />
          </button>

          <button
            type="button"
            onClick={handleExportIcs}
            disabled={events.length === 0}
            className="h-9 px-3 rounded-xl bg-app-primary text-app-on-primary text-xs font-bold flex items-center gap-1.5 hover:brightness-105 active:scale-95 transition-all shadow-2xs disabled:opacity-50"
            title="Tải file .ics đồng bộ Google Calendar, Apple Calendar, Outlook"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Xuất file .ics</span>
            <span className="sm:hidden">.ICS</span>
          </button>
        </div>
      </div>

      {/* Download Success Banner */}
      {downloadSuccess && (
        <div className="p-3 rounded-xl bg-app-mint/30 border border-app-primary/30 text-app-primary text-xs font-bold text-center animate-in fade-in duration-200">
          ✓ Đã tải xuống file `sportxp-schedule.ics`. Bạn có thể mở file để đồng bộ vào Google Calendar, Apple Calendar hoặc Outlook.
        </div>
      )}

      {/* Main Layout: Responsive Grid (Mobile: Stacked, Desktop: Side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Month View (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <MonthCalendarGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={events}
            onSelectDate={handleSelectDate}
            onChangeMonth={handleChangeMonth}
            onGoToday={handleGoToday}
          />
        </div>

        {/* Agenda View (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <CalendarAgendaList
            events={events}
            selectedDate={selectedDate}
            onClearDateFilter={() => setSelectedDate(null)}
          />
        </div>
      </div>
    </PageContent>
  );
};

