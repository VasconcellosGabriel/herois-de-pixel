'use strict';
// ---------- Multiplayer cooperativo (P2P via WebRTC, com PeerJS) ----------
// Não há servidor do jogo: quem cria a sala (o anfitrião) roda a simulação inteira no próprio aparelho.
// Os convidados mandam os comandos e a posição do próprio herói (que eles mesmos simulam na hora, sem esperar a rede)
// e recebem "fotos" do mundo 30x/s, suavizadas na tela. Partículas, sons e textos chegam como eventos.
// Dois canais por conexão: o normal (confiável e em ordem) para eventos, toques de botão e chat, e um "rápido"
// (sem reenvio e fora de ordem) para as fotos e posições: um pacote perdido no Wi-Fi não segura os seguintes.
// O servidor público e gratuito do PeerJS só apresenta os aparelhos um ao outro; depois a conexão é direta
// (ou passa por um "relay" TURN gratuito do PeerJS quando a rede não permite a ligação direta).
const PROTO = 8, MAX_PLAYERS = 4, SNAP_EVERY = 2, FAST_ID = 100;
const ID_PREFIX = 'heroisdepixel-v1-', CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', CODE_LEN = 5;
const PEERJS_URLS = ['https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js', 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];

const Net = {
  role: null,            // null = sozinho · 'host' = anfitrião · 'client' = convidado
  peer: null, conns: [], conn: null, code: '', pid: 0, roster: [], inLevel: false,
  ev: [], tick: 0, ping: 0, lastMsg: 0, ctl: null, sendT: 0, last: null, timers: [],
  link: '', lvId: 0, lastSnap: 0, inSeq: 0, chatT: 0,
};
// Servidores que ajudam os aparelhos a se acharem (STUN) e o relay gratuito do PeerJS (TURN, último recurso)
const ICE = { iceServers: [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
], sdpSemantics: 'unified-plan' };

// ---------- Campos sincronizados (as "fotos" do mundo são listas de números na ordem abaixo) ----------
const PF = ['x', 'y', 'vx', 'vy', 'face', 'hp', 'maxHp', 'mana', 'manaDelay', 'act', 'actT', 'actDur', 'atkIdx', 'aimDeg', 'aimFace',
  'hurtT', 'inv', 'dash', 'dashKind', 'flipT', 'landT', 'cd.a', 'cd.b', 'cd.c', 'ground', 'dead', 'deadT', 'out', 'block', 'glide', 'diving',
  'maxMana', 'sp', 'xpGot', 'h', 'crouch', 'flamer', 'flameDir', 'ep', 'diveWait'];
