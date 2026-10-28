# Heróis de Pixel

Plataforma 2D em pixel art (personagens e inimigos em alta resolução, 2x o cenário), feita em HTML5 Canvas + JavaScript puro (sem build, sem dependências).
Funciona no navegador do PC e do celular, e pode ser instalada como app (PWA).

**▶ Jogar online:** https://vasconcellosgabriel.github.io/herois-de-pixel/

## Como jogar localmente
Abra `index.html` no navegador. Para testar no celular, o multiplayer ou o modo "instalável"/offline, sirva por HTTP:

    node servidor.js   # mostra o endereço para o PC e para o celular (mesma rede Wi-Fi)

## Multiplayer cooperativo (até 4, grátis, sem servidor)
- **Criar sala**: título → *Multiplayer* → *Criar sala*. Aparece um código de 5 letras e os botões *Convidar* / *Copiar link*.
- **Entrar**: digite o código (ou abra o link do convite, que já preenche o código) → *Entrar*. Quem entra no meio da fase cai direto nela.
- O **anfitrião** escolhe as fases; vidas e moedas são do time. Quem fica sem vidas assiste e volta quando o time ganha uma vida (moedas).
- A pausa no multiplayer é só um menu: o jogo continua para os outros. O anfitrião precisa deixar o jogo aberto (se ele minimizar/bloquear a tela, o mundo para para todos).

