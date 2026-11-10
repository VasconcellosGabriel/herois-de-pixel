'use strict';
// ---------- Fauna dos mundos: lobo, cobra, slime gigante, múmia, ferreiro demônio, aranha ----------
// + "skins": o mesmo inimigo muda de cor conforme o mundo (falcão branco na neve, cavaleiro dourado no céu...)
Object.assign(ENEMIES, {
  wolf:     { w: 20, h: 13, hp: 4,  speed: 30, stomp: true,  coin: 2, xp: 6 },
  snake:    { w: 20, h: 9,  hp: 3,  speed: 22, stomp: true,  coin: 2, xp: 5 },
  bigslime: { w: 26, h: 20, hp: 8,  speed: 16, stomp: true,  coin: 4, xp: 10 },
  mummy:    { w: 12, h: 22, hp: 6,  speed: 14, stomp: true,  coin: 3, xp: 8 },
  smith:    { w: 20, h: 30, hp: 10, speed: 18, stomp: false, coin: 5, xp: 14 },
  spider:   { w: 14, h: 10, hp: 3,  speed: 40, stomp: true,  coin: 2, xp: 5, fly: true },
});
FLYERS.add('spider');                         // nasce pendurada no fio

// ---------- skins por mundo (recolore o sprite original pixel a pixel; fica em cache) ----------
// h = matiz de destino (graus); s/l = como mudar saturação/luz; keep = preserva pixels muito saturados (olhos, bicos)
const SKIN_FX = {
  frost:   { h: 200, s: v => v * 0.45 + 0.1, l: v => 0.32 + v * 0.7, keep: 0.7 },
  gold:    { h: 44, s: v => Math.max(0.6, v), l: v => Math.min(0.92, v * 1.12 + 0.04), keep: 0.75 },
  demon:   { h: 4, s: v => Math.max(0.55, v), l: v => v * 0.85, keep: 0.8 },
  blood:   { h: 350, s: v => Math.max(0.45, v * 0.9), l: v => v * 0.82, keep: 0.8 },
  wisp:    { h: 92, s: v => Math.max(0.55, v) },
  crimson: { h: 345, s: v => Math.max(0.5, v), l: v => v * 0.9 },
  storm:   { h: 205, s: v => Math.max(0.65, v), l: v => Math.min(0.95, v * 1.1) },
};
const ENEMY_SKIN = {
  ice: { skeleton: 'frost' }, icecave: { skeleton: 'frost', bat: 'frost' },
  swamp: { ghost: 'wisp' }, volcano: { knight: 'demon' },
  vampire: { bat: 'blood', ghost: 'crimson' }, sky: { knight: 'gold', guard: 'gold', ghost: 'storm' },
};
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hsl2rgb(h, s, l) {
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
const _skinC = {};
function skinned(img, k) {
  const fx = SKIN_FX[k]; if (!fx) return img;
  const m = _skinC[k] || (_skinC[k] = new WeakMap());
  let c = m.get(img); if (c) return c;
  c = mk(img.width, img.height); const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const [, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
    if (l < 0.11 || (fx.keep && s > fx.keep && l > 0.3 && l < 0.85)) continue;      // contorno e olhos ficam
    const o = hsl2rgb(fx.h / 360, clamp(fx.s ? fx.s(s) : s, 0, 1), clamp(fx.l ? fx.l(l) : l, 0, 1));
    d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
  }
  g.putImageData(id, 0, 0); m.set(img, c);
  return c;
}
const skinOf = (e, lv) => { const s = ENEMY_SKIN[lv && lv.theme]; return s && s[e.type]; };

// ---------- Lobo (cinza, marrom no outono, branco na neve, cão infernal no vulcão, sombrio no castelo) ----------
const WOLF_PAL = {
  gray:  { P: ['#24242e', '#4a4a58', '#767684', '#a6a6b4'], belly: '#cfcac0', eye: '#ffd23f' },
  brown: { P: ['#2a1a10', '#5a3c24', '#8a6038', '#b88c5c'], belly: '#e2cca8', eye: '#ffd23f' },
  snow:  { P: ['#4a5a74', '#8a9cb4', '#c8d6e6', '#ffffff'], belly: '#ffffff', eye: '#3ab8ff' },
  hell:  { P: ['#0e0606', '#241010', '#3e1a18', '#62281e'], belly: '#4a1e16', eye: '#ff3a1a', fire: true },
  dark:  { P: ['#100a18', '#261c34', '#3e3052', '#5e4c78'], belly: '#76688a', eye: '#ff3a4a' },
};
const WOLF_SKIN = { autumn: 'brown', snow: 'snow', ice: 'snow', icecave: 'snow', volcano: 'hell', vampire: 'dark' };
function wolfSprite(pose, f, pal) {       // run (4 quadros) | wind (agachado, rosnando) | leap (bote)
  const g = new PX(92, 56), { P, belly, eye } = pal, gy = 54, C = sh(0, P[3], P[0], 2), C1 = sh(0, P[2], P[0], 1);
  const ph = f / 4 * Math.PI * 2, wind = pose === 'wind', leap = pose === 'leap';
  const bx = 42, by = 32 + (wind ? 5 : 0) + (pose === 'run' ? -Math.round(Math.abs(Math.sin(ph)) * 2) : 0) - (leap ? 4 : 0);
  const tl = leap ? -6 : wind ? 7 : Math.round(Math.sin(ph) * 2);
  // cauda peluda
  g.poly([[bx - 14, by - 4], [bx - 26, by - 9 + tl], [bx - 36, by - 6 + tl], [bx - 31, by + 1 + tl], [bx - 22, by + 1 + tl * 0.5], [bx - 14, by + 3]], P[1], C);
  g.poly([[bx - 33, by - 7 + tl], [bx - 38, by - 4 + tl], [bx - 32, by - 1 + tl]], pal.fire ? '#ff6a1a' : belly, { flat: true });
  // pernas (as de trás do corpo, mais escuras, primeiro)
  const leg = (hx, hy, fx, fy, col, bend) => {
    const k = ik(hx, hy, fx, fy, 10, 10, bend, 5);
    g.cap(hx, hy, k.ex, k.ey, 6, col, C1); g.cap(k.ex, k.ey, k.hx, k.hy, 4, col, C1); g.ell(k.hx + 2, k.hy - 1, 3.4, 1.8, col, { flat: true });
  };
  const legs = side => {
    const col = side ? P[2] : P[1], o = side ? 0 : Math.PI;
    if (leap) { leg(bx - 10, by + 3, bx - 30 + side * 4, by + 10, col, 1); leg(bx + 14, by + 3, bx + 34 - side * 4, by + 4, col, -1); }
    else if (wind) { leg(bx - 10, by + 2, bx - 14 + side * 3, gy - 1, col, 1); leg(bx + 14, by + 2, bx + 18 + side * 3, gy - 1, col, -1); }
    else {
      const a = Math.sin(ph + o), b = Math.sin(ph + o + Math.PI);
      leg(bx - 10, by + 3, bx - 10 + a * 9, gy - 1 - Math.max(0, Math.cos(ph + o)) * 5, col, 1);
      leg(bx + 14, by + 3, bx + 14 + b * 9, gy - 1 - Math.max(0, Math.cos(ph + o + Math.PI)) * 5, col, -1);
    }
  };
  legs(0);
  // corpo, peito e juba
  g.ell(bx, by, 18, 8.5, P[2], C);
  g.ell(bx + 2, by + 5, 12, 2.6, belly, { flat: true });
  for (let i = 0; i < 4; i++) g.poly([[bx - 10 + i * 6, by - 7], [bx - 7 + i * 6, by - 11 - (i % 2)], [bx - 4 + i * 6, by - 7]], P[2], C1);   // pelo arrepiado
  const hy = by - 9 + (wind ? 6 : 0) + (leap ? 3 : 0), hx = bx + 25 + (leap ? 3 : 0);
  g.ell(bx + 16, by - 2, 9, 9.5, P[2], C);
  g.poly([[bx + 10, by - 10], [bx + 14, by - 15], [bx + 17, by - 9], [bx + 21, by - 13], [bx + 23, by - 6]], P[2], C1);
  g.ell(bx + 19, by + 3, 5, 5, belly, { flat: true });
  legs(1);
  // cabeça
  const open = wind || leap;
  g.poly([[hx - 7, hy - 4], [hx - 7, hy - 13], [hx - 3, hy - 6]], P[1], C1);
  g.ell(hx, hy, 8, 6.5, P[2], C);
  g.poly([[hx + 3, hy - 3], [hx + 16, hy - 1], [hx + 16, hy + 2], [hx + 4, hy + 4]], P[2], C1);
  g.rect(hx + 15, hy - 2, 2, 2, '#1b1423');
  if (open) {
    g.poly([[hx + 3, hy + 3], [hx + 15, hy + 3], [hx + 14, hy + 5], [hx + 3, hy + 6]], '#5a0a14', { flat: true });
    g.poly([[hx + 2, hy + 5], [hx + 13, hy + 6], [hx + 12, hy + 9], [hx + 2, hy + 8]], P[1], C1);
    for (const x of [hx + 6, hx + 9, hx + 12]) { g.px(x, hy + 4, '#ffffff'); g.px(x, hy + 5, '#ffffff'); }
  } else g.poly([[hx + 4, hy + 2], [hx + 14, hy + 2], [hx + 5, hy + 5]], belly, { flat: true });
  g.poly([[hx - 3, hy - 4], [hx - 1, hy - 14], [hx + 3, hy - 5]], P[2], C1); g.px(hx - 1, hy - 9, P[0]); g.px(hx - 1, hy - 8, P[0]);
  g.rect(hx + 2, hy - 3, 4, 2, eye); g.px(hx + 4, hy - 3, '#1b1423');
  g.line(hx, hy - 5, hx + 6, hy - 3, P[0]);                                                   // cenho bravo
  if (pal.fire) {                                                                             // chamas nas costas e nos olhos
    const fl = [0, 2, 1, 3][f & 3];
    for (let i = 0; i < 5; i++) { const x = bx - 12 + i * 6, h = 6 + ((i + fl) % 3) * 3; g.poly([[x - 2, by - 8], [x + 1, by - 8 - h], [x + 3, by - 8]], '#ff5a1a', { flat: true }); g.poly([[x - 1, by - 8], [x + 1, by - 8 - h * 0.5], [x + 2, by - 8]], '#ffd27a', { flat: true }); }
  }
  return outline(g.toCanvas(), INK);
}

// ---------- Cobra naja do deserto ----------
function snakeSprite(pose, f) {           // move (2) | wind (empinada) | strike (bote) | spit (cuspe)
  const g = new PX(84, 48), gy = 46, S = ['#4a2a0e', '#8a5a20', '#c48a3a', '#eec276'], belly = '#f8e6b0', C = sh(0, S[3], S[0], 1);
  const rear = pose === 'wind' || pose === 'spit', strike = pose === 'strike';
  const pts = [];
  for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push([8 + t * 40, gy - 4 - Math.sin(t * Math.PI * 2.2 + f * Math.PI) * 3 * (1 - t * 0.4), 1.6 + t * 3.4]); }
  const head = strike ? [74, gy - 12] : rear ? [54, gy - 32] : [62, gy - 10], ctrl = strike ? [60, gy - 16] : rear ? [44, gy - 22] : [54, gy - 6];
  for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t; pts.push([u * u * 48 + 2 * u * t * ctrl[0] + t * t * head[0], u * u * (gy - 5) + 2 * u * t * ctrl[1] + t * t * head[1], 5 - t * 0.6]); }
  for (const [x, y, r] of pts) g.ell(x, y, r, r, S[2], C);
  pts.forEach(([x, y, r], i) => { if (i % 3 === 1 && r > 2.4 && i < 24) { g.px(x, y - r + 1, S[0]); g.px(x - 1, y - r + 2, S[0]); g.px(x + 1, y - r + 2, S[0]); g.px(x, y - r + 3, S[0]); } });
  if (rear) {                                                                     // capuz aberto da naja
    g.ell(head[0] - 1, head[1] + 7, 8, 10, S[2], sh(0, S[3], S[0], 2));
    g.ell(head[0] + 1, head[1] + 8, 4, 7, belly, { flat: true });
    for (let k = 0; k < 3; k++) g.rect(head[0] - 6, head[1] + 4 + k * 4, 2, 2, S[0]);
  }
  const hx = head[0] + 2, hy = head[1];
  g.ell(hx, hy, 6.5, 4.4, S[2], C);
  g.poly([[hx + 3, hy - 3], [hx + 10, hy - 1], [hx + 10, hy + 2], [hx + 3, hy + 3]], S[2], C);
  g.rect(hx + 1, hy - 3, 3, 2, '#ff3a2a'); g.px(hx + 2, hy - 3, '#1b1423');
  if (strike || pose === 'spit') {
    g.poly([[hx + 4, hy + 1], [hx + 11, hy + 3], [hx + 9, hy + 6], [hx + 3, hy + 4]], '#5a0a14', { flat: true });
    g.px(hx + 6, hy + 2, '#ffffff'); g.px(hx + 6, hy + 3, '#ffffff'); g.px(hx + 9, hy + 3, '#ffffff');
    if (pose === 'spit') g.ell(hx + 13, hy + 3, 2.4, 2, '#9aff4a', { flat: true });
  } else { g.line(hx + 10, hy + 1, hx + 14, hy + 1, '#e0304a'); g.px(hx + 15, hy, '#e0304a'); g.px(hx + 15, hy + 2, '#e0304a'); }
  return outline(g.toCanvas(), INK);
}

