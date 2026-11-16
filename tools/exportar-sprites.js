// Gera as folhas PNG-base dos heróis em sprites/ a partir do desenho por código (js/sprites.js).
// Uso: node tools/exportar-sprites.js           (precisa do Microsoft Edge ou Google Chrome instalado)
//      EDGE="C:/caminho/navegador.exe" node tools/exportar-sprites.js
// ATENÇÃO: sobrescreve as folhas existentes. Se um artista já editou alguma, faça backup (ou use o git) antes.
// Para gerar só as que ainda não existem: node tools/exportar-sprites.js --so-novas
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const pasta = 'sprites';
const root = path.join(__dirname, '..'), out = path.join(root, pasta), onlyNew = process.argv.includes('--so-novas');

const browsers = [process.env.EDGE, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const exe = browsers.find(p => fs.existsSync(p));
if (!exe) { console.error('Navegador não encontrado. Defina EDGE=caminho/do/navegador'); process.exit(1); }

// página temporária: o jogo inteiro (sem as folhas atuais) + a exportação
const base = 'file:///' + root.replace(/\\/g, '/') + '/';
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace('<head>', `<head><base href="${base}"><script>window.requestAnimationFrame=()=>0;</script>`)
  .replace(/<script src="sprites\/pack\.js"><\/script>/, '')
  .replace('</body>', `<script>try { document.body.setAttribute('data-r', JSON.stringify(exportPack())); } catch (e) { document.body.setAttribute('data-r', JSON.stringify({ erro: String(e.stack || e) })); }</script></body>`);
const tmp = path.join(os.tmpdir(), 'herois-exportar-' + process.pid + '.html');
fs.writeFileSync(tmp, html);
console.log('Desenhando as folhas (pode levar alguns segundos)...');
const dom = execFileSync(exe, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.unlinkSync(tmp);
const m = dom.match(/data-r="([^"]*)"/);
if (!m) { console.error('A página não devolveu resultado.'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
if (r.erro) { console.error(r.erro); process.exit(1); }

// O navegador grava PNG com compressão rápida; como as folhas são quase todas transparentes, recomprimir no máximo
// deixa cada uma várias vezes menor (mesmos pixels, só o bloco IDAT é refeito).
const zlib = require('zlib');
const CRC = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
const crc32 = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function recomprimir(buf) {
  const partes = [buf.subarray(0, 8)], idat = [];
  const bloco = (tipo, dados) => { const b = Buffer.alloc(12 + dados.length); b.writeUInt32BE(dados.length, 0); b.write(tipo, 4, 'latin1'); dados.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + dados.length)), 8 + dados.length); return b; };
  for (let p = 8; p < buf.length;) {
    const n = buf.readUInt32BE(p), tipo = buf.toString('latin1', p + 4, p + 8), dados = buf.subarray(p + 8, p + 8 + n);
    if (tipo === 'IDAT') idat.push(dados);
    else { if (tipo === 'IEND') partes.push(bloco('IDAT', zlib.deflateSync(zlib.inflateSync(Buffer.concat(idat)), { level: 9 }))); partes.push(buf.subarray(p, p + 12 + n)); }
    p += 12 + n;
  }
  const out = Buffer.concat(partes);
  return out.length < buf.length ? out : buf;
}

let novas = 0;
const png = (file, url) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, recomprimir(Buffer.from(url.split(',')[1], 'base64'))); };
for (const [f, url] of Object.entries(r.files)) {
  const file = path.join(out, f + '.png');
  if (onlyNew && fs.existsSync(file)) continue;
  png(file, url); novas++;
}
png(path.join(out, 'paleta-chave.png'), r.paleta);
// lista de arquivos que o jogo carrega (as folhas que existem em disco, inclusive as que o artista acrescentou)
const all = [];
const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.png') && e.name !== 'paleta-chave.png') all.push(path.relative(out, p).replace(/\\/g, '/').replace(/\.png$/, '')); } };
walk(out);
all.sort();
const prev = fs.existsSync(path.join(out, 'pack.js')) ? (fs.readFileSync(path.join(out, 'pack.js'), 'utf8').match(/versao: (\d+)/) || [0, 0])[1] | 0 : 0;
fs.writeFileSync(path.join(out, 'pack.js'), `// Gerado por tools/exportar-sprites.js — lista das folhas PNG dos heróis (ver sprites/LEIA-ME.md)
// "versao" muda a cada exportação para o navegador não usar folhas antigas do cache.
const SPRITE_PACK = {
  versao: ${prev + 1},
  canais: ${JSON.stringify(r.canais)},
  arquivos: ${JSON.stringify(all, null, 2).replace(/\n/g, '\n  ')},
};
`);
console.log(`${novas} folhas gravadas em ${pasta}/ (${all.length} no total) + paleta-chave.png + pack.js`);
