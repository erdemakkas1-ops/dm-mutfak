// Mutfağını tasarla, 3D: the kitchen from js/plan.js's layout, built in three.js in metres.
// x runs along wall A, z goes from wall A into the room, y is up. Base units stand on a 10 cm plinth,
// 72 cm carcass, 4 cm worktop (86 cm in all); wall units hang from 145 cm, 72 cm tall, 35 cm deep.
// It renders on demand: after a change, a drag or a resize. Drag sideways (or arrow keys) to turn it;
// on touch screens a vertical swipe still scrolls the page.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const PLINTH = .1, CARCASS = .72, TOP = .04, BASE_H = PLINTH + CARCASS + TOP;
const WALL_Y = 1.45, WALL_H = .72, WALL_D = .35, TALL_H = WALL_Y + WALL_H, ROOM_H = 2.6;
const GAP = .003, FRONT_T = .019;
const COLORS = { grej: '#b9b0a5', krem: '#e6dccb', beyaz: '#f3f2ee', gri: '#7d8184', antrasit: '#34363a' };

export function mount(box) {
  const canvas = box.querySelector('canvas');
  const tagLayer = box.querySelector('.k3d-tags');
  const phone = matchMedia('(max-width:760px)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone ? 1.25 : 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9e7e2');
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .4;
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 60);

  // ---- textures drawn once on canvases: marble worktop, oak floor ----
  const canvasTex = (w, h, draw, rep) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (rep) t.repeat.set(...rep);
    return t;
  };
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const marble = canvasTex(512, 512, (k, w, h) => {
    k.fillStyle = '#f1eee9'; k.fillRect(0, 0, w, h);
    for (let v = 0; v < 16; v++) {
      k.strokeStyle = `rgba(125,118,110,${.06 + rnd() * .2})`; k.lineWidth = .6 + rnd() * 2;
      k.beginPath(); let x = rnd() * w, y = 0; k.moveTo(x, y);
      while (y < h) { x += (rnd() - .45) * 70; y += 18 + rnd() * 40; k.lineTo(x, y); }
      k.stroke();
    }
  });
  const oak = canvasTex(512, 512, (k, w, h) => {
    // 8 planks across, warm light oak with grain streaks
    for (let i = 0; i < 8; i++) {
      const l = 66 + rnd() * 7;
      k.fillStyle = `hsl(33, 24%, ${l}%)`; k.fillRect(0, i * h / 8, w, h / 8);
      for (let g = 0; g < 40; g++) {
        k.strokeStyle = `rgba(110,75,40,${.04 + rnd() * .08})`; k.lineWidth = .5 + rnd();
        const y = i * h / 8 + rnd() * h / 8; k.beginPath(); k.moveTo(0, y); k.bezierCurveTo(w * .3, y + rnd() * 4 - 2, w * .6, y + rnd() * 4 - 2, w, y); k.stroke();
      }
      k.fillStyle = 'rgba(60,40,20,.35)'; k.fillRect(0, i * h / 8, w, 1.2);
      k.fillRect(rnd() * w, i * h / 8, 1.2, h / 8);
    }
  }, [3, 3]);

  // ---- materials ----
  const M = {
    front: new THREE.MeshStandardMaterial({ roughness: .62 }),
    carcass: new THREE.MeshStandardMaterial({ color: '#efede8', roughness: .8 }),
    top: new THREE.MeshPhysicalMaterial({ map: marble, roughness: .25, clearcoat: .35, clearcoatRoughness: .25 }),
    plinth: new THREE.MeshStandardMaterial({ color: '#2b2926', roughness: .7 }),
    wall: new THREE.MeshStandardMaterial({ color: '#ebe8e2', roughness: .95 }),
    splash: new THREE.MeshPhysicalMaterial({ map: marble, roughness: .3, clearcoat: .3 }),
    black: new THREE.MeshStandardMaterial({ color: '#151515', roughness: .35, metalness: .2 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#d9d3c7', roughness: .05, transparent: true, opacity: .25, depthWrite: false }),
    walnut: new THREE.MeshStandardMaterial({ color: '#6e4c33', roughness: .7 }),
    groove: new THREE.MeshStandardMaterial({ color: '#2a2927', roughness: .6 }),
    knob: new THREE.MeshStandardMaterial({ color: '#b9a37a', roughness: .3, metalness: .9 }),
    led: new THREE.MeshBasicMaterial({ color: '#ffd29a' }),
    seat: new THREE.MeshStandardMaterial({ color: '#1b1b1b', roughness: .55 }),
  };

  // ---- fixed set: floor, daylight, sky fill ----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ map: oak, roughness: .7 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9a68f', .55));
  const sun = new THREE.DirectionalLight('#fff6ea', 1.25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(phone ? 1024 : 2048, phone ? 1024 : 2048);
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
  scene.add(sun, sun.target);

  let group = null, tags = [], lastTip = null, AZ = [-1.2, 1.2];
  const view = { az: -.55, el: .5, dist: 6, target: new THREE.Vector3() };

  const geoCache = new Map();
  const geo = (w, h, d, r = 0) => {
    const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r}`;
    if (!geoCache.has(key)) geoCache.set(key, r ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d));
    return geoCache.get(key);
  };
  // a box by its min corner and size, so plan coordinates (cm) map straight onto it
  function block(mat, x, y, z, w, h, d, r = 0, shadow = true) {
    const m = new THREE.Mesh(geo(w, h, d, r), mat);
    m.position.set(x + w / 2, y + h / 2, z + d / 2);
    m.castShadow = shadow; m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // a door or drawer front facing +z, -x or +x; klasik gets a raised inner panel and a knob
  function front(o, face, u0, u1, y0, y1, plane, knobAt = 'top') {
    const w = u1 - u0 - 2 * GAP, h = y1 - y0 - 2 * GAP, cy = y0 + GAP;
    const parts = [[w, h, FRONT_T, 0, 0, 0, M.front]];
    if (o.kapak === 'klasik') {
      const m = Math.min(.07, w * .16);
      parts.push([w - 2 * m, h - 2 * m, .008, m, m, FRONT_T, M.front]);
      const ky = knobAt === 'top' ? h - .06 : .06;
      parts.push([.025, .025, .025, w / 2 - .0125, ky - .0125, FRONT_T + .004, M.knob]);
    }
    for (const [pw, ph, pt, du, dy, dt, mat] of parts) {
      if (face === 'z') block(mat, u0 + GAP + du, cy + dy, plane + dt, pw, ph, pt, .003);
      else if (face === '-x') block(mat, plane - pt - dt, cy + dy, u0 + GAP + du, pt, ph, pw, .003);
      else block(mat, plane + dt, cy + dy, u0 + GAP + du, pt, ph, pw, .003);
    }
  }
  // a run of base fronts between u0 and u1 (metres), one drawer stack per ~60 cm
  function baseFronts(o, face, u0, u1, plane) {
    const n = Math.max(1, Math.round((u1 - u0) / .6));
    for (let i = 0; i < n; i++) {
      const a = u0 + (u1 - u0) * i / n, b = u0 + (u1 - u0) * (i + 1) / n;
      // two drawers on even modules, a door on odd ones, like most of their kitchens
      if (i % 2 === 0) { front(o, face, a, b, PLINTH, PLINTH + .36, plane); front(o, face, a, b, PLINTH + .36, PLINTH + CARCASS - (o.kapak === 'kulpsuz' ? .03 : 0), plane); }
      else front(o, face, a, b, PLINTH, PLINTH + CARCASS - (o.kapak === 'kulpsuz' ? .03 : 0), plane);
    }
    // the handle-less grip groove under the worktop
    if (o.kapak === 'kulpsuz') {
      if (face === 'z') block(M.groove, u0, PLINTH + CARCASS - .03, plane - .01, u1 - u0, .03, .012, 0, false);
      else if (face === '-x') block(M.groove, plane - .002, PLINTH + CARCASS - .03, u0, .012, .03, u1 - u0, 0, false);
      else block(M.groove, plane - .01, PLINTH + CARCASS - .03, u0, .012, .03, u1 - u0, 0, false);
    }
  }
  function wallFronts(o, face, u0, u1, plane, glassIndex = -1) {
    const n = Math.max(1, Math.round((u1 - u0) / .6));
    for (let i = 0; i < n; i++) {
      const a = u0 + (u1 - u0) * i / n, b = u0 + (u1 - u0) * (i + 1) / n;
      if (i === glassIndex && face === 'z') {
        // the glass display cabinet with walnut shelves, as in the film
        block(M.walnut, a + .02, WALL_Y + .02, .02, b - a - .04, WALL_H - .04, .01, 0, false);
        for (const s of [.24, .48]) block(M.walnut, a + .02, WALL_Y + s, .02, b - a - .04, .015, WALL_D - .04, 0, false);
        block(M.front, a + GAP, WALL_Y + GAP, plane, b - a - 2 * GAP, WALL_H - 2 * GAP, .004, 0, false);
        block(M.glass, a + .03, WALL_Y + .03, plane + .005, b - a - .06, WALL_H - .06, .004, 0, false);
        continue;
      }
      front(o, face, a, b, WALL_Y, WALL_Y + WALL_H, plane, 'bottom');
    }
  }

  function build(o, p) {
    if (group) scene.remove(group);
    group = new THREE.Group(); scene.add(group);
    M.front.color.set(COLORS[o.renk]);
    M.front.roughness = o.kapak === 'klasik' ? .45 : .7;
    const cm = v => v / 100, A = cm(o.a), B = cm(o.b), C = cm(o.c), D = .6;
    const L = p.L, U = p.U, duz = o.tip === 'duz';
    const t = { x: cm(p.tall.x), z: cm(p.tall.y) };
    const roomD = Math.max(cm(p.depthRoom), 3);

    // walls: A always; B and C when the plan has them, each a little longer than its run
    block(M.wall, -.1, 0, -.1, A + .2, ROOM_H, .1);
    if (L) block(M.wall, -.1, 0, 0, .1, ROOM_H, Math.max(B, 1.2) + .3);
    if (U) block(M.wall, A, 0, 0, .1, ROOM_H, Math.max(C, 1.2) + .3);

    // run A: carcass, worktop, fronts and the marble splash behind it
    const a0 = duz ? D : 0, a1 = A;
    block(M.plinth, a0, 0, .05, a1 - a0, PLINTH, D - .1);
    block(M.carcass, a0, PLINTH, 0, a1 - a0, CARCASS, D - .02);
    block(M.top, a0, PLINTH + CARCASS, 0, a1 - a0, TOP, D + .02, .004);
    block(M.splash, a0, BASE_H, 0, a1 - a0, WALL_Y - BASE_H, .015, 0, false);
    baseFronts(o, 'z', duz ? D : L ? D : 0, U ? A - D : A, D - .02);
    // run B along the left wall, run C along the right
    if (L) {
      const z1 = B - D;
      block(M.plinth, .05, 0, D, D - .1, PLINTH, z1 - D);
      block(M.carcass, 0, PLINTH, D, D - .02, CARCASS, z1 - D);
      block(M.top, 0, PLINTH + CARCASS, D, D + .02, TOP, z1 - D, .004);
      block(M.splash, 0, BASE_H, D, .015, WALL_Y - BASE_H, z1 - D, 0, false);
      if (z1 - D > .2) baseFronts(o, '+x', D, z1, D - .02);
    }
    if (U) {
      block(M.plinth, A - D + .05, 0, D, D - .1, PLINTH, C - D);
      block(M.carcass, A - D + .02, PLINTH, D, D - .02, CARCASS, C - D);
      block(M.top, A - D - .02, PLINTH + CARCASS, D, D + .02, TOP, C - D, .004);
      block(M.splash, A - .015, BASE_H, D, .015, WALL_Y - BASE_H, C - D, 0, false);
      baseFronts(o, '-x', D, C, A - D + .02);
    }

    // wall units; a cooker hood instead of them over a hob on the wall
    const hobOnWall = !p.island;
    const hob = { x: cm(p.hob.x), z: cm(p.hob.y), w: cm(p.hob.w), d: cm(p.hob.h) };
    const wa0 = duz ? D : L ? WALL_D : 0, wa1 = U ? A - WALL_D : A;
    block(M.carcass, wa0, WALL_Y, 0, wa1 - wa0, WALL_H, WALL_D - .02);
    wallFronts(o, 'z', wa0, wa1, WALL_D - .02, 1);
    if (L && B - D > WALL_D + .3) { block(M.carcass, 0, WALL_Y, WALL_D, WALL_D - .02, WALL_H, B - D - WALL_D); wallFronts(o, '+x', WALL_D, B - D, WALL_D - .02); }
    if (U) { block(M.carcass, A - WALL_D + .02, WALL_Y, WALL_D, WALL_D - .02, WALL_H, C - WALL_D); wallFronts(o, '-x', WALL_D, C, A - WALL_D + .02); }
    if (hobOnWall) {
      // a slim black hood hung under the wall units, centred on the hob
      const hx = hob.x + hob.w / 2, hz = hob.z + hob.d / 2;
      if (hob.z < .1) block(M.black, hx - .3, WALL_Y - .06, 0, .6, .06, .45);
      else block(M.black, hob.x < 1 ? 0 : A - .45, WALL_Y - .06, hz - .3, .45, .06, .6);
    }

    // the fridge column in the door colour, with two doors
    block(M.carcass, t.x, 0, t.z, D, TALL_H, D - .02);
    if (duz) { front(o, 'z', 0, D, PLINTH, 1.1, D - .02); front(o, 'z', 0, D, 1.1, TALL_H, D - .02, 'bottom'); }
    else { front(o, '+x', t.z, t.z + D, PLINTH, 1.1, D - .02); front(o, '+x', t.z, t.z + D, 1.1, TALL_H, D - .02, 'bottom'); }
    block(M.plinth, duz ? 0 : .05, 0, duz ? .05 : t.z, duz ? D : D - .1, PLINTH, duz ? D - .1 : D);

    // sink: a dark basin set into the worktop, and a black tap behind it
    const s = { x: cm(p.sink.x), w: cm(p.sink.w) };
    block(M.black, s.x + .04, BASE_H - .005, .1, s.w - .08, .006, .38, 0, false);
    const tap = new THREE.Mesh(new THREE.CylinderGeometry(.012, .014, .32, 12), M.black);
    tap.position.set(s.x + s.w / 2, BASE_H + .16, .06); tap.castShadow = true; group.add(tap);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .2, 12), M.black);
    spout.rotation.x = Math.PI / 2; spout.position.set(s.x + s.w / 2, BASE_H + .31, .15); group.add(spout);

    // the island: fronts towards the kitchen, overhang and stools towards the room, waterfall ends
    let il = null;
    if (p.island) {
      il = { x: cm(p.island.x), z: cm(p.island.y), w: cm(p.island.w), d: cm(p.island.h) };
      const cab = .6;
      block(M.plinth, il.x + .05, 0, il.z + .05, il.w - .1, PLINTH, cab - .1);
      block(M.carcass, il.x + .02, PLINTH, il.z + .02, il.w - .04, CARCASS, cab - .02);
      block(M.top, il.x, PLINTH + CARCASS, il.z, il.w, TOP, il.d, .004);
      for (const ex of [il.x, il.x + il.w - .04]) block(M.top, ex, 0, il.z, .04, BASE_H, il.d, .004);
      // back panel under the overhang, in the door colour
      block(M.front, il.x + .04, 0, il.z + cab, il.w - .08, PLINTH + CARCASS, .02);
      // fronts face the wall run: mirror the +z helper by building them on the island's near face
      const n = Math.max(1, Math.round((il.w - .08) / .6));
      for (let i = 0; i < n; i++) {
        const a = il.x + .04 + (il.w - .08) * i / n, b = il.x + .04 + (il.w - .08) * (i + 1) / n;
        const yTop = PLINTH + CARCASS - (o.kapak === 'kulpsuz' ? .03 : 0);
        for (const [y0, y1] of [[PLINTH, PLINTH + .36], [PLINTH + .36, yTop]]) {
          block(M.front, a + GAP, y0 + GAP, il.z - FRONT_T + .02, b - a - 2 * GAP, y1 - y0 - 2 * GAP, FRONT_T, .003);
          if (o.kapak === 'klasik') {
            const m = Math.min(.07, (b - a) * .16);
            block(M.front, a + GAP + m, y0 + GAP + m, il.z - FRONT_T - .008 + .02, b - a - 2 * GAP - 2 * m, y1 - y0 - 2 * GAP - 2 * m, .008, .003);
            block(M.knob, (a + b) / 2 - .0125, y1 - .07, il.z - FRONT_T - .03 + .02, .025, .025, .025, .003);
          }
        }
      }
      if (o.kapak === 'kulpsuz') block(M.groove, il.x + .04, PLINTH + CARCASS - .03, il.z + .01, il.w - .08, .03, .012, 0, false);
      // stools under the overhang
      const nStools = Math.max(1, Math.min(4, Math.floor(il.w / .6)));
      for (let i = 0; i < nStools; i++) {
        const sx = il.x + il.w * (i + .5) / nStools, sz = il.z + il.d + .12;
        const seat = new THREE.Mesh(new THREE.CylinderGeometry(.19, .17, .06, 28), M.seat);
        seat.position.set(sx, .66, sz); seat.castShadow = true; group.add(seat);
        for (const [dx, dz] of [[-.12, -.12], [.12, -.12], [-.12, .12], [.12, .12]]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(.01, .012, .64, 8), M.seat);
          leg.position.set(sx + dx * .9, .32, sz + dz * .9); leg.rotation.set(dz * .5, 0, -dx * .5); leg.castShadow = true; group.add(leg);
        }
      }
    }
    // the hob, on the island or on a wall run
    const hobY = BASE_H + .001;
    block(M.black, hob.x, hobY, hob.z, hob.w, .008, hob.d, .002, false);

    // hidden LED: glowing strips under the wall units and the island overhang, warm point lights over the worktop
    if (o.led) {
      const glow = (x, z, w, d, y) => block(M.led, x, y, z, w, .008, d, 0, false);
      glow(wa0 + .02, WALL_D - .08, wa1 - wa0 - .04, .03, WALL_Y - .01);
      if (L && B - D > WALL_D + .3) glow(WALL_D - .08, WALL_D + .02, .03, B - D - WALL_D - .04, WALL_Y - .01);
      if (U) glow(A - WALL_D + .05, WALL_D + .02, .03, C - WALL_D - .04, WALL_Y - .01);
      const warm = (x, y, z, k = .9) => { const l = new THREE.PointLight('#ffb866', k, 1.6, 2); l.position.set(x, y, z); group.add(l); };
      const nA = Math.max(1, Math.round((wa1 - wa0) / 1.2));
      for (let i = 0; i < nA; i++) warm(wa0 + (wa1 - wa0) * (i + .5) / nA, WALL_Y - .06, .22);
      if (L && B - D > 1) warm(.22, WALL_Y - .06, (WALL_D + B - D) / 2);
      if (U) warm(A - .22, WALL_Y - .06, (WALL_D + C) / 2);
      if (il) { glow(il.x + .05, il.z + il.d - .05, il.w - .1, .02, PLINTH + CARCASS - .01); warm(il.x + il.w / 2, .45, il.z + il.d + .15, 1.4); }
    }

    // dimension tags in the room: walls along their top edge, the island over its top
    tags = [[`A · ${o.a} cm`, new THREE.Vector3(A / 2, ROOM_H + .08, -.05)]];
    if (L) tags.push([`B · ${o.b} cm`, new THREE.Vector3(-.05, ROOM_H + .08, B / 2)]);
    if (U) tags.push([`C · ${o.c} cm`, new THREE.Vector3(A + .05, ROOM_H + .08, C / 2)]);
    if (il) tags.push([`Ada · ${p.island.w} × ${p.island.h} cm`, new THREE.Vector3(il.x + il.w / 2, BASE_H + .12, il.z + il.d / 2)]);
    tagLayer.innerHTML = tags.map(([text]) => `<span>${text}</span>`).join('');

    // frame the kitchen: aim at its middle, back off far enough to see it whole, and look in from
    // the open side when the plan type changes (an L's left wall would otherwise stand in front)
    const w = A, d = roomD;
    view.target.set(w / 2, 1, Math.min(d, 3.4) / 2);
    view.dist = Math.max(w, d * 1.1, 3.2) * (phone ? 1.8 : 1.75) + 1.2;
    if (o.tip !== lastTip) { view.az = { duz: -.35, l: .55, u: 0 }[o.tip]; view.el = .5; lastTip = o.tip; }
    // how far it may turn: never round behind a side wall
    AZ = { duz: [-1.2, 1.2], l: [-.15, 1.2], u: [-.6, .6] }[o.tip];
    floor.position.set(w / 2, 0, d / 2);
    sun.position.set(w / 2 + 3, 6, d + 4); sun.target.position.copy(view.target);
    const sc = sun.shadow.camera, ext = Math.max(w, d) / 2 + 1.5;
    sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 20; sc.updateProjectionMatrix();
    render();
  }

  function render() {
    const { az, el, dist, target } = view;
    camera.position.set(target.x + Math.sin(az) * Math.cos(el) * dist, target.y + Math.sin(el) * dist, target.z + Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(target);
    renderer.render(scene, camera);
    // tags follow their 3D points; one that would overlap a tag already placed steps down below it
    const W = canvas.clientWidth, H = canvas.clientHeight, v = new THREE.Vector3(), placed = [];
    [...tagLayer.children].forEach((el, i) => {
      v.copy(tags[i][1]).project(camera);
      const w = el.offsetWidth, h = el.offsetHeight;
      const x = Math.min(W - w - 6, Math.max(6, (v.x + 1) / 2 * W - w / 2));
      let y = Math.max(6, (1 - v.y) / 2 * H - h / 2);
      for (const r of placed) if (x < r.x + r.w + 4 && r.x < x + w + 4 && y < r.y + r.h + 4 && r.y < y + h + 4) y = r.y + r.h + 4;
      placed.push({ x, y, w, h });
      el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      el.hidden = v.z > 1;
    });
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    render();
  }
  new ResizeObserver(resize).observe(canvas);

  // turning: horizontal drag sets the azimuth; a mouse drag also tilts. AZ (set per plan type in build)
  // keeps the open side towards us.
  const EL = [.18, 1.05];
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az: view.az, el: view.el, id: e.pointerId, mouse: e.pointerType === 'mouse' }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    view.az = Math.min(AZ[1], Math.max(AZ[0], drag.az - (e.clientX - drag.x) * .006));
    if (drag.mouse) view.el = Math.min(EL[1], Math.max(EL[0], drag.el + (e.clientY - drag.y) * .004));
    render();
  });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', e => {
    const k = { ArrowLeft: [.1, 0], ArrowRight: [-.1, 0], ArrowUp: [0, .06], ArrowDown: [0, -.06] }[e.key];
    if (!k) return;
    e.preventDefault();
    view.az = Math.min(AZ[1], Math.max(AZ[0], view.az + k[0]));
    view.el = Math.min(EL[1], Math.max(EL[0], view.el + k[1]));
    render();
  });

  resize();
  return { update: build };
}
