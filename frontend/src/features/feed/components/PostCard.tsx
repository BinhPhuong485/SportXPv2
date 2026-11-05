import React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  CheckCircle2,
  MoreHorizontal,
  UserPlus,
  Trophy,
  Star,
} from 'lucide-react';
import { PostItem } from '../../../services/postService';
import { Avatar } from '../../../shared/components/Avatar';

interface PostCardProps {
  post: PostItem;
  isExpanded: boolean;
  onToggleExpand: (postId: string) => void;
  onToggleLike: (post: PostItem) => void;
  onOpenCommentDrawer: (post: PostItem) => void;
  onShowToast: (msg: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  isExpanded,
  onToggleExpand,
  onToggleLike,
  onOpenCommentDrawer,
  onShowToast,
}) => {
  const isReview = post.postType === 'court_review';
  const isRecap = post.postType === 'match_recap';
  const shouldTruncate = post.content.length > 180;

  return (
    <article className="bg-white dark:bg-app-surface rounded-xl p-3.5 sm:p-4 border border-app-border/80 flex flex-col gap-3 shadow-2xs hover:border-emerald-500/30 transition-all overflow-hidden">
      {/* LinkedIn Author Header */}
      <div className="flex items-start justify-between gap-2.5 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Avatar
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            size="md"
            className="w-10 h-10 sm:w-11 sm:h-11 shadow-2xs"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-black text-app-text truncate">
                {post.author.displayName}
              </span>
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] text-app-muted font-medium shrink-0">
                · 1st
              </span>
            </div>
            <span className="text-[11px] text-app-muted truncate font-medium">
              {post.author.tierName || 'VĐV Phong trào · 820 Elo'}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-app-muted/80">
              <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
              <span>·</span>
              <span>🌐</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onShowToast(`Đã theo dõi ${post.author.displayName}!`)}
            className="h-6.5 sm:h-7 px-2.5 sm:px-3 rounded-full border border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1"
          >
            <UserPlus size={11} />
            <span className="hidden sm:inline">Theo dõi</span>
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              onShowToast('Đã sao chép liên kết!');
            }}
            className="text-app-muted hover:text-app-text p-1 sm:p-1.5 rounded-full hover:bg-app-background/60"
            title="Tùy chọn"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="text-[13px] text-app-text leading-relaxed whitespace-pre-line font-normal break-words overflow-hidden">
        {isExpanded || !shouldTruncate
          ? post.content
          : `${post.content.slice(0, 180)}…`}
        {shouldTruncate && !isExpanded && (
          <button
            type="button"
            onClick={() => onToggleExpand(post.id)}
            className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 hover:underline text-xs inline-block"
          >
            ...Xem thêm
          </button>
        )}
      </div>

      {/* Embedded Activity Box: Match Recap or Court Review */}
      {isRecap && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-app-background border border-app-border/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
              <Trophy size={17} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-app-text truncate">
                Thắng set đấu [21-19 | 21-17]
              </span>
              <span className="text-[11px] text-app-muted truncate">
                {post.roomTitle || 'Kèo đôi nam giao lưu Sân Kỳ Hòa'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              ▲ +18 Elo
            </span>
            <span className="text-[9px] text-app-muted font-medium">điểm xếp hạng</span>
          </div>
        </div>
      )}

      {/* UI/UX Refined Court Review Rating Box */}
      {isReview && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-app-background border border-app-border/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <Star size={17} className="fill-amber-400 text-amber-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-app-text truncate">
                {post.courtName || 'Sân Đào Duy Anh'}
              </span>
              <span className="text-[11px] text-app-muted truncate">
                {post.courtAddress || '#SânThảm #QuậnPhúNhuận'}
              </span>
            </div>
          </div>
          {/* Polished High-Contrast Rating Badge */}
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-slate-900 dark:text-white">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-xs font-black tabular-nums">{post.rating || 5}.0</span>
              <span className="text-[10px] text-app-muted font-medium">/ 5.0</span>
            </div>
            <span className="text-[9px] text-app-muted font-medium mt-0.5">chất lượng sân</span>
          </div>
        </div>
      )}

      {/* Media Preview if attached */}
      {post.mediaUrls.length > 0 && (
        <div className="rounded-lg overflow-hidden border border-app-border mt-0.5">
          <img
            src={post.mediaUrls[0]}
            alt="Ảnh bài đăng"
            className="w-full h-48 sm:h-60 object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* LinkedIn Engagement Stats Row */}
      <div className="pt-2 flex items-center justify-between text-[11px] text-app-muted border-b border-app-border/60 pb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px]">
            👍
          </div>
          <span>{post.likesCount} người thích</span>
        </div>
        <span>{post.commentsCount} bình luận</span>
      </div>

      {/* LinkedIn 4-Action Bottom Bar (Like, Comment, Repost, Save) */}
      <div className="flex items-center justify-between text-xs text-app-muted font-bold">
        <button
          type="button"
          onClick={() => onToggleLike(post)}
          className={`flex-1 py-1.5 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 transition-colors ${
            post.isLiked ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'hover:text-app-text'
          }`}
        >
          <Heart size={15} className={post.isLiked ? 'fill-emerald-600 text-emerald-600' : ''} />
          <span>Thích</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenCommentDrawer(post)}
          className="flex-1 py-1.5 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 hover:text-app-text transition-colors"
        >
          <MessageCircle size={15} />
          <span>Bình luận</span>
        </button>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            onShowToast('Đã sao chép liên kết!');
          }}
          className="flex-1 py-1.5 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 hover:text-app-text transition-colors"
        >
          <Share2 size={15} />
          <span>Chia sẻ</span>
        </button>

        <button
          type="button"
          onClick={() => onShowToast('Đã lưu bài viết!')}
          className="flex-1 py-1.5 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 hover:text-app-text transition-colors"
        >
          <Bookmark size={15} />
          <span>Lưu</span>
        </button>
      </div>
    </article>
  );
};

