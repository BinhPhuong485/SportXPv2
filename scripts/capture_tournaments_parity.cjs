const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureTournaments() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // 1. Flutter Tournaments at 375x812
    console.log('--- FLUTTER 375px ---');
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Log in if needed
    console.log('Logging in Flutter...');
    await page.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type('bp@gmail.com', { delay: 15 });

    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type('12345678@', { delay: 15 });

    await page.mouse.click(187, 435);
    await new Promise((r) => setTimeout(r, 6000));

    // In bottom navigation bar (at y ~ 780): Tab 0 is x ~ 47, Tab 1 is x ~ 140, Tab 2 is x ~ 235, Tab 3 is x ~ 328
    console.log('Switching to Tab 2 (Giải đấu) in Flutter...');
    await page.mouse.click(235, 785);
    await new Promise((r) => setTimeout(r, 3000));

    console.log('Capturing tournaments-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'tournaments-375px-flutter.png') });

    // Click on the first tournament card action button (around x: 187, y: 390)
    console.log('Clicking tournament register button in Flutter...');
    await page.mouse.click(187, 390);
    await new Promise((r) => setTimeout(r, 2000));

    console.log('Capturing tournament-register-sheet-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-register-sheet-375px-flutter.png') });

    // 2. Flutter Tournaments at 1440x900
    console.log('--- FLUTTER 1440px ---');
    // Close sheet by clicking outside (top area)
    await page.mouse.click(187, 100);
    await new Promise((r) => setTimeout(r, 1000));

    await page.setViewport({ width: 1440, height: 900 });
    await new Promise((r) => setTimeout(r, 2000));

    console.log('Capturing tournaments-1440px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'tournaments-1440px-flutter.png') });

    // Click on register in desktop (around center x: 720, y: 390)
    console.log('Clicking tournament register button in 1440px Flutter...');
    await page.mouse.click(720, 390);
    await new Promise((r) => setTimeout(r, 2000));

    console.log('Capturing tournament-register-sheet-1440px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'tournament-register-sheet-1440px-flutter.png') });

    // 3. React Tournaments
    console.log('--- REACT ---');
    const rPage = await browser.newPage();
    await rPage.setViewport({ width: 375, height: 812 });
    await rPage.goto('http://localhost:5174/tournaments', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    console.log('Capturing tournaments-375px-react.png (Light)...');
    await rPage.screenshot({ path: path.join(parityDir, 'tournaments-375px-react.png') });

    // Click on register button of first card
    await rPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => x.textContent.includes('ĐĂNG KÝ'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing tournament-register-sheet-375px-react.png (Light)...');
    await rPage.screenshot({ path: path.join(parityDir, 'tournament-register-sheet-375px-react.png') });

    // Switch to dark theme
    await rPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing tournament-register-sheet-375px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'tournament-register-sheet-375px-react-dark.png') });

    // Close sheet
    await rPage.keyboard.press('Escape');
    await rPage.mouse.click(187, 50);
    await new Promise((r) => setTimeout(r, 500));

    console.log('Capturing tournaments-375px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'tournaments-375px-react-dark.png') });

    // 4. React 1440px
    await rPage.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await rPage.setViewport({ width: 1440, height: 900 });
    await new Promise((r) => setTimeout(r, 1000));

    console.log('Capturing tournaments-1440px-react.png (Light)...');
    await rPage.screenshot({ path: path.join(parityDir, 'tournaments-1440px-react.png') });

    // Open sheet at 1440px
    await rPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => x.textContent.includes('ĐĂNG KÝ'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing tournament-register-sheet-1440px-react.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'tournament-register-sheet-1440px-react.png') });

    // Dark sheet at 1440px
    await rPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing tournament-register-sheet-1440px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'tournament-register-sheet-1440px-react-dark.png') });

    // Dark tournaments 1440px
    await rPage.keyboard.press('Escape');
    await rPage.mouse.click(720, 50);
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing tournaments-1440px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'tournaments-1440px-react-dark.png') });

    console.log('Tournaments capture completed successfully!');
  } finally {
    await browser.close();
  }
}

captureTournaments().catch(console.error);
