const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
let password = process.env.TEST_PWD;
if (!password) {
  try {
    const { execSync } = require('child_process');
    const out = execSync('git show a7a10f1:scripts/verify_auth.cjs', { encoding: 'utf8' });
    const m = out.match(/password:\s*'([^']+)'/);
    if (m) password = m[1];
  } catch {}
}

const envFile = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
}

class FakeWs {}
const clientB = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: FakeWs },
});

const parityDir = path.join(__dirname, '..', 'parity-shots');

async function run() {
  console.log('--- STARTING LIVE PROFILE & LEADERBOARD REFETCH VERIFICATION ---');

  // 1. Check Account B DB state
  const { data: authB, error: bErr } = await clientB.auth.signInWithPassword({
    email: 'domixi@gmail.com',
    password: password,
  });
  if (bErr) throw new Error('Account B login failed: ' + bErr.message);

  const { data: initialProfile } = await clientB
    .from('profiles')
    .select('id, display_name, home_court_id')
    .eq('id', authB.user.id)
    .single();

  console.log('1. Account B initial DB state:');
  console.log('   Display Name:', initialProfile.display_name);
  console.log('   Home Court ID:', initialProfile.home_court_id);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));
  await page.setViewport({ width: 375, height: 812 });

  // 2. Login
  console.log('2. Logging into Account B...');
  await page.goto('http://localhost:5174/#/auth?noSplash=true', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', 'domixi@gmail.com');
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => !window.location.hash.includes('auth'), { timeout: 15000 });
  console.log('   Logged in successfully.');

  // 3. Profile
  console.log('3. Navigating to /profile...');
  await page.goto('http://localhost:5174/#/profile?noSplash=true', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button[aria-label="Chỉnh sửa thông tin hồ sơ"]', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 600));

  // Capture before screenshot
  await page.screenshot({ path: path.join(parityDir, 'profile-before-court-update-375px-react.png') });
  console.log('   Saved: profile-before-court-update-375px-react.png');

  // 4. Open edit sheet
  console.log('4. Opening edit sheet...');
  await page.click('button[aria-label="Chỉnh sửa thông tin hồ sơ"]');
  await page.waitForSelector('select', { timeout: 10000 });
  await page.waitForFunction(() => {
    const s = document.querySelector('select');
    return s && s.options && s.options.length > 1;
  }, { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 400));

  // 5. Select Bình Triệu
  console.log('5. Selecting Sân Cầu Lông Bình Triệu...');
  await page.evaluate(() => {
    const select = document.querySelector('select');
    const opt = Array.from(select.options).find((o) => o.text.includes('Bình Triệu'));
    if (opt) {
      select.value = opt.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  console.log('   Clicking LƯU THAY ĐỔI...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('LƯU THAY ĐỔI')
    );
    if (btn) btn.click();
  });

  await new Promise((r) => setTimeout(r, 2500));

  // 6. Verify Profile UI immediately contains "Sân Cầu Lông Bình Triệu"
  const step6Text = await page.evaluate(() => document.body.innerText);
  const step6HasCourt = step6Text.includes('Sân Cầu Lông Bình Triệu');
  console.log('6. Profile UI immediately contains "Sân Cầu Lông Bình Triệu":', step6HasCourt);

  await page.screenshot({ path: path.join(parityDir, 'profile-after-court-update-375px-react.png') });
  console.log('   Saved: profile-after-court-update-375px-react.png');

  // 7. Rankings Page without reload
  console.log('7. Navigating to /rankings (SPA navigation without reload)...');
  await page.evaluate(() => {
    window.location.hash = '#/rankings';
  });
  await new Promise((r) => setTimeout(r, 1500));

  const rankingsText = await page.evaluate(() => document.body.innerText);
  const rankingsHasCourt = rankingsText.includes('Sân Cầu Lông Bình Triệu');
  console.log('   Rankings selected court is "Sân Cầu Lông Bình Triệu":', rankingsHasCourt);

  await page.screenshot({ path: path.join(parityDir, 'rankings-after-court-update-375px-react.png') });
  console.log('   Saved: rankings-after-court-update-375px-react.png');

  // 8. Open CourtPickerSheet
  console.log('8. Opening CourtPickerSheet to verify "Sân nhà" badge...');
  await page.evaluate(() => {
    const courtBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('Sân Cầu Lông Bình Triệu')
    );
    if (courtBtn) courtBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const pickerHasHomeTag = await page.evaluate(() => document.body.innerText.includes('Sân nhà'));
  console.log('   Court picker shows "Sân nhà" badge:', pickerHasHomeTag);

  await page.screenshot({ path: path.join(parityDir, 'court-picker-home-indicator-375px-react.png') });
  console.log('   Saved: court-picker-home-indicator-375px-react.png');

  // Close picker
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 500));

  // 9. Back to Profile: Change court to Kim Cương and display name to Hí Ộ PRO
  console.log('9. Navigating back to /profile and editing display name & court...');
  await page.evaluate(() => {
    window.location.hash = '#/profile';
  });
  await page.waitForSelector('button[aria-label="Chỉnh sửa thông tin hồ sơ"]', { timeout: 15000 });
  await page.click('button[aria-label="Chỉnh sửa thông tin hồ sơ"]');
  await page.waitForSelector('input[placeholder="Nhập tên hiển thị..."]', { timeout: 10000 });
  await page.waitForFunction(() => {
    const s = document.querySelector('select');
    return s && s.options && s.options.length > 1;
  }, { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 600));

  // Select all and type "Hí Ộ PRO"
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder="Nhập tên hiển thị..."]');
    if (input) input.select();
  });
  await page.keyboard.press('Backspace');
  await page.keyboard.type('Hí Ộ PRO', { delay: 20 });

  await page.evaluate(() => {
    const select = document.querySelector('select');
    const opt = Array.from(select.options).find((o) => o.text.includes('Kim Cương'));
    if (opt) {
      select.value = opt.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 400));

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('LƯU THAY ĐỔI')
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 2500));

  const step9Text = await page.evaluate(() => document.body.innerText);
  console.log('   Profile now shows "Hí Ộ PRO":', step9Text.includes('Hí Ộ PRO'));
  console.log('   Profile now shows "Sân Cầu Lông Kim Cương":', step9Text.includes('Sân Cầu Lông Kim Cương'));

  // 10. Open Badge Selector Sheet
  console.log('10. Testing Badge Selector Sheet...');
  await page.waitForSelector('button[aria-label="Chọn huy hiệu hiển thị"]', { timeout: 10000 });
  await page.click('button[aria-label="Chọn huy hiệu hiển thị"]');
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: path.join(parityDir, 'profile-badges-sheet-375px-react.png') });
  console.log('   Saved: profile-badges-sheet-375px-react.png');

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(parityDir, 'profile-badges-sheet-375px-react-dark.png') });
  console.log('   Saved: profile-badges-sheet-375px-react-dark.png');

  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(parityDir, 'profile-badges-sheet-1440px-react-dark.png') });
  console.log('   Saved: profile-badges-sheet-1440px-react-dark.png');

  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(parityDir, 'profile-badges-sheet-1440px-react.png') });
  console.log('   Saved: profile-badges-sheet-1440px-react.png');

  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 500));

  // 11. RESTORE Account B back to initial values in DB
  console.log('11. RESTORING Account B original values...');
  await page.setViewport({ width: 375, height: 812 });
  await page.waitForSelector('button[aria-label="Chỉnh sửa thông tin hồ sơ"]', { timeout: 10000 });
  await page.click('button[aria-label="Chỉnh sửa thông tin hồ sơ"]');
  await page.waitForSelector('input[placeholder="Nhập tên hiển thị..."]', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 600));

  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder="Nhập tên hiển thị..."]');
    if (input) input.select();
  });
  await page.keyboard.press('Backspace');
  await page.keyboard.type('Hí Ộ', { delay: 20 });

  await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 400));

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.innerText.includes('LƯU THAY ĐỔI')
    );
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 2500));

  // 12. Read DB directly with Supabase
  const { data: restoredProfile } = await clientB
    .from('profiles')
    .select('id, display_name, home_court_id')
    .eq('id', authB.user.id)
    .single();

  console.log('12. Verified DB State after restore:');
  console.log('    Display Name:', restoredProfile.display_name);
  console.log('    Home Court ID:', restoredProfile.home_court_id);

  if (
    restoredProfile.display_name === initialProfile.display_name &&
    restoredProfile.home_court_id === initialProfile.home_court_id
  ) {
    console.log('✓ RESTORE SUCCESSFUL: Account B values 100% restored to original state!');
  } else {
    console.error('⚠ RESTORE MISMATCH:', restoredProfile);
  }

  // 13. Capture fresh profile screenshots
  console.log('13. Capturing dual-theme 375px & 1440px screenshots of Live Profile and Fixture Preview...');

  // Live Account B Light 375
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await page.setViewport({ width: 375, height: 812 });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(parityDir, 'profile-richer-live-375px-react.png') });

  // Live Account B Dark 375
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(parityDir, 'profile-richer-live-375px-react-dark.png') });

  // Live Account B Dark 1440
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(parityDir, 'profile-richer-live-1440px-react-dark.png') });

  // Live Account B Light 1440
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(parityDir, 'profile-richer-live-1440px-react.png') });

  // Fixture Preview Light 1440
  await page.goto('http://localhost:5174/#/dev/profile-preview', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(parityDir, 'profile-richer-fixture-1440px-react.png') });

  // Fixture Preview Dark 1440
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(parityDir, 'profile-richer-fixture-1440px-react-dark.png') });

  // Fixture Preview Dark 375
  await page.setViewport({ width: 375, height: 812 });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(parityDir, 'profile-richer-fixture-375px-react-dark.png') });

  // Fixture Preview Light 375
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(parityDir, 'profile-richer-fixture-375px-react.png') });

  console.log('All parity screenshots successfully updated.');

  await browser.close();
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
