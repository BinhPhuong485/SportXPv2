const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const password = process.env.TEST_PWD;
if (!password) {
  console.error('Missing TEST_PWD environment variable.');
  process.exit(1);
}

const parityDir = path.join(__dirname, '..', 'parity-shots');
if (!fs.existsSync(parityDir)) fs.mkdirSync(parityDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  async function captureDualTheme(name, viewport, preAction) {
    await page.setViewport(viewport);
    if (preAction) await preAction();

    // Light theme
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await new Promise((r) => setTimeout(r, 400));
    const lightPath = path.join(parityDir, `${name}-${viewport.width}px-react.png`);
    await page.screenshot({ path: lightPath });
    console.log(`Saved ${path.basename(lightPath)}`);

    // Dark theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await new Promise((r) => setTimeout(r, 400));
    const darkPath = path.join(parityDir, `${name}-${viewport.width}px-react-dark.png`);
    await page.screenshot({ path: darkPath });
    console.log(`Saved ${path.basename(darkPath)}`);

    // Reset
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  }

  // Login Account A
  console.log('Logging in Account A...');
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });
  await page.type('input[type="email"]', 'bp@gmail.com');
  await page.type('input[type="password"]', password);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find((b) => b.innerText.includes('Đăng nhập') || b.innerText.includes('TIẾP TỤC'));
    if (loginBtn) loginBtn.click();
  });

  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  // Open notification sheet by clicking the notification bell icon
  console.log('Opening Notification Modal Sheet...');
  await page.setViewport({ width: 375, height: 812 });
  await page.waitForSelector('button[aria-label="Thông báo"]', { timeout: 8000 });
  await page.click('button[aria-label="Thông báo"]');
  await new Promise((r) => setTimeout(r, 800));

  // Capture dual theme
  console.log('Capturing Notification Sheet at 375px...');
  await captureDualTheme('notification-sheet', { width: 375, height: 812 });

  await browser.close();
  console.log('Group 7 captures complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

