// Checks that every <video> on the case pages decodes and plays in Chrome.
const http = require('http'), path = require('path'), handler = require('serve-handler');
const { chromium } = require('playwright-core');
(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true })).listen(4176);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const url of ['/pets', '/landing']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://localhost:4176${url}`, { waitUntil: 'networkidle' });
    const res = await page.evaluate(async () => Promise.all([...document.querySelectorAll('video')].map(async v => {
      v.muted = true; v.preload = 'auto';
      if (!v.currentSrc) v.load();
      try { await v.play(); } catch (e) { return `${v.currentSrc || v.querySelector('source')?.src}: play failed ${e.message}`; }
      await new Promise(r => setTimeout(r, 700));
      return `${v.currentSrc.split('/').pop()}: ${v.videoWidth}x${v.videoHeight} t=${v.currentTime.toFixed(2)} ${v.error ? 'ERROR' : 'ok'}`;
    })));
    console.log(url); res.forEach(r => console.log('  ', r));
    await page.close();
  }
  await browser.close(); server.close();
})();
