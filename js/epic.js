// ---------- Músicas dos chefes (orquestra/coral e rock/metal sintetizados, sem arquivos) ----------
// Dois estilos:
//  · ópera épica (padrão): coral com formantes ("aah"), soprano com vibrato de ópera, cordas em ostinato,
//    metais, tímpanos e sino, num reverb de catedral. Passo = colcheia.
//    chords: [semitom, 'm'|'M'] por compasso · ost: arpejo das cordas (0 fund., 1 terça, 2 quinta, 3/4 = oitava
//    acima; array = juntas; null = pausa) · drums: 'X' tímpano forte, 'x' fraco.
//  · metal (style: 'metal'): guitarra distorcida, baixo e bateria. Passo = semicolcheia (div: 4).
//    chords: semitom do power chord por compasso · riff (16 passos): letra = nota abafada (p fund., q +1,
//    r +3, R +4, s +5, t +6, u +7, v +8, w +10), 'C' = power chord aberto, '-' = segura, '.' = pausa.
//    kick/snare/hat: 'x' por passo · choir: coral sombrio por cima.
// mel (os dois estilos): por compasso, pares [nota, duração em passos] (null = pausa); nas passadas ímpares
// entra a voz solo (soprano / guitarra solo); nas pares, o coral entoa a melodia (só no estilo ópera).
const EPIC_SONGS = {
  // Yeti Ancião: Ré menor, i–bVI–iv–V / i–bII–iv–V (o bII napolitano dá o arrepio)
  epic: {
    vol: 0.56, bpm: 132, root: 147, bar: 8, intro: 2,
    chords: [[0, 'm'], [-4, 'M'], [5, 'm'], [7, 'M'], [0, 'm'], [1, 'M'], [5, 'm'], [7, 'M']],
    mel: [
      [[24, 4], [22, 2], [19, 2]], [[20, 4], [22, 2], [24, 2]], [[27, 3], [26, 1], [24, 4]], [[23, 4], [26, 2], [23, 2]],
      [[24, 2], [27, 2], [31, 4]], [[32, 4], [31, 2], [29, 2]], [[27, 4], [26, 2], [24, 2]], [[23, 6], [null, 2]],
    ],
    ost: [0, 3, 2, 3, 1, 3, 2, 3],
    drums: 'X..X..X.',
  },
  // Conde Sanguinário: valsa gótica em Mi menor (3/4), com órgão de tubos
  epicVampire: {
    vol: 0.60, bpm: 168, root: 165, bar: 6, intro: 2, organ: true,
    chords: [[0, 'm'], [-4, 'M'], [5, 'm'], [7, 'M'], [0, 'm'], [1, 'M'], [5, 'm'], [7, 'M']],
    mel: [
      [[31, 2], [27, 2], [24, 2]], [[32, 3], [31, 1], [27, 2]], [[29, 2], [24, 2], [20, 2]], [[23, 4], [19, 2]],
      [[24, 2], [27, 2], [31, 2]], [[32, 3], [29, 1], [25, 2]], [[20, 2], [24, 2], [29, 2]], [[26, 2], [23, 2], [19, 2]],
    ],
    ost: [0, null, [1, 2], null, [1, 2], null],
    drums: 'X.....',
  },
  // Titã da Tempestade (chefe final): Si frígio; da segunda volta em diante entram guitarras e bumbo duplo
  epicFinal: {
    vol: 0.39, bpm: 168, root: 123, bar: 8, intro: 2, gtr: true,
    chords: [[0, 'm'], [1, 'M'], [0, 'm'], [-2, 'M'], [-4, 'M'], [7, 'M'], [0, 'm'], [1, 'M']],
    mel: [
      [[31, 4], [29, 2], [27, 2]], [[32, 4], [29, 2], [25, 2]], [[27, 2], [24, 2], [31, 4]], [[29, 4], [26, 2], [22, 2]],
      [[27, 4], [24, 2], [20, 2]], [[23, 4], [26, 2], [31, 2]], [[36, 4], [34, 2], [31, 2]], [[32, 6], [null, 2]],
    ],
    ost: [0, 3, 1, 3, 2, 3, 1, 3],
    drums: 'X.xX.xX.',
  },
  // Rei Golem: doom metal lento e pesado, com coral de pedra ao fundo (Mi)
  metalGolem: {
    vol: 0.69, style: 'metal', bpm: 84, div: 4, root: 82.4, bar: 16, intro: 1, choir: true, verb: 0.5,
    chords: [0, 3, 1, -2],
    riff: 'C-------p.p.C---',
    kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x...x...x...x...',
    mel: [
      [[31, 8], [29, 4], [27, 4]], [[27, 8], [26, 4], [24, 4]], [[25, 12], [24, 4]], [[22, 8], [24, 4], [23, 4]],
    ],
  },
  // Rei Gosma: rock com groove, meio debochado (Lá, pentatônica com blue note)
  rockSlime: {
    vol: 0.80, style: 'metal', bpm: 138, div: 4, root: 110, bar: 16, intro: 1, verb: 0.25, drive: 4,
    chords: [0, 3, 5, 3],
    riff: 'C---p.p.C---r.s.',
    kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.',
    mel: [
      [[24, 2], [27, 2], [29, 4], [27, 2], [24, 2], [22, 4]], [[27, 4], [29, 2], [31, 2], [34, 4], [31, 4]],
      [[29, 2], [31, 2], [29, 2], [27, 2], [24, 8]], [[22, 4], [24, 4], [27, 4], [28, 4]],
    ],
  },
  // Escorpião Imperador: metal "oriental" em Mi frígio dominante, com galope
  metalScorp: {
    vol: 0.56, style: 'metal', bpm: 150, div: 4, root: 82.4, bar: 16, intro: 1, verb: 0.35,
    chords: [0, 1, -2, 1],
    riff: 'p.ppp.ppq.qqC---',
    kick: 'x.xxx.xxx.xxx...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.',
    mel: [
      [[24, 2], [25, 2], [28, 4], [29, 2], [28, 2], [25, 4]], [[25, 4], [28, 2], [29, 2], [31, 4], [29, 2], [28, 2]],
      [[22, 4], [24, 2], [25, 2], [24, 8]], [[28, 2], [29, 2], [31, 2], [32, 2], [31, 4], [28, 2], [25, 2]],
    ],
  },
  // Dragão de Magma: thrash veloz com bumbo duplo e coral dramático (Ré menor harmônico)
  metalDragon: {
    vol: 0.48, style: 'metal', bpm: 176, div: 4, root: 73.4, bar: 16, intro: 1, choir: true, verb: 0.3,
    chords: [0, 3, -2, 1],
    riff: 'pqpppqpppqppC-u-',
    kick: 'xxxxxxxxxxxxxxxx', snare: '....x.......x...', hat: 'x...x...x...x...',
    mel: [
      [[24, 2], [27, 2], [31, 2], [36, 2], [34, 2], [31, 2], [27, 2], [24, 2]], [[27, 4], [31, 4], [34, 4], [32, 4]],
      [[34, 4], [31, 4], [29, 4], [27, 4]], [[32, 6], [29, 2], [25, 4], [23, 4]],
    ],
  },
};

