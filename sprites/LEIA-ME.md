# Sprites dos heróis — guia para o artista

Os heróis são montados com **camadas PNG** empilhadas, que o jogo **recolore** com as cores que o jogador escolhe no
criador de personagem. As folhas desta pasta foram geradas a partir do desenho por código do jogo
(`node tools/exportar-sprites.js`) e servem de **base**: abra no Aseprite/LibreSprite/Krita, refine com mais detalhe e
salve por cima. O jogo usa a folha nova na próxima vez que carregar.

> ⚠️ Rodar `node tools/exportar-sprites.js` de novo **sobrescreve tudo**. Depois de começar a editar, use
> `node tools/exportar-sprites.js --so-novas` (só cria as que faltam e atualiza a lista) e mantenha tudo no git.

## Estilo (versão 20, refeito a partir da folha de referência das classes)

- **Sombreamento em camadas**: além dos 5 tons de volume de cada forma, há a *sombra de forma* (o lado de longe do peito,
  a parte de baixo do cabelo, a capa junto ao corpo, a nuca do capuz ficam um tom abaixo: `g.swap` em `js/sprites.js`),
  dobras em pares claro/escuro nos tecidos, reflexos no metal e relevo nas nervuras das asas. Ao montar o herói, o jogo
  ainda projeta 2 px de sombra de cada peça sobre a de trás (cabeça sobre os ombros, braço sobre o tronco).
- **Rosto sem expressões**: o rosto é neutro e o jogador escolhe uma *característica* (cicatrizes, barba, bigode,
  cavanhaque, pintura de guerra, faixa nos olhos, sardas). Cicatrizes usam o tom da bochecha escurecido, os pelos a cor
  do cabelo e as pinturas a cor de destaque.

- Herói **chibi em 3/4, virado para a direita**: cabeça grande (22 × 19 px), tronco de 15 px, pernas de 15/17/19 px
  (Baixo/Médio/Alto) e braço de 16 px. Com o cabelo, o herói médio tem ~55 px de altura.
- Em 3/4 o **lado de perto** do corpo fica à esquerda (braço e perna "da frente", desenhados por cima) e o **lado de
  longe** à direita (braço e perna "de trás", mais escuros). As duas pernas aparecem lado a lado, pés apontando para a direita.
- Rosto: olhos grandes e escuros (o de perto com 3 × 5 px, o de longe com 2 × 5 px) com um ponto de brilho, boca de 2 px.
- **Quem segura o quê**: o guerreiro leva a espada na mão de perto e o escudo na de longe (à frente do corpo quando
  parado, nas costas quando ataca); o mago leva o cajado na mão de perto; o arqueiro leva o arco na mão de longe e puxa a
  corda com a de perto (mirando, o arco é desenhado atrás do corpo, do lado de longe da cabeça).
- Visual de referência de cada classe (são os heróis prontos do jogo, masculino e feminino):
  - **Guerreiro**: cabelo ruivo espetado (ou rabo de cavalo), armadura de placas com frisos dourados, ombreiras, lenço e capa vermelhos, saiote vermelho, escudo em gota.
  - **Mago**: chapéu de bruxo de aba larga com faixa dourada, cabelo lilás, manto roxo longo com barras douradas, pelerine e cajado dourado com orbe.
  - **Arqueiro**: capuz verde pontudo com friso dourado e pelerine, túnica verde com mangas bufantes, braceletes e botas de couro, aljava e arco recurvo.
  - **Dragônico**: cabelo carmesim, chifres de osso, orelhas pontudas, asas de morcego e cauda, armadura escura com saiote carmesim.

## Formato de cada folha

- Célula de **96 × 96 px**, grade de **12 colunas × 13 linhas** (1152 × 1248 px). No Aseprite: *Importar folha de sprites* com grade de 96×96.
- O herói **olha para a direita** (o jogo espelha para a esquerda).
- **Pés na linha y = 92** da célula, centro do corpo em x = 48.
- **Sem contorno**: o jogo desenha o contorno escuro em volta do herói montado. Não pinte a borda preta externa.
- **Sem sombra de uma peça sobre a outra**: o jogo também escurece a borda da peça de trás onde outra passa na frente
  (braço sobre o tronco, cabelo sobre a testa, cabeça sobre o pescoço). Pinte só o volume da própria peça.
