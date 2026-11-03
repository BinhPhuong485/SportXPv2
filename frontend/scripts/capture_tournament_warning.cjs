const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const parityDir = path.join(__dirname, '..', 'parity-shots');
if (!fs.existsSync(parityDir)) fs.mkdirSync(parityDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const password = process.env.TEST_PWD;
if (!password) {
  console.error('Missing TEST_PWD environment variable');
  process.exit(1);
}

async function loginUser(page, email) {
  console.log(`Logging in with ${email}...`);
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });

  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const login = btns.find((b) => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
    if (login) login.click();
  });

  await new Promise((r) => setTimeout(r, 4000));
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // ================= ACCOUNT A =================
    await loginUser(page, 'bp@gmail.com');
    await page.goto('http://localhost:5174/#/tournaments', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    // A1: Warning sheet on unregistered tournament (Open Championship)
    console.log('Account A: Opening warning sheet for unregistered tournament...');
    await page.setViewport({ width: 375, height: 812 });
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      const cards = Array.from(document.querySelectorAll('div'));
      // Find card with "SportXP Open Championship"
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('ĐĂNG KÝ THAM GIA')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    console.log('Capturing tournament-warning-sheet-375px-react.png (Light)...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-warning-sheet-375px-react.png') });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing tournament-warning-sheet-375px-react-dark.png...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-warning-sheet-375px-react-dark.png') });

    // 1440px warning sheet
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing tournament-warning-sheet-1440px-react.png (Light)...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-warning-sheet-1440px-react.png') });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing tournament-warning-sheet-1440px-react-dark.png...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-warning-sheet-1440px-react-dark.png') });

    // Close sheet
    await page.keyboard.press('Escape');
    await page.mouse.click(720, 50);
    await new Promise((r) => setTimeout(r, 600));

    // A2: Registered tournament (Cúp Tân Binh)
    console.log('Account A: Opening registered sheet for Cúp Tân Binh...');
    await page.setViewport({ width: 375, height: 812 });
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('ĐÃ ĐĂNG KÝ')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    console.log('Capturing tournament-registered-accountA-375px-react.png (Light)...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-registered-accountA-375px-react.png') });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing tournament-registered-accountA-375px-react-dark.png...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-registered-accountA-375px-react-dark.png') });

    // 1440px registered sheet Account A
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing tournament-registered-accountA-1440px-react.png (Light)...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-registered-accountA-1440px-react.png') });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing tournament-registered-accountA-1440px-react-dark.png...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-registered-accountA-1440px-react-dark.png') });

    // Close sheet
    await page.keyboard.press('Escape');
    await page.mouse.click(720, 50);
    await new Promise((r) => setTimeout(r, 600));

    // ================= ACCOUNT B =================
    await loginUser(page, 'domixi@gmail.com');
    await page.goto('http://localhost:5174/#/tournaments', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    // B1: Registered tournament (SportXP Open Championship)
    console.log('Account B: Opening registered sheet for Open Championship...');
    await page.setViewport({ width: 375, height: 812 });
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('ĐÃ ĐĂNG KÝ')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    console.log('Capturing tournament-registered-accountB-375px-react.png (Light)...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-registered-accountB-375px-react.png') });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing tournament-registered-accountB-375px-react-dark.png...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-registered-accountB-375px-react-dark.png') });

    // 1440px registered sheet Account B
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing tournament-registered-accountB-1440px-react.png (Light)...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-registered-accountB-1440px-react.png') });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing tournament-registered-accountB-1440px-react-dark.png...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-registered-accountB-1440px-react-dark.png') });

    // Close sheet
    await page.keyboard.press('Escape');
    await page.mouse.click(720, 50);
    await new Promise((r) => setTimeout(r, 600));

    console.log('All tournament warning and registration screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Error in capture script:', err);
  process.exit(1);
});
