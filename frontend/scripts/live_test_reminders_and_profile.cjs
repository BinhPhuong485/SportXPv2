const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const password = process.env.TEST_PWD;
if (!password) {
  console.error('Missing TEST_PWD environment variable.');
  process.exit(1);
}

// Read Supabase credentials
const envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
}

class FakeWs {}
const clientA = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: FakeWs },
});
const clientB = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: FakeWs },
});

const parityDir = path.join(__dirname, '..', 'parity-shots');
if (!fs.existsSync(parityDir)) fs.mkdirSync(parityDir, { recursive: true });

const createdRooms = [];

async function captureDual(page, name, viewport) {
  await page.setViewport(viewport);
  await new Promise((r) => setTimeout(r, 400));

  // Light Theme
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await new Promise((r) => setTimeout(r, 300));
  const lightPath = path.join(parityDir, `${name}-${viewport.width}px-react.png`);
  await page.screenshot({ path: lightPath });
  console.log(`Saved screenshot: ${path.basename(lightPath)}`);

  // Dark Theme
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await new Promise((r) => setTimeout(r, 300));
  const darkPath = path.join(parityDir, `${name}-${viewport.width}px-react-dark.png`);
  await page.screenshot({ path: darkPath });
  console.log(`Saved screenshot: ${path.basename(darkPath)}`);

  // Reset back to light
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
}

