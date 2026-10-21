// Switches to EN and checks the pets footer translation and the home reading paragraph timeline.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4192);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4192/pets', { waitUntil: 'networkidle' });
  await page.click('[data-language="en"]');
  console.log('pets footer EN:', await page.evaluate(() => document.querySelector('footer').innerText.replace(/\s+/g, ' ')));
  await page.goto('http://localhost:4192/', { waitUntil: 'networkidle' });
  console.log('home lang (remembered):', await page.evaluate(() => document.documentElement.lang));
  const r = await page.evaluate(async () => {
    const stage = document.querySelector('.reading-stage');
    scrollTo({ top: stage.getBoundingClientRect().top + scrollY, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 200));
    const words = [...stage.querySelectorAll('.word')];
    return { text: words.slice(0, 4).map(w => w.textContent).join(' '), withVars: words.filter(w => w.style.getPropertyValue('--word-start')).length, total: words.length, lit: words.filter(w => +getComputedStyle(w).opacity > .9).length };
  });
  console.log('reading EN:', JSON.stringify(r));
  await page.click('[data-language="uk"]');
  await browser.close(); server.close();
})();
