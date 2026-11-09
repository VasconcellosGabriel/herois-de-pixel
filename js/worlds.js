'use strict';
// ---------- Mundos novos: gelo, pântano, deserto, vulcão, castelo do vampiro e cidadela celeste ----------
// Cada tema pode reaproveitar um estilo antigo (bgAs/decoAs/platAs/crateAs) ou trazer o próprio cenário
// (BG_BUILD = fundo, DECO_BUILD = sprites da decoração, DECOR_PLACE = onde colocá-los). Ver world.js.
Object.assign(THEMES, {
  ice: {
    seed: 5, style: 'rock', song: 'ice', amb: 'snow', tint: ['#cfe8ff', 0.06], glow: null, ice: true,
    ground: ['#1a2e4a', '#2a4870', '#40689a', '#6a94c4', '#a8cce8'], cap: ['#8aaccc', '#bcd4ea', '#e2eef8', '#f4f9fd', '#ffffff'],
    edge: '#0a1626', plat: '#a8cce8', sun: '#ffffff', platAs: 'castle', crateAs: 'castle',
    gems: [['#8ad8ff', '#e8faff'], ['#b8e8ff', '#ffffff'], ['#6ab8f0', '#d8f2ff']],
    sky: [[0, '#4a90d8'], [0.55, '#9ccaf0'], [0.85, '#d4ecfa'], [1, '#f4fbff']],
  },
  swamp: {
    seed: 6, style: 'dirt', song: 'swamp', amb: 'swamp', tint: ['#2a4a1a', 0.1], glow: '#c8ff8a',
    ground: ['#1a1a10', '#2c2a18', '#443e22', '#5e5630', '#7a7040'], cap: ['#1e3a14', '#2e5a1e', '#46802a', '#68a83a', '#a0d060'],
    edge: '#0c0c06', plat: '#7a5a30', sun: '#e8ffb0', platAs: 'forest', crateAs: 'forest',
    sky: [[0, '#16262a'], [0.5, '#2a4436'], [0.8, '#52704a'], [1, '#90a86a']],
  },
  desert: {
    seed: 7, style: 'dirt', song: 'desert', amb: 'sand', tint: ['#ffb050', 0.06], glow: null, noRoots: true,
    ground: ['#6a3a1a', '#9a5a28', '#c4823a', '#e0a858', '#f4cc84'], cap: ['#c48a40', '#dca458', '#eec072', '#f8da98', '#fff0c8'],
    edge: '#3a1e0a', plat: '#e0a858', sun: '#fff4c0', platAs: 'castle', crateAs: 'boss',
    sky: [[0, '#3a8ad8'], [0.5, '#8ac0e8'], [0.8, '#f0d8a0'], [1, '#ffc880']],
  },
  volcano: {
    seed: 8, style: 'lava', song: 'volcano', amb: 'embers', tint: ['#5a1a0a', 0.14], glow: '#ff7a4a',
    ground: ['#100808', '#22100c', '#3a1a14', '#5a2a1c', '#7a3a24'], cap: ['#1a0a08', '#3a1a12', '#6a2a18', '#b4501e', '#ff8a3a'],
    edge: '#060202', plat: '#8a4a2a', sun: '#ff5a2a', bgAs: 'boss', decoAs: 'boss', platAs: 'boss', crateAs: 'boss',
    sky: [[0, '#1a0606'], [0.5, '#4a0e0a'], [0.8, '#8a2a10'], [1, '#e0601a']],
  },
  vampire: {
    seed: 9, style: 'brick', song: 'vampire', amb: 'dust', tint: ['#3a0a1a', 0.14], glow: '#ff6a8a', blood: true,
    ground: ['#140810', '#2a1020', '#401a30', '#5a2844', '#7a3a5c'], cap: ['#2a1020', '#4a1a34', '#6a2a4a', '#9a4a6a', '#d080a0'],
    edge: '#08030a', plat: '#5a2844', sun: '#ff3a4a', bgAs: 'castle', decoAs: 'castle', platAs: 'castle', crateAs: 'castle',
    sky: [[0, '#0a0410'], [0.5, '#2a0a1a'], [0.85, '#5a0e22'], [1, '#8a1a2a']],
  },
  sky: {
    seed: 10, style: 'brick', song: 'sky', amb: 'sparkle', tint: ['#fff6c8', 0.04], glow: null,
    ground: ['#7a7a98', '#a4a4c0', '#c8c8dc', '#e4e4f0', '#ffffff'], cap: ['#b08a30', '#d4ae4c', '#ecd070', '#fff0a8', '#fffadc'],
    edge: '#3a3a54', plat: '#e4e4f0', sun: '#fffbe0', platAs: 'castle', crateAs: 'castle',
    sky: [[0, '#3a7ae0'], [0.5, '#6aaaf0'], [0.85, '#b8dcfa'], [1, '#eaf6ff']],
  },
});
Object.assign(SLIME_COL, { ice: '#7ad0ff', swamp: '#8ad83a', desert: '#e8b84a', volcano: '#ff6a2a', vampire: '#c03a6a', sky: '#f0a0e0' });

// ---------- Fundos ----------
function bgBase(th) {
  const R = rng(th.seed * 31 + 5), skyC = skyOf(th.sky).toCanvas(), sg = skyC.getContext('2d');
  sg.save(); sg.scale(HR, HR);
  const disc = (x, y, r, col, a) => { sg.globalAlpha = a; sg.fillStyle = col; sg.beginPath(); sg.arc(x, y, r, 0, 7); sg.fill(); sg.globalAlpha = 1; };
  return { R, skyC, sg, disc, layers: [], clouds: [], mk2: () => new PX(WW, WH), done() { sg.restore(); return { sky: skyC, layers: this.layers, clouds: this.clouds, amb: th.amb, tint: th.tint }; } };
}
const addClouds = (b, n, ymax = 70) => { for (let i = 0; i < n; i++) { const w = 40 + ((b.R() * 56) | 0); b.clouds.push({ img: cloudSprite(b.R, w, 12 + ((b.R() * 12) | 0)), x: b.R() * W, y: 6 + b.R() * ymax, v: 2 + b.R() * 5, par: 0.04 + b.R() * 0.06 }); } };

