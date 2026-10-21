// Captures frames of the home project counter while it changes (desktop scroll).
const http = require('http'), path = require('path'), handler = require('serve-handler'), sharp = require('sharp');
const { chromium } = require('playwright-core');
const out = process.argv[2];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', process.env.DIST || 'dist'), cleanUrls: true })).listen(4188);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4188/', { waitUntil: 'networkidle' });
  const stageTop = await page.evaluate(() => document.querySelector('.work-stage').getBoundingClientRect().top + scrollY);
  const stageH = await page.evaluate(() => document.querySelector('.work-stage').offsetHeight);
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), stageTop + 10);
  await page.waitForTimeout(800);
  const box = await page.evaluate(() => { const r = document.querySelector('.work-progress .count').getBoundingClientRect(); return { x: r.left - 10, y: r.top - 14, width: 110, height: r.height + 28 }; });
  const frames = [];
  const grab = async () => frames.push(await page.screenshot({ clip: box }));
  await grab();
  for (const target of [stageTop + stageH * 0.42, stageTop + 10]) {
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), target);
    const t0 = Date.now();
    for (const t of [40, 120, 200, 300, 450, 700]) { await page.waitForTimeout(Math.max(0, t - (Date.now() - t0))); await grab(); }
    console.log('text now:', await page.evaluate(() => document.querySelector('.count-current').textContent));
  }
  const tiles = await Promise.all(frames.map(f => sharp(f).resize({ height: 160 }).png().toBuffer()));
  const w = (await sharp(tiles[0]).metadata()).width;
  await sharp({ create: { width: (w + 6) * tiles.length, height: 160, channels: 3, background: '#f0f' } })
    .composite(tiles.map((t, i) => ({ input: t, left: i * (w + 6), top: 0 }))).png().toFile(out);
  await browser.close(); server.close();
})();
