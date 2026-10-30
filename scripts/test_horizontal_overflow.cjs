const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const password = process.env.TEST_PWD;

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });

  // Login Account A
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });
  await page.type('input[type="email"]', 'bp@gmail.com');
  await page.type('input[type="password"]', password);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find((b) => b.innerText.includes('Đăng nhập') || b.innerText.includes('TIẾP TỤC'));
    if (loginBtn) loginBtn.click();
  });

  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1000));

  const routes = ['rooms', 'calendar', 'rankings', 'tournaments', 'profile'];
  let allPassed = true;

  for (const r of routes) {
    await page.goto(`http://localhost:5174/#/${r}`, { waitUntil: 'networkidle0' });
    await new Promise((res) => setTimeout(res, 800));

    const check = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const clientW = document.documentElement.clientWidth;
      const bodyW = document.body.scrollWidth;
      return { docW, clientW, bodyW, hasOverflow: docW > clientW || bodyW > clientW };
    });

    console.log(`Route /#/${r}: clientWidth=${check.clientW}, docW=${check.docW}, bodyW=${check.bodyW}, overflow=${check.hasOverflow}`);
    if (check.hasOverflow) allPassed = false;
  }

  await browser.close();
  if (!allPassed) {
    console.error('Horizontal overflow detected!');
    process.exit(1);
  }
  console.log('ALL ROUTES PASSED 375px HORIZONTAL OVERFLOW CHECK!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

