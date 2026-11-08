// Screenshots the home hero and the scroll-revealed paragraph (fully revealed) in UA and EN.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const out = process.argv[2];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4205);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const [vp, size] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    for (const lang of ['uk', 'en']) {
      const page = await browser.newPage({ viewport: size });
      await page.goto('http://localhost:4205/', { waitUntil: 'networkidle' });
      await page.evaluate(l => localStorage.setItem('portfolio-language', l), lang); await page.reload({ waitUntil: 'networkidle' });
      await page.screenshot({ path: `${out}-${vp}-${lang}-hero.png` });
      const r = await page.evaluate(() => { const s = document.querySelector('.reading-stage'); scrollTo({ top: s.getBoundingClientRect().top + scrollY + s.offsetHeight - innerHeight, behavior: 'instant' }); return null; });
      await page.waitForTimeout(500);
      const fit = await page.evaluate(() => { const p = document.querySelector('[data-reading]').getBoundingClientRect(); return `paragraph ${Math.round(p.top)}..${Math.round(p.bottom)} of ${innerHeight}`; });
      console.log(vp, lang, fit);
      await page.screenshot({ path: `${out}-${vp}-${lang}-reading.png` });
      await page.close();
    }
  }
  await browser.close(); server.close();
})();
