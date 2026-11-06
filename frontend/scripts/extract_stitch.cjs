const fs = require('fs');
const path = require('path');

const outDir = path.resolve('frontend/parity-shots/stitch_references');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function processFile(jsonPath, imgOut, htmlOut) {
  try {
    if (!fs.existsSync(jsonPath)) return;
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const json = JSON.parse(raw);
    if (json.image && imgOut) {
      fs.writeFileSync(imgOut, Buffer.from(json.image, 'base64'));
      console.log('Saved Image:', imgOut);
    }
    if (json.html && htmlOut) {
      fs.writeFileSync(htmlOut, json.html, 'utf8');
      console.log('Saved HTML:', htmlOut);
    }
  } catch (err) {
    console.error('Error processing', jsonPath, err.message);
  }
}

// 1. Leaderboard (step 2014 html, step 2030 image)
processFile(
  'C:/Users/hoang/.gemini/antigravity/brain/896fce80-26ec-450a-bf06-bee979badcea/.system_generated/steps/2014/output.txt',
  null,
  path.join(outDir, 'screen1_leaderboard.html')
);
processFile(
  'C:/Users/hoang/.gemini/antigravity/brain/896fce80-26ec-450a-bf06-bee979badcea/.system_generated/steps/2030/output.txt',
  path.join(outDir, 'screen1_leaderboard.png'),
  null
);

// 2. Matchmaking Lobby (step 2016 for html, step 2020 for image)
processFile(
  'C:/Users/hoang/.gemini/antigravity/brain/896fce80-26ec-450a-bf06-bee979badcea/.system_generated/steps/2016/output.txt',
  null,
  path.join(outDir, 'screen2_matchmaking_lobby.html')
);
processFile(
  'C:/Users/hoang/.gemini/antigravity/brain/896fce80-26ec-450a-bf06-bee979badcea/.system_generated/steps/2020/output.txt',
  path.join(outDir, 'screen2_matchmaking_lobby.png'),
  null
);

// 3. Feed & Community (step 2018 for html, step 2022 for image)
processFile(
  'C:/Users/hoang/.gemini/antigravity/brain/896fce80-26ec-450a-bf06-bee979badcea/.system_generated/steps/2018/output.txt',
  null,
  path.join(outDir, 'screen3_feed_community.html')
);
processFile(
  'C:/Users/hoang/.gemini/antigravity/brain/896fce80-26ec-450a-bf06-bee979badcea/.system_generated/steps/2022/output.txt',
  path.join(outDir, 'screen3_feed_community.png'),
  null
);
