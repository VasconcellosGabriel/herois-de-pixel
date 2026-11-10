# Sprites dos heróis — guia para o artista

Os heróis são montados com **camadas PNG** empilhadas, que o jogo **recolore** com as cores que o jogador escolhe no
criador de personagem. As folhas desta pasta foram geradas a partir do desenho por código do jogo
(`node tools/exportar-sprites.js`) e servem de **base**: abra no Aseprite/LibreSprite/Krita, refine com mais detalhe e
salve por cima. O jogo usa a folha nova na próxima vez que carregar.

> ⚠️ Rodar `node tools/exportar-sprites.js` de novo **sobrescreve tudo**. Depois de começar a editar, use
> `node tools/exportar-sprites.js --so-novas` (só cria as que faltam e atualiza a lista) e mantenha tudo no git.

## Formato de cada folha

- Célula de **96 × 96 px**, grade de **12 colunas × 13 linhas** (1152 × 1248 px). No Aseprite: *Importar folha de sprites* com grade de 96×96.
- O herói **olha para a direita** (o jogo espelha para a esquerda).
- **Pés na linha y = 92** da célula, centro do corpo em x = 48.
- **Sem contorno**: o jogo desenha o contorno escuro em volta do herói montado. Não pinte a borda preta externa.
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
| 7 | `cast` magia/arremesso | 3 | lança do guerreiro, cajado do mago, sopro do dragônico |
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
| Roupa (principal) | 54° | `#b3a100` |
| Roupa (secundária: calça, cinto, luvas, bota) | 81° | `#74b300` |
| Destaque (detalhes, asas e chifres do dragônico, joia do cajado) | 108° | `#24b300` |
| Metal da arma | 135° | `#00b32d` |
| Chapéu/elmo | 162° | `#00b37d` |
| Capa | 189° | `#0098b3` |
| Acessório (óculos, tapa-olho, máscara, cachecol) | 216° | `#0047b3` |
| Olhos (íris) | 243° | `#0900b3` |
| Armadura (mistura cinza da roupa principal) | 270° | `#5900b3` |
| Camisa do colete (tom claro da pele) | 297° | `#aa00b3` |
| Bochecha (rosado da pele) | 324° | `#b3006b` |

Regras:
- Cor-chave = um dos três canais RGB **zerado** (saturação 100%). Fora dos canais acima, use cores normais.
- **Cores normais ficam como estão**: branco dos olhos, boca, ouro da fivela, madeira do arco, couro, flechas etc.
- Evite cores "puras" (um canal RGB = 0) que não sejam chaves; o jogo pode confundir com um canal.
- Para sombras com outro matiz (ex.: sombra roxa), deixe o jogo cuidar disso: pinte só o brilho da cor-chave.

## Camadas e ordem (de trás para a frente)

`asas` → `capa` → `cabelo_tras` → `costas` → `braco_tras` → `pernas` → `tronco` → `capa_fecho` → `cachecol` →
`cabeca` → `cabelo_frente` → `chifres` → `acessorio` → `chapeu` → `capuz_ombro` → `arma` → `braco_frente`

| Pasta / arquivo | Camada | Varia por |
|---|---|---|
| `pernas/<altura>_<físico>.png` | pernas (calça e botas) | altura e físico |
| `roupa/<roupa>_<físico>_tronco.png` | tronco + pescoço | roupa e físico |
| `roupa/<roupa>_<físico>_braco_tras.png` / `_braco_frente.png` | braços (manga, luva, mão) | roupa e físico |
| `rosto/<rosto>.png` | cabeça, rosto, olhos, boca | expressão |
| `cabelo/<cabelo>_tras.png` / `_frente.png` | cabelo atrás / na frente da cabeça | estilo |
| `chapeu/<chapéu>.png` (+ `capuz_ombros_<físico>`) | chapéus e elmos | estilo |
| `acessorio/<acessório>.png` (+ `cachecol_<físico>`) | acessórios do rosto | estilo |
| `capa/<curta\|longa>_<físico>.png` + `capa/fecho_<físico>.png` | capa e o fecho no peito | físico |
| `costas/<classe>_<físico>.png` | escudo nas costas (guerreiro) / aljava (arqueiro) | físico |
| `arma/<classe>.png` | espada, lança e escudo / cajado / arco e flecha | classe |
| `dragonico/asas_<físico>.png`, `dragonico/chifres.png` | asas, cauda e chifres | físico |

- `humano/` vale para guerreiro, mago e arqueiro; `dragonico/` tem as próprias folhas (pose de garras, sopro, escamas).
- As folhas de cintura para cima foram desenhadas na altura **Alto**; o jogo desce 3 px (Médio) ou 5 px (Baixo).
  Por isso, nada pode encostar na borda de baixo da célula nessas folhas.
- Arquivo que não existe = camada vazia (ex.: careca não tem cabelo).

## Dicas para mais detalhe

- Trabalhe primeiro em **um herói completo** (ex.: `humano/rosto/normal`, `cabelo/baguncado_*`, `roupa/tunica_normal_*`,
  `pernas/medio_normal`, `arma/guerreiro`) e teste no jogo antes de partir para as outras variações.
- Para testar: `node servidor.js` e abrir `http://localhost:8080`. Para comparar com o desenho antigo, use `?procedural` na URL.
- Arte para venda tem de ser **original**: não copie nem edite sprites de outros jogos (Sonic, Mega Man etc.), mesmo como base.
