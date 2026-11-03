const puppeteer = require('puppeteer-core');
const path = require('path');

const parityDir = 'E:/SQUARE/STUDY/EXE/v3/parity-shots';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureRankings1440() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // 1. Flutter Rankings 1440px
    console.log('--- FLUTTER 1440px RANKINGS ---');
    const fPage = await browser.newPage();
    await fPage.setViewport({ width: 1440, height: 900 });
    await fPage.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Log in
    await fPage.mouse.click(720, 250);
    await new Promise((r) => setTimeout(r, 150));
    await fPage.keyboard.type('bp@gmail.com', { delay: 15 });

    await fPage.mouse.click(720, 325);
    await new Promise((r) => setTimeout(r, 150));
    await fPage.keyboard.type((process.env.TEST_PWD || ""), { delay: 15 });

    await fPage.mouse.click(720, 435);
    await new Promise((r) => setTimeout(r, 6000));

    // Tab 1 is Xếp hạng (y ~ 870 at 1440px, or bottom bar x ~ 540)
    console.log('Clicking Tab 1 (Xếp hạng) in Flutter 1440px...');
    await fPage.mouse.click(540, 875);
    await new Promise((r) => setTimeout(r, 2500));

    // Click on court picker (around x: 720, y: 80)
    console.log('Opening CourtPicker in Flutter 1440px...');
    await fPage.mouse.click(720, 80);
    await new Promise((r) => setTimeout(r, 1500));
    console.log('Capturing rankings-court-picker-1440px-flutter.png...');
    await fPage.screenshot({ path: path.join(parityDir, 'rankings-court-picker-1440px-flutter.png') });

    // Close court picker
    await fPage.mouse.click(720, 50);
    await new Promise((r) => setTimeout(r, 1000));

    // Click on player row (around x: 720, y: 550)
    console.log('Opening PlayerDetail in Flutter 1440px...');
    await fPage.mouse.click(720, 550);
    await new Promise((r) => setTimeout(r, 1500));
    console.log('Capturing rankings-player-detail-1440px-flutter.png...');
    await fPage.screenshot({ path: path.join(parityDir, 'rankings-player-detail-1440px-flutter.png') });

    // 2. React Rankings 1440px
    console.log('--- REACT 1440px RANKINGS ---');
    const rPage = await browser.newPage();
    await rPage.setViewport({ width: 1440, height: 900 });
    await rPage.goto('http://localhost:5174/rankings', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    // Open CourtPicker in React
    console.log('Opening CourtPicker in React 1440px...');
    await rPage.evaluate(() => {
      const courtBtn = document.querySelector('button[title="Đổi sân"], button:has(svg.lucide-map-pin)') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sân'));
      if (courtBtn) courtBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing rankings-court-picker-1440px-react.png (Light)...');
    await rPage.screenshot({ path: path.join(parityDir, 'rankings-court-picker-1440px-react.png') });

    // Dark theme court picker
    await rPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing rankings-court-picker-1440px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'rankings-court-picker-1440px-react-dark.png') });

    // Close court picker
    await rPage.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await rPage.keyboard.press('Escape');
    await rPage.mouse.click(720, 50);
    await new Promise((r) => setTimeout(r, 600));

    // Open PlayerDetail in React
    console.log('Opening PlayerDetail in React 1440px...');
    await rPage.evaluate(() => {
      const row = document.querySelector('.cursor-pointer, [role="button"]');
      if (row) row.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing rankings-player-detail-1440px-react.png (Light)...');
    await rPage.screenshot({ path: path.join(parityDir, 'rankings-player-detail-1440px-react.png') });

    // Dark theme player detail
    await rPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing rankings-player-detail-1440px-react-dark.png...');
    await rPage.screenshot({ path: path.join(parityDir, 'rankings-player-detail-1440px-react-dark.png') });

    console.log('Rankings 1440px capture finished successfully!');
  } finally {
    await browser.close();
  }
}

captureRankings1440().catch(console.error);
