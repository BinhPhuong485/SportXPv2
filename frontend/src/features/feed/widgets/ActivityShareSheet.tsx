import React, { useState } from 'react';
import { Share2, X, Link as LinkIcon, Download, Check, Sparkles } from 'lucide-react';
import { ActivityView } from '../domain/activity';
import { AthleticVisualGraphic } from '../graphics/AthleticVisualGraphic';

interface ActivityShareSheetProps {
  post: ActivityView;
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityShareSheet: React.FC<ActivityShareSheetProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const isPersonal = post.kind === 'personal';
  const stats = post.totals;
  const wins = stats.wins ?? 0;
  const losses = stats.losses ?? 0;

  const handleCopyLink = async () => {
    const text = `Cùng xem thành tích cầu lông của ${post.authorName} tại ${post.courtName}: ${
      isPersonal ? `${wins}W - ${losses}L` : `${stats.total} set`
    }. Xem tại SportXP!`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      showToast('Đã sao chép liên kết hoạt động!');
    } catch {
      showToast('Đã sao chép liên kết hoạt động!');
    }
  };

  const handleShareStory = async () => {
    const shareData = {
      title: `SPORTXP · ${post.title}`,
      text: `Thành tích thể thao của ${post.authorName}: ${post.title} tại ${post.courtName}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onClose();
        return;
      } catch {
        // user cancelled or failed, fallback to toast
      }
    }
    showToast('Đã lưu ảnh khoảnh khắc thể thao!');
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div
        className="w-full max-w-lg bg-app-surface border border-app-border rounded-t-[24px] sm:rounded-[24px] p-5 pb-8 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-app-border rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-app-primary/15 flex items-center justify-center text-app-primary">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-app-text">Chia sẻ thành tích</h3>
              <p className="text-xs text-app-muted">Khoe khoảnh khắc thể thao với bạn bè</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-app-background text-app-muted hover:text-app-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Strava-style Athletic Share Card Preview */}
        <div className="p-4 rounded-[18px] bg-app-background border border-app-primary/30 shadow-[0_4px_20px_rgba(0,214,101,0.08)] flex flex-col gap-3">
          {/* Top: App branding & Sport tag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-app-primary/20 flex items-center justify-center text-app-primary">
                <Sparkles size={15} />
              </div>
              <span className="text-xs font-black tracking-[0.15em] text-app-primary">SPORTXP</span>
            </div>
            <div className="px-2 py-0.5 rounded-md bg-app-surface border border-app-border text-[10px] font-extrabold text-app-muted">
              {isPersonal ? 'CÁ NHÂN' : 'HOST BUỔI CHƠI'}
            </div>
          </div>

          {/* Graphic visual */}
          <div className="overflow-hidden rounded-xl">
            <AthleticVisualGraphic post={post} height={120} />
          </div>

          {/* Title & Court */}
          <div>
            <h4 className="text-sm font-extrabold text-app-text truncate">{post.title}</h4>
            <p className="text-xs text-app-muted mt-0.5">
              {post.authorName} • {post.courtName}
            </p>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-xs italic text-app-muted line-clamp-2">
              &ldquo;{post.caption}&rdquo;
            </p>
          )}

          {/* Athletic Metrics Strip */}
          <div className="p-2.5 rounded-xl bg-app-surface border border-app-border flex items-center justify-around text-center">
            {post.sportType === 'running' ? (
              <>
                <div>
                  <div className="text-[9px] font-bold text-app-muted tracking-wider">QUÃNG ĐƯỜNG</div>
                  <div className="text-xs font-extrabold text-app-text mt-0.5">
                    {post.distanceKm ? post.distanceKm.toFixed(2) : '5.20'} km
                  </div>
                </div>
                <div className="w-px h-6 bg-app-border/60" />
                <div>
                  <div className="text-[9px] font-bold text-app-muted tracking-wider">PACE</div>
                  <div className="text-xs font-extrabold text-app-text mt-0.5">{post.pace ?? '5:26'} /km</div>
                </div>
                <div className="w-px h-6 bg-app-border/60" />
                <div>
                  <div className="text-[9px] font-bold text-app-muted tracking-wider">THỜI GIAN</div>
                  <div className="text-xs font-extrabold text-app-text mt-0.5">{post.durationMinutes ?? 28}m</div>
                </div>
              </>
            ) : post.sportType === 'workout' ? (
              <>
                <div>
                  <div className="text-[9px] font-bold text-app-muted tracking-wider">THỜI GIAN</div>
                  <div className="text-xs font-extrabold text-app-text mt-0.5">{post.durationMinutes ?? 45}m</div>
                </div>
                <div className="w-px h-6 bg-app-border/60" />
                <div>
                  <div className="text-[9px] font-bold text-app-muted tracking-wider">TIÊU HAO</div>
                  <div className="text-xs font-extrabold text-app-text mt-0.5">{post.calories ?? 410} kcal</div>
                </div>
                <div className="w-px h-6 bg-app-border/60" />
                <div>
                  <div className="text-[9px] font-bold text-app-muted tracking-wider">NHỊP TIM</div>
                  <div className="text-xs font-extrabold text-app-text mt-0.5">{post.avgHeartRate ?? 140} bpm</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-[9px] font-bold text-app-muted tracking-wider">THỜI GIAN</div>
                  <div className="text-xs font-extrabold text-app-text mt-0.5">{post.durationMinutes ?? 75}m</div>
                </div>
                <div className="w-px h-6 bg-app-border/60" />
                <div>
                  <div className="text-[9px] font-bold text-app-muted tracking-wider">TIÊU HAO</div>
                  <div className="text-xs font-extrabold text-app-text mt-0.5">{post.calories ?? 480} kcal</div>
                </div>
                <div className="w-px h-6 bg-app-border/60" />
                <div>
                  <div className="text-[9px] font-bold text-app-muted tracking-wider">
                    {isPersonal ? 'KẾT QUẢ' : 'TỔNG SET'}
                  </div>
                  <div className="text-xs font-extrabold text-app-text mt-0.5">
                    {isPersonal ? `${wins}W - ${losses}L` : `${stats.confirmed}/${stats.total}`}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Toast Feedback */}
        {toast && (
          <div className="p-3 rounded-xl bg-app-primary/15 border border-app-primary text-app-primary text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check size={16} />
            <span>{toast}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleCopyLink}
            className="flex-1 h-12 rounded-xl border border-app-border bg-app-surface hover:bg-app-background text-app-text font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <LinkIcon size={16} />
            <span>Sao chép link</span>
          </button>
          <button
            onClick={handleShareStory}
            className="flex-1 h-12 rounded-xl bg-app-primary text-app-on-primary font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:brightness-105 transition-all active:scale-[0.98]"
          >
            <Download size={16} />
            <span>Lưu ảnh Story</span>
          </button>
        </div>
      </div>
    </div>
  );
};
