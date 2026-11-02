'use strict';
// ---------- Cenários em alta resolução (2x): temas, tiles com auto-composição, fundos em camadas, decoração ----------
const WW = BGW * HR, WH = BGH * HR, TT = T * HR;      // tamanho do mundo em pixels de alta resolução
const THEMES = {
  forest: {
    seed: 1, style: 'dirt', song: 'forest', amb: 'forest', tint: ['#ffe9a8', 0.05],
    ground: ['#2a1810', '#47291a', '#68402a', '#8a5a38', '#b07c4c'], cap: ['#14472a', '#1f7336', '#32a043', '#5cc555', '#a2eb74'],
    edge: '#150b08', plat: '#b07a3e', sun: '#fff6b0',
    sky: [[0, '#3f9be0'], [0.5, '#7cc6f2'], [0.78, '#c4ebfc'], [1, '#f6fcff']],
  },
  cave: {
    seed: 2, style: 'rock', song: 'cave', amb: 'spores', tint: ['#2a1f6a', 0.14],
    ground: ['#100f2c', '#1d1d46', '#2c2e68', '#40448c', '#5c62b4'], cap: ['#2c2c78', '#4446a8', '#6a72dc', '#a0acff', '#e2e8ff'],
    edge: '#0a0a1e', plat: '#8b7bd8', sun: '#c8b8ff',
    sky: [[0, '#06051a'], [0.55, '#130e33'], [1, '#2c2266']],
  },
  castle: {
    seed: 3, style: 'brick', song: 'castle', amb: 'dust', tint: ['#2a0f3a', 0.12],
    ground: ['#1a1a2e', '#2c2c46', '#444464', '#62628a', '#8a8ab0'], cap: ['#3c3c5a', '#5c5c80', '#8484aa', '#b4b4d4', '#e8e8f8'],
    edge: '#0e0e1c', plat: '#8a7360', sun: '#fff1d0',
    sky: [[0, '#0e0924'], [0.5, '#2a1238'], [0.85, '#6a2a4c'], [1, '#a64e56']],
  },
  boss: {
    seed: 4, style: 'lava', song: 'boss', amb: 'embers', tint: ['#5a0a0a', 0.14],
    ground: ['#0e060c', '#1c0e16', '#2e1a26', '#482a38', '#6a4054'], cap: ['#220f1a', '#46263a', '#7a4a5c', '#b87a80', '#ffb8a0'],
    edge: '#080308', plat: '#8a6a52', sun: '#ff6a4a',
    sky: [[0, '#12040a'], [0.5, '#3a0e1c'], [0.8, '#7a1e1e'], [1, '#c4502a']],
  },
};
const blit = (g, img, x, y) => g.drawImage(img, x, y, img.width / HR, img.height / HR);

// ---------- utilidades ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
function gradAt(stops, t) {
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1));
  return stops[stops.length - 1][1];
}
function skyOf(stops, bands = 22) {
  const g = new PX(WW, WH), cols = [];
  for (let i = 0; i <= bands; i++) cols.push(gradAt(stops, i / bands));
  for (let y = 0; y < WH; y++) {
    const pos = y / (WH - 1) * bands, b = Math.floor(pos), fr = pos - b;
    for (let x = 0; x < WW; x++) g.px(x, y, cols[fr > BAYER[(y & 3) * 4 + (x & 3)] ? Math.min(bands, b + 1) : b]);
  }
  return g;
}
const wrap3 = fn => { for (const o of [-WW, 0, WW]) fn(o); };

// ---------- tiles (32x32 de alta resolução) ----------
function terrain(g, th, variant) {
  const s = th.seed * 101 + variant * 17, P = th.ground, R = rng(s);
  const px = (x, y, c) => g.px(x & 31, y & 31, c);
  if (th.style === 'brick' || th.style === 'lava') {
    for (let row = 0; row < 2; row++) for (let b = 0; b < 2; b++) {
      const bx = (b * 16 + row * 8) & 31, by = row * 16, tone = 1 + ((R() * 2.6) | 0);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const X = (bx + x) & 31, nz = pn(X, by + y, 4, 8, s + b + row * 3);
        let i = tone + (nz > 0.62 ? 1 : nz < 0.3 ? -1 : 0);
        if (x < 2 || y < 2) i += 1;                  // bisel claro (cima/esquerda)
        if (x > 12 || y > 12) i -= 1;                // bisel escuro
        if (x === 15 || y === 15) i = 0;             // argamassa
        px(X, by + y, P[clamp(i, 0, 4)]);
      }
      if (R() < 0.5) { const cx = bx + 3 + ((R() * 8) | 0), cy = by + 3 + ((R() * 8) | 0); for (let k = 0; k < 4; k++) px(cx + k, cy + (k >> 1), P[0]); }
      if (th.style === 'brick' && R() < 0.3) { const mx = bx + 1 + ((R() * 8) | 0), my = by + 9 + ((R() * 3) | 0); g.rect(mx & 31, my, 5, 3, '#34663c'); g.rect(mx & 31, my, 3, 1, '#5a9a5a'); g.rect((mx + 1) & 31, my + 3, 2, 1, '#34663c'); }
      if (th.style === 'lava' && R() < 0.55) {
        let cx = bx + 2 + ((R() * 6) | 0), cy = by + 2 + ((R() * 4) | 0);
        for (let k = 0; k < 7; k++) { px(cx, cy, '#ff6a1a'); px(cx + 1, cy, '#ffb04a'); cx += R() < 0.6 ? 1 : 0; cy += R() < 0.6 ? 1 : 0; }
      }
    }
  } else {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      let v = 0.5 * pn(x, y, 8, 4, s) + 0.32 * pn(x, y, 4, 8, s + 7) + 0.18 * pn(x, y, 2, 16, s + 13);
      if (th.style === 'rock') v += Math.sin((x + y * 0.6) * 0.5 + variant) * 0.06;
      let i = clamp(Math.floor((v - 0.2) * 6.2), 0, 4);
      if (hash2(x, y, s) < 0.05) i = clamp(i + (hash2(y, x, s) < 0.5 ? 1 : -1), 0, 4);
      px(x, y, P[i]);
    }
    if (th.style === 'dirt') {
      for (let k = 0; k < 3; k++) {                       // pedras
        const cx = 4 + ((R() * 24) | 0), cy = 6 + ((R() * 22) | 0), rx = 2 + ((R() * 3) | 0), ry = 1.5 + R() * 1.5;
        g.ell(cx, cy, rx, ry, '#8c8aa0', { hi: '#c8c6da', lo: '#4a4660', depth: 1 });
      }
      for (let k = 0; k < 2; k++) {                       // raízes
        let x = (R() * 28) | 0, y = 5 + ((R() * 14) | 0);
        for (let j = 0; j < 9; j++) { px(x + j, y + (j >> 1), P[0]); px(x + j, y + (j >> 1) + 1, P[1]); }
      }
    } else if (th.style === 'rock') {
      for (let k = 0; k < 2; k++) if (R() < 0.7) {       // cristais embutidos
        const cx = 4 + ((R() * 22) | 0), cy = 6 + ((R() * 18) | 0), col = [['#6a5cff', '#c8c0ff'], ['#ff6ad0', '#ffd0f4'], ['#3fd0ff', '#c8f6ff']][(R() * 3) | 0];
        g.poly([[cx, cy - 6], [cx + 3, cy - 2], [cx + 3, cy + 4], [cx - 1, cy + 4], [cx - 3, cy - 1]], col[0], { hi: col[1], lo: toneLo(col[0], 0.4), depth: 1 });
      }
      for (let k = 0; k < 2; k++) { let x = (R() * 30) | 0, y = 0; for (let j = 0; j < 20; j++) { px(x, y + j, P[0]); if (R() < 0.4) x += R() < 0.5 ? 1 : -1; } }
    }
  }
}
function capTop(g, th, variant, leftEmpty, rightEmpty) {
  const s = th.seed * 313 + variant * 71, R = rng(s), C5 = th.cap;
  if (th.style === 'dirt' || th.style === 'rock') {
    const hs = [];
    for (let x = 0; x < 32; x++) {
      let h = Math.round(8 + 5 * pn(x, 0, 5, 6, s) + (x % 9 === 0 ? 2 : 0));
      if (leftEmpty && x < 4) h -= 4 - x; if (rightEmpty && x > 27) h -= x - 27;
      hs.push(h);
      for (let y = 0; y < h; y++) {
        let i = 2;
        if (y === 0) i = 4; else if (y < 3) i = 3; else if (y >= h - 3) i = 1; if (y === h - 1) i = 0;
        if (y > 2 && y < h - 3 && ((x + (y >> 1) * 2) % 6 === 0)) i = 1;
        if (y > 1 && y < h - 2 && ((x * 3 + y) % 11 === 0)) i = 3;
        g.px(x, y, C5[i]);
      }
    }
    for (let k = 0; k < 7; k++) {                          // folhas/pontas pendentes
      const x = (R() * 30) | 0, len = 3 + ((R() * 5) | 0);
      for (let y = hs[x]; y < hs[x] + len; y++) { g.px(x, y, C5[y - hs[x] < len - 2 ? 1 : 0]); g.px(x + 1, y, C5[0]); }
    }
    if (th.style === 'rock') for (let k = 0; k < 4; k++) { const x = (R() * 30) | 0; g.px(x, 1, '#ffffff'); g.px(x + 1, 1, '#ffffff'); g.px(x, 0, '#ffffff'); }
    g.tint(0, 9, 32, 5, '#0c0618', 0.22);                  // oclusão sob a cobertura
  } else {
    const hgt = 9;
    for (let x = 0; x < 32; x++) for (let y = 0; y < hgt; y++) {
      let i = 2;
      if (y === 0) i = 4; else if (y < 2) i = 3; else if (y >= hgt - 2) i = 1; if (y === hgt - 1) i = 0;
      if ((x === 15 || x === 31 || x === 0) && y > 0 && y < hgt - 1) i = 0;
      if (y > 1 && y < hgt - 2 && pn(x, y, 3, 16, s) > 0.7) i = 3;
      g.px(x, y, C5[i]);
    }
    if (th.style === 'lava') { for (let x = 0; x < 32; x++) { g.px(x, hgt - 2, '#ff7a2a'); g.px(x, hgt - 1, '#ffd27a'); if (R() < 0.3) g.px(x, hgt, '#ff4a1a'); } }
    g.tint(0, hgt, 32, 4, '#0c0618', 0.25);
  }
}

