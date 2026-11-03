const puppeteer = require('puppeteer-core');
const path = require('path');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';

async function captureSplash() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    console.log('Warming up Flutter web...');
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    // Let it settle
    await new Promise((r) => setTimeout(r, 3000));

    // Now reload and capture at 800ms during splash!
    console.log('Reloading to capture Splash 375px at 900ms...');
    await page.goto('http://localhost:5050');
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: path.join(parityDir, 'splash-375px-flutter.png') });
    console.log('Saved splash-375px-flutter.png');

    // Desktop Splash
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1440, height: 900 });
    console.log('Capturing Desktop Splash 1440px...');
    await desk.goto('http://localhost:5050');
    await new Promise((r) => setTimeout(r, 900));
    await desk.screenshot({ path: path.join(parityDir, 'splash-1440px-flutter.png') });
    console.log('Saved splash-1440px-flutter.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

captureSplash();
