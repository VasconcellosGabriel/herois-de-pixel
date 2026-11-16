// Encaixa uma imagem pintada (gerada por IA ou feita por artista) no molde de uma peça do rig (sprites_rig/).
// Uso: node tools/importar-peca.js <imagem> <peça> [opções]
//   <peça>                 caminho da peça sem .png, ex.: humano/arma/espada, humano/chapeu/coroa (ver sprites_rig/pecas.js)
//   --recorte x,y,w,h      usa só esta região da imagem (folha com várias peças)
//   --girar graus          gira a arte (sentido horário) antes de encaixar. Ex.: espada deitada -> apontando para cima
//   --espelhar             espelha na horizontal (o herói olha para a DIREITA)
//   --encaixe caixa|largura|altura   escala a arte para caber na caixa do molde (padrão), ou igualar só a largura/altura
//   --escala k             multiplica o tamanho depois do encaixe (ex.: 1.2 = 20% maior que o molde)
//   --alinhar base|centro|topo        como alinhar com a caixa do molde (padrão: base = pé da peça no mesmo lugar)
//   --desloca dx,dy        empurra a arte depois de alinhar (pixels)
//   --grade auto|n         a arte já é pixel art ampliada (comum em imagens de IA): lê a grade de pixels original
//                          (tamanho n detectado ou informado) e, se precisar ficar menor, reduz por blocos preservando
//                          traços escuros e sem criar cores novas (em vez de borrar)
//   --fixo s,x,y           escala e posição exatas (a imagem inteira, sem recorte automático, reduzida s vezes e com o canto
//                          superior esquerdo em x,y). Cada importação mostra o --fixo que usou: repita-o em outra imagem
//                          do mesmo tamanho para encaixar duas peças juntas (ex.: cabeça e cabelo exportados alinhados)
//   --fundo-tol n          tolerância para apagar o fundo liso a partir das bordas (padrão 38; 0 = não apagar)
//   --chave canal=regra    pinta com a paleta-chave o que o jogador pode recolorir. Regras (junte com +):
//                          h:270-310 (faixa de matiz, saturada) · cinza (pouco saturado, metal) · pele (tons de pele)
//                          canais: skin hairColor primary secondary accent weaponColor headColor capeColor accColor eyes
//                                  armor (placas da armadura) vest (camisa do colete) cheek (bochecha)
//                          ex.: --chave headColor=h:250-320   --chave weaponColor=cinza+h:190-260
//                          *k no fim escurece/clareia o tom (ex.: secondary=h:15-45*0.6 = bota na cor secundária, mais escura)
//   --previa arquivo.png   também grava uma prévia ampliada (antes x depois)
// O PNG da peça é substituído (tamanho e pivô do molde continuam; o molde original fica em sprites_rig/_moldes/). As variações de movimento (_v1, _v2...) dessa peça
// são apagadas, para o jogo usar a arte nova em todos os quadros (refaça-as importando com o nome da variação).
const fs = require('fs'), path = require('path'), http = require('http'), { execFile } = require('child_process');
const { lerPecas, gravarPecas } = require('./pecas-meta');
const root = path.join(__dirname, '..'), dir = path.join(root, 'sprites_rig');

const args = process.argv.slice(2), pos = [], opt = { chave: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--espelhar') opt.espelhar = true;
  else if (a.startsWith('--')) { const k = a.slice(2), v = args[++i]; if (k === 'chave') opt.chave.push(v); else opt[k] = v; }
  else pos.push(a);
}
const [img, peca] = pos;
if (!img || !peca) { console.error('Uso: node tools/importar-peca.js <imagem> <peça> [opções] (veja o topo do arquivo)'); process.exit(1); }
if (!fs.existsSync(img)) { console.error('Imagem não encontrada: ' + img); process.exit(1); }
const meta = lerPecas(dir);
if (!meta[peca]) { console.error(`Peça "${peca}" não existe em sprites_rig/pecas.js. Rode antes: node tools/exportar-pecas.js`); process.exit(1); }