**Como funciona**: conexão direta entre os aparelhos (WebRTC) com a biblioteca [PeerJS](https://peerjs.com), carregada só quando você abre o multiplayer.
O servidor público gratuito do PeerJS apenas apresenta os aparelhos um ao outro; quando a rede (ex.: 4G com CGNAT) não permite a ligação direta, o PeerJS usa um relay TURN gratuito dele.
O anfitrião roda a simulação inteira; os convidados mandam os comandos e recebem o estado do mundo 20x/s (~6 KB/s), suavizado na tela. Ver `js/net.js`.
Como tudo passa pelo anfitrião, o convidado sente um pequeno atraso (o ping aparece no canto da tela); entre amigos no mesmo país costuma ficar abaixo de 100 ms.

## Controles
| Ação | Teclado / mouse | Celular |
|---|---|---|
| Mover | Setas / A D | ◀ ▶ |
| Pular | Espaço / ↑ / W (↓ + pulo desce de plataforma) | ▲ |
| Habilidades | J / K / L (ou Z / X / C) | botões à direita |
| Mirar (Arqueiro) | Mouse (clique esquerdo atira) · ou Q / E para subir/descer a mira | arraste o dedo na tela |
| Pausa | Esc / P | ❚❚ |

**Controles configuráveis (PC):** menu *Controles* no título e na pausa. Cada ação tem tecla principal e alternativa; há o esquema "WASD + mouse" (habilidades em 1 2 3). Os botões esquerdo/direito/do meio do mouse também podem disparar as habilidades 1/2/3 (padrão: esquerdo=1, direito=2, meio=3). O Mago e o Arqueiro miram com o mouse.

## Classes
- **Guerreiro** (6 ♥): J espada (curto alcance, rebate projéteis) · K lança arremessável (atravessa inimigos) · L escudo (segure)
- **Mago** (4 ♥, mana): J magia elemental (10 mana) · K raio (40 mana, 10 de dano, atordoa) · L cura (45 mana, +1 ♥).
  A mana recarrega devagar (4,5/s) e só depois de ~1 s sem gastar.
- **Arqueiro** (5 ♥): J flecha mirada · K tiro triplo (3 flechas que atravessam o primeiro alvo) · L rolamento invulnerável
- **Dragônico** (6 ♥): J garras (combo de 3, a última é mais forte) · K sopro de fogo (jato de chamas que queima) · L mergulho (despenca e explode ao pousar). Passivo: pulo duplo com batida de asas e **planar** segurando o pulo.

## Inimigos
- **Floresta**: slime, morcego, **planta carnívora** (fica parada e morde de surpresa)
- **Cavernas**: slime, morcego, esqueleto, **fantasma** (atravessa paredes e dá o bote)
- **Castelo**: esqueleto, cavaleiro, morcego, **guarda da peste** (lança de longo alcance)
- **Chefe**: Rei Golem

## Mecânicas
- **Status**: as magias do Mago têm chance de **queimar** (Fogo), **congelar** (Gelo, o inimigo congelado leva +50% e quebra) ou **envenenar** (Veneno). O chefe não congela de vez: só fica lento.
- **Críticos**: todo ataque pode ser crítico (dano ×2; Arqueiro 15%, Dragônico 12%). No **Rei Golem**, acertar o **núcleo brilhante** no peito é sempre crítico, e ele fica exposto (dano ×3) quando bate na parede e fica atordoado.
- **Vidas** (estilo Sonic): você começa cada fase com 3 vidas. Zerar os corações custa 1 vida; sem vidas, é *game over* e a fase recomeça. A cada 50 moedas, +1 vida.
- **Chefe**: cada vez que você perde uma vida, o Rei Golem recupera 20% da vida.
- **Impacto**: rastro em meia-lua nos golpes (cor da joia do herói), pausas curtas, números de dano, inimigos que "amassam" ao apanhar, moedas que saltam, partículas e tremida de tela.
- **Ambiente**: partículas por fase (vaga-lumes, esporos, brasas), luzes de tochas e cristais, faixas de cinema na entrada do chefe.

## Personalização
Classe, altura, porte, pele, expressão, olhos, 8 cabelos + cor, 4 roupas + 2 cores, 8 chapéus + cor,
3 capas + cor, 6 acessórios, cor da arma e da magia (seletor de cor livre) — mais personagens prontos e botão aleatório.
O personagem fica salvo no aparelho (localStorage).

## Para os amigos jogarem (grátis)
Suba a pasta inteira em qualquer hospedagem estática: GitHub Pages, Netlify, Cloudflare Pages ou itch.io (zip).
No celular: abrir o link → menu do navegador → "Adicionar à tela inicial".

## Estrutura
- `js/util.js`: constantes, contorno automático dos sprites, fonte de pixels, áudio sintetizado, entrada (teclado, mouse, toque)
- `js/sprites.js`: motor de pixels com sombreamento automático (`PX`) e personagem desenhado por **esqueleto** (cinemática inversa) a 2x de resolução, poses/animações, ícones
- `js/enemies.js`: sprites e animações dos inimigos e do chefe
- `js/world.js`: tiles e cenário em alta resolução (terreno com ruído, bordas/cantos, árvores, cristais, tochas), fundos em camadas (parallax, nuvens), decoração, luzes
- `js/levels.js`: **lista de fases** e gerador de fases
- `js/game.js`: física, combate, status, críticos, vidas, inimigos, chefe, renderização, HUD. Suporta vários heróis (`w.players`; `w.p` é o deste aparelho); cada herói lê o próprio controle (`p.inp`)
- `js/net.js`: multiplayer (salas, conexão P2P, "fotos" do mundo, eventos de efeitos)
- `js/ui.js`: menus, criador de personagem, laço principal

## Adicionando conteúdo
- **Nova fase**: adicione um objeto em `LEVELS` (`levels.js`): tema, tamanho, semente, inimigos, densidade. Coloque-a antes do chefe.
- **Novo tema visual**: `THEMES` + ramos em `makeBg`, `decoSprites` e `buildDecor` (`world.js`).
- **Novo inimigo**: `ENEMIES` + `E_AI` (`game.js`) + sprite em `enemies.js` + `enemyImage` (`game.js`). Na IA, o alvo é `e.tgt` (jogador vivo mais próximo).
- **Multiplayer**: na lógica do jogo use `sfx()`, `burst()`, `floatText()`, `addFx()` e `announce()` (eles repassam o efeito aos convidados). Campo novo que precisa aparecer na tela dos outros → listas `PF`/`EF`/`QF`/`RF`/`WF` em `net.js`. Ao mudar o protocolo, aumente `PROTO`.
- **Nova classe**: `CLASSES`, `COST`, `CDMAX` + `skillA/B/C` (`game.js`), poses em `skeletonFor` e arma em `drawChar` (`sprites.js`), `POSE_LIST` (`ui.js`).
