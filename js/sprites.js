'use strict';
// ---------- Opções de personalização ----------
const OPTS = {
  heights:  ['Baixo', 'Médio', 'Alto'],
  builds:   ['Magro', 'Normal', 'Forte'],
  // características do rosto (antes eram expressões): cicatrizes, pelos (cor do cabelo) e pinturas (cor de destaque)
  faces:    ['Liso', 'Cicatriz no olho', 'Cicatriz na bochecha', 'Cicatriz no nariz', 'Barba', 'Bigode', 'Cavanhaque', 'Pintura de guerra', 'Faixa nos olhos', 'Sardas'],
  bodies:   ['Masculino', 'Feminino'],
  hairs:    ['Careca', 'Bagunçado', 'Espetado', 'Longo', 'Coque', 'Moicano', 'Rabo de cavalo', 'Afro', 'Médio', 'Trança'],
  outfits:  ['Túnica', 'Armadura', 'Manto', 'Colete'],
  heads:    ['Nenhum', 'Chapéu de mago', 'Elmo', 'Coroa', 'Bandana', 'Chifres', 'Orelhas de gato', 'Capuz'],
  capes:    ['Nenhuma', 'Curta', 'Longa'],
  accs:     ['Nenhum', 'Óculos', 'Tapa-olho', 'Máscara', 'Brinco', 'Cachecol'],
};

// ---------- Superfície de pixels em software ----------
// Os personagens são desenhados com o DOBRO da resolução do cenário (HR = 2). Inimigos e cenário usam o sombreamento
// simples de borda (paint); os heróis usam o sombreamento por volume em 5 tons (g.vol = true, ver paintVol).
const HR = 2;
const _col = {};
const C = h => _col[h] || (_col[h] = hexToRgb(h));
const INK = '#0a0610';
// ordem das camadas do herói, de trás para a frente (também a ordem de empilhamento das folhas PNG)
const LAYER_ORDER = ['asas', 'capa', 'cabelo_tras', 'costas', 'braco_tras', 'pernas', 'tronco', 'capa_fecho', 'cachecol', 'cabeca', 'cabelo_frente', 'chifres', 'acessorio', 'chapeu', 'capuz_ombro', 'arma', 'braco_frente', 'capuz_braco'];

// ---------- Acabamento do herói montado ----------
// Traço de contato entre camadas: onde uma peça passa na frente de outra, a de trás escurece junto à borda.
// Do lado da sombra (peça da frente em cima/à esquerda) o traço é forte e ganha 1 px de sombra projetada; do outro
// lado é só um fio. Separa braço do tronco, cabelo da testa, cabeça do pescoço... mesmo com cores parecidas.
function occlude(d, ids, w, h) {
  const src = ids.slice();
  const fr = (x, y, a) => x >= 0 && y >= 0 && x < w && y < h && src[y * w + x] > a && d[(y * w + x) * 4 + 3];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x, a = src[p], i = p * 4;
    if (!d[i + 3] || !a) continue;
    // 2º anel: a sombra projetada pela peça da frente (luz de cima-esquerda) continua, mais leve, por mais 1 px
    const k = fr(x - 1, y, a) || fr(x, y - 1, a) ? 0.6 : fr(x + 1, y, a) || fr(x, y + 1, a) ? 0.78 : fr(x - 2, y, a) || fr(x, y - 2, a) || fr(x - 1, y - 1, a) ? 0.86 : 1;
    if (k === 1) continue;
    // escurece sem acinzentar: reforça a saturação e puxa de leve para o frio
    const r = d[i] * k, g = d[i + 1] * k * 0.95, b = d[i + 2] * k * 1.08, m = (r + g + b) / 3;
    d[i] = m + (r - m) * 1.25; d[i + 1] = m + (g - m) * 1.25; d[i + 2] = m + (b - m) * 1.25;
  }
}
// Acabamento: sombras de leve para o frio, um toque de luz nas quinas de cima-esquerda e o contorno escuro.
function heroFinish(c, ids, ch) {
  const g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, id = g.getImageData(0, 0, w, h), d = id.data, src = new Uint8ClampedArray(d);
  const al = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 40;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (!d[i + 3]) continue;
    if ((d[i] + d[i + 1] + d[i + 2]) / 3 < 90) d[i + 2] += 4;                    // sombras de leve para o frio
    else if (!al(x - 1, y) && !al(x, y - 1)) { d[i] += (255 - d[i]) * 0.1; d[i + 1] += (244 - d[i + 1]) * 0.1; d[i + 2] += (214 - d[i + 2]) * 0.1; }   // quina iluminada
  }
  g.putImageData(id, 0, 0);
  return heroOutline(c);
}
// Contorno: tinta escura em volta do herói; no lado da luz (em cima/à esquerda) o traço puxa a cor da peça vizinha.
function heroOutline(c) {
  const g = c.getContext('2d'), w = c.width, h = c.height, id = g.getImageData(0, 0, w, h), a = id.data, o = new Uint8ClampedArray(a);
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 40;
  const ink = C(INK);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (op(x, y)) continue;
    const up = op(x, y - 1), lf = op(x - 1, y), dn = op(x, y + 1), rt = op(x + 1, y);
    if (!up && !lf && !dn && !rt) continue;
    const j = (y * w + x) * 4;
    if ((dn || rt) && !up && !lf) {                     // lado iluminado
      const n = dn ? ((y + 1) * w + x) * 4 : (y * w + x + 1) * 4;
      o[j] = a[n] * 0.3 + 12; o[j + 1] = a[n + 1] * 0.24 + 6; o[j + 2] = a[n + 2] * 0.32 + 22;
    } else { o[j] = ink[0]; o[j + 1] = ink[1]; o[j + 2] = ink[2]; }
    o[j + 3] = 255;
  }
  g.putImageData(new ImageData(o, w, h), 0, 0);
  return c;
}

class PX {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); this.ids = new Uint8Array(w * h); this.layer = 0; this.subs = null; this.sub = 0; }
  px(x, y, hex) {
    if (this.mute) return;                     // camada desligada (exportação por camadas)
    x = Math.round(x); y = Math.round(y);
    if (this.xf) { const f = this.xf; x = Math.round(f.ax + (x - f.ax) * f.s); y = Math.round(f.ay + (y - f.ay) * f.s); }
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    if (this.clip && !this.clip(x, y)) return; // recorte da camada (cabelo debaixo do chapéu)
    this.ids[y * this.w + x] = this.layer;     // de qual camada é o pixel (traço de contato entre camadas)
    if (this.subs || this.sub) (this.subs || (this.subs = new Uint8Array(this.w * this.h)))[y * this.w + x] = this.sub;
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
    if (this.mute) return;
    if (this.vol && !o.flat) return this.paintVol(M, base, hi, lo, dep, o);
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
  toCanvas() {
    const c = mk(this.w, this.h);
    c.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
    return c;
  }
}

const _volOffs = {};
function volOffs(r) {
  if (_volOffs[r]) return _volOffs[r];
  const l = [];
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x || y) l.push([x, y, Math.hypot(x, y)]);
  l.sort((a, b) => a[2] - b[2]);
  return (_volOffs[r] = new Float32Array(l.flat()));
}
// Sombras com matiz frio (roxo/azul) e luzes quentes: dá o ar "pintado" dos sprites de referência
// (a sombra escurece mais o verde que o vermelho e o azul: fica saturada e puxada para o roxo, sem acinzentar a pele)
const toneLo = (hex, a = 0.3) => {
  const k = KEYMODE && keyOf(hex);
  if (k) return keyHex(k.h, k.v * (1 - a));
  const c = C(hex);
  return mix(rgbToHex(c[0] * (1 - a * 0.88), c[1] * (1 - Math.min(1, a * 1.08)), c[2] * (1 - a * 0.9)), '#2a1a5a', Math.min(0.4, a * 0.34));
};
const toneHi = (hex, a = 0.3) => { const k = KEYMODE && keyOf(hex); return k ? keyHex(k.h, k.v + (1 - k.v) * Math.min(1, a * KEY_HI)) : mix(shade(hex, a * 0.85), '#fff3c4', Math.min(0.4, a * 0.4)); };

