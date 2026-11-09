'use strict';
// ---------- Bestiário novo: falcão, sapo, escorpião, diabrete e 6 chefes (lobo, cobra, múmia etc. em js/fauna.js) ----------
// Os sprites são gerados na primeira vez que aparecem (cache em SPR2): o jogo não fica mais lento para abrir.
Object.assign(ENEMIES, {
  hawk:      { w: 14, h: 10, hp: 2,   speed: 62, stomp: true,  coin: 1,  xp: 3,   fly: true },
  frog:      { w: 12, h: 10, hp: 3,   speed: 0,  stomp: true,  coin: 2,  xp: 4 },
  scorpion:  { w: 16, h: 10, hp: 4,   speed: 22, stomp: false, coin: 3,  xp: 7 },
  imp:       { w: 12, h: 14, hp: 3,   speed: 42, stomp: true,  coin: 3,  xp: 7,   fly: true },
  yeti:      { w: 30, h: 46, hp: 90,  speed: 0,  stomp: false, coin: 25, xp: 80,  boss: true },
  slimeking: { w: 40, h: 32, hp: 100, speed: 0,  stomp: false, coin: 25, xp: 90,  boss: true },
  scorpking: { w: 46, h: 24, hp: 110, speed: 0,  stomp: false, coin: 30, xp: 100, boss: true },
  magdragon: { w: 56, h: 34, hp: 120, speed: 0,  stomp: false, coin: 30, xp: 110, boss: true, fly: true, free: true },
  vampire:   { w: 16, h: 30, hp: 115, speed: 0,  stomp: false, coin: 35, xp: 120, boss: true, free: true },
  titan:     { w: 40, h: 50, hp: 160, speed: 0,  stomp: false, coin: 50, xp: 160, boss: true, fly: true, free: true },
});
Object.assign(BOSS_INFO, {
  yeti: { name: 'YETI ANCIAO', ban: 'Yeti Ancião', title: 'o Yeti Ancião', tip: 'Pule a lança baixa, abaixe-se da alta. Quando ele rugir, acerte a boca!',
    core: e => e.st === 'roar' ? { x: cxOf(e) - 6 + e.dir * 2, y: e.y - 2, w: 14, h: 14 } : null, coreCol: () => '#9fe8ff' },
  slimeking: { name: 'REI GOSMA', ban: 'Rei Gosma', title: 'o Rei Gosma', tip: 'A coroa é o ponto fraco. Cuidado com os filhotes!',
    core: e => ({ x: cxOf(e) - 8, y: e.y + e.h - 46, w: 14, h: 12 }), coreCol: () => '#ffe27a' },
  scorpking: { name: 'ESCORPIAO IMPERADOR', ban: 'Escorpião Imperador', title: 'o Escorpião Imperador', tip: 'Faça-o bater na parede e ataque a cabeça!',
    core: e => e.st === 'stun' ? { x: e.dir > 0 ? e.x + e.w - 18 : e.x, y: e.y - 4, w: 18, h: e.h + 4 } : null, coreCol: () => '#ffffff' },
  magdragon: { name: 'DRAGAO DE MAGMA', ban: 'Dragão de Magma', title: 'o Dragão de Magma', tip: 'Abaixe-se do sopro e acerte o peito em brasa!',
    core: e => e.st === 'breath' ? { x: cxOf(e) + e.dir * 9 - 8, y: e.y + 6, w: 16, h: 16 } : null, coreCol: () => '#ffb347' },
  vampire: { name: 'CONDE SANGUINARIO', ban: 'Conde Sanguinário', title: 'o Conde Sanguinário', tip: 'Ataque quando ele abrir a capa!', song: 'vampire',
    core: e => e.st === 'cast' ? { x: cxOf(e) - 7, y: e.y + 6, w: 14, h: 14 } : null, coreCol: () => '#ff3a4a' },
  titan: { name: 'TITA DA TEMPESTADE', ban: 'Titã da Tempestade', title: 'o Titã da Tempestade', tip: 'Fuja dos raios! O núcleo brilha quando ele chama a tempestade.', song: 'final',
    core: e => e.st === 'storm' ? { x: cxOf(e) - 9, y: e.y + 10, w: 18, h: 18 } : null, coreCol: () => '#9fe8ff' },
});

// ---------- utilidades ----------
const SPR2 = {};
const spr2 = (key, fn) => SPR2[key] || (SPR2[key] = fn());
const sh = (base, hi, lo, depth = 2) => ({ hi, lo, depth });
const arenaOf = w => ({ x0: 2 * T + 2, x1: (w.lv.w - 2) * T - 2, top: 4.5 * T, gy: GY0 * T, mid: w.lv.w * T / 2 });
function pickAtk(e, opts) { let k = opts[(Math.random() * opts.length) | 0]; if (k === e.last && opts.length > 1) k = opts[(opts.indexOf(k) + 1) % opts.length]; e.last = e.pick = k; return k; }
// arremesso em arco: sai de (x,y) e cai em (tx,ty) depois de t segundos
function lob(w, x, y, tx, ty, t, g, o) { const ww = o.w || 6, hh = o.h || 6; eshoot(w, { ...o, x: x - ww / 2, y: y - hh / 2, vx: (tx - x) / t, vy: (ty - y) / t - 0.5 * g * t, g }); }
// voa até (tx,ty) com aceleração suave; devolve a distância
function goto(e, tx, ty, sp) { const dx = tx - cxOf(e), dy = ty - cyOf(e), d = Math.hypot(dx, dy) || 1, v = Math.min(sp, d * 4); e.vx = lerp(e.vx, dx / d * v, 0.12); e.vy = lerp(e.vy, dy / d * v, 0.12); return d; }

