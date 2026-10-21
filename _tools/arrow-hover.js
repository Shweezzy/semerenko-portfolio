// Hovers each link that contains an arrow and records frames of the arrow animation.
const http = require('http'), path = require('path'), handler = require('serve-handler'), sharp = require('sharp');
const { chromium } = require('playwright-core');
const out = process.argv[2];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4203);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const rows = [];
  for (const [url, sel] of [['/', '.hero-work-link'], ['/landing', '.project-navigation:not(.project-navigation-top) a'], ['/education', '.project-navigation:not(.project-navigation-top) a'], ['/', '.contact .button']]) {
    await page.goto(`http://localhost:4203${url}`, { waitUntil: 'networkidle' });
    const link = page.locator(sel).first();
    await link.scrollIntoViewIfNeeded(); await page.mouse.move(5, 5); await page.waitForTimeout(400);
    const arrow = link.locator('.geo-arrow').first();
    const box = await arrow.boundingBox(), rot = await arrow.evaluate(e => e.style.rotate || getComputedStyle(e).rotate);
    const clip = { x: box.x - box.width * .9, y: box.y - box.height * .9, width: box.width * 2.8, height: box.height * 2.8 };
    const frames = [await page.screenshot({ clip })];
    await link.hover({ force: true });
    for (const t of [120, 230, 330, 450, 650]) { await page.waitForTimeout(t === 120 ? 120 : t - [120, 230, 330, 450, 650][[120, 230, 330, 450, 650].indexOf(t) - 1]); frames.push(await page.screenshot({ clip })); }
    console.log(`${url} ${sel}: rotate=${rot}`);
    const tiles = await Promise.all(frames.map(f => sharp(f).resize(120, 120, { fit: 'contain', background: '#808' }).png().toBuffer()));
    rows.push(await sharp({ create: { width: 126 * tiles.length, height: 120, channels: 3, background: '#808' } }).composite(tiles.map((t, i) => ({ input: t, left: i * 126, top: 0 }))).png().toBuffer());
  }
  await sharp({ create: { width: 126 * 6, height: 126 * rows.length, channels: 3, background: '#808' } }).composite(rows.map((r, i) => ({ input: r, left: 0, top: i * 126 }))).png().toFile(out);
  await browser.close(); server.close();
})();
