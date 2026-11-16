# Pedidos para o Gemini — peças dos heróis (rig de recortes)

## Como usar

1. Faça os pedidos **na mesma conversa** do Gemini que gerou a folha aprovada (o herói guerreiro de teste). Assim ele
   mantém o estilo.
2. Em **cada** pedido, anexe duas imagens:
   - **Imagem 1:** a folha aprovada (`Gemini_Generated_Image_lfc4e0lfc4e0lfc4.jpg`)
   - **Imagem 2:** o guia do grupo, em `sprites_rig/guias/` (indicado em cada pedido)
3. Cole o pedido e, **no fim**, o bloco **REGRAS** abaixo.
4. **Baixe a imagem original** (não tire print: o print reduz a resolução) e salve numa pasta, por exemplo
   `Downloads/pecas-gemini/`, com o nome sugerido em cada pedido.
5. Se alguma peça vier errada, peça a correção na mesma conversa, por exemplo:
   *"Refaça só a peça 3, [o que corrigir], mesmo estilo e escala."*

Ordem sugerida (do que mais aparece no jogo ao que menos aparece): rostos → cabelos → roupas → pernas → chapéus →
capas → acessórios → armas → dragônico.

> As **cores de trabalho** de cada pedido não são as cores finais: o jogador escolhe as cores no jogo. Elas só precisam
> ser diferentes entre si dentro de cada peça, para eu separar o que é pele, roupa, metal etc.

---

## Bloco REGRAS (cole no fim de todo pedido)

```
REGRAS
- Mesmo estilo e MESMA ESCALA da folha aprovada (imagem 1): pixel art com pixels do mesmo tamanho, 3 a 4 tons por cor, luz vindo de cima-esquerda, contorno fino escuro. Uma cabeça aqui tem exatamente o tamanho da cabeça careca da folha aprovada.
- Formas, proporções e encaixe: siga o guia (imagem 2). As cores do guia são só ilustrativas.
- Herói DE PERFIL, virado para a DIREITA (rosto em 3/4 para a direita, os dois olhos visíveis, orelha do lado esquerdo).
- Fundo de UMA cor só: cinza médio liso (#808080), sem degradê, sem textura e sem sombra no chão.
- Cada peça UMA vez só (não repita nenhuma), na ordem da lista, bem separadas, sem encostar umas nas outras nem na borda.
- Sem texto, números, rótulos ou marcas d'água.
- Sem contorno preto grosso por fora e sem desfoque.
- Arte original, sem imitar personagens de jogos existentes.
```

---

## 1. Rostos — anexe `guias/guia-rostos.png` — salve como `rostos.png`

```
Crie uma folha de pixel art com 8 CABEÇAS CARECAS do mesmo herói da folha aprovada (imagem 1), uma para cada expressão. Todas com exatamente o mesmo formato, o mesmo tamanho e os olhos na mesma posição da cabeça careca aprovada; só muda a expressão.

1. Normal (igual à cabeça careca aprovada)
2. Bravo: sobrancelhas franzidas em V, boca reta e tensa
3. Sorriso: sorriso aberto e alegre, mostrando um pouco dos dentes
4. Tranquilo: olhos semicerrados (pálpebras caídas), boca pequena e calma
5. Cicatriz: igual ao normal, com uma cicatriz em diagonal atravessando o olho da direita, da testa até a bochecha
6. Piscando: igual ao normal, com os olhos fechados (traço curvo)
7. Dor: olhos apertados e boca aberta
8. Gritando: olhos abertos e boca bem aberta (golpe)

Cores de trabalho: pele pêssego claro; íris AZUL (não castanha); sobrancelhas castanho escuro; bochechas levemente rosadas.
```

**Opcional (recomendo):** no jogo o rosto fica com ~23 px, e olhos pequenos viram manchas. Para um ar mais fofo e
legível, acrescente antes das cores: `Olhos grandes e expressivos, estilo chibi, ocupando cerca de 1/3 da altura do rosto.`
(Nesse caso a cabeça "Normal" desta folha substitui a da folha aprovada.)

---

## 2. Cabelos — anexe `guias/guia-cabelos.png` — salve como `cabelos.png`

