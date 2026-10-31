const { execFileSync, spawn } = require('child_process');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body><h1 id="w"></h1><script>document.getElementById("w").innerText = window.innerWidth + "x" + window.innerHeight + " / clientWidth:" + document.documentElement.clientWidth;</script></body></html>`;
fs.writeFileSync('E:/SQUARE/STUDY/EXE/v3/dist/test_size.html', html);

const server = spawn('node', ['E:/SQUARE/STUDY/EXE/v3/scripts/server.cjs']);
setTimeout(() => {
  try {
    const dumped = execFileSync(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--enable-viewport',
      '--window-size=375,812',
      '--dump-dom',
      'http://127.0.0.1:4173/test_size.html'
    ]).toString();
    console.log('DOM RESULT:', dumped);
  } finally {
    server.kill();
  }
}, 1500);
