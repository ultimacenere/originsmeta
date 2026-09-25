# Spagnolo: regole per scrivere e tradurre (dal 25/09/2026)

Dal 25 settembre 2026 OriginsMeta è in tre lingue: inglese (riferimento), italiano e spagnolo. Ogni contenuto nuovo
(news, guide, carte, luoghi, eventi, testi dell'interfaccia) si scrive nelle tre lingue nella stessa sessione, con la
stessa cura SEO. Questo file raccoglie le scelte fatte per lo spagnolo, perché restino uguali da una sessione all'altra.

## Varietà e tono

- **Spagnolo neutro internazionale**, per chi gioca in Spagna e in America latina. Si dà del **tú**; mai *vosotros*
  (se serve un plurale si riformula: "los jugadores…", la forma impersonale con "se").
- Niente parole che cambiano da paese a paese: "PC" (non ordenador/computadora), "teléfono" (non móvil/celular),
  mai "coger"; niente intercalari come "vale", "guay", "chévere".
- Stessa voce dell'inglese e dell'italiano: diretta, concreta, frasi brevi, niente enfasi. OriginsMeta parla al "nosotros".
- Ortografia completa: accenti, ¿ e ¡ in apertura. Titoli e intestazioni con la sola iniziale maiuscola.
- Date "25 de septiembre de 2026" (mesi minuscoli); orari a 24 ore con il fuso dell'inglese ("19:00 CEST"), senza
  conversioni aggiunte; migliaia col punto e decimali con la virgola ("10.000", "3,5"); "98 %".

## Cosa non si traduce

- **Nomi delle carte, dei luoghi, dei mazzi della community, di prodotti ed eventi**: Merlin, Queen of Hearts,
  Van Helsing's Tools, Wonderland, "Healing Healsing", Steam Next Fest, Crimson Cup, Demo 2.0, MetaShifting. Il sito
  trasforma da solo i nomi delle carte in link: vanno scritti esattamente come nel database.
- **Parole chiave del gioco**, come in italiano: On Reveal, On Death, Shield, Trample, First Strike, Deathtouch,
  Rebirth, Defender, Stun, Double Attack, Move, Conquest. Gli allineamenti restano **Good / Evil / Neutral**
  ("tus personajes Good").
- Segnaposto tra graffe ({n}, {lang}, {from}…), emoji e notazioni delle statistiche ("+2⚔️/+2❤️", "[5⚔️/3❤️]").

## Glossario (EN → ES)

| inglese | spagnolo | nota |
|---|---|---|
| deck, decklist | mazo, lista del mazo | mai "baraja" |
| deck builder | Deck builder (nome dello strumento) | come in italiano |
| card, base card | carta, carta base | |
| Legendary | Legendaria (maiuscola, come "Leggendaria") | plurale Legendarias |
| created card (token) | carta creada | IT "carta generata" |
| unit, spell | unidad, hechizo | IT "unità, magia" |
| character, ally, enemy | personaje, aliado, enemigo | |
| barrier | barrera | |
| location | ubicación | sezione "Ubicaciones" |
| lane, space | carril, casilla | |
| mana, cost | maná, coste | |
| Power, Health | Poder, Salud | |
| round, turn, combat | ronda, turno, combate | |
| hand, graveyard | mano, cementerio | |
| draw, discard, summon, destroy, heal | robar, descartar, invocar, destruir, curar | |
| deal X damage | inflige X de daño | la carta di gioco evidenzia "X de daño" |
| ANY / OR (maiuscolo nei testi delle carte) | CUALQUIER / O | la carta di gioco evidenzia CUALQUIER |
| patch, patch notes | parche, notas del parche | |
| balance change, buff, nerf, rework | cambio de equilibrio, buff, nerf, rework | |
| ranked, qualifier | clasificatoria, clasificatorio | |
| best-of-three / five | al mejor de tres / cinco | |
| prize pool | bolsa de premios | "premios por un valor de 10.000 dólares" |
| boss | jefe | |
| pack, box | sobre, caja | |
| wishlist (Steam) | lista de deseados | |
| In brief (riquadro "In breve") | En resumen | "En breve" vuol dire "tra poco" |
| sign in (tasto dell'header) | Acceder | nel testo "iniciar sesión" |

Sezioni: Noticias · Tier list · Guías · Cartas · Mazos · Deck builder · Torneos y eventos · FAQ · Quiénes somos ·
Ubicaciones · Las más jugadas · Crea tu tier list · Autores.

## Dove sta lo spagnolo nel codice

- Interfaccia: `src/lib/dictionaries/es.ts` (tipo `Dictionary` = struttura di `en.ts`: il compilatore segnala le chiavi mancanti).
- News: terzo argomento di `n(en, it, es)` in `src/lib/data/news.ts` (il quarto, facoltativo, è il vecchio francese)
  e chiave `es` in `highlights` e `faq`.
- Guide: solo i testi in `src/lib/content/guides-es.ts` (`title`, `metaTitle`, `excerpt`, `faq`, `body`); categoria,
  carte, lista del mazzo, copertina, data e tempo di lettura vengono dalla versione inglese in `guides.ts`.
- Carte: `origin.es` e `es` (testo della carta) in `src/lib/data/card-lore.ts`; saghe in `cards.ts`; storico in
  `card-history.ts` (`note.es`). **I testi spagnoli delle carte sono una traduzione nostra dal testo inglese del
  gioco**: vanno confrontati nel gioco, come per l'inglese il 22/09/2026 (Pierluigi, 25/09/2026).
- Luoghi (`locations.ts`), eventi (`events.ts`), autori (`authors.ts`), archetipi (`decks.ts`), FAQ approvate e
  domande suggerite (`src/lib/content/faq.ts`): chiave `es` accanto a `it`.
- Messaggi Discord dei tornei (`src/lib/tournament/notify.ts`): restano in italiano e inglese, come il nostro server.

## SEO dello spagnolo

- Stesse regole delle altre lingue: `metaTitle` con "Origins TCG" entro 60 caratteri (meglio entro 46, così ci sta
  " · OriginsMeta"), description 120–158, H1 delle news entro 110, un solo H1 per pagina.
- Link interni sempre con `/es/…`; ancore `{#…}` tradotte in slug spagnoli (senza accenti), e ogni `highlights[].anchor`
  deve esistere nel `body` spagnolo della stessa news.
- hreflang, sitemap e `og:locale` (`es_ES`) si generano da soli da `locales` in `src/lib/i18n.ts`; la radice `/`
  manda a `/es` i browser in spagnolo (`next.config.ts`).
- Parole che cercano i giocatori: "Origins TCG", "mazos", "cartas", "guía", "tier list", "demo", "torneo", "parche".
