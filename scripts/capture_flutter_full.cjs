const puppeteer = require('puppeteer-core');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4500));

    console.log('Focusing Email field...');
    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 500));
    await page.keyboard.type('bp@gmail.com', { delay: 40 });

    console.log('Focusing Password field...');
    await page.mouse.click(187, 405);
    await new Promise((r) => setTimeout(r, 500));
    await page.keyboard.type('12345678@', { delay: 40 });

    console.log('Clicking ĐĂNG NHẬP button...');
    await page.mouse.click(187, 520);

    console.log('Waiting for login & shell load...');
    await new Promise((r) => setTimeout(r, 7000));

    await page.screenshot({ path: 'E:/SQUARE/STUDY/EXE/v3/parity-shots/flutter-after-login.png' });
    console.log('Captured flutter-after-login.png');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

run();

