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
// picking a page: the panel slides away first, then the page changes (a jump with the menu still open felt rough)
$$('.links a').forEach(a => a.addEventListener('click', e => {
  if (!document.body.classList.contains('menu-open') || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  menuBtn.click();
  if (a.getAttribute('aria-current') !== 'page') setTimeout(() => { location.href = a.href; }, reduce ? 0 : 280);
}));

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
$$('.aw-open[data-open]').forEach(b => {
  const d = $('#' + b.dataset.open), cover = $('.aw-photo img', b.closest('.aw-card')), photo = $('.aw-gallery img', d);
  const close = () => morph(photo, cover, () => d.close());
  b.addEventListener('click', () => morph(cover, photo, () => { d.showModal(); $('.aw-sheet', d).scrollTop = 0; }));
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('.aw-close')) close(); });
  d.addEventListener('cancel', e => { e.preventDefault(); close(); });
});

// ---- Pointer effects (mouse only); pointer events can come faster than the screen draws, so each writes once per frame
if (finePointer && !reduce) {
  const heroImgs = $$('.hero-photo img');
  let hx = 0, hy = 0, hraf = 0;
  if (heroImgs.length) addEventListener('pointermove', e => {
    hx = e.clientX; hy = e.clientY;
    hraf ||= requestAnimationFrame(() => {
      hraf = 0;
      heroImgs.forEach(img => img.style.translate = `${(hx / innerWidth - .5) * -18}px ${(hy / innerHeight - .5) * -12}px`);
    });
  }, { passive: true });

  $$('[data-tilt]').forEach(el => {
    let ev = null, raf = 0;
    el.addEventListener('pointermove', e => {
      ev = e;
      raf ||= requestAnimationFrame(() => {
        raf = 0;
        const b = el.getBoundingClientRect(), x = (ev.clientX - b.left) / b.width - .5, y = (ev.clientY - b.top) / b.height - .5;
        el.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
        el.style.setProperty('--mx', (x + .5) * 100 + '%'); el.style.setProperty('--my', (y + .5) * 100 + '%');
      });
    });
    el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); raf = 0; el.style.transform = ''; });
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

// ---- Typing (goal page): a typed line keeps its full text for screen readers; on screen it is the typed part, a caret,
//      and the untyped rest, which stays laid out but invisible so nothing moves while it types
const frame = () => new Promise(requestAnimationFrame);
const prepType = el => {
  const text = el.textContent.trim();
  el.innerHTML = '<span class="sr-only"></span><span aria-hidden="true"><span class="tt"></span><span class="tc"></span><span class="tr"></span></span>';
  $('.sr-only', el).textContent = $('.tr', el).textContent = text;
  el.chars = graphemes(text);
};
const showTyped = (el, n) => { $('.tt', el).textContent = el.chars.slice(0, n).join(''); $('.tr', el).textContent = el.chars.slice(n).join(''); };
// types el at data-type ms per character (several per frame when that is faster than the screen); the caret moves along
// within scope; skip() true = show the rest at once
const typeLine = async (el, scope, skip = () => false) => {
  const ms = +el.dataset.type || 30, t0 = performance.now();
  $$('.cur', scope).forEach(x => x.classList.remove('cur'));
  el.classList.add('cur');
  for (let n = 0; n < el.chars.length;) {
    await frame();
    n = skip() || reduce ? el.chars.length : Math.min(el.chars.length, Math.floor((performance.now() - t0) / ms) + 1);
    showTyped(el, n);
  }
};

