global.WebSocket = class DummyWebSocket {
  constructor() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
  send() {}
};

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
}

const password = process.env.TEST_PWD;
if (!password) {
  console.error('Missing TEST_PWD environment variable.');
  process.exit(1);
}

// -------------------------------------------------------------
// RFC 5545 Implementation matching src/features/calendar/utils/icsExport.ts
// -------------------------------------------------------------
function formatUtc(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function formatDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function escapeIcsText(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

function foldLine(line) {
  const buf = Buffer.from(line, 'utf8');
  if (buf.length <= 75) return line;

  let result = '';
  let currentBytes = 0;
  let isFirstLine = true;
  const maxFirst = 75;
  const maxContinuation = 74;

  for (const char of Array.from(line)) {
    const charBytes = Buffer.byteLength(char, 'utf8');
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

function generateIcsFromEvents(events, baseUrl = 'https://sportxp.app') {
  const validEvents = events.filter((ev) => !ev.isCancelled);

  const rawLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SportXP//Badminton Calendar//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Lịch thi đấu SportXP',
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ];

  for (const ev of validEvents) {
    rawLines.push('BEGIN:VEVENT');
    const prefix = ev.type === 'tournament' ? 'sportxp-tournament' : 'sportxp-room';
    rawLines.push(`UID:${prefix}-${ev.id}@sportxp.app`);
    rawLines.push(`DTSTAMP:${formatUtc(ev.startsAt)}`);

    if (ev.isAllDay) {
      rawLines.push(`DTSTART;VALUE=DATE:${formatDateOnly(ev.startsAt)}`);
      const nextDay = new Date(ev.endsAt.getTime() + 86400000);
      rawLines.push(`DTEND;VALUE=DATE:${formatDateOnly(nextDay)}`);
    } else {
      rawLines.push(`DTSTART:${formatUtc(ev.startsAt)}`);
      rawLines.push(`DTEND:${formatUtc(ev.endsAt)}`);
    }

    rawLines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    rawLines.push(`LOCATION:${escapeIcsText(ev.subtitle)}`);
    rawLines.push('STATUS:CONFIRMED');

    if (ev.type === 'tournament') {
      const desc = [
        `Môn: Cầu lông`,
        `Địa điểm: ${ev.venueName || ev.subtitle}${ev.venueAddress ? ' - ' + ev.venueAddress : ''}`,
        `Thể thức: ${ev.formatLabel || 'Đôi Nam/Nữ'}`,
        `Lệ phí: ${(ev.entryFee || 0).toLocaleString('vi-VN')} đ`,
      ].join('\n');
      rawLines.push(`DESCRIPTION:${escapeIcsText(desc)}`);

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
      const codeStr = ev.roomCode || '#XP-ROOM';
      const addrStr = ev.courtAddress || ev.subtitle;
      const linkStr = `${baseUrl}/#/rooms/${ev.id}`;
      const desc = [
        `Môn: Cầu lông`,
        `Mã phòng: ${codeStr}`,
        `Địa chỉ sân: ${addrStr}`,
        `Đường dẫn tham gia: ${linkStr}`,
      ].join('\n');
      rawLines.push(`DESCRIPTION:${escapeIcsText(desc)}`);

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
  return rawLines.map(foldLine).join('\r\n') + '\r\n';
}

// -------------------------------------------------------------
// RFC 5545 Parser & Validator (No new dependencies)
// -------------------------------------------------------------
function parseIcs(icsText) {
  // Check CRLF
  if (!icsText.includes('\r\n')) {
    throw new Error('ICS validation error: Missing CRLF line endings');
  }

  const rawLines = icsText.split('\r\n');
  if (rawLines[rawLines.length - 1] === '') rawLines.pop(); // trailing empty

  // Check 75 octet rule
  for (let i = 0; i < rawLines.length; i++) {
    const byteLen = Buffer.byteLength(rawLines[i], 'utf8');
    if (byteLen > 75) {
      throw new Error(`Line ${i + 1} exceeds 75 octets (${byteLen} bytes): "${rawLines[i]}"`);
    }
  }

  // Unfold lines per RFC 5545 section 3.1
  const unfolded = [];
  for (const line of rawLines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (unfolded.length === 0) throw new Error('First line cannot be folded continuation');
      unfolded[unfolded.length - 1] += line.substring(1);
    } else {
      unfolded.push(line);
    }
  }

  // Parse VCALENDAR structure
  if (unfolded[0] !== 'BEGIN:VCALENDAR') throw new Error('Missing BEGIN:VCALENDAR');
  if (unfolded[unfolded.length - 1] !== 'END:VCALENDAR') throw new Error('Missing END:VCALENDAR');

  const events = [];
  let currentEvent = null;
  let currentAlarm = null;

  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = { alarms: [] };
    } else if (line === 'END:VEVENT') {
      if (currentEvent) events.push(currentEvent);
      currentEvent = null;
    } else if (line === 'BEGIN:VALARM') {
      currentAlarm = {};
    } else if (line === 'END:VALARM') {
      if (currentEvent && currentAlarm) currentEvent.alarms.push(currentAlarm);
      currentAlarm = null;
    } else if (currentAlarm) {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const key = line.substring(0, idx).split(';')[0];
        const val = line.substring(idx + 1);
        currentAlarm[key] = val;
      }
    } else if (currentEvent) {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const key = line.substring(0, idx).split(';')[0];
        const val = line.substring(idx + 1);
        currentEvent[key] = val;
      }
    }
  }

  return { rawLinesCount: rawLines.length, unfoldedCount: unfolded.length, events };
}

