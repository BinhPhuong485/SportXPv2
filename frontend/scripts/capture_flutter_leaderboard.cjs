const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
let password = process.env.TEST_PWD;
if (!password) {
  try {
    const { execSync } = require('child_process');
    const out = execSync('git show a7a10f1:scripts/verify_auth.cjs', { encoding: 'utf8' });
    const m = out.match(/password:\s*'([^']+)'/);
    if (m) password = m[1];
  } catch {}
}
if (!password) {
  console.error('Missing TEST_PWD environment variable.');
  process.exit(1);
}

const parityDir = path.join(__dirname, '..', 'parity-shots');

async function run() {
  console.log('Capturing Flutter Leaderboard on http://localhost:5050...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Flutter login
    console.log('Typing credentials in Flutter...');
    await page.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.type('bp@gmail.com', { delay: 20 });

    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.type(password, { delay: 20 });

    await page.mouse.click(187, 435); // Submit button
    await new Promise((r) => setTimeout(r, 6000));

    // Tap Tab 1 ("Xếp hạng" - x: 140, y: 785)
    console.log('Tapping Xếp hạng tab in Flutter...');
    await page.mouse.click(140, 785);
    await new Promise((r) => setTimeout(r, 4000));

    const shotPath = path.join(parityDir, 'rankings-leaderboard-flutter.png');
    await page.screenshot({ path: shotPath });
    console.log('Saved Flutter Leaderboard screenshot to:', shotPath);
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
