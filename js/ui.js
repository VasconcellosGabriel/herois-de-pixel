'use strict';
// ---------- Personagens prontos ----------
const DEFAULT_CHAR = {
  name: 'Herói', cls: 'guerreiro', elem: 0, height: 1, build: 1, skin: '#f1c27d', face: 2, eyes: '#2b6cb0',
  hair: 1, hairColor: '#5a3825', outfit: 0, primary: '#3b6fd6', secondary: '#8a5a2b',
  head: 0, headColor: '#9aa5b1', cape: 0, capeColor: '#c0392b', acc: 0, accent: '#ffd23f', weaponColor: '#cfd8e3',
};
const PRESETS = [
  { ...DEFAULT_CHAR, name: 'Sir Aço', build: 2, height: 2, face: 1, outfit: 1, head: 2, cape: 2, skin: '#e0ac69' },
  { ...DEFAULT_CHAR, name: 'Aurora', cls: 'mago', elem: 1, height: 0, build: 0, skin: '#ffe0c8', hair: 3, hairColor: '#e8e8ff', eyes: '#9b59b6', outfit: 2, primary: '#8e44ad', secondary: '#f2a900', head: 1, headColor: '#6d3fb8', accent: '#6fd8ff', weaponColor: '#8a5a2b' },
  { ...DEFAULT_CHAR, name: 'Robin', cls: 'arqueiro', skin: '#c68642', hair: 2, hairColor: '#d9a441', eyes: '#2f9e44', outfit: 3, primary: '#2e9c5a', secondary: '#5c3a1e', head: 7, headColor: '#2e9c5a', cape: 1, capeColor: '#1f6b3c', weaponColor: '#8a5a2b', accent: '#ff4d6d' },
  { ...DEFAULT_CHAR, name: 'Kuro', skin: '#8d5524', face: 4, hair: 5, hairColor: '#c0392b', eyes: '#e63946', outfit: 3, primary: '#222831', secondary: '#c0392b', acc: 2, build: 2 },
  { ...DEFAULT_CHAR, name: 'Merlina', cls: 'mago', elem: 2, height: 0, hair: 4, hairColor: '#e86ab0', skin: '#ffe0c8', eyes: '#16a8a8', outfit: 2, primary: '#16a8a8', secondary: '#e8e8e8', head: 6, accent: '#7bff9a', weaponColor: '#e8e0c8' },
  { ...DEFAULT_CHAR, name: 'Ignis', cls: 'dragonico', build: 2, height: 2, skin: '#c0392b', face: 1, hair: 0, eyes: '#ffd23f', outfit: 1, primary: '#5a3a3a', secondary: '#2a2028', head: 0, acc: 0, accent: '#ffd23f', weaponColor: '#9aa5b1' },
  { ...DEFAULT_CHAR, name: 'Rex', cls: 'arqueiro', skin: '#9be29b', build: 0, height: 2, face: 3, hair: 0, eyes: '#f2a900', outfit: 0, primary: '#ff8a1f', secondary: '#5c3a1e', head: 5, headColor: '#8a5a2b', acc: 5, capeColor: '#8a5a2b', weaponColor: '#b87333' },
];
const PAL = {
  skin: ['#ffe0c8', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e', '#9be29b', '#a0c4ff', '#d9b3ff', '#f5a3a3'],
  hair: ['#1b1b1b', '#5a3825', '#8a5a2b', '#d9a441', '#f2e07a', '#e8e8ff', '#c0392b', '#e86ab0', '#3b82f6', '#34d399', '#9b59b6', '#ff8a1f'],
  cloth: ['#3b6fd6', '#c0392b', '#2e9c5a', '#f2a900', '#8e44ad', '#222831', '#e8e8e8', '#e86ab0', '#16a8a8', '#8a5a2b', '#ff8a1f', '#5c3a1e'],
  eyes: ['#2b6cb0', '#2f9e44', '#6b4423', '#222222', '#9b59b6', '#e63946', '#f2a900', '#16a8a8'],
  metal: ['#cfd8e3', '#ffd23f', '#b87333', '#9aa5b1', '#6b4423', '#8a5a2b', '#e8e0c8', '#7bd3ff'],
  accent: ['#ffd23f', '#ff4d6d', '#4aa3ff', '#7bff9a', '#c77dff', '#ff8a1f', '#ffffff', '#2ee6d6'],
};
const TABS = [
  { id: 'classe', label: 'Classe', fields: [
    { type: 'class' },
    { k: 'elem', type: 'choice', label: 'Elemento da magia (tecla J)', opts: ELEMENTS.map(e => e.icon + ' ' + e.name), when: c => c.cls === 'mago' },
  ] },
  { id: 'corpo', label: 'Corpo', fields: [
    { k: 'height', label: 'Altura', type: 'choice', opts: OPTS.heights },
    { k: 'build', label: 'Porte', type: 'choice', opts: OPTS.builds },
    { k: 'skin', label: 'Pele', type: 'color', pal: 'skin' },
    { k: 'face', label: 'Expressão', type: 'choice', opts: OPTS.faces },
    { k: 'eyes', label: 'Cor dos olhos', type: 'color', pal: 'eyes' },
  ] },
  { id: 'cabelo', label: 'Cabelo', fields: [
    { k: 'hair', label: 'Estilo', type: 'choice', opts: OPTS.hairs },
    { k: 'hairColor', label: 'Cor do cabelo', type: 'color', pal: 'hair' },
  ] },
  { id: 'roupa', label: 'Roupa', fields: [
    { k: 'outfit', label: 'Estilo', type: 'choice', opts: OPTS.outfits },
    { k: 'primary', label: 'Cor principal', type: 'color', pal: 'cloth' },
    { k: 'secondary', label: 'Cor secundária', type: 'color', pal: 'cloth' },
  ] },
  { id: 'extras', label: 'Extras', fields: [
    { k: 'head', label: 'Chapéu / elmo', type: 'choice', opts: OPTS.heads },
    { k: 'headColor', label: 'Cor do chapéu', type: 'color', pal: 'cloth', when: c => c.head > 0 },
    { k: 'cape', label: 'Capa', type: 'choice', opts: OPTS.capes },
    { k: 'capeColor', label: 'Cor da capa', type: 'color', pal: 'cloth', when: c => c.cape > 0 },
    { k: 'acc', label: 'Acessório', type: 'choice', opts: OPTS.accs },
  ] },
  { id: 'equip', label: 'Equipamento', fields: [
    { k: 'weaponColor', label: 'Cor da arma', type: 'color', pal: 'metal' },
    { k: 'accent', label: 'Cor da joia / magia', type: 'color', pal: 'accent' },
  ] },
];
const POSE_LIST = {
  guerreiro: [['Parado', 'idle'], ['Correr', 'run'], ['Espada', 'atk'], ['Lança', 'cast'], ['Escudo', 'block']],
  mago: [['Parado', 'idle'], ['Correr', 'run'], ['Magia', 'cast'], ['Pulo', 'jump']],
  arqueiro: [['Parado', 'idle'], ['Correr', 'run'], ['Mirar', 'aim', 6], ['Mirar p/ cima', 'aim', 2], ['Rolar', 'roll']],
  dragonico: [['Parado', 'idle'], ['Correr', 'run'], ['Garras', 'atk'], ['Sopro', 'cast'], ['Planar', 'glide'], ['Mergulho', 'dash']],
};

// ---------- Utilidades de UI ----------
let bannerTimer = null;
function banner(title, sub = '', ms = 2200) {
  const b = $('#banner');
  $('b', b).textContent = title; $('span', b).textContent = sub;
  b.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.remove('show'), ms);
}
function show(name) {
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === 's-' + name));
  document.body.classList.toggle('playing', name === null);
}
function hideScreens() { show(null); }
const click = (id, fn) => $(id).addEventListener('click', () => { Snd.init(); Snd.sfx('click'); fn(); });

