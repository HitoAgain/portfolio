document.documentElement.classList.add('js');
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---- Menu
const menuBtn = $('.menu-btn');
$$('.links a').forEach((a, i) => a.style.setProperty('--i', i));
menuBtn.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', open);
});
addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) menuBtn.click(); });

// ---- Scroll reveal (fires a 'reveal' event so pages can hook in)
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  io.unobserve(e.target);
  e.target.classList.add('on');
  e.target.dispatchEvent(new Event('reveal'));
  // once revealed, hand transitions back to the element's own hover/tilt styles
  if (e.target.classList.contains('rv')) setTimeout(() => { e.target.classList.remove('rv', 'on'); e.target.style.transitionDelay = ''; }, 1300);
}), { threshold: .15 });
$$('.rv').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });

// ---- Scroll-linked: education path, KMUTT fill
const road = $('.road'), big = $('.kmutt');
if (road || big) {
  const onScroll = () => {
    const vh = innerHeight;
    if (road) {
      const r = road.getBoundingClientRect(), p = Math.max(0, Math.min(1, (vh * .85 - r.top) / r.height));
      road.style.setProperty('--off', 1 - p);
      road.style.setProperty('--p', p * 100 + '%');
      $$('li', road).forEach(li => li.classList.toggle('on', p >= li.dataset.at));
    }
    if (big) { const r = big.getBoundingClientRect(); big.style.setProperty('--fill', Math.max(0, Math.min(100, (vh - r.top) / (r.height + 40) * 100)) + '%'); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---- About: the name appears big in the middle of the screen, then glides to its place
const intro = $('[data-intro]');
if (intro && !reduce) {
  document.body.classList.add('name-intro');
  document.fonts.ready.then(() => {
    const r = intro.getBoundingClientRect(), s = Math.min(1.5, innerWidth * .9 / r.width);
    intro.style.transform = `translate(${innerWidth / 2 - (r.left + r.width / 2)}px, ${innerHeight / 2 - (r.top + r.height / 2)}px) scale(${s})`;
    document.body.classList.add('go');
    setTimeout(() => {
      intro.style.transition = 'transform 1s var(--ease)';
      intro.style.transform = '';
      document.body.classList.remove('name-intro', 'go');
    }, 1600);
  });
}

// ---- Pointer effects (mouse only)
if (finePointer && !reduce) {
  const glow = document.createElement('div');
  glow.id = 'glow';
  document.body.append(glow);
  const heroImg = $('.hero-photo img');
  addEventListener('pointermove', e => {
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    if (heroImg) heroImg.style.translate = `${(e.clientX / innerWidth - .5) * -18}px ${(e.clientY / innerHeight - .5) * -12}px`;
  }, { passive: true });

  $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
      el.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });
}

// ---- Lightbox
const lb = $('#lb');
if (lb) {
  const img = $('img', lb), cap = $('p', lb);
  $$('[data-zoom]').forEach(el => {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    const open = () => { const s = $('img', el); img.src = s.src; img.alt = s.alt; cap.textContent = el.dataset.zoom; lb.showModal(); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('button')) lb.close(); });
}

// ---- Skills filter
const filters = $('.filters');
if (filters) {
  const tiles = $$('.tile');
  const show = cat => tiles
    .filter(t => !(t.hidden = cat !== 'all' && t.dataset.cat !== cat))
    .forEach((t, i) => { t.classList.remove('enter'); t.offsetWidth; t.style.setProperty('--delay', i * 35 + 'ms'); t.classList.add('enter'); });
  filters.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', filters).forEach(x => x.setAttribute('aria-pressed', x === b));
    show(b.dataset.cat);
  });
  $('.grid').addEventListener('reveal', () => show('all'), { once: true });
}

// ---- Goal terminal: types commands, prints output
const term = $('.terminal');
if (term) {
  const code = $('code', term), caret = document.createElement('span');
  caret.className = 'caret';
  const seg = new Intl.Segmenter('th', { granularity: 'grapheme' }); // keeps Thai vowels/tone marks attached while typing
  const script = [
    ['cmd', 'whoami'], ['out', 'arlif kaseamsawat'],
    ['cmd', 'cat goal.txt'], ['out hl', 'คณะวิศวกรรมศาสตร์ สาขาวิศวกรรมคอมพิวเตอร์'], ['out hl', 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี'],
    ['cmd', 'status'], ['out', 'กำลังเตรียมตัว...'], ['cmd', ''],
  ];
  const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  term.addEventListener('reveal', async () => {
    for (const [cls, text] of script) {
      const row = document.createElement('div'), t = document.createTextNode('');
      row.className = cls;
      row.append(t);
      code.append(row);
      if (cls === 'cmd') {
        row.append(caret);
        await sleep(400);
        for (const { segment } of seg.segment(text)) { t.data += segment; await sleep(75); }
        await sleep(300);
      } else { t.data = text; await sleep(180); }
    }
  }, { once: true });
}