const KEYS = ['skin', 'hairColor', 'primary', 'secondary', 'accent', 'weaponColor', 'headColor', 'capeColor', 'accColor', 'eyes', 'armor', 'vest', 'cheek'];
const regras = opt.chave.map(s => {
  const [canal, r0] = s.split('='), [r, mult] = (r0 || '').split('*');
  if (!KEYS.includes(canal) || !r) { console.error('Regra de --chave inválida: ' + s); process.exit(1); }
  return { canal, mult: mult ? +mult : 1, partes: r.split('+').map(p => p === 'cinza' || p === 'pele' ? { tipo: p } : { tipo: 'h', de: +p.split(':')[1].split('-')[0], ate: +p.split(':')[1].split('-')[1] }) };
});
const cfg = {
  recorte: opt.recorte ? opt.recorte.split(',').map(Number) : null, girar: +(opt.girar || 0), espelhar: !!opt.espelhar,
  encaixe: opt.encaixe || 'caixa', escala: +(opt.escala || 1), alinhar: opt.alinhar || 'base',
  desloca: opt.desloca ? opt.desloca.split(',').map(Number) : [0, 0], fixo: opt.fixo ? opt.fixo.split(',').map(Number) : null, grade: opt.grade || null, tol: opt['fundo-tol'] === undefined ? 38 : +opt['fundo-tol'], regras, previa: !!opt.previa,
};

