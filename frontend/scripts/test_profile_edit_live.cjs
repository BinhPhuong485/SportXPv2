const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const parityDir = path.join(__dirname, '..', 'parity-shots');
if (!fs.existsSync(parityDir)) fs.mkdirSync(parityDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const password = process.env.TEST_PWD;
if (!password) {
  console.error('Missing TEST_PWD environment variable');
  process.exit(1);
}

async function loginUser(page, email) {
  console.log(`Logging in with ${email}...`);
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://localhost:5174/#/auth', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });

  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const login = btns.find((b) => b.textContent && b.textContent.includes('ĐĂNG NHẬP'));
    if (login) login.click();
  });

  await new Promise((r) => setTimeout(r, 3500));
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    await loginUser(page, 'bp@gmail.com');
    await page.goto('http://localhost:5174/#/profile', { waitUntil: 'networkidle0' });
    await page.waitForSelector('button[title="Chỉnh sửa hồ sơ"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1000));

    // 1. Capture React Profile 375px Light & Dark
    console.log('Capturing profile-375px-react.png (Light)...');
    await page.screenshot({ path: path.join(parityDir, 'profile-375px-react.png') });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing profile-375px-react-dark.png...');
    await page.screenshot({ path: path.join(parityDir, 'profile-375px-react-dark.png') });

    // 2. Capture React Profile 1440px Light & Dark
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing profile-1440px-react.png (Light)...');
    await page.screenshot({ path: path.join(parityDir, 'profile-1440px-react.png') });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing profile-1440px-react-dark.png...');
    await page.screenshot({ path: path.join(parityDir, 'profile-1440px-react-dark.png') });

    // 3. Open Edit Sheet and capture at 1440px & 375px
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      const editBtn = document.querySelector('button[title="Chỉnh sửa hồ sơ"]');
      if (editBtn) editBtn.click();
    });
    const inputSelector = 'input[placeholder="Nhập tên của bạn..."]';
    await page.waitForSelector(inputSelector, { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 600));

    console.log('Capturing profile-edit-sheet-1440px-react.png (Light)...');
    await page.screenshot({ path: path.join(parityDir, 'profile-edit-sheet-1440px-react.png') });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing profile-edit-sheet-1440px-react-dark.png...');
    await page.screenshot({ path: path.join(parityDir, 'profile-edit-sheet-1440px-react-dark.png') });

    // Switch back to 375px for edit sheet
    await page.setViewport({ width: 375, height: 812 });
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Capturing profile-edit-sheet-375px-react.png (Light)...');
    await page.screenshot({ path: path.join(parityDir, 'profile-edit-sheet-375px-react.png') });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    console.log('Capturing profile-edit-sheet-375px-react-dark.png...');
    await page.screenshot({ path: path.join(parityDir, 'profile-edit-sheet-375px-react-dark.png') });

    // Reset to light theme for live edit test
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });

    // 4. PERFORM LIVE PROFILE EDIT & RESTORE TEST
    console.log('--- STARTING LIVE PROFILE EDIT & RESTORE TEST ---');

    // Record original values from inputs
    const originalValues = await page.evaluate(() => {
      const nameInput = document.querySelector('input[placeholder="Nhập tên của bạn..."]');
      const courtSelect = document.querySelector('select');
      return {
        name: nameInput ? nameInput.value : '',
        courtId: courtSelect ? courtSelect.value : '',
      };
    });
    console.log('Original Profile Values:', JSON.stringify(originalValues));

    // Type test name using React native property descriptor
    const testName = '[TEST] ' + originalValues.name;
    console.log(`Setting new test name: "${testName}"...`);

    await page.evaluate((newName) => {
      const input = document.querySelector('input[placeholder="Nhập tên của bạn..."]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, newName);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find((b) => b.textContent && b.textContent.includes('LƯU THAY ĐỔI'));
      if (saveBtn) saveBtn.click();
    }, testName);

    await new Promise((r) => setTimeout(r, 2500));

    // Verify updated name in profile header
    const updatedName = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      return h2 ? h2.textContent.trim() : '';
    });
    console.log('Verified Updated Profile Name in UI:', updatedName);
    if (!updatedName.includes('[TEST]')) {
      throw new Error(`Profile name was not updated! Got: "${updatedName}"`);
    }

    // Capture edited screenshot
    await page.screenshot({ path: path.join(parityDir, 'profile-edited-375px-react.png') });

    // Now RESTORE original value!
    console.log(`Restoring original name: "${originalValues.name}"...`);
    await page.click('button[title="Chỉnh sửa hồ sơ"]');
    await page.waitForSelector(inputSelector, { timeout: 5000 });

    await page.evaluate((origName) => {
      const input = document.querySelector('input[placeholder="Nhập tên của bạn..."]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, origName);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find((b) => b.textContent && b.textContent.includes('LƯU THAY ĐỔI'));
      if (saveBtn) saveBtn.click();
    }, originalValues.name);

    await new Promise((r) => setTimeout(r, 2500));

    // Verify restored name
    const restoredName = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      return h2 ? h2.textContent.trim() : '';
    });
    console.log('Verified Restored Profile Name in UI:', restoredName);
    if (restoredName !== originalValues.name) {
      throw new Error(`Profile name was not restored! Got: "${restoredName}", expected: "${originalValues.name}"`);
    }

    await page.screenshot({ path: path.join(parityDir, 'profile-restored-375px-react.png') });
    console.log('--- LIVE PROFILE EDIT & RESTORE COMPLETED CLEANLY! ---');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Error in profile test script:', err);
  process.exit(1);
});
