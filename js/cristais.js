'use strict';
// ---------- Cristais e Dimensão Prisma (segredo) ----------
// Há 7 cristais (CRISTAIS em js/levels.js), um escondido no túnel secreto de uma fase de cada mundo. O cristal só fica
// guardado no herói quando a fase é concluída. Com os 7, o mapa mostra o portal para a Dimensão Prisma: 7 fases extras,
// cada uma com uma regra (RULES). Quebrar a regra recomeça a fase (sem gastar vidas).

// --- Cenários: o vazio da dimensão (fundo e decoração 'prisma' em js/dimensao.js) na cor de cada cristal (prisma1 = verde ... prisma7 = azul) ---
// gem: os 4 tons do cristal (cenário e criaturas) · crys: skin que cristaliza os inimigos comuns
CRISTAIS.forEach((c, i) => {
  const [d, m, l, wt] = c.cor, k = '#05030f';
  THEMES['prisma' + (i + 1)] = {
    seed: 41 + i, style: 'rock', song: 'cave', amb: 'sparkle', tint: [m, 0.1], glow: l, gem: c.cor, crys: 'cris' + (i + 1),
    ground: [mix(k, d, 0.2), mix(k, d, 0.38), mix(k, d, 0.58), mix(k, d, 0.8), d], cap: [d, m, l, wt, '#ffffff'],
    edge: '#04020a', plat: m, sun: l, bgAs: 'prisma', decoAs: 'prisma', platAs: 'cave', crateAs: 'cave',
    gems: [[m, wt], [l, '#ffffff'], [d, l]],
    sky: [[0, '#05030f'], [0.5, mix('#05030f', d, 0.35)], [0.82, mix('#05030f', d, 0.75)], [1, mix(d, m, 0.45)]],
  };
  SLIME_COL['prisma' + (i + 1)] = m;
});

// --- Regras das fases extras ---
// hud: texto do HUD (fonte sem acentos) · need: inimigos a derrotar para abrir o portal · time: segundos
const RULES = {
  nostomp:   { nome: 'Sem pisões', icon: '🚫', hud: 'SEM PISOES', desc: 'É proibido pular em cima dos inimigos.' },
  stomponly: { nome: 'Só pisões', icon: '👟', hud: 'SO PISOES', need: 10, desc: 'Ataques não ferem ninguém: derrote 10 inimigos pulando em cima deles para abrir o portal.' },
  pacifist:  { nome: 'Pacifista', icon: '🕊️', hud: 'PACIFISTA', desc: 'Não derrote nenhum inimigo. Desvie de todos!' },
  glass:     { nome: 'Coração de vidro', icon: '💔', hud: 'SEM DANO', desc: 'Um único dano (ou queda) e a fase recomeça.' },
  clock:     { nome: 'Contra o relógio', icon: '⏱️', hud: 'TEMPO', time: 85, desc: 'Chegue ao portal em 85 segundos.' },
  hunt:      { nome: 'Caçada', icon: '🎯', hud: 'CACADA', desc: 'Derrote todos os inimigos da fase para abrir o portal.' },
  basic:     { nome: 'Sem poderes', icon: '✋', hud: 'SO ATAQUE BASICO', desc: 'Só o ataque básico (J): as outras habilidades e o especial ficam bloqueados.' },
};
const EXTRA = LEVELS.map((lv, i) => lv.extra ? i : -1).filter(i => i >= 0);   // índices das fases extras, em ordem
const gemById = id => CRISTAIS.find(c => c.id === id);
const crisOf = sv => (Array.isArray(sv.cris) ? sv.cris : []).filter(id => gemById(id));
const prismaOpen = sv => crisOf(sv).length >= CRISTAIS.length;
// fase extra liberada: a primeira sempre (com os 7 cristais); as outras depois de vencer a anterior
const extraOpen = (sv, k) => prismaOpen(sv) && (k === 0 || !!sv.best[LEVELS[EXTRA[k - 1]].id]);

