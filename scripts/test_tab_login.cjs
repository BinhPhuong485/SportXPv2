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

    console.log('Clicking Email at (187, 250)...');
    await page.mouse.click(187, 250);
    await new Promise((r) => setTimeout(r, 400));
    await page.keyboard.type('bp@gmail.com', { delay: 40 });

    console.log('Clicking Password at (187, 325)...');
    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 400));
    await page.keyboard.type('12345678@', { delay: 40 });

    console.log('Clicking ĐĂNG NHẬP at (187, 435)...');
    await page.mouse.click(187, 435);

    console.log('Waiting for login response...');
    await new Promise((r) => setTimeout(r, 8000));

    const outPath = 'E:/SQUARE/STUDY/EXE/v3/parity-shots/flutter-tab-login.png';
    await page.screenshot({ path: outPath });
    console.log('Saved to', outPath);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

run();
