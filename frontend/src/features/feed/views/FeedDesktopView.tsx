import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Image as ImageIcon,
  Trophy,
  Star,
  RefreshCw,
  CheckCircle2,
  Bookmark,
  MapPin,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { FeedViewProps } from '../types';
import { PostCard } from '../components/PostCard';
import { PostSkeleton } from '../components/PostSkeleton';
import { Avatar } from '../../../shared/components/Avatar';

export const FeedDesktopView: React.FC<FeedViewProps> = ({
  posts,
  filteredPosts,
  upcomingEvents,
  activeTab,
  setActiveTab,
  loading,
  profile,
  expandedPostIds,
  onToggleExpand,
  onToggleLike,
  onOpenCommentDrawer,
  onOpenCreateModal,
  onRefreshFeed,
  onShowToast,
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-7xl flex flex-row gap-5 items-start justify-center select-none">
      {/* ========================================================= */}
      {/* COLUMN 1: LEFT USER PROFILE & SHORTCUTS (LinkedIn Left Rail) */}
      {/* ========================================================= */}
      <aside className="w-56 xl:w-60 shrink-0 flex flex-col gap-3.5 sticky top-18 select-none">
        {/* Card 1: User Profile Summary Card */}
        <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 shadow-2xs overflow-hidden flex flex-col">
          {/* Cover Banner */}
          <div className="h-14 w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 relative" />

          {/* Avatar overlapping banner (Default silhouette graphic) */}
          <div className="relative flex justify-center -mt-8">
            <div
              onClick={() => navigate('/profile')}
              className="cursor-pointer shadow-xs rounded-full"
            >
              <Avatar
                src={profile?.avatarUrl}
                alt={profile?.displayName}
                size="xl"
                className="w-16 h-16 border-2 border-white dark:border-app-surface shadow-xs"
              />
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 pt-2 pb-3 flex flex-col items-center text-center">
            <div
              onClick={() => navigate('/profile')}
              className="font-black text-sm text-app-text hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{profile?.displayName || 'Hoàng Minh'}</span>
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            </div>
            <span className="text-[11px] text-app-muted mt-0.5 font-medium leading-tight line-clamp-2">
              VĐV Cầu Lông Phong Trào | Tier {profile?.tierName || 'Trung bình'}
            </span>
            <span className="text-[10px] text-app-muted/80 mt-1 font-medium">
              CLB Cầu Lông TP.HCM
            </span>
          </div>

          {/* Stats Dividers & Rows */}
          <div className="border-t border-app-border/70 py-2 flex flex-col text-xs">
            <div
              onClick={() => navigate('/profile')}
              className="px-4 py-1.5 flex items-center justify-between hover:bg-app-background/60 cursor-pointer transition-colors"
            >
              <span className="text-app-muted font-medium text-[11px]">Trận đã đấu</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">24</span>
            </div>
            <div
              onClick={() => navigate('/rankings')}
              className="px-4 py-1.5 flex items-center justify-between hover:bg-app-background/60 cursor-pointer transition-colors"
            >
              <span className="text-app-muted font-medium text-[11px]">Điểm Elo</span>
              <span className="font-black text-app-text tabular-nums">{profile?.eloRating || 820}</span>
            </div>
            <div
              onClick={() => navigate('/profile')}
              className="px-4 py-1.5 flex items-center justify-between hover:bg-app-background/60 cursor-pointer transition-colors"
            >
              <span className="text-app-muted font-medium text-[11px]">Tỉ lệ thắng</span>
              <span className="font-black text-app-text tabular-nums">68%</span>
            </div>
          </div>

          {/* Saved Items Link */}
          <div className="border-t border-app-border/70 px-4 py-2.5 hover:bg-app-background/60 cursor-pointer transition-colors flex items-center gap-2 text-xs font-bold text-app-muted hover:text-app-text">
            <Bookmark size={14} />
            <span>Mục đã lưu</span>
          </div>
        </div>

        {/* Card 2: Sân Quen & Nhóm Thể Thao */}
        <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-3.5 shadow-2xs flex flex-col gap-2.5">
          <span className="text-xs font-black text-app-text">Sân quen & Nhóm</span>
          <div className="flex flex-col gap-1.5 text-xs">
            <div
              onClick={() => navigate('/rooms')}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-app-background/60 cursor-pointer text-app-muted hover:text-emerald-600 transition-colors"
            >
              <MapPin size={13} className="text-emerald-500 shrink-0" />
              <span className="font-medium truncate">#SanKyHoa (Quận 10)</span>
            </div>
            <div
              onClick={() => navigate('/rooms')}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-app-background/60 cursor-pointer text-app-muted hover:text-emerald-600 transition-colors"
            >
              <MapPin size={13} className="text-emerald-500 shrink-0" />
              <span className="font-medium truncate">#SanViettel (Tân Bình)</span>
            </div>
            <div
              onClick={() => navigate('/rooms')}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-app-background/60 cursor-pointer text-app-muted hover:text-emerald-600 transition-colors"
            >
              <Users size={13} className="text-emerald-500 shrink-0" />
              <span className="font-medium truncate">CLB Cầu Lông Sài Gòn</span>
            </div>
          </div>
          <div
            onClick={() => navigate('/rooms')}
            className="pt-2 border-t border-app-border/70 text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer text-center"
          >
            Khám phá thêm →
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* COLUMN 2: CENTER FEED STREAM (LinkedIn Center Stream)       */}
      {/* ========================================================= */}
      <div className="flex-1 max-w-[620px] xl:max-w-[640px] flex flex-col gap-3.5 min-w-0">
        {/* 1. LINKEDIN-STYLE POST COMPOSER CARD */}
        <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-3.5 shadow-2xs flex flex-col gap-3">
          {/* Top row: Avatar + Pill Input Trigger */}
          <div className="flex items-center gap-2.5">
            <Avatar
              src={profile?.avatarUrl}
              alt={profile?.displayName}
              size="md"
              className="w-10 h-10 shadow-2xs"
            />
            <div
              onClick={() => onOpenCreateModal('general')}
              className="flex-1 h-10 px-4 rounded-full border border-app-border hover:bg-app-background/70 text-xs font-semibold text-app-muted hover:text-app-text flex items-center cursor-pointer transition-all shadow-2xs"
            >
              <span>Hôm nay bạn vừa hoàn thành trận đấu hay có review sân nào?</span>
            </div>
          </div>

          {/* Bottom row: Colorful action buttons matching LinkedIn */}
          <div className="flex items-center justify-between pt-1 border-t border-app-border/60 text-xs font-bold text-app-muted">
            <button
              type="button"
              onClick={() => onOpenCreateModal('general')}
              className="flex-1 py-2 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 transition-colors text-emerald-600 dark:text-emerald-400"
            >
              <Video size={16} />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateModal('general')}
              className="flex-1 py-2 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 transition-colors text-sky-500"
            >
              <ImageIcon size={16} />
              <span>Ảnh</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateModal('match_recap')}
              className="flex-1 py-2 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 transition-colors text-amber-500"
            >
              <Trophy size={16} />
              <span>Nhật ký</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateModal('court_review')}
              className="flex-1 py-2 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 transition-colors text-amber-500"
            >
              <Star size={16} className="fill-amber-400 text-amber-400" />
              <span>Review sân</span>
            </button>
          </div>
        </div>

        {/* 2. SUBHEADER FILTER & SORT BAR */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'match_recap', label: 'Nhật ký trận' },
              { key: 'court_review', label: 'Review sân' },
              { key: 'general', label: 'Cộng đồng' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'bg-white dark:bg-app-surface text-app-muted hover:text-app-text border border-app-border/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefreshFeed}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-app-surface text-app-muted hover:text-app-text transition-colors border border-transparent hover:border-app-border"
            title="Làm mới bảng tin"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
          </button>
        </div>

        {/* 3. POSTS TIMELINE STREAM */}
        <div className="flex flex-col gap-3.5">
          {loading && posts.length === 0 ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-app-surface rounded-xl p-8 border border-app-border text-center text-xs text-app-muted flex flex-col items-center justify-center gap-2 shadow-2xs">
              <span className="text-2xl">🏸</span>
              <span className="font-bold text-app-text">Chưa có bài viết nào trong mục này</span>
              <span className="text-[11px] text-app-muted">Hãy là người đầu tiên chia sẻ nhật ký trận đấu hoặc review sân nhé!</span>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isExpanded={expandedPostIds.has(post.id)}
                onToggleExpand={onToggleExpand}
                onToggleLike={onToggleLike}
                onOpenCommentDrawer={onOpenCommentDrawer}
                onShowToast={onShowToast}
              />
            ))
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* COLUMN 3: RIGHT WIDGETS (LinkedIn Right Rail)              */}
      {/* ========================================================= */}
      <aside className="w-72 xl:w-80 shrink-0 flex flex-col gap-3.5 sticky top-18 select-none">
        {/* Card 1: Kèo Đấu Nổi Bật (LinkedIn Today's News / Puzzles Style) */}
        <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-app-text flex items-center gap-1.5">
              <Award size={15} className="text-emerald-600" />
              <span>Kèo Đấu Nổi Bật</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
              HOT
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-black text-app-text leading-snug">
              {upcomingEvents.length > 0 ? upcomingEvents[0].title : 'Kèo Đôi Nam Phong Trào Tối Nay'}
            </h4>
            <span className="text-[11px] text-app-muted font-medium">
              {upcomingEvents.length > 0
                ? `${new Date(upcomingEvents[0].startsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${upcomingEvents[0].subtitle || 'Sân Kỳ Hòa'}`
                : '19:30, Tối nay · Sân Kỳ Hòa, Quận 10'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold py-1 border-y border-app-border/60">
            <span className="text-app-muted">Trạng thái phòng đấu</span>
            <span className="text-emerald-600 font-black">4/4 Slots</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (upcomingEvents.length > 0 && upcomingEvents[0].rawRoom) {
                navigate(`/rooms/${upcomingEvents[0].rawRoom.id}`);
              } else {
                navigate('/rooms');
              }
            }}
            className="w-full py-2 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
          >
            <span>Xem chi tiết phòng đấu</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Card 2: Gợi Ý Kết Nối Bạn Chơi */}
        <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-4 shadow-2xs flex flex-col gap-3">
          <span className="text-xs font-black text-app-text flex items-center gap-1.5">
            <Users size={15} className="text-emerald-600" />
            <span>Gợi ý kết nối bạn chơi</span>
          </span>

          <div className="flex flex-col gap-2.5">
            {[
              { name: 'Trần Tuấn Kiệt', tier: 'Tier Khá · 950 Elo' },
              { name: 'Nguyễn Hải Đăng', tier: 'Tier TB · 840 Elo' },
              { name: 'Lê Thảo My', tier: 'Tier TBK · 890 Elo' },
            ].map((player, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar size="sm" className="w-8 h-8 shadow-2xs" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-app-text truncate">{player.name}</span>
                    <span className="text-[10px] text-app-muted truncate">{player.tier}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onShowToast(`Đã gửi lời mời tới ${player.name}!`)}
                  className="h-6.5 px-2.5 rounded-full border border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-bold transition-all shrink-0 flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>Kết nối</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Top Sân Cầu Hot Hôm Nay */}
        <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-4 shadow-2xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-app-text flex items-center gap-1.5">
              <TrendingUp size={15} className="text-emerald-600" />
              <span>Sân Cầu Hot Hôm Nay</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="text-[11px] font-bold text-emerald-600 hover:underline"
            >
              Tất cả →
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              { rank: 1, name: 'Sân Kỳ Hòa', district: 'Quận 10', rating: '4.9' },
              { rank: 2, name: 'Sân Viettel', district: 'Tân Bình', rating: '4.8' },
              { rank: 3, name: 'Sân Đào Duy Anh', district: 'Phú Nhuận', rating: '4.8' },
              { rank: 4, name: 'Sân Hải Yến', district: 'Bình Thạnh', rating: '4.7' },
            ].map((court) => (
              <div
                key={court.rank}
                onClick={() => navigate('/rooms')}
                className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-app-background/60 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-4.5 text-[11px] font-black text-app-muted tabular-nums">
                    {court.rank}.
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-app-text group-hover:text-emerald-600 transition-colors truncate">
                      {court.name}
                    </span>
                    <span className="text-[10px] text-app-muted truncate">{court.district}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-zinc-100 shrink-0">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  <span className="text-[11px] font-black tabular-nums">{court.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compact LinkedIn Footer Links */}
        <div className="px-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-app-muted/80 justify-center text-center">
          <a href="#" className="hover:text-emerald-600 hover:underline">Về SportXP</a>
          <a href="#" className="hover:text-emerald-600 hover:underline">Trợ giúp</a>
          <a href="#" className="hover:text-emerald-600 hover:underline">Điều khoản</a>
          <a href="#" className="hover:text-emerald-600 hover:underline">Quyền riêng tư</a>
          <span className="w-full text-[10px] text-app-muted/60 mt-1">SportXP Corporation © 2026</span>
        </div>
      </aside>
    </div>
  );
};