```
Crie uma folha de pixel art com 7 CABELOS para o herói da folha aprovada (imagem 1). Cada cabelo vestido numa CABEÇA-MANEQUIM: a cabeça careca da folha aprovada, do mesmo tamanho e formato, mas pintada inteira de cinza-claro liso (#C8C8C8) e SEM rosto (mantenha a orelha). O manequim é idêntico nos 7.

1. Bagunçado (igual ao da folha aprovada)
2. Espetado: mechas em pontas para cima e para trás
3. Longo: liso, caindo atrás das costas até a altura da cintura
4. Coque: preso num coque redondo no alto da cabeça, para trás
5. Moicano: faixa alta de cabelo no centro da cabeça, laterais raspadas (o manequim aparece nas laterais)
6. Rabo de cavalo: preso atrás, com o rabo caindo pelas costas
7. Afro: volumoso e arredondado, envolvendo a cabeça

O lado do rosto (direita do manequim) fica livre: só franja na testa, como no guia (imagem 2), que mostra o tamanho e o encaixe de cada cabelo. O que cai atrás da cabeça e nas costas deve aparecer inteiro.
Cor de trabalho: todos castanho escuro.
```

---

## 3. Roupas — um pedido por roupa — anexe `guias/guia-roupas.png`

Use o modelo abaixo trocando `[ROUPA]`, `[DESCRIÇÃO]` e `[CORES]` pelos valores da tabela.
Salve como `roupa-tunica.png`, `roupa-armadura.png`, `roupa-manto.png` e `roupa-colete.png`.

```
Crie uma folha de pixel art com as peças da roupa [ROUPA] do herói da folha aprovada (imagem 1), em físicos diferentes. As peças "[ROUPA]" do guia (imagem 2) mostram a forma e o tamanho de cada uma.

1. Tronco magro
2. Tronco normal
3. Tronco forte
   (pescoço, ombros e roupa até o quadril; SEM cabeça, SEM braços, SEM pernas; corpo de perfil virado para a direita)
4. Braço normal
5. Braço forte
   (só do ombro até o cotovelo, reto, na VERTICAL, ombro em cima)
6. Antebraço normal
7. Antebraço forte
   (SÓ do cotovelo até a mão fechada, reto, na VERTICAL, cotovelo em cima, mão embaixo)

Roupa: [DESCRIÇÃO]
Cores de trabalho: [CORES]
```

| [ROUPA] | [DESCRIÇÃO] | [CORES] |
|---|---|---|
| túnica | túnica de tecido de mangas compridas, barra curta abaixo do cinto, cinto com fivela. A versão normal deve ser igual à da folha aprovada. | túnica e mangas azul royal; cinto e punhos verde-musgo; fivela dourada; mão pêssego claro |
| armadura | peitoral de placas de metal com ombreiras, saiote curto de couro e cinto; braços com ombreira e braçadeira de metal e luva de couro | placas cinza metálico; emblema pequeno no peito azul royal; saiote, cinto e luvas verde-musgo; fivela dourada |
| manto | manto longo de mago que desce abaixo do quadril, gola em V, faixa na cintura e na barra; mangas largas | manto e mangas azul royal; faixas verde-musgo; fecho dourado; mão pêssego claro |
| colete | colete aberto sem mangas por cima de uma camisa clara, com cinto. Os braços ficam DE FORA: braço e antebraço são só pele, sem manga | colete azul royal; camisa branco-creme; cinto verde-musgo; pele pêssego claro |

---

## 4. Pernas — anexe `guias/guia-pernas.png` — salve como `pernas.png`

```
Crie uma folha de pixel art com as pernas do herói da folha aprovada (imagem 1). O guia (imagem 2) mostra a forma e o tamanho.

1. Coxa normal
2. Canela normal
3. Coxa forte (um pouco mais grossa)
4. Canela forte
   (calça, reta, na VERTICAL; coxa com o quadril em cima; canela com o joelho em cima e SEM bota)
5. Bota de couro de perfil, bico apontando para a DIREITA (igual à da folha aprovada)

Cores de trabalho: calça verde-musgo; bota marrom.
```

---

## 5. Chapéus — anexe `guias/guia-chapeus.png` — salve como `chapeus.png`

```
Crie uma folha de pixel art com 8 peças de cabeça para o herói da folha aprovada (imagem 1). As peças 1 a 7 vestidas na CABEÇA-MANEQUIM: a cabeça careca da folha aprovada, do mesmo tamanho e formato, pintada inteira de cinza-claro liso (#C8C8C8), SEM rosto (mantenha a orelha), idêntica em todas.

1. Chapéu de mago: pontudo e alto, com a ponta caída para trás (esquerda), aba larga e faixa com fivela
2. Elmo: capacete de metal com protetor de nariz e penacho no topo
3. Coroa: de ouro, com pedras
4. Bandana: faixa de pano amarrada na testa, com as pontas do nó soltas atrás
5. Chifres: faixa na testa com dois chifres curvos de osso
6. Orelhas de gato: duas orelhas de gato no alto da cabeça
7. Capuz: capuz de pano cobrindo a cabeça e a nuca, com o rosto livre
8. Ombros do capuz: a parte do capuz que cai sobre os ombros, SOZINHA (sem manequim)

O guia (imagem 2) mostra o tamanho e o encaixe de cada peça na cabeça.
Cores de trabalho: chapéu de mago, bandana, capuz e faixa dos chifres ROXOS; elmo cinza metálico; faixas, penacho e detalhes VERMELHOS; ouro dourado; chifres cor de osso; orelhas de gato castanho escuro com o interior rosa.
```

