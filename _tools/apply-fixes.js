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

edit('landing', html => replaceOnce(html,
  '<video id="syn-desktop-video" src=',
  '<video id="syn-desktop-video" width="872" height="4096" src=',
  'desktop video size'));

edit('pets', html => replaceOnce(html,
  '<footer class="case-grid-footer"><span>© 2026 Anastasiia Semerenko</span><a href="#">↑ Back to top</a></footer>',
  FOOTER, 'pets footer'));

edit('index', html => {
  html = html.replace(/function updateWorkCounterValue\(element,next\)\{[\s\S]*?\}\}\}(?=function normalizeArrowIcons)/, COUNTER);
  if (!html.includes("className='count-reel'")) throw new Error('counter function not replaced');
  html = replaceOnce(html,
    'words.forEach((w,i)=>{const amount=',
    "if(!document.documentElement.classList.contains('scroll-timeline'))words.forEach((w,i)=>{const amount=",
    'reading words guard');
  return html;
});
