'use strict';
// ---------- Multiplayer cooperativo (P2P via WebRTC, com PeerJS) ----------
// Não há servidor do jogo: quem cria a sala (o anfitrião) roda a simulação inteira no próprio aparelho.
// Os convidados mandam só os comandos (~10x/s, e na hora quando apertam algo) e recebem "fotos" do mundo
// 20x/s, que são suavizadas na tela. Partículas, sons e textos chegam como eventos.
// O servidor público e gratuito do PeerJS só apresenta os aparelhos um ao outro; depois a conexão é direta
// (ou passa por um "relay" TURN gratuito do PeerJS quando a rede não permite a ligação direta).
const PROTO = 1, MAX_PLAYERS = 4, SNAP_EVERY = 3;
const ID_PREFIX = 'heroisdepixel-v1-', CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', CODE_LEN = 5;
const PEERJS_URLS = ['https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js', 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];

const Net = {
  role: null,            // null = sozinho · 'host' = anfitrião · 'client' = convidado
  peer: null, conns: [], conn: null, code: '', pid: 0, roster: [], inLevel: false,
  ev: [], tick: 0, ping: 0, lastMsg: 0, ctl: null, sendT: 0, last: null, timers: [],
};

// ---------- Campos sincronizados (as "fotos" do mundo são listas de números na ordem abaixo) ----------
const PF = ['x', 'y', 'vx', 'vy', 'face', 'hp', 'maxHp', 'mana', 'manaDelay', 'act', 'actT', 'actDur', 'atkIdx', 'aimDeg', 'aimFace',
  'hurtT', 'inv', 'dash', 'dashKind', 'flipT', 'landT', 'cd.a', 'cd.b', 'cd.c', 'ground', 'dead', 'deadT', 'out', 'block', 'glide', 'diving'];
const EF = ['x', 'y', 'vx', 'vy', 'dir', 'hp', 'flash', 'sq', 'hurt', 'slow', 'stun', 'st', 't', 'throwT', 'ground', 'sts.burn', 'sts.poison', 'sts.freeze'];
const QF = ['type', 'x', 'y', 'vx', 'vy', 'g', 'life', 'eli', 'stuck'];
const RF = ['type', 'x', 'y', 'vx', 'vy', 'g', 'rot'];
const WF = ['state', 'lives', 'coinsGot', 'nextLife', 'bossActive', 'flash', 'shake', 'cine', 'hitstop', 'lifeT'];
const SMOOTH = new Set(['x', 'y']);    // posições: o convidado desliza até elas em vez de pular

function getF(o, k) { const i = k.indexOf('.'); return i < 0 ? o[k] : o[k.slice(0, i)][k.slice(i + 1)]; }
function setF(o, k, v) { const i = k.indexOf('.'); if (i < 0) o[k] = v; else o[k.slice(0, i)][k.slice(i + 1)] = v; }
function encV(v) { return typeof v === 'number' ? Math.round(v * 100) / 100 : typeof v === 'boolean' ? +v : v === undefined ? null : v; }
const pack = (o, F) => F.map(k => encV(getF(o, k)));

// ---------- Utilidades ----------
function loadPeerJS() {
  if (window.Peer) return Promise.resolve();
  const tryUrl = i => new Promise((res, rej) => {
    if (i >= PEERJS_URLS.length) return rej(new Error('Sem internet? Não consegui carregar a biblioteca de conexão.'));
    const s = document.createElement('script');
    s.src = PEERJS_URLS[i]; s.onload = () => res(); s.onerror = () => { s.remove(); tryUrl(i + 1).then(res, rej); };
    document.head.appendChild(s);
  });
  return tryUrl(0);
}
const newCode = () => Array.from({ length: CODE_LEN }, () => CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0]).join('');
const cleanCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);
const inviteLink = code => location.origin + location.pathname + '?sala=' + code;
function openPeer(id) {
  return new Promise((res, rej) => {
    const peer = id ? new Peer(id, { debug: 1 }) : new Peer({ debug: 1 });
    const fail = e => { peer.off('open'); peer.destroy(); rej(e); };
    peer.once('open', () => { peer.off('error', fail); res(peer); });
    peer.once('error', fail);
  });
}
function send(conn, m) { try { if (conn && conn.open) conn.send(m); } catch (e) {} }
function broadcast(m) { for (const c of Net.conns) send(c, m); }
function every(ms, fn) { Net.timers.push(setInterval(fn, ms)); }

