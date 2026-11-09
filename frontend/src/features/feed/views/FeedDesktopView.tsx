import React from 'react';
import {
  Image as ImageIcon,
  Star,
  Swords,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { FeedViewProps } from '../types';
import { PostCard } from '../components/PostCard';
import { PostSkeleton } from '../components/PostSkeleton';
import { UrgentRoomCard } from '../components/UrgentRoomCard';
import { Avatar } from '../../../shared/components/Avatar';

export const FeedDesktopView: React.FC<FeedViewProps> = ({
  posts,
  filteredPosts,
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
  urgentRoom,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4.5 select-none pb-14 px-3 sm:px-6">
      {/* 1. TOP TELEMETRY STATUS TICKER */}
      <div className="w-full bg-white dark:bg-app-surface border border-app-border rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE SERVERS
          </span>
          <span className="text-app-text font-semibold text-xs">
            Khu vực: TP. Hồ Chí Minh & TP. Thủ Đức
          </span>
          <span className="text-app-muted/60 hidden sm:inline">•</span>
          <span className="hidden sm:inline text-app-muted font-medium">
            142 Trận đang diễn ra
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-app-text font-medium text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">894</span> VĐV trực tuyến
          </span>
          <button
            type="button"
            onClick={() => onShowToast('Hệ thống thông báo: 3 lịch thi đấu mới trong tuần!')}
            className="flex items-center gap-1.5 text-app-text hover:text-emerald-600 transition-colors cursor-pointer bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-app-border px-3 py-1.5 rounded-xl font-semibold text-xs shadow-2xs active:scale-95"
          >
            <Bell size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Thông báo (3 mới)</span>
          </button>
        </div>
      </div>

      {/* 2. FACEBOOK-STYLE POST COMPOSER BOX */}
      <div className="bg-white dark:bg-app-surface border border-app-border rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col gap-3.5">
        <div className="flex items-center gap-3.5">
          <Avatar
            src={profile?.avatarUrl}
            alt={profile?.displayName}
            size="md"
            className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/20 shadow-2xs"
          />
          <div
            onClick={() => onOpenCreateModal('general')}
            className="flex-1 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-app-muted hover:text-app-text px-4 py-2.5 rounded-full cursor-pointer transition-all text-xs sm:text-sm font-medium shadow-2xs"
          >
            Bạn vừa có trận đấu, review sân hay chia sẻ gì hôm nay?...
          </div>
        </div>

        {/* Quick Action Button Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-app-border/70 text-xs sm:text-sm">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => onOpenCreateModal('general')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold active:scale-95 cursor-pointer"
            >
              <ImageIcon size={18} className="text-sky-500" />
              <span>Ảnh / Video</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateModal('match_recap')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold active:scale-95 cursor-pointer"
            >
              <Swords size={18} className="text-emerald-600" />
              <span>Ghi nhận tỷ số</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateModal('court_review')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold active:scale-95 cursor-pointer"
            >
              <Star size={18} className="text-amber-500 fill-amber-400" />
              <span>Review sân</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenCreateModal('general')}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            Đăng tin
          </button>
        </div>
      </div>

      {/* 3. SUBHEADER FILTER TABS */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Tất cả hoạt động' },
            { key: 'match_recap', label: 'Nhật ký trận' },
            { key: 'court_review', label: 'Review sân' },
            { key: 'general', label: 'Cộng đồng' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'bg-white dark:bg-app-surface text-app-muted hover:text-app-text border border-app-border'
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
          className="p-2 rounded-xl hover:bg-white dark:hover:bg-app-surface text-app-muted hover:text-app-text transition-colors border border-transparent hover:border-app-border cursor-pointer shadow-2xs"
          title="Làm mới bảng tin"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
        </button>
      </div>

      {/* 4. FEATURED URGENT MATCHMAKING BROADCAST (Atomic Organism) */}
      {(activeTab === 'all' || activeTab === 'general') && (
        <UrgentRoomCard urgentRoom={urgentRoom} />
      )}

      {/* 5. STREAM OF POST CARDS */}
      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-app-surface rounded-2xl p-10 border border-app-border text-center text-xs sm:text-sm text-app-muted flex flex-col items-center justify-center gap-2.5 shadow-2xs">
            <span className="text-3xl">🏸</span>
            <span className="font-bold text-base text-app-text">Chưa có bài viết nào trong mục này</span>
            <span className="text-xs text-app-muted">Hãy là người đầu tiên chia sẻ nhật ký trận đấu hoặc review sân nhé!</span>
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

      {/* 6. COMPACT BOTTOM FOOTER */}
      <div className="pt-6 flex flex-wrap gap-x-4 gap-y-1.5 justify-center text-xs text-app-muted">
        <a href="#" className="hover:text-emerald-600 hover:underline">Về SportXP</a>
        <span>•</span>
        <a href="#" className="hover:text-emerald-600 hover:underline">Trợ giúp</a>
        <span>•</span>
        <a href="#" className="hover:text-emerald-600 hover:underline">Điều khoản</a>
        <span>•</span>
        <a href="#" className="hover:text-emerald-600 hover:underline">Quyền riêng tư</a>
        <span className="w-full text-center text-[11px] text-app-muted/60 mt-1 font-mono">SportXP Corporation © 2026</span>
      </div>
    </div>
  );
};
