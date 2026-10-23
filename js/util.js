'use strict';
// ---------- Constantes e utilitários ----------
const W = 320, H = 180, T = 16;               // área visível (zoom): personagens e inimigos aparecem maiores
const BGW = 320, BGH = 180;                   // tamanho lógico dos fundos pré-renderizados

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
// amt < 0 escurece, amt > 0 clareia (-1..1)
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex), t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}

// Desenha um mapa de caracteres (cada char = um pixel) usando a paleta dada
function fromMap(rows, pal) {
  const c = mk(rows[0].length, rows.length), g = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); }
  }));
  return c;
}

// Contorno de 1px ao redor dos pixels opacos (dá o visual "pixel art" clássico).
// Sem cor fixa, o contorno é "seletivo": versão escura e tingida da cor vizinha (mais rico que preto puro).
function outline(c, col = null) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  const a = g.getImageData(0, 0, w, h).data;
  const idx = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 40 ? (y * w + x) * 4 : -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (idx(x, y) >= 0) continue;
    const n = [idx(x, y - 1), idx(x - 1, y), idx(x + 1, y), idx(x, y + 1)].filter(i => i >= 0);
    if (!n.length) continue;
    if (col) g.fillStyle = col;
    else { const i = n[0]; g.fillStyle = `rgb(${(a[i] * 0.3 + 16) | 0},${(a[i + 1] * 0.26 + 11) | 0},${(a[i + 2] * 0.32 + 22) | 0})`; }
    g.fillRect(x, y, 1, 1);
  }
  return c;
}

// Gira um sprite em múltiplos de 90° mantendo os pixels nítidos
function rotated(c, quarter, cx, cy) {
  const o = mk(c.width, c.height), g = o.getContext('2d');
  g.translate(cx, cy); g.rotate(quarter * Math.PI / 2); g.drawImage(c, -cx, -cy);
  return o;
}

// Cópia espelhada na horizontal (usada para cachear sprites virados para a esquerda)
function flipped(c) {
  const o = mk(c.width, c.height), g = o.getContext('2d');
  g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
  return o;
}

// Hash determinístico simples (decoração do cenário)
const hash2 = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

// "Bolha" sombreada em pixel art (copas de árvore, nuvens, arbustos, pedras)
function blob(g, cx, cy, rx, ry, base, light, dark, rim = null) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d > 1) continue;
    const l = -dx * 0.55 - dy * 0.75; // luz vindo de cima-esquerda
    g.fillStyle = l > 0.42 ? light : l < -0.38 ? dark : base;
    if (rim && d > 0.8 && l < 0) g.fillStyle = rim;
    g.fillRect(x, y, 1, 1);
  }
}

// Silhueta de uma cor só (flash de dano)
const _tints = new WeakMap();
function whiteOf(img) {
  let t = _tints.get(img);
  if (!t) {
    t = mk(img.width, img.height);
    const g = t.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = '#fff';
    g.fillRect(0, 0, t.width, t.height);
    _tints.set(img, t);
  }
  return t;
}

// Linha em "pixels grossos"
function pline(g, x0, y0, x1, y1, sz = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let i = 0; i < 400; i++) {
    g.fillRect(x0, y0, sz, sz);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Fonte minúscula 3x5 para o HUD (cada glifo: 5 linhas de 3 pixels)
const GLYPHS = {};
{
  const rows = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111',
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111', '!': '010010010000010', '.': '000000000000010', ':': '000010000010000', '-': '000000111000000',
    '+': '000010111010000', '%': '101001010100101', ' ': '000000000000000', x: '000101010101000', '/': '001001010100100',
  };
  for (const k in rows) GLYPHS[k] = rows[k];
}
function drawText(g, str, x, y, col = '#fff', s = 1) {
  g.fillStyle = col;
  for (const ch of String(str)) {
    const gl = GLYPHS[ch] || GLYPHS[String(ch).toUpperCase()];
    if (gl) for (let i = 0; i < 15; i++) if (gl[i] === '1') g.fillRect(x + (i % 3) * s, y + ((i / 3) | 0) * s, s, s);
    x += 4 * s;
  }
}
const textW = (str, s = 1) => String(str).length * 4 * s - s;
// Texto com contorno escuro (legível sobre qualquer fundo)
function drawTextO(g, str, x, y, col = '#fff', s = 1, edge = '#1b1423') {
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) drawText(g, str, x + ox * s, y + oy * s, edge, s);
  drawText(g, str, x, y, col, s);
}

