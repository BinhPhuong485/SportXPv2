const puppeteer = require('puppeteer-core');
const path = require('path');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';

async function captureShell() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Login
    console.log('Logging in...');
    await page.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 400));
    await page.keyboard.type('bp@gmail.com', { delay: 40 });

    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 400));
    await page.keyboard.type('12345678@', { delay: 40 });

    await page.mouse.click(187, 435);
    console.log('Waiting for Shell Tab 0...');
    await new Promise((r) => setTimeout(r, 8000));

    // 1. Tab 0: Tìm kèo
    await page.screenshot({ path: path.join(parityDir, 'shell-rooms-375px-flutter.png') });
    console.log('Saved shell-rooms-375px-flutter.png');

    // 2. Notification sheet
    console.log('Clicking Notification bell (345, 28)...');
    await page.mouse.click(345, 28);
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(parityDir, 'notification-sheet-375px-flutter.png') });
    console.log('Saved notification-sheet-375px-flutter.png');

    // Close sheet by clicking top
    await page.mouse.click(187, 100);
    await new Promise((r) => setTimeout(r, 800));

    // 3. Tab 1: Xếp hạng
    console.log('Clicking Tab 1 Xếp hạng (141, 772)...');
    await page.mouse.click(141, 772);
    await new Promise((r) => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(parityDir, 'shell-rankings-375px-flutter.png') });
    console.log('Saved shell-rankings-375px-flutter.png');

    // 4. Tab 2: Giải đấu
    console.log('Clicking Tab 2 Giải đấu (234, 772)...');
    await page.mouse.click(234, 772);
    await new Promise((r) => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(parityDir, 'shell-tournaments-375px-flutter.png') });
    console.log('Saved shell-tournaments-375px-flutter.png');

    // 5. Tab 3: Hồ sơ
    console.log('Clicking Tab 3 Hồ sơ (328, 772)...');
    await page.mouse.click(328, 772);
    await new Promise((r) => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(parityDir, 'shell-profile-375px-flutter.png') });
    console.log('Saved shell-profile-375px-flutter.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

captureShell();

