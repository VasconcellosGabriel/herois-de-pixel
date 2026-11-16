'use strict';
// ---------- Rig de recortes dos heróis (protótipo: abra o jogo com ?rig) ----------
// Cada peça do herói é uma imagem desenhada UMA vez (pasta sprites_rig/) e presa a um ponto do esqueleto que o jogo
// já calcula (skeletonFor + ik em sprites.js): a cabeça e o que vai nela seguem a cabeça, a roupa segue o tronco,
// braço/antebraço/coxa/canela giram junto com os ossos e a espada gira com a mão. Assim as 13 animações saem
// sozinhas de ~1 imagem por peça, em vez de um desenho por quadro.
// Peça que não existe em sprites_rig/ continua desenhada por código. As peças usam a PALETA-CHAVE (sprites/LEIA-ME.md),
// recolorida aqui com as cores do herói. Moldes: node tools/exportar-pecas.js · arte nova: node tools/importar-peca.js

const Rig = { img: {}, st: {}, pend: 0 };
// peças presas à cabeça / ao tronco (só acompanham a posição); o resto é osso (gira)
const RIG_HEAD = new Set(['cabeca', 'cabelo_frente', 'cabelo_tras', 'chapeu', 'acessorio', 'chifres']);
const RIG_BODY = new Set(['tronco', 'capa', 'capa_fecho', 'cachecol', 'capuz_ombro', 'costas', 'asas']);
// Peças que balançam com o movimento: têm variações (_v1, _v2...) escolhidas pela intensidade do vento (flow) ou pela
// abertura das asas (wing) de cada pose. Sem a variação, usa a peça base.
const RIG_VAR = { capa: 'flow', cabelo_tras: 'flow', cachecol: 'flow', asas: 'wing' };
const rigLevel = (s, S0) => RIG_VAR[s] === 'wing' ? S0.wing | 0 : S0.flow < 1.5 ? 0 : S0.flow < 4 ? 1 : 2;
// quadro usado para desenhar cada variação no molde
const RIG_VAR_POSE = { flow: [['idle', 0], ['run', 0], ['jump', 2]], wing: [['idle', 0], ['jump', 2], ['glide', 0], ['glide', 1]] };

const rigOn = () => RIG && !KEYMODE && typeof RIG_PECAS !== 'undefined';

// imagem da peça já carregada ({ w, h, d, px, py, len }) ou null (e dispara o download)
function rigGet(file) {
  const meta = RIG_PECAS[file];
  if (!meta) return null;
  if (Rig.st[file] === 'ok') return Rig.img[file];
  if (Rig.st[file]) return null;
  Rig.st[file] = 'baixando'; Rig.pend++;
  const im = new Image(), fim = st => {
    Rig.st[file] = st;
    if (--Rig.pend === 0 && typeof Pack !== 'undefined') Pack.gen++;     // refaz os sprites já montados
  };
  im.onload = () => {
    const c = mk(im.width, im.height), g = c.getContext('2d');
    g.drawImage(im, 0, 0);
    try { Rig.img[file] = { w: im.width, h: im.height, d: g.getImageData(0, 0, im.width, im.height).data, ...meta }; fim('ok'); }
    catch (e) { fim('erro'); }                                          // aberto como file://: o navegador não deixa ler
  };
  im.onerror = () => fim('erro');
  im.src = 'sprites_rig/' + file + '.png?v=' + (typeof RIG_VERSAO !== 'undefined' ? RIG_VERSAO : 1);
  return null;
}

// nomes das peças de um herói
function rigFiles(ch) {
  const fam = ch.cls === 'dragonico' ? 'dragonico' : 'humano', b = PACK_FIS[ch.build | 0], roupa = slugOf(OPTS.outfits[ch.outfit | 0]);
  const slot = {};
  for (const p of packParts(ch)) if (RIG_HEAD.has(p.slot) || RIG_BODY.has(p.slot)) slot[p.slot] = p.file;
  return {
    slot,
    braco: fam + '/roupa/' + roupa + '_' + b + '_braco', antebraco: fam + '/roupa/' + roupa + '_' + b + '_antebraco',
    coxa: fam + '/pernas/' + b + '_coxa', canela: fam + '/pernas/' + b + '_canela', bota: fam + '/pernas/bota',
    espada: 'humano/arma/espada',
  };
}

