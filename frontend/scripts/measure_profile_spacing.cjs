const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function measure() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const viewports = [
    { name: '375px', width: 375, height: 812 },
    { name: '1440px', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    console.log(`\n=== MEASUREMENTS AT ${vp.name} (${vp.width}x${vp.height}) ===`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });

    await page.goto('http://localhost:5174/#/dev/profile-preview', {
      waitUntil: 'networkidle0',
      timeout: 15000,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const measurements = await page.evaluate(() => {
      // Find all ProfileSectionCard containers
      const cards = Array.from(document.querySelectorAll('.rounded-bento'));
      const blockResults = [];

      cards.forEach((card, idx) => {
        // Find inner bezel container if doubleBezel
        const innerBezel = card.querySelector('.rounded-\\[16px\\]') || card;
        const cardStyle = window.getComputedStyle(innerBezel);

        // Find section heading
        const heading = card.querySelector('h2, h3, h4');
        const headingStyle = heading ? window.getComputedStyle(heading) : null;

        blockResults.push({
          index: idx + 1,
          tag: heading ? heading.tagName : 'NONE',
          title: heading ? heading.innerText.trim() : 'Hero/Card',
          padding: `${cardStyle.paddingTop} ${cardStyle.paddingRight} ${cardStyle.paddingBottom} ${cardStyle.paddingLeft}`,
          fontSize: headingStyle ? headingStyle.fontSize : 'N/A',
          fontWeight: headingStyle ? headingStyle.fontWeight : 'N/A',
        });
      });

      // Measure vertical gap between direct children of PageContent
      const pageContentDiv = document.querySelector('.max-w-content');
      const contentStyle = pageContentDiv ? window.getComputedStyle(pageContentDiv) : null;
      const rowGap = contentStyle ? contentStyle.rowGap || contentStyle.gap : 'N/A';

      return { blocks: blockResults, containerGap: rowGap };
    });

    console.log(`Container Row Gap: ${measurements.containerGap}`);
    console.table(measurements.blocks);
    await page.close();
  }

  await browser.close();
}

measure().catch(console.error);

