import { CalendarEvent } from '../../calendar/domain/calendarEvent';

export type ReminderLeadTime = 1440 | 180 | 60 | 30; // 1 day, 3 hours, 1 hour, 30 minutes

export const DEFAULT_LEAD_TIMES: ReminderLeadTime[] = [1440, 60];

export const LEAD_TIME_OPTIONS: { value: ReminderLeadTime; label: string }[] = [
  { value: 1440, label: '1 ngày trước' },
  { value: 180, label: '3 giờ trước' },
  { value: 60, label: '1 giờ trước' },
  { value: 30, label: '30 phút trước' },
];

export interface EventReminderOverride {
  enabled: boolean;
  leadTimes?: ReminderLeadTime[];
}

export interface ReminderPreferences {
  enabled: boolean;
  defaultLeadTimes: ReminderLeadTime[];
  browserNotificationsEnabled: boolean;
  overrides: Record<string, EventReminderOverride>;
}

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enabled: true,
  defaultLeadTimes: [1440, 60],
  browserNotificationsEnabled: false,
  overrides: {},
};

export interface FiredReminderRecord {
  key: string;
  eventId: string;
  startsAt: number;
  leadTimeMinutes: number | string;
  firedAt: string;
  readAt?: string | null;
}

export interface DueReminder {
  key: string;
  event: CalendarEvent;
  triggerTime: Date;
  leadTimeMinutes: number | string;
  leadTimeLabel: string;
  isMissed: boolean; // Came due while app was closed / earlier
  formattedEventTime: string;
}