const _tileCache = {};
// mask: 1 = acima vazio, 2 = esquerda vazia, 4 = direita vazia, 8 = abaixo vazio
function solidTile(name, mask, depth, variant) {
  const key = name + mask + '_' + depth + '_' + variant;
  if (_tileCache[key]) return _tileCache[key];
  const th = THEMES[name], g = new PX(32, 32), R = rng(th.seed * 7 + variant + mask * 13);
  terrain(g, th, variant);
  if (depth > 0) g.tint(0, 0, 32, 32, '#0a0418', 0.1 * depth);
  if (mask & 2) { g.rect(0, 0, 3, 32, th.ground[0]); g.rect(0, 0, 1, 32, th.edge); g.rect(3, 3, 1, 26, th.ground[3]); g.tint(1, 0, 6, 32, '#0a0418', 0.18); }
  if (mask & 4) { g.rect(29, 0, 3, 32, th.ground[0]); g.rect(31, 0, 1, 32, th.edge); g.tint(24, 0, 6, 32, '#0a0418', 0.18); }
  if (mask & 8) {
    g.rect(0, 26, 32, 6, th.ground[0]); g.tint(0, 20, 32, 6, '#0a0418', 0.25);
    for (let x = 0; x < 32; x++) { const l = 2 + ((R() * 5) | 0); g.rect(x, 32 - l, 1, l, th.edge); }
  }
  if (mask & 1) capTop(g, th, variant, !!(mask & 2), !!(mask & 4));
  const rc = (x0, y0, sx, sy) => { for (let k = 0; k < 6; k++) for (let j = 0; j < 6 - k; j++) g.clear(x0 + sx * j, y0 + sy * k); };
  if ((mask & 1) && (mask & 2)) rc(0, 0, 1, 1);
  if ((mask & 1) && (mask & 4)) rc(31, 0, -1, 1);
  if ((mask & 8) && (mask & 2)) rc(0, 31, 1, -1);
  if ((mask & 8) && (mask & 4)) rc(31, 31, -1, -1);
  const c = g.toCanvas();
  return (_tileCache[key] = c);
}

function platTile(name) {
  const key = 'plat' + name;
  if (_tileCache[key]) return _tileCache[key];
  const th = THEMES[name], g = new PX(32, 32);
  if (name === 'forest') {
    const W5 = ['#4a2a14', '#7a4a22', '#a8703a', '#cf9650', '#eebc78'];
    for (let i = 0; i < 3; i++) g.poly([[i * 11, 0], [i * 11 + 11, 0], [i * 11 + 11, 11], [i * 11, 11]], W5[2], { hi: W5[4], lo: W5[0], depth: 2 });
    for (let x = 0; x < 32; x++) for (let y = 2; y < 10; y++) if (pn(x * 0.4, y * 3, 2, 64, 7) > 0.66) g.px(x, y, W5[1]);
    for (const x of [3, 14, 25]) { g.px(x, 4, W5[0]); g.px(x, 7, W5[0]); g.px(x + 1, 3, W5[4]); }
    g.rect(0, 11, 32, 4, W5[0]); g.tint(0, 11, 32, 4, '#0a0418', 0.2);
    g.poly([[4, 15], [9, 15], [8, 28], [5, 28]], W5[1], { hi: W5[3], lo: W5[0], depth: 1 }); g.poly([[23, 15], [28, 15], [27, 28], [24, 28]], W5[1], { hi: W5[3], lo: W5[0], depth: 1 });
    g.rect(1, 17, 1, 8, '#3f9a3a'); g.rect(2, 21, 1, 6, '#2a7a2e'); g.rect(30, 17, 1, 9, '#3f9a3a');
  } else if (name === 'cave') {
    const A = ['#1c1850', '#3a3290', '#6a5adc', '#a898ff', '#e6e0ff'];
    g.poly([[0, 2], [32, 2], [30, 12], [26, 16], [8, 16], [2, 12]], A[2], { hi: A[4], lo: A[0], depth: 3 });
    g.poly([[4, 4], [14, 4], [12, 9], [4, 9]], A[3], { flat: true }); g.rect(2, 3, 28, 1, A[4]);
    for (const [x, h, c] of [[6, 8, '#3fd0ff'], [16, 12, '#ff6ad0'], [24, 7, '#3fd0ff']]) g.poly([[x, 15], [x + 3, 15], [x + 2, 15 + h], [x + 1, 15 + h]], c, { hi: '#ffffff', lo: toneLo(c, 0.4), depth: 1 });
  } else if (name === 'castle') {
    const S5 = th.ground;
    g.poly([[0, 0], [32, 0], [32, 12], [0, 12]], S5[3], { hi: S5[4], lo: S5[1], depth: 2 });
    g.rect(15, 2, 1, 9, S5[1]); g.rect(0, 11, 32, 1, S5[0]);
    g.poly([[2, 12], [30, 12], [26, 18], [6, 18]], S5[1], { hi: S5[2], lo: S5[0], depth: 1 });
    for (const x of [3, 27]) { for (let k = 0; k < 4; k++) g.ell(x, 20 + k * 3.4, 1.5, 1.7, k % 2 ? '#7a7a96' : '#aaaac4', { depth: 0, flat: true }); }
  } else {
    const O = th.ground;
    g.poly([[0, 0], [32, 0], [32, 12], [0, 12]], O[3], { hi: O[4], lo: O[1], depth: 2 });
    g.rect(0, 10, 32, 2, '#ff7a2a'); g.rect(0, 11, 32, 1, '#ffd27a'); g.poly([[3, 12], [29, 12], [24, 20], [8, 20]], O[1], { depth: 1, hi: O[2], lo: O[0] });
    for (const x of [8, 16, 23]) g.poly([[x, 18], [x + 3, 18], [x + 1, 26]], '#ff5a1a', { depth: 0, flat: true });
  }
  return (_tileCache[key] = outline(g.toCanvas(), th.edge));
}

