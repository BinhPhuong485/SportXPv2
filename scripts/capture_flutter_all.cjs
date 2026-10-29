const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';

async function captureAllFlutter() {
  console.log('Starting comprehensive Flutter screen capture...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // -------------------------------------------------------------
    // Viewport 1: 375 x 812 (Mobile)
    // -------------------------------------------------------------
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    // 1. Splash Screen Mobile
    console.log('Capturing Flutter Splash 375px...');
    await page.goto('http://localhost:5050', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 600)); // during 2200ms splash animation
    await page.screenshot({ path: path.join(parityDir, 'splash-375px-flutter.png') });
    console.log('Saved splash-375px-flutter.png');

    // Wait for Splash to transition to AuthPage
    await new Promise((r) => setTimeout(r, 3500));

    // 2. Auth Login Mobile
    console.log('Capturing Auth Login 375px...');
    await page.screenshot({ path: path.join(parityDir, 'auth-login-375px-flutter.png') });
    console.log('Saved auth-login-375px-flutter.png');

    // 3. Auth SignUp Mobile
    console.log('Clicking Đăng ký tab (x: 270, y: 180)...');
    await page.mouse.click(270, 180);
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(parityDir, 'auth-signup-375px-flutter.png') });
    console.log('Saved auth-signup-375px-flutter.png');

    // Switch back to Đăng nhập
    await page.mouse.click(105, 180);
    await new Promise((r) => setTimeout(r, 600));

    // 4. Forgot Password Sheet Mobile
    console.log('Clicking Quên mật khẩu? (x: 280, y: 360)...');
    await page.mouse.click(280, 360);
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(parityDir, 'forgot-password-375px-flutter.png') });
    console.log('Saved forgot-password-375px-flutter.png');

    // Dismiss bottom sheet by tapping top backdrop (x: 187, y: 100)
    await page.mouse.click(187, 100);
    await new Promise((r) => setTimeout(r, 800));

    // 5. Perform Login
    console.log('Typing credentials into Email & Password...');
    await page.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.type('bp@gmail.com', { delay: 40 });

    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.type('12345678@', { delay: 40 });

    console.log('Submitting login...');
    await page.mouse.click(187, 435);
    await new Promise((r) => setTimeout(r, 8000));

    // 6. Shell Tab 0: Tìm kèo
    console.log('Capturing Shell Tab 0 (Tìm kèo) 375px...');
    await page.screenshot({ path: path.join(parityDir, 'shell-rooms-375px-flutter.png') });
    console.log('Saved shell-rooms-375px-flutter.png');

    // 7. Notification Sheet (click bell at x: 345, y: 28)
    console.log('Opening Notification Sheet...');
    await page.mouse.click(345, 28);
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(parityDir, 'notification-sheet-375px-flutter.png') });
    console.log('Saved notification-sheet-375px-flutter.png');

    // Dismiss sheet
    await page.mouse.click(187, 100);
    await new Promise((r) => setTimeout(r, 800));

    // 8. Shell Tab 1: Xếp hạng (click x: 140, y: 760)
    console.log('Switching to Tab 1 (Xếp hạng)...');
    await page.mouse.click(140, 760);
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(parityDir, 'shell-rankings-375px-flutter.png') });
    console.log('Saved shell-rankings-375px-flutter.png');

    // 9. Shell Tab 2: Giải đấu (click x: 235, y: 760)
    console.log('Switching to Tab 2 (Giải đấu)...');
    await page.mouse.click(235, 760);
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(parityDir, 'shell-tournaments-375px-flutter.png') });
    console.log('Saved shell-tournaments-375px-flutter.png');

    // 10. Shell Tab 3: Hồ sơ (click x: 328, y: 760)
    console.log('Switching to Tab 3 (Hồ sơ)...');
    await page.mouse.click(328, 760);
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(parityDir, 'shell-profile-375px-flutter.png') });
    console.log('Saved shell-profile-375px-flutter.png');

    await page.close();

    // -------------------------------------------------------------
    // Viewport 2: 1440 x 900 (Desktop)
    // -------------------------------------------------------------
    const deskPage = await browser.newPage();
    await deskPage.setViewport({ width: 1440, height: 900 });

    // Splash 1440px
    console.log('Capturing Flutter Splash 1440px...');
    await deskPage.goto('http://localhost:5050', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 600));
    await deskPage.screenshot({ path: path.join(parityDir, 'splash-1440px-flutter.png') });
    console.log('Saved splash-1440px-flutter.png');

    await new Promise((r) => setTimeout(r, 3500));

    // Auth Login 1440px
    console.log('Capturing Auth Login 1440px...');
    await deskPage.screenshot({ path: path.join(parityDir, 'auth-login-1440px-flutter.png') });
    console.log('Saved auth-login-1440px-flutter.png');

    // Auth SignUp 1440px (Desktop center is 720. Segmented switcher is around 720)
    // Tab switcher width is 460px (max-width). Left is 720 - 230 = 490. Right is 720 + 230 = 950.
    // Đăng ký is around x: 835, y: 224
    await deskPage.mouse.click(835, 224);
    await new Promise((r) => setTimeout(r, 800));
    await deskPage.screenshot({ path: path.join(parityDir, 'auth-signup-1440px-flutter.png') });
    console.log('Saved auth-signup-1440px-flutter.png');

    // Login on Desktop
    await deskPage.mouse.click(605, 224); // Đăng nhập
    await new Promise((r) => setTimeout(r, 500));

    // Email at 720, 290
    await deskPage.mouse.click(720, 290);
    await new Promise((r) => setTimeout(r, 300));
    await deskPage.keyboard.type('bp@gmail.com', { delay: 40 });

    // Password at 720, 370
    await deskPage.mouse.click(720, 370);
    await new Promise((r) => setTimeout(r, 300));
    await deskPage.keyboard.type('12345678@', { delay: 40 });

    // Submit at 720, 480
    await deskPage.mouse.click(720, 480);
    await new Promise((r) => setTimeout(r, 8000));

    // Shell Tab 0 1440px
    console.log('Capturing Shell 1440px...');
    await deskPage.screenshot({ path: path.join(parityDir, 'shell-rooms-1440px-flutter.png') });
    console.log('Saved shell-rooms-1440px-flutter.png');

    await deskPage.close();
    console.log('Flutter captures complete!');
  } catch (err) {
    console.error('Error in captureAllFlutter:', err);
  } finally {
    await browser.close();
  }
}

captureAllFlutter();