const Epic = (() => {
  // formantes da vogal "a": coral masculino e soprano  [frequência, Q, ganho]
  const MALE = [[650, 7, 1], [1080, 8, 0.55], [2650, 9, 0.3]];
  const SOPR = [[900, 5, 1], [1350, 7, 0.5], [2900, 8, 0.35]];
  const RIFF = { p: 0, q: 1, r: 3, R: 4, s: 5, t: 6, u: 7, v: 8, w: 10 };
  const verbs = new WeakMap(), noises = new WeakMap();
  let skip = {};                                                // (testes) partes desligadas na renderização

  function reverb(ctx, out) {
    let v = verbs.get(out);
    if (v) return v;
    const len = ctx.sampleRate * 2.4 | 0, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const cv = ctx.createConvolver(), wet = ctx.createGain();
    cv.buffer = b; wet.gain.value = 0.6;
    cv.connect(wet); wet.connect(out);
    verbs.set(out, cv);
    return cv;
  }
  function noiseBuf(ctx) {
    let b = noises.get(ctx);
    if (b) return b;
    const n = ctx.sampleRate | 0; b = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    noises.set(ctx, b);
    return b;
  }
  // envelope: ataque, sustenta até t+d, solta em rel
  function env(ctx, t, d, vol, att, rel) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.setValueAtTime(vol, t + Math.max(att, d));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(att, d) + rel);
    return g;
  }
  function osc(ctx, type, f, t, end, detune = 0) {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = f; o.detune.value = detune;   // sem automação: caminho rápido do navegador
    o.start(t); o.stop(end);
    return o;
  }
  function noise(ctx, bus, t, d, vol, type, freq, q = 1) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(ctx); f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
  }

  // Vibrato barato: uma linha de atraso com o tempo oscilando (modular a afinação dos osciladores
  // direto obriga o navegador a recalcular cada amostra e pesa demais). Entra devagar, como na ópera.
  function vibrato(ctx, t, d, end, cents, rate) {
    const dl = ctx.createDelay(0.05), lfo = osc(ctx, 'sine', rate, t, end), lg = ctx.createGain();
    const depth = cents / 1731 / (2 * Math.PI * rate);           // amplitude do atraso (s) para ±cents
    dl.delayTime.value = 0.004;
    lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + Math.min(0.12, d * 0.3));
    lg.gain.linearRampToValueAtTime(depth, t + Math.min(0.5, d * 0.7));
    lfo.connect(lg); lg.connect(dl.delayTime);
    return dl;
  }

  // ===== orquestra =====
  // Voz (coral ou soprano): uma ou mais alturas, serras desafinadas → um só banco de formantes,
  // com vibrato que entra devagar
  function voice(ctx, bus, fs, t, d, vol, form, vib, n = 2) {
    if (!skip.voice) voiceRaw(ctx, bus, fs, t, d, vol, form, vib, n);
  }
  function voiceRaw(ctx, bus, fs, t, d, vol, form, vib, n = 2) {
    const att = form === SOPR ? 0.07 : 0.22, rel = form === SOPR ? 0.35 : 0.6, end = t + d + rel + 0.05;
    const g = env(ctx, t, d, vol, att, rel), mix = ctx.createGain(), vb = vibrato(ctx, t, d, end, vib, 5.2 + Math.random() * 0.6);
    for (const f of [].concat(fs)) for (let i = 0; i < n; i++)
      osc(ctx, 'sawtooth', f, t, end, (i - (n - 1) / 2) * 12 + (Math.random() - 0.5) * 4).connect(mix);
    mix.connect(vb);
    for (const [ff, q, gg] of form) {
      const bp = ctx.createBiquadFilter(), fg = ctx.createGain();
      bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = q; fg.gain.value = gg * 2.2;
      vb.connect(bp); bp.connect(fg); fg.connect(g);
    }
    g.connect(bus);
  }
  function strings(ctx, bus, f, t, d, vol, cut = 2400) {
    if (skip.strings) return;
    if (cut === 2400 && sampled(ctx, bus, 'str', f, t, d, vol, 0.1)) return;
    stringsRaw(ctx, bus, f, t, d, vol, cut);
  }
  function stringsRaw(ctx, bus, f, t, d, vol, cut = 2400) {
    const g = env(ctx, t, d, vol, 0.012, 0.12), lp = ctx.createBiquadFilter(), end = t + d + 0.2;
    lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = 0.8;
    for (const dt of [-8, 7]) osc(ctx, 'sawtooth', f, t, end, dt).connect(lp);
    lp.connect(g); g.connect(bus);
  }
  function brass(ctx, bus, f, t, d, vol) {
    if (skip.brass) return;
    if (!sampled(ctx, bus, 'brass', f, t, d, vol, 0.25)) brassRaw(ctx, bus, f, t, d, vol);
  }
  function brassRaw(ctx, bus, f, t, d, vol) {
    const g = env(ctx, t, d, vol, 0.06, 0.25), lp = ctx.createBiquadFilter(), end = t + d + 0.3;
    lp.type = 'lowpass'; lp.Q.value = 1.5;
    lp.frequency.setValueAtTime(220, t);
    lp.frequency.linearRampToValueAtTime(1500, t + 0.14);
    lp.frequency.exponentialRampToValueAtTime(650, t + Math.max(0.2, d));
    for (const dt of [-5, 5]) osc(ctx, 'sawtooth', f, t, end, dt).connect(lp);
    lp.connect(g); g.connect(bus);
  }
  function organ(ctx, bus, f, t, d, vol) {
    if (skip.organ) return;
    const g = env(ctx, t, d, vol, 0.05, 0.4), end = t + d + 0.5;
    [[0.5, 0.6], [1, 1], [2, 0.5], [3, 0.25], [4, 0.2]].forEach(([m, a]) => {
      const pg = ctx.createGain(); pg.gain.value = a;
      osc(ctx, 'sine', f * m, t, end).connect(pg); pg.connect(g);
    });
    g.connect(bus);
  }
  function timp(ctx, bus, f, t, vol) {
    if (skip.timp) return;
    if (!sampled(ctx, bus, 'timp', f, t, null, vol)) timpRaw(ctx, bus, f, t, vol);
  }
  function timpRaw(ctx, bus, f, t, vol) {
    const o = osc(ctx, 'sine', f * 1.5, t, t + 1.3), g = ctx.createGain();
    o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(g); g.connect(bus);
    noise(ctx, bus, t, 0.25, vol * 0.9, 'lowpass', 500);
  }
  function bell(ctx, bus, f, t, vol) {
    if (skip.bell) return;
    [[1, 1, 4], [2.76, 0.45, 2.4], [5.4, 0.25, 1.3], [8.9, 0.12, 0.7]].forEach(([m, a, dec]) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * a, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      osc(ctx, 'sine', f * m, t, t + dec + 0.05).connect(g); g.connect(bus);
    });
  }

  // ===== banda =====
  // Cadeias de distorção compartilhadas (uma para a base, outra para o solo), criadas por música
  function amp(ctx, bus, key, drive, cut, out) {
    bus.amps = bus.amps || {};
    if (bus.amps[key]) return bus.amps[key];
    const inp = ctx.createGain(), hp = ctx.createBiquadFilter(), sh = ctx.createWaveShaper(), cab = ctx.createBiquadFilter(), mid = ctx.createBiquadFilter(), g = ctx.createGain();
    const N = 1024, curve = new Float32Array(N);
    for (let i = 0; i < N; i++) { const x = i / (N - 1) * 2 - 1; curve[i] = Math.tanh(x * drive) / Math.tanh(drive); }
    hp.type = 'highpass'; hp.frequency.value = 70;
    sh.curve = curve;
    mid.type = 'peaking'; mid.frequency.value = 800; mid.Q.value = 0.8; mid.gain.value = -5;   // "scoop" do metal
    cab.type = 'lowpass'; cab.frequency.value = cut; cab.Q.value = 0.9;
    g.gain.value = out;
    inp.connect(hp); hp.connect(sh); sh.connect(mid); mid.connect(cab); cab.connect(g); g.connect(bus);
    return (bus.amps[key] = inp);
  }
  // guitarra base: nota abafada (palm mute) ou power chord aberto (fundamental, quinta, oitava).
  // O sinal limpo vem do sampler; a distorção é uma só, compartilhada.
  function guitar(ctx, bus, s, f, t, d, chord, mute) {
    if (skip.guitar) return;
    const inp = amp(ctx, bus, 'base', s.drive || 9, 3200, 0.075);
    if (!sampled(ctx, inp, chord ? 'chord' : 'mute', f, t, mute ? null : d, 1, 0.18)) guitarRaw(ctx, inp, f, t, d, chord, mute);
  }
  function guitarRaw(ctx, inp, f, t, d, chord, mute) {
    const g = env(ctx, t, d, 1, 0.003, mute ? 0.04 : 0.18), end = t + d + 0.25;
    let dst = g;
    if (mute) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.connect(g); dst = lp; }
    for (const m of chord ? [1, 1.5, 2] : [1]) for (const dt of [-7, 7]) osc(ctx, 'sawtooth', f * m, t, end, dt).connect(dst);
    g.connect(inp);
  }
  // guitarra solo: puxada de nota no ataque e vibrato
  function lead(ctx, bus, f, t, d, vol) {
    if (skip.lead) return;
    const inp = amp(ctx, bus, 'lead', 5, 3800, 0.05);
    const g = env(ctx, t, d, vol, 0.01, 0.15), end = t + d + 0.2, vb = vibrato(ctx, t, d, end, 30, 6);
    for (const dt of [-4, 4]) {
      const o = osc(ctx, 'sawtooth', f, t, end, dt);
      o.detune.setValueAtTime(dt - 70, t); o.detune.linearRampToValueAtTime(dt, t + 0.05);   // puxada de nota
      o.connect(vb);
    }
    vb.connect(g); g.connect(inp);
  }
  function bass(ctx, bus, f, t, d, vol) {
    if (skip.bass) return;
    if (!sampled(ctx, bus, 'bass', f, t, d, vol, 0.08)) bassRaw(ctx, bus, f, t, d, vol);
  }
  function bassRaw(ctx, bus, f, t, d, vol) {
    const g = env(ctx, t, d, vol, 0.005, 0.08), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 420;
    osc(ctx, 'sawtooth', f, t, t + d + 0.12).connect(lp); lp.connect(g); g.connect(bus);
  }
  function kickRaw(ctx, bus, t, vol) {
    const o = osc(ctx, 'sine', 160, t, t + 0.3), g = ctx.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.09);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    o.connect(g); g.connect(bus);
    noise(ctx, bus, t, 0.015, vol * 0.4, 'highpass', 2500);
  }
  function snareRaw(ctx, bus, t, vol) {
    noise(ctx, bus, t, 0.18, vol, 'bandpass', 1900, 0.7);
    const o = osc(ctx, 'triangle', 210, t, t + 0.12), g = ctx.createGain();
    o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
    g.gain.setValueAtTime(vol * 0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g); g.connect(bus);
  }
  const hatRaw = (ctx, bus, t, vol) => noise(ctx, bus, t, 0.04, vol, 'highpass', 7500);
  const crashRaw = (ctx, bus, t, vol) => noise(ctx, bus, t, 1.4, vol, 'highpass', 4500);
  const drum = (key, raw) => (ctx, bus, t, vol) => skip.drums || sampled(ctx, bus, key, 1, t, null, vol) || raw(ctx, bus, t, vol);
  const kick = drum('kick', kickRaw), snare = drum('snare', snareRaw), hat = drum('hat', hatRaw), crash = drum('crash', crashRaw);

  // ===== sampler =====
  // Notas repetidas (cordas, guitarra base, baixo, bateria, tímpano) são sintetizadas uma vez num buffer e
  // depois só tocadas, mudando a velocidade para a altura: bem mais leve para o celular.
  // [chave, frequência de referência, duração do buffer, como sintetizar]
  const SAMPLES = [
    ['str', 220, 0.75, (c, d) => stringsRaw(c, d, 220, 0, 0.6, 1)],
    ['mute', 82.4, 0.3, (c, d) => guitarRaw(c, d, 82.4, 0, 0.2, false, true)],
    ['chord', 82.4, 3.2, (c, d) => guitarRaw(c, d, 82.4, 0, 3, true, false)],
    ['bass', 41.2, 3.2, (c, d) => bassRaw(c, d, 41.2, 0, 3, 1)],
    ['brass', 147, 3.6, (c, d) => brassRaw(c, d, 147, 0, 3.3, 1)],
    ['timp', 73.4, 1.4, (c, d) => timpRaw(c, d, 73.4, 0, 1)],
    ['kick', 1, 0.32, (c, d) => kickRaw(c, d, 0, 1)],
    ['snare', 1, 0.24, (c, d) => snareRaw(c, d, 0, 1)],
    ['hat', 1, 0.06, (c, d) => hatRaw(c, d, 0, 1)],
    ['crash', 1, 1.45, (c, d) => crashRaw(c, d, 0, 1)],
  ];
  const banks = {};                                             // por taxa de amostragem
  function prepare(rate) {
    if (banks[rate]) return banks[rate].ready;
    const bank = banks[rate] = {};
    try {
      bank.ready = Promise.all(SAMPLES.map(([key, ref, len, fn]) => {
        const c = new OfflineAudioContext(1, rate * len | 0, rate);
        fn(c, c.destination);
        return c.startRendering().then(buf => { bank[key] = { buf, ref }; });
      })).catch(() => {});
    } catch (e) { bank.ready = Promise.resolve(); }             // sem OfflineAudioContext: tudo ao vivo
    return bank.ready;
  }
  // toca o buffer `key` (se já estiver pronto); d = corta a nota em d segundos (null = buffer inteiro)
  function sampled(ctx, dst, key, f, t, d, vol, rel = 0.05) {
    const bank = banks[ctx.sampleRate], B = bank && bank[key];
    if (!B) return false;
    const s = ctx.createBufferSource(), g = ctx.createGain(), rate = f / B.ref;
    s.buffer = B.buf; s.playbackRate.value = rate;
    g.gain.setValueAtTime(vol, t);
    let end = t + B.buf.duration / rate;
    if (d != null && t + d + rel < end) { g.gain.setValueAtTime(vol, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + rel); end = t + d + rel; }
    s.connect(g); g.connect(dst);
    s.start(t); s.stop(end + 0.01);
    return true;
  }

  // ===== coral pré-gravado =====
  // Os acordes do coral de cada música são poucos e sempre iguais: na hora da luta, cada um é gravado
  // uma vez (nas alturas exatas, sem distorcer a vogal) e depois só tocado.
  const stepDur = s => s.div ? 60 / s.bpm / s.div : 30 / s.bpm;
  const choirDur = s => s.bar * stepDur(s) * 0.95;
  function choirFs(s, ci) {
    const n = x => s.root * Math.pow(2, x / 12);
    if (s.style === 'metal') { const r = s.chords[ci]; return [r, r + 3, r + 7].map(x => n(x + 24)); }
    const ch = s.chords[ci], c = [ch[0], ch[0] + (ch[1] === 'M' ? 4 : 3), ch[0] + 7];
    return c.map(x => n((x > 6 ? x - 12 : x) + 12));
  }
  const choirKey = fs => fs.map(f => f.toFixed(1)).join(',');
  function prepareSong(s, rate) {
    const bank = banks[rate];
    if (!bank || (!s.choir && s.style === 'metal')) return Promise.resolve();
    const songs = bank.songs = bank.songs || new Map();
    if (songs.has(s)) return songs.get(s).ready;
    const entry = { bufs: {} }, d = choirDur(s), vib = s.style === 'metal' ? 12 : 14, seen = new Set();
    songs.set(s, entry);
    try {
      entry.ready = Promise.all(s.chords.map((_, ci) => {
        const fs = choirFs(s, ci), key = choirKey(fs);
        if (seen.has(key)) return null;
        seen.add(key);
        const c = new OfflineAudioContext(1, rate * (d + 0.75) | 0, rate);
        voiceRaw(c, c.destination, fs, 0, d, 1, MALE, vib);
        return c.startRendering().then(buf => { entry.bufs[key] = buf; });
      })).catch(() => {});
    } catch (e) { entry.ready = Promise.resolve(); }
    return entry.ready;
  }
  function choirChord(ctx, bus, s, ci, t, vol) {
    if (skip.voice) return;
    const fs = choirFs(s, ci), bank = banks[ctx.sampleRate], e = bank && bank.songs && bank.songs.get(s), buf = e && e.bufs[choirKey(fs)];
    if (!buf) return voiceRaw(ctx, bus, fs, t, choirDur(s), vol, MALE, s.style === 'metal' ? 12 : 14);
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; g.gain.value = vol;
    src.connect(g); g.connect(bus); src.start(t);
  }

  // ===== sequenciadores =====
  const melAt = (bar, pos) => { let p = 0; for (const [note, len] of bar) { if (p === pos) return note == null ? null : [note, len]; p += len; } return null; };

  // Uma colcheia da música orquestral (passo global `step`, no instante `t`)
  function tickEpic(ctx, bus, s, step, t, dt) {
    const spb = s.bar, bar = Math.floor(step / spb), pos = step % spb;
    const n = x => s.root * Math.pow(2, x / 12);
    const tri = c => [c[0], c[0] + (c[1] === 'M' ? 4 : 3), c[0] + 7];
    if (bar < s.intro) {                                           // introdução: coral sombrio e rufar crescente
      const c = tri(s.chords[0]);
      if (step === 0) {
        timp(ctx, bus, n(-12), t, 0.5); bell(ctx, bus, n(24), t, 0.06);
        voice(ctx, bus, [n(c[0]), ...c.map(x => n(x + 12))], t, spb * s.intro * dt, 0.05, MALE, 14);
        brass(ctx, bus, n(c[0] - 12), t, spb * s.intro * dt * 0.9, 0.06);
      }
      if (bar === s.intro - 1) {
        const k = pos / spb;
        timp(ctx, bus, n(-12), t, 0.12 + 0.3 * k);
        timp(ctx, bus, n(-12), t + dt / 2, 0.1 + 0.3 * k);
      }
      return;
    }
    const b = bar - s.intro, L = s.chords.length, ci = b % L, pass = Math.floor(b / L);
    const ch = s.chords[ci], c = tri(ch), root = ch[0] > 6 ? ch[0] - 12 : ch[0];
    const T = spb * dt, heavy = s.gtr && pass >= 1;
    if (pos === 0) {
      // coral sustentando o acorde e o baixo (contrabaixos + metais graves)
      choirChord(ctx, bus, s, ci, t, 0.055);
      strings(ctx, bus, n(root - 12), t, T * 0.95, 0.07, 700);
      brass(ctx, bus, n(root), t, T * (ci % 2 ? 0.5 : 0.85), pass % 2 ? 0.055 : 0.04);
      brass(ctx, bus, n(root + 7), t, T * (ci % 2 ? 0.5 : 0.85), pass % 2 ? 0.04 : 0.03);
      if (s.organ) organ(ctx, bus, n(root + 12), t, T * 0.95, 0.025);
      if (ci === 0 || ci === 4) bell(ctx, bus, n(root + 24), t, 0.05);
      if (heavy && ci === 0) crash(ctx, bus, t, 0.08);
    }
    // cordas em ostinato
    const o = s.ost[pos];
    if (o != null) [].concat(o).forEach(i => strings(ctx, bus, n(c[i % 3] + 12 * (i >= 3) + (c[i % 3] > 6 ? 0 : 12)), t, dt * 0.85, s.organ ? 0.03 : 0.04));
    // chefe final: guitarras e bumbo duplo a partir da segunda volta
    if (heavy) {
      guitar(ctx, bus, s, n(root - 12), t, dt * (pos % 4 === 0 ? 0.9 : 0.5), pos % 4 === 0, pos % 4 !== 0);
      kick(ctx, bus, t, 0.3); kick(ctx, bus, t + dt / 2, 0.22);
      if (pos % 4 === 2) snare(ctx, bus, t, 0.22);
    }
    // melodia: coral masculino entoando (passadas pares) e soprano de ópera (passadas ímpares)
    const m = melAt(s.mel[ci], pos);
    if (m) {
      const [note, len] = m;
      if (pass % 2) voice(ctx, bus, n(note), t, len * dt * 0.98, 0.065, SOPR, 38, 2);
      else voice(ctx, bus, [n(note - 12), n(note - 24)], t, len * dt * 0.98, 0.05, MALE, 16);
    }
    // tímpanos (e rufar no fim da frase)
    const dr = s.drums[pos];
    if (dr === 'X') timp(ctx, bus, n(root - 12), t, 0.42);
    else if (dr === 'x') timp(ctx, bus, n(root - 12), t, 0.2);
    if (ci === L - 1 && pos >= spb - 3) timp(ctx, bus, n(-12), t + dt / 2, 0.2 + 0.08 * (pos - spb + 3));
  }

  // Uma semicolcheia da música de rock/metal
  function tickMetal(ctx, bus, s, step, t, dt) {
    const spb = s.bar, bar = Math.floor(step / spb), pos = step % spb;
    const n = x => s.root * Math.pow(2, x / 12);
    if (bar < s.intro) {                                           // introdução: acorde soando + virada de caixa
      if (pos === 0) { guitar(ctx, bus, s, n(s.chords[0]), t, spb * dt * 0.9, true, false); crash(ctx, bus, t, 0.09); kick(ctx, bus, t, 0.4); }
      if (pos >= spb - 6) snare(ctx, bus, t, 0.14 + 0.03 * (pos - spb + 6));
      return;
    }
    const b = bar - s.intro, L = s.chords.length, ci = b % L, pass = Math.floor(b / L);
    const r = s.chords[ci];
    // riff: segura a nota enquanto vier '-'
    const ch = s.riff[pos];
    if (ch !== '.' && ch !== '-') {
      let hold = 1; while (pos + hold < spb && s.riff[pos + hold] === '-') hold++;
      const open = ch === 'C', f = n(r + (open ? 0 : RIFF[ch] || 0));
      guitar(ctx, bus, s, f, t, dt * (open ? hold * 0.95 : 0.7), open, !open);
      bass(ctx, bus, f / 2, t, dt * (open ? hold * 0.9 : 0.7), 0.16);
    }
    if (s.kick[pos] === 'x') kick(ctx, bus, t, 0.42);
    if (s.snare[pos] === 'x') snare(ctx, bus, t, 0.26);
    if (s.hat[pos] === 'x') hat(ctx, bus, t, pos % 4 ? 0.035 : 0.06);
    if (pos === 0 && (ci === 0 || ci === 2)) crash(ctx, bus, t, ci === 0 ? 0.08 : 0.05);
    if (ci === L - 1 && pos >= spb - 4) snare(ctx, bus, t, 0.2);   // virada no fim da frase
    if (pos === 0 && s.choir) {
      choirChord(ctx, bus, s, ci, t, 0.045);
    }
    // solo de guitarra nas passadas ímpares
    const m = pass % 2 ? melAt(s.mel[ci], pos) : null;
    if (m) lead(ctx, bus, n(m[0]), t, m[1] * dt * 0.95, 0.9);
  }

  const tick = (ctx, bus, s, step, t, dt) => (s.style === 'metal' ? tickMetal : tickEpic)(ctx, bus, s, step, t, dt);
  function makeBus(ctx, out, s) {
    const bus = ctx.createGain(), send = ctx.createGain();
    bus.gain.value = s.vol || 1;                                 // volume da música (perto das músicas das fases)
    send.gain.value = s.verb == null ? 1 : s.verb;
    bus.connect(out); bus.connect(send); send.connect(reverb(ctx, out));
    return bus;
  }

  // Começa a tocar ao vivo (assim que os samples estiverem prontos); devolve { stop }
  function start(ctx, out, s) {
    const bus = makeBus(ctx, out, s), dt = stepDur(s);
    let timer = null, stopped = false;
    prepare(ctx.sampleRate).then(() => prepareSong(s, ctx.sampleRate)).then(() => {
      if (stopped) return;
      let step = 0, next = ctx.currentTime + 0.06;
      timer = setInterval(() => {
        while (next < ctx.currentTime + 0.15) { tick(ctx, bus, s, step++, next, dt); next += dt; }
      }, 25);
    });
    return {
      stop() {
        stopped = true;
        clearInterval(timer);
        bus.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
        setTimeout(() => bus.disconnect(), 1500);
      },
    };
  }
  // Renderiza fora de tempo real (testes / exportar): devolve Promise<AudioBuffer>
  async function render(name, secs, rate = 44100, off = {}) {
    if (!off.raw) { await prepare(rate); await prepareSong(EPIC_SONGS[name], rate); }
    const s = EPIC_SONGS[name], ctx = new OfflineAudioContext(2, rate * secs | 0, rate), out = ctx.createGain();
    const bank = banks[rate];
    if (off.raw) delete banks[rate];
    skip = off;
    out.gain.value = 0.22; out.connect(ctx.destination);
    const bus = makeBus(ctx, out, s), dt = stepDur(s);
    // agenda aos poucos (como ao vivo), pausando a renderização a cada 0,25 s
    let step = 0, next = 0.05;
    const feed = until => { while (next < Math.min(until, secs - 0.1)) { tick(ctx, bus, s, step++, next, dt); next += dt; } };
    feed(0.4);
    for (let q = 0.25; q < secs - 0.3; q += 0.25) ctx.suspend(q).then(() => { const sk = skip; skip = off; feed(q + 0.4); skip = sk; ctx.resume(); });
    try { return await ctx.startRendering(); } finally { skip = {}; if (off.raw && bank) banks[rate] = bank; }
  }
  return { start, render, prepare };
})();