// Caixa quebrável (tile 4): caixote, barril ou vaso conforme o tema. dmg = já levou golpe (rachada)
function crateTile(name, variant, dmg) {
  const key = 'crate' + name + variant + (dmg ? 'd' : '');
  if (_tileCache[key]) return _tileCache[key];
  const g = new PX(32, 32), kind = name === 'boss' ? 'pot' : name === 'cave' ? (variant ? 'pot' : 'crate') : (variant ? 'barrel' : 'crate');
  if (kind === 'crate') {
    const W5 = name === 'cave' ? ['#2a2440', '#4a3e6a', '#6a5a92', '#9a88c4', '#c8b8f0'] : ['#4a2a14', '#7a4a22', '#a06a38', '#c88a52', '#e8b47a'];
    g.poly([[1, 1], [31, 1], [31, 31], [1, 31]], W5[2], { hi: W5[4], lo: W5[0], depth: 3 });
    g.rect(5, 5, 22, 22, W5[1]);
    for (let y = 6; y < 27; y += 5) g.rect(5, y, 22, 1, W5[0]);
    g.line(6, 6, 26, 26, W5[3]); g.line(6, 7, 25, 26, W5[3]); g.line(26, 6, 6, 26, W5[3]);
    for (const [x, y] of [[3, 3], [28, 3], [3, 28], [28, 28]]) g.rect(x, y, 2, 2, '#9aa0b4');
  } else if (kind === 'barrel') {
    g.poly([[5, 1], [27, 1], [30, 8], [30, 24], [27, 31], [5, 31], [2, 24], [2, 8]], '#8a5a30', { hi: '#c08a52', lo: '#4a2a14', depth: 3 });
    for (const y of [6, 23]) { g.rect(2, y, 28, 3, '#6a6a80'); g.rect(2, y, 28, 1, '#b4b4cc'); }
    g.rect(15, 2, 1, 29, '#4a2a14'); g.rect(9, 2, 1, 29, '#6a4020');
  } else {
    const P5 = name === 'boss' ? ['#3a1410', '#6a2a1c', '#9a4a2a', '#c87a4a', '#f0b080'] : ['#1a2a4a', '#2a4a7a', '#3a6aa8', '#6aa0d8', '#b0dcff'];
    g.ell(16, 19, 13, 12, P5[2], { hi: P5[4], lo: P5[0], depth: 3 });
    g.poly([[10, 2], [22, 2], [21, 8], [11, 8]], P5[1], { hi: P5[3], lo: P5[0], depth: 1 });
    g.rect(5, 15, 22, 2, P5[3]); g.rect(7, 22, 18, 1, P5[1]);
  }
  if (dmg) { g.line(9, 4, 14, 14, '#1a0e08'); g.line(14, 14, 11, 22, '#1a0e08'); g.line(14, 14, 22, 18, '#1a0e08'); }
  return (_tileCache[key] = outline(g.toCanvas(), '#0e0612'));
}
// Rachaduras discretas por cima do terreno: denunciam a parede falsa (tile 5) para quem presta atenção
function crackTile(dmg) {
  const key = 'crack' + (dmg ? 'd' : '');
  if (_tileCache[key]) return _tileCache[key];
  const g = new PX(32, 32), c = '#0a0612';
  const path = [[6, 4], [11, 11], [9, 17], [15, 22], [13, 29]];
  for (let i = 0; i < path.length - 1; i++) g.line(...path[i], ...path[i + 1], c);
  g.line(11, 11, 18, 9, c); g.line(15, 22, 23, 24, c);
  if (dmg) { g.line(18, 9, 26, 14, c); g.line(23, 24, 27, 30, c); g.line(9, 17, 3, 20, c); g.line(20, 4, 24, 12, c); }
  return (_tileCache[key] = g.toCanvas());
}
// Baú do tesouro (alta resolução, 30x26); aberto = tampa levantada e brilho
const _chest = {};
function chestSprite(open) {
  if (_chest[open]) return _chest[open];
  const g = new PX(30, 26), W5 = ['#3a1a0a', '#6a3a18', '#9a5a28', '#c8823e', '#eab06a'], G = ['#8a5a10', '#c9962a', '#ffd23f', '#fff2a0'];
  g.poly([[1, 11], [29, 11], [29, 25], [1, 25]], W5[2], { hi: W5[4], lo: W5[0], depth: 2 });
  g.rect(1, 17, 28, 2, G[1]); g.rect(4, 11, 3, 14, G[1]); g.rect(23, 11, 3, 14, G[1]);
  if (!open) {
    g.poly([[1, 4], [5, 1], [25, 1], [29, 4], [29, 11], [1, 11]], W5[3], { hi: W5[4], lo: W5[1], depth: 2 });
    g.rect(4, 1, 3, 10, G[2]); g.rect(23, 1, 3, 10, G[2]);
    g.rect(12, 8, 6, 7, G[2]); g.rect(14, 10, 2, 3, W5[0]);
  } else {
    g.poly([[1, 3], [29, 3], [29, 9], [1, 9]], W5[1], { hi: W5[3], lo: W5[0], depth: 1 });
    g.rect(3, 9, 24, 3, '#1a0a04');
    for (const [x, y] of [[8, 9], [13, 8], [18, 9], [11, 10], [21, 10]]) g.ell(x, y, 2.5, 2, G[2], { hi: G[3], lo: G[0], depth: 1 });
  }
  return (_chest[open] = outline(g.toCanvas(), '#0e0612'));
}

function spikeTile(name) {
  const key = 'spike' + name;
  if (_tileCache[key]) return _tileCache[key];
  const g = new PX(32, 32);
  g.poly([[0, 27], [32, 27], [32, 32], [0, 32]], '#5a5f70', { hi: '#9aa0b4', lo: '#2c3040', depth: 1 });
  for (let i = 0; i < 3; i++) {
    const cx = 5 + i * 11;
    g.poly([[cx - 4, 27], [cx, 8], [cx + 4, 27]], '#c6ceda', { hi: '#ffffff', lo: '#6a7488', depth: 2 });
    g.line(cx, 11, cx, 25, '#ffffff');
    if (name === 'boss' || name === 'castle') { g.px(cx - 1, 20, '#b5303a'); g.px(cx, 22, '#b5303a'); g.px(cx - 2, 24, '#8a1f2a'); }
  }
  return (_tileCache[key] = outline(g.toCanvas(), '#14101c'));
}

