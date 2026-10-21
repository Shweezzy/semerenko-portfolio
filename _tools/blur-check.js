// Zoomed crop of the mobile navigation pill and the menu button over a detailed background.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4196);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  await page.goto('http://localhost:4196/pets', { waitUntil: 'networkidle' });
  // Put a high-contrast stripe pattern right under the header so blur (or its absence) is obvious.
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0 0 auto 0;height:100px;z-index:999;background:repeating-linear-gradient(90deg,#000 0 3px,#fff 3px 6px)';
    document.body.append(d);
  });
  await page.waitForTimeout(300);
  console.log(await page.evaluate(() => {
    const b = document.querySelector('.portfolio-menu-toggle'), h = document.querySelector('header');
    return { toggleBackdrop: getComputedStyle(b).backdropFilter, headerBackdrop: getComputedStyle(h).backdropFilter, toggleParent: b.parentElement.tagName };
  }));
  await page.screenshot({ path: process.argv[2], clip: { x: 230, y: 4, width: 160, height: 72 } });
  await browser.close(); server.close();
})();
