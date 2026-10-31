import React from 'react';
import {
  Trophy,
  Flame,
  TrendingUp,
  MapPin,
  Calendar,
  Swords,
} from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';
import { ProfileComputedStats } from '../../domain/profileStats';

interface StatsGridProps {
  stats: ProfileComputedStats;
  sourceNote?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  sourceNote = 'Dựa trên 20 trận đấu gần nhất',
}) => {
  if (stats.totalMatches === 0) {
    return (
      <BentoCard doubleBezel className="flex flex-col items-center justify-center text-center py-6 px-4">
        {/* Inline SVG Badminton Racket Empty State Illustration */}
        <div className="w-16 h-16 rounded-2xl bg-app-primary/10 border border-app-primary/25 flex items-center justify-center text-app-primary mb-3 shadow-2xs">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v18" />
            <path d="M3 12h18" />
            <path d="m4.93 4.93 14.14 14.14" />
            <path d="m19.07 4.93-14.14 14.14" />
          </svg>
        </div>
        <h4 className="text-sm font-black text-app-text">Chưa có thống kê thi đấu</h4>
        <p className="text-xs text-app-muted mt-1 max-w-xs leading-relaxed">
          Tài khoản chưa hoàn tất trận đấu nào. Hãy tham gia phòng chơi hoặc ghi nhận kết quả để mở khóa bảng thống kê chi tiết!
        </p>
      </BentoCard>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-app-muted">
          Thống kê phong độ
        </h3>
        <span className="text-[10px] text-app-muted font-medium italic">
          {sourceNote}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* 1. Tổng số trận */}
        <div className="p-3.5 rounded-[16px] bg-app-surface border border-app-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-[11px] font-bold">Số trận</span>
            <Swords size={16} className="text-app-primary" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-app-text tabular-nums">
              {stats.totalMatches}
            </span>
            <span className="text-[10px] text-app-muted ml-1.5 font-medium">
              ({stats.winsCount}T - {stats.lossesCount}B)
            </span>
          </div>
        </div>

        {/* 2. Tỉ lệ thắng */}
        <div className="p-3.5 rounded-[16px] bg-app-surface border border-app-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-[11px] font-bold">Tỉ lệ thắng</span>
            <Trophy size={16} className="text-app-streak" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-app-text tabular-nums">
              {stats.winRate}%
            </span>
            <div className="w-full bg-app-border/60 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-app-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.winRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Chuỗi thắng (Hiện tại & Kỷ lục) */}
        <div className="p-3.5 rounded-[16px] bg-app-surface border border-app-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-[11px] font-bold">Chuỗi thắng</span>
            <Flame size={16} className="text-app-streak" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-app-text tabular-nums">
              {stats.currentStreak}
            </span>
            <span className="text-[11px] text-app-muted ml-1">trận</span>
            <div className="text-[10px] text-app-streak font-extrabold mt-0.5">
              Kỷ lục: {stats.bestStreak} trận
            </div>
          </div>
        </div>

        {/* 4. Thay đổi Elo trung bình */}
        <div className="p-3.5 rounded-[16px] bg-app-surface border border-app-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-[11px] font-bold">Elo TB / trận</span>
            <TrendingUp size={16} className={stats.avgEloChange >= 0 ? 'text-app-primary' : 'text-app-loss'} />
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-black tabular-nums ${stats.avgEloChange >= 0 ? 'text-app-primary' : 'text-app-loss'}`}>
              {stats.avgEloChange > 0 ? `+${stats.avgEloChange}` : stats.avgEloChange}
            </span>
            <span className="text-[10px] text-app-muted ml-1">Elo</span>
          </div>
        </div>

        {/* 5. Sân thi đấu nhiều nhất */}
        <div className="p-3.5 rounded-[16px] bg-app-surface border border-app-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-[11px] font-bold">Sân quen thuộc</span>
            <MapPin size={16} className="text-app-primary" />
          </div>
          <div className="mt-2 min-w-0">
            <span className="text-xs font-black text-app-text line-clamp-1 break-words">
              {stats.favoriteCourt}
            </span>
            <span className="text-[10px] text-app-muted mt-0.5 block">
              Địa điểm chơi nhiều nhất
            </span>
          </div>
        </div>

        {/* 6. Trận đấu trong tháng */}
        <div className="p-3.5 rounded-[16px] bg-app-surface border border-app-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-app-muted">
            <span className="text-[11px] font-bold">Tháng này</span>
            <Calendar size={16} className="text-app-primary" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-app-text tabular-nums">
              {stats.matchesThisMonth}
            </span>
            <span className="text-[10px] text-app-muted ml-1 font-medium">trận đấu</span>
            <span className="text-[10px] text-app-muted mt-0.5 block font-medium">
              Hoạt động tháng hiện tại
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