// ---------- fundos ----------
function cloudSprite(R, w, h) {
  const g = new PX(w * HR + 16, h * HR + 16), ramp = ['#a9c0e2', '#cddcf2', '#eaf1fb', '#ffffff'];
  const n = 5 + ((R() * 3) | 0), W2 = w * HR;
  for (let i = 0; i < n; i++) {
    const x = 12 + (W2 - 12) * (i + 0.5) / n, y = h * HR * (0.62 - Math.sin(i / (n - 1) * Math.PI) * 0.24) + 8 + R() * 4, rx = 11 + R() * 10, ry = 8 + R() * 7;
    g.lit(x, y, rx, ry, ramp, 31 + i * 3, { edge: 0.12, under: true, speckle: 0 });
  }
  for (let y = h * HR + 6; y < g.h; y++) for (let x = 0; x < g.w; x++) g.clear(x, y);
  return g.toCanvas();
}

function mountainLayer(R, baseY, cols, count, hmin, hmax, snow, haze) {
  const g = new PX(WW, WH), peaks = [];
  for (let i = 0; i < count; i++) peaks.push({ x: (i + 0.5) * WW / count + (R() - 0.5) * 60, hw: 80 + R() * 70, h: hmin + R() * (hmax - hmin) });
  for (let x = 0; x < WW; x++) {
    let top = baseY, side = 0, pk = null;
    for (const p of peaks) for (const o of [-WW, 0, WW]) {
      const d = Math.abs(x - (p.x + o));
      if (d < p.hw) { const y = baseY - p.h * Math.pow(1 - d / p.hw, 0.9) + pn(x, 0, 6, 4096, 9) * 5; if (y < top) { top = y; pk = p; side = x < p.x + o ? -1 : 1; } }
    }
    top = Math.round(top);
    for (let y = top; y < WH; y++) {
      const depth = y - top;
      let i = side < 0 ? 3 : 1;
      const nz = pn(x * 0.7, y, 5, 4096, 3);
      if (nz > 0.66) i += side < 0 ? 1 : 0; else if (nz < 0.28) i -= 1;
      if (pk && snow && top < baseY - pk.h * 0.5 && depth < 8 + nz * 14 + (side < 0 ? 4 : 0)) { g.px(x, y, side < 0 ? '#ffffff' : '#cfe0f6'); continue; }
      if (depth > 3 && ((x + y * 2) % 13 === 0)) i -= 1;
      g.px(x, y, cols[clamp(i, 0, cols.length - 1)]);
    }
  }
  if (haze) g.tint(0, baseY - 40, WW, WH, haze[0], haze[1]);
  return g;
}

function pineTree(g, x, base, h, w, ramp) {
  const tiers = 5;
  g.rect(x - 2, base - 6, 5, 7, ramp[0]);
  for (let i = 0; i < tiers; i++) {
    const ty = base - 6 - (h - 10) * (i / tiers), tw = w * (1 - i * 0.17), th = (h - 8) / tiers + 6;
    g.poly([[x, ty - th], [x + tw / 2, ty], [x - tw / 2, ty]], ramp[2], { hi: ramp[4], lo: ramp[0], depth: 2 });
  }
}
function roundTree(g, x, base, h, ramp, seed, trunk) {
  g.poly([[x - 5, base], [x - 3, base - h * 0.5], [x + 3, base - h * 0.5], [x + 5, base]], trunk[2], { hi: trunk[3], lo: trunk[0], depth: 2 });
  const r = h * 0.27;
  for (const [dx, dy, rx, ry] of [[0, 0.66, 1.2, 1], [-0.85, 0.5, 0.85, 0.8], [0.85, 0.5, 0.85, 0.8], [0, 0.9, 0.9, 0.75]]) g.lit(x + dx * r, base - h * dy, r * rx, r * ry, ramp, seed + ((dx * 7) | 0) + 3, { edge: 0.18 });
}

