# Heróis de Pixel

Plataforma 2D em pixel art (personagens e inimigos em alta resolução, 2x o cenário), feita em HTML5 Canvas + JavaScript puro (sem build, sem dependências).
Funciona no navegador do PC e do celular, e pode ser instalada como app (PWA).

Feito do zero com vibe coding no **Claude Code**: a primeira versão jogável ficou pronta em 2 horas, e o jogo hoje tem cerca de 4.000 linhas de JavaScript.

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
| Ação | Teclado / mouse | Controle (gamepad) | Celular |
|---|---|---|---|
| Mover | Setas / A D | analógico esquerdo / direcional | ◀ ▶ |
| Pular | Espaço / ↑ | A | ▲ |
| Agachar (↓ + pulo desce de plataforma) | ↓ / S | ↓ do direcional | botão AGACHAR |
| Habilidades 1 e 2 | J / K · botões esquerdo/direito do mouse | X / Y | botões à direita (com ícone e recarga) |
| Esquiva / escudo / cura / mergulho | **Q** (ou L) | B ou LB | botão pequeno à direita |
| Ataque especial | **E** (ou C, botão do meio do mouse) | RB ou RT | ★ |
| Mirar (Mago e Arqueiro) | Mouse · ou I / O | analógico direito | **segure e arraste o botão de ataque**: o tiro sai ao **soltar**; toque rápido = mira automática; voltar o dedo ao centro cancela |
| Pausa | Esc / P | Start | ❚❚ |

**Tela de Controles** (no título e na pausa), com três abas:
- **Teclado**: tecla principal e alternativa de cada ação, botões do mouse e o esquema "WASD + mouse".
- **Controle**: botões do gamepad configuráveis separadamente do teclado, **sensibilidade da mira**, zona morta dos analógicos, inverter a mira vertical e vibração. Nos menus, o controle navega com o direcional (A confirma, B volta).
- **Câmera**: distância da câmera (Normal / Longe / Muito longe). Também troca pelo botão 📷 na pausa.
No celular cada dedo é tratado à parte (dá para andar, pular e atacar ao mesmo tempo) e cada botão tem uma área de toque maior que o desenho.

## Classes
- **Guerreiro** (6 ♥): J espada (curto alcance, rebate projéteis) · K lança arremessável (atravessa inimigos) · L escudo (segure: defende pela frente e pelas costas; só passa o que vem de cima ou de baixo)
- **Mago** (4 ♥, mana): J magia elemental (10 mana; dano 3 fogo / 2 gelo / 2 veneno) · K raio (40 mana, 10 de dano, atordoa) · L cura (35 mana, +2 ♥ e +1 ♥ nos aliados por perto).
  A mana recarrega devagar (4,5/s) e só depois de ~1 s sem gastar.
- **Arqueiro** (4 ♥, foco em mobilidade): J flecha mirada (2 de dano; quanto mais longe o alvo, maior a chance de crítico e o crítico chega a ×3) · K tiro triplo (3 flechas que atravessam o primeiro alvo) · L rolamento invulnerável. Passivo: **pulo duplo** (cambalhota).
- **Dragônico** (6 ♥): J garras (combo de 3, a última é mais forte) · K sopro de fogo (jato de chamas que queima) · L mergulho (despenca e explode ao pousar). Passivo: pulo duplo com batida de asas e **planar** segurando o pulo.

## Inimigos
- **Floresta**: slime, morcego, **planta carnívora** (fica parada e morde de surpresa)
- **Cavernas**: slime, morcego, esqueleto, **fantasma** (atravessa paredes e dá o bote)
- **Castelo**: esqueleto, cavaleiro, morcego, **guarda da peste** (lança de longo alcance)
- **Chefe**: Rei Golem

