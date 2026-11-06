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

  // 1. Check Auth
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#/auth?noSplash=true', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('Logging in...');
    await page.type('input[type="email"]', 'bp@gmail.com');
    await page.type('input[type="password"]', password);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const login = btns.find(b => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
      if (login) login.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
  } else {
    console.log('Already logged in or on auth redirect');
  }

  // 2. Desktop Screenshot 1440px on /#/rooms
  await page.setViewport({ width: 1440, height: 1080 });
  await page.goto('http://localhost:5173/#/rooms', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const desktopOut = path.resolve(__dirname, '../parity-shots/audit/02-rooms-stitch-desktop-1440px.png');
  await page.screenshot({ path: desktopOut, fullPage: false });
  console.log('Saved desktop rooms screenshot:', desktopOut);

  await browser.close();
}

shot().catch(err => {
  console.error('Shot error', err);
  process.exit(1);
});
