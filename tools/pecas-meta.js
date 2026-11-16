// Leitura e gravação de sprites_rig/pecas.js (usado por exportar-pecas.js e importar-peca.js)
const fs = require('fs'), path = require('path');
// ---- sprites_rig/pecas.js: { peça: { px, py (pivô), len (comprimento do osso, só braço/perna) } } ----
function lerPecas(dir) {
  const f = path.join(dir, 'pecas.js');
  if (!fs.existsSync(f)) return {};
  return new Function(fs.readFileSync(f, 'utf8') + '; return RIG_PECAS;')();
}
function gravarPecas(dir, meta) {
  const f = path.join(dir, 'pecas.js'), prev = fs.existsSync(f) ? (fs.readFileSync(f, 'utf8').match(/RIG_VERSAO = (\d+)/) || [0, 0])[1] | 0 : 0;
  const keys = Object.keys(meta).sort();
  fs.writeFileSync(f, `// Gerado por tools/exportar-pecas.js / tools/importar-peca.js — peças do rig de recortes (ver sprites_rig/LEIA-ME.md)
// px, py = pivô (ponto preso ao esqueleto); len = comprimento do osso em pixels (braço/antebraço/coxa/canela).
const RIG_VERSAO = ${prev + 1};
const RIG_PECAS = {
${keys.map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(meta[k])},`).join('\n')}
};
`);
}
module.exports = { lerPecas, gravarPecas };
