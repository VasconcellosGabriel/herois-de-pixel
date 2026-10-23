'use strict';
// ---------- Opções de personalização ----------
const OPTS = {
  heights:  ['Baixo', 'Médio', 'Alto'],
  builds:   ['Magro', 'Normal', 'Forte'],
  faces:    ['Normal', 'Bravo', 'Sorriso', 'Tranquilo', 'Cicatriz'],
  hairs:    ['Careca', 'Bagunçado', 'Espetado', 'Longo', 'Coque', 'Moicano', 'Rabo de cavalo', 'Afro'],
  outfits:  ['Túnica', 'Armadura', 'Manto', 'Colete'],
  heads:    ['Nenhum', 'Chapéu de mago', 'Elmo', 'Coroa', 'Bandana', 'Chifres', 'Orelhas de gato', 'Capuz'],
  capes:    ['Nenhuma', 'Curta', 'Longa'],
  accs:     ['Nenhum', 'Óculos', 'Tapa-olho', 'Máscara', 'Barba', 'Cachecol'],
};

// ---------- Superfície de pixels em software ----------
// Os personagens são desenhados com o DOBRO da resolução do cenário (HR = 2) e com sombreamento automático
// nas bordas das formas (luz vinda de cima-esquerda), o que dá o visual "pintado" dos sprites de referência.
const HR = 2;
const _col = {};
const C = h => _col[h] || (_col[h] = hexToRgb(h));
const INK = '#0a0610';

class PX {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  px(x, y, hex) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, c = C(hex);
    this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = 255;
  }
  rect(x, y, w, h, hex) { x = Math.round(x); y = Math.round(y); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, hex); }
  // forma qualquer: test(x,y) decide se o pixel pertence; pinta com sombreamento nas bordas
  shape(x0, y0, x1, y1, test, base, o = {}) {
    x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.ceil(x1); y1 = Math.ceil(y1);
    const w = x1 - x0 + 1, h = y1 - y0 + 1, m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (test(x + x0 + 0.5, y + y0 + 0.5)) m[y * w + x] = 1;
    const M = { m, x0, y0, w, h };
    if (!o.skip) this.paint(M, base, o);
    return M;
  }
  paint(M, base, o = {}) {
    const { m, x0, y0, w, h } = M, dep = o.depth === undefined ? 2 : o.depth, depD = o.depthD === undefined ? dep : o.depthD;
    const hi = o.hi || toneHi(base, 0.3), lo = o.lo || toneLo(base, 0.3);
    const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      let col = base;
      if (!o.flat) {
        let dark = false, light = false;
        for (let k = 1; k <= depD; k++) if (!at(x + k, y) || !at(x, y + k)) { dark = true; break; }
        if (!dark) for (let k = 1; k <= dep; k++) if (!at(x - k, y) || !at(x, y - k)) { light = true; break; }
        col = dark ? lo : light ? hi : base;
      }
      this.px(x0 + x, y0 + y, col);
    }
  }
  poly(pts, base, o) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const n = pts.length;
    return this.shape(x0, y0, x1, y1, (x, y) => {
      let ins = false;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const a = pts[i], b = pts[j];
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins;
      }
      return ins;
    }, base, o);
  }
  ell(cx, cy, rx, ry, base, o, n = 2) {
    return this.shape(cx - rx, cy - ry, cx + rx, cy + ry, (x, y) => Math.pow(Math.abs(x - cx) / rx, n) + Math.pow(Math.abs(y - cy) / ry, n) <= 1, base, o);
  }
  cap(ax, ay, bx, by, wd, base, o) {
    const r = wd / 2, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    return this.shape(Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.max(ax, bx) + r, Math.max(ay, by) + r, (x, y) => {
      const t = clamp(((x - ax) * dx + (y - ay) * dy) / L2, 0, 1), ex = ax + dx * t - x, ey = ay + dy * t - y;
      return ex * ex + ey * ey <= r * r;
    }, base, o);
  }
  limb2(ax, ay, ex, ey, bx, by, wd, base, o) {
    const r = wd / 2;
    const seg = (x, y, x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, t = clamp(((x - x0) * dx + (y - y0) * dy) / L2, 0, 1), qx = x0 + dx * t - x, qy = y0 + dy * t - y; return qx * qx + qy * qy <= r * r; };
    return this.shape(Math.min(ax, ex, bx) - r, Math.min(ay, ey, by) - r, Math.max(ax, ex, bx) + r, Math.max(ay, ey, by) + r, (x, y) => seg(x, y, ax, ay, ex, ey) || seg(x, y, ex, ey, bx, by), base, o);
  }
  line(x0, y0, x1, y1, hex) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let i = 0; i < 300; i++) {
      this.px(x0, y0, hex);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  // manchinhas de luz dentro de uma forma (textura de cabelo/tecido)
  speckle(M, hex, n, seed, maxFrac = 0.65) {
    const R = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = (R() * M.w) | 0, y = (R() * M.h * maxFrac) | 0;
      if (M.m[y * M.w + x] && M.m[y * M.w + Math.min(M.w - 1, x + 1)]) { this.px(M.x0 + x, M.y0 + y, hex); this.px(M.x0 + x + 1, M.y0 + y, hex); }
    }
  }
  toCanvas() {
    const c = mk(this.w, this.h);
    c.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
    return c;
  }
}

// Sombras com matiz frio (roxo/azul) e luzes quentes: dá o ar "pintado" dos sprites de referência
const toneLo = (hex, a = 0.3) => mix(shade(hex, -a), '#2a1a5a', Math.min(0.5, a * 0.6));
const toneHi = (hex, a = 0.3) => mix(shade(hex, a * 0.85), '#fff3c4', Math.min(0.4, a * 0.4));
const rampAt = (ramp, v) => ramp[clamp(Math.floor(v * ramp.length), 0, ramp.length - 1)];
// ruído de valor periódico (tiles sem emendas visíveis)
function pn(x, y, cell, per, seed) {
  const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
  const h = (i, j) => hash2(((i % per) + per) % per, ((j % per) + per) % per, seed);
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(h(x0, y0), h(x0 + 1, y0), sx), lerp(h(x0, y0 + 1), h(x0 + 1, y0 + 1), sx), sy);
}
Object.assign(PX.prototype, {
  clear(x, y) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[(y * this.w + x) * 4 + 3] = 0; },
  has(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.d[(y * this.w + x) * 4 + 3] > 0; },
  // mistura uma cor sobre os pixels já pintados
  tint(x0, y0, w, h, hex, a) {
    const c = C(hex);
    for (let y = Math.max(0, y0); y < Math.min(this.h, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(this.w, x0 + w); x++) {
      const i = (y * this.w + x) * 4;
      if (!this.d[i + 3]) continue;
      this.d[i] += (c[0] - this.d[i]) * a; this.d[i + 1] += (c[1] - this.d[i + 1]) * a; this.d[i + 2] += (c[2] - this.d[i + 2]) * a;
    }
  },
  // bolha iluminada (copas de árvore, nuvens, arbustos): luz de cima-esquerda, borda orgânica por ruído
  lit(cx, cy, rx, ry, ramp, seed = 1, o = {}) {
    const n = ramp.length, edge = o.edge === undefined ? 0.16 : o.edge, spk = o.speckle === undefined ? 0.05 : o.speckle;
    for (let y = Math.floor(cy - ry * 1.2); y <= Math.ceil(cy + ry * 1.2); y++) for (let x = Math.floor(cx - rx * 1.2); x <= Math.ceil(cx + rx * 1.2); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d2 = dx * dx + dy * dy;
      const nz = pn(x, y, 5, 4096, seed), lim = 1 + (nz - 0.5) * 2 * edge;
      if (d2 > lim * lim) continue;
      let l = 0.55 - dx * 0.32 - dy * 0.5 + (pn(x, y, 3, 4096, seed + 5) - 0.5) * 0.28;
      if (o.under) l -= Math.max(0, dy - 0.35) * 0.5;
      let i = clamp(Math.floor(l * n), 0, n - 1);
      if (d2 > 0.72 && dx + dy > 0.3) i = Math.max(0, i - 1);
      if (hash2(x, y, seed) < spk && d2 < 0.6) i = Math.min(n - 1, i + 1);
      this.px(x, y, ramp[i]);
    }
  },
});

