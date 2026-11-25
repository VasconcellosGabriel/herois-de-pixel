// Copia só os arquivos do jogo para www/ (pasta usada pelo Capacitor e, depois, pelo Electron).
// Uso: node tools/montar-www.js
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..'), destino = path.join(raiz, 'www');
const ITENS = ['index.html', 'style.css', 'manifest.json', 'icon.svg', 'sw.js', 'js', 'sprites', 'sprites_rig', 'fonts', 'icons'];
const IGNORAR = /\.(zip|md|psd|aseprite)$/i;
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });
function copiar(de, para) {
  const st = fs.statSync(de);
  if (st.isDirectory()) { fs.mkdirSync(para, { recursive: true }); for (const f of fs.readdirSync(de)) copiar(path.join(de, f), path.join(para, f)); }
  else if (!IGNORAR.test(de)) fs.copyFileSync(de, para);
}
for (const it of ITENS) if (fs.existsSync(path.join(raiz, it))) copiar(path.join(raiz, it), path.join(destino, it));
console.log('www/ montada.');
