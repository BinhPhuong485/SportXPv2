const puppeteer = require('puppeteer-core');
const path = require('path');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    console.log('Navigating to Flutter web...');
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Login if needed
    console.log('Logging in to Flutter app...');
    await page.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type('bp@gmail.com', { delay: 20 });

    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type((process.env.TEST_PWD || ""), { delay: 20 });

    await page.mouse.click(187, 435);
    console.log('Waiting for ManagedRoomsPage (Tab 0)...');
    await new Promise((r) => setTimeout(r, 7000));

    // Capture ManagedRoomsPage with real room cards
    console.log('Capturing room-card-list-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'room-card-list-375px-flutter.png') });

    // Click on the first RoomCard (around x: 187, y: 300)
    console.log('Clicking on the first RoomCard...');
    await page.mouse.click(187, 300);
    await new Promise((r) => setTimeout(r, 3000));

    console.log('Capturing room-detail-host-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'room-detail-host-375px-flutter.png') });

    // Click Share icon in AppBar (around x: 300, y: 40)
    console.log('Clicking share icon...');
    await page.mouse.click(300, 40);
    await new Promise((r) => setTimeout(r, 1500));

    console.log('Capturing room-qr-sheet-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'room-qr-sheet-375px-flutter.png') });

    // Dismiss share sheet (click top)
    await page.mouse.click(187, 100);
    await new Promise((r) => setTimeout(r, 1000));

    // Click "Hủy buổi" button at bottom (around x: 100, y: 770)
    console.log('Clicking Hủy buổi button...');
    await page.mouse.click(100, 770);
    await new Promise((r) => setTimeout(r, 1500));

    console.log('Capturing room-leave-dialog-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'room-leave-dialog-375px-flutter.png') });

    await page.close();
    console.log('Flutter test captures complete!');
  } catch (e) {
    console.error('Error in Flutter capture:', e);
  } finally {
    await browser.close();
  }
}

test();

