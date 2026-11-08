// Profile content from the CV (Nov 2026): role line, "About me", case context, nav and copy fixes.
// Idempotent: every change checks whether it is already applied.
const fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '..', 'dist');
const PAGES = ['index', 'education', 'pets', 'landing'];
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const t = (tag, cls, uk, en, attrs = '') => `<${tag}${cls ? ` class="${cls}"` : ''}${attrs} data-uk="${esc(uk)}" data-en="${esc(en)}">${uk}</${tag}>`;

function edit(page, fn) {
  const file = path.join(DIST, `${page}.html`), before = fs.readFileSync(file, 'utf8'), after = fn(before);
  if (after !== before) fs.writeFileSync(file, after);
  console.log(`${page}.html ${after === before ? 'unchanged' : 'updated'}`);
}
function once(html, from, to, label) {
  if (html.includes(to)) return html;
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 match, found ${n}`);
  return html.replace(from, to);
}
function all(html, from, to) { return html.split(from).join(to); }

// 1. Home: role line above the name, "About me" before the contact section, clearer availability.
const nb = s => s.split(' · ').map(p => p.replace(/ /g, '\u00a0')).join(' · ');
const ROLE = t('p', 'hero-role', nb('Junior UI/UX дизайнерка · Ужгород · Відкрита до пропозицій'), nb('Junior UI/UX Designer · Uzhhorod, Ukraine · Open to opportunities'));
const ABOUT = `<section class="approach process profile reveal" id="profile">`
  + t('h2', 'type-section', 'Про мене.', 'About Me.')
  + t('p', 'process-intro type-body', 'Мені цікаво розуміти не лише те, як виглядає інтерфейс, а й чому він має працювати саме так. У 2026 році я пройшла курс UX/UI Design Beginning у Projector Institute, а до дизайну прийшла з досвіду створення візуального контенту та 3D-анімації.',
    'I like to understand not only how an interface looks, but also why it should work the way it does. In 2026 I completed the UX/UI Design Beginning course at Projector Institute, coming to design from visual content creation and 3D animation.')
  + '<div class="process-list">'
  + '<article>' + t('h3', 'type-subheading', 'Навчання', 'Education')
  + t('p', 'type-body', 'UX/UI Design Beginning — Projector Institute, квітень — вересень 2026.', 'UX/UI Design Beginning — Projector Institute, Apr – Sep 2026.')
  + t('p', 'type-body', 'Магістр фармації (промислова фармація) — Ужгородський національний університет, 2018 — 2022.', 'Master’s degree in Pharmacy (Industrial Pharmacy) — Uzhhorod National University, 2018 – 2022.') + '</article>'
  + '<article>' + t('h3', 'type-subheading', 'Досвід', 'Experience')
  + t('p', 'type-body', 'SMM / контент-менеджерка квіткової крамниці «Compliment Bouquet» (з 2021): візуальний контент, тексти та комунікація з клієнтами.', 'SMM / Content Manager at the “Compliment Bouquet” flower shop (since 2021): visual content, copywriting, and client communication.')
  + t('p', 'type-body', '3D-аніматорка (2023 — 2025): анімація 3D-моделей в Autodesk Maya.', '3D Animator (2023 – 2025): animating 3D models in Autodesk Maya.') + '</article>'
  + '<article>' + t('h3', 'type-subheading', 'Навички', 'Skills')
  + t('p', 'type-body', 'Інформаційна архітектура, user flows, вайрфрейми, прототипування, адаптивний дизайн, Auto Layout, компоненти.',
    'Information architecture, user flows, wireframing, prototyping, responsive design, Auto Layout, components.') + '</article>'
  + '<article>' + t('h3', 'type-subheading', 'Інструменти та мови', 'Tools & Languages')
  + t('p', 'type-body', 'Figma, FigJam, Canva, Autodesk Maya, ChatGPT, InShot.', 'Figma, FigJam, Canva, Autodesk Maya, ChatGPT, InShot.')
  + t('p', 'type-body', 'Українська — рідна, англійська — початковий рівень.', 'Ukrainian — native, English — beginner.') + '</article>'
  + '</div>'
  + t('p', 'profile-interests type-body', 'Поза дизайном: бальні танці, книжки, кава, кулінарія, прикраси ручної роботи та флористика.',
    'Outside design: ballroom dancing, reading, coffee, cooking, handmade jewelry, and floristry.')
  + '</section>';

edit('index', html => {
  html = html.replace(/<p class="hero-role"[^>]*>[^<]*<\/p>/, '');
  html = once(html, '<section class="hero"><h1', `<section class="hero">${ROLE}<h1`, 'hero role');
  html = html.replace(/<section class="approach process profile reveal" id="profile">[\s\S]*?<\/section>/, '');
  html = once(html, '<section class="about reveal home-contact-section" id="about">', `${ABOUT}<section class="about reveal home-contact-section" id="about">`, 'about me');
  html = once(html,
    'data-uk="Зараз я відкрита до нових проєктів і можливостей працювати в UI/UX дизайні." data-en="I&#x27;m open to new projects and opportunities in UI/UX design.">Зараз я відкрита до нових проєктів і можливостей працювати в UI/UX дизайні.',
    'data-uk="Зараз я відкрита до пропозицій на позицію Junior UI/UX дизайнерки." data-en="I&#x27;m currently open to Junior UI/UX Designer opportunities.">Зараз я відкрита до пропозицій на позицію Junior UI/UX дизайнерки.',
    'availability');
  return html;
});

// 2. Every page: "Work" in the navigation goes to the selected work list, not to one case;
//    the CV (Notion) opens in a new tab so the portfolio stays open.
for (const page of PAGES) {
  edit(page, html => {
    html = all(html, '<a href="/education"><span data-uk="Роботи" data-en="Work">', '<a href="/#work"><span data-uk="Роботи" data-en="Work">');
    html = all(html, '<a href="/education" aria-current="page"><span data-uk="Роботи" data-en="Work">', '<a href="/#work" aria-current="page"><span data-uk="Роботи" data-en="Work">');
    html = html.replace(/(<a [^>]*href="https:\/\/semerenkocv\.notion\.site[^"]*"[^>]*?)target="_self"/g, '$1target="_blank"');
    return html;
  });
}

// 3. Case pages: say where the project comes from (course at Projector Institute).
const CONTEXT = '<div>' + t('dt', 'type-meta-label', 'Контекст', 'Context') + t('dd', 'type-meta-value', 'Курс UX/UI Design Beginning, Projector Institute', 'UX/UI Design Beginning course, Projector Institute') + '</div>';
for (const page of ['education', 'pets', 'landing']) {
  edit(page, html => {
    if (html.includes('data-uk="Контекст"')) return html;
    const m = html.match(/(<dl class="[^"]*project-information[^"]*">[\s\S]*?)(<\/dl>)/);
    if (!m) throw new Error(`${page}: project information list not found`);
    return html.replace(m[0], m[1] + CONTEXT + m[2]);
  });
}

// 4. Copy fixes.
edit('landing', html => all(html, 'data-uk="Концепція в русі" data-en="Concept in Motion" class="type-section">Концепція в русі<',
  'data-uk="Концепція в русі." data-en="Concept in Motion." class="type-section">Концепція в русі.<'));
edit('pets', html => all(html, 'знайомства з ними та підтримки притулків.', 'знайомства з ними та допомоги їм.'));
// English on the education case: one spelling (US, as on the other pages) and one term for admissions.
edit('education', html => {
  for (const [a, b] of [['Organise information', 'Organize information'], ['analysed the existing', 'analyzed the existing'], ['I organised the content', 'I organized the content'],
    ['organised content', 'organized content'], ['Vocational Education Centre No. 1', 'Vocational Education Center No. 1'], ['education centre website', 'education center website'], ['contact the centre', 'contact the center'],
    ['life at the centre', 'life at the center'], ['introduces the centre', 'introduces the center'], ['form to contact the centre', 'form to contact the center'],
    ['discovering the centre', 'discovering the center'], ['data-en="Admission"', 'data-en="Admissions"']]) html = all(html, a, b);
  return html;
});
