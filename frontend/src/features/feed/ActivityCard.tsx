import React, { useState } from 'react';
import {
  Heart,
  FileText,
  Share2,
  Lock,
  MoreHorizontal,
  Watch,
  Activity as ActivityIcon,
  Footprints,
  Dumbbell,
} from 'lucide-react';
import { ActivityAudience, ActivityView } from './domain/activity';
import { AthleticVisualGraphic } from './graphics/AthleticVisualGraphic';
import { ActivityShareSheet } from './widgets/ActivityShareSheet';
import { BentoCard } from '../../shared/components/BentoCard';

export interface ActivityCardProps {
  post: ActivityView;
  caption?: string;
  audience?: ActivityAudience;
  actions?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onLike?: () => void;
  onTapDetail?: () => void;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'XP';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return trimmed.substring(0, Math.min(2, trimmed.length)).toUpperCase();
}

function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '45m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  post,
  caption,
  audience,
  actions,
  onEdit,
  onDelete,
  onLike,
  onTapDetail,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const stats = post.totals;
  const currentAudience = audience ?? post.audience;
  const currentCaption = caption ?? post.caption;
  const isPersonal = post.kind === 'personal';
  const wins = stats.wins ?? 0;
  const losses = stats.losses ?? 0;
  const timeStr = formatTime(post.publishedAt || post.playedAt);
  const sportType = post.sportType;

  const formatKudosText = (): string => {
    const names = post.likedByNames;
    if (names.length === 0) {
      return post.likeCount > 0 ? `${post.likeCount} người đã thả kudos` : '';
    }
    if (names.length === 1) {
      return `${names[0]} đã thả kudos`;
    }
    if (names.length === 2) {
      return `${names[0]} và ${names[1]} đã thả kudos`;
    }
    const remaining = post.likeCount > names.length ? post.likeCount - 2 : names.length - 2;
    return `${names[0]}, ${names[1]} và ${remaining} người khác đã thả kudos`;
  };

  return (
    <BentoCard>
      <div className="flex flex-col gap-3">
        {/* 1. STRAVA HEADER: 2 lines */}
        <div className="flex items-center gap-3">
          {/* Avatar with dynamic theme border */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 font-black text-xs text-white shadow-xs"
            style={{
              background: isPersonal
                ? 'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-accent)) 100%)'
                : 'linear-gradient(135deg, rgb(var(--color-streak)) 0%, rgb(var(--color-court-dark)) 100%)',
              borderColor: isPersonal ? 'rgb(var(--color-primary))' : 'rgb(var(--color-streak))',
            }}
          >
            {getInitials(post.authorName)}
          </div>

          {/* Name & Subtitle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-extrabold text-app-text truncate">
                {post.authorName}
              </span>
              {post.isOwner && (
                <span className="px-1.5 py-0.5 rounded bg-app-primary/15 text-[10px] font-black text-app-primary uppercase tracking-wide">
                  Bạn
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-app-muted mt-0.5 truncate">
              {sportType === 'running' ? (
                <Footprints size={12} className="shrink-0" />
              ) : sportType === 'workout' ? (
                <Dumbbell size={12} className="shrink-0" />
              ) : (
                <ActivityIcon size={12} className="shrink-0" />
              )}
              <span className="font-semibold">
                {sportType === 'running'
                  ? 'Chạy bộ'
                  : sportType === 'workout'
                  ? 'Tập bổ trợ'
                  : 'Cầu lông'}
              </span>
              <span>·</span>
              <span>{timeStr}</span>
              {post.courtName && (
                <>
                  <span>·</span>
                  <span className="truncate">{post.courtName}</span>
                </>
              )}
            </div>
          </div>

          {/* Privacy badge / Options menu */}
          <div className="flex items-center gap-1 shrink-0">
            {currentAudience === 'onlyMe' && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-app-surface border border-app-border text-[10px] text-app-muted font-medium">
                <Lock size={10} />
                <span>Chỉ mình tôi</span>
              </div>
            )}

            {post.isOwner && (onEdit || onDelete) ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full text-app-muted hover:text-app-text transition-colors"
                  title="Tùy chọn"
                >
                  <MoreHorizontal size={18} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-app-surface border border-app-border py-1 shadow-xl flex flex-col text-xs font-semibold animate-fade-in">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowShareModal(true);
                        }}
                        className="px-3 py-2 text-left hover:bg-app-background flex items-center gap-2 text-app-text"
                      >
                        <Share2 size={14} />
                        <span>Chia sẻ thẻ ảnh</span>
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onEdit();
                          }}
                          className="px-3 py-2 text-left hover:bg-app-background flex items-center gap-2 text-app-text"
                        >
                          <FileText size={14} />
                          <span>Sửa caption</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onDelete();
                          }}
                          className="px-3 py-2 text-left hover:bg-app-background flex items-center gap-2 text-app-loss"
                        >
                          <span>Xóa bài</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowShareModal(true)}
                className="p-1.5 text-app-muted hover:text-app-text transition-colors"
                title="Chia sẻ hoạt động"
              >
                <Share2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* 2. ACTIVITY TITLE & CAPTION */}
        {post.title && (
          <h3 className="text-base font-extrabold text-app-text tracking-tight -mb-1">
            {post.title}
          </h3>
        )}

        {currentCaption && (
          <p className="text-sm font-medium text-app-text/90 leading-relaxed">
            &ldquo;{currentCaption}&rdquo;
          </p>
        )}

        {/* 3. ATHLETIC METRICS BOX */}
        <div className="px-3.5 py-2.5 rounded-xl bg-app-background border border-app-border/80 flex items-center justify-between">
          {sportType === 'running' ? (
            <>
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">QUÃNG ĐƯỜNG</div>
                <div className="text-base font-black text-app-primary tracking-tight mt-0.5">
                  {post.distanceKm ? post.distanceKm.toFixed(2) : '5.20'}{' '}
                  <span className="text-[10.5px] font-semibold text-app-muted">km</span>
                </div>
              </div>
              <div className="w-px h-6 bg-app-border/60" />
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">PACE TB</div>
                <div className="text-base font-black text-app-text tracking-tight mt-0.5">
                  {post.pace ?? '5:26'}{' '}
                  <span className="text-[10.5px] font-semibold text-app-muted">/km</span>
                </div>
              </div>
              <div className="w-px h-6 bg-app-border/60" />
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">THỜI GIAN</div>
                <div className="text-base font-black text-app-text tracking-tight mt-0.5">
                  {post.durationMinutes ?? 28}:15
                </div>
              </div>
              <div className="w-px h-6 bg-app-border/60" />
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">TIÊU HAO</div>
                <div className="text-base font-black text-app-text tracking-tight mt-0.5">
                  {post.calories ?? 365}{' '}
                  <span className="text-[10.5px] font-semibold text-app-muted">kcal</span>
                </div>
              </div>
            </>
          ) : sportType === 'workout' ? (
            <>
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">THỜI GIAN</div>
                <div className="text-base font-black text-app-text tracking-tight mt-0.5">
                  {post.durationMinutes ?? 45}{' '}
                  <span className="text-[10.5px] font-semibold text-app-muted">phút</span>
                </div>
              </div>
              <div className="w-px h-6 bg-app-border/60" />
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">TIÊU HAO</div>
                <div className="text-base font-black text-app-primary tracking-tight mt-0.5">
                  {post.calories ?? 410}{' '}
                  <span className="text-[10.5px] font-semibold text-app-muted">kcal</span>
                </div>
              </div>
              <div className="w-px h-6 bg-app-border/60" />
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">NHỊP TIM TB</div>
                <div className="text-base font-black text-app-text tracking-tight mt-0.5">
                  {post.avgHeartRate ?? 140}{' '}
                  <span className="text-[10.5px] font-semibold text-app-muted">bpm</span>
                </div>
              </div>
              <div className="w-px h-6 bg-app-border/60" />
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">CỰC ĐẠI</div>
                <div className="text-base font-black text-app-text tracking-tight mt-0.5">
                  {post.maxHeartRate ?? 165}{' '}
                  <span className="text-[10.5px] font-semibold text-app-muted">bpm</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">THỜI GIAN</div>
                <div className="text-base font-black text-app-text tracking-tight mt-0.5">
                  {formatDuration(post.durationMinutes)}
                </div>
              </div>
              <div className="w-px h-6 bg-app-border/60" />
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">TIÊU HAO</div>
                <div className="text-base font-black text-app-text tracking-tight mt-0.5">
                  {post.calories ?? 520}{' '}
                  <span className="text-[10.5px] font-semibold text-app-muted">kcal</span>
                </div>
              </div>
              <div className="w-px h-6 bg-app-border/60" />
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">NHỊP TIM TB</div>
                <div className="text-base font-black text-app-text tracking-tight mt-0.5">
                  {post.avgHeartRate ?? 146}{' '}
                  <span className="text-[10.5px] font-semibold text-app-muted">bpm</span>
                </div>
              </div>
              <div className="w-px h-6 bg-app-border/60" />
              <div>
                <div className="text-[9.5px] font-bold text-app-muted tracking-wider">
                  {isPersonal ? 'KẾT QUẢ' : 'TỔNG SET'}
                </div>
                <div
                  className={`text-base font-black tracking-tight mt-0.5 ${
                    isPersonal && wins >= losses && wins > 0 ? 'text-app-primary' : 'text-app-text'
                  }`}
                >
                  {isPersonal ? `${wins}W - ${losses}L` : `${stats.confirmed}/${stats.total}`}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 4. ATHLETIC VISUAL GRAPHIC */}
        <div className="rounded-xl overflow-hidden">
          <AthleticVisualGraphic post={post} height={120} />
        </div>

        {/* 5. DEVICE SYNC INFO */}
        {post.deviceSource && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-app-muted -mt-1">
            <Watch size={13} className="shrink-0" />
            <span>Đồng bộ từ {post.deviceSource}</span>
          </div>
        )}

        {/* 6. KUDOS FEEDBACK BAR */}
        {(post.likeCount > 0 || post.likedByNames.length > 0) && (
          <div className="flex items-center gap-2 pt-1">
            {/* Kudos stack avatar icons */}
            <div className="flex -space-x-1.5 items-center">
              {(post.likedByNames.slice(0, 3) || []).map((name, idx) => (
                <div
                  key={idx}
                  className="w-5 h-5 rounded-full bg-app-background border-2 border-app-surface flex items-center justify-center text-[8px] font-black text-app-text"
                >
                  {name[0] || '?'}
                </div>
              ))}
            </div>
            <span className="text-xs font-semibold text-app-muted flex-1 truncate">
              {formatKudosText()}
            </span>
            {post.commentCount > 0 && (
              <span className="text-xs font-semibold text-app-muted shrink-0">
                {post.commentCount} bình luận
              </span>
            )}
          </div>
        )}

        {/* 7. SOCIAL ACTIONS BAR */}
        <div className="pt-2 border-t border-app-border/60 flex items-center justify-between">
          {actions ? (
            actions
          ) : (
            <>
              {/* Like / Kudos Button */}
              <button
                onClick={onLike}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                  post.liked
                    ? 'text-red-500 hover:bg-red-500/10'
                    : 'text-app-muted hover:text-app-text hover:bg-app-background'
                }`}
              >
                <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} />
                <span>{post.liked ? 'Đã thích' : 'Thích'}</span>
                {post.likeCount > 0 && <span>({post.likeCount})</span>}
              </button>

              {/* Detail Button */}
              <button
                onClick={onTapDetail}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-app-muted hover:text-app-text hover:bg-app-background transition-all active:scale-95"
              >
                <FileText size={16} className="text-app-primary" />
                <span>Chi tiết</span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-app-muted hover:text-app-text hover:bg-app-background transition-all active:scale-95"
              >
                <Share2 size={16} />
                <span>Chia sẻ</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Share Sheet Modal */}
      <ActivityShareSheet
        post={post}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </BentoCard>
  );
};
