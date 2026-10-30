import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { SportNotice } from './domain/notice';
import { noticeRepository } from './data/noticeRepository';
import { EmptyState } from '../../shared/components/EmptyState';

interface NotificationModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModalSheet: React.FC<NotificationModalSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const [notices, setNotices] = useState<SportNotice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      noticeRepository.listNotices().then((data) => {
        setNotices(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const formatTime = (date: Date): string => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    if (diffMins < 60) {
      return `${Math.max(1, diffMins)} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      {/* Custom Header matching SportXP standards */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-app-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-app-primary/10 border border-app-primary/20 flex items-center justify-center text-app-primary">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-app-text">
              Thông báo
            </h3>
            <p className="text-xs text-app-muted">
              Cập nhật lời mời, phòng chơi & giải đấu
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-3 min-h-[260px] max-h-[60vh] overflow-y-auto no-scrollbar pb-2">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-app-muted text-xs">
            <div className="w-7 h-7 border-3 border-app-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Đang tải thông báo…</span>
          </div>
        ) : notices.length === 0 ? (
          <EmptyState
            type="shuttlecock"
            title="Chưa có thông báo mới"
            description="Khi bạn có lời mời vào phòng chơi, xếp cặp hoặc giải đấu, thông báo sẽ hiển thị ở đây."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`p-4 rounded-btn border transition-all ${
                  notice.isRead
                    ? 'bg-app-background/60 border-app-border'
                    : 'bg-app-mint/30 border-app-primary/30 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    {!notice.isRead ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-app-primary block ring-2 ring-app-primary/30" />
                    ) : (
                      <CheckCheck size={16} className="text-app-muted" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-sm font-black text-app-text leading-snug">
                      {notice.title}
                    </span>
                    <p className="text-xs text-app-muted leading-relaxed mt-1">
                      {notice.content}
                    </p>
                    <span className="text-[11px] font-medium text-app-muted/80 mt-2">
                      {formatTime(notice.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalSheet>
  );
};
