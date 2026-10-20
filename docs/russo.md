# Il russo su OriginsMeta

Settima lingua del sito dal 20/10/2026 (richiesta di Pierluigi: "procediamo con il russo"). Indirizzo `/ru`,
`hreflang="ru"`, `<html lang="ru">`, `og:locale` ru_RU, chiave `ru` accanto a `de` in tutto il codice. I testi delle carte della
collezione sono quelli ufficiali letti nel gioco (sezione qui sotto).

## Varietà e tono

- Russo standard, si dà del **вы** (minuscolo, come si fa sul web), mai del ты.
- Gergo dei giocatori come lo usano i giocatori russi di TCG digitali: «колода», «тир-лист», «мета», «муллиган»,
  «архетип», «билд» solo nel gergo; il Deck builder è «конструктор колод».
- Nomi di carte, luoghi, mazzi, eventi e prodotti **in inglese**, senza virgolette e senza declinarli (Merlin, Queen of
  Hearts, Crimson Cup, Steam Next Fest, Demo 2.0, MetaShifting, Conquest, OriginsMeta Tracker, Analytics): quando la
  frase vuole un caso, si appoggia il nome a un sostantivo («карта Merlin», «колода Queen of Hearts», «турнир Crimson
  Cup»). Le etichette di allineamento del sito restano Good / Evil / Neutral.
- Virgolette «…» (dentro: „…“), trattino lungo — con gli spazi, «ё» scritta dove serve alla lettura.
- Date «25 сентября 2026», mesi al genitivo minuscoli; numeri «10 000» (spazio insecabile), decimali con la virgola
  «3,5», percentuali «98%».
- La dicitura di non affiliazione: «не связан с Koin Games» (o «неофициальный фан-сайт, не связанный с Koin Games»):
  non si toglie mai.

## Testi di gioco: il glossario del gioco

Partiti il pomeriggio del 20/10/2026 con una traduzione nostra provvisoria, i testi russi delle 122 carte della collezione
sono quelli ufficiali **letti nel gioco la notte del 20/10/2026** (demo in «Русский», collezione con «Не в коллекции»
acceso): trascrizione in `docs/testi-ufficiali/ru.tsv`, scritti in `card-lore-ru.ts` con
`node scripts/official-texts.mjs ru --apply`, `ru` in `officialTextLocales`. Carte create e rimosse, luoghi, storico,
pastiglie, `GAME_KEYWORDS`, guide, news, FAQ ed etichette restano traduzioni nostre, ma col glossario del gioco qui sotto.

**Lo stile del gioco**: le carte parlano in terza persona («Наносит 3 урона…», «Даёт…», «Призывает…», «Уничтожает…»,
«Перемещает…», «Возвращает…»), i personaggi in prima persona («получаю», «перемещаюсь», «превращаюсь», «возвращаюсь»);
l'imperativo col вы solo per pescare, scartare e scegliere («Возьмите карту», «Сбросьте…», «Выберите…»).

| Inglese | Russo del gioco |
| --- | --- |
| On Reveal | При раскрытии |
| On Death | При смерти |
| On Kill | При убийстве |
| Shield | Щит («Даёт Щит ЛЮБОМУ персонажу») |
| Trample | **Пробивной удар** (non «Натиск»: «с Пробивным ударом») |
| Deathtouch | Смертельное касание |
| Defender | Защитник («даёт ему Защитника») |
| Rebirth | Возрождение |
| First Strike | Первый удар («с Первым ударом») |
| Double Attack | Двойная атака |
| Snipe | Меткий выстрел N |
| Move (parola chiave) | **Перемещение**; il verbo nei testi: «перемещает», «перемещаюсь», «перемещались» |
| Stun | Оглушение (parola chiave), nei testi «Оглушает ЛЮБОГО персонажа» |
| ANY | ЛЮБОЙ / ЛЮБОГО / ЛЮБОМУ (maiuscolo, accordato); ALL «ВСЕМ» / «ВСЕХ» |
| deal N damage | наносит N урона (1 урон, 2/3/4 урона, 6/10 урона) |
| heal N damage | исцеляет N урона (персонажа / барьера) |
| draw a card | Возьмите карту / Возьмите 2 карты |
| discard | сбросьте (imperativo), сбрасывает, «Когда меня сбрасывают» |
| summon | Призывает … в случайную ячейку / в две случайные ячейки |
| return to hand | Возвращает … в руку владельца |
| destroy | Уничтожает |
| ally / enemy / opponent | союзник / враг / противник («барьер противника») |
| slot / location | ячейка / локация |
| barrier | барьер (minuscolo) |
| spell | заклинание («Когда вы разыгрываете заклинание») |
| play a character | «Когда вы играете союзника», «Когда вы играете Доброго персонажа» |
| round / game | раунд / партия («в этой партии», «до конца партии») |
| before / after combat | Перед боем / После боя |
| at the start of the round | В начале раунда |
| graveyard | кладбище |
| cost (lowest / highest / even) | стоимость (наименьшей / наибольшей / чётной стоимостью) |
| permanently | навсегда |
| Good / Evil (allineamento) | Добрый / Злой («Доброго персонажа», «вашим Злым персонажам»); etichette del sito in inglese |
| Choose one: … OR … | Выберите одно: … ИЛИ … |
| mana | маны («+1 маны») |

Nelle guide per chi inizia la prima citazione di ogni parola chiave porta l'inglese tra parentesi: «При раскрытии
(On Reveal)».

## Nomi dell'interfaccia

Menu: Новости · Тир-лист · База данных · Гайды · Карты · Локации · FAQ · Analytics · Tracker · Колоды · Одиночные
колоды · Турнирные колоды · Конструктор колод · Драфт · Турниры и события · Рынок · Комиксы · О нас · Авторы.
Ruoli (tag): Staff, Creator, Автор, Pro, Community; chi ha pubblicato: «Опубликовано»; filtro «Роль». Account: «Мой
профиль», «Ваша публичная страница», «Редактировать мою публичную страницу», «Мои колоды»; «Войти» / «Выйти»;
donazione «Поддержать».

## SEO

- `metaTitle` con «Origins TCG» entro 60 caratteri, `description` 120–158, H1 delle news entro 110 (gli stessi test
  delle altre lingue).
- Ancore `{#…}` traslitterate in caratteri latini (а a, б b, в v, г g, д d, е/ё/э e, ж zh, з z, и i, й y, к k, л l,
  м m, н n, о o, п p, р r, с s, т t, у u, ф f, х kh, ц ts, ч ch, ш sh, щ shch, ы y, ъ ь —, ю yu, я ya): «Коротко» →
  `{#kratko}`, «Что изменилось» → `{#chto-izmenilos}`. Gli URL restano quelli inglesi (slug uguali in tutte le lingue).
- Font: le pagine russe caricano Unbounded, Manrope, JetBrains Mono, Noto Sans e Caveat con il sottoinsieme cirillico
  (istanze separate senza preload in `src/app/[locale]/layout.tsx`); Reenie Beanie non ha il cirillico e ripiega.

## Dove stanno i testi

Interfaccia `src/lib/dictionaries/ru.ts`; news `src/lib/data/news-ru.ts`; guide `src/lib/content/guides-ru.ts`; carte
`src/lib/data/card-lore-ru.ts`; chiave `ru` accanto a `de` in tutto il resto (storico, luoghi, FAQ, etichette).
Database: blocco `-- ===== 20/10/2026: RUSSO =====` di `schema.sql` e migrazione fatta la notte del 20/10/2026 (`DB_PENDING_LOCALES` vuoto).