// ---------- Slime gigante (dentes, caveira dentro, gosma pingando) ----------
function bigslimeSprite(col, pose, f) {    // idle (4) | air | hurt
  const g = new PX(92, 72), cx = 46, base = 68, dk = shade(col, -0.6);
  const rx = pose === 'air' ? 24 : [29, 27, 29, 32][f], ry = pose === 'air' ? 29 : [23, 25, 23, 20][f], cy = base - ry * 0.92;
  g.shape(cx - rx, cy - ry, cx + rx, base, (x, y) => y <= base && Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2) <= 1, col, { hi: shade(col, 0.4), lo: shade(col, -0.45), depth: 4, depthD: 4 });
  // caveira e ossos boiando dentro (meio transparentes)
  const bn = mix(col, '#f4f0dc', 0.55), bd = mix(col, '#2a1a2a', 0.4);
  g.ell(cx - 12, base - 13, 6, 5, bn, { flat: true }); g.rect(cx - 15, base - 14, 2, 2, bd); g.rect(cx - 11, base - 14, 2, 2, bd); g.rect(cx - 13, base - 10, 3, 2, bn);
  g.cap(cx + 10, base - 8, cx + 20, base - 12, 2, bn, { flat: true }); g.ell(cx + 9, base - 8, 1.6, 1.6, bn, { flat: true }); g.ell(cx + 21, base - 12, 1.6, 1.6, bn, { flat: true });
  for (const [x, y, r] of [[-20, -26, 3], [16, -32, 2.4], [22, -16, 2]]) g.ell(cx + x, base + y, r, r, shade(col, 0.3), { flat: true });
  g.rect(cx - rx * 0.62, cy - ry * 0.6, 9, 4, '#ffffff'); g.rect(cx - rx * 0.62 - 2, cy - ry * 0.6 + 4, 3, 5, '#ffffff');
  const ey = Math.round(cy - 6);
  if (pose === 'hurt') { g.rect(cx - 13, ey, 9, 2, dk); g.rect(cx + 4, ey, 9, 2, dk); }
  else {
    for (const s of [-1, 1]) {
      g.poly([[cx + s * 4, ey - 2], [cx + s * 15, ey - 6], [cx + s * 15, ey + 4], [cx + s * 4, ey + 4]], '#fff6c8', { flat: true });
      g.rect(cx + s * 9 - 2, ey - 2, 4, 5, '#d0102a'); g.px(cx + s * 9 - 1, ey - 1, '#ffffff');
      g.line(cx + s * 3, ey - 4, cx + s * 16, ey - 9, dk); g.line(cx + s * 3, ey - 3, cx + s * 16, ey - 8, dk);
    }
  }
  const my = ey + 10, mw = 15, open = pose === 'air' ? 7 : 4 + (f % 2) * 2;
  g.poly([[cx - mw, my], [cx + mw, my], [cx + mw - 3, my + open], [cx - mw + 3, my + open]], '#2a0814', { flat: true });
  for (let i = 0; i < 7; i++) { const x = cx - mw + 2 + i * 4.2; g.poly([[x, my], [x + 1.6, my + 3.4], [x + 3.2, my]], '#ffffff', { flat: true }); if (i < 6) g.poly([[x + 2, my + open], [x + 3.6, my + open - 3], [x + 5.2, my + open]], '#f0f0e0', { flat: true }); }
  if (pose !== 'air') for (const x of [cx - 18, cx + 6, cx + 20]) { g.rect(x, base, 3, 2 + ((x + f) % 3), col); g.px(x + 1, base + 3 + ((x + f) % 3), shade(col, 0.3)); }
  return outline(g.toCanvas(), INK);
}