// ---------- sprites dos inimigos comuns ----------
// Plumagens do falcão por mundo: marrom (floresta), branco (neve), areia (deserto), dourado (céu)
const HAWK_PAL = {
  brown: { B: ['#3a2210', '#6e4422', '#a06a38', '#d09a60'], F: ['#2a1808', '#5a3618', '#8a5a2e', '#c08a52'], chest: '#efe2c4', bars: '#a07a50', head: ['#efe2c4', '#ffffff', '#a89878'], cap: '#6e4422' },
  snow:  { B: ['#7a8aa4', '#b4c2d6', '#e2eaf4', '#ffffff'], F: ['#64728c', '#a2b0c6', '#d8e2ee', '#ffffff'], chest: '#ffffff', bars: '#9aa8bc', head: ['#ffffff', '#ffffff', '#b4c2d6'], cap: '#d8e2ee', spots: '#3a4458' },
  sand:  { B: ['#4a2a10', '#8a5a2a', '#c08a50', '#e8b878'], F: ['#3a200c', '#6e4420', '#a8743e', '#d8a868'], chest: '#f4dcae', bars: '#b08050', head: ['#f0d4b0', '#fff0d8', '#a87850'], cap: '#8a5a2a' },
  gold:  { B: ['#5a3a08', '#a8741a', '#e0a82a', '#ffe27a'], F: ['#4a2e06', '#8a5e14', '#c8902a', '#f4d070'], chest: '#fff4d0', bars: '#c8902a', head: ['#ffffff', '#ffffff', '#c8b890'], cap: '#e0a82a' },
};
const HAWK_SKIN = { snow: 'snow', ice: 'snow', icecave: 'snow', desert: 'sand', sky: 'gold' };
function hawkSprite(f, dive, pal = HAWK_PAL.brown) {
  const g = new PX(64, 44), cx = 30, cy = dive ? 22 : 24, { B, F } = pal;
  const flap = dive ? -3 : [13, 5, -7, 5][f];
  const wing = (dx, col, hi, lo) => { const wy = cy - 2, ty = wy - flap * 1.3; g.poly([[cx + 6 + dx, wy + 2], [cx - 6 + dx, ty - 3], [cx - 22 + dx, ty + (dive ? 7 : 0)], [cx - 14 + dx, wy + 5], [cx + 2 + dx, wy + 5]], col, sh(col, hi, lo)); };
  wing(-3, F[1], F[2], F[0]);
  g.poly([[cx - 10, cy - 2], [cx - 25, cy - 5 - (dive ? 3 : 0)], [cx - 26, cy + 2], [cx - 10, cy + 4]], B[1], sh(0, B[2], B[0], 1));
  g.ell(cx, cy, 13, 7, B[2], sh(0, B[3], B[0]));
  g.ell(cx + 2, cy + 3, 8, 3.2, pal.chest, { flat: true });
  for (let i = 0; i < 4; i++) g.rect(cx - 3 + i * 3, cy + 2 + (i % 2), 2, 1, pal.bars);
  g.ell(cx + 13, cy - 5, 6.5, 6, pal.head[0], sh(0, pal.head[1], pal.head[2], 1));
  g.poly([[cx + 8, cy - 11], [cx + 19, cy - 10], [cx + 16, cy - 7], [cx + 8, cy - 7]], pal.cap, { flat: true });
  g.poly([[cx + 18, cy - 6], [cx + 26, cy - 4], [cx + 24, cy + 1], [cx + 18, cy - 1]], '#ffc83a', sh(0, '#fff0a0', '#a87010', 1));
  g.px(cx + 24, cy + 2, '#a87010');
  g.rect(cx + 14, cy - 7, 3, 3, '#ffec4a'); g.rect(cx + 15, cy - 6, 2, 1, '#1b1423');
  g.line(cx + 11, cy - 10, cx + 18, cy - 7, '#1b1423'); g.line(cx + 11, cy - 9, cx + 17, cy - 6, '#1b1423');   // sobrancelha brava
  wing(0, F[2], F[3], F[0]);
  if (pal.spots) for (const [x, y] of [[-8, -4], [-13, -1], [-4, -2], [-10, 2], [-16, -6]]) { const yy = cy - 2 - flap * 1.3 * (Math.abs(x) / 22) + y + 2; g.px(cx + x, yy, pal.spots); g.px(cx + x + 1, yy, pal.spots); }
  const tl = dive ? 4 : 0;
  for (const dx of [2, 6]) { g.rect(cx + dx + tl, cy + 6, 2, 4, '#ffc83a'); g.rect(cx + dx - 1 + tl, cy + 10, 3, 1, '#1b1423'); }
  return outline(g.toCanvas(), INK);
}
// Sapo do brejo: verrugas venenosas, olhos saltados e língua comprida. pose: sit (2: papo) | air | tongue
function frogSprite(pose, f) {
  const g = new PX(140, 52), G = ['#1a200c', '#344016', '#56642a', '#82903e'], C = sh(0, G[3], G[0], 2), cx = 70, by = pose === 'air' ? 42 : 48;
  const wart = '#ee8a2a', wartL = '#ffd27a', belly = '#d8cc8a', air = pose === 'air', tg = pose === 'tongue';
  if (air) { g.cap(cx - 10, by - 6, cx - 26, by + 1, 7, G[2], C); g.cap(cx - 26, by + 1, cx - 36, by - 1, 4, G[2], C); g.ell(cx - 38, by - 1, 3.5, 2, G[1], { flat: true }); }
  else { g.ell(cx - 12, by - 5, 9, 6.5, G[2], C); g.ell(cx - 8, by - 1, 7, 2.2, G[1], { flat: true }); }
  g.ell(cx, by - 10 - (air ? 2 : 0), 17, air ? 9 : 11, G[2], sh(0, G[3], G[0], 3));
  g.ell(cx + 4, by - 4, 11, 4, belly, { flat: true });
  for (const [x, y, r] of [[-10, -17, 2.2], [-3, -20, 2.6], [-14, -11, 1.8], [4, -18, 1.8], [-6, -13, 1.6]]) { g.ell(cx + x, by + y, r, r, wart, { flat: true }); g.px(cx + x - 1, by + y - 1, wartL); }
  if (pose === 'sit' && f) g.ell(cx + 13, by - 3, 6, 4.5, '#e8b84a', sh(0, '#fff0a0', '#a8701a', 1));          // papo inflado
  g.ell(cx + 11, by - 13, 10, 8, G[2], C);
  const mo = tg ? 5 : 0;
  g.line(cx + 4, by - 9, cx + 20, by - 10, G[0]);
  if (tg) {
    g.poly([[cx + 6, by - 9], [cx + 21, by - 10], [cx + 20, by - 4], [cx + 8, by - 6]], '#4a0a18', { flat: true });
    g.cap(cx + 16, by - 7, cx + 62, by - 8, 4, '#ff6a8a', sh(0, '#ffb0c4', '#b02a4a', 1)); g.ell(cx + 63, by - 8, 4, 3.4, '#ff6a8a', sh(0, '#ffb0c4', '#b02a4a', 1));
  }
  for (const [ex, ey] of [[cx + 6, by - 21 - mo * 0.2], [cx + 15, by - 20 - mo * 0.2]]) {
    g.ell(ex, ey, 5, 5, G[2], sh(0, G[3], G[0], 1)); g.ell(ex + 0.5, ey - 0.5, 3.4, 3.2, '#ffd23f', { flat: true });
    g.rect(ex - 2, ey - 1, 5, 2, '#1b1423');
    g.line(ex - 4, ey - 5, ex + 3, ey - 3, G[0]);                          // pálpebra brava
  }
  if (!air) { g.cap(cx + 9, by - 6, cx + 14, by - 1, 4, G[2], C); g.ell(cx + 15, by - 1, 3, 1.6, G[1], { flat: true }); }
  return outline(g.toCanvas(), INK);
}
// Escorpião (k = escala: 1 comum, 2 imperador). mode: walk | wind | sting | stun
function scorpDraw(g, cx, by, k, S, mode, f, crown) {
  const lg = f % 2 ? 1 : -1;
  for (let i = 0; i < 4; i++) { const x = cx - 10 * k + i * 7 * k; g.cap(x, by - 4 * k, x + (i % 2 ? lg : -lg) * 3 * k - 2 * k, by, 2 * k, S[0], { flat: true }); }
  const tip = mode === 'sting' ? [cx + 28 * k, by - 20 * k] : mode === 'wind' ? [cx - 6 * k, by - 40 * k] : [cx + 6 * k, by - 34 * k + (f % 2) * k];
  const p0 = [cx - 18 * k, by - 8 * k], c0 = [cx - 30 * k, by - 34 * k];
  for (let i = 0; i <= 7; i++) {
    const t = i / 7, u = 1 - t, x = u * u * p0[0] + 2 * u * t * c0[0] + t * t * tip[0], y = u * u * p0[1] + 2 * u * t * c0[1] + t * t * tip[1];
    g.ell(x, y, (4.4 - t * 1.4) * k, (4 - t * 1.2) * k, S[2], sh(0, S[3], S[0], k > 1 ? 2 : 1));
  }
  const dx = mode === 'sting' ? 1 : 0.4, dy = mode === 'sting' ? 0.3 : 1;
  g.poly([[tip[0] - 3 * k, tip[1] - 2 * k], [tip[0] + 9 * k * dx, tip[1] + 9 * k * dy], [tip[0] + 3 * k, tip[1] + 2 * k]], '#3a1a2a', sh(0, '#9a4a7a', '#1a0a10', 1));
  for (let i = 0; i < 4; i++) g.ell(cx - 12 * k + i * 8 * k, by - 7 * k, 6.5 * k, 5 * k, S[2], sh(0, S[3], S[0], k > 1 ? 3 : 2));
  for (let i = 0; i < 3; i++) g.rect(cx - 8 * k + i * 8 * k, by - 11 * k, 1 * k, 7 * k, S[1]);
  const hx = cx + 18 * k, hy = by - 7 * k;
  g.ell(hx, hy, 7 * k, 5.5 * k, S[2], sh(0, S[3], S[0], k > 1 ? 3 : 2));
  const ec = mode === 'stun' ? '#fff' : '#ff3a3a';
  g.rect(hx + 1 * k, hy - 3 * k, 2 * k, 2 * k, ec); g.rect(hx + 4 * k, hy - 3 * k, 2 * k, 2 * k, ec);
  if (mode === 'stun') { g.rect(hx + 1 * k, hy - 2.5 * k, 5 * k, 1 * k, '#1b1423'); }
  const cl = mode === 'charge' ? 6 * k : 0;
  for (const s of [-1, 1]) {
    const ax = hx + 4 * k, ay = hy + s * 2 * k, bx = hx + 13 * k + cl, byy = hy + s * 4 * k - 3 * k;
    g.cap(ax, ay, bx, byy, 3 * k, S[1], sh(0, S[2], S[0], 1));
    g.poly([[bx - 2 * k, byy - 4 * k], [bx + 9 * k, byy - 5 * k], [bx + 4 * k, byy], [bx + 9 * k, byy + 3 * k], [bx - 2 * k, byy + 3 * k]], S[2], sh(0, S[3], S[0], k > 1 ? 2 : 1));
  }
  if (crown) g.poly([[hx - 5 * k, hy - 5 * k], [hx - 4 * k, hy - 10 * k], [hx - 1 * k, hy - 7 * k], [hx + 2 * k, hy - 11 * k], [hx + 4 * k, hy - 7 * k], [hx + 6 * k, hy - 10 * k], [hx + 6 * k, hy - 5 * k]], '#ffd23f', sh(0, '#fff2a0', '#a8781a', 2));
}
function scorpionSprite(mode, f) { const g = new PX(84, 50); scorpDraw(g, 36, 46, 1, ['#5a3418', '#8a5a2a', '#c08a48', '#e8b878'], mode, f, false); return outline(g.toCanvas(), INK); }
function impSprite(f, thr) {
  const g = new PX(52, 56), R = ['#6a0e14', '#a01e24', '#d8443a', '#ff8a6a'], cx = 26, cy = 28, fl = [8, 2, -4, 2][f];
  for (const s of [-1, 1]) g.poly([[cx + s * 4, cy - 2], [cx + s * 20, cy - 10 - fl], [cx + s * 22, cy + 2 - fl * 0.5], [cx + s * 15, cy], [cx + s * 16, cy + 6 - fl * 0.3], [cx + s * 6, cy + 4]], '#3a0e1a', sh(0, '#6a2a3a', '#1a0408', 1));
  g.cap(cx - 4, cy + 12, cx - 12, cy + 20, 2, R[1], { flat: true }); g.poly([[cx - 14, cy + 18], [cx - 18, cy + 23], [cx - 10, cy + 22]], R[1], { flat: true });
  g.ell(cx, cy + 8, 7, 8, R[2], sh(0, R[3], R[0]));
  g.rect(cx - 4, cy + 15, 3, 5, R[1]); g.rect(cx + 2, cy + 15, 3, 5, R[1]);
  g.ell(cx + 1, cy - 4, 9, 8, R[2], sh(0, R[3], R[0]));
  for (const s of [-1, 1]) g.poly([[cx + 1 + s * 5, cy - 9], [cx + 1 + s * 9, cy - 19], [cx + 1 + s * 2, cy - 11]], '#f0e0c0', sh(0, '#ffffff', '#a89878', 1));
  g.rect(cx - 3, cy - 6, 3, 3, '#ffec4a'); g.rect(cx + 3, cy - 6, 3, 3, '#ffec4a'); g.px(cx - 1, cy - 5, '#1b1423'); g.px(cx + 5, cy - 5, '#1b1423');
  g.rect(cx - 3, cy, 9, 2, '#1b1423'); g.px(cx - 1, cy, '#fff'); g.px(cx + 3, cy, '#fff');
  if (thr) { g.cap(cx + 5, cy + 5, cx + 12, cy - 6, 3, R[2], { flat: true }); g.ell(cx + 13, cy - 10, 4, 4, '#ffb04a', sh(0, '#fff0a0', '#c2561a', 1)); }
  else g.cap(cx + 5, cy + 5, cx + 9, cy + 12, 3, R[2], { flat: true });
  return outline(g.toCanvas(), INK);
}

