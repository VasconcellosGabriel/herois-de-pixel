'use strict';
// ---------- HQ: as cenas da história em páginas de história em quadrinhos ----------
// Cada cena (js/historia.js) tem páginas; cada página tem um layout e quadros. Os quadros são pintados com os sprites
// do próprio jogo (heróis do jogador, chefes, cenários) numa tela de "pixels de alta resolução" e ampliados sem
// suavizar; os textos (recordatórios, balões e onomatopeias) são escritos por cima, na resolução da tela.
// Texto: @G @M @A @D = nome do herói de cada classe · {G:masculino|feminino} = palavra conforme o corpo desse herói ·
// um objeto { guerreiro: '...', mago: '...', ... } = texto conforme a classe de quem joga (ponto de vista).
const HQ_W = 960, HQ_H = 540, HQ_M = 12, HQ_GAP = 12, HQ_FONT = '"Press Start 2P", ui-monospace, monospace';
const HQ_PAPEL = '#efe4c8', HQ_TINTA = '#0e0a14';
const HQ_LETRA = { guerreiro: 'G', mago: 'M', arqueiro: 'A', dragonico: 'D' };

// layouts: [x, y, largura, altura] em frações da área útil da página
const HQ_LAYOUT = {
  um: [[0, 0, 1, 1]],
  dois: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]],
  duasLinhas: [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]],
  tres: [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  tresB: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 1, 0.5]],
  tresL: [[0, 0, 0.56, 1], [0.56, 0, 0.44, 0.5], [0.56, 0.5, 0.44, 0.5]],
  tresR: [[0, 0, 0.44, 0.5], [0, 0.5, 0.44, 0.5], [0.44, 0, 0.56, 1]],
  tresC: [[0, 0, 0.34, 1], [0.34, 0, 0.33, 1], [0.67, 0, 0.33, 1]],
  quatro: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  quatroL: [[0, 0, 1, 0.5], [0, 0.5, 0.34, 0.5], [0.34, 0.5, 0.33, 0.5], [0.67, 0.5, 0.33, 0.5]],
};
function hqRect(f) {
  const iw = HQ_W - HQ_M * 2 + HQ_GAP, ih = HQ_H - HQ_M * 2 + HQ_GAP;
  const x = Math.round(HQ_M + f[0] * iw), y = Math.round(HQ_M + f[1] * ih);
  return { x, y, w: Math.round(HQ_M + (f[0] + f[2]) * iw) - HQ_GAP - x, h: Math.round(HQ_M + (f[1] + f[3]) * ih) - HQ_GAP - y };
}

// ---------- Elenco ----------
// O herói de quem joga entra no lugar da classe dele; as outras classes são os heróis prontos (no multiplayer local,
// os heróis dos outros jogadores entram no lugar da classe deles).
const HQ_BERTRAND = () => ({ ...lookOf('guerreiro', 0), name: 'Sir Bertrand', build: 2, height: 2, face: 4, hair: 1, hairColor: '#8a8a98', weaponColor: '#e0523a', capeColor: '#9a1a14', secondary: '#9a1a14' });
function hqCast() {
  const me = Game.save.char || DEFAULT_CHAR, cast = { G: PRESETS[0], M: PRESETS[3], A: PRESETS[5], D: PRESETS[6] }, got = {};
  const todos = [me].concat(Local.on && typeof localRoster === 'function' ? localRoster().map(r => r.ch) : []);
  for (const ch of todos) { const k = HQ_LETRA[ch.cls] || 'G'; if (!got[k]) { cast[k] = ch; got[k] = 1; } }
  cast.P = me; cast.pov = CLASSES[me.cls] ? me.cls : 'guerreiro'; cast.B = HQ_BERTRAND();
  return cast;
}
function hqText(s, cast) {
  if (s && typeof s === 'object') s = s[cast.pov] !== undefined ? s[cast.pov] : (s.todos || '');
  return String(s || '').replace(/\{([GMADP]):([^|}]*)\|([^}]*)\}/g, (_, k, m, f) => (cast[k].body === 1 ? f : m))
    .replace(/@([GMADPB])/g, (_, k) => cast[k].name || 'Herói');
}

