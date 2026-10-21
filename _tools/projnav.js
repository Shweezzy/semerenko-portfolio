// Measures the project navigation labels ("ПРИТУЛОК." etc.) against the viewport on phones.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const pw = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4198);
  const browser = process.env.ENGINE === 'webkit' ? await pw.webkit.launch() : await pw.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const w of [320, 360, 390, 430, 600, 750]) {
    const page = await browser.newPage({ viewport: { width: w, height: 844 }, isMobile: process.env.ENGINE !== 'webkit', hasTouch: true });
    for (const url of ['/education', '/pets', '/landing']) {
      for (const lang of ['uk', 'en']) {
        await page.goto(`http://localhost:4198${url}`, { waitUntil: 'networkidle' });
        await page.evaluate(l => { localStorage.setItem('portfolio-language', l); }, lang); await page.reload({ waitUntil: 'networkidle' });

        const rows = await page.evaluate(() => [...document.querySelectorAll('.project-navigation a')].map(a => {
          const label = [...a.querySelectorAll('span')].find(s => s.dataset.uk) || a, r = label.getBoundingClientRect(), ar = a.getBoundingClientRect();
          const range = document.createRange(); range.selectNodeContents(label); const tr = range.getBoundingClientRect();
          return `${label.textContent} font=${getComputedStyle(label).fontSize} text ${Math.round(tr.left)}..${Math.round(tr.right)} link ${Math.round(ar.left)}..${Math.round(ar.right)}${tr.right > innerWidth - 12 ? ' OVERFLOW ' + Math.round(tr.right - innerWidth) + 'px' : ''}`;
        }));
        const over = rows.filter(r => r.includes('OVERFLOW'));
        if (over.length || (w === 390 && lang === 'uk')) console.log(w, url, lang, '\n   ' + (over.length ? over : rows).join('\n   '));
      }
    }
    await page.close();
  }
  await browser.close(); server.close();
})();
