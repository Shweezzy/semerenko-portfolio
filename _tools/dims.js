const sharp = require('sharp'), fs = require('fs'), path = require('path');
process.chdir(path.join(__dirname, '..'));
const html = ['index', 'education', 'pets', 'landing'].map(n => fs.readFileSync(`dist/${n}.html`, 'utf8')).join('\n');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
(async () => {
  for (const f of walk('dist').filter(f => /\.(png|jpe?g)$/.test(f))) {
    const rel = path.relative('dist', f).split(path.sep).join('/');
    if (!html.includes(rel)) continue;
    const m = await sharp(f).metadata();
    const i = html.indexOf(rel);
    const tag = html.slice(html.lastIndexOf('<', i), html.indexOf('>', i));
    const w = (tag.match(/\swidth="(\d+)"/) || [])[1] || '-';
    console.log(rel, `${m.width}x${m.height}`, m.hasAlpha ? 'alpha' : '', `${fs.statSync(f).size >> 10}K`, `attrW=${w}`);
  }
})();