- **Luz de cima-esquerda, em até 5 tons por cor**: brilho, luz, base, sombra e sombra funda na borda de baixo/direita.
  É o padrão das folhas geradas por `tools/exportar-sprites.js` (sombreamento por volume de `js/sprites.js`).
- A arte tem o dobro da resolução do cenário (no jogo, 2 px da folha = 1 px do cenário).
- Fundo transparente. Não mude o tamanho da folha nem a posição das células.

| Linha | Animação | Quadros | Observação |
|---|---|---|---|
| 1 | `idle` parado | 5 | quadro 5 = piscada |
| 2 | `run` correndo | 8 | ciclo completo |
| 3 | `jump` pulo | 3 | subindo, topo, descendo |
| 4 | `land` aterrissagem | 1 | |
| 5 | `crouch` agachado | 5 | 1 parado + 4 andando agachado |
| 6 | `atk` ataque corpo a corpo | 4 | espada (humanos) / garras (dragônico) |
| 7 | `cast` magia/arremesso | 3 | lança do guerreiro, cajado do mago, tiro do arqueiro, sopro do dragônico |
| 8 | `block` escudo | 1 | |
| 9 | `hurt` dano | 1 | |
| 10 | `dash` investida | 1 | |
| 11 | `glide` planando | 2 | só o dragônico |
| 12 | `aim` mirando | 12 | de −90° (cima) a +75° (baixo), de 15° em 15° (arqueiro) |
| 13 | `tuck` encolhido | 1 | o jogo gira esta pose para o rolamento e o pulo duplo |

Para ter **mais quadros** numa animação, é preciso mudar o número em `POSES` (js/sprites.js) e em `PACK_ROWS`
(js/spritepack.js). Peça ao programador.

## Paleta-chave (o que o jogador pode pintar)

As partes que mudam de cor são pintadas com **cores-chave**: cada canal tem um matiz fixo, saturação 100%, e o
**brilho** é o tom. Use as amostras de `paleta-chave.png` (cada linha é um canal, do mais escuro ao mais claro; o
quadradinho branco marca o tom "base", que vira exatamente a cor escolhida pelo jogador). Mais escuro que a base = sombra,
mais claro = luz.

| Canal | Matiz | Tom base |
|---|---|---|
| Pele | 0° | `#b30000` |
| Cabelo (e sobrancelha, barba) | 27° | `#b35000` |
| Roupa (principal: túnica, manto, colete) | 54° | `#b3a100` |
| Roupa (secundária: saiote, painel do manto, cinto, braceletes, botas) | 81° | `#74b300` |
| Destaque (joia do cajado e do chapéu, cruz do escudo, penacho do elmo, pinturas do rosto, asas e cauda do dragônico) | 108° | `#24b300` |
| Arma (lâmina e escudo do guerreiro, cajado do mago, arco do arqueiro) | 135° | `#00b32d` |
| Chapéu/elmo/capuz | 162° | `#00b37d` |
| Capa (e o lenço do guerreiro) | 189° | `#0098b3` |
| Acessório (óculos, tapa-olho, máscara, brinco, cachecol) | 216° | `#0047b3` |
| Olhos (íris) | 243° | `#0900b3` |
| Armadura (a cor principal puxada para o metal) | 270° | `#5900b3` |
| Camisa (mangas da túnica e camisa do colete; tom claro da pele) | 297° | `#aa00b3` |
| Bochecha (rosado da pele) | 324° | `#b3006b` |

Regras:
- Cor-chave = um dos três canais RGB **zerado** (saturação 100%). Fora dos canais acima, use cores normais.
- **Cores normais ficam como estão**: os frisos dourados (armadura, manto, chapéu, capuz, escudo), o osso dos chifres,
  o couro da aljava, as flechas, o brilho dos olhos, a boca etc.