// ---------- Áudio (sintetizado, sem arquivos) ----------
const SONGS = {
  menu:   { bpm: 96,  root: 220, lead: [0, -1, 4, -1, 7, -1, 4, -1, 5, -1, 9, -1, 7, -1, 4, -1], bass: [0, -1, -1, -1, 5, -1, -1, -1] },
  forest: { bpm: 132, root: 196, lead: [0, 4, 7, 12, 7, 4, 7, -1, 9, 7, 4, 0, 2, 4, -1, -1], bass: [0, -1, 7, -1, 5, -1, 7, -1] },
  cave:   { bpm: 100, root: 165, lead: [0, 3, 7, 3, 10, 7, 3, -1, 12, 10, 7, 3, 5, 3, -1, -1], bass: [0, -1, 0, -1, -2, -1, -4, -1] },
  castle: { bpm: 116, root: 147, lead: [0, 1, 5, 1, 7, 5, 1, -1, 8, 7, 5, 1, 3, 1, -1, -1], bass: [0, 0, -1, 0, -4, -4, -2, -1] },
  boss:   { bpm: 150, root: 131, lead: [0, 3, 0, 7, 0, 3, 10, 7, 0, 3, 0, 8, 7, 3, 1, 3], bass: [0, 0, -5, -5, -2, -2, -4, -4] },
};

const Snd = (() => {
  let ctx = null, master = null, muted = false, song = null, want = null, step = 0, timer = null;
  function init() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.22;
        master.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (ctx && want && !timer) music(want);
  }
  function tone(f, d, type = 'square', vol = 0.4, slide = 0, delay = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + d + 0.03);
  }
  function noise(d, vol = 0.3, delay = 0) {
    if (!ctx || muted) return;
    const n = Math.max(1, (ctx.sampleRate * d) | 0), buf = ctx.createBuffer(1, n, ctx.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime + delay;
    s.buffer = buf;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(g); g.connect(master); s.start(t);
  }
  const FX = {
    jump:  () => tone(280, 0.14, 'square', 0.3, 420),
    coin:  () => { tone(988, 0.06, 'square', 0.25); tone(1319, 0.14, 'square', 0.25, 0, 0.06); },
    hit:   () => { noise(0.1, 0.35); tone(160, 0.1, 'sawtooth', 0.3, -80); },
    hurt:  () => tone(240, 0.28, 'sawtooth', 0.4, -170),
    slash: () => { noise(0.08, 0.25); tone(520, 0.08, 'triangle', 0.25, -300); },
    fire:  () => { noise(0.14, 0.2); tone(200, 0.2, 'sawtooth', 0.2, 300); },
    ice:   () => { tone(1200, 0.15, 'triangle', 0.25, -600); },
    poison:() => { tone(300, 0.2, 'sine', 0.3, 200); },
    zap:   () => { noise(0.2, 0.3); tone(900, 0.22, 'sawtooth', 0.3, -750); },
    heal:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.3, 0, i * 0.07)),
    arrow: () => tone(700, 0.09, 'triangle', 0.25, -450),
    spear: () => tone(420, 0.16, 'triangle', 0.35, -260),
    block: () => { tone(330, 0.07, 'square', 0.3); noise(0.06, 0.25); },
    dash:  () => noise(0.12, 0.18),
    no:    () => tone(130, 0.1, 'square', 0.25),
    die:   () => tone(320, 0.6, 'sawtooth', 0.4, -280),
    check: () => { tone(660, 0.1, 'square', 0.25); tone(880, 0.16, 'square', 0.25, 0, 0.1); },
    win:   () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'square', 0.25, 0, i * 0.11)),
    boom:  () => { noise(0.45, 0.5); tone(90, 0.45, 'sawtooth', 0.5, -50); },
    click: () => tone(600, 0.04, 'square', 0.2),
    crit:  () => { tone(1500, 0.07, 'square', 0.25); tone(2000, 0.12, 'square', 0.22, 0, 0.05); noise(0.08, 0.25); },
    freeze:() => { tone(1800, 0.1, 'triangle', 0.25, -900); tone(1400, 0.16, 'triangle', 0.2, -700, 0.07); },
    shatter:() => { noise(0.18, 0.3); tone(2400, 0.1, 'triangle', 0.2, -1500); },
    burn:  () => { noise(0.1, 0.18); tone(260, 0.1, 'sawtooth', 0.15, 120); },
    bomb:  () => { noise(0.35, 0.5); tone(120, 0.35, 'square', 0.4, -80); },
    fuse:  () => tone(520, 0.1, 'triangle', 0.2, 260),
    shadow:() => { noise(0.1, 0.2); tone(180, 0.14, 'sawtooth', 0.22, 500); },
    djump: () => tone(420, 0.14, 'square', 0.25, 600),
    life:  () => [659, 784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.1, 'square', 0.25, 0, i * 0.08)),
    over:  () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'triangle', 0.35, -10, i * 0.2)),
    bossheal: () => [330, 392, 494].forEach((f, i) => tone(f, 0.18, 'sawtooth', 0.22, 0, i * 0.09)),
  };
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function music(name) {
    want = name;
    stop();
    if (!ctx || !name || !SONGS[name]) return;
    song = SONGS[name]; step = 0;
    const note = n => song.root * Math.pow(2, n / 12);
    timer = setInterval(() => {
      if (muted || !ctx) return;
      const l = song.lead[step % 16], b = song.bass[step % 8], bar = Math.floor(step / 16);
      const oct = bar % 4 === 3 ? 2 : 1;                       // a cada 4 compassos a melodia sobe uma oitava
      if (l >= 0 || l < -1) {
        tone(note(l) * oct, 0.16, 'square', 0.06);
        tone(note(l) * oct * 1.004, 0.2, 'triangle', 0.05);   // dobra levemente desafinada (corpo)
        if (step % 2 === 0) tone(note(l) * oct, 0.14, 'square', 0.025, 0, 0.19);   // eco
      }
      if (b >= 0 || b < -1) tone(note(b) / 2, 0.22, 'triangle', 0.16);
      if (step % 8 === 0) { const r = song.bass[(step / 8 | 0) % 8]; if (r >= 0 || r < -1) { tone(note(r) / 2, 1.0, 'sine', 0.05); tone(note(r + 7) / 2, 1.0, 'sine', 0.035); tone(note(r + 3) / 2, 1.0, 'sine', 0.03); } }
      // percussão: bumbo, caixa e chimbal
      if (name !== 'menu') {
        if (step % 4 === 0) tone(110, 0.12, 'sine', 0.22, -70);
        if (step % 8 === 4) noise(0.1, 0.12);
        if (step % 2 === 1) noise(0.03, 0.04);
      }
      step++;
    }, 30000 / song.bpm);
  }
  return {
    init, music, tone, noise,
    sfx(n) { if (FX[n]) FX[n](); },
    get muted() { return muted; },
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.22; },
  };
})();

