import type { GuideCopy, GuideSlug } from "./guides";

/**
 * Guide in portoghese del Brasile (20/10/2026, portoghese quinta lingua del sito): solo i testi, come lo spagnolo e il
 * francese. Categoria, carte, lista del mazzo, copertina, data e tempo di lettura vengono dalla versione inglese in
 * guides.ts (`getGuides`). Una guida nuova si scrive nelle cinque lingue: inglese e italiano in guides.ts, spagnolo in
 * guides-es.ts, francese in guides-fr.ts, portoghese qui (il tipo lo pretende). Stesse regole delle altre lingue: link
 * interni con /pt/, ancore {#…} in portoghese senza accenti, nomi delle carte in inglese, "você" al lettore, parole
 * chiave con i nomi del gioco letti il 20/10/2026 (docs/portoghese.md).
 */
export const ptText: Record<GuideSlug, GuideCopy> = {
  "origins-tcg-legendaries": {
    title: "As 11 Lendárias de Origins TCG: cartas, estatísticas, patches e decks",
    metaTitle: "Lendárias de Origins TCG: as 11 e seus decks",
    excerpt: "As 11 cartas Lendárias da Demo 2.0 de Origins TCG: custo, estatísticas, texto oficial, cartas criadas, mudanças de patch e os decks que as usam.",
    faq: [
      {
        q: "Quantas Lendárias existem em Origins TCG?",
        a: "Onze na Demo 2.0, em 25 de setembro de 2026: Dorothy, Dracula, Mulan, Queen of Hearts, Van Helsing, Wicked Stepmother, Merlin, King Arthur, Legion of the Dead, Three Not So Little Pigs e Robin Hood. O banco de dados do OriginsMeta guarda mais nove que não estão na demo.",
      },
      {
        q: "Quantas Lendárias um deck pode ter?",
        a: "Uma. Um deck é uma Lendária mais doze cartas base jogadas em duas cópias cada, 25 cartas no total. No Conquest você leva mais de um deck: no Big Bob's Playtest Battle cada um precisava de uma Lendária diferente; os anúncios da Crimson Cup não dizem nada, e o nosso deck builder sinaliza dois decks com a mesma.",
      },
      {
        q: "Qual Lendária está em mais decks?",
        a: "Em 25 de setembro de 2026, Three Not So Little Pigs, que lidera 4 dos 20 decks publicados no OriginsMeta; Van Helsing lidera 3 e Wicked Stepmother nenhum. Isso mede a popularidade no site, não a força, e a contagem atualizada está na página As mais jogadas da tier list.",
      },
      {
        q: "Existe uma Lendária que seja um feitiço?",
        a: "Sim, uma na Demo 2.0: Legion of the Dead, um feitiço de 7 de mana que enche o seu tabuleiro de Zombies 2/2.",
      },
    ],
    body: `
## Em resumo {#em-resumo}

- **Onze Lendárias** estão na Demo 2.0, a versão de Origins TCG que você pode jogar hoje: seis custam 4 de mana, uma custa 5, três custam 7 e uma custa 8.
- Dez são personagens e uma é um feitiço, Legion of the Dead. Cinco são Good, três Evil e três Neutral.
- Quatro delas criam outras cartas com o seu texto: Dracula, Van Helsing, Legion of the Dead e Three Not So Little Pigs.
- Sete mudaram nos patches de balanceamento entre agosto e 21 de setembro de 2026; Dracula, Van Helsing, Legion of the Dead e Robin Hood não. O [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026 não rebalanceou nenhuma das onze.
- Os 20 decks publicados no OriginsMeta até as 20:00 CEST de 25 de setembro de 2026 usam dez das onze: Three Not So Little Pigs lidera quatro, Van Helsing três, Wicked Stepmother nenhum. Seis Lendárias têm um guia do OriginsMeta dedicado a um dos seus decks.

As Lendárias abaixo estão em ordem de custo e, com o mesmo custo, em ordem alfabética. O guia descreve o que cada carta faz, não o quanto ela é forte: a nossa [tier list de Origins TCG](/pt/tier-list) vai classificá-las pelos resultados dos torneios e pelo topo da [ranqueada](/pt/guides/origins-tcg-ranked), a partir do fim da Crimson Cup.

## As 11 Lendárias em uma tabela {#visao-geral}

| Lendária | Custo | Poder/Vida | Alinhamento | Decks |
| --- | --- | --- | --- | --- |
| [Dorothy](/pt/cards/dorothy) | 4 | 1/1 | Good | 2 |
| [Dracula](/pt/cards/dracula) | 4 | 3/2 | Evil | 2 |
| [Mulan](/pt/cards/mulan) | 4 | 2/4 | Good | 1 |
| [Queen of Hearts](/pt/cards/queen-of-hearts) | 4 | 3/3 | Evil | 2 |
| [Van Helsing](/pt/cards/van-helsing) | 4 | 3/4 | Good | 3 |
| [Wicked Stepmother](/pt/cards/wicked-stepmother) | 4 | 4/6 | Evil | 0 |
| [Merlin](/pt/cards/merlin) | 5 | 5/5 | Neutral | 1 |
| [King Arthur](/pt/cards/king-arthur) | 7 | 7/7 | Good | 2 |
| [Legion of the Dead](/pt/cards/legion-of-the-dead) | 7 | feitiço | Neutral | 2 |
| [Three Not So Little Pigs](/pt/cards/three-not-so-little-pigs) | 7 | 3/3 | Neutral | 4 |
| [Robin Hood](/pt/cards/robin-hood) | 8 | 4/4 | Good | 1 |

A última coluna conta os decks que cada Lendária lidera entre os 20 publicados no OriginsMeta de 15 de setembro até as 20:00 CEST de 25 de setembro de 2026. Ela mede a popularidade no site, não a força nem o win rate; a contagem atualizada está em [As mais jogadas](/pt/tier-list/most-played).

## O que a Lendária faz em um deck {#no-deck}

- **Uma por deck.** Um deck é uma Lendária mais doze cartas base, e o jogo adiciona uma segunda cópia de cada carta base: 25 cartas em jogo, segundo o AMA da equipe da Koin Games. O [deck builder](/pt/deck-builder) verifica a regra.
- **O seu oponente a vê.** O patch 0.6.1 do playtest fechado (14 de agosto de 2026) adicionou uma prévia da Lendária do oponente durante o mulligan, segundo as [notas do patch oficiais](https://store.steampowered.com/news/app/4429430/view/1840944183780414).
- **No Conquest, ela dá nome ao deck.** Na Crimson Cup cada jogador leva três decks, e quando você bane um dos decks do oponente só vê a Lendária dele ([regras da Crimson Cup](/pt/news/crimson-cup-format-check-in)). Os anúncios não dizem se as três Lendárias precisam ser diferentes; no Big Bob's Playtest Battle precisavam. Como montar os três decks: o nosso [guia do Conquest](/pt/guides/origins-tcg-conquest).

Os textos das cartas citados abaixo são os oficiais do jogo, lidos no jogo em português em 20 de outubro de 2026; custos e estatísticas foram verificados carta por carta em 22 de setembro de 2026. As sagas e as notas sobre cada lenda são do OriginsMeta. Os patches são os acompanhados no [MetaShifting](/pt/metashifting): as atualizações 0.6.1, 0.6.2 e 0.6.3 do playtest (agosto de 2026), o patch da demo de 21 de setembro de 2026 e o patch 0.7 de 29 de setembro de 2026, que não rebalanceou nenhuma Lendária. O poder lendário não é tratado aqui: ainda não o transcrevemos do jogo, e a página de cada carta vai mostrá-lo quando fizermos isso.

## Dorothy {#dorothy}

**4 mana · 1/1 · personagem · Good** · Saga: Terra de Oz

> Posso me Mover a cada rodada.
>
> Tenho +1⚔️/+1❤️ por cada vez que um aliado se moveu nesta partida.

- **A lenda.** A menina do Kansas levada a Oz por um tornado no romance de L. Frank Baum de 1900.
- **Patches.** Patch da demo de 21 de setembro de 2026: mana 5 → 4 ([notas do patch](/pt/news/demo-patch-notes-0921)).
- **Decks no OriginsMeta em 25 de setembro de 2026.** Dois: [Dorothy Combo](/pt/decks/community/dorothy-combo-7503) e [Move/Combo](/pt/decks/community/move-combo-075a).
- **Guia.** [Guia do deck de Dorothy: Dorothy Combo](/pt/guides/dorothy-combo-guide).
- **Página da carta.** [Dorothy, carta Lendária: estatísticas e texto](/pt/cards/dorothy).

## Dracula {#dracula}

**4 mana · 3/2 · personagem · Evil** · Saga: Horror gótico

> Quando você descarta, volto do seu cemitério para a mão.
>
> Ao revelar: Invoca Brides of Dracula [2⚔️/2❤️] em um espaço aleatório aqui.

- **A lenda.** O conde da Transilvânia do romance de Bram Stoker de 1897.
- **Cartas que cria.** [Brides of Dracula](/pt/cards/brides-of-dracula), uma 2/2 que, segundo o seu texto, causa 1 de dano à barreira do oponente no seu local e recebe +1❤️ sempre que você descarta uma carta (carta criada: o texto não foi verificado no jogo).
- **Patches.** Dracula não mudou. Brides of Dracula passou de 3 para 2 de mana no patch 0.6.2 ([notas do patch](/pt/news/patch-0-6-2)).
- **Decks no OriginsMeta em 25 de setembro de 2026.** Dois: [Discard](/pt/decks/community/discard-8bff) e [Dracula SUPER FUN](/pt/decks/community/dracula-super-fun-d936).
- **Guia.** Ainda nenhum: [mande o seu](/pt/guides/submit).
- **Página da carta.** [Dracula, carta Lendária: estatísticas e texto](/pt/cards/dracula).

## Mulan {#mulan}

**4 mana · 2/4 · personagem · Good** · Saga: Balada de Mulan

> Ataque duplo
>
> Quando uma habilidade Ao revelar de um aliado acontece, repete-a.

- **A lenda.** A guerreira que toma o lugar do pai no exército, de uma balada chinesa do século VI.
- **Patches.** Patch 0.6.2: estatísticas iguais, ela ganha Ataque duplo além de repetir as habilidades Ao revelar dos aliados ([notas do patch](/pt/news/patch-0-6-2)).
- **Decks no OriginsMeta em 25 de setembro de 2026.** Um: [On Reveal Mid Range](/pt/decks/community/on-reveal-mid-range-772e).
- **Guia.** [Guia do deck de Mulan: On Reveal Mid Range](/pt/guides/on-reveal-midrange-guide).
- **Página da carta.** [Mulan, carta Lendária: estatísticas e texto](/pt/cards/mulan).

## Queen of Hearts {#queen-of-hearts}

**4 mana · 3/3 · personagem · Evil** · Saga: País das Maravilhas

> Primeiro golpe
>
> Quando uma habilidade Ao morrer de um aliado acontece, repete-a.

- **A lenda.** A furiosa soberana do País das Maravilhas, cuja resposta para tudo é "Cortem-lhe a cabeça!".
- **Patches.** Patch 0.6.2: de 5 de mana e 3/5 para 4 de mana e 3/3, e ela ganha Primeiro golpe além de repetir as habilidades Ao morrer dos aliados ([notas do patch](/pt/news/patch-0-6-2)).
- **Decks no OriginsMeta em 25 de setembro de 2026.** Dois: [Qoh](/pt/decks/community/qoh-f876) e [Just f\\*\\*\\*in em](/pt/decks/community/just-f-in-em-bdf2).
- **Guia.** Ainda nenhum: [mande o seu](/pt/guides/submit).
- **Página da carta.** [Queen of Hearts, carta Lendária: estatísticas e texto](/pt/cards/queen-of-hearts).

## Van Helsing {#van-helsing}

**4 mana · 3/4 · personagem · Good** · Saga: Horror gótico

> Antes do combate, adiciona Van Helsing's Tools à sua mão se ainda lá não estiver.

- **A lenda.** Abraham Van Helsing, o professor holandês que comanda a caça a Dracula.
- **Cartas que cria.** [Van Helsing's Tools](/pt/cards/van-helsings-tools), que deixa você escolher e jogar uma de quatro cartas criadas: [Holy Water](/pt/cards/holy-water), [Silver Bullet](/pt/cards/silver-bullet), [Garlic](/pt/cards/garlic) ou [Wooden Stake](/pt/cards/wooden-stake) (cartas criadas: os textos não foram verificados no jogo, e a página da Silver Bullet ainda mostra o texto de antes do patch 0.6.2; as mudanças estão no histórico de balanceamento dela).
- **Patches.** O próprio Van Helsing não mudou. No patch 0.6.2 a Van Helsing's Tools ficou gratuita (1 → 0 de mana) e a Silver Bullet que ela cria passou de 3 de dano para 1 ([notas do patch](/pt/news/patch-0-6-2)); com o patch da demo de 21 de setembro de 2026 a Silver Bullet também pode mirar barreiras, e a Wooden Stake pode mirar personagens com a Vida cheia, embora continue falhando se o alvo não estiver ferido quando ela é revelada ([notas do patch](/pt/news/demo-patch-notes-0921)).
- **Decks no OriginsMeta em 25 de setembro de 2026.** Três: [Healing Healsing](/pt/decks/community/healing-healsing-9411), [Cure Control](/pt/decks/community/cure-control-b630) e [CONTROL](/pt/decks/community/control-2c2b).
- **Guias.** [Guia do deck de Van Helsing: Healing Healsing](/pt/guides/healing-healsing-guide) e [os seus matchups](/pt/guides/healing-healsing-matchups).
- **Página da carta.** [Van Helsing, carta Lendária: estatísticas e texto](/pt/cards/van-helsing).

## Wicked Stepmother {#wicked-stepmother}

**4 mana · 4/6 · personagem · Evil** · Saga: Contos de fadas

> Toque mortífero
>
> Ao revelar: Dá Toque mortífero aos seus personagens Malignos.

- **A lenda.** A madrasta cruel dos contos de fadas, da casa da Cinderela à corte da Branca de Neve.
- **Patches.** Patch da demo de 21 de setembro de 2026: Poder 3 → 4 ([notas do patch](/pt/news/demo-patch-notes-0921)).
- **Decks no OriginsMeta em 25 de setembro de 2026.** Nenhum dos 20 publicados até agora: monte um no [deck builder](/pt/deck-builder) e publique-o com um guia.
- **Guia.** Ainda nenhum: [mande o seu](/pt/guides/submit).
- **Página da carta.** [Wicked Stepmother, carta Lendária: estatísticas e texto](/pt/cards/wicked-stepmother).

## Merlin {#merlin}

**5 mana · 5/5 · personagem · Neutral** · Saga: Lenda arturiana

> Repete o primeiro feitiço que você jogar a cada rodada.

- **A lenda.** O mago por trás do nascimento de Arthur e da sua subida ao trono, de Geoffrey de Monmouth a Malory.
- **Patches.** Patch 0.6.3: de 3/5 para 5/5, +2 de Poder ([notas do patch](/pt/news/patch-0-6-3)).
- **Decks no OriginsMeta em 25 de setembro de 2026.** Um: [Spellcast](/pt/decks/community/spellcast-250f).
- **Guia.** Ainda nenhum: [mande o seu](/pt/guides/submit).
- **Página da carta.** [Merlin, carta Lendária: estatísticas e texto](/pt/cards/merlin).

## King Arthur {#king-arthur}

**7 mana · 7/7 · personagem · Good** · Saga: Lenda arturiana

> Escudo
>
> Ao revelar: Dá Escudo aos seus personagens Bons.

- **A lenda.** O rei de outrora e do futuro da Bretanha, que tirou a espada da pedra e reuniu a Távola Redonda.
- **Patches.** Patch 0.6.3: de 5/5 para 7/7 ([notas do patch](/pt/news/patch-0-6-3)).
- **Decks no OriginsMeta em 25 de setembro de 2026.** Dois: [King of Value Trade](/pt/decks/community/king-of-value-trade-fd14) e [Glinda Reborn](/pt/decks/community/glinda-reborn-2d6d).
- **Guia.** [Guia do deck de King Arthur: King of Value Trade](/pt/guides/king-of-value-trade-guide).
- **Página da carta.** [King Arthur, carta Lendária: estatísticas e texto](/pt/cards/king-arthur).

## Legion of the Dead {#legion-of-the-dead}

**7 mana · feitiço · Neutral** · Saga: Horror gótico

> Enche o seu tabuleiro de Zombies [2⚔️/2❤️].

- **O único feitiço Lendário** da Demo 2.0.
- **A lenda.** Um exército de mortos que se levantaram, o último argumento do necromante.
- **Cartas que cria.** [Zombie](/pt/cards/zombie), cartas criadas 2/2, quantas forem necessárias para encher o seu tabuleiro.
- **Patches.** Nenhuma mudança.
- **Decks no OriginsMeta em 25 de setembro de 2026.** Dois: [The Trick-or-Treat Legion](/pt/decks/community/the-trick-or-treat-legion-72c4) e [FACE IS THE PLACE](/pt/decks/community/face-is-the-place-b049).
- **Guia.** [Guia do deck de Legion of the Dead](/pt/guides/trick-or-treat-legion-guide).
- **Página da carta.** [Legion of the Dead, carta Lendária: estatísticas e texto](/pt/cards/legion-of-the-dead).

## Three Not So Little Pigs {#three-not-so-little-pigs}

**7 mana · 3/3 · personagem · Neutral** · Saga: Contos de fadas

> Atropelar
>
> Ao revelar: Invoca um Not So Little Pig [3⚔️/3❤️] com Atropelar em um espaço aleatório de cada um dos outros locais.

- **A lenda.** Os três porquinhos de palha, de madeira e de tijolos, agora crescidos e nada fáceis de derrubar com um sopro.
- **Cartas que cria.** [Not So Little Pig](/pt/cards/not-so-little-pig), um 3/3 com Atropelar, um em cada um dos outros dois locais.
- **Patches.** Patch 0.6.2: de 4/4 para 3/3, e os porcos que ele invoca também passaram a 3/3 ([notas do patch](/pt/news/patch-0-6-2)).
- **Decks no OriginsMeta em 25 de setembro de 2026.** Quatro: [3 Pigs Mid Range](/pt/decks/community/3-pigs-mid-range-6311), [Value Board](/pt/decks/community/value-board-c44a), [VALUE MAXXING](/pt/decks/community/value-maxxing-739d) e [AGGRO /MIDRANGE PIGS GM](/pt/decks/community/aggro-midrange-pigs-gm-6931).
- **Guias.** [Guia do deck de Three Not So Little Pigs](/pt/guides/three-pigs-midrange-guide) e [os seus matchups](/pt/guides/three-pigs-midrange-matchups).
- **Página da carta.** [Three Not So Little Pigs, carta Lendária: estatísticas e texto](/pt/cards/three-not-so-little-pigs).

## Robin Hood {#robin-hood}

**8 mana · 4/4 · personagem · Good** · Saga: Sherwood

> Tiro certeiro 3
>
> Ao revelar: Causa 2 de dano a todos os inimigos.

- **A única Lendária de 8 de mana** da Demo 2.0.
- **A lenda.** O arqueiro fora da lei da floresta de Sherwood que rouba dos ricos para alimentar os pobres, cantado em baladas desde o século XIV.
- **Patches.** Nenhuma mudança.
- **Decks no OriginsMeta em 25 de setembro de 2026.** Um: [Buff](/pt/decks/community/buff-6f60).
- **Guia.** Ainda nenhum: [mande o seu](/pt/guides/submit).
- **Página da carta.** [Robin Hood, carta Lendária: estatísticas e texto](/pt/cards/robin-hood).

## As Lendárias que não estão na Demo 2.0 {#fora-da-demo}

O nosso banco de dados também guarda nove Lendárias que não estão na Demo 2.0: [Alice](/pt/cards/alice), [Beowulf](/pt/cards/beowulf), [Cinderella](/pt/cards/cinderella), [Death](/pt/cards/death), [Dr. Frank](/pt/cards/dr-frank), [Mirror Mirror](/pt/cards/mirror-mirror), [Red](/pt/cards/red), [Winnie-the-Pooh](/pt/cards/winnie-the-pooh) e [Wizard of Oz](/pt/cards/wizard-of-oz). As páginas delas mantêm os últimos dados conhecidos, que não foram verificados no jogo. Nos seus AMAs a equipe descreveu um lançamento completo com a lista inteira de cartas Lendárias: as datas que conhecemos estão no [roadmap](/pt/guides/roadmap-and-dates).

## De onde vêm os números {#fontes}

- **Cartas:** o [banco de dados de cartas](/pt/cards) do OriginsMeta: custos, estatísticas e textos em inglês das cartas da demo verificados um por um no jogo em 22 de setembro de 2026, textos em italiano e espanhol lidos no jogo em 25 de setembro de 2026, textos em português lidos no jogo em 20 de outubro de 2026.
- **Patches:** as notas do patch oficiais no Steam, carta por carta no [MetaShifting](/pt/metashifting).
- **Decks:** os 20 decks publicados no OriginsMeta de 15 de setembro até as 20:00 CEST de 25 de setembro de 2026 ([todos os decks de Origins TCG](/pt/decks)); a contagem depois disso está em [As mais jogadas](/pt/tier-list/most-played).

Vamos atualizar este guia sempre que um patch mudar uma Lendária ou a demo adicionar uma nova.
`,
  },
  "origins-tcg-ranked": {
    title: "A ranqueada de Origins TCG: o que sabemos da ladder antes do Steam Next Fest",
    metaTitle: "Ranqueada de Origins TCG: início, Grandmaster, VP",
    excerpt: "A ranqueada chega à demo de Origins TCG com o Steam Next Fest, em 19 de outubro de 2026. O que a Koin confirmou: divisões, Grandmaster, VP e recompensas.",
    faq: [
      {
        q: "A que horas a ranqueada abre em 19 de outubro?",
        a: "O post da Koin Games no Steam de 21 de setembro de 2026 diz apenas \"com o início do Steam Next Fest\", sem horário. O festival abre na segunda-feira, 19 de outubro de 2026, às 10:00 no horário do Pacífico: 13:00 no horário do leste dos EUA, 18:00 no Reino Unido e 19:00 na Europa central.",
      },
      {
        q: "Qual é o rank mais alto de Origins TCG?",
        a: "Grandmaster, a divisão mais alta da ladder do playtest fechado, que tem um ranking mundial (notas do patch oficiais 0.6.1 e 0.6.3, agosto de 2026).",
      },
      {
        q: "Quais são as recompensas da ranqueada?",
        a: "A Koin Games só disse que a ranqueada da demo vem com recompensas exclusivas da ranqueada; em 25 de setembro de 2026 os detalhes ainda não tinham sido anunciados.",
      },
      {
        q: "Dá para jogar a ranqueada antes do Steam Next Fest?",
        a: "Só no playtest fechado, onde a ranqueada está ativa desde o patch 0.6.1 de 14 de agosto de 2026; as instruções para acessar o playtest estão no Discord oficial.",
      },
    ],
    body: `
## Em resumo {#em-resumo}

- A ranqueada é ativada na demo gratuita **com o início do Steam Next Fest**, na segunda-feira, 19 de outubro de 2026, "com recompensas exclusivas da ranqueada" (post da Koin Games no Steam de 21 de setembro de 2026).
- Não é novidade: o playtest fechado tem uma ladder ranqueada desde o patch 0.6.1 de 14 de agosto de 2026, e em 24 de setembro ela ainda estava ativa lá.
- O que as notas do patch oficiais confirmam: divisões, uma divisão mais alta chamada **Grandmaster** com um ranking mundial, e **Pontos de Vitória** (VP) ganhos e perdidos nas partidas ranqueadas: as notas falam de uma variação de +10 e −10, e desde o patch 0.6.2 as batalhas em sala não dão mais VP.
- O que a Koin ainda não disse: a lista completa das divisões, se os +10/−10 VP do playtest continuam iguais em todas as divisões e na demo, temporadas e resets, quais são as recompensas.

Vamos atualizar este guia quando a ranqueada abrir na demo.

## Quando a ranqueada abre {#quando}

Em 21 de setembro de 2026, no post sobre a [primeira grande atualização da demo](https://store.steampowered.com/news/app/4429430/view/1844115010502611), a Koin Games escreveu que vai "ativar o modo ranqueado com o início do Steam Next Fest, que virá com recompensas exclusivas da ranqueada". O [Steam Next Fest](https://store.steampowered.com/sale/nextfest) vai da segunda-feira, 19 de outubro de 2026, às 10:00 no horário do Pacífico (13:00 no horário do leste dos EUA, 18:00 no Reino Unido e 19:00 na Europa central), até a segunda-feira, 26 de outubro. O post não dá um horário exato para a ranqueada: "com o início" do festival é tudo o que ele diz.

Em 24 de setembro o anúncio da Crimson Cup no Discord oficial repetiu: a demo, que tem a lista de cartas do torneio, ativa a ranqueada para o Steam Next Fest, com novas recompensas da ranqueada ([nosso artigo](/pt/news/crimson-cup-format-check-in#demo-playtest)). Todo o resto sobre o festival está no nosso [guia do Steam Next Fest](/pt/guides/steam-next-fest-2026).

## O que a ladder do playtest nos diz {#ladder-do-playtest}

A ranqueada está no ar no playtest fechado desde meados de agosto, e três notas do patch oficiais a descrevem:

- **Patch 0.6.1, 14 de agosto de 2026.** A ladder ranqueada é o destaque da atualização, e "a divisão Grandmaster tem um ranking mundial" ([notas do patch](https://store.steampowered.com/news/app/4429430/view/1840944183780414)). Um bug conhecido dessa build: a exibição dos VP (Pontos de Vitória) dava errado assim que um jogador chegava ao Grandmaster.
- **Patch 0.6.2, 21 de agosto de 2026.** A Grandmaster League passa a mostrar o rank, os VP e a divisão corretos de cada jogador, e as batalhas em sala não dão mais VP. Dois bugs conhecidos dessa build: os VP eram ganhos e perdidos normalmente, mas o +10 e o −10 mostrados enquanto o total muda tinham sumido temporariamente, e no fim de uma partida no Grandmaster a variação de VP não aparecia, embora os pontos estivessem mudando ([notas do patch](https://store.steampowered.com/news/app/4429430/view/1841579228669961)).
- **Patch 0.6.3, 27 de agosto de 2026.** Na divisão mais alta, a tela de resultados mostrava valores provisórios em vez dos do jogador; agora divisão, total de VP e variação de VP aparecem corretamente, o +10 e o −10 não ficam mais por cima do total de VP enquanto ele muda, e resultado, Pontos de Vitória e rank devem sempre aparecer no fim de uma partida ([notas do patch](https://store.steampowered.com/news/app/4429430/view/1842212951301184)).

Juntando tudo: a ladder é feita de divisões, **o Grandmaster é a mais alta** (o patch 0.6.3 a chama de "a divisão mais alta") e tem um ranking mundial com um rank para cada jogador, e as partidas ranqueadas mexem nos seus Pontos de Vitória, com uma variação de +10 ou −10 nas notas do playtest (as batalhas em sala não, desde a 0.6.2). As notas citam "Diamond IV" só como um dos valores provisórios mostrados por engano: elas não listam as divisões abaixo do Grandmaster. O nosso resumo do primeiro patch da ranqueada está em [patch 0.6.1: ladder ranqueada e Grandmaster](/pt/news/patch-0-6-1-ranked).

## Ranqueada e desbloqueio de decks {#desbloqueios}

No playtest fechado, segundo jogadores no fórum do Steam em 14 de setembro de 2026, um deck era desbloqueado depois de três vitórias na ranqueada mais uma vitória contra um boss da IA; um desenvolvedor respondeu que a equipe estava pensando em deixar essas partidas de desbloqueio só PvE ([nosso artigo](/pt/news/playtest-feedback-deck-unlock)). Com a atualização da demo de 21 de setembro, a Koin confirmou que todos mantêm o progresso da demo ou do playtest, o que estiver mais adiantado ([nosso artigo](/pt/news/demo-first-big-update#progresso)).

## Onde jogar antes do festival {#antes-do-festival}

- **A demo** é gratuita no [Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) e tem a lista de cartas da Crimson Cup; a ranqueada chega lá com o festival.
- **O playtest fechado** já tem ranqueada. O post da Koin no Steam de 25 de agosto de 2026 indica o [Discord oficial](https://discord.gg/originstcg) para as instruções de acesso, e em 24 de setembro a equipe disse que o playtest vai receber atualizações que a build do torneio não terá.
- Para preparar os decks: o [deck builder](/pt/deck-builder) e [todos os decks de Origins TCG](/pt/decks) publicados pela comunidade, cada um com o código do jogo (KGBLDC…) para colar no Origins. As [11 Lendárias](/pt/guides/origins-tcg-legendaries) que os lideram estão descritas uma a uma no nosso guia.
- Se você está se preparando para a Crimson Cup, que é jogada com três decks no Conquest: [como montar os três decks](/pt/guides/origins-tcg-conquest).

## O que o OriginsMeta vai fazer com a ranqueada {#originsmeta}

O nosso plano em 25 de setembro de 2026: a primeira [tier list](/pt/tier-list) do OriginsMeta depois das finais da Crimson Cup de 25 de outubro, construída com os resultados do torneio e com o topo da ladder ranqueada. Até lá, a página da tier list mostra os decks da comunidade mais bem avaliados e as cartas mais jogadas, apresentados como prévias.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Quais são as "recompensas exclusivas da ranqueada" e como ganhá-las.
- Quantas divisões existem, e os nomes delas abaixo do Grandmaster.
- Se uma vitória e uma derrota valem sempre +10 e −10 VP, como nas notas do playtest, em todas as divisões e na demo.
- Se a ranqueada tem temporadas ou resets, e se continua ativa na demo depois do fim do festival, em 26 de outubro.
- Se o progresso da ranqueada passa para o jogo completo.

## Fontes {#fontes}

Os posts oficiais da Koin Games no Steam: [patch 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414) (14 de agosto de 2026), [patch 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) (21 de agosto), [patch 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) (27 de agosto), [Big Bob's Playtest Battle](https://store.steampowered.com/news/app/4429430/view/1841579228677617) (25 de agosto) e a [primeira grande atualização da demo](https://store.steampowered.com/news/app/4429430/view/1844115010502611) (21 de setembro); o anúncio da Crimson Cup no Discord oficial (24 de setembro). Todos lidos em 25 de setembro de 2026.
`,
  },
  "origins-tcg-conquest": {
    title: "Conquest em Origins TCG: como montar três decks que respeitam a regra das cartas únicas",
    metaTitle: "Conquest em Origins TCG: como montar seus três decks",
    excerpt: "Como montar uma formação Conquest em Origins TCG: como as cartas únicas são contadas, a verificação do deck builder e decks reais da comunidade que passam.",
    faq: [
      {
        q: "Como conto as cartas que dois decks de Conquest têm em comum?",
        a: "Pegue as 13 cartas diferentes de cada deck, a Lendária e as doze cartas base, cada uma contada uma vez, qualquer que seja o número de cópias: as cartas únicas entre os dois decks são 13 menos as cartas em comum. Com um mínimo de 8 cartas únicas, dois decks podem compartilhar no máximo 5. É a leitura do OriginsMeta, já que a Koin Games não detalhou como a contagem funciona; a regra em si está no nosso artigo sobre as regras da Crimson Cup.",
      },
      {
        q: "Dois dos meus decks de Conquest podem usar a mesma Lendária?",
        a: "No Big Bob's Playtest Battle, em agosto, não: cada deck precisava de uma Lendária diferente. Para a Crimson Cup, os anúncios de 9 e 24 de setembro de 2026 não deixam isso claro; como no ban você só vê a Lendária, o nosso deck builder sinaliza dois decks com a mesma.",
      },
      {
        q: "As duas cópias de uma carta contam como duas cartas?",
        a: "Não na leitura do OriginsMeta: uma carta conta uma vez, qualquer que seja o número de cópias, então cada deck tem 13 cartas para comparar, a Lendária e as doze cartas base.",
      },
      {
        q: "Como verifico os meus três decks?",
        a: "No deck builder do OriginsMeta, no modo Torneio (3 decks): a verificação Conquest conta as cartas únicas entre cada par de decks, lista as que estão em comum e sinaliza dois decks com a mesma Lendária.",
      },
    ],
    body: `
## Em resumo {#em-resumo}

- **Conquest** significa levar mais de um deck, diferentes o bastante entre si, e banir um dos decks do oponente (Koin Games, 25 de agosto de 2026); no Big Bob's Playtest Battle cada deck também precisava de uma Lendária diferente.
- Na **Crimson Cup** (19–25 de outubro de 2026) você leva três decks com pelo menos 8 cartas únicas entre cada par. Regras, datas, prêmios e check-in estão no [nosso artigo sobre as regras da Crimson Cup](/pt/news/crimson-cup-format-check-in): este guia é sobre como montar os três decks.
- A Koin não detalhou como as cartas únicas são contadas. O OriginsMeta conta cada carta uma vez, qualquer que seja o número de cópias, Lendária incluída: assim, dois decks podem compartilhar no máximo 5 cartas.
- O [deck builder](/pt/deck-builder) verifica tudo isso no modo "Torneio (3 decks)".
- Entre os 20 decks publicados no OriginsMeta até as 20:00 CEST de 25 de setembro de 2026, 174 dos 176 pares com Lendárias diferentes passam na regra; os dois que não passam, ambos com o Buff, ficam a uma carta.

## O que o Conquest pede {#o-formato}

A Koin Games usou o Conquest pela primeira vez no [Big Bob's Playtest Battle](/pt/news/big-bobs-playtest-battle), em 28 de agosto de 2026. O [anúncio no Steam](https://store.steampowered.com/news/app/4429430/view/1841579228677617) de 25 de agosto o descreve assim: "você precisa enviar vários decks antes do início do torneio, que têm de ser diferentes entre si, e tem a chance de banir um deck do seu oponente". Daquela vez cada deck precisava de uma Lendária diferente e de pelo menos nove cartas de diferença.

Para a Crimson Cup, os anúncios de 9 e 24 de setembro de 2026 definem estas regras:

- **três decks**; os anúncios não dizem se as Lendárias precisam ser diferentes (no Big Bob's precisavam, e no ban você só vê a Lendária);
- **pelo menos 8 cartas únicas** entre cada par de decks;
- decklists escondidas até o top 4: quando você bane um dos decks do oponente, só vê a Lendária dele;
- partidas em melhor de três e uma grande final em melhor de cinco; na melhor de cinco não há ban e é preciso vencer com os três decks.

O torneio é jogado na demo principal, com a lista de cartas dela. Em 29 de setembro de 2026 chegou o [patch 0.7](/pt/news/patch-0-7), que a equipe chama de último patch de balanceamento antes do torneio: Bagheera, Mind Palace e Spellbook agora custam um a mais e Twister Toss ganhou um rework, então vale conferir de novo uma formação montada antes disso.

## Como as cartas únicas são contadas {#contagem}

Todo deck tem **13 cartas diferentes**: a Lendária e doze cartas base, cuja segunda cópia o próprio jogo adiciona (25 cartas em jogo). O anúncio da Crimson Cup não diz como as 8 cartas únicas são contadas. Esta é a leitura do OriginsMeta, a que o nosso deck builder e os nossos torneios aplicam:

1. cada carta conta **uma vez**, qualquer que seja o número de cópias;
2. **a Lendária também conta**: duas Lendárias diferentes são sempre uma carta de diferença;
3. as cartas únicas entre o deck A e o deck B são as cartas de A que B não tem: **13 menos as cartas em comum**.

Então "pelo menos 8 cartas únicas" quer dizer **no máximo 5 cartas em comum** entre quaisquer dois dos seus decks.

**Um par bem no limite.** [3 Pigs Mid Range](/pt/decks/community/3-pigs-mid-range-6311) (Three Not So Little Pigs) e [On Reveal Mid Range](/pt/decks/community/on-reveal-mid-range-772e) (Mulan) compartilham cinco cartas: En Passant, Ali Baba, Bagheera, Frog Prince e Ellen Trechend. Em jogo são dez das 25 cartas de cada deck, mas contam como cinco: 13 − 5 = **8 cartas únicas**, exatamente o mínimo. Mais uma carta em comum e o par não passaria mais.

**Um par a uma carta do mínimo.** [Buff](/pt/decks/community/buff-6f60) (Robin Hood) e [FACE IS THE PLACE](/pt/decks/community/face-is-the-place-b049) (Legion of the Dead) compartilham seis cartas: Musketeer, Defense Matrix, Bagheera, Three Blind Mice, Glinda e Galahad. 13 − 6 = **7**: para levá-los juntos, uma das seis tem de sair de um dos dois decks.

Se a Koin contar de outro jeito, por exemplo cópia por cópia, os números mudam: vamos atualizar este guia e o deck builder assim que a regra for detalhada.

## Monte os três decks no deck builder {#deck-builder}

1. Abra o [deck builder](/pt/deck-builder) e passe de "Deck único" para **"Torneio (3 decks)"**.
2. Os decks A, B e C têm cada um a sua aba. Monte-os a partir do pool de cartas, ou cole um código do jogo (KGBLDC…) em **Importar**: a importação só muda o deck em que você está.
3. Na página de qualquer deck da comunidade, **"Abrir no deck builder"** carrega aquela lista no deck ativo e deixa os outros dois como estão: um jeito rápido de testar pares de decks publicados.
4. O quadro **"Verificação Conquest"** mostra, para cada par, quantas cartas únicas são diferentes: em verde com ✓ do mínimo para cima, em vermelho com ✗ abaixo dele. Passar o mouse sobre um número lista as cartas em comum. O mínimo é 8, o valor da Crimson Cup, e você pode mudá-lo (o Big Bob's Playtest Battle pedia 9). A verificação também sinaliza dois decks com a mesma Lendária.
5. Quando os três decks são válidos e distantes o bastante, o quadro diz **OK ✓**. Copie cada deck com "Copiar código do jogo" e cole no Origins.

O deck builder salva os três decks no seu navegador enquanto você trabalha. Os [torneios](/pt/tournaments) criados no OriginsMeta também podem usar o Conquest, com 2 a 4 decks por jogador e um mínimo escolhido pelo organizador, e o deck builder de cada torneio aplica essas regras. As Lendárias para escolher estão todas no [nosso guia das 11 Lendárias](/pt/guides/origins-tcg-legendaries).

A Crimson Cup é o torneio do Steam Next Fest, e a ranqueada abre na demo com o mesmo festival: tudo sobre o festival está no nosso [guia do Steam Next Fest](/pt/guides/steam-next-fest-2026), e [o que está confirmado sobre a ranqueada](/pt/guides/origins-tcg-ranked) tem um guia próprio.

## Decks da comunidade que passam, e dois que não passam {#pares-da-comunidade}

Às 20:00 CEST de 25 de setembro de 2026 o OriginsMeta tem 20 decks publicados, liderados por 10 Lendárias diferentes. Isso dá 190 pares possíveis:

- 14 pares compartilham a Lendária: o deck builder os sinaliza, e no Big Bob's Playtest Battle não poderiam entrar na mesma formação. Muitas vezes são versões de uma mesma lista, como [Healing Healsing](/pt/decks/community/healing-healsing-9411), [Cure Control](/pt/decks/community/cure-control-b630) e [CONTROL](/pt/decks/community/control-2c2b), três decks de Van Helsing que compartilham 12 das suas 13 cartas;
- dos outros 176, **174 passam** na regra das 8 cartas, e 30 deles não compartilham nenhuma carta;
- dois não passam, ambos com 7 e ambos com o Buff: Buff e FACE IS THE PLACE, vistos acima, e Buff e [AGGRO /MIDRANGE PIGS GM](/pt/decks/community/aggro-midrange-pigs-gm-6931) (Three Not So Little Pigs), que compartilham Bagheera, Mind Palace, Three Blind Mice, Beast, Glinda e Galahad.

Alguns pares com os números reais:

| Par | Lendárias | Cartas em comum | Cartas únicas de diferença | 8 ou mais? |
| --- | --- | --- | --- | --- |
| [Dracula SUPER FUN](/pt/decks/community/dracula-super-fun-d936) + [Qoh](/pt/decks/community/qoh-f876) | Dracula, Queen of Hearts | nenhuma | 13 | sim |
| [3 Pigs Mid Range](/pt/decks/community/3-pigs-mid-range-6311) + [Healing Healsing](/pt/decks/community/healing-healsing-9411) | Three Not So Little Pigs, Van Helsing | 1: Ali Baba | 12 | sim |
| [Dorothy Combo](/pt/decks/community/dorothy-combo-7503) + [On Reveal Mid Range](/pt/decks/community/on-reveal-mid-range-772e) | Dorothy, Mulan | 1: En Passant | 12 | sim |
| [Spellcast](/pt/decks/community/spellcast-250f) + [The Trick-or-Treat Legion](/pt/decks/community/the-trick-or-treat-legion-72c4) | Merlin, Legion of the Dead | 2: Golden Egg, Impundulu | 11 | sim |
| [King of Value Trade](/pt/decks/community/king-of-value-trade-fd14) + [Healing Healsing](/pt/decks/community/healing-healsing-9411) | King Arthur, Van Helsing | 4: Shahrazad, Ali Baba, Boitata, Spellbook | 9 | sim |
| [Qoh](/pt/decks/community/qoh-f876) + [Value Board](/pt/decks/community/value-board-c44a) | Queen of Hearts, Three Not So Little Pigs | 5: Bagheera, Baby Bear, Mind Palace, Ellen Trechend, Cockatrice | 8 | sim, no limite |
| [Buff](/pt/decks/community/buff-6f60) + [FACE IS THE PLACE](/pt/decks/community/face-is-the-place-b049) | Robin Hood, Legion of the Dead | 6 | 7 | não |

Nove pares ficam exatamente em 8:

- [3 Pigs Mid Range](/pt/decks/community/3-pigs-mid-range-6311) + [On Reveal Mid Range](/pt/decks/community/on-reveal-mid-range-772e)
- [AGGRO /MIDRANGE PIGS GM](/pt/decks/community/aggro-midrange-pigs-gm-6931) + [FACE IS THE PLACE](/pt/decks/community/face-is-the-place-b049)
- [CONTROL](/pt/decks/community/control-2c2b) + [Spellcast](/pt/decks/community/spellcast-250f)
- [Cure Control](/pt/decks/community/cure-control-b630) + [Glinda Reborn](/pt/decks/community/glinda-reborn-2d6d)
- [Cure Control](/pt/decks/community/cure-control-b630) + [Spellcast](/pt/decks/community/spellcast-250f)
- [FACE IS THE PLACE](/pt/decks/community/face-is-the-place-b049) + [Glinda Reborn](/pt/decks/community/glinda-reborn-2d6d)
- [Healing Healsing](/pt/decks/community/healing-healsing-9411) + [Spellcast](/pt/decks/community/spellcast-250f)
- [Qoh](/pt/decks/community/qoh-f876) + [Value Board](/pt/decks/community/value-board-c44a)
- [Qoh](/pt/decks/community/qoh-f876) + [VALUE MAXXING](/pt/decks/community/value-maxxing-739d)

Dos 1.140 trios possíveis de decks publicados, 867 têm três Lendárias diferentes e passam na regra nos três pares.

São contagens, não conselhos: dizem quais decks podem ficar juntos segundo a regra, não qual formação vence. Como cada deck é jogado está na página dele, no guia do seu autor.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Como a Koin conta as 8 cartas únicas: o anúncio de 24 de setembro não diz.
- Se os três decks da Crimson Cup precisam ter Lendárias diferentes: os anúncios não dizem.
- A lista de cartas definitiva: a lista provisória está no jogo desde 21 de setembro. O patch 0.7 de 29 de setembro é, nas palavras da equipe, o último patch de balanceamento antes do torneio, mas as notas dele não dizem se a lista de cartas é definitiva.

## Fontes {#fontes}

Os posts da Koin Games no Steam de [25 de agosto](https://store.steampowered.com/news/app/4429430/view/1841579228677617) (Big Bob's Playtest Battle), de [9 de setembro de 2026](https://store.steampowered.com/news/app/4429430/view/1843481262690278) (o torneio do Steam Next Fest) e de [29 de setembro de 2026](https://store.steampowered.com/news/app/4429430/view/1844751498235283) (o patch 0.7), o anúncio da Crimson Cup no Discord oficial (24 de setembro) e os decks publicados no OriginsMeta até as 20:00 CEST de 25 de setembro de 2026, contados com a mesma função que o deck builder usa.
`,
  },
  "origins-tcg-locations": {
    title: "Os locais de Origins TCG: como as três linhas mudam cada partida",
    metaTitle: "Os locais de Origins TCG explicados",
    excerpt: "Os locais são o terceiro jogador à mesa: dobram o dano, mudam custos e movem seus personagens. Como funcionam, quais decidem partidas, como montar com eles.",
    faq: [
      {
        q: "Quantos locais existem em Origins TCG?",
        a: "A Demo 2.0 faz rodar 44. A página oficial no Steam diz que o jogo completo sorteia os locais de um conjunto de mais de cem.",
      },
      {
        q: "Quando você vê os locais de uma partida?",
        a: "Um por rodada nas três primeiras rodadas: o primeiro é conhecido desde o início, o segundo chega na segunda rodada e o terceiro na terceira. A partir da quarta rodada você joga com o tabuleiro inteiro à vista.",
      },
      {
        q: "Um local vale para os dois jogadores?",
        a: "Sim. Um local é uma regra daquela linha, não um bônus para quem chega primeiro: Amplifying Amphitheatre dobra o seu dano e o do oponente.",
      },
      {
        q: "Onde posso ver a lista completa?",
        a: "Na página de locais do OriginsMeta, com busca, filtros por tipo de efeito e links para as cartas que alguns deles invocam.",
      },
    ],
    body: `
## Por que os locais importam mais do que parece

Origins TCG é jogado em **três locais**, e cada um traz uma regra que vale para aquela linha durante a partida inteira. É a parte do jogo que uma decklist não consegue controlar: dois jogadores podem sentar com as mesmas vinte e cinco cartas e ter duas partidas completamente diferentes, porque um tabuleiro dobra o dano e o outro faz tudo custar um a menos.

A Demo 2.0 faz rodar **44 locais**. A [página oficial no Steam](https://store.steampowered.com/app/4429430/Origins_TCG/) diz que o jogo completo vai sortear os locais "from a pool of 100+ rotating locations that reshape the board and demand a unique strategy", um conjunto de mais de cem locais que mudam o tabuleiro e pedem uma estratégia própria. A lista completa, com cada efeito, está na [página de locais](/pt/locations), com busca e filtros; este guia é sobre o que fazer com eles.

## Como eles chegam

Os três locais são revelados **um por rodada nas três primeiras rodadas**. O primeiro está na mesa desde o início, o segundo aparece na segunda rodada, o terceiro na terceira. Da quarta rodada em diante não há mais nada escondido e você joga em um tabuleiro que vê por inteiro.

Esse calendário é o motivo pelo qual as primeiras rodadas não são só uma questão de curva: na primeira rodada você coloca cartas em uma linha cujas duas vizinhas ainda não conhece. Segurar um personagem por uma rodada para ver onde ele se encaixa muitas vezes vale mais do que jogá-lo na curva na linha errada.

## Com que frequência eles aparecem

Desde o [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026 cada local tem uma raridade: comum, rara, muito rara ou ultrarrara. A raridade decide com que frequência um local aparece. A equipe explica assim: espere ver os conhecidos na maioria das partidas, e alguns que você só vai ver "uma vez na vida e outra na morte". As notas do patch não dizem qual local tem qual raridade: vamos acrescentar isso à [página de locais](/pt/locations) assim que soubermos.

## As famílias de efeitos

Na nossa lista os locais estão agrupados pelo que fazem com a partida, e vale a pena conhecer os grupos porque eles pedem respostas diferentes.

- **Dano.** Amplifying Amphitheatre dobra todo o dano ali, Burnturn Arena desgasta cada personagem depois do combate, Soul Artillery atinge as duas barreiras sempre que algo morre. Os corpos pequenos deixam de estar seguros.
- **Mana e custos.** Gold Spinning Wheel tira um de tudo, Castle in the Clouds só das cartas que custam sete ou mais, Treasurer's Office acrescenta um, Mana Battery deixa você guardar o que não gastou. São eles que decidem quem ganha vantagem de tempo.
- **Compra e descarte.** The Sultan's Court dá uma carta a cada rodada que você precisa gastar, Knowledge Vault premia quem enche a linha primeiro, Junkyard tira uma dos dois jogadores, Nostradamus' Call destrói os dois decks no início da sexta rodada.
- **Movimento.** Conveyor Belt empurra todo mundo para a direita depois do combate, Ballroom manda um personagem aleatório de volta para a mão, Open Meadow concede Mover (Move).
- **Invocações e cópias.** Cloning Lab enche os seus espaços com cópias do que você acabou de jogar, Reflecting Pool o copia em outro local, Sherwood Forest produz um [Merry Man](/pt/cards/merry-man) atrás do outro, Hundred Acre Woods coloca um [Christopher Robin](/pt/cards/christopher-robin) dos dois lados.
- **Palavras-chave concedidas.** Stomping Grounds dá Atropelar (Trample), The Colosseum dá Ataque duplo (Double Attack), Windmill Ridge dá Defensor (Defender), Poison Grounds dá Toque mortífero (Deathtouch) aos personagens Evil, Blessed Grounds dá Escudo (Shield) aos personagens Good.
- **Habilidades.** Mirror Dimension repete as habilidades Ao revelar (On Reveal), Burial Grounds repete as habilidades Ao morrer (On Death), Anti-Magic Vault tira as habilidades por completo, Wonderland inverte a ordem de ataque.
- **Destruição e barreiras.** The Gallows destrói o inimigo à frente de tudo o que chega ali, The Hill mata depois do combate tudo o que estiver empatado com o menor Poder, Wall of Dumpty engole o primeiro personagem que você joga, Broken Gate faz as barreiras voltarem com 10 de Vida em vez de 40.

## Os locais que decidem partidas

Alguns valem a pena reconhecer assim que aparecem, porque mudam o que você deve fazer com a sua mão.

- **Cloning Lab.** Tudo o que você joga ali é copiado nos seus espaços livres daquela linha. Um corpo barato com uma boa habilidade Ao revelar vira três, e a linha se decide em um turno.
- **Mirror Dimension.** Toda habilidade Ao revelar acontece duas vezes. Faz por uma linha inteira o que [Mulan](/pt/cards/mulan) faz por um deck, e se soma a ela.
- **The Gallows.** Tudo o que entra em jogo ali destrói o inimigo à frente. Transforma o seu personagem mais barato em remoção, e pune quem se compromete primeiro.
- **Anti-Magic Vault.** Os personagens perdem todas as habilidades. Um deck construído em cima de gatilhos não tem nada a fazer ali; um deck de corpos simples de repente se sente em casa.
- **Amplifying Amphitheatre.** Todo o dano dobrado, nos dois sentidos. Um finalizador com Atropelar como [Ellen Trechend](/pt/cards/ellen-trechend) encerra a partida atravessando a barreira; o do oponente também.
- **Nostradamus' Call.** Os dois decks são destruídos no início da sexta rodada. Qualquer que seja o seu plano, ele precisa estar concluído até a quinta rodada.

## Montar o deck pensando nos locais

Você não pode escolher o tabuleiro, mas pode montar um deck que raramente fica sem saída nele.

1. **Não aposte tudo em um só gatilho.** Um deck que só funciona com habilidades Ao revelar é um deck que perde uma linha para o Anti-Magic Vault. Mantenha algumas cartas que sejam boas como corpos simples.
2. **Tenha uma carta de alcance.** Os locais que atingem as barreiras (Overloaded Circuit, "Human" Cannon, Soul Artillery) premiam os decks que conseguem fechar uma linha à distância em vez de desgastá-la aos poucos.
3. **Os personagens baratos são os que mais ganham.** Todo local que concede uma palavra-chave ou copia um corpo rende mais em uma carta de dois de mana do que em uma de sete: é o local que faz a parte cara.
4. **Cuidado com as linhas que punem quem se compromete.** The Hill, Wall of Dumpty e The Gallows punem o jogador que enche uma linha primeiro. Contra um tabuleiro desconhecido, a segunda carta em uma linha muitas vezes é mais segura que a primeira.

## O que ainda queremos verificar

Esta lista corresponde à rotação da Demo 2.0. Ainda não conferimos os locais um por um dentro do jogo, como fizemos com as 122 cartas em 22 de setembro de 2026: quando fizermos, a [página de locais](/pt/locations) vai dizer, com a data e a contagem.
`,
  },
  "origins-tcg-explained": {
    title: "Origins TCG explicado em cinco minutos",
    excerpt: "O que é Origins TCG, como funciona uma partida em três linhas com turnos simultâneos, o que significa free-to-compete e como jogar a demo hoje mesmo.",
    faq: [
      {
        q: "O que é Origins TCG?",
        a: "Um jogo de cartas colecionáveis digital da Koin Games, um estúdio com sede em Tampa, na Flórida, fundado em 2021. O elenco é formado por lendas de domínio público — Robin Hood, Mulan, a Queen of Hearts, Dracula e muitas outras — reimaginadas em um único mundo original.",
      },
      {
        q: "Quanto tempo dura uma partida?",
        a: "Cerca de sete minutos. Os dois jogadores agem ao mesmo tempo em três linhas, então ninguém espera o turno do oponente.",
      },
      {
        q: "Quantas cartas tem um deck?",
        a: "Vinte e cinco na demo atual, montadas em torno de uma Lendária com uma habilidade característica. Mulan repete as habilidades Ao revelar dos seus aliados, a Queen of Hearts repete as habilidades Ao morrer deles.",
      },
      {
        q: "Dá para jogar Origins TCG de graça?",
        a: "Sim. A demo no Steam é gratuita e inclui o tutorial, missões contra bosses com IA própria e o jogo online. Toda carta de que você precisa para jogar competitivamente é ganha jogando; o dinheiro só compra versões colecionáveis das cartas.",
      },
    ],
    body: `
## O que é

Origins TCG é um jogo de cartas colecionáveis digital da **Koin Games**, um estúdio com sede em Tampa, na Flórida, fundado em 2021 por veteranos do setor. O elenco é formado por lendas de domínio público reimaginadas em um único mundo original: Robin Hood, Mulan, a Queen of Hearts, Winnie-the-Pooh, King Arthur, Dracula e muitas outras.

A proposta é ser **free-to-compete**: toda carta de que você precisa para jogar competitivamente é ganha jogando. O dinheiro só compra versões colecionáveis das cartas, que podem ser graduadas, trocadas e vendidas. Os desenvolvedores falam em "zero pay-to-win".

## Como funciona uma partida

- **Três linhas.** Você e o seu oponente lutam em três tabuleiros ao mesmo tempo. Cada linha tem o seu próprio local, sorteado de um conjunto de mais de cem que se alternam e mudam as regras daquele tabuleiro.
- **Turnos simultâneos.** Os dois jogadores agem ao mesmo tempo, então não há espera. Uma partida dura cerca de sete minutos.
- **As cartas atacam.** Diferente dos jogos que só "contam linhas", aqui os personagens lutam entre si: o Poder é o dano que você causa, a Vida é o dano que você aguenta.
- **Palavras-chave.** A demo usa, entre outras, Ao revelar (On Reveal), que se ativa quando a carta é jogada, Ao morrer (On Death), Primeiro golpe (First Strike), Ataque duplo (Double Attack) e Toque mortífero (Deathtouch).
- **Uma Lendária lidera o deck.** Na demo atual os decks têm 25 cartas e cada um é montado em torno de uma carta Lendária com uma habilidade característica: Mulan repete as habilidades Ao revelar dos seus aliados, a Queen of Hearts repete as habilidades Ao morrer deles. A Demo 2.0 tem onze: [as 11 Lendárias, carta por carta](/pt/guides/origins-tcg-legendaries).

## Modos

A demo tem um tutorial, missões contra bosses com IA própria e o jogo online. O patch 0.6.1 adicionou uma **ladder ranqueada** com divisões até o Grandmaster, um ranking mundial e Pontos de Vitória. Ela é ativada na demo com o Steam Next Fest: o que está confirmado até agora está no nosso [guia da ranqueada de Origins TCG](/pt/guides/origins-tcg-ranked).

## Como jogar hoje

1. Instale a demo gratuita pela [página no Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/). Quem joga a demo ganha colecionáveis exclusivos que poderão ser trocados quando o jogo completo for lançado.
2. Entre no [Discord oficial](https://discord.gg/originstcg) para torneios, AMAs com a equipe e os playtests das próximas builds.
3. Desde o [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026 o jogo suporta 13 idiomas: inglês, francês, italiano, alemão, espanhol (Espanha), japonês, coreano, polonês, português (Brasil), português (Portugal), russo, chinês simplificado e espanhol (América Latina). A página no Steam, lida em 30 de setembro de 2026, lista os mesmos 13 para a interface, com áudio completo só em inglês. A versão mobile está prevista para 2027.

## Para onde o jogo vai

A página no Steam indica o lançamento para o quarto trimestre de 2026, sem uma data mais precisa. A demo recebeu a sua primeira grande atualização em 21 de setembro de 2026 e o patch 0.7, o último patch de balanceamento antes do torneio, em 29 de setembro; a ranqueada é ativada com o Steam Next Fest (19–26 de outubro de 2026) e o maior torneio do estúdio até agora, a Crimson Cup, vai de 20 a 25 de outubro. Em 25 de setembro o menu principal da demo mostrava o Kickstarter como "Coming soon – Oct 27". Veja o [roadmap](/pt/guides/roadmap-and-dates) e o nosso [guia do Kickstarter](/pt/guides/origins-tcg-kickstarter).
`,
  },
  "on-reveal-midrange-guide": {
    title: "On Reveal Mid Range: como jogar o deck midrange de Mulan",
    metaTitle: "Guia do deck de Mulan: On Reveal Mid Range",
    excerpt: "Plano de jogo, mulligan e rodada a rodada do On Reveal Mid Range, o deck de Mulan que repete cada habilidade Ao revelar, para ladder, competitivo e torneios.",
    faq: [
      {
        q: "O que Mulan faz neste deck?",
        a: "Mulan é uma 2/4 de 4 de mana com Ataque duplo e, quando uma habilidade Ao revelar de um aliado acontece, ela a repete. Nove cartas da lista têm Ao revelar, então ela transforma cada uma delas em duas.",
      },
      {
        q: "O que manter no mulligan?",
        a: "Uma curva que chegue a Mulan na quarta rodada: Bagheera em um espaço central, Baby Bear, depois Black Knight ou Frog Prince. Vale a pena manter Mary quando você espera uma partida longa.",
      },
      {
        q: "Qual habilidade Ao revelar ganha mais com Mulan?",
        a: "A de Mowgli, cuja habilidade Ao revelar de 6 de mana invoca um Baloo 6/6 em outro local aleatório: repetida, ela coloca dois Baloos no tabuleiro. Ellen Trechend e Fairy Godmother também rendem em dobro.",
      },
      {
        q: "Como experimento o deck?",
        a: "Abra a página do deck no OriginsMeta e aperte “Abrir no deck builder”, ou “Copiar código do jogo” para colar o código (KGBLDC…) no Origins.",
      },
    ],
    body: `
**Escrito antes do patch 0.7.** Este deck e este guia foram publicados antes do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026: a lista e o plano de jogo não são canônicos para a 0.7. As tabelas de cartas mostram os custos e as estatísticas de hoje.

## O deck em um parágrafo

**On Reveal Mid Range** é uma lista **midrange** liderada por [Mulan](/pt/cards/mulan), publicada no OriginsMeta em 22 de setembro de 2026 por [Davdas](/pt/authors/davdas), membro da staff do site, e marcada para **ladder**, **competitivo** e **torneio**. A ideia é a que o autor escreve na [página do deck](/pt/decks/community/on-reveal-mid-range-772e): Mulan "permite usar ao máximo" as habilidades Ao revelar, e a lista é montada para ter uma que valha a pena repetir em cada rodada. Ela aguenta um deck agressivo e pressiona um deck de controle, porque as mesmas cartas ganham tempo e constroem o tabuleiro.

## A lista

Vinte e cinco cartas: a Lendária mais doze cartas jogadas em duas cópias cada. As estatísticas são as da Demo 2.0, [verificadas carta por carta no jogo](/pt/deck-builder) em 22 de setembro de 2026, com o novo custo de Bagheera do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro.

| Carta | Custo | O que faz |
| --- | --- | --- |
| [Mulan](/pt/cards/mulan) ★ | 4 | 2/4, Ataque duplo; quando uma habilidade Ao revelar de um aliado acontece, ela a repete |
| [Bagheera](/pt/cards/bagheera) | 2 | 1/1; Ao revelar em um espaço central, recebe +2⚔️/+2❤️ |
| [Baby Bear](/pt/cards/baby-bear) | 2 | 1/1; revida com 1 de dano quando um inimigo causa dano à sua barreira aqui, e Ao morrer adiciona um Papa Bear 4/4 à sua mão |
| [Mary](/pt/cards/mary) | 3 | 1/1; Ao revelar adiciona um Little Lamb à sua mão, Ao morrer os seus Lambs recebem +3⚔️/+3❤️ permanentemente |
| [Black Knight](/pt/cards/black-knight) | 3 | 2/2; Ao revelar causa 2 de dano ao inimigo à sua frente |
| [Frog Prince](/pt/cards/frog-prince) | 3 | 2/2; Ao revelar, +3⚔️ ou +3❤️, à sua escolha |
| [Ali Baba](/pt/cards/ali-baba) | 3 | 2/3; compra uma carta sempre que causa dano à barreira de um oponente |
| [White Queen](/pt/cards/white-queen) | 4 | 3/3; Ao revelar devolve QUALQUER personagem à mão do seu dono |
| [Fairy Godmother](/pt/cards/fairy-godmother) | 5 | 3/3; Ao revelar dá +3⚔️/+3❤️ a outro aliado |
| [Mowgli](/pt/cards/mowgli) | 6 | 2/2; Ao revelar invoca Baloo (6/6) em outro local aleatório |
| [Ellen Trechend](/pt/cards/ellen-trechend) | 8 | Atropelar; Ao revelar recebe +3⚔️/+3❤️ por cada carta inimiga no seu local |
| [Bullseye](/pt/cards/bullseye) | 1 | Feitiço: 3 de dano a QUALQUER personagem |
| [En Passant](/pt/cards/en-passant) | 3 | Feitiço: move um aliado e causa o Poder dele ao personagem à frente dele |

Dez personagens e dois feitiços, nove dos quais têm uma habilidade Ao revelar. Esse é todo o sentido do deck: Mulan não é uma finalizadora, é uma multiplicadora.

## Como o deck vence

Mulan repete a habilidade Ao revelar de um aliado, então cada carta jogada depois dela vale em dobro. As três melhores repetições:

- **Mowgli** custa seis e invoca um Baloo 6/6 em outro local aleatório. Repetido, são dois Baloos: uma única carta que ocupa duas linhas que você não estava disputando.
- **Ellen Trechend** cresce +3⚔️/+3❤️ por cada carta inimiga no seu local, e tem Atropelar. Em uma linha cheia ela já é uma ameaça sozinha; repetida, o bônus cai duas vezes antes do combate.
- **Fairy Godmother** dá +3⚔️/+3❤️ a outro aliado. Os dois gatilhos podem ir no mesmo corpo ou ser divididos entre dois, dependendo do que o oponente consegue remover.

Mulan também tem **Ataque duplo**, então o próprio corpo 2/4 dela troca melhor do que parece.

## Mulligan

Procure uma curva que leve você a Mulan na quarta rodada sem ficar para trás: **Bagheera** em um espaço central (um 3/3 por um de mana), depois **Baby Bear**, depois **Black Knight** ou **Frog Prince**. Mantenha **Mary** quando esperar uma partida longa: o Lamb que ela adiciona à sua mão é um corpo barato e, se Mary morrer, os Lambs que você já jogou crescem permanentemente.

## Rodada a rodada

1. **Rodadas 1–3: ocupar espaço sem se comprometer demais.** Bagheera no centro, Baby Bear onde você espera os primeiros ataques, Black Knight à frente de algo que você quer ver morto. Uma carta por linha basta: o deck quer o tabuleiro equilibrado, não lotado, quando Mulan chega.
2. **Rodada 4: Mulan.** Daqui em diante, a ordem das suas jogadas importa mais do que as cartas. Pergunte-se a cada rodada qual habilidade Ao revelar vale a pena dobrar, e jogue-a no local de Mulan.
3. **Rodadas 5–6: as cartas de valor.** Fairy Godmother, depois Mowgli no seis. White Queen é a carta de resposta da lista: ela devolve QUALQUER personagem à mão do seu dono, então pode tirar um finalizador na rodada em que ele chega, ou pegar de volta a sua própria Mary para jogá-la de novo.
4. **Rodadas 7–8: fechar.** Ellen Trechend na linha que o oponente encheu; En Passant para mover um aliado, acertar o que está à frente dele e abrir caminho para o dano de Atropelar.

## Como usar as cartas que ganham tempo

O autor chama **White Queen, Mary e En Passant** de cartas "que fazem você ganhar tempo", e são elas que permitem ao deck sobreviver a um começo agressivo. White Queen não é remoção: o personagem volta para a mão do dono e pode ser jogado de novo, então use-a em algo caro, ou em um corpo já fortalecido. En Passant é remoção e reposicionamento ao mesmo tempo, e é a resposta a um bloqueador estacionado à frente da sua melhor carta.

## Matchups

Os dados da ranqueada não são públicos, então o que vem a seguir é a leitura que o OriginsMeta faz das listas, não um win rate.

- **Contra decks agressivos.** Baby Bear e Frog Prince jogado como 2/5 seguram as linhas; Bullseye cuida dos corpos de três de Vida por um de mana. Não gaste a White Queen cedo: você vai querê-la para a primeira grande ameaça.
- **Contra decks de controle.** Ali Baba é a carta que mantém a sua mão cheia enquanto você pressiona uma barreira. Não coloque tudo em um só local: uma limpeza de tabuleiro respondida com um único Mowgli é uma virada que você pode bancar, uma mão vazia não.
- **Contra outras listas midrange.** O deck joga o mesmo jogo que [3 Pigs Mid Range](/pt/decks/community/3-pigs-mid-range-6311) e [King of Value Trade](/pt/decks/community/king-of-value-trade-fd14): quem tira mais de cada carta vence. Dobrar uma habilidade Ao revelar é exatamente isso, então proteja Mulan e jogue as habilidades Ao revelar baratas antes dela só quando precisar.

## Os pontos fracos, nas palavras do autor

A página do deck lista dois: **uma boa curva muitas vezes é essencial** e **você pode ficar sem respostas**. Os dois vêm do mesmo lugar: o deck não tem remoção em massa e só tem dois feitiços. Se você tiver de escolher entre usar uma carta agora e guardá-la para dobrar depois, use agora: Mulan repete o que você joga, ela não traz nada de volta.

## Para onde ir depois

- A [página do deck](/pt/decks/community/on-reveal-mid-range-772e) tem a lista com os gráficos de curva de mana e de sagas, as notas do autor, “Abrir no deck builder” e o código do jogo para colar no Origins.
- As estatísticas das cartas são as da Demo 2.0 com o [patch 0.7 de 29 de setembro de 2026](/pt/news/patch-0-7), que levou Bagheera de um para dois de mana; cada página de carta tem o seu histórico de balanceamento.
`,
  },
  "king-of-value-trade-guide": {
    title: "King of Value Trade: como jogar o deck midrange de King Arthur",
    metaTitle: "Guia do King of Value Trade de King Arthur",
    excerpt: "Plano de jogo, mulligan e rodada a rodada do King of Value Trade, o deck midrange de King Arthur feito para vencer cada troca duas cartas por uma.",
    faq: [
      {
        q: "O que é uma value trade em Origins TCG?",
        a: "Fazer uma das suas cartas responder a duas do oponente, ou trocar uma carta barata por uma cara. Este deck é montado em torno dessa ideia: Escudo, Primeiro golpe e os buffs fazem os seus personagens sobreviverem à luta que vencem.",
      },
      {
        q: "O que manter no mulligan?",
        a: "Bagheera e Roo, que são sólidos na curva, Musketeer e Shield Maiden para as primeiras rodadas. Contra decks agressivos mantenha Cowardly Lion; contra controle, Ali Baba.",
      },
      {
        q: "Por que Roo é bom depois do patch de 21 de setembro?",
        a: "O patch da demo de 21 de setembro de 2026 levou Roo de 2/3 para 2/4 (+1 de Vida) por dois de mana, mantendo a palavra-chave Mover, então ele sobrevive à maioria das trocas iniciais em vez de sair perdendo.",
      },
      {
        q: "O Spellbook é necessário?",
        a: "Não. Ele adiciona um feitiço aleatório a cada rodada, como combustível e imprevisibilidade, mas a página do deck diz que a lista pode vencer sem ele.",
      },
    ],
    body: `
**Escrito antes do patch 0.7.** Este deck e este guia foram publicados antes do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026: a lista e o plano de jogo não são canônicos para a 0.7. As tabelas de cartas mostram os custos e as estatísticas de hoje.

## O deck em um parágrafo

**King of Value Trade** é uma lista **midrange** liderada por [King Arthur](/pt/cards/king-arthur), publicada no OriginsMeta em 22 de setembro de 2026 por [Davdas](/pt/authors/davdas), membro da staff do site, e marcada para **ladder**. O nome diz qual é o plano: "quase toda peça quer fazer um dois por um", ou seja, responder a duas cartas do oponente com uma sua. Faça isso com frequência e o tabuleiro fica seu sozinho, sem precisar de um único grande turno final.

## A lista

Vinte e cinco cartas: a Lendária mais doze cartas jogadas em duas cópias cada.

| Carta | Custo | O que faz |
| --- | --- | --- |
| [King Arthur](/pt/cards/king-arthur) ★ | 7 | 7/7 com Escudo; Ao revelar dá Escudo aos seus personagens Bons |
| [Bagheera](/pt/cards/bagheera) | 2 | 1/1; Ao revelar em um espaço central, recebe +2⚔️/+2❤️ |
| [Musketeer](/pt/cards/musketeer) | 2 | 2/1 com Primeiro golpe |
| [Roo](/pt/cards/roo) | 2 | 2/4 com Mover |
| [Shahrazad](/pt/cards/shahrazad) | 2 | 1/4; cura 1 de dano da sua barreira aqui sempre que uma carta entra na sua mão |
| [Shield Maiden](/pt/cards/shield-maiden) | 3 | 3/1 com Escudo |
| [Dark Omen](/pt/cards/dark-omen) | 3 | Feitiço: destrói QUALQUER personagem |
| [Cowardly Lion](/pt/cards/cowardly-lion) | 3 | 2/5 com Defensor |
| [Ali Baba](/pt/cards/ali-baba) | 3 | 2/3; compra uma carta sempre que causa dano à barreira de um oponente |
| [Spellbook](/pt/cards/spellbook) | 4 | Feitiço: daqui em diante, um feitiço aleatório na mão a cada rodada, descartado antes do combate |
| [Lancelot](/pt/cards/lancelot) | 4 | 4/4; todo personagem Bom que você joga no local dele recebe +2⚔️/+2❤️ |
| [Fairy Godmother](/pt/cards/fairy-godmother) | 5 | 3/3; Ao revelar dá +3⚔️/+3❤️ a outro aliado |
| [Boitata](/pt/cards/boitata) | 5 | 5/5; o dano de feitiços e habilidades contra as suas barreiras atinge a barreira do oponente nesse local em vez disso |

Dez personagens e dois feitiços, e dez das treze cartas são personagens Bons: não é coincidência, é o que faz a Lendária valer sete de mana.

## Como o deck vence

Três palavras-chave fazem o trabalho.

- **Escudo** absorve o primeiro dano. King Arthur o dá a todos os seus personagens Bons de uma vez, e [Shield Maiden](/pt/cards/shield-maiden) já vem com o dela: uma 3/1 com Escudo troca com um 3/3 e continua no tabuleiro.
- **Primeiro golpe** no [Musketeer](/pt/cards/musketeer) significa que o inimigo leva o dano antes de poder responder: dois de mana que removem um corpo maior.
- **Os buffs** de [Lancelot](/pt/cards/lancelot) e da [Fairy Godmother](/pt/cards/fairy-godmother) transformam uma luta equilibrada em uma luta de um lado só. Lancelot fortalece todo personagem Bom jogado no local dele, então ele premia você por continuar alimentando a linha em vez de se espalhar demais.

[Ali Baba](/pt/cards/ali-baba) é o motor: toda vez que ele causa dano a uma barreira, você compra. [Shahrazad](/pt/cards/shahrazad) é a outra metade da mesma ideia: ela cura 1 de dano da sua barreira no local dela cada vez que uma carta entra na sua mão, então comprar mantém você vivo, além de na frente.

## Mulligan

**Bagheera é obrigatória**, e agora vale a pena manter **Roo** em qualquer mão: o [patch da demo de 21 de setembro](/pt/news/demo-patch-notes-0921) fez dele um 2/4, então ele sobrevive às trocas iniciais. **Musketeer** e **Shield Maiden** colocam você na frente nas rodadas dois e três. Contra um deck agressivo mantenha **Cowardly Lion**, cujo Defensor segura a linha; contra um deck de controle mantenha **Ali Baba**, que transforma um ataque livre à barreira em cartas. Se você espera uma partida longa, manter o **Spellbook** é uma escolha razoável.

## Rodada a rodada

1. **Rodadas 1–3: trocar para cima.** Bagheera no centro, Musketeer à frente de um corpo de 1 ou 2 de Vida, Roo onde você talvez queira se mover depois. Cada luta que você vence sem perder o corpo é uma carta ganha.
2. **Rodadas 4–5: segurar uma linha.** Lancelot, depois jogue os personagens Bons no local dele: cada um chega +2⚔️/+2❤️ maior do que deveria. Boitata no cinco é um 5/5 que também devolve o dano dos feitiços inimigos dirigido às suas barreiras para as barreiras deles.
3. **Rodadas 6–7: a Lendária.** King Arthur é um 7/7 com Escudo, e a sua habilidade Ao revelar dá Escudo a tudo o que é Bom que você já tem no tabuleiro. Não o jogue em um tabuleiro vazio: o valor está nos Escudos, não no corpo.
4. **Dark Omen, sempre que fizer diferença.** Três de mana para destruir QUALQUER personagem é a resposta para a única carta que você não vence em uma luta: um corpo fortalecido, um Defensor na linha errada, uma Lendária inimiga.

## Duas notas do autor

- **A Fairy Godmother não é só uma finalizadora.** A página do deck lembra que ela também pode proteger Ali Baba, Shahrazad ou Cowardly Lion: +3❤️ no corpo certo significa que o motor sobrevive mais uma rodada.
- **O Dark Omen precisa ser preciso.** Com duas cópias e nenhuma outra remoção, gastar uma no alvo errado deixa a ameaça real viva.

## Matchups

Os dados da ranqueada não são públicos, então esta é a leitura que o OriginsMeta faz das listas, não um win rate.

- **Contra decks agressivos.** Cowardly Lion e Shahrazad juntos são a rede de segurança: o Defensor leva os golpes, a cura devolve o dano à barreira que passa. Não troque a Shield Maiden cedo por um corpo de 1 de Vida se um maior estiver vindo.
- **Contra decks de controle.** Ali Baba, e depois o segundo. A página do deck é clara: a lista quer continuar comprando enquanto o oponente cava atrás de respostas. Guarde o Dark Omen para a carta que fecha o jogo dele, não para a primeira coisa que ele jogar.
- **Contra decks que causam dano às suas barreiras com feitiços** ([Healing Healsing](/pt/decks/community/healing-healsing-9411) e outras listas com Boitata). Quem coloca o Boitata primeiro vira esse dano a seu favor: com duas cópias na lista, vale a pena segurar uma em vez de perder as duas na mesma luta.

## Os pontos fracos, nas palavras do autor

A página do deck lista três: **nenhuma remoção em área**, **o Dark Omen precisa ser usado com precisão** e **é preciso ler o plano do oponente**. Os dois primeiros vêm da lista: tirando o Dark Omen, não há nada que remova um personagem de uma vez, então um tabuleiro que você deixa crescer continua crescido. O terceiro é a parte honesta: este deck gera o seu valor uma troca de cada vez, e cada troca é uma decisão.

## Para onde ir depois

- A [página do deck](/pt/decks/community/king-of-value-trade-fd14) tem a lista completa com os gráficos, as notas do autor, “Abrir no deck builder” e o código do jogo (KGBLDC…).
- As estatísticas das cartas são as da Demo 2.0 com o [patch 0.7 de 29 de setembro de 2026](/pt/news/patch-0-7), que subiu Bagheera para dois de mana e Spellbook para quatro; os feitiços que o Spellbook adiciona não podem mais ser o próprio Spellbook.
`,
  },
  "dorothy-combo-guide": {
    title: "Dorothy Combo: como jogar o deck move depois do patch de 21 de setembro",
    metaTitle: "Guia do deck de Dorothy: Dorothy Combo",
    excerpt: "O deck move reconstruído em torno dos buffs de 21 de setembro: como Dorothy cresce, quais combos buscar, o mulligan e o que a lista ainda não consegue fazer.",
    faq: [
      {
        q: "Como Dorothy cresce?",
        a: "Dorothy pode se Mover a cada rodada e tem +1⚔️/+1❤️ por cada vez que um aliado se moveu nesta partida. O contador vale para a partida inteira, não para a rodada, então cada movimento que você faz em qualquer lugar a deixa maior.",
      },
      {
        q: "Quais combos de movimento o deck procura?",
        a: "Card Soldier, que invoca uma cópia de si no espaço anterior depois de se mover; Pegasus, que duplica o seu Poder depois de se mover; e Magic Carpet, que ao ser revelado move os seus outros aliados um espaço para a esquerda ou para a direita.",
      },
      {
        q: "O deck é competitivo?",
        a: "O autor o define como um deck para diversão e ladder e diz com franqueza que provavelmente ainda não está no nível do top tier, mas que depois dos buffs de 21 de setembro alguma coisa está se mexendo.",
      },
      {
        q: "Como experimento o deck?",
        a: "Abra a página do deck no OriginsMeta e aperte “Abrir no deck builder”, ou copie o código do jogo (KGBLDC…) no Origins.",
      },
    ],
    body: `
**Escrito antes do patch 0.7.** Este deck e este guia foram publicados antes do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026: a lista e o plano de jogo não são canônicos para a 0.7. As tabelas de cartas mostram os custos e as estatísticas de hoje.

## O deck em um parágrafo

**Dorothy Combo** é uma lista **combo** liderada por [Dorothy](/pt/cards/dorothy), publicada no OriginsMeta em 22 de setembro de 2026 por [Davdas](/pt/authors/davdas), membro da staff do site, e marcada para **ladder** e **diversão**. É o deck move, reconstruído depois do [patch da demo de 21 de setembro de 2026](/pt/news/demo-patch-notes-0921), que fortaleceu Dorothy, [Roo](/pt/cards/roo) e [Magic Carpet](/pt/cards/magic-carpet), entre outros. A avaliação do autor está na [página do deck](/pt/decks/community/dorothy-combo-7503) e a mantemos como é: provavelmente ainda não é uma lista de top tier, mas alguma coisa está se mexendo.

## A lista

Vinte e cinco cartas: a Lendária mais doze cartas jogadas em duas cópias cada.

| Carta | Custo | O que faz |
| --- | --- | --- |
| [Dorothy](/pt/cards/dorothy) ★ | 4 | 1/1; pode se Mover a cada rodada, e recebe +1⚔️/+1❤️ por cada vez que um aliado se moveu nesta partida |
| [Twister Toss](/pt/cards/twister-toss) | 1 | Feitiço: move um aliado para qualquer espaço; se já houver outra carta lá, as duas trocam de lugar |
| [Card Soldier](/pt/cards/card-soldier) | 2 | 3/1; depois de se mover, invoca uma cópia de si no seu espaço anterior |
| [Roo](/pt/cards/roo) | 2 | 2/4 com Mover |
| [Basilisk](/pt/cards/basilisk) | 2 | 1/2 com Toque mortífero |
| [Pegasus](/pt/cards/pegasus) | 3 | 2/4; depois de se mover, duplica o seu Poder |
| [Flying Monkey](/pt/cards/flying-monkey) | 3 | 4/1; Ao revelar move QUALQUER outro personagem para um espaço aleatório aqui |
| [Wicked Witch of the West](/pt/cards/wicked-witch-of-the-west) | 3 | 1/5; quando sobrevive a dano, adiciona um Flying Monkey à sua mão e se move um espaço para a esquerda |
| [Kanga](/pt/cards/kanga) | 3 | 2/3; antes do combate, os aliados que se moveram nesta rodada recebem +1⚔️/+1❤️ |
| [En Passant](/pt/cards/en-passant) | 3 | Feitiço: move um aliado e causa o Poder dele ao personagem à frente dele |
| [Spellbook](/pt/cards/spellbook) | 4 | Feitiço: daqui em diante, um feitiço aleatório na mão a cada rodada, descartado antes do combate |
| [Magic Carpet](/pt/cards/magic-carpet) | 4 | 4/4; Ao revelar move os seus outros aliados um espaço para a esquerda, ou um espaço para a direita |
| [Hare](/pt/cards/hare) | 5 | 4/1 com Primeiro golpe e Mover |

Nove personagens e três feitiços, e quase tudo ou se move ou premia um movimento.

## Como o deck vence

Dorothy é uma 1/1 que conta: **+1⚔️/+1❤️ por cada vez que um aliado se moveu nesta partida**. O contador não zera e conta os movimentos em qualquer lugar do tabuleiro, então um feitiço barato como [Twister Toss](/pt/cards/twister-toss) nunca é desperdiçado: é um de mana por um ponto permanente na sua Lendária. Jogada na quinta rodada depois de alguns movimentos, Dorothy chega como um corpo de verdade e continua crescendo a cada rodada, porque ela mesma se move.

Três combos são o sentido da lista:

1. **Card Soldier mais qualquer movimento.** Um 3/1 por dois de mana que deixa uma cópia de si para trás toda vez que se move: com Twister Toss ou Magic Carpet ele enche uma linha sozinho.
2. **Pegasus mais qualquer movimento.** Depois de se mover ele duplica o seu Poder: 2/4 vira 4/4, e com o +1⚔️ da Kanga antes do combate é um corpo de 5 de Poder pelo qual o oponente pagou três de mana.
3. **Magic Carpet como motor.** Ele move *todos* os seus outros aliados um espaço, na direção que você escolher: uma carta, vários gatilhos — uma cópia de Card Soldier, um Pegasus duplicado, pontos para Dorothy e o buff da Kanga em tudo o que se moveu.

## Mulligan

O autor não deixou nenhuma nota sobre o mulligan, então esta é a leitura do OriginsMeta. Mantenha os facilitadores de movimento baratos, **Twister Toss** e **Roo**, e um dos dois corpos que pagam você por se mover, **Card Soldier** ou **Pegasus**. Magic Carpet é a carta que você quer na quarta rodada, não na mão inicial. Sem nenhuma carta barata, uma mão que só começa na terceira rodada é lenta demais para um deck que quer o seu contador rodando desde a primeira.

## Rodada a rodada

1. **Rodadas 1–2: começar o contador.** Card Soldier ou Roo, depois Twister Toss nele. Cada movimento é um ponto permanente na Dorothy, mesmo quando o tabuleiro parece calmo.
2. **Rodada 3: escolher a linha.** Pegasus, a Witch ou Kanga. A [Wicked Witch of the West](/pt/cards/wicked-witch-of-the-west) é a que gera valor sozinha: uma 1/5 que sobrevive à maioria dos golpes, e cada vez que isso acontece você recebe um Flying Monkey na mão e ela se move um espaço para a esquerda — mais um ponto para Dorothy.
3. **Rodada 4: Magic Carpet.** Escolha a direção que empurra os seus Card Soldiers para um espaço livre e leva o Pegasus para uma luta que ele agora vai vencer.
4. **Da rodada 5 em diante: Dorothy, depois fechar.** Ela custa 4 desde o patch de 21 de setembro, mas a quarta rodada é do Carpet, e uma rodada depois ela chega com o contador mais alto. Hare tem Primeiro golpe e Mover: bate antes da resposta e mantém o contador andando. [Basilisk](/pt/cards/basilisk) com Toque mortífero é a resposta barata para um corpo grande demais para enfrentar de igual para igual, e En Passant transforma um Pegasus duplicado em remoção.

## O que o deck não consegue fazer

O autor lista dois pontos fracos, e são os honestos: **você pode acabar travado com as suas cartas** e **alguns combos não são consistentes**. Os dois vêm do mesmo lugar: o [Flying Monkey](/pt/cards/flying-monkey) move um personagem para um espaço *aleatório*, a cópia do Card Soldier vai para o espaço que ele deixou, e o Magic Carpet move tudo, inclusive os aliados que você queria onde estavam. Planeje a direção antes de jogar o Carpet, e não conte com um espaço específico estar livre.

## Matchups

Os dados da ranqueada não são públicos: esta é uma leitura das listas, não um win rate.

- **Contra decks agressivos.** A Witch e Roo seguram as primeiras linhas; o Toque mortífero do Basilisk responde ao primeiro corpo grande. Dorothy pode esperar: ela é melhor no fim, quando o contador está alto.
- **Contra decks de controle.** Este é o bom matchup. As cópias de Card Soldier e os Flying Monkeys continuam voltando, então uma única limpeza não esvazia o seu tabuleiro. Guarde um Twister Toss na mão depois de uma limpeza para reiniciar o contador.
- **Contra outros decks move.** Quem se move mais tem a Dorothy maior, mas o Flying Monkey move *qualquer* personagem: use-o para tirar um Pegasus inimigo do espaço em que ele ia duplicar.

## Para onde ir depois

- A [página do deck](/pt/decks/community/dorothy-combo-7503) tem a lista completa, os gráficos, as notas do autor, “Abrir no deck builder” e o código do jogo.
- Os buffs por trás desta lista estão nas [notas do patch de 21 de setembro](/pt/news/demo-patch-notes-0921); o MetaShifting acompanha cada mudança na [sua própria página](/pt/metashifting).
- As estatísticas das cartas são as da Demo 2.0 com o [patch 0.7 de 29 de setembro de 2026](/pt/news/patch-0-7), que subiu o Spellbook de três para quatro de mana e fez um rework do Twister Toss. A tabela descreve o Twister Toss a partir das notas do patch: ainda não lemos o novo texto dele no jogo.
`,
  },
  "trick-or-treat-legion-guide": {
    title: "The Trick-or-Treat Legion: como jogar o deck de Legion of the Dead",
    metaTitle: "Guia do deck de Legion of the Dead",
    excerpt: "A lista de Legion of the Dead feita para ser imprevisível: como funciona o tabuleiro de Zombies, o combo Golden Egg e Boogeyman, o mulligan e os matchups.",
    faq: [
      {
        q: "O que Legion of the Dead faz?",
        a: "É um feitiço Lendário de 7 de mana: enche o seu tabuleiro de Zombies (2⚔️/2❤️). Uma carta, todos os espaços livres ocupados.",
      },
      {
        q: "O que é o combo Golden Egg e Boogeyman?",
        a: "Boogeyman é um 7/7 de 4 de mana cuja habilidade Ao revelar destrói o aliado do seu local com o menor Poder, mesmo que seja ele. Golden Egg é um 0/1 que invoca um Golden Goose 5/5 no seu espaço quando morre: coloque o Egg primeiro, e a habilidade do Boogeyman o transforma em um Goose em vez de matar o seu próprio corpo.",
      },
      {
        q: "O que manter no mulligan?",
        a: "Bagheera e Thumbelina, de preferência junto com Bullseye. Também vale a pena manter na mão inicial o par Golden Egg mais Boogeyman.",
      },
      {
        q: "Por que o Mind Palace é importante?",
        a: "O deck esvazia a mão rápido: sem as duas cartas que o Mind Palace compra, você fica sem jogadas antes de a Lendária chegar.",
      },
    ],
    body: `
**Escrito antes do patch 0.7.** Este deck e este guia foram publicados antes do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026: a lista e o plano de jogo não são canônicos para a 0.7. As tabelas de cartas mostram os custos e as estatísticas de hoje.

## O deck em um parágrafo

**The Trick-or-Treat Legion** é uma lista **evil** liderada por [Legion of the Dead](/pt/cards/legion-of-the-dead), publicada no OriginsMeta em 22 de setembro de 2026 por [Davdas](/pt/authors/davdas), membro da staff do site, e marcada para **ladder**, **competitivo** e **torneio**. Circulam várias versões do deck de Legion; esta, nas palavras do autor, quer aumentar a imprevisibilidade, juntando cartas que "pregam uma peça" no tabuleiro do oponente a cada rodada. A lista completa e os gráficos estão na [página do deck](/pt/decks/community/the-trick-or-treat-legion-72c4).

## A lista

Vinte e cinco cartas: a Lendária mais doze cartas jogadas em duas cópias cada.

| Carta | Custo | O que faz |
| --- | --- | --- |
| [Legion of the Dead](/pt/cards/legion-of-the-dead) ★ | 7 | Feitiço Lendário: enche o seu tabuleiro de Zombies (2⚔️/2❤️) |
| [Bullseye](/pt/cards/bullseye) | 1 | Feitiço: 3 de dano a QUALQUER personagem |
| [Thumbelina](/pt/cards/thumbelina) | 1 | 2/2, sem habilidade |
| [Bagheera](/pt/cards/bagheera) | 2 | 1/1; Ao revelar em um espaço central, recebe +2⚔️/+2❤️ |
| [Morgiana](/pt/cards/morgiana) | 2 | 2/3; impede que TODAS as habilidades Ao revelar aconteçam no seu local |
| [Mind Palace](/pt/cards/mind-palace) | 3 | Feitiço: compra 2 cartas |
| [Asanbosam](/pt/cards/asanbosam) | 3 | 5/5; Ao revelar descarta uma carta aleatória de custo par |
| [Golden Egg](/pt/cards/golden-egg) | 3 | 0/1; Ao morrer invoca um Golden Goose (5/5) no seu espaço |
| [Flying Monkey](/pt/cards/flying-monkey) | 3 | 4/1; Ao revelar move QUALQUER outro personagem para um espaço aleatório aqui |
| [En Passant](/pt/cards/en-passant) | 3 | Feitiço: move um aliado e causa o Poder dele ao personagem à frente dele |
| [Boogeyman](/pt/cards/boogeyman) | 4 | 7/7; Ao revelar destrói o aliado aqui com o menor Poder, mesmo que seja ele |
| [White Queen](/pt/cards/white-queen) | 4 | 3/3; Ao revelar devolve QUALQUER personagem à mão do seu dono |
| [Impundulu](/pt/cards/impundulu) | 5 | 3/6; quando ataca, adiciona um Lightning Strike à sua mão, descartado antes do combate da próxima rodada |

Dez personagens e três feitiços. As três cartas baratas não estão ali para encher: este deck precisa que o tabuleiro seja seu antes de a Lendária chegar, porque os Zombies só ocupam os espaços *livres*.

## Como o deck vence

Três cartas fazem o dano — **Boogeyman, Asanbosam e Impundulu** — e todo o resto existe para protegê-las ou abrir caminho.

- **Boogeyman** é um 7/7 por quatro de mana, a melhor relação da lista, com um porém: ao ser revelado, ele destrói o aliado do seu local com o menor Poder, ele mesmo incluído. Coloque-o em uma linha vazia e ele se mata; coloque-o ao lado de um [Golden Egg](/pt/cards/golden-egg) e o Egg morre, deixando um Golden Goose 5/5 no seu espaço. É esse o combo que o autor aponta: duas cartas, um 7/7 e um 5/5.
- **Asanbosam** é um 5/5 por três, e ao ser revelado faz o oponente descartar uma carta aleatória de custo par.
- **Impundulu** transforma cada ataque em um [Lightning Strike](/pt/cards/lightning-strike) na sua mão: dano repetível, desde que você o gaste antes do próximo combate.

A **Lendária** fecha a partida em vez de começá-la: por sete de mana, *Enche o seu tabuleiro de Zombies* ocupa todos os espaços livres de uma vez. Ela rende mais na rodada depois de uma troca que esvaziou o seu lado, ou nos dois locais que você não estava disputando.

## As "travessuras"

[En Passant](/pt/cards/en-passant), [Flying Monkey](/pt/cards/flying-monkey) e [White Queen](/pt/cards/white-queen) são o que o autor quer dizer com pregar uma peça a cada rodada.

- **En Passant** move um aliado e causa o Poder dele ao personagem à frente dele: no Boogeyman ou em um Golden Goose são de cinco a sete de dano que também reposicionam.
- **Flying Monkey** move QUALQUER outro personagem para um espaço aleatório do seu local: tira um bloqueador inimigo da linha, ou traz o seu próprio corpo para onde está a luta. O espaço é aleatório, então é uma travessura, não um plano.
- **White Queen** devolve QUALQUER personagem à mão do seu dono: um finalizador inimigo sai por uma rodada, ou o seu próprio Golden Egg volta para ser jogado de novo ao lado de um segundo Boogeyman.

[Morgiana](/pt/cards/morgiana) é a discreta: no local dela nenhuma habilidade Ao revelar acontece, para nenhum dos dois lados. Jogue-a onde as habilidades Ao revelar do oponente mais machucam — mas lembre que ela para as suas também, inclusive a do Boogeyman.

## Mulligan

A nota do autor é curta e clara: **Bagheera e Thumbelina são começos perfeitos junto com Bullseye**, e **Golden Egg mais Boogeyman podem decidir a partida já da mão inicial**. Bagheera em um espaço central é um 3/3 por um de mana; Thumbelina é uma 2/2 simples, que por um de mana é presença no tabuleiro sem precisar pensar.

## Rodada a rodada

1. **Rodadas 1–2: ocupar espaço barato.** Bagheera no centro, Thumbelina onde você espera lutar, Bullseye em qualquer coisa com três de Vida.
2. **Rodada 3: a primeira ameaça.** Asanbosam como um 5/5, ou o Golden Egg na linha para onde o Boogeyman vai na rodada seguinte.
3. **Rodada 4: Boogeyman.** No Egg se você o tiver, senão ao lado do menor corpo que você pode se dar ao luxo de perder — e nunca em uma linha vazia.
4. **Rodadas 5–6: pressão e cartas.** Impundulu começa a produzir Strikes; Mind Palace reabastece a mão. O autor é explícito: sem o Mind Palace o deck fica sem cartas cedo demais.
5. **Rodada 7: Legion of the Dead.** Cada espaço livre vira um 2/2. Conte os espaços antes de jogá-la: depois de uma rodada em que você trocou muito, ela vale dois ou três corpos a mais.

## Matchups

Os dados da ranqueada não são públicos, então esta é a leitura que o OriginsMeta faz das listas.

- **Contra decks que jogam largo.** Os Zombies chegam nos espaços livres, então quanto mais largo o oponente estiver, menos a Lendária faz por você. Use Bullseye e Boogeyman para abrir o tabuleiro primeiro, e guarde o Flying Monkey para o corpo fortalecido.
- **Contra decks de controle.** O descarte do Asanbosam e os Strikes do Impundulu são a pressão que não depende de o tabuleiro sobreviver. Segure um Boogeyman depois de uma limpeza: um 7/7 por quatro é o jeito mais rápido de reconstruir.
- **Contra decks de Ao revelar** (por exemplo o [On Reveal Mid Range](/pt/decks/community/on-reveal-mid-range-772e), que repete cada habilidade Ao revelar com Mulan). É aqui que a Morgiana conquista o seu lugar: coloque-a no local em que eles estão empilhando habilidades, aceite que as suas habilidades Ao revelar também param ali, e lute nas outras duas linhas normalmente.

## Os pontos fracos, nas palavras do autor

Dois, da página do deck: **o Mind Palace é muito importante, para você não ficar sem cartas cedo demais**, e **o Boogeyman precisa de um alvo válido, ou da Morgiana**. Vale repetir o segundo: o corpo 7/7 só é bom se houver mais alguma coisa naquele local com menos Poder. O Golden Egg é o seguro mais barato, os Zombies da Lendária são o do fim da partida.

## Para onde ir depois

- A [página do deck](/pt/decks/community/the-trick-or-treat-legion-72c4) tem a lista com os gráficos, as notas do autor, “Abrir no deck builder” e o código do jogo (KGBLDC…).
- As estatísticas das cartas são as da Demo 2.0 com o [patch 0.7 de 29 de setembro de 2026](/pt/news/patch-0-7), que subiu Bagheera de um para dois de mana e Mind Palace de dois para três.
`,
  },
  "three-pigs-midrange-guide": {
    title: "3 Pigs Mid Range: como jogar o deck midrange de Three Not So Little Pigs",
    metaTitle: "Guia do deck de Three Not So Little Pigs",
    excerpt: "Plano de jogo, mulligan e rodada a rodada do 3 Pigs Mid Range, o deck midrange liderado por Three Not So Little Pigs, para ladder e competitivo.",
    faq: [
      {
        q: "Qual Lendária lidera o 3 Pigs Mid Range?",
        a: "Three Not So Little Pigs, um 3/3 de 7 de mana com Atropelar: a sua habilidade Ao revelar invoca um Not So Little Pig com Atropelar em cada um dos outros locais, então uma carta coloca um corpo em cada linha.",
      },
      {
        q: "O que manter no mulligan?",
        a: "Procure sempre Bagheera, Ali Baba, Big Bad Wolf e Rumple. Contra decks com cartas perigosas de 4 de Vida, como Van Helsing ou Glinda, mantenha também o Axe Throw.",
      },
      {
        q: "Como o deck fecha uma partida?",
        a: "Com En Passant, que move um aliado e acerta o personagem à frente dele; com Ellen Trechend, cujo Atropelar empurra o dano até a barreira; e com os Lightning Strikes que o Impundulu adiciona à sua mão toda vez que ataca.",
      },
      {
        q: "Como experimento o deck?",
        a: "Abra a página do deck no OriginsMeta e aperte “Abrir no deck builder”, ou “Copiar código do jogo” para colar o código do jogo (KGBLDC…) no Origins. O construtor de decks verifica a regra de 1 Lendária + 12 cartas × 2.",
      },
    ],
    body: `
**Escrito antes do patch 0.7.** Este deck e este guia foram publicados antes do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026: a lista e o plano de jogo não são canônicos para a 0.7. As tabelas de cartas mostram os custos e as estatísticas de hoje.

## O deck em um parágrafo

**3 Pigs Mid Range** é o segundo deck publicado no OriginsMeta por [Davdas](/pt/authors/davdas), membro da staff do site, em 15 de setembro de 2026. É uma lista **midrange** liderada por [Three Not So Little Pigs](/pt/cards/three-not-so-little-pigs), marcada para **ladder** e **competitivo**. A ideia é simples: ganhar o tabuleiro nas primeiras rodadas, ficar na frente em pelo menos um local e depois fechar com cartas que punem um oponente que se acha seguro atrás de uma barreira. A lista completa, os gráficos de composição e o código do jogo estão na [página do deck](/pt/decks/community/3-pigs-mid-range-6311); este guia explica como pilotá-lo. Um segundo guia trata de [matchups, interações-chave e Conquest](/pt/guides/three-pigs-midrange-matchups).

## A lista

Vinte e cinco cartas: a Lendária mais doze cartas jogadas em duas cópias cada.

| Carta | Custo | Papel |
| --- | --- | --- |
| [Three Not So Little Pigs](/pt/cards/three-not-so-little-pigs) ★ | 7 | Lendária: Atropelar, e Ao revelar invoca um Not So Little Pig com Atropelar em cada um dos outros locais |
| [Bagheera](/pt/cards/bagheera) | 2 | Carta de dois de mana que cresce quando jogada em um espaço central |
| [Rumple](/pt/cards/rumple) | 2 | 2/2 que dá a você +1 de mana na próxima rodada |
| [Axe Throw](/pt/cards/axe-throw) | 2 | 4 de dano a qualquer personagem |
| [Piglet](/pt/cards/piglet) | 2 | Buff Ao revelar para os outros aliados no seu local |
| [Mind Palace](/pt/cards/mind-palace) | 3 | Compra 2 cartas |
| [Big Bad Wolf](/pt/cards/big-bad-wolf) | 3 | 3/3 que recebe +1/+1 depois de cada combate |
| [Wicked Witch of the West](/pt/cards/wicked-witch-of-the-west) | 3 | 1/5: quando sobrevive a dano, adiciona um Flying Monkey à sua mão e se move um espaço para a esquerda |
| [En Passant](/pt/cards/en-passant) | 3 | Move um aliado e causa o Poder dele em dano ao personagem à frente dele |
| [Ali Baba](/pt/cards/ali-baba) | 3 | 2/3 que compra uma carta quando causa dano à barreira do oponente |
| [Frog Prince](/pt/cards/frog-prince) | 3 | Escolhe +3 de Poder ou +3 de Vida ao ser revelado |
| [Impundulu](/pt/cards/impundulu) | 5 | 3/6: toda vez que ataca, adiciona um Lightning Strike à sua mão |
| [Ellen Trechend](/pt/cards/ellen-trechend) | 8 | Atropelar; Ao revelar cresce por cada carta inimiga no seu local |

Nove personagens e três feitiços. Tudo menos Impundulu, os Pigs e Ellen Trechend custa três de mana ou menos, e é por isso que o autor chama a curva de "muito sólida": sempre há algo para jogar da primeira à quarta rodada.

## Como o deck vence

O plano, segundo a página do deck: tomar o controle do tabuleiro nas primeiras rodadas, ficar na frente em pelo menos um local e depois fechar com três cartas.

- **En Passant** move um aliado e causa dano igual ao Poder dele ao personagem à frente dele: abre caminho para um dos seus corpos grandes, ou transforma um Big Bad Wolf crescido em remoção.
- **Ellen Trechend** tem Atropelar e, ao ser revelada, cresce por cada carta inimiga no seu local: quanto mais o oponente tiver colocado em uma linha, mais forte ela bate, e o Atropelar manda o dano que sobra através do bloqueador até a barreira. A página do deck a chama de "uma finalizadora no limite do ilegal".
- **Impundulu**, se você jogou bem as primeiras rodadas, recompensa você com um Lightning Strike toda vez que ataca. Cada Strike precisa ser usado antes do próximo combate, senão é descartado, então reserve dois de mana a cada rodada para ele.

A Lendária é a ponte entre as duas fases. Por sete de mana, Three Not So Little Pigs coloca um porco com Atropelar em cada um dos outros dois locais com uma única carta, além do seu próprio corpo 3/3 com Atropelar. Jogada na curva, ela reabastece o tabuleiro inteiro na rodada antes de Ellen Trechend entrar em ação.

## Mulligan

Procure sempre **Bagheera, Ali Baba, Big Bad Wolf e Rumple**: eles dão um bom começo na curva e apoiam os porcos já em jogo. Contra decks com cartas perigosas de 4 de Vida, como Van Helsing ou Glinda, mantenha também o **Axe Throw**: ele causa exatamente quatro de dano a qualquer personagem. Ellen Trechend e Impundulu não são o que você quer na mão inicial: o deck os encontra depois com Mind Palace e Ali Baba.

## Rodada a rodada

1. **Rodadas 1–3: tomar o tabuleiro.** Bagheera em um espaço central, depois Rumple ou Piglet, depois uma carta de três. Rumple na segunda rodada significa quatro de mana na terceira, ou seja, um Wolf mais Bagheera ou uma Witch mais um feitiço. A Wicked Witch of the West é a muralha do deck: com cinco de Vida ela sobrevive à maioria dos golpes iniciais, e cada vez que isso acontece você recebe um Flying Monkey na mão e ela se desloca um espaço para a esquerda.
2. **Rodadas 4–6: escolher uma linha e pressionar.** Ali Baba quer acertar uma barreira: toda vez que acerta, você compra. Frog Prince é ou um 5/2 que troca para cima ou um 2/5 que segura uma linha; escolha depois de ver o que o oponente revelou. Impundulu desce no cinco e começa a produzir Lightning Strikes desde o primeiro ataque.
3. **Rodadas 7–8: os finalizadores.** Os Pigs no sete (ou no seis, com um Rumple na rodada anterior), Ellen Trechend no oito, no local onde o oponente tem mais cartas. Use En Passant na mesma rodada para mover uma ameaça para onde ela não é esperada, ou para tirar o único bloqueador do caminho.

## Manter a curva

A página do deck é clara sobre o principal ponto fraco: "sair da curva reduz muito o seu potencial". A lista não tem limpeza de tabuleiro nem nada que cure as suas barreiras, então cada rodada que você pula é uma rodada de graça para o oponente. Dois hábitos ajudam. Não guarde o Rumple para um turno "perfeito": o mana extra vale mais cedo. E não segure Lightning Strikes na mão esperando um alvo melhor: um Strike usado em uma barreira ainda são três de dano que você perderia de qualquer jeito.

## Para onde ir depois

- A [página do deck](/pt/decks/community/3-pigs-mid-range-6311) tem a lista com os gráficos de curva de mana, sagas e palavras-chave, as notas do autor, o botão “Abrir no deck builder” para o [deck builder](/pt/deck-builder) e o código do jogo (KGBLDC…) para colar no Origins.
- [Matchups, interações-chave e Conquest](/pt/guides/three-pigs-midrange-matchups) é a segunda parte deste guia.
- As estatísticas das cartas são as do patch da demo de 21 de setembro de 2026, verificadas no jogo em 22 de setembro, com as mudanças do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026: Bagheera agora custa dois de mana e Mind Palace três. Várias cartas desta lista foram mexidas na 0.6.2 e na 0.6.3, e em 21 de setembro o Frog Prince deixou de apagar os buffs que já existiam: confira o histórico de balanceamento em cada página de carta.
`,
  },
  "three-pigs-midrange-matchups": {
    title: "3 Pigs Mid Range: matchups, interações-chave e Conquest",
    metaTitle: "Matchups do deck de Three Not So Little Pigs",
    excerpt: "Segunda parte do guia de 3 Pigs Mid Range: as interações que ganham partidas, como jogar os principais matchups, os erros a evitar e o Conquest.",
    faq: [
      {
        q: "O que Ellen Trechend faz contra um tabuleiro largo?",
        a: "Ao revelar, ela cresce para cada carta inimiga no seu local e tem Atropelar, então uma linha que o oponente encheu vira o melhor alvo dela: o dano que passa da Vida do bloqueador vai para a barreira.",
      },
      {
        q: "Como jogar contra decks de Van Helsing?",
        a: "Guarde Axe Throw para Van Helsing, que tem quatro de Vida, pressione cedo, antes de Forbidden Knowledge chegar com oito de mana, e mire os Lightning Strikes nos personagens, e não nas barreiras, enquanto Boitata estiver no tabuleiro.",
      },
      {
        q: "Dá para jogar 3 Pigs Mid Range e Healing Healsing juntos no Conquest?",
        a: "Sim. Os dois decks têm Lendárias diferentes e só compartilham uma carta, Ali Baba, então têm doze cartas únicas de diferença, Lendária incluída: mais do que as 8 que a Crimson Cup exige entre cada par de decks.",
      },
    ],
    body: `
**Escrito antes do patch 0.7.** Este deck e este guia foram publicados antes do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026: a lista e o plano de jogo não são canônicos para o 0.7. As tabelas de cartas mostram os custos e as estatísticas de hoje.

## Antes de começar

Esta é a segunda parte do guia de **3 Pigs Mid Range**, o deck midrange liderado por [Three Not So Little Pigs](/pt/cards/three-not-so-little-pigs) que [Davdas](/pt/authors/davdas), do staff do OriginsMeta, publicou em 15 de setembro de 2026. A [primeira parte](/pt/guides/three-pigs-midrange-guide) cobre a lista, o plano de jogo, o mulligan e o jogo rodada a rodada. Aqui olhamos para as interações que decidem as partidas, para os matchups e para o formato em que o deck está marcado. As notas do autor estão na [página do deck](/pt/decks/community/3-pigs-mid-range-6311); a leitura dos matchups abaixo é do OriginsMeta, com base nos textos das cartas do patch 0.6.3; as mudanças do patch da demo de 21 de setembro e do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro, que levou Bagheera para dois de mana e Mind Palace para três, estão no [MetaShifting](/pt/metashifting).

## Cinco interações para conhecer

1. **Rumple antes dos finalizadores.** Rumple dá +1 de mana na próxima rodada. Jogado na rodada cinco, permite revelar Three Not So Little Pigs na rodada seis, uma rodada inteira antes de o oponente esperar uma carta de sete; jogado na rodada seis, coloca Ellen Trechend no tabuleiro na rodada sete.
2. **A Wicked Witch e o seu Flying Monkey.** A Witch é um 1/5: raramente morre com um único golpe, e cada vez que sobrevive a dano você recebe um [Flying Monkey](/pt/cards/flying-monkey) na mão e ela se move um espaço para a esquerda. A habilidade Ao revelar do Monkey move qualquer outro personagem, seu ou do oponente, para um espaço aleatório do local dele: use-a para tirar um bloqueador inimigo da linha por onde você está atropelando, ou para levar um Wolf para onde está a luta.
3. **En Passant num personagem que cresceu.** O feitiço move um aliado e causa ao personagem à frente dele um dano igual ao seu Poder. Num Big Bad Wolf que já lutou duas vezes, são cinco de dano e mais um reposicionamento; em Ellen Trechend, é remoção que também leva o Atropelar dela para onde a barreira está mais fraca. É também a resposta a um bloqueador estacionado na frente de um dos seus porcos.
4. **Os Lightning Strikes de Impundulu.** Cada ataque adiciona um [Lightning Strike](/pt/cards/lightning-strike), dois de mana para três de dano a qualquer personagem ou barreira, que precisa ser usado antes do próximo combate. São três de dano direcionados e repetíveis: o bastante para a maioria das cartas baratas do pool atual, ou um golpe direto numa barreira quando o tabuleiro já é seu.
5. **Piglet com os porcos.** A habilidade Ao revelar de Piglet dá um bônus aos outros aliados do seu local. Na rodada depois dos Pigs, um Piglet ao lado de um Not So Little Pig cria um corpo com Atropelar que bate mais forte: a página do deck observa que as cartas do mulligan "apoiam os porcos que já estão no tabuleiro".

## Matchups

Os dados da ranqueada ainda não são públicos, então o que vem a seguir é uma leitura das listas, não um win rate.

**Contra o controle de Van Helsing, por exemplo [Healing Healsing](/pt/decks/community/healing-healsing-9411), do mesmo autor.** É o matchup que a nota do mulligan tem em mente quando manda manter Axe Throw: Van Helsing é um 3/4, e quatro de dano o eliminam antes que os Tools dele comecem a chegar a cada combate. Pressione cedo, porque o deck de controle quer chegar a oito de mana para Forbidden Knowledge, que destrói todos os personagens do tabuleiro, os seus e os dele. Não coloque os Pigs e Ellen Trechend na mesma janela: guarde um finalizador para a rodada depois da limpeza. Enquanto Boitata estiver em jogo, o dano de feitiço às barreiras do oponente é causado às suas, então mire os Lightning Strikes nos personagens até ele sair.

**Contra tabuleiros largos (listas estilo Swarm, Mulan).** Quanto mais eles se espalham, maior fica Ellen Trechend: ela cresce para cada carta inimiga no seu local. Deixe a Witch como muro na linha que eles estão lotando, jogue Frog Prince como 2/5 em vez de 5/2 e guarde Axe Throw para a carta que dá bônus às outras. [Mulan](/pt/cards/mulan) repete as habilidades Ao revelar dos aliados dela, então é o alvo prioritário.

**Contra outros decks midrange (King Arthur, Robin Hood).** Quem decide é o tempo: quem sai da curva perde. Rumple rende o máximo aqui, e os Strikes de Impundulu fazem a diferença num tabuleiro equilibrado. A habilidade Ao revelar de [Robin Hood](/pt/cards/robin-hood) causa 2 de dano a todos os inimigos, o que mata Bagheera, Piglet e um Rumple recém-jogado, mas não a Witch nem um Frog Prince jogado como 2/5: com oito de mana, não sobrecarregue uma linha com personagens pequenos. [King Arthur](/pt/cards/king-arthur) dá Escudo aos personagens Bons, então guarde Axe Throw para depois que o Escudo tiver sido gasto.

## Erros a evitar

- **Jogar os Pigs como salvação.** A Lendária invoca porcos em espaços aleatórios dos outros locais: ela rende o máximo quando essas linhas já têm um Wolf ou uma Witch para lutar junto, não quando tudo já está perdido.
- **Segurar Rumple.** É um corpo 2/2 com um bônus, e o bônus vale mais entre as rodadas dois e seis.
- **Desperdiçar Lightning Strikes.** Eles são descartados antes do próximo combate: um Strike na barreira é melhor que um Strike perdido.
- **Esquecer os pontos fracos.** A página do deck lista quais são: nenhuma remoção em massa e nenhuma cura para as suas barreiras. Não entre numa corrida contra um deck que cura, a não ser que você já esteja na frente no tabuleiro.

## O Conquest e a etiqueta "competitivo"

O deck está marcado tanto para a ladder quanto para o jogo competitivo. O Conquest, o formato usado pela primeira vez na Big Bob's Playtest Battle, é também o formato da [Crimson Cup](/pt/news/crimson-cup-format-check-in) no Steam Next Fest: você inscreve três decks com Lendárias diferentes, com pelo menos 8 cartas únicas de diferença entre cada par de decks (regras anunciadas em 24 de setembro de 2026). 3 Pigs Mid Range combina naturalmente com a outra lista do mesmo autor, [Healing Healsing](/pt/decks/community/healing-healsing-9411): Lendárias diferentes, e a única carta que compartilham é Ali Baba, então têm doze cartas únicas de diferença, Lendária incluída. O [Deck builder](/pt/deck-builder) conta a diferença para você no modo torneio.
`,
  },
  "healing-healsing-guide": {
    title: "Healing Healsing: como jogar o deck de controle de Van Helsing",
    metaTitle: "Guia do deck de Van Helsing: Healing Healsing",
    excerpt: "Plano de jogo, mulligan e jogo rodada a rodada de Healing Healsing, o deck de controle de Van Helsing que cura, compra cartas e limpa o tabuleiro.",
    faq: [
      {
        q: "Qual Lendária lidera Healing Healsing?",
        a: "Van Helsing, um 3/4 de 4 de mana: antes de cada combate, ele adiciona Van Helsing's Tools à sua mão se você não a tiver, uma carta de \"Escolhe uma\" que joga Holy Water, Silver Bullet, Garlic ou Wooden Stake.",
      },
      {
        q: "O que manter no mulligan?",
        a: "Mantenha Ali Baba, Baby Bear, Scarecrow, Van Helsing e Spellbook; contra aggro, mantenha também Jill. Shahrazad e Phuong Hoang não são o que você quer nas primeiras rodadas.",
      },
      {
        q: "Quando jogar Forbidden Knowledge?",
        a: "Com oito de mana, ou seja, a partir da rodada oito ou nove, de preferência numa rodada em que o oponente revela primeiro: ele compromete as cartas dele e depois o feitiço destrói todos os personagens do tabuleiro.",
      },
      {
        q: "Como o deck vence se destrói o próprio tabuleiro também?",
        a: "Na vantagem de cartas: Spellbook, Scarecrow e Ali Baba mantêm a mão cheia, Baby Bear deixa Papa Bear para trás quando morre, Jekyll vira Hyde na mão, e as curas fazem Phuong Hoang crescer até o oponente ficar sem respostas.",
      },
    ],
    body: `
**Escrito antes do patch 0.7.** Este deck e este guia foram publicados antes do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026: a lista e o plano de jogo não são canônicos para o 0.7. As tabelas de cartas mostram os custos e as estatísticas de hoje.

## O deck em um parágrafo

**Healing Healsing** foi o primeiro deck publicado no OriginsMeta, em 15 de setembro de 2026, por [Davdas](/pt/authors/davdas), membro do staff do site. É uma lista de **controle** liderada por [Van Helsing](/pt/cards/van-helsing), marcada para a **ladder**. O plano é sobreviver às primeiras rodadas ganhando valor, curar o dano enquanto [Phuong Hoang](/pt/cards/phuong-hoang) cresce a cada cura e limpar o tabuleiro com [Forbidden Knowledge](/pt/cards/forbidden-knowledge) quando você tiver oito de mana. A lista completa, os gráficos de composição e o código do jogo estão na [página do deck](/pt/decks/community/healing-healsing-9411); este guia explica como pilotá-lo. Um segundo guia cobre [matchups, interações-chave e os erros a evitar](/pt/guides/healing-healsing-matchups).

## A lista

Vinte e cinco cartas: a Lendária mais doze cartas jogadas em duas cópias cada.

| Carta | Custo | Função |
| --- | --- | --- |
| [Van Helsing](/pt/cards/van-helsing) ★ | 4 | Lendária: antes do combate, adiciona Van Helsing's Tools à sua mão se você não a tiver |
| [Baby Bear](/pt/cards/baby-bear) | 2 | Causa dano aos inimigos que causam dano à sua barreira; Ao morrer, adiciona Papa Bear à sua mão |
| [Scarecrow](/pt/cards/scarecrow) | 2 | Ao revelar: compra uma carta |
| [Shahrazad](/pt/cards/shahrazad) | 2 | 1/4: cura 1 de dano da sua barreira cada vez que uma carta entra na sua mão |
| [Ali Baba](/pt/cards/ali-baba) | 3 | 2/3 que compra uma carta quando causa dano à barreira do oponente |
| [Jill](/pt/cards/jill) | 3 | 2/4: cura 2 de dano da sua barreira cada vez que recebe dano |
| [Spellbook](/pt/cards/spellbook) | 4 | Durante o resto da partida, um feitiço aleatório na mão no início de cada rodada |
| [Phuong Hoang](/pt/cards/phuong-hoang) | 4 | Renascimento, Mover; recebe +1/+1 cada vez que um aliado ou uma barreira é curado |
| [Jekyll](/pt/cards/jekyll) | 4 | Ao revelar, cura 3; se ainda estiver na mão depois do combate, vira Hyde, um 5/3 com Atropelar |
| [Searing Light](/pt/cards/searing-light) | 4 | 4 de dano a um inimigo e 4 de cura à sua barreira nesse local |
| [Boitata](/pt/cards/boitata) | 5 | 5/5: o dano de feitiços e habilidades às suas barreiras é causado à barreira do oponente em vez disso |
| [Tin Woodman](/pt/cards/tin-woodman) | 6 | Ao revelar, cura 8 de qualquer outro personagem ou barreira no seu local |
| [Forbidden Knowledge](/pt/cards/forbidden-knowledge) | 8 | Destrói todos os personagens |

Nove personagens e três feitiços; quase tudo custa entre dois e quatro, com Boitata, Tin Woodman e Forbidden Knowledge no topo. Três cartas compram, cinco curam, uma limpa o tabuleiro.

## Como o deck vence

O plano da página do deck, em quatro passos:

1. **Controlar as primeiras rodadas** ganhando valor rápido com Spellbook e Ali Baba.
2. **Chegar à rodada oito ou nove** e jogar Forbidden Knowledge para tomar a iniciativa. Tente jogá-lo numa rodada em que o oponente seja o primeiro a revelar, para que as cartas dele estejam no tabuleiro quando o feitiço for resolvido.
3. **Vencer na vantagem de cartas e no valor.** O deck do oponente deve ficar sem recursos enquanto você ainda tem cura suficiente para fazer o dano de Phuong Hoang crescer.
4. **Manter o controle.** As cartas extras permitem segurar o tabuleiro por muito tempo.

Dois motores fazem isso funcionar. O primeiro são as **cartas que entram na sua mão**: Van Helsing adiciona os Tools dele antes de cada combate, Spellbook adiciona um feitiço no início de cada rodada, Scarecrow e Ali Baba compram, e cada uma dessas cartas cura 1 graças a Shahrazad. O segundo é a **cura**: cada cura, do ponto único de Shahrazad aos oito de Tin Woodman, dá +1/+1 a Phuong Hoang. Uma Phuong que está no tabuleiro há algumas rodadas é a ameaça de verdade do deck, e ela também tem as palavras-chave Renascimento e Mover (veja a página da carta).

## Van Helsing's Tools

A Lendária em si é um 3/4 por quatro de mana. O que importa é a carta que ele adiciona antes de cada combate quando você ainda não a tem: [Van Helsing's Tools](/pt/cards/van-helsings-tools), grátis desde o patch 0.6.2, deixa você escolher um entre quatro efeitos.

- [Holy Water](/pt/cards/holy-water): remove todas as habilidades de qualquer personagem.
- [Silver Bullet](/pt/cards/silver-bullet): dano a qualquer personagem.
- [Garlic](/pt/cards/garlic): atordoa qualquer personagem.
- [Wooden Stake](/pt/cards/wooden-stake): destrói qualquer personagem ferido.

"Se você não a tiver" é a cláusula a lembrar: use os Tools a cada rodada, ou Van Helsing para de adicioná-los. Wooden Stake é a remoção de alvo único que, segundo a página do deck, falta na lista: fira um personagem com o dano de Baby Bear, com Searing Light ou com a Silver Bullet e depois crave a estaca.

## Mulligan

Mantenha **Ali Baba, Baby Bear, Scarecrow, Van Helsing e Spellbook**. Contra decks agressivos, mantenha também **Jill**: ela cura 2 de dano da sua barreira cada vez que recebe dano. Shahrazad e Phuong Hoang não servem nas primeiras rodadas: são a recompensa, não a preparação, então devolva-as.

## Rodada a rodada

1. **Rodadas 1–3: preparação.** Scarecrow ou Baby Bear na dois, Spellbook ou Ali Baba na três. Spellbook é a melhor jogada da rodada três: a partir daí, você começa cada rodada com um feitiço a mais, e Shahrazad transforma cada um deles numa cura.
2. **Rodadas 4–5: Van Helsing e as primeiras curas.** Van Helsing na quatro, ou Jekyll para curar um personagem ou uma barreira com dano. Phuong Hoang entra assim que houver pelo menos uma fonte de cura no tabuleiro. Boitata na cinco: a partir daí, o dano de feitiços e habilidades a qualquer uma das suas barreiras é causado à barreira do oponente nesse local em vez disso.
3. **Rodadas 6–7: estabilizar.** Os oito pontos de cura de Tin Woodman na barreira sob pressão, Searing Light na maior ameaça, os Tools a cada combate.
4. **Rodada 8 ou 9: Forbidden Knowledge.** Tudo morre, dos dois lados. O seu lado perde menos: Baby Bear deixa Papa Bear na sua mão, um Jekyll guardado na mão já virou Hyde, os Tools voltam antes do próximo combate, e você comprou mais cartas que o oponente a partida toda.

## Para onde ir depois

- A [página do deck](/pt/decks/community/healing-healsing-9411) tem a lista com os gráficos da curva de mana e das palavras-chave, as notas do autor, o botão "Abrir no Deck builder" para o [Deck builder](/pt/deck-builder) e o código do jogo (KGBLDC…) para colar no Origins.
- [Matchups, interações-chave e erros a evitar](/pt/guides/healing-healsing-matchups) é a segunda parte deste guia.
- As estatísticas das cartas são as do patch da demo de 21 de setembro de 2026, conferidas no jogo em 22 de setembro, com as mudanças do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026: Spellbook agora custa quatro de mana, e os feitiços que ele adiciona não podem mais ser Spellbook. Scarecrow, Van Helsing's Tools e outras cartas desta lista mudaram nos patches 0.6.2 e 0.6.3, e desde 21 de setembro Wooden Stake também pode mirar personagens com a Vida cheia: veja o histórico de balanceamento na página de cada carta.
`,
  },
  "healing-healsing-matchups": {
    title: "Healing Healsing: matchups, interações-chave e erros a evitar",
    metaTitle: "Matchups de Healing Healsing, deck Van Helsing",
    excerpt: "Segunda parte do guia de Healing Healsing: as interações de cura e compra de cartas, os principais matchups, os erros que perdem para o aggro, o Conquest.",
    faq: [
      {
        q: "Qual é a interação mais forte de Healing Healsing?",
        a: "Shahrazad com Van Helsing e Spellbook: os Tools antes de cada combate e o feitiço no início de cada rodada curam 1 cada um graças a Shahrazad, e cada cura dá +1/+1 a Phuong Hoang.",
      },
      {
        q: "Como jogar contra 3 Pigs Mid Range?",
        a: "Não encha uma linha: Ellen Trechend cresce para cada carta inimiga no seu local. Guarde Boitata para os Lightning Strikes, cure o dano de Atropelar dos porcos e guarde Forbidden Knowledge para a rodada depois que os Pigs entrarem.",
      },
      {
        q: "O que faz perder partidas com este deck?",
        a: "Jogar Forbidden Knowledge cedo demais, deixar Van Helsing's Tools parada na mão, de modo que ele para de adicioná-la, e jogar Phuong Hoang antes de haver algo para curar.",
      },
    ],
    body: `
**Escrito antes do patch 0.7.** Este deck e este guia foram publicados antes do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026: a lista e o plano de jogo não são canônicos para o 0.7. As tabelas de cartas mostram os custos e as estatísticas de hoje.

## Antes de começar

Esta é a segunda parte do guia de **Healing Healsing**, o deck de controle de Van Helsing que [Davdas](/pt/authors/davdas), do staff do OriginsMeta, publicou em 15 de setembro de 2026 como o primeiro deck da comunidade do site. A [primeira parte](/pt/guides/healing-healsing-guide) cobre a lista, o plano de jogo, o mulligan e o jogo rodada a rodada. Aqui olhamos para as interações que decidem as partidas, para os matchups e para os erros que mais custam caro. As notas do autor estão na [página do deck](/pt/decks/community/healing-healsing-9411); a leitura dos matchups abaixo é do OriginsMeta, com base nos textos das cartas do patch 0.6.3; as mudanças do patch da demo de 21 de setembro e do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro, que levou Spellbook para quatro de mana, estão no [MetaShifting](/pt/metashifting).

## Cinco interações para conhecer

1. **Shahrazad e tudo o que põe uma carta na sua mão.** [Shahrazad](/pt/cards/shahrazad) cura 1 de dano da sua barreira no local dela sempre que uma carta entra na sua mão. Van Helsing adiciona os Tools antes de cada combate, Spellbook adiciona um feitiço no início de cada rodada, Scarecrow e Ali Baba compram, a morte de Baby Bear adiciona Papa Bear. Com Shahrazad e Van Helsing no tabuleiro, você cura em todas as rodadas sem gastar uma carta.
2. **Cada cura alimenta Phuong Hoang.** [Phuong Hoang](/pt/cards/phuong-hoang) recebe +1/+1 sempre que um aliado ou uma barreira é curado. A habilidade Ao revelar de Tin Woodman é uma cura de oito pontos, então é um +1/+1; as muitas curas pequenas de Shahrazad valem mais para Phuong do que uma grande.
3. **Jekyll e Hyde.** A habilidade Ao revelar de [Jekyll](/pt/cards/jekyll) cura 3 de qualquer outro personagem ou barreira no local dele. Guardado na mão depois do combate, ele vira [Hyde](/pt/cards/hyde), um 5/3 com Atropelar, e um Hyde guardado na mão volta a ser Jekyll: a mesma carta é um curador ou um finalizador, dependendo de quando você a joga.
4. **Boitata contra o burn.** Se um feitiço ou habilidade fosse causar dano a uma das suas barreiras, [Boitata](/pt/cards/boitata) causa esse dano à barreira do oponente nesse local em vez disso. Contra decks que fecham as partidas com Lightning Strike ou Searing Light, Boitata transforma o alcance deles no seu.
5. **A família de Baby Bear.** [Baby Bear](/pt/cards/baby-bear) causa dano a qualquer inimigo que cause dano à sua barreira no local dele e, quando morre, adiciona [Papa Bear](/pt/cards/papa-bear) à sua mão; Papa Bear bate mais forte e adiciona [Mama Bear](/pt/cards/mama-bear) quando morre, e Mama Bear destrói os inimigos que causam dano à sua barreira. Três corpos por uma carta de dois de mana, e a coisa ideal para ter no tabuleiro quando Forbidden Knowledge é resolvido.

## Matchups

Os dados da ranqueada ainda não são públicos, então o que vem a seguir é uma leitura das listas, não um win rate.

**Contra 3 Pigs Mid Range (o [outro deck](/pt/decks/community/3-pigs-mid-range-6311) do mesmo autor) e outras listas midrange.** O finalizador deles, Ellen Trechend, cresce para cada carta inimiga no local dela: espalhe os seus personagens em vez de empilhar uma linha. Os Lightning Strikes de Impundulu são exatamente o motivo de ter Boitata. Axe Throw causa quatro de dano, exatamente a Vida de Van Helsing: espere que ele seja respondido e não conte só com ele para a remoção. Os Pigs entram com sete de mana e enchem todas as linhas de Atropelar: é para essa rodada que você guarda Forbidden Knowledge, uma rodada depois.

**Contra aggro e decks que se espalham.** É o matchup que a nota do mulligan tem em mente quando manda manter Jill: cada vez que recebe dano, ela cura 2 da sua barreira. Baby Bear pune cada atacante que passa, Jekyll cura o que importa, os oito pontos de Tin Woodman restauram uma barreira. Não persiga os personagens deles um a um com os Tools; estabilize a barreira, chegue a oito de mana e deixe Forbidden Knowledge levar o tabuleiro inteiro.

**Contra outros decks de controle.** Quem decide é a vantagem de cartas, e este deck compra mais do que a maioria: Spellbook é a carta a proteger e a jogar primeiro. Guarde Hyde para uma linha que ficou vazia e reserve Holy Water para uma Lendária cuja habilidade carrega o deck adversário, como [Mulan](/pt/cards/mulan), que repete as habilidades Ao revelar dos aliados dela, ou a [Queen of Hearts](/pt/cards/queen-of-hearts), que repete as habilidades Ao morrer deles.

## Erros a evitar

- **Jogar Forbidden Knowledge cedo demais.** O conselho da página do deck é esperar uma rodada em que o oponente revele primeiro, para que as cartas dele estejam no tabuleiro quando o feitiço for resolvido. Uma limpeza numa linha vazia são oito de mana jogados fora.
- **Deixar os Tools parados na mão.** Van Helsing só os adiciona se você não os tiver. Use-os a cada combate, mesmo num alvo pequeno.
- **Phuong Hoang antes das curas.** Um 2/3 por quatro de mana sem nada que o faça crescer é uma carta fraca; a mesma carta, depois de Shahrazad e Spellbook em campo, é a condição de vitória. A nota do mulligan a coloca, junto com Shahrazad, entre as cartas a não manter na mão inicial.
- **Tratar a compra de cartas como um luxo.** A página do deck avisa que "não encontrar Forbidden Knowledge quando você precisa pode ser muito doloroso": Scarecrow, Ali Baba e Spellbook são a forma de encontrá-lo, então jogue-os cedo mesmo quando o tabuleiro não pede.

## Conquest

O deck está marcado só para a ladder, mas cabe numa seleção de Conquest: uma Lendária diferente da de 3 Pigs Mid Range e uma única carta em comum, Ali Baba, então as duas listas têm doze cartas únicas de diferença, Lendária incluída: mais do que as 8 que a [Crimson Cup](/pt/news/crimson-cup-format-check-in) exige entre cada par de decks. O [Deck builder](/pt/deck-builder) conta a diferença no modo torneio.
`,
  },
  "roadmap-and-dates": {
    title: "Roadmap e datas: da demo ao lançamento",
    metaTitle: "Origins TCG: roadmap e datas de lançamento",
    excerpt: "Todas as datas confirmadas de Origins TCG, do primeiro post no Steam à atualização Demo 2.0 e à Crimson Cup do Next Fest, mais o que está previsto para 2027.",
    faq: [
      {
        q: "Quando Origins TCG chega ao Steam?",
        a: "A página da loja do Steam indica o lançamento para o quarto trimestre de 2026, sem data mais precisa. A demo recebeu a primeira grande atualização em 21 de setembro de 2026, e o modo Competitivo (a ranqueada) é ativado com o Steam Next Fest, de 19 a 26 de outubro de 2026.",
      },
      {
        q: "Quando é a Crimson Cup?",
        a: "De 19 a 25 de outubro de 2026, durante o Steam Next Fest: cinco classificatórias regionais de 19 a 22, depois os playoffs no dia 24 e as finais no dia 25. A premiação vale 10.000 dólares e inclui uma carta promo 1/1 exclusiva.",
      },
      {
        q: "Existe uma versão mobile de Origins TCG?",
        a: "Ainda não. A versão mobile e a abertura de pacotes no celular estão anunciadas para 2027. O jogo teve um soft launch na App Store em algumas regiões em novembro de 2025, antes de o estúdio levar a troca de cartas para o Steam.",
      },
      {
        q: "Quando saiu a demo gratuita?",
        a: "Em 15 e 16 de julho de 2026, no Steam, com itens colecionáveis exclusivos para quem jogasse a demo. A ladder ranqueada veio depois, com o patch 0.6.1 de 14 de agosto de 2026.",
      },
    ],
    body: `
## Antes da demo

- **Agosto de 2025.** Koin Games e Immutable anunciam o "Project O", um TCG competitivo feito para mobile com posse real das cartas.
- **Novembro de 2025.** Soft launch na App Store em algumas regiões (versão 0.1.0).
- **Início de 2026.** O estúdio leva a troca de cartas para o mercado do Steam e abandona o modelo on-chain independente.
- **Março de 2026.** O CEO é filmado com cartas físicas de metal. Nenhum produto nem data foram anunciados.

## 2026, mês a mês

| Data | O que aconteceu |
| --- | --- |
| 6 de maio | A página do Steam entra no ar, a lista de desejos abre |
| 3 de junho | O Discord oficial abre para todos |
| 15–16 de julho | Demo gratuita no Steam com itens colecionáveis exclusivos |
| 21 de julho | Primeiros números: mais de 1.000 jogadores, mais de 13.000 partidas, 1h51min de tempo de jogo mediano |
| 22 de julho | AMA com o CEO Tim Jooste e o chefe de design Kevin Lambert |
| 24 de julho | Primeiro torneio da demo |
| 24–26 de julho | Origins na Card Party, em Fort Lauderdale |
| 7 de agosto | Primeiro playtest da "Demo 2.0": 5 decks novos, mais de 70 cartas, construção de decks |
| 14 de agosto | [Patch 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414): ladder ranqueada |
| 19 de agosto | AMA do Creator Program |
| 21 de agosto | [Patch 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961): 23 cartas rebalanceadas |
| 27 de agosto | [Patch 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) |
| 28 de agosto | Big Bob's Playtest Battle, primeiro torneio de Conquest, mais de 130 inscritos |
| 9 de setembro | [Anunciado o torneio do Next Fest](https://store.steampowered.com/news/app/4429430/view/1843481262690278) |
| 10 de setembro | AMA do Kickstarter no Discord oficial: Alpha Edition, raridades, gradação, trocas, desconto VIP |
| 17 de setembro | [O CEO da Koin Games dá a data do Kickstarter](https://x.com/TimothyJooste/status/2100700207285445011): a campanha da Alpha Edition abre em 27 de outubro |
| 21 de setembro | [Primeira grande atualização da demo](https://store.steampowered.com/news/app/4429430/view/1844115010502611): nova interface e novo tabuleiro, tutorial para colecionadores, pacotes de teste, mudanças de balanceamento, lista provisória das cartas da Crimson Cup |
| 24 de setembro | [Regras da Crimson Cup](/pt/news/crimson-cup-format-check-in): Conquest com três decks, check-in |
| 29 de setembro | [Patch 0.7](/pt/news/patch-0-7), o último patch de balanceamento antes da Crimson Cup: rework de Twister Toss, Bagheera, Mind Palace e Spellbook custam um a mais, os locais ganham raridade, 13 idiomas |

## O que vem a seguir

- **19–26 de outubro de 2026.** Steam Next Fest: o modo Competitivo (a ranqueada) é ativado na demo, com recompensas exclusivas da ranqueada.
- **19–25 de outubro de 2026.** A Crimson Cup, o torneio do Steam Next Fest: cinco classificatórias regionais de 19 a 22, depois os playoffs e as finais. Uma premiação de 10.000 dólares, incluindo uma carta promo 1/1 exclusiva.
- **27 de outubro de 2026.** O Kickstarter da Alpha Edition, anunciado pelo CEO da Koin Games em 17 de setembro; o menu principal da demo também o mostra como "Coming soon – Oct 27". Tudo sobre ele no nosso [guia do Kickstarter](/pt/guides/origins-tcg-kickstarter).
- **Quarto trimestre de 2026.** Lançamento no Steam, segundo a página da loja, que não dá uma data mais precisa.
- **2027.** Versão mobile e abertura de pacotes no celular. Nos AMAs, a equipe descreveu um lançamento completo com o elenco inteiro de cartas Lendárias, incluindo King Arthur, Dracula, Winnie-the-Pooh, Alice, Beowulf, Cinderella, Sweeney Todd, Frankenstein e Sherlock Holmes.

As datas vêm dos posts oficiais no Steam, do Discord do estúdio e, para o Kickstarter, do post do CEO da Koin Games e do próprio menu da demo. Atualizamos esta página quando elas mudam.
`,
  },
  "collector-economy": {
    title: "Duas formas de colecionar: como funciona a economia de Origins",
    metaTitle: "Origins TCG: como funciona a economia de coleção",
    excerpt: "As cartas competitivas são grátis. As de coleção são limitadas, gradadas e negociáveis no Steam. Veja o que está confirmado e o que ainda não está.",
    faq: [
      {
        q: "As cartas de coleção deixam um deck mais forte?",
        a: "Não. Toda carta competitiva é obtida no jogo, e as versões de coleção são edições limitadas das mesmas cartas: são numeradas, gradadas digitalmente e negociáveis, mas funcionam exatamente igual.",
      },
      {
        q: "O que é a Alpha Edition?",
        a: "Myths & Legends: Alpha Edition é a primeira edição de coleção, vendida só em pré-venda: pacotes de boosters com cinco cartas, caixas de 24 pacotes e cases de seis caixas, em sete níveis de raridade, da Collectible Card (em todo pacote) à Storybook (1 a cada 1.200 pacotes), segundo a página oficial de pré-cadastro. Quando a tiragem acaba, nenhuma caixa Alpha a mais é produzida.",
      },
      {
        q: "Onde dá para negociar as cartas de Origins?",
        a: "No Mercado da Comunidade Steam e nos marketplaces conectados, quando o jogo completo for lançado. Os colecionáveis que você ganha hoje na demo passam a ser negociáveis nesse momento.",
      },
      {
        q: "O que é um God pack?",
        a: "Um pacote raro em que todas as cartas são Lendárias ou melhores. As versões de coleção também têm uma nota: na Card Party de julho de 2026, a equipe deu um Slab a quem tirasse uma Alternate Art 10/10.",
      },
    ],
    body: `
## A divisão

Origins separa duas coisas que a maioria dos jogos de cartas mistura:

1. **Jogar.** Toda carta competitiva é obtida no jogo. Nada do que você compra deixa o seu deck mais forte.
2. **Colecionar.** Versões em edição limitada das cartas existem em tiragens numeradas, vêm **gradadas digitalmente** e podem ser compradas, vendidas e trocadas com outros jogadores.

As próprias telas de carregamento do estúdio falam em "real collecting in digital" e "two ways to collect".

## O que está confirmado

- **Cartas gradadas.** As versões de coleção têm uma nota; na Card Party de julho, a equipe deu um Slab a quem tirasse uma **Alternate Art 10/10**. Notas mais baixas e séries diferentes existem e valem quantias diferentes.
- **God packs.** Pacotes raros em que todas as cartas são Lendárias ou melhores.
- **Alpha Edition.** A primeira edição de coleção, "Myths & Legends: Alpha Edition", é vendida só em pré-venda: pacotes de boosters com cinco cartas, caixas de 24 pacotes e cases de seis caixas, com sete níveis de raridade, da Collectible Card (em todo pacote) à Storybook (1 a cada 1.200 pacotes), segundo a [página oficial de pré-cadastro](https://founder.origins-tcg.com). Quando a tiragem acaba, nenhuma caixa Alpha a mais é produzida. O set Alpha foi um dos temas do AMA do Kickstarter de 10 de setembro de 2026 no Discord oficial.
- **Trocas no Steam.** Cartas e produtos lacrados serão negociados no Mercado da Comunidade Steam e nos marketplaces conectados quando o jogo completo for lançado. Os colecionáveis da demo ganhos hoje passam a ser negociáveis nesse momento.
- **Mobile depois.** A abertura de pacotes no celular está prevista para 2027.

## O que ainda não está confirmado

- Preços em euros de pacotes e caixas fora da pré-venda da Alpha.
- Taxas de marketplace além das taxas padrão do Steam.
- Se as cartas físicas de metal, mostradas pelo CEO em março de 2026, um dia serão vendidas.

## Por que isso importa para o meta

Como as cartas de coleção são cosméticas, uma tier list só precisa se preocupar com a carta em si, nunca com a versão. O OriginsMeta vai acompanhar os preços do Mercado do Steam desde o primeiro dia em que os itens forem listados, para que colecionar tenha os mesmos dados que jogar.
`,
  },
  "steam-next-fest-2026": {
    title: "Origins TCG no Steam Next Fest 2026: Demo 2.0, datas e o torneio",
    metaTitle: "Origins TCG no Steam Next Fest 2026: datas",
    excerpt: "Origins TCG no Steam Next Fest, de 19 a 26 de outubro de 2026: o modo Competitivo na demo, a Crimson Cup de 19 a 25 de outubro, prêmios e como se inscrever.",
    faq: [
      {
        q: "Quando é o Steam Next Fest de outubro de 2026?",
        a: "De segunda-feira, 19 de outubro, às 10:00 no horário do Pacífico (13:00 no horário do leste dos EUA, 14:00 em Brasília, 18:00 no Reino Unido, 19:00 na Europa central), até segunda-feira, 26 de outubro de 2026. Origins TCG participa com a sua demo gratuita, atualizada em 21 e 29 de setembro, e o modo Competitivo (a ranqueada) é ativado com o festival.",
      },
      {
        q: "Quando é o torneio de Origins TCG?",
        a: "De 19 a 25 de outubro de 2026: cinco classificatórias de 512 vagas entre os dias 19 e 22 (duas AMER, duas EMEA, uma APAC), depois os playoffs no dia 24 e as finais no dia 25.",
      },
      {
        q: "Posso entrar numa classificatória morando no Brasil ou na Europa?",
        a: "Sim. A Koin Games diz que você pode entrar em qualquer uma das classificatórias, não importa onde more, mas pede que você se inscreva só naquelas em que realmente puder jogar.",
      },
      {
        q: "Custa alguma coisa?",
        a: "Não. A demo é gratuita no Steam e a inscrição no torneio é feita no Discord oficial. Origins TCG é free-to-compete: toda carta competitiva é obtida jogando.",
      },
      {
        q: "O que é o formato Conquest?",
        a: "Na Crimson Cup, cada jogador envia três decks, com pelo menos 8 cartas únicas de diferença entre quaisquer dois deles. As decklists ficam ocultas até o top 4: quando você bane um dos decks do oponente, só vê a Lendária dele. Nas partidas melhor de cinco não há ban e você precisa vencer com os três decks. A Koin Games testou o formato pela primeira vez na Big Bob's Playtest Battle, em 28 de agosto.",
      },
    ],
    body: `
## As duas datas para lembrar

- **Steam Next Fest, edição de outubro de 2026: 19–26 de outubro.** O [festival de demos jogáveis da Valve](https://store.steampowered.com/sale/nextfest) vai de segunda-feira, 19 de outubro, às 10:00 no horário do Pacífico (13:00 no horário do leste dos EUA, 14:00 em Brasília, 18:00 no Reino Unido, 19:00 na Europa central), até segunda-feira, 26 de outubro. [Origins TCG](https://store.steampowered.com/app/4429430/Origins_TCG/) participa com a sua demo gratuita, que recebeu a primeira grande atualização em 21 de setembro: com o festival, a Koin ativa o **modo Competitivo**, a ranqueada, com recompensas exclusivas da ranqueada.
- **Torneio de Origins TCG: 19–25 de outubro.** A Koin Games o chama de "o nosso maior torneio até hoje": um evento de vários dias que segue Classificação → Playoffs → Finais, todo online e dentro do jogo.

## O que a demo leva ao festival

A grande atualização da demo testada em três playtests fechados em agosto (patches [0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414), [0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) e [0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184), todos acompanhados no nosso [MetaShifting](/pt/metashifting)) chegou antes, em [21 de setembro de 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611): nova interface e novo tabuleiro, um tutorial para colecionadores, pacotes de teste para abrir, novas falas, mudanças de balanceamento e a lista provisória das cartas da Crimson Cup, para você já montar decks para o torneio. O progresso é herdado da demo ou do playtest, o que estiver mais adiantado.

Os decks, as cartas e os chefes dos playtests agora estão na demo gratuita, e a construção de decks também: cada um monta o próprio deck de 25 cartas (uma Lendária mais doze cartas, cada uma jogada em duas cópias). O nosso [banco de dados de cartas](/pt/cards) tem as 122 cartas conferidas no jogo em 22 de setembro.

Com o início do Steam Next Fest, a Koin ativa o **modo Competitivo**, "que virá com recompensas exclusivas da ranqueada" (post no Steam de 21 de setembro). Os playtests tinham divisões até Grandmaster e um ranking mundial: o que está confirmado até agora está no nosso [guia da ranqueada de Origins TCG](/pt/guides/origins-tcg-ranked). Vamos publicar cada mudança no dia em que ela chegar.

## O torneio, passo a passo

1. **Classificatórias, 19–22 de outubro.** São cinco, com 512 vagas cada e 32 classificados em cada uma: AMER no dia 19 às 19:00 EST, EMEA no dia 20 às 19:00 CEST, AMER no dia 21 às 21:00 EST, APAC no dia 22 às 19:00 SGT e EMEA no dia 22 às 19:00 CEST, mais 96 wild cards. A classificatória AMER do dia 19 e a EMEA do dia 22 foram adicionadas em 5 de outubro, quando a arte oficial do calendário também passou a AMER do dia 21 para as 21:00 EST, com 32 classificados em vez de 64, e as wild cards de 128 para 96 ([o nosso artigo](/pt/news/crimson-cup-prizepool-qualifiers)). Nas palavras da Koin, "você pode entrar em QUALQUER uma das classificatórias, não importa onde more": escolha a que tiver o horário que serve para você e se inscreva só nas que vai jogar de verdade; dá para entrar em mais de uma.
2. **Playoffs e finais, 24–25 de outubro.** A fase de playoffs tem 256 vagas no dia 24 (10:00 EST / 16:00 CEST / 22:00 SGT) e quatro jogadores saem dela para as finais do dia 25 às 10:00 EST (15:00 CET / 22:00 SGT). Atenção aos relógios: a Europa sai do horário de verão na noite do dia 24, enquanto os Estados Unidos ficam nele até 1º de novembro, então o mesmo horário de início da costa leste cai uma hora mais cedo nos relógios europeus no domingo. Criadores de conteúdo recebem convites wildcard direto para os playoffs (pergunte no Discord).
3. **Formato.** Oficial, pelos anúncios de 9 e 24 de setembro: **Conquest com três decks**, com pelo menos 8 cartas únicas de diferença entre cada par de decks; as decklists ficam ocultas até o top 4, então, quando você bane um dos decks do oponente, só vê a Lendária dele. **Partidas melhor de três (MD3), grande final melhor de cinco (MD5)**: na melhor de cinco não há ban e você precisa vencer com os três decks. Os detalhes estão no [nosso artigo sobre as regras](/pt/news/crimson-cup-format-check-in).
4. **Check-in.** Abre duas horas antes de cada classificatória e fecha cinco minutos antes do início, junto com o envio dos decks; depois, uma janela curta por ordem de chegada dá as vagas livres a quem está na lista de espera. Sem check-in você não joga: para a classificatória EMEA das 19:00 CEST, faça o check-in entre 17:00 e 18:55.
5. **Qual versão.** O torneio é jogado na demo principal, só com as cartas disponíveis nela: treine nela. O playtest vai receber mais atualizações e vai ser diferente da versão do torneio. O último patch de balanceamento antes do torneio, o [patch 0.7](/pt/news/patch-0-7), chegou em 29 de setembro de 2026, três semanas antes da primeira classificatória.
6. **Prêmios.** **Uma premiação de 10.000 dólares**, nas palavras da Koin, dividida entre dinheiro, colecionáveis e cartas promo exclusivas. A divisão saiu em 5 de outubro: o campeão leva uma carta promo 1/1 de Dracula, duas cases de caixas de boosters e 1.500 dólares em dinheiro; o 2º, uma carta promo 1/8 de Dracula, uma case e 750 dólares; o 3º e o 4º, uma carta promo 1/8, duas caixas de boosters e 350 dólares; o top 8, uma caixa de boosters, uma carta promo 1/8 e 125 dólares; o top 16, uma caixa de boosters e uma carta Finalist Plus; o top 32, dez pacotes e uma carta Finalist; depois 8, 4 e 2 pacotes até o top 256 ([a tabela completa](/pt/news/crimson-cup-prizepool-qualifiers#premios)). O torneio se chama **Crimson Cup** (Copa Crimson no jogo): o nome está na própria arte da Koin, não é um apelido da comunidade.
7. **Pool de locais.** Sete locais ficam fora do torneio, "muito dependentes de sorte" nas palavras da Koin: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum e Nostradamus' Call. As partidas em sala da demo já usam esse pool: treine lá. O que cada local faz está na nossa página de [Locais](/pt/locations).
8. **Torneios de treino.** A Koin organiza torneios de treino semanais, sem nada em jogo, anunciados no Discord, para jogar contra pessoas de verdade em vez de bots antes da Cup.

As inscrições são feitas no [Discord oficial](https://discord.gg/originstcg).

## Como se preparar em cinco passos

1. [Instale a demo gratuita no Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) e jogue as missões: elas ensinam as três linhas e os turnos simultâneos.
2. Leia [Origins TCG explicado em cinco minutos](/pt/guides/origins-tcg-explained) e o [banco de dados de cartas](/pt/cards): as estatísticas são as do patch da demo de 21 de setembro, conferidas carta por carta no jogo, com as mudanças do patch 0.7 de 29 de setembro por cima.
3. Monte os seus três decks de Conquest no nosso [Deck builder](/pt/deck-builder): ele avisa quando dois decks têm a mesma Lendária e conta as cartas diferentes entre os decks. Passo a passo, com decks reais da comunidade: [como montar uma seleção de Conquest](/pt/guides/origins-tcg-conquest).
4. Estude os [decks publicados pela comunidade](/pt/decks): cada lista vem com os gráficos de composição, as notas do autor, um botão que a abre no Deck builder e o código do jogo para colar no Origins. Publique o seu com um guia para que outros jogadores possam avaliá-lo.
5. Acompanhe as [notícias](/pt/news): cada anúncio é resumido em até um dia, com link para a fonte.

## Como o OriginsMeta vai cobrir a semana

O nosso plano, em 25 de setembro de 2026: vamos publicar uma notícia por dia durante o festival, os decks do torneio com os gráficos de composição assim que as listas forem públicas (a partir do top 4) e a primeira tier list do OriginsMeta depois das finais da Crimson Cup de 25 de outubro, construída com os resultados do torneio e o topo da ladder ranqueada. Fontes: os posts oficiais no Steam de 4 de agosto, 25 de agosto, [9 de setembro](https://store.steampowered.com/news/app/4429430/view/1843481262690278), [21 de setembro](https://store.steampowered.com/news/app/4429430/view/1844115010502611), [29 de setembro](https://store.steampowered.com/news/app/4429430/view/1844751498235283) e [5 de outubro de 2026](https://store.steampowered.com/news/app/4429430/view/1845383656394214), e a [programação do Steam Next Fest](https://store.steampowered.com/sale/nextfest).
`,
  },
  "is-origins-tcg-pay-to-win": {
    title: "Origins TCG é pay-to-win? O free-to-compete explicado",
    metaTitle: "Origins TCG é pay-to-win? O free-to-compete",
    excerpt: "A Koin Games vende Origins TCG como o primeiro jogo de cartas free-to-compete, com zero pay-to-win. O que o dinheiro compra de fato, e as ressalvas honestas.",
    faq: [
      {
        q: "Origins TCG é grátis?",
        a: "Sim. A demo é gratuita no Steam desde 15 de julho de 2026 e o jogo completo é apresentado como free-to-compete: toda carta de que você precisa para competir é obtida jogando.",
      },
      {
        q: "Preciso comprar pacotes para vencer?",
        a: "Não. Segundo a página oficial no Steam, você compete só pela habilidade, com zero pay-to-win. Os pacotes pagos contêm versões de coleção das cartas, limitadas e gradadas digitalmente, e não poder a mais.",
      },
      {
        q: "Então, você paga pelo quê?",
        a: "Por produtos de coleção: versões em edição limitada, numeradas e gradadas das cartas, vendidas em pacotes, caixas e cases, que podem ser compradas, vendidas e trocadas com outros jogadores.",
      },
      {
        q: "Posso vender as minhas cartas?",
        a: "A Koin Games diz que as cartas e os produtos lacrados poderão ser negociados no Mercado da Comunidade Steam e nos marketplaces conectados quando o jogo completo for lançado. No Steam, o valor das vendas vai para a sua Carteira Steam.",
      },
      {
        q: "Existe passe de batalha ou impulso de progressão pago?",
        a: "Nada do tipo foi anunciado até setembro de 2026. Vamos atualizar esta página se isso mudar.",
      },
    ],
    body: `
## A resposta curta

Não, por concepção. Na sua página do Steam, a Koin Games descreve Origins TCG como "o primeiro TCG free-to-compete", em que você "compete só pela habilidade (zero pay-to-win) por cartas limitadas e gradadas digitalmente que pode comprar, vender e trocar". Uma das telas de carregamento oficiais diz isso em duas palavras: **zero pay-to-win**.

Essa é a promessa. Esta página explica o que ela significa na prática e onde ficam as dúvidas honestas.

## O que "free-to-compete" quer dizer

Origins separa duas coisas que a maioria dos jogos de cartas digitais mistura:

1. **Competir.** Toda carta de que você precisa para montar um deck competitivo é obtida no jogo. Os decks do playtest e o [banco de dados de cartas](/pt/cards) não têm nada que você possa conseguir pagando.
2. **Colecionar.** Versões em edição limitada das mesmas cartas existem em tiragens numeradas, vêm **gradadas digitalmente** e podem ser compradas, vendidas e trocadas. São cosméticas: uma Mulan gradada joga exatamente como a Mulan que você ganhou.

Então o pacote que você paga é um produto de coleção, não um produto de poder. O primeiro, a "Myths & Legends: Alpha Edition", é vendido só em pré-venda, em boosters de cinco cartas, caixas de 24 pacotes e cases de seis caixas, com sete níveis de raridade; veja [como funciona a economia de Origins](/pt/guides/collector-economy).

## A comparação

Em Hearthstone ou MTG Arena, os pacotes que você compra contêm as cartas com que você joga, então gastar encurta o caminho até a coleção completa. Em Origins, o caminho até um deck competitivo é jogar; gastar compra a estante de coleção ao lado. É nessa diferença que se apoia a promessa de "zero pay-to-win".

## As ressalvas honestas

- **O tempo continua sendo um custo.** As cartas grátis são obtidas jogando; quantas partidas são necessárias para completar um deck competitivo ainda não foi publicado. A construção de decks está na demo desde a atualização de 21 de setembro: vamos medir isso durante o Steam Next Fest (19–26 de outubro), quando o modo Competitivo abrir, e publicar os números.
- **Detalhes ainda por vir.** Os preços fora da pré-venda da Alpha, as taxas de marketplace além das taxas padrão do Steam e eventuais impulsos de progressão não foram anunciados. Nada indica um passe de batalha, mas nada o descarta também.
- **Valor no mercado não é dinheiro.** Vender no Mercado da Comunidade Steam põe o valor na sua Carteira Steam. Se os marketplaces conectados vão permitir sacar dinheiro de verdade, não está confirmado.
- **Os pacotes são aleatórios.** Entre os descritores de conteúdo, a página do Steam lista "In-game purchases" e "Chance based in-game purchases": o que um pacote de coleção contém fica por conta da sorte, mesmo que isso nunca mude a força de um deck.

## Por que isso importa para o meta

Como as versões de coleção são cosméticas, uma tier list só precisa julgar a carta, nunca a edição, e um deck publicado no OriginsMeta por um jogador que não gastou nada é tão forte quanto o de qualquer outro. Vamos manter esta página atualizada a cada declaração oficial; fontes: a página de Origins TCG no Steam, as telas de carregamento oficiais e os AMAs da Koin Games de julho e agosto de 2026.
`,
  },
  "play-the-demo": {
    title: "Como baixar e jogar a demo de Origins TCG no Steam",
    metaTitle: "Como jogar a demo de Origins TCG no Steam",
    excerpt: "A demo gratuita em cinco passos: requisitos, download, idioma, primeiras partidas, o que a demo desbloqueia e o que trouxe a atualização de 21 de setembro.",
    faq: [
      {
        q: "A demo de Origins TCG é gratuita?",
        a: "Sim. Ela é gratuita no Steam desde 15 de julho de 2026, para Windows e macOS.",
      },
      {
        q: "Em quais idiomas a demo está disponível?",
        a: "Treze desde o patch 0.7, a atualização da demo de 29 de setembro de 2026: inglês, francês, italiano, alemão, espanhol (Espanha), japonês, coreano, polonês, português (Brasil), português (Portugal), russo, chinês simplificado e espanhol (América Latina). A página do Steam, lida em 30 de setembro de 2026, lista os mesmos 13 para a interface, com áudio completo só em inglês.",
      },
      {
        q: "Do que eu preciso para rodar a demo?",
        a: "No mínimo Windows 10 64 bits com um Intel i3-6100 ou AMD FX-6300, 8 GB de RAM, uma GTX 750 Ti ou R9 270X e 2 GB de espaço; no Mac, macOS 10.14 ou mais recente com um Apple M1 ou um Intel i5 dual-core e uma GPU compatível com Metal.",
      },
      {
        q: "A demo dá alguma coisa para o jogo completo?",
        a: "A Koin Games anunciou que quem joga a demo ganha itens colecionáveis exclusivos, que passam a ser negociáveis quando o jogo completo for lançado.",
      },
      {
        q: "O que trouxe a atualização de 21 de setembro?",
        a: "A primeira grande atualização da demo: nova interface e novo tabuleiro, um tutorial para colecionadores, pacotes de teste, novas falas, mudanças de balanceamento e a lista provisória das cartas da Crimson Cup, com os decks, as cartas e a construção de decks testados nos playtests de agosto. O modo Competitivo (a ranqueada) é ativado com o Steam Next Fest, de 19 a 26 de outubro de 2026.",
      },
    ],
    body: `
## O que você recebe

A demo de Origins TCG está no Steam desde **15 de julho de 2026**, gratuita, para Windows e macOS. Em 25 de setembro de 2026, ela estava em "Muito positivas": 96% de 184 análises. As partidas duram cerca de sete minutos: os dois jogadores agem ao mesmo tempo em três locais, sorteados de um conjunto de mais de cem que se revezam e mudam as regras do tabuleiro. A demo inclui o tutorial, missões contra chefes com IA própria e o jogo online.

Idiomas: desde o [patch 0.7](/pt/news/patch-0-7) de 29 de setembro de 2026, o jogo tem **13 idiomas**: inglês, francês, italiano, alemão, espanhol (Espanha), japonês, coreano, polonês, português (Brasil), português (Portugal), russo, chinês simplificado e espanhol (América Latina). A página do Steam, lida em 30 de setembro de 2026, lista os mesmos 13 para a interface, com áudio completo **só em inglês**.

## Requisitos

| | Mínimos | Recomendados |
| --- | --- | --- |
| Windows | Windows 10 64 bits, Intel i3-6100 ou AMD FX-6300, 8 GB de RAM, GTX 750 Ti ou R9 270X | Windows 11 64 bits, Intel i5-8400, 16 GB de RAM, GTX 1060 |
| macOS | macOS 10.14, Apple M1 ou Intel i5 dual-core de 2,5 GHz, GPU compatível com Metal | macOS 12 ou mais recente, Apple M1 Pro, 16 GB de RAM |
| Espaço | 2 GB | 2 GB |

## Cinco passos

1. **Instale o Steam** e entre na sua conta (uma conta gratuita basta).
2. **Abra a [página da Origins TCG Demo](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/)** e clique em "Baixar Origins Trading Card Game Demo" (com o Steam em inglês, "Download"); ou procure "Origins TCG" dentro do Steam e escolha a Demo. A instalação leva uns dois minutos.
3. **Coloque o jogo em português.** Dentro do jogo, abra Configurações → Mudar idioma e escolha "Português - Brasil" (também há o português de Portugal). Se a demo abrir em outro idioma e você não encontrar o menu, dá para mudar pelo Steam: clique com o botão direito no jogo na biblioteca, Propriedades, Idioma. As vozes são em inglês; os outros idiomas traduzem a interface e os textos.
4. **Jogue o tutorial** e depois as missões: eles ensinam as três linhas, os turnos simultâneos e as palavras-chave Ao revelar (On Reveal), Ao morrer (On Death), Primeiro golpe (First Strike), Ataque duplo (Double Attack) e Toque mortífero (Deathtouch). O nosso [guia de cinco minutos](/pt/guides/origins-tcg-explained) cobre o mesmo assunto por escrito.
5. **Jogue online** e experimente os decks prontos. Quando quiser mais, leia os [decks publicados pela comunidade](/pt/decks), reconstrua-os no [Deck builder](/pt/deck-builder) e confira as estatísticas atuais das cartas no [banco de dados de cartas](/pt/cards) (Demo 2.0 com o patch 0.7 de 29 de setembro de 2026).

## O que quem joga a demo desbloqueia

No post de lançamento de julho, a Koin Games disse que quem joga a demo ganha **itens colecionáveis exclusivos**, que vão passar a ser negociáveis quando o jogo completo for lançado. Coloque o [jogo principal](https://store.steampowered.com/app/4429430/Origins_TCG/) na sua lista de desejos do Steam: a página da loja indica o lançamento para o quarto trimestre de 2026.

## O que a atualização de 21 de setembro mudou

A demo recebeu a primeira grande atualização em [21 de setembro de 2026](https://store.steampowered.com/news/app/4429430/view/1844115010502611): nova interface e novo tabuleiro, um tutorial para colecionadores, pacotes de teste, novas falas, mudanças de balanceamento e a lista provisória das cartas da Crimson Cup, junto com os decks, as cartas e a construção de decks testados nos playtests fechados de agosto. O seu progresso da demo ou do playtest é mantido, o que estiver mais adiantado. O modo Competitivo (a ranqueada) é ativado com o Steam Next Fest (19–26 de outubro de 2026): tudo sobre as datas, o torneio e como se preparar está na nossa [página do Steam Next Fest 2026](/pt/guides/steam-next-fest-2026). Os playtests das versões maiores são anunciados no [Discord oficial](https://discord.gg/originstcg), e até agora todo mundo que quis participar conseguiu.

Fontes: as páginas de Origins TCG e de Origins TCG Demo no Steam (lidas em 25 e 30 de setembro de 2026) e os posts oficiais no Steam de 16 de julho, 4 de agosto, 21 de setembro e 29 de setembro de 2026.
`,
  },
  "origins-tcg-kickstarter": {
    title: "Kickstarter de Origins TCG: data, pré-cadastro, Alpha Edition e o que sabemos",
    metaTitle: "Kickstarter de Origins TCG: data, pré-cadastro, Alpha",
    excerpt: "Kickstarter em 27 de outubro de 2026, confirmado pela Koin Games. Pré-cadastro aberto: 15% de desconto com depósito reembolsável de 1 dólar, caixas Alpha.",
    faq: [
      {
        q: "Quando começa o Kickstarter de Origins TCG?",
        a: "Em 27 de outubro de 2026. O CEO da Koin Games, Tim Jooste, deu a data no X em 17 de setembro de 2026 (\"back the Alpha Edition Kickstarter (Oct 27th)\"), e o menu principal da demo mostra o Kickstarter como \"Coming soon – Oct 27\", ao lado de \"Preregister for 15% off\". Nenhum dos dois diz a que horas a campanha abre: vamos colocar aqui assim que a Koin disser.",
      },
      {
        q: "O que o depósito de 1 dólar dá?",
        a: "O status de VIP com 15% de desconto no lançamento. A página oficial diz que o depósito é totalmente reembolsável antes do lançamento.",
      },
      {
        q: "O que é a Alpha Edition?",
        a: "Origins Myths & Legends Alpha Edition: pacotes de coleção de 5 cartas com pelo menos uma Rara ou melhor garantida, caixas de boosters com 24 pacotes e cases de 6 caixas. Caixas e cases são vendidas só em pré-venda, e a tiragem não vai se repetir.",
      },
      {
        q: "Preciso apoiar o Kickstarter para competir?",
        a: "Não. Origins é free-to-compete: a ranqueada não exige nenhuma compra, e a demo no Steam é gratuita. O Kickstarter é sobre colecionar, não sobre poder.",
      },
      {
        q: "Onde as cartas são negociadas?",
        a: "No Mercado da Comunidade Steam e nos marketplaces conectados a ele, segundo a página oficial. A abertura de pacotes no celular está prevista para 2027.",
      },
    ],
    body: `## A data: 27 de outubro, confirmada pela Koin Games {#data}

O Kickstarter da **Myths & Legends Alpha Edition** abre em **27 de outubro de 2026**. O CEO da Koin Games, **Tim Jooste**, escreveu "back the Alpha Edition Kickstarter (Oct 27th)" num [post no X de 17 de setembro de 2026](https://x.com/TimothyJooste/status/2100700207285445011), que a conta do estúdio compartilhou. A demo diz o mesmo: em **25 de setembro de 2026**, o menu principal mostrava o quadro do Kickstarter com **"Coming soon – Oct 27"** e **"Preregister for 15% off"**, enquanto a tela de carregamento anuncia a Alpha Edition. Nenhum dos dois diz a que horas a campanha abre, e em 28 de setembro de 2026 a [página de pré-cadastro](https://founder.origins-tcg.com) ainda não mencionava a data: vamos acrescentar o horário e o link da campanha assim que a Koin os publicar.

*Atualização de 28 de setembro de 2026: a data foi confirmada pelo CEO da Koin Games. A atualização de 25 de setembro tinha acrescentado a data mostrada na demo, os temas do AMA tirados do anúncio oficial e a cronologia corrigida.*

## O que foi anunciado

A Koin Games mantém uma página oficial de **Kickstarter Early Access** em [founder.origins-tcg.com](https://founder.origins-tcg.com). Em **10 de setembro de 2026**, a equipe respondeu a perguntas sobre a campanha num AMA no Discord oficial; o anúncio do dia seguinte lista os temas: gradação digital, raridade das cartas, como funcionam as trocas, cartas com erro, God packs, cartas 1/1 de torneio, o que é o set Alpha, os níveis do Kickstarter e como virar VIP com 15% de desconto. A nossa [notícia sobre o AMA](/pt/news/kickstarter-ama-pre-registration) resume tudo.

## Pré-cadastro: 15% de desconto por 1 dólar

- Virar **VIP** com um **depósito de 1 dólar** libera **15% de desconto no lançamento**.
- O depósito é **totalmente reembolsável antes do lançamento**, como a página oficial diz duas vezes.
- O pré-cadastro não obriga você a apoiar a campanha: só reserva o preço de early bird.

## A Alpha Edition

A linha de produtos se chama **Origins Myths & Legends Alpha Edition**:

| Produto | Conteúdo |
| --- | --- |
| Pacote de boosters de coleção | 5 cartas colecionáveis, pelo menos uma Rara ou melhor garantida |
| Caixa de boosters | 24 pacotes de coleção |
| Case de boosters | 6 caixas de boosters |

Na Alpha Edition, **caixas e cases são vendidas só em pré-venda**: quando essa tiragem acabar, não serão produzidas mais caixas nem cases Alpha. É a mesma lógica da tiragem de primeira edição nos jogos de cartas físicos, aplicada a uma coleção digital.

## Trocas e posse

As cartas podem ser compradas, vendidas e trocadas no **Mercado da Comunidade Steam** e nos marketplaces conectados a ele. A Koin passou para o mercado do Steam no começo deste ano, em vez de um sistema on-chain independente. A abertura de pacotes no celular está prevista para **2027**.

## O free-to-compete continua grátis

Apoiar o Kickstarter compra colecionáveis, não força: a ranqueada de Origins não exige nenhuma compra e a demo no Steam é gratuita. Veja [Origins TCG é pay-to-win?](/pt/guides/is-origins-tcg-pay-to-win) para entender como o lado competitivo e o lado de coleção ficam separados.

## Cronologia

- 15 de julho de 2026: demo gratuita no Steam.
- 21 de setembro de 2026: primeira grande atualização da demo.
- 19–26 de outubro de 2026: Steam Next Fest, com o modo Competitivo (a ranqueada) na demo e a Crimson Cup (19–25 de outubro).
- 27 de outubro de 2026: Kickstarter da Alpha Edition (data dada pelo CEO da Koin Games em 17 de setembro e mostrada no menu da demo).
- Quarto trimestre de 2026: lançamento no Steam, segundo a página da loja.
- 2027: mobile.

## O que fazer agora

1. Coloque o jogo na sua lista de desejos do Steam e jogue a demo.
2. Se você quer o desconto de lançamento, [faça o pré-cadastro em founder.origins-tcg.com](https://founder.origins-tcg.com) com o depósito reembolsável.
3. Acompanhe o Discord oficial para saber o horário do lançamento e o link da campanha: vamos colocá-los aqui no mesmo dia.

Fontes: [página oficial de pré-cadastro](https://founder.origins-tcg.com), [página do Steam](https://store.steampowered.com/app/4429430/Origins_TCG/), o anúncio do AMA no Discord oficial (11 de setembro de 2026), o [post do CEO da Koin Games no X](https://x.com/TimothyJooste/status/2100700207285445011) (17 de setembro de 2026) e o menu principal da demo (lido em 25 de setembro de 2026).`,
  },
  "streaming-tools": {
    title: "Fazer live de Origins TCG: overlay para OBS e comando !deck no chat",
    metaTitle: "Overlay OBS e comando !deck para Origins TCG",
    excerpt: "Ferramentas grátis para quem faz live de Origins TCG: overlay para OBS com o seu deck, comando !deck no chat da Twitch, links curtos, imagens e o selo LIVE.",
    faq: [
      {
        q: "Preciso instalar alguma coisa?",
        a: "Não. O overlay é uma página web que você adiciona ao OBS como fonte de navegador, e o comando de chat é uma linha para o bot do seu canal da Twitch que aponta para o OriginsMeta.",
      },
      {
        q: "Com quais bots o comando !deck funciona?",
        a: "Nightbot, StreamElements e Fossabot. A sua conta do OriginsMeta dá a linha pronta para cada um, já com o seu link dentro.",
      },
      {
        q: "Qual tamanho o overlay deve ter no OBS?",
        a: "360 × 1000 pixels para o overlay vertical e 1600 × 300 para o horizontal. O fundo é transparente.",
      },
      {
        q: "O overlay muda quando eu publico um deck novo?",
        a: "Sim, se você usar o link da sua conta: ele sempre mostra o deck que você publicou por último e o recarrega a cada minuto.",
      },
    ],
    body: `
## O que você recebe

O OriginsMeta tem ferramentas grátis para quem faz live ou vídeos sobre Origins TCG. Elas funcionam com os decks que você publica no site, e não há nada para instalar:

- um **overlay para OBS** com a lista do seu deck em fundo transparente;
- um **comando !deck** para o chat da Twitch que responde com o seu deck;
- um **link curto** e uma **imagem do deck** para descrições, miniaturas e stories;
- um **selo LIVE** ao lado do seu nome enquanto você faz live de Origins TCG.

## Antes de começar

1. Entre no OriginsMeta (Discord ou e-mail, sem senha) e publique um deck pelo [Deck builder](/pt/deck-builder).
2. Abra [a sua conta](/pt/account#stream-tools): o painel "Ferramentas para lives" tem os links do overlay e o comando de chat, já preenchidos com o seu nome de usuário.

Os links da sua conta sempre seguem **o deck que você publicou por último**: publique um novo e o overlay e o comando passam para ele em menos de um minuto. Para mostrar um deck específico, abra a página dele e use o menu "Para streamers": nos seus próprios decks, ele tem o overlay e o comando só daquele deck.

## Overlay para OBS

1. Copie um dos dois links de overlay da sua conta: vertical ou horizontal.
2. No OBS: Fontes → + → Navegador, depois cole o link.
3. Defina o tamanho: **360 × 1000** para o overlay vertical, **1600 × 300** para o horizontal.

O fundo é transparente e o overlay recarrega o deck a cada minuto, então fica atualizado sem você mexer na fonte. Ele mostra o nome do deck, o seu nome, a Lendária e as doze cartas com o custo. O idioma é o da página de onde você o copiou: para mudar, coloque lang= no fim do link com en, it, es, fr ou pt.

## O comando !deck no chat

A sua conta tem a linha a usar para cada bot, já com o seu link dentro:

- **Nightbot** e **StreamElements**: digite a linha no chat da Twitch como dono do canal ou moderador;
- **Fossabot**: crie um comando no painel dele e use a linha como resposta.

Se o !deck já existir no seu canal, escreva edit em vez de add. A partir daí, o !deck responde no chat com uma linha: o nome do deck, a Lendária, o link curto e o código do jogo para colar no Origins TCG. O código só fica de fora quando uma carta do deck ainda não tem ID oficial.

## Link curto e imagem do deck

Todo deck tem um link curto, originsmeta.com/d/ seguido do endereço do deck: fale na live ou coloque na descrição do vídeo, e ele abre o deck no idioma de quem assiste. O seu perfil também tem um, originsmeta.com/@ seguido do seu nome de usuário.

No menu "Para streamers" de qualquer deck você também pode baixar uma imagem PNG com a Lendária, as doze cartas com o custo e o link curto: 16:9 (1280 × 720) para miniaturas, 9:16 (1080 × 1920) para stories e shorts.

## Selo LIVE

Creators, Autores, jogadores Pro e Staff que adicionam o canal da Twitch ao perfil público ganham um **selo LIVE** ao lado do nome no site enquanto fazem live de Origins TCG: na categoria do jogo na Twitch, ou com um título que cite o jogo. As lives deles também aparecem na [página das lives](/pt/live) e no [diretório de criadores](/pt/creators). Os papéis são atribuídos pelo staff do OriginsMeta: se você faz live de Origins TCG com regularidade, fale com a gente no Discord.
`,
  },
};