// ---------- processamento (roda no navegador, com canvas) ----------
const page = `<!doctype html><html><body><script src="/js/util.js"></script><script src="/js/sprites.js"></script><script>
const cfg = ${JSON.stringify(cfg)};
const load = src => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => err(new Error('não abriu ' + src)); i.src = src; });
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
const box = (d, w, h) => { let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; };
function hsv(r, g, b) { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { if (mx === r) h = ((g - b) / d) * 60; else if (mx === g) h = ((b - r) / d + 2) * 60; else h = ((r - g) / d + 4) * 60; } return [(h + 360) % 360, mx ? d / mx : 0, mx / 255]; }
(async () => { try {
  const src = await load('/_fonte'), molde = await load('/sprites_rig/_moldes/' + ${JSON.stringify(peca)} + '.png?' + Date.now());
  // 1. recorte
  const [rx, ry, rw, rh] = cfg.recorte || [0, 0, src.width, src.height];
  let c = canvas(rw, rh), g = c.getContext('2d'); g.drawImage(src, rx, ry, rw, rh, 0, 0, rw, rh);
  // 2. apaga o fundo liso: inunda a partir das bordas tudo que for parecido com a cor dos cantos
  const alfa = g.getImageData(0, 0, 1, 1).data[3] < 10;                         // PNG já com fundo transparente: não mexe
  if (cfg.tol > 0 && !alfa) {
    const id = g.getImageData(0, 0, rw, rh), d = id.data, seen = new Uint8Array(rw * rh), q = [];
    const cs = [[0, 0], [rw - 1, 0], [0, rh - 1], [rw - 1, rh - 1]].map(([x, y]) => (y * rw + x) * 4), ref = [0, 1, 2].map(k => cs.map(i => d[i + k]).sort((a, b) => a - b)[1]);
    const like = i => d[i + 3] > 0 && Math.abs(d[i] - ref[0]) + Math.abs(d[i + 1] - ref[1]) + Math.abs(d[i + 2] - ref[2]) < cfg.tol * 1.6;
    for (let x = 0; x < rw; x++) q.push(x, (rh - 1) * rw + x); for (let y = 0; y < rh; y++) q.push(y * rw, y * rw + rw - 1);
    while (q.length) { const p = q.pop(); if (seen[p]) continue; seen[p] = 1; if (!like(p * 4)) continue; d[p * 4 + 3] = 0; const x = p % rw, y = (p / rw) | 0; if (x > 0) q.push(p - 1); if (x < rw - 1) q.push(p + 1); if (y > 0) q.push(p - rw); if (y < rh - 1) q.push(p + rw); }
    // auréola: pixel da borda que ainda é uma mistura com o fundo (antisserrilhado da imagem original) também sai
    const near = i => Math.abs(d[i] - ref[0]) + Math.abs(d[i + 1] - ref[1]) + Math.abs(d[i + 2] - ref[2]) < cfg.tol * 3.2;
    const kill = [];
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { const p = y * rw + x; if (!d[p * 4 + 3] || !near(p * 4)) continue; if ((x > 0 && !d[(p - 1) * 4 + 3]) || (x < rw - 1 && !d[(p + 1) * 4 + 3]) || (y > 0 && !d[(p - rw) * 4 + 3]) || (y < rh - 1 && !d[(p + rw) * 4 + 3])) kill.push(p); }
    for (const p of kill) d[p * 4 + 3] = 0;
    g.putImageData(id, 0, 0);
  }
  // 3. gira / espelha (com suavização: a redução depois limpa)
  if (cfg.girar || cfg.espelhar) {
    const R = Math.ceil(Math.hypot(rw, rh)), o = canvas(R, R), og = o.getContext('2d');
    og.imageSmoothingQuality = 'high'; og.translate(R / 2, R / 2); og.rotate(cfg.girar * Math.PI / 180); if (cfg.espelhar) og.scale(-1, 1); og.drawImage(c, -rw / 2, -rh / 2);
    c = o; g = og;
  }
  // 4. recorta o que sobrou
  let d0 = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, B = box(d0, c.width, c.height);
  if (!B) throw new Error('a imagem ficou vazia (fundo apagado demais? use --fundo-tol menor)');
  // 5. caixa do molde e escala
  const M = canvas(molde.width, molde.height), mg = M.getContext('2d'); mg.drawImage(molde, 0, 0);
  const MB = box(mg.getImageData(0, 0, M.width, M.height).data, M.width, M.height) || { x: 0, y: 0, w: M.width, h: M.height };
  let s = cfg.encaixe === 'largura' ? MB.w / B.w : cfg.encaixe === 'altura' ? MB.h / B.h : Math.min(MB.w / B.w, MB.h / B.h);
  s *= cfg.escala;
  if (cfg.fixo) s = cfg.fixo[0];
  let tw = Math.max(1, Math.round(B.w * s)), th = Math.max(1, Math.round(B.h * s)), T, gradeInfo = '';
  if (cfg.grade) {
    // 6a. arte que já é pixel art ampliada (ex.: imagens de IA): acha o tamanho e a posição da grade de pixels pelas
    // bordas de cor e lê UMA cor por célula (mediana do miolo, que ignora o ruído do JPG). Fica nítida, sem borrão.
    const W = c.width, Hh = c.height, a = d0, lum = new Float32Array(W * Hh), ex = new Float64Array(W), ey = new Float64Array(Hh);
    for (let p = 0; p < W * Hh; p++) lum[p] = a[p * 4 + 3] < 128 ? -120 : a[p * 4] * 0.3 + a[p * 4 + 1] * 0.59 + a[p * 4 + 2] * 0.11;
    for (let y = B.y + 1; y < B.y + B.h; y++) for (let x = B.x + 1; x < B.x + B.w; x++) { const p = y * W + x; ex[x] += Math.abs(lum[p] - lum[p - 1]); ey[y] += Math.abs(lum[p] - lum[p - W]); }
    const score = (e, n, o, a0, a1) => { let t = 0, k = 0; for (let v = o; v < a1; v += n) { const i = Math.round(v); if (i > a0 && i < a1) { t += e[i]; k++; } } return k ? t / k : 0; };
    const fase = (e, n, a0, a1) => { let bo = 0, bv = -1; for (let o = 0; o < n; o += 0.25) { const v = score(e, n, a0 + o, a0, a1); if (v > bv) { bv = v; bo = o; } } return [bo, bv]; };
    let n = +cfg.grade;
    if (!(n > 1)) {                                           // auto: período das bordas (autocorrelação); múltiplos empatam -> o menor
      const ac = (e, a0, a1) => { let m = 0; for (let i = a0; i < a1; i++) m += e[i]; m /= (a1 - a0); return L => { let t = 0; for (let i = a0; i + L < a1; i++) t += (e[i] - m) * (e[i + L] - m); return t / (a1 - a0 - L); }; };
      const ax = ac(ex, B.x, B.x + B.w), ay = ac(ey, B.y, B.y + B.h), res = [];
      for (let L = 2; L <= 12; L++) res.push([L, ax(L) + ay(L)]);
      const top = Math.max(...res.map(r => r[1]));
      n = res.find(r => r[1] >= top * 0.8)[0];
    }
    const gx = B.x + fase(ex, n, B.x, B.x + B.w)[0], gy = B.y + fase(ey, n, B.y, B.y + B.h)[0];
    const x0 = gx - Math.ceil((gx - B.x) / n) * n, y0 = gy - Math.ceil((gy - B.y) / n) * n;
    tw = Math.ceil((B.x + B.w - x0) / n); th = Math.ceil((B.y + B.h - y0) / n);
    T = canvas(tw, th); const tg0 = T.getContext('2d'), od = tg0.createImageData(tw, th);
    const med = v => { v.sort((p, q) => p - q); return v[v.length >> 1]; };
    for (let j = 0; j < th; j++) for (let i = 0; i < tw; i++) {
      const cx0 = x0 + i * n, cy0 = y0 + j * n, R = [], G = [], Bl = [], al = [];
      for (let y = Math.floor(cy0 + n * 0.25); y < cy0 + n * 0.75; y++) for (let x = Math.floor(cx0 + n * 0.25); x < cx0 + n * 0.75; x++) {
        if (x < 0 || y < 0 || x >= W || y >= Hh) continue;
        const q = (y * W + x) * 4; al.push(a[q + 3]); if (a[q + 3] >= 128) { R.push(a[q]); G.push(a[q + 1]); Bl.push(a[q + 2]); }
      }
      const o = (j * tw + i) * 4;
      if (R.length * 2 > al.length) { od.data[o] = med(R); od.data[o + 1] = med(G); od.data[o + 2] = med(Bl); od.data[o + 3] = 255; }
    }
    tg0.putImageData(od, 0, 0);
    B = { x: x0, y: y0, w: tw * n, h: th * n };
    gradeInfo = ' · grade de ' + n.toFixed(2) + ' px (' + tw + 'x' + th + ' nativo)';
    // menor que o nativo: reduz por blocos sem inventar cores. Traço escuro (olho, contorno) que ocupa boa parte do
    // bloco vence; senão fica a cor da arte mais próxima da média do bloco.
    const w2 = Math.max(1, Math.round(B.w * s)), h2 = Math.max(1, Math.round(B.h * s));
    if (w2 < tw) {
      const sd = od.data, R2 = canvas(w2, h2), rg = R2.getContext('2d'), rd = rg.createImageData(w2, h2), fx = tw / w2, fy = th / h2;
      const L = q => sd[q] * 0.3 + sd[q + 1] * 0.59 + sd[q + 2] * 0.11;
      for (let j = 0; j < h2; j++) for (let i = 0; i < w2; i++) {
        const px = []; let tot = 0;
        for (let y = Math.floor(j * fy); y < Math.ceil((j + 1) * fy) && y < th; y++) for (let x = Math.floor(i * fx); x < Math.ceil((i + 1) * fx) && x < tw; x++) { tot++; const q = (y * tw + x) * 4; if (sd[q + 3]) px.push(q); }
        if (!px.length || px.length * 2 < tot) continue;
        const dark = px.filter(q => L(q) < 70);
        let pick;
        if (dark.length >= Math.max(1, tot * 0.3)) pick = dark.reduce((p, q) => L(q) < L(p) ? q : p);
        else { const m = [0, 1, 2].map(k => px.reduce((t, q) => t + sd[q + k], 0) / px.length); pick = px.reduce((p, q) => { const dq = Math.abs(sd[q] - m[0]) + Math.abs(sd[q + 1] - m[1]) + Math.abs(sd[q + 2] - m[2]), dp = Math.abs(sd[p] - m[0]) + Math.abs(sd[p + 1] - m[1]) + Math.abs(sd[p + 2] - m[2]); return dq < dp ? q : p; }); }
        const o = (j * w2 + i) * 4; rd.data[o] = sd[pick]; rd.data[o + 1] = sd[pick + 1]; rd.data[o + 2] = sd[pick + 2]; rd.data[o + 3] = 255;
      }
      rg.putImageData(rd, 0, 0); T = R2; tw = w2; th = h2;
      gradeInfo += ' -> reduzido por blocos';
    } else s = 1 / n;
  } else {
    // 6b. reduz em etapas (metade por vez) para não perder detalhe nem serrilhar
    let cur = canvas(B.w, B.h); cur.getContext('2d').drawImage(c, B.x, B.y, B.w, B.h, 0, 0, B.w, B.h);
    while (cur.width / 2 > tw && cur.height / 2 > th) { const n = canvas(Math.round(cur.width / 2), Math.round(cur.height / 2)), ng = n.getContext('2d'); ng.imageSmoothingQuality = 'high'; ng.drawImage(cur, 0, 0, n.width, n.height); cur = n; }
    T = canvas(tw, th); const tg1 = T.getContext('2d'); tg1.imageSmoothingQuality = 'high'; tg1.drawImage(cur, 0, 0, tw, th);
  }
  const tg = T.getContext('2d'), td = tg.getImageData(0, 0, tw, th), d = td.data;
  // 7. borda dura (pixel art) e paleta-chave
  for (let i = 0; i < d.length; i += 4) d[i + 3] = d[i + 3] >= 110 ? 255 : 0;
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {                       // pixel solto (sujeira) sai
    const p = y * tw + x, op = (X, Y) => X >= 0 && Y >= 0 && X < tw && Y < th && d[(Y * tw + X) * 4 + 3];
    if (d[p * 4 + 3] && !op(x - 1, y) && !op(x + 1, y) && !op(x, y - 1) && !op(x, y + 1)) d[p * 4 + 3] = 0;
  }
  const pick = (r, g2, b) => { const [h, sat, v] = hsv(r, g2, b); for (const R of cfg.regras) for (const p of R.partes) {
    if (p.tipo === 'cinza' && sat < 0.2 && v > 0.25) return R;
    if (p.tipo === 'pele' && h >= 5 && h <= 45 && sat > 0.15 && sat < 0.75 && v > 0.35) return R;
    if (p.tipo === 'h' && sat > 0.18 && v > 0.12 && (p.de <= p.ate ? h >= p.de && h <= p.ate : h >= p.de || h <= p.ate)) return R;
  } return null; };
  const hits = cfg.regras.map(() => []), who = new Int16Array(tw * th).fill(-1);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) { if (!d[i + 3]) continue; const R = pick(d[i], d[i + 1], d[i + 2]); if (R) { const k = cfg.regras.indexOf(R); who[p] = k; hits[k].push(Math.max(d[i], d[i + 1], d[i + 2]) / 255); } }
  const med = hits.map(a => { const s2 = a.slice().sort((x, y) => x - y); return s2.length ? s2[(s2.length * 0.6) | 0] : 1; });
  const cont = cfg.regras.map(() => 0);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    if (!d[i + 3]) continue;
    const k = who[p];
    if (k >= 0) { const v = Math.max(d[i], d[i + 1], d[i + 2]) / 255, kv = clamp(KEY_BASE * cfg.regras[k].mult * v / med[k], 0.12, 1), c2 = C(keyHex(KEY_HUE[cfg.regras[k].canal], kv)); d[i] = c2[0]; d[i + 1] = c2[1]; d[i + 2] = c2[2]; cont[k]++; }
    else if (keyRGB(d[i], d[i + 1], d[i + 2])) { const m = Math.min(d[i], d[i + 1], d[i + 2]), j = [0, 1, 2].find(t => d[i + t] === m); d[i + j] = Math.min(255, m + 14); }   // cor comum que pareceria chave
  }
  tg.putImageData(td, 0, 0);
  // 8. posiciona na caixa do molde
  const out = canvas(M.width, M.height), og2 = out.getContext('2d');
  let ox = Math.round(MB.x + MB.w / 2 - tw / 2) + cfg.desloca[0];
  let oy = (cfg.alinhar === 'topo' ? MB.y : cfg.alinhar === 'centro' ? Math.round(MB.y + MB.h / 2 - th / 2) : MB.y + MB.h - th) + cfg.desloca[1];
  if (cfg.fixo) { ox = Math.round(cfg.fixo[1] + B.x * s); oy = Math.round(cfg.fixo[2] + B.y * s); }
  const fixo = [+s.toFixed(5), +(ox - B.x * s).toFixed(2), +(oy - B.y * s).toFixed(2)].join(',');   // para encaixar outra peça igual
  og2.drawImage(T, ox, oy);
  const r = { png: out.toDataURL(), info: 'arte ' + B.w + 'x' + B.h + ' -> ' + tw + 'x' + th + ' (molde ' + MB.w + 'x' + MB.h + ')' + gradeInfo + '; pixels na paleta-chave: ' + cfg.regras.map((R, k) => R.canal + ' ' + cont[k]).join(', ') + ' | --fixo ' + fixo };
  if (cfg.previa) {   // molde | arte encaixada, ampliados 6x
    const S = 6, P = canvas(M.width * 2 * S + S * 4, M.height * S), pg = P.getContext('2d'); pg.imageSmoothingEnabled = false;
    pg.fillStyle = '#3a4a6a'; pg.fillRect(0, 0, P.width, P.height); pg.drawImage(M, 0, 0, M.width * S, M.height * S); pg.drawImage(out, M.width * S + S * 4, 0, M.width * S, M.height * S);
    r.previa = P.toDataURL();
  }
  document.body.setAttribute('data-r', JSON.stringify(r));
} catch (e) { document.body.setAttribute('data-r', JSON.stringify({ erro: String(e.stack || e) })); } })();
</script></body></html>`;

