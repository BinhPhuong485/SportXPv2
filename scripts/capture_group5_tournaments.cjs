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

  // Navigate to Tournaments
  console.log('Navigating to Tournaments...');
  await page.goto('http://localhost:5174/#/tournaments', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Mobile 375x812
  console.log('Capturing Tournaments main screen 375px...');
  await captureDualTheme('tournaments', { width: 375, height: 812 });

  // 2. Desktop 1440x900
  console.log('Capturing Tournaments main screen 1440px...');
  await captureDualTheme('tournaments', { width: 1440, height: 900 });

  // 3. Register Tournament Bottom Sheet
  console.log('Opening Register Tournament Sheet...');
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const actionBtn = btns.find((b) =>
      b.innerText.includes('ĐĂNG KÝ') || b.innerText.includes('XEM THÔNG TIN') || b.innerText.includes('XEM BẢNG ĐẤU')
    );
    if (actionBtn) actionBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await captureDualTheme('tournament-register-sheet', { width: 375, height: 812 });

  await browser.close();
  console.log('Group 5 captures complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

