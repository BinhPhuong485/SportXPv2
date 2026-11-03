import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCheck, Calendar, Clock, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { SportNotice } from './domain/notice';
import { noticeRepository } from './data/noticeRepository';
import { EmptyState } from '../../shared/components/EmptyState';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { calendarRepository } from '../calendar/data/calendarRepository';
import { reminderRepository } from '../reminders/data/reminderRepository';
import { DueReminder } from '../reminders/domain/reminderTypes';
import { generateReminderCandidates, formatVnDateTime } from '../reminders/domain/reminderEngine';

interface NotificationModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshBadge?: () => void;
}

export const NotificationModalSheet: React.FC<NotificationModalSheetProps> = ({
  isOpen,
  onClose,
  onRefreshBadge,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const [notices, setNotices] = useState<SportNotice[]>([]);
  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [readKeys, setReadKeys] = useState<Set<string>>(() => reminderRepository.getReadKeys(userId));
  const [todayEventsCount, setTodayEventsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setReadKeys(reminderRepository.getReadKeys(userId));

    Promise.all([
      noticeRepository.listNotices(),
      calendarRepository.loadUserCalendarEvents(),
    ])
      .then(([serverNotices, events]) => {
        setNotices(serverNotices);

        // Count today's events in Vietnam time
        const now = new Date();
        const todayStr = new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(now);

        const activeToday = events.filter((e) => {
          if (e.isCancelled || e.status === 'CANCELLED') return false;
          const evDateStr = new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(e.startsAt);
          return evDateStr === todayStr;
        });
        setTodayEventsCount(activeToday.length);

        // Compute due reminders from fired log and events
        const prefs = reminderRepository.getPreferences(userId);
        const firedLog = reminderRepository.getFiredLog(userId);
        const candidates = generateReminderCandidates(events, prefs);
        const candidateMap = new Map(candidates.map((c) => [c.key, c]));

        const dueList: DueReminder[] = [];
        for (const [key, record] of Object.entries(firedLog)) {
          const cand = candidateMap.get(key);
          if (cand) {
            dueList.push({
              key,
              event: cand.event,
              triggerTime: new Date(record.firedAt || cand.triggerTime),
              leadTimeMinutes: cand.leadTimeMinutes,
              leadTimeLabel: cand.leadTimeLabel,
              isMissed: true,
              formattedEventTime: formatVnDateTime(cand.event.startsAt),
            });
          }
        }

        dueList.sort((a, b) => b.triggerTime.getTime() - a.triggerTime.getTime());
        setReminders(dueList);
        setLoading(false);
      })
      .catch((e) => {
        console.warn('Failed to load notices & reminders:', e);
        setLoading(false);
      });
  }, [isOpen, userId]);

  const handleMarkAllRemindersRead = () => {
    const keys = reminders.map((r) => r.key);
    reminderRepository.markAllRemindersRead(userId, keys);
    setReadKeys(new Set(keys));
    if (onRefreshBadge) onRefreshBadge();
  };

  const handleOpenReminder = (reminder: DueReminder) => {
    reminderRepository.markReminderRead(userId, reminder.key);
    setReadKeys((prev) => new Set([...prev, reminder.key]));
    if (onRefreshBadge) onRefreshBadge();
    onClose();

    if (reminder.event.rawRoom?.id) {
      navigate(`/rooms/${reminder.event.rawRoom.id}`);
    } else {
      navigate('/calendar');
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const unreadRemindersCount = reminders.filter((r) => !readKeys.has(r.key)).length;
  const hasContent = notices.length > 0 || reminders.length > 0 || todayEventsCount > 0;

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-app-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-app-primary/10 border border-app-primary/20 flex items-center justify-center text-app-primary shadow-2xs">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-app-text">
              Thông báo
            </h3>
            <p className="text-xs text-app-muted">
              Nhắc lịch thi đấu, phòng chơi & cập nhật hệ thống
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
          aria-label="Đóng bảng thông báo"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 min-h-[260px] max-h-[65vh] overflow-y-auto no-scrollbar pb-3">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-app-muted text-xs">
            <div className="w-7 h-7 border-3 border-app-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Đang tải thông báo…</span>
          </div>
        ) : !hasContent ? (
          <EmptyState
            type="shuttlecock"
            title="Chưa có thông báo mới"
            description="Khi bạn có lời mời vào phòng chơi, xếp cặp hoặc nhắc lịch, thông báo sẽ hiển thị ở đây."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Today's Schedule Card: "Hôm nay bạn có N buổi" */}
            {todayEventsCount > 0 && (
              <div
                onClick={() => {
                  onClose();
                  navigate('/calendar');
                }}
                className="p-3.5 rounded-btn bg-app-mint border border-app-primary/40 flex items-center justify-between cursor-pointer hover:shadow-xs active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-app-primary text-app-on-primary flex items-center justify-center shrink-0 shadow-2xs">
                    <Calendar size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-app-text">
                      Hôm nay bạn có {todayEventsCount} buổi chơi cầu
                    </span>
                    <span className="text-[11px] text-app-muted truncate">
                      Nhấn để kiểm tra lịch thi đấu chi tiết trong ngày
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-app-primary shrink-0 ml-2" />
              </div>
            )}

            {/* SECTION 1: NHẮC LỊCH (Local due & missed reminders) */}
            {reminders.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-app-primary">
                      Nhắc lịch thi đấu
                    </span>
                    {unreadRemindersCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-app-primary text-app-on-primary">
                        {unreadRemindersCount} mới
                      </span>
                    )}
                  </div>
                  {unreadRemindersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRemindersRead}
                      className="text-[11px] font-bold text-app-muted hover:text-app-primary flex items-center gap-1 transition-colors"
                    >
                      <Check size={12} />
                      <span>Đọc tất cả</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {reminders.map((r) => {
                    const isRead = readKeys.has(r.key);
                    return (
                      <div
                        key={r.key}
                        onClick={() => handleOpenReminder(r)}
                        className={`p-3.5 rounded-btn border cursor-pointer transition-all active:scale-[0.99] ${
                          isRead
                            ? 'bg-app-surface/60 border-app-border'
                            : 'bg-app-mint/40 border-app-primary/40 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 shrink-0">
                            {!isRead ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-app-primary block ring-2 ring-app-primary/30" />
                            ) : (
                              <CheckCheck size={16} className="text-app-muted" />
                            )}
                          </div>
                          <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-app-primary uppercase flex items-center gap-1">
                                <Clock size={12} />
                                {r.leadTimeLabel}
                              </span>
                              <span className="text-[10px] text-app-muted">
                                {formatTimeAgo(r.triggerTime)}
                              </span>
                            </div>
                            <span className="text-sm font-extrabold text-app-text mt-0.5 truncate">
                              {r.event.title}
                            </span>
                            <span className="text-xs text-app-muted mt-0.5 truncate">
                              {r.event.subtitle} · {r.formattedEventTime}
                            </span>
                          </div>
                          <ChevronRight size={16} className="text-app-muted shrink-0 self-center" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: THÔNG BÁO HỆ THỐNG & PHÒNG CHƠI (Server notices) */}
            {notices.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-app-muted">
                    Thông báo từ phòng & hệ thống
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {notices.map((notice) => (
                    <div
                      key={notice.id}
                      className={`p-3.5 rounded-btn border transition-all ${
                        notice.isRead
                          ? 'bg-app-background/60 border-app-border'
                          : 'bg-app-surface border-app-border/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">
                          {!notice.isRead ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-app-streak block ring-2 ring-app-streak/30" />
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
                            {formatTimeAgo(notice.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalSheet>
  );
};
