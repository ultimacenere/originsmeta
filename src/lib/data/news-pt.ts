import type { NewsCopy } from "./news-fr";

/**
 * Testi in portoghese del Brasile delle news (20/10/2026, portoghese quinta lingua del sito), per slug, con gli stessi
 * campi del francese (`NewsCopy` di news-fr.ts): `title` (H1, entro 110 caratteri), `metaTitle` (con "Origins TCG" entro
 * 60), `description` (120–158), `summary`, `body` in Markdown, `highlights` e `faq` quando l'articolo li ha nelle altre
 * lingue. news.ts li unisce (`withTranslations`) e si rifiuta di compilare se a una news manca il portoghese o se il
 * portoghese ha un campo che l'articolo non ha (o viceversa). Regole, glossario e SEO in docs/portoghese.md; i controlli
 * sono quelli di newsMeta.test.ts (lunghezze, link con /pt/, ancore degli "In breve" presenti nel body, paragrafo
 * "Atualização de …" per gli articoli aggiornati).
 */
export const ptText: Record<string, NewsCopy> = {
  "soul-crimson-cup-interview": {
    title: "Uma conversa com SouL, finalista da Crimson Cup: a lineup anti Van Helsing e o futuro de Origins TCG",
    metaTitle: "Entrevista com SouL, finalista da Crimson Cup de Origins TCG",
    description:
      "SouL, vice-campeão da Crimson Cup de Origins TCG, fala da lineup Pigs, Mulan e Merlin montada contra Van Helsing, com as três listas para copiar.",
    summary:
      "SouL ficou em segundo na Crimson Cup, parado só na grande final por CoachCrono. Nesta conversa ele conta a lineup montada com Nimer e Lord Von para vencer Van Helsing, por que para ele Merlin precisa de um nerf e por que Origins TCG tem tudo para crescer. As três listas dele viraram um deck de torneio, com os códigos do jogo para copiar.",
    body: `SouL é um dos **três italianos que chegaram às finais** da [Crimson Cup](/pt/analytics/crimson-cup), o maior torneio de Origins TCG até agora: ele fechou a chave dos vencedores sem derrotas e só parou na grande final, contra [CoachCrono](/pt/news/crimson-cup-coachcrono-wins). No OriginsMeta ele tem a função Pro: os canais e os decks dele estão no [seu perfil](/pt/u/soulontwitch).

Nós nos conhecemos há anos, de outros jogos competitivos, e mais do que uma entrevista esta é uma conversa entre apaixonados, gravada nos dias logo depois da final, no dia em que começava o [Kickstarter da Alpha Edition](/pt/kickstarter). As perguntas são de Luigi "[Davdas](/pt/authors/davdas)" Ragoni.

As três listas de SouL, as que a Koin Games publicou no dia das finais, viraram um [deck de torneio](/pt/decks/tournament/soul-crimson-cup-lineup): **você as encontra mais abaixo, com os códigos do jogo para copiar**.

## O torneio, no calor do momento {#torneio}

**Davdas:** Olá, SouL, estou felicíssimo de reencontrar você depois de tantas vezes em que nos cruzamos no mundo dos games, e de ter você aqui depois de um grande resultado: você chegou a disputar a final do primeiro torneio de um jogo novo. Como foi?

**SouL:** Olá, Luigi! Foi um pouco como voltar àqueles jogos antigos em que nos cruzamos tantas vezes, porque aqueles também eram jogos competitivos digitais.

Hoje eu migrei um pouco mais para as cartas físicas, mas **Origins me levou de volta aos tempos em que se competia nos títulos online**.

**Davdas:** Vamos analisar as suas listas e as suas escolhas, e vamos falar também um pouco do jogo, porque estamos diante de uma cortina ainda entreaberta: eu queria tentar espiar por trás dela e imaginar o que ele pode se tornar, para nós e para você. Mas antes, no calor do momento, poucas horas depois do fim: como foi o torneio? O evento, a duração, as partidas?

**SouL:** Muito bonito, na minha opinião, para ser o primeiro torneio organizado por uma empresa nova no setor, que justamente hoje, no dia em que estamos gravando, lança o seu Kickstarter de verdade: estamos no começo de um jogo que está fazendo muito sucesso antes mesmo de sair.

Tirando alguns pequenos problemas técnicos que todos os participantes conhecem, uma lentidão do bot porque havia muitíssimas pessoas e muitíssimas partidas, foi realmente muito bom. Havia nomes muito interessantes, gente internacional famosa, streamers de Hearthstone do calibre do Thijs, e um núcleo sólido de jogadores de cartas italianos.

E podemos dizer logo: **nós, italianos, ocupamos três dos quatro lugares do top 4**. Isso foi extremamente bonito. Havia gente que eu conhecia, gente que eu considerava forte, e com o resultado que eu fiz diria que foi muito bem.

[![A imagem oficial da Crimson Cup, da Koin Games: classificatórias, playoffs, finais e 10.000 dólares em prêmios](/media/news-crimson-cup.webp)](/pt/analytics/crimson-cup)

## Os italianos e Origins TCG {#italianos}

**Davdas:** É um grande sucesso para o nosso país: une as pessoas e reforça a ideia de Origins, que justamente agora começa a se mover nos mercados estrangeiros, rumo aos vários países do mundo. O que você espera do mercado italiano diante de um jogo assim? Os italianos podem fazer dele um jogo de ponta?

**SouL:** Para mim, sim. Paradoxalmente, nós sempre fomos **uma das comunidades mais ativas da Europa**, pelo menos nos jogos de cartas online.

Ainda hoje temos uma das maiores comunidades no Magic: The Gathering Online, e no Hearthstone a italiana também sempre esteve entre as maiores, com grandes talentos, grandes jogadores que formamos ao longo dos anos, e não vou citar todos, mas também criadores de conteúdo importantes. Não existe um único jogo de cartas digital que não tenha feito sucesso no nosso país.

Origins, na minha opinião, tem todas as chances: **não fica devendo nada a um Hearthstone dos tempos de ouro**, se quisermos. Os tempos mudaram, claro, mas tenho certeza de que ele pode agradar a muita gente. Aliás, é evidente: já está agradando a muita gente. Não adianta tapar o sol com a peneira.

## A lineup: Pigs, Mulan e Merlin contra Van Helsing {#lineup}

> "Em 6 rodadas de 7 encontrei jogadores que levavam Van Helsing: simplesmente sem banir o Van Helsing deles, sempre passei por cima."

**Davdas:** Tomara. Como você sabe, eu tenho uma trajetória particular com a Blizzard justamente no Hearthstone, e estou revendo algumas semelhanças. Vamos dizer para quem nos lê: isto é mais uma conversa entre amigos do que uma entrevista.

Mas eu não queria perder a parte do torneio: vamos ficar nas listas, depois voltamos ao que Origins vai ser e ao que esperamos. Você fez uma escolha importante, porque levou Three Not So Little Pigs, Mulan e Merlin, três decks diferentes entre si: um aggro, um midrange e um control. Pelo que você pensou e testou nessas semanas, por que justamente essas três listas?

**SouL:** Exato. Vou dizer a verdade logo: eu fico com pouco mérito pela ideia da lineup, porque quem a testou de verdade foram dois amigos meus. Eles treinaram juntos, são dois jogadores italianos que fizeram um bom resultado os dois: **Nimer e Lord Von**.

Escolhemos esses decks porque, como você disse, na identidade eles são um aggro, um midrange e um control, mas **nós os modificamos com a ideia precisa de transformá-los em decks combo**. O nosso alvo era **Van Helsing healing, que para nós era o deck top tier do meta**, e aliás é o deck com que eu me classifiquei na classificatória que depois me fez jogar o Invitational de sábado.

Eu tinha levado uma lineup toda de control e cura, com Van Helsing e depois decks que fingiam ser outra coisa e na verdade eram praticamente Van Helsing healing sem Van Helsing. Então pensei: o pessoal vai se inspirar no que eu fiz, e eu não fui o único a teorizar isso, então o torneio vai estar cheio de Van Helsing. E a nossa call estava certa.

[![Van Helsing, o deck a ser batido na Crimson Cup: a lineup de SouL nasceu para passar por cima dele](/cards/cover/van-helsing.webp)](/pt/cards/van-helsing)

### Merlin: mais dano e menos dependência dos Obliterate {#merlin}

A ideia inicial era do Nimer. Quando eu descobri, disse para ele: acho que você tem toda a razão, me mostra as ideias que você tem. Vi os decks dele e fiz algumas modificações.

O Merlin, por exemplo, do jeito que ele tinha montado, era meio "brickado", digamos: faltava a possibilidade de empurrar um pouco mais de dano e **ele dependia só da possibilidade de jogar dois Obliterate um depois do outro**. Eu não gosto dessas coisas, porque se os seus dois Obliterate estão no fundo do deck... você perde a partida!

Então **coloquei Puck, Jekyll e First Aid**, para ter aquelas curas que ajudam a controlar mas que, em combo com Puck, acertam o oponente e ajudam a fechar as partidas.

### Pigs: Glinda e Sandman para o board monstruoso {#pigs}

Three Not So Little Pigs é o menos combo dos três, porque joga de um jeito bem aggro, mas o objetivo do deck, sobretudo contra Van Helsing, é **segurar os recursos na mão para colocar Glinda e Sandman quando o oponente revela as cartas dele**.

Depois você enche o tabuleiro em um só turno, talvez com dois Reinforcements mais outros feitiços de custo 1, e o deck está cheio deles, para **ativar Glinda cinco, seis, sete vezes ao longo de dois turnos** e criar um board monstruoso. Normalmente você faz isso quando o oponente tem só 7 de mana, para que ele não possa responder com Forbidden Knowledge, obviamente.

A escolha foi ótima: em 6 rodadas de 7 encontrei jogadores que levavam Van Helsing, então, simplesmente sem banir o Van Helsing deles, sempre passei por cima. Venci todas as rodadas por 2-0 menos uma, vencida por 2-1 porque o oponente não tinha Van Helsing: foi a única série melhor de três equilibrada que joguei. Todas as outras foram um massacre.

## As três listas de SouL {#listas}

{{decklists}}

## O melhor deck e o que mudar {#decks}

> "Esse Merlin não pode perder: ele precisa de um nerf, sem dúvida."

**Davdas:** Além das estatísticas, que sempre contam até certo ponto, e do que se sente com as cartas na mão, se você me permite a comparação: qual foi o deck que rendeu melhor e qual dos três você teria querido mudar?

**SouL:** A verdade é que **os três renderam muito bem**. Nenhum dos três travou, nem mesmo na final que depois perdi contra o Crono.

A derrota grave foi a da Mulan, que perdeu contra o Van Helsing do Crono, coisa que não devia acontecer: nós queríamos vencer Van Helsing, e inclusive na última rodada do suíço eu estava contra o Crono e venci por 2-0, passando por cima do Van Helsing dele. Na final eu perco a primeira partida da série melhor de cinco justamente contra Van Helsing, porque saiu uma combinação de locais muito azarada para a minha lineup.

Nenhum dos três decks ficou abaixo das expectativas. O único que talvez eu não quisesse é o deck da Mulan: baniram muito os meus Pigs, baniram muito o meu Merlin, **a Mulan nunca baniram**. Então provavelmente era o deck menos forte dos três, mas era o que fechava o círculo da lineup combo.

**O melhor deck só pode ser o Merlin**: além de ser o meu deck favorito do jogo, foi com certeza o mais sólido de todos. Esse Merlin não pode perder, para mim ele precisa de um nerf, sem dúvida: é insano.

[![Merlin, o deck favorito de SouL e, segundo ele, o mais sólido da lineup](/cards/cover/merlin.webp)](/pt/cards/merlin)

## A final contra CoachCrono {#final}

**Davdas:** Como foi a final com o Coach? Uma final, em certos aspectos, quase amistosa, apesar do que estava em jogo e da vontade de disputá-la até o fim: dava para sentir a competição, mas vocês foram super corretos um com o outro. Há um conhecimento, há um apoio, há também o senso de comunidade de vocês dois serem streamers, e ainda uma final toda italiana. O que deu errado?

**SouL:** Antes, duas palavras sobre o Crono, porque ele me fez rir muito. Eu e o Crono nos conhecemos desde sempre: começamos a fazer stream juntos na época do Teamfight Tactics. Não somos amigos que se falam por outros motivos, mas por jogo, colaborações e raids na Twitch sempre estivemos em contato, e na final estávamos muito tranquilos.

Antes da final eu fui no Discord dele conversar com ele e com o chat dele, porque **o Crono se recusava a colocar delay na live**. Ele jogou o torneio inteiro "snipável", e isso é terrível, porque Origins é um daqueles jogos em que, se fazem stream sniping em você e o oponente prevê todas as suas jogadas, é uma tragédia. Mas ele não ligava.

Quando na final ficamos nós dois, eu disse: "Crono, por favor, você pode colocar delay? Pode colocar pelo menos uma faixa preta para esconder a sua mão? Eu não vou fazer snipe em você, mas todo mundo conhece a gente: você sabe quantas pessoas poderiam me passar informações? Eu me fecho, fico offline, mas vão chegar pombos-correio pela janela!" E ele: **"Não, não me importo nem um pouco, eu confio em você"**. Foi muito divertido.

### A primeira partida, os locais e o 2-2 {#serie}

Na verdade não há muito o que dizer: **o Crono jogou muito bem**. Os locais da primeira partida foram com certeza muito favoráveis para ele, ele também reconheceu isso ao vivo, mas era evidente, porque a minha lineup era feita para destruir a dele.

Eu estava objetivamente em vantagem, e ele conseguiu levar porque jogou muito bem sobretudo a primeira partida: apostou todas as fichas naqueles locais, azarados para mim e favoráveis para ele. Ele começava em desvantagem, ficou muito concentrado, sabia que estava montado no cavalo mais fraco na corrida final, mas se agarrou a ele e conseguiu roubar a vitória justamente na primeiríssima partida.

Aquela partida virou completamente as probabilidades, porque no momento em que o meu oponente conseguiu fazer passar o seu Van Helsing, **de repente quem estava atrás era eu**. A partir daí me defendi bem, consegui levar duas partidas e esticamos o espetáculo **até o 2-2**.

Na partida decisiva ele encontrou uma curva espetacular com o seu deck aggro e me devastou: não havia mesmo como vencer aquela, e assim ele levou para casa o famoso Dracula de ouro.

[![A imagem oficial da Koin Games para CoachCrono, campeão da Crimson Cup: a carta promo Dracula 1/1, dois cases de caixas de boosters e 1.500 dólares](/media/news-crimson-cup-winner.webp)](/pt/news/crimson-cup-coachcrono-wins)

## Por que Origins pode dar certo {#por-que-origins}

> "É um jogo nascido para ser competitivo. Eu dou seis meses para ele explodir."

**Davdas:** Antes de tudo, renovo os parabéns pela partida, pelo espírito esportivo e pelo resultado, a você e ao Crono, que em breve teremos como convidado. Quais são hoje os valores de Origins? O que faz dele um possível concorrente no mercado e algo especial nas mãos dos jogadores?

**SouL:** Jogos de cartas online existem e não existem, porque de jogos que apostam de verdade no competitivo, do jeito que eu vejo, talvez só tenha sobrado o Hearthstone. E é um jogo muito antigo, que muita gente já experimentou: muitos se cansaram do competitivo dele, muitos voltaram.

Mas num cenário em que existe praticamente só o Hearthstone, **há com certeza espaço para um segundo jogo**, e a ideia em que Origins se baseia é completamente diferente. Então, para mim, o panorama para fazê-lo funcionar, pelas ideias dele, existe.

### Free to compete {#free-to-compete}

Falando de gosto pessoal: o jogo é totalmente **"free to compete"**, como eles definem. **Eles dão todas as cartas para você e você pode jogar todos os decks**: depois de literalmente duas horas de tutorial você já desbloqueou tudo, nem dá tempo de ler todas e você já as tem na mão.

Você pode competir no nível mais alto, jogar de casa um torneio como a Crimson Cup, que não custa nada, e ganhar um prêmio como o do Crono, **uma carta serial 1 de 1**. Ok, é digital, mas os mesmos seriais das cartas físicas valem 30, 40, 50, até 100.000 dólares.

Se essa carta chegar a valer nem que seja um décimo das cartas que valem mais em absoluto, e o Crono conseguir vendê-la para um colecionador, ou ficar com ela, não sei o que ele quer fazer, mas se o valor dela chegar a 10.000 dólares, **ele ganhou esse prêmio sentado na casa dele**. É algo que não tem preço, e muita gente, sobretudo os jovens, vai querer ter acesso a isso.

[![A imagem "Zero pay to win" da Koin Games: cada jogador recebe todas as cartas vencendo partidas, sem gastar](/media/ls-zero-pay-to-win.webp)](/pt/kickstarter)

### O círculo virtuoso do colecionismo {#colecionismo}

Eu jogo muito jogos de cartas físicos, compito nesses títulos e viajo muito, mas as viagens custam e as cartas físicas custam: nem todo mundo pode se dar esse luxo.

**Os jogos online são um sopro de ar fresco**: posso jogar a qualquer momento, no celular, com os amigos no Discord, sem precisar encontrar alguém pessoalmente, até com os amigos distantes, porque Origins não me impõe limites.

É grátis, é um videogame e tem por trás gente com o know-how para levá-lo adiante, com uma parte de colecionismo que, a gente sabe, é o que hoje sustenta o competitivo, porque dar prêmios em dinheiro é sempre um problema para qualquer um, tanto para as empresas de jogos físicos quanto para as digitais.

Mas se eu posso dar cartas seriais únicas, fazer ilustrações incríveis, pagar um artista excelente por uma ilustração única de Winnie-the-Pooh ou de Merlin, sabendo que um dia ela vai ser jogada num torneio por pessoas interessadas na competição e comprada por colecionadores interessados nesse tipo de produto, **estamos criando o círculo virtuoso de que vivem há anos também os jogos de cartas físicos**.

[![A imagem da Koin Games sobre os Collector Packs: ilustrações alternativas, cartas Frame Broken e Storybook com as suas probabilidades](/media/ls-collector-pack.webp)](/pt/kickstarter)

Para mim existem todos os fatores para este jogo nascer, crescer e viver uma longa vida competitiva, que é a que os seus criadores querem dar a ele. O que mais me agrada em Origins é justamente isso: é um jogo nascido para ser competitivo.

Como sempre diz o Timothy, o criador: queremos fazer o melhor jogo de cartas competitivo online, porque ele não existe. Eu dou seis meses para ele explodir.

## O conselho para a Koin Games: nunca mudar {#conselhos}

**Davdas:** O que você aconselha hoje a Origins? Por natureza, o jogo bebe de jogos que já conhecemos, mas faz isso muito bem: constrói uma trama de jogabilidade, rejogabilidade, continuidade e diversão pegando o melhor, ou pelo menos as melhores ideias, de outros títulos. À primeira vista pensei no Hearthstone, que você citou, no Artifact, no Snap, jogos que tiveram o seu grande momento no mercado, uns por mais tempo, outros com mais jogadores, cada um com a sua história.

Origins está nos agradando muitíssimo e nos conquistando com as suas ideias, mas ainda não saiu: lá fora muitíssimos jogadores nem sabem que ele existe, temos um set que não é um verdadeiro primeiro set e jogamos torneios com algo que ainda sentimos incompleto em algumas cartas e em algumas mecânicas. Mas ele já tem uma identidade fortíssima. Se você pudesse aconselhar os próximos passos de Origins, quais seriam?

**SouL:** Vou de novo pelo gosto bem pessoal, porque tudo o que você disse está certíssimo. Para mim eles estão numa fase de transição, e a transição está acontecendo justamente hoje, com o lançamento do Kickstarter.

O meu conselho para um jogo assim é **nunca mudar**, porque um dos grandes erros que, na minha opinião, muitos jogos cometeram foi justamente mudar. Eles têm que construir o seu público, e o público deles é diferente: **é um público de competidores e de colecionadores**. Se daqui para a frente eles nunca mudarem a sua visão, para mim eles têm um futuro brilhante.

Talvez não tenham um crescimento explosivo, como teriam se se vendessem um pouco mais ao que o mercado pede no curto prazo, mas se continuarem fiéis à sua identidade podem criar **um público fiel que potencialmente nunca vai parar de jogar**.

No fim, estamos falando de um jogo que quer competição e colecionismo, então é preciso tempo, muito tempo: para produzir as ilustrações, para construir a comunidade competitiva, para fazer torneios, para atrair os jogadores competitivos que existem no mundo, inclusive os que hoje não jogam Origins mas que com a sua opinião podem mover os outros dizendo: "Este jogo é demais, venham testar um torneio, vocês jogam de casa, é completamente grátis". É isso que eles têm que divulgar como identidade do seu produto, e para mim eles conseguem, se nunca mudarem.

O Kickstarter de que SouL fala é o da Alpha Edition: recompensas, probabilidades e datas estão na nossa [página do Kickstarter](/pt/kickstarter).

## O que um jogador procura num site como o OriginsMeta {#originsmeta}

**Davdas:** Obrigado por ter estado conosco nas páginas do OriginsMeta. Para mim é um prazer e uma honra reencontrar você e conversar de novo com você depois de um tempo, e espero que isso possa acontecer mais vezes.

**SouL:** Assim que eu ficar em segundo em outro torneio, eu volto! *(risos)*

**Davdas:** Vamos convidar você para muito mais, pode acreditar. O OriginsMeta, o site em que estamos agora, é um hub que quer dar a este jogo um apoio total. Estamos em contato direto com o pessoal da Koin Games, que está distribuindo o jogo e apresentando-o ao mundo, e estamos fazendo de tudo para dar ao jogo um apoio de ferramentas e de comunidade. Do seu ponto de vista, o que você espera encontrar quando entra num site que fala tão a fundo de um jogo de que você gosta? O que você gostaria de ter, além de uma zona de conforto para consultar a lista das cartas?

**SouL:** Vou parecer parcial, mas quero dizer a verdade: **vocês já têm isso**. Usei o site de vocês para o torneio, para as estatísticas. Tenho formação em engenharia, mas tirando isso sempre fui um apaixonado por estatística: **para mim as estatísticas são tudo**.

A minha lineup nasceu justamente do fato de que Van Helsing era claramente o deck mais forte de todos, então eu queria uma lineup que o vencesse. E descobri isso olhando as estatísticas dos outros torneios e do ranking, **com os dados reunidos pelo site de vocês**. Então o que para mim não pode faltar nunca é isso.

Um jogo competitivo precisa de estatísticas e de gente que saiba lê-las, e um apoio que vocês podem dar aos jogadores é não só apresentar as estatísticas, mas também **apresentar uma leitura delas por meio de artigos como este**, convidando pessoas que dão a sua leitura do meta. Para mim esse é o valor agregado incrível que não pode faltar num jogo de que eu participo.

[![O ban rate das Lendárias nas quatro classificatórias da Crimson Cup, da página do OriginsMeta: Van Helsing é a mais banida em todas](/media/news-soul-ban-rate-pt.webp)](/pt/analytics/crimson-cup#across)

Os números de que SouL fala estão na nossa [página da Crimson Cup](/pt/analytics/crimson-cup#across): nas quatro classificatórias com as tabelas oficiais da Koin, **Van Helsing foi sempre a Lendária mais banida**, Merlin a segunda no total, Mulan muito mais abaixo. As estatísticas do ladder, das partidas registradas com o OriginsMeta Tracker, estão em [Analytics](/pt/analytics).

**Davdas:** Obrigado, SouL, obrigado de verdade pelas suas palavras e pelos seus conselhos, e sobretudo parabéns de novo pelo belíssimo resultado.

**SouL:** Obrigado a você e obrigado ao OriginsMeta.`,
    faq: [
      { q: "Com quais decks SouL jogou a Crimson Cup?", a: "Three Not So Little Pigs, Mulan e Merlin, no formato Conquest. As três listas, publicadas pela Koin Games no dia das finais, estão no OriginsMeta como deck de torneio, com os códigos do jogo para copiar." },
      { q: "Por que SouL escolheu Pigs, Mulan e Merlin?", a: "Para vencer Van Helsing, segundo ele o deck top tier do meta: um aggro, um midrange e um control modificados para jogar como combo. A ideia é de Nimer, testada com Lord Von e refinada por SouL." },
      { q: "Qual deck da sua lineup SouL considera o mais forte?", a: "Merlin: o mais sólido dos três e o seu favorito, que \"precisa de um nerf, sem dúvida\". O menos forte, segundo ele, era o deck de Mulan, que no torneio nunca foi banido contra ele." },
    ],
  },
  "kickstarter-alpha-edition-reward-tiers": {
    title: "Kickstarter de Origins TCG: os oito níveis da Alpha Edition, de 24 a 9.999 dólares",
    metaTitle: "Kickstarter de Origins TCG: todos os oito níveis",
    description:
      "Os oito níveis do Kickstarter da Alpha Edition de Origins TCG, de 24 a 9.999 dólares: pacotes, caixas e cases lacrados, Big Bob Commander e Golden Slabs.",
    summary:
      "O Kickstarter da Alpha Edition tem oito níveis de recompensa, de Worthy, por 24 dólares, a Legend: Winnie-the-Pooh, por 9.999 dólares. Todos incluem o Alpha Supporter Title e o Collector Pass permanente; a partir de Aspirant (99 dólares) vêm caixas e cases lacrados, o Big Bob Commander exclusivo do Kickstarter e, mais acima, as promos Golden Slab. Todas as recompensas são digitais.",
    highlights: [
      { label: "Oito níveis, de 24 a 9.999 dólares", text: "do bundle de 6 pacotes a 30 cases lacrados", anchor: "niveis" },
      { label: "Em todos os níveis", text: "o Alpha Supporter Title e o Collector Pass permanente", anchor: "em-todos" },
      { label: "Exclusivos do Kickstarter", text: "Big Bob Commander a partir de Aspirant, Golden Big Bob a partir de Apprentice", anchor: "exclusivos" },
      { label: "Promos e slabs", text: "Alt Art Promo Box, Golden Slabs de Van Helsing e Rapunzel, Winnie-the-Pooh no topo", anchor: "promos" },
      { label: "Tudo digital", text: "a Koin escreve isso em cada nível: as recompensas são produtos digitais", anchor: "digitais" },
      { label: "Ainda por saber", text: "a data de encerramento da campanha e eventuais limites nos níveis", anchor: "o-que-nao-sabemos" },
    ],
    body: `## Oito níveis, de 24 a 9.999 dólares {#niveis}

O Kickstarter da Koin Games para a **Alpha Edition de Myths and Legends** tem oito níveis de recompensa. Do mais barato ao mais caro:

| Nível | Preço | Produto lacrado | Pacotes |
| --- | --- | --- | --- |
| Worthy | US$ 24 | 1 Alpha Booster Bundle | 6 |
| Aspirant | US$ 99 | 1 Alpha Booster Box | 24 |
| Apprentice | US$ 199 | 2 Alpha Booster Boxes | 48 |
| Hero | US$ 499 | 1 Alpha Booster Box Case | 144 |
| Champion | US$ 999 | 2 Alpha Booster Box Cases | 288 |
| Icon | US$ 2.499 | 6 Alpha Booster Box Cases | 864 |
| Myth: Winnie-the-Pooh | US$ 4.999 | 30 Alpha Booster Box Case | 4.320 |
| Legend: Winnie-the-Pooh | US$ 9.999 | 30 Alpha Booster Box Cases | 4.320 |

Preços em dólares americanos. As imagens abaixo são as artes oficiais da Koin Games para cada nível. Os nomes dos níveis e das recompensas ficam em inglês, como a Koin os escreve.

### Worthy, 24 dólares {#worthy}

![Arte da Koin Games do nível Worthy, 24 dólares: um Alpha Booster Bundle lacrado de 6 pacotes e o Collector Pass](/media/kickstarter/worthy.webp)

A porta de entrada: um **Alpha Booster Bundle** lacrado com 6 pacotes, o **Alpha Supporter Title** e o **Collector Pass permanente** de Origins TCG.

### Aspirant, 99 dólares {#aspirant}

![Arte da Koin Games do nível Aspirant, 99 dólares: uma caixa de boosters Alpha lacrada, os emotes de Big Bob, o Collector Pass, a cápsula Founder e Big Bob Commander](/media/kickstarter/aspirant.webp)

Uma **Alpha Booster Box** lacrada de 24 pacotes. Em relação a Worthy, acrescenta a **Founder Collector Capsule** (avatar, verso de carta, um emote Founder e um slab Founder), o **Big Bob Commander** exclusivo do Kickstarter e o **Big Bob Emote Pack** com 3 emotes.

### Apprentice, 199 dólares {#apprentice}

![Arte da Koin Games do nível Apprentice, 199 dólares: duas caixas de boosters Alpha lacradas, Big Bob Commander, a Alpha Alt Art Promo Box, o Collector Pass e Golden Big Bob Commander](/media/kickstarter/apprentice.webp)

Duas caixas lacradas, 48 pacotes. Acrescenta o **Golden Big Bob Commander** exclusivo do Kickstarter, o **Golden Big Bob Emote Pack** e a **Alpha Alt Art Promo Box**.

### Hero, 499 dólares {#hero}

![Arte da Koin Games do nível Hero, 499 dólares: um case de caixas de boosters lacrado, a Alpha Alt Art Promo Box, o Alpha Gameboard, os dois Big Bob Commanders e a promo Golden Slab de Van Helsing](/media/kickstarter/hero.webp)

Um **Alpha Booster Box Case** lacrado, 144 pacotes. Acrescenta o **Alpha Gameboard** e a **Van Helsing Golden Slab Promo**.

### Champion, 999 dólares {#champion}

![Arte da Koin Games do nível Champion, 999 dólares: dois cases lacrados e as promos Golden Slab de Van Helsing e Rapunzel](/media/kickstarter/champion.webp)

Dois cases lacrados, 288 pacotes, com as **Golden Slab Promos de Van Helsing e Rapunzel**.

### Icon, 2.499 dólares {#icon}

![Arte da Koin Games do nível Icon, 2.499 dólares: seis cases lacrados, os slabs de Van Helsing e Rapunzel e um set de slabs promo Alternate Art](/media/kickstarter/icon.webp)

Seis cases lacrados, 864 pacotes. Acrescenta o **Guaranteed Premium Alternate Art Promo Set**.

### Myth: Winnie-the-Pooh, 4.999 dólares {#myth}

![Arte da Koin Games do nível Myth: Winnie-the-Pooh, 4.999 dólares: cases lacrados, o set promo Alternate Art e um slab promo de Winnie-the-Pooh com o seu emote dourado](/media/kickstarter/myth.webp)

O primeiro nível com o nome de um personagem. Além de tudo o que vem em Icon, acrescenta a **Golden Commander Skin**, um **Golden Emote** e a **Serialized Character Profile Promo**. Segundo a lista de recompensas da sua arte, tem 30 cases lacrados, 4.320 pacotes.

### Legend: Winnie-the-Pooh, 9.999 dólares {#legend}

![Arte da Koin Games do nível Legend: Winnie-the-Pooh, 9.999 dólares: trinta cases lacrados e dois slabs promo de Winnie-the-Pooh, um deles dourado](/media/kickstarter/legend.webp)

O nível mais alto: 30 cases lacrados, 4.320 pacotes, tudo o que vem em Myth e a **Serialized Signature Character Profile Promo**.

## O que todos os níveis incluem {#em-todos}

- **Todos os níveis**, Worthy incluído: o **Alpha Supporter Title** e o **Collector Pass permanente** de Origins TCG.
- **A partir de Aspirant**: a **Founder Collector Capsule** (avatar, verso de carta, um emote Founder, um slab Founder), o **Big Bob Commander** e o seu pacote de emotes.
- **A partir de Apprentice**: o **Golden Big Bob Commander**, o seu pacote de emotes e a **Alpha Alt Art Promo Box**.
- **A partir de Hero**: o **Alpha Gameboard**.

## Os exclusivos do Kickstarter {#exclusivos}

A Koin marca duas recompensas como **Kickstarter Exclusive**: o **Big Bob Commander**, em todos os níveis a partir de Aspirant, e o **Golden Big Bob Commander**, a partir de Apprentice. Cada um vem com o seu pacote de 3 emotes.

## Promos e slabs {#promos}

Os níveis mais altos acrescentam promos que não saem nos pacotes: a **Alpha Alt Art Promo Box** a partir de Apprentice, o **Golden Slab de Van Helsing** a partir de Hero, **Van Helsing e Rapunzel** a partir de Champion, o **Guaranteed Premium Alternate Art Promo Set** a partir de Icon e as promos numeradas de **Winnie-the-Pooh** em Myth e Legend.

## Todas as recompensas são digitais {#digitais}

Cada arte traz a mesma frase da Koin: "All Kickstarter rewards are a digital product", todas as recompensas do Kickstarter são produtos digitais. Pacotes, caixas e cases são itens do inventário do Steam que você pode abrir, manter lacrados ou trocar, segundo a página oficial da Koin, e a Alpha Edition nunca será reimpressa. As probabilidades oficiais de cada raridade estão na nossa [página do Kickstarter](/pt/kickstarter), e tudo sobre a campanha, com datas e fontes, no nosso [guia do Kickstarter](/pt/guides/origins-tcg-kickstarter).

## Como apoiar {#como-apoiar}

A nossa [página do Kickstarter](/pt/kickstarter) resume a Alpha Edition, e o botão dela leva você à campanha com o nosso link de indicação: se você apoiar a partir dali, a Koin Games paga uma comissão ao OriginsMeta, e o seu preço continua o mesmo. Se você fez o pré-cadastro como VIP, use o link VIP que a Koin enviou a você: o seu desconto de 15% está ligado a ele.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Quando a campanha termina e se algum nível tem um número limitado de apoiadores.
- Quando as recompensas chegam ao inventário do Steam.`,
    faq: [
      {
        q: "Quanto custa o nível mais barato do Kickstarter de Origins TCG?",
        a: "Worthy, por 24 dólares: um Alpha Booster Bundle lacrado de 6 pacotes, o Alpha Supporter Title e o Collector Pass permanente de Origins TCG.",
      },
      {
        q: "Quais níveis incluem uma caixa de boosters ou um case lacrados?",
        a: "Aspirant (99 dólares) tem uma caixa de 24 pacotes, e Apprentice (199 dólares), duas. A partir de Hero (499 dólares) há cases lacrados: um em Hero, dois em Champion, seis em Icon e trinta em Legend.",
      },
      {
        q: "As recompensas do Kickstarter são físicas?",
        a: "Não. Em cada arte dos níveis, a Koin Games escreve que todas as recompensas do Kickstarter são produtos digitais.",
      },
    ],
  },
  "crimson-cup-coachcrono-wins": {
    title: "CoachCrono vence a Crimson Cup de Origins TCG: três italianos entre os quatro finalistas",
    metaTitle: "CoachCrono vence a Crimson Cup de Origins TCG",
    description:
      "CoachCrono vence a Crimson Cup de Origins TCG pela chave dos perdedores: três italianos entre os quatro finalistas, os decks deles e o resumo do torneio.",
    summary:
      "CoachCrono venceu a Crimson Cup, o maior torneio de Origins TCG até agora: ele se recuperou pela chave dos perdedores e derrotou SouL na grande final, levando para casa a carta promo Dracula 1/1. Três dos quatro finalistas são italianos: CoachCrono, SouL e Felixnxx. Aqui estão a campanha dele, os decks das finais e o resumo de uma semana de torneio.",
    highlights: [
      { label: "CoachCrono é o campeão", text: "pela chave dos perdedores, 9-3 no dia das finais segundo a publicação oficial", anchor: "vitoria" },
      { label: "Três italianos de quatro", text: "CoachCrono, SouL e Felixnxx; o quarto finalista é OrdinaryHarry", anchor: "italianos" },
      { label: "Uma só derrota antes da grande final", text: "contra SouL, o jogador que ele depois venceu para ficar com o título", anchor: "campanha" },
      { label: "Pigs em todos os trios", text: "Three Not So Little Pigs nos quatro, Van Helsing em três", anchor: "decks" },
      { label: "Uma semana de torneio", text: "cinco classificatórias, playoffs em eliminação dupla e as finais ao vivo", anchor: "torneio" },
      { label: "O que ainda falta", text: "o placar da grande final e as tabelas da Koin dos playoffs e das finais", anchor: "o-que-nao-sabemos" },
    ],
    body: `## CoachCrono é o campeão da Crimson Cup {#vitoria}

Parabéns, Coach. No domingo, 25 de outubro, [CoachCrono](/pt/u/coachcrono) venceu a Crimson Cup, o torneio com que a Koin Games encerrou a semana do Steam Next Fest. Quem anunciou foi apix, da Koin Games, no Discord oficial ("Congrats to @CoachCrono for winning our Origins Crimson Cup"), e a publicação oficial de Origins TCG no X resume assim: ele veio da chave dos perdedores, com um 9-3 no dia ("going 9-3 today").

O prêmio é o da imagem oficial do vencedor: a carta promo Dracula 1/1, dois cases de caixas de boosters e 1.500 dólares. CoachCrono também é Creator no OriginsMeta: os canais e os decks dele estão no seu perfil.

## Três italianos entre os quatro finalistas {#italianos}

Quatro jogadores chegaram às finais e três deles são italianos: CoachCrono, SouL e Felixnxx. O quarto é OrdinaryHarry. Num torneio aberto a todos, com classificatórias nas Américas, na Europa e na Ásia, é um resultado enorme para a cena italiana de Origins TCG.

A classificação final, segundo a chave dos playoffs no Tourney Bot e o anúncio da Koin:

1. CoachCrono
2. SouL
3. Felixnxx
4. OrdinaryHarry

## Como ele chegou lá {#campanha}

Os playoffs do sábado, 24 de outubro, foram em eliminação dupla, com partidas em melhor de três: quem perde uma vez cai para a chave dos perdedores, quem perde duas vezes está fora. CoachCrono venceu as suas seis primeiras partidas na chave dos vencedores, uma delas contra agraveinstream, outro creator do OriginsMeta, e parou na semifinal contra SouL, 0-2. Dali em diante não perdeu mais: 2-1 contra eotboltyou para entrar entre os quatro, depois, nas finais, 2-0 contra OrdinaryHarry, 2-0 contra Felixnxx e a grande final vencida contra SouL, que até então não tinha perdido nenhuma partida.

Do outro lado, SouL passou pela chave dos vencedores sem derrotas, com um 2-1 contra Felixnxx na final dos vencedores. Felixnxx tinha vencido OrdinaryHarry por 2-1 na outra semifinal. Toda a campanha, partida por partida, está na nossa [chave dos playoffs](/pt/analytics/crimson-cup/playoffs).

## Os decks das finais {#decks}

A Koin publicou as listas dos quatro finalistas no dia das finais: a partir do top 4 as decklists ficam públicas, como dizem as regras. O trio vencedor de CoachCrono:

- [Three Not So Little Pigs](/pt/cards/three-not-so-little-pigs): Bullseye, Glinda, Golden Egg, Guy of Gisborne, Mind Palace, Mummy, Obliterate, Reinforcements, Sandman, Stroke of Midnight, Three Blind Mice, Trash for Treasure;
- [Van Helsing](/pt/cards/van-helsing): Ali Baba, Baby Bear, Bridge Troll, Dark Omen, First Aid, Forbidden Knowledge, Phuong Hoang, Puck, Searing Light, Shahrazad, Spellbook, Tin Woodman;
- [Legion of the Dead](/pt/cards/legion-of-the-dead): Asanbosam, Baby Bear, Boogeyman, Bridge Troll, Dark Omen, En Passant, Golden Egg, Morgiana, Mummy, Obliterate, Paul Bunyan, Trash for Treasure.

Os trios dos outros: SouL levou Merlin, Mulan e Three Not So Little Pigs; Felixnxx, Van Helsing, Legion of the Dead e Three Not So Little Pigs; OrdinaryHarry, Mulan, Van Helsing e Three Not So Little Pigs.

Alguns números das 12 listas. Three Not So Little Pigs está no trio dos quatro, Van Helsing em três, Legion of the Dead e [Mulan](/pt/cards/mulan) em dois, [Merlin](/pt/cards/merlin) em um: as outras seis Lendárias não chegaram às finais. [Baby Bear](/pt/cards/baby-bear) é a carta mais presente (7 decks de 12), seguida de Golden Egg, Mind Palace, Obliterate e Tin Woodman (6). As listas completas, com o código do jogo e o link para o deck builder, estão na nossa [página da Crimson Cup](/pt/analytics/crimson-cup#finals).

## O torneio em resumo {#torneio}

A Crimson Cup foi o maior torneio de todos os tempos da Koin Games, como apix o chamou: cinco classificatórias abertas a todos entre 19 e 22 de outubro (AMER #1, EMEA #1, AMER #2, APAC e EMEA #2), 32 classificados de cada uma mais 96 wild cards, playoffs com 256 vagas em 24 de outubro e as finais em 25 de outubro, tudo ao vivo. O formato era Conquest: três decks com pelo menos 8 cartas únicas diferentes entre cada par, uma fase de ban e decklists ocultas até o top 4. Prêmios no valor total de 10.000 dólares. As regras em detalhe estão nas nossas [regras da Crimson Cup](/pt/news/crimson-cup-format-check-in).

Nas quatro classificatórias com tabelas oficiais da Koin, Van Helsing foi sempre a Lendária mais banida (de 44,4% na AMER #1 a 55,1% na EMEA #2), Three Not So Little Pigs a mais levada e Baby Bear a carta mais usada. As finais mostraram o mesmo meta: Pigs em todos os trios, Van Helsing em três, Baby Bear em sete decks de doze. Todos os números das classificatórias estão na nossa [página da Crimson Cup](/pt/analytics/crimson-cup).

## O que ainda não sabemos {#o-que-nao-sabemos}

- O placar da grande final: no Tourney Bot ela ficou sem resultado e a Koin não o publicou; a publicação oficial só dá o 9-3 do dia.
- As tabelas dos playoffs e das finais (bans, decks levados, cartas mais usadas): a Koin as publicou no Discord oficial depois das classificatórias, mas para os playoffs e as finais ainda não. Quando chegarem, vão para a nossa página da Crimson Cup.`,
    faq: [
      {
        q: "Quem venceu a Crimson Cup de Origins TCG?",
        a: "CoachCrono, em 25 de outubro de 2026: ele se recuperou pela chave dos perdedores e derrotou SouL na grande final. Quem anunciou foram a Koin Games, no Discord oficial, e Origins TCG, no X.",
      },
      {
        q: "Com quais decks CoachCrono venceu a Crimson Cup?",
        a: "Three Not So Little Pigs, Van Helsing e Legion of the Dead, no formato Conquest. As três listas completas, com o código do jogo, estão na página da Crimson Cup do OriginsMeta.",
      },
      {
        q: "Quem foram os finalistas da Crimson Cup?",
        a: "CoachCrono (primeiro), SouL (segundo), Felixnxx (terceiro) e OrdinaryHarry (quarto). Três dos quatro são italianos: CoachCrono, SouL e Felixnxx.",
      },
      {
        q: "O que CoachCrono ganhou?",
        a: "A carta promo Dracula 1/1, dois cases de caixas de boosters e 1.500 dólares, segundo a imagem oficial do vencedor.",
      },
    ],
  },
  "crimson-cup-meta-report-emea-1-amer-2": {
    title: "Meta Report da Crimson Cup: Van Helsing ainda é a mais banida, King Arthur divide a Europa e as Américas",
    metaTitle: "Crimson Cup de Origins TCG: números da EMEA #1 e da AMER #2",
    description:
      "Crimson Cup de Origins TCG, EMEA #1 e AMER #2 nos números da Koin: Van Helsing banida em 51,1% e 48,4%, King Arthur 6,3% na Europa, 24% nas Américas.",
    summary:
      "A Koin Games publicou os números oficiais de mais duas classificatórias da Crimson Cup, a EMEA #1 e a AMER #2. Van Helsing é de novo a Lendária mais banida (51,1% e 48,4%), Three Not So Little Pigs de novo a mais levada e Baby Bear de novo a carta mais usada. A novidade é King Arthur: banida em 6,3% das vezes na Europa, em 24% nas Américas. A nossa página da Crimson Cup agora coloca todas as classificatórias lado a lado.",
    highlights: [
      { label: "Van Helsing, banida em todo lugar", text: "a mais banida nas três classificatórias, 51,1% na EMEA #1 e 48,4% na AMER #2", anchor: "bans" },
      { label: "King Arthur divide as regiões", text: "6,3% de bans na Europa, 22,7% e 24% nas duas classificatórias das Américas", anchor: "king-arthur" },
      { label: "Robin Hood agora dá medo", text: "de 11,8% na AMER #1 a quase um ban a cada cinco", anchor: "robin-hood" },
      { label: "Pigs, de novo a mais levada", text: "cerca de um quarto dos decks, e banida um pouco mais a cada vez", anchor: "levadas" },
      { label: "Baby Bear em primeiro nas três", text: "50,1% e 46,1%; Bagheera e Stroke of Midnight entram no top 20", anchor: "cartas" },
      { label: "Todas as classificatórias comparadas", text: "uma seção nova da nossa página da Crimson Cup", anchor: "pagina" },
    ],
    body: `## Mais duas classificatórias, as mesmas tabelas {#numeros}

Depois da EMEA #1 (20 de outubro) e da AMER #2 (21 de outubro), a Koin Games publicou no seu Discord oficial as mesmas duas tabelas da primeira classificatória: a fase de ban de cada Lendária e as 20 cartas mais usadas nos decks entregues. Com três classificatórias de cinco, os números já podem ser comparados: o que se mantém de uma classificatória para a outra e o que muda entre a Europa e as Américas. Sobre a primeira, a AMER #1, está o nosso [Meta Report de 20 de outubro](/pt/news/crimson-cup-meta-report-amer-1).

## Van Helsing em primeiro, Merlin em segundo, três de três {#bans}

O ban rate diz quantas vezes uma Lendária foi banida nas vezes em que um adversário a encontrou no ban (as listas ficam ocultas até o top 4, então no ban só se veem as Lendárias: [as regras](/pt/news/crimson-cup-format-check-in#listas)).

| Lendária | AMER #1 | EMEA #1 | AMER #2 |
|---|---|---|---|
| Van Helsing | 44,4% | 51,1% | 48,4% |
| Merlin | 42,2% | 48,6% | 47,5% |
| Three Not So Little Pigs | 32,8% | 34,9% | 36,1% |
| Dorothy | 23,1% | 10,0% | 33,3% |
| King Arthur | 22,7% | 6,3% | 24,0% |
| Robin Hood | 11,8% | 19,6% | 18,6% |
| Mulan | 20,3% | 15,3% | 14,0% |
| Legion of the Dead | 19,2% | 15,4% | 10,6% |
| Queen of Hearts | 21,0% | 8,0% | 12,0% |
| Dracula | 14,1% | 14,5% | 9,2% |
| Wicked Stepmother | 11,1% | 0% | 8,3% |

Van Helsing foi banida 139 vezes em 272 na EMEA #1 e 90 em 186 na AMER #2: na Europa, mais de uma vez a cada duas. Merlin é a segunda nas três classificatórias, mesmo estando em menos de um deck a cada dez. Dorothy e Wicked Stepmother foram vistas no ban menos de 30 vezes por classificatória (Dorothy, 9 vezes na AMER #2): os números delas oscilam muito e dizem pouco.

## King Arthur: banida nas Américas, quase nunca na Europa {#king-arthur}

A maior diferença entre as classificatórias é King Arthur: banida 15 vezes em 66 na AMER #1 (22,7%), 4 em 63 na EMEA #1 (6,3%) e 18 em 75 na AMER #2 (24,0%). As amostras são parecidas, então não é acaso: nas duas classificatórias das Américas os jogadores a baniram mais ou menos uma vez a cada quatro; na Europa, quase nunca. Queen of Hearts mostra uma diferença menor no mesmo sentido (21,0% e 12,0% nas Américas, 8,0% na Europa). A nossa leitura: nas Américas o deck de King Arthur dá mais medo; a EMEA #2 vai dizer se a Europa o vê de outro jeito.

## Robin Hood não é mais a menos temida {#robin-hood}

Depois da AMER #1, Robin Hood era a menos banida entre as Lendárias vistas pelo menos 30 vezes (11,8%). Nas duas classificatórias seguintes ela foi banida quase uma vez a cada cinco: 20 vezes em 102 na EMEA #1 e 8 em 43 na AMER #2. Agora as menos temidas são outras: King Arthur na Europa (6,3%), Dracula (9,2%) e Legion of the Dead (10,6%) na AMER #2. Legion é banida cada vez menos (19,2%, 15,4%, 10,6%) e continua em cerca de um deck a cada dez.

## Pigs, a mais levada, e banida um pouco mais a cada vez {#levadas}

Parcela dos decks da tabela da Koin com cada Lendária:

| Lendária | AMER #1 | EMEA #1 | AMER #2 |
|---|---|---|---|
| Three Not So Little Pigs | 23,3% | 23,4% | 24,0% |
| Van Helsing | 18,7% | 19,7% | 20,1% |
| Legion of the Dead | 9,3% | 9,7% | 9,8% |
| Merlin | 9,8% | 9,7% | 9,0% |
| Dracula | 7,4% | 5,8% | 7,2% |
| Mulan | 6,7% | 8,3% | 7,0% |
| King Arthur | 6,4% | 5,7% | 6,5% |
| Robin Hood | 7,2% | 7,7% | 6,5% |
| Queen of Hearts | 6,5% | 6,7% | 6,5% |
| Dorothy | 3,2% | 2,3% | 2,2% |
| Wicked Stepmother | 1,5% | 0,9% | 1,2% |

Three Not So Little Pigs está em quase um deck a cada quatro em todas as classificatórias (216 decks na EMEA #1, 214 na AMER #2), e o ban rate dela sobe a cada vez: 32,8%, 34,9%, 36,1%. Pigs e Van Helsing juntas estão em mais de quatro decks a cada dez. A ordem das outras quase não se mexe: o meta do torneio é estável.

## As cartas: Baby Bear em primeiro, 15 cartas sempre no top 20 {#cartas}

Parcela de todos os decks entregues que têm a carta, como a Koin a publica, na ordem da AMER #2. O traço quer dizer que a carta não está no top 20 daquela classificatória: não é zero, e não a estimamos.

| # | Carta | AMER #2 | EMEA #1 | AMER #1 |
|---|---|---|---|---|
| 1 | Baby Bear | 46,1% | 50,1% | 47,2% |
| 2 | Mind Palace | 33,8% | 33,0% | 31,7% |
| 3 | Spellbook | 32,5% | 32,5% | 32,4% |
| 4 | Roo | 31,3% | 32,6% | 33,7% |
| 5 | Trash for Treasure | 29,0% | 31,0% | 29,9% |
| 6 | Golden Egg | 27,9% | 29,3% | 30,2% |
| 7 | Ali Baba | 26,9% | 28,8% | 28,2% |
| 8 | Scarecrow | 25,9% | 25,6% | 22,1% |
| 9 | Dark Omen | 25,7% | 28,7% | 27,4% |
| 10 | Impundulu | 24,7% | 21,1% | 22,3% |
| 11 | Bagheera | 23,5% | 22,7% | — |
| 12 | Tin Woodman | 23,3% | 25,4% | 21,6% |
| 13 | Sandman | 23,2% | 22,8% | 23,9% |
| 14 | Mummy | 22,2% | 26,6% | 24,9% |
| 15 | Bullseye | 21,8% | — | 21,6% |
| 16 | Defense Matrix | 21,2% | — | 22,1% |
| 17 | Forbidden Knowledge | 21,1% | 23,2% | 22,3% |
| 18 | En Passant | 21,0% | 23,5% | 21,7% |
| 19 | Shahrazad | 20,8% | — | 20,3% |
| 20 | Stroke of Midnight | 20,5% | 23,1% | — |

Baby Bear é a carta mais usada nas três classificatórias, em metade dos decks na Europa (50,1%). Spellbook não se mexe (32,4%, 32,5%, 32,5%). Quinze cartas estão no top 20 de todas as classificatórias. Bagheera e Stroke of Midnight entraram na EMEA #1 e ficaram na AMER #2; na EMEA #1 o top 20 também tinha Obliterate (23,8%), Jekyll (21,2%) e Reinforcements (21,0%), que não estão na tabela da AMER #2.

## O que isso significa para a APAC e a EMEA #2 {#proximas}

As duas últimas classificatórias, APAC e EMEA #2, são jogadas em 22 de outubro. A nossa leitura:

- Van Helsing e Merlin são banidas quase uma vez a cada duas em todo lugar: quem as leva deve contar com jogar com os outros dois decks;
- Pigs é a Lendária mais levada e a que é banida cada vez mais: quanto mais a levam, mais ela atrai o ban;
- na Europa, até agora, King Arthur quase nunca foi banida: se a EMEA #2 confirmar, lá ela é a Lendária com mais chances de ficar na mesa.

## Todas as classificatórias comparadas {#pagina}

A nossa [página da Crimson Cup](/pt/analytics/crimson-cup) tem uma seção nova, [as classificatórias comparadas](/pt/analytics/crimson-cup#across): ban rate, decks levados e cartas mais usadas com uma coluna por classificatória, todas juntas e a variação de uma classificatória para a outra. A página de cada classificatória continua como estava, com a comparação com a ladder; as páginas das cartas, como [King Arthur](/pt/cards/king-arthur) e [Baby Bear](/pt/cards/baby-bear), mostram os números da última classificatória.

## De onde vêm os números {#fontes}

- As tabelas que a Koin Games publicou no [Discord oficial](https://discord.gg/originstcg) depois da EMEA #1 (lidas em 21 de outubro de 2026) e depois da AMER #2 (lidas em 22 de outubro de 2026).
- Para a AMER #1, as tabelas lidas em 20 de outubro de 2026, no nosso [primeiro Meta Report](/pt/news/crimson-cup-meta-report-amer-1).`,
    faq: [
      {
        q: "Qual é a Lendária mais banida nas classificatórias da Crimson Cup?",
        a: "Van Helsing, nas três classificatórias com números oficiais: 44,4% na AMER #1, 51,1% na EMEA #1 e 48,4% na AMER #2, segundo a Koin Games. Merlin é a segunda todas as vezes (42,2%, 48,6%, 47,5%).",
      },
      {
        q: "O meta da Crimson Cup é diferente na Europa e nas Américas?",
        a: "Em geral, não: são banidas e levadas as mesmas Lendárias, e Baby Bear é a carta mais usada em todo lugar. A exceção é King Arthur, banida em 6,3% das vezes na EMEA #1 contra 22,7% e 24,0% nas duas classificatórias das Américas.",
      },
      {
        q: "Onde vejo os números de cada classificatória da Crimson Cup?",
        a: "Na nossa página da Crimson Cup no Analytics: uma aba por classificatória, com as tabelas da Koin e a comparação com a ladder, e uma seção que coloca todas as classificatórias lado a lado.",
      },
    ],
  },
  "crimson-cup-meta-report-amer-1": {
    title: "Meta Report da Crimson Cup: Van Helsing a mais banida, Pigs a mais levada na AMER #1",
    metaTitle: "Meta Report da Crimson Cup de Origins TCG: AMER #1",
    description:
      "Crimson Cup de Origins TCG, a AMER #1 nos números oficiais da Koin: Van Helsing banida em 44,4%, Pigs em 168 decks, Baby Bear em 47,2% e a ladder.",
    summary:
      "A Koin Games publicou os primeiros números oficiais da Crimson Cup, da classificatória AMER #1: quais Lendárias foram banidas, quais os jogadores levaram e as cartas mais usadas. Van Helsing é a mais banida (44,4%), Three Not So Little Pigs a mais levada (168 decks) e Baby Bear está em 47,2% dos decks. Todos os números, classificatória por classificatória e ao lado da ladder, estão na nossa nova página da Crimson Cup.",
    highlights: [
      { label: "Van Helsing, a que se bane", text: "banida em 44,4% das vezes em que foi vista, Merlin logo atrás com 42,2%", anchor: "bans" },
      { label: "Pigs, a mais levada", text: "168 decks, 23,3% dos entregues, e mesmo assim banida em 32,8%", anchor: "levadas" },
      { label: "Robin Hood, a menos temida", text: "banida só em 11,8%, e mesmo assim entre as mais fortes na ladder", anchor: "robin-hood" },
      { label: "Baby Bear em quase metade dos decks", text: "47,2%, depois Roo, Spellbook e Mind Palace", anchor: "cartas" },
      { label: "Torneio contra ladder", text: "Pigs e Van Helsing levadas mais do que são jogadas, Legion o contrário", anchor: "ladder" },
      { label: "Uma página para a Crimson Cup", text: "os números da Koin classificatória por classificatória, no Analytics e nas páginas das cartas", anchor: "pagina" },
    ],
    body: `## Os números que a Koin publicou {#numeros}

Depois da primeira classificatória da Crimson Cup, a AMER #1 de 19 de outubro, a Koin Games publicou no seu Discord oficial duas tabelas: a fase de ban de cada Lendária e as cartas mais usadas nos decks entregues. São totais: as listas ficam ocultas até o top 4 ([as regras](/pt/news/crimson-cup-format-check-in#listas)), então não mostram as listas individuais, mas dizem o que os jogadores temeram e em que confiaram. Reunimos esses números, ao lado da ladder, numa página nova: [os números da Crimson Cup](/pt/analytics/crimson-cup).

## O ban: primeiro Van Helsing, logo atrás Merlin {#bans}

Na Crimson Cup você só vê as três Lendárias do adversário e depois bane um dos decks dele. O ban rate diz quantas vezes uma Lendária foi banida nas vezes em que um adversário a encontrou no ban.

| Lendária | Ban rate | Banida / vista | Decks | Rodada mais avançada |
|---|---|---|---|---|
| Van Helsing | 44,4% | 96/216 | 135 | 4 |
| Merlin | 42,2% | 38/90 | 71 | 4 |
| Three Not So Little Pigs | 32,8% | 86/262 | 168 | 4 |
| Dorothy | 23,1% | 6/26 | 23 | 4 |
| King Arthur | 22,7% | 15/66 | 46 | 4 |
| Queen of Hearts | 21,0% | 13/62 | 47 | 4 |
| Mulan | 20,3% | 13/64 | 48 | 4 |
| Legion of the Dead | 19,2% | 19/99 | 67 | 4 |
| Dracula | 14,1% | 9/64 | 53 | 4 |
| Robin Hood | 11,8% | 8/68 | 52 | 4 |
| Wicked Stepmother | 11,1% | 1/9 | 11 | 3 |

Van Helsing foi banida quase uma vez a cada duas. A surpresa é Merlin: levada muito menos (71 decks), mas quando aparecia era banida em 42,2% das vezes, mesmo vencendo 48,1% na ladder. Dez Lendárias de onze tiveram um deck na rodada 4, a dos 32 classificados: só Wicked Stepmother parou na rodada 3.

## Pigs, a mais levada {#levadas}

Three Not So Little Pigs está em 168 decks, 23,3% dos contados na tabela da Koin: quase um deck a cada quatro, mais do que qualquer outra Lendária. Mesmo assim é banida em 32,8% das vezes, então quem a leva muitas vezes precisa vencer com os outros dois. Depois vem Van Helsing com 135 decks (18,7%), então Merlin (71) e Legion of the Dead (67); lá embaixo, Dorothy (23) e Wicked Stepmother (11).

## Robin Hood, a menos temida {#robin-hood}

Robin Hood é a menos banida entre as Lendárias vistas pelo menos 30 vezes: 8 bans em 68, 11,8%. E mesmo assim, na ladder, é uma das três mais fortes: vence 60,6%, ao lado de Pigs (60,7%) e Van Helsing (59,8%), e no nosso [Meta Report de 19 de outubro](/pt/news/meta-report-2026-10-19#triangulo) era a que vence Van Helsing. No torneio foi menos levada (52 decks, 7,2%) e quase nunca banida. A nossa leitura: neste momento é a Lendária que mais vezes fica na mesa.

## As cartas em quase metade dos decks {#cartas}

Parcela de todos os decks entregues que têm a carta, como a Koin publicou: conta todos os inscritos, não só quem jogou uma partida.

| # | Carta | Parcela dos decks | Decks |
|---|---|---|---|
| 1 | Baby Bear | 47,2% | 341 |
| 2 | Roo | 33,7% | 244 |
| 3 | Spellbook | 32,4% | 234 |
| 4 | Mind Palace | 31,7% | 229 |
| 5 | Golden Egg | 30,2% | 218 |
| 6 | Trash for Treasure | 29,9% | 216 |
| 7 | Ali Baba | 28,2% | 204 |
| 8 | Dark Omen | 27,4% | 198 |
| 9 | Mummy | 24,9% | 180 |
| 10 | Sandman | 23,9% | 173 |
| 11 | Impundulu | 22,3% | 161 |
| 12 | Forbidden Knowledge | 22,3% | 161 |
| 13 | Scarecrow | 22,1% | 160 |
| 14 | Defense Matrix | 22,1% | 160 |
| 15 | En Passant | 21,7% | 157 |
| 16 | Bullseye | 21,6% | 156 |
| 17 | Tin Woodman | 21,6% | 156 |
| 18 | Reinforcements | 21,3% | 154 |
| 19 | Obliterate | 20,9% | 151 |
| 20 | Shahrazad | 20,3% | 147 |

Baby Bear já era a carta mais usada do patch 0.7 na ladder, e no torneio está em quase metade dos decks. A Koin publica as 20 primeiras: as outras cartas não estão na tabela e não as estimamos.

## Torneio contra ladder {#ladder}

Ao lado da ladder, isto é, das partidas registradas com o OriginsMeta Tracker no patch 0.7 (lidas em 20 de outubro), as diferenças dizem em que os jogadores confiam quando importa:

- **Pigs e Van Helsing** são levadas ao torneio mais do que são jogadas na ladder: 23,3% dos decks contra 17,4% das aparições na ladder, e 18,7% contra 13,2%.
- **Legion of the Dead** vai ao contrário: 15,3% na ladder, 9,3% dos decks do torneio; Dracula, 10,6% contra 7,4%.
- Entre as cartas, quem mais cai é **Obliterate** (34,9% na ladder, 20,9% no torneio), **Golden Egg** e **Mummy**; sobem **Shahrazad** e **Scarecrow**. As duas medidas são diferentes (decks entregues, partidas registradas), então vale mais comparar as cartas entre si do que cada diferença isolada.

## O que isso muda para as próximas classificatórias {#proximas}

A nossa leitura para EMEA #1, AMER #2, APAC e EMEA #2:

- levar Van Helsing ou Pigs é contar com um ban, quase uma vez a cada duas com Van Helsing: o terceiro deck pesa tanto quanto os dois primeiros;
- Robin Hood é pouco banida e na ladder vence Van Helsing: é a Lendária com mais chances de ficar na mesa;
- Merlin atrai bans muito além dos seus resultados na ladder: num trio, ela pode tirar o ban dos seus outros dois decks.

## Uma página para a Crimson Cup {#pagina}

A partir de hoje o Analytics tem uma [página da Crimson Cup](/pt/analytics/crimson-cup) com os números oficiais da Koin classificatória por classificatória: ban rate, decks, cartas mais usadas e a comparação com a ladder. As páginas das Lendárias e das cartas mais usadas também mostram os seus números da Crimson Cup, como [Van Helsing](/pt/cards/van-helsing) e [Baby Bear](/pt/cards/baby-bear). Acrescentamos cada classificatória quando a Koin publica os números dela.

## De onde vem {#fontes}

- As tabelas que a Koin Games publicou no [Discord oficial](https://discord.gg/originstcg) depois da classificatória AMER #1, lidas em 20 de outubro de 2026.
- A ladder: partidas registradas com o OriginsMeta Tracker no patch 0.7, normais e ranqueadas juntas, lidas na nossa [página da Crimson Cup](/pt/analytics/crimson-cup) em 20 de outubro de 2026.`,
    faq: [
      {
        q: "Qual é a Lendária mais banida da Crimson Cup?",
        a: "Van Helsing: na classificatória AMER #1 de 19 de outubro de 2026 os adversários a baniram 96 vezes em 216 (44,4%), segundo os números oficiais da Koin Games. Em seguida vêm Merlin com 42,2% e Three Not So Little Pigs com 32,8%.",
      },
      {
        q: "Quais são as cartas mais usadas da Crimson Cup?",
        a: "Baby Bear, em 47,2% dos decks entregues para a AMER #1, depois Roo (33,7%), Spellbook (32,4%), Mind Palace (31,7%) e Golden Egg (30,2%). A Koin publica as 20 primeiras.",
      },
      {
        q: "As listas da Crimson Cup são públicas?",
        a: "Ainda não: elas ficam ocultas até o top 4. A Koin publica totais (bans, Lendárias e cartas mais usadas), que reunimos classificatória por classificatória na nossa página da Crimson Cup no Analytics.",
      },
    ],
  },
  "meta-report-2026-10-19": {
    title: "Meta Report de 19 de outubro: Pigs, Van Helsing e Robin Hood no topo do patch 0.7 no início da Crimson Cup",
    metaTitle: "Meta Report de Origins TCG de 19 de outubro: o meta",
    description:
      "O meta de Origins TCG em 19 de outubro com 2.478 partidas: o triângulo Pigs, Van Helsing e Robin Hood, os melhores arquétipos e cartas e o Conquest.",
    summary:
      "Nosso primeiro Meta Report, que vai sair toda segunda-feira: o estado do patch 0.7 a partir das 2.478 partidas registradas com o OriginsMeta Tracker, no dia em que começam as classificatórias da Crimson Cup. Três Lendárias vencem perto de 60% e se derrotam em círculo, o Controle é o arquétipo mais jogado e o Descarte o que mais vence, e nenhum patch de balanceamento vai chegar antes do torneio.",
    highlights: [
      { label: "Três Lendárias no topo", text: "Pigs 61,2%, Van Helsing 61,0%, Robin Hood 59,9%", anchor: "lendarias" },
      { label: "Um triângulo, não um rei", text: "Van Helsing vence Pigs, Pigs vence Robin Hood, Robin Hood vence Van Helsing", anchor: "triangulo" },
      { label: "Dracula e Legion, duas medidas", text: "abaixo de 50% contando os dois lados, bem mais alto para quem as registra", anchor: "duas-medidas" },
      { label: "Arquétipos e cartas", text: "o Controle é o mais jogado, Descarte e Swarm vencem mais, Obliterate fecha as partidas", anchor: "arquetipos" },
      { label: "Nenhum patch antes da Crimson Cup", text: "e o que os números dizem para os seus três decks do Conquest", anchor: "crimson-cup" },
    ],
    body: `## O que é o Meta Report {#meta-report}

A partir de hoje, toda segunda-feira, olhamos como o meta de Origins TCG está se movendo: quais Lendárias vencem, quais arquétipos e cartas estão subindo e o que os patches mudam. Os números vêm da nossa [página Analytics](/pt/analytics), feita com as partidas que os jogadores registram com o [OriginsMeta Tracker](/pt/tracker); as leituras são nossas, escritas com o que sabemos do jogo.

Esta é a edição zero, o ponto de partida: patch 0.7, com **2.478 partidas** registradas, normais e ranqueadas juntas. Na próxima segunda-feira vamos comparar com estes números.

## Três Lendárias no topo {#lendarias}

| Lendária | Win rate | Partidas |
|---|---|---|
| Three Not So Little Pigs | 61,2% | 709 |
| Van Helsing | 61,0% | 575 |
| Robin Hood | 59,9% | 362 |
| Queen of Hearts | 50,3% | 306 |
| Merlin | 45,9% | 368 |
| Legion of the Dead | 43,6% | 617 |
| Dracula | 43,3% | 436 |
| Mulan | 42,3% | 293 |
| King Arthur | 36,5% | 197 |
| Wicked Stepmother | 28,6% | 105 |
| Dorothy | 20,0% | 85 |

Aqui contam os dois lados de cada partida, então a média é 50%. Pigs, Van Helsing e Robin Hood continuam acima de 50% mesmo no ponto mais baixo da sua faixa provável; Queen of Hearts está exatamente na linha. Lá embaixo, as duas cartas que a Koin fortaleceu em 21 de setembro, Wicked Stepmother e Dorothy, ainda não bastam para fazer seus decks funcionarem. Tudo sobre cada Lendária está no nosso [guia das Lendárias](/pt/guides/origins-tcg-legendaries).

## Um triângulo, não um rei {#triangulo}

As três do topo não dominam umas às outras, elas se derrotam em círculo:

- **Van Helsing vence Pigs**, 56% das partidas entre elas;
- **Pigs vence Robin Hood**, 54% (28–33 do lado de Robin Hood em 61 partidas);
- **Robin Hood vence Van Helsing**, 55%.

Robin Hood também é o deck do confronto mais desequilibrado do patch: **26 vitórias em 30 contra Dracula**. Uma leitura nossa: não existe um melhor deck para copiar, existe um círculo para escolher, e isso pesa muito em um formato de três decks.

## Dracula e Legion: duas medidas que não batem {#duas-medidas}

Dracula (43,3%) e Legion of the Dead (43,6%) estão entre as mais jogadas e, contando os dois lados, abaixo de 50%. Mas, se olhamos só os decks de quem registra as próprias partidas, as mesmas duas Lendárias vencem bem mais: em 18 de outubro Dracula estava com 75,9% e Legion com 74,0% desse lado. Até a versão 0.4.7 de 14 de outubro, o Tracker também registrava as partidas contra bots, e Dracula é o chefe das missões da demo: parte dessas "derrotas de Dracula" provavelmente eram bots. Enquanto não limparmos a amostra, nenhuma das duas medidas pode ser lida sozinha, e não vamos dizer que esses dois decks são fracos.

## Arquétipos e cartas {#arquetipos}

Arquétipos e cartas contam só os decks de quem registra, que vence 66,0% das suas partidas: eles se leem uns contra os outros, não contra 50%.

- O **Controle** é o arquétipo mais jogado (38% das partidas) e vence 66,7%, bem na média.
- O **Descarte** (75,7%, 210 partidas) e o **Swarm** (75,6%, 127) são os que mais vencem; o **Midrange** (63,1%, 33% das partidas) e o **Combo** (61,4%) ficam abaixo.
- **Baby Bear** está em 53% dos decks registrados: a carta mais jogada do patch.
- **Obliterate**, quando é jogada, vence 87,3% das vezes, por volta da rodada 8: é a carta que fecha as partidas.
- **Wicked Stepsisters** passa de 26,7% no deck para 64,5% quando é jogada: uma carta situacional que vence quando encontra o seu momento, não uma carta fraca.

## Patches: nada de novo antes da Crimson Cup {#patch}

O patch 0.7 de 29 de setembro é o último de balanceamento antes do torneio, e a [demo 0.7.1 de 15 de outubro](/pt/news/demo-patch-notes-0-7-1) trouxe a ranqueada, mas nenhuma mudança de balanceamento, então as partidas dela contam como 0.7. No AMA de 2 de outubro, a Koin disse que as cartas não serão mexidas antes da Crimson Cup: se aparecer um problema grave, a carta é banida. O meta que descrevemos aqui é, portanto, o do torneio.

## O que isso significa para a Crimson Cup {#crimson-cup}

A nossa leitura para quem leva três decks ao [Conquest](/pt/guides/origins-tcg-conquest), em que o oponente bane um:

- dois do triângulo são uma base sólida, mas, seja qual for a dupla que você levar, uma das três vence uma das suas;
- o terceiro deck cobre esse buraco: contra Pigs, Van Helsing; contra Van Helsing, Robin Hood;
- o ban é a decisão que mais pesa: procure o deck dele que vence dois dos seus, não o mais forte em termos absolutos.

O calendário das classificatórias e onde assisti-las estão no [artigo de hoje](/pt/news/crimson-cup-qualifiers-where-to-watch).

## Como lemos os números {#metodo}

- Fonte: partidas registradas com o OriginsMeta Tracker no patch 0.7, normais e ranqueadas juntas; lidas em 19 de outubro de 2026.
- Lendárias e confrontos contam os dois jogadores; decks, arquétipos e cartas só quem registra.
- As classificações usam o win rate prudente, a borda inferior da faixa provável, assim 300 partidas contam mais que 30.
- Todos os números estão na [página Analytics](/pt/analytics), atualizada a cada cinco minutos. Se você joga, registre as suas partidas: quanto mais houver, mais fiel será o report da próxima segunda-feira.`,
    faq: [
      {
        q: "Qual é a Lendária mais forte de Origins TCG agora?",
        a: "Em 19 de outubro de 2026, no patch 0.7, três Lendárias vencem perto de 60% contando os dois lados de cada partida: Three Not So Little Pigs (61,2%), Van Helsing (61,0%) e Robin Hood (59,9%). Elas se derrotam em círculo, então nenhuma é a melhor contra todas.",
      },
      {
        q: "De onde vêm os números do Meta Report?",
        a: "Das partidas que os jogadores registram com o OriginsMeta Tracker, o nosso app para Windows, mostradas na página Analytics do OriginsMeta. Lendárias e confrontos contam os dois jogadores; decks, arquétipos e cartas contam só quem registra.",
      },
      {
        q: "Vai haver um patch de balanceamento antes da Crimson Cup?",
        a: "Não. O patch 0.7 de 29 de setembro de 2026 é o último de balanceamento antes do torneio, e a Koin disse que as cartas não serão mexidas antes da Crimson Cup: uma carta com um problema grave seria banida.",
      },
    ],
  },
  "crimson-cup-qualifiers-where-to-watch": {
    title: "Classificatórias da Crimson Cup: datas e horários, onde assistir e o Broadcasting OM para quem transmite",
    metaTitle: "Crimson Cup de Origins TCG: datas e onde assistir",
    description:
      "Classificatórias da Crimson Cup de Origins TCG de 19 a 22 de outubro: datas, horários, check-in, onde assistir na Twitch e o Broadcasting OM, nosso overlay.",
    summary:
      "A Crimson Cup começa hoje à noite, 19 de outubro, com a classificatória AMER às 19:00 EST: cinco classificatórias até 22 de outubro, depois os playoffs no dia 24 e as finais no dia 25. A Koin Games transmite todos os eventos no seu canal oficial da Twitch, que também aparece na página inicial do OriginsMeta enquanto está ao vivo, e qualquer pessoa pode fazer co-stream. Para quem faz, criamos o Broadcasting OM: um overlay gratuito para o OBS com nomes, placar, os três decks e as cartas que restam em cada lista.",
    highlights: [
      { label: "Cinco classificatórias, de 19 a 22 de outubro", text: "a primeira é AMER hoje às 19:00 EST, a última EMEA na quinta-feira às 19:00 CEST", anchor: "calendario" },
      { label: "Check-in e inscrições", text: "o check-in abre duas horas antes e fecha cinco minutos antes do início, junto com os seus decks", anchor: "check-in" },
      { label: "Onde assistir", text: "o canal oficial da Koin na Twitch, na nossa página inicial enquanto está ao vivo, e os co-streams dos creators", anchor: "onde-assistir" },
      { label: "Broadcasting OM", text: "o nosso overlay gratuito para transmitir uma partida: nomes, placar, três decks, cartas restantes, patrocinadores", anchor: "broadcasting-om" },
      { label: "Como configurar no OBS", text: "um painel de controle e uma fonte de navegador, em cinco minutos", anchor: "obs" },
    ],
    body: `## Datas e horários das classificatórias {#calendario}

A Crimson Cup (Copa Crimson no jogo), o torneio da Koin Games para o Steam Next Fest, começa hoje à noite. São cinco classificatórias, cada uma com 512 vagas, abertas a todos, de qualquer lugar do mundo, e 32 jogadores avançam de cada uma:

| Dia | Horário oficial | Região |
|---|---|---|
| Segunda-feira, 19 de outubro | 19:00 EST | AMER (adicionada em 5 de outubro) |
| Terça-feira, 20 de outubro | 19:00 CEST | EMEA |
| Quarta-feira, 21 de outubro | 21:00 EST | AMER |
| Quinta-feira, 22 de outubro | 19:00 SGT | APAC |
| Quinta-feira, 22 de outubro | 19:00 CEST | EMEA (adicionada em 5 de outubro, fecha as classificatórias) |

Aos 160 classificados se juntam 96 wild cards: 256 jogadores nos **playoffs de sábado, 24 de outubro, às 10:00 EST** (16:00 CEST, 22:00 SGT), e quatro deles chegam às **finais de domingo, 25 de outubro, às 10:00 EST**. Os horários são os da arte oficial da Koin, sem conversões nossas. A premiação, com a carta promocional 1/1 de Dracula, está no nosso [artigo sobre prêmios e classificatórias](/pt/news/crimson-cup-prizepool-qualifiers#premios).

## Check-in, inscrições e formato {#check-in}

- As **inscrições** são feitas no [Discord oficial](https://discord.gg/originstcg). Você pode se inscrever em mais de uma classificatória, mas a Koin pede que você se inscreva só naquelas em que realmente pode estar.
- O **check-in** abre duas horas antes de cada classificatória e fecha cinco minutos antes do início, junto com o envio dos decks: quem perde o check-in não joga ([as regras](/pt/news/crimson-cup-format-check-in#check-in)).
- **Formato**: [Conquest](/pt/guides/origins-tcg-conquest) com três decks, partidas em melhor de três, decklists ocultas até o top 4 (no ban você só vê a Lendária), grande final em melhor de cinco. Sete locais estão fora do pool: a lista está no [artigo da premiação](/pt/news/crimson-cup-prizepool-qualifiers#locais).
- A página 8 do regulamento trata de problemas técnicos e do acompanhamento dos decks: leia antes da sua primeira partida ([o que mudou em 14 de outubro](/pt/news/playtest-closing-crimson-cup-twitch#regulamento)).

Se você ainda está escolhendo os seus três decks, comece pelos [decks de torneio](/pt/decks/tournament) e pelo [deck builder](/pt/deck-builder), que verifica a regra do Conquest para você.

## Onde assistir às partidas {#onde-assistir}

- **O canal oficial da Koin na Twitch**, [twitch.tv/originstcg](https://www.twitch.tv/originstcg): a Koin anunciou em 14 de outubro que vai transmitir ali todos os eventos da Crimson Cup.
- **A [página inicial](/pt) do OriginsMeta**: enquanto o canal oficial está ao vivo em Origins TCG, a transmissão oficial ocupa o lugar do nosso slider, que volta quando a transmissão termina.
- **Os co-streams dos creators**: a Koin permite que qualquer pessoa faça co-stream da Crimson Cup ou transmita as próprias partidas. Na nossa [página Ao vivo](/pt/live) você encontra os creators que estão ao vivo em Origins TCG agora, com o player de cada um.

## Broadcasting OM: o nosso overlay para transmitir uma partida {#broadcasting-om}

Se você vai fazer co-stream da Crimson Cup, ou narrar um torneio seu, o OriginsMeta oferece um overlay gráfico gratuito para colocar sobre o jogo: o **Broadcasting OM**. Ele tem duas páginas:

- o **painel de controle**, [originsmeta.com/broadcast](https://originsmeta.com/broadcast), onde você preenche a partida;
- o **overlay**, [originsmeta.com/broadcast/live](https://originsmeta.com/broadcast/live), com fundo transparente, feito para uma fonte de navegador do OBS em 1920 × 1080.

O que ele mostra na transmissão:

- as **placas com os nomes dos dois jogadores**, com Deck 1, 2 e 3 e um ponto no deck em jogo;
- o **placar da série**, com o nome do torneio, a fase (classificatória, playoffs, finais) e o formato (Bo1, Bo3, Bo5);
- as **decklists**, à esquerda, à direita ou ocultas, com as **cópias restantes** de cada carta: no painel de controle, um clique em uma carta marca uma cópia como jogada, e "Next game" devolve todas;
- a **carta inteira ao passar o mouse**, com custo, poder, vida, tipo e texto no idioma do overlay (inglês, italiano, espanhol ou francês), e um botão **Copy deck** com o código do jogo;
- um **espaço para patrocinadores** opcional, que se alterna com o placar (20 segundos de placar e 7 de patrocinador por padrão, ambos ajustáveis), com até três logos ou banners para enviar;
- a frase "não afiliado à Koin Games", sempre na tela.

A partida pode ser preenchida de quatro jeitos: com a tag de um torneio do [organizador de torneios do OriginsMeta](/pt/tournaments) (OM-XXXX), com o link de um [deck de torneio](/pt/decks/tournament) publicado no site, colando o código do deck do jogo ou à mão. "Demo match" carrega um exemplo para testar.

**Uma regra da Crimson Cup para respeitar**: as decklists ficam ocultas até o top 4. Até lá, mantenha as listas ocultas e use só as placas com os nomes e o placar; a partir do top 4 você pode mostrá-las.

## Como configurar no OBS {#obs}

1. Abra [originsmeta.com/broadcast](https://originsmeta.com/broadcast) como dock no OBS: Docks → Custom Browser Docks, cole o endereço.
2. Adicione o overlay como fonte: Fontes → + → Navegador, endereço [originsmeta.com/broadcast/live](https://originsmeta.com/broadcast/live), largura 1920, altura 1080, acima da captura do jogo.
3. Preencha a partida no dock: o overlay se atualiza na hora, porque os dois estão no mesmo OBS.

Se o overlay roda em outro lugar (outro PC, um co-narrador), copie o endereço do overlay no painel de controle: ele leva o estado daquele momento, então copie de novo depois de cada mudança. Para os decks das suas próprias partidas também existem o comando de chat !deck e o overlay do deck, explicados no nosso [guia para transmissões](/pt/guides/streaming-tools).

## Ainda em teste: o que falta {#em-teste}

O Broadcasting OM é uma primeira versão, lançada a tempo da Crimson Cup. Nada fica salvo nos nossos servidores: o estado, imagens dos patrocinadores incluídas, fica no seu navegador. Os espectadores na Twitch ainda não podem clicar no overlay (isso precisa de uma extensão da Twitch, que virá depois), e placar e cópias são atualizados à mão no painel de controle. Se você usar durante as classificatórias, conte o que falta no [nosso Discord](https://discord.gg/54EctHTZzM).

## De onde vem {#fontes}

- O post da Koin Games no Steam de 5 de outubro de 2026, ["Prizepool announcement & key update to our biggest tournament ever"](https://store.steampowered.com/news/app/4429430/view/1845383656394214), e a sua arte oficial com o calendário.
- As regras anunciadas no [Discord oficial](https://discord.gg/originstcg) em 24 de setembro e o anúncio da Twitch de 14 de outubro de 2026.
- O Broadcasting OM é uma ferramenta do OriginsMeta, não da Koin Games.`,
    faq: [
      {
        q: "Quando são as classificatórias da Crimson Cup?",
        a: "Cinco classificatórias de 19 a 22 de outubro de 2026: AMER na segunda-feira, 19, às 19:00 EST, EMEA na terça-feira, 20, às 19:00 CEST, AMER na quarta-feira, 21, às 21:00 EST, APAC na quinta-feira, 22, às 19:00 SGT e EMEA na quinta-feira, 22, às 19:00 CEST. Playoffs em 24 de outubro e finais em 25 de outubro, ambos às 10:00 EST.",
      },
      {
        q: "Onde posso assistir à Crimson Cup?",
        a: "No canal oficial da Koin Games na Twitch, twitch.tv/originstcg, que transmite todos os eventos; enquanto ele está ao vivo, a transmissão também aparece na página inicial do OriginsMeta. Os creators podem fazer co-stream, e a página Ao vivo do OriginsMeta lista os que estão ao vivo em Origins TCG.",
      },
      {
        q: "O que é o Broadcasting OM?",
        a: "Um overlay gratuito do OriginsMeta para transmitir uma partida de Origins TCG no OBS: nomes, placar da série, os três decks com as cartas restantes, prévia das cartas, código do deck e espaço para patrocinadores. Você preenche em originsmeta.com/broadcast e adiciona originsmeta.com/broadcast/live como fonte de navegador. Não é uma ferramenta da Koin Games.",
      },
    ],
  },
  "demo-patch-notes-0-7-1": {
    title: "Demo 0.7.1 de Origins TCG: o modo ranqueado chega antes do Steam Next Fest, com cerca de 100 bugs corrigidos",
    metaTitle: "Demo 0.7.1 de Origins TCG: chega o modo ranqueado",
    description:
      "Demo 0.7.1 de Origins TCG de 15 de outubro: a ranqueada abre quatro dias antes do Steam Next Fest, você vê o mulligan do oponente e há cerca de 100 correções.",
    summary:
      "Em 15 de outubro, a Koin Games atualizou a demo de Origins TCG no Steam para a versão 0.7.1, no dia em que o playtest fechou. A grande novidade é o modo ranqueado, quatro dias antes do Steam Next Fest: por enquanto a escada para no Grandmaster. A atualização também traz uma nova tela inicial e novos tapetes de jogo, mostra quantas cartas o seu oponente trocou no mulligan e corrige cerca de 100 bugs. Não há mudanças de balanceamento: as estatísticas das cartas continuam as do patch 0.7.",
    highlights: [
      { label: "O modo ranqueado chegou", text: "quatro dias antes do Steam Next Fest; por enquanto a escada para no Grandmaster", anchor: "ranqueada" },
      { label: "Missões na ranqueada ou em PvE", text: "você escolhe onde completá-las", anchor: "missoes" },
      { label: "O mulligan do oponente", text: "você vê quantas cartas ele trocou", anchor: "mulligan-do-oponente" },
      { label: "Nova tela inicial e tapetes de jogo", text: "ainda em construção, com uma pista sobre o futuro", anchor: "tela-inicial-tapetes" },
      { label: "O seu idioma, bots mais rápidos, cerca de 100 correções", text: "mais uma busca mais esperta na coleção e vozes novas", anchor: "melhorias" },
      { label: "Problemas conhecidos", text: "velocidade do jogo, visuais do grading ainda ausentes, traduções em andamento", anchor: "problemas-conhecidos" },
      { label: "Nenhuma mudança de balanceamento", text: "as estatísticas das cartas no OriginsMeta não mudam", anchor: "o-que-nao-muda" },
    ],
    body: `## Uma pequena atualização antes do Steam Next Fest {#atualizacao}

Em 15 de outubro, a Koin Games atualizou a demo principal de Origins TCG no Steam para a versão 0.7.1. O post no Steam, com o título "Ranked is here!", saiu às 20:52 UTC; o número da versão está na imagem oficial da atualização, "Steam Demo Update 0.7.1". "Esta atualização é pequena", escreve a equipe, mas ela quis colocar na demo algumas correções e recursos de qualidade de vida antes do Steam Next Fest, que começa em 19 de outubro.

Ela chega no mesmo dia em que o playtest fechou ([nosso artigo](/pt/news/playtest-closing-crimson-cup-twitch)): de agora em diante a demo é a única build para jogar, e também é a build da Crimson Cup ([nosso guia do Next Fest e do torneio](/pt/guides/steam-next-fest-2026)). Várias mudanças são as que o playtest recebeu com a [versão 0.7.1 de 8 de outubro](/pt/news/playtest-patch-notes-0-7-1); a ranqueada, a nova tela inicial, os tapetes de jogo e o idioma na abertura são novos.

## O modo ranqueado chegou {#ranqueada}

"Já se passaram 84 anos... mas o modo ranqueado finalmente chegou!", escreve a equipe. Você sobe na escada e ganha prêmios, junto com "a dura constatação de que todo mundo acima de você é, de algum jeito, melhor neste jogo". Por enquanto a escada para no Grandmaster, a divisão mais alta, e a Koin diz que vai "abrir essas portas em breve".

Em 21 de setembro a Koin tinha escrito que a ranqueada seria ligada com o início do Steam Next Fest: ela chegou quatro dias antes. No AMA de 2 de outubro, a equipe tinha dado datas "escritas a lápis": uma temporada de 19 de outubro a 4 de dezembro e um ranking Grandmaster fechado durante o festival e aberto a partir de 27 de outubro, para que todos comecem ao mesmo tempo ([nosso artigo](/pt/news/building-origins-ama-design-balance#ranqueada)). As notas do patch confirmam que o Grandmaster está fechado por enquanto, mas não dizem se a temporada conta a partir de hoje ou começa em 19 de outubro. Como a ranqueada funciona, divisões e Pontos de Vitória incluídos, está no [nosso guia da ranqueada](/pt/guides/origins-tcg-ranked).

### Missões na ranqueada ou em PvE {#missoes}

As missões agora podem ser completadas em PvE, pela seção Missões, ou em PvP, pela ranqueada: você escolhe. É a mesma escolha que o playtest recebeu em 8 de outubro, depois que a build de 1º de outubro tinha deixado as missões só em PvE.

## As novidades {#novidades}

### O mulligan do oponente {#mulligan-do-oponente}

Durante a fase de mulligan, agora você vê quantas cartas o seu oponente trocou. Os jogadores pediram isso no Discord, e a equipe diz que a ideia era tão boa que a implementou já no dia seguinte.

### Nova tela inicial e tapetes de jogo {#tela-inicial-tapetes}

- **Tela inicial:** "um bom número" de melhorias na interface. A equipe diz que ainda está em construção.
- **Tapetes de jogo:** a tela inicial e a partida têm um tapete novo. "Ah, o que será que isso pode significar no futuro?", acrescenta a equipe, sem dizer mais nada.

### Commanders, tabuleiro e introdução {#commanders-tabuleiro}

- Os **Commanders**, como as notas os chamam, agora dizem uma fala e mostram a sua placa com o nome quando você os inspeciona.
- **Efeitos no tabuleiro:** clicar pelo tabuleiro dispara efeitos visuais e sonoros. Os dois são provisórios, e a equipe pede aos jogadores que os "julguem só mais ou menos".
- **Cinemática de introdução:** um filme de introdução é exibido uma vez. Ele ainda precisa de acabamento, e a equipe quer opiniões no Discord.

## As melhorias {#melhorias}

### A busca na coleção {#busca-na-colecao}

A busca na coleção aceita frases com várias palavras, e procurar algo que uma carta invoca também encontra a carta que o invoca. No OriginsMeta, a busca em [Cartas](/pt/cards) e no [deck builder](/pt/deck-builder) já olha os nomes e o texto das cartas.

### Emotes e vozes {#emotes-vozes}

- No seletor de emotes agora você pode esvaziar um espaço, então montar o seu conjunto de emotes ficou um pouco mais fácil.
- Huck Finn e Christopher Robin têm vozes novas: "não soam mais como homens de meia-idade assustadores". Os jogadores tinham dito isso, e a equipe escreve que internamente todo mundo dizia o mesmo.

### O jogo abre no seu idioma {#idioma}

Agora o jogo deve abrir no seu idioma, se o seu sistema estiver configurado em um que o jogo suporta. O patch 0.7 tinha levado o jogo a 13 idiomas ([nosso artigo](/pt/news/patch-0-7)).

### Bots mais rápidos {#bots}

Os oponentes controlados pelo computador não jogam mais tão devagar. A equipe diz que ainda há o que fazer, mas espera que a diferença apareça.

### Cerca de 100 bugs corrigidos {#bugs-corrigidos}

Pelas contas da equipe, a atualização corrige cerca de 100 bugs. As notas não os listam.

## Problemas conhecidos {#problemas-conhecidos}

- **Velocidade do jogo e animações.** Algumas coisas estão mais rápidas, mas ainda há "MUITO a fazer": continua sendo uma das maiores prioridades da equipe.
- **Visuais do grading.** Eles não entraram nesta atualização; a Koin diz que deve ter algo para mostrar "muito em breve". O que é o grading, com os sets e a Alpha Edition, está no [nosso artigo](/pt/news/origins-sets-alpha-edition-grading).
- **Outros idiomas.** Se você joga em um idioma que não seja o inglês, as traduções ainda estão em andamento e há muito texto provisório.

## O que não muda {#o-que-nao-muda}

- **Nenhuma mudança de balanceamento.** As estatísticas das cartas continuam as do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro, o último de balanceamento antes da Crimson Cup: as páginas das cartas, o [deck builder](/pt/deck-builder) e o [MetaShifting](/pt/metashifting) não mudam, e os decks publicados não precisam ser atualizados.
- **Como jogar a demo** continua igual: o nosso [guia para jogar a demo](/pt/guides/play-the-demo).

## O que ainda não sabemos {#o-que-nao-sabemos}

- Se a temporada ranqueada conta a partir de 15 de outubro ou recomeça em 19 de outubro com o Steam Next Fest.
- Quais prêmios a ranqueada dá, e quando exatamente as portas do Grandmaster se abrem: o AMA disse 27 de outubro, a lápis.
- O que os novos tapetes de jogo significam.
- Quando chegam os visuais do grading, e quais bugs foram corrigidos.

## De onde vêm estas notas {#fontes}

O post "Ranked is here!" que a Koin Games publicou na [página de Origins TCG no Steam](https://store.steampowered.com/news/app/4429430/view/1846651706679257) em 15 de outubro de 2026, e a sua imagem oficial, que dá o número da versão 0.7.1.`,
    faq: [
      {
        q: "O modo ranqueado está disponível na demo de Origins TCG?",
        a: "Sim, desde a demo 0.7.1 de 15 de outubro de 2026, quatro dias antes do Steam Next Fest. Por enquanto a escada para no Grandmaster: a Koin diz que vai abrir essa divisão em breve, e no AMA de 2 de outubro a equipe tinha marcado, a lápis, 27 de outubro.",
      },
      {
        q: "A demo 0.7.1 muda as estatísticas das cartas?",
        a: "Não. Ela não tem mudanças de balanceamento: as estatísticas das cartas continuam as do patch 0.7 de 29 de setembro de 2026, o último de balanceamento antes da Crimson Cup, e as páginas das cartas no OriginsMeta não mudam.",
      },
      {
        q: "As partidas ranqueadas contam para as missões na demo de Origins TCG?",
        a: "Sim. Desde a demo 0.7.1 você pode completar as missões em PvP pela ranqueada, ou em PvE pela seção Missões.",
      },
    ],
  },
  "originsmeta-one-month": {
    title: "Um mês atrás, à uma da manhã: o OriginsMeta completa trinta dias",
    metaTitle: "Origins TCG: o OriginsMeta faz um mês, obrigado",
    description:
      "O OriginsMeta, o fan site de Origins TCG, faz um mês: 6.800 visitantes, 1.900 códigos de deck copiados, quatro idiomas e o que vem por aí. Obrigado.",
    summary:
      "Em 15 de setembro, à uma da manhã, colocamos o OriginsMeta no ar. Achávamos que tínhamos feito um banco de dados de cartas com um deck builder. Um mês depois, temos milhares de pessoas que passaram por aqui, quatro idiomas, um app que registra partidas e uma Crimson Cup logo ali. Este é o nosso obrigado, com alguns números e algumas promessas.",
    highlights: [
      { label: "Uma noite de setembro", text: "uma ideia em 14 de setembro, o site no ar à uma da manhã, o primeiro deck da comunidade à tarde", anchor: "inicio" },
      { label: "Os seus números", text: "mais de 6.800 pessoas, 47.000 páginas, 1.900 códigos de deck copiados, 850 partidas registradas", anchor: "numeros" },
      { label: "O que construímos", text: "metade nasceu de uma mensagem no Discord ou de um feedback", anchor: "ferramentas" },
      { label: "O que vem por aí", text: "Steam Next Fest, Crimson Cup, a primeira tier list do OriginsMeta, o Kickstarter e uma extensão para a Twitch", anchor: "o-que-vem" },
      { label: "Obrigado", anchor: "obrigado" },
    ],
    body: `## Uma noite de setembro {#inicio}

O OriginsMeta nasceu de uma nota no celular, na noite de 14 de setembro: "ideia para um site". Compramos o domínio na mesma noite. À uma da manhã a primeira versão estava no ar, às oito e meia já havia o deck builder e, à tarde, o banco de dados de cartas estava completo.

Às 17:30 aconteceu algo que nos fez pensar que talvez tivéssemos feito a coisa certa: Luigi "[Davdas](/pt/authors/davdas)" Ragoni publicou o primeiro deck da comunidade, Healing Healsing. Um site de decks sem decks é uma vitrine vazia, mas a partir daquele momento o nosso site começou a funcionar: a vitrine nunca mais ficaria vazia.

## O que vocês nos deram em trinta dias {#numeros}

Não esperávamos esses números. Não queremos dizer se são muitos ou poucos: queremos dizer que são os "nossos" números, de toda a comunidade.

- Mais de 6.800 pessoas passaram por aqui e, até agora, mais de 47.000 páginas foram abertas. Nos melhores dias, mais de 350 usuários únicos visitaram o site.
- Vocês copiaram 1.900 vezes um código de deck para levá-lo ao jogo. É o número que mais nos importa: quer dizer que o site ajuda os jogadores a jogar.
- Vocês nos leem sobretudo da Itália (45%), mas também dos Estados Unidos (14%), da Espanha (6%), da França (5%), da Alemanha (4%), de Singapura (4%) e do Brasil (2%), e todo dia chega gente de outros países.

Por isso o espanhol chegou no fim de setembro e o francês em 8 de outubro.

Há mais de 60 [decks](/pt/decks) no banco de dados e, com o [OriginsMeta Tracker](/pt/tracker), vocês registraram mais de 850 partidas, que hoje formam todos os dados do nosso [Analytics](/pt/analytics).

Por trás de tudo isso há também mais de 400 atualizações do site, 122 cartas conferidas uma a uma no jogo e algumas boas noites sem dormir.

## O que construímos {#ferramentas}

Relendo as anotações deste mês, o que chama a atenção é que metade dos recursos do site, o Tracker, o Analytics e muitas outras ideias, nasceu de uma mensagem no Discord ou de um feedback. Nunca vamos agradecer o suficiente por isso! Continuem mandando!

## E agora? {#o-que-vem}

As próximas duas semanas são as mais importantes desde que Origins existe, e queremos estar lá.

- A partir de 19 de outubro tem o Steam Next Fest, com a ranqueada e a Crimson Cup. Vamos acompanhar o torneio dia a dia: o calendário está no nosso [guia do Next Fest](/pt/guides/steam-next-fest-2026).
- Depois da Crimson Cup vai sair a primeira [tier list](/pt/tier-list) do OriginsMeta, feita com os resultados do torneio e não com as nossas opiniões.
- Em 27 de outubro começa o [Kickstarter da Alpha Edition](/pt/guides/origins-tcg-kickstarter), e vamos contar tudo aqui.
- Um pequeno spoiler: estamos trabalhando dia e noite no nosso primeiro overlay para a Twitch, uma extensão que vai deixar você ver o deck e as cartas do seu streamer favorito quando quiser, ao vivo, durante as partidas dele.
- Mais adiante, sem datas, porque não queremos prometer o que ainda não sabemos se conseguimos entregar: um site mais fácil de usar no celular e no tablet, talvez um app próprio? Deixa a gente cozinhar!

## Obrigado, de verdade {#obrigado}

A todos que publicaram um deck, a quem votou, a quem nos escreveu "isso aqui não funciona" a qualquer hora do dia e da noite, a quem instalou um app feito por uns desconhecidos para nos ajudar a contar partidas: o OriginsMeta também é, e sobretudo, de vocês. Continuem nos dizendo o que falta no [nosso Discord](https://discord.gg/RAG7nnrNGP). A lista de tarefas do segundo mês já está longa… e gostamos que seja assim!

*Luigi, Pierluigi e toda a equipe do OriginsMeta*`,
  },
  "playtest-closing-crimson-cup-twitch": {
    title: "O playtest de Origins TCG fecha em 15 de outubro: Crimson Cup na Twitch, co-streaming e regulamento atualizado",
    metaTitle: "Origins TCG: fim do playtest, Crimson Cup na Twitch",
    description:
      "O playtest de Origins TCG fecha em 15 de outubro depois de mais de 100.000 partidas. A Koin abre um canal na Twitch para a Crimson Cup e libera o co-stream.",
    summary:
      "Em 14 de outubro, a Koin Games anunciou no Discord oficial que o playtest de Origins TCG fecha no dia seguinte, depois de mais de 100.000 partidas, e que uma atualização da demo principal está a caminho. Todos os eventos da Crimson Cup serão transmitidos em um novo canal oficial da Twitch, qualquer pessoa pode fazer co-stream deles, e a página 8 do regulamento agora explica como lidar com problemas técnicos e com o acompanhamento dos decks.",
    highlights: [
      { label: "O playtest fecha em 15 de outubro", text: "mais de 100.000 partidas jogadas, e vem aí uma atualização da demo principal", anchor: "playtest" },
      { label: "Um canal na Twitch para a Crimson Cup", text: "todos os eventos transmitidos, mais uma página de prévia do Kickstarter para seguir", anchor: "twitch" },
      { label: "Co-streaming aberto a todos", text: "retransmita a transmissão oficial ou assista a outros streamers como espectador, e avise a Koin pelo formulário", anchor: "co-streaming" },
      { label: "Regulamento, página 8", text: "novas orientações sobre problemas técnicos e acompanhamento dos decks", anchor: "regulamento" },
    ],
    body: `## O playtest fecha em 15 de outubro {#playtest}

Em 14 de outubro, a equipe da Koin Games abriu o seu anúncio no [Discord oficial](https://discord.gg/originstcg) com uma notícia triste: o playtest "vai nos deixar amanhã", então a build do playtest fecha em 15 de outubro. Nas palavras da equipe, os jogadores "jogaram mais de 100 mil partidas" nela e "nos ajudaram muito". A [atualização 0.7.1 de 8 de outubro](/pt/news/playtest-patch-notes-0-7-1) foram as suas últimas notas do patch.

Com o fim do playtest, vem aí uma atualização da demo principal, a gratuita no Steam, de que trata o nosso [guia da demo](/pt/guides/play-the-demo). A Koin diz que ela "deve deixar a maioria de vocês muito feliz", mas não diz o que traz, então não vamos chutar: vamos contar quando saírem as notas do patch.

A Koin também avisou que "estas são SEMANAS GRANDES para Origins", com mais anúncios por vir. O calendário está no nosso [guia do Steam Next Fest](/pt/guides/steam-next-fest-2026): a ranqueada e a Crimson Cup começam com o festival, em 19 de outubro, e o [Kickstarter da Alpha Edition](/pt/guides/origins-tcg-kickstarter) está previsto para 27 de outubro.

## Um canal na Twitch para a Crimson Cup, e a página do Kickstarter {#twitch}

A Koin abriu um novo canal oficial na Twitch, onde "vai transmitir TODOS os eventos da Crimson Cup", e pede aos jogadores que sigam a página de prévia do Kickstarter antes de a campanha entrar no ar. Os dois links estão no anúncio no [Discord oficial](https://discord.gg/originstcg). As datas das classificatórias e a premiação estão no nosso [artigo sobre a Crimson Cup](/pt/news/crimson-cup-prizepool-qualifiers).

## O co-streaming da Crimson Cup {#co-streaming}

Qualquer pessoa pode fazer co-stream da Crimson Cup ou transmitir as próprias partidas. Além da transmissão oficial de todos os eventos, há duas formas de narrá-la você mesmo:

- retransmitir a transmissão oficial da Koin;
- assistir diretamente a outros streamers como espectador.

A Koin gostaria de trabalhar com alguns streamers da Twitch para alcançar mais gente, e pede a quem pretende transmitir um evento da Crimson Cup que avise pelo formulário indicado no anúncio, para poder se organizar.

Se você transmite com um deck de torneio, o OriginsMeta tem ferramentas gratuitas para isso: um link curto para dizer na transmissão, o comando de chat !deck e um overlay para o OBS com os seus três decks, tudo explicado no nosso [guia para transmissões](/pt/guides/streaming-tools).

## O regulamento atualizado: problemas técnicos e acompanhamento dos decks {#regulamento}

A Koin acrescentou uma seção curta ao regulamento da Crimson Cup, na página 8, com orientações mais claras sobre como lidar com problemas técnicos e com o acompanhamento dos decks. O anúncio não a resume: se você vai jogar uma classificatória, leia essa página antes das suas partidas. O formato, com três decks e Conquest, está no nosso artigo sobre [as regras da Crimson Cup](/pt/news/crimson-cup-format-check-in).

## O que ainda não sabemos {#o-que-nao-sabemos}

- O que a atualização da demo principal traz, e quando ela chega.
- O texto exato da nova seção do regulamento.
- Com quais streamers a Koin vai fazer parceria para as transmissões.

## De onde vem {#fontes}

- O anúncio da equipe da Koin Games no [Discord oficial de Origins TCG](https://discord.gg/originstcg), em 14 de outubro de 2026, com os links para o canal da Twitch, a página de prévia do Kickstarter, o formulário de co-streaming e o regulamento.`,
    faq: [
      {
        q: "Quando fecha o playtest de Origins TCG?",
        a: "Em 15 de outubro de 2026. A Koin Games anunciou isso no Discord oficial no dia anterior, depois de mais de 100.000 partidas jogadas na build do playtest, e disse que uma atualização da demo principal está a caminho.",
      },
      {
        q: "Onde posso assistir à Crimson Cup?",
        a: "No novo canal oficial da Koin Games na Twitch, que vai transmitir todos os eventos da Crimson Cup. O link está no anúncio de 14 de outubro de 2026 no Discord oficial de Origins TCG.",
      },
      {
        q: "Posso transmitir ou fazer co-stream da Crimson Cup?",
        a: "Sim. Qualquer pessoa pode fazer co-stream da Crimson Cup ou transmitir as próprias partidas, retransmitindo a transmissão oficial ou assistindo a outros streamers como espectador. A Koin pede aos streamers que avisem pelo formulário do anúncio, para poder se organizar.",
      },
    ],
  },
  "building-origins-ama-design-balance": {
    title: "AMA Building Origins: ranqueada até 4 de dezembro, 22 cartas novas em novembro e por que Bagheera custa mais",
    metaTitle: "AMA de Origins TCG: ranqueada, cartas e balanceamento",
    description:
      "AMA Building Origins de Origins TCG: ranqueada de 19 de outubro a 4 de dezembro, 22 cartas em novembro, collector pass de uns 20 dólares e o porquê do 0.7.",
    summary:
      "No AMA Building Origins, transmitido ao vivo em 2 de outubro e publicado no YouTube em 5 de outubro, a Koin Games deu datas que chamou de \"escritas a lápis\": a ranqueada de 19 de outubro a 4 de dezembro, o ranking Grandmaster a partir de 27 de outubro e pelo menos 22 cartas novas em novembro. A equipe de design também explicou por que Bagheera, Mind Palace e Spellbook custam mais desde o patch 0.7, por que Christopher Robin voltou a 5/4 e como ela balanceia o jogo.",
    highlights: [
      { label: "Ranqueada de 19 de outubro a 4 de dezembro", text: "o ranking Grandmaster abre em 27 de outubro, para todos ao mesmo tempo", anchor: "ranqueada" },
      { label: "Novembro", text: "um playtest da monetização, pelo menos 22 cartas novas, cartas e locais novos a cada duas semanas", anchor: "novembro" },
      { label: "As próximas cartas", text: "20 Lendárias, mais de 90 locais criados e uma mecânica de comida", anchor: "primeiro-set" },
      { label: "Collector pass, cápsulas e comandantes", text: "uma compra única de uns 20 dólares, comandantes negociáveis", anchor: "colecionaveis" },
      { label: "Modo espectador, replays e tabuleiros", text: "o modo espectador na Crimson Cup só para contas aprovadas", anchor: "recursos" },
      { label: "Por que três cartas custam mais", text: "Bagheera, Mind Palace e Spellbook; nenhuma mudança para Ellen Trechend", anchor: "patch-0-7" },
      { label: "Christopher Robin e Axe Throw", text: "os motivos do vaivém 5/4, 4/5, 5/4", anchor: "christopher-robin" },
      { label: "Como a Koin cria o jogo", text: "faixas de força, dados mais a percepção dos jogadores, \"net positive joy\"", anchor: "design" },
    ],
    body: `## Ranqueada: de 19 de outubro a 4 de dezembro, Grandmaster a partir do dia 27 {#ranqueada}

A equipe deu as datas com um aviso: "estão escritas a lápis, e eu carrego muito corretivo". A temporada ranqueada começa em 19 de outubro, o primeiro dia do Steam Next Fest, e vai até 4 de dezembro. O ranking Grandmaster fica fechado durante o festival e deve abrir na terça-feira, 27 de outubro, para que "todo mundo comece ao mesmo tempo".

Os melhores prêmios vão para o topo desse ranking, incluindo recompensas exclusivas "1 de 1 ou 1 de 25" que Mike, da equipe da Koin, chamou de "provavelmente os melhores prêmios do jogo inteiro". Esta temporada tem recompensas da ranqueada antes de chegar a monetização completa, "talvez a única vez", e os itens que você ganha agora na demo vão estar fora de circulação no lançamento. Mais no nosso [guia da ranqueada](/pt/guides/origins-tcg-ranked).

## Novembro: um playtest da monetização e cartas novas a cada duas semanas {#novembro}

As builds de novembro são playtests da monetização. Se os planos se mantiverem, novembro também traz "pelo menos 22 cartas novas", com cartas e locais novos a cada duas semanas durante a temporada da ladder. Mais adiante, Mike disse que a equipe está "caminhando para lançar o jogo no ano que vem" e que a interface, que ainda parece de celular, vai ficar "muito mais com cara de PC" até o fim do ano; Kevin disse que a versão para celular vem "em breve", sem data. As datas confirmadas estão no nosso [roadmap](/pt/guides/roadmap-and-dates).

## As próximas cartas: 20 Lendárias, mais de 90 locais e comida {#primeiro-set}

A demo tem "a primeira metade" do primeiro set; a segunda metade acrescenta palavras-chave e conceitos novos. Ben, o lead card designer, disse que estão previstas 20 Lendárias e que "mais de 90" locais estão criados, contra os cerca de 40 que os jogadores viram. Muitos dos locais atuais favorecem decks agressivos como o de Three Not So Little Pigs; isso deve se equilibrar à medida que chegarem mais.

A nova mecânica que o deixa "bem empolgado" é a **comida**, adiada porque é "um pouco avançada": um item no tabuleiro que não é um personagem. Um personagem jogado em cima dele ganha um bônus, "agora é mais dois, mais dois", então o posicionamento pesa mais. Vem também outro subtema, "cartas criadas custam menos". Nenhuma carta nova foi citada pelo nome.

Os sets seguintes vão visitar outras mitologias: está previsto um set de mitologia grega, com algumas cartas já criadas. A Koin também prometeu colaborações e disse ter sido procurada por estúdios "número um do mundo nas suas categorias", sem dizer quais.

## Collector pass, cápsulas e comandantes {#colecionaveis}

Origins continua free-to-compete: todo jogador recebe todas as cartas de jogo, ninguém deve se sentir "obrigado a gastar nada", e o dinheiro vai para variantes limitadas, como em Counter-Strike. As peças:

- o **collector pass** (nome provisório): uma compra única de "uns 20 dólares", não um passe de batalha mensal, que dá cerca de dois colecionáveis por semana jogando, nunca de um tipo que se encontra nos pacotes;
- **créditos da loja** ganhos jogando, para outros colecionáveis exclusivos;
- **cápsulas**, um segundo tipo de item: os pacotes só têm cartas, enquanto os comandantes vêm das cápsulas;
- **comandantes**, negociáveis e com tiragem limitada; no acesso antecipado todos recebem quatro não negociáveis, com emotes e avatares, como "dotação inicial".

A Koin também estuda estojos colecionáveis e personalizáveis e fichários para folhear as coleções de outros jogadores. Sets e grading estão no nosso [artigo sobre os sets](/pt/news/origins-sets-alpha-edition-grading) e no [guia da economia dos colecionáveis](/pt/guides/collector-economy); quanto ao Kickstarter, "os preços vão ser revelados em breve".

## Modo espectador, replays e tabuleiros {#recursos}

- O **modo espectador** existe, mas "não está pronto": na [Crimson Cup](/pt/news/crimson-cup-prizepool-qualifiers) só algumas contas aprovadas para transmitir vão usá-lo.
- Os **replays** funcionam internamente, mas não estão prontos para os jogadores; está previsto um **histórico turno a turno**.
- Ver quantas cartas o oponente trocou no mulligan, uma ideia da comunidade, já estava na build interna: saiu com o [playtest 0.7.1](/pt/news/playtest-patch-notes-0-7-1#mulligan-do-oponente).
- O **tabuleiro atual é provisório**, "sci-fi demais e sem graça": estão em produção tabuleiros inspirados em cada chefe, e virão tabuleiros cosméticos.
- **Bots**: "no pico, temos uns 200 jogadores simultâneos", disse Mike, então algumas partidas ranqueadas são contra bots por enquanto; as missões são explicitamente PvE.

## Por que Bagheera, Mind Palace e Spellbook custam mais {#patch-0-7}

O [patch 0.7](/pt/news/patch-0-7#custos) aumentou as três em 1 de mana. Ben disse que a equipe não planejava mudanças, mas as cartas que os jogadores não paravam de apontar "começaram a ter taxas de jogo maiores", até os números deixarem de ser saudáveis. Ele não deu win rates, só disse que estavam "em faixas saudáveis".

- **Bagheera** é uma carta "muito importante de acertar": ela define o ritmo do começo e ensina aos jogadores novos onde uma ameaça vai aparecer, "nos mesmos três lugares", os espaços centrais em que a sua habilidade Ao revelar a faz crescer. Como 3/3 de 1 de mana, estava em decks demais, sobretudo no de Three Not So Little Pigs. A Koin quer que ela seja uma carta para Mulan, que repete as habilidades Ao revelar, então manteve o bônus grande e subiu o custo. Um deck de Mulan mais forte, observou Ben, poderia por sua vez fortalecer Ellen Trechend.
- **Spellbook** é a que mais vai mudar quando o pool de cartas dobrar, porque os seus feitiços vêm desse pool. Kevin contou uns 22 feitiços hoje, então um Legion of the Dead sai mais ou menos "uma vez em 22", probabilidades que "não vão durar muito".
- **Ellen Trechend**: "nenhuma ação", e nada a esperar "no futuro imediato".

Antes da Crimson Cup, a Koin está "comprometida" a deixar as cartas como estão; em um caso "catastrófico", "simplesmente baniríamos a carta em vez de mudá-la".

## Christopher Robin e Axe Throw {#christopher-robin}

Christopher Robin passou de 5/4 para 4/5 porque estava em muitos decks com um bom win rate, e nas partidas de introdução os jogadores novos davam de cara com Golden Egg à frente dele sem outra saída além da troca; como 4/5, um Galahad jogado depois mudava os combates. A equipe voltou atrás ([patch da demo de 21 de setembro](/pt/news/demo-patch-notes-0921#christopher-robin)) porque estava pensando em levar Axe Throw "de volta a cinco" de dano, ainda não estava pronta para isso e queria que Axe Throw, com 4 de dano hoje, continuasse boa contra as cartas mais jogadas. "Não era necessariamente só uma questão de nível de força", disse Ben. O [rework de Twister Toss](/pt/news/patch-0-7#twister-toss) também tira um momento desajeitado: o movimento não falha mais se outra carta entrar antes no espaço.

## Como a Koin cria o jogo {#design}

- **Faixas, não força igual**: "não estamos muito focados em garantir que toda carta tenha o mesmo nível de força", disse Ben; a equipe intervém quando uma carta sai das faixas saudáveis.
- **Dados e sensações**: números mais feedback, porque "a percepção dos jogadores também é um dado" (Kevin), e um objetivo que eles chamam de "net positive joy": quem vence uma interação se sente bem sem que quem perde se sinta péssimo.
- **Poucas decisões, e pesadas**: 12 cartas base mais uma Lendária fazem "13 decisões", então mudar o custo em mana pesa mais do que em decks maiores.
- **Turnos simultâneos, três locais e uma Lendária que você "não precisa comprar"**, em um jogo pensado para ser divertido de assistir "desde o começo".
- **Regras mais amigáveis de propósito**: remover um buff contínuo nunca mata um personagem, e o Escudo para o Atropelar por completo.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Todas as datas estão "escritas a lápis" e podem mudar.
- Quais são as recompensas da ladder e os prêmios 1 de 1: a Koin ainda está "na cozinha".
- Quando chegam a comida, as outras Lendárias e o set grego, e com quais cartas.
- Os preços do Kickstarter, e quantos comandantes e cápsulas vão existir.

## De onde vem {#fontes}

A [gravação do AMA Building Origins](https://www.youtube.com/watch?v=bEb5RuwY7tg) no canal oficial de Origins TCG no YouTube, ao vivo em 2 de outubro de 2026 e publicada em 5 de outubro (2 horas e 22 minutos), com Kevin Lambert, chief product officer e head of design da Koin Games, Ben "Benny Beatdowns", lead card designer e ex-Wizards of the Coast em Magic, e outras pessoas da equipe. Usamos as legendas automáticas em inglês do YouTube, que deformam alguns nomes (os nomes das cartas foram conferidos com o nosso banco de dados): as citações são transcrição e tradução nossas.`,
    faq: [
      {
        q: "Quando começa e termina a temporada ranqueada de Origins TCG?",
        a: "No AMA Building Origins, a Koin Games disse que a temporada ranqueada começa em 19 de outubro de 2026, o primeiro dia do Steam Next Fest, e vai até 4 de dezembro. O ranking Grandmaster deve abrir na terça-feira, 27 de outubro, para todos ao mesmo tempo. A equipe frisou que essas datas estão \"escritas a lápis\".",
      },
      {
        q: "Por que Bagheera, Mind Palace e Spellbook custam 1 de mana a mais?",
        a: "As suas taxas de jogo continuaram subindo depois que os jogadores as apontaram, até a Koin considerar os números pouco saudáveis e aumentá-las em 1 de mana no patch 0.7. Bagheera, com custo 1, estava em decks demais, sobretudo no de Three Not So Little Pigs, enquanto a Koin quer que ela seja uma carta para Mulan. Os win rates não foram divulgados.",
      },
      {
        q: "A Koin vai mudar cartas antes da Crimson Cup?",
        a: "Não, a menos que aconteça algo catastrófico: nesse caso, disse a Koin, ela baniria a carta em vez de mudá-la. Ben também disse que não há nenhuma ação prevista para Ellen Trechend no futuro imediato.",
      },
      {
        q: "O que é a mecânica de comida em Origins TCG?",
        a: "Uma mecânica que o lead card designer Ben descreveu entre as que virão no futuro: um item que vai para o tabuleiro sem ser um personagem, e um personagem jogado em cima dele ganha um bônus, +2/+2 por enquanto. Ela foi adiada porque é um pouco avançada, e nenhuma data foi dada.",
      },
    ],
  },
  "bot-deck-challenge-practice-tournaments": {
    title: "A Koin quer os seus decks para os bots da demo, e torneios de treino semanais antes da Crimson Cup",
    metaTitle: "Origins TCG: os seus decks para os bots da demo",
    description:
      "A Koin Games pede aos jogadores de Origins TCG decks para os bots da demo, com um prêmio secreto para os melhores. Mais: torneios de treino e números da demo.",
    summary:
      "Em 6 de outubro, a Koin Games lançou um desafio no Discord oficial: monte decks, envie pelo formulário e os bots da demo começam a jogar com eles, com um \"prêmio supersecreto\" para os decks que se saírem melhor. Nos mesmos dias, a Koin fez os dois primeiros torneios de treino semanais antes da Crimson Cup, convidou os fãs a organizar os próprios torneios e divulgou números novos: mais de 20.000 downloads da demo e mais de 300.000 partidas jogadas.",
    highlights: [
      { label: "O desafio dos decks para os bots", text: "envie decks pelo formulário da Koin, os bots da demo jogam com eles, um prêmio secreto para os melhores", anchor: "desafio-dos-bots" },
      { label: "Como participar", text: "quantos decks você quiser, nenhuma regra anunciada", anchor: "como-participar" },
      { label: "Torneios de treino", text: "os dois primeiros em 3 e 10 de outubro; a comunidade prefere as noites de dias de semana, no horário europeu", anchor: "torneios-de-treino" },
      { label: "Organize o seu", text: "a Koin oferece apoio aos torneios feitos pelos fãs, e o OriginsMeta tem um organizador gratuito", anchor: "organize-o-seu" },
      { label: "A gravação do AMA", text: "Building Origins, 2 horas e 22 minutos no YouTube", anchor: "ama" },
      { label: "A demo em números", text: "mais de 20.000 downloads e mais de 300.000 partidas", anchor: "numeros" },
    ],
    body: `## A Koin quer decks melhores para os seus bots {#desafio-dos-bots}

Em 6 de outubro, às 18:17 UTC, a equipe da Koin Games publicou "um pequeno desafio" em #announcements no [Discord oficial](https://discord.gg/originstcg): "Queremos melhorar os decks que os nossos bots usam, então vamos fazer disso um joguinho". Funciona em quatro passos:

1. monte decks;
2. envie pelo [formulário oficial](https://forms.gle/zY1WeRTPLQzKAEs26);
3. os bots começam a usá-los nas partidas;
4. "os decks com melhor desempenho ganham um prêmio supersecreto".

Você pode enviar mais de um deck e, nas palavras da equipe, "não há regras": o objetivo é "montar os melhores decks possíveis".

Por que isso importa: no [post sobre a Crimson Cup de 5 de outubro](/pt/news/crimson-cup-prizepool-qualifiers#treino), a Koin escreveu que a maioria das partidas da demo é contra bots. As listas que saírem deste desafio são as que os jogadores vão encontrar nessas partidas, nas semanas antes da [Crimson Cup](/pt/guides/steam-next-fest-2026).

## Como participar {#como-participar}

O anúncio não pede nada além do formulário: nenhum prazo, nenhum formato, nenhum limite de decks. Se você quer um ponto de partida:

- monte e confira a sua lista no nosso [deck builder](/pt/deck-builder), que segue as regras de deck da demo (uma Lendária mais 12 cartas base duas vezes, 25 cartas) e dá o código do jogo para copiar;
- procure ideias entre os [decks publicados no OriginsMeta](/pt/decks), cada um com o seu guia e os votos da comunidade;
- como você pode enviar mais de uma lista, teste arquétipos diferentes em vez de apostar em um deck só.

## Torneios de treino semanais {#torneios-de-treino}

Os torneios de treino anunciados em 5 de outubro começaram. A Koin perguntou antes: em uma enquete de 30 de setembro, 265 de 293 votantes (90%) disseram sim a torneios de treino sem prêmios.

- O **torneio de treino #1**, no sábado, 3 de outubro, às 16:00 CEST, anunciado em 2 de outubro, foi jogado com as regras da Crimson Cup, então os decks tinham de ser enviados antes do início ([o formato](/pt/news/crimson-cup-format-check-in#formato), e o nosso [guia do Conquest](/pt/guides/origins-tcg-conquest)).
- O **torneio de treino #2**, no sábado, 10 de outubro, às 16:00 CEST (14:00 UTC), anunciado em #game-announcements em 6 de outubro, manteve o formato do primeiro, cinco rodadas suíças, partidas em melhor de três e nenhuma eliminação, mas sem Conquest: nenhum deck para enviar e escolha livre do que jogar. As inscrições eram em #tournaments-to-join.

Em 6 de outubro a Koin também perguntou quando os jogadores preferem jogar. A opção vencedora, com 40% dos votos, foi "Weekdays - evening EU time (7pm CEST, 1pm EST)", ou seja, dias de semana à noite no horário europeu. O dia e o horário do próximo torneio de treino ainda não foram anunciados, e os resultados do segundo não foram publicados nos canais de anúncios.

## Outros torneios, e como organizar o seu {#organize-o-seu}

Em 8 de outubro a Koin indicou aos jogadores um torneio de Origins organizado no mesmo dia, às 16:30 CEST, pelo Collector Club, um site de terceiros, que pretende fazer torneios semanais no seu próprio Discord, com inscrições no seu canal de anúncios.

Na mesma mensagem, a equipe fez um convite aberto: "Se você é fã de Origins e quer organizar os seus próprios torneios, adoraríamos apoiar você. Fique à vontade para entrar em contato para fazermos isso acontecer!" A mensagem não diz o que esse apoio inclui.

Se você quer começar agora, o [Tournament Organizer](/pt/tournaments/new) do OriginsMeta é gratuito para quem fez login: chave de eliminação simples, Conquest ou escolha livre de deck, melhor de uma, de três ou de cinco, decks enviados antes do início, check-in e decklists ocultas, público ou privado com convite, com um link curto para compartilhar. Ele ainda não faz rodadas suíças.

## O AMA Building Origins, no YouTube {#ama}

A gravação do primeiro evento Building Origins, o AMA com Kevin e Ben, apresentados pela Koin como as cabeças por trás de Origins, está no canal oficial de Origins TCG no YouTube: ["Building Origins AMA"](https://www.youtube.com/watch?v=bEb5RuwY7tg), publicado em 5 de outubro de 2026, com 2 horas e 22 minutos. O que foi dito, das datas da temporada ranqueada aos motivos das mudanças de balanceamento do 0.7, está no [nosso artigo sobre o AMA](/pt/news/building-origins-ama-design-balance).

## A demo em números {#numeros}

- **Mais de 20.000 downloads.** A conta oficial no X escreveu em 7 de outubro que a demo "já foi baixada mais de 20000 vezes"; em 24 de setembro falava em 15.000.
- **Mais de 300.000 partidas.** Em 29 de setembro, o fundador e CEO da Koin Games, Tim Jooste, escreveu que mais de 300.000 partidas tinham sido concluídas na demo em 11 semanas, com quase 1.000 jogadores com mais de 20 horas de jogo.
- **1.500 inscritos na Crimson Cup.** Em 1º de outubro, ele acrescentou que 1.500 jogadores tinham se inscrito na Crimson Cup em três semanas.

São números da Koin: não temos como conferi-los.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Quanto tempo dura o desafio dos decks para os bots: o anúncio não dá prazo.
- O que é o "prêmio supersecreto", e quantos decks o ganham.
- Como o "melhor desempenho" é medido (vitórias, win rate, número de partidas) e se os resultados serão publicados.
- Quando os decks enviados começam a aparecer nas partidas, e em quais modos.
- Se o "não há regras" vale também para a montagem dos decks, ou só para quantos decks você pode enviar.
- O dia e o horário do próximo torneio de treino, se ele vai passar para as noites de dias de semana que a enquete escolheu, e os resultados do segundo.

## De onde vem {#fontes}

- O [Discord oficial de Origins TCG](https://discord.gg/originstcg): o desafio em #announcements em 6 de outubro de 2026; os torneios de treino em #announcements (2 de outubro) e #game-announcements (6 de outubro), com as duas enquetes; o torneio do Collector Club e o convite para organizar torneios em #game-announcements (8 de outubro); o primeiro evento Building Origins em #announcements.
- A [gravação do AMA](https://www.youtube.com/watch?v=bEb5RuwY7tg) no canal oficial do YouTube.
- Os posts no X de [Origins TCG em 7 de outubro](https://x.com/origins_tcg/status/2107853622897705015) e [em 24 de setembro](https://x.com/origins_tcg/status/2103203061707477242), e de Tim Jooste em [29 de setembro](https://x.com/TimothyJooste/status/2104979201707192617) e [1º de outubro](https://x.com/TimothyJooste/status/2105506219679264901).`,
    faq: [
      {
        q: "Como envio um deck para os bots da demo de Origins TCG?",
        a: "Pelo formulário indicado no anúncio da Koin Games de 6 de outubro de 2026 no Discord oficial (forms.gle/zY1WeRTPLQzKAEs26). Você pode enviar quantos decks quiser: os bots começam a usá-los nas partidas e os decks com melhor desempenho ganham um prêmio secreto.",
      },
      {
        q: "Há um prazo ou um prêmio conhecido para o desafio dos decks para os bots?",
        a: "Ainda não. O anúncio não dá prazo, não diz o que é o \"prêmio supersecreto\" e não explica como os decks com melhor desempenho são escolhidos.",
      },
      {
        q: "Quando são os torneios de treino de Origins TCG?",
        a: "Eles são semanais e anunciados no Discord oficial. O primeiro foi em 3 de outubro de 2026, com as regras da Crimson Cup, o segundo em 10 de outubro às 16:00 CEST, sem Conquest. Em uma enquete de 6 de outubro, a comunidade escolheu as noites de dias de semana, no horário europeu (19:00 CEST).",
      },
      {
        q: "Posso organizar o meu próprio torneio de Origins TCG?",
        a: "Sim. A Koin Games convida os fãs que querem organizar torneios a entrar em contato para receber apoio, e no OriginsMeta qualquer pessoa que fez login pode criar um com o Tournament Organizer, com Conquest ou decks livres e partidas em melhor de uma, de três ou de cinco.",
      },
    ],
  },
  "origins-sets-alpha-edition-grading": {
    title: "Sets de Origins TCG: Alpha Edition, um set a cada 3 a 4 meses, grading e cartas de jogo grátis para todos",
    metaTitle: "Sets de Origins TCG: Alpha Edition, grading e tiragens",
    description:
      "Como vão funcionar os sets de Origins TCG: Alpha Edition só no Kickstarter, um set a cada 3–4 meses, lacrados no Steam, notas de 1 a 10 e cartas grátis.",
    summary:
      "Em três posts no X entre 29 de setembro e 9 de outubro, a Koin Games explicou como vão funcionar os sets e o colecionismo de Origins TCG. O primeiro set, Myths and Legends, tem 218 personagens; a sua Alpha Edition só vai ser vendida pelo Kickstarter e nunca será reimpressa, e estão previstos sets novos a cada 3 a 4 meses, com uma janela de venda de 3 meses, cartas colecionáveis com nota de grading e promos exclusivas de torneios. As cartas de jogo continuam grátis para todos: o sistema de colecionáveis, previsto para depois do Steam Next Fest, é opcional.",
    highlights: [
      { label: "Dois sistemas de cartas", text: "cartas de jogo grátis para todos a cada temporada e não negociáveis; as cartas colecionáveis são itens do Steam à parte, que você pode negociar", anchor: "dois-sistemas" },
      { label: "Alpha Edition", text: "a primeira edição de Myths and Legends (218 personagens): só no Kickstarter, com uma marca Alpha, nunca reimpressa", anchor: "alpha-edition" },
      { label: "Um set a cada 3 a 4 meses", text: "uma janela de venda de 3 meses, depois só as cópias que os colecionadores já têm", anchor: "ciclo-dos-sets" },
      { label: "Produtos lacrados no Steam", text: "pacotes, caixas de boosters e cases como itens do inventário; caixas e cases só em pré-venda", anchor: "lacrados" },
      { label: "Raridade e grading", text: "cinco camadas de raridade, cartas com erro, notas de 1 a 10 com meios pontos: em 2 de outubro a Koin disse que ainda está estudando o sistema", anchor: "raridade-grading" },
      { label: "Cartas de torneio", text: "nunca nos pacotes: quem vencer a Crimson Cup ganha um Dracula 1/1", anchor: "cartas-de-torneio" },
      { label: "Escassez não é valor", text: "a Koin cita as primeiras edições de Pokémon e Magic, depois diz que elas não são uma fórmula", anchor: "escassez" },
    ],
    body: `## Três posts, um só sistema {#tres-posts}

Entre 29 de setembro e 9 de outubro de 2026, a conta oficial de Origins TCG no X publicou três posts longos sobre como vão funcionar os sets e o colecionismo. A Koin Games diz que tira o seu modelo antes de tudo dos jogos de cartas físicos: produto lacrado, tiragens limitadas, períodos de lançamento definidos e lojas locais de jogos.

O nosso [guia da economia dos colecionáveis](/pt/guides/collector-economy) já trata dos formatos da Alpha Edition e dos seus sete níveis de raridade, a partir da página oficial de pré-registro. O que estes posts acrescentam: o tamanho do primeiro set, a marca Alpha, o ritmo dos sets seguintes, os produtos lacrados como itens do Steam, as camadas de raridade, como o grading deve funcionar e as cartas de torneio.

## Dois sistemas de cartas {#dois-sistemas}

Origins tem dois tipos de carta que compartilham personagens e desenhos, mas não o acesso, a posse nem a tiragem:

- **Cartas de jogo.** Todas as cartas de jogo base vão ser grátis para todos os jogadores, em todas as temporadas. Elas não podem ser negociadas e existem para jogar. Nas palavras da Koin, "um jogador nunca vai precisar comprar um pacote ou ter uma versão colecionável para montar um deck competitivo": o estúdio chama isso de free-to-compete.
- **Cartas colecionáveis.** Itens do inventário do Steam à parte, que são seus e que você pode negociar. Até a versão colecionável padrão tem um visual diferente da carta de jogo, com outra moldura e uma visualização que põe a ilustração em primeiro plano.

A escassez que a Koin descreve vale só para o lado colecionável: edições, tratamentos de arte, notas, produtos lacrados e procedência de torneio. Ela "nunca vai limitar o acesso ao pool de cartas competitivo", e o fim de uma edição nunca tira uma carta do jogo. O que o dinheiro compra e o que não compra está no [nosso guia do free-to-compete](/pt/guides/is-origins-tcg-pay-to-win).

## Myths and Legends e a Alpha Edition {#alpha-edition}

O primeiro set é **Myths and Legends**, com **218 personagens**. O seu primeiro lançamento colecionável é a **Alpha Edition**, que só vai estar disponível pelo Kickstarter, em 27 de outubro segundo o CEO (o nosso [guia do Kickstarter](/pt/guides/origins-tcg-kickstarter) tem os detalhes). Toda carta Alpha leva uma **marca Alpha** na frente, assim a edição continua reconhecível. Um personagem pode voltar em um set posterior, mas não na sua versão Alpha: quando a janela fechar, a Koin diz que não vai emitir mais cartas, pacotes, caixas de boosters nem cases Alpha.

O sistema de colecionáveis está previsto para estrear **depois do Steam Next Fest** (19–26 de outubro), e o post de 9 de outubro diz que tudo vai ser negociável pelo Steam desde o "dia 1".

## Um set novo a cada 3 a 4 meses {#ciclo-dos-sets}

A Koin prevê um set novo a cada 3 a 4 meses. Cada set padrão tem uma **janela de venda de 3 meses**, durante a qual as cartas colecionáveis e os produtos lacrados são vendidos pelo Origins, pelas lojas locais de jogos participantes (o [Digital LGS Program](/pt/news/digital-lgs-program) apresentado em 6 de outubro) e por parceiros online aprovados. Depois disso, as únicas cópias que restam são as que os colecionadores já têm, negociáveis no Mercado da Comunidade Steam.

## Os produtos lacrados continuam lacrados {#lacrados}

Pacotes, caixas de boosters e cases vão ser itens individuais do inventário do Steam: você pode abri-los, negociá-los ou mantê-los lacrados. Caixas de boosters e cases são **só em pré-venda**, então nenhuma unidade lacrada nova é acrescentada depois que essa janela fecha. Nas palavras da Koin, o produto lacrado continua fazendo parte da coleção "em vez de virar uma tela de compra temporária que some depois de aberta".

## Raridade, tratamentos e grading {#raridade-grading}

Uma carta colecionável pode variar em cinco camadas: edição, raridade, nota, condição digital e status de promo. Nenhuma delas muda o que a carta faz em uma partida. Os pacotes de colecionador podem conter cartas colecionáveis padrão, variantes de **arte alternativa**, cartas **Storybook** animadas e **cartas com erro** digitais.

Sobre o grading, os dois posts não soam iguais. Em 29 de setembro, a Koin o descreve como decidido: o conteúdo de um pacote é definido antes de ser aberto, e quando uma carta colecionável é revelada "o sistema sorteia a sua nota". O grading é "automático, instantâneo e gratuito", com base em centralização, cantos, bordas e superfície, com defeitos digitais visíveis que explicam o resultado. Em 2 de outubro o tom é mais cauteloso: "Estamos estudando um sistema de grading digital" em que vários parâmetros compõem a nota e os defeitos variam de carta para carta. Os dois posts dão a mesma escala, **de 1 a 10 com meios pontos**; o resto ainda pode mudar, e na atualização do playtest de 1º de outubro a equipe pediu aos jogadores que [ignorassem a tela "How Grading Works"](/pt/news/playtest-patch-notes-1001#gradacao) por enquanto. A nota é separada da raridade e da arte e, segundo a Koin, notas baixas também podem ser colecionáveis, porque tornam uma cópia mais específica.

## Cartas de torneio: o Dracula 1/1 {#cartas-de-torneio}

Algumas cartas colecionáveis nunca vão estar em pacotes nem em lojas: promos de torneio ultrarraras, que só se ganham competindo. O primeiro exemplo é a Crimson Cup, cujo vencedor ganha uma **carta promocional 1/1 de Dracula** e vai ser, nas palavras da Koin, a única pessoa a tê-la, para sempre. Os outros prêmios estão na nossa [tabela de prêmios da Crimson Cup](/pt/news/crimson-cup-prizepool-qualifiers#premios).

## Primeiras edições e escassez, segundo a Koin {#escassez}

O post de 9 de outubro argumenta que, nos jogos de cartas físicos, a primeira tiragem fica escassa porque é aberta e jogada antes de o público chegar. Como exemplos, cita uma caixa de boosters de Pokémon Base Set 1st Edition de 1999, vendida por cerca de 100 a 120 dólares e cujas cópias lacradas teriam sido vendidas por algo entre 10.000 e mais de 250.000 dólares, e uma caixa de boosters de Magic Alpha de 1993, cerca de 88 dólares no varejo, cujos pacotes lacrados seriam negociados por 8.000 a 12.000 dólares. São números da Koin, não nossos.

A própria Koin acrescenta que esses resultados levaram décadas, dependeram de os dois jogos se tornarem enormes e "não são uma fórmula", e o post de 29 de setembro afirma que a tiragem limitada "não garante demanda, valor de mercado nem valorização". Relatamos o que o estúdio diz: nada aqui é um motivo para comprar. Colecionar é opcional, e você pode jogar Origins de forma competitiva sem gastar nada.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Os preços e o tamanho das tiragens da Alpha Edition e dos sets seguintes.
- Se o grading vai funcionar exatamente como descrito em 29 de setembro, e como a "condição digital" se diferencia da nota.
- Que dia é o "dia 1" das trocas no Steam, e como os colecionáveis atuais da demo se encaixam no novo sistema.
- O nome e a data do segundo set, e as probabilidades das artes alternativas, das Storybook animadas e das cartas com erro.
- Como funciona a janela de 3 meses entre o Origins, as lojas e os parceiros online.

## De onde vem {#fontes}

Três posts da conta oficial de Origins TCG no X: [29 de setembro](https://x.com/origins_tcg/status/2105048221139747258) (sets, Alpha Edition, grading), [2 de outubro](https://x.com/origins_tcg/status/2106087343895486639) (os dois sistemas de cartas e o sistema de colecionáveis) e [9 de outubro de 2026](https://x.com/origins_tcg/status/2108619922586898629) (primeiras edições e tiragens). Até 11 de outubro não há nenhum post no Steam sobre esses temas.`,
    faq: [
      {
        q: "Preciso comprar pacotes para competir em Origins TCG?",
        a: "Não. Segundo a Koin Games, todas as cartas de jogo base vão ser grátis para todos os jogadores, em todas as temporadas, e um jogador nunca vai precisar comprar um pacote ou ter uma versão colecionável para montar um deck competitivo. As cartas colecionáveis são itens do Steam à parte e negociáveis, e os pacotes são opcionais.",
      },
      {
        q: "O que é a Alpha Edition de Origins TCG?",
        a: "O primeiro lançamento colecionável de Myths and Legends, o primeiro set de Origins, com 218 personagens. Ela só vai estar disponível pelo Kickstarter, toda carta Alpha leva uma marca Alpha na frente e, quando a janela fechar, a Koin diz que não vai emitir mais cartas, pacotes, caixas de boosters nem cases Alpha.",
      },
      {
        q: "Como vai funcionar o grading das cartas em Origins TCG?",
        a: "Toda carta colecionável recebe uma nota automaticamente quando é aberta, em uma escala de 1 a 10 com meios pontos. Em 29 de setembro, a Koin descreveu o grading como automático, instantâneo e gratuito, com base em centralização, cantos, bordas e superfície; em 2 de outubro, disse que ainda está estudando o sistema, então os detalhes podem mudar.",
      },
      {
        q: "Com que frequência Origins TCG vai lançar sets novos?",
        a: "A Koin Games prevê um set novo a cada 3 a 4 meses. Os sets padrão têm uma janela de venda de 3 meses pelo Origins, pelas lojas de jogos participantes e por parceiros online aprovados; depois disso, as cópias só vêm dos colecionadores, pelo Mercado da Comunidade Steam.",
      },
    ],
  },
  "playtest-patch-notes-0-7-1": {
    title: "Playtest 0.7.1 de Origins TCG: a ranqueada volta a contar para as missões e o mulligan do oponente aparece",
    metaTitle: "Notas do patch do playtest 0.7.1 de Origins TCG",
    description:
      "Playtest 0.7.1 de Origins TCG de 8 de outubro: a ranqueada volta a contar para as missões, o mulligan do oponente aparece e cerca de 20 bugs são corrigidos.",
    summary:
      "Em 8 de outubro, a Koin Games atualizou o playtest de Origins TCG para a versão 0.7.1, uma atualização pequena feita de correções e mudanças de qualidade de vida. As partidas ranqueadas voltam a contar para o progresso das missões, você pode ver quantas cartas o seu oponente trocou no mulligan, e a busca na coleção, o seletor de emotes e as vozes de três personagens melhoram. Não há mudanças de balanceamento: as estatísticas das cartas continuam as do patch 0.7.",
    highlights: [
      { label: "A ranqueada volta a contar para as missões", text: "e você ainda pode jogar as missões em PvE", anchor: "missoes-ranqueada" },
      { label: "O mulligan do oponente", text: "você vê quantas cartas ele trocou", anchor: "mulligan-do-oponente" },
      { label: "Uma busca na coleção mais esperta", text: "frases com várias palavras, e uma carta invocada encontra a carta que a invoca", anchor: "busca-na-colecao" },
      { label: "Emotes e vozes", text: "espaços de emote que se esvaziam, vozes novas para Hansel and Gretel, Huck Finn e Christopher Robin", anchor: "emotes-vozes" },
      { label: "Missões, tela inicial, tabuleiro", text: "mudanças de qualidade de vida e alguns elementos provisórios", anchor: "novidades" },
      { label: "Nenhuma mudança de balanceamento", text: "as estatísticas das cartas no OriginsMeta não mudam", anchor: "o-que-nao-muda" },
    ],
    body: `## Uma pequena atualização para o playtest {#atualizacao}

Em 8 de outubro, a Koin Games atualizou o playtest, a build separada da Demo 2.0 em que se entra pelo Discord oficial, para a versão 0.7.1. A equipe publicou as notas no canal game-announcements do [Discord oficial](https://discord.gg/originstcg) às 16:54 UTC e tirou a build do ar por algumas horas para subir a atualização. "Nada de importante, só algumas correções e melhorias de qualidade de vida", escreve a equipe: não há mudanças de balanceamento, mas várias das mudanças são coisas que os jogadores tinham pedido. Ela chega uma semana depois da [atualização do playtest de 1º de outubro](/pt/news/playtest-patch-notes-1001), cujo anúncio não tinha número de versão.

## As novidades {#novidades}

### O mulligan do oponente {#mulligan-do-oponente}

Durante a fase de mulligan, agora você pode ver quantas cartas o seu oponente trocou. Os jogadores pediram isso no Discord, e a equipe diz que a ideia era tão boa que a implementou já no dia seguinte. O [patch 0.6.1](/pt/news/patch-0-6-1-ranked) já tinha acrescentado uma prévia da Lendária do oponente durante o mulligan.

### Missões, tela inicial e o resto {#missoes-tela-inicial}

- **Missões, Chefes e Recompensas** recebem algumas melhorias de qualidade de vida, assim como a **tela inicial**. As notas não dizem quais.
- Os **Commanders**, como as notas os chamam, agora dizem uma fala e mostram a sua placa com o nome quando você os inspeciona.
- **Efeitos no tabuleiro:** clicar pelo tabuleiro agora dispara efeitos visuais e sonoros. A equipe diz que os dois são provisórios e pede aos jogadores que não os julguem com muita severidade.
- **Cinemática de introdução:** é exibido um filme de introdução provisório, e a equipe sabe que ele ainda está muito em construção.

## As melhorias {#melhorias}

### A ranqueada volta a contar para as missões {#missoes-ranqueada}

Com a atualização de 1º de outubro as missões passaram a ser só PvE, e naquela build as missões de deck não podiam ser completadas pela ranqueada: a equipe tinha prometido reativar isso em uma build futura ([nosso artigo](/pt/news/playtest-patch-notes-1001#missoes-ranqueada)). Com a 0.7.1, as partidas ranqueadas PvP voltam a contar para o progresso das missões. Se você preferir, ainda pode jogar as missões em PvE pela seção Missões: a escolha é sua. Como a ranqueada funciona na demo está no [nosso guia da ranqueada](/pt/guides/origins-tcg-ranked).

### A busca na coleção {#busca-na-colecao}

A busca na coleção agora aceita frases com várias palavras, e procurar algo que uma carta invoca também encontra a carta que o invoca. No OriginsMeta, a busca em [Cartas](/pt/cards) e no [deck builder](/pt/deck-builder) já olha os nomes e o texto das cartas.

### Emotes e vozes {#emotes-vozes}

- No seletor de emotes agora você pode esvaziar um espaço, o que deixa a configuração dos seus emotes um pouco mais fácil.
- Hansel and Gretel, Huck Finn e Christopher Robin têm vozes novas. Os jogadores tinham dito que elas soavam velhas demais para os personagens, e a equipe escreve que internamente todo mundo dizia o mesmo.

### Cerca de 20 bugs corrigidos {#bugs-corrigidos}

Pelas contas da equipe, cerca de 20 bugs foram corrigidos. As notas não os listam, e a equipe pede feedback e qualquer coisa que tenha deixado passar no Discord.

## O que não muda {#o-que-nao-muda}

- **Nenhuma mudança de balanceamento.** As estatísticas das cartas continuam as do [patch 0.7](/pt/news/patch-0-7) de 29 de setembro, o último de balanceamento antes da Crimson Cup: as páginas das cartas, o [deck builder](/pt/deck-builder) e o [MetaShifting](/pt/metashifting) não mudam.
- **O playtest não é a demo principal.** Estas mudanças estão na build do playtest; a demo no Steam, a que explicamos no [nosso guia para jogar a demo](/pt/guides/play-the-demo), mantém a sua própria versão até a Koin atualizá-la.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Quando as mudanças da 0.7.1 vão chegar à demo principal no Steam.
- Quais bugs foram corrigidos: as notas só dão a contagem, cerca de 20.
- O que muda exatamente em Missões, Chefes, Recompensas e na tela inicial.
- Quando os efeitos no tabuleiro e a cinemática de introdução, os dois provisórios por enquanto, vão ficar definitivos.

## Também naquela semana: o torneio de treino #2 {#torneio-de-treino}

No mesmo canal, a equipe anunciou o segundo torneio de treino para o sábado, 10 de outubro, às 14:00 UTC (16:00 CEST): cinco rodadas suíças, melhor de três, ninguém eliminado e, ao contrário do primeiro, sem Conquest, então nenhum deck para enviar. A Koin anunciou os torneios de treino semanais em 5 de outubro ([nosso artigo](/pt/news/crimson-cup-prizepool-qualifiers#treino)).

## De onde vêm estas notas {#fontes}

As notas do patch 0.7.1 que a equipe publicou no [Discord oficial de Origins TCG](https://discord.gg/originstcg) em 8 de outubro de 2026, no canal game-announcements. Até 11 de outubro não há nenhum post no Steam sobre esta atualização: o mais recente é de 5 de outubro.`,
    faq: [
      {
        q: "As partidas ranqueadas contam para as missões no playtest de Origins TCG?",
        a: "Sim, de novo, desde o playtest 0.7.1 de 8 de outubro de 2026: as partidas ranqueadas PvP fazem as missões avançarem. Você ainda pode jogar as missões em PvE pela seção Missões. Na build de 1º de outubro, as missões de deck não podiam ser completadas pela ranqueada.",
      },
      {
        q: "O playtest 0.7.1 muda as estatísticas das cartas?",
        a: "Não. Ele não tem mudanças de balanceamento: as estatísticas das cartas continuam as do patch 0.7 de 29 de setembro de 2026, o último de balanceamento antes da Crimson Cup, e as páginas das cartas no OriginsMeta não mudam.",
      },
      {
        q: "Dá para ver o mulligan do oponente em Origins TCG?",
        a: "No playtest, desde a 0.7.1, você vê quantas cartas o seu oponente trocou durante a fase de mulligan. Ainda não sabemos quando a mudança vai chegar à demo principal no Steam.",
      },
    ],
  },
  "upgrade-meta-1013": {
    title: "Upgrade Meta: obrigado pelas quase 200 partidas, e o OriginsMeta Tracker 0.4.1 deixa você criar o seu layout",
    metaTitle: "OriginsMeta Tracker 0.4.1 para Origins TCG",
    description:
      "Obrigado pelo feedback e pelas quase 200 partidas em um dia. O OriginsMeta Tracker 0.4.1 para Origins TCG traz quatro layouts, Setup e correções.",
    summary:
      "Obrigado: no dia 12 de outubro vocês nos mandaram muito feedback e registraram quase 200 partidas com o OriginsMeta Tracker, mesmo com os servidores do jogo caindo e voltando durante boa parte do dia. Essas partidas já estão no Analytics. Saiu a versão 0.4.1 com o que vocês pediram: quatro layouts de painéis para escolher, painéis só durante a partida, uma página Setup e as correções que vocês relataram.",
    highlights: [
      { label: "Obrigado", text: "quase 200 partidas registradas em 12 de outubro", anchor: "obrigado" },
      { label: "Crie o seu layout", text: "quatro estilos para os painéis: Classic, Minimal, Structured e Custom", anchor: "layout" },
      { label: "Só durante a partida", text: "painéis que aparecem na primeira rodada e somem no final", anchor: "na-partida" },
      { label: "Setup", text: "a página principal mostra só o seu jogo", anchor: "setup" },
      { label: "Correções", text: "nada de casa vazia no Deck tracker, decks alterados lidos na hora", anchor: "correcoes" },
    ],
    body: `## Obrigado {#obrigado}

Em um só dia vocês nos mandaram muito feedback, no nosso Discord e pelo site, e no dia 12 de outubro registraram **quase 200 partidas** com o OriginsMeta Tracker, mesmo com os servidores do jogo caindo e voltando durante boa parte do dia. Cada partida entra nos win rates do [Analytics](/pt/analytics): Lendárias, decks da comunidade, arquétipos e cartas, patch a patch, só totais. Muitas das novidades abaixo saíram direto das mensagens de vocês.

## Crie o seu layout {#layout}

Os painéis sobre o jogo agora têm quatro estilos, a partir do novo botão **Create your layout** ao lado do nome do seu deck (o app está em inglês):

- **Classic**: o seu deck em uma coluna à esquerda, com a Lendária em faixa como no nosso [deck builder](/pt/deck-builder); a Lendária e as cartas reveladas do oponente em uma faixa no canto superior direito.
- **Minimal**: duas faixas, as suas 12 cartas e a Lendária embaixo à esquerda, ao lado da sua mão, e as do oponente em cima à direita.
- **Structured**: duas colunas nas laterais; à direita, sobre o painel de mana do jogo, as cartas do oponente, as que ainda restam no deck dele e a mana dos dois jogadores com a direção do combate.
- **Custom**: você escolhe vertical ou horizontal, cartas ilustradas ou só os nomes em linhas, cartas por linha, opacidade do fundo, se as cartas esgotadas somem e o que cada painel mostra.

Cada estilo lembra onde você colocou os painéis dele, e a fonte do OBS segue o estilo que você escolher.

## Painéis só durante a partida {#na-partida}

Uma nova opção mostra os painéis só enquanto você joga: eles aparecem na primeira rodada e somem uns 30 segundos depois do fim, também na fonte do OBS. Ela usa o scanner de tela: com o scanner desligado, os painéis continuam visíveis.

## Setup e uma página principal mais limpa {#setup}

A página principal do app agora mostra só o seu jogo: o deck que você escolheu, os seus números, as suas partidas e os resultados. A conta, o scanner de tela, os painéis e as opções do app ficam atrás do botão **Setup**. O tutorial recomeça uma vez para todo mundo, para mostrar para onde as coisas foram.

## Correções e atualizações {#correcoes}

- Acabou a casa vazia no fim do Deck tracker: era um marcador que o jogo guarda em alguns decks, não uma carta.
- Um deck que você muda no jogo se atualiza na hora no tracker, sem esperar a próxima partida.
- Quando sai uma versão nova, um aviso em destaque pede que você espere antes de abrir o jogo: o app só se atualiza com o jogo fechado.

O [guia de instalação](/pt/tracker#instalacao) da página Tracker agora tem cinco passos curtos.

## Como atualizar {#como-atualizar}

Se você já tem o OriginsMeta Tracker, ele se atualiza sozinho para a 0.4.1 com o jogo fechado. Se você é novo, baixe na [página Tracker](/pt/tracker): a conta OriginsMeta é gratuita.

O OriginsMeta é um site de fãs não oficial, não afiliado à Koin Games.`,
    faq: [
      { q: "Como mudo o estilo dos painéis do OriginsMeta Tracker?", a: "Aperte Create your layout, ao lado do nome do seu deck na página principal do app: ele abre o Setup nos quatro estilos (Classic, Minimal, Structured e Custom). Os painéis abertos reabrem no estilo novo." },
      { q: "Preciso baixar o OriginsMeta Tracker 0.4.1 de novo?", a: "Não: se você já tem o app, ele se atualiza sozinho para a 0.4.1 com o jogo fechado. Quem é novo baixa na página Tracker com uma conta OriginsMeta gratuita." },
    ],
  },
  "upgrade-meta-1012": {
    title: "Upgrade Meta: OriginsMeta Tracker 0.4.0 para todos, win rates abertos no Analytics e um menu novo",
    metaTitle: "OriginsMeta Tracker 0.4.0 para Origins TCG",
    description:
      "O OriginsMeta Tracker 0.4.0 é para todos com uma conta gratuita: registra as suas partidas de Origins TCG, e os win rates estão abertos a todos no Analytics.",
    summary:
      "O OriginsMeta Tracker, o nosso app para Windows que registra as suas partidas de Origins TCG, agora está disponível para todos com uma conta OriginsMeta gratuita: a versão 0.4.0 é baixada na página Tracker. Os win rates que ele coleta estão abertos a todos na nova seção Analytics, e o menu muda: Guias, Cartas e Locais agora ficam em Database.",
    highlights: [
      { label: "OriginsMeta Tracker para todos", text: "a versão 0.4.0, o novo nome do OriginsMeta Analytics, na página Tracker", anchor: "tracker" },
      { label: "Só com uma conta", text: "a conta é gratuita, e o app só funciona vinculado a ela", anchor: "conta" },
      { label: "Win rates no Analytics", text: "Lendárias, decks, arquétipos e cartas, abertos a todos", anchor: "analytics" },
      { label: "Um menu novo", text: "Database com Guias, Cartas e Locais; Analytics com o Tracker", anchor: "menu" },
    ],
    body: `## OriginsMeta Tracker para todos {#tracker}

Até ontem o OriginsMeta Analytics, o nosso app para Windows dedicado a Origins TCG, estava em teste com Creators, Autores, jogadores Pro e o Staff ([a versão de 11 de outubro](/pt/news/upgrade-meta-1011)). A partir de hoje ele se chama **OriginsMeta Tracker** e qualquer pessoa pode baixar: a versão 0.4.0 está na [página Tracker](/pt/tracker), com o [guia de instalação passo a passo](/pt/tracker#instalacao).

Ele faz o que já fazia: registra as suas partidas sozinho poucos segundos depois do fim, lê as cartas jogadas na janela do jogo com o scanner de tela, mostra o Deck tracker ao vivo com as cartas do oponente e adiciona um overlay para o OBS. Ele nunca mexe no jogo, e nenhuma imagem sai do seu PC.

## Só com uma conta OriginsMeta {#conta}

Para baixar o app, você faz login no OriginsMeta: a conta é gratuita. O app só funciona vinculado à sua conta: depois de instalar, crie um código na [página Tracker da sua conta](/pt/account/tracker) e digite no app. O app confere a vinculação ao abrir e a cada 4 horas, enviando só o token dele.

Se você já tem o app, não precisa baixar de novo: ele se atualiza sozinho para a versão 0.4.0 e depois pede que você vincule a sua conta, se ainda não tiver feito isso.

## Win rates, abertos a todos no Analytics {#analytics}

Os win rates calculados com as partidas registradas pelo app agora estão abertos a todos no [Analytics](/pt/analytics): Lendárias, decks da comunidade, arquétipos, cartas, confrontos entre Lendárias e as Lendárias que você mais enfrenta, patch a patch. Só totais: nunca nomes, partidas avulsas nem quem jogou. Os decks da comunidade mostram o win rate da sua lista exata na página deles e na [lista de decks](/pt/decks).

Até ontem esses números eram a aba "Win rate" da tier list: o endereço antigo agora leva ao Analytics.

## Um menu novo {#menu}

O menu do topo muda para abrir espaço: **Database** reúne [Guias](/pt/guides), [Cartas](/pt/cards) e [Locais](/pt/locations), e **Analytics** tem os win rates e a página [Tracker](/pt/tracker). No celular, você encontra tudo no Menu.

O OriginsMeta é um site de fãs não oficial, não afiliado à Koin Games.`,
    faq: [
      { q: "Como baixo o OriginsMeta Tracker?", a: "Faça login no OriginsMeta (a conta é gratuita), abra a página Tracker e aperte o botão de download. O guia de instalação na mesma página explica cada passo, desde extrair o zip até vincular o app à sua conta." },
      { q: "Dá para usar o OriginsMeta Tracker sem conta?", a: "Não: desde a versão 0.4.0 o app só funciona vinculado a uma conta OriginsMeta. Ele confere a vinculação ao abrir e a cada 4 horas, enviando só o token dele." },
      { q: "Onde ficam os win rates de Origins TCG no OriginsMeta?", a: "No Analytics, no menu do topo: os win rates de Lendárias, decks da comunidade, arquétipos e cartas, patch a patch, a partir das partidas registradas com o OriginsMeta Tracker." },
    ],
  },
  "upgrade-meta-1011": {
    title: "Upgrade Meta: OriginsMeta Analytics 0.3.4, o tracker de partidas de Origins TCG com um Deck tracker ao vivo",
    metaTitle: "OriginsMeta Analytics 0.3.4: tracker de Origins TCG",
    description:
      "OriginsMeta Analytics 0.3.4: o app para Windows que registra suas partidas de Origins TCG, com Deck tracker ao vivo e cartas do oponente. Em breve para todos.",
    summary:
      "Saiu o OriginsMeta Analytics 0.3.4, a versão que fecha esta semana de trabalho no nosso app para Windows dedicado a Origins TCG. Ele registra as suas partidas sozinho enquanto você joga, lê as cartas na janela do jogo e mostra um Deck tracker ao vivo: o seu deck com as cartas que você já comprou, as cartas que restam no deck, a vida do seu herói e as cartas do oponente à medida que aparecem. Hoje ele está em teste com Creators, Autores, jogadores Pro e o Staff; em breve estará disponível para todos.",
    highlights: [
      { label: "As suas partidas, registradas", text: "resultado, deck, rodadas, as cartas jogadas pelos dois lados e a Lendária do oponente, sozinho, poucos segundos depois do fim", anchor: "partidas" },
      { label: "Deck tracker ao vivo", text: "as suas 12 cartas que escurecem quando você as compra, a Lendária, as cartas que restam no deck e a vida do seu herói", anchor: "deck-tracker" },
      { label: "As cartas do oponente", text: "a Lendária dele, a vida dele e as cartas que ele revela, uma a uma", anchor: "oponente" },
      { label: "Tela cheia ou janela", text: "qualquer tamanho, demo e playtest, e ele se atualiza sozinho", anchor: "tela" },
      { label: "Em breve para todos", text: "hoje está em teste com Creators, Autores, jogadores Pro e o Staff", anchor: "para-todos" },
    ],
    body: `## Versão 0.3.4 {#versao}

O OriginsMeta Analytics é o nosso app para Windows dedicado a Origins TCG: ele registra as suas partidas enquanto você joga e mostra, ao vivo, o que está acontecendo no seu deck. A versão 0.3.4, lançada em 11 de outubro de 2026, fecha uma semana de trabalho em que o app aprendeu a ler as partidas na janela do jogo, já que o patch 0.7 não salva mais os dados da partida no seu PC. Ainda é uma versão de teste: o screenshot da capa vem de uma partida real da Demo 2.0, com os dois painéis do app por cima mostrando o que eles liam naquele momento (rodada 7) e os nomes dos jogadores removidos.

## As suas partidas, registradas sozinhas {#partidas}

Você abre o app, joga, e poucos segundos depois do fim a partida está no seu histórico: resultado, o deck que você escolheu no jogo, as rodadas, as cartas jogadas por você e pelo oponente rodada a rodada e a Lendária do oponente, vista na tela do VS. Se você vincular o app à sua conta OriginsMeta, as suas partidas também aparecem no site.

Para ler as cartas, o app usa o **scanner de tela**: ele olha só a janela de Origins TCG, reconhece as cartas no seu PC e nunca envia imagens para lugar nenhum. Ao site chegam só os IDs das cartas, nunca os nomes dos jogadores. Ele nunca mexe no jogo: nenhum arquivo gravado, nenhuma memória lida, nada que mude o funcionamento do jogo.

## O Deck tracker ao vivo {#deck-tracker}

O novo Deck tracker, desenhado por Davdas para uma olhada rápida e não para leitura: as suas 12 cartas em tamanho grande, em uma grade 4 × 3 por custo. Uma carta fica apagada quando você comprou uma das duas cópias ("1/2") e escurece quando comprou as duas: o app também lê as cartas da sua mão. Embaixo, a sua Lendária sozinha (ela escurece, com um zoom, no momento em que você a compra), as cartas que ainda estão no seu deck e a vida do seu herói, os dois segmentos do anel embaixo do herói.

![O Deck tracker durante uma partida da Demo 2.0: cartas compradas escurecidas, 8 cartas restantes no deck, 2 segmentos de vida](/media/analytics/deck-tracker-me.webp)

## As cartas do oponente {#oponente}

Um segundo painel, um pouco menor, para o oponente: a Lendária dele, a vida dele e as cartas que ele revela, que aparecem uma a uma ao longo da partida. Ele começa vazio e nunca mostra casas vazias.

![O painel do oponente: Dracula, um segmento de vida restante, Quasimodo e Captain Ahab revelados](/media/analytics/deck-tracker-opp.webp)

Os dois painéis ficam sobre o jogo, sem a moldura do Windows: arraste para onde quiser, alargue pelas bordas e eles nunca precisam de rolagem. Os mesmos painéis também são uma fonte de navegador para o OBS, para quem faz live.

## Tela cheia ou janela, demo e playtest {#tela}

O app funciona com Origins TCG em tela cheia ou em uma janela de qualquer tamanho e formato, em qualquer escala do Windows, com a Demo do Steam e com o playtest. Quando publicamos uma versão nova, ele baixa e reinicia atualizado sozinho, nunca durante uma partida.

## Em breve para todos {#para-todos}

Hoje o OriginsMeta Analytics está em teste com Creators, Autores, jogadores Pro e o Staff do site: eles jogam com ele todos os dias e nos contam o que não funciona. Em breve ele estará disponível para todos baixarem, junto com as páginas de win rate que vão usar as partidas de quem vincular o app (só totais, nunca quem jogou). Vamos anunciar a data aqui e no [nosso Discord](https://discord.gg/RAG7nnrNGP).

O OriginsMeta é um site de fãs não oficial, não afiliado à Koin Games.`,
    faq: [
      { q: "Quando o OriginsMeta Analytics vai estar disponível para todos?", a: "Em breve: hoje ele está em teste com Creators, Autores, jogadores Pro e o Staff. Vamos anunciar a data nas notícias e no Discord do OriginsMeta." },
      { q: "O OriginsMeta Analytics altera ou lê o jogo?", a: "Ele nunca mexe no jogo: lê só a imagem da janela de Origins TCG e os arquivos que o jogo salva no seu PC, sem gravar nada. As imagens ficam no seu PC e ao site chegam só os IDs das cartas, nunca os nomes dos jogadores." },
      { q: "Funciona em tela cheia e em janela?", a: "Sim, desde a versão 0.3.4: tela cheia ou uma janela de qualquer tamanho e formato, em qualquer escala do Windows, com a Demo do Steam e com o playtest." },
    ],
  },
  "upgrade-meta-1007": {
    title: "Upgrade Meta: o OriginsMeta fala francês, a quarta língua do site, com todas as cartas, guias e notícias",
    metaTitle: "Upgrade Meta: OriginsMeta para Origins TCG em francês",
    description:
      "O OriginsMeta agora está em francês: interface, notícias, guias, 230 cartas, 44 locais, deck builder e tier lists, com os textos das cartas lidos no jogo.",
    summary:
      "Desde 7 de outubro de 2026, o OriginsMeta também está em francês: interface, notícias, os 20 guias, as 230 cartas, os 44 locais, FAQ, eventos, MetaShifting, deck builder, tier lists e páginas da comunidade, em originsmeta.com/fr com os mesmos endereços das outras línguas. Desde 8 de outubro os textos das cartas em francês são os oficiais do jogo, lidos no jogo carta por carta. Guias de decks, guias da comunidade e quadrinhos são traduzidos para o francês automaticamente, e se você lê francês e encontrar um erro, escreva para nós.",
    highlights: [
      { label: "O francês chegou", text: "o site inteiro em /fr: interface, notícias, guias, cartas, locais, FAQ, eventos, MetaShifting, deck builder, tier lists e comunidade", anchor: "frances" },
      { label: "Textos das cartas, agora os do jogo", text: "desde 8 de outubro as páginas das cartas em francês mostram o texto oficial, lido no jogo, e o site inteiro usa as palavras-chave do jogo", anchor: "textos-das-cartas" },
      { label: "Comunidade em francês", text: "guias de decks, guias da comunidade e quadrinhos traduzidos automaticamente, torneios em francês, Discord com o link em francês", anchor: "comunidade" },
      { label: "Por que francês", text: "o jogo é traduzido para o francês e, depois do espanhol, ele é a quarta língua do site", anchor: "por-que-frances" },
      { label: "Ajude a gente", text: "se você lê francês e encontrar um erro, escreva para nós: o botão Feedback ou o nosso Discord", anchor: "ajuda" },
    ],
    body: `## O francês chegou {#frances}

Desde 7 de outubro de 2026, o OriginsMeta também está em francês, a quarta língua do site depois do inglês, do italiano e do espanhol. Você troca de língua com EN · IT · ES · FR no topo de cada página (no celular, dentro do Menu). Cada página mantém o mesmo endereço das outras línguas, com o prefixo /fr/: originsmeta.com/fr/cards, /fr/guides, /fr/deck-builder. Se o seu navegador está em francês, originsmeta.com leva direto à versão francesa, e hreflang e sitemap listam as quatro versões de cada página.

O que está em francês: a interface, as 32 notícias publicadas até agora, os 20 [guias](/pt/guides), as páginas das 230 [cartas](/pt/cards) (texto da carta e nota de origem), os 44 [locais](/pt/locations), o [FAQ](/pt/faq), os [eventos](/pt/tournaments), o histórico de balanceamento ([MetaShifting](/pt/metashifting)), o [deck builder](/pt/deck-builder), as [tier lists](/pt/tier-list) e as páginas da comunidade. Escrevemos em francês padrão, legível em todos os países francófonos, e os nomes das cartas continuam em inglês, como no jogo.

O francês já tinha aparecido na primeira versão do site, em setembro de 2026, e foi retirado em 15 de setembro: ele volta reconstruído do zero, com as mesmas regras de SEO das outras línguas (um H1 por página, title e description próprios, links internos, dados estruturados).

## Os textos das cartas em francês: os do jogo, desde 8 de outubro {#textos-das-cartas}

Atualização de 8 de outubro: lemos as cartas no jogo em francês. As 122 cartas da coleção da Demo 2.0 agora mostram o texto oficial em francês nas suas páginas, como em italiano e espanhol, e o site inteiro (páginas das cartas, tags das palavras-chave, guias, notícias, deck builder) usa as palavras-chave do jogo. Três são diferentes do glossário provisório com que começamos: First Strike é "Première frappe" (não "Initiative"), um espaço no tabuleiro é uma "case" e os personagens Evil, no texto das regras, são "Mauvais". As cartas criadas e as cartas removidas, que a coleção do jogo não mostra, continuam sendo uma tradução nossa, agora com o glossário do jogo, e as páginas delas dizem isso. Os 44 locais ainda não foram conferidos no jogo em nenhuma língua.

Quando o francês chegou, em 7 de outubro, os textos das cartas eram uma tradução do OriginsMeta, escrita com um glossário provisório das palavras-chave (On Reveal "À la révélation", Shield "Bouclier", Trample "Piétinement", Deathtouch "Contact mortel", Defender "Défenseur", First Strike "Initiative"), e cada página de carta em francês dizia isso.

## A comunidade em francês {#comunidade}

O que a comunidade publica também é traduzido para o francês, automaticamente, depois da publicação, como já acontece entre inglês, italiano e espanhol: os guias dos decks publicados (decks individuais e decks de torneio), os guias da comunidade e os quadrinhos dos creators. As traduções do que já está no ar chegam nos próximos dias. Os torneios também podem ser criados em francês, e o [nosso Discord](https://discord.gg/RAG7nnrNGP) anuncia os conteúdos novos também com o link para a página em francês.

## Por que francês {#por-que-frances}

Origins TCG é traduzido para o francês: a página do jogo no Steam lista o francês entre as suas 13 línguas da interface (o áudio completo é só em inglês). Depois do [espanhol, que chegou em 25 de setembro](/pt/news/upgrade-meta-0925), o francês é a quarta língua do OriginsMeta, pelo mesmo motivo: ser lido nas línguas que o jogo fala.

## Ajude a gente a acertar {#ajuda}

Se você lê francês e encontrar um erro, uma frase estranha ou uma palavra-chave que não bate com o jogo, conte para nós: com o botão Feedback, em todas as páginas, ou no nosso Discord. Lemos tudo e corrigimos na próxima atualização.`,
    faq: [
      { q: "O OriginsMeta está disponível em francês?", a: "Sim, desde 7 de outubro de 2026: o site inteiro, com guias, notícias, cartas, locais, tier lists e o deck builder. Você troca de língua com EN · IT · ES · FR no topo da página; os guias dos decks da comunidade, os guias e os quadrinhos são traduzidos automaticamente." },
      { q: "Os textos das cartas em francês são oficiais?", a: "Sim, desde 8 de outubro de 2026: lemos no jogo em francês as 122 cartas da coleção da Demo 2.0, e as páginas delas mostram o texto oficial, como em italiano e espanhol (lidos em 25 de setembro). As cartas criadas e as removidas, que a coleção do jogo não mostra, continuam sendo uma tradução nossa com o glossário do jogo, e as páginas delas dizem isso." },
      { q: "Os decks e os guias da comunidade são traduzidos para o francês?", a: "Sim, automaticamente depois da publicação: os guias dos decks publicados, os guias da comunidade e os quadrinhos dos creators. As traduções do que já está no ar chegam nos próximos dias, e os torneios também podem ser criados em francês." },
    ],
  },
  "upgrade-meta-1005": {
    title: "Upgrade Meta: decks de torneio, três decks do Conquest publicados juntos com um só guia",
    metaTitle: "Upgrade Meta: decks de torneio de Origins TCG",
    description:
      "Novidade no OriginsMeta: decks de torneio, três decks do Conquest de Origins TCG publicados juntos com um só guia, e as regras da Crimson Cup conferidas.",
    summary:
      "A seção Decks agora tem duas partes: decks individuais e decks de torneio. Um deck de torneio é um conjunto de três decks do Conquest publicados juntos com um só guia, que explica como eles funcionam em equipe, e o site confere as regras da Crimson Cup para você antes de publicar.",
    highlights: [
      { label: "Decks de torneio", text: "três decks do Conquest e um guia em uma só página, em Decks", anchor: "decks-de-torneio" },
      { label: "Como publicar", text: "modo Torneio no deck builder, depois “Publicar os 3 decks”", anchor: "publicar" },
      { label: "Regras do Conquest", text: "três Lendárias diferentes e pelo menos 8 cartas diferentes entre dois decks quaisquer", anchor: "regras" },
      { label: "A página de um conjunto", text: "o papel de cada deck, os três códigos do jogo, votos e guia traduzido", anchor: "pagina-do-conjunto" },
      { label: "Para streamers", text: "link curto, comando de chat !deck, overlay para o OBS e imagem do seu conjunto", anchor: "streamers" },
    ],
    body: `## Decks de torneio {#decks-de-torneio}

Em um torneio Conquest como a Crimson Cup você não leva um deck, leva três. Até agora o OriginsMeta só tinha decks individuais, então um conjunto de três precisava ser publicado como três páginas separadas, cada uma com o seu guia. Agora o menu [Decks](/pt/decks) tem duas partes: **Decks individuais** e **[Decks de torneio](/pt/decks/tournament)**.

Um deck de torneio são três decks publicados juntos, com **um só guia** para o conjunto inteiro: o plano de jogo dos três decks e o papel de cada um (quando escolher, quais confrontos ele cobre), mais pontos fortes, pontos fracos, confrontos e notas, se você quiser adicionar.

## Como publicar um deck de torneio {#publicar}

1. Abra o [deck builder](/pt/deck-builder) e passe para **Torneio (3 decks)**. O botão "Publicar um deck de torneio" na página [Decks de torneio](/pt/decks/tournament) já abre nesse modo.
2. Monte os decks A, B e C. A tabela embaixo dos decks mostra quantas cartas diferentes cada par tem.
3. Quando os três decks estiverem completos e seguirem as regras, aperte **Publicar os 3 decks**.
4. Dê um nome ao conjunto, escreva o plano de jogo e o papel de cada deck, e publique.

Você precisa estar [logado](/pt/login). Os seus decks de torneio ficam na [sua conta](/pt/account), onde você pode editar, ocultar ou excluir, e no seu perfil público. Cada conta pode publicar tantos decks de torneio quanto decks individuais (5 para contas da comunidade, 20 para Autores, sem limite para Creators, jogadores Pro e Staff), contados separadamente.

## As regras do Conquest, conferidas para você {#regras}

Cada conjunto segue as regras da Crimson Cup, as mesmas que o deck builder já usa:

- **três Lendárias diferentes**, uma por deck;
- **pelo menos 8 cartas únicas diferentes entre dois decks quaisquer**: cada carta conta uma vez, Lendária incluída, então dois decks podem compartilhar no máximo 5 cartas.

Se um conjunto não segue essas regras, o botão fica desligado e o deck builder diz o que está errado; o site confere de novo na hora de publicar. O nosso [guia do Conquest](/pt/guides/origins-tcg-conquest) explica como montar três decks que se sustentam juntos.

## A página de um conjunto {#pagina-do-conjunto}

- O plano de jogo no topo, depois **os três decks**: para cada um, o papel no conjunto, as cartas completas, o **código do jogo** para colar em Origins TCG e "Abrir no deck builder".
- Um quadro com as regras do Conquest e as cartas diferentes entre cada par de decks.
- **Votos** de 1 a 5 estrelas, como nos decks individuais (nunca no seu próprio conjunto).
- O guia é escrito em uma língua e **traduzido automaticamente** para as outras duas.
- Quando você publica, o conjunto é anunciado na hora no nosso [Discord](https://discord.gg/RAG7nnrNGP), em #community-decks, e quem segue você recebe uma notificação se você for Creator, Autor, jogador Pro ou Staff.
- Na sua conta você vê as visitas, os códigos copiados e os cliques dos seus conjuntos: são estimativas, como as dos decks individuais.

## Para streamers {#streamers}

Cada deck de torneio tem as mesmas ferramentas dos decks individuais, no menu "Para streamers" da página dele:

- um **link curto**, originsmeta.com/d/ seguido do código do conjunto, para falar na live;
- o **comando de chat !deck** para Nightbot, StreamElements e Fossabot, que escreve no chat o conjunto e as suas três Lendárias;
- um **overlay para o OBS** com os três decks, vertical ou horizontal;
- uma **imagem** do conjunto para baixar em 16:9 ou 9:16.

Comando e overlay aparecem só para quem publicou o conjunto. O [guia de ferramentas para lives](/pt/guides/streaming-tools) explica passo a passo como adicionar.

## Participe {#participe}

Monte os seus três decks no [deck builder](/pt/deck-builder), publique e mande o link para o seu time antes do torneio. Esteja entre os primeiros a publicar em [Decks de torneio](/pt/decks/tournament).`,
    faq: [
      { q: "Como publico três decks do Conquest juntos no OriginsMeta?", a: "No deck builder, passe para o modo Torneio, monte os decks A, B e C com três Lendárias diferentes e pelo menos 8 cartas diferentes entre dois decks quaisquer, depois aperte \"Publicar os 3 decks\" e escreva um só guia para o conjunto." },
      { q: "Os decks de torneio seguem as regras da Crimson Cup?", a: "Sim. Cada conjunto tem três Lendárias diferentes e pelo menos 8 cartas únicas diferentes entre dois decks quaisquer, Lendária incluída. O deck builder e o site conferem isso antes de o conjunto ir ao ar." },
    ],
  },
  "upgrade-meta-1003": {
    title: "Upgrade Meta: draft contra o Cérebro, versões dos decks, decks salvos e novos filtros de cartas",
    metaTitle: "Upgrade Meta: draft e versões dos decks de Origins TCG",
    description:
      "Novidade no OriginsMeta: draft de Origins TCG contra o nosso bot ou um amigo, decks atualizados para o patch 0.7, decks salvos e em alta, novos filtros.",
    summary:
      "Nos últimos dias o OriginsMeta ganhou um draft gratuito de Origins TCG, contra o nosso bot ou contra um amigo, e agora você pode atualizar os seus decks publicados para o patch 0.7 sem perder nome, guia e votos. Você também pode salvar os decks de que gosta, encontrar os que estão em alta, filtrar as cartas por custo, palavra-chave, Poder e Vida e ver o antes e depois das cartas alteradas em cada patch.",
    highlights: [
      { label: "Draft", text: "três formatos contra o Cérebro, o nosso bot, ou contra um amigo em uma sala on-line", anchor: "draft" },
      { label: "Versões dos decks", text: "atualize um deck publicado para o patch 0.7 e mantenha nome, guia e link", anchor: "versoes-dos-decks" },
      { label: "Decks salvos e em alta", text: "o botão Salvar, as ordens Em alta e Mais salvos e o filtro por versão do jogo", anchor: "decks-salvos" },
      { label: "Cartas e MetaShifting", text: "filtros por custo, palavra-chave, Poder e Vida, e o antes e depois de cada patch", anchor: "cartas" },
      { label: "OriginsMeta Analytics", text: "o nosso tracker de partidas, em pausa desde o patch 0.7: diga se você quer", anchor: "analytics" },
      { label: "Login e perfil", text: "o código do e-mail ao lado do link e uma página só para o seu perfil público", anchor: "conta" },
      { label: "Guias e quadrinhos", text: "o guia das ferramentas para lives e quadrinhos desenhados em mais de uma língua", anchor: "guias-quadrinhos" },
    ],
    body: `## Draft contra o Cérebro ou um amigo {#draft}

O [Draft](/pt/draft) é um jeito gratuito de montar um deck de Origins TCG com cartas que você escolhe uma de cada vez. Você escolhe a sua Lendária e as suas cartas e depois monta um deck com as regras do jogo (1 Lendária e 12 cartas, cada uma contando duas vezes: 25 cartas). São três formatos:

- **Troca**: você vê 3 cartas, fica com uma, dá uma ao oponente e a terceira é queimada.
- **Trio**: 3 cartas em comum, um jogador escolhe, depois o outro, e a terceira é queimada. Você vê tudo o que o oponente pega.
- **Pacotes**: pacotes de 6 cartas que vocês passam de um para o outro, como em um TCG de papel. Você não vê as escolhas do oponente.

**Contra o Cérebro** você joga na hora, sem conta: o Cérebro é o nosso bot e ele só sabe o que um jogador no lugar dele saberia. **Contra um amigo** você cria uma sala e manda o link ou o código: o draft começa assim que o seu amigo entra, com um cronômetro em cada escolha (quando o tempo acaba, o Cérebro escolhe por quem não escolheu). Os dois precisam estar logados.

No fim o Cérebro dá o veredito sobre os dois decks, de Excelente a Fraco, com base na curva, nas remoções e nas sinergias: é a opinião do bot, a partida de verdade é jogada no jogo. Você pode copiar o código do jogo, abrir o deck no [deck builder](/pt/deck-builder) ou desafiar um amigo no mesmo draft, com as mesmas cartas na mesma ordem.

## Versões dos decks {#versoes-dos-decks}

Depois do [patch 0.7](/pt/news/patch-0-7) muitos decks publicados tinham cartas que agora custam mais. Agora você pode **atualizar as cartas de um deck publicado** e manter o nome, o guia, os vídeos e o link: na página do seu deck, ou na [sua conta](/pt/account), aperte "Atualizar para a versão 0.7", mude as cartas no deck builder e salve. Antes de salvar você vê o que entra e o que sai.

As versões anteriores ficam na página do deck, em "Versões deste deck", com as mudanças e a avaliação de cada uma. Os votos nunca são apagados: a avaliação mostrada é a da versão atual, enquanto os votos antigos ficam com a versão que receberam.

## Decks salvos e em alta {#decks-salvos}

- **Salvar**: na página de cada deck há um botão para salvá-lo. Os seus decks salvos ficam na [sua conta](/pt/account), em "Decks salvos". Só você vê a lista.
- **Novas ordens** em [Decks](/pt/decks): **Em alta**, os decks que receberam mais atenção nesta semana (visitas, códigos copiados, votos e salvamentos), e **Mais salvos**.
- **Versão do jogo**: o painel de filtros de Decks agora tem a versão do jogo, com o número de decks de cada uma. Cada deck mostra o patch para o qual foi montado.

## Cartas e MetaShifting {#cartas}

- Em [Cartas](/pt/cards) há uma linha de filtros de custo (de 0 a 6, e 7+) sempre à vista, e em "Mais filtros" a palavra-chave e as faixas de Poder e Vida, além de um botão para limpar tudo.
- No [MetaShifting](/pt/metashifting), cada patch agora começa com "Antes e depois": cada carta cujo custo, Poder ou Vida mudou, lado a lado, com os valores alterados em destaque.

## OriginsMeta Analytics {#analytics}

O OriginsMeta Analytics é o nosso app para Windows que registra as suas partidas de Origins TCG sozinho enquanto você joga: o deck, o resultado, as Lendárias que você enfrentou, com um overlay sobre o jogo e para o OBS. Ele está pronto e funciona, mas desde o patch 0.7 o jogo não salva mais no seu PC os dados da partida que o app lia, então por enquanto ele está em pausa, e as páginas de win rate estão desligadas.

Queremos mostrá-lo ao time da Koin Games e perguntar se esses dados podem voltar a ficar disponíveis. Se você tem interesse, aperte **"Sim, eu quero"** na página: quanto mais jogadores pedirem, mais o pedido pesa.

## Login e perfil {#conta}

- **Código do e-mail**: o e-mail de login agora traz um código ao lado do link. Se o link abrir em outro navegador (no celular, no app do Gmail) ou não funcionar, digite o código no painel de login, em "Já tem o código do e-mail?".
- **A sua página pública**: na sua conta, embaixo da sua página pública, o botão "Editar minha página pública" leva a uma página só dela, com a sua bio, os canais, a foto e, para Creators, Autores, jogadores Pro e Staff, a vitrine.
- **Menu**: no computador, Tier list e Deck builder abrem um submenu, com as páginas da tier list, o Analytics e o Draft.

## Guias e quadrinhos {#guias-quadrinhos}

- Um guia novo: [fazer live de Origins TCG](/pt/guides/streaming-tools), com o overlay para o OBS, o comando de chat !deck, os links curtos e o selo LIVE, passo a passo.
- Os quadrinhos agora podem ter versões desenhadas em cada língua: quem lê vê a versão desenhada na sua língua em vez da tradução automática.
- Os guias dos decks publicados antes do patch 0.7 mantêm a estratégia como foi escrita, com uma nota no topo: as tabelas de cartas mostram os custos novos.

## Participe {#participe}

[Cadastre-se](/pt/login) de graça com o Discord ou o seu e-mail, experimente o [Draft](/pt/draft) e atualize os seus decks para o patch 0.7. E [entre no nosso Discord](https://discord.gg/RAG7nnrNGP): tudo o que entra no ar no site é postado lá.`,
    faq: [
      { q: "Existe um modo draft para Origins TCG?", a: "Ainda não no jogo, mas o OriginsMeta tem um gratuito em originsmeta.com/pt/draft: três formatos contra o Cérebro, o nosso bot, sem conta, ou contra um amigo em uma sala on-line. No fim você pode copiar o código do jogo do seu deck." },
      { q: "Como atualizo o meu deck publicado para o patch 0.7?", a: "Na página do seu deck ou na sua conta, aperte \"Atualizar para a versão 0.7\", mude as cartas no deck builder e salve. Nome, guia, vídeos e link continuam os mesmos, e a versão anterior fica na página com a sua avaliação." },
      { q: "Por que os win rates estão desligados?", a: "Desde o patch 0.7 o jogo não salva mais no seu PC os dados da partida que o OriginsMeta Analytics lia. O app está em pausa: se você quer, diga isso na página do Analytics, e nós vamos mostrar à Koin Games." },
    ],
  },
  "playtest-patch-notes-1001": {
    title: "Notas do playtest de Origins TCG: missões separadas da ranqueada, dois locais novos, animações mais rápidas",
    metaTitle: "Notas do playtest de Origins TCG: missões e ranqueada",
    description:
      "Atualização do playtest de Origins TCG de 1º de outubro: missões PvE separadas da ranqueada, filtros no deck builder, dois locais novos e um pool de torneio.",
    summary:
      "A Koin Games atualizou a build de playtest da Demo 2.0, a maior atualização dela desde a 0.6.3. As missões passam a ser só PvE e não ficam mais entre você e a ranqueada, o construtor de decks ganha mais filtros e chegam dois locais. As dez mudanças de balanceamento são as que a demo principal já tem.",
    highlights: [
      { label: "Missões e ranqueada separadas", text: "missões só PvE, matchmaking da ranqueada quando você quiser", anchor: "missoes-ranqueada" },
      { label: "Um construtor de decks com mais filtros", text: "palavras-chave ao passar o mouse, uma ou duas cópias bem visíveis", anchor: "deck-builder" },
      { label: "Ranking mundial na tela do VS", text: "para os jogadores Grandmaster", anchor: "grandmaster" },
      { label: "Animações mais rápidas", text: "e um controle separado para o volume das vozes", anchor: "velocidade-audio" },
      { label: "Dez mudanças de balanceamento", text: "todas já na demo principal e no OriginsMeta", anchor: "balanceamento" },
      { label: "Cinco mudanças de cartas novas nestas notas", text: "En Passant, Atordoado, Toque mortífero, Boitata, Reflection", anchor: "mudancas-novas" },
      { label: "Dois locais novos, um removido", text: "entram Ballroom e Tectonic Decay, sai Ashen Grove", anchor: "locais-novos" },
      { label: "Um pool de locais para os torneios", text: "as batalhas em sala também o usam", anchor: "pool-de-torneio" },
    ],
    body: `## O playtest alcança a demo {#playtest}

A Koin Games atualizou o playtest da Demo 2.0, a build separada em que você entra pelo Discord oficial. "Esta é a nossa maior atualização desde a 0.6.3", escreve o time, e avisa que a build acabou de sair do desenvolvimento: vai haver bugs e coisas provisórias. Muitas das mudanças, acrescenta o time, já tinham chegado à demo principal com [a atualização de 21 de setembro](/pt/news/demo-patch-notes-0921) e com o [patch 0.7](/pt/news/patch-0-7).

## Missões e ranqueada separadas {#missoes-ranqueada}

As missões e os chefes agora são totalmente PvE: você enfrenta só bots, e eles servem só para desbloquear decks. Eles têm o seu próprio botão Jogar na tela Missões, então o botão Jogar da tela inicial agora é só para o matchmaking de verdade, que você pode usar quando quiser.

- Você não precisa mais terminar todas as missões para o matchmaking da ranqueada encontrar um adversário: ele tenta achar um oponente adequado toda vez que você joga a ranqueada. O time ainda está trabalhando nisso.
- **Neste playtest, as missões dos decks não podem ser concluídas pelo modo ranqueado.** O time vai reativar isso em uma build futura. Se você ainda tem decks para desbloquear, jogue as missões pela área Missões.
- A trilha de recompensas distribui os prêmios por mais missões, e a tela Missões tem uma troca de deck para mudar o seu deck.

Como a ranqueada funciona na demo, e o que sabemos da ladder, está no [nosso guia da ranqueada](/pt/guides/origins-tcg-ranked).

**Atualização de 11 de outubro:** com a atualização 0.7.1 do playtest, de 8 de outubro, as partidas ranqueadas voltam a contar para as missões dos decks, e as missões continuam podendo ser jogadas em PvE pela área Missões ([as notas do patch 0.7.1](/pt/news/playtest-patch-notes-0-7-1#missoes-ranqueada)).

## Construtor de decks, feed de notícias e Grandmaster {#interface}

### Um construtor de decks com mais filtros {#deck-builder}

Uma nova barra de ferramentas com mais filtros. Ao passar o mouse sobre uma carta da coleção, aparecem as palavras-chave dela. O deck agora mostra claramente de quais cartas você tem duas cópias e de quais só uma: os jogadores novos tinham dificuldade com isso.

### Um feed de notícias no jogo {#feed-de-noticias}

O jogo tem o seu próprio feed de notícias: se você está lendo as notas lá, escreve o time, você já viu.

### Ranking mundial na tela do VS {#grandmaster}

Os jogadores da divisão Grandmaster, a mais alta, agora mostram o seu ranking mundial na tela do VS.

### Gradação das cartas: ainda não {#gradacao}

Os visuais da gradação das cartas não estão nesta atualização, e as informações de "How Grading Works" que você vai encontrar são provisórias: o time pede para ignorar. Ele pede, sim, feedback sobre a experiência de abrir pacotes, no Discord.

## Velocidade e áudio {#velocidade-audio}

As animações e as pausas entre elas estão mais rápidas. "Isso ainda precisa de muito mais trabalho", escreve o time: a velocidade continua sendo uma das suas maiores prioridades. As vozes estão mais profissionais e mais bem mixadas, e há um controle separado para o volume das vozes.

## Balanceamento das cartas: tudo já no OriginsMeta {#balanceamento}

As dez mudanças de balanceamento das notas são as que a demo principal recebeu com a atualização de 21 de setembro e com o patch 0.7: as páginas das cartas, o [deck builder](/pt/deck-builder) e o [MetaShifting](/pt/metashifting) já as usam. Formato: mana · Poder/Vida para os personagens, só mana para os feitiços.

| Carta | Antes | Depois | Na demo desde |
| --- | --- | --- | --- |
| Dorothy | 5 · 1/1 | 4 · 1/1 | 21 de setembro |
| Wicked Stepmother | 4 · 3/6 | 4 · 4/6 | 21 de setembro |
| Beauty | 4 · 1/1 | 4 · 2/1 | 21 de setembro |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | 21 de setembro |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | 21 de setembro |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | 21 de setembro |
| Roo | 2 · 2/3 | 2 · 2/4 | 21 de setembro |
| Bagheera | 1 · 1/1 | 2 · 1/1 | patch 0.7 |
| Spellbook | 3 | 4 | patch 0.7 |
| Mind Palace | 2 | 3 | patch 0.7 |

## Cartas que mudam o que fazem {#mudancas-de-cartas}

### Novidades nestas notas {#mudancas-novas}

Cinco mudanças não aparecem nas notas do patch da demo de 21 e 29 de setembro:

- **En Passant** agora pode mirar espaços ocupados: se o espaço estiver ocupado, o seu aliado fica onde está, mas causa o dano mesmo assim.
- **Atordoado** agora é removido no fim do combate.
- **Toque mortífero** não destrói mais personagens com Escudo.
- **Boitata** deve se comportar melhor, principalmente quando os dois jogadores têm uma.
- **Reflection** tem um texto um pouco mais claro; o time admite que a carta talvez precise de uma cirurgia para ficar mais intuitiva.

Ainda não sabemos se elas já estão na demo principal: vamos conferir no jogo antes de mudar as páginas das cartas.

### Já na demo {#ja-na-demo}

- Don Quixote tem Defensor ele mesmo, além de dá-lo aos inimigos no seu local (21 de setembro: as notas da demo diziam só que ele ganhava Defensor).
- Twister Toss pode mover um aliado para um espaço ocupado, e os dois trocam de lugar (patch 0.7).
- Van Helsing's Tools: Silver Bullet pode atingir barreiras; Wooden Stake pode mirar personagens sem dano, mas só funciona se o personagem estiver com dano quando ela se resolve (21 de setembro).
- Heroic Charge se acumula direito quando é jogada mais de uma vez (21 de setembro).
- Spellbook e Humpty não podem mais gerar a si mesmas como carta aleatória (patch 0.7).
- Os personagens com Escolhe uma podem escolher de novo se voltarem para a sua mão, e mantêm as suas estatísticas (21 de setembro, para Frog Prince e Magic Carpet).
- As cartas mantêm as suas estatísticas no cemitério: uma Mummy com buff volta com todo o seu Poder (21 de setembro).

## Locais {#locais}

### Dois novos, um removido {#locais-novos}

- **Ballroom** (novo): depois do combate, para os dois jogadores, um personagem aleatório aqui volta à mão do seu dono.
- **Tectonic Decay** (novo): depois do combate, causa 1 de dano às duas barreiras aqui.
- **Ashen Grove** (removido): quando você jogava um personagem aqui, descartava a sua carta mais à direita e depois comprava uma carta.

As notas comparam o playtest com a build anterior dele. A nossa [página de Locais](/pt/locations), a lista da Demo 2.0 de 21 de setembro, já tem Ballroom e ainda tem Ashen Grove, enquanto Tectonic Decay não está lá: vamos atualizá-la quando virmos quais locais estão na demo principal.

### Raridade e um pool de torneio {#pool-de-torneio}

A raridade dos locais agora é uma raridade de verdade, comum, rara, muito rara ou ultrarrara, que não depende mais de quantos locais existem no jogo: a mesma mudança que a demo recebeu com o patch 0.7.

Os torneios agora têm o seu próprio pool de locais, então os locais podem ser incluídos nas competições ou deixados de fora sem mudar as partidas do dia a dia. O primeiro exemplo é a [Crimson Cup](/pt/news/crimson-cup-format-check-in): alguns dos locais mais imprevisíveis estão fora do pool dela. O time diz que a lista completa está no seu último anúncio; vamos trazê-la assim que a lermos.

**Atualização de 7 de outubro:** a lista veio com o post do Steam de 5 de outubro: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum e Nostradamus' Call estão fora do pool da Crimson Cup ([o nosso artigo](/pt/news/crimson-cup-prizepool-qualifiers#locais)).

Nesta build, as batalhas em sala (Create/Join Room Battle) usam o pool de torneio: são o jeito de treinar com os locais da Crimson Cup.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Se as cinco mudanças novas de cartas, Tectonic Decay e a remoção de Ashen Grove já estão na demo principal.
- Quais locais estão fora do pool da Crimson Cup: respondido em 5 de outubro, veja a atualização acima.
- O novo texto de Reflection.

## O que muda no OriginsMeta {#no-site}

- As estatísticas das cartas não mudam: as dez mudanças de balanceamento estão no banco de dados de cartas, no deck builder e no MetaShifting desde 21 e 29 de setembro.
- As páginas de En Passant, Boitata e Reflection mantêm o texto atual até lermos o novo no jogo.
- A página [Locais](/pt/locations) fica como está até conferirmos os locais novos na demo principal.

## De onde vêm estas notas {#fontes}

As notas do patch que o time postou no [Discord oficial de Origins TCG](https://discord.gg/originstcg) em 1º de outubro, com a atualização do playtest; como entrar no playtest está explicado no canal do Discord demo-v2-playtest-instructions. Em 1º de outubro elas não estão no Steam.`,
    faq: [
      { q: "É preciso terminar as missões para jogar a ranqueada no playtest de Origins TCG?", a: "Não. Desde a atualização do playtest de 1º de outubro de 2026 as missões são só PvE e servem para desbloquear decks, e o matchmaking da ranqueada encontra um adversário toda vez que você joga a ranqueada. Neste playtest, porém, as missões dos decks não podem ser concluídas pela ranqueada: jogue-as pela tela Missões." },
      { q: "A atualização do playtest muda as estatísticas das cartas para a Crimson Cup?", a: "Não. As suas dez mudanças de balanceamento, como Dorothy a 4 de mana e Bagheera a 2, são as que a demo principal já recebeu em 21 e 29 de setembro de 2026; o patch 0.7 é o último patch de balanceamento antes do torneio." },
      { q: "Como treinar com os locais da Crimson Cup?", a: "Na build de playtest, as batalhas em sala (Create/Join Room Battle) usam o pool de locais do torneio, do qual alguns dos locais mais imprevisíveis foram tirados para a Crimson Cup." },
    ],
  },
  "patch-0-7": {
    title: "Patch 0.7, o último de balanceamento antes da Crimson Cup: rework de Twister Toss, três cartas mais caras",
    metaTitle: "Notas do patch 0.7 de Origins TCG: Twister Toss e nerfs",
    description:
      "Patch 0.7 de Origins TCG, o último de balanceamento antes da Crimson Cup: rework de Twister Toss, e Bagheera, Mind Palace e Spellbook custam 1 a mais.",
    summary:
      "O patch 0.7, a segunda atualização da demo, é o último patch de balanceamento antes da Crimson Cup. Twister Toss ganha um rework, Bagheera, Mind Palace e Spellbook custam 1 de mana a mais e os locais agora aparecem por raridade. Ele também corrige Humpty, Spellbook, Heroic Charge e os Defensores múltiplos, e leva o jogo a 13 línguas.",
    highlights: [
      { label: "O último patch de balanceamento antes da Crimson Cup", text: "saiu em 29 de setembro, três semanas antes da primeira classificatória", anchor: "crimson-cup" },
      { label: "Rework de Twister Toss", text: "move um aliado para qualquer espaço e troca de lugar com a carta que já está lá", anchor: "twister-toss" },
      { label: "Três cartas custam 1 a mais", text: "Bagheera 2, Mind Palace 3, Spellbook 4", anchor: "custos" },
      { label: "Humpty e Spellbook não dão mais a si mesmas", anchor: "humpty-spellbook" },
      { label: "Mão cheia", text: "uma carta devolvida agora é queimada, em vez de a habilidade falhar", anchor: "mao-cheia" },
      { label: "Heroic Charge e Defensor corrigidos", anchor: "correcoes-de-bugs" },
      { label: "Os locais têm uma raridade", text: "comum, rara, muito rara ou ultrarrara", anchor: "locais" },
      { label: "13 línguas no jogo", anchor: "linguas" },
      { label: "Boogeyman", text: "as notas dizem que muda, não como", anchor: "boogeyman" },
    ],
    body: `## O último patch de balanceamento antes da Crimson Cup {#crimson-cup}

"Este é o patch de balanceamento FINAL antes do torneio", escreve o time. A Crimson Cup começa em 20 de outubro com a classificatória EMEA, durante o Steam Next Fest, e é jogada em Conquest com três decks ([as regras](/pt/news/crimson-cup-format-check-in)). Em 24 de setembro o time tinha dito que o último patch de balanceamento chegaria duas semanas antes do festival: ele chegou em 29 de setembro, três semanas antes. Se o plano se mantiver, estes são os custos e as estatísticas com que o torneio vai ser jogado.

A imagem oficial o chama de Steam Demo Update #2, versão 0.7: é a segunda atualização da demo, depois [da de 21 de setembro](/pt/news/demo-patch-notes-0921).

## Todas as mudanças de balanceamento {#balanceamento}

Formato: mana · Poder/Vida para os personagens, só mana para os feitiços.

| Carta | Antes | Depois | O que muda |
| --- | --- | --- | --- |
| Bagheera | 1 · 1/1 | 2 · 1/1 | custa 1 a mais |
| Mind Palace | 2 | 3 | custa 1 a mais |
| Spellbook | 3 | 4 | custa 1 a mais; os seus feitiços aleatórios não podem mais ser Spellbook |
| Twister Toss | 1 | 1 | rework: move um aliado para qualquer espaço, trocando de lugar com a carta que já está lá |

Nenhuma Lendária muda custo, estatísticas ou habilidade: Dorothy só ganha uma explicação mais clara das suas palavras-chave.

## Rework de Twister Toss {#twister-toss}

Até agora Twister Toss, um feitiço de 1 de mana, fazia uma coisa só: mover um aliado. Depois do rework ele move um aliado para qualquer espaço, e se já houver outra carta lá, as duas trocam de lugar.

Ele também pode mirar espaços ocupados. O time dá dois exemplos:

- tirar um personagem do lugar e trazê-lo de volta na mesma rodada;
- destruir o seu personagem com Trash for Treasure e logo mover outro personagem para o espaço dele.

No OriginsMeta Twister Toss está em três decks publicados, entre eles o [Dorothy Combo](/pt/guides/dorothy-combo-guide): Dorothy cresce cada vez que um aliado se move. As notas do patch não trazem o novo texto da carta: a página dela mostra o antigo, com um aviso, até lermos o novo no jogo.

## Três cartas custam 1 a mais {#custos}

Entre os 35 decks publicados no OriginsMeta (contagem às 00:13 CEST de 30 de setembro), Mind Palace está em 22 e Spellbook em 17: são as duas cartas mais jogadas do site. Bagheera está em 13. O ranking completo está em [as cartas mais jogadas](/pt/tier-list/most-played).

### Bagheera: 2 de mana {#bagheera}

Bagheera continua sendo um 1/1 cuja habilidade Ao revelar dá a ele +2⚔️/+2❤️ em um espaço central. Com 1 de mana ele era um 3/3 desde a primeira rodada; agora ele entra na segunda rodada, no mínimo.

### Mind Palace: 3 de mana {#mind-palace}

O feitiço que compra 2 cartas agora custa 3.

### Spellbook: 4 de mana {#spellbook}

Durante o resto da partida, Spellbook adiciona um feitiço aleatório à sua mão no início de cada rodada, para ser jogado antes do combate, senão é descartado. Agora ele custa 4, e os seus feitiços aleatórios não podem mais ser Spellbook.

## Mudanças de habilidades e correções {#correcoes}

### Humpty e Spellbook não dão mais a si mesmas {#humpty-spellbook}

As cartas aleatórias que elas dão não podem mais ser elas mesmas. A habilidade Ao morrer de Humpty adiciona uma carta aleatória à sua mão: ela não pode mais ser Humpty. O feitiço aleatório que Spellbook adiciona a cada rodada não pode mais ser Spellbook.

### Mão cheia: uma carta devolvida é queimada {#mao-cheia}

Quando uma carta é devolvida a uma mão que já está cheia, agora ela é queimada (é perdida), em vez de a habilidade falhar. Entre as cartas da Demo 2.0, isso vale para as que devolvem uma carta à mão: White Queen e Stroke of Midnight, que devolvem QUALQUER personagem à mão do seu dono, e Koschei e Dracula, que voltam elas mesmas.

### Freeze! e Dorothy: palavras-chave explicadas {#palavras-chave}

Ao passar o mouse sobre elas, agora aparece a explicação das palavras-chave que usam, e elas aparecem na busca por palavra-chave da coleção.

## Correções de bugs {#correcoes-de-bugs}

### Heroic Charge {#heroic-charge}

Heroic Charge dá aos aliados +2⚔️ e Atropelar nesta rodada. Se um personagem que ela fortaleceu perde as suas habilidades, os +2⚔️ agora ficam; o Atropelar continua sendo removido.

### Mais de um Defensor {#defensores}

Quando você tem mais de um Defensor em um local e um deles está atordoado, agora o outro sempre defende no lugar dele.

## Os locais agora têm uma raridade {#locais}

Cada local agora é comum, raro, muito raro ou ultrarraro, e a raridade decide com que frequência ele aparece. O time explica assim: espere ver os conhecidos na maioria das partidas, e alguns que você só vai ver "uma vez na vida e outra na morte". As notas do patch não dizem que local tem que raridade: a página [Locais](/pt/locations) lista todos os locais da Demo 2.0 com os seus efeitos, e vamos adicionar a raridade assim que a soubermos.

## 13 línguas no jogo {#linguas}

O jogo agora tem 13 línguas: inglês, francês, italiano, alemão, espanhol (Espanha), japonês, coreano, polonês, português (Brasil), português (Portugal), russo, chinês simplificado e espanhol (América Latina). Em 30 de setembro a página do Steam lista as mesmas 13 para a interface, com áudio completo só em inglês.

## Boogeyman {#boogeyman}

O resumo no topo das notas do patch diz que "Twister Toss, Heroic Charge e Boogeyman agora se comportam de forma diferente", mas nenhuma linha das notas diz o que muda para Boogeyman. A sua habilidade Ao revelar destrói o aliado no seu local com o menor Poder, mesmo que seja ele. Vamos atualizar este artigo quando o time explicar.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Que local tem que raridade.
- O novo texto de Twister Toss, e se uma troca conta como um movimento ou dois para Dorothy.
- O que muda para Boogeyman.

## O que muda no OriginsMeta {#no-site}

- As páginas de Bagheera, Mind Palace e Spellbook mostram o custo novo, e cada carta do patch tem a mudança no seu histórico de balanceamento, com um link para o post do Steam.
- A página de Twister Toss ainda mostra o texto antigo, com um aviso, até lermos o novo no jogo.
- O [MetaShifting](/pt/metashifting) lista o patch 0.7 no topo, e o [deck builder](/pt/deck-builder) usa os custos novos: Bagheera agora é uma carta de 2 na curva de mana.
- Os decks publicados mantêm a sua lista, com a data em que foram criados e o patch em vigor naquele dia; a curva de mana deles usa os custos novos. Os guias dos decks com essas cartas foram atualizados.

## De onde vêm estas notas {#fontes}

- O post oficial do Steam de 29 de setembro, "A small demo update is about to land!", publicado antes de os servidores saírem do ar para o patch.
- O número 0.7 e o nome Steam Demo Update #2 vêm da imagem oficial da atualização, a capa deste artigo. Alguns creators tinham chamado a atualização de 21 de setembro de "patch 0.7": neste site ela continua sendo "Demo · 21 set".`,
    faq: [
      { q: "O que mudou no patch 0.7 de Origins TCG?", a: "Twister Toss ganhou um rework; Bagheera (1 → 2 de mana), Mind Palace (2 → 3) e Spellbook (3 → 4) custam 1 a mais; os locais agora têm uma raridade que decide com que frequência aparecem; Humpty e Spellbook não podem mais dar a si mesmas; uma carta devolvida a uma mão cheia agora é queimada; Heroic Charge e os Defensores múltiplos foram corrigidos; o jogo tem 13 línguas." },
      { q: "O patch 0.7 é o último patch de balanceamento antes da Crimson Cup?", a: "Sim: o time o chama de patch de balanceamento final antes do torneio. Ele saiu em 29 de setembro de 2026; a Crimson Cup começa em 20 de outubro com a classificatória EMEA, durante o Steam Next Fest." },
      { q: "Como funciona Twister Toss depois do patch 0.7?", a: "Ele continua custando 1 de mana. Move um aliado para qualquer espaço, e se já houver outra carta lá, as duas trocam de lugar. Ele também pode mirar espaços ocupados: você pode tirar um personagem do lugar e trazê-lo de volta na mesma rodada, ou destruir um com Trash for Treasure e mover outro para o espaço dele." },
    ],
  },
  "upgrade-meta-0929": {
    title: "Upgrade Meta: ferramentas para creators, seguir e notificações, guias da comunidade e quadrinhos",
    metaTitle: "Upgrade Meta: ferramentas para creators de Origins TCG",
    description:
      "Novidade no OriginsMeta: perfis e diretório de creators, ferramentas para lives com !deck e overlay para o OBS, seguir, guias e quadrinhos. Vire Creator.",
    summary:
      "Nesta semana o OriginsMeta ganhou uma seção inteira para quem faz conteúdo sobre Origins TCG: perfis com vitrine, o diretório de creators, ferramentas para lives, estatísticas dos decks, guias da comunidade e quadrinhos publicados direto no site. Agora você pode seguir os seus jogadores favoritos e ser avisado quando eles publicam ou entram ao vivo. Quer virar Creator? Escreva para o Pierluigi no nosso Discord.",
    highlights: [
      { label: "Perfis dos creators", text: "uma página com vitrine, o link curto originsmeta.com/@nome e o diretório de creators", anchor: "perfis" },
      { label: "Ferramentas para lives", text: "o comando de chat !deck, um overlay para o OBS, a imagem do deck e o selo LIVE", anchor: "lives" },
      { label: "Publique mais", text: "vídeos e links nos decks, estatísticas dos decks, artwork da Lendária, guias, quadrinhos e torneios", anchor: "publique" },
      { label: "Vire Creator", text: "escreva para o Pierluigi no nosso Discord", anchor: "vire-creator" },
      { label: "Seguir e notificações", text: "decks, guias, quadrinhos e lives dos perfis que você segue", anchor: "seguir" },
      { label: "Funções e conquistas", text: "Staff, Creator, Autor, Pro e Comunidade, conquistas em todos os perfis, mensagens para o staff", anchor: "funcoes" },
      { label: "Decks, tier lists e guias", text: "os melhores decks do momento, tier lists assinadas, três guias novos e a data do Kickstarter", anchor: "decks-guias" },
    ],
    body: `## Perfis dos creators {#perfis}

Se você faz conteúdo sobre Origins TCG (lives, vídeos, guias, decks), o OriginsMeta agora tem um lugar para você. Os perfis com a função Creator, Autor, Pro ou Staff ganham uma **página com vitrine**: uma capa (um de 8 fundos ou uma imagem sua), uma foto maior, uma cor de destaque, uma frase curta, a sua Lendária favorita, um deck e um vídeo em destaque, os horários das suas lives (mostrados no fuso horário de cada visitante), além da sua bio, dos canais e das línguas em que você cria. Todo mundo pode enviar uma foto de perfil.

Cada perfil também tem um **link curto** para compartilhar: originsmeta.com/@seunome. E a página [Creators e autores](/pt/creators) reúne todos os que têm uma dessas funções e preencheram uma bio ou um canal, com filtros por função, língua e plataforma.

## Ferramentas para lives {#lives}

- **O comando de chat \`!deck\`**: adicione ao Nightbot, ao StreamElements ou ao Fossabot e o seu chat recebe o seu último deck publicado, com a Lendária, o link e o código do jogo.
- **Um overlay para o OBS** que mostra o seu deck na live, vertical ou horizontal, e se atualiza sozinho quando você publica um novo.
- **A imagem do deck**, pronta para posts nas redes, thumbnails em 16:9 e stories em 9:16.
- **O selo LIVE**: quando você faz live de Origins TCG na Twitch, ele aparece ao lado do seu nome nos decks, nos perfis e no diretório. A página [Live](/pt/live) mostra quem está ao vivo agora, e a faixa do calendário no topo diz "Ao vivo agora".

Você encontra tudo em "Para streamers", na página de cada um dos seus decks.

## Publique mais {#publique}

- **Vídeos e links nos decks**: até 3 vídeos do YouTube ou da Twitch e 5 links em cada deck, com um player que só carrega quando você clica.
- **Estatísticas dos decks**: na sua conta você vê visitas, cópias do código do jogo, cliques nos links e vídeos reproduzidos de cada um dos seus decks, em 7 dias, 30 dias e no total. Só você e o staff veem.
- **Artwork da Lendária**: os Creators podem colocar o seu próprio artwork da Lendária nos seus decks. A carta oficial continua na página da carta.
- **Guias da comunidade**: Autores, Creators, jogadores Pro e Staff publicam guias direto no site, traduzidos automaticamente para as outras duas línguas. Todos os outros ainda podem [nos mandar um guia](/pt/guides/submit).
- **Quadrinhos**: os Creators publicam os seus quadrinhos entre as notícias, com o texto traduzido automaticamente.
- **Torneios**: Creators, jogadores Pro e Staff podem colocar os seus torneios públicos no calendário, com uma capa própria.

## Vire Creator {#vire-creator}

A função Creator é atribuída pelo staff do OriginsMeta. Se você faz conteúdo sobre Origins TCG e quer virar Creator, **escreva para o Pierluigi no [nosso Discord](https://discord.gg/RAG7nnrNGP)**.

## Seguir e notificações {#seguir}

Com uma conta você pode **seguir** os perfis com a função Creator, Autor, Pro ou Staff. Quando eles publicam um deck, um guia ou um quadrinho, ou entram ao vivo na Twitch, você recebe uma notificação no envelope no topo do site. Os perfis que você segue ficam na [sua conta](/pt/account). As notificações ficam no site: nada de e-mails.

## Funções e conquistas {#funcoes}

- **Cinco funções**, com a tag ao lado do nome: Staff, Creator, Autor, Pro e Comunidade.
- **Conquistas** em todos os perfis, como Primeiro deck, Favorito do público, Deck do mês e Torneio vencido.
- **Mensagens para o staff**: pela sua conta você pode escrever para nós e ler as nossas respostas, feedback incluído.

## Decks, tier lists e guias {#decks-guias}

- Em [Decks](/pt/decks), os melhores decks de Origins TCG do momento, ordenados pelos votos da comunidade.
- Na [tier list da comunidade](/pt/tier-list/community), as tier lists assinadas por Staff, Creators, Autores e jogadores Pro.
- Tier lists, cartas, decks e o deck builder agora começam pelo conteúdo, com títulos mais compactos.
- Três guias novos: [as 11 Lendárias](/pt/guides/origins-tcg-legendaries), [a ranqueada](/pt/guides/origins-tcg-ranked) e [o Conquest](/pt/guides/origins-tcg-conquest).
- O [guia do Kickstarter](/pt/guides/origins-tcg-kickstarter) tem a data confirmada pelo CEO da Koin Games: 27 de outubro.

## Participe {#participe}

[Cadastre-se](/pt/login) de graça com o Discord ou o seu e-mail, publique os seus decks e siga os jogadores de que você gosta. E [entre no nosso Discord](https://discord.gg/RAG7nnrNGP): tudo o que entra no ar no site é postado lá.`,
    faq: [
      { q: "Como viro Creator no OriginsMeta?", a: "A função Creator é atribuída pelo staff: se você faz conteúdo sobre Origins TCG, escreva para o Pierluigi no Discord do OriginsMeta (discord.gg/RAG7nnrNGP)." },
      { q: "Como mostro o meu deck na live?", a: "Abra a página do seu deck e vá em \"Para streamers\": lá estão o comando de chat !deck para Nightbot, StreamElements ou Fossabot, o overlay para o OBS e a imagem do deck." },
      { q: "Quem posso seguir no OriginsMeta?", a: "Com uma conta você pode seguir os perfis com a função Creator, Autor, Pro ou Staff e receber uma notificação no site quando eles publicam um deck, um guia ou um quadrinho, ou entram ao vivo na Twitch." },
    ],
  },
  "upgrade-meta-0925": {
    title: "Upgrade Meta: o OriginsMeta fala espanhol, todas as cartas em três línguas e o que vem por aí",
    metaTitle: "Upgrade Meta: OriginsMeta para Origins TCG em espanhol",
    description:
      "O OriginsMeta agora também está em espanhol, e cada carta da Demo 2.0 tem o texto oficial do jogo em três línguas. E uma primeira olhada no que vem por aí.",
    summary:
      "O OriginsMeta agora também fala espanhol, e cada carta da Demo 2.0 mostra o texto oficial do jogo em inglês, italiano e espanhol. Também estamos trabalhando em um overlay, uma ferramenta de jogo para todos os jogadores, e em formas de recompensar o que vocês criam: a primeira ideia é um deck da semana escolhido pelos seus votos. Obrigado pelo apoio: no fim do artigo você encontra tudo o que precisa para participar.",
    highlights: [
      { label: "O espanhol chegou", text: "o site inteiro, guias e notícias incluídos, e os guias dos decks da comunidade traduzidos automaticamente", anchor: "espanhol" },
      { label: "Todas as cartas, três línguas", text: "o texto oficial do jogo em italiano e espanhol, conferido nas 122 cartas da Demo 2.0", anchor: "cartas" },
      { label: "Um overlay para todos", text: "uma ferramenta de jogo para todos os jogadores, em desenvolvimento: vamos mostrar quando estiver pronta", anchor: "overlay" },
      { label: "Deck da semana", text: "escolhido pelos seus votos: a nossa primeira ideia para recompensar o que vocês criam", anchor: "deck-da-semana" },
      { label: "Obrigado", text: "a todos que se cadastraram, publicaram decks, votaram e escreveram para nós", anchor: "obrigado" },
      { label: "Participe", text: "cadastre-se, monte um deck, faça a sua tier list, venha para o nosso Discord", anchor: "participe" },
    ],
    body: `## O espanhol chegou {#espanhol}

Desde 25 de setembro de 2026, o OriginsMeta também está em espanhol: cartas, decks, guias, notícias, tier lists, o deck builder e os torneios. Você troca de língua com EN · IT · ES no topo de cada página (no celular, dentro do Menu). Escrevemos em espanhol neutro, para jogadores da Espanha e da América Latina, e os nomes das cartas continuam em inglês, como no jogo.

Os decks da comunidade também falam todas as línguas: o autor escreve o guia na sua própria língua, o site traduz para as outras duas, diz isso na página e linka o original. Um deck publicado em italiano agora também pode ser lido em inglês e em espanhol.

## Todas as cartas, três línguas {#cartas}

Em 25 de setembro abrimos a demo em espanhol e em italiano e lemos as 122 cartas da coleção uma a uma. Os textos em italiano e espanhol que você encontra agora na [lista de cartas](/pt/cards) são os oficiais do jogo: 101 textos em espanhol e 88 em italiano eram diferentes das nossas traduções, e foram substituídos.

As palavras-chave também usam os termos oficiais do jogo: On Reveal é "Alla rivelazione" em italiano e "Al revelar" em espanhol. Nas páginas em italiano e espanhol você encontra os mesmos termos nas tags das palavras-chave da página de cada carta, nos guias e nas notícias. As cartas criadas e as cartas removidas não aparecem na coleção do jogo, e ainda não conferimos os [Locais](/pt/locations) no jogo: o texto deles em italiano e espanhol é nosso, escrito com o glossário do jogo.

## Um overlay para todos {#overlay}

Estamos trabalhando em um overlay: uma ferramenta de jogo para todos os jogadores de Origins TCG, não só para quem faz live. Preferimos mostrar a descrever: vamos contar mais assim que tivermos algo que valha a pena ver.

## Deck da semana {#deck-da-semana}

Queremos recompensar quem cria, e dar mais visibilidade aos seus decks, guias e tier lists. A primeira ideia é um deck da semana, escolhido pelas suas avaliações em estrelas. Enquanto isso, se você testar um deck da comunidade, avalie: os decks mais bem avaliados já aparecem na [tier list](/pt/tier-list).

## Obrigado {#obrigado}

O OriginsMeta entrou no ar em 15 de setembro. Em dez dias vocês se cadastraram, publicaram decks, votaram e escreveram para nós com ideias e correções, e várias mudanças recentes começaram com as mensagens de vocês. Obrigado: este site cresce com vocês.

## Participe {#participe}

- [Cadastre-se](/pt/login): de graça, com o Discord ou com o seu e-mail, sem precisar de senha. Com uma conta você pode publicar os seus decks, votar e salvar as suas tier lists.
- [Monte um deck](/pt/deck-builder): de graça, mesmo sem conta. Copie o código do jogo ou, com uma conta, publique o deck no site com o seu guia.
- [Faça a sua tier list](/pt/tier-list/create) e veja a [tier list da comunidade](/pt/tier-list/community), que vira um ranking de verdade quando 5 listas forem salvas.
- [Entre no nosso Discord](https://discord.gg/RAG7nnrNGP): os artigos e guias novos chegam lá assim que entram no ar. O [Discord oficial de Origins TCG](https://discord.gg/originstcg) é o servidor da Koin Games, para anúncios e inscrições nos torneios.`,
    faq: [
      { q: "O OriginsMeta está disponível em espanhol?", a: "Sim, desde 25 de setembro de 2026: o site inteiro, com guias, notícias, tier lists e o deck builder. Você troca de língua com EN · IT · ES no topo da página; os guias dos decks da comunidade são traduzidos automaticamente." },
      { q: "Os textos das cartas em italiano e espanhol são oficiais?", a: "Sim, para as 122 cartas da Demo 2.0: lemos todas no jogo em 25 de setembro de 2026. As cartas criadas e as removidas não estão na coleção do jogo e os Locais ainda não foram conferidos no jogo, então o texto deles em italiano e espanhol é uma tradução nossa com o glossário do jogo." },
      { q: "Como publico um deck no OriginsMeta?", a: "Monte o deck no deck builder, faça login com o Discord ou o seu e-mail e aperte Publicar no site: um plano de jogo curto é obrigatório, o resto do guia é opcional." },
    ],
  },
  "crimson-cup-format-check-in": {
    title: "Regras da Crimson Cup: Conquest com três decks, listas ocultas até o top 4 e um check-in imperdível",
    metaTitle: "Crimson Cup de Origins TCG: regras, datas, check-in",
    description:
      "Regras da Crimson Cup de Origins TCG: Conquest com três decks, 8 cartas únicas entre os decks, classificatórias de 19 a 22 de outubro, prêmios e check-in.",
    summary:
      "Depois da pesquisa com os jogadores, a Koin Games definiu as regras da Crimson Cup: Conquest com três decks, pelo menos 8 cartas únicas entre cada par de decks, listas ocultas até o top 4 e nenhum ban nas partidas melhor de cinco. O check-in abre duas horas antes de cada classificatória e fecha cinco minutos antes do início, junto com a entrega dos decks: quem perder fica de fora. O torneio é jogado na demo, não no playtest.",
    highlights: [
      { label: "Conquest com três decks", text: "pelo menos 8 cartas únicas entre cada par de decks", anchor: "formato" },
      { label: "Listas ocultas até o top 4", text: "no ban você só vê a Lendária", anchor: "listas" },
      { label: "Melhor de cinco sem ban", text: "é preciso vencer com os três decks", anchor: "melhor-de-cinco" },
      { label: "Check-in", text: "abre duas horas antes e fecha cinco minutos antes do início, com a entrega dos decks", anchor: "check-in" },
      { label: "Treine na demo", text: "o playtest vai receber atualizações que o torneio não terá", anchor: "demo-playtest" },
      { label: "Último patch de balanceamento", text: "saiu em 29 de setembro: o patch 0.7", anchor: "balanceamento" },
      { label: "Prêmios", text: "10.000 dólares; a divisão completa chegou em 5 de outubro", anchor: "premios" },
    ],
    faq: [
      {
        q: "Quantas cartas únicas os decks da Crimson Cup precisam ter?",
        a: "Pelo menos 8 cartas únicas entre cada par de decks, diz o anúncio de 24 de setembro. Cada deck tem 13 cartas diferentes: a nossa leitura é que dois decks podem compartilhar no máximo 5 delas.",
      },
      {
        q: "Quando é o check-in da Crimson Cup?",
        a: "Abre duas horas antes de cada classificatória e fecha cinco minutos antes do início, junto com a entrega dos decks. Quem perder o check-in não joga: para a classificatória EMEA das 19:00 CEST, faça o check-in entre 17:00 e 18:55 CEST.",
      },
      {
        q: "Em qual versão do jogo a Crimson Cup é disputada?",
        a: "Na demo principal, só com as cartas disponíveis nela. O playtest vai receber mais atualizações e será diferente da versão do torneio.",
      },
    ],
    body: `## Conquest com três decks {#formato}

Há alguns dias a Koin Games fez uma pesquisa com os jogadores, e este anúncio define o formato: a Crimson Cup usa o Conquest com três decks. Entre cada par de decks é preciso haver pelo menos 8 cartas únicas.

Cada deck tem 13 cartas diferentes: a Lendária e doze cartas base, cuja segunda cópia o jogo adiciona sozinho. A nossa leitura é que dois decks podem compartilhar no máximo 5 cartas, mas o anúncio não explica como as cartas únicas são contadas. No Big Bob's Playtest Battle, em agosto, a regra era de pelo menos nove cartas de diferença.

## Listas ocultas até o top 4 {#listas}

Os decks ficam privados até o top 4. Quando você bane um dos decks do oponente, só vê a Lendária dele.

## Melhor de cinco: sem ban, vença com os três {#melhor-de-cinco}

As partidas melhor de cinco (MD5) não têm ban: para levar a partida, você precisa vencer com os três decks. No primeiro anúncio, em 9 de setembro, a melhor de cinco era a grande final, com partidas melhor de três (MD3) antes dela.

## Check-in: chegue na hora {#check-in}

A programação prevista para cada classificatória:

1. O check-in abre duas horas antes do início do torneio.
2. O check-in e a entrega dos decks fecham cinco minutos antes do início oficial.
3. Uma janela curta permite que os jogadores da lista de espera peguem as vagas livres, por ordem de chegada.
4. A apresentação do torneio.
5. As partidas começam assim que a apresentação termina.

Se você não fizer o check-in, não joga. Para a classificatória EMEA de 20 de outubro, que começa às 19:00 CEST, isso significa fazer o check-in entre 17:00 e 18:55 CEST. A classificatória AMER é no dia 21 e a APAC no dia 22: horários e vagas estão no nosso [guia do Steam Next Fest](/pt/guides/steam-next-fest-2026).

**Atualização de 7 de outubro:** agora são cinco classificatórias. Em 5 de outubro a Koin acrescentou AMER em 19 de outubro às 19:00 EST e EMEA em 22 de outubro às 19:00 CEST, e o novo calendário coloca a classificatória AMER do dia 21 às 21:00 EST, com 32 classificados em vez de 64 e 96 wild cards em vez de 128. Sete locais também saem do pool do torneio. Está tudo no [nosso artigo sobre a premiação e as novas classificatórias](/pt/news/crimson-cup-prizepool-qualifiers).

## Demo ou playtest: onde treinar {#demo-playtest}

- A **demo** tem a lista de cartas do torneio. A ranqueada é ativada nela para o Steam Next Fest, com novas recompensas de ranqueada. É a versão em que vale a pena treinar.
- O **playtest** hoje é igual à demo, com a ranqueada já ativa e algumas pequenas mudanças. Vai receber mais atualizações e será diferente da versão do torneio.

Você pode jogar os dois, mas o torneio acontece na demo principal e só com as cartas disponíveis nela.

## O último patch de balanceamento {#balanceamento}

O último patch de balanceamento vai chegar duas semanas antes do Steam Next Fest, que começa em 19 de outubro. Vamos acompanhá-lo carta por carta no [MetaShifting](/pt/metashifting).

**Atualização de 30 de setembro:** o último patch de balanceamento saiu antes do anunciado, em 29 de setembro. É o [patch 0.7](/pt/news/patch-0-7), que a equipe chama de patch de balanceamento final antes do torneio: Twister Toss recebe um rework, e Bagheera, Mind Palace e Spellbook custam 1 a mais.

## Prêmios {#premios}

O post oficial no X fala de uma premiação de 10.000 dólares, e o anúncio no Discord diz que a premiação exata será divulgada na semana seguinte. Em setembro a Koin descreveu prêmios no valor total de 10.000 dólares, entre uma carta promo 1/1 exclusiva, outras cartas promo, pacotes digitais, caixas e cases Alpha e dinheiro ([nosso artigo](/pt/news/biggest-tournament-ever)).

**Atualização de 7 de outubro:** a divisão chegou em 5 de outubro. O campeão leva uma carta promo Dracula 1/1, dois cases de caixas de boosters e 1.500 dólares em dinheiro; as cartas promo vão até o top 32 e os pacotes até o top 256. A tabela completa está no [nosso artigo sobre a premiação](/pt/news/crimson-cup-prizepool-qualifiers#premios).

## O que ainda não sabemos {#o-que-nao-sabemos}

- A premiação exata, prometida para a semana seguinte: chegou em 5 de outubro, veja a atualização acima.
- Como são contadas as cartas únicas entre dois decks.

## De onde vem a informação {#fontes}

- O "Big Crimson Cup announcement" publicado no Discord oficial de Origins TCG em 24 de setembro, que também aponta para um novo vídeo com os detalhes do torneio.
- O [post de Origins TCG no X](https://x.com/origins_tcg/status/2103111100321677670) do mesmo dia, com a premiação de 10.000 dólares.`,
  },

  "upgrade-meta-0924": {
    title: "Upgrade Meta: busca no texto das cartas, tier list refeita, Locais e o nosso próprio Discord",
    metaTitle: "Upgrade Meta: novidades do OriginsMeta para Origins TCG",
    description:
      "Três dias de novidades no OriginsMeta: busca no texto das cartas, tier list refeita, Locais, perfis públicos e o nosso Discord. Obrigado, coachcronos.",
    summary:
      "O OriginsMeta mudou muito em três dias: o Deck builder agora busca no texto das cartas, a tier list mostra três fontes lado a lado, e chegaram os Locais, os perfis públicos e o nosso próprio servidor no Discord. Obrigado ao coachcronos pela live e a todos que nos escreveram: muitas destas mudanças nasceram dos seus pedidos.",
    highlights: [
      { label: "Busca no texto das cartas", text: "no Deck builder e no database de cartas: digite Revelar e ficam as cartas com Ao revelar", anchor: "busca" },
      { label: "Uma tier list refeita", text: "OriginsMeta, Comunidade e As mais jogadas lado a lado, MetaShifting com página própria", anchor: "tier-list" },
      { label: "Locais", text: "os 44 locais da Demo 2.0, com busca e filtros", anchor: "locais" },
      { label: "Decks, guias e perfis", text: "filtro por tipo de autor, data e patch em cada deck, perfis públicos, quatro guias novos", anchor: "decks" },
      { label: "Cartas conferidas no jogo", text: "as 122 cartas comparadas uma a uma, mais o patch de 21 de setembro", anchor: "cartas" },
      { label: "Um site mais fácil de ler", text: "logo novo, cartas que viram, um calendário que rola", anchor: "visual" },
      { label: "O nosso próprio Discord", text: "logo no menu, artigos e guias novos publicados automaticamente", anchor: "discord" },
      { label: "Obrigado, coachcronos", text: "pela live de 23 de setembro", anchor: "obrigado-coachcronos" },
      { label: "Obrigado por nos escrever", text: "e a partir de hoje você pode deixar o seu nome no quadro de feedback", anchor: "obrigado-feedback" },
    ],
    faq: [
      {
        q: "Como encontro as cartas com Ao revelar no Deck builder?",
        a: "Digite Revelar na busca do Deck builder: ficam as cartas com Ao revelar no texto. A busca olha o nome, a saga e o texto da carta, e funciona do mesmo jeito no database de cartas.",
      },
      {
        q: "Como entro no Discord do OriginsMeta?",
        a: "Use o logo do Discord no menu de cima (no celular, dentro de Menu) ou o botão no fim de cada artigo. É o servidor do OriginsMeta, separado do Discord oficial de Origins TCG mantido pela Koin Games.",
      },
      {
        q: "Como posso sugerir uma mudança no site?",
        a: "Use o quadro de feedback no canto inferior direito: basta uma frase, nome e e-mail são opcionais. Os guias passam por Envie o seu guia, na seção Guias.",
      },
    ],
    body: `## Busca no texto das cartas {#busca}

A primeira mensagem que recebemos pelo quadro de feedback pedia algo preciso: enquanto montava um deck em torno de Mulan, quem escreveu queria ver só as cartas com Ao revelar (On Reveal) digitando "Reveal" na busca, como dá para fazer no jogo. Agora dá.

- A busca do [Deck builder](/pt/deck-builder) olha o nome, a saga e o **texto da carta**. Digite "revelar" e ficam as cartas com Ao revelar: são 33 na demo atual.
- Maiúsculas e acentos não importam, e com várias palavras você recebe as cartas que contêm todas elas, por exemplo "reveal damage".
- Abaixo dos filtros você vê quantas cartas sobraram, com "Limpar filtros"; quando nada corresponde, o construtor de decks avisa em vez de mostrar uma lista vazia.
- A mesma busca funciona no [database de cartas](/pt/cards) e no campo "Buscar uma carta" no topo de cada página. No site em italiano ela também lê o texto em inglês do jogo, então "draw" funciona lá também.

## Uma tier list refeita {#tier-list}

A [tier list](/pt/tier-list) agora mostra três fontes lado a lado, cada uma com a sua página:

- **OriginsMeta**: os tiers vêm só dos resultados dos torneios, então chegam depois da Crimson Cup; enquanto isso, a página mostra os decks mais bem avaliados e as cartas que aparecem em mais decks.
- **[Comunidade](/pt/tier-list/community)**: a média das tier lists salvas pelos membros, que vira um ranking a partir de 5 listas.
- **[As mais jogadas](/pt/tier-list/most-played)**: em quantos decks publicados cada carta aparece. Isso é popularidade, não win rate.

O acompanhamento dos balanceamentos tem página própria, o [MetaShifting](/pt/metashifting), com o patch mais recente primeiro. No [criador de tier list](/pt/tier-list/create) as cartas agora arrastam de verdade; no celular há a barra S A B C D e, com uma conta, você pode salvar a sua lista, que passa a contar na tier list da comunidade.

## Locais {#locais}

Uma nova página de [Locais](/pt/locations): os 44 locais da Demo 2.0, com busca por nome e efeito, filtros por família de efeito (dano, mana, movimento e outros) e as cartas que eles citam com link para as suas páginas. Para ver como eles mudam uma partida, leia o [guia dos Locais](/pt/guides/origins-tcg-locations).

## Decks, guias e perfis {#decks}

- Em [Decks](/pt/decks) os filtros ficam sempre visíveis, com um novo para o **tipo de autor**: Staff, Pro, Influencer, Comunidade. Os decks aparecem do mais recente para o mais antigo, e cada um mostra a data de criação e a versão do jogo em que foi montado.
- Cada membro tem uma **página pública** com os decks publicados e as tier lists salvas.
- O Deck builder tem quatro botões: Publicar no site, Salvar em privado (o deck fica no seu perfil e só você o vê), Compartilhar, Esvaziar deck. O deck que você está montando se salva sozinho no navegador.
- Quatro guias novos para os decks que o Davdas publicou: [On Reveal Mid Range](/pt/guides/on-reveal-midrange-guide) com Mulan, [King of Value Trade](/pt/guides/king-of-value-trade-guide), [Dorothy Combo](/pt/guides/dorothy-combo-guide) e [The Trick-or-Treat Legion](/pt/guides/trick-or-treat-legion-guide).
- Escreveu um guia? [Envie para nós](/pt/guides/submit): nós o lemos e, com a sua permissão, o publicamos com o seu nome.

**Atualização de 27 de setembro:** o filtro agora se chama **Função**, e as funções são Staff, Creator, Autor, Pro e Comunidade: a tag Influencer não existe mais. Quem publicou um deck aparece em **Publicado por**.

## Cartas conferidas no jogo {#cartas}

Em 22 de setembro comparamos as 122 cartas da Demo 2.0 com a coleção do jogo, uma a uma: custos, estatísticas e alinhamentos batiam, 16 textos não, e agora eles são os do jogo. O database também tem o [patch da demo de 21 de setembro](/pt/news/demo-patch-notes-0921) com as 14 cartas que ele muda, e o topo do Deck builder diz com qual versão do jogo as cartas estão atualizadas. Hoje também corrigimos as palavras-chave de Queen of Hearts e Bagheera, que tinham ficado para trás em relação ao texto.

## Um site mais fácil de ler {#visual}

O logo agora é um lettering desenhado à mão. Nas páginas dos decks as cartas aparecem inteiras e, com o mouse, viram para mostrar o texto; a prévia da carta mantém só o necessário (nome, tipo, alinhamento e efeito). O calendário abaixo do slider agora rola de verdade, devagar, e o topo da página inicial ficou mais curto, para as notícias caberem na primeira tela.

## O nosso próprio Discord {#discord}

O OriginsMeta tem o seu próprio servidor no Discord. O logo do Discord fica no menu de cima (no celular, dentro de "Menu") e o convite está no fim de cada artigo. Os artigos e guias novos são publicados lá automaticamente assim que entram no site. O [Discord oficial de Origins TCG](https://discord.gg/originstcg) continua sendo o servidor da Koin Games, para anúncios, AMAs e inscrições nos torneios.

## Obrigado, coachcronos {#obrigado-coachcronos}

Em 23 de setembro o coachcronos nos recebeu ao vivo no seu canal da Twitch, com o Davdas e o Pierluigi, para falar do site e de Origins TCG com o chat dele. Obrigado de coração: pelo espaço, pelo entusiasmo que ele traz ao jogo e por nos apresentar à sua comunidade. Várias mudanças deste artigo nasceram naquela live: filtros de decks sempre visíveis, o filtro por tipo de autor e o "Envie o seu guia".

## Obrigado por nos escrever {#obrigado-feedback}

O quadro de feedback está aberto há alguns dias e a staff lê todas as mensagens. A busca no texto das cartas nasceu assim, de uma mensagem sem assinatura: obrigado, seja você quem for. A partir de hoje o quadro também tem um campo para o seu nome ou apelido, opcional, para sabermos a quem agradecer (nunca o publicamos sem perguntar). Continue escrevendo para nós: pelo quadro de feedback no canto inferior direito, com o [Envie o seu guia](/pt/guides/submit) ou no nosso Discord.`,
  },
  "demo-patch-notes-0921": {
    title: "Patch da demo de Origins TCG, 21 de setembro: Dorothy custa 4, 14 cartas mudam e The Gallows é corrigido",
    metaTitle: "Notas do patch da demo de Origins TCG, 21 de setembro",
    description:
      "O patch da demo de Origins TCG de 21 de setembro: Dorothy cai para 4 de mana, mudanças em 14 cartas, duas regras do jogo e o local The Gallows.",
    summary:
      "As mudanças de balanceamento da atualização da demo de 21 de setembro, comparadas com a última versão do playtest: Dorothy cai para 4 de mana, oito cartas mudam de estatísticas, Itsy Bitsy Spider vira Evil, seis cartas mudam o que fazem, e duas regras do jogo e The Gallows são corrigidos.",
    highlights: [
      { label: "Dorothy custa 4", text: "um de mana a menos para a Lendária que cresce cada vez que um aliado se move", anchor: "dorothy" },
      { label: "Wicked Stepmother com 4 de Poder", text: "a Lendária com Toque mortífero passa de 3/6 para 4/6", anchor: "wicked-stepmother" },
      { label: "Christopher Robin volta a 5/4", text: "as estatísticas que tinha antes do patch 0.6.3", anchor: "christopher-robin" },
      { label: "Mais cinco mudanças de estatísticas", text: "Guy of Gisborne, Quasimodo, Beauty, Magic Carpet e Roo", anchor: "estatisticas" },
      { label: "Itsy Bitsy Spider vira Evil", text: "deixa de ser Neutral, com todas as sinergias com personagens Malignos que isso traz", anchor: "itsy-bitsy-spider" },
      { label: "Seis cartas mudam o que fazem", text: "Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet, Wooden Stake", anchor: "mudancas-de-texto" },
      { label: "Duas regras do jogo", text: "estatísticas mantidas no cemitério, Antes do combate antes dos descartes Temporary", anchor: "regras" },
      { label: "The Gallows corrigido", text: "não destrói mais no local para onde um personagem é movido", anchor: "the-gallows" },
    ],
    faq: [
      {
        q: "O que mudou no patch da demo de Origins TCG de 21 de setembro?",
        a: "Dorothy custa 4 em vez de 5; Wicked Stepmother, Christopher Robin, Guy of Gisborne, Quasimodo, Beauty, Magic Carpet e Roo mudam de estatísticas; Itsy Bitsy Spider vira Evil; Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet e Wooden Stake mudam o que fazem; duas regras do jogo e o local The Gallows são corrigidos.",
      },
      {
        q: "Este é o patch 0.7 de Origins TCG?",
        a: "Não. Alguns criadores de conteúdo o chamaram de patch 0.7, mas esta atualização não tem número de versão: a equipe a chama de notas do patch da demo de 21 de setembro de 2026, com as mudanças comparadas com a última versão do playtest, a 0.6.3. O patch 0.7 é a atualização seguinte, o Steam Demo Update #2 de 29 de setembro de 2026.",
      },
      {
        q: "Devo montar os meus decks para a Crimson Cup com estas estatísticas?",
        a: "Com as do patch 0.7, que veio depois deste: em 29 de setembro de 2026 a equipe o lançou como o patch de balanceamento final antes do torneio, com o rework de Twister Toss e Bagheera, Mind Palace e Spellbook custando 1 a mais. A lista provisória de cartas da Crimson Cup chegou com a atualização de 21 de setembro; o torneio vai de 20 a 25 de outubro de 2026.",
      },
    ],
    body: `## Todas as mudanças de estatísticas {#estatisticas}

Os números são comparados com a última versão do playtest, a 0.6.3: as mesmas estatísticas que o database de cartas deste site usava até este patch. Formato: mana · Poder/Vida; ★ indica as Lendárias.

| Carta | Antes | Depois | O que muda |
| --- | --- | --- | --- |
| Dorothy ★ | 5 · 1/1 | 4 · 1/1 | custa 1 a menos |
| Wicked Stepmother ★ | 4 · 3/6 | 4 · 4/6 | +1 de Poder |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | volta às estatísticas de antes da 0.6.3 |
| Guy of Gisborne | 6 · 3/3 | 6 · 4/4 | +1 de Poder, +1 de Vida |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | +1 de Poder, −1 de Vida |
| Beauty | 4 · 1/1 | 4 · 2/1 | +1 de Poder |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | +1 de Poder, e uma regra nova sobre os seus buffs |
| Roo | 2 · 2/3 | 2 · 2/4 | +1 de Vida |
| Itsy Bitsy Spider | 0 · 1/1, Neutral | 0 · 1/1, Evil | muda de alinhamento |

## As duas Lendárias {#lendarias}

### Dorothy custa 4 {#dorothy}

Dorothy pode se Mover a cada rodada e tem +1/+1 por cada vez que um aliado se moveu na partida. Com 4 de mana ela entra uma rodada antes, com uma rodada a mais para crescer. No mesmo patch Roo, um personagem de 2 de mana com Mover, ganha 1 de Vida.

### Wicked Stepmother com 4 de Poder {#wicked-stepmother}

A Lendária com Toque mortífero, cuja habilidade Ao revelar dá Toque mortífero aos seus personagens Malignos, passa de 3/6 para 4/6.

## Christopher Robin volta a 5/4 {#christopher-robin}

O patch 0.6.3 o tinha transformado de 5/4 em 4/5, mais resistente mas batendo mais fraco. O patch da demo devolve as estatísticas antigas. Esta linha está nas notas do patch publicadas no Discord oficial, não no post do Steam.

## Itsy Bitsy Spider vira Evil {#itsy-bitsy-spider}

A carta 1/1 de 0 de mana deixa de ser Neutral e passa a ser Evil. Isso importa para todas as cartas que contam personagens Malignos: a habilidade Ao revelar de Wicked Stepmother, por exemplo, agora também dá Toque mortífero a ela.

## Seis cartas mudam o que fazem {#mudancas-de-texto}

### Silver Bullet {#silver-bullet}

Agora pode ter como alvo as barreiras, além dos personagens.

### Don Quixote {#don-quixote}

Ganhou Defensor: é tudo o que as notas do patch dizem sobre ele.

### Heroic Charge {#heroic-charge}

O feitiço dá aos aliados +2 de Poder e Atropelar nesta rodada. Quando ele é repetido, o buff de +2 de Poder agora se aplica de novo.

### Frog Prince e Magic Carpet {#frog-prince-magic-carpet}

Os dois têm uma habilidade Ao revelar de escolha ("Escolhe uma"). Os buffs que eles já tinham não são mais apagados quando são jogados e, se voltarem para a mão, podem escolher de novo. Magic Carpet também ganha 1 de Poder.

### Wooden Stake {#wooden-stake}

Agora pode ter como alvo personagens com a Vida cheia, mas continua falhando se o alvo não estiver danificado no momento em que ela se revela.

## Duas regras do jogo {#regras}

### As estatísticas ficam no cemitério {#cemiterio}

As estatísticas de um personagem não são mais zeradas no cemitério. Um personagem com buff e Renascimento volta ao tabuleiro ainda com o buff, mas com 1 de Vida.

### Primeiro Antes do combate, depois os descartes Temporary {#antes-do-combate}

As habilidades "Antes do combate" (Before combat) agora acontecem antes que as cartas Temporary sejam descartadas.

## The Gallows {#the-gallows}

O local sempre destrói o inimigo à frente do espaço em que um personagem entrou. Se uma habilidade Ao revelar move esse personagem para outro local, The Gallows não destrói mais o personagem adversário no novo local.

## De onde vêm estas notas {#fontes}

- O post oficial no Steam de 21 de setembro, o que anuncia a atualização, lista as mudanças de estatísticas e as seis cartas que mudam o que fazem, "em comparação com a última versão do playtest". O post da equipe no Reddit diz o mesmo.
- A versão publicada no Discord oficial acrescenta Christopher Robin, as duas regras do jogo e The Gallows. Nós a reproduzimos por completo.

O patch não tem número de versão: a equipe o chama de notas do patch da demo de 21 de setembro. Alguns criadores de conteúdo o chamaram de "patch 0.7", mas esse número não aparece nos posts oficiais sobre esta atualização. Neste site ele aparece como "Demo · 21 set".

**Atualização de 25 de setembro:** acrescentamos a nota sobre o nome "patch 0.7", que alguns criadores de conteúdo usam para esta atualização.

**Atualização de 30 de setembro:** o número 0.7 pertence oficialmente à atualização seguinte, o Steam Demo Update #2 de 29 de setembro, o último patch de balanceamento antes da Crimson Cup: todas as mudanças dele estão nas [notas do patch 0.7](/pt/news/patch-0-7). As estatísticas deste artigo são as de antes daquele patch.

## O que muda no OriginsMeta {#no-site}

- Cada página de carta mostra as novas estatísticas e a mudança no seu histórico de balanceamento, com link para o post do Steam.
- O [MetaShifting](/pt/metashifting) lista o patch ao lado dos do playtest.
- O [Deck builder](/pt/deck-builder) usa os novos custos: Dorothy agora conta como carta de 4 na curva de mana.
- O texto oficial das seis cartas que mudam o que fazem será atualizado quando o database de cartas da comunidade importar o patch. Até lá, o histórico de balanceamento de cada página de carta explica a mudança.

Todo o resto da atualização, da nova interface à ranqueada no Steam Next Fest, está no [artigo sobre a primeira grande atualização da demo](/pt/news/demo-first-big-update).`,
  },

  "demo-first-big-update": {
    title: "Primeira grande atualização da demo de Origins TCG: nova interface, pacotes de teste, ranqueada, Crimson Cup",
    metaTitle: "Atualização da demo de Origins TCG: interface e ranqueada",
    description:
      "Atualização da demo de Origins TCG de 21 de setembro: nova interface, pacotes de teste, cartas da Crimson Cup, progresso mantido e ranqueada no Next Fest.",
    summary:
      "A Koin Games atualizou a demo gratuita de Origins TCG em 21 de setembro: uma nova interface e um novo tabuleiro, um tutorial para colecionadores, pacotes de teste e a lista provisória de cartas da Crimson Cup, com o progresso de todos mantido. A ranqueada é ativada com o Steam Next Fest.",
    highlights: [
      { label: "Nova interface e novo tabuleiro", text: "as telas em volta da partida e o tabuleiro foram redesenhados", anchor: "nova-interface" },
      { label: "Tutorial para colecionadores", text: "como funciona a coleção, explicado dentro do jogo", anchor: "tutorial-colecionadores" },
      { label: "Pacotes de teste", text: "pacotes para abrir dentro da demo", anchor: "pacotes-de-teste" },
      { label: "Novas falas", anchor: "novas-falas" },
      { label: "Mudanças de balanceamento", text: "Dorothy custa 4 e 14 cartas mudam: notas completas do patch", anchor: "balanceamento" },
      { label: "Ranqueada no Steam Next Fest", text: "a partir de 19 de outubro, com recompensas exclusivas", anchor: "ranqueada" },
      { label: "Cartas da Crimson Cup", text: "lista provisória, já dá para montar os decks do torneio", anchor: "crimson-cup" },
      { label: "Progresso mantido", text: "o que estiver mais adiantado entre demo e playtest", anchor: "progresso" },
      { label: "Playtest", text: "sem conteúdo novo, atualização de polimento mais para o fim da semana", anchor: "playtest" },
    ],
    faq: [
      {
        q: "Perco o meu progresso com a atualização da demo de Origins TCG?",
        a: "Não. Quem jogou a demo, o playtest fechado ou os dois mantém o progresso do que estiver mais adiantado, então nenhuma carta precisa ser desbloqueada de novo (anúncio da equipe de 21 de setembro de 2026).",
      },
      {
        q: "Quando começa a ranqueada na demo de Origins TCG?",
        a: "Com o início do Steam Next Fest, na segunda-feira, 19 de outubro de 2026, com recompensas exclusivas de ranqueada cujos detalhes ainda não foram anunciados.",
      },
      {
        q: "Já posso montar decks para a Crimson Cup?",
        a: "Sim: a lista provisória de cartas do torneio está no jogo desde a atualização de 21 de setembro, e o patch 0.7 de 29 de setembro é o patch de balanceamento final antes da Crimson Cup, que vai de 20 a 25 de outubro de 2026.",
      },
      {
        q: "O que muda para quem joga o playtest?",
        a: "Por enquanto, nenhum deck, carta ou chefe novo: a atualização de polimento chega ao playtest mais para o fim da semana de 21 de setembro, junto com outras mudanças para testar.",
      },
    ],
    body: `## O que muda na demo {#o-que-muda}

A equipe a chama de "a primeira grande atualização da demo de Origins", e a palavra *primeira* sugere que outras virão antes do festival.

### Uma nova interface e um novo tabuleiro {#nova-interface}

As telas em volta da partida foram melhoradas e o tabuleiro ganhou um visual novo.

### Um tutorial para colecionadores {#tutorial-colecionadores}

Explica os aspectos principais da coleção, o lado que diferencia Origins dos outros jogos de cartas digitais: cartas que você abre, possui e troca. O nosso [guia da economia dos colecionadores](/pt/guides/collector-economy) explica o modelo passo a passo.

### Pacotes de teste {#pacotes-de-teste}

Pacotes para abrir dentro da demo, para experimentar o lado colecionável do jogo antes do lançamento completo.

### Novas falas {#novas-falas}

A atualização acrescenta novas falas de voz; o anúncio não diz mais nada sobre elas.

### Mudanças de balanceamento {#balanceamento}

Os detalhes saíram na mesma noite, no post do Steam e no Discord: Dorothy cai para 4 de mana, oito cartas mudam de estatísticas, Itsy Bitsy Spider vira Evil, seis cartas mudam o que fazem, e duas regras do jogo e o local The Gallows são corrigidos. Está tudo no [artigo com as notas do patch](/pt/news/demo-patch-notes-0921), e já no [MetaShifting](/pt/metashifting) e no histórico de balanceamento de cada carta afetada.

## A ranqueada abre com o Steam Next Fest {#ranqueada}

A equipe vai ativar a ranqueada "com o início do Steam Next Fest", com recompensas exclusivas de ranqueada cujos detalhes não foram anunciados. O festival vai de segunda-feira, 19 de outubro de 2026, às 10:00 do horário do Pacífico, até segunda-feira, 26 de outubro. Quando a ladder abrir para todos, começa também a primeira [tier list](/pt/tier-list) de verdade do OriginsMeta, construída com os resultados.

## As cartas da Crimson Cup estão no jogo {#crimson-cup}

A atualização também traz a lista provisória de cartas da Crimson Cup, o maior torneio que a Koin Games já organizou, de 20 a 25 de outubro: classificatórias regionais nos dias 20, 21 e 22, depois playoffs e finais, no formato Conquest, melhor de três, com uma grande final melhor de cinco. Os prêmios valem 10.000 dólares no total, entre dinheiro, cartas promo, pacotes e caixas da Alpha Edition: não é uma premiação só em dinheiro.

"Salvo patches de balanceamento futuros, vocês já podem começar a preparar decks para o torneio", escreve a equipe. Duas ferramentas para começar:

- o [Deck builder](/pt/deck-builder), cujo modo torneio verifica as regras do Conquest enquanto você monta;
- o [guia do Steam Next Fest](/pt/guides/steam-next-fest-2026), com datas, horários e como se inscrever no Discord.

**Atualização de 30 de setembro:** o patch de balanceamento chegou em 29 de setembro. O [patch 0.7](/pt/news/patch-0-7), que a equipe chama de patch de balanceamento final antes do torneio, faz um rework de Twister Toss e deixa Bagheera, Mind Palace e Spellbook custando 1 a mais.

## Progresso: o que você mantém {#progresso}

Esta era a pergunta em aberto. Em 16 de setembro uma mensagem da staff no Discord tinha confirmado que [os desbloqueios de decks e o progresso contra os chefes passariam da Demo 1 para a Demo 2](/pt/news/demo-2-progress-carryover), mas não dizia nada sobre o playtest fechado. Agora a equipe é explícita: quem jogou a demo, o playtest ou os dois mantém o progresso do que estiver mais adiantado, "para que ninguém tenha que desbloquear as cartas de novo".

Isso importa porque desbloquear é lento. No playtest cada deck se abre depois de três vitórias na ranqueada mais uma vitória contra um chefe controlado pela IA, o caminho que os jogadores tinham chamado de punitivo no [feedback de 14 de setembro](/pt/news/playtest-feedback-deck-unlock).

## E o playtest? {#playtest}

Quem joga o playtest fechado não recebe decks, cartas nem chefes novos com esta atualização. A parte de polimento chega ao playtest mais para o fim desta semana, junto com outras mudanças que a equipe quer testar com os jogadores: quem está jogando partidas ranqueadas por lá vai ter que esperar alguns dias.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Quais são as recompensas exclusivas da ranqueada.
- Se a montagem de decks já está aberta para todos na demo pública: o anúncio não diz.

**Atualização de 22 de setembro:** duas perguntas foram respondidas. Os detalhes do balanceamento saíram ([notas do patch](/pt/news/demo-patch-notes-0921)), e o anúncio agora também está no Steam, onde foi publicado às 21:59 UTC de 21 de setembro.

## O boato que acertou {#boato}

Na semana passada circulou nas redes sociais uma frase sobre uma "Demo Season 2" que chegaria na semana seguinte, com decks novos, recompensas novas e um primeiro gostinho da coleção. Nós [a noticiamos como boato](/pt/news/demo-2-animations-and-fixes), porque nenhum post oficial a confirmava. O momento e a parte da coleção se mostraram certos.`,
  },
  "forum-bugs-before-demo-2": {
    title: "Partidas travadas, o ovo no Colosseum e um botão de revanche: os relatos do fim de semana",
    metaTitle: "Bugs de Origins TCG: partidas travadas, Golden Egg",
    description:
      "Três relatos do fórum de Origins TCG de 19 e 20 de setembro: uma partida travada, o Golden Egg no Colosseum e um botão de revanche nas partidas privadas.",
    summary:
      "Três tópicos novos no fórum do Steam entre 19 e 20 de setembro, nenhum respondido pela equipe até agora: uma partida que congela depois do combate, um Golden Egg que se comporta de um jeito estranho no Colosseum e o pedido de um botão de revanche nas partidas privadas.",
    highlights: [
      { label: "Uma partida travada em \"waiting\"", text: "depois do combate, relatada em 20 de setembro; um jogador a ligou a Spellbook", anchor: "partida-travada" },
      { label: "O Golden Egg no Colosseum", text: "o Golden Goose que ele invocou não causou dano no combate", anchor: "golden-egg" },
      { label: "Um botão de revanche", text: "pedido para as partidas privadas, com troca de deck dentro da sala", anchor: "revanche" },
      { label: "O que a equipe disse", text: "as últimas respostas dela no fórum são de 16 de setembro", anchor: "equipe" },
    ],
    body: `## Uma partida travada em "waiting" {#partida-travada}

Em 20 de setembro um jogador relatou uma partida que congelou depois da fase de combate: a tela ficou em "waiting" muito além do tempo do turno, enquanto todo o resto continuava clicável e ainda dava para desistir da partida.

Outro jogador respondeu que é um bug conhecido ligado a Spellbook e que deveria ser corrigido na "demo season 2 na semana que vem". Essa resposta veio de um jogador, não da equipe, e naquele momento não era um anúncio.

**Atualização de 21 de setembro:** a [primeira grande atualização da demo](/pt/news/demo-first-big-update) chegou mesmo no dia seguinte. A lista de correções ainda não foi publicada, então não dá para dizer se este bug está entre elas.

## O Golden Egg no Colosseum {#golden-egg}

Em 19 de setembro outro jogador descreveu um combate no local The Colosseum:

1. o Golden Egg dele foi quebrado pela habilidade Ao revelar de Black Knight, que causa 2 de dano ao inimigo à frente dele;
2. o ovo invocou o Golden Goose, um 5/5, no mesmo espaço;
3. no combate o Goose não causou dano: Black Knight, um 2/2, sobreviveu, e o Goose ficou em 5/3.

Parece ser a regra que o desenvolvedor Fenchurch explicou no fórum em 15 de setembro: um personagem invocado no meio do combate, no espaço em que aparece, só ataca na rodada seguinte. Ser invocado não o protege do dano, o que explica o 5/3. O que o Colosseum acrescenta ainda não está claro: o tópico continua sem resposta.

## Um botão de revanche para as partidas privadas {#revanche}

O terceiro tópico é um pedido: um botão "jogar de novo" ou "revanche" no fim de uma partida privada, e a opção de trocar de deck sem sair da sala privada.

## O que a equipe disse até agora {#equipe}

As últimas respostas da equipe no fórum são de 16 de setembro: [animações mais rápidas e o bug de Off With Your Head!](/pt/news/demo-2-animations-and-fixes), e [o rework da IA dos combates contra chefes](/pt/news/demo-2-boss-ai-rework).`,
  },

  "demo-2-progress-carryover": {
    title: "A Demo 2.0 mantém os decks e o progresso contra os chefes desbloqueados na Demo 1",
    metaTitle: "Origins TCG: a Demo 2.0 mantém os desbloqueios da Demo 1",
    description:
      "Mensagem da staff da Koin Games no Discord, 16 de setembro: os decks e o progresso contra os chefes da Demo 1 de Origins TCG passam para a Demo 2.",
    summary:
      "Em 16 de setembro um membro da staff da Koin Games escreveu no Discord oficial que a Demo 2 mantém os decks desbloqueados e o progresso contra os chefes conquistados na Demo 1. Em 21 de setembro a equipe estendeu a promessa ao playtest fechado.",
    highlights: [
      { label: "Os desbloqueios da Demo 1 continuam", text: "decks desbloqueados e progresso contra os chefes, escreveu um membro da staff no Discord em 16 de setembro", anchor: "staff" },
      { label: "Por que isso importava", text: "no playtest cada deck pede três vitórias na ranqueada e uma vitória contra um chefe", anchor: "por-que-importava" },
      { label: "O playtest também conta", text: "desde 21 de setembro você mantém o progresso do que estiver mais adiantado", anchor: "atualizacao" },
    ],
    body: `## O que a staff escreveu {#staff}

"Demo V2 deck will carry over your V1 deck unlock/boss progress", ou seja, a Demo 2 mantém os decks desbloqueados e o progresso contra os chefes da Demo 1: é a mensagem que um membro da staff de Origins publicou no Discord oficial na noite de 16 de setembro, respondendo aos jogadores que perguntavam se todos teriam que começar do zero. Uma captura da mensagem foi compartilhada no Reddit na manhã seguinte.

## Por que isso importava {#por-que-importava}

No playtest cada deck é desbloqueado com três vitórias na ranqueada mais uma vitória contra um chefe controlado pela IA, o caminho que os jogadores tinham chamado de punitivo no [feedback de 14 de setembro](/pt/news/playtest-feedback-deck-unlock). Ter que repeti-lo do zero com a Demo 2 era a principal preocupação. Até aquela mensagem, a resposta que circulava na comunidade era a oposta.

## O que ainda estava em aberto {#em-aberto}

A mensagem falava só da Demo 1 e da Demo 2. Se o progresso conquistado no playtest fechado também contaria não estava escrito em nenhum post oficial, então naquele momento mantivemos as duas coisas separadas.

## Atualização de 21 de setembro {#atualizacao}

A questão está resolvida. Ao anunciar [a primeira grande atualização da demo](/pt/news/demo-first-big-update), a equipe escreveu que quem jogou a demo, o playtest ou os dois mantém o progresso do que estiver mais adiantado, "para que ninguém tenha que desbloquear as cartas de novo".`,
  },

  "demo-2-boss-ai-rework": {
    title: "A Koin vai refazer a IA dos combates contra chefes na Demo 2.0",
    metaTitle: "Origins TCG: a Koin vai refazer a IA dos chefes na Demo 2.0",
    description:
      "O desenvolvedor Fenchurch confirma no fórum do Steam um rework da IA dos chefes de Origins TCG na Demo v2, após um relato sobre o chefe Dracula.",
    summary:
      "Um jogador descreveu o chefe Dracula das missões vencendo todos os sorteios aleatórios. O desenvolvedor da Koin Games Fenchurch respondeu no fórum do Steam que a IA dos combates contra chefes está sendo refeita para a Demo v2, e que os chefes e o desbloqueio de cartas vão continuar mudando.",
    highlights: [
      { label: "O relato", text: "Dracula, o chefe das missões, parecia vencer todos os sorteios aleatórios", anchor: "relato" },
      { label: "Rework da IA dos chefes prometido para a Demo v2", text: "confirmado pelo desenvolvedor Fenchurch em 16 de setembro", anchor: "resposta" },
      { label: "Por que importa", text: "os chefes fazem parte do caminho que desbloqueia os decks", anchor: "por-que-importa" },
      { label: "Depois da atualização de 21 de setembro", text: "o anúncio não menciona os chefes", anchor: "depois" },
    ],
    body: `## O relato {#relato}

Em 15 de setembro um jogador publicou no fórum do Steam o relato de quatro partidas contra Dracula, o chefe das missões da demo. Os chefes anteriores, escreveu, eram fortes mas justos: todos vencidos na primeira tentativa com os decks pré-montados desbloqueados logo antes. Dracula, ao contrário, parecia acertar todos os efeitos "aleatórios":

- abóboras sempre acertando a barreira com menos vida;
- feitiços que causam 6 de dano de forma aleatória sempre caindo no personagem mais forte com 6 de Vida ou menos;
- descartes aleatórios sempre levando a carta mais perigosa da mão;
- invocações aleatórias sempre no melhor espaço.

## A resposta da equipe {#resposta}

O desenvolvedor Fenchurch respondeu em 16 de setembro: "Our boss fight AI will be getting a re-work in Demo v2", ou seja, a IA dos combates contra chefes será refeita na Demo v2. Ele acrescentou que a equipe vai continuar observando e mudando o funcionamento dos combates contra chefes e do desbloqueio de cartas.

Não é a primeira mudança nos chefes. As notas do patch 0.6.3 do playtest, de 27 de agosto, já tinham dado a eles uma "nova inteligência de bot melhorada", perguntando aos jogadores se tinham ficado mais espertos ou mais burros.

## Por que importa {#por-que-importa}

Os chefes fazem parte do caminho de desbloqueio: no playtest um deck se abre depois de três vitórias na ranqueada e uma vitória contra um chefe controlado pela IA. Um chefe que parece injusto atrasa a coleção inteira. É a segunda vez em uma semana que esse caminho volta nos tópicos de feedback, depois [da resposta de 14 de setembro](/pt/news/playtest-feedback-deck-unlock) sobre tornar essas partidas só PvE.

## Atualização de 21 de setembro: o que veio depois {#depois}

Em 21 de setembro chegou a [primeira grande atualização da demo](/pt/news/demo-first-big-update). O anúncio não menciona os chefes: ainda não se sabe se a nova IA já está nela.`,
  },

  "demo-2-animations-and-fixes": {
    title: "Antes da Demo 2.0: animações mais rápidas confirmadas, bug de Off With Your Head! na lista de correções",
    metaTitle: "Origins TCG: animações mais rápidas, Off With Your Head!",
    description:
      "O que a equipe de Origins TCG confirmou em 16 de setembro: animações mais rápidas, o bug de Off With Your Head! corrigido na Demo v2, áudio e um boato.",
    summary:
      "Em 16 de setembro a equipe confirmou no fórum do Steam que as animações serão aceleradas e que as cópias invisíveis de Off With Your Head! são um bug conhecido, corrigido com a Demo v2. Enquanto isso, circulava um boato sobre uma \"Demo Season 2\".",
    highlights: [
      { label: "Animações mais rápidas", text: "a staff diz que serão aceleradas em uma próxima atualização", anchor: "animacoes" },
      { label: "O bug de Off With Your Head!", text: "cópias semi-invisíveis, um bug conhecido que será corrigido com a Demo v2", anchor: "off-with-your-head" },
      { label: "Áudio", text: "os relatos vão para a equipe de áudio", anchor: "audio" },
      { label: "O boato da \"Demo Season 2\"", text: "acertou o momento: a atualização da demo chegou em 21 de setembro", anchor: "boato" },
    ],
    body: `## Animações mais rápidas {#animacoes}

"As animações precisam ficar 100–200% mais rápidas": o tópico aberto em 11 de setembro recebeu sobretudo respostas a favor, com um jogador dizendo que a velocidade está boa como está. Em 16 de setembro um membro da staff respondeu que a equipe reconheceu a necessidade de acelerar as animações e que "isso será ajustado em uma próxima atualização".

## O bug de Off With Your Head! {#off-with-your-head}

Um jogador novo descreveu cópias de Christopher Robin aparecendo sem ilustração, só com o Poder e a Vida visíveis. O desenvolvedor Fenchurch identificou a carta por trás disso: Off With Your Head!, que destrói um aliado e invoca uma cópia básica dele em cada um dos outros locais. As cópias semi-invisíveis são um bug conhecido, e "será corrigido quando lançarmos a Demo v2 aqui, muito em breve".

## Áudio {#audio}

A um jogador que tinha listado vários bugs, Fenchurch respondeu que os relatos sobre o áudio seriam repassados à equipe de áudio.

## O boato da "Demo Season 2" {#boato}

Nos mesmos dias circulou uma frase nas redes sociais: uma "Demo Season 2" chegando na semana seguinte, com decks novos, recompensas novas e um primeiro gostinho da coleção. Nenhum post oficial no Steam, no Discord ou em origins-tcg.com a confirmava, então a noticiamos como boato e ficamos com as datas oficiais, o Steam Next Fest de 19 a 26 de outubro.

**Atualização de 21 de setembro:** o boato acertou o momento. A [primeira grande atualização da demo](/pt/news/demo-first-big-update) chegou em 21 de setembro com um tutorial para colecionadores e pacotes de teste. A lista de correções ainda não foi publicada, então não dá para dizer se o bug de Off With Your Head! está entre elas.`,
  },

  "davdas-3-pigs-mid-range": {
    title: "3 Pigs Mid Range: um deck midrange de Three Not So Little Pigs para a ladder e o competitivo",
    metaTitle: "Novo deck da staff de Origins TCG: 3 Pigs Mid Range",
    description:
      "Deck midrange de Origins TCG liderado por Three Not So Little Pigs, para ladder e competitivo: domine o tabuleiro, vença um local, feche com En Passant.",
    summary:
      "O segundo deck do Davdas, da staff do OriginsMeta, é uma lista midrange liderada por Three Not So Little Pigs, marcada para a ladder e o jogo competitivo. O plano: dominar o tabuleiro nas primeiras rodadas, vencer pelo menos um local e depois fechar com En Passant, o Atropelar de Ellen Trechend e os Lightning Strikes que Impundulu gera. A página do deck tem a lista completa com os gráficos de composição, as notas de mulligan do autor, o código do jogo e o botão para abri-lo no Deck builder, além de dois guias sobre como jogá-lo.",
  },

  "davdas-healing-healsing": {
    title: "Healing Healsing, o primeiro deck da comunidade: uma lista controle de Van Helsing para a ladder",
    metaTitle: "Primeiro deck de Origins TCG no OriginsMeta: Van Helsing",
    description:
      "O primeiro deck publicado no OriginsMeta: uma lista controle de Van Helsing para a ladder de Origins TCG que cura o dano recebido e limpa o tabuleiro no fim.",
    summary:
      "O primeiro deck publicado no OriginsMeta é do Davdas, da staff do OriginsMeta: uma lista controle liderada por Van Helsing para a ladder ranqueada. O plano: ganhar valor cedo com Spellbook e Ali Baba, curar o dano enquanto Phuong Hoang cresce a cada cura, depois chegar à rodada 8 ou 9 e limpar o tabuleiro com Forbidden Knowledge. A página do deck tem a lista completa com os gráficos de composição, as notas de mulligan do autor, o código do jogo e o botão para abri-lo no Deck builder, além de dois guias sobre como jogá-lo.",
  },

  "playtest-feedback-deck-unlock": {
    title: "Feedback do playtest: a Koin lê o fórum do Steam e pode levar o desbloqueio dos decks para o PvE",
    metaTitle: "Playtest de Origins TCG: desbloqueio dos decks no PvE?",
    description:
      "Feedback do playtest de Origins TCG: um deck pede três vitórias na ranqueada e um chefe; Fenchurch diz que a Koin lê o fórum e pode torná-lo só PvE.",
    summary:
      "No playtest atual você desbloqueia um deck vencendo três partidas ranqueadas e depois derrotando um chefe controlado pela IA; os jogadores chamam isso de punitivo quando enfrentam coleções completas com um deck inicial. O desenvolvedor Fenchurch respondeu que a equipe lê todos os posts do fórum do Steam e está pensando em tornar as partidas de desbloqueio só PvE. Também foram relatados: cartas que geram cartas aleatórias (Humpty, Spellbook) podem colocar Lendárias extras em um deck, pedidos para redesenhar Spellbook e a habilidade Ao revelar de Asanbosam que não se repete no local Cloning Lab.",
  },

  "kickstarter-ama-pre-registration": {
    title: "AMA do Kickstarter realizada: pré-cadastro aberto, caixas da Alpha Edition só em pré-venda",
    metaTitle: "AMA do Kickstarter de Origins TCG: caixas Alpha em pré-venda",
    description:
      "AMA do Kickstarter de Origins TCG, 10 de setembro: 15% de desconto com depósito reembolsável de 1 dólar, caixas Alpha só em pré-venda. Tudo no guia.",
    summary:
      "Em 10 de setembro a Koin Games respondeu a perguntas sobre o próximo Kickstarter no Discord oficial. A data da campanha ainda não foi anunciada; a página oficial de pré-cadastro oferece 15% de desconto no lançamento com um depósito de 1 dólar, totalmente reembolsável antes do lançamento. A Origins Myths & Legends Alpha Edition vem em pacotes de colecionador de 5 cartas (com pelo menos uma Rara ou melhor garantida), caixas de 24 pacotes e cases de 6 caixas; caixas e cases são só em pré-venda e a tiragem não será repetida. As cartas são negociadas no Mercado da Comunidade Steam; a abertura de pacotes no celular está prevista para 2027.",
  },

  "gameplay-trailer": {
    title: "Trailer oficial de gameplay publicado no YouTube",
    metaTitle: "Trailer oficial de gameplay de Origins TCG no YouTube",
    description:
      "O primeiro trailer oficial de gameplay de Origins TCG está no YouTube: o jeito mais rápido de ver o ritmo de uma partida e a interface antes da Demo 2.0.",
    summary:
      "O primeiro trailer dedicado ao gameplay está no canal oficial de Origins TCG no YouTube: o jeito mais rápido de ver o ritmo de uma partida e a interface antes de a Demo 2.0 chegar no Steam Next Fest.",
  },

  "itzbolt-wins-conquest": {
    title: "itzBolt vence o Big Bob's Playtest Battle, o primeiro torneio de Conquest",
    metaTitle: "Origins TCG: itzBolt vence o primeiro torneio de Conquest",
    description:
      "itzBolt venceu o Big Bob's Playtest Battle, o primeiro torneio de Origins TCG no formato Conquest, jogado no playtest 0.6.3 com partidas melhor de três.",
    summary:
      "O torneio da comunidade jogado na versão 0.6.3 do playtest, com montagem de decks completa e o formato Conquest (vários decks com Lendárias diferentes, melhor de 3), foi vencido por itzBolt, segundo os resultados compartilhados pela comunidade (não encontramos um post oficial com o resultado). Foi o primeiro teste público do formato que a Koin escolheu depois para a Crimson Cup.",
  },
  "biggest-tournament-ever": {
    title: "Crimson Cup anunciada: o maior torneio da história para o Steam Next Fest",
    metaTitle: "Crimson Cup anunciada para o Steam Next Fest",
    description:
      "Em 9 de setembro a Koin Games anunciou a Crimson Cup de Origins TCG: 20 a 25 de outubro, classificatórias regionais, 10.000 dólares em prêmios. E as regras.",
    summary:
      "Um evento de vários dias, de 20 a 25 de outubro: classificatórias para cada uma das três grandes regiões nos dias 20, 21 e 22, depois playoffs e finais. Prêmios no valor de 10.000 dólares: uma carta promo 1/1 exclusiva, outras cartas promo, pacotes digitais, caixas e cases Alpha e prêmios em dinheiro. Inscrições no Discord; os criadores de conteúdo podem pedir convites wildcard direto para os playoffs.",
    highlights: [
      { label: "20 a 25 de outubro", text: "classificatórias para as três grandes regiões nos dias 20, 21 e 22, depois playoffs e finais", anchor: "datas" },
      { label: "Prêmios no valor de 10.000 dólares", text: "uma carta promo 1/1, outras cartas promo, pacotes digitais, caixas e cases Alpha, dinheiro", anchor: "premios" },
      { label: "Inscrições no Discord", text: "os criadores de conteúdo podem pedir um wildcard direto para os playoffs", anchor: "inscricoes" },
      { label: "As regras finais", text: "Conquest com três decks e check-in obrigatório, definidos em 24 de setembro", anchor: "atualizacao" },
    ],
    body: `Regras, formato e check-in, como definidos em 24 de setembro: [regras da Crimson Cup](/pt/news/crimson-cup-format-check-in).

## O que a Koin anunciou em 9 de setembro {#datas}

Em 9 de setembro a Koin Games anunciou no Steam o maior torneio da sua história: um evento de vários dias durante o Steam Next Fest, de 20 a 25 de outubro de 2026.

1. **Classificatórias**, uma para cada uma das três grandes regiões, em 20, 21 e 22 de outubro.
2. **Playoffs e finais** depois das classificatórias.

## Os prêmios anunciados {#premios}

Os prêmios valem 10.000 dólares no total e vêm em várias formas:

- uma carta promo 1/1 exclusiva;
- outras cartas promo;
- pacotes digitais;
- caixas e cases Alpha;
- prêmios em dinheiro.

## Inscrições e wildcards {#inscricoes}

As inscrições são feitas no [Discord oficial de Origins TCG](https://discord.gg/originstcg). Os criadores de conteúdo podem pedir um convite wildcard que os leva direto aos playoffs.

## Atualização de 25 de setembro de 2026 {#atualizacao}

Este artigo traz o primeiro anúncio, de 9 de setembro. Em 24 de setembro, depois de uma pesquisa com os jogadores, a Koin Games definiu o formato: Conquest com três decks, pelo menos 8 cartas únicas entre cada par de decks, listas ocultas até o top 4 e nenhum ban nas partidas melhor de cinco. O check-in é obrigatório: abre duas horas antes de cada classificatória e fecha cinco minutos antes do início, junto com a entrega dos decks. O torneio é jogado na demo principal, e a premiação exata foi prometida para a semana seguinte.

As regras, os horários do check-in e o que ainda não sabemos estão no [nosso artigo sobre as regras da Crimson Cup](/pt/news/crimson-cup-format-check-in); datas, vagas por região e como se preparar estão no nosso [guia do Steam Next Fest 2026](/pt/guides/steam-next-fest-2026).`,
  },

  "patch-0-6-3": {
    title: "Patch 0.6.3 do playtest: dezesseis cartas ajustadas, King Arthur sobe para 7/7",
    metaTitle: "Patch 0.6.3 de Origins TCG: King Arthur 7/7, 16 cartas",
    description:
      "Patch 0.6.3 do playtest de Origins TCG, 27 de agosto: buffs a King Arthur, Merlin e Lancelot, nerfs a Bandersnatch e Bigfoot, três reworks, chefes melhores.",
    summary:
      "Um patch de ajustes e correções, usado no torneio do Big Bob dois dias depois. Buffs para King Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll e Blow the House Down; nerfs para Bandersnatch, Bigfoot, Scarecrow e Merlin's Prophecy; rework de Bagheera, Christopher Robin e Sandman. Os chefes ganharam uma IA mais esperta.",
  },

  "big-bobs-playtest-battle": {
    title: "O Big Bob's Playtest Battle traz o formato Conquest",
    metaTitle: "Big Bob's Playtest Battle leva o Conquest a Origins TCG",
    description:
      "Big Bob's Playtest Battle, 28 de agosto: o primeiro torneio de Origins TCG no formato Conquest, eliminação simples em MD3, com wildcards para o Next Fest.",
    summary:
      "Torneio em 28 de agosto na versão do playtest com montagem de decks completa. Melhor de 3, eliminação simples e o primeiro uso do Conquest: você entrega vários decks com Lendárias diferentes e pelo menos nove cartas diferentes, e bane um dos decks do oponente. Prêmios: wildcards para o torneio do Next Fest e Collector Packs.",
  },

  "patch-0-6-2": {
    title: "Patch 0.6.2 do playtest: balanceamento de 23 cartas",
    metaTitle: "Notas do patch 0.6.2 de Origins TCG: 23 cartas mudam",
    description:
      "Patch 0.6.2 do playtest de Origins TCG, 21 de agosto: Mulan ganha Ataque duplo, Queen of Hearts cai para 4 de mana, Van Helsing's Tools grátis. 23 cartas.",
    summary:
      "Oito cartas mudaram o que a sua habilidade faz. Mulan ganha Ataque duplo, Queen of Hearts cai para 4 de mana 3/3 com Primeiro golpe, Ellen Trechend vira uma 3/3 de 8 de mana que cresce +3/+3 por inimigo. Van Helsing's Tools fica grátis, mas Silver Bullet causa 1 de dano. A coleção agora se limita aos dez decks do playtest.",
  },

  "patch-0-6-1-ranked": {
    title: "Patch 0.6.1: ladder ranqueada, ranking Grandmaster, três decks ajustados",
    metaTitle: "Patch 0.6.1: ranqueada e ranking Grandmaster",
    description:
      "Patch 0.6.1 de Origins TCG, 14 de agosto: modo ranqueado com ranking mundial da divisão Grandmaster, qualidade de vida, Huntsman com 6 de mana.",
    summary:
      "Chega o modo ranqueado, com um ranking mundial para a divisão Grandmaster, além de melhorias de qualidade de vida: pular o tutorial, ver a Lendária do oponente durante o mulligan, silenciar os emotes. Huntsman passa a 6 de mana 6/6; Swarm, Evil e Discard trocam uma carta cada.",
  },

  "demo-2-playtest": {
    title: "Playtest da Demo 2.0: 5 decks novos, mais de 70 cartas novas, montagem de decks",
    metaTitle: "Playtest da Demo 2.0 de Origins TCG: 5 decks, 70+ cartas",
    description:
      "A atualização de Origins TCG para o Steam Next Fest vai para os playtests da comunidade a partir de 7 de agosto: 5 decks, mais de 70 cartas, deckbuilding.",
    summary:
      "A atualização que vai sair no Steam Next Fest de outubro vai para os playtests da comunidade, a partir de sexta-feira, 7 de agosto, às 21:00 UTC, com uma noite de jogos. Aberto a todos pelo Discord.",
  },

  "demo-stats-ama": {
    title: "Primeiros números da demo: mais de 1.000 jogadores, mais de 13.000 partidas, mediana de 1h51",
    metaTitle: "Demo de Origins TCG: 1.000 jogadores, 13.000 partidas",
    description:
      "Seis dias após o lançamento, a demo de Origins TCG passou de 1.000 jogadores e 13.000 partidas, com mediana de 1h51. E mais: AMA, torneio e Card Party.",
    summary:
      "Seis dias depois do lançamento, a equipe compartilha os números da demo e anuncia uma AMA com o CEO Tim Jooste e o chefe de game design Kevin Lambert (22 de julho), o primeiro torneio da demo (24 de julho) e um estande na Card Party em Fort Lauderdale (24 a 26 de julho).",
  },

  "demo-live": {
    title: "A demo de Origins TCG está no ar no Steam",
    metaTitle: "Demo de Origins TCG lançada com colecionáveis exclusivos",
    description:
      "A demo gratuita de Origins TCG está no ar no Steam, com colecionáveis exclusivos que não estarão disponíveis depois e serão negociáveis no lançamento do jogo.",
    summary:
      "Demo gratuita com colecionáveis exclusivos que não estarão disponíveis depois e poderão ser negociados no mercado do Steam quando o jogo completo for lançado. Festa de lançamento no Discord no mesmo dia.",
  },

  "creator-program": {
    title: "Creator Program anunciado, detalhes em uma AMA no Discord",
    metaTitle: "Creator Program de Origins TCG anunciado, AMA no Discord",
    description:
      "A Koin Games abre o Creator Program de Origins TCG antes do Steam Next Fest. AMA em 19 de agosto, gravada no Discord. O OriginsMeta se inscreveu.",
    summary:
      "A Koin Games abre um programa para criadores de conteúdo antes do Steam Next Fest. Os detalhes foram dados em uma AMA em 19 de agosto às 20:00 UTC; a gravação está no Discord. O OriginsMeta se inscreveu.",
  },

  "community-open": {
    title: "O Discord oficial abre para todos",
    metaTitle: "O Discord oficial de Origins TCG abre para todos",
    description:
      "O Discord oficial de Origins TCG, casa dos primeiros testadores da alpha, abre para todos, com uma demo anunciada para breve e uma prévia dos colecionáveis.",
    summary:
      "O servidor que recebeu os primeiros testadores da alpha se abre para todos, com uma demo anunciada para breve e um primeiro olhar sobre os colecionáveis.",
  },

  "metal-cards-tease": {
    title: "Cartas físicas de metal mostradas pelo CEO",
    metaTitle: "Cartas físicas de metal de Origins TCG mostradas pelo CEO",
    description:
      "O CEO da Koin Games, Tim Jooste, foi filmado com cartas colecionáveis de metal de Origins TCG. Nenhum produto nem data anunciados: só um sinal de intenção.",
    summary:
      "Tim Jooste foi filmado com cartas colecionáveis de metal baseadas na propriedade intelectual do jogo. Nenhum produto nem data anunciados: um sinal de intenção de um estúdio que nasceu digital.",
  },

  "steam-page-live": {
    title: "Página no Steam no ar: lista de desejos aberta, demo a caminho",
    metaTitle: "Página de Origins TCG no Steam no ar: lista de desejos",
    description:
      "A página de Origins TCG no Steam está no ar e a lista de desejos abre, com o 1º post da equipe: partidas táticas rápidas e coleção como nos TCGs físicos.",
    summary:
      "Primeiro post da equipe no Steam: um jogo de cartas colecionáveis construído em torno de partidas táticas rápidas e de um sistema de colecionáveis inspirado nos TCGs físicos.",
  },
  "digital-lgs-program": {
    title: "Digital LGS Program: Origins TCG quer lojas de jogos locais com torneios semanais e vendendo os seus sets",
    metaTitle: "Digital LGS Program de Origins TCG: lojas de jogos",
    description:
      "O fundador da Koin Games apresenta o Digital LGS Program de Origins TCG: torneios semanais, promos só na loja e pré-venda dos sets nas lojas de jogos locais.",
    summary:
      "Em 6 de outubro Tim Jooste, fundador e CEO da Koin Games, apresentou no X o Digital LGS Program: as lojas de jogos locais vão organizar torneios semanais de Origins, vender pacotes e promos exclusivos da loja e aceitar pré-vendas de sets colecionáveis que não estarão disponíveis no jogo. Os eventos presenciais começam no início de 2027; o Set 1 entra no Kickstarter em 27 de outubro, com as lojas envolvidas no lançamento. Em 8 de outubro a conta oficial de Origins acrescentou as condições: as lojas aceitam pré-vendas em troca de uma parte da receita, sem custo e sem estoque porque tudo é um item do inventário Steam, e em troca organizam eventos de jogo organizado.",
    highlights: [
      { label: "O Digital LGS Program", text: "o fundador da Koin Games o apresenta no X: sets de Origins distribuídos pelas lojas de jogos locais", anchor: "programa" },
      { label: "Torneios, promos, pré-vendas", text: "torneios semanais nas lojas, pacotes e promos só presenciais, pré-venda de sets que não estarão no jogo", anchor: "lojas" },
      { label: "Como funciona para as lojas", text: "pré-vendas com uma parte da receita, sem custo nem estoque, jogo organizado em troca (8 de outubro)", anchor: "condicoes" },
      { label: "Início de 2027, Kickstarter em 27 de outubro", text: "os eventos presenciais começam no início de 2027; o Set 1 estreia no Kickstarter com as lojas a bordo, mais de 30 já interessadas", anchor: "datas" },
      { label: "Criadores e uma AMA", text: "streamers e criadores de conteúdo têm um programa próprio; AMA para lojas e criadores em 12 de outubro às 21:00 UTC", anchor: "criadores" },
      { label: "O que não sabemos", text: "quais lojas e países, a parte da receita, a frequência dos eventos e quando começam", anchor: "o-que-nao-sabemos" },
    ],
    faq: [
      {
        q: "O que é o Digital LGS Program de Origins TCG?",
        a: "Um programa anunciado no X pelo fundador e CEO da Koin Games, Tim Jooste, em 6 de outubro de 2026: as lojas de jogos locais organizam torneios semanais de Origins, vendem pacotes e promos exclusivos só presenciais e aceitam pré-vendas dos próximos sets colecionáveis, que não estarão disponíveis no jogo. Em 8 de outubro a conta oficial de Origins acrescentou as condições para as lojas: pré-vendas com uma parte da receita, sem custo nem estoque, eventos de jogo organizado em troca. Uma página com as condições completas ainda não foi publicada.",
      },
      {
        q: "Quando começam os eventos de Origins TCG nas lojas?",
        a: "Segundo o post, os eventos presenciais começam oficialmente no início de 2027, mas as lojas podem entrar antes: o Set 1 entra no Kickstarter em 27 de outubro de 2026 e a Koin Games diz que está trabalhando com as lojas locais no lançamento.",
      },
      {
        q: "Como uma loja de jogos pode entrar no programa de Origins TCG?",
        a: "Entrando em contato direto com a Koin Games: Tim Jooste diz que as mensagens diretas dele no X estão abertas e oferece uma call, e a conta oficial pede aos donos de lojas e aos criadores que mandem uma mensagem direta para participar da AMA sobre o programa, na segunda-feira, 12 de outubro de 2026, às 21:00 UTC. Em dois meses, segundo o fundador, mais de 30 lojas já tinham entrado em contato. Também existe uma versão do programa para streamers e criadores de conteúdo.",
      },
      {
        q: "Quanto custa para uma loja entrar no programa de Origins TCG?",
        a: "Nada, segundo a conta oficial de Origins (8 de outubro de 2026): cartas, pacotes, caixas e cases são itens do inventário Steam, então as lojas não compram estoque, não guardam mercadoria nem enviam pedidos. Elas aceitam pré-vendas e recebem uma parte da receita, cujo tamanho não foi divulgado, e em troca organizam eventos de jogo organizado.",
      },
    ],
    body: `## O Digital LGS Program {#programa}

Em 6 de outubro de 2026 **Tim Jooste**, fundador e CEO da Koin Games, publicou no X um post longo com um vídeo curto. Ele descreve uma noite na sua loja de jogos local (LGS, local game store) levando só o celular: uma noite de partidas de Origins contra os jogadores da sua cidade, uma promo exclusiva da loja para disputar e um booster do próximo set de colecionador para pré-encomendar. O estúdio o chama de **Digital LGS Program** e, nas palavras dele, ele faz de Origins "o 1º jogo de cartas digital a distribuir sets pelas lojas de jogos locais do mundo todo".

Essa é a afirmação do fundador, não algo que possamos verificar. O que o post diz com clareza é o formato do programa: um jogo de cartas digital com uma rede física de lojas que organizam os seus eventos e vendem os seus sets.

**Atualização de 11 de outubro:** em 8 de outubro a conta oficial de Origins no X explicou como o programa funciona para as lojas. Elas aceitam pré-vendas e recebem uma parte da receita, entrar não custa nada e não há estoque para guardar, porque cartas e pacotes são itens do inventário Steam. Em troca, as lojas organizam eventos de jogo organizado, o único lugar onde algumas promos e pacotes especiais podem ser conquistados. A conta também anunciou uma AMA para donos de lojas e criadores na segunda-feira, 12 de outubro, às 21:00 UTC. Os detalhes estão nas seções abaixo.

## O que as lojas ganham e o que os jogadores ganham {#lojas}

O post lista quatro coisas:

- **Torneios semanais locais**, jogados na loja.
- **Pacotes e promos exclusivos, só presenciais**: cartas que você só consegue indo até lá.
- **Pré-venda dos próximos sets colecionáveis**, que não estarão disponíveis no jogo, com recompensas por apoiar a sua loja.
- E, como diz o post, conhecer pessoas de verdade, jogar e fazer amigos ao vivo.

As lojas interessadas em participar são convidadas a falar diretamente com Jooste: as mensagens diretas dele no X estão abertas, e ele oferece uma call.

## Como funciona para as lojas: os detalhes de 8 de outubro {#condicoes}

Dois dias depois do fundador, em 8 de outubro, a conta oficial de Origins TCG no X explicou o programa em um post mais longo. O ponto de partida: nos jogos de cartas tradicionais, as lojas locais constroem a comunidade, ensinam os jogadores novos e organizam eventos regulares, e os torneios locais muitas vezes são onde se ganham os melhores prêmios. Origins é digital por natureza, diz o post, mas a sua comunidade também merece lugares de verdade para se encontrar. As condições:

- **Pré-vendas e uma parte da receita.** As lojas participantes podem aceitar pré-vendas dos produtos colecionáveis de Origins e receber uma parte da receita. O post não diz qual é o tamanho dessa parte.
- **Sem estoque.** Cartas, pacotes, caixas e cases vão existir como itens do inventário Steam, então as lojas não compram estoque, não guardam mercadoria, não ocupam espaço nas prateleiras nem enviam pedidos.
- **Custo zero.** Entrar "costs literally $0", não custa literalmente nada, diz o post, e as lojas participam dos ganhos tanto quanto, se não mais do que, com um jogo de cartas físico. A comparação é da Koin.
- **Jogo organizado em troca.** As lojas participantes organizam eventos de jogo organizado. Origins vai direcionar os jogadores para essas lojas e apoiá-las como pontos de encontro locais do jogo.
- **Recompensas que só se ganham nos eventos.** Cartas promo únicas e pacotes especiais são conquistados participando e competindo nas lojas participantes. Origins não vai vender essas cartas de torneio nem colocá-las nos pacotes normais.
- **Uma rede que pode crescer.** O jogo organizado começa com eventos locais trimestrais e pode evoluir para competições mais frequentes, eventos regionais e, um dia, uma estrutura de campeonato mundial.

Um detalhe ainda não fecha: o post do fundador falava de torneios semanais nas lojas, enquanto o post oficial descreve a rede começando com eventos locais trimestrais. Nenhum dos dois posts explica como as duas coisas se encaixam.

## Datas: início de 2027, com o Kickstarter em 27 de outubro {#datas}

- Os **eventos presenciais começam oficialmente no início de 2027**. As lojas, diz o post, não precisam esperar até lá.
- **O Set 1 entra no Kickstarter em 27 de outubro de 2026**: a mesma data que o fundador deu em 17 de setembro e que a demo mostra no seu menu (o nosso [guia do Kickstarter](/pt/guides/origins-tcg-kickstarter) reúne tudo o que foi confirmado até agora). Diferente da maioria das campanhas de jogos de cartas, escreve Jooste, a Koin está trabalhando com as lojas locais no próprio lançamento.
- Em **dois meses** o estúdio já conversou com **mais de 30 lojas** interessadas em participar.

## Os criadores têm uma versão própria {#criadores}

O post acrescenta que existe uma versão do programa para streamers e criadores de conteúdo, sem detalhes. O convite vale também para jogadores e colecionadores: marque a sua loja ou o seu criador de TCG favorito embaixo do post.

Em 8 de outubro, respondendo na mesma thread, a conta oficial anunciou uma **AMA sobre o programa para donos de lojas e criadores na segunda-feira, 12 de outubro, às 21:00 UTC**, no seu Discord de criadores. Para participar, mande uma mensagem direta para @origins_tcg no X.

## Por que importa {#por-que-importa}

Origins sempre se apresentou como free-to-compete e feito para colecionadores: a ranqueada não custa nada e a coleção se apoia em [dois níveis de cartas](/pt/guides/collector-economy), competitivo e colecionável. Até agora o lado colecionável só tinha sido anunciado em forma digital: os pacotes da Alpha Edition no Kickstarter, as trocas no Mercado da Comunidade Steam; o único indício físico eram as [cartas de metal](/pt/news/metal-cards-tease) filmadas em março. Um programa para lojas dá a ele um lugar físico: o torneio da terça à noite, a promo que só se ganha ali, o set que você pré-encomenda no balcão. E, segundo o post de 8 de outubro, sem produtos físicos: o que a loja vende fica no inventário Steam. Para um jogo digital, também é uma forma de encontrar jogadores onde os jogos de cartas já são jogados.

Duas ressalvas. As condições vêm de dois posts no X, o do fundador e o da conta oficial, e não de uma página oficial com contrato e lista de lojas, e a parte da receita que vai para as lojas não foi informada. E se você quer organizar torneios antes de 2027, não precisa esperar o programa: o nosso [organizador de torneios](/pt/tournaments) é gratuito e a comunidade já o usa.

## O que ainda não sabemos {#o-que-nao-sabemos}

- Quais países e lojas participam, e se haverá uma lista pública.
- Qual é o tamanho da parte da receita, e como uma pré-venda feita em uma loja chega ao inventário Steam do jogador: um código, um vínculo com a conta ou outra coisa.
- O que "sets que não estarão disponíveis no jogo" significa para a coleção: o post oficial diz que os produtos são itens do inventário Steam e que as promos e os pacotes especiais dos torneios nunca são vendidos, mas não diz se sets inteiros serão vendidos só pelas lojas.
- Com que frequência acontecem os eventos nas lojas (o fundador escreveu semanais, o post oficial parte de eventos locais trimestrais), quando acontecem os primeiros e quais são as regras: salas privadas no jogo ou um modo dedicado, e se os resultados contam para eventos regionais ou para um campeonato mundial.
- Os preços, as recompensas por pré-encomendar em uma loja e como as promos e os pacotes especiais são entregues nos eventos.
- As condições da versão para criadores. A AMA de 12 de outubro pode responder a algumas destas perguntas.

## De onde vem a informação {#fonte}

O [post de Tim Jooste no X](https://x.com/TimothyJooste/status/2107532013687418943) de 6 de outubro de 2026, com um vídeo de 15 segundos, e o [post da conta oficial de Origins TCG](https://x.com/origins_tcg/status/2108281049721491549) de 8 de outubro de 2026, com a [resposta que anuncia a AMA](https://x.com/origins_tcg/status/2108281052212985975). Até 7 de outubro não havia nenhum post sobre o programa na página do jogo no Steam; vamos atualizar este artigo depois da AMA ou quando a Koin Games publicar as condições oficiais.`,
  },

  "crimson-cup-prizepool-qualifiers": {
    title: "Crimson Cup: premiação revelada, mais duas classificatórias e sete locais fora do torneio",
    metaTitle: "Crimson Cup de Origins TCG: premiação e classificatórias",
    description:
      "A Koin revela a premiação da Crimson Cup de Origins TCG: promo Dracula 1/1 e 1.500 dólares ao campeão, pacotes até o top 256 e mais duas classificatórias.",
    summary:
      "Em 5 de outubro a Koin Games publicou a divisão dos prêmios da Crimson Cup: o campeão leva uma carta promo Dracula 1/1, dois cases de caixas de boosters e 1.500 dólares em dinheiro, e todos no top 256 recebem pelo menos dois pacotes. O post também acrescenta duas classificatórias, AMER em 19 de outubro às 19:00 EST e EMEA em 22 de outubro às 19:00 CEST, tira do pool do torneio sete locais que dependem demais da sorte e anuncia torneios de treino semanais.",
    highlights: [
      { label: "A premiação", text: "carta promo Dracula 1/1, dois cases e 1.500 dólares ao campeão; pacotes até o top 256", anchor: "premios" },
      { label: "Mais duas classificatórias", text: "AMER em 19 de outubro às 19:00 EST e EMEA em 22 de outubro às 19:00 CEST, 32 classificados em cada", anchor: "classificatorias" },
      { label: "O que muda no calendário", text: "AMER no dia 21 às 21:00 EST com 32 classificados, 96 wild cards", anchor: "calendario" },
      { label: "Sete locais fora", text: "Junkyard, Cloning Lab, Reflecting Pool e mais quatro, já desativados nas partidas em sala", anchor: "locais" },
      { label: "Torneios de treino", text: "semanais, sem nada em jogo, o próximo nesta semana", anchor: "treino" },
    ],
    faq: [
      {
        q: "O que o campeão da Crimson Cup ganha?",
        a: "Uma carta promo Dracula 1/1, dois cases de caixas de boosters e 1.500 dólares em dinheiro, segundo a imagem das recompensas que a Koin Games publicou em 5 de outubro de 2026. O segundo lugar ganha uma carta promo Dracula 1/8, um case e 750 dólares; o terceiro e o quarto, uma carta promo 1/8, duas caixas de boosters e 350 dólares.",
      },
      {
        q: "Quando são agora as classificatórias da Crimson Cup?",
        a: "Cinco classificatórias de 512 vagas cada: AMER em 19 de outubro às 19:00 EST, EMEA em 20 de outubro às 19:00 CEST, AMER em 21 de outubro às 21:00 EST, APAC em 22 de outubro às 19:00 SGT e EMEA em 22 de outubro às 19:00 CEST. De cada uma passam 32 jogadores, mais 96 wild cards, para os playoffs de 24 de outubro.",
      },
      {
        q: "Quais locais estão fora da Crimson Cup?",
        a: "Sete: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum e Nostradamus' Call, desativados porque dependem demais da sorte. As partidas em sala da demo já usam o pool do torneio.",
      },
    ],
    body: `## A premiação {#premios}

A premiação, nas palavras da equipe, "é dividida entre dinheiro, colecionáveis e cartas promo exclusivas". Todos que chegam ao top 256 têm direito ao primeiro lote de prêmios; as cartas promo começam no top 32. A imagem das recompensas anexada ao post traz a divisão:

| Colocação | Carta promo | Produto | Dinheiro |
|---|---|---|---|
| Campeão | Carta promo Dracula 1/1 | 2 cases de caixas de boosters | US$ 1.500 |
| 2º | Carta promo Dracula 1/8 | 1 case de caixas de boosters | US$ 750 |
| 3º e 4º | Carta promo Dracula 1/8 | 2 caixas de boosters | US$ 350 |
| Top 8 | Carta promo Dracula 1/8 | 1 caixa de boosters | US$ 125 |
| Top 16 | Carta Finalist Plus | 1 caixa de boosters | – |
| Top 32 | Carta Finalist | 10 pacotes | – |
| Top 64 | – | 8 pacotes | – |
| Top 128 | – | 4 pacotes | – |
| Top 256 | – | 2 pacotes | – |

A carta promo da imagem é um Dracula dourado com a inscrição "Tournament Winner", Myths & Legends #209, mostrado em um slab de gradação. A linha "prêmios no valor de 10.000 dólares" do anúncio de setembro continua na nova imagem do calendário. Os playoffs têm 256 vagas, então, pelos próprios números da Koin, quem passa por uma classificatória ou entra com uma wild card já leva para casa pelo menos dois pacotes.

## Mais duas classificatórias {#classificatorias}

"A pedido do público", a Koin acrescenta duas classificatórias durante o Steam Next Fest, uma para os fusos horários das Américas e uma para os da EMEA:

1. **AMER, segunda-feira, 19 de outubro, às 19:00 EST.**
2. **EMEA, quinta-feira, 22 de outubro, às 19:00 CEST**, que fecha as classificatórias.

Cada uma manda 32 jogadores para os playoffs, como as outras três. O pedido da equipe é o mesmo de setembro: inscreva-se só nos torneios em que você realmente pode estar presente e deixe as vagas para os outros jogadores. As inscrições são feitas no [Discord oficial](https://discord.gg/originstcg). O check-in funciona como antes: abre duas horas antes de cada classificatória e fecha cinco minutos antes do início, junto com a entrega dos decks ([as regras](/pt/news/crimson-cup-format-check-in#check-in)).

## O que muda no calendário {#calendario}

O post só fala das duas classificatórias novas, mas a imagem do calendário anexada a ele muda outros números também. As cinco classificatórias, com 512 vagas cada e 32 classificados em cada uma:

- AMER, 19 de outubro às 19:00 EST (nova);
- EMEA, 20 de outubro às 19:00 CEST;
- AMER, 21 de outubro às 21:00 EST: a imagem de setembro dizia 19:00 EST e 64 classificados, agora riscados;
- APAC, 22 de outubro às 19:00 SGT;
- EMEA, 22 de outubro às 19:00 CEST (nova).

As wild cards caem de 128 para 96: cinco vezes 32 mais 96 dá 256, o total dos playoffs. Playoffs e finais não mudam: playoffs em 24 de outubro às 10:00 EST (16:00 CEST, 22:00 SGT), quatro jogadores seguem para as finais de 25 de outubro às 10:00 EST. O torneio agora começa em 19 de outubro, o primeiro dia do Steam Next Fest, em vez do dia 20. Datas e horários, como sempre neste site, são os da imagem oficial, sem conversões nossas.

## Sete locais fora do torneio {#locais}

"Há alguns poucos locais em Origins que dependem muito da sorte", diz o post, então sete são desativados para o torneio: [Junkyard](/pt/locations#junkyard), [Cloning Lab](/pt/locations#cloning-lab), [Reflecting Pool](/pt/locations#reflecting-pool), [Amplifying Amphitheatre](/pt/locations#amplifying-amphitheatre), [Giant's Beacon](/pt/locations#giants-beacon), [The Colosseum](/pt/locations#the-colosseum) e [Nostradamus' Call](/pt/locations#nostradamus-call). O que cada um faz está na nossa página de [Locais](/pt/locations).

Este pool do torneio já está ativo na demo quando você joga partidas em sala (Create/Join Room Battle): é aí que dá para treinar com os locais da Crimson Cup. O pool foi introduzido pela [atualização do playtest de 1º de outubro](/pt/news/playtest-patch-notes-1001#pool-de-torneio), que ainda não dizia quais locais ficavam de fora.

## Torneios de treino {#treino}

Como a maioria das partidas da demo é contra bots, a Koin vai organizar torneios de treino semanais: nada em jogo, só um lugar para jogar contra pessoas de verdade e testar os seus decks. O próximo é nesta semana; o dia e o horário serão anunciados em breve, e a inscrição é no mesmo [Discord](https://discord.gg/originstcg). Se você quer organizar o seu com as regras da Crimson Cup, o [organizador de torneios](/pt/tournaments) do OriginsMeta tem check-in, listas ocultas e partidas melhor de três.

## O que isso significa para os jogadores {#o-que-significa}

- **Mais vagas e mais horários.** Cinco classificatórias em vez de três, duas em horário europeu e duas em horário americano: escolha a que você vai jogar de verdade.
- **Todos nos playoffs ganham alguma coisa.** Dois pacotes a partir do top 256, uma carta Finalist a partir do top 32, dinheiro a partir do top 8.
- **Monte os seus decks sem contar com os sete locais.** As cópias de Cloning Lab e Reflecting Pool não vão estar na Crimson Cup. O nosso [guia do Conquest](/pt/guides/origins-tcg-conquest) e o [Deck builder](/pt/deck-builder) ajudam com os três decks.

## O que ainda não sabemos {#o-que-nao-sabemos}

- O dia e o horário do torneio de treino desta semana.
- Se a linha Top 8 da imagem dos prêmios significa do 5º ao 8º lugar, um conjunto de prêmios para cada: é assim que a lemos.
- Por que a classificatória AMER de 21 de outubro está às 21:00 EST na imagem nova e às 19:00 EST na de setembro: o post não diz.
- Como são contadas as cartas únicas entre dois decks, uma questão ainda em aberto desde as [regras de 24 de setembro](/pt/news/crimson-cup-format-check-in#formato).

## De onde vem a informação {#fontes}

- O [post oficial no Steam](https://store.steampowered.com/news/app/4429430/view/1845383656394214) de 5 de outubro de 2026, "Prizepool announcement & key update to our biggest tournament ever", com as suas duas imagens: as recompensas e o calendário atualizado.
- O [anúncio de 9 de setembro](/pt/news/biggest-tournament-ever) e as [regras de 24 de setembro](/pt/news/crimson-cup-format-check-in), para os números que mudaram.`,
  },
};
