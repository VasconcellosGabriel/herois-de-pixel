# Pacote de prompts — Cutscenes em HQ

> Roteiro: `HISTORIA.md` · Falas e ordem dos quadros: `js/historia.js`
> Os prompts estão em **inglês**, porque essas IAs entendem melhor assim. As explicações estão em português.
> **Nenhuma imagem deve ter texto ou balões.** O jogo escreve as falas por cima.

---

## 1. Como usar (ordem recomendada)

O herói muda conforme a escolha do jogador (classe e gênero). Por isso as cutscenes são **montadas em camadas**, como nas visual novels:

1. **Fundo do quadro:** o cenário, sem heróis. Pode ter chefes, objetos e figurantes.
2. **Heróis:** imagens recortadas de cada herói em poses padrão, colocadas pelo jogo em cima do fundo.

Os quadros sem nenhum herói (chefes, lembranças, Sir Bertrand...) são **ilustrações completas**.

**Passo a passo:**
1. Cole o **Bloco de estilo** (seção 2) no começo de todos os pedidos.
2. Gere a **ficha de cada personagem** (seção 3) e guarde a melhor versão.
3. Gere as **poses dos heróis** (seção 4), sempre enviando a ficha do personagem como **imagem de referência**.
4. Gere os **quadros** (seção 5), na ordem da história.
5. Salve com os nomes de arquivo indicados. Depois eu ajusto o jogo para usar essas imagens (`js/hq.js`).

**Tamanhos dos quadros:**

| Tipo | Proporção real | Peça na IA | Depois |
|---|---|---|---|
| **Faixa** (quadro largo) | 3,7 : 1 | `21:9` (ou `--ar 15:4` no Midjourney) | o jogo recorta em cima e embaixo |
| **Meio** (metade da página) | 1,83 : 1 | `16:9` | quase não corta |
| **Página** (quadro único) | 1,8 : 1 | `16:9` | quase não corta |

Nos fundos, peça a ação **no meio da altura** e deixe **espaço livre no terço de cima**, onde ficam recordatórios e balões.

**Nomes dos arquivos:**
- Quadros: `arte/hq/<id>.png` (ex.: `arte/hq/prologo-1-2.png`)
- Heróis: `arte/herois/<herói>_<pose>.png` (ex.: `arte/herois/rubi_ataque.png`)

**Atenção:** a Steam exige declarar o uso de IA na página do jogo. Confira também se o plano da ferramenta permite uso comercial.

---

## 2. Bloco de estilo (cole em TODO pedido)

**Estilo principal: pixel art HD, coerente com o jogo**
```
High-resolution pixel art illustration, HD-2D / modern 32-bit indie game cutscene style, crisp clean pixels, limited rich palette, dark clean outlines, soft volumetric lighting, dramatic comic book panel composition, fantasy RPG, expressive anime-inspired faces, no text, no letters, no speech bubbles, no watermark, no UI.
```

**Estilo alternativo: ilustração de HQ (se preferir sem pixel)**
```
Cel-shaded fantasy comic book illustration, bold ink lines, flat colors with dramatic shading, halftone texture, dynamic composition, expressive faces, no text, no letters, no speech bubbles, no watermark.
```

**Para evitar problemas** (campo "negative" ou no fim do prompt):
```
Avoid: text, letters, logos, speech balloons, extra fingers, deformed hands, blurry, photorealistic, 3D render, inconsistent character design.
```

---

## 3. Fichas de personagem

Gere cada ficha com este início e escolha a melhor versão. Ela vai como referência em todos os pedidos daquele personagem.
```
Character reference sheet of [DESCRIÇÃO], full body, front view, three-quarter view, side view and back view, neutral standing pose, plain light gray background, same character in all views.
```

### Heróis (os 8 heróis prontos do jogo)