BG_BUILD.ice = th => {
  const b = bgBase(th), R = b.R;
  for (let i = 0; i < 3; i++) {                                 // aurora
    b.sg.globalAlpha = 0.1; b.sg.fillStyle = ['#7affc8', '#8ad8ff', '#c8a8ff'][i]; b.sg.beginPath(); b.sg.moveTo(0, 26 + i * 10);
    for (let x = 0; x <= BGW; x += 8) b.sg.lineTo(x, 26 + i * 10 + Math.sin(x * 0.03 + i) * 9);
    for (let x = BGW; x >= 0; x -= 8) b.sg.lineTo(x, 40 + i * 10 + Math.sin(x * 0.03 + i + 0.6) * 11);
    b.sg.closePath(); b.sg.fill();
  }
  b.sg.globalAlpha = 1; b.disc(70, 36, 30, '#ffffff', 0.1); b.disc(70, 36, 13, '#fffef4', 1);
  addClouds(b, 4);
  b.layers.push({ img: mountainLayer(R, 252, ['#7a98c0', '#98b4d8', '#b8cce8', '#dce8f6'], 4, 90, 150, true, ['#eef6ff', 0.3]).toCanvas(), par: 0.08 });
  b.layers.push({ img: mountainLayer(R, 286, ['#5a7aa8', '#7894c0', '#9ab0d4', '#c4d4ea'], 5, 40, 84, true, ['#e0eefa', 0.2]).toCanvas(), par: 0.2 });
  const f1 = b.mk2(); f1.rect(0, 300, WW, WH - 300, '#d4e4f2');
  wrap3(o => { for (let x = 8; x < WW; x += 22 + ((R() * 20) | 0)) pineTree(f1, x + o, 306, 60 + ((R() * 50) | 0), 24, ['#16343e', '#24505c', '#3a7080', '#e8f4fc', '#ffffff']); });
  f1.tint(0, 0, WW, WH, '#e8f4ff', 0.25);
  b.layers.push({ img: f1.toCanvas(), par: 0.34 });
  return b.done();
};
BG_BUILD.swamp = th => {
  const b = bgBase(th), R = b.R;
  b.disc(230, 46, 36, '#e8ffb0', 0.08); b.disc(230, 46, 20, '#f0ffd0', 0.9); b.disc(225, 42, 4, '#c8e0a0', 0.6);
  b.layers.push({ img: mountainLayer(R, 270, ['#1e3426', '#28442e', '#34563a', '#446a48'], 6, 30, 70, false, ['#6a8a5a', 0.2]).toCanvas(), par: 0.1 });
  const dead = (g, x, base, h) => {                              // árvore seca e torta
    g.poly([[x - 6, base], [x - 3, base - h], [x + 3, base - h], [x + 6, base]], '#1a2018', { hi: '#2e3a2a', lo: '#0c100a', depth: 2 });
    for (let k = 0; k < 4; k++) { const y = base - h * (0.45 + k * 0.14), s = k % 2 ? 1 : -1; g.cap(x, y, x + s * (16 + R() * 14), y - 12 - R() * 10, 3, '#1a2018', { flat: true }); }
  };
  const mid = b.mk2(); mid.rect(0, 296, WW, WH - 296, '#24361e');
  wrap3(o => { for (let x = 20; x < WW; x += 70 + ((R() * 60) | 0)) dead(mid, x + o, 300, 90 + ((R() * 70) | 0)); });
  wrap3(o => { for (let x = 50; x < WW; x += 120 + ((R() * 60) | 0)) roundTree(mid, x + o, 302, 100 + ((R() * 40) | 0), ['#0e2014', '#16301c', '#204226', '#2e5a30', '#447a3e', '#5a9a4a'], (x * 5) | 0, ['#141a10', '#20281a', '#2e3a24', '#3c4a2e']); });
  mid.tint(0, 0, WW, WH, '#7a9a6a', 0.3);
  b.layers.push({ img: mid.toCanvas(), par: 0.3 });
  const near = b.mk2(); near.rect(0, 318, WW, WH - 318, '#1a2a14');
  for (let x = 0; x < WW; x += 3) { const h = 10 + ((pn(x, 0, 6, 4096, 3) * 30) | 0); near.rect(x, 318 - h, 1, h, x % 2 ? '#2a4a1e' : '#1e3a16'); if (h > 30) near.rect(x - 1, 318 - h, 3, 5, '#4a2a14'); }
  b.layers.push({ img: near.toCanvas(), par: 0.5 });
  return b.done();
};
BG_BUILD.desert = th => {
  const b = bgBase(th), R = b.R;
  b.disc(240, 50, 48, '#fff4c0', 0.08); b.disc(240, 50, 30, '#fff4c0', 0.16); b.disc(240, 50, 18, '#fffbe8', 1);
  addClouds(b, 2, 40);
  b.layers.push({ img: mountainLayer(R, 262, ['#c48a50', '#d8a468', '#ecc088', '#f8dcaa'], 3, 40, 70, false, ['#ffe8c0', 0.3]).toCanvas(), par: 0.08 });
  const pyr = b.mk2();
  wrap3(o => { for (let x = 60; x < WW; x += 200 + ((R() * 80) | 0)) { const h = 60 + ((R() * 50) | 0); pyr.poly([[x + o - h, 286], [x + o, 286 - h], [x + o + h, 286]], '#c88a48', { hi: '#f0c890', lo: '#8a5a2a', depth: 3 }); for (let y = 286 - h + 8; y < 286; y += 8) pyr.rect(x + o - (286 - y) + 2, y, (286 - y) * 2 - 4, 1, '#a87038'); } });
  pyr.tint(0, 0, WW, WH, '#ffe0b0', 0.25);
  b.layers.push({ img: pyr.toCanvas(), par: 0.16 });
  b.layers.push({ img: mountainLayer(R, 300, ['#b87a3a', '#d09450', '#e4b06a', '#f4cc8a'], 5, 20, 46, false, ['#ffe0b0', 0.12]).toCanvas(), par: 0.3 });
  return b.done();
};
BG_BUILD.sky = th => {
  const b = bgBase(th), R = b.R;
  b.disc(260, 40, 50, '#fffbe0', 0.1); b.disc(260, 40, 32, '#fffbe0', 0.18); b.disc(260, 40, 18, '#ffffff', 1);
  addClouds(b, 9, 150);
  const far = b.mk2();
  wrap3(o => { for (let x = 40; x < WW; x += 150 + ((R() * 70) | 0)) {       // torres douradas distantes
    const h = 90 + ((R() * 90) | 0), top = 270 - h;
    far.poly([[x + o - 12, 280], [x + o - 12, top], [x + o + 12, top], [x + o + 12, 280]], '#e8e0c8', { hi: '#ffffff', lo: '#a8a090', depth: 2 });
    far.poly([[x + o - 16, top], [x + o, top - 30], [x + o + 16, top]], '#ecc860', { hi: '#fff4b0', lo: '#a8862a', depth: 2 });
  } });
  far.tint(0, 0, WW, WH, '#d8ecff', 0.4);
  b.layers.push({ img: far.toCanvas(), par: 0.12 });
  const isl = b.mk2();                                               // ilhas flutuantes
  wrap3(o => { for (let x = 30; x < WW; x += 110 + ((R() * 80) | 0)) {
    const y = 120 + ((R() * 120) | 0), w = 24 + ((R() * 30) | 0);
    isl.poly([[x + o - w, y], [x + o + w, y], [x + o + w * 0.4, y + w * 0.9], [x + o, y + w * 1.4], [x + o - w * 0.5, y + w * 0.8]], '#8a7a6a', { hi: '#c8b8a0', lo: '#4a3e34', depth: 3 });
    isl.rect(x + o - w, y - 3, w * 2, 4, '#7ad070'); isl.rect(x + o - w, y - 3, w * 2, 1, '#b4ee92');
  } });
  isl.tint(0, 0, WW, WH, '#e0f0ff', 0.2);
  b.layers.push({ img: isl.toCanvas(), par: 0.28 });
  return b.done();
};

