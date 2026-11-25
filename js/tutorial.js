'use strict';
// ---------- Treino (tutorial) ----------
// Fase feita à mão que ensina os controles. Ela entra no fim da lista LEVELS (as fases da campanha não mudam de índice,
// então os saves continuam valendo) e fica fora do mapa. Roda sozinha antes da Fase 1 na primeira vez
// e pode ser refeita pelo botão "Treino" da tela inicial. No fim, avisa que os controles podem ser editados.
const TUT = { id: 'treino', world: 1, tut: true, name: 'Treino', theme: 'forest', len: 124, seed: 7, build: tutBuild };
TUT.wn = 1; TUT.ln = 0;
LEVELS.push(TUT);
const TUT_IDX = LEVELS.length - 1;

// trechos da fase (em tiles): cada um mostra uma dica enquanto o herói está nele
const TUT_ZONES = [
  { x: 0, k: 'andar' }, { x: 15, k: 'pular' }, { x: 29, k: 'plat' }, { x: 45, k: 'atk' }, { x: 60, k: 'hab2' },
  { x: 76, k: 'hab3' }, { x: 90, k: 'check' }, { x: 97, k: 'esp' }, { x: 113, k: 'fim' },
];

function tutBuild(def) {
  const w = def.len, h = LV_H, gy = GY0;
  const tiles = Array.from({ length: h }, () => new Uint8Array(w));
  const L = { w, h, tiles, theme: def.theme, spawns: [], coins: [], picks: [], checks: [], chests: [], secrets: [], goal: null, start: null };
  const ground = (x0, x1, g) => { for (let x = x0; x < x1 && x < w; x++) for (let y = g; y < h; y++) tiles[y][x] = 1; };
  const coins = (tx, n, ty) => { for (let i = 0; i < n; i++) L.coins.push({ x: (tx + i) * T + 8, y: ty * T + 8 }); };
  const oneway = (x0, n, ty) => { for (let i = 0; i < n; i++) tiles[ty][x0 + i] = 2; };
  const foe = (t, tx, ty = gy) => L.spawns.push({ t, x: tx * T + 8, y: ty * T });
  for (let y = 0; y < h; y++) tiles[y][0] = 1;                         // parede no começo
  // andar
  ground(0, 17, gy); coins(6, 6, gy - 1);
  // pular: um degrau e um buraco
  ground(17, 23, gy - 1); coins(23, 3, gy - 4); ground(26, 31, gy);
  // plataformas finas (sobe pulando, desce segurando baixo)
  ground(31, 46, gy); oneway(33, 4, gy - 3); oneway(38, 4, gy - 6); coins(38, 4, gy - 7); coins(33, 4, gy - 4);
  // atacar: caixas no caminho e um inimigo
  ground(46, 61, gy); tiles[gy - 1][50] = 4; tiles[gy - 2][50] = 4; tiles[gy - 1][51] = 4; foe('slime', 56);
  // habilidade 2: espinhos e um inimigo do outro lado
  ground(61, 77, gy); for (let x = 65; x < 68; x++) tiles[gy - 1][x] = 3; coins(64, 5, gy - 3); foe('plant', 72);
  // habilidade 3: um inimigo voando
  ground(77, 91, gy); foe('hawk', 85, gy - 4); coins(80, 3, gy - 2);
  // checkpoint e coração
  ground(91, 98, gy); L.checks.push({ x: 93 * T + 8, y: gy * T }); L.picks.push({ t: 'heart', x: 95 * T + 8, y: (gy - 2) * T });
  // especial: um bando de gosmas
  ground(98, w, gy); foe('slime', 104); foe('slime', 107); foe('slime', 110); foe('bat', 108, gy - 4);
  for (let y = 0; y < h; y++) tiles[y][w - 1] = 1;                     // parede no fim
  L.start = { x: 3 * T, y: gy * T };
  L.goal = { x: (w - 6) * T + 8, y: gy * T };
  return L;
}

