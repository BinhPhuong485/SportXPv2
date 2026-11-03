import { CalendarEvent } from '../../calendar/domain/calendarEvent';
import {
  ReminderPreferences,
  FiredReminderRecord,
  DueReminder,
  ReminderLeadTime,
  DEFAULT_LEAD_TIMES,
} from './reminderTypes';

/**
 * Vietnam Timezone is UTC+7 (Asia/Ho_Chi_Minh).
 * No daylight saving time (DST) observed.
 */
export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export function formatVnDateTime(date: Date): string {
  // Asia/Ho_Chi_Minh
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${get('hour')}:${get('minute')} · ${get('day')}/${get('month')}/${get('year')}`;
}

export function formatVnDateOnly(date: Date): string {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${get('day')}/${get('month')}/${get('year')}`;
}

/**
 * Computes 09:00:00 UTC+7 for a given Date in Asia/Ho_Chi_Minh timezone
 */
export function getVn9AmForDate(date: Date): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1970', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);

  // 09:00:00 in UTC+7 is 02:00:00 UTC
  return new Date(Date.UTC(year, month - 1, day, 2, 0, 0, 0));
}

export function getLeadTimeLabel(minutes: number | string): string {
  if (minutes === 'tourney_day_before') return '09:00 hôm trước giải đấu';
  if (minutes === 'tourney_day_of') return '09:00 ngày khai mạc';
  const num = typeof minutes === 'number' ? minutes : parseInt(minutes, 10);
  if (num >= 1440) {
    const days = Math.round(num / 1440);
    return `${days} ngày trước`;
  }
  if (num >= 60) {
    const hours = Math.round(num / 60);
    return `${hours} giờ trước`;
  }
  return `${num} phút trước`;
}

export interface ReminderCandidate {
  key: string;
  event: CalendarEvent;
  triggerTime: Date;
  leadTimeMinutes: number | string;
  leadTimeLabel: string;
}

/**
 * Generates all possible reminder trigger candidates for a list of calendar events.
 */
export function generateReminderCandidates(
  events: CalendarEvent[],
  preferences: ReminderPreferences
): ReminderCandidate[] {
  if (!preferences.enabled) return [];

  const candidates: ReminderCandidate[] = [];

  for (const event of events) {
    // 1. Ignore cancelled events
    if (event.isCancelled || event.status === 'CANCELLED') {
      continue;
    }

    // Check per-event override
    const override = preferences.overrides[event.id];
    if (override && override.enabled === false) {
      continue; // User explicitly disabled reminders for this event
    }

    const eventStartsAt = event.startsAt instanceof Date ? event.startsAt : new Date(event.startsAt);
    if (isNaN(eventStartsAt.getTime())) continue;

    if (event.isAllDay || event.type === 'tournament') {
      // All-day tournaments: remind at 09:00 the day before and at 09:00 on the day
      const dayOf9Am = getVn9AmForDate(eventStartsAt);
      const dayBefore9Am = new Date(dayOf9Am.getTime() - 24 * 60 * 60 * 1000);

      // Candidate 1: Day before at 09:00
      candidates.push({
        key: `${event.id}_${eventStartsAt.getTime()}_tourney_day_before`,
        event,
        triggerTime: dayBefore9Am,
        leadTimeMinutes: 'tourney_day_before',
        leadTimeLabel: getLeadTimeLabel('tourney_day_before'),
      });

      // Candidate 2: Day of at 09:00
      candidates.push({
        key: `${event.id}_${eventStartsAt.getTime()}_tourney_day_of`,
        event,
        triggerTime: dayOf9Am,
        leadTimeMinutes: 'tourney_day_of',
        leadTimeLabel: getLeadTimeLabel('tourney_day_of'),
      });
    } else {
      // Room match: use configured lead times
      const leadTimes: ReminderLeadTime[] =
        override?.leadTimes && override.leadTimes.length > 0
          ? override.leadTimes
          : preferences.defaultLeadTimes && preferences.defaultLeadTimes.length > 0
          ? preferences.defaultLeadTimes
          : DEFAULT_LEAD_TIMES;

      for (const lead of leadTimes) {
        const triggerTime = new Date(eventStartsAt.getTime() - lead * 60 * 1000);
        candidates.push({
          key: `${event.id}_${eventStartsAt.getTime()}_${lead}`,
          event,
          triggerTime,
          leadTimeMinutes: lead,
          leadTimeLabel: getLeadTimeLabel(lead),
        });
      }
    }
  }

  return candidates;
}

