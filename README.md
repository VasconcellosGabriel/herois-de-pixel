# Heróis de Pixel

Plataforma 2D em pixel art (personagens e inimigos em alta resolução, 2x o cenário), feita em HTML5 Canvas + JavaScript puro (sem build, sem dependências).
Funciona no navegador do PC e do celular, e pode ser instalada como app (PWA).

Feito do zero com vibe coding no **Claude Code**: a primeira versão jogável ficou pronta em 2 horas, e o jogo hoje tem cerca de 7.300 linhas de JavaScript: **30 fases em 7 mundos**, 7 chefes, multiplayer online e local.

**▶ Jogar online:** https://vasconcellosgabriel.github.io/herois-de-pixel/

## Como jogar localmente
Abra `index.html` no navegador. Para testar no celular, o multiplayer ou o modo "instalável"/offline, sirva por HTTP:

    node servidor.js   # mostra o endereço para o PC e para o celular (mesma rede Wi-Fi)

## Multiplayer local (até 4 na mesma tela)
- Título → *Multiplayer local*. O jogador 1 é quem abriu a sala (teclado e mouse no PC, a tela de toque no celular, ou o controle que estava usando).
- Os outros entram apertando **A** no próprio controle (ou **Enter**, para entrar pelo teclado). Cada um troca de herói com ◀ ▶ (o seu herói salvo ou um dos personagens prontos) e sai com **B**. O jogador 1 aperta **Start** (ou o botão) para escolher a fase.
- **No celular** só funciona com controles pareados (Bluetooth): a tela de toque vale apenas para o jogador 1.
- A câmera mostra o grupo todo e **ninguém sai da tela**: quem está na ponta e tenta se afastar fica segurado. Quem cai volta ao lado de um companheiro.
- Vidas e moedas são do time; o XP de cada herói vai para a evolução da classe dele (mesmo save). A vida dos inimigos também aumenta com o número de jogadores.

## Multiplayer online (até 4, grátis, sem servidor)
- **Criar sala**: título → *Multiplayer online* → *Criar sala*. Aparece um código de 5 letras e os botões *Convidar* / *Copiar link*.
- **Entrar**: digite o código (ou abra o link do convite, que já preenche o código) → *Entrar*. Quem entra no meio da fase cai direto nela.
- O **anfitrião** escolhe as fases; vidas e moedas são do time. Quem fica sem vidas assiste e volta quando o time ganha uma vida (moedas).
- **Dificuldade em grupo**: cada jogador a mais deixa os inimigos e o chefe 50% mais resistentes (2 jogadores: ×1,5 de vida · 3: ×2 · 4: ×2,5). Se alguém entra ou sai no meio da fase, a vida deles se ajusta na hora.
- **Mini-chat** no canto superior direito: Enter (ou T) abre no PC, o botão 💬 no celular (com frases rápidas). Avisos do jogo aparecem ali: quem perdeu ou ganhou vida, quem usou o especial, quem entrou ou saiu.
  O tamanho do chat (Pequeno / Normal / Grande / Enorme) muda no botão 💬 da pausa ou em *Controles → Tela*.
- **Trocar de roupa** no meio da fase (pausa → 👕) aparece na hora para todos.
- Cada aparelho ouve só os sons do próprio herói (e os do mundo: chefe, 1UP...). Clarão e tremida de tela também aparecem só para quem causou.
- A pausa no multiplayer é só um menu: o jogo continua para os outros. O anfitrião precisa deixar o jogo aberto (se ele minimizar/bloquear a tela, o mundo para para todos).

