'use strict';
// ---------- Constantes de física ----------
const STEP = 1 / 60, GRAV = 900, MAXFALL = 420, JUMP = 320, RUN = 100;
const START_LIVES = 3, MAX_LIVES = 9, COINS_PER_LIFE = 50;
const MANA_REGEN = 4.5, MANA_DELAY = 1.2;           // regeneração lenta, só depois de um tempinho sem gastar
const BOSS_HEAL = 0.2;                               // fração da vida que o chefe recupera quando o jogador perde uma vida

const ELEMENTS = [
  { name: 'Fogo',   icon: '🔥', col: '#ff8a1f', col2: '#ffe27a', dmg: 2, status: 'burn',   chance: 0.4,  sfx: 'fire' },
  { name: 'Gelo',   icon: '❄️', col: '#6fd8ff', col2: '#e6fbff', dmg: 1, status: 'freeze', chance: 0.35, sfx: 'ice' },
  { name: 'Veneno', icon: '☠️', col: '#7bd34a', col2: '#d6ff8a', dmg: 1, status: 'poison', chance: 0.55, sfx: 'poison' },
];
const COST = { mago: [10, 40, 45], guerreiro: [0, 0, 0], arqueiro: [0, 0, 0], dragonico: [0, 0, 0] };
const CDMAX = { guerreiro: [0.34, 1.0, 0.1], mago: [0.4, 1.1, 2.0], arqueiro: [0.3, 0.9, 0.8], dragonico: [0.28, 1.2, 1.6] };

const CLASSES = {
  guerreiro: {
    id: 'guerreiro', name: 'Guerreiro', icon: '⚔️', hp: 6, mana: 0, crit: 0.1,
    desc: 'Resistente e versátil. Luta de perto ou de longe.',
    skills: [
      { key: 'J', name: 'Espada', desc: 'Golpe de curto alcance. Também rebate projéteis.', icon: '⚔️' },
      { key: 'K', name: 'Lança', desc: 'Arremessa a lança: médio/longo alcance, atravessa inimigos.', icon: '🔱' },
      { key: 'L', name: 'Escudo', desc: 'Segure para bloquear dano vindo pela frente.', icon: '🛡️' },
    ],
  },
  mago: {
    id: 'mago', name: 'Mago', icon: '🪄', hp: 4, mana: 100, crit: 0.08,
    desc: 'Frágil, mas com magias poderosas. A mana recarrega devagar!',
    skills: [
      { key: 'J', name: 'Magia elemental', desc: 'Fogo, Gelo ou Veneno: chance de queimar, congelar ou envenenar. 10 de mana.', icon: '🔥' },
      { key: 'K', name: 'Raio', desc: 'Dano enorme em linha reta e atordoa. 40 de mana.', icon: '⚡' },
      { key: 'L', name: 'Cura', desc: 'Recupera 1 coração. 45 de mana.', icon: '💚' },
    ],
  },
  arqueiro: {
    id: 'arqueiro', name: 'Arqueiro', icon: '🏹', hp: 5, mana: 0, crit: 0.15,
    desc: 'Ágil e preciso. Mira livre: mouse, toque na tela ou teclas Q/E.',
    skills: [
      { key: 'J', name: 'Flecha', desc: 'Tiro rápido na direção que você mira.', icon: '🏹' },
      { key: 'K', name: 'Tiro triplo', desc: 'Três flechas que atravessam o primeiro alvo.', icon: '🎯' },
      { key: 'L', name: 'Rolamento', desc: 'Investida rápida e invulnerável.', icon: '💨' },
    ],
  },
  dragonico: {
    id: 'dragonico', name: 'Dragônico', icon: '🐲', hp: 6, mana: 0, crit: 0.12,
    desc: 'Sangue de dragão: planeia com as asas, cospe fogo e esmaga do alto.',
    skills: [
      { key: 'J', name: 'Garras', desc: 'Combo de 3 garradas. A última é mais forte.', icon: '🐾' },
      { key: 'K', name: 'Sopro de fogo', desc: 'Jato de chamas à frente: queima quem atravessar.', icon: '🔥' },
      { key: 'L', name: 'Mergulho', desc: 'Despenca como um meteoro e explode ao pousar. Pulo duplo + segurar pulo = planar.', icon: '☄️' },
    ],
  },
};

const ENEMIES = {
  slime:    { w: 12, h: 9,  hp: 2,  speed: 24, stomp: true,  coin: 1 },
  bat:      { w: 12, h: 8,  hp: 1,  speed: 55, stomp: true,  coin: 1, fly: true },
  skeleton: { w: 10, h: 20, hp: 3,  speed: 22, stomp: true,  coin: 2 },
  knight:   { w: 12, h: 22, hp: 6,  speed: 26, stomp: false, coin: 3 },
  plant:    { w: 14, h: 24, hp: 4,  speed: 0,  stomp: false, coin: 3 },
  ghost:    { w: 14, h: 18, hp: 3,  speed: 34, stomp: true,  coin: 2, fly: true, ghost: true },
  guard:    { w: 12, h: 24, hp: 5,  speed: 20, stomp: false, coin: 3 },
  golem:    { w: 34, h: 46, hp: 70, speed: 0,  stomp: false, coin: 20, boss: true },
};

// ---------- Estado global ----------
const Game = { mode: 'title', world: null, save: null, t: 0 };

function loadSave() {
  const base = { char: null, unlocked: 1, best: {}, mute: false };
  try { const s = JSON.parse(localStorage.getItem('heroisdepixel_v1') || 'null'); if (s) { Object.assign(base, s); if (base.char && !CLASSES[base.char.cls]) base.char.cls = 'guerreiro'; return base; } } catch (e) {}
  return base;
}
function persist() { try { localStorage.setItem('heroisdepixel_v1', JSON.stringify(Game.save)); } catch (e) {} }

// ---------- Helpers ----------
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const approach = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);
const cxOf = e => e.x + e.w / 2, cyOf = e => e.y + e.h / 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const coreRect = e => ({ x: cxOf(e) - 8, y: e.y + 9 + (e.st === 'charge' ? 5 : 0), w: 16, h: 18 });   // ponto fraco do chefe

function tileAt(lv, tx, ty) {
  if (tx < 0 || tx >= lv.w) return 1;
  if (ty < 0 || ty >= lv.h) return 0;
  return lv.tiles[ty][tx];
}
const solidPx = (lv, x, y) => tileAt(lv, Math.floor(x / T), Math.floor(y / T)) === 1;
const standPx = (lv, x, y) => { const t = tileAt(lv, Math.floor(x / T), Math.floor(y / T)); return t === 1 || t === 2; };
function groundBelow(lv, x, y, max = 8) {
  const tx = Math.floor(x / T);
  for (let ty = Math.floor(y / T); ty < Math.min(lv.h, Math.floor(y / T) + max); ty++) {
    const t = tileAt(lv, tx, ty);
    if (t === 1 || (t === 2 && ty * T >= y - 1)) return ty * T;
  }
  return null;
}

function moveBody(b, dt, lv) {
  const prevBottom = b.y + b.h;
  const rng4 = () => ({ x0: Math.floor(b.x / T), x1: Math.floor((b.x + b.w - 0.001) / T), y0: Math.floor(b.y / T), y1: Math.floor((b.y + b.h - 0.001) / T) });
  b.x += b.vx * dt; b.wall = 0;
  let r = rng4();
  for (let ty = r.y0; ty <= r.y1; ty++) for (let tx = r.x0; tx <= r.x1; tx++) {
    if (tileAt(lv, tx, ty) === 1) {
      if (b.vx > 0) { b.x = tx * T - b.w; b.wall = 1; } else if (b.vx < 0) { b.x = (tx + 1) * T; b.wall = -1; }
      b.vx = 0; r = rng4();
    }
  }
  b.y += b.vy * dt; b.ground = false;
  r = rng4();
  for (let ty = r.y0; ty <= r.y1; ty++) for (let tx = r.x0; tx <= r.x1; tx++) {
    const t = tileAt(lv, tx, ty);
    if (t === 1) {
      if (b.vy > 0) { b.y = ty * T - b.h; b.ground = true; } else if (b.vy < 0) b.y = (ty + 1) * T;
      b.vy = 0; r = rng4();
    } else if (t === 2 && b.vy >= 0 && !(b.drop > 0) && prevBottom <= ty * T + 1) {
      b.y = ty * T - b.h; b.vy = 0; b.ground = true; r = rng4();
    }
  }
}

// ---------- Eventos de rede ----------
// No multiplayer o anfitrião simula o mundo; efeitos pontuais (partículas, sons, textos) viram eventos para os outros jogadores.
const r1 = v => Math.round(v * 10) / 10;
function emit(ev) { if (Net.role === 'host') Net.ev.push(ev); }
function sfx(n) { Snd.sfx(n); emit(['s', n]); }
function announce(t, s = '', ms) { banner(t, s, ms); emit(['bn', t, s, ms]); }
function music(n) { Snd.music(n); emit(['m', n]); }
function addFx(w, f) {
  w.fx.push(f);
  if (Net.role === 'host') { const o = { ...f }; if (o.p) { o.pid = o.p.id; delete o.p; } emit(['fx', o]); }
}

function burst(w, x, y, col, n = 8, spd = 80, life = 0.5, g = 200) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = spd * (0.4 + Math.random() * 0.6);
    w.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * 0.3, life: life * (0.6 + Math.random() * 0.4), max: life, col, g, sz: Math.random() < 0.3 ? 2 : 1 });
  }
  emit(['b', r1(x), r1(y), col, n, spd, life, g]);
}
function floatText(w, x, y, txt, col = '#fff', big = false) {
  w.floats.push({ x, y, txt: String(txt), col, big, t: big ? 1.0 : 0.8, max: big ? 1.0 : 0.8, vy: big ? -34 : -26 });
  emit(['f', r1(x), r1(y), String(txt), col, big]);
}
// brilhos verdes subindo (cura)
function rise(w, x, y, rx, ry, n, life) {
  for (let i = 0; i < n; i++) w.parts.push({ x: x + rnd(-rx, rx), y: y + rnd(0, ry), vx: rnd(-8, 8), vy: rnd(-50, -20), life, max: life, col: i % 2 ? '#7bff9a' : '#d8ffe3', g: 0, sz: 2 });
  emit(['r', r1(x), r1(y), rx, ry, n, life]);
}

// ---------- Comandos por jogador ----------
// Cada herói lê um "controle" próprio: o local vem do teclado/toque; os remotos chegam pela rede.
const CTL_KEYS = ['left', 'right', 'jump', 'down', 'a', 'b', 'c', 'aimup', 'aimdown'];
const CTL_BIT = Object.fromEntries(CTL_KEYS.map((k, i) => [k, 1 << i]));
function makeCtl() {
  return { d: 0, h: 0, am: 'keys', ad: 0, af: 1, isDown(k) { return !!(this.d & CTL_BIT[k]); }, hit(k) { return !!(this.h & CTL_BIT[k]); } };
}
// Lê teclado/toque/mouse para o controle do jogador local (a mira livre é calculada com a câmera deste aparelho)
function readLocalCtl(w, p, c = p.inp) {
  let d = 0, h = 0;
  for (const k of CTL_KEYS) { if (Input.isDown(k)) d |= CTL_BIT[k]; if (Input.hit(k)) h |= CTL_BIT[k]; }
  c.d = d; c.h = h; c.am = Input.aimMode === 'pointer' && Input.aim ? 'pointer' : 'keys';
  if (c.am === 'pointer') {
    const dx = Input.aim.x + w.cam.x - cxOf(p), dy = Input.aim.y + w.cam.y - (p.y + 8);
    c.af = dx >= 0 ? 1 : -1;
    c.ad = Math.atan2(dy, Math.max(4, Math.abs(dx))) * 180 / Math.PI;
  }
  return c;
}
function computeDepth(lv) {
  const d = Array.from({ length: lv.h }, () => new Uint8Array(lv.w));
  for (let tx = 0; tx < lv.w; tx++) { let run = 0; for (let ty = 0; ty < lv.h; ty++) { if (lv.tiles[ty][tx] === 1) { d[ty][tx] = Math.min(3, run); run++; } else run = 0; } }
  return d;
}

// ---------- Início de fase ----------
// roster: [{ id, ch }] — um item por jogador (no modo solo, só você). me: id do jogador deste aparelho.
function startLevel(idx, roster = [{ id: 0, ch: Game.save.char }], me = 0) {
  const def = LEVELS[idx], lv = genLevel(def);
  const anyMana = roster.some(r => (CLASSES[r.ch.cls] || CLASSES.guerreiro).mana > 0);
  const w = Game.world = {
    idx, def, lv, roster, players: [], p: null, th: THEMES[def.theme], bg: bgOf(def.theme), depth: computeDepth(lv), decor: buildDecor(lv, def.theme),
    enemies: lv.spawns.map(makeEnemy), proj: [], eproj: [], parts: [], fx: [], floats: [], amb: [],
    coins: lv.coins.map(c => ({ ...c, got: false })),
    picks: lv.picks.map(c => ({ ...c, t: c.t === 'mana' && !anyMana ? 'heart' : c.t, got: false })),
    checks: lv.checks.map(c => ({ ...c, on: false })),
    respawn: { x: lv.start.x, y: lv.start.y }, cam: { x: 0, y: 0 }, t: 0, coinsGot: 0, deaths: 0, shake: 0, hitstop: 0,
    lives: START_LIVES, nextLife: COINS_PER_LIFE, lifeT: 0, overT: 0,
    state: 'play', bossActive: false, boss: null, bossDrops: 0, flash: 0,
  };
  roster.forEach(r => addPlayer(w, r));
  const p = w.p = w.players.find(q => q.id === me) || w.players[0];
  w.boss = w.enemies.find(e => e.boss) || null;
  w.cam.x = clamp(cxOf(p) - W / 2, 0, lv.w * T - W);
  w.cam.y = clamp(p.y - 90, 0, lv.h * T - H);
  initAmbient(w);
  Game.mode = 'play'; Input.enabled = true; Input.clear();
  setupTouch(p);
  Snd.music(THEMES[def.theme].song);
  banner(def.name, `Fase ${idx + 1}`);
  if (Net.role === 'host') Net.started(w);
}
// Cria o herói de um jogador no último checkpoint (os jogadores ficam lado a lado)
function addPlayer(w, r) {
  const ch = r.ch, cls = CLASSES[ch.cls] || CLASSES.guerreiro, i = w.players.length;
  const p = {
    id: r.id, ch, cls, spr: buildPlayerSprites(ch), inp: makeCtl(),
    x: w.respawn.x - 5 + i * 10, y: w.respawn.y - 20, w: 10, h: 20, vx: 0, vy: 0, face: 1,
    ground: false, coyote: 0, jbuf: 0, hp: cls.hp, maxHp: cls.hp, mana: cls.mana, maxMana: cls.mana, manaDelay: 0,
    cd: { a: 0, b: 0, c: 0 }, act: null, actT: 0, actDur: 0, inv: 0, hurtT: 0, block: false, dash: 0, dashSpd: 0, dashKind: null, dashHit: null,
    melee: null, anim: 0, dead: false, deadT: 0, out: false, drop: 0, landT: 0, flipT: 0, jumps: 0, glide: false, diving: false, diveWait: false, combo: 0, comboT: 0, atkIdx: 0, dustT: 0,
    kaim: 0, aimDeg: 0, aimFace: 1, lastVy: 0, shotAim: false,
  };
  w.players.push(p);
  return p;
}
// Jogador vivo mais próximo (alvo dos inimigos)
function nearestPlayer(w, e) {
  let best = null, bd = Infinity;
  for (const p of w.players) if (!p.dead) {
    const d = Math.abs(cxOf(p) - cxOf(e)) + Math.abs(cyOf(p) - cyOf(e)) * 0.5;
    if (d < bd) { bd = d; best = p; }
  }
  return best || w.p;
}

