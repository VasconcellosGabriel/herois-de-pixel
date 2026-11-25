// Gera os ícones e as artes das lojas (Google Play, Microsoft Store, PWA e app Android) com os desenhos do jogo.
// Uso: node tools/gerar-arte-loja.js      (precisa do Microsoft Edge; abre tools/arte-loja.html sem janela)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const raiz = path.join(__dirname, '..');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
if (!EDGE) { console.error('Microsoft Edge não encontrado.'); process.exit(1); }
const url = 'file:///' + path.join(__dirname, 'arte-loja.html').split(path.sep).join('/') + '#silencio';
const html = execFileSync(EDGE, ['--headless=new', '--allow-file-access-from-files', '--virtual-time-budget=20000', '--dump-dom', url],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const m = html.match(/<textarea id="out" hidden="">([\s\S]*?)<\/textarea>/);
if (!m || !m[1]) { console.error('A página não terminou de gerar as artes.'); process.exit(1); }
const out = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
for (const [nome, dados] of Object.entries(out)) {
  const arq = path.join(raiz, nome);
  fs.mkdirSync(path.dirname(arq), { recursive: true });
  fs.writeFileSync(arq, Buffer.from(dados.split(',')[1], 'base64'));
}
console.log(Object.keys(out).length + ' imagens geradas.');