// ---------- Paleta-chave ----------
// Nas folhas PNG, as partes que o jogador pinta usam cores-chave: matiz fixo por canal, saturação 100%,
// e o brilho diz o tom (0.7 = cor escolhida; mais escuro = sombra; mais claro = luz). Ver sprites/LEIA-ME.md.
const KEY_BASE = 0.7, KEY_HI = 1.6;
const KEY_CH = [
  ['skin', 0, 'Pele'], ['hairColor', 27, 'Cabelo'], ['primary', 54, 'Roupa (principal)'], ['secondary', 81, 'Roupa (secundária)'],
  ['accent', 108, 'Destaque'], ['weaponColor', 135, 'Metal da arma'], ['headColor', 162, 'Chapéu/elmo'], ['capeColor', 189, 'Capa'],
  ['accColor', 216, 'Acessório'], ['eyes', 243, 'Olhos'], ['armor', 270, 'Armadura (da roupa principal)'], ['vest', 297, 'Camisa do colete (da pele)'], ['cheek', 324, 'Bochecha (da pele)'],
];
const KEY_HUE = Object.fromEntries(KEY_CH.map(([k, h]) => [k, h]));
function keyHex(h, v) {
  v = clamp(v, 0.1, 1); const f = (n) => { const k = (n + h / 60) % 6; return v - v * Math.max(0, Math.min(k, 4 - k, 1)); };
  return rgbToHex(f(5) * 255, f(3) * 255, f(1) * 255);
}
// cor -> { canal, h, v } se for cor-chave (saturação ~100% e matiz de um canal)
function keyRGB(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx < 22 || mn > mx * 0.06 + 2) return null;
  const d = mx - mn; let h;
  if (mx === r) h = ((g - b) / d) * 60; else if (mx === g) h = ((b - r) / d + 2) * 60; else h = ((r - g) / d + 4) * 60;
  h = (h + 360) % 360;
  for (let i = 0; i < KEY_CH.length; i++) { let dh = Math.abs(h - KEY_CH[i][1]); dh = Math.min(dh, 360 - dh); if (dh <= 9) return { i, h: KEY_CH[i][1], v: mx / 255 }; }
  return null;
}
function keyOf(hex) { if (typeof hex !== 'string' || hex[0] !== '#') return null; const c = C(hex); return keyRGB(c[0], c[1], c[2]); }
// cores derivadas (antes calculadas com mix): continuam seguindo as escolhas do jogador
const ARMOR_OF = ch => mix(ch.primary, '#b4bcc8', 0.22), VEST_OF = ch => mix(ch.skin, '#f4efe0', 0.6), CHEEK_OF = ch => mix(ch.skin, '#ff7a8a', 0.4);
const ACC_OF = ch => ch.accColor || (ch.acc === 5 ? ch.secondary : ch.acc === 3 ? ch.accent : ch.acc === 1 ? '#14101a' : '#16121c');
// teste "ponto dentro do polígono" (para compor formas: polígono menos elipse etc.)
const polyTest = pts => (x, y) => {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins;
  }
  return ins;
};
const rampAt = (ramp, v) => ramp[clamp(Math.floor(v * ramp.length), 0, ramp.length - 1)];
// ruído de valor periódico (tiles sem emendas visíveis)
function pn(x, y, cell, per, seed) {
  const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
  const h = (i, j) => hash2(((i % per) + per) % per, ((j % per) + per) % per, seed);
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(h(x0, y0), h(x0 + 1, y0), sx), lerp(h(x0, y0 + 1), h(x0 + 1, y0 + 1), sx), sy);
}
Object.assign(PX.prototype, {
  // Sombreamento por volume (heróis, g.vol): cada forma é tratada como um relevo arredondado (a altura cresce da
  // borda para dentro, até o raio o.round) iluminado de cima-esquerda. O ângulo da superfície com a luz vira 5 tons:
  // brilho (o.spec), luz, base, sombra e sombra funda na borda. Formas finas viram cilindros; redondas, esferas.
  // o.soft = sombra mais leve (rosto) · depth 0 = chapado.
  paintVol(M, base, hi, lo, dep, o) {
    const { m, x0, y0, w, h } = M;
    if (!dep) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) this.px(x0 + x, y0 + y, base); return; }
    const R = o.round || dep + 1.2, offs = volOffs(Math.ceil(R) + 1), W = w + 2, z = new Float32Array(W * (h + 2));
    const lo2 = o.lo2 || toneLo(lo, 0.34), spec = o.spec;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      let d = R + 1;
      for (let k = 0; k < offs.length; k += 3) { const xx = x + offs[k], yy = y + offs[k + 1]; if (xx < 0 || yy < 0 || xx >= w || yy >= h || !m[yy * w + xx]) { d = offs[k + 2]; break; } }
      const u = Math.min(1, (d - 0.5) / R);
      z[(y + 1) * W + x + 1] = R * Math.sqrt(1 - (1 - u) * (1 - u));
    }
    const tHi = o.tHi || 0.73, tLo = o.tLo !== undefined ? o.tLo : o.soft ? 0.08 : 0.4, tLo2 = o.soft ? -9 : 0.08;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      const i = (y + 1) * W + x + 1, dx = (z[i + 1] - z[i - 1]) / 2, dy = (z[i + W] - z[i - W]) / 2;
      const I = (dx * 0.5 + dy * 0.62 + 0.6) / Math.sqrt(dx * dx + dy * dy + 1);      // luz = (-0.5, -0.62, 0.6)
      this.px(x0 + x, y0 + y, spec && I >= 0.975 ? spec : I >= tHi ? hi : I <= tLo2 ? lo2 : I <= tLo ? lo : base);
    }
  },
  // traço de contato dentro da mesma camada: o que foi pintado com g.sub = 1 escurece a borda do que já estava
  // pintado (g.sub = 0) na mesma camada. Fica gravado na folha PNG (ex.: perna da frente sobre a de trás).
  contact() {
    const sb = this.subs; this.sub = 0;
    if (!sb) return;
    const w = this.w, h = this.h, d = this.d, L = this.layer, ids = this.ids, hit = [];
    const fr = (x, y) => x >= 0 && y >= 0 && x < w && y < h && sb[y * w + x] && ids[y * w + x] === L;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (sb[p] || ids[p] !== L || !d[p * 4 + 3]) continue;
      const k = fr(x - 1, y) || fr(x, y - 1) ? 0.5 : fr(x + 1, y) || fr(x, y + 1) ? 0.66 : 1;
      if (k < 1) hit.push(p, k);
    }
    for (let i = 0; i < hit.length; i += 2) { const j = hit[i] * 4; d[j] *= hit[i + 1]; d[j + 1] *= hit[i + 1]; d[j + 2] *= hit[i + 1]; }
    this.subs = null;
  },
  // linha grossa de vários trechos, com pontas redondas, sombreada como uma forma só (arco, cajado, cauda)
  path(pts, wd, base, o) {
    const r = wd / 2; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    return this.shape(x0 - r, y0 - r, x1 + r, y1 + r, (x, y) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const ax = pts[i][0], ay = pts[i][1], dx = pts[i + 1][0] - ax, dy = pts[i + 1][1] - ay, L2 = dx * dx + dy * dy || 1;
        const t = clamp(((x - ax) * dx + (y - ay) * dy) / L2, 0, 1), qx = ax + dx * t - x, qy = ay + dy * t - y;
        if (qx * qx + qy * qy <= r * r) return true;
      }
      return false;
    }, base, o);
  },
  // friso: pinta a borda de uma forma já desenhada (M) de um lado só: 'b' baixo, 't' cima, 'l' esquerda, 'r' direita
  edge(M, side, hex) {
    const { m, x0, y0, w, h } = M, dx = side === 'l' ? -1 : side === 'r' ? 1 : 0, dy = side === 't' ? -1 : side === 'b' ? 1 : 0;
    const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      // nas barras (baixo/cima) a diagonal também conta, para o friso não falhar nos trechos inclinados
      if (!at(x + dx, y + dy) || (dy && (!at(x - 1, y + dy) || !at(x + 1, y + dy)))) this.px(x0 + x, y0 + y, hex);
    }
    return M;
  },
  // sombra de forma: dentro de uma forma já pintada (M), troca o tom "from" por "to" onde test(x, y) for verdadeiro
  // (o lado de longe do peito, a parte de baixo do cabelo, a capa junto ao corpo...). Luzes e sombras de borda ficam.
  swap(M, from, to, test) {
    if (this.mute) return M;
    const a = C(from), b = C(to), { m, x0, y0, w, h } = M, d = this.d;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = x0 + x, Y = y0 + y;
      if (!m[y * w + x] || X < 0 || Y < 0 || X >= this.w || Y >= this.h) continue;
      const i = (Y * this.w + X) * 4;
      if (d[i + 3] && d[i] === a[0] && d[i + 1] === a[1] && d[i + 2] === a[2] && (!test || test(X, Y))) { d[i] = b[0]; d[i + 1] = b[1]; d[i + 2] = b[2]; }
    }
    return M;
  },
  clear(x, y) { if (this.mute) return; x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[(y * this.w + x) * 4 + 3] = 0; },
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
// Heróis em 3/4 virados para a direita, proporção "chibi" (cabeça grande, ~2,7 cabeças de altura), no estilo da folha de
// referência das classes: o lado de PERTO do corpo fica à esquerda (braço e perna "da frente", desenhados por cima) e o
// lado de LONGE à direita (braço e perna "de trás"). O guerreiro leva a espada na mão de perto e o escudo na de longe;
// o mago, o cajado na mão de perto; o arqueiro, o arco na mão de longe (a de perto puxa a corda).
const CW = 96, CH = 96, CX = 48, FEET = 92;
const TORSO_H = 15, LEG_HS = [15, 17, 19], ARM_LEN = 8, TORSO_W = [12, 14, 16];
const HAIR_LAYERS = new Set(['cabelo_tras', 'cabelo_frente']);
// chapéus que escondem o cabelo: 1 = só o que fica acima da aba · 2 = também o volume atrás da cabeça (elmo, capuz)
const HAT_COVERS = { 1: 1, 2: 2, 7: 2 };
const POSES = { idle: 5, run: 8, jump: 3, land: 1, crouch: 5, atk: 4, cast: 3, block: 1, hurt: 1, dash: 1, roll: 4, flip: 4, glide: 2, flap: 4, aim: 12, lift: 4 };
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

// Esqueleto de cada pose, em pixels da célula. legF/armF = perna/braço de perto (esquerda); legB/armB = de longe (direita).
// Pernas: [avanço do pé a partir do quadril, altura do pé]. Braços: mão relativa ao ombro.
// wAng = ângulo da arma (0 = para baixo, 90 = para a frente, 180 = para cima) · shield: 1 = escudo à frente, 2 = erguido
// aim = direção do arco · pull = corda puxada · flow = vento na capa e no cabelo · wing = abertura das asas
function skeletonFor(pose, f, cls, ang) {
  const war = cls === 'guerreiro', mage = cls === 'mago', arc = cls === 'arqueiro', drg = cls === 'dragonico';
  const S = { bob: 0, lean: 0, sq: 0, hdy: 0, flow: 0, legF: [-4, 0], legB: [4, 0], armF: [-2, 13], armB: [3, 13], wAng: war ? -52 : 160, wShow: true, eyes: 0, mouth: 0, wing: 0, bendMax: 3, shield: 0, aim: null, pull: 0 };
  const rad = Math.PI / 180;
  // guarda: como cada classe segura a arma quando não está atacando
  const guard = () => {
    if (war) { S.armF = [-3, 12]; S.wAng = -52; S.armB = [4, 10]; S.shield = 1; }
    else if (mage) { S.armF = [12, 10]; S.wAng = 146; }
    else if (arc) { S.armB = [5, 12]; S.aim = { dx: 0.97, dy: 0.26 }; }
  };
  switch (pose) {
    case 'idle': {
      guard();
      S.bob = [0, 0, 1, 1, 0][f]; S.flow = [0, 0.6, 1, 0.6, 0][f]; if (f === 4) S.eyes = 1;   // quadro 4: piscada
      break;
    }
    case 'run': {
      const ph = f / 8 * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph), up = Math.abs(s);
      S.bob = up > 0.55 ? 2 : 0; S.lean = 4; S.flow = 3; S.bendMax = 5;
      S.legF = [Math.round(9 * s), Math.round(Math.max(0, c) * 6)];
      S.legB = [Math.round(-9 * s), Math.round(Math.max(0, -c) * 6)];
      // cotovelos dobrados, braços no contratempo das pernas
      S.armF = [-1 - s * 6, 10 - up * 2]; S.armB = [1 + s * 6, 10 - up * 2];
      if (war) { S.armF = [-5 - s * 2, 9]; S.wAng = -72 - s * 5; S.armB = [3 + s * 3, 10]; }   // espada para trás
      else if (mage) { S.armF = [11, 8 + s]; S.wAng = 140; }
      else if (arc) { S.armB = [6 + s * 2, 10]; S.aim = { dx: 0.9, dy: 0.44 }; }
      break;
    }
    case 'jump': {
      guard(); S.flow = f === 2 ? 4.5 : 3.5; S.bendMax = 5;
      if (f === 0) { S.bob = -2; S.legF = [-5, 2]; S.legB = [4, 8]; S.armF = [-7, 7]; S.armB = [8, 0]; }
      else if (f === 1) { S.legF = [-5, 5]; S.legB = [5, 6]; S.armF = [-8, 4]; S.armB = [8, 3]; }
      else { S.legF = [-3, 1]; S.legB = [6, 5]; S.armF = [-7, -2]; S.armB = [8, -3]; }
      if (war) { S.armF = f === 2 ? [-6, -3] : [-6, 8]; S.wAng = f === 2 ? -140 : -78; S.armB = [5, 8]; }
      else if (mage) { S.armF = [11, 8 - f]; S.wAng = 142; }
      else if (arc) { S.armB = [6, 9]; S.aim = { dx: 0.9, dy: 0.44 }; }
      S.wing = f === 2 ? 1 : drg && f === 0 ? 4 : 0;                     // dragônico subindo: asas recém-batidas para baixo
      break;
    }
    case 'glide':   // planando: asas esticadas e paradas (o quadro 1 só sobe o corpo 1 px, como se flutuasse no ar)
      S.legF = [-9, 4]; S.legB = [-6, 7]; S.armF = [-8, 8]; S.armB = [9, 5]; S.lean = 3; S.flow = f ? 3.5 : 4; S.bob = f ? -1 : 0; S.wing = 3; S.bendMax = 5; break;
    case 'flap':    // pulo duplo do dragônico: ergue as asas e bate com força para baixo
      S.flow = 4; S.bendMax = 5; S.lean = 1;
      S.legF = [-5, f >= 2 ? 3 : 6]; S.legB = [5, f >= 2 ? 5 : 8]; S.armF = [-7, f >= 2 ? 9 : 4]; S.armB = [8, f >= 2 ? 8 : 2];
      S.bob = [0, -1, -2, -2][f]; S.wing = [2, 3, 4, 4][f]; break;
    case 'land':
      guard(); S.sq = 4; S.legF = [-6, 0]; S.legB = [6, 0]; S.lean = 2; S.bendMax = 5;
      if (!war && !mage) S.armF = [-8, 9];
      if (!war && !arc) S.armB = [8, 9];
      break;
    case 'crouch': {   // quadro 0 parado; 1-4 andando agachado (passinhos curtos)
      guard(); S.sq = 9; S.hdy = 2; S.lean = 4; S.legF = [-6, 0]; S.legB = [8, 0]; S.bendMax = 6;
      if (!war && !mage) S.armF = [1, 9];
      if (!war && !arc) S.armB = [5, 9];
      if (war) { S.armF = [-4, 9]; S.wAng = -66; S.armB = [5, 8]; } else if (mage) { S.armF = [11, 6]; S.wAng = 148; } else if (arc) S.armB = [6, 9];
      if (f > 0) {
        const ph = (f - 1) / 4 * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph);
        S.legF = [Math.round(-5 + 4 * s), Math.round(Math.max(0, c) * 3)]; S.legB = [Math.round(7 - 4 * s), Math.round(Math.max(0, -c) * 3)];
        S.bob = Math.abs(s) > 0.7 ? 1 : 0; S.flow = 1.5;
      }
      break;
    }
    case 'hurt':
      S.lean = -4; S.bob = -2; S.hdy = 1; S.legF = [-7, 0]; S.legB = [5, 2]; S.armF = [-8, -3]; S.armB = [7, -5]; S.flow = 3; S.eyes = 1; S.mouth = 1; S.bendMax = 5;
      if (war) S.wAng = -125; else if (mage) S.wAng = 200; else if (arc) { S.armB = [8, 7]; S.aim = { dx: 0.8, dy: 0.6 }; }
      break;
    case 'block':
      guard(); S.lean = 1; S.bob = 1; S.legF = [-6, 0]; S.legB = [6, 0]; S.armB = [8, 4]; S.armF = [-4, 11]; S.wAng = -40; S.shield = 2; break;
    case 'dash':
      if (drg) { S.lean = 5; S.hdy = 3; S.legF = [-9, 3]; S.legB = [-6, 6]; S.armF = [-9, -1]; S.armB = [-5, -4]; S.flow = 5; S.wing = 1; S.mouth = 3; S.bendMax = 5; }
      else { guard(); S.lean = 6; S.bob = 2; S.legF = [-10, 2]; S.legB = [9, 0]; S.flow = 5; if (war) { S.armF = [13, 3]; S.wAng = 95; S.shield = 0; S.armB = [-4, 8]; } else if (!mage) S.armF = [-8, 6]; }
      break;
    case 'atk':
      if (drg) { // garras
        S.flow = 4; S.bendMax = 4;
        if (f === 0) { S.lean = 4; S.legF = [-6, 0]; S.legB = [7, 0]; S.armF = [13, 2]; S.armB = [-2, 9]; }
        else if (f === 1) { S.lean = 4; S.legF = [-7, 0]; S.legB = [6, 0]; S.armF = [-4, 8]; S.armB = [12, 1]; }
        else if (f === 2) { S.lean = 5; S.bob = 2; S.legF = [-8, 1]; S.legB = [8, 0]; S.armF = [12, -5]; S.armB = [10, -7]; S.mouth = 2; }
        else { S.lean = 2; S.armF = [6, 8]; S.armB = [4, 9]; }
      } else { // espada: preparo, descida, golpe e final
        S.armB = [-2, 10]; S.bendMax = 4;
        if (f === 0) { S.lean = -2; S.legF = [-6, 0]; S.legB = [6, 0]; S.armF = [-6, -9]; S.wAng = -150; }
        else if (f === 1) { S.lean = 2; S.legF = [-7, 0]; S.legB = [7, 0]; S.armF = [8, -10]; S.wAng = 148; S.flow = 2; }
        else if (f === 2) { S.lean = 4; S.bob = 2; S.legF = [-8, 0]; S.legB = [9, 0]; S.armF = [14, 1]; S.wAng = 88; S.flow = 4; S.mouth = 2; }
        else { S.lean = 2; S.legF = [-7, 0]; S.legB = [7, 0]; S.armF = [10, 7]; S.wAng = 52; S.flow = 2; }
      }
      break;
    case 'cast':
      if (drg) { // sopro de fogo
        S.legF = [-6, 0]; S.legB = [6, 0]; S.bendMax = 5;
        if (f === 0) { S.lean = -3; S.hdy = -1; S.armF = [-5, 9]; S.armB = [5, 9]; }
        else if (f === 1) { S.lean = 4; S.hdy = 1; S.armF = [-7, 8]; S.armB = [6, 9]; S.mouth = 3; S.flow = 3; }
        else { S.lean = 3; S.armF = [-6, 9]; S.armB = [6, 10]; S.mouth = 3; S.flow = 2; }
      } else { // o corpo é o mesmo nas três classes humanas (as folhas PNG do corpo são compartilhadas); mudam braços e arma
        S.legF = [-6, 0]; S.legB = [6, 0]; S.bendMax = 4; S.lean = [-2, 4, 2][f]; S.flow = [0, 3, 1][f]; S.mouth = f === 1 ? 2 : 0;
        if (arc) { S.aim = { dx: 1, dy: 0 }; S.pull = f === 0 ? 1 : 0; }                    // tiro: corda puxada e depois solta
        else if (mage) { S.armF = [[14, -3], [14, -2], [12, 3]][f]; S.wAng = [152, 118, 140][f]; }
        else { S.armB = [5, 8]; S.armF = [[-5, -8], [14, -1], [10, 6]][f]; S.wAng = 100; S.wShow = f === 0; }   // guerreiro: arremesso da lança
      }
      break;
    case 'aim': {
      const a = ang * rad, dx = Math.cos(a), dy = Math.sin(a);
      S.lean = 1; S.legF = [-6, 0]; S.legB = [6, 0]; S.aim = { dx, dy }; S.pull = 1;
      S.hdy = dy > 0.5 ? 1 : dy < -0.7 ? -1 : 0; S.flow = 1;
      break;
    }
    case 'lift': { // academia da tela de evolução: sentado no banco, rosca com halteres (0 embaixo · 1 subindo · 2 em cima · 3 descendo)
      const up = [0, 0.5, 1, 0.5][f];
      S.sit = 10; S.wShow = false; S.shield = 0; S.bendMax = 7; S.legF = [9, 0]; S.legB = [12, 0];
      S.armF = [Math.round(3 + up * 3), Math.round(12 - up * 13)]; S.armB = [Math.round(5 + up * 3), Math.round(12 - up * 13)];
      S.mouth = f === 2 ? 2 : 0; S.eyes = f === 2 ? 1 : 0; S.bob = f === 2 ? 1 : 0;
      break;
    }
    case 'tuck': // bola de rolamento / pulo duplo
      S.bob = 8; S.hdy = 5; S.lean = -2; S.legF = [3, 12]; S.legB = [7, 12]; S.armF = [9, 9]; S.armB = [3, 10]; S.wShow = false; S.flow = 0; S.bendMax = 6; break;
  }
  return S;
}