function makeEnemy(s, id) {
  const d = ENEMIES[s.t];
  return {
    id, type: s.t, ...d, x: s.x - d.w / 2, y: s.y - d.h, vx: 0, vy: 0, dir: -1, hp: d.hp, maxHp: d.hp, t: Math.random() * 5,
    flash: 0, hurt: 0, slow: 0, stun: 0, cd: rnd(0.5, 2), st: d.boss ? 'idle' : null, stT: 1.2, dead: false, active: false, ground: false, wall: 0,
    sts: { burn: 0, poison: 0, freeze: 0 }, tk: { burn: 0, poison: 0 }, throwT: 0,
  };
}

// ---------- Status (queimar / envenenar / congelar) ----------
function applyStatus(w, e, st, chance = 1) {
  if (!st || e.dead || Math.random() > chance) return false;
  if (st === 'burn') { e.sts.burn = 2.4; e.tk.burn = 0.5; e.sts.freeze = 0; sfx('burn'); }
  else if (st === 'poison') { e.sts.poison = 4.2; e.tk.poison = 0.7; }
  else if (st === 'freeze') {
    if (e.boss) e.sts.freeze = 3;                       // chefe não congela de vez: só fica lento
    else { e.sts.freeze = 2.2; e.sts.burn = 0; e.vx = 0; }
    sfx('freeze'); burst(w, cxOf(e), cyOf(e), '#9fe8ff', 8, 60, 0.5, 0);
  }
  return true;
}
const frozen = e => e.sts.freeze > 0 && !e.boss;
function dotHit(w, e, d, col) {
  e.hp -= d; e.flash = 0.06;
  floatText(w, cxOf(e) + rnd(-3, 3), e.y - 2, Math.ceil(d), col);
  burst(w, cxOf(e), cyOf(e), col, 3, 30, 0.4, 0);
  if (e.hp <= 0) killEnemy(w, e);
}

// ---------- Dano ----------
// o: { by (jogador que atacou), dir, status, chance, kb, rect (área do golpe, p/ ponto fraco do chefe), back, noCrit, dot }
function damageEnemy(w, e, dmg, o = {}) {
  if (e.dead) return;
  const p = o.by || w.p;
  if (o.by) e.lastBy = o.by;
  let crit = false, weak = false;
  if (!o.dot) {
    weak = !!(e.boss && o.rect && overlap(o.rect, coreRect(e)));
    crit = weak || !!o.back || (!o.noCrit && Math.random() < p.cls.crit);
    if (frozen(e)) { dmg *= 1.5; e.sts.freeze = 0; burst(w, cxOf(e), cyOf(e), '#d8f6ff', 14, 110, 0.6); sfx('shatter'); }
    if (e.stun > 0) dmg *= 1.5;
    if (crit) dmg *= 2;
  }
  e.hp -= dmg; e.flash = 0.12; e.sq = 0.14;
  if (!o.quiet || crit) sfx(crit ? 'crit' : 'hit');
  const dir = o.dir || 0;
  if (!e.boss && dir) { e.vx = dir * 110 * (o.kb || 1); e.vy = -80; e.hurt = 0.25; }
  if (o.status === 'freeze') e.slow = Math.max(e.slow, 2.5);
  if (o.status) applyStatus(w, e, o.status, o.chance === undefined ? 1 : o.chance);
  const sz = crit ? 2 : 1;
  floatText(w, cxOf(e) + rnd(-4, 4), e.y - 4, Math.max(1, Math.round(dmg)) + (crit ? '!' : ''), crit ? (weak ? '#ff9a3a' : '#ffe94d') : '#fff', crit);
  burst(w, cxOf(e), cyOf(e), crit ? '#ffe94d' : '#fff', crit ? 10 : 4, crit ? 110 : 60, crit ? 0.4 : 0.3);
  if (crit) { w.flash = Math.max(w.flash, 0.04); w.shake = Math.max(w.shake, e.boss ? 0.2 : 0.08); }
  if (!o.quiet || crit) w.hitstop = Math.max(w.hitstop, crit ? 0.07 : 0.032);
  if (e.hp <= 0) { w.hitstop = Math.max(w.hitstop, 0.09); killEnemy(w, e); }
}
function killEnemy(w, e) {
  if (e.dead) return;
  e.dead = true; e.deadT = 0; emit(['k', e.id]);
  // corpo que voa: guarda só o necessário para redesenhar o inimigo (a imagem é gerada na hora, em qualquer aparelho)
  const es = { type: e.type, st: e.st, t: e.t, hurt: e.hurt, ground: e.ground, vx: e.vx, throwT: e.throwT, hp: e.hp, maxHp: e.maxHp };
  addFx(w, { type: 'corpse', es, x: r1(cxOf(e)), y: r1(e.y + e.h + 1 + enemyYOff(e)), flip: e.dir < 0, vy: e.boss ? 0 : -150, t: e.boss ? 2.6 : 0.5, max: e.boss ? 2.6 : 0.5, boss: !!e.boss });
  burst(w, cxOf(e), cyOf(e), e.boss ? '#ffb347' : '#fff', e.boss ? 40 : 10, e.boss ? 160 : 90, 0.7);
  w.coinsGot += e.coin; checkLifeUp(w, e.lastBy); sfx('coin');
  for (let i = 0; i < Math.min(e.coin, 6); i++) addFx(w, { type: 'coinpop', x: r1(cxOf(e)), y: r1(cyOf(e)), vx: r1(rnd(-40, 40)), vy: r1(rnd(-150, -90)), t: 0.7, max: 0.7 });
  floatText(w, cxOf(e), e.y - 8, '+' + e.coin, '#ffd23f');
  if (e.boss) {
    w.state = 'win'; w.winT = 2.8; w.shake = 1.2; w.eproj = []; sfx('boom');
    for (let i = 0; i < 7; i++) setTimeout(() => { if (Game.world === w) { burst(w, cxOf(e) + rnd(-18, 18), cyOf(e) + rnd(-20, 20), '#ffb347', 14, 110, 0.7); sfx('boom'); w.shake = 0.5; } }, i * 300);
  }
}
function checkLifeUp(w, p = w.p) {
  while (w.coinsGot >= w.nextLife) {
    w.nextLife += COINS_PER_LIFE;
    if (w.lives < MAX_LIVES) { w.lives++; w.lifeT = 1.8; sfx('life'); floatText(w, cxOf(p), p.y - 10, '1UP!', '#7bff9a', true); }
  }
}

function hurtPlayer(w, p, dmg, srcX) {
  if (p.inv > 0 || p.dead || w.state !== 'play') return false;
  const pc = cxOf(p);
  if (p.block && Math.sign(srcX - pc) === p.face) {
    sfx('block'); p.inv = 0.3; p.vx = -p.face * 50;
    burst(w, pc + p.face * 8, p.y + 10, '#fff', 5, 70, 0.25);
    return false;
  }
  p.hp -= dmg; p.inv = 1.3; p.hurtT = 0.3; p.act = null; p.melee = null; p.dash = 0; p.diving = false; p.diveWait = false;
  p.vx = (pc < srcX ? -1 : 1) * 130; p.vy = -170;
  w.shake = 0.18; w.hitstop = Math.max(w.hitstop, 0.05); sfx('hurt');
  burst(w, pc, p.y + 10, '#e63946', 8, 90, 0.5);
  if (p.hp <= 0) { p.hp = 0; playerDie(w, p); }
  return true;
}
// Zerar os corações custa 1 vida (estilo Sonic). As vidas são do time; sem vidas, quem cai fica esperando.
function playerDie(w, p) {
  w.lives = Math.max(0, w.lives - 1); w.deaths++; p.diving = false; p.diveWait = false;
  p.dead = true; p.deadT = 1.6; p.vy = -230; p.vx = 0; p.dash = 0; p.melee = null; p.act = null; p.glide = false; p.block = false;
  sfx('die');
}
// noHeal: volta de quem estava esperando uma vida (não cura o chefe de novo)
function respawn(w, p, keepHp, noHeal) {
  p.x = w.respawn.x - p.w / 2; p.y = w.respawn.y - p.h; p.vx = p.vy = 0; p.inv = 1.8; p.dead = false; p.out = false; p.hurtT = 0;
  if (!keepHp) {
    p.hp = p.maxHp; p.mana = p.maxMana;
    // o chefe recupera um pouco de vida a cada vida perdida
    const b = w.boss;
    if (b && w.bossActive && !b.dead && !noHeal) {
      const heal = Math.round(b.maxHp * BOSS_HEAL / w.players.length), before = b.hp;   // em grupo, cada queda cura menos
      b.hp = Math.min(b.maxHp, b.hp + heal);
      if (b.hp > before) {
        floatText(w, cxOf(b), b.y - 6, '+' + Math.round(b.hp - before), '#7bff9a', true);
        rise(w, cxOf(b), b.y, 16, 40, 18, 0.9);
        sfx('bossheal');
      }
      b.st = 'idle'; b.stT = 1.5; b.vx = 0; b.stun = 0; w.eproj = [];
    }
  }
  if (p === w.p) w.cam.x = clamp(cxOf(p) - W / 2, 0, w.lv.w * T - W);
}

// ---------- Habilidades ----------
function act(p, name, dur) { p.act = name; p.actT = dur; p.actDur = dur; }
function shoot(w, p, o) {
  w.proj.push({ w: 8, h: 4, g: 0, life: 1.4, pierce: 0, hit: new Set(), dmg: 1, status: null, chance: 1, by: p, ...o });
}
const handPos = (p, f) => ({ x: cxOf(p) + f * 3, y: p.y + 8 });

// Direção da mira do arqueiro (mouse/toque = livre; teclado = Q/E sobem e descem)
function updateAim(w, p, dt) {
  if (p.cls.id !== 'arqueiro' && p.cls.id !== 'mago') return;
  const c = p.inp;
  let deg;
  if (c.am === 'pointer') {
    p.aimFace = c.af; deg = c.ad;
  } else {
    if (c.isDown('aimup')) p.kaim -= 120 * dt;
    if (c.isDown('aimdown')) p.kaim += 120 * dt;
    p.kaim = clamp(p.kaim, -85, 70);
    p.aimFace = p.face; deg = p.kaim;
  }
  p.aimDeg = clamp(deg, -90, 75);
}

