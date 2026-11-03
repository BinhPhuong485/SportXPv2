const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const password = process.env.TEST_PWD;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'bp@gmail.com');
    await page.type('input[type="password"]', password);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const login = btns.find((b) => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
      if (login) login.click();
    });
    await new Promise((r) => setTimeout(r, 3000));
    await page.goto('http://localhost:5174/#/profile', { waitUntil: 'networkidle0' });
    await page.waitForSelector('button[title="Chỉnh sửa hồ sơ"]', { timeout: 10000 });

    await page.click('button[title="Chỉnh sửa hồ sơ"]');
    await page.waitForSelector('input[placeholder="Nhập tên của bạn..."]', { timeout: 5000 });

    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Nhập tên của bạn..."]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Square');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find((b) => b.textContent && b.textContent.includes('LƯU THAY ĐỔI'));
      if (saveBtn) saveBtn.click();
    });

    await new Promise((r) => setTimeout(r, 2500));
    const h2 = await page.evaluate(() => document.querySelector('h2')?.textContent.trim());
    console.log('Final restored profile name:', h2);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