// ---------- Personagem do jogador ----------
const CW = 96, CH = 96, CX = 48, FEET = 92;
const POSES = { idle: 5, run: 8, jump: 3, land: 1, atk: 4, cast: 3, block: 1, hurt: 1, dash: 1, roll: 4, flip: 4, glide: 2, aim: 12 };
const AIM_STEPS = 12;
const aimDeg = i => -90 + i * 15;                       // quadro de mira -> ângulo (graus, 0 = frente, negativo = cima)
const aimIdx = deg => clamp(Math.round((deg + 90) / 15), 0, AIM_STEPS - 1);

// Cinemática inversa de 2 ossos: retorna cotovelo/joelho
function ik(sx, sy, tx, ty, L1, L2, bend, hmax = 99) {
  let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 0.001;
  const mx = L1 + L2 - 0.05;
  if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.min(hmax, Math.sqrt(Math.max(0, L1 * L1 - a * a)));
  return { ex: sx + dx * a / d + (-dy / d) * h * bend, ey: sy + dy * a / d + (dx / d) * h * bend, hx: sx + dx, hy: sy + dy };
}

// Parâmetros do esqueleto (em unidades lógicas; multiplicados por HR ao desenhar). Mãos relativas ao ombro.
function skeletonFor(pose, f, cls, ang) {
  const S = { bob: 0, lean: 0, sq: 0, hdy: 0, flow: 0, legF: [2, 0], legB: [-2, 0], armF: [2, 6], armB: [-2, 6], wAng: cls === 'mago' ? 150 : 125, wShow: true, eyes: 0, mouth: 0, wing: 0, bendMax: 1.6 };
  const rad = Math.PI / 180;
  switch (pose) {
    case 'idle': {
      const b = [0, 0, 1, 1, 0][f];
      S.bob = b; S.flow = [0, 0.6, 1, 0.6, 0][f]; if (f === 4) S.eyes = 1;   // quadro 4: piscada
      S.armF = [1.2, 6.2 - (f > 1 ? 0.5 : 0)]; S.armB = [-0.8, 6.2 - (f > 1 ? 0.5 : 0)];
      break;
    }
    case 'run': {
      const ph = f / 8 * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph);
      S.bob = Math.abs(s) > 0.55 ? 1 : 0; S.lean = 1; S.flow = 3;
      S.legF = [Math.round(4 * s), Math.round(Math.max(0, c) * 3)];
      S.legB = [Math.round(-4 * s), Math.round(Math.max(0, -c) * 3)];
      // corrida: cotovelos dobrados, mãos balançando perto do quadril (sem varrer a barriga)
      S.armF = [3.2 - s * 3, 4.6 - Math.abs(s) * 0.7]; S.armB = [0.6 + s * 3, 4.6 - Math.abs(s) * 0.7]; S.bendMax = 4.5;
      S.wAng = (cls === 'mago' ? 150 : 124) + s * -6;
      break;
    }
    case 'jump': {
      S.flow = 3.5;
      if (f === 0) { S.legF = [3, 4]; S.legB = [-2, 2]; S.armF = [3.5, -5]; S.armB = [-3.5, -4.5]; S.bob = -1; }
      else if (f === 1) { S.legF = [2, 3]; S.legB = [-2, 2]; S.armF = [5, -2]; S.armB = [-5, -2]; }
      else { S.legF = [2, 1]; S.legB = [-2, 3]; S.armF = [4.5, -4]; S.armB = [-4.5, -3.5]; S.flow = 4.5; }
      S.wAng = cls === 'mago' ? 145 : 118; S.wing = f === 2 ? 1 : 0;
      break;
    }
    case 'glide':
      S.legF = [-2, 2]; S.legB = [-4, 3]; S.armF = [6, -2.5]; S.armB = [-5, -2.5]; S.lean = 1; S.flow = 4; S.wing = f ? 3 : 2; S.wAng = 120; break;
    case 'land': S.sq = 2; S.bob = 0; S.legF = [3, 0]; S.legB = [-3, 0]; S.armF = [5, 2]; S.armB = [-5, 2]; S.lean = 1; S.wAng = 125; break;
    case 'hurt': S.lean = -2; S.bob = -1; S.legF = [3, 1]; S.legB = [-3, 0]; S.armF = [4, -4]; S.armB = [-4, -3]; S.flow = 3; S.eyes = 1; S.mouth = 1; S.wAng = 160; S.hdy = 1; break;
    case 'block': S.lean = 0; S.legF = [3, 0]; S.legB = [-3, 0]; S.armF = [5.5, 1]; S.armB = [-2, 6]; S.bob = 1; break;
    case 'dash':
      if (cls === 'dragonico') { S.lean = 2; S.hdy = 2; S.legF = [1, 0]; S.legB = [-1, 1]; S.armF = [-3, -5]; S.armB = [-4, -4]; S.flow = 5; S.wing = 1; S.mouth = 3; }
      else { S.lean = 3; S.bob = 1; S.legF = [5, 0]; S.legB = [-5, 2]; S.armF = [7, 1]; S.armB = [-5, 1]; S.wAng = 95; S.flow = 5; }
      break;
    case 'atk':
      if (cls === 'dragonico') { // garras
        if (f === 0) { S.lean = 2; S.legF = [4, 0]; S.legB = [-3, 0]; S.armF = [7, 1]; S.armB = [-3, 5]; }
        else if (f === 1) { S.lean = 2; S.legF = [3, 0]; S.legB = [-4, 0]; S.armF = [-1, 4]; S.armB = [6.5, 1]; }
        else if (f === 2) { S.lean = 3; S.bob = 1; S.legF = [5, 0]; S.legB = [-4, 1]; S.armF = [5.5, -3]; S.armB = [4, -4]; S.mouth = 2; }
        else { S.lean = 1; S.armF = [4, 3]; S.armB = [-2, 5]; }
        S.flow = 4;
      } else { // guerreiro: espada
        if (f === 0) { S.lean = -1; S.legF = [3, 0]; S.legB = [-3, 0]; S.armF = [-2, -5]; S.wAng = -148; }
        else if (f === 1) { S.lean = 1; S.legF = [4, 0]; S.legB = [-3, 0]; S.armF = [4, -5.5]; S.wAng = 140; }
        else if (f === 2) { S.lean = 2; S.bob = 1; S.legF = [5, 0]; S.legB = [-4, 0]; S.armF = [7, 0.5]; S.wAng = 88; S.flow = 4; }
        else { S.lean = 1; S.legF = [4, 0]; S.legB = [-3, 0]; S.armF = [5, 3]; S.wAng = 55; }
      }
      break;
    case 'cast':
      if (cls === 'dragonico') { // sopro de fogo
        if (f === 0) { S.lean = -2; S.hdy = -1; S.armF = [3, 4]; S.armB = [-3, 4]; S.legF = [3, 0]; S.legB = [-3, 0]; }
        else if (f === 1) { S.lean = 2; S.hdy = 1; S.armF = [5, 3]; S.armB = [-4, 3]; S.legF = [4, 0]; S.legB = [-3, 0]; S.mouth = 3; S.flow = 3; }
        else { S.lean = 1; S.armF = [3, 5]; S.armB = [-3, 5]; S.legF = [3, 0]; S.legB = [-3, 0]; S.mouth = 3; }
        break;
      }
      if (f === 0) { S.lean = -1; S.armF = [-1, -4.5]; S.wAng = cls === 'mago' ? 150 : 100; S.legF = [3, 0]; S.legB = [-3, 0]; }
      else if (f === 1) { S.lean = 2; S.armF = [7, -1]; S.wAng = cls === 'mago' ? 115 : 90; S.legF = [4, 0]; S.legB = [-3, 0]; S.flow = 3; S.wShow = cls === 'mago'; S.mouth = 2; }
      else { S.lean = 1; S.armF = [5, 1.5]; S.wAng = cls === 'mago' ? 150 : 60; S.legF = [3, 0]; S.legB = [-3, 0]; S.wShow = cls === 'mago'; }
      break;
    case 'aim': {
      const a = ang * rad, dx = Math.cos(a), dy = Math.sin(a);
      S.lean = 1; S.legF = [3, 0]; S.legB = [-3, 0]; S.bob = 0;
      S.armF = [dx * 6.3, dy * 6.3]; S.aim = { dx, dy };
      S.hdy = dy > 0.5 ? 1 : dy < -0.7 ? -1 : 0; S.flow = 1;
      break;
    }
    case 'tuck': // bola de rolamento / pulo duplo
      S.bob = 4; S.hdy = 3; S.lean = -1; S.legF = [3, 7]; S.legB = [1, 7]; S.armF = [4.5, 4.5]; S.armB = [3, 5]; S.wShow = false; S.flow = 0; break;
  }
  return S;
}

