'use strict';
// ---------- Folhas de sprites (PNG) dos heróis ----------
// Cada parte do herói é uma folha PNG em sprites/ (corpo, roupa, cabelo, chapéu, arma...). As partes que o jogador
// escolhe a cor são pintadas com a PALETA-CHAVE (ver KEY_CH em sprites.js e sprites/LEIA-ME.md); o jogo empilha as
// camadas na ordem certa, troca as cores-chave pelas cores do personagem e põe o contorno.
// Sem as folhas (ou com ?procedural na URL), o herói continua sendo desenhado por código (drawChar).
// As folhas-base são geradas a partir do desenho por código: node tools/exportar-sprites.js

// linhas da folha: [pose, quadros]. Cada célula tem 96x96 px; as colunas são os quadros da animação.
const PACK_ROWS = [['idle', 5], ['run', 8], ['jump', 3], ['land', 1], ['crouch', 5], ['atk', 4], ['cast', 3], ['block', 1], ['hurt', 1], ['dash', 1], ['glide', 2], ['aim', 12], ['tuck', 1], ['flap', 4]];
const PACK_CELL = 96, PACK_COLS = 12;
// ordem de empilhamento (de trás para a frente)
const PACK_SLOTS = LAYER_ORDER;
const slugOf = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const PACK_ALT = OPTS.heights.map(slugOf), PACK_FIS = OPTS.builds.map(slugOf), PACK_LEG = LEG_HS;
const PACK_HUM = ['guerreiro', 'mago', 'arqueiro'];

// Camadas de um herói: { slot, file, shift }. shift = a folha foi desenhada para a altura "Alto" e só desce
// com a altura escolhida (tudo da cintura para cima; as pernas têm uma folha por altura).
// O corpo (pernas, tronco, cabeça, cabelo, chapéu, capa) é o mesmo para guerreiro, mago e arqueiro; o que muda com
// a classe são os braços (cada uma segura a arma de um jeito), a arma e o que vai nas costas.
function packParts(ch) {
  const fam = ch.cls === 'dragonico' ? 'dragonico' : 'humano', cls = fam === 'humano' && !PACK_HUM.includes(ch.cls) ? 'guerreiro' : ch.cls;
  const b = PACK_FIS[ch.build | 0], fem = ch.body === 1 ? '_f' : '', braco = fam === 'humano' ? '_' + cls : '', out = [];
  const add = (slot, file, shift = true) => out.push({ slot, file: fam + '/' + file, shift });
  const roupa = slugOf(OPTS.outfits[ch.outfit | 0]);
  if (fam === 'dragonico') add('asas', 'asas_' + b);
  if (ch.cape) { add('capa', 'capa/' + slugOf(OPTS.capes[ch.cape]) + '_' + b); add('capa_fecho', 'capa/fecho_' + b); }
  if (ch.hair) { add('cabelo_tras', 'cabelo/' + slugOf(OPTS.hairs[ch.hair]) + '_tras'); add('cabelo_frente', 'cabelo/' + slugOf(OPTS.hairs[ch.hair]) + '_frente'); }
  if (cls === 'guerreiro' || cls === 'arqueiro') add('costas', 'costas/' + cls + '_' + b);
  add('braco_tras', 'roupa/' + roupa + '_' + b + '_braco_tras' + braco);
  add('pernas', 'pernas/' + roupa + '_' + PACK_ALT[ch.height | 0] + '_' + b, false);
  add('tronco', 'roupa/' + roupa + '_' + b + fem + '_tronco');
  if (ch.acc === 5) add('cachecol', 'acessorio/cachecol_' + b);
  else if (cls === 'guerreiro') add('cachecol', 'acessorio/lenco_guerreiro');
  add('cabeca', 'rosto/' + slugOf(OPTS.faces[ch.face | 0]) + fem);
  if (fam === 'dragonico') add('chifres', 'chifres');
  if (ch.acc >= 1 && ch.acc <= 4) add('acessorio', 'acessorio/' + slugOf(OPTS.accs[ch.acc]));
  if (ch.head) add('chapeu', 'chapeu/' + slugOf(OPTS.heads[ch.head]));
  if (ch.head === 7) { add('capuz_ombro', 'chapeu/capuz_ombros_' + b); add('capuz_braco', 'chapeu/capuz_braco'); }
  if (fam === 'humano') add('arma', 'arma/' + cls);
  add('braco_frente', 'roupa/' + roupa + '_' + b + '_braco_frente' + braco);
  return out.sort((x, y) => PACK_SLOTS.indexOf(x.slot) - PACK_SLOTS.indexOf(y.slot));
}