| Arquivo | Personagem | Descrição (cole no lugar de [DESCRIÇÃO]) |
|---|---|---|
| `sir-aco` | Guerreiro | a young male knight squire, fair skin, messy spiky bright red-orange hair, brown eyes, silver plate armor with crimson trim and gold accents, red neckerchief, long crimson cape, heater shield with a red sword emblem, a steel longsword with a crimson hilt and ruby pommel (his father's sword) |
| `rubi` | Guerreira | a young female knight squire, fair skin, long bright red-orange hair in a high ponytail, brown eyes, silver plate armor with crimson trim and gold accents, red neckerchief, long crimson cape, heater shield with a red sword emblem, a steel longsword with a crimson hilt and ruby pommel (her father's sword) |
| `orion` | Mago | a young male mage apprentice, pale skin, violet eyes, shoulder-length silver-lavender hair, deep purple robe with lavender trim, tall purple wizard hat with a gold band and a small gold star, long red-orange cape, golden staff topped with a glowing purple orb, a brass compass with a glowing cyan crystal needle hanging on a chain at the belt |
| `aurora` | Maga | a young female mage apprentice, pale skin, violet eyes, very long straight silver-lavender hair, deep purple robe with lavender trim, tall purple wizard hat with a gold band and a small gold star, golden staff topped with a glowing purple orb, a brass compass with a glowing cyan crystal needle hanging on a chain at the belt |
| `robin` | Arqueiro | a young male forest ranger, fair skin, short brown hair, green eyes, green hooded cloak, green tunic with brown leather belt and boots, longbow of pale ancient wood carved with leaf patterns, leather quiver with a brown hawk feather tied to it |
| `flora` | Arqueira | a young female forest ranger, fair skin, long brown hair in a side braid, green eyes, green hooded cloak, green tunic with brown leather belt and boots, longbow of pale ancient wood carved with leaf patterns, leather quiver with a brown hawk feather tied to it |
| `ignis` | Dragônico | a young male half-dragon warrior, warm tan skin, glowing amber eyes with slit pupils, spiky crimson hair, two curved ivory horns, large crimson bat-like dragon wings, dark charcoal armor with crimson accents, clawed hands, a glowing red dragon scale pendant on the neck |
| `brasa` | Dragônica | a young female half-dragon warrior, warm tan skin, glowing amber eyes with slit pupils, long wild crimson hair, two curved ivory horns, large crimson bat-like dragon wings, dark charcoal armor with crimson accents, clawed hands, a glowing red dragon scale pendant on the neck |

> O Guerreiro e o Dragônico são **irmãos de sangue**. Vale pedir "similar face shape and nose" nas fichas dos dois.

### Personagens fixos

| Arquivo | Personagem | Descrição |
|---|---|---|
| `bertrand` | Sir Bertrand (pai) | a tall broad middle-aged knight, short gray hair and full gray beard, kind tired eyes, scar on the cheek, silver plate armor with crimson trim, long crimson cape, the same crimson-hilted longsword with ruby pommel |
| `mae-dragoa` | Dragão de Magma, saudável (lembranças) | a huge wise female dragon, deep red and gold scales, golden belly plates, kind golden eyes, curved ivory horns, large red wings, gentle expression |
| `mae-dragoa-corrompida` | Dragão de Magma, corrompida | the same dragon corrupted: blackened red scales with glowing lava cracks, chest glowing like a hot ember, vampire bite marks on the neck, broken iron shackles and heavy chains, feverish red eyes, suffering expression |
| `conde` | Conde Sanguinário (Corvalis) | a tall gaunt vampire lord, chalk-white skin, slicked-back black hair with silver temples, glowing red eyes, high-collared black cape with crimson lining, remnants of archmage robes with purple and gold trims, long thin fingers, elegant and sad |
| `tita` | Titã da Tempestade | a colossal titan made of stone and storm clouds, crown of jagged lightning spikes, glowing cyan core in the chest, lightning crackling around the arms |
| `golem` | Rei Golem | a giant ancient stone golem covered in moss and cyan crystals, glowing orange core in the chest, crown-like stone crest |
| `yeti` | Yeti Ancião | a huge ancient yeti with long white fur, blue face, curled horns, wise old eyes, holding a spear of bone and ice |
| `gosma` | Rei Gosma | a giant green slime king with a small golden crown, translucent body with bubbles of purple toxic waste inside |
| `escorpiao` | Escorpião Imperador | a giant purple scorpion with golden pharaoh-style armor plates and a golden crown |
| `vento` | Vento (falcão do Arqueiro) | a brown and cream hawk with sharp yellow eyes |
| `cavaleiro-morto` | Cavaleiros mortos-vivos | knights in silver armor with a red sword emblem on the shield, glowing red eyes inside the visor, ghostly mist around them |

---

## 4. Poses dos heróis (camadas recortáveis)

Faça **as mesmas poses para os 8 heróis**, sempre com a ficha como referência. Todas **viradas para a direita**, em 3/4, **corpo inteiro**, no mesmo tamanho. O jogo espelha a imagem quando precisa.

Início de cada pedido:
```
[DESCRIÇÃO DO HERÓI], full body, three-quarter view facing right, [POSE], isolated on a plain flat solid green background (#00FF00) for easy cutout, consistent with the reference sheet.
```
> O fundo verde facilita o recorte (ou use remove.bg). O ChatGPT também aceita pedir "transparent background".

| Arquivo (`<herói>_...`) | Pose | Texto para [POSE] |
|---|---|---|
| `em-pe` | Parado | standing calmly, relaxed confident posture |
| `correndo` | Correndo | running forward, dynamic stride |
| `ataque` | Ataque | Guerreiro: *mid sword slash* · Mago: *pointing staff forward* · Arqueiro: *drawing the bow* · Dragônico: *claw swipe* |
| `poder` | Poder | Guerreiro: *sword raised glowing* · Mago: *casting a purple spell* · Arqueiro: *aiming upward with a glowing arrow* · Dragônico: *breathing fire forward* |
| `defesa` | Defesa / susto | Guerreiro: *raising the shield* · outros: *startled, stepping back with a defensive arm* |
| `ferido` | Ferido / choque | staggering, hurt, shocked expression |
| `ajoelhado` | Ajoelhado | kneeling on one knee, head lowered, grieving |
| `mirando` | Só o Arqueiro | aiming the bow, focused |
| `planando` | Só o Dragônico | gliding in the air with wings spread wide |
| `rosto-neutro` | Close | close-up portrait from the chest up, calm expression |
| `rosto-determinado` | Close | close-up portrait from the chest up, determined expression |
| `rosto-triste` | Close | close-up portrait from the chest up, sad teary eyes |
| `rosto-chocado` | Close | close-up portrait from the chest up, shocked wide eyes |
| `rosto-raiva` | Close | close-up portrait from the chest up, angry shouting |

---

## 5. Os quadros

**Legenda:**
- **Tipo:** `fundo` = cenário + heróis por cima · `completa` = ilustração inteira, sem heróis
- **Heróis:** quem o jogo coloca por cima e com qual pose. G = Guerreiro, M = Mago, A = Arqueiro, D = Dragônico. "esq./centro/dir." é a posição.
- **Proporção:** Faixa = `21:9` · Meio e Página = `16:9`

### Prólogo — A Noite do Primeiro Trovão

| ID | Tipo · Prop. | Prompt (depois do bloco de estilo) | Heróis |
|---|---|---|---|
| `prologo-1-1` | completa · Faixa | Night in a dark whispering forest road. A wooden wagon carries a giant glowing cyan crystal (the Crystal Heart), escorted by two knights in silver armor with red sword shields. Moonlight, fireflies, tense mood. | — |
| `prologo-1-2` | fundo · Meio | Night, ruins of a burned village at the edge of a forest. A small old gravestone with fresh red and orange flowers on the right side. Empty space on the left for a character. Soft moonlight, melancholic. | G `em-pe` (esq.) |
| `prologo-1-3` | fundo · Meio | Dark purple magical background with halftone dots and floating arcane runes. A brass compass with a glowing cyan crystal needle floating at the lower right. | M `rosto-neutro` (esq.) |
| `prologo-2-1` | fundo · Meio | Night forest, ropes and logs prepared in the trees as an ambush over the road. A brown hawk perched on a branch in the middle. | A `mirando` (esq.) |
| `prologo-2-2` | fundo · Meio | Dark red dramatic background with halftone dots, embers floating, a distant view of a red sword glinting far below in a forest clearing. | D `rosto-raiva` (esq.) |
| `prologo-2-3` | fundo · Faixa | Midnight forest clearing in chaos: snapped ropes, logs falling across the road, the crystal wagon stopped, dramatic speed lines toward the center. | G `defesa` (esq.) · D `planando` (centro, alto) · M `poder` · A `mirando` (dir.) |
| `prologo-3-1` | completa · Faixa | Wide night sky over a forest: far away, a floating citadel on clouds is struck by an enormous lightning storm, a giant bolt hitting it, the whole sky flashing. | — |
| `prologo-3-2` | fundo · Meio | Night forest under red light: two knights in silver armor rising as undead, glowing red eyes in their visors, ghostly red mist. They face right. | G `ferido` (dir., espelhado) |
| `prologo-3-3` | fundo · Meio | Night forest: a brown hawk flying away up into a storm with glowing eyes; on the right, the giant cyan crystal cracking and glowing. Deep inside a cave in the distance, two huge orange eyes opening. | A `em-pe` (esq.) |
| `prologo-4-1` | fundo · Faixa | Night forest battle with halftone and speed lines: a snarling gray wolf on the far left and an undead knight with red glowing eyes on the far right, both attacking toward the center. | M `poder` (espelhado), G `ataque` (espelhado), D `ataque`, A `mirando`, em fila de costas um para o outro |
| `prologo-4-2` | fundo · Faixa | Dawn in the forest, golden-orange sunrise light, a quiet clearing after the battle, broken logs. A brass compass with a cyan crystal needle glowing, floating in the center. | G, D (esq.) · M (centro) · A (dir., espelhado), todos `em-pe` |
| `prologo-5-1` | fundo · Faixa | Dawn in the ruins of the burned village, the small gravestone with flowers in the exact center, warm light. | G `em-pe` (esq.) · D `em-pe` (dir., espelhado) |
| `prologo-5-2` | completa · Meio | Close-up of a small weathered gravestone with no name carved, fresh red and orange flowers at its base, gray halftone background. | — |
| `prologo-5-3` | fundo · Faixa | Bright morning, a forest road leading toward distant mountains, hopeful mood, birds in the sky. | A, M, G `correndo` · D `planando` |

### Mundo 1 — Fim

| ID | Tipo · Prop. | Prompt | Heróis |
|---|---|---|---|
| `golem_fim-1-1` | completa · Faixa | A giant stone golem covered in moss and crystals collapsing in a ruined stone lair, the glowing orange core in its chest fading out, dust and debris, dramatic speed lines. | — |
| `golem_fim-1-2` | completa · Meio | A floating citadel on clouds under a perfectly clear blue sky, with a single strange lightning bolt striking it. Eerie mood. | — |
| `golem_fim-1-3` | fundo · Meio | Inside the ruined golem lair after the battle, the fallen golem's stone hand in the foreground, dust in warm light. | A `ajoelhado` (esq.) · M `em-pe` (dir., espelhado) |

### Mundo 2 — Picos Gelados

| ID | Tipo · Prop. | Prompt | Heróis |
|---|---|---|---|
| `mundo2-1-1` | fundo · Faixa | Majestic snowy mountain path, falling snow, frozen pine trees, icy blue light. | os quatro `correndo` |
| `mundo2-1-2` | fundo · Meio | Snowy mountainside, a brass compass with a glowing cyan crystal needle floating in the center, pointing up toward a distant icy throne at the summit. | M `em-pe` (esq.) |
| `mundo2-1-3` | fundo · Meio | Frozen lake, a white snow wolf with glowing blue eyes snarling on the right. | A `mirando` (esq.) |
| `yeti_fim-1-1` | completa · Faixa | Inside an ice cave throne room, a huge ancient white yeti kneeling, its bone-and-ice spear stuck in the ground, its eyes clear and wise for a moment, sad expression. | — |
| `yeti_fim-1-2` | fundo · Meio | Dark blue icy background with halftone dots, a faint lightning flash in the far distance. | M `rosto-chocado` (esq.) |
| `yeti_fim-1-3` | fundo · Meio | Night camp in the snow, a warm campfire in the exact center, starry sky. | D `poder` (esq., soprando fogo na fogueira) · G `em-pe` (dir., espelhado) |

### Mundo 3 — Pântano Gosmento

| ID | Tipo · Prop. | Prompt | Heróis |
|---|---|---|---|
| `mundo3-1-1` | fundo · Faixa | Murky green swamp, twisted trees, glowing toxic purple puddles, old barrels with alchemical symbols dumped in the mud. | os quatro `correndo` |
| `mundo3-1-2` | fundo · Meio | Swamp edge with a broken barrel leaking purple potion into the water. | D `em-pe` (esq.) · A `em-pe` (dir., espelhado) |
| `mundo3-1-3` | fundo · Meio | Dark murky green background with halftone dots and floating toxic bubbles. | M `rosto-triste` (esq.) |
| `gosma_fim-1-1` | completa · Faixa | A giant green slime king with a golden crown melting and collapsing in a swamp, purple toxic waste bubbling out of its body, sad and tragic. | — |
| `gosma_fim-1-2` | fundo · Meio | Swamp water being purified: green healing light spreading over the dark water, clean ripples. | M `poder` (centro-esq.) |
| `gosma_fim-1-3` | fundo · Meio | Calm swamp at sunset, clean water reflecting warm light. | M `em-pe` (esq.) · A `em-pe` (dir., espelhado) |

### Mundo 4 — Deserto Escaldante

| ID | Tipo · Prop. | Prompt | Heróis |
|---|---|---|---|
| `mundo4-1-1` | fundo · Faixa | Cracked savanna turning into desert, acacia trees, distant pyramids, blazing sun, heat haze. | os quatro `correndo` |
| `mundo4-1-2` | fundo · Meio | Entrance of ancient pharaoh ruins, giant stone columns with hieroglyphs, sand. | G `em-pe` (esq.) · M `em-pe` (dir., espelhado) |
| `mundo4-1-3` | completa · Meio | Two mummies guarding a dark tomb corridor, glowing green eyes, golden light from torches. | — |
| `escorpiao_fim-1-1` | completa · Meio | Ancient tomb wall carving in sepia tones: four ancient heroes (a sword wielder, a staff wielder, an archer and a winged figure with a flame) sealing a giant storm titan in the sky. Egyptian relief style. | — |
| `escorpiao_fim-1-2` | completa · Meio | A giant purple scorpion with golden pharaoh armor and crown collapsed on the sand, a lightning bolt striking close behind the pyramids. | — |
| `escorpiao_fim-1-3` | fundo · Faixa | Desert at sunset with pyramids, a brass compass with a cyan crystal needle floating in the center pointing toward a distant volcano on the horizon. | M `em-pe` (esq.) · D `em-pe` (dir., espelhado) |

### Mundo 5 — Montanha de Fogo (a revelação)

| ID | Tipo · Prop. | Prompt | Heróis |
|---|---|---|---|
| `mundo5-1-1` | fundo · Faixa | Ash-covered mountain trail, dead trees, falling embers, a volcano glowing red in the background. | os quatro `correndo` |
| `mundo5-1-2` | fundo · Meio | Ruins of a dragon's nest in the volcano, a giant empty nest of burned branches and broken eggshells, embers. | D `em-pe` (esq.) · G `em-pe` (dir., espelhado) |
| `mundo5-1-3` | completa · Meio | A demon forge inside a volcano: a hulking demon blacksmith hammering giant iron chains on an anvil, small imps flying with sparks. | — |
| `dragao_fim-1-1` | completa · Faixa | Inside a volcano crater, a huge corrupted dragon (blackened red scales with lava cracks, glowing ember chest, vampire bite marks) bound by heavy iron chains from the walls, red light. | — |
| `dragao_fim-1-2` | completa · Meio | Close-up of the corrupted dragon's face, one eye clearing up with a tear, a moment of lucidity, pleading, dark red halftone background. | — |
| `dragao_fim-1-3` | fundo · Meio | Dark red background with halftone dots and floating embers. | D `rosto-triste` (esq.) |
| `dragao_fim-2-1` | completa · Faixa | Sepia flashback: a medieval village burning at night, houses in flames, smoke. Old memory style. | — |
| `dragao_fim-2-2` | completa · Meio | Sepia flashback: a kind red-gold dragon gently breathing a warm golden flame into a small bundle with a human baby among ashes. Tender, magical. | — |
| `dragao_fim-2-3` | completa · Meio | Sepia flashback: Sir Bertrand (tall knight, gray beard, crimson-hilted sword) lowering his sword in front of the red-gold dragon, who shields a baby bundle with her wing. | — |
| `dragao_fim-3-1` | completa · Meio | Close-up of the dying dragon's face, eyes closing peacefully, soft smile, chains broken, embers fading. | — |
| `dragao_fim-3-2` | fundo · Meio | Dark purple background with halftone and shock speed lines. | G `rosto-chocado` (esq.) |
| `dragao_fim-3-3` | fundo · Faixa | Volcano crater in red light, the dragon's body resting peacefully in the background, broken chains. | G `em-pe` (esq.) · D `em-pe` (dir., espelhado) |
| `dragao_fim-4-1` | fundo · Faixa | Volcano crater turned blue: a vortex of brilliant BLUE fire rising from the ground at the center, blue embers, speed lines. | D `poder` (centro, com fogo azul) |
| `dragao_fim-4-2` | fundo · Faixa | Dark purple background with halftone dots, quiet and serious mood. | M `rosto-triste` (esq.) · A, G `em-pe` (dir.) |

### Mundo 6 — Castelo do Vampiro

| ID | Tipo · Prop. | Prompt | Heróis |
|---|---|---|---|
| `mundo6-1-1` | fundo · Faixa | Gothic graveyard at night, full moon, crooked tombstones, a dark castle on a hill in the background, bats. | os quatro `correndo` |
| `mundo6-1-2` | fundo · Meio | Graveyard at night, an open empty grave with a knight's tombstone engraved with a sword in the center, dirt scattered. | G `em-pe` (esq.) · D `em-pe` (dir., espelhado) |
| `mundo6-1-3` | completa · Meio | The vampire lord half-hidden in shadows of a dark corridor, only his red eyes and white face visible, crimson mist. | — |
| `conde_fim-1-1` | completa · Faixa | Inside a gothic vampire castle hall, the defeated vampire lord kneeling but laughing, cape spread, red light, broken stained glass. | — |
| `conde_fim-1-2` | completa · Meio | Close-up of the vampire lord's face, cruel smile, red eyes, dark halftone background. | — |
| `conde_fim-1-3` | fundo · Meio | Dark purple background with halftone and dramatic speed lines. | M `rosto-raiva` (esq.) |
| `conde_fim-2-1` | completa · Faixa | The vampire lord standing alone in the castle hall, looking aside with a sad, almost fatherly expression, moonlight from tall windows. (The mage is added on the right.) | M `em-pe` (dir., espelhado) |
| `conde_fim-2-2` | completa · Meio | The sky cracking open above a floating citadel, a colossal storm titan with a lightning crown awakening, giant lightning bolts. | — |
| `conde_fim-2-3` | completa · Meio | The vampire lord being pulled up into a swirling storm vortex, cape torn, reaching down desperately. | — |
| `conde_fim-3-1` | fundo · Página | Stormy mountain peak at night, rain, a floating citadel on clouds struck by lightning on the right side. Epic, determined mood. | os quatro `em-pe` (esq./centro), olhando para a Cidadela |

### Mundo 7 — Cidadela Celeste e Final

| ID | Tipo · Prop. | Prompt | Heróis |
|---|---|---|---|
| `mundo7-1-1` | fundo · Faixa | High mountain peak at dawn above the clouds, a floating citadel far away in the sky. | os quatro `correndo` |
| `mundo7-1-2` | completa · Meio | Hanging gardens floating in the sky, a flock of glowing golden hawks circling, one brown hawk among them. | — |
| `mundo7-1-3` | fundo · Meio | Floating sky gardens with marble bridges, bright clouds. | M (esq.), G (centro), D (dir., espelhado), todos `em-pe` |
| `final-1-1` | fundo · Meio | Abstract silver-white energy background, storm clouds being sliced, dramatic speed lines. | G `poder` (grande) |
| `final-1-2` | fundo · Meio | Abstract purple arcane energy background, chains of lightning being bound, speed lines. | M `poder` (grande) |
| `final-1-3` | fundo · Meio | Abstract green energy background, a glowing arrow trail, speed lines. | A `mirando` (grande) |
| `final-1-4` | fundo · Meio | Abstract deep blue background full of brilliant BLUE fire, speed lines. | D `poder` com fogo azul (grande) |
| `final-2-1` | completa · Faixa | The colossal storm titan falling asleep, turning back into stone and clouds, its cyan core dimming, a huge burst of light. | — |
| `final-2-2` | fundo · Meio | Sunrise over the floating citadel, warm golden light breaking through clouds. | G, D, M, A `em-pe` |
| `final-2-3` | fundo · Meio | Mountain peak at sunrise, a brown hawk (no longer golden) gliding down toward the left. | A `em-pe` (esq.) |
| `final-3-1` | fundo · Meio | Restored knight order courtyard at dawn, a statue of an older bearded knight lowering his sword. | G `em-pe` |
| `final-3-2` | fundo · Meio | Calm volcano crater at dawn, a peaceful dragon grave marked with a large crystal, blue flowers growing. | D `em-pe` |
| `final-3-3` | fundo · Meio | The sky citadel turned into a hospital, healers, warm light, a scroll burning in a brazier. | M `em-pe` |
| `final-3-4` | fundo · Meio | Forest being replanted, young trees, sunlight, a brown hawk perched on a branch. | A `em-pe` |
| `final-4-1` | fundo · Página | Epic final splash: mountain peak at sunrise above a sea of clouds, the floating citadel shining in the background. | os quatro `em-pe`, juntos no centro |

---

## 6. Dicas para manter tudo coerente

- **Sempre envie a ficha** do personagem junto com o pedido. No Gemini e no ChatGPT, anexe a imagem e escreva "use this character exactly as in the reference".
- **Use a mesma conversa** para uma cena inteira. As IAs mantêm melhor o estilo assim.
- **Fundos com espaço:** se a IA colocar algo bem onde o herói vai ficar, peça "leave the left/right third empty, only ground there".
- **Luz igual entre fundo e herói:** nas cenas noturnas, peça as poses com "night lighting, cool blue rim light". O jogo também escurece o herói por cima.
- **Revisão:** gere 2 a 4 variações e escolha. Mudanças pequenas se pedem na mesma conversa ("same image, but the dragon's eye shedding a tear").
