// Simulates battery-saver autoplay blocking: video files never load, only posters show.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const pw = require('playwright-core');
const engine = process.env.ENGINE === 'webkit' ? pw.webkit.launch() : pw.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const DIST = process.env.DIST || path.join(__dirname, '..', 'dist');
(async () => {
  const pending = [];
  // Never answer video requests: like battery saver, the video stays unloaded and only the poster can show.
  const server = http.createServer((req, res) => req.url.endsWith('.mp4') ? pending.push(res) : handler(req, res, { public: DIST, cleanUrls: true })).listen(4186);
  const browser = await engine;
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  await page.route('**/*.mp4', r => r.abort());
  await page.goto('http://localhost:4186/landing', { waitUntil: 'load' });
  const el = await page.$('.syn-desktop-mockup');
  await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
  console.log(await page.evaluate(() => { const v = document.getElementById('syn-desktop-video'), r = v.getBoundingClientRect(); return `video box ${Math.round(r.width)}x${Math.round(r.height)}, readyState=${v.readyState}`; }));
  await el.screenshot({ path: process.argv[2] });
  pending.forEach(r => r.destroy()); await browser.close(); server.close();
})();