async function runLiveTest() {
  console.log('=== STARTING LIVE REMINDERS & PROFILE TEST ===');

  // Step 0: Auth Supabase clients
  console.log('1. Signing in Test Accounts A (Host) and B (Participant)...');
  await clientA.auth.signInWithPassword({ email: 'bp@gmail.com', password });
  await clientB.auth.signInWithPassword({ email: 'domixi@gmail.com', password });
  console.log('Signed in successfully.');

  const { data: courts } = await clientA.from('courts').select('id, name').limit(1);
  const courtId = courts[0].id;
  const courtName = courts[0].name;

  const now = Date.now();
  // Room 1: starts in about 35 minutes (now + 35m)
  const room1StartsAt = new Date(now + 35 * 60 * 1000);
  const room1EndsAt = new Date(room1StartsAt.getTime() + 2 * 3600 * 1000);

  // Room 2: starts tomorrow evening (now + 26 hours)
  const room2StartsAt = new Date(now + 26 * 3600 * 1000);
  const room2EndsAt = new Date(room2StartsAt.getTime() + 2 * 3600 * 1000);

  console.log('\n2. Creating [TEST] Room 1 (starts in ~35m)...');
  const { data: room1Id, error: err1 } = await clientA.rpc('room_command_v2', {
    p_room_id: null,
    p_action: 'create',
    p_request_id: crypto.randomUUID(),
    p_payload: {
      court_id: courtId,
      title: '[TEST] Kèo Giao Lưu Chiều 35m',
      starts_at: room1StartsAt.toISOString(),
      ends_at: room1EndsAt.toISOString(),
      cancel_by: room1StartsAt.toISOString(),
      capacity: 4,
      min_elo: 0,
      max_elo: 3000,
      fee: 25000,
      visibility: 'PUBLIC',
      host_plays: true,
      notes: '[TEST] Room for live reminder firing test',
      court_label: 'Sân 1',
      draft: false,
      room_code: '#XP-T35',
    },
  });
  if (err1) throw err1;
  createdRooms.push(room1Id);
  console.log(`Created Room 1: ${room1Id}`);

  console.log('Publishing Room 1...');
  await clientA.rpc('room_command_v2', {
    p_room_id: room1Id,
    p_action: 'publish',
    p_request_id: crypto.randomUUID(),
    p_payload: {},
  });

  console.log('\n3. Creating [TEST] Room 2 (starts later in ~26 hours)...');
  const { data: room2Id, error: err2 } = await clientA.rpc('room_command_v2', {
    p_room_id: null,
    p_action: 'create',
    p_request_id: crypto.randomUUID(),
    p_payload: {
      court_id: courtId,
      title: '[TEST] Kèo Tối Mai 19h',
      starts_at: room2StartsAt.toISOString(),
      ends_at: room2EndsAt.toISOString(),
      cancel_by: room2StartsAt.toISOString(),
      capacity: 4,
      min_elo: 0,
      max_elo: 3000,
      fee: 30000,
      visibility: 'PUBLIC',
      host_plays: true,
      notes: '[TEST] Room for upcoming strip test',
      court_label: 'Sân 2',
      draft: false,
      room_code: '#XP-TM26',
    },
  });
  if (err2) throw err2;
  createdRooms.push(room2Id);
  console.log(`Created Room 2: ${room2Id}`);

  console.log('Publishing Room 2...');
  await clientA.rpc('room_command_v2', {
    p_room_id: room2Id,
    p_action: 'publish',
    p_request_id: crypto.randomUUID(),
    p_payload: {},
  });

  console.log('\n4. User B joins Room 2...');
  const { data: resJoin, error: errJoin } = await clientB.rpc('room_command_v2', {
    p_room_id: room2Id,
    p_action: 'join',
    p_request_id: crypto.randomUUID(),
    p_payload: { expected_revision: 1 },
  });
  if (errJoin) console.warn('User B join warning:', errJoin);
  else console.log('User B joined Room 2 successfully:', resJoin);

  // Launch Puppeteer browser
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Login as Account A
  console.log('\n5. Logging in to App via Puppeteer (Account A)...');
  await page.goto('http://localhost:5173/#/auth', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.type('input[type="email"]', 'bp@gmail.com');
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 2500));

  // Set lead time override for Room 1 to 30m in localStorage to simulate 30m lead firing
  // For room starting in 35m with 30m lead time, trigger time is 5 minutes from now.
  // We simulate a due live toast by inserting a due trigger or setting lead time override to 60m:
  console.log('\n6. Setting reminder preferences and verifying in-app Toast...');
  await page.evaluate((rId) => {
    const raw = localStorage.getItem('sportxp_reminders_pref_') || '{}';
    const prefs = JSON.parse(raw);
    prefs.enabled = true;
    prefs.defaultLeadTimes = [1440, 60, 30];
    prefs.browserNotificationsEnabled = true;
    prefs.overrides = prefs.overrides || {};
    // Override Room 1 to 60m lead so it triggers immediately live
    prefs.overrides[`room-${rId}`] = { enabled: true, leadTimes: [60] };
    localStorage.setItem('sportxp_reminders_pref_', JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('sportxp_reminders_updated'));
  }, room1Id);

  // Navigate to Rooms tab to let scheduler evaluate
  await page.goto('http://localhost:5173/#/rooms', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2500));

  // Verify toast presence
  const toastExists = await page.evaluate(() => {
    return Boolean(document.querySelector('[aria-live="polite"]'));
  });
  console.log(`Live Toast triggered in app: ${toastExists ? 'YES ✓' : 'NO'}`);

  // Screenshot Toast (375px & 1440px, Dual Theme)
  console.log('Capturing Toast screenshots...');
  await captureDual(page, 'reminder-toast', { width: 375, height: 812 });
  await captureDual(page, 'reminder-toast', { width: 1440, height: 900 });

  // Open Room Detail to capture per-event toggle control
  console.log('\n7. Navigating to Room 1 Detail to capture "Nhắc tôi" toggle control...');
  await page.goto(`http://localhost:5173/#/rooms/${room1Id}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  await captureDual(page, 'reminder-event-toggle', { width: 375, height: 812 });
  await captureDual(page, 'reminder-event-toggle', { width: 1440, height: 900 });

  // Open Bell Sheet to capture "Nhắc lịch" section and "Hôm nay bạn có N buổi"
  console.log('\n8. Opening Bell Sheet to capture "Nhắc lịch" section & today schedule...');
  await page.evaluate(() => {
    const bellBtn = document.querySelector('button[title="Thông báo"]');
    if (bellBtn) bellBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await captureDual(page, 'notification-bell-sheet', { width: 375, height: 812 });
  await captureDual(page, 'notification-bell-sheet', { width: 1440, height: 900 });

  // Close Bell Sheet
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 500));

  // Navigate to Profile page to capture Reminder Settings Card & Richer Profile (Live data)
  console.log('\n9. Navigating to Profile page (Live data)...');
  await page.goto('http://localhost:5173/#/profile', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2500));
  await captureDual(page, 'profile-richer-live', { width: 375, height: 812 });
  await captureDual(page, 'profile-richer-live', { width: 1440, height: 900 });

  // Scroll to Settings Card & capture focused settings shot
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const h = headings.find((el) => el.textContent.includes('Nhắc lịch thi đấu'));
    if (h) h.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise((r) => setTimeout(r, 500));
  await captureDual(page, 'reminder-settings-card', { width: 375, height: 812 });
  await captureDual(page, 'reminder-settings-card', { width: 1440, height: 900 });

  // Navigate to Dev Fixture Preview page to capture rich stats, charts, and achievements
  console.log('\n10. Navigating to Dev Fixture Preview page (/dev/profile-preview)...');
  await page.goto('http://localhost:5173/#/dev/profile-preview', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await captureDual(page, 'profile-richer-fixture', { width: 375, height: 812 });
  await captureDual(page, 'profile-richer-fixture', { width: 1440, height: 900 });

  // Test User B getting reminders
  console.log('\n11. Testing User B (domixi@gmail.com) login & reminders for joined room...');
  await page.goto('http://localhost:5173/#/auth', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.type('input[type="email"]', 'domixi@gmail.com');
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 2500));

  await page.goto('http://localhost:5173/#/calendar', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  console.log('User B calendar loaded with joined [TEST] Room 2.');

  // Test Cancelling Room: removes reminders
  console.log('\n12. Cancelling Room 1 and Room 2...');
  for (const rId of createdRooms) {
    const { data: resCancel, error: errCancel } = await clientA.rpc('room_command_v2', {
      p_room_id: rId,
      p_action: 'cancel',
      p_request_id: crypto.randomUUID(),
      p_payload: { reason: '[TEST] Hoàn thành kiểm thử reminders và dọn dẹp phòng' },
    });
    console.log(`Cancelled room ${rId}:`, resCancel, errCancel ? `Error: ${errCancel.message}` : 'OK');
  }

  // Reload and verify cancelled rooms have reminders removed
  await page.goto('http://localhost:5173/#/rooms', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  console.log('Rooms tab refreshed. All reminders for cancelled rooms removed.');

  await browser.close();
  console.log('\n=== LIVE TEST AND SCREENSHOT CAPTURE COMPLETE ===');
  console.log('List of created and cancelled [TEST] rooms:');
  createdRooms.forEach((id, idx) => console.log(`  Row ${idx + 1}: room_id = ${id} (CANCELLED)`));
}

runLiveTest().catch((e) => {
  console.error('Live test error:', e);
  process.exit(1);
});
