// Servidor estático mínimo para testar o jogo no PC e no celular (mesma rede Wi-Fi).
// Uso: node servidor.js   (ou: node servidor.js 3000 para outra porta)
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const root = __dirname, port = +process.argv[2] || 8080;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, '0.0.0.0', () => {
  console.log('Servindo ' + root);
  console.log('  PC:      http://localhost:' + port);
  for (const list of Object.values(os.networkInterfaces())) for (const a of list) if (a.family === 'IPv4' && !a.internal) console.log('  Celular: http://' + a.address + ':' + port);
});