// Medidas do quadro: de onde saem cabeça, tronco e quadril (usado pelo desenho por código e pela montagem das folhas PNG)
function heroFrame(ch, pose, f) {
  const S = skeletonFor(pose, f, ch.cls, pose === 'aim' ? aimDeg(f) : 0);
  if (S.sit) S.sq = LEG_HS[ch.height | 0] - S.sit;                 // sentado: o quadril fica na altura do banco, qualquer que seja a perna
  const legH = LEG_HS[ch.height | 0], hipY = FEET - legH + S.sq, torsoTop = hipY - TORSO_H + S.bob;
  const bx = Math.round(CX + S.lean * 0.5), hx0 = Math.round(CX - 10 + S.lean), hy = Math.round(torsoTop - 18 + S.hdy);
  return { S, legH, hipY, torsoTop, bx, hx0, hy, hcx: hx0 + 11 };
}
// região onde o cabelo pode aparecer quando há um chapéu que o cobre (ver HAT_COVERS)
function hairClip(mode, hx0, hy) {
  return mode === 1 ? (x, y) => y >= hy + 3 : (x, y) => y >= hy + 3 && (x >= hx0 - 4 || y >= hy + 15);
}

// -------- peças reutilizáveis --------
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

// lâmina dos heróis: metade clara / metade escura, fio de luz e brilho perto da ponta
function heroBlade(g, x, y, angDeg, len, wd, col, hilt, guard) {
  const a = angDeg * Math.PI / 180, dx = Math.sin(a), dy = Math.cos(a), px = -dy, py = dx, hw = wd / 2;
  const P = (t, s) => [x + dx * t + px * s, y + dy * t + py * s];
  const up = py < 0 || (py === 0 && px < 0) ? 1 : -1;                 // lado da lâmina virado para a luz
  const L = toneHi(col, 0.5), D = toneLo(col, 0.34), DD = toneLo(col, 0.6);
  g.poly([P(1, hw), P(len - hw * 1.6, hw), P(len, 0), P(len - hw * 1.6, -hw), P(1, -hw)], col, { flat: true });
  g.poly([P(1, 0), P(len, 0), P(len - hw * 1.6, -hw * up), P(1, -hw * up)], D, { flat: true });       // metade na sombra
  g.poly([P(1, hw * up), P(len - hw * 1.6, hw * up), P(len - hw * 0.8, hw * up * 0.5), P(1, hw * up * 0.5)], L, { flat: true });   // fio iluminado
  g.line(...P(3, 0), ...P(len - 2, 0), DD);                                                               // sulco central
  g.line(...P(len * 0.55, hw * up * 0.5), ...P(len * 0.8, hw * up * 0.5), '#ffffff');                 // brilho
  // guarda, empunhadura e pomo
  const gd = toneLo(guard, 0.4), gl = toneHi(guard, 0.5);
  g.poly([P(-1.5, hw * 2.4), P(1.5, hw * 2.4), P(1.5, -hw * 2.4), P(-1.5, -hw * 2.4)], guard, { depth: 1, round: 1.5, hi: gl, lo: gd });
  g.cap(...P(-2, 0), ...P(-6.5, 0), 3.2, hilt, { depth: 1, round: 1.6 });
  g.ell(...P(-8, 0), 1.9, 1.9, gd, { depth: 1, round: 1.9, hi: guard, lo: toneLo(gd, 0.3) });
}

