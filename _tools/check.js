// Serves dist/ like Vercel (clean URLs), loads every page in Chrome at desktop and mobile widths,
// scrolls to trigger lazy content and reports console errors and failed requests.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const DIST = process.env.DIST || path.join(__dirname, '..', 'dist');
const OUT = process.env.SHOTS || path.join(require('os').tmpdir(), 'shots');
const PAGES = ['/', '/education', '/pets', '/landing'];
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const server = http.createServer((req, res) => handler(req, res, { public: DIST, cleanUrls: true })).listen(4173);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  let problems = 0;
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: vp === 'mobile' ? 2 : 1 });
    for (const url of PAGES) {
      const page = await ctx.newPage();
      const log = [];
      page.on('console', m => m.type() === 'error' && log.push(`console: ${m.text()}`));
      page.on('pageerror', e => log.push(`pageerror: ${e.message}`));
      page.on('requestfailed', r => log.push(`failed: ${r.url()} ${r.failure().errorText}`));
      page.on('response', r => r.status() >= 400 && log.push(`${r.status()}: ${r.url()}`));
      await page.goto(`http://localhost:4173${url}`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(OUT, `${vp}${url === '/' ? '-index' : url.replace('/', '-')}.png`) });
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += size.height * 0.8) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(120); }
      await page.waitForLoadState('networkidle');
      const broken = await page.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src')));
      broken.forEach(s => log.push(`broken img: ${s}`));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 1) log.push(`horizontal overflow: ${overflow}px`);
      console.log(`${vp} ${url}: ${log.length ? log.length + ' issue(s)' : 'ok'}`);
      log.forEach(l => console.log('   ', l));
      problems += log.length;
      await page.close();
    }
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(`screenshots: ${OUT}\nissues: ${problems}`);
})();
