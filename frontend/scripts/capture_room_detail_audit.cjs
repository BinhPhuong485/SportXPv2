const puppeteer = require('puppeteer-core');
const path = require('path');
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

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  try {
    console.log('Logging in...');
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
    await new Promise(r => setTimeout(r, 800));

    const roomId = '855251c0-29cf-467a-9186-40048a5bf628';
    console.log(`Navigating to room ${roomId} on Desktop 1440px...`);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:5173/#/rooms/${roomId}?noSplash=true`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(auditDir, '08-room-detail-desktop-1440px.png') });

    console.log('Testing Desktop Dark...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(auditDir, '08-room-detail-desktop-dark-1440px.png') });

    console.log('Testing Mobile 375px...');
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    });
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto(`http://localhost:5173/#/rooms/${roomId}?noSplash=true`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(auditDir, '08-room-detail-mobile-375px.png') });

    // Also re-capture mobile Feed and Profile with proper wait
    console.log('Re-capturing Mobile Feed with full wait...');
    await page.goto('http://localhost:5173/#/?noSplash=true', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(auditDir, '01-feed-mobile-375px.png') });

    console.log('Re-capturing Mobile Profile with full wait...');
    await page.goto('http://localhost:5173/#/profile?noSplash=true', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(auditDir, '06-profile-mobile-375px.png') });

    console.log('Done capturing detail & mobile!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

run();