function makeBg(name) {
  const th = THEMES[name], R = rng(th.seed * 31 + 5), layers = [], clouds = [];
  const skyG = skyOf(th.sky);
  const skyC = skyG.toCanvas(), sg = skyC.getContext('2d');
  sg.save(); sg.scale(HR, HR);
  const disc = (x, y, r, col, a) => { sg.globalAlpha = a; sg.fillStyle = col; sg.beginPath(); sg.arc(x, y, r, 0, 7); sg.fill(); sg.globalAlpha = 1; };
  if (name === 'forest') {
    for (let i = 0; i < 4; i++) { sg.globalAlpha = 0.07; sg.fillStyle = '#fff6b0'; sg.beginPath(); sg.moveTo(250, 40); sg.lineTo(130 - i * 60, BGH); sg.lineTo(170 - i * 60 + 40, BGH); sg.closePath(); sg.fill(); }
    sg.globalAlpha = 1;
    disc(250, 40, 44, th.sun, 0.07); disc(250, 40, 32, th.sun, 0.12); disc(250, 40, 22, th.sun, 0.22); disc(250, 40, 16, '#fffbe0', 1); disc(247, 37, 8, '#ffffff', 0.9);
  } else if (name === 'castle') {
    disc(240, 44, 40, '#ffd9a0', 0.07); disc(240, 44, 28, '#ffd9a0', 0.12); disc(240, 44, 17, th.sun, 1); disc(236, 41, 5, '#e2cfa8', 0.7); disc(246, 49, 3.5, '#e2cfa8', 0.6);
  } else if (name === 'boss') {
    disc(160, 150, 90, '#ff4a2a', 0.1); disc(160, 150, 62, '#ff6a3a', 0.16); disc(160, 150, 38, '#ffaa4a', 0.4);
  }
  sg.restore();
  if (name !== 'forest') {
    for (let i = 0; i < (name === 'castle' ? 90 : 60); i++) {
      const x = (R() * WW) | 0, y = (R() * (name === 'boss' ? 160 : 210)) | 0, b = R();
      sg.fillStyle = b < 0.2 ? '#ffffff' : b < 0.6 ? '#b8c8ff' : '#7a86c0'; sg.fillRect(x, y, b < 0.2 ? 2 : 1, b < 0.2 ? 2 : 1);
      if (b < 0.06) { sg.fillStyle = '#ffffff'; sg.fillRect(x - 2, y, 6, 1); sg.fillRect(x, y - 2, 2, 5); }
    }
  }
  const mk2 = () => new PX(WW, WH);
  if (name === 'forest') {
    for (let i = 0; i < 5; i++) { const w = 46 + ((R() * 50) | 0); clouds.push({ img: cloudSprite(R, w, 14 + ((R() * 10) | 0)), x: R() * W, y: 8 + R() * 70, v: 3 + R() * 5, par: 0.04 + R() * 0.05 }); }
    layers.push({ img: mountainLayer(R, 255, ['#6f93c4', '#8db0dc', '#a8c6e8', '#c8def4'], 4, 70, 130, true, ['#d8ecfa', 0.25]).toCanvas(), par: 0.08 });
    layers.push({ img: mountainLayer(R, 280, ['#3c8a64', '#4fa476', '#68c08a', '#86d8a0'], 5, 34, 62, false, ['#cfeaf0', 0.18]).toCanvas(), par: 0.2 });
    const f1 = mk2(); f1.rect(0, 296, WW, WH - 296, '#2f7d56');
    wrap3(o => { for (let x = 10; x < WW; x += 24 + ((R() * 18) | 0)) pineTree(f1, x + o, 306, 70 + ((R() * 50) | 0), 22, ['#12432c', '#1f6b48', '#2f8f5c', '#46b074', '#6fd096']); });
    f1.tint(0, 0, WW, WH, '#cfeaf0', 0.22);
    layers.push({ img: f1.toCanvas(), par: 0.32 });
    const f2 = mk2(); f2.rect(0, 306, WW, WH - 306, '#1f6b3a');
    wrap3(o => { for (let x = 12; x < WW; x += 62 + ((R() * 28) | 0)) roundTree(f2, x + o, 308, 108 + ((R() * 60) | 0), ['#103c24', '#1b5e34', '#2a8444', '#46aa56', '#7ad272', '#b4ee92'], (x * 3) | 0, ['#20120a', '#3a2214', '#5a3a22', '#7a5030']); });
    f2.tint(0, 0, WW, WH, '#bfe6d8', 0.2);
    layers.push({ img: f2.toCanvas(), par: 0.5 });
  } else if (name === 'cave') {
    const far = mk2(), C5 = ['#0c0a26', '#14113a', '#1d1850', '#2a2266', '#3a3088'];
    for (let x = 0; x < WW; x++) { const h = 28 + Math.sin(x * 0.022) * 20 + Math.sin(x * 0.055 + 1) * 10; far.rect(x, 0, 1, Math.round(h), C5[1]); }
    wrap3(o => { for (let x = 12; x < WW; x += 32 + ((R() * 40) | 0)) { const h = 40 + ((R() * 90) | 0); far.poly([[x + o - 10, 22], [x + o + 10, 22], [x + o, 22 + h]], C5[2], { hi: C5[4], lo: C5[0], depth: 2 }); } });
    far.rect(0, 236, WW, WH, C5[2]);
    for (let x = 0; x < WW; x++) { const h = 224 + Math.sin(x * 0.015 + 2) * 24 + Math.sin(x * 0.05) * 12; far.rect(x, Math.round(h), 1, WH, C5[2]); }
    layers.push({ img: far.toCanvas(), par: 0.12 });
    const beams = mk2().toCanvas(), bg = beams.getContext('2d');
    bg.save(); bg.scale(HR, HR);
    for (let i = 0; i < 3; i++) { bg.globalAlpha = 0.08; bg.fillStyle = '#9fa8ff'; const x = 30 + i * 110; bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x + 14, 0); bg.lineTo(x + 70, BGH); bg.lineTo(x + 26, BGH); bg.closePath(); bg.fill(); }
    bg.restore(); layers.push({ img: beams, par: 0.2 });
    const mid = mk2(), M5 = ['#14103a', '#201a56', '#322a7a', '#4a40a0', '#6a60c8'];
    mid.rect(0, 300, WW, WH, M5[2]);
    wrap3(o => {
      for (let x = 0; x < WW; x += 46 + ((R() * 50) | 0)) { const h = 44 + ((R() * 80) | 0), w = 20 + R() * 12; mid.poly([[x + o - w, 312], [x + o, 312 - h], [x + o + w, 312]], M5[2], { hi: M5[4], lo: M5[0], depth: 3 }); }
      for (let x = 24; x < WW; x += 110 + ((R() * 80) | 0)) {
        const h = 36 + ((R() * 40) | 0), col = [['#6a5cff', '#c8c0ff'], ['#ff6ad0', '#ffd0f4'], ['#3fd0ff', '#c8f6ff']][(R() * 3) | 0];
        for (const [dx, hh, ww] of [[0, h, 9], [-12, h * 0.6, 7], [12, h * 0.7, 7]]) mid.poly([[x + o + dx - ww, 314], [x + o + dx - ww * 0.6, 314 - hh * 0.8], [x + o + dx, 314 - hh], [x + o + dx + ww * 0.6, 314 - hh * 0.8], [x + o + dx + ww, 314]], col[0], { hi: col[1], lo: toneLo(col[0], 0.4), depth: 2 });
      }
    });
    layers.push({ img: mid.toCanvas(), par: 0.38 });
  } else if (name === 'castle') {
    const far = mk2(), F = ['#1a1030', '#2c1a42', '#3a2454'];
    far.rect(0, 264, WW, WH, F[1]);
    wrap3(o => {
      for (let x = 20; x < WW; x += 104 + ((R() * 44) | 0)) {
        const w = 48 + ((R() * 28) | 0), h = 92 + ((R() * 80) | 0), top = 268 - h;
        far.poly([[x + o, 270], [x + o, top], [x + o + w, top], [x + o + w, 270]], F[1], { hi: F[2], lo: F[0], depth: 2 });
        for (let i = 0; i < w; i += 12) far.rect(x + o + i, top - 8, 8, 8, F[1]);
        far.rect(x + o + w / 2 - 2, top + 20, 5, 10, '#ffcf6a'); far.rect(x + o + w / 2 - 2, top + 52, 5, 10, '#ffcf6a');
        if (R() < 0.6) far.poly([[x + o, top - 8], [x + o + w / 2, top - 8 - 34], [x + o + w, top - 8]], F[1], { hi: F[2], lo: F[0], depth: 2 });
      }
    });
    layers.push({ img: far.toCanvas(), par: 0.15 });
    const mid = mk2(), S5 = ['#1c1230', '#2c2040', '#3b2a4f', '#4a3a62', '#66527e'];
    mid.rect(0, 0, WW, WH, S5[2]);
    for (let y = 0; y < WH; y += 20) { mid.rect(0, y + 18, WW, 2, S5[1]); for (let x = (y / 20 % 2) * 16; x < WW; x += 32) mid.rect(x, y, 2, 18, S5[1]); }
    for (let x = 28; x < WW; x += 128) {
      mid.poly([[x - 24, 44], [x + 32, 44], [x + 32, 330], [x - 24, 330]], S5[1], { hi: S5[3], lo: S5[0], depth: 3 });
      mid.rect(x - 28, 36, 64, 10, S5[3]); mid.rect(x - 28, 36, 64, 2, S5[4]); mid.rect(x - 28, 300, 64, 14, S5[3]);
    }
    for (let x = 92; x < WW + 40; x += 128) {
      mid.poly([[x - 18, 120], [x - 18, 100], [x - 8, 86], [x, 82], [x + 8, 86], [x + 18, 100], [x + 18, 232], [x - 18, 232]], '#0e0820', { depth: 2, hi: '#241a3c', lo: '#08040e' });
      mid.poly([[x - 13, 124], [x - 13, 104], [x - 6, 92], [x, 88], [x + 6, 92], [x + 13, 104], [x + 13, 228], [x - 13, 228]], '#ffcf6a', { hi: '#fff0b0', lo: '#e09a3a', depth: 3 });
      mid.rect(x - 1, 90, 2, 140, '#0e0820'); mid.rect(x - 13, 158, 26, 2, '#0e0820'); mid.rect(x - 11, 126, 5, 28, '#fff3c4');
    }
    for (let x = 28; x < WW; x += 128) { mid.poly([[x - 6, 70], [x + 14, 70], [x + 14, 150], [x + 4, 138], [x - 6, 150]], '#8a1f36', { hi: '#c8405a', lo: '#4a0e1c', depth: 2 }); mid.rect(x - 1, 90, 8, 8, '#ffcf6a'); }
    layers.push({ img: mid.toCanvas(), par: 0.4 });
  } else {
    const far = mk2(), V = ['#1a0810', '#2a0d14', '#44161c'];
    far.rect(0, 266, WW, WH, V[1]);
    wrap3(o => { for (let x = 0; x < WW; x += 160) { const h = 80 + ((R() * 60) | 0); far.poly([[x + o, 270], [x + o + 70 + ((R() * 20) | 0), 270 - h], [x + o + 150, 270]], V[1], { hi: V[2], lo: V[0], depth: 3 }); for (let k = 0; k < 4; k++) { const lx = x + o + 60 + ((R() * 40) | 0), ly = 270 - h + 14 + k * 14; far.rect(lx, ly, 3, 7, '#ff5a2a'); far.px(lx + 1, ly + 1, '#ffd27a'); } } });
    layers.push({ img: far.toCanvas(), par: 0.14 });
    const mid = mk2(), B = ['#160a12', '#25101a', '#3a1822', '#52243a', '#743a52'];
    mid.rect(0, 308, WW, WH, B[1]);
    wrap3(o => {
      for (let x = 30; x < WW; x += 116 + ((R() * 44) | 0)) {
        const h = 120 + ((R() * 100) | 0);
        mid.poly([[x + o - 16, 314], [x + o - 16, 312 - h], [x + o + 16, 312 - h], [x + o + 16, 314]], B[2], { hi: B[4], lo: B[0], depth: 3 });
        mid.rect(x + o - 22, 312 - h - 8, 44, 10, B[3]); mid.rect(x + o - 22, 300, 44, 12, B[3]);
        mid.rect(x + o - 2, 312 - h + 24, 4, 12, '#ff6a2a'); mid.rect(x + o - 2, 312 - h + 60, 4, 8, '#ff6a2a'); mid.rect(x + o - 1, 312 - h + 26, 2, 4, '#ffd27a');
        if (R() < 0.5) for (let k = 0; k < 14; k++) mid.rect(x + o + 22 + ((k / 2) | 0), 312 - h - 4 + k * 6, 4, 4, '#6a6a78');
      }
    });
    layers.push({ img: mid.toCanvas(), par: 0.38 });
  }
  return { sky: skyC, layers, clouds, amb: th.amb, tint: th.tint };
}

