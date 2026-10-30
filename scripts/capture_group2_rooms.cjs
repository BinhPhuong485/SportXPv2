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

  // Helper for light & dark captures
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
    const login = btns.find((b) => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
    if (login) login.click();
  });
  await new Promise((r) => setTimeout(r, 3500));

  // 1. Managed Rooms List
  console.log('Capturing Managed Rooms List...');
  await page.goto('http://localhost:5174/#/rooms', { waitUntil: 'networkidle0' });
  await captureDualTheme('managed-rooms', { width: 375, height: 812 });
  await captureDualTheme('managed-rooms', { width: 1440, height: 900 });

  // 2. Room Filter Sheet
  console.log('Capturing Room Filter Sheet...');
  const openFilter = async () => {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const filterBtn = btns.find((b) => b.textContent && b.textContent.includes('Bộ lọc'));
      if (filterBtn) filterBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));
  };
  await captureDualTheme('room-filter', { width: 375, height: 812 }, openFilter);

  // 3. Room Detail (First available room or room history)
  console.log('Capturing Room Detail...');
  await page.goto('http://localhost:5174/#/rooms/7288f6b5-2982-4cf6-a218-454aed2f950e', { waitUntil: 'networkidle0' });
  await captureDualTheme('room-detail-host', { width: 375, height: 812 });
  await captureDualTheme('room-detail-host', { width: 1440, height: 900 });

  // 4. Room Editor Page
  console.log('Capturing Room Editor...');
  await page.goto('http://localhost:5174/#/rooms/new', { waitUntil: 'networkidle0' });
  await captureDualTheme('room-editor', { width: 375, height: 812 });
  await captureDualTheme('room-editor', { width: 1440, height: 900 });

  await browser.close();
  console.log('=== Group 2 Captures Done! ===');
}

run().catch((err) => {
  console.error('Group 2 capture error:', err);
  process.exit(1);
});