---

## 6. Acessórios — anexe `guias/guia-acessorios.png` — salve como `acessorios.png`

```
Crie uma folha de pixel art com 7 acessórios para o herói da folha aprovada (imagem 1). As peças 1 a 4 vestidas na CABEÇA CARECA APROVADA, com o rosto normal, exatamente igual à da folha aprovada.

1. Óculos redondos: armação vermelha, lentes azul-claras
2. Tapa-olho vermelho no olho da direita, com a tira passando pela cabeça
3. Máscara de pano vermelha cobrindo o nariz e a boca
4. Barba cheia
5. Cachecol magro
6. Cachecol normal
7. Cachecol forte
   (5 a 7 sozinhos: cachecol enrolado no pescoço, de perfil, com a ponta solta para trás; a largura acompanha o físico)

O guia (imagem 2) mostra o tamanho e o encaixe de cada peça.
Cores de trabalho: armação, tapa-olho, máscara e cachecol VERMELHOS; lentes azul-claras; barba castanho escuro; pele pêssego claro.
```

---

## 7. Capas — anexe `guias/guia-capas.png` — salve como `capas.png`

```
Crie uma folha de pixel art com as capas do herói da folha aprovada (imagem 1), paradas, penduradas, vistas de perfil como ficam atrás do herói (presas nos ombros, com um pouco do forro aparecendo). O guia (imagem 2) mostra a forma e o tamanho.

1. Capa curta magro
2. Capa curta normal
3. Capa curta forte
   (até a cintura)
4. Capa longa magro
5. Capa longa normal
6. Capa longa forte
   (até a panturrilha; a normal deve ser igual à da folha aprovada)
7. Fecho da capa: faixa curta que passa no peito, com um broche redondo, sozinha

Cores de trabalho: capa vermelha, com o forro um pouco mais escuro; broche dourado.
```

---

## 8. Armas — anexe `guias/guia-armas.png` — salve como `armas.png`

> Hoje o rig só troca a espada e as peças das costas. Lança, escudo de defesa, cajado e arco ainda são desenhados por
> código: quando esta folha chegar, eu adiciono o suporte a eles.

```
Crie uma folha de pixel art com as armas do herói da folha aprovada (imagem 1). O guia (imagem 2) mostra a forma e o tamanho relativo.

1. Lança de madeira com ponta de metal, na HORIZONTAL, ponta para a DIREITA
2. Escudo de defesa: escudo grande em forma de brasão, visto de frente (o guerreiro segura à frente do corpo)
3. Cajado de mago de madeira, na VERTICAL, com uma esfera mágica presa no topo por garras de madeira
4. Arco de madeira, na VERTICAL, com a corda do lado esquerdo, sem flecha
5. Aljava de couro com 3 flechas, na vertical (vai pendurada nas costas)
6. Flecha, na HORIZONTAL, ponta para a DIREITA

Cores de trabalho: madeira marrom; metal cinza claro; escudo verde-musgo com uma faixa azul royal e detalhe dourado; esfera do cajado vermelha; penas das flechas vermelhas; corda do arco bege.
```

---

## 9. Dragônico — anexe `guias/guia-dragonico.png` — salve como `dragonico.png`

```
Crie uma folha de pixel art com as peças da versão DRAGÔNICA do herói (meio-dragão), no mesmo estilo e na mesma escala da folha aprovada (imagem 1). O guia (imagem 2) mostra a forma, o tamanho e o encaixe.

1. Cabeça dragônica normal
2. Cabeça dragônica brava
3. Cabeça dragônica sorrindo
4. Cabeça dragônica tranquila
5. Cabeça dragônica com cicatriz
   (1 a 5: o mesmo formato e tamanho da cabeça careca aprovada, pele de escamas, pupilas em fenda, SEM chifres e SEM cabelo)
6. Par de chifres, sozinho, curvos para trás
7. Asas e cauda FECHADAS: asa de morcego dobrada nas costas e cauda de dragão caindo atrás (sem o corpo)
8. Asas e cauda MEIO ABERTAS
9. Asas e cauda ABERTAS PARA CIMA (planando)
10. Asas e cauda ABERTAS RETAS para trás
11. Antebraço com garras: do cotovelo até a mão com garras, reto, na VERTICAL, cotovelo em cima

Cores de trabalho: escamas vermelhas; membrana das asas, chifres e ponta da cauda amarelo-ouro; garras cor de osso; olhos amarelos.
```
