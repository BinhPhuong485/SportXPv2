/**
 * Unit tests for in-app reminder engine with assert.
 * Tests pure logic: normal firing, lead times, changed start times, cancelled rooms,
 * midnight boundary, tournament all-day events, missed reminders, daylight-free UTC+7, no duplicates.
 */
const assert = require('assert');

// Pure engine logic mirroring src/features/reminders/domain/reminderEngine.ts
function formatVnDateTime(date) {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('hour')}:${get('minute')} · ${get('day')}/${get('month')}/${get('year')}`;
}

function getVn9AmForDate(date) {
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
  return new Date(Date.UTC(year, month - 1, day, 2, 0, 0, 0));
}

function getLeadTimeLabel(minutes) {
  if (minutes === 'tourney_day_before') return '09:00 hôm trước giải đấu';
  if (minutes === 'tourney_day_of') return '09:00 ngày khai mạc';
  const num = typeof minutes === 'number' ? minutes : parseInt(minutes, 10);
  if (num >= 1440) return `${Math.round(num / 1440)} ngày trước`;
  if (num >= 60) return `${Math.round(num / 60)} giờ trước`;
  return `${num} phút trước`;
}

function generateReminderCandidates(events, preferences) {
  if (!preferences.enabled) return [];
  const candidates = [];
  const defaultLeads = preferences.defaultLeadTimes && preferences.defaultLeadTimes.length > 0
    ? preferences.defaultLeadTimes
    : [1440, 60];

  for (const event of events) {
    if (event.isCancelled || event.status === 'CANCELLED') continue;

    const override = preferences.overrides && preferences.overrides[event.id];
    if (override && override.enabled === false) continue;

    const eventStartsAt = event.startsAt instanceof Date ? event.startsAt : new Date(event.startsAt);
    if (isNaN(eventStartsAt.getTime())) continue;

    if (event.isAllDay || event.type === 'tournament') {
      const dayOf9Am = getVn9AmForDate(eventStartsAt);
      const dayBefore9Am = new Date(dayOf9Am.getTime() - 24 * 60 * 60 * 1000);

      candidates.push({
        key: `${event.id}_${eventStartsAt.getTime()}_tourney_day_before`,
        event,
        triggerTime: dayBefore9Am,
        leadTimeMinutes: 'tourney_day_before',
        leadTimeLabel: getLeadTimeLabel('tourney_day_before'),
      });

      candidates.push({
        key: `${event.id}_${eventStartsAt.getTime()}_tourney_day_of`,
        event,
        triggerTime: dayOf9Am,
        leadTimeMinutes: 'tourney_day_of',
        leadTimeLabel: getLeadTimeLabel('tourney_day_of'),
      });
    } else {
      const leadTimes = override?.leadTimes && override.leadTimes.length > 0
        ? override.leadTimes
        : defaultLeads;

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

function evaluateDueReminders(events, preferences, firedLog, currentTime, liveWindowMinutes = 10) {
  if (!preferences.enabled) return { dueLive: [], dueMissed: [], allDue: [] };

  const logMap = firedLog instanceof Map ? Object.fromEntries(firedLog) : (firedLog || {});
  const candidates = generateReminderCandidates(events, preferences);
  const currentMs = currentTime.getTime();
  const liveWindowMs = liveWindowMinutes * 60 * 1000;

  const dueLive = [];
  const dueMissed = [];
  const allDue = [];

  for (const candidate of candidates) {
    if (logMap[candidate.key]) continue;

    const triggerMs = candidate.triggerTime.getTime();
    const eventStartsAt = candidate.event.startsAt instanceof Date
      ? candidate.event.startsAt.getTime()
      : new Date(candidate.event.startsAt).getTime();

    const isAllDay = candidate.event.isAllDay || candidate.event.type === 'tournament';
    // For regular rooms, ignore if started more than 1 hour ago
    if (!isAllDay && eventStartsAt < currentMs - 60 * 60 * 1000) continue;
    // For all-day tournaments, valid until end of tournament day
    if (isAllDay) {
      const dayOf9Am = getVn9AmForDate(new Date(eventStartsAt));
      const endOfTournamentDay = dayOf9Am.getTime() + 15 * 60 * 60 * 1000;
      if (currentMs > endOfTournamentDay) continue;
    }

    if (triggerMs <= currentMs) {
      const isMissed = currentMs - triggerMs > liveWindowMs;
      const dueItem = {
        key: candidate.key,
        event: candidate.event,
        triggerTime: candidate.triggerTime,
        leadTimeMinutes: candidate.leadTimeMinutes,
        leadTimeLabel: candidate.leadTimeLabel,
        isMissed,
        formattedEventTime: formatVnDateTime(candidate.event.startsAt),
      };

      allDue.push(dueItem);
      if (isMissed) dueMissed.push(dueItem);
      else dueLive.push(dueItem);
    }
  }

  dueLive.sort((a, b) => a.triggerTime.getTime() - b.triggerTime.getTime());
  dueMissed.sort((a, b) => b.triggerTime.getTime() - a.triggerTime.getTime());
  allDue.sort((a, b) => a.triggerTime.getTime() - b.triggerTime.getTime());

  return { dueLive, dueMissed, allDue };
}

function pruneFiredLog(firedLog, currentTime, maxAgeDays = 30) {
  const cutoffMs = currentTime.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
  const pruned = {};
  for (const [key, record] of Object.entries(firedLog)) {
    const firedMs = new Date(record.firedAt).getTime();
    if (!isNaN(firedMs) && firedMs >= cutoffMs) {
      pruned[key] = record;
    }
  }
  return pruned;
}

// ==================== TEST SUITE ====================
console.log('--- STARTING REMINDER ENGINE UNIT TESTS ---');

// Base Fixtures
const basePreferences = {
  enabled: true,
  defaultLeadTimes: [1440, 60],
  browserNotificationsEnabled: true,
  overrides: {},
};

// 1. Normal Firing Test
{
  console.log('[Test 1] Normal Firing (Room match due at trigger time)');
  // Room starts at 2026-11-01 18:00:00 UTC+7 (11:00:00 UTC)
  const roomStartsAt = new Date('2026-11-01T11:00:00.000Z');
  const roomEvent = {
    id: 'room-101',
    title: 'Giao lưu cầu lông Chiều Chủ Nhật',
    subtitle: 'Sân Cầu Lông Bình Triệu',
    type: 'joined',
    status: 'OPEN',
    isCancelled: false,
    startsAt: roomStartsAt,
    endsAt: new Date(roomStartsAt.getTime() + 2 * 3600000),
    isAllDay: false,
  };

  // Current time: 17:02:00 UTC+7 (10:02:00 UTC) -> 58 minutes before room, 2 minutes after 60m trigger
  const now = new Date('2026-11-01T10:02:00.000Z');
  // If 1-day reminder fired yesterday:
  const dayBeforeKey = `room-101_${roomStartsAt.getTime()}_1440`;
  const firedLog = {
    [dayBeforeKey]: {
      key: dayBeforeKey,
      eventId: 'room-101',
      startsAt: roomStartsAt.getTime(),
      leadTimeMinutes: 1440,
      firedAt: new Date(roomStartsAt.getTime() - 1440 * 60000).toISOString(),
    },
  };

  const result = evaluateDueReminders([roomEvent], basePreferences, firedLog, now, 10);

  assert.strictEqual(result.allDue.length, 1, 'Should find 1 due reminder (60m lead, since 1440m already fired)');
  assert.strictEqual(result.dueLive.length, 1, 'Should be live (fired within 10-minute window)');
  assert.strictEqual(result.dueMissed.length, 0, 'Should not be missed');
  assert.strictEqual(result.dueLive[0].leadTimeMinutes, 60);
  assert.strictEqual(result.dueLive[0].key, `room-101_${roomStartsAt.getTime()}_60`);
  console.log('  ✓ PASS: Normal firing successfully triggered 60m reminder live.');
}

// 2. Lead Times Test (1d, 3h, 1h, 30m choices)
{
  console.log('[Test 2] Lead Times Evaluation (1d, 3h, 1h, 30m)');
  const roomStartsAt = new Date('2026-11-02T10:00:00.000Z'); // 17:00 UTC+7
  const event = {
    id: 'room-custom-lead',
    title: 'Giải Đơn Nam',
    subtitle: 'Sân Kỳ Hòa',
    type: 'hosting',
    status: 'OPEN',
    isCancelled: false,
    startsAt: roomStartsAt,
    endsAt: new Date(roomStartsAt.getTime() + 7200000),
    isAllDay: false,
  };

  const customPrefs = {
    ...basePreferences,
    defaultLeadTimes: [1440, 180, 60, 30],
  };

  // Case A: 2 days before -> 0 due
  const time2DaysBefore = new Date(roomStartsAt.getTime() - 48 * 3600000);
  assert.strictEqual(evaluateDueReminders([event], customPrefs, {}, time2DaysBefore).allDue.length, 0);

  // Case B: Exactly 1 day before -> 1 due (1440m)
  const time1DayBefore = new Date(roomStartsAt.getTime() - 1440 * 60000);
  const res1d = evaluateDueReminders([event], customPrefs, {}, time1DayBefore);
  assert.strictEqual(res1d.allDue.length, 1);
  assert.strictEqual(res1d.allDue[0].leadTimeMinutes, 1440);

  // Case C: 35 minutes before -> 3 lead times due (1440, 180, 60)
  const time35mBefore = new Date(roomStartsAt.getTime() - 35 * 60000);
  const res35m = evaluateDueReminders([event], customPrefs, {}, time35mBefore);
  assert.strictEqual(res35m.allDue.length, 3, 'Should have 3 lead times due');

  // Case D: 25 minutes before -> all 4 lead times due (1440, 180, 60, 30)
  const time25mBefore = new Date(roomStartsAt.getTime() - 25 * 60000);
  const res25m = evaluateDueReminders([event], customPrefs, {}, time25mBefore);
  assert.strictEqual(res25m.allDue.length, 4, 'Should have all 4 lead times due');
  console.log('  ✓ PASS: All configured lead times (1440, 180, 60, 30) triggered at correct offsets.');
}

// 3. Changed Start Time Test
{
  console.log('[Test 3] Changed Start Time Rescheduling (Creates new reminder key)');
  const initialStartsAt = new Date('2026-11-01T11:00:00.000Z');
  const rescheduledStartsAt = new Date('2026-11-01T13:00:00.000Z'); // 2 hours later

  const eventV1 = {
    id: 'room-reschedule',
    title: 'Kèo chiều',
    subtitle: 'Sân Bình Triệu',
    status: 'OPEN',
    isCancelled: false,
    startsAt: initialStartsAt,
    isAllDay: false,
  };

  // Simulate that the 60m reminder for initial start time already fired and was logged
  const oldKey = `room-reschedule_${initialStartsAt.getTime()}_60`;
  const firedLog = {
    [oldKey]: {
      key: oldKey,
      eventId: 'room-reschedule',
      startsAt: initialStartsAt.getTime(),
      leadTimeMinutes: 60,
      firedAt: new Date(initialStartsAt.getTime() - 60 * 60000).toISOString(),
    },
  };

  // After room start time changed in Supabase:
  const eventV2 = {
    ...eventV1,
    startsAt: rescheduledStartsAt,
  };

  // Evaluated at 1 hour before the new start time
  const now = new Date(rescheduledStartsAt.getTime() - 59 * 60000);
  const singleLeadPref = {
    ...basePreferences,
    defaultLeadTimes: [60],
  };

  const res = evaluateDueReminders([eventV2], singleLeadPref, firedLog, now);

  assert.strictEqual(res.allDue.length, 1, 'Should fire new reminder for rescheduled time');
  assert.strictEqual(res.allDue[0].key, `room-reschedule_${rescheduledStartsAt.getTime()}_60`);
  assert.notStrictEqual(res.allDue[0].key, oldKey, 'Key must reflect new startsAt timestamp');
  console.log('  ✓ PASS: Changing start time generated a new unique key and fired without duplicate block.');
}

// 4. Cancelled Room Test
{
  console.log('[Test 4] Cancelled Room (Ignored)');
  const roomStartsAt = new Date('2026-11-01T11:00:00.000Z');
  const cancelledEvent1 = {
    id: 'room-cancel-1',
    title: 'Kèo bị hủy',
    status: 'CANCELLED',
    isCancelled: true,
    startsAt: roomStartsAt,
    isAllDay: false,
  };
  const cancelledEvent2 = {
    id: 'room-cancel-2',
    title: 'Kèo bị hủy bởi host',
    status: 'CANCELLED',
    isCancelled: false, // flag mismatch test
    startsAt: roomStartsAt,
    isAllDay: false,
  };

  const now = new Date(roomStartsAt.getTime() - 30 * 60000);
  const res1 = evaluateDueReminders([cancelledEvent1], basePreferences, {}, now);
  const res2 = evaluateDueReminders([cancelledEvent2], basePreferences, {}, now);

  assert.strictEqual(res1.allDue.length, 0, 'Cancelled room with isCancelled=true must be ignored');
  assert.strictEqual(res2.allDue.length, 0, 'Cancelled room with status=CANCELLED must be ignored');
  console.log('  ✓ PASS: Cancelled rooms are completely ignored.');
}

// 5. Midnight Boundary Test (Crossing 00:00 Asia/Ho_Chi_Minh)
{
  console.log('[Test 5] Midnight Boundary (Event at 00:30 UTC+7)');
  // Event starts at 2026-11-02 00:30:00 UTC+7 (2026-11-01 17:30:00 UTC)
  const midnightEventStartsAt = new Date('2026-11-01T17:30:00.000Z');
  const event = {
    id: 'room-midnight',
    title: 'Kèo Đêm',
    subtitle: 'Sân 247',
    status: 'OPEN',
    isCancelled: false,
    startsAt: midnightEventStartsAt,
    isAllDay: false,
  };

  // 1-hour lead time triggers at 23:30:00 UTC+7 on previous day (16:30:00 UTC)
  const triggerTimeExpected = new Date('2026-11-01T16:30:00.000Z');
  const now = new Date('2026-11-01T16:35:00.000Z'); // 23:35 UTC+7

  const prefs60m = {
    ...basePreferences,
    defaultLeadTimes: [60],
  };

  const res = evaluateDueReminders([event], prefs60m, {}, now);
  assert.strictEqual(res.allDue.length, 1);
  assert.strictEqual(res.allDue[0].triggerTime.getTime(), triggerTimeExpected.getTime());
  assert.strictEqual(formatVnDateTime(res.allDue[0].triggerTime), '23:30 · 01/11/2026');
  assert.strictEqual(formatVnDateTime(event.startsAt), '00:30 · 02/11/2026');
  console.log('  ✓ PASS: Midnight boundary correctly crosses from 02/11 00:30 to 01/11 23:30 in Asia/Ho_Chi_Minh.');
}

// 6. Tournament All-Day Event Test (09:00 day before and 09:00 on the day)
{
  console.log('[Test 6] Tournament All-Day Event (09:00 day before & 09:00 day of)');
  // Tournament starts on 2026-11-15 (in VN time)
  // 09:00 UTC+7 on 2026-11-15 is 2026-11-15T02:00:00.000Z
  // 09:00 UTC+7 on 2026-11-14 is 2026-11-14T02:00:00.000Z
  const tourneyEvent = {
    id: 'tournament-super-cup',
    title: 'SportXP Open Super Cup 2026',
    subtitle: 'CLB Phú Thọ',
    type: 'tournament',
    status: 'UPCOMING',
    isCancelled: false,
    startsAt: new Date('2026-11-15T00:00:00.000Z'),
    isAllDay: true,
  };

  // Case A: 2 days before at 12:00 UTC+7 -> 0 due
  const time2DaysBefore = new Date('2026-11-13T05:00:00.000Z');
  assert.strictEqual(evaluateDueReminders([tourneyEvent], basePreferences, {}, time2DaysBefore).allDue.length, 0);

  // Case B: Day before at 09:05 UTC+7 (02:05 UTC on 14/11) -> 1 due (tourney_day_before)
  const timeDayBefore905 = new Date('2026-11-14T02:05:00.000Z');
  const resDayBefore = evaluateDueReminders([tourneyEvent], basePreferences, {}, timeDayBefore905);
  assert.strictEqual(resDayBefore.allDue.length, 1);
  assert.strictEqual(resDayBefore.allDue[0].leadTimeMinutes, 'tourney_day_before');
  assert.strictEqual(formatVnDateTime(resDayBefore.allDue[0].triggerTime), '09:00 · 14/11/2026');

  // Case C: Day of tournament at 09:10 UTC+7 (02:10 UTC on 15/11) with day-before logged -> 1 due (tourney_day_of)
  const dayBeforeKey = `tournament-super-cup_${tourneyEvent.startsAt.getTime()}_tourney_day_before`;
  const firedLog = {
    [dayBeforeKey]: {
      key: dayBeforeKey,
      eventId: tourneyEvent.id,
      startsAt: tourneyEvent.startsAt.getTime(),
      leadTimeMinutes: 'tourney_day_before',
      firedAt: new Date('2026-11-14T02:00:00.000Z').toISOString(),
    },
  };

  const timeDayOf910 = new Date('2026-11-15T02:10:00.000Z');
  const resDayOf = evaluateDueReminders([tourneyEvent], basePreferences, firedLog, timeDayOf910);
  assert.strictEqual(resDayOf.allDue.length, 1);
  assert.strictEqual(resDayOf.allDue[0].leadTimeMinutes, 'tourney_day_of');
  assert.strictEqual(formatVnDateTime(resDayOf.allDue[0].triggerTime), '09:00 · 15/11/2026');
  console.log('  ✓ PASS: Tournament reminds at 09:00 day before and 09:00 day of in Asia/Ho_Chi_Minh.');
}

// 7. Reminder Missed While App Was Closed
{
  console.log('[Test 7] Reminder Missed While App Closed (Flagged as isMissed=true)');
  const roomStartsAt = new Date('2026-11-01T11:00:00.000Z'); // 18:00 UTC+7
  const event = {
    id: 'room-missed',
    title: 'Kèo Cầu Lông Đôi',
    subtitle: 'Sân Hàng Không',
    status: 'OPEN',
    isCancelled: false,
    startsAt: roomStartsAt,
    isAllDay: false,
  };

  // 1-hour lead time was at 17:00 UTC+7 (10:00 UTC).
  // User opened app at 17:45 UTC+7 (10:45 UTC), 45 minutes after trigger.
  const now = new Date('2026-11-01T10:45:00.000Z');
  const prefs60m = {
    ...basePreferences,
    defaultLeadTimes: [60],
  };
  const res = evaluateDueReminders([event], prefs60m, {}, now, 10); // 10m live window

  assert.strictEqual(res.allDue.length, 1);
  assert.strictEqual(res.dueLive.length, 0, 'Must NOT fire live toast if past window');
  assert.strictEqual(res.dueMissed.length, 1, 'Must be categorized into dueMissed for bell sheet');
  assert.strictEqual(res.dueMissed[0].isMissed, true);
  console.log('  ✓ PASS: Missed reminder accurately routed to dueMissed list for the bell sheet.');
}

// 8. Daylight-Free Time Zone Edge Cases (Constant UTC+7 offset)
{
  console.log('[Test 8] Daylight-Free Asia/Ho_Chi_Minh Edge Cases');
  // Vietnam has constant +07:00 all year round (no DST switch in March/October).
  const summerDate = new Date('2026-06-15T00:00:00.000Z');
  const winterDate = new Date('2026-12-15T00:00:00.000Z');

  const summer9Am = getVn9AmForDate(summerDate);
  const winter9Am = getVn9AmForDate(winterDate);

  // Both must be exactly 02:00:00 UTC
  assert.strictEqual(summer9Am.getUTCHours(), 2, 'Summer 09:00 VN must be 02:00 UTC');
  assert.strictEqual(winter9Am.getUTCHours(), 2, 'Winter 09:00 VN must be 02:00 UTC');
  assert.strictEqual(formatVnDateTime(summer9Am).startsWith('09:00'), true);
  assert.strictEqual(formatVnDateTime(winter9Am).startsWith('09:00'), true);
  console.log('  ✓ PASS: Vietnam timezone maintains strictly constant UTC+7 across all seasons.');
}

// 9. No Duplicates Test & Pruning
{
  console.log('[Test 9] No Duplicates Across Multiple Checks & Log Pruning');
  const roomStartsAt = new Date('2026-11-01T11:00:00.000Z');
  const event = {
    id: 'room-dedupe',
    title: 'Kèo Test Dedupe',
    status: 'OPEN',
    isCancelled: false,
    startsAt: roomStartsAt,
    isAllDay: false,
  };

  const key60 = `room-dedupe_${roomStartsAt.getTime()}_60`;
  const firedLog = {
    [key60]: {
      key: key60,
      eventId: 'room-dedupe',
      startsAt: roomStartsAt.getTime(),
      leadTimeMinutes: 60,
      firedAt: new Date().toISOString(),
    },
    // Old entry: 35 days ago
    'old_key_expired': {
      key: 'old_key_expired',
      eventId: 'old-1',
      startsAt: Date.now() - 36 * 86400000,
      leadTimeMinutes: 60,
      firedAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    },
  };

  const prefs60m = {
    ...basePreferences,
    defaultLeadTimes: [60],
  };
  const now = new Date(roomStartsAt.getTime() - 40 * 60000);
  const res = evaluateDueReminders([event], prefs60m, firedLog, now);
  assert.strictEqual(res.allDue.some((r) => r.key === key60), false, 'Already fired key must not duplicate');

  // Test Pruning
  const pruned = pruneFiredLog(firedLog, now, 30);
  assert.strictEqual(Object.keys(pruned).includes(key60), true, 'Recent record kept');
  assert.strictEqual(Object.keys(pruned).includes('old_key_expired'), false, 'Record > 30 days pruned');
  console.log('  ✓ PASS: Deduplication prevents duplicate reminders and pruning purges entries >30 days.');
}

console.log('--- ALL 9 REMINDER ENGINE UNIT TESTS PASSED SUCCESSFULLY ---');
