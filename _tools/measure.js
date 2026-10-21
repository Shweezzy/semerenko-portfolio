// Prints left/right edges, colors and fonts of key elements: node measure.js <width> sel1 sel2 ...
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const [w, ...sels] = process.argv.slice(2);
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4183);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: +w, height: 900 } });
  for (const url of ['/', '/education', '/pets', '/landing']) {
    await page.goto(`http://localhost:4183${url}`, { waitUntil: 'networkidle' });
    const rows = await page.evaluate(sels => sels.map(s => {
      const e = document.querySelector(s); if (!e) return `${s}: -`;
      const r = e.getBoundingClientRect(), c = getComputedStyle(e);
      return `${s}: L=${Math.round(r.left)} R=${Math.round(innerWidth - r.right)} H=${Math.round(r.height)} color=${c.color} bg=${c.backgroundColor} font=${c.fontSize}/${c.fontWeight} pad=${c.padding} border-top=${c.borderTopWidth} ${c.borderTopColor}`;
    }), sels);
    console.log(url); rows.forEach(r => console.log('  ' + r));
  }
  await browser.close(); server.close();
})();