// ---------- sprites dos chefes ----------
// Yeti Ancião: caçador das neves. Lança de osso com ponta de gelo, colar de presas, tanga de pele e pintura de guerra.
// pose: idle (2) | aim (lança armada) | throw (braço à frente) | stomp (perna erguida) | roar (boca aberta) | toss (joga estacas de gelo)
function yetiSprite(pose, f, rage) {
  const g = new PX(150, 124), cx = 75, feet = 122;
  const F = rage ? ['#6a7898', '#a0b0cc', '#d0dcee', '#ffffff'] : ['#7a8aa8', '#b4c4dc', '#e2eaf6', '#ffffff'];
  const skin = rage ? '#7a5aa8' : '#4a6aa8', skinL = rage ? '#b89ae0' : '#8aaee0', skinD = rage ? '#3e2470' : '#22407a';
  const C = sh(0, F[3], F[0], 3), paint = rage ? '#ff3a3a' : '#d84a2a';
  const b = pose === 'idle' ? f * 2 : 0, crouch = pose === 'toss' ? 6 : pose === 'stomp' ? -3 : 0;
  const ty = 38 + b + crouch;
  const spear = (x0, y0, x1, y1) => {
    g.cap(x0, y0, x1, y1, 4, '#c8b48a', sh(0, '#f0e0b8', '#7a6440', 1));                   // haste de osso
    const a = Math.atan2(y1 - y0, x1 - x0), c = Math.cos(a), s = Math.sin(a);
    g.poly([[x1 - s * 4, y1 + c * 4], [x1 + c * 16, y1 + s * 16], [x1 + s * 4, y1 - c * 4]], '#9fe0ff', sh(0, '#ffffff', '#3a88c0', 1));
    g.cap(x1 - c * 3, y1 - s * 3, x1 - c * 7, y1 - s * 7, 5, '#6a4a2a', { flat: true });      // amarração
    for (const k of [-1, 1]) g.poly([[x1 - c * 7, y1 - s * 7], [x1 - c * 12 + s * k * 6, y1 - s * 12 - c * k * 6], [x1 - c * 14 + s * k * 2, y1 - s * 14 - c * k * 2]], k > 0 ? '#e04a3a' : '#ffffff', { flat: true });
  };
  if (pose === 'idle') spear(cx + 36, feet - 2, cx + 36, ty - 30);
  if (pose === 'aim') spear(cx - 46, ty - 6, cx + 22, ty - 22);
  // pernas
  for (const s of [-1, 1]) {
    if (pose === 'stomp' && s > 0) {
      g.cap(cx + 10, ty + 48, cx + 24, ty + 36, 20, F[1], C); g.cap(cx + 24, ty + 36, cx + 26, ty + 58, 18, F[1], C);
      g.ell(cx + 28, ty + 62, 13, 5, skin, sh(0, skinL, skinD));
      continue;
    }
    g.poly([[cx + s * 10 - 11, 84 + crouch], [cx + s * 10 + 11, 84 + crouch], [cx + s * 12 + 12, feet - 4], [cx + s * 12 - 12, feet - 4]], F[1], C);
    g.ell(cx + s * 13, feet - 4, 13, 4.5, skin, sh(0, skinL, skinD));
    for (let k = 0; k < 3; k++) g.rect(cx + s * 13 + 4 + k * 3, feet - 6, 2, 3, '#e8e0d0');                 // garras
  }
  // tronco, tanga de pele e colar de presas
  g.ell(cx, ty + 26, 31, 30, F[1], sh(0, F[3], F[0], 4));
  g.ell(cx + 4, ty + 30, 16, 18, F[2], { flat: true });
  g.poly([[cx - 27, ty + 44], [cx + 27, ty + 44], [cx + 24, ty + 62], [cx + 10, ty + 56], [cx - 2, ty + 64], [cx - 14, ty + 56], [cx - 26, ty + 62]], '#8a5a30', sh(0, '#b88450', '#4a2a14', 2));
  for (let i = 0; i < 4; i++) g.rect(cx - 20 + i * 12, ty + 48, 6, 2, '#5a3418');
  g.rect(cx - 28, ty + 42, 56, 4, '#4a2e18'); g.ell(cx + 2, ty + 44, 4, 3, '#c8a050', sh(0, '#ffe8a0', '#7a5a20', 1));
  for (let i = 0; i < 7; i++) { const a = Math.PI * (0.2 + i * 0.1), x = cx + 2 + Math.cos(a) * 18, y = ty + 2 + Math.sin(a) * 10; g.poly([[x - 2, y], [x, y + 6], [x + 2, y]], '#fff8e8', sh(0, '#ffffff', '#a89878', 1)); }
  g.line(cx - 15, ty + 4, cx + 19, ty + 4, '#5a3418');
  // braços
  const arm = (x0, y0, x1, y1) => { g.cap(x0, y0, x1, y1, 17, F[1], sh(0, F[2], F[0], 3)); g.ell(x1, y1 + 4, 9, 8, skin, sh(0, skinL, skinD)); };
  if (pose === 'idle') { arm(cx - 26, ty + 14, cx - 32, ty + 48 + b); arm(cx + 26, ty + 14, cx + 34, ty + 36); }
  else if (pose === 'aim') { arm(cx - 26, ty + 14, cx - 34, ty + 30); arm(cx + 24, ty + 12, cx - 4, ty - 12); }
  else if (pose === 'throw') { arm(cx - 26, ty + 14, cx - 38, ty + 24); arm(cx + 26, ty + 12, cx + 54, ty + 10); }
  else if (pose === 'stomp' || pose === 'roar') { arm(cx - 26, ty + 14, cx - 44, ty - 10); arm(cx + 26, ty + 14, cx + 44, ty - 10); }
  else { arm(cx - 26, ty + 14, cx - 30, ty + 44); arm(cx + 26, ty + 14, cx + 50, ty + 36); for (const d of [-4, 3]) g.poly([[cx + 52 + d, ty + 30], [cx + 55 + d, ty + 20], [cx + 58 + d, ty + 30]], '#bfeaff', sh(0, '#ffffff', '#5aa0d0', 1)); }
  // cabeça: chifres, rosto azul, pintura de guerra
  const hy = ty - 10 - (pose === 'roar' ? 2 : 0);
  g.ell(cx, hy, 21, 18, F[1], sh(0, F[3], F[0], 3));
  for (const s of [-1, 1]) g.poly([[cx + s * 12, hy - 10], [cx + s * 28, hy - 28], [cx + s * 22, hy - 30], [cx + s * 6, hy - 16]], '#e8dcc0', sh(0, '#ffffff', '#9a8a6a', 2));
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) g.rect(cx + s * (14 + k * 4) - 1, hy - 14 - k * 4, 2, 2, '#9a8a6a');              // anéis nos chifres
  g.ell(cx + 4, hy + 4, 13, 11, skin, sh(0, skinL, skinD));
  for (const x of [cx - 6, cx + 14]) { g.rect(x, hy + 3, 4, 1, paint); g.rect(x, hy + 6, 4, 1, paint); }
  const ec = rage ? '#ff3a3a' : '#ffec4a';
  g.rect(cx - 3, hy - 1, 5, 3, ec); g.rect(cx + 7, hy - 1, 5, 3, ec);
  g.line(cx - 6, hy - 5, cx + 2, hy - 2, '#1b1423'); g.line(cx - 6, hy - 4, cx + 2, hy - 1, '#1b1423'); g.line(cx + 15, hy - 5, cx + 7, hy - 2, '#1b1423'); g.line(cx + 15, hy - 4, cx + 7, hy - 1, '#1b1423');
  if (pose === 'roar' || pose === 'stomp') { g.ell(cx + 4, hy + 9, 8, 6, '#3a0a1a', { flat: true }); g.ell(cx + 4, hy + 12, 4, 2, '#d0405a', { flat: true }); for (const dx of [-3, 9]) g.poly([[cx + dx, hy + 3], [cx + dx + 2, hy + 8], [cx + dx + 4, hy + 3]], '#ffffff', { flat: true }); }
  else { g.rect(cx - 2, hy + 8, 12, 2, '#1b2a4a'); g.px(cx - 1, hy + 7, '#fff'); g.px(cx + 8, hy + 7, '#fff'); }
  if (pose === 'idle') { g.ell(cx + 34, ty + 38, 9, 8, skin, sh(0, skinL, skinD)); }          // mão por cima da lança
  return outline(g.toCanvas(), INK);
}
function slimekingSprite(pose, f, rage) {     // idle | squash | jump | spit
  const g = new PX(130, 100), col = rage ? '#b8e040' : '#6ad03a', cx = 65, base = 96;
  const rx = pose === 'squash' ? 52 : pose === 'jump' ? 34 : 44 + (pose === 'idle' ? f * 2 : 0), ry = pose === 'squash' ? 27 : pose === 'jump' ? 44 : 36 - (pose === 'idle' ? f * 2 : 0);
  const cy = base - ry * 0.95;
  g.shape(cx - rx, cy - ry, cx + rx, base, (x, y) => y <= base && Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2) <= 1, col, { hi: shade(col, 0.45), lo: shade(col, -0.4), depth: 4, depthD: 4 });
  g.ell(cx + 10, base - 16, 15, 8, shade(col, -0.15), { flat: true });
  for (const [x, y, r] of [[-20, -10, 4], [18, -24, 3], [-6, -30, 2.5], [26, -12, 2]]) g.ell(cx + x, base + y, r, r, shade(col, 0.3), { flat: true });
  g.rect(cx - rx * 0.6, cy - ry * 0.55, 8, 4, '#ffffff'); g.rect(cx - rx * 0.6 - 2, cy - ry * 0.55 + 4, 3, 5, '#ffffff');
  const ey = cy - 4, dk = shade(col, -0.65);
  g.rect(cx - 17, ey - 4, 11, 12, '#ffffff'); g.rect(cx + 6, ey - 4, 11, 12, '#ffffff');
  g.rect(cx - 11, ey - 1, 5, 8, '#1b1423'); g.rect(cx + 11, ey - 1, 5, 8, '#1b1423');
  for (const d of [0, 1]) { g.line(cx - 19, ey - 9 + d, cx - 5, ey - 4 + d, dk); g.line(cx + 19, ey - 9 + d, cx + 5, ey - 4 + d, dk); }
  if (pose === 'spit') { g.ell(cx + 2, ey + 18, 11, 8, dk, { flat: true }); g.ell(cx + 2, ey + 21, 5, 3, '#d04a6a', { flat: true }); }
  else { g.rect(cx - 9, ey + 15, 22, 3, dk); g.rect(cx - 9, ey + 13, 2, 2, dk); g.rect(cx + 11, ey + 13, 2, 2, dk); }
  const ky = cy - ry + 2;
  g.poly([[cx - 15, ky + 6], [cx - 15, ky - 8], [cx - 9, ky - 1], [cx - 2, ky - 12], [cx + 5, ky - 1], [cx + 11, ky - 8], [cx + 11, ky + 6]], '#ffd23f', sh(0, '#fff2a0', '#a8781a', 2));
  g.rect(cx - 4, ky - 1, 5, 5, '#ff3a5a'); g.px(cx - 3, ky, '#ffb0c0');
  return outline(g.toCanvas(), INK);
}
function scorpkingSprite(pose, f, rage) {     // walk | wind | sting | charge | stun | mound
  const g = new PX(176, 100);
  if (pose === 'mound') {
    g.ell(88, 98, 46, 14, '#c89050', sh(0, '#f0c888', '#7a5028', 3));
    for (let i = 0; i < 9; i++) g.ell(52 + i * 9, 88 + (i % 3) * 2, 4, 3, '#e0b070', { flat: true });
    return outline(g.toCanvas(), INK);
  }
  const S = rage ? ['#3a0e2a', '#6a1e4a', '#9a3a6a', '#d070a0'] : ['#2a1440', '#4a2a6a', '#7a4a9a', '#b088d4'];
  scorpDraw(g, 72, 94, 2, S, pose, f, true);
  for (let i = 0; i < 4; i++) g.rect(48 + i * 16, 74, 6, 3, '#ffd23f');   // faixas douradas da armadura
  return outline(g.toCanvas(), INK);
}
// Dragão de Magma: asas de morcego com dedos, pescoço longo em S, chifres para trás, placas douradas e veias de lava.
// pose: fly (2: asas em cima / embaixo) | breath (pousado, cabeça baixa, boca aberta) | dive (asas recolhidas)
function dragonSprite(pose, f, rage) {
  const g = new PX(210, 168), cx = 105, cy = 100;
  const R = rage ? ['#3a0404', '#7a120a', '#b82a14', '#ff6a2a'] : ['#22070b', '#541612', '#8c2a1a', '#c85228'];
  const PL = ['#8a4a14', '#d08a2a', '#f4c060', '#fff0b0'], M = rage ? ['#300806', '#6a1a0c', '#a8381a'] : ['#200608', '#4a1410', '#7a2a1c'];
  const lava = rage ? '#ffe27a' : '#ff9a2a', bone = ['#7a6a50', '#d8c8a0', '#ffffff'];
  const C3 = sh(0, R[3], R[0], 3), C2 = sh(0, R[3], R[0], 2), C1 = sh(0, R[3], R[0], 1);
  const breath = pose === 'breath', dive = pose === 'dive';
  const ang = (pose === 'fly' ? (f ? -38 : 62) : breath ? 28 : 10) * Math.PI / 180;
  const pt = (x, y, a, L) => [x - Math.cos(a) * L, y - Math.sin(a) * L];
  const wing = (sx, sy, k, mem, bn) => {
    const el = pt(sx, sy, ang, 20 * k), wr = pt(el[0], el[1], ang + 0.25, 22 * k);
    const spread = dive ? [0.35, 0.12, -0.1, -0.32] : ang < 0 ? [1.3, 0.8, 0.3, -0.2] : [0.35, -0.25, -0.85, -1.4];
    const tips = [36, 42, 36, 26].map((L, i) => pt(wr[0], wr[1], ang + spread[i], L * k * (dive ? 0.75 : 1)));
    const root = [sx - 30 * k, sy + 6];
    const pts = [[sx, sy], el, wr, tips[0]];
    for (let i = 1; i < tips.length; i++) { const a = tips[i - 1], b = tips[i]; pts.push([(a[0] + b[0]) / 2 * 0.72 + wr[0] * 0.28, (a[1] + b[1]) / 2 * 0.72 + wr[1] * 0.28]); pts.push(b); }
    pts.push([(tips[3][0] + root[0]) / 2 * 0.8 + wr[0] * 0.2, (tips[3][1] + root[1]) / 2 * 0.8 + wr[1] * 0.2], root);
    g.poly(pts, mem[1], sh(0, mem[2], mem[0], 2));
    g.cap(sx, sy, el[0], el[1], 6 * k, bn, C1); g.cap(el[0], el[1], wr[0], wr[1], 5 * k, bn, C1);
    for (const t of tips) g.cap(wr[0], wr[1], t[0], t[1], 2.2, bn, { flat: true });
    g.poly([[wr[0] - 2, wr[1]], [wr[0] + 3, wr[1] - 7], [wr[0] + 3, wr[1] + 1]], bone[1], sh(0, bone[2], bone[0], 1));
  };
  wing(cx + 8, cy - 14, 1, [M[0], M[0], M[1]], R[1]);                          // asa de trás (mais escura)
  // cauda com ponta de lança
  const tw = (f && pose === 'fly') ? 3 : -2, tail = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14, u = 1 - t; tail.push([u * u * (cx - 26) + 2 * u * t * (cx - 62) + t * t * (cx - 98), u * u * (cy + 4) + 2 * u * t * (cy + 28) + t * t * (cy + 6 + tw), 10 - t * 7.5]); }
  for (const [x, y, r] of tail) g.ell(x, y, r, r, R[2], C2);
  tail.forEach(([x, y, r], i) => { if (i % 2 === 0 && i > 1) g.poly([[x - 3, y - r + 1], [x - 1, y - r - 5], [x + 2, y - r + 1]], R[3], { flat: true }); });
  const te = tail[14];
  g.poly([[te[0] + 2, te[1]], [te[0] - 8, te[1] - 8], [te[0] - 14, te[1]], [te[0] - 8, te[1] + 7]], R[2], C1);
  // pata traseira
  g.ell(cx - 14, cy + 8, 12, 11, R[2], C2);
  const foot = (x0, y0, x1, y1) => { g.cap(x0, y0, x1, y1, 7, R[2], C1); for (let k = 0; k < 3; k++) g.poly([[x1 - 3 + k * 4, y1 + 1], [x1 - 1 + k * 4, y1 + 6], [x1 + 1 + k * 4, y1 + 1]], bone[1], sh(0, bone[2], bone[0], 1)); };
  if (breath) foot(cx - 10, cy + 14, cx - 8, cy + 30); else foot(cx - 10, cy + 14, cx - 18, cy + 28);
  // corpo, peito, placas e veias de lava
  g.ell(cx - 4, cy, 30, 16, R[2], C3);
  g.ell(cx + 16, cy - 4, 18, 16, R[2], C3);
  for (let i = 0; i < 7; i++) g.ell(cx - 18 + i * 6.5, cy + 12 - Math.max(0, i - 3) * 2.2, 4.2, 3.2, PL[2], sh(0, PL[3], PL[0], 1));
  for (const [x0, y0, x1, y1, x2, y2] of [[-24, -6, -16, -2, -12, -8], [-4, -10, 2, -4, 8, -8], [12, 2, 18, -2, 22, 4]]) { g.line(cx + x0, cy + y0, cx + x1, cy + y1, lava); g.line(cx + x1, cy + y1, cx + x2, cy + y2, lava); }
  for (let i = 0; i < 7; i++) { const x = cx - 28 + i * 8; g.poly([[x - 3, cy - 13 + (i > 4 ? -3 : 0)], [x + 1, cy - 22 - (i % 2) * 3 + (i > 4 ? -3 : 0)], [x + 4, cy - 14 + (i > 4 ? -3 : 0)]], R[3], sh(0, PL[3], R[1], 1)); }
  // pata dianteira
  if (breath) foot(cx + 20, cy + 8, cx + 26, cy + 30); else foot(cx + 20, cy + 8, cx + 24, cy + 24);
  // pescoço em S com placas
  const n0 = [cx + 24, cy - 10], nc = breath ? [cx + 46, cy - 30] : dive ? [cx + 40, cy - 22] : [cx + 30, cy - 44], n1 = breath ? [cx + 56, cy - 2] : dive ? [cx + 58, cy - 22] : [cx + 50, cy - 44];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, u = 1 - t, x = u * u * n0[0] + 2 * u * t * nc[0] + t * t * n1[0], y = u * u * n0[1] + 2 * u * t * nc[1] + t * t * n1[1];
    g.ell(x, y, 9 - t * 2.5, 9 - t * 2.5, R[2], C2);
    if (i % 2 === 0) g.ell(x + 4 - t, y + 4, 3.4, 2.6, PL[2], sh(0, PL[3], PL[0], 1));
    if (i % 2 === 1) g.poly([[x - 4, y - 6], [x - 4, y - 13], [x + 1, y - 7]], R[3], { flat: true });
  }
  // cabeça
  const hx = n1[0] + 6, hy = n1[1] + (breath ? 2 : -2);
  for (const [a, b, c] of [[[0, -9], [-28, -26], [-6, -3]], [[-3, -5], [-32, -11], [-8, 0]]]) g.poly([[hx + a[0], hy + a[1]], [hx + (a[0] + b[0]) / 2 - 2, hy + (a[1] + b[1]) / 2 - 3], [hx + b[0], hy + b[1]], [hx + c[0], hy + c[1]]], bone[1], sh(0, bone[2], bone[0], 1));
  g.poly([[hx - 8, hy + 3], [hx - 18, hy + 8], [hx - 6, hy + 7]], R[3], { flat: true });
  g.ell(hx, hy, 11, 9, R[2], C2);
  if (breath) {
    g.poly([[hx + 2, hy + 3], [hx + 24, hy + 12], [hx + 21, hy + 16], [hx, hy + 9]], R[1], C1);
    g.poly([[hx + 4, hy + 2], [hx + 24, hy + 1], [hx + 24, hy + 12], [hx + 4, hy + 8]], '#2a0404', { flat: true });
    g.ell(hx + 16, hy + 6, 6, 3.4, lava, { hi: '#fff6c8', lo: '#c2361a', depth: 1 });
  } else g.poly([[hx + 2, hy + 3], [hx + 24, hy + 3], [hx + 21, hy + 7], [hx + 2, hy + 8]], R[1], C1);
  g.poly([[hx + 3, hy - 7], [hx + 26, hy - 3], [hx + 28, hy + 2], [hx + 6, hy + 3]], R[2], C1);
  for (let k = 0; k < 5; k++) g.poly([[hx + 8 + k * 4, hy + 2], [hx + 9 + k * 4, hy + 5], [hx + 10 + k * 4, hy + 2]], '#ffffff', { flat: true });
  g.px(hx + 25, hy - 2, '#1b1423'); g.px(hx + 24, hy - 2, '#1b1423');
  g.poly([[hx - 2, hy - 7], [hx + 12, hy - 6], [hx + 10, hy - 3], [hx, hy - 4]], R[0], { flat: true });            // sobrancelha
  g.rect(hx + 4, hy - 4, 5, 3, '#ffe94d'); g.rect(hx + 6, hy - 4, 1, 3, '#1b1423');
  wing(cx - 2, cy - 10, 1.2, M, R[2]);                                                        // asa da frente
  return outline(g.toCanvas(), INK);
}
function vampireSprite(pose, f, rage) {       // idle (2) | cast | dash
  const g = new PX(84, 92), cx = 40, bob = pose === 'idle' ? f : 0;
  const capeO = '#1a0a1e', capeI = rage ? '#c01a3a' : '#8a0e22', skin = '#e4dcef';
  if (pose === 'cast') for (const s of [-1, 1]) { g.poly([[cx + s * 6, 26], [cx + s * 38, 16], [cx + s * 34, 72], [cx + s * 22, 82], [cx + s * 8, 76]], capeO, sh(0, '#3a1a3e', '#08030a', 2)); g.poly([[cx + s * 8, 30], [cx + s * 33, 22], [cx + s * 30, 68], [cx + s * 10, 72]], capeI, sh(0, shade(capeI, 0.3), shade(capeI, -0.4), 2)); }
  else if (pose === 'dash') g.poly([[cx - 2, 26], [cx - 38, 36], [cx - 34, 56], [cx - 42, 74], [cx - 6, 86]], capeO, sh(0, '#3a1a3e', '#08030a', 2));
  else g.poly([[cx - 13, 26 + bob], [cx + 13, 26 + bob], [cx + 18, 88], [cx - 20, 88]], capeO, sh(0, '#3a1a3e', '#08030a', 2));
  g.rect(cx - 7, 66, 5, 22, '#1a1420'); g.rect(cx + 2, 66, 5, 22, '#1a1420'); g.rect(cx - 8, 86, 7, 3, '#08060c'); g.rect(cx + 2, 86, 8, 3, '#08060c');
  g.poly([[cx - 10, 30 + bob], [cx + 10, 30 + bob], [cx + 8, 68], [cx - 8, 68]], '#2a1a34', sh(0, '#4a3a54', '#14081a', 2));
  g.poly([[cx - 4, 32 + bob], [cx + 4, 32 + bob], [cx + 3, 56], [cx - 3, 56]], capeI, { flat: true }); g.rect(cx - 2, 32 + bob, 4, 8, '#f4f0f8');
  for (const s of [-1, 1]) g.poly([[cx + s * 9, 30 + bob], [cx + s * 17, 13 + bob], [cx + s * 6, 24 + bob]], capeI, sh(0, shade(capeI, 0.3), shade(capeI, -0.4), 1));
  const hy = 20 + bob;
  g.ell(cx + 1, hy, 8, 9, skin, sh(0, '#ffffff', '#9a8aaa'));
  g.poly([[cx - 8, hy - 2], [cx - 7, hy - 9], [cx + 1, hy - 11], [cx + 9, hy - 8], [cx + 9, hy - 3], [cx + 3, hy - 6], [cx + 1, hy - 3]], '#14101c', sh(0, '#3a3046', '#08060c', 1));
  g.rect(cx - 1, hy, 3, 2, '#ff2a3a'); g.rect(cx + 4, hy, 3, 2, '#ff2a3a');
  g.rect(cx, hy + 5, 6, 1, '#6a1a2a'); g.px(cx + 1, hy + 6, '#ffffff'); g.px(cx + 4, hy + 6, '#ffffff');
  if (pose === 'cast') for (const s of [-1, 1]) { g.cap(cx + s * 9, 34, cx + s * 26, 26, 4, '#2a1a34', { flat: true }); g.ell(cx + s * 28, 25, 3, 3, skin, { flat: true }); }
  else if (pose === 'dash') { g.cap(cx + 8, 36, cx + 24, 40, 4, '#2a1a34', { flat: true }); g.poly([[cx + 24, 37], [cx + 32, 38], [cx + 24, 43]], skin, { flat: true }); }
  else { g.cap(cx - 8, 36 + bob, cx - 2, 50, 4, '#2a1a34', { flat: true }); g.cap(cx + 8, 36 + bob, cx + 2, 50, 4, '#2a1a34', { flat: true }); g.ell(cx, 51, 3, 2.5, skin, { flat: true }); }
  return outline(g.toCanvas(), INK);
}
function titanSprite(pose, f, rage) {         // idle (2) | storm | cast | slam
  const g = new PX(140, 140), cx = 70, bob = pose === 'idle' ? f * 2 : 0;
  const S = rage ? ['#2a2040', '#4a3a6a', '#7a6aa0', '#b4a8d8'] : ['#2a3450', '#4a5878', '#7a88b0', '#b8c4e0'];
  const core = pose === 'storm' ? '#e8fbff' : rage ? '#c8a0ff' : '#7ad8ff';
  g.lit(cx, 122, 42, 14, ['#5a6888', '#8a98b8', '#c0cce4', '#f4f8ff'], 3, { edge: 0.22 });
  g.lit(cx - 28, 126, 18, 9, ['#5a6888', '#8a98b8', '#c0cce4', '#f4f8ff'], 7, { edge: 0.2 }); g.lit(cx + 30, 126, 18, 9, ['#5a6888', '#8a98b8', '#c0cce4', '#f4f8ff'], 9, { edge: 0.2 });
  g.poly([[cx - 30, 52 + bob], [cx + 30, 52 + bob], [cx + 22, 114], [cx - 22, 114]], S[1], sh(0, S[2], S[0], 3));
  for (const s of [-1, 1]) g.ell(cx + s * 31, 54 + bob, 14, 11, S[2], sh(0, S[3], S[0], 3));
  g.ell(cx, 78 + bob, 11, 11, S[0], { flat: true }); g.ell(cx, 78 + bob, 8, 8, core, sh(0, '#ffffff', shade(core, -0.4), 2));
  for (const [x0, y0, x1, y1] of [[-18, 62, -10, 74], [18, 62, 10, 74], [-14, 100, -6, 88], [14, 100, 6, 88]]) g.line(cx + x0, y0 + bob, cx + x1, y1 + bob, core);
  const arm = (x0, y0, x1, y1) => { g.cap(x0, y0, x1, y1, 15, S[1], sh(0, S[2], S[0], 3)); g.ell(x1, y1, 11, 10, S[2], sh(0, S[3], S[0], 3)); g.rect(x1 - 6, y1 - 1, 12, 2, core); };
  if (pose === 'storm') { arm(cx - 32, 56, cx - 44, 22); arm(cx + 32, 56, cx + 44, 22); }
  else if (pose === 'slam') { arm(cx - 32, 56, cx - 30, 112); arm(cx + 32, 56, cx + 30, 112); }
  else if (pose === 'cast') { arm(cx - 32, 56, cx - 50, 66); arm(cx + 32, 56, cx + 50, 66); }
  else { arm(cx - 32, 56 + bob, cx - 44, 96 + bob); arm(cx + 32, 56 + bob, cx + 44, 96 + bob); }
  const hy = 38 + bob;
  g.poly([[cx - 13, hy - 10], [cx + 13, hy - 10], [cx + 15, hy + 8], [cx, hy + 14], [cx - 15, hy + 8]], S[2], sh(0, S[3], S[0], 3));
  g.rect(cx - 9, hy - 2, 6, 3, core); g.rect(cx + 3, hy - 2, 6, 3, core);
  for (const [dx, h] of [[-12, 12], [-4, 18], [4, 18], [12, 12]]) g.poly([[cx + dx - 3, hy - 10], [cx + dx, hy - 10 - h], [cx + dx + 1, hy - 10 - h * 0.5], [cx + dx + 3, hy - 10]], '#ffe94d', sh(0, '#ffffff', '#c98a10', 1));
  return outline(g.toCanvas(), INK);
}

