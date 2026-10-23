'use strict';
// ---------- Inimigos (alta resolução, mesmo estilo do personagem: formas sombreadas + contorno preto) ----------
const SLIME_COL = { forest: '#59c957', cave: '#a06bd8', castle: '#e0524a', boss: '#e0524a' };
const EO = { hi: null, lo: null };

function slimeSprite(col, f, hurt) {
  const g = new PX(48, 36);
  const rx = [15, 13.5, 15, 17.5][f], ry = [12.5, 15, 12.5, 9.5][f], base = 32, cy = base - ry * 0.55, cx = 24;
  const dark = shade(col, -0.35), light = shade(col, 0.5), mid = shade(col, -0.12);
  g.shape(cx - rx, cy - ry, cx + rx, base, (x, y) => y <= base && Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2) <= 1, col, { hi: light, lo: dark, depth: 3, depthD: 3 });
  g.ell(cx + 3, base - 6, 5, 3, mid, { flat: true });                         // miolo
  g.rect(cx + 7, base - 9, 2, 2, light); g.rect(cx - 9, base - 5, 2, 2, mid);
  g.rect(cx - 10, Math.round(cy - ry * 0.55), 4, 2, '#ffffff'); g.rect(cx - 11, Math.round(cy - ry * 0.55) + 2, 2, 3, '#ffffff');  // brilho
  const ey = Math.round(cy - 2);
  if (hurt) { g.rect(cx - 8, ey, 6, 2, '#1b1423'); g.rect(cx + 2, ey, 6, 2, '#1b1423'); g.rect(cx - 3, ey + 7, 6, 2, '#1b1423'); }
  else {
    g.rect(cx - 8, ey - 1, 6, 8, '#ffffff'); g.rect(cx + 2, ey - 1, 6, 8, '#ffffff');
    g.rect(cx - 5, ey, 4, 7, '#1b1423'); g.rect(cx + 5, ey, 3, 7, '#1b1423'); g.rect(cx - 5, ey, 2, 2, '#ffffff'); g.rect(cx + 5, ey, 2, 2, '#ffffff');
    g.rect(cx - 2, ey + 9, 5, 2, dark); g.px(cx - 3, ey + 8, dark); g.px(cx + 3, ey + 8, dark);
  }
  return outline(g.toCanvas(), INK);
}

function batSprite(f) {
  const g = new PX(60, 44), cx = 30, cy = 24;
  const b = '#6a559c', bd = '#3c3060', bl = '#9a85d4', mem = '#4a3a7a', memL = '#6a55a8';
  const flap = [14, 6, -4, 6][f];
  for (const s of [-1, 1]) {
    const rx = cx + s * 6, ry = cy - 2, tx = cx + s * 27, ty = ry - flap * 1.4;
    const pts = [[rx, ry - 3], [cx + s * 16, ty - 4], [tx, ty], [cx + s * 22, ty + 7 + (flap > 4 ? 0 : 3)], [cx + s * 17, ty + 11 + (flap > 4 ? 0 : 3)], [cx + s * 12, ty + 9 + (flap > 4 ? 0 : 3)], [rx, ry + 8]];
    g.poly(pts, mem, { hi: memL, lo: bd, depth: 2 });
    g.line(rx, ry - 2, tx, ty, bl); g.line(rx, ry, cx + s * 22, ty + 7 + (flap > 4 ? 0 : 3), bl); g.line(rx, ry + 2, cx + s * 14, ty + 10 + (flap > 4 ? 0 : 3), bl);
  }
  g.ell(cx, cy, 8, 9.5, b, { hi: bl, lo: bd, depth: 2 });
  g.ell(cx, cy + 4, 4.5, 4.5, mem, { depth: 1 });
  g.poly([[cx - 8, cy - 6], [cx - 6, cy - 16], [cx - 1, cy - 8]], b, { hi: bl, lo: bd, depth: 1 }); g.poly([[cx + 8, cy - 6], [cx + 6, cy - 16], [cx + 1, cy - 8]], b, { hi: bl, lo: bd, depth: 1 });
  g.rect(cx - 6, cy - 13, 2, 3, '#e08aa8'); g.rect(cx + 4, cy - 13, 2, 3, '#e08aa8');
  g.rect(cx - 6, cy - 3, 4, 4, '#ffec4a'); g.rect(cx + 2, cy - 3, 4, 4, '#ffec4a'); g.rect(cx - 5, cy - 2, 2, 3, '#c33'); g.rect(cx + 3, cy - 2, 2, 3, '#c33'); g.px(cx - 6, cy - 3, '#ffffff'); g.px(cx + 2, cy - 3, '#ffffff');
  g.rect(cx - 4, cy + 3, 2, 4, '#ffffff'); g.rect(cx + 2, cy + 3, 2, 4, '#ffffff');
  return outline(g.toCanvas(), INK);
}