function skillA(w, p) {
  if (p.cd.a > 0 || p.block) return;
  const f = p.face, id = p.cls.id;
  if (id === 'guerreiro') {
    p.cd.a = 0.34; act(p, 'atk', 0.28); p.melee = { wait: 0.06, t: 0.14, hit: new Set(), dmg: 2 }; sfx('slash');
    addFx(w, { type: 'slash', t: 0.2, max: 0.2, p, face: f, kind: 'sword' });
  } else if (id === 'mago') {
    const eli = p.ch.elem || 0, el = ELEMENTS[eli];
    if (p.mana < COST.mago[0]) { sfx('no'); p.cd.a = 0.2; return; }
    p.mana -= COST.mago[0]; p.manaDelay = MANA_DELAY; p.cd.a = 0.4; act(p, 'cast', 0.25); sfx(el.sfx);
    // mira: mouse/toque apontam livremente; no teclado a magia mira sozinha no inimigo mais próximo à frente
    let ang = 0, ff = f;
    if (p.inp.am === 'pointer') { ff = p.aimFace; ang = p.aimDeg * Math.PI / 180; p.face = ff; }
    else {
      let best = null;
      for (const e of w.enemies) if (!e.dead && e.active && Math.sign(cxOf(e) - cxOf(p)) === f) {
        const ddx = Math.abs(cxOf(e) - cxOf(p)), ddy = cyOf(e) - (p.y + 10);
        if (ddx < 170 && Math.abs(ddy) < 70 && (!best || ddx < best.ddx)) best = { ddx, ddy };
      }
      if (best) ang = Math.atan2(best.ddy, Math.max(12, best.ddx));
    }
    const mx = cxOf(p) + ff * 9, my = p.y + 10;
    shoot(w, p, { type: 'spell', el, eli, x: mx - 3, y: my - 3, w: 7, h: 7, vx: Math.cos(ang) * ff * 190, vy: Math.sin(ang) * 190, dmg: el.dmg, status: el.status, chance: el.chance, life: 1.6 });
  } else if (id === 'arqueiro') {
    p.face = p.aimFace; p.cd.a = 0.3; act(p, 'aim', 0.22); p.shotAim = true; sfx('arrow');
    const a = p.aimDeg * Math.PI / 180, dx = Math.cos(a) * p.face, dy = Math.sin(a), h = handPos(p, p.face);
    shoot(w, p, { type: 'arrow', x: h.x + dx * 10 - 3, y: h.y + dy * 10 - 2, w: 6, h: 4, vx: dx * 340, vy: dy * 340, g: 36, dmg: 1 });
  } else { // dragônico: garras
    p.combo = p.comboT > 0 ? (p.combo + 1) % 3 : 0; p.comboT = 0.55; p.atkIdx = p.combo;
    p.cd.a = 0.28; act(p, 'atk', 0.24);
    p.melee = { wait: 0.03, t: 0.12, hit: new Set(), dmg: p.combo === 2 ? 3 : 2, reach: 24 };
    if (p.ground) p.vx = f * 70;
    sfx('slash');
    addFx(w, { type: 'slash', t: 0.18, max: 0.18, p, face: f, kind: 'claw', idx: p.combo });
  }
}
function skillB(w, p) {
  if (p.cd.b > 0 || p.block) return;
  const f = p.face, id = p.cls.id, h = handPos(p, f);
  if (id === 'guerreiro') {
    p.cd.b = 1.0; act(p, 'cast', 0.28); sfx('spear');
    shoot(w, p, { type: 'spear', x: h.x + f * 4 - 8, y: h.y - 1, w: 16, h: 3, vx: f * 270, vy: 0, g: 30, dmg: 3, pierce: 99, life: 0.9 });
  } else if (id === 'mago') {
    if (p.mana < COST.mago[1]) { sfx('no'); p.cd.b = 0.2; return; }
    p.mana -= COST.mago[1]; p.manaDelay = MANA_DELAY; p.cd.b = 1.1; act(p, 'cast', 0.3); sfx('zap');
    const hx = h.x + f * 8; let x1 = hx; const y = p.y + 9;
    for (let d = 0; d < 170; d += 4) { if (solidPx(w.lv, hx + f * d, y)) break; x1 = hx + f * d; }
    const rect = { x: Math.min(hx, x1), y: y - 7, w: Math.abs(x1 - hx) + 1, h: 14 };
    for (const e of w.enemies) if (!e.dead && e.active && overlap(rect, e)) {
      damageEnemy(w, e, 10, { by: p, dir: f, rect, noCrit: false });
      if (!e.boss && !e.dead) { e.stun = Math.max(e.stun, 1.2); e.vx = 0; }
      burst(w, cxOf(e), cyOf(e), '#ffe94d', 8, 90, 0.4);
    }
    const pts = [];
    for (let i = 0; i <= 9; i++) pts.push([r1(hx + (x1 - hx) * i / 9), r1(y + (i && i < 9 ? rnd(-5, 5) : 0))]);
    addFx(w, { type: 'bolt', pts, t: 0.26, max: 0.26 });
    w.flash = 0.07; w.shake = Math.max(w.shake, 0.12);
    burst(w, x1, y, '#fff7a0', 8, 100, 0.3, 0);
  } else if (id === 'arqueiro') {
    p.face = p.aimFace; p.cd.b = 0.9; act(p, 'aim', 0.26); p.shotAim = true; sfx('arrow');
    const hh = handPos(p, p.face);
    for (const off of [-7, 0, 7]) {
      const a = (p.aimDeg + off) * Math.PI / 180, dx = Math.cos(a) * p.face, dy = Math.sin(a);
      shoot(w, p, { type: 'arrow', x: hh.x + dx * 10 - 3, y: hh.y + dy * 10 - 2, w: 6, h: 4, vx: dx * 340, vy: dy * 340, g: 30, dmg: 1.5, pierce: 1, life: 1.6 });
    }
  } else { // dragônico: sopro de fogo
    p.cd.b = 1.2; act(p, 'cast', 0.4); sfx('fire');
    const mx = cxOf(p) + f * 9, my = p.y + 7;
    for (let i = 0; i < 8; i++) {
      const a = (i - 3.5) * 0.1 + rnd(-0.04, 0.04), sp = rnd(130, 215);
      shoot(w, p, { type: 'flame', x: mx - 3, y: my - 3, w: 7, h: 7, vx: Math.cos(a) * f * sp, vy: Math.sin(a) * sp - 6, g: -35, dmg: 0.7, status: 'burn', chance: 0.25, life: rnd(0.3, 0.44), pierce: 99, quiet: true });
    }
  }
}
function skillC(w, p) {
  if (p.cd.c > 0) return;
  const id = p.cls.id;
  if (id === 'mago') {
    if (p.hp >= p.maxHp) return;
    if (p.mana < COST.mago[2]) { sfx('no'); p.cd.c = 0.3; return; }
    p.mana -= COST.mago[2]; p.manaDelay = MANA_DELAY; p.cd.c = 2.0; act(p, 'cast', 0.4); p.hp = Math.min(p.maxHp, p.hp + 1); sfx('heal');
    floatText(w, cxOf(p), p.y - 6, '+1', '#7bff9a', true);
    rise(w, cxOf(p), p.y, 7, 20, 16, 0.8);
  } else if (id === 'arqueiro') {
    p.cd.c = 0.8; p.dash = 0.24; p.dashSpd = 250; p.dashKind = 'roll'; p.inv = Math.max(p.inv, 0.34); sfx('dash');
  } else if (id === 'dragonico') {
    p.cd.c = 1.6; p.dashHit = new Set(); p.act = null; p.melee = null; sfx('dash');
    if (p.ground) { p.vy = -250; p.diveWait = true; } else { p.diving = true; p.vy = 520; }
  }
}

// ---------- Explosão da bomba ----------
function explode(w, q) {
  const cx = q.x + q.w / 2, cy = q.y + q.h / 2, R = 30, rect = { x: cx - R, y: cy - R, w: R * 2, h: R * 2 };
  sfx('bomb'); w.shake = Math.max(w.shake, 0.3); w.flash = Math.max(w.flash, 0.06);
  burst(w, cx, cy, '#ffb347', 20, 140, 0.6, 100); burst(w, cx, cy, '#ff5a2a', 14, 100, 0.5, 60); burst(w, cx, cy, '#fff2b0', 8, 60, 0.3, 0);
  addFx(w, { type: 'ring', x: r1(cx), y: r1(cy), t: 0.3, max: 0.3, r: R });
  for (const e of w.enemies) if (!e.dead && e.active && overlap(rect, e)) {
    const d = Math.hypot(cxOf(e) - cx, cyOf(e) - cy);
    if (d < R + Math.max(e.w, e.h) / 2) damageEnemy(w, e, q.dmg, { by: q.by, dir: Math.sign(cxOf(e) - cx) || 1, rect, status: q.noFire ? null : 'burn', chance: 0.5, kb: 1.4 });
  }
}

// ---------- Jogador ----------
function updatePlayer(w, dt, p, ctl) {
  const lv = w.lv, c = p.inp;
  p.anim += dt;
  if (p.inv > 0) p.inv -= dt;
  if (p.hurtT > 0) p.hurtT -= dt;
  if (p.drop > 0) p.drop -= dt;
  if (p.landT > 0) p.landT -= dt;
  if (p.flipT > 0) p.flipT -= dt;
  if (p.comboT > 0) p.comboT -= dt;
  for (const k in p.cd) if (p.cd[k] > 0) p.cd[k] -= dt;
  if (p.act) { p.actT -= dt; if (p.actT <= 0) { p.act = null; p.shotAim = false; } }
  if (p.cls.mana) {
    if (p.manaDelay > 0) p.manaDelay -= dt;
    else p.mana = Math.min(p.maxMana, p.mana + MANA_REGEN * dt);
  }
  if (ctl) updateAim(w, p, dt);

  const dir = ctl ? (c.isDown('right') ? 1 : 0) - (c.isDown('left') ? 1 : 0) : 0;
  p.block = ctl && p.cls.id === 'guerreiro' && c.isDown('c') && p.ground && p.dash <= 0 && p.hurtT <= 0;

  if (p.dash > 0) {
    p.dash -= dt; p.vx = p.face * p.dashSpd; p.vy = Math.min(p.vy, 0) * 0.5;
    if (p.dash <= 0) p.dashKind = null;
  } else {
    if (p.hurtT > 0) p.vx = approach(p.vx, 0, 260 * dt);
    else {
      const maxV = RUN * (p.block ? 0.3 : 1);
      if (dir) { p.vx = approach(p.vx, dir * maxV, (p.ground ? 900 : 600) * dt); p.face = dir; }
      else p.vx = approach(p.vx, 0, (p.ground ? 1100 : 250) * dt);
    }
    p.vy = Math.min(MAXFALL, p.vy + GRAV * dt);
    if (p.cls.id === 'dragonico') {
      p.glide = ctl && !p.ground && p.vy > 40 && c.isDown('jump') && !p.diving && p.hurtT <= 0;
      if (p.glide) p.vy = Math.min(p.vy, 48);
      if (p.diveWait && p.vy > -30) { p.diveWait = false; p.diving = true; sfx('dash'); }
      if (p.diving) {
        p.vy = 540; p.vx *= 0.92; p.inv = Math.max(p.inv, 0.06);
        for (const e of w.enemies) if (!e.dead && e.active && !p.dashHit.has(e) && overlap(p, e)) { p.dashHit.add(e); damageEnemy(w, e, 3, { by: p, dir: p.face, rect: p }); }
      }
    }
  }

  if (ctl && p.hurtT <= 0) {
    if (p.ground) { p.coyote = 0.1; p.jumps = p.cls.id === 'dragonico' ? 1 : 0; } else p.coyote -= dt;
    if (c.hit('jump')) p.jbuf = 0.12; else p.jbuf -= dt;
    if (p.jbuf > 0 && !p.block) {
      if (c.isDown('down') && p.ground && standPx(lv, cxOf(p), p.y + p.h + 2) && !solidPx(lv, cxOf(p), p.y + p.h + 2)) {
        p.drop = 0.25; p.y += 2; p.jbuf = 0;
      } else if (p.coyote > 0) {
        p.vy = -JUMP; p.jbuf = 0; p.coyote = 0; sfx('jump');
        burst(w, cxOf(p), p.y + p.h, '#ddd', 4, 30, 0.3, 0);
      } else if (p.jumps > 0 && p.dash <= 0) { // batida de asas do dragônico
        p.vy = -JUMP * 0.92; p.jbuf = 0; p.jumps--; p.flipT = 0.36; sfx('djump');
        addFx(w, { type: 'ring', x: r1(cxOf(p)), y: r1(p.y + p.h), t: 0.25, max: 0.25, r: 12, col: '#ffd27a' });
        burst(w, cxOf(p), p.y + p.h, '#ffd27a', 8, 50, 0.4, 0);
      }
    }
    if (!c.isDown('jump') && p.vy < -110 && p.dash <= 0) p.vy = -110;

    if (p.dash <= 0) {
      if (c.isDown('a')) skillA(w, p);
      if (c.isDown('b')) skillB(w, p);
      if (c.hit('c')) skillC(w, p);
    }
  }

  const wasGround = p.ground, fallV = p.vy;
  moveBody(p, dt, lv);
  if (p.diving && p.ground) { p.diving = false; explode(w, { x: p.x, y: p.y + p.h - 6, w: p.w, h: 6, dmg: 4, noFire: true, by: p }); }
  if (p.ground && !wasGround && fallV > 140) { p.landT = 0.1; burst(w, cxOf(p), p.y + p.h, '#ddd', 5, 35, 0.3, 0); }
  p.lastVy = p.vy;

  // golpe corpo a corpo
  if (p.melee) {
    if (p.melee.wait > 0) p.melee.wait -= dt;
    else {
      p.melee.t -= dt;
      const m = meleeRect(p);
      for (const e of w.enemies) if (!e.dead && e.active && !p.melee.hit.has(e) && overlap(m, e)) {
        p.melee.hit.add(e);
        damageEnemy(w, e, p.melee.dmg, { by: p, dir: p.face, rect: m, });
      }
      for (const q of w.eproj) if (q.type !== 'wave' && overlap(m, q)) { q.life = 0; burst(w, q.x, q.y, '#fff', 4, 50, 0.2); sfx('block'); }
      if (p.melee.t <= 0) p.melee = null;
    }
  }
  // espinhos
  const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 0.01) / T), y0 = Math.floor((p.y + p.h - 6) / T), y1 = Math.floor((p.y + p.h - 0.01) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (tileAt(lv, tx, ty) === 3 && p.y + p.h > ty * T + 9) { if (hurtPlayer(w, p, 1, cxOf(p) + p.face)) p.vy = -200; }
  }

  // queda no abismo
  if (p.y > lv.h * T + 24 && w.state === 'play' && !p.dead) {
    p.hp -= 1; sfx('hurt');
    if (p.hp <= 0) { p.hp = 0; playerDie(w, p); } else respawn(w, p, true);
  }
  if (p.dead) return;

  // checkpoints, itens, moedas, objetivo
  w.checks.forEach((c, i) => {
    if (c.on || cxOf(p) <= c.x - 4) return;
    c.on = true; w.respawn = { x: c.x, y: c.y }; emit(['ck', i]); sfx('check'); announce('Checkpoint!', '', 1200);
    burst(w, c.x + 4, c.y - 16, '#7bff9a', 14, 60, 0.7);
  });
  w.coins.forEach((c, i) => {
    if (c.got || !coinMagnet(p, c, dt)) return;
    c.got = true; w.coinsGot++; emit(['cg', i]); checkLifeUp(w, p); sfx('coin'); burst(w, c.x, c.y, '#ffd23f', 5, 40, 0.3, 0);
  });
  for (const c of w.picks) if (!c.got && Math.abs(cxOf(p) - c.x) < 10 && Math.abs(cyOf(p) - c.y) < 14) {
    if (c.t === 'heart' && p.hp < p.maxHp) { p.hp++; c.got = true; sfx('heal'); }
    else if (c.t === 'mana' && p.mana < p.maxMana) { p.mana = Math.min(p.maxMana, p.mana + 50); c.got = true; sfx('heal'); }
    if (c.got) { burst(w, c.x, c.y, c.t === 'heart' ? '#ff6b7a' : '#6bb8ff', 8, 60, 0.5, 0); emit(['pk', w.picks]); }
  }
  if (w.lv.goal && w.state === 'play' && Math.abs(cxOf(p) - w.lv.goal.x) < 14 && p.y + p.h > w.lv.goal.y - 64 && p.y < w.lv.goal.y) {
    w.state = 'win'; w.winT = 0.9; sfx('win'); burst(w, w.lv.goal.x, w.lv.goal.y - 16, '#ffd23f', 24, 120, 0.9);
  }
  if (w.lv.bossGate && !w.bossActive && cxOf(p) > w.lv.bossGate) {
    w.bossActive = true; w.cine = 2.4; announce('REI GOLEM', 'Mire no núcleo brilhante: golpes críticos!', 2800); music('boss'); w.shake = 0.4; sfx('boom');
  }
}
// Ímã: moedas próximas voam até o herói. Devolve true quando a moeda encosta nele.
// (Nos outros aparelhos do multiplayer roda só como efeito visual; quem decide a coleta é o anfitrião.)
function coinMagnet(p, c, dt) {
  const dx = cxOf(p) - c.x, dy = cyOf(p) - c.y, d = Math.hypot(dx, dy);
  if (d < 40 && d > 0.1) { const sp = (d < 22 ? 260 : 150) * dt; c.x += dx / d * Math.min(sp, d); c.y += dy / d * Math.min(sp, d); }
  return d < 13 || (Math.abs(dx) < 12 && Math.abs(dy) < 18);
}
function meleeRect(p) {
  const reach = p.melee && p.melee.reach ? p.melee.reach : 24;
  return { x: p.face > 0 ? p.x + p.w - 2 : p.x - reach + 2, y: p.y - 2, w: reach, h: p.h + 4 };
}