// ---------- imagem de cada inimigo novo (também desenha os corpos que voam ao morrer) ----------
const fr = (e, sp, n) => Math.floor(e.t * sp) % n;
ENEMY_IMG.hawk = (e, lv) => { const d = e.st === 'dive', f = fr(e, 10, 4), k = HAWK_SKIN[lv && lv.theme] || 'brown'; return spr2('hawk' + k + f + d, () => hawkSprite(f, d, HAWK_PAL[k])); };
ENEMY_IMG.frog = e => { const p = e.st === 'tongue' ? 'tongue' : !e.ground ? 'air' : 'sit', f = p === 'sit' ? (e.st === 'wind' ? 1 : fr(e, 2, 2)) : 0; return spr2('frog' + p + f, () => frogSprite(p, f)); };
ENEMY_IMG.scorpion = e => { const m = e.st === 'wind' ? 'wind' : e.st === 'sting' ? 'sting' : 'walk', f = Math.abs(e.vx) > 1 ? fr(e, 8, 2) : 0; return spr2('scor' + m + f, () => scorpionSprite(m, f)); };
ENEMY_IMG.imp = e => { const t = e.throwT > 0, f = fr(e, 12, 4); return spr2('imp' + f + t, () => impSprite(f, t)); };
const rageOf = e => e.hp < e.maxHp * 0.5;
ENEMY_IMG.yeti = e => {
  const p = e.st === 'aim' ? 'aim' : e.st === 'throw' ? 'throw' : e.st === 'tele' || e.st === 'stomp' ? 'stomp' : e.st === 'roar' ? 'roar' : e.st === 'toss' ? (e.throwT > 0 ? 'toss' : 'aim') : 'idle';
  const f = p === 'idle' ? fr(e, 2, 2) : 0, r = rageOf(e);
  return spr2('yeti' + p + f + r, () => yetiSprite(p, f, r));
};
ENEMY_IMG.slimeking = e => {
  const p = !e.ground ? 'jump' : e.st === 'spit' ? 'spit' : e.st === 'hop' || e.st === 'tele' ? 'squash' : 'idle', f = p === 'idle' ? fr(e, 3, 2) : 0, r = rageOf(e);
  return spr2('sking' + p + f + r, () => slimekingSprite(p, f, r));
};
ENEMY_IMG.scorpking = e => {
  const p = e.st === 'burrow' ? 'mound' : e.st === 'stun' ? 'stun' : e.st === 'sting' || e.st === 'emerge' ? 'sting' : e.st === 'tele' ? 'wind' : e.st === 'charge' ? 'charge' : 'walk';
  const f = p === 'walk' || p === 'charge' ? fr(e, p === 'charge' ? 14 : 6, 2) : 0, r = rageOf(e);
  return spr2('sk' + p + f + r, () => scorpkingSprite(p, f, r));
};
ENEMY_IMG.magdragon = e => { const p = e.st === 'breath' ? 'breath' : e.st === 'swoop' ? 'dive' : 'fly', f = p === 'fly' ? fr(e, 5, 2) : 0, r = rageOf(e); return spr2('drg' + p + f + r, () => dragonSprite(p, f, r)); };
ENEMY_IMG.vampire = e => { const p = e.st === 'cast' ? 'cast' : e.st === 'dash' ? 'dash' : 'idle', f = p === 'idle' ? fr(e, 2, 2) : 0, r = rageOf(e); return spr2('vamp' + p + f + r, () => vampireSprite(p, f, r)); };
ENEMY_IMG.titan = e => {
  const p = e.st === 'storm' ? 'storm' : e.st === 'slam' || e.st === 'rise' ? 'slam' : e.st === 'cast' || e.st === 'tele' ? 'cast' : 'idle', f = p === 'idle' ? fr(e, 1.5, 2) : 0, r = rageOf(e);
  return spr2('titan' + p + f + r, () => titanSprite(p, f, r));
};
Object.assign(ENEMY_YOFF, { hawk: 4, frog: 2, imp: 4, slimeking: 2, magdragon: 17 });
ENEMY_ALPHA.vampire = e => e.st === 'fade' ? 0.1 + Math.abs(Math.sin(e.t * 18)) * 0.12 : 1;

