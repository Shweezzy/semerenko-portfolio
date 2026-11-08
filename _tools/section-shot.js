// Screenshots one element of a page: node section-shot.js <url> <selector> <out-prefix> [lang]
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const [url, sel, out, lang = 'uk'] = process.argv.slice(2);
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4209);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const [vp, size] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: size });
    await page.goto(`http://localhost:4209${url}`, { waitUntil: 'networkidle' });
    await page.evaluate(l => localStorage.setItem('portfolio-language', l), lang); await page.reload({ waitUntil: 'networkidle' });
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(900);
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')));
    await page.waitForTimeout(900);
    await el.screenshot({ path: `${out}-${vp}.png` });
    await page.close();
  }
  await browser.close(); server.close();
})();
