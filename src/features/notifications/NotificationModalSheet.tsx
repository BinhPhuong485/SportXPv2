import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { SportNotice } from './domain/notice';
import { noticeRepository } from './data/noticeRepository';

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
      {/* Custom Header matching Flutter */}
      <div className="flex items-center gap-2.5 pb-3 mb-2 border-b border-app-border/40">
        <div className="p-2 rounded-[10px] bg-app-primary/12 flex items-center justify-center">
          <Bell size={20} className="text-app-primary" />
        </div>
        <h3 className="text-[15px] font-bold tracking-wide text-app-text uppercase">
          THÔNG BÁO CỦA BẠN
        </h3>
      </div>

      <div className="flex flex-col gap-3 min-h-[260px] max-h-[60vh] overflow-y-auto no-scrollbar pb-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-app-muted">Đang tải thông báo…</span>
          </div>
        ) : notices.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center gap-2 text-center px-4">
            <Bell size={48} className="text-app-muted/60 mb-1" />
            <span className="text-sm font-bold text-app-text">Không có thông báo mới</span>
            <p className="text-xs text-app-muted max-w-[280px] leading-relaxed">
              Khi bạn nhận được lời mời tham gia kèo hoặc thông báo giải đấu, chúng sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  notice.isRead
                    ? 'bg-app-surface border-app-border'
                    : 'bg-app-background border-app-primary/35 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      notice.isRead ? 'bg-transparent' : 'bg-app-loss'
                    }`}
                  />
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[13.5px] font-bold text-app-text leading-tight">
                      {notice.title}
                    </span>
                    <p className="text-xs text-app-muted leading-relaxed">
                      {notice.content}
                    </p>
                    <span className="text-[10.5px] text-app-muted/80 mt-0.5">
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