// ---------- Múmia ----------
function mummySprite(pose, f) {           // walk (4) | wind | grab
  const g = new PX(72, 68), cx = 28, feet = 64, B = ['#5a4a32', '#9a8862', '#d4c49c', '#f2e8cc'], C = sh(0, B[3], B[0], 1);
  const ph = f / 4 * Math.PI * 2, s = pose === 'walk' ? Math.sin(ph) : 0;
  for (const side of [-1, 1]) {                                             // pernas
    const fx = cx + side * 3 + Math.round(s * 5 * side), col = side > 0 ? B[2] : B[1];
    g.cap(cx + side * 3, 42, fx, feet - 3, 6, col, C); g.rect(fx - 3, feet - 3, 8, 3, col);
    for (let y = 45; y < feet - 3; y += 4) g.px(fx - 1 + (y % 3), y, B[0]);
  }
  const lean = pose === 'grab' ? 3 : pose === 'wind' ? -2 : 0;
  const arm = (y0, tx, ty, col) => { g.cap(cx + 2 + lean, y0, tx, ty, 5, col, C); g.ell(tx + 1, ty, 3, 2.6, col, C); };
  const far = pose === 'grab' ? [cx + 30, 27] : pose === 'wind' ? [cx + 8, 4] : [cx + 19, 26 + Math.round(s)];
  arm(23, far[0], far[1] - 2, B[1]);
  g.poly([[cx - 8 + lean, 20], [cx + 8 + lean, 20], [cx + 7, 43], [cx - 7, 43]], B[2], sh(0, B[3], B[0], 2));
  for (let y = 22; y < 42; y += 3) g.line(cx - 7 + lean, y, cx + 7 + lean, y + (y % 2 ? 1 : -1), B[1]);
  g.poly([[cx - 7, 30], [cx - 18, 34 + Math.round(s * 2)], [cx - 17, 37 + Math.round(s * 2)], [cx - 7, 34]], B[2], C);   // faixa solta
  g.ell(cx + 1 + lean, 13, 7.5, 8.5, B[2], sh(0, B[3], B[0], 2));
  for (let y = 7; y < 21; y += 3) g.line(cx - 6 + lean, y, cx + 8 + lean, y + 1, B[1]);
  g.rect(cx - 3 + lean, 11, 11, 3, '#1b1423'); g.rect(cx + 1 + lean, 11, 2, 2, '#7affc8'); g.rect(cx + 5 + lean, 11, 2, 2, '#7affc8');
  const near = pose === 'grab' ? [cx + 32, 30] : pose === 'wind' ? [cx + 12, 6] : [cx + 21, 29 - Math.round(s)];
  arm(25, near[0], near[1], B[2]);
  return outline(g.toCanvas(), INK);
}

