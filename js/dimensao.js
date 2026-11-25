'use strict';
// ---------- Dimensão Prisma: cenário próprio e criaturas de cristal ----------
// Cenário (BG_BUILD / DECO_BUILD / DECOR_PLACE 'prisma'): um vazio estrelado com uma faixa de arco-íris, ilhas de rocha
// flutuando com cristais e torres de cristal facetadas, tudo na cor do cristal da fase (THEMES.prismaN.gem, js/cristais.js).
// Criaturas: nas fases da dimensão todo inimigo comum vira cristal (skin 'crisN': ver skinOf em js/fauna.js) e aparecem
// 4 novas, todas derrotáveis com golpes ou pisões:
//   caquinho (shard)  ·  pulinhos curtos e um salto grande que estilhaça lascas rasteiras ao cair (pule as lascas)
//   vigia (prism)     ·  flutua na altura do herói, mira (linha piscando) e dispara um raio reto (pule ou se afaste)
//   geodo (geode)     ·  anda devagar, se enrola e rola cheio de espinhos (não dá para pisar); bate na parede e fica tonto
//   oráculo (oracle)  ·  faz brotar espinhos de cristal do chão embaixo do herói (marca brilhando antes) e some/reaparece se chegam perto
const RAINBOW = CRISTAIS.map(c => c.cor[1]);
const gemOfTheme = th => (th && th.gem) || CRISTAIS[0].cor;          // [escuro, médio, claro, branco]

// torre de cristal facetada, ponta para cima: face clara, frente e face escura (chapadas) + reflexos
function crysSpire(g, x, base, h, w, C, tilt = 0) {
  if (w < 1.5 || h < 4) return;
  const tip = base - h, sh = tip + Math.min(h * 0.45, w * 0.9), t = tilt, a = w * 0.35;
  g.poly([[x - w, base], [x - w + t * 0.6, sh], [x - a + t, tip + a], [x - a, base]], C[2], { flat: true });
  g.poly([[x - a, base], [x - a + t, tip + a], [x + t, tip], [x + a + t, tip + a], [x + a, base]], C[1], { flat: true });
  g.poly([[x + a, base], [x + a + t, tip + a], [x + w + t * 0.6, sh], [x + w, base]], C[0], { flat: true });
  g.line(x - w * 0.68 + t * 0.5, sh + 2, x - w * 0.68, base - 2, C[3]);
  g.line(x - a + t, tip + a, x + t, tip, C[3]);
}
// ilha de rocha flutuando: topo reto, fundo em cone irregular, lascas penduradas e cristais em cima
function crysIsle(g, x, y, rx, R, C, rock, o = {}) {
  const pts = [[x - rx, y]], n = 7;
  for (let i = 1; i < n; i++) { const t = i / n; pts.push([x - rx + 2 * rx * t, y + Math.sin(t * Math.PI) * rx * (0.7 + R() * 0.6) + 2]); }
  pts.push([x + rx, y]);
  g.poly(pts, rock[1], { hi: rock[2], lo: rock[0], depth: 2 });
  g.rect(x - rx, y - 1, rx * 2, 2, rock[3]);
  for (let k = 0; k < 3; k++) {                                         // lascas penduradas
    const sx = x + (R() - 0.5) * rx, top = y + rx * 0.35, len = 4 + R() * rx * 0.7;
    g.poly([[sx - 2.5, top], [sx + 2.5, top], [sx, top + len + rx * 0.3]], k % 2 ? C[0] : C[1], { flat: true });
  }
  const spots = o.sides ? [-0.7, 0.62, 0.82] : [(R() - 0.5) * 1.2, (R() - 0.5) * 1.2, (R() - 0.5) * 0.6];
  for (const s of spots) crysSpire(g, x + s * rx, y, rx * (0.45 + R() * 0.7), 2 + R() * Math.max(2, rx * 0.16), C, (R() - 0.5) * 4);
}

