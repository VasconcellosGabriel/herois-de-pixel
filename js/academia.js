// ---------- Academia (tela de evolução, ao lado dos atributos) ----------
// O próprio herói do jogador, sentado num banco, fazendo rosca com halteres (pose 'lift' em js/sprites.js):
// gastar pontos de nível = treinar e ficar mais forte. Cena de 96x60 px ampliada 2x pelo CSS (mesma escala do herói
// no resto do menu). Ao gastar um ponto, ele acelera as repetições e sobe um "+1".
const Gym = { back: null, ph: 0, last: 0, boostT: -9, plus: [] };
const GYM_W = 96, GYM_H = 60, GYM_FLOOR = 54;
const GYM_DX = -4, GYM_DY = GYM_FLOOR - FEET;          // célula do herói (96x96, pés em FEET) -> cena

function gymRect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
// fundo fixo: parede de tábuas, piso emborrachado, suporte de halteres e anilhas
function gymBack() {
  const c = mk(GYM_W, GYM_H), g = c.getContext('2d'), R = (...a) => gymRect(g, ...a);
  for (let y = 0; y < GYM_FLOOR; y += 6) { R(0, y, GYM_W, 6, y % 12 ? '#2e2444' : '#2a2040'); R(0, y + 5, GYM_W, 1, '#221a36'); }
  R(0, GYM_FLOOR, GYM_W, GYM_H - GYM_FLOOR, '#1e1a26'); R(0, GYM_FLOOR, GYM_W, 1, '#3a3446');
  for (let x = 3; x < GYM_W; x += 12) R(x, GYM_FLOOR + 2, 6, 1, '#2a2434');
  // suporte de halteres (direita): duas prateleiras com pares de halteres
  const s = mk(GYM_W, GYM_H), q = s.getContext('2d'), Q = (...a) => gymRect(q, ...a);
  Q(70, 26, 2, 28, '#6a7088'); Q(91, 26, 2, 28, '#6a7088'); Q(70, 34, 23, 2, '#8a90a8'); Q(70, 45, 23, 2, '#8a90a8');
  const db = (x, y, col) => { Q(x, y + 1, 7, 1, '#c8ccd8'); Q(x - 1, y - 1, 2, 5, col); Q(x + 6, y - 1, 2, 5, col); Q(x - 1, y - 1, 2, 1, '#9aa0b4'); Q(x + 6, y - 1, 2, 1, '#9aa0b4'); };
  db(73, 30, '#c0392b'); db(83, 30, '#3b6fd6'); db(73, 41, '#2e9c5a'); db(83, 41, '#f2a900');
  // anilhas encostadas na parede (esquerda) e uma toalha
  for (const [x, r, col] of [[6, 7, '#3a3e52'], [13, 6, '#4a4e62'], [19, 5, '#3a3e52']]) {
    q.fillStyle = col; q.beginPath(); q.arc(x, GYM_FLOOR - r, r, 0, Math.PI * 2); q.fill();
    q.fillStyle = '#6a7088'; q.beginPath(); q.arc(x, GYM_FLOOR - r, r - 2, Math.PI * 1.1, Math.PI * 1.6); q.lineWidth = 1; q.strokeStyle = '#6a7088'; q.stroke();
    Q(x - 1, GYM_FLOOR - r - 1, 2, 2, '#1e1a26');
  }
  // banco: estofado vermelho em cima de pés de metal (o herói senta em cima)
  const bx = 48 + GYM_DX, by = GYM_DY + FEET - 10;
  // (comprido para trás: aparece atrás do herói sentado na ponta da frente)
  Q(bx - 26, by, 34, 4, '#2a2a3a'); Q(bx - 26, by, 34, 3, '#b83a3a'); Q(bx - 26, by, 34, 1, '#e86a5a');
  Q(bx - 24, by + 4, 2, GYM_FLOOR - by - 4, '#8a90a8'); Q(bx + 4, by + 4, 2, GYM_FLOOR - by - 4, '#8a90a8');
  Q(bx - 24, by + 4, 1, GYM_FLOOR - by - 4, '#c8ccd8'); Q(bx + 4, by + 4, 1, GYM_FLOOR - by - 4, '#c8ccd8');
  Q(bx - 27, GYM_FLOOR - 1, 8, 1, '#6a7088'); Q(bx + 1, GYM_FLOOR - 1, 8, 1, '#6a7088');
  outline(s, INK);
  g.drawImage(s, 0, 0);
  return c;
}
// halter (barrinha prateada + duas anilhas vermelhas), centrado na mão; o de longe fica mais escuro
function gymDumbbell(g, x, y, far) {
  const R = (...a) => gymRect(g, ...a), x0 = Math.round(x) - 5, y0 = Math.round(y);
  const pl = far ? '#8a2a24' : '#d0443a', plL = far ? '#b04a3a' : '#ff7a5a', plD = far ? '#5a1a18' : '#8a2a24';
  R(x0 + 2, y0 - 1, 7, 3, INK); R(x0 + 3, y0, 5, 1, far ? '#9aa0b4' : '#e8ecf4');          // barra (com contorno)
  for (const px of [x0, x0 + 8]) {
    R(px - 1, y0 - 4, 5, 9, INK);                                                          // contorno da anilha
    R(px, y0 - 3, 3, 7, pl); R(px, y0 - 3, 3, 1, plL); R(px, y0 + 3, 3, 1, plD); R(px + 1, y0, 1, 1, plD);
  }
}