// ---------- Sprites recortados (sem a borda transparente) ----------
const HQ_SPR = {};
function hqCrop(c) {
  const g = c.getContext('2d', { willReadFrequently: true }), d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return c;
  const o = mk(x1 - x0 + 1, y1 - y0 + 1); o.getContext('2d').drawImage(c, -x0, -y0);
  return o;
}
const _hqSets = {};
function hqHeroSet(ch) { const k = JSON.stringify(ch); return _hqSets[k] || (_hqSets[k] = buildPlayerSprites(ch)); }
// close no rosto: cabeça e ombros, recortados da pose parada
function hqFace(ch, pose = 'idle', f = 0) {
  const img = hqHeroSet(ch).get(pose, f), fr = heroFrame(ch, pose, f), o = mk(42, 40), g = o.getContext('2d');
  g.drawImage(img, -(fr.hx0 - 10), -(fr.hy - 13));
  return o;
}
// Desenhos de cada "quem" que não é herói: chefes, inimigos e objetos de cena
const HQ_BUILD = {
  golem: o => golemSprite(o.pose || 'idle', o.f | 0, !!o.furia),
  yeti: o => yetiSprite(o.pose || 'idle', o.f | 0, !!o.furia),
  gosma: o => slimekingSprite(o.pose || 'idle', o.f | 0, !!o.furia),
  escorpiao: o => scorpkingSprite(o.pose || 'walk', o.f | 0, !!o.furia),
  dragao: o => dragonSprite(o.pose || 'fly', o.f | 0, !!o.furia),
  conde: o => vampireSprite(o.pose || 'idle', o.f | 0, !!o.furia),
  tita: o => titanSprite(o.pose || 'idle', o.f | 0, !!o.furia),
  cavaleiro: o => knightSprite(o.f | 0, o.pose || null),
  guarda: o => guardSprite(o.pose || 'walk', o.f | 0),
  fantasma: o => ghostSprite(o.f | 0, !!o.ataque),
  falcao: o => hawkSprite(o.f === undefined ? 1 : o.f, !!o.mergulho, HAWK_PAL[o.cor || 'brown']),
  lobo: o => wolfSprite(o.pose || 'wind', o.f | 0, WOLF_PAL[o.cor || 'gray']),
  diabrete: o => impSprite(o.f | 0, false),
  ferreiro: o => smithSprite(o.pose || 'walk', o.f | 0),
  mumia: o => mummySprite(o.pose || 'walk', o.f | 0),
  esqueleto: o => skeletonSprite(o.f | 0, false),
  cristal: o => hqCristal(!!o.rachado),
  carroca: () => hqCarroca(),
  tumulo: o => hqTumulo(!!o.flores, !!o.aberto),
  bussola: () => hqBussola(),
  cidadela: () => hqCidadela(),
  fogueira: () => hqFogueira(),
  bebe: () => hqBebe(),
  casa: () => hqCasa(),
  corrente: o => hqCorrente(o.n || 8),
};
function hqActorImg(a, cast) {
  const gen = typeof Pack !== 'undefined' ? Pack.gen : 0;
  if ('GMADB'.includes(a.who) && a.who.length === 1) {
    const ch = cast[a.who], pose = a.pose || 'idle', f = a.f | 0, k = 'h' + gen + JSON.stringify(ch) + pose + f + (a.rosto ? 'r' : '');
    return HQ_SPR[k] || (HQ_SPR[k] = a.rosto ? hqFace(ch, pose, f) : hqCrop(hqHeroSet(ch).get(pose, f)));
  }
  const b = HQ_BUILD[a.who]; if (!b) return null;
  const k = a.who + '|' + [a.pose, a.f, a.furia, a.cor, a.mergulho, a.ataque, a.rachado, a.flores, a.aberto, a.n].join(',');
  return HQ_SPR[k] || (HQ_SPR[k] = hqCrop(b(a)));
}