// ---- Glass shatter (goal page): copies of the window, each clipped to one piece of a break around the impact point, fly
//      apart; swap() changes the window's content while they are apart; then they fly back together as the new window.
//      speed < 1 = quicker. Only transforms and opacity animate, so it all runs on the GPU.
const pieces = (w, h, cx, cy) => {
  const N = 7, rad = [Math.min(w, h) * .18, Math.max(w, h) * .45, 6000], base = Math.random() * 6.3, out = [];
  const ang = [...Array(N)].map((_, i) => base + (i + (Math.random() - .5) * .6) * 2 * Math.PI / N);
  const pts = rad.map((r, k) => ang.map(t => { const rr = k < 2 ? r * (.7 + Math.random() * .6) : r; return [cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]; }));
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    out.push({ ring: 0, pts: [[cx, cy], pts[0][i], pts[0][j]] });
    for (let k = 1; k < 3; k++) out.push({ ring: k, pts: [pts[k - 1][i], pts[k][i], pts[k][j], pts[k - 1][j]] });
  }
  return out;
};
const shatter = async (win, swap, at, speed = 1) => {
  if (reduce) return swap();
  const copy = () => { const c = win.cloneNode(true); c.removeAttribute('style'); c.removeAttribute('id'); $$('[id]', c).forEach(x => x.removeAttribute('id')); return c; };
  const put = (box, r) => Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  const a = win.getBoundingClientRect();
  const cx = (at ? at.x : a.left + a.width / 2) - a.left, cy = (at ? at.y : a.top + a.height / 2) - a.top;
  const box = document.createElement('div'), proto = copy();
  box.className = 'shards'; box.inert = true; put(box, a);
  const flights = pieces(a.width, a.height, cx, cy).map(({ ring, pts }) => {
    const s = proto.cloneNode(true);
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
  await Promise.all(flights.map(f => f.s.animate([{ transform: 'none' }, { transform: f.to, opacity: .7 }],
    { duration: 420 * speed, delay: f.ring * 35 * speed, easing: 'cubic-bezier(.15,.85,.3,1)', fill: 'forwards' }).finished));
  // while the pieces are apart: change the window, then send the pieces to its new place and size
  swap();
  const b = win.getBoundingClientRect(), html = copy().innerHTML;
  put(box, b);
  flights.forEach(f => { f.s.innerHTML = html; });
  const back = { duration: 520 * speed, easing: 'cubic-bezier(.55,0,.25,1.12)', fill: 'forwards' };
  box.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }], back);
  await Promise.all(flights.map(f => f.s.animate([{ transform: f.to, opacity: .7 }, { transform: 'none', opacity: 1 }], { ...back, delay: (2 - f.ring) * 35 * speed }).finished));
  box.remove();
  win.style.visibility = '';
};

