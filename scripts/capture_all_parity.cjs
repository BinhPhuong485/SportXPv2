const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const distDir = path.join(__dirname, '..', 'dist');
const parityDir = path.join(__dirname, '..', 'parity-shots');

if (!fs.existsSync(parityDir)) {
  fs.mkdirSync(parityDir, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(distDir, reqPath);

  if (reqPath === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function captureAll() {
  await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));
  console.log('Static server started at http://127.0.0.1:4173');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // -------------------------------------------------------------
    // Context 1: Account A (Host - bp@gmail.com) Mobile 375x812
    // -------------------------------------------------------------
    const ctxA = await browser.createBrowserContext();
    const pageA = await ctxA.newPage();
    await pageA.setViewport({ width: 375, height: 812 });

    console.log('Context A: Logging in as bp@gmail.com...');
    await pageA.goto('http://127.0.0.1:4173/#/auth');
    await new Promise((r) => setTimeout(r, 800));
    await pageA.type('input[type="email"]', 'bp@gmail.com', { delay: 15 });
    await pageA.type('input[type="password"]', '12345678@', { delay: 15 });
    await pageA.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const login = btns.find((b) => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
      if (login) login.click();
    });

    console.log('Waiting for ManagedRoomsPage...');
    await pageA.waitForFunction(
      () => document.body.innerText.includes('Kèo đấu') && document.body.innerText.includes('[TEST]'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1200));

    // 1. RoomCard list (Light & Dark)
    console.log('Capturing room-card-list-375px-react.png...');
    await pageA.screenshot({ path: path.join(parityDir, 'room-card-list-375px-react.png') });

    // Toggle Dark theme
    console.log('Toggling Dark mode...');
    await pageA.evaluate(() => {
      const toggle = document.querySelector('button[title*="giao diện"], button[aria-label*="giao diện"]');
      if (toggle) toggle.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing room-card-list-375px-react-dark.png...');
    await pageA.screenshot({ path: path.join(parityDir, 'room-card-list-375px-react-dark.png') });

    // Switch back to Light
    await pageA.evaluate(() => {
      const toggle = document.querySelector('button[title*="giao diện"], button[aria-label*="giao diện"]');
      if (toggle) toggle.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // 2. RoomDetailPage Host (Open Room c91aed08-0874-4488-a870-0d915e413037)
    console.log('Navigating to RoomDetailPage Host...');
    await pageA.goto('http://127.0.0.1:4173/#/rooms/c91aed08-0874-4488-a870-0d915e413037');
    await pageA.waitForFunction(() => document.body.innerText.includes('Chi tiết buổi chơi'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));
    console.log('Capturing room-detail-host-375px-react.png...');
    await pageA.screenshot({ path: path.join(parityDir, 'room-detail-host-375px-react.png') });

    // Room Detail Dark
    await pageA.evaluate(() => {
      const root = document.documentElement;
      root.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing room-detail-host-375px-react-dark.png...');
    await pageA.screenshot({ path: path.join(parityDir, 'room-detail-host-375px-react-dark.png') });
    await pageA.evaluate(() => {
      const root = document.documentElement;
      root.removeAttribute('data-theme');
    });
    await new Promise((r) => setTimeout(r, 300));

    // 3. QR / Share sheet
    console.log('Opening Share / QR sheet...');
    await pageA.evaluate(() => {
      const shareBtn = document.querySelector('button[title="Chia sẻ buổi chơi"]');
      if (shareBtn) shareBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing room-qr-sheet-375px-react.png...');
    await pageA.screenshot({ path: path.join(parityDir, 'room-qr-sheet-375px-react.png') });

    // Close QR sheet
    await pageA.evaluate(() => {
      const close = document.querySelector('button:has(svg.lucide-x)');
      if (close) close.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // 4. RoomDetailPage Host Full (dd2c94a6-a4b6-46a9-8e59-6e7826feb6be)
    console.log('Navigating to Full Room detail...');
    await pageA.goto('http://127.0.0.1:4173/#/rooms/dd2c94a6-a4b6-46a9-8e59-6e7826feb6be');
    await pageA.waitForFunction(() => document.body.innerText.includes('Chi tiết buổi chơi'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));
    console.log('Capturing room-detail-full-375px-react.png...');
    await pageA.screenshot({ path: path.join(parityDir, 'room-detail-full-375px-react.png') });

    // 5. RoomDetailPage Host Cancelled (fb9fac3f-d12f-4681-b96d-0d146ebf1a27)
    console.log('Navigating to Cancelled Room detail...');
    await pageA.goto('http://127.0.0.1:4173/#/rooms/fb9fac3f-d12f-4681-b96d-0d146ebf1a27');
    await pageA.waitForFunction(() => document.body.innerText.includes('Chi tiết buổi chơi'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));
    console.log('Capturing room-detail-cancelled-375px-react.png...');
    await pageA.screenshot({ path: path.join(parityDir, 'room-detail-cancelled-375px-react.png') });

    // 6. RoomSessionPage (c91aed08-0874-4488-a870-0d915e413037)
    console.log('Navigating to RoomSessionPage...');
    await pageA.goto('http://127.0.0.1:4173/#/rooms/c91aed08-0874-4488-a870-0d915e413037/session');
    await pageA.waitForFunction(() => document.body.innerText.includes('Trận đấu & điểm danh'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));
    console.log('Capturing room-session-375px-react.png...');
    await pageA.screenshot({ path: path.join(parityDir, 'room-session-375px-react.png') });

    await pageA.close();
    await ctxA.close();

    // -------------------------------------------------------------
    // Context 2: Account B (Member - domixi@gmail.com) Mobile 375x812
    // -------------------------------------------------------------
    console.log('Context B: Logging in as domixi@gmail.com...');
    const ctxB = await browser.createBrowserContext();
    const pageB = await ctxB.newPage();
    await pageB.setViewport({ width: 375, height: 812 });

    await pageB.goto('http://127.0.0.1:4173/#/auth');
    await new Promise((r) => setTimeout(r, 800));
    await pageB.type('input[type="email"]', 'domixi@gmail.com', { delay: 15 });
    await pageB.type('input[type="password"]', '12345678@', { delay: 15 });
    await pageB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const login = btns.find((b) => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
      if (login) login.click();
    });

    await pageB.waitForFunction(
      () => document.body.innerText.includes('Kèo đấu') && document.body.innerText.includes('[TEST]'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1200));

    // 7. Notices Sheet for Account B
    console.log('Opening Notices sheet for Account B...');
    await pageB.evaluate(() => {
      const bell = document.querySelector('button[title="Thông báo"], button[aria-label="Thông báo"]');
      if (bell) bell.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing room-notices-375px-react.png...');
    await pageB.screenshot({ path: path.join(parityDir, 'room-notices-375px-react.png') });

    // Close notices
    await pageB.evaluate(() => {
      const close = document.querySelector('button:has(svg.lucide-x)');
      if (close) close.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // 8. RoomDetailPage Member (dd2c94a6-a4b6-46a9-8e59-6e7826feb6be)
    console.log('Navigating to RoomDetailPage Member view...');
    await pageB.goto('http://127.0.0.1:4173/#/rooms/dd2c94a6-a4b6-46a9-8e59-6e7826feb6be');
    await pageB.waitForFunction(() => document.body.innerText.includes('Chi tiết buổi chơi'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));
    console.log('Capturing room-detail-member-375px-react.png...');
    await pageB.screenshot({ path: path.join(parityDir, 'room-detail-member-375px-react.png') });

    // 9. Leave Dialog
    console.log('Clicking Hủy đăng ký to trigger leave dialog...');
    await pageB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const leaveBtn = btns.find((b) => b.textContent && b.textContent.includes('HỦY ĐĂNG KÝ'));
      if (leaveBtn) leaveBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing room-leave-dialog-375px-react.png...');
    await pageB.screenshot({ path: path.join(parityDir, 'room-leave-dialog-375px-react.png') });

    await pageB.close();
    await ctxB.close();

    // -------------------------------------------------------------
    // Desktop Viewport: 1440 x 900 Account A
    // -------------------------------------------------------------
    const ctxDesk = await browser.createBrowserContext();
    const pageDesk = await ctxDesk.newPage();
    await pageDesk.setViewport({ width: 1440, height: 900 });

    console.log('Desktop: Logging in as bp@gmail.com...');
    await pageDesk.goto('http://127.0.0.1:4173/#/auth');
    await new Promise((r) => setTimeout(r, 800));
    await pageDesk.type('input[type="email"]', 'bp@gmail.com', { delay: 15 });
    await pageDesk.type('input[type="password"]', '12345678@', { delay: 15 });
    await pageDesk.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const login = btns.find((b) => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
      if (login) login.click();
    });

    await pageDesk.waitForFunction(
      () => document.body.innerText.includes('Kèo đấu') && document.body.innerText.includes('[TEST]'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1500));

    // Desktop RoomCard List Light & Dark
    console.log('Capturing room-card-list-1440px-react.png...');
    await pageDesk.screenshot({ path: path.join(parityDir, 'room-card-list-1440px-react.png') });

    await pageDesk.evaluate(() => {
      const root = document.documentElement;
      root.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing room-card-list-1440px-react-dark.png...');
    await pageDesk.screenshot({ path: path.join(parityDir, 'room-card-list-1440px-react-dark.png') });
    await pageDesk.evaluate(() => {
      const root = document.documentElement;
      root.removeAttribute('data-theme');
    });
    await new Promise((r) => setTimeout(r, 400));

    // Desktop RoomDetail Host
    console.log('Navigating Desktop to RoomDetailPage Host...');
    await pageDesk.goto('http://127.0.0.1:4173/#/rooms/c91aed08-0874-4488-a870-0d915e413037');
    await pageDesk.waitForFunction(() => document.body.innerText.includes('Chi tiết buổi chơi'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1500));
    console.log('Capturing room-detail-host-1440px-react.png...');
    await pageDesk.screenshot({ path: path.join(parityDir, 'room-detail-host-1440px-react.png') });

    await pageDesk.close();
    await ctxDesk.close();

    console.log('All comprehensive React captures completed successfully!');
  } catch (err) {
    console.error('Error in captureAll:', err);
  } finally {
    await browser.close();
    server.close();
  }
}

captureAll();

