'use strict';
// ---------- Personagens prontos ----------
// O herói padrão é o Guerreiro da folha de referência das classes; os prontos são as 4 classes, masculino e feminino.
const DEFAULT_CHAR = {
  name: 'Herói', cls: 'guerreiro', elem: 0, body: 0, height: 1, build: 1, skin: '#f2c79a', face: 0, eyes: '#6b3a22',
  hair: 1, hairColor: '#d8452a', outfit: 1, primary: '#aab3c2', secondary: '#b3261e',
  head: 0, headColor: '#9aa5b1', cape: 2, capeColor: '#b3261e', acc: 0, accColor: '#c0392b', accent: '#ffd23f', weaponColor: '#dfe6f0',
};
const LOOKS = {
  guerreiro: {},
  mago: { skin: '#f6d3b0', eyes: '#6a3fb0', hair: 8, hairColor: '#cfc6ea', outfit: 2, primary: '#4a2f86', secondary: '#b9aee0', head: 1, headColor: '#4a2f86', cape: 2, capeColor: '#b8402a', accent: '#c04df0', weaponColor: '#d9a441' },
  arqueiro: { eyes: '#4a7a3a', hair: 1, hairColor: '#8a4a2a', outfit: 0, primary: '#4f7a34', secondary: '#7a4a28', head: 7, headColor: '#5a8a3a', cape: 2, capeColor: '#4f7a34', weaponColor: '#9a5a2e' },
  dragonico: { eyes: '#e0a030', hair: 2, hairColor: '#b0203a', outfit: 1, primary: '#3a2630', secondary: '#8f1f2e', cape: 0, accent: '#7a1c3c' },
};
const LOOKS_F = { guerreiro: { hair: 6 }, mago: { hair: 3, cape: 0 }, arqueiro: { hair: 9 }, dragonico: { hair: 3 } };
// visual de referência de uma classe (as cores e peças da folha), para o corpo masculino (0) ou feminino (1)
const lookOf = (cls, body = 0) => ({ ...DEFAULT_CHAR, ...LOOKS[cls], ...(body ? LOOKS_F[cls] : {}), cls, body });
const PRESETS = [
  { ...lookOf('guerreiro', 0), name: 'Sir Aço' }, { ...lookOf('guerreiro', 1), name: 'Rubi' },
  { ...lookOf('mago', 0), name: 'Orion', elem: 1 }, { ...lookOf('mago', 1), name: 'Aurora', elem: 2 },
  { ...lookOf('arqueiro', 0), name: 'Robin' }, { ...lookOf('arqueiro', 1), name: 'Flora' },
  { ...lookOf('dragonico', 0), name: 'Ignis' }, { ...lookOf('dragonico', 1), name: 'Brasa' },
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
    { k: 'elem', type: 'choice', label: 'Elemento inicial da magia (dá para trocar durante a fase)', opts: ELEMENTS.map(e => e.icon + ' ' + e.name), when: c => c.cls === 'mago' },
  ] },
  { id: 'corpo', label: 'Corpo', fields: [
    { k: 'body', label: 'Corpo', type: 'choice', opts: OPTS.bodies },
    { k: 'height', label: 'Altura', type: 'choice', opts: OPTS.heights },
    { k: 'build', label: 'Porte', type: 'choice', opts: OPTS.builds },
    { k: 'skin', label: 'Pele', type: 'color', pal: 'skin' },
    { k: 'face', label: 'Rosto (cicatrizes, barba, pintura)', type: 'choice', opts: OPTS.faces },
    { k: 'accent', label: 'Cor da pintura (a mesma da joia / magia)', type: 'color', pal: 'accent', when: c => c.face === 7 || c.face === 8 },
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
    { k: 'capeColor', label: 'Cor da capa e do lenço', type: 'color', pal: 'cloth', when: c => c.cape > 0 || c.cls === 'guerreiro' },
    { k: 'acc', label: 'Acessório', type: 'choice', opts: OPTS.accs },
    { k: 'accColor', label: 'Cor do acessório', type: 'color', pal: 'cloth', when: c => c.acc > 0 },
  ] },
  { id: 'equip', label: 'Equipamento', fields: [
    { k: 'weaponColor', label: 'Cor da arma', type: 'color', pal: 'metal' },
    { k: 'accent', label: 'Cor da joia / magia', type: 'color', pal: 'accent' },
    // herói já criado: o elemento inicial muda aqui (durante a fase, troca-se com a tecla/botão de elemento ou na pausa)
    { k: 'elem', type: 'choice', label: 'Elemento da magia (dá para trocar durante a fase)', opts: ELEMENTS.map(e => e.icon + ' ' + e.name), when: c => c.cls === 'mago' && Creator.mode === 'edit' && !Creator.wardrobe },
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
  Mapa.on = name === 'levels';
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
function goTitle() { Net.toLobby(); Local.on = false; Game.mode = 'menu'; Input.enabled = false; Snd.music('menu'); show('title'); }
function goLevels() {
  Net.toLobby();
  Game.mode = 'menu'; Input.enabled = false;
  // a seleção de fases é o mapa do mundo (js/mapa.js): o herói fica na fase escolhida e anda pela trilha até a próxima
  openMap();
  show('levels');
  mapLayout();
  const b = $$('#map-inner .map-node')[Mapa.sel];
  if (b && !document.body.classList.contains('touch')) b.focus({ preventScroll: true });   // Enter já começa; ← → escolhem
}
function beginLevel(i) {
  if (Net.role === 'client') return;                 // no multiplayer quem escolhe a fase é o anfitrião
  if (!Game.save.char) { openHeroes('play'); return; }
  Mapa.at = i; Mapa.hero = Game.save.cur;            // ao voltar ao mapa, o herói sai desta fase
  hideScreens();
  if (Net.role === 'host') { Net.roster[0].ch = Game.save.char; Net.roster[0].b = myBuild(); startLevel(i, Net.roster, 0); }
  else if (Local.on) startLevel(i, localRoster(), 0);
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
  const last = r.idx >= LEVELS.length - 1, guest = Net.role === 'client', lvd = LEVELS[r.idx], bi = lvd.boss && BOSS_INFO[lvd.boss];
  $('#win-title').textContent = last ? '🏆 VITÓRIA! 🏆' : 'FASE COMPLETA!';
  $('#win-stars').innerHTML = '★'.repeat(r.stars) + '<i>' + '★'.repeat(3 - r.stars) + '</i>';
  const m = Math.floor(r.secs / 60), s = String(r.secs % 60).padStart(2, '0');
  const pr = progOf((Game.save.char || DEFAULT_CHAR).cls);
  $('#win-stats').innerHTML = `Moedas: ${r.coins} <span class="gain">(carteira: ${Game.save.coins || 0})</span><br>XP: +${r.myXp || 0} <span class="gain">· Nível ${pr.lvl}${r.ups ? ' — SUBIU ' + r.ups + '!' : ''}</span><br>Vidas para a próxima fase: ${Game.save.lives}<br>Quedas: ${r.deaths} · Tempo: ${m}:${s}` + (bi ? `<br><br>${Net.role || Local.on ? 'Vocês derrotaram' : 'Você derrotou'} ${bi.title}!` + (last ? '<br>Você salvou o reino! Parabéns!' : `<br>Próximo: Mundo ${lvd.world + 1} · ${WORLDS[lvd.world + 1]}`) : '');
  $('#b-win-up').textContent = pr.pts ? `⬆ Evolução (${pr.pts} ponto${pr.pts > 1 ? 's' : ''}!)` : '⬆ Evolução';
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
  $('#b-chatsz').style.display = Net.role ? '' : 'none';
  elemLabel();
  show('pause');
}
// ---------- Elemento da magia do mago ----------
// Botão da pausa: mostra o elemento atual do herói deste aparelho (só para magos) e troca ao clicar
function elemLabel() {
  const p = Game.world && Game.world.p, mago = !!p && p.cls.id === 'mago', el = mago && ELEMENTS[p.elem || 0];
  $('#b-elem').style.display = mago ? '' : 'none';
  if (mago) $('#b-elem').textContent = `${el.icon} Magia: ${el.name} (trocar)`;
}
function elemButton() {
  const w = Game.world, p = w && w.p;
  if (!p || p.cls.id !== 'mago') return;
  if (Net.role === 'client') { Input.pressed.elem = true; setTimeout(elemLabel, 350); }   // quem troca é o anfitrião: vai como um toque de botão
  else { asOwner(p, () => cycleElem(w, p)); elemSync(w); elemLabel(); }
}
// Chamado a cada quadro: quando o elemento do herói deste aparelho muda (tecla, botão ou pausa), atualiza o botão de
// toque e guarda a escolha no herói salvo (menos se o jogador 1 do multiplayer local estiver com um personagem pronto)
function elemSync(w) {
  const p = w && w.p;
  if (!p || p.cls.id !== 'mago' || p.elem === undefined || w.elemSeen === p.elem) return;
  const first = w.elemSeen === undefined;
  w.elemSeen = p.elem;
  $('#tb-el').style.borderColor = ELEMENTS[p.elem].col;
  const img = $('#tb-a img'); if (img) img.src = skillIcon(p, 0).toDataURL();
  if (first) return;
  const sv = Game.save.char, own = !Local.on || (Local.slots[0] && Local.slots[0].pick < 0);
  if (own && sv && sv.cls === 'mago' && sv.elem !== p.elem) { sv.elem = p.elem; persist(); }
}
function resumeGame() { if (Game.mode !== 'pause') return; Creator.wardrobe = false; hideScreens(); Game.mode = 'play'; Input.enabled = true; Input.clear(); }

// ---------- Botões de toque ----------
// Ícone da habilidade dentro do botão, custo de mana e a recarga escurecendo o botão
function setupTouch(p) {
  ['a', 'b', 'c'].forEach((k, i) => {
    const b = $('#tb-' + k);
    b.innerHTML = '';
    const img = new Image(); img.src = skillIcon(p, i).toDataURL(); img.alt = p.cls.skills[i].name; b.appendChild(img);
    b.appendChild(Object.assign(document.createElement('i'), { className: 'cd' }));
    if (p.cost[i]) b.appendChild(Object.assign(document.createElement('small'), { textContent: p.cost[i] }));
  });
  // mago: botão que troca o elemento da magia
  const elb = $('#tb-el'); elb.hidden = p.cls.id !== 'mago'; elb.style.borderColor = p.cls.id === 'mago' ? ELEMENTS[p.elem || 0].col : '';
  // botão de agachar mostra o próprio herói agachado
  const dn = $('#touch .down');
  if (dn) { dn.innerHTML = ''; const img = new Image(); img.src = p.spr.get('crouch', 0).toDataURL(); img.alt = 'Agachar'; dn.append(img, Object.assign(document.createElement('small'), { textContent: 'AGACHAR' })); }
  // mago mira a magia (J) e o arqueiro as flechas (J e K): segure para mirar, solte para atirar
  Touch.aimKeys = new Set(p.cls.id === 'arqueiro' ? ['a', 'b'] : p.cls.id === 'mago' ? ['a'] : []);
  if (document.body.classList.contains('touch')) Input.aimMode = 'auto';
  endStick(); TouchHud.last = {};
  requestAnimationFrame(touchLayout);
}
const TouchHud = { last: {} };
function updateTouchHud(w) {
  if (!document.body.classList.contains('touch') || !w || !w.p) return;
  const p = w.p, L = TouchHud.last;
  ['a', 'b', 'c'].forEach((k, i) => {
    const h = Math.round(clamp(p.cd[k] / p.cdMax[i], 0, 1) * 100), low = !!(p.cls.mana ? p.mana < p.cost[i] : p.maxArrows && i < 2 && p.arrows < 1);
    if (L[k] !== h) { L[k] = h; const el = $('#tb-' + k + ' .cd'); if (el) el.style.height = h + '%'; }
    if (L[k + 'l'] !== low) { L[k + 'l'] = low; $('#tb-' + k).classList.toggle('low', low); }
  });
  const sp = Math.round(clamp((p.sp || 0) / SPECIAL_MAX, 0, 1) * 100);
  if (L.sp !== sp) { L.sp = sp; $('#tb-sp b').style.height = sp + '%'; $('#tb-sp').classList.toggle('ready', sp >= 100); $('#sp-fire').hidden = sp < 100; }
  // especial pronto: anel de fogo em pixels em volta do botão (mais alto em cima, como chama de verdade)
  const ft = sp >= 100 ? fireT(w.t) : -1;
  if (ft >= 0 && L.ft !== ft) {
    L.ft = ft;
    const c = $('#sp-fire'), g = c.getContext('2d'), R = 9.7;
    g.clearRect(0, 0, c.width, c.height);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const dx = x + 0.5 - 17, dy = y + 0.5 - 21, d = Math.hypot(dx, dy);
      if (d < R - 1) continue;
      const up = Math.max(0, -dy / d), v = fnoise(x * 0.42, y * 0.36 + ft) * 1.3 - (d - R) / (2.6 + 9 * up * up);
      if (v < 0.14) continue;
      g.fillStyle = SP_FIRE[v > 0.66 ? 3 : v > 0.46 ? 2 : v > 0.28 ? 1 : 0]; g.fillRect(x, y, 1, 1);
    }
  }
}

// ---------- Menus com o controle (gamepad) ----------
function padMenu(m) {
  const scr = $('.screen.on');
  if (scr && scr.id === 's-local') return;
  if (m.start && Game.mode === 'pause') { resumeGame(); return; }
  if (!scr || (!m.dir && !m.ok && !m.back && !m.h)) return;
  const items = $$('button, input, .custom', scr).filter(el => !el.disabled && el.offsetParent !== null && !el.closest('[hidden]'));
  if (!items.length) return;
  let cur = items.indexOf(document.activeElement);
  if (cur < 0) cur = items.findIndex(el => el.classList.contains('padfocus'));
  const fe = items[cur];
  if (m.h && fe && fe.type === 'range') { if (m.h > 0) fe.stepUp(); else fe.stepDown(); fe.dispatchEvent(new Event('input')); return; }
  if (m.dir) {
    const nx = items[cur < 0 ? 0 : (cur + m.dir + items.length) % items.length];
    $$('.padfocus').forEach(el => el.classList.remove('padfocus'));
    nx.classList.add('padfocus'); nx.focus({ preventScroll: true }); nx.scrollIntoView({ block: 'nearest' });
  } else if (m.ok && cur >= 0) items[cur].click();
  else if (m.back) { const b = $('[id$="-back"], #b-resume, #b-mp-leave, #b-win-menu', scr); if (b && b.offsetParent !== null) b.click(); }
}
Input.onPadMenu = padMenu;

// ---------- Criador de personagem ----------
// mode: 'new' = criando um herói novo · 'edit' = mudando a aparência de um herói salvo (a classe fica)
const Creator = { ch: null, tab: 'classe', pose: 0, spr: null, t: 0, from: 'title', wardrobe: false, mode: 'new' };
// classe e elemento travados: trocando de roupa na pausa ou editando um herói que já tem evolução
const crLocked = () => Creator.wardrobe || Creator.mode === 'edit';

// Trocar de roupa no meio da campanha (menu de pausa): muda só a aparência; a classe e o elemento ficam
function openWardrobe() {
  const w = Game.world; if (!w) return;
  Creator.from = 'pause'; Creator.wardrobe = true;
  Creator.ch = { ...DEFAULT_CHAR, ...w.p.ch };
  Creator.tab = 'roupa'; Creator.pose = 0;
  $('#cr-name').value = Creator.ch.name;
  renderTabs(); renderPanel(); renderPoses(); renderPresets(); rebuildPreview();
  show('creator');                                  // o jogo continua pausado (no multiplayer, rodando)
}
function applyWardrobe() {
  const w = Game.world, p = w && w.p, ch = { ...Creator.ch, cls: p.cls.id, elem: p.ch.elem };
  // o herói salvo também muda (menos no multiplayer local, se o jogador 1 estiver com um personagem pronto)
  if (!Local.on || (Local.slots[0] && Local.slots[0].pick < 0)) { Game.save.char = { ...ch }; persist(); Game.titleSpr = null; }
  p.ch = ch; p.chKey = JSON.stringify(ch); p.spr = buildPlayerSprites(ch); setupTouch(p);
  if (Net.role) Net.sendChar(ch);
  Creator.wardrobe = false;
  banner('Visual novo!', '', 1200); show('pause');
}
function openCreator(mode = 'new', from = 'play') {
  Game.mode = 'creator'; Input.enabled = false; Creator.from = from; Creator.wardrobe = false; Creator.mode = mode;
  const sv = mode === 'edit' && Game.save.char || {};
  // heróis salvos antes da cor do acessório existir: começa com a cor que já aparecia
  const oldAcc = sv.acc === 5 ? sv.secondary : sv.acc === 3 ? sv.accent : sv.acc === 1 ? '#14101a' : sv.acc === 2 ? '#16121c' : undefined;
  Creator.ch = { ...DEFAULT_CHAR, ...(sv.accColor || !oldAcc ? {} : { accColor: oldAcc }), ...sv };
  Creator.tab = mode === 'edit' ? 'corpo' : 'classe'; Creator.pose = 0;
  $('#cr-name').value = mode === 'edit' ? Creator.ch.name : '';
  renderTabs(); renderPanel(); renderPoses(); renderPresets(); rebuildPreview();
  Snd.music('menu');
  show('creator');
}
function rebuildPreview() { Creator.spr = buildPlayerSprites(Creator.ch); }
function renderTabs() {
  const el = $('#cr-tabs'); el.innerHTML = '';
  TABS.forEach(t => {
    if (crLocked() && t.id === 'classe') return;
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
    b.onclick = () => { Creator.ch = crLocked() ? { ...p, cls: Creator.ch.cls, elem: Creator.ch.elem } : { ...p }; $('#cr-name').value = p.name; changed(true); };
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
        // trocar de classe veste o herói com o visual de referência dela (dá para mudar tudo nas outras abas)
        b.onclick = () => { Object.assign(ch, lookOf(id, ch.body | 0), { name: ch.name, elem: ch.elem, height: ch.height, build: ch.build, face: ch.face }); Snd.sfx('click'); changed(true); };
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
      const cur = String(ch[f.k] || '#ffffff').toLowerCase(), inPal = PAL[f.pal].includes(cur);
      // quadrado vazio no fim: abre o seletor para escolher exatamente a cor deste item
      const custom = document.createElement('label'); custom.className = 'custom' + (inPal ? '' : ' on'); custom.title = 'Escolher qualquer cor';
      custom.innerHTML = '+<i></i>';
      const input = document.createElement('input'); input.type = 'color'; input.value = cur;
      const mark = $('i', custom); mark.style.background = cur;
      custom.appendChild(input);
      const btns = [];
      PAL[f.pal].forEach(c => {
        const b = document.createElement('button');
        b.style.background = c; b.className = cur === c ? 'on' : ''; b.title = c;
        b.onclick = () => { ch[f.k] = c; input.value = c; btns.forEach(x => x.classList.toggle('on', x === b)); custom.classList.remove('on'); changed(false); };
        btns.push(b); sw.appendChild(b);
      });
      input.oninput = () => { ch[f.k] = input.value; mark.style.background = input.value; btns.forEach(x => x.classList.remove('on')); custom.classList.add('on'); changed(false); };
      sw.appendChild(custom); box.appendChild(sw);
    }
    el.appendChild(box);
  }
}
function randomChar() {
  const pick = a => a[(Math.random() * a.length) | 0], ri = n => (Math.random() * n) | 0;
  const c = Creator.ch;
  Object.assign(c, {
    elem: crLocked() ? c.elem : ri(3), body: ri(OPTS.bodies.length), height: ri(3), build: ri(3), skin: pick(PAL.skin), face: ri(OPTS.faces.length), eyes: pick(PAL.eyes),
    hair: ri(OPTS.hairs.length), hairColor: pick(PAL.hair), outfit: ri(OPTS.outfits.length), primary: pick(PAL.cloth), secondary: pick(PAL.cloth),
    head: Math.random() < 0.5 ? 0 : 1 + ri(OPTS.heads.length - 1), headColor: pick(PAL.cloth), cape: ri(3), capeColor: pick(PAL.cloth),
    acc: Math.random() < 0.5 ? 0 : 1 + ri(OPTS.accs.length - 1), accColor: pick(PAL.cloth), weaponColor: pick(PAL.metal), accent: pick(PAL.accent),
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
  if (Creator.wardrobe) { applyWardrobe(); return; }
  if (Creator.mode === 'edit') {
    Game.save.char = { ...Creator.ch, cls: Game.save.char.cls }; persist(); Game.titleSpr = null;
    if (upFrom === 'heroes') openHeroes(heroFrom); else openUpgrades(upFrom);
    return;
  }
  if (!addHero(Creator.ch)) { openHeroes(Creator.from); return; }
  if (Creator.from === 'mp') openMp(); else if (Creator.from === 'up') openUpgrades('title'); else goLevels();
}
function creatorBack() {
  if (Creator.wardrobe) { Creator.wardrobe = false; show('pause'); }
  else if (Creator.mode === 'edit') { if (upFrom === 'heroes') openHeroes(heroFrom); else openUpgrades(upFrom); }
  else if (Game.save.heroes.length) openHeroes(Creator.from);
  else if (Creator.from === 'mp') openMp(); else goTitle();
}

// ---------- Seleção / criação de heróis ----------
// from: 'play' (escolheu → fases) · 'mp' (→ multiplayer) · 'up' (→ Meu personagem)
let heroFrom = 'play';
const Previews = [];                                   // retratos animados das telas de menu: { cv, spr }
function drawPreviews(t) {
  for (const p of Previews) {
    if (p.cv.offsetParent === null) continue;
    const g = p.cv.getContext('2d');
    g.clearRect(0, 0, p.cv.width, p.cv.height);
    g.drawImage(p.spr.get('idle', Math.floor(t * 3.5) % POSES.idle), 0, 0);
  }
}
// onde o herói está na campanha
function heroStage(h) {
  if (h.best && h.best[LEVELS[LEVELS.length - 1].id]) return '🏆 Campanha completa';
  const lv = LEVELS[Math.min(h.unlocked || 1, LEVELS.length) - 1];
  return lv.boss ? `☠ Chefe do Mundo ${lv.world}` : `Fase ${lv.wn}-${lv.ln}`;
}
function openHeroes(from = 'play') {
  heroFrom = from; Game.mode = 'menu'; Input.enabled = false;
  persist();
  const sv = Game.save, list = $('#hr-list');
  list.innerHTML = ''; Previews.length = 0;
  $('#hr-sub').textContent = `Cada herói tem as próprias fases, moedas e evolução (até ${MAX_HEROES}).`;
  sv.heroes.forEach((h, i) => {
    const ch = h.char, cls = CLASSES[ch.cls], lvl = (h.prog && h.prog[ch.cls] && h.prog[ch.cls].lvl) || 1;
    const card = document.createElement('div'); card.className = 'hr-card' + (i === sv.cur ? ' on' : '');
    const pick = document.createElement('button'); pick.className = 'hr-pick';
    const cv = Object.assign(document.createElement('canvas'), { width: 96, height: 96 });
    const t = document.createElement('span'); t.className = 't';
    t.innerHTML = `<b></b><small>${cls.icon} ${cls.name} · Nível ${lvl}</small><small>${heroStage(h)} · 🪙 ${h.coins || 0}</small>`;
    $('b', t).textContent = ch.name;
    pick.append(cv, t);
    pick.onclick = () => { Snd.init(); Snd.sfx('click'); selectHero(i); heroChosen(); };
    const acts = document.createElement('div'); acts.className = 'hr-acts';
    const look = Object.assign(document.createElement('button'), { className: 'chip', textContent: '🎨', title: 'Mudar aparência' });
    look.onclick = () => { Snd.sfx('click'); selectHero(i); upFrom = 'heroes'; openCreator('edit'); };
    const del = Object.assign(document.createElement('button'), { className: 'chip', textContent: '🗑', title: 'Excluir herói' });
    del.onclick = () => {
      if (!confirm(`Excluir ${ch.name}? Todo o progresso deste herói (fases, moedas e evolução) será perdido.`)) return;
      deleteHero(i); openHeroes(heroFrom);
    };
    acts.append(look, del);
    card.append(pick, acts); list.appendChild(card);
    Previews.push({ cv, spr: buildPlayerSprites({ ...DEFAULT_CHAR, ...ch }) });
  });
  if (sv.heroes.length < MAX_HEROES) {
    const b = document.createElement('button'); b.className = 'hr-card hr-new';
    b.innerHTML = '<span>＋</span>Criar novo herói';
    b.onclick = () => { Snd.init(); Snd.sfx('click'); openCreator('new', heroFrom); };
    list.appendChild(b);
  }
  Snd.music('menu');
  show('heroes'); drawPreviews(Game.t);
}
const upBack = () => upFrom === 'heroes' ? 'title' : upFrom;
function heroChosen() {
  if (heroFrom === 'mp') openMp();
  else if (heroFrom === 'up') openUpgrades(upBack());
  else goLevels();
}
function heroesBack() {
  if (heroFrom === 'mp') openMp();
  else if (heroFrom === 'up' && Game.save.cur >= 0) openUpgrades(upBack());
  else goTitle();
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
  ensureHero();
  setMpBusy(true, 'Criando sala...');
  try { await hostRoom(); openRoom(); }
  catch (e) { leaveRoom(e.message || String(e)); }
}
async function mpJoin() {
  const code = cleanCode($('#mp-code').value);
  if (code.length !== CODE_LEN) { $('#mp-msg').textContent = `O código tem ${CODE_LEN} letras/números.`; return; }
  ensureHero();
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

// ---------- Evolução: atributos (pontos de nível) e ferreiro (moedas) ----------
let upFrom = 'title';
function openUpgrades(from) {
  if (Game.save.cur < 0) { upFrom = 'title'; openHeroes('up'); return; }   // ainda não tem herói: cria/escolhe primeiro
  upFrom = from; Game.mode = 'menu'; Input.enabled = false;
  $('#up-msg').textContent = '';
  // trocar de herói ou de visual só fora de uma partida em andamento
  const free = from !== 'win' && !Net.role && !Local.on;
  $('#b-up-heroes').style.display = $('#b-up-look').style.display = free ? '' : 'none';
  Previews.length = 0; Previews.push({ cv: $('#up-pv'), spr: buildPlayerSprites({ ...DEFAULT_CHAR, ...Game.save.char }) });
  renderUpgrades(); show('up'); drawPreviews(Game.t);
}
const pips = (n, max) => '<b>' + '■'.repeat(n) + '</b>' + '■'.repeat(Math.max(0, max - n));
function renderUpgrades() {
  const ch = Game.save.char, cls = CLASSES[ch.cls], pr = progOf(ch.cls), coins = Game.save.coins || 0;
  $('#up-title').textContent = ch.name;
  $('#up-sub').textContent = `${cls.icon} ${cls.name} · Nível ${pr.lvl} · XP ${pr.xp}/${xpNeed(pr.lvl)} · ${heroStage(Game.save)}`;
  $('#up-pts').textContent = pr.pts ? `(${pr.pts} ponto${pr.pts > 1 ? 's' : ''} para gastar)` : '(sem pontos)';
  $('#up-coins').textContent = `(🪙 ${coins} moedas)`;
  const stats = $('#up-stats'); stats.innerHTML = '';
  for (const k in STAT_MAX) {
    const v = pr.st[k], max = STAT_MAX[k], noMana = k === 'mana' && !cls.mana, row = document.createElement('div');
    row.className = 'up-row' + (noMana ? ' off' : '');
    row.innerHTML = `<span>${STAT_INFO[k][0]}<small>${noMana ? 'Só serve para quem usa mana' : STAT_INFO[k][1]}</small></span><span class="pips">${pips(v, max)}</span>`;
    const b = document.createElement('button'); b.className = 'btn small'; b.textContent = v >= max ? 'Máx.' : '+1';
    b.disabled = v >= max || !pr.pts || noMana;
    b.onclick = () => { pr.st[k]++; pr.pts--; afterUpgrade('Atributo melhorado!'); };
    row.appendChild(b); stats.appendChild(row);
  }
  const shop = $('#up-shop'); shop.innerHTML = '';
  const items = [['dmg', '⚔ Dano geral', '+15% de dano em todos os ataques']].concat(cls.skills.map((sk, i) => [['a', 'b', 'c'][i], sk.icon + ' ' + sk.name, upgradeDesc(cls.id, i)]));
  for (const [k, name, desc] of items) {
    const lvl = pr.up[k], max = UP_MAX[k], cost = UP_COST[k][lvl], row = document.createElement('div');
    row.className = 'up-row';
    row.innerHTML = `<span>${name}<small>${desc}</small></span><span class="pips">${pips(lvl, max)}</span>`;
    const b = document.createElement('button'); b.className = 'btn small';
    b.textContent = lvl >= max ? 'Máx.' : `🪙 ${cost}`;
    b.disabled = lvl >= max || coins < cost;
    b.onclick = () => { Game.save.coins -= cost; pr.up[k]++; afterUpgrade('Melhoria comprada!'); };
    row.appendChild(b); shop.appendChild(row);
  }
}
function afterUpgrade(msg) { persist(); Snd.sfx('lvup'); renderUpgrades(); $('#up-msg').textContent = ''; banner(msg, '', 1000); if (Net.sendBuild) Net.sendBuild(); }
function closeUpgrades() {
  if (upFrom === 'levels') goLevels();
  else if (upFrom === 'win') show('win');
  else if (upFrom === 'mp') openMp();
  else if (upFrom === 'heroes') openHeroes(heroFrom);
  else goTitle();
}

// ---------- Tela de controles (abas: Teclado · Controle · Câmera) ----------
let ctlFrom = 'title', ctlTab = 'kb', padCapT = 0;
function saveBinds() { Game.save.binds = { keys: Binds.keys, mouse: Binds.mouse }; persist(); }
function savePad() { Game.save.pad = { map: PadCfg.map, sens: PadCfg.sens, dead: PadCfg.dead, invY: PadCfg.invY, rumble: PadCfg.rumble }; persist(); }
function openControls(from) {
  ctlFrom = from; Game.mode = 'menu'; Input.enabled = false; Input.capture = null; Input.padCapture = null;
  ctlTab = document.body.classList.contains('touch') ? 'game' : Input.padOn ? 'pad' : 'kb';
  renderControls(); show('controls');
}
const CTL_HINT = {
  kb: 'Clique em uma tecla e pressione a nova. Esc cancela, Backspace limpa.',
  pad: 'Clique (ou aperte A) em um campo e depois aperte o botão do controle.',
  game: 'Ajustes da câmera e do mini-chat durante as fases.',
};
function ctlRow(label, cls) {
  const row = document.createElement('div'); row.className = 'ctl-row' + (cls ? ' ' + cls : '');
  row.appendChild(Object.assign(document.createElement('span'), { textContent: label }));
  return row;
}
function renderControls(msg) {
  Input.capture = null; Input.padCapture = null; clearTimeout(padCapT);
  $$('.ctl-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === ctlTab));
  $('#ctl-kb').hidden = ctlTab !== 'kb'; $('#ctl-pad').hidden = ctlTab !== 'pad'; $('#ctl-game').hidden = ctlTab !== 'game';
  $('#b-pad-rumble').hidden = ctlTab !== 'pad';
  $('#b-pad-rumble').textContent = 'Vibração: ' + (PadCfg.rumble ? 'LIGADA' : 'DESLIGADA');
  $('#ctl-msg').textContent = msg || CTL_HINT[ctlTab];
  if (ctlTab === 'kb') renderKeys(); else if (ctlTab === 'pad') renderPad(); else renderCamOpts();
}
function renderKeys() {
  const pr = $('#ctl-presets'); pr.innerHTML = '';
  for (const id in BIND_PRESETS) {
    const b = document.createElement('button'); b.className = 'btn small'; b.textContent = BIND_PRESETS[id].label;
    b.onclick = () => { setBinds(JSON.parse(JSON.stringify({ keys: BIND_PRESETS[id].keys, mouse: BIND_PRESETS[id].mouse }))); saveBinds(); Snd.sfx('click'); renderControls('Esquema aplicado!'); };
    pr.appendChild(b);
  }
  const list = $('#ctl-list'); list.innerHTML = '';
  for (const [act, label] of ACTIONS) {
    const row = ctlRow(label);
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
  const OPT = [['a', 'Habilidade 1'], ['b', 'Habilidade 2'], ['c', 'Habilidade 3'], ['special', 'Ataque especial'], ['', 'Nenhuma']];
  for (const [btn, label] of [[0, 'Botão esquerdo'], [2, 'Botão direito'], [1, 'Botão do meio (roda)']]) {
    const row = ctlRow(label, 'm');
    const b = document.createElement('button'); b.className = 'kb'; b.textContent = (OPT.find(o => o[0] === (Binds.mouse[btn] || '')) || OPT[4])[1];
    b.onclick = () => {
      const cur = OPT.findIndex(o => o[0] === (Binds.mouse[btn] || '')), nx = OPT[(cur + 1) % OPT.length][0];
      Binds.mouse[btn] = nx; saveBinds(); Snd.sfx('click'); renderControls();
    };
    row.appendChild(b); ml.appendChild(row);
  }
}
function renderPad() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(p => p && p.connected) : [];
  $('#pad-status').textContent = pads.length ? '🎮 Conectado: ' + pads[0].id.replace(/\(.*?\)/g, '').trim().slice(0, 48)
    : 'Nenhum controle conectado: ligue por USB ou Bluetooth e aperte um botão.';
  const list = $('#pad-list'); list.innerHTML = '';
  const fixed = (label, a, b) => {
    const row = ctlRow(label);
    for (const t of [a, b]) row.appendChild(Object.assign(document.createElement('span'), { className: 'kb fixed', textContent: t }));
    list.appendChild(row);
  };
  fixed('Mover', 'Analógico esq.', 'Direcional');
  fixed('Mirar (mago e arqueiro)', 'Analógico dir.', '—');
  for (const [act, label] of PAD_ACTIONS) {
    const row = ctlRow(label);
    [0, 1].forEach(slot => {
      const b = document.createElement('button'); b.className = 'kb'; b.textContent = padName(PadCfg.map[act][slot]);
      b.onclick = () => {
        renderControls('Aperte o botão do controle para "' + label + '"...');
        const nb = $$('#pad-list .kb:not(.fixed)')[PAD_ACTIONS.findIndex(a => a[0] === act) * 2 + slot];
        if (nb) { nb.classList.add('wait'); nb.textContent = 'aperte...'; nb.focus({ preventScroll: true }); }
        padCapT = setTimeout(() => { if (Input.padCapture) renderControls('Tempo esgotado: nenhum botão apertado.'); }, 6000);
        Input.padCapture = i => {
          clearTimeout(padCapT);
          if (PadCfg.map[act][slot] === i) { PadCfg.map[act][slot] = -1; savePad(); Snd.sfx('click'); renderControls('Campo limpo.'); return; }
          for (const [o] of PAD_ACTIONS) if (o !== act) PadCfg.map[o] = PadCfg.map[o].map(v => v === i ? -1 : v);   // um botão por ação
          PadCfg.map[act][slot] = i; savePad(); Snd.sfx('click'); renderControls(padName(i) + ' → ' + label);
        };
      };
      row.appendChild(b);
    });
    list.appendChild(row);
  }
  const op = $('#pad-opts'); op.innerHTML = '';
  const slider = (label, min, max, step, val, fmt, set) => {
    const row = ctlRow(label, 'm'), box = Object.assign(document.createElement('span'), { className: 'rng' });
    const inp = Object.assign(document.createElement('input'), { type: 'range', min, max, step, value: val });
    const out = Object.assign(document.createElement('span'), { className: 'val', textContent: fmt(val) });
    inp.oninput = () => { const v = Number(inp.value); out.textContent = fmt(v); set(v); savePad(); };
    box.append(inp, out); row.appendChild(box); op.appendChild(row);
  };
  slider('Sensibilidade da mira', 1, 10, 1, PadCfg.sens, v => v >= 10 ? 'Instantânea' : v + ' / 10', v => { PadCfg.sens = v; });
  slider('Zona morta dos analógicos', 10, 60, 5, Math.round(PadCfg.dead * 100), v => v + '%', v => { PadCfg.dead = v / 100; });
  const row = ctlRow('Inverter mira vertical', 'm'), box = document.createElement('button');
  box.className = 'box'; box.textContent = PadCfg.invY ? '✕' : '';
  box.onclick = () => { PadCfg.invY = !PadCfg.invY; savePad(); Snd.sfx('click'); renderControls(); };
  row.appendChild(box); op.appendChild(row);
}
function renderCamOpts() {
  const box = $('#ctl-game-list'); box.innerHTML = '';
  const row = ctlRow('Distância da câmera', 'm'), chips = document.createElement('div'); chips.className = 'chips';
  VIEWS.forEach((v, i) => {
    const b = document.createElement('button'); b.className = 'chip' + ((Game.save.view | 0) === i ? ' on' : ''); b.textContent = v.name;
    b.onclick = () => { setCamera(i); Snd.sfx('click'); renderControls('Câmera: ' + v.name); };
    chips.appendChild(b);
  });
  row.appendChild(chips); box.appendChild(row);
  const row2 = ctlRow('Tamanho do chat (online)', 'm'), chips2 = document.createElement('div'); chips2.className = 'chips';
  CHAT_SIZES.forEach((v, i) => {
    const b = document.createElement('button'); b.className = 'chip' + (Game.save.chatSize === i ? ' on' : ''); b.textContent = v.name;
    b.onclick = () => { setChatSize(i); Snd.sfx('click'); renderControls('Chat: ' + v.name); };
    chips2.appendChild(b);
  });
  row2.appendChild(chips2); box.appendChild(row2);
}
// Tamanho do mini-chat do multiplayer (letras, largura e botões)
const CHAT_SIZES = [{ name: 'Pequeno', k: 0.8 }, { name: 'Normal', k: 1 }, { name: 'Grande', k: 1.3 }, { name: 'Enorme', k: 1.65 }];
function setChatSize(i) {
  Game.save.chatSize = clamp(i | 0, 0, CHAT_SIZES.length - 1); persist();
  document.documentElement.style.setProperty('--chat-k', CHAT_SIZES[Game.save.chatSize].k);
  $('#b-chatsz').textContent = '💬 Chat: ' + CHAT_SIZES[Game.save.chatSize].name;
}
function setCamera(i) {
  Game.save.view = clamp(i | 0, 0, VIEWS.length - 1); persist(); setView(Game.save.view);
  $('#b-cam').textContent = '📷 Câmera: ' + VIEWS[Game.save.view].name;
}
function resetControls() {
  if (ctlTab === 'kb') { setBinds(null); saveBinds(); }
  else if (ctlTab === 'pad') { const r = PadCfg.rumble; setPadCfg(null); PadCfg.rumble = r; savePad(); }
  else { setCamera(0); setChatSize(1); }
  Snd.sfx('click'); renderControls('Padrão restaurado.');
}

// ---------- Ligações ----------
click('#b-play', () => { if (Game.save.heroes.length) openHeroes('play'); else openCreator('new', 'play'); });
click('#b-create', () => openUpgrades('title'));
click('#b-hr-back', heroesBack);
click('#b-up-look', () => openCreator('edit'));
click('#b-up-heroes', () => openHeroes('up'));
click('#b-mp', () => openMp());
click('#b-mp-host', mpHost);
click('#b-mp-join', mpJoin);
click('#b-mp-hero', () => openHeroes('mp'));
click('#b-mp-back', goTitle);
click('#b-mp-share', mpShare);
click('#b-mp-copy', mpCopy);
click('#b-mp-start', goLevels);
click('#b-mp-leave', () => leaveRoom());
click('#b-win-leave', () => leaveRoom());
$('#mp-code').addEventListener('keydown', e => { if (e.key === 'Enter') mpJoin(); });
$('#mp-code').addEventListener('input', e => { e.target.value = cleanCode(e.target.value); });
click('#b-sound', toggleSound);
click('#b-lv-up', () => openUpgrades('levels'));
click('#b-win-up', () => openUpgrades('win'));
click('#b-up-back', closeUpgrades);
click('#b-controls', () => openControls('title'));
click('#b-controls2', () => openControls('pause'));
click('#b-ctl-back', () => { Input.capture = null; if (ctlFrom === 'pause' && Game.world) { Game.mode = 'pause'; show('pause'); } else goTitle(); });
click('#b-ctl-reset', resetControls);
click('#b-pad-rumble', () => { PadCfg.rumble = !PadCfg.rumble; savePad(); Snd.sfx('click'); renderControls(); if (PadCfg.rumble) padRumble(250, 0.6, 0.6); });
$$('.ctl-tab').forEach(b => { b.onclick = () => { ctlTab = b.dataset.tab; Snd.sfx('click'); renderControls(); }; });
click('#b-cam', () => setCamera(((Game.save.view | 0) + 1) % VIEWS.length));
addEventListener('gamepadconnected', () => { if ($('#s-controls').classList.contains('on') && ctlTab === 'pad') renderControls(); });
addEventListener('gamepaddisconnected', () => { if ($('#s-controls').classList.contains('on') && ctlTab === 'pad') renderControls(); });
click('#b-sound2', toggleSound);
click('#b-lv-back', () => { if (Net.role === 'host') openRoom(); else if (Local.on) openLocal(); else goTitle(); });
click('#b-random', randomChar);
click('#b-cr-back', creatorBack);
click('#b-map-play', mapPlay);
click('#b-wardrobe', openWardrobe);
click('#b-elem', elemButton);
click('#b-chatsz', () => setChatSize(((Game.save.chatSize === undefined ? 1 : Game.save.chatSize) + 1) % CHAT_SIZES.length));
click('#b-cr-done', saveCharacter);
click('#b-next', () => beginLevel(Game.world.idx + 1));
click('#b-retry', () => beginLevel(Game.world.idx));
click('#b-win-menu', goLevels);
click('#b-resume', resumeGame);
click('#b-restart', () => { const i = Game.world.idx; beginLevel(i); });
click('#b-quit', () => { if (Net.role === 'client') leaveRoom(); else if (Net.role === 'host' || Local.on) goLevels(); else goTitle(); });
click('#b-fs', () => {
  try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {}
});
$('#cr-name').addEventListener('input', () => { Creator.ch.name = $('#cr-name').value; });
addEventListener('keydown', e => {
  if (KEYMAP[e.code] === 'pause' && Game.mode === 'pause' && !Input.capture && e.target.tagName !== 'INPUT') resumeGame();
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
  // o chat fica no canto superior direito da tela do jogo (abaixo das moedas)
  const rc = canvas.getBoundingClientRect(), st = document.documentElement.style;
  st.setProperty('--cv-top', rc.top + 'px'); st.setProperty('--cv-right', Math.max(0, iw - rc.right) + 'px'); st.setProperty('--cv-h', rc.height + 'px');
}
addEventListener('resize', resize);
addEventListener('orientationchange', resize);

// ---------- Mini-chat do multiplayer ----------
// Canto superior direito: mensagens dos jogadores e avisos do jogo (vida perdida, especial...). Some sozinho depois de uns segundos.
const QUICK_MSGS = ['Vem cá!', 'Me espera!', 'Socorro!', 'Boa!', 'Vamos!', 'Peguem as moedas!'];
const Chat = {
  open: false, shown: false,
  add(m) {
    if (!m || !m.text) return;
    const el = document.createElement('div');
    el.className = 'chat-line' + (m.sys ? ' sys' : '');
    if (m.sys) el.textContent = m.text;
    else {
      const r = Net.roster.find(x => x.id === m.id), b = document.createElement('b');
      b.textContent = (r ? r.ch.name : 'Jogador') + ': ';
      b.style.color = (r && r.ch.accent) || '#ffd23f';
      el.append(b, document.createTextNode(m.text));
      if (m.id !== Net.pid) Snd.sfx('click');
    }
    const log = $('#chat-log');
    log.appendChild(el);
    while (log.children.length > 8) log.firstChild.remove();
    setTimeout(() => el.classList.add('old'), m.sys ? 6000 : 9000);
  },
  clear() { $('#chat-log').innerHTML = ''; chatClose(false); },
};
function chatOpen() {
  if (!Net.role || !Net.inLevel || Game.mode !== 'play' || Chat.open) return;
  Chat.open = true; Input.enabled = false; Input.clear();
  document.body.classList.add('chatting');
  $('#chat-form').hidden = false;
  const i = $('#chat-in'); i.value = ''; i.focus();
}
function chatClose(sendIt) {
  if (!Chat.open) return;
  const i = $('#chat-in');
  if (sendIt) Net.chat(i.value);
  Chat.open = false; $('#chat-form').hidden = true; i.blur();
  document.body.classList.remove('chatting');
  if (Game.mode === 'play') { Input.enabled = true; Input.clear(); }
}
// mostra o chat só durante uma fase do multiplayer
function chatSync() {
  const on = !!(Net.role && Net.inLevel && Game.world && document.body.classList.contains('playing'));
  if (on === Chat.shown) return;
  Chat.shown = on; $('#chat').hidden = !on;
  if (!on) chatClose(false);
}
for (const q of QUICK_MSGS) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip'; b.textContent = q;
  b.addEventListener('pointerdown', e => e.preventDefault());   // não tira o foco do campo
  b.addEventListener('click', () => { Net.chat(q); chatClose(false); });
  $('#chat-quick').appendChild(b);
}
$('#chat-form').addEventListener('submit', e => { e.preventDefault(); chatClose(true); });
$('#chat-in').addEventListener('blur', () => setTimeout(() => { if (Chat.open && document.activeElement !== $('#chat-in')) chatClose(false); }, 150));
$('#chat-btn').addEventListener('pointerdown', e => e.preventDefault());
$('#chat-btn').addEventListener('click', () => { Snd.init(); if (Chat.open) chatClose(true); else chatOpen(); });
addEventListener('keydown', e => {
  if (Chat.open) { if (e.key === 'Escape') { e.preventDefault(); chatClose(false); } return; }
  if ((e.key === 'Enter' || e.code === 'KeyT') && !KEYMAP[e.code] && e.target.tagName !== 'INPUT' && Net.role && Net.inLevel && Game.mode === 'play') {
    e.preventDefault(); chatOpen();
  }
});

// ---------- Laço principal ----------
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now; Game.t += dt;
  pollPad(dt); touchSync(); chatSync(); localTick();
  // no multiplayer a pausa é só um menu por cima: o mundo continua rodando para os outros
  const live = Game.world && (Game.mode === 'play' || (Game.mode === 'pause' && Net.role));
  if (live) {
    if (Game.mode === 'play' && Input.hit('pause')) { Input.end(); pauseGame(); return; }
    let n = 1;
    if (Net.role === 'client') { Net.clientFrame(Game.world, dt); Input.end(); }
    else {
      acc += dt; n = 0;
      while (acc >= STEP && n < 4 && Game.world) {
        const w = Game.world; n++;
        readCtls(w); update(w, STEP); Input.end(); acc -= STEP;
        if (Net.role === 'host' && Game.world) Net.hostTick(Game.world);
      }
      if (n >= 4) acc = Math.min(acc, STEP);           // aparelho lento: não acumula atraso (evita a "espiral" de quadros)
    }
    // telas de 90/120/144 Hz: só redesenha quando o jogo andou (o mundo roda a 60 passos por segundo)
    if (Game.world && n > 0) { render(Game.world); updateTouchHud(Game.world); }
  } else if (Game.mode === 'pause' && Game.world) {
    acc = 0; render(Game.world);
  } else if (Game.mode === 'creator') {
    renderTitle(Game.t); drawPreview(Game.t);
  } else {
    acc = 0; renderTitle(Game.t);
  }
  if (Mapa.on) mapFrame(dt);                               // mapa do mundo: herói andando pela trilha
  if (Game.world) elemSync(Game.world);
  if (Creator.wardrobe) drawPreview(Game.t);             // trocando de roupa na pausa
  if (Previews.length) drawPreviews(Game.t);             // retratos da seleção de heróis / Meu personagem
}

// ---------- Início ----------
function boot() {
  Game.save = loadSave();
  if (Game.save.bindsV !== BIND_VERSION) { Game.save.binds = null; Game.save.bindsV = BIND_VERSION; persist(); }
  setBinds(Game.save.binds);
  setPadCfg(Game.save.pad);
  setCamera(Game.save.view | 0);
  setChatSize(Game.save.chatSize === undefined ? 1 : Game.save.chatSize);
  Snd.setMuted(!!Game.save.mute);
  if ('ontouchstart' in window || matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  updateSoundLabels();
  $('#ver').textContent = 'versão ' + VERSAO;
  resize();
  goTitle();
  if (new URLSearchParams(location.search).get('sala')) openMp();   // abriu um link de convite
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
