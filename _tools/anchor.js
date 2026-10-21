// Opens /#about (or index.html#about) and reports where the page ends up over time.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: process.env.DIST || path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4195);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const w of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(`http://localhost:4195${process.argv[2] || '/#about'}`, { waitUntil: 'load' });
    for (const t of [100, 1000, 2500]) {
      await page.waitForTimeout(t);
      console.log(w, `t+${t}`, await page.evaluate(() => { const r = document.getElementById('about').getBoundingClientRect(); return `scrollY=${Math.round(scrollY)} about.top=${Math.round(r.top)}`; }));
    }
    await page.close();
  }
  await browser.close(); server.close();
})();
