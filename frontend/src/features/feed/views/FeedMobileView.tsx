import React from 'react';
import {
  Image as ImageIcon,
  Trophy,
  Star,
  RefreshCw,
} from 'lucide-react';
import { FeedViewProps } from '../types';
import { PostCard } from '../components/PostCard';
import { PostSkeleton } from '../components/PostSkeleton';
import { UpcomingRoomsStrip } from '../../calendar/presentation/widgets/UpcomingRoomsStrip';
import { Avatar } from '../../../shared/components/Avatar';

export const FeedMobileView: React.FC<FeedViewProps> = ({
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
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-3 pb-8 select-none">
      {/* 1. Mobile Upcoming Match Carousel Strip */}
      {upcomingEvents.length > 0 && (
        <div className="w-full">
          <UpcomingRoomsStrip events={upcomingEvents} />
        </div>
      )}

      {/* 2. Compact Touch-Friendly Post Composer (Mobile Optimized) */}
      <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-3 shadow-2xs flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar
            src={profile?.avatarUrl}
            alt={profile?.displayName}
            size="sm"
            className="w-9 h-9 shadow-2xs shrink-0"
          />
          <div
            onClick={() => onOpenCreateModal('general')}
            className="flex-1 h-9 px-3.5 rounded-full border border-app-border hover:bg-app-background/70 text-xs font-medium text-app-muted flex items-center cursor-pointer transition-all shadow-2xs truncate"
          >
            <span>Hôm nay bạn đánh cầu thế nào?</span>
          </div>
        </div>

        {/* Quick action buttons row for mobile */}
        <div className="flex items-center justify-around pt-1.5 border-t border-app-border/60 text-xs font-bold text-app-muted">
          <button
            type="button"
            onClick={() => onOpenCreateModal('general')}
            className="py-1 px-2 rounded-lg flex items-center gap-1.5 text-sky-500 active:scale-95 transition-transform"
          >
            <ImageIcon size={16} />
            <span>Ảnh</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCreateModal('match_recap')}
            className="py-1 px-2 rounded-lg flex items-center gap-1.5 text-amber-500 active:scale-95 transition-transform"
          >
            <Trophy size={16} />
            <span>Nhật ký</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCreateModal('court_review')}
            className="py-1 px-2 rounded-lg flex items-center gap-1.5 text-amber-500 active:scale-95 transition-transform"
          >
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span>Review sân</span>
          </button>
        </div>
      </div>

      {/* 3. Horizontal Scrollable Filter Tabs (Mobile Thumb-friendly) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 shrink-0">
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
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-white dark:bg-app-surface text-app-muted border border-app-border/80'
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
          className="p-1.5 rounded-lg bg-white dark:bg-app-surface text-app-muted border border-app-border/80 shrink-0"
          title="Làm mới"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-emerald-600' : ''} />
        </button>
      </div>

      {/* 4. Single-Column Posts Stream */}
      <div className="flex flex-col gap-3">
        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-app-surface rounded-xl p-6 border border-app-border text-center text-xs text-app-muted flex flex-col items-center justify-center gap-2 shadow-2xs">
            <span className="text-2xl">🏸</span>
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
