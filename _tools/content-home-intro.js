// Replaces the home intro copy (hero description + scroll-revealed paragraph), UA and EN.
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'dist', 'index.html');
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const HERO = {
  uk: 'Мені цікаво створювати інтерфейси, у яких візуальна виразність поєднується з простотою та зручністю користування. У своїх проєктах я працюю зі структурою інформації, логікою взаємодії та візуальним оформленням. Шукаю рішення, які допомагають користувачам легко орієнтуватися в інтерфейсі.',
  en: "I enjoy creating interfaces where visual expressiveness goes hand in hand with simplicity and ease of use. In my projects, I work with information structure, interaction logic, and visual design. I look for solutions that help people find their way around an interface with ease.",
};
const READING = {
  uk: 'Тут зібрані три мої роботи: редизайн сайту для реального замовника, концепт мобільного застосунку та лендинг для конференції. Кожна з них показує різні аспекти мого підходу до дизайну.',
  en: 'Here are three of my projects: a website redesign for a real client, a mobile app concept, and a landing page for a conference. Each one shows a different side of my approach to design.',
};
let html = fs.readFileSync(file, 'utf8');
const swap = (re, label, { uk, en }, cls) => {
  const m = html.match(re);
  if (!m) { if (html.includes(esc(uk))) return console.log(`${label}: already updated`); throw new Error(`${label}: not found`); }
  html = html.replace(m[0], m[0]
    .replace(/data-uk="[^"]*"/, `data-uk="${esc(uk)}"`)
    .replace(/data-en="[^"]*"/, `data-en="${esc(en)}"`)
    .replace(/>[^<]*<\/p>$/, `>${uk}</p>`));
  console.log(`${label}: updated`);
};
swap(/<p class="type-hero-description" data-uk="Мені цікаво, як зробити[^>]*>[^<]*<\/p>/, 'hero description', HERO);
swap(/<p data-reading data-uk="Тут три мої роботи[^>]*>[^<]*<\/p>/, 'reading paragraph', READING);
fs.writeFileSync(file, html);
