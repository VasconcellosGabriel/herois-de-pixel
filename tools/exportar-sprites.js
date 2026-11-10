// Gera as folhas PNG-base dos heróis em sprites/ a partir do desenho por código (js/sprites.js).
// Uso: node tools/exportar-sprites.js           (precisa do Microsoft Edge ou Google Chrome instalado)
//      EDGE="C:/caminho/navegador.exe" node tools/exportar-sprites.js
// ATENÇÃO: sobrescreve as folhas existentes. Se um artista já editou alguma, faça backup (ou use o git) antes.
// Para gerar só as que ainda não existem: node tools/exportar-sprites.js --so-novas
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..'), out = path.join(root, 'sprites'), onlyNew = process.argv.includes('--so-novas');

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

let novas = 0;
const png = (file, url) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64')); };
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
console.log(`${novas} folhas gravadas em sprites/ (${all.length} no total) + paleta-chave.png + pack.js`);