// ---------- Fundo ----------
BG_BUILD.prisma = th => {
  const b = bgBase(th), R = b.R, C = gemOfTheme(th), sg = b.sg;
  for (let i = 0; i < 160; i++) {                                       // estrelas
    const x = R() * BGW, y = R() * BGH * 0.82, k = R();
    sg.globalAlpha = 0.25 + k * 0.6; sg.fillStyle = k > 0.84 ? RAINBOW[(R() * 7) | 0] : '#ffffff';
    const s = k > 0.94 ? 1 : 0.5; sg.fillRect(Math.round(x * 2) / 2, Math.round(y * 2) / 2, s, s);
  }
  for (let i = 0; i < 7; i++) {                                         // faixa de arco-íris ondulando pelo céu
    sg.globalAlpha = 0.11; sg.fillStyle = RAINBOW[i]; sg.beginPath();
    const yy = x => 34 + i * 3.4 + Math.sin(x * 0.02 + 1) * 16 + Math.sin(x * 0.05) * 5;
    sg.moveTo(0, yy(0)); for (let x = 0; x <= BGW; x += 4) sg.lineTo(x, yy(x));
    for (let x = BGW; x >= 0; x -= 4) sg.lineTo(x, yy(x) + 3.6);
    sg.closePath(); sg.fill();
  }
  sg.globalAlpha = 1;
  for (let i = 0; i < 7; i++) b.disc(R() * BGW, 20 + R() * 100, 22 + R() * 40, i % 2 ? C[1] : C[2], 0.05);   // nebulosa
  // "sol" da dimensão: um prisma hexagonal brilhando ao longe
  const hx = 240, hy = 46, hex = (r, col, a) => { sg.globalAlpha = a; sg.fillStyle = col; sg.beginPath(); for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3 + Math.PI / 6; sg[k ? 'lineTo' : 'moveTo'](hx + Math.cos(an) * r, hy + Math.sin(an) * r * 1.15); } sg.closePath(); sg.fill(); sg.globalAlpha = 1; };
  b.disc(hx, hy, 48, C[2], 0.06); b.disc(hx, hy, 32, C[2], 0.1);
  hex(15, C[1], 0.9); hex(11, C[2], 0.95); hex(6, C[3], 1);
  sg.globalAlpha = 0.9; sg.fillStyle = '#ffffff'; sg.fillRect(hx - 5, hy - 9, 1, 8); sg.globalAlpha = 1;
  const haze = mix('#06040e', C[0], 0.5);
  // ilhas flutuantes ao longe
  const far = b.mk2(), rockF = ['#0c0818', '#181230', '#261e48', '#3a2e66'].map(c => mix(c, C[0], 0.25));
  wrap3(o => { for (let x = 20; x < WW; x += 70 + ((R() * 80) | 0)) crysIsle(far, x + o, 80 + ((R() * 150) | 0), 12 + R() * 22, R, C, rockF); });
  far.tint(0, 0, WW, WH, haze, 0.52);
  b.layers.push({ img: far.toCanvas(), par: 0.06 });
  // torres de cristal gigantes
  const mid = b.mk2();
  wrap3(o => { for (let x = 0; x < WW; x += 44 + ((R() * 64) | 0)) crysSpire(mid, x + o, WH + 4, 90 + ((R() * 170) | 0), 9 + R() * 14, C, (R() - 0.5) * 18); });
  mid.tint(0, 0, WW, WH, haze, 0.46);
  b.layers.push({ img: mid.toCanvas(), par: 0.16 });
  // chão de rocha com cachos de cristal
  const near = b.mk2(), rockN = ['#0a0614', '#16102a', '#241a42', '#34285c'].map(c => mix(c, C[0], 0.2));
  near.rect(0, 318, WW, WH - 318, rockN[1]);
  wrap3(o => {
    for (let x = 0; x < WW; x += 10 + ((R() * 12) | 0)) near.ell(x + o, 319, 8 + R() * 10, 3 + R() * 5, rockN[2], { hi: rockN[3], lo: rockN[0], depth: 1 });
    for (let x = 10; x < WW; x += 46 + ((R() * 60) | 0)) { const n = 2 + ((R() * 3) | 0); for (let k = 0; k < n; k++) crysSpire(near, x + o + (k - n / 2) * 9, 322, 20 + R() * 46, 3.5 + R() * 5, C, (R() - 0.5) * 10); }
  });
  near.tint(0, 0, WW, WH, haze, 0.2);
  b.layers.push({ img: near.toCanvas(), par: 0.32 });
  return b.done();
};

