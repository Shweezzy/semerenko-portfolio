// Adds icons, per-page descriptions and Open Graph / Twitter tags to every page.
// Idempotent: re-run with the real domain after deploy, e.g. `node inject-meta.js https://name.vercel.app`.
const fs = require('fs'), path = require('path');
const SITE = (process.argv[2] || 'https://semerenko-portfolio.vercel.app').replace(/\/$/, '');
const DIST = path.join(__dirname, '..', 'dist');
const PAGES = {
  index: { url: '/', description: 'Anastasiia Semerenko — UI/UX designer. Portfolio with an education website redesign, the Prytulok pet adoption app and the Synthetica 2025 landing page.' },
  education: { url: '/education', description: 'Redesign of the RC PTO vocational education centre website: research, structure, desktop and mobile prototypes. Case study by Anastasiia Semerenko.' },
  pets: { url: '/pets', description: 'Prytulok — mobile app concept for adopting and supporting shelter animals: onboarding, catalog, map, meetings and volunteering. Case study by Anastasiia Semerenko.' },
  landing: { url: '/landing', description: 'Synthetica 2025 — landing page concept for an AI × Design conference, from visual direction to an adaptive interface. Case study by Anastasiia Semerenko.' },
};
const START = '<!-- meta:start -->', END = '<!-- meta:end -->';
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

for (const [name, { url, description }] of Object.entries(PAGES)) {
  const file = path.join(DIST, `${name}.html`);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(new RegExp(`\\n?${START}[\\s\\S]*?${END}`), '');
  const title = html.match(/<title>([^<]*)<\/title>/)[1];
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`);
  const tags = [
    START,
    `<link rel="canonical" href="${SITE}${url}">`,
    '<link rel="icon" href="/favicon.ico" sizes="32x32">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<meta name="theme-color" content="#ffffff">',
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="Anastasiia Semerenko">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${SITE}${url}">`,
    `<meta property="og:image" content="${SITE}/og-image.jpg">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    END,
  ].join('\n');
  html = html.replace(/(<meta name="description"[^>]*>)/, `$1\n${tags}`);
  fs.writeFileSync(file, html);
  console.log(`${name}.html: ${SITE}${url}`);
}
