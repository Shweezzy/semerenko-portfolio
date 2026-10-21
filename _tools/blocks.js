// Compares <script id> / <style id> blocks across pages: node blocks.js [id ...]
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const PAGES = ['index', 'education', 'pets', 'landing'];
const html = Object.fromEntries(PAGES.map(p => [p, fs.readFileSync(path.join(__dirname, '..', 'dist', `${p}.html`), 'utf8')]));
const block = (h, id) => {
  const m = h.match(new RegExp(`<(script|style) id="${id}">([\\s\\S]*?)</\\1>`));
  return m ? m[2] : null;
};
if (process.argv[2] === '--show') {
  // node blocks.js --show <page> <id> [<id> ...]
  for (const id of process.argv.slice(4)) console.log(`== ${id}\n${block(html[process.argv[3]], id)}\n`);
  process.exit(0);
}
const ids = process.argv.slice(2).length ? process.argv.slice(2)
  : [...new Set(PAGES.flatMap(p => [...html[p].matchAll(/<(?:script|style) id="([^"]+)"/g)].map(m => m[1])))];
for (const id of ids) {
  const row = PAGES.map(p => { const b = block(html[p], id); return b === null ? '   -    ' : crypto.createHash('md5').update(b).digest('hex').slice(0, 8); });
  console.log(id.padEnd(44), row.join(' '));
}