// ---------- Decoração ----------
DECO_BUILD.ice = (D, sp) => {
  const shard = cs => sp(40, 48, g => { for (const [dx, h, w] of [[20, 44, 9], [8, 26, 6], [31, 30, 7]]) { g.poly([[dx - w, 47], [dx - w + 2, 47 - h + 7], [dx, 47 - h], [dx + w - 2, 47 - h + 7], [dx + w, 47]], cs[0], { hi: cs[1], lo: cs[2], depth: 3 }); g.line(dx - 2, 47 - h + 6, dx - 2, 43, '#ffffff'); } });
  D.crystal = [['#8ad8ff', '#e8faff', '#3a88c0'], ['#b8e8ff', '#ffffff', '#5aa0d0']].map(cs => ({ img: shard(cs), glow: cs[0] }));
  D.pine = [0, 1].map(v => sp(48, 70 + v * 16, g => pineTree(g, 24, 69 + v * 16, 66 + v * 16, 30 + v * 4, ['#16343e', '#24505c', '#3a7080', '#e8f4fc', '#ffffff'])));
  D.rock = sp(30, 20, g => { g.lit(15, 12, 13, 8, ['#5a7090', '#8aa0c0', '#c8d8ec', '#ffffff'], 5, { edge: 0.25 }); for (let x = 0; x < 30; x++) for (let y = 17; y < 20; y++) g.clear(x, y); });
  D.snowman = sp(30, 42, g => {
    g.ell(15, 32, 10, 9, '#f4f8ff', { hi: '#ffffff', lo: '#a8bcd8', depth: 2 }); g.ell(15, 17, 7.5, 7, '#f4f8ff', { hi: '#ffffff', lo: '#a8bcd8', depth: 2 });
    g.rect(12, 14, 2, 2, '#1b1423'); g.rect(17, 14, 2, 2, '#1b1423'); g.poly([[15, 17], [22, 18], [15, 19]], '#ff8a2a', { flat: true });
    g.rect(9, 6, 12, 3, '#2a2a3a'); g.rect(11, 0, 8, 7, '#2a2a3a'); g.rect(11, 5, 8, 1, '#c0392b');
    g.cap(6, 26, 0, 20, 1, '#6a4a2a', { flat: true }); g.cap(24, 26, 29, 19, 1, '#6a4a2a', { flat: true });
    for (let x = 0; x < 30; x++) g.clear(x, 41);
  });
};
DECOR_PLACE.ice = o => {
  const { D, add, lights, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 9 && r < 0.16) { add({ spr: [D.pine[(r2 * 2) | 0]], x, y: y + 2, layer: 'back' }); last.big = tx; }
  else if (flat && r > 0.93) { const c = D.crystal[(r2 * 2) | 0]; add({ spr: [c.img], x, y: y + 2, layer: 'back' }); lights.push({ x, y: y - 12, r: 30, col: c.glow, a: 0.35 }); }
  else if (r > 0.86) add({ spr: [D.rock], x, y: y + 1, layer: 'mid' });
  else if (flat && r > 0.3 && r < 0.315) add({ spr: [D.snowman], x, y: y + 1, layer: 'back' });
};
DECO_BUILD.swamp = (D, sp, spN) => {
  D.reed = [0, 1].map(f => spN(22, 36, g => {
    for (const [x, h, c] of [[4, 26, 0], [10, 32, 1], [16, 24, 0]]) {
      for (let y = 0; y < h; y++) { const xx = x + Math.round((f ? 2 : 0) * (y / h) * (y / h)); g.px(xx, 35 - y, ['#3a6a2a', '#4e8a34'][c]); g.px(xx + 1, 35 - y, '#2a5020'); }
      const tx2 = x + (f ? 2 : 0); g.rect(tx2 - 1, 35 - h, 3, 7, '#6a3a1a'); g.rect(tx2 - 1, 35 - h, 1, 7, '#8a5a2a'); g.px(tx2, 35 - h - 2, '#4e8a34'); g.px(tx2, 35 - h - 1, '#4e8a34');
    }
  }));
  D.deadtree = sp(80, 110, g => {
    g.poly([[32, 109], [36, 40], [44, 40], [48, 109]], '#3a3428', { hi: '#5a5040', lo: '#1a1610', depth: 3 });
    for (const [x0, y0, x1, y1] of [[38, 60, 12, 36], [42, 52, 70, 30], [40, 42, 30, 8], [44, 70, 66, 58], [36, 80, 18, 72]]) g.cap(x0, y0, x1, y1, 4, '#3a3428', { hi: '#5a5040', lo: '#1a1610', depth: 1 });
    for (let k = 0; k < 7; k++) { const x = 14 + k * 9, y = 34 + (k % 3) * 8; for (let j = 0; j < 10 + (k % 3) * 4; j++) g.px(x + (j % 2), y + j, j % 3 ? '#4e7a3a' : '#6a9a4a'); }   // musgo pendurado
  });
  D.shroom = [0, 1].map(f => sp(26, 22, g => {
    g.poly([[11, 10], [15, 10], [15, 21], [11, 21]], '#d8f0b0', { hi: '#ffffff', lo: '#7a9a5a', depth: 1 });
    g.lit(13, 9, 11, 7, ['#2a6a1a', '#4aa02a', '#8ad83a', '#d8ff9a'], 61, { edge: 0.06 }); g.ell(9, 7, 1.6, 1.4, '#ffffff', { flat: true }); g.ell(17 + f, 8, 1.2, 1, '#ffffff', { flat: true });
  }));
  D.log = sp(48, 18, g => { g.cap(4, 10, 44, 10, 12, '#5a3a22', { hi: '#8a5a32', lo: '#2a1a0e', depth: 2 }); g.ell(44, 10, 4, 6, '#c8a070', { hi: '#e8c890', lo: '#7a5a30', depth: 1 }); for (let x = 6; x < 40; x += 3) g.rect(x, 3 + (x % 2), 2, 3, '#4e8a34'); });
};
DECOR_PLACE.swamp = o => {
  const { D, add, lights, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 16 && r < 0.12) { add({ spr: [D.deadtree], x, y: y + 2, layer: 'back' }); last.big = tx; }
  else if (r2 > 0.62) add({ spr: D.reed, x: x + ((r * 6) | 0) - 3, y: y + 2, layer: 'front', sway: true, slow: true });
  else if (r > 0.9) { add({ spr: D.shroom, x, y: y + 1, layer: 'mid', sway: true, slow: true }); lights.push({ x, y: y - 6, r: 18, col: '#8ad83a', a: 0.4 }); }
  else if (flat && r > 0.8 && r < 0.84) add({ spr: [D.log], x, y: y + 1, layer: 'mid' });
};
DECO_BUILD.desert = (D, sp) => {
  D.cactus = [0, 1].map(v => sp(40, 58, g => {
    const C = { hi: '#8ad070', lo: '#1f5a2a', depth: 2 };
    g.cap(20, 57, 20, 8, 10, '#3f9a4a', C);
    g.cap(20, 34, 8, 34, 6, '#3f9a4a', C); g.cap(8, 34, 8, 20 - v * 4, 6, '#3f9a4a', C);
    if (v) { g.cap(20, 28, 32, 28, 6, '#3f9a4a', C); g.cap(32, 28, 32, 16, 6, '#3f9a4a', C); }
    for (let y = 10; y < 54; y += 6) { g.px(14, y, '#e8f0c8'); g.px(26, y + 3, '#e8f0c8'); }
    if (!v) { g.ell(20, 6, 3, 2.5, '#ff6a9a', { hi: '#ffc0d8', lo: '#a02a5a', depth: 1 }); }
  }));
  D.skull = sp(40, 22, g => { g.ell(20, 12, 9, 8, '#f0e8d0', { hi: '#ffffff', lo: '#a8a088', depth: 2 }); g.rect(15, 9, 3, 4, '#1b1423'); g.rect(22, 9, 3, 4, '#1b1423'); g.cap(12, 6, 2, 1, 2, '#f0e8d0', { flat: true }); g.cap(28, 6, 38, 1, 2, '#f0e8d0', { flat: true }); for (let x = 0; x < 40; x++) g.clear(x, 21); });
  D.pillar = sp(30, 62, g => { g.poly([[5, 14], [25, 14], [25, 58], [5, 58]], '#d8a868', { hi: '#f4d098', lo: '#8a6030', depth: 3 }); g.poly([[0, 56], [30, 56], [30, 62], [0, 62]], '#c89858', { hi: '#ecc088', lo: '#7a5028', depth: 2 }); g.poly([[3, 8], [27, 12], [27, 16], [3, 16]], '#c89858', { hi: '#ecc088', lo: '#7a5028', depth: 2 }); for (let y = 20; y < 56; y += 9) g.rect(5, y, 20, 1, '#a87840'); g.line(14, 18, 18, 34, '#7a5028'); });
  D.rock = sp(30, 18, g => { g.lit(15, 11, 13, 7, ['#8a5a30', '#b07a48', '#d4a068', '#f0c890'], 9, { edge: 0.25 }); for (let x = 0; x < 30; x++) for (let y = 16; y < 18; y++) g.clear(x, y); });
};
DECOR_PLACE.desert = o => {
  const { D, add, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 8 && r < 0.15) { add({ spr: [D.cactus[(r2 * 2) | 0]], x, y: y + 2, layer: 'back' }); last.big = tx; }
  else if (flat && tx - (last.pil || -99) > 20 && r > 0.94) { add({ spr: [D.pillar], x, y: y + 2, layer: 'back' }); last.pil = tx; }
  else if (r > 0.86) add({ spr: [D.rock], x, y: y + 1, layer: 'mid' });
  else if (r > 0.8 && r2 < 0.3) add({ spr: [D.skull], x, y: y + 1, layer: 'mid' });
};
DECO_BUILD.sky = (D, sp, spN) => {
  D.cloud = [0, 1].map(v => spN(48, 22, g => { for (const [x, y, rx, ry] of [[14, 14, 12, 7], [26, 11, 13, 9], [38, 14, 10, 7]]) g.lit(x + v * 2, y, rx, ry, ['#c8d8ee', '#e4ecf8', '#ffffff', '#ffffff'], 7 + x, { edge: 0.1 }); for (let x = 0; x < 48; x++) for (let y = 19; y < 22; y++) g.clear(x, y); }));
  D.column = sp(30, 64, g => { g.poly([[6, 8], [24, 8], [24, 58], [6, 58]], '#e8e8f4', { hi: '#ffffff', lo: '#9a9ab4', depth: 3 }); for (let x = 9; x < 24; x += 4) g.rect(x, 10, 1, 46, '#c4c4d8'); g.poly([[0, 0], [30, 0], [30, 8], [0, 8]], '#ecc860', { hi: '#fff4b0', lo: '#a8862a', depth: 2 }); g.poly([[0, 56], [30, 56], [30, 64], [0, 64]], '#ecc860', { hi: '#fff4b0', lo: '#a8862a', depth: 2 }); });
  D.orb = [0, 1].map(f => sp(24, 40, g => { g.poly([[6, 24], [18, 24], [20, 39], [4, 39]], '#e8e8f4', { hi: '#ffffff', lo: '#9a9ab4', depth: 2 }); g.ell(12, 13 - f, 8, 8, '#ffe27a', { hi: '#ffffff', lo: '#c8902a', depth: 3 }); }));
};
DECOR_PLACE.sky = o => {
  const { D, add, lights, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 12 && r < 0.12) { add({ spr: [D.column], x, y: y + 2, layer: 'back' }); last.big = tx; }
  else if (flat && tx - (last.orb || -99) > 18 && r > 0.95) { add({ spr: D.orb, x, y: y + 2, layer: 'back', sway: true, slow: true }); lights.push({ x, y: y - 20, r: 30, col: '#ffe27a', a: 0.5 }); last.orb = tx; }
  else if (r2 > 0.8) add({ spr: [D.cloud[(r * 2) | 0]], x: x + ((r * 6) | 0) - 3, y: y + 4, layer: 'front' });
};

// ---------- Transição do Reino Verde para os Picos Gelados ----------
// Fase 2-1 bosque de outono → 2-2 primeira neve → 2-3 lago congelado (tema ice) → 2-4 e chefe na caverna de gelo
Object.assign(THEMES, {
  autumn: {
    seed: 11, style: 'dirt', song: 'forest', amb: 'autumn', tint: ['#ffb070', 0.06], glow: null,
    ground: ['#2a1810', '#47291a', '#68402a', '#8a5a38', '#b07c4c'], cap: ['#4a2010', '#8a3e16', '#c0662a', '#e09a3e', '#f6cc6a'],
    edge: '#150b08', plat: '#b07a3e', sun: '#fff0c0', platAs: 'forest', crateAs: 'forest',
    sky: [[0, '#5a8ad0'], [0.5, '#9cbce0'], [0.8, '#f0d0a8'], [1, '#ffe4c0']],
  },
  snow: {
    seed: 12, style: 'dirt', song: 'ice', amb: 'snow', tint: ['#dce8ff', 0.06], glow: null,
    ground: ['#22181a', '#3a2c2c', '#54423e', '#6e5a52', '#8e786a'], cap: ['#8aa0c0', '#bccce0', '#e2ecf6', '#f6fafe', '#ffffff'],
    edge: '#120a0a', plat: '#9a7a52', sun: '#ffffff', platAs: 'forest', crateAs: 'forest',
    sky: [[0, '#7a9cc8'], [0.55, '#aec6e2'], [0.85, '#d8e6f4'], [1, '#f0f6fc']],
  },
  icecave: {
    seed: 13, style: 'rock', song: 'ice', amb: 'frost', tint: ['#2a5a9a', 0.12], glow: '#9fe8ff', ice: true,
    ground: ['#0c1830', '#182c4e', '#284872', '#3e6698', '#6890c0'], cap: ['#4a7ab0', '#7aaad8', '#b0d8f6', '#e2f4ff', '#ffffff'],
    edge: '#050a16', plat: '#7aaad8', sun: '#bfefff', platAs: 'castle', crateAs: 'castle',
    gems: [['#8ad8ff', '#e8faff'], ['#b8e8ff', '#ffffff'], ['#6ab8f0', '#d8f2ff']],
    sky: [[0, '#03081a'], [0.55, '#0a1834'], [1, '#183a66']],
  },
});
Object.assign(SLIME_COL, { autumn: '#f0a030', snow: '#9ad8ff', icecave: '#7ad0ff' });