function skeletonSprite(f, throwing) {
  const g = new PX(60, 60), bone = '#ece8d6', bd = '#a8a28a', bl = '#fffdf2', cx = 26, feet = 55, hip = 36;
  const ph = f / 4 * Math.PI * 2, s = Math.sin(ph), cph = Math.cos(ph);
  const limb = (a, b, c, d, w, col) => g.cap(a, b, c, d, w, col, { depth: 1, hi: bl, lo: bd });
  for (const side of [-1, 1]) {
    const fx = Math.round(7 * s * side), lift = Math.round(Math.max(0, cph * side) * 5);
    const k = ik(cx + side * 3, hip, cx + side * 3 + fx, feet - lift - 2, 9, 9, -1);
    const col = side > 0 ? bone : bd;
    limb(cx + side * 3, hip, k.ex, k.ey, 4, col); limb(k.ex, k.ey, k.hx, k.hy, 4, col);
    g.poly([[k.hx - 3, k.hy - 1], [k.hx + 7, k.hy - 1], [k.hx + 7, k.hy + 3], [k.hx - 3, k.hy + 3]], col, { depth: 1, hi: bl, lo: bd });
  }
  g.poly([[cx - 7, hip - 4], [cx + 8, hip - 4], [cx + 6, hip + 3], [cx - 5, hip + 3]], bone, { hi: bl, lo: bd, depth: 1 });
  g.rect(cx - 1, hip - 18, 4, 16, bd);
  for (let i = 0; i < 3; i++) {
    const y = hip - 21 + i * 6;
    g.poly([[cx - 9 + i, y], [cx + 10 - i, y], [cx + 9 - i, y + 4], [cx - 8 + i, y + 4]], bone, { hi: bl, lo: bd, depth: 1 });
    g.rect(cx - 1, y, 3, 4, '#1b1423');
  }
  const hy = hip - 41 + (f % 2 === 0 ? 0 : 1);
  g.ell(cx + 1, hy + 9, 11, 10, bone, { hi: bl, lo: bd, depth: 2 }); g.poly([[cx - 6, hy + 14], [cx + 8, hy + 14], [cx + 6, hy + 22], [cx - 4, hy + 22]], bone, { hi: bl, lo: bd, depth: 1 });
  g.rect(cx - 6, hy + 6, 6, 6, '#1b1423'); g.rect(cx + 3, hy + 6, 6, 6, '#1b1423'); g.rect(cx - 4, hy + 8, 2, 2, '#ff5a3c'); g.rect(cx + 5, hy + 8, 2, 2, '#ff5a3c');
  g.rect(cx, hy + 13, 3, 3, '#1b1423');
  for (let i = 0; i < 4; i++) g.rect(cx - 4 + i * 3, hy + 18, 1, 4, '#1b1423');
  const shY = hip - 20;
  const arm = (sx, sy, tx, ty, col) => { const a = ik(sx, sy, sx + tx, sy + ty, 8, 8, 1); limb(sx, sy, a.ex, a.ey, 4, col); limb(a.ex, a.ey, a.hx, a.hy, 4, col); return a; };
  arm(cx - 7, shY, -4 + s * 4, 14, bd);
  const fa = throwing ? arm(cx + 9, shY, 9, -12, bone) : arm(cx + 9, shY, 6 - s * 4, 13, bone);
  if (!throwing) { g.cap(fa.hx + 1, fa.hy - 7, fa.hx + 1, fa.hy + 7, 4, bone, { depth: 1, hi: bl, lo: bd }); g.ell(fa.hx + 1, fa.hy - 8, 3, 3, bone, { depth: 1 }); g.ell(fa.hx + 1, fa.hy + 8, 3, 3, bone, { depth: 1 }); }
  else g.cap(fa.hx, fa.hy - 8, fa.hx, fa.hy + 3, 4, bone, { depth: 1 });
  return outline(g.toCanvas(), INK);
}