// ---------- Ferreiro demônio (Forja dos Demônios) ----------
// Um ferreiro de verdade: corpo de ferro fundido com uma fornalha acesa no peito, chaminé nas costas soltando fumaça,
// avental de couro com ferramentas, luvas grossas, óculos de solda na testa, martelo de forja e tenaz com um lingote em brasa.
// pose: walk (4) | wind (martelo no alto) | slam (martelo no chão) | toss (arremessa o lingote)
function smithSprite(pose, f) {
  const g = new PX(120, 96), cx = 50, feet = 94;
  const I = ['#141218', '#26222c', '#3a3440', '#565062'], C = sh(0, I[3], I[0], 2);          // pele de ferro fundido
  const L = ['#2a160a', '#4a2a14', '#6e4422', '#9a6638'], CL = sh(0, L[3], L[0], 2);          // couro
  const ph = f / 4 * Math.PI * 2, s = pose === 'walk' ? Math.sin(ph) : 0, cr = pose === 'slam' ? 5 : pose === 'toss' ? 2 : 0;
  const hot = (x, y, r) => { g.ell(x, y, r, r * 0.7, '#ff7a2a', { hi: '#fff0a0', lo: '#c2361a', depth: 1 }); };
  const hammer = (hx, hy, tx, ty) => {
    g.cap(hx, hy, tx, ty, 4, '#5a3a22', sh(0, '#8a5a32', '#2a1a0e', 1));
    const a = Math.atan2(ty - hy, tx - hx), px = -Math.sin(a), py = Math.cos(a), w2 = 10, l = 9;
    g.poly([[tx + px * w2, ty + py * w2], [tx + px * w2 + Math.cos(a) * l, ty + py * w2 + Math.sin(a) * l], [tx - px * w2 + Math.cos(a) * l, ty - py * w2 + Math.sin(a) * l], [tx - px * w2, ty - py * w2]], '#4a4a58', sh(0, '#8a8a9a', '#1a1a22', 2));
    g.cap(tx + px * (w2 - 1), ty + py * (w2 - 1), tx + px * (w2 - 1) + Math.cos(a) * l, ty + py * (w2 - 1) + Math.sin(a) * l, 2, '#ffb04a', { flat: true });   // face do martelo em brasa
  };
  // chaminé nas costas
  const ty = 46 + cr;
  g.poly([[cx - 18, ty - 4], [cx - 10, ty - 6], [cx - 12, ty - 34], [cx - 19, ty - 33]], '#2e2a30', sh(0, '#5a5460', '#100e12', 2));
  g.rect(cx - 21, ty - 38, 12, 5, '#3a3440'); g.rect(cx - 21, ty - 38, 12, 1, '#6a6474'); g.rect(cx - 19, ty - 37, 8, 2, '#ff6a1a');
  if (pose === 'walk') hammer(cx + 12, 50, cx - 12, 16 + Math.round(s));
  if (pose === 'wind') hammer(cx + 6, 22, cx - 16, 4);
  // pernas grossas com botas de ferro
  for (const side of [-1, 1]) {
    const fx = cx + side * 8 + Math.round(s * 6 * side), col = side > 0 ? I[2] : I[1];
    const k = ik(cx + side * 7, 66 + cr, fx, feet - 6, 14, 14, 1, 5);
    g.cap(cx + side * 7, 66 + cr, k.ex, k.ey, 12, col, C); g.cap(k.ex, k.ey, k.hx, k.hy, 10, col, C);
    g.poly([[k.hx - 7, feet - 9], [k.hx + 8, feet - 9], [k.hx + 10, feet], [k.hx - 7, feet]], '#3a3a46', sh(0, '#7a7a8a', '#14141c', 2));
    g.rect(k.hx - 7, feet - 9, 15, 2, '#5a5a6a');
  }
  // tronco: barril de ferro com a fornalha acesa no peito
  g.ell(cx, ty, 21, 19, I[2], sh(0, I[3], I[0], 3));
  for (const [x0, y0, x1, y1] of [[cx - 16, ty - 8, cx - 10, ty + 2], [cx + 15, ty - 6, cx + 9, ty + 4]]) g.line(x0, y0, x1, y1, '#ff6a1a');   // rachaduras em brasa
  g.rect(cx - 9, ty - 10, 18, 14, '#1a1418'); g.rect(cx - 8, ty - 9, 16, 12, '#ff6a1a');
  g.ell(cx, ty - 1, 6, 4, '#ffd27a', { flat: true }); g.ell(cx, ty, 3, 2, '#fff6d0', { flat: true });
  for (let i = 0; i < 4; i++) g.rect(cx - 7 + i * 4, ty - 9, 2, 12, '#2a2228');                    // grade da fornalha
  g.rect(cx - 10, ty - 11, 20, 2, '#5a5462'); g.rect(cx - 10, ty + 3, 20, 2, '#3a3440');
  // avental de couro com bolso e ferramentas
  g.poly([[cx - 15, ty + 6], [cx + 15, ty + 6], [cx + 16, 80 + cr], [cx - 15, 80 + cr]], L[2], CL);
  g.rect(cx - 15, ty + 5, 31, 3, L[0]); g.rect(cx - 2, ty + 5, 4, 3, '#c8a050');
  g.rect(cx - 9, ty + 14, 12, 8, L[1]); g.rect(cx - 9, ty + 14, 12, 1, L[3]);                      // bolso
  g.rect(cx - 7, ty + 9, 2, 7, '#8a8a9a'); g.rect(cx - 8, ty + 8, 4, 2, '#5a5a6a');                  // chave no bolso
  g.rect(cx - 2, ty + 10, 2, 6, '#5a3a22'); g.rect(cx - 3, ty + 9, 4, 2, '#8a8a9a');                // martelinho no bolso
  for (const [x, y] of [[cx + 7, 70], [cx - 12, 74], [cx + 10, 62]]) { g.px(x, y + cr, '#1a0c06'); g.px(x + 1, y + cr, '#ff8a3a'); }   // queimaduras de faísca
  // cabeça careca, chifrinhos tortos, óculos de solda na testa e barba trançada
  const hx = cx + 6, hy = 22 + cr;
  for (const sd of [-1, 1]) g.poly([[hx + sd * 6, hy - 5], [hx + sd * 11, hy - 10], [hx + sd * 10, hy - 15], [hx + sd * 3, hy - 8]], '#c8b890', sh(0, '#f0e4c4', '#7a6a50', 1));
  g.ell(hx, hy, 10, 9, I[2], C);
  g.rect(hx - 10, hy - 5, 21, 3, L[1]);                                                            // tira dos óculos
  for (const ox of [-3, 5]) { g.ell(hx + ox, hy - 5, 3.4, 3, '#2a2a34', { flat: true }); g.ell(hx + ox, hy - 5, 2.2, 1.8, '#5ab0d8', { flat: true }); g.px(hx + ox - 1, hy - 6, '#ffffff'); }
  g.rect(hx, hy - 1, 3, 2, '#ffd23f'); g.rect(hx + 5, hy - 1, 3, 2, '#ffd23f');                      // olhos acesos
  g.poly([[hx - 5, hy + 4], [hx + 10, hy + 4], [hx + 8, hy + 11], [hx + 4, hy + 18], [hx + 1, hy + 18], [hx - 3, hy + 10]], '#2a2a30', sh(0, '#5a5a66', '#0a0a0e', 1));   // barba de fuligem
  g.rect(hx + 1, hy + 13, 4, 2, '#c8a050'); g.rect(hx + 1, hy + 13, 4, 1, '#ffe27a');                // argola na trança
  g.rect(hx + 1, hy + 5, 7, 1, '#140404');
  // braços com luvas de couro
  const arm = (sx, sy, tx, ty2, col) => { const k = ik(sx, sy, tx, ty2, 13, 13, -1, 5); g.cap(sx, sy, k.ex, k.ey, 10, col, C); g.cap(k.ex, k.ey, k.hx, k.hy, 9, L[2], CL); g.ell(k.hx, k.hy, 6, 5.5, L[2], CL); return k; };
  const tongs = (x, y, tx, ty2, glow) => {                                                         // tenaz segurando o lingote quente
    g.cap(x, y, tx, ty2, 2, '#4a4a58', { flat: true }); g.cap(x + 2, y + 1, tx + 2, ty2 + 1, 2, '#3a3a46', { flat: true });
    if (glow) { g.rect(tx - 4, ty2 - 2, 9, 5, '#ff7a2a'); g.rect(tx - 3, ty2 - 2, 7, 2, '#ffe27a'); }
  };
  if (pose === 'walk') { const k = arm(cx - 14, ty - 8, cx - 20, ty + 14 - Math.round(s * 2), I[1]); tongs(k.hx, k.hy, k.hx - 6, k.hy + 12, true); arm(cx + 14, ty - 8, cx + 14, 50, I[2]); }
  else if (pose === 'wind') { arm(cx - 12, ty - 10, cx + 4, 22, I[1]); arm(cx + 14, ty - 10, cx + 8, 20, I[2]); }
  else if (pose === 'toss') { const k = arm(cx + 12, ty - 8, cx + 28, ty - 14, I[2]); tongs(k.hx, k.hy, k.hx + 10, k.hy - 6, false); arm(cx - 12, ty - 8, cx - 16, ty + 16, I[1]); hot(k.hx + 16, k.hy - 9, 4); }
  else { arm(cx - 12, ty - 8, cx + 24, ty + 16, I[1]); arm(cx + 14, ty - 8, cx + 28, ty + 16, I[2]); hammer(cx + 26, ty + 16, cx + 50, feet - 10); }
  return outline(g.toCanvas(), INK);
}