// O herói que chega pela rede é conferido campo a campo (evita travar o jogo com dados estranhos)
function cleanChar(ch) {
  const c = { ...DEFAULT_CHAR }, src = ch && typeof ch === 'object' ? ch : {};
  const nOpts = { elem: ELEMENTS.length };
  for (const t of TABS) for (const f of t.fields) if (f.type === 'choice') nOpts[f.k] = f.opts.length;
  for (const k in c) {
    const v = src[k];
    if (k === 'name') c.name = String(v || 'Herói').slice(0, 14);
    else if (k === 'cls') c.cls = CLASSES[v] ? v : 'guerreiro';
    else if (typeof c[k] === 'number') { if (Number.isInteger(v) && v >= 0 && v < (nOpts[k] || 1)) c[k] = v; }
    else if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) c[k] = v;
  }
  return c;
}
function playerById(w, id) { return w && w.players.find(p => p.id === id); }
// Mantém os heróis do mundo iguais à lista de jogadores da sala (alguém entrou ou saiu no meio da fase)
function syncPlayers(w) {
  if (!w) return;
  w.roster = Net.roster;
  w.players = w.players.filter(p => Net.roster.some(r => r.id === p.id));
  for (const r of Net.roster) if (!playerById(w, r.id)) addPlayer(w, r);
}

