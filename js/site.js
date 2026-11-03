// D&M Mutfak: header and menu, the scroll film, project filters, day/evening compare, contact form
// (the js and live-film classes on <html> are set by the inline script in the head)
(() => {
  const WA = '905335449880';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // header: solid once past the film; mobile menu
  const top = $('#top'), film = $('#film'), quick = $('#quick');
  const btn = $('.menu-btn'), nav = $('#nav');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', open); nav.classList.toggle('open', open);
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) { btn.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); } });
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { btn.click(); btn.focus(); } });
  const onScroll = () => {
    const filmEnd = film.offsetTop + film.offsetHeight - innerHeight;
    top.classList.toggle('solid', scrollY > filmEnd - 10 || nav.classList.contains('open'));
    const ct = $('#iletisim').getBoundingClientRect();
    // the film has its own call to action (until its last frame has scrolled half away), and the contact section its own buttons
    quick.classList.toggle('hide', scrollY < filmEnd + innerHeight * .5 || (ct.top < innerHeight * .6 && ct.bottom > 0));
  };
  addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', onScroll);
  onScroll();

  // reveals
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$('.rv, .card').forEach(el => io.observe(el));

  // projects: filter by kind
  const fbtns = $$('.filters button'), cards = $$('#proj-grid .card');
  fbtns.forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.f;
    fbtns.forEach(o => o.setAttribute('aria-pressed', o === b));
    cards.forEach(c => { c.hidden = k !== 'hepsi' && c.dataset.k !== k; if (!c.hidden) c.classList.add('in'); });
  }));

  // day / evening: the range input sets where the evening picture starts
  const cmp = $('#compare'), cut = $('#cmp');
  const setCut = () => cmp.style.setProperty('--cut', cut.value + '%');
  cut.addEventListener('input', setCut); setCut();

  // contact form → WhatsApp message (no server)
  const form = $('#ct-form'), send = $('#ct-send'), err = $('#ct-err');
  function contactMessage() {
    const f = new FormData(form);
    const needs = f.getAll('need');
    return ['Merhaba D&M, ölçü randevusu için yazıyorum.',
      `Ad: ${f.get('name').trim()}`, `Telefon: ${f.get('tel').trim()}`,
      f.get('where').trim() && `Yer: ${f.get('where').trim()}`,
      needs.length && `İş: ${needs.join(', ')}`,
      f.get('note').trim() && `Not: ${f.get('note').trim()}`].filter(Boolean).join('\n');
  }
  const syncContact = () => { send.href = `https://wa.me/${WA}?text=${encodeURIComponent(contactMessage())}`; };
  form.addEventListener('input', syncContact); form.addEventListener('change', syncContact); syncContact();
  send.addEventListener('click', e => {
    const bad = ['#ct-name', '#ct-tel'].map(s => $(s)).filter(i => !i.value.trim() || (i.type === 'tel' && i.value.replace(/\D/g, '').length < 10));
    $$('#ct-name,#ct-tel').forEach(i => i.removeAttribute('aria-invalid'));
    if (bad.length) {
      e.preventDefault();
      bad.forEach(i => i.setAttribute('aria-invalid', 'true'));
      err.textContent = bad[0].id === 'ct-name' ? 'Adınızı yazın, size nasıl hitap edeceğimizi bilelim.' : 'Telefon numaranızı alan koduyla yazın (en az 10 rakam).';
      bad[0].focus();
    } else err.textContent = '';
  });
  form.addEventListener('submit', e => e.preventDefault());

  // film: scroll position → film time 0–12 s → which keyframe shows and how far the wipe has run
  (() => {
    if (!document.documentElement.classList.contains('live-film')) return;
    const T_END = 12;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };
    const stage = $('.stage', film), frames = $('.frames', film), seam = $('.seam', film);
    const f2 = $('.fr-2 img', film), f3 = $('.fr-3 img', film), f4 = $('.fr-4 img', film);
    // decode the later frames up front, so the first cross-fade or wipe never waits for a picture
    [f2, f3, f4].forEach(img => img.decode?.().catch(() => {}));
    const intro = $('.intro', film), introShade = $('.scrim-intro', film), chaps = $$('.chap', film), endEl = $('.end', film), rail = $('.rail', film), railBtns = $$('button', rail);
    const pt = s => s && s.split(',').map(Number);
    const tags = $$('.tag', film).map(el => ({ el, d: pt(el.dataset.d), m: pt(el.dataset.m), from: +el.dataset.from, to: +el.dataset.to }));
    // the same query as the <source> elements, so tags follow the picture that is actually shown
    const portrait = matchMedia('(max-aspect-ratio:4/5)');
    let W = 1, H = 1;

    function apply(t) {
      const k2 = smooth(2.2, 3.6, t), w = smooth(4.9, 7.5, t), k4 = smooth(8.4, 10, t);
      f2.style.opacity = k2; f4.style.opacity = k4;
      // the finished kitchen is revealed from left to right behind the gold line
      f3.style.clipPath = `inset(0 ${((1 - w) * 100).toFixed(2)}% 0 0)`;
      seam.style.left = (w * 100) + '%'; seam.style.opacity = w > 0 && w < 1 ? 1 : 0;
      const s = 1.06 - .06 * t / T_END;
      frames.style.transform = `scale(${s.toFixed(4)})`;
      intro.classList.toggle('off', t > .35); introShade.classList.toggle('off', t > .35);
      chaps.forEach(c => c.classList.toggle('on', t >= +c.dataset.from && t < +c.dataset.to));
      endEl.classList.toggle('on', t > 11.05);
      rail.classList.toggle('off', t > 11.05);
      const ci = t < 2.35 ? 0 : t < 4.85 ? 1 : t < 8.3 ? 2 : 3;
      railBtns.forEach((b, i) => { b.classList.toggle('on', i === ci); b.setAttribute('aria-current', i === ci ? 'step' : 'false'); });
      // tags sit on points of the image: map them through object-fit: cover and the push-in scale
      const ia = portrait.matches ? 9 / 16 : 16 / 9;
      const rw = W / H > ia ? W : H * ia, rh = rw / ia, ox = (W - rw) / 2, oy = (H - rh) / 2;
      for (const g of tags) {
        const p = portrait.matches ? g.m : g.d;
        const on = !!p && t >= g.from && t < g.to;
        g.el.classList.toggle('on', on);
        if (!on) continue;
        const x = W * .5 + (ox + p[0] * rw - W * .5) * s, y = H * .55 + (oy + p[1] * rh - H * .55) * s;
        const flip = x > W * .6;
        g.el.classList.toggle('flip', flip);
        const left = clamp(x + (flip ? -g.el.offsetWidth + 5 : -5), 8, W - g.el.offsetWidth - 8);
        g.el.style.transform = `translate3d(${left.toFixed(1)}px,${(y - g.el.offsetHeight / 2).toFixed(1)}px,0)`;
      }
    }

    // ease towards the scroll target so wheel steps glide; stop when settled
    let target = 0, cur = 0, raf = 0, last = 0;
    function tick(now) {
      const dt = Math.min(.1, (now - (last || now - 16)) / 1000); last = now;
      cur += (target - cur) * Math.min(1, dt * 10);
      if (Math.abs(target - cur) < .002) cur = target;
      apply(cur);
      raf = cur === target ? 0 : requestAnimationFrame(tick);
      if (!raf) last = 0;
    }
    function read() {
      const r = film.getBoundingClientRect();
      target = clamp(-r.top / Math.max(1, r.height - innerHeight)) * T_END;
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function size() { W = stage.clientWidth; H = stage.clientHeight; apply(cur); }
    addEventListener('scroll', read, { passive: true });
    addEventListener('resize', () => { size(); read(); });
    railBtns.forEach(b => b.addEventListener('click', () => {
      scrollTo({ top: film.offsetTop + (+b.dataset.go / T_END) * (film.offsetHeight - innerHeight), behavior: 'smooth' });
    }));
    size(); read(); cur = target; apply(cur);
    // for screenshots and checks: __film.seek(t) jumps to a film second
    window.__film = { seek: t => scrollTo(0, film.offsetTop + t / T_END * (film.offsetHeight - innerHeight)) };
  })();
})();
