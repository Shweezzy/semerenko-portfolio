// Optimizes dist/ in place: archives unreferenced assets, converts raster images to WebP,
// replaces raster-wrapper SVGs with cropped WebP, and rewrites references in the HTML pages.
const sharp = require('sharp'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist'), ARCHIVE = path.join(ROOT, '_archive');
const PAGES = ['index', 'education', 'pets', 'landing'].map(n => path.join(DIST, `${n}.html`));
const QUALITY = 88;

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const rel = f => path.relative(DIST, f).split(path.sep).join('/');
const kb = n => `${(n / 1024).toFixed(0)}K`;

let html = Object.fromEntries(PAGES.map(p => [p, fs.readFileSync(p, 'utf8')]));
const allHtml = () => Object.values(html).join('\n') + fs.readFileSync(path.join(DIST, 'portfolio-type.css'), 'utf8');
const replaceRef = (from, to) => {
  for (const p of PAGES) html[p] = html[p].split(`"${from}"`).join(`"${to}"`).split(`(${from})`).join(`(${to})`).split(`'${from}'`).join(`'${to}'`);
};
const archive = f => {
  const dest = path.join(ARCHIVE, rel(f));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(f, dest);
};

async function encode(input, { crop } = {}) {
  let img = sharp(input);
  if (crop) img = img.extract(crop);
  const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  let opaque = true;
  for (let i = 3; i < data.length; i += 4) if (data[i] !== 255) { opaque = false; break; }
  const base = () => {
    const s = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
    return opaque ? s.removeAlpha() : s;
  };
  const lossy = await base().webp({ quality: QUALITY, alphaQuality: 95, effort: 6, smartSubsample: true }).toBuffer();
  const lossless = await base().webp({ lossless: true, effort: 6 }).toBuffer();
  return lossless.length <= lossy.length ? lossless : lossy;
}

(async () => {
  let before = 0, after = 0;
  for (const f of walk(DIST)) before += fs.statSync(f).size;

  // 1. Archive assets that no page references.
  const text = allHtml();
  for (const f of walk(DIST).filter(f => !/\.(html|css)$/.test(f))) {
    if (!text.includes(rel(f))) { console.log('archive', rel(f)); archive(f); }
  }

  // 2. Raster images -> WebP.
  for (const f of walk(DIST).filter(f => /\.(png|jpe?g)$/i.test(f))) {
    const out = f.replace(/\.(png|jpe?g)$/i, '.webp');
    const buf = await encode(f);
    const orig = fs.statSync(f).size;
    if (buf.length > orig * 0.9) { console.log('keep  ', rel(f), kb(orig)); continue; }
    fs.writeFileSync(out, buf);
    replaceRef(rel(f), rel(out));
    archive(f);
    console.log('webp  ', rel(f), kb(orig), '->', kb(buf.length));
  }

  // 3. SVGs that only wrap a raster: crop the raster to the viewBox and ship it as WebP.
  for (const f of walk(DIST).filter(f => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(f, 'utf8');
    const m = svg.match(/^<svg[^>]*viewBox="([\d. -]+)"[^>]*>\s*<image[^>]*?(?:xlink:)?href="data:image\/png;base64,([^"]+)"[^>]*\/>\s*<\/svg>\s*$/);
    if (m) {
      const [x, y, w, h] = m[1].trim().split(/\s+/).map(Number);
      const imgAttrs = svg.match(/<image[^>]*>/)[0].replace(/href="[^"]*"/, '');
      const iw = +(imgAttrs.match(/width="(\d+)"/) || [])[1];
      const png = Buffer.from(m[2], 'base64');
      const meta = await sharp(png).metadata();
      if (meta.width !== iw || /\sx="[1-9]|\sy="[1-9]/.test(imgAttrs)) { console.log('skip  ', rel(f), '(scaled image)'); continue; }
      const buf = await encode(png, { crop: { left: Math.round(x), top: Math.round(y), width: Math.round(w), height: Math.round(h) } });
      const out = f.replace(/\.svg$/, '.webp');
      fs.writeFileSync(out, buf);
      replaceRef(rel(f), rel(out));
      console.log('crop  ', rel(f), kb(fs.statSync(f).size), '->', kb(buf.length));
      archive(f);
      continue;
    }
    // Vector SVG with an embedded PNG (e.g. a pattern fill): re-encode the embedded image only.
    let changed = false, next = svg;
    for (const [, b64] of svg.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)) {
      const webp = await encode(Buffer.from(b64, 'base64'));
      if (webp.length < b64.length * 0.75 * 0.9) { next = next.replace(`data:image/png;base64,${b64}`, `data:image/webp;base64,${webp.toString('base64')}`); changed = true; }
    }
    if (changed) {
      console.log('svg   ', rel(f), kb(svg.length), '->', kb(next.length));
      fs.writeFileSync(f, next);
    }
  }

  for (const p of PAGES) fs.writeFileSync(p, html[p]);

  // 4. Sanity check: every local src/href/poster/url() target must exist.
  let missing = 0;
  for (const p of PAGES) {
    for (const [, ref] of html[p].matchAll(/(?:src|href|poster)="([^"#?:]+\.[a-z0-9]+)"|url\(['"]?([^'")#?:]+)['"]?\)/g)) {
      if (ref && !fs.existsSync(path.join(DIST, ref))) { console.log('MISSING', path.basename(p), ref); missing++; }
    }
  }
  for (const f of walk(DIST)) after += fs.statSync(f).size;
  console.log(`\nTotal: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB, missing refs: ${missing}`);
})();