// ---------- Aranha das cavernas ----------
const SPIDER_PAL = {
  cave:    { P: ['#120c22', '#2a1e46', '#463470', '#6a5a9a'], mark: '#7affe0', eye: '#ff3a6a' },
  icecave: { P: ['#2a3a56', '#5a7698', '#9ab8d8', '#e0f0ff'], mark: '#3ab8ff', eye: '#3ab8ff' },
  vampire: { P: ['#0a0608', '#1e1218', '#34202a', '#523444'], mark: '#e0102a', eye: '#ff2a3a' },
};
function spiderSprite(pose, f, pal) {     // hang | walk (2) | leap
  const g = new PX(64, 44), { P } = pal, cx = 32, cy = pose === 'hang' ? 18 : 30, C = sh(0, P[3], P[0], 1);
  const legs = (back) => {
    for (let i = 0; i < 4; i++) {
      const side = i < 2 ? -1 : 1, k = i % 2, sx = cx + 2 + side * 2, sy = cy;
      const wig = pose === 'walk' ? ((i + f) % 2 ? 2 : -2) : 0;
      let kx, ky, fx, fy;
      if (pose === 'hang') { kx = sx + side * (9 + k * 5); ky = sy - 7 + k * 2; fx = sx + side * (12 + k * 7); fy = sy + 8 + k * 3; }
      else if (pose === 'leap') { kx = sx + side * (10 + k * 5); ky = sy - 9; fx = sx + side * (18 + k * 7); fy = sy - 2 + k * 4; }
      else { kx = sx + side * (9 + k * 6) + wig; ky = sy - 9; fx = sx + side * (15 + k * 9) + wig; fy = 42; }
      const col = back ? P[1] : P[2];
      g.cap(sx, sy, kx, ky + (back ? 1 : 0), 2.6, col, C); g.cap(kx, ky + (back ? 1 : 0), fx + (back ? -2 : 0), fy, 2, col, C);
    }
  };
  legs(true);
  g.ell(cx - 8, cy - 2, 10, 8.5, P[2], sh(0, P[3], P[0], 2));                                 // abdômen
  g.poly([[cx - 11, cy - 7], [cx - 6, cy - 7], [cx - 8, cy - 3]], pal.mark, { flat: true }); g.poly([[cx - 8, cy - 4], [cx - 11, cy], [cx - 5, cy]], pal.mark, { flat: true });
  g.ell(cx + 6, cy + 1, 6.5, 5.5, P[2], sh(0, P[3], P[0], 2));
  for (const [x, y] of [[cx + 8, cy - 2], [cx + 10, cy - 1], [cx + 7, cy], [cx + 11, cy + 1]]) g.px(x, y, pal.eye);
  g.rect(cx + 9, cy + 4, 1, 3, '#f0e8d8'); g.rect(cx + 11, cy + 4, 1, 3, '#f0e8d8');
  legs(false);
  return outline(g.toCanvas(), INK);
}

