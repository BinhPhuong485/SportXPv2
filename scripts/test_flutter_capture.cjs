const puppeteer = require('puppeteer-core');

async function test() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    console.log('Navigating to http://localhost:5050...');
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('Page loaded. Waiting for Flutter rendering...');
    await new Promise((r) => setTimeout(r, 4000));
    const outPath = 'E:/SQUARE/STUDY/EXE/v3/parity-shots/test-flutter-puppeteer.png';
    await page.screenshot({ path: outPath });
    console.log('Screenshot saved to', outPath);
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

test();

