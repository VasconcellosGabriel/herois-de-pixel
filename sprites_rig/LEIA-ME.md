# Rig de recortes dos heróis (protótipo) — guia para arte nova

Em vez de desenhar cada camada em cada quadro de animação (as ~193 folhas de `sprites/`), o rig monta o herói com
**peças desenhadas uma vez só**, presas ao esqueleto que o jogo já calcula: cabeça, cabelo, chapéu e acessórios seguem
a cabeça; roupa, capa e asas seguem o tronco; braço, antebraço, coxa e canela **giram** com os ossos; a espada gira
com a mão. As 13 animações saem sozinhas.

- Para ver no jogo: `node servidor.js` e abra `http://localhost:8080/?rig` (Ctrl+F5 se não mudar).
- Peça que não existe aqui continua sendo desenhada por código. Dá para trocar a arte **uma peça por vez**.
- `folha-de-moldes.png` mostra as peças principais ampliadas, com tamanho e pivô (+).

## O que tem nesta pasta

| Arquivo | O que é |
|---|---|
| `<família>/<pasta>/<peça>.png` | a peça que o jogo usa (molde ou arte importada) |
| `_moldes/...` | cópia dos moldes originais (o importador usa para encaixar; não edite) |
| `pecas.js` | pivô de cada peça (`px`, `py`) e comprimento do osso (`len`, só braço/perna) |
| `guias/guia-*.png` | um guia por grupo (rostos, cabelos, roupas...) com forma, tamanho e encaixe, para anexar aos pedidos de arte |
| `PEDIDOS-GEMINI.md` | os pedidos prontos para gerar todas as peças com o Gemini |
| `..._v1`, `_v2`, `_v3` | variações de peças que balançam: capa, mechas de trás, cachecol (vento fraco/forte) e asas (abertura) |

Famílias: `humano/` (guerreiro, mago, arqueiro) e `dragonico/`. Nomes das peças: os mesmos de `sprites/LEIA-ME.md`, mais
`roupa/<roupa>_<físico>_braco` / `_antebraco` (antebraço inclui punho e mão), `pernas/<físico>_coxa` / `_canela`,
`pernas/bota` e `arma/espada`.

## Regras da arte

- **De perfil, olhando para a DIREITA.** Luz de cima-esquerda.
- **Braço, antebraço, coxa e canela: na vertical, apontando para baixo**, com a articulação de cima no pivô. O jogo gira e
  estica (um pouco) a peça até o tamanho do osso. Mãos/pés não devem ultrapassar muito a ponta do osso.
- **Espada: apontando para cima**, com o pivô no meio do cabo (onde a mão segura).
- Fundo transparente (ou liso, que o importador apaga). Sem contorno preto por fora: o jogo desenha o contorno do herói
  montado. Contornos internos e sombras pintadas são bem-vindos.
- **Escala real é pequena**: o herói inteiro tem ~66 px de altura (o rosto ~26×22, o braço ~6×12). Detalhe muito fino
  some na redução; prefira formas fortes, poucas cores bem escolhidas e contraste claro entre as partes.
- **Arte original**: nada copiado de outros jogos, nem como base.

## Cores que o jogador escolhe

Pinte com cores normais. Na importação você diz quais faixas de cor viram **cor-chave** (recolorível), por exemplo o roxo do
chapéu vira "cor do chapéu" e o cinza da lâmina vira "metal da arma". Couro, ouro, joias etc. ficam como estão.
Detalhes da paleta-chave: `sprites/LEIA-ME.md`.

## Importar arte (gerada por IA ou feita por artista)

```
node tools/importar-peca.js <imagem> <peça> [opções]
```

Exemplos (feitos com a folha de referência):

```
node tools/importar-peca.js referencia.png humano/arma/espada --recorte 86,834,72,82 --girar -39 --encaixe altura --escala 1.1 --chave "weaponColor=cinza+h:200-275"
node tools/importar-peca.js referencia.png humano/chapeu/chapeu_de_mago --recorte 3,182,82,56 --encaixe largura --escala 1.1 --chave "headColor=h:245-325"
node tools/importar-peca.js referencia.png humano/chapeu/coroa --recorte 219,196,48,38 --encaixe largura --escala 1.15
```

