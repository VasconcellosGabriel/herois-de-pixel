// ---------- Ferreiro animado (tela de evolução, ao lado da loja de melhorias) ----------
// Cena de 64x40 px desenhada em código e ampliada 3x pelo CSS: forja acesa ao fundo, um machado de duas lâminas
// pendurado na parede, o anão ferreiro (barba cinza) martelando uma espada em brasa na bigorna e faíscas a cada batida. Ao comprar uma melhoria ele martela mais rápido por uns segundos.
const Smith = { frames: null, forge: null, ph: 0, last: 0, strikeT: -9, boostT: -9, sparks: [] };
const SMITH_W = 64, SMITH_H = 40, SMITH_FLOOR = 37;

function smithRect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
// linha grossa: carimba quadrados ao longo do caminho (braços, cabo do martelo)
function smithLine(g, x0, y0, x1, y1, s, c) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  g.fillStyle = c;
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n - s / 2), Math.round(y0 + (y1 - y0) * i / n - s / 2), s, s);
}

// posições da mão e da ponta do martelo em cada quadro: 0 erguido · 1 no meio · 2 batendo · 3 voltando
const SMITH_POSE = [
  { hand: [28, 12], end: [24, 3] },
  { hand: [31, 15], end: [37, 13] },
  { hand: [31, 19], end: [37, 20] },
  { hand: [31, 17], end: [37, 16] },
];
const SMITH_SHOULDER = [23, 22];
function smithFrame(i) {
  const c = mk(SMITH_W, SMITH_H), g = c.getContext('2d'), R = (...a) => smithRect(g, ...a);
  // bigorna
  R(31, 25, 2, 2, '#5a6078'); R(33, 25, 19, 3, '#6a7088'); R(52, 25, 3, 2, '#6a7088'); R(55, 25, 2, 1, '#6a7088');
  R(33, 25, 22, 1, '#a0a8c0'); R(33, 27, 19, 1, '#4a4e62');
  R(38, 28, 9, 4, '#4a4e62'); R(38, 28, 2, 4, '#3a3e52');
  R(35, 32, 15, 3, '#5a6078'); R(35, 32, 15, 1, '#7a8098'); R(34, 35, 17, 2, '#4a4e62');
  // espada deitada na bigorna (a cor da lâmina em brasa é pintada por cima a cada quadro)
  R(29, 24, 1, 1, '#ff7f1f'); R(30, 23, 18, 2, '#ff7f1f');
  R(48, 21, 2, 6, '#c89858'); R(48, 21, 1, 6, '#e8c888');
  R(50, 23, 5, 2, '#6b4423'); R(51, 23, 1, 2, '#8a5a2b'); R(53, 23, 1, 2, '#8a5a2b');
  R(55, 22, 2, 4, '#c89858');
  // ---- anão: baixo e largo, careca de cabelo grisalho, barba cinza comprida até a cintura ----
  // braço de trás segurando a tenaz (prende a ponta da lâmina)
  smithLine(g, 16, 23, 25, 25, 3, '#c07a50');
  smithLine(g, 26, 25, 31, 23, 1, '#3a3e52'); R(30, 22, 2, 1, '#3a3e52'); R(30, 25, 2, 1, '#3a3e52');
  R(24, 24, 3, 3, '#c07a50');
  // pernas curtas e botas grandes
  R(15, 30, 4, 3, '#4a3a5a'); R(22, 30, 4, 3, '#4a3a5a'); R(15, 30, 1, 3, '#3a2a48');
  R(14, 33, 6, 4, '#2a1c14'); R(21, 33, 6, 4, '#2a1c14'); R(14, 33, 6, 1, '#4a3424'); R(21, 33, 6, 1, '#4a3424');
  // camisa de linho, avental de couro e cinto com fivela
  R(13, 20, 15, 10, '#7a6a52'); R(13, 20, 2, 10, '#5a4e3c'); R(26, 20, 2, 10, '#8a7a60');
  R(15, 22, 11, 8, '#7a4a24'); R(15, 22, 2, 8, '#5a3418'); R(24, 22, 2, 8, '#8a5a2b');
  R(14, 29, 13, 2, '#3a2414'); R(19, 29, 3, 2, '#e8c848'); R(20, 29, 1, 1, '#fff2a0');
  // cabeça grande: rosto, cabelo grisalho saindo de baixo do elmo, sobrancelha cinza grossa e nariz de batata
  R(16, 11, 10, 9, '#e0a070'); R(16, 11, 2, 9, '#c0805a');
  R(14, 13, 3, 6, '#9a9aaa'); R(13, 14, 1, 4, '#9a9aaa'); R(15, 14, 1, 5, '#c8c8d4');
  R(22, 13, 4, 1, '#d8d8e4');                                     // sobrancelha grossa
  R(24, 14, 1, 1, '#1b1423');                                     // olho
  R(25, 14, 2, 3, '#d08a60'); R(27, 15, 1, 2, '#d08a60'); R(26, 14, 1, 1, '#f0b088');   // nariz
  // elmo de anão: calota de aço com crista de bronze gravada, faixa rebitada na testa,
  // protetor de nariz e protetor de bochecha cobrindo a orelha
  R(19, 5, 4, 1, '#8a90a4'); R(17, 6, 8, 1, '#8a90a4'); R(16, 7, 10, 1, '#8a90a4'); R(15, 8, 12, 3, '#8a90a4');
  R(15, 8, 2, 3, '#5a6078'); R(16, 7, 1, 1, '#5a6078');                       // sombra (atrás)
  R(20, 6, 3, 1, '#c8ceda'); R(22, 7, 3, 1, '#c8ceda'); R(24, 8, 2, 2, '#c8ceda'); R(21, 5, 1, 1, '#e8ecf4');   // brilho
  R(20, 5, 1, 1, '#d8b06a'); R(21, 6, 1, 1, '#b8904a'); R(22, 7, 1, 1, '#b8904a'); R(23, 8, 1, 1, '#b8904a');   // crista
  R(24, 9, 1, 1, '#b8904a'); R(25, 10, 1, 1, '#b8904a'); R(18, 6, 1, 1, '#b8904a'); R(17, 7, 1, 1, '#b8904a');
  R(15, 11, 12, 2, '#a07838'); R(15, 11, 12, 1, '#d8b06a');                   // faixa da testa
  for (const x of [17, 20, 23]) R(x, 12, 1, 1, '#f8e0a0');                    // rebites
  R(16, 13, 4, 5, '#8a90a4'); R(16, 13, 4, 1, '#c8ceda'); R(16, 17, 4, 1, '#5a6078'); R(18, 15, 1, 1, '#f8e0a0');   // bochecha
  R(25, 13, 1, 2, '#8a90a4'); R(25, 13, 1, 1, '#c8ceda');                     // protetor de nariz
  // barba cinza: começa no rosto e desce larga até a fivela, com uma argola dourada trançada
  R(18, 17, 9, 3, '#b8b8c8'); R(17, 18, 10, 5, '#b8b8c8'); R(17, 23, 9, 3, '#b8b8c8'); R(18, 26, 7, 2, '#b8b8c8');
  R(19, 28, 5, 2, '#b8b8c8'); R(20, 30, 3, 1, '#b8b8c8'); R(21, 31, 1, 1, '#b8b8c8');
  R(17, 18, 2, 8, '#8a8aa0'); R(18, 26, 2, 2, '#8a8aa0');         // sombra
  R(22, 19, 1, 7, '#e4e4ee'); R(24, 18, 1, 5, '#e4e4ee'); R(20, 22, 1, 4, '#e4e4ee');   // fios claros
  R(22, 17, 5, 1, '#e4e4ee'); R(26, 18, 2, 1, '#e4e4ee');         // bigode
  R(19, 27, 5, 1, '#e8c848'); R(19, 27, 1, 1, '#fff2a0');         // argola
  // braço da frente com o martelo
  const { hand: [hx, hy], end: [ex, ey] } = SMITH_POSE[i], [sx, sy] = SMITH_SHOULDER;
  smithLine(g, sx, sy, hx, hy, 3, '#e0a070');
  smithLine(g, hx, hy, ex, ey, 1, '#8a5a2b');
  const dx = ex - hx, dy = ey - hy, L = Math.hypot(dx, dy), px = -dy / L, py = dx / L;
  smithLine(g, ex - px * 2, ey - py * 2, ex + px * 2, ey + py * 2, 3, '#4a4e62');
  smithLine(g, ex - px * 2, ey - py * 2, ex + px * 2, ey + py * 2, 1, '#9aa0b4');
  R(hx - 1, hy - 1, 3, 3, '#e0a070'); R(hx - 1, hy + 1, 3, 1, '#c07a50');
  return outline(c, INK) || c;
}
function smithForge() {
  const c = mk(SMITH_W, SMITH_H), g = c.getContext('2d'), R = (...a) => smithRect(g, ...a);
  R(2, 4, 6, 10, '#4a2a2a'); R(2, 4, 6, 1, '#6a3a34');                       // chaminé
  R(1, 14, 10, 23, '#5a2a2a'); R(1, 14, 10, 1, '#7a3a30');
  for (let y = 16; y < 37; y += 3) {                                          // tijolos
    R(1, y, 10, 1, '#3a1a1a');
    for (let x = (y / 3) % 2 ? 2 : 5; x < 11; x += 6) R(x, y - 2, 1, 2, '#3a1a1a');
  }
  R(2, 24, 8, 8, '#1a0a0a'); R(2, 24, 8, 1, '#7a3a30');                       // boca da forja
  // machado de batalha de duas lâminas pendurado na parede em dois ganchos (desenhado à parte: tem contorno próprio)
  return outline(c, INK) || c;
}
// Machado de batalha de duas lâminas, deitado na parede como enfeite: lâminas prateadas em meia-lua com as pontas
// viradas para o cabo (asa de morcego), alvado rebitado com ponta de lança, cabo preto com anéis cravejados,
// empunhadura trançada e pomo de metal. Cabo na linha y = 7..8; a cabeça fica à direita.
function smithAxe() {
  const c = mk(SMITH_W, SMITH_H), g = c.getContext('2d'), R = (...a) => smithRect(g, ...a), hx = 55;
  // lâmina de cima, do fio (linha 0) até o pescoço junto ao alvado; [y, x0, x1, cor]
  // fio convexo em cima; nas linhas 3-4 as pontas descem separadas do miolo (o entalhe côncavo da meia-lua)
  const rows = [[0, [[-3, 3]], '#f4f6fa'], [1, [[-5, 5]], '#dfe4ee'], [2, [[-6, 6]], '#c0c6d4'], [3, [[-6, -4], [-2, 2], [4, 6]], '#a8b0c0'],
    [4, [[-6, -5], [-1, 1], [5, 6]], '#8a90a4'], [5, [[-6, -6], [-1, 1], [6, 6]], '#6a7088'], [6, [[-1, 1]], '#6a7088']];
  for (const [y, segs, col] of rows) for (const [a, b] of segs) {
    R(hx + a, y, b - a + 1, 1, col);                                          // de cima
    R(hx + a, 15 - y, b - a + 1, 1, shade(col, -0.12));                       // espelhada embaixo
  }
  for (const s of [-1, 1]) { R(hx + s * 6, 2, 1, 4, '#f4f6fa'); R(hx + s * 6, 10, 1, 4, '#dfe4ee'); R(hx + s * 5, 1, 1, 1, '#f4f6fa'); R(hx + s * 5, 14, 1, 1, '#dfe4ee'); }   // fio das pontas
  R(hx - 1, 4, 3, 8, '#7a8098'); R(hx - 1, 4, 1, 8, '#9aa0b4');                // alvado
  R(hx, 5, 1, 1, '#ffffff'); R(hx, 10, 1, 1, '#ffffff');                       // rebites
  R(hx + 2, 7, 3, 2, '#a8b0c0'); R(hx + 2, 7, 3, 1, '#dfe4ee'); R(hx + 5, 7, 2, 2, '#c8ccd8'); R(hx + 7, 7, 1, 1, '#ffffff');   // ponta de lança
  R(40, 7, 14, 2, '#2a2430'); R(40, 7, 14, 1, '#4a4458');                      // cabo preto
  for (const x of [45, 48]) { R(x, 6, 1, 4, '#c8ccd8'); R(x, 5, 1, 1, '#e8ecf4'); R(x, 10, 1, 1, '#8a90a4'); }   // anéis cravejados
  for (let x = 38; x < 45; x++) R(x, 6, 1, 4, x % 2 ? '#9a9aa8' : '#6a6a78');   // empunhadura trançada
  R(35, 6, 3, 4, '#c8ccd8'); R(35, 6, 3, 1, '#e8ecf4'); R(34, 7, 1, 2, '#a8b0c0');   // pomo
  outline(c, INK);
  R(41, 9, 2, 2, '#4a2c18'); R(46, 9, 2, 2, '#4a2c18'); R(41, 9, 2, 1, '#6a4a34'); R(46, 9, 2, 1, '#6a4a34');   // pinos na parede
  return c;
}