// ---------- Decoração da fase ----------
DECO_BUILD.prisma = (D, sp, spN, R, th) => {
  const C = gemOfTheme(th), rock = ['#120c22', '#241a3c', '#3a2e5a', '#54467c'].map(c => mix(c, C[0], 0.25));
  D.glow = C[2];
  D.cluster = [0, 1, 2].map(v => sp(60, 70, g => {
    const spec = [[[30, 62, 9], [17, 36, 6], [43, 42, 6]], [[24, 48, 8], [38, 32, 6], [12, 24, 5]], [[30, 66, 8], [18, 42, 6], [43, 28, 5], [8, 18, 4]]][v];
    for (const [x, h, w] of spec) crysSpire(g, x, 69, h, w, C, (x - 30) * 0.22);
    g.ell(30, 68, 22, 3, rock[1], { hi: rock[2], lo: rock[0], depth: 1 });
  }));
  D.pillar = sp(40, 84, g => {                                            // coluna-prisma partida
    g.poly([[6, 83], [6, 20], [14, 12], [14, 83]], C[2], { flat: true });
    g.poly([[14, 83], [14, 12], [20, 18], [27, 9], [27, 83]], C[1], { flat: true });
    g.poly([[27, 83], [27, 9], [34, 16], [34, 83]], C[0], { flat: true });
    g.line(10, 24, 10, 80, C[3]); g.line(14, 12, 20, 18, C[3]); g.line(20, 18, 27, 9, C[3]);
    for (const y of [36, 60]) { g.rect(6, y, 28, 2, C[0]); g.rect(6, y - 1, 28, 1, C[3]); }
    g.poly([[2, 83], [38, 83], [36, 76], [4, 76]], rock[2], { hi: rock[3], lo: rock[0], depth: 1 });
  });
  D.rocks = sp(44, 26, g => {
    g.lit(13, 18, 11, 7, rock, 88, { edge: 0.24 }); g.lit(30, 17, 12, 8, rock, 89, { edge: 0.24 });
    crysSpire(g, 20, 15, 12, 3, C, -1); crysSpire(g, 34, 13, 9, 2.4, C, 1);
    for (let x = 0; x < 44; x++) for (let y = 23; y < 26; y++) g.clear(x, y);
  });
  D.grass = [0, 1].map(f => spN(28, 16, g => {                           // "capim" de lascas finas
    for (let i = 0; i < 7; i++) { const x = 2 + i * 3.6, h = 4 + ((i * 5 + f * 3) % 9), lean = (f ? 1 : -1) * (i % 2); g.line(x, 15, x + lean, 15 - h, i % 2 ? C[2] : C[1]); g.px(x + lean, 15 - h, C[3]); }
  }));
  D.orb = [0, 1].map(f => sp(24, 34, g => {                               // prisma flutuando acima do chão
    const y = 10 + f;
    g.poly([[12, y - 9], [20, y], [12, y + 9], [4, y]], C[1], { flat: true });
    g.poly([[12, y - 9], [4, y], [12, y + 9]], C[2], { flat: true }); g.poly([[12, y + 9], [20, y], [14, y + 1]], C[0], { flat: true });
    g.line(12, y - 8, 6, y, C[3]);
    for (let x = 6; x < 18; x++) g.px(x, 32, mix(C[0], '#000000', 0.4));
  }));
};
DECOR_PLACE.prisma = o => {
  const { D, add, lights, x, y, r, r2, flat, tx, last } = o;
  if (flat && tx - (last.c || -99) > 6 && r < 0.16) { add({ spr: [D.cluster[(r2 * 3) | 0]], x, y: y + 2, layer: 'back' }); lights.push({ x, y: y - 16, r: 40, col: D.glow, a: 0.5 }); last.c = tx; }
  else if (flat && tx - (last.p || -99) > 20 && r > 0.95) { add({ spr: [D.pillar], x, y: y + 2, layer: 'back' }); lights.push({ x, y: y - 30, r: 30, col: D.glow, a: 0.3 }); last.p = tx; }
  else if (r2 > 0.8) add({ spr: D.grass, x: x + ((r * 6) | 0) - 3, y: y + 2, layer: 'front', sway: true });
  else if (r > 0.86) add({ spr: [D.rocks], x, y: y + 1, layer: 'mid' });
  else if (flat && r > 0.3 && r < 0.35) { add({ spr: D.orb, x, y: y + 2, layer: 'mid', sway: true, slow: true }); lights.push({ x, y: y - 14, r: 20, col: D.glow, a: 0.4 }); }
};