O importador recorta, apaga o fundo liso, gira/espelha, reduz até o tamanho do molde (`--encaixe caixa|largura|altura`,
`--escala`), alinha pela base do molde (`--alinhar`, `--desloca`), endurece a borda, converte as faixas pedidas para a
paleta-chave e grava a peça (`--previa arquivo.png` mostra molde × arte). Todas as opções estão no topo de
`tools/importar-peca.js`. Importar a peça base apaga as variações `_v1`... dela (importe-as pelo nome, se tiver arte para cada).

### Arte de IA que já é pixel art (ex.: Gemini)

O Gemini costuma gerar pixel art de verdade ampliada (na folha de teste, cada pixel da arte = 3×3 px da imagem).
Use `--grade auto`: o importador acha a grade, lê uma cor por pixel da arte e, se precisar reduzir, reduz por blocos
preservando traços escuros (olhos, contornos) e sem criar cores novas. Fica bem mais nítido que a redução comum.

Duas peças que precisam ficar alinhadas entre si (cabeça e cabelo): monte as duas numa mesma imagem de fundo
transparente, uma por arquivo, no mesmo lugar; importe a primeira e repita o `--fixo` que ela mostrar na segunda.

Exemplos da folha do Gemini (herói guerreiro de teste):

```
node tools/importar-peca.js so-cabeca.png humano/rosto/normal --grade auto --encaixe altura --escala 1.14 --chave "skin=pele"
node tools/importar-peca.js so-cabelo.png humano/cabelo/baguncado_frente --fixo 0.17297,28.66,28.83 --chave "hairColor=h:0-50+h:330-360"
node tools/importar-peca.js folha.jpg humano/roupa/tunica_normal_tronco --recorte 985,50,133,166 --chave "primary=h:200-255" --chave "secondary=h:12-45"
node tools/importar-peca.js folha.jpg humano/pernas/bota --recorte 1003,521,94,89 --chave "secondary=h:12-45*0.62"
node tools/importar-peca.js folha.jpg humano/capa/longa_normal --recorte 997,671,109,203 --alinhar topo --chave "capeColor=h:340-360+h:0-20"
```

Capa importada sem variações (`_v1`, `_v2`): o rig gira a capa para trás, presa nos ombros, conforme o vento da pose.

## Gerar arte com IA (modelo de pedido)

Uma peça por imagem funciona melhor que uma folha com tudo. Mande junto `folha-de-moldes.png` como guia de forma e proporção.

> Pixel art de jogo 2D, **uma única peça isolada**: *[ex.: chapéu de mago de tecido com faixa de couro e fivela]*,
> **vista de perfil, virada para a direita**, luz vindo de cima-esquerda, sombreamento suave em 3–4 tons por cor,
> contornos internos escuros, **fundo cinza liso**, sem texto, sem sombra no chão, centralizada, ocupando a imagem.
> Mesmo estilo da imagem de referência anexa.

Para braços e pernas: *"segmento de braço (manga de túnica) reto, na vertical, ombro em cima"*; para a espada:
*"espada na vertical, ponta para cima"*. Gere várias e escolha as que combinam entre si.

Lições da primeira folha do Gemini:
- **Cabelo sozinho** vem como uma massa fechada (cobre o rosto). Peça *"cabelo como uma peruca vista de lado, com a
  abertura do rosto vazia"*, ou recorte o cabelo do herói completo (foi o que funcionou).
- **Antebraço** pode vir como o braço inteiro: peça *"só do cotovelo até a mão"*.
- Cores de trabalho nem sempre são respeitadas (botas e cinto vieram marrons): tudo bem, ajuste no `--chave`.
- Rostos de IA tendem a ter olhos pequenos; na escala do jogo (~23 px) peça *"olhos grandes, estilo chibi, ocupando
  1/3 do rosto"* para continuarem legíveis.

## Refazer os moldes

```
node tools/exportar-pecas.js          # cria só as peças que faltam (não apaga arte importada) e atualiza _moldes/
node tools/exportar-pecas.js --tudo   # refaz tudo a partir do código (APAGA a arte importada)
```

## Limitações conhecidas do protótipo

- Rosto parado: piscar e boca aberta (dano, sopro) ainda não trocam no rig.
- Arco do arqueiro, cajado do mago, lança e escudo do guerreiro ainda são desenhados por código.
- A cauda do dragônico faz parte da peça das asas (fica parada dentro de cada variação).
- Rolamento/cambalhota giram o herói inteiro (como antes).