// ---------- Carregamento ----------
// Só baixa as folhas dos heróis que aparecem (cada um usa ~10 das ~190). Enquanto não chegam, o herói é desenhado
// por código; quando chegam, gen muda e os sprites já montados são refeitos com as folhas.
const Pack = { on: false, gen: 0, img: {}, st: {}, pend: 0, has: null };
function loadPack() {
  if (typeof SPRITE_PACK === 'undefined' || /[?&]procedural/.test(location.search)) return;
  Pack.on = true; Pack.has = new Set(SPRITE_PACK.arquivos);
}
function packNeed(files) {
  let ok = true;
  for (const f of files) {
    if (Pack.st[f] === 'ok' || Pack.st[f] === 'erro') continue;
    ok = false;
    if (Pack.st[f]) continue;
    Pack.st[f] = 'baixando'; Pack.pend++;
    const im = new Image(), fim = st => { Pack.st[f] = st; if (st === 'ok') Pack.img[f] = im; if (--Pack.pend === 0) Pack.gen++; };
    im.onload = () => fim('ok'); im.onerror = () => fim('erro');
    im.src = 'sprites/' + f + '.png?v=' + (SPRITE_PACK.versao || 1);
  }
  return ok;
}

// ---------- Montagem ----------
const KEY_OF_CH = { accColor: ACC_OF, armor: ARMOR_OF, vest: VEST_OF, cheek: CHEEK_OF };
const _lut = new Map();
// tabela brilho-da-cor-chave -> cor final, por canal (o inverso do toneLo/toneHi usados no desenho)
// (guardada pelas cores, não pelo objeto: o criador de personagem muda as cores no mesmo objeto)
function packLut(ch) {
  const cols = KEY_CH.map(([k]) => KEY_OF_CH[k] ? KEY_OF_CH[k](ch) : ch[k] || DEF_COLORS[k]), key = cols.join();
  let L = _lut.get(key);
  if (L) return L;
  if (_lut.size > 64) _lut.clear();
  L = cols.map(u => {
    const t = new Uint8Array(256 * 3);
    for (let v = 0; v < 256; v++) {
      const V = v / 255, hex = V <= KEY_BASE ? toneLo(u, 1 - V / KEY_BASE) : toneHi(u, (V - KEY_BASE) / ((1 - KEY_BASE) * KEY_HI));
      const c = hexToRgb(hex); t[v * 3] = c[0]; t[v * 3 + 1] = c[1]; t[v * 3 + 2] = c[2];
    }
    return t;
  });
  _lut.set(key, L);
  return L;
}
const DEF_COLORS = { skin: '#f1c27d', hairColor: '#5a3825', primary: '#3b6fd6', secondary: '#8a5a2b', accent: '#ffd23f', weaponColor: '#dfe6f0', headColor: '#9aa5b1', capeColor: '#c0392b', eyes: '#2b6cb0' };