const AUT_LEAF = [['#4a1408', '#7a2410', '#b03a18', '#d8602a', '#f0903a', '#ffc070'], ['#5a3008', '#8a5010', '#c07a18', '#e0a42a', '#f4cc4a', '#fff0a0'], ['#3a1010', '#6a1a1a', '#9a2a24', '#c84434', '#e8704a', '#ffa880']];
const AUT_BARK = ['#20120a', '#3a2214', '#5a3a22', '#7a5030'];
BG_BUILD.autumn = th => {
  const b = bgBase(th), R = b.R;
  b.disc(250, 44, 40, th.sun, 0.08); b.disc(250, 44, 26, th.sun, 0.16); b.disc(250, 44, 16, '#fffbe8', 1);
  addClouds(b, 5);
  // ao fundo, montanhas já com neve: o próximo destino
  b.layers.push({ img: mountainLayer(R, 252, ['#6a84b4', '#8aa2cc', '#aec2e2', '#dce8f6'], 4, 90, 150, true, ['#e8eef8', 0.28]).toCanvas(), par: 0.08 });
  b.layers.push({ img: mountainLayer(R, 284, ['#7a5a3a', '#9a7448', '#b88e5a', '#d4a870'], 5, 30, 60, false, ['#f0d8b8', 0.22]).toCanvas(), par: 0.2 });
  const f1 = b.mk2(); f1.rect(0, 298, WW, WH - 298, '#8a4a1e');
  wrap3(o => { for (let x = 10; x < WW; x += 26 + ((R() * 20) | 0)) { const c = AUT_LEAF[(R() * 3) | 0]; if (R() < 0.35) pineTree(f1, x + o, 306, 70 + ((R() * 40) | 0), 22, ['#12302a', '#1e4a3a', '#2e6a4e', '#468a62', '#6aaa7a']); else roundTree(f1, x + o, 306, 80 + ((R() * 40) | 0), c, (x * 7) | 0, AUT_BARK); } });
  f1.tint(0, 0, WW, WH, '#f0dcc0', 0.24);
  b.layers.push({ img: f1.toCanvas(), par: 0.32 });
  const f2 = b.mk2(); f2.rect(0, 308, WW, WH - 308, '#6a3214');
  wrap3(o => { for (let x = 14; x < WW; x += 64 + ((R() * 30) | 0)) roundTree(f2, x + o, 310, 110 + ((R() * 60) | 0), AUT_LEAF[(R() * 3) | 0], (x * 3) | 0, AUT_BARK); });
  f2.tint(0, 0, WW, WH, '#e8c8a8', 0.16);
  b.layers.push({ img: f2.toCanvas(), par: 0.5 });
  return b.done();
};
BG_BUILD.snow = th => {
  const b = bgBase(th), R = b.R;
  b.disc(70, 40, 34, '#ffffff', 0.12); b.disc(70, 40, 15, '#fffef4', 0.9);
  addClouds(b, 7, 60);
  b.layers.push({ img: mountainLayer(R, 252, ['#7a94bc', '#98b0d4', '#bccfe6', '#e4eef8'], 4, 100, 160, true, ['#f0f6fc', 0.3]).toCanvas(), par: 0.08 });
  const f1 = b.mk2(); f1.rect(0, 300, WW, WH - 300, '#dce8f4');
  wrap3(o => { for (let x = 8; x < WW; x += 22 + ((R() * 20) | 0)) pineTree(f1, x + o, 306, 60 + ((R() * 50) | 0), 24, ['#1a3a40', '#2a5260', '#3e7080', '#e8f4fc', '#ffffff']); });
  f1.tint(0, 0, WW, WH, '#e8f2ff', 0.3);
  b.layers.push({ img: f1.toCanvas(), par: 0.3 });
  // árvores de outono que ainda não perderam todas as folhas, polvilhadas de neve
  const f2 = b.mk2(); f2.rect(0, 310, WW, WH - 310, '#eef4fa');
  wrap3(o => { for (let x = 30; x < WW; x += 90 + ((R() * 50) | 0)) roundTree(f2, x + o, 312, 100 + ((R() * 50) | 0), AUT_LEAF[(R() * 3) | 0], (x * 5) | 0, AUT_BARK); });
  for (let y = 1; y < 300; y++) for (let x = 0; x < WW; x++) if (f2.has(x, y) && !f2.has(x, y - 1) && pn(x, y, 3, 4096, 4) > 0.35) { f2.px(x, y, '#ffffff'); f2.px(x, y + 1, '#e8f0fa'); }
  f2.tint(0, 0, WW, WH, '#dce8f8', 0.22);
  b.layers.push({ img: f2.toCanvas(), par: 0.5 });
  return b.done();
};
BG_BUILD.icecave = th => {
  const b = bgBase(th), R = b.R;
  const far = b.mk2(), C5 = ['#06102a', '#0c1c40', '#14305e', '#20487e', '#3a6aa8'];
  for (let x = 0; x < WW; x++) { const h = 30 + Math.sin(x * 0.02) * 18 + Math.sin(x * 0.06 + 1) * 8; far.rect(x, 0, 1, Math.round(h), C5[1]); }
  wrap3(o => { for (let x = 10; x < WW; x += 24 + ((R() * 30) | 0)) { const h = 30 + ((R() * 90) | 0); far.poly([[x + o - 7, 24], [x + o + 7, 24], [x + o, 24 + h]], C5[3], { hi: '#bfe8ff', lo: C5[1], depth: 2 }); } });
  for (let x = 0; x < WW; x++) { const h = 226 + Math.sin(x * 0.015 + 2) * 22 + Math.sin(x * 0.05) * 10; far.rect(x, Math.round(h), 1, WH, C5[2]); }
  b.layers.push({ img: far.toCanvas(), par: 0.12 });
  const beams = b.mk2().toCanvas(), bg = beams.getContext('2d');
  bg.save(); bg.scale(HR, HR);
  for (let i = 0; i < 4; i++) { bg.globalAlpha = 0.07; bg.fillStyle = '#9fe8ff'; const x = 20 + i * 90; bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x + 12, 0); bg.lineTo(x + 60, BGH); bg.lineTo(x + 22, BGH); bg.closePath(); bg.fill(); }
  bg.restore(); b.layers.push({ img: beams, par: 0.2 });
  const mid = b.mk2();
  mid.rect(0, 304, WW, WH, C5[2]);
  wrap3(o => {
    for (let x = 0; x < WW; x += 40 + ((R() * 40) | 0)) { const h = 40 + ((R() * 70) | 0), w = 16 + R() * 12; mid.poly([[x + o - w, 314], [x + o, 314 - h], [x + o + w, 314]], C5[3], { hi: '#9ad0f4', lo: C5[0], depth: 3 }); }
    for (let x = 30; x < WW; x += 100 + ((R() * 70) | 0)) {
      const h = 40 + ((R() * 44) | 0);
      for (const [dx, hh, ww] of [[0, h, 9], [-12, h * 0.6, 7], [12, h * 0.7, 7]]) mid.poly([[x + o + dx - ww, 316], [x + o + dx - ww * 0.6, 316 - hh * 0.8], [x + o + dx, 316 - hh], [x + o + dx + ww * 0.6, 316 - hh * 0.8], [x + o + dx + ww, 316]], '#8ad8ff', { hi: '#ffffff', lo: '#2a6aa8', depth: 2 });
    }
  });
  b.layers.push({ img: mid.toCanvas(), par: 0.38 });
  return b.done();
};