// ---------- Anfitrião ----------
async function hostRoom() {
  await loadPeerJS();
  let peer = null, code = '';
  for (let tries = 0; !peer; tries++) {
    code = newCode();
    try { peer = await openPeer(ID_PREFIX + code); }
    catch (e) { if (e.type !== 'unavailable-id' || tries > 4) throw netError(e); }
  }
  Object.assign(Net, { role: 'host', peer, code, pid: 0, conns: [], inLevel: false, ev: [], roster: [{ id: 0, ch: Game.save.char }] });
  peer.on('connection', conn => {
    conn.lastMsg = performance.now();
    conn.on('data', m => hostMsg(conn, m));
    conn.on('close', () => dropConn(conn));
    conn.on('error', () => dropConn(conn));
  });
  peer.on('disconnected', () => { if (Net.peer === peer && !peer.destroyed) peer.reconnect(); });   // perdeu só o "apresentador": as conexões continuam
  peer.on('error', e => console.warn('[rede]', e.type, e));
  every(2000, () => {   // derruba quem sumiu sem avisar
    const now = performance.now();
    for (const c of Net.conns.slice()) if (now - c.lastMsg > 10000) { try { c.close(); } catch (e) {} dropConn(c); }
  });
  return code;
}
function hostMsg(conn, m) {
  if (!m || typeof m !== 'object') return;
  conn.lastMsg = performance.now();
  if (m.t === 'hello') {
    if (conn.pid !== undefined) return;
    if (m.v !== PROTO) return refuse(conn, 'Versões diferentes do jogo. Todos devem atualizar a página.');
    if (Net.roster.length >= MAX_PLAYERS) return refuse(conn, `Sala cheia (máximo ${MAX_PLAYERS} jogadores).`);
    let id = 1; while (Net.roster.some(r => r.id === id)) id++;
    conn.pid = id; Net.conns.push(conn);
    const ch = cleanChar(m.ch);
    Net.roster.push({ id, ch });
    send(conn, { t: 'welcome', pid: id, code: Net.code });
    rosterChanged();
    if (Net.inLevel && Game.world) send(conn, startMsg(Game.world));
    banner(`${ch.name} entrou!`, '', 1600); Snd.sfx('check');
  } else if (m.t === 'in') {
    const p = Net.inLevel && playerById(Game.world, conn.pid);
    if (!p) return;
    const c = p.inp;
    c.d = m.d | 0; c.h |= m.h | 0;                // toques rápidos se acumulam até o próximo passo da simulação
    c.am = m.am === 'pointer' ? 'pointer' : 'keys';
    c.ad = clamp(+m.ad || 0, -90, 90); c.af = m.af < 0 ? -1 : 1;
  } else if (m.t === 'ping') send(conn, { t: 'pong', ts: m.ts });
  else if (m.t === 'bye') { try { conn.close(); } catch (e) {} dropConn(conn); }
}
function refuse(conn, msg) { send(conn, { t: 'refuse', msg }); setTimeout(() => { try { conn.close(); } catch (e) {} }, 500); }
function dropConn(conn) {
  const i = Net.conns.indexOf(conn);
  if (i < 0) return;
  Net.conns.splice(i, 1);
  const r = Net.roster.find(x => x.id === conn.pid);
  Net.roster = Net.roster.filter(x => x.id !== conn.pid);
  if (r) banner(`${r.ch.name} saiu`, '', 1600);
  rosterChanged();
}
function rosterChanged() {
  if (Net.inLevel) syncPlayers(Game.world);
  broadcast({ t: 'roster', roster: Net.roster });
  renderRoom();
}
// Estado que não muda o tempo todo (moedas pegas, itens, checkpoints, inimigos vivos): mandado ao começar/entrar
function fullState(w) {
  return {
    coins: w.coins.flatMap((c, i) => c.got ? [i] : []), checks: w.checks.flatMap((c, i) => c.on ? [i] : []),
    picks: w.picks, alive: w.enemies.filter(e => !e.dead).map(e => e.id),
  };
}
const startMsg = w => ({ t: 'start', idx: w.idx, roster: Net.roster, full: fullState(w) });
Net.started = w => { Net.inLevel = true; Net.ev = []; Net.tick = 0; broadcast(startMsg(w)); };
// Chamado a cada passo da simulação do anfitrião
Net.hostTick = w => {
  for (const p of w.players) if (p !== w.p) p.inp.h = 0;
  if (++Net.tick % SNAP_EVERY) return;
  if (Net.conns.length) broadcast({
    t: 'snap', ev: Net.ev, w: pack(w, WF),
    P: w.players.map(p => [p.id, ...pack(p, PF)]),
    E: w.enemies.filter(e => e.active && !e.dead).map(e => [e.id, ...pack(e, EF)]),
    Q: w.proj.map(q => pack(q, QF)), R: w.eproj.map(q => pack(q, RF)),
  });
  Net.ev = [];
};
Net.finished = r => { Net.inLevel = false; broadcast({ t: 'end', r }); };
// Anfitrião voltou aos menus: os convidados esperam na sala
Net.toLobby = () => { if (Net.role !== 'host') return; Net.inLevel = false; broadcast({ t: 'lobby' }); };

