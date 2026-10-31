import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../../shared/hooks/useAuth';
import { calendarRepository } from '../../calendar/data/calendarRepository';
import { CalendarEvent } from '../../calendar/domain/calendarEvent';
import {
  DueReminder,
  ReminderPreferences,
  FiredReminderRecord,
} from '../domain/reminderTypes';
import {
  evaluateDueReminders,
  generateReminderCandidates,
} from '../domain/reminderEngine';
import { reminderRepository } from '../data/reminderRepository';

const EVENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes max refresh rate

export function useReminderScheduler() {
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const [preferences, setPreferences] = useState<ReminderPreferences>(() =>
    reminderRepository.getPreferences(userId)
  );
  const [activeToast, setActiveToast] = useState<DueReminder | null>(null);
  const [missedReminders, setMissedReminders] = useState<DueReminder[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const eventsRef = useRef<CalendarEvent[]>([]);
  const lastEventsFetchRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const nextTimerRef = useRef<number | null>(null);

  // Sync preferences when user changes
  useEffect(() => {
    setPreferences(reminderRepository.getPreferences(userId));
  }, [userId]);

  // Fetch events with 5-minute throttling
  const loadEvents = useCallback(async (force = false): Promise<CalendarEvent[]> => {
    const now = Date.now();
    if (!force && eventsRef.current.length > 0 && now - lastEventsFetchRef.current < EVENT_CACHE_TTL_MS) {
      return eventsRef.current;
    }
    if (isFetchingRef.current) return eventsRef.current;

    isFetchingRef.current = true;
    try {
      const data = await calendarRepository.loadUserCalendarEvents();
      eventsRef.current = data;
      lastEventsFetchRef.current = Date.now();
      return data;
    } catch (e) {
      console.warn('Failed to fetch events in scheduler:', e);
      return eventsRef.current;
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Display browser notification if enabled & permitted
  const triggerBrowserNotification = useCallback((reminder: DueReminder) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const notif = new Notification(reminder.event.title, {
        body: `${reminder.leadTimeLabel} · ${reminder.event.subtitle} (${reminder.formattedEventTime})`,
        icon: '/favicon.png',
        tag: reminder.key,
      });

      notif.onclick = () => {
        window.focus();
        if (reminder.event.rawRoom?.id) {
          window.location.hash = `#/rooms/${reminder.event.rawRoom.id}`;
        } else {
          window.location.hash = '#/calendar';
        }
      };
    } catch (e) {
      console.warn('Browser notification trigger failed:', e);
    }
  }, []);

  // Core evaluation run
  const runEvaluation = useCallback(async (forceRefresh = false) => {
    const prefs = reminderRepository.getPreferences(userId);
    if (!prefs.enabled) {
      setMissedReminders([]);
      setUnreadCount(0);
      return;
    }

    const events = await loadEvents(forceRefresh);
    const firedLog = reminderRepository.getFiredLog(userId);
    const readKeys = reminderRepository.getReadKeys(userId);
    const now = new Date();

    const { dueLive, dueMissed } = evaluateDueReminders(events, prefs, firedLog, now, 10);

    // 1. Handle live triggers
    if (dueLive.length > 0) {
      const firstLive = dueLive[0];
      setActiveToast(firstLive);

      // Trigger browser notification if allowed
      if (prefs.browserNotificationsEnabled) {
        triggerBrowserNotification(firstLive);
      }

      // Record to firedLog to avoid double firing across tabs
      const firedRecords: FiredReminderRecord[] = dueLive.map((item) => ({
        key: item.key,
        eventId: item.event.id,
        startsAt: item.event.startsAt.getTime(),
        leadTimeMinutes: item.leadTimeMinutes,
        firedAt: new Date().toISOString(),
      }));
      reminderRepository.recordFired(userId, firedRecords);
    }

    // 2. Handle missed / past due reminders for bell sheet
    // Also record missed so they don't re-compute endlessly
    if (dueMissed.length > 0) {
      const missedRecords: FiredReminderRecord[] = dueMissed.map((item) => ({
        key: item.key,
        eventId: item.event.id,
        startsAt: item.event.startsAt.getTime(),
        leadTimeMinutes: item.leadTimeMinutes,
        firedAt: new Date().toISOString(),
      }));
      reminderRepository.recordFired(userId, missedRecords);
    }

    // 3. Compute bell sheet "Nhắc lịch" list from firedLog & candidate events
    const updatedLog = reminderRepository.getFiredLog(userId);
    const allCandidates = generateReminderCandidates(events, prefs);
    const candidateMap = new Map(allCandidates.map((c) => [c.key, c]));

    const aggregatedReminders: DueReminder[] = [];
    for (const key of Object.keys(updatedLog)) {
      const cand = candidateMap.get(key);
      if (cand) {
        aggregatedReminders.push({
          key,
          event: cand.event,
          triggerTime: cand.triggerTime,
          leadTimeMinutes: cand.leadTimeMinutes,
          leadTimeLabel: cand.leadTimeLabel,
          isMissed: true,
          formattedEventTime: cand.triggerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    }

    // Sort most recent first
    aggregatedReminders.sort((a, b) => b.triggerTime.getTime() - a.triggerTime.getTime());
    setMissedReminders(aggregatedReminders);

    // Calculate unread badge count
    const unread = aggregatedReminders.filter((r) => !readKeys.has(r.key)).length;
    setUnreadCount(unread);

    // 4. Schedule next single timeout based on nearest upcoming trigger candidate
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }

    const futureCandidates = allCandidates
      .filter((c) => c.triggerTime.getTime() > now.getTime() && !updatedLog[c.key])
      .sort((a, b) => a.triggerTime.getTime() - b.triggerTime.getTime());

    if (futureCandidates.length > 0) {
      const nextDelayMs = Math.min(
        futureCandidates[0].triggerTime.getTime() - now.getTime(),
        60 * 1000 // capped at 1 minute check
      );
      nextTimerRef.current = window.setTimeout(() => {
        runEvaluation(false);
      }, Math.max(1000, nextDelayMs));
    }
  }, [userId, loadEvents, triggerBrowserNotification]);

  // Hook lifecycle: visibilitychange, focus, 1-min heartbeat, storage sync
  useEffect(() => {
    runEvaluation(true);

    const handleFocus = () => {
      runEvaluation(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runEvaluation(false);
      }
    };

    const intervalId = window.setInterval(() => {
      runEvaluation(false);
    }, 60 * 1000);

    const unsubscribeMultiTab = reminderRepository.subscribeMultiTab(() => {
      setPreferences(reminderRepository.getPreferences(userId));
      runEvaluation(false);
    });

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      if (nextTimerRef.current) {
        window.clearTimeout(nextTimerRef.current);
      }
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribeMultiTab();
    };
  }, [runEvaluation, userId]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const updatePreferences = useCallback(
    (newPrefs: ReminderPreferences) => {
      reminderRepository.savePreferences(userId, newPrefs);
      setPreferences(newPrefs);
      runEvaluation(true);
    },
    [userId, runEvaluation]
  );

  const requestBrowserNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      alert('Trình duyệt hiện tại không hỗ trợ thông báo đẩy trực tiếp trên web.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      alert(
        'Quyền thông báo đã bị chặn trong cài đặt trình duyệt. Hãy cho phép thông báo trong phần Cài đặt trang web để nhận thông báo nhắc lịch.'
      );
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return false;
    }
  }, []);

  return {
    preferences,
    updatePreferences,
    activeToast,
    dismissToast,
    missedReminders,
    unreadCount,
    requestBrowserNotificationPermission,
    refreshReminders: () => runEvaluation(true),
  };
}
