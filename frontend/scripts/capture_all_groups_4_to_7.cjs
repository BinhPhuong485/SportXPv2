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
const brainDir = 'C:\\Users\\MS Phung\\.gemini\\antigravity\\brain\\32054344-2dab-4079-82dc-7c3438cdf363\\parity-shots';

[parityDir, brainDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  async function saveFile(filename) {
    const p1 = path.join(parityDir, filename);
    const p2 = path.join(brainDir, filename);
    await page.screenshot({ path: p1 });
    fs.copyFileSync(p1, p2);
    const sz = fs.statSync(p1).size;
    console.log(`Saved ${filename} (${sz} bytes)`);
  }

  async function captureDualTheme(name, viewport, preAction) {
    await page.setViewport(viewport);
    if (preAction) await preAction();

    // Light theme
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await new Promise((r) => setTimeout(r, 600));
    await saveFile(`${name}-${viewport.width}px-react.png`);

    // Dark theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await new Promise((r) => setTimeout(r, 600));
    await saveFile(`${name}-${viewport.width}px-react-dark.png`);

    // Reset
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  }

  // --- 1. Login ---
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

  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 3500));
  console.log('Logged in. Current URL:', page.url());

  // --- 2. Group 4: Rankings ---
  console.log('\n--- Capturing Group 4: Rankings ---');
  await page.goto('http://localhost:5174/#/rankings', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  await captureDualTheme('rankings', { width: 375, height: 812 });
  await captureDualTheme('rankings', { width: 1440, height: 900 });

  // Court picker
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const picker = btns.find((b) => b.innerText.includes('tay vợt') || b.innerText.includes('Sân'));
    if (picker) picker.click();
  });
  await new Promise((r) => setTimeout(r, 700));
  await captureDualTheme('rankings-court-picker', { width: 375, height: 812 });
  // Close picker
  await page.evaluate(() => {
    const backdrop = document.querySelector('.backdrop-blur-xs');
    if (backdrop) backdrop.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Player detail modal
  await page.evaluate(() => {
    const rankRows = Array.from(document.querySelectorAll('div[class*="cursor-pointer"]'));
    if (rankRows.length > 0) rankRows[0].click();
  });
  await new Promise((r) => setTimeout(r, 700));
  await captureDualTheme('rankings-player-detail', { width: 375, height: 812 });
  // Close modal
  await page.evaluate(() => {
    const backdrop = document.querySelector('.backdrop-blur-xs');
    if (backdrop) backdrop.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // --- 3. Group 5: Tournaments ---
  console.log('\n--- Capturing Group 5: Tournaments ---');
  await page.goto('http://localhost:5174/#/tournaments', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  await captureDualTheme('tournaments', { width: 375, height: 812 });
  await captureDualTheme('tournaments', { width: 1440, height: 900 });

  // Tournament register sheet
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const regBtn = btns.find((b) =>
      b.innerText.includes('ĐĂNG KÝ') || b.innerText.includes('XEM THÔNG TIN') || b.innerText.includes('XEM BẢNG ĐẤU')
    );
    if (regBtn) regBtn.click();
  });
  await new Promise((r) => setTimeout(r, 700));
  await captureDualTheme('tournament-register-sheet', { width: 375, height: 812 });
  // Close sheet
  await page.evaluate(() => {
    const backdrop = document.querySelector('.backdrop-blur-xs');
    if (backdrop) backdrop.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // --- 4. Group 6: Profile ---
  console.log('\n--- Capturing Group 6: Profile ---');
  await page.goto('http://localhost:5174/#/profile', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  await captureDualTheme('profile', { width: 375, height: 812 });
  await captureDualTheme('profile', { width: 1440, height: 900 });

  // Edit profile sheet
  await page.setViewport({ width: 375, height: 812 });
  await page.evaluate(() => {
    const editBtn = document.querySelector('button[title="Chỉnh sửa hồ sơ"]');
    if (editBtn) editBtn.click();
  });
  await new Promise((r) => setTimeout(r, 700));
  await captureDualTheme('profile-edit-sheet', { width: 375, height: 812 });
  // Close sheet
  await page.evaluate(() => {
    const backdrop = document.querySelector('.backdrop-blur-xs');
    if (backdrop) backdrop.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // --- 5. Group 7: Notifications ---
  console.log('\n--- Capturing Group 7: Notifications ---');
  await page.goto('http://localhost:5174/#/rooms?notice=true', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  await captureDualTheme('notification-sheet', { width: 375, height: 812 });

  await browser.close();
  console.log('\nAll captures successfully finished and synced to brain directory!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