function drawGym(cv, t, spr) {
  const g = cv.getContext('2d');
  if (!Gym.back) Gym.back = gymBack();
  const dt = Math.min(0.1, Math.max(0, t - Gym.last)); Gym.last = t;
  const fast = t - Gym.boostT < 2.4;
  Gym.ph = (Gym.ph + dt * (fast ? 2.4 : 1) / 1.8) % 1;
  const ph = Gym.ph, f = ph < 0.4 ? 0 : ph < 0.5 ? 1 : ph < 0.85 ? 2 : ph < 0.95 ? 3 : 0;
  // onde estão as mãos neste quadro (mesmas contas de drawChar: ombros + alvo do braço, limitado ao comprimento)
  const ch = spr.ch, FR = heroFrame(ch, 'lift', f), S = FR.S, T = FR.torsoTop;
  const hand = (sx, sy, a) => { const d = Math.hypot(a[0], a[1]), k = d > ARM_LEN * 2 - 0.05 ? (ARM_LEN * 2 - 0.05) / d : 1; return [sx + a[0] * k + GYM_DX, sy + a[1] * k + GYM_DY]; };
  const hN = hand(FR.bx - 7, T + 3, S.armF), hF = hand(FR.bx + 6, T + 3, S.armB);

  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, GYM_W, GYM_H);
  g.drawImage(Gym.back, 0, 0);
  g.drawImage(spr.get('lift', f), GYM_DX, GYM_DY);
  gymDumbbell(g, hF[0], hF[1], true);                                        // mão de longe (fica à frente do tronco): mais escuro
  gymDumbbell(g, hN[0], hN[1], false);
  // esforço no alto da repetição: gotinha de suor
  if (f === 2) {
    const k = (t * 2.2) % 1, x = FR.hx0 + 22 + GYM_DX, y = FR.hy + 4 + GYM_DY + k * 6;
    g.globalAlpha = 1 - k; gymRect(g, x, y, 1, 2, '#9fe0ff'); gymRect(g, x, y, 1, 1, '#ffffff'); g.globalAlpha = 1;
  }
  // "+1" subindo quando gasta um ponto
  for (let i = Gym.plus.length; i-- > 0;) {
    const p = Gym.plus[i], k = (t - p.t) / 1.2;
    if (k >= 1 || k < 0) { Gym.plus.splice(i, 1); continue; }
    g.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
    drawTextO(g, '+1', Math.round(p.x), Math.round(p.y - k * 14), '#7bff9a');
    g.globalAlpha = 1;
  }
}
// gastou um ponto de nível: repetições mais rápidas e um "+1" em cima da cabeça
function gymCheer(spr) {
  Gym.boostT = Game.t;
  const FR = spr ? heroFrame(spr.ch, 'lift', 0) : null;
  Gym.plus.push({ t: Game.t, x: FR ? FR.hcx + GYM_DX - 4 : 44, y: FR ? FR.hy + GYM_DY - 2 : 10 });
}
