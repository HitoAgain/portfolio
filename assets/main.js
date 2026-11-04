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
  document.body.classList.add('menu-seen'); // the home arrow hint has done its job
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

// ---- Intros: FLIP the title from the middle of the screen into its place, then fade the rest of the page in one after another
const settle = (el, cls, rest) => {
  const a = el.getBoundingClientRect();
  document.body.classList.remove(cls);
  const b = el.getBoundingClientRect();
  el.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width})` }, { transform: 'none' }], { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' });
  [$('.site-header'), ...$$(rest), $('.site-footer')].forEach((x, i) => x.style.transitionDelay = 150 + i * 90 + 'ms');
};

// ---- About: the cloud glides down to the skills, slower than native smooth scroll, leaving room above the SKILL title
$$('.cloud').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const from = scrollY, to = $(a.hash).getBoundingClientRect().top + scrollY - 110, t0 = performance.now(), dur = reduce ? 0 : 1400;
  const ease = t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
  const tick = now => {
    const t = dur ? Math.max(0, Math.min(1, (now - t0) / dur)) : 1; // a frame's timestamp can be a hair before t0
    scrollTo({ top: from + (to - from) * ease(t), behavior: 'instant' });
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
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
  settle(name, 'name-intro', '.page > :not(.fold), .fold > :not([data-intro])');
  for (let i = 0; ; i++) { await sleep(4000); await erase(); await sleep(250); await type(names[i % 2], i % 2 === 1); }
})();

// ---- Works: "ผลงาน" writes itself big in the middle, glitching a few times, then glides into place
const awTitle = $('.aw-title');
if (awTitle && !reduce) (async () => {
  const svg = $('svg', awTitle);
  document.body.classList.add('aw-intro');
  for (const ms of [200, 350, 350, 300]) {
    await sleep(ms);
    svg.classList.remove('zap'); svg.offsetWidth; svg.classList.add('zap');
  }
  await sleep(300);
  settle(svg, 'aw-intro', '.page > :not(.aw-title)');
})();

// ---- Slideshows (home hero, KMUTT certificates on the works page): slides take turns; picking a dot stops the auto-play
$$('[data-slides]').forEach(box => {
  const slides = $$('.slide', box), dots = $$('.dots button', box);
  let cur = 0;
  const go = i => {
    slides[cur].classList.remove('on'); dots[cur].removeAttribute('aria-current');
    cur = i;
    slides[cur].classList.add('on'); dots[cur].setAttribute('aria-current', 'true');
  };
  const timer = reduce ? 0 : setInterval(() => go((cur + 1) % slides.length), +box.dataset.slides);
  dots.forEach((d, i) => d.addEventListener('click', () => { clearInterval(timer); go(i); }));
});

// ---- Works: a card opens its detail sheet; the cover photo morphs into the sheet's first photo (Chrome/Edge)
const morph = (from, to, update) => {
  if (reduce || !document.startViewTransition) return update();
  from.style.viewTransitionName = 'aw-photo';
  const t = document.startViewTransition({ update: () => { from.style.viewTransitionName = ''; update(); to.style.viewTransitionName = 'aw-photo'; }, types: ['aw'] });
  t.ready.catch(() => {}); // a skipped transition (fast double click) still runs update; nothing to report
  t.finished.finally(() => to.style.viewTransitionName = '');
};
$$('[data-open]').forEach(b => {
  const d = $('#' + b.dataset.open), cover = $('.aw-photo img', b.closest('.aw-card')), photo = $('.aw-gallery img', d);
  const close = () => morph(photo, cover, () => d.close());
  b.addEventListener('click', () => morph(cover, photo, () => { d.showModal(); $('.aw-sheet', d).scrollTop = 0; }));
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('.aw-close')) close(); });
  d.addEventListener('cancel', e => { e.preventDefault(); close(); });
});

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
      el.style.setProperty('--mx', (x + .5) * 100 + '%'); el.style.setProperty('--my', (y + .5) * 100 + '%');
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
    // a figure zooms its own photo; a button (certificate cards) names its picture in data-src
    const open = () => { const s = el.dataset.src ? { src: el.dataset.src, alt: el.dataset.alt || '' } : $('img', el); img.src = s.src; img.alt = s.alt; cap.textContent = el.dataset.zoom; lb.showModal(); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('button')) lb.close(); });
}

// ---- Works: category tabs show one category (or all); the cards of the shown ones pop in again
const tabs = $$('.cat-tabs [data-filter]');
tabs.forEach(t => t.addEventListener('click', () => {
  const f = t.dataset.filter;
  tabs.forEach(x => x.setAttribute('aria-pressed', x === t));
  $$('.aw-cat').forEach(sec => {
    sec.hidden = f !== 'all' && sec.dataset.cat !== f;
    if (sec.hidden) return;
    $$('.aw-slot, .cat-head', sec).forEach((el, i) => {
      io.unobserve(el); el.classList.remove('rv', 'on'); el.style.transitionDelay = '';
      el.classList.remove('pop'); el.offsetWidth; el.style.animationDelay = i * 70 + 'ms'; el.classList.add('pop');
    });
  });
}));

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

// ---- Goal story: after the intro a glass terminal types "ชอบเล่นเกม", then the paragraphs one at a time. Each question
//      button (shown once it is scrolled to) shatters the glass from where it was clicked; the shards fly back together
//      and the next text types in. The last question opens the white circle and lets the goal page in.
//      goalReady resolves once the goal page itself is uncovered.
const story = $('.story');
let goalReady = $('.goal-intro') ? sleep(2700) : Promise.resolve();
if (story) goalReady = new Promise(done => {
  const win = $('.glass-term', story), steps = $$('.story-step', story), cue = $('.story-cue'), outro = $('.goal-outro');
  const hold = ms => new Promise(r => setTimeout(r, ms)); // reading time: kept even with reduced motion
  const frame = () => new Promise(requestAnimationFrame);
  const top0 = () => scrollTo({ top: 0, behavior: 'instant' });
  document.body.classList.add('story-on');

  // each typed line: the full text for screen readers, then (hidden from them) typed part + caret + untyped rest
  $$('[data-type]', story).forEach(el => {
    const text = el.textContent.trim();
    el.innerHTML = '<span class="sr-only"></span><span aria-hidden="true"><span class="tt"></span><span class="tc"></span><span class="tr"></span></span>';
    $('.sr-only', el).textContent = $('.tr', el).textContent = text;
    el.chars = graphemes(text);
  });
  let rush = false; // a click on the window while it types finishes the text at once
  win.addEventListener('click', e => { if (!e.target.closest('.story-next')) rush = true; });
  const type = async el => {
    const g = el.chars, t = $('.tt', el), r = $('.tr', el), ms = +el.dataset.type, t0 = performance.now();
    $$('.cur', story).forEach(x => x.classList.remove('cur'));
    el.classList.add('cur');
    for (let n = 0; n < g.length;) {
      await frame();
      n = rush || reduce ? g.length : Math.min(g.length, Math.floor((performance.now() - t0) / ms) + 1);
      t.textContent = g.slice(0, n).join(''); r.textContent = g.slice(n).join('');
    }
  };
  const reveal = async (step, focus) => {
    step.classList.add('on');
    if (focus) step.focus({ preventScroll: true }); // keyboard and screen-reader users land on the new text
    rush = false;
    for (const el of $$('[data-type]', step)) await type(el);
    const btn = $('.story-next', step);
    if (!btn) return;
    const seen = new IntersectionObserver(([e]) => {
      cue.hidden = e.isIntersecting;
      if (e.isIntersecting) { btn.classList.add('seen'); seen.disconnect(); }
    }, { threshold: 1 });
    seen.observe(btn);
  };

  // break the window (w × h) into rings of pieces around the impact point (cx, cy): triangles at the centre, then two rings of quads
  const pieces = (w, h, cx, cy) => {
    const N = 9, rad = [Math.min(w, h) * .16, Math.max(w, h) * .42, 6000], base = Math.random() * 6.3, out = [];
    const ang = [...Array(N)].map((_, i) => base + (i + (Math.random() - .5) * .6) * 2 * Math.PI / N);
    const pts = rad.map((r, k) => ang.map(t => { const rr = k < 2 ? r * (.7 + Math.random() * .6) : r; return [cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]; }));
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      out.push({ ring: 0, pts: [[cx, cy], pts[0][i], pts[0][j]] });
      for (let k = 1; k < 3; k++) out.push({ ring: k, pts: [pts[k - 1][i], pts[k][i], pts[k][j], pts[k - 1][j]] });
    }
    return out;
  };
  const shatter = async (from, to, at) => {
    const a = win.getBoundingClientRect();
    const cx = (at ? at.x : a.left + a.width / 2) - a.left, cy = (at ? at.y : a.top + a.height / 2) - a.top;
    const box = document.createElement('div');
    box.className = 'shards'; box.inert = true;
    Object.assign(box.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    const flights = pieces(a.width, a.height, cx, cy).map(({ ring, pts }) => {
      const s = win.cloneNode(true);
      s.style.clipPath = `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
      // fly away from the impact, from the middle of the piece's visible part
      const vis = pts.map(([x, y]) => [Math.max(0, Math.min(a.width, x)), Math.max(0, Math.min(a.height, y))]);
      const mx = vis.reduce((t, p) => t + p[0], 0) / vis.length, my = vis.reduce((t, p) => t + p[1], 0) / vis.length;
      const d = Math.hypot(mx - cx, my - cy) || 1, far = [50, 120, 200][ring] + Math.random() * 70;
      s.style.transformOrigin = `${mx}px ${my}px`;
      box.append(s);
      return { s, ring, to: `translate(${(mx - cx) / d * far}px, ${(my - cy) / d * far + 30}px) rotate(${(Math.random() - .5) * (40 + ring * 30)}deg) scale(.94)` };
    });
    document.body.append(box);
    win.style.visibility = 'hidden';
    await Promise.all(flights.map(f => f.s.animate([{ transform: 'none', filter: 'brightness(1.8)' }, { transform: f.to, opacity: .7 }],
      { duration: 420, delay: f.ring * 35, easing: 'cubic-bezier(.15,.85,.3,1)', fill: 'forwards' }).finished));
    // while the pieces are apart: put the next text in, untyped, and send the pieces to the window's new place and size
    from.classList.remove('on'); to.classList.add('on'); top0();
    const b = win.getBoundingClientRect();
    Object.assign(box.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px' });
    flights.forEach(f => { f.s.innerHTML = win.innerHTML; });
    const back = { duration: 520, easing: 'cubic-bezier(.55,0,.25,1.12)', fill: 'forwards' };
    box.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }], back);
    await Promise.all(flights.map(f => f.s.animate([{ transform: f.to, opacity: .7 }, { transform: 'none', opacity: 1 }], { ...back, delay: (2 - f.ring) * 35 }).finished));
    box.remove();
    win.style.visibility = '';
  };
  const next = async (from, to, at) => {
    if (reduce) { from.classList.remove('on'); top0(); }
    else await shatter(from, to, at);
    reveal(to, true);
  };

  const finish = async () => {
    outro.hidden = false;
    await sleep(800);
    document.body.classList.replace('story-on', 'story-done');
    top0();
    await hold(1600);
    outro.classList.add('close');
    await sleep(600);
    outro.hidden = true;
    $('.page-title').focus({ preventScroll: true });
    done();
  };
  steps.forEach((step, i) => {
    const btn = $('.story-next', step);
    if (btn) btn.addEventListener('click', e => {
      btn.disabled = true; // one click is enough
      cue.hidden = true;
      if (i === steps.length - 1) finish();
      else next(step, steps[i + 1], e.detail ? { x: e.clientX, y: e.clientY } : null); // keyboard: break from the middle
    });
  });
  (async () => {
    await sleep(2600); // the intro circle is closing
    win.classList.add('on');
    await sleep(350);
    await reveal(steps[0]);
    await hold(1500);
    next(steps[0], steps[1]);
  })();
});

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
    await goalReady; // wait until the intro (and the story) has uncovered the page
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