DECO_BUILD.autumn = (D, sp, spN, R) => {
  D.tree = [0, 1, 2].map(v => sp(150, 210, g => {
    const x0 = 75;
    g.poly([[x0 - 14, 208], [x0 - 7, 170], [x0 - 6, 100], [x0 + 6, 100], [x0 + 7, 170], [x0 + 14, 208]], AUT_BARK[2], { hi: AUT_BARK[3], lo: AUT_BARK[0], depth: 3 });
    g.poly([[x0 - 6, 140], [x0 - 26, 124], [x0 - 26, 132], [x0 - 5, 152]], AUT_BARK[2], { hi: AUT_BARK[3], lo: AUT_BARK[0], depth: 2 });
    const L = AUT_LEAF[v];
    for (const [x, y, rx, ry] of [[75, 66, 54, 46], [36, 96, 36, 32], [114, 96, 36, 32], [75, 112, 42, 30], [70, 36, 38, 30], [106, 56, 28, 24], [44, 60, 28, 24]]) g.lit(x, y, rx, ry, L, 41 + v * 9 + x, { edge: 0.22, speckle: 0.03 });
    for (let i = 0; i < 26; i++) { const x = 18 + ((R() * 114) | 0), y = 16 + ((R() * 110) | 0); if (g.has(x, y)) { g.px(x, y, L[5]); g.px(x + 1, y, L[4]); } }
    g.tint(0, 0, 150, 210, '#f0d8c0', 0.12);
  }));
  D.bush = [0, 1].map(v => sp(76, 44, g => { for (const [x, y, rx, ry] of [[38, 30, 28, 12], [22, 26, 16, 12], [54, 26, 16, 12], [38, 20, 18, 12]]) g.lit(x, y, rx, ry, AUT_LEAF[v * 2], 11 + v + x, { edge: 0.2 }); for (let x = 0; x < 76; x++) for (let y = 40; y < 44; y++) g.clear(x, y); }));
  D.pile = sp(40, 14, g => { for (let i = 0; i < 46; i++) { const x = 3 + ((R() * 34) | 0), y = 13 - ((R() * Math.max(1, 10 - Math.abs(x - 20) * 0.45)) | 0); g.rect(x, y, 2, 1, AUT_LEAF[(R() * 3) | 0][2 + ((R() * 4) | 0)]); } });
  D.mush = sp(32, 28, g => { g.poly([[12, 14], [20, 14], [19, 27], [13, 27]], '#efe6cc', { hi: '#ffffff', lo: '#b8ad8a', depth: 1 }); g.lit(16, 12, 13, 9, ['#5a2a10', '#8a4a1a', '#b8702a', '#e0a050'], 21, { edge: 0.05 }); });
  D.rock = sp(30, 20, g => { g.lit(15, 12, 13, 8, ['#3a3a4a', '#585a6e', '#80839a', '#b0b2c8'], 5, { edge: 0.25 }); g.rect(8, 5, 3, 1, '#e0602a'); g.rect(17, 4, 2, 1, '#f4cc4a'); for (let x = 0; x < 30; x++) for (let y = 17; y < 20; y++) g.clear(x, y); });
  D.tuft = [0, 1].map(f => spN(26, 22, g => { for (let i = 0; i < 7; i++) { const x = 2 + i * 3, h = 7 + ((i * 7) % 9), sw = f ? (i % 2 ? 2 : 0) : (i % 2 ? 0 : 2); for (let y = 0; y < h; y++) { const t = y / h; g.px(x + Math.round(sw * t * t), 21 - y, ['#7a3a10', '#b0601e', '#e0983a', '#f4cc6a'][t > 0.8 ? 3 : t > 0.4 ? 2 : i % 2]); } } }));
};
DECOR_PLACE.autumn = o => {
  const { D, add, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 13 && r < 0.15) { add({ spr: [D.tree[(r2 * 3) | 0]], x, y: y + 2, layer: 'back' }); last.big = tx; }
  else if (flat && tx - (last.bush || -99) > 5 && r < 0.4 && r2 < 0.35) { add({ spr: [D.bush[((r2 * 5) | 0) % 2]], x, y: y + 2, layer: 'back' }); last.bush = tx; }
  if (r2 > 0.8) add({ spr: [D.pile], x: x + ((r * 6) | 0) - 3, y: y + 1, layer: 'mid' });
  else if (r2 > 0.5 && r > 0.45) add({ spr: D.tuft, x: x + ((r * 6) | 0) - 3, y: y + 2, layer: 'front', sway: true });
  else if (r > 0.93) add({ spr: [D.mush], x, y: y + 1, layer: 'mid' });
  else if (r > 0.88) add({ spr: [D.rock], x, y: y + 1, layer: 'mid' });
};
DECO_BUILD.snow = (D, sp, spN) => {
  D.pine = [0, 1].map(v => sp(48, 70 + v * 16, g => pineTree(g, 24, 69 + v * 16, 66 + v * 16, 30 + v * 4, ['#16343e', '#24505c', '#3a7080', '#e8f4fc', '#ffffff'])));
  D.tree = [0, 1].map(v => sp(120, 160, g => {                                  // árvore de outono pegando a primeira neve
    const x0 = 60;
    g.poly([[x0 - 10, 158], [x0 - 5, 120], [x0 - 4, 70], [x0 + 4, 70], [x0 + 5, 120], [x0 + 10, 158]], AUT_BARK[2], { hi: AUT_BARK[3], lo: AUT_BARK[0], depth: 3 });
    for (const [a, b, c, d] of [[x0 - 3, 90, x0 - 30, 60], [x0 + 3, 84, x0 + 32, 56], [x0, 72, x0 - 6, 30], [x0 + 2, 76, x0 + 18, 40]]) g.cap(a, b, c, d, 4, AUT_BARK[2], { hi: AUT_BARK[3], lo: AUT_BARK[0], depth: 1 });
    for (const [x, y, rx, ry] of [[30, 58, 18, 13], [86, 54, 18, 13], [56, 34, 22, 15], [74, 40, 14, 11]]) g.lit(x, y, rx, ry, AUT_LEAF[v], 31 + v * 7 + x, { edge: 0.3, speckle: 0.03 });
    for (let y = 1; y < 159; y++) for (let x = 0; x < 120; x++) if (g.has(x, y) && !g.has(x, y - 1) && pn(x, y, 3, 4096, 6) > 0.3) { g.px(x, y, '#ffffff'); if (g.has(x, y + 1)) g.px(x, y + 1, '#e2ecf6'); }
  }));
  D.rock = sp(30, 20, g => { g.lit(15, 12, 13, 8, ['#4a4a58', '#6a6c80', '#9a9cb0', '#c8cad8'], 5, { edge: 0.25 }); g.ell(14, 6, 9, 3, '#ffffff', { hi: '#ffffff', lo: '#c8d8ec', depth: 1 }); for (let x = 0; x < 30; x++) for (let y = 17; y < 20; y++) g.clear(x, y); });
  D.bush = sp(60, 34, g => { for (const [x, y, rx, ry] of [[30, 24, 22, 9], [18, 20, 12, 9], [42, 20, 12, 9]]) g.lit(x, y, rx, ry, AUT_LEAF[2], 9 + x, { edge: 0.2 }); g.ell(30, 13, 20, 4, '#ffffff', { hi: '#ffffff', lo: '#c8d8ec', depth: 1 }); for (let x = 0; x < 60; x++) for (let y = 31; y < 34; y++) g.clear(x, y); });
  D.drift = spN(36, 10, g => { g.ell(18, 9, 17, 6, '#f4f9ff', { hi: '#ffffff', lo: '#c8d8ec', depth: 1 }); for (let x = 0; x < 36; x++) g.clear(x, 9); });
};
DECOR_PLACE.snow = o => {
  const { D, add, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 10 && r < 0.16) { add({ spr: r2 < 0.5 ? [D.tree[r2 < 0.25 ? 0 : 1]] : [D.pine[(r2 * 2) | 0 & 1]], x, y: y + 2, layer: 'back' }); last.big = tx; }
  else if (flat && r > 0.9) add({ spr: [D.bush], x, y: y + 2, layer: 'back' });
  else if (r > 0.82) add({ spr: [D.rock], x, y: y + 1, layer: 'mid' });
  else if (r2 > 0.75) add({ spr: [D.drift], x: x + ((r * 6) | 0) - 3, y: y + 2, layer: 'front' });
};
DECO_BUILD.icecave = (D, sp) => {
  const shard = cs => sp(48, 56, g => { for (const [dx, h, w] of [[22, 50, 11], [6, 28, 8], [34, 34, 9], [27, 18, 7]]) { g.poly([[dx - w, 55], [dx - w + 2, 55 - h + 8], [dx, 55 - h], [dx + w - 2, 55 - h + 8], [dx + w, 55]], cs[0], { hi: cs[1], lo: cs[2], depth: 3 }); g.line(dx - 2, 55 - h + 6, dx - 2, 50, '#ffffff'); } });
  D.crystal = [['#8ad8ff', '#e8faff', '#2a78b0'], ['#b8e8ff', '#ffffff', '#4a90c8'], ['#7ab0ff', '#e0ecff', '#2a50a8']].map(cs => ({ img: shard(cs), glow: cs[0] }));
  D.stalag = [0, 1].map(v => sp(40, 52 + v * 16, g => { const h = 52 + v * 16; g.poly([[4, h - 1], [20, 1 + v * 2], [36, h - 1]], '#3e6698', { hi: '#bfe8ff', lo: '#14284a', depth: 3 }); g.line(20, 6, 14, h - 6, '#9ad0f4'); }));
  D.rocks = sp(40, 22, g => { g.lit(11, 14, 10, 7, ['#14284a', '#284872', '#4a78a8', '#9ad0f4'], 88, { edge: 0.24 }); g.lit(27, 13, 12, 8, ['#14284a', '#284872', '#4a78a8', '#9ad0f4'], 89, { edge: 0.24 }); for (let x = 0; x < 40; x++) for (let y = 19; y < 22; y++) g.clear(x, y); });
  // explorador que não teve sorte: esqueleto preso num bloco de gelo
  D.frozen = sp(44, 52, g => {
    g.poly([[2, 51], [4, 6], [12, 1], [38, 3], [42, 12], [41, 51]], '#8ad8ff', { hi: '#e8faff', lo: '#3a88c0', depth: 3 });
    g.ell(22, 14, 6, 6, '#e8f4f8', { flat: true }); g.rect(19, 12, 2, 3, '#3a6a9a'); g.rect(23, 12, 2, 3, '#3a6a9a');
    g.rect(21, 20, 2, 16, '#e8f4f8'); for (let k = 0; k < 3; k++) g.rect(16, 22 + k * 4, 12, 2, '#e8f4f8');
    g.cap(16, 22, 10, 34, 2, '#e8f4f8', { flat: true }); g.cap(28, 22, 33, 30, 2, '#e8f4f8', { flat: true }); g.cap(20, 36, 18, 48, 2, '#e8f4f8', { flat: true }); g.cap(24, 36, 27, 48, 2, '#e8f4f8', { flat: true });
    g.tint(0, 0, 44, 52, '#9fe0ff', 0.35); g.line(8, 8, 8, 40, '#ffffff'); g.line(9, 8, 9, 20, '#ffffff');
  });
};
DECOR_PLACE.icecave = o => {
  const { D, add, lights, x, y, r, r2, flat, tx, last } = o;
  if (flat && r < 0.13) { const c = D.crystal[(r2 * 3) | 0]; add({ spr: [c.img], x, y: y + 2, layer: 'back' }); lights.push({ x, y: y - 14, r: 36, col: c.glow, a: 0.45 }); }
  else if (flat && tx - (last.fz || -99) > 30 && r > 0.3 && r < 0.36) { add({ spr: [D.frozen], x, y: y + 2, layer: 'back' }); lights.push({ x, y: y - 20, r: 30, col: '#9fe8ff', a: 0.3 }); last.fz = tx; }
  else if (r > 0.9) add({ spr: [D.stalag[(r2 * 2) | 0]], x, y: y + 2, layer: 'back' });
  else if (r > 0.78) add({ spr: [D.rocks], x, y: y + 1, layer: 'mid' });
};

