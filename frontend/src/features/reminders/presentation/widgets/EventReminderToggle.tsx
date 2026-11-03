import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, Check, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../../../shared/hooks/useAuth';
import { reminderRepository } from '../../data/reminderRepository';
import { ReminderLeadTime, LEAD_TIME_OPTIONS } from '../../domain/reminderTypes';

interface EventReminderToggleProps {
  eventId: string;
  isCancelled?: boolean;
  compact?: boolean;
}

export const EventReminderToggle: React.FC<EventReminderToggleProps> = ({
  eventId,
  isCancelled = false,
  compact = false,
}) => {
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const triggerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => reminderRepository.getPreferences(userId));
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  }>({ right: 16 });

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 220 && rect.top > 220;

    const right = Math.max(12, window.innerWidth - rect.right);

    setMenuPosition({
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      right,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => {
        setIsOpen(false);
      };
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    }
  }, [isOpen]);

  if (isCancelled) return null;

  const override = prefs.overrides[eventId];
  const isEnabled = override ? override.enabled : prefs.enabled;
  const currentLeadTimes = override?.leadTimes || prefs.defaultLeadTimes;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newEnabled = !isEnabled;
    reminderRepository.setEventOverride(userId, eventId, {
      enabled: newEnabled,
      leadTimes: currentLeadTimes,
    });
    setPrefs(reminderRepository.getPreferences(userId));
  };

  const handleSelectLeadTime = (lead: ReminderLeadTime, e: React.MouseEvent) => {
    e.stopPropagation();
    const set = new Set(currentLeadTimes);
    if (set.has(lead)) {
      if (set.size > 1) set.delete(lead);
    } else {
      set.add(lead);
    }
    reminderRepository.setEventOverride(userId, eventId, {
      enabled: true,
      leadTimes: Array.from(set) as ReminderLeadTime[],
    });
    setPrefs(reminderRepository.getPreferences(userId));
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleToggle}
          title={isEnabled ? 'Nhắc tôi (Đang bật)' : 'Nhắc tôi (Đang tắt)'}
          aria-label={isEnabled ? 'Tắt nhắc lịch cho buổi này' : 'Bật nhắc lịch cho buổi này'}
          className={`flex items-center gap-1.5 rounded-full transition-all active:scale-95 ${
            compact
              ? 'px-2 py-1 text-[11px] font-bold'
              : 'px-3 py-1.5 text-xs font-black'
          } ${
            isEnabled
              ? 'bg-app-mint text-app-primary border border-app-primary/40 shadow-2xs'
              : 'bg-app-surface text-app-muted border border-app-border hover:border-app-muted'
          }`}
        >
          {isEnabled ? <Bell size={compact ? 12 : 14} /> : <BellOff size={compact ? 12 : 14} />}
          <span>Nhắc tôi</span>
        </button>

        {isEnabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updatePosition();
              setIsOpen((prev) => !prev);
            }}
            className="p-1 rounded-full text-app-muted hover:text-app-text transition-colors"
            aria-label="Tùy chỉnh thời điểm nhắc"
          >
            <ChevronDown size={14} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        )}
      </div>

      {isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998] bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: menuPosition.top,
                bottom: menuPosition.bottom,
                right: menuPosition.right,
                zIndex: 9999,
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-48 rounded-xl bg-app-surface border border-app-border shadow-2xl p-2 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150"
            >
              <span className="text-[10px] font-black uppercase text-app-muted px-2 py-1">
                Nhắc trước:
              </span>
              {LEAD_TIME_OPTIONS.map((opt) => {
                const checked = currentLeadTimes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => handleSelectLeadTime(opt.value, e)}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left font-bold transition-colors ${
                      checked
                        ? 'bg-app-mint text-app-primary'
                        : 'text-app-text hover:bg-app-background'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {checked && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
