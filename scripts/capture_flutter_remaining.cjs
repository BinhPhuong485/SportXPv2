const puppeteer = require('puppeteer-core');
const path = require('path');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';

async function captureFlutter() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // -------------------------------------------------------------
    // 1. Desktop 1440 x 900 (Account A)
    // -------------------------------------------------------------
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1440, height: 900 });

    console.log('Desktop: Navigating to Flutter web...');
    await desk.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Desktop login if needed
    console.log('Desktop login...');
    await desk.mouse.click(720, 275);
    await new Promise((r) => setTimeout(r, 200));
    await desk.keyboard.type('bp@gmail.com', { delay: 20 });

    await desk.mouse.click(720, 350);
    await new Promise((r) => setTimeout(r, 200));
    await desk.keyboard.type('12345678@', { delay: 20 });

    await desk.mouse.click(720, 460);
    console.log('Waiting for Desktop ManagedRoomsPage...');
    await new Promise((r) => setTimeout(r, 7000));

    // Capture Desktop RoomCard list
    console.log('Capturing room-card-list-1440px-flutter.png...');
    await desk.screenshot({ path: path.join(parityDir, 'room-card-list-1440px-flutter.png') });

    // Click on the first RoomCard on desktop (center 720, around y: 320)
    console.log('Clicking on first RoomCard on desktop...');
    await desk.mouse.click(720, 320);
    await new Promise((r) => setTimeout(r, 3000));

    console.log('Capturing room-detail-host-1440px-flutter.png...');
    await desk.screenshot({ path: path.join(parityDir, 'room-detail-host-1440px-flutter.png') });

    await desk.close();

    // -------------------------------------------------------------
    // 2. Mobile 375 x 812 (Account B - domixi@gmail.com)
    // -------------------------------------------------------------
    const pageB = await browser.newPage();
    await pageB.setViewport({ width: 375, height: 812 });

    console.log('Mobile B: Navigating to Flutter web (incognito)...');
    await pageB.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Login as Account B
    await pageB.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 200));
    // Clear and type
    await pageB.keyboard.down('Control');
    await pageB.keyboard.press('KeyA');
    await pageB.keyboard.up('Control');
    await pageB.keyboard.type('domixi@gmail.com', { delay: 20 });

    await pageB.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 200));
    await pageB.keyboard.down('Control');
    await pageB.keyboard.press('KeyA');
    await pageB.keyboard.up('Control');
    await pageB.keyboard.type('12345678@', { delay: 20 });

    await pageB.mouse.click(187, 435);
    console.log('Waiting for Account B ManagedRoomsPage...');
    await new Promise((r) => setTimeout(r, 7000));

    // Click Bell icon (AppBar top right, around x: 345, y: 35)
    console.log('Clicking Bell icon for Account B...');
    await pageB.mouse.click(345, 35);
    await new Promise((r) => setTimeout(r, 2000));
    console.log('Capturing room-notices-375px-flutter.png...');
    await pageB.screenshot({ path: path.join(parityDir, 'room-notices-375px-flutter.png') });

    // Dismiss notices
    await pageB.mouse.click(187, 80);
    await new Promise((r) => setTimeout(r, 800));

    // Click on RoomCard for Account B (member view)
    console.log('Opening RoomDetail from Account B view...');
    await pageB.mouse.click(187, 300);
    await new Promise((r) => setTimeout(r, 3000));
    console.log('Capturing room-detail-member-375px-flutter.png...');
    await pageB.screenshot({ path: path.join(parityDir, 'room-detail-member-375px-flutter.png') });

    await pageB.close();
    console.log('Remaining Flutter captures completed successfully!');
  } catch (err) {
    console.error('Error in Flutter capture:', err);
  } finally {
    await browser.close();
  }
}

captureFlutter();

