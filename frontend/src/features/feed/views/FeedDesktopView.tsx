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
}) => {
  return (
    <div className="w-full max-w-[760px] mx-auto flex flex-col gap-3 sm:gap-3.5 select-none pb-12 px-3 sm:px-4">
      {/* 1. COMPACT TOP TELEMETRY STATUS TICKER */}
      <div className="w-full bg-white dark:bg-app-surface border border-app-border rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE
          </span>
          <span className="text-app-text font-semibold text-xs truncate">
            TP.HCM & TP. Thủ Đức
          </span>
          <span className="text-app-muted/50 hidden sm:inline">•</span>
          <span className="text-app-muted hidden sm:inline text-xs font-medium">
            142 Trận đang diễn ra
          </span>
          <span className="text-app-muted/50 hidden md:inline">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold hidden md:inline text-xs font-mono">
            894 VĐV online
          </span>
        </div>

        <button
          type="button"
          onClick={() => onShowToast('Hệ thống thông báo: 3 lịch thi đấu mới trong tuần!')}
          className="flex items-center gap-1.5 text-app-muted hover:text-emerald-600 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-app-border/80 px-2.5 py-1 rounded-lg font-semibold text-xs shrink-0 active:scale-95"
        >
          <Bell size={12} className="text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">3 thông báo mới</span>
        </button>
      </div>

      {/* 2. REFINED POST COMPOSER BOX */}
      <div className="bg-white dark:bg-app-surface border border-app-border rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={profile?.avatarUrl}
            alt={profile?.displayName}
            size="md"
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-app-border shadow-2xs"
          />
          <div
            onClick={() => onOpenCreateModal('general')}
            className="flex-1 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 text-app-muted hover:text-app-text px-4 py-2.5 rounded-full cursor-pointer transition-all text-xs sm:text-sm font-medium shadow-2xs truncate"
          >
            Bạn vừa có trận đấu, review sân hay chia sẻ gì hôm nay?...
          </div>
        </div>

        {/* Quick Action Button Strip */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-app-border/70 text-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => onOpenCreateModal('general')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold active:scale-95 cursor-pointer"
            >
              <ImageIcon size={15} className="text-sky-500" />
              <span>Ảnh / Video</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateModal('match_recap')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold active:scale-95 cursor-pointer"
            >
              <Swords size={15} className="text-emerald-600" />
              <span>Ghi tỷ số</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateModal('court_review')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold active:scale-95 cursor-pointer"
            >
              <Star size={15} className="text-amber-500 fill-amber-400" />
              <span>Review sân</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenCreateModal('general')}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            Đăng tin
          </button>
        </div>
      </div>

      {/* 3. SUBHEADER FILTER TABS */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 flex-wrap">
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
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
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-app-surface text-app-muted hover:text-app-text transition-colors border border-transparent hover:border-app-border cursor-pointer shadow-2xs"
          title="Làm mới bảng tin"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
        </button>
      </div>

      {/* 4. STREAM OF POST CARDS */}
      <div className="space-y-3 sm:space-y-3.5">
        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-app-surface rounded-xl p-8 border border-app-border text-center text-xs text-app-muted flex flex-col items-center justify-center gap-2 shadow-2xs">
            <span className="text-3xl">🏸</span>
            <span className="font-bold text-sm text-app-text">Chưa có bài viết nào trong mục này</span>
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
      <div className="pt-4 flex flex-wrap gap-x-3 gap-y-1 justify-center text-[11px] text-app-muted">
        <a href="#" className="hover:text-emerald-600 hover:underline">Về SportXP</a>
        <span>•</span>
        <a href="#" className="hover:text-emerald-600 hover:underline">Trợ giúp</a>
        <span>•</span>
        <a href="#" className="hover:text-emerald-600 hover:underline">Điều khoản</a>
        <span>•</span>
        <a href="#" className="hover:text-emerald-600 hover:underline">Quyền riêng tư</a>
        <span className="w-full text-center text-[10px] text-app-muted/60 mt-1 font-mono">SportXP Corporation © 2026</span>
      </div>
    </div>
  );
};