// Desenha a peça P com o pivô em (x, y), girada ang (radianos, sentido horário) e esticada sy no comprimento.
// Cores-chave viram as cores do herói (lut); dark < 1 escurece (braço e perna de trás).
PX.prototype.blit = function (P, x, y, ang = 0, o = {}) {
  const sy = o.sy || 1, ca = Math.cos(ang), sa = Math.sin(ang), L = o.lut, dk = o.dark || 1;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [u, v] of [[0, 0], [P.w, 0], [0, P.h], [P.w, P.h]]) {
    const dx = u - P.px, dy = (v - P.py) * sy, X = x + dx * ca - dy * sa, Y = y + dx * sa + dy * ca;
    x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
  }
  for (let Y = Math.max(0, Math.floor(y0)); Y <= Math.min(this.h - 1, Math.ceil(y1)); Y++) for (let X = Math.max(0, Math.floor(x0)); X <= Math.min(this.w - 1, Math.ceil(x1)); X++) {
    const rx = X + 0.5 - x, ry = Y + 0.5 - y;                       // volta para a imagem (rotação inversa)
    const su = Math.floor(rx * ca + ry * sa + P.px), sv = Math.floor((-rx * sa + ry * ca) / sy + P.py);
    if (su < 0 || sv < 0 || su >= P.w || sv >= P.h) continue;
    const si = (sv * P.w + su) * 4;
    if (P.d[si + 3] < 128) continue;
    let r = P.d[si], g = P.d[si + 1], b = P.d[si + 2];
    if (L) { const k = keyRGB(r, g, b); if (k) { const t = L[k.i], j = Math.round(k.v * 255) * 3; r = t[j]; g = t[j + 1]; b = t[j + 2]; } }
    const di = (Y * this.w + X) * 4;
    this.d[di] = r * dk; this.d[di + 1] = g * dk; this.d[di + 2] = b * (dk < 1 ? dk + 0.06 : 1); this.d[di + 3] = 255;
    this.ids[Y * this.w + X] = this.layer;
  }
};

// Liga o rig a um drawChar: devolve funções que desenham as peças (ou null se o rig está desligado)
function rigFor(g, ch, S0) {
  if (!rigOn()) return null;
  const F = rigFiles(ch), lut = packLut(ch);
  const get = f => f && rigGet(f);
  // osso de (ax, ay) até (bx, by): a imagem é desenhada "para baixo" a partir do pivô e esticada até o comprimento do osso
  const bone = (P, ax, ay, bx, by, dark) => {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    g.blit(P, ax, ay, Math.atan2(-dx, dy), { sy: P.len ? len / P.len : 1, lut, dark });
  };
  return {
    // peça presa à cabeça ou ao tronco: true se desenhou (e o código não precisa desenhar)
    // (o pivô da peça é o ponto da cabeça ou do tronco no quadro em que o molde foi desenhado)
    slot(s, head, body) {
      let file = F.slot[s];
      const lv = RIG_VAR[s] ? rigLevel(s, S0) : 0;
      let ang = 0;
      if (lv && RIG_PECAS[file + '_v' + lv]) file += '_v' + lv;
      // capa sem variações (arte importada única): gira para trás, presa nos ombros, conforme o vento da pose
      else if (s === 'capa' && !RIG_PECAS[file + '_v1']) ang = (6 + S0.flow * 9) * Math.PI / 180;
      const P = get(file);
      if (!P) return false;
      const [ax, ay] = RIG_HEAD.has(s) ? head : body;
      g.blit(P, ax, ay, ang, { lut });
      return true;
    },
    has: s => !!(F.slot[s] && RIG_PECAS[F.slot[s]]),
    arm(sx, sy, ex, ey, hx, hy, dark) {
      const A = get(F.braco), B = get(F.antebraco);
      if (!A || !B) return false;
      bone(A, sx, sy, ex, ey, dark); bone(B, ex, ey, hx, hy, dark);
      return true;
    },
    armReady: () => !!(RIG_PECAS[F.braco] && RIG_PECAS[F.antebraco]),
    leg(hx, hy, kx, ky, fx, fy, dark) {
      const A = get(F.coxa), B = get(F.canela), C = get(F.bota);
      if (!A || !B || !C) return false;
      bone(A, hx, hy, kx, ky, dark); bone(B, kx, ky, fx, fy, dark);
      g.blit(C, Math.round(fx), Math.round(fy), 0, { lut, dark });
      return true;
    },
    legReady: () => !!(RIG_PECAS[F.coxa] && RIG_PECAS[F.canela] && RIG_PECAS[F.bota]),
    // espada: o molde aponta para cima com o pivô no cabo; wAng é o ângulo da lâmina usado em drawBlade
    sword(x, y, wAng) {
      const P = get(F.espada);
      if (!P) return false;
      g.blit(P, x, y, Math.PI - wAng * Math.PI / 180, { lut });
      return true;
    },
  };
}