**Como funciona**: conexão direta entre os aparelhos (WebRTC) com a biblioteca [PeerJS](https://peerjs.com), carregada só quando você abre o multiplayer.
O servidor público gratuito do PeerJS apenas apresenta os aparelhos um ao outro; quando a rede (ex.: 4G com CGNAT) não permite a ligação direta, o PeerJS usa um relay TURN gratuito dele.
O anfitrião roda a simulação (inimigos, golpes, dano); os convidados recebem o estado do mundo 30x/s, suavizado na tela. Ver `js/net.js`.
- **Sem atraso para andar**: cada convidado simula o próprio herói na hora (andar, pular, agachar, planar) e manda a posição ao anfitrião. Empurrões, rolamento, mergulho e morte continuam sendo decididos pelo anfitrião.
- **Dois canais**: um confiável para eventos, botões e chat, e um rápido, sem reenvio, para as fotos do mundo e as posições. Assim um pacote perdido no Wi-Fi não segura os seguintes.
- O ping aparece no canto inferior direito (no anfitrião, o pior entre os convidados). Se aparecer **RELAY**, a conexão direta falhou e os dados passam por um servidor na Europa/EUA, o que aumenta muito o ping. Costuma acontecer em redes de empresa/escola, 4G com CGNAT ou roteadores que bloqueiam conexão direta.

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
- **Tela**: distância da câmera (Normal / Longe / Muito longe) e tamanho do mini-chat. Também trocam pelos botões 📷 e 💬 na pausa.
No celular cada dedo é tratado à parte (dá para andar, pular e atacar ao mesmo tempo) e cada botão tem uma área de toque maior que o desenho.

## Classes
- **Guerreiro** (6 ♥): J espada (combo de 3: corte, corte de volta e estocada com avanço; alcance maior, rebate projéteis) · K lança arremessável (atravessa inimigos) · L escudo (segure: defende pela frente e pelas costas; só passa o que vem de cima ou de baixo)
- **Mago** (4 ♥, mana): J magia elemental (10 mana; dano 3 fogo / 2 gelo / 2 veneno) · K raio (40 mana, 10 de dano, atordoa) · L cura (35 mana, +2 ♥ e +1 ♥ nos aliados por perto).
  A mana recarrega devagar (4,5/s) e só depois de ~1 s sem gastar.
- **Arqueiro** (4 ♥, foco em mobilidade): J flecha mirada (2 de dano; quanto mais longe o alvo, maior a chance de crítico e o crítico chega a ×3) · K tiro triplo (3 flechas que atravessam o primeiro alvo) · L rolamento invulnerável. Passivo: **pulo duplo** (cambalhota).
- **Dragônico** (6 ♥): J garras (combo de 3, a última é mais forte) · K sopro de fogo (jato de chamas que queima) · L mergulho (despenca e explode ao pousar). Passivo: pulo duplo com batida de asas e **planar** segurando o pulo.

## Mundos e chefes
| Mundo | Fases | Chefe |
|---|---|---|
| 1. Reino Verde | Floresta, Cavernas de Cristal, Castelo Sombrio | **Rei Golem**: salto, pedras e investida; o núcleo no peito é o ponto fraco (exposto quando ele bate na parede) |
| 2. Picos Gelados | Bosque Outonal → Primeira Neve → Lago Congelado → Caverna de Gelo (no gelo o chão escorrega) | **Yeti Ancião**: anda e pula pela arena (ao cair, estalactites grandes despencam do teto), arremessa a lança (baixa: pule; alta: abaixe-se), joga uma bola de neve que começa pequena e vai crescendo enquanto rola e investe com a lança baixa (pule por cima!). Quando ruge ou fica com a lança cravada na parede, a boca aberta é o ponto fraco |
| 3. Pântano Gosmento | Degelo do Brejo (a neve derretendo) → Lodo das Rãs → Floresta de Gosma (vira um pântano alagado no meio da fase; nos lagos, heróis e inimigos ficam mais lentos) | **Rei Gosma**: pulos em sequência com ondas de gosma, cuspe em arco e filhotes de slime (a coroa é o ponto fraco) |
| 4. Deserto Escaldante | Savana Rachada → Oásis → Ruínas do Faraó | **Escorpião Imperador**: investida (fica tonto ao bater na parede), rajada de ferrões e mergulho na areia |
| 5. Montanha de Fogo | Trilha de Cinzas (floresta queimada ao pé do vulcão) → 2 fases de vulcão | **Dragão de Magma**: chuva de fogo, rasante e sopro rasteiro (agache!); o peito em brasa é o ponto fraco quando ele pousa |
| 6. Castelo do Vampiro | Cemitério do Conde (o castelo no alto da colina) → 3 fases dentro do castelo | **Conde Sanguinário**: some e reaparece ao seu lado, morcegos teleguiados, leque de orbes e investida da capa |
| 7. Cidadela Celeste | Pico do Amanhecer (acima do mar de nuvens) → 2 fases na cidadela | **Titã da Tempestade** (chefe final): raios marcados no chão, rajadas de vento, anel de orbes e soco no chão |

A primeira fase de cada mundo faz a ponte com o mundo anterior, e o cenário muda aos poucos até o tema novo.

Cada chefe tem uma fase de **fúria** (abaixo de 50% da vida): fica mais rápido e ataca mais. Nos mundos avançados os inimigos comuns são mais resistentes.

## Inimigos
Cada fase tem inimigos que combinam com o lugar (morcegos só em cavernas e castelos, demônios na forja etc.).
- **Reino Verde**: slime, **falcão raivoso** (circula no alto e mergulha em você), **planta carnívora**, morcego, **aranha** (fica pendurada no fio e cai quando você passa embaixo), esqueleto, **fantasma** (atravessa paredes), cavaleiro, **guarda da peste**
- **Picos Gelados**: **lobo** (corre atrás, agacha rosnando e dá o bote), falcão das neves, morcego e aranha de gelo, esqueleto congelado
- **Pântano Gosmento**: **sapo venenoso** (pula e estica a língua), **slime gigante** (dentes, caveira dentro; ao morrer vira dois slimes), fogo-fátuo
- **Deserto Escaldante**: **escorpião** (crava o ferrão de cima: agachar não adianta), **naja** (empina e dá o bote; de longe cospe veneno), **múmia** (agarra com os braços esticados), falcão do deserto
- **Montanha de Fogo**: **diabrete** (voa à distância e atira bolas de fogo), **cão infernal**, **ferreiro demônio** (fornalha acesa no peito e chaminé nas costas: bate o martelo em brasa no chão soltando uma onda de choque e, de longe, arremessa um lingote quente com a tenaz), cavaleiro demoníaco
- **Castelo do Vampiro**: morcego vampiro, lobo sombrio, fantasma carmesim, aranha, esqueleto, cavaleiro, guarda
- **Cidadela Celeste**: águia dourada, cavaleiros e guardas dourados, espírito da tempestade
- Os mesmos inimigos mudam de cor em cada mundo (skins): slimes, falcões, lobos, aranhas, morcegos, esqueletos, cavaleiros e fantasmas.

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
- **Chefes**: cada vez que você perde uma vida, o chefe recupera 20% da vida. Ao passar de 66% e 33%, caem corações de bônus.
- **Impacto**: rastro em meia-lua nos golpes (cor da joia do herói), pausas curtas, números de dano, inimigos que "amassam" ao apanhar, moedas que saltam, partículas e tremida de tela.
- **Ambiente**: partículas por mundo (vaga-lumes, esporos, neve, bolhas, areia, brasas, brilhos), luzes de tochas e cristais, faixas de cinema na entrada do chefe.

## Personalização
Classe, altura, porte, pele, expressão, olhos, 8 cabelos + cor, 4 roupas + 2 cores, 8 chapéus + cor,
3 capas + cor, 6 acessórios + cor (na aba Extras), cor da arma e da magia — mais personagens prontos e botão aleatório.
Em cada cor, o quadrado vazio com "+" abre o seletor para escolher exatamente a cor do item.
O personagem fica salvo no aparelho (localStorage). Dá para **trocar de roupa durante a campanha** pelo menu de pausa (👕): muda a aparência, mas não a classe.

## Para os amigos jogarem (grátis)
Suba a pasta inteira em qualquer hospedagem estática: GitHub Pages, Netlify, Cloudflare Pages ou itch.io (zip).
No celular: abrir o link → menu do navegador → "Adicionar à tela inicial".

## Estrutura
- `js/util.js`: constantes, contorno automático dos sprites, fonte de pixels, áudio sintetizado, entrada (teclado, mouse, toque; cada controle separado em `Pads`)
- `js/sprites.js`: motor de pixels com sombreamento automático (`PX`) e personagem desenhado por **esqueleto** (cinemática inversa) a 2x de resolução, poses/animações, ícones
- `js/enemies.js`: sprites e animações dos inimigos do mundo 1 e do Rei Golem
- `js/world.js`: tiles e cenário em alta resolução (terreno com ruído, bordas/cantos, árvores, cristais, tochas), fundos em camadas (parallax, nuvens), decoração, luzes
- `js/worlds.js`: temas dos mundos 2 a 7 (cores, fundos, decoração)
- `js/levels.js`: **lista de fases** (`LEVELS`, `WORLDS`) e gerador de fases (túneis secretos, paredes falsas, baús, caixas)
- `js/game.js`: física, combate, status, críticos, vidas, inimigos, chefe, renderização, HUD. Suporta vários heróis (`w.players`; `w.p` é o deste aparelho); cada herói lê o próprio controle (`p.inp`)
- `js/bestiary.js`: falcão, sapo, escorpião, diabrete e os 6 chefes novos (sprites gerados sob demanda, IA, projéteis)
- `js/fauna.js`: lobo, naja, slime gigante, múmia, ferreiro demônio, aranha e as skins de cada mundo (`ENEMY_SKIN`)
- `js/spritepack.js` + `sprites/`: heróis montados com **folhas PNG em camadas** (corpo, roupa, cabelo, chapéu, arma...) recoloridas com as cores do criador de personagem. As folhas-base saem de `node tools/exportar-sprites.js`; o guia para o artista está em [sprites/LEIA-ME.md](sprites/LEIA-ME.md). Sem as folhas (ou com `?procedural` na URL) o herói é desenhado por código.
- `js/net.js`: multiplayer online (salas, conexão P2P, "fotos" do mundo, eventos de efeitos)
- `js/local.js`: multiplayer local (sala, aparelho de cada herói)
- `js/ui.js`: menus, criador de personagem, tela de Evolução, botões de toque, laço principal

## Adicionando conteúdo
- **Nova fase**: adicione um objeto em `LEVELS` (`levels.js`): mundo, tema, tamanho, semente, inimigos, densidade, `hpK` (vida extra dos inimigos). Coloque-a antes do chefe do mundo.
- **Novo tema visual**: em `worlds.js`, um item em `THEMES`. Para reaproveitar um estilo existente use `bgAs`/`decoAs`/`platAs`/`crateAs`; para um cenário próprio, preencha `BG_BUILD`, `DECO_BUILD` e `DECOR_PLACE`.
- **Novo inimigo ou chefe**: em `bestiary.js` ou `fauna.js`, `ENEMIES` + `E_AI` + `ENEMY_IMG` (e `ENEMY_YOFF` se o desenho precisar de ajuste). Chefe: `boss: true` e um item em `BOSS_INFO` (nome, dica, música, ponto fraco). Projéteis novos: `eshoot()` com `home`/`harmless`+`then`/`pass`/`big` e o desenho em `EPROJ_DRAW`. Lacaios: `spawnEnemy()`; algo ao morrer: `ON_KILL`. Inimigo recolorido em um mundo: `ENEMY_SKIN[tema][tipo]`. Na IA, o alvo é `e.tgt` (jogador vivo mais próximo).
- **Multiplayer**: na lógica do jogo use `sfx()`, `burst()`, `floatText()`, `addFx()` e `announce()` (eles repassam o efeito aos convidados). Campo novo que precisa aparecer na tela dos outros → listas `PF`/`EF`/`QF`/`RF`/`WF` em `net.js`. Ao mudar o protocolo, aumente `PROTO`.
- **Nova classe**: `CLASSES`, `COST`, `CDMAX` + `skillA/B/C` (`game.js`), poses em `skeletonFor` e arma em `drawChar` (`sprites.js`), `POSE_LIST` (`ui.js`).
