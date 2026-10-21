// Measures the landing hero title against its container at several phone widths.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4175);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const width of [320, 360, 375, 390, 414, 430, 600, 768]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.goto('http://localhost:4175/landing', { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const h = document.querySelector('.syn-hero h1'), range = document.createRange();
      range.selectNodeContents(h.firstChild);
      const cs = getComputedStyle(h);
      return { font: cs.fontSize, box: Math.round(h.getBoundingClientRect().width), text: Math.round(range.getBoundingClientRect().width), overflow: document.documentElement.scrollWidth - innerWidth };
    });
    console.log(width, JSON.stringify(r));
    await page.close();
  }
  await browser.close(); server.close();
})();
