const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const distDir = path.join(__dirname, '..', 'dist');
const brainDir = 'C:\\Users\\MS Phung\\.gemini\\antigravity\\brain\\32054344-2dab-4079-82dc-7c3438cdf363';

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

server.listen(4173, '127.0.0.1', () => {
  console.log('Static server ready on http://127.0.0.1:4173');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const targets = [
    {
      name: 'auth-375px.png',
      width: 375,
      height: 812,
      url: 'http://127.0.0.1:4173/#/auth',
    },
    {
      name: 'auth-1440px.png',
      width: 1440,
      height: 900,
      url: 'http://127.0.0.1:4173/#/auth',
    },
    {
      name: 'shell-feed-375px.png',
      width: 375,
      height: 812,
      url: 'http://127.0.0.1:4173/?mock=true#/',
    },
    {
      name: 'shell-feed-1440px.png',
      width: 1440,
      height: 900,
      url: 'http://127.0.0.1:4173/?mock=true#/',
    },
    {
      name: 'shell-rooms-375px.png',
      width: 375,
      height: 812,
      url: 'http://127.0.0.1:4173/?mock=true#/rooms',
    },
    {
      name: 'shell-rankings-375px.png',
      width: 375,
      height: 812,
      url: 'http://127.0.0.1:4173/?mock=true#/rankings',
    },
    {
      name: 'shell-profile-375px.png',
      width: 375,
      height: 812,
      url: 'http://127.0.0.1:4173/?mock=true#/profile',
    },
  ];

  for (const t of targets) {
    const outPath = path.join(brainDir, t.name);
    console.log(`Capturing ${t.name} (${t.width}x${t.height})...`);
    execFileSync(chromePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      `--window-size=${t.width},${t.height}`,
      `--screenshot=${outPath}`,
      t.url,
    ]);
    if (fs.existsSync(outPath)) {
      console.log(`Saved: ${t.name} (${fs.statSync(outPath).size} bytes)`);
    } else {
      console.error(`Failed to capture: ${t.name}`);
    }
  }

  server.close(() => {
    console.log('All screenshots captured successfully.');
    process.exit(0);
  });
});

