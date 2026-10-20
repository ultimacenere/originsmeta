# Il russo su OriginsMeta

Settima lingua del sito dal 20/10/2026 (richiesta di Pierluigi: "procediamo con il russo"). Indirizzo `/ru`,
`hreflang="ru"`, `<html lang="ru">`, `og:locale` ru_RU, chiave `ru` accanto a `de` in tutto il codice. Il gioco ha il
russo fra le lingue dell'interfaccia (pagina Steam: Russian), quindi i testi delle carte si leggono nel gioco come per le
altre lingue.

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

## Testi di gioco: glossario PROVVISORIO

I testi russi delle carte sono **una traduzione nostra provvisoria** finché non si legge il gioco in russo
(`card-lore-ru.ts`, `ru` NON in `officialTextLocales`: le schede dicono «не проверено в игре»). Quando Pierluigi apre la
demo in russo: trascrizione in `docs/testi-ufficiali/ru.tsv`, `node scripts/official-texts.mjs ru --apply`, `ru` in
`officialTextLocales` e si riallinea questo glossario in tutto il russo del sito (carte create e rimosse, storico, luoghi,
pastiglie, `GAME_KEYWORDS`, guide, news, FAQ, etichette).

| Inglese | Russo (provvisorio) |
| --- | --- |
| On Reveal | При раскрытии |
| On Death | При смерти |
| On Kill | При убийстве |
| Shield | Щит |
| Trample | Натиск |
| Deathtouch | Смертельное касание |
| Defender | Защитник |
| Rebirth | Возрождение |
| First Strike | Первый удар |
| Double Attack | Двойная атака |
| Snipe | Меткий выстрел |
| Move | Переместить (verbo della carta), перемещение |
| Stun | Оглушает / оглушить |
| ANY (nei testi delle carte) | ЛЮБОЙ / ЛЮБУЮ / ЛЮБОЕ (maiuscolo, accordato) |
| slot | ячейка |
| location | локация |
| Barrier | Барьер |
| Legendary | Легендарная (карта), легендарка solo nel gergo |
| spell | заклинание |
| round | раунд |
| Power / Health | Сила / Здоровье |
| Mana | мана |
| Ranked | рейтинговый режим |
| Good / Evil | Добро / Зло (nei testi delle carte; etichette del sito in inglese) |
| rarità | Обычная, Редкая, Эпическая, Легендарная |

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
Database: blocco `-- ===== 20/10/2026: RUSSO =====` di `schema.sql` e `ru` in `DB_PENDING_LOCALES` di `translate.ts`
finché la migrazione non è fatta (poi vuoto e arretrati con `translate-decks.mjs` e `translate-guides.mjs`).