function updateSoundLabels() {
  const t = Snd.muted ? '🔇 Som: desligado' : '🔊 Som: ligado';
  $('#b-sound').textContent = t; $('#b-sound2').textContent = t;
}
function toggleSound() {
  Snd.setMuted(!Snd.muted); Game.save.mute = Snd.muted; persist(); updateSoundLabels();
  if (!Snd.muted) Snd.init();
}

// ---------- Fluxo ----------
function goTitle() { Net.toLobby(); Game.mode = 'menu'; Input.enabled = false; Snd.music('menu'); show('title'); }
function goLevels() {
  Net.toLobby();
  Game.mode = 'menu'; Input.enabled = false;
  const list = $('#lv-list'); list.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const b = document.createElement('button'), best = Game.save.best[lv.id], locked = i + 1 > Game.save.unlocked;
    b.className = 'lv'; b.disabled = locked;
    const stars = best ? '★'.repeat(best.stars) + '<i>' + '★'.repeat(3 - best.stars) + '</i>' : '<i>★★★</i>';
    b.innerHTML = `<span class="n">${lv.boss ? '☠' : i + 1}</span><span class="t">${lv.name}<br><small>${locked ? '🔒 Complete a fase anterior' : best ? 'Moedas: ' + best.coins : lv.boss ? 'Chefe final' : 'Nova!'}</small></span><span class="st">${stars}</span>`;
    b.addEventListener('click', () => { Snd.init(); Snd.sfx('click'); beginLevel(i); });
    list.appendChild(b);
  });
  show('levels');
}
function beginLevel(i) {
  if (Net.role === 'client') return;                 // no multiplayer quem escolhe a fase é o anfitrião
  if (!Game.save.char) { openCreator(); return; }
  hideScreens();
  if (Net.role === 'host') { Net.roster[0].ch = Game.save.char; startLevel(i, Net.roster, 0); }
  else startLevel(i);
  goFullscreen();
}
// No celular: tela cheia e na horizontal (só funciona logo depois de um toque)
function goFullscreen() {
  if (!document.body.classList.contains('touch')) return;
  try { if (!document.fullscreenElement) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) {}
  try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
}
// r: { idx, coins, deaths, secs, stars }
function showWin(r) {
  const last = r.idx >= LEVELS.length - 1, guest = Net.role === 'client';
  $('#win-title').textContent = last ? '🏆 VITÓRIA! 🏆' : 'FASE COMPLETA!';
  $('#win-stars').innerHTML = '★'.repeat(r.stars) + '<i>' + '★'.repeat(3 - r.stars) + '</i>';
  const m = Math.floor(r.secs / 60), s = String(r.secs % 60).padStart(2, '0');
  $('#win-stats').innerHTML = `Moedas: ${r.coins}<br>Quedas: ${r.deaths}<br>Tempo: ${m}:${s}` + (last ? `<br><br>${Net.role ? 'Vocês derrotaram' : 'Você derrotou'} o Rei Golem!<br>Mais fases em breve...` : '');
  $('#b-next').style.display = last || guest ? 'none' : '';
  $('#b-retry').style.display = $('#b-win-menu').style.display = guest ? 'none' : '';
  $('#win-wait').style.display = $('#b-win-leave').style.display = guest ? '' : 'none';
  show('win');
}
function pauseGame() {
  if (Game.mode !== 'play') return;
  Game.mode = 'pause'; Input.enabled = false; Input.clear(); updateSoundLabels();
  $('#pause-mp').style.display = Net.role ? '' : 'none';
  $('#b-restart').style.display = Net.role === 'client' ? 'none' : '';
  $('#b-quit').textContent = Net.role === 'client' ? 'Sair da sala' : 'Sair para o menu';
  show('pause');
}
function resumeGame() { if (Game.mode !== 'pause') return; hideScreens(); Game.mode = 'play'; Input.enabled = true; Input.clear(); }

