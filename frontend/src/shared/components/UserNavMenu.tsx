import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Bookmark,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  LayoutDashboard,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { PlayerProfile } from '../../features/profile/domain/playerProfile';

interface UserNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile | null;
  onSignOut: () => void;
  theme: string;
  toggleTheme: () => void;
}

export const UserNavMenu: React.FC<UserNavMenuProps> = ({
  isOpen,
  onClose,
  profile,
  onSignOut,
  theme,
  toggleTheme,
}) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 text-app-text select-none overflow-hidden"
    >
      {/* 1. Header Profile Summary Card */}
      <div
        onClick={() => handleNavigate('/profile')}
        className="px-4 py-3 mx-2 rounded-xl hover:bg-app-background/70 cursor-pointer transition-colors flex items-center justify-between gap-3 border border-transparent hover:border-app-border/60"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={profile?.avatarUrl}
            alt={profile?.displayName}
            size="md"
            className="w-12 h-12 border border-app-border shrink-0 shadow-2xs"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-app-text truncate">
                {profile?.displayName || 'Vận động viên'}
              </span>
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            </div>
            <span className="text-[11px] text-app-muted truncate font-medium">
              Tier {profile?.tierName || 'Phong trào'} · {profile?.eloRating || 750} Elo
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              Xem hồ sơ cá nhân
            </span>
          </div>
        </div>
        <ChevronRight size={16} className="text-app-muted shrink-0" />
      </div>

      <div className="my-1.5 border-t border-app-border/70" />

      {/* 2. Primary Navigation Actions */}
      <div className="px-2 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => handleNavigate('/profile')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-app-text hover:bg-app-background/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard size={15} className="text-app-muted" />
            <span>Bảng điều khiển & Thống kê</span>
          </div>
          <ChevronRight size={14} className="text-app-muted" />
        </button>

        <button
          type="button"
          onClick={() => handleNavigate('/')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-app-text hover:bg-app-background/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Bookmark size={15} className="text-app-muted" />
            <span>Mục đã lưu</span>
          </div>
          <ChevronRight size={14} className="text-app-muted" />
        </button>
      </div>

      <div className="my-1.5 border-t border-app-border/70" />

      {/* 3. SportXP Pro Feature Banner */}
      <div className="px-3 py-1">
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-app-text">Gói SportXP Pro</span>
              <span className="text-[10px] text-app-muted">Thống kê nâng cao & xếp hạng VIP</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[9px] font-black uppercase tracking-wider">
            Dùng thử
          </span>
        </div>
      </div>

      <div className="my-1.5 border-t border-app-border/70" />

      {/* 4. Utility Actions: Settings, Theme, Help */}
      <div className="px-2 flex flex-col gap-0.5 text-xs">
        <button
          type="button"
          onClick={() => handleNavigate('/profile')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-app-text hover:bg-app-background/70 transition-colors"
        >
          <Settings size={15} className="text-app-muted" />
          <span>Cài đặt & Quyền riêng tư</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-app-text hover:bg-app-background/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun size={15} className="text-amber-500" />
            ) : (
              <Moon size={15} className="text-sky-500" />
            )}
            <span>Giao diện: {theme === 'dark' ? 'Chế độ tối' : 'Chế độ sáng'}</span>
          </div>
          <span className="text-[10px] text-app-muted font-bold">Đổi</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            alert('Trung tâm trợ giúp SportXP: Liên hệ admin@sportxp.vn');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-app-text hover:bg-app-background/70 transition-colors"
        >
          <HelpCircle size={15} className="text-app-muted" />
          <span>Trợ giúp & Hỗ trợ</span>
        </button>
      </div>

      <div className="my-1.5 border-t border-app-border/70" />

      {/* 5. Footer Sign Out */}
      <div className="px-2 pt-0.5">
        <button
          type="button"
          onClick={() => {
            onClose();
            onSignOut();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut size={15} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

