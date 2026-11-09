import React from 'react';
import {
  Video,
  Image as ImageIcon,
  Trophy,
  Star,
  RefreshCw,
} from 'lucide-react';
import { FeedViewProps } from '../types';
import { PostCard } from '../components/PostCard';
import { PostSkeleton } from '../components/PostSkeleton';
import { Avatar } from '../../../shared/components/Avatar';

export const FeedTabletView: React.FC<FeedViewProps> = ({
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
    <div className="w-full max-w-[720px] md:max-w-[760px] lg:max-w-[820px] mx-auto flex flex-col gap-4 pb-12 select-none px-2 sm:px-4">
      {/* 1. Tablet Post Composer Card (Expanded & Touch-Optimized) */}
      <div className="bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 p-4 shadow-2xs flex flex-col gap-3">
        {/* Top row: Avatar + Pill input trigger */}
        <div className="flex items-center gap-3">
          <Avatar
            src={profile?.avatarUrl}
            alt={profile?.displayName}
            size="md"
            className="w-11 h-11 shadow-2xs shrink-0"
          />
          <div
            onClick={() => onOpenCreateModal('general')}
            className="flex-1 h-11 px-4 rounded-full border border-app-border hover:bg-app-background/70 text-xs sm:text-sm font-medium text-app-muted flex items-center cursor-pointer transition-all shadow-2xs truncate"
          >
            <span>Hôm nay bạn vừa hoàn thành trận đấu hay có review sân nào?</span>
          </div>
        </div>

        {/* Bottom row: Touch-friendly action buttons */}
        <div className="flex items-center justify-around pt-2 border-t border-app-border/60 text-xs sm:text-sm font-bold text-app-muted">
          <button
            type="button"
            onClick={() => onOpenCreateModal('general')}
            className="py-1.5 px-3 rounded-lg flex items-center gap-2 hover:bg-app-background/60 transition-colors text-emerald-600 dark:text-emerald-400 active:scale-95"
          >
            <Video size={18} />
            <span>Video</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCreateModal('general')}
            className="py-1.5 px-3 rounded-lg flex items-center gap-2 hover:bg-app-background/60 transition-colors text-sky-500 active:scale-95"
          >
            <ImageIcon size={18} />
            <span>Ảnh</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCreateModal('match_recap')}
            className="py-1.5 px-3 rounded-lg flex items-center gap-2 hover:bg-app-background/60 transition-colors text-amber-500 active:scale-95"
          >
            <Trophy size={18} />
            <span>Nhật ký</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCreateModal('court_review')}
            className="py-1.5 px-3 rounded-lg flex items-center gap-2 hover:bg-app-background/60 transition-colors text-amber-500 active:scale-95"
          >
            <Star size={18} className="fill-amber-400 text-amber-400" />
            <span>Review sân</span>
          </button>
        </div>
      </div>

      {/* 2. Subheader Filter Tabs & Refresh Bar */}
      <div className="flex items-center justify-between gap-2 py-0.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
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
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
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
          className="p-2 rounded-xl bg-white dark:bg-app-surface text-app-muted hover:text-app-text border border-app-border/80 shrink-0 hover:bg-app-background/60 transition-colors shadow-2xs active:scale-95"
          title="Làm mới bảng tin"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
        </button>
      </div>

      {/* 5. Posts Stream (Reusing Atomic PostCard Component) */}
      <div className="flex flex-col gap-3.5">
        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-app-surface rounded-2xl p-8 border border-app-border text-center text-xs sm:text-sm text-app-muted flex flex-col items-center justify-center gap-2 shadow-2xs">
            <span className="text-3xl">🏸</span>
            <span className="font-bold text-app-text">Chưa có bài viết nào trong mục này</span>
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
  );
};

