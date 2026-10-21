// Scrolls past the Synthetica badges and records their rotation (scroll-driven sway).
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4201);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const [w, sel] of [[1440, '.syn-hero-badge > img'], [1440, '.badge-touch-piece'], [900, '.badge-touch-piece'], [390, '.syn-badges-mobile figure']]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto('http://localhost:4201/landing', { waitUntil: 'networkidle' });
    const top = await page.evaluate(s => document.querySelector(s).getBoundingClientRect().top + scrollY - innerHeight / 2, sel);
    await page.evaluate(y => scrollTo({ top: Math.max(0, y), behavior: 'instant' }), top - 300);
    await page.waitForTimeout(300);
    let peak = 0;
    for (let k = 0; k < 15; k++) {
      await page.mouse.wheel(0, 40); await page.waitForTimeout(30);
      const a = await page.evaluate(s => Math.max(...[...document.querySelectorAll(s)].map(e => Math.abs(parseFloat((e.style.transform.match(/-?[\d.]+/) || [0])[0])))), sel);
      peak = Math.max(peak, a);
    }
    await page.waitForTimeout(2500);
    const rest = await page.evaluate(s => [...document.querySelectorAll(s)].map(e => e.style.transform || 'none').join(' '), sel);
    console.log(`${w}px ${sel}: peak rotation ${peak.toFixed(2)}deg, after settling: ${rest.slice(0, 80)}`);
    await page.close();
  }
  await browser.close(); server.close();
})();
