// Screenshots the Synthetica desktop mockup with its gesture hint at desktop and phone widths.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const out = process.argv[2];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4202);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const [vp, size] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: size, hasTouch: vp === 'mobile', isMobile: vp === 'mobile' });
    await page.goto('http://localhost:4202/landing', { waitUntil: 'networkidle' });
    const box = await page.evaluate(() => {
      const m = document.querySelector('.syn-device-pair .syn-desktop-mockup');
      scrollTo({ top: m.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' });
      return null;
    });
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => {
      const m = document.querySelector('.syn-device-pair .syn-desktop-mockup').getBoundingClientRect();
      const h = [...document.querySelectorAll('.mockup-gesture-hint')].find(x => x.classList.contains('is-visible'));
      return { m: { x: m.left, y: m.top, w: m.width, h: m.height }, hint: h ? h.textContent : null };
    });
    console.log(vp, 'visible hint:', info.hint);
    await page.screenshot({ path: `${out}-${vp}.png`, clip: { x: Math.max(0, info.m.x - 10), y: Math.max(0, info.m.y + info.m.h - 120), width: Math.min(size.width, info.m.w + 20), height: 170 } });
    await page.close();
  }
  await browser.close(); server.close();
})();