// ---------- Objetos de cena (pixel art no mesmo estilo dos sprites) ----------
function hqCristal(rachado) {
  const g = new PX(64, 72), C1 = ['#0e3a4a', '#1f7a8c', '#45c4d8', '#a8f4ff'];
  const pedra = (pts, k) => g.poly(pts, C1[k], { hi: C1[Math.min(3, k + 1)], lo: C1[0], depth: 2 });
  pedra([[30, 70], [22, 30], [32, 4], [42, 30], [36, 70]], 2);
  pedra([[18, 70], [10, 44], [16, 26], [24, 46], [26, 70]], 1);
  pedra([[38, 70], [44, 40], [54, 22], [56, 48], [48, 70]], 1);
  pedra([[4, 70], [6, 56], [12, 52], [14, 70]], 2); pedra([[52, 70], [58, 58], [62, 70]], 2);
  g.rect(30, 14, 2, 20, '#ffffff'); g.rect(29, 18, 1, 8, '#e0ffff');
  if (rachado) for (const [x, y] of [[33, 20], [32, 24], [34, 27], [33, 31], [35, 35], [34, 39], [36, 43], [35, 47], [31, 34], [29, 37]]) g.rect(x, y, 2, 2, '#1b1423');
  return outline(g.toCanvas(), INK);
}
function hqCarroca() {
  const g = new PX(96, 46), M = ['#3a2010', '#6a4020', '#9a6434', '#c8925a'];
  g.rect(8, 18, 80, 16, M[1]); g.rect(8, 18, 80, 3, M[2]); for (let x = 12; x < 88; x += 12) g.rect(x, 21, 1, 13, M[0]);
  g.rect(2, 26, 8, 3, M[0]);
  for (const cx of [24, 72]) { g.ell(cx, 36, 9, 9, M[0], { flat: true }); g.ell(cx, 36, 7, 7, M[2], { flat: true }); g.ell(cx, 36, 2, 2, M[0], { flat: true }); g.rect(cx - 7, 35, 14, 2, M[1]); g.rect(cx - 1, 29, 2, 14, M[1]); }
  return outline(g.toCanvas(), INK);
}
function hqTumulo(flores, aberto) {
  const g = new PX(40, 40), S = ['#3a3a48', '#5e5e70', '#8a8aa0', '#b8b8cc'];
  if (aberto) { g.rect(2, 32, 36, 8, '#1b1423'); g.rect(4, 33, 32, 2, '#2a1a10'); g.poly([[26, 20], [38, 26], [36, 34], [24, 30]], S[1], { hi: S[2], lo: S[0], depth: 1 }); }
  g.poly([[10, 38], [10, 12], [14, 6], [26, 6], [30, 12], [30, 38]], S[2], { hi: S[3], lo: S[0], depth: 2 });
  g.rect(18, 12, 4, 14, S[0]); g.rect(14, 16, 12, 3, S[0]);
  if (aberto) for (const [x, y] of [[16, 28], [22, 22], [12, 20]]) g.rect(x, y, 3, 1, S[0]);
  g.rect(4, 38, 32, 2, '#2a4a1a');
  if (flores) for (const [x, c] of [[6, '#ff4a2a'], [9, '#ffb02a'], [31, '#ff6a2a'], [34, '#ffd23f']]) { g.rect(x, 33, 1, 5, '#3a7a2a'); g.rect(x - 1, 31, 3, 2, c); g.px(x, 30, '#fff3a8'); }
  return outline(g.toCanvas(), INK);
}
function hqBussola() {
  const g = new PX(36, 44), B = ['#5a3a08', '#a8741a', '#e0a82a', '#ffe27a'];
  g.rect(16, 0, 4, 6, B[1]); g.ell(18, 24, 16, 16, B[2], { hi: B[3], lo: B[0], depth: 2 });
  g.ell(18, 24, 12, 12, '#12203a', { flat: true });
  g.poly([[18, 14], [22, 24], [18, 34], [14, 24]], '#45c4d8', { hi: '#a8f4ff', lo: '#0e3a4a', depth: 1 });
  g.rect(17, 15, 2, 6, '#ffffff');
  return outline(g.toCanvas(), INK);
}
function hqCidadela() {
  const g = new PX(120, 90), P = ['#1a1830', '#2e2a50', '#4a4478', '#7a74a8'], N = ['#5a6a8a', '#8a9ab8', '#c4d0e4'];
  for (const [x, w, h] of [[20, 14, 40], [38, 18, 58], [60, 12, 70], [76, 16, 50], [96, 12, 34]]) {
    g.rect(x, 74 - h, w, h, P[1]); g.rect(x, 74 - h, 2, h, P[2]);
    g.poly([[x - 2, 74 - h], [x + w / 2, 74 - h - 14], [x + w + 2, 74 - h]], P[2], { hi: P[3], lo: P[0], depth: 1 });
    for (let y = 80 - h; y < 70; y += 10) g.rect(x + w / 2 - 1, y, 2, 3, '#a8f4ff');
  }
  for (const [x, r] of [[14, 14], [36, 18], [62, 20], [88, 17], [108, 12]]) g.ell(x, 78, r, 10, N[1], { hi: N[2], lo: N[0], depth: 2 });
  return outline(g.toCanvas(), INK);
}
function hqFogueira() {
  const g = new PX(40, 34), M = ['#3a2010', '#6a4020', '#9a6434'];
  g.cap(6, 30, 34, 24, 5, M[1], { hi: M[2], lo: M[0], depth: 1 }); g.cap(6, 24, 34, 30, 5, M[1], { hi: M[2], lo: M[0], depth: 1 });
  g.poly([[10, 26], [14, 10], [18, 16], [20, 2], [24, 14], [27, 8], [30, 26]], '#ff7f1f', { hi: '#ffc24a', lo: '#b8301a', depth: 2 });
  g.poly([[15, 26], [18, 16], [20, 20], [22, 12], [25, 26]], '#fff3a8', { flat: true });
  return outline(g.toCanvas(), INK);
}
function hqBebe() {
  const g = new PX(30, 22);
  g.ell(14, 12, 13, 8, '#e8dcc0', { hi: '#ffffff', lo: '#a89878', depth: 2 });
  g.ell(22, 9, 5, 5, '#f1c27d', { hi: '#ffe0c8', lo: '#c68642', depth: 1 }); g.px(21, 8, '#1b1423'); g.px(24, 8, '#1b1423');
  g.rect(4, 12, 14, 1, '#a89878');
  return outline(g.toCanvas(), INK);
}
function hqCasa() {
  const g = new PX(90, 70), M = ['#1a0e08', '#3a2010', '#5a3418'];
  g.rect(10, 30, 70, 40, M[1]); g.rect(10, 30, 70, 2, M[2]);
  for (let x = 14; x < 80; x += 14) g.rect(x, 30, 3, 40, M[0]);
  g.poly([[4, 32], [45, 6], [60, 16], [52, 20], [86, 32]], M[1], { hi: M[2], lo: M[0], depth: 2 });
  g.rect(36, 46, 16, 24, '#ff7f1f'); g.rect(38, 48, 12, 22, '#ffc24a');
  g.rect(18, 40, 10, 10, '#ff7f1f'); g.rect(62, 40, 10, 10, '#ff7f1f');
  return outline(g.toCanvas(), INK);
}
function hqCorrente(n) {
  const g = new PX(14, n * 10 + 4);
  for (let i = 0; i < n; i++) i % 2 ? g.rect(5, i * 10 + 1, 4, 12, '#5e5e70') : g.ell(7, i * 10 + 7, 5, 6, '#8a8aa0', { hi: '#b8b8cc', lo: '#3a3a48', depth: 1 });
  return outline(g.toCanvas(), INK);
}