// --- Desenho do cristal: prisma alongado de 6 faces (não é a gema lapidada clássica) ---
const _gemImg = {};
function gemImg(id, dim) {
  const key = id + (dim ? 'd' : '');
  if (_gemImg[key]) return _gemImg[key];
  const c = gemById(id), [d, m, l, wt] = dim ? ['#1a1428', '#2a2240', '#3a3058', '#4a4070'] : c.cor;
  const img = outline(fromMap([
    '....W....',
    '...WLM...',
    '..WLLMD..',
    '.WLLLMMD.',
    '.LWLLMMD.',
    '.LWLLMMD.',
    '.LLLLMMD.',
    '.LLLLMMD.',
    '.LLLLMDD.',
    '.MLLLMDD.',
    '..MLLMD..',
    '...MMD...',
    '....D....',
  ], { W: wt, L: l, M: m, D: d }), '#120a1e');
  return (_gemImg[key] = img);
}
// cristal na fase (brilha, flutua e solta faíscas); fica translúcido se o herói já o tem
function drawGem(g, w, cx, cy) {
  const G = w.gem;
  if (!G || w.gemGot) return;
  const c = gemById(G.id), have = crisOf(Game.save).includes(G.id), bob = Math.sin(w.t * 3) * 2;
  const x = G.x - cx, y = G.y - cy + bob;
  if (x < -30 || x > W + 30) return;
  g.globalCompositeOperation = 'lighter';
  drawGlow(g, x, y, 22, c.cor[1], have ? 0.2 : 0.45 + Math.sin(w.t * 5) * 0.12);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const img = gemImg(G.id);
  if (have) g.globalAlpha = 0.45;
  g.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
  g.globalAlpha = 1;
  // faísca em volta (cruz de 1 px que gira)
  const a = w.t * 2.2;
  for (let k = 0; k < 3; k++) {
    const ang = a + k * 2.09, r = 10 + Math.sin(w.t * 4 + k) * 2, sx = Math.round(x + Math.cos(ang) * r), sy = Math.round(y + Math.sin(ang) * r * 0.7);
    g.fillStyle = k ? c.cor[2] : '#ffffff'; g.fillRect(sx, sy, 1, 1);
    if ((Math.floor(w.t * 6) + k) % 3 === 0) { g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3); }
  }
}
// um herói encostou no cristal (só no anfitrião / solo)
function gemTouch(w, p) {
  const G = w.gem;
  if (!G || w.gemGot || Math.abs(cxOf(p) - G.x) > 10 || Math.abs(cyOf(p) - G.y) > 20) return;
  const c = gemById(G.id), have = crisOf(Game.save).includes(G.id);
  w.gemGot = true;
  asOwner(null, () => sfx('secret'));
  burst(w, G.x, G.y, c.cor[2], 24, 110, 0.9, 0); burst(w, G.x, G.y, '#ffffff', 10, 60, 0.6, 0);
  feel(w, p, 0.15, 0.15, 0.06);
  announce('Cristal ' + c.nome + '!', have ? 'Este cristal já era seu' : 'Conclua a fase para guardá-lo', 3000);
  sysMsg(p.ch.name + ' encontrou o Cristal ' + c.nome + '!');
}

