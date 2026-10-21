// Lists elements that stick out past the right edge of the viewport on a page.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const url = process.argv[2] || '/landing', width = +(process.argv[3] || 390);
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4174);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  page.on('request', r => {});
  page.on('response', r => r.status() >= 400 && console.log('HTTP', r.status(), r.url()));
  await page.goto(`http://localhost:4174${url}`, { waitUntil: 'networkidle' });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(120); }
  console.log('overflow px:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  const out = await page.evaluate(() => [...document.querySelectorAll('body *')]
    .map(e => ({ e, r: e.getBoundingClientRect() }))
    .filter(({ e, r }) => r.right > innerWidth + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed')
    .filter(({ e }) => !e.parentElement || e.parentElement.getBoundingClientRect().right <= innerWidth + 1 || e.parentElement === document.body)
    .slice(0, 15)
    .map(({ e, r }) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')} right=${Math.round(r.right)} w=${Math.round(r.width)}`));
  console.log(out.join('\n') || 'no overflowing elements');
  // Fallback for pseudo-elements: find the deepest element whose removal clears the overflow.
  const culprit = await page.evaluate(() => {
    const over = () => document.documentElement.scrollWidth - innerWidth > 1;
    let node = document.body, path = [];
    outer: while (true) {
      for (const c of node.children) {
        const prev = c.style.display; c.style.display = 'none';
        const fixed = !over(); c.style.display = prev;
        if (fixed) { path.push(`${c.tagName.toLowerCase()}.${[...c.classList].join('.')}`); node = c; continue outer; }
      }
      break;
    }
    return path;
  });
  console.log('culprit path:', culprit.join(' > '));
  await browser.close(); server.close();
})();