// ---------- Inimigos ----------
function ledgeAhead(w, e) {
  const ax = e.dir > 0 ? e.x + e.w + 3 : e.x - 3;
  return !standPx(w.lv, ax, e.y + e.h + 3);
}
function walk(w, e, spd, chase) {
  const p = e.tgt;
  let chasing = false;
  if (chase) {
    const dx = cxOf(p) - cxOf(e);
    if (Math.abs(dx) < chase && Math.abs(p.y - e.y) < 40) { e.dir = dx > 0 ? 1 : -1; chasing = true; }
  }
  if (e.ground && (e.wall || ledgeAhead(w, e))) {
    if (chasing) { e.vx = 0; return; }
    e.dir = -e.dir;
  }
  e.vx = e.dir * spd * (e.slow > 0 ? 0.5 : 1);
}
const eshoot = (w, o) => w.eproj.push({ w: 6, h: 6, vx: 0, vy: 0, g: 0, life: 3, dmg: 1, rot: 0, ...o });

const E_AI = {
  slime(w, e) { if (e.hurt > 0) { e.vx *= 0.92; return; } walk(w, e, e.speed); },
  skeleton(w, e, dt) {
    if (e.hurt > 0) { e.vx *= 0.92; return; }
    walk(w, e, e.speed, 110);
    e.cd -= dt;
    const p = e.tgt, dx = cxOf(p) - cxOf(e);
    if (e.cd <= 0 && Math.abs(dx) < 150 && Math.abs(p.y - e.y) < 50 && Math.sign(dx) === e.dir) {
      e.cd = 2.2; e.throwT = 0.3;
      eshoot(w, { type: 'bone', x: cxOf(e) - 3, y: e.y + 4, vx: e.dir * 95, vy: -130, g: 380 });
    }
  },
  knight(w, e, dt) {
    if (e.hurt > 0) { e.vx *= 0.9; return; }
    const p = e.tgt, dx = cxOf(p) - cxOf(e);
    e.cd -= dt;
    if (e.st === 'wind') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) { e.st = 'charge'; e.stT = 0.9; } }
    else if (e.st === 'charge') {
      e.stT -= dt; e.vx = e.dir * 100;
      if (e.stT <= 0 || e.wall || ledgeAhead(w, e)) { e.st = 'rest'; e.stT = 0.8; }
    } else if (e.st === 'rest') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) e.st = null; }
    else {
      walk(w, e, e.speed, 90);
      if (e.cd <= 0 && Math.abs(dx) < 110 && Math.abs(p.y - e.y) < 40) { e.st = 'wind'; e.stT = 0.5; e.dir = dx > 0 ? 1 : -1; e.cd = 2.6; }
    }
  },
  bat(w, e, dt) {
    const p = e.tgt, dx = cxOf(p) - cxOf(e), dy = cyOf(p) - cyOf(e), d = Math.hypot(dx, dy) || 1;
    if (e.st !== 'chase' && d < 110) e.st = 'chase';
    if (e.st === 'chase') {
      const s = e.speed * (e.slow > 0 ? 0.5 : 1);
      e.vx = lerp(e.vx, dx / d * s, 0.08); e.vy = lerp(e.vy, dy / d * s + Math.sin(e.t * 6) * 30, 0.08);
      if (d > 230) e.st = null;
    } else { e.vx = Math.cos(e.t * 1.2) * 15; e.vy = Math.sin(e.t * 2.4) * 12; }
    if (Math.abs(e.vx) > 3) e.dir = e.vx > 0 ? 1 : -1;
  },
  plant(w, e, dt) {
    e.vx = 0;
    const p = e.tgt, dx = cxOf(p) - cxOf(e), near = Math.abs(dx) < 64 && Math.abs(p.y - e.y) < 36;
    if (e.st === 'bite') { e.stT -= dt; e.atk = { x: e.dir > 0 ? e.x + e.w - 2 : e.x - 20, y: e.y + 1, w: 22, h: 14 }; if (e.stT <= 0) { e.st = 'rest'; e.stT = 0.7; e.atk = null; } }
    else if (e.st === 'wind') { e.stT -= dt; if (e.stT <= 0) { e.st = 'bite'; e.stT = 0.3; sfx('slash'); } }
    else if (e.st === 'rest') { e.stT -= dt; if (e.stT <= 0) e.st = null; }
    else { e.dir = dx > 0 ? 1 : -1; e.cd -= dt; if (near && e.cd <= 0) { e.st = 'wind'; e.stT = 0.45; e.cd = 1.6; } }
  },
  ghost(w, e, dt) {
    const p = e.tgt, dx = cxOf(p) - cxOf(e), dy = cyOf(p) - cyOf(e), d = Math.hypot(dx, dy) || 1, sp = e.speed * (e.slow > 0 ? 0.5 : 1);
    if (e.st === 'lunge') { e.stT -= dt; e.vx = e.dir * 120; e.vy = lerp(e.vy, dy / d * 60, 0.1); if (e.stT <= 0) { e.st = 'rest'; e.stT = 0.9; } }
    else if (e.st === 'rest') { e.stT -= dt; e.vx *= 0.9; e.vy *= 0.9; if (e.stT <= 0) e.st = null; }
    else {
      if (d < 150) { e.vx = lerp(e.vx, dx / d * sp, 0.04); e.vy = lerp(e.vy, dy / d * sp + Math.sin(e.t * 3) * 14, 0.04); }
      else { e.vx = Math.cos(e.t) * 10; e.vy = Math.sin(e.t * 1.7) * 10; }
      e.dir = dx > 0 ? 1 : -1; e.cd -= dt;
      if (d < 60 && e.cd <= 0) { e.st = 'lunge'; e.stT = 0.4; e.cd = 2.4; }
    }
  },
  guard(w, e, dt) {
    if (e.hurt > 0) { e.vx *= 0.9; return; }
    const p = e.tgt, dx = cxOf(p) - cxOf(e);
    if (e.st === 'wind') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) { e.st = 'thrust'; e.stT = 0.22; sfx('spear'); } }
    else if (e.st === 'thrust') { e.vx = 0; e.stT -= dt; e.atk = { x: e.dir > 0 ? e.x + e.w - 2 : e.x - 34, y: e.y + 8, w: 36, h: 8 }; if (e.stT <= 0) { e.st = 'rest'; e.stT = 0.7; e.atk = null; } }
    else if (e.st === 'rest') { e.vx = 0; e.stT -= dt; if (e.stT <= 0) e.st = null; }
    else {
      walk(w, e, e.speed, 120); e.cd -= dt;
      if (e.cd <= 0 && Math.abs(dx) < 46 && Math.abs(p.y - e.y) < 36) { e.st = 'wind'; e.stT = 0.5; e.dir = dx > 0 ? 1 : -1; e.cd = 2.2; }
    }
  },
  golem(w, e, dt) {
    const p = e.tgt, pc = cxOf(p), ec = cxOf(e), rage = e.hp < e.maxHp * 0.5;
    e.stT -= dt;
    switch (e.st) {
      case 'idle':
        e.vx = 0; e.dir = pc > ec ? 1 : -1;
        if (e.stT <= 0) {
          const opts = ['slam', 'rocks', 'charge'];
          let pick = opts[(Math.random() * 3) | 0];
          if (pick === e.last) pick = opts[(opts.indexOf(pick) + 1) % 3];
          e.last = e.pick = pick; e.st = 'tele'; e.stT = pick === 'charge' ? 0.7 : 0.55; w.shake = Math.max(w.shake, 0.12);
        }
        break;
      case 'tele':
        e.vx = 0;
        if (e.stT <= 0) {
          if (e.pick === 'slam') { e.vy = -380; e.vx = clamp((pc - ec) / 0.84, -190, 190); e.st = 'slam'; e.stT = 0.25; sfx('dash'); }
          else if (e.pick === 'rocks') {
            const n = rage ? 5 : 3;
            for (let i = 0; i < n; i++) eshoot(w, { type: 'rock', w: 8, h: 8, x: ec - 4, y: e.y + 6, vx: (pc - ec + (i - (n - 1) / 2) * 30) / 1.4, vy: -210, g: 300, life: 4 });
            sfx('spear'); e.st = 'idle'; e.stT = rage ? 0.8 : 1.3;
          } else { e.st = 'charge'; e.stT = 2.2; e.dir = pc > ec ? 1 : -1; }
        }
        break;
      case 'slam':
        if (e.ground && e.stT <= 0) {
          for (const d of [-1, 1]) eshoot(w, { type: 'wave', w: 12, h: 9, x: ec + d * 14 - 6, y: e.y + e.h - 9, vx: d * (rage ? 170 : 140), life: 2.4, dmg: 1 });
          w.shake = 0.4; sfx('boom'); burst(w, ec, e.y + e.h, '#bbb', 16, 90, 0.5);
          e.st = 'idle'; e.stT = rage ? 0.8 : 1.3; e.vx = 0;
        }
        break;
      case 'charge':
        e.vx = e.dir * (rage ? 175 : 140);
        if (e.wall || e.stT <= 0) {
          e.st = 'stun'; e.stT = 1.5; e.stun = 1.5; e.vx = 0; w.shake = 0.4; sfx('boom');
          burst(w, ec + e.dir * 18, e.y + 20, '#bbb', 18, 100, 0.6);
          floatText(w, ec, e.y - 10, 'ATORDOADO', '#ffe94d');
        }
        break;
      case 'stun':
        e.vx = 0;
        if (e.stT <= 0) { e.st = 'idle'; e.stT = 0.6; }
        break;
    }
    // bônus de coração ao passar de 66% e 33% da vida
    const frac = e.hp / e.maxHp;
    if ((w.bossDrops === 0 && frac < 0.67) || (w.bossDrops === 1 && frac < 0.34)) {
      w.bossDrops++;
      w.picks.push({ t: 'heart', x: (w.bossDrops === 1 ? 8 : w.lv.w - 8) * T, y: 5 * T + 8, got: false });
      emit(['pk', w.picks]);
    }
  },
};

// Inimigo ativo = perto da tela de algum jogador (cada um com sua "câmera virtual")
function nearAnyPlayer(w, e) {
  const maxX = w.lv.w * T - W;
  for (const p of w.players) if (!p.out && Math.abs(cxOf(e) - (clamp(cxOf(p) - W / 2, 0, maxX) + W / 2)) < W / 2 + 120) return true;
  return false;
}
function updateEnemies(w, dt) {
  const lv = w.lv;
  for (const e of w.enemies) {
    if (e.dead) continue;
    e.active = e.boss ? w.bossActive : nearAnyPlayer(w, e);
    if (!e.active) continue;
    e.tgt = nearestPlayer(w, e);
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.sq > 0) e.sq -= dt;
    if (e.hurt > 0) e.hurt -= dt;
    if (e.slow > 0) e.slow -= dt;
    if (e.stun > 0) e.stun -= dt;
    if (e.throwT > 0) e.throwT -= dt;
    const S = e.sts;
    if (S.burn > 0) {
      S.burn -= dt; e.tk.burn -= dt;
      if (e.tk.burn <= 0) { e.tk.burn = 0.5; dotHit(w, e, 1, '#ff8a1f'); }
    }
    if (S.poison > 0 && !e.dead) {
      S.poison -= dt; e.tk.poison -= dt;
      if (e.tk.poison <= 0) { e.tk.poison = 0.7; dotHit(w, e, 1, '#7bd34a'); }
    }
    if (S.freeze > 0) S.freeze -= dt;
    if (e.dead) continue;
    const still = frozen(e) || (e.stun > 0 && !e.boss);
    const adt = e.boss && S.freeze > 0 ? dt * 0.6 : dt;      // chefe "gelado" age mais devagar
    if (still) { e.vx = 0; if (e.fly) e.vy = 0; }
    else E_AI[e.type](w, e, adt);
    if (e.fly && e.ghost) { e.x += e.vx * dt; e.y += e.vy * dt; }
    else if (e.fly) {
      const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
      if (!solidPx(lv, nx + e.w / 2, e.y + e.h / 2)) e.x = nx; else e.vx = -e.vx;
      if (!solidPx(lv, e.x + e.w / 2, ny + e.h / 2) && ny < lv.h * T - 20) e.y = ny; else e.vy = -e.vy;
    } else {
      e.vy = Math.min(MAXFALL, e.vy + GRAV * dt);
      moveBody(e, dt, lv);
      if (e.y > lv.h * T + 40) { e.dead = true; emit(['k', e.id]); }
    }
    if (w.state !== 'play') continue;
    for (const p of w.players) {
      if (p.dead || e.dead) continue;
      if (e.atk && overlap(p, e.atk)) hurtPlayer(w, p, 1, cxOf(e));
      if (overlap(p, e)) {
        if (e.stomp && p.vy > 60 && p.y + p.h - e.y < 11 && p.hurtT <= 0) { damageEnemy(w, e, 1, { by: p, noCrit: true }); p.vy = -240; if (p.cls.id === 'dragonico') p.jumps = 1; }
        else if (!frozen(e)) hurtPlayer(w, p, 1, cxOf(e));
      }
    }
  }
  w.enemies = w.enemies.filter(e => !e.dead);
}

// ---------- Projéteis ----------
function updateProj(w, dt) {
  const lv = w.lv;
  for (const q of w.proj) {
    q.life -= dt;
    if (q.stuck) continue;
    q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.type === 'bomb') {
      // quica no chão
      if (solidPx(lv, q.x + q.w / 2, q.y + q.h + 1) && q.vy > 0) { q.y -= q.vy * dt; q.vy *= -0.4; q.vx *= 0.7; if (Math.abs(q.vy) < 30) q.vy = 0; }
      if (solidPx(lv, q.x + q.w / 2 + Math.sign(q.vx) * 4, q.y + q.h / 2)) q.vx *= -0.5;
      for (const e of w.enemies) if (!e.dead && e.active && overlap(q, e)) { q.life = 0; break; }
      if (q.life <= 0) { explode(w, q); }
      continue;
    }
    if (solidPx(lv, q.x + q.w / 2, q.y + q.h / 2)) {
      if (q.type === 'spear') { q.stuck = true; q.life = 0.6; q.vx = q.vy = q.g = 0; }
      else { q.life = 0; burst(w, q.x, q.y, q.el ? q.el.col : '#ddd', 5, 50, 0.3); }
      continue;
    }
    for (const e of w.enemies) {
      if (e.dead || !e.active || q.hit.has(e) || !overlap(q, e)) continue;
      q.hit.add(e);
      damageEnemy(w, e, q.dmg, { by: q.by, dir: Math.sign(q.vx), status: q.status, chance: q.chance, rect: q, quiet: q.quiet });
      if (q.type === 'spell') burst(w, cxOf(q), cyOf(q), q.el.col, 8, 80, 0.4);
      if (q.pierce > 0) q.pierce--; else { q.life = 0; break; }
    }
  }
  w.proj = w.proj.filter(q => q.life > 0);

  for (const q of w.eproj) {
    q.life -= dt;
    q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += dt * 10;
    if (solidPx(lv, q.x + q.w / 2, q.y + q.h / 2)) { q.life = 0; if (q.type !== 'wave') burst(w, q.x, q.y, '#bbb', 4, 40, 0.3); continue; }
    if (w.state !== 'play') continue;
    for (const p of w.players) if (!p.dead && overlap(q, p)) { hurtPlayer(w, p, q.dmg, cxOf(q)); q.life = 0; break; }
  }
  w.eproj = w.eproj.filter(q => q.life > 0);
}