function knightSprite(f, mode) { // mode: null | 'wind' | 'charge'
  const g = new PX(72, 68), cx = 28, feet = 63, hip = 42, lean = mode === 'charge' ? 6 : mode === 'wind' ? -4 : 0;
  const st = '#8e9bb0', sd = '#4f5a6c', sl = '#d2dcea', gold = '#e0b44a', goldD = '#a87a2a', goldL = '#fff2a0';
  const ph = f / 4 * Math.PI * 2, s = mode === 'charge' ? Math.sin(f * 2.2) * 1.4 : Math.sin(ph), cph = Math.cos(ph);
  const leg = (side, col) => {
    const fx = Math.round(6 * s * side), lift = Math.round(Math.max(0, cph * side) * 4);
    const k = ik(cx + side * 4, hip, cx + side * 4 + fx + lean, feet - lift - 4, 10, 10, -1);
    g.cap(cx + side * 4, hip, k.ex, k.ey, 8, col, { depth: 1, hi: sl, lo: sd }); g.cap(k.ex, k.ey, k.hx, k.hy, 8, col, { depth: 1, hi: sl, lo: sd });
    g.poly([[k.hx - 5, k.hy - 2], [k.hx + 5, k.hy - 2], [k.hx + 12, k.hy + 3], [k.hx + 12, k.hy + 7], [k.hx - 5, k.hy + 7]], '#3b3b4a', { depth: 1, hi: '#6a6a82', lo: '#22222c' });
  };
  leg(-1, sd); leg(1, st);
  const bob = f % 2 ? 1 : 0, ty = hip - 24 + bob, tx = cx - 11 + lean;
  g.poly([[tx, ty], [tx + 24, ty], [tx + 22, ty + 25], [tx + 2, ty + 25]], st, { hi: sl, lo: sd, depth: 3 });
  g.rect(tx + 4, ty + 9, 16, 2, sd); g.rect(tx + 11, ty + 2, 2, 8, sd);
  g.rect(tx, ty + 20, 24, 5, gold); g.rect(tx, ty + 20, 24, 1, goldL); g.rect(tx, ty + 24, 24, 1, goldD); g.rect(tx + 10, ty + 20, 4, 5, goldL);
  g.ell(tx + 1, ty + 3, 8, 6, sl, { hi: '#ffffff', lo: sd, depth: 2 });
  const hx = cx - 9 + lean + (mode === 'charge' ? 4 : 0), hy = ty - 22 + (mode === 'charge' ? 6 : 0);
  g.poly([[hx, hy + 4], [hx + 3, hy], [hx + 17, hy], [hx + 20, hy + 4], [hx + 20, hy + 22], [hx, hy + 22]], st, { hi: sl, lo: sd, depth: 3 });
  g.rect(hx + 5, hy + 9, 16, 4, '#140a1a'); g.rect(hx + 12, hy + 9, 7, 2, mode ? '#ffec4a' : '#ff5a3c');
  g.rect(hx + 13, hy + 15, 7, 2, sd); g.rect(hx + 13, hy + 19, 7, 2, sd);
  g.poly([[hx + 6, hy], [hx + 10, hy - 9], [hx + 17, hy - 8 - (f % 2)], [hx + 15, hy]], '#d33', { hi: '#ff7a7a', lo: '#8a1a1a', depth: 2 });
  // escudo
  const sx = tx + 18, sy = ty + 2 + (mode === 'charge' ? 4 : 0);
  g.poly([[sx, sy], [sx + 18, sy], [sx + 18, sy + 22], [sx + 9, sy + 32], [sx, sy + 22]], gold, { hi: goldL, lo: goldD, depth: 2 });
  g.poly([[sx + 3, sy + 4], [sx + 15, sy + 4], [sx + 15, sy + 20], [sx + 9, sy + 27], [sx + 3, sy + 20]], '#c33', { hi: '#ff7a7a', lo: '#7a1818', depth: 2 });
  g.rect(sx + 8, sy + 6, 2, 17, '#ffd0d0'); g.rect(sx + 5, sy + 12, 8, 3, '#ffd0d0');
  // espada
  if (mode === 'wind') drawBlade(g, tx + 3, ty - 2, 180, 26, 5, '#dfe6f0', '#ffffff', '#6a4a2a', gold);
  else if (mode === 'charge') drawBlade(g, sx + 14, sy + 8, 90, 26, 5, '#dfe6f0', '#ffffff', '#6a4a2a', gold);
  else drawBlade(g, tx - 3, ty + 12, 205, 24, 5, '#dfe6f0', '#ffffff', '#6a4a2a', gold);
  return outline(g.toCanvas(), INK);
}

