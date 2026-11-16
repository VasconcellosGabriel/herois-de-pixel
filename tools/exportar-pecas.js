// Gera os MOLDES das peças do rig de recortes (sprites_rig/) a partir do desenho por código (js/sprites.js + js/rig.js).
// Cada molde é uma peça na paleta-chave com o pivô marcado em sprites_rig/pecas.js. Arte nova entra por cima com
// node tools/importar-peca.js (ou editando o PNG à mão, sem mudar o tamanho nem o pivô).
// Uso: node tools/exportar-pecas.js           (só cria as peças que ainda não existem: não apaga arte importada)
//      node tools/exportar-pecas.js --tudo    (refaz todos os moldes: SOBRESCREVE a arte importada)
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const { lerPecas, gravarPecas } = require('./pecas-meta');
const root = path.join(__dirname, '..'), out = path.join(root, 'sprites_rig'), all = process.argv.includes('--tudo');

const browsers = [process.env.EDGE, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const exe = browsers.find(p => fs.existsSync(p));
if (!exe) { console.error('Navegador não encontrado. Defina EDGE=caminho/do/navegador'); process.exit(1); }

const base = 'file:///' + root.replace(/\\/g, '/') + '/';
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace('<head>', `<head><base href="${base}"><script>window.requestAnimationFrame=()=>0;</script>`)
  .replace(/<script src="sprites\/pack\.js"><\/script>/, '').replace(/<script src="sprites_rig\/pecas\.js"><\/script>/, '')
  .replace('</body>', `<script>try { document.body.setAttribute('data-r', JSON.stringify(exportRig())); } catch (e) { document.body.setAttribute('data-r', JSON.stringify({ erro: String(e.stack || e) })); }</script></body>`);
const tmp = path.join(os.tmpdir(), 'herois-pecas-' + process.pid + '.html');
fs.writeFileSync(tmp, html);
console.log('Desenhando os moldes...');
const dom = execFileSync(exe, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.unlinkSync(tmp);
const m = dom.match(/data-r="([^"]*)"/);
if (!m) { console.error('A página não devolveu resultado.'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
if (r.erro) { console.error(r.erro); process.exit(1); }

const meta = lerPecas(out);
let novas = 0;
const escritas = new Set();
for (const [f, url] of Object.entries(r.files)) {
  // cópia sempre atualizada do molde em _moldes/ (o importador encaixa a arte nova pela caixa do molde original)
  const mold = path.join(out, '_moldes', f + '.png');
  fs.mkdirSync(path.dirname(mold), { recursive: true }); fs.writeFileSync(mold, Buffer.from(url.split(',')[1], 'base64'));
  const file = path.join(out, f + '.png');
  if (!all && fs.existsSync(file) && meta[f]) continue;
  // variação (_v1...) de uma peça com arte importada: não recria o molde (a peça importada vale para todas as poses)
  const baseDe = f.replace(/_v\d+$/, '');
  if (!all && baseDe !== f && !escritas.has(baseDe)) continue;
  escritas.add(f);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  meta[f] = r.meta[f]; novas++;
}
gravarPecas(out, meta);
console.log(`${novas} moldes gravados em sprites_rig/ (${Object.keys(meta).length} peças no total) + pecas.js`);