// ---------- Skin de cristal (prêmio por vencer os 7 desafios da Dimensão Prisma; só para a classe que venceu) ----------
// Cada parte é um ou mais canais da paleta-chave: na montagem, os pixels desses canais viram cristal facetado.
// when: a parte só aparece no criador quando o herói tem aquilo (chapéu, capa...).
const CRYS_PARTS = [
  { id: 'arma', name: 'Arma', ch: ['weaponColor'], when: c => c.cls !== 'dragonico' },
  { id: 'armadura', name: 'Armadura', ch: ['armor'] },
  { id: 'roupa', name: 'Roupa', ch: ['primary', 'secondary', 'vest'] },
  { id: 'chapeu', name: 'Chapéu', ch: ['headColor'], when: c => c.head > 0 },
  { id: 'capa', name: 'Capa', ch: ['capeColor'], when: c => c.cape > 0 || c.cls === 'guerreiro' },
  { id: 'detalhes', name: c => c.cls === 'dragonico' ? 'Asas' : 'Detalhes', ch: ['accent', 'accColor'] },
  { id: 'cabelo', name: 'Cabelo', ch: ['hairColor'], when: c => c.hair > 0 },
  { id: 'pele', name: c => c.cls === 'dragonico' ? 'Escamas' : 'Pele', ch: ['skin', 'cheek'] },
];
const CRYS_IDS = new Set(CRYS_PARTS.map(p => p.id));
const crysParts = ch => CRYS_PARTS.filter(p => !p.when || p.when(ch));
const crysName = (p, ch) => typeof p.name === 'function' ? p.name(ch) : p.name;
// lista de partes de cristal de um herói, conferida (vem do save ou da rede)
const crystalParts = ch => Array.isArray(ch && ch.crys) ? ch.crys.filter(x => CRYS_IDS.has(x)) : [];
// canais (índices de KEY_CH) que viram cristal
function crysChannels(ch) {
  const on = new Set(crystalParts(ch)), out = new Set();
  for (const p of CRYS_PARTS) if (on.has(p.id)) for (const k of p.ch) out.add(KEY_CH.findIndex(c => c[0] === k));
  out.delete(-1);
  return out;
}
// cor do cristal: um dos 7 cristais das fases (CRISTAIS, em js/levels.js); sem escolha = ciano
const crysCor = ch => Number.isInteger(ch && ch.crysCor) && ch.crysCor >= 0 && ch.crysCor < CRISTAIS.length ? ch.crysCor : 1;
// rampa de 8 tons a partir das 4 cores do cristal: sombra funda, corpo, luz e o branco do brilho
const _crysRamp = {};
function crysRamp(ch) {
  const n = crysCor(ch);
  if (_crysRamp[n]) return _crysRamp[n];
  const [d, m, l, w] = CRISTAIS[n].cor;
  return (_crysRamp[n] = [toneLo(d, 0.5), toneLo(d, 0.2), mix(d, m, 0.5), m, mix(m, l, 0.5), l, mix(l, w, 0.55), '#ffffff'].map(hexToRgb));
}
// cor de um pixel de cristal: o tom vem da sombra original (v); as facetas (losangos grandes) somam/tiram um degrau,
// a borda de cada faceta acende como aresta lapidada e alguns pontos brilham, mudando de quadro em quadro
function crysPixel(v, x, y, f, ramp) {
  const u = (x * 0.75 + y) / 7, w = (x * 0.75 - y) / 6, fu = Math.floor(u), fw = Math.floor(w);
  const h = hash2(fu, fw, 71), edge = u - fu < 0.14 || w - fw < 0.12;
  let i = Math.floor(clamp(v, 0, 1.15) * 6.4) + (h < 0.33 ? -1 : h > 0.72 ? 1 : 0) + (edge && v > 0.35 ? 1 : 0);
  if (v > 0.45 && hash2(x, y, 13 + f * 7) > 0.985) i = 7;                   // cintilar
  return ramp[clamp(i, 0, 7)];
}

