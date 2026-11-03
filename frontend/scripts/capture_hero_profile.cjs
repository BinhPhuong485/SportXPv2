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
    await page.setViewport({ width: 1440, height: 950 });

    console.log('Logging in on http://localhost:5173/#/auth ...');
    await page.goto('http://localhost:5173/#/auth?noSplash=true', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    await page.type('input[type="email"]', 'bp@gmail.com');
    await page.type('input[type="password"]', password);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const login = btns.find(b => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
      if (login) login.click();
    });

    await page.waitForFunction(() => !window.location.hash.includes('/auth'), { timeout: 10000 });

    console.log('Navigating to profile...');
    await page.goto('http://localhost:5173/#/profile?noSplash=true', { waitUntil: 'networkidle0' });
    await page.waitForFunction(
      () => !document.body.innerText.includes('Đang tải hồ sơ') && document.body.innerText.includes('CHỈ SỐ THI ĐẤU'),
      { timeout: 15000 }
    );
    await new Promise(r => setTimeout(r, 1000));

    // Desktop Light
    const shotDeskLight = path.join(parityDir, 'profile-hero-desktop-1440px.png');
    await page.screenshot({ path: shotDeskLight, fullPage: true });
    console.log('Saved desktop light:', shotDeskLight);

    // Desktop Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await new Promise(r => setTimeout(r, 500));
    const shotDeskDark = path.join(parityDir, 'profile-hero-desktop-1440px-dark.png');
    await page.screenshot({ path: shotDeskDark, fullPage: true });
    console.log('Saved desktop dark:', shotDeskDark);

    // Mobile Light
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 500));
    const shotMobLight = path.join(parityDir, 'profile-hero-mobile-375px.png');
    await page.screenshot({ path: shotMobLight, fullPage: true });
    console.log('Saved mobile light:', shotMobLight);

    // Mobile Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await new Promise(r => setTimeout(r, 500));
    const shotMobDark = path.join(parityDir, 'profile-hero-mobile-375px-dark.png');
    await page.screenshot({ path: shotMobDark, fullPage: true });
    console.log('Saved mobile dark:', shotMobDark);

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();

