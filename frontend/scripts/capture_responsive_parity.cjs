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
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Logging in on http://localhost:5173/#/auth ...');
    await page.goto('http://localhost:5173/#/auth', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    await page.type('input[type="email"]', 'bp@gmail.com');
    await page.type('input[type="password"]', password);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const login = btns.find(b => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
      if (login) login.click();
    });

    await page.waitForFunction(() => !window.location.hash.includes('/auth'), { timeout: 10000 });
    console.log('Login successful');

    // 1. ManagedRoomsPage at 1440px (Light)
    await page.goto('http://localhost:5173/?noSplash=true#/rooms', { waitUntil: 'networkidle0' });
    await page.waitForFunction(
      () => document.body.innerText.includes('BUỔI ĐANG DIỄN RA') || document.body.innerText.includes('BUỔI SẮP TỚI') || document.body.innerText.includes('Tìm kèo'),
      { timeout: 15000 }
    );
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(parityDir, 'rooms-grid-responsive-1440px.png'), fullPage: false });
    console.log('Saved rooms-grid-responsive-1440px.png');

    // 2. ManagedRoomsPage at 375px (Light)
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(parityDir, 'rooms-grid-responsive-375px.png'), fullPage: false });
    console.log('Saved rooms-grid-responsive-375px.png');

    // 3. RoomDetailPage at 375px (Mobile Light)
    const roomId = '855251c0-29cf-467a-9186-40048a5bf628';
    await page.goto(`http://localhost:5173/#/rooms/${roomId}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(
      () => document.body.innerText.includes('DANH SÁCH THAM GIA'),
      { timeout: 15000 }
    );
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(parityDir, 'room-detail-responsive-375px.png'), fullPage: false });
    console.log('Saved room-detail-responsive-375px.png');

    // 4. RoomDetailPage at 375px (Mobile Dark)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(parityDir, 'room-detail-responsive-375px-dark.png'), fullPage: false });
    console.log('Saved room-detail-responsive-375px-dark.png');

    // 5. RoomDetailPage at 1440px (Desktop Dark)
    await page.setViewport({ width: 1440, height: 900 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(parityDir, 'room-detail-responsive-1440px-dark.png'), fullPage: false });
    console.log('Saved room-detail-responsive-1440px-dark.png');

    // 6. RoomDetailPage at 1440px (Desktop Light)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(parityDir, 'room-detail-responsive-1440px.png'), fullPage: false });
    console.log('Saved room-detail-responsive-1440px.png');

    console.log('All responsive screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
