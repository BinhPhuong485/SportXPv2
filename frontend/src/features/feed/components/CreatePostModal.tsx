import React from 'react';
import { X, MessageCircle, Star, Trophy, AlertCircle } from 'lucide-react';
import { CreatePostModalProps } from '../types';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  postTypeChoice,
  setPostTypeChoice,
  contentInput,
  setContentInput,
  ratingChoice,
  setRatingChoice,
  mediaUrlInput,
  setMediaUrlInput,
  formError,
  busy,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-app-surface border border-app-border rounded-xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-app-border">
          <h2 className="text-base font-black text-app-text">Tạo bài viết mới</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-app-background text-app-muted hover:text-app-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Post Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-app-background border border-app-border/80 text-xs font-bold">
          {[
            { type: 'general', label: 'Cộng đồng', icon: MessageCircle },
            { type: 'court_review', label: 'Review sân', icon: Star },
            { type: 'match_recap', label: 'Nhật ký trận', icon: Trophy },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setPostTypeChoice(item.type as any)}
                className={`py-2 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  postTypeChoice === item.type
                    ? 'bg-white dark:bg-app-surface text-emerald-600 dark:text-emerald-400 font-black shadow-xs'
                    : 'text-app-muted hover:text-app-text'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          {/* Content Textarea */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-black uppercase text-app-muted">Nội dung</label>
            <textarea
              rows={4}
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              placeholder="Chia sẻ trải nghiệm sân, ván đấu vừa chơi, hoặc tìm kiếm bạn giao lưu…"
              className="w-full p-3.5 rounded-xl bg-app-background border border-app-border text-xs text-app-text placeholder:text-app-muted outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Rating Star Picker (for Court Review) */}
          {postTypeChoice === 'court_review' && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                Đánh giá chất lượng sân:
              </span>
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingChoice(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={18}
                      className={star <= ratingChoice ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                    />
                  </button>
                ))}
                <span className="text-xs font-black ml-1 text-amber-800 dark:text-amber-300">{ratingChoice}.0</span>
              </div>
            </div>
          )}

          {/* Media URL Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-black uppercase text-app-muted">
              Liên kết Ảnh / Video (tùy chọn)
            </label>
            <input
              type="url"
              value={mediaUrlInput}
              onChange={(e) => setMediaUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full h-10 px-3.5 rounded-xl bg-app-background border border-app-border text-xs text-app-text placeholder:text-app-muted outline-none focus:border-emerald-500"
            />
          </div>

          {/* Form Error */}
          {formError && (
            <div className="p-3 rounded-xl bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-app-muted hover:bg-app-background transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all disabled:opacity-50"
            >
              {busy ? 'Đang đăng…' : 'Đăng bài'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