// vinheta escura nas bordas (pré-renderizada, resolução do cenário)
let _vig = null;
function vignette() {
  if (_vig && _vig.width === W && _vig.height === H) return _vig;
  const c = mk(W, H), g = c.getContext('2d'), gr = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.62);
  gr.addColorStop(0, 'rgba(8,4,16,0)'); gr.addColorStop(1, 'rgba(8,4,16,0.5)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return (_vig = c);
}
// brilho suave (luzes de tochas, cristais)
const _glow = {};
function glowSprite(col, r) {
  const k = col + r;
  if (_glow[k]) return _glow[k];
  const c = mk(r * 2, r * 2), g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, col); gr.addColorStop(0.4, shade(col, -0.3) + '99'); gr.addColorStop(1, '#00000000');
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
  return (_glow[k] = c);
}

const ATLAS = {}, BG = {};
function atlasOf(name) { return ATLAS[name] || (ATLAS[name] = { name }); }
function bgOf(name) { return BG[name] || (BG[name] = makeBg(name)); }

// ---------- decoração do cenário (sprites de alta resolução) ----------
const LEAF = ['#103c24', '#1b5e34', '#2a8444', '#46aa56', '#7ad272', '#b4ee92'];
const BARK = ['#1c0f08', '#3a2214', '#5a3a22', '#7a5030', '#9a6a40'];
const _deco = {};
function decoSprites(name) {
  if (_deco[name]) return _deco[name];
  const R = rng(THEMES[name].seed * 53), D = {};
  const sp = (w, h, fn) => { const g = new PX(w, h); fn(g); return outline(g.toCanvas(), '#0e0612'); };
  const spN = (w, h, fn) => { const g = new PX(w, h); fn(g); return g.toCanvas(); };      // sem contorno (folhas/grama)
  if (name === 'forest') {
    const blades = ['#1a5a2e', '#2f8f3a', '#52c04e', '#9be36e'];
    D.tuft = [0, 1, 2].map(v => [0, 1].map(f => spN(26, 22, g => {
      const n = 6 + v * 2;
      for (let i = 0; i < n; i++) {
        const x = 2 + ((i * 22 / n) | 0), h = 8 + ((i * 7 + v * 5) % 11), sw = f ? ((i % 2) ? 2 : 0) : ((i % 2) ? 0 : 2);
        for (let y = 0; y < h; y++) { const t = y / h, xx = x + Math.round(sw * t * t); g.px(xx, 21 - y, blades[t > 0.85 ? 3 : t > 0.4 ? 2 : (i % 2 ? 1 : 0)]); g.px(xx + 1, 21 - y, blades[t > 0.6 ? 2 : 0]); }
      }
    })));
    D.flower = ['#ff5a6a', '#ffd23f', '#ffffff', '#7fb0ff'].map(col => [0, 1].map(f => sp(24, 28, g => {
      g.cap(12, 27, 12 + f * 2 - 1, 11, 2, '#2f8a3a', { depth: 0, flat: true });
      g.poly([[12, 20], [4, 17 + f], [9, 22]], '#2f8a3a', { depth: 1 }); g.poly([[12, 17], [20, 14 - f], [14, 20]], '#3fa84a', { depth: 1 });
      const cx = 12 + f * 2 - 1;
      for (let k = 0; k < 5; k++) { const a = k * 1.2566 - 1.57; g.ell(cx + Math.cos(a) * 4.2, 8 + Math.sin(a) * 4.2, 3, 3, col, { depth: 1, hi: toneHi(col, 0.35), lo: toneLo(col, 0.3) }); }
      g.ell(cx, 8, 2.4, 2.4, '#ffe066', { depth: 1, hi: '#fff6b0', lo: '#c98a10' });
    })));
    D.bush = [0, 1].map(v => sp(76, 44, g => {
      for (const [x, y, rx, ry] of [[38, 30, 28, 12], [22, 26, 16, 12], [54, 26, 16, 12], [38, 20, 18, 12]]) g.lit(x, y, rx, ry, LEAF, 11 + v + x, { edge: 0.2 });
      for (let x = 0; x < 76; x++) for (let y = 40; y < 44; y++) g.clear(x, y);
      for (const [x, y] of [[16 + v * 14, 14], [48 - v * 10, 22], [30, 10 + v * 3], [60, 16]]) { g.ell(x, y, 3, 3, '#ff5a6a', { depth: 1, hi: '#ffb0b8', lo: '#a02a3a' }); }
    }));
    D.mush = sp(32, 28, g => {
      g.poly([[12, 14], [20, 14], [19, 27], [13, 27]], '#efe6cc', { hi: '#ffffff', lo: '#b8ad8a', depth: 1 });
      g.lit(16, 12, 13, 9, ['#8a1a1a', '#b02a22', '#e0452e', '#ff7a5a'], 21, { edge: 0.05 });
      g.ell(10, 9, 2.2, 2, '#ffffff', { flat: true }); g.ell(19, 11, 1.8, 1.6, '#ffffff', { flat: true }); g.ell(16, 6, 1.6, 1.4, '#ffffff', { flat: true });
    });
    D.rock = sp(30, 20, g => { g.lit(15, 12, 13, 8, ['#3a3a4a', '#585a6e', '#80839a', '#b0b2c8'], 5, { edge: 0.25 }); for (let x = 0; x < 30; x++) for (let y = 17; y < 20; y++) g.clear(x, y); });
    D.tree = [0, 1].map(v => sp(150, 210, g => {
      const trunk = (x0) => {
        g.poly([[x0 - 14, 208], [x0 - 7, 170], [x0 - 6, 100], [x0 + 6, 100], [x0 + 7, 170], [x0 + 14, 208]], BARK[2], { hi: BARK[4], lo: BARK[0], depth: 3 });
        for (let y = 100; y < 208; y += 1) for (let x = x0 - 14; x <= x0 + 14; x++) if (g.has(x, y) && pn(x * 1.5, y * 0.18, 2, 4096, 9) > 0.7) g.px(x, y, BARK[1]);
        g.poly([[x0 - 14, 208], [x0 - 26, 210], [x0 - 12, 196]], BARK[2], { hi: BARK[3], lo: BARK[0], depth: 2 }); g.poly([[x0 + 14, 208], [x0 + 28, 210], [x0 + 12, 198]], BARK[2], { hi: BARK[3], lo: BARK[0], depth: 2 });
        g.poly([[x0 - 6, 140], [x0 - 26, 124], [x0 - 26, 132], [x0 - 5, 152]], BARK[2], { hi: BARK[3], lo: BARK[0], depth: 2 });
      };
      trunk(75);
      for (const [x, y, rx, ry] of [[75, 66, 54, 46], [36, 96, 36, 32], [114, 96, 36, 32], [75, 112, 42, 30], [70, 36, 38, 30], [106, 56, 28, 24], [44, 60, 28, 24]]) g.lit(x, y, rx, ry, LEAF, 41 + v * 9 + x, { edge: 0.2, speckle: 0.025 });
      for (let i = 0; i < 22; i++) { const x = 18 + ((R() * 114) | 0), y = 16 + ((R() * 110) | 0); if (g.has(x, y)) { g.px(x, y, LEAF[5]); g.px(x + 1, y, LEAF[4]); } }
      if (v) for (const [x, y] of [[48, 56], [100, 70], [76, 104], [30, 98], [112, 106]]) g.ell(x, y, 3.4, 3.4, '#ff5a6a', { depth: 1, hi: '#ffc0c8', lo: '#9a2030' });
      g.tint(0, 0, 150, 210, '#bfe3d8', 0.12);        // leve névoa: a árvore não disputa com o herói
    }));
    D.sign = sp(40, 46, g => { g.poly([[18, 20], [23, 20], [23, 45], [18, 45]], BARK[2], { hi: BARK[4], lo: BARK[0], depth: 1 }); g.poly([[2, 4], [37, 4], [39, 8], [39, 20], [2, 20]], BARK[3], { hi: '#c89a62', lo: BARK[1], depth: 2 }); g.rect(7, 10, 24, 2, BARK[1]); g.rect(7, 14, 16, 2, BARK[1]); });
  } else if (name === 'cave') {
    const crystal = (cs) => sp(48, 56, g => {
      for (const [dx, h, w] of [[22, 50, 11], [6, 28, 8], [34, 34, 9], [27, 18, 7]]) {
        g.poly([[dx - w, 55], [dx - w + 2, 55 - h + 8], [dx, 55 - h], [dx + w - 2, 55 - h + 8], [dx + w, 55]], cs[0], { hi: cs[1], lo: cs[2], depth: 3 });
        g.line(dx - 2, 55 - h + 6, dx - 2, 50, '#ffffff');
      }
    });
    D.crystal = [['#7a6aff', '#c8bfff', '#3a2fb0'], ['#ff6ad0', '#ffc0f0', '#a01e80'], ['#3fd0ff', '#c0f4ff', '#1a80b0']].map(cs => ({ img: crystal(cs), glow: cs[0] }));
    D.shroom = [0, 1].map(f => sp(32, 26, g => {
      g.poly([[14, 12], [18, 12], [18, 25], [14, 25]], '#b8e8ff', { hi: '#ffffff', lo: '#5aa0c0', depth: 1 });
      g.lit(16, 10, 12, 8, ['#1a6a9a', '#2aa0d0', '#5ad0f8', '#c0f4ff'], 77, { edge: 0.06 }); g.ell(8, 22, 5, 3, '#7a6aff', { hi: '#c8bfff', lo: '#3a2fb0', depth: 1 });
      g.ell(10, 7, 1.8, 1.6, '#ffffff', { flat: true }); g.ell(19 + f, 9, 1.4, 1.2, '#ffffff', { flat: true });
    }));
    D.stalag = [0, 1].map(v => sp(40, 52 + v * 16, g => { const h = 52 + v * 16; g.poly([[4, h - 1], [20, 1 + v * 2], [36, h - 1]], '#40447a', { hi: '#7a80c0', lo: '#1c1c40', depth: 3 }); g.line(20, 6, 14, h - 6, '#2a2c58'); }));
    D.rocks = sp(40, 22, g => { g.lit(11, 14, 10, 7, ['#14143a', '#2a2c58', '#4a4e90', '#7c82c8'], 88, { edge: 0.24 }); g.lit(27, 13, 12, 8, ['#14143a', '#2a2c58', '#4a4e90', '#7c82c8'], 89, { edge: 0.24 }); for (let x = 0; x < 40; x++) for (let y = 19; y < 22; y++) g.clear(x, y); });
  } else if (name === 'castle') {
    D.torch = [0, 1, 2].map(f => sp(30, 64, g => {
      g.poly([[12, 26], [17, 26], [17, 61], [12, 61]], '#5a5a78', { hi: '#9a9ab8', lo: '#2a2a40', depth: 1 }); g.poly([[6, 54], [23, 54], [25, 63], [4, 63]], '#3a3a52', { hi: '#6a6a88', lo: '#1a1a28', depth: 1 });
      g.poly([[7, 14], [22, 14], [20, 28], [9, 28]], '#6a4a2a', { hi: '#a87a42', lo: '#2a1a0a', depth: 1 });
      const fl = [[0, 0], [1, -2], [-1, -1]][f];
      g.poly([[8, 14], [10 + fl[0], 2 + fl[1]], [15, 2 + fl[1] * 2], [20 + fl[0], 2], [22, 14]], '#ff7a2a', { hi: '#ffb04a', lo: '#c23a1a', depth: 2 });
      g.poly([[11, 14], [14 + fl[0], 5], [18, 14]], '#ffd27a', { flat: true }); g.poly([[13, 14], [15, 9], [17, 14]], '#fff6c8', { flat: true });
    }));
    D.column = sp(34, 58, g => { g.poly([[5, 6], [29, 6], [29, 54], [5, 54]], '#7a7a96', { hi: '#b4b4d0', lo: '#3a3a52', depth: 3 }); g.poly([[0, 0], [34, 0], [34, 8], [0, 8]], '#9898b4', { hi: '#d4d4ec', lo: '#4a4a62', depth: 2 }); g.poly([[0, 50], [34, 50], [34, 58], [0, 58]], '#9898b4', { hi: '#d4d4ec', lo: '#4a4a62', depth: 2 }); g.line(14, 14, 16, 30, '#3a3a52'); g.line(16, 30, 22, 34, '#3a3a52'); for (let x = 17; x < 34; x++) for (let y = 0; y < 14; y++) g.clear(x, y); });
    D.bones = sp(40, 18, g => { g.poly([[4, 10], [20, 8], [20, 14], [4, 15]], '#ece8d6', { hi: '#ffffff', lo: '#a8a28a', depth: 1 }); g.ell(26, 9, 8, 7, '#ece8d6', { hi: '#ffffff', lo: '#a8a28a', depth: 2 }); g.rect(22, 6, 3, 4, '#1b1423'); g.rect(28, 6, 3, 4, '#1b1423'); g.rect(24, 12, 5, 2, '#1b1423'); g.ell(4, 11, 3, 3, '#ece8d6', { depth: 1 }); });
    D.flag = [0, 1].map(f => sp(40, 78, g => { g.poly([[4, 0], [8, 0], [8, 78], [4, 78]], '#7a7a96', { hi: '#b4b4d0', lo: '#3a3a52', depth: 1 }); g.ell(6, 3, 4, 4, '#ffcf6a', { hi: '#fff0a0', lo: '#b8862a', depth: 1 }); const pts = [[8, 8]]; for (let i = 0; i <= 8; i++) pts.push([8 + i * 3.6, 8 + Math.sin(i * 0.8 + f * 1.6) * 3]); for (let i = 8; i >= 0; i--) pts.push([8 + i * 3.6, 36 + Math.sin(i * 0.8 + f * 1.6) * 3 - (i > 6 ? (i - 6) * 3 : 0)]); g.poly(pts, '#8a1f36', { hi: '#d04a66', lo: '#4a0e1c', depth: 2 }); g.rect(16, 16 + f * 2, 8, 8, '#ffcf6a'); }));
  } else {
    D.torch = [0, 1, 2].map(f => sp(30, 64, g => {
      g.poly([[12, 26], [17, 26], [17, 61], [12, 61]], '#5a2a38', { hi: '#9a4a5c', lo: '#240c14', depth: 1 }); g.poly([[6, 54], [23, 54], [25, 63], [4, 63]], '#3a1822', { hi: '#6a2a3c', lo: '#14060c', depth: 1 });
      g.poly([[7, 14], [22, 14], [20, 28], [9, 28]], '#4a2a2a', { hi: '#7a4a4a', lo: '#1a0c0c', depth: 1 });
      const fl = [[0, 0], [1, -2], [-1, -1]][f];
      g.poly([[8, 14], [10 + fl[0], 2 + fl[1]], [15, 2 + fl[1] * 2], [20 + fl[0], 2], [22, 14]], '#ff3a1a', { hi: '#ff8a2a', lo: '#a01a0a', depth: 2 });
      g.poly([[11, 14], [14 + fl[0], 5], [18, 14]], '#ffd27a', { flat: true }); g.poly([[13, 14], [15, 9], [17, 14]], '#fff6c8', { flat: true });
    }));
    D.shard = [0, 1].map(v => sp(36, 56 + v * 14, g => { const h = 56 + v * 14; g.poly([[4, h - 1], [18, 1], [32, h - 1]], '#2e1a26', { hi: '#6a4054', lo: '#0e060c', depth: 3 }); g.line(18, 6, 12, h - 8, '#ff5a2a'); g.line(19, 10, 14, h - 14, '#ffb04a'); }));
    D.bones = sp(40, 18, g => { g.poly([[4, 10], [20, 8], [20, 14], [4, 15]], '#d8d0b8', { hi: '#f4eed8', lo: '#8a8470', depth: 1 }); g.ell(26, 9, 8, 7, '#d8d0b8', { hi: '#f4eed8', lo: '#8a8470', depth: 2 }); g.rect(22, 6, 3, 4, '#1b1423'); g.rect(28, 6, 3, 4, '#1b1423'); });
    D.chain = sp(16, 60, g => { for (let i = 0; i < 10; i++) g.ell(8, 3 + i * 6, i % 2 ? 4 : 2.4, 3.4, i % 2 ? '#8a8a9c' : '#5a5a6c', { hi: '#c8c8d8', lo: '#2a2a38', depth: 1 }); });
  }
  return (_deco[name] = D);
}

