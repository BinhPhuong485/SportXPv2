const puppeteer = require('puppeteer-core');
const path = require('path');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';

async function captureFlutterRooms() {
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

    console.log('Navigating to Flutter web server on port 5050...');
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Login
    console.log('Logging in to Flutter app...');
    await page.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.type('bp@gmail.com', { delay: 30 });

    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.type('12345678@', { delay: 30 });

    await page.mouse.click(187, 435);
    console.log('Waiting for ManagedRoomsPage (Tab 0)...');
    await new Promise((r) => setTimeout(r, 8000));

    // 1. ManagedRoomsPage Tab 0 (Discover)
    console.log('Capturing managed-rooms-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'managed-rooms-375px-flutter.png') });

    // 2. Click "Nhập mã" button (x: 275, y: 72)
    console.log('Clicking Nhập mã button (275, 72)...');
    await page.mouse.click(275, 72);
    await new Promise((r) => setTimeout(r, 1500));
    console.log('Capturing room-join-code-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'room-join-code-375px-flutter.png') });

    // Dismiss sheet (tap top x: 187, y: 100)
    await page.mouse.click(187, 100);
    await new Promise((r) => setTimeout(r, 800));

    // 3. Click "Bộ lọc" chip (x: 230, y: 145)
    console.log('Clicking Bộ lọc chip (230, 145)...');
    await page.mouse.click(230, 145);
    await new Promise((r) => setTimeout(r, 1500));
    console.log('Capturing room-filter-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'room-filter-375px-flutter.png') });

    // Dismiss filter sheet
    await page.mouse.click(187, 50);
    await new Promise((r) => setTimeout(r, 800));

    // 4. Click "+ TẠO KÈO MỚI" FAB (x: 280, y: 645)
    console.log('Clicking + TẠO KÈO MỚI (280, 645)...');
    await page.mouse.click(280, 645);
    await new Promise((r) => setTimeout(r, 2500));
    console.log('Capturing room-editor-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'room-editor-375px-flutter.png') });

    await page.close();

    // -------------------------------------------------------------
    // Desktop Viewport: 1440 x 900
    // -------------------------------------------------------------
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1440, height: 900 });

    console.log('Navigating Desktop to Flutter web...');
    await desk.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Login on Desktop: container centered around 720
    console.log('Desktop login...');
    await desk.mouse.click(720, 275);
    await new Promise((r) => setTimeout(r, 300));
    await desk.keyboard.type('bp@gmail.com', { delay: 30 });

    await desk.mouse.click(720, 350);
    await new Promise((r) => setTimeout(r, 300));
    await desk.keyboard.type('12345678@', { delay: 30 });

    await desk.mouse.click(720, 460);
    console.log('Waiting for Desktop ManagedRoomsPage...');
    await new Promise((r) => setTimeout(r, 8000));

    // ManagedRoomsPage Desktop
    console.log('Capturing managed-rooms-1440px-flutter.png...');
    await desk.screenshot({ path: path.join(parityDir, 'managed-rooms-1440px-flutter.png') });

    // Click FAB on desktop: max width 720, FAB is at right of screen or bottom-right
    // Let's click "+ TẠO KÈO MỚI" at bottom right: x: 1350, y: 760
    console.log('Clicking FAB on desktop (1350, 760)...');
    await desk.mouse.click(1350, 760);
    await new Promise((r) => setTimeout(r, 2500));
    console.log('Capturing room-editor-1440px-flutter.png...');
    await desk.screenshot({ path: path.join(parityDir, 'room-editor-1440px-flutter.png') });

    await desk.close();
    console.log('Flutter room captures completed!');
  } catch (err) {
    console.error('Error during Flutter capture:', err);
  } finally {
    await browser.close();
  }
}

captureFlutterRooms();

