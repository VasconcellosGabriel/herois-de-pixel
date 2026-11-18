'use strict';
// ---------- Mapa do mundo (seleção de fases) ----------
// As 30 fases viram pontos de uma trilha que atravessa os 7 mundos, da esquerda para a direita. O herói aberto fica
// em cima da fase escolhida e anda pela trilha até a próxima quando o jogador escolhe outra (clique/toque no ponto,
// setas do teclado ou direcional do controle). O fundo (terreno, enfeites, trilha) é desenhado uma vez só, por código,
// na resolução dos heróis; por cima, a cada quadro: trilha já liberada, pontos, estrelas, névoa dos mundos fechados e o herói.
// Para mudar a posição dos pontos: mapNodes(). Para o visual de cada mundo: BIOMAS e os enfeites em mapBuild().
const MAPA = { W: 1820, H: 216, WW: 260, HERO: 0.75 };   // tamanho do mapa e largura de cada mundo, em pixels; escala do herói
const Mapa = {
  on: false, bg: null, nodes: null, segs: null, len: null,
  sel: 0,            // fase escolhida (para onde o herói vai)
  u: 0,              // posição do herói na trilha: 3 = em cima da fase 3; 3.5 = no meio do caminho até a 4
  v: 300, face: 1, moving: false, pend: false, follow: true,
  at: -1, hero: -2,  // última fase em que o herói esteve (e de qual herói salvo), para ele sair dela ao voltar ao mapa
  wasSel: false, scale: 2, spr: null, sprKey: '', t: 0,
};
// cores do terreno de cada mundo: três tons de chão, a borda da costa e a cor da trilha
const BIOMAS = [null,
  { land: ['#3b8a3c', '#49a046', '#60b653'], shore: '#d9cf8a', road: '#d9b878' },   // Reino Verde
  { land: ['#c6d8ea', '#e0ecf7', '#f6fbff'], shore: '#9fc4e6', road: '#8fa6c4' },   // Picos Gelados
  { land: ['#3a5638', '#48693e', '#5c7b44'], shore: '#7a8a52', road: '#b9a36a' },   // Pântano Gosmento
  { land: ['#d09c46', '#e1b35a', '#f0ca78'], shore: '#f6dfa0', road: '#a8743a' },   // Deserto Escaldante
  { land: ['#35272b', '#463237', '#5a3f43'], shore: '#7a4a3a', road: '#c9a070' },   // Montanha de Fogo
  { land: ['#2b223d', '#382c50', '#453a60'], shore: '#5a4a78', road: '#a99ac8' },   // Castelo do Vampiro
  { land: ['#cfe3f7', '#e8f3ff', '#ffffff'], shore: '#a9c8ea', road: '#f0c95a' },   // Cidadela Celeste (nuvens)
];

// Pontos das fases e a trilha entre vizinhas (curvas suaves amostradas em pontinhos)
function mapNodes() {
  if (Mapa.nodes) return Mapa.nodes;
  const per = {}, cnt = {};
  for (const lv of LEVELS) per[lv.world] = (per[lv.world] || 0) + 1;
  const nodes = LEVELS.map((lv, i) => {
    const k = cnt[lv.world] = (cnt[lv.world] || 0) + 1, n = per[lv.world], x0 = (lv.world - 1) * MAPA.WW;
    return { i, lv, x: Math.round(x0 + 36 + (k - 1) * (MAPA.WW - 72) / Math.max(1, n - 1)), y: Math.round(128 + Math.sin(i * 1.7 + lv.world * 0.9) * 30 - (lv.boss ? 6 : 0)) };
  });
  const segs = [], len = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + (i % 2 ? 14 : -14), pts = [];
    const n = Math.max(6, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 3));
    for (let k = 0; k <= n; k++) { const t = k / n, u = 1 - t; pts.push([u * u * a.x + 2 * u * t * mx + t * t * b.x, u * u * a.y + 2 * u * t * my + t * t * b.y]); }
    let L = 0; for (let k = 1; k < pts.length; k++) L += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    segs.push(pts); len.push(L);
  }
  Mapa.nodes = nodes; Mapa.segs = segs; Mapa.len = len;
  return nodes;
}
// ponto da trilha na posição u (ver Mapa.u)
function mapPoint(u) {
  const nodes = mapNodes(), n = nodes.length - 1;
  u = clamp(u, 0, n);
  const i = Math.min(n - 1, Math.floor(u)), f = u - i;
  if (f <= 0 || n < 1) return [nodes[Math.round(u)].x, nodes[Math.round(u)].y];
  const pts = Mapa.segs[i], q = f * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(q)), r = q - k;
  return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * r, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * r];
}

