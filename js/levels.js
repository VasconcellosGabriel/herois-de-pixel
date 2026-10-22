'use strict';
// ---------- Fases ----------
// Para adicionar uma fase nova, basta incluir um objeto aqui.
// Tiles: 0 vazio, 1 sólido, 2 plataforma de mão única, 3 espinhos
const LEVELS = [
  { id: 'floresta', name: 'Floresta Sussurrante', theme: 'forest', len: 120, seed: 101,
    enemies: ['slime', 'slime', 'bat', 'plant'], density: 0.55, gaps: 0.18, stones: 0.1, spikes: 0.08, plats: 0.25 },
  { id: 'caverna', name: 'Cavernas de Cristal', theme: 'cave', len: 140, seed: 202,
    enemies: ['slime', 'bat', 'skeleton', 'ghost', 'ghost'], density: 0.65, gaps: 0.2, stones: 0.14, spikes: 0.14, plats: 0.22 },
  { id: 'castelo', name: 'Castelo Sombrio', theme: 'castle', len: 160, seed: 303,
    enemies: ['skeleton', 'knight', 'bat', 'guard', 'guard'], density: 0.7, gaps: 0.2, stones: 0.14, spikes: 0.16, plats: 0.2 },
  { id: 'golem', name: 'Covil do Rei Golem', theme: 'boss', len: 36, seed: 404, boss: 'golem' },
];

function genLevel(def) {
  const R = rng(def.seed), w = def.len, h = 12;
  const tiles = Array.from({ length: h }, () => new Uint8Array(w));
  const L = { w, h, tiles, theme: def.theme, spawns: [], coins: [], picks: [], checks: [], goal: null, start: null };
  const ground = (x0, x1, g) => { for (let x = x0; x < x1 && x < w; x++) for (let y = g; y < h; y++) tiles[y][x] = 1; };
  const rint = (a, b) => a + Math.floor(R() * (b - a + 1));
  const coinRow = (tx, n, ty) => { for (let i = 0; i < n; i++) L.coins.push({ x: (tx + i) * T + 8, y: ty * T + 8 }); };
  const oneway = (x0, n, ty) => { for (let i = 0; i < n; i++) tiles[ty][x0 + i] = 2; };

  // ---- Arena do chefe ----
  if (def.boss) {
    const gy = 9;
    ground(0, w, gy);
    for (let y = 0; y < h; y++) { tiles[y][0] = 1; tiles[y][1] = 1; tiles[y][w - 2] = 1; tiles[y][w - 1] = 1; }
    oneway(6, 4, gy - 3); oneway(w - 10, 4, gy - 3);
    oneway(15, 6, gy - 3);
    L.start = { x: 5 * T, y: gy * T };
    L.spawns.push({ t: def.boss, x: (w - 8) * T, y: gy * T });
    L.bossGate = 10 * T;
    return L;
  }

  // ---- Fase normal ----
  let gy = 9, x = 12, sinceCheck = 0;
  ground(0, 12, gy);
  L.start = { x: 3 * T, y: gy * T };

  const addEnemies = (x0, len, g) => {
    const n = Math.round(R() * def.density * 3);
    for (let i = 0; i < n; i++) {
      const type = def.enemies[Math.floor(R() * def.enemies.length)];
      const tx = x0 + 3 + Math.floor(R() * Math.max(1, len - 5));
      if (type === 'bat' || type === 'ghost') L.spawns.push({ t: type, x: tx * T + 8, y: (g - 3 - rint(0, 1)) * T });
      else L.spawns.push({ t: type, x: tx * T + 8, y: g * T });
    }
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
      addEnemies(x, len, gy);
      x += len; sinceCheck += len;
    } else if (R() < 0.35) {
      const ng = clamp(gy + (R() < 0.5 ? -1 : 1), 7, 10), len = rint(6, 9);
      gy = ng; ground(x, x + len, gy); addEnemies(x, len, gy);
      x += len; sinceCheck += len;
    } else {
      const len = rint(7, 11); ground(x, x + len, gy);
      coinRow(x + 2, 3, gy - 2); addEnemies(x, len, gy);
      x += len; sinceCheck += len;
    }
  }
  ground(x, w, gy);
  L.goal = { x: (w - 6) * T + 8, y: gy * T };
  return L;
}
