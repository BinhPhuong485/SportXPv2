const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const parityDir = path.join(__dirname, '..', 'parity-shots');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const password = process.env.TEST_PWD;

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    console.log('Navigating to Flutter on http://localhost:5050...');
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    // Log in if needed
    console.log('Logging in Flutter...');
    await page.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type('bp@gmail.com', { delay: 15 });

    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type(password, { delay: 15 });

    await page.mouse.click(187, 435);
    await new Promise((r) => setTimeout(r, 6000));

    // Tab 3: Hồ sơ is at x ~ 328, y ~ 785 (at 375x812)
    console.log('Switching to Tab 3 (Hồ sơ) in Flutter...');
    await page.mouse.click(328, 785);
    await new Promise((r) => setTimeout(r, 3000));

    console.log('Capturing profile-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'profile-375px-flutter.png') });

    // Open Edit Profile in Flutter (edit button is near top right at x ~ 335, y ~ 125)
    console.log('Clicking edit profile in Flutter...');
    await page.mouse.click(335, 125);
    await new Promise((r) => setTimeout(r, 1500));
    console.log('Capturing profile-edit-sheet-375px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'profile-edit-sheet-375px-flutter.png') });

    // Close edit sheet by clicking top
    await page.mouse.click(187, 50);
    await new Promise((r) => setTimeout(r, 800));

    // 1440px desktop
    await page.setViewport({ width: 1440, height: 900 });
    await new Promise((r) => setTimeout(r, 2000));
    console.log('Capturing profile-1440px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'profile-1440px-flutter.png') });

    // Click edit on 1440px
    await page.mouse.click(1050, 125);
    await new Promise((r) => setTimeout(r, 1500));
    console.log('Capturing profile-edit-sheet-1440px-flutter.png...');
    await page.screenshot({ path: path.join(parityDir, 'profile-edit-sheet-1440px-flutter.png') });

    console.log('Flutter profile shots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Error in Flutter profile capture:', err);
  process.exit(1);
});

