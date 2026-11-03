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
const parityDir = path.join(__dirname, '..', 'parity-shots');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Logging in on http://localhost:5173/#/auth ...');
    await page.goto('http://localhost:5173/#/auth', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    await page.type('input[type="email"]', 'bp@gmail.com');
    await page.type('input[type="password"]', password);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const login = btns.find(b => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
      if (login) login.click();
    });

    await page.waitForFunction(() => !window.location.hash.includes('/auth'), { timeout: 10000 });

    const roomId = '855251c0-29cf-467a-9186-40048a5bf628';
    await page.goto(`http://localhost:5173/#/rooms/${roomId}`, { waitUntil: 'networkidle0' });

    await page.waitForFunction(
      () => !document.body.innerText.includes('Đang tải chi tiết kèo đấu…') && document.body.innerText.includes('DANH SÁCH THAM GIA'),
      { timeout: 15000 }
    );
    await new Promise(r => setTimeout(r, 1000));

    // Toggle dark mode via data-theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await new Promise(r => setTimeout(r, 500));

    // Dark desktop screenshot
    const shotDeskDark = path.join(parityDir, 'room-members-1440px-dark.png');
    await page.screenshot({ path: shotDeskDark, fullPage: true });
    console.log('Saved dark desktop screenshot:', shotDeskDark);

    // Dark mobile screenshot
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 500));
    const shotMobDark = path.join(parityDir, 'room-members-375px-dark.png');
    await page.screenshot({ path: shotMobDark, fullPage: true });
    console.log('Saved dark mobile screenshot:', shotMobDark);
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
