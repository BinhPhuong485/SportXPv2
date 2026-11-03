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

async function capture() {
  await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));
  console.log('Static server started at http://127.0.0.1:4173');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // -------------------------------------------------------------
    // Mobile Viewport: 375 x 812
    // -------------------------------------------------------------
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    console.log('Navigating to React Auth page...');
    await page.goto('http://127.0.0.1:4173/#/auth');
    await new Promise((r) => setTimeout(r, 1000));

    // Fill in login credentials
    console.log('Logging in with test account...');
    await page.type('input[type="email"]', 'bp@gmail.com', { delay: 20 });
    await page.type('input[type="password"]', (process.env.TEST_PWD || ""), { delay: 20 });

    // Click submit button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const login = btns.find((b) => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
      if (login) login.click();
    });

    console.log('Waiting for ManagedRoomsPage (Tab 0)...');
    await page.waitForFunction(
      () => document.body.innerText.includes('Kèo đấu') || document.body.innerText.includes('Tìm kèo'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1500));

    // 1. ManagedRoomsPage Tab 0
    console.log('Capturing managed-rooms-375px-react.png...');
    await page.screenshot({ path: path.join(parityDir, 'managed-rooms-375px-react.png') });

    // 2. Click "Nhập mã" button
    console.log('Opening Nhập mã sheet...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent && b.textContent.includes('Nhập mã'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing room-join-code-375px-react.png...');
    await page.screenshot({ path: path.join(parityDir, 'room-join-code-375px-react.png') });

    // Close join code sheet
    await page.evaluate(() => {
      const close = document.querySelector('button[title="Đóng"], button:has(svg.lucide-x)');
      if (close) close.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // 3. Click "Bộ lọc" chip
    console.log('Opening Bộ lọc sheet...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent && b.textContent.includes('Bộ lọc'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing room-filter-375px-react.png...');
    await page.screenshot({ path: path.join(parityDir, 'room-filter-375px-react.png') });

    // Close filter sheet
    await page.evaluate(() => {
      const close = document.querySelector('button[title="Đóng"], button:has(svg.lucide-x)');
      if (close) close.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // 4. Click "+ TẠO KÈO MỚI" FAB
    console.log('Navigating to RoomEditorPage (+ TẠO KÈO MỚI)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const fab = btns.find((b) => b.textContent && b.textContent.includes('TẠO KÈO MỚI'));
      if (fab) fab.click();
    });
    await page.waitForFunction(
      () => document.body.innerText.includes('Tạo buổi chơi') || document.body.innerText.includes('LƯU BUỔI CHƠI'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 1500));
    console.log('Capturing room-editor-375px-react.png...');
    await page.screenshot({ path: path.join(parityDir, 'room-editor-375px-react.png') });

    await page.close();

    // -------------------------------------------------------------
    // Desktop Viewport: 1440 x 900
    // -------------------------------------------------------------
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1440, height: 900 });

    console.log('Navigating Desktop to ManagedRoomsPage...');
    await desk.goto('http://127.0.0.1:4173/#/');
    await desk.waitForFunction(
      () => document.body.innerText.includes('Kèo đấu') || document.body.innerText.includes('Tìm kèo'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1500));

    console.log('Capturing managed-rooms-1440px-react.png...');
    await desk.screenshot({ path: path.join(parityDir, 'managed-rooms-1440px-react.png') });

    console.log('Navigating Desktop to RoomEditorPage...');
    await desk.goto('http://127.0.0.1:4173/#/rooms/new');
    await desk.waitForFunction(
      () => document.body.innerText.includes('Tạo buổi chơi') || document.body.innerText.includes('LƯU BUỔI CHƠI'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 1500));

    console.log('Capturing room-editor-1440px-react.png...');
    await desk.screenshot({ path: path.join(parityDir, 'room-editor-1440px-react.png') });

    await desk.close();

    console.log('All React rooms screenshots captured successfully!');
  } catch (e) {
    console.error('Error capturing React rooms:', e);
  } finally {
    await browser.close();
    server.close();
  }
}

capture();
