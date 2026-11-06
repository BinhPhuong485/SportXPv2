import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
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
import { UserNavMenu } from './UserNavMenu';

export const TopAppBar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { profile, signOut } = useAuthStore();
  const [isNoticeOpen, setIsNoticeOpen] = useState(
    () => window.location.href.includes('notice=true')
  );
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-14 flex items-center justify-between">
          {/* 1. LEFT SECTION: Logo & Search Input (Aligned Left with plenty of breathing room) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 z-10">
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

            {/* LinkedIn-style Search Box (Compact width to prevent encroaching on function bar) */}
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-app-background border border-app-border/80 focus-within:border-emerald-500 focus-within:bg-app-surface focus-within:ring-2 focus-within:ring-emerald-500/10 text-xs text-app-muted transition-all w-36 sm:w-44 md:w-48 lg:w-52">
              <Search size={14} className="text-app-muted shrink-0" />
              <input
                type="text"
                placeholder="Tìm kiếm VĐV, sân cầu, giải đấu..."
                className="bg-transparent text-xs text-app-text placeholder:text-app-muted outline-none w-full font-medium"
              />
            </div>
          </div>

          {/* 2. CENTER SECTION: Nav Items (Được căn tuyệt đối chính giữa Navbar - Desktop >= 1280px) */}
          <nav className="hidden xl:flex items-center justify-center h-full gap-1 absolute left-1/2 -translate-x-1/2 top-0 z-10">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `h-full flex flex-col items-center justify-center px-3.5 text-[10px] font-semibold border-b-2 transition-all min-w-[64px] ${isActive
                      ? 'border-emerald-600 text-slate-900 dark:text-white font-black'
                      : 'border-transparent text-app-muted hover:text-app-text'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={19}
                        fill={isActive ? 'currentColor' : 'none'}
                        className={`shrink-0 transition-transform ${isActive
                            ? 'fill-current text-slate-900 dark:text-white scale-105 stroke-[2.2]'
                            : 'fill-none text-app-muted stroke-[1.8]'
                          }`}
                      />
                      <span className="mt-0.5 tracking-tight">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Notification Nav Item with Badge */}
            <button
              type="button"
              onClick={() => setIsNoticeOpen(true)}
              className={`h-full flex flex-col items-center justify-center px-3 text-[10px] font-semibold border-b-2 transition-all relative min-w-[64px] ${isNoticeOpen
                  ? 'border-emerald-600 text-slate-900 dark:text-white font-black'
                  : 'border-transparent text-app-muted hover:text-app-text'
                }`}
              title="Thông báo"
            >
              <div className="relative">
                <Bell
                  size={19}
                  fill={isNoticeOpen ? 'currentColor' : 'none'}
                  className={`shrink-0 transition-transform ${isNoticeOpen
                      ? 'fill-current text-slate-900 dark:text-white scale-105 stroke-[2.2]'
                      : 'fill-none text-app-muted stroke-[1.8]'
                    }`}
                />
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
          <div className="flex items-center h-full gap-1 sm:gap-2 shrink-0 z-10">
            {/* Notification Bell for Mobile & Tablet (< xl) */}
            <button
              type="button"
              onClick={() => setIsNoticeOpen(true)}
              className="xl:hidden p-2 text-app-muted hover:text-app-text relative rounded-full hover:bg-app-background/60 transition-colors"
              title="Thông báo"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-app-surface leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* LinkedIn-style "Tôi ▾" (Me) Profile Trigger with Default Silhouette Avatar & Popover Menu */}
            <div className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className={`h-full flex flex-col items-center justify-center px-2 sm:px-2.5 transition-colors cursor-pointer ${isUserMenuOpen
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-app-muted hover:text-app-text'
                  }`}
                title={profile?.displayName || 'Hồ sơ cá nhân'}
              >
                <Avatar src={profile?.avatarUrl} alt={profile?.displayName} size="xs" className="w-6 h-6 shadow-2xs" />
                <div className="hidden md:flex items-center gap-0.5 mt-0.5 text-[10px] font-semibold tracking-tight">
                  <span>Tôi</span>
                  <ChevronDown
                    size={10}
                    className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-emerald-600' : ''}`}
                  />
                </div>
              </button>

              {/* Popover User Navigation Menu */}
              <UserNavMenu
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
                profile={profile}
                onSignOut={signOut}
                theme={theme}
                toggleTheme={toggleTheme}
              />
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