// ---------- comportamento dos inimigos comuns ----------
Object.assign(E_AI, {
  // Falcão: circula acima do herói, mira ("!") e mergulha em linha reta; depois sobe de volta
  hawk(w, e, dt) {
    const p = e.tgt, dx = cxOf(p) - cxOf(e), dy = cyOf(p) - cyOf(e);
    e.cd -= dt;
    if (e.st === 'dive') { e.stT -= dt; if (e.stT <= 0) { e.st = 'climb'; e.stT = 0.9; } }
    else if (e.st === 'climb') { e.vx = lerp(e.vx, e.dir * 40, 0.06); e.vy = lerp(e.vy, -80, 0.1); e.stT -= dt; if (e.stT <= 0) e.st = null; }
    else if (e.st === 'wind') { e.vx *= 0.9; e.vy *= 0.9; e.stT -= dt; if (e.stT <= 0) { const d = Math.hypot(dx, dy) || 1, s = e.slow > 0 ? 110 : 175; e.vx = dx / d * s; e.vy = dy / d * s; e.st = 'dive'; e.stT = 0.85; sfx('screech'); } }
    else {
      const s = e.speed * (e.slow > 0 ? 0.5 : 1), tx = cxOf(p) + Math.sin(e.t * 1.3) * 50, ty = p.y - 52;
      e.vx = lerp(e.vx, clamp((tx - cxOf(e)) * 1.5, -s, s), 0.05); e.vy = lerp(e.vy, clamp((ty - cyOf(e)) * 1.5, -50, 50), 0.05);
      if (e.cd <= 0 && Math.abs(dx) < 120 && dy > 18 && dy < 110) { e.st = 'wind'; e.stT = 0.45; e.cd = 2.6; }
    }
    if (Math.abs(e.vx) > 3) e.dir = e.vx > 0 ? 1 : -1;
  },
  // Sapo: pula atrás do herói; de perto, estica a língua
  frog(w, e, dt) {
    if (e.hurt > 0) { e.vx *= 0.92; e.atk = null; if (e.st === 'tongue' || e.st === 'wind') e.st = null; return; }
    const p = e.tgt, dx = cxOf(p) - cxOf(e);
    e.cd2 = (e.cd2 || 0) - dt;
    if (e.st === 'wind') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) { e.st = 'tongue'; e.stT = 0.4; sfx('slash'); } return; }
    if (e.st === 'tongue') {
      e.vx = 0; e.stT -= dt;
      e.atk = e.stT < 0.34 && e.stT > 0.06 ? { x: e.dir > 0 ? e.x + e.w - 2 : e.x - 24, y: e.y + 1, w: 26, h: 6 } : null;
      if (e.stT <= 0) { e.st = null; e.atk = null; e.cd = 0.7; }
      return;
    }
    if (!e.ground) return;
    e.vx = approach(e.vx, 0, 600 * dt); e.cd -= dt;
    if (e.cd2 <= 0 && Math.abs(dx) < 46 && Math.abs(p.y + p.h - e.y - e.h) < 14) { e.st = 'wind'; e.stT = 0.35; e.dir = dx > 0 ? 1 : -1; e.cd2 = 2; sfx('croak'); return; }
    if (e.cd > 0) return;
    const near = Math.abs(dx) < 140 && Math.abs(p.y - e.y) < 60;
    e.dir = near ? (dx > 0 ? 1 : -1) : (Math.random() < 0.5 ? -1 : 1);
    if (!near && ledgeAhead(w, e)) e.dir = -e.dir;
    e.vy = near ? -260 : -170; e.vx = e.dir * (near ? 90 : 40) * (e.slow > 0 ? 0.5 : 1); e.cd = near ? 1.1 : 1.8;
    if (near) sfx('croak');
  },
  // Escorpião: anda e, de perto, prepara e crava o ferrão (bate um pouco acima: agachar não salva)
  scorpion(w, e, dt) {
    if (e.hurt > 0) { e.vx *= 0.9; return; }
    const p = e.tgt, dx = cxOf(p) - cxOf(e);
    if (e.st === 'wind') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) { e.st = 'sting'; e.stT = 0.25; sfx('spear'); } }
    else if (e.st === 'sting') { e.vx = 0; e.stT -= dt; e.atk = { x: e.dir > 0 ? e.x + e.w - 4 : e.x - 18, y: e.y - 8, w: 22, h: 16 }; if (e.stT <= 0) { e.st = 'rest'; e.stT = 0.6; e.atk = null; } }
    else if (e.st === 'rest') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) e.st = null; }
    else { walk(w, e, e.speed, 120); e.cd -= dt; if (e.cd <= 0 && Math.abs(dx) < 40 && Math.abs(p.y - e.y) < 30) { e.st = 'wind'; e.stT = 0.45; e.dir = dx > 0 ? 1 : -1; e.cd = 1.8; } }
  },
  // Diabrete: voa mantendo distância e atira bolas de fogo mirando no herói
  imp(w, e, dt) {
    const p = e.tgt, dx = cxOf(p) - cxOf(e), ad = Math.abs(dx), s = e.speed * (e.slow > 0 ? 0.5 : 1);
    const want = ad < 70 ? -Math.sign(dx) : ad > 110 ? Math.sign(dx) : 0;
    e.vx = lerp(e.vx, want * s + Math.sin(e.t * 2) * 10, 0.05); e.vy = lerp(e.vy, clamp(p.y - 30 - e.y, -40, 40) + Math.sin(e.t * 3) * 12, 0.05);
    e.dir = dx > 0 ? 1 : -1; e.cd -= dt;
    if (e.cd <= 0 && ad < 170 && Math.abs(p.y - e.y) < 110) {
      e.cd = 2.4; e.throwT = 0.35;
      const tx = cxOf(p) - cxOf(e), ty = cyOf(p) - cyOf(e), L = Math.hypot(tx, ty) || 1;
      eshoot(w, { type: 'fireball', x: cxOf(e) - 3, y: cyOf(e) - 3, vx: tx / L * 110, vy: ty / L * 110, col: '#ff8a2a' }); sfx('fire');
    }
  },

  // ---------- chefes ----------
  // Yeti Ancião (caçador das neves): arremessa a lança (baixa = pule, alta = abaixe-se), bate o pé e faz cair uma bola de neve
  // gigante que rola pela arena (ele fica rugindo: boca aberta = ponto fraco) e espalha estacas de gelo pelo chão
  yeti(w, e, dt) {
    const A = arenaOf(w), p = e.tgt, pc = cxOf(p), ec = cxOf(e), rage = rageOf(e);
    e.stT -= dt;
    switch (e.st) {
      case 'idle':
        e.vx = 0; e.dir = pc > ec ? 1 : -1;
        if (e.stT <= 0) {
          pickAtk(e, ['spear', 'stomp', 'traps']);
          if (e.pick === 'spear') { e.st = 'aim'; e.stT = 0.75; e.spears = rage ? 2 : 1; sfx('growl'); }
          else if (e.pick === 'stomp') { e.st = 'tele'; e.stT = 0.6; feel(w, null, 0, 0.1); }
          else { e.st = 'toss'; e.stT = 0.35; e.shots = rage ? 5 : 3; e.shotT = 0.35; }
        }
        break;
      case 'aim':
        e.vx = 0; e.dir = pc > ec ? 1 : -1; if (e.stT > 0) break;
        {
          const hi = rage ? e.spears === 1 : Math.random() < 0.5, y = hi ? A.gy - 21 : A.gy - 11;
          eshoot(w, { type: 'yspear', w: 34, h: 5, x: ec + e.dir * 12 - 17, y, vx: e.dir * (rage ? 250 : 215), life: 3, big: true });
          sfx('spear'); e.st = 'throw'; e.stT = 0.45;
        }
        break;
      case 'throw':
        e.vx = 0; if (e.stT > 0) break;
        if (--e.spears > 0) { e.st = 'aim'; e.stT = 0.45; } else { e.st = 'idle'; e.stT = rage ? 0.7 : 1.1; }
        break;
      case 'tele': e.vx = 0; if (e.stT <= 0) { e.st = 'stomp'; e.stT = 0.3; e.vy = -150; sfx('dash'); } break;
      case 'stomp':
        e.vx = 0;
        if (e.ground && e.stT <= 0) {
          feel(w, null, 0, 0.6); sfx('boom'); burst(w, ec + e.dir * 12, e.y + e.h, '#ffffff', 22, 110, 0.6);
          const xs = [pc]; if (rage) xs.push(pc + (pc > A.mid ? -96 : 96));
          xs.forEach((x, i) => {
            const tx = clamp(x, A.x0 + 16, A.x1 - 16), dir = tx >= ec ? 1 : -1, y0 = A.top - 40, d = A.gy - 22 - y0, T0 = 0.5;
            eshoot(w, { type: 'snowmark', x: tx - 11, y: A.gy - 4, w: 22, h: 4, life: 0.8 + i * 0.35, harmless: true, pass: true,
              then: (w2, q) => eshoot(w2, { type: 'bigsnow', x: q.x, y: y0, w: 22, h: 22, vy: (d - 0.5 * 900 * T0 * T0) / T0, g: 900, life: T0, pass: true, big: true,
                then: (w3, b) => {
                  feel(w3, null, 0, 0.3); sfx('boom'); burst(w3, b.x + 11, A.gy, '#ffffff', 12, 90, 0.5);
                  const dist = dir > 0 ? A.x1 - (b.x + 22) : b.x - A.x0;
                  eshoot(w3, { type: 'bigsnow', x: b.x, y: A.gy - 22, w: 22, h: 22, vx: dir * 125, life: Math.max(0.1, dist / 125), pass: true, big: true,
                    then: (w4, c) => { burst(w4, c.x + 11, c.y + 11, '#ffffff', 18, 110, 0.6); sfx('shatter'); } });
                } }) });
          });
          if (rage) for (let i = 0; i < 3; i++) {
            const tx = clamp(rnd(A.x0 + 20, A.x1 - 20), A.x0 + 8, A.x1 - 8);
            eshoot(w, { type: 'icicle', x: tx - 3, y: A.top, w: 6, h: 12, life: 0.7 + i * 0.15, harmless: true, pass: true,
              then: (w2, q) => eshoot(w2, { type: 'icicle', x: q.x, y: q.y, w: 6, h: 12, vy: 40, g: 560, life: 2, col: '#cfefff' }) });
          }
          e.st = 'roar'; e.stT = 1.6; sfx('roar');
        }
        break;
      case 'roar': e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = 0.6; } break;
      case 'toss':
        e.vx = 0; e.shotT -= dt;
        if (e.shotT <= 0 && e.shots > 0) {
          e.shots--; e.shotT = 0.24; e.throwT = 0.2;
          const tx = clamp(pc + rnd(-80, 80), A.x0 + 10, A.x1 - 10);
          lob(w, ec + e.dir * 18, e.y + 14, tx, A.gy - 3, 0.7, 420, { type: 'icespike', w: 6, h: 6,
            then: (w2, q) => eshoot(w2, { type: 'spikes', x: q.x - 3, y: A.gy - 8, w: 12, h: 8, life: rage ? 5 : 4, big: true, pass: true }) });
          sfx('ice');
        }
        if (e.shots <= 0 && e.shotT <= 0) { e.st = 'idle'; e.stT = rage ? 0.7 : 1.1; }
        break;
    }
  },
  // Rei Gosma: pulos em sequência (ondas de gosma ao cair), cuspe em arco e filhotes de slime
  slimeking(w, e, dt) {
    const A = arenaOf(w), p = e.tgt, pc = cxOf(p), ec = cxOf(e), rage = rageOf(e);
    e.stT -= dt;
    switch (e.st) {
      case 'idle':
        e.vx = approach(e.vx, 0, 400 * dt); e.dir = pc > ec ? 1 : -1;
        if (e.stT <= 0) {
          pickAtk(e, ['hop', 'spit', 'summon']);
          if (e.pick === 'summon' && w.enemies.filter(m => m.minion && !m.dead).length >= (rage ? 4 : 3)) e.pick = 'hop';
          e.st = 'tele'; e.stT = 0.5; e.hops = rage ? 3 : 2;
        }
        break;
      case 'tele':
        e.vx = 0; if (e.stT > 0) break;
        if (e.pick === 'hop') { e.st = 'hop'; e.stT = 0; }
        else if (e.pick === 'spit') {
          e.st = 'spit'; e.stT = 0.9; const n = rage ? 5 : 3;
          for (let i = 0; i < n; i++) lob(w, ec + e.dir * 12, e.y + 8, pc + (i - (n - 1) / 2) * 28, A.gy - 4, 0.8 + i * 0.05, 380, { type: 'slimeball', w: 7, h: 7 });
          sfx('splat');
        } else {
          e.st = 'spit'; e.stT = 0.7;
          for (const d of [-1, 1]) spawnEnemy(w, 'slime', clamp(ec + d * 30, A.x0 + 12, A.x1 - 12), A.gy);
          sfx('splat'); burst(w, ec, e.y + 10, SLIME_COL[w.lv.theme] || '#8ad83a', 16, 90, 0.6);
        }
        break;
      case 'hop':
        if (!e.ground) e.air = true;
        else if (e.air) {
          e.air = false; e.vx = 0; e.stT = 0.35;
          for (const d of [-1, 1]) eshoot(w, { type: 'goo', w: 12, h: 9, x: ec + d * 18 - 6, y: e.y + e.h - 9, vx: d * (rage ? 160 : 130), life: 2.2, big: true });
          feel(w, null, 0, 0.35); sfx('splat');
        }
        if (e.ground && e.stT <= 0) {
          if (e.hops-- > 0) { e.vy = -340; e.vx = clamp((pc - ec) / 0.75, -170, 170); e.stT = 0.2; sfx('jump'); }
          else { e.st = 'idle'; e.stT = rage ? 0.7 : 1.1; e.vx = 0; }
        }
        break;
      case 'spit': e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = 1; } break;
    }
  },
  // Escorpião Imperador: investida (bate na parede e fica tonto), rajada de ferrões e mergulho na areia
  scorpking(w, e, dt) {
    const A = arenaOf(w), p = e.tgt, pc = cxOf(p), ec = cxOf(e), rage = rageOf(e);
    e.stT -= dt; e.invul = e.st === 'burrow';
    switch (e.st) {
      case 'idle': e.vx = 0; e.dir = pc > ec ? 1 : -1; if (e.stT <= 0) { pickAtk(e, ['charge', 'volley', 'burrow']); e.st = 'tele'; e.stT = 0.6; } break;
      case 'tele':
        e.vx = 0; if (e.stT > 0) break;
        if (e.pick === 'charge') { e.st = 'charge'; e.stT = 2.4; e.dir = pc > ec ? 1 : -1; sfx('dash'); }
        else if (e.pick === 'volley') {
          e.st = 'sting'; e.stT = 0.8; const n = rage ? 5 : 3;
          for (let i = 0; i < n; i++) lob(w, ec - e.dir * 4, e.y - 14, pc + (i - (n - 1) / 2) * 26, A.gy - 4, 0.75, 380, { type: 'sting', w: 6, h: 6 });
          sfx('spear');
        } else { e.st = 'burrow'; e.stT = rage ? 1.6 : 2.0; e.dustT = 0; sfx('dash'); burst(w, ec, e.y + e.h, '#e0b070', 20, 90, 0.6); }
        break;
      case 'charge':
        e.vx = e.dir * (rage ? 190 : 160);
        if (e.wall || e.stT <= 0) {
          e.st = 'stun'; e.stT = 1.8; e.stun = 1.8; e.vx = 0; feel(w, null, 0, 0.4); sfx('boom');
          burst(w, ec + e.dir * 22, e.y + 10, '#e0b070', 18, 100, 0.6); floatText(w, ec, e.y - 14, 'ATORDOADO', '#ffe94d');
        }
        break;
      case 'stun': e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = 0.6; } break;
      case 'sting': e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = rage ? 0.8 : 1.2; } break;
      case 'burrow': {
        const dx = pc - ec; e.vx = clamp(dx * 3, -150, 150); e.dir = dx > 0 ? 1 : -1;
        e.dustT -= dt; if (e.dustT <= 0) { e.dustT = 0.18; burst(w, ec + rnd(-16, 16), e.y + e.h, '#e0b070', 2, 40, 0.4); }
        if (e.stT <= 0) {
          e.st = 'emerge'; e.stT = 0.5; e.vx = 0; e.vy = -200; sfx('boom'); feel(w, null, 0, 0.35);
          burst(w, ec, e.y + e.h, '#e0b070', 26, 140, 0.7); e.atk = { x: e.x - 6, y: e.y - 26, w: e.w + 12, h: e.h + 26 };
        }
        break;
      }
      case 'emerge': e.vx = 0; if (e.stT <= 0.25) e.atk = null; if (e.stT <= 0) { e.st = 'idle'; e.stT = 0.9; } break;
    }
  },
  // Dragão de Magma: chuva de fogo do alto, pouso com sopro rasteiro (abaixe-se!) e rasante
  magdragon(w, e, dt) {
    const A = arenaOf(w), p = e.tgt, pc = cxOf(p), ec = cxOf(e), rage = rageOf(e);
    const mouth = () => ({ x: ec + e.dir * 41, y: e.st === 'breath' ? e.y + 21 : e.y - 5 });
    e.stT -= dt;
    switch (e.st) {
      case 'idle': e.st = 'fly'; e.stT = 1.6; e.side = ec > A.mid ? 1 : -1; e.vy = -120; break;
      case 'fly':
        goto(e, (e.side > 0 ? A.x1 - 60 : A.x0 + 60) + Math.sin(e.t) * 24, A.top + 16 + Math.sin(e.t * 2) * 8, 110); e.dir = pc > ec ? 1 : -1;
        if (e.stT <= 0) { pickAtk(e, ['rain', 'breath', 'swoop']); e.st = 'tele'; e.stT = 0.5; sfx('roar'); }
        break;
      case 'tele':
        e.vx *= 0.9; e.vy *= 0.9; if (e.stT > 0) break;
        if (e.pick === 'rain') { e.st = 'rain'; e.stT = 1.6; e.shots = rage ? 9 : 6; e.shotT = 0; }
        else if (e.pick === 'breath') { e.st = 'land'; e.side = pc > A.mid ? -1 : 1; e.stT = 2.2; }
        else { e.st = 'swoop'; e.stT = 1.3; e.dir = pc > ec ? 1 : -1; e.vx = e.dir * 200; e.vy = clamp((cyOf(p) - cyOf(e)) / 0.55, 60, 240); sfx('dash'); }
        break;
      case 'rain':
        goto(e, pc, A.top + 14, 80); e.dir = pc > ec ? 1 : -1; e.shotT -= dt;
        if (e.shotT <= 0 && e.shots > 0) { e.shots--; e.shotT = 0.2; const m = mouth(); eshoot(w, { type: 'fireball', x: m.x - 3, y: m.y - 3, vx: rnd(-50, 50) + (pc - ec) * 0.4, vy: 30, g: 260, life: 3 }); sfx('fire'); }
        if (e.shots <= 0) { e.st = 'fly'; e.stT = 1.6; e.side = -e.side; }
        break;
      case 'land': {
        const d = goto(e, e.side > 0 ? A.x1 - 50 : A.x0 + 50, A.gy - 20, 150); e.dir = -e.side;
        if (d < 10 || e.stT <= 0) { e.st = 'breath'; e.stT = rage ? 1.9 : 1.5; e.shotT = 0.3; sfx('roar'); }
        break;
      }
      case 'breath':
        e.vx *= 0.8; e.vy *= 0.8; e.dir = -e.side; e.shotT -= dt;
        if (e.shotT <= 0) { e.shotT = 0.1; const m = mouth(); eshoot(w, { type: 'fireball', x: m.x - 3, y: m.y - 5 + rnd(-1, 1), vx: e.dir * 190, vy: rnd(-12, 3), life: 1.5 }); if (Math.random() < 0.3) sfx('fire'); }
        if (e.stT <= 0) { e.st = 'fly'; e.stT = 1.8; e.side = -e.side; e.vy = -120; }
        break;
      case 'swoop':
        e.vy -= 260 * dt;
        if (e.stT <= 0 || e.x <= A.x0 + 1 || e.x >= A.x1 - e.w - 1) { e.st = 'fly'; e.stT = 1.4; e.side = ec > A.mid ? 1 : -1; }
        break;
    }
    e.x = clamp(e.x, A.x0, A.x1 - e.w); e.y = clamp(e.y, A.top - 16, A.gy - e.h);
  },
  // Conde Sanguinário: some e reaparece ao seu lado, morcegos teleguiados, leque de orbes e investida da capa
  vampire(w, e, dt) {
    const A = arenaOf(w), p = e.tgt, pc = cxOf(p), ec = cxOf(e), rage = rageOf(e), floorY = A.gy - e.h - 2 + Math.sin(e.t * 3) * 2;
    e.stT -= dt; e.invul = e.st === 'fade';
    const hover = () => { e.vy = (floorY - e.y) * 6; };
    switch (e.st) {
      case 'idle':
        hover(); e.dir = pc > ec ? 1 : -1; e.vx = lerp(e.vx, e.dir * 30, 0.05);
        if (e.stT <= 0) {
          pickAtk(e, rage ? ['fade', 'bats', 'orbs', 'dash'] : ['fade', 'bats', 'orbs']);
          if (e.pick === 'fade') { e.st = 'fade'; e.stT = 0.8; sfx('fade'); burst(w, ec, cyOf(e), '#8a2a5a', 16, 80, 0.6); }
          else { e.st = 'tele'; e.stT = 0.5; }
        }
        break;
      case 'fade':
        e.vx = 0; e.vy = 0;
        if (e.stT <= 0) {
          const side = Math.random() < 0.5 ? -1 : 1;
          e.x = clamp(pc + side * 50 - e.w / 2, A.x0, A.x1 - e.w); e.y = floorY; e.dir = -side;
          e.st = 'tele'; e.pick = rage ? 'dash' : 'orbs'; e.stT = 0.55; sfx('fade'); burst(w, cxOf(e), cyOf(e), '#8a2a5a', 16, 80, 0.6);
        }
        break;
      case 'tele':
        hover(); e.vx = 0; if (e.stT > 0) break;
        if (e.pick === 'bats') {
          e.st = 'cast'; e.stT = 1.4; const n = rage ? 5 : 3;
          for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.5; eshoot(w, { type: 'batling', x: ec - 4, y: e.y + 6, w: 8, h: 6, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, life: 4.5, home: 110 }); }
          sfx('screech');
        } else if (e.pick === 'orbs') {
          e.st = 'cast'; e.stT = 0.9; const base = Math.atan2(cyOf(p) - cyOf(e), pc - ec), n = rage ? 7 : 5;
          for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.22; eshoot(w, { type: 'orb', x: ec - 3, y: cyOf(e) - 3, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 3, pass: true }); }
          sfx('zap');
        } else { e.st = 'dash'; e.stT = 0.75; e.dir = pc > ec ? 1 : -1; sfx('dash'); }
        break;
      case 'cast': hover(); e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = rage ? 0.8 : 1.3; } break;
      case 'dash': hover(); e.vx = e.dir * 260; if (e.stT <= 0 || e.x <= A.x0 + 1 || e.x >= A.x1 - e.w - 1) { e.st = 'idle'; e.stT = 1; e.vx = 0; } break;
    }
    e.x = clamp(e.x, A.x0, A.x1 - e.w);
  },
  // Titã da Tempestade (chefe final): raios marcados no chão, rajadas de vento, anel de orbes e soco no chão
  titan(w, e, dt) {
    const A = arenaOf(w), p = e.tgt, pc = cxOf(p), ec = cxOf(e), rage = rageOf(e), hoverY = A.top + 6 + e.h / 2;
    e.stT -= dt;
    switch (e.st) {
      case 'idle': e.st = 'float'; e.stT = 1.5; break;
      case 'float':
        goto(e, clamp(pc, A.x0 + 60, A.x1 - 60) + Math.sin(e.t * 0.8) * 30, hoverY + Math.sin(e.t * 2) * 6, 60); e.dir = pc > ec ? 1 : -1;
        if (e.stT <= 0) { pickAtk(e, ['storm', 'gust', 'orbs', 'slam']); e.st = 'tele'; e.stT = 0.6; }
        break;
      case 'tele':
        e.vx *= 0.9; e.vy *= 0.9; if (e.stT > 0) break;
        if (e.pick === 'storm') {
          e.st = 'storm'; e.stT = 2.0; sfx('thunder');
          const xs = w.players.filter(q => !q.dead && !q.out).map(cxOf);
          for (let i = 0; i < (rage ? 4 : 2); i++) xs.push(rnd(A.x0 + 20, A.x1 - 20));
          xs.forEach((x, i) => eshoot(w, { type: 'mark', x: x - 6, y: A.gy - 6, w: 12, h: 6, life: 1.0 + i * 0.12, harmless: true, pass: true,
            then: (w2, q) => { eshoot(w2, { type: 'bolt', x: q.x, y: A.top - 50, w: 12, h: A.gy - A.top + 50, life: 0.3, pass: true, big: true }); sfx('thunder'); feel(w2, null, 0.06, 0.25); } }));
        } else if (e.pick === 'gust') {
          e.st = 'cast'; e.stT = 0.9;
          for (const d of [-1, 1]) eshoot(w, { type: 'gust', x: ec + d * 20 - 7, y: A.gy - 20, w: 14, h: 20, vx: d * (rage ? 170 : 140), life: 3, big: true });
          sfx('dash');
        } else if (e.pick === 'orbs') {
          e.st = 'cast'; e.stT = 1.0; const n = rage ? 12 : 8;
          for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + e.t; eshoot(w, { type: 'sorb', x: ec - 3, y: cyOf(e) - 3, vx: Math.cos(a) * 75, vy: Math.sin(a) * 75, life: 4, pass: true }); }
          sfx('zap');
        } else { e.st = 'slam'; e.stT = 1.6; e.down = false; e.tx = clamp(pc, A.x0 + 30, A.x1 - 30); }
        break;
      case 'storm': case 'cast': goto(e, ec, hoverY, 30); if (e.stT <= 0) { e.st = 'float'; e.stT = rage ? 1.2 : 1.8; } break;
      case 'slam':
        if (!e.down) { goto(e, e.tx, hoverY, 160); if (Math.abs(ec - e.tx) < 6 || e.stT < 1.0) { e.down = true; e.vx = 0; e.vy = 320; } }
        else if (e.y + e.h >= A.gy - 1) {
          e.y = A.gy - e.h; e.vy = 0; e.down = false; e.st = 'rise'; e.stT = 0.8;
          for (const d of [-1, 1]) eshoot(w, { type: 'wave', w: 12, h: 9, x: ec + d * 20 - 6, y: A.gy - 9, vx: d * 150, life: 2.4 });
          feel(w, null, 0, 0.5); sfx('boom'); burst(w, ec, A.gy, '#c8d4e8', 20, 110, 0.6);
        }
        break;
      case 'rise': e.vx = 0; e.vy = e.stT < 0.5 ? -120 : 0; if (e.stT <= 0) { e.st = 'float'; e.stT = 1.4; } break;
    }
    e.x = clamp(e.x, A.x0, A.x1 - e.w); e.y = clamp(e.y, A.top - 20, A.gy - e.h);
  },
});

