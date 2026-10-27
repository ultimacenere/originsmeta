import type { NewsCopy } from "./news-fr";

/**
 * Testi russi delle news (20/10/2026, russo settima lingua del sito), una voce per slug con gli stessi campi della
 * versione inglese di news.ts (`withTranslations` fa fallire la build se ne manca una o se i campi non coincidono).
 * Russo standard dando del вы, nomi delle carte in inglese, ancore traslitterate in latino, citazioni dei testi delle
 * carte uguali a quelli del gioco (card-lore-ru.ts, docs/testi-ufficiali/ru.tsv): regole e glossario in docs/russo.md.
 */
export const ruText: Record<string, NewsCopy> = {
  "kickstarter-alpha-edition-reward-tiers": {
    title: "Kickstarter Origins TCG: восемь уровней поддержки Alpha Edition, от 24 до 9 999 $",
    metaTitle: "Kickstarter Origins TCG: все восемь уровней поддержки",
    description:
      "Восемь уровней Kickstarter Alpha Edition Origins TCG, от 24 до 9 999 $: запечатанные бустеры, бустер-боксы и кейсы, Big Bob Commander и промо Golden Slab.",
    summary:
      "У Kickstarter Alpha Edition восемь уровней поддержки, от Worthy за 24 $ до Legend: Winnie-the-Pooh за 9 999 $. В каждый уровень входят Alpha Supporter Title и постоянный Collector Pass; начиная с Aspirant (99 $) появляются запечатанные бустер-боксы и кейсы, эксклюзивный для Kickstarter Big Bob Commander, а на уровнях выше — промо Golden Slab. Все награды цифровые.",
    highlights: [
      { label: "Восемь уровней, от 24 до 9 999 $", text: "от Alpha Booster Bundle на 6 бустеров до 30 запечатанных кейсов", anchor: "urovni" },
      { label: "Во всех уровнях", text: "Alpha Supporter Title и постоянный Collector Pass", anchor: "v-kazhdyy-uroven" },
      { label: "Эксклюзивы Kickstarter", text: "Big Bob Commander начиная с Aspirant, Golden Big Bob — начиная с Apprentice", anchor: "eksklyuzivy" },
      { label: "Промо и слэбы", text: "Alpha Alt Art Promo Box, Golden Slab с Van Helsing и Rapunzel, Winnie-the-Pooh на самом верху", anchor: "promo" },
      { label: "Всё цифровое", text: "Koin пишет это на каждом уровне: награды — цифровые товары", anchor: "tsifrovye" },
      { label: "Ещё нужно проверить", text: "кейсы в Myth и дату окончания кампании", anchor: "chego-my-poka-ne-znaem" },
    ],
    body: `## Восемь уровней, от 24 до 9 999 $ {#urovni}

У Kickstarter компании Koin Games для **Alpha Edition Myths and Legends** восемь уровней поддержки. От самого дешёвого до самого дорогого:

| Уровень | Цена | Запечатанная продукция | Бустеры |
| --- | --- | --- | --- |
| Worthy | 24 $ | 1 Alpha Booster Bundle | 6 |
| Aspirant | 99 $ | 1 Alpha Booster Box | 24 |
| Apprentice | 199 $ | 2 Alpha Booster Box | 48 |
| Hero | 499 $ | 1 Alpha Booster Box Case | 144 |
| Champion | 999 $ | 2 Alpha Booster Box Case | 288 |
| Icon | 2 499 $ | 6 Alpha Booster Box Case | 864 |
| Myth: Winnie-the-Pooh | 4 999 $ | запечатанные кейсы, см. ниже | см. ниже |
| Legend: Winnie-the-Pooh | 9 999 $ | 30 Alpha Booster Box Case | 4 320 |

Цены в долларах США. Изображения ниже — официальная графика Koin Games для каждого уровня. Названия уровней и наград остаются на английском, как их пишет Koin.

### Worthy, 24 $ {#worthy}

![Графика Koin Games для уровня Worthy, 24 $: запечатанный Alpha Booster Bundle на 6 бустеров и Collector Pass](/media/kickstarter/worthy.webp)

Точка входа: запечатанный **Alpha Booster Bundle** с 6 бустерами, **Alpha Supporter Title** и **постоянный Collector Pass** Origins TCG.

### Aspirant, 99 $ {#aspirant}

![Графика Koin Games для уровня Aspirant, 99 $: запечатанный бустер-бокс Alpha, эмоции Big Bob, Collector Pass, капсула Founder и Big Bob Commander](/media/kickstarter/aspirant.webp)

Запечатанный **Alpha Booster Box** на 24 бустера. К тому, что есть в Worthy, он добавляет **Founder Collector Capsule** (аватар, рубашка карт, одна эмоция Founder и один слэб Founder), эксклюзивный для Kickstarter **Big Bob Commander** и **Big Bob Emote Pack** с 3 эмоциями.

### Apprentice, 199 $ {#apprentice}

![Графика Koin Games для уровня Apprentice, 199 $: два запечатанных бустер-бокса Alpha, Big Bob Commander, Alpha Alt Art Promo Box, Collector Pass и Golden Big Bob Commander](/media/kickstarter/apprentice.webp)

Два запечатанных бустер-бокса, 48 бустеров. Добавляет эксклюзивный для Kickstarter **Golden Big Bob Commander**, **Golden Big Bob Emote Pack** и **Alpha Alt Art Promo Box**.

### Hero, 499 $ {#hero}

![Графика Koin Games для уровня Hero, 499 $: запечатанный кейс бустер-боксов, Alpha Alt Art Promo Box, Alpha Gameboard, оба Big Bob Commander и промо Golden Slab с Van Helsing](/media/kickstarter/hero.webp)

Запечатанный **Alpha Booster Box Case**, 144 бустера. Добавляет **Alpha Gameboard** и **Van Helsing Golden Slab Promo**.

### Champion, 999 $ {#champion}

![Графика Koin Games для уровня Champion, 999 $: два запечатанных кейса бустер-боксов и промо Golden Slab с Van Helsing и Rapunzel](/media/kickstarter/champion.webp)

Два запечатанных кейса, 288 бустеров, и **Golden Slab Promo с Van Helsing и Rapunzel**.

### Icon, 2 499 $ {#icon}

![Графика Koin Games для уровня Icon, 2 499 $: шесть запечатанных кейсов бустер-боксов, слэбы Van Helsing и Rapunzel и набор промо-слэбов Alternate Art](/media/kickstarter/icon.webp)

Шесть запечатанных кейсов, 864 бустера. Добавляет **Guaranteed Premium Alternate Art Promo Set**.

### Myth: Winnie-the-Pooh, 4 999 $ {#myth}

![Графика Koin Games для уровня Myth: Winnie-the-Pooh, 4 999 $: запечатанные кейсы бустер-боксов, набор промо Alternate Art и промо-слэб Winnie-the-Pooh с его золотой эмоцией](/media/kickstarter/myth.webp)

Первый уровень, названный в честь персонажа. Помимо всего, что есть в Icon, он добавляет **Golden Commander Skin**, **Golden Emote** и **Serialized Character Profile Promo**. Количество кейсов на графике и в её списке не совпадает: на изображении — ×13, в списке — «30 sealed Alpha Booster Box Case (4,320 Packs)», как в Legend.

### Legend: Winnie-the-Pooh, 9 999 $ {#legend}

![Графика Koin Games для уровня Legend: Winnie-the-Pooh, 9 999 $: тридцать запечатанных кейсов бустер-боксов и два промо-слэба Winnie-the-Pooh, один из них золотой](/media/kickstarter/legend.webp)

Самый высокий уровень: 30 запечатанных кейсов, 4 320 бустеров, всё, что есть в Myth, и **Serialized Signature Character Profile Promo**.

## Что входит в каждый уровень {#v-kazhdyy-uroven}

- **Во всех уровнях**, включая Worthy: **Alpha Supporter Title** и **постоянный Collector Pass** Origins TCG.
- **Начиная с Aspirant**: **Founder Collector Capsule** (аватар, рубашка карт, одна эмоция Founder, один слэб Founder), **Big Bob Commander** и его набор эмоций.
- **Начиная с Apprentice**: **Golden Big Bob Commander**, его набор эмоций и **Alpha Alt Art Promo Box**.
- **Начиная с Hero**: **Alpha Gameboard**.

## Эксклюзивы Kickstarter {#eksklyuzivy}

Koin помечает две награды как **Kickstarter Exclusive**: **Big Bob Commander** — во всех уровнях начиная с Aspirant, и **Golden Big Bob Commander** — начиная с Apprentice. У каждого свой набор из 3 эмоций.

## Промо и слэбы {#promo}

Старшие уровни добавляют промо, которые не выпадают из бустеров: **Alpha Alt Art Promo Box** начиная с Apprentice, **Golden Slab с Van Helsing** начиная с Hero, **Van Helsing и Rapunzel** начиная с Champion, **Guaranteed Premium Alternate Art Promo Set** начиная с Icon и нумерованные промо с **Winnie-the-Pooh** в Myth и Legend.

## Все награды цифровые {#tsifrovye}

На каждой графике стоит одна и та же строка от Koin: «All Kickstarter rewards are a digital product» — все награды Kickstarter являются цифровыми товарами. Бустеры, бустер-боксы и кейсы — это предметы инвентаря Steam, которые можно открыть, хранить запечатанными или обменивать, согласно официальной странице Koin, а Alpha Edition никогда не будет переиздана. Официальные шансы выпадения каждой редкости — на нашей [странице Kickstarter](/ru/kickstarter), а всё о кампании, с датами и источниками, — в нашем [гайде по Kickstarter](/ru/guides/origins-tcg-kickstarter).

## Как поддержать кампанию {#kak-podderzhat}

Наша [страница Kickstarter](/ru/kickstarter) коротко рассказывает об Alpha Edition, а её кнопка ведёт на кампанию по нашей реферальной ссылке: если вы поддержите кампанию оттуда, Koin Games заплатит OriginsMeta комиссию, а цена для вас останется той же. Если вы предварительно зарегистрировались как VIP, используйте VIP-ссылку, которую вам прислала Koin: ваша скидка 15% привязана к ней.

## Чего мы пока не знаем {#chego-my-poka-ne-znaem}

- Сколько кейсов в Myth: Winnie-the-Pooh: на графике — ×13, в её списке — 30.
- Когда заканчивается кампания и есть ли у каких-либо уровней ограниченное число мест.
- Когда награды появятся в вашем инвентаре Steam.`,
    faq: [
      {
        q: "Сколько стоит самый дешёвый уровень Kickstarter Origins TCG?",
        a: "Worthy, 24 $: запечатанный Alpha Booster Bundle на 6 бустеров, Alpha Supporter Title и постоянный Collector Pass Origins TCG.",
      },
      {
        q: "В какие уровни входит запечатанный бустер-бокс или кейс?",
        a: "В Aspirant (99 $) — один бустер-бокс на 24 бустера, в Apprentice (199 $) — два. Начиная с Hero (499 $) идут запечатанные кейсы: один в Hero, два в Champion, шесть в Icon и тридцать в Legend.",
      },
      {
        q: "Награды Kickstarter — физические товары?",
        a: "Нет. На графике каждого уровня Koin Games пишет, что все награды Kickstarter — цифровые товары.",
      },
    ],
  },
  "crimson-cup-coachcrono-wins": {
    title: "CoachCrono выиграл Crimson Cup по Origins TCG: трое итальянцев среди четырёх финалистов",
    metaTitle: "CoachCrono выиграл Crimson Cup по Origins TCG",
    description:
      "CoachCrono выиграл Crimson Cup по Origins TCG, пройдя через нижнюю сетку: трое итальянцев среди четырёх финалистов, их колоды и итоги турнира.",
    summary:
      "CoachCrono выиграл Crimson Cup, самый большой турнир Origins TCG на сегодняшний день: он поднялся из нижней сетки и обыграл SouL в гранд-финале, забрав промокарту Dracula 1/1. Трое из четырёх финалистов — итальянцы: CoachCrono, SouL и Felixnxx. Здесь — его путь к титулу, колоды финалов и итоги недели турнира.",
    highlights: [
      { label: "CoachCrono — чемпион", text: "из нижней сетки, 9:3 в день финалов, по данным официального поста", anchor: "chempion" },
      { label: "Трое итальянцев из четырёх", text: "CoachCrono, SouL и Felixnxx; четвёртый финалист — OrdinaryHarry", anchor: "italyantsy" },
      { label: "Одно поражение до гранд-финала", text: "от SouL, которого он потом и обыграл в матче за титул", anchor: "put-k-titulu" },
      { label: "Pigs во всех трио", text: "Three Not So Little Pigs у всех четверых, Van Helsing у троих", anchor: "kolody-finalov" },
      { label: "Неделя турнира", text: "пять квалификаций, плей-офф с двойным выбыванием и финалы в прямом эфире", anchor: "turnir" },
      { label: "Чего пока нет", text: "счёта гранд-финала и таблиц Koin по плей-офф и финалам", anchor: "chego-my-poka-ne-znaem" },
    ],
    body: `## CoachCrono — чемпион Crimson Cup {#chempion}

Поздравляем, Coach! В воскресенье, 25 октября, [CoachCrono](/ru/u/coachcrono) выиграл Crimson Cup — турнир, которым Koin Games завершила неделю Steam Next Fest. Об этом объявил apix из Koin Games на официальном Discord («Congrats to @CoachCrono for winning our Origins Crimson Cup»), а официальный пост Origins TCG в X подводит итог так: он пришёл из нижней сетки и за день набрал 9:3 («going 9-3 today»).

Приз — тот, что на официальной графике победителя: промокарта Dracula 1/1, два кейса бустер-боксов и 1500 долларов. CoachCrono также Creator на OriginsMeta: его каналы и колоды — в его профиле.

## Трое итальянцев среди четырёх финалистов {#italyantsy}

До финалов дошли четверо, и трое из них — итальянцы: CoachCrono, SouL и Felixnxx. Четвёртый — OrdinaryHarry. В турнире, открытом для всех, с квалификациями в Америке, Европе и Азии, это огромный результат для итальянской сцены Origins TCG.

Итоговые места — по сетке плей-офф на Tourney Bot и объявлению Koin:

1. CoachCrono
2. SouL
3. Felixnxx
4. OrdinaryHarry

## Как он дошёл до титула {#put-k-titulu}

Плей-офф в субботу, 24 октября, шёл по системе двойного выбывания, матчи best-of-three: после первого поражения игрок переходит в нижнюю сетку, после второго выбывает. CoachCrono выиграл первые шесть матчей в верхней сетке, в том числе против agraveinstream, ещё одного креатора OriginsMeta, и остановился в полуфинале верхней сетки против SouL — 0:2. После этого он больше не проигрывал: 2:1 против eotboltyou, чтобы попасть в последнюю четвёрку, затем в финалах 2:0 против OrdinaryHarry, 2:0 против Felixnxx и выигранный гранд-финал против SouL, который до этого не проиграл ни одного матча.

С другой стороны сетки SouL прошёл верхнюю сетку без поражений и в её финале обыграл Felixnxx 2:1. Felixnxx до этого победил OrdinaryHarry 2:1 во втором полуфинале. Весь путь, матч за матчем, — в нашей [сетке плей-офф](/ru/analytics/crimson-cup/playoffs).

## Колоды финалов {#kolody-finalov}

Koin опубликовала списки четырёх финалистов в день финалов: начиная с топ-4 списки колод становятся публичными, как сказано в правилах. Победное трио CoachCrono:

- [Three Not So Little Pigs](/ru/cards/three-not-so-little-pigs): Bullseye, Glinda, Golden Egg, Guy of Gisborne, Mind Palace, Mummy, Obliterate, Reinforcements, Sandman, Stroke of Midnight, Three Blind Mice, Trash for Treasure;
- [Van Helsing](/ru/cards/van-helsing): Ali Baba, Baby Bear, Bridge Troll, Dark Omen, First Aid, Forbidden Knowledge, Phuong Hoang, Puck, Searing Light, Shahrazad, Spellbook, Tin Woodman;
- [Legion of the Dead](/ru/cards/legion-of-the-dead): Asanbosam, Baby Bear, Boogeyman, Bridge Troll, Dark Omen, En Passant, Golden Egg, Morgiana, Mummy, Obliterate, Paul Bunyan, Trash for Treasure.

Трио остальных: SouL взял Merlin, Mulan и Three Not So Little Pigs; Felixnxx — Van Helsing, Legion of the Dead и Three Not So Little Pigs; OrdinaryHarry — Mulan, Van Helsing и Three Not So Little Pigs.

Несколько цифр по 12 спискам. Three Not So Little Pigs есть в трио у всех четверых, Van Helsing — у троих, Legion of the Dead и [Mulan](/ru/cards/mulan) — у двоих, [Merlin](/ru/cards/merlin) — у одного: остальные шесть Легендарных карт до финалов не дошли. [Baby Bear](/ru/cards/baby-bear) — самая частая карта (7 колод из 12), за ней Golden Egg, Mind Palace, Obliterate и Tin Woodman (по 6). Полные списки с кодом игры и ссылкой на конструктор колод — на нашей [странице Crimson Cup](/ru/analytics/crimson-cup#finals).

## Турнир вкратце {#turnir}

Crimson Cup — самый большой турнир в истории Koin Games, как назвал его apix: пять квалификаций, открытых для всех, с 19 по 22 октября (AMER #1, EMEA #1, AMER #2, APAC и EMEA #2), по 32 игрока из каждой плюс 96 wild card, плей-офф на 256 мест 24 октября и финалы 25 октября, всё в прямом эфире. Формат — Conquest: три колоды, не меньше 8 уникальных карт между каждой парой колод, фаза банов и списки колод, скрытые до топ-4. Призы — на 10 000 долларов в общей сложности. Подробно правила описаны в нашей статье о [правилах Crimson Cup](/ru/news/crimson-cup-format-check-in).

В четырёх квалификациях с официальными таблицами Koin чаще всех неизменно банили Van Helsing (от 44,4% в AMER #1 до 55,1% в EMEA #2), чаще всех брали Three Not So Little Pigs, а самой популярной картой была Baby Bear. Финалы показали ту же мету: Pigs во всех трио, Van Helsing в трёх, Baby Bear в семи колодах из двенадцати. Все цифры квалификаций — на нашей [странице Crimson Cup](/ru/analytics/crimson-cup).

## Чего мы пока не знаем {#chego-my-poka-ne-znaem}

- Счёт гранд-финала: на Tourney Bot у него нет результата, и Koin его не публиковала; официальный пост называет только 9:3 за день.
- Таблицы плей-офф и финалов (баны, взятые колоды, самые популярные карты): после квалификаций Koin публиковала их на официальном Discord, а по плей-офф и финалам — пока нет. Когда они появятся, мы добавим их на нашу страницу Crimson Cup.`,
    faq: [
      {
        q: "Кто выиграл Crimson Cup по Origins TCG?",
        a: "CoachCrono, 25 октября 2026: он поднялся из нижней сетки и обыграл SouL в гранд-финале. Об этом объявили Koin Games на официальном Discord и Origins TCG в X.",
      },
      {
        q: "С какими колодами CoachCrono выиграл Crimson Cup?",
        a: "Three Not So Little Pigs, Van Helsing и Legion of the Dead, в формате Conquest. Все три полных списка с кодом игры — на странице Crimson Cup на OriginsMeta.",
      },
      {
        q: "Кто вышел в финалы Crimson Cup?",
        a: "CoachCrono (первое место), SouL (второе), Felixnxx (третье) и OrdinaryHarry (четвёртое). Трое из четырёх — итальянцы: CoachCrono, SouL и Felixnxx.",
      },
      {
        q: "Что выиграл CoachCrono?",
        a: "Промокарту Dracula 1/1, два кейса бустер-боксов и 1500 долларов, по официальной графике победителя.",
      },
    ],
  },
  "crimson-cup-meta-report-emea-1-amer-2": {
    title: "Meta Report Crimson Cup: Van Helsing по-прежнему банят чаще всех, King Arthur разделяет Европу и Америку",
    metaTitle: "Crimson Cup в Origins TCG: цифры EMEA #1 и AMER #2",
    description:
      "Crimson Cup по Origins TCG, EMEA #1 и AMER #2 в цифрах Koin: Van Helsing в бане в 51,1% и 48,4% случаев, King Arthur — 6,3% в Европе и 24% в Америке.",
    summary:
      "Koin Games опубликовала официальные цифры ещё двух квалификаций Crimson Cup, EMEA #1 и AMER #2. Van Helsing снова самая забаненная Легендарная карта (51,1% и 48,4%), Three Not So Little Pigs снова берут чаще всех, а Baby Bear снова самая популярная карта. Новость — King Arthur: в Европе её банили в 6,3% случаев, в Америке — в 24%. Наша страница Crimson Cup теперь показывает все квалификации рядом.",
    highlights: [
      { label: "Van Helsing банят везде", text: "чаще всех во всех трёх квалификациях: 51,1% в EMEA #1 и 48,4% в AMER #2", anchor: "bany" },
      { label: "King Arthur разделяет регионы", text: "6,3% банов в Европе, 22,7% и 24% в двух американских квалификациях", anchor: "king-arthur" },
      { label: "Robin Hood теперь боятся", text: "от 11,8% в AMER #1 почти до одного бана из пяти", anchor: "robin-hood" },
      { label: "Pigs снова берут чаще всех", text: "около четверти колод, и с каждым разом её банят немного чаще", anchor: "berut" },
      { label: "Baby Bear первая во всех трёх", text: "50,1% и 46,1%; Bagheera и Stroke of Midnight входят в топ-20", anchor: "karty" },
      { label: "Все квалификации рядом", text: "новый раздел нашей страницы Crimson Cup", anchor: "stranitsa" },
    ],
    body: `## Ещё две квалификации, те же таблицы {#tsifry}

После EMEA #1 (20 октября) и AMER #2 (21 октября) Koin Games выложила на своём официальном Discord те же две таблицы, что и после первой квалификации: фазу банов каждой Легендарной карты и 20 самых популярных карт в поданных колодах. Когда позади три квалификации из пяти, цифры уже можно сравнивать: что держится от квалификации к квалификации и что меняется между Европой и Америкой. О первой, AMER #1, — наш [Meta Report от 20 октября](/ru/news/crimson-cup-meta-report-amer-1).

## Van Helsing первая, Merlin вторая — три раза из трёх {#bany}

Бан-рейт — это сколько раз Легендарную карту забанили из всех случаев, когда соперник встретил её на этапе банов (списки колод скрыты до топ-4, поэтому на этапе банов видны только Легендарные карты: [правила](/ru/news/crimson-cup-format-check-in#spiski-kolod-skryty)).

| Легендарная | AMER #1 | EMEA #1 | AMER #2 |
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

Van Helsing забанили 139 раз из 272 в EMEA #1 и 90 раз из 186 в AMER #2: в Европе — чаще, чем в каждом втором случае. Merlin — вторая во всех трёх квалификациях, хотя она есть меньше чем в каждой десятой колоде. Dorothy и Wicked Stepmother встречали на этапе банов меньше 30 раз за квалификацию (Dorothy — 9 раз в AMER #2): их цифры сильно скачут и мало что говорят.

## King Arthur: в Америке банят, в Европе почти никогда {#king-arthur}

Самая большая разница между квалификациями — у King Arthur: 15 банов из 66 в AMER #1 (22,7%), 4 из 63 в EMEA #1 (6,3%) и 18 из 75 в AMER #2 (24,0%). Выборки похожи, так что это не шум: в двух американских квалификациях игроки банили её примерно в каждом четвёртом случае, в Европе — почти никогда. У Queen of Hearts разница меньше, но в ту же сторону (21,0% и 12,0% в Америке, 8,0% в Европе). Наше прочтение: в Америке колоду King Arthur боятся больше; EMEA #2 покажет, видят ли её в Европе иначе.

## Robin Hood уже не та, кого боятся меньше всех {#robin-hood}

После AMER #1 Robin Hood была самой редко банимой из Легендарных карт, которых видели хотя бы 30 раз (11,8%). В двух следующих квалификациях её банили почти в каждом пятом случае: 20 раз из 102 в EMEA #1 и 8 из 43 в AMER #2. Теперь меньше всех боятся других: King Arthur в Европе (6,3%), Dracula (9,2%) и Legion of the Dead (10,6%) в AMER #2. Legion банят с каждым разом реже (19,2%, 15,4%, 10,6%), хотя она по-прежнему есть примерно в каждой десятой колоде.

## Pigs: чаще всех берут и с каждым разом чуть чаще банят {#berut}

Доля колод из таблицы Koin с каждой Легендарной картой:

| Легендарная | AMER #1 | EMEA #1 | AMER #2 |
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

Three Not So Little Pigs есть почти в каждой четвёртой колоде на каждой квалификации (216 колод в EMEA #1, 214 в AMER #2), и её бан-рейт растёт с каждым разом: 32,8%, 34,9%, 36,1%. Вместе Pigs и Van Helsing есть больше чем в четырёх колодах из десяти. Порядок остальных почти не меняется: мета турнира стабильна.

## Карты: первая Baby Bear, 15 карт всегда в топ-20 {#karty}

Доля всех поданных колод, в которых есть карта, в том виде, как её публикует Koin, в порядке AMER #2. Прочерк значит, что карты нет в топ-20 этой квалификации: это не ноль, и мы её не оцениваем.

| # | Карта | AMER #2 | EMEA #1 | AMER #1 |
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

Baby Bear — самая популярная карта во всех трёх квалификациях, в Европе она есть в половине колод (50,1%). Spellbook стоит на месте (32,4%, 32,5%, 32,5%). Пятнадцать карт входят в топ-20 каждой квалификации. Bagheera и Stroke of Midnight попали в него в EMEA #1 и остались в AMER #2; в топ-20 EMEA #1 были также Obliterate (23,8%), Jekyll (21,2%) и Reinforcements (21,0%), которых нет в таблице AMER #2.

## Что это значит для APAC и EMEA #2 {#chto-eto-znachit}

Две последние квалификации, APAC и EMEA #2, проходят 22 октября. Наше прочтение:

- Van Helsing и Merlin банят почти в каждом втором случае везде: тому, кто их берёт, стоит готовиться играть двумя другими колодами;
- Pigs — Легендарная карта, которую берут чаще всех и с каждым разом банят всё чаще: чем чаще её берут, тем больше банов она притягивает;
- в Европе King Arthur до сих пор почти не банили: если EMEA #2 это подтвердит, там это Легендарная карта с наибольшими шансами остаться на столе.

## Все квалификации рядом {#stranitsa}

На нашей [странице Crimson Cup](/ru/analytics/crimson-cup) появился новый раздел — [сравнение квалификаций](/ru/analytics/crimson-cup#across): бан-рейт, взятые колоды и самые популярные карты с отдельным столбцом для каждой квалификации, столбцом «Вместе» и изменением от одной квалификации к следующей. Страница каждой квалификации осталась прежней, со сравнением с ладдером; страницы карт, например [King Arthur](/ru/cards/king-arthur) и [Baby Bear](/ru/cards/baby-bear), показывают цифры последней квалификации.

## Откуда эти цифры {#istochniki}

- Таблицы, которые Koin Games опубликовала на [официальном Discord](https://discord.gg/originstcg) после EMEA #1 (прочитаны 21 октября 2026) и после AMER #2 (прочитаны 22 октября 2026).
- По AMER #1 — таблицы, прочитанные 20 октября 2026, в нашем [первом Meta Report](/ru/news/crimson-cup-meta-report-amer-1).`,
    faq: [
      {
        q: "Какую Легендарную карту чаще всех банят в Crimson Cup?",
        a: "Van Helsing — во всех трёх квалификациях с официальными цифрами: 44,4% в AMER #1, 51,1% в EMEA #1 и 48,4% в AMER #2, по данным Koin Games. Merlin каждый раз вторая (42,2%, 48,6%, 47,5%).",
      },
      {
        q: "Отличается ли мета Crimson Cup в Европе и в Америке?",
        a: "В основном нет: банят и берут те же Легендарные карты, а Baby Bear — самая популярная карта везде. Исключение — King Arthur: в EMEA #1 её банили в 6,3% случаев против 22,7% и 24,0% в двух американских квалификациях.",
      },
      {
        q: "Где посмотреть цифры каждой квалификации Crimson Cup?",
        a: "На нашей странице Crimson Cup в Analytics: по вкладке на каждую квалификацию, с таблицами Koin и сравнением с ладдером, и раздел, где все квалификации стоят рядом.",
      },
    ],
  },
  "crimson-cup-meta-report-amer-1": {
    title: "Meta Report Crimson Cup: в AMER #1 чаще всех банили Van Helsing, а чаще всех брали Pigs",
    metaTitle: "Meta Report Crimson Cup по Origins TCG: баны AMER #1",
    description:
      "Crimson Cup по Origins TCG, AMER #1 в официальных цифрах Koin: Van Helsing в бане в 44,4% случаев, Pigs в 168 колодах, Baby Bear в 47,2% колод.",
    summary:
      "Koin Games опубликовала первые официальные цифры Crimson Cup — по квалификации AMER #1: какие Легендарные карты банили, какие игроки брали с собой и какие карты играли чаще всего. Van Helsing банили чаще всех (44,4%), Three Not So Little Pigs брали чаще всех (168 колод), а Baby Bear есть в 47,2% колод. Все цифры, квалификация за квалификацией и рядом с ладдером, — на нашей новой странице Crimson Cup.",
    highlights: [
      { label: "Van Helsing, которую банят", text: "в бане в 44,4% случаев, когда её видели; сразу за ней Merlin с 42,2%", anchor: "bany" },
      { label: "Pigs берут чаще всех", text: "168 колод, 23,3% заявленных, и всё равно 32,8% банов", anchor: "chashche-vsekh" },
      { label: "Robin Hood боятся меньше всех", text: "всего 11,8% банов, хотя в ладдере это одна из сильнейших", anchor: "robin-hood" },
      { label: "Baby Bear почти в половине колод", text: "47,2%, за ней Roo, Spellbook и Mind Palace", anchor: "karty" },
      { label: "Турнир против ладдера", text: "Pigs и Van Helsing берут чаще, чем играют, у Legion наоборот", anchor: "ladder" },
      { label: "Страница для Crimson Cup", text: "цифры Koin по каждой квалификации — в Analytics и на страницах карт", anchor: "stranitsa" },
    ],
    body: `## Цифры, которые опубликовала Koin {#tsifry}

После первой квалификации Crimson Cup, AMER #1 19 октября, Koin Games выложила на своём официальном Discord две таблицы: фазу банов каждой Легендарной карты и самые популярные карты в заявленных колодах. Это итоговые цифры: списки колод скрыты до топ-4 ([правила](/ru/news/crimson-cup-format-check-in#spiski-kolod-skryty)), поэтому отдельных списков в них нет, зато видно, чего игроки боялись и на что полагались. Мы собрали их рядом с ладдером на новой странице: [цифры Crimson Cup](/ru/analytics/crimson-cup).

## Баны: первая Van Helsing, сразу за ней Merlin {#bany}

В Crimson Cup вы видите только три Легендарные карты соперника, а затем баните одну из его колод. Доля банов показывает, сколько раз Легендарную карту забанили из всех случаев, когда соперник встретил её на этапе бана.

| Легендарная | Доля банов | Бан / видели | Колоды | Дальний раунд |
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

Van Helsing банили почти в каждом втором случае. Неожиданность — Merlin: её брали гораздо реже (71 колода), но когда она появлялась, её банили в 42,2% случаев, хотя в ладдере она выигрывает 48,1%. У десяти Легендарных из одиннадцати была колода в 4-м раунде, раунде 32 квалифицированных: только Wicked Stepmother остановилась на 3-м.

## Pigs берут чаще всех {#chashche-vsekh}

Three Not So Little Pigs есть в 168 колодах, это 23,3% колод из таблицы Koin: почти каждая четвёртая колода, больше, чем у любой другой Легендарной. При этом её банят в 32,8% случаев, так что тому, кто её берёт, часто приходится побеждать двумя другими колодами. Дальше идёт Van Helsing со 135 колодами (18,7%), затем Merlin (71) и Legion of the Dead (67); в самом низу Dorothy (23) и Wicked Stepmother (11).

## Robin Hood боятся меньше всех {#robin-hood}

Robin Hood — самая редко банимая из Легендарных, которых видели хотя бы 30 раз: 8 банов из 68, 11,8%. При этом в ладдере это одна из трёх сильнейших: она выигрывает 60,6%, рядом с Pigs (60,7%) и Van Helsing (59,8%), а в нашем [Meta Report от 19 октября](/ru/news/meta-report-2026-10-19#treugolnik) именно она побеждала Van Helsing. На турнир её брали реже (52 колоды, 7,2%) и почти никогда не банили. Наше прочтение: сейчас это Легендарная, которая чаще всех остаётся на столе.

## Карты почти в половине колод {#karty}

Доля всех заявленных колод, в которых есть карта, в том виде, как её опубликовала Koin: здесь считаются все, кто записался, а не только те, кто сыграл матч.

| # | Карта | Доля колод | Колоды |
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

Baby Bear и в ладдере была самой популярной картой патча 0.7, а на турнире она есть почти в половине колод. Koin публикует топ-20: остальных карт в таблице нет, и мы их не оцениваем.

## Турнир против ладдера {#ladder}

Если сравнить с ладдером, то есть с матчами, записанными через OriginsMeta Tracker на патче 0.7 (данные на 20 октября), разница показывает, на что игроки полагаются, когда ставки высоки:

- **Pigs и Van Helsing** на турнир берут чаще, чем их играют в ладдере: 23,3% колод против 17,4% появлений в ладдере и 18,7% против 13,2%.
- **Legion of the Dead** — наоборот: 15,3% в ладдере и 9,3% турнирных колод; Dracula — 10,6% против 7,4%.
- Среди карт сильнее всего проседают **Obliterate** (34,9% в ладдере, 20,9% на турнире), **Golden Egg** и **Mummy**; растут **Shahrazad** и **Scarecrow**. Это разные измерения (заявленные колоды и записанные партии), поэтому сравнивайте карты скорее друг с другом, чем по отдельной разнице.

## Что это значит для следующих квалификаций {#sleduyushchie-kvalifikatsii}

Наше прочтение для EMEA #1, AMER #2, APAC и EMEA #2:

- взять Van Helsing или Pigs — значит ждать бана, для Van Helsing почти в каждом втором случае: третья колода значит столько же, сколько первые две;
- Robin Hood банят редко, а в ладдере она побеждает Van Helsing: это Легендарная, у которой больше всех шансов остаться на столе;
- Merlin собирает баны намного чаще, чем подсказывают её результаты в ладдере: в трио она может отвести бан от двух других ваших колод.

## Страница для Crimson Cup {#stranitsa}

С сегодняшнего дня в Analytics есть [страница Crimson Cup](/ru/analytics/crimson-cup) с официальными цифрами Koin по каждой квалификации: доля банов, колоды, самые популярные карты и сравнение с ладдером. Страницы Легендарных и самых популярных карт тоже показывают свои цифры Crimson Cup, например [Van Helsing](/ru/cards/van-helsing) и [Baby Bear](/ru/cards/baby-bear). Каждую квалификацию мы добавляем, когда Koin публикует её цифры.

## Источники {#istochniki}

- Таблицы, которые Koin Games опубликовала на [официальном Discord](https://discord.gg/originstcg) после квалификации AMER #1, прочитаны 20 октября 2026.
- Ладдер: матчи, записанные через OriginsMeta Tracker на патче 0.7, обычные и рейтинговые вместе, по данным нашей [страницы Crimson Cup](/ru/analytics/crimson-cup) на 20 октября 2026.`,
    faq: [
      {
        q: "Какую Легендарную карту чаще всех банили в Crimson Cup?",
        a: "Van Helsing: в квалификации AMER #1 19 октября 2026 соперники забанили её 96 раз из 216 (44,4%), по официальным цифрам Koin Games. За ней идут Merlin с 42,2% и Three Not So Little Pigs с 32,8%.",
      },
      {
        q: "Какие карты чаще всего играют в Crimson Cup?",
        a: "Baby Bear — она есть в 47,2% колод, заявленных на AMER #1, затем Roo (33,7%), Spellbook (32,4%), Mind Palace (31,7%) и Golden Egg (30,2%). Koin публикует топ-20.",
      },
      {
        q: "Списки колод Crimson Cup публичные?",
        a: "Пока нет: они скрыты до топ-4. Koin публикует итоговые цифры (баны, Легендарные и самые популярные карты), а мы собираем их по каждой квалификации на нашей странице Crimson Cup в Analytics.",
      },
    ],
  },
  "meta-report-2026-10-19": {
    title: "Meta Report, 19 октября: Pigs, Van Helsing и Robin Hood на вершине патча 0.7 к старту Crimson Cup",
    metaTitle: "Meta Report Origins TCG, 19 октября: мета 0.7",
    description:
      "Мета Origins TCG на 19 октября по 2 478 матчам: треугольник Pigs, Van Helsing и Robin Hood, лучшие архетипы и карты и что это значит для Conquest.",
    summary:
      "Наш первый Meta Report, который будет выходить каждый понедельник: состояние патча 0.7 по 2 478 матчам, записанным через OriginsMeta Tracker, в день старта квалификаций Crimson Cup. Три Легендарные карты выигрывают около 60% и побеждают друг друга по кругу, Control — самый популярный архетип, а Discard выигрывает чаще всех; патча баланса до турнира не будет.",
    highlights: [
      { label: "Три Легендарные наверху", text: "Pigs 61,2%, Van Helsing 61,0%, Robin Hood 59,9%", anchor: "tri-legendarnye" },
      { label: "Треугольник, а не король", text: "Van Helsing бьёт Pigs, Pigs бьёт Robin Hood, Robin Hood бьёт Van Helsing", anchor: "treugolnik" },
      { label: "Dracula и Legion, два измерения", text: "ниже 50%, если считать обе стороны, и намного выше у тех, кто их записывает", anchor: "dva-izmereniya" },
      { label: "Архетипы и карты", text: "Control играют чаще всех, Discard и Swarm выигрывают чаще всех, Obliterate завершает партии", anchor: "arkhetipy" },
      { label: "Никакого патча до Crimson Cup", text: "и что цифры значат для ваших трёх колод Conquest", anchor: "crimson-cup" },
    ],
    body: `## Что такое Meta Report {#meta-report}

С сегодняшнего дня каждый понедельник мы смотрим, как меняется мета Origins TCG: какие Легендарные карты побеждают, какие архетипы и карты набирают силу и что меняют патчи. Цифры берутся с нашей [страницы Analytics](/ru/analytics), построенной на матчах, которые игроки записывают через [OriginsMeta Tracker](/ru/tracker); выводы — наши, сделанные с учётом того, что мы знаем об игре.

Это нулевой выпуск, точка отсчёта: патч 0.7, записано **2 478 матчей**, обычные и рейтинговые вместе. В следующий понедельник мы сравним новые данные с этими.

## Три Легендарные наверху {#tri-legendarnye}

| Легендарная | Винрейт | Матчи |
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

Здесь учитываются обе стороны каждого матча, поэтому среднее значение — 50%. Pigs, Van Helsing и Robin Hood остаются выше 50% даже по нижней границе вероятного диапазона; Queen of Hearts — ровно на черте. Внизу две карты, которые Koin усилила 21 сентября, Wicked Stepmother и Dorothy, по-прежнему не вытягивают свои колоды. Всё о каждой Легендарной — в нашем [гайде по Легендарным картам](/ru/guides/origins-tcg-legendaries).

## Треугольник, а не король {#treugolnik}

Три лидера не доминируют друг над другом, а побеждают друг друга по кругу:

- **Van Helsing бьёт Pigs** — 56% матчей между ними;
- **Pigs бьёт Robin Hood** — 54% (28–33 со стороны Robin Hood в 61 матче);
- **Robin Hood бьёт Van Helsing** — 55%.

Кроме того, у Robin Hood самый перекошенный матчап патча: **26 побед из 30 против Dracula**. Наше прочтение: нет одной лучшей колоды, которую стоит скопировать, есть круг, из которого нужно выбирать, и в формате с тремя колодами это очень важно.

## Dracula и Legion: два измерения, которые не сходятся {#dva-izmereniya}

Dracula (43,3%) и Legion of the Dead (43,6%) — среди самых популярных и, если считать обе стороны, ниже 50%. Но если смотреть только на колоды тех, кто записывает свои матчи, эти же две Легендарные выигрывают намного чаще: 18 октября с этой стороны у Dracula было 75,9%, а у Legion — 74,0%. До версии 0.4.7 от 14 октября Tracker записывал и матчи против ботов, а Dracula — босс миссий демо: часть этих «поражений Dracula», вероятно, приходилась на ботов. Пока мы не очистили выборку, ни одно из двух измерений нельзя читать в отрыве от другого, и называть эти две колоды слабыми мы не будем.

## Архетипы и карты {#arkhetipy}

Архетипы и карты учитывают только колоды тех, кто записывает матчи, а они выигрывают 66,0% своих матчей: сравнивайте их друг с другом, а не с 50%.

- **Control** — самый популярный архетип (38% матчей), выигрывает 66,7%, ровно в среднем.
- **Discard** (75,7%, 210 матчей) и **Swarm** (75,6%, 127) выигрывают чаще всех; **Midrange** (63,1%, 33% матчей) и **Combo** (61,4%) — ниже.
- **Baby Bear** есть в 53% записанных колод: самая популярная карта патча.
- **Obliterate**, когда её разыгрывают, выигрывает в 87,3% случаев, примерно на 8-м раунде: это карта, которая завершает партии.
- **Wicked Stepsisters** поднимается с 26,7% в колоде до 64,5%, когда её разыгрывают: это ситуативная карта, которая побеждает, когда находит свой момент, а не слабая карта.

## Патчи: ничего нового до Crimson Cup {#patchi}

Патч 0.7 от 29 сентября — последний патч баланса перед турниром, а [демо 0.7.1 от 15 октября](/ru/news/demo-patch-notes-0-7-1) принесло рейтинговый режим, но без изменений баланса, поэтому его матчи считаются как 0.7. На своём AMA 2 октября Koin сказала, что карты до Crimson Cup трогать не будут: если всплывёт что-то серьёзное, это забанят. Значит, мета, которую мы здесь описываем, — это мета турнира.

## Что это значит для Crimson Cup {#crimson-cup}

Наше прочтение для тех, кто везёт три колоды в [Conquest](/ru/guides/origins-tcg-conquest), где соперник банит одну:

- две колоды из треугольника — надёжная основа, но какую бы пару вы ни взяли, одна из трёх бьёт одну из ваших;
- третья колода закрывает эту дыру: против Pigs — Van Helsing, против Van Helsing — Robin Hood;
- бан — самое весомое решение: ищите ту колоду соперника, которая бьёт две ваши, а не самую сильную вообще.

Расписание квалификаций и где их смотреть — в [сегодняшней статье](/ru/news/crimson-cup-qualifiers-where-to-watch).

## Как мы читаем цифры {#kak-my-chitaem}

- Источник: матчи, записанные через OriginsMeta Tracker на патче 0.7, обычные и рейтинговые вместе; данные на 19 октября 2026.
- Легендарные и матчапы учитывают обоих игроков; колоды, архетипы и карты — только тех, кто записывает.
- Рейтинги построены на осторожном винрейте, нижней границе вероятного диапазона, поэтому 300 матчей весят больше, чем 30.
- Все цифры — на [странице Analytics](/ru/analytics), она обновляется каждые пять минут. Если вы играете, записывайте свои матчи: чем их больше, тем точнее отчёт следующего понедельника.`,
    faq: [
      {
        q: "Какая Легендарная карта сейчас сильнейшая в Origins TCG?",
        a: "На 19 октября 2026, на патче 0.7, три Легендарные карты выигрывают около 60%, если считать обе стороны каждого матча: Three Not So Little Pigs (61,2%), Van Helsing (61,0%) и Robin Hood (59,9%). Они побеждают друг друга по кругу, так что ни одна из них не лучшая против всех.",
      },
      {
        q: "Откуда берутся цифры Meta Report?",
        a: "Из матчей, которые игроки записывают через OriginsMeta Tracker, наше приложение для Windows; они показаны на странице OriginsMeta Analytics. Легендарные и матчапы учитывают обоих игроков; колоды, архетипы и карты — только тех, кто записывает.",
      },
      {
        q: "Будет ли патч баланса до Crimson Cup?",
        a: "Нет. Патч 0.7 от 29 сентября 2026 — последний патч баланса перед турниром, и Koin сказала, что до Crimson Cup карты трогать не будут: карту с серьёзной проблемой вместо этого забанят.",
      },
    ],
  },
  "crimson-cup-qualifiers-where-to-watch": {
    title: "Квалификации Crimson Cup: даты и время, где смотреть и Broadcasting OM для стримеров",
    metaTitle: "Квалификации Crimson Cup Origins TCG: где смотреть",
    description:
      "Квалификации Crimson Cup по Origins TCG с 19 по 22 октября: даты, время и чек-ин, где смотреть на Twitch и Broadcasting OM, наш бесплатный оверлей.",
    summary:
      "Crimson Cup стартует сегодня вечером, 19 октября, квалификацией AMER в 19:00 EST: пять квалификаций до 22 октября, затем плей-офф 24-го и финал 25-го. Koin Games транслирует каждое событие на своём официальном канале Twitch, который во время эфира появляется и на главной странице OriginsMeta, а совместные трансляции может вести любой. Для тех, кто их ведёт, мы сделали Broadcasting OM: бесплатный оверлей для OBS с никами, счётом, тремя колодами и картами, оставшимися в каждом списке.",
    highlights: [
      { label: "Пять квалификаций, с 19 по 22 октября", text: "первая — AMER сегодня в 19:00 EST, последняя — EMEA в четверг в 19:00 CEST", anchor: "raspisanie" },
      { label: "Чек-ин и регистрация", text: "чек-ин открывается за два часа и закрывается за пять минут до старта, вместе с колодами", anchor: "chek-in" },
      { label: "Где смотреть", text: "официальный канал Koin на Twitch, на нашей главной во время эфира, и совместные трансляции креаторов", anchor: "gde-smotret" },
      { label: "Broadcasting OM", text: "наш бесплатный оверлей для трансляции матча: ники, счёт, три колоды, оставшиеся карты, спонсоры", anchor: "broadcasting-om" },
      { label: "Настройка в OBS", text: "панель управления и источник «Браузер» за пять минут", anchor: "obs" },
    ],
    body: `## Расписание квалификаций {#raspisanie}

Crimson Cup, турнир Koin Games к Steam Next Fest, стартует сегодня вечером. Квалификаций пять, в каждой 512 мест, они открыты для всех, где бы вы ни жили, и из каждой проходят 32 игрока:

| День | Официальное время | Регион |
|---|---|---|
| Понедельник, 19 октября | 19:00 EST | AMER (добавлена 5 октября) |
| Вторник, 20 октября | 19:00 CEST | EMEA |
| Среда, 21 октября | 21:00 EST | AMER |
| Четверг, 22 октября | 19:00 SGT | APAC |
| Четверг, 22 октября | 19:00 CEST | EMEA (добавлена 5 октября, завершает квалификации) |

К 160 квалифицированным игрокам добавляются 96 wild card: 256 игроков в **плей-офф в субботу, 24 октября, в 10:00 EST** (16:00 CEST, 22:00 SGT), и четверо из них выходят в **финал в воскресенье, 25 октября, в 10:00 EST**. Время указано по официальной графике Koin, без наших пересчётов. Призовой фонд с промокартой Dracula 1/1 — в нашей [статье о призах и квалификациях](/ru/news/crimson-cup-prizepool-qualifiers#prizovoy-fond).

## Чек-ин, регистрация и формат {#chek-in}

- **Регистрация** проходит на [официальном Discord](https://discord.gg/originstcg). Можно записаться на несколько квалификаций, но Koin просит записываться только на те, в которых вы действительно сможете участвовать.
- **Чек-ин** открывается за два часа до каждой квалификации и закрывается за пять минут до старта, вместе с подачей колод: пропустили — не играете ([правила](/ru/news/crimson-cup-format-check-in#chek-in)).
- **Формат**: [Conquest](/ru/guides/origins-tcg-conquest) на три колоды, матчи до двух побед, списки колод скрыты до топ-4 (на этапе бана видна только Легендарная), гранд-финал до трёх побед. Семь локаций исключены из пула: список — в [статье о призовом фонде](/ru/news/crimson-cup-prizepool-qualifiers#sem-lokatsiy-vne-turnira).
- Страница 8 свода правил посвящена техническим проблемам и отслеживанию колод: прочитайте её до первого матча ([что изменилось 14 октября](/ru/news/playtest-closing-crimson-cup-twitch#svod-pravil)).

Если вы ещё выбираете три колоды, начните с [турнирных колод](/ru/decks/tournament) и [конструктора колод](/ru/deck-builder), который сам проверит правило Conquest.

## Где смотреть матчи {#gde-smotret}

- **Официальный канал Koin на Twitch**, [twitch.tv/originstcg](https://www.twitch.tv/originstcg): 14 октября Koin объявила, что будет транслировать там каждое событие Crimson Cup.
- **[Главная страница](/ru) OriginsMeta**: пока официальный канал в эфире по Origins TCG, официальная трансляция занимает место нашего слайдера, а когда эфир заканчивается, слайдер возвращается.
- **Совместные трансляции креаторов**: Koin разрешает любому вести совместную трансляцию Crimson Cup или стримить свои матчи. На нашей [странице Live](/ru/live) вы найдёте креаторов, которые прямо сейчас в эфире по Origins TCG, вместе с их плеером.

## Broadcasting OM: наш оверлей для трансляции матча {#broadcasting-om}

Если вы собираетесь вести совместную трансляцию Crimson Cup или комментировать собственный турнир, OriginsMeta даёт вам бесплатный графический оверлей поверх игры: **Broadcasting OM**. Он состоит из двух страниц:

- **панель управления**, [originsmeta.com/broadcast](https://originsmeta.com/broadcast), где вы заполняете данные матча;
- **оверлей**, [originsmeta.com/broadcast/live](https://originsmeta.com/broadcast/live), с прозрачным фоном, сделанный для источника «Браузер» в OBS размером 1920 × 1080.

Что он показывает в эфире:

- **плашки с никами двух игроков**, с колодами 1, 2 и 3 и точкой на колоде, которая сейчас в игре;
- **счёт серии** с названием турнира, стадией (квалификация, плей-офф, финал) и форматом (Bo1, Bo3, Bo5);
- **списки колод** слева, справа или скрытые, с **оставшимися копиями** каждой карты: в панели управления клик по карте отмечает одну копию как сыгранную, а «Next game» возвращает все обратно;
- **карту целиком при наведении**, со стоимостью, силой, здоровьем, типом и текстом на языке оверлея (английский, итальянский, испанский или французский), и кнопку **Copy deck** с кодом игры;
- необязательное **место для спонсора**, которое чередуется со счётом (по умолчанию 20 секунд счёта и 7 секунд спонсора, оба значения настраиваются), с загрузкой до трёх логотипов или баннеров;
- строку «не связан с Koin Games», всегда на экране.

Матч можно заполнить четырьмя способами: тегом турнира в [турнирном органайзере OriginsMeta](/ru/tournaments) (OM-XXXX), ссылкой на [турнирную колоду](/ru/decks/tournament), опубликованную на сайте, вставкой кода колоды из игры или вручную. «Demo match» загружает пример, чтобы попробовать.

**Одно правило Crimson Cup, которое нужно соблюдать**: списки колод скрыты до топ-4. До этого держите списки скрытыми и используйте только плашки с никами и счёт; начиная с топ-4 их можно показывать.

## Как настроить в OBS {#obs}

1. Откройте [originsmeta.com/broadcast](https://originsmeta.com/broadcast) как док в OBS: Docks → Custom Browser Docks, вставьте адрес.
2. Добавьте оверлей как источник: Sources → + → Browser, адрес [originsmeta.com/broadcast/live](https://originsmeta.com/broadcast/live), ширина 1920, высота 1080, поверх захвата игры.
3. Заполните матч в доке: оверлей обновляется на лету, потому что оба работают в одном OBS.

Если оверлей запущен в другом месте (на другом ПК, у сокомментатора), скопируйте адрес оверлея из панели управления: он несёт состояние на тот момент, поэтому копируйте его заново после каждого изменения. Для колод в ваших собственных матчах есть ещё команда чата !deck и оверлей колоды, о них рассказано в нашем [гайде для стримеров](/ru/guides/streaming-tools).

## Ещё в тестировании: чего не хватает {#v-testirovanii}

Broadcasting OM — первая версия, вышедшая к Crimson Cup. На наших серверах ничего не сохраняется: состояние, включая изображения спонсоров, хранится в вашем браузере. Зрители на Twitch пока не могут кликать по оверлею (для этого нужно расширение Twitch, оно появится позже), а счёт и копии обновляются вручную из панели управления. Если вы используете его во время квалификаций, расскажите нам, чего не хватает, на [нашем Discord](https://discord.gg/54EctHTZzM).

## Источники {#istochniki}

- Пост Koin Games в Steam от 5 октября 2026, [«Prizepool announcement & key update to our biggest tournament ever»](https://store.steampowered.com/news/app/4429430/view/1845383656394214), и его официальная графика с календарём.
- Правила, объявленные на [официальном Discord](https://discord.gg/originstcg) 24 сентября, и анонс про Twitch от 14 октября 2026.
- Broadcasting OM — инструмент OriginsMeta, а не Koin Games.`,
    faq: [
      {
        q: "Когда проходят квалификации Crimson Cup?",
        a: "Пять квалификаций с 19 по 22 октября 2026: AMER в понедельник, 19-го, в 19:00 EST, EMEA во вторник, 20-го, в 19:00 CEST, AMER в среду, 21-го, в 21:00 EST, APAC в четверг, 22-го, в 19:00 SGT и EMEA в четверг, 22-го, в 19:00 CEST. Плей-офф 24 октября и финал 25 октября, оба в 10:00 EST.",
      },
      {
        q: "Где посмотреть Crimson Cup?",
        a: "На официальном канале Koin Games на Twitch, twitch.tv/originstcg, где транслируется каждое событие; во время эфира трансляция появляется и на главной странице OriginsMeta. Креаторы могут вести совместные трансляции, а на странице Live в OriginsMeta собраны те, кто в эфире по Origins TCG.",
      },
      {
        q: "Что такое Broadcasting OM?",
        a: "Бесплатный оверлей OriginsMeta для трансляции матча Origins TCG в OBS: ники, счёт серии, три колоды с оставшимися картами, превью карты, код колоды и место для спонсора. Вы заполняете его на originsmeta.com/broadcast и добавляете originsmeta.com/broadcast/live как источник «Браузер». Это не инструмент Koin Games.",
      },
    ],
  },
  "demo-patch-notes-0-7-1": {
    title: "Демо Origins TCG 0.7.1: рейтинговый режим запущен до Steam Next Fest, исправлено около 100 багов",
    metaTitle: "Патчноут демо Origins TCG 0.7.1: рейтинговый режим",
    description:
      "Демо Origins TCG 0.7.1 от 15 октября: рейтинговый режим за четыре дня до Steam Next Fest, видно муллиган соперника, исправлено около 100 багов.",
    summary:
      "15 октября Koin Games обновила демо Origins TCG в Steam до версии 0.7.1, в день закрытия плейтеста. Главная новость — рейтинговый режим за четыре дня до Steam Next Fest: пока ладдер заканчивается на Grandmaster. Обновление также приносит новый главный экран и игровые коврики, показывает, сколько карт соперник заменил при муллигане, и исправляет около 100 багов. Изменений баланса нет: характеристики карт остаются такими же, как в патче 0.7.",
    highlights: [
      { label: "Рейтинговый режим запущен", text: "за четыре дня до Steam Next Fest; пока ладдер заканчивается на Grandmaster", anchor: "reytingovyy-rezhim" },
      { label: "Миссии в рейтинговом режиме или в PvE", text: "вы сами выбираете, где их выполнять", anchor: "missii" },
      { label: "Муллиган соперника", text: "видно, сколько карт он заменил", anchor: "mulligan-sopernika" },
      { label: "Новый главный экран и коврики", text: "пока в работе, с намёком на будущее", anchor: "glavnyy-ekran" },
      { label: "Ваш язык, быстрые боты, около 100 исправлений", text: "плюс более умный поиск по коллекции и новые голоса", anchor: "uluchsheniya" },
      { label: "Известные проблемы", text: "скорость игры, визуал грейдинга ещё не готов, переводы пока в работе", anchor: "izvestnye-problemy" },
      { label: "Изменений баланса нет", text: "характеристики карт на OriginsMeta не меняются", anchor: "chto-ne-menyaetsya" },
    ],
    body: `## Небольшое обновление перед Steam Next Fest {#obnovlenie}

15 октября Koin Games обновила основное демо Origins TCG в Steam до версии 0.7.1. Пост в Steam под названием «Ranked is here!» вышел в 20:52 UTC; номер версии указан на официальном изображении обновления, «Steam Demo Update 0.7.1». «Это обновление небольшое», пишет команда, но ей хотелось успеть добавить в демо несколько исправлений и функций для удобства до Steam Next Fest, который начинается 19 октября.

Оно вышло в тот же день, когда закрылся плейтест ([наша статья](/ru/news/playtest-closing-crimson-cup-twitch)): теперь демо — единственная сборка, в которую можно играть, и это же сборка Crimson Cup ([наш гайд по Next Fest и турниру](/ru/guides/steam-next-fest-2026)). Часть изменений — те, что плейтест получил с [версией 0.7.1 от 8 октября](/ru/news/playtest-patch-notes-0-7-1); рейтинговый режим, новый главный экран, коврики и язык при запуске — новые.

## Рейтинговый режим запущен {#reytingovyy-rezhim}

«Прошло 84 года... но рейтинговый режим наконец здесь!» — пишет команда. Вы поднимаетесь по ладдеру и получаете награды, а вместе с ними «отрезвляющее осознание того, что все выше вас почему-то играют в эту игру лучше». Пока ладдер заканчивается на Grandmaster, высшем дивизионе, и Koin обещает «скоро открыть эти двери».

21 сентября Koin писала, что рейтинговый режим включится со стартом Steam Next Fest: он пришёл на четыре дня раньше. На AMA 2 октября команда называла даты «карандашом»: сезон с 19 октября по 4 декабря и таблица лидеров Grandmaster, закрытая во время фестиваля и открытая с 27 октября, чтобы все стартовали одновременно ([наша статья](/ru/news/building-origins-ama-design-balance#reytingovyy-rezhim)). Патчноут подтверждает, что Grandmaster пока закрыт, но не говорит, идёт ли сезон с сегодняшнего дня или начнётся 19 октября. Как устроен рейтинговый режим, включая дивизионы и Victory Points, — в [нашем гайде по рейтинговому режиму](/ru/guides/origins-tcg-ranked).

### Миссии в рейтинговом режиме или в PvE {#missii}

Миссии теперь можно выполнять в PvE, из раздела Missions, или в PvP, в рейтинговом режиме: выбор за вами. Такой же выбор плейтест получил 8 октября, после того как сборка 1 октября сделала миссии только PvE.

## Что нового {#chto-novogo}

### Муллиган соперника {#mulligan-sopernika}

Во время фазы муллигана теперь видно, сколько карт заменил соперник. Игроки просили об этом в Discord, и команда пишет, что идея была настолько хороша, что её реализовали уже на следующий день.

### Новый главный экран и игровые коврики {#glavnyy-ekran}

- **Главный экран:** «довольно много» улучшений интерфейса. Команда называет его работой в процессе.
- **Игровые коврики:** у главного экрана и у матча новый коврик. «О, что бы это могло значить в будущем?» — добавляет команда и больше ничего не говорит.

### Командиры, поле и вступительный ролик {#komandiry}

- **Командиры**, как их называет патчноут, теперь произносят реплику и показывают свою плашку с именем, когда вы их рассматриваете.
- **Эффекты поля:** клики по полю вызывают визуальные и звуковые эффекты. И то и другое — временные заглушки, и команда просит игроков «судить о них лишь умеренно».
- **Вступительный ролик:** вступительное видео проигрывается один раз. Его ещё нужно доработать, и команда ждёт мнений в Discord.

## Улучшения {#uluchsheniya}

### Поиск по коллекции {#poisk}

Поиск по коллекции принимает фразы из нескольких слов, а поиск того, что призывает карта, находит и саму карту, которая это призывает. На OriginsMeta поиск в [Картах](/ru/cards) и в [конструкторе колод](/ru/deck-builder) уже смотрит на названия и текст карт.

### Эмоции и голоса {#emotsii-golosa}

- В выборе эмоций теперь можно очистить ячейку, так что собирать свой набор эмоций стало немного проще.
- У Huck Finn и Christopher Robin новые голоса: они «больше не звучат как жутковатые мужчины средних лет». Об этом говорили игроки, и команда пишет, что внутри студии все говорили то же самое.

### Игра запускается на вашем языке {#yazyk}

Теперь игра должна запускаться на вашем языке, если в системе выбран язык, который игра поддерживает. Патч 0.7 довёл число языков игры до 13 ([наша статья](/ru/news/patch-0-7)).

### Более быстрые боты {#boty}

Соперники под управлением компьютера больше не играют так медленно. Команда говорит, что работы ещё много, но надеется, что разница заметна.

### Около 100 исправленных багов {#bagi}

По подсчётам команды, обновление исправляет около 100 багов. Патчноут их не перечисляет.

## Известные проблемы {#izvestnye-problemy}

- **Скорость игры и анимации.** Кое-что стало быстрее, но «сделать ещё МНОГО»: это остаётся одним из главных приоритетов команды.
- **Визуал грейдинга.** Он не попал в это обновление; Koin говорит, что показать что-то сможет «очень скоро». Что такое грейдинг, вместе с сетами и Alpha Edition, — в [нашей статье](/ru/news/origins-sets-alpha-edition-grading).
- **Другие языки.** Если вы играете не на английском, переводы ещё в работе и временного текста много.

## Что не меняется {#chto-ne-menyaetsya}

- **Изменений баланса нет.** Характеристики карт остаются такими же, как в [патче 0.7](/ru/news/patch-0-7) от 29 сентября, последнем патче баланса перед Crimson Cup: страницы карт, [конструктор колод](/ru/deck-builder) и [MetaShifting](/ru/metashifting) не меняются, а опубликованные колоды обновлять не нужно.
- **Как играть в демо** — всё по-прежнему: наш [гайд по игре в демо](/ru/guides/play-the-demo).

## Чего мы пока не знаем {#chego-ne-znaem}

- Идёт ли рейтинговый сезон с 15 октября или начнётся заново 19 октября вместе со Steam Next Fest.
- Какие награды даёт рейтинговый режим и когда именно откроются двери Grandmaster: на AMA называли 27 октября, «карандашом».
- Что означают новые коврики.
- Когда появится визуал грейдинга и какие именно баги исправлены.

## Источники {#istochniki}

Пост «Ranked is here!», который Koin Games опубликовала на [странице Origins TCG в Steam](https://store.steampowered.com/news/app/4429430/view/1846651706679257) 15 октября 2026, и его официальное изображение с номером версии 0.7.1.`,
    faq: [
      {
        q: "Есть ли рейтинговый режим в демо Origins TCG?",
        a: "Да, с демо 0.7.1 от 15 октября 2026, за четыре дня до Steam Next Fest. Пока ладдер заканчивается на Grandmaster: Koin обещает скоро открыть этот дивизион, а на AMA 2 октября команда «карандашом» называла 27 октября.",
      },
      {
        q: "Меняет ли демо 0.7.1 характеристики карт?",
        a: "Нет. Изменений баланса в нём нет: характеристики карт остаются такими же, как в патче 0.7 от 29 сентября 2026, последнем патче баланса перед Crimson Cup, и страницы карт на OriginsMeta не меняются.",
      },
      {
        q: "Засчитываются ли рейтинговые матчи в миссии демо Origins TCG?",
        a: "Да. С демо 0.7.1 миссии можно выполнять в PvP в рейтинговом режиме или в PvE из раздела Missions.",
      },
    ],
  },
  "originsmeta-one-month": {
    title: "Месяц назад, в час ночи: OriginsMeta исполнилось тридцать дней",
    metaTitle: "Origins TCG: OriginsMeta исполнился месяц, спасибо",
    description:
      "OriginsMeta, фан-сайту по Origins TCG, исполнился месяц: 6 800 посетителей, 1 900 скопированных кодов колод, четыре языка и планы. Спасибо вам.",
    summary:
      "15 сентября, в час ночи, мы запустили OriginsMeta. Нам казалось, что мы сделали базу карт с конструктором колод. Через месяц у нас тысячи людей, которые к нам заглянули, четыре языка, приложение, которое записывает матчи, и Crimson Cup на пороге. Это наше спасибо — с несколькими цифрами и несколькими обещаниями.",
    highlights: [
      { label: "Сентябрьская ночь", text: "идея 14 сентября, сайт онлайн в час ночи, первая колода сообщества в тот же день", anchor: "sentyabrskaya-noch" },
      { label: "Ваши цифры", text: "более 6 800 человек, 47 000 страниц, 1 900 скопированных кодов колод, 850 записанных матчей", anchor: "tsifry" },
      { label: "Что мы построили", text: "половина родилась из сообщения в Discord или отзыва", anchor: "chto-postroili" },
      { label: "Что дальше", text: "Steam Next Fest, Crimson Cup, первый тир-лист OriginsMeta, Kickstarter и расширение для Twitch", anchor: "chto-dalshe" },
      { label: "Спасибо", anchor: "spasibo" },
    ],
    body: `## Сентябрьская ночь {#sentyabrskaya-noch}

OriginsMeta родился из заметки в телефоне вечером 14 сентября: «идея для сайта». Домен мы купили той же ночью. В час ночи первая версия была онлайн, в половине девятого появился конструктор колод, а к середине дня база карт была готова.

В 17:30 случилось то, после чего мы подумали, что, возможно, всё сделали правильно: Luigi «[Davdas](/ru/authors/davdas)» Ragoni опубликовал первую колоду сообщества, Healing Healsing. Сайт о колодах без колод — пустая витрина, но с этого момента наш сайт заработал: витрина больше никогда не пустовала.

## Что вы дали нам за тридцать дней {#tsifry}

Таких цифр мы не ожидали. Мы не хотим говорить, много это или мало: мы хотим сказать, что это «наши» цифры, цифры всего сообщества.

- К нам заглянули более 6 800 человек, и на сегодня открыто более 47 000 страниц. В лучшие дни сайт посещали более 350 уникальных пользователей.
- 1 900 раз вы копировали код колоды, чтобы перенести её в игру. Эта цифра для нас важнее всего: значит, сайт помогает игрокам играть.
- Читают нас в основном из Италии (45%), но также из США (14%), Испании (6%), Франции (5%), Германии (4%), Сингапура (4%) и Бразилии (2%), и каждый день присоединяются люди из других стран.

Поэтому в конце сентября появился испанский, а 8 октября — французский.

В базе более 60 [колод](/ru/decks), а через [OriginsMeta Tracker](/ru/tracker) вы записали более 850 матчей, на которых сегодня построены все данные нашего раздела [Analytics](/ru/analytics).

А за всем этим — ещё более 400 обновлений сайта, 122 карты, проверенные в игре одна за другой, и немало бессонных ночей.

## Что мы построили {#chto-postroili}

Перечитывая заметки этого месяца, бросается в глаза, что половина функций сайта — Tracker, Analytics и многие другие идеи — родилась из сообщения в Discord или отзыва. Мы никогда не сможем отблагодарить вас за это в полной мере! Пишите и дальше!

## Что дальше? {#chto-dalshe}

Следующие две недели — самые важные с тех пор, как существует Origins, и мы хотим быть рядом.

- С 19 октября идёт Steam Next Fest с рейтинговым режимом и Crimson Cup. Мы будем следить за турниром день за днём: календарь — в нашем [гайде по Next Fest](/ru/guides/steam-next-fest-2026).
- После Crimson Cup выйдет первый [тир-лист](/ru/tier-list) OriginsMeta, построенный на результатах турнира, а не на наших мнениях.
- 27 октября стартует [Kickstarter Alpha Edition](/ru/guides/origins-tcg-kickstarter), и мы расскажем о нём здесь.
- Маленький спойлер: мы день и ночь работаем над нашим первым оверлеем для Twitch — расширением, которое позволит в любой момент посмотреть колоду и карты любимого стримера прямо во время его матчей.
- Дальше, без дат, потому что мы не хотим обещать то, что пока не знаем, сможем ли сделать: сайт, которым удобнее пользоваться на телефонах и планшетах, а может быть, и отдельное приложение? Дайте нам время!

## Спасибо, правда {#spasibo}

Всем, кто опубликовал колоду, всем, кто голосовал, всем, кто писал нам «эта штука не работает» в любое время дня и ночи, всем, кто установил приложение, сделанное несколькими незнакомцами, чтобы помочь нам считать матчи: OriginsMeta — это ещё и прежде всего ваш сайт. Продолжайте рассказывать нам, чего не хватает, на [нашем Discord](https://discord.gg/RAG7nnrNGP). Список дел на второй месяц уже длинный… и нам это нравится!

*Luigi, Pierluigi и вся команда OriginsMeta*`,
  },
  "playtest-closing-crimson-cup-twitch": {
    title: "Плейтест Origins TCG закрывается 15 октября: Crimson Cup на Twitch, совместные трансляции и обновление правил",
    metaTitle: "Плейтест Origins TCG закрыт, Crimson Cup на Twitch",
    description:
      "Плейтест Origins TCG закрывается 15 октября после более чем 100 000 матчей. Koin открывает канал Twitch для Crimson Cup и разрешает совместные трансляции.",
    summary:
      "14 октября Koin Games объявила на официальном Discord, что плейтест Origins TCG закрывается на следующий день, после более чем 100 000 матчей, и что готовится обновление основного демо. Все события Crimson Cup будут транслироваться на новом официальном канале Twitch, вести совместные трансляции может любой, а страница 8 свода правил теперь объясняет, что делать с техническими проблемами и отслеживанием колод.",
    highlights: [
      { label: "Плейтест закрывается 15 октября", text: "сыграно более 100 000 матчей, а основное демо ждёт обновление", anchor: "pleytest" },
      { label: "Канал Twitch для Crimson Cup", text: "трансляция каждого события и страница предпросмотра Kickstarter, на которую можно подписаться", anchor: "twitch" },
      { label: "Совместные трансляции открыты для всех", text: "ретранслируйте официальный эфир или смотрите других стримеров и сообщите Koin через её форму", anchor: "sovmestnye-translyatsii" },
      { label: "Свод правил, страница 8", text: "новые указания по техническим проблемам и отслеживанию колод", anchor: "svod-pravil" },
    ],
    body: `## Плейтест закрывается 15 октября {#pleytest}

14 октября команда Koin Games открыла своё объявление на [официальном Discord](https://discord.gg/originstcg) грустной новостью: плейтест «покидает нас завтра», так что сборка плейтеста закрывается 15 октября. По словам команды, игроки «сыграли в ней более 100 тысяч матчей» и «очень нам помогли». [Обновление 0.7.1 от 8 октября](/ru/news/playtest-patch-notes-0-7-1) стало её последним патчноутом.

После закрытия плейтеста обновление получит основное демо — бесплатное, в Steam, о нём рассказывает наш [гайд по демо](/ru/guides/play-the-demo). Koin пишет, что оно «должно очень порадовать большинство из вас», но не говорит, что в нём будет, поэтому гадать мы не станем: расскажем, когда выйдет патчноут.

Koin также предупредила, что «для Origins это ВАЖНЫЕ НЕДЕЛИ» и впереди новые объявления. Календарь — в нашем [гайде по Steam Next Fest](/ru/guides/steam-next-fest-2026): рейтинговый режим и Crimson Cup стартуют вместе с фестивалем 19 октября, а [Kickstarter Alpha Edition](/ru/guides/origins-tcg-kickstarter) ожидается 27 октября.

## Канал Twitch для Crimson Cup и страница Kickstarter {#twitch}

Koin открыла новый официальный канал Twitch, где «будет транслировать ВСЕ события Crimson Cup», и просит игроков подписаться на страницу предпросмотра Kickstarter до запуска кампании. Обе ссылки есть в объявлении на [официальном Discord](https://discord.gg/originstcg). Даты квалификаций и призовой фонд — в нашей [статье о Crimson Cup](/ru/news/crimson-cup-prizepool-qualifiers).

## Совместные трансляции Crimson Cup {#sovmestnye-translyatsii}

Вести совместную трансляцию Crimson Cup или стримить свои матчи может любой. Помимо официальной трансляции каждого события, есть два способа комментировать самому:

- ретранслировать официальный эфир Koin;
- напрямую наблюдать за матчами других стримеров.

Koin хотела бы поработать с несколькими стримерами на Twitch, чтобы охватить больше людей, и просит всех, кто планирует стримить событие Crimson Cup, сообщить об этом через форму, ссылка на которую есть в объявлении, чтобы всё согласовать.

Если вы стримите с турнирной колодой, у OriginsMeta есть для этого бесплатные инструменты: короткая ссылка, которую можно назвать в эфире, команда чата !deck и оверлей для OBS с вашими тремя колодами — всё это объяснено в нашем [гайде для стримеров](/ru/guides/streaming-tools).

## Свод правил: технические проблемы и отслеживание колод {#svod-pravil}

Koin добавила в свод правил Crimson Cup короткий раздел на странице 8 с более понятными указаниями о том, что делать с техническими проблемами и как отслеживать колоды. Объявление не пересказывает его: если вы играете в квалификации, прочитайте эту страницу до своих матчей. Формат с тремя колодами и Conquest — в нашей статье о [правилах Crimson Cup](/ru/news/crimson-cup-format-check-in).

## Чего мы пока не знаем {#chego-ne-znaem}

- Что будет в обновлении основного демо и когда оно выйдет.
- Точная формулировка нового раздела свода правил.
- С какими стримерами Koin будет сотрудничать в трансляциях.

## Источники {#istochniki}

- Объявление команды Koin Games на [официальном Discord Origins TCG](https://discord.gg/originstcg) от 14 октября 2026 со ссылками на канал Twitch, страницу предпросмотра Kickstarter, форму для совместных трансляций и свод правил.`,
    faq: [
      {
        q: "Когда закрывается плейтест Origins TCG?",
        a: "15 октября 2026. Koin Games объявила об этом на официальном Discord накануне, после более чем 100 000 матчей, сыгранных в сборке плейтеста, и сообщила, что готовится обновление основного демо.",
      },
      {
        q: "Где посмотреть Crimson Cup?",
        a: "На новом официальном канале Koin Games на Twitch, где будут транслироваться все события Crimson Cup. Ссылка есть в объявлении от 14 октября 2026 на официальном Discord Origins TCG.",
      },
      {
        q: "Можно ли стримить Crimson Cup или вести совместную трансляцию?",
        a: "Да. Вести совместную трансляцию Crimson Cup или стримить свои матчи может любой, ретранслируя официальный эфир или наблюдая за другими стримерами. Koin просит стримеров сообщить о себе через форму в её объявлении, чтобы всё согласовать.",
      },
    ],
  },
  "building-origins-ama-design-balance": {
    title: "AMA Building Origins: рейтинговый режим до 4 декабря, 22 новые карты в ноябре и почему Bagheera стоит дороже",
    metaTitle: "AMA Origins TCG: даты рейтинга, новые карты и баланс",
    description:
      "AMA Building Origins по Origins TCG: рейтинговый сезон с 19 октября по 4 декабря, 22 новые карты в ноябре, пропуск за ~$20 и почему подорожали карты.",
    summary:
      "На AMA Building Origins, прошедшем в прямом эфире 2 октября и выложенном на YouTube 5 октября, Koin Games назвала даты, которые сама назвала «написанными карандашом»: рейтинговый режим с 19 октября по 4 декабря, таблица лидеров Grandmaster с 27 октября и не меньше 22 новых карт в ноябре. Команда дизайнеров также объяснила, почему Bagheera, Mind Palace и Spellbook стоят дороже с патча 0.7, почему Christopher Robin вернулась к 5/4 и как в игре выстраивается баланс.",
    highlights: [
      { label: "Рейтинговый режим с 19 октября по 4 декабря", text: "таблица лидеров Grandmaster открывается 27 октября, для всех одновременно", anchor: "reytingovyy-rezhim" },
      { label: "Ноябрь", text: "плейтест монетизации, не меньше 22 новых карт, новые карты и локации каждые две недели", anchor: "noyabr" },
      { label: "Будущие карты", text: "20 Легендарных, более 90 придуманных локаций и механика еды", anchor: "budushchie-karty" },
      { label: "Пропуск коллекционера, капсулы и командиры", text: "разовая покупка примерно за $20, командиры, которыми можно обмениваться", anchor: "kollektsionnyy-propusk" },
      { label: "Наблюдение, реплеи и игровые поля", text: "режим наблюдателя на Crimson Cup только для одобренных аккаунтов", anchor: "nablyudenie" },
      { label: "Почему три карты стоят дороже", text: "Bagheera, Mind Palace и Spellbook; для Ellen Trechend изменений нет", anchor: "pochemu-dorozhe" },
      { label: "Christopher Robin и Axe Throw", text: "причины качелей 5/4, 4/5 и обратно к 5/4", anchor: "christopher-robin" },
      { label: "Как Koin проектирует игру", text: "коридоры силы, данные плюс настроение игроков, «чистая положительная радость»", anchor: "kak-koin-proektiruet" },
    ],
    body: `## Рейтинговый режим: с 19 октября по 4 декабря, Grandmaster с 27-го {#reytingovyy-rezhim}

Даты команда назвала с оговоркой: «они написаны карандашом, а корректора у меня с собой много». Рейтинговый сезон начинается 19 октября, в первый день Steam Next Fest, и длится до 4 декабря. Таблица лидеров Grandmaster во время фестиваля закрыта и должна открыться во вторник, 27 октября, чтобы «все стартовали одновременно».

Лучшие призы достанутся верхушке этой таблицы, в том числе «эксклюзивные награды в одном или в 25 экземплярах», которые Mike из команды Koin назвал «вероятно, лучшими призами во всей игре». В этом сезоне рейтинговые награды будут ещё до появления полной монетизации, «может быть, единственный раз», а предметы, которые вы зарабатываете в демо сейчас, к релизу перестанут выпускаться. Подробнее — в нашем [гайде по рейтинговому режиму](/ru/guides/origins-tcg-ranked).

## Ноябрь: плейтест монетизации и новые карты каждые две недели {#noyabr}

Ноябрьские сборки — это плейтесты монетизации. Если планы не изменятся, в ноябре появятся ещё и «не меньше 22 новых карт», а во время сезона ладдера новые карты и локации будут выходить каждые две недели. В более далёкой перспективе Mike сказал, что команда «движется к запуску игры в следующем году» и что интерфейс, который пока выглядит мобильным, к концу года станет выглядеть «гораздо более по-компьютерному»; Kevin сказал, что мобильная версия появится «скоро», без даты. Подтверждённые даты — в нашей [дорожной карте](/ru/guides/roadmap-and-dates).

## Будущие карты: 20 Легендарных, более 90 локаций и еда {#budushchie-karty}

В демо — «первая половина» первого сета; вторая половина добавит ключевые слова и новые концепции. Ben, ведущий дизайнер карт, сказал, что запланировано 20 Легендарных карт и придумано «более 90» локаций, тогда как игроки видели примерно 40. Многие нынешние локации благоволят агрессивным колодам вроде Three Not So Little Pigs; по мере появления новых это должно выровняться.

Новая механика, которой он «очень воодушевлён», — **еда**; её отложили, потому что она «немного сложная»: это предмет на поле, который не является персонажем. Персонаж, разыгранный поверх него, получает бонус, «сейчас это плюс два, плюс два», так что расстановка значит больше. Готовится и другая подтема: «созданные карты стоят меньше». Ни одной новой карты не назвали.

Будущие сеты обратятся к другим мифологиям: запланирован сет по греческой мифологии, некоторые его карты уже придуманы. Koin также пообещала коллаборации и сказала, что к ней обращались студии, «номер один в мире в своих категориях», не назвав их.

## Пропуск коллекционера, капсулы и командиры {#kollektsionnyy-propusk}

Origins остаётся free-to-compete: каждый игрок получает все игровые карты, никто не должен чувствовать себя «вынужденным что-либо тратить», а деньги идут на ограниченные варианты, как в Counter-Strike. Составляющие:

- **пропуск коллекционера** (рабочее название): разовая покупка «примерно за 20 баксов», а не ежемесячный боевой пропуск; он даёт около двух коллекционных предметов в неделю за игру, и никогда не тех, что встречаются в бустерах;
- **кредиты магазина**, которые зарабатываются игрой, для других эксклюзивных коллекционных предметов;
- **капсулы**, второй вид предметов: в бустерах только карты, а командиры выпадают из капсул;
- **командиры**, которыми можно обмениваться и чей тираж ограничен; в раннем доступе каждый получит четырёх командиров без возможности обмена, с эмоциями и аватарами, как «стартовый капитал».

Koin также изучает коллекционные кейсы с персонализацией и альбомы, чтобы листать коллекции других игроков. Сеты и грейдинг — в нашей [статье о сетах](/ru/news/origins-sets-alpha-edition-grading) и в [гайде по экономике коллекционирования](/ru/guides/collector-economy); что касается Kickstarter, «цены скоро раскроют».

## Наблюдение, реплеи и игровые поля {#nablyudenie}

- **Режим наблюдателя** существует, но «не закончен»: на [Crimson Cup](/ru/news/crimson-cup-prizepool-qualifiers) им будут пользоваться только некоторые аккаунты, одобренные для трансляций.
- **Реплеи** работают внутри студии, но для игроков ещё не готовы; запланирована **история по ходам**.
- Возможность видеть, сколько карт соперник заменил при муллигане, идея сообщества, уже была во внутренней сборке: она вышла с [плейтестом 0.7.1](/ru/news/playtest-patch-notes-0-7-1#mulligan-sopernika).
- Нынешнее **игровое поле — временная заглушка**, «слишком научно-фантастическое и пресное»: в работе поля, вдохновлённые каждым боссом, и появятся косметические поля.
- **Боты**: «на пике у нас около 200 игроков одновременно», сказал Mike, поэтому пока часть рейтинговых матчей проходит против ботов; миссии явно PvE.

## Почему Bagheera, Mind Palace и Spellbook стоят дороже {#pochemu-dorozhe}

[Патч 0.7](/ru/news/patch-0-7#stoimost) поднял стоимость всех трёх на 1 ману. Ben сказал, что команда не планировала изменений, но карты, на которые игроки постоянно указывали, «стали играться всё чаще», пока цифры не перестали быть здоровыми. Винрейтов он не назвал, сказал только, что они были «в здоровых пределах».

- **Bagheera** — карта, которую «для нас очень важно сделать правильно»: она задаёт ранний темп и учит новых игроков, где появится угроза, «в тех же трёх местах», в средних ячейках, где её способность При раскрытии делает её сильнее. Как 3/3 за 1 ману она была в слишком многих колодах, прежде всего в Three Not So Little Pigs. Koin хочет, чтобы это была карта для Mulan, которая повторяет способности При раскрытии, поэтому большой бонус оставили, а стоимость подняли. Более сильная колода Mulan, заметил Ben, может, в свою очередь, усилить Ellen Trechend.
- **Spellbook** изменится сильнее всего, когда пул карт удвоится, потому что её заклинания берутся из этого пула. Kevin насчитал сегодня около 22 заклинаний, так что Legion of the Dead выпадает примерно «один раз из 22» — шансы, которые «продержатся недолго».
- **Ellen Trechend**: «никаких действий», и ничего не стоит ждать «в ближайшем будущем».

До Crimson Cup Koin «намерена» оставить карты как есть; в «катастрофическом» случае «мы просто забаним карту, а не будем её менять».

## Christopher Robin и Axe Throw {#christopher-robin}

Christopher Robin перешла с 5/4 на 4/5, потому что была во многих колодах с хорошим винрейтом, а в обучающих партиях новые игроки постоянно встречали напротив неё Golden Egg без другого выхода, кроме размена; в варианте 4/5 сыгранный следом Galahad менял исход боёв. Команда откатила изменение ([патч демо от 21 сентября](/ru/news/demo-patch-notes-0921#christopher-robin)), потому что думала вернуть Axe Throw урон «обратно к пяти», ещё не была к этому готова и хотела, чтобы Axe Throw, наносящая сегодня 4 урона, оставалась хорошей против самых популярных карт. «Дело было не только и не столько в уровне силы», сказал Ben. [Переработка Twister Toss](/ru/news/patch-0-7#twister-toss) тоже убирает неуклюжий момент: перемещение больше не срывается, если другая карта первой заходит в ячейку.

## Как Koin проектирует игру {#kak-koin-proektiruet}

- **Коридоры, а не равная сила**: «мы не особо стремимся к тому, чтобы все карты были на одном уровне силы», сказал Ben; команда вмешивается, когда карта выходит из здоровых коридоров.
- **Данные и ощущения**: цифры плюс отзывы, потому что «настроение игроков — это тоже данные» (Kevin), и цель, которую они называют «чистой положительной радостью»: победитель взаимодействия получает удовольствие, а проигравший не чувствует себя ужасно.
- **Мало решений, но весомых**: 12 базовых карт плюс Легендарная — это «13 решений», поэтому изменение стоимости в мане весит больше, чем в больших колодах.
- **Одновременные ходы, три локации и Легендарная, которую «не нужно тянуть»**, в игре, которую с «самого начала» задумывали интересной для зрителей.
- **Намеренно более дружелюбные правила**: снятие постоянного усиления никогда не убивает персонажа, а Щит полностью останавливает Пробивной удар.

## Чего мы пока не знаем {#chego-ne-znaem}

- Все даты «написаны карандашом» и могут сдвинуться.
- Какими будут награды ладдера и призы в одном экземпляре: Koin «ещё на кухне».
- Когда появятся еда, остальные Легендарные и греческий сет и с какими картами.
- Цены Kickstarter и сколько будет командиров и капсул.

## Источники {#istochniki}

[Запись AMA Building Origins](https://www.youtube.com/watch?v=bEb5RuwY7tg) на официальном YouTube-канале Origins TCG, прямой эфир 2 октября 2026, опубликована 5 октября (2 часа 22 минуты), с Kevin Lambert, директором по продукту и руководителем дизайна Koin Games, Ben «Benny Beatdowns», ведущим дизайнером карт, ранее работавшим в Wizards of the Coast над Magic, и другими членами команды. Мы использовали автоматические английские субтитры YouTube, которые искажают некоторые имена (названия карт сверены с нашей базой): цитаты — наша собственная расшифровка в переводе.`,
    faq: [
      {
        q: "Когда начинается и заканчивается рейтинговый сезон Origins TCG?",
        a: "На AMA Building Origins Koin Games сообщила, что рейтинговый сезон начинается 19 октября 2026, в первый день Steam Next Fest, и длится до 4 декабря. Таблица лидеров Grandmaster должна открыться во вторник, 27 октября, для всех одновременно. Команда подчеркнула, что эти даты «написаны карандашом».",
      },
      {
        q: "Почему Bagheera, Mind Palace и Spellbook стоят на 1 ману больше?",
        a: "Частота их игры продолжала расти после того, как на них указали игроки, пока Koin не сочла цифры нездоровыми и не подняла их стоимость на 1 ману в патче 0.7. Bagheera за 1 ману была в слишком многих колодах, прежде всего в Three Not So Little Pigs, а Koin хочет, чтобы это была карта для Mulan. Винрейты не раскрывались.",
      },
      {
        q: "Будет ли Koin менять карты до Crimson Cup?",
        a: "Нет, если не случится что-то катастрофическое: в таком случае, сказала Koin, она забанит карту, а не изменит её. Ben также сказал, что на ближайшее будущее никаких действий по Ellen Trechend не планируется.",
      },
      {
        q: "Что такое механика еды в Origins TCG?",
        a: "Механика, которую ведущий дизайнер карт Ben назвал среди будущих: предмет, который кладётся на поле и не является персонажем, а персонаж, разыгранный поверх него, получает бонус, пока +2/+2. Её отложили, потому что она немного сложная, и дата не названа.",
      },
    ],
  },
  "bot-deck-challenge-practice-tournaments": {
    title: "Koin ждёт ваши колоды для ботов демо, а до Crimson Cup — еженедельные тренировочные турниры",
    metaTitle: "Origins TCG: ваши колоды для ботов демо",
    description:
      "Koin Games просит игроков Origins TCG прислать колоды для ботов демо, лучшим — секретный приз. А ещё еженедельные тренировочные турниры и цифры демо.",
    summary:
      "6 октября Koin Games запустила на официальном Discord челлендж: соберите колоды, отправьте их через форму, и боты демо начнут ими играть, а колоды, которые покажут себя лучше всех, получат «суперсекретный приз». В те же дни Koin провела первые два еженедельных тренировочных турнира перед Crimson Cup, пригласила фанатов проводить собственные турниры и поделилась новыми цифрами: более 20 000 загрузок демо и более 300 000 сыгранных матчей.",
    highlights: [
      { label: "Челлендж колод для ботов", text: "отправьте колоды через форму Koin, боты демо сыграют ими, лучшим — секретный приз", anchor: "boty" },
      { label: "Как участвовать", text: "сколько угодно колод, правила не объявлены", anchor: "kak-uchastvovat" },
      { label: "Тренировочные турниры", text: "первые два — 3 и 10 октября; сообщество предпочитает вечера будних дней по европейскому времени", anchor: "trenirovochnye-turniry" },
      { label: "Свой турнир", text: "Koin предлагает поддержку турнирам фанатов, а у OriginsMeta есть бесплатный органайзер", anchor: "svoy-turnir" },
      { label: "Запись AMA", text: "Building Origins, 2 часа 22 минуты на YouTube", anchor: "zapis-ama" },
      { label: "Демо в цифрах", text: "более 20 000 загрузок и более 300 000 матчей", anchor: "tsifry" },
    ],
    body: `## Koin хочет колоды получше для своих ботов {#boty}

6 октября в 18:17 UTC команда Koin Games опубликовала в #announcements на [официальном Discord](https://discord.gg/originstcg) «небольшой челлендж»: «Мы хотим улучшить колоды, которыми играют наши боты, так что давайте превратим это в небольшую игру». Всё устроено в четыре шага:

1. соберите колоды;
2. отправьте их через [официальную форму](https://forms.gle/zY1WeRTPLQzKAEs26);
3. боты начнут использовать их в матчах;
4. «колоды, которые покажут лучший результат, выиграют суперсекретный приз».

Можно отправить несколько колод, и, по словам команды, «никаких правил нет»: цель — «собрать лучшие колоды из возможных».

Почему это важно: в [посте о Crimson Cup от 5 октября](/ru/news/crimson-cup-prizepool-qualifiers#trenirovochnye-turniry) Koin писала, что большинство матчей в демо проходит против ботов. Списки, которые появятся благодаря этому челленджу, — те самые, с которыми игроки будут встречаться в этих матчах в недели перед [Crimson Cup](/ru/guides/steam-next-fest-2026).

## Как участвовать {#kak-uchastvovat}

Объявление не требует ничего, кроме формы: ни срока, ни формата, ни ограничения на число колод. Если нужна отправная точка:

- соберите и проверьте свой список в нашем [конструкторе колод](/ru/deck-builder), который следует правилам колод демо (одна Легендарная плюс 12 базовых карт по две копии, 25 карт) и даёт код игры для копирования;
- поищите идеи среди [колод, опубликованных на OriginsMeta](/ru/decks), у каждой есть гайд и оценки сообщества;
- раз можно отправить несколько списков, попробуйте разные архетипы, а не ставьте всё на одну колоду.

## Еженедельные тренировочные турниры {#trenirovochnye-turniry}

Тренировочные турниры, объявленные 5 октября, начались. Сначала Koin спросила игроков: в опросе 30 сентября 265 из 293 проголосовавших (90%) ответили «да» тренировочным турнирам без призов.

- **Тренировочный турнир #1**, суббота, 3 октября, в 16:00 CEST, объявлен 2 октября, прошёл по правилам Crimson Cup, поэтому колоды нужно было подать до старта ([формат](/ru/news/crimson-cup-format-check-in#conquest-s-tremya-kolodami) и наш [гайд по Conquest](/ru/guides/origins-tcg-conquest)).
- **Тренировочный турнир #2**, суббота, 10 октября, в 16:00 CEST (14:00 UTC), объявлен в #game-announcements 6 октября, сохранил формат первого — пять раундов по швейцарской системе, матчи до двух побед и без выбывания, — но без Conquest: колоды подавать не нужно, играть можно чем угодно. Регистрация шла в #tournaments-to-join.

6 октября Koin также спросила, когда игрокам удобнее играть. Победил вариант, набравший 40% голосов: «будние дни, вечер по европейскому времени (19:00 CEST, 13:00 EST)». День и время следующего тренировочного турнира пока не объявлены, а результаты второго в каналах объявлений не публиковались.

## Другие турниры и как провести свой {#svoy-turnir}

8 октября Koin обратила внимание игроков на турнир по Origins, который в тот же день в 16:30 CEST провёл Collector Club, сторонний сайт; он планирует еженедельные турниры на своём Discord с регистрацией в своём канале объявлений.

В том же сообщении команда добавила открытое приглашение: «Если вы фанат Origins и хотите проводить собственные турниры, мы будем рады вас поддержать. Свяжитесь с нами, и мы всё устроим!» В чём именно состоит эта поддержка, в сообщении не сказано.

Если хотите начать прямо сейчас, [турнирный органайзер](/ru/tournaments/new) OriginsMeta бесплатен для всех, кто вошёл в аккаунт: сетка на выбывание, Conquest или свободный выбор колоды, матчи до одной, двух или трёх побед, подача колод до старта, чек-ин и скрытые списки колод, публичный турнир или закрытый по приглашению, с короткой ссылкой, которой можно поделиться. Раунды по швейцарской системе он пока не поддерживает.

## Запись AMA Building Origins на YouTube {#zapis-ama}

Запись первого события Building Origins — AMA с Kevin и Ben, которых Koin представляет как идейных лидеров Origins, — лежит на официальном YouTube-канале Origins TCG: [«Building Origins AMA»](https://www.youtube.com/watch?v=bEb5RuwY7tg), опубликована 5 октября 2026, длительность 2 часа 22 минуты. Что там прозвучало, от дат рейтингового сезона до причин изменений баланса в 0.7, — в [нашей статье об AMA](/ru/news/building-origins-ama-design-balance).

## Демо в цифрах {#tsifry}

- **Более 20 000 загрузок.** Официальный аккаунт в X написал 7 октября, что демо «уже скачали более 20000 раз»; 24 сентября речь шла о 15 000.
- **Более 300 000 матчей.** 29 сентября основатель и CEO Koin Games Tim Jooste написал, что за 11 недель в демо завершено более 300 000 матчей и почти 1 000 игроков наиграли больше 20 часов.
- **1 500 регистраций на Crimson Cup.** 1 октября он добавил, что за три недели на Crimson Cup записались 1 500 игроков.

Это цифры Koin: проверить их у нас нет возможности.

## Чего мы пока не знаем {#chego-ne-znaem}

- Сколько продлится челлендж колод для ботов: срока в объявлении нет.
- Что за «суперсекретный приз» и сколько колод его получат.
- Как измеряется «лучший результат» (победы, винрейт, число матчей) и будут ли опубликованы результаты.
- Когда присланные колоды начнут появляться в матчах и в каких режимах.
- Относится ли «никаких правил нет» и к сборке колод или только к тому, сколько колод можно отправить.
- День и время следующего тренировочного турнира, перейдёт ли он на вечер будних дней, выбранный в опросе, и результаты второго турнира.

## Источники {#istochniki}

- [Официальный Discord Origins TCG](https://discord.gg/originstcg): челлендж в #announcements 6 октября 2026; тренировочные турниры в #announcements (2 октября) и #game-announcements (6 октября) с двумя опросами; турнир Collector Club и приглашение проводить турниры в #game-announcements (8 октября); первое событие Building Origins в #announcements.
- [Запись AMA](https://www.youtube.com/watch?v=bEb5RuwY7tg) на официальном YouTube-канале.
- Посты в X от [Origins TCG 7 октября](https://x.com/origins_tcg/status/2107853622897705015) и [24 сентября](https://x.com/origins_tcg/status/2103203061707477242), а также от Tim Jooste [29 сентября](https://x.com/TimothyJooste/status/2104979201707192617) и [1 октября](https://x.com/TimothyJooste/status/2105506219679264901).`,
    faq: [
      {
        q: "Как отправить колоду для ботов демо Origins TCG?",
        a: "Через форму из объявления Koin Games от 6 октября 2026 на официальном Discord (forms.gle/zY1WeRTPLQzKAEs26). Можно отправить сколько угодно колод: боты начнут использовать их в матчах, а колоды с лучшим результатом выиграют секретный приз.",
      },
      {
        q: "Есть ли у челленджа колод для ботов срок или известный приз?",
        a: "Пока нет. В объявлении нет срока, не сказано, что за «суперсекретный приз», и не объяснено, как выбираются колоды с лучшим результатом.",
      },
      {
        q: "Когда проходят тренировочные турниры Origins TCG?",
        a: "Они еженедельные и объявляются на официальном Discord. Первый прошёл 3 октября 2026 по правилам Crimson Cup, второй — 10 октября в 16:00 CEST без Conquest. В опросе 6 октября сообщество выбрало вечера будних дней по европейскому времени (19:00 CEST).",
      },
      {
        q: "Можно ли провести собственный турнир по Origins TCG?",
        a: "Да. Koin Games приглашает фанатов, которые хотят проводить турниры, связаться с ней за поддержкой, а на OriginsMeta любой, кто вошёл в аккаунт, может создать турнир в турнирном органайзере, с Conquest или свободными колодами и матчами до одной, двух или трёх побед.",
      },
    ],
  },
  "origins-sets-alpha-edition-grading": {
    title: "Как будут устроены сеты Origins TCG: Alpha Edition, сет каждые 3–4 месяца, грейдинг и бесплатные игровые карты",
    metaTitle: "Сеты Origins TCG: Alpha Edition, грейдинг и тираж",
    description:
      "Сеты Origins TCG: Alpha Edition только на Kickstarter, сет каждые 3–4 месяца, запечатанные бустеры в Steam, оценки от 1 до 10 и бесплатные игровые карты.",
    summary:
      "В трёх постах в X с 29 сентября по 9 октября Koin Games объяснила, как будут устроены сеты и коллекционирование в Origins TCG. В первом сете, Myths and Legends, 218 персонажей; его Alpha Edition будет продаваться только через Kickstarter и не будет переиздаваться, а новые сеты планируются каждые 3–4 месяца, с окном продаж в 3 месяца, коллекционными картами с оценкой состояния и промокартами только для турниров. Игровые карты остаются бесплатными для всех: система коллекционирования, которая ожидается после Steam Next Fest, необязательна.",
    highlights: [
      { label: "Две системы карт", text: "игровые карты бесплатны для всех в каждом сезоне и не обмениваются; коллекционные — отдельные предметы Steam, которыми можно обмениваться", anchor: "dve-sistemy" },
      { label: "Alpha Edition", text: "первое издание Myths and Legends (218 персонажей): только на Kickstarter, с меткой Alpha, без переизданий", anchor: "alpha-edition" },
      { label: "Сет каждые 3–4 месяца", text: "окно продаж в 3 месяца, потом остаются только копии, которые уже есть у коллекционеров", anchor: "novyy-set" },
      { label: "Запечатанные товары в Steam", text: "бустеры, бустер-боксы и кейсы как предметы инвентаря; боксы и кейсы только по предзаказу", anchor: "zapechatannye" },
      { label: "Редкость и грейдинг", text: "пять уровней редкости, карты с ошибкой, оценки от 1 до 10 с половинками: 2 октября Koin сказала, что систему ещё прорабатывает", anchor: "redkost-greyding" },
      { label: "Турнирные карты", text: "никогда не бывают в бустерах: победитель Crimson Cup получит Dracula 1/1", anchor: "turnirnye-karty" },
      { label: "Дефицит — не ценность", text: "Koin приводит в пример первые издания Pokémon и Magic, а потом говорит, что это не формула", anchor: "defitsit" },
    ],
    body: `## Три поста, одна система {#tri-posta}

С 29 сентября по 9 октября 2026 официальный аккаунт Origins TCG в X опубликовал три длинных поста о том, как будут устроены сеты и коллекционирование. Koin Games говорит, что берёт свою модель прежде всего у физических карточных игр: запечатанная продукция, ограниченные тиражи, чёткие периоды выпуска и местные игровые магазины.

Наш [гайд по экономике коллекционирования](/ru/guides/collector-economy) уже рассказывает о форматах Alpha Edition и её семи уровнях редкости по официальной странице предрегистрации. Что добавляют эти посты: размер первого сета, метку Alpha, ритм следующих сетов, запечатанные товары как предметы Steam, слои редкости, как должен работать грейдинг и турнирные карты.

## Две системы карт {#dve-sistemy}

В Origins есть два вида карт, у которых общие персонажи и дизайн, но разные доступ, владение и тираж:

- **Игровые карты.** Каждая базовая игровая карта будет бесплатной для каждого игрока, в каждом сезоне. Ими нельзя обмениваться, они существуют для игры. По словам Koin, «игроку никогда не понадобится покупать бустер или владеть коллекционной версией, чтобы собрать конкурентоспособную колоду»: студия называет это free-to-compete.
- **Коллекционные карты.** Отдельные предметы инвентаря Steam, которыми вы владеете и можете обмениваться. Даже стандартная коллекционная версия выглядит иначе, чем игровая карта: у неё другая рамка и другой вид карты, где на первом плане иллюстрация.

Дефицит, о котором говорит Koin, касается только коллекционной стороны: изданий, обработок арта, оценок, запечатанной продукции и турнирного происхождения. Он «никогда не ограничит доступ к конкурентному пулу карт», а закрытие издания никогда не убирает карту из игры. Что можно купить за деньги, а что нельзя, — в [нашем гайде по free-to-compete](/ru/guides/is-origins-tcg-pay-to-win).

## Myths and Legends и Alpha Edition {#alpha-edition}

Первый сет — **Myths and Legends**, в нём **218 персонажей**. Его первый коллекционный выпуск — **Alpha Edition**, которая будет доступна только через Kickstarter, 27 октября, по словам CEO (подробности — в нашем [гайде по Kickstarter](/ru/guides/origins-tcg-kickstarter)). На лицевой стороне каждой карты Alpha есть **метка Alpha**, так что издание остаётся узнаваемым. Персонаж может вернуться в следующем сете, но не в версии Alpha: когда окно закроется, Koin больше не выпустит, по её словам, ни карт Alpha, ни бустеров, ни бустер-боксов, ни кейсов.

Запуск системы коллекционирования запланирован **после Steam Next Fest** (19–26 октября), и в посте от 9 октября сказано, что всем этим можно будет обмениваться через Steam с «первого дня».

## Новый сет каждые 3–4 месяца {#novyy-set}

Koin планирует новый сет каждые 3–4 месяца. У каждого стандартного сета **окно продаж в 3 месяца**, в течение которого коллекционные карты и запечатанная продукция продаются через Origins, участвующие местные игровые магазины ([Digital LGS Program](/ru/news/digital-lgs-program), представленная 6 октября) и одобренных онлайн-партнёров. После этого остаются только копии, которые уже есть у коллекционеров, и ими можно обмениваться на Торговой площадке Steam.

## Запечатанные товары остаются запечатанными {#zapechatannye}

Бустеры, бустер-боксы и кейсы будут отдельными предметами инвентаря Steam: их можно открыть, обменять или хранить запечатанными. Бустер-боксы и кейсы продаются **только по предзаказу**, поэтому после закрытия этого окна новых запечатанных единиц не появится. По словам Koin, запечатанная продукция остаётся частью коллекции, «а не превращается во временный экран покупки, который исчезает после открытия».

## Редкость, обработки и грейдинг {#redkost-greyding}

Коллекционная карта может отличаться по пяти слоям: издание, редкость, оценка, цифровое состояние и промостатус. Ни один из них не меняет того, что карта делает в матче. В коллекционных бустерах могут быть стандартные коллекционные карты, варианты с **альтернативным артом**, анимированные карты **Storybook** и цифровые **карты с ошибкой**.

О грейдинге два поста говорят по-разному. 29 сентября Koin описывает его как решённый вопрос: содержимое бустера определяется до открытия, а когда коллекционная карта раскрывается, «система выбрасывает её оценку». Грейдинг «автоматический, мгновенный и бесплатный», по центровке, углам, краям и поверхности, а видимые цифровые дефекты объясняют результат. 2 октября тон осторожнее: «Мы прорабатываем цифровую систему грейдинга», в которой оценка складывается из нескольких параметров, а дефекты различаются от карты к карте. Оба поста дают одну и ту же шкалу, **от 1 до 10 с половинками**; остальное ещё может измениться, а в обновлении плейтеста от 1 октября команда попросила игроков пока [не обращать внимания на экран «How Grading Works»](/ru/news/playtest-patch-notes-1001#greyding). Оценка не зависит от редкости и арта, и, по словам Koin, низкие оценки тоже могут быть коллекционными, потому что делают копию более особенной.

## Турнирные карты: Dracula 1/1 {#turnirnye-karty}

Некоторые коллекционные карты никогда не появятся ни в бустерах, ни в магазинах: ультраредкие турнирные промокарты, которые можно получить только за участие в соревнованиях. Первый пример — Crimson Cup: её победитель получит **промокарту Dracula 1/1** и будет, по словам Koin, единственным её владельцем, навсегда. Остальные призы — в нашей [таблице призов Crimson Cup](/ru/news/crimson-cup-prizepool-qualifiers#prizovoy-fond).

## Первые издания и дефицит, по словам Koin {#defitsit}

Пост от 9 октября утверждает, что в физических карточных играх первый тираж становится редкостью, потому что его открывают и играют им ещё до того, как приходит большая аудитория. В качестве примеров он приводит бустер-бокс Pokémon Base Set 1st Edition 1999 года, который в рознице стоил около 100–120 долларов и чьи запечатанные экземпляры, по имеющимся данным, продавались примерно за 10 000 – более 250 000 долларов, и бустер-бокс Magic Alpha 1993 года, около 88 долларов в рознице, чьи запечатанные бустеры, по имеющимся данным, продаются за 8 000–12 000 долларов. Это цифры Koin, а не наши.

Koin и сама добавляет, что эти результаты заняли десятилетия, зависели от того, что обе игры стали огромными, и «не являются формулой», а в посте от 29 сентября сказано, что ограниченный тираж «не гарантирует ни спроса, ни рыночной стоимости, ни роста цены». Мы передаём то, что говорит студия: ничто здесь не повод для покупки. Коллекционирование необязательно, и в Origins можно играть на соревновательном уровне, ничего не тратя.

## Чего мы пока не знаем {#chego-ne-znaem}

- Цены и размеры тиражей Alpha Edition и следующих сетов.
- Будет ли грейдинг работать именно так, как описано 29 сентября, и чем «цифровое состояние» отличается от оценки.
- Какой день считается «первым днём» обмена в Steam и как нынешние коллекционные предметы демо впишутся в новую систему.
- Название и дата второго сета, а также шансы альтернативных артов, анимированных Storybook и карт с ошибкой.
- Как работает окно в 3 месяца между Origins, магазинами и онлайн-партнёрами.

## Источники {#istochniki}

Три поста официального аккаунта Origins TCG в X: [29 сентября](https://x.com/origins_tcg/status/2105048221139747258) (сеты, Alpha Edition, грейдинг), [2 октября](https://x.com/origins_tcg/status/2106087343895486639) (две системы карт и система коллекционирования) и [9 октября 2026](https://x.com/origins_tcg/status/2108619922586898629) (первые издания и тираж). На 11 октября поста в Steam на эти темы нет.`,
    faq: [
      {
        q: "Нужно ли покупать бустеры, чтобы соревноваться в Origins TCG?",
        a: "Нет. По словам Koin Games, каждая базовая игровая карта будет бесплатной для каждого игрока, в каждом сезоне, и игроку никогда не понадобится покупать бустер или владеть коллекционной версией, чтобы собрать конкурентоспособную колоду. Коллекционные карты — отдельные предметы Steam, которыми можно обмениваться, а бустеры необязательны.",
      },
      {
        q: "Что такое Alpha Edition в Origins TCG?",
        a: "Первый коллекционный выпуск Myths and Legends, первого сета Origins, в котором 218 персонажей. Она будет доступна только через Kickstarter, на лицевой стороне каждой карты Alpha есть метка Alpha, и, по словам Koin, после закрытия окна больше не будет выпущено ни карт Alpha, ни бустеров, ни бустер-боксов, ни кейсов.",
      },
      {
        q: "Как будет работать грейдинг карт в Origins TCG?",
        a: "Каждая коллекционная карта получает оценку автоматически при открытии, по шкале от 1 до 10 с половинками. 29 сентября Koin описала грейдинг как автоматический, мгновенный и бесплатный, по центровке, углам, краям и поверхности; 2 октября она сказала, что ещё прорабатывает систему, так что детали могут измениться.",
      },
      {
        q: "Как часто Origins TCG будет выпускать новые сеты?",
        a: "Koin Games планирует новый сет каждые 3–4 месяца. У стандартных сетов окно продаж в 3 месяца через Origins, участвующие игровые магазины и одобренных онлайн-партнёров; после этого копии можно получить только у коллекционеров через Торговую площадку Steam.",
      },
    ],
  },
  "playtest-patch-notes-0-7-1": {
    title: "Патчноут плейтеста Origins TCG 0.7.1: рейтинговые матчи снова идут в миссии, виден муллиган соперника",
    metaTitle: "Патчноут плейтеста Origins TCG 0.7.1",
    description:
      "Плейтест Origins TCG 0.7.1 от 8 октября: рейтинговые матчи снова засчитываются в миссии, виден муллиган соперника, исправлено около 20 багов.",
    summary:
      "8 октября Koin Games обновила плейтест Origins TCG до версии 0.7.1 — небольшое обновление из исправлений и улучшений удобства. Рейтинговые матчи снова засчитываются в прогресс миссий, видно, сколько карт соперник заменил при муллигане, а поиск по коллекции, выбор эмоций и голоса трёх персонажей стали лучше. Изменений баланса нет: характеристики карт остаются такими же, как в патче 0.7.",
    highlights: [
      { label: "Рейтинговый режим снова засчитывается в миссии", text: "а миссии по-прежнему можно проходить в PvE", anchor: "missii-reyting" },
      { label: "Муллиган соперника", text: "видно, сколько карт он заменил", anchor: "mulligan-sopernika" },
      { label: "Более умный поиск по коллекции", text: "фразы из нескольких слов, а призванная карта находит карту, которая её призывает", anchor: "poisk" },
      { label: "Эмоции и голоса", text: "ячейки эмоций можно очищать, новые голоса у Hansel and Gretel, Huck Finn и Christopher Robin", anchor: "emotsii-golosa" },
      { label: "Миссии, главный экран, поле", text: "улучшения удобства и несколько временных заглушек", anchor: "chto-novogo" },
      { label: "Изменений баланса нет", text: "характеристики карт на OriginsMeta не меняются", anchor: "chto-ne-menyaetsya" },
    ],
    body: `## Небольшое обновление для плейтеста {#obnovlenie}

8 октября Koin Games обновила плейтест — отдельную сборку Demo 2.0, в которую попадают через официальный Discord, — до версии 0.7.1. Команда выложила патчноут в канале game-announcements на [официальном Discord](https://discord.gg/originstcg) в 16:54 UTC и на несколько часов отключила сборку, чтобы установить обновление. «Ничего серьёзного, просто несколько исправлений и улучшений удобства», пишет команда: изменений баланса нет, но ряд изменений — то, о чём просили игроки. Оно выходит через неделю после [обновления плейтеста от 1 октября](/ru/news/playtest-patch-notes-1001), в объявлении которого номера версии не было.

## Что нового {#chto-novogo}

### Муллиган соперника {#mulligan-sopernika}

Во время фазы муллигана теперь видно, сколько карт заменил соперник. Игроки просили об этом в Discord, и команда пишет, что идея была настолько хороша, что её реализовали уже на следующий день. [Патч 0.6.1](/ru/news/patch-0-6-1-ranked) уже добавлял во время муллигана предпросмотр Легендарной карты соперника.

### Миссии, главный экран и остальное {#missii-glavnyy-ekran}

- **Missions, Bosses и Rewards** получают несколько улучшений удобства, как и **главный экран**. Каких именно, патчноут не говорит.
- **Командиры**, как их называет патчноут, теперь произносят реплику и показывают свою плашку с именем, когда вы их рассматриваете.
- **Эффекты поля:** клики по полю теперь вызывают визуальные и звуковые эффекты. Команда говорит, что и то и другое — временные заглушки, и просит игроков не судить о них слишком строго.
- **Вступительный ролик:** проигрывается временное вступительное видео, и команда знает, что оно ещё очень сырое.

## Улучшения {#uluchsheniya}

### Рейтинговый режим снова засчитывается в миссии {#missii-reyting}

С обновлением от 1 октября миссии стали только PvE, и в той сборке миссии колод нельзя было выполнить в рейтинговом режиме: команда обещала вернуть это в одной из следующих сборок ([наша статья](/ru/news/playtest-patch-notes-1001#missii-i-reyting)). С 0.7.1 рейтинговые PvP-матчи снова засчитываются в прогресс миссий. Если хотите, миссии по-прежнему можно проходить в PvE из раздела Missions: выбор за вами. Как устроен рейтинговый режим в демо — в [нашем гайде по рейтинговому режиму](/ru/guides/origins-tcg-ranked).

### Поиск по коллекции {#poisk}

Поиск по коллекции теперь принимает фразы из нескольких слов, а поиск того, что призывает карта, находит и саму карту, которая это призывает. На OriginsMeta поиск в [Картах](/ru/cards) и в [конструкторе колод](/ru/deck-builder) уже смотрит на названия и текст карт.

### Эмоции и голоса {#emotsii-golosa}

- В выборе эмоций теперь можно очистить ячейку, так что настраивать эмоции стало немного проще.
- У Hansel and Gretel, Huck Finn и Christopher Robin новые голоса. Игроки говорили, что они звучат слишком взросло для этих персонажей, и команда пишет, что внутри студии все говорили то же самое.

### Около 20 исправленных багов {#bagi}

По подсчётам команды, исправлено около 20 багов. Патчноут их не перечисляет, и команда ждёт в Discord отзывов и сообщений обо всём, что она упустила.

## Что не меняется {#chto-ne-menyaetsya}

- **Изменений баланса нет.** Характеристики карт остаются такими же, как в [патче 0.7](/ru/news/patch-0-7) от 29 сентября, последнем патче баланса перед Crimson Cup: страницы карт, [конструктор колод](/ru/deck-builder) и [MetaShifting](/ru/metashifting) не меняются.
- **Плейтест — это не основное демо.** Эти изменения есть в сборке плейтеста; демо в Steam, о котором рассказывает [наш гайд по игре в демо](/ru/guides/play-the-demo), остаётся на своей версии, пока Koin его не обновит.

## Чего мы пока не знаем {#chego-ne-znaem}

- Когда изменения 0.7.1 дойдут до основного демо в Steam.
- Какие баги исправлены: в патчноуте только число, около 20.
- Что именно меняется в Missions, Bosses, Rewards и на главном экране.
- Когда эффекты поля и вступительный ролик, пока временные заглушки, станут окончательными.

## На той же неделе: тренировочный турнир #2 {#trenirovochnyy-turnir}

В том же канале команда объявила второй тренировочный турнир на субботу, 10 октября, в 14:00 UTC (16:00 CEST): пять раундов по швейцарской системе, матчи до двух побед, без выбывания и, в отличие от первого, без Conquest, так что колоды подавать не нужно. Еженедельные тренировочные турниры Koin объявила 5 октября ([наша статья](/ru/news/crimson-cup-prizepool-qualifiers#trenirovochnye-turniry)).

## Источники {#istochniki}

Патчноут 0.7.1, который команда выложила на [официальном Discord Origins TCG](https://discord.gg/originstcg) 8 октября 2026 в канале game-announcements. На 11 октября поста в Steam об этом обновлении нет: последний вышел 5 октября.`,
    faq: [
      {
        q: "Засчитываются ли рейтинговые матчи в миссии плейтеста Origins TCG?",
        a: "Да, снова, с плейтеста 0.7.1 от 8 октября 2026: рейтинговые PvP-матчи двигают прогресс миссий. Миссии по-прежнему можно проходить в PvE из раздела Missions. В сборке от 1 октября миссии колод нельзя было выполнить в рейтинговом режиме.",
      },
      {
        q: "Меняет ли плейтест 0.7.1 характеристики карт?",
        a: "Нет. Изменений баланса в нём нет: характеристики карт остаются такими же, как в патче 0.7 от 29 сентября 2026, последнем патче баланса перед Crimson Cup, и страницы карт на OriginsMeta не меняются.",
      },
      {
        q: "Виден ли муллиган соперника в Origins TCG?",
        a: "В плейтесте, начиная с 0.7.1, видно, сколько карт соперник заменил во время фазы муллигана. Когда это изменение дойдёт до основного демо в Steam, мы пока не знаем.",
      },
    ],
  },
  "upgrade-meta-1013": {
    title: "Upgrade Meta: спасибо за почти 200 матчей, а OriginsMeta Tracker 0.4.1 позволяет создать свой макет",
    metaTitle: "OriginsMeta Tracker 0.4.1 для Origins TCG",
    description:
      "Спасибо за отзывы и почти 200 матчей за один день. OriginsMeta Tracker 0.4.1 для Origins TCG: четыре макета панелей, страница Setup и исправления.",
    summary:
      "Спасибо: 12 октября вы прислали нам множество отзывов и записали почти 200 матчей с OriginsMeta Tracker, хотя серверы игры большую часть дня то работали, то нет. Эти матчи уже в Analytics. Вышла версия 0.4.1 с тем, о чём вы просили: четыре макета панелей на выбор, панели только во время матча, страница Setup и исправления ошибок, о которых вы сообщили.",
    highlights: [
      { label: "Спасибо", text: "почти 200 матчей записано 12 октября", anchor: "spasibo" },
      { label: "Создайте свой макет", text: "четыре стиля панелей: Classic, Minimal, Structured и Custom", anchor: "maket" },
      { label: "Только во время матча", text: "панели появляются в первом раунде и исчезают в конце", anchor: "v-matche" },
      { label: "Setup", text: "на главной странице только ваша игра", anchor: "setup" },
      { label: "Исправления", text: "в Deck tracker больше нет пустой ячейки, изменения колоды видны сразу", anchor: "ispravleniya" },
    ],
    body: `## Спасибо {#spasibo}

За один день вы прислали нам множество отзывов — в наш Discord и через сайт, — а 12 октября записали с OriginsMeta Tracker **почти 200 матчей**, хотя серверы игры большую часть дня то падали, то поднимались. Каждый матч попадает в винрейты в [Analytics](/ru/analytics): Легендарные карты, колоды сообщества, архетипы и карты, патч за патчем, только общие итоги. Многие изменения, описанные ниже, пришли прямо из ваших сообщений.

## Создайте свой макет {#maket}

У панелей поверх игры теперь четыре стиля: они открываются новой кнопкой **Create your layout** рядом с названием вашей колоды.

- **Classic**: ваша колода в столбце слева, Легендарная карта — полосой, как в нашем [конструкторе колод](/ru/deck-builder); Легендарная карта соперника и раскрытые им карты — в полосе справа вверху.
- **Minimal**: две полосы — ваши 12 карт и Легендарная карта слева внизу рядом с вашей рукой, карты соперника справа вверху.
- **Structured**: два столбца по краям; справа, над панелью маны игры, — карты соперника, карты, оставшиеся в его колоде, и мана обоих игроков с направлением боя.
- **Custom**: вы сами выбираете вертикальное или горизонтальное расположение, карты с рисунком или только названия в строку, число карт в ряду, прозрачность фона, исчезают ли разыгранные карты и что показывает каждая панель.

Каждый стиль запоминает, где вы расположили его панели, а источник для OBS следует выбранному стилю.

## Панели только во время матча {#v-matche}

Новая опция показывает панели только пока вы играете: они появляются в первом раунде и исчезают примерно через 30 секунд после конца матча, в том числе в источнике для OBS. Для этого нужен сканер экрана: если сканер выключен, панели остаются на экране.

## Setup и более чистая главная страница {#setup}

Главная страница приложения теперь показывает только вашу игру: выбранную колоду, ваши цифры, матчи и результаты. Аккаунт, сканер экрана, панели и настройки приложения находятся за кнопкой **Setup**. Обучение запустится ещё раз для всех, чтобы показать, куда что переехало.

## Исправления и обновления {#ispravleniya}

- Внизу Deck tracker больше нет пустой ячейки: это была заглушка, которую игра хранит в некоторых колодах, а не карта.
- Колода, которую вы меняете в игре, сразу обновляется в трекере, без ожидания следующего матча.
- Когда выходит новая версия, заметное уведомление просит подождать с запуском игры: приложение обновляется только при закрытой игре.

[Руководство по установке](/ru/tracker#ustanovka) на странице Tracker теперь состоит из пяти коротких шагов.

## Как обновиться {#kak-obnovitsya}

Если OriginsMeta Tracker у вас уже есть, он сам обновится до 0.4.1 при закрытой игре. Если вы новичок, скачайте его на [странице Tracker](/ru/tracker): аккаунт OriginsMeta бесплатный.

OriginsMeta — неофициальный фан-сайт, не связанный с Koin Games.`,
    faq: [
      { q: "Как изменить стиль панелей OriginsMeta Tracker?", a: "Нажмите Create your layout рядом с названием вашей колоды на главной странице приложения: откроется Setup с четырьмя стилями (Classic, Minimal, Structured и Custom). Открытые панели откроются заново в новом стиле." },
      { q: "Нужно ли заново скачивать OriginsMeta Tracker 0.4.1?", a: "Нет: если приложение у вас уже есть, оно само обновится до 0.4.1 при закрытой игре. Новые игроки скачивают его на странице Tracker с бесплатным аккаунтом OriginsMeta." },
    ],
  },
  "upgrade-meta-1012": {
    title: "Upgrade Meta: OriginsMeta Tracker 0.4.0 для всех, винрейты открыты в Analytics и новое меню",
    metaTitle: "OriginsMeta Tracker 0.4.0 для Origins TCG",
    description:
      "OriginsMeta Tracker 0.4.0 доступен всем с бесплатным аккаунтом: он записывает ваши матчи в Origins TCG, а его винрейты открыты для всех в Analytics.",
    summary:
      "OriginsMeta Tracker, наше приложение для Windows, которое записывает ваши матчи в Origins TCG, теперь доступно всем с бесплатным аккаунтом OriginsMeta: версию 0.4.0 можно скачать на странице Tracker. Собранные им винрейты открыты для всех в новом разделе Analytics, а меню меняется: Гайды, Карты и Локации теперь находятся в разделе База данных.",
    highlights: [
      { label: "OriginsMeta Tracker для всех", text: "версия 0.4.0, новое имя OriginsMeta Analytics, на странице Tracker", anchor: "tracker" },
      { label: "Только с аккаунтом", text: "аккаунт бесплатный, и приложение работает только в связке с ним", anchor: "akkaunt" },
      { label: "Винрейты в Analytics", text: "Легендарные карты, колоды, архетипы и карты, открыто для всех", anchor: "analytics" },
      { label: "Новое меню", text: "База данных с Гайдами, Картами и Локациями; Analytics с Tracker", anchor: "menyu" },
    ],
    body: `## OriginsMeta Tracker для всех {#tracker}

До вчерашнего дня OriginsMeta Analytics, наше приложение для Windows для Origins TCG, тестировали Creator, Авторы, игроки Pro и Staff ([выпуск от 11 октября](/ru/news/upgrade-meta-1011)). С сегодняшнего дня оно называется **OriginsMeta Tracker**, и скачать его может любой: версия 0.4.0 есть на [странице Tracker](/ru/tracker) вместе с [пошаговым руководством по установке](/ru/tracker#ustanovka).

Оно делает то же, что и раньше: само записывает ваши матчи через несколько секунд после конца, считывает разыгранные карты из окна игры с помощью сканера экрана, показывает Deck tracker в реальном времени с картами соперника и добавляет оверлей для OBS. Оно никогда не вмешивается в игру, и ни одно изображение не покидает ваш ПК.

## Только с аккаунтом OriginsMeta {#akkaunt}

Чтобы скачать приложение, войдите в OriginsMeta: аккаунт бесплатный. Приложение работает только в связке с вашим аккаунтом: после установки создайте код на [странице Tracker в вашем аккаунте](/ru/account/tracker) и введите его в приложении. Приложение проверяет связку при запуске и каждые 4 часа, отправляя только свой токен.

Если приложение у вас уже есть, скачивать его заново не нужно: оно само обновится до версии 0.4.0, а затем попросит связать аккаунт, если вы этого ещё не сделали.

## Винрейты для всех в Analytics {#analytics}

Винрейты, рассчитанные по матчам, записанным приложением, теперь открыты для всех в [Analytics](/ru/analytics): Легендарные карты, колоды сообщества, архетипы, карты, матчапы между Легендарными картами и Легендарные карты, с которыми вы сталкиваетесь чаще всего, патч за патчем. Только общие итоги: никогда имена, отдельные матчи или то, кто их сыграл. Колоды сообщества показывают винрейт своего точного списка на своей странице и в [списке колод](/ru/decks).

До вчерашнего дня эти цифры были вкладкой «Win rate» в тир-листе: старый адрес теперь ведёт в Analytics.

## Новое меню {#menyu}

Верхнее меню меняется, чтобы освободить место: **База данных** объединяет [Гайды](/ru/guides), [Карты](/ru/cards) и [Локации](/ru/locations), а в **Analytics** находятся винрейты и страница [Tracker](/ru/tracker). На телефоне всё это есть в Меню.

OriginsMeta — неофициальный фан-сайт, не связанный с Koin Games.`,
    faq: [
      { q: "Как скачать OriginsMeta Tracker?", a: "Войдите в OriginsMeta (аккаунт бесплатный), откройте страницу Tracker и нажмите кнопку загрузки. Руководство по установке на той же странице объясняет каждый шаг, от распаковки zip-архива до связки приложения с вашим аккаунтом." },
      { q: "Можно ли пользоваться OriginsMeta Tracker без аккаунта?", a: "Нет: начиная с версии 0.4.0 приложение работает только в связке с аккаунтом OriginsMeta. Оно проверяет связку при запуске и каждые 4 часа, отправляя только свой токен." },
      { q: "Где на OriginsMeta винрейты Origins TCG?", a: "В разделе Analytics в верхнем меню: винрейты Легендарных карт, колод сообщества, архетипов и карт, патч за патчем, по матчам, записанным с OriginsMeta Tracker." },
    ],
  },
  "upgrade-meta-1011": {
    title: "Upgrade Meta: OriginsMeta Analytics 0.3.4 — трекер матчей Origins TCG с Deck tracker в реальном времени",
    metaTitle: "OriginsMeta Analytics 0.3.4: трекер для Origins TCG",
    description:
      "OriginsMeta Analytics 0.3.4: приложение для Windows, которое записывает матчи Origins TCG, с Deck tracker и картами соперника. Скоро для всех.",
    summary:
      "Вышла OriginsMeta Analytics 0.3.4 — версия, которая завершает эту неделю работы над нашим приложением для Windows для Origins TCG. Оно само записывает ваши матчи, пока вы играете, считывает карты из окна игры и показывает Deck tracker в реальном времени: вашу колоду с вытянутыми картами, карты, оставшиеся в колоде, здоровье вашего героя и карты соперника по мере их появления. Сегодня его тестируют Creator, Авторы, игроки Pro и Staff; скоро оно будет доступно всем.",
    highlights: [
      { label: "Ваши матчи записываются", text: "результат, колода, раунды, карты, разыгранные обеими сторонами, и Легендарная карта соперника — сами, через несколько секунд после конца", anchor: "matchi" },
      { label: "Deck tracker в реальном времени", text: "ваши 12 карт темнеют, когда вы их тянете, плюс Легендарная карта, карты в колоде и здоровье героя", anchor: "deck-tracker" },
      { label: "Карты соперника", text: "его Легендарная карта, его здоровье и раскрытые им карты, одна за другой", anchor: "sopernik" },
      { label: "Полный экран или окно", text: "любой размер, демо и плейтест, обновляется само", anchor: "ekran" },
      { label: "Скоро для всех", text: "сегодня его тестируют Creator, Авторы, игроки Pro и Staff", anchor: "dlya-vsekh" },
    ],
    body: `## Версия 0.3.4 {#versiya}

OriginsMeta Analytics — наше приложение для Windows для Origins TCG: оно записывает ваши матчи, пока вы играете, и в реальном времени показывает, что происходит в вашей колоде. Версия 0.3.4, вышедшая 11 октября 2026 года, завершает неделю работы, за которую приложение научилось считывать матчи из окна игры, ведь начиная с патча 0.7 игра больше не сохраняет данные матча на вашем ПК. Это всё ещё тестовая версия: скриншот на обложке взят из настоящего матча в Demo 2.0, поверх него две панели приложения показывают то, что они считали в тот момент (раунд 7), а имена игроков убраны.

## Ваши матчи записываются сами {#matchi}

Вы открываете приложение, играете, и через несколько секунд после конца матч оказывается в вашей истории: результат, колода, выбранная в игре, раунды, карты, разыгранные вами и соперником раунд за раундом, и Легендарная карта соперника с экрана VS. Если связать приложение с аккаунтом OriginsMeta, ваши матчи будут и на сайте.

Чтобы считывать карты, приложение использует **сканер экрана**: он следит только за окном Origins TCG, распознаёт карты на вашем ПК и никуда не отправляет изображения. На сайт попадают только ID карт, никогда имена игроков. Приложение никогда не вмешивается в игру: никаких записанных файлов, никакого чтения памяти, ничего, что меняло бы игру.

## Deck tracker в реальном времени {#deck-tracker}

Новый Deck tracker придумал Davdas, чтобы на него можно было бросить быстрый взгляд, а не читать: ваши 12 карт крупно, в сетке 4 × 3 по стоимости. Карта тускнеет, когда вы вытянули одну из двух её копий («1/2»), и темнеет, когда вытянули обе: приложение считывает и карты у вас в руке. Ниже — ваша Легендарная карта отдельно (она темнеет с увеличением в тот момент, когда вы её тянете), карты, оставшиеся в колоде, и здоровье вашего героя — два сегмента кольца под героем.

![Deck tracker во время матча в Demo 2.0: вытянутые карты затемнены, в колоде осталось 8 карт, 2 сегмента здоровья](/media/analytics/deck-tracker-me.webp)

## Карты соперника {#sopernik}

Вторая панель, чуть меньше, — для соперника: его Легендарная карта, его здоровье и карты, которые он раскрывает; они появляются одна за другой по ходу матча. Панель начинается пустой и никогда не показывает пустых ячеек.

![Панель соперника: Dracula, остался один сегмент здоровья, раскрыты Quasimodo и Captain Ahab](/media/analytics/deck-tracker-opp.webp)

Обе панели остаются поверх игры, без рамки Windows: перетаскивайте их куда угодно, растягивайте за края — прокручивать их никогда не придётся. Эти же панели служат источником «Браузер» для OBS для тех, кто стримит.

## Полный экран или окно, демо и плейтест {#ekran}

Приложение работает с Origins TCG в полноэкранном режиме или в окне любого размера и формы, при любом масштабировании Windows, со Steam-демо и с плейтестом. Когда мы публикуем новую версию, оно само скачивает её и перезапускается обновлённым — никогда во время матча.

## Скоро для всех {#dlya-vsekh}

Сегодня OriginsMeta Analytics тестируют Creator, Авторы, игроки Pro и Staff сайта: они играют с приложением каждый день и рассказывают нам, что не работает. Скоро его сможет скачать любой, вместе со страницами винрейтов, которые будут использовать матчи тех, кто связал приложение (только общие итоги, никогда — кто играл). Дату мы объявим здесь и в [нашем Discord](https://discord.gg/RAG7nnrNGP).

OriginsMeta — неофициальный фан-сайт, не связанный с Koin Games.`,
    faq: [
      { q: "Когда приложение OriginsMeta Analytics станет доступно всем?", a: "Скоро: сегодня его тестируют Creator, Авторы, игроки Pro и Staff. Дату мы объявим в новостях и в Discord OriginsMeta." },
      { q: "Приложение OriginsMeta Analytics меняет или читает игру?", a: "Оно никогда не вмешивается в игру: считывает только изображение окна Origins TCG и файлы, которые игра сохраняет на вашем ПК, ничего не записывая. Изображения остаются на вашем ПК, а на сайт попадают только ID карт, никогда имена игроков." },
      { q: "Работает ли оно в полноэкранном режиме и в окне?", a: "Да, начиная с версии 0.3.4: полный экран или окно любого размера и формы, при любом масштабировании Windows, со Steam-демо и с плейтестом." },
    ],
  },
  "upgrade-meta-1007": {
    title: "Upgrade Meta: OriginsMeta заговорил по-французски — четвёртый язык сайта: все карты, гайды и новости",
    metaTitle: "Upgrade Meta: OriginsMeta для Origins TCG на французском",
    description:
      "OriginsMeta теперь на французском: интерфейс, новости, гайды, 230 карт, 44 локации, конструктор колод и тир-листы, а тексты карт прочитаны в игре.",
    summary:
      "С 7 октября 2026 года OriginsMeta доступен и на французском: интерфейс, новости, 20 гайдов, 230 карт, 44 локации, FAQ, события, MetaShifting, конструктор колод, тир-листы и страницы сообщества — на originsmeta.com/fr, с теми же адресами, что и на других языках. С 8 октября французские тексты карт — официальные тексты игры, прочитанные в игре карта за картой. Гайды колод, гайды сообщества и комиксы переводятся на французский автоматически, а если вы читаете по-французски и заметили ошибку, напишите нам.",
    highlights: [
      { label: "Французский уже здесь", text: "весь сайт на /fr: интерфейс, новости, гайды, карты, локации, FAQ, события, MetaShifting, конструктор колод, тир-листы и сообщество", anchor: "frantsuzskiy" },
      { label: "Тексты карт теперь из игры", text: "с 8 октября французские страницы карт показывают официальный текст, прочитанный в игре, а весь сайт использует ключевые слова игры", anchor: "teksty-kart" },
      { label: "Сообщество на французском", text: "гайды колод, гайды сообщества и комиксы переводятся автоматически, турниры на французском, Discord со ссылкой на французскую страницу", anchor: "soobshchestvo" },
      { label: "Почему французский", text: "игра переведена на французский, и после испанского это четвёртый язык сайта", anchor: "pochemu-frantsuzskiy" },
      { label: "Помогите нам", text: "если вы читаете по-французски и заметили ошибку, напишите нам: кнопкой обратной связи или в нашем Discord", anchor: "pomoshch" },
    ],
    body: `## Французский уже здесь {#frantsuzskiy}

С 7 октября 2026 года OriginsMeta доступен и на французском — четвёртом языке сайта после английского, итальянского и испанского. Язык переключается кнопками EN · IT · ES · FR вверху каждой страницы (на телефоне — в Меню). Каждая страница сохраняет тот же адрес, что и на других языках, с префиксом /fr/: originsmeta.com/fr/cards, /fr/guides, /fr/deck-builder. Если ваш браузер настроен на французский, originsmeta.com сразу ведёт на французскую версию, а hreflang и sitemap перечисляют четыре версии каждой страницы.

Что есть на французском: интерфейс, 32 опубликованные на тот момент новости, 20 [гайдов](/ru/guides), страницы 230 [карт](/ru/cards) (текст карты и заметка о происхождении), 44 [локации](/ru/locations), [FAQ](/ru/faq), [события](/ru/tournaments), история баланса ([MetaShifting](/ru/metashifting)), [конструктор колод](/ru/deck-builder), [тир-листы](/ru/tier-list) и страницы сообщества. Мы пишем на стандартном французском, понятном во всех франкоязычных странах, а названия карт остаются на английском, как в игре.

Французский уже был в первой версии сайта в сентябре 2026 года и был убран 15 сентября: он возвращается, переделанный с нуля, по тем же правилам SEO, что и другие языки (один H1 на страницу, свои title и description, внутренние ссылки, структурированные данные).

## Тексты карт на французском: из игры, с 8 октября {#teksty-kart}

Обновление от 8 октября: мы прочитали карты в игре на французском. 122 карты коллекции Demo 2.0 теперь показывают на своих страницах официальный французский текст, как на итальянском и испанском, а весь сайт (страницы карт, теги ключевых слов, гайды, новости, конструктор колод) использует ключевые слова игры. Три из них отличаются от предварительного глоссария, с которого мы начинали: First Strike — это «Première frappe» (а не «Initiative»), ячейка на поле — «case», а персонажи Evil в тексте правил — «Mauvais». Созданные и удалённые карты, которых нет в коллекции игры, по-прежнему в нашем переводе, теперь с глоссарием игры, и их страницы об этом говорят. 44 локации пока не проверены в игре ни на одном языке.

Когда 7 октября появился французский, тексты карт были переводом OriginsMeta, сделанным по предварительному глоссарию ключевых слов (On Reveal «À la révélation», Shield «Bouclier», Trample «Piétinement», Deathtouch «Contact mortel», Defender «Défenseur», First Strike «Initiative»), и каждая французская страница карты об этом сообщала.

## Сообщество на французском {#soobshchestvo}

То, что публикует сообщество, тоже переводится на французский — автоматически, после публикации, как это уже происходит между английским, итальянским и испанским: гайды опубликованных колод (одиночных и турнирных), гайды сообщества и комиксы креаторов. Переводы того, что уже есть на сайте, появятся в ближайшие дни. Турниры тоже можно создавать на французском, а [наш Discord](https://discord.gg/RAG7nnrNGP) анонсирует новые материалы в том числе со ссылкой на французскую страницу.

## Почему французский {#pochemu-frantsuzskiy}

Origins TCG переведена на французский: на странице игры в Steam французский указан среди 13 языков интерфейса (полная озвучка есть только на английском). После [испанского, появившегося 25 сентября](/ru/news/upgrade-meta-0925), французский стал четвёртым языком OriginsMeta по той же причине: нас должны читать на тех языках, на которых говорит игра.

## Помогите нам не ошибиться {#pomoshch}

Если вы читаете по-французски и нашли ошибку, неуклюжую фразу или ключевое слово, которое не совпадает с игрой, сообщите нам: кнопкой обратной связи на любой странице или в нашем Discord. Мы читаем всё и исправляем в следующем обновлении.`,
    faq: [
      { q: "Есть ли OriginsMeta на французском?", a: "Да, с 7 октября 2026 года: весь сайт, с гайдами, новостями, картами, локациями, тир-листами и конструктором колод. Язык переключается кнопками EN · IT · ES · FR вверху страницы; гайды колод сообщества, гайды и комиксы переводятся автоматически." },
      { q: "Французские тексты карт официальные?", a: "Да, с 8 октября 2026 года: мы прочитали 122 карты коллекции Demo 2.0 в игре на французском, и их страницы показывают официальный текст, как на итальянском и испанском (прочитанных 25 сентября). Созданные и удалённые карты, которых нет в коллекции игры, по-прежнему в нашем переводе с глоссарием игры, и их страницы об этом говорят." },
      { q: "Переводятся ли колоды и гайды сообщества на французский?", a: "Да, автоматически после публикации: гайды опубликованных колод, гайды сообщества и комиксы креаторов. Переводы того, что уже есть на сайте, появятся в ближайшие дни, а турниры тоже можно создавать на французском." },
    ],
  },
  "upgrade-meta-1005": {
    title: "Upgrade Meta: турнирные колоды — три колоды Conquest, опубликованные вместе с одним гайдом",
    metaTitle: "Upgrade Meta: турнирные колоды Origins TCG",
    description:
      "Новое на OriginsMeta: турнирные колоды — три колоды Conquest для Origins TCG, опубликованные вместе с одним гайдом, а правила Crimson Cup сайт проверит сам.",
    summary:
      "В разделе Колоды теперь две части: одиночные колоды и турнирные колоды. Турнирная колода — это набор из трёх колод Conquest, опубликованных вместе с одним гайдом, который объясняет, как они работают в команде, а сайт проверяет за вас правила Crimson Cup перед публикацией.",
    highlights: [
      { label: "Турнирные колоды", text: "три колоды Conquest и один гайд на одной странице, в разделе Колоды", anchor: "turnirnye-kolody" },
      { label: "Как опубликовать", text: "турнирный режим в конструкторе колод, затем «Опубликовать 3 колоды»", anchor: "publikatsiya" },
      { label: "Правила Conquest", text: "три разные Легендарные карты и не меньше 8 разных карт между любыми двумя колодами", anchor: "pravila" },
      { label: "Страница набора", text: "роль каждой колоды, три кода игры, оценки и переведённый гайд", anchor: "stranitsa-nabora" },
      { label: "Для стримеров", text: "короткая ссылка, команда чата !deck, оверлей для OBS и изображение вашего набора", anchor: "dlya-strimerov" },
    ],
    body: `## Турнирные колоды {#turnirnye-kolody}

На турнир Conquest, такой как Crimson Cup, вы приносите не одну колоду, а три. До сих пор на OriginsMeta были только одиночные колоды, поэтому набор из трёх приходилось публиковать тремя отдельными страницами, каждую со своим гайдом. Теперь в меню [Колоды](/ru/decks) две части: **Одиночные колоды** и **[Турнирные колоды](/ru/decks/tournament)**.

Турнирная колода — это три колоды, опубликованные вместе, с **одним гайдом** на весь набор: план игры для трёх колод и роль каждой из них (когда её выбирать, какие матчапы она закрывает), а также сильные и слабые стороны, матчапы и заметки, если вы захотите их добавить.

## Как опубликовать турнирную колоду {#publikatsiya}

1. Откройте [конструктор колод](/ru/deck-builder) и переключитесь на **Турнир (3 колоды)**. Кнопка «Опубликовать турнирную колоду» на странице [Турнирные колоды](/ru/decks/tournament) открывает его сразу в этом режиме.
2. Соберите колоды A, B и C. Таблица под колодами показывает, сколько разных карт у каждой пары.
3. Когда три колоды готовы и соответствуют правилам, нажмите **Опубликовать 3 колоды**.
4. Дайте набору название, напишите план игры и роль каждой колоды и опубликуйте.

Для этого нужно [войти](/ru/login). Ваши турнирные колоды есть в [вашем аккаунте](/ru/account), где их можно редактировать, скрывать или удалять, и в вашем публичном профиле. Каждый аккаунт может опубликовать столько же турнирных колод, сколько одиночных (5 для аккаунтов Community, 20 для Авторов, без ограничений для Creator, игроков Pro и Staff), счёт ведётся отдельно.

## Правила Conquest проверяются за вас {#pravila}

Каждый набор следует правилам Crimson Cup — тем же, что уже использует конструктор колод:

- **три разные Легендарные карты**, по одной на колоду;
- **не меньше 8 разных уникальных карт между любыми двумя колодами**: каждая карта считается один раз, включая Легендарную, поэтому у двух колод может быть не больше 5 общих карт.

Если набор им не соответствует, кнопка остаётся неактивной, а конструктор колод подсказывает, что не так; при публикации сайт проверяет всё ещё раз. Наш [гайд по Conquest](/ru/guides/origins-tcg-conquest) объясняет, как собрать три колоды, которые держатся вместе.

## Страница набора {#stranitsa-nabora}

- Вверху план игры, затем **три колоды**: для каждой её роль в наборе, карты целиком, **код игры** для вставки в Origins TCG и «Открыть в конструкторе колод».
- Блок с правилами Conquest и разными картами между каждой парой колод.
- **Оценки** от 1 до 5 звёзд, как у одиночных колод (свой набор оценивать нельзя).
- Гайд пишется на одном языке и **автоматически переводится** на два других.
- При публикации набор сразу появляется в нашем [Discord](https://discord.gg/RAG7nnrNGP), в #community-decks, а ваши подписчики получают уведомление, если вы Creator, Автор, игрок Pro или Staff.
- В аккаунте вы видите посещения, скопированные коды и клики по вашим наборам: это оценки, как и у одиночных колод.

## Для стримеров {#dlya-strimerov}

У каждой турнирной колоды те же инструменты, что и у одиночных, в меню «Для стримеров» на её странице:

- **короткая ссылка** originsmeta.com/d/ и код набора, чтобы назвать её в эфире;
- **команда чата !deck** для Nightbot, StreamElements и Fossabot, которая пишет в чат набор и три его Легендарные карты;
- **оверлей для OBS** с тремя колодами, вертикальный или горизонтальный;
- **изображение** набора для скачивания в 16:9 или 9:16.

Команда и оверлей показываются только тому, кто опубликовал набор. [Гайд для стримеров](/ru/guides/streaming-tools) шаг за шагом объясняет, как их добавить.

## Присоединяйтесь {#prisoedinyaytes}

Соберите три колоды в [конструкторе колод](/ru/deck-builder), опубликуйте их и отправьте ссылку своей команде до турнира. Станьте одним из первых, кто опубликует набор в разделе [Турнирные колоды](/ru/decks/tournament).`,
    faq: [
      { q: "Как опубликовать три колоды Conquest вместе на OriginsMeta?", a: "В конструкторе колод переключитесь на турнирный режим, соберите колоды A, B и C с тремя разными Легендарными картами и не меньше 8 разными картами между любыми двумя колодами, затем нажмите «Опубликовать 3 колоды» и напишите один гайд для набора." },
      { q: "Соответствуют ли турнирные колоды правилам Crimson Cup?", a: "Да. В каждом наборе три разные Легендарные карты и не меньше 8 разных уникальных карт между любыми двумя колодами, включая Легендарную. Конструктор колод и сайт проверяют это до того, как набор появится на сайте." },
    ],
  },
  "upgrade-meta-1003": {
    title: "Upgrade Meta: драфт против Мозга, версии колод, сохранённые колоды и новые фильтры карт",
    metaTitle: "Upgrade Meta: драфт и версии колод Origins TCG",
    description:
      "Новое на OriginsMeta: драфт Origins TCG против нашего бота или друга, обновление колод до патча 0.7, сохранённые колоды и колоды в тренде, фильтры карт.",
    summary:
      "За последние дни на OriginsMeta появился бесплатный драфт Origins TCG против нашего бота или против друга, а опубликованные колоды теперь можно обновить до патча 0.7, не теряя названия, гайда и оценок. Ещё можно сохранять понравившиеся колоды, находить колоды в тренде, фильтровать карты по стоимости, ключевому слову, силе и здоровью и смотреть карты, изменённые каждым патчем, до и после.",
    highlights: [
      { label: "Драфт", text: "три формата против Мозга, нашего бота, или против друга в онлайн-комнате", anchor: "draft" },
      { label: "Версии колод", text: "обновите опубликованную колоду до патча 0.7, сохранив её название, гайд и ссылку", anchor: "versii-kolod" },
      { label: "Сохранённые колоды и колоды в тренде", text: "кнопка сохранения, сортировки «В тренде» и «Чаще сохраняют» и фильтр по версии игры", anchor: "sokhranennye-kolody" },
      { label: "Карты и MetaShifting", text: "фильтры по стоимости, ключевому слову, силе и здоровью и каждый патч до и после", anchor: "karty" },
      { label: "OriginsMeta Analytics", text: "наш трекер матчей, на паузе с патча 0.7: скажите, если он вам нужен", anchor: "analytics" },
      { label: "Вход и профиль", text: "код из письма рядом со ссылкой и отдельная страница для вашего публичного профиля", anchor: "vkhod-i-profil" },
      { label: "Гайды и комиксы", text: "гайд по инструментам для стримов и комиксы, нарисованные на нескольких языках", anchor: "gaydy-i-komiksy" },
    ],
    body: `## Драфт против Мозга или друга {#draft}

[Драфт](/ru/draft) — бесплатный способ собрать колоду Origins TCG из карт, которые вы выбираете по одной. Вы выбираете свою Легендарную карту и свои карты, а затем собираете колоду по правилам игры (1 Легендарная карта и 12 карт, каждая считается дважды: 25 карт). Форматов три:

- **Обмен**: вы видите 3 карты, одну оставляете себе, одну отдаёте сопернику, а третья сгорает.
- **Трио**: 3 общие карты, сначала выбирает один игрок, потом другой, а третья сгорает. Вы видите всё, что берёт соперник.
- **Бустеры**: бустеры по 6 карт, которые вы передаёте друг другу, как в бумажной TCG. Выбор соперника вы не видите.

**Против Мозга** можно играть сразу, без аккаунта: Мозг — наш бот, и он знает только то, что знал бы игрок на его месте. **Против друга** вы создаёте комнату и отправляете ссылку или код: драфт начинается, как только друг присоединится, с таймером на каждый выбор (когда время выходит, за того, кто не выбрал, выбирает Мозг). Войти на сайт нужно обоим.

В конце Мозг выносит вердикт обеим колодам, от «Отлично» до «Слабо», по кривой маны, ремувалу и синергиям: это мнение бота, а настоящий матч играется в игре. Можно скопировать код игры, открыть колоду в [конструкторе колод](/ru/deck-builder) или вызвать друга на тот же драфт, с теми же картами в том же порядке.

## Версии колод {#versii-kolod}

После [патча 0.7](/ru/news/patch-0-7) во многих опубликованных колодах оказались карты, которые теперь стоят дороже. Теперь можно **обновить карты опубликованной колоды**, сохранив её название, гайд, видео и ссылку: на странице вашей колоды или в [вашем аккаунте](/ru/account) нажмите «Обновить до версии 0.7», измените карты в конструкторе колод и сохраните. Перед сохранением вы видите, какие карты входят и какие выходят.

Предыдущие версии остаются на странице колоды, в блоке «Версии колоды», со своими изменениями и своей оценкой. Оценки никогда не удаляются: показывается оценка текущей версии, а старые оценки остаются у той версии, за которую их поставили.

## Сохранённые колоды и колоды в тренде {#sokhranennye-kolody}

- **Сохранить**: на странице каждой колоды есть кнопка, чтобы её сохранить. Сохранённые колоды вы найдёте в [вашем аккаунте](/ru/account), в разделе «Сохранённые колоды». Этот список видите только вы.
- **Новые сортировки** в разделе [Колоды](/ru/decks): **В тренде** — колоды, которые на этой неделе привлекли больше всего внимания (просмотры, скопированные коды, оценки и сохранения), и **Чаще сохраняют**.
- **Версия игры**: в панели фильтров раздела Колоды теперь есть версия игры с числом колод для каждой. Каждая колода показывает патч, под который она собрана.

## Карты и MetaShifting {#karty}

- В разделе [Карты](/ru/cards) всегда на виду ряд фильтров по стоимости (от 0 до 6 и 7+), а в «Больше фильтров» — ключевое слово и диапазоны силы и здоровья, плюс кнопка, чтобы сбросить их все.
- В [MetaShifting](/ru/metashifting) каждый патч теперь открывается блоком «До и после»: каждая карта, у которой изменились стоимость, сила или здоровье, рядом с прежней версией, с выделенными изменёнными значениями.

## OriginsMeta Analytics {#analytics}

OriginsMeta Analytics — наше приложение для Windows, которое само записывает ваши матчи в Origins TCG, пока вы играете: колоду, результат, Легендарные карты соперников, с оверлеем поверх игры и для OBS. Оно готово и работает, но с патча 0.7 игра больше не сохраняет на вашем ПК данные матча, которые читало приложение, поэтому пока оно на паузе, а страницы винрейтов отключены.

Мы хотим показать его команде Koin Games и спросить, можно ли снова сделать эти данные доступными. Если вам это интересно, нажмите **«Да, хочу»** на странице: чем больше игроков попросят, тем весомее будет просьба.

## Вход и профиль {#vkhod-i-profil}

- **Код из письма**: в письме для входа теперь рядом со ссылкой есть код. Если ссылка открывается в другом браузере (на телефоне, в приложении Gmail) или не работает, введите код в панели входа, в разделе «Уже есть код из письма?».
- **Ваша публичная страница**: в аккаунте, под вашей публичной страницей, кнопка «Редактировать мою публичную страницу» ведёт на отдельную страницу с вашей биографией, каналами, фото и, для Creator, Авторов, игроков Pro и Staff, витриной.
- **Меню**: на компьютере Тир-лист и Конструктор колод открывают подменю со страницами тир-листа, Analytics и Драфтом.

## Гайды и комиксы {#gaydy-i-komiksy}

- Новый гайд: [стримы по Origins TCG](/ru/guides/streaming-tools) — оверлей для OBS, команда чата !deck, короткие ссылки и значок LIVE, шаг за шагом.
- У комиксов теперь могут быть версии, нарисованные на каждом языке: читатели видят версию, нарисованную на их языке, вместо автоматического перевода.
- Гайды к колодам, опубликованным до патча 0.7, сохраняют стратегию в том виде, в каком она была написана, с пометкой вверху: в таблицах карт указаны новые стоимости.

## Присоединяйтесь {#prisoedinyaytes}

[Зарегистрируйтесь](/ru/login) бесплатно через Discord или по электронной почте, попробуйте [Драфт](/ru/draft) и обновите свои колоды до патча 0.7. И [присоединяйтесь к нашему Discord](https://discord.gg/RAG7nnrNGP): там публикуется всё, что появляется на сайте.`,
    faq: [
      { q: "Есть ли в Origins TCG режим драфта?", a: "В игре пока нет, но на OriginsMeta есть бесплатный драфт по адресу originsmeta.com/ru/draft: три формата против Мозга, нашего бота, без аккаунта, или против друга в онлайн-комнате. В конце можно скопировать код игры вашей колоды." },
      { q: "Как обновить опубликованную колоду до патча 0.7?", a: "На странице вашей колоды или в аккаунте нажмите «Обновить до версии 0.7», измените карты в конструкторе колод и сохраните. Название, гайд, видео и ссылка остаются прежними, а предыдущая версия остаётся на странице со своей оценкой." },
      { q: "Почему винрейты отключены?", a: "С патча 0.7 игра больше не сохраняет на вашем ПК данные матча, которые читало приложение OriginsMeta Analytics. Приложение на паузе: если оно вам нужно, скажите об этом на странице Analytics, и мы покажем его Koin Games." },
    ],
  },
  "playtest-patch-notes-1001": {
    title: "Патчноут плейтеста Origins TCG: миссии отделены от рейтингового режима, две новые локации, быстрые анимации",
    metaTitle: "Патчноут плейтеста Origins TCG: миссии и рейтинг",
    description:
      "Обновление плейтеста Origins TCG от 1 октября: PvE-миссии отделены от рейтинга, фильтры конструктора, две новые локации, турнирный пул и правки карт.",
    summary:
      "Koin Games обновила сборку плейтеста Demo 2.0 — это её крупнейшее обновление со времён 0.6.3. Миссии становятся чисто PvE и больше не стоят между вами и рейтинговым режимом, в конструкторе колод появляется больше фильтров, а в игру приходят две локации. Десять изменений баланса — те же, что уже есть в основной демоверсии.",
    highlights: [
      { label: "Миссии и рейтинговый режим разделены", text: "миссии только PvE, рейтинговый подбор соперников когда угодно", anchor: "missii-i-reyting" },
      { label: "Конструктор колод с новыми фильтрами", text: "ключевые слова при наведении, одна или две копии видны чётко", anchor: "konstruktor-kolod" },
      { label: "Мировой рейтинг на экране VS", text: "для игроков дивизиона Grandmaster", anchor: "grandmaster" },
      { label: "Быстрые анимации", text: "и отдельный ползунок громкости голосов", anchor: "skorost-i-zvuk" },
      { label: "Десять изменений баланса", text: "все уже есть в основной демоверсии и на OriginsMeta", anchor: "balans" },
      { label: "Пять изменений карт, новых в этих заметках", text: "En Passant, оглушение, Смертельное касание, Boitata, Reflection", anchor: "novye-izmeneniya" },
      { label: "Две новые локации, одна удалена", text: "Ballroom и Tectonic Decay добавлены, Ashen Grove убрана", anchor: "novye-lokatsii" },
      { label: "Пул локаций для турниров", text: "битвы в комнатах тоже его используют", anchor: "turnirnyy-pul" },
    ],
    body: `## Плейтест догоняет демоверсию {#pleytest}

Koin Games обновила плейтест Demo 2.0 — отдельную сборку, к которой присоединяются через официальный Discord. «Это наше крупнейшее обновление со времён 0.6.3», — пишет команда и предупреждает, что сборка только что из разработки: будут баги и временные заглушки. Многие изменения, добавляет команда, уже пришли в основную демоверсию с [обновлением от 21 сентября](/ru/news/demo-patch-notes-0921) и [патчем 0.7](/ru/news/patch-0-7).

## Миссии и рейтинговый режим разделены {#missii-i-reyting}

Миссии и боссы теперь полностью PvE: вы сражаетесь только с ботами, и они нужны лишь для открытия колод. У них своя кнопка Play на экране Missions, поэтому кнопка Play на главном экране теперь только для настоящего подбора соперников, которым можно пользоваться когда угодно.

- Больше не нужно проходить все миссии, чтобы рейтинговый подбор начал находить вам соперников: он пытается найти подходящего соперника каждый раз, когда вы играете в рейтинговом режиме. Команда продолжает над этим работать.
- **В этом плейтесте миссии колод нельзя выполнять в рейтинговом режиме.** Команда вернёт это в одной из будущих сборок. Если у вас ещё есть неоткрытые колоды, играйте миссии из раздела Missions.
- Трек наград распределяет призы по большему числу миссий, а на экране Missions появилась смена колоды.

Как устроен рейтинговый режим в демоверсии и что мы знаем о ладдере, описано в [нашем гайде по рейтинговому режиму](/ru/guides/origins-tcg-ranked).

**Обновление от 11 октября:** с обновлением плейтеста 0.7.1 от 8 октября рейтинговые матчи снова засчитываются для миссий колод, а миссии по-прежнему можно играть как PvE из раздела Missions ([патчноут 0.7.1](/ru/news/playtest-patch-notes-0-7-1#missii-reyting)).

## Конструктор колод, лента новостей и Grandmaster {#interfeys}

### Конструктор колод с новыми фильтрами {#konstruktor-kolod}

Новая панель инструментов с дополнительными фильтрами. При наведении на карту в коллекции показываются её ключевые слова. Колода теперь чётко показывает, каких карт у вас две копии, а каких только одна: новичкам это давалось с трудом.

### Лента новостей в игре {#lenta-novostey}

В игре появилась своя лента новостей: если вы читаете эти заметки там, пишет команда, вы её уже видели.

### Мировой рейтинг на экране VS {#grandmaster}

Игроки дивизиона Grandmaster, самого высокого, теперь показывают свой мировой рейтинг на экране VS.

### Грейдинг карт: пока нет {#greyding}

Визуала грейдинга карт в этом обновлении нет, а информация «How Grading Works», которую вы встретите, — временная заглушка: команда просит её не учитывать. Зато она просит отзывы об открытии бустеров в Discord.

## Скорость и звук {#skorost-i-zvuk}

Анимации и паузы между ними стали быстрее. «Здесь ещё очень много работы», — пишет команда: скорость остаётся одним из её главных приоритетов. Голоса стали профессиональнее и лучше сведены, а для громкости голосов появился отдельный ползунок.

## Баланс карт: всё уже на OriginsMeta {#balans}

Десять изменений баланса в заметках — те же, что основная демоверсия получила с обновлением от 21 сентября и с патчем 0.7: страницы карт, [конструктор колод](/ru/deck-builder) и [MetaShifting](/ru/metashifting) уже их учитывают. Формат: мана · Сила/Здоровье для персонажей, только мана для заклинаний.

| Карта | До | После | В демоверсии с |
| --- | --- | --- | --- |
| Dorothy | 5 · 1/1 | 4 · 1/1 | 21 сентября |
| Wicked Stepmother | 4 · 3/6 | 4 · 4/6 | 21 сентября |
| Beauty | 4 · 1/1 | 4 · 2/1 | 21 сентября |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | 21 сентября |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | 21 сентября |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | 21 сентября |
| Roo | 2 · 2/3 | 2 · 2/4 | 21 сентября |
| Bagheera | 1 · 1/1 | 2 · 1/1 | патч 0.7 |
| Spellbook | 3 | 4 | патч 0.7 |
| Mind Palace | 2 | 3 | патч 0.7 |

## Карты, которые меняют свой эффект {#izmeneniya-kart}

### Новое в этих заметках {#novye-izmeneniya}

Пяти изменений нет в патчноутах демоверсии от 21 и 29 сентября:

- **En Passant** теперь может выбирать занятые ячейки: если ячейка занята, ваш союзник остаётся на месте, но всё равно наносит свой урон.
- **Оглушение** теперь снимается в конце боя.
- **Смертельное касание** больше не уничтожает персонажей со Щитом.
- **Boitata** должна вести себя лучше, особенно когда она есть у обоих игроков.
- У **Reflection** чуть более понятная формулировка; команда признаёт, что карте, возможно, понадобится «хирургия», чтобы стать интуитивнее.

Мы пока не знаем, есть ли они уже в основной демоверсии: проверим в игре, прежде чем менять страницы карт.

### Уже в демоверсии {#uzhe-v-demo}

- Don Quixote сам получает Защитника, а не только даёт его врагам в своей локации (21 сентября: заметки к демоверсии говорили лишь, что он получил Защитника).
- Twister Toss может переместить союзника в занятую ячейку, и они меняются местами (патч 0.7).
- Van Helsing's Tools: Silver Bullet может бить по барьерам; Wooden Stake может выбирать неповреждённых персонажей, но срабатывает, только если персонаж повреждён в момент разрешения (21 сентября).
- Heroic Charge правильно складывается, если разыграть её несколько раз (21 сентября).
- Spellbook и Humpty больше не могут создать сами себя в качестве случайной карты (патч 0.7).
- Персонажи с «Выберите одно» могут выбрать снова, если возвращаются к вам в руку, и сохраняют свои характеристики (21 сентября, для Frog Prince и Magic Carpet).
- Карты сохраняют характеристики на кладбище: усиленная Mummy возвращается со всей своей Силой (21 сентября).

## Локации {#lokatsii}

### Две новые, одна удалена {#novye-lokatsii}

- **Ballroom** (новая): после боя для обоих игроков случайный персонаж здесь возвращается в руку владельца.
- **Tectonic Decay** (новая): после боя наносит 1 урон обоим барьерам здесь.
- **Ashen Grove** (удалена): когда вы разыгрывали здесь персонажа, вы сбрасывали свою крайнюю правую карту, а затем брали карту.

Заметки сравнивают плейтест с его предыдущей сборкой. На нашей [странице Локации](/ru/locations), в списке Demo 2.0 по состоянию на 21 сентября, Ballroom уже есть и пока есть Ashen Grove, а Tectonic Decay нет: мы обновим её, когда увидим, какие локации есть в основной демоверсии.

### Редкость и пул для турниров {#turnirnyy-pul}

Редкость локаций теперь настоящая — обычная, редкая, очень редкая или ультраредкая — и больше не зависит от того, сколько локаций есть в игре: то же изменение демоверсия получила с патчем 0.7.

У турниров теперь свой пул локаций, так что локации можно включать в соревнования или исключать из них, не меняя обычные матчи. Первый пример — [Crimson Cup](/ru/news/crimson-cup-format-check-in): часть самых непредсказуемых локаций исключена из её пула. Команда говорит, что полный список есть в её последнем анонсе; мы расскажем о нём, как только прочитаем.

**Обновление от 7 октября:** список пришёл с постом в Steam от 5 октября: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum и Nostradamus' Call исключены из пула Crimson Cup ([наша статья](/ru/news/crimson-cup-prizepool-qualifiers#sem-lokatsiy-vne-turnira)).

В этой сборке битвы в комнатах (Create/Join Room Battle) используют турнирный пул: так можно потренироваться с локациями Crimson Cup.

## Чего мы пока не знаем {#chego-my-ne-znaem}

- Есть ли уже в основной демоверсии пять новых изменений карт, Tectonic Decay и удаление Ashen Grove.
- Какие локации исключены из пула Crimson Cup: ответ пришёл 5 октября, см. обновление выше.
- Новая формулировка Reflection.

## Что меняется на OriginsMeta {#na-sayte}

- Характеристики карт не меняются: все десять изменений баланса есть в базе карт, конструкторе колод и MetaShifting с 21 и 29 сентября.
- Страницы En Passant, Boitata и Reflection сохраняют текущий текст, пока мы не прочитаем новый в игре.
- Страница [Локации](/ru/locations) остаётся как есть, пока мы не проверим новые локации в основной демоверсии.

## Откуда эти заметки {#istochniki}

Патчноут, который команда опубликовала в официальном [Discord Origins TCG](https://discord.gg/originstcg) 1 октября вместе с обновлением плейтеста; как присоединиться к плейтесту, объясняется в канале Discord demo-v2-playtest-instructions. На 1 октября в Steam их нет.`,
    faq: [
      { q: "Нужно ли проходить миссии, чтобы играть в рейтинговом режиме в плейтесте Origins TCG?", a: "Нет. С обновления плейтеста от 1 октября 2026 года миссии только PvE и служат для открытия колод, а рейтинговый подбор находит вам соперника каждый раз, когда вы играете в рейтинговом режиме. Однако в этом плейтесте миссии колод нельзя выполнять в рейтинговом режиме: играйте их с экрана Missions." },
      { q: "Меняет ли обновление плейтеста характеристики карт для Crimson Cup?", a: "Нет. Его десять изменений баланса, например Dorothy за 4 маны и Bagheera за 2, — те же, что основная демоверсия уже получила 21 и 29 сентября 2026 года; патч 0.7 — последний патч баланса перед турниром." },
      { q: "Как потренироваться с локациями Crimson Cup?", a: "В сборке плейтеста битвы в комнатах (Create/Join Room Battle) используют турнирный пул локаций, из которого для Crimson Cup убрали часть самых непредсказуемых локаций." },
    ],
  },
  "patch-0-7": {
    title: "Патч 0.7, последний патч баланса перед Crimson Cup: переработка Twister Toss, три карты дороже",
    metaTitle: "Патч 0.7 Origins TCG: Twister Toss и три нерфа",
    description:
      "Патч 0.7 Origins TCG, последний патч баланса перед Crimson Cup: Twister Toss переработана, Bagheera, Mind Palace и Spellbook стоят на 1 ману больше.",
    summary:
      "Патч 0.7, второе обновление демоверсии, — последний патч баланса перед Crimson Cup. Twister Toss переработана, Bagheera, Mind Palace и Spellbook стоят на 1 ману больше, а локации теперь выпадают в зависимости от редкости. Он также исправляет Humpty, Spellbook, Heroic Charge и нескольких Защитников и доводит число языков игры до 13.",
    highlights: [
      { label: "Последний патч баланса перед Crimson Cup", text: "вышел 29 сентября, за три недели до первой квалификации", anchor: "crimson-cup" },
      { label: "Переработка Twister Toss", text: "перемещает союзника в любую ячейку и меняет его местами с картой, которая там уже есть", anchor: "twister-toss" },
      { label: "Три карты дороже на 1", text: "Bagheera 2, Mind Palace 3, Spellbook 4", anchor: "stoimost" },
      { label: "Humpty и Spellbook больше не дают сами себя", anchor: "humpty-spellbook" },
      { label: "Полная рука", text: "возвращённая карта теперь сгорает, а не способность срывается", anchor: "polnaya-ruka" },
      { label: "Исправлены Heroic Charge и Защитник", anchor: "ispravleniya-oshibok" },
      { label: "У локаций есть редкость", text: "обычная, редкая, очень редкая или ультраредкая", anchor: "lokatsii" },
      { label: "13 языков в игре", anchor: "yazyki" },
      { label: "Boogeyman", text: "заметки говорят, что он меняется, но не как", anchor: "boogeyman" },
    ],
    body: `## Последний патч баланса перед Crimson Cup {#crimson-cup}

«Это ПОСЛЕДНИЙ патч баланса перед турниром», — пишет команда. Crimson Cup начинается 20 октября с квалификации EMEA, во время Steam Next Fest, и играется в формате Conquest на три колоды ([правила](/ru/news/crimson-cup-format-check-in)). 24 сентября команда говорила, что последний патч баланса выйдет за две недели до фестиваля: он вышел 29 сентября, за три недели. Если план не изменится, именно с этими стоимостями и характеристиками будет сыгран турнир.

На официальном изображении он называется Steam Demo Update #2, версия 0.7: это второе обновление демоверсии после [обновления от 21 сентября](/ru/news/demo-patch-notes-0921).

## Все изменения баланса {#balans}

Формат: мана · Сила/Здоровье для персонажей, только мана для заклинаний.

| Карта | До | После | Что меняется |
| --- | --- | --- | --- |
| Bagheera | 1 · 1/1 | 2 · 1/1 | стоит на 1 больше |
| Mind Palace | 2 | 3 | стоит на 1 больше |
| Spellbook | 3 | 4 | стоит на 1 больше; её случайные заклинания больше не могут быть Spellbook |
| Twister Toss | 1 | 1 | переработана: перемещает союзника в любую ячейку, меняя его местами с картой, которая там уже есть |

Ни одна Легендарная карта не меняет стоимость, характеристики или способность: Dorothy лишь получает более понятное объяснение своих ключевых слов.

## Переработка Twister Toss {#twister-toss}

До сих пор Twister Toss, заклинание за 1 ману, делала одно: перемещала союзника. После переработки она перемещает союзника в любую ячейку, а если там уже есть другая карта, они меняются местами.

Теперь она может выбирать и занятые ячейки. Команда приводит два примера:

- переместить персонажа и сразу вернуть его обратно в том же раунде;
- уничтожить своего персонажа с помощью Trash for Treasure и тут же переместить в его ячейку другого персонажа.

На OriginsMeta Twister Toss есть в трёх опубликованных колодах, среди них [Dorothy Combo](/ru/guides/dorothy-combo-guide): Dorothy растёт каждый раз, когда перемещается союзник. Патчноут не приводит новый текст карты: её страница показывает старый, с предупреждением, пока мы не прочитаем новый в игре.

## Три карты дороже на 1 {#stoimost}

Среди 35 колод, опубликованных на OriginsMeta (подсчёт на 00:13 CEST 30 сентября), Mind Palace есть в 22, а Spellbook — в 17: это две самые популярные карты на сайте. Bagheera есть в 13. Полный рейтинг — в разделе [Чаще всего играют](/ru/tier-list/most-played).

### Bagheera: 2 маны {#bagheera}

Bagheera остаётся картой 1/1, чья способность При раскрытии даёт ей +2⚔️/+2❤️ в средней ячейке. За 1 ману это было 3/3 с первого раунда; теперь она выходит не раньше второго раунда.

### Mind Palace: 3 маны {#mind-palace}

Заклинание, которое берёт 2 карты, теперь стоит 3.

### Spellbook: 4 маны {#spellbook}

До конца игры Spellbook в начале каждого раунда добавляет вам в руку случайное заклинание, которое нужно разыграть до боя, иначе оно сбрасывается. Теперь она стоит 4, и её случайные заклинания больше не могут быть Spellbook.

## Изменения способностей и исправления {#izmeneniya-sposobnostey}

### Humpty и Spellbook больше не дают сами себя {#humpty-spellbook}

Случайные карты, которые они дают, больше не могут быть ими самими. Способность Humpty При смерти добавляет вам в руку случайную карту: это больше не может быть Humpty. Случайное заклинание, которое Spellbook добавляет каждый раунд, больше не может быть Spellbook.

### Полная рука: возвращённая карта сгорает {#polnaya-ruka}

Когда карта возвращается в уже полную руку, теперь она сгорает (теряется), а не способность срывается. Среди карт Demo 2.0 это касается тех, что возвращают карту в руку: White Queen и Stroke of Midnight, которые возвращают ЛЮБОГО персонажа в руку владельца, и Koschei и Dracula, которые возвращают сами себя.

### Freeze! и Dorothy: ключевые слова с объяснением {#klyuchevye-slova}

При наведении на них теперь объясняются ключевые слова, которые они используют, и они находятся поиском по ключевым словам в коллекции.

## Исправления ошибок {#ispravleniya-oshibok}

### Heroic Charge {#heroic-charge}

Heroic Charge даёт союзникам +2⚔️ и Пробивной удар в этом раунде. Если усиленный ею персонаж теряет способности, +2⚔️ теперь остаётся; Пробивной удар по-прежнему снимается.

### Несколько Защитников {#zashchitniki}

Когда у вас в локации больше одного Защитника и один из них оглушён, теперь всегда защищает другой.

## Теперь у локаций есть редкость {#lokatsii}

Каждая локация теперь обычная, редкая, очень редкая или ультраредкая, и редкость определяет, как часто она выпадает. Команда говорит так: знакомые локации ждите в большинстве матчей, а некоторые вы увидите лишь «раз в сто лет». Патчноут не говорит, у какой локации какая редкость: страница [Локации](/ru/locations) перечисляет все локации Demo 2.0 с их эффектами, и мы добавим редкость, как только её узнаем.

## 13 языков в игре {#yazyki}

Игра теперь поддерживает 13 языков: английский, французский, итальянский, немецкий, испанский (Испания), японский, корейский, польский, португальский (Бразилия), португальский (Португалия), русский, упрощённый китайский и испанский (Латинская Америка). На 30 сентября страница в Steam указывает те же 13 языков для интерфейса, а полная озвучка есть только на английском.

## Boogeyman {#boogeyman}

В сводке в начале патчноута сказано, что «Twister Toss, Heroic Charge и Boogeyman теперь ведут себя иначе», но ни одна строка заметок не говорит, что меняется у Boogeyman. Его способность При раскрытии уничтожает союзника в его локации с наименьшей Силой, даже его самого. Мы обновим эту статью, когда команда объяснит.

## Чего мы пока не знаем {#chego-my-ne-znaem}

- У какой локации какая редкость.
- Новый текст Twister Toss и считается ли обмен местами одним перемещением или двумя для Dorothy.
- Что меняется у Boogeyman.

## Что меняется на OriginsMeta {#na-sayte}

- Страницы Bagheera, Mind Palace и Spellbook показывают новую стоимость, и у каждой карты из патча изменение есть в истории баланса, со ссылкой на пост в Steam.
- Страница Twister Toss пока показывает старый текст, с предупреждением, пока мы не прочитаем новый в игре.
- [MetaShifting](/ru/metashifting) показывает патч 0.7 первым, а [конструктор колод](/ru/deck-builder) использует новые стоимости: Bagheera теперь в кривой маны на двух.
- Опубликованные колоды сохраняют свой список, с датой создания и патчем, действовавшим в тот день; их кривая маны использует новые стоимости. Гайды колод с этими картами обновлены.

## Откуда эти заметки {#istochniki}

- Официальный пост в Steam от 29 сентября «A small demo update is about to land!», опубликованный до того, как серверы отключили для патча.
- Номер 0.7 и название Steam Demo Update #2 взяты с официального изображения обновления — обложки этой статьи. Некоторые креаторы называли обновление от 21 сентября «патчем 0.7»: на этом сайте оно остаётся «Демо · 21 сен».`,
    faq: [
      { q: "Что изменилось в патче 0.7 Origins TCG?", a: "Twister Toss переработана; Bagheera (1 → 2 маны), Mind Palace (2 → 3) и Spellbook (3 → 4) стоят на 1 больше; у локаций теперь есть редкость, которая определяет, как часто они выпадают; Humpty и Spellbook больше не могут дать сами себя; карта, возвращённая в полную руку, теперь сгорает; исправлены Heroic Charge и несколько Защитников; игра поддерживает 13 языков." },
      { q: "Патч 0.7 — последний патч баланса перед Crimson Cup?", a: "Да: команда называет его последним патчем баланса перед турниром. Он вышел 29 сентября 2026 года; Crimson Cup начинается 20 октября с квалификации EMEA, во время Steam Next Fest." },
      { q: "Как работает Twister Toss после патча 0.7?", a: "Она по-прежнему стоит 1 ману. Она перемещает союзника в любую ячейку, а если там уже есть другая карта, они меняются местами. Она может выбирать и занятые ячейки: можно переместить персонажа и вернуть его в том же раунде или уничтожить одного с помощью Trash for Treasure и переместить другого в его ячейку." },
    ],
  },
  "upgrade-meta-0929": {
    title: "Upgrade Meta: инструменты для креаторов, подписки и уведомления, гайды сообщества и комиксы",
    metaTitle: "Upgrade Meta: инструменты креаторов Origins TCG",
    description:
      "Новое на OriginsMeta: профили и каталог креаторов, инструменты для стримов с !deck и оверлеем для OBS, подписки, гайды сообщества и комиксы. Станьте Creator.",
    summary:
      "На этой неделе на OriginsMeta появился целый раздел для тех, кто делает контент об Origins TCG: профили-витрины, каталог креаторов, инструменты для стримов, статистика колод, гайды сообщества и комиксы, которые публикуются прямо на сайте. Теперь можно подписываться на любимых игроков и получать уведомления, когда они что-то публикуют или выходят в эфир. Хотите стать Creator? Напишите Pierluigi в нашем Discord.",
    highlights: [
      { label: "Профили креаторов", text: "страница-витрина, короткая ссылка originsmeta.com/@имя и каталог креаторов", anchor: "profili" },
      { label: "Инструменты для стримов", text: "команда чата !deck, оверлей для OBS, изображение колоды и значок LIVE", anchor: "strimy" },
      { label: "Публикуйте больше", text: "видео и ссылки в колодах, статистика колод, арт Легендарной карты, гайды, комиксы и турниры", anchor: "publikuyte" },
      { label: "Как стать Creator", text: "напишите Pierluigi в нашем Discord", anchor: "stat-creator" },
      { label: "Подписки и уведомления", text: "колоды, гайды, комиксы и стримы профилей, на которые вы подписаны", anchor: "podpiski" },
      { label: "Роли и достижения", text: "Staff, Creator, Автор, Pro и Community, достижения в каждом профиле, сообщения команде сайта", anchor: "roli" },
      { label: "Колоды, тир-листы и гайды", text: "лучшие колоды прямо сейчас, подписанные тир-листы, три новых гайда и дата Kickstarter", anchor: "kolody-i-gaydy" },
    ],
    body: `## Профили креаторов {#profili}

Если вы делаете контент об Origins TCG (стримы, видео, гайды, колоды), теперь у вас есть место на OriginsMeta. Профили с ролью Creator, Автор, Pro или Staff получают **страницу-витрину**: обложку (один из 8 фонов или ваше изображение), более крупное фото, акцентный цвет, короткий слоган, любимую Легендарную карту, избранную колоду и избранное видео, расписание стримов (в часовом поясе каждого посетителя), а также биографию, каналы и языки, на которых вы делаете контент. Загрузить фото профиля может каждый.

У каждого профиля есть и **короткая ссылка**, которой можно поделиться: originsmeta.com/@имя. А страница [Креаторы и авторы](/ru/creators) собирает всех с одной из этих ролей, кто заполнил биографию или указал канал, с фильтрами по роли, языку и платформе.

## Инструменты для стримов {#strimy}

- **Команда чата \`!deck\`**: добавьте её в Nightbot, StreamElements или Fossabot, и ваш чат получит вашу последнюю опубликованную колоду с её Легендарной картой, ссылкой и кодом игры.
- **Оверлей для OBS**, который показывает вашу колоду в эфире, вертикально или горизонтально, и сам обновляется, когда вы публикуете новую.
- **Изображение колоды**, готовое для постов в соцсетях, превью 16:9 и сторис 9:16.
- **Значок LIVE**: когда вы стримите Origins TCG на Twitch, он появляется рядом с вашим именем в колодах, профилях и в каталоге. Страница [Live](/ru/live) показывает, кто стримит прямо сейчас, а лента календаря вверху пишет «Сейчас в эфире».

Всё это вы найдёте в меню «Для стримеров» на странице каждой своей колоды.

## Публикуйте больше {#publikuyte}

- **Видео и ссылки в колодах**: до 3 видео с YouTube или Twitch и 5 ссылок в каждой колоде, с плеером, который загружается только по клику.
- **Статистика колод**: в аккаунте вы видите просмотры, копирования кода игры, клики по ссылкам и запуски видео для каждой своей колоды — за 7 дней, за 30 дней и за всё время. Её видите только вы и команда сайта.
- **Арт Легендарной карты**: Creator могут ставить в свои колоды собственный арт Легендарной карты. Официальная карта остаётся на странице карты.
- **Гайды сообщества**: Авторы, Creator, игроки Pro и Staff публикуют гайды прямо на сайте, с автоматическим переводом на два других языка. Все остальные по-прежнему могут [прислать нам гайд](/ru/guides/submit).
- **Комиксы**: Creator публикуют свои комиксы среди новостей, с автоматически переведённым текстом.
- **Турниры**: Creator, игроки Pro и Staff могут добавлять свои публичные турниры в календарь, с собственной обложкой.

## Как стать Creator {#stat-creator}

Роль Creator назначает команда OriginsMeta. Если вы делаете контент об Origins TCG и хотите стать Creator, **напишите Pierluigi в [нашем Discord](https://discord.gg/RAG7nnrNGP)**.

## Подписки и уведомления {#podpiski}

С аккаунтом можно **подписываться** на профили с ролью Creator, Автор, Pro или Staff. Когда они публикуют колоду, гайд или комикс или выходят в эфир на Twitch, вы получаете уведомление в конверте вверху сайта. Профили, на которые вы подписаны, есть в [вашем аккаунте](/ru/account). Уведомления остаются на сайте: никаких писем.

## Роли и достижения {#roli}

- **Пять ролей** с тегом рядом с именем: Staff, Creator, Автор, Pro и Community.
- **Достижения** в каждом профиле, например «Первая колода», «Любимец публики», «Колода месяца» и «Победа в турнире».
- **Сообщения команде сайта**: из аккаунта можно написать нам и читать наши ответы, в том числе на отзывы.

## Колоды, тир-листы и гайды {#kolody-i-gaydy}

- В разделе [Колоды](/ru/decks) — лучшие колоды Origins TCG прямо сейчас, по оценкам сообщества.
- В [тир-листе сообщества](/ru/tier-list/community) — тир-листы, подписанные Staff, Creator, Авторами и игроками Pro.
- Тир-листы, карты, колоды и конструктор колод теперь начинаются с содержимого, с более компактными заголовками.
- Три новых гайда: [11 Легендарных карт](/ru/guides/origins-tcg-legendaries), [рейтинговый режим](/ru/guides/origins-tcg-ranked) и [Conquest](/ru/guides/origins-tcg-conquest).
- В [гайде по Kickstarter](/ru/guides/origins-tcg-kickstarter) теперь дата, подтверждённая CEO Koin Games: 27 октября.

## Присоединяйтесь {#prisoedinyaytes}

[Зарегистрируйтесь](/ru/login) бесплатно через Discord или по электронной почте, публикуйте свои колоды и подписывайтесь на игроков, которые вам нравятся. И [присоединяйтесь к нашему Discord](https://discord.gg/RAG7nnrNGP): там публикуется всё, что появляется на сайте.`,
    faq: [
      { q: "Как стать Creator на OriginsMeta?", a: "Роль Creator назначает команда сайта: если вы делаете контент об Origins TCG, напишите Pierluigi в Discord OriginsMeta (discord.gg/RAG7nnrNGP)." },
      { q: "Как показать свою колоду на стриме?", a: "Откройте страницу своей колоды и перейдите в «Для стримеров»: там есть команда чата !deck для Nightbot, StreamElements или Fossabot, оверлей для OBS и изображение колоды." },
      { q: "На кого можно подписаться на OriginsMeta?", a: "С аккаунтом можно подписываться на профили с ролью Creator, Автор, Pro или Staff и получать уведомление на сайте, когда они публикуют колоду, гайд или комикс или выходят в эфир на Twitch." },
    ],
  },
  "upgrade-meta-0925": {
    title: "Upgrade Meta: OriginsMeta заговорил по-испански, каждая карта на трёх языках и что будет дальше",
    metaTitle: "Upgrade Meta: OriginsMeta для Origins TCG на испанском",
    description:
      "OriginsMeta теперь и на испанском, а у каждой карты Demo 2.0 официальный текст игры на трёх языках. А ещё — первый взгляд на то, что мы готовим дальше.",
    summary:
      "OriginsMeta теперь говорит и по-испански, а каждая карта Demo 2.0 показывает официальный текст игры на английском, итальянском и испанском. Мы также работаем над оверлеем — игровым инструментом для каждого игрока — и над тем, как вознаграждать то, что вы создаёте: первая идея — колода недели, выбранная вашими оценками. Спасибо за поддержку: в конце статьи вы найдёте всё, чтобы присоединиться.",
    highlights: [
      { label: "Испанский уже здесь", text: "весь сайт, включая гайды и новости, а гайды колод сообщества переводятся автоматически", anchor: "ispanskiy" },
      { label: "Каждая карта на трёх языках", text: "официальный итальянский и испанский текст игры, проверенный на всех 122 картах Demo 2.0", anchor: "karty" },
      { label: "Оверлей для всех", text: "игровой инструмент для каждого игрока, в работе: покажем, когда будет готов", anchor: "overley" },
      { label: "Колода недели", text: "по вашим оценкам: наша первая идея, как вознаграждать то, что вы создаёте", anchor: "koloda-nedeli" },
      { label: "Спасибо", text: "всем, кто зарегистрировался, публиковал колоды, голосовал и писал нам", anchor: "spasibo" },
      { label: "Присоединяйтесь", text: "зарегистрируйтесь, соберите колоду, сделайте свой тир-лист, приходите в наш Discord", anchor: "prisoedinyaytes" },
    ],
    body: `## Испанский уже здесь {#ispanskiy}

С 25 сентября 2026 года OriginsMeta доступен и на испанском: карты, колоды, гайды, новости, тир-листы, конструктор колод и турниры. Язык переключается кнопками EN · IT · ES вверху каждой страницы (на телефоне — в Меню). Мы пишем на нейтральном испанском, для игроков из Испании и Латинской Америки, а названия карт остаются на английском, как в игре.

Колоды сообщества тоже говорят на всех языках: автор пишет гайд на своём языке, сайт переводит его на два других, сообщает об этом на странице и даёт ссылку на оригинал. Колоду, опубликованную на итальянском, теперь можно прочитать и на английском, и на испанском.

## Каждая карта на трёх языках {#karty}

25 сентября мы открыли демоверсию на испанском и итальянском и прочитали 122 карты коллекции одну за другой. Итальянские и испанские тексты, которые вы теперь найдёте в [списке карт](/ru/cards), — официальные тексты игры: 101 испанский и 88 итальянских текстов отличались от наших переводов, и они заменены.

Ключевые слова тоже используют официальные термины игры: On Reveal — это «Alla rivelazione» на итальянском и «Al revelar» на испанском. На итальянских и испанских страницах те же термины есть в тегах ключевых слов на странице каждой карты, в гайдах и в новостях. Созданных и удалённых карт нет в коллекции игры, а [Локации](/ru/locations) мы в игре ещё не проверяли: их итальянский и испанский текст — наш, написанный по глоссарию игры.

## Оверлей для всех {#overley}

Мы работаем над оверлеем — игровым инструментом для каждого игрока Origins TCG, а не только для тех, кто стримит. Мы лучше покажем его, чем будем описывать: расскажем больше, как только будет что показать.

## Колода недели {#koloda-nedeli}

Мы хотим вознаграждать тех, кто создаёт, и дать больше видимости вашим колодам, гайдам и тир-листам. Первая идея — колода недели, выбранная по вашим звёздным оценкам. А пока, если вы попробовали колоду сообщества, оцените её: колоды с лучшими оценками уже появляются в [тир-листе](/ru/tier-list).

## Спасибо {#spasibo}

OriginsMeta открылся 15 сентября. За десять дней вы регистрировались, публиковали колоды, голосовали и писали нам с идеями и исправлениями, и несколько недавних изменений начались с ваших сообщений. Спасибо: этот сайт растёт вместе с вами.

## Присоединяйтесь {#prisoedinyaytes}

- [Зарегистрируйтесь](/ru/login): бесплатно, через Discord или по электронной почте, без пароля. С аккаунтом можно публиковать колоды, голосовать и сохранять свои тир-листы.
- [Соберите колоду](/ru/deck-builder): бесплатно, даже без аккаунта. Скопируйте код игры или, с аккаунтом, опубликуйте колоду на сайте со своим гайдом.
- [Сделайте свой тир-лист](/ru/tier-list/create) и посмотрите [тир-лист сообщества](/ru/tier-list/community), который станет настоящим рейтингом, когда будет сохранено 5 списков.
- [Присоединяйтесь к нашему Discord](https://discord.gg/RAG7nnrNGP): новые статьи и гайды приходят туда сразу после публикации. [Официальный Discord Origins TCG](https://discord.gg/originstcg) — это сервер Koin Games для анонсов и регистрации на турниры.`,
    faq: [
      { q: "Есть ли OriginsMeta на испанском?", a: "Да, с 25 сентября 2026 года: весь сайт, с гайдами, новостями, тир-листами и конструктором колод. Язык переключается кнопками EN · IT · ES вверху страницы; гайды колод сообщества переводятся автоматически." },
      { q: "Итальянские и испанские тексты карт официальные?", a: "Да, для 122 карт Demo 2.0: мы прочитали их в игре 25 сентября 2026 года. Созданных и удалённых карт нет в коллекции игры, а Локации ещё не проверены в игре, поэтому их итальянский и испанский текст — наш перевод по глоссарию игры." },
      { q: "Как опубликовать колоду на OriginsMeta?", a: "Соберите её в конструкторе колод, войдите через Discord или по электронной почте и нажмите «Опубликовать на сайте»: короткий план игры обязателен, остальная часть гайда — по желанию." },
    ],
  },
  "crimson-cup-format-check-in": {
    title: "Правила Crimson Cup: Conquest с тремя колодами, списки скрыты до топ-4 и чек-ин, который нельзя пропустить",
    metaTitle: "Crimson Cup в Origins TCG: правила, даты, призы, чек-ин",
    description:
      "Правила Crimson Cup в Origins TCG: Conquest с тремя колодами, 8 уникальных карт между колодами, квалификации 19–22 октября, призы на 10 000 долларов.",
    summary:
      "После опроса игроков Koin Games утвердила правила Crimson Cup: Conquest с тремя колодами, не меньше 8 уникальных карт между каждой парой колод, списки колод скрыты до топ-4, а в матчах best-of-five бана нет. Чек-ин открывается за два часа до каждой квалификации и закрывается за пять минут до старта, вместе с приёмом колод: пропустили — не играете. Турнир проходит на демо-версии, а не на плейтесте.",
    highlights: [
      { label: "Conquest с тремя колодами", text: "не меньше 8 уникальных карт между каждой парой колод", anchor: "conquest-s-tremya-kolodami" },
      { label: "Списки колод скрыты до топ-4", text: "при бане вы видите только Легендарную", anchor: "spiski-kolod-skryty" },
      { label: "Best-of-five без бана", text: "победить нужно всеми тремя колодами", anchor: "best-of-five" },
      { label: "Чек-ин", text: "открывается за два часа, закрывается за пять минут до старта вместе с приёмом колод", anchor: "chek-in" },
      { label: "Тренируйтесь на демо", text: "плейтест получит обновления, которых у турнира не будет", anchor: "demo-ili-pleytest" },
      { label: "Последний патч баланса", text: "вышел 29 сентября: патч 0.7", anchor: "posledniy-patch-balansa" },
      { label: "Призы", text: "10 000 долларов; полное распределение появилось 5 октября", anchor: "prizy" },
    ],
    body: `## Conquest с тремя колодами {#conquest-s-tremya-kolodami}

Несколько дней назад Koin Games провела опрос среди игроков, и это объявление окончательно определяет формат: турнир Crimson Cup играется в Conquest с тремя колодами. Между каждой парой колод должно быть не меньше 8 уникальных карт.

В каждой колоде 13 разных карт: Легендарная и двенадцать базовых, вторую копию которых игра добавляет сама. Мы понимаем это так, что у двух колод может быть не больше 5 общих карт, но в объявлении не уточняется, как именно считаются уникальные карты. На турнире Big Bob's Playtest Battle в августе правило требовало разницы минимум в девять карт.

## Списки колод скрыты до топ-4 {#spiski-kolod-skryty}

Колоды остаются закрытыми до топ-4. Когда вы баните одну из колод соперника, вы видите только её Легендарную.

## Best-of-five: без бана, побеждать нужно всеми тремя {#best-of-five}

В матчах best-of-five бана нет: чтобы взять матч, нужно победить всеми тремя колодами. В первом объявлении, 9 сентября, в формате best-of-five игрался гранд-финал, а до него шли матчи best-of-three.

## Чек-ин: не опаздывайте {#chek-in}

Запланированный порядок для каждой квалификации:

1. Чек-ин открывается за два часа до начала турнира.
2. Чек-ин и приём колод закрываются за пять минут до официального старта.
3. Короткое окно, в которое игроки из листа ожидания могут занять свободные места: кто первым успел, тот и играет.
4. Вступление к турниру.
5. Матчи начинаются сразу после вступления.

Без чек-ина сыграть не получится. Для квалификации EMEA 20 октября, которая начинается в 19:00 CEST, это значит пройти чек-ин с 17:00 до 18:55 CEST. Квалификация AMER проходит 21-го, APAC — 22-го: время и количество мест есть в нашем [гайде по Steam Next Fest](/ru/guides/steam-next-fest-2026).

**Обновление от 7 октября:** квалификаций теперь пять. 5 октября Koin добавила AMER 19 октября в 19:00 EST и EMEA 22 октября в 19:00 CEST, а на её новой графике с календарём квалификация AMER 21-го стоит на 21:00 EST, из неё проходят 32 игрока вместо 64, а вайлд-кардов 96 вместо 128. Кроме того, семь локаций исключены из турнирного пула. Всё это — в [нашей статье о призовом фонде и новых квалификациях](/ru/news/crimson-cup-prizepool-qualifiers).

## Демо или плейтест: где тренироваться {#demo-ili-pleytest}

- В **демо** — список карт турнира. Рейтинговый режим включается там к Steam Next Fest, с новыми наградами за рейтинг. Тренироваться стоит именно на этой сборке.
- **Плейтест** сегодня такой же, как демо, но рейтинговый режим в нём уже включён и есть несколько мелких изменений. Он будет получать новые обновления и будет отличаться от турнирной сборки.

Играть можно в обе версии, но турнир проходит на основной демо-версии и только с доступными в ней картами.

## Последний патч баланса {#posledniy-patch-balansa}

Последний патч баланса выйдет за две недели до Steam Next Fest, который начинается 19 октября. Мы разберём его карта за картой в [MetaShifting](/ru/metashifting).

**Обновление от 30 сентября:** последний патч баланса вышел раньше объявленного, 29 сентября. Это [патч 0.7](/ru/news/patch-0-7), который команда называет финальным патчем баланса перед турниром: карта Twister Toss переработана, а Bagheera, Mind Palace и Spellbook стоят на 1 больше.

## Призы {#prizy}

В официальном посте в X говорится о призовом фонде в 10 000 долларов, а в объявлении в Discord — что точный призовой фонд сообщат на следующей неделе. В сентябре Koin описывала призы общей стоимостью 10 000 долларов: эксклюзивная промокарта 1/1, другие промокарты, цифровые бустеры, коробки и кейсы Alpha и денежные призы ([наша статья](/ru/news/biggest-tournament-ever)).

**Обновление от 7 октября:** распределение призов появилось 5 октября. Победитель получает промокарту Dracula 1/1, два кейса бустер-боксов и 1500 долларов; промокарты достаются игрокам вплоть до топ-32, бустеры — до топ-256. Полная таблица — в [нашей статье о призовом фонде](/ru/news/crimson-cup-prizepool-qualifiers#prizovoy-fond).

## Чего мы пока не знаем {#chego-my-poka-ne-znaem}

- Точный призовой фонд, обещанный на следующей неделе: он появился 5 октября, см. обновление выше.
- Как считаются уникальные карты между двумя колодами.

## Источники {#istochniki}

- «Big Crimson Cup announcement», опубликованное на официальном Discord Origins TCG 24 сентября; там же есть ссылка на новое видео с подробностями турнира.
- [Пост Origins TCG в X](https://x.com/origins_tcg/status/2103111100321677670) того же дня, с призовым фондом в 10 000 долларов.`,
    faq: [
      {
        q: "Сколько уникальных карт нужно колодам на Crimson Cup?",
        a: "Не меньше 8 уникальных карт между каждой парой колод, говорится в объявлении от 24 сентября. В каждой колоде 13 разных карт: мы понимаем это так, что у двух колод может быть не больше 5 общих.",
      },
      {
        q: "Когда проходит чек-ин на Crimson Cup?",
        a: "Он открывается за два часа до каждой квалификации и закрывается за пять минут до старта, вместе с приёмом колод. Если пропустить его, сыграть не получится: для квалификации EMEA в 19:00 CEST чек-ин нужно пройти с 17:00 до 18:55 CEST.",
      },
      {
        q: "На какой сборке играется Crimson Cup?",
        a: "На основной демо-версии и только с доступными в ней картами. Плейтест будет получать новые обновления и будет отличаться от турнирной сборки.",
      },
    ],
  },
  "upgrade-meta-0924": {
    title: "Upgrade Meta: поиск по тексту карт, новый тир-лист, локации и наш собственный Discord",
    metaTitle: "Upgrade Meta: что нового на OriginsMeta для Origins TCG",
    description:
      "Три дня обновлений OriginsMeta: поиск по тексту карт, новый тир-лист, локации, публичные профили и наш собственный Discord. Спасибо, coachcronos.",
    summary:
      "За три дня OriginsMeta сильно изменился: конструктор колод теперь ищет по тексту карт, тир-лист показывает три источника рядом, а ещё появились локации, публичные профили и наш собственный сервер Discord. Спасибо coachcronos за стрим и всем, кто нам писал: многие из этих изменений начались с ваших просьб.",
    highlights: [
      { label: "Поиск по тексту карт", text: "в конструкторе колод и в базе карт: введите Reveal, и останутся карты с При раскрытии", anchor: "poisk-po-tekstu-kart" },
      { label: "Новый тир-лист", text: "OriginsMeta, Community и «Чаще всего играют» рядом, MetaShifting на отдельной странице", anchor: "novyy-tir-list" },
      { label: "Локации", text: "44 локации Demo 2.0 с поиском и фильтрами", anchor: "lokatsii" },
      { label: "Колоды, гайды и профили", text: "фильтр по типу автора, дата и патч у каждой колоды, публичные профили, четыре новых гайда", anchor: "kolody-gaydy-i-profili" },
      { label: "Карты, проверенные в игре", text: "все 122 карты сверены одна за другой, плюс патч от 21 сентября", anchor: "karty-proverennye-v-igre" },
      { label: "Сайт стало проще читать", text: "новый логотип, карты, которые переворачиваются, календарь, который прокручивается", anchor: "sayt-stalo-proshche-chitat" },
      { label: "Наш Discord", text: "логотип в меню, новые статьи и гайды публикуются автоматически", anchor: "nash-discord" },
      { label: "Спасибо, coachcronos", text: "за стрим 23 сентября", anchor: "spasibo-coachcronos" },
      { label: "Спасибо, что пишете нам", text: "а с сегодняшнего дня в окне отзывов можно оставить своё имя", anchor: "spasibo-chto-pishete-nam" },
    ],
    body: `## Поиск по тексту карт {#poisk-po-tekstu-kart}

Первое сообщение, пришедшее к нам через окно отзывов, касалось вполне конкретной вещи: собирая колоду вокруг Mulan, автор хотел видеть только карты с При раскрытии, набрав в поиске «Reveal», как это можно сделать в игре. Теперь так можно.

- Поиск в [конструкторе колод](/ru/deck-builder) смотрит на название, сагу и **текст карты**. Введите «Reveal», и останутся карты с При раскрытии: в текущей демо-версии их 33.
- Регистр и диакритика не важны, а если ввести несколько слов, останутся карты, в которых есть все эти слова, например «reveal damage».
- Под фильтрами видно, сколько карт осталось, и есть кнопка «Сбросить фильтры»; если ничего не подходит, конструктор так и говорит, а не показывает пустой список.
- Тот же поиск работает в [базе карт](/ru/cards) и в поле «Найти карту» в верхней части каждой страницы. На итальянской версии сайта он читает ещё и английский текст игры, так что там работает и «draw».

## Новый тир-лист {#novyy-tir-list}

[Тир-лист](/ru/tier-list) теперь показывает три источника рядом, у каждого своя страница:

- **OriginsMeta**: тиры строятся только по результатам турниров, поэтому появятся после Crimson Cup; пока страница показывает колоды с лучшими оценками и карты, которые встречаются в наибольшем числе колод.
- **[Community](/ru/tier-list/community)**: среднее по тир-листам, сохранённым участниками, которое становится рейтингом начиная с 5 списков.
- **[Чаще всего играют](/ru/tier-list/most-played)**: в скольких опубликованных колодах встречается каждая карта. Это популярность, а не винрейт.

У трекера баланса теперь своя страница, [MetaShifting](/ru/metashifting), с самым свежим патчем наверху. В [конструкторе тир-листов](/ru/tier-list/create) карты теперь действительно перетаскиваются; на телефоне есть панель S A B C D, а с аккаунтом свой список можно сохранить, и тогда он учитывается в тир-листе сообщества.

## Локации {#lokatsii}

Новая страница [Локации](/ru/locations): 44 локации Demo 2.0, с поиском по названию и эффекту, фильтрами по типу эффекта (урон, мана, перемещение и другие) и ссылками на страницы упомянутых в них карт. Чтобы понять, как они меняют матч, прочитайте [гайд по локациям](/ru/guides/origins-tcg-locations).

## Колоды, гайды и профили {#kolody-gaydy-i-profili}

- В разделе [Колоды](/ru/decks) фильтры теперь видны всегда, и появился новый — по **типу автора**: Staff, Pro, Influencer, Community. Колоды сортируются от новых к старым, и у каждой указаны дата создания и версия игры, на которой она собрана.
- У каждого участника есть **публичная страница** с его опубликованными колодами и сохранёнными тир-листами.
- В конструкторе колод четыре кнопки: «Опубликовать на сайте», «Сохранить приватно» (колода остаётся в вашем профиле и видна только вам), «Поделиться», «Очистить колоду». Колода, которую вы собираете, сама сохраняется в браузере.
- Четыре новых гайда по колодам, которые опубликовал Davdas: [On Reveal Mid Range](/ru/guides/on-reveal-midrange-guide) с Mulan, [King of Value Trade](/ru/guides/king-of-value-trade-guide), [Dorothy Combo](/ru/guides/dorothy-combo-guide) и [The Trick-or-Treat Legion](/ru/guides/trick-or-treat-legion-guide).
- Написали гайд сами? [Пришлите его нам](/ru/guides/submit): мы его прочитаем и, с вашего разрешения, опубликуем под вашим именем.

**Обновление от 27 сентября:** фильтр теперь называется **Роль**, а роли такие: Staff, Creator, Автор, Pro и Community; тега Influencer больше нет. Тот, кто опубликовал колоду, указан в поле **Опубликовано**.

## Карты, проверенные в игре {#karty-proverennye-v-igre}

22 сентября мы сверили все 122 карты Demo 2.0 с коллекцией в игре, одну за другой: стоимость, характеристики и мировоззрение совпали везде, а 16 текстов — нет, и теперь это тексты из игры. В базе есть и [патч демо-версии от 21 сентября](/ru/news/demo-patch-notes-0921) с 14 картами, которые он меняет, а вверху конструктора колод указано, для какой версии игры актуальны карты. Сегодня мы также исправили ключевые слова Queen of Hearts и Bagheera, которые отстали от их текста.

## Сайт стало проще читать {#sayt-stalo-proshche-chitat}

Логотип теперь нарисован от руки. На страницах колод карты показаны целиком и при наведении мыши переворачиваются, показывая свой текст; в превью карты осталось только нужное (название, тип, мировоззрение и эффект). Календарь под слайдером теперь действительно прокручивается, медленно, а шапка главной стала короче, так что новости помещаются на первый экран.

## Наш Discord {#nash-discord}

У OriginsMeta теперь есть свой сервер Discord. Логотип Discord — в верхнем меню (на телефоне — внутри «Меню»), а приглашение — в конце каждой статьи. Новые статьи и гайды публикуются там автоматически, как только выходят на сайте. [Официальный Discord Origins TCG](https://discord.gg/originstcg) по-прежнему остаётся сервером Koin Games — для анонсов, AMA и регистрации на турниры.

## Спасибо, coachcronos {#spasibo-coachcronos}

23 сентября coachcronos пригласил нас в прямой эфир на свой канал Twitch, вместе с Davdas и Pierluigi, чтобы поговорить о сайте и об Origins TCG с его чатом. Огромное спасибо: за площадку, за энтузиазм, с которым он относится к игре, и за то, что познакомил нас со своим сообществом. Несколько изменений из этой статьи родились на том стриме: всегда видимые фильтры колод, фильтр по типу автора и «Пришлите нам свой гайд».

## Спасибо, что пишете нам {#spasibo-chto-pishete-nam}

Окно отзывов открыто уже несколько дней, и команда читает каждое сообщение. Поиск по тексту карт появился именно так, из неподписанного сообщения: спасибо, кто бы вы ни были. С сегодняшнего дня в окне есть и поле для имени или ника, необязательное, чтобы мы знали, кого благодарить (без вашего согласия мы его никогда не публикуем). Пишите нам и дальше: через окно отзывов в правом нижнем углу, через [«Пришлите нам свой гайд»](/ru/guides/submit) или в нашем Discord.`,
    faq: [
      {
        q: "Как найти карты с При раскрытии в конструкторе колод?",
        a: "Введите Reveal в поиске конструктора колод: останутся карты, в тексте которых есть При раскрытии. Поиск смотрит на название, сагу и текст карты и так же работает в базе карт.",
      },
      {
        q: "Как попасть в Discord OriginsMeta?",
        a: "Через логотип Discord в верхнем меню (на телефоне — внутри «Меню») или через кнопку в конце каждой статьи. Это сервер OriginsMeta, отдельный от официального Discord Origins TCG, которым управляет Koin Games.",
      },
      {
        q: "Как предложить изменение на сайте?",
        a: "Через окно отзывов в правом нижнем углу: достаточно одной фразы, имя и email указывать не обязательно. Гайды присылайте через «Пришлите нам свой гайд» в разделе «Гайды».",
      },
    ],
  },
  "demo-patch-notes-0921": {
    title: "Патчноут демо-версии Origins TCG от 21 сентября: Dorothy стоит 4, меняются 14 карт, The Gallows исправлена",
    metaTitle: "Патчноут демо-версии Origins TCG от 21 сентября",
    description:
      "Патч демо Origins TCG от 21 сентября: Dorothy дешевеет до 4 маны, у 14 карт меняются характеристики и текст, исправлены два правила и локация The Gallows.",
    summary:
      "Изменения баланса в обновлении демо-версии от 21 сентября по сравнению с последней сборкой плейтеста: Dorothy дешевеет до 4 маны, у восьми карт меняются характеристики, Itsy Bitsy Spider становится Evil, шесть карт начинают работать иначе, а ещё исправлены два игровых правила и локация The Gallows.",
    highlights: [
      { label: "Dorothy стоит 4", text: "на одну ману дешевле для Легендарной, которая растёт каждый раз, когда перемещается союзник", anchor: "dorothy" },
      { label: "Wicked Stepmother: Сила 4", text: "Легендарная со Смертельным касанием из 3/6 становится 4/6", anchor: "wicked-stepmother" },
      { label: "Christopher Robin снова 5/4", text: "характеристики, которые были у него до патча 0.6.3", anchor: "christopher-robin" },
      { label: "Ещё пять изменений характеристик", text: "Guy of Gisborne, Quasimodo, Beauty, Magic Carpet и Roo", anchor: "vse-izmeneniya-kharakteristik" },
      { label: "Itsy Bitsy Spider становится Evil", text: "вместо Neutral, со всеми синергиями Зла, которые из этого следуют", anchor: "itsy-bitsy-spider" },
      { label: "Шесть карт работают иначе", text: "Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet, Wooden Stake", anchor: "shest-kart-rabotayut-inache" },
      { label: "Два игровых правила", text: "характеристики сохраняются на кладбище, «Перед боем» срабатывает до сброса Временных карт", anchor: "dva-igrovykh-pravila" },
      { label: "The Gallows исправлена", text: "больше не уничтожает в локации, куда переместили персонажа", anchor: "the-gallows" },
    ],
    body: `## Все изменения характеристик {#vse-izmeneniya-kharakteristik}

Цифры сравниваются с последней сборкой плейтеста, 0.6.3: это те же характеристики, которые база карт на этом сайте использовала до этого патча. Формат: мана · Сила/Здоровье; ★ отмечает Легендарные.

| Карта | До | После | Что меняется |
| --- | --- | --- | --- |
| Dorothy ★ | 5 · 1/1 | 4 · 1/1 | на 1 дешевле |
| Wicked Stepmother ★ | 4 · 3/6 | 4 · 4/6 | +1 к Силе |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | характеристики как до 0.6.3 |
| Guy of Gisborne | 6 · 3/3 | 6 · 4/4 | +1 к Силе, +1 к Здоровью |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | +1 к Силе, −1 к Здоровью |
| Beauty | 4 · 1/1 | 4 · 2/1 | +1 к Силе |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | +1 к Силе и новое правило для его усилений |
| Roo | 2 · 2/3 | 2 · 2/4 | +1 к Здоровью |
| Itsy Bitsy Spider | 0 · 1/1, Neutral | 0 · 1/1, Evil | меняет мировоззрение |

## Две Легендарные {#dve-legendarnye}

### Dorothy стоит 4 {#dorothy}

Dorothy может использовать Перемещение каждый раунд и получает +1/+1 за каждое перемещение союзников в этой партии. За 4 маны она выходит на раунд раньше, и у неё есть лишний раунд, чтобы вырасти. В том же патче Roo, персонаж за 2 маны с Перемещением, получает +1 к Здоровью.

### Wicked Stepmother: Сила 4 {#wicked-stepmother}

Легендарная со Смертельным касанием, чьё При раскрытии даёт вашим Злым персонажам Смертельное касание, из 3/6 становится 4/6.

## Christopher Robin снова 5/4 {#christopher-robin}

Патч 0.6.3 сделал его из 5/4 картой 4/5: крепче, но с более слабым ударом. Патч демо-версии возвращает прежние характеристики. Эта строка есть в патчноуте, опубликованном на официальном Discord, но не в посте в Steam.

## Itsy Bitsy Spider становится Evil {#itsy-bitsy-spider}

Карта 1/1 за 0 маны переходит из Neutral в Evil. Это важно для всех карт, которые считают Злых персонажей: например, При раскрытии карты Wicked Stepmother теперь даёт Смертельное касание и ей.

## Шесть карт работают иначе {#shest-kart-rabotayut-inache}

### Silver Bullet {#silver-bullet}

Теперь может целиться не только в персонажей, но и в барьеры.

### Don Quixote {#don-quixote}

Получил Защитника: больше патчноут о нём ничего не говорит.

### Heroic Charge {#heroic-charge}

Заклинание даёт союзникам +2 к Силе и Пробивной удар в этом раунде. Если его повторить, бонус +2 к Силе теперь применяется снова.

### Frog Prince и Magic Carpet {#frog-prince-magic-carpet}

У обеих карт При раскрытии с «Выберите одно». Усиления, которые у них уже были, больше не сбрасываются при розыгрыше, а если карта возвращается в руку, выбрать можно снова. Magic Carpet к тому же получает +1 к Силе.

### Wooden Stake {#wooden-stake}

Теперь может целиться в персонажей с полным Здоровьем, но по-прежнему не срабатывает, если к моменту раскрытия цель не ранена.

## Два игровых правила {#dva-igrovykh-pravila}

### Характеристики на кладбище {#kharakteristiki-na-kladbishche}

Характеристики персонажа больше не сбрасываются на кладбище. Усиленный персонаж с Возрождением возвращается на поле по-прежнему усиленным, хотя и с 1 Здоровьем.

### Сначала «Перед боем» {#snachala-pered-boem}

Способности «Перед боем» теперь срабатывают до того, как сбрасываются Временные карты.

## The Gallows {#the-gallows}

Локация всегда уничтожает врага напротив ячейки, в которую вошёл персонаж. Если способность При раскрытии перемещает этого персонажа в другую локацию, The Gallows больше не уничтожает персонажа соперника в новой локации.

## Источники {#istochniki}

- Официальный пост в Steam от 21 сентября, объявляющий обновление, перечисляет изменения характеристик и шесть карт, которые работают иначе, «по сравнению с последней сборкой плейтеста». Пост команды на Reddit говорит то же самое.
- Версия, опубликованная на официальном Discord, добавляет Christopher Robin, два игровых правила и The Gallows. Мы приводим её полностью.

У патча нет номера версии: команда называет его патчноутом демо-версии от 21 сентября. Некоторые креаторы называли его «патчем 0.7», но в официальных постах об этом обновлении такого номера нет. На этом сайте он отображается как «Демо · 21 сен».

**Обновление от 25 сентября:** мы добавили пояснение о названии «патч 0.7», которым некоторые креаторы называют это обновление.

**Обновление от 30 сентября:** номер 0.7 официально принадлежит следующему обновлению, Steam Demo Update #2 от 29 сентября, последнему патчу баланса перед Crimson Cup: все его изменения — в [патчноуте 0.7](/ru/news/patch-0-7). Характеристики в этой статье — те, что были до этого патча.

## Что меняется на OriginsMeta {#chto-menyaetsya-na-originsmeta}

- На странице каждой карты показаны новые характеристики и изменение в её истории баланса, со ссылкой на пост в Steam.
- [MetaShifting](/ru/metashifting) показывает патч рядом с патчами плейтеста.
- [Конструктор колод](/ru/deck-builder) использует новую стоимость: Dorothy теперь считается картой за 4 в кривой маны.
- Официальный текст шести карт, которые работают иначе, обновится, когда база карт сообщества импортирует патч. До тех пор изменение объясняет история баланса на странице каждой карты.

Всё остальное в обновлении, от нового интерфейса до рейтингового режима на Steam Next Fest, — в [статье о первом большом обновлении демо-версии](/ru/news/demo-first-big-update).`,
    faq: [
      {
        q: "Что изменилось в патче демо-версии Origins TCG от 21 сентября?",
        a: "Dorothy стоит 4 вместо 5; у Wicked Stepmother, Christopher Robin, Guy of Gisborne, Quasimodo, Beauty, Magic Carpet и Roo меняются характеристики; Itsy Bitsy Spider становится Evil; Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet и Wooden Stake работают иначе; исправлены два игровых правила и локация The Gallows.",
      },
      {
        q: "Это патч 0.7 Origins TCG?",
        a: "Нет. Некоторые креаторы называли его патчем 0.7, но у этого обновления нет номера версии: команда называет его патчноутом демо-версии от 21 сентября 2026, с изменениями по сравнению с последней сборкой плейтеста, 0.6.3. Патч 0.7 — это следующее обновление, Steam Demo Update #2 от 29 сентября 2026.",
      },
      {
        q: "Собирать колоды на Crimson Cup под эти характеристики?",
        a: "Под характеристики патча 0.7, который вышел после этого: 29 сентября 2026 команда выпустила его как финальный патч баланса перед турниром, с переработанной картой Twister Toss и подорожавшими на 1 Bagheera, Mind Palace и Spellbook. Предварительный список карт Crimson Cup пришёл с обновлением от 21 сентября; турнир проходит с 20 по 25 октября 2026.",
      },
    ],
  },
  "demo-first-big-update": {
    title: "Первое большое обновление демо Origins TCG: новый интерфейс, тестовые бустеры, рейтинг и карты Crimson Cup",
    metaTitle: "Обновление демо Origins TCG: интерфейс, бустеры, рейтинг",
    description:
      "Обновление демо Origins TCG от 21 сентября: новый интерфейс, тестовые бустеры, список карт Crimson Cup, прогресс из демо и плейтеста, рейтинг на Next Fest.",
    summary:
      "21 сентября Koin Games обновила бесплатную демо-версию Origins TCG: новый интерфейс и игровое поле, обучение для коллекционеров, тестовые бустеры и предварительный список карт Crimson Cup, причём прогресс сохраняется у всех. Рейтинговый режим включится вместе со Steam Next Fest.",
    highlights: [
      { label: "Новый интерфейс и поле", text: "экраны вокруг матча и игровое поле нарисованы заново", anchor: "novyy-interfeys" },
      { label: "Обучение для коллекционеров", text: "как устроено коллекционирование, с объяснением прямо в игре", anchor: "obuchenie-dlya-kollektsionerov" },
      { label: "Тестовые бустеры", text: "бустеры, которые можно открыть в демо", anchor: "testovye-bustery" },
      { label: "Новая озвучка", anchor: "novaya-ozvuchka" },
      { label: "Изменения баланса", text: "Dorothy стоит 4 и меняются 14 карт: полный патчноут", anchor: "izmeneniya-balansa" },
      { label: "Рейтинг на Steam Next Fest", text: "с 19 октября, с эксклюзивными наградами", anchor: "reytingovyy-rezhim" },
      { label: "Список карт Crimson Cup", text: "предварительный, турнирные колоды можно собирать уже сейчас", anchor: "spisok-kart-crimson-cup" },
      { label: "Прогресс сохраняется", text: "тот, что дальше продвинулся, — из демо или из плейтеста", anchor: "progress" },
      { label: "Плейтест", text: "нового контента нет, обновление с доработками позже на неделе", anchor: "a-pleytest" },
    ],
    body: `## Что меняется в демо {#chto-menyaetsya-v-demo}

Команда называет его «первым большим обновлением демо-версии Origins», и слово *первым* намекает, что до фестиваля будут и другие.

### Новый интерфейс и поле {#novyy-interfeys}

Экраны вокруг матча стали лучше, а у игрового поля новый облик.

### Обучение для коллекционеров {#obuchenie-dlya-kollektsionerov}

Оно объясняет главное о коллекционировании — то, что отличает Origins от других цифровых карточных игр: карты, которые вы открываете, которыми владеете и которые можете обменивать. Наш [гайд по экономике коллекционирования](/ru/guides/collector-economy) разбирает эту модель шаг за шагом.

### Тестовые бустеры {#testovye-bustery}

Бустеры, которые можно открыть прямо в демо, чтобы попробовать коллекционную сторону игры до полного запуска.

### Новая озвучка {#novaya-ozvuchka}

Обновление добавляет новые реплики персонажей; больше в объявлении о них ничего не сказано.

### Изменения баланса {#izmeneniya-balansa}

Подробности вышли в тот же вечер, в посте в Steam и в Discord: Dorothy дешевеет до 4 маны, у восьми карт меняются характеристики, Itsy Bitsy Spider становится Evil, шесть карт начинают работать иначе, а ещё исправлены два игровых правила и локация The Gallows. Всё это — в [статье с патчноутом](/ru/news/demo-patch-notes-0921), а также уже в [MetaShifting](/ru/metashifting) и в истории баланса каждой затронутой карты.

## Рейтинговый режим открывается со Steam Next Fest {#reytingovyy-rezhim}

Команда включит рейтинговый режим «с началом Steam Next Fest», с эксклюзивными наградами за рейтинг, подробности о которых пока не объявлены. Фестиваль идёт с понедельника, 19 октября 2026, 10:00 по тихоокеанскому времени, до понедельника, 26 октября. Когда ладдер откроется для всех, начнётся и первый настоящий [тир-лист](/ru/tier-list) OriginsMeta, построенный на результатах.

## Список карт Crimson Cup уже в игре {#spisok-kart-crimson-cup}

С обновлением пришёл и предварительный список карт Crimson Cup — самого большого турнира, который Koin Games проводила до сих пор, с 20 по 25 октября: региональные квалификации 20, 21 и 22 октября, затем плей-офф и финалы, в формате Conquest, best-of-three, с гранд-финалом best-of-five. Призы общей стоимостью 10 000 долларов включают деньги, промокарты, бустеры и коробки Alpha Edition: это не денежный призовой фонд.

«Если не считать будущих патчей баланса, можно начинать готовить колоды к турниру», — пишет команда. Два инструмента, чтобы начать:

- [конструктор колод](/ru/deck-builder), чей турнирный режим проверяет правила Conquest прямо во время сборки;
- [гайд по Steam Next Fest](/ru/guides/steam-next-fest-2026) с датами, временем и тем, как зарегистрироваться в Discord.

**Обновление от 30 сентября:** патч баланса вышел 29 сентября. [Патч 0.7](/ru/news/patch-0-7), который команда называет финальным патчем баланса перед турниром, перерабатывает карту Twister Toss и делает Bagheera, Mind Palace и Spellbook дороже на 1.

## Прогресс: что вы сохраняете {#progress}

Это был открытый вопрос. 16 сентября сообщение команды в Discord подтвердило, что [открытые колоды и прогресс по боссам перейдут из Demo 1 в Demo 2](/ru/news/demo-2-progress-carryover), но о закрытом плейтесте в нём не было ни слова. Теперь команда говорит прямо: тот, кто играл в демо, в плейтест или в обе версии, сохраняет прогресс той, где продвинулся дальше, «так что никому не придётся открывать карты заново».

Это важно, потому что открывать карты долго. В плейтесте каждая колода открывается после трёх побед в рейтинге и победы над ИИ-боссом — путь, который игроки назвали изнурительным в [отзывах от 14 сентября](/ru/news/playtest-feedback-deck-unlock).

## А плейтест? {#a-pleytest}

Тот, кто играет в закрытый плейтест, не получает с этим обновлением новых колод, карт или боссов. Доработки дойдут до плейтеста позже на этой неделе, вместе с другими изменениями, которые команда хочет проверить с игроками: тем, кто фармит там рейтинговые матчи, придётся подождать несколько дней.

## Чего мы пока не знаем {#chego-my-poka-ne-znaem}

- Что это за эксклюзивные награды за рейтинг.
- Открыто ли уже составление колод для всех в публичной демо-версии: в объявлении об этом не сказано.

**Обновление от 22 сентября:** на два вопроса появился ответ. Подробности баланса опубликованы ([патчноут](/ru/news/demo-patch-notes-0921)), а объявление теперь есть и в Steam, где оно вышло 21 сентября в 21:59 UTC.

## Слух, который подтвердился {#slukh-kotoryy-podtverdilsya}

На прошлой неделе в соцсетях ходила фраза о «Demo Season 2», которая должна выйти на следующей неделе, с новыми колодами, новыми наградами и первым знакомством с коллекционированием. Мы [подали это как слух](/ru/news/demo-2-animations-and-fixes), потому что ни один официальный пост этого не подтверждал. Сроки и часть про коллекционирование оказались верными.`,
    faq: [
      {
        q: "Потеряю ли я прогресс с обновлением демо Origins TCG?",
        a: "Нет. Тот, кто играл в демо, в закрытый плейтест или в обе версии, сохраняет прогресс той, где продвинулся дальше, так что открывать карты заново не придётся (объявление команды от 21 сентября 2026).",
      },
      {
        q: "Когда в демо Origins TCG начинается рейтинговый режим?",
        a: "С началом Steam Next Fest, в понедельник, 19 октября 2026, с эксклюзивными наградами за рейтинг, подробности о которых пока не объявлены.",
      },
      {
        q: "Можно ли уже собирать колоды на Crimson Cup?",
        a: "Да: предварительный список карт турнира есть в игре с обновления от 21 сентября, а патч 0.7 от 29 сентября — финальный патч баланса перед Crimson Cup, которая проходит с 20 по 25 октября 2026.",
      },
      {
        q: "Что меняется для игроков плейтеста?",
        a: "Пока ни новых колод, ни карт, ни боссов: обновление с доработками дойдёт до плейтеста позже на неделе 21 сентября, вместе с другими изменениями для проверки.",
      },
    ],
  },
  "forum-bugs-before-demo-2": {
    title: "Зависшие матчи, яйцо в Colosseum и кнопка реванша: сообщения выходных",
    metaTitle: "Баги Origins TCG: зависшие матчи, Colosseum, Golden Egg",
    description:
      "Три сообщения с форума Origins TCG от 19–20 сентября: матч, зависший на ожидании, Golden Egg в локации Colosseum и кнопка реванша для приватных матчей.",
    summary:
      "Три новые темы на форуме Steam с 19 по 20 сентября, команда пока ни на одну не ответила: матч, который зависает после боя, Golden Egg, который странно ведёт себя в Colosseum, и просьба о кнопке реванша в приватных матчах.",
    highlights: [
      { label: "Матч завис на «waiting»", text: "после боя, сообщение от 20 сентября; один игрок связал это с картой Spellbook", anchor: "match-zavis" },
      { label: "Golden Egg в Colosseum", text: "призванная им Golden Goose не нанесла в бою урона", anchor: "golden-egg" },
      { label: "Кнопка реванша", text: "просьба для приватных матчей, со сменой колоды прямо в лобби", anchor: "knopka-revansha" },
      { label: "Что сказала команда", text: "её последние ответы на форуме датированы 16 сентября", anchor: "chto-skazala-komanda" },
    ],
    body: `## Матч завис на «waiting» {#match-zavis}

20 сентября один игрок сообщил о матче, который завис после фазы боя: экран оставался на «waiting» намного дольше таймера, хотя всё остальное было кликабельным и матч всё ещё можно было сдать.

Другой игрок ответил, что это известный баг, связанный с картой Spellbook, и что его должны исправить в «demo season 2 next week». Этот ответ дал игрок, а не команда, и на тот момент это не было объявлением.

**Обновление от 21 сентября:** [первое большое обновление демо-версии](/ru/news/demo-first-big-update) действительно вышло на следующий день. Список исправлений пока не опубликован, поэтому мы не можем сказать, есть ли среди них этот баг.

## Golden Egg в Colosseum {#golden-egg}

19 сентября другой игрок описал бой в локации Colosseum:

1. его Golden Egg разбило При раскрытии карты Black Knight, которое наносит 2 урона врагу напротив;
2. яйцо призвало Golden Goose, 5/5, в ту же ячейку;
3. в бою Goose не нанесла урона: Black Knight, 2/2, выжил, а у Goose осталось 5/3.

Похоже на правило, которое разработчик Fenchurch объяснил на форуме 15 сентября: персонаж, призванный посреди боя в ячейку, где он появляется, не атакует до следующего раунда. От урона призыв его не защищает, отсюда и 5/3. Что добавляет к этому Colosseum, пока неясно: в теме до сих пор нет ответа.

## Кнопка реванша для приватных матчей {#knopka-revansha}

Третья тема — это просьба: кнопка «сыграть ещё» или «реванш» в конце приватного матча и возможность сменить колоду, не выходя из приватного лобби.

## Что сказала команда {#chto-skazala-komanda}

Последние ответы команды на форуме датированы 16 сентября: [более быстрые анимации и баг Off With Your Head!](/ru/news/demo-2-animations-and-fixes) и [переработка ИИ в боях с боссами](/ru/news/demo-2-boss-ai-rework).`,
  },
  "demo-2-progress-carryover": {
    title: "Demo 2.0 сохраняет открытые в Demo 1 колоды и прогресс по боссам",
    metaTitle: "Origins TCG Demo 2.0 сохраняет прогресс из Demo 1",
    description:
      "Сообщение команды Koin Games в Discord от 16 сентября: открытые колоды и прогресс по боссам из Demo 1 игры Origins TCG переходят в Demo 2.",
    summary:
      "16 сентября сотрудник Koin Games написал на официальном Discord, что в Demo 2 переходят колоды, открытые в Demo 1, и прогресс по боссам. 21 сентября команда распространила это обещание и на закрытый плейтест.",
    highlights: [
      { label: "Открытое в Demo 1 сохраняется", text: "колоды и прогресс по боссам, написал сотрудник команды в Discord 16 сентября", anchor: "chto-napisala-komanda" },
      { label: "Почему это было важно", text: "в плейтесте каждая колода стоит трёх побед в рейтинге и победы над боссом", anchor: "pochemu-eto-bylo-vazhno" },
      { label: "Плейтест тоже считается", text: "с 21 сентября сохраняется прогресс той версии, где вы продвинулись дальше", anchor: "obnovlenie-ot-21-sentyabrya" },
    ],
    body: `## Что написала команда {#chto-napisala-komanda}

«Demo V2 deck will carry over your V1 deck unlock/boss progress»: такое сообщение сотрудник команды Origins опубликовал на официальном Discord вечером 16 сентября, отвечая игрокам, которые спрашивали, придётся ли всем начинать заново. Скриншот сообщения на следующее утро появился на Reddit.

## Почему это было важно {#pochemu-eto-bylo-vazhno}

В плейтесте каждая колода открывается после трёх побед в рейтинге и победы над ИИ-боссом — путь, который игроки назвали изнурительным в [отзывах от 14 сентября](/ru/news/playtest-feedback-deck-unlock). Повторять его с нуля в Demo 2 — вот чего больше всего опасались. До этого сообщения в сообществе ходил как раз противоположный ответ.

## Что оставалось открытым {#chto-ostavalos-otkrytym}

Сообщение говорило только о Demo 1 и Demo 2. Будет ли учитываться и прогресс из закрытого плейтеста, ни в одном официальном посте написано не было, поэтому тогда мы разделяли эти два случая.

## Обновление от 21 сентября {#obnovlenie-ot-21-sentyabrya}

Вопрос закрыт. Объявляя [первое большое обновление демо-версии](/ru/news/demo-first-big-update), команда написала, что тот, кто играл в демо, в плейтест или в обе версии, сохраняет прогресс той, где продвинулся дальше, «так что никому не придётся открывать карты заново».`,
  },
  "demo-2-boss-ai-rework": {
    title: "Koin переработает ИИ боссов в Demo 2.0",
    metaTitle: "Origins TCG: Koin переработает ИИ боссов в Demo 2.0",
    description:
      "Разработчик Fenchurch подтверждает на форуме Steam переработку ИИ в боях с боссами Origins TCG в Demo v2 после жалобы на босса миссий Dracula.",
    summary:
      "Один игрок рассказал, что босс миссий Dracula выигрывает каждый случайный бросок. Разработчик Koin Games Fenchurch ответил на форуме Steam, что ИИ в боях с боссами перерабатывается для Demo v2 и что боссы и открытие карт продолжат меняться.",
    highlights: [
      { label: "Жалоба", text: "Dracula, босс миссий, будто бы выигрывал каждый случайный бросок", anchor: "zhaloba" },
      { label: "Переработка ИИ боссов обещана для Demo v2", text: "подтвердил разработчик Fenchurch 16 сентября", anchor: "otvet-komandy" },
      { label: "Почему это важно", text: "боссы — часть пути, который открывает колоды", anchor: "pochemu-eto-vazhno" },
      { label: "После обновления от 21 сентября", text: "в объявлении о боссах ничего не сказано", anchor: "obnovlenie-ot-21-sentyabrya" },
    ],
    body: `## Жалоба {#zhaloba}

15 сентября один игрок опубликовал на форуме Steam рассказ о четырёх партиях против Dracula, босса миссий демо-версии. Предыдущие боссы, писал он, были сильными, но честными: все побеждены с первой попытки готовыми колодами, открытыми прямо перед ними. Dracula же, казалось, угадывал каждый «случайный» эффект:

- тыквы всегда попадали в барьер с наименьшим запасом здоровья;
- заклинания, наносящие 6 урона случайной цели, всегда попадали в самого сильного миньона с 6 Здоровья или меньше;
- случайный сброс всегда забирал самую опасную карту в руке;
- случайные призывы всегда оказывались в лучшей ячейке.

## Ответ команды {#otvet-komandy}

Разработчик Fenchurch ответил 16 сентября: «Our boss fight AI will be getting a re-work in Demo v2». Он добавил, что команда продолжит следить за тем, как работают бои с боссами и открытие карт, и менять их.

Это не первое изменение боссов. Патчноут плейтеста 0.6.3 от 27 августа уже дал им «new upgraded bot intelligence», и команда спрашивала игроков, стали ли боты умнее или глупее.

## Почему это важно {#pochemu-eto-vazhno}

Боссы — часть пути к открытию колод: в плейтесте колода открывается после трёх побед в рейтинге и победы над ИИ-боссом. Босс, который кажется нечестным, замедляет всю коллекцию. Это уже второй раз за неделю, когда этот путь всплывает в темах с отзывами, после [ответа от 14 сентября](/ru/news/playtest-feedback-deck-unlock) о том, чтобы сделать эти матчи только PvE.

## Обновление от 21 сентября: что было дальше {#obnovlenie-ot-21-sentyabrya}

21 сентября вышло [первое большое обновление демо-версии](/ru/news/demo-first-big-update). В объявлении о боссах не говорится: есть ли в нём уже новый ИИ, пока неизвестно.`,
  },
  "demo-2-animations-and-fixes": {
    title: "Перед Demo 2.0: ускорение анимаций подтверждено, баг Off With Your Head! в списке исправлений",
    metaTitle: "Origins TCG: быстрые анимации и фикс Off With Your Head!",
    description:
      "Что команда Origins TCG подтвердила 16 сентября: более быстрые анимации, исправление бага Off With Your Head! в Demo v2, сообщения о звуке и один слух.",
    summary:
      "16 сентября команда подтвердила на форуме Steam, что анимации ускорят, а невидимые копии от Off With Your Head! — известный баг, который исправят в Demo v2. Тем временем ходил слух о «Demo Season 2».",
    highlights: [
      { label: "Более быстрые анимации", text: "команда говорит, что их ускорят в одном из ближайших обновлений", anchor: "bolee-bystrye-animatsii" },
      { label: "Баг Off With Your Head!", text: "полуневидимые копии, известный баг, который исправят в Demo v2", anchor: "bag-off-with-your-head" },
      { label: "Звук", text: "сообщения передадут звуковой команде", anchor: "zvuk" },
      { label: "Слух о «Demo Season 2»", text: "со сроками он угадал: обновление демо вышло 21 сентября", anchor: "slukh-o-demo-season-2" },
    ],
    body: `## Более быстрые анимации {#bolee-bystrye-animatsii}

«Animations need to be sped up 100–200%»: тема, открытая 11 сентября, собрала в основном согласные ответы, лишь один игрок написал, что скорость его устраивает. 16 сентября сотрудник команды ответил, что команда признаёт необходимость ускорить анимации и что «it'll be amended in an upcoming update».

## Баг Off With Your Head! {#bag-off-with-your-head}

Новый игрок описал копии Christopher Robin, которые появлялись без иллюстрации, только с видимыми Силой и Здоровьем. Разработчик Fenchurch нашёл карту, которая за этим стоит: Off With Your Head!, которая уничтожает союзника и призывает его базовую копию во всех остальных локациях. Полуневидимые копии — известный баг, и «it will be fixed when we release Demo v2 here really soon».

## Звук {#zvuk}

Игроку, который перечислил несколько багов, Fenchurch ответил, что сообщения о звуке передадут звуковой команде.

## Слух о «Demo Season 2» {#slukh-o-demo-season-2}

В те же дни в соцсетях ходила фраза: «Demo Season 2» выйдет на следующей неделе, с новыми колодами, новыми наградами и первым знакомством с коллекционированием. Ни один официальный пост в Steam, в Discord или на origins-tcg.com этого не подтверждал, поэтому мы подали это как слух и придерживались официальных дат: Steam Next Fest с 19 по 26 октября.

**Обновление от 21 сентября:** со сроками слух угадал. [Первое большое обновление демо-версии](/ru/news/demo-first-big-update) вышло 21 сентября, с обучением для коллекционеров и тестовыми бустерами. Список исправлений пока не опубликован, поэтому мы не можем сказать, есть ли среди них баг Off With Your Head!.`,
  },
  "davdas-3-pigs-mid-range": {
    title: "3 Pigs Mid Range: мидрейндж-колода с Three Not So Little Pigs для ладдера и соревновательной игры",
    metaTitle: "Новая колода команды Origins TCG: 3 Pigs Mid Range",
    description:
      "Мидрейндж-колода Origins TCG во главе с Three Not So Little Pigs для ладдера и соревнований: захватить поле, выиграть локацию, добить картой En Passant.",
    summary:
      "Вторая колода Davdas из команды OriginsMeta — мидрейндж во главе с Three Not So Little Pigs, с тегами для ладдера и соревновательной игры. План: захватить поле в первых раундах, выиграть хотя бы одну локацию, а затем добить картой En Passant, Пробивным ударом карты Ellen Trechend и картами Lightning Strike, которые создаёт Impundulu. На странице колоды — полный список с графиками состава, заметки автора о муллигане, код игры, кнопка, чтобы открыть колоду в конструкторе, и два гайда о том, как ею играть.",
  },
  "davdas-healing-healsing": {
    title: "Healing Healsing, первая колода сообщества: контроль с Van Helsing для ладдера",
    metaTitle: "Первая колода Origins TCG на OriginsMeta: Van Helsing",
    description:
      "Первая колода, опубликованная на OriginsMeta: контроль с Van Helsing для ладдера Origins TCG, который исцеляется сквозь урон и поздно очищает поле.",
    summary:
      "Первую колоду на OriginsMeta опубликовал Davdas из команды OriginsMeta: контроль во главе с Van Helsing для рейтингового ладдера. План: набрать ранней ценности с Spellbook и Ali Baba, исцелять урон, пока Phuong Hoang растёт с каждым исцелением, затем дожить до 8-го или 9-го раунда и очистить поле картой Forbidden Knowledge. На странице колоды — полный список с графиками состава, заметки автора о муллигане, код игры, кнопка, чтобы открыть колоду в конструкторе, и два гайда о том, как ею играть.",
  },
  "playtest-feedback-deck-unlock": {
    title: "Отзывы о плейтесте: Koin читает форум Steam и может перенести открытие колод в PvE",
    metaTitle: "Плейтест Origins TCG: открытие колод может уйти в PvE",
    description:
      "Отзывы о плейтесте Origins TCG: колода открывается за три победы в рейтинге и босса; Fenchurch говорит, что Koin читает форум и может сделать это PvE.",
    summary:
      "В текущем плейтесте колода открывается тремя победами в рейтинговых матчах и победой над ИИ-боссом; игроки называют это изнурительным, когда со стартовой колодой попадают на соперников с полными коллекциями. Разработчик Fenchurch ответил, что команда читает каждый пост на форуме Steam и рассматривает вариант сделать матчи для открытия колод только PvE. Также сообщается: карты, создающие случайные карты (Humpty, Spellbook), могут добавить в колоду лишние Легендарные, есть просьбы переделать Spellbook, а При раскрытии карты Asanbosam не повторяется в локации Cloning Lab.",
  },
  "kickstarter-ama-pre-registration": {
    title: "AMA по Kickstarter прошла: предрегистрация открыта, коробки Alpha Edition только по предзаказу",
    metaTitle: "Kickstarter Origins TCG: коробки Alpha только по предзаказу",
    description:
      "AMA по Kickstarter Origins TCG от 10 сентября: скидка 15% за возвратный депозит в 1 доллар, коробки Alpha только по предзаказу. Дата и новости — в гайде.",
    summary:
      "10 сентября Koin Games ответила на официальном Discord на вопросы о будущей кампании на Kickstarter. Дата кампании пока не объявлена; официальная страница предрегистрации даёт скидку 15% на старте за депозит в 1 доллар, который полностью возвращается до запуска. Origins Myths & Legends Alpha Edition выходит в коллекционных бустерах по 5 карт (гарантированно хотя бы одна Редкая или выше), коробках по 24 бустера и кейсах по 6 коробок; коробки и кейсы продаются только по предзаказу, и тираж не повторится. Картами торгуют на Торговой площадке Steam; открытие бустеров на телефоне запланировано на 2027 год.",
  },
  "gameplay-trailer": {
    title: "На YouTube вышел официальный трейлер геймплея",
    metaTitle: "Официальный трейлер геймплея Origins TCG на YouTube",
    description:
      "Первый официальный трейлер геймплея Origins TCG вышел на YouTube: самый быстрый способ увидеть темп матча и интерфейс до выхода Demo 2.0.",
    summary:
      "На официальном YouTube-канале Origins TCG вышел первый трейлер, посвящённый геймплею: самый быстрый способ увидеть темп матча и интерфейс до того, как Demo 2.0 появится на Steam Next Fest.",
  },
  "itzbolt-wins-conquest": {
    title: "itzBolt выигрывает Big Bob's Playtest Battle, первый турнир в формате Conquest",
    metaTitle: "Origins TCG: itzBolt выигрывает первый турнир Conquest",
    description:
      "itzBolt выиграл Big Bob's Playtest Battle, первый турнир Origins TCG в формате Conquest, сыгранный на плейтесте 0.6.3 в матчах best-of-three.",
    summary:
      "Турнир сообщества на сборке плейтеста 0.6.3, с полноценным составлением колод и форматом Conquest (несколько колод с разными Легендарными, best-of-3), выиграл itzBolt — по результатам, которыми поделилось сообщество (официального поста с результатом мы не нашли). Это была первая публичная проверка формата, который Koin с тех пор выбрала для Crimson Cup.",
  },
  "biggest-tournament-ever": {
    title: "Анонс Crimson Cup: самый большой турнир в истории игры к Steam Next Fest",
    metaTitle: "Анонс Crimson Cup к Steam Next Fest",
    description:
      "9 сентября Koin Games объявила турнир Crimson Cup в Origins TCG: 20–25 октября, региональные квалификации, призы на 10 000 долларов. С итоговыми правилами.",
    summary:
      "Многодневное событие с 20 по 25 октября: квалификации для каждого из трёх крупных регионов 20, 21 и 22 октября, затем плей-офф и финалы. Призы на 10 000 долларов: эксклюзивная промокарта 1/1, другие промокарты, цифровые бустеры, коробки и кейсы Alpha и денежные призы. Регистрация в Discord; креаторы могут запросить вайлд-кард с приглашением сразу в плей-офф.",
    highlights: [
      { label: "20–25 октября", text: "квалификации для трёх крупных регионов 20, 21 и 22 октября, затем плей-офф и финалы", anchor: "chto-obyavila-koin" },
      { label: "Призы на 10 000 долларов", text: "промокарта 1/1, другие промокарты, цифровые бустеры, коробки и кейсы Alpha, деньги", anchor: "obyavlennye-prizy" },
      { label: "Регистрация в Discord", text: "креаторы могут запросить вайлд-кард сразу в плей-офф", anchor: "registratsiya-i-vayld-kardy" },
      { label: "Итоговые правила", text: "Conquest с тремя колодами и обязательный чек-ин, утверждены 24 сентября", anchor: "obnovlenie-ot-25-sentyabrya" },
    ],
    body: `Правила, формат и чек-ин, утверждённые 24 сентября: [правила Crimson Cup](/ru/news/crimson-cup-format-check-in).

## Что Koin объявила 9 сентября {#chto-obyavila-koin}

9 сентября Koin Games объявила в Steam о своём самом большом турнире в истории: многодневном событии во время Steam Next Fest, с 20 по 25 октября 2026.

1. **Квалификации**, по одной для каждого из трёх крупных регионов, 20, 21 и 22 октября.
2. **Плей-офф и финалы** после квалификаций.

## Объявленные призы {#obyavlennye-prizy}

Призы общей стоимостью 10 000 долларов бывают нескольких видов:

- эксклюзивная промокарта 1/1;
- другие промокарты;
- цифровые бустеры;
- коробки и кейсы Alpha;
- денежные призы.

## Регистрация и вайлд-карды {#registratsiya-i-vayld-kardy}

Регистрация — на [официальном Discord Origins TCG](https://discord.gg/originstcg). Авторы контента могут запросить приглашение-вайлд-кард, которое проводит их сразу в плей-офф.

## Обновление от 25 сентября 2026 {#obnovlenie-ot-25-sentyabrya}

Эта статья рассказывает о первом объявлении, от 9 сентября. 24 сентября, после опроса игроков, Koin Games утвердила формат: Conquest с тремя колодами, не меньше 8 уникальных карт между каждой парой колод, списки колод скрыты до топ-4, а в матчах best-of-five бана нет. Чек-ин обязателен: он открывается за два часа до каждой квалификации и закрывается за пять минут до старта, вместе с приёмом колод. Турнир играется на основной демо-версии, а точный призовой фонд обещали сообщить на следующей неделе.

Правила, время чек-ина и то, чего мы пока не знаем, — в [нашей статье о правилах Crimson Cup](/ru/news/crimson-cup-format-check-in); даты, количество мест по регионам и подготовка — в нашем [гайде по Steam Next Fest 2026](/ru/guides/steam-next-fest-2026).`,
  },
  "patch-0-6-3": {
    title: "Патч плейтеста 0.6.3: настройка шестнадцати карт, King Arthur вырастает до 7/7",
    metaTitle: "Патч 0.6.3 Origins TCG: King Arthur 7/7, 16 карт",
    description:
      "Патч плейтеста Origins TCG 0.6.3 от 27 августа: усиления King Arthur, Merlin и Lancelot, ослабления Bandersnatch и Bigfoot, три переработки, умнее боссы.",
    summary:
      "Патч с настройкой и исправлениями, на котором через два дня играли турнир Big Bob's. Усилены King Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll и Blow the House Down; ослаблены Bandersnatch, Bigfoot, Scarecrow и Merlin's Prophecy; переработаны Bagheera, Christopher Robin и Sandman. ИИ боссов стал умнее.",
  },
  "big-bobs-playtest-battle": {
    title: "Big Bob's Playtest Battle вводит формат Conquest",
    metaTitle: "Big Bob's Playtest Battle: Conquest в Origins TCG",
    description:
      "Big Bob's Playtest Battle, 28 августа: первый турнир Origins TCG в формате Conquest, best-of-three на выбывание, с вайлд-кардами на турнир Next Fest.",
    summary:
      "Турнир 28 августа на сборке плейтеста с полноценным составлением колод. Best-of-3, игра на выбывание и первое использование Conquest: нужно сдать несколько колод с разными Легендарными и минимум девятью разными картами и забанить одну колоду соперника. Призы: вайлд-карды на турнир Next Fest и Collector Packs.",
  },
  "patch-0-6-2": {
    title: "Патч плейтеста 0.6.2: перебалансировка 23 карт",
    metaTitle: "Патчноут 0.6.2 Origins TCG: изменены 23 карты",
    description:
      "Патч плейтеста Origins TCG 0.6.2 от 21 августа: Mulan получает Двойную атаку, Queen of Hearts стоит 4 маны, Van Helsing's Tools бесплатна. Изменены 23 карты.",
    summary:
      "У восьми карт изменилось то, что делает их способность. Mulan получает Двойную атаку, Queen of Hearts дешевеет до 4 маны, 3/3 с Первым ударом, Ellen Trechend становится картой 3/3 за 8 маны, которая растёт на +3/+3 за каждого врага. Van Helsing's Tools теперь бесплатна, но Silver Bullet наносит 1 урон. Коллекция теперь ограничена десятью колодами плейтеста.",
  },
  "patch-0-6-1-ranked": {
    title: "Патч 0.6.1: рейтинговый ладдер, таблица лидеров Grandmaster, три колоды перенастроены",
    metaTitle: "Патч 0.6.1: рейтинговый ладдер и Grandmaster",
    description:
      "Патч Origins TCG 0.6.1 от 14 августа: рейтинговый режим с мировой таблицей лидеров дивизиона Grandmaster, удобные настройки и Huntsman за 6 маны.",
    summary:
      "Появляется рейтинговый режим с мировой таблицей лидеров для дивизиона Grandmaster, а также удобства: можно пропустить обучение, увидеть Легендарную соперника во время муллигана и отключить эмоции. Huntsman становится картой 6/6 за 6 маны; в колодах Swarm, Evil и Discard заменено по одной карте.",
  },
  "demo-2-playtest": {
    title: "Плейтест Demo 2.0: 5 новых колод, больше 70 новых карт и составление колод",
    metaTitle: "Плейтест Origins TCG Demo 2.0: 5 колод, 70+ карт",
    description:
      "Обновление Origins TCG к Steam Next Fest с 7 августа идёт на плейтесты сообщества: 5 новых колод, 70+ новых карт и составление колод, для всех через Discord.",
    summary:
      "Обновление, которое выйдет к Steam Next Fest в октябре, уходит на плейтесты сообщества: старт в пятницу, 7 августа, в 21:00 UTC с игровым вечером. Открыто для всех через Discord.",
  },
  "demo-stats-ama": {
    title: "Первые цифры демо: больше 1000 игроков, больше 13 000 матчей, медиана 1 ч 51 мин",
    metaTitle: "Цифры демо Origins TCG: 1000+ игроков, 13 000+ матчей",
    description:
      "Через шесть дней после запуска демо Origins TCG перевалило за 1000 игроков и 13 000 матчей при медиане 1 ч 51 мин. А ещё AMA, первый турнир и Card Party.",
    summary:
      "Через шесть дней после запуска команда делится статистикой демо и анонсирует AMA с CEO Tim Jooste и главой геймдизайна Kevin Lambert 22 июля, первый турнир демо-версии 24 июля и стенд на Card Party в Форт-Лодердейле 24–26 июля.",
  },
  "demo-live": {
    title: "Демо-версия Origins TCG вышла в Steam",
    metaTitle: "Демо Origins TCG вышло с эксклюзивными предметами",
    description:
      "Бесплатное демо Origins TCG вышло в Steam, с эксклюзивными коллекционными предметами, которых потом не будет и которыми можно будет торговать после релиза.",
    summary:
      "Бесплатное демо с эксклюзивными коллекционными предметами, которых потом не будет и которыми можно будет торговать на Торговой площадке Steam после выхода полной игры. В тот же день — праздник запуска в Discord.",
  },
  "creator-program": {
    title: "Анонсирована программа для креаторов, подробности — на AMA в Discord",
    metaTitle: "Программа для креаторов Origins TCG: AMA в Discord",
    description:
      "Koin Games открывает программу для креаторов Origins TCG перед Steam Next Fest. Подробности — на AMA 19 августа, запись в Discord. OriginsMeta подала заявку.",
    summary:
      "Koin Games открывает программу для креаторов перед Steam Next Fest. Подробности рассказали на AMA 19 августа в 20:00 UTC; запись есть в Discord. OriginsMeta подала заявку.",
  },
  "community-open": {
    title: "Официальный Discord открыт для всех",
    metaTitle: "Официальный Discord Origins TCG открыт для всех",
    description:
      "Официальный Discord Origins TCG, где собирались первые альфа-тестеры, открыт для всех: демо анонсировано как скорое, первый взгляд на коллекционные предметы.",
    summary:
      "Сервер, на котором собирались первые альфа-тестеры, открывается для всех: демо-версия анонсирована как скорая, а коллекционные предметы показаны впервые.",
  },
  "metal-cards-tease": {
    title: "CEO показал физические металлические карты",
    metaTitle: "CEO показал металлические карты Origins TCG",
    description:
      "CEO Koin Games Tim Jooste появился на видео с металлическими картами по Origins TCG. Ни продукта, ни даты не объявлено: пока лишь заявка о намерениях.",
    summary:
      "Tim Jooste появился на видео с металлическими коллекционными картами по вселенной игры. Ни продукта, ни даты не объявлено: заявка о намерениях от студии, которая делает ставку на цифру.",
  },
  "steam-page-live": {
    title: "Страница в Steam открыта: можно добавить в список желаемого, демо на подходе",
    metaTitle: "Страница Origins TCG в Steam: список желаемого открыт",
    description:
      "Страница Origins TCG в Steam открыта, игру можно добавить в желаемое, а первый пост команды обещает быстрые матчи и коллекционирование как в ККИ.",
    summary:
      "Первый пост команды в Steam: коллекционная карточная игра, построенная на быстрых тактических матчах и коллекционной системе по образцу физических ККИ.",
  },
  "digital-lgs-program": {
    title: "Digital LGS Program: Origins TCG хочет, чтобы игровые магазины проводили еженедельные турниры и продавали сеты",
    metaTitle: "Digital LGS Program Origins TCG: игровые магазины",
    description:
      "Основатель Koin Games показал Digital LGS Program для Origins TCG: еженедельные турниры, промо только вживую и предзаказ сетов в местных игровых магазинах.",
    summary:
      "6 октября Tim Jooste, основатель и CEO Koin Games, представил в X программу Digital LGS Program: местные игровые магазины будут проводить еженедельные турниры по Origins, продавать бустеры и промокарты, доступные только в магазинах, и принимать предзаказы коллекционных сетов, которых не будет в игре. Очные события начнутся в начале 2027 года; Set 1 выходит на Kickstarter 27 октября, и магазины участвуют в запуске. 8 октября официальный аккаунт Origins добавил условия: магазины принимают предзаказы за долю выручки, без затрат и без склада, потому что всё — предметы инвентаря Steam, а взамен проводят организованные турниры.",
    highlights: [
      { label: "Digital LGS Program", text: "основатель Koin Games представляет её в X: сеты Origins будут продаваться через местные игровые магазины", anchor: "programma-digital-lgs" },
      { label: "Турниры, промо, предзаказы", text: "еженедельные турниры в магазинах, бустеры и промо только вживую, предзаказ сетов, которых нет в игре", anchor: "chto-poluchayut-magaziny" },
      { label: "Как это работает для магазинов", text: "предзаказы за долю выручки, без затрат и без склада, взамен — организованные турниры (8 октября)", anchor: "kak-eto-rabotaet-dlya-magazinov" },
      { label: "Начало 2027 года, Kickstarter 27 октября", text: "очные события стартуют в начале 2027 года; Set 1 выходит на Kickstarter вместе с магазинами, заинтересованы уже больше 30", anchor: "daty" },
      { label: "Креаторы и AMA", text: "у стримеров и креаторов своя программа; AMA для магазинов и креаторов 12 октября в 21:00 UTC", anchor: "u-kreatorov-svoya-versiya" },
      { label: "Чего мы не знаем", text: "какие магазины и страны, какая доля выручки, как часто проходят события и когда они начнутся", anchor: "chego-my-poka-ne-znaem" },
    ],
    body: `## Программа Digital LGS {#programma-digital-lgs}

6 октября 2026 **Tim Jooste**, основатель и CEO Koin Games, опубликовал в X длинный пост с коротким видео. Он описывает вечер в вашем местном игровом магазине (LGS), когда у вас с собой только телефон: вечер матчей по Origins против игроков вашего города, промокарта, доступная только в магазине, за которую можно побороться, и бустер следующего коллекционного сета, который можно предзаказать. Студия называет это **Digital LGS Program**, и, по его словам, программа делает Origins «the 1st digital card game to distribute sets through local game stores around the world».

Это утверждение основателя, и проверить его мы не можем. А вот что в посте сказано ясно, так это устройство программы: цифровая карточная игра с физической сетью магазинов, которые проводят её события и продают её сеты.

**Обновление от 11 октября:** 8 октября официальный аккаунт Origins в X объяснил, как программа работает для магазинов. Они принимают предзаказы и получают долю выручки, участие ничего не стоит, и держать склад не нужно, потому что карты и бустеры — это предметы инвентаря Steam. Взамен магазины проводят организованные турниры — единственное место, где можно получить некоторые промокарты и особые бустеры. Аккаунт также анонсировал AMA для владельцев магазинов и креаторов в понедельник, 12 октября, в 21:00 UTC. Подробности — в разделах ниже.

## Что получают магазины и что получают игроки {#chto-poluchayut-magaziny}

В посте перечислены четыре вещи:

- **Местные еженедельные турниры**, которые проходят в магазине.
- **Эксклюзивные бустеры и промокарты, доступные только вживую**: карты, которые можно получить, только если прийти.
- **Предзаказы будущих коллекционных сетов**, которых не будет в игре, с наградами за поддержку своего магазина.
- И, как сказано в посте, знакомство с живыми людьми, игра и новые друзья вживую.

Магазинам, которые хотят участвовать, предлагают связаться с Jooste напрямую: его личные сообщения в X открыты, и он предлагает созвониться.

## Как это работает для магазинов: подробности от 8 октября {#kak-eto-rabotaet-dlya-magazinov}

Через два дня после основателя, 8 октября, официальный аккаунт Origins TCG в X объяснил программу в посте подлиннее. Отправная точка: в традиционных карточных играх именно местные магазины строят сообщество, учат новичков и регулярно проводят события, а на местных турнирах часто разыгрываются лучшие призы. Origins задумана как цифровая игра, говорится в посте, но её сообщество всё равно заслуживает настоящих мест для встреч. Условия:

- **Предзаказы и доля выручки.** Магазины-участники могут принимать предзаказы на коллекционные продукты Origins и получать долю выручки. Какова эта доля, в посте не сказано.
- **Без склада.** Карты, бустеры, коробки и кейсы будут существовать как предметы инвентаря Steam, поэтому магазинам не нужно закупать товар, держать склад, отдавать место на полках или отправлять заказы.
- **Нулевые затраты.** Участие «costs literally $0», говорится в посте, при этом магазины получают выгоду не меньшую, а то и большую, чем с физической карточной игрой. Это сравнение принадлежит Koin.
- **Организованные турниры взамен.** Магазины-участники проводят организованные турниры. Origins будет направлять игроков в эти магазины и поддерживать их как местные центры игры.
- **Награды только на событиях.** Уникальные промокарты и особые бустеры можно получить, только участвуя в турнирах в магазинах-участниках. Origins не будет продавать эти турнирные карты и не положит их в обычные бустеры.
- **Сеть, которая может расти.** Организованная игра начинается с ежеквартальных местных событий и может перейти к более частым соревнованиям, региональным турнирам и в конечном счёте к структуре чемпионата мира.

Одна деталь пока не сходится: в посте основателя говорилось о еженедельных турнирах в магазинах, а в официальном посте сеть описана как начинающаяся с ежеквартальных местных событий. Ни один из постов не объясняет, как одно сочетается с другим.

## Даты: начало 2027 года, Kickstarter 27 октября {#daty}

- **Очные события официально стартуют в начале 2027 года**. Магазинам, говорится в посте, не обязательно ждать до тех пор.
- **Set 1 выходит на Kickstarter 27 октября 2026**: ту же дату основатель назвал 17 сентября, и её же показывает меню демо-версии (в нашем [гайде по Kickstarter](/ru/guides/origins-tcg-kickstarter) собрано всё, что подтверждено на сегодня). В отличие от большинства кампаний карточных игр, пишет Jooste, Koin работает с местными магазинами над самим запуском.
- За **два месяца** студия уже пообщалась с **более чем 30 магазинами**, которые хотят участвовать.

## У креаторов своя версия {#u-kreatorov-svoya-versiya}

В посте добавлено, что существует версия программы для стримеров и авторов контента, без подробностей. Призыв к действию обращён и к игрокам и коллекционерам: отметьте под постом свой любимый магазин или TCG-креатора.

8 октября, отвечая в той же ветке, официальный аккаунт анонсировал **AMA о программе для владельцев магазинов и креаторов в понедельник, 12 октября, в 21:00 UTC** в своём Discord для креаторов. Чтобы принять участие, нужно написать в личные сообщения @origins_tcg в X.

## Почему это важно {#pochemu-eto-vazhno}

Origins всегда описывала себя как игру, где соревноваться можно бесплатно и которая создана для коллекционеров: рейтинговая игра ничего не стоит, а коллекция живёт на [двух уровнях карт](/ru/guides/collector-economy), соревновательном и коллекционном. До сих пор коллекционная сторона была анонсирована только в цифровом виде: бустеры Alpha Edition на Kickstarter, торговля на Торговой площадке Steam; единственным физическим намёком были [металлические карты](/ru/news/metal-cards-tease), снятые на видео в марте. Программа для магазинов даёт ей физическое место: турнир во вторник вечером, промокарта, которую можно выиграть только там, сет, который предзаказываешь у прилавка. И, согласно посту от 8 октября, без физических товаров: то, что продаёт магазин, остаётся в инвентаре Steam. Для цифровой игры это ещё и способ найти игроков там, где в карточные игры уже играют.

Две оговорки. Условия взяты из двух постов в X, основателя и официального аккаунта, а не с официальной страницы с договором и списком магазинов, и доля выручки, которая достаётся магазинам, не указана. И если вы хотите проводить турниры до 2027 года, ждать программу не нужно: наш [организатор турниров](/ru/tournaments) бесплатен, и сообщество уже им пользуется.

## Чего мы пока не знаем {#chego-my-poka-ne-znaem}

- Какие страны и магазины участвуют и будет ли публичный список.
- Насколько велика доля выручки и как предзаказ, сделанный в магазине, попадает в инвентарь Steam игрока: код, привязка к аккаунту или что-то ещё.
- Что значат «сеты, которых не будет в игре» для коллекции: официальный пост говорит, что продукты — это предметы инвентаря Steam и что турнирные промокарты и особые бустеры никогда не продаются, но не говорит, будут ли целые сеты продаваться только через магазины.
- Как часто проходят события в магазинах (основатель писал «еженедельно», официальный пост начинает с ежеквартальных местных событий), когда пройдут первые и каковы их правила: приватные комнаты в игре или отдельный режим, и идут ли результаты в зачёт региональных турниров или чемпионата мира.
- Цены, награды за предзаказ через магазин и как на событиях выдаются промокарты и особые бустеры.
- Условия версии для креаторов. AMA 12 октября может ответить на часть этих вопросов.

## Источники {#istochniki}

[Пост Tim Jooste в X](https://x.com/TimothyJooste/status/2107532013687418943) от 6 октября 2026, с 15-секундным видео, и [пост официального аккаунта Origins TCG](https://x.com/origins_tcg/status/2108281049721491549) от 8 октября 2026, с [ответом, анонсирующим AMA](https://x.com/origins_tcg/status/2108281052212985975). На 7 октября на странице игры в Steam поста о программе не было; мы обновим эту статью после AMA или когда Koin Games опубликует официальные условия.`,
    faq: [
      {
        q: "Что такое Digital LGS Program в Origins TCG?",
        a: "Программа, которую 6 октября 2026 анонсировал в X основатель и CEO Koin Games Tim Jooste: местные игровые магазины проводят еженедельные турниры по Origins, продают эксклюзивные бустеры и промокарты, доступные только вживую, и принимают предзаказы будущих коллекционных сетов, которых не будет в игре. 8 октября официальный аккаунт Origins добавил условия для магазинов: предзаказы за долю выручки, без затрат и без склада, взамен — организованные турниры. Страница с полными условиями пока не опубликована.",
      },
      {
        q: "Когда начнутся события Origins TCG в магазинах?",
        a: "Согласно посту, очные события официально стартуют в начале 2027 года, но магазины могут присоединиться раньше: Set 1 выходит на Kickstarter 27 октября 2026, и Koin Games говорит, что работает над запуском вместе с местными магазинами.",
      },
      {
        q: "Как игровому магазину присоединиться к программе Origins TCG?",
        a: "Связаться с Koin Games напрямую: Tim Jooste говорит, что его личные сообщения в X открыты, и предлагает созвониться, а официальный аккаунт просит владельцев магазинов и креаторов написать ему в личные сообщения, чтобы принять участие в AMA о программе в понедельник, 12 октября 2026, в 21:00 UTC. За два месяца, по словам основателя, на связь уже вышли больше 30 магазинов. Есть и версия программы для стримеров и авторов контента.",
      },
      {
        q: "Сколько магазину стоит участие в программе Origins TCG?",
        a: "Ничего, по словам официального аккаунта Origins (8 октября 2026): карты, бустеры, коробки и кейсы — это предметы инвентаря Steam, поэтому магазинам не нужно закупать товар, держать склад или отправлять заказы. Они принимают предзаказы и получают долю выручки, размер которой не опубликован, а взамен проводят организованные турниры.",
      },
    ],
  },
  "crimson-cup-prizepool-qualifiers": {
    title: "Crimson Cup: призовой фонд раскрыт, ещё две квалификации и семь локаций вне турнира",
    metaTitle: "Призовой фонд Crimson Cup в Origins TCG и новые квалификации",
    description:
      "Koin Games раскрывает призовой фонд Crimson Cup в Origins TCG: промокарта Dracula 1/1 и 1500 долларов победителю, бустеры до топ-256, ещё две квалификации.",
    summary:
      "5 октября Koin Games опубликовала распределение призов Crimson Cup: победитель получает промокарту Dracula 1/1, два кейса бустер-боксов и 1500 долларов, а все из топ-256 получают как минимум два бустера. Пост также добавляет две квалификации, AMER 19 октября в 19:00 EST и EMEA 22 октября в 19:00 CEST, убирает из турнирного пула семь локаций, слишком зависящих от случайности, и анонсирует еженедельные тренировочные турниры.",
    highlights: [
      { label: "Призовой фонд", text: "промокарта Dracula 1/1, два кейса и 1500 долларов победителю; бустеры вплоть до топ-256", anchor: "prizovoy-fond" },
      { label: "Ещё две квалификации", text: "AMER 19 октября в 19:00 EST и EMEA 22 октября в 19:00 CEST, из каждой проходят 32 игрока", anchor: "eshche-dve-kvalifikatsii" },
      { label: "Что меняется в расписании", text: "AMER 21-го в 21:00 EST, проходят 32 игрока, 96 вайлд-кардов", anchor: "chto-menyaetsya-v-raspisanii" },
      { label: "Семь локаций вне турнира", text: "Junkyard, Cloning Lab, Reflecting Pool и ещё четыре, уже отключены в боях в комнатах", anchor: "sem-lokatsiy-vne-turnira" },
      { label: "Тренировочные турниры", text: "еженедельные, без ставок, следующий — на этой неделе", anchor: "trenirovochnye-turniry" },
    ],
    body: `## Призовой фонд {#prizovoy-fond}

Фонд, по словам команды, «consists of a split between prize money, collectibles and exclusive promo cards». На первую часть призов может рассчитывать каждый, кто попадёт в топ-256; промокарты начинаются с топ-32. Графика с наградами, приложенная к посту, даёт распределение:

| Место | Промокарта | Продукт | Деньги |
|---|---|---|---|
| Победитель | промокарта Dracula 1/1 | 2 кейса бустер-боксов | 1500 $ |
| 2-е | промокарта Dracula 1/8 | 1 кейс бустер-боксов | 750 $ |
| 3-е и 4-е | промокарта Dracula 1/8 | 2 бустер-бокса | 350 $ |
| Топ-8 | промокарта Dracula 1/8 | 1 бустер-бокс | 125 $ |
| Топ-16 | карта Finalist Plus | 1 бустер-бокс | – |
| Топ-32 | карта Finalist | 10 бустеров | – |
| Топ-64 | – | 8 бустеров | – |
| Топ-128 | – | 4 бустера | – |
| Топ-256 | – | 2 бустера | – |

Промокарта на графике — золотая Dracula с подписью «Tournament Winner», Myths & Legends #209, в грейдинговом слэбе. Строка «Prizes worth $10,000» из сентябрьского объявления осталась и на новой графике с календарём. В плей-офф 256 мест, так что, по цифрам самой Koin, каждый, кто прошёл квалификацию или попал туда по вайлд-карду, уже уносит домой как минимум два бустера.

## Ещё две квалификации {#eshche-dve-kvalifikatsii}

«Due to popular demand» Koin добавляет две квалификации во время Steam Next Fest, одну для часовых поясов Америки и одну для EMEA:

1. **AMER, понедельник, 19 октября, 19:00 EST.**
2. **EMEA, четверг, 22 октября, 19:00 CEST**, которая завершает квалификации.

Каждая отправляет в плей-офф 32 игрока, как и три остальные. Просьба команды та же, что и в сентябре: регистрируйтесь только на те турниры, на которых действительно сможете сыграть, и оставьте места другим игрокам. Регистрация — на [официальном Discord](https://discord.gg/originstcg). Чек-ин работает как раньше: открывается за два часа до каждой квалификации и закрывается за пять минут до старта, вместе с приёмом колод ([правила](/ru/news/crimson-cup-format-check-in#chek-in)).

## Что меняется в расписании {#chto-menyaetsya-v-raspisanii}

Пост говорит только о двух новых квалификациях, но приложенная к нему графика с календарём меняет и другие цифры. Пять квалификаций, по 512 мест в каждой, из каждой проходят 32 игрока:

- AMER, 19 октября, 19:00 EST (новая);
- EMEA, 20 октября, 19:00 CEST;
- AMER, 21 октября, 21:00 EST: на сентябрьской графике было 19:00 EST и 64 проходящих, теперь это зачёркнуто;
- APAC, 22 октября, 19:00 SGT;
- EMEA, 22 октября, 19:00 CEST (новая).

Вайлд-кардов становится 96 вместо 128: пять раз по 32 плюс 96 дают 256, то есть состав плей-офф. Плей-офф и финалы не сдвигаются: плей-офф 24 октября в 10:00 EST (16:00 CEST, 22:00 SGT), четыре игрока проходят в финалы 25 октября в 10:00 EST. Турнир теперь начинается 19 октября, в первый день Steam Next Fest, а не 20-го. Даты и время, как всегда на этом сайте, взяты с официальной графики, без наших пересчётов.

## Семь локаций вне турнира {#sem-lokatsiy-vne-turnira}

«There are a select few locations in Origins which are very RNG heavy», говорится в посте, поэтому семь локаций на турнире отключены: [Junkyard](/ru/locations#junkyard), [Cloning Lab](/ru/locations#cloning-lab), [Reflecting Pool](/ru/locations#reflecting-pool), [Amplifying Amphitheatre](/ru/locations#amplifying-amphitheatre), [Giant's Beacon](/ru/locations#giants-beacon), [The Colosseum](/ru/locations#the-colosseum) и [Nostradamus' Call](/ru/locations#nostradamus-call). Что делает каждая из них, смотрите на нашей [странице локаций](/ru/locations).

Этот турнирный пул уже действует в демо, когда вы играете бои в комнатах (Create/Join Room Battle): именно там стоит тренироваться с локациями Crimson Cup. Пул появился в [обновлении плейтеста от 1 октября](/ru/news/playtest-patch-notes-1001#turnirnyy-pul), где ещё не было сказано, какие локации исключены.

## Тренировочные турниры {#trenirovochnye-turniry}

Поскольку большинство матчей в демо идёт против ботов, Koin проводит еженедельные тренировочные турниры: без ставок, просто место, где можно сыграть с живыми людьми и проверить свои колоды. Следующий пройдёт на этой неделе; день и время скоро объявят, а регистрация — в том же [Discord](https://discord.gg/originstcg). Если хотите провести собственный по правилам Crimson Cup, [организатор турниров](/ru/tournaments) OriginsMeta поддерживает чек-ин, скрытые списки колод и матчи best-of-three.

## Что это значит для игроков {#chto-eto-znachit-dlya-igrokov}

- **Больше мест и больше временных слотов.** Пять квалификаций вместо трёх, две в европейское время и две в американское: выбирайте ту, в которой действительно сыграете.
- **Каждый участник плей-офф что-то получает.** Два бустера начиная с топ-256, карта Finalist начиная с топ-32, деньги начиная с топ-8.
- **Собирайте колоды без расчёта на эти семь локаций.** Копий Cloning Lab и Reflecting Pool на Crimson Cup не будет. С тремя колодами помогут наш [гайд по Conquest](/ru/guides/origins-tcg-conquest) и [конструктор колод](/ru/deck-builder).

## Чего мы пока не знаем {#chego-my-poka-ne-znaem}

- День и время тренировочного турнира на этой неделе.
- Значит ли строка Top 8 на графике с призами места с 5-го по 8-е, по одному набору призов на каждого: мы понимаем её так.
- Почему квалификация AMER 21 октября на новой графике стоит на 21:00 EST, а на сентябрьской — на 19:00 EST: в посте об этом не сказано.
- Как считаются уникальные карты между двумя колодами — вопрос, открытый ещё с [правил от 24 сентября](/ru/news/crimson-cup-format-check-in#conquest-s-tremya-kolodami).

## Источники {#istochniki}

- [Официальный пост в Steam](https://store.steampowered.com/news/app/4429430/view/1845383656394214) от 5 октября 2026, «Prizepool announcement & key update to our biggest tournament ever», с двумя графиками: наградами и обновлённым календарём.
- [Объявление от 9 сентября](/ru/news/biggest-tournament-ever) и [правила от 24 сентября](/ru/news/crimson-cup-format-check-in) — для цифр, которые изменились.`,
    faq: [
      {
        q: "Что получает победитель Crimson Cup?",
        a: "Промокарту Dracula 1/1, два кейса бустер-боксов и 1500 долларов, согласно графике с наградами, которую Koin Games опубликовала 5 октября 2026. Второе место получает промокарту Dracula 1/8, один кейс и 750 долларов; третье и четвёртое — промокарту 1/8, два бустер-бокса и 350 долларов.",
      },
      {
        q: "Когда теперь проходят квалификации Crimson Cup?",
        a: "Пять квалификаций по 512 мест: AMER 19 октября в 19:00 EST, EMEA 20 октября в 19:00 CEST, AMER 21 октября в 21:00 EST, APAC 22 октября в 19:00 SGT и EMEA 22 октября в 19:00 CEST. Из каждой проходят 32 игрока, плюс 96 вайлд-кардов, в плей-офф 24 октября.",
      },
      {
        q: "Какие локации исключены из Crimson Cup?",
        a: "Семь: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum и Nostradamus' Call, отключённые потому, что слишком зависят от удачи. Бои в комнатах в демо уже используют турнирный пул.",
      },
    ],
  },
};