// Rei Golem: poses idle (2 quadros), tele (braços erguidos), charge (agachado), stun (cabeça baixa, núcleo exposto)
const GOLEM = { W: 136, H: 120 };
function golemSprite(pose, f, rage) {
  const g0 = new PX(GOLEM.W, GOLEM.H), OX = 8;          // margem lateral: punhos não são cortados
  const g = {
    poly: (p, c, o) => g0.poly(p.map(q => [q[0] + OX, q[1]]), c, o),
    rect: (x, y, w, h, c) => g0.rect(x + OX, y, w, h, c),
    ell: (x, y, rx, ry, c, o, n) => g0.ell(x + OX, y, rx, ry, c, o, n),
    cap: (a, b, c, d, wd, col, o) => g0.cap(a + OX, b, c + OX, d, wd, col, o),
  };
  const s = rage ? '#8a6e78' : '#7b8494', sd = rage ? '#54404c' : '#4a5262', sl = rage ? '#c8aab6' : '#b4bdd0', moss = '#4f8a4a', mossL = '#8ad07a';
  const eye = rage ? '#ff3b2f' : '#ffb347', glow = rage ? '#ff5a3c' : '#ff9d2e', glowL = '#fff2b0', rc = rage ? '#ff6a3c' : '#ffb347';
  const crouch = pose === 'charge' ? 10 : 0, stun = pose === 'stun', br = pose === 'idle' ? f * 2 : 0, cx = 60;
  const R = (pts, col, o) => g.poly(pts, col, { hi: sl, lo: sd, depth: 3, ...o });
  // pernas
  R([[28, 84 + crouch / 2], [54, 84 + crouch / 2], [54, 112], [28, 112]], s); R([[66, 84 + crouch / 2], [92, 84 + crouch / 2], [92, 112], [66, 112]], s);
  R([[22, 108], [58, 108], [58, 118], [22, 118]], s, { depth: 2 }); R([[62, 108], [98, 108], [98, 118], [62, 118]], s, { depth: 2 });
  // tronco
  const ty = 32 + crouch + br;
  R([[20, ty], [100, ty], [96, ty + 54 - crouch], [24, ty + 54 - crouch]], s, { depth: 3 });
  g.rect(28, ty + 12, 14, 2, sd); g.rect(48, ty + 38, 2, 12, sd); g.rect(76, ty + 18, 16, 2, sd); g.rect(82, ty + 20, 2, 12, sd); g.rect(32, ty + 30, 2, 8, sd); g.rect(34, ty + 36, 10, 2, sd);
  R([[22, ty], [46, ty], [44, ty + 8], [24, ty + 12]], moss, { hi: mossL, lo: '#2f5a2c', depth: 2 }); R([[78, ty + 46], [96, ty + 46], [96, ty + 54 - crouch], [78, ty + 54 - crouch]], moss, { hi: mossL, lo: '#2f5a2c', depth: 2 });
  g.rect(30, ty + 18, 2, 10, rc); g.rect(30, ty + 18, 6, 2, rc); g.rect(88, ty + 26, 2, 12, rc); g.rect(84, ty + 36, 6, 2, rc);
  // núcleo (ponto fraco)
  const cy = ty + 28;
  g.ell(cx, cy, 14, 14, sd, { depth: 2 }); g.ell(cx, cy, 11, 11, stun ? '#fff6d8' : glow, { hi: stun ? '#ffffff' : glowL, lo: stun ? '#ffe9a0' : '#c25a10', depth: 3 });
  g.ell(cx - 3, cy - 3, 3, 3, '#ffffff', { flat: true });
  if (stun) for (const [dx, dy] of [[-18, -18], [16, -18], [-18, 16], [16, 16]]) g.rect(cx + dx, cy + dy, 4, 4, '#ffec4a');
  // braços
  const arm = (x0, y0, x1, y1, fx, fy, fw, fh) => { g.cap(x0, y0, x1, y1, 22, s, { depth: 3, hi: sl, lo: sd }); g.ell(fx, fy, fw, fh, s, { hi: sl, lo: sd, depth: 3 }, 2.4); g.rect(fx - 8, fy - 2, 16, 2, sd); };
  if (pose === 'tele') { arm(14, 54, 12, 14, 12, 8, 16, 14); arm(106, 54, 108, 14, 108, 8, 16, 14); }
  else if (pose === 'charge') { arm(12, ty + 18, 12, ty + 46, 12, ty + 52, 15, 14); arm(108, ty + 18, 108, ty + 46, 108, ty + 52, 15, 14); }
  else if (stun) { arm(10, ty + 14, 8, ty + 50, 8, ty + 56, 15, 14); arm(110, ty + 14, 112, ty + 50, 112, ty + 56, 15, 14); }
  else { arm(10, ty + 12 + br, 8, ty + 48 + br, 8, ty + 54 + br, 15, 14); arm(110, ty + 12 + br, 112, ty + 48 + br, 112, ty + 54 + br, 15, 14); }
  // cabeça
  const hy = 4 + crouch + (stun ? 12 : 0) + br, hx = 34;
  R([[hx, hy + 4], [hx + 4, hy], [hx + 48, hy], [hx + 52, hy + 4], [hx + 52, hy + 30], [hx + 46, hy + 36], [hx + 6, hy + 36], [hx, hy + 30]], s, { depth: 3 });
  g.rect(hx + 6, hy + 12, 14, 10, '#232833'); g.rect(hx + 32, hy + 12, 14, 10, '#232833');
  const ec = stun ? '#8a8a99' : eye;
  g.rect(hx + 8, hy + 14, 10, 6, ec); g.rect(hx + 34, hy + 14, 10, 6, ec);
  if (!stun) { g.rect(hx + 10, hy + 14, 4, 4, '#ffffff'); g.rect(hx + 36, hy + 14, 4, 4, '#ffffff'); } else { g.rect(hx + 8, hy + 16, 10, 2, '#232833'); g.rect(hx + 34, hy + 16, 10, 2, '#232833'); }
  g.rect(hx + 10, hy + 26, 32, 6, '#232833'); for (let i = 0; i < 5; i++) g.rect(hx + 12 + i * 6, hy + 26, 2, 6, sl);
  R([[hx + 2, hy - 2], [hx + 16, hy - 2], [hx + 14, hy + 5], [hx + 2, hy + 5]], moss, { hi: mossL, lo: '#2f5a2c', depth: 2 });
  const cc = rage ? '#ff7a8a' : '#7fd4ff';
  for (const [dx, h, w] of [[6, 14, 6], [18, 20, 7], [30, 16, 7], [42, 12, 6]]) g.poly([[hx + dx, hy], [hx + dx + w, hy], [hx + dx + w / 2, hy - h]], cc, { hi: '#ffffff', lo: shade(cc, -0.35), depth: 1 });
  return outline(g0.toCanvas(), INK);
}

