'use strict';
// ---------- Folhas de sprites (PNG) dos heróis ----------
// Cada parte do herói é uma folha PNG em sprites/ (corpo, roupa, cabelo, chapéu, arma...). As partes que o jogador
// escolhe a cor são pintadas com a PALETA-CHAVE (ver KEY_CH em sprites.js e sprites/LEIA-ME.md); o jogo empilha as
// camadas na ordem certa, troca as cores-chave pelas cores do personagem e põe o contorno.
// Sem as folhas (ou com ?procedural na URL), o herói continua sendo desenhado por código (drawChar).
// As folhas-base são geradas a partir do desenho por código: node tools/exportar-sprites.js

// linhas da folha: [pose, quadros]. Cada célula tem 96x96 px; as colunas são os quadros da animação.
const PACK_ROWS = [['idle', 5], ['run', 8], ['jump', 3], ['land', 1], ['crouch', 5], ['atk', 4], ['cast', 3], ['block', 1], ['hurt', 1], ['dash', 1], ['glide', 2], ['aim', 12], ['tuck', 1]];
const PACK_CELL = 96, PACK_COLS = 12;
// ordem de empilhamento (de trás para a frente)
const PACK_SLOTS = ['asas', 'capa', 'cabelo_tras', 'costas', 'braco_tras', 'pernas', 'tronco', 'capa_fecho', 'cachecol', 'cabeca', 'cabelo_frente', 'chifres', 'acessorio', 'chapeu', 'capuz_ombro', 'arma', 'braco_frente'];
const slugOf = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const PACK_ALT = OPTS.heights.map(slugOf), PACK_FIS = OPTS.builds.map(slugOf), PACK_LEG = [9, 11, 14];

// Camadas de um herói: { slot, file, shift }. shift = a folha foi desenhada para a altura "Alto" e só desce
// com a altura escolhida (tudo da cintura para cima; as pernas têm uma folha por altura).
function packParts(ch) {
  const fam = ch.cls === 'dragonico' ? 'dragonico' : 'humano', b = PACK_FIS[ch.build | 0], out = [];
  const add = (slot, file, shift = true) => out.push({ slot, file: fam + '/' + file, shift });
  const roupa = slugOf(OPTS.outfits[ch.outfit | 0]);
  if (fam === 'dragonico') add('asas', 'asas_' + b);
  if (ch.cape) { add('capa', 'capa/' + slugOf(OPTS.capes[ch.cape]) + '_' + b); add('capa_fecho', 'capa/fecho_' + b); }
  if (ch.hair) { add('cabelo_tras', 'cabelo/' + slugOf(OPTS.hairs[ch.hair]) + '_tras'); add('cabelo_frente', 'cabelo/' + slugOf(OPTS.hairs[ch.hair]) + '_frente'); }
  if (ch.cls === 'guerreiro' || ch.cls === 'arqueiro') add('costas', 'costas/' + ch.cls + '_' + b);
  add('braco_tras', 'roupa/' + roupa + '_' + b + '_braco_tras');
  add('pernas', 'pernas/' + PACK_ALT[ch.height | 0] + '_' + b, false);
  add('tronco', 'roupa/' + roupa + '_' + b + '_tronco');
  if (ch.acc === 5) add('cachecol', 'acessorio/cachecol_' + b);
  add('cabeca', 'rosto/' + slugOf(OPTS.faces[ch.face | 0]));
  if (fam === 'dragonico') add('chifres', 'chifres');
  if (ch.acc >= 1 && ch.acc <= 4) add('acessorio', 'acessorio/' + slugOf(OPTS.accs[ch.acc]));
  if (ch.head) add('chapeu', 'chapeu/' + slugOf(OPTS.heads[ch.head]));
  if (ch.head === 7) add('capuz_ombro', 'chapeu/capuz_ombros_' + b);
  if (fam === 'humano') add('arma', 'arma/' + ch.cls);
  add('braco_frente', 'roupa/' + roupa + '_' + b + '_braco_frente');
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

function packChar(ch, pose, f) {
  if (!Pack.on) return null;
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
  for (const p of parts) {
    const im = Pack.img[p.file];
    if (!im) continue;
    g.drawImage(im, f * PACK_CELL, row * PACK_CELL, PACK_CELL, PACK_CELL, 0, p.shift ? dy : 0, PACK_CELL, PACK_CELL);
    any = true;
  }
  if (!any) return null;
  // troca as cores-chave pelas cores do personagem
  let id;
  try { id = g.getImageData(0, 0, PACK_CELL, PACK_CELL); }
  catch (e) { Pack.on = false; Pack.gen++; return null; }          // jogo aberto direto do arquivo (file://): o navegador não deixa ler os PNGs
  const d = id.data, L = packLut(ch);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const k = keyRGB(d[i], d[i + 1], d[i + 2]);
    if (!k) continue;
    const t = L[k.i], j = Math.round(k.v * 255) * 3;
    d[i] = t[j]; d[i + 1] = t[j + 1]; d[i + 2] = t[j + 2];
  }
  g.putImageData(id, 0, 0);
  return outline(c, INK);
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
    for (const cls of ['guerreiro', 'dragonico']) {
      const base = { ...DEFAULT_CHAR, ...keyCh, cls, height: 2, build: 1, hair: 0, head: 0, cape: 0, acc: 0, outfit: 0, face: 0 };
      for (let b = 0; b < 3; b++) {
        for (let h = 0; h < 3; h++) job(base, { height: h, build: b }, 'pernas');
        for (let o = 0; o < OPTS.outfits.length; o++) for (const s of ['braco_tras', 'tronco', 'braco_frente']) job(base, { outfit: o, build: b }, s);
        for (let k = 1; k < OPTS.capes.length; k++) job(base, { cape: k, build: b }, 'capa');
        job(base, { cape: 1, build: b }, 'capa_fecho');
        job(base, { acc: 5, build: b }, 'cachecol');
        job(base, { head: 7, build: b }, 'capuz_ombro');
        if (cls === 'dragonico') job(base, { build: b }, 'asas');
        else for (const c2 of ['guerreiro', 'arqueiro']) job(base, { cls: c2, build: b }, 'costas');
      }
      for (let k = 0; k < OPTS.faces.length; k++) job(base, { face: k }, 'cabeca');
      for (let k = 1; k < OPTS.hairs.length; k++) { job(base, { hair: k }, 'cabelo_tras'); job(base, { hair: k }, 'cabelo_frente'); }
      for (let k = 1; k <= 4; k++) job(base, { acc: k }, 'acessorio');
      for (let k = 1; k < OPTS.heads.length; k++) job(base, { head: k }, 'chapeu');
      if (cls === 'dragonico') job(base, {}, 'chifres');
      else for (const c2 of ['guerreiro', 'mago', 'arqueiro']) job(base, { cls: c2 }, 'arma');
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
