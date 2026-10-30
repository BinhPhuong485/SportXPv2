const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const env = fs.readFileSync('E:/SQUARE/STUDY/EXE/v3/.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function runSessionFlow() {
  console.log('=== 1. PREPARING ROOM ON SUPABASE ===');

  // Login Account A
  const rA = await fetch(url + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key },
    body: JSON.stringify({ email: 'bp@gmail.com', password: '12345678@' }),
  });
  const dataA = await rA.json();
  const tokenA = dataA.access_token;
  const userA = dataA.user;

  // Login Account B
  const rB = await fetch(url + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key },
    body: JSON.stringify({ email: 'domixi@gmail.com', password: '12345678@' }),
  });
  const dataB = await rB.json();
  const tokenB = dataB.access_token;
  const userB = dataB.user;

  // Fetch real court id
  const courtsRes = await fetch(url + '/rest/v1/courts?select=id,name&limit=1', {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  const courts = await courtsRes.json();
  const courtId = courts[0]?.id || null;
  console.log('Using court:', courtId);

  // Create room with starts_at = now + 5s
  const now = Date.now();
  const startsAt = new Date(now + 5000).toISOString();
  const endsAt = new Date(now + 7200000).toISOString();
  const cancelBy = startsAt;

  const createRes = await fetch(url + '/rest/v1/rpc/room_command_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: 'Bearer ' + tokenA,
    },
    body: JSON.stringify({
      p_request_id: crypto.randomUUID(),
      p_action: 'create',
      p_room_id: null,
      p_payload: {
        title: '[TEST] Session Parity Flow',
        court_id: courtId,
        starts_at: startsAt,
        ends_at: endsAt,
        cancel_by: cancelBy,
        capacity: 2,
        fee: 50000,
        min_elo: 0,
        max_elo: 3000,
        visibility: 'PUBLIC',
        host_plays: true,
        notes: '[TEST] Session Flow',
        court_label: 'Sân 1',
        draft: false,
        room_code: '#XP-LIVE' + Math.floor(Math.random() * 899 + 100),
      },
    }),
  });
  const roomId = await createRes.json();
  console.log('Created room:', roomId);

  // Account B joins room -> Room becomes FULL (2/2)
  const joinRes = await fetch(url + '/rest/v1/rpc/room_command_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: 'Bearer ' + tokenB,
    },
    body: JSON.stringify({
      p_request_id: crypto.randomUUID(),
      p_action: 'join',
      p_room_id: roomId,
      p_payload: { expected_revision: 1 },
    }),
  });
  console.log('Account B joined room:', await joinRes.json());

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // 2. CAPTURE FULL ROOM (Flutter & React)
    console.log('=== 2. CAPTURING FULL ROOM ===');
    const fPage = await browser.newPage();
    await fPage.setViewport({ width: 375, height: 812 });
    await fPage.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Log in Flutter
    await fPage.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 150));
    await fPage.keyboard.type('bp@gmail.com', { delay: 15 });
    await fPage.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 150));
    await fPage.keyboard.type('12345678@', { delay: 15 });
    await fPage.mouse.click(187, 435);
    await new Promise((r) => setTimeout(r, 6000));

    // Click on the first RoomCard (our newly created full room)
    console.log('Opening full room detail in Flutter...');
    await fPage.mouse.click(187, 290);
    await new Promise((r) => setTimeout(r, 3000));
    console.log('Capturing room-detail-full-375px-flutter.png...');
    await fPage.screenshot({ path: path.join(parityDir, 'room-detail-full-375px-flutter.png') });

    // React Full Room
    const rPage = await browser.newPage();
    await rPage.setViewport({ width: 375, height: 812 });
    await rPage.goto(`http://localhost:5174/rooms/${roomId}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));
    console.log('Capturing room-detail-full-375px-react.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-detail-full-375px-react.png') });

    // 3. START ROOM (starts_at reached)
    console.log('=== 3. STARTING ROOM ===');
    await new Promise((r) => setTimeout(r, 6000)); // wait for now >= starts_at
    const startRes = await fetch(url + '/rest/v1/rpc/room_command_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: 'Bearer ' + tokenA,
      },
      body: JSON.stringify({
        p_request_id: crypto.randomUUID(),
        p_action: 'start',
        p_room_id: roomId,
        p_payload: {},
      }),
    });
    console.log('Room started status:', await startRes.json());

    // 4. CAPTURE IN-PROGRESS STATE
    console.log('=== 4. CAPTURING IN-PROGRESS SESSION ===');
    // Flutter in-progress room detail
    await fPage.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 3000));
    console.log('Capturing room-detail-in-progress-375px-flutter.png...');
    await fPage.screenshot({ path: path.join(parityDir, 'room-detail-in-progress-375px-flutter.png') });

    // React session page in-progress (Account A Host)
    await rPage.goto(`http://localhost:5174/rooms/${roomId}/session`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    // Record a match in session
    console.log('Creating match in React session...');
    await rPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Ghi trận')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    // Submit match dialog
    await rPage.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Gửi kết quả')
      );
      if (submitBtn) submitBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    console.log('Capturing room-session-in-progress-375px-react.png (Light)...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-session-in-progress-375px-react.png') });

    // React dark in-progress
    await rPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing room-session-in-progress-375px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-session-in-progress-375px-react-dark.png') });

    // React 1440px in-progress
    await rPage.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await rPage.setViewport({ width: 1440, height: 900 });
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing room-session-in-progress-1440px-react.png (Light)...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-session-in-progress-1440px-react.png') });

    await rPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing room-session-in-progress-1440px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-session-in-progress-1440px-react-dark.png') });

    // 5. FINISH SESSION & CAPTURE FINISHED STATE WITH SUMMARY DIALOG
    console.log('=== 5. FINISHING SESSION ===');
    const finishRes = await fetch(url + '/rest/v1/rpc/room_command_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: 'Bearer ' + tokenA,
      },
      body: JSON.stringify({
        p_request_id: crypto.randomUUID(),
        p_action: 'finish',
        p_room_id: roomId,
        p_payload: {},
      }),
    });
    console.log('Room finished status:', await finishRes.json());

    // Reload React session page (status is now COMPLETED)
    await rPage.setViewport({ width: 375, height: 812 });
    await rPage.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await rPage.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));

    console.log('Capturing room-session-finished-375px-react.png (Light)...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-session-finished-375px-react.png') });

    // Open Summary Dialog in 375px
    console.log('Opening Summary Dialog in 375px...');
    await rPage.evaluate(() => {
      const summaryBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Xem tổng kết')
      );
      if (summaryBtn) summaryBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing room-session-summary-dialog-375px-react.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-session-summary-dialog-375px-react.png') });

    // Dark finished state
    await rPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing room-session-finished-375px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-session-finished-375px-react-dark.png') });

    // 1440px Finished State & Summary Dialog
    await rPage.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await rPage.setViewport({ width: 1440, height: 900 });
    await new Promise((r) => setTimeout(r, 800));

    console.log('Capturing room-session-summary-dialog-1440px-react.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-session-summary-dialog-1440px-react.png') });

    // Close summary dialog
    await rPage.keyboard.press('Escape');
    await rPage.mouse.click(720, 50);
    await new Promise((r) => setTimeout(r, 500));

    console.log('Capturing room-session-finished-1440px-react.png (Light)...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-session-finished-1440px-react.png') });

    await rPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing room-session-finished-1440px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'room-session-finished-1440px-react-dark.png') });

    // 6. CAPTURE CANCELLED ROOM IN FLUTTER
    console.log('=== 6. CAPTURING CANCELLED ROOM IN FLUTTER ===');
    // In Flutter, go back to rooms list, switch to subtab 'Lịch sử' and click on cancelled room
    await fPage.mouse.click(20, 40); // back arrow in AppBar
    await new Promise((r) => setTimeout(r, 2000));
    // Click "Buổi của tôi" tab (around x: 280, y: 80)
    await fPage.mouse.click(280, 80);
    await new Promise((r) => setTimeout(r, 1500));
    // Click "Lịch sử" tab (around x: 280, y: 130)
    await fPage.mouse.click(280, 130);
    await new Promise((r) => setTimeout(r, 2000));
    // Click the first card in history (a cancelled room)
    await fPage.mouse.click(187, 220);
    await new Promise((r) => setTimeout(r, 2500));
    console.log('Capturing room-detail-cancelled-375px-flutter.png...');
    await fPage.screenshot({ path: path.join(parityDir, 'room-detail-cancelled-375px-flutter.png') });

    console.log('All session and state captures completed successfully!');
  } finally {
    await browser.close();
  }
}

runSessionFlow().catch(console.error);
