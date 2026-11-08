// Screenshots the home "Selected work" section on a phone (full section) and reports its structure.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const out = process.argv[2];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4206);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await page.goto('http://localhost:4206/', { waitUntil: 'networkidle' });
  const info = await page.evaluate(() => {
    const s = document.querySelector('#work'), stage = s.querySelector('.work-stage'), sticky = s.querySelector('.work-sticky'), track = s.querySelector('.work-track');
    const cs = e => { const c = getComputedStyle(e); return `${e.className}: ${c.display} pos=${c.position} h=${Math.round(e.getBoundingClientRect().height)} ovx=${c.overflowX} snap=${c.scrollSnapType}`; };
    return [cs(s), cs(stage), cs(sticky), cs(track), ...[...s.querySelectorAll('.work-slide')].map(cs), cs(s.querySelector('.work-progress'))].join('\n');
  });
  console.log(info);
  const el = await page.$('#work');
  await el.screenshot({ path: out });
  await browser.close(); server.close();
})();
