// Emulates a finger swipe on every horizontally scrollable element at phone width and
// reports whether it actually scrolled (touch-action conflicts block it silently).
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const swipe = require('./touch');
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/education', '/pets', '/landing'];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4177);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  let failures = 0;
  for (const url of PAGES) {
    const page = await ctx.newPage();
    await page.goto(`http://localhost:4177${url}`, { waitUntil: 'networkidle' });
    const cdp = await ctx.newCDPSession(page);
    const count = await page.evaluate(() => {
      window.__sc = [...document.querySelectorAll('body *')].filter(e => {
        const s = getComputedStyle(e);
        return /auto|scroll/.test(s.overflowX) && e.scrollWidth - e.clientWidth > 20 && e.getClientRects().length;
      });
      return window.__sc.length;
    });
    for (let i = 0; i < count; i++) {
      const info = await page.evaluate(i => {
        const el = window.__sc[i];
        el.scrollLeft = 0;
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = el.getBoundingClientRect();
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const x = Math.round(clamp(r.left + r.width * 0.6, Math.max(40, r.left + 10), Math.min(innerWidth - 40, r.right - 10)));
        const y = Math.round(clamp(r.top + r.height / 2, Math.max(60, r.top + 10), Math.min(innerHeight - 60, r.bottom - 10)));
        const hit = document.elementFromPoint(x, y);
        return { name: `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`, x, y, hit: hit ? `${hit.tagName.toLowerCase()}${hit.getAttribute('src') ? '[' + hit.getAttribute('src') + ']' : '.' + [...hit.classList].join('.')}` : '-' };
      }, i);
      await page.waitForTimeout(300);
      await swipe(cdp, info.x, info.y, -200);
      await page.waitForTimeout(500);
      const moved = await page.evaluate(i => window.__sc[i].scrollLeft, i);
      const ok = moved > 20;
      if (!ok) failures++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${url} ${info.name} moved=${Math.round(moved)} start-on=${info.hit}`);
    }
    await page.close();
  }
  await browser.close(); server.close();
  console.log(`failures: ${failures}`);
})();