// ---- Goal story: after the intro a glass terminal types "ชอบเล่นเกม", then the paragraphs one at a time. A click anywhere
//      on the window shatters the glass from where it was clicked; the shards fly back together and the next text types in.
//      After the last one the white circle opens and lets the goal page in. goalReady resolves once the page is uncovered.
const story = $('.story');
let goalReady = $('.goal-intro') ? sleep(2700) : Promise.resolve();
if (story) goalReady = new Promise(done => {
  const win = $('.glass-term', story), steps = $$('.story-step', story), cue = $('.story-cue'), outro = $('.goal-outro');
  const hold = ms => new Promise(r => setTimeout(r, ms)); // reading time: kept even with reduced motion
  const top0 = () => scrollTo({ top: 0, behavior: 'instant' });
  document.body.classList.add('story-on');

  $$('[data-type]', story).forEach(prepType);
  const tap = $('.story-tap', story); // "กดตรงไหนก็ได้": a click anywhere on the window moves on (the hint itself is the keyboard's way)
  let cur = 0, ready = false, rush = false;
  const reveal = async (step, focus) => {
    step.classList.add('on');
    if (focus) step.focus({ preventScroll: true }); // keyboard and screen-reader users land on the new text
    rush = false;
    for (const el of $$('[data-type]', step)) await typeLine(el, story, () => rush);
    ready = true;
    if (step === steps[0]) return; // "ชอบเล่นเกม" moves on by itself
    tap.classList.add('show');
    // long text on a short screen: say there is more below until the hint at the foot is in view
    const seen = new IntersectionObserver(([e]) => { cue.hidden = e.isIntersecting; if (e.isIntersecting) seen.disconnect(); }, { threshold: 1 });
    seen.observe(tap);
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
  const advance = async at => {
    if (!ready) return;
    ready = false;
    tap.classList.remove('show');
    cue.hidden = true;
    if (cur === steps.length - 1) return finish();
    const from = steps[cur], to = steps[++cur];
    await shatter(win, () => { from.classList.remove('on'); to.classList.add('on'); top0(); }, at);
    reveal(to, true);
  };
  win.addEventListener('click', e => {
    if (!ready) { rush = true; return; } // still typing: show the whole text first
    advance(e.detail ? { x: e.clientX, y: e.clientY } : null); // keyboard (Enter on the hint): break from the middle
  });
  (async () => {
    await sleep(2600); // the intro circle is closing
    win.classList.add('on');
    await sleep(120);
    await reveal(steps[0]); // "ชอบเล่นเกม": in quick, out quick (or sooner, on a click)
    await hold(750);
    if (cur === 0) advance(null);
  })();
});

// ---- Goal headline: "$ cat goal.html/your_goal.txt" types at a readable pace, waits, erases and types again, forever
const goalCmd = $('.goal-typed');
if (goalCmd) {
  prepType(goalCmd);
  goalCmd.classList.add('cur');
  if (reduce) showTyped(goalCmd, goalCmd.chars.length);
  else (async () => {
    showTyped(goalCmd, 0);
    await goalReady; // starts as the page is uncovered
    for (;;) {
      await sleep(350);
      for (let n = 1; n <= goalCmd.chars.length; n++) { showTyped(goalCmd, n); await sleep(85); }
      await sleep(2600);
      for (let n = goalCmd.chars.length - 1; n >= 0; n--) { showTyped(goalCmd, n); await sleep(28); }
    }
  })();
}

// ---- Goal desktop: a dock of four apps (the statement of purpose and the story's three texts). A dock icon opens its
//      window (it grows out of the icon), brings it to the front, or, if it already is in front, sends it back down.
//      Each window: red closes it, yellow sends it to the dock, green (or a double click on the title bar) makes it wide;
//      its title bar drags it around on wide screens; Esc sends it to the dock. Its content starts the first time it opens.
const desk = $('.desk');
if (desk) {
  const wins = $$('.win', desk), dock = $('.dock', desk), hint = $('.dock-hint', dock), head = $('.desk-head', desk);
  const btnOf = w => $(`.dock-app[data-launch="${w.dataset.app}"]`, dock);
  const winOf = b => $(`.win[data-app="${b.dataset.launch}"]`, desk);
  const narrow = () => desk.clientWidth < 720;
  const DOCK = 128; // room kept free above the bottom of the desk for the dock
  const state = new Map(wins.map(w => [w, 'closed']));
  let zTop = 10;
  wins.forEach(w => { w.hidden = true; w.tabIndex = -1; });

  // where each window first opens: [0 = left … 1 = right, rows below the headline, width]
  const spots = { sop: [.5, 0, 1000], story: [.04, 30, 600], kmutt: [.96, 74, 600], cpe: [.5, 118, 600] };
  const topLine = () => head.offsetTop + head.offsetHeight + 14;
  const place = w => {
    const W = desk.clientWidth, [ax, dy, ww] = spots[w.dataset.app];
    const width = narrow() ? W - 20 : Math.min(ww, W - 48);
    const left = narrow() ? 10 : Math.round(24 + ax * (W - width - 48));
    // phones: full width, each new window a little lower so the title bars underneath stay visible
    const below = narrow() ? 30 * wins.filter(x => x !== w && !x.hidden).length : dy;
    Object.assign(w.style, { left: left + 'px', top: topLine() + below + 'px', width: width + 'px' });
    w.placed = true;
  };
  // the desk grows to hold its lowest open window above the dock
  const grow = () => {
    let need = 0;
    wins.forEach(w => { if (!w.hidden) need = Math.max(need, w.offsetTop + w.offsetHeight + DOCK); });
    desk.style.minHeight = need ? `max(100svh, ${need}px)` : '';
  };
  desk.grow = grow;
  const front = w => { w.style.zIndex = ++zTop; wins.forEach(x => x.classList.toggle('front', x === w)); };
  const sync = w => {
    const b = btnOf(w), s = state.get(w);
    b.classList.toggle('running', s !== 'closed');
    b.classList.toggle('min', s === 'min');
    b.setAttribute('aria-expanded', s === 'open');
  };
  // the window shrinks into / grows out of its dock icon
  const genie = (w, toDock) => {
    if (reduce) return Promise.resolve();
    const r = w.getBoundingClientRect(), i = $('.dock-icon', btnOf(w)).getBoundingClientRect();
    const t = `translate(${i.left + i.width / 2 - (r.left + r.width / 2)}px, ${i.top + i.height / 2 - (r.top + r.height / 2)}px) scale(${Math.max(.05, i.width / r.width)})`;
    const k = [{ transform: t, opacity: 0 }, { transform: 'none', opacity: 1 }];
    return w.animate(toDock ? k.reverse() : k, toDock ? { duration: 360, easing: 'cubic-bezier(.5,0,.75,0)' } : { duration: 460, easing: 'cubic-bezier(.2,.9,.3,1.06)' }).finished;
  };
  const open = async w => {
    if (w.busy) return;
    w.busy = true;
    const was = state.get(w), b = btnOf(w);
    w.hidden = false;
    if (!w.placed) place(w);
    front(w);
    state.set(w, 'open'); sync(w); grow();
    if (was === 'closed') { b.classList.remove('launch'); void b.offsetWidth; b.classList.add('launch'); }
    hint.classList.add('gone');
    w.focus({ preventScroll: true });
    await genie(w, false);
    w.busy = false;
    w.onOpen?.();
  };
  const minimize = async w => {
    if (w.busy || state.get(w) !== 'open') return;
    w.busy = true;
    state.set(w, 'min'); sync(w);
    await genie(w, true);
    w.hidden = true; w.busy = false; grow();
    btnOf(w).focus({ preventScroll: true });
  };
  const close = async w => {
    if (w.busy) return;
    w.busy = true;
    state.set(w, 'closed'); sync(w);
    if (!reduce) await w.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.92)' }], { duration: 220, easing: 'ease-in' }).finished;
    w.hidden = true; w.busy = false; grow();
    btnOf(w).focus({ preventScroll: true });
  };
  // wide <-> back to its own size; the change is animated as one transform (FLIP), so text is not re-laid out every frame
  const maximize = w => {
    const first = w.getBoundingClientRect();
    if (w.classList.toggle('max')) {
      w.before = { left: w.style.left, top: w.style.top, width: w.style.width };
      Object.assign(w.style, { left: '12px', top: topLine() + 'px', width: desk.clientWidth - 24 + 'px' });
    } else Object.assign(w.style, w.before || {});
    $('.tg-max', w).setAttribute('aria-label', w.classList.contains('max') ? 'คืนขนาดหน้าต่าง' : 'ขยายหน้าต่าง');
    grow(); front(w);
    const last = w.getBoundingClientRect();
    if (!reduce) w.animate([{ transformOrigin: '0 0', transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})` },
      { transformOrigin: '0 0', transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };

  wins.forEach(w => {
    const bar = $('.win-bar', w);
    $('.tg-close', w).addEventListener('click', e => { e.stopPropagation(); close(w); });
    $('.tg-min', w).addEventListener('click', e => { e.stopPropagation(); minimize(w); });
    $('.tg-max', w).addEventListener('click', e => { e.stopPropagation(); maximize(w); });
    w.addEventListener('pointerdown', () => { if (!w.classList.contains('front')) front(w); });
    w.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); minimize(w); } });
    bar.addEventListener('dblclick', e => { if (!e.target.closest('.tg-ctl')) maximize(w); });
    // drag by the title bar: the window follows as a transform, and its place is written once, when it is let go
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('.tg-ctl') || e.pointerType === 'touch' || e.button || narrow()) return;
      const sx = e.clientX, sy = e.clientY, x0 = w.offsetLeft, y0 = w.offsetTop, W = desk.clientWidth, ww = w.offsetWidth;
      let dx = 0, dy = 0, raf = 0;
      bar.setPointerCapture(e.pointerId);
      w.classList.add('dragging');
      const move = ev => {
        dx = Math.max(100 - x0 - ww, Math.min(W - 100 - x0, ev.clientX - sx)); // keep a part of it on the desk
        dy = Math.max(70 - y0, ev.clientY - sy);                                  // and its bar below the menu button
        raf ||= requestAnimationFrame(() => { raf = 0; w.style.transform = `translate(${dx}px, ${dy}px)`; });
      };
      const up = () => {
        bar.removeEventListener('pointermove', move);
        cancelAnimationFrame(raf);
        Object.assign(w.style, { transform: '', left: x0 + dx + 'px', top: y0 + dy + 'px' });
        w.classList.remove('dragging');
        if (dx || dy) w.classList.remove('max');
        grow();
      };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up, { once: true });
      bar.addEventListener('pointercancel', up, { once: true });
    });
  });

  $$('.dock-app', dock).forEach(b => b.addEventListener('click', () => {
    const w = winOf(b);
    if (state.get(w) !== 'open') open(w);
    else if (w.classList.contains('front')) minimize(w);
    else { front(w); w.focus({ preventScroll: true }); }
  }));
  // a narrower screen: windows that no longer fit are pulled back in
  addEventListener('resize', () => wins.forEach(w => {
    if (!w.placed) return;
    const W = desk.clientWidth;
    if (narrow()) Object.assign(w.style, { left: '10px', width: W - 20 + 'px' });
    else if (w.offsetLeft + w.offsetWidth > W - 10) w.style.left = Math.max(10, W - w.offsetWidth - 10) + 'px';
  }), { passive: true });

  // the dock magnifies the icons near the pointer (mouse only), like macOS; read on pointer moves, written once per frame
  if (finePointer && !reduce) {
    const shelf = $('ul', dock), apps = $$('.dock-app', dock);
    let px = null, raf = 0;
    const paint = () => {
      raf = 0;
      apps.forEach(b => {
        const r = b.getBoundingClientRect(), d = px === null ? 1e9 : Math.abs(px - (r.left + r.width / 2));
        const s = 1 + .4 * Math.max(0, 1 - d / 120);
        $('.dock-icon', b).style.transform = s > 1.001 ? `translateY(${-(s - 1) * 30}px) scale(${s})` : '';
      });
    };
    shelf.addEventListener('pointermove', e => { px = e.clientX; raf ||= requestAnimationFrame(paint); });
    shelf.addEventListener('pointerleave', () => { px = null; raf ||= requestAnimationFrame(paint); });
  }
  goalReady.then(() => setTimeout(() => dock.classList.add('in'), reduce ? 0 : 250));
}

// ---- Statement of purpose (a desktop window): one part at a time. The command types, then a part types in fast; once it
//      is done "กดเพื่อไปต่อ" fades in, and a click anywhere on the text breaks the glass quickly into the next part.
//      A click while it types shows the part at once; after the last part it starts again.
const sopWin = $('.sop');
if (sopWin) {
  const body = $('.sop-body', sopWin), steps = $$('.sop-step', body), tap = $('.win-tap', body), meta = $('.win-meta', sopWin), cmd = $('.cmd', body);
  $$('[data-type]', body).forEach(prepType);
  let k = 0, ready = false, rush = false, started = false;
  const label = () => { meta.textContent = `${k + 1} / ${steps.length}`; };
  const show = async () => {
    steps[k].classList.add('on'); label();
    rush = false;
    for (const el of $$('[data-type]', steps[k])) await typeLine(el, body, () => rush);
    ready = true;
    tap.textContent = k === steps.length - 1 ? 'กดเพื่ออ่านอีกครั้ง' : 'กดเพื่อไปต่อ';
    tap.classList.add('show');
  };
  sopWin.onOpen = async () => {
    if (started) return;
    started = true;
    label();
    await typeLine(cmd, body, () => rush);
    show();
  };
  body.addEventListener('click', async e => {
    if (!started) return;
    if (!ready) { rush = true; return; }
    ready = false;
    tap.classList.remove('show');
    await shatter(sopWin, () => {
      steps[k].classList.remove('on');
      k = (k + 1) % steps.length;
      $$('[data-type]', steps[k]).forEach(el => showTyped(el, 0));
      steps[k].classList.add('on'); label();
      $$('.cur', body).forEach(x => x.classList.remove('cur'));
      desk?.grow?.();
    }, e.detail ? { x: e.clientX, y: e.clientY } : null, .6);
    show();
  });
}

// ---- The story's three texts as desktop windows: they type in the first time they are opened (a click finishes it)
$$('.desk .glass-term').forEach(w => {
  const lines = $$('[data-type]', w);
  lines.forEach(prepType);
  let rush = false, started = false;
  $('.tg-body', w).addEventListener('click', () => { rush = true; });
  w.onOpen = async () => {
    if (started) return;
    started = true;
    for (const el of lines) await typeLine(el, w, () => rush);
  };
});