// ---------- Fundo (desenhado uma vez) ----------
function mapBuild() {
  if (Mapa.bg) return Mapa.bg;
  const { W, H, WW } = MAPA, nodes = mapNodes(), g = new PX(W, H);
  const top = x => 30 + (pn(x, 0, 40, 4096, 11) - 0.5) * 18, bot = x => 197 + (pn(x, 0, 46, 4096, 23) - 0.5) * 16;
  // de qual mundo é cada ponto: as divisas ondulam em vez de serem retas
  const worldAt = (x, y) => clamp(1 + Math.floor((x + Math.sin(y / 21) * 9 + (pn(x, y, 14, 4096, 5) - 0.5) * 14) / WW), 1, 7);
  const isLand = (x, y) => y > top(x) + 3 && y < bot(x) - 3;
  for (let x = 0; x < W; x++) {
    const t0 = top(x), b0 = bot(x);
    for (let y = 0; y < H; y++) {
      const wi = worldAt(x, y), B = BIOMAS[wi], n = pn(x, y, 9, 4096, wi * 7) + (hash2(x, y, wi) - 0.5) * 0.22;
      let col;
      if (y < t0 || y > b0) {                                      // mar (no último mundo, o céu)
        const d = y < t0 ? t0 - y : y - b0, wave = (y + Math.round(Math.sin(x / 13 + y) * 1.5)) % 9 === 0 && hash2(x >> 3, y, 3) > 0.45;
        if (wi === 7) col = d < 2.5 ? '#bfe0ff' : pn(x, y, 22, 4096, 61) > 0.68 ? '#a6d6ff' : y < 60 ? '#62aee8' : '#78c0f2';
        else col = d < 2 ? '#8fc4ee' : d < 4.5 ? '#3f74b8' : wave ? '#3565a8' : n > 0.62 ? '#234a86' : '#1d3f76';
      } else {
        const e = Math.min(y - t0, b0 - y);
        col = e < 2.5 ? B.shore : B.land[n < 0.4 ? 0 : n < 0.72 ? 1 : 2];
        if (e >= 2.5) {
          const m = pn(x, y, 18, 4096, 77 + wi);
          if (wi === 1 && m > 0.7) col = '#33803a';                                             // moitas de capim mais escuro
          else if (wi === 2 && m > 0.72) col = '#b9d6f0';                                       // gelo
          else if (wi === 3 && m > 0.66) col = m > 0.74 ? '#2f4a66' : '#3d6a6a';               // poças do brejo
          else if (wi === 4 && (y + Math.round(Math.sin(x / 9) * 3)) % 11 === 0 && m > 0.42) col = '#bf8c3c';   // dunas
          else if (wi === 5) { const c = Math.abs(pn(x, y, 12, 4096, 91) - 0.5); if (c < 0.014) col = '#ffc04a'; else if (c < 0.04) col = '#ff6a1a'; }   // veios de lava
          else if (wi === 6 && m > 0.7) col = '#221a33';                                        // sombras
          else if (wi === 7 && m > 0.74) col = '#fff6d8';                                       // nuvens douradas
        }
      }
      g.px(x, y, col);
    }
  }
  // --- enfeites: longe da trilha e dos pontos, desenhados de trás para a frente ---
  const road = []; for (const s of Mapa.segs) for (let k = 0; k < s.length; k += 2) road.push(s[k]);
  const far = (x, y, d) => road.every(p => Math.abs(p[0] - x) > d || Math.abs(p[1] - y) > d * 0.8) && nodes.every(n => Math.hypot(n.x - x, n.y - y) > d + 8);
  const tree = (x, y) => { g.rect(x - 1, y - 2, 2, 4, '#5a3a1e'); g.lit(x, y - 6, 5.5, 5, ['#1f5a2a', '#2f7a34', '#49a043', '#7cc85a'], x * 7 + y); };
  const pine = (x, y) => { g.rect(x - 1, y - 1, 2, 3, '#4a3020'); g.poly([[x, y - 13], [x + 5, y - 1], [x - 5, y - 1]], '#2f6652', { hi: '#5c9a7a', lo: '#1c3a30', depth: 2 }); g.poly([[x, y - 13], [x + 2.4, y - 8], [x - 2.4, y - 8]], '#ffffff', { flat: true }); g.px(x - 3, y - 4, '#f4faff'); g.px(x + 2, y - 5, '#f4faff'); };
  const mount = (x, y, s, col, cap) => { g.poly([[x, y - 17 * s], [x + 13 * s, y], [x - 13 * s, y]], col, { hi: shade(col, 0.28), lo: shade(col, -0.34), depth: 3 }); if (cap) g.poly([[x, y - 17 * s], [x + 4.5 * s, y - 11 * s], [x + 1.5 * s, y - 9 * s], [x - 1.5 * s, y - 11.5 * s], [x - 4.5 * s, y - 11 * s]], cap, { flat: true }); };
  const dead = (x, y, c = '#3a2c28') => { g.rect(x, y - 9, 2, 10, c); g.line(x, y - 6, x - 4, y - 10, c); g.line(x + 1, y - 7, x + 5, y - 11, c); g.line(x + 1, y - 9, x + 2, y - 13, c); };
  const cactus = (x, y) => { const c = '#3f8a4a', d = '#2a6238'; g.rect(x - 1, y - 9, 3, 10, c); g.rect(x + 1, y - 9, 1, 10, d); g.rect(x - 4, y - 6, 2, 4, c); g.rect(x - 4, y - 3, 3, 1, c); g.rect(x + 3, y - 7, 2, 3, c); g.rect(x + 2, y - 5, 2, 1, d); g.px(x, y - 10, '#ff8fb0'); };
  const rock = (x, y, c) => g.ell(x, y - 2, 4, 3, c, { hi: shade(c, 0.3), lo: shade(c, -0.35), depth: 1 });
  const tomb = (x, y) => { g.poly([[x - 3, y], [x - 3, y - 6], [x - 1, y - 8], [x + 1, y - 8], [x + 3, y - 6], [x + 3, y]], '#8a86a0', { hi: '#c2bfd6', lo: '#55506e', depth: 1 }); g.rect(x - 1, y - 6, 2, 1, '#55506e'); g.rect(x, y - 7, 1, 4, '#55506e'); };
  const cloud = (x, y) => g.lit(x, y - 4, 9, 5, ['#9fc0e6', '#cfe3f7', '#eef6ff', '#ffffff'], x * 3 + y, { under: true });
  const pool = (x, y) => { g.ell(x, y - 2, 6, 3, '#ff6a1a', { hi: '#ffc04a', lo: '#b83a10', depth: 1 }); g.rect(x - 2, y - 3, 3, 1, '#fff2a0'); };
  const pillar = (x, y) => { g.rect(x - 2, y - 11, 4, 11, '#e9c75a'); g.rect(x - 2, y - 11, 1, 11, '#fff2a8'); g.rect(x + 1, y - 11, 1, 11, '#a8842a'); g.rect(x - 3, y - 12, 6, 2, '#fff2a8'); g.rect(x - 3, y - 1, 6, 2, '#a8842a'); };
  const reed = (x, y) => { g.rect(x, y - 6, 1, 6, '#8fa052'); g.rect(x + 2, y - 4, 1, 4, '#6f8442'); g.rect(x, y - 8, 1, 2, '#5a3a1e'); };
  const palm = (x, y) => { g.rect(x, y - 8, 2, 9, '#7a5a2e'); for (const [dx, dy] of [[-5, -8], [-3, -11], [3, -11], [6, -8], [0, -12]]) g.line(x + 1, y - 9, x + dx, y + dy, '#3f9a4a'); };
  // marco do chefe de cada mundo, logo acima do último ponto
  const marcos = {
    1: (x, y) => { const c = '#9a9aae'; g.rect(x - 11, y - 14, 22, 14, c); g.rect(x - 11, y - 14, 22, 2, '#c8c8da'); for (const dx of [-13, 8]) { g.rect(x + dx, y - 22, 6, 22, c); g.rect(x + dx, y - 22, 2, 22, '#c8c8da'); g.poly([[x + dx - 1, y - 22], [x + dx + 3, y - 29], [x + dx + 7, y - 22]], '#b8262e', { hi: '#e86a5a', lo: '#7a1620', depth: 1 }); } g.rect(x - 3, y - 8, 6, 8, '#2a2030'); g.rect(x - 2, y - 9, 4, 1, '#2a2030'); for (const dx of [-9, -5, 4, 8]) g.rect(x + dx, y - 16, 2, 2, c); },
    2: (x, y) => { mount(x - 7, y, 1.5, '#8fa0bd', '#ffffff'); mount(x + 10, y, 1.1, '#7f90ad', '#f4faff'); g.ell(x + 1, y - 3, 5, 4, '#1a2438', { flat: true }); },
    3: (x, y) => { g.ell(x, y - 6, 15, 7, '#4fae3a', { hi: '#9fe86a', lo: '#2a6a22', depth: 2 }); g.ell(x - 4, y - 8, 3, 2, '#cfff9a', { flat: true }); dead(x - 14, y - 2, '#2e2a22'); dead(x + 15, y - 1, '#2e2a22'); g.rect(x + 3, y - 7, 2, 2, '#2a6a22'); },
    4: (x, y) => { g.poly([[x, y - 24], [x + 18, y], [x - 18, y]], '#e6c070', { hi: '#fff0b0', lo: '#a8793a', depth: 2 }); g.poly([[x, y - 24], [x + 18, y], [x + 5, y]], '#b98a42', { flat: true }); g.rect(x - 2, y - 5, 4, 5, '#4a3018'); for (let k = 1; k < 5; k++) g.line(x - 18 + k * 3.6, y - k * 4.8, x + 2, y - k * 4.8, '#c9a258'); },
    5: (x, y) => { g.poly([[x - 7, y - 24], [x + 7, y - 24], [x + 22, y], [x - 22, y]], '#4a2f33', { hi: '#7a5458', lo: '#231518', depth: 3 }); g.poly([[x - 7, y - 24], [x + 7, y - 24], [x + 4, y - 20], [x - 4, y - 20]], '#ff6a1a', { hi: '#ffc04a', lo: '#b83a10', depth: 1 }); g.line(x - 2, y - 20, x - 6, y - 9, '#ff6a1a'); g.line(x + 3, y - 20, x + 8, y - 6, '#ff8a2a'); g.line(x - 6, y - 9, x - 9, y - 2, '#ffc04a'); for (const [dx, dy] of [[-3, -29], [2, -32], [6, -28]]) g.rect(x + dx, y + dy, 2, 2, '#8a8090'); },
    6: (x, y) => { const c = '#2a2038', l = '#4a3c66'; g.rect(x - 9, y - 16, 18, 16, c); for (const [dx, h2] of [[-14, 26], [-3, 34], [9, 24]]) { g.rect(x + dx, y - h2, 6, h2, c); g.rect(x + dx, y - h2, 1, h2, l); g.poly([[x + dx - 1, y - h2], [x + dx + 3, y - h2 - 9], [x + dx + 7, y - h2]], '#5a2a4a', { hi: '#8a4a7a', lo: '#2a1028', depth: 1 }); g.rect(x + dx + 2, y - h2 + 5, 2, 3, '#ff5a6a'); } g.rect(x - 2, y - 7, 4, 7, '#0e0a14'); g.px(x - 19, y - 30, '#fff6c8'); g.px(x + 20, y - 34, '#fff6c8'); },
    7: (x, y) => { cloud(x - 12, y + 2); cloud(x + 12, y + 2); cloud(x, y + 3); const c = '#f0d268'; g.rect(x - 9, y - 16, 18, 14, c); g.rect(x - 9, y - 16, 2, 14, '#fff6c0'); for (const [dx, h2] of [[-14, 24], [-3, 32], [9, 24]]) { g.rect(x + dx, y - h2, 6, h2 - 2, c); g.rect(x + dx, y - h2, 2, h2 - 2, '#fff6c0'); g.poly([[x + dx - 1, y - h2], [x + dx + 3, y - h2 - 8], [x + dx + 7, y - h2]], '#4a8ae6', { hi: '#9cc8ff', lo: '#2a4a9a', depth: 1 }); } g.rect(x - 2, y - 9, 4, 7, '#7a5a1a'); g.px(x, y - 42, '#ffffff'); },
  };
  const boss = {}; for (const n of nodes) if (n.lv.boss) boss[n.lv.world] = n;
  const list = [];
  for (let wi = 1; wi <= 7; wi++) {
    const R = rng(4200 + wi * 97), x0 = (wi - 1) * WW, bn = boss[wi];
    for (let k = 0; k < 110; k++) {
      const x = Math.round(x0 + 6 + R() * (WW - 12)), y = Math.round(40 + R() * 150), r = R();
      if (!isLand(x, y - 6) || !isLand(x, y + 2) || worldAt(x, y) !== wi || !far(x, y, 13)) continue;
      if (bn && Math.abs(x - bn.x) < 30 && y < bn.y + 4 && y > bn.y - 50) continue;        // lugar do marco do chefe
      if (list.some(o => Math.abs(o.x - x) < 11 && Math.abs(o.y - y) < 9)) continue;
      list.push({ x, y, wi, r });
    }
    if (bn) list.push({ x: bn.x, y: bn.y - 13, wi, marco: true });
  }
  list.sort((a, b) => a.y - b.y);
  for (const o of list) {
    const { x, y, r } = o;
    if (o.marco) { marcos[o.wi](x, y); continue; }
    switch (o.wi) {
      case 1: if (r < 0.72) tree(x, y); else if (r < 0.86) rock(x, y, '#8a8a96'); else { g.px(x, y - 1, '#ffe27a'); g.px(x + 3, y, '#ff8fb0'); g.px(x - 2, y + 1, '#ffffff'); } break;
      case 2: if (r < 0.55) pine(x, y); else if (r < 0.8) mount(x, y, 0.7, '#8fa0bd', '#ffffff'); else rock(x, y, '#a9c4e0'); break;
      case 3: if (r < 0.4) dead(x, y, '#3a3226'); else if (r < 0.75) reed(x, y); else tree(x, y); break;
      case 4: if (r < 0.42) cactus(x, y); else if (r < 0.62) mount(x, y, 0.6, '#c08a48'); else if (r < 0.78) palm(x, y); else rock(x, y, '#b98a4a'); break;
      case 5: if (r < 0.34) pool(x, y); else if (r < 0.62) rock(x, y, '#5a4a50'); else if (r < 0.82) mount(x, y, 0.65, '#3c2a2e'); else dead(x, y, '#1e1416'); break;
      case 6: if (r < 0.42) tomb(x, y); else if (r < 0.8) dead(x, y, '#1c1626'); else rock(x, y, '#4a4060'); break;
      default: if (r < 0.7) cloud(x, y); else pillar(x, y);
    }
  }
  // --- trilha: borda escura e miolo na cor de cada mundo ---
  for (const s of Mapa.segs) for (const [x, y] of s) g.rect(x - 2, y - 1, 5, 4, '#2a1c14');
  for (const s of Mapa.segs) for (const [x, y] of s) g.rect(x - 1, y, 3, 2, shade(BIOMAS[worldAt(x, y)].road, -0.28));
  return (Mapa.bg = g.toCanvas());             // (o nome de cada mundo é texto da página, por cima do mapa: ver openMap)
}
// texto da fonte 3x5 com contorno, direto nos pixels do mapa
function mapText(g, str, x, y, col, s = 2, edge = '#14101e') {
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1]]) drawTextRaw(g, str, x + ox * s / 2, y + oy * s / 2, edge, s);
  drawTextRaw(g, str, x, y, col, s);
}

