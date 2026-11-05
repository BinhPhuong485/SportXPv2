const puppeteer = require('puppeteer-core');
const path = require('path');
const { execSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let password = process.env.TEST_PWD;
if (!password) {
  try {
    const out = execSync('git show a7a10f1:scripts/verify_auth.cjs', { encoding: 'utf8' });
    const m = out.match(/password:\s*'([^']+)'/);
    if (m) password = m[1];
  } catch {}
}

const devices = [
  { name: 'ipad-mini', width: 768, height: 1024 },
  { name: 'surface-pro', width: 960, height: 1440 },
  { name: 'ipad-pro', width: 1032, height: 1376 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'mobile-375', width: 375, height: 812 },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#/auth?noSplash=true', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'bp@gmail.com');
  await page.type('input[type="password"]', password);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const login = btns.find(b => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
    if (login) login.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  for (const d of devices) {
    await page.setViewport({ width: d.width, height: d.height, isMobile: d.width < 1200, hasTouch: d.width < 1200 });
    await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    const outPath = path.join(__dirname, '..', 'parity-shots', 'audit', `feed-tablet-view-${d.name}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Captured ${d.name} to ${outPath}`);
  }
  await browser.close();
  console.log('All feed tablet test screenshots captured!');
})();

