// Screenshots the Synthetica badges (hero badge, five-badge composition, mobile trio).
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const out = process.argv[2];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4200);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const [vp, size] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
    await page.goto('http://localhost:4200/landing', { waitUntil: 'networkidle' });
    for (const sel of ['.syn-hero-badge', '.syn-badges-desktop', '.syn-badges-mobile']) {
      const el = await page.$(sel);
      const vis = el && await el.isVisible();
      console.log(vp, sel, vis ? 'visible' : 'hidden');
      if (vis) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await el.screenshot({ path: `${out}-${vp}${sel.replace(/\./g, '-')}.png` }); }
    }
    await page.close();
  }
  await browser.close(); server.close();
})();
