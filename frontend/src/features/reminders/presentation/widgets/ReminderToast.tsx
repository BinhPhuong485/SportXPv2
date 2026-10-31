import React from 'react';
import { Bell, ChevronRight, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DueReminder } from '../../domain/reminderTypes';

interface ReminderToastProps {
  reminder: DueReminder;
  onDismiss: () => void;
}

export const ReminderToast: React.FC<ReminderToastProps> = ({ reminder, onDismiss }) => {
  const navigate = useNavigate();
  const event = reminder.event;

  const handleOpen = () => {
    onDismiss();
    if (event.rawRoom?.id) {
      navigate(`/rooms/${event.rawRoom.id}`);
    } else {
      navigate('/calendar');
    }
  };

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={`Nhắc lịch: ${event.title}`}
      className="w-full max-w-sm rounded-[18px] bg-app-surface text-app-text border-2 border-app-primary/60 shadow-2xl p-4 transition-all duration-300 ease-out motion-reduce:transition-none animate-in fade-in slide-in-from-top-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-app-primary/15 border border-app-primary/30 flex items-center justify-center text-app-primary shrink-0 mt-0.5 shadow-2xs">
          <Bell size={20} className="animate-pulse motion-reduce:animate-none" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-app-primary flex items-center gap-1">
              <Clock size={12} />
              {reminder.leadTimeLabel}
            </span>
            <button
              type="button"
              onClick={onDismiss}
              className="text-app-muted hover:text-app-text p-1 -mr-1 rounded-full transition-colors"
              aria-label="Đóng thông báo nhắc lịch"
            >
              <X size={15} />
            </button>
          </div>

          <h4 className="text-sm font-black text-app-text truncate mt-1">
            {event.title}
          </h4>

          <p className="text-xs text-app-muted truncate mt-0.5">
            {event.subtitle} · {reminder.formattedEventTime}
          </p>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleOpen}
              className="px-3.5 py-1.5 rounded-xl bg-app-primary text-app-on-primary text-xs font-black flex items-center gap-1 shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              <span>Xem chi tiết</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
