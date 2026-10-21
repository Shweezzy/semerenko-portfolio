// Screenshots the top bar (pill + menu button) of each page at phone width over several scroll positions.
const http = require('http'), path = require('path'), handler = require('serve-handler'), sharp = require('sharp');
const { chromium } = require('playwright-core');
const out = process.argv[2];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4193);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const tiles = [];
  for (const [url, ys] of [['/', [0, 2600]], ['/education', [0, 4600]], ['/pets', [700, 5400]], ['/landing', [0, 2300]]]) {
    await page.goto(`http://localhost:4193${url}`, { waitUntil: 'networkidle' });
    for (const y of ys) {
      await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(400);
      tiles.push(await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 84 } }));
    }
  }
  const meta = await sharp(tiles[0]).metadata();
  await sharp({ create: { width: meta.width, height: (meta.height + 6) * tiles.length, channels: 3, background: '#f0f' } })
    .composite(tiles.map((t, i) => ({ input: t, left: 0, top: i * (meta.height + 6) }))).png().toFile(out);
  await browser.close(); server.close();
})();
