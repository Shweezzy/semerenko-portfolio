// Scrolls each page at phone width and checks the menu toggle icon against the real background under it.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const PAGES = ['/', '/education', '/pets', '/landing'];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4181);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  for (const url of PAGES) {
    await page.goto(`http://localhost:4181${url}`, { waitUntil: 'networkidle' });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    let bad = 0, steps = 0;
    for (let y = 0; y < height; y += 300) {
      await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
      await page.waitForTimeout(80);
      const box = await page.evaluate(() => {
        const b = document.querySelector('.portfolio-menu-toggle'), r = b.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height, icon: getComputedStyle(b.querySelector('svg')).color };
      });
      // Screenshot the button area with the button hidden to measure the true background.
      await page.evaluate(() => (document.querySelector('.portfolio-menu-toggle').style.visibility = 'hidden'));
      const shot = await page.screenshot({ clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
      await page.evaluate(() => (document.querySelector('.portfolio-menu-toggle').style.visibility = ''));
      const sharp = require('sharp');
      const { data } = await sharp(shot).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
      const bgL = (0.2126 * data[0] + 0.7152 * data[1] + 0.0722 * data[2]) / 255;
      const [r, g, b] = box.icon.match(/\d+/g).map(Number), iconL = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      steps++;
      if (Math.abs(bgL - iconL) < 0.4) { bad++; console.log(`  ${url} y=${y} icon=${box.icon} bg=rgb(${data[0]},${data[1]},${data[2]})`); }
    }
    console.log(`${url}: ${bad}/${steps} scroll positions with an invisible menu icon`);
  }
  await browser.close(); server.close();
})();