// ---------- Botões de toque ----------
function setupTouch(p) {
  const sk = p.cls.skills.map(s => s.icon);
  if (p.cls.id === 'mago') sk[0] = ELEMENTS[p.ch.elem || 0].icon;
  ['a', 'b', 'c'].forEach((k, i) => { $('#tb-' + k).textContent = sk[i]; });
}

// ---------- Criador de personagem ----------
const Creator = { ch: null, tab: 'classe', pose: 0, spr: null, t: 0, from: 'title' };

function openCreator(from = 'title') {
  Game.mode = 'creator'; Input.enabled = false; Creator.from = from;
  Creator.ch = { ...(Game.save.char || DEFAULT_CHAR) };
  Creator.tab = 'classe'; Creator.pose = 0;
  $('#cr-name').value = Creator.ch.name;
  renderTabs(); renderPanel(); renderPoses(); renderPresets(); rebuildPreview();
  Snd.music('menu');
  show('creator');
}
function rebuildPreview() { Creator.spr = buildPlayerSprites(Creator.ch); }
function renderTabs() {
  const el = $('#cr-tabs'); el.innerHTML = '';
  TABS.forEach(t => {
    const b = document.createElement('button');
    b.className = 'tab' + (t.id === Creator.tab ? ' on' : ''); b.textContent = t.label;
    b.onclick = () => { Creator.tab = t.id; Snd.sfx('click'); renderTabs(); renderPanel(); };
    el.appendChild(b);
  });
}
function renderPoses() {
  const el = $('#pv-pose'); el.innerHTML = '';
  const list = POSE_LIST[Creator.ch.cls];
  if (Creator.pose >= list.length) Creator.pose = 0;
  list.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'chip' + (i === Creator.pose ? ' on' : ''); b.textContent = p[0];
    b.onclick = () => { Creator.pose = i; renderPoses(); };
    el.appendChild(b);
  });
}
function renderPresets() {
  const el = $('#presets'); el.innerHTML = '';
  PRESETS.forEach(p => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = p.name; b.title = 'Usar personagem pronto';
    b.onclick = () => { Creator.ch = { ...p }; $('#cr-name').value = p.name; changed(true); };
    el.appendChild(b);
  });
}
function changed(full) {
  rebuildPreview();
  if (full) { renderPanel(); renderPoses(); }
}
function renderPanel() {
  const el = $('#cr-panel'), tab = TABS.find(t => t.id === Creator.tab), ch = Creator.ch;
  el.innerHTML = '';
  for (const f of tab.fields) {
    if (f.when && !f.when(ch)) continue;
    const box = document.createElement('div'); box.className = 'fld';
    if (f.type === 'class') {
      const grid = document.createElement('div'); grid.className = 'cls';
      for (const id in CLASSES) {
        const c = CLASSES[id], b = document.createElement('button');
        b.className = 'card' + (ch.cls === id ? ' on' : '');
        const hp = '❤'.repeat(c.hp) + (c.mana ? ' · mana' : '');
        b.innerHTML = `<h3>${c.icon} ${c.name}</h3><p>${c.desc}<br>${hp}</p><ul>${c.skills.map(s => `<li><b>${s.key}</b> ${s.name}<span>${s.desc}</span></li>`).join('')}</ul>`;
        b.onclick = () => { ch.cls = id; Snd.sfx('click'); changed(true); };
        grid.appendChild(b);
      }
      box.appendChild(grid);
    } else if (f.type === 'choice') {
      box.innerHTML = `<label>${f.label}</label>`;
      const chips = document.createElement('div'); chips.className = 'chips';
      f.opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.className = 'chip' + (ch[f.k] === i ? ' on' : ''); b.textContent = o;
        b.onclick = () => { ch[f.k] = i; Snd.sfx('click'); changed(true); };
        chips.appendChild(b);
      });
      box.appendChild(chips);
    } else {
      box.innerHTML = `<label>${f.label}</label>`;
      const sw = document.createElement('div'); sw.className = 'sw';
      const input = document.createElement('input'); input.type = 'color'; input.value = ch[f.k];
      const btns = [];
      PAL[f.pal].forEach(c => {
        const b = document.createElement('button');
        b.style.background = c; b.className = ch[f.k].toLowerCase() === c ? 'on' : ''; b.title = c;
        b.onclick = () => { ch[f.k] = c; input.value = c; btns.forEach(x => x.classList.toggle('on', x === b)); changed(false); };
        btns.push(b); sw.appendChild(b);
      });
      input.oninput = () => { ch[f.k] = input.value; btns.forEach(x => x.classList.remove('on')); changed(false); };
      sw.appendChild(input); box.appendChild(sw);
    }
    el.appendChild(box);
  }
}
function randomChar() {
  const pick = a => a[(Math.random() * a.length) | 0], ri = n => (Math.random() * n) | 0;
  const c = Creator.ch;
  Object.assign(c, {
    elem: ri(3), height: ri(3), build: ri(3), skin: pick(PAL.skin), face: ri(OPTS.faces.length), eyes: pick(PAL.eyes),
    hair: ri(OPTS.hairs.length), hairColor: pick(PAL.hair), outfit: ri(OPTS.outfits.length), primary: pick(PAL.cloth), secondary: pick(PAL.cloth),
    head: Math.random() < 0.5 ? 0 : 1 + ri(OPTS.heads.length - 1), headColor: pick(PAL.cloth), cape: ri(3), capeColor: pick(PAL.cloth),
    acc: Math.random() < 0.5 ? 0 : 1 + ri(OPTS.accs.length - 1), weaponColor: pick(PAL.metal), accent: pick(PAL.accent),
  });
  changed(true);
}
function drawPreview(t) {
  const c = $('#pv'), g = c.getContext('2d');
  g.clearRect(0, 0, 96, 96);
  const [, pose, fixed] = POSE_LIST[Creator.ch.cls][Creator.pose] || ['', 'idle'];
  const n = POSES[pose];
  let f = fixed !== undefined ? fixed : 0;
  if (fixed === undefined) {
    if (pose === 'idle') f = Math.floor(t * 3.5) % 4;
    else if (pose === 'run') f = Math.floor(t * 14) % 8;
    else if (pose === 'atk') f = Math.floor(t * 6) % 4;
    else if (pose === 'cast') f = 1 + Math.floor(t * 3) % 2;
    else if (pose === 'jump') f = Math.floor(t * 2) % 3;
    else if (pose === 'roll' || pose === 'flip') f = Math.floor(t * 16) % 4;
    else if (pose === 'glide') f = Math.floor(t * 6) % 2;
  }
  g.drawImage(Creator.spr.get(pose, f % n), 0, 0);
}
function saveCharacter() {
  Creator.ch.name = ($('#cr-name').value.trim() || 'Herói').slice(0, 14);
  Game.save.char = { ...Creator.ch }; persist();
  Game.titleSpr = null;
  if (Creator.from === 'mp') openMp(); else goLevels();
}

