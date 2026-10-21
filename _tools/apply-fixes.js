// Applies the October 2026 UX fixes to the pages. Idempotent: safe to run more than once.
const fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const PAGES = ['index', 'education', 'pets', 'landing'];

function edit(page, fn) {
  const file = path.join(DIST, `${page}.html`);
  const before = fs.readFileSync(file, 'utf8'), after = fn(before);
  if (after !== before) fs.writeFileSync(file, after);
  console.log(`${page}.html ${after === before ? 'unchanged' : 'updated'}`);
}
function replaceOnce(html, from, to, label) {
  if (html.includes(to)) return html;
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 match, found ${n}`);
  return html.replace(from, to);
}

// The counter rolls only the digits that change, upward when moving forward and downward when going back.
const COUNTER = `function updateWorkCounterValue(element,next){const current=element._counterTarget??element.textContent;if(current===next)return;element._counterTarget=next;(element._roll||[]).forEach(a=>a.cancel());element._roll=[];if(matchMedia('(prefers-reduced-motion:reduce)').matches||!element.animate||current.length!==next.length){element.textContent=next;return}const forward=Number(next)>Number(current);element.textContent='';element.setAttribute('aria-label',next);[...next].forEach((digit,i)=>{const cell=document.createElement('span');cell.className='count-digit';if(digit===current[i]){cell.textContent=digit;element.append(cell);return}const reel=document.createElement('span');reel.className='count-reel';const from=document.createElement('span'),to=document.createElement('span');from.textContent=current[i];to.textContent=digit;if(forward)reel.append(from,to);else reel.append(to,from);cell.append(reel);element.append(cell);const frames=forward?[{transform:'translateY(0)'},{transform:'translateY(-50%)'}]:[{transform:'translateY(-50%)'},{transform:'translateY(0)'}];element._roll.push(reel.animate(frames,{duration:560,easing:'cubic-bezier(.22,1,.36,1)',delay:i*40,fill:'both'}));from.animate([{opacity:1},{opacity:0}],{duration:360,easing:'ease-out',delay:i*40,fill:'both'});to.animate([{opacity:0},{opacity:1}],{duration:420,easing:'ease-in',delay:i*40+80,fill:'both'})});Promise.all(element._roll.map(a=>a.finished)).then(()=>{if(element._counterTarget!==next)return;element.textContent=next;element.removeAttribute('aria-label');element._roll=[];delete element._counterTarget}).catch(()=>{})}`;

const FOOTER = '<footer class="case-grid-footer"><span class="" data-uk="© 2026 Анастасія Семеренко" data-en="© 2026 Anastasiia Semerenko">© 2026 Анастасія Семеренко</span><span>UI/UX PORTFOLIO</span><a href="#"><span class="" data-uk="На початок ↑" data-en="Back to top ↑">На початок ↑</span></a></footer>';

for (const page of PAGES) {
  edit(page, html => {
    // Shared stylesheet after all inline styles; shared script after all inline scripts.
    html = replaceOnce(html, '</head>', '<link rel="stylesheet" href="site.css"></head>', 'site.css');
    html = replaceOnce(html, '</body>', '<script src="site.js"></script></body>', 'site.js');
    // These controllers now live in site.js.
    html = html.replace(/<script id="interactive-mockup-hints-controller">[\s\S]*?<\/script>/, '');
    html = html.replace(/<script id="mobile-menu-icon-contrast-controller">[\s\S]*?<\/script>/, '');
    return html;
  });
}

// Internal links point at clean URLs, saving the .html -> clean URL redirect on every navigation
// (which also keeps cross-document view transitions on a single same-origin hop).
for (const page of PAGES) {
  edit(page, html => html.replace(/href="(index|education|pets|landing)\.html(#[^"]*)?"/g,
    (m, name, hash = '') => `href="/${name === 'index' ? '' : name}${hash}"`));
}

edit('landing', html => replaceOnce(html,
  '<video id="syn-desktop-video" src=',
  '<video id="syn-desktop-video" width="872" height="4096" src=',
  'desktop video size'));

edit('pets', html => replaceOnce(html,
  '<footer class="case-grid-footer"><span>© 2026 Anastasiia Semerenko</span><a href="#">↑ Back to top</a></footer>',
  FOOTER, 'pets footer'));

// Pets hero title on phones: "ПРИТУЛОК." is ~5.8em wide and nowrap, so 17.5vw overflowed by ~42px.
edit('pets', html => replaceOnce(html,
  '.pet-hero h1{font-size:clamp(48px,17.5vw,76px)',
  '.pet-hero h1{font-size:clamp(44px,15vw,76px)',
  'pets hero title size'));

// Synthetica badges sway on scroll at every width above phones (was tablet-only), including the
// hero badge; the pointer sway stays as it was. Phones have their own script for the mobile trio.
edit('landing', html => replaceOnce(html,
  "if(root.matches('.badge-touch-composition')){const tablet=matchMedia('(min-width:751px) and (max-width:1024px)');",
  "if(root.matches('.badge-touch-composition,.syn-hero-badge')){const tablet=matchMedia('(min-width:751px)');",
  'badge scroll sway'));

// Mobile menu button lives outside <header>: a backdrop-filter nested inside the header's own
// backdrop-filter only blurs the header layer, so the button showed the page unblurred.
for (const page of PAGES) {
  edit(page, html => {
    const m = html.match(/<button class="portfolio-menu-toggle"[\s\S]*?<\/button>(?=<\/header>)/);
    if (!m) return html;
    return html.replace(m[0] + '</header>', '</header>' + m[0]);
  });
}

edit('index', html => {
  html = html.replace(/function updateWorkCounterValue\(element,next\)\{[\s\S]*?\}\}\}(?=function normalizeArrowIcons)/, COUNTER);
  if (!html.includes("className='count-reel'")) throw new Error('counter function not replaced');
  html = replaceOnce(html,
    'words.forEach((w,i)=>{const amount=',
    "if(!document.documentElement.classList.contains('scroll-timeline'))words.forEach((w,i)=>{const amount=",
    'reading words guard');
  return html;
});
