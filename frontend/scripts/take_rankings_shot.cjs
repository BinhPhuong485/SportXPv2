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

async function shot() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // 1. Login
  console.log('Logging in on http://localhost:5173/#/auth ...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#/auth?noSplash=true', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  await page.type('input[type="email"]', 'bp@gmail.com');
  await page.type('input[type="password"]', password);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const login = btns.find(b => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
    if (login) login.click();
  });

  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  console.log('After login URL:', page.url());

  // 2. Desktop Screenshot 1440px on /#/rankings
  await page.setViewport({ width: 1440, height: 1100 });
  await page.goto('http://localhost:5173/#/rankings', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('Rankings URL:', page.url());
  const desktopOut = path.resolve(__dirname, '../parity-shots/audit/03-rankings-stitch-desktop-1440px.png');
  await page.screenshot({ path: desktopOut, fullPage: true });
  console.log('Saved desktop rankings screenshot:', desktopOut);

  // 3. Mobile Screenshot 375px
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto('http://localhost:5173/#/rankings', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const mobileOut = path.resolve(__dirname, '../parity-shots/audit/03-rankings-stitch-mobile-375px.png');
  await page.screenshot({ path: mobileOut, fullPage: false });
  console.log('Saved mobile rankings screenshot:', mobileOut);

  await browser.close();
}

shot().catch(err => {
  console.error('Shot error', err);
  process.exit(1);
});
