import React from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { CommentDrawerProps } from '../types';
import { Avatar } from '../../../shared/components/Avatar';

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  post,
  comments,
  loading,
  newCommentText,
  setNewCommentText,
  onSendComment,
  onClose,
  userAvatarUrl,
}) => {
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-app-surface border border-app-border rounded-t-[28px] sm:rounded-xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        {/* Sheet Header */}
        <div className="p-4 border-b border-app-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-emerald-600" />
            <h3 className="text-sm font-black text-app-text">
              Bình luận ({post.commentsCount})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-app-background flex items-center justify-center text-app-muted hover:text-app-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-app-muted text-xs">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải bình luận…</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-1 text-app-muted text-xs text-center">
              <MessageCircle size={32} className="text-app-border mb-1" />
              <span className="font-bold">Chưa có bình luận nào</span>
              <span>Hãy là người đầu tiên để lại ý kiến của bạn!</span>
            </div>
          ) : (
            comments.map((cmt) => (
              <div
                key={cmt.id}
                className="p-3 rounded-lg bg-app-background border border-app-border/60 flex flex-col gap-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar size="xs" className="w-6 h-6" />
                    <span className="font-black text-app-text">{cmt.authorName}</span>
                  </div>
                  <span className="text-[10px] text-app-muted">
                    {new Date(cmt.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-app-text/90 font-medium leading-relaxed pl-8">{cmt.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment Input Footer */}
        <div className="p-3 sm:p-4 border-t border-app-border bg-white dark:bg-app-surface flex items-center gap-2 shrink-0">
          <Avatar
            src={userAvatarUrl}
            size="xs"
            className="w-8 h-8"
          />
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSendComment();
            }}
            placeholder="Viết bình luận của bạn…"
            className="flex-1 h-10 px-4 rounded-full bg-app-background border border-app-border text-xs text-app-text placeholder:text-app-muted outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={onSendComment}
            disabled={!newCommentText.trim()}
            className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 hover:brightness-105 active:scale-95 transition-all shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

