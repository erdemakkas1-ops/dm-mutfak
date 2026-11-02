// Mutfağını tasarla: a kitchen layout in centimetres, worked out from the options.
// Base runs are 60 cm deep, wall cabinets 35 cm, the island keeps a 110 cm aisle from the counter
// and 100 cm from a side run. js/kitchen3d.js builds it in 3D once the section is near; until then,
// and on devices without WebGL2, the same layout is drawn as a top-down plan in the SVG.
// The spec list and the WhatsApp message are worked out from the same layout.
(() => {
  const DEPTH = 60, WALL_CAB = 35, AISLE = 110, ISLAND_D = 100, CLEAR = 100, OPEN = 30, WALL_T = 12;
  const COLORS = { grej: '#b9b0a5', krem: '#e6dccb', beyaz: '#f3f2ee', gri: '#7d8184', antrasit: '#34363a' };
  const NAMES = {
    tip: { duz: 'Düz', l: 'L', u: 'U' },
    kapak: { kulpsuz: 'Kulpsuz mat', klasik: 'Klasik çerçeveli' },
    renk: { grej: 'Grej', krem: 'Krem', beyaz: 'Beyaz', gri: 'Gri', antrasit: 'Antrasit' },
  };
  const INK = '#1c1b19', DIM = '#7a766f', TOP = '#ece8e1', GOLD = '#e0a43c', FLOOR = '#fbfaf8';
  const $ = id => document.getElementById(id);
  const form = $('plan-form'), svg = $('plan-svg'), spec = $('plan-spec'), send = $('plan-send');

  const read = () => {
    const f = new FormData(form);
    return { tip: f.get('tip'), a: +f.get('a'), b: +f.get('b'), c: +f.get('c'), ada: f.get('ada') === '1', kapak: f.get('kapak'), renk: f.get('renk'), led: f.get('led') === '1' };
  };

  // the plan in cm: runs along the walls, the tall fridge unit, sink, hob and the island if it fits
  function layout(o) {
    const L = o.tip !== 'duz', U = o.tip === 'u';
    const runs = [{ x: 0, y: 0, w: o.a, h: DEPTH, side: 'a' }];
    if (L) runs.push({ x: 0, y: DEPTH, w: DEPTH, h: o.b - DEPTH, side: 'b' });
    if (U) runs.push({ x: o.a - DEPTH, y: DEPTH, w: DEPTH, h: o.c - DEPTH, side: 'c' });
    // the fridge column closes the run that ends in the room
    const tall = o.tip === 'duz' ? { x: 0, y: 0 } : { x: 0, y: o.b - DEPTH };
    // island: centred in the free span, the 110 cm aisle in front of run A, 100 cm clear of a side run;
    // a side without a run is open to the room, so it only keeps a short margin
    let island = null, islandNote = '';
    if (o.ada) {
      const left = L ? DEPTH + CLEAR : OPEN, right = U ? DEPTH + CLEAR : OPEN;
      const x0 = left, x1 = o.a - right, span = x1 - x0;
      if (span >= 120) {
        const len = Math.min(300, Math.max(120, Math.round(o.a * .55 / 10) * 10), Math.floor(span / 10) * 10);
        island = { x: x0 + (span - len) / 2, y: DEPTH + AISLE, w: len, h: ISLAND_D };
      } else islandNote = `Ada için ana duvar en az ${left + right + 120} cm olmalı`;
    }
    const depthRoom = Math.max(L ? o.b : 0, U ? o.c : 0, island ? island.y + ISLAND_D + 90 : DEPTH + 200);
    // worktop length: every run, minus the corners counted twice and the fridge column
    const run = o.a + (L ? o.b - DEPTH : 0) + (U ? o.c - DEPTH : 0);
    const top = run - DEPTH;
    const sink = { x: (U ? o.a * .5 : o.a * .62) - 40, y: 8, w: 80, h: 44 };
    const hob = island ? { x: island.x + island.w / 2 - 30, y: island.y + 20, w: 60, h: 52 }
      : o.tip === 'duz' ? { x: Math.max(DEPTH + 30, o.a * .3) - 30, y: 4, w: 60, h: 52 }
      : U ? { x: o.a - DEPTH + 4, y: DEPTH + (o.c - DEPTH) / 2 - 30, w: 52, h: 60 }
      : { x: 4, y: DEPTH + (o.b - 2 * DEPTH) / 2 - 30, w: 52, h: 60 };
    return { L, U, runs, tall, island, islandNote, depthRoom, run, top, sink, hob };
  }

  function draw(o, p) {
    const f = n => (+n).toFixed(1);
    const W = o.a, D = p.depthRoom;
    const pad = 90, vx = -pad, vy = -pad, vw = W + pad * 2, vh = D + pad + 40;
    svg.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
    const fs = Math.max(vw, vh * 1.33) / 52;
    const front = COLORS[o.renk];
    let g = `<defs><pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${INK}" stroke-width="1.6"/></pattern>`
      + `<radialGradient id="glow"><stop offset="0" stop-color="${GOLD}" stop-opacity=".45"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient></defs>`;
    g += `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${FLOOR}"/>`;
    // walls: A always, B and C as the plan needs, the open sides as a thin line
    g += `<rect x="${-WALL_T}" y="${-WALL_T}" width="${W + 2 * WALL_T}" height="${WALL_T}" fill="url(#hatch)" stroke="${INK}" stroke-width="1.2"/>`;
    g += p.L ? `<rect x="${-WALL_T}" y="0" width="${WALL_T}" height="${o.b}" fill="url(#hatch)" stroke="${INK}" stroke-width="1.2"/>` : `<line x1="0" y1="0" x2="0" y2="${D}" stroke="${DIM}" stroke-width="1" stroke-dasharray="6 6"/>`;
    g += p.U ? `<rect x="${W}" y="0" width="${WALL_T}" height="${o.c}" fill="url(#hatch)" stroke="${INK}" stroke-width="1.2"/>` : `<line x1="${W}" y1="0" x2="${W}" y2="${D}" stroke="${DIM}" stroke-width="1" stroke-dasharray="6 6"/>`;

    // worktop runs, module joints, and the door colour as a thick front edge
    for (const r of p.runs) {
      g += `<rect x="${f(r.x)}" y="${f(r.y)}" width="${f(r.w)}" height="${f(r.h)}" fill="${TOP}" stroke="${INK}" stroke-width="1.4"/>`;
      const horiz = r.side === 'a', len = horiz ? r.w : r.h, n = Math.max(1, Math.round(len / 60));
      for (let i = 1; i < n; i++) {
        const t = len * i / n;
        g += horiz ? `<line x1="${f(r.x + t)}" y1="${DEPTH - 10}" x2="${f(r.x + t)}" y2="${DEPTH}" stroke="${INK}" stroke-width="1"/>`
          : `<line x1="${r.side === 'b' ? DEPTH - 10 : r.x}" y1="${f(r.y + t)}" x2="${r.side === 'b' ? DEPTH : r.x + 10}" y2="${f(r.y + t)}" stroke="${INK}" stroke-width="1"/>`;
      }
      g += horiz ? `<rect x="${f(r.x)}" y="${DEPTH - 3}" width="${f(r.w)}" height="6" fill="${front}" stroke="${INK}" stroke-width=".8"/>`
        : `<rect x="${r.side === 'b' ? DEPTH - 3 : r.x - 3}" y="${f(r.y)}" width="6" height="${f(r.h)}" fill="${front}" stroke="${INK}" stroke-width=".8"/>`;
    }
    // wall cabinets: dashed outline 35 cm from the wall, LED along their underside
    const wc = [`M0 ${WALL_CAB}H${W}`];
    if (p.L) wc.push(`M${WALL_CAB} ${DEPTH}V${o.b - DEPTH}`);
    if (p.U) wc.push(`M${W - WALL_CAB} ${DEPTH}V${o.c}`);
    g += `<path d="${wc.join('')}" fill="none" stroke="${o.led ? GOLD : DIM}" stroke-width="${o.led ? 3 : 1}" stroke-dasharray="${o.led ? '14 6' : '5 5'}"/>`;

    // fridge column in the door colour, marked with a cross like a tall unit on a drawing
    const t = p.tall;
    g += `<rect x="${t.x}" y="${t.y}" width="${DEPTH}" height="${DEPTH}" fill="${front}" stroke="${INK}" stroke-width="1.4"/><path d="M${t.x} ${t.y}l${DEPTH} ${DEPTH}M${t.x + DEPTH} ${t.y}l${-DEPTH} ${DEPTH}" stroke="${INK}" stroke-width=".8"/>`;
    // sink and hob
    const s = p.sink;
    g += `<rect x="${f(s.x)}" y="${s.y}" width="${s.w}" height="${s.h}" rx="5" fill="#fff" stroke="${INK}" stroke-width="1.2"/><rect x="${f(s.x + 6)}" y="${s.y + 6}" width="${s.w - 12}" height="${s.h - 12}" rx="4" fill="none" stroke="${INK}" stroke-width=".8"/><circle cx="${f(s.x + s.w / 2)}" cy="${s.y + s.h / 2}" r="3" fill="${INK}"/>`;
    const h = p.hob;
    g += `<rect x="${f(h.x)}" y="${f(h.y)}" width="${h.w}" height="${h.h}" rx="3" fill="${INK}"/>`;
    for (const [dx, dy, r] of [[.28, .3, 9], [.72, .3, 7], [.28, .72, 7], [.72, .72, 9]]) g += `<circle cx="${f(h.x + h.w * dx)}" cy="${f(h.y + h.h * dy)}" r="${r}" fill="none" stroke="#6d6a64" stroke-width="1.2"/>`;

    // island with its glow, waterfall ends, stools on the room side and the aisle dimension
    const il = p.island;
    if (il) {
      if (o.led) g += `<ellipse cx="${f(il.x + il.w / 2)}" cy="${f(il.y + il.h / 2)}" rx="${f(il.w * .75)}" ry="${f(il.h * 1.1)}" fill="url(#glow)"/>`;
      g += `<rect x="${f(il.x)}" y="${il.y}" width="${il.w}" height="${il.h}" fill="${TOP}" stroke="${INK}" stroke-width="1.4"/>`
        + `<rect x="${f(il.x + 4)}" y="${il.y + 4}" width="${il.w - 8}" height="56" fill="none" stroke="${INK}" stroke-width=".6" stroke-dasharray="4 4"/>`
        + `<rect x="${f(il.x)}" y="${il.y}" width="${il.w}" height="5" fill="${front}" stroke="${INK}" stroke-width=".6"/>`;
      const n = Math.max(1, Math.min(4, Math.floor(il.w / 60)));
      for (let i = 0; i < n; i++) g += `<circle cx="${f(il.x + il.w * (i + .5) / n)}" cy="${il.y + il.h + 24}" r="17" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
      const ax = il.x + il.w + 26;
      g += dim(ax, DEPTH, ax, il.y, `${AISLE}`, true, 'geçiş');
      g += dim(il.x, il.y + il.h + 58, il.x + il.w, il.y + il.h + 58, `${il.w} × ${ISLAND_D}`);
    }
    // dimensions
    g += dim(0, -48, W, -48, `${W}`, false, 'A');
    if (p.L) g += dim(-48, 0, -48, o.b, `${o.b}`, true, 'B');
    if (p.U) g += dim(W + 48, 0, W + 48, o.c, `${o.c}`, true, 'C');
    if (p.islandNote) g += `<text x="${W / 2}" y="${D - 20}" text-anchor="middle" font-size="${f(fs * .9)}" font-family="JetBrains Mono, ui-monospace, monospace" fill="#a23d22">${p.islandNote}</text>`;
    svg.innerHTML = g;

    // a dimension line with ticks and the figure on a paper patch
    function dim(x1, y1, x2, y2, label, vert, tag) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, k = 7;
      let s = `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${INK}" stroke-width="1"/>`;
      for (const [x, y] of [[x1, y1], [x2, y2]]) s += `<line x1="${f(x - k)}" y1="${f(y + k)}" x2="${f(x + k)}" y2="${f(y - k)}" stroke="${INK}" stroke-width="1.6"/>`;
      const text = tag ? `${tag} ${label}` : label, w = text.length * fs * .62 + 12;
      s += `<g${vert ? ` transform="rotate(-90 ${f(mx)} ${f(my)})"` : ''}><rect x="${f(mx - w / 2)}" y="${f(my - fs * .8)}" width="${f(w)}" height="${f(fs * 1.6)}" fill="${FLOOR}"/>`
        + `<text x="${f(mx)}" y="${f(my + fs * .36)}" text-anchor="middle" font-size="${f(fs)}" font-family="JetBrains Mono, ui-monospace, monospace" fill="${INK}">${text}</text></g>`;
      return s;
    }
  }

  const m = cm => (cm / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m';

  function describe(o, p) {
    const rows = [
      ['Plan', `${NAMES.tip[o.tip]} mutfak · A ${o.a}${p.L ? ` · B ${o.b}` : ''}${p.U ? ` · C ${o.c}` : ''} cm`],
      ['Tezgah', m(p.top + (p.island ? p.island.w : 0)) + (p.island ? ` (ada ${m(p.island.w)} dahil)` : '')],
      ['Alt modül', `${Math.round(p.top / 60)} adet, yaklaşık 60 cm`],
      ['Üst dolap', m(p.top)],
      ['Boy dolap', 'Buzdolabı kolonu, 60 cm'],
      ['Ada', p.island ? `${p.island.w} × ${ISLAND_D} cm, ${AISLE} cm geçiş` : (o.ada ? 'Bu ölçüde sığmıyor' : 'Yok')],
      ['Kapak', `${NAMES.kapak[o.kapak]}, ${NAMES.renk[o.renk].toLocaleLowerCase('tr')}`],
      ['Gizli LED', o.led ? 'Dolap altı ve ada altı' : 'Yok'],
    ];
    spec.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    const msg = ['Merhaba D&M, sitenizde tasarladığım mutfak için teklif almak istiyorum.', ...rows.map(([k, v]) => `${k}: ${v}`), 'Kesin ölçüyü yerinde alalım.'].join('\n');
    send.href = `https://wa.me/905335449880?text=${encodeURIComponent(msg)}`;
    $('plan-cap').textContent = `${view3d ? '3D görünüm' : 'Üstten plan'} · ${NAMES.tip[o.tip]} mutfak${p.island ? ', adalı' : ''}, ${NAMES.kapak[o.kapak].toLocaleLowerCase('tr')} ${NAMES.renk[o.renk].toLocaleLowerCase('tr')} kapak`;
    for (const k of ['a', 'b', 'c']) $('o-' + k).textContent = `${o[k]} cm`;
    $('row-b').hidden = !p.L; $('row-c').hidden = !p.U;
    // board
    const door = $('sw-door');
    door.className = `sw door ${o.kapak}`;
    door.style.setProperty('--front', COLORS[o.renk]);
    door.style.background = '#dcd8d1';
    $('v-door').textContent = `${NAMES.kapak[o.kapak]} · ${NAMES.renk[o.renk]}`;
    $('sw-top').style.background = 'linear-gradient(115deg,transparent 0 38%,rgba(120,112,100,.28) 40%,transparent 44% 64%,rgba(120,112,100,.18) 66%,transparent 70%),#ece8e1';
    $('v-top').textContent = 'Mermer desenli tezgah';
    $('sw-led').style.background = o.led ? 'radial-gradient(120% 70% at 50% 0%,#ffe2b0 0,#f2a85a 20%,rgba(140,80,30,.55) 48%,#1d1a16 82%)' : 'linear-gradient(#2a2622,#1d1a16)';
    $('v-led').textContent = o.led ? 'Gizli LED · 2700 K' : 'LED yok';
  }

  let view3d = null;
  function update() {
    const o = read(), p = layout(o);
    if (view3d) view3d.update(o, p); else draw(o, p);
    describe(o, p);
  }
  form.addEventListener('input', update);
  form.addEventListener('submit', e => e.preventDefault());
  update();

  // 3D: load three.js when the section is about 600 px away, if the device has WebGL2
  const sheet = svg.closest('.sheet');
  const hasGL = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();
  if (hasGL) {
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      import('./kitchen3d.js').then(m => {
        sheet.classList.add('is3d');
        view3d = m.mount(sheet);
        update();
      }).catch(err => { sheet.classList.remove('is3d'); console.warn('3D view unavailable, showing the plan', err); });
    }, { rootMargin: '600px 0px' });
    io.observe(sheet);
  }
})();
