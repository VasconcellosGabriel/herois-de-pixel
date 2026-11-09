'use strict';
// ---------- Multiplayer local: até 4 heróis na mesma tela ----------
// Cada jogador usa um aparelho: teclado+mouse, a tela de toque (só o jogador 1, no celular) ou um controle.
// No celular os jogadores extras precisam de controles pareados (Bluetooth). A câmera mostra o grupo todo
// e ninguém consegue sair da tela (ver leash() e camPoint() em game.js).
const Local = { on: false, slots: [], openT: 0 };   // slot: { dev: 'kb' | 'touch' | 'p<índice do controle>', pick: -1 = seu herói | índice em PRESETS }
const isTouchDev = () => document.body.classList.contains('touch');
const connectedPads = () => Object.values(Pads).filter(P => P.connected);
function devName(dev) { return dev === 'kb' ? '⌨ Teclado e mouse' : dev === 'touch' ? '📱 Tela de toque' : '🎮 Controle ' + (+dev.slice(1) + 1); }
// o jogador 1 é quem abriu a sala: no celular, a tela de toque; no PC, o controle (se estava usando) ou o teclado
function firstDev() {
  if (isTouchDev()) return 'touch';
  const pads = connectedPads();
  return Input.padOn && pads.length ? 'p' + pads[0].id : 'kb';
}
const slotChar = s => s.pick < 0 ? (Game.save.char || DEFAULT_CHAR) : PRESETS[s.pick];

function openLocal() {
  if (!Game.save.char) { Game.save.char = { ...DEFAULT_CHAR }; persist(); }
  Local.on = true; Game.mode = 'menu'; Input.enabled = false; Local.openT = performance.now();
  if (!Local.slots.length) Local.slots = [{ dev: firstDev(), pick: -1 }];
  renderLocal(); show('local');
}
function closeLocal() { Local.on = false; Local.slots = []; goTitle(); }
function localJoin(dev) {
  if (Local.slots.length >= 4 || Local.slots.some(s => s.dev === dev)) return;
  const used = new Set(Local.slots.map(s => s.pick));
  let pick = 0; while (used.has(pick) && pick < PRESETS.length - 1) pick++;
  Local.slots.push({ dev, pick }); Snd.sfx('join'); renderLocal();
}
function localLeave(i) { if (i === 0) { closeLocal(); return; } Local.slots.splice(i, 1); Snd.sfx('click'); renderLocal(); }
// troca o herói do jogador: "seu herói" (o salvo) ou um dos personagens prontos
function localCycle(i, d) {
  const s = Local.slots[i]; if (!s) return;
  const n = PRESETS.length + 1;
  s.pick = ((s.pick + 1 + d) % n + n) % n - 1;
  Snd.sfx('click'); renderLocal();
}
function localStart() {
  if (Local.slots.length < 2) { $('#lc-msg').textContent = 'Precisa de pelo menos 2 jogadores.'; Snd.sfx('no'); return; }
  goLevels();
}
// roster no formato do jogo, com o aparelho de cada herói. A evolução de cada um vem da classe (mesmo save)
function localRoster() {
  return Local.slots.map((s, i) => {
    const ch = { ...slotChar(s) }, pr = progOf(ch.cls);
    return { id: i, ch, dev: s.dev, b: i === 0 && s.pick < 0 ? myBuild() : { st: { ...pr.st }, up: { ...pr.up }, sp: 0 } };
  });
}
const _lcFaces = {};
function faceURL(ch) { const k = JSON.stringify(ch); return _lcFaces[k] || (_lcFaces[k] = buildPlayerSprites(ch).face().toDataURL()); }
function renderLocal() {
  const list = $('#lc-slots'); list.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const s = Local.slots[i], row = document.createElement('div');
    row.className = 'lc-slot' + (s ? '' : ' empty'); row.style.borderColor = LOCAL_COLS[i];
    const tag = Object.assign(document.createElement('b'), { textContent: 'P' + (i + 1) }); tag.style.color = LOCAL_COLS[i];
    row.appendChild(tag);
    if (!s) {
      row.appendChild(Object.assign(document.createElement('span'), { className: 'lc-wait', textContent: isTouchDev() ? 'Aperte A num controle para entrar' : 'Aperte A num controle (ou Enter no teclado) para entrar' }));
      list.appendChild(row); continue;
    }
    const ch = slotChar(s), cls = CLASSES[ch.cls] || CLASSES.guerreiro;
    const img = new Image(); img.src = faceURL(ch); img.alt = ''; img.className = 'lc-face'; row.appendChild(img);
    const info = document.createElement('span'); info.className = 'lc-info';
    info.append(Object.assign(document.createElement('span'), { textContent: (s.pick < 0 ? '★ ' : '') + ch.name + ' · ' + cls.icon + ' ' + cls.name }), Object.assign(document.createElement('small'), { textContent: devName(s.dev) }));
    row.appendChild(info);
    const btn = (t, title, fn) => { const b = Object.assign(document.createElement('button'), { className: 'btn small', textContent: t, title, type: 'button' }); b.onclick = () => { Snd.init(); fn(); }; row.appendChild(b); };
    btn('◀', 'Herói anterior', () => localCycle(i, -1)); btn('▶', 'Próximo herói', () => localCycle(i, 1));
    if (i > 0) btn('✕', 'Tirar jogador', () => localLeave(i));
    list.appendChild(row);
  }
  const pads = connectedPads().length;
  $('#lc-msg').textContent = isTouchDev() && !pads ? 'No celular, pareie um controle (Bluetooth) para cada jogador extra e aperte A nele.'
    : pads ? `${pads} controle${pads > 1 ? 's' : ''} conectado${pads > 1 ? 's' : ''}. Cada um aperta A para entrar.` : 'Nenhum controle conectado: ligue por USB ou Bluetooth e aperte um botão.';
  $('#b-lc-start').disabled = Local.slots.length < 2;
}
// Sala aberta: cada controle entra (A), troca de herói (◀ ▶), sai (B); o jogador 1 começa (Start)
function localTick() {
  if (!$('#s-local').classList.contains('on') || performance.now() - Local.openT < 250) return;
  for (const P of connectedPads()) {
    const dev = 'p' + P.id, i = Local.slots.findIndex(s => s.dev === dev), E = P.edge || {};
    if (i < 0) { if (E.ok || E.start) localJoin(dev); continue; }
    if (E.left) localCycle(i, -1); else if (E.right) localCycle(i, 1);
    else if (E.back) localLeave(i);
    else if (i === 0 && (E.start || E.ok)) localStart();
  }
  const n = connectedPads().length;
  if (localTick.pads !== n) { localTick.pads = n; renderLocal(); }
}
addEventListener('keydown', e => {
  if (!$('#s-local').classList.contains('on') || e.target.tagName === 'INPUT') return;
  const i = Local.slots.findIndex(s => s.dev === 'kb');
  if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); if (i < 0) localJoin('kb'); else if (i === 0) localStart(); }
  else if (i >= 0 && (e.code === 'ArrowLeft' || e.code === 'KeyA')) localCycle(i, -1);
  else if (i >= 0 && (e.code === 'ArrowRight' || e.code === 'KeyD')) localCycle(i, 1);
  else if (e.code === 'Escape' || e.code === 'Backspace') { e.preventDefault(); if (i > 0) localLeave(i); else closeLocal(); }
});
addEventListener('gamepaddisconnected', () => { if ($('#s-local').classList.contains('on')) renderLocal(); });

