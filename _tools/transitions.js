// Clicks internal links and checks that each navigation runs a cross-document view transition.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4194);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => addEventListener('pagereveal', e => { window.__vt = !!e.viewTransition; }));
  const statuses = [];
  page.on('response', r => r.request().isNavigationRequest() && statuses.push(`${r.status()} ${new URL(r.url()).pathname}${new URL(r.url()).hash}`));
  await page.goto('http://localhost:4194/', { waitUntil: 'networkidle' });
  for (const sel of ['a[href="/pets"]', 'a[href="/landing"]', 'a[href="/education"]', 'header a[href="/"]']) {
    await page.locator(sel).first().click({ force: true });
    await page.waitForLoadState('networkidle');
    console.log(`${sel} -> ${new URL(page.url()).pathname}  view transition: ${await page.evaluate(() => window.__vt)}`);
  }
  await page.goto('http://localhost:4194/pets', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:4194/#about', { waitUntil: 'networkidle' });
  console.log('/#about scrolled to about:', await page.evaluate(() => { const r = document.getElementById('about').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }));
  console.log('navigation responses:', statuses.join(', '));
  await browser.close(); server.close();
})();
