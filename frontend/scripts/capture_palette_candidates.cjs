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
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });

  // 1. Login with Account A
  console.log('Logging in Account A...');
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

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

  const palettes = ['emerald', 'jade', 'cyber'];
  const routes = [
    { name: 'rooms', url: 'http://localhost:5174/#/rooms' },
    { name: 'rankings', url: 'http://localhost:5174/#/rankings' },
    { name: 'profile', url: 'http://localhost:5174/#/profile' },
    { name: 'calendar', url: 'http://localhost:5174/#/calendar' },
  ];

  for (const pal of palettes) {
    console.log(`\n--- Capturing Palette: ${pal} ---`);
    for (const route of routes) {
      await page.goto(route.url, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 800));

      // Apply data-palette
      await page.evaluate((paletteName) => {
        if (paletteName === 'emerald') {
          document.documentElement.removeAttribute('data-palette');
        } else {
          document.documentElement.setAttribute('data-palette', paletteName);
        }
      }, pal);

      await new Promise((r) => setTimeout(r, 400));
      const filename = `palette-${pal}-${route.name}-375px.png`;
      console.log(`Saving ${filename}...`);
      await page.screenshot({ path: path.join(parityDir, filename) });
    }
  }

  // Restore
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-palette');
  });

  await browser.close();
  console.log('=== All 12 Palette Candidate Screenshots Captured Successfully! ===');
}

run().catch((err) => {
  console.error('Palette Capture Error:', err);
  process.exit(1);
});

