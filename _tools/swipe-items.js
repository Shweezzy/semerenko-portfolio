// Swipes starting on each item of one scroller: node swipe-items.js /pets ".discovery-mobile-track"
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const swipe = require('./touch');
const [url, sel, childSel = ':scope > *'] = process.argv.slice(2);
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4179);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
  await page.goto(`http://localhost:4179${url}`, { waitUntil: 'networkidle' });
  const n = await page.evaluate(([sel, c]) => document.querySelector(sel).querySelectorAll(c).length, [sel, childSel]);
  for (let i = 0; i < n; i++) {
    const p = await page.evaluate(([sel, c, i]) => {
      const t = document.querySelector(sel), item = t.querySelectorAll(c)[i];
      t.style.scrollSnapType = 'none'; t.scrollLeft = item.offsetLeft - 18; t.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = item.getBoundingClientRect(), x = Math.round(Math.min(innerWidth - 30, r.left + r.width / 2)), y = Math.round(r.top + r.height / 2);
      const hit = document.elementFromPoint(x, y);
      return { x, y, before: t.scrollLeft, max: t.scrollWidth - t.clientWidth, hit: hit.tagName + (hit.getAttribute('src') ? ' ' + hit.getAttribute('src') : '.' + hit.className) };
    }, [sel, childSel, i]);
    const dir = p.before >= p.max - 5 ? 150 : -150;
    await swipe(cdp, p.x, p.y, dir);
    await page.waitForTimeout(400);
    const after = await page.evaluate(sel => document.querySelector(sel).scrollLeft, sel);
    console.log(`${Math.abs(after - p.before) > 20 ? 'ok  ' : 'FAIL'} item ${i} on ${p.hit} moved ${Math.round(after - p.before)}`);
  }
  await browser.close(); server.close();
})();