// o.only = desenha só uma camada (exportação das folhas PNG) · o.raw = sem contorno
function drawChar(ch, pose, f, o = {}) {
  if (pose === 'roll' || pose === 'flip') {
    const base = drawChar(ch, 'tuck', 0, o);
    return o.raw ? base : rotated(base, pose === 'roll' ? f : -f, CX, FEET - 24);
  }
  const on = s => !o.only || o.only === s;
  const cls = ch.cls, war = cls === 'guerreiro', mage = cls === 'mago', arc = cls === 'arqueiro', drag = cls === 'dragonico';
  const FR = heroFrame(ch, pose, f), S = FR.S, { legH, hipY, bx, hx0, hy, hcx } = FR, T = FR.torsoTop;
  const fem = ch.body === 1, bld = ch.build | 0, out = ch.outfit | 0;

  const g = new PX(CW, CH); g.vol = true;                                                  // sombreamento por volume
  const RG = typeof rigFor === 'function' ? rigFor(g, ch, S) : null;                       // rig de recortes (?rig, js/rig.js)
  const cover = HAT_COVERS[ch.head] || 0, hclip = cover && !KEYMODE ? hairClip(cover, hx0, hy) : null;
  // troca de camada; no rig, a peça presa à cabeça/tronco é desenhada aqui e o desenho por código dessa camada fica mudo
  const lay = s => {
    g.mute = !on(s); g.layer = LAYER_ORDER.indexOf(s) + 1; g.sub = 0;
    g.clip = HAIR_LAYERS.has(s) ? hclip : null;
    if (RG && on(s) && RG.has(s) && RG.slot(s, [hcx, hy], [bx, T])) g.mute = true;
  };
  if (o.info) Object.assign(o.info, { head: [hcx, hy], body: [bx, T] });                   // âncoras (moldes do rig)

  // ---------- cores: cada uma em brilho (S), luz (L), base, sombra (D) ----------
  const skin = ch.skin, skinD = toneLo(skin, 0.26), skinL = toneHi(skin, 0.2), skinDD = toneLo(skin, 0.46);
  const pri = ch.primary, priD = toneLo(pri, 0.36), priL = toneHi(pri, 0.3), priS = toneHi(pri, 0.62);
  const sec = ch.secondary, secD = toneLo(sec, 0.36), secL = toneHi(sec, 0.3);
  const hair = ch.hairColor, hairD = toneLo(hair, 0.4), hairL = toneHi(hair, 0.34), hairLL = toneHi(hair, 0.62);
  const metal = ch.weaponColor, acc = ch.accent, accL = toneHi(acc, 0.5), accD = toneLo(acc, 0.38);
  const wood = '#8a5a2b', woodD = '#553319', woodL = '#b98447', gold = '#eab83c', goldD = '#a86f22', goldL = '#fff0a0';
  const lash = '#1a0f22', pupil = '#120a1a', mouthC = '#7a2a2a', bone = '#e9d9b0', boneD = '#a08a5c', boneL = '#fff7dc';
  const ax = KEYMODE ? keyHex(KEY_HUE.accColor, KEY_BASE) : ACC_OF(ch), axD = toneLo(ax, 0.36), axL = toneHi(ax, 0.3);
  const armorC = KEYMODE ? keyHex(KEY_HUE.armor, KEY_BASE) : ARMOR_OF(ch), vestC = KEYMODE ? keyHex(KEY_HUE.vest, KEY_BASE) : VEST_OF(ch), cheekC = KEYMODE ? keyHex(KEY_HUE.cheek, KEY_BASE) : CHEEK_OF(ch);
  const aL = toneHi(armorC, 0.42), aD = toneLo(armorC, 0.4), aS = toneHi(armorC, 0.8), mail = toneLo(armorC, 0.56);

  // ---------- medidas ----------
  const sh = TORSO_W[bld] / 2 - (fem ? 0.5 : 0), wa = sh - (fem ? 2.5 : 1.5), hp = sh - (fem ? 0.5 : 1);
  const lw = [5.4, 6, 7][bld], aw = [4.4, 5, 5.8][bld];
  const feet = FEET, vfeet = hipY - S.sq + LEG_HS[2];          // "chão" das peças da cintura para cima (folhas na altura Alto)
  const fc = bx + 2;                                           // linha do meio do peito (corpo em 3/4)
  const flow = S.flow, sway = Math.round(flow * 0.8);
  const shN = { x: bx - 7, y: T + 3 }, shF = { x: bx + 6, y: T + 3 }, wy = hipY - 6;   // wy = linha da cintura
  const hipN = { x: bx - 3, y: hipY - 1 }, hipF = { x: bx + 3, y: hipY - 1 }, LL = (legH - 3) / 2 + 1.4;
  const footN = { x: hipN.x + S.legF[0], y: feet - 4 - S.legF[1] }, footF = { x: hipF.x + S.legB[0], y: feet - 4 - S.legB[1] };
  const HP = pts => pts.map(p => [hx0 + p[0], hy + p[1]]);     // coordenadas locais da cabeça -> célula
  const dirOf = a => ({ x: Math.sin(a * Math.PI / 180), y: Math.cos(a * Math.PI / 180) });

  // braços (cinemática inversa). Mirando: a mão de longe segura o arco e a de perto puxa a corda até o rosto
  const aimD = S.aim || { dx: 1, dy: 0 }, drawn = arc && S.pull > 0;
  let aB, aF, pullPt = null;
  if (arc && (pose === 'aim' || pose === 'cast')) {
    const bh = { x: shF.x + aimD.dx * 14.5, y: shF.y + aimD.dy * 14.5 };
    aB = ik(shF.x, shF.y, bh.x, bh.y, ARM_LEN, ARM_LEN, 1, 1.2);
    pullPt = { x: bh.x - aimD.dx * (drawn ? 16 : 6), y: bh.y - aimD.dy * (drawn ? 16 : 6) };
    aF = ik(shN.x, shN.y, pullPt.x, pullPt.y, ARM_LEN, ARM_LEN, 1, 6);
  } else {
    aB = ik(shF.x, shF.y, shF.x + S.armB[0], shF.y + S.armB[1], ARM_LEN, ARM_LEN, 1, S.bendMax);
    aF = ik(shN.x, shN.y, shN.x + S.armF[0], shN.y + S.armF[1], ARM_LEN, ARM_LEN, 1, S.bendMax);
  }

  // ---------- asas e cauda do dragônico (atrás de tudo) ----------
  lay('asas');
  if (drag) {
    const sp = S.wing | 0, wm = toneLo(acc, 0.1);
    // asa de morcego: braço da raiz até o punho (com garra) e três dedos que abrem a membrana em arcos
    // formas (em relação à raiz, antes da escala): punho e as pontas dos três dedos
    // e onde a membrana volta às costas (base; sem ela, desce até a cintura)
    // 0 recolhida · 1 entreaberta · 2 erguida (início da batida) · 3 planando (grande, reta, na horizontal)
    // 4 batida forte (jogada para baixo) · 5 asa de longe planando (aberta para o outro lado, também reta)
    const WING_SHAPES = [
      [[-7, -13], [[-20, -5], [-17, 8], [-9, 14]]],
      [[-8.8, -13.75], [[-24, -6.8], [-21, 6.4], [-12.6, 12.6]]],
      [[-9, -21], [[-19, -31], [-26, -20], [-20, -7]]],
      [[-14, -6], [[-31, -8], [-29, 1], [-20, 7]], [-1, 10]],
      [[-16, 0], [[-29, 9], [-25, 19], [-14, 19]]],
      [[-13, -7], [[-30, -9], [-28, 0], [-19, 6]], [0, 9]],
    ];
    const wing = (rx, ry, k, dir, dim, shape = sp) => {
      const [w0, fs, b0 = [1, 13]] = WING_SHAPES[shape];
      const W = [rx + w0[0] * k * dir, ry + w0[1] * k];
      const F = fs.map(([x, y]) => [rx + x * k * dir, ry + y * k]);
      const base = [rx + b0[0] * k * dir, ry + b0[1] * k];
      const sc = (A, B, t) => [(A[0] + B[0]) / 2 + (W[0] - (A[0] + B[0]) / 2) * t, (A[1] + B[1]) / 2 + (W[1] - (A[1] + B[1]) / 2) * t];
      const col = dim ? toneLo(wm, 0.3) : wm;
      const WM = g.poly([[rx, ry], [W[0] + 2 * dir, W[1] + 1], [W[0] - dir, W[1] - 3], [W[0] - 3 * dir, W[1] + 1], F[0], sc(F[0], F[1], 0.4), F[1], sc(F[1], F[2], 0.4), F[2], sc(F[2], base, 0.3), base],
        col, { hi: toneHi(col, 0.2), lo: toneLo(col, 0.4), round: 6 });
      const rib = toneLo(col, 0.5);
      g.swap(WM, col, toneLo(col, 0.2), (x, y) => Math.hypot(x - rx, y - ry) < 15 * k);            // junto às costas, na sombra
      for (const p of F.slice(1)) g.line(W[0], W[1] - 1, p[0], p[1] - 1, toneHi(col, 0.2));       // relevo: luz ao lado de cada nervura
      for (const p of F) g.line(W[0], W[1], p[0], p[1], rib);
      g.path([[rx, ry], W, F[0]], 2.2, dim ? toneLo(acc, 0.3) : toneHi(acc, 0.18), { depth: 1, round: 1.1 });
      g.px(W[0] - dir, W[1] - 3, bone); g.px(W[0] - dir, W[1] - 2, boneD);
    };
    if (sp === 3) wing(bx + 4, T + 3, 1.25, -1, true, 5);                 // planando: abertas para os dois lados, retas
    else if (S.lean >= 3 || sp >= 2) wing(bx + 2, T + 1, 1.25, 1, true);  // em movimento: as duas asas para trás
    else wing(bx + 4, T + 4, 1.2, -1, true);                              // parado: a asa de longe aparece do outro lado
    wing(bx - 3, T + 4, sp === 3 ? 1.5 : 1.45, 1, false);
    // cauda fina com ponta de seta
    const ts = Math.round(Math.sin(f * 1.3 + (pose === 'run' ? f : 0)) * 1.5), tc = toneLo(acc, 0.3);
    const tx = bx - 19 - sway, ty = hipY + 5 + ts;
    g.path([[bx - 2, hipY - 2], [bx - 9, hipY + 4], [bx - 14 - sway * 0.5, hipY + 8 + ts], [tx, ty]], 3, tc, { depth: 1, round: 1.5, hi: toneHi(tc, 0.3), lo: toneLo(tc, 0.4) });
    g.poly([[tx + 1, ty - 3], [tx - 6, ty - 3], [tx - 1, ty + 3]], toneLo(acc, 0.05), { depth: 1, round: 1.5 });
  }

  // ---------- capa ----------
  lay('capa');
  if (ch.cape) {
    const sh = TORSO_W[bld] / 2, cc = ch.capeColor, ccD = toneLo(cc, 0.38), ccL = toneHi(cc, 0.26);
    const len = Math.min(vfeet - 3 - T, ch.cape === 1 ? 21 : TORSO_H + LEG_HS[2] - 6), off = Math.round(flow * 2.2), lift = Math.round(flow * 1.2);
    const rp = Math.round(Math.sin(f * 1.1 + (pose === 'run' ? 1 : 0)) * (1 + flow * 0.6));
    const y1 = T + len - lift;
    const M = g.poly([[bx - sh, T + 1], [bx + sh - 1, T + 1], [bx + sh - off * 0.4, T + len * 0.5], [bx + sh - 1 - off, y1 - 2], [bx + 2 - off + rp, y1 + 1], [bx - 3 - off, y1 - 2 + rp], [bx - sh - 3 - off, y1 + 2], [bx - sh - 9 - off * 1.2, y1 - 2 - rp], [bx - sh - 5 - off * 0.6, T + len * 0.5], [bx - sh - 2, T + 5]],
      cc, { hi: ccL, lo: ccD, round: 4 });
    for (const k of [0.2, 0.55, 0.85]) g.line(bx - sh + 2 + k * (sh * 2 - 4), T + 7, bx - sh - 4 - off + k * (sh * 2 + 3), y1 - 4, k === 0.55 ? toneLo(cc, 0.56) : ccD);   // dobras
    for (const k of [0.2, 0.85]) g.line(bx - sh + 1 + k * (sh * 2 - 4), T + 7, bx - sh - 5 - off + k * (sh * 2 + 3), y1 - 4, ccL);
    g.swap(M, cc, toneLo(cc, 0.2), (x, y) => x > bx - sh - off * 0.6 + (y - T) * 0.1);       // junto ao corpo fica na sombra
    g.edge(M, 'b', toneLo(cc, 0.5));
  }

  // ---------- cabelo traseiro ----------
  lay('cabelo_tras');
  {
    const tr = Math.round(flow * 1.4), wv = pose === 'idle' ? [0, 1, 1, 0, 0][f] : pose === 'run' ? Math.round(Math.sin(f * 1.6) * 1.5) : 0;
    const hb = toneLo(hair, 0.16), hbO = { hi: toneHi(hair, 0.12), lo: toneLo(hair, 0.52), round: 3.4 };
    switch (ch.hair) {
      case 1: g.poly(HP([[4, 8], [-3 - tr * 0.4, 11], [-7 - tr, 16 + wv], [-3 - tr * 0.5, 16], [-5 - tr, 21 + wv], [1, 19], [6, 14]]), hb, hbO); break;
      case 2: g.poly(HP([[4, 8], [-4 - tr * 0.4, 11], [-9 - tr, 17 + wv], [-4 - tr * 0.5, 17], [-8 - tr, 23 + wv], [-2 - tr * 0.4, 21], [-3 - tr * 0.6, 26 + wv], [3, 21], [7, 14]]), hb, hbO); break;
      case 3: {
        const M = g.poly(HP([[5, 3], [-3, 8], [-6 - tr * 0.3, 16], [-5 - tr * 0.6, 24], [-8 - tr, 31 + wv], [-5 - tr, 37], [-7 - tr * 1.1, 41 + wv], [-1 - tr * 0.8, 39], [2 - tr * 0.6, 42 + wv], [5 - tr * 0.4, 36], [9, 30], [11, 16]]), hb, hbO);
        for (const [x0, y0, x1, y1] of [[-2, 12, -3 - tr * 0.7, 34], [2, 14, 1 - tr * 0.6, 37]]) g.line(hx0 + x0, hy + y0, hx0 + x1, hy + y1 + wv, toneLo(hair, 0.5));
        g.edge(M, 'l', hair);
        break;
      }
      case 4: g.ell(hx0 - 1, hy + 2, 5.6, 5.6, hair, { hi: hairL, lo: hairD, round: 5.6, spec: hairLL }); g.rect(hx0 + 2, hy + 1, 2, 4, hairD); break;
      case 6: {
        g.poly(HP([[3, 0], [-3, -4], [-9 - tr * 0.5, -3], [-13 - tr, 4 + wv], [-13 - tr * 1.2, 13 + wv], [-10 - tr * 1.3, 21 + wv], [-13 - tr * 1.5, 27 + wv], [-7 - tr * 1.2, 24 + wv], [-6 - tr, 15], [-5 - tr * 0.5, 7], [2, 7]]), hair, { hi: hairL, lo: hairD, round: 4, spec: hairLL });
        g.line(hx0 - 9 - tr, hy + 4, hx0 - 9 - tr * 1.3, hy + 20 + wv, hairD);
        break;
      }
      case 7: g.ell(hcx - 2, hy + 5, 16, 14, hair, { hi: hairL, lo: hairD, round: 9, spec: hairLL }); break;
      case 8: g.poly(HP([[5, 4], [-3, 8], [-5 - tr * 0.4, 15], [-7 - tr, 22 + wv], [-3 - tr * 0.6, 21], [-2 - tr * 0.5, 25 + wv], [3, 22], [8, 17]]), hb, hbO); break;
      case 9: g.poly(HP([[4, 7], [-3, 10], [-4, 16], [0, 19], [6, 15]]), hb, hbO); break;
    }
  }

  // arco recurvo na mão de longe. Mirando, ele é desenhado atrás do corpo (fica do lado de longe da cabeça);
  // abaixado, na frente (front), com os dedos por cima da empunhadura
  const aiming = arc && (pose === 'aim' || pose === 'cast');
  const drawBow = front => {
    if (!S.wShow) return;
    const d = aimD, px = -d.dy, py = d.dx, G = { x: aB.hx, y: aB.hy }, bw = metal;
    const at = (s, fw) => [G.x + px * s + d.dx * fw, G.y + py * s + d.dy * fw];
    const bend = drawn ? 1.6 : 1, limb = sg => [at(0, 0), at(sg * 4, -0.8 * bend), at(sg * 8, -2.4 * bend), at(sg * 11, -4.2 * bend), at(sg * 13, -4.6 * bend), at(sg * 14.5, -3.4 * bend)];
    const T1 = limb(1)[5], T2 = limb(-1)[5], rest = at(0, -4.6);
    const str = pullPt && drawn ? pullPt : { x: rest[0], y: rest[1] };
    g.line(T1[0], T1[1], str.x, str.y, '#efe6cc'); g.line(T2[0], T2[1], str.x, str.y, '#efe6cc');
    g.path(limb(1), 2.4, bw, { depth: 1, round: 1.3, hi: toneHi(bw, 0.4), lo: toneLo(bw, 0.4) }); g.path(limb(-1), 2.4, bw, { depth: 1, round: 1.3, hi: toneHi(bw, 0.4), lo: toneLo(bw, 0.4) });
    g.path([at(-2, -0.3), at(2, -0.3)], 3, '#5a3524', { depth: 0, flat: true });                    // empunhadura de couro
    g.px(T1[0], T1[1], gold); g.px(T2[0], T2[1], gold);
    if (drawn) { // flecha na corda
      const tipx = G.x + d.dx * 9, tipy = G.y + d.dy * 9;
      g.line(str.x, str.y, tipx, tipy, '#d8c8a0');
      g.poly([[tipx + px * 2.2, tipy + py * 2.2], [tipx + d.dx * 6, tipy + d.dy * 6], [tipx - px * 2.2, tipy - py * 2.2]], '#eef2fa', { depth: 0, flat: true });
      g.line(str.x + px, str.y + py, str.x + d.dx * 3 + px, str.y + d.dy * 3 + py, '#f4f1ea'); g.line(str.x - px, str.y - py, str.x + d.dx * 3 - px, str.y + d.dy * 3 - py, '#e63946');
    }
    if (front) g.ell(G.x, G.y, 2.4, 2.4, toneLo(skin, 0.2), { round: 2.4, hi: skin, lo: toneLo(skin, 0.4) });   // dedos sobre a empunhadura
  };

  // ---------- equipamento nas costas ----------
  lay('costas');
  // escudo em gota: aro dourado, face de aço e a cruz na cor de destaque (o mesmo desenho vai à frente, na mão de longe)
  const shield = (x, y, k, dim) => {
    const P = pts => pts.map(p => [x + p[0] * k, y + p[1] * k]), face = toneLo(metal, dim ? 0.38 : 0.14);
    g.poly(P([[-6.5, -10], [6.5, -10], [7.5, -7], [7.5, 2], [4.5, 8], [0, 11.5], [-4.5, 8], [-7.5, 2], [-7.5, -7]]), dim ? goldD : gold, { hi: dim ? gold : goldL, lo: toneLo(goldD, dim ? 0.4 : 0.1), round: 2 });
    g.poly(P([[-5, -8], [5, -8], [5.6, 1.5], [3, 6.5], [0, 9.2], [-3, 6.5], [-5.6, 1.5]]), face, { hi: toneHi(face, 0.4), lo: toneLo(face, 0.42), round: 4 });
    if (!dim) { g.line(x - 3.5 * k, y - 6.5 * k, x - 4.5 * k, y - 1 * k, toneHi(face, 0.6)); g.px(x - 6 * k, y - 8.5 * k, goldL); g.px(x + 6 * k, y - 8.5 * k, goldD); g.px(x, y + 10 * k, goldD); }
    const cx2 = Math.round(x), cy2 = Math.round(y), ec = dim ? accD : acc;
    g.rect(cx2 - 1, cy2 - Math.round(6 * k), 2, Math.round(12 * k), ec); g.rect(cx2 - Math.round(4 * k), cy2 - Math.round(3 * k), Math.round(8 * k), 2, ec);
    if (!dim) { g.rect(cx2 - 1, cy2 - Math.round(6 * k), 1, Math.round(12 * k), accL); g.rect(cx2 - Math.round(4 * k), cy2 - Math.round(3 * k), Math.round(8 * k), 1, accL); }
  };
  if (war && !S.shield && S.wShow) shield(bx - 7, T + 10, 0.9, true);
  if (aiming) drawBow(false);
  if (arc) { // aljava atravessada nas costas, com as penas das flechas aparecendo atrás do ombro
    const lt = '#7a4a28', ltD = '#4a2a16', ltL = '#a8703c', qx = bx - 13, qy = T - 5;
    for (const [dx, dy] of [[-6, -5], [-3, -8], [0, -6]]) { g.line(qx + dx + 3, qy + 2, qx + dx, qy + dy + 3, '#d8c8a0'); g.rect(qx + dx - 1, qy + dy, 3, 3, '#f4f1ea'); g.px(qx + dx, qy + dy + 3, '#c9c2b4'); g.px(qx + dx - 1, qy + dy, '#ffffff'); }
    g.poly([[qx - 6, qy], [qx + 2, qy - 2], [qx + 10, qy + 15], [qx + 3, qy + 18]], lt, { hi: ltL, lo: ltD, round: 3 });
    g.line(qx - 5, qy + 3, qx + 3, qy + 1, gold); g.line(qx - 1, qy + 11, qx + 7, qy + 9, ltD);
  }

  // ---------- braços ----------
  // manga/armadura, antebraço, mão e a peça do ombro; back = braço de longe (tons mais escuros, peças menores)
  const drawArm = (sx, sy, a, back) => {
    const dk = c => back ? toneLo(c, 0.2) : c, sk = dk(skin), ex = a.ex, ey = a.ey;
    const Q = t => [ex + (a.hx - ex) * t, ey + (a.hy - ey) * t];
    switch (out) {
      case 0: // túnica: manga bufante da camisa e bracelete de couro
        g.cap(ex, ey, a.hx, a.hy, aw + 0.2, dk(sec), { depth: 1, round: aw / 2, hi: dk(secL), lo: dk(secD) });
        g.cap(...Q(0), ...Q(0.2), aw + 1.2, dk(secL), { depth: 0, flat: true });
        g.cap(sx, sy + 1, ex, ey, aw + 2.4, dk(vestC), { round: aw / 2 + 1.2, hi: dk(toneHi(vestC, 0.4)), lo: dk(toneLo(vestC, 0.3)) });
        break;
      case 1: // armadura: malha no braço, cotoveleira e braçal
        g.cap(sx, sy, ex, ey, aw + 0.4, dk(mail), { depth: 1, round: aw / 2 });
        g.cap(...Q(0.1), a.hx, a.hy, aw + 1.4, dk(armorC), { round: aw / 2 + 0.7, hi: dk(aL), lo: dk(aD), spec: back ? null : aS });
        g.ell(ex, ey, 2.9, 2.9, dk(armorC), { round: 2.9, hi: dk(aL), lo: dk(aD) });
        g.cap(...Q(0.82), ...Q(0.95), aw + 1.8, back ? goldD : gold, { depth: 0, flat: true });
        break;
      case 2: { // manto: manga que abre em sino, com punho dourado
        const c = dk(pri), co = { depth: 1, round: aw / 2 + 1, hi: dk(priL), lo: dk(priD) };
        g.cap(sx, sy, ex, ey, aw + 1, c, co);
        g.cap(ex, ey, ...Q(0.45), aw + 1.6, c, co); g.cap(...Q(0.45), ...Q(0.8), aw + 2.6, c, co);
        g.cap(...Q(0.74), ...Q(0.8), aw + 2.8, back ? goldD : gold, { depth: 0, flat: true });
        break;
      }
      default: // colete: braço à mostra, manga curta e bracelete
        g.limb2(sx, sy, ex, ey, a.hx, a.hy, aw, sk, { depth: 1, round: aw / 2, hi: toneHi(sk, 0.2), lo: toneLo(sk, 0.26) });
        g.cap(sx, sy, (sx + ex) / 2, (sy + ey) / 2, aw + 1.4, dk(vestC), { depth: 1, round: aw / 2 + 0.7 });
        g.cap(...Q(0.3), ...Q(0.85), aw + 0.8, dk(sec), { depth: 1, round: aw / 2, hi: dk(secL), lo: dk(secD) });
        g.cap(...Q(0.3), ...Q(0.4), aw + 1, back ? goldD : gold, { depth: 0, flat: true });
    }
    // mão (manopla na armadura)
    if (out === 1) g.ell(a.hx, a.hy, 3.1, 3, dk(toneLo(armorC, 0.12)), { round: 3, hi: dk(aL), lo: dk(aD) });
    else g.ell(a.hx, a.hy, 2.8, 2.7, sk, { hi: toneHi(sk, 0.2), lo: toneLo(sk, 0.26), round: 2.7 });
    if (drag) { g.px(a.hx + 2, a.hy + 2, goldL); g.px(a.hx + 3, a.hy + 3, gold); if (!back) g.px(a.hx + 3, a.hy + 1, goldL); }
    // ombro
    if (out === 1) { // ombreira em duas placas com friso dourado
      const k = back ? 0.78 : 1, c = dk(armorC), po = { hi: dk(aL), lo: dk(aD), round: 4 };
      g.ell(sx - 0.5, sy + 4, 4.8 * k, 3.4 * k, back ? goldD : gold, { round: 2, hi: back ? gold : goldL, lo: goldD });
      g.ell(sx - 0.5, sy + 3.2, 4.8 * k, 3.2 * k, c, po);
      g.ell(sx, sy + 1.4, 5.8 * k, 3.9 * k, back ? goldD : gold, { round: 2, hi: back ? gold : goldL, lo: goldD });
      g.ell(sx, sy + 0.6, 5.8 * k, 3.7 * k, c, { ...po, spec: back ? null : aS });
    } else if (out === 2) { // pelerine do manto sobre o ombro
      const c = dk(toneHi(pri, 0.14));
      const M = g.poly([[sx - 5, sy + 3], [sx - 3, sy - 3], [sx + 3, sy - 4], [sx + 5, sy + 2], [sx + 2, sy + 5], [sx - 3, sy + 5]], c, { hi: dk(toneHi(pri, 0.4)), lo: dk(priD), round: 3 });
      g.edge(M, 'b', back ? goldD : gold);
    }
  };
  lay('braco_tras');
  if (!(RG && RG.arm(shF.x, shF.y, aB.ex, aB.ey, aB.hx, aB.hy, 0.8))) drawArm(shF.x, shF.y, aB, true);

  // ---------- pernas ----------
  lay('pernas');
  const pants = out === 0 ? toneLo(sec, 0.7) : out === 1 ? mail : out === 2 ? toneLo(pri, 0.62) : toneLo(sec, 0.12);
  const bootC = out === 0 ? sec : out === 1 ? armorC : out === 2 ? toneLo(pri, 0.5) : toneLo(sec, 0.55);
  const drawLeg = (hip, foot, back) => {
    const k = ik(hip.x, hip.y, foot.x, foot.y, LL, LL, -1);
    if (RG && RG.leg(hip.x, hip.y, k.ex, k.ey, k.hx, k.hy, back ? 0.8 : 1)) return;
    const dk = c => back ? toneLo(c, 0.22) : c, x = Math.round(k.hx), y = Math.round(k.hy), bc = dk(bootC);
    const Pn = t => [k.ex + (k.hx - k.ex) * t, k.ey + (k.hy - k.ey) * t];
    const bo = { round: 3, hi: toneHi(bc, out === 1 ? 0.34 : 0.16), lo: toneLo(bc, 0.4), spec: back || out !== 1 ? null : aS };
    g.limb2(hip.x, hip.y, k.ex, k.ey, k.hx, k.hy, lw, dk(pants), { depth: 1, round: lw / 2 });
    if (out === 1) {            // greva, joelheira e sabato de placas
      g.cap(...Pn(0.2), ...Pn(1), lw + 1, bc, { ...bo, round: lw / 2 + 0.5 });
      g.ell(k.ex + 0.5, k.ey, 3.3, 3.1, bc, { ...bo, round: 3.1 });
    } else if (out === 0) {     // bota de cano alto com a dobra no joelho
      g.cap(...Pn(0.3), ...Pn(1), lw + 1.2, bc, { ...bo, round: lw / 2 + 0.6 });
      g.cap(...Pn(0.26), ...Pn(0.4), lw + 2, dk(toneHi(sec, 0.16)), { depth: 1, round: 1.4, hi: dk(toneHi(sec, 0.36)), lo: dk(sec) });
    } else g.cap(...Pn(out === 2 ? 0.55 : 0.4), ...Pn(1), lw + 0.9, bc, { ...bo, round: lw / 2 + 0.4 });
    g.poly([[x - 3, y - 3], [x + 3, y - 3], [x + 4, y], [x + 7, y + 1], [x + 8, y + 3], [x + 8, y + 4], [x - 3, y + 4]], bc, bo);   // pé
    if (!back) { g.px(x + 5, y + 1, toneHi(bc, 0.42)); g.px(x + 6, y + 2, toneHi(bc, 0.42)); }
    g.px(x - 3, y + 2, toneLo(bc, 0.42)); g.px(x - 3, y + 1, toneLo(bc, 0.42));
    if (out === 1 || out === 3) g.rect(x - 3, y - 4, 7, 1, back ? goldD : gold);                                                 // friso do tornozelo
    g.rect(x - 3, y + 3, 11, 1, toneLo(bc, 0.5));                                                                               // sola
    g.clear(x + 7, y + 3); g.clear(x - 3, y + 3);
  };
  drawLeg(hipF, footF, true);
  g.sub = 1;                                                 // perna de perto: ganha traço de contato sobre a de longe
  drawLeg(hipN, footN, false);
  g.contact();

  // ---------- tronco ----------
  lay('tronco');
  g.rect(hx0 + 8, T - 2, 6, 4, toneLo(skin, 0.3));                                                   // pescoço (na sombra do queixo)
  const chest = [[bx - sh + 1, T], [bx + sh - 1, T], [bx + sh, T + 2], [bx + sh - 0.5, T + 5], [bx + wa, wy + 1], [bx + hp, hipY + 1], [bx - hp, hipY + 1], [bx - wa, wy + 1], [bx - sh + 0.5, T + 5], [bx - sh, T + 2]];
  const belt = (y, h2, col, bk = true) => {
    const x0 = Math.round(bx - wa - 1), w2 = Math.round(wa * 2 + 2);
    g.rect(x0, y, w2, h2, col); g.rect(x0, y, w2, 1, toneHi(col, 0.3)); g.rect(x0 + w2 - 2, y, 2, h2, toneLo(col, 0.36));
    if (bk) { g.rect(fc - 2, y - 1, 4, h2 + 2, goldD); g.rect(fc - 2, y - 1, 3, h2 + 1, gold); g.px(fc - 1, y, goldD); g.px(fc - 2, y - 1, goldL); }
  };
  switch (out) {
    case 0: { // túnica curta com cinto, gola amarrada e barra clara
      const hem = Math.min(vfeet - 8, hipY + (fem ? 7 : 5));
      const M = g.poly([[bx - wa - 1, wy], [bx + wa + 1, wy], [bx + hp + 3, hem - 2], [bx + hp + 2, hem], [bx + 3, hem - 1], [bx, hem + 1], [bx - 3, hem - 1], [bx - hp - 2, hem + 1], [bx - hp - 3, hem - 2]],
        toneLo(pri, 0.14), { round: 2.6, hi: pri, lo: toneLo(pri, 0.48) });
      g.swap(M, toneLo(pri, 0.14), toneLo(pri, 0.32), (x, y) => x > bx + 3);
      g.line(bx - 3, wy + 3, bx - 4, hem - 2, toneLo(pri, 0.42)); g.line(bx - 4, wy + 3, bx - 5, hem - 2, pri);
      g.edge(M, 'b', toneHi(pri, 0.5));
      g.line(fc, wy + 3, fc - 1, hem - 2, toneLo(pri, 0.5));
      g.swap(g.poly(chest, pri, { hi: priL, lo: priD, round: 4, spec: priS }), pri, toneLo(pri, 0.18), (x, y) => x > fc + 2);
      if (fem) g.line(bx - sh + 2, T + 6, fc + 2, T + 6, priD);
      g.poly([[fc - 4, T], [fc + 3, T], [fc, T + 5]], vestC, { flat: true });                         // camisa na gola em V
      g.line(fc - 4, T, fc - 1, T + 5, priL); g.line(fc + 3, T, fc, T + 5, priD);
      g.px(fc - 1, T + 2, woodD); g.px(fc, T + 4, woodD);                                             // cordão
      belt(wy, 3, sec);
      break;
    }
    case 1: { // armadura de placas: peitoral, escarcelas nos quadris e saiote de tecido com barra dourada
      const hem = Math.min(vfeet - 8, hipY + 7);
      g.swap(g.poly(chest, armorC, { hi: aL, lo: aD, round: 5, spec: aS }), armorC, toneLo(armorC, 0.2), (x, y) => x > fc + 2 || y > wy - 3);
      g.rect(Math.round(bx - hp), wy + 2, Math.round(hp * 2), hipY - 1 - wy, mail);              // malha na cintura
      const tab = g.poly([[fc - 5, wy + 2], [fc + 4, wy + 2], [fc + 5, hem - 3], [fc, hem], [fc - 6, hem - 3]], sec, { hi: secL, lo: secD, round: 3 });
      g.swap(tab, sec, toneLo(sec, 0.22), (x, y) => x > fc);
      g.edge(tab, 'b', gold);
      g.line(fc - 1, wy + 4, fc - 1, hem - 3, secD);
      for (const sg of [-1, 1]) {
        const x = bx + sg * (hp + 0.5);
        const M = g.poly([[x - 3, wy + 2], [x + 3, wy + 2], [x + 3 + sg, hipY + 3], [x - 3 + sg, hipY + 3]], armorC, { hi: aL, lo: aD, round: 2.5, spec: sg < 0 ? aS : null });
        g.edge(M, 'b', gold);
      }
      g.rect(Math.round(bx - wa), wy - 2, Math.round(wa * 2), 1, aD); g.rect(Math.round(bx - wa), wy - 1, Math.round(wa * 2) - 1, 1, aL);   // placas do abdômen
      g.rect(Math.round(bx - sh + 2), T, Math.round(sh * 2 - 3), 1, gold);                           // gola
      g.line(fc, T + 2, fc, wy - 3, aD); g.line(fc - 1, T + 2, fc - 1, wy - 4, aL);                    // quilha do peitoral
      if (fem) { g.line(bx - sh + 2, T + 5, fc - 2, T + 6, aD); g.line(fc + 1, T + 6, bx + sh - 2, T + 5, aD); }
      else g.rect(Math.round(bx - sh + 2), T + 6, Math.round(sh * 2 - 4), 1, aD);
      g.line(bx - sh + 2, T + 4, bx - sh + 4, T + 2, aS); g.px(bx - sh + 3, T + 5, aS);                 // reflexo no peitoral
      g.px(Math.round(bx - sh + 2), T + 1, goldL); g.px(Math.round(bx + sh - 3), T + 1, goldD);
      belt(wy + 1, 2, '#4a2a16');
      break;
    }
    case 2: { // manto longo: aberto na frente sobre um painel claro, barras douradas e pelerine nos ombros
      const hem = Math.max(hipY + 3, hipY + 12 - S.sq);
      const xl = clamp(Math.min(footN.x, footF.x) - 3 - flow, bx - 16, bx - hp - 3), xr = clamp(Math.max(footN.x, footF.x) + 5 - flow * 0.4, bx + hp + 3, bx + 14), pc = (xl + xr) / 2 + 2;
      const pts = [[bx - wa - 1, wy], [bx + wa + 1, wy], [xr, hem - 2], [xr - 1, hem]];
      for (let x = xr - 4, i = 0; x > xl + 2; x -= 4, i++) pts.push([x, hem + (i % 2 ? -1 : 1)]);
      pts.push([xl + 1, hem], [xl, hem - 2]);
      const M = g.poly(pts, toneLo(pri, 0.1), { hi: priL, lo: priD, round: 4 });
      g.swap(M, toneLo(pri, 0.1), toneLo(pri, 0.3), (x, y) => x > pc + 6);
      g.line(bx - wa + 1, wy + 4, xl + 4, hem - 3, priD); g.line(bx - wa, wy + 4, xl + 3, hem - 3, priL);
      g.line(bx + wa, wy + 4, xr - 4, hem - 3, toneLo(pri, 0.5));
      g.poly([[fc - 1, wy + 2], [fc + 2, wy + 2], [pc + 3, hem + 2], [pc - 3, hem + 2]], sec, { hi: secL, lo: secD, round: 2 });   // painel da frente
      g.line(fc - 2, wy + 2, pc - 4, hem + 1, gold); g.line(fc + 3, wy + 2, pc + 4, hem + 1, goldD);
      g.edge(M, 'b', gold);
      g.swap(g.poly(chest, pri, { hi: priL, lo: priD, round: 4, spec: priS }), pri, toneLo(pri, 0.18), (x, y) => x > fc + 3);
      g.poly([[fc - 3, T], [fc + 3, T], [fc, T + 6]], sec, { flat: true });                           // camisa na gola
      g.line(fc - 4, T, fc - 1, T + 7, gold); g.line(fc + 4, T, fc + 1, T + 7, goldD);
      belt(wy, 2, goldD);
      // pelerine (a parte do ombro de perto é desenhada com o braço)
      const cp = toneHi(pri, 0.14), co = { hi: toneHi(pri, 0.4), lo: priD, round: 3 };
      g.edge(g.poly([[bx - sh - 2, T + 5], [bx - sh + 1, T - 1], [fc - 2, T - 1], [fc - 1, T + 3], [bx - sh + 2, T + 7]], cp, co), 'b', gold);
      g.edge(g.poly([[fc + 2, T - 1], [bx + sh - 1, T - 1], [bx + sh + 2, T + 5], [bx + sh - 2, T + 7], [fc + 1, T + 3]], cp, co), 'b', gold);
      g.ell(fc, T + 1, 1.8, 1.8, acc, { round: 1.8, hi: accL, lo: accD, spec: '#ffffff' });          // broche
      break;
    }
    default: { // colete aberto sobre a camisa
      g.poly(chest, vestC, { hi: toneHi(vestC, 0.4), lo: toneLo(vestC, 0.3), round: 4 });
      g.rect(Math.round(bx - hp), wy + 2, Math.round(hp * 2), hipY - 1 - wy, toneLo(sec, 0.12));
      g.poly([[bx - sh + 1, T], [fc - 3, T], [fc - 2, wy - 1], [bx - wa, wy + 1], [bx - sh + 0.5, T + 5], [bx - sh, T + 2]], pri, { hi: priL, lo: priD, round: 2.6, spec: priS });
      g.poly([[fc + 3, T], [bx + sh - 1, T], [bx + sh, T + 2], [bx + sh - 0.5, T + 5], [bx + wa, wy + 1], [fc + 2, wy - 1]], pri, { hi: priL, lo: priD, round: 2.6 });
      g.line(fc - 3, T, fc - 2, wy - 1, gold); g.line(fc + 3, T, fc + 2, wy - 1, goldD);
      belt(wy + 1, 3, toneLo(sec, 0.3));
    }
  }

  // ---------- fecho da capa ----------
  lay('capa_fecho');
  if (ch.cape) {
    const sh = TORSO_W[bld] / 2, cc = ch.capeColor, co = { hi: toneHi(cc, 0.3), lo: toneLo(cc, 0.38), round: 2.4 };
    g.poly([[bx - sh, T + 3], [bx - sh + 2, T - 1], [fc - 2, T - 1], [fc - 1, T + 2], [bx - sh + 3, T + 4]], cc, co);
    g.poly([[fc + 2, T - 1], [bx + sh - 2, T - 1], [bx + sh, T + 3], [bx + sh - 3, T + 4], [fc + 1, T + 2]], cc, co);
    g.ell(fc, T + 2, 2.4, 2.4, gold, { round: 2.4, hi: goldL, lo: goldD }); g.px(fc, T + 2, acc);
  }

  // ---------- cachecol ----------
  lay('cachecol');
  {
    const wrap = (c, tail) => {
      const cD = toneLo(c, 0.4), cL = toneHi(c, 0.3), w2 = Math.round(flow);
      if (tail) g.poly([[hcx - 8, T - 1], [hcx - 15 - w2, T + 1], [hcx - 18 - w2, T + 8], [hcx - 12 - w2, T + 9], [hcx - 7, T + 4]], cD, { depth: 1, hi: c, round: 2.2 });
      g.poly([[hcx - 9, T - 2], [hcx - 4, T - 4], [hcx + 5, T - 4], [hcx + 9, T - 1], [hcx + 8, T + 3], [hcx + 2, T + 6], [hcx - 5, T + 5], [hcx - 10, T + 2]], c, { hi: cL, lo: cD, round: 3.4 });
      g.line(hcx - 6, T + 1, hcx + 4, T + 3, cD); g.line(hcx - 7, T - 1, hcx + 2, T, cL);
    };
    if (ch.acc === 5) wrap(ax, true);
    else if (war) wrap(ch.capeColor, false);          // lenço do guerreiro, na cor da capa
  }

  // ---------- cabeça ----------
  lay('cabeca');
  sup(g, hcx, hy + 9.5, 11, 9.5, skin, { hi: skinL, lo: skinD, round: 8, soft: true, tLo: 0.2 });
  g.rect(hx0 + 5, hy + 10, 2, 4, skinD); g.px(hx0 + 5, hy + 11, skinDD); g.px(hx0 + 5, hy + 12, skinDD);        // orelha
  g.rect(hx0 + 10, hy + 14, 2, 1, cheekC); g.px(hx0 + 20, hy + 14, cheekC);                                         // bochechas
  {
    const irisC = ch.eyes, irisD = toneLo(irisC, 0.5), irisL = toneHi(irisC, 0.5), ey = hy + 9, e1 = hx0 + 12, e2 = hx0 + 18;
    // olhos grandes e escuros, com brilho: o de perto tem 3 px de largura, o de longe 2
    const eye = (ex, w) => {
      if (S.eyes === 1) { g.rect(ex - 1, ey + 3, w + 1, 1, lash); g.px(ex - 1, ey + 2, lash); return; }
      g.rect(ex, ey, w, 5, pupil); g.rect(ex, ey, w, 1, irisD);
      g.rect(ex, ey + 2, 1, 2, irisC); g.px(ex + w - 1, ey + 4, irisC); g.rect(ex, ey + 4, w - 1, 1, irisL);
      if (w === 3 && !drag) g.px(ex + 1, ey + 3, irisC);
      if (drag) { g.rect(ex, ey + 1, w, 3, irisC); g.rect(ex + w - 2, ey + 1, 1, 3, pupil); }      // pupila em fenda
      g.px(ex, ey + 1, '#ffffff');
      g.rect(ex - 1, ey - 1, w + 1, 1, lash);
      if (fem) { g.px(ex - 1, ey, lash); if (w === 3) g.px(ex - 2, ey - 1, lash); }                 // cílios
    };
    // características do rosto: cicatrizes (tom da bochecha escurecido), pelos (cor do cabelo) e pinturas (cor de destaque)
    const scar = toneLo(cheekC, 0.52), paint = toneLo(acc, 0.06), paintD = toneLo(acc, 0.4), F = (x, y, w2, h2, c) => g.rect(hx0 + x, hy + y, w2, h2, c);
    if (ch.face === 8) { F(9, 8, 13, 6, paint); F(9, 13, 13, 1, paintD); F(7, 9, 2, 4, paintD); }   // faixa pintada nos olhos (por baixo deles)
    eye(e1, 3); eye(e2, 2);
    g.rect(e1, ey - 4, 3, 1, hairD); g.rect(e2, ey - 4, 2, 1, hairD);                              // sobrancelhas
    const mx = hx0 + 15, my = hy + 16;
    g.rect(mx, my, 2, 1, skinDD);                                                                  // boca
    switch (ch.face) {
      case 1: F(13, 5, 1, 3, scar); F(13, 14, 1, 2, scar); F(12, 16, 1, 2, scar); F(14, 6, 1, 1, skinL); F(14, 15, 1, 1, skinL); break;                       // cicatriz no olho
      case 2: g.line(hx0 + 9, hy + 12, hx0 + 12, hy + 16, scar); F(9, 14, 1, 1, scar); F(11, 13, 1, 1, scar); F(12, 14, 1, 1, scar); break;   // na bochecha, com pontos
      case 3: F(15, 14, 4, 1, scar); F(16, 13, 1, 3, scar); break;                                                                    // no nariz
      case 4: g.poly(HP([[6, 12], [9, 15], [13, 17], [18, 17], [21, 14], [22, 17], [19, 21], [13, 22], [8, 19]]), hair, { hi: hairL, lo: hairD, round: 3 }); F(15, 16, 3, 1, mouthC); break;   // barba
      case 5: F(13, 15, 6, 1, hair); F(14, 16, 4, 1, hairD); F(12, 16, 1, 1, hair); F(19, 16, 1, 1, hairD); F(13, 15, 2, 1, hairL); break;       // bigode
      case 6: F(14, 15, 4, 1, hair); g.poly(HP([[13, 17], [19, 17], [18, 20], [15, 21], [13, 19]]), hair, { hi: hairL, lo: hairD, round: 2 }); F(15, 16, 2, 1, mouthC); break;   // cavanhaque
      case 7: F(9, 14, 4, 1, paint); F(10, 16, 3, 1, paint); F(19, 14, 2, 1, paint); F(19, 16, 2, 1, paint); F(9, 15, 1, 1, paintD); break;       // pintura de guerra
      case 9: for (const [x, y] of [[10, 13], [12, 15], [10, 15], [19, 14], [20, 15], [16, 14]]) F(x, y, 1, 1, toneLo(skin, 0.3)); break;        // sardas
    }
    if (S.mouth === 1) g.rect(mx, my - 1, 3, 2, '#4a1218');
    if (S.mouth === 2) { g.rect(mx, my - 1, 3, 2, '#4a1218'); g.rect(mx, my - 1, 3, 1, '#ffffff'); }
    if (S.mouth === 3) { g.rect(mx - 1, my - 1, 4, 3, '#4a1218'); g.px(mx + 1, my + 1, '#ff7a2a'); g.px(mx - 1, my - 1, '#ffffff'); }
  }

  // ---------- cabelo da frente ----------
  lay('cabelo_frente');
  {
    // franja em pontas sobre a testa (da têmpora de longe até a costeleta de perto); cada estilo fecha com a própria coroa
    const FR = [[23, 6], [21, 5], [20, 9], [17, 5], [15, 10], [12, 5], [9, 10], [7, 6], [7, 14], [4, 9]];
    const FRL = [[23, 7], [21, 6], [20, 9], [17, 5], [15, 9], [12, 5], [9, 9], [8, 6], [8, 17], [5, 13]];
    const hairM = (pts, dark = [], light = []) => {
      const M = g.poly(HP(pts), hair, { hi: hairL, lo: hairD, round: 3.4, spec: hairLL });
      if (g.mute) return M;
      const inM = (x, y) => { x -= M.x0; y -= M.y0; return x >= 0 && y >= 0 && x < M.w && y < M.h && M.m[y * M.w + x]; };
      const stroke = (L, col) => { for (const [x0, y0, x1, y1] of L) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) { const x = Math.round(hx0 + x0 + (x1 - x0) * i / n), y = Math.round(hy + y0 + (y1 - y0) * i / n); if (inM(x, y) && inM(x, y - 1) && inM(x - 1, y) && inM(x + 1, y) && inM(x, y + 1)) g.px(x, y, col); } } };
      g.swap(M, hair, toneLo(hair, 0.2), (x, y) => y - hy > 7 + (x - hx0) * 0.45);       // sombra de forma: a parte de baixo e de trás
      stroke(dark, hairD); stroke(light, hairL);
      stroke(light.map(([x0, y0, x1, y1]) => [x0, y0, (x0 + x1) / 2, (y0 + y1) / 2]), hairLL);   // ponta das mechas mais clara
      return M;
    };
    const DK = [[17, 4, 15, -1], [12, 4, 9, -2], [7, 5, 3, 0], [2, 13, -1, 7]], LT = [[5, -3, 8, 2], [13, -3, 15, 1], [19, -1, 21, 3], [-2, 3, 1, 7]];
    switch (ch.hair) {
      case 0: break;
      case 1: hairM([[3, 16], [1, 17], [-2, 13], [-5, 14], [-3, 10], [-7, 8], [-3, 5], [-6, 0], [-1, 0], [-2, -5], [3, -3], [5, -8], [9, -4], [13, -8], [15, -3], [20, -6], [20, -1], [24, 0], [22, 3], ...FR], DK, LT); break;
      case 2: hairM([[3, 17], [1, 17], [-3, 14], [-7, 16], [-4, 10], [-9, 7], [-4, 4], [-8, -3], [-2, -1], [-3, -8], [3, -4], [5, -11], [9, -5], [13, -11], [15, -4], [21, -8], [20, -2], [25, -2], [22, 3], ...FR], DK, [[5, -6, 8, 1], [13, -6, 15, 0], [20, -3, 21, 3], [-4, 1, 0, 6]]); break;
      case 3: hairM([[3, 20], [0, 17], [-2, 8], [0, 1], [5, -3], [12, -4], [18, -2], [22, 2], [23, 7], [21, 6], [20, 9], [17, 5], [15, 9], [12, 5], [9, 9], [8, 6], [8, 16], [7, 26], [4, 22], [5, 13]], [[17, 4, 14, -1], [12, 4, 8, -1], [6, 8, 5, 20], [1, 6, 1, 15]], [[5, 0, 12, -2], [13, -2, 19, 1], [2, 4, 3, 12]]); break;
      case 4: hairM([[3, 14], [0, 13], [-2, 8], [0, 1], [5, -3], [12, -4], [18, -2], [22, 2], ...FR], [[17, 4, 14, -1], [12, 4, 8, -1], [7, 5, 3, 1]], [[5, 0, 12, -2], [13, -2, 19, 1]]); break;
      case 5: hairM([[6, 4], [4, -4], [8, -9], [10, -4], [13, -12], [16, -4], [19, -8], [20, -2], [23, 3], [18, 2], [11, 2]], [[9, -5, 9, 0], [14, -8, 14, 0], [18, -5, 18, 0]], [[12, -8, 12, -2]]); g.rect(hx0 + 2, hy + 4, 4, 7, toneLo(skin, 0.3)); g.rect(hx0 + 3, hy + 5, 3, 1, hairD); g.rect(hx0 + 2, hy + 8, 3, 1, hairD); break;
      case 6: hairM([[3, 16], [1, 16], [-2, 9], [-2, 3], [2, -2], [5, -6], [9, -4], [13, -7], [16, -3], [21, -4], [21, 0], [24, 2], ...FR], DK.slice(0, 3), LT.slice(0, 3)); g.rect(hx0 - 2, hy + 1, 3, 3, gold); g.px(hx0 - 2, hy + 1, goldL); break;
      case 7: hairM([[2, 12], [-2, 4], [3, -3], [11, -6], [19, -4], [23, 1], [23, 6], [20, 5], [17, 7], [14, 5], [11, 7], [8, 5], [6, 10], [4, 8]], [[17, 4, 15, 0], [11, 5, 9, 0]], [[6, -1, 12, -3]]); break;
      case 8: hairM([[3, 20], [0, 18], [-2, 9], [0, 1], [5, -3], [12, -4], [18, -2], [22, 2], ...FRL], [[17, 4, 14, -1], [12, 4, 8, -1], [6, 8, 6, 15], [1, 6, 1, 15]], [[5, 0, 12, -2], [13, -2, 19, 1], [2, 4, 3, 12]]); break;
      case 9: {
        hairM([[3, 16], [1, 16], [-2, 9], [-1, 2], [3, -3], [9, -5], [15, -4], [20, -2], [23, 2], ...FR], DK.slice(0, 3), [[5, 0, 12, -2], [13, -2, 19, 1]]);
        for (let i = 0; i < 5; i++) g.ell(hx0 + 5 - (i % 2), hy + 17 + i * 3, 2.3, 2, i % 2 ? hair : toneLo(hair, 0.14), { round: 2, hi: hairL, lo: hairD });   // trança sobre o ombro
        g.rect(hx0 + 3, hy + 31, 3, 2, gold); g.rect(hx0 + 3, hy + 33, 3, 3, hair);
        break;
      }
    }
  }

  // ---------- chifres e orelhas pontudas do dragônico ----------
  lay('chifres');
  if (drag) {
    g.poly(HP([[7, 9], [2, 7], [-3, 4], [1, 10], [6, 13]]), skin, { hi: skinL, lo: skinD, round: 2 });       // orelha
    g.px(hx0 + 3, hy + 9, skinD);
    const ho = { hi: boneL, lo: boneD, round: 2.4 };
    g.poly(HP([[4, 2], [0, -3], [-1, -9], [2, -15], [3, -9], [5, -4], [9, 0]]), bone, ho);
    g.poly(HP([[13, 0], [16, -4], [19, -9], [18, -14], [22, -9], [21, -3], [18, 1]]), bone, ho);
    g.line(hx0 + 1, hy - 4, hx0 + 4, hy - 5, boneD); g.line(hx0 + 1, hy - 8, hx0 + 3, hy - 9, boneD); g.line(hx0 + 17, hy - 5, hx0 + 20, hy - 4, boneD); g.line(hx0 + 19, hy - 9, hx0 + 21, hy - 8, boneD);
  }

  // ---------- acessórios do rosto ----------
  lay('acessorio');
  switch (ch.acc) {
    case 1: // óculos: só a armação, para não esconder os olhos
      for (const [x, w] of [[10, 6], [17, 5]]) { g.rect(hx0 + x, hy + 7, w, 1, ax); g.rect(hx0 + x, hy + 14, w, 1, ax); g.rect(hx0 + x, hy + 7, 1, 8, ax); g.rect(hx0 + x + w - 1, hy + 7, 1, 8, ax); g.px(hx0 + x + 1, hy + 8, '#dff4ff'); }
      g.rect(hx0 + 16, hy + 9, 1, 1, ax); g.rect(hx0 + 5, hy + 9, 5, 1, ax); break;
    case 2: g.poly(HP([[16, 7], [21, 7], [21, 15], [16, 15]]), ax, { hi: axL, lo: axD, round: 2 }); g.line(hx0 + 1, hy + 3, hx0 + 21, hy + 8, ax); g.line(hx0 + 1, hy + 4, hx0 + 16, hy + 8, axD); break;
    case 3: g.poly(HP([[8, 13], [22, 13], [22, 17], [18, 19], [11, 19], [8, 16]]), ax, { hi: axL, lo: axD, round: 3 }); g.line(hx0 + 16, hy + 14, hx0 + 16, hy + 18, axD); g.line(hx0 + 2, hy + 13, hx0 + 8, hy + 14, axD); break;
    case 4: g.px(hx0 + 5, hy + 14, ax); g.px(hx0 + 4, hy + 15, axL); g.px(hx0 + 6, hy + 15, ax); g.px(hx0 + 5, hy + 16, axD); g.px(hx0 + 5, hy + 17, axL); break;   // brinco de argola
  }

  // ---------- chapéus e elmos ----------
  lay('chapeu');
  const hc = ch.headColor, hcD = toneLo(hc, 0.38), hcL = toneHi(hc, 0.34), hcS = toneHi(hc, 0.7), ho = { hi: hcL, lo: hcD };
  const hb = (x, y) => [hcx + x, hy + y];
  switch (ch.head) {
    case 1: { // chapéu de bruxo: aba larga com friso dourado, cone tombado para trás e faixa com joia
      const tip = Math.round(flow * 0.7);
      const brim = g.ell(hcx + 1, hy + 2.5, 17, 5.2, hc, { ...ho, round: 3.4, spec: hcS });
      g.swap(brim, hc, toneLo(hc, 0.24), (x, y) => y < hy + 4 && x > hcx - 2);                 // sombra do cone sobre a aba
      g.edge(brim, 'b', gold);
      const cone = g.poly([hb(-9, -1), hb(-8, -6), hb(-6, -12), hb(-8, -16), hb(-14 - tip, -15), hb(-13 - tip, -18), hb(-7, -21), hb(-1, -20), hb(3, -15), hb(6, -8), hb(10, -1), hb(7, 1), hb(1, 2), hb(-5, 1)], hc, { ...ho, round: 6, spec: hcS });
      g.swap(cone, hc, toneLo(hc, 0.2), (x, y) => x > hcx + 1 - (y - hy) * 0.15);
      g.line(hcx - 4, hy - 13, hcx, hy - 9, hcD); g.line(hcx - 6, hy - 17, hcx - 2, hy - 16, hcD);                // amassados
      g.poly([hb(-9, -3), hb(10, -3), hb(10, -1), hb(7, 1), hb(1, 2), hb(-5, 1), hb(-9, -1)], gold, { hi: goldL, lo: goldD, round: 1.6 });   // faixa
      g.ell(hcx + 3, hy - 1, 1.8, 1.8, acc, { round: 1.8, hi: accL, lo: accD, spec: '#ffffff' });
      for (const [x, y] of [[1, -9], [-3, -17]]) { g.px(hcx + x, hy + y, goldL); g.px(hcx + x - 1, hy + y, gold); g.px(hcx + x + 1, hy + y, gold); g.px(hcx + x, hy + y - 1, gold); g.px(hcx + x, hy + y + 1, gold); }
      break;
    }
    case 2: { // elmo aberto: cúpula, guarda da nuca, friso dourado na testa e penacho
      g.poly(HP([[3, -3], [-3 - sway, -9], [3, -13], [12, -12], [18, -8], [12, -6]]), acc, { round: 3, hi: accL, lo: accD });
      g.poly(HP([[-2, 12], [-3, 3], [1, -4], [8, -7], [15, -7], [21, -4], [24, 2], [24, 6], [9, 6], [8, 14], [3, 18], [-1, 16]]), hc, { ...ho, round: 6, spec: '#ffffff' });
      g.rect(hx0 + 9, hy + 5, 15, 2, goldD); g.rect(hx0 + 9, hy + 5, 15, 1, gold);
      g.line(hx0 + 9, hy + 7, hx0 + 8, hy + 14, hcD); g.px(hx0 + 4, hy + 8, hcS); g.px(hx0 + 4, hy + 12, hcS);       // rebites
      break;
    }
    case 3: // coroa
      g.poly(HP([[3, 2], [20, 2], [20, -5], [17, -11], [14, -5], [11.5, -13], [9, -5], [6, -11], [3, -5]]), gold, { hi: goldL, lo: goldD, round: 3, spec: '#ffffff' });
      g.rect(hx0 + 3, hy - 2, 17, 1, goldD); g.rect(hx0 + 3, hy + 1, 17, 1, goldD);
      for (const [x, c] of [[5, '#e63946'], [10, acc], [16, '#e63946']]) { g.rect(hx0 + x, hy - 2, 3, 3, c); g.px(hx0 + x, hy - 2, '#ffffff'); g.px(hx0 + x + 2, hy, toneLo(c, 0.4)); }
      break;
    case 4: { // bandana
      const t = Math.round(flow * 0.8);
      g.poly(HP([[0, 4], [-8 - t, 5], [-12 - t, 12], [-6 - t, 11], [-1, 8]]), hcD, { depth: 1, hi: hc });
      g.poly(HP([[0, 2], [-7 - t, -1], [-11 - t, 5], [-5 - t, 5]]), hc, { ...ho, depth: 1 });
      g.poly(HP([[-1, 2], [23, 1], [23, 5], [-1, 7]]), hc, { ...ho, round: 2.4, spec: hcS });
      g.rect(hx0 - 2, hy + 3, 3, 4, hcD);                                                                              // nó
      break;
    }
    case 5: // tiara com chifres
      g.poly(HP([[-1, 2], [23, 1], [23, 4], [-1, 6]]), hc, { ...ho, round: 2.4 });
      g.poly(HP([[4, 3], [0, -3], [-1, -9], [2, -15], [3, -9], [5, -4], [9, 1]]), bone, { hi: boneL, lo: boneD, round: 2.4 });
      g.poly(HP([[13, 1], [16, -4], [19, -9], [18, -14], [22, -9], [21, -3], [18, 2]]), bone, { hi: boneL, lo: boneD, round: 2.4 });
      break;
    case 6: // orelhas de gato
      g.poly(HP([[1, 2], [1, -9], [10, -2]]), hair, { hi: hairL, lo: hairD, depth: 1 }); g.poly(HP([[3, 0], [3, -5], [7, -1]]), '#f4a5b8', { depth: 0 });
      g.poly(HP([[12, -2], [20, -10], [23, 2]]), hair, { hi: hairL, lo: hairD, depth: 1 }); g.poly(HP([[15, -1], [19, -6], [21, 0]]), '#f4a5b8', { depth: 0 });
      break;
    case 7: { // capuz pontudo: cobre a cabeça e deixa o rosto numa abertura com friso dourado
      const tip = Math.round(flow * 0.6);
      const outer = polyTest(HP([[5, 20], [-1, 18], [-4, 12], [-4, 5], [-6, 1], [-10 - tip, -2], [-8 - tip, -5], [-3, -5], [1, -8], [6, -10], [12, -10], [18, -8], [22, -4], [25, 2], [25, 9], [24, 15], [21, 20], [14, 21]]));
      const ox = hx0 + 15.5, oy = hy + 11.5, inOpen = (x, y, k) => Math.pow((x - ox) / (7.2 + k), 2) + Math.pow((y - oy) / (8.6 + k), 2) <= 1;
      const M = g.shape(hx0 - 12 - tip, hy - 10, hx0 + 26, hy + 22, (x, y) => outer(x, y) && !inOpen(x, y, 0), hc, { ...ho, round: 5, spec: hcS });
      g.shape(hx0 + 6, hy + 1, hx0 + 25, hy + 22, (x, y) => outer(x, y) && inOpen(x, y, 1.3) && !inOpen(x, y, 0), gold, { flat: true });   // friso
      g.shape(hx0 + 6, hy + 1, hx0 + 25, hy + 22, (x, y) => outer(x, y) && inOpen(x, y, 1.3) && !inOpen(x, y, 0) && (x - ox) + (y - oy) > 4, goldD, { flat: true });
      g.swap(M, hc, toneLo(hc, 0.2), (x, y) => (x < hx0 + 4 && y > hy + 3) || y > hy + 16);
      g.line(hx0 + 4, hy - 6, hx0 + 13, hy - 8, hcL); g.line(hx0 + 14, hy - 8, hx0 + 19, hy - 6, hcL);
      g.line(hx0 - 1, hy + 4, hx0 + 2, hy + 15, hcD); g.line(hx0 - 6 - tip, hy - 2, hx0 + 2, hy + 3, hcD); g.line(hx0 + 5, hy - 5, hx0 + 8, hy + 1, hcD);                     // dobras do tecido
      // pelerine do capuz sobre os ombros
      lay('capuz_ombro');
      const sh = TORSO_W[bld] / 2, mc = toneLo(hc, 0.12), mo = { hi: hc, lo: hcD, round: 3 };
      g.edge(g.poly([[bx - sh - 3, T + 5], [bx - sh, T - 2], [bx + sh, T - 2], [bx + sh + 3, T + 5], [bx + sh + 1, T + 8], [fc + 3, T + 5], [fc, T + 9], [fc - 3, T + 5], [bx - sh, T + 8]], mc, mo), 'b', gold);
      break;
    }
  }

  // ---------- armas e braço de perto ----------
  const hnd = { x: aF.hx, y: aF.hy }, hndB = { x: aB.hx, y: aB.hy };
  const hand = () => {
    const was = g.mute, wasL = g.layer; lay('braco_frente');
    if (!(RG && RG.arm(shN.x, shN.y, aF.ex, aF.ey, hnd.x, hnd.y, 1))) drawArm(shN.x, shN.y, aF, false);
    g.mute = was; g.layer = wasL;
  };
  lay('arma');
  const wo = { depth: 1, round: 1.4, hi: woodL, lo: woodD };
  if (war) {
    if (S.shield && S.wShow) { if (S.shield === 2) shield(hndB.x + 3, T + 9, 1.25, false); else shield(hndB.x + 1, hndB.y - 1, 1, false); }
    if (pose === 'cast') { // lança (só no preparo do arremesso)
      if (f === 0) {
        const d = dirOf(S.wAng), x = hnd.x, y = hnd.y;
        g.path([[x - d.x * 17, y - d.y * 17], [x + d.x * 20, y + d.y * 20]], 2.6, wood, wo);
        g.poly([[x + d.x * 19 - d.y * 3.5, y + d.y * 19 + d.x * 3.5], [x + d.x * 29, y + d.y * 29], [x + d.x * 19 + d.y * 3.5, y + d.y * 19 - d.x * 3.5]], metal, { hi: toneHi(metal, 0.5), lo: toneLo(metal, 0.4), depth: 1 });
        g.path([[x + d.x * 17, y + d.y * 17], [x + d.x * 19, y + d.y * 19]], 3.6, gold, { depth: 0, flat: true });
      }
    } else if (S.wShow && !(RG && RG.sword(hnd.x, hnd.y, S.wAng))) heroBlade(g, hnd.x, hnd.y, S.wAng, 26, 5, metal, '#5a3524', gold);
    hand();
  } else if (mage) {
    if (S.wShow) {
      const d = dirOf(S.wAng), top = { x: hnd.x + d.x * 24, y: hnd.y + d.y * 24 }, big = pose === 'cast' && f === 1;
      g.path([[hnd.x - d.x * 13, hnd.y - d.y * 13], [top.x, top.y]], 2.6, metal, { depth: 1, round: 1.4, hi: toneHi(metal, 0.4), lo: toneLo(metal, 0.4) });
      for (const t of [-9, 8, 15]) g.px(hnd.x + d.x * t, hnd.y + d.y * t, toneLo(metal, 0.5));
      g.path([[top.x - d.x * 3, top.y - d.y * 3], [top.x, top.y]], 4.4, goldD, { depth: 1, round: 2, hi: gold, lo: toneLo(goldD, 0.3) });
      const ox = top.x + d.x * 5.5, oy = top.y + d.y * 5.5, r = big ? 4.6 : 3.8;
      g.ell(ox, oy, r + 1.9, r + 1.9, gold, { hi: goldL, lo: goldD, round: 2 });                      // aro
      g.ell(ox, oy, r, r, acc, { hi: accL, lo: accD, round: r, spec: '#ffffff' });                  // orbe
      g.px(ox + 1, oy + 2, accL);
      if (pose === 'cast' && f >= 1) { g.px(ox + 9, oy - 5, accL); g.px(ox - 8, oy - 7, accL); g.px(ox + 8, oy + 7, accL); g.px(ox, oy - 10, '#ffffff'); g.px(ox + 11, oy + 1, '#ffffff'); }
    }
    hand();
  } else if (arc) {
    // correia da aljava atravessada no peito
    g.path([[bx + 5, T + 1], [bx - 5, wy]], 2, '#7a4a28', { depth: 0, flat: true }); g.line(bx + 5, T, bx - 5, wy - 1, '#a8703c'); g.rect(fc - 2, T + 4, 2, 2, gold);
    if (!aiming) drawBow(true);
    hand();
  } else hand();                                   // dragônico: só as garras

  // aba do capuz sobre o ombro de perto (por cima do braço)
  lay('capuz_braco');
  if (ch.head === 7) g.edge(g.poly([[shN.x - 6, shN.y + 3], [shN.x - 4, shN.y - 4], [shN.x + 3, shN.y - 5], [shN.x + 5, shN.y + 2], [shN.x + 2, shN.y + 6], [shN.x - 3, shN.y + 5]], toneLo(hc, 0.12), { hi: hc, lo: hcD, round: 3 }), 'b', gold);

  g.mute = false; g.clip = null;
  if (o.raw) return g.toCanvas();
  occlude(g.d, g.ids, g.w, g.h);
  return heroFinish(g.toCanvas(), g.ids, ch);
}

// Conjunto de sprites com cache preguiçoso (só desenha a pose quando ela é usada).
// Com as folhas PNG carregadas (js/spritepack.js), o herói é montado com elas; senão, desenhado por código.
function buildPlayerSprites(ch) {
  const cache = {};
  return {
    ch,
    get(pose, f = 0) {
      const gen = typeof Pack !== 'undefined' ? Pack.gen : 0;
      if (cache.gen !== gen) { for (const k in cache) delete cache[k]; cache.gen = gen; }   // as folhas PNG terminaram de carregar: refaz
      const n = POSES[pose]; f = ((f % n) + n) % n;
      const k = pose + f;
      return cache[k] || (cache[k] = (typeof packChar === 'function' && packChar(ch, pose, f)) || drawChar(ch, pose, f));
    },
    // rosto para o HUD (vidas): recorte da cabeça, 36x36 px de alta resolução
    face() {
      if (cache.face) return cache.face;
      const body = this.get('idle', 0), fr = heroFrame(ch, 'idle', 0), o = mk(36, 36), g = o.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(body, fr.hx0 - 1, fr.hy - 4, 24, 24, 0, 0, 36, 36);
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