- Evite cores "puras" (um canal RGB = 0) que não sejam chaves; o jogo pode confundir com um canal.
- Para sombras com outro matiz (ex.: sombra roxa), deixe o jogo cuidar disso: pinte só o brilho da cor-chave.

## Camadas e ordem (de trás para a frente)

`asas` → `capa` → `cabelo_tras` → `costas` → `braco_tras` → `pernas` → `tronco` → `capa_fecho` → `cachecol` →
`cabeca` → `cabelo_frente` → `chifres` → `acessorio` → `chapeu` → `capuz_ombro` → `arma` → `braco_frente` → `capuz_braco`

| Pasta / arquivo | Camada | Varia por |
|---|---|---|
| `pernas/<roupa>_<altura>_<físico>.png` | pernas (calça, grevas ou botas de cada roupa) | roupa, altura e físico |
| `roupa/<roupa>_<físico>_tronco.png` e `..._<físico>_f_tronco.png` | tronco + pescoço (`_f` = corpo feminino) | roupa, físico e corpo |
| `roupa/<roupa>_<físico>_braco_tras_<classe>.png` / `_braco_frente_<classe>.png` | braços (manga, antebraço, mão, ombreira/pelerine) | roupa, físico e **classe** |
| `rosto/<rosto>.png` e `rosto/<rosto>_f.png` | cabeça, olhos, boca e a característica do rosto (`_f` = com cílios) | característica e corpo |
| `cabelo/<cabelo>_tras.png` / `_frente.png` | cabelo atrás / na frente da cabeça | estilo |
| `chapeu/<chapéu>.png` (+ `capuz_ombros_<físico>`, `capuz_braco`) | chapéus, elmos e a pelerine do capuz | estilo |
| `acessorio/<acessório>.png` (+ `cachecol_<físico>`, `lenco_guerreiro`) | acessórios do rosto e do pescoço | estilo |
| `capa/<curta\|longa>_<físico>.png` + `capa/fecho_<físico>.png` | capa e o fecho no peito | físico |
| `costas/<classe>_<físico>.png` | escudo nas costas (guerreiro) / aljava e arco mirando (arqueiro) | classe |
| `arma/<classe>.png` | espada, lança e escudo / cajado / arco abaixado e correia da aljava | classe |
| `dragonico/asas_<físico>.png`, `dragonico/chifres.png` | asas, cauda, chifres e orelhas pontudas | físico |

- `humano/` vale para guerreiro, mago e arqueiro: o **corpo é o mesmo** nas três classes (pernas, tronco, cabeça, cabelo,
  capa se mexem igual); só os braços, a arma e as costas têm folha por classe, porque cada uma segura a arma de um jeito.
  `dragonico/` tem as próprias folhas (pose de garras, sopro, mergulho).
- As folhas de cintura para cima foram desenhadas na altura **Alto**; o jogo desce 2 px (Médio) ou 4 px (Baixo).
  Por isso, nada pode encostar na borda de baixo da célula nessas folhas.
- **Cabelo debaixo de chapéu**: as folhas de cabelo têm o cabelo inteiro. Com chapéu de bruxo, elmo ou capuz o jogo
  apaga sozinho o que ficaria para fora (acima da aba e, no elmo e no capuz, o volume atrás da cabeça).
- Arquivo que não existe = camada vazia (ex.: careca não tem cabelo).

## Dicas para mais detalhe

- Trabalhe primeiro em **um herói completo** (ex.: `humano/rosto/normal`, `cabelo/baguncado_*`, `roupa/armadura_normal_*`,
  `pernas/armadura_medio_normal`, `arma/guerreiro`) e teste no jogo antes de partir para as outras variações.
- Para testar: `node servidor.js` e abrir `http://localhost:8080`. Para comparar com o desenho por código, use `?procedural` na URL.
- Arte para venda tem de ser **original**: não copie nem edite sprites de outros jogos (Sonic, Mega Man etc.), mesmo como base.
