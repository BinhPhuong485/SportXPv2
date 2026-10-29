const puppeteer = require('puppeteer-core');
const path = require('path');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';

async function captureAuth() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // -------------------------------------------------------------
    // Mobile Viewport: 375 x 812
    // -------------------------------------------------------------
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    console.log('Navigating mobile to Flutter web...');
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    // Wait for Splash animation or Auth page
    await new Promise((r) => setTimeout(r, 4500));

    // Now we are on Auth Login
    console.log('Capturing auth-login-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'auth-login-375px-flutter.png') });

    // Click Đăng ký tab at (270, 180)
    console.log('Clicking Đăng ký tab (270, 180)...');
    await page.mouse.click(270, 180);
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Capturing auth-signup-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'auth-signup-375px-flutter.png') });

    await page.close();

    // -------------------------------------------------------------
    // Desktop Viewport: 1440 x 900
    // -------------------------------------------------------------
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1440, height: 900 });

    console.log('Navigating desktop to Flutter web...');
    await desk.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    console.log('Capturing auth-login-1440px-flutter.png...');
    await desk.screenshot({ path: path.join(parityDir, 'auth-login-1440px-flutter.png') });

    // On Desktop 1440px, form container is centered. Width is 460px.
    // Center is 720. Đăng ký tab is at (720 + 115, 208) = (835, 208)
    console.log('Clicking Đăng ký tab on desktop (835, 208)...');
    await desk.mouse.click(835, 208);
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Capturing auth-signup-1440px-flutter.png...');
    await desk.screenshot({ path: path.join(parityDir, 'auth-signup-1440px-flutter.png') });

    await desk.close();

    console.log('Done capturing auth flutter screens!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

captureAuth();