## Mecânicas
- **Status**: as magias do Mago têm chance de **queimar** (Fogo), **congelar** (Gelo, o inimigo congelado leva +50% e quebra) ou **envenenar** (Veneno). O chefe não congela de vez: só fica lento.
- **Críticos**: todo ataque pode ser crítico (dano ×2; Arqueiro 15%, Dragônico 12%). No **Rei Golem**, acertar o **núcleo brilhante** no peito é sempre crítico, e ele fica exposto (dano ×3) quando bate na parede e fica atordoado.
- **Vidas** (estilo Sonic): você começa com 3 vidas. Zerar os corações **ou cair num abismo** custa 1 vida; sem vidas, é *game over* e a fase recomeça (de volta a 3 vidas). A cada 50 moedas, +1 vida — e as **vidas extras passam para a próxima fase**.
- **Ataque especial**: a barra dourada enche derrotando inimigos (e batendo no chefe). Cheia, cada classe solta o seu: Fúria giratória (Guerreiro), Tempestade arcana (Mago), Chuva de flechas (Arqueiro), **Lança-chamas** contínuo para um lado (Dragônico). A barra **passa para a próxima fase**.
- **Agachar**: corpo mais baixo, projéteis altos passam por cima. Agachado dá para andar (mais devagar) e pular sem se levantar.
- **Caixas, barris e vasos**: sólidos e quebráveis; dão moedas e às vezes poções de mana ou corações.
- **Segredos**: toda fase tem um morro com **túnel escondido** — quebre a parede rachada para entrar e a do outro lado para sair (moedas + baú). Há também baús em plataformas altas.
- **Áreas por classe**: **prateleiras altas** com baú que só quem tem pulo duplo alcança (Arqueiro, Dragônico) e **ninhos de caixas** no alto que se quebram atirando para cima (Mago, Arqueiro).
- **Relevo**: montes em degraus e vales afundados (com moedas e baús) em todas as fases.
- **XP e Evolução**: inimigos dão XP (para o time todo). Cada nível dá 1 ponto para Vida, Mana, Velocidade ou Pulo. No **Ferreiro**, as moedas compram mais dano e melhorias de cada habilidade. A evolução é guardada por classe; moedas e XP são guardados ao completar a fase.
- **Chefe**: cada vez que você perde uma vida, o Rei Golem recupera 20% da vida.
- **Impacto**: rastro em meia-lua nos golpes (cor da joia do herói), pausas curtas, números de dano, inimigos que "amassam" ao apanhar, moedas que saltam, partículas e tremida de tela.
- **Ambiente**: partículas por fase (vaga-lumes, esporos, brasas), luzes de tochas e cristais, faixas de cinema na entrada do chefe.

## Personalização
Classe, altura, porte, pele, expressão, olhos, 8 cabelos + cor, 4 roupas + 2 cores, 8 chapéus + cor,
3 capas + cor, 6 acessórios + cor (na aba Extras), cor da arma e da magia — mais personagens prontos e botão aleatório.
Em cada cor, o quadrado vazio com "+" abre o seletor para escolher exatamente a cor do item.
O personagem fica salvo no aparelho (localStorage).

## Para os amigos jogarem (grátis)
Suba a pasta inteira em qualquer hospedagem estática: GitHub Pages, Netlify, Cloudflare Pages ou itch.io (zip).
No celular: abrir o link → menu do navegador → "Adicionar à tela inicial".

## Estrutura
- `js/util.js`: constantes, contorno automático dos sprites, fonte de pixels, áudio sintetizado, entrada (teclado, mouse, toque)
- `js/sprites.js`: motor de pixels com sombreamento automático (`PX`) e personagem desenhado por **esqueleto** (cinemática inversa) a 2x de resolução, poses/animações, ícones
- `js/enemies.js`: sprites e animações dos inimigos e do chefe
- `js/world.js`: tiles e cenário em alta resolução (terreno com ruído, bordas/cantos, árvores, cristais, tochas), fundos em camadas (parallax, nuvens), decoração, luzes
- `js/levels.js`: **lista de fases** e gerador de fases (túneis secretos, paredes falsas, baús, caixas)
- `js/game.js`: física, combate, status, críticos, vidas, inimigos, chefe, renderização, HUD. Suporta vários heróis (`w.players`; `w.p` é o deste aparelho); cada herói lê o próprio controle (`p.inp`)
- `js/net.js`: multiplayer (salas, conexão P2P, "fotos" do mundo, eventos de efeitos)
- `js/ui.js`: menus, criador de personagem, tela de Evolução, botões de toque, laço principal

## Adicionando conteúdo
- **Nova fase**: adicione um objeto em `LEVELS` (`levels.js`): tema, tamanho, semente, inimigos, densidade. Coloque-a antes do chefe.
- **Novo tema visual**: `THEMES` + ramos em `makeBg`, `decoSprites` e `buildDecor` (`world.js`).
- **Novo inimigo**: `ENEMIES` + `E_AI` (`game.js`) + sprite em `enemies.js` + `enemyImage` (`game.js`). Na IA, o alvo é `e.tgt` (jogador vivo mais próximo).
- **Multiplayer**: na lógica do jogo use `sfx()`, `burst()`, `floatText()`, `addFx()` e `announce()` (eles repassam o efeito aos convidados). Campo novo que precisa aparecer na tela dos outros → listas `PF`/`EF`/`QF`/`RF`/`WF` em `net.js`. Ao mudar o protocolo, aumente `PROTO`.
- **Nova classe**: `CLASSES`, `COST`, `CDMAX` + `skillA/B/C` (`game.js`), poses em `skeletonFor` e arma em `drawChar` (`sprites.js`), `POSE_LIST` (`ui.js`).