const ENEMY_SPR = { slime: {}, slimeHurt: {}, bat: [], skeleton: [], skeletonThrow: null, knight: [], knightWind: [], knightCharge: [], golem: {} };
for (const th in SLIME_COL) { ENEMY_SPR.slime[th] = [0, 1, 2, 3].map(f => slimeSprite(SLIME_COL[th], f)); ENEMY_SPR.slimeHurt[th] = slimeSprite(SLIME_COL[th], 3, true); }
ENEMY_SPR.bat = [0, 1, 2, 3].map(batSprite);
ENEMY_SPR.skeleton = [0, 1, 2, 3].map(f => skeletonSprite(f, false));
ENEMY_SPR.skeletonThrow = skeletonSprite(0, true);
ENEMY_SPR.knight = [0, 1, 2, 3].map(f => knightSprite(f, null));
ENEMY_SPR.knightWind = [knightSprite(0, 'wind')];
ENEMY_SPR.knightCharge = [0, 1, 2, 3].map(f => knightSprite(f, 'charge'));
for (const p of ['idle', 'tele', 'charge', 'stun']) ENEMY_SPR.golem[p] = [0, 1].map(f => [golemSprite(p, f, false), golemSprite(p, f, true)]);

// ---------- Novos inimigos (inspirados nas suas referências) ----------
// Planta carnívora: boca enorme com dentes, pétalas azuis espinhosas, haste sinuosa
function plantSprite(mode, f) { // mode: 'idle' | 'wind' | 'bite'
  const g = new PX(72, 84), flesh = ['#8a5a4a', '#c48a70', '#f0b894', '#ffd8b8'], petal = ['#1c3a5a', '#2c5a88', '#4a8ac0'];
  const sw = mode === 'idle' ? [-2, 0, 2, 0][f] : 0, base = 80;
  const hx = 34 + sw + (mode === 'bite' ? 12 : mode === 'wind' ? -6 : 0), hy = mode === 'bite' ? 30 : mode === 'wind' ? 38 : 32 + (f % 2);
  // folhas do chão
  g.poly([[30, base], [8, base - 6], [4, base - 16], [24, base - 10]], '#6a4a3a', { hi: '#a07860', lo: '#2a1a14', depth: 1 });
  g.poly([[40, base], [62, base - 4], [66, base - 14], [46, base - 10]], '#6a4a3a', { hi: '#a07860', lo: '#2a1a14', depth: 1 });
  // haste
  const pts = [[34, base], [32 + sw * 0.3, base - 20], [34 + sw * 0.7, base - 36], [hx, hy + 22]];
  for (let i = 0; i < 3; i++) g.cap(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 10 - i, flesh[1], { depth: 2, hi: flesh[3], lo: flesh[0] });
  for (const [x, y] of [[pts[1][0], pts[1][1]], [pts[2][0], pts[2][1] + 4]]) { g.rect(x - 6, y - 2, 12, 3, '#2c5a88'); g.rect(x - 6, y - 2, 12, 1, '#4a8ac0'); }
  // pétalas espinhosas atrás da cabeça
  for (let k = 0; k < 9; k++) { const a = -2.9 + k * 0.45, rx = hx + Math.cos(a) * 20, ry = hy + Math.sin(a) * 18; g.poly([[hx + Math.cos(a) * 14, hy + Math.sin(a) * 13], [rx + Math.cos(a + 1.57) * 4, ry + Math.sin(a + 1.57) * 4], [hx + Math.cos(a) * 29, hy + Math.sin(a) * 25], [rx - Math.cos(a + 1.57) * 4, ry - Math.sin(a + 1.57) * 4]], petal[1], { hi: petal[2], lo: petal[0], depth: 1 }); }
  // cabeça
  g.ell(hx, hy, 19, 16, flesh[2], { hi: flesh[3], lo: flesh[0], depth: 3 });
  const open = mode === 'bite' ? 12 : mode === 'wind' ? 2 : 5 + (f % 2) * 2;
  g.ell(hx + 3, hy + 1, 15, 6 + open, '#16060c', { flat: true });
  g.rect(hx - 8, hy - open - 1, 22, 1, '#16060c');
  // dentes superiores e inferiores
  for (let i = 0; i < 6; i++) { const x = hx - 10 + i * 4.6; g.poly([[x, hy - open - 3 + 4], [x + 2.4, hy - open + 6 + 4], [x + 4.4, hy - open - 3 + 4]], '#ffffff', { depth: 0, flat: true }); g.poly([[x, hy + open + 5 - 4], [x + 2.4, hy + open - 6 - 4 + 4], [x + 4.4, hy + open + 5 - 4]], '#f4f4ff', { depth: 0, flat: true }); }
  g.ell(hx + 2, hy + open * 0.5 + 2, 8, 3.6, '#c4263a', { hi: '#ff6a7a', lo: '#7a1020', depth: 1 });
  return outline(g.toCanvas(), INK);
}