// -------- peças reutilizáveis (coordenadas em pixels de alta resolução) --------
const sup = (g, cx, cy, rx, ry, base, o) => g.ell(cx, cy, rx, ry, base, o, 2.6);

function drawBlade(g, x, y, angDeg, len, wd, col, colL, hilt, guard) {
  const a = angDeg * Math.PI / 180, dx = Math.sin(a), dy = Math.cos(a), px = -dy, py = dx, hw = wd / 2;
  const P = (t, s) => [x + dx * t + px * s, y + dy * t + py * s];
  g.poly([P(0, hw), P(len - hw * 1.4, hw), P(len, 0), P(len - hw * 1.4, -hw), P(0, -hw)], col, { depth: Math.max(1, Math.round(wd / 4)), hi: colL, lo: shade(col, -0.35) });
  g.line(...P(2, 0), ...P(len - 3, 0), '#ffffff');
  // guarda e empunhadura
  g.poly([P(-1, hw * 2.6), P(2.4, hw * 2.6), P(2.4, -hw * 2.6), P(-1, -hw * 2.6)], guard, { depth: 1 });
  g.cap(...P(-1, 0), ...P(-8, 0), 4, hilt, { depth: 1 });
  g.ell(...P(-9, 0), 2.6, 2.6, guard, { depth: 1 });
}