// ---------- Comandos de cada herói ----------
// Multiplayer local: cada herói lê só o próprio aparelho (no modo normal, readLocalCtl junta tudo)
function readDevCtl(w, p, c = p.inp) {
  let d = 0, h = 0;
  const dev = p.dev;
  if (dev === 'kb' || dev === 'touch') {
    const held = dev === 'kb' ? Input.kb : Input.touch, hits = dev === 'kb' ? Input.hitKb : Input.hitTouch;
    for (const k of CTL_KEYS) { if (held[k]) d |= CTL_BIT[k]; if (hits[k]) h |= CTL_BIT[k]; }
    if (dev === 'touch' && Input.stick) { c.am = 'pointer'; c.af = Input.stick.x >= 0 ? 1 : -1; c.ad = Math.atan2(Input.stick.y, Math.max(0.05, Math.abs(Input.stick.x))) * 180 / Math.PI; }
    else if (dev === 'kb' && Input.kbAim === 'pointer' && Input.aim) {
      const dx = Input.aim.x + w.cam.x - cxOf(p), dy = Input.aim.y + w.cam.y - (p.y + 8);
      c.am = 'pointer'; c.af = dx >= 0 ? 1 : -1; c.ad = Math.atan2(dy, Math.max(4, Math.abs(dx))) * 180 / Math.PI;
    } else c.am = dev === 'touch' ? 'auto' : 'keys';
  } else {
    const P = Pads[+String(dev).slice(1)];
    if (P && P.connected) {
      for (const k of CTL_KEYS) { if (P.st[k]) d |= CTL_BIT[k]; if (P.hit[k]) h |= CTL_BIT[k]; }
      if (P.aim) { c.am = 'pointer'; c.af = P.aim.x >= 0 ? 1 : -1; c.ad = Math.atan2(P.aim.y, Math.max(0.05, Math.abs(P.aim.x))) * 180 / Math.PI; }
      else c.am = 'auto';
    }
  }
  c.d = d; c.h = h;
  return c;
}
function readCtls(w) { if (w.local) for (const p of w.players) readDevCtl(w, p); else readLocalCtl(w, w.p); }

// (carregado antes do ui.js: liga os botões direto)
for (const [id, fn] of [['#b-local', openLocal], ['#b-lc-start', localStart], ['#b-lc-back', closeLocal]]) $(id).addEventListener('click', () => { Snd.init(); Snd.sfx('click'); fn(); });