// --- Regras durante a fase ---
// quebrou a regra: aviso vermelho com contagem regressiva e a fase recomeça (estado 'fail', sem perder vidas)
const FAIL_T = 4;
function ruleBreak(w, why) {
  if (!w.rule || w.state !== 'play') return;
  w.state = 'fail'; w.overT = FAIL_T; w.failWhy = why;
  sfx('over'); music(null);
}
// o portal do fim só abre quando o objetivo da regra foi cumprido
function ruleGoalOpen(w) {
  if (w.rule === 'stomponly') return (w.ruleN | 0) >= RULES.stomponly.need;
  if (w.rule === 'hunt') return !w.enemies.some(e => !e.dead);
  return true;
}
// aviso de "portal fechado" / "bloqueado" (no máximo um por segundo)
function ruleNote(w, x, y, txt) {
  if ((w.noteT || 0) > w.t) return;
  w.noteT = w.t + 1;
  floatText(w, x, y, txt, '#ff9aa5');
}
// inimigo derrotado
function ruleKill(w, e) {
  if (!w.rule || e.boss) return;
  if (w.th.crys) crysShatter(w, e);                                      // criatura de cristal estilhaça
  if (w.rule === 'pacifist') ruleBreak(w, 'UM INIMIGO FOI DERROTADO');
  else if (w.rule === 'stomponly') {
    w.ruleN = (w.ruleN | 0) + 1;
    if (w.ruleN === RULES.stomponly.need) { asOwner(null, () => sfx('ready')); announce('Portal aberto!', 'Agora corra até o fim', 2200); }
  } else if (w.rule === 'hunt' && !w.enemies.some(q => !q.dead)) { asOwner(null, () => sfx('ready')); announce('Portal aberto!', 'Todos os inimigos foram derrotados', 2200); }
}
// cadeado sobre o portal fechado
function drawGoalLock(g, w, x, y) {
  if (ruleGoalOpen(w)) return;
  g.fillStyle = 'rgba(10,6,20,.72)'; g.fillRect(x - 7, y - 43, 14, 42);
  g.fillStyle = '#c8c0e0'; g.fillRect(x - 3, y - 30, 6, 2); g.fillRect(x - 3, y - 30, 1, 5); g.fillRect(x + 2, y - 30, 1, 5);
  g.fillStyle = '#ffd23f'; g.fillRect(x - 4, y - 25, 8, 7); g.fillStyle = '#7a5a10'; g.fillRect(x - 1, y - 23, 2, 3);
}
// linha da regra no HUD (embaixo, no centro) e o aviso de regra quebrada
function drawRuleHud(g, w) {
  const R = w.rule && RULES[w.rule];
  if (!R) return;
  let t = R.hud;
  if (w.rule === 'stomponly') t += '  ' + Math.min(w.ruleN | 0, R.need) + '/' + R.need;
  else if (w.rule === 'hunt') t += '  RESTAM ' + w.enemies.filter(e => !e.dead).length;
  else if (w.rule === 'clock') { const s = Math.max(0, Math.ceil(R.time - w.t)); t += '  ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  const warn = w.rule === 'clock' && R.time - w.t < 15 && Math.floor(w.t * 4) % 2;
  drawTextO(g, t, Math.round(W / 2 - textW(t) / 2), H - 10, warn ? '#ff5a6a' : ruleGoalOpen(w) ? '#d8c8ff' : '#ffd27a');
  if (w.state === 'fail') drawFail(g, w);
}
// regra quebrada: tela avermelhada, moldura piscando, o motivo e a contagem até a fase recomeçar
function drawFail(g, w) {
  if (!w.failBn) { w.failBn = 1; const bn = document.getElementById('banner'); if (bn) bn.classList.remove('show'); }   // o aviso do começo da fase não cobre a caixa
  const left = Math.max(0, w.overT || 0), k = clamp(1 - left / FAIL_T, 0, 1), n = Math.max(1, Math.ceil(left)), pulse = 0.5 + Math.sin(w.t * 10) * 0.5;
  g.fillStyle = `rgba(40,0,10,${Math.min(0.72, 0.3 + k * 0.6)})`; g.fillRect(0, 0, W, H);
  g.fillStyle = `rgba(255,40,60,${0.35 + pulse * 0.45})`; g.fillRect(0, 0, W, 3); g.fillRect(0, H - 3, W, 3); g.fillRect(0, 0, 3, H); g.fillRect(W - 3, 0, 3, H);
  const bw = 216, bh = 86, bx = Math.round(W / 2 - bw / 2), by = Math.round(H / 2 - bh / 2 - 6);
  g.fillStyle = 'rgba(70,0,16,.9)'; g.fillRect(bx, by, bw, bh);
  g.fillStyle = '#ff3a4a'; g.fillRect(bx, by, bw, 1); g.fillRect(bx, by + bh - 1, bw, 1); g.fillRect(bx, by, 1, bh); g.fillRect(bx + bw - 1, by, 1, bh);
  const t1 = 'REGRA QUEBRADA', t2 = w.failWhy || '', t3 = 'RECOMECANDO EM', cx = W / 2;
  drawTextO(g, t1, Math.round(cx - textW(t1, 2) / 2), by + 7, Math.floor(w.t * 4) % 2 ? '#ff3a4a' : '#ff8a96', 2);
  drawTextO(g, t2, Math.round(cx - textW(t2) / 2), by + 25, '#ffffff');
  drawTextO(g, t3, Math.round(cx - textW(t3) / 2 - 10), by + 44, '#ffb0b8');
  const num = String(n), sc = 3 + (left % 1 > 0.8 ? 1 : 0);                // o número pulsa quando troca
  drawTextO(g, num, Math.round(cx + textW(t3) / 2 - 4), by + 41 - (sc - 3) * 3, '#ff3a4a', sc);
  const bar = bw - 24, f = left / FAIL_T;                                // barra que esvazia
  g.fillStyle = '#2a0008'; g.fillRect(bx + 12, by + bh - 16, bar, 5);
  g.fillStyle = '#ff3a4a'; g.fillRect(bx + 12, by + bh - 16, Math.round(bar * f), 5);
  g.fillStyle = '#ff9aa5'; g.fillRect(bx + 12, by + bh - 16, Math.round(bar * f), 1);
}

// --- Telas: cristais no mapa e o mundo da Dimensão Prisma ---
// Com os 7 cristais, o mapa do mundo ganha um portal depois do último chefe (js/mapa.js). Entrando nele, abre esta tela:
// as 7 fases são ilhas flutuando no vazio da dimensão (o fundo é o da fase escolhida) e o herói pula de ilha em ilha.
const Prisma = {
  ret: false,                // ao sair de uma fase extra, volta para esta tela (e não para o mapa)
  on: false, sel: 0, u: 0, face: 1, t: 0, pend: false, wasSel: false, last: -1,
  bg: null, bgK: -1, old: null, fade: 1,
};
// ilhas: x e altura do chão de cada uma (pixels lógicos da cena de 320 x 180)
const PZ_NODES = [[34, 122], [78, 94], [120, 126], [162, 98], [204, 128], [246, 96], [288, 118]];
const pzOpen = k => extraOpen(Game.save, k) || !!Game.save.best[LEVELS[EXTRA[k]].id];
const pzBob = k => Math.round(Math.sin(Prisma.t * 1.6 + k * 1.3) * 1.5);
function gemCanvas(id, dim, sc = 2) {
  const img = gemImg(id, dim), c = mk(img.width * sc, img.height * sc), g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, c.width, c.height);
  c.className = 'gem-ico'; return c;
}
// fileira de cristais embaixo do mapa: só aparece depois do primeiro cristal (segredo!)
function crisMapInfo() {
  const sv = Game.save, have = crisOf(sv), box = $('#map-cris');
  box.hidden = !have.length;
  if (!have.length) return;
  const slots = $('#map-cris-slots');
  slots.innerHTML = '';
  for (const c of CRISTAIS) { const cv = gemCanvas(c.id, !have.includes(c.id)); cv.title = have.includes(c.id) ? 'Cristal ' + c.nome : '???'; slots.appendChild(cv); }
  $('#map-cris-txt').textContent = prismaOpen(sv) ? 'Os 7 cristais abriram um portal depois do último chefe!' : `Cristais: ${have.length}/7 · estão escondidos pelos mundos`;
}
// ilha flutuante de cada fase (pronta em alta resolução): aberta na cor do cristal, fechada apagada
const _pzIsle = {};
function pzIsle(k, open) {
  const key = k + '' + open;
  if (_pzIsle[key]) return _pzIsle[key];
  const g = new PX(76, 64), C = CRISTAIS[k].cor, rock = ['#120c22', '#241a3c', '#3a2e5a', '#54467c'].map(c => mix(c, C[0], 0.3));
  crysIsle(g, 38, 26, 30, rng(70 + k * 13), C, rock, { sides: true });
  if (!open) g.tint(0, 0, 76, 64, '#0a0618', 0.62);
  return (_pzIsle[key] = outline(g.toCanvas(), '#0a0618'));
}
function openPrisma() {
  const sv = Game.save;
  Prisma.ret = false;
  if (!prismaOpen(sv)) { goLevels(); return; }
  Mapa.at = mapNodes().length; Mapa.hero = sv.cur;                       // ao voltar ao mapa, o herói está no portal
  mapHeroSprites();
  const inner = $('#pz-inner');
  $$('.pz-node', inner).forEach(b => b.remove());
  let done = 0, next = -1;
  EXTRA.forEach((idx, k) => {
    const lv = LEVELS[idx], open = pzOpen(k);
    if (sv.best[lv.id]) done++; else if (open && next < 0) next = k;
    const [x, y] = PZ_NODES[k], b = document.createElement('button');
    b.type = 'button'; b.className = 'pz-node'; b.disabled = !open;
    b.style.left = (x / BGW * 100) + '%'; b.style.top = ((y - 4) / BGH * 100) + '%';
    b.title = `P-${k + 1} · ${open ? lv.name : '???'}`; b.setAttribute('aria-label', b.title);
    b.addEventListener('pointerdown', () => { Prisma.wasSel = Prisma.sel === k; });
    b.addEventListener('focus', () => pzSelect(k));
    b.addEventListener('click', e => { Snd.init(); if (e.detail === 0 || Prisma.wasSel) pzPlay(); else pzSelect(k); });
    inner.appendChild(b);
  });
  // o herói começa na última fase jogada (ou na primeira nova); se uma fase nova abriu, ele já sai pulando até ela
  const from = Prisma.last >= 0 && pzOpen(Prisma.last) ? Prisma.last : next >= 0 ? next : 0;
  Prisma.sel = Prisma.u = from; Prisma.pend = false; Prisma.t = 0; Prisma.face = 1;
  $('#prisma-sub').textContent = done === EXTRA.length ? '★ Você dominou a Dimensão Prisma! ★' : `Cada fase tem uma regra. Quebrou a regra, a fase recomeça. (${done}/${EXTRA.length})`;
  show('prisma');
  pzInfo();
  if (next >= 0 && next !== from && Prisma.last >= 0) pzSelect(next);
  const b = $$('#pz-inner .pz-node')[Prisma.sel];
  if (b && !document.body.classList.contains('touch')) b.focus({ preventScroll: true });
}
function pzSelect(k) {
  if (k < 0 || k >= EXTRA.length || !pzOpen(k) || k === Prisma.sel) return;
  Prisma.sel = k; Prisma.pend = false;
  Snd.sfx('click'); pzInfo();
}
function pzStep(dir) {
  const btns = $$('#pz-inner .pz-node');
  for (let k = Prisma.sel + dir; k >= 0 && k < btns.length; k += dir) if (!btns[k].disabled) { btns[k].focus({ preventScroll: true }); return; }
}
function pzPlay() {
  if (Net.role === 'client') return;
  if (Prisma.u !== Prisma.sel) { Prisma.pend = true; return; }
  Prisma.last = Prisma.sel;
  Snd.sfx('check'); beginLevel(EXTRA[Prisma.sel]);
}
function pzInfo() {
  const k = Prisma.sel, lv = LEVELS[EXTRA[k]], R = RULES[lv.rule], best = Game.save.best[lv.id];
  $('#pz-name').textContent = `P-${k + 1} · ${lv.name}`;
  const stars = best ? '★'.repeat(best.stars) + '<i>' + '★'.repeat(3 - best.stars) + '</i>' : '<i>★★★</i>';
  $('#pz-sub').innerHTML = `${R.icon} ${R.nome}: ${R.desc} <span class="st">${stars}</span>`;
  $('#b-pz-play').style.display = Net.role === 'client' ? 'none' : '';
}
// a cada quadro enquanto a tela está aberta: o herói pula até a ilha escolhida e a cena é redesenhada
function prismaFrame(dt) {
  Prisma.t += dt;
  if (Prisma.u !== Prisma.sel) {
    const dir = Prisma.sel > Prisma.u ? 1 : -1, v = Math.max(2.2, Math.abs(Prisma.sel - Prisma.u) * 1.6);
    Prisma.u += dir * v * dt; Prisma.face = dir;
    if ((dir > 0 && Prisma.u >= Prisma.sel) || (dir < 0 && Prisma.u <= Prisma.sel)) {
      Prisma.u = Prisma.sel; Snd.sfx('jump');
      if (Prisma.pend) { Prisma.pend = false; pzDraw(); pzPlay(); return; }
    }
  }
  if (Prisma.fade < 1) Prisma.fade = Math.min(1, Prisma.fade + dt * 2.5);
  pzDraw();
}
// fundo da fase escolhida (troca devagar, misturando com o anterior), rolando sozinho
function pzBg(g, bg, x, a) {
  g.globalAlpha = a; g.drawImage(bg.sky, 0, 0, BGW, BGH);
  for (const l of bg.layers) { const ox = -Math.floor((x * l.par) % BGW); g.drawImage(l.img, ox, 0, BGW, BGH); g.drawImage(l.img, ox + BGW, 0, BGW, BGH); }
  g.globalAlpha = 1;
}
function pzDraw() {
  const cv = $('#pz-cv'), g = cv.getContext('2d'), t = Prisma.t, sv = Game.save;
  g.setTransform(HR, 0, 0, HR, 0, 0); g.imageSmoothingEnabled = false;
  if (Prisma.bgK !== Prisma.sel) { Prisma.old = Prisma.bg; Prisma.bg = bgOf('prisma' + (Prisma.sel + 1)); Prisma.bgK = Prisma.sel; Prisma.fade = Prisma.old ? 0 : 1; }
  const scroll = t * 12;
  if (Prisma.old && Prisma.fade < 1) pzBg(g, Prisma.old, scroll, 1);
  pzBg(g, Prisma.bg, scroll, Prisma.fade);
  g.fillStyle = 'rgba(6,4,14,.25)'; g.fillRect(0, 0, BGW, BGH);
  // pontes de luz entre as ilhas: arco-íris andando quando a próxima fase está aberta
  for (let k = 0; k < PZ_NODES.length - 1; k++) {
    const [x0, y0] = PZ_NODES[k], [x1, y1] = PZ_NODES[k + 1], on = pzOpen(k + 1), b0 = pzBob(k), b1 = pzBob(k + 1);
    for (let j = 2; j < 15; j++) {
      const s = j / 16, x = x0 + (x1 - x0) * s, y = y0 + b0 + (y1 + b1 - y0 - b0) * s - Math.sin(s * Math.PI) * 12 - 3;
      g.fillStyle = on ? RAINBOW[(j + 70 - Math.floor(t * 8)) % 7] : '#2a2440'; g.fillRect(Math.round(x), Math.round(y), on ? 2 : 1, on ? 2 : 1);
    }
  }
  // ilhas, cristal de cada fase, estrelas e cadeados
  PZ_NODES.forEach(([x, y], k) => {
    const open = pzOpen(k), best = sv.best[LEVELS[EXTRA[k]].id], img = pzIsle(k, open), b = pzBob(k);
    if (open) { g.globalCompositeOperation = 'lighter'; drawGlow(g, x, y + 4 + b, 30, CRISTAIS[k].cor[1], 0.22 + Math.sin(t * 2 + k) * 0.06); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    g.drawImage(img, x - img.width / HR / 2, y - 13 + b, img.width / HR, img.height / HR);
    const gem = gemImg(CRISTAIS[k].id, !open), gy = y - 30 + b + Math.round(Math.sin(t * 3 + k) * 1.5);
    g.drawImage(gem, x + 7, gy);
    if (k === Prisma.sel) {                                                // anel branco pulsando
      const r = 17 + Math.round(Math.sin(t * 6) * 1.5); g.fillStyle = '#ffffff';
      for (let a = 0; a < Math.PI * 2; a += 0.14) g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + 1 + b + Math.sin(a) * r * 0.32), 1, 1);
    }
    if (!open) { const lk = mapDisc('lock'); g.drawImage(lk, x - lk.cx / 2, y - 14 + b, lk.width / 2, lk.height / 2); }
    else drawTextO(g, 'P' + (k + 1), Math.round(x - 14), y + 6 + b, best ? '#ffd23f' : '#ffffff');
    if (best) for (let s = 0; s < 3; s++) g.drawImage(mapStar(s < best.stars ? 1 : 0), x - 3 + s * 6, y + 6 + b, 5, 5);
  });
  // o herói: pulando entre as ilhas ou parado na escolhida
  const spr = Mapa.spr;
  if (spr) {
    const u = Prisma.u, i = clamp(Math.floor(u), 0, PZ_NODES.length - 1), j = Math.min(PZ_NODES.length - 1, i + 1), f = u - i;
    const hx = PZ_NODES[i][0] + (PZ_NODES[j][0] - PZ_NODES[i][0]) * f - 4;
    const hy = PZ_NODES[i][1] + pzBob(i) + (PZ_NODES[j][1] + pzBob(j) - PZ_NODES[i][1] - pzBob(i)) * f - Math.sin(f * Math.PI) * 16;
    const moving = u !== Prisma.sel, img = moving ? spr.get('jump', 1) : spr.get('idle', (t % 3.3) < 0.13 ? 4 : Math.floor(t * 3.5) % 4);
    const x = Math.round(hx) - 24, y = Math.round(hy) + 2 - 46;
    if (!moving) { g.fillStyle = 'rgba(6,4,14,.4)'; g.fillRect(Math.round(hx) - 6, Math.round(hy), 12, 2); }
    if (Prisma.face < 0) { g.save(); g.translate(x + 48, y); g.scale(-1, 1); g.drawImage(img, 0, 0, 48, 48); g.restore(); } else g.drawImage(img, x, y, 48, 48);
  }
}
// teclado: ← → (ou A D) pulam entre as ilhas abertas; Enter/Espaço começam
addEventListener('keydown', e => {
  if (!Prisma.on || e.target.tagName === 'INPUT') return;
  const d = e.code === 'ArrowLeft' || e.code === 'KeyA' ? -1 : e.code === 'ArrowRight' || e.code === 'KeyD' ? 1 : 0;
  if (d) { e.preventDefault(); pzStep(d); }
  else if ((e.code === 'Enter' || e.code === 'Space') && !(document.activeElement && document.activeElement.tagName === 'BUTTON')) { e.preventDefault(); pzPlay(); }
});
$('#b-pz-play').addEventListener('click', () => { Snd.init(); pzPlay(); });
$('#b-prisma-back').addEventListener('click', () => { Snd.sfx('click'); goLevels(); });