// ---------- Convidado ----------
async function joinRoom(code) {
  await loadPeerJS();
  const peer = await openPeer().catch(e => { throw netError(e); });
  Object.assign(Net, { role: 'client', peer, code, conns: [], inLevel: false, ctl: makeCtl(), last: null, sendT: 0 });
  return new Promise((res, rej) => {
    const conn = Net.conn = peer.connect(ID_PREFIX + code, { serialization: 'json', reliable: true });
    const to = setTimeout(() => rej(new Error('O anfitrião não respondeu. Confira o código e se a sala ainda está aberta.')), 15000);
    peer.on('error', e => { clearTimeout(to); if (e.type === 'peer-unavailable') rej(new Error('Sala não encontrada. Confira o código.')); else if (!Net.pid) rej(netError(e)); });
    conn.on('open', () => { Net.lastMsg = performance.now(); send(conn, { t: 'hello', v: PROTO, ch: Game.save.char }); });
    conn.on('data', m => {
      if (m && m.t === 'welcome') { clearTimeout(to); res(); }
      if (m && m.t === 'refuse') { clearTimeout(to); rej(new Error(m.msg)); }
      clientMsg(m);
    });
    conn.on('close', () => { if (Net.conn === conn) leaveRoom('A conexão com o anfitrião caiu.'); });
    every(1000, () => {
      send(conn, { t: 'ping', ts: performance.now() });
      if (Net.pid && performance.now() - Net.lastMsg > 8000) leaveRoom('A conexão com o anfitrião caiu.');
    });
  });
}
function clientMsg(m) {
  if (!m || typeof m !== 'object' || Net.role !== 'client') return;
  Net.lastMsg = performance.now();
  const w = Game.world;
  switch (m.t) {
    case 'welcome': Net.pid = m.pid; renderRoom(); break;
    case 'roster': Net.roster = m.roster; if (Net.inLevel) syncPlayers(w); renderRoom(); break;
    case 'start': clientStart(m); break;
    case 'snap': if (Net.inLevel && w) applySnap(w, m); break;
    case 'end': Net.inLevel = false; levelResult(m.r); break;
    case 'lobby': Net.inLevel = false; Game.mode = 'menu'; Input.enabled = false; Snd.music('menu'); openRoom(); break;
    case 'pong': Net.ping = Math.round(performance.now() - m.ts); break;
    case 'bye': leaveRoom('O anfitrião fechou a sala.'); break;
  }
}
function clientStart(m) {
  Net.roster = m.roster; Net.inLevel = true;
  hideScreens();
  startLevel(m.idx, m.roster, Net.pid);
  const w = Game.world, f = m.full;
  for (const i of f.coins) if (w.coins[i]) w.coins[i].got = true;
  for (const i of f.checks) if (w.checks[i]) w.checks[i].on = true;
  w.picks = f.picks;
  const alive = new Set(f.alive);
  w.enemies = w.enemies.filter(e => alive.has(e.id));
  if (w.boss && !alive.has(w.boss.id)) w.boss.dead = true;
  w.byId = new Map(w.enemies.map(e => [e.id, e]));
  w.snapAge = 1;
  w.p.inp = Net.ctl;
}
// Efeitos pontuais que o anfitrião mandou
function playEvent(w, ev) {
  switch (ev[0]) {
    case 's': Snd.sfx(ev[1]); break;
    case 'm': Snd.music(ev[1]); break;
    case 'b': burst(w, ev[1], ev[2], ev[3], ev[4], ev[5], ev[6], ev[7]); break;
    case 'f': floatText(w, ev[1], ev[2], ev[3], ev[4], ev[5]); break;
    case 'r': rise(w, ev[1], ev[2], ev[3], ev[4], ev[5], ev[6]); break;
    case 'bn': banner(ev[1], ev[2], ev[3]); break;
    case 'fx': { const f = ev[1]; if (f.pid !== undefined) f.p = playerById(w, f.pid); w.fx.push(f); break; }
    case 'k': { const e = w.byId.get(ev[1]); if (e) { e.dead = true; w.byId.delete(ev[1]); w.enemies = w.enemies.filter(x => x !== e); } break; }
    case 'cg': if (w.coins[ev[1]]) w.coins[ev[1]].got = true; break;
    case 'ck': if (w.checks[ev[1]]) w.checks[ev[1]].on = true; break;
    case 'pk': w.picks = ev[1]; break;
  }
}
function unpack(o, F, a, from) {
  for (let i = 0; i < F.length; i++) {
    const k = F[i];
    if (SMOOTH.has(k)) o['n' + k] = a[i + from]; else setF(o, k, a[i + from]);
  }
}
// Posições novas viram "alvo"; se o salto for grande (renasceu, apareceu agora), vai direto
function settle(o, fresh) { if (fresh || Math.abs(o.nx - o.x) > 48 || Math.abs(o.ny - o.y) > 48) { o.x = o.nx; o.y = o.ny; } }
function applySnap(w, m) {
  for (const ev of m.ev) playEvent(w, ev);
  WF.forEach((k, i) => { w[k] = m.w[i]; });
  for (const a of m.P) {
    const p = playerById(w, a[0]);
    if (!p) continue;
    const wasDead = p.dead;
    unpack(p, PF, a, 1); settle(p, wasDead !== p.dead && !p.dead);
  }
  for (const e of w.enemies) e.seen = false;
  for (const a of m.E) {
    const e = w.byId.get(a[0]);
    if (!e) continue;
    unpack(e, EF, a, 1); settle(e, !e.active); e.active = true; e.seen = true;
  }
  for (const e of w.enemies) if (!e.seen) e.active = false;
  w.proj = m.Q.map(a => { const q = {}; QF.forEach((k, i) => { q[k] = a[i]; }); q.w = 8; q.h = 4; if (q.type === 'spell') q.el = ELEMENTS[q.eli || 0]; return q; });
  w.eproj = m.R.map(a => { const q = {}; RF.forEach((k, i) => { q[k] = a[i]; }); return q; });
  w.snapAge = 0;
}
// Um quadro do convidado: manda comandos, anda com tudo um pouquinho até a próxima "foto" e cuida dos efeitos
Net.clientFrame = (w, dt) => {
  sendInput(w, dt);
  if (Net.ctl.am === 'pointer') { w.p.aimDeg = Net.ctl.ad; w.p.aimFace = Net.ctl.af; }   // a sua mira responde na hora
  if (w.hitstop > 0) { w.hitstop -= dt; return; }
  w.t += dt; w.snapAge += dt;
  const ext = w.snapAge < 0.15, k = Math.min(1, dt * 18);
  const glide = o => {
    if (ext) { o.nx += o.vx * dt; o.ny += o.vy * dt; }
    o.x += (o.nx - o.x) * k; o.y += (o.ny - o.y) * k;
  };
  for (const p of w.players) {
    if (p.nx === undefined) continue;
    glide(p); p.anim += dt;
    if (!p.dead) for (const c of w.coins) if (!c.got) coinMagnet(p, c, dt);
  }
  for (const e of w.enemies) if (e.active && e.nx !== undefined) { glide(e); e.t += dt; if (e.flash > 0) e.flash -= dt; if (e.sq > 0) e.sq -= dt; }
  for (const q of w.proj) { q.life -= dt; if (!q.stuck) { q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; } }
  for (const q of w.eproj) { q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += dt * 10; }
  if (w.shake > 0) w.shake -= dt;
  if (w.flash > 0) w.flash -= dt;
  if (w.cine > 0) w.cine -= dt;
  cosmetics(w, dt);
  updateVisuals(w, dt);
};
function sendInput(w, dt) {
  const c = readLocalCtl(w, w.p, Net.ctl), L = Net.last;
  Net.sendT -= dt;
  const changed = !L || c.d !== L.d || c.h || c.am !== L.am || c.af !== L.af || Math.abs(c.ad - L.ad) > 2;
  if (!changed && Net.sendT > 0) return;
  send(Net.conn, { t: 'in', d: c.d, h: c.h, am: c.am, ad: Math.round(c.ad), af: c.af });
  Net.last = { d: c.d, am: c.am, ad: c.ad, af: c.af }; Net.sendT = 0.1;
}