// Fantasma: massa azul-esverdeada com cauda de fiapos, olhos vazios e mandíbula cheia de dentes
function ghostSprite(f, attack) {
  const g = new PX(64, 72), R = ['#12363f', '#226a78', '#38a8a8', '#7ae6cc', '#c8fff0'];
  const wv = [0, 2, 0, -2][f], cx = 30, lean = attack ? 6 : 0;
  g.poly([[cx - 14, 20], [cx - 6, 6], [cx + 4 + lean, 2], [cx + 14 + lean, 10], [cx + 18 + lean, 30], [cx + 16, 54 + wv], [cx + 10 + wv, 68], [cx + 4, 56 - wv], [cx - 2 - wv, 70], [cx - 8, 56], [cx - 16 + wv, 66], [cx - 18, 44], [cx - 22, 30]], R[2], { hi: R[3], lo: R[0], depth: 4 });
  g.poly([[cx - 6, 8], [cx - 10, -2], [cx - 2, 6]], R[2], { depth: 1, hi: R[3], lo: R[0] }); g.poly([[cx + 6 + lean, 4], [cx + 12 + lean, -4], [cx + 12 + lean, 8]], R[2], { depth: 1, hi: R[3], lo: R[0] });
  // olhos e boca
  g.poly([[cx - 8 + lean, 16], [cx - 2 + lean, 14], [cx - 1 + lean, 26], [cx - 9 + lean, 28]], '#06161c', { flat: true }); g.poly([[cx + 5 + lean, 14], [cx + 12 + lean, 16], [cx + 12 + lean, 28], [cx + 5 + lean, 26]], '#06161c', { flat: true });
  g.rect(cx - 5 + lean, 20, 2, 3, '#e8fff8'); g.rect(cx + 8 + lean, 20, 2, 3, '#e8fff8');
  const mo = attack ? 16 : 7;
  g.ell(cx + 6 + lean, 38 + mo * 0.3, 10, mo, '#06161c', { flat: true });
  for (let i = 0; i < 5; i++) { g.rect(cx - 2 + lean + i * 4, 38 + mo * 0.3 - mo + 1, 2, 5, '#f4fffa'); g.rect(cx - 2 + lean + i * 4, 38 + mo * 0.3 + mo - 5, 2, 4, '#f4fffa'); }
  if (attack) g.rect(cx + 14 + lean, 50, 2, 14, '#c8fff0');
  return outline(g.toCanvas(), '#06161c');
}