// ---------- Transições na entrada dos outros mundos ----------
// 3-1 degelo (a neve derrete e vira brejo) · 4-1 savana seca (o brejo seca antes do deserto) · 5-1 terra de cinzas ao pé do vulcão
// 6-1 cemitério na colina do castelo · 7-1 pico ao amanhecer, acima das nuvens, com a cidadela no céu
Object.assign(THEMES, {
  thaw: {
    seed: 14, style: 'dirt', song: 'swamp', amb: 'thaw', tint: ['#c8d8d0', 0.07], glow: null,
    ground: ['#1a1a12', '#2c2a1c', '#443e28', '#5e5636', '#7a7048'], cap: ['#34421e', '#52642c', '#7e9060', '#c4d0c8', '#eef2f2'],
    edge: '#0c0c06', plat: '#7a5a30', sun: '#f0f4e8', platAs: 'forest', crateAs: 'forest',
    sky: [[0, '#5a7080'], [0.5, '#8aa0a8'], [0.8, '#b8c8c0'], [1, '#d8e0d0']],
  },
  savanna: {
    seed: 15, style: 'dirt', song: 'desert', amb: 'sand', tint: ['#ffc070', 0.06], glow: null, noRoots: true,
    ground: ['#5a2e14', '#84461e', '#aa6430', '#c88448', '#e0a464'], cap: ['#7a5a1a', '#a8862a', '#ccac40', '#e8cc68', '#fff0a0'],
    edge: '#2a1408', plat: '#c88448', sun: '#fff0b0', platAs: 'forest', crateAs: 'forest',
    sky: [[0, '#4a90d8'], [0.5, '#9ac4e4'], [0.8, '#f4dca0'], [1, '#ffd090']],
  },
  ash: {
    seed: 16, style: 'rock', song: 'volcano', amb: 'ash', tint: ['#4a2a20', 0.12], glow: '#ff7a4a',
    ground: ['#141010', '#241c1a', '#362a26', '#4a3a34', '#64504a'], cap: ['#3a3634', '#5a5450', '#7e7874', '#a49e98', '#cac4be'],
    edge: '#080606', plat: '#5a4a44', sun: '#ff7a3a', platAs: 'boss', crateAs: 'boss',
    sky: [[0, '#241418'], [0.5, '#4e2420'], [0.8, '#94401f'], [1, '#d8803e']],
  },
  graveyard: {
    seed: 17, style: 'dirt', song: 'vampire', amb: 'fog', tint: ['#2a1a3a', 0.14], glow: '#b0a0ff', blood: true,
    ground: ['#120c16', '#20162a', '#2e2238', '#40304a', '#56425e'], cap: ['#1a2620', '#2a3a30', '#3c5044', '#566c5e', '#84a08c'],
    edge: '#06040a', plat: '#5a4a5a', sun: '#f0ecff', platAs: 'castle', crateAs: 'castle',
    sky: [[0, '#08060f'], [0.5, '#1a1230'], [0.85, '#3a2048'], [1, '#5a2a4a']],
  },
  peak: {
    seed: 18, style: 'rock', song: 'sky', amb: 'sparkle', tint: ['#ffd0b0', 0.06], glow: null,
    ground: ['#2a2a38', '#44445a', '#62627a', '#84849c', '#a8a8be'], cap: ['#8a9ab4', '#b4c2d8', '#dce6f2', '#f4f8fc', '#ffffff'],
    edge: '#14141e', plat: '#d4ae4c', sun: '#fff0c0', platAs: 'castle', crateAs: 'castle',
    sky: [[0, '#34347e'], [0.4, '#8466aa'], [0.7, '#ee9c9c'], [0.9, '#ffcc9c'], [1, '#fff0c8']],
  },
});
Object.assign(SLIME_COL, { thaw: '#7ad0b0', savanna: '#e0b040', ash: '#ff6a2a', graveyard: '#9a6ad8', peak: '#f0a0e0' });

// árvore sem folhas (fundo); snow = neve nos galhos
function bareTree(g, x, base, h, R, col, snow) {
  g.poly([[x - 4, base], [x - 2, base - h], [x + 2, base - h], [x + 4, base]], col[1], { hi: col[2], lo: col[0], depth: 1 });
  for (let k = 0; k < 4; k++) {
    const y = base - h * (0.4 + k * 0.15), s = k % 2 ? 1 : -1, ex = x + s * (10 + R() * 12), ey = y - 10 - R() * 10;
    g.cap(x, y, ex, ey, 2.4, col[1], { flat: true }); g.cap(ex, ey, ex + s * 5, ey - 6, 1.4, col[1], { flat: true });
    if (snow) g.rect(ex - 3, ey - 1, 5, 1, snow);
  }
}
function acacia(g, x, base, h, w, ramp, seed) {
  const T3 = { hi: '#7a5a3a', lo: '#2a1a0e', depth: 1 };
  g.cap(x, base, x + 2, base - h * 0.62, 4, '#4a3020', T3);
  g.cap(x + 2, base - h * 0.6, x - w * 0.45, base - h * 0.95, 2.6, '#4a3020', T3); g.cap(x + 2, base - h * 0.6, x + w * 0.5, base - h * 0.92, 2.6, '#4a3020', T3);
  g.lit(x + 2, base - h, w, Math.max(6, h * 0.13), ramp, seed, { edge: 0.3, under: true });
}
const DRY = ['#2e3a12', '#4a5a1a', '#6a7a24', '#8e9a36', '#b4b85a'], CHAR = ['#0a0808', '#1c1614', '#2e2622'];