// ---------- Inimigos cristalizados ----------
// skin 'crisN': os tons do sprite viram os 4 tons do cristal, com faixas diagonais de "facetas"; contorno no tom escuro.
// Olhos e brilhos muito saturados ficam como eram (a criatura continua "olhando").
CRISTAIS.forEach((c, i) => { SKIN_FX['cris' + (i + 1)] = { crys: c.cor }; });
const CRYS_NATIVE = new Set(['shard', 'prism', 'geode', 'oracle']);      // já nascem de cristal: não recolore
function crysSkin(img, cor, cache) {
  const c = mk(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data, P = cor.map(C), wd = c.width, ed = C(mix('#05030f', cor[0], 0.45));
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const [, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
    if (l < 0.11) { d[i] = ed[0]; d[i + 1] = ed[1]; d[i + 2] = ed[2]; continue; }
    if (s > 0.72 && l > 0.32 && l < 0.82) continue;
    const p = i >> 2, x = p % wd, y = (p / wd) | 0;
    let k = l < 0.28 ? 0 : l < 0.48 ? 1 : l < 0.7 ? 2 : 3;
    if ((x + y) % 14 < 2) k = Math.min(3, k + 1);                        // faceta clara
    else if ((x * 2 - y + 999) % 21 === 0) k = Math.max(0, k - 1);      // aresta escura
    const o = P[k]; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
  }
  g.putImageData(id, 0, 0); cache.set(img, c);
  return c;
}
// brilho que pisca de vez em quando em cima de cada criatura de cristal
function crysGlint(g, w, e, cx, cy) {
  const ph = (w.t * 1.1 + (e.id % 17) * 0.37) % 2.4;
  if (ph > 0.4) return;
  const k = ph < 0.2 ? ph / 0.2 : (0.4 - ph) / 0.2, n = Math.floor(w.t / 2.4 + e.id);
  const x = Math.round(e.x + hash2(n, e.id, 3) * e.w - cx), y = Math.round(e.y + hash2(e.id, n, 5) * e.h * 0.7 - cy), r = Math.round(k * 2.5);
  g.fillStyle = '#ffffff'; g.fillRect(x, y - r, 1, r * 2 + 1); g.fillRect(x - r, y, r * 2 + 1, 1);
}
// criatura de cristal derrotada: estilhaça
function crysShatter(w, e) {
  const C = gemOfTheme(w.th);
  burst(w, cxOf(e), cyOf(e), C[2], 12, 120, 0.6); burst(w, cxOf(e), cyOf(e), C[3], 6, 80, 0.4, 0);
  asOwner(null, () => sfx('shatter'));
}

// ---------- Criaturas novas ----------
Object.assign(ENEMIES, {
  shard:  { w: 12, h: 12, hp: 2, speed: 0,  stomp: true, coin: 1, xp: 4 },
  prism:  { w: 14, h: 14, hp: 3, speed: 34, stomp: true, coin: 2, xp: 6, fly: true },
  geode:  { w: 18, h: 14, hp: 5, speed: 20, stomp: true, coin: 3, xp: 9 },
  oracle: { w: 12, h: 22, hp: 4, speed: 14, stomp: true, coin: 3, xp: 9 },
});
FLYERS.add('prism');
Object.assign(ENEMY_YOFF, { prism: 4 });
const EYE = '#1b1423';

// Caquinho: cristal de 6 faces com perninhas. pose: sit (2 quadros) | air | land
function shardSprite(pose, f, C) {
  const g = new PX(40, 40), cx = 20, bot = 33;
  const sq = pose === 'land' ? 0.78 : pose === 'air' ? 1.14 : f ? 0.93 : 1, wd = pose === 'land' ? 11 : pose === 'air' ? 8 : 9;
  const H = 23 * sq, top = bot - H, m1 = top + H * 0.26, m2 = top + H * 0.8;
  if (pose === 'air') { g.rect(cx - 6, bot - 2, 3, 4, C[0]); g.rect(cx + 3, bot - 2, 3, 4, C[0]); }
  else { g.rect(cx - 7, bot - 1, 3, 6, C[0]); g.rect(cx + 4, bot - 1, 3, 6, C[0]); g.rect(cx - 8, bot + 4, 4, 2, C[0]); g.rect(cx + 4, bot + 4, 4, 2, C[0]); }
  g.poly([[cx, top], [cx + wd, m1], [cx + wd, m2], [cx, bot], [cx - wd, m2], [cx - wd, m1]], C[1], { hi: C[2], lo: C[0], depth: 2 });
  g.poly([[cx, top], [cx - wd, m1], [cx - wd, m2], [cx - 1, bot - 1], [cx - 1, top + 3]], C[2], { flat: true });
  g.line(cx - wd + 2, m1 + 2, cx - wd + 2, m2 - 2, C[3]); g.line(cx, top + 1, cx - wd + 1, m1, C[3]);
  const ey = Math.round(top + H * 0.42);
  g.rect(cx - 5, ey, 4, 5, '#ffffff'); g.rect(cx + 2, ey, 4, 5, '#ffffff'); g.rect(cx - 3, ey + 1, 2, 3, EYE); g.rect(cx + 4, ey + 1, 2, 3, EYE);
  if (pose === 'air') g.rect(cx - 1, ey + 7, 4, 3, EYE); else g.rect(cx - 1, ey + 7, 4, 1, C[0]);
  return outline(g.toCanvas(), INK);
}
// Vigia prismático: octaedro que gira, com um olho no meio. pose: idle (4 quadros) | aim
function prismSprite(pose, f, C) {
  const g = new PX(40, 40), cx = 20, cy = 20, rg = cx + [-5, 0, 5, 0][f], aim = pose === 'aim';
  g.poly([[cx, 3], [33, cy], [cx, 37], [7, cy]], C[1], { flat: true });
  g.poly([[cx, 3], [rg, cy], [7, cy]], C[3], { flat: true });              // faces de cima (luz de cima)
  g.poly([[cx, 3], [33, cy], [rg, cy]], C[2], { flat: true });
  g.poly([[7, cy], [rg, cy], [cx, 37]], C[1], { flat: true });
  g.poly([[rg, cy], [33, cy], [cx, 37]], C[0], { flat: true });
  g.line(7, cy, 33, cy, C[3]);
  g.ell(cx + 2, cy, 6, 5, aim ? '#ffffff' : '#f4f0ff', { flat: true });
  g.ell(cx + 4, cy, 3, aim ? 3 : 2.5, aim ? '#ff3a5a' : EYE, { flat: true }); g.px(cx + 3, cy - 2, '#ffffff');
  for (const s of [-1, 1]) { const ox = cx + s * (16 + (f % 2)), oy = cy - 9 + s * 3 + (f > 1 ? 1 : 0); g.poly([[ox, oy - 3], [ox + 2, oy], [ox, oy + 3], [ox - 2, oy]], C[2], { flat: true }); }
  return outline(g.toCanvas(), INK);
}
// Geodo: tatu de pedra com a casca aberta cheia de cristais. pose: walk (2) | curl | ball (4, rolando) | dizzy
function geodeSprite(pose, f, C) {
  const g = new PX(56, 40), rock = ['#1e1828', '#3a3048', '#5a4c6a', '#7a6c8c'];
  if (pose === 'ball' || pose === 'curl') {
    const cx = 26, cy = 23, r = 13, a0 = pose === 'curl' ? -0.6 : -f * Math.PI / 2;
    for (let k = 0; k < 5; k++) {                                         // espinhos de cristal para fora
      const a = a0 + k * Math.PI * 2 / 5, c = Math.cos(a), s = Math.sin(a);
      g.poly([[cx + c * 19, cy + s * 19], [cx + Math.cos(a + 0.45) * 10, cy + Math.sin(a + 0.45) * 10], [cx + Math.cos(a - 0.45) * 10, cy + Math.sin(a - 0.45) * 10]], k % 2 ? C[2] : C[1], { hi: C[3], lo: C[0], depth: 1 });
    }
    g.ell(cx, cy, r, r, rock[1], { hi: rock[2], lo: rock[0], depth: 2 });
    g.line(cx + Math.cos(a0 + 2) * 10, cy + Math.sin(a0 + 2) * 10, cx + Math.cos(a0 + 3.5) * 9, cy + Math.sin(a0 + 3.5) * 9, rock[0]);
    if (pose === 'curl') { g.rect(cx + 6, cy - 3, 3, 3, '#ffffff'); g.px(cx + 8, cy - 2, EYE); }
  } else {
    const cx = 24, base = 38, bob = pose === 'walk' ? f : 0;
    for (let k = 0; k < 3; k++) g.rect(cx - 12 + k * 10, base - 5 + ((k + f) % 2 && pose === 'walk' ? -1 : 0), 5, 5, rock[0]);
    g.ell(cx, base - 12 - bob, 17, 10, rock[1], { hi: rock[3], lo: rock[0], depth: 2 });
    g.ell(cx - 1, base - 19 - bob, 11, 4, C[0], { flat: true });
    crysSpire(g, cx - 6, base - 17 - bob, 9, 2.6, C, -2); crysSpire(g, cx + 1, base - 17 - bob, 14, 3.2, C, 0); crysSpire(g, cx + 7, base - 17 - bob, 8, 2.4, C, 2);
    g.ell(cx + 18, base - 10 - bob, 7, 6, rock[2], { hi: rock[3], lo: rock[0], depth: 1 });
    if (pose === 'dizzy') { g.rect(cx + 18, base - 13 - bob, 3, 1, EYE); g.rect(cx + 19, base - 14 - bob, 1, 3, EYE); }
    else { g.rect(cx + 18, base - 14 - bob, 4, 4, '#ffffff'); g.rect(cx + 20, base - 13 - bob, 2, 2, EYE); }
    g.rect(cx + 21, base - 8 - bob, 3, 1, rock[0]);
  }
  return outline(g.toCanvas(), INK);
}
// Oráculo: figura de manto de cristal, cabeça hexagonal e um prisma flutuando em cima. pose: idle (2) | cast
function oracleSprite(pose, f, C) {
  const g = new PX(44, 62), cx = 20, base = 60, bob = pose === 'idle' ? f : 0, cast = pose === 'cast';
  g.poly([[cx - 11, base], [cx - 6, base - 27], [cx + 6, base - 27], [cx + 11, base]], C[1], { hi: C[2], lo: C[0], depth: 2 });
  g.poly([[cx - 2, base], [cx - 1, base - 24], [cx + 1, base - 24], [cx + 3, base]], C[0], { flat: true });
  g.line(cx - 8, base - 2, cx - 5, base - 24, C[3]);
  if (cast) { g.cap(cx - 6, base - 25, cx - 13, base - 40, 4, C[2], { depth: 1, hi: C[3], lo: C[0] }); g.cap(cx + 6, base - 25, cx + 13, base - 40, 4, C[1], { depth: 1, hi: C[2], lo: C[0] }); }
  else { g.cap(cx - 6, base - 25, cx - 10, base - 13 + bob, 4, C[2], { depth: 1, hi: C[3], lo: C[0] }); g.cap(cx + 6, base - 25, cx + 11, base - 14 + bob, 4, C[1], { depth: 1, hi: C[2], lo: C[0] }); }
  const hy = base - 35 + bob;
  g.poly([[cx, hy - 8], [cx + 7, hy - 4], [cx + 7, hy + 4], [cx, hy + 8], [cx - 7, hy + 4], [cx - 7, hy - 4]], C[2], { hi: C[3], lo: C[0], depth: 2 });
  g.rect(cx + 1, hy - 1, 5, 2, cast ? '#ffffff' : EYE);
  const py = cast ? hy - 23 : hy - 17 - bob, ps = cast ? 6 : 4;
  g.poly([[cx, py - ps], [cx + ps, py], [cx, py + ps], [cx - ps, py]], C[3], { hi: '#ffffff', lo: C[1], depth: 1 });
  return outline(g.toCanvas(), INK);
}
ENEMY_IMG.shard = (e, lv) => { const C = gemOfTheme(THEMES[lv.theme]), p = !e.ground ? 'air' : e.st === 'land' ? 'land' : 'sit', f = p === 'sit' ? fr(e, 3, 2) : 0; return spr2('shard' + C[1] + p + f, () => shardSprite(p, f, C)); };
ENEMY_IMG.prism = (e, lv) => { const C = gemOfTheme(THEMES[lv.theme]), p = e.st === 'aim' || e.st === 'beam' ? 'aim' : 'idle', f = fr(e, 6, 4); return spr2('prism' + C[1] + p + f, () => prismSprite(p, f, C)); };
ENEMY_IMG.geode = (e, lv) => {
  const C = gemOfTheme(THEMES[lv.theme]), st = e.st, p = st === 'roll' ? 'ball' : st === 'curl' || st === 'uncurl' ? 'curl' : st === 'dizzy' ? 'dizzy' : 'walk';
  const f = p === 'ball' ? fr(e, 12, 4) : p === 'walk' && Math.abs(e.vx) > 1 ? fr(e, 6, 2) : 0;
  return spr2('geode' + C[1] + p + f, () => geodeSprite(p, f, C));
};
ENEMY_IMG.oracle = (e, lv) => { const C = gemOfTheme(THEMES[lv.theme]), p = e.st === 'cast' ? 'cast' : 'idle', f = p === 'idle' ? fr(e, 2, 2) : 0; return spr2('oracle' + C[1] + p + f, () => oracleSprite(p, f, C)); };
ENEMY_ALPHA.oracle = e => e.st === 'blink' ? 0.12 + Math.abs(Math.sin(e.t * 20)) * 0.18 : 1;

// raio do vigia: do olho até a primeira parede (no máximo 170 px)
function beamLen(w, e) { let L = 0; const y = cyOf(e); while (L < 170 && !solidPx(w.lv, cxOf(e) + e.dir * (L + 4), y)) L += 4; return L; }
// mira (linha piscando) e o raio de arco-íris; estrelinhas do geodo tonto
ENEMY_PRE.prism = (g, e, cx, cy, w) => {
  if (e.st !== 'aim' && e.st !== 'beam') return;
  const C = gemOfTheme(w.th), L = beamLen(w, e), y = Math.round(cyOf(e) - cy), x0 = Math.round(cxOf(e) - cx), xa = e.dir > 0 ? x0 : x0 - L;
  if (e.st === 'aim') { if (Math.floor(w.t * 16) % 2) { g.globalAlpha = 0.7; g.fillStyle = C[3]; g.fillRect(xa, y, L, 1); g.globalAlpha = 1; } return; }
  g.globalCompositeOperation = 'lighter';
  drawGlow(g, x0 + e.dir * 4, y, 16, C[2], 0.6);
  RAINBOW.forEach((c, i) => { g.globalAlpha = 0.55; g.fillStyle = c; g.fillRect(xa, y - 3 + i, L, 1); });
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#ffffff'; g.fillRect(xa, y - 1, L, 2);
};
ENEMY_PRE.geode = (g, e, cx, cy, w) => {
  if (e.st !== 'dizzy') return;
  for (let k = 0; k < 3; k++) { const a = w.t * 5 + k * 2.1, x = Math.round(cxOf(e) + Math.cos(a) * 9 - cx), y = Math.round(e.y - 6 + Math.sin(a) * 2 - cy); g.fillStyle = '#ffe94d'; g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1); }
};
// projéteis: lasca rasteira, marca no chão (aviso) e espinho de cristal brotando
EPROJ_DRAW.cshard = (g, q, x, y, w) => { const C = gemOfTheme(w.th); g.fillStyle = C[1]; g.fillRect(x, y + 1, 6, 3); g.fillRect(x + 1, y, 4, 5); g.fillStyle = C[3]; g.fillRect(x + 1, y + 1, 2, 1); g.fillStyle = C[0]; g.fillRect(x + 3, y + 3, 2, 1); };
// Cores do aviso: o oposto, no círculo de cores, do cristal da fase (verde -> magenta, azul -> laranja...), bem saturado.
// Na fase do cristal branco (sem cor) vai um vermelho-rosado. Assim a marca nunca se confunde com o cenário.
const _warnC = {};
function warnColors(th) {
  const C = gemOfTheme(th);
  if (_warnC[C[1]]) return _warnC[C[1]];
  const [h, sat] = rgb2hsl(...hexToRgb(C[1])), hh = sat < 0.25 ? 0.96 : (h + 0.5) % 1, tone = l => rgbToHex(...hsl2rgb(hh, 1, l));
  return (_warnC[C[1]] = [tone(0.2), tone(0.5), tone(0.7), '#ffffff']);
}
// marca no chão onde o espinho vai brotar: faixa escura de base, faixa de aviso piscando (cor oposta <-> branco),
// pontas de espinho subindo e um brilho da mesma cor; acelera perto de brotar
EPROJ_DRAW.cmark = (g, q, x, y, w) => {
  const A = warnColors(w.th), left = q.life !== undefined ? q.life : 0.65, k = Math.floor(q.rot * (left < 0.3 ? 9 : 5)), on = k % 2 === 0, cx = x + q.w / 2;
  // poça de luz no chão (pintada por cima: aparece até em fundo claro) e brilho somado
  g.globalAlpha = on ? 0.55 : 0.35; g.fillStyle = A[1];
  for (let j = 0; j < 4; j++) { const hw = Math.round(q.w / 2 + 6 - j * 2); g.fillRect(Math.round(cx - hw), y + 3 - j, hw * 2, 1); }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'lighter'; drawGlow(g, cx, y, 18, A[1], on ? 0.8 : 0.5); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#12081a'; g.fillRect(x - 2, y, q.w + 4, 4);                                            // base escura: contorno em qualquer chão
  g.fillStyle = on ? A[1] : A[3]; g.fillRect(x - 1, y + 1, q.w + 2, 2);
  g.fillStyle = on ? A[2] : A[1]; g.fillRect(x, y + 1, q.w, 1);
  for (let i = 0; i < 4; i++) {                                                                        // pontas: o espinho vem daqui
    const px = x + 1 + i * 4, h = 3 + ((i + k) % 3);
    g.fillStyle = '#12081a'; g.fillRect(px - 1, y + 1 - h, 4, h);
    g.fillStyle = on ? A[1] : A[2]; g.fillRect(px, y + 1 - h, 2, h);
    g.fillStyle = A[3]; g.fillRect(px, y + 1 - h, 1, 1);
  }
};
EPROJ_DRAW.cspike = (g, q, x, y, w) => {
  const C = gemOfTheme(w.th), k = Math.min(1, q.rot / 0.8), bot = y + q.h;
  for (const [dx, hh, hw] of [[3, 0.6, 2], [9, 0.7, 2], [6, 1, 3]]) {
    const h = Math.round(q.h * hh * k);
    for (let j = 0; j < h; j++) {
      const half = Math.max(0, Math.round(hw * (1 - j / h))), yy = bot - 1 - j, tipc = j > h - 3;
      g.fillStyle = tipc ? C[3] : C[2]; g.fillRect(x + dx - half, yy, half, 1);
      g.fillStyle = tipc ? C[3] : C[0]; g.fillRect(x + dx, yy, half + 1, 1);
    }
  }
};

