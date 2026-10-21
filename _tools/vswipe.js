// Starts a vertical finger swipe on every visible phone screen / mockup viewport at phone width and
// checks that something scrolled (the page or the screen itself). Catches scroll traps.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const swipe = require('./touch');
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/education', '/pets', '/landing'];
const SEL = '.pet-screen,.syn-mobile-viewport,.syn-desktop-viewport,.mobile-device-viewport,.admission-viewport,.catalog-scroll,video,img';
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4180);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  let fails = 0, total = 0;
  for (const url of PAGES) {
    const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
    await page.goto(`http://localhost:4180${url}`, { waitUntil: 'networkidle' });
    const n = await page.evaluate(sel => (window.__t = [...document.querySelectorAll(sel)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 120 && r.height > 200; })).length, SEL);
    const seenSrc = new Set();
    for (let i = 0; i < n; i++) {
      const p = await page.evaluate(i => {
        const el = window.__t[i];
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = el.getBoundingClientRect(), x = Math.round(Math.max(20, Math.min(innerWidth - 20, r.left + r.width / 2))), y = Math.round(Math.max(200, Math.min(innerHeight - 200, r.top + r.height / 2)));
        const hit = document.elementFromPoint(x, y);
        if (!hit) return null;
        const scrollers = []; for (let e = hit; e; e = e.parentElement) scrollers.push(e);
        window.__chain = scrollers; window.__s = scrollers.map(e => e.scrollTop);
        window.__y = scrollY;
        return { x, y, key: (hit.getAttribute('src') || hit.className || hit.tagName) + '', hit: `${hit.tagName.toLowerCase()} ${hit.getAttribute('src') || '.' + hit.className}` };
      }, i);
      if (!p || seenSrc.has(p.key)) continue;
      seenSrc.add(p.key);
      await swipe(cdp, p.x, p.y, 0, -160);
      await page.waitForTimeout(350);
      // Something moved if the page or any element in the touched element's ancestor chain scrolled.
      const ok = await page.evaluate(() => Math.abs(scrollY - window.__y) > 20 || window.__chain.some((e, k) => Math.abs(e.scrollTop - window.__s[k]) > 20));
      total++;
      if (!ok) { fails++; console.log(`STUCK ${url} start-on=${p.hit}`); }
    }
    await page.close();
  }
  await browser.close(); server.close();
  console.log(`checked ${total} start points, stuck: ${fails}`);
})();
