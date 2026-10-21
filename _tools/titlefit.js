// Measures a page's display title against its box at phone widths: node titlefit.js /pets ".pet-hero h1"
const http = require('http'), path = require('path'), handler = require('serve-handler');
const pw = require('playwright-core');
const [url, sel] = process.argv.slice(2);
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4199);
  for (const engine of ['chromium', 'webkit']) {
    const browser = engine === 'webkit' ? await pw.webkit.launch() : await pw.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    for (const lang of ['uk', 'en']) {
      const line = [];
      for (const width of [320, 360, 375, 390, 414, 430, 600, 750]) {
        const page = await browser.newPage({ viewport: { width, height: 844 } });
        await page.goto(`http://localhost:4199${url}`, { waitUntil: 'networkidle' });
        await page.evaluate(l => localStorage.setItem('portfolio-language', l), lang); await page.reload({ waitUntil: 'networkidle' });
        const r = await page.evaluate(sel => {
          const h = document.querySelector(sel), range = document.createRange(); range.selectNodeContents(h);
          const box = h.getBoundingClientRect(), t = range.getBoundingClientRect();
          return { font: parseFloat(getComputedStyle(h).fontSize).toFixed(1), over: Math.round(t.right - box.right), pageOver: document.documentElement.scrollWidth - innerWidth, text: h.textContent.trim() };
        }, sel);
        line.push(`${width}:${r.font}px${r.over > 0 ? ' OVER+' + r.over : ''}${r.pageOver > 1 ? ' PAGE+' + r.pageOver : ''}`);
        await page.close();
      }
      console.log(engine.padEnd(8), lang, line.join('  '));
    }
    await browser.close();
  }
  server.close();
})();
