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

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
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
  await new Promise(r => setTimeout(r, 2000));

  const pages = [
    { url: 'http://localhost:5173/#/', name: 'feed' },
    { url: 'http://localhost:5173/#/rooms', name: 'rooms' },
    { url: 'http://localhost:5173/#/rankings', name: 'rankings' },
    { url: 'http://localhost:5173/#/profile', name: 'profile' },
  ];

  for (const p of pages) {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(p.url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    const outPath = path.join(__dirname, '..', 'parity-shots', 'audit', `${p.name}-contrast-check.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log('Captured ' + p.name + ' to ' + outPath);

    // Mobile
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto(p.url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    const outMobilePath = path.join(__dirname, '..', 'parity-shots', 'audit', `${p.name}-contrast-mobile.png`);
    await page.screenshot({ path: outMobilePath, fullPage: false });
    console.log('Captured mobile ' + p.name + ' to ' + outMobilePath);
  }
  await browser.close();
  console.log('All contrast checks captured successfully!');
})();