// ---------- Entrada: teclado + toque ----------
const Input = {
  enabled: false, kb: {}, touch: {}, pressed: {}, aim: null, aimMode: 'keys', mouseHeld: {}, capture: null,
  isDown(k) { return !!(this.kb[k] || this.touch[k]); },
  hit(k) { return !!this.pressed[k]; },
  end() { this.pressed = {}; },
  clear() { this.kb = {}; this.touch = {}; this.pressed = {}; $$('#touch [data-k]').forEach(b => b.classList.remove('on')); },
};
// ---------- Controles configuráveis (teclado + botões do mouse) ----------
const ACTIONS = [
  ['left', 'Mover para a esquerda'], ['right', 'Mover para a direita'], ['jump', 'Pular / planar'], ['down', 'Descer da plataforma'],
  ['a', 'Habilidade 1'], ['b', 'Habilidade 2'], ['c', 'Habilidade 3'],
  ['aimup', 'Mirar para cima'], ['aimdown', 'Mirar para baixo'], ['pause', 'Pausar'],
];
const BIND_PRESETS = {
  padrao: { label: 'Padrão (setas/WASD + J K L)', keys: {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'ArrowUp'], down: ['ArrowDown', 'KeyS'],
    a: ['KeyJ', 'KeyZ'], b: ['KeyK', 'KeyX'], c: ['KeyL', 'KeyC'], aimup: ['KeyQ', ''], aimdown: ['KeyE', ''], pause: ['Escape', 'KeyP'] },
    mouse: { 0: 'a', 1: 'c', 2: 'b' } },
  mouse: { label: 'WASD + mouse (habilidades em 1 2 3 e nos botões do mouse)', keys: {
    left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], jump: ['Space', 'KeyW'], down: ['KeyS', 'ArrowDown'],
    a: ['Digit1', 'KeyJ'], b: ['Digit2', 'KeyK'], c: ['Digit3', 'KeyL'], aimup: ['KeyQ', ''], aimdown: ['KeyE', ''], pause: ['Escape', 'KeyP'] },
    mouse: { 0: 'a', 1: 'c', 2: 'b' } },
};
const Binds = { keys: {}, mouse: {} };
let KEYMAP = {};
function setBinds(src) {
  const base = BIND_PRESETS.padrao;
  Binds.keys = {}; Binds.mouse = { ...base.mouse, ...((src && src.mouse) || {}) };
  for (const [act] of ACTIONS) { const v = (src && src.keys && src.keys[act]) || base.keys[act]; Binds.keys[act] = [v[0] || '', v[1] || '']; }
  KEYMAP = {};
  for (const [act] of ACTIONS) for (const code of Binds.keys[act]) if (code) KEYMAP[code] = act;
}
setBinds(null);
// rótulo curto (cabe na fonte minúscula do HUD)
function keyLabel(act) {
  const c = Binds.keys[act] && Binds.keys[act][0];
  if (!c) return '-';
  if (c.startsWith('Key')) return c.slice(3);
  if (c.startsWith('Digit')) return c.slice(5);
  return { Space: 'SP', ArrowLeft: 'LE', ArrowRight: 'RI', ArrowUp: 'UP', ArrowDown: 'DN', Escape: 'ES', ShiftLeft: 'SH', ShiftRight: 'SH', Enter: 'EN' }[c] || c.slice(0, 2).toUpperCase();
}
// nome legível para a tela de controles
function keyName(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return { Space: 'Espaço', ArrowLeft: '← Seta', ArrowRight: '→ Seta', ArrowUp: '↑ Seta', ArrowDown: '↓ Seta', Escape: 'Esc', ShiftLeft: 'Shift', ShiftRight: 'Shift', ControlLeft: 'Ctrl', AltLeft: 'Alt', Enter: 'Enter', Tab: 'Tab' }[code] || code;
}
addEventListener('keydown', e => {
  Snd.init();
  if (Input.capture) { // modo "pressione uma tecla" da tela de controles
    e.preventDefault();
    const fn = Input.capture; Input.capture = null; fn(e.code);
    return;
  }
  const k = KEYMAP[e.code];
  if (!k || !Input.enabled || e.target.tagName === 'INPUT') return;
  e.preventDefault();
  if (k === 'aimup' || k === 'aimdown') Input.aimMode = 'keys';
  if (!Input.kb[k] && !e.repeat) Input.pressed[k] = true;
  Input.kb[k] = true;
});
addEventListener('keyup', e => {
  const k = KEYMAP[e.code];
  if (k) Input.kb[k] = false;
});
addEventListener('blur', () => Input.clear());

