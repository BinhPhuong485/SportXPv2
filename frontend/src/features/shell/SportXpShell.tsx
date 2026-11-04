import React from 'react';
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import {
  Plus,
  Flame,
  Users,
  Trophy,
  Medal,
  User as UserIcon,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { TopAppBar } from '../../shared/components/TopAppBar';
import { BottomNav } from '../../shared/components/BottomNav';
import { useAuthStore } from '../../shared/hooks/useAuth';

export const SportXpShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const isRoomsTab = location.pathname === '/rooms';

  const navItems = [
    { to: '/', label: 'Bản tin cộng đồng', icon: Flame, end: true },
    { to: '/rooms', label: 'Tìm kèo giao lưu', icon: Users, end: false },
    { to: '/rankings', label: 'Bảng xếp hạng Elo', icon: Trophy, end: false },
    { to: '/tournaments', label: 'Giải đấu phong trào', icon: Medal, end: false },
    { to: '/profile', label: 'Hồ sơ cá nhân', icon: UserIcon, end: false },
  ];

  const userInitial = (profile?.displayName || user?.email || 'V')
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-[100dvh] w-full bg-app-background flex flex-col antialiased selection:bg-app-mint selection:text-app-primary">
      {/* Top Application Bar */}
      <TopAppBar />

      {/* Main Responsive Grid Layout */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex-1">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Desktop Navigation Rail (Hidden on mobile < 1024px) */}
          <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 sticky top-20 gap-4">
            {/* 1. Profile Bento Card (Matching LinkedIn Soft Bento Style) */}
            <div className="bg-app-surface rounded-[28px] border border-app-border/80 overflow-hidden shadow-xs flex flex-col">
              {/* Cover Banner */}
              <div className="h-16 w-full bg-gradient-to-r from-emerald-600/20 via-app-mint/60 to-emerald-500/10 relative" />

              {/* Avatar overlapping banner */}
              <div className="flex flex-col items-center px-4 pb-4 -mt-8">
                <div className="w-16 h-16 rounded-full bg-app-mint text-app-primary border-3 border-app-surface shadow-xs flex items-center justify-center font-black text-xl shrink-0 overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    userInitial
                  )}
                </div>

                {/* Name & Tier Title */}
                <h3 className="text-[15px] font-black text-app-text mt-2 text-center truncate max-w-full">
                  {profile?.displayName || user?.email?.split('@')[0] || 'Vận động viên'}
                </h3>
                <span className="text-[11px] font-semibold text-app-muted text-center mt-0.5">
                  VĐV Phong trào · {profile?.tierName || 'TB'}
                </span>

                {/* Bio text */}
                <p className="text-[11px] text-app-muted text-center mt-2 px-1 line-clamp-2 leading-relaxed">
                  {profile?.bio || 'Đam mê cầu lông phong trào, tìm kiếm kèo giao lưu đôi nam/nam nữ tại TP.HCM.'}
                </p>

                {/* Divider */}
                <div className="w-full h-px bg-app-border/60 my-3" />

                {/* Stats Grid Rows */}
                <div className="w-full flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-app-muted font-medium text-[11px]">Trận đã đấu</span>
                    <span className="font-extrabold text-app-text tabular-nums text-[11px]">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-app-muted font-medium text-[11px]">Điểm Elo</span>
                    <span className="font-black text-app-primary tabular-nums text-[11px]">
                      {profile?.eloRating ?? 750}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-app-muted font-medium text-[11px]">Tỉ lệ thắng</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums text-[11px]">
                      68%
                    </span>
                  </div>
                </div>

                {/* View Profile Link */}
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="w-full mt-3 pt-2.5 border-t border-app-border/60 flex items-center justify-between text-[11px] font-bold text-app-primary hover:underline"
                >
                  <span>Xem hồ sơ chi tiết</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* 2. Primary Navigation Bento Card */}
            <div className="bg-app-surface rounded-[28px] border border-app-border/80 p-3 shadow-xs flex flex-col gap-1">
              <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-app-muted/80">
                Menu chính
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-bold transition-all select-none ${
                        isActive
                          ? 'bg-app-mint text-app-primary shadow-xs font-black'
                          : 'text-app-muted hover:text-app-text hover:bg-app-background/60'
                      }`
                    }
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Quick Action Button: Tạo Kèo Mới */}
            <button
              type="button"
              onClick={() => navigate('/rooms/new')}
              className="w-full h-12 px-4 rounded-full bg-app-primary text-app-on-primary font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Tạo Kèo Mới</span>
            </button>

            {/* 3. Followed Hashtags / Cộng đồng Card */}
            <div className="bg-app-surface rounded-[28px] border border-app-border/80 p-4 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black text-app-text uppercase tracking-wider">
                  Chủ đề quan tâm
                </span>
                <ArrowRight size={13} className="text-app-muted" />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['#caulong', '#keogiaoluu', '#sanbadminton', '#elobadminton', '#review'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-app-background border border-app-border/70 text-[11px] font-bold text-app-primary hover:border-app-primary/40 cursor-pointer transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 w-full pb-24 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Floating Action Button for Rooms Tab (Mobile only, hidden on desktop) */}
      {isRoomsTab && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-30 animate-fade-in lg:hidden">
          <button
            type="button"
            onClick={() => navigate('/rooms/new')}
            className="flex items-center gap-2 h-14 px-5 rounded-full bg-app-primary text-app-on-primary font-bold text-sm tracking-wider shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>TẠO KÈO MỚI</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar (Mobile only, hidden on desktop >= 1024px) */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
