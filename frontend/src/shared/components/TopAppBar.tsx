import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  Sun,
  Moon,
  Search,
  Plus,
  Flame,
  Users,
  Trophy,
  Calendar,
  Medal,
  ChevronDown,
} from 'lucide-react';
import { useThemeStore } from '../hooks/useTheme';
import { useAuthStore } from '../hooks/useAuth';
import { NotificationModalSheet } from '../../features/notifications/NotificationModalSheet';
import { useReminderScheduler } from '../../features/reminders/presentation/useReminderScheduler';
import { ReminderToast } from '../../features/reminders/presentation/widgets/ReminderToast';
import { Avatar } from './Avatar';

export const TopAppBar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { profile } = useAuthStore();
  const [isNoticeOpen, setIsNoticeOpen] = useState(
    () => window.location.href.includes('notice=true')
  );

  const {
    activeToast,
    dismissToast,
    unreadCount,
    refreshReminders,
  } = useReminderScheduler();

  const navLinks = [
    { to: '/', label: 'Bản tin', icon: Flame, end: true },
    { to: '/rooms', label: 'Tìm kèo', icon: Users, end: false },
    { to: '/rankings', label: 'Xếp hạng', icon: Trophy, end: false },
    { to: '/calendar', label: 'Lịch đấu', icon: Calendar, end: false },
    { to: '/tournaments', label: 'Giải đấu', icon: Medal, end: false },
  ];

  return (
    <>
      {/* Live In-App Reminder Toast */}
      {activeToast && (
        <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-50 flex justify-center pointer-events-auto">
          <ReminderToast reminder={activeToast} onDismiss={dismissToast} />
        </div>
      )}

      {/* Top Application Bar (LinkedIn Top Navigation Architecture - Centered Nav) */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-app-surface border-b border-app-border/80 shadow-2xs transition-colors select-none">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
          {/* 1. LEFT SECTION: Logo & Search Input */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* SportXP Monogram Logo */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer select-none group"
            >
              <img
                src="/assets/brand/symbol.svg"
                alt="SportXP Logo"
                className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition-transform drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-base font-black tracking-tight text-app-text hidden sm:inline group-hover:text-emerald-600 transition-colors">
                SPORTXP
              </span>
            </div>

            {/* LinkedIn-style Search Box */}
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-app-background border border-app-border/80 focus-within:border-emerald-500 focus-within:bg-app-surface focus-within:ring-2 focus-within:ring-emerald-500/10 text-xs text-app-muted transition-all w-40 sm:w-52 md:w-60">
              <Search size={14} className="text-app-muted shrink-0" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="bg-transparent text-xs text-app-text placeholder:text-app-muted outline-none w-full font-medium"
              />
            </div>
          </div>

          {/* 2. CENTER SECTION: Nav Items (Được căn chính giữa Navbar!) */}
          <nav className="hidden lg:flex items-center justify-center h-full gap-1 flex-1 mx-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `h-full flex flex-col items-center justify-center px-3 text-[10px] font-semibold border-b-2 transition-all min-w-[64px] ${
                      isActive
                        ? 'border-emerald-600 text-slate-900 dark:text-white font-black'
                        : 'border-transparent text-app-muted hover:text-app-text'
                    }`
                  }
                >
                  <Icon size={19} className="shrink-0" />
                  <span className="mt-0.5 tracking-tight">{item.label}</span>
                </NavLink>
              );
            })}

            {/* Notification Nav Item with Badge */}
            <button
              type="button"
              onClick={() => setIsNoticeOpen(true)}
              className="h-full flex flex-col items-center justify-center px-3 text-[10px] font-semibold text-app-muted hover:text-app-text border-b-2 border-transparent transition-all relative min-w-[64px]"
              title="Thông báo"
            >
              <div className="relative">
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-app-surface leading-none shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="mt-0.5 tracking-tight">Thông báo</span>
            </button>
          </nav>

          {/* 3. RIGHT SECTION: User Profile Dropdown, CTA, Theme Toggle */}
          <div className="flex items-center h-full gap-1.5 sm:gap-2 shrink-0">
            {/* LinkedIn-style "Tôi ▾" (Me) Profile Trigger with Default Silhouette Avatar */}
            <div
              onClick={() => navigate('/profile')}
              className="h-full flex flex-col items-center justify-center px-2 sm:px-2.5 text-app-muted hover:text-app-text cursor-pointer transition-colors"
              title={profile?.displayName || 'Hồ sơ cá nhân'}
            >
              <Avatar src={profile?.avatarUrl} alt={profile?.displayName} size="xs" className="w-6 h-6" />
              <div className="hidden md:flex items-center gap-0.5 mt-0.5 text-[10px] font-semibold tracking-tight">
                <span>Tôi</span>
                <ChevronDown size={10} />
              </div>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-app-border/80 mx-0.5 hidden sm:block" />

            {/* Quick CTA: + Tạo kèo */}
            <button
              type="button"
              onClick={() => navigate('/rooms/new')}
              className="hidden sm:flex items-center gap-1 h-8 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all"
            >
              <Plus size={14} strokeWidth={2.8} />
              <span>Tạo kèo</span>
            </button>

            {/* Dark / Light Mode Switch */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background/80 transition-colors"
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Notification Modal Sheet Drawer */}
      <NotificationModalSheet
        isOpen={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
        onRefreshBadge={refreshReminders}
      />
    </>
  );
};