// Guarda da peste: capuz sombrio com máscara de bico dourado e lança longa
function guardSprite(mode, f) { // 'walk' (4 quadros) | 'wind' | 'thrust'
  const g = new PX(88, 80), R = ['#14101c', '#2c2238', '#483a54', '#6a5878'], cx = 30, base = 76;
  const bob = mode === 'walk' ? (f % 2) : 0, sw = mode === 'walk' ? [-2, 0, 2, 0][f] : 0;
  const lean = mode === 'thrust' ? 5 : mode === 'wind' ? -4 : 0;
  // lança (atrás do corpo)
  const sy = mode === 'thrust' ? 42 : mode === 'wind' ? 38 : 46;
  const sx0 = mode === 'thrust' ? 24 : mode === 'wind' ? 6 : 14, sx1 = sx0 + (mode === 'thrust' ? 54 : 46);
  g.cap(sx0, sy + (mode === 'wind' ? 6 : 0), sx1, sy + (mode === 'wind' ? -6 : 0), 3, '#7a5a3a', { depth: 1, hi: '#b08a5a', lo: '#3a2a18' });
  g.poly([[sx1, sy - 5 + (mode === 'wind' ? -6 : 0)], [sx1 + 14, sy + (mode === 'wind' ? -6 : 0)], [sx1, sy + 5 + (mode === 'wind' ? -6 : 0)]], '#e8eef8', { hi: '#ffffff', lo: '#7a88a0', depth: 1 });
  // manto
  g.poly([[cx - 8 + lean, 28 + bob], [cx + 10 + lean, 28 + bob], [cx + 20 + sw, base - 2], [cx - 22 - sw, base - 2], [cx - 14, 50]], R[1], { hi: R[3], lo: R[0], depth: 3 });
  for (let i = 0; i < 4; i++) g.line(cx - 14 + i * 9 + sw, 44, cx - 18 + i * 10 + sw, base - 4, R[0]);
  g.rect(cx - 22 - sw, base - 4, 42 + sw * 2, 3, R[0]);
  // cabeça encapuzada e bico
  g.poly([[cx - 12 + lean, 30 + bob], [cx - 12 + lean, 14 + bob], [cx - 4 + lean, 5 + bob], [cx + 8 + lean, 8 + bob], [cx + 12 + lean, 22 + bob], [cx + 10 + lean, 32 + bob]], R[2], { hi: R[3], lo: R[0], depth: 3 });
  g.poly([[cx + 6 + lean, 18 + bob], [cx + 24 + lean, 24 + bob], [cx + 8 + lean, 30 + bob]], '#e8b030', { hi: '#fff0a0', lo: '#9a6a10', depth: 1 });
  g.rect(cx + 2 + lean, 16 + bob, 4, 4, '#ffd23f'); g.rect(cx + 3 + lean, 17 + bob, 2, 2, '#c33');
  // mãos segurando a lança
  g.ell(sx0 + 12, sy + (mode === 'wind' ? 0 : 0), 4, 4, R[3], { hi: '#8a7898', lo: R[0], depth: 1 });
  return outline(g.toCanvas(), INK);
}

ENEMY_SPR.plant = { idle: [0, 1, 2, 3].map(f => plantSprite('idle', f)), wind: plantSprite('wind', 0), bite: plantSprite('bite', 0) };
ENEMY_SPR.ghost = [0, 1, 2, 3].map(f => ghostSprite(f, false)); ENEMY_SPR.ghostAtk = ghostSprite(0, true);
ENEMY_SPR.guard = { walk: [0, 1, 2, 3].map(f => guardSprite('walk', f)), wind: guardSprite('wind', 0), thrust: guardSprite('thrust', 0) };
