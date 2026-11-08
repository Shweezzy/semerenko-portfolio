// Dumps the visible text of every page in UA and EN (desktop width) for a content review.
const http = require('http'), path = require('path'), fs = require('fs'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
const out = process.argv[2];
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4208);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  let text = '';
  for (const url of ['/', '/education', '/pets', '/landing']) {
    for (const lang of ['uk', 'en']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`http://localhost:4208${url}`, { waitUntil: 'networkidle' });
      await page.evaluate(l => localStorage.setItem('portfolio-language', l), lang); await page.reload({ waitUntil: 'networkidle' });
      const t = await page.evaluate(() => {
        const r = document.querySelector('[data-reading]'); if (r) r.textContent = r.dataset[document.documentElement.lang] || r.textContent;
        return document.body.innerText;
      });
      const alts = await page.evaluate(() => [...document.images].map(i => i.alt).filter(Boolean));
      text += `\n\n######## ${url} [${lang}]\n${t.replace(/\n{3,}/g, '\n\n')}\n--- alt texts: ${[...new Set(alts)].join(' | ')}\n`;
      await page.close();
    }
  }
  fs.writeFileSync(out, text);
  console.log(text.length, 'chars');
  await browser.close(); server.close();
})();
