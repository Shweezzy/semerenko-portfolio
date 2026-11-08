// Records the Prytulok hero on a phone over time to verify the screen rotation.
const http = require('http'), path = require('path'), handler = require('serve-handler'), sharp = require('sharp');
const { chromium } = require('playwright-core');
const out = process.argv[2];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4207);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:4207/pets', { waitUntil: 'networkidle' });
  const art = page.locator('.product-hero');
  await art.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
  const frames = [];
  for (let k = 0; k < 6; k++) {
    console.log(`t=${(k * 1.6).toFixed(1)}s current=${await page.evaluate(() => document.querySelector('.product-hero .is-current')?.dataset.product)}`);
    frames.push(await sharp(await art.screenshot()).resize({ height: 300 }).png().toBuffer());
    await page.waitForTimeout(1600);
  }
  const w = (await sharp(frames[0]).metadata()).width;
  await sharp({ create: { width: (w + 6) * frames.length, height: 300, channels: 3, background: '#f0f' } }).composite(frames.map((f, i) => ({ input: f, left: i * (w + 6), top: 0 }))).png().toFile(out);
  console.log('height of hero:', await page.evaluate(() => Math.round(document.querySelector('.product-hero').getBoundingClientRect().height)));
  await browser.close(); server.close();
})();
