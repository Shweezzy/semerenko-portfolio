const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4197);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const w of [320, 390, 750, 751, 1440]) {
    const page = await browser.newPage({ viewport: { width: w, height: 844 } });
    for (const url of ['/', '/pets']) {
      await page.goto(`http://localhost:4197${url}`, { waitUntil: 'networkidle' });
      for (const y of [0, 1500]) {
        await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
        await page.waitForTimeout(150);
        console.log(w, url, y, await page.evaluate(() => {
          const b = document.querySelector('.portfolio-menu-toggle'), h = document.querySelector('header'), r = b.getBoundingClientRect(), hr = h.getBoundingClientRect(), s = getComputedStyle(b);
          return `toggle ${s.display} ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} | header ${Math.round(hr.left)},${Math.round(hr.top)} ${Math.round(hr.width)}x${Math.round(hr.height)} pos=${getComputedStyle(h).position}`;
        }));
      }
    }
    await page.close();
  }
  await browser.close(); server.close();
})();