function packChar(ch, pose, f) {
  if (!Pack.on || RIG) return null;                                  // no rig (?rig) o herói é montado por drawChar + js/rig.js
  if (pose === 'roll' || pose === 'flip') {
    const base = packChar(ch, 'tuck', 0);
    return base && rotated(base, pose === 'roll' ? f : -f, CX, FEET - 24);
  }
  const row = PACK_ROWS.findIndex(r => r[0] === pose);
  if (row < 0) return null;
  const parts = packParts(ch).filter(p => Pack.has.has(p.file));
  if (!packNeed(parts.map(p => p.file))) return null;               // ainda baixando: desenha por código por enquanto
  const c = mk(PACK_CELL, PACK_CELL), g = c.getContext('2d'), dy = PACK_LEG[2] - PACK_LEG[ch.height | 0];
  let any = false;
  // cabelo debaixo de chapéu, elmo ou capuz: as folhas têm o cabelo inteiro; aqui some o que ficaria para fora
  const cover = HAT_COVERS[ch.head] || 0, fr = cover ? heroFrame(ch, pose, f) : null, clip = cover ? hairClip(cover, fr.hx0, fr.hy) : null;
  // guarda de qual camada é cada pixel, para o traço de contato entre camadas (occlude, em sprites.js)
  const ids = new Uint8Array(PACK_CELL * PACK_CELL), tc = mk(PACK_CELL, PACK_CELL), tg = tc.getContext('2d', { willReadFrequently: true });
  for (const p of parts) {
    const im = Pack.img[p.file];
    if (!im) continue;
    tg.clearRect(0, 0, PACK_CELL, PACK_CELL);
    tg.drawImage(im, f * PACK_CELL, row * PACK_CELL, PACK_CELL, PACK_CELL, 0, p.shift ? dy : 0, PACK_CELL, PACK_CELL);
    let a, td;
    try { td = tg.getImageData(0, 0, PACK_CELL, PACK_CELL); a = td.data; }
    catch (e) { Pack.on = false; Pack.gen++; return null; }          // jogo aberto direto do arquivo (file://): o navegador não deixa ler os PNGs
    if (clip && HAIR_LAYERS.has(p.slot)) {
      for (let y = 0; y < PACK_CELL; y++) for (let x = 0; x < PACK_CELL; x++) if (!clip(x, y)) a[(y * PACK_CELL + x) * 4 + 3] = 0;
      tg.putImageData(td, 0, 0);
    }
    const lid = LAYER_ORDER.indexOf(p.slot) + 1;
    for (let j = 0; j < ids.length; j++) if (a[j * 4 + 3]) ids[j] = lid;
    g.drawImage(tc, 0, 0);
    any = true;
  }
  if (!any) return null;
  // troca as cores-chave pelas cores do personagem
  let id;
  try { id = g.getImageData(0, 0, PACK_CELL, PACK_CELL); }
  catch (e) { Pack.on = false; Pack.gen++; return null; }
  const d = id.data, L = packLut(ch), crys = crysChannels(ch), cr = crys.size ? crysRamp(ch) : null;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const k = keyRGB(d[i], d[i + 1], d[i + 2]);
    if (!k) continue;
    if (crys.has(k.i)) { const px = i >> 2, c = crysPixel(k.v, px % PACK_CELL, (px / PACK_CELL) | 0, f, cr); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; continue; }
    const t = L[k.i], j = Math.round(k.v * 255) * 3;
    d[i] = t[j]; d[i + 1] = t[j + 1]; d[i + 2] = t[j + 2];
  }
  occlude(d, ids, PACK_CELL, PACK_CELL);
  g.putImageData(id, 0, 0);
  return heroFinish(c, ids, ch);
}

