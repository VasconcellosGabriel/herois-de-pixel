'use strict';
// ---------- Fases ----------
// Para adicionar uma fase nova, basta incluir um objeto aqui.
// Tiles: 0 vazio, 1 sólido, 2 plataforma de mão única, 3 espinhos, 4 caixa quebrável (sólida), 5 parede falsa (parece terreno, quebra)
const LEVELS = [
  { id: 'floresta', name: 'Floresta Sussurrante', theme: 'forest', len: 120, seed: 101,
    enemies: ['slime', 'slime', 'bat', 'plant'], density: 0.55, gaps: 0.18, stones: 0.1, spikes: 0.08, plats: 0.25 },
  { id: 'caverna', name: 'Cavernas de Cristal', theme: 'cave', len: 140, seed: 202,
    enemies: ['slime', 'bat', 'skeleton', 'ghost', 'ghost'], density: 0.65, gaps: 0.2, stones: 0.14, spikes: 0.14, plats: 0.22 },
  { id: 'castelo', name: 'Castelo Sombrio', theme: 'castle', len: 160, seed: 303,
    enemies: ['skeleton', 'knight', 'bat', 'guard', 'guard'], density: 0.7, gaps: 0.2, stones: 0.14, spikes: 0.16, plats: 0.2 },
  { id: 'golem', name: 'Covil do Rei Golem', theme: 'boss', len: 36, seed: 404, boss: 'golem' },
];

// Altura da fase em tiles e linha do chão. A fase é mais alta que a tela: sobra espaço para montes, vales
// e para a câmera afastada (opção "Distância da câmera").
const LV_H = 15, GY0 = 12, GY_MIN = 9, GY_MAX = 13;

