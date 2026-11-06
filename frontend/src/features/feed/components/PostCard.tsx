import React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  CheckCircle2,
  MoreHorizontal,
  UserPlus,
  Star,
  Swords,
  Zap,
  MapPin,
  Flame,
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
    <article className="bg-white dark:bg-app-surface rounded-xl p-4 sm:p-5 border border-app-border/80 flex flex-col gap-3.5 shadow-2xs hover:border-emerald-500/30 transition-all overflow-hidden">
      {/* Author Header */}
      <div className="flex items-start justify-between gap-2.5 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <Avatar
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            size="md"
            className="w-10 h-10 sm:w-11 sm:h-11 shadow-2xs ring-1 ring-app-border"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-bold text-app-text truncate">
                {post.author.displayName}
              </span>
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span className="text-[11px] text-app-muted font-medium shrink-0">
                · 1st
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-app-muted truncate font-medium">
              <span className="truncate">{post.author.tierName || 'CLB Cầu Lông Kỳ Hòa'}</span>
              <span>•</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                850 Elo
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-app-muted/80 mt-0.5">
              <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
              <span>•</span>
              <span>🌐 Công khai</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onShowToast(`Đã theo dõi ${post.author.displayName}!`)}
            className="h-7 px-3 rounded-full border border-emerald-600/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold transition-all flex items-center gap-1"
          >
            <UserPlus size={12} />
            <span className="hidden sm:inline">Theo dõi</span>
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              onShowToast('Đã sao chép liên kết bài viết!');
            }}
            className="text-app-muted hover:text-app-text p-1.5 rounded-full hover:bg-app-background/60 transition-colors"
            title="Tùy chọn"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Post Text Body */}
      <div className="text-[13px] sm:text-sm text-app-text leading-relaxed whitespace-pre-line font-normal break-words overflow-hidden">
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

      {/* Strava/Esports Match Scorecard Bento Container */}
      {isRecap && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-bold shadow-2xs uppercase">
                {post.roomTitle?.includes('Đơn') ? 'KẾT QUẢ ĐƠN' : 'KẾT QUẢ ĐÔI NAM'}
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin size={12} className="text-emerald-500" />
                <span>SÂN KỲ HÒA • QUẬN 10</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>ĐÃ XÁC NHẬN ELO</span>
            </span>
          </div>

          {/* Scoreboard Grid: Winner vs Opponent */}
          <div className="grid grid-cols-7 items-center bg-white dark:bg-app-surface border border-slate-200/80 dark:border-slate-800 rounded-lg p-2.5 sm:p-3 text-center shadow-2xs">
            <div className="col-span-3 text-left flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-app-text truncate">
                  {post.author.displayName}
                </div>
                <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
                  WINNER (+18 ELO)
                </div>
              </div>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] text-app-muted font-bold">SET 1</span>
              <span className="font-mono text-sm sm:text-base text-app-text font-black">21 - 19</span>
            </div>

            <div className="col-span-3 text-right flex items-center justify-end gap-2 min-w-0">
              <div className="min-w-0">
                <div className="font-medium text-xs sm:text-sm text-app-muted truncate">
                  Tuấn Vũ
                </div>
                <div className="font-mono text-[10px] text-app-muted font-medium truncate">
                  840 Elo (-18)
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0"></span>
            </div>
          </div>

          {/* Match Analytics & Highlights row */}
          <div className="grid grid-cols-7 items-center bg-white dark:bg-app-surface border border-slate-200/80 dark:border-slate-800 rounded-lg p-2.5 sm:p-3 text-center shadow-2xs">
            <div className="col-span-3 text-left flex items-center gap-1.5 min-w-0">
              <Zap size={13} className="text-amber-500 shrink-0" />
              <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold truncate">
                Cú smash: 326 km/h
              </span>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] text-app-muted font-bold">SET 2</span>
              <span className="font-mono text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-black">21 - 17</span>
            </div>

            <div className="col-span-3 text-right">
              <button
                type="button"
                onClick={() => onShowToast('Đã gửi lời mời thách đấu phục thù tới đối thủ!')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all active:scale-95"
              >
                <Swords size={12} />
                <span>Thách đấu lại</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Court Review Rating Box */}
      {isReview && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <Star size={18} className="fill-amber-400 text-amber-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-app-text truncate">
                {post.courtName || 'Sân Cầu Lông Đào Duy Anh'}
              </span>
              <span className="text-[11px] text-app-muted truncate flex items-center gap-1">
                <MapPin size={11} className="text-emerald-500 shrink-0" />
                <span>{post.courtAddress || 'Phú Nhuận, TP.HCM • Sân thảm cao cấp'}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-slate-900 dark:text-white">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-xs font-black tabular-nums">{post.rating || 5}.0</span>
              <span className="text-[10px] text-app-muted font-medium">/ 5.0</span>
            </div>
            <span className="text-[10px] text-app-muted font-medium mt-0.5">chất lượng sân</span>
          </div>
        </div>
      )}

      {/* Media Preview if attached */}
      {post.mediaUrls.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-app-border mt-0.5">
          <img
            src={post.mediaUrls[0]}
            alt="Ảnh bài đăng"
            className="w-full h-52 sm:h-64 object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Engagement Stats Row */}
      <div className="pt-2 flex items-center justify-between text-[11px] text-app-muted border-b border-app-border/60 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] shadow-2xs">
            👍
          </div>
          <span className="font-medium">{post.likesCount} người thích</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{post.commentsCount} bình luận</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <Flame size={12} />
            <span>Nổi bật</span>
          </span>
        </div>
      </div>

      {/* 4-Action Bottom Bar (Like, Comment, Share, Save) */}
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
          onClick={() => onShowToast('Đã lưu bài viết vào mục đã lưu!')}
          className="flex-1 py-1.5 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 hover:text-app-text transition-colors"
        >
          <Bookmark size={15} />
          <span>Lưu</span>
        </button>
      </div>
    </article>
  );
};
