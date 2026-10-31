import { CalendarEvent } from '../domain/calendarEvent';
import { getFormatLabel } from '../../tournaments/domain/tournament';

function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

/**
 * Folds a content line to a maximum of 75 octets (UTF-8 bytes) per RFC 5545 Section 3.1.
 * Continuation lines are prefixed with a single space.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const totalBytes = encoder.encode(line).length;
  if (totalBytes <= 75) return line;

  let result = '';
  let currentBytes = 0;
  let isFirstLine = true;
  const maxFirst = 75;
  const maxContinuation = 74; // 1 leading space + 74 bytes = 75 bytes

  for (const char of Array.from(line)) {
    const charBytes = encoder.encode(char).length;
    const limit = isFirstLine ? maxFirst : maxContinuation;

    if (currentBytes + charBytes > limit) {
      result += '\r\n ';
      result += char;
      currentBytes = charBytes;
      isFirstLine = false;
    } else {
      result += char;
      currentBytes += charBytes;
    }
  }

  return result;
}

/**
 * Generates RFC 5545 compliant VCALENDAR text.
 * Filter out cancelled events per requirement.
 */
export function generateIcs(events: CalendarEvent[]): string {
  // Do not export cancelled rooms per specification
  const validEvents = events.filter((ev) => !ev.isCancelled);

  const rawLines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SportXP//Badminton Calendar//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Lịch thi đấu SportXP',
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ];

  const baseUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://sportxp.app';

  for (const ev of validEvents) {
    rawLines.push('BEGIN:VEVENT');

    // Stable UID
    const eventId = ev.rawRoom?.id || ev.rawTournament?.id || ev.id.replace(/^(room|tournament)-/, '');
    const prefix = ev.type === 'tournament' ? 'sportxp-tournament' : 'sportxp-room';
    rawLines.push(`UID:${prefix}-${eventId}@sportxp.app`);

    // Stable DTSTAMP based on event start time
    const dtstamp = formatUtc(ev.startsAt);
    rawLines.push(`DTSTAMP:${dtstamp}`);

    if (ev.isAllDay) {
      rawLines.push(`DTSTART;VALUE=DATE:${formatDateOnly(ev.startsAt)}`);
      // Exclusive next day for all-day DTEND
      const nextDay = new Date(ev.endsAt.getTime() + 86400000);
      rawLines.push(`DTEND;VALUE=DATE:${formatDateOnly(nextDay)}`);
    } else {
      rawLines.push(`DTSTART:${formatUtc(ev.startsAt)}`);
      rawLines.push(`DTEND:${formatUtc(ev.endsAt)}`);
    }

    rawLines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    rawLines.push(`LOCATION:${escapeIcsText(ev.subtitle)}`);
    rawLines.push('STATUS:CONFIRMED');

    // Rich DESCRIPTION
    if (ev.type === 'tournament') {
      const t = ev.rawTournament;
      const venueStr = t ? `${t.venueName}${t.address ? ' - ' + t.address : ''}` : ev.subtitle;
      const formatStr = t ? getFormatLabel(t.format) : 'Đôi Nam/Nữ';
      const feeStr = t ? `${(t.entryFee || 0).toLocaleString('vi-VN')} đ` : '0 đ';
      const desc = [
        `Môn: Cầu lông`,
        `Địa điểm: ${venueStr}`,
        `Thể thức: ${formatStr}`,
        `Lệ phí: ${feeStr}`,
      ].join('\n');
      rawLines.push(`DESCRIPTION:${escapeIcsText(desc)}`);

      // All-day tournament reminders: 09:00 the day before & 09:00 on the day
      // Local 09:00 Asia/Ho_Chi_Minh is 02:00:00Z UTC
      const startDt = new Date(ev.startsAt);
      const dayOfUtc = new Date(Date.UTC(startDt.getFullYear(), startDt.getMonth(), startDt.getDate(), 2, 0, 0));
      const dayBeforeUtc = new Date(dayOfUtc.getTime() - 86400000);

      rawLines.push('BEGIN:VALARM');
      rawLines.push('ACTION:DISPLAY');
      rawLines.push('DESCRIPTION:Nhắc nhở: Giải đấu diễn ra vào ngày mai lúc 09:00');
      rawLines.push(`TRIGGER;VALUE=DATE-TIME:${formatUtc(dayBeforeUtc)}`);
      rawLines.push('END:VALARM');

      rawLines.push('BEGIN:VALARM');
      rawLines.push('ACTION:DISPLAY');
      rawLines.push('DESCRIPTION:Nhắc nhở: Giải đấu bắt đầu hôm nay lúc 09:00');
      rawLines.push(`TRIGGER;VALUE=DATE-TIME:${formatUtc(dayOfUtc)}`);
      rawLines.push('END:VALARM');
    } else {
      // Room event
      const r = ev.rawRoom;
      const codeStr = ev.roomCode || r?.roomCode || '#XP-ROOM';
      const addrStr = r?.address || ev.subtitle;
      const linkStr = `${baseUrl}/#/rooms/${r?.id || eventId}`;
      const desc = [
        `Môn: Cầu lông`,
        `Mã phòng: ${codeStr}`,
        `Địa chỉ sân: ${addrStr}`,
        `Đường dẫn tham gia: ${linkStr}`,
      ].join('\n');
      rawLines.push(`DESCRIPTION:${escapeIcsText(desc)}`);

      // Timed reminders: 1 day before & 1 hour before
      rawLines.push('BEGIN:VALARM');
      rawLines.push('ACTION:DISPLAY');
      rawLines.push('DESCRIPTION:Nhắc nhở: Buổi chơi cầu lông SportXP vào ngày mai');
      rawLines.push('TRIGGER:-P1D');
      rawLines.push('END:VALARM');

      rawLines.push('BEGIN:VALARM');
      rawLines.push('ACTION:DISPLAY');
      rawLines.push('DESCRIPTION:Nhắc nhở: Buổi chơi cầu lông SportXP bắt đầu sau 1 giờ');
      rawLines.push('TRIGGER:-PT1H');
      rawLines.push('END:VALARM');
    }

    rawLines.push('END:VEVENT');
  }

  rawLines.push('END:VCALENDAR');

  // Apply line folding and join with CRLF
  const foldedLines = rawLines.map((line) => foldLine(line));
  return foldedLines.join('\r\n') + '\r\n';
}

export function downloadIcs(events: CalendarEvent[], filename = 'sportxp-schedule.ics'): void {
  const icsContent = generateIcs(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
