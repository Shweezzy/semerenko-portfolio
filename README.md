# Anastasiia Semerenko — портфоліо

Статичний сайт для Vercel. Основа — експорт версії 201 (commit 2fbdc446f44bf06b7241247428adadea0e14a9b6), далі оптимізований.

## Склад
- dist/index.html — головна (/).
- dist/education.html — RC PTO (/education).
- dist/pets.html — Prytulok (/pets).
- dist/landing.html — Synthetica (/landing).
- dist/portfolio-type.css — спільна типографічна система.
- dist/favicon.ico, apple-touch-icon.png, og-image.jpg — іконки й картка-прев'ю для соцмереж і месенджерів.
- vercel.json — статичне розміщення dist, адреси без .html, кешування медіа, базові заголовки безпеки.
- export-manifest.json — перелік файлів і SHA-256.
- _tools/ — скрипти оптимізації та перевірки (не публікуються; у git не входять node_modules).

## Що змінено відносно експорту (89 МБ → 7 МБ, 153 → 105 файлів)
- PNG/JPG → WebP (якість 88 або без втрат, що менше). Візуально перевірено; SSIM ≥ 0.94, на тексті різниці не видно.
- SVG-бейджі Synthetica, які лише обгортали PNG 2048×995 (1,5 МБ кожен), замінено обрізаними WebP (~25 КБ).
- У prytulok/logo.svg вбудований PNG перекодовано у WebP, вектор не змінено.
- MP4 перекодовано H.264 (CRF 22, faststart), SSIM ≥ 0.99.
- 48 файлів, на які не посилається жодна сторінка, прибрано з dist (є в історії git, коміт Baseline).
- Alt-тексти з назвами файлів Figma («Footer(3).png») замінено описовими.
- Виправлено горизонтальний скрол мобільної /landing: заголовок SYNTHETICA був ширшим за екран.
- Додано favicon, canonical, окремі описи сторінок, Open Graph / Twitter-картку.

## Розміщення на Vercel (безкоштовний план Hobby)
1. `npx vercel login`, потім із цієї папки `npx vercel --prod`. Або імпортуйте Git-репозиторій у Vercel: Framework Preset — Other, збірка не потрібна, Output Directory — dist.
2. Якщо адреса відрізняється від https://semerenko-portfolio.vercel.app, виконайте `node _tools/inject-meta.js https://<ваша-адреса>` і задеплойте ще раз, щоб працювали прев'ю посилань.
3. Перевірте /, /education, /pets, /landing, перемикання UA/EN, інтерактивні мокапи, контакти й CV.

## Перевірка локально
`cd _tools && npm install`, потім `node _tools/check.js` — сторінки відкриваються в Chrome на десктопній і мобільній ширині, виводяться помилки консолі, 404 і горизонтальний скрол.