// ---------- imagens ----------
ENEMY_IMG.wolf = (e, lv) => {
  const k = WOLF_SKIN[lv && lv.theme] || 'gray', p = e.st === 'wind' ? 'wind' : e.st === 'leap' && !e.ground ? 'leap' : 'run';
  const f = p === 'run' ? (Math.abs(e.vx) > 1 ? fr(e, Math.abs(e.vx) > 50 ? 12 : 7, 4) : 0) : (e.st === 'wind' ? fr(e, 6, 4) : 0);
  return spr2('wolf' + k + p + f, () => wolfSprite(p, f, WOLF_PAL[k]));
};
ENEMY_IMG.snake = e => { const p = ['wind', 'strike', 'spit'].includes(e.st) ? e.st : 'move', f = p === 'move' ? fr(e, 4, 2) : 0; return spr2('snake' + p + f, () => snakeSprite(p, f)); };
ENEMY_IMG.bigslime = (e, lv) => {
  const th = lv && lv.theme, col = SLIME_COL[th] || '#8ad83a', p = e.hurt > 0 ? 'hurt' : !e.ground ? 'air' : 'idle', f = p === 'idle' ? fr(e, 4, 4) : 0;
  return spr2('bsl' + col + p + f, () => bigslimeSprite(col, p, f));
};
ENEMY_IMG.mummy = e => { const p = e.st === 'wind' || e.st === 'grab' ? e.st : 'walk', f = p === 'walk' && Math.abs(e.vx) > 1 ? fr(e, 5, 4) : 0; return spr2('mum' + p + f, () => mummySprite(p, f)); };
ENEMY_IMG.smith = e => { const p = e.st === 'wind' ? 'wind' : e.st === 'slam' ? 'slam' : e.st === 'toss' ? 'toss' : 'walk', f = p === 'walk' && Math.abs(e.vx) > 1 ? fr(e, 5, 4) : 0; return spr2('smith' + p + f, () => smithSprite(p, f)); };
ENEMY_IMG.spider = (e, lv) => {
  const k = SPIDER_PAL[lv && lv.theme] ? lv.theme : 'cave', p = e.st === 'hang' ? 'hang' : e.st === 'leap' || e.st === 'drop' ? 'leap' : 'walk', f = p === 'walk' ? fr(e, 8, 2) : 0;
  return spr2('spd' + k + p + f, () => spiderSprite(p, f, SPIDER_PAL[k]));
};
Object.assign(ENEMY_YOFF, { wolf: 1, snake: 1, bigslime: 2, mummy: 2, smith: 1, spider: 3 });
// fio da aranha pendurada
ENEMY_PRE.spider = (g, e, cx, cy) => { if (e.st !== 'hang') return; g.globalAlpha = 0.55; g.fillStyle = '#e8e8ff'; g.fillRect(Math.round(cxOf(e) - cx), 0, 1, Math.max(0, Math.round(e.y + 2 - cy))); g.globalAlpha = 1; };

