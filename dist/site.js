// Shared behaviour for all pages. Loaded once at the end of <body>.

// Video posters as backgrounds: WebKit (iOS Safari) draws nothing for a video that has not
// loaded, e.g. in battery saver where autoplay is blocked, so the poster frame is painted
// behind the video as well. Played frames cover it as usual.
document.querySelectorAll('video[poster]').forEach(video => {
  if (getComputedStyle(video).backgroundImage !== 'none') return;
  video.style.background = `url("${video.getAttribute('poster')}") center top / cover no-repeat`;
});

// Gesture hints ("Scroll", "Swipe") under scrollable mockups.
// Hints are positioned in document coordinates (position:absolute, see site.css), so the page
// scroll moves them natively; positions are recomputed only when layout can change.
(() => {
  const pets = !!document.querySelector('.pet-case'), entries = [], seen = new WeakSet();
  const verticalIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/></svg>';
  const horizontalIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/></svg>';
  let layoutQueued = false, visibilityQueued = false;

  function canHint(el, axis) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.pointerEvents === 'none' || el.closest('.hero-product') || !el.getClientRects().length) return false;
    const overflow = axis === 'x' ? style.overflowX : style.overflowY;
    return /auto|scroll/.test(overflow) && (axis === 'x' ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight) > 6;
  }

  function add(el, axis) {
    if (seen.has(el)) return;
    seen.add(el);
    const anchor = axis === 'y' ? (el.closest('.pet-phone,.syn-mobile-device,.mobile-device,.browser-mockup') || el) : el;
    const hint = document.createElement('span');
    hint.className = 'mockup-gesture-hint' + (axis === 'x' ? ' is-horizontal' : '');
    if (el.hasAttribute('data-hint-icon-only')) hint.classList.add('is-icon-only');
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = (axis === 'x' ? horizontalIcon : verticalIcon) + '<span></span>';
    document.body.append(hint);
    const entry = { el, axis, anchor, hint, dismissed: false };
    entries.push(entry);
    const dismiss = () => { entry.dismissed = true; hint.classList.remove('is-visible'); };
    el.addEventListener('pointerdown', dismiss, { passive: true, once: true });
    el.addEventListener('wheel', dismiss, { passive: true, once: true });
    el.addEventListener('scroll', dismiss, { passive: true, once: true });
    el.addEventListener('keydown', event => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) dismiss();
    });
    hint.querySelector('svg').addEventListener('animationend', () => hint.classList.add('has-animated'));
    if (window.ResizeObserver) new ResizeObserver(scheduleLayout).observe(el);
  }

  function collect() {
    if (pets) {
      document.querySelectorAll('.catalog-scroll,.pet-screen:not(.catalog-screen)').forEach(el => { if (!el.querySelector('video')) add(el, 'y'); });
      document.querySelectorAll('.discovery-mobile-track,.meeting-flow-gallery,.profile-screen-sequence').forEach(el => add(el, 'x'));
    } else {
      document.querySelectorAll('.admission-viewport,.mobile-device-viewport,.syn-design-chapter .syn-desktop-viewport').forEach(el => add(el, 'y'));
    }
  }

  // Containing block of the absolutely positioned hints (the body if positioned, else the document).
  const origin = () => (getComputedStyle(document.body).position === 'static' ? document.documentElement : document.body).getBoundingClientRect();

  function layout() {
    layoutQueued = false;
    collect();
    const uk = document.documentElement.lang === 'uk', touch = matchMedia('(pointer:coarse)').matches, o = origin();
    for (const e of entries) {
      const rect = e.anchor.getBoundingClientRect();
      const label = e.axis === 'x' ? (uk ? (touch ? 'Свайпніть' : 'Гортайте') : (touch ? 'Swipe' : 'Scroll horizontally')) : (uk ? 'Прокрутіть' : 'Scroll');
      e.hint.lastElementChild.textContent = e.hint.classList.contains('is-icon-only') ? '' : label;
      const light = e.anchor.closest('.pet-light,.syn-light,.case-light,.story-light');
      e.hint.style.setProperty('--hint-color', light ? '#666' : '#aaa');
      e.hint.style.left = (Math.max(80, Math.min(innerWidth - 80, rect.left + rect.width / 2)) - o.left) + 'px';
      e.hint.style.top = (rect.bottom + 3 - o.top) + 'px';
    }
    visibility();
  }

  function visibility() {
    visibilityQueued = false;
    for (const e of entries) {
      const rect = e.anchor.getBoundingClientRect(), target = e.el.getBoundingClientRect();
      const visible = !e.dismissed && canHint(e.el, e.axis) && target.right > 20 && target.left < innerWidth - 20 &&
        target.top < innerHeight && rect.bottom > 20 && rect.bottom + 23 < innerHeight;
      e.hint.classList.toggle('is-visible', visible);
    }
  }

  function scheduleLayout() { if (!layoutQueued) { layoutQueued = true; requestAnimationFrame(layout); } }
  function scheduleVisibility() { if (!visibilityQueued) { visibilityQueued = true; requestAnimationFrame(visibility); } }

  addEventListener('scroll', scheduleVisibility, { passive: true });
  addEventListener('resize', scheduleLayout, { passive: true });
  addEventListener('load', scheduleLayout);
  document.addEventListener('load', scheduleLayout, true); // images and videos inside the page
  if (window.ResizeObserver) new ResizeObserver(scheduleLayout).observe(document.body);
  new MutationObserver(scheduleLayout).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  scheduleLayout();
})();

// Home "reading" paragraph: hand the word-by-word fade to a CSS scroll timeline (site.css).
// Each word gets the same start/end points the inline scroll handler used, expressed as
// percentages of the stage's "cover" range; the inline handler skips while this is active.
(() => {
  const stage = document.querySelector('.reading-stage'), paragraph = stage && stage.querySelector('[data-reading]');
  if (!paragraph || !CSS.supports('animation-timeline: view()') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('scroll-timeline');
  function apply() {
    const words = [...paragraph.querySelectorAll('.word')], n = words.length + 6;
    const H = stage.offsetHeight, vh = innerHeight, cover = H + vh;
    // Inline handler: progress p runs 0..1 while the stage top moves from 0.55vh to vh - H.
    const at = p => ((0.45 * vh + p * (H - 0.45 * vh)) / cover * 100).toFixed(3) + '%';
    words.forEach((w, i) => {
      w.style.removeProperty('opacity');
      w.style.setProperty('--word-start', at(i / n));
      w.style.setProperty('--word-end', at((i + 1) / n));
    });
  }
  new MutationObserver(apply).observe(paragraph, { childList: true });
  addEventListener('resize', apply, { passive: true });
  apply();
})();