BG_BUILD.thaw = th => {
  const b = bgBase(th), R = b.R;
  b.disc(240, 46, 36, '#ffffff', 0.08); b.disc(240, 46, 18, '#f4f8ec', 0.7);
  addClouds(b, 8, 70);
  b.layers.push({ img: mountainLayer(R, 256, ['#5a7080', '#7a90a0', '#a0b4c0', '#d8e4ea'], 4, 80, 140, true, ['#c8d4d4', 0.3]).toCanvas(), par: 0.08 });
  const mid = b.mk2(); mid.rect(0, 298, WW, WH - 298, '#4a5a48');
  wrap3(o => { for (let x = 10; x < WW; x += 24 + ((R() * 26) | 0)) { if (R() < 0.55) pineTree(mid, x + o, 304, 56 + ((R() * 40) | 0), 22, ['#1a3030', '#264440', '#365a50', '#c8d8d8', '#eef4f4']); else bareTree(mid, x + o, 304, 60 + ((R() * 40) | 0), R, ['#1e1a16', '#3a3028', '#5a4a3a'], '#e8f0f0'); } });
  for (let x = 0; x < WW; x += 30 + ((R() * 40) | 0)) mid.ell(x, 300, 14 + R() * 12, 3, '#dfe8e8', { flat: true });            // neve derretendo
  mid.tint(0, 0, WW, WH, '#c8d4cc', 0.28);
  b.layers.push({ img: mid.toCanvas(), par: 0.3 });
  const near = b.mk2(); near.rect(0, 318, WW, WH - 318, '#24321e');
  for (let x = 0; x < WW; x += 3) { const h = 6 + ((pn(x, 0, 6, 4096, 3) * 24) | 0); near.rect(x, 318 - h, 1, h, x % 2 ? '#3a5a2a' : '#2a4620'); if (h > 24) near.rect(x - 1, 318 - h, 3, 4, '#4a2a14'); }
  for (let x = 0; x < WW; x += 50 + ((R() * 60) | 0)) { near.ell(x, 320, 18 + R() * 16, 3, '#eef4f4', { hi: '#ffffff', lo: '#a8b8b8', depth: 1 }); near.ell(x + 30, 322, 10, 2, '#5a8a9a', { flat: true }); }
  b.layers.push({ img: near.toCanvas(), par: 0.5 });
  return b.done();
};
BG_BUILD.savanna = th => {
  const b = bgBase(th), R = b.R;
  b.disc(250, 52, 46, '#fff0b0', 0.1); b.disc(250, 52, 28, '#fff0b0', 0.18); b.disc(250, 52, 17, '#fffbe8', 1);
  addClouds(b, 3, 40);
  b.layers.push({ img: mountainLayer(R, 266, ['#b06a40', '#c8845a', '#dca070', '#f0c494'], 3, 30, 60, false, ['#ffe0b8', 0.3]).toCanvas(), par: 0.08 });
  const mid = b.mk2(); mid.rect(0, 292, WW, WH - 292, '#c49a48');
  wrap3(o => { for (let x = 20; x < WW; x += 60 + ((R() * 70) | 0)) acacia(mid, x + o, 296, 50 + ((R() * 30) | 0), 22 + ((R() * 14) | 0), DRY, (x * 3) | 0); });
  mid.tint(0, 0, WW, WH, '#ffe8c0', 0.28);
  b.layers.push({ img: mid.toCanvas(), par: 0.24 });
  const near = b.mk2(); near.rect(0, 316, WW, WH - 316, '#a87a30');
  for (let x = 0; x < WW; x += 2) { const h = 4 + ((pn(x, 0, 5, 4096, 8) * 20) | 0); near.rect(x, 316 - h, 1, h, x % 4 ? '#d4b048' : '#b08a30'); }
  wrap3(o => { for (let x = 60; x < WW; x += 150 + ((R() * 80) | 0)) acacia(near, x + o, 318, 80 + ((R() * 30) | 0), 34 + ((R() * 10) | 0), DRY, (x * 7) | 0); });
  near.tint(0, 0, WW, WH, '#ffe0b0', 0.12);
  b.layers.push({ img: near.toCanvas(), par: 0.46 });
  return b.done();
};
BG_BUILD.ash = th => {
  const b = bgBase(th), R = b.R;
  const far = b.mk2(), V = ['#1a0e0e', '#2a1614', '#3e201c'];
  wrap3(o => {                                                                   // o vulcão do próximo trecho, fumegando
    const x = WW * 0.55 + o;
    far.poly([[x - 220, 290], [x - 34, 120], [x + 34, 120], [x + 220, 290]], V[1], { hi: V[2], lo: V[0], depth: 3 });
    far.ell(x, 122, 30, 5, '#ff7a2a', { hi: '#ffd27a', lo: '#c2361a', depth: 1 });
    for (const [dx, len] of [[-14, 60], [8, 90], [22, 40]]) for (let k = 0; k < len; k++) far.rect(x + dx + Math.round(Math.sin(k * 0.12 + dx) * 3 + k * (dx / 40)), 124 + k, 2, 1, k % 7 ? '#ff6a1a' : '#ffb04a');
    for (let i = 0; i < 9; i++) far.lit(x - 6 + i * 9 + Math.sin(i) * 10, 104 - i * 12, 16 + i * 2.4, 11 + i * 1.4, ['#2a2224', '#3e3436', '#584c4c', '#766866'], 50 + i, { edge: 0.3 });
  });
  far.rect(0, 286, WW, WH - 286, V[1]);
  far.tint(0, 0, WW, WH, '#a05030', 0.18);
  b.layers.push({ img: far.toCanvas(), par: 0.07 });
  b.layers.push({ img: mountainLayer(R, 296, ['#1e1614', '#2e2420', '#40322c', '#584640'], 5, 30, 70, false, ['#c06a3a', 0.15]).toCanvas(), par: 0.2 });
  const mid = b.mk2(); mid.rect(0, 312, WW, WH - 312, '#1c1614');
  wrap3(o => { for (let x = 16; x < WW; x += 40 + ((R() * 44) | 0)) bareTree(mid, x + o, 316, 50 + ((R() * 50) | 0), R, CHAR, null); });
  for (let x = 0; x < WW; x += 80 + ((R() * 90) | 0)) { mid.rect(x, 314, 12, 1, '#ff6a1a'); mid.rect(x + 3, 313, 5, 1, '#ffb04a'); }
  b.layers.push({ img: mid.toCanvas(), par: 0.42 });
  return b.done();
};
BG_BUILD.graveyard = th => {
  const b = bgBase(th), R = b.R;
  for (let i = 0; i < 80; i++) { const x = (R() * WW) | 0, y = (R() * 200) | 0; b.sg.fillStyle = R() < 0.2 ? '#ffffff' : '#9a8ac0'; b.sg.fillRect(x / HR, y / HR, 1, 1); }
  b.disc(84, 52, 40, '#f0ecff', 0.08); b.disc(84, 52, 26, '#f0ecff', 0.14); b.disc(84, 52, 18, '#f4f0ff', 1); b.disc(79, 48, 4, '#d0c8e8', 0.8); b.disc(90, 57, 3, '#d0c8e8', 0.7);
  const far = b.mk2(), F = ['#120a1c', '#1e1430', '#2c1e42'];
  wrap3(o => {                                                                   // o castelo do Conde no alto da colina
    const x = WW * 0.62 + o;
    for (let xx = -260; xx <= 260; xx++) { const h = 90 * Math.pow(Math.cos(xx / 260 * Math.PI / 2), 1.4); far.rect(x + xx, 300 - h, 1, h + 60, F[1]); }
    for (const [dx, w, h] of [[-50, 22, 70], [-20, 40, 50], [24, 26, 86], [56, 18, 60]]) {
      far.rect(x + dx, 212 - h, w, h, F[0]); for (let i = 0; i < w; i += 6) far.rect(x + dx + i, 208 - h, 4, 4, F[0]);
      far.poly([[x + dx - 2, 212 - h], [x + dx + w / 2, 182 - h], [x + dx + w + 2, 212 - h]], F[0], { flat: true });
      for (let k = 0; k < 2; k++) far.rect(x + dx + w / 2 - 1, 222 - h + k * 20, 3, 6, '#ff5a4a');
    }
  });
  b.layers.push({ img: far.toCanvas(), par: 0.1 });
  const mid = b.mk2(); mid.rect(0, 306, WW, WH - 306, '#1a1424');
  wrap3(o => {
    for (let x = 10; x < WW; x += 70 + ((R() * 60) | 0)) bareTree(mid, x + o, 310, 70 + ((R() * 60) | 0), R, ['#0c0810', '#1a1220', '#2a1e30'], null);
    for (let x = 30; x < WW; x += 24 + ((R() * 30) | 0)) { const h = 10 + ((R() * 8) | 0); if (R() < 0.5) { mid.poly([[x + o - 5, 308], [x + o - 5, 308 - h], [x + o, 304 - h], [x + o + 5, 308 - h], [x + o + 5, 308]], '#2a2234', { flat: true }); } else { mid.rect(x + o - 1, 296 - h, 3, h + 12, '#2a2234'); mid.rect(x + o - 5, 300 - h, 11, 3, '#2a2234'); } }
  });
  mid.tint(0, 0, WW, WH, '#6a5a90', 0.2);
  b.layers.push({ img: mid.toCanvas(), par: 0.3 });
  const fog = b.mk2().toCanvas(), fg = fog.getContext('2d');
  fg.save(); fg.scale(HR, HR);
  for (let i = 0; i < 5; i++) { fg.globalAlpha = 0.06; fg.fillStyle = '#d8d0f0'; fg.fillRect(0, 130 + i * 7, BGW, 10 + i * 4); }
  fg.restore(); b.layers.push({ img: fog, par: 0.4 });
  return b.done();
};
BG_BUILD.peak = th => {
  const b = bgBase(th), R = b.R;
  b.disc(220, 150, 70, '#ffd8a0', 0.1); b.disc(220, 150, 44, '#ffe0b0', 0.18); b.disc(220, 150, 26, '#fff4d8', 1);
  const city = b.mk2();                                                           // a cidadela, lá no alto
  for (const [x, y, s] of [[160, 60, 1], [260, 44, 0.8], [520, 70, 0.9]]) {
    city.poly([[x - 40 * s, y], [x + 40 * s, y], [x + 16 * s, y + 30 * s], [x, y + 44 * s], [x - 16 * s, y + 30 * s]], '#8a7a8a', { hi: '#c8b8c0', lo: '#5a4a5a', depth: 2 });
    for (const dx of [-20, 0, 20]) { const h = (dx ? 30 : 46) * s; city.rect(x + dx * s - 5 * s, y - h, 10 * s, h, '#ece4d8'); city.poly([[x + dx * s - 7 * s, y - h], [x + dx * s, y - h - 14 * s], [x + dx * s + 7 * s, y - h]], '#ecc860', { flat: true }); }
  }
  city.tint(0, 0, WW, WH, '#f0c8d0', 0.45);
  b.layers.push({ img: city.toCanvas(), par: 0.04 });
  b.layers.push({ img: mountainLayer(R, 268, ['#4a4a7a', '#6a6a9a', '#9a90c0', '#f0dce8'], 4, 90, 150, true, ['#f0c0c8', 0.3]).toCanvas(), par: 0.1 });
  const sea = b.mk2();                                                            // mar de nuvens lá embaixo
  for (let x = -20; x < WW + 20; x += 26 + ((R() * 20) | 0)) sea.lit(x, 286 + R() * 14, 30 + R() * 20, 16 + R() * 6, ['#c890b8', '#e8b4c8', '#ffd8dc', '#fff4f0'], (x * 3) | 0, { edge: 0.2 });
  sea.rect(0, 296, WW, WH - 296, '#ffd8dc');
  b.layers.push({ img: sea.toCanvas(), par: 0.2 });
  addClouds(b, 4, 90);
  return b.done();
};