// ponto de chão para o oráculo reaparecer (pés em y), procurando de y0 para baixo; null se não houver
function groundSpot(lv, x, y0, h) {
  if (x < 16 || x > lv.w * T - 16) return null;
  for (let y = y0; y < y0 + 130; y += 2) if (!solidPx(lv, x, y - h + 2) && !solidPx(lv, x, y - 2) && solidPx(lv, x, y + 1)) return Math.floor((y + 1) / T) * T;
  return null;
}
Object.assign(E_AI, {
  // Caquinho: dois pulinhos e um salto grande na direção do herói; ao cair do salto grande, solta duas lascas rasteiras
  shard(w, e, dt) {
    if (e.hurt > 0) { e.vx *= 0.9; return; }
    if (!e.ground) { e.air = true; return; }
    if (e.air) {
      e.air = false; e.vx = 0; e.st = 'land'; e.stT = 0.18;
      if (e.big) { e.big = false; asOwner(null, () => sfx('shatter')); for (const d of [-1, 1]) eshoot(w, { type: 'cshard', w: 6, h: 5, x: cxOf(e) - 3 + d * 6, y: e.y + e.h - 5, vx: d * 120, life: 0.9, col: gemOfTheme(w.th)[2] }); }
    }
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.st === 'land') { e.stT -= dt; if (e.stT <= 0) e.st = null; return; }
    e.cd -= dt; if (e.cd > 0) return;
    const p = e.tgt, dx = cxOf(p) - cxOf(e), near = !p.dead && Math.abs(dx) < 130 && Math.abs(p.y - e.y) < 70, sl = e.slow > 0 ? 0.5 : 1;
    if (near) e.dir = dx > 0 ? 1 : -1;
    else if (ledgeAhead(w, e) || e.wall) e.dir = -e.dir;
    e.hops = (e.hops || 0) + 1;
    if (near && e.hops >= 3) { e.hops = 0; e.big = true; e.vy = -300; e.vx = clamp(dx * 1.3, -110, 110) * sl; e.cd = 0.8; sfx('jump'); }
    else { e.vy = -130; e.vx = e.dir * 45 * sl; e.cd = 0.32; }
  },
  // Vigia: flutua à altura do herói, mira por um instante e dispara um raio reto até a parede
  prism(w, e, dt) {
    const p = e.tgt, dx = cxOf(p) - cxOf(e), ad = Math.abs(dx), sp = e.speed * (e.slow > 0 ? 0.5 : 1);
    e.atk = null;
    if (e.st === 'aim') { e.vx *= 0.85; e.vy *= 0.85; e.stT -= dt; if (e.stT <= 0) { e.st = 'beam'; e.stT = 0.5; sfx('zap'); } return; }
    if (e.st === 'beam') {
      e.vx = e.vy = 0; e.stT -= dt;
      const L = beamLen(w, e); e.atk = { x: e.dir > 0 ? cxOf(e) : cxOf(e) - L, y: cyOf(e) - 2, w: L, h: 4 };
      if (e.stT <= 0) { e.st = 'rest'; e.stT = 1.1; e.atk = null; }
      return;
    }
    if (e.st === 'rest') { e.stT -= dt; e.vx *= 0.9; e.vy = lerp(e.vy, Math.sin(e.t * 2) * 10, 0.1); if (e.stT <= 0) e.st = null; return; }
    const want = ad < 60 ? -Math.sign(dx) : ad > 110 ? Math.sign(dx) : 0;
    e.vx = lerp(e.vx, want * sp, 0.05);
    e.vy = lerp(e.vy, clamp(cyOf(p) - 2 - cyOf(e), -30, 30) + Math.sin(e.t * 3) * 8, 0.05);
    e.dir = dx > 0 ? 1 : -1; e.cd -= dt;
    if (e.cd <= 0 && !p.dead && ad < 150 && Math.abs(cyOf(p) - cyOf(e)) < 14) { e.st = 'aim'; e.stT = 0.75; e.cd = 2.6; sfx('fuse'); }
  },
  // Geodo: anda; de perto se enrola e rola cheio de espinhos (pisar machuca). Bateu na parede: fica tonto
  geode(w, e, dt) {
    const p = e.tgt, dx = cxOf(p) - cxOf(e);
    e.stomp = e.st !== 'roll' && e.st !== 'curl';
    if (e.st === 'curl') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) { e.st = 'roll'; e.stT = 1.8; sfx('dash'); } return; }
    if (e.st === 'roll') {
      e.stT -= dt; e.vx = e.dir * (e.slow > 0 ? 90 : 150);
      if (e.wall) {
        e.st = 'dizzy'; e.stT = 1.6; e.vx = 0; sfx('crate'); feel(w, null, 0, 0.12);
        burst(w, cxOf(e) + e.dir * 8, cyOf(e), gemOfTheme(w.th)[2], 8, 70, 0.4); floatText(w, cxOf(e), e.y - 8, 'TONTO', '#ffe94d');
      } else if (e.stT <= 0 || ledgeAhead(w, e)) { e.st = 'uncurl'; e.stT = 0.35; e.vx = 0; }
      return;
    }
    if (e.st === 'dizzy' || e.st === 'uncurl') { e.vx = approach(e.vx, 0, 400 * dt); e.stT -= dt; if (e.stT <= 0) { e.st = null; e.cd = 1; } return; }
    if (e.hurt > 0) { e.vx *= 0.9; return; }
    walk(w, e, e.speed, 120); e.cd -= dt;
    if (e.cd <= 0 && !p.dead && Math.abs(dx) < 140 && Math.abs(p.y + p.h - e.y - e.h) < 20) { e.st = 'curl'; e.stT = 0.55; e.dir = dx > 0 ? 1 : -1; e.cd = 3; sfx('growl'); }
  },
  // Oráculo: parado, faz brotar espinhos do chão embaixo do herói; se o herói chega perto, some e reaparece longe
  oracle(w, e, dt) {
    const p = e.tgt, dx = cxOf(p) - cxOf(e), ad = Math.abs(dx);
    if (e.st === 'blink') { e.vx = 0; e.stT -= dt; if (e.stT <= 0.25 && !e.moved) { e.moved = true; oracleBlink(w, e); } if (e.stT <= 0) { e.st = 'rest'; e.stT = 0.5; } return; }
    if (e.st === 'cast') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) { oracleSpike(w, p); e.st = 'rest'; e.stT = 0.7; } return; }
    if (e.st === 'rest') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) e.st = null; return; }
    if (e.hurt > 0) { e.vx *= 0.9; return; }
    e.cd -= dt; e.cd2 = (e.cd2 || 0) - dt;
    if (!p.dead && ad < 160 && Math.abs(p.y - e.y) < 90) {
      e.dir = dx > 0 ? 1 : -1; e.vx = 0;
      if (ad < 34 && e.cd2 <= 0) { e.st = 'blink'; e.stT = 0.5; e.moved = false; e.cd2 = 4; sfx('fade'); }
      else if (e.cd <= 0) { e.st = 'cast'; e.stT = 0.6; e.cd = 2.8; sfx('freeze'); }
    } else walk(w, e, e.speed, 0);
  },
});
function oracleSpike(w, p) {
  if (p.dead) return;
  const x = cxOf(p), gy = groundSpot(w.lv, x, p.y + p.h - 2, 4);
  if (gy === null) return;                                               // herói em cima de um buraco: nada brota
  eshoot(w, { type: 'cmark', x: x - 8, y: gy - 3, w: 16, h: 3, life: 0.65, harmless: true, pass: true,
    then: (w2, q) => { eshoot(w2, { type: 'cspike', x: q.x + 2, y: gy - 24, w: 12, h: 24, life: 0.5, big: true, pass: true }); asOwner(null, () => sfx('shatter')); } });
}
function oracleBlink(w, e) {
  const p = e.tgt, col = gemOfTheme(w.th)[2];
  for (const nx of [cxOf(p) + e.dir * 72, cxOf(e) - e.dir * 90, cxOf(p) - e.dir * 90]) {
    const gy = groundSpot(w.lv, nx, p.y - 30, e.h);
    if (gy === null) continue;
    burst(w, cxOf(e), cyOf(e), col, 10, 70, 0.5, 0);
    e.x = nx - e.w / 2; e.y = gy - e.h; e.vy = 0; e.dir = cxOf(p) > nx ? 1 : -1;
    burst(w, cxOf(e), cyOf(e), col, 10, 70, 0.5, 0);
    return;
  }
}
