const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const parityDir = path.join(__dirname, '..', 'parity-shots');
if (!fs.existsSync(parityDir)) fs.mkdirSync(parityDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Helper for light & dark captures
  async function captureDualTheme(name, viewport, preAction) {
    await page.setViewport(viewport);
    if (preAction) await preAction();

    // Light theme
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await new Promise((r) => setTimeout(r, 400));
    const lightPath = path.join(parityDir, `${name}-${viewport.width}px-react.png`);
    await page.screenshot({ path: lightPath });
    console.log(`Saved ${path.basename(lightPath)}`);

    // Dark theme
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await new Promise((r) => setTimeout(r, 400));
    const darkPath = path.join(parityDir, `${name}-${viewport.width}px-react-dark.png`);
    await page.screenshot({ path: darkPath });
    console.log(`Saved ${path.basename(darkPath)}`);

    // Reset
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  }

  // 1. Splash Screen
  console.log('Capturing Splash...');
  await page.goto('http://localhost:5174/#/splash?noExit=true', { waitUntil: 'networkidle0' });
  await captureDualTheme('splash', { width: 375, height: 812 });
  await captureDualTheme('splash', { width: 1440, height: 900 });

  // 2. Auth Login
  console.log('Capturing Auth Login...');
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await captureDualTheme('auth-login', { width: 375, height: 812 });
  await captureDualTheme('auth-login', { width: 1440, height: 900 });

  // 3. Auth SignUp
  console.log('Capturing Auth SignUp...');
  const switchToSignUp = async () => {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signupBtn = btns.find((b) => b.textContent && b.textContent.includes('Đăng ký'));
      if (signupBtn) signupBtn.click();
    });
    await new Promise((r) => setTimeout(r, 300));
  };
  await captureDualTheme('auth-signup', { width: 375, height: 812 }, switchToSignUp);
  await captureDualTheme('auth-signup', { width: 1440, height: 900 }, switchToSignUp);

  // 4. Forgot Password Sheet
  console.log('Capturing Forgot Password...');
  await page.goto('http://localhost:5174/#/auth?forgot=true', { waitUntil: 'networkidle0' });
  await captureDualTheme('forgot-password', { width: 375, height: 812 });

  await browser.close();
  console.log('=== Group 1 Captures Done! ===');
}

run().catch((err) => {
  console.error('Group 1 capture error:', err);
  process.exit(1);
});