// ---------- Pontos, estrelas e ícones (pequenas imagens prontas) ----------
const _mapImg = {};
function mapDisc(kind) {
  if (_mapImg[kind]) return _mapImg[kind];
  const big = kind.startsWith('boss'), r = big ? 10 : 8, g = new PX(r * 2 + 4, r * 2 + 6), cx = r + 2, cy = r + 2;
  const pal = { done: ['#ffd23f', '#fff2a0', '#b9781f'], novo: ['#e63946', '#ff9aa5', '#8a1c2a'], lock: ['#5a5470', '#7a7494', '#34304a'], bossdone: ['#ffd23f', '#fff2a0', '#b9781f'], bossnovo: ['#b02a3c', '#ff7a8a', '#5a1020'], bosslock: ['#4a4460', '#6a6484', '#2a263c'] }[kind];
  g.ell(cx, cy + 3, r + 1, r, '#14101e', { flat: true });                                   // base (dá altura ao botão)
  g.ell(cx, cy + 2, r, r - 1, pal[2], { flat: true });
  g.ell(cx, cy, r + 1, r, '#14101e', { flat: true });
  g.ell(cx, cy, r, r - 1, pal[0], { hi: pal[1], lo: pal[2], depth: 2 });
  if (big) {                                                                                 // caveira do chefe
    const k = kind === 'bosslock' ? '#8a84a4' : '#fff6e8', d = '#1b1423';
    g.rect(cx - 4, cy - 5, 8, 6, k); g.rect(cx - 3, cy - 6, 6, 1, k); g.rect(cx - 3, cy + 1, 6, 2, k);
    g.rect(cx - 3, cy - 3, 2, 2, d); g.rect(cx + 1, cy - 3, 2, 2, d); g.px(cx, cy, d); g.px(cx - 1, cy, d); g.px(cx - 2, cy + 2, d); g.px(cx, cy + 2, d); g.px(cx + 2, cy + 2, d);
  } else if (kind === 'lock') { g.rect(cx - 3, cy - 1, 6, 5, '#2a263c'); g.rect(cx - 2, cy - 4, 4, 3, '#2a263c'); g.rect(cx - 1, cy - 3, 2, 2, pal[0]); g.px(cx, cy + 1, pal[1]); }
  const c = g.toCanvas(); c.cx = cx; c.cy = cy;
  return (_mapImg[kind] = c);
}
function mapStar(on) {
  const k = 'star' + on;
  return _mapImg[k] || (_mapImg[k] = outline(fromMap(['..#..', '.###.', '#####', '.###.', '.#.#.'], { '#': on ? '#ffd23f' : '#4a4266' }), '#14101e'));
}

