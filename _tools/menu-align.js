// Measures the visible right edges of the close "×" and the CV arrow glyphs in the open mobile menu.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const pw = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4204);
  for (const engine of ['chromium', 'webkit']) {
    const browser = engine === 'webkit' ? await pw.webkit.launch() : await pw.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    for (const w of [320, 390]) {
      const page = await browser.newPage({ viewport: { width: w, height: 844 } });
      for (const url of ['/', '/pets']) {
        await page.goto(`http://localhost:4204${url}`, { waitUntil: 'networkidle' });
        await page.click('.portfolio-menu-toggle'); await page.waitForTimeout(500);
        const r = await page.evaluate(() => {
          // Visible glyph box = path bbox mapped through the svg's viewBox scale.
          const glyph = svg => { const p = svg.querySelector('path'), b = p.getBBox(), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, s = r.width / vb.width, sw = parseFloat(p.getAttribute('stroke-width')) * s / 2;
            return { left: r.left + (b.x - vb.x) * s - sw, right: r.left + (b.x - vb.x + b.width) * s + sw, top: r.top + (b.y - vb.y) * s - sw, bottom: r.top + (b.y - vb.y + b.height) * s + sw }; };
          const x = glyph(document.querySelector('.contact-menu-close svg')), a = glyph(document.querySelector('.menu-cv-block svg'));
          const panel = document.querySelector('.contact-panel').getBoundingClientRect(), label = document.querySelector('.contact-panel > a span').getBoundingClientRect();
          return { xRight: x.right.toFixed(1), arrowRight: a.right.toFixed(1), diff: (x.right - a.right).toFixed(1), xSize: (x.right - x.left).toFixed(1), arrowSize: (a.right - a.left).toFixed(1), panelRight: panel.right.toFixed(1), panelPad: (panel.right - a.right).toFixed(1), textLeft: (label.left - panel.left).toFixed(1) };
        });
        console.log(engine.padEnd(8), w, url.padEnd(5), JSON.stringify(r));
      }
      await page.close();
    }
    await browser.close();
  }
  server.close();
})();