// ---------- comportamento ----------
Object.assign(E_AI, {
  // Lobo: patrulha devagar; ao ver o herói corre atrás, agacha rosnando e dá o bote
  wolf(w, e, dt) {
    const p = e.tgt, dx = cxOf(p) - cxOf(e), adx = Math.abs(dx), sl = e.slow > 0 ? 0.5 : 1;
    e.cd -= dt;
    if (e.st === 'wind') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) { e.st = 'leap'; e.vy = -230; e.vx = e.dir * 175 * sl; e.stT = 0.15; sfx('dash'); } }
    else if (e.st === 'leap') { e.stT -= dt; if (e.ground && e.stT <= 0) { e.st = 'rest'; e.stT = 0.5; } }
    else if (e.st === 'rest') { e.vx = approach(e.vx, 0, 700 * dt); e.stT -= dt; if (e.stT <= 0) e.st = null; }
    else {
      if (e.hurt > 0) { e.vx *= 0.9; return; }
      const hunt = adx < 170 && Math.abs(p.y - e.y) < 50;
      walk(w, e, hunt ? 88 : e.speed, hunt ? 170 : 0);
      if (hunt && e.ground && e.cd <= 0 && adx < 72) { e.st = 'wind'; e.stT = 0.4; e.dir = dx > 0 ? 1 : -1; e.cd = 2.2; sfx('growl'); }
    }
  },
  // Cobra: rasteja; de perto empina e dá o bote; de longe cospe veneno em arco
  snake(w, e, dt) {
    if (e.hurt > 0) { e.vx *= 0.9; e.atk = null; if (e.st === 'strike') e.st = null; return; }
    const p = e.tgt, dx = cxOf(p) - cxOf(e), adx = Math.abs(dx), dy = Math.abs(p.y + p.h - e.y - e.h);
    e.cd -= dt;
    if (e.st === 'wind') {
      e.vx = 0; e.stT -= dt;
      if (e.stT <= 0) {
        if (e.pick === 'spit') { e.st = 'spit'; e.stT = 0.4; lob(w, cxOf(e) + e.dir * 12, e.y - 10, cxOf(p), p.y + p.h - 3, 0.7, 380, { type: 'venom', w: 6, h: 6 }); sfx('hiss'); }
        else { e.st = 'strike'; e.stT = 0.25; sfx('slash'); }
      }
    } else if (e.st === 'strike') { e.vx = e.dir * 40; e.stT -= dt; e.atk = { x: e.dir > 0 ? e.x + e.w - 2 : e.x - 22, y: e.y - 6, w: 24, h: 13 }; if (e.stT <= 0) { e.st = 'rest'; e.stT = 0.6; e.atk = null; } }
    else if (e.st === 'spit' || e.st === 'rest') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) e.st = null; }
    else {
      walk(w, e, e.speed, 130);
      if (e.cd <= 0 && dy < 40) {
        if (adx < 46) { e.st = 'wind'; e.pick = 'strike'; e.stT = 0.4; e.dir = dx > 0 ? 1 : -1; e.cd = 1.6; sfx('hiss'); }
        else if (adx < 150 && Math.sign(dx) === e.dir) { e.st = 'wind'; e.pick = 'spit'; e.stT = 0.45; e.cd = 2.8; }
      }
    }
  },
  // Slime gigante: se arrasta e pula em cima do herói; ao morrer se divide em dois slimes
  bigslime(w, e, dt) {
    if (e.hurt > 0) { e.vx *= 0.92; return; }
    const p = e.tgt, dx = cxOf(p) - cxOf(e);
    if (!e.ground) return;
    if (e.air) { e.air = false; e.sq = 0.14; sfx('splat'); burst(w, cxOf(e), e.y + e.h, SLIME_COL[w.lv.theme] || '#8ad83a', 8, 60, 0.4); }
    if (e.st === 'wind') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) { e.st = null; e.air = true; e.vy = -290; e.vx = clamp(dx * 1.5, -100, 100); } return; }
    walk(w, e, e.speed, 130); e.cd -= dt;
    if (e.cd <= 0 && Math.abs(dx) < 110 && Math.abs(p.y - e.y) < 60) { e.st = 'wind'; e.stT = 0.45; e.cd = 2.4; e.dir = dx > 0 ? 1 : -1; }
  },
  // Múmia: arrasta os pés atrás do herói e agarra com os braços esticados
  mummy(w, e, dt) {
    if (e.hurt > 0) { e.vx *= 0.85; e.atk = null; if (e.st === 'grab') e.st = null; return; }
    const p = e.tgt, dx = cxOf(p) - cxOf(e);
    if (e.st === 'wind') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) { e.st = 'grab'; e.stT = 0.35; e.vx = e.dir * 95; sfx('slash'); } }
    else if (e.st === 'grab') { e.vx = approach(e.vx, 0, 260 * dt); e.stT -= dt; e.atk = { x: e.dir > 0 ? e.x + e.w - 2 : e.x - 18, y: e.y + 3, w: 20, h: 10 }; if (e.stT <= 0) { e.st = 'rest'; e.stT = 0.8; e.atk = null; } }
    else if (e.st === 'rest') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) e.st = null; }
    else { walk(w, e, e.speed, 150); e.cd -= dt; if (e.cd <= 0 && Math.abs(dx) < 44 && Math.abs(p.y - e.y) < 30) { e.st = 'wind'; e.stT = 0.5; e.cd = 2.0; e.dir = dx > 0 ? 1 : -1; } }
  },
  // Ferreiro demônio: levanta o martelo em brasa e bate no chão (onda de choque + faíscas);
  // de longe, arremessa com a tenaz o lingote em brasa que estava esquentando
  smith(w, e, dt) {
    const p = e.tgt, dx = cxOf(p) - cxOf(e);
    if (e.st === 'toss') {
      e.vx = 0; e.stT -= dt;
      if (e.stT <= 0) {
        e.st = 'rest'; e.stT = 0.4;
        lob(w, cxOf(e) + e.dir * 12, e.y + 4, cxOf(p), p.y + p.h - 3, 0.75, 520, { type: 'ingot', w: 7, h: 4, col: '#ff7a2a',
          then: (w2, q) => { burst(w2, q.x + 3, q.y + 2, '#ffb347', 10, 90, 0.4); burst(w2, q.x + 3, q.y + 2, '#fff0a0', 4, 60, 0.3); sfx('clang'); } });
        sfx('spear');
      }
      return;
    }
    if (e.st === 'wind') {
      e.vx = 0; e.stT -= dt;
      if (e.stT <= 0) {
        e.st = 'slam'; e.stT = 0.6; const hx = cxOf(e) + e.dir * 24;
        e.atk = { x: hx - 13, y: e.y + e.h - 16, w: 26, h: 16 };
        eshoot(w, { type: 'wave', w: 12, h: 9, x: hx - 6, y: e.y + e.h - 9, vx: e.dir * 135, life: 1.3 });
        burst(w, hx, e.y + e.h, '#ffb347', 14, 120, 0.5); feel(w, null, 0, 0.2); sfx('clang');
      }
    } else if (e.st === 'slam') { e.vx = 0; e.stT -= dt; if (e.stT < 0.42) e.atk = null; if (e.stT <= 0) { e.st = 'rest'; e.stT = 0.5; } }
    else if (e.st === 'rest') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) e.st = null; }
    else {
      if (e.hurt > 0) { e.vx *= 0.9; return; }
      walk(w, e, e.speed, 140); e.cd -= dt;
      if (e.cd <= 0 && Math.abs(dx) < 80 && Math.abs(p.y - e.y) < 40) { e.st = 'wind'; e.stT = 0.7; e.cd = 2.8; e.dir = dx > 0 ? 1 : -1; sfx('growl'); }
      else if (e.cd <= 0 && Math.abs(dx) < 170 && Math.abs(p.y - e.y) < 70) { e.st = 'toss'; e.stT = 0.55; e.cd = 3.2; e.dir = dx > 0 ? 1 : -1; }
    }
  },
  // Aranha: pendurada no fio; cai quando o herói passa por baixo e depois persegue dando saltos
  spider(w, e, dt) {
    const p = e.tgt, dx = cxOf(p) - cxOf(e);
    if (!e.init) { e.init = true; e.st = 'hang'; }
    if (e.st === 'hang') {
      e.vx = 0; e.vy = Math.sin(e.t * 2) * 6;
      if ((Math.abs(dx) < 30 && p.y > e.y && p.y - e.y < 120) || e.hurt > 0) { e.st = 'drop'; e.fly = false; e.vy = 30; sfx('hiss'); }
      return;
    }
    e.fly = false;
    if (e.st === 'drop') { if (e.ground) { e.st = null; e.cd = 0.5; } return; }
    if (e.st === 'leap') { if (e.ground && e.vy >= 0) { e.st = null; e.cd = 1.4; } return; }
    if (e.hurt > 0) { e.vx *= 0.9; return; }
    walk(w, e, e.speed, 160); e.cd -= dt;
    if (e.ground && e.cd <= 0 && Math.abs(dx) < 80 && Math.abs(p.y - e.y) < 40) { e.st = 'leap'; e.vy = -220; e.vx = e.dir * 120; e.cd = 1.8; }
  },
});
// Slime gigante se divide ao morrer
ON_KILL.bigslime = (w, e) => { for (const d of [-1, 1]) { const m = spawnEnemy(w, 'slime', cxOf(e) + d * 8, e.y + e.h); m.vx = d * 60; m.vy = -160; m.coin = 1; } };

