// Regenerates export-manifest.json (path, size, SHA-256) for everything in dist/.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const prev = JSON.parse(fs.readFileSync(path.join(ROOT, 'export-manifest.json'), 'utf8'));
const files = walk(path.join(ROOT, 'dist')).sort().map(f => {
  const buf = fs.readFileSync(f);
  return { path: path.relative(ROOT, f).split(path.sep).join('/'), bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
});
const out = { site_version: prev.site_version, source_commit: prev.source_commit, original_file_count: prev.original_file_count, optimized: true, file_count: files.length, total_bytes: files.reduce((s, f) => s + f.bytes, 0), files };
fs.writeFileSync(path.join(ROOT, 'export-manifest.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`${files.length} files, ${(out.total_bytes / 1048576).toFixed(1)} MB`);
