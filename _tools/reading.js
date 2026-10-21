// Compares word opacities of the home "reading" paragraph: CSS scroll timeline vs the original JS formula.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4189);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: size });
    await page.goto('http://localhost:4189/', { waitUntil: 'networkidle' });
    console.log(size.width, 'scroll-timeline class:', await page.evaluate(() => document.documentElement.classList.contains('scroll-timeline')));
    const top = await page.evaluate(() => document.querySelector('.reading-stage').getBoundingClientRect().top + scrollY);
    let worst = 0;
    for (let k = -2; k <= 14; k++) {
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), top + k * size.height * 0.1);
      await page.waitForTimeout(120);
      const r = await page.evaluate(() => {
        const stage = document.querySelector('.reading-stage'), words = [...stage.querySelectorAll('.word')], rect = stage.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (innerHeight * .55 - rect.top) / Math.max(1, rect.height - innerHeight * .45)));
        const expected = words.map((w, i) => .12 + .88 * Math.max(0, Math.min(1, p * (words.length + 6) - i)));
        const actual = words.map(w => +getComputedStyle(w).opacity);
        const firstOffA = actual.findIndex(a => a < .5), firstOffE = expected.findIndex(a => a < .5);
        return { firstOffA, firstOffE, top: Math.round(rect.top), H: Math.round(rect.height), p: p.toFixed(2), diff: Math.max(...actual.map((a, i) => Math.abs(a - expected[i]))), lit: actual.filter(a => a > .9).length, n: words.length };
      });
      worst = Math.max(worst, r.diff);
      console.log(`  k=${k} top=${r.top} H=${r.H} p=${r.p} lit=${r.lit}/${r.n} first-unlit actual=${r.firstOffA} expected=${r.firstOffE} diff=${r.diff.toFixed(2)}`);
    }
    console.log(`  worst difference vs JS formula: ${worst.toFixed(3)}`);
    await page.close();
  }
  await browser.close(); server.close();
})();
