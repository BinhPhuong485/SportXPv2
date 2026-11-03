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

const parityDir = path.join(__dirname, '..', 'parity-shots');
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

async function run() {
  console.log('1. Signing in Host bp@gmail.com...');
  await clientA.auth.signInWithPassword({ email: 'bp@gmail.com', password });

  const { data: courts } = await clientA.from('courts').select('id, name');
  // Choose court index 2 or 3 to avoid conflicts
  const court = courts[2] || courts[1] || courts[0];
  const courtId = court.id;
  console.log(`Using court: ${court.name} (${courtId})`);

  // Starts at 15:15 UTC+7 (today) to avoid conflict with existing match ending at 14:31
  const now = Date.now();
  const today1515 = new Date();
  today1515.setHours(15, 15, 0, 0);
  // If 15:15 has already passed, use tomorrow or now + 3 hours
  const startsAt = today1515.getTime() > now ? today1515 : new Date(now + 3 * 3600 * 1000);
  const endsAt = new Date(startsAt.getTime() + 2 * 3600 * 1000);

  console.log(`2. Creating [TEST] room starting at ${startsAt.toLocaleTimeString('vi-VN')}...`);
  const { data: roomId, error: errCreate } = await clientA.rpc('room_command_v2', {
    p_room_id: null,
    p_action: 'create',
    p_request_id: crypto.randomUUID(),
    p_payload: {
      court_id: courtId,
      title: '[TEST] Kèo Giao Lưu Chiều 15h15',
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      cancel_by: startsAt.toISOString(),
      capacity: 4,
      min_elo: 0,
      max_elo: 3000,
      fee: 25000,
      visibility: 'PUBLIC',
      host_plays: true,
      notes: '[TEST] Live toast trigger room with 3h lead time',
      court_label: 'Sân VIP 8',
      draft: false,
      room_code: `#XP-T${Date.now().toString().slice(-4)}`,
    },
  });
  if (errCreate) throw errCreate;
  createdRooms.push(roomId);
  console.log(`Created Room: ${roomId}`);

  await clientA.rpc('room_command_v2', {
    p_room_id: roomId,
    p_action: 'publish',
    p_request_id: crypto.randomUUID(),
    p_payload: {},
  });

  // Launch browser
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  console.log('3. Logging in as Account A...');
  await page.goto('http://localhost:5173/#/auth', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.type('input[type="email"]', 'bp@gmail.com');
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 2500));

  // Configure user preferences to include 30m lead time
  await page.evaluate(() => {
    // Find auth user id from supabase session in localStorage
    let uid = '';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const sess = JSON.parse(localStorage.getItem(k));
        uid = sess?.user?.id || '';
      }
    }
    const prefKey = `sportxp_reminders_pref_${uid}`;
    localStorage.setItem(
      prefKey,
      JSON.stringify({
        enabled: true,
        defaultLeadTimes: [1440, 180, 60, 30],
        browserNotificationsEnabled: true,
        overrides: {},
      })
    );
    // Clear fired log so it triggers fresh
    localStorage.removeItem(`sportxp_reminders_log_${uid}`);
    localStorage.removeItem(`sportxp_reminders_read_${uid}`);
    window.dispatchEvent(new CustomEvent('sportxp_reminders_updated'));
  });

  console.log('4. Navigating to /rooms to trigger live in-app Toast...');
  await page.goto('http://localhost:5173/#/rooms', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2500));

  const hasToast = await page.evaluate(() => {
    return Boolean(document.querySelector('[aria-live="polite"]'));
  });
  console.log(`Live Toast triggered: ${hasToast}`);

  console.log('5. Capturing Toast in 375px & 1440px (both themes)...');
  await captureDual(page, 'reminder-toast', { width: 375, height: 812 });
  await captureDual(page, 'reminder-toast', { width: 1440, height: 900 });

  console.log('6. Opening Bell Sheet from TopAppBar...');
  await page.evaluate(() => {
    const bell = document.querySelector('button[title="Thông báo"]');
    if (bell) bell.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await captureDual(page, 'notification-bell-sheet', { width: 375, height: 812 });
  await captureDual(page, 'notification-bell-sheet', { width: 1440, height: 900 });

  // Close Bell Sheet
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 500));

  console.log('7. Navigating to /profile to capture Reminder Settings Card...');
  await page.goto('http://localhost:5173/#/profile', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2500));

  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const h = headings.find((el) => el.textContent.includes('Nhắc lịch thi đấu'));
    if (h) h.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise((r) => setTimeout(r, 500));
  await captureDual(page, 'reminder-settings-card', { width: 375, height: 812 });
  await captureDual(page, 'reminder-settings-card', { width: 1440, height: 900 });

  console.log('8. Cleaning up and cancelling all [TEST] rooms...');
  for (const rId of createdRooms) {
    const { data: resCancel, error: errCancel } = await clientA.rpc('room_command_v2', {
      p_room_id: rId,
      p_action: 'cancel',
      p_request_id: crypto.randomUUID(),
      p_payload: { reason: '[TEST] Live toast capture complete' },
    });
    console.log(`Cancelled room ${rId}:`, resCancel, errCancel ? `Error: ${errCancel.message}` : 'OK');
  }

  await browser.close();
  console.log('Done!');
}

run().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