/**
 * Pure evaluator: given events, preferences, fired log, and current time, returns due reminders.
 * @param liveWindowMinutes threshold in minutes where a reminder is considered "live" (triggering a toast/notification right now)
 *                          vs "missed" (came due in the past while app was closed).
 */
export function evaluateDueReminders(
  events: CalendarEvent[],
  preferences: ReminderPreferences,
  firedLog: Record<string, FiredReminderRecord> | Map<string, FiredReminderRecord>,
  currentTime: Date,
  liveWindowMinutes: number = 10
): {
  dueLive: DueReminder[];
  dueMissed: DueReminder[];
  allDue: DueReminder[];
} {
  if (!preferences.enabled) {
    return { dueLive: [], dueMissed: [], allDue: [] };
  }

  const logMap: Record<string, FiredReminderRecord> =
    firedLog instanceof Map ? Object.fromEntries(firedLog) : firedLog || {};

  const candidates = generateReminderCandidates(events, preferences);
  const currentMs = currentTime.getTime();
  const liveWindowMs = liveWindowMinutes * 60 * 1000;

  const dueLive: DueReminder[] = [];
  const dueMissed: DueReminder[] = [];
  const allDue: DueReminder[] = [];

  for (const candidate of candidates) {
    // Deduplication check: ignore if already fired
    if (logMap[candidate.key]) {
      continue;
    }

    const triggerMs = candidate.triggerTime.getTime();
    const eventStartsAt = candidate.event.startsAt instanceof Date
      ? candidate.event.startsAt.getTime()
      : new Date(candidate.event.startsAt).getTime();

    const isAllDay = candidate.event.isAllDay || candidate.event.type === 'tournament';
    // For regular rooms, ignore if started more than 1 hour ago
    if (!isAllDay && eventStartsAt < currentMs - 60 * 60 * 1000) {
      continue;
    }
    // For all-day tournaments, valid until end of tournament day
    if (isAllDay) {
      const dayOf9Am = getVn9AmForDate(new Date(eventStartsAt));
      const endOfTournamentDay = dayOf9Am.getTime() + 15 * 60 * 60 * 1000; // 00:00 next day
      if (currentMs > endOfTournamentDay) {
        continue;
      }
    }

    // Is it due? (triggerTime <= currentTime)
    if (triggerMs <= currentMs) {
      const isMissed = currentMs - triggerMs > liveWindowMs;
      const dueItem: DueReminder = {
        key: candidate.key,
        event: candidate.event,
        triggerTime: candidate.triggerTime,
        leadTimeMinutes: candidate.leadTimeMinutes,
        leadTimeLabel: candidate.leadTimeLabel,
        isMissed,
        formattedEventTime: formatVnDateTime(candidate.event.startsAt),
      };

      allDue.push(dueItem);
      if (isMissed) {
        dueMissed.push(dueItem);
      } else {
        dueLive.push(dueItem);
      }
    }
  }

  // Sort by triggerTime ascending
  dueLive.sort((a, b) => a.triggerTime.getTime() - b.triggerTime.getTime());
  dueMissed.sort((a, b) => b.triggerTime.getTime() - a.triggerTime.getTime()); // recent missed first
  allDue.sort((a, b) => a.triggerTime.getTime() - b.triggerTime.getTime());

  return { dueLive, dueMissed, allDue };
}

/**
 * Prunes entries older than 30 days from the fired reminder log.
 */
export function pruneFiredLog(
  firedLog: Record<string, FiredReminderRecord>,
  currentTime: Date,
  maxAgeDays: number = 30
): Record<string, FiredReminderRecord> {
  const cutoffMs = currentTime.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
  const pruned: Record<string, FiredReminderRecord> = {};

  for (const [key, record] of Object.entries(firedLog)) {
    const firedMs = new Date(record.firedAt).getTime();
    if (!isNaN(firedMs) && firedMs >= cutoffMs) {
      pruned[key] = record;
    }
  }

  return pruned;
}
