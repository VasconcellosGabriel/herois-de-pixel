'use strict';
// ---------- A história em HQ (roteiro completo em HISTORIA.md) ----------
// Cada cena: id, cap (capítulo na galeria), titulo, antes (id da fase: aparece antes dela) ou depois (id da fase do
// chefe: aparece ao vencê-lo), paginas: [{ layout, quadros: [...] }]. Ver js/hq.js para os campos dos quadros.
// Atores: G M A D = heróis (o do jogador entra no lugar da classe dele) · B = Sir Bertrand · chefes, inimigos e objetos
// pelo nome (golem, dragao, conde, tita, cavaleiro, falcao, cristal, tumulo...).
// Texto: @G = nome do herói · {G:masculino|feminino} · { guerreiro: '...', mago: '...', arqueiro: '...', dragonico: '...' }
const POV = (guerreiro, mago, arqueiro, dragonico) => ({ t: { guerreiro, mago, arqueiro, dragonico }, pos: 'base' });
const HIST = [
  // ===================== PRÓLOGO =====================
  { id: 'prologo', cap: 'Prólogo', titulo: 'A Noite do Primeiro Trovão', antes: 'floresta', seed: 1, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'forest', tom: 'noite', cam: 40, atores: [{ who: 'cavaleiro', x: 0.3 }, { who: 'carroca', x: 0.55 }, { who: 'cristal', x: 0.55, y: 0.66, aura: 'rgba(120,230,255,.55)' }, { who: 'cavaleiro', x: 0.8, f: 2 }],
        cap: ['Floresta Sussurrante. Há dezoito anos, nesta mesma noite, a aldeia de Vila Brasa foi engolida pelo fogo.', { t: 'Esta noite, um comboio da Academia leva embora o Coração de Cristal.', pos: 'baseDir' }] },
      { bg: 'forest', tom: 'noite', cam: 140, atores: [{ who: 'G', x: 0.3 }, { who: 'tumulo', x: 0.7, flores: true }],
        cap: { t: '@G, escudeir{G:o|a} da Ordem da Espada Rubra. Amanhã seria sagrad{G:o|a}.', larg: 250 },
        falas: [{ who: 'G', t: 'Trouxe flores, caçula. O pai não pode mais vir... então vim eu.', pos: [0.56, 0.05], larg: 200 }] },
      { bg: '#2a2050', fx: ['reticula'], atores: [{ who: 'M', rosto: true, x: 0.26, s: 3 }, { who: 'bussola', x: 0.86, y: 0.94, s: 1, aura: 'rgba(120,230,255,.6)' }],
        cap: '@M, aprendiz do Arquimago Corvalis.',
        falas: [{ who: 'M', t: '"Fique longe da Cidadela esta noite." Por quê, mestre?' }] },
    ] },
    { layout: 'tresB', quadros: [
      { bg: 'forest', tom: 'noite', cam: 220, atores: [{ who: 'A', x: 0.22, pose: 'aim' }, { who: 'falcao', x: 0.4, y: 0.6 }],
        cap: '@A, {A:Guardião|Guardiã} do Bosque. Esta noite seria a vigília sob a Árvore Anciã.',
        falas: [{ who: 'A', t: 'Esse cristal não sai da minha floresta, Vento.' }] },
      { bg: '#3a1010', fx: ['reticula'], atores: [{ who: 'D', rosto: true, x: 0.3, s: 3 }],
        cap: '@D voltou sozinh{D:o|a} à "noite de lembrar".',
        falas: [{ who: 'D', pensa: true, t: 'Espada vermelha... É a espada do Matador de Dragões.' }] },
      { bg: 'forest', tom: 'noite', cam: 60, fx: ['linhas'], foco: [0.45, 0.5], atores: [{ who: 'G', x: 0.22, pose: 'block' }, { who: 'D', x: 0.45, y: 0.62, pose: 'dash', flip: true }, { who: 'M', x: 0.68, pose: 'cast', flip: true }, { who: 'A', x: 0.86, pose: 'aim', flip: true }],
        cap: 'Meia-noite.', som: { t: 'KRAK!', x: 0.6, y: 0.22 },
        falas: [{ who: 'G', grito: true, t: '{D:Um dragônico|Uma dragônica}?!' }, { who: 'D', grito: true, t: 'Pela minha mãe!' }] },
    ] },
    { layout: 'tres', quadros: [
      { bg: 'forest', tom: 'tempestade', cam: 300, fx: ['raio', 'clarao'], raioX: 0.74, raioY: 0.42, atores: [{ who: 'cidadela', x: 0.74, y: 0.62 }],
        cap: 'Longe dali, a Cidadela Celeste é engolida pela tempestade. É o Primeiro Trovão.', som: { t: 'KRA-KA-BOOOM!', x: 0.36, y: 0.55, tam: 40 } },
      { bg: 'forest', tom: 'vermelho', cam: 360, atores: [{ who: 'cavaleiro', x: 0.22, aura: 'rgba(255,40,40,.55)' }, { who: 'cavaleiro', x: 0.48, f: 1, aura: 'rgba(255,40,40,.55)' }, { who: 'G', x: 0.84, pose: 'hurt', flip: true }],
        cap: 'Os cavaleiros da escolta caem... e se levantam mortos.',
        falas: [{ who: 'G', grito: true, t: 'Sir Edrin?! Irmãos, sou eu!' }] },
      { bg: 'forest', tom: 'noite', cam: 420, atores: [{ who: 'A', x: 0.3 }, { who: 'falcao', x: 0.5, y: 0.3, aura: 'rgba(160,220,255,.5)' }, { who: 'cristal', x: 0.82, rachado: true, aura: 'rgba(120,230,255,.6)' }],
        cap: { t: 'No fundo da caverna, algo enorme abre os olhos.', pos: 'baseDir', larg: 260 },
        falas: [{ who: 'A', grito: true, t: 'VENTO! VOLTA!' }] },
    ] },
    { layout: 'duasLinhas', quadros: [
      { bg: 'forest', tom: 'noite', cam: 500, fx: ['linhas', 'reticula'], foco: [0.5, 0.62], atores: [{ who: 'lobo', x: 0.08 }, { who: 'M', x: 0.26, pose: 'cast', flip: true }, { who: 'G', x: 0.42, pose: 'atk', flip: true }, { who: 'D', x: 0.58, pose: 'atk' }, { who: 'A', x: 0.74, pose: 'aim' }, { who: 'cavaleiro', x: 0.92, flip: true }],
        cap: 'Os quatro só sobrevivem lutando de costas uns para os outros.',
        falas: [{ who: 'D', t: 'Não pense que eu salvei você, Espada Rubra.' }, { who: 'G', t: 'Nem pensei.' }] },
      { bg: 'forest', tom: 'alvorada', cam: 560, atores: [{ who: 'G', x: 0.08 }, { who: 'D', x: 0.2 }, { who: 'M', x: 0.5 }, { who: 'bussola', x: 0.6, y: 0.62, aura: 'rgba(120,230,255,.6)' }, { who: 'A', x: 0.88, flip: true }],
        cap: 'Amanhecer.',
        falas: [{ who: 'M', t: 'Seus cavaleiros, seu falcão, meus mestres: foi a mesma tempestade. E eu sei seguir o rastro dela.' }, { who: 'A', t: 'Foi o seu mestre que mandou arrancar o Coração. Eu vou junto... de olho em você.' }] },
    ] },
    { layout: 'tres', quadros: [
      { bg: 'forest', tom: 'alvorada', cam: 640, atores: [{ who: 'G', x: 0.3 }, { who: 'tumulo', x: 0.5, flores: true }, { who: 'D', x: 0.7, flip: true }],
        falas: [{ who: 'G', t: 'Eu não fui sagrad{G:o|a}. Mas o juramento eu já fiz.', larg: 330 }, { who: 'D', t: 'Trégua, Espada Rubra. Até eu achar minha mãe. Depois a gente acerta as contas.' }] },
      { bg: '#4a4a5a', fx: ['reticula'], chao: 0.96, atores: [{ who: 'tumulo', x: 0.5, s: 3, flores: true }],
        cap: ['Antes de partir, @D lê a lápide do túmulo pequeno. Não tem nome.', { t: '"Nosso caçula, que o fogo levou."', pos: 'base' }] },
      { bg: 'forest', tom: 'alvorada', cam: 700, atores: [{ who: 'A', x: 0.16, pose: 'run', f: 2 }, { who: 'M', x: 0.37, pose: 'run', f: 5 }, { who: 'G', x: 0.58, pose: 'run', f: 1 }, { who: 'D', x: 0.82, pose: 'glide', y: 0.5 }],
        cap: ['Assim nasce o grupo: quatro estranhos seguindo o mesmo cristal.', POV('Por meus irmãos de armas.', 'Para consertar o que eu ajudei a quebrar.', 'Por Vento. E pela floresta.', 'Pela minha mãe.')] },
    ] },
  ] },

  // ===================== MUNDO 1 =====================
  { id: 'golem_fim', cap: 'Mundo 1 · Fim', titulo: 'Um trovão sem nuvens', depois: 'golem', seed: 2, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'boss', cam: 80, fx: ['linhas'], foco: [0.5, 0.5], corLinhas: 'rgba(255,200,120,.4)', atores: [{ who: 'golem', pose: 'stun', x: 0.5 }],
        cap: 'O núcleo do Rei Golem se apaga.', som: { t: 'KRRRSSH!', x: 0.78, y: 0.3 } },
      { bg: 'peak', cam: 30, semChao: true, chao: 1, fx: ['raio'], raioX: 0.5, raioY: 0.5, atores: [{ who: 'cidadela', x: 0.5, y: 0.82 }],
        cap: 'Longe dali, sobre a Cidadela, um trovão rola num céu sem nuvens.', som: { t: 'BRRRUM...', x: 0.62, y: 0.9, cor: '#bff4ff', tam: 24, rot: 0 } },
      { bg: 'boss', cam: 160, atores: [{ who: 'A', x: 0.3, pose: 'crouch' }, { who: 'M', x: 0.72, flip: true }],
        falas: [{ who: 'A', t: 'Ele protegia o bosque desde antes do meu avô nascer...' }, { who: 'M', t: 'Aquele brilho no núcleo... era energia de tempestade.' }] },
    ] },
  ] },

  // ===================== MUNDO 2 =====================
  { id: 'mundo2', cap: 'Mundo 2', titulo: 'Picos Gelados', antes: 'neve1', seed: 3, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'ice', cam: 100, fx: ['neve'], atores: [{ who: 'A', x: 0.3, pose: 'run', f: 1 }, { who: 'M', x: 0.42, pose: 'run', f: 3 }, { who: 'G', x: 0.54, pose: 'run', f: 5 }, { who: 'D', x: 0.68, pose: 'run', f: 7 }],
        cap: ['Mundo 2 · Picos Gelados', POV('Jurei libertar meus irmãos de armas. E o rastro me leva cada vez mais longe do castelo.', 'Golem, tempestade, bússola... Eu conheço essa energia. É da Cidadela.', 'Os falcões aqui em cima têm penas brancas. Nenhum deles é Vento.', 'Frio. Odeio frio. Mas os cavaleiros que levaram minha mãe vieram desta direção.')] },
      { bg: 'snow', cam: 200, fx: ['neve'], atores: [{ who: 'M', x: 0.4 }, { who: 'bussola', x: 0.62, y: 0.48, aura: 'rgba(120,230,255,.6)' }],
        falas: [{ who: 'M', t: 'A bússola aponta para o alto. Para o trono do Yeti Ancião.' }] },
      { bg: 'ice', cam: 60, atores: [{ who: 'A', x: 0.3, pose: 'aim' }, { who: 'lobo', cor: 'snow', x: 0.74, flip: true }],
        falas: [{ who: 'A', t: 'Os lobos daqui também enlouqueceram. Não é só a minha floresta.' }] },
    ] },
  ] },
  { id: 'yeti_fim', cap: 'Mundo 2 · Fim', titulo: 'O Faraó sabia', depois: 'yeti', seed: 4, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'icecave', cam: 80, atores: [{ who: 'yeti', pose: 'stuck', x: 0.5 }],
        cap: 'Por um instante, o Yeti Ancião volta a ser ele mesmo.',
        falas: [{ who: 'yeti', t: 'O Faraó... sabia... quatro...' }] },
      { bg: '#1a2a4a', fx: ['reticula'], atores: [{ who: 'M', rosto: true, x: 0.32, s: 3 }],
        som: { t: 'BRRUM...', x: 0.74, y: 0.2, cor: '#bff4ff', tam: 22, rot: 0 },
        falas: [{ who: 'M', t: 'A mesma energia do Golem. Isso não é coincidência.' }] },
      { bg: 'snow', tom: 'noite', cam: 260, atores: [{ who: 'D', x: 0.3, pose: 'cast' }, { who: 'fogueira', x: 0.5 }, { who: 'G', x: 0.72, flip: true }],
        cap: 'Naquela noite, @D acende o fogo para o grupo. Inclusive para @G.',
        falas: [{ who: 'G', t: '...Obrigad{G:o|a}.' }, { who: 'D', t: 'Não se acostume.' }] },
    ] },
  ] },

  // ===================== MUNDO 3 =====================
  { id: 'mundo3', cap: 'Mundo 3', titulo: 'Pântano Gosmento', antes: 'pantano1', seed: 5, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'swamp', cam: 120, atores: [{ who: 'A', x: 0.3, pose: 'run', f: 1 }, { who: 'M', x: 0.42, pose: 'run', f: 3 }, { who: 'G', x: 0.54, pose: 'run', f: 5 }, { who: 'D', x: 0.68, pose: 'run', f: 7 }],
        cap: ['Mundo 3 · Pântano Gosmento', POV('Dois guardiões caídos. A cada vitória, o céu parece mais pesado.', 'Eu já estive aqui. Como aprendiz, ajudei a carregar os barris.', 'Sapos, lodo, plantas carnívoras... O pântano está doente.', '@G luta bem. Isso me irrita.')] },
      { bg: 'swamp', cam: 220, atores: [{ who: 'D', x: 0.3 }, { who: 'A', x: 0.72, flip: true }],
        falas: [{ who: 'D', t: 'Que cheiro é esse?' }, { who: 'A', t: 'Cheiro de poção. Da Academia.' }] },
      { bg: '#2a3a1a', fx: ['reticula'], atores: [{ who: 'M', rosto: true, x: 0.32, s: 3 }],
        falas: [{ who: 'M', pensa: true, t: 'Eles despejavam os restos aqui... e eu sabia.' }] },
    ] },
  ] },
  { id: 'gosma_fim', cap: 'Mundo 3 · Fim', titulo: 'Então conserte', depois: 'gosma', seed: 6, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'swamp', cam: 60, atores: [{ who: 'gosma', pose: 'squash', x: 0.5 }],
        cap: 'O Rei Gosma sempre engoliu o veneno do pântano. Um dia, foi veneno demais.' },
      { bg: 'swamp', tom: 'verde', cam: 140, atores: [{ who: 'M', x: 0.4, pose: 'cast', aura: 'rgba(120,255,140,.6)' }],
        falas: [{ who: 'M', t: 'Fui eu que traduzi o pergaminho do meu mestre. Acho que era um ritual... de imortalidade.' }] },
      { bg: 'swamp', cam: 200, atores: [{ who: 'M', x: 0.3 }, { who: 'A', x: 0.72, flip: true }],
        cap: { t: 'Nasce a primeira amizade de verdade do grupo.', pos: 'base' },
        falas: [{ who: 'A', t: 'E a Academia envenenou este pântano.' }, { who: 'M', t: 'Sim.' }, { who: 'A', t: '...Então conserte.' }] },
    ] },
  ] },

  // ===================== MUNDO 4 =====================
  { id: 'mundo4', cap: 'Mundo 4', titulo: 'Deserto Escaldante', antes: 'deserto1', seed: 7, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'savanna', cam: 80, atores: [{ who: 'A', x: 0.3, pose: 'run', f: 1 }, { who: 'M', x: 0.42, pose: 'run', f: 3 }, { who: 'G', x: 0.54, pose: 'run', f: 5 }, { who: 'D', x: 0.68, pose: 'run', f: 7 }],
        cap: ['Mundo 4 · Deserto Escaldante', POV('@D me salvou de um escorpião hoje. Fingiu que foi sem querer.', 'Quatro. O Yeti disse quatro. Quatro o quê?', 'Até as cobras fogem de alguma coisa. Todas na mesma direção.', 'O calor daqui é bom. Quase parece casa.')] },
      { bg: 'desert', cam: 160, atores: [{ who: 'G', x: 0.3 }, { who: 'M', x: 0.72, flip: true }],
        falas: [{ who: 'G', t: 'Ruínas do Faraó. O Yeti falou dele.' }, { who: 'M', t: 'Se ele sabia de algo, está escrito nas paredes.' }] },
      { bg: 'desert', cam: 260, tom: 'ouro', atores: [{ who: 'mumia', x: 0.35 }, { who: 'mumia', x: 0.62, f: 2, flip: true }],
        cap: { t: 'E as paredes têm guardas.', pos: 'base' } },
    ] },
  ] },
  { id: 'escorpiao_fim', cap: 'Mundo 4 · Fim', titulo: 'Quatro heróis antigos', depois: 'escorpiao', seed: 8, paginas: [
    { layout: 'tresB', quadros: [
      { bg: 'desert', cam: 40, fx: ['sepia'], atores: [{ who: 'G', x: 0.2, pose: 'atk', sil: '#3a2410' }, { who: 'M', x: 0.4, pose: 'cast', sil: '#3a2410' }, { who: 'A', x: 0.6, pose: 'aim', sil: '#3a2410' }, { who: 'D', x: 0.8, pose: 'cast', sil: '#3a2410' }],
        cap: 'Nas paredes do túmulo, a história de quatro heróis antigos.',
        falas: [{ who: 'M', fora: 'dir', t: 'Uma espada, um cajado, um arco e uma chama.', pos: [0.32, 0.56], larg: 260 }] },
      { bg: 'desert', cam: 120, fx: ['raio'], raioX: 0.6, raioY: 0.5, atores: [{ who: 'escorpiao', pose: 'stun', x: 0.45 }],
        cap: 'Mais um guardião cai. Desta vez, o trovão soa perto.', som: { t: 'BRRROOOM!', x: 0.72, y: 0.4, cor: '#bff4ff', tam: 26 } },
      { bg: 'desert', tom: 'alvorada', cam: 220, atores: [{ who: 'M', x: 0.3 }, { who: 'bussola', x: 0.46, y: 0.5, aura: 'rgba(120,230,255,.6)' }, { who: 'D', x: 0.66, flip: true }],
        falas: [{ who: 'M', t: 'Cada guardião que cai... o céu fica mais escuro.' }, { who: 'D', t: 'A bússola aponta para a Montanha de Fogo. Para a minha casa.' }] },
    ] },
  ] },

  // ===================== MUNDO 5 =====================
  { id: 'mundo5', cap: 'Mundo 5', titulo: 'Montanha de Fogo', antes: 'vulcao1', seed: 9, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'ash', cam: 100, fx: ['brasas'], atores: [{ who: 'A', x: 0.3, pose: 'run', f: 1 }, { who: 'M', x: 0.42, pose: 'run', f: 3 }, { who: 'G', x: 0.54, pose: 'run', f: 5 }, { who: 'D', x: 0.68, pose: 'run', f: 7 }],
        cap: ['Mundo 5 · Montanha de Fogo', POV('A montanha do dragão que meu pai matou. É o que dizem.', 'Sangue de dragão... Onde foi que eu li isso?', 'Nem os falcões voam aqui. Só cinzas.', 'Mãe. Eu voltei.')] },
      { bg: 'ash', cam: 200, fx: ['brasas'], atores: [{ who: 'D', x: 0.28 }, { who: 'G', x: 0.72, flip: true }],
        falas: [{ who: 'D', t: 'Minha casa. Ou o que sobrou dela.' }, { who: 'G', t: '@D... eu sinto muito.' }, { who: 'D', t: 'Não sinta. Ainda.' }] },
      { bg: 'volcano', cam: 120, fx: ['brasas'], atores: [{ who: 'corrente', n: 10, x: 0.18, y: 0.7 }, { who: 'ferreiro', x: 0.45, pose: 'slam' }, { who: 'diabrete', x: 0.75, y: 0.4 }],
        cap: 'Na Forja dos Demônios, alguém forja correntes gigantes.' },
    ] },
  ] },
  { id: 'dragao_fim', cap: 'Mundo 5 · Fim', titulo: 'A noite de lembrar', depois: 'dragao', seed: 10, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'volcano', tom: 'vermelho', cam: 60, z: 1.5, fx: ['brasas'], atores: [{ who: 'corrente', n: 12, x: 0.3, y: 0.7 }, { who: 'corrente', n: 12, x: 0.74, y: 0.7 }, { who: 'dragao', furia: true, x: 0.52, y: 0.86, boca: [0.85, 0.32] }],
        cap: 'O Dragão de Magma é a mãe de @D. Mordida pelo Conde. Acorrentada.',
        falas: [{ who: 'dragao', t: 'Filhote...' }] },
      { bg: '#3a0a0a', z: 3, fx: ['reticula', 'brasas'], atores: [{ who: 'dragao', pose: 'fly', x: 0.42, y: 1.25, boca: [0.85, 0.32] }],
        falas: [{ who: 'dragao', t: 'Me liberte. Eu não aguento mais ser a comida dele.' }] },
      { bg: '#3a0a0a', fx: ['reticula'], atores: [{ who: 'D', rosto: true, x: 0.34, s: 3 }],
        cap: { t: 'Por misericórdia. Não por ódio.', pos: 'base' },
        falas: [{ who: 'D', t: 'Mãe... não.' }] },
    ] },
    { layout: 'tres', quadros: [
      { bg: 'forest', tom: 'noite', cam: 900, fx: ['fogoChao', 'brasas', 'sepia'], atores: [{ who: 'casa', x: 0.3 }, { who: 'casa', x: 0.72 }],
        cap: '"Você não nasceu dragão, filhote. Há dezoito anos, Corvalis incendiou uma aldeia para que me culpassem."' },
      { bg: 'forest', tom: 'noite', cam: 960, fx: ['brasas', 'sepia'], z: 2, atores: [{ who: 'dragao', x: 0.5, y: 0.94 }, { who: 'bebe', x: 0.5, aura: 'rgba(255,170,60,.7)' }],
        cap: '"Nas cinzas, encontrei {D:um bebê humano|uma bebê humana} morrendo. Dei {D:a ele|a ela} metade da minha chama."' },
      { bg: 'ash', cam: 300, fx: ['sepia'], atores: [{ who: 'B', x: 0.32 }, { who: 'bebe', x: 0.56 }, { who: 'dragao', x: 0.86, y: 0.9, flip: true }],
        cap: '"O cavaleiro que subiu a montanha para me matar abaixou a espada. Ele se chamava Bertrand."' },
    ] },
    { layout: 'tresB', quadros: [
      { bg: '#3a0a0a', z: 3, fx: ['reticula'], atores: [{ who: 'dragao', pose: 'fly', x: 0.5, y: 1.25, alfa: 0.85, boca: [0.85, 0.32] }],
        falas: [{ who: 'dragao', t: 'Ele era seu pai. Todo ano eu levava você ao túmulo que ele fez para você.' }] },
      { bg: '#2a2040', fx: ['reticula', 'linhas'], foco: [0.34, 0.6], corLinhas: 'rgba(255,255,255,.35)', atores: [{ who: 'G', rosto: true, x: 0.34, s: 3 }],
        falas: [{ who: 'dragao', fora: 'dir', t: 'E aquela espada... é {G:do seu irmão|da sua irmã}.', pos: [0.5, 0.1], larg: 220 }] },
      { bg: 'volcano', tom: 'vermelho', cam: 200, atores: [{ who: 'G', x: 0.32 }, { who: 'D', x: 0.68, flip: true }],
        falas: [{ who: 'G', t: 'Você... é {D:meu irmão|minha irmã}?' }, { who: 'D', t: 'Eu passei a vida caçando {G:o meu próprio irmão|a minha própria irmã}.', larg: 340 }] },
    ] },
    { layout: 'duasLinhas', quadros: [
      { bg: 'volcano', tom: 'azul', cam: 260, fx: ['linhas', 'brasasAzuis'], foco: [0.5, 0.6], corLinhas: 'rgba(160,220,255,.5)', atores: [{ who: 'D', x: 0.5, pose: 'cast', aura: 'rgba(90,170,255,.8)', fogo: 'azul' }],
        cap: 'A metade da chama da mãe volta para casa. O fogo de @D fica azul.', som: { t: 'FWOOOSH!', x: 0.78, y: 0.35, cor: '#6ad8ff' } },
      { bg: '#2a2040', fx: ['reticula'], atores: [{ who: 'M', rosto: true, x: 0.2, s: 3 }, { who: 'A', x: 0.62 }, { who: 'G', x: 0.84, flip: true }],
        cap: { t: 'Agora todos sabem o nome do culpado: Corvalis.', pos: 'baseDir' },
        falas: [{ who: 'M', pensa: true, t: 'Sangue de dragão... Era para isso o ritual que eu traduzi.' }] },
    ] },
  ] },

  // ===================== MUNDO 6 =====================
  { id: 'mundo6', cap: 'Mundo 6', titulo: 'Castelo do Vampiro', antes: 'vamp1', seed: 11, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'graveyard', tom: 'noite', cam: 100, atores: [{ who: 'A', x: 0.3, pose: 'run', f: 1 }, { who: 'M', x: 0.42, pose: 'run', f: 3 }, { who: 'G', x: 0.54, pose: 'run', f: 5 }, { who: 'D', x: 0.68, pose: 'run', f: 7 }],
        cap: ['Mundo 6 · Castelo do Vampiro', POV('{D:Meu irmão|Minha irmã}. Ainda não consigo dizer isso em voz alta.', 'A letra nas paredes deste castelo... é a letra do meu mestre.', 'Morcegos e lobos negros. Até a lua parece doente.', '{G:Meu irmão|Minha irmã}. Que palavra estranha.')] },
      { bg: 'graveyard', tom: 'noite', cam: 200, atores: [{ who: 'G', x: 0.26 }, { who: 'tumulo', x: 0.5, aberto: true, s: 1 }, { who: 'D', x: 0.75, flip: true }],
        falas: [{ who: 'G', t: 'O túmulo do pai... está vazio.' }, { who: 'D', t: 'Ele tentou levantar o nosso pai.' }] },
      { bg: '#1a0a1e', fx: ['reticula'], atores: [{ who: 'conde', x: 0.6, alfa: 0.75, aura: 'rgba(200,20,60,.5)' }],
        falas: [{ who: 'conde', t: 'Ele nunca foi meu.' }] },
    ] },
  ] },
  { id: 'conde_fim', cap: 'Mundo 6 · Fim', titulo: 'Mão de morto não quebra selo', depois: 'conde', seed: 12, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'vampire', tom: 'vermelho', cam: 80, atores: [{ who: 'conde', pose: 'cast', furia: true, x: 0.5 }],
        cap: 'Derrotado, o Conde Sanguinário ri.',
        falas: [{ who: 'conde', t: 'Obrigado, heróis. Mão de morto não quebra selo.' }] },
      { bg: '#1a0a1e', z: 3, fx: ['reticula'], atores: [{ who: 'conde', pose: 'cast', furia: true, x: 0.5, y: 1.3 }],
        falas: [{ who: 'conde', t: 'Golem, Yeti, Gosma, Escorpião, Dragão... cada guardião que vocês mataram era um pedaço da prisão.' }] },
      { bg: '#2a2050', fx: ['reticula', 'linhas'], foco: [0.34, 0.6], atores: [{ who: 'M', rosto: true, x: 0.34, s: 3 }],
        falas: [{ who: 'M', grito: true, t: 'Mestre... POR QUÊ?' }] },
    ] },
    { layout: 'tres', quadros: [
      { bg: 'vampire', cam: 160, atores: [{ who: 'conde', x: 0.32 }, { who: 'M', x: 0.7, flip: true }],
        cap: 'Mais baixo, só para @M:',
        falas: [{ who: 'conde', t: 'Eu mandei você para longe naquela noite. Você era a única coisa que eu ainda queria salvar.' }] },
      { bg: 'sky', tom: 'tempestade', cam: 40, z: 1.5, semChao: true, chao: 1, fx: ['raio', 'raio2'], atores: [{ who: 'tita', pose: 'storm', furia: true, x: 0.62, y: 1 }],
        cap: 'O céu racha. O Titã da Tempestade acorda.', som: { t: 'KRRAAAK!', x: 0.3, y: 0.8, tam: 30 } },
      { bg: 'vampire', tom: 'tempestade', cam: 240, fx: ['linhas'], foco: [0.5, 0.0], atores: [{ who: 'conde', pose: 'dash', x: 0.5, y: 0.55, alfa: 0.85, aura: 'rgba(200,20,60,.5)' }],
        cap: { t: 'Nem o Conde escapa da tempestade que acordou.', pos: 'base' },
        falas: [{ who: 'conde', grito: true, t: 'Não! Eu sou o seu mestre!' }] },
    ] },
    { layout: 'um', quadros: [
      { bg: 'peak', tom: 'tempestade', cam: 100, fx: ['raio', 'chuva'], raioX: 0.8, raioY: 0.45, atores: [{ who: 'cidadela', x: 0.8, y: 0.5 }, { who: 'A', x: 0.2 }, { who: 'M', x: 0.32 }, { who: 'G', x: 0.44 }, { who: 'D', x: 0.56 }],
        cap: 'O último selo é a Cidadela Celeste.',
        falas: [{ who: 'G', t: 'Para a Cidadela. Juntos?' }, { who: 'D', t: 'Juntos.' }] },
    ] },
  ] },

  // ===================== MUNDO 7 =====================
  { id: 'mundo7', cap: 'Mundo 7', titulo: 'Cidadela Celeste', antes: 'ceu1', seed: 13, paginas: [
    { layout: 'tres', quadros: [
      { bg: 'peak', cam: 100, atores: [{ who: 'A', x: 0.3, pose: 'run', f: 1 }, { who: 'M', x: 0.42, pose: 'run', f: 3 }, { who: 'G', x: 0.54, pose: 'run', f: 5 }, { who: 'D', x: 0.68, pose: 'run', f: 7 }],
        cap: ['Mundo 7 · Cidadela Celeste', POV('A espada do pai nunca matou um dragão. Hoje ela vai cortar uma tempestade.', 'Eu traduzi o ritual que começou tudo isso. Vou escrever o que termina.', 'Aguenta, Vento. Estou chegando.', 'Mãe, se estiver vendo: a chama azul é sua.')] },
      { bg: 'sky', cam: 200, semChao: true, chao: 1, atores: [{ who: 'falcao', cor: 'gold', x: 0.3, y: 0.4 }, { who: 'falcao', cor: 'gold', x: 0.62, y: 0.3, f: 3 }, { who: 'falcao', cor: 'gold', x: 0.8, y: 0.55, f: 2 }],
        falas: [{ who: 'A', fora: 'esq', t: 'Vento está lá em cima. Entre os dourados.', pos: [0.06, 0.62], larg: 280 }] },
      { bg: 'sky', cam: 300, atores: [{ who: 'M', x: 0.25 }, { who: 'G', x: 0.55 }, { who: 'D', x: 0.78, flip: true }],
        falas: [{ who: 'M', t: 'Uma espada, um cajado, um arco e uma chama. Somos nós.' }, { who: 'D', t: 'Então vamos, {G:irmão|irmã}.', larg: 200 }] },
    ] },
  ] },
  { id: 'final', cap: 'Final', titulo: 'Uma espada, um cajado, um arco e uma chama', depois: 'tita', seed: 14, paginas: [
    { layout: 'quatro', quadros: [
      { bg: '#3a3a5a', chao: 0.98, fx: ['linhas'], foco: [0.4, 0.6], atores: [{ who: 'G', x: 0.4, pose: 'atk', f: 2, s: 2, aura: 'rgba(255,255,255,.6)' }],
        cap: { t: 'A espada que se recusou a matar um dragão corta a tempestade.', pos: 'base' } },
      { bg: '#2a1a50', chao: 0.98, fx: ['linhas'], foco: [0.4, 0.6], corLinhas: 'rgba(220,160,255,.5)', atores: [{ who: 'M', x: 0.4, pose: 'cast', f: 1, s: 2, aura: 'rgba(200,120,255,.7)' }],
        cap: { t: 'O cajado amarra os raios com a página reescrita do jeito certo.', pos: 'base' } },
      { bg: '#1a3a2a', chao: 0.98, fx: ['linhas'], foco: [0.4, 0.6], corLinhas: 'rgba(160,255,180,.5)', atores: [{ who: 'A', x: 0.4, pose: 'aim', s: 2, aura: 'rgba(140,255,160,.6)' }],
        cap: { t: 'O arco acerta o núcleo, de longe.', pos: 'base' } },
      { bg: '#0a1a4a', chao: 0.98, fx: ['linhas', 'brasasAzuis'], foco: [0.4, 0.6], corLinhas: 'rgba(120,200,255,.5)', atores: [{ who: 'D', x: 0.4, pose: 'cast', s: 2, aura: 'rgba(90,170,255,.8)', fogo: 'azul' }],
        cap: { t: 'E a chama azul sela tudo.', pos: 'base' } },
    ] },
    { layout: 'tres', quadros: [
      { bg: 'sky', tom: 'tempestade', cam: 80, z: 1.5, semChao: true, chao: 1, fx: ['linhas'], foco: [0.5, 0.5], atores: [{ who: 'tita', pose: 'cast', x: 0.5, y: 1, alfa: 0.9 }],
        cap: 'O Titã volta a dormir...', som: { t: 'KA-BLAAAM!', x: 0.5, y: 0.5, tam: 40 } },
      { bg: 'peak', tom: 'alvorada', cam: 220, atores: [{ who: 'G', x: 0.2 }, { who: 'D', x: 0.4 }, { who: 'M', x: 0.6 }, { who: 'A', x: 0.8, flip: true }],
        cap: { t: '...e o sol nasce sobre a Cidadela.', pos: 'base' } },
      { bg: 'peak', tom: 'alvorada', cam: 300, atores: [{ who: 'A', x: 0.36 }, { who: 'falcao', x: 0.6, y: 0.42, flip: true }],
        falas: [{ who: 'A', t: 'Vento! Você voltou... e voltou marrom!' }] },
    ] },
    { layout: 'quatro', quadros: [
      { bg: 'castle', tom: 'alvorada', cam: 120, atores: [{ who: 'G', x: 0.5 }],
        cap: '@G refunda a Ordem: proteger, não caçar. Na estátua do pai, uma placa nova: "Aquele que abaixou a espada".' },
      { bg: 'volcano', tom: 'alvorada', cam: 300, atores: [{ who: 'D', x: 0.5, aura: 'rgba(90,170,255,.5)' }],
        cap: '@D enterra a mãe na cratera. E visita {G:o irmão|a irmã} sempre... entrando pela janela.' },
      { bg: 'sky', tom: 'alvorada', cam: 160, atores: [{ who: 'M', x: 0.5 }],
        cap: { t: '@M transforma a Academia em hospital e queima o pergaminho do ritual.', pos: 'base' } },
      { bg: 'forest', tom: 'alvorada', cam: 80, atores: [{ who: 'A', x: 0.42 }, { who: 'falcao', x: 0.66, y: 0.4, flip: true }],
        cap: { t: '@A replanta a floresta. @M ajuda. Vento vigia tudo do alto.', pos: 'base' } },
    ] },
    { layout: 'um', quadros: [
      { bg: 'peak', tom: 'alvorada', cam: 400, z: 3, atores: [{ who: 'G', x: 0.32 }, { who: 'D', x: 0.44 }, { who: 'M', x: 0.56 }, { who: 'A', x: 0.68, flip: true }],
        cap: [{ t: 'Os heróis voltarão.', pos: 'dir' }], som: { t: 'FIM', x: 0.5, y: 0.3, tam: 64, rot: 0 } },
    ] },
  ] },
];
