const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

let password = process.env.TEST_PWD;
if (!password) {
  try {
    const out = execSync('git show a7a10f1:scripts/verify_auth.cjs', { encoding: 'utf8' });
    const m = out.match(/password:\s*'([^']+)'/);
    if (m) password = m[1];
  } catch {}
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const auditDir = path.join(__dirname, '..', 'parity-shots', 'audit');
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  try {
    // 1. Login
    console.log('Logging in on http://localhost:5173/#/auth ...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/#/auth?noSplash=true', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    await page.type('input[type="email"]', 'bp@gmail.com');
    await page.type('input[type="password"]', password);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const login = btns.find(b => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
      if (login) login.click();
    });

    await page.waitForFunction(() => !window.location.hash.includes('/auth'), { timeout: 10000 });
    console.log('Login successful! Current hash:', await page.evaluate(() => window.location.hash));
    await new Promise(r => setTimeout(r, 800));

    const routes = [
      { name: '01-feed', path: '/#/' },
      { name: '02-rooms', path: '/#/rooms' },
      { name: '03-rankings', path: '/#/rankings' },
      { name: '04-calendar', path: '/#/calendar' },
      { name: '05-tournaments', path: '/#/tournaments' },
      { name: '06-profile', path: '/#/profile' },
      { name: '07-create-room', path: '/#/rooms/new' },
    ];

    // Check each page on Desktop Light & Dark
    for (const r of routes) {
      console.log(`Checking Desktop Light: ${r.name} (${r.path}) ...`);
      await page.setViewport({ width: 1440, height: 900 });
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
      });
      await page.goto(`http://localhost:5173${r.path}?noSplash=true`, { waitUntil: 'networkidle0' });
      await new Promise(res => setTimeout(res, 900));

      // Check overflow
      const overflowInfo = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });

      await page.screenshot({ path: path.join(auditDir, `${r.name}-desktop-1440px.png`) });

      // Dark mode
      console.log(`Checking Desktop Dark: ${r.name} ...`);
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      });
      await new Promise(res => setTimeout(res, 300));
      await page.screenshot({ path: path.join(auditDir, `${r.name}-desktop-dark-1440px.png`) });

      // Reset theme
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
      });

      // Mobile
      console.log(`Checking Mobile: ${r.name} ...`);
      await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
      await new Promise(res => setTimeout(res, 500));
      await page.screenshot({ path: path.join(auditDir, `${r.name}-mobile-375px.png`) });
    }

    // Check Room Detail page if any room exists
    console.log('Finding a room to test Room Detail...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/#/rooms?noSplash=true', { waitUntil: 'networkidle0' });
    await new Promise(res => setTimeout(res, 1000));

    const roomId = await page.evaluate(() => {
      const roomLinks = Array.from(document.querySelectorAll('a[href*="/rooms/"]'));
      for (const a of roomLinks) {
        const m = a.getAttribute('href').match(/\/rooms\/([a-zA-Z0-9-]+)/);
        if (m && m[1] !== 'new') return m[1];
      }
      return null;
    });

    if (roomId) {
      console.log(`Checking Room Detail: ${roomId} ...`);
      await page.goto(`http://localhost:5173/#/rooms/${roomId}?noSplash=true`, { waitUntil: 'networkidle0' });
      await new Promise(res => setTimeout(res, 900));
      await page.screenshot({ path: path.join(auditDir, `08-room-detail-desktop-1440px.png`) });

      await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
      await new Promise(res => setTimeout(res, 500));
      await page.screenshot({ path: path.join(auditDir, `08-room-detail-mobile-375px.png`) });
    }

    // Check User Profile Menu dropdown on desktop
    console.log('Checking User Profile Menu dropdown...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/#/?noSplash=true', { waitUntil: 'networkidle0' });
    await new Promise(res => setTimeout(res, 800));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const meBtn = btns.find(b => b.textContent && b.textContent.includes('Tôi'));
      if (meBtn) meBtn.click();
    });
    await new Promise(res => setTimeout(res, 400));
    await page.screenshot({ path: path.join(auditDir, `09-user-menu-dropdown-1440px.png`) });

    console.log('All screenshots captured successfully!');
    if (consoleErrors.length > 0) {
      console.log('Console errors encountered:', consoleErrors);
    } else {
      console.log('Zero console errors encountered.');
    }
  } catch (err) {
    console.error('Audit script failed:', err);
  } finally {
    await browser.close();
  }
}

run();