// Monta a lista de decorações e luzes de uma fase
function buildDecor(lv, name) {
  const D = decoSprites(name), items = [], lights = [];
  const top = tx => { for (let y = 0; y < lv.h; y++) { const t = lv.tiles[y][tx]; if (t === 1 || t === 5) return y; if (t === 2 || t === 4) return -1; } return -1; };
  const add = o => items.push(o);
  const seed = THEMES[name].seed;
  let lastTree = -99, lastBig = -99;
  for (let tx = 2; tx < lv.w - 1; tx++) {
    const ty = top(tx);
    if (ty < 1) continue;
    let nearSpike = false;
    for (let k = -2; k <= 2; k++) for (let j = -1; j <= 0; j++) if (lv.tiles[ty + j] && lv.tiles[ty + j][tx + k] === 3) nearSpike = true;
    if (nearSpike) continue;                              // nada de caixote escondendo espinhos
    const flat = tx > 0 && tx < lv.w - 1 && top(tx - 1) === ty && top(tx + 1) === ty;
    const r = hash2(tx, ty, seed), r2 = hash2(tx * 3, ty, seed + 9), x = tx * T + 8, y = ty * T + 2;
    if (name === 'forest') {
      if (flat && tx - lastTree > 14 && r < 0.14) { add({ spr: [D.tree[(r2 * 2) | 0]], x, y: y + 2, layer: 'back' }); lastTree = tx; }
      else if (flat && tx - lastBig > 5 && r < 0.4 && r2 < 0.4) { add({ spr: [D.bush[((r2 * 5) | 0) % 2]], x, y: y + 2, layer: 'back' }); lastBig = tx; }
      if (r2 > 0.78) add({ spr: D.flower[(r * 4) | 0], x: x + ((r2 * 7) | 0) - 3, y: y + 1, layer: 'mid', sway: true });
      else if (r2 > 0.5 && r > 0.45) add({ spr: D.tuft[(r2 * 3) | 0], x: x + ((r * 6) | 0) - 3, y: y + 2, layer: 'front', sway: true });
      else if (r > 0.93) add({ spr: [D.mush], x, y: y + 1, layer: 'mid' });
      else if (r > 0.88) add({ spr: [D.rock], x, y: y + 1, layer: 'mid' });
      else if (flat && r > 0.855 && r < 0.865) add({ spr: [D.sign], x, y: y + 1, layer: 'back' });
    } else if (name === 'cave') {
      if (flat && r < 0.14) { const cr = D.crystal[(r2 * 3) | 0]; add({ spr: [cr.img], x, y: y + 2, layer: 'back' }); lights.push({ x, y: y - 14, r: 36, col: cr.glow, a: 0.5 }); }
      else if (r < 0.3 && r > 0.2) { add({ spr: D.shroom, x, y: y + 1, layer: 'mid', sway: true, slow: true }); lights.push({ x, y: y - 7, r: 16, col: '#3fd0ff', a: 0.35 }); }
      else if (r > 0.9) add({ spr: [D.stalag[(r2 * 2) | 0]], x, y: y + 2, layer: 'back' });
      else if (r > 0.78) add({ spr: [D.rocks], x, y: y + 1, layer: 'mid' });
    } else if (name === 'castle') {
      if (flat && tx - lastTree > 7 && r < 0.17) { add({ spr: D.torch, x, y: y + 1, layer: 'back', sway: true, fast: true }); lights.push({ x, y: y - 24, r: 48, col: '#ff9a3a', a: 0.55, flick: true }); lastTree = tx; }
      else if (r2 > 0.9 && r < 0.4) add({ spr: [D.column], x, y: y + 1, layer: 'back' });
      else if (r > 0.72 && r < 0.78) add({ spr: [D.bones], x, y: y + 1, layer: 'mid' });
      else if (flat && tx - lastBig > 14 && r > 0.3 && r < 0.34) { add({ spr: D.flag, x, y: y + 1, layer: 'back', sway: true, slow: true }); lastBig = tx; }
    } else {
      if (flat && tx - lastTree > 6 && r < 0.22) { add({ spr: D.torch, x, y: y + 1, layer: 'back', sway: true, fast: true }); lights.push({ x, y: y - 24, r: 52, col: '#ff4a1a', a: 0.6, flick: true }); lastTree = tx; }
      else if (r > 0.82) add({ spr: [D.shard[(r2 * 2) | 0]], x, y: y + 2, layer: 'back' });
      else if (r > 0.7 && r < 0.75) add({ spr: [D.bones], x, y: y + 1, layer: 'mid' });
    }
  }
  for (let ty = 1; ty < lv.h; ty++) for (let tx = 0; tx < lv.w; tx++) {
    if (lv.tiles[ty][tx] !== 2 || lv.tiles[ty - 1][tx]) continue;
    const r = hash2(tx, ty, seed + 31);
    if (name === 'forest' && r < 0.35) add({ spr: D.tuft[((r * 8) | 0) % 3], x: tx * T + 8, y: ty * T + 3, layer: 'front', sway: true });
    if (name === 'cave' && r < 0.2) { const cr = D.crystal[((r * 15) | 0) % 3]; add({ spr: [cr.img], x: tx * T + 8, y: ty * T + 3, layer: 'mid' }); lights.push({ x: tx * T + 8, y: ty * T - 12, r: 28, col: cr.glow, a: 0.4 }); }
  }
  return { items, lights };
}
