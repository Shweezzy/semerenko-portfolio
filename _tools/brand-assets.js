// Renders the favicon set and the Open Graph preview image in the site's own typography.
const path = require('path'), fs = require('fs'), sharp = require('sharp');
const { chromium } = require('playwright-core');
const DIST = path.join(__dirname, '..', 'dist');
const FONT = "font-family:Arial,Helvetica,sans-serif;font-weight:900;letter-spacing:-.075em;line-height:.91";

const OG = `<body style="margin:0;width:1200px;height:630px;background:#fff;color:#000;${FONT};display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;box-sizing:border-box">
  <div style="font-size:24px;letter-spacing:0;font-weight:700;display:flex;justify-content:space-between"><span>UI/UX Designer</span><span>Portfolio ↗</span></div>
  <div style="font-size:150px">Anastasiia<br>Semerenko.</div>
  <div style="font-size:26px;letter-spacing:0;font-weight:400;line-height:1.4;max-width:900px">Education redesign · Prytulok app · Synthetica 2025</div>
</body>`;
const ICON = `<body style="margin:0;width:512px;height:512px;background:transparent">
  <div style="width:512px;height:512px;border-radius:112px;background:#000;color:#fff;${FONT};font-size:300px;display:flex;align-items:center;justify-content:center;padding-right:24px;box-sizing:border-box">AS</div>
</body>`;

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const shot = async (html, w, h) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(html);
    const buf = await page.screenshot({ omitBackground: true });
    await page.close();
    return buf;
  };
  await sharp(await shot(OG, 1200, 630)).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(DIST, 'og-image.jpg'));
  const icon = await shot(ICON, 512, 512);
  await sharp(icon).resize(180, 180).flatten({ background: '#000' }).png().toFile(path.join(DIST, 'apple-touch-icon.png'));
  await sharp(icon).resize(32, 32).png().toFile(path.join(DIST, 'favicon-32.png'));
  // favicon.ico: single 32px PNG-in-ICO, which every current browser accepts.
  const png = fs.readFileSync(path.join(DIST, 'favicon-32.png'));
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
  fs.writeFileSync(path.join(DIST, 'favicon.ico'), Buffer.concat([header, png]));
  await browser.close();
  console.log('og-image.jpg, apple-touch-icon.png, favicon-32.png, favicon.ico written');
})();