function genLevel(def) {
  const R = rng(def.seed), w = def.len, h = LV_H;
  const tiles = Array.from({ length: h }, () => new Uint8Array(w));
  const L = { w, h, tiles, theme: def.theme, spawns: [], coins: [], picks: [], checks: [], chests: [], secrets: [], goal: null, start: null };
  const ground = (x0, x1, g) => { for (let x = x0; x < x1 && x < w; x++) for (let y = g; y < h; y++) tiles[y][x] = 1; };
  const rint = (a, b) => a + Math.floor(R() * (b - a + 1));
  const coinRow = (tx, n, ty) => { for (let i = 0; i < n; i++) L.coins.push({ x: (tx + i) * T + 8, y: ty * T + 8 }); };
  const oneway = (x0, n, ty) => { for (let i = 0; i < n; i++) tiles[ty][x0 + i] = 2; };

  // ---- Arena do chefe ----
  if (def.boss) {
    const gy = GY0;
    ground(0, w, gy);
    for (let y = 0; y < h; y++) { tiles[y][0] = 1; tiles[y][1] = 1; tiles[y][w - 2] = 1; tiles[y][w - 1] = 1; }
    oneway(6, 4, gy - 3); oneway(w - 10, 4, gy - 3);
    oneway(15, 6, gy - 3);
    L.start = { x: 5 * T, y: gy * T };
    L.spawns.push({ t: def.boss, x: (w - 8) * T, y: gy * T });
    L.bossGate = 10 * T;
    L.dropY = (gy - 4) * T + 8;          // onde caem os corações de bônus da luta
    return L;
  }

  // ---- Fase normal ----
  let gy = GY0, x = 12, sinceCheck = 0;
  ground(0, 12, gy);
  L.start = { x: 3 * T, y: gy * T };
  const clear = [];                       // trechos sem caixas extras (não podem virar degrau para os desafios)

  const addEnemies = (x0, len, g) => {
    const n = Math.round(R() * def.density * 3);
    for (let i = 0; i < n; i++) {
      const type = def.enemies[Math.floor(R() * def.enemies.length)];
      const tx = x0 + 3 + Math.floor(R() * Math.max(1, len - 5));
      if (type === 'bat' || type === 'ghost') L.spawns.push({ t: type, x: tx * T + 8, y: (g - 3 - rint(0, 1)) * T });
      else L.spawns.push({ t: type, x: tx * T + 8, y: g * T });
    }
  };
  const flat = n => { ground(x, x + n, gy); x += n; sinceCheck += n; };
  // caixa quebrável no chão (às vezes duas empilhadas)
  const crate = (tx, g) => { tiles[g - 1][tx] = 4; if (R() < 0.3) tiles[g - 2][tx] = 4; };
  let secrets = 0, ledges = 0, nests = 0, hills = 0;
  // Morro com túnel escondido: entra e sai quebrando paredes falsas; lá dentro há moedas e um baú
  const secret = () => {
    const len = rint(11, 14), top = gy - 3;
    ground(x, x + len, top);
    for (let tx = x + 1; tx < x + len - 1; tx++) { tiles[gy - 2][tx] = 0; tiles[gy - 1][tx] = 0; }
    for (const tx of [x, x + len - 1]) { tiles[gy - 2][tx] = 5; tiles[gy - 1][tx] = 5; }
    coinRow(x + 2, len - 6, gy - 1);
    L.chests.push({ x: (x + len - 3) * T + 8, y: gy * T, big: true });
    // o interior fica coberto (parece terra maciça) até alguém quebrar uma das paredes falsas
    L.secrets.push({ x0: x + 1, x1: x + len - 2, y0: gy - 2, y1: gy - 1, wx: [x, x + len - 1] });
    coinRow(x + 4, 3, top - 2);
    addEnemies(x, len, top);
    x += len; sinceCheck += len; secrets++;
    flat(3);                              // a saída do túnel fica sempre no mesmo nível (dá para atravessar)
  };
  // Monte em degraus (sobe 1 tile por vez: todos os heróis passam)
  const hill = () => {
    const hgt = rint(2, 3), plat = rint(3, 6), len = hgt * 2 + plat;
    ground(x, x + len, gy);
    for (let i = 1; i <= hgt; i++) ground(x + i, x + len - i, gy - i);
    coinRow(x + hgt, plat, gy - hgt - 2);
    addEnemies(x + hgt - 2, plat + 4, gy - hgt);
    x += len; sinceCheck += len; hills++;
  };
  // Vale: o chão afunda 2 tiles (moedas e às vezes um baú lá embaixo); sai pulando a parede
  const dip = () => {
    const len = rint(5, 8), fy = gy + 2;
    ground(x, x + len, fy);
    coinRow(x + 1, len - 2, fy - 1);
    if (R() < 0.4) L.chests.push({ x: (x + (len >> 1)) * T + 8, y: fy * T });
    else if (R() < 0.6) crate(x + len - 1, fy);
    addEnemies(x, len, fy);
    x += len; sinceCheck += len;
    flat(2);
  };
  // Prateleira alta: só quem pula duas vezes (arqueiro e dragônico) alcança
  const ledge = () => {
    const len = 11, ty = gy - 6;
    ground(x, x + len, gy);
    oneway(x + 4, 3, ty);
    coinRow(x + 4, 3, ty - 2);
    L.chests.push({ x: (x + 5) * T + 8, y: ty * T });
    clear.push([x, x + len]);
    addEnemies(x, len, gy);
    x += len; sinceCheck += len; ledges++;
  };
  // Ninho de caixas no alto: só quebra quem atira para cima (mago e arqueiro) ou alcança com pulo duplo
  const nest = () => {
    const len = 10, ty = gy - 7;
    ground(x, x + len, gy);
    oneway(x + 3, 4, ty);
    for (let i = 0; i < 4; i++) tiles[ty - 1][x + 3 + i] = 4;
    if (R() < 0.5) tiles[ty - 2][x + 4 + rint(0, 1)] = 4;
    clear.push([x, x + len]);
    addEnemies(x, len, gy);
    x += len; sinceCheck += len; nests++;
  };

  let pickToggle = 0;
  while (x < w - 18) {
    if (sinceCheck > 36) {
      ground(x, x + 7, gy);
      L.checks.push({ x: (x + 3) * T + 8, y: gy * T });
      L.picks.push({ t: pickToggle++ % 2 ? 'mana' : 'heart', x: (x + 5) * T + 8, y: (gy - 2) * T });
      x += 7; sinceCheck = 0;
      continue;
    }
    // toda fase tem pelo menos um túnel secreto (no máximo dois), uma prateleira alta e um ninho de caixas
    if (secrets < 2 && x > 20 && x < w - 34 && sinceCheck < 22 && ((secrets === 0 && x > w * 0.4) || R() < 0.05)) { secret(); continue; }
    if (ledges === 0 && x > w * 0.22 && x < w - 30) { ledge(); continue; }
    if (nests === 0 && x > w * 0.55 && x < w - 30) { nest(); continue; }
    // relevo: montes e vales aparecem em todas as fases (o terreno não fica tão reto)
    if (hills < 2 && x > w * (0.12 + hills * 0.4)) { hill(); continue; }
    if (R() < 0.3) { if (R() < 0.55 || gy + 2 > h - 1) hill(); else dip(); continue; }
    const r = R();
    if (r < def.gaps) {
      const gw = rint(2, 3);
      coinRow(x, gw, gy - 3);
      x += gw;
      const len = rint(5, 8); ground(x, x + len, gy); addEnemies(x, len, gy);
      x += len; sinceCheck += gw + len;
    } else if (r < def.gaps + def.stones) {
      // pulo com pedras flutuantes
      oneway(x + 1, 2, gy - 2); oneway(x + 4, 2, gy - 2 - rint(0, 1));
      coinRow(x + 1, 2, gy - 4); coinRow(x + 4, 2, gy - 4);
      x += 6;
      const len = rint(5, 8); ground(x, x + len, gy); x += len; sinceCheck += 6 + len;
    } else if (r < def.gaps + def.stones + def.spikes) {
      const len = rint(8, 10); ground(x, x + len, gy);
      const k = rint(1, 3), sx = x + 3 + rint(0, 2);
      for (let i = 0; i < k; i++) tiles[gy - 1][sx + i] = 3;
      coinRow(sx - 1, k + 2, gy - 3);
      x += len; sinceCheck += len;
    } else if (r < def.gaps + def.stones + def.spikes + def.plats) {
      const len = rint(11, 14); ground(x, x + len, gy);
      oneway(x + 2, rint(3, 4), gy - 3); oneway(x + 8, rint(3, 4), gy - 3);
      coinRow(x + 2, 3, gy - 4); coinRow(x + 8, 3, gy - 4);
      // baú numa plataforma alta, fora do caminho
      if (R() < 0.3) { oneway(x + 5, 3, gy - 6); L.chests.push({ x: (x + 6) * T + 8, y: (gy - 6) * T }); }
      else if (R() < 0.65) crate(x + len - 2, gy);
      addEnemies(x, len, gy);
      x += len; sinceCheck += len;
    } else {
      const r2 = R();
      if (r2 < 0.24) hill();
      else if (r2 < 0.42 && gy + 2 <= h - 1) dip();
      else if (r2 < 0.48 && ledges < 2) ledge();
      else if (r2 < 0.54 && nests < 2) nest();
      else if (r2 < 0.74) {
        const ng = clamp(gy + (R() < 0.5 ? -1 : 1), GY_MIN, GY_MAX), len = rint(6, 9);
        gy = ng; ground(x, x + len, gy); addEnemies(x, len, gy);
        if (R() < 0.4) crate(x + len - 2, gy);
        x += len; sinceCheck += len;
      } else {
        const len = rint(7, 11); ground(x, x + len, gy);
        coinRow(x + 2, 3, gy - 2);
        if (R() < 0.75) crate(x + rint(5, len - 2), gy);
        addEnemies(x, len, gy);
        x += len; sinceCheck += len;
      }
    }
  }
  ground(x, w, gy);
  // garante algumas caixas por fase: completa em trechos de chão plano, longe do início, do fim, dos checkpoints e dos desafios
  let crates = 0;
  for (const row of tiles) for (const t of row) if (t === 4) crates++;
  const surf = tx => { for (let y = 1; y < h; y++) { const t = tiles[y][tx]; if (t) return t === 1 ? y : -1; } return -1; };
  for (let tries = 0; crates < 8 && tries < 80; tries++) {
    const tx = rint(16, w - 22), g = surf(tx);
    if (g < 3 || surf(tx - 1) !== g || surf(tx + 1) !== g || L.checks.some(c => Math.abs(c.x / T - tx) < 3) || clear.some(([a, b]) => tx >= a - 3 && tx <= b + 2)) continue;
    tiles[g - 1][tx] = 4; crates++;
  }
  L.goal = { x: (w - 6) * T + 8, y: gy * T };
  return L;
}