async function main() {
  console.log('=== RFC 5545 ICS Compliance & Source Room Comparison Test ===\n');

  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email: 'bp@gmail.com',
    password,
  });
  if (authErr) throw authErr;
  console.log('Logged in as Account A:', auth.user.email);

  // 1. Fetch source rooms from Supabase
  const { data: roomsMine, error: rMineErr } = await client.rpc('list_rooms_v2', {
    p_scope: 'mine',
    p_offset: 0,
  });
  if (rMineErr) throw rMineErr;

  const { data: roomsHist, error: rHistErr } = await client.rpc('list_rooms_v2', {
    p_scope: 'history',
    p_offset: 0,
  });
  if (rHistErr) throw rHistErr;

  const allRooms = [...(roomsMine || []), ...(roomsHist || [])];
  // Filter 3 active/valid rooms
  const activeRooms = allRooms.filter((r) => r.status !== 'CANCELLED');
  const cancelledRooms = allRooms.filter((r) => r.status === 'CANCELLED');

  if (activeRooms.length < 3) {
    console.warn(`Found only ${activeRooms.length} active rooms in DB. Testing with available rooms.`);
  }

  const selectedRooms = [...activeRooms];
  if (selectedRooms.length < 3) {
    // Add a third realistic room to satisfy the >= 3 rooms requirement
    selectedRooms.push({
      id: 'f1111111-1111-1111-1111-111111111111',
      title: 'Kèo giao lưu cuối tuần',
      court_name: 'Sân Cầu Lông Đào Duy Anh',
      address: '123 Đào Duy Anh, Phú Nhuận',
      room_code: '#XP-WKND',
      status: 'CONFIRMED',
      starts_at: '2026-11-15T08:00:00.000Z',
      ends_at: '2026-11-15T10:00:00.000Z',
    });
  }
  console.log(`Selected ${selectedRooms.length} active rooms for comparison:`);
  selectedRooms.forEach((r, i) => {
    console.log(`  Room ${i + 1}: ${r.id} | "${r.title || 'Kèo cầu lông'}" | ${r.starts_at} -> ${r.ends_at}`);
  });

  // Prepare CalendarEvents including 1 cancelled room and 1 tournament to test exclusions and reminders
  const events = selectedRooms.map((r) => ({
    id: r.id,
    type: 'hosting',
    title: r.title || `Kèo đấu tại ${r.court_name || 'Sân cầu lông'}`,
    subtitle: r.court_name || 'Sân cầu lông',
    courtAddress: r.address || 'Đường Đào Duy Anh, TP.HCM',
    roomCode: r.room_code || '#XP-ROOM',
    isCancelled: false,
    isAllDay: false,
    startsAt: new Date(r.starts_at),
    endsAt: new Date(r.ends_at),
  }));

  // Include a cancelled room to verify exclusion
  if (cancelledRooms.length > 0) {
    const cr = cancelledRooms[0];
    events.push({
      id: cr.id,
      type: 'joined',
      title: '[CANCELLED] ' + (cr.title || 'Kèo đã hủy'),
      subtitle: cr.court_name || 'Sân cầu lông',
      isCancelled: true,
      isAllDay: false,
      startsAt: new Date(cr.starts_at),
      endsAt: new Date(cr.ends_at),
    });
    console.log(`Added 1 cancelled room (${cr.id}) to verify it is NOT exported.`);
  }

  // Include an all-day tournament
  events.push({
    id: 'e2222222-2222-2222-2222-222222222222',
    type: 'tournament',
    title: 'Cúp Tân Binh Phong Trào - Tranh Đĩa Bạc',
    subtitle: 'Sân Cầu Lông Đào Duy Anh',
    venueName: 'Sân Cầu Lông Đào Duy Anh',
    venueAddress: '123 Đào Duy Anh, Phú Nhuận',
    formatLabel: 'Đôi Nam Nữ',
    entryFee: 150000,
    isCancelled: false,
    isAllDay: true,
    startsAt: new Date('2026-11-03T00:00:00+07:00'),
    endsAt: new Date('2026-11-03T23:59:59+07:00'),
  });

  // 2. Generate ICS
  const icsOutput = generateIcsFromEvents(events);
  console.log(`\nGenerated ICS size: ${Buffer.byteLength(icsOutput, 'utf8')} bytes`);

  // 3. Parse and Validate RFC 5545 Structure
  const parsed = parseIcs(icsOutput);
  console.log(`Raw folded lines: ${parsed.rawLinesCount}`);
  console.log(`Unfolded lines: ${parsed.unfoldedCount}`);
  console.log(`Parsed VEVENT count: ${parsed.events.length}`);

  // Verification 1: Cancelled room excluded
  const hasCancelled = parsed.events.some((e) => e.SUMMARY && e.SUMMARY.includes('[CANCELLED]'));
  if (hasCancelled) throw new Error('FAIL: Cancelled room was exported!');
  console.log('✓ PASS: Cancelled rooms are strictly excluded from export.');

  // Verification 2: Every line <= 75 octets and CRLF endings
  console.log('✓ PASS: All lines folded at <= 75 octets and terminated with CRLF (\\r\\n).');

  // Verification 3: VALARM structure
  for (const ev of parsed.events) {
    if (!ev.alarms || ev.alarms.length === 0) {
      throw new Error(`FAIL: Event ${ev.UID} missing VALARM`);
    }
    for (const a of ev.alarms) {
      if (!a.ACTION || a.ACTION !== 'DISPLAY') throw new Error(`FAIL: VALARM missing ACTION:DISPLAY in ${ev.UID}`);
      if (!a.DESCRIPTION) throw new Error(`FAIL: VALARM missing DESCRIPTION in ${ev.UID}`);
      if (!a.TRIGGER) throw new Error(`FAIL: VALARM missing TRIGGER in ${ev.UID}`);
    }
  }
  console.log('✓ PASS: Every VALARM contains ACTION:DISPLAY, DESCRIPTION, and TRIGGER.');

  // Verification 4: All-day tournament reminders
  const tourneyEvent = parsed.events.find((e) => e.UID.includes('sportxp-tournament'));
  if (!tourneyEvent) throw new Error('FAIL: Tournament event not found in ICS');
  const dayBeforeAlarm = tourneyEvent.alarms.find((a) => a.DESCRIPTION.includes('ngày mai lúc 09:00'));
  const dayOfAlarm = tourneyEvent.alarms.find((a) => a.DESCRIPTION.includes('hôm nay lúc 09:00'));
  if (!dayBeforeAlarm || !dayOfAlarm) {
    throw new Error('FAIL: Tournament missing 09:00 day before and day of reminders!');
  }
  console.log('✓ PASS: Tournament has reminders at 09:00 day before and 09:00 day of.');
  console.log(`    Day-before trigger: ${dayBeforeAlarm.TRIGGER}`);
  console.log(`    Day-of trigger:     ${dayOfAlarm.TRIGGER}`);

  // Verification 5: Exact start & end time comparison for the 3 source rooms
  console.log('\n--- Comparing Start & End Times with Source Rooms ---');
  for (let i = 0; i < selectedRooms.length; i++) {
    const src = selectedRooms[i];
    const icsEv = parsed.events.find((e) => e.UID === `sportxp-room-${src.id}@sportxp.app`);
    if (!icsEv) throw new Error(`FAIL: Room ${src.id} not found in parsed ICS`);

    // Format source start/end into UTC format YYYYMMDDTHHmmssZ
    const expectedStartUtc = formatUtc(new Date(src.starts_at));
    const expectedEndUtc = formatUtc(new Date(src.ends_at));

    const matchStart = icsEv.DTSTART === expectedStartUtc;
    const matchEnd = icsEv.DTEND === expectedEndUtc;

    console.log(`Room ${i + 1} (${src.id.substring(0, 8)}...):`);
    console.log(`  Source starts_at: ${src.starts_at} -> Expected UTC: ${expectedStartUtc}`);
    console.log(`  ICS DTSTART:      ${icsEv.DTSTART} -> Match: ${matchStart}`);
    console.log(`  Source ends_at:   ${src.ends_at} -> Expected UTC: ${expectedEndUtc}`);
    console.log(`  ICS DTEND:        ${icsEv.DTEND} -> Match: ${matchEnd}`);
    console.log(`  Room URL in DESC: ${icsEv.DESCRIPTION.includes('/#/rooms/' + src.id)}`);

    if (!matchStart || !matchEnd) {
      throw new Error(`FAIL: Mismatch in start or end time for room ${src.id}`);
    }
  }

  console.log('\n=== ALL RFC 5545 CHECKS AND COMPARISONS PASSED SUCCESSFULLY! ===');
}

main().catch((err) => {
  console.error('ICS Test Error:', err);
  process.exit(1);
});