// ---------- Tela de multiplayer ----------
function openMp(msg = '') {
  Game.mode = 'menu'; Input.enabled = false;
  if (Net.role) { openRoom(); return; }
  const ch = Game.save.char || DEFAULT_CHAR;
  $('#mp-hero').textContent = `Seu herói: ${ch.name} (${CLASSES[ch.cls].icon} ${CLASSES[ch.cls].name})`;
  $('#mp-msg').textContent = msg;
  const invited = cleanCode(new URLSearchParams(location.search).get('sala'));
  if (invited && !$('#mp-code').value) $('#mp-code').value = invited;
  $('#mp-home').hidden = false; $('#mp-room').hidden = true;
  setMpBusy(false);
  show('mp');
}
function openRoom() { $('#mp-home').hidden = true; $('#mp-room').hidden = false; renderRoom(); show('mp'); }
function setMpBusy(busy, msg) {
  for (const id of ['#b-mp-host', '#b-mp-join', '#b-mp-hero', '#b-mp-back']) $(id).disabled = busy;
  if (msg !== undefined) $('#mp-msg').textContent = msg;
}
function renderRoom() {
  if (!Net.role) return;
  const host = Net.role === 'host';
  $('#mp-codeview').textContent = Net.code;
  const list = $('#mp-players'); list.innerHTML = '';
  for (const r of Net.roster) {
    const c = CLASSES[r.ch.cls] || CLASSES.guerreiro, row = document.createElement('div'), tag = document.createElement('small');
    row.className = 'mp-p';
    row.textContent = `${c.icon} ${r.ch.name}`;
    tag.textContent = [r.id === 0 ? '👑 anfitrião' : '', r.id === Net.pid ? 'você' : ''].filter(Boolean).join(' · ');
    row.appendChild(tag); list.appendChild(row);
  }
  $('#mp-invite').style.display = host ? '' : 'none';
  $('#b-mp-start').style.display = host ? '' : 'none';
  $('#mp-status').textContent = host
    ? (Net.roster.length < 2 ? 'Mande o código ou o link para os amigos. Quando entrarem, escolha a fase.' : `${Net.roster.length}/${MAX_PLAYERS} jogadores. Tudo pronto!`)
    : 'Aguardando o anfitrião escolher a fase...';
}
async function mpHost() {
  if (!Game.save.char) { Game.save.char = { ...DEFAULT_CHAR }; persist(); }
  setMpBusy(true, 'Criando sala...');
  try { await hostRoom(); openRoom(); }
  catch (e) { leaveRoom(e.message || String(e)); }
}
async function mpJoin() {
  const code = cleanCode($('#mp-code').value);
  if (code.length !== CODE_LEN) { $('#mp-msg').textContent = `O código tem ${CODE_LEN} letras/números.`; return; }
  if (!Game.save.char) { Game.save.char = { ...DEFAULT_CHAR }; persist(); }
  goFullscreen();
  setMpBusy(true, 'Conectando...');
  try { await joinRoom(code); if (!Net.inLevel) openRoom(); }
  catch (e) { leaveRoom(e.message || String(e)); }
}
async function mpShare() {
  const url = inviteLink(Net.code);
  if (navigator.share) { try { await navigator.share({ title: 'Heróis de Pixel', text: `Bora jogar Heróis de Pixel! Sala ${Net.code}`, url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  mpCopy();
}
async function mpCopy() {
  const url = inviteLink(Net.code);
  try { await navigator.clipboard.writeText(url); $('#mp-status').textContent = 'Link copiado! Cole no WhatsApp/Discord.'; }
  catch (e) { prompt('Copie o link do convite:', url); }
}

// ---------- Tela de controles ----------
let ctlFrom = 'title';
function saveBinds() { Game.save.binds = { keys: Binds.keys, mouse: Binds.mouse }; persist(); }
function openControls(from) {
  ctlFrom = from; Game.mode = 'menu'; Input.enabled = false; Input.capture = null;
  renderControls(); show('controls');
}
function renderControls(msg) {
  $('#ctl-msg').textContent = msg || 'Clique em uma tecla e pressione a nova. Esc cancela, Backspace limpa.';
  const pr = $('#ctl-presets'); pr.innerHTML = '';
  for (const id in BIND_PRESETS) {
    const b = document.createElement('button'); b.className = 'btn small'; b.textContent = BIND_PRESETS[id].label;
    b.onclick = () => { setBinds(JSON.parse(JSON.stringify({ keys: BIND_PRESETS[id].keys, mouse: BIND_PRESETS[id].mouse }))); saveBinds(); Snd.sfx('click'); renderControls('Esquema aplicado!'); };
    pr.appendChild(b);
  }
  const list = $('#ctl-list'); list.innerHTML = '';
  const head = document.createElement('div'); head.className = 'ctl-row'; head.style.background = 'none'; head.style.border = 'none';
  head.innerHTML = '<span></span><span style="color:var(--mute)">Principal</span><span style="color:var(--mute)">Alternativa</span>'; list.appendChild(head);
  for (const [act, label] of ACTIONS) {
    const row = document.createElement('div'); row.className = 'ctl-row';
    row.innerHTML = '<span>' + label + '</span>';
    [0, 1].forEach(slot => {
      const b = document.createElement('button'); b.className = 'kb'; b.textContent = keyName(Binds.keys[act][slot]);
      b.onclick = () => {
        $$('#ctl-list .kb').forEach(x => x.classList.remove('wait'));
        b.classList.add('wait'); b.textContent = 'pressione...';
        Input.capture = code => {
          if (code === 'Escape') { renderControls(); return; }
          const nk = Binds.keys[act].slice();
          nk[slot] = code === 'Backspace' ? '' : code;
          if (code !== 'Backspace') for (const [o] of ACTIONS) if (o !== act) Binds.keys[o] = Binds.keys[o].map(c => c === code ? '' : c);   // tecla não pode servir a duas ações
          Binds.keys[act] = nk; setBinds({ keys: Binds.keys, mouse: Binds.mouse }); saveBinds(); Snd.sfx('click'); renderControls();
        };
      };
      row.appendChild(b);
    });
    list.appendChild(row);
  }
  const ml = $('#ctl-mouse'); ml.innerHTML = '';
  const OPT = [['a', 'Habilidade 1'], ['b', 'Habilidade 2'], ['c', 'Habilidade 3'], ['', 'Nenhuma']];
  for (const [btn, label] of [[0, 'Botão esquerdo'], [2, 'Botão direito'], [1, 'Botão do meio (roda)']]) {
    const row = document.createElement('div'); row.className = 'ctl-row m'; row.innerHTML = '<span>' + label + '</span>';
    const b = document.createElement('button'); b.className = 'kb'; b.textContent = (OPT.find(o => o[0] === (Binds.mouse[btn] || '')) || OPT[3])[1];
    b.onclick = () => {
      const cur = OPT.findIndex(o => o[0] === (Binds.mouse[btn] || '')), nx = OPT[(cur + 1) % OPT.length][0];
      Binds.mouse[btn] = nx; saveBinds(); Snd.sfx('click'); renderControls();
    };
    row.appendChild(b); ml.appendChild(row);
  }
}

// ---------- Ligações ----------
click('#b-play', () => { if (Game.save.char) goLevels(); else openCreator(); });
click('#b-create', () => openCreator());
click('#b-mp', () => openMp());
click('#b-mp-host', mpHost);
click('#b-mp-join', mpJoin);
click('#b-mp-hero', () => openCreator('mp'));
click('#b-mp-back', goTitle);
click('#b-mp-share', mpShare);
click('#b-mp-copy', mpCopy);
click('#b-mp-start', goLevels);
click('#b-mp-leave', () => leaveRoom());
click('#b-win-leave', () => leaveRoom());
$('#mp-code').addEventListener('keydown', e => { if (e.key === 'Enter') mpJoin(); });
$('#mp-code').addEventListener('input', e => { e.target.value = cleanCode(e.target.value); });
click('#b-sound', toggleSound);
click('#b-controls', () => openControls('title'));
click('#b-controls2', () => openControls('pause'));
click('#b-ctl-back', () => { Input.capture = null; if (ctlFrom === 'pause' && Game.world) { Game.mode = 'pause'; show('pause'); } else goTitle(); });
click('#b-ctl-reset', () => { setBinds(null); saveBinds(); renderControls('Controles restaurados.'); });
click('#b-sound2', toggleSound);
click('#b-lv-back', () => { if (Net.role === 'host') openRoom(); else goTitle(); });
click('#b-random', randomChar);
click('#b-cr-back', () => { if (Creator.from === 'mp') openMp(); else goTitle(); });
click('#b-cr-done', saveCharacter);
click('#b-next', () => beginLevel(Game.world.idx + 1));
click('#b-retry', () => beginLevel(Game.world.idx));
click('#b-win-menu', goLevels);
click('#b-resume', resumeGame);
click('#b-restart', () => { const i = Game.world.idx; beginLevel(i); });
click('#b-quit', () => { if (Net.role === 'client') leaveRoom(); else if (Net.role === 'host') goLevels(); else goTitle(); });
click('#b-fs', () => {
  try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {}
});
$('#cr-name').addEventListener('input', () => { Creator.ch.name = $('#cr-name').value; });
addEventListener('keydown', e => {
  if (KEYMAP[e.code] === 'pause' && Game.mode === 'pause' && !Input.capture) resumeGame();
});
addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

// ---------- Tamanho da tela ----------
function resize() {
  const iw = innerWidth, ih = innerHeight;
  let s = Math.min(iw / W, ih / H);
  const dpr = window.devicePixelRatio || 1;
  if (s > 1) s = Math.floor(s * 2 * dpr) / (2 * dpr);   // múltiplos inteiros da grade de alta resolução
  canvas.style.width = Math.round(W * s) + 'px';
  canvas.style.height = Math.round(H * s) + 'px';
}
addEventListener('resize', resize);
addEventListener('orientationchange', resize);

// ---------- Laço principal ----------
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now; Game.t += dt;
  // no multiplayer a pausa é só um menu por cima: o mundo continua rodando para os outros
  const live = Game.world && (Game.mode === 'play' || (Game.mode === 'pause' && Net.role));
  if (live) {
    if (Game.mode === 'play' && Input.hit('pause')) { Input.end(); pauseGame(); return; }
    if (Net.role === 'client') { Net.clientFrame(Game.world, dt); Input.end(); }
    else {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n++ < 6 && Game.world) {
        const w = Game.world;
        readLocalCtl(w, w.p); update(w, STEP); Input.end(); acc -= STEP;
        if (Net.role === 'host' && Game.world) Net.hostTick(Game.world);
      }
    }
    if (Game.world) render(Game.world);
  } else if (Game.mode === 'pause' && Game.world) {
    acc = 0; render(Game.world);
  } else if (Game.mode === 'creator') {
    renderTitle(Game.t); drawPreview(Game.t);
  } else {
    acc = 0; renderTitle(Game.t);
  }
}

// ---------- Início ----------
function boot() {
  Game.save = loadSave();
  setBinds(Game.save.binds);
  Snd.setMuted(!!Game.save.mute);
  if ('ontouchstart' in window || matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  updateSoundLabels();
  resize();
  goTitle();
  if (new URLSearchParams(location.search).get('sala')) openMp();   // abriu um link de convite
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
