const puppeteer = require('puppeteer-core');
const path = require('path');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';

async function captureSheets() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    // 1. Forgot password sheet
    console.log('Loading Auth for Forgot Password...');
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    console.log('Clicking Quên mật khẩu at (300, 365)...');
    await page.mouse.click(300, 365);
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(parityDir, 'forgot-password-375px-flutter.png') });
    console.log('Saved forgot-password-375px-flutter.png');

    // 2. Now login
    console.log('Logging in...');
    await page.mouse.click(187, 100); // dismiss sheet if open
    await new Promise((r) => setTimeout(r, 500));

    await page.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.type('bp@gmail.com', { delay: 40 });

    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.type((process.env.TEST_PWD || ""), { delay: 40 });

    await page.mouse.click(187, 435);
    await new Promise((r) => setTimeout(r, 7000));

    // 3. Notification sheet
    console.log('Clicking notification bell at (351, 28)...');
    await page.mouse.click(351, 28);
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(parityDir, 'notification-sheet-375px-flutter.png') });
    console.log('Saved notification-sheet-375px-flutter.png');

    // Dismiss sheet
    await page.mouse.click(187, 100);
    await new Promise((r) => setTimeout(r, 800));

    // 4. Create Room / Room Editor (click TẠO KÈO MỚI at 280, 645)
    console.log('Clicking TẠO KÈO MỚI (280, 645)...');
    await page.mouse.click(280, 645);
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(parityDir, 'room-editor-375px-flutter.png') });
    console.log('Saved room-editor-375px-flutter.png');

    await page.close();

    // -------------------------------------------------------------
    // Desktop Viewport: 1440 x 900
    // -------------------------------------------------------------
    console.log('Capturing Desktop 1440px screens...');
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1440, height: 900 });

    // Splash 1440px
    await desk.goto('http://localhost:5050', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 500));
    await desk.screenshot({ path: path.join(parityDir, 'splash-1440px-flutter.png') });
    console.log('Saved splash-1440px-flutter.png');

    await new Promise((r) => setTimeout(r, 4000));

    // Auth Login 1440px
    await desk.screenshot({ path: path.join(parityDir, 'auth-login-1440px-flutter.png') });
    console.log('Saved auth-login-1440px-flutter.png');

    // Click Đăng ký on Desktop
    // Form is centered at 720. Max width 460. Container left is 490, right is 950.
    // Đăng ký is right half: x = 720 + 115 = 835. Y: 180 + 28 = 208
    await desk.mouse.click(835, 208);
    await new Promise((r) => setTimeout(r, 800));
    await desk.screenshot({ path: path.join(parityDir, 'auth-signup-1440px-flutter.png') });
    console.log('Saved auth-signup-1440px-flutter.png');

    // Switch back to Đăng nhập (x: 605, y: 208)
    await desk.mouse.click(605, 208);
    await new Promise((r) => setTimeout(r, 500));

    // Login on Desktop:
    // Email at 720, 275
    await desk.mouse.click(720, 275);
    await new Promise((r) => setTimeout(r, 300));
    await desk.keyboard.type('bp@gmail.com', { delay: 40 });

    // Password at 720, 350
    await desk.mouse.click(720, 350);
    await new Promise((r) => setTimeout(r, 300));
    await desk.keyboard.type((process.env.TEST_PWD || ""), { delay: 40 });

    // Submit at 720, 460
    await desk.mouse.click(720, 460);
    await new Promise((r) => setTimeout(r, 8000));

    // Desktop Shell Tab 0
    await desk.screenshot({ path: path.join(parityDir, 'shell-rooms-1440px-flutter.png') });
    console.log('Saved shell-rooms-1440px-flutter.png');

    await desk.close();
    console.log('All captures done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

captureSheets();

