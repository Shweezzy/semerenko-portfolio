// Checks that gesture hints stay glued under their mockup while the page scrolls.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4190);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const [url, size] of [['/pets', { width: 390, height: 844 }], ['/pets', { width: 1440, height: 900 }], ['/landing', { width: 390, height: 844 }], ['/education', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: size, isMobile: size.width < 500, hasTouch: size.width < 500 });
    await page.goto(`http://localhost:4190${url}`, { waitUntil: 'networkidle' });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    let seen = 0, worst = 0;
    for (let y = 0; y < height; y += 137) {
      await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => [...document.querySelectorAll('.mockup-gesture-hint.is-visible')].map(h => {
        // Gap between the hint top and the bottom of the closest mockup above it.
        const hr = h.getBoundingClientRect();
        const anchors = [...document.querySelectorAll('.pet-phone,.syn-mobile-device,.mobile-device,.browser-mockup,.discovery-mobile-track,.meeting-flow-gallery,.profile-screen-sequence')]
          .map(a => a.getBoundingClientRect()).filter(a => a.width && Math.abs(a.left + a.width / 2 - hr.left - hr.width / 2) < a.width / 2 + 80);
        return Math.min(...anchors.map(a => Math.abs(hr.top - a.bottom - 3)));
      }));
      seen += r.length; r.forEach(d => (worst = Math.max(worst, d)));
    }
    console.log(`${url} ${size.width}px: ${seen} visible-hint samples, worst offset from mockup ${worst.toFixed(1)}px`);
    await page.close();
  }
  await browser.close(); server.close();
})();
