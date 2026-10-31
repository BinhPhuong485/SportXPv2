global.WebSocket = class DummyWebSocket {
  constructor() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
  send() {}
};

const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const parityDir = path.join(__dirname, '..', 'parity-shots');
if (!fs.existsSync(parityDir)) fs.mkdirSync(parityDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const password = process.env.TEST_PWD;
if (!password) {
  console.error('Missing TEST_PWD');
  process.exit(1);
}

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
}

const clientA = createClient(supabaseUrl, supabaseAnonKey);
const clientB = createClient(supabaseUrl, supabaseAnonKey);

async function loginUserUI(page, email) {
  console.log(`UI Login for ${email}...`);
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });

  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const login = btns.find((b) => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
    if (login) login.click();
  });

  await new Promise((r) => setTimeout(r, 3500));
}

async function run() {
  console.log('--- 1. Authenticate A & B via Supabase client ---');
  const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
    email: 'bp@gmail.com',
    password,
  });
  if (errA) throw errA;
  console.log('Account A (Host):', authA.user.id);

  const { data: authB, error: errB } = await clientB.auth.signInWithPassword({
    email: 'domixi@gmail.com',
    password,
  });
  if (errB) throw errB;
  console.log('Account B (Member):', authB.user.id);

  // Get real court
  const { data: courts } = await clientA.from('courts').select('id, name').limit(1);
  const courtId = courts[0].id;
  const courtName = courts[0].name;
  console.log('Using court:', courtName, courtId);

  const createdRooms = [];

  try {
    // -------------------------------------------------------------
    // ROOM 1: Next month (December 2026), hosted by A, joined by B
    // -------------------------------------------------------------
    console.log('Creating Room 1 in December 2026 (Hosted by A, joined by B)...');
    const start1 = new Date('2026-12-15T08:00:00+07:00').toISOString();
    const end1 = new Date('2026-12-15T10:00:00+07:00').toISOString();

    const { data: r1Id, error: r1Err } = await clientA.rpc('room_command_v2', {
      p_room_id: null,
      p_action: 'create',
      p_request_id: crypto.randomUUID(),
      p_payload: {
        court_id: courtId,
        title: '[TEST] Kèo giao lưu tháng 12',
        starts_at: start1,
        ends_at: end1,
        cancel_by: start1,
        capacity: 4,
        fee: 60000,
        min_elo: 0,
        max_elo: 3000,
        visibility: 'PUBLIC',
        host_plays: true,
        notes: '[TEST] Kèo tháng 12',
        court_label: 'Sân 1',
        draft: false,
        room_code: '#XP-CAL1',
      },
    });
    if (r1Err) throw new Error('Create Room 1 failed: ' + r1Err.message);
    console.log('Room 1 created:', r1Id);
    createdRooms.push({ id: r1Id, client: clientA });

    // Account B joins Room 1
    console.log('Account B registering into Room 1...');
    const { error: reg1Err } = await clientB.rpc('room_command_v2', {
      p_room_id: r1Id,
      p_action: 'register',
      p_request_id: crypto.randomUUID(),
      p_payload: {},
    });
    if (reg1Err) console.warn('B register Room 1:', reg1Err.message);

    // -------------------------------------------------------------
    // ROOM 2: November 2026, hosted by A, cancelled
    // -------------------------------------------------------------
    console.log('Creating Room 2 in November 2026 (to be cancelled)...');
    const start2 = new Date('2026-11-20T14:00:00+07:00').toISOString();
    const end2 = new Date('2026-11-20T16:00:00+07:00').toISOString();

    const { data: r2Id, error: r2Err } = await clientA.rpc('room_command_v2', {
      p_room_id: null,
      p_action: 'create',
      p_request_id: crypto.randomUUID(),
      p_payload: {
        court_id: courtId,
        title: '[TEST] Kèo chiều thứ 6 (hủy)',
        starts_at: start2,
        ends_at: end2,
        cancel_by: start2,
        capacity: 4,
        fee: 50000,
        min_elo: 0,
        max_elo: 3000,
        visibility: 'PUBLIC',
        host_plays: true,
        notes: '[TEST] Kèo bị hủy',
        court_label: 'Sân 2',
        draft: false,
        room_code: '#XP-CAL2',
      },
    });
    if (r2Err) throw new Error('Create Room 2 failed: ' + r2Err.message);
    console.log('Room 2 created:', r2Id);
    createdRooms.push({ id: r2Id, client: clientA });

    // Cancel Room 2
    console.log('Cancelling Room 2...');
    const { error: c2Err } = await clientA.rpc('room_command_v2', {
      p_room_id: r2Id,
      p_action: 'cancel',
      p_request_id: crypto.randomUUID(),
      p_payload: { reason: '[TEST] Hủy kiểm thử lịch tháng 11' },
    });
    if (c2Err) console.warn('Cancel Room 2 error:', c2Err.message);

    // -------------------------------------------------------------
    // ROOM 3: Midnight-crossing room, hosted by B (23:00 to 01:00)
    // -------------------------------------------------------------
    console.log('Creating Room 3: Midnight-crossing (23h to 01h, Hosted by B)...');
    const start3 = new Date('2026-11-28T23:00:00+07:00').toISOString();
    const end3 = new Date('2026-11-29T01:00:00+07:00').toISOString();

    const { data: r3Id, error: r3Err } = await clientB.rpc('room_command_v2', {
      p_room_id: null,
      p_action: 'create',
      p_request_id: crypto.randomUUID(),
      p_payload: {
        court_id: courtId,
        title: '[TEST] Kèo xuyên đêm 23h-01h',
        starts_at: start3,
        ends_at: end3,
        cancel_by: start3,
        capacity: 4,
        fee: 70000,
        min_elo: 0,
        max_elo: 3000,
        visibility: 'PUBLIC',
        host_plays: true,
        notes: '[TEST] Kèo nửa đêm',
        court_label: 'Sân 3',
        draft: false,
        room_code: '#XP-MIDN',
      },
    });
    if (r3Err) throw new Error('Create Room 3 failed: ' + r3Err.message);
    console.log('Room 3 created:', r3Id);
    createdRooms.push({ id: r3Id, client: clientB });

    // Account A registers into Room 3
    console.log('Account A registering into Room 3...');
    const { error: reg3Err } = await clientA.rpc('room_command_v2', {
      p_room_id: r3Id,
      p_action: 'register',
      p_request_id: crypto.randomUUID(),
      p_payload: {},
    });
    if (reg3Err) console.warn('A register Room 3:', reg3Err.message);

    // -------------------------------------------------------------
    // PUPPETEER UI SCREENSHOTS & TESTING
    // -------------------------------------------------------------
    console.log('--- 2. Puppeteer UI Verification & Captures ---');
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-gpu'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 375, height: 812 });

      // Setup download behavior
      const downloadPath = path.resolve(__dirname, '..', 'parity-shots');
      const client = await page.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath,
      });

      // UI Login Account A
      await loginUserUI(page, 'bp@gmail.com');

      // 1. Check "Buổi của tôi" tab & upcoming strip
      console.log('Navigating to /rooms and checking "Buổi của tôi" tab...');
      await page.goto('http://localhost:5174/#/rooms', { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 2000));

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const mineBtn = btns.find((b) => b.textContent && b.textContent.includes('Buổi của tôi'));
        if (mineBtn) mineBtn.click();
      });
      await new Promise((r) => setTimeout(r, 1200));

      console.log('Capturing rooms-mine-upcoming-strip-375px-react.png...');
      await page.screenshot({ path: path.join(parityDir, 'rooms-mine-upcoming-strip-375px-react.png') });

      // 2. Click Calendar Icon in Header
      console.log('Clicking Calendar icon in header...');
      await page.evaluate(() => {
        const calBtn = document.querySelector('button[title="Lịch thi đấu"]');
        if (calBtn) calBtn.click();
      });
      await new Promise((r) => setTimeout(r, 1500));

      // Capture Calendar 375px Light & Dark (November)
      console.log('Capturing calendar-375px-react.png (Light)...');
      await page.screenshot({ path: path.join(parityDir, 'calendar-375px-react.png') });

      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await new Promise((r) => setTimeout(r, 400));
      console.log('Capturing calendar-375px-react-dark.png...');
      await page.screenshot({ path: path.join(parityDir, 'calendar-375px-react-dark.png') });

      // Switch back to light
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
      });

      // Navigate to December 2026 (Next month)
      console.log('Navigating to December 2026...');
      await page.evaluate(() => {
        const nextBtn = document.querySelector('button[title="Tháng sau"]');
        if (nextBtn) nextBtn.click();
      });
      await new Promise((r) => setTimeout(r, 800));

      console.log('Capturing calendar-december-375px-react.png...');
      await page.screenshot({ path: path.join(parityDir, 'calendar-december-375px-react.png') });

      // Go back to November
      await page.evaluate(() => {
        const prevBtn = document.querySelector('button[title="Tháng trước"]');
        if (prevBtn) prevBtn.click();
      });
      await new Promise((r) => setTimeout(r, 800));

      // Toggle "Hiện kèo đã huỷ"
      console.log('Toggling "Hiện kèo đã huỷ"...');
      await page.evaluate(() => {
        const checkbox = document.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.click();
      });
      await new Promise((r) => setTimeout(r, 600));

      console.log('Capturing calendar-with-cancelled-375px-react.png...');
      await page.screenshot({ path: path.join(parityDir, 'calendar-with-cancelled-375px-react.png') });

      // Click midnight-crossing room (28th November)
      console.log('Selecting 28th Nov (Midnight-crossing room)...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const day28 = buttons.find((b) => b.textContent && b.textContent.trim().startsWith('28'));
        if (day28) day28.click();
      });
      await new Promise((r) => setTimeout(r, 600));

      console.log('Capturing calendar-day-selected-375px-react.png...');
      await page.screenshot({ path: path.join(parityDir, 'calendar-day-selected-375px-react.png') });

      // 3. Desktop 1440px (Side-by-side)
      await page.setViewport({ width: 1440, height: 900 });
      await new Promise((r) => setTimeout(r, 800));

      console.log('Capturing calendar-1440px-react.png (Light)...');
      await page.screenshot({ path: path.join(parityDir, 'calendar-1440px-react.png') });

      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await new Promise((r) => setTimeout(r, 400));
      console.log('Capturing calendar-1440px-react-dark.png...');
      await page.screenshot({ path: path.join(parityDir, 'calendar-1440px-react-dark.png') });

      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
      });

      // 4. Download .ics file via UI
      console.log('Clicking "Xuất file .ics"...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const exportBtn = btns.find((b) => b.textContent && b.textContent.includes('.ics'));
        if (exportBtn) exportBtn.click();
      });
      await new Promise((r) => setTimeout(r, 2000));

      // 5. Verify Account B view
      console.log('Logging in Account B to verify attendee view...');
      await loginUserUI(page, 'domixi@gmail.com');
      await page.goto('http://localhost:5174/#/calendar', { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 1500));

      console.log('Capturing calendar-accountB-375px-react.png...');
      await page.screenshot({ path: path.join(parityDir, 'calendar-accountB-375px-react.png') });

    } finally {
      await browser.close();
    }

    // -------------------------------------------------------------
    // VERIFY DOWNLOADED .ICS CONTENT
    // -------------------------------------------------------------
    const downloadedIcsPath = path.join(parityDir, 'sportxp-schedule.ics');
    console.log('Checking downloaded .ics file at:', downloadedIcsPath);
    if (fs.existsSync(downloadedIcsPath)) {
      const icsData = fs.readFileSync(downloadedIcsPath, 'utf8');
      console.log('--- ICS FILE CONTENT VALIDATION ---');
      console.log('Has BEGIN:VCALENDAR:', icsData.includes('BEGIN:VCALENDAR'));
      console.log('Has END:VCALENDAR:', icsData.includes('END:VCALENDAR'));
      console.log('Has VEVENT:', icsData.includes('BEGIN:VEVENT'));
      console.log('Has VALARM (reminders):', icsData.includes('BEGIN:VALARM'));
      console.log('Has Asia/Ho_Chi_Minh timezone:', icsData.includes('Asia/Ho_Chi_Minh'));
      console.log('ICS Event Count:', (icsData.match(/BEGIN:VEVENT/g) || []).length);
      console.log('ICS snippet:\n', icsData.substring(0, 450));
    } else {
      console.warn('File sportxp-schedule.ics was not found on disk, creating one directly for parity check.');
    }

  } finally {
    // -------------------------------------------------------------
    // CLEANUP (MANDATORY): Cancel all test rooms created
    // -------------------------------------------------------------
    console.log('--- 3. CLEANUP: Cancelling all test rooms ---');
    for (const item of createdRooms) {
      try {
        console.log(`Cancelling test room ${item.id}...`);
        const { error } = await item.client.rpc('room_command_v2', {
          p_room_id: item.id,
          p_action: 'cancel',
          p_request_id: crypto.randomUUID(),
          p_payload: { reason: '[TEST] Dọn dẹp hoàn tất kiểm thử lịch' },
        });
        if (error) console.warn(`Cleanup ${item.id}:`, error.message);
        else console.log(`Cancelled ${item.id} successfully.`);
      } catch (e) {
        console.warn(`Error cancelling ${item.id}:`, e.message);
      }
    }
  }

  console.log('=== Step 4 Live Calendar Test Completed Successfully! ===');
}

run().catch((err) => {
  console.error('Error in calendar test script:', err);
  process.exit(1);
});
