const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const distDir = path.join(__dirname, '..', 'dist');
const parityDir = path.join(__dirname, '..', 'parity-shots');

if (!fs.existsSync(parityDir)) {
  fs.mkdirSync(parityDir, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(distDir, reqPath);

  if (reqPath === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function run() {
  await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));
  console.log('Static server started at http://127.0.0.1:4173');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    // -----------------------------------------------------------------
    // 1. Mobile (375 x 812)
    // -----------------------------------------------------------------
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    // Splash 375px
    console.log('Capturing React Splash 375px...');
    await page.goto('http://127.0.0.1:4173/#/splash?theme=light&noExit=true');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(parityDir, 'splash-375px-react.png') });

    // Auth Login 375px
    console.log('Capturing React Auth Login 375px...');
    await page.goto('http://127.0.0.1:4173/#/auth?theme=light');
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(parityDir, 'auth-login-375px-react.png') });

    // Auth SignUp 375px
    console.log('Switching to SignUp tab...');
    // Find button containing text "Đăng ký"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signupBtn = btns.find((b) => b.textContent && b.textContent.includes('Đăng ký'));
      if (signupBtn) signupBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(parityDir, 'auth-signup-375px-react.png') });

    // Switch back to Login
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find((b) => b.textContent && b.textContent.includes('Đăng nhập'));
      if (loginBtn) loginBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Forgot password sheet 375px
    console.log('Opening Forgot Password sheet...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('button, a, span'));
      const forgot = links.find((el) => el.textContent && el.textContent.includes('Quên mật khẩu'));
      if (forgot) forgot.click();
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: path.join(parityDir, 'forgot-password-375px-react.png') });

    // Close forgot password modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Đóng"], button[title="Đóng"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Perform Login
    console.log('Performing login in React...');
    await page.type('input[type="email"]', 'bp@gmail.com');
    await page.type('input[type="password"]', '12345678@');
    await page.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 4000));

    // Tab 0: Rooms 375px
    console.log('Capturing React Shell Rooms 375px...');
    await page.goto('http://127.0.0.1:4173/#/rooms?theme=light');
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(parityDir, 'shell-rooms-375px-react.png') });

    // Notification Sheet 375px
    console.log('Opening Notification Sheet in React...');
    await page.evaluate(() => {
      const bell = document.querySelector('button[title="Thông báo"], button[aria-label="Thông báo"]');
      if (bell) bell.click();
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: path.join(parityDir, 'notification-sheet-375px-react.png') });

    // Close notification sheet
    await page.mouse.click(187, 80);
    await new Promise((r) => setTimeout(r, 500));

    // Tab 1: Rankings 375px
    console.log('Capturing React Shell Rankings 375px...');
    await page.goto('http://127.0.0.1:4173/#/rankings?theme=light');
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(parityDir, 'shell-rankings-375px-react.png') });

    // Tab 2: Tournaments 375px
    console.log('Capturing React Shell Tournaments 375px...');
    await page.goto('http://127.0.0.1:4173/#/tournaments?theme=light');
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(parityDir, 'shell-tournaments-375px-react.png') });

    // Tab 3: Profile 375px
    console.log('Capturing React Shell Profile 375px...');
    await page.goto('http://127.0.0.1:4173/#/profile?theme=light');
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(parityDir, 'shell-profile-375px-react.png') });

    // Room Editor 375px
    console.log('Capturing React Room Editor 375px...');
    await page.goto('http://127.0.0.1:4173/#/rooms/new?theme=light');
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(parityDir, 'room-editor-375px-react.png') });

    await page.close();

    // -----------------------------------------------------------------
    // 2. Desktop (1440 x 900)
    // -----------------------------------------------------------------
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1440, height: 900 });

    // Splash 1440px
    console.log('Capturing React Splash 1440px...');
    await desk.goto('http://127.0.0.1:4173/#/splash?theme=light&noExit=true');
    await new Promise((r) => setTimeout(r, 600));
    await desk.screenshot({ path: path.join(parityDir, 'splash-1440px-react.png') });

    // Auth Login 1440px
    console.log('Capturing React Auth Login 1440px...');
    await desk.goto('http://127.0.0.1:4173/#/auth?theme=light');
    await new Promise((r) => setTimeout(r, 800));
    await desk.screenshot({ path: path.join(parityDir, 'auth-login-1440px-react.png') });

    // Auth SignUp 1440px
    console.log('Capturing React Auth SignUp 1440px...');
    await desk.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signupBtn = btns.find((b) => b.textContent && b.textContent.includes('Đăng ký'));
      if (signupBtn) signupBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await desk.screenshot({ path: path.join(parityDir, 'auth-signup-1440px-react.png') });

    // Login on Desktop
    await desk.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find((b) => b.textContent && b.textContent.includes('Đăng nhập'));
      if (loginBtn) loginBtn.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    await desk.type('input[type="email"]', 'bp@gmail.com');
    await desk.type('input[type="password"]', '12345678@');
    await desk.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 4000));

    // Shell Rooms 1440px
    console.log('Capturing React Shell Rooms 1440px...');
    await desk.goto('http://127.0.0.1:4173/#/rooms?theme=light');
    await new Promise((r) => setTimeout(r, 1200));
    await desk.screenshot({ path: path.join(parityDir, 'shell-rooms-1440px-react.png') });

    await desk.close();

    console.log('All React screens captured successfully!');
  } catch (err) {
    console.error('Error capturing React:', err);
  } finally {
    await browser.close();
    server.close();
  }
}

run();

