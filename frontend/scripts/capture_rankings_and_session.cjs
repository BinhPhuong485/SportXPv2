const puppeteer = require('puppeteer-core');
const path = require('path');
const http = require('http');
const fs = require('fs');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';
const distDir = 'E:/SQUARE/STUDY/EXE/v3/dist';

// Static file server for React dist
function startReactServer(port) {
  const server = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.json': 'application/json',
    };
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

async function captureAll() {
  const reactServer = await startReactServer(4173);
  console.log('React static server running on http://127.0.0.1:4173');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // =============================================================
    // 1. FLUTTER RANKINGS CAPTURE (Account A)
    // =============================================================
    console.log('\n--- Capturing Flutter Rankings ---');
    const fPage = await browser.newPage();
    await fPage.setViewport({ width: 375, height: 812 });
    await fPage.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Mobile login if needed
    console.log('Flutter login...');
    await fPage.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 200));
    await fPage.keyboard.type('bp@gmail.com', { delay: 15 });

    await fPage.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 200));
    await fPage.keyboard.type((process.env.TEST_PWD || ""), { delay: 15 });

    await fPage.mouse.click(187, 435);
    await new Promise((r) => setTimeout(r, 6000));

    // Tap Tab 1 ("Xếp hạng" / Leaderboard) -> bottom nav 4 tabs: Tab 0 (~47px), Tab 1 (~140px), y ~ 780px
    console.log('Clicking Flutter Tab 1 (Xếp hạng)...');
    await fPage.mouse.click(140, 785);
    await new Promise((r) => setTimeout(r, 4000));

    console.log('Capturing rankings-375px-flutter.png...');
    await fPage.screenshot({ path: path.join(parityDir, 'rankings-375px-flutter.png') });

    // Open Court Picker Sheet: click court card (~y: 110px)
    console.log('Clicking Court Picker button in Flutter...');
    await fPage.mouse.click(187, 110);
    await new Promise((r) => setTimeout(r, 2000));
    console.log('Capturing rankings-court-picker-375px-flutter.png...');
    await fPage.screenshot({ path: path.join(parityDir, 'rankings-court-picker-375px-flutter.png') });

    // Dismiss sheet (tap top area)
    await fPage.mouse.click(187, 100);
    await new Promise((r) => setTimeout(r, 1000));

    // Open Player Detail Modal: click first rank row (~y: 520)
    console.log('Clicking Player Row in Flutter...');
    await fPage.mouse.click(187, 520);
    await new Promise((r) => setTimeout(r, 2000));
    console.log('Capturing rankings-player-detail-375px-flutter.png...');
    await fPage.screenshot({ path: path.join(parityDir, 'rankings-player-detail-375px-flutter.png') });

    await fPage.close();

    // Flutter Desktop 1440x900
    const fDesk = await browser.newPage();
    await fDesk.setViewport({ width: 1440, height: 900 });
    await fDesk.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Desktop login if needed
    await fDesk.mouse.click(720, 275);
    await new Promise((r) => setTimeout(r, 200));
    await fDesk.keyboard.type('bp@gmail.com', { delay: 15 });

    await fDesk.mouse.click(720, 350);
    await new Promise((r) => setTimeout(r, 200));
    await fDesk.keyboard.type((process.env.TEST_PWD || ""), { delay: 15 });

    await fDesk.mouse.click(720, 460);
    await new Promise((r) => setTimeout(r, 6000));

    // In Desktop, bottom nav tabs centered: content width 720 -> x from 360 to 1080.
    // Tab 1 is at 360 + 720 * (1.5 / 4) = 360 + 270 = 630px, y ~ 875px
    console.log('Clicking Flutter Desktop Tab 1 (Xếp hạng)...');
    await fDesk.mouse.click(630, 875);
    await new Promise((r) => setTimeout(r, 4000));

    console.log('Capturing rankings-1440px-flutter.png...');
    await fDesk.screenshot({ path: path.join(parityDir, 'rankings-1440px-flutter.png') });
    await fDesk.close();

    // =============================================================
    // 2. REACT RANKINGS CAPTURE (Account A)
    // =============================================================
    console.log('\n--- Capturing React Rankings ---');
    const rPage = await browser.newPage();
    await rPage.setViewport({ width: 375, height: 812 });
    await rPage.goto('http://127.0.0.1:4173/#/auth', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    // Login React
    await rPage.type('input[type="email"]', 'bp@gmail.com');
    await rPage.type('input[type="password"]', (process.env.TEST_PWD || ""));
    await rPage.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 4000));

    // Navigate to /rankings
    await rPage.goto('http://127.0.0.1:4173/#/rankings', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 3000));

    console.log('Capturing rankings-375px-react.png (Light)...');
    await rPage.screenshot({ path: path.join(parityDir, 'rankings-375px-react.png') });

    // Open Court Picker Sheet
    console.log('Opening Court Picker Sheet in React...');
    await rPage.evaluate(() => {
      const btn = document.querySelector('button[title="Cập nhật bảng xếp hạng"]')?.parentElement?.nextElementSibling;
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Capturing rankings-court-picker-375px-react.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'rankings-court-picker-375px-react.png') });

    // Close sheet
    await rPage.mouse.click(187, 50);
    await new Promise((r) => setTimeout(r, 800));

    // Open Player Detail Modal (click first list row or podium)
    console.log('Opening Player Detail Modal in React...');
    await rPage.evaluate(() => {
      const row = document.querySelector('.divide-y > div');
      if (row) row.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Capturing rankings-player-detail-375px-react.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'rankings-player-detail-375px-react.png') });

    // Close modal
    await rPage.mouse.click(187, 50);
    await new Promise((r) => setTimeout(r, 800));

    // Toggle Dark Mode
    await rPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Capturing rankings-375px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'rankings-375px-react-dark.png') });

    await rPage.close();

    // React Desktop 1440x900
    const rDesk = await browser.newPage();
    await rDesk.setViewport({ width: 1440, height: 900 });
    await rDesk.goto('http://127.0.0.1:4173/#/auth', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    await rDesk.type('input[type="email"]', 'bp@gmail.com');
    await rDesk.type('input[type="password"]', (process.env.TEST_PWD || ""));
    await rDesk.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 4000));

    await rDesk.goto('http://127.0.0.1:4173/#/rankings', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 3000));

    console.log('Capturing rankings-1440px-react.png (Light)...');
    await rDesk.screenshot({ path: path.join(parityDir, 'rankings-1440px-react.png') });

    await rDesk.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Capturing rankings-1440px-react-dark.png...');
    await rDesk.screenshot({ path: path.join(parityDir, 'rankings-1440px-react-dark.png') });

    await rDesk.close();

    // =============================================================
    // 3. REACT ROOM SESSION CAPTURE (1440px & Dark)
    // =============================================================
    console.log('\n--- Capturing React Room Session (1440px & Dark) ---');
    const sPage = await browser.newPage();
    await sPage.setViewport({ width: 1440, height: 900 });
    await sPage.goto('http://127.0.0.1:4173/#/rooms/7288f6b5-2982-4cf6-a218-454aed2f950e/session', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 3000));

    console.log('Capturing room-session-1440px-react.png...');
    await sPage.screenshot({ path: path.join(parityDir, 'room-session-1440px-react.png') });

    await sPage.setViewport({ width: 375, height: 812 });
    await sPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Capturing room-session-375px-react-dark.png...');
    await sPage.screenshot({ path: path.join(parityDir, 'room-session-375px-react-dark.png') });

    await sPage.close();
    console.log('\nAll captures completed successfully!');
  } catch (e) {
    console.error('Error during capture:', e);
  } finally {
    await browser.close();
    reactServer.close();
  }
}

captureAll();