// ---------- Moldes (usado por tools/exportar-pecas.js) ----------
// Gera uma imagem por peça a partir do desenho por código, na paleta-chave, com o pivô de cada uma.
// Servem de base para o artista (ou para encaixar arte gerada) e fazem o rig funcionar desde já.
function exportRig() {
  const keyCh = Object.fromEntries(KEY_CH.map(([k, h]) => [k, keyHex(h, KEY_BASE)]));
  const out = {}, meta = {};
  KEYMODE = true;
  const was = RIG; RIG = false;
  try {
    // peças presas à cabeça / ao tronco: a pose parada (quadro 0) da camada, célula inteira de 96x96
    for (const cls of ['guerreiro', 'dragonico']) {
      const base = { ...DEFAULT_CHAR, ...keyCh, cls, height: 2, build: 1, hair: 0, head: 0, cape: 0, acc: 0, outfit: 0, face: 0 };
      const job = (mod, slot) => {
        const ch = { ...base, ...mod }, part = packParts(ch).find(p => p.slot === slot);
        if (!part || out[part.file] !== undefined) return;
        (RIG_VAR[slot] ? RIG_VAR_POSE[RIG_VAR[slot]] : [['idle', 0]]).forEach(([pose, fr], v) => {
          const info = {}, c = drawChar(ch, pose, fr, { only: slot, raw: true, info }), a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
          let any = false; for (let i = 3; i < a.length; i += 4) if (a[i]) { any = true; break; }
          const file = part.file + (v ? '_v' + v : '');
          out[file] = any ? c.toDataURL() : null;
          if (any) { const [px, py] = RIG_HEAD.has(slot) ? info.head : info.body; meta[file] = { px, py }; }
        });
      };
      for (let b = 0; b < 3; b++) {
        for (let o = 0; o < OPTS.outfits.length; o++) job({ outfit: o, build: b }, 'tronco');
        for (let k = 1; k < OPTS.capes.length; k++) job({ cape: k, build: b }, 'capa');
        job({ cape: 1, build: b }, 'capa_fecho');
        job({ acc: 5, build: b }, 'cachecol');
        job({ head: 7, build: b }, 'capuz_ombro');
        if (cls === 'dragonico') job({ build: b }, 'asas');
        else for (const c2 of ['guerreiro', 'arqueiro']) job({ cls: c2, build: b }, 'costas');
      }
      for (let k = 0; k < OPTS.faces.length; k++) job({ face: k }, 'cabeca');
      for (let k = 1; k < OPTS.hairs.length; k++) { job({ hair: k }, 'cabelo_tras'); job({ hair: k }, 'cabelo_frente'); }
      for (let k = 1; k <= 4; k++) job({ acc: k }, 'acessorio');
      for (let k = 1; k < OPTS.heads.length; k++) job({ head: k }, 'chapeu');
      if (cls === 'dragonico') job({}, 'chifres');

      // ossos: braço, antebraço (com punho e mão), coxa, canela e bota, desenhados "para baixo" a partir do pivô
      const fam = cls === 'dragonico' ? 'dragonico' : 'humano', ch = base, drag = cls === 'dragonico';
      const put = (file, w, h, px, py, len, draw) => {
        if (out[file] !== undefined) return;
        const g = new PX(w, h); g.vol = true; draw(g); out[file] = g.toCanvas().toDataURL(); meta[file] = len ? { px, py, len } : { px, py };
      };
      // mesmas formas e tons de drawArm / drawLeg (js/sprites.js)
      const armLen = ARM_LEN, skin = ch.skin, sec = ch.secondary, goldL = '#fff4a8';
      for (let b = 0; b < 3; b++) {
        const B = PACK_FIS[b], aw = b === 2 ? 7 : 6, lw = b === 2 ? 8 : 7;
        for (let o = 0; o < OPTS.outfits.length; o++) {
          const roupa = slugOf(OPTS.outfits[o]), sleeve = o === 3 ? skin : o === 1 ? keyHex(KEY_HUE.armor, KEY_BASE) : ch.primary;
          const so = { depth: 1, round: aw / 2, spec: o === 1 ? toneHi(sleeve, 0.62) : null };
          put(fam + '/roupa/' + roupa + '_' + B + '_braco', 12, 16, 6, 4, armLen, g => g.cap(6, 4, 6, 4 + armLen, aw, sleeve, so));
          put(fam + '/roupa/' + roupa + '_' + B + '_antebraco', 12, 18, 6, 4, armLen, g => {
            g.cap(6, 4, 6, 4 + armLen, aw, sleeve, so);
            if (o !== 3) g.cap(6, 4 + armLen * 0.62, 6, 4 + armLen, aw + 0.6, sec, { depth: 1, round: aw / 2 });
            g.ell(6, 4 + armLen, 3.4, 3.3, skin, { hi: toneHi(skin, 0.2), lo: toneLo(skin, 0.26), round: 3.3, spec: toneHi(skin, 0.45) });
            if (drag) { g.px(8, 6 + armLen, goldL); g.px(9, 7 + armLen, goldL); }
          });
        }
        const L = LEG_HS[2] * 0.55 + 1.6, pants = toneLo(sec, 0.3);
        put(fam + '/pernas/' + B + '_coxa', 14, 18, 7, 4, L, g => g.cap(7, 4, 7, 4 + L, lw, pants, { depth: 1, round: lw / 2 }));
        put(fam + '/pernas/' + B + '_canela', 14, 18, 7, 4, L, g => g.cap(7, 4, 7, 4 + L, lw, pants, { depth: 1, round: lw / 2 }));
      }
      put(fam + '/pernas/bota', 20, 14, 6, 5, 0, g => {
        const bc = toneLo(sec, 0.56), x = 6, y = 5;
        g.poly([[x - 4, y - 3], [x + 4, y - 3], [x + 4, y - 1], [x + 7, y], [x + 9, y + 2], [x + 9, y + 5], [x - 4, y + 5]], bc, { round: 3, hi: toneHi(bc, 0.34), lo: toneLo(bc, 0.36), spec: toneHi(bc, 0.7) });
        g.rect(x - 4, y - 4, 9, 1, toneLo(sec, 0.06));
        g.rect(x - 4, y + 4, 14, 1, '#f4f0fa'); g.rect(x - 4, y + 5, 14, 1, '#a9a3bd');
        g.clear(x + 9, y + 5); g.clear(x - 4, y + 5);
      });
      if (!drag) put('humano/arma/espada', 32, 48, 16, 34, 0, g => heroBlade(g, 16, 34, 180, 27, 6, ch.weaponColor, '#8a5a2b', '#ffcf3a'));
    }
  } finally { KEYMODE = false; RIG = was; }
  const files = {};
  for (const k in out) if (out[k]) files[k] = out[k];
  return { files, meta };
}
