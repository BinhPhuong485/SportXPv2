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
    await new Promise((r) => setTimeout(r, 500));
    const lightPath = path.join(parityDir, `${name}-${viewport.width}px-react.png`);
    await page.screenshot({ path: lightPath });
    console.log(`Saved ${path.basename(lightPath)}`);

    // Dark theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await new Promise((r) => setTimeout(r, 500));
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

  // Click submit button
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 3500));

  // Navigate to Rankings
  console.log('Navigating to Rankings...');
  await page.goto('http://localhost:5174/#/rankings', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Mobile 375x812
  console.log('Capturing Rankings main screen 375px...');
  await captureDualTheme('rankings', { width: 375, height: 812 });

  // 2. Desktop 1440x900
  console.log('Capturing Rankings main screen 1440px...');
  await captureDualTheme('rankings', { width: 1440, height: 900 });

  // Reset to mobile for sheets/modals
  await page.setViewport({ width: 375, height: 812 });

  // 3. Court Picker Sheet
  console.log('Opening Court Picker Sheet...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const picker = btns.find((b) => b.innerText.includes('tay vợt') || b.innerText.includes('Sân'));
    if (picker) picker.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await captureDualTheme('rankings-court-picker', { width: 375, height: 812 });

  // Close Court Picker
  await page.evaluate(() => {
    const backdrop = document.querySelector('.backdrop-blur-xs');
    if (backdrop) backdrop.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // 4. Player Detail Modal
  console.log('Opening Player Detail Modal...');
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div[class*="cursor-pointer"]'));
    if (rows.length > 0) rows[0].click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await captureDualTheme('rankings-player-detail', { width: 375, height: 812 });

  await browser.close();
  console.log('Group 4 captures complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
