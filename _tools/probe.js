// Prints computed styles for selectors at phone width: node probe.js /pets ".sel1" ".sel2"
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const [url, ...sels] = process.argv.slice(2);
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4178);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: +(process.env.W || 390), height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(`http://localhost:4178${url}`, { waitUntil: 'networkidle' });
  const props = (process.env.PROPS || 'overflowX,overflowY,touchAction,pointerEvents,position,scrollSnapType').split(',');
  for (const sel of sels) {
    const out = await page.evaluate(([sel, props]) => [...document.querySelectorAll(sel)].slice(0, 6).map(e => {
      const s = getComputedStyle(e), r = e.getBoundingClientRect();
      return `${sel} [${Math.round(r.width)}x${Math.round(r.height)} sw=${e.scrollWidth} cw=${e.clientWidth}] ` + props.map(p => `${p}=${s[p]}`).join(' ');
    }), [sel, props]);
    console.log(out.join('\n') || `${sel}: none`);
  }
  await browser.close(); server.close();
})();
