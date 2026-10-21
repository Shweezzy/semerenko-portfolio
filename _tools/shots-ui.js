// Screenshots the footer and the opened menu of every page at desktop and phone widths.
const http = require('http'), path = require('path'), fs = require('fs'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const OUT = process.env.SHOTS || path.join(require('os').tmpdir(), 'shots-ui');
const PAGES = ['/', '/education', '/pets', '/landing'];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', process.env.DIST || 'dist'), cleanUrls: true })).listen(4182);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const [vp, size] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
    for (const url of PAGES) {
      const name = url === '/' ? 'index' : url.slice(1);
      await page.goto(`http://localhost:4182${url}`, { waitUntil: 'networkidle' });
      const footer = await page.$('footer');
      await footer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await footer.screenshot({ path: path.join(OUT, `${vp}-${name}-footer.png`) });
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      const toggle = await page.$('.portfolio-menu-toggle');
      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(OUT, `${vp}-${name}-menu.png`) });
      }
    }
    await page.close();
  }
  await browser.close(); server.close();
  console.log(OUT);
})();