// ---------- projéteis dos inimigos novos ----------
const glowAt = (g, x, y, r, col, a) => { g.globalCompositeOperation = 'lighter'; drawGlow(g, x, y, r, col, a); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; };
Object.assign(EPROJ_DRAW, {
  yspear(g, q, x, y) {                                                      // lança do Yeti (34x5)
    const d = q.vx >= 0 ? 1 : -1, L = 34;
    g.fillStyle = '#c8b48a'; g.fillRect(x, y + 2, L, 2); g.fillStyle = '#f0e0b8'; g.fillRect(x, y + 2, L, 1);
    for (let i = 0; i < 7; i++) { const hh = Math.max(1, 5 - Math.round(i * 0.7)), px = d > 0 ? x + L - 7 + i : x + 6 - i; g.fillStyle = i < 2 ? '#3a88c0' : '#bfefff'; g.fillRect(px, y + 3 - (hh >> 1), 1, hh); }
    const fx = d > 0 ? x : x + L - 4; g.fillStyle = '#e04a3a'; g.fillRect(fx, y, 4, 2); g.fillStyle = '#ffffff'; g.fillRect(fx, y + 4, 4, 1);
  },
  bigsnow(g, q, x, y) {                                                     // bola de neve gigante (22x22), gira ao rolar
    const r = 11, cx = x + 11, cy = y + 11;
    g.fillStyle = '#3a5a7a'; for (let j = -r - 1; j <= r + 1; j++) { const hw = Math.floor(Math.sqrt(Math.max(0, (r + 1) * (r + 1) - j * j))); g.fillRect(cx - hw, cy + j, hw * 2, 1); }
    for (let j = -r; j <= r; j++) { const hw = Math.floor(Math.sqrt(r * r - j * j)); g.fillStyle = j > 5 ? '#a8c8e8' : j < -5 ? '#ffffff' : '#e4f0fc'; g.fillRect(cx - hw, cy + j, hw * 2, 1); }
    g.fillStyle = '#b4cce4'; for (let k = 0; k < 4; k++) { const a = q.rot * 1.1 * (q.vx < 0 ? -1 : 1) + k * 1.57; g.fillRect(Math.round(cx + Math.cos(a) * 6) - 1, Math.round(cy + Math.sin(a) * 6) - 1, 3, 2); }
    g.fillStyle = '#ffffff'; g.fillRect(cx - 6, cy - 7, 4, 2);
  },
  snowmark(g, q, x, y) {                                                    // sombra de onde a bola vai cair
    const k = clamp(q.rot / 8, 0, 1), hw = Math.round(4 + k * 8);
    g.globalAlpha = 0.25 + k * 0.4; g.fillStyle = '#1a2a4a'; g.fillRect(x + 11 - hw, y + 1, hw * 2, 2); g.fillRect(x + 13 - hw, y, hw * 2 - 4, 4);
    g.globalAlpha = 0.6; g.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) g.fillRect(x + 4 + ((i * 5) % 14), y - 60 + ((q.rot * 40 + i * 23) % 56), 1, 2);
    g.globalAlpha = 1;
  },
  icespike(g, q, x, y) { g.fillStyle = '#bfefff'; g.fillRect(x + 2, y, 2, 6); g.fillRect(x + 1, y + 2, 4, 2); g.fillStyle = '#ffffff'; g.fillRect(x + 2, y, 1, 3); },
  spikes(g, q, x, y) {                                                      // estacas de gelo cravadas no chão
    for (const [dx, h] of [[0, 6], [4, 8], [8, 5]]) for (let i = 0; i < h; i++) { const wd = Math.max(1, Math.round((h - i) / h * 3)); g.fillStyle = i > h - 3 ? '#ffffff' : i < 2 ? '#5aa0d0' : '#9fe0ff'; g.fillRect(x + dx + ((3 - wd) >> 1), y + 7 - i, wd, 1); }
  },
  icicle(g, q, x, y) {
    if (q.g === 0 && q.vy === 0) x += Math.floor(q.rot * 4) % 2;          // pendurada: treme antes de cair
    for (let i = 0; i < 12; i++) { const wd = Math.max(1, 6 - (i >> 1)); g.fillStyle = i < 2 ? '#ffffff' : i % 3 ? '#bfe8ff' : '#e8faff'; g.fillRect(x + ((6 - wd) >> 1), y + i, wd, 1); }
  },
  snowball(g, q, x, y) { g.fillStyle = '#ffffff'; g.fillRect(x + 1, y, 6, 8); g.fillRect(x, y + 1, 8, 6); g.fillStyle = '#a8c8e8'; g.fillRect(x + 1, y + 6, 6, 1); g.fillRect(x + 6, y + 2, 1, 4); },
  icewave(g, q, x, y) { g.fillStyle = '#9fe0ff'; g.fillRect(x, y + 2, 12, 7); g.fillRect(x + 2, y, 8, 9); g.fillStyle = '#ffffff'; g.fillRect(x + 3, y + 3, 6, 3); glowAt(g, x + 6, y + 5, 12, '#7ad0ff', 0.35); },
  goo(g, q, x, y) { g.fillStyle = '#5ab02a'; g.fillRect(x, y + 3, 12, 6); g.fillRect(x + 2, y + 1, 8, 8); g.fillStyle = '#a8ec6a'; g.fillRect(x + 3, y + 2, 4, 2); },
  slimeball(g, q, x, y) { g.fillStyle = '#6ad03a'; g.fillRect(x + 1, y, 5, 7); g.fillRect(x, y + 1, 7, 5); g.fillStyle = '#c8ff8a'; g.fillRect(x + 2, y + 1, 2, 2); },
  sting(g, q, x, y) { g.fillStyle = '#5a2a6a'; g.fillRect(x, y + 1, 6, 4); g.fillStyle = '#e8d0ff'; g.fillRect(x + (q.vx >= 0 ? 5 : 0), y + 2, 1, 2); g.fillStyle = '#7bd34a'; g.fillRect(x + 2, y, 2, 1); },
  fireball(g, q, x, y) { g.fillStyle = '#ff7a1f'; g.fillRect(x, y + 1, 6, 4); g.fillRect(x + 1, y, 4, 6); g.fillStyle = '#ffe27a'; g.fillRect(x + 2, y + 2, 2, 2); glowAt(g, x + 3, y + 3, 10, '#ff8a2a', 0.45); },
  batling(g, q, x, y) { const fl = Math.floor(q.rot * 2) % 2; g.fillStyle = '#3a1a3e'; g.fillRect(x + 2, y + 1, 4, 4); g.fillRect(x, y + (fl ? 0 : 2), 2, 2); g.fillRect(x + 6, y + (fl ? 0 : 2), 2, 2); g.fillStyle = '#ff3a4a'; g.fillRect(x + 3, y + 2, 1, 1); g.fillRect(x + 5, y + 2, 1, 1); },
  orb(g, q, x, y) { g.fillStyle = '#c0102a'; g.fillRect(x, y + 1, 6, 4); g.fillRect(x + 1, y, 4, 6); g.fillStyle = '#ff8aa0'; g.fillRect(x + 1, y + 1, 2, 2); glowAt(g, x + 3, y + 3, 10, '#ff2a4a', 0.4); },
  sorb(g, q, x, y) { g.fillStyle = '#6ad0ff'; g.fillRect(x, y + 1, 6, 4); g.fillRect(x + 1, y, 4, 6); g.fillStyle = '#ffffff'; g.fillRect(x + 2, y + 2, 2, 2); glowAt(g, x + 3, y + 3, 10, '#7ad8ff', 0.45); },
  mark(g, q, x, y) {
    const on = Math.floor(q.rot * 1.6) % 2;
    g.globalAlpha = 0.25; g.fillStyle = '#9fe8ff'; g.fillRect(x + 4, y - 120, 4, 124); g.globalAlpha = 1;
    g.fillStyle = on ? '#ffffff' : '#9fe8ff'; g.fillRect(x, y + 4, 12, 2); g.fillRect(x + 2, y + 2, 8, 1); g.fillRect(x + 2, y + 6, 8, 1);
  },
  bolt(g, q, x, y, w) {
    const gy = groundBelow(w.lv, x + 6, y, 16) || y + 150;
    g.fillStyle = '#9fe8ff'; let px = x + 6;
    for (let yy = y; yy < gy; yy += 6) { const nx = x + 3 + ((hash2(yy, Math.floor(q.rot * 3)) * 7) | 0); pline(g, px, yy, nx, yy + 6, 3); px = nx; }
    g.fillStyle = '#ffffff'; px = x + 6;
    for (let yy = y; yy < gy; yy += 6) { const nx = x + 3 + ((hash2(yy, Math.floor(q.rot * 3)) * 7) | 0); pline(g, px, yy, nx, yy + 6, 1); px = nx; }
    glowAt(g, x + 6, gy - 4, 26, '#9fe8ff', 0.6);
  },
  gust(g, q, x, y) {
    g.globalAlpha = 0.85; g.fillStyle = '#e8f4ff';
    for (let i = 0; i < 4; i++) { const r = 3 + i * 2, a = q.rot + i; g.fillRect(x + 7 + Math.round(Math.cos(a) * r), y + 4 + i * 4, 4, 2); }
    g.fillStyle = '#b8d0ec'; g.fillRect(x + 2, y + 18, 10, 2); g.globalAlpha = 1;
  },
});
