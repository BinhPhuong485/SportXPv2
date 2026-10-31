const puppeteer = require('puppeteer-core');

async function testLogin() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('http://localhost:5050', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 4000));

    // Capture Auth Login screen
    await page.screenshot({ path: 'E:/SQUARE/STUDY/EXE/v3/parity-shots/auth-login-375px-flutter.png' });
    console.log('Saved auth-login-375px-flutter.png');

    // Click on "Đăng ký" tab (x: 270, y: 235)
    await page.mouse.click(270, 235);
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: 'E:/SQUARE/STUDY/EXE/v3/parity-shots/auth-signup-375px-flutter.png' });
    console.log('Saved auth-signup-375px-flutter.png');

    // Switch back to "Đăng nhập" (x: 100, y: 235)
    await page.mouse.click(100, 235);
    await new Promise((r) => setTimeout(r, 600));

    // Click on "Quên mật khẩu?" link (x: 300, y: 450)
    await page.mouse.click(300, 450);
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: 'E:/SQUARE/STUDY/EXE/v3/parity-shots/forgot-password-375px-flutter.png' });
    console.log('Saved forgot-password-375px-flutter.png');

    // Dismiss bottom sheet by clicking outside/top (x: 187, y: 100)
    await page.mouse.click(187, 100);
    await new Promise((r) => setTimeout(r, 800));

    // Type email: click on email input (x: 187, y: 325)
    await page.mouse.click(187, 325);
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.type('bp@gmail.com');

    // Type password: click on password input (x: 187, y: 405)
    await page.mouse.click(187, 405);
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.type((process.env.TEST_PWD || ""));

    // Click "ĐĂNG NHẬP" button (x: 187, y: 520)
    console.log('Submitting login...');
    await page.mouse.click(187, 520);
    // Wait for Supabase login & OnboardingGate
    await new Promise((r) => setTimeout(r, 6000));

    // Now capture the shell
    await page.screenshot({ path: 'E:/SQUARE/STUDY/EXE/v3/parity-shots/shell-tab0-375px-flutter.png' });
    console.log('Saved shell-tab0-375px-flutter.png');

  } catch (err) {
    console.error('Error during testLogin:', err);
  } finally {
    await browser.close();
  }
}

testLogin();

