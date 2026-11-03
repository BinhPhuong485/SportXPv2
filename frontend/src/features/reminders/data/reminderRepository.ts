import {
  ReminderPreferences,
  DEFAULT_REMINDER_PREFERENCES,
  FiredReminderRecord,
  EventReminderOverride,
} from '../domain/reminderTypes';
import { pruneFiredLog } from '../domain/reminderEngine';

const PREF_KEY_PREFIX = 'sportxp_reminders_pref_';
const LOG_KEY_PREFIX = 'sportxp_reminders_log_';
const READ_KEY_PREFIX = 'sportxp_reminders_read_';

export class ReminderRepository {
  private getPrefKey(userId: string): string {
    return `${PREF_KEY_PREFIX}${userId || 'anon'}`;
  }

  private getLogKey(userId: string): string {
    return `${LOG_KEY_PREFIX}${userId || 'anon'}`;
  }

  private getReadKey(userId: string): string {
    return `${READ_KEY_PREFIX}${userId || 'anon'}`;
  }

  getPreferences(userId: string): ReminderPreferences {
    try {
      const raw = localStorage.getItem(this.getPrefKey(userId));
      if (!raw) return { ...DEFAULT_REMINDER_PREFERENCES };
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled ?? DEFAULT_REMINDER_PREFERENCES.enabled,
        defaultLeadTimes: Array.isArray(parsed.defaultLeadTimes) && parsed.defaultLeadTimes.length > 0
          ? parsed.defaultLeadTimes
          : DEFAULT_REMINDER_PREFERENCES.defaultLeadTimes,
        browserNotificationsEnabled: Boolean(parsed.browserNotificationsEnabled),
        overrides: parsed.overrides || {},
      };
    } catch {
      return { ...DEFAULT_REMINDER_PREFERENCES };
    }
  }

  savePreferences(userId: string, prefs: ReminderPreferences): void {
    try {
      localStorage.setItem(this.getPrefKey(userId), JSON.stringify(prefs));
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('sportxp_reminders_updated'));
    } catch (e) {
      console.warn('Failed to save reminder preferences to localStorage:', e);
    }
  }

  setEventOverride(
    userId: string,
    eventId: string,
    override: EventReminderOverride | null
  ): void {
    const current = this.getPreferences(userId);
    const overrides = { ...current.overrides };
    if (!override) {
      delete overrides[eventId];
    } else {
      overrides[eventId] = override;
    }
    this.savePreferences(userId, { ...current, overrides });
  }

  getFiredLog(userId: string): Record<string, FiredReminderRecord> {
    try {
      const raw = localStorage.getItem(this.getLogKey(userId));
      if (!raw) return {};
      const parsed: Record<string, FiredReminderRecord> = JSON.parse(raw);
      // Auto-prune >30 days
      const pruned = pruneFiredLog(parsed, new Date(), 30);
      if (Object.keys(pruned).length !== Object.keys(parsed).length) {
        localStorage.setItem(this.getLogKey(userId), JSON.stringify(pruned));
      }
      return pruned;
    } catch {
      return {};
    }
  }

  recordFired(userId: string, newRecords: FiredReminderRecord[]): void {
    if (!newRecords || newRecords.length === 0) return;
    try {
      const current = this.getFiredLog(userId);
      for (const rec of newRecords) {
        current[rec.key] = rec;
      }
      const pruned = pruneFiredLog(current, new Date(), 30);
      localStorage.setItem(this.getLogKey(userId), JSON.stringify(pruned));
      window.dispatchEvent(new CustomEvent('sportxp_reminders_log_updated'));
    } catch (e) {
      console.warn('Failed to record fired reminders to localStorage:', e);
    }
  }

  getReadKeys(userId: string): Set<string> {
    try {
      const raw = localStorage.getItem(this.getReadKey(userId));
      if (!raw) return new Set<string>();
      return new Set<string>(JSON.parse(raw));
    } catch {
      return new Set<string>();
    }
  }

  markReminderRead(userId: string, reminderKey: string): void {
    try {
      const current = this.getReadKeys(userId);
      current.add(reminderKey);
      localStorage.setItem(this.getReadKey(userId), JSON.stringify(Array.from(current)));
      window.dispatchEvent(new CustomEvent('sportxp_reminders_read_updated'));
    } catch (e) {
      console.warn('Failed to mark reminder read in localStorage:', e);
    }
  }

  markAllRemindersRead(userId: string, keys: string[]): void {
    try {
      const current = this.getReadKeys(userId);
      for (const k of keys) current.add(k);
      localStorage.setItem(this.getReadKey(userId), JSON.stringify(Array.from(current)));
      window.dispatchEvent(new CustomEvent('sportxp_reminders_read_updated'));
    } catch (e) {
      console.warn('Failed to mark all reminders read in localStorage:', e);
    }
  }

  /**
   * Listen to multi-tab storage updates
   */
  subscribeMultiTab(onSync: () => void): () => void {
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key &&
        (e.key.startsWith(PREF_KEY_PREFIX) ||
          e.key.startsWith(LOG_KEY_PREFIX) ||
          e.key.startsWith(READ_KEY_PREFIX))
      ) {
        onSync();
      }
    };

    const handleCustom = () => onSync();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('sportxp_reminders_updated', handleCustom);
    window.addEventListener('sportxp_reminders_log_updated', handleCustom);
    window.addEventListener('sportxp_reminders_read_updated', handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sportxp_reminders_updated', handleCustom);
      window.removeEventListener('sportxp_reminders_log_updated', handleCustom);
      window.removeEventListener('sportxp_reminders_read_updated', handleCustom);
    };
  }
}

export const reminderRepository = new ReminderRepository();