// ---------- Exportação das folhas-base (usada por tools/exportar-sprites.js) ----------
// Desenha cada camada de cada opção com as cores-chave e devolve { caminho: dataURL }.
function exportPack() {
  const keyCh = Object.fromEntries(KEY_CH.map(([k, h]) => [k, keyHex(h, KEY_BASE)]));
  const out = {}, list = [];
  const sheet = (ch, slot) => {
    const c = mk(PACK_COLS * PACK_CELL, PACK_ROWS.length * PACK_CELL), g = c.getContext('2d');
    PACK_ROWS.forEach(([pose, n], r) => { for (let f = 0; f < n; f++) g.drawImage(drawChar(ch, pose, f, { only: slot, raw: true }), f * PACK_CELL, r * PACK_CELL); });
    const a = g.getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < a.length; i += 4) if (a[i]) return c;
    return null;                                                      // camada vazia: não gera arquivo
  };
  const job = (base, mod, slot) => {
    const ch = { ...base, ...mod }, part = packParts(ch).find(p => p.slot === slot);
    if (!part || out[part.file] !== undefined) return;
    const c = sheet(ch, slot);
    out[part.file] = c ? c.toDataURL() : null;
    if (c) list.push(part.file);
  };
  KEYMODE = true;
  try {
    for (const cls of ['mago', 'dragonico']) {         // 'mago' = corpo humano sem as peças próprias de uma classe
      const base = { ...DEFAULT_CHAR, ...keyCh, cls, body: 0, height: 2, build: 1, hair: 0, head: 0, cape: 0, acc: 0, outfit: 0, face: 0 };
      const classes = cls === 'dragonico' ? ['dragonico'] : PACK_HUM;
      for (let b = 0; b < 3; b++) {
        for (let o = 0; o < OPTS.outfits.length; o++) {
          for (let h = 0; h < 3; h++) job(base, { outfit: o, height: h, build: b }, 'pernas');
          for (let k = 0; k < OPTS.bodies.length; k++) job(base, { outfit: o, build: b, body: k }, 'tronco');
          for (const c2 of classes) for (const s of ['braco_tras', 'braco_frente']) job(base, { cls: c2, outfit: o, build: b }, s);
        }
        for (let k = 1; k < OPTS.capes.length; k++) job(base, { cape: k, build: b }, 'capa');
        job(base, { cape: 1, build: b }, 'capa_fecho');
        job(base, { acc: 5, build: b }, 'cachecol');
        job(base, { head: 7, build: b }, 'capuz_ombro');
        if (cls === 'dragonico') job(base, { build: b }, 'asas');
        else for (const c2 of ['guerreiro', 'arqueiro']) job(base, { cls: c2, build: b }, 'costas');
      }
      for (let k = 0; k < OPTS.faces.length; k++) for (let j = 0; j < OPTS.bodies.length; j++) job(base, { face: k, body: j }, 'cabeca');
      for (let k = 1; k < OPTS.hairs.length; k++) { job(base, { hair: k }, 'cabelo_tras'); job(base, { hair: k }, 'cabelo_frente'); }
      for (let k = 1; k <= 4; k++) job(base, { acc: k }, 'acessorio');
      for (let k = 1; k < OPTS.heads.length; k++) job(base, { head: k }, 'chapeu');
      job(base, { head: 7 }, 'capuz_braco');
      if (cls === 'dragonico') job(base, {}, 'chifres');
      else { job(base, { cls: 'guerreiro' }, 'cachecol'); for (const c2 of PACK_HUM) job(base, { cls: c2 }, 'arma'); }
    }
  } finally { KEYMODE = false; }
  // paleta-chave de referência para o artista (cada linha um canal, do escuro ao claro)
  const P = mk(16 * 13, KEY_CH.length * 16), pg = P.getContext('2d');
  KEY_CH.forEach(([, h], i) => { for (let s = 0; s < 13; s++) { pg.fillStyle = keyHex(h, 0.1 + s * 0.075); pg.fillRect(s * 16, i * 16, 16, 16); } pg.fillStyle = '#ffffff'; pg.fillRect(Math.round((KEY_BASE - 0.1) / 0.075) * 16 + 6, i * 16 + 6, 4, 4); });
  const files = {};
  for (const k of list) files[k] = out[k];
  return { files, list, paleta: P.toDataURL(), canais: KEY_CH.map(([k, h, nome]) => ({ canal: k, nome, matiz: h, base: keyHex(h, KEY_BASE) })) };
}

loadPack();