// ---------- projéteis ----------
EPROJ_DRAW.venom = (g, q, x, y) => { g.fillStyle = '#5ad02a'; g.fillRect(x + 1, y, 4, 6); g.fillRect(x, y + 1, 6, 4); g.fillStyle = '#c8ff8a'; g.fillRect(x + 1, y + 1, 2, 2); };

// skins nas fases de transição (temas em js/worlds.js): mesmas cores do mundo de destino
Object.assign(ENEMY_SKIN, { graveyard: { bat: 'blood', ghost: 'crimson' }, peak: { knight: 'gold', guard: 'gold', ghost: 'storm' }, ash: { knight: 'demon' }, thaw: { skeleton: 'frost' } });
Object.assign(WOLF_SKIN, { thaw: 'snow', savanna: 'brown', ash: 'hell', graveyard: 'dark' });
Object.assign(HAWK_SKIN, { savanna: 'sand', peak: 'gold' });
SPIDER_PAL.graveyard = SPIDER_PAL.vampire;

// lingote em brasa arremessado pelo ferreiro (7x4)
EPROJ_DRAW.ingot = (g, q, x, y) => { g.fillStyle = '#c2361a'; g.fillRect(x, y, 7, 4); g.fillStyle = '#ff7a2a'; g.fillRect(x, y, 7, 3); g.fillStyle = '#ffe27a'; g.fillRect(x + 1, y, 5, 1); glowAt(g, x + 3, y + 2, 9, '#ff8a2a', 0.4); };