// Mira livre (mouse e toque na tela do jogo): guarda o ponto em coordenadas do canvas lógico (320x180)
function aimFrom(cx, cy) {
  const c = $('#game'), r = c.getBoundingClientRect();
  Input.aim = { x: (cx - r.left) / r.width * W, y: (cy - r.top) / r.height * H };
  Input.aimMode = 'pointer';
}
addEventListener('mousemove', e => { if (Input.enabled) aimFrom(e.clientX, e.clientY); });
addEventListener('mousedown', e => {
  if (!Input.enabled || e.target.id !== 'game') return;
  aimFrom(e.clientX, e.clientY);
  const act = Binds.mouse[e.button];
  if (!act) return;
  e.preventDefault();
  if (!Input.kb[act]) Input.pressed[act] = true;
  Input.kb[act] = true; Input.mouseHeld[e.button] = act;
});
addEventListener('mouseup', e => { const act = Input.mouseHeld[e.button]; if (act) { Input.kb[act] = false; delete Input.mouseHeld[e.button]; } });
addEventListener('contextmenu', e => { if (Input.enabled) e.preventDefault(); });
addEventListener('auxclick', e => { if (Input.enabled && e.button === 1) e.preventDefault(); });
['touchstart', 'touchmove'].forEach(n => addEventListener(n, e => {
  if (!Input.enabled || e.target.id !== 'game') return;
  const t = e.changedTouches[0]; aimFrom(t.clientX, t.clientY);
  e.preventDefault();
}, { passive: false }));
addEventListener('pointerdown', () => Snd.init(), { passive: true });

function updateTouch(e) {
  const ks = {};
  for (const t of e.touches) {
    const el = document.elementFromPoint(t.clientX, t.clientY), b = el && el.closest('[data-k]');
    if (b) ks[b.dataset.k] = true;
  }
  for (const k in ks) if (!Input.touch[k]) Input.pressed[k] = true;
  Input.touch = ks;
  $$('#touch [data-k]').forEach(b => b.classList.toggle('on', !!ks[b.dataset.k]));
}
['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(n =>
  $('#touch').addEventListener(n, e => { e.preventDefault(); Snd.init(); updateTouch(e); }, { passive: false }));
