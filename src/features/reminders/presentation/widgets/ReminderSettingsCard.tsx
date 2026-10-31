import React, { useState } from 'react';
import { Bell, BellRing, BellOff, Calendar, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BentoCard } from '../../../../shared/components/BentoCard';
import { useAuthStore } from '../../../../shared/hooks/useAuth';
import { reminderRepository } from '../../data/reminderRepository';
import {
  ReminderLeadTime,
  LEAD_TIME_OPTIONS,
  ReminderPreferences,
} from '../../domain/reminderTypes';

interface ReminderSettingsCardProps {
  onNotificationRequest?: () => Promise<boolean>;
}

export const ReminderSettingsCard: React.FC<ReminderSettingsCardProps> = ({
  onNotificationRequest,
}) => {
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const [prefs, setPrefs] = useState<ReminderPreferences>(() =>
    reminderRepository.getPreferences(userId)
  );
  const [browserPermission, setBrowserPermission] = useState<string>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const saveUpdated = (updated: ReminderPreferences) => {
    setPrefs(updated);
    reminderRepository.savePreferences(userId, updated);
  };

  const handleToggleMaster = () => {
    const updated = { ...prefs, enabled: !prefs.enabled };
    saveUpdated(updated);
  };

  const handleToggleLeadTime = (lead: ReminderLeadTime) => {
    const current = new Set(prefs.defaultLeadTimes);
    if (current.has(lead)) {
      if (current.size > 1) {
        current.delete(lead);
      }
    } else {
      current.add(lead);
    }
    const updated = {
      ...prefs,
      defaultLeadTimes: Array.from(current) as ReminderLeadTime[],
    };
    saveUpdated(updated);
  };

  const handleBrowserToggle = async () => {
    if (typeof Notification === 'undefined') {
      alert('Trình duyệt không hỗ trợ Web Notification.');
      return;
    }

    if (Notification.permission !== 'granted') {
      let granted = false;
      if (onNotificationRequest) {
        granted = await onNotificationRequest();
      } else {
        const res = await Notification.requestPermission();
        granted = res === 'granted';
      }
      setBrowserPermission(Notification.permission);
      if (granted) {
        saveUpdated({ ...prefs, browserNotificationsEnabled: true });
      }
    } else {
      const updated = {
        ...prefs,
        browserNotificationsEnabled: !prefs.browserNotificationsEnabled,
      };
      saveUpdated(updated);
    }
  };

  return (
    <BentoCard doubleBezel className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-app-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-app-primary/10 border border-app-primary/25 flex items-center justify-center text-app-primary shadow-2xs">
            <BellRing size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-app-text">
              Nhắc lịch thi đấu
            </h3>
            <p className="text-xs text-app-muted">
              Quản lý thời điểm và phương thức nhận thông báo
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={prefs.enabled}
            onChange={handleToggleMaster}
            className="sr-only peer"
            aria-label="Bật hoặc tắt tính năng nhắc lịch"
          />
          <div className="w-12 h-6 bg-app-border peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary shadow-inner" />
        </label>
      </div>

      {prefs.enabled ? (
        <div className="flex flex-col gap-4">
          {/* Default Lead Times Selector */}
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-app-muted block mb-2">
              Thời điểm nhắc trước mặc định
            </span>
            <div className="grid grid-cols-2 gap-2">
              {LEAD_TIME_OPTIONS.map((opt) => {
                const isSelected = prefs.defaultLeadTimes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggleLeadTime(opt.value)}
                    className={`py-2 px-3 rounded-btn border text-xs font-bold flex items-center justify-between transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-app-mint border-app-primary text-app-primary shadow-xs'
                        : 'bg-app-surface border-app-border text-app-muted hover:border-app-border/80'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} className="text-app-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Browser Notification Switch */}
          <div className="p-3.5 rounded-btn bg-app-background/60 border border-app-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-app-surface border border-app-border flex items-center justify-center text-app-primary shrink-0">
                {prefs.browserNotificationsEnabled ? <Bell size={16} /> : <BellOff size={16} className="text-app-muted" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-app-text truncate">
                  Thông báo trên trình duyệt
                </span>
                <span className="text-[11px] text-app-muted truncate">
                  {browserPermission === 'denied'
                    ? 'Đã bị chặn trong cài đặt trình duyệt'
                    : prefs.browserNotificationsEnabled
                    ? 'Đang hoạt động khi mở tab'
                    : 'Nhấn để cấp quyền nhận thông báo pop-up'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBrowserToggle}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 ${
                prefs.browserNotificationsEnabled
                  ? 'bg-app-primary text-app-on-primary'
                  : 'bg-app-surface border border-app-border text-app-text hover:border-app-primary/50'
              }`}
            >
              {prefs.browserNotificationsEnabled ? 'Bật' : 'Kích hoạt'}
            </button>
          </div>

          {/* Mandatory Offline Limitation Notice */}
          <div className="p-3.5 rounded-btn bg-app-surface border border-app-border/80 text-xs text-app-muted flex flex-col gap-2">
            <p className="leading-relaxed">
              Thông báo chỉ hiện khi ứng dụng đang mở. Muốn được nhắc cả khi đóng ứng dụng, hãy thêm buổi chơi vào lịch điện thoại.
            </p>
            <Link
              to="/calendar"
              className="inline-flex items-center gap-1.5 text-app-primary font-black text-xs hover:underline mt-1 w-fit"
            >
              <Calendar size={14} />
              <span>Mở Lịch & Xuất file ICS</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-app-muted flex flex-col items-center gap-2">
          <BellOff size={24} className="text-app-muted/60" />
          <span>Tính năng nhắc lịch đang tắt. Bạn sẽ không nhận thông báo pop-up về các buổi chơi sắp tới.</span>
        </div>
      )}
    </BentoCard>
  );
};