// ---------- Efeitos ----------
function hqRaio(g, R, x0, y0, x1, y1, cor = '#bff4ff') {
  const pts = [[x0, y0]], n = 9;
  for (let i = 1; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t + (R() - 0.5) * 22, y0 + (y1 - y0) * t]); }
  pts.push([x1, y1]);
  g.lineCap = 'square';
  for (const [wd, c] of [[7, 'rgba(120,200,255,.25)'], [4, cor], [2, '#ffffff']]) {
    g.strokeStyle = c; g.lineWidth = wd; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
  }
  for (let k = 0; k < 2; k++) {                                     // galhos do raio
    const a = pts[2 + ((R() * 5) | 0)]; let x = a[0], y = a[1];
    g.strokeStyle = cor; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 4; j++) { x += (R() < 0.5 ? -1 : 1) * (6 + R() * 10); y += 8 + R() * 8; g.lineTo(x, y); }
    g.stroke();
  }
}
// linhas de ação saindo do foco (fx, fy) em direção às bordas
function hqLinhas(g, w, h, fx, fy, cor, R) {
  g.fillStyle = cor;
  for (let i = 0; i < 46; i++) {
    const a = i / 46 * Math.PI * 2 + R() * 0.08, r0 = Math.min(w, h) * (0.32 + R() * 0.2), r1 = Math.max(w, h), da = 0.012 + R() * 0.02;
    g.beginPath(); g.moveTo(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0);
    g.lineTo(fx + Math.cos(a - da) * r1, fy + Math.sin(a - da) * r1); g.lineTo(fx + Math.cos(a + da) * r1, fy + Math.sin(a + da) * r1); g.fill();
  }
}
// retícula (os pontinhos da impressão das HQs)
function hqReticula(g, w, h, cor, sobe) {
  g.fillStyle = cor;
  for (let y = 0; y < h; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < w; x += 4) {
    const k = sobe ? 1 - y / h : y / h;
    if (k > 0.35) g.fillRect(x, y, k > 0.75 ? 2 : 1, k > 0.75 ? 2 : 1);
  }
}
// fogo em pixels (o mesmo ruído do especial do dragônico); azul = a Chama Azul
const HQ_FOGO = { laranja: ['#b8301a', '#ff7f1f', '#ffc24a', '#fff3a8'], azul: ['#1a2ab8', '#1f8aff', '#6ad8ff', '#e8fbff'] };
function hqFogo(g, x, y, wd, ht, seed, cores) {
  for (let i = 0; i < wd; i++) for (let j = 0; j < ht; j++) {
    const v = fnoise((i + seed) * 0.42, j * 0.3 - 1.7) * 1.3 - j / ht;
    if (v < 0.14) continue;
    g.fillStyle = cores[v > 0.66 ? 3 : v > 0.46 ? 2 : v > 0.28 ? 1 : 0]; g.fillRect(x + i, y - 1 - j, 1, 1);
  }
}
// sépia (lembranças) e tons de cor por cima do quadro inteiro
function hqSepia(c) {
  const g = c.getContext('2d', { willReadFrequently: true }), id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const m = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
    d[i] = Math.min(255, m * 1.07 + 30); d[i + 1] = Math.min(255, m * 0.9 + 16); d[i + 2] = m * 0.66;
  }
  g.putImageData(id, 0, 0);
}
const HQ_TOM = { noite: ['#0a1240', 0.55], alvorada: ['#ff9a5a', 0.22], vermelho: ['#a01020', 0.35], azul: ['#1a4ab8', 0.28], tempestade: ['#1a1838', 0.5], verde: ['#2a5a1a', 0.3], ouro: ['#ffb02a', 0.2] };

// fundo de um tema (o mesmo do jogo), com o chão do fundo alinhado ao chão do quadro
function hqBg(g, name, ow, oh, cam, gy, chao) {
  const bg = bgOf(name), K = 2, top = gy - (BGH - 52) * K;
  g.drawImage(bg.sky, 0, 0, ow, oh);
  for (const c of bg.clouds) {
    const span = BGW + c.img.width / HR, x = (((c.x - cam * c.par) % span) + span) % span - c.img.width / HR;
    g.drawImage(c.img, Math.round(x * K), Math.round((c.y - 12) * K + top), c.img.width / HR * K, c.img.height / HR * K);
  }
  for (const l of bg.layers) {
    const ox = -Math.floor(((cam * l.par) % BGW + BGW) % BGW) * K;
    for (let k = 0; k < 3; k++) g.drawImage(l.img, ox + k * BGW * K, top, BGW * K, BGH * K);
  }
  if (chao !== false && THEMES[name]) {                     // chão de blocos do tema
    for (let i = 0; i * 32 < ow + 32; i++) {
      const v = (hash2(i + cam, 0) * 3) | 0;
      g.drawImage(solidTile(name, 1, 0, v), i * 32, gy, 32, 32);
      for (let k = 1; gy + k * 32 < oh; k++) g.drawImage(solidTile(name, 0, Math.min(3, k - 1), v), i * 32, gy + k * 32, 32, 32);
    }
  }
}