function drawChar(ch, pose, f) {
  if (pose === 'roll' || pose === 'flip') {
    const base = drawChar(ch, 'tuck', 0);
    return rotated(base, pose === 'roll' ? f : -f, CX, FEET - 24);
  }
  const cls = ch.cls, isAim = pose === 'aim';
  const S0 = skeletonFor(pose, f, cls, isAim ? aimDeg(f) : 0);
  const S = { ...S0 };
  for (const k of ['bob', 'lean', 'sq', 'hdy', 'flow']) S[k] = Math.round(S0[k] * HR);
  for (const k of ['legF', 'legB', 'armF', 'armB']) S[k] = [S0[k][0] * HR, S0[k][1] * HR];

  const g = new PX(CW, CH);
  const legH = [9, 11, 14][ch.height], tw = [11, 14, 17][ch.build], lw = ch.build === 2 ? 7 : 6, aw = ch.build === 2 ? 6 : 5;
  const skin = ch.skin, skinD = toneLo(skin, 0.22), skinL = toneHi(skin, 0.16), skinDD = toneLo(skin, 0.4);
  const pri = ch.primary, priD = toneLo(pri, 0.3), priL = toneHi(pri, 0.25);
  const sec = ch.secondary, secD = toneLo(sec, 0.3), secL = toneHi(sec, 0.25);
  const hair = ch.hairColor, hairD = toneLo(hair, 0.32), hairL = toneHi(hair, 0.3), hairLL = toneHi(hair, 0.5);
  const metal = ch.weaponColor, metalD = toneLo(metal, 0.35), metalL = toneHi(metal, 0.45), acc = ch.accent, accL = toneHi(acc, 0.5), accD = toneLo(acc, 0.35);
  const wood = '#8a5a2b', woodD = '#5b3b20', woodL = '#b07a3e', gold = '#ffd23f', goldD = '#c9962a', goldL = '#fff2a0';
  const cx = CX, feet = FEET, lean = S.lean, flow = S.flow;
  const hipY = feet - legH * 1 + S.sq, torsoH = 16, torsoTop = hipY - torsoH + S.bob;
  const tx = Math.round(cx - tw / 2 + lean * 0.5);
  const hx0 = Math.round(cx - 12 + lean), hy = Math.round(torsoTop - 21 + S.hdy), hcx = hx0 + 12;
  const drag = cls === 'dragonico';
  const sleeve = ch.outfit === 3 ? skin : ch.outfit === 1 ? mix(pri, '#aab4c0', 0.55) : pri;
  const pants = ch.outfit === 1 ? toneLo(sec, 0.1) : secD, boot = toneLo(sec, 0.55), bootL = toneLo(sec, 0.25);
  const H = pts => pts.map(p => [hx0 + p[0], hy + p[1]]);          // coordenadas locais da cabeça -> mundo
  const sway = Math.round(flow * 0.8);

  // ---------- asas e cauda do dragônico (atrás de tudo) ----------
  if (drag) {
    const wm = toneLo(acc, 0.1), wmD = toneLo(acc, 0.4), bone = toneLo(skin, 0.15);
    const wx = tx + 4, wy = torsoTop + 2;
    const spread = S0.wing;      // 0 dobrada, 1 levemente aberta, 2/3 abertas (planando)
    if (spread >= 2) {
      const up = spread === 2 ? -26 : -14;
      g.poly([[wx, wy], [wx - 10, wy + up * 0.5], [wx - 30, wy + up], [wx - 22, wy + up * 0.5 + 8], [wx - 26, wy + up * 0.5 + 18], [wx - 14, wy + 12], [wx - 8, wy + 20], [wx, wy + 12]], wm, { hi: toneHi(acc, 0.25), lo: wmD });
      g.line(wx, wy, wx - 30, wy + up, bone); g.line(wx, wy + 1, wx - 22, wy + up * 0.5 + 8, bone); g.line(wx, wy + 2, wx - 14, wy + 12, bone);
    } else {
      const o = spread * 4;
      g.poly([[wx, wy + 4], [wx - 8 - o, wy - 12], [wx - 16 - o, wy - 22], [wx - 14 - o, wy - 8], [wx - 20 - o, wy + 2], [wx - 12 - o, wy + 6], [wx - 8, wy + 16], [wx, wy + 14]], wm, { hi: toneHi(acc, 0.25), lo: wmD });
      g.line(wx, wy + 3, wx - 16 - o, wy - 22, bone); g.line(wx, wy + 5, wx - 12 - o, wy + 6, bone);
    }
    // cauda
    const ts = Math.round(Math.sin(f * 1.3 + (pose === 'run' ? f : 0)) * 2) + sway;
    const hx = tx + 2, hyy = hipY - 3;
    const tail = [[hx, hyy - 4], [hx - 8, hyy - 2 + ts], [hx - 15, hyy + 5 + ts], [hx - 22, hyy + 3 + ts], [hx - 25, hyy - 3 + ts], [hx - 19, hyy + 8 + ts], [hx - 10, hyy + 12], [hx, hyy + 6]];
    g.poly(tail, skin, { hi: skinL, lo: skinD });
    g.poly([[hx - 21, hyy - 1 + ts], [hx - 27, hyy - 6 + ts], [hx - 25, hyy + 2 + ts]], acc, { depth: 1 });
  }

  // ---------- capa ----------
  if (ch.cape) {
    const len = ch.cape === 1 ? 20 : 34, cc = ch.capeColor, ccD = toneLo(cc, 0.32), ccL = toneHi(cc, 0.2);
    const off = Math.round(flow * 1.6);
    const rp = Math.round(Math.sin(f * 1.1 + (pose === 'run' ? 1 : 0)) * (1 + flow * 0.8));
    const pts = [[tx + 3, torsoTop + 3], [tx + tw - 3, torsoTop + 3], [tx + tw - 5 - off + rp, torsoTop + len - 2], [tx + tw * 0.72 - off - rp, torsoTop + len + 2], [tx + tw / 2 - off - 3 + rp, torsoTop + len - 1], [tx + 2 - off - rp, torsoTop + len + 2], [tx - 4 - off, torsoTop + len - 2]];
    g.poly(pts, cc, { hi: ccL, lo: ccD, depthD: 2 });
    for (let i = 1; i < 4; i++) g.line(tx + 2 + i * (tw / 4), torsoTop + 8, tx - 3 - off + i * ((tw + 4) / 4), torsoTop + len - 3, ccD);
  }

  // ---------- cabelo traseiro ----------
  if (ch.hair === 1 || ch.hair === 2 || ch.hair === 5) { // mechas soltas que acompanham o movimento
    const tr = Math.round(flow * 1.5) + (pose === 'idle' ? [0, 1, 1, 0, 0][f] : 0);
    for (const [y0, len, th] of [[2, 12, 3], [7, 15, 3], [12, 10, 2]]) {
      g.poly(H([[3, y0], [-2 - tr * 0.5, y0 + 1 + th], [-len - tr, y0 + 4 + th + (tr > 2 ? 3 : 1)], [-len + 3 - tr, y0 + 2], [-4, y0 - 1]]), hair, { hi: hairL, lo: hairD, depth: 1 });
    }
  }
  switch (ch.hair) {
    case 3: g.poly(H([[2, 4], [-5, 14], [-7, 28], [-3, 42], [4, 44], [9, 34], [8, 20], [6, 6]]), hair, { hi: hairL, lo: hairD }); break;
    case 4: g.ell(hx0 + 4, hy - 8, 6.5, 6.5, hair, { hi: hairL, lo: hairD }); break;
    case 6: g.poly(H([[1, 3], [-5 - sway, 1], [-12 - sway, 8], [-15 - sway, 20], [-10 - sway, 28], [-6 - sway, 18], [-2, 10]]), hair, { hi: hairL, lo: hairD }); break;
    case 7: { const M = g.ell(hx0 + 12, hy + 1, 19, 15, hair, { hi: hairL, lo: hairD, depth: 3 }); g.speckle(M, hairL, 22, 7); break; }
  }

  // ---------- equipamento nas costas ----------
  if (cls === 'guerreiro' && pose !== 'block') {
    g.ell(tx - 1, torsoTop + 10, 9, 9.5, sec, { hi: secL, lo: secD, depth: 2 });
    g.ell(tx - 1, torsoTop + 10, 3.6, 3.6, acc, { depth: 1, hi: accL });
  }
  if (cls === 'arqueiro') { // aljava
    g.poly([[tx - 8, torsoTop - 4], [tx + 1, torsoTop - 2], [tx + 3, torsoTop + 18], [tx - 6, torsoTop + 16]], '#7a4e2a', { hi: '#a8743e', lo: '#4a2d15' });
    g.rect(tx - 7, torsoTop - 8, 2, 5, '#e8e8e8'); g.rect(tx - 4, torsoTop - 10, 2, 7, acc); g.rect(tx - 1, torsoTop - 8, 2, 5, '#e8e8e8'); g.rect(tx - 4, torsoTop - 4, 2, 2, '#e63946');
  }

  // ---------- braço de trás ----------
  const shB = { x: cx - 3 + lean * 0.5, y: torsoTop + 4 }, shF = { x: cx + 1 + lean * 0.5, y: torsoTop + 4 };
  const armLen = 7.4, foreC = ch.outfit === 3 ? skin : sleeve;       // manga cobre o antebraço (só o colete deixa o braço de fora)
  if (isAim) {
    const aim = S.aim, Hh = { x: shF.x + aim.dx * 12.6, y: shF.y + aim.dy * 12.6 }, Pp = { x: Hh.x - aim.dx * 10, y: Hh.y - aim.dy * 10 };
    const b2 = ik(shB.x, shB.y, Pp.x, Pp.y, armLen, armLen, -1, 1.6);
    g.limb2(shB.x, shB.y, b2.ex, b2.ey, b2.hx, b2.hy, aw, toneLo(sleeve, 0.2), { depth: 1 });
    g.ell(b2.hx, b2.hy, 2.6, 2.6, toneLo(skin, 0.1), { depth: 1 });
    S.pull = Pp;
  } else {
    const a = ik(shB.x, shB.y, shB.x + S.armB[0], shB.y + S.armB[1], armLen, armLen, 1, S0.bendMax);
    g.limb2(shB.x, shB.y, a.ex, a.ey, a.hx, a.hy, aw, toneLo(sleeve, 0.22), { depth: 1 });
    g.cap(a.ex + (a.hx - a.ex) * 0.74, a.ey + (a.hy - a.ey) * 0.74, a.hx, a.hy, aw, toneLo(sec, 0.2), { depth: 1 });
    g.ell(a.hx, a.hy, 2.7, 2.7, toneLo(skin, 0.12), { depth: 1 });
    if (drag) { g.px(a.hx + 2, a.hy + 2, goldL); g.px(a.hx + 3, a.hy + 3, goldL); }
  }

  // ---------- pernas ----------
  const hipFx = cx + Math.round(tw / 4) + lean * 0.5, hipBx = cx - Math.round(tw / 4) + lean * 0.5;
  const L = legH * 0.55 + 1.6;
  const drawLeg = (hipx, fx, lift, back) => {
    const ax = hipx + fx, ay = feet - lift - 4;
    const k = ik(hipx, hipY - 2, ax, ay, L, L, -1);
    const pc = back ? toneLo(pants, 0.25) : pants;
    g.limb2(hipx, hipY - 2, k.ex, k.ey, k.hx, k.hy, lw, pc, { depth: 1 });
    const bc = back ? toneLo(boot, 0.12) : boot;
    g.poly([[k.hx - 4, k.hy - 3], [k.hx + 3, k.hy - 3], [k.hx + 4, k.hy], [k.hx + 9, k.hy + 1], [k.hx + 10, k.hy + 5], [k.hx - 4, k.hy + 5]], bc, { depth: 1, hi: back ? bootL : toneLo(sec, 0.12), lo: toneLo(boot, 0.3) });
    g.rect(k.hx - 4, k.hy + 4, 14, 2, '#ece7f5');
    g.rect(k.hx - 4, k.hy + 5, 14, 1, '#b0aac0');
  };
  drawLeg(hipBx, S.legB[0], S.legB[1], true);
  drawLeg(hipFx, S.legF[0], S.legF[1], false);

  // ---------- tronco ----------
  g.rect(cx - 3 + lean * 0.5, torsoTop - 2, 7, 5, toneLo(skin, 0.1));
  const T = [[tx, torsoTop + 1], [tx + tw, torsoTop + 1], [tx + tw - 1, hipY], [tx + 1, hipY]];
  switch (ch.outfit) {
    case 0: { // túnica
      const M = g.poly(T, pri, { hi: priL, lo: priD });
      g.speckle(M, priL, 6, 11, 0.5);
      g.poly([[tx - 1, hipY - 4], [tx + tw + 1, hipY - 4], [tx + tw + 4, hipY + 5], [tx - 4, hipY + 5]], priD, { depth: 1, hi: pri });
      g.rect(tx, hipY - 6, tw, 4, sec); g.rect(tx, hipY - 6, tw, 1, secL); g.rect(tx, hipY - 3, tw, 1, secD);
      g.rect(cx - 3 + lean * 0.5, hipY - 7, 6, 6, gold); g.rect(cx - 2 + lean * 0.5, hipY - 6, 4, 4, goldD); g.rect(cx - 1 + lean * 0.5, hipY - 5, 2, 2, goldL);
      g.rect(cx - 2 + lean * 0.5, torsoTop + 1, 5, 2, secD);
      break;
    }
    case 1: { // armadura
      const a = mix(pri, '#aab4c0', 0.55), aL = toneHi(a, 0.4), aD = toneLo(a, 0.36);
      g.poly(T, a, { hi: aL, lo: aD, depth: 2 });
      g.rect(tx + 3, torsoTop + 5, tw - 6, 1, aD); g.rect(tx + 3, torsoTop + 10, tw - 6, 1, aD); g.rect(cx + lean * 0.5, torsoTop + 2, 1, torsoH - 4, aD);
      g.rect(cx - 5 + lean * 0.5, torsoTop + 3, 3, 2, aL);
      g.poly([[tx - 1, hipY - 4], [tx + tw + 1, hipY - 4], [tx + tw + 3, hipY + 4], [tx - 3, hipY + 4]], sec, { depth: 1, hi: secL, lo: secD });
      g.rect(tx, hipY - 6, tw, 3, secD); g.rect(cx - 2 + lean * 0.5, hipY - 6, 4, 3, gold);
      g.ell(cx - 1 + lean * 0.5, torsoTop + 4, 6, 5, pri, { hi: priL, lo: priD });
      break;
    }
    case 2: { // manto
      const M = g.poly([[tx - 1, torsoTop + 1], [tx + tw + 1, torsoTop + 1], [tx + tw + 5, hipY + 10], [tx - 5, hipY + 10]], pri, { hi: priL, lo: priD, depth: 2 });
      g.speckle(M, priL, 10, 5, 0.7);
      g.rect(tx - 5, hipY + 7, tw + 10, 3, sec); g.rect(tx - 5, hipY + 7, tw + 10, 1, secL);
      g.rect(tx - 1, torsoTop + 9, tw + 2, 3, sec); g.rect(tx - 1, torsoTop + 9, tw + 2, 1, secL);
      g.rect(cx - 1 + lean * 0.5, torsoTop + 12, 2, hipY + 8 - torsoTop - 12, priD); g.rect(cx - 2 + lean * 0.5, torsoTop + 9, 4, 3, gold);
      g.poly([[cx - 6 + lean * 0.5, torsoTop + 1], [cx + 6 + lean * 0.5, torsoTop + 1], [cx + 2, torsoTop + 8], [cx - 2, torsoTop + 8]], sec, { depth: 1 });
      break;
    }
    case 3: { // colete
      g.poly(T, mix(skin, '#f4efe0', 0.6), { hi: '#fffaf0', lo: shade('#f4efe0', -0.2) });
      g.poly([[tx, torsoTop + 1], [tx + 6, torsoTop + 1], [tx + 5, hipY], [tx + 1, hipY]], pri, { hi: priL, lo: priD });
      g.poly([[tx + tw - 6, torsoTop + 1], [tx + tw, torsoTop + 1], [tx + tw - 1, hipY], [tx + tw - 5, hipY]], pri, { hi: priL, lo: priD });
      g.rect(tx, hipY - 5, tw, 4, sec); g.rect(tx, hipY - 5, tw, 1, secL); g.rect(cx - 2 + lean * 0.5, hipY - 5, 4, 4, gold);
      break;
    }
  }
  if (ch.cape) { g.rect(tx + 1, torsoTop, tw - 1, 4, ch.capeColor); g.rect(tx + 1, torsoTop, tw - 1, 1, toneHi(ch.capeColor, 0.25)); g.ell(cx + lean * 0.5, torsoTop + 3, 2.5, 2.5, acc, { depth: 1, hi: accL }); }
  if (ch.acc === 5) { // cachecol
    g.poly([[tx - 2, torsoTop - 3], [tx + tw + 2, torsoTop - 3], [tx + tw + 2, torsoTop + 4], [tx - 2, torsoTop + 4]], sec, { depth: 1, hi: secL, lo: secD });
    const w2 = Math.round(flow);
    g.poly([[tx - 2, torsoTop - 1], [tx - 12 - w2, torsoTop + 1], [tx - 15 - w2, torsoTop + 8], [tx - 8 - w2, torsoTop + 10], [tx - 2, torsoTop + 5]], secD, { depth: 1, hi: sec });
  }

  // ---------- cabeça ----------
  sup(g, hcx, hy + 11, 12, 11, skin, { hi: skinL, lo: skinD, depth: 2, depthD: 1 });
  g.rect(hx0 + 1, hy + 11, 3, 6, skinD); g.rect(hx0 + 1, hy + 12, 2, 4, toneLo(skin, 0.3));   // orelha
  g.px(hx0 + 24, hy + 14, skin); g.px(hx0 + 25, hy + 15, skin); g.px(hx0 + 25, hy + 16, skinD); g.px(hx0 + 24, hy + 16, skinD); // nariz
  g.rect(hx0 + 14, hy + 16, 3, 2, mix(skin, '#ff7a8a', 0.4)); // bochecha rosada
  const irisC = ch.eyes;
  const eye = (ex, ey, wide) => {
    const w = wide ? 6 : 5;
    if (S.eyes === 1) { g.rect(ex, ey + 3, w, 1, '#1a1020'); g.rect(ex - 1, ey + 2, 1, 1, '#1a1020'); return; }
    g.rect(ex, ey, w, 7, '#ffffff'); g.rect(ex, ey + 6, w, 1, '#c9cfe4');
    g.rect(ex + w - 3, ey, 3, 7, irisC); g.rect(ex + w - 3, ey, 3, 2, toneLo(irisC, 0.35));
    if (drag) g.rect(ex + w - 2, ey, 1, 7, '#120a14');
    else g.rect(ex + w - 2, ey + 2, 2, 4, toneLo(irisC, 0.6));
    g.px(ex + w - 3, ey + 2, '#ffffff'); g.px(ex + w - 3, ey + 3, '#ffffff');
    g.rect(ex - 1, ey - 1, w + 1, 1, '#140a1a'); g.px(ex - 1, ey, '#140a1a');   // cílios
    if (ch.face === 3) g.rect(ex, ey, w, 2, skinD);                           // pálpebra caída
  };
  eye(hx0 + 8, hy + 9, false); eye(hx0 + 16, hy + 9, true);
  const brow = (ex, dy) => g.rect(ex, hy + 6 + dy, 5, 1, hairD);
  const mouth = '#7a2a2a';
  switch (ch.face) {
    case 1: for (let i = 0; i < 5; i++) { g.px(hx0 + 8 + i, hy + 6 + ((4 - i) / 3 | 0), hairD); g.px(hx0 + 16 + i, hy + 6 + ((4 - i) / 3 | 0), hairD); } g.rect(hx0 + 16, hy + 19, 4, 1, mouth); g.px(hx0 + 15, hy + 20, skinD); break;
    case 2: g.rect(hx0 + 14, hy + 18, 6, 2, mouth); g.rect(hx0 + 15, hy + 18, 4, 1, '#ffffff'); g.px(hx0 + 13, hy + 17, mouth); g.px(hx0 + 20, hy + 17, mouth); brow(hx0 + 8, 0); brow(hx0 + 16, 0); break;
    case 3: g.rect(hx0 + 15, hy + 19, 4, 1, skinD); brow(hx0 + 8, 1); brow(hx0 + 16, 1); break;
    case 4: g.line(hx0 + 21, hy + 5, hx0 + 17, hy + 17, '#b5524a'); g.line(hx0 + 22, hy + 5, hx0 + 18, hy + 17, '#b5524a'); g.rect(hx0 + 15, hy + 19, 4, 1, skinD); brow(hx0 + 8, 0); break;
    default: g.rect(hx0 + 15, hy + 19, 4, 1, skinD); brow(hx0 + 8, 0); brow(hx0 + 16, 0);
  }
  if (S.mouth === 1) g.rect(hx0 + 15, hy + 18, 4, 3, '#4a1218');
  if (S.mouth === 2) g.rect(hx0 + 15, hy + 19, 4, 2, '#4a1218');
  if (S.mouth === 3) { g.rect(hx0 + 15, hy + 17, 6, 4, '#4a1218'); g.rect(hx0 + 16, hy + 19, 4, 2, '#ff7a2a'); }
  if (drag) { // escamas na bochecha e testa
    for (const [x, y] of [[5, 6], [9, 3], [14, 4], [19, 5], [4, 15], [7, 18]]) g.px(hx0 + x, hy + y, skinD);
  }

  // ---------- cabelo da frente ----------
  const hairM = (pts, o = {}) => { const M = g.poly(H(pts), hair, { hi: hairL, lo: hairD, depth: 2, ...o }); g.speckle(M, hairLL, 10, 3 + ch.hair); g.speckle(M, hairL, 14, 9 + ch.hair); return M; };
  const FRONT = [[-2, 14], [-4, 6], [0, -3], [6, -7], [14, -8], [20, -5], [25, 0], [25, 4], [26, 7], [22, 6], [20, 9], [17, 5], [14, 8], [11, 5], [7, 7], [5, 13], [2, 11]];
  switch (ch.hair) {
    case 0: break;
    case 1: hairM([[-2, 14], [-4, 8], [-2, 3], [-5, -1], [0, -3], [-1, -8], [4, -5], [6, -10], [10, -6], [14, -9], [17, -5], [22, -7], [21, -2], [26, 0], [25, 4], [26, 7], [22, 6], [20, 9], [17, 5], [14, 8], [11, 5], [7, 7], [5, 13], [2, 11]]); break;
    case 2: hairM([[-2, 14], [-5, 7], [-3, 1], [-8, -4], [-1, -4], [-3, -12], [3, -6], [5, -15], [9, -7], [13, -16], [16, -7], [21, -12], [21, -3], [27, -3], [25, 3], [26, 7], [22, 6], [20, 9], [17, 5], [14, 8], [11, 5], [7, 7], [5, 13], [2, 11]]); break;
    case 5: hairM([[5, 4], [3, -6], [7, -12], [9, -6], [12, -17], [15, -6], [18, -13], [19, -4], [20, 2], [15, 0], [10, 1]]); g.rect(hx0 + 1, hy + 3, 3, 8, hairD); break;
    default: hairM(FRONT);
  }

  // ---------- chifres do dragônico ----------
  if (drag) {
    const hc = toneHi(acc, 0.1), hcD = toneLo(acc, 0.35);
    g.poly(H([[3, 2], [-3, -4], [-9, -12], [-4, -18], [-3, -9], [5, -1]]), hc, { hi: toneHi(acc, 0.5), lo: hcD, depth: 1 });
    g.poly(H([[17, 1], [20, -5], [26, -13], [29, -9], [25, -3], [23, 3]]), hc, { hi: toneHi(acc, 0.5), lo: hcD, depth: 1 });
  }

  // ---------- acessórios do rosto ----------
  switch (ch.acc) {
    case 1: g.rect(hx0 + 6, hy + 7, 9, 10, '#14101a'); g.rect(hx0 + 7, hy + 8, 7, 8, '#8fdcff'); g.rect(hx0 + 7, hy + 8, 3, 2, '#ffffff'); g.rect(hx0 + 14, hy + 7, 9, 10, '#14101a'); g.rect(hx0 + 15, hy + 8, 7, 8, '#8fdcff'); g.rect(hx0 + 15, hy + 8, 3, 2, '#ffffff'); g.rect(hx0 + 13, hy + 10, 2, 2, '#14101a'); g.rect(hx0 + 1, hy + 10, 6, 2, '#14101a'); break;
    case 2: g.poly(H([[15, 6], [24, 6], [24, 17], [15, 17]]), '#16121c', { depth: 1, hi: '#3a3448' }); g.line(hx0 - 1, hy + 4, hx0 + 25, hy + 8, '#16121c'); g.line(hx0 - 1, hy + 5, hx0 + 25, hy + 9, '#16121c'); break;
    case 3: g.poly(H([[1, 15], [26, 15], [26, 22], [18, 25], [8, 25], [2, 21]]), acc, { depth: 1, hi: accL, lo: accD }); g.line(hx0 + 14, hy + 16, hx0 + 14, hy + 24, accD); break;
    case 4: g.poly(H([[3, 14], [10, 19], [18, 20], [25, 15], [25, 20], [20, 28], [12, 31], [5, 26]]), hair, { depth: 2, hi: hairL, lo: hairD }); g.rect(hx0 + 15, hy + 18, 4, 1, mouth); break;
  }

  // ---------- chapéus e elmos ----------
  const hc = ch.headColor, hcD = toneLo(hc, 0.32), hcL = toneHi(hc, 0.32), ho = { hi: hcL, lo: hcD };
  switch (ch.head) {
    case 1: { // chapéu de mago
      const tip = Math.round(flow * 0.8);
      g.poly(H([[2, 3], [22, 3], [18, -10], [16, -22], [10, -34], [6, -33], [-2 - tip, -34], [6, -26], [5, -12]]), hc, { ...ho, depth: 3 });
      g.ell(hcx, hy + 3, 18, 4.5, hc, { ...ho, depth: 2 });
      g.rect(hx0 + 4, hy - 2, 16, 4, acc); g.rect(hx0 + 4, hy - 2, 16, 1, accL); g.rect(hx0 + 10, hy - 2, 5, 4, gold);
      g.px(hx0 + 12, hy - 20, goldL); g.px(hx0 + 9, hy - 12, goldL); g.px(hx0 + 14, hy - 26, goldL);
      break;
    }
    case 2: // elmo
      g.poly(H([[-2, 12], [-3, 2], [2, -6], [12, -9], [22, -6], [27, 2], [26, 8], [22, 6], [2, 6]]), hc, { ...ho, depth: 3 });
      g.poly(H([[-2, 6], [5, 6], [6, 22], [-1, 20]]), hcD, { depth: 1, hi: hc });
      g.poly(H([[16, 6], [19, 6], [19, 18], [16, 17]]), hc, { ...ho, depth: 1 });
      g.poly(H([[6, -8], [10, -17], [18, -16], [21, -7]]), acc, { depth: 2, hi: accL, lo: accD });
      g.rect(hx0 + 1, hy + 5, 25, 2, hcD);
      break;
    case 3: // coroa
      g.poly(H([[3, 1], [21, 1], [21, -6], [18, -13], [15, -6], [12, -15], [9, -6], [6, -13], [3, -6]]), gold, { hi: goldL, lo: goldD, depth: 2 });
      g.rect(hx0 + 3, hy - 3, 18, 2, goldD); g.rect(hx0 + 5, hy - 2, 3, 3, '#e63946'); g.rect(hx0 + 11, hy - 2, 3, 3, acc); g.rect(hx0 + 17, hy - 2, 3, 3, '#e63946');
      break;
    case 4: { // bandana
      const t = Math.round(flow * 0.8);
      g.poly(H([[-1, 3], [25, 3], [25, 8], [-1, 8]]), hc, { ...ho, depth: 1 });
      g.poly(H([[-1, 5], [-9 - t, 6], [-13 - t, 13], [-7 - t, 12], [-2, 9]]), hcD, { depth: 1, hi: hc });
      g.poly(H([[-1, 3], [-8 - t, 0], [-12 - t, 6], [-6 - t, 6]]), hc, { ...ho, depth: 1 });
      break;
    }
    case 5: // chifres
      g.poly(H([[-1, 2], [25, 2], [25, 7], [-1, 7]]), hc, { ...ho, depth: 1 });
      g.poly(H([[1, 3], [-6, -3], [-12, -12], [-8, -19], [-5, -9], [4, 0]]), '#efe6cc', { hi: '#ffffff', lo: '#b8ad8a', depth: 1 });
      g.poly(H([[19, 2], [24, -4], [29, -14], [25, -22], [22, -11], [17, 0]]), '#efe6cc', { hi: '#ffffff', lo: '#b8ad8a', depth: 1 });
      break;
    case 6: // orelhas de gato
      g.poly(H([[1, 2], [2, -10], [11, 0]]), hair, { hi: hairL, lo: hairD, depth: 1 }); g.poly(H([[3, 0], [4, -6], [8, -1]]), '#f4a5b8', { depth: 0 });
      g.poly(H([[13, 0], [21, -10], [25, 3]]), hair, { hi: hairL, lo: hairD, depth: 1 }); g.poly(H([[16, 0], [21, -6], [23, 1]]), '#f4a5b8', { depth: 0 });
      break;
    case 7: // capuz
      g.poly(H([[-3, 24], [-5, 8], [-1, -5], [8, -10], [18, -9], [24, -3], [25, 4], [22, 5], [19, 0], [13, -1], [8, 3], [6, 10], [6, 22]]), hc, { ...ho, depth: 3 });
      g.poly([[tx - 4, torsoTop + 1], [tx + tw + 4, torsoTop + 1], [tx + tw + 2, torsoTop + 9], [tx - 2, torsoTop + 9]], hcD, { depth: 1, hi: hc });
      break;
  }

  // ---------- braço da frente + arma ----------
  const a1 = ik(shF.x, shF.y, shF.x + S.armF[0], shF.y + S.armF[1], armLen, armLen, 1, S0.bendMax);
  const hnd = { x: a1.hx, y: a1.hy };
  const hand = () => {
    g.limb2(shF.x, shF.y, a1.ex, a1.ey, a1.hx, a1.hy, aw, sleeve, { depth: 1 });
    if (ch.outfit !== 3) g.cap(a1.ex + (a1.hx - a1.ex) * 0.74, a1.ey + (a1.hy - a1.ey) * 0.74, a1.hx, a1.hy, aw, sec, { depth: 1 });
    g.ell(hnd.x, hnd.y, 3, 3, skin, { hi: skinL, lo: skinD, depth: 1 });
    if (drag) { g.px(hnd.x + 2, hnd.y + 2, goldL); g.px(hnd.x + 3, hnd.y + 3, goldL); g.px(hnd.x + 3, hnd.y + 1, goldL); }
  };
  const dir = a => ({ x: Math.sin(a * Math.PI / 180), y: Math.cos(a * Math.PI / 180) });

  if (cls === 'guerreiro') {
    if (pose === 'block') {
      const sx = hnd.x - 4, sy = torsoTop - 6;
      g.poly([[sx - 2, sy], [sx + 14, sy], [sx + 14, sy + 20], [sx + 6, sy + 30], [sx - 2, sy + 20]], sec, { hi: secL, lo: secD, depth: 2 });
      g.poly([[sx + 1, sy + 3], [sx + 11, sy + 3], [sx + 11, sy + 19], [sx + 6, sy + 26], [sx + 1, sy + 19]], priL, { hi: '#ffffff', lo: toneLo(pri, 0.1), depth: 2 });
      g.rect(sx + 5, sy + 5, 2, 17, '#ffffff'); g.rect(sx + 2, sy + 12, 8, 3, gold);
      hand();
    } else if (pose === 'cast') {
      hand();
      if (f === 0) {
        const d = dir(S0.wAng), x = hnd.x, y = hnd.y;
        g.cap(x - d.x * 18, y - d.y * 18, x + d.x * 22, y + d.y * 22, 3, wood, { depth: 1, hi: woodL, lo: woodD });
        g.poly([[x + d.x * 22, y + d.y * 22 - 4], [x + d.x * 31, y + d.y * 22], [x + d.x * 22, y + d.y * 22 + 4]], metal, { hi: metalL, lo: metalD, depth: 1 });
      }
    } else {
      drawBlade(g, hnd.x, hnd.y, S0.wAng, 26, 6, metal, metalL, wood, gold);
      hand();
    }
  } else if (cls === 'mago') {
    const d = dir(S0.wAng), top = { x: hnd.x + d.x * 28, y: hnd.y + d.y * 28 };
    g.cap(hnd.x - d.x * 18, hnd.y - d.y * 18, top.x, top.y, 4, wood, { depth: 1, hi: woodL, lo: woodD });
    g.cap(top.x - d.x * 2, top.y - d.y * 2, top.x - d.x * 8, top.y - d.y * 8, 5, woodD, { depth: 1 });
    const r = pose === 'cast' && f === 1 ? 7.5 : 6.2, ox = top.x + d.x * 3, oy = top.y + d.y * 3;
    g.cap(ox - 7, oy + 6, ox - 7, oy - 3, 3, wood, { depth: 1 }); g.cap(ox + 7, oy + 6, ox + 7, oy - 3, 3, wood, { depth: 1 });
    g.ell(ox, oy, r, r, acc, { hi: accL, lo: accD, depth: 2 });
    g.rect(ox - 3, oy - 3, 2, 2, '#ffffff');
    if (pose === 'cast' && f >= 1) { g.px(ox + 10, oy - 6, accL); g.px(ox - 9, oy - 8, accL); g.px(ox + 9, oy + 7, accL); g.px(ox, oy - 12, '#ffffff'); }
    hand();
  } else if (cls === 'arqueiro') {
    const aim = S.aim || { dx: 1, dy: 0 }, Hh = { x: hnd.x, y: hnd.y };
    const px = -aim.dy, py = aim.dx, T1 = { x: Hh.x + px * 16, y: Hh.y + py * 16 }, T2 = { x: Hh.x - px * 16, y: Hh.y - py * 16 };
    const bel = { x: Hh.x + aim.dx * 5, y: Hh.y + aim.dy * 5 };
    g.cap(T1.x, T1.y, bel.x, bel.y, 3, wood, { depth: 1, hi: woodL, lo: woodD }); g.cap(T2.x, T2.y, bel.x, bel.y, 3, wood, { depth: 1, hi: woodL, lo: woodD });
    const pull = S.pull || { x: Hh.x - aim.dx * 1, y: Hh.y - aim.dy * 1 };
    g.line(T1.x, T1.y, pull.x, pull.y, '#efe6cc'); g.line(T2.x, T2.y, pull.x, pull.y, '#efe6cc');
    if (isAim) {
      g.cap(pull.x, pull.y, Hh.x + aim.dx * 17, Hh.y + aim.dy * 17, 2, '#d8c8a0', { depth: 0, flat: true });
      g.poly([[Hh.x + aim.dx * 15 + px * 2, Hh.y + aim.dy * 15 + py * 2], [Hh.x + aim.dx * 21, Hh.y + aim.dy * 21], [Hh.x + aim.dx * 15 - px * 2, Hh.y + aim.dy * 15 - py * 2]], '#f2f6ff', { depth: 0, flat: true });
      g.cap(pull.x, pull.y, pull.x + aim.dx * 4, pull.y + aim.dy * 4, 3, '#e63946', { depth: 0, flat: true });
    }
    hand();
  } else { // dragônico: só as garras
    hand();
  }

  return outline(g.toCanvas(), INK);
}