// campos do corpo que o convidado prevê no próprio herói (não vêm do anfitrião enquanto ele anda livre)
const OWN_BODY = new Set(['x', 'y', 'vx', 'vy', 'face', 'ground', 'h', 'crouch', 'glide', 'landT', 'flipT', 'block']);
const EF = ['x', 'y', 'vx', 'vy', 'dir', 'hp', 'flash', 'sq', 'hurt', 'slow', 'stun', 'st', 't', 'throwT', 'ground', 'sts.burn', 'sts.poison', 'sts.freeze'];
const QF = ['type', 'x', 'y', 'vx', 'vy', 'g', 'life', 'eli', 'stuck'];
const RF = ['type', 'x', 'y', 'vx', 'vy', 'g', 'rot', 'w', 'h'];
const WF = ['state', 'lives', 'coinsGot', 'nextLife', 'bossActive', 'cine', 'lifeT'];   // clarão/tremida vão por evento, só para quem causou
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
    const peer = id ? new Peer(id, { debug: 1, config: ICE }) : new Peer({ debug: 1, config: ICE });
    const fail = e => { peer.off('open'); peer.destroy(); rej(e); };
    peer.once('open', () => { peer.off('error', fail); res(peer); });
    peer.once('error', fail);
  });
}
function send(conn, m) { try { if (conn && conn.open) conn.send(m); } catch (e) {} }
function broadcast(m) { for (const c of Net.conns) send(c, m); }
// Canal rápido: criado dos dois lados com o mesmo número (negociado), sem reenvio e sem ordem
function openFast(conn, onData) {
  if (conn.fast || !conn.peerConnection) return;
  try {
    const dc = conn.peerConnection.createDataChannel('rapido', { negotiated: true, id: FAST_ID, ordered: false, maxRetransmits: 0 });
    dc.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (er) { return; } onData(m); };
    conn.fast = dc;
  } catch (e) { console.warn('[rede] sem canal rápido', e); }
}
// drop: pode ser descartada se a conexão estiver congestionada (as fotos: logo vem outra)
function sendFast(conn, m, drop, str) {
  const dc = conn && conn.fast;
  if (dc && dc.readyState === 'open') {
    if (drop && dc.bufferedAmount > 32768) return;
    try { dc.send(str || JSON.stringify(m)); return; } catch (e) {}
  }
  const rc = conn && conn.dataChannel;
  if (drop && rc && rc.bufferedAmount > 32768) return;
  send(conn, m);
}
// Ligação direta ou por relay (o relay passa por servidores na Europa/EUA e aumenta muito o ping)
async function linkInfo(conn) {
  try {
    const st = await conn.peerConnection.getStats();
    let pair = null;
    st.forEach(x => { if (x.type === 'transport' && x.selectedCandidatePairId) pair = st.get(x.selectedCandidatePairId); });
    if (!pair) st.forEach(x => { if (x.type === 'candidate-pair' && x.nominated && x.state === 'succeeded') pair = x; });
    if (!pair) return null;
    const lc = st.get(pair.localCandidateId), rc = st.get(pair.remoteCandidateId);
    const relay = (lc && lc.candidateType === 'relay') || (rc && rc.candidateType === 'relay');
    return { relay, rtt: pair.currentRoundTripTime ? Math.round(pair.currentRoundTripTime * 1000) : 0 };
  } catch (e) { return null; }
}
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
  for (const r of Net.roster) {
    const p = playerById(w, r.id);
    if (!p) { addPlayer(w, r); continue; }
    const key = JSON.stringify(r.ch);
    if (p.chKey !== key) { p.chKey = key; p.ch = { ...r.ch, cls: p.cls.id, elem: p.ch.elem }; p.spr = buildPlayerSprites(p.ch); if (p === w.p) setupTouch(p); }
  }
  scaleEnemies(w);                     // mais (ou menos) heróis: inimigos mais (ou menos) resistentes
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
  Object.assign(Net, { role: 'host', peer, code, pid: 0, conns: [], inLevel: false, ev: [], roster: [{ id: 0, ch: Game.save.char, b: myBuild() }] });
  peer.on('connection', conn => {
    conn.lastMsg = performance.now();
    conn.on('open', () => openFast(conn, m => hostMsg(conn, m)));
    conn.on('data', m => hostMsg(conn, m));
    conn.on('close', () => dropConn(conn));
    conn.on('error', () => dropConn(conn));
  });
  peer.on('disconnected', () => { if (Net.peer === peer && !peer.destroyed) peer.reconnect(); });   // perdeu só o "apresentador": as conexões continuam
  peer.on('error', e => console.warn('[rede]', e.type, e));
  every(2000, () => {   // derruba quem sumiu sem avisar
    const now = performance.now();
    for (const c of Net.conns.slice()) if (now - c.lastMsg > 10000) { try { c.close(); } catch (e) {} dropConn(c); }
    // o anfitrião vê o pior ping entre os convidados
    Promise.all(Net.conns.map(linkInfo)).then(rs => {
      rs = rs.filter(Boolean);
      Net.ping = rs.reduce((a, x) => Math.max(a, x.rtt), 0);
      Net.link = rs.some(x => x.relay) ? 'relay' : rs.length ? 'direto' : '';
    });
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
    Net.roster.push({ id, ch, b: cleanBuild(m.b) });
    send(conn, { t: 'welcome', pid: id, code: Net.code });
    rosterChanged();
    if (Net.inLevel && Game.world) send(conn, startMsg(Game.world));
    banner(`${ch.name} entrou!`, '', 1600); Snd.sfx('check');
    Net.sys(ch.name + ' entrou na sala');
  } else if (m.t === 'in') {
    const p = Net.inLevel && playerById(Game.world, conn.pid);
    if (!p) return;
    const c = p.inp;
    c.h |= m.h | 0;                                // toques rápidos se acumulam até o próximo passo da simulação
    const s = +m.s || 0;
    if (s && s <= (conn.inSeq || 0)) return;       // chegou fora de ordem: já há uma mais nova
    conn.inSeq = s;
    c.d = m.d | 0;
    c.am = m.am === 'pointer' || m.am === 'auto' ? m.am : 'keys';
    c.ad = clamp(+m.ad || 0, -90, 90); c.af = m.af < 0 ? -1 : 1;
    const b = m.b;                                 // posição do herói que o convidado simulou
    if (Array.isArray(b) && b.length >= 10) p.rp = {
      ep: b[0] | 0, x: +b[1] || 0, y: +b[2] || 0, vx: clamp(+b[3] || 0, -700, 700), vy: clamp(+b[4] || 0, -900, 900), face: b[5] < 0 ? -1 : 1,
      ground: !!(b[6] & 1), crouch: !!(b[6] & 2), glide: !!(b[6] & 4), jumps: clamp(b[7] | 0, 0, 1), flipT: clamp(+b[8] || 0, 0, 0.4), drop: clamp(+b[9] || 0, 0, 0.3),
    };
  } else if (m.t === 'chat') {
    const text = cleanChat(m.text), now = performance.now();
    if (!text || now - (conn.chatT || 0) < 400) return;
    conn.chatT = now;
    Chat.add({ id: conn.pid, text });
    for (const c of Net.conns) if (c !== conn) send(c, { t: 'chat', id: conn.pid, text });
  } else if (m.t === 'char') {         // o convidado trocou de roupa durante a fase
    const r = Net.roster.find(x => x.id === conn.pid);
    if (r) { r.ch = { ...cleanChar(m.ch), cls: r.ch.cls, elem: r.ch.elem }; rosterChanged(); }
  } else if (m.t === 'build') {        // o convidado evoluiu o herói: vale a partir da próxima fase
    const r = Net.roster.find(x => x.id === conn.pid);
    if (r) { r.b = cleanBuild(m.b); rosterChanged(); }
  } else if (m.t === 'ping') sendFast(conn, { t: 'pong', ts: m.ts });
  else if (m.t === 'bye') { try { conn.close(); } catch (e) {} dropConn(conn); }
}
function refuse(conn, msg) { send(conn, { t: 'refuse', msg }); setTimeout(() => { try { conn.close(); } catch (e) {} }, 500); }
function dropConn(conn) {
  const i = Net.conns.indexOf(conn);
  if (i < 0) return;
  Net.conns.splice(i, 1);
  const r = Net.roster.find(x => x.id === conn.pid);
  Net.roster = Net.roster.filter(x => x.id !== conn.pid);
  if (r) { banner(`${r.ch.name} saiu`, '', 1600); Net.sys(r.ch.name + ' saiu da sala'); }
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
    broken: w.broken, chests: w.chests.flatMap((c, i) => c.open ? [i] : []),
    minions: w.enemies.filter(e => e.minion && !e.dead).map(e => [e.id, e.type, r1(cxOf(e)), r1(e.y + e.h)]),
  };
}
const startMsg = w => ({ t: 'start', idx: w.idx, lv: Net.lvId, roster: Net.roster, full: fullState(w) });
Net.started = w => { Net.inLevel = true; Net.ev = []; Net.tick = 0; Net.lvId = 1 + ((Math.random() * 1e9) | 0); broadcast(startMsg(w)); };
// Chamado a cada passo da simulação do anfitrião
Net.hostTick = w => {
  for (const p of w.players) if (p !== w.p) p.inp.h = 0;
  if (++Net.tick % SNAP_EVERY) return;
  if (!Net.conns.length) { Net.ev = []; return; }
  if (Net.ev.length) { broadcast({ t: 'ev', ev: Net.ev }); Net.ev = []; }   // eventos: canal confiável
  const snap = {
    t: 'snap', L: Net.lvId, s: Net.tick, w: pack(w, WF),
    P: w.players.map(p => [p.id, ...pack(p, PF)]),
    E: w.enemies.filter(e => e.active && !e.dead).map(e => [e.id, ...pack(e, EF)]),
    Q: w.proj.map(q => pack(q, QF)), R: w.eproj.map(q => pack(q, RF)),
  }, str = JSON.stringify(snap);
  for (const c of Net.conns) sendFast(c, snap, true, str);            // fotos: canal rápido (perder uma não atrasa a próxima)
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
    Object.assign(Net, { inSeq: 0, lastSnap: 0, ping: 0, rtts: [], link: '' });
    const to = setTimeout(() => rej(new Error('O anfitrião não respondeu. Confira o código e se a sala ainda está aberta.')), 15000);
    peer.on('error', e => { clearTimeout(to); if (e.type === 'peer-unavailable') rej(new Error('Sala não encontrada. Confira o código.')); else if (!Net.pid) rej(netError(e)); });
    conn.on('open', () => {
      Net.lastMsg = performance.now();
      openFast(conn, clientMsg);
      send(conn, { t: 'hello', v: PROTO, ch: Game.save.char, b: myBuild() });
    });
    conn.on('data', m => {
      if (m && m.t === 'welcome') { clearTimeout(to); res(); }
      if (m && m.t === 'refuse') { clearTimeout(to); rej(new Error(m.msg)); }
      clientMsg(m);
    });
    conn.on('close', () => { if (Net.conn === conn) leaveRoom('A conexão com o anfitrião caiu.'); });
    every(500, () => sendFast(conn, { t: 'ping', ts: performance.now() }));
    every(1000, () => {
      linkInfo(conn).then(x => { if (x) Net.link = x.relay ? 'relay' : 'direto'; });
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
    case 'snap': if (Net.inLevel && w && m.L === Net.lvId && m.s > Net.lastSnap) { Net.lastSnap = m.s; applySnap(w, m); } break;
    case 'ev': if (Net.inLevel && w) for (const ev of m.ev) playEvent(w, ev); break;
    case 'chat': Chat.add({ id: m.id, text: cleanChat(m.text) }); break;
    case 'sys': Chat.add({ sys: true, text: cleanChat(m.text) }); break;
    case 'end': Net.inLevel = false; levelResult(m.r); break;
    case 'lobby': Net.inLevel = false; Game.mode = 'menu'; Input.enabled = false; Snd.music('menu'); openRoom(); break;
    case 'pong': {                      // mediana das últimas 5 medições: um travamento isolado não infla o número
      const rtt = performance.now() - m.ts;
      if (!(rtt >= 0 && rtt < 10000)) break;
      Net.rtts = (Net.rtts || []).concat(rtt).slice(-5);
      Net.ping = Math.round(Net.rtts.slice().sort((a, b) => a - b)[Net.rtts.length >> 1]);
      break;
    }
    case 'bye': leaveRoom('O anfitrião fechou a sala.'); break;
  }
}
function clientStart(m) {
  Net.roster = m.roster; Net.inLevel = true; Net.lvId = m.lv; Net.lastSnap = 0;
  hideScreens();
  startLevel(m.idx, m.roster, Net.pid);
  const w = Game.world, f = m.full;
  for (const i of f.coins) if (w.coins[i]) w.coins[i].got = true;
  for (const i of f.checks) if (w.checks[i]) w.checks[i].on = true;
  w.picks = f.picks;
  for (const [tx, ty] of f.broken || []) breakTile(w, tx, ty, null, true);
  for (const i of f.chests || []) if (w.chests[i]) w.chests[i].open = true;
  for (const [id, t, x, y] of f.minions || []) if (ENEMIES[t]) w.enemies.push(makeEnemy({ t, x, y }, id));
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
    case 's': if (ev[2] === undefined || ev[2] === -1 || ev[2] === Net.pid) Snd.sfx(ev[1]); break;   // só os meus sons e os do mundo
    case 'fe': if (ev[1] === -1 || ev[1] === Net.pid) {                  // clarão/tremida: só se fui eu (ou se é do mundo)
      if (ev[2]) w.flash = Math.max(w.flash || 0, ev[2]);
      if (ev[3]) w.shake = Math.max(w.shake || 0, ev[3]);
      if (ev[4]) w.hitstop = Math.max(w.hitstop || 0, ev[4]);
    } break;
    case 'bo': if (ev[1] === Net.pid && w.p.pred) { w.p.vy = -240; if (DJUMP[w.p.cls.id]) w.p.jumps = 1; } break;   // quicou num inimigo
    case 'm': Snd.music(ev[1]); break;
    case 'b': burst(w, ev[1], ev[2], ev[3], ev[4], ev[5], ev[6], ev[7]); break;
    case 'f': floatText(w, ev[1], ev[2], ev[3], ev[4], ev[5]); break;
    case 'r': rise(w, ev[1], ev[2], ev[3], ev[4], ev[5], ev[6]); break;
    case 'bn': banner(ev[1], ev[2], ev[3]); break;
    case 'fx': { const f = ev[1]; if (f.pid !== undefined) f.p = playerById(w, f.pid); w.fx.push(f); break; }
    case 'sp': if (ENEMIES[ev[2]] && !w.byId.has(ev[1])) { const e = makeEnemy({ t: ev[2], x: ev[3], y: ev[4] }, ev[1]); e.minion = true; w.enemies.push(e); w.byId.set(e.id, e); } break;
    case 'k': { const e = w.byId.get(ev[1]); if (e) { e.dead = true; w.byId.delete(ev[1]); w.enemies = w.enemies.filter(x => x !== e); } break; }
    case 'cg': if (w.coins[ev[1]]) w.coins[ev[1]].got = true; break;
    case 'ck': if (w.checks[ev[1]]) w.checks[ev[1]].on = true; break;
    case 'pk': w.picks = ev[1]; break;
    case 'tb': breakTile(w, ev[1], ev[2], null, true); break;
    case 'td': w.tileHp.set(ev[2] * w.lv.w + ev[1], 1); tilesDirty(w, ev[1]); break;
    case 'ch': if (w.chests[ev[1]]) w.chests[ev[1]].open = true; break;
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
const PF_I = Object.fromEntries(PF.map((k, i) => [k, i + 1]));
// O meu herói: enquanto anda livre, o corpo é previsto aqui mesmo; quando o anfitrião assume (empurrão, rolamento,
// mergulho, morte), segue a foto. ep mudou = o anfitrião moveu o herói à força: vai direto para a posição dele.
function applyOwn(w, p, a) {
  const ep = a[PF_I.ep], auth = a[PF_I.dash] > 0 || a[PF_I.hurtT] > 0 || a[PF_I.diving] || a[PF_I.diveWait] || a[PF_I.dead] || a[PF_I.out];
  const forced = ep !== p.ep || p.nx === undefined;
  if (auth || forced) {
    unpack(p, PF, a, 1);
    if (forced) { p.x = p.nx; p.y = p.ny; }
    p.pred = !auth;
    return;
  }
  for (let i = 0; i < PF.length; i++) {
    const k = PF[i];
    if (!OWN_BODY.has(k)) setF(p, k, a[i + 1]);
  }
  p.pred = true;
}
function applySnap(w, m) {
  const was = w.state;
  WF.forEach((k, i) => { w[k] = m.w[i]; });
  // game over: a fase recomeça com 3 vidas também no save do convidado (como no anfitrião)
  if (w.state === 'over' && was !== 'over') { Game.save.lives = START_LIVES; persist(); }
  for (const a of m.P) {
    const p = playerById(w, a[0]);
    if (!p) continue;
    if (p === w.p) { applyOwn(w, p, a); continue; }
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
  const me = w.p;
  sendInput(w, dt);
  if (Net.ctl.am === 'pointer') { me.aimDeg = Net.ctl.ad; me.aimFace = Net.ctl.af; }   // a sua mira responde na hora
  if (me.pred && !me.dead && w.state === 'play') predictMe(w, me, dt);            // o seu herói anda na hora
  if (w.hitstop > 0) { w.hitstop -= dt; return; }
  w.t += dt; w.snapAge += dt;
  const ext = w.snapAge < 0.15, k = Math.min(1, dt * 18);
  const glide = o => {
    if (ext) { o.nx += o.vx * dt; o.ny += o.vy * dt; }
    o.x += (o.nx - o.x) * k; o.y += (o.ny - o.y) * k;
  };
  for (const p of w.players) {
    if (p.nx === undefined) continue;
    if (!(p === me && me.pred)) glide(p);
    p.anim += dt;
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
// Previsão do meu herói: a mesma física do anfitrião, em passos de até 1/60 s
function predictMe(w, p, dt) {
  const n = Math.max(1, Math.ceil(dt / STEP - 0.01)), sd = dt / n, hits = p.inp.h;
  for (let i = 0; i < n; i++) {
    if (p.drop > 0) p.drop -= sd;
    if (p.landT > 0) p.landT -= sd;
    if (p.flipT > 0) p.flipT -= sd;
    bodyStep(w, sd, p, true, 'pred');
    p.inp.h = 0;                                  // um toque vale só uma vez
  }
  p.inp.h = hits;
  p.nx = p.x; p.ny = p.y;
}
// Manda comandos e a posição prevista: na hora quando muda algo; 30x/s andando; 10x/s parado.
// Toques (pulo, golpe) vão pelo canal confiável, para nenhum se perder; o resto pelo rápido.
function sendInput(w, dt) {
  const p = w.p, c = readLocalCtl(w, p, Net.ctl), L = Net.last;
  Net.sendT -= dt;
  const changed = !L || c.d !== L.d || c.h || c.am !== L.am || c.af !== L.af || Math.abs(c.ad - L.ad) > 2;
  if (!changed && Net.sendT > 0) return;
  const pr = p.pred && !p.dead, moving = pr && (Math.abs(p.vx) > 1 || Math.abs(p.vy) > 1 || !p.ground);
  const m = { t: 'in', s: ++Net.inSeq, d: c.d, h: c.h, am: c.am, ad: Math.round(c.ad), af: c.af };
  if (pr) m.b = [p.ep, encV(p.x), encV(p.y), encV(p.vx), encV(p.vy), p.face, (p.ground ? 1 : 0) | (p.crouch ? 2 : 0) | (p.glide ? 4 : 0), p.jumps | 0, encV(Math.max(0, p.flipT)), encV(Math.max(0, p.drop))];
  if (c.h) send(Net.conn, m); else sendFast(Net.conn, m);
  Net.last = { d: c.d, am: c.am, ad: c.ad, af: c.af }; Net.sendT = moving ? 1 / 30 : 0.1;
}

// ---------- Sair ----------
// msg: motivo mostrado na tela de multiplayer (sem msg, volta ao título)
function leaveRoom(msg) {
  if (Net.role) {
    if (Net.role === 'client') send(Net.conn, { t: 'bye' }); else broadcast({ t: 'bye' });
    Net.timers.forEach(clearInterval);
    const peer = Net.peer;
    setTimeout(() => { try { peer.destroy(); } catch (e) {} }, 300);   // dá tempo do "tchau" chegar
    Object.assign(Net, { role: null, peer: null, conns: [], conn: null, code: '', pid: 0, roster: [], inLevel: false, ev: [], timers: [], ping: 0, link: '' });
    Chat.clear();
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
// ---------- Mini-chat ----------
const cleanChat = s => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80);
// Aviso do jogo (só o anfitrião gera; todos veem)
Net.sys = text => { if (Net.role !== 'host') return; text = cleanChat(text); Chat.add({ sys: true, text }); broadcast({ t: 'sys', text }); };
// Mensagem digitada por este jogador
Net.chat = text => {
  text = cleanChat(text);
  if (!text || !Net.role) return;
  const now = performance.now();
  if (now - Net.chatT < 400) return;
  Net.chatT = now;
  Chat.add({ id: Net.pid, text });
  if (Net.role === 'host') broadcast({ t: 'chat', id: 0, text }); else send(Net.conn, { t: 'chat', text });
};
// O convidado mudou a evolução (tela de Evolução) ou o herói: avisa o anfitrião
Net.sendBuild = () => { if (Net.role === 'client') send(Net.conn, { t: 'build', b: myBuild() }); };
// Este jogador trocou de roupa no meio da fase
Net.sendChar = ch => {
  if (Net.role === 'client') send(Net.conn, { t: 'char', ch });
  else if (Net.role === 'host' && Net.roster[0]) { Net.roster[0].ch = ch; rosterChanged(); }
};