const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/_p.html') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(page); }
  const f = p === '/_fonte' ? path.resolve(img) : path.join(root, p);
  if (p !== '/_fonte' && !f.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
}).listen(0, '127.0.0.1', () => {
  const browsers = [process.env.EDGE, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
  const exe = browsers.find(b => fs.existsSync(b));
  if (!exe) { console.error('Navegador não encontrado. Defina EDGE=caminho/do/navegador'); process.exit(1); }
  execFile(exe, ['--headless=new', '--disable-gpu', '--virtual-time-budget=30000', '--dump-dom', 'http://127.0.0.1:' + srv.address().port + '/_p.html'], { maxBuffer: 1 << 30, encoding: 'utf8' }, (err, dom) => {
    srv.close();
    const m = (dom || '').match(/data-r="([^"]*)"/);
    if (!m) { console.error('A página não devolveu resultado.', err || ''); process.exit(1); }
    const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    if (r.erro) { console.error(r.erro); process.exit(1); }
    fs.writeFileSync(path.join(dir, peca + '.png'), Buffer.from(r.png.split(',')[1], 'base64'));
    for (const k of Object.keys(meta)) if (k.startsWith(peca + '_v') && /_v\d+$/.test(k)) { delete meta[k]; try { fs.unlinkSync(path.join(dir, k + '.png')); } catch (e) {} console.log('  variação apagada: ' + k); }
    gravarPecas(dir, meta);
    if (r.previa) fs.writeFileSync(path.resolve(opt.previa), Buffer.from(r.previa.split(',')[1], 'base64'));
    console.log(`ok: sprites_rig/${peca}.png — ${r.info}`);
  });
});
