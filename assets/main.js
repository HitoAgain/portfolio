document.documentElement.classList.add('js');
document.body.insertAdjacentHTML('afterbegin', '<div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>');
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const seg = new Intl.Segmenter('th', { granularity: 'grapheme' }); // keeps Thai vowels/tone marks attached while typing
const graphemes = s => [...seg.segment(s)].map(x => x.segment);

// ---- Menu
const menuBtn = $('.menu-btn');
$$('.links a').forEach((a, i) => a.style.setProperty('--i', i));
menuBtn.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', open);
});
addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) menuBtn.click(); });
addEventListener('click', e => { if (document.body.classList.contains('menu-open') && !e.target.closest('.links, .menu-btn')) menuBtn.click(); });

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

// ---- Scroll-linked: KMUTT fill
const big = $('.kmutt');
if (big) {
  const onScroll = () => { const r = big.getBoundingClientRect(); big.style.setProperty('--fill', Math.max(0, Math.min(100, (innerHeight - r.top) / (r.height + 40) * 100)) + '%'); };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---- About: the education button swaps the card face to the three school crests, and back
const idCard = $('.id-card');
if (idCard) $$('.id-flip', idCard).forEach(b => b.addEventListener('click', () => {
  const edu = idCard.classList.toggle('show-edu');
  $(edu ? '.id-back .id-flip' : '.id-front .id-flip', idCard).focus(); // keep keyboard focus on the visible face
}));

// ---- About: the name types in Thai, retypes in English big in the middle, glides into place, then keeps switching
const intro = $('[data-intro]');
if (intro && !reduce) (async () => {
  const name = $('.name', intro), out = $('.typed', intro), names = ['อาลีฟ เกษมสวัสดิ์', 'Arlif Kaseamsawat'];
  const type = async (text, en = false) => { out.classList.toggle('accent', en); for (const g of graphemes(text)) { out.textContent += g; await sleep(55); } };
  const erase = async () => { const gs = graphemes(out.textContent); while (gs.length) { gs.pop(); out.textContent = gs.join(''); await sleep(25); } };
  document.body.classList.add('name-intro');
  out.textContent = '';
  await document.fonts.ready;
  await sleep(200);
  await type(names[0]); await sleep(500); await erase(); await sleep(150); await type(names[1], true); await sleep(450);
  // FLIP: measure in the middle, drop into place, then animate from the old spot
  const a = name.getBoundingClientRect(), fa = parseFloat(getComputedStyle(intro).fontSize);
  document.body.classList.remove('name-intro');
  const b = name.getBoundingClientRect(), fb = parseFloat(getComputedStyle(intro).fontSize);
  name.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${fa / fb})` }, { transform: 'none' }], { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' });
  [$('.site-header'), ...$$('.page > :not(.fold), .fold > :not([data-intro])'), $('.site-footer')].forEach((el, i) => el.style.transitionDelay = 150 + i * 90 + 'ms');
  for (let i = 0; ; i++) { await sleep(4000); await erase(); await sleep(250); await type(names[i % 2], i % 2 === 1); }
})();

// ---- Home: photos take turns, each with its own caption; picking a dot stops the auto-play
const heroSlides = $$('.hero-photo .slide'), heroDots = $$('.hero-photo .dots button');
if (heroSlides.length > 1) {
  let cur = 0;
  const go = i => {
    heroSlides[cur].classList.remove('on'); heroDots[cur].removeAttribute('aria-current');
    cur = i;
    heroSlides[cur].classList.add('on'); heroDots[cur].setAttribute('aria-current', 'true');
  };
  const timer = reduce ? 0 : setInterval(() => go((cur + 1) % heroSlides.length), 6000);
  heroDots.forEach((d, i) => d.addEventListener('click', () => { clearInterval(timer); go(i); }));
}

// ---- Pointer effects (mouse only)
if (finePointer && !reduce) {
  const heroImgs = $$('.hero-photo img');
  if (heroImgs.length) addEventListener('pointermove', e => {
    heroImgs.forEach(img => img.style.translate = `${(e.clientX / innerWidth - .5) * -18}px ${(e.clientY / innerHeight - .5) * -12}px`);
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
    .forEach((t, i) => { t.classList.remove('enter'); t.offsetWidth; t.style.setProperty('--delay', i * 100 + 'ms'); t.classList.add('enter'); });
  filters.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', filters).forEach(x => x.setAttribute('aria-pressed', x === b));
    show(b.dataset.cat);
    $('.slides').scrollTo({ left: 0 });
  });
  $('.carousel').addEventListener('reveal', () => show('all'), { once: true });
}

// ---- Skills carousel: next button loops back to the start, arrow keys, mouse drag
const slides = $('.slides');
if (slides) {
  const step = dir => {
    const card = $$('.tile', slides).find(t => !t.hidden), max = slides.scrollWidth - slides.clientWidth;
    if (dir > 0 && slides.scrollLeft >= max - card.offsetWidth / 2) return slides.scrollTo({ left: 0 });
    if (dir < 0 && slides.scrollLeft <= card.offsetWidth / 2) return slides.scrollTo({ left: max });
    slides.scrollBy({ left: dir * (card.offsetWidth + 16) });
  };
  $('.carousel-next').addEventListener('click', () => step(1));
  $('.carousel').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    step(e.key === 'ArrowRight' ? 1 : -1);
  });
  let x0 = null, s0 = 0;
  slides.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { x0 = e.clientX; s0 = slides.scrollLeft; slides.classList.add('dragging'); } });
  addEventListener('pointermove', e => { if (x0 !== null) slides.scrollLeft = s0 - (e.clientX - x0); });
  addEventListener('pointerup', () => { x0 = null; slides.classList.remove('dragging'); });
}

// ---- Featured skills: "ดูผลงาน" opens that skill's works below and scrolls to them
const works = $('#works');
if (works) $$('.see-works').forEach(b => b.addEventListener('click', () => {
  works.hidden = false;
  $$('.works-panel', works).forEach(p => p.hidden = p.dataset.skill !== b.dataset.skill);
  const panel = $(`.works-panel[data-skill="${b.dataset.skill}"]`, works);
  $$('.work', panel).forEach((w, i) => { w.classList.remove('in'); w.offsetWidth; w.style.animationDelay = 250 + i * 120 + 'ms'; w.classList.add('in'); });
  panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}));
// close the works again once the visitor scrolls back up past them
if (works) {
  let seen = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) seen = true;
    else if (seen && e.boundingClientRect.top > 0) { works.hidden = true; seen = false; }
  }, { rootMargin: '0px 0px -15% 0px' }).observe(works); // works starts right at the fold, so ignore the bottom edge
}

// ---- Goal terminal: types commands, prints output
const term = $('.terminal');
if (term) {
  const code = $('code', term), caret = document.createElement('span');
  caret.className = 'caret';
  const script = [
    ['cmd', 'whoami'], ['out', 'arlif kaseamsawat'],
    ['cmd', 'cat goal.txt'], ['out hl', 'คณะวิศวกรรมศาสตร์ สาขาวิศวกรรมคอมพิวเตอร์'], ['out hl', 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี'],
    ['cmd', 'status'], ['out', 'กำลังเตรียมตัว...'], ['cmd', ''],
  ];
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
