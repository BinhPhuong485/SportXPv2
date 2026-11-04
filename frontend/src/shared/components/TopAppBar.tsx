import React, { useState } from 'react';
import { Bell, Sun, Moon, Activity } from 'lucide-react';
import { useThemeStore } from '../hooks/useTheme';
import { NotificationModalSheet } from '../../features/notifications/NotificationModalSheet';
import { useReminderScheduler } from '../../features/reminders/presentation/useReminderScheduler';
import { ReminderToast } from '../../features/reminders/presentation/widgets/ReminderToast';

export const TopAppBar: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [isNoticeOpen, setIsNoticeOpen] = useState(
    () => window.location.href.includes('notice=true')
  );

  const {
    activeToast,
    dismissToast,
    unreadCount,
    refreshReminders,
  } = useReminderScheduler();

  return (
    <>
      {/* Live In-App Reminder Toast (aria-live polite, centered, top z-50) */}
      {activeToast && (
        <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-50 flex justify-center pointer-events-auto">
          <ReminderToast reminder={activeToast} onDismiss={dismissToast} />
        </div>
      )}

      <header className="sticky top-0 z-40 w-full bg-header-gradient text-white border-b border-app-border/20 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-xs">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-black tracking-[0.14em] text-white select-none leading-none">
                SPORTXP
              </span>
              <span className="text-[9px] text-white/75 font-bold tracking-wider uppercase hidden sm:inline mt-0.5">
                Cầu lông phong trào
              </span>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            {/* Theme Toggle (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-11 h-11 flex items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              aria-label="Chuyển giao diện sáng/tối"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell with Badge */}
            <button
              type="button"
              onClick={() => setIsNoticeOpen(true)}
              className="relative w-11 h-11 flex items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              title="Thông báo"
              aria-label="Thông báo"
            >
              <Bell size={21} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 min-w-4 h-4 px-1 rounded-full bg-app-streak text-white text-[10px] font-black flex items-center justify-center ring-2 ring-app-primary leading-none shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notification Modal Sheet */}
      <NotificationModalSheet
        isOpen={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
        onRefreshBadge={refreshReminders}
      />
    </>
  );
};