// --- dicas: nomes dos botões de acordo com o que o jogador está usando (toque, controle ou teclado) ---
const TUT_TOUCH = { left: '◀', right: '▶', jump: '▲', down: '▼', special: '★', elem: '↻', pause: '❚❚' };
const MOUSE_NAME = { 0: 'clique esquerdo', 1: 'clique do meio', 2: 'clique direito' };
function tutKey(act, p) {
  const chip = s => `<kbd>${s}</kbd>`;
  if (document.body.classList.contains('touch')) {
    if (TUT_TOUCH[act]) return chip(TUT_TOUCH[act]);
    const k = { a: 0, b: 1, c: 2 }[act];
    return k !== undefined ? 'o botão ' + chip(p.cls.skills[k].icon) : act;
  }
  if (Input.padOn && typeof PadCfg !== 'undefined' && PadCfg.map[act]) {
    const b = PadCfg.map[act].filter(i => i >= 0).map(i => chip(padName(i)));
    if (act === 'left') return chip('◀') + ' no direcional ou analógico';
    if (act === 'right') return chip('▶') + ' no direcional ou analógico';
    if (b.length) return b.join(' ou ');
  }
  const ks = (Binds.keys[act] || []).filter(Boolean).map(c => chip(keyName(c)));
  for (const m in Binds.mouse || {}) if (Binds.mouse[m] === act && MOUSE_NAME[m]) ks.push(MOUSE_NAME[m]);
  return ks.length ? ks.join(' ou ') : '(sem tecla)';
}
function tutHint(k, p) {
  const K = a => tutKey(a, p), sk = p.cls.skills;
  switch (k) {
    case 'andar': return ['Andar', `${K('left')} e ${K('right')} movem o herói.`];
    case 'pular': return ['Pular', `${K('jump')} pula. Suba o degrau e salte o buraco!`];
    case 'plat': return ['Plataformas', `Pule nas plataformas finas. Para descer delas (ou agachar), segure ${K('down')}.`];
    case 'atk': return [sk[0].icon + ' ' + sk[0].name, `${K('a')} ataca e quebra caixas. Pular em cima do inimigo também derrota!`];
    case 'hab2': return [sk[1].icon + ' ' + sk[1].name, `${K('b')} usa a segunda habilidade. Cuidado com os espinhos!`];
    case 'hab3': return [sk[2].icon + ' ' + sk[2].name, `${K('c')}: ${sk[2].desc}`];
    case 'check': return ['Checkpoint', 'Passe pela bandeira: se cair, você volta daqui. Corações recuperam vida.'];
    case 'esp': return ['★ Ataque especial', `Derrotar inimigos enche a barra ★. Ela está cheia: aperte ${K('special')}!` + (p.cls.id === 'mago' ? ` ${K('elem')} troca o elemento da magia.` : '')];
    case 'fim': return ['Fim do treino', `Entre no portal para terminar. ${K('pause')} pausa o jogo.`];
  }
  return null;
}

const Tut = { key: '', then: null };
// chamado a cada quadro durante a fase de treino
function tutFrame(w) {
  const p = w.p, el = $('#tut');
  if (!p || !el) return;
  const tx = cxOf(p) / T;
  let z = TUT_ZONES[0];
  for (const q of TUT_ZONES) if (tx >= q.x) z = q;
  if (z.k === 'esp' && !w.tutSp) { w.tutSp = true; p.sp = SPECIAL_MAX; }          // enche a barra para experimentar
  const hint = tutHint(z.k, p), key = z.k + '|' + (document.body.classList.contains('touch') ? 't' : Input.padOn ? 'p' : 'k');
  if (key === Tut.key && !el.hidden) return;
  Tut.key = key;
  $('b', el).textContent = hint[0]; $('span', el).innerHTML = hint[1];
  el.hidden = false;
}
function tutHide() { const el = $('#tut'); if (el) el.hidden = true; Tut.key = ''; }
// joga o treino; then: o que vem depois da mensagem final
function startTutorial(then) {
  Tut.then = then;
  Prisma.ret = false;
  hideScreens();
  startLevel(TUT_IDX);
  Game.world.lives = 99;                                 // no treino não tem fim de jogo
  banner('Treino', 'Aprenda os controles antes da aventura', 2600);
  goFullscreen();
}
// a Fase 1 começa pelo treino na primeira vez (só jogando sozinho, e se ninguém neste aparelho já jogou)
const tutPending = i => i === 0 && !Game.save.tutDone && !Net.role && !Local.on && !(Game.save.best || {}).floresta;
// chegou ao portal do treino: guarda que já viu e mostra o aviso dos controles
function tutFinish() {
  tutHide();
  Game.save.tutDone = 1; persist();
  Game.mode = 'menu'; Input.enabled = false; Input.clear();
  Snd.music('menu');
  show('tut');
  $('#b-tut-ok').focus({ preventScroll: true });
}