function drawSmith(cv, t) {
  const g = cv.getContext('2d'), R = (...a) => smithRect(g, ...a);
  if (!Smith.frames) { Smith.frames = [0, 1, 2, 3].map(smithFrame); Smith.forge = smithForge(); Smith.axe = smithAxe(); Smith.last = t; }
  const dt = Math.min(0.1, Math.max(0, t - Smith.last)); Smith.last = t;
  const fast = t - Smith.boostT < 2.4, speed = fast ? 2.3 : 1;
  // ciclo da martelada (0..1): erguido → desce → bate → volta → sobe
  const prev = Smith.ph; Smith.ph = (Smith.ph + dt * speed / 0.95) % 1;
  const ph = Smith.ph, hit = 0.43;
  if ((prev < hit && ph >= hit) || (prev > ph && ph >= hit)) {
    Smith.strikeT = t;
    for (let k = fast ? 13 : 7; k-- > 0;) {
      const life = rnd(0.25, 0.55);
      Smith.sparks.push({ x: 37 + rnd(-1, 1), y: 22, vx: rnd(-28, 34), vy: rnd(-50, -14), life, max: life });
    }
  }
  const fi = ph < 0.35 ? 0 : ph < 0.43 ? 1 : ph < 0.58 ? 2 : ph < 0.72 ? 3 : ph < 0.82 ? 1 : 0;

  g.clearRect(0, 0, SMITH_W, SMITH_H);
  g.imageSmoothingEnabled = false;
  // chão de pedra
  R(0, SMITH_FLOOR, SMITH_W, 3, '#3a2e44'); R(0, SMITH_FLOOR, SMITH_W, 1, '#5a4a6a');
  for (let x = 4; x < SMITH_W; x += 9) R(x, SMITH_FLOOR + 1, 1, 2, '#2a2034');
  // forja com fogo + clarão quente
  g.drawImage(Smith.forge, 0, 0); g.drawImage(Smith.axe, 0, 0);
  if (typeof pixelFire === 'function') pixelFire(g, 3, 32, 6, 7, t, 3, i => 1 - Math.abs(i - 2.5) * 0.18);
  const heat = Math.max(0.3, 1 - (t - Smith.strikeT) * 1.1);
  g.globalCompositeOperation = 'lighter';
  const gl = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,150,40,${a})`); gr.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  gl(6, 29, 16, 0.22 + Math.sin(t * 9) * 0.04);
  gl(39, 23, 14, 0.1 + heat * 0.18);
  g.globalCompositeOperation = 'source-over';
  // ferreiro, bigorna e espada
  g.drawImage(Smith.frames[fi], 0, 0);
  // lâmina em brasa: clareia a cada batida e esfria aos poucos (a ponta, longe do golpe, é mais escura)
  const RAMP = ['#7a2418', '#b8301a', '#ff7f1f', '#ffaa2e', '#ffd84a', '#fff3a8'];
  for (let x = 32; x < 48; x++) {
    const near = 1 - Math.abs(x - 37) / 14, v = heat * 0.75 + near * 0.35 + (hash2(x, Math.floor(t * 8), 9) - 0.5) * 0.12;
    const c = RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.floor(v * RAMP.length)))];
    R(x, 23, 1, 1, c); R(x, 24, 1, 1, RAMP[Math.max(0, RAMP.indexOf(c) - 1)]);
  }
  // clarão do impacto
  if (t - Smith.strikeT < 0.07) { R(35, 22, 5, 1, '#fff3a8'); R(36, 21, 3, 2, '#ffffff'); }
  // faíscas
  for (let i = Smith.sparks.length; i-- > 0;) {
    const s = Smith.sparks[i];
    s.life -= dt; if (s.life <= 0) { Smith.sparks.splice(i, 1); continue; }
    s.vy += 140 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.y > SMITH_FLOOR - 1) { s.y = SMITH_FLOOR - 1; s.vy *= -0.35; s.vx *= 0.6; }
    const k = s.life / s.max;
    R(Math.round(s.x), Math.round(s.y), 1, 1, k > 0.6 ? '#fff3a8' : k > 0.3 ? '#ffd84a' : '#ff7f1f');
  }
}
// comprou uma melhoria: martela mais rápido por uns segundos
function smithCheer() { Smith.boostT = Game.t; }