DECO_BUILD.thaw = (D, sp, spN, R) => {
  DECO_BUILD.swamp(D, sp, spN);
  const S = {}; DECO_BUILD.snow(S, sp, spN, R); D.drift = S.drift; D.pine = S.pine; D.srock = S.rock;
  D.puddle = spN(40, 6, g => { g.ell(20, 3, 18, 2.6, '#5a8a9a', { hi: '#bfe8f4', lo: '#2a4a5a', depth: 1 }); g.rect(10, 2, 6, 1, '#ffffff'); });
  D.icy = sp(80, 110, g => {                                                        // árvore seca ainda com gelo pingando
    g.poly([[32, 109], [36, 40], [44, 40], [48, 109]], '#3a3428', { hi: '#5a5040', lo: '#1a1610', depth: 3 });
    for (const [x0, y0, x1, y1] of [[38, 60, 12, 36], [42, 52, 70, 30], [40, 42, 30, 8], [44, 70, 66, 58]]) { g.cap(x0, y0, x1, y1, 4, '#3a3428', { hi: '#5a5040', lo: '#1a1610', depth: 1 }); g.rect(x1 - 4, y1 - 2, 8, 2, '#f4f8fc'); for (let k = 0; k < 3; k++) g.poly([[x1 - 4 + k * 3, y1 + 1], [x1 - 3 + k * 3, y1 + 5 + k], [x1 - 2 + k * 3, y1 + 1]], '#bfe8ff', { flat: true }); }
  });
};
DECOR_PLACE.thaw = o => {
  const { D, add, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 11 && r < 0.15) { add({ spr: [r2 < 0.4 ? D.icy : r2 < 0.7 ? D.deadtree : D.pine[(r2 * 4) & 1]], x, y: y + 2, layer: 'back' }); last.big = tx; }
  else if (r2 > 0.7) add({ spr: D.reed, x: x + ((r * 6) | 0) - 3, y: y + 2, layer: 'front', sway: true, slow: true });
  else if (r2 > 0.55 && r > 0.5) add({ spr: [D.drift], x, y: y + 2, layer: 'front' });
  else if (flat && r > 0.88) add({ spr: [D.puddle], x, y: y + 2, layer: 'mid' });
  else if (r > 0.8) add({ spr: [D.srock], x, y: y + 1, layer: 'mid' });
};
DECO_BUILD.savanna = (D, sp, spN) => {
  DECO_BUILD.desert(D, sp);
  D.acacia = [0, 1].map(v => sp(130, 100, g => acacia(g, 64, 99, 80 + v * 10, 46 + v * 8, DRY, 7 + v)));
  D.grass = [0, 1].map(f => spN(26, 24, g => { for (let i = 0; i < 8; i++) { const x = 2 + i * 3, h = 10 + ((i * 5) % 11), sw = f ? (i % 2 ? 3 : 1) : (i % 2 ? 1 : 3); for (let yy = 0; yy < h; yy++) { const t = yy / h; g.px(x + Math.round(sw * t * t), 23 - yy, ['#8a6a20', '#b8902a', '#e0c050', '#fff0a0'][t > 0.8 ? 3 : t > 0.4 ? 2 : i % 2]); } } }));
  D.mound = sp(36, 46, g => { g.poly([[2, 45], [12, 8], [18, 1], [24, 10], [34, 45]], '#b0703a', { hi: '#d89a5a', lo: '#6a3a1a', depth: 3 }); g.poly([[20, 12], [28, 6], [27, 20]], '#b0703a', { hi: '#d89a5a', lo: '#6a3a1a', depth: 1 }); for (const [x, y2] of [[14, 20], [20, 30], [12, 36]]) g.rect(x, y2, 2, 2, '#4a2410'); });
};
DECOR_PLACE.savanna = o => {
  const { D, add, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 12 && r < 0.13) { add({ spr: [D.acacia[(r2 * 2) | 0]], x, y: y + 2, layer: 'back' }); last.big = tx; }
  else if (flat && tx - (last.m || -99) > 16 && r > 0.94) { add({ spr: [D.mound], x, y: y + 2, layer: 'back' }); last.m = tx; }
  else if (r2 > 0.55) add({ spr: D.grass, x: x + ((r * 6) | 0) - 3, y: y + 2, layer: 'front', sway: true });
  else if (r > 0.86) add({ spr: [D.rock], x, y: y + 1, layer: 'mid' });
  else if (r > 0.8 && r2 < 0.25) add({ spr: [D.skull], x, y: y + 1, layer: 'mid' });
  else if (flat && r < 0.2 && r2 < 0.1) add({ spr: [D.cactus[0]], x, y: y + 2, layer: 'back' });
};
DECO_BUILD.ash = (D, sp, spN) => {
  D.tree = [0, 1].map(v => sp(70, 100, g => {
    g.poly([[28, 99], [32, 30], [38, 30], [42, 99]], CHAR[1], { hi: CHAR[2], lo: CHAR[0], depth: 2 });
    for (const [x0, y0, x1, y1] of [[33, 60, 10, 34 + v * 6], [37, 50, 62, 26], [35, 38, 26, 6], [38, 70, 58, 60 - v * 8]]) g.cap(x0, y0, x1, y1, 4, CHAR[1], { hi: CHAR[2], lo: CHAR[0], depth: 1 });
    for (const [x, y2] of [[34, 80], [36, 54], [33, 44]]) { g.rect(x, y2, 3, 1, '#ff6a1a'); g.px(x + 1, y2 + 1, '#ffb04a'); }      // brasas na casca
  }));
  D.vent = [0, 1].map(f => sp(40, 16, g => { g.ell(20, 12, 18, 4, '#2e2622', { hi: '#4a3e38', lo: '#120e0c', depth: 1 }); g.rect(10, 11, 20, 2, '#ff6a1a'); g.rect(14 + f * 3, 11, 8, 1, '#ffd27a'); }));
  D.rock = sp(30, 20, g => { g.lit(15, 12, 13, 8, ['#1c1614', '#362a26', '#5a4a44', '#847470'], 5, { edge: 0.25 }); g.ell(14, 6, 9, 2.4, '#a49e98', { flat: true }); for (let x = 0; x < 30; x++) for (let y = 17; y < 20; y++) g.clear(x, y); });
  D.pile = spN(36, 8, g => { g.ell(18, 7, 16, 4, '#8a8480', { hi: '#b4aea8', lo: '#5a5450', depth: 1 }); for (let x = 0; x < 36; x++) g.clear(x, 7); });
};
DECOR_PLACE.ash = o => {
  const { D, add, lights, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 8 && r < 0.17) { add({ spr: [D.tree[(r2 * 2) | 0]], x, y: y + 2, layer: 'back' }); last.big = tx; }
  else if (flat && r > 0.9) { add({ spr: D.vent, x, y: y + 2, layer: 'mid', sway: true }); lights.push({ x, y: y - 4, r: 26, col: '#ff6a1a', a: 0.5, flick: true }); }
  else if (r > 0.82) add({ spr: [D.rock], x, y: y + 1, layer: 'mid' });
  else if (r2 > 0.7) add({ spr: [D.pile], x: x + ((r * 6) | 0) - 3, y: y + 2, layer: 'front' });
};
DECO_BUILD.graveyard = (D, sp) => {
  const S = { hi: '#8a8098', lo: '#2a2234', depth: 2 };
  D.tomb = [
    sp(26, 32, g => { g.poly([[3, 31], [3, 10], [7, 4], [13, 1], [19, 4], [23, 10], [23, 31]], '#5a5268', S); g.rect(8, 10, 10, 1, '#2a2234'); g.rect(8, 14, 10, 1, '#2a2234'); g.rect(4, 22, 5, 3, '#3c5044'); }),
    sp(24, 40, g => { g.poly([[9, 39], [9, 14], [2, 14], [2, 8], [9, 8], [9, 1], [15, 1], [15, 8], [22, 8], [22, 14], [15, 14], [15, 39]], '#5a5268', S); }),
    sp(30, 22, g => { g.poly([[2, 21], [4, 6], [26, 4], [28, 21]], '#4a4258', S); g.line(8, 10, 14, 16, '#2a2234'); g.line(14, 16, 12, 20, '#2a2234'); }),
  ];
  D.tree = sp(80, 110, g => {
    g.poly([[32, 109], [36, 40], [44, 40], [48, 109]], '#1e1624', { hi: '#3a2e44', lo: '#0a060e', depth: 3 });
    for (const [x0, y0, x1, y1] of [[38, 60, 10, 40], [42, 52, 72, 34], [40, 42, 28, 6], [44, 70, 68, 62], [38, 80, 16, 70]]) { g.cap(x0, y0, x1, y1, 4, '#1e1624', { hi: '#3a2e44', lo: '#0a060e', depth: 1 }); g.cap(x1, y1, x1 + (x1 > 40 ? 6 : -6), y1 - 7, 2, '#1e1624', { flat: true }); }
  });
  D.fence = sp(48, 30, g => { for (let x = 3; x < 48; x += 8) { g.rect(x, 6, 3, 24, '#2a2630'); g.poly([[x - 1, 7], [x + 1.5, 0], [x + 4, 7]], '#3a3644', { flat: true }); } g.rect(0, 10, 48, 2, '#2a2630'); g.rect(0, 22, 48, 2, '#2a2630'); });
  D.lantern = [0, 1].map(f => sp(20, 50, g => { g.rect(9, 14, 3, 36, '#2a2630'); g.poly([[4, 4], [16, 4], [14, 16], [6, 16]], '#2a2630', { flat: true }); g.rect(7, 7, 6, 7, f ? '#ffe27a' : '#ffc84a'); g.rect(8, 8, 2, 3, '#fff6c8'); }));
};
DECOR_PLACE.graveyard = o => {
  const { D, add, lights, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 14 && r < 0.12) { add({ spr: [D.tree], x, y: y + 2, layer: 'back' }); last.big = tx; }
  else if (flat && tx - (last.l || -99) > 14 && r > 0.93) { add({ spr: D.lantern, x, y: y + 2, layer: 'back', sway: true, slow: true }); lights.push({ x, y: y - 36, r: 34, col: '#ffc84a', a: 0.5, flick: true }); last.l = tx; }
  else if (r2 > 0.62 && r < 0.6) add({ spr: [D.tomb[(r * 5 | 0) % 3]], x, y: y + 2, layer: 'back' });
  else if (flat && r > 0.8 && r2 < 0.3) add({ spr: [D.fence], x, y: y + 2, layer: 'back' });
};
DECO_BUILD.peak = (D, sp, spN) => {
  DECO_BUILD.sky(D, sp, spN);
  D.pine = sp(44, 56, g => { pineTree(g, 26, 55, 50, 26, ['#16343e', '#24505c', '#3a7080', '#e8f4fc', '#ffffff']); });
  D.rock = sp(40, 26, g => { g.lit(20, 16, 18, 10, ['#2a2a38', '#4e4e66', '#7a7a94', '#b4b4ca'], 13, { edge: 0.25 }); g.ell(16, 8, 10, 3, '#ffffff', { hi: '#ffffff', lo: '#c8d4e8', depth: 1 }); for (let x = 0; x < 40; x++) for (let y = 23; y < 26; y++) g.clear(x, y); });
  D.flags = [0, 1].map(f => sp(80, 50, g => {
    g.rect(2, 4, 3, 46, '#5a4a3a'); g.rect(75, 10, 3, 40, '#5a4a3a');
    for (let i = 0; i < 7; i++) { const x = 6 + i * 10, y = 8 + i * 1 + Math.sin(i * 0.9) * 2; g.poly([[x, y], [x + 8, y + 1], [x + 7 + (f ? 2 : 0), y + 10], [x + 1, y + 9]], ['#e04a3a', '#f0c040', '#3ab060', '#3a80e0', '#ffffff'][i % 5], { flat: true }); }
    g.line(4, 6, 76, 13, '#5a4a3a');
  }));
};
DECOR_PLACE.peak = o => {
  const { D, add, lights, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.big || -99) > 18 && r < 0.1) { add({ spr: D.flags, x, y: y + 2, layer: 'back', sway: true, slow: true }); last.big = tx; }
  else if (flat && tx - (last.p || -99) > 6 && r < 0.3 && r2 < 0.3) { add({ spr: [D.pine], x, y: y + 2, layer: 'back' }); last.p = tx; }
  else if (flat && tx - (last.orb || -99) > 26 && r > 0.95) { add({ spr: D.orb, x, y: y + 2, layer: 'back', sway: true, slow: true }); lights.push({ x, y: y - 20, r: 30, col: '#ffe27a', a: 0.5 }); last.orb = tx; }
  else if (r > 0.84) add({ spr: [D.rock], x, y: y + 1, layer: 'mid' });
  else if (r2 > 0.86) add({ spr: [D.cloud[(r * 2) | 0]], x: x + ((r * 6) | 0) - 3, y: y + 4, layer: 'front' });
};