// ---------- Partículas que só enfeitam ----------
// Derivadas do estado (planar, mergulho, poeira, queimadura, rastros): cada aparelho gera as suas, nada vai pela rede.
function cosmetics(w, dt) {
  const k = dt * 60, part = o => w.parts.push(o);
  for (const p of w.players) {
    if (p.dead) continue;
    if (p.glide && Math.random() < 0.25 * k) part({ x: cxOf(p) - p.face * 6, y: p.y + 6, vx: rnd(-8, 8), vy: rnd(5, 20), life: 0.3, max: 0.3, col: '#ffd27a', g: 0, sz: 1 });
    if (p.diving && Math.random() < k) part({ x: cxOf(p) + rnd(-4, 4), y: p.y + rnd(-2, 10), vx: rnd(-10, 10), vy: rnd(-40, -10), life: 0.35, max: 0.35, col: Math.random() < 0.5 ? '#ff8a1f' : '#ffe27a', g: 0, sz: 2 });
    // poeira ao correr
    if (p.ground && Math.abs(p.vx) > 60 && p.dash <= 0) { p.dustT -= dt; if (p.dustT <= 0) { p.dustT = 0.13; part({ x: cxOf(p) - p.face * 4, y: p.y + p.h - 1, vx: -p.face * rnd(5, 18), vy: rnd(-14, -4), life: 0.3, max: 0.3, col: '#cfc6b8', g: 0, sz: 1 }); } }
  }
  for (const e of w.enemies) {
    if (e.dead || !e.active) continue;
    if (e.sts.burn > 0 && Math.random() < 0.5 * k) part({ x: cxOf(e) + rnd(-e.w / 2, e.w / 2), y: e.y + rnd(0, e.h), vx: rnd(-6, 6), vy: rnd(-40, -15), life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ff8a1f' : '#ffe27a', g: 0, sz: 1 });
    if (e.sts.poison > 0 && Math.random() < 0.3 * k) part({ x: cxOf(e) + rnd(-e.w / 2, e.w / 2), y: e.y + rnd(0, e.h), vx: rnd(-4, 4), vy: rnd(-25, -8), life: 0.5, max: 0.5, col: '#7bd34a', g: 0, sz: 1 });
  }
  for (const q of w.proj) {
    if (q.stuck) continue;
    if (q.type === 'spell' && Math.random() < 0.7 * k) part({ x: q.x + 3, y: q.y + 3, vx: rnd(-10, 10), vy: q.el.status === 'burn' ? rnd(-25, -5) : rnd(-10, 10), life: 0.3, max: 0.3, col: Math.random() < 0.5 ? q.el.col : q.el.col2, g: 0, sz: 1 });
    if (q.type === 'flame' && Math.random() < 0.5 * k) part({ x: q.x + 3, y: q.y + 3, vx: rnd(-8, 8), vy: rnd(-30, -5), life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ff8a1f' : '#ffe27a', g: 0, sz: 1 });
    if (q.type === 'bomb' && Math.random() < 0.5 * k) part({ x: q.x + 3, y: q.y - 1, vx: rnd(-10, 10), vy: rnd(-30, -10), life: 0.25, max: 0.25, col: Math.random() < 0.5 ? '#ffe27a' : '#ff8a1f', g: 0, sz: 1 });
  }
}

// ---------- Partículas de ambiente ----------
function initAmbient(w) {
  const n = { forest: 26, spores: 30, dust: 30, embers: 34 }[w.th.amb] || 20;
  for (let i = 0; i < n; i++) w.amb.push(newAmb(w, true));
}
function newAmb(w, anywhere) {
  const k = w.th.amb, cx = w.cam.x;
  const a = { x: cx + rnd(-10, W + 10), y: anywhere ? rnd(0, H) + w.cam.y : w.cam.y + (k === 'forest' ? rnd(-10, 40) : H + rnd(0, 20)), ph: Math.random() * 6.28, kind: 0, vx: 0, vy: 0 };
  if (k === 'forest') { a.kind = Math.random() < 0.55 ? 'firefly' : 'leaf'; a.vx = a.kind === 'leaf' ? rnd(8, 20) : rnd(-6, 6); a.vy = a.kind === 'leaf' ? rnd(10, 22) : rnd(-4, 4); if (a.kind === 'firefly') a.y = w.cam.y + rnd(60, 150); }
  else if (k === 'spores') { a.kind = 'spore'; a.vx = rnd(-5, 5); a.vy = rnd(-14, -4); a.col = ['#7fd8ff', '#c8a8ff', '#ff9ad8'][(Math.random() * 3) | 0]; }
  else if (k === 'dust') { a.kind = 'dust'; a.vx = rnd(-4, 6); a.vy = rnd(-5, 3); a.y = w.cam.y + rnd(0, H); }
  else { a.kind = 'ember'; a.vx = rnd(-10, 10); a.vy = rnd(-45, -18); a.col = Math.random() < 0.5 ? '#ff8a2a' : '#ffd27a'; }
  return a;
}
function updateAmbient(w, dt) {
  for (let i = 0; i < w.amb.length; i++) {
    const a = w.amb[i];
    a.ph += dt;
    a.x += (a.vx + Math.sin(a.ph * 1.5) * (a.kind === 'leaf' ? 10 : 6)) * dt; a.y += a.vy * dt + (a.kind === 'firefly' ? Math.sin(a.ph * 2) * 6 * dt : 0);
    if (a.x < w.cam.x - 20 || a.x > w.cam.x + W + 20 || a.y < w.cam.y - 20 || a.y > w.cam.y + H + 24) w.amb[i] = newAmb(w, false);
  }
}

// ---------- Atualização geral ----------
// Roda no modo solo e no anfitrião do multiplayer (os outros aparelhos só recebem o resultado).
function update(w, dt) {
  if (w.hitstop > 0) { w.hitstop -= dt; return; }          // "congelada" de impacto
  w.t += dt;
  if (w.shake > 0) w.shake -= dt;
  if (w.flash > 0) w.flash -= dt;
  if (w.lifeT > 0) w.lifeT -= dt;
  if (w.cine > 0) w.cine -= dt;
  for (const p of w.players) {
    if (!p.dead) { updatePlayer(w, dt, p, w.state === 'play'); continue; }
    p.vy += GRAV * dt; p.y += p.vy * dt; p.anim += dt;
    if (p.out || w.state !== 'play') continue;
    p.deadT -= dt;
    if (p.deadT <= 0) { if (w.lives > 0) respawn(w, p, false); else p.out = true; }   // sem vidas: espera (ou é fim de jogo)
  }
  if (w.state === 'play') {
    if (w.lives > 0) for (const p of w.players) if (p.out) respawn(w, p, false, true);   // o time ganhou vida: volta quem esperava
    if (w.players.every(p => p.out)) { w.state = 'over'; w.overT = 3.2; sfx('over'); music(null); }
  } else if (w.state === 'win') {
    w.winT -= dt;
    if (w.winT <= 0 && !w.finished) { w.finished = true; finishLevel(w); }
  } else if (w.state === 'over') {
    w.overT -= dt;
    if (w.overT <= 0) { startLevel(w.idx, w.roster, w.p.id); return; }
  }
  updateEnemies(w, dt);
  updateProj(w, dt);
  cosmetics(w, dt);
  updateVisuals(w, dt);
}
// Partículas, efeitos, textos, ambiente e câmera (roda em todos os aparelhos)
function updateVisuals(w, dt) {
  for (const q of w.parts) { q.life -= dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
  w.parts = w.parts.filter(q => q.life > 0);
  for (const f of w.fx) { f.t -= dt; if (f.type === 'coinpop') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 420 * dt; } if (f.type === 'corpse') { f.y += f.vy * dt; f.vy += 420 * dt * (f.boss ? 0 : 1); } }
  w.fx = w.fx.filter(f => f.t > 0);
  for (const f of w.floats) { f.t -= dt; f.y += f.vy * dt; f.vy *= 0.96; }
  w.floats = w.floats.filter(f => f.t > 0);
  updateAmbient(w, dt);

  const lv = w.lv, p = camTarget(w);
  const tx = clamp(cxOf(p) - W / 2 + p.face * 18, 0, lv.w * T - W);
  w.cam.x += (tx - w.cam.x) * Math.min(1, dt * 7);
  w.cam.y = clamp(p.y - 92, 0, lv.h * T - H);
}
// A câmera segue o seu herói; se ele estiver fora (sem vidas), acompanha um companheiro vivo
const camTarget = w => (w.p.out && w.players.find(q => !q.dead)) || w.p;

// ---------- Renderização ----------
const canvas = $('#game');
canvas.width = W * HR; canvas.height = H * HR;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const BG_UP = 0;                                   // o fundo sobe um pouco: horizonte acompanha a nova vista
function drawBg(g, bg, cx, cy, t = 0) {
  g.drawImage(bg.sky, 0, -BG_UP * 0.5, BGW, BGH);
  for (const c of bg.clouds) {
    const span = BGW + c.img.width / HR, x = ((c.x + t * c.v - cx * c.par) % span + span) % span - c.img.width / HR;
    g.drawImage(c.img, Math.round(x * HR) / HR, Math.round((c.y - 12 - cy * 0.05) * HR) / HR, c.img.width / HR, c.img.height / HR);
  }
  for (const l of bg.layers) {
    const ox = -Math.floor((cx * l.par) % BGW), oy = -Math.round(cy * l.par * 0.5) - BG_UP;
    g.drawImage(l.img, ox, oy, BGW, BGH); g.drawImage(l.img, ox + BGW, oy, BGW, BGH);
  }
}

function drawSprite(g, img, cx, bottom, flip, camX, camY, sx = 1, sy = 1) {
  // sprites têm HR vezes a resolução do cenário: desenhados na metade do tamanho, alinhados à grade de alta resolução
  const w = img.width / HR * sx, h = img.height / HR * sy;
  const x = Math.round((cx - w / 2 - camX) * HR) / HR, y = Math.round((bottom - h - camY) * HR) / HR;
  if (flip) { g.save(); g.translate(x + w, y); g.scale(-1, 1); g.drawImage(img, 0, 0, w, h); g.restore(); }
  else g.drawImage(img, x, y, w, h);
}
// silhueta colorida (status): cache por imagem+cor
const _tint = new WeakMap();
function tintOf(img, col) {
  let m = _tint.get(img);
  if (!m) { m = {}; _tint.set(img, m); }
  if (!m[col]) {
    const t = mk(img.width, img.height), g = t.getContext('2d');
    g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(0, 0, t.width, t.height);
    m[col] = t;
  }
  return m[col];
}
function drawShadow(g, w, x, y, cx, cy, wd) {
  const gy = groundBelow(w.lv, x, y);
  if (gy === null) return;
  const d = gy - y, a = clamp(0.32 - d / 160, 0.05, 0.32), sw = Math.max(4, wd - Math.round(d / 14));
  g.fillStyle = `rgba(10,5,20,${a})`;
  g.fillRect(Math.round(x - sw / 2 - cx), Math.round(gy - cy), sw, 1);
  g.fillRect(Math.round(x - sw / 2 + 1 - cx), Math.round(gy - cy + 1), sw - 2, 1);
}

// Rastro do golpe: meia-lua pintada em alta resolução (cabeça branca, cauda escura e esmaecida)
const _slash = {};
function slashImg(kind, idx, step, accent) {
  const key = kind + idx + step + accent;
  if (_slash[key]) return _slash[key];
  const claw = kind === 'claw', g = new PX(160, 160), cxx = 80, cyy = 80;
  const ramp = claw ? ['#b02a12', '#ff6a1a', '#ffc060', '#fff6c8'] : [toneLo(accent, 0.35), accent, toneHi(accent, 0.45), '#ffffff'];
  const R0 = claw ? 34 : 54, TM = claw ? 14 : 22;
  const start = claw ? [-45, 70, -115][idx] : -105, span = claw ? [115, 115, 205][idx] : 185, dirn = claw && idx === 1 ? -1 : 1;
  const headFrac = clamp((step + 1) / 5, 0.12, 1), headA = span * headFrac, tailA = Math.max(0, headA - span * 0.66);
  for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) {
    const dx = x + 0.5 - cxx, dy = y + 0.5 - cyy, r = Math.hypot(dx, dy);
    if (r < R0 - TM || r > R0 + TM) continue;
    let ar = dirn * (Math.atan2(dy, dx) * 180 / Math.PI - start);
    ar = ((ar + 540) % 360) - 180;
    if (ar < tailA || ar > headA) continue;
    const u = (ar - tailA) / (headA - tailA + 1e-6), th = TM * Math.pow(u, 0.7), rel = (r - (R0 - th * 0.45)) / (th || 1);
    if (rel < 0 || rel > 1) continue;
    if (u < 0.32 && ((x + y) & 1)) continue;
    let i = u > 0.88 ? 3 : u > 0.55 ? 2 : u > 0.28 ? 1 : 0;
    if (rel > 0.72) i = Math.min(3, i + 1); else if (rel < 0.2) i = Math.max(0, i - 1);
    g.px(x, y, ramp[i]);
  }
  return (_slash[key] = g.toCanvas());
}

function playerImage(p) {
  const S = p.spr;
  let pose = 'idle', f = 0;
  const prog = p.act ? 1 - p.actT / p.actDur : 0;
  if (p.dead || p.hurtT > 0) pose = 'hurt';
  else if (p.dash > 0) { if (p.dashKind === 'roll') { pose = 'roll'; f = Math.floor(p.anim * 22) % 4; } else pose = 'dash'; }
  else if (p.diving) pose = 'dash';
  else if (p.glide || p.flipT > 0) { pose = 'glide'; f = Math.floor(p.anim * (p.glide ? 6 : 14)) % 2; }
  else if (p.block) pose = 'block';
  else if (p.act === 'aim') { pose = 'aim'; f = aimIdx(p.aimDeg); }
  else if (p.act === 'atk') {
    pose = 'atk';
    if (p.cls.id === 'dragonico') f = prog < 0.62 ? p.atkIdx : 3;
    else f = prog < 0.25 ? 0 : prog < 0.5 ? 1 : prog < 0.8 ? 2 : 3;
  } else if (p.act === 'cast') { pose = 'cast'; f = prog < 0.5 ? 1 : 2; }
  else if (!p.ground) { pose = 'jump'; f = p.vy < -90 ? 0 : p.vy < 90 ? 1 : 2; }
  else if (p.landT > 0) pose = 'land';
  else if (Math.abs(p.vx) > 10) { pose = 'run'; f = Math.floor(p.anim * 15) % 8; }
  else { f = Math.floor(p.anim * 3.5) % 4; if ((p.anim % 3.3) < 0.13) f = 4; }
  return S.get(pose, f);
}

const enemyYOff = e => e.type === 'bat' ? 5 : e.type === 'ghost' ? 9 : 0;
// Desenha um herói; tag = mostra o nome em cima (companheiros no multiplayer)
function drawPlayer(g, w, p, cx, cy, tag) {
  if (p.out || (p.inv > 0 && !p.dead && Math.floor(w.t * 20) % 2)) return;
  const img = playerImage(p);
  if (p.dash > 0 || p.flipT > 0) { // rastro de imagens
    for (let i = 3; i >= 1; i--) { g.globalAlpha = 0.14 * (4 - i); drawSprite(g, p.dashKind === 'shadow' ? tintOf(img, '#6a4fa0') : img, cxOf(p) - p.face * i * (p.dash > 0 ? 7 : 0), p.y + p.h + 2 - (p.dash > 0 ? 0 : -i * 3), p.face < 0, cx, cy); }
    g.globalAlpha = 1;
  }
  drawShadow(g, w, cxOf(p), p.y + p.h, cx, cy, 12);
  if (p.dead) { g.save(); g.translate(Math.round(cxOf(p) - cx), Math.round(p.y + 10 - cy)); g.rotate(p.anim * 9 * (p.face < 0 ? -1 : 1)); drawSprite(g, img, 0, 12, p.face < 0, 0, 0); g.restore(); }
  else drawSprite(g, img, cxOf(p), p.y + p.h + 2, p.face < 0, cx, cy);
  if (p.block) { g.globalAlpha = 0.18; g.fillStyle = '#9fd0ff'; g.fillRect(Math.round(cxOf(p) + p.face * 8 - 3 - cx), Math.round(p.y - 3 - cy), 6, 24); g.globalAlpha = 1; }
  if (tag && !p.dead) {
    const t = tagName(p.ch.name);
    g.globalAlpha = 0.85; drawTextO(g, t, Math.round(cxOf(p) - cx - textW(t) / 2), Math.round(p.y - 13 - cy), p.ch.accent || '#fff'); g.globalAlpha = 1;
  }
}
// nome sem acentos e curto, para a fonte de pixels
const tagName = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().slice(0, 8);

function enemyImage(e, lv) {
  switch (e.type) {
    case 'slime': return e.hurt > 0 ? ENEMY_SPR.slimeHurt[lv.theme] : ENEMY_SPR.slime[lv.theme][e.ground ? Math.floor(e.t * 5) & 3 : 1];
    case 'bat': return ENEMY_SPR.bat[Math.floor(e.t * 12) & 3];
    case 'skeleton': return e.throwT > 0 ? ENEMY_SPR.skeletonThrow : ENEMY_SPR.skeleton[Math.abs(e.vx) > 1 ? Math.floor(e.t * 8) & 3 : 0];
    case 'knight':
      if (e.st === 'wind') return ENEMY_SPR.knightWind[0];
      if (e.st === 'charge') return ENEMY_SPR.knightCharge[Math.floor(e.t * 14) & 3];
      return ENEMY_SPR.knight[Math.abs(e.vx) > 1 ? Math.floor(e.t * 7) & 3 : 0];
    case 'plant': return e.st === 'wind' ? ENEMY_SPR.plant.wind : e.st === 'bite' ? ENEMY_SPR.plant.bite : ENEMY_SPR.plant.idle[Math.floor(e.t * 4) & 3];
    case 'ghost': return e.st === 'lunge' ? ENEMY_SPR.ghostAtk : ENEMY_SPR.ghost[Math.floor(e.t * 5) & 3];
    case 'guard': return e.st === 'wind' ? ENEMY_SPR.guard.wind : e.st === 'thrust' ? ENEMY_SPR.guard.thrust : ENEMY_SPR.guard.walk[Math.abs(e.vx) > 1 ? Math.floor(e.t * 5) & 3 : 0];
    case 'golem': {
      const pose = e.st === 'tele' || e.st === 'slam' ? 'tele' : e.st === 'charge' ? 'charge' : e.st === 'stun' ? 'stun' : 'idle';
      return ENEMY_SPR.golem[pose][Math.floor(e.t * 1.8) & 1][e.hp < e.maxHp * 0.5 ? 1 : 0];
    }
  }
}

function drawGlow(g, x, y, r, col, a) {
  g.globalAlpha = a; g.drawImage(glowSprite(col, r), Math.round(x - r), Math.round(y - r));
}

function render(w) {
  const g = ctx, p = w.p, lv = w.lv, name = lv.theme;
  let cx = Math.round(w.cam.x), cy = Math.round(w.cam.y);
  g.setTransform(HR, 0, 0, HR, 0, 0); g.imageSmoothingEnabled = false;
  g.save();
  if (w.shake > 0) g.translate(Math.round(rnd(-2, 2)), Math.round(rnd(-2, 2)));
  drawBg(g, w.bg, cx, cy, w.t);

  const inView = (x, wd = 40) => x - cx > -wd && x - cx < W + wd;
  const decorFrame = (d) => d.spr[d.spr.length === 1 ? 0 : Math.floor(w.t * (d.fast ? 9 : d.slow ? 2.5 : 3) + d.x * 0.07) % d.spr.length];
  const drawDecor = layer => {
    for (const d of w.decor.items) if (d.layer === layer && inView(d.x, 40)) {
      const img = decorFrame(d);
      g.drawImage(img, Math.round((d.x - img.width / (2 * HR) - cx) * HR) / HR, Math.round((d.y - img.height / HR - cy) * HR) / HR, img.width / HR, img.height / HR);
    }
  };
  drawDecor('back');

  // tiles
  const tx0 = Math.floor(cx / T), tx1 = tx0 + W / T + 1, ty0 = Math.floor(cy / T), ty1 = ty0 + H / T + 1;
  for (let ty = ty0; ty <= Math.min(ty1, lv.h - 1); ty++) for (let tx = Math.max(0, tx0); tx <= Math.min(tx1, lv.w - 1); tx++) {
    const t = lv.tiles[ty][tx];
    if (!t) continue;
    const x = tx * T - cx, y = ty * T - cy;
    if (t === 1) {
      const mask = (ty > 0 && lv.tiles[ty - 1][tx] !== 1 ? 1 : 0) | (tx > 0 && lv.tiles[ty][tx - 1] !== 1 ? 2 : 0) | (tx < lv.w - 1 && lv.tiles[ty][tx + 1] !== 1 ? 4 : 0) | (ty < lv.h - 1 && lv.tiles[ty + 1][tx] !== 1 ? 8 : 0);
      g.drawImage(solidTile(name, mask, w.depth[ty][tx], ((hash2(tx, ty) * 3) | 0)), x, y, T, T);
    } else if (t === 2) g.drawImage(platTile(name), x, y, T, T);
    else g.drawImage(spikeTile(name), x, y, T, T);
  }
  drawDecor('mid');

  // checkpoints e objetivo
  for (const c of w.checks) {
    const x = Math.round(c.x - cx), y = Math.round(c.y - cy);
    g.fillStyle = '#2a2a3a'; g.fillRect(x - 3, y - 2, 8, 2); g.fillStyle = '#6a6e82'; g.fillRect(x, y - 24, 2, 22); g.fillStyle = '#9aa0b4'; g.fillRect(x, y - 24, 1, 22);
    g.fillStyle = '#3a3a4c'; g.fillRect(x - 3, y - 28, 8, 4);
    const lit = c.on, pulse = 0.6 + Math.sin(w.t * 5) * 0.25;
    g.fillStyle = lit ? '#4ade80' : '#5a6078'; g.fillRect(x - 2, y - 29, 6, 6); g.fillStyle = lit ? '#d8ffe3' : '#8a90a8'; g.fillRect(x - 1, y - 28, 2, 2);
    g.fillStyle = lit ? '#1f9a50' : '#3a4058'; g.fillRect(x + 2, y - 26, 2, 3);
    if (lit) { g.globalCompositeOperation = 'lighter'; drawGlow(g, x + 1, y - 26, 22, '#4ade80', pulse * 0.5); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  if (lv.goal) {
    const x = Math.round(lv.goal.x - cx), y = Math.round(lv.goal.y - cy);
    g.fillStyle = '#4a4e62'; g.fillRect(x - 15, y - 44, 7, 44); g.fillRect(x + 8, y - 44, 7, 44); g.fillRect(x - 15, y - 50, 30, 7);
    g.fillStyle = '#7a7e94'; g.fillRect(x - 15, y - 44, 2, 44); g.fillRect(x + 8, y - 44, 2, 44); g.fillRect(x - 15, y - 50, 30, 2);
    g.fillStyle = '#2e3044'; g.fillRect(x - 9, y - 44, 1, 44); g.fillRect(x + 14, y - 44, 1, 44);
    for (let i = 0; i < 21; i++) for (let j = 0; j < 7; j++) {
      const ph = Math.sin(w.t * 4 + i * 0.5 + j * 0.9);
      g.fillStyle = ph > 0.5 ? '#e0d4ff' : ph > -0.1 ? '#a58cff' : '#6d4cff';
      g.fillRect(x - 7 + j * 2, y - 43 + i * 2, 2, 2);
    }
    g.fillStyle = '#ffd23f'; g.fillRect(x - 2, y - 55, 4, 5); g.fillStyle = '#fff2a0'; g.fillRect(x - 2, y - 55, 1, 5);
    g.globalCompositeOperation = 'lighter'; drawGlow(g, x, y - 22, 40, '#8a6cff', 0.35 + Math.sin(w.t * 3) * 0.1); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  // moedas / itens
  for (const c of w.coins) if (!c.got && inView(c.x, 12)) {
    const f = ICON.coin[Math.floor(w.t * 8 + c.x * 0.05) & 3];
    g.drawImage(f, Math.round(c.x - 5 - cx), Math.round(c.y - 5 - cy + Math.sin(w.t * 4 + c.x) * 1.5));
  }
  for (const c of w.picks) if (!c.got) {
    const img = c.t === 'heart' ? ICON.heart : ICON.potion, bob = Math.sin(w.t * 4) * 2;
    g.globalCompositeOperation = 'lighter'; drawGlow(g, c.x - cx, c.y - cy + bob, 14, c.t === 'heart' ? '#ff4a6a' : '#4a9aff', 0.5); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.drawImage(img, Math.round(c.x - img.width / 2 - cx), Math.round(c.y - img.height / 2 - cy + bob));
  }

  // inimigos
  for (const e of w.enemies) {
    if (e.dead || !e.active) continue;
    const img = enemyImage(e, lv), yOff = enemyYOff(e);
    const shake = e.boss && e.st === 'tele' ? Math.round(rnd(-1, 1)) : 0, bob = e.type === 'bat' ? 0 : 0;
    if (!e.fly) drawShadow(g, w, cxOf(e), e.y + e.h, cx, cy, e.boss ? 34 : e.w + 4);
    else drawShadow(g, w, cxOf(e), e.y + e.h, cx, cy, 8);
    let spr = e.flash > 0 ? whiteOf(img) : img;
    if (e.ghost) g.globalAlpha = 0.72 + Math.sin(e.t * 4) * 0.2;
    const sqk = e.sq > 0 ? e.sq / 0.14 : 0;
    drawSprite(g, spr, cxOf(e) + shake, e.y + e.h + 1 + yOff + bob, e.dir < 0, cx, cy, 1 + 0.16 * sqk, 1 - 0.14 * sqk);
    g.globalAlpha = 1;
    const S = e.sts, flip = e.dir < 0;
    const ov = (col, a) => { g.globalAlpha = a; drawSprite(g, tintOf(img, col), cxOf(e) + shake, e.y + e.h + 1 + yOff, flip, cx, cy); g.globalAlpha = 1; };
    if (S.freeze > 0) ov('#8fe0ff', e.boss ? 0.3 : 0.55);
    if (S.poison > 0) ov('#58d040', 0.28 + Math.sin(w.t * 12) * 0.08);
    if (S.burn > 0) ov('#ff7a1a', 0.22 + Math.sin(w.t * 20) * 0.1);
    if (e.slow > 0 && !S.freeze) ov('#6fd8ff', 0.18);
    if (frozen(e)) { // cristais de gelo ao redor
      g.fillStyle = '#d8f6ff'; const ex = Math.round(e.x - cx), ey = Math.round(e.y - cy);
      g.fillRect(ex - 2, ey + e.h - 4, 3, 5); g.fillRect(ex + e.w - 1, ey + e.h - 6, 3, 7); g.fillRect(ex + e.w / 2 - 1, ey - 3, 2, 4);
      g.fillStyle = '#7fd4ff'; g.fillRect(ex - 2, ey + e.h, 3, 1); g.fillRect(ex + e.w - 1, ey + e.h, 3, 1);
    }
    if (e.st === 'wind') { g.fillStyle = '#ffec4a'; g.fillRect(Math.round(cxOf(e) - cx), Math.round(e.y - 9 - cy), 2, 5); g.fillRect(Math.round(cxOf(e) - cx), Math.round(e.y - 3 - cy), 2, 2); }
    // ícones de status acima da cabeça
    const icons = []; if (S.burn > 0) icons.push('burn'); if (S.poison > 0) icons.push('poison'); if (S.freeze > 0) icons.push('freeze'); if (e.stun > 0 && !e.boss) icons.push('stun');
    icons.forEach((k, i) => { const ic = ICON.status[k]; g.drawImage(ic, Math.round(cxOf(e) - cx - icons.length * 3.5 + i * 7 - 0), Math.round(e.y - (e.boss ? 18 : 10) - cy + Math.sin(w.t * 6 + i) * 1)); });
    // ponto fraco do chefe
    if (e.boss && w.bossActive) {
      const r = coreRect(e), pulse = 0.5 + Math.sin(w.t * 8) * 0.5, big = e.st === 'stun';
      g.globalCompositeOperation = 'lighter'; drawGlow(g, r.x + r.w / 2 - cx, r.y + r.h / 2 - cy, big ? 26 : 18, big ? '#ffffff' : '#ff9d2e', (big ? 0.7 : 0.35) + pulse * 0.2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  }

  // jogadores (o seu por cima dos companheiros)
  for (const q of w.players) if (q !== p) drawPlayer(g, w, q, cx, cy, true);
  drawPlayer(g, w, p, cx, cy, false);
  drawDecor('front');
  if (name !== 'forest' && !p.dead) { g.globalCompositeOperation = 'lighter'; drawGlow(g, cxOf(p) - cx, p.y + 10 - cy, 46, name === 'boss' ? '#ff7a4a' : name === 'castle' ? '#ffc88a' : '#9fb0ff', 0.2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }

  // arco do arqueiro: mira
  if ((p.cls.id === 'arqueiro' || (p.cls.id === 'mago' && p.inp.am === 'pointer')) && w.state === 'play' && !p.dead) {
    const a = p.aimDeg * Math.PI / 180, f = p.aimFace, sx = cxOf(p), sy = p.y + 8;
    for (let d = 20; d <= 44; d += 6) { g.fillStyle = d === 44 ? '#fff' : 'rgba(255,255,255,.45)'; g.fillRect(Math.round(sx + Math.cos(a) * f * d - cx), Math.round(sy + Math.sin(a) * d - cy), 1, 1); }
    const rx = Math.round(sx + Math.cos(a) * f * 52 - cx), ry = Math.round(sy + Math.sin(a) * 52 - cy);
    g.fillStyle = '#ffe94d'; g.fillRect(rx - 3, ry, 2, 1); g.fillRect(rx + 2, ry, 2, 1); g.fillRect(rx, ry - 3, 1, 2); g.fillRect(rx, ry + 2, 1, 2);
    g.fillStyle = 'rgba(255,233,77,.5)'; g.fillRect(rx, ry, 1, 1);
  }

  // efeitos de golpe
  for (const fx of w.fx) {
    if (fx.type === 'slash') {
      const q = fx.p;
      if (!q) continue;
      const prog = 1 - fx.t / fx.max, f = fx.face, ox = cxOf(q) + f * 3 - cx, oy = q.y + 10 - cy;
      const img = slashImg(fx.kind, fx.idx || 0, Math.min(6, Math.floor(prog * 7)), q.ch.accent);
      g.save(); g.translate(Math.round(ox * HR) / HR, Math.round(oy * HR) / HR); g.scale(f, 1);
      g.drawImage(img, -80 / HR, -80 / HR, 160 / HR, 160 / HR); g.restore();
    }
  }

  // projéteis do jogador
  for (const q of w.proj) {
    const x = Math.round(q.x - cx), y = Math.round(q.y - cy), d = Math.sign(q.vx) || p.face;
    if (q.type === 'spell') {
      const el = q.el, fl = Math.floor(w.t * 20) % 2;
      g.fillStyle = el.col; g.fillRect(x, y + 1, 7, 5); g.fillRect(x + 1, y, 5, 7);
      if (el.status === 'burn') { g.fillStyle = '#ff5a1f'; g.fillRect(x - d * 3, y + 2, 3, 3); g.fillRect(x - d * 6, y + 3, 2, 1); g.fillRect(x + 2, y - 2 + fl, 3, 2); }
      if (el.status === 'freeze') { g.fillStyle = el.col2; g.fillRect(x + 3, y - 2, 1, 11); g.fillRect(x - 2, y + 3, 11, 1); }
      if (el.status === 'poison') { g.fillStyle = '#4a9a2a'; g.fillRect(x + 1, y + 5, 2, 2); g.fillRect(x + 4, y + 1, 2, 2); }
      g.fillStyle = el.col2; g.fillRect(x + 2, y + 2, 3, 3);
      g.globalCompositeOperation = 'lighter'; drawGlow(g, x + 3, y + 3, 12, el.col, 0.5); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    } else if (q.type === 'arrow') {
      const L = Math.hypot(q.vx, q.vy) || 1, ux = q.vx / L, uy = q.vy / L, hx = x + 3, hy = y + 2;
      g.fillStyle = '#d8c8a0'; pline(g, hx - ux * 7, hy - uy * 7, hx, hy, 1);
      g.fillStyle = '#f2f6ff'; pline(g, hx, hy, hx + ux * 2, hy + uy * 2, 1); g.fillRect(Math.round(hx + ux * 2), Math.round(hy + uy * 2), 1, 1);
      g.fillStyle = '#e63946'; pline(g, hx - ux * 7, hy - uy * 7, hx - ux * 5, hy - uy * 5, 1); g.fillRect(Math.round(hx - ux * 7 - uy), Math.round(hy - uy * 7 + ux), 1, 1);
    } else if (q.type === 'spear') {
      g.fillStyle = '#8a5a2b'; g.fillRect(x, y, 13, 2); g.fillStyle = '#b07a3e'; g.fillRect(x, y, 13, 1);
      g.fillStyle = '#dfe6f0'; g.fillRect(d > 0 ? x + 12 : x - 1, y - 1, 4, 4); g.fillRect(d > 0 ? x + 16 : x - 2, y, 1, 2); g.fillStyle = '#fff'; g.fillRect(d > 0 ? x + 12 : x - 1, y - 1, 4, 1);
      g.fillStyle = '#e63946'; g.fillRect(d > 0 ? x : x + 11, y - 1, 2, 4);
    } else if (q.type === 'flame') {
      const k = 1 - Math.max(0, q.life) / 0.44, sz = 7 - Math.floor(k * 4);
      g.fillStyle = k < 0.4 ? '#ffe27a' : k < 0.7 ? '#ff8a1f' : '#c23a1a'; g.fillRect(x + (7 - sz) / 2 | 0, y + (7 - sz) / 2 | 0, sz, sz);
      g.globalCompositeOperation = 'lighter'; drawGlow(g, x + 3, y + 3, 9, '#ff7a2a', 0.45); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    } else if (q.type === 'bomb') {
      blob(g, x + 3, y + 3, 3.4, 3.4, '#2a2a38', '#6a6a88', '#14141c');
      g.fillStyle = '#ffe27a'; g.fillRect(x + 4, y - 2, 1, 2); g.fillStyle = Math.floor(w.t * 20) % 2 ? '#ff5a2a' : '#ffe94d'; g.fillRect(x + 4, y - 3, 2, 1);
      g.globalCompositeOperation = 'lighter'; drawGlow(g, x + 4, y - 2, 8, '#ff8a2a', 0.4); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  }
  // projéteis inimigos
  for (const q of w.eproj) {
    const x = Math.round(q.x - cx), y = Math.round(q.y - cy);
    if (q.type === 'bone') {
      g.fillStyle = '#ece8d6'; if (Math.floor(q.rot) % 2) { g.fillRect(x, y + 2, 6, 2); g.fillRect(x, y + 1, 1, 4); g.fillRect(x + 5, y + 1, 1, 4); } else { g.fillRect(x + 2, y, 2, 6); g.fillRect(x + 1, y, 4, 1); g.fillRect(x + 1, y + 5, 4, 1); }
    } else if (q.type === 'rock') {
      g.fillStyle = '#7b8494'; g.fillRect(x, y + 1, 8, 6); g.fillRect(x + 1, y, 6, 8); g.fillStyle = '#a6afc0'; g.fillRect(x + 1, y + 1, 3, 2); g.fillStyle = '#4f5766'; g.fillRect(x + 1, y + 6, 6, 2);
    } else {
      g.fillStyle = '#ff9d2e'; g.fillRect(x, y + 2, 12, 7); g.fillRect(x + 2, y, 8, 9);
      g.fillStyle = '#ffe27a'; g.fillRect(x + 3, y + 4, 6, 3);
      g.globalCompositeOperation = 'lighter'; drawGlow(g, x + 6, y + 5, 12, '#ff8a2a', 0.4); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  }
  // efeitos
  for (const f of w.fx) {
    if (f.type === 'bolt') {
      const a = f.t / f.max;
      g.globalAlpha = a * 0.5; g.fillStyle = '#8fb0ff';
      for (let i = 0; i < f.pts.length - 1; i++) pline(g, f.pts[i][0] - cx, f.pts[i][1] - cy, f.pts[i + 1][0] - cx, f.pts[i + 1][1] - cy, 6);
      for (const [col, sz] of [['#ffe94d', 4], ['#fff', 2]]) {
        g.globalAlpha = a; g.fillStyle = col;
        for (let i = 0; i < f.pts.length - 1; i++) pline(g, f.pts[i][0] - cx, f.pts[i][1] - cy, f.pts[i + 1][0] - cx, f.pts[i + 1][1] - cy, sz === 4 ? 3 : 1);
      }
      g.globalAlpha = 1;
    } else if (f.type === 'ring') {
      const prog = 1 - f.t / f.max, r = f.r * (0.3 + prog * 0.9);
      g.globalAlpha = 1 - prog; g.strokeStyle = f.col || '#ffd27a'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(Math.round(f.x - cx), Math.round(f.y - cy), r, f.col ? r * 0.35 : r, 0, 0, 7); g.stroke(); g.globalAlpha = 1;
    } else if (f.type === 'coinpop') {
      g.globalAlpha = clamp(f.t / f.max * 2, 0, 1); g.drawImage(ICON.coin[Math.floor(w.t * 14) & 3], Math.round(f.x - 5 - cx), Math.round(f.y - 5 - cy)); g.globalAlpha = 1;
    } else if (f.type === 'corpse') {
      const prog = 1 - f.t / f.max;
      if (!f.img) f.img = enemyImage(f.es, lv);
      if (f.boss) {
        const sh = Math.round(rnd(-1, 1)); g.globalAlpha = clamp(1 - prog * 1.1, 0, 1);
        drawSprite(g, Math.floor(f.t * 14) % 2 ? whiteOf(f.img) : f.img, f.x + sh, f.y + prog * 6, f.flip, cx, cy); g.globalAlpha = 1;
      } else {
        g.globalAlpha = clamp(1 - prog, 0, 1);
        const sc = 1 - prog * 0.4, img = whiteOf(f.img);
        g.save(); g.translate(Math.round(f.x - cx), Math.round(f.y - cy)); g.rotate(prog * 5 * (f.flip ? -1 : 1)); g.scale(sc, sc);
        g.drawImage(img, -img.width / (2 * HR), -img.height / HR, img.width / HR, img.height / HR); g.restore(); g.globalAlpha = 1;
      }
    }
  }
  for (const q of w.parts) {
    g.globalAlpha = Math.min(1, q.life / q.max * 1.5); g.fillStyle = q.col;
    g.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), q.sz, q.sz);
  }
  g.globalAlpha = 1;

  // luzes (aditivas) e partículas de ambiente
  g.globalCompositeOperation = 'lighter';
  for (const l of w.decor.lights) if (inView(l.x, l.r)) {
    const fl = l.flick ? 0.8 + Math.sin(w.t * 14 + l.x) * 0.12 + Math.sin(w.t * 23 + l.x * 2) * 0.08 : 0.85 + Math.sin(w.t * 2 + l.x) * 0.15;
    drawGlow(g, l.x - cx, l.y - cy, l.r, l.col, l.a * fl);
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  for (const a of w.amb) {
    const x = Math.round(a.x - cx), y = Math.round(a.y - cy);
    if (a.kind === 'firefly') { const b = (Math.sin(a.ph * 3) + 1) / 2; g.globalAlpha = 0.3 + b * 0.7; g.fillStyle = '#e8ff7a'; g.fillRect(x, y, 2, 2); g.globalCompositeOperation = 'lighter'; drawGlow(g, x + 1, y + 1, 8, '#d6ff5a', 0.5 * b); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
    else if (a.kind === 'leaf') { g.fillStyle = Math.floor(a.ph * 2) % 2 ? '#7ac070' : '#e0a040'; g.fillRect(x, y, 2, 1); g.fillRect(x + 1, y + 1, 1, 1); }
    else if (a.kind === 'spore') { g.globalAlpha = 0.4 + (Math.sin(a.ph * 2) + 1) * 0.3; g.fillStyle = a.col; g.fillRect(x, y, 1, 1); g.globalAlpha = 1; }
    else if (a.kind === 'dust') { g.globalAlpha = 0.25; g.fillStyle = '#e8e0ff'; g.fillRect(x, y, 1, 1); g.globalAlpha = 1; }
    else { g.globalAlpha = 0.9; g.fillStyle = a.col; g.fillRect(x, y, 1 + (Math.floor(a.ph * 3) % 2), 1); g.globalAlpha = 1; }
  }
  g.restore();

  // números de dano
  for (const f of w.floats) {
    const a = clamp(f.t / f.max * 2, 0, 1), s = f.big ? 2 : 1;
    g.globalAlpha = a; drawTextO(g, f.txt, Math.round(f.x - cx - textW(f.txt, s) / 2), Math.round(f.y - cy), f.col, s);
  }
  g.globalAlpha = 1;
  // vinheta + tinta do tema
  g.drawImage(vignette(), 0, 0);
  const [tc, ta] = w.bg.tint; g.globalAlpha = ta; g.fillStyle = tc; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  if (w.flash > 0) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 0, W, H); }
  drawHud(g, w);
  if (w.cine > 0) { const k = Math.min(1, w.cine / 0.4, (2.4 - w.cine) / 0.4 + 0.001), bh = Math.round(22 * Math.min(1, k)); g.fillStyle = '#05030a'; g.fillRect(0, 0, W, bh); g.fillRect(0, H - bh, W, bh); }
  if (w.t < 0.7) { g.fillStyle = `rgba(8,4,16,${1 - w.t / 0.7})`; g.fillRect(0, 0, W, H); }
  if (w.state === 'win' && w.winT < 0.7) { g.fillStyle = `rgba(255,255,255,${clamp(0.5 - w.winT / 1.4, 0, 0.5)})`; g.fillRect(0, 0, W, H); }
}

// Ícones das habilidades (26x26 de alta resolução)
const _skIcons = {};
function skillIcon(p, i) {
  const id = p.cls.id, el = id === 'mago' ? (p.ch.elem || 0) : 0, key = id + i + el;
  if (_skIcons[key]) return _skIcons[key];
  const g = new PX(26, 26);
  const Y = '#ffd23f';
  const flame = (cx, cy, s, a, b, c) => { g.poly([[cx, cy - 11 * s], [cx + 6 * s, cy - 2 * s], [cx + 8 * s, cy + 5 * s], [cx + 3 * s, cy + 10 * s], [cx - 4 * s, cy + 10 * s], [cx - 8 * s, cy + 4 * s], [cx - 5 * s, cy - 3 * s], [cx - 2 * s, cy - 1 * s]], a, { hi: b, lo: toneLo(a, 0.4), depth: 2 }); g.poly([[cx, cy], [cx + 3 * s, cy + 5 * s], [cx + 1 * s, cy + 9 * s], [cx - 3 * s, cy + 8 * s], [cx - 4 * s, cy + 4 * s]], b, { hi: c, lo: a, depth: 1 }); };
  const arrow = (x0, y0, x1, y1) => {
    g.cap(x0, y0, x1, y1, 2, '#d8c8a0', { depth: 0, flat: true });
    const a = Math.atan2(y1 - y0, x1 - x0);
    g.poly([[x1 + Math.cos(a) * 4, y1 + Math.sin(a) * 4], [x1 - Math.sin(a) * 3, y1 + Math.cos(a) * 3], [x1 + Math.sin(a) * 3, y1 - Math.cos(a) * 3]], '#f2f6ff', { depth: 0, flat: true });
    g.cap(x0, y0, x0 + Math.cos(a) * 4, y0 + Math.sin(a) * 4, 3, '#e63946', { depth: 0, flat: true });
  };
  if (id === 'guerreiro') {
    if (i === 0) drawBlade(g, 5, 21, 138, 19, 5, '#dfe6f0', '#ffffff', '#8a5a2b', Y);
    else if (i === 1) { g.cap(4, 22, 18, 8, 3, '#8a5a2b', { depth: 1, hi: '#b07a3e', lo: '#4a2a14' }); g.poly([[16, 4], [22, 4], [22, 10], [18, 10]], '#e8eef8', { hi: '#ffffff', lo: '#7a88a0', depth: 1 }); g.rect(14, 10, 3, 3, '#e63946'); }
    else { g.poly([[4, 3], [22, 3], [22, 14], [13, 24], [4, 14]], '#c68a3a', { hi: '#ffd27a', lo: '#7a4a14', depth: 2 }); g.poly([[8, 7], [18, 7], [18, 14], [13, 20], [8, 14]], '#e8eef8', { hi: '#ffffff', lo: '#8a98b4', depth: 1 }); g.rect(12, 8, 2, 11, '#cc3333'); g.rect(9, 11, 8, 2, '#cc3333'); }
  } else if (id === 'mago') {
    if (i === 0) {
      if (el === 0) flame(13, 14, 1.0, '#ff7a1f', '#ffc24a', '#fff2a0');
      else if (el === 1) { g.line(13, 2, 13, 24, '#cfefff'); g.line(2, 13, 24, 13, '#cfefff'); g.line(5, 5, 21, 21, '#9fe0ff'); g.line(21, 5, 5, 21, '#9fe0ff'); g.ell(13, 13, 4, 4, '#ffffff', { depth: 1, hi: '#ffffff', lo: '#6fd8ff' }); }
      else { g.poly([[13, 2], [20, 12], [21, 18], [16, 24], [9, 24], [5, 18], [7, 12]], '#6cc43a', { hi: '#d6ff8a', lo: '#2a6a18', depth: 2 }); g.ell(10, 16, 2, 2, '#e8ffb0', { flat: true }); g.ell(16, 19, 1.5, 1.5, '#e8ffb0', { flat: true }); }
    } else if (i === 1) g.poly([[15, 1], [6, 14], [12, 14], [8, 25], [20, 10], [13, 10]], '#ffe94d', { hi: '#ffffff', lo: '#c98a10', depth: 1 });
    else { g.poly([[13, 23], [3, 12], [3, 7], [8, 4], [13, 8], [18, 4], [23, 7], [23, 12]], '#4ade80', { hi: '#d8ffe3', lo: '#1f8a4a', depth: 2 }); g.rect(11, 9, 4, 8, '#ffffff'); g.rect(9, 11, 8, 4, '#ffffff'); }
  } else if (id === 'arqueiro') {
    if (i === 0) arrow(4, 21, 19, 6);
    else if (i === 1) { arrow(4, 21, 20, 14); arrow(4, 21, 19, 6); arrow(4, 21, 14, 2); }
    else {
      for (let a = 0; a < 5; a += 0.12) { g.px(13 + Math.cos(a) * 8, 13 + Math.sin(a) * 8, '#cfe8ff'); g.px(13 + Math.cos(a) * 9, 13 + Math.sin(a) * 9, '#ffffff'); g.px(13 + Math.cos(a) * 7, 13 + Math.sin(a) * 7, '#7ab0ff'); }
      g.poly([[22, 12], [17, 6], [14, 14]], '#ffffff', { depth: 0, flat: true });
    }
  } else {
    if (i === 0) { for (const dx of [-6, 0, 6]) g.poly([[10 + dx, 3], [16 + dx, 3], [12 + dx, 23], [9 + dx, 23]], '#ffd27a', { hi: '#fff6c8', lo: '#c2561a', depth: 1 }); }
    else if (i === 1) { g.poly([[2, 13], [22, 3], [24, 8], [24, 18], [22, 23]], '#ff7a1f', { hi: '#ffc24a', lo: '#a02a0a', depth: 2 }); g.poly([[4, 13], [18, 9], [20, 13], [18, 17]], '#ffe27a', { hi: '#ffffff', lo: '#ffb04a', depth: 1 }); }
    else { g.poly([[13, 24], [4, 8], [10, 10], [13, 2], [16, 10], [22, 8]], '#ff5a2a', { hi: '#ffc24a', lo: '#8a1a0a', depth: 2 }); g.poly([[13, 20], [9, 10], [13, 12], [17, 10]], '#ffe27a', { hi: '#ffffff', lo: '#ff9a2a', depth: 1 }); }
  }
  return (_skIcons[key] = outline(g.toCanvas(), INK));
}

function drawPlate(g, x, y, w, h) {
  g.fillStyle = '#0e0a14'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = '#3a3050'; g.fillRect(x, y, w, h);
  g.fillStyle = '#5a4a80'; g.fillRect(x, y, w, 1); g.fillStyle = '#241c36'; g.fillRect(x, y + h - 1, w, 1);
}
function drawHud(g, w) {
  const p = w.p;
  // rosto + vidas (estilo Sonic)
  drawPlate(g, 3, 3, 20, 20);
  g.fillStyle = '#1d1630'; g.fillRect(4, 4, 18, 18);
  g.drawImage(p.spr.face(), 4, 4, 18, 18);
  const lifeCol = w.lifeT > 0 && Math.floor(w.t * 10) % 2 ? '#7bff9a' : '#fff';
  drawTextO(g, 'x', 26, 12, '#ffd23f', 1); drawTextO(g, w.lives, 31, 10, lifeCol, 2);
  // corações
  const hx = 45;
  for (let i = 0; i < p.maxHp; i++) g.drawImage(i < p.hp ? ICON.heart : ICON.heartEmpty, hx + i * 9, 3);
  let y = 15;
  if (p.cls.mana) {
    const fr = p.mana / p.maxMana, low = p.mana < COST.mago[0], bw = 52;
    g.fillStyle = '#0e0a14'; g.fillRect(hx - 1, y - 1, bw + 2, 7);
    g.fillStyle = '#23306a'; g.fillRect(hx, y, bw, 5);
    g.fillStyle = low ? '#7a8fb8' : '#4aa3ff'; g.fillRect(hx, y, Math.round(bw * fr), 5);
    g.fillStyle = '#bfe0ff'; g.fillRect(hx, y, Math.round(bw * fr), 1);
    for (const m of [COST.mago[1], COST.mago[2]]) { g.fillStyle = 'rgba(14,10,20,.8)'; g.fillRect(hx + Math.round(bw * m / p.maxMana), y, 1, 5); }
    if (p.manaDelay > 0) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(hx, y, Math.round(bw * fr), 5); }
    y += 8;
  } else y += 0;
  // habilidades
  const costs = COST[p.cls.id], cdMax = CDMAX[p.cls.id], keys = ['a', 'b', 'c'].map(keyLabel);
  const sy = 27;
  ['a', 'b', 'c'].forEach((k, i) => {
    const x = 4 + i * 17;
    drawPlate(g, x, sy, 14, 14);
    const lowMana = p.cls.mana && p.mana < costs[i];
    g.fillStyle = lowMana ? '#7a2a3a' : '#5a4a80'; g.fillRect(x, sy, 14, 14);
    g.fillStyle = lowMana ? '#a03a4c' : '#7a68a8'; g.fillRect(x, sy, 14, 1);
    const frac = clamp(p.cd[k] / cdMax[i], 0, 1);
    if (frac > 0) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, sy, 14, Math.round(14 * frac)); }
    if (p.cls.id === 'guerreiro' && k === 'c' && p.block) { g.fillStyle = '#ffd23f'; g.fillRect(x, sy + 12, 14, 2); }
    g.globalAlpha = lowMana ? 0.45 : 1; g.drawImage(skillIcon(p, i), x + 0.5, sy + 0.5, 13, 13); g.globalAlpha = 1;
    drawTextO(g, keys[i], x + 1, sy + 1, '#ffffff');
    if (costs[i]) drawTextO(g, costs[i], x + (costs[i] > 9 ? 3 : 5), sy + 8, lowMana ? '#ff9aa5' : '#bfe0ff');
  });
  // moedas
  g.drawImage(ICON.coin[0], W - 56, 2);
  drawTextO(g, 'x' + w.coinsGot, W - 44, 5, '#ffd23f', 1);
  drawText(g, w.coinsGot % COINS_PER_LIFE + '/' + COINS_PER_LIFE, W - 44, 13, '#8a7ac0');
  // companheiros (multiplayer): rosto, nome e corações
  let ty = 22;
  for (const q of w.players) if (q !== p) {
    const x = W - 56;
    g.globalAlpha = q.dead ? 0.45 : 1;
    drawPlate(g, x, ty, 11, 11); g.drawImage(q.spr.face(), x, ty, 11, 11);
    drawText(g, tagName(q.ch.name).slice(0, 6), x + 14, ty, q.ch.accent || '#fff');
    for (let i = 0; i < q.maxHp; i++) { g.fillStyle = i < q.hp ? '#e63946' : '#3a2a40'; g.fillRect(x + 14 + i * 4, ty + 7, 3, 3); }
    g.globalAlpha = 1; ty += 15;
  }
  if (Net.role === 'client') drawText(g, Net.ping + 'MS', W - 4 - textW(Net.ping + 'MS'), H - 8, Net.ping > 150 ? '#ff9aa5' : '#8a7ac0');
  // barra do chefe
  if (w.boss && w.bossActive && !w.boss.dead) {
    const b = w.boss, bw = 140, bx = 112, by = 11, fr = Math.max(0, b.hp) / b.maxHp;
    drawTextO(g, 'REI GOLEM', bx, by - 8, '#ffd23f', 1);
    g.fillStyle = '#0e0a14'; g.fillRect(bx - 2, by, bw + 4, 9);
    g.fillStyle = '#5a1f36'; g.fillRect(bx, by + 2, bw, 5);
    g.fillStyle = b.hp < b.maxHp * 0.5 ? '#ff5a3c' : '#e63946'; g.fillRect(bx, by + 2, Math.round(bw * fr), 5);
    g.fillStyle = '#ff9aa5'; g.fillRect(bx, by + 2, Math.round(bw * fr), 1);
    for (const m of [0.33, 0.66]) { g.fillStyle = '#0e0a14'; g.fillRect(bx + Math.round(bw * m), by + 2, 1, 5); }
    if (b.sts.freeze > 0) drawText(g, 'LENTO', bx + bw - 20, by - 8, '#9fe8ff');
  }
  if (w.state === 'play' && p.out) {   // sem vidas: assistindo os companheiros
    const t = 'SEM VIDAS', s = 'JUNTE MOEDAS PARA VOLTAR';
    drawTextO(g, t, Math.round(W / 2 - textW(t, 2) / 2), H - 34, '#ff9aa5', 2);
    drawTextO(g, s, Math.round(W / 2 - textW(s) / 2), H - 18, '#fff');
  } else if (w.state === 'play' && p.dead) {
    g.fillStyle = `rgba(0,0,0,${clamp(1 - p.deadT / 1.6, 0, 0.7)})`; g.fillRect(0, 0, W, H);
    if (w.lives > 0 && p.deadT < 1.1) { // "restam x N"
      const fx = W / 2 - 22, fy = H / 2 - 9;
      g.drawImage(p.spr.face(), fx, fy, 18, 18); drawTextO(g, 'x', fx + 22, fy + 8, '#ffd23f', 1); drawTextO(g, w.lives, fx + 28, fy + 5, '#fff', 2);
    }
  }
  if (w.state === 'over') {
    const a = clamp(1 - w.overT / 3.2 + 0.2, 0, 0.82);
    g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H);
    const t = 'GAME OVER';
    drawTextO(g, t, Math.round(W / 2 - textW(t, 3) / 2), Math.round(H / 2 - 16), '#ff5a6a', 3);
    const s = 'TENTE DE NOVO';
    drawTextO(g, s, Math.round(W / 2 - textW(s, 1) / 2), Math.round(H / 2 + 10), '#fff', 1);
  }
}

// ---------- Cena de fundo dos menus ----------
function renderTitle(t) {
  const g = ctx, bg = bgOf('forest');
  g.setTransform(HR, 0, 0, HR, 0, 0); g.imageSmoothingEnabled = false;
  const camX = t * 40;
  drawBg(g, bg, camX, 0, t);
  for (let i = 0; i < 22; i++) {
    const wx = Math.floor(camX / T) + i, x = wx * T - camX, v = ((hash2(wx, 0) * 3) | 0);
    g.drawImage(solidTile('forest', 1, 0, v), Math.round(x), 128, T, T);
    for (let k = 1; k < 4; k++) g.drawImage(solidTile('forest', 0, Math.min(3, k - 1), v), Math.round(x), 128 + k * T, T, T);
  }
  if (!Game.titleSpr || Game.titleSprFor !== JSON.stringify(Game.save.char)) {
    Game.titleSprFor = JSON.stringify(Game.save.char);
    Game.titleSpr = buildPlayerSprites(Game.save.char || DEFAULT_CHAR);
  }
  const f = Math.floor(t * 15) % 8;
  drawShadow2(g, 70, 128, 12);
  drawSprite(g, Game.titleSpr.get('run', f), 70, 128 + 2, false, 0, 0);
  g.drawImage(vignette(), 0, 0);
}
function drawShadow2(g, x, y, wd) { g.fillStyle = 'rgba(10,5,20,.3)'; g.fillRect(Math.round(x - wd / 2), y, wd, 1); g.fillRect(Math.round(x - wd / 2 + 1), y + 1, wd - 2, 1); }

// ---------- Fim de fase ----------
function finishLevel(w) {
  const r = { idx: w.idx, coins: w.coinsGot, deaths: w.deaths, secs: Math.round(w.t), stars: w.deaths === 0 ? 3 : w.deaths <= 2 ? 2 : 1 };
  if (Net.role === 'host') Net.finished(r);
  levelResult(r);
}
// Guarda o resultado (também nos aparelhos dos convidados: a fase fica desbloqueada para eles) e mostra a tela de vitória
function levelResult(r) {
  const sv = Game.save, id = LEVELS[r.idx].id;
  const old = sv.best[id] || { coins: 0, stars: 0 };
  sv.best[id] = { coins: Math.max(old.coins, r.coins), stars: Math.max(old.stars, r.stars) };
  sv.unlocked = Math.max(sv.unlocked, r.idx + 2);
  persist();
  Game.mode = 'menu'; Input.enabled = false; Input.clear();
  Snd.music('menu');
  showWin(r);
}