// Conjunto de sprites com cache preguiçoso (só desenha a pose quando ela é usada)
function buildPlayerSprites(ch) {
  const cache = {};
  return {
    ch,
    get(pose, f = 0) {
      const n = POSES[pose]; f = ((f % n) + n) % n;
      const k = pose + f;
      return cache[k] || (cache[k] = drawChar(ch, pose, f));
    },
    // rosto minimalista para o HUD (vidas): recorte da cabeça, 36x36 px de alta resolução
    face() {
      if (cache.face) return cache.face;
      const body = this.get('idle', 0), legH = [9, 11, 14][ch.height];
      const hy = FEET - legH - 16 - 21, o = mk(36, 36), g = o.getContext('2d');
      g.drawImage(body, CX - 18, hy - 12, 36, 36, 0, 0, 36, 36);
      return (cache.face = o);
    },
  };
}

// ---------- Ícones (resolução do cenário) ----------
const ICON = {};
ICON.heart = fromMap(['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'], { '#': '#e63946' });
{
  const g = ICON.heart.getContext('2d'); g.fillStyle = '#ff9aa5'; g.fillRect(1, 1, 1, 1); g.fillRect(2, 1, 1, 1);
  g.fillStyle = '#9c1f2e'; g.fillRect(5, 3, 1, 1); g.fillRect(4, 4, 1, 1); g.fillRect(3, 5, 1, 1);
  outline(ICON.heart, INK);
  ICON.heartEmpty = fromMap(['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'], { '#': '#3a2a3a' });
  outline(ICON.heartEmpty, INK);
  ICON.heartHalf = mk(9, 8); const h = ICON.heartHalf.getContext('2d');
  h.drawImage(ICON.heartEmpty, 0, 0); h.drawImage(ICON.heart, 0, 0, 5, 8, 0, 0, 5, 8);
  ICON.potion = fromMap(['..###..', '...#...', '..###..', '.#####.', '#######', '#######', '#######', '.#####.'], { '#': '#4aa3ff' });
  const q = ICON.potion.getContext('2d'); q.fillStyle = '#cfe8ff'; q.fillRect(1, 4, 1, 3); q.fillStyle = '#7a5230'; q.fillRect(2, 0, 3, 1);
  q.fillStyle = '#2a6fc9'; q.fillRect(5, 5, 1, 2); q.fillRect(3, 7, 3, 1);
  outline(ICON.potion, INK);
}
ICON.coin = [8, 6, 3, 6].map(w => {
  const c = mk(10, 10), g = c.getContext('2d');
  g.fillStyle = '#d99a00'; g.fillRect(5 - w / 2, 1, w, 8);
  g.fillStyle = '#ffd23f'; g.fillRect(5 - w / 2, 1, Math.max(1, w - 1), 7);
  g.fillStyle = '#fff3a8'; g.fillRect(5 - w / 2 + (w > 3 ? 1 : 0), 2, Math.max(1, (w / 3) | 0), 4);
  if (w >= 6) { g.fillStyle = '#d99a00'; g.fillRect(4, 3, 2, 1); g.fillRect(4, 5, 2, 1); }
  return outline(c, INK);
});
// ícones de status (acima dos inimigos)
ICON.status = {
  burn: fromMap(['..#..', '.##.#', '.###.', '#####', '.###.'], { '#': '#ff8a1f' }),
  poison: fromMap(['.###.', '#####', '#.#.#', '.###.', '..#..'], { '#': '#7bd34a' }),
  freeze: fromMap(['#.#.#', '.###.', '#####', '.###.', '#.#.#'], { '#': '#9fe8ff' }),
  stun: fromMap(['#.#.#', '.###.', '#.#.#', '.###.', '#.#.#'], { '#': '#ffe94d' }),
};
for (const k in ICON.status) outline(ICON.status[k], INK);