// ---------- Sair ----------
// msg: motivo mostrado na tela de multiplayer (sem msg, volta ao título)
function leaveRoom(msg) {
  if (Net.role) {
    if (Net.role === 'client') send(Net.conn, { t: 'bye' }); else broadcast({ t: 'bye' });
    Net.timers.forEach(clearInterval);
    const peer = Net.peer;
    setTimeout(() => { try { peer.destroy(); } catch (e) {} }, 300);   // dá tempo do "tchau" chegar
    Object.assign(Net, { role: null, peer: null, conns: [], conn: null, code: '', pid: 0, roster: [], inLevel: false, ev: [], timers: [], ping: 0 });
    Game.world = null;
  }
  if (msg) openMp(msg); else goTitle();
}
function netError(e) {
  const t = e && e.type;
  if (t === 'browser-incompatible') return new Error('Este navegador não suporta o multiplayer. Use Chrome, Edge, Firefox ou Safari atualizados.');
  if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return new Error('Não consegui falar com o servidor de conexão. Confira a internet e tente de novo.');
  return new Error((e && e.message) || 'Erro de conexão.');
}
addEventListener('pagehide', () => { if (Net.role) { if (Net.role === 'client') send(Net.conn, { t: 'bye' }); else broadcast({ t: 'bye' }); } });
