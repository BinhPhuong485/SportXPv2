import React from 'react';
import {
  Trophy,
  Flame,
  TrendingUp,
  MapPin,
  Calendar,
  Swords,
} from 'lucide-react';
import { ProfileComputedStats } from '../../domain/profileStats';
import { ProfileSectionCard } from './ProfileSectionCard';

interface StatsGridProps {
  stats: ProfileComputedStats;
  sourceNote?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  sourceNote = 'Dựa trên 20 trận gần nhất',
}) => {
  if (stats.totalMatches === 0) {
    return (
      <ProfileSectionCard
        id="profile-stats-card"
        icon={<Swords size={16} />}
        title="THỐNG KÊ PHONG ĐỘ"
        subtitle={sourceNote}
      >
        <div className="flex flex-col items-center justify-center text-center py-6 px-4">
          {/* Inline SVG Badminton Racket Empty State Illustration */}
          <div className="w-14 h-14 rounded-2xl bg-app-primary/10 border border-app-primary/25 flex items-center justify-center text-app-primary mb-3 shadow-2xs">
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
        </div>
      </ProfileSectionCard>
    );
  }

  const statItems = [
    {
      id: 'total_matches',
      label: 'Tổng trận đấu',
      value: `${stats.totalMatches}`,
      subtext: `${stats.winsCount} Thắng · ${stats.lossesCount} Bại`,
      icon: <Swords size={15} className="text-app-primary shrink-0" />,
    },
    {
      id: 'win_rate',
      label: 'Tỷ lệ chiến thắng',
      value: stats.winRate !== null ? `${stats.winRate}%` : '—',
      subtext: stats.winRate !== null && stats.winRate >= 50 ? 'Hiệu suất tích cực' : 'Cần thêm nỗ lực',
      icon: <Trophy size={15} className="text-app-streak shrink-0" />,
    },
    {
      id: 'streaks',
      label: 'Chuỗi phong độ',
      value: `${stats.currentStreak}W`,
      subtext: `Kỷ lục cao nhất: ${stats.bestStreak}W`,
      icon: <Flame size={15} className="text-app-streak shrink-0" />,
    },
    {
      id: 'avg_elo',
      label: 'Thay đổi Elo TB',
      value: stats.avgEloChange > 0 ? `+${stats.avgEloChange}` : `${stats.avgEloChange}`,
      subtext: 'Điểm trung bình mỗi trận',
      icon: <TrendingUp size={15} className="text-app-primary shrink-0" />,
    },
    {
      id: 'fav_court',
      label: 'Sân quen thuộc',
      value: stats.favoriteCourt || '—',
      subtext: stats.favoriteCourt ? 'Sân thi đấu nhiều nhất' : 'Chưa xác định sân',
      icon: <MapPin size={15} className="text-app-primary shrink-0" />,
      isTextVal: true,
    },
    {
      id: 'monthly_matches',
      label: 'Trận trong tháng',
      value: `${stats.matchesThisMonth}`,
      subtext: 'Hoạt động tháng hiện tại',
      icon: <Calendar size={15} className="text-app-primary shrink-0" />,
    },
  ];

  return (
    <ProfileSectionCard
      id="profile-stats-card"
      icon={<Swords size={16} />}
      title="THỐNG KÊ PHONG ĐỘ"
      subtitle={sourceNote}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {statItems.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl bg-app-background border border-app-border flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-center gap-1.5 text-app-muted">
              {item.icon}
              <span className="text-[11px] font-bold truncate">{item.label}</span>
            </div>
            <div className="my-1.5">
              <span
                className={`font-black text-app-text tracking-tight ${
                  item.isTextVal ? 'text-sm truncate block' : 'text-2xl tabular-nums'
                }`}
              >
                {item.value}
              </span>
            </div>
            <p className="text-[10px] text-app-muted truncate font-medium">
              {item.subtext}
            </p>
          </div>
        ))}
      </div>
    </ProfileSectionCard>
  );
};