// ---------- Um quadro ----------
// pn: { bg, cam, chao (fração da altura), z (zoom), tom, fx: [...], foco, cor, atores: [...], cap, falas, som }
function hqPanel(pn, R0, cast, seed) {
  const Z = pn.z || 2, ow = Math.ceil(R0.w / Z), oh = Math.ceil(R0.h / Z), c = mk(ow, oh), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const R = rng(seed), gy = Math.round(oh * (pn.chao === undefined ? 0.84 : pn.chao)), fx = pn.fx || [];
  const foco = pn.foco || [0.5, 0.45];
  // fundo
  if (pn.bg && THEMES[pn.bg]) hqBg(g, pn.bg, ow, oh, pn.cam | 0, gy, pn.semChao ? false : true);
  else {
    const cor = pn.bg || '#2a2040', gr = g.createLinearGradient(0, 0, 0, oh);
    gr.addColorStop(0, shade(cor, 0.25)); gr.addColorStop(1, shade(cor, -0.35));
    g.fillStyle = gr; g.fillRect(0, 0, ow, oh);
  }
  const tom = pn.tom && HQ_TOM[pn.tom];
  if (tom) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = Math.min(1, tom[1] * 1.6); g.fillStyle = tom[0]; g.fillRect(0, 0, ow, oh); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  if (fx.includes('reticula')) hqReticula(g, ow, oh, pn.corRet || 'rgba(0,0,0,.28)', true);
  if (fx.includes('linhas')) hqLinhas(g, ow, oh, foco[0] * ow, foco[1] * oh, pn.corLinhas || 'rgba(255,255,255,.55)', R);
  // atores (heróis, chefes, objetos), na ordem: os primeiros ficam atrás
  const anchors = {}, boxes = [];
  (pn.atores || []).forEach((a, i) => {
    const img = hqActorImg(a, cast); if (!img) return;
    const s = a.s || 1, dw = img.width * s, dh = img.height * s;
    const bx = Math.round(a.x * ow - dw / 2), by = Math.round((a.y !== undefined ? a.y * oh : gy + (a.dy | 0)) - (a.rosto && a.y === undefined ? 0 : 0) - dh);
    const y = a.rosto && a.y === undefined ? oh - dh : by;
    if (a.aura) {
      const r = Math.max(dw, dh) * 0.75, gr = g.createRadialGradient(bx + dw / 2, y + dh / 2, 0, bx + dw / 2, y + dh / 2, r);
      gr.addColorStop(0, a.aura); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(bx + dw / 2 - r, y + dh / 2 - r, r * 2, r * 2);
    }
    if (a.fogo) hqFogo(g, bx - 4, y + dh, dw + 8, Math.round(dh * 0.8), i * 7 + seed, HQ_FOGO[a.fogo]);
    const src = a.sil ? tintOf(img, a.sil) : img;
    g.save(); g.globalAlpha = a.alfa || 1;
    if (a.flip) { g.translate(bx + dw, y); g.scale(-1, 1); g.drawImage(src, 0, 0, dw, dh); }
    else g.drawImage(src, bx, y, dw, dh);
    g.restore();
    if (a.fogoFrente) hqFogo(g, bx, y + dh, dw, Math.round(dh * 0.45), i * 13 + seed, HQ_FOGO[a.fogoFrente]);
    const boca = a.boca || ('GMADB'.includes(a.who) ? [0.5, 0] : [0.5, 0.1]), bf = a.flip ? 1 - boca[0] : boca[0];
    const an = { x: (bx + dw * bf) / ow, y: (y + dh * boca[1]) / oh, b: (y + dh) / oh };
    anchors[i] = an; if (!anchors[a.who]) anchors[a.who] = an;
    if (!a.alfa || a.alfa > 0.5) boxes.push({ l: bx / ow, t: y / oh, r: (bx + dw) / ow, b: (y + dh) / oh, who: a.who, i });
  });
  if (fx.includes('raio')) hqRaio(g, R, ow * (pn.raioX || 0.7), 0, ow * (pn.raioX || 0.7) + (R() - 0.5) * 30, oh * (pn.raioY || 0.55));
  if (fx.includes('raio2')) hqRaio(g, R, ow * 0.2, 0, ow * 0.26, oh * 0.4);
  if (fx.includes('chuva')) { g.fillStyle = 'rgba(190,210,255,.5)'; for (let i = 0; i < ow * oh / 160; i++) { const x = R() * ow, y = R() * oh; for (let k = 0; k < 6; k++) g.fillRect(Math.round(x - k), Math.round(y + k * 2), 1, 2); } }
  if (fx.includes('neve')) { g.fillStyle = '#ffffff'; for (let i = 0; i < ow * oh / 260; i++) g.fillRect(Math.round(R() * ow), Math.round(R() * oh), R() < 0.3 ? 2 : 1, R() < 0.3 ? 2 : 1); }
  if (fx.includes('brasas')) for (let i = 0; i < ow * oh / 420; i++) { g.fillStyle = R() < 0.5 ? '#ffc24a' : '#ff7f1f'; g.fillRect(Math.round(R() * ow), Math.round(R() * oh), 1, R() < 0.4 ? 2 : 1); }
  if (fx.includes('brasasAzuis')) for (let i = 0; i < ow * oh / 300; i++) { g.fillStyle = R() < 0.5 ? '#6ad8ff' : '#e8fbff'; g.fillRect(Math.round(R() * ow), Math.round(R() * oh), 1, R() < 0.4 ? 2 : 1); }
  if (fx.includes('fogoChao')) hqFogo(g, 0, oh, ow, Math.round(oh * 0.3), seed, HQ_FOGO.laranja);
  if (fx.includes('clarao')) { g.fillStyle = 'rgba(230,245,255,.25)'; g.fillRect(0, 0, ow, oh); }
  if (fx.includes('sepia')) hqSepia(c);
  return { img: c, Z, anchors, boxes };
}

