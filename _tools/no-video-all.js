// With video loading blocked (battery saver), screenshots every <video> on a page in WebKit or Chrome.
const http = require('http'), path = require('path'), handler = require('serve-handler'), sharp = require('sharp');
const pw = require('playwright-core');
const url = process.argv[2] || '/pets', out = process.argv[3];
(async () => {
  const pending = [];
  const server = http.createServer((req, res) => req.url.endsWith('.mp4') ? pending.push(res) : handler(req, res, { public: process.env.DIST || path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4187);
  const browser = process.env.ENGINE === 'chromium' ? await pw.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }) : await pw.webkit.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await page.goto(`http://localhost:4187${url}`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const vids = await page.$$('video');
  const tiles = [];
  for (const v of vids) {
    if (!(await v.isVisible())) continue;
    await v.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    const buf = await v.screenshot();
    const { data } = await sharp(buf).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
    console.log(`${await v.evaluate(e => e.getAttribute('src') || e.id)}: avg rgb(${data[0]},${data[1]},${data[2]})${data[0] + data[1] + data[2] < 40 ? '  <- BLACK' : ''}`);
    tiles.push(await sharp(buf).resize({ height: 300 }).png().toBuffer());
  }
  if (out && tiles.length) {
    const metas = await Promise.all(tiles.map(t => sharp(t).metadata()));
    const width = metas.reduce((s, m) => s + m.width + 8, 0);
    let left = 0;
    await sharp({ create: { width, height: 300, channels: 3, background: '#888' } })
      .composite(tiles.map((t, i) => { const c = { input: t, left, top: 0 }; left += metas[i].width + 8; return c; })).png().toFile(out);
  }
  pending.forEach(r => r.destroy()); await browser.close(); server.close();
})();