// ---------- Tela ----------
// Monta o mapa para o herói aberto: botões invisíveis sobre os pontos (clique, toque, foco do teclado e do controle)
function openMap() {
  const sv = Game.save, nodes = mapNodes(), open = clamp(sv.unlocked | 0, 1, nodes.length);
  mapBuild();
  // próxima fase a jogar: a primeira liberada e ainda sem recorde (ou a última liberada)
  let next = nodes.findIndex(n => n.i + 1 <= open && !sv.best[n.lv.id]);
  if (next < 0) next = open - 1;
  const same = Mapa.hero === sv.cur && Mapa.at >= 0 && Mapa.at + 1 <= open;
  Mapa.hero = sv.cur; Mapa.moving = false; Mapa.pend = false; Mapa.follow = true; Mapa.t = 0;
  Mapa.u = Mapa.sel = same ? Mapa.at : next;
  const ch = sv.char || DEFAULT_CHAR, key = JSON.stringify(ch);
  if (key !== Mapa.sprKey) { Mapa.sprKey = key; Mapa.spr = buildPlayerSprites({ ...DEFAULT_CHAR, ...ch }); }
  const inner = $('#map-inner');
  $$('.map-node, .map-world', inner).forEach(b => b.remove());
  for (let wi = 1; wi <= 7; wi++) {                 // nome de cada mundo no alto (apagado enquanto o mundo está fechado)
    const first = nodes.find(n => n.lv.world === wi), el = document.createElement('span');
    el.className = 'map-world' + (first && first.i + 1 > open ? ' off' : '');
    el.textContent = `Mundo ${wi} · ${WORLDS[wi]}`; el.style.left = ((wi - 0.5) * MAPA.WW / MAPA.W * 100) + '%';
    inner.appendChild(el);
  }
  for (const n of nodes) {
    const b = document.createElement('button');
    b.className = 'map-node' + (n.lv.boss ? ' boss' : ''); b.type = 'button'; b.disabled = n.i + 1 > open;
    b.style.left = (n.x / MAPA.W * 100) + '%'; b.style.top = (n.y / MAPA.H * 100) + '%';
    b.title = (n.lv.boss ? 'Chefe' : n.lv.wn + '-' + n.lv.ln) + ' · ' + n.lv.name; b.setAttribute('aria-label', b.title);
    b.addEventListener('pointerdown', () => { Mapa.wasSel = Mapa.sel === n.i; });      // já era a fase escolhida antes deste clique?
    b.addEventListener('focus', () => mapSelect(n.i));
    // mouse/toque: o primeiro clique leva o herói até o ponto, o segundo começa a fase. Teclado/controle (foco já está no ponto): começa.
    b.addEventListener('click', e => { Snd.init(); if (e.detail === 0 || Mapa.wasSel) mapPlay(); else mapSelect(n.i); });
    inner.appendChild(b);
  }
  mapInfo();
  if (same && next > Mapa.at && !sv.best[nodes[next].lv.id]) mapSelect(next);          // fase nova liberada: o herói já sai andando até ela
}
function mapLayout() {
  const vh = typeof UI !== 'undefined' ? UI.h : innerHeight;              // altura do palco dos menus (js/ui.js)
  const tight = vh < 520, avail = vh - (tight ? 132 : 230);
  Mapa.scale = clamp(Math.floor(avail / MAPA.H), 1, 3);
  const cv = $('#map-cv'); cv.style.width = MAPA.W * Mapa.scale + 'px'; cv.style.height = MAPA.H * Mapa.scale + 'px';
  $('#map-inner').style.setProperty('--ms', Mapa.scale);
  mapCenter(true);
}
function mapCenter(now) {
  const sc = $('#map-scroll'), [x] = mapPoint(Mapa.u), want = clamp(x * Mapa.scale - sc.clientWidth / 2, 0, Math.max(0, sc.scrollWidth - sc.clientWidth));
  if (now) sc.scrollLeft = want; else sc.scrollLeft += (want - sc.scrollLeft) * 0.18;
  return Math.abs(want - sc.scrollLeft);
}
function mapInfo() {
  const n = mapNodes()[Mapa.sel], lv = n.lv, best = Game.save.best[lv.id];
  $('#map-name').textContent = (lv.boss ? '☠ Chefe' : lv.wn + '-' + lv.ln) + ' · ' + lv.name;
  const stars = best ? '★'.repeat(best.stars) + '<i>' + '★'.repeat(3 - best.stars) + '</i>' : '<i>★★★</i>';
  $('#map-sub').innerHTML = `Mundo ${lv.world} · ${WORLDS[lv.world]} <span class="st">${stars}</span> ` + (best ? 'Moedas: ' + best.coins : lv.boss ? (n.i === LEVELS.length - 1 ? 'Chefe final' : 'Chefe do mundo') : 'Nova!');
  $('#b-map-play').style.display = Net.role === 'client' ? 'none' : '';
}
// escolhe a fase i: o herói anda pela trilha até lá (mais rápido se for longe)
function mapSelect(i) {
  const nodes = mapNodes(), open = clamp(Game.save.unlocked | 0, 1, nodes.length);
  if (i < 0 || i + 1 > open || i === Mapa.sel) return;
  let d = 0; for (let k = Math.floor(Math.min(Mapa.u, i)); k < Math.ceil(Math.max(Mapa.u, i)) && k < Mapa.len.length; k++) d += Mapa.len[k];
  Mapa.sel = i; Mapa.v = clamp(d * 1.5, 170, 900); Mapa.pend = false; Mapa.follow = true;
  Snd.sfx('click'); mapInfo();
}
function mapStep(dir) {
  const btns = $$('#map-inner .map-node'), b = btns[Mapa.sel + dir];
  if (b && !b.disabled) b.focus({ preventScroll: true });
}
// começa a fase escolhida (se o herói ainda está a caminho, assim que ele chegar)
function mapPlay() {
  if (Net.role === 'client') return;
  if (Mapa.moving || Mapa.u !== Mapa.sel) { Mapa.pend = true; Mapa.v = Math.max(Mapa.v, 520); return; }
  Snd.sfx('check'); beginLevel(Mapa.sel);
}
// chamado a cada quadro enquanto o mapa está na tela
function mapFrame(dt) {
  if (!Mapa.bg || !Mapa.nodes) return;
  Mapa.t += dt;
  // anda pela trilha até a fase escolhida
  if (Mapa.u !== Mapa.sel) {
    const dir = Mapa.sel > Mapa.u ? 1 : -1, seg = clamp(dir > 0 ? Math.floor(Mapa.u + 1e-6) : Math.ceil(Mapa.u - 1e-6) - 1, 0, Mapa.len.length - 1);
    const [x0] = mapPoint(Mapa.u);
    Mapa.u += dir * Mapa.v * dt / Math.max(8, Mapa.len[seg]);
    if ((dir > 0 && Mapa.u >= Mapa.sel) || (dir < 0 && Mapa.u <= Mapa.sel)) Mapa.u = Mapa.sel;
    const [x1] = mapPoint(Mapa.u);
    if (Math.abs(x1 - x0) > 0.05) Mapa.face = x1 > x0 ? 1 : -1;
    Mapa.moving = Mapa.u !== Mapa.sel;
    if (!Mapa.moving) { Mapa.face = 1; if (Mapa.pend) { Mapa.pend = false; mapDraw(); mapPlay(); return; } }
  } else Mapa.moving = false;
  if (Mapa.follow && mapCenter(false) < 1 && !Mapa.moving) Mapa.follow = false;
  mapDraw();
}
function mapDraw() {
  const cv = $('#map-cv'), g = cv.getContext('2d'), { W, H, WW } = MAPA, sv = Game.save, nodes = Mapa.nodes, t = Mapa.t;
  const open = clamp(sv.unlocked | 0, 1, nodes.length);
  g.imageSmoothingEnabled = false;
  g.drawImage(Mapa.bg, 0, 0);
  // trilha liberada: miolo claro, com pontinhos que "andam" na direção da próxima fase
  for (let i = 0; i < Mapa.segs.length && i + 2 <= open; i++) {
    const s = Mapa.segs[i], col = BIOMAS[nodes[i].lv.world].road;
    for (let k = 0; k < s.length; k++) { g.fillStyle = (k + 400 - Math.floor(t * 6)) % 5 === 0 ? '#ffffff' : col; g.fillRect(Math.round(s[k][0]) - 1, Math.round(s[k][1]), 3, 2); }
  }
  // mundos ainda fechados: névoa escura e um cadeado
  for (let wi = 1; wi <= 7; wi++) {
    const first = nodes.find(n => n.lv.world === wi);
    if (!first || first.i + 1 <= open) continue;
    g.fillStyle = 'rgba(12, 8, 24, .55)'; g.fillRect((wi - 1) * WW, 0, WW, H);
    const lk = mapDisc('lock'); g.drawImage(lk, Math.round((wi - 0.5) * WW - lk.cx), 24);
  }
  // pontos das fases
  for (const n of nodes) {
    const best = sv.best[n.lv.id], locked = n.i + 1 > open, kind = (n.lv.boss ? 'boss' : '') + (locked ? 'lock' : best ? 'done' : 'novo'), img = mapDisc(kind);
    const bob = !locked && !best ? Math.round(Math.sin(t * 5) * 1.2) : 0;
    if (n.i === Mapa.sel) {                                   // anel branco pulsando em volta da fase escolhida
      const r = (n.lv.boss ? 14 : 12) + Math.round(Math.sin(t * 6) * 1.5);
      g.fillStyle = '#ffffff';
      for (let a = 0; a < Math.PI * 2; a += 0.1) g.fillRect(Math.round(n.x + Math.cos(a) * r) - 1, Math.round(n.y + 1 + Math.sin(a) * (r - 2)) - 1, 2, 2);
    }
    g.drawImage(img, n.x - img.cx, n.y - img.cy + bob);
    if (!n.lv.boss && !locked) mapText(g, n.lv.ln, n.x - 2, n.y - 5 + bob, best ? '#5a3a10' : '#ffffff', 2, best ? '#fff2a0' : '#5a1020');
    if (best) for (let k = 0; k < 3; k++) g.drawImage(mapStar(k < best.stars ? 1 : 0), n.x - 11 + k * 8, n.y + (n.lv.boss ? 15 : 13));
  }
  // o herói: correndo pela trilha ou parado em cima da fase
  const [hx, hy] = mapPoint(Mapa.u), spr = Mapa.spr;
  g.fillStyle = 'rgba(10, 6, 20, .35)'; g.fillRect(Math.round(hx) - 7, Math.round(hy) + 2, 14, 3); g.fillRect(Math.round(hx) - 5, Math.round(hy) + 5, 10, 1);
  if (spr) {
    const img = Mapa.moving ? spr.get('run', Math.floor(t * 14) % 8) : spr.get('idle', (t % 3.3) < 0.13 ? 4 : Math.floor(t * 3.5) % 4);
    // 75% do tamanho do herói do jogo (pés em y = 92 e centro em x = 48 da célula de 96 px)
    const K = MAPA.HERO, sz = Math.round(96 * K), x = Math.round(hx - 48 * K), y = Math.round(hy + 4 - 92 * K);
    if (Mapa.face < 0) { g.save(); g.translate(x + sz, y); g.scale(-1, 1); g.drawImage(img, 0, 0, sz, sz); g.restore(); } else g.drawImage(img, x, y, sz, sz);
  }
}
// teclado: ← → (ou A D) andam entre as fases liberadas; Enter/Espaço começam
addEventListener('keydown', e => {
  if (!Mapa.on || e.target.tagName === 'INPUT') return;
  const d = e.code === 'ArrowLeft' || e.code === 'KeyA' ? -1 : e.code === 'ArrowRight' || e.code === 'KeyD' ? 1 : 0;
  if (d) { e.preventDefault(); mapStep(d); }
  else if ((e.code === 'Enter' || e.code === 'Space') && !(document.activeElement && document.activeElement.tagName === 'BUTTON')) { e.preventDefault(); mapPlay(); }
});
addEventListener('resize', () => { if (Mapa.on) mapLayout(); });
// arrastar/rolar o mapa com a mão: para de seguir o herói até a próxima escolha
addEventListener('wheel', e => { if (Mapa.on && e.target.closest && e.target.closest('#map-scroll')) { Mapa.follow = false; const sc = $('#map-scroll'); if (!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) sc.scrollLeft += e.deltaY; } }, { passive: true });
addEventListener('touchmove', e => { if (Mapa.on && e.target.closest && e.target.closest('#map-scroll')) Mapa.follow = false; }, { passive: true });