// ---------- Textos (na resolução da página) ----------
function hqWrap(g, txt, maxW) {
  const out = [];
  for (const par of txt.split('\n')) {
    let line = '';
    for (const w of par.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
const HQ_FS = 13, HQ_LH = 20, HQ_PAD = 11;
function hqBox(g, txt, maxW, fs = HQ_FS) {
  g.font = fs + 'px ' + HQ_FONT;
  const lines = hqWrap(g, txt, maxW - HQ_PAD * 2), lw = Math.max(...lines.map(l => g.measureText(l).width));
  return { lines, w: Math.ceil(lw + HQ_PAD * 2), h: lines.length * HQ_LH + HQ_PAD * 2 - (HQ_LH - fs), fs };
}
const hqHit = (a, b) => a.x < b.x + b.w + 6 && b.x < a.x + a.w + 6 && a.y < b.y + b.h + 6 && b.y < a.y + a.h + 6;
// monta recordatórios, balões e onomatopeias de um quadro (posições na página)
function hqLayoutText(g, pn, R, pr, cast) {
  const out = [], used = [];
  // onomatopeias primeiro: ficam atrás dos balões, que desviam delas
  for (const s of pn.som ? (Array.isArray(pn.som) ? pn.som : [pn.som]) : []) {
    const fs = s.tam || 34, w = s.t.length * fs * 0.95, x = R.x + s.x * R.w, y = R.y + s.y * R.h;
    out.push({ kind: 'som', t: s.t, x, y, cor: s.cor || '#ffd23f', fs, rot: s.rot === undefined ? -0.12 : s.rot });
    used.push({ kind: 'som', x: x - w / 2, y: y - fs * 0.8, w, h: fs * 1.6 });
  }
  const caps = pn.cap === undefined ? [] : Array.isArray(pn.cap) ? pn.cap : [pn.cap];
  for (const c0 of caps) {
    const c = typeof c0 === 'string' || !c0.t ? { t: c0 } : c0, txt = hqText(c.t, cast); if (!txt) continue;
    const b = hqBox(g, txt, Math.min(R.w - 16, c.larg || 430), 12);
    b.x = c.pos === 'dir' || c.pos === 'baseDir' ? R.x + R.w - 8 - b.w : R.x + 8;
    b.y = c.pos === 'base' || c.pos === 'baseDir' ? R.y + R.h - 8 - b.h : R.y + 8;
    if (c.pos !== 'base' && c.pos !== 'baseDir') for (const u of used) if (hqHit(b, u)) b.y = u.y + u.h + 6;
    b.kind = 'cap'; out.push(b); used.push(b);
  }
  for (const s of pn.falas || []) {
    const txt = hqText(s.t, cast); if (!txt) continue;
    const an = pr.anchors[s.de !== undefined ? s.de : s.who];
    const b = hqBox(g, txt, Math.min(R.w - 20, s.larg || clamp(R.w * 0.42, 230, 400)), s.fs || HQ_FS);
    const ax = an ? R.x + an.x * R.w : s.fora === 'esq' ? R.x : R.x + R.w, ay = an ? R.y + an.y * R.h : R.y + R.h * 0.3;
    b.kind = s.grito ? 'grito' : s.pensa ? 'pensa' : 'fala';
    if (s.pos) { b.x = R.x + s.pos[0] * R.w; b.y = R.y + s.pos[1] * R.h; }
    else hqPlace(b, R, ax + (s.dx || 0), ay, used, pr.boxes.map(k => ({ x: R.x + k.l * R.w, y: R.y + k.t * R.h, w: (k.r - k.l) * R.w, h: (k.b - k.t) * R.h, spk: k.who === (s.de !== undefined ? s.de : s.who) })), out.filter(o => o.kind === 'fala' || o.kind === 'grito' || o.kind === 'pensa').pop());
    b.x = Math.round(b.x); b.y = Math.round(b.y);
    b.ax = ax; b.ay = ay + (an ? 4 : 0); b.kind = s.grito ? 'grito' : s.pensa ? 'pensa' : 'fala'; b.fora = !an; b.cor = s.cor;
    out.push(b); used.push(b);
  }
  return out;
}
// Procura o melhor lugar para um balão: perto (e acima) de quem fala, sem cobrir outros textos e cobrindo o mínimo
// possível dos personagens (principalmente as cabeças)
function hqPlace(b, R, ax, ay, used, boxes, prev) {
  const sp = u => (u.kind === 'grito' ? 16 : 0), m = 6 + sp(b);
  const ov = (x0, y0, x1, y1, u) => Math.max(0, Math.min(x1, u.x + u.w) - Math.max(x0, u.x)) * Math.max(0, Math.min(y1, u.y + u.h) - Math.max(y0, u.y));
  const tx = ax, ty = ay - 26 - b.h / 2;
  let best = null, bestP = Infinity;
  for (let y = R.y + 10 + sp(b); y <= R.y + R.h - 10 - b.h - sp(b); y += 6) for (let x = R.x + 10 + sp(b); x <= R.x + R.w - 10 - b.w - sp(b); x += 8) {
    let p = 0;
    for (const u of used) p += ov(x - m - sp(u), y - m - sp(u), x + b.w + m + sp(u), y + b.h + m + sp(u), u) * 80;
    for (const k of boxes) p += ov(x, y, x + b.w, y + b.h, k) * (k.spk ? 2 : 1.5) + ov(x, y, x + b.w, y + b.h, { x: k.x, y: k.y, w: k.w, h: k.h * 0.45 }) * 4;
    p += Math.hypot(x + b.w / 2 - tx, (y + b.h / 2 - ty) * 1.4) * 24;
    if (y + b.h * 0.5 > ay) p += 9000;
    // ordem de leitura: o próximo balão vem abaixo do anterior, ou à direita dele na mesma faixa
    if (prev && !(y + b.h / 2 >= prev.y + prev.h - 4 || (x >= prev.x + prev.w * 0.5 && y >= prev.y - 40))) p += 20000;
    // o rabicho não pode atravessar outro balão
    const bx = clamp(ax, x + 18, x + b.w - 18), by0 = y + b.h * 0.5 > ay ? y : y + b.h;
    for (let k = 1; k < 8; k++) { const qx = bx + (ax - bx) * k / 8, qy = by0 + (ay - by0) * k / 8; for (const u of used) if (u.kind !== 'cap' && qx > u.x && qx < u.x + u.w && qy > u.y && qy < u.y + u.h) p += 6000; }
    if (p < bestP) { bestP = p; best = [x, y]; }
  }
  if (best) { b.x = best[0]; b.y = best[1]; }
  else { b.x = clamp(ax - b.w / 2, R.x + 10, R.x + R.w - 10 - b.w); b.y = R.y + 10; }
}
function hqRound(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}
function hqDrawText(g, b) {
  if (b.kind === 'som') {
    g.save(); g.translate(b.x, b.y); g.rotate(b.rot); g.font = b.fs + 'px ' + HQ_FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = HQ_TINTA; g.strokeText(b.t, 4, 4); g.strokeText(b.t, 0, 0);
    g.fillStyle = b.cor; g.fillText(b.t, 0, 0); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(b.t, -2, -2); g.fillStyle = b.cor; g.fillText(b.t, -1, -1);
    g.restore(); return;
  }
  const { x, y, w, h } = b;
  g.lineWidth = 3; g.strokeStyle = HQ_TINTA;
  if (b.kind === 'cap') {
    g.fillStyle = HQ_TINTA; g.fillRect(x + 3, y + 3, w, h);
    g.fillStyle = '#ffe9a0'; g.fillRect(x, y, w, h); g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  } else {
    // rabicho do balão apontando para quem fala
    const bx = clamp(b.ax, x + 18, x + w - 18), below = b.ay > y + h, tipY = below ? Math.min(b.ay - 6, y + h + 42) : Math.max(b.ay + 6, y - 30);
    const by = below ? y + h - 2 : y + 2, tipX = b.fora ? (b.ax < x ? x - 26 : x + w + 26) : bx + (b.ax - bx) * 0.85;
    const tail = () => { g.beginPath(); g.moveTo(bx - 9, by); g.lineTo(b.fora ? tipX : tipX, b.fora ? y + h / 2 : tipY); g.lineTo(bx + 9, by); g.closePath(); };
    g.fillStyle = b.kind === 'grito' ? '#fff6c0' : b.cor || '#ffffff';
    if (b.kind === 'grito') {
      g.beginPath(); const n = 22, cx = x + w / 2, cy = y + h / 2;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = i % 2 ? 1.0 : 1.16; g.lineTo(cx + Math.cos(a) * (w / 2 + 8) * k, cy + Math.sin(a) * (h / 2 + 8) * k); }
      g.closePath(); g.fill(); g.stroke();
    } else if (b.kind === 'pensa') {
      hqRound(g, x, y, w, h, 16); g.fill(); g.setLineDash([6, 5]); g.stroke(); g.setLineDash([]);
      for (const [k, r] of [[0.45, 6], [0.75, 4]]) { g.beginPath(); g.arc(bx + (b.ax - bx) * k, by + (tipY - by) * k, r, 0, 7); g.fill(); g.stroke(); }
    } else {
      tail(); g.fill(); g.stroke();
      hqRound(g, x, y, w, h, 12); g.fill(); g.stroke();
      tail(); g.fill(); g.fillRect(bx - 7.5, below ? by - 3 : by, 15, 3);
    }
  }
  g.fillStyle = HQ_TINTA; g.font = b.fs + 'px ' + HQ_FONT; g.textBaseline = 'top'; g.textAlign = 'left';
  b.lines.forEach((l, i) => g.fillText(l, x + HQ_PAD, y + HQ_PAD + i * HQ_LH));
}

// ---------- Visualizador ----------
// guia: tela baixa (celular deitado): em vez da página inteira, a câmera aproxima um quadro de cada vez
const Hq = { on: false, cena: null, pi: 0, shown: 0, t0: 0, page: null, done: null, cast: null, raf: 0, scale: 1, guia: false, from: null };
function hqBuildPage(pg, cast, seed) {
  const L = HQ_LAYOUT[pg.layout || 'um'] || HQ_LAYOUT.um, cv = $('#hq-cv'), g = cv.getContext('2d');
  return pg.quadros.slice(0, L.length).map((pn, i) => {
    const R = hqRect(L[i]), pr = hqPanel(pn, R, cast, seed + i * 31);
    return { R, pr, txt: hqLayoutText(g, pn, R, pr, cast) };
  });
}
function hqResize() {
  const cv = $('#hq-cv'); if (!cv) return;
  const s = Math.min(innerWidth / HQ_W, innerHeight / HQ_H), dpr = Math.min(2, window.devicePixelRatio || 1);
  Hq.guia = HQ_H * s < 470;
  const cw = Hq.guia ? innerWidth : Math.floor(HQ_W * s), chh = Hq.guia ? innerHeight : Math.floor(HQ_H * s);
  cv.style.width = cw + 'px'; cv.style.height = chh + 'px';
  cv.width = Math.round(cw * dpr); cv.height = Math.round(chh * dpr); Hq.scale = s * dpr;
}
function hqDraw(now) {
  const cv = $('#hq-cv'), g = cv.getContext('2d'), P = Hq.page; if (!P) return;
  const age = (now - Hq.t0) / 1000;
  let view = { x: 0, y: 0, w: HQ_W, h: HQ_H };
  if (Hq.guia) {                                          // câmera no quadro atual (desliza a partir do anterior)
    const R = P[Hq.shown - 1].R, to = { x: R.x - 8, y: R.y - 8, w: R.w + 16, h: R.h + 16 }, f = Hq.from || to;
    const t = clamp(age / 0.35, 0, 1), e = t * t * (3 - 2 * t);
    view = { x: lerp(f.x, to.x, e), y: lerp(f.y, to.y, e), w: lerp(f.w, to.w, e), h: lerp(f.h, to.h, e) };
  }
  const k = Math.min(cv.width / view.w, cv.height / view.h);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b0710'; g.fillRect(0, 0, cv.width, cv.height);
  g.setTransform(k, 0, 0, k, (cv.width - view.w * k) / 2 - view.x * k, (cv.height - view.h * k) / 2 - view.y * k); g.imageSmoothingEnabled = false;
  g.fillStyle = HQ_PAPEL; g.fillRect(0, 0, HQ_W, HQ_H);
  P.forEach((q, i) => {
    if (i >= Hq.shown) return;
    const novo = i === Hq.shown - 1, a = novo ? clamp(age / 0.22, 0, 1) : 1, { R } = q;
    g.globalAlpha = a;
    g.fillStyle = HQ_TINTA; g.fillRect(R.x - 3, R.y - 3, R.w + 6, R.h + 6);
    g.save(); g.beginPath(); g.rect(R.x, R.y, R.w, R.h); g.clip();
    g.drawImage(q.pr.img, R.x, R.y, q.pr.img.width * q.pr.Z, q.pr.img.height * q.pr.Z);
    g.restore();
    g.globalAlpha = novo ? clamp((age - 0.12) / 0.2, 0, 1) : 1;
    g.save(); g.beginPath(); g.rect(R.x - 2, R.y - 2, R.w + 4, R.h + 4); g.clip();
    for (const b of q.txt) hqDrawText(g, b);
    g.restore();
    g.globalAlpha = 1;
  });
  // indicador de "continua": triângulo piscando no canto
  if (!Hq.guia && age > 0.4 && Math.floor(now / 400) % 2) { g.fillStyle = HQ_TINTA; g.beginPath(); g.moveTo(HQ_W - 30, HQ_H - 9); g.lineTo(HQ_W - 18, HQ_H - 4); g.lineTo(HQ_W - 30, HQ_H + 1); g.fill(); }
}
function hqLoop(now) { if (!Hq.on) return; Hq.raf = requestAnimationFrame(hqLoop); hqDraw(now); }
function hqOpenPage(i) {
  Hq.pi = i; Hq.shown = 1; Hq.t0 = performance.now(); Hq.from = null;
  Hq.page = hqBuildPage(Hq.cena.paginas[i], Hq.cast, (Hq.cena.seed || 7) * 101 + i * 17);
}
function hqNext() {
  if (!Hq.on || !Hq.page) return;
  if (performance.now() - Hq.t0 < 120) return;            // dois toques seguidos não pulam um quadro sem querer
  Snd.sfx('click');
  const R = Hq.page[Hq.shown - 1].R; Hq.from = { x: R.x - 8, y: R.y - 8, w: R.w + 16, h: R.h + 16 };
  if (Hq.shown < Hq.page.length) { Hq.shown++; Hq.t0 = performance.now(); return; }
  Hq.from = null;
  if (Hq.pi + 1 < Hq.cena.paginas.length) { hqOpenPage(Hq.pi + 1); return; }
  hqClose();
}
function hqClose() {
  if (!Hq.on) return;
  Hq.on = false; cancelAnimationFrame(Hq.raf); removeEventListener('resize', hqResize); Hq.page = null;
  const d = Hq.done; Hq.done = null; if (d) d();
}
// espera as folhas de sprite dos heróis da cena (no máximo ~1,5 s) para a página já sair com o desenho final
function hqWarm(cena, cast, cb) {
  for (const pg of cena.paginas) for (const pn of pg.quadros) for (const a of pn.atores || []) if (a.who.length === 1 && cast[a.who]) hqHeroSet(cast[a.who]).get(a.pose || 'idle', a.f | 0);
  const t0 = performance.now(), fontes = document.fonts ? document.fonts.load('13px ' + HQ_FONT).catch(() => {}) : Promise.resolve();
  const wait = () => (typeof Pack !== 'undefined' && Pack.pend > 0 && performance.now() - t0 < 1500 ? setTimeout(wait, 60) : fontes.then(cb, cb));
  wait();
}
function hqPlay(id, done) {
  const cena = typeof id === 'string' ? HIST.find(c => c.id === id) : id;
  if (!cena) { if (done) done(); return; }
  Hq.cena = cena; Hq.done = done || null; Hq.cast = hqCast();
  const sv = Game.save; if (sv && sv.cur >= 0) { sv.story = sv.story || {}; sv.story[cena.id] = 1; persist(); }
  Game.mode = 'menu'; Input.enabled = false; Input.clear();
  show('hq'); hqResize(); addEventListener('resize', hqResize);
  const cv = $('#hq-cv'), g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b0710'; g.fillRect(0, 0, cv.width, cv.height);
  Hq.on = true; Hq.page = null;
  hqWarm(cena, Hq.cast, () => { if (!Hq.on) return; hqOpenPage(0); Hq.raf = requestAnimationFrame(hqLoop); $('#b-hq-next').focus({ preventScroll: true }); });
}

// ---------- Quando as cenas aparecem ----------
// antes de uma fase (abertura do mundo) e depois de vencer um chefe; só na primeira vez de cada herói e fora do
// multiplayer online (lá o jogo não espera ninguém ler). Todas ficam na galeria "História" do mapa.
const hqSeen = id => !!(Game.save.story && Game.save.story[id]);
function hqBefore(idx, go) {
  if (Net.role) return false;
  const lv = LEVELS[idx], c = lv && HIST.find(c => c.antes === lv.id && !hqSeen(c.id));
  if (!c) return false;
  hqPlay(c, go); return true;
}
function hqAfter(idx, go) {
  if (Net.role) return false;
  const lv = LEVELS[idx], c = lv && HIST.find(c => c.depois === lv.id && !hqSeen(c.id));
  if (!c) return false;
  hqPlay(c, go); return true;
}
// galeria: capítulos já alcançados por este herói
function hqOpen(id) { const c = HIST.find(c => c.id === id); return !!c && (hqSeen(id) || (c.antes ? LEVELS.findIndex(l => l.id === c.antes) < (Game.save.unlocked | 0) : !!(Game.save.best || {})[c.depois])); }
function openStory() {
  const box = $('#hist-list'); box.innerHTML = '';
  for (const c of HIST) {
    const b = document.createElement('button'), ok = hqOpen(c.id);
    b.className = 'btn small hist-cap'; b.disabled = !ok;
    b.innerHTML = ok ? `<b>${c.cap}</b><span>${c.titulo}</span>` : `<b>${c.cap}</b><span>🔒 ???</span>`;
    if (ok) b.addEventListener('click', () => { Snd.init(); hqPlay(c, openStory); });
    box.appendChild(b);
  }
  show('hist');
  const f = $('.hist-cap:not(:disabled)', box); if (f && !document.body.classList.contains('touch')) f.focus({ preventScroll: true });
}
(() => {
  const cv = $('#hq-cv'); if (!cv) return;
  cv.addEventListener('click', hqNext);
  $('#b-hq-next').addEventListener('click', hqNext);
  $('#b-hq-back').addEventListener('click', () => { Snd.sfx('click'); hqClose(); });
  $('#b-hist-back').addEventListener('click', () => { Snd.sfx('click'); goLevels(); });
  $('#b-lv-hist').addEventListener('click', () => { Snd.init(); Snd.sfx('click'); openStory(); });
  addEventListener('keydown', e => {
    if (!Hq.on) return;
    if (e.code === 'Escape') { e.preventDefault(); hqClose(); return; }
    if (e.target.tagName === 'BUTTON' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) return;   // o próprio botão já avança
    if (['Enter', 'NumpadEnter', 'Space', 'ArrowRight', 'KeyJ', 'KeyZ'].includes(e.code)) { e.preventDefault(); hqNext(); }
  });
})();
