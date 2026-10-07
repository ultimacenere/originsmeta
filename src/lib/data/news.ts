import type { Locale } from "../i18n";
import type { GuideSlug } from "../content/guides";
import { frText, type NewsCopy } from "./news-fr";

/** Le lingue scritte in questo file; il francese (dal 07/10/2026) sta in news-fr.ts e si unisce in fondo (`withFrench`). */
type Base = Exclude<Locale, "fr">;
type BaseL10n = Record<Base, string>;
type L10n = Record<Locale, string>;
type Highlight = { label: string; text?: string; anchor: string };
type Qa = { q: string; a: string };
const n = (en: string, it: string, es: string): BaseL10n => ({ en, it, es });

/**
 * Una news è un articolo con una pagina propria, `/news/<slug>`, firmata come le guide (regola del
 * 21/09/2026: ogni articolo ha una pagina, una firma editoriale e i suoi parametri SEO). In /news e
 * in home compare come scheda con il riassunto; il testo completo sta nella pagina.
 */
export type NewsItem = {
  slug: string;
  /** data di pubblicazione (ISO): è la data dei fatti raccontati, non quella in cui li abbiamo scritti */
  date: string;
  /** data dell'ultima revisione (ISO), quando l'articolo è stato aggiornato dopo l'uscita; se manca vale `date` */
  updated?: string;
  /** titolo dell'articolo (H1 e scheda): entro 110 caratteri, il limite di Google per `headline` */
  title: L10n;
  /**
   * Titolo per la SERP, obbligatorio in ogni lingua (dal 25/09/2026: senza, il titolo dell'articolo usciva tagliato
   * con "…"): `pageTitle` ci aggiunge il marchio solo se manca, quindi con "Origins TCG" dentro deve stare entro
   * 60 caratteri, senza entro 46. Lo controlla `newsMeta.test.ts` in `npm test`.
   */
  metaTitle: L10n;
  /** riassunto di 2-3 frasi: scheda in /news e in home, attacco della pagina dell'articolo */
  summary: L10n;
  /** meta description scritta apposta, obbligatoria in ogni lingua: 120-158 caratteri (controllo in `newsMeta.test.ts`) */
  description: L10n;
  /**
   * Testo completo in Markdown, come le guide: sezioni `##`, elenchi, grassetti, link interni sempre con
   * il prefisso della lingua. I nomi delle carte diventano link da soli. Se manca, la pagina mostra il riassunto.
   */
  body?: L10n;
  /**
   * Le novità in sintesi, in cima all'articolo (richiesta di Pierluigi del 21/09/2026): ogni punto porta
   * alla sezione del testo che ne parla. `anchor` è l'ancora di un titolo del `body`, scritta nel Markdown
   * come `## Titolo {#ancora}` (vedi Markdown.tsx); `text` è la sintesi dopo i due punti, facoltativa.
   */
  highlights?: Record<Locale, Highlight[]>;
  /** domande e risposte in fondo all'articolo, anche come dati strutturati FAQPage */
  faq?: Record<Locale, Qa[]>;
  /** slug dell'autore che firma (src/lib/data/authors.ts); se manca firma chi risponde dei contenuti */
  author?: string;
  /**
   * fonte: post ufficiale su Steam, stampa, oppure un mazzo pubblicato sul sito (url interno senza prefisso lingua).
   * Per le novità del sito (`source: "site"`) la fonte è l'articolo stesso: `url` è la pagina del sito di cui parla
   * di più (percorso interno senza prefisso lingua) e non compare come "Fonte".
   * Manca solo su una news di stampa (`press`) il cui fatto non ha una fonte pubblica che possiamo citare: allora la
   * news non mostra nessun link "Fonte", non dichiara `isBasedOn`, la pill dice "News" e il riassunto dice da dove
   * viene il fatto senza nominare il sito (dal 25/09/2026, caso unico: `itzbolt-wins-conquest`, la cui fonte era un sito
   * della community che il sito non nomina più; `newsMeta.test.ts` lo controlla).
   */
  url?: string;
  /**
   * "staff" per i mazzi pubblicati dallo staff di OriginsMeta: mostra il tag Staff e basta, mai anche "Community".
   * "site" per le novità di OriginsMeta raccontate da noi (dal 24/09/2026, "Upgrade Meta"): pill OriginsMeta, niente "Fonte".
   */
  source: "steam" | "press" | "community" | "staff" | "site";
  /** copertina, sempre presente e diversa per ogni news: media kit ufficiale in /public/media, copertina di una carta o miniatura ufficiale YouTube */
  image: string;
  /** slug delle carte toccate dall'annuncio (o, per i mazzi della community, le carte del mazzo) */
  cards?: string[];
  /**
   * slug delle guide del sito collegate alla news ("Guide correlate" in fondo all'articolo): ogni news rimanda alla
   * guida che resta valida sul suo argomento (demo → play-the-demo, Crimson Cup e Conquest → steam-next-fest-2026…)
   */
  guides?: GuideSlug[];
};

/** Una news come è scritta qui sotto: inglese, italiano e spagnolo; il francese arriva da news-fr.ts. */
type RawNews = Omit<NewsItem, "title" | "metaTitle" | "summary" | "description" | "body" | "highlights" | "faq"> & {
  title: BaseL10n;
  metaTitle: BaseL10n;
  summary: BaseL10n;
  description: BaseL10n;
  body?: BaseL10n;
  highlights?: Record<Base, Highlight[]>;
  faq?: Record<Base, Qa[]>;
};

/**
 * Unisce a una news i suoi testi francesi (news-fr.ts). Lancia alla build se il francese manca o se ha un campo che
 * l'articolo non ha nelle altre lingue (o viceversa): una news nuova si scrive sempre nelle quattro lingue.
 */
function withFrench(item: RawNews): NewsItem {
  const fr: NewsCopy | undefined = frText[item.slug];
  if (!fr) throw new Error(`news "${item.slug}": manca il francese in src/lib/data/news-fr.ts`);
  for (const field of ["body", "highlights", "faq"] as const) {
    if (Boolean(item[field]) !== Boolean(fr[field])) throw new Error(`news "${item.slug}": il campo ${field} c'è solo in ${item[field] ? "news.ts" : "news-fr.ts"}`);
  }
  const { title, metaTitle, summary, description, body, highlights, faq, ...rest } = item;
  return {
    ...rest,
    title: { ...title, fr: fr.title },
    metaTitle: { ...metaTitle, fr: fr.metaTitle },
    summary: { ...summary, fr: fr.summary },
    description: { ...description, fr: fr.description },
    ...(body && fr.body ? { body: { ...body, fr: fr.body } } : {}),
    ...(highlights && fr.highlights ? { highlights: { ...highlights, fr: fr.highlights } } : {}),
    ...(faq && fr.faq ? { faq: { ...faq, fr: fr.faq } } : {}),
  };
}

const raw: RawNews[] = [
  {
    // Sesta news "Upgrade Meta" (07/10/2026): il francese, quarta lingua del sito. Solo quello che c'è davvero: le pagine
    // in /fr, i testi delle carte in francese dichiarati come traduzione nostra con il glossario provvisorio
    // (docs/francese.md), le traduzioni automatiche della community, il perché (il gioco è tradotto in francese) e
    // l'invito a segnalare gli errori. Copertina: key art ufficiale di Goldi, mai usata da una news (la usa la guida
    // Conquest, che non è fra le guide correlate di questo articolo).
    slug: "upgrade-meta-1007",
    image: "/media/ss-board-sea.webp",
    guides: ["play-the-demo", "origins-tcg-explained"],
    date: "2026-10-07",
    title: n(
      "Upgrade Meta: OriginsMeta speaks French, the site's fourth language, with every card, guide and news",
      "Upgrade Meta: OriginsMeta parla francese, quarta lingua del sito, con tutte le carte, le guide e le news",
      "Upgrade Meta: OriginsMeta habla francés, cuarto idioma del sitio, con todas las cartas, guías y noticias",
    ),
    metaTitle: n("Upgrade Meta: OriginsMeta for Origins TCG, now in French", "Upgrade Meta: OriginsMeta per Origins TCG ora in francese", "Upgrade Meta: OriginsMeta para Origins TCG, ya en francés"),
    description: n(
      "OriginsMeta is now in French: interface, news, guides, 230 cards, 44 locations, deck builder and tier lists. French card texts are our translation, for now.",
      "OriginsMeta è anche in francese: interfaccia, news, guide, 230 carte, 44 luoghi, deck builder e tier list. I testi delle carte, per ora, li traduciamo noi.",
      "OriginsMeta está en francés: interfaz, noticias, guías, 230 cartas, 44 ubicaciones y deck builder. El texto de las cartas, por ahora, es traducción nuestra.",
    ),
    summary: n(
      "As of 7 October 2026, OriginsMeta is also in French: interface, news, the 20 guides, the 230 cards, the 44 locations, FAQ, events, MetaShifting, deck builder, tier lists and community pages, at originsmeta.com/fr with the same addresses as the other languages. One thing to know: the French card texts are our translation with a provisional glossary, until we read the cards in the game in French. Deck guides, community guides and comics are translated into French automatically, and if you read French and spot a mistake, write to us.",
      "Dal 7 ottobre 2026 OriginsMeta è anche in francese: interfaccia, news, le 20 guide, le 230 carte, i 44 luoghi, FAQ, eventi, MetaShifting, deck builder, tier list e pagine della community, su originsmeta.com/fr con gli stessi indirizzi delle altre lingue. Una cosa da sapere: i testi francesi delle carte sono una nostra traduzione con un glossario provvisorio, finché non leggeremo le carte nel gioco in francese. Guide dei mazzi, guide della community e fumetti si traducono in francese in automatico, e se leggi il francese e trovi un errore, scrivici.",
      "Desde el 7 de octubre de 2026 OriginsMeta también está en francés: interfaz, noticias, las 20 guías, las 230 cartas, las 44 ubicaciones, FAQ, eventos, MetaShifting, deck builder, tier lists y páginas de la comunidad, en originsmeta.com/fr con las mismas direcciones que los demás idiomas. Una cosa que debes saber: los textos de las cartas en francés son traducción nuestra con un glosario provisional, hasta que leamos las cartas en el juego en francés. Las guías de los mazos, las guías de la comunidad y los cómics se traducen al francés automáticamente, y si lees francés y encuentras un error, escríbenos.",
    ),
    highlights: {
      en: [
        { label: "French is here", text: "the whole site at /fr: interface, news, guides, cards, locations, FAQ, events, MetaShifting, deck builder, tier lists and community", anchor: "french" },
        { label: "Card texts, honestly", text: "in French they are our translation with a provisional glossary; the card pages say so, and we'll align them to the game's text", anchor: "card-texts" },
        { label: "Community in French", text: "deck guides, community guides and comics translated automatically, tournaments in French, Discord with the French link", anchor: "community" },
        { label: "Why French", text: "the game is translated into French, and after Spanish it's the site's fourth language", anchor: "why-french" },
        { label: "Help us", text: "if you read French and spot a mistake, write to us: the Feedback button or our Discord", anchor: "help" },
      ],
      it: [
        { label: "Il francese è arrivato", text: "tutto il sito su /fr: interfaccia, news, guide, carte, luoghi, FAQ, eventi, MetaShifting, deck builder, tier list e community", anchor: "francese" },
        { label: "I testi delle carte, onestamente", text: "in francese sono una nostra traduzione con un glossario provvisorio; le schede lo dicono, e li allineeremo al testo del gioco", anchor: "testi-delle-carte" },
        { label: "La community in francese", text: "guide dei mazzi, guide della community e fumetti tradotti in automatico, tornei in francese, Discord con il link francese", anchor: "community" },
        { label: "Perché il francese", text: "il gioco è tradotto in francese, e dopo lo spagnolo è la quarta lingua del sito", anchor: "perche-il-francese" },
        { label: "Aiutaci", text: "se leggi il francese e trovi un errore, scrivici: il tasto Dicci la tua o il nostro Discord", anchor: "aiutaci" },
      ],
      es: [
        { label: "Llega el francés", text: "todo el sitio en /fr: interfaz, noticias, guías, cartas, ubicaciones, FAQ, eventos, MetaShifting, deck builder, tier lists y comunidad", anchor: "frances" },
        { label: "Los textos de las cartas, con honestidad", text: "en francés son traducción nuestra con un glosario provisional; las fichas lo dicen, y los alinearemos con el texto del juego", anchor: "textos-de-las-cartas" },
        { label: "La comunidad en francés", text: "guías de mazos, guías de la comunidad y cómics traducidos automáticamente, torneos en francés, Discord con el enlace francés", anchor: "comunidad" },
        { label: "Por qué el francés", text: "el juego está traducido al francés y, después del español, es el cuarto idioma del sitio", anchor: "por-que-el-frances" },
        { label: "Ayúdanos", text: "si lees francés y encuentras un error, escríbenos: el botón Tu opinión o nuestro Discord", anchor: "ayudanos" },
      ],
    },
    body: n(
      `## French is here {#french}

As of 7 October 2026, OriginsMeta is also in French, the fourth language of the site after English, Italian and Spanish. Switch language with EN · IT · ES · FR at the top of every page (on a phone, inside Menu). Every page keeps the same address as in the other languages, with the /fr/ prefix: originsmeta.com/fr/cards, /fr/guides, /fr/deck-builder. If your browser is in French, originsmeta.com takes you straight to the French version, and hreflang and sitemap list the four versions of each page.

What is in French: the interface, the 32 news published so far, the 20 [guides](/en/guides), the pages of the 230 [cards](/en/cards) (card text and origin note), the 44 [locations](/en/locations), the [FAQ](/en/faq), the [events](/en/tournaments), the balance history ([MetaShifting](/en/metashifting)), the [deck builder](/en/deck-builder), the [tier lists](/en/tier-list) and the community pages. We write standard French, readable in every French-speaking country, and card names stay in English, as in the game.

French had already appeared in the first version of the site, in September 2026, and was withdrawn on 15 September: it comes back rebuilt from scratch, with the same SEO rules as the other languages (one H1 per page, its own title and description, internal links, structured data).

## Card texts in French: our translation, for now {#card-texts}

In Italian and Spanish, each card page shows the game's official text, read in the game card by card on 25 September. In French we haven't done that yet: the texts of the 230 cards are an OriginsMeta translation, written with a provisional glossary of the keywords (On Reveal becomes "À la révélation", Shield "Bouclier", Trample "Piétinement", Deathtouch "Contact mortel", Defender "Défenseur", First Strike "Initiative"). Every French card page says so, with the line "Traduction d'OriginsMeta" under the text, and those texts are not presented as the game's. The same goes for the 44 locations, which we haven't checked in the game in any language yet.

As soon as we read the cards in the game in French, we'll align every text and every keyword to the official wording, on the card pages, in the guides and in the news, and we'll say so here.

## The community in French {#community}

What the community publishes is translated into French too, automatically, after publication, as already happens between English, Italian and Spanish: the guides of published decks (single and tournament decks), community guides and the creators' comics. The translations of what is already online arrive over the next few days. Tournaments can be created in French too, and [our Discord](https://discord.gg/RAG7nnrNGP) announces new content with the link to the French page as well.

## Why French {#why-french}

Origins TCG is translated into French: the game's Steam page lists French among its 13 languages, interface and audio included. After [Spanish, which arrived on 25 September](/en/news/upgrade-meta-0925), French is the fourth language of OriginsMeta, for the same reason: being read in the languages the game speaks.

## Help us get it right {#help}

If you read French and find a mistake, a clumsy sentence or a keyword that doesn't match the game, tell us: with the Feedback button, on every page, or on our Discord. We read everything and fix it in the next update.`,
      `## Il francese è arrivato {#francese}

Dal 7 ottobre 2026 OriginsMeta è anche in francese, quarta lingua del sito dopo inglese, italiano e spagnolo. La lingua si cambia con EN · IT · ES · FR in alto su ogni pagina (sul telefono dentro Menu). Ogni pagina tiene lo stesso indirizzo delle altre lingue, con il prefisso /fr/: originsmeta.com/fr/cards, /fr/guides, /fr/deck-builder. Se il browser è in francese, originsmeta.com porta direttamente alla versione francese, e hreflang e sitemap elencano le quattro versioni di ogni pagina.

Che cosa c'è in francese: l'interfaccia, le 32 news pubblicate finora, le 20 [guide](/it/guides), le schede delle 230 [carte](/it/cards) (testo della carta e riga sull'origine), i 44 [luoghi](/it/locations), le [FAQ](/it/faq), gli [eventi](/it/tournaments), lo storico dei bilanciamenti ([MetaShifting](/it/metashifting)), il [deck builder](/it/deck-builder), le [tier list](/it/tier-list) e le pagine della community. Scriviamo un francese standard, leggibile in tutti i paesi francofoni, e i nomi delle carte restano in inglese, come nel gioco.

Il francese era già comparso nella prima versione del sito, a settembre 2026, ed era stato ritirato il 15 settembre: torna rifatto da zero, con le stesse regole SEO delle altre lingue (un solo H1 per pagina, title e description propri, link interni, dati strutturati).

## I testi delle carte in francese: per ora una nostra traduzione {#testi-delle-carte}

In italiano e in spagnolo ogni scheda carta mostra il testo ufficiale del gioco, letto nel gioco carta per carta il 25 settembre. In francese non l'abbiamo ancora fatto: i testi delle 230 carte sono una traduzione di OriginsMeta, scritta con un glossario provvisorio delle parole chiave (Alla rivelazione diventa "À la révélation", Scudo "Bouclier", Travolgere "Piétinement", Tocco letale "Contact mortel", Difensore "Défenseur", Primo colpo "Initiative"). Ogni scheda carta in francese lo dice, con la riga "Traduction d'OriginsMeta" sotto il testo, e quei testi non vengono presentati come quelli del gioco. Lo stesso vale per i 44 luoghi, che non abbiamo ancora confrontato nel gioco in nessuna lingua.

Appena leggeremo le carte nel gioco in francese, allineeremo ogni testo e ogni parola chiave alla formulazione ufficiale, nelle schede, nelle guide e nelle news, e lo diremo qui.

## La community in francese {#community}

Anche quello che pubblica la community si traduce in francese, in automatico, dopo la pubblicazione, come già succede fra inglese, italiano e spagnolo: le guide dei mazzi pubblicati (mazzi singoli e mazzi torneo), le guide della community e i fumetti dei creator. Le traduzioni di quello che è già online arrivano nei prossimi giorni. I tornei si possono creare anche in francese, e il [nostro Discord](https://discord.gg/RAG7nnrNGP) annuncia le novità anche con il link alla pagina francese.

## Perché il francese {#perche-il-francese}

Origins TCG è tradotto in francese: la pagina Steam del gioco elenca il francese fra le sue 13 lingue, interfaccia e audio compresi. Dopo [lo spagnolo, arrivato il 25 settembre](/it/news/upgrade-meta-0925), il francese è la quarta lingua di OriginsMeta, per la stessa ragione: farsi leggere nelle lingue che parla il gioco.

## Aiutaci a farlo bene {#aiutaci}

Se leggi il francese e trovi un errore, una frase che suona male o una parola chiave che non corrisponde al gioco, diccelo: con il tasto Dicci la tua, su ogni pagina, o sul nostro Discord. Leggiamo tutto e correggiamo al primo aggiornamento utile.`,
      `## Llega el francés {#frances}

Desde el 7 de octubre de 2026 OriginsMeta también está en francés, el cuarto idioma del sitio después del inglés, el italiano y el español. Cambia de idioma con EN · IT · ES · FR en la parte superior de cada página (en el teléfono, dentro de Menú). Cada página conserva la misma dirección que en los demás idiomas, con el prefijo /fr/: originsmeta.com/fr/cards, /fr/guides, /fr/deck-builder. Si tu navegador está en francés, originsmeta.com te lleva directamente a la versión francesa, y hreflang y sitemap recogen las cuatro versiones de cada página.

Qué hay en francés: la interfaz, las 32 noticias publicadas hasta hoy, las 20 [guías](/es/guides), las fichas de las 230 [cartas](/es/cards) (texto de la carta y nota sobre el origen), las 44 [ubicaciones](/es/locations), las [FAQ](/es/faq), los [eventos](/es/tournaments), el historial de cambios de equilibrio ([MetaShifting](/es/metashifting)), el [deck builder](/es/deck-builder), las [tier lists](/es/tier-list) y las páginas de la comunidad. Escribimos un francés estándar, legible en todos los países francófonos, y los nombres de las cartas siguen en inglés, como en el juego.

El francés ya había aparecido en la primera versión del sitio, en septiembre de 2026, y se retiró el 15 de septiembre: vuelve rehecho desde cero, con las mismas reglas SEO que los demás idiomas (un solo H1 por página, title y description propios, enlaces internos, datos estructurados).

## Los textos de las cartas en francés: por ahora, traducción nuestra {#textos-de-las-cartas}

En italiano y en español, cada ficha de carta muestra el texto oficial del juego, leído en el juego carta por carta el 25 de septiembre. En francés todavía no lo hemos hecho: los textos de las 230 cartas son una traducción de OriginsMeta, escrita con un glosario provisional de las palabras clave (Al revelar pasa a ser "À la révélation", Escudo "Bouclier", Arrollar "Piétinement", Toque mortal "Contact mortel", Defensor "Défenseur", Primer golpe "Initiative"). Cada ficha de carta en francés lo dice, con la línea "Traduction d'OriginsMeta" bajo el texto, y esos textos no se presentan como los del juego. Lo mismo vale para las 44 ubicaciones, que aún no hemos comparado en el juego en ningún idioma.

En cuanto leamos las cartas en el juego en francés, alinearemos cada texto y cada palabra clave con la redacción oficial, en las fichas, en las guías y en las noticias, y lo diremos aquí.

## La comunidad en francés {#comunidad}

Lo que publica la comunidad también se traduce al francés, automáticamente, después de la publicación, como ya ocurre entre el inglés, el italiano y el español: las guías de los mazos publicados (mazos individuales y mazos de torneo), las guías de la comunidad y los cómics de los creators. Las traducciones de lo que ya está en línea llegan en los próximos días. Los torneos también se pueden crear en francés, y [nuestro Discord](https://discord.gg/RAG7nnrNGP) anuncia las novedades también con el enlace a la página francesa.

## Por qué el francés {#por-que-el-frances}

Origins TCG está traducido al francés: la página de Steam del juego incluye el francés entre sus 13 idiomas, interfaz y audio incluidos. Después del [español, que llegó el 25 de septiembre](/es/news/upgrade-meta-0925), el francés es el cuarto idioma de OriginsMeta, por la misma razón: que nos lean en los idiomas que habla el juego.

## Ayúdanos a hacerlo bien {#ayudanos}

Si lees francés y encuentras un error, una frase que suena mal o una palabra clave que no coincide con el juego, dínoslo: con el botón Tu opinión, en cada página, o en nuestro Discord. Leemos todo y lo corregimos en la siguiente actualización.`,
    ),
    faq: {
      en: [
        {
          q: "Is OriginsMeta available in French?",
          a: "Yes, since 7 October 2026: the whole site, with guides, news, cards, locations, tier lists and the deck builder. Switch language with EN · IT · ES · FR at the top of the page; community deck guides, guides and comics are translated automatically.",
        },
        {
          q: "Are the French card texts official?",
          a: "Not yet: they are OriginsMeta translations, written with a provisional glossary of the keywords, and every card page says so. The Italian and Spanish texts are the game's, read in the game on 25 September 2026. As soon as we read the cards in the game in French, we'll align the French texts to the official wording.",
        },
        {
          q: "Are community decks and guides translated into French?",
          a: "Yes, automatically after publication: the guides of published decks, community guides and the creators' comics. The translations of what is already online arrive over the next few days, and tournaments can be created in French too.",
        },
      ],
      it: [
        {
          q: "OriginsMeta è disponibile in francese?",
          a: "Sì, dal 7 ottobre 2026: tutto il sito, con guide, news, carte, luoghi, tier list e deck builder. La lingua si cambia con EN · IT · ES · FR in alto; le guide dei mazzi della community, le guide e i fumetti vengono tradotti in automatico.",
        },
        {
          q: "I testi francesi delle carte sono ufficiali?",
          a: "Non ancora: sono traduzioni di OriginsMeta, scritte con un glossario provvisorio delle parole chiave, e ogni scheda carta lo dice. I testi italiani e spagnoli sono quelli del gioco, letti nel gioco il 25 settembre 2026. Appena leggeremo le carte nel gioco in francese, allineeremo i testi francesi alla formulazione ufficiale.",
        },
        {
          q: "I mazzi e le guide della community vengono tradotti in francese?",
          a: "Sì, in automatico dopo la pubblicazione: le guide dei mazzi pubblicati, le guide della community e i fumetti dei creator. Le traduzioni di quello che è già online arrivano nei prossimi giorni, e i tornei si possono creare anche in francese.",
        },
      ],
      es: [
        {
          q: "¿OriginsMeta está disponible en francés?",
          a: "Sí, desde el 7 de octubre de 2026: todo el sitio, con guías, noticias, cartas, ubicaciones, tier lists y el deck builder. Cambia de idioma con EN · IT · ES · FR arriba en la página; las guías de los mazos de la comunidad, las guías y los cómics se traducen automáticamente.",
        },
        {
          q: "¿Los textos de las cartas en francés son oficiales?",
          a: "Todavía no: son traducciones de OriginsMeta, escritas con un glosario provisional de las palabras clave, y cada ficha de carta lo dice. Los textos en italiano y en español son los del juego, leídos en el juego el 25 de septiembre de 2026. En cuanto leamos las cartas en el juego en francés, alinearemos los textos franceses con la redacción oficial.",
        },
        {
          q: "¿Los mazos y las guías de la comunidad se traducen al francés?",
          a: "Sí, automáticamente después de la publicación: las guías de los mazos publicados, las guías de la comunidad y los cómics de los creators. Las traducciones de lo que ya está en línea llegan en los próximos días, y los torneos también se pueden crear en francés.",
        },
      ],
    },
    url: "/",
    source: "site",
  },
  {
    // Post su X del fondatore e CEO di Koin Games, Tim Jooste, del 06/10/2026 (richiesta di Pierluigi del 07/10/2026: "crea una
    // news su questo tweet del fondatore"): il Digital LGS Program, cioè tornei settimanali, promo e preordini dei set nei negozi
    // di giochi locali, eventi dal vivo da inizio 2027 e il Set 1 su Kickstarter il 27/10. Solo quello che il post dice; "il primo
    // gioco di carte digitale a distribuire i set nei negozi" resta un'affermazione sua, non verificata. Al 07/10 nessun post sul
    // programma nel feed della pagina Steam (controllato). Copertina: key art ufficiale "The Club" (giocatori al tavolo di un
    // locale), mai usata da una news né dallo slider; è la copertina della guida roadmap-and-dates.
    slug: "digital-lgs-program",
    image: "/media/art-the-club.webp",
    guides: ["origins-tcg-kickstarter", "collector-economy", "roadmap-and-dates"],
    date: "2026-10-06",
    title: n(
      "Digital LGS Program: Origins TCG wants local game stores to host weekly tournaments and sell its sets",
      "Digital LGS Program: Origins TCG porta tornei settimanali e set in preordine nei negozi di giochi",
      "Digital LGS Program: Origins TCG lleva torneos semanales y sets en preventa a las tiendas de juegos",
    ),
    metaTitle: n("Origins TCG Digital LGS Program: game stores", "Origins TCG nei negozi: il Digital LGS Program", "Origins TCG en tiendas: el Digital LGS Program"),
    description: n(
      "Koin Games' founder presents the Digital LGS Program for Origins TCG: weekly tournaments, in-store-only promos and pre-orders of sets at local game stores.",
      "Il fondatore di Koin Games presenta il Digital LGS Program di Origins TCG: tornei settimanali, promo solo in negozio e preordini dei set nei negozi di giochi.",
      "El fundador de Koin Games presenta el Digital LGS Program de Origins TCG: torneos semanales, promos solo en tienda y preventas de sets en tiendas de juegos.",
    ),
    summary: n(
      "On 6 October Tim Jooste, founder and CEO of Koin Games, presented the Digital LGS Program on X: local game stores will host weekly Origins tournaments, sell store-only packs and promos and take pre-orders of collectible sets that will not be available in game. In-person events start in early 2027; Set 1 goes live on Kickstarter on 27 October, with stores involved in the launch.",
      "Il 6 ottobre Tim Jooste, fondatore e CEO di Koin Games, ha presentato su X il Digital LGS Program: i negozi di giochi locali ospiteranno tornei settimanali di Origins, venderanno pacchetti e promo solo in negozio e raccoglieranno i preordini di set da collezione che non saranno disponibili nel gioco. Gli eventi dal vivo partono a inizio 2027; il Set 1 arriva su Kickstarter il 27 ottobre, con i negozi coinvolti nel lancio.",
      "El 6 de octubre Tim Jooste, fundador y CEO de Koin Games, presentó en X el Digital LGS Program: las tiendas de juegos locales organizarán torneos semanales de Origins, venderán sobres y promos solo en tienda y recogerán preventas de sets de colección que no estarán disponibles en el juego. Los eventos presenciales empiezan a principios de 2027; el Set 1 llega a Kickstarter el 27 de octubre, con las tiendas implicadas en el lanzamiento.",
    ),
    highlights: {
      en: [
        { label: "The Digital LGS Program", text: "Koin Games' founder presents it on X: Origins sets distributed through local game stores", anchor: "program" },
        { label: "Tournaments, promos, pre-orders", text: "weekly store tournaments, in-person-only packs and promos, pre-orders of sets not available in game", anchor: "stores" },
        { label: "Early 2027, Kickstarter on 27 October", text: "in-person events start in early 2027; Set 1 launches on Kickstarter with stores on board, over 30 already interested", anchor: "dates" },
        { label: "A version for creators", text: "streamers and content creators get a program of their own", anchor: "creators" },
        { label: "What we don't know", text: "which stores and countries, prices, how a digital set reaches the shelves", anchor: "unknowns" },
      ],
      it: [
        { label: "Il Digital LGS Program", text: "il fondatore di Koin Games lo presenta su X: i set di Origins distribuiti attraverso i negozi di giochi locali", anchor: "programma" },
        { label: "Tornei, promo, preordini", text: "tornei settimanali in negozio, pacchetti e promo solo dal vivo, preordini di set che nel gioco non ci saranno", anchor: "negozi" },
        { label: "Inizio 2027, Kickstarter il 27 ottobre", text: "gli eventi dal vivo partono a inizio 2027; il Set 1 arriva su Kickstarter con i negozi a bordo, più di 30 già interessati", anchor: "date" },
        { label: "Una versione per i creator", text: "streamer e creator di contenuti hanno un programma tutto loro", anchor: "creator" },
        { label: "Cosa non sappiamo", text: "quali negozi e quali paesi, i prezzi, come un set digitale arriva sugli scaffali", anchor: "cosa-non-sappiamo" },
      ],
      es: [
        { label: "El Digital LGS Program", text: "el fundador de Koin Games lo presenta en X: los sets de Origins, distribuidos a través de tiendas de juegos locales", anchor: "programa" },
        { label: "Torneos, promos, preventas", text: "torneos semanales en tienda, sobres y promos solo presenciales, preventas de sets que no estarán en el juego", anchor: "tiendas" },
        { label: "Principios de 2027, Kickstarter el 27 de octubre", text: "los eventos presenciales empiezan a principios de 2027; el Set 1 llega a Kickstarter con las tiendas a bordo, más de 30 ya interesadas", anchor: "fechas" },
        { label: "Una versión para creadores", text: "streamers y creadores de contenido tienen un programa propio", anchor: "creadores" },
        { label: "Lo que no sabemos", text: "qué tiendas y qué países, los precios, cómo llega un set digital a las estanterías", anchor: "lo-que-no-sabemos" },
      ],
    },
    body: n(
      `## The Digital LGS Program {#program}

On 6 October 2026 **Tim Jooste**, founder and CEO of Koin Games, published a long post on X with a short video. He describes an evening at your local game store (LGS) with nothing but your phone: a night of Origins matches against the players of your town, a store-exclusive promo to compete for and a booster of the next collector set to pre-order. The studio calls it the **Digital LGS Program** and, in his words, it makes Origins "the 1st digital card game to distribute sets through local game stores around the world".

That is the founder's claim, not something we can check. What the post does say clearly is the shape of the program: a digital card game with a physical network of stores that run its events and sell its sets.

## What stores get and what players get {#stores}

The post lists four things:

- **Local weekly tournaments**, played at the store.
- **Exclusive in-person-only packs and promos**: cards you only get by showing up.
- **Pre-orders of the upcoming collectible sets**, which will not be available in game, with rewards for supporting your store.
- And, as the post puts it, meeting real people, playing and making friends in person.

Stores interested in joining are invited to contact Jooste directly: his direct messages on X are open, and he offers a call.

## Dates: early 2027, with the Kickstarter on 27 October {#dates}

- The **in-person events officially start in early 2027**. Stores, the post says, don't have to wait until then.
- **Set 1 goes live on Kickstarter on 27 October 2026**: the same date the founder gave on 17 September and the demo shows in its menu (our [Kickstarter guide](/en/guides/origins-tcg-kickstarter) collects everything confirmed so far). Unlike most card game campaigns, Jooste writes, Koin is working with local stores on the launch itself.
- In **two months** the studio has already talked with **more than 30 stores** interested in joining.

## Creators have a version of their own {#creators}

The post adds that a version of the program exists for streamers and content creators, without details. The call to action is for players and collectors too: tag your favourite store or TCG creator under the post.

## Why it matters {#why}

Origins has always described itself as free to compete and built for collectors: ranked play costs nothing and the collection lives on [two tiers of cards](/en/guides/collector-economy), competitive and collectible. Until now the collectible side had only been announced in digital form: the Alpha Edition packs on Kickstarter, trading on the Steam Community Market; the only physical hint was the [metal cards](/en/news/metal-cards-tease) filmed in March. A store program gives it a physical place: the Tuesday-night tournament, the promo you can only win there, the set you pre-order at the counter. For a digital game it is also a way to find players where card games are already played.

Two caveats. The post is the founder's announcement, not an official page with terms and a list of stores, and nothing says yet how a digital set sold through a store works in practice. And if you want to run tournaments before 2027, you don't need to wait for the program: our [tournament organizer](/en/tournaments) is free and the community already uses it.

## What we don't know yet {#unknowns}

- Which countries and stores take part, and whether there is a list.
- How a digital set is distributed through a store: codes, physical packs with digital cards, or something else.
- What "sets not available in game" means for the collection: whether those cards will exist only through stores.
- Prices, the rewards for pre-ordering through a store and how the promos are awarded.
- How the store tournaments are played (private rooms in the game, a dedicated mode) and whether results count anywhere.
- The terms of the creator version.

## Where this comes from {#source}

The [post by Tim Jooste on X](https://x.com/TimothyJooste/status/2107532013687418943) of 6 October 2026, with a 15-second video. As of 7 October there is no post about the program on the game's Steam page; we will update this article when Koin Games publishes the official terms.`,
      `## Il Digital LGS Program {#programma}

Il 6 ottobre 2026 **Tim Jooste**, fondatore e CEO di Koin Games, ha pubblicato su X un post lungo con un breve video. Descrive una serata nel proprio negozio di giochi di zona (LGS, local game store) con in mano solo il telefono: una sera di partite a Origins contro i giocatori della propria città, una promo esclusiva del negozio da conquistare e un pacchetto del prossimo set da collezione da preordinare. Lo studio lo chiama **Digital LGS Program** e, parole sue, fa di Origins "the 1st digital card game to distribute sets through local game stores around the world", il primo gioco di carte digitale a distribuire i set attraverso i negozi di giochi locali di tutto il mondo.

È un'affermazione del fondatore, non qualcosa che possiamo verificare. Quello che il post dice con chiarezza è la forma del programma: un gioco di carte digitale con una rete fisica di negozi che ne organizzano gli eventi e ne vendono i set.

## Cosa hanno i negozi e cosa hanno i giocatori {#negozi}

Il post elenca quattro cose:

- **Tornei settimanali locali**, giocati in negozio.
- **Pacchetti e promo esclusivi solo dal vivo**: carte che si ottengono solo presentandosi.
- **Preordini dei prossimi set da collezione**, che non saranno disponibili nel gioco, con ricompense per chi sostiene il proprio negozio.
- E, come scrive il post, incontrare persone vere, giocare e farsi degli amici di persona.

I negozi interessati sono invitati a contattare Jooste direttamente: i suoi messaggi privati su X sono aperti e propone una chiamata.

## Le date: inizio 2027, con il Kickstarter il 27 ottobre {#date}

- Gli **eventi dal vivo partono ufficialmente a inizio 2027**. I negozi, dice il post, non devono aspettare fino ad allora.
- Il **Set 1 arriva su Kickstarter il 27 ottobre 2026**: la stessa data che il fondatore aveva dato il 17 settembre e che la demo mostra nel menu (la nostra [guida al Kickstarter](/it/guides/origins-tcg-kickstarter) raccoglie tutto quello che è confermato finora). A differenza di quasi tutte le campagne dei giochi di carte, scrive Jooste, Koin sta lavorando con i negozi locali al lancio stesso.
- In **due mesi** lo studio ha già parlato con **più di 30 negozi** interessati a entrare.

## I creator hanno una versione tutta loro {#creator}

Il post aggiunge che esiste una versione del programma per streamer e creator di contenuti, senza dettagli. L'invito vale anche per giocatori e collezionisti: taggare sotto il post il proprio negozio o il proprio creator di TCG preferito.

## Perché conta {#perche-conta}

Origins si è sempre descritto come gratuito per competere e pensato per i collezionisti: la classificata non costa nulla e la collezione vive su [due livelli di carte](/it/guides/collector-economy), competitive e da collezione. Finora la parte da collezione era stata annunciata solo in digitale: i pacchetti dell'Alpha Edition su Kickstarter, gli scambi sul Mercato della Comunità di Steam; l'unico accenno al fisico erano le [carte di metallo](/it/news/metal-cards-tease) filmate a marzo. Un programma per i negozi le dà un luogo fisico: il torneo del martedì sera, la promo che si vince solo lì, il set che si preordina al banco. Per un gioco digitale è anche un modo di trovare giocatori dove ai giochi di carte si gioca già.

Due avvertenze. Il post è l'annuncio del fondatore, non una pagina ufficiale con le condizioni e l'elenco dei negozi, e nulla dice ancora come funzioni in pratica un set digitale venduto in negozio. E chi vuole organizzare tornei prima del 2027 non deve aspettare il programma: il nostro [organizzatore di tornei](/it/tournaments) è gratuito e la community lo usa già.

## Cosa non sappiamo ancora {#cosa-non-sappiamo}

- Quali paesi e quali negozi partecipano, e se esiste un elenco.
- Come un set digitale viene distribuito da un negozio: codici, pacchetti fisici con carte digitali o altro.
- Che cosa vuol dire "set non disponibili nel gioco" per la collezione: se quelle carte esisteranno solo attraverso i negozi.
- Prezzi, ricompense per chi preordina in negozio e come si assegnano le promo.
- Come si giocano i tornei in negozio (stanze private nel gioco, una modalità dedicata) e se i risultati contano da qualche parte.
- Le condizioni della versione per i creator.

## Da dove viene {#fonte}

Il [post di Tim Jooste su X](https://x.com/TimothyJooste/status/2107532013687418943) del 6 ottobre 2026, con un video di 15 secondi. Al 7 ottobre sulla pagina Steam del gioco non c'è nessun post sul programma; aggiorneremo l'articolo quando Koin Games pubblicherà le condizioni ufficiali.`,
      `## El Digital LGS Program {#programa}

El 6 de octubre de 2026 **Tim Jooste**, fundador y CEO de Koin Games, publicó en X un texto largo con un video breve. Describe una noche en tu tienda de juegos de barrio (LGS, local game store) solo con el teléfono en la mano: una velada de partidas de Origins contra los jugadores de tu ciudad, una promo exclusiva de la tienda por la que competir y un sobre del próximo set de colección que reservar. El estudio lo llama **Digital LGS Program** y, en sus palabras, convierte a Origins en "the 1st digital card game to distribute sets through local game stores around the world", el primer juego de cartas digital que distribuye sets a través de tiendas de juegos locales de todo el mundo.

Es una afirmación del fundador, no algo que podamos comprobar. Lo que la publicación sí dice con claridad es la forma del programa: un juego de cartas digital con una red física de tiendas que organizan sus eventos y venden sus sets.

## Qué reciben las tiendas y qué reciben los jugadores {#tiendas}

La publicación enumera cuatro cosas:

- **Torneos semanales locales**, jugados en la tienda.
- **Sobres y promos exclusivos solo presenciales**: cartas que solo se consiguen yendo.
- **Preventas de los próximos sets de colección**, que no estarán disponibles en el juego, con recompensas por apoyar a tu tienda.
- Y, como escribe la publicación, conocer a personas reales, jugar y hacer amigos en persona.

Las tiendas interesadas pueden contactar con Jooste directamente: sus mensajes privados en X están abiertos y propone una llamada.

## Las fechas: principios de 2027, con el Kickstarter el 27 de octubre {#fechas}

- Los **eventos presenciales empiezan oficialmente a principios de 2027**. Las tiendas, dice la publicación, no tienen que esperar hasta entonces.
- El **Set 1 llega a Kickstarter el 27 de octubre de 2026**: la misma fecha que el fundador dio el 17 de septiembre y que la demo muestra en su menú (nuestra [guía del Kickstarter](/es/guides/origins-tcg-kickstarter) reúne todo lo confirmado hasta ahora). A diferencia de casi todas las campañas de juegos de cartas, escribe Jooste, Koin está trabajando con las tiendas locales en el propio lanzamiento.
- En **dos meses** el estudio ya ha hablado con **más de 30 tiendas** interesadas en participar.

## Los creadores tienen una versión propia {#creadores}

La publicación añade que existe una versión del programa para streamers y creadores de contenido, sin detalles. La llamada va también para jugadores y coleccionistas: etiquetar bajo la publicación a su tienda o a su creador de TCG favorito.

## Por qué importa {#por-que-importa}

Origins siempre se ha descrito como gratuito para competir y pensado para coleccionistas: la clasificatoria no cuesta nada y la colección vive en [dos niveles de cartas](/es/guides/collector-economy), competitivas y de colección. Hasta ahora la parte de colección se había anunciado solo en digital: los sobres de la Alpha Edition en Kickstarter, los intercambios en el Mercado de la Comunidad de Steam; la única pista física eran las [cartas de metal](/es/news/metal-cards-tease) grabadas en marzo. Un programa para tiendas le da un lugar físico: el torneo del martes por la noche, la promo que solo se gana allí, el set que se reserva en el mostrador. Para un juego digital es también una manera de encontrar jugadores donde ya se juega a cartas.

Dos advertencias. La publicación es el anuncio del fundador, no una página oficial con condiciones y lista de tiendas, y nada dice todavía cómo funciona en la práctica un set digital vendido en tienda. Y quien quiera organizar torneos antes de 2027 no tiene que esperar al programa: nuestro [organizador de torneos](/es/tournaments) es gratuito y la comunidad ya lo usa.

## Lo que no sabemos todavía {#lo-que-no-sabemos}

- Qué países y qué tiendas participan, y si existe una lista.
- Cómo se distribuye un set digital a través de una tienda: códigos, sobres físicos con cartas digitales u otra cosa.
- Qué significa "sets no disponibles en el juego" para la colección: si esas cartas existirán solo a través de las tiendas.
- Precios, recompensas por reservar en tienda y cómo se entregan las promos.
- Cómo se juegan los torneos en tienda (salas privadas en el juego, un modo dedicado) y si los resultados cuentan en algún sitio.
- Las condiciones de la versión para creadores.

## De dónde sale {#fuente}

La [publicación de Tim Jooste en X](https://x.com/TimothyJooste/status/2107532013687418943) del 6 de octubre de 2026, con un video de 15 segundos. A 7 de octubre no hay ninguna publicación sobre el programa en la página de Steam del juego; actualizaremos el artículo cuando Koin Games publique las condiciones oficiales.`,
    ),
    faq: {
      en: [
        {
          q: "What is the Origins TCG Digital LGS Program?",
          a: "A program announced on X by Koin Games' founder and CEO, Tim Jooste, on 6 October 2026: local game stores host weekly Origins tournaments, sell exclusive in-person-only packs and promos and take pre-orders of the upcoming collectible sets, which will not be available in game. The official terms have not been published yet.",
        },
        {
          q: "When do in-store Origins TCG events start?",
          a: "According to the post, the in-person events officially kick off in early 2027, but stores can join before that: Set 1 goes live on Kickstarter on 27 October 2026 and Koin Games says it is working with local stores on the launch.",
        },
        {
          q: "How can a game store join the Origins TCG program?",
          a: "By contacting Tim Jooste directly: in the post he says his direct messages on X are open and offers a call. In two months, according to the post, more than 30 stores had already been in touch. There is also a version of the program for streamers and content creators.",
        },
      ],
      it: [
        {
          q: "Che cos'è il Digital LGS Program di Origins TCG?",
          a: "Un programma annunciato su X dal fondatore e CEO di Koin Games, Tim Jooste, il 6 ottobre 2026: i negozi di giochi locali ospitano tornei settimanali di Origins, vendono pacchetti e promo esclusivi solo dal vivo e raccolgono i preordini dei prossimi set da collezione, che non saranno disponibili nel gioco. Le condizioni ufficiali non sono ancora state pubblicate.",
        },
        {
          q: "Quando iniziano gli eventi di Origins TCG nei negozi?",
          a: "Secondo il post, gli eventi dal vivo partono ufficialmente a inizio 2027, ma i negozi possono aderire prima: il Set 1 arriva su Kickstarter il 27 ottobre 2026 e Koin Games dice di lavorare con i negozi locali al lancio.",
        },
        {
          q: "Come fa un negozio di giochi a entrare nel programma di Origins TCG?",
          a: "Contattando direttamente Tim Jooste: nel post scrive che i suoi messaggi privati su X sono aperti e propone una chiamata. In due mesi, secondo il post, si erano già fatti avanti più di 30 negozi. Esiste anche una versione del programma per streamer e creator di contenuti.",
        },
      ],
      es: [
        {
          q: "¿Qué es el Digital LGS Program de Origins TCG?",
          a: "Un programa anunciado en X por el fundador y CEO de Koin Games, Tim Jooste, el 6 de octubre de 2026: las tiendas de juegos locales organizan torneos semanales de Origins, venden sobres y promos exclusivos solo presenciales y recogen preventas de los próximos sets de colección, que no estarán disponibles en el juego. Las condiciones oficiales todavía no se han publicado.",
        },
        {
          q: "¿Cuándo empiezan los eventos de Origins TCG en tiendas?",
          a: "Según la publicación, los eventos presenciales empiezan oficialmente a principios de 2027, pero las tiendas pueden sumarse antes: el Set 1 llega a Kickstarter el 27 de octubre de 2026 y Koin Games dice que está trabajando con las tiendas locales en el lanzamiento.",
        },
        {
          q: "¿Cómo puede una tienda de juegos entrar en el programa de Origins TCG?",
          a: "Contactando directamente con Tim Jooste: en la publicación dice que sus mensajes privados en X están abiertos y propone una llamada. En dos meses, según la publicación, ya se habían interesado más de 30 tiendas. También existe una versión del programa para streamers y creadores de contenido.",
        },
      ],
    },
    url: "https://x.com/TimothyJooste/status/2107532013687418943",
    source: "press",
  },
  {
    // News sul post Steam del 05/10/2026 "Prizepool announcement & key update to our biggest tournament ever" (letto con
    // l'API ISteamNews, gid 1845383656394214, 17:29 UTC). Il testo del post dice solo: montepremi diviso fra denaro,
    // collezionabili e carte promo (top 256 per i primi premi, promo dalla top 32), le due qualificazioni nuove, i sette
    // luoghi esclusi e i tornei di prova. La ripartizione dei premi (vincitore, 2°, 3°-4°, top 8…256) e il calendario a
    // cinque qualificazioni (AMER del 21 alle 21 EST con 32 che passano al posto di 64, 96 wild card al posto di 128)
    // stanno solo nelle due grafiche allegate: l'articolo dice che cosa viene dal testo e che cosa dalle grafiche.
    // Copertina: la grafica ufficiale 16:9 del calendario allegata al post (public/media/news-crimson-cup-prizepool.webp,
    // ridotta a 1600×900, niente ritagli). Linka le regole del 24/9 (aggiornate il 07/10 con questi dati), l'annuncio del
    // 9/9 e il playtest del 1/10: relatedNews.test.ts resta verde (regole e annuncio restano correlati fra loro).
    slug: "crimson-cup-prizepool-qualifiers",
    image: "/media/news-crimson-cup-prizepool.webp",
    guides: ["steam-next-fest-2026", "origins-tcg-conquest"],
    date: "2026-10-05",
    title: n(
      "Crimson Cup: the prize pool revealed, two more qualifiers and seven locations out of the tournament",
      "Crimson Cup: svelato il montepremi, due qualificazioni in più e sette luoghi fuori dal torneo",
      "Crimson Cup: la bolsa de premios revelada, dos clasificatorios más y siete ubicaciones fuera del torneo",
    ),
    metaTitle: n("Origins TCG Crimson Cup prize pool and new qualifiers", "Crimson Cup di Origins TCG: montepremi e qualificazioni", "Crimson Cup de Origins TCG: premios y clasificatorios"),
    description: n(
      "Koin Games reveals the Origins TCG Crimson Cup prize pool: 1/1 Dracula promo card and $1,500 to the winner, packs down to the top 256, two more qualifiers.",
      "I premi della Crimson Cup di Origins TCG: carta promo Dracula 1/1 e 1.500 $ al vincitore, pacchetti fino alla top 256, due qualificazioni in più.",
      "Premios de la Crimson Cup de Origins TCG: carta promo Dracula 1/1 y 1.500 dólares para el ganador, sobres hasta el top 256 y dos clasificatorios más.",
    ),
    summary: n(
      "On 5 October Koin Games published the Crimson Cup prize breakdown: the winner takes a 1/1 Dracula promo card, two booster box cases and $1,500 in cash, and everyone in the top 256 gets at least two packs. The post also adds two qualifiers, AMER on 19 October at 7pm EST and EMEA on 22 October at 7pm CEST, removes seven RNG-heavy locations from the tournament pool and announces weekly practice tournaments.",
      "Il 5 ottobre Koin Games ha pubblicato la ripartizione dei premi della Crimson Cup: chi vince prende una carta promo Dracula 1/1, due case di booster box e 1.500 $ in contanti, e tutti nella top 256 ricevono almeno due pacchetti. Il post aggiunge anche due qualificazioni, AMER il 19 ottobre alle 19 EST ed EMEA il 22 ottobre alle 19 CEST, toglie dal pool del torneo sette luoghi troppo legati al caso e annuncia tornei di prova settimanali.",
      "El 5 de octubre Koin Games publicó el reparto de premios de la Crimson Cup: quien gane se lleva una carta promo Dracula 1/1, dos cases de cajas de sobres y 1.500 dólares en efectivo, y todos los del top 256 reciben al menos dos sobres. La publicación también añade dos clasificatorios, AMER el 19 de octubre a las 19:00 EST y EMEA el 22 de octubre a las 19:00 CEST, retira del pool del torneo siete ubicaciones muy dependientes del azar y anuncia torneos de práctica semanales.",
    ),
    highlights: {
      en: [
        { label: "The prize pool", text: "1/1 Dracula promo card, two cases and $1,500 to the winner; packs down to the top 256", anchor: "prizes" },
        { label: "Two more qualifiers", text: "AMER on 19 October at 7pm EST and EMEA on 22 October at 7pm CEST, 32 advance from each", anchor: "qualifiers" },
        { label: "What changes in the schedule", text: "AMER on the 21st at 9pm EST with 32 advancing, 96 wild cards", anchor: "schedule" },
        { label: "Seven locations out", text: "Junkyard, Cloning Lab, Reflecting Pool and four more, already off in room battles", anchor: "locations" },
        { label: "Practice tournaments", text: "weekly, no stakes, the next one this week", anchor: "practice" },
      ],
      it: [
        { label: "I premi", text: "carta promo Dracula 1/1, due case e 1.500 $ al vincitore; pacchetti fino alla top 256", anchor: "premi" },
        { label: "Due qualificazioni in più", text: "AMER il 19 ottobre alle 19 EST ed EMEA il 22 ottobre alle 19 CEST, 32 passano da ciascuna", anchor: "qualificazioni" },
        { label: "Cosa cambia nel calendario", text: "AMER del 21 alle 21 EST con 32 che passano, 96 wild card", anchor: "calendario" },
        { label: "Sette luoghi fuori", text: "Junkyard, Cloning Lab, Reflecting Pool e altri quattro, già esclusi nelle partite nelle stanze", anchor: "luoghi" },
        { label: "Tornei di prova", text: "settimanali, niente in palio, il prossimo questa settimana", anchor: "tornei-di-prova" },
      ],
      es: [
        { label: "Los premios", text: "carta promo Dracula 1/1, dos cases y 1.500 dólares para el ganador; sobres hasta el top 256", anchor: "premios" },
        { label: "Dos clasificatorios más", text: "AMER el 19 de octubre a las 19:00 EST y EMEA el 22 de octubre a las 19:00 CEST, pasan 32 de cada uno", anchor: "clasificatorios" },
        { label: "Qué cambia en el calendario", text: "AMER del 21 a las 21:00 EST con 32 que pasan, 96 wild cards", anchor: "calendario" },
        { label: "Siete ubicaciones fuera", text: "Junkyard, Cloning Lab, Reflecting Pool y cuatro más, ya excluidas en las partidas en sala", anchor: "ubicaciones" },
        { label: "Torneos de práctica", text: "semanales, sin nada en juego, el próximo esta semana", anchor: "torneos-de-practica" },
      ],
    },
    body: n(
      `## The prize pool {#prizes}

The pool, in the team's words, "consists of a split between prize money, collectibles and exclusive promo cards". Everyone who reaches the top 256 is eligible for the first batch of prizes; promo cards start from the top 32. The rewards graphic attached to the post gives the breakdown:

| Place | Promo card | Product | Cash |
|---|---|---|---|
| Winner | 1/1 Dracula promo card | 2 booster box cases | $1,500 |
| 2nd | 1/8 Dracula promo card | 1 booster box case | $750 |
| 3rd and 4th | 1/8 Dracula promo card | 2 booster boxes | $350 |
| Top 8 | 1/8 Dracula promo card | 1 booster box | $125 |
| Top 16 | Finalist Plus card | 1 booster box | – |
| Top 32 | Finalist card | 10 packs | – |
| Top 64 | – | 8 packs | – |
| Top 128 | – | 4 packs | – |
| Top 256 | – | 2 packs | – |

The promo card on the graphic is a gold Dracula labelled "Tournament Winner", Myths & Legends #209, shown in a graded slab. The "Prizes worth $10,000" line of the September announcement is still on the new calendar graphic. The playoffs have 256 spots, so by Koin's own numbers whoever gets through a qualifier or enters with a wild card already takes home at least two packs.

## Two more qualifiers {#qualifiers}

"Due to popular demand", Koin adds two qualifiers during Steam Next Fest, one for the Americas and one for EMEA time zones:

1. **AMER, Monday 19 October at 7pm EST.**
2. **EMEA, Thursday 22 October at 7pm CEST**, which closes the qualifiers.

Each sends 32 players to the playoffs, like the other three. The team's request is the same as in September: sign up only for the tournaments you can actually attend, and leave the spots to other players. Sign-ups are on the [official Discord](https://discord.gg/originstcg). Check-in works as before: it opens two hours before each qualifier and closes five minutes before the start, together with deck submission ([the rules](/en/news/crimson-cup-format-check-in#check-in)).

## What changes in the schedule {#schedule}

The post only talks about the two new qualifiers, but the calendar graphic attached to it changes other numbers too. The five qualifiers, 512 spots each and 32 advancing from each:

- AMER, 19 October at 7pm EST (new);
- EMEA, 20 October at 7pm CEST;
- AMER, 21 October at 9pm EST: the September graphic said 7pm EST and 64 advancing, now struck out;
- APAC, 22 October at 7pm SGT;
- EMEA, 22 October at 7pm CEST (new).

The wild cards drop from 128 to 96: five times 32 plus 96 makes 256, the playoff field. Playoffs and finals don't move: playoffs on 24 October at 10am EST (4pm CEST, 10pm SGT), four players through to the finals on 25 October at 10am EST. The tournament now starts on 19 October, the first day of Steam Next Fest, instead of the 20th. Dates and times, as always on this site, are those of the official graphic, without conversions of ours.

## Seven locations out of the tournament {#locations}

"There are a select few locations in Origins which are very RNG heavy", the post says, so seven are disabled for the tournament: [Junkyard](/en/locations#junkyard), [Cloning Lab](/en/locations#cloning-lab), [Reflecting Pool](/en/locations#reflecting-pool), [Amplifying Amphitheatre](/en/locations#amplifying-amphitheatre), [Giant's Beacon](/en/locations#giants-beacon), [The Colosseum](/en/locations#the-colosseum) and [Nostradamus' Call](/en/locations#nostradamus-call). What each one does is on our [Locations page](/en/locations).

This tournament pool is already live in the demo when you play room battles (Create/Join Room Battle): that is where to practise with the Crimson Cup locations. The pool was introduced by the [playtest update of 1 October](/en/news/playtest-patch-notes-1001#tournament-pool), which had not yet said which locations were out.

## Practice tournaments {#practice}

Since most demo matches are against bots, Koin is hosting weekly practice tournaments: no stakes, just a place to play against real people and test your decks. The next one is this week; the day and time will be announced soon, and the sign-up is on the same [Discord](https://discord.gg/originstcg). If you want to run your own with the Crimson Cup rules, the [tournament organizer](/en/tournaments) of OriginsMeta supports check-in, hidden decklists and best-of-three matches.

## What it means for players {#what-it-means}

- **More spots and more time slots.** Five qualifiers instead of three, two in European time slots and two in American ones: pick the one you will really play.
- **Everyone in the playoffs gets something.** Two packs from the top 256, a Finalist card from the top 32, cash from the top 8.
- **Build your decks without the seven locations in mind.** The copies of Cloning Lab and Reflecting Pool won't be there at the Crimson Cup. Our [Conquest guide](/en/guides/origins-tcg-conquest) and the [deck builder](/en/deck-builder) help with the three decks.

## What we don't know yet {#unknowns}

- The day and time of this week's practice tournament.
- Whether the Top 8 line of the prize graphic means places 5 to 8, one set of prizes each: that is how we read it.
- Why the AMER qualifier of 21 October is at 9pm EST on the new graphic and at 7pm EST on the September one: the post doesn't say.
- How the unique cards between two decks are counted, still open since the [rules of 24 September](/en/news/crimson-cup-format-check-in#format).

## Where this comes from {#sources}

- The [official Steam post](https://store.steampowered.com/news/app/4429430/view/1845383656394214) of 5 October 2026, "Prizepool announcement & key update to our biggest tournament ever", with its two graphics: the rewards and the updated calendar.
- The [announcement of 9 September](/en/news/biggest-tournament-ever) and the [rules of 24 September](/en/news/crimson-cup-format-check-in), for the numbers that have changed.`,
      `## I premi {#premi}

Il montepremi, nelle parole del team, "è una ripartizione fra premi in denaro, collezionabili e carte promo esclusive". Chi arriva nella top 256 ha diritto alla prima fascia di premi; le carte promo partono dalla top 32. La grafica dei premi allegata al post dà la ripartizione:

| Piazzamento | Carta promo | Prodotto | Denaro |
|---|---|---|---|
| Vincitore | carta promo Dracula 1/1 | 2 case di booster box | 1.500 $ |
| 2° | carta promo Dracula 1/8 | 1 case di booster box | 750 $ |
| 3° e 4° | carta promo Dracula 1/8 | 2 booster box | 350 $ |
| Top 8 | carta promo Dracula 1/8 | 1 booster box | 125 $ |
| Top 16 | carta Finalist Plus | 1 booster box | – |
| Top 32 | carta Finalist | 10 pacchetti | – |
| Top 64 | – | 8 pacchetti | – |
| Top 128 | – | 4 pacchetti | – |
| Top 256 | – | 2 pacchetti | – |

La carta promo sulla grafica è un Dracula dorato con la scritta "Tournament Winner", Myths & Legends #209, mostrato in una custodia con valutazione. La scritta "Prizes worth $10,000" (premi per 10.000 $) dell'annuncio di settembre resta anche sulla nuova grafica del calendario. I playoff hanno 256 posti: con i numeri di Koin, chi passa una qualificazione o entra con una wild card porta a casa almeno due pacchetti.

## Due qualificazioni in più {#qualificazioni}

"A grande richiesta", Koin aggiunge due qualificazioni durante lo Steam Next Fest, una per il fuso delle Americhe e una per l'EMEA:

1. **AMER, lunedì 19 ottobre alle 19 EST.**
2. **EMEA, giovedì 22 ottobre alle 19 CEST**, che chiude le qualificazioni.

Da ciascuna passano 32 giocatori ai playoff, come dalle altre tre. La richiesta del team è la stessa di settembre: iscriversi solo ai tornei a cui si può davvero partecipare e lasciare i posti agli altri. Le iscrizioni sono sul [Discord ufficiale](https://discord.gg/originstcg). Il check-in funziona come prima: apre due ore prima di ogni qualificazione e chiude cinque minuti prima dell'inizio, insieme alla consegna dei mazzi ([le regole](/it/news/crimson-cup-format-check-in#check-in)).

## Cosa cambia nel calendario {#calendario}

Il post parla solo delle due qualificazioni nuove, ma la grafica del calendario allegata cambia anche altri numeri. Le cinque qualificazioni, da 512 posti ciascuna e con 32 che passano da ognuna:

- AMER, 19 ottobre alle 19 EST (nuova);
- EMEA, 20 ottobre alle 19 CEST;
- AMER, 21 ottobre alle 21 EST: la grafica di settembre diceva le 19 EST e 64 che passavano, ora barrati;
- APAC, 22 ottobre alle 19 SGT;
- EMEA, 22 ottobre alle 19 CEST (nuova).

Le wild card scendono da 128 a 96: cinque volte 32 più 96 fa 256, i posti dei playoff. Playoff e finali non si spostano: playoff il 24 ottobre alle 10 EST (16 CEST, 22 SGT), quattro giocatori alle finali del 25 ottobre alle 10 EST. Il torneo ora parte il 19 ottobre, primo giorno dello Steam Next Fest, invece del 20. Date e orari, come sempre su questo sito, sono quelli della grafica ufficiale, senza conversioni nostre.

## Sette luoghi fuori dal torneo {#luoghi}

"Ci sono alcuni luoghi di Origins che dipendono moltissimo dal caso", scrive il post, e così sette vengono disattivati per il torneo: [Junkyard](/it/locations#junkyard), [Cloning Lab](/it/locations#cloning-lab), [Reflecting Pool](/it/locations#reflecting-pool), [Amplifying Amphitheatre](/it/locations#amplifying-amphitheatre), [Giant's Beacon](/it/locations#giants-beacon), [The Colosseum](/it/locations#the-colosseum) e [Nostradamus' Call](/it/locations#nostradamus-call). Che cosa fa ognuno è nella nostra pagina dei [Luoghi](/it/locations).

Questo pool del torneo è già attivo nella demo nelle partite nelle stanze (Create/Join Room Battle): è lì che ci si allena con i luoghi della Crimson Cup. Il pool era stato introdotto dall'[aggiornamento del playtest del 1° ottobre](/it/news/playtest-patch-notes-1001#pool-tornei), che non diceva ancora quali luoghi fossero esclusi.

## Tornei di prova {#tornei-di-prova}

Visto che nella demo si gioca soprattutto contro i bot, Koin organizza tornei di prova settimanali: niente in palio, solo un posto dove giocare contro persone vere e provare i propri mazzi. Il prossimo è questa settimana; giorno e ora saranno annunciati a breve, e l'iscrizione è sullo stesso [Discord](https://discord.gg/originstcg). Chi vuole organizzarne uno con le regole della Crimson Cup trova nel [Tournament Organizer](/it/tournaments) di OriginsMeta check-in, liste segrete e partite al meglio delle tre.

## Cosa vuol dire per chi gioca {#cosa-vuol-dire}

- **Più posti e più orari.** Cinque qualificazioni invece di tre, due in orario europeo e due in orario americano: scegli quella che giocherai davvero.
- **Chi entra nei playoff porta a casa qualcosa.** Due pacchetti dalla top 256, una carta Finalist dalla top 32, denaro dalla top 8.
- **Mazzi costruiti senza i sette luoghi.** Le copie di Cloning Lab e Reflecting Pool alla Crimson Cup non ci saranno. La nostra [guida al Conquest](/it/guides/origins-tcg-conquest) e il [deck builder](/it/deck-builder) aiutano con i tre mazzi.

## Cosa non sappiamo ancora {#da-sapere}

- Giorno e ora del torneo di prova di questa settimana.
- Se la riga Top 8 della grafica dei premi vale per i piazzamenti dal 5° all'8°, un premio ciascuno: è così che la leggiamo.
- Perché la qualificazione AMER del 21 ottobre è alle 21 EST sulla grafica nuova e alle 19 EST su quella di settembre: il post non lo dice.
- Come si contano le carte uniche fra due mazzi, domanda aperta dalle [regole del 24 settembre](/it/news/crimson-cup-format-check-in#formato).

## Da dove arriva {#fonti}

- Il [post ufficiale su Steam](https://store.steampowered.com/news/app/4429430/view/1845383656394214) del 5 ottobre 2026, "Prizepool announcement & key update to our biggest tournament ever", con le sue due grafiche: i premi e il calendario aggiornato.
- L'[annuncio del 9 settembre](/it/news/biggest-tournament-ever) e le [regole del 24 settembre](/it/news/crimson-cup-format-check-in), per i numeri che sono cambiati.`,
      `## Los premios {#premios}

La bolsa de premios, en palabras del equipo, "se reparte entre dinero, coleccionables y cartas promo exclusivas". Quien llega al top 256 opta al primer grupo de premios; las cartas promo empiezan en el top 32. La imagen de los premios adjunta a la publicación da el reparto:

| Puesto | Carta promo | Producto | Dinero |
|---|---|---|---|
| Ganador | carta promo Dracula 1/1 | 2 cases de cajas de sobres | 1.500 dólares |
| 2.º | carta promo Dracula 1/8 | 1 case de cajas de sobres | 750 dólares |
| 3.º y 4.º | carta promo Dracula 1/8 | 2 cajas de sobres | 350 dólares |
| Top 8 | carta promo Dracula 1/8 | 1 caja de sobres | 125 dólares |
| Top 16 | carta Finalist Plus | 1 caja de sobres | – |
| Top 32 | carta Finalist | 10 sobres | – |
| Top 64 | – | 8 sobres | – |
| Top 128 | – | 4 sobres | – |
| Top 256 | – | 2 sobres | – |

La carta promo de la imagen es un Dracula dorado con el texto "Tournament Winner", Myths & Legends #209, dentro de una funda con calificación. La frase "Prizes worth $10,000" (premios por un valor de 10.000 dólares) del anuncio de septiembre sigue en la nueva imagen del calendario. Los playoffs tienen 256 plazas: con los números de Koin, quien pasa un clasificatorio o entra con una wild card ya se lleva al menos dos sobres.

## Dos clasificatorios más {#clasificatorios}

"Por petición popular", Koin añade dos clasificatorios durante el Steam Next Fest, uno para el horario de América y otro para el de EMEA:

1. **AMER, lunes 19 de octubre a las 19:00 EST.**
2. **EMEA, jueves 22 de octubre a las 19:00 CEST**, que cierra los clasificatorios.

De cada uno pasan 32 jugadores a los playoffs, como de los otros tres. La petición del equipo es la misma que en septiembre: inscríbete solo en los torneos que de verdad puedas jugar y deja las plazas a otros jugadores. Las inscripciones están en el [Discord oficial](https://discord.gg/originstcg). El check-in funciona como antes: abre dos horas antes de cada clasificatorio y cierra cinco minutos antes del inicio, junto con la entrega de mazos ([las reglas](/es/news/crimson-cup-format-check-in#check-in)).

## Qué cambia en el calendario {#calendario}

La publicación solo habla de los dos clasificatorios nuevos, pero la imagen del calendario adjunta cambia también otros números. Los cinco clasificatorios, de 512 plazas cada uno y con 32 que pasan de cada uno:

- AMER, 19 de octubre a las 19:00 EST (nuevo);
- EMEA, 20 de octubre a las 19:00 CEST;
- AMER, 21 de octubre a las 21:00 EST: la imagen de septiembre decía 19:00 EST y 64 que pasaban, ahora tachados;
- APAC, 22 de octubre a las 19:00 SGT;
- EMEA, 22 de octubre a las 19:00 CEST (nuevo).

Las wild cards bajan de 128 a 96: cinco por 32 más 96 son 256, las plazas de los playoffs. Playoffs y finales no se mueven: playoffs el 24 de octubre a las 10:00 EST (16:00 CEST, 22:00 SGT) y cuatro jugadores a las finales del 25 de octubre a las 10:00 EST. El torneo empieza ahora el 19 de octubre, primer día del Steam Next Fest, en lugar del 20. Las fechas y los horarios son, como siempre en este sitio, los de la imagen oficial, sin conversiones nuestras.

## Siete ubicaciones fuera del torneo {#ubicaciones}

"Hay unas pocas ubicaciones en Origins que dependen muchísimo del azar", dice la publicación, así que siete quedan desactivadas para el torneo: [Junkyard](/es/locations#junkyard), [Cloning Lab](/es/locations#cloning-lab), [Reflecting Pool](/es/locations#reflecting-pool), [Amplifying Amphitheatre](/es/locations#amplifying-amphitheatre), [Giant's Beacon](/es/locations#giants-beacon), [The Colosseum](/es/locations#the-colosseum) y [Nostradamus' Call](/es/locations#nostradamus-call). Lo que hace cada una está en nuestra página de [Ubicaciones](/es/locations).

Este pool del torneo ya está activo en la demo en las partidas en sala (Create/Join Room Battle): ahí es donde se practica con las ubicaciones de la Crimson Cup. El pool lo introdujo la [actualización del playtest del 1 de octubre](/es/news/playtest-patch-notes-1001#pool-torneos), que todavía no decía qué ubicaciones quedaban fuera.

## Torneos de práctica {#torneos-de-practica}

Como en la demo se juega sobre todo contra bots, Koin organiza torneos de práctica semanales: sin nada en juego, solo un lugar para jugar contra personas reales y probar tus mazos. El próximo es esta semana; el día y la hora se anunciarán pronto, y la inscripción está en el mismo [Discord](https://discord.gg/originstcg). Si quieres organizar uno con las reglas de la Crimson Cup, el [organizador de torneos](/es/tournaments) de OriginsMeta tiene check-in, listas ocultas y enfrentamientos al mejor de tres.

## Qué significa para los jugadores {#que-significa}

- **Más plazas y más horarios.** Cinco clasificatorios en lugar de tres, dos en horario europeo y dos en horario americano: elige el que de verdad vayas a jugar.
- **Todos los que entran en los playoffs se llevan algo.** Dos sobres desde el top 256, una carta Finalist desde el top 32 y dinero desde el top 8.
- **Mazos construidos sin las siete ubicaciones.** Las copias de Cloning Lab y Reflecting Pool no estarán en la Crimson Cup. Nuestra [guía de Conquest](/es/guides/origins-tcg-conquest) y el [deck builder](/es/deck-builder) ayudan con los tres mazos.

## Lo que aún no sabemos {#lo-que-no-sabemos}

- El día y la hora del torneo de práctica de esta semana.
- Si la línea Top 8 de la imagen de los premios vale para los puestos del 5.º al 8.º, un premio cada uno: así la leemos.
- Por qué el clasificatorio AMER del 21 de octubre está a las 21:00 EST en la imagen nueva y a las 19:00 EST en la de septiembre: la publicación no lo dice.
- Cómo se cuentan las cartas únicas entre dos mazos, pregunta abierta desde las [reglas del 24 de septiembre](/es/news/crimson-cup-format-check-in#formato).

## De dónde viene {#fuentes}

- La [publicación oficial en Steam](https://store.steampowered.com/news/app/4429430/view/1845383656394214) del 5 de octubre de 2026, "Prizepool announcement & key update to our biggest tournament ever", con sus dos imágenes: los premios y el calendario actualizado.
- El [anuncio del 9 de septiembre](/es/news/biggest-tournament-ever) y las [reglas del 24 de septiembre](/es/news/crimson-cup-format-check-in), para los números que han cambiado.`,
    ),
    faq: {
      en: [
        {
          q: "What does the Crimson Cup winner get?",
          a: "A 1/1 Dracula promo card, two booster box cases and $1,500 in cash, according to the rewards graphic Koin Games published on 5 October 2026. Second place gets a 1/8 Dracula promo card, one case and $750; third and fourth a 1/8 promo card, two booster boxes and $350.",
        },
        {
          q: "When are the Crimson Cup qualifiers now?",
          a: "Five qualifiers of 512 spots each: AMER on 19 October at 7pm EST, EMEA on 20 October at 7pm CEST, AMER on 21 October at 9pm EST, APAC on 22 October at 7pm SGT and EMEA on 22 October at 7pm CEST. 32 players advance from each, plus 96 wild cards, to the playoffs of 24 October.",
        },
        {
          q: "Which locations are out of the Crimson Cup?",
          a: "Seven: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum and Nostradamus' Call, disabled because they depend too much on luck. Room battles in the demo already use the tournament pool.",
        },
      ],
      it: [
        {
          q: "Che cosa vince chi vince la Crimson Cup?",
          a: "Una carta promo Dracula 1/1, due case di booster box e 1.500 $ in contanti, secondo la grafica dei premi pubblicata da Koin Games il 5 ottobre 2026. Il secondo prende una carta promo Dracula 1/8, un case e 750 $; terzo e quarto una promo 1/8, due booster box e 350 $.",
        },
        {
          q: "Quando sono adesso le qualificazioni della Crimson Cup?",
          a: "Cinque qualificazioni da 512 posti ciascuna: AMER il 19 ottobre alle 19 EST, EMEA il 20 ottobre alle 19 CEST, AMER il 21 ottobre alle 21 EST, APAC il 22 ottobre alle 19 SGT ed EMEA il 22 ottobre alle 19 CEST. Da ciascuna passano 32 giocatori, più 96 wild card, ai playoff del 24 ottobre.",
        },
        {
          q: "Quali luoghi sono fuori dalla Crimson Cup?",
          a: "Sette: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum e Nostradamus' Call, disattivati perché dipendono troppo dal caso. Le partite nelle stanze della demo usano già il pool del torneo.",
        },
      ],
      es: [
        {
          q: "¿Qué gana el ganador de la Crimson Cup?",
          a: "Una carta promo Dracula 1/1, dos cases de cajas de sobres y 1.500 dólares en efectivo, según la imagen de los premios que Koin Games publicó el 5 de octubre de 2026. El segundo se lleva una carta promo Dracula 1/8, un case y 750 dólares; el tercero y el cuarto, una promo 1/8, dos cajas de sobres y 350 dólares.",
        },
        {
          q: "¿Cuándo son ahora los clasificatorios de la Crimson Cup?",
          a: "Cinco clasificatorios de 512 plazas cada uno: AMER el 19 de octubre a las 19:00 EST, EMEA el 20 de octubre a las 19:00 CEST, AMER el 21 de octubre a las 21:00 EST, APAC el 22 de octubre a las 19:00 SGT y EMEA el 22 de octubre a las 19:00 CEST. De cada uno pasan 32 jugadores, más 96 wild cards, a los playoffs del 24 de octubre.",
        },
        {
          q: "¿Qué ubicaciones quedan fuera de la Crimson Cup?",
          a: "Siete: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum y Nostradamus' Call, desactivadas porque dependen demasiado del azar. Las partidas en sala de la demo ya usan el pool del torneo.",
        },
      ],
    },
    url: "https://store.steampowered.com/news/app/4429430/view/1845383656394214",
    source: "steam",
  },
  {
    // Quinta news "Upgrade Meta" (richiesta di Pierluigi del 05/10/2026: "fai una news Upgrade Meta sui mazzi torneo"): i Mazzi
    // torneo, online dal 04/10/2026 (main 05c5ebd). Solo quello che c'è davvero: tre mazzi Conquest con una guida, regole
    // della Crimson Cup controllate dal sito, voti, traduzione, Discord, avvisi, statistiche e strumenti per le dirette.
    // Copertina: key art ufficiale di Winnie the Pooh, mai usata da news, guide editoriali e slider. Niente link alla news
    // sulle regole della Crimson Cup: con la guida Conquest in comune la toglieva dalle correlate del suo annuncio (relatedNews.test).
    slug: "upgrade-meta-1005",
    image: "/media/keyart-winnie-the-pooh.webp",
    guides: ["origins-tcg-conquest", "streaming-tools"],
    date: "2026-10-05",
    title: n(
      "Upgrade Meta: tournament decks, three Conquest decks published together with one guide",
      "Upgrade Meta: i mazzi torneo, tre mazzi Conquest pubblicati insieme con una guida",
      "Upgrade Meta: los mazos de torneo, tres mazos Conquest publicados juntos con una guía",
    ),
    metaTitle: n("Upgrade Meta: Origins TCG tournament decks", "Upgrade Meta: i mazzi torneo di Origins TCG", "Upgrade Meta: mazos de torneo de Origins TCG"),
    description: n(
      "New on OriginsMeta: tournament decks, three Origins TCG Conquest decks published together with one guide, Crimson Cup rules checked for you.",
      "Novità su OriginsMeta: i mazzi torneo, tre mazzi Conquest di Origins TCG pubblicati insieme con una guida, con le regole della Crimson Cup già controllate.",
      "Novedades en OriginsMeta: los mazos de torneo, tres mazos Conquest de Origins TCG publicados juntos con una guía y las reglas de la Crimson Cup ya revisadas.",
    ),
    summary: n(
      "The Decks section now has two parts: single decks and tournament decks. A tournament deck is a set of three Conquest decks published together with one guide that explains how they work as a team, and the site checks the Crimson Cup rules for you before you publish.",
      "La sezione Mazzi ora ha due parti: mazzi singoli e mazzi torneo. Un mazzo torneo è un trio di mazzi Conquest pubblicato insieme con una guida che spiega come lavorano in squadra, e il sito controlla per te le regole della Crimson Cup prima di pubblicarlo.",
      "La sección Mazos ahora tiene dos partes: mazos individuales y mazos de torneo. Un mazo de torneo es un trío de mazos Conquest publicado junto con una guía que explica cómo trabajan en equipo, y el sitio revisa por ti las reglas de la Crimson Cup antes de publicarlo.",
    ),
    highlights: {
      en: [
        { label: "Tournament decks", text: "three Conquest decks and one guide in a single page, under Decks", anchor: "tournament-decks" },
        { label: "How to publish", text: "Tournament mode in the deck builder, then “Publish the 3 decks”", anchor: "publish" },
        { label: "Conquest rules", text: "three different Legendaries and at least 8 different cards between any two decks", anchor: "rules" },
        { label: "The page of a set", text: "the role of each deck, the three game codes, votes and translated guide", anchor: "set-page" },
        { label: "For streamers", text: "short link, !deck chat command, OBS overlay and image for your set", anchor: "streamers" },
      ],
      it: [
        { label: "Mazzi torneo", text: "tre mazzi Conquest e una guida in una sola pagina, sotto Mazzi", anchor: "mazzi-torneo" },
        { label: "Come si pubblica", text: "modalità Torneo nel deck builder, poi “Pubblica i 3 mazzi”", anchor: "pubblicare" },
        { label: "Regole Conquest", text: "tre Leggendarie diverse e almeno 8 carte diverse fra ogni coppia di mazzi", anchor: "regole" },
        { label: "La pagina di un trio", text: "il ruolo di ogni mazzo, i tre codici del gioco, voti e guida tradotta", anchor: "pagina-trio" },
        { label: "Per chi fa dirette", text: "link breve, comando !deck in chat, overlay per OBS e immagine del trio", anchor: "dirette" },
      ],
      es: [
        { label: "Mazos de torneo", text: "tres mazos Conquest y una guía en una sola página, dentro de Mazos", anchor: "mazos-torneo" },
        { label: "Cómo se publica", text: "modo Torneo en el deck builder y luego “Publicar los 3 mazos”", anchor: "publicar" },
        { label: "Reglas Conquest", text: "tres Legendarias distintas y al menos 8 cartas distintas entre cada par de mazos", anchor: "reglas" },
        { label: "La página de un trío", text: "el papel de cada mazo, los tres códigos del juego, votos y guía traducida", anchor: "pagina-trio" },
        { label: "Para quien hace directos", text: "enlace corto, comando !deck en el chat, overlay para OBS e imagen del trío", anchor: "directos" },
      ],
    },
    body: n(
      `## Tournament decks {#tournament-decks}

In a Conquest tournament like the Crimson Cup you don't bring one deck, you bring three. Until now OriginsMeta only had single decks, so a set of three had to be published as three separate pages, each with its own guide. Now the [Decks](/en/decks) menu has two parts: **Single decks** and **[Tournament decks](/en/decks/tournament)**.

A tournament deck is three decks published together, with **one guide** for the whole set: the game plan for the three decks and the role of each one (when you pick it, which matchups it covers), plus strengths, weaknesses, matchups and notes if you want to add them.

## How to publish a tournament deck {#publish}

1. Open the [deck builder](/en/deck-builder) and switch to **Tournament (3 decks)**. The "Publish a tournament deck" button on the [Tournament decks](/en/decks/tournament) page opens it already in that mode.
2. Build decks A, B and C. The table under the decks shows how many different cards each pair has.
3. When the three decks are complete and follow the rules, press **Publish the 3 decks**.
4. Give the set a name, write the game plan and the role of each deck, and publish.

You need to be [signed in](/en/login). Your tournament decks are in [your account](/en/account), where you can edit, hide or delete them, and on your public profile. Each account can publish as many tournament decks as single decks (5 for community accounts, 20 for Authors, no limit for Creators, Pro players and Staff), counted separately.

## The Conquest rules, checked for you {#rules}

Every set follows the rules of the Crimson Cup, the same ones the deck builder already uses:

- **three different Legendaries**, one per deck;
- **at least 8 different unique cards between any two decks**: each card counts once, Legendary included, so two decks can share at most 5 cards.

If a set doesn't follow them, the button stays off and the deck builder tells you what's wrong; the site checks again when you publish. Our [Conquest guide](/en/guides/origins-tcg-conquest) explains how to build three decks that hold together.

## The page of a set {#set-page}

- The game plan at the top, then **the three decks**: for each one its role in the set, the full cards, the **game code** to paste into Origins TCG and "Open in the deck builder".
- A box with the Conquest rules and the different cards between each pair of decks.
- **Votes** from 1 to 5 stars, as for single decks (never on your own set).
- The guide is written in one language and **translated automatically** into the other two.
- When you publish, the set is posted live on our [Discord](https://discord.gg/RAG7nnrNGP), in #community-decks, and whoever follows you gets a notification if you are a Creator, Author, Pro player or Staff.
- In your account you see the visits, the copied codes and the clicks of your sets: they are estimates, like the ones for single decks.

## For streamers {#streamers}

Every tournament deck has the same tools as single decks, in the "For streamers" menu of its page:

- a **short link**, originsmeta.com/d/ followed by the code of the set, to say on stream;
- the **!deck chat command** for Nightbot, StreamElements and Fossabot, which writes the set and its three Legendaries in chat;
- an **overlay for OBS** with the three decks, vertical or horizontal;
- an **image** of the set to download in 16:9 or 9:16.

Command and overlay are shown only to whoever published the set. The [streaming guide](/en/guides/streaming-tools) explains step by step how to add them.

## Join in {#join}

Build your three decks in the [deck builder](/en/deck-builder), publish them and send the link to your team before the tournament. Be among the first to publish in [Tournament decks](/en/decks/tournament).`,
      `## Mazzi torneo {#mazzi-torneo}

In un torneo Conquest come la Crimson Cup non porti un mazzo, ne porti tre. Finora OriginsMeta aveva solo i mazzi singoli, quindi un trio andava pubblicato come tre pagine separate, ognuna con la sua guida. Adesso il menu [Mazzi](/it/decks) ha due parti: **Mazzi singoli** e **[Mazzi torneo](/it/decks/tournament)**.

Un mazzo torneo sono tre mazzi pubblicati insieme, con **una guida sola** per tutto il trio: il piano di gioco dei tre mazzi e il ruolo di ognuno (quando lo scegli, quali scontri copre), più punti di forza, punti deboli, scontri e note se vuoi aggiungerli.

## Come si pubblica un mazzo torneo {#pubblicare}

1. Apri il [deck builder](/it/deck-builder) e passa a **Torneo (3 mazzi)**. Il tasto "Pubblica un mazzo torneo" della pagina [Mazzi torneo](/it/decks/tournament) lo apre già in questa modalità.
2. Costruisci i mazzi A, B e C. La tabella sotto i mazzi dice quante carte diverse ha ogni coppia.
3. Quando i tre mazzi sono completi e rispettano le regole, premi **Pubblica i 3 mazzi**.
4. Dai un nome al trio, scrivi il piano di gioco e il ruolo di ogni mazzo, e pubblica.

Serve l'[accesso](/it/login). I tuoi mazzi torneo li trovi nel [tuo account](/it/account), dove puoi modificarli, nasconderli o eliminarli, e nel tuo profilo pubblico. Ogni account può pubblicare tanti mazzi torneo quanti mazzi singoli (5 per gli account della community, 20 per gli Autori, senza limite per Creator, Pro e Staff), contati a parte.

## Le regole Conquest, controllate per te {#regole}

Ogni trio rispetta le regole della Crimson Cup, le stesse che usa già il deck builder:

- **tre Leggendarie diverse**, una per mazzo;
- **almeno 8 carte uniche diverse fra ogni coppia di mazzi**: ogni carta conta una volta, Leggendaria compresa, quindi due mazzi possono avere al massimo 5 carte in comune.

Se un trio non le rispetta il tasto resta spento e il deck builder ti dice che cosa non va; il sito ricontrolla quando pubblichi. La nostra [guida al Conquest](/it/guides/origins-tcg-conquest) spiega come costruire tre mazzi che stanno in piedi insieme.

## La pagina di un trio {#pagina-trio}

- In cima il piano di gioco, poi **i tre mazzi**: per ognuno il ruolo nel trio, le carte intere, il **codice del gioco** da incollare in Origins TCG e "Apri nel deck builder".
- Un riquadro con le regole Conquest e le carte diverse fra ogni coppia di mazzi.
- **Voti** da 1 a 5 stelle, come per i mazzi singoli (mai sul proprio trio).
- La guida si scrive in una lingua e si **traduce da sola** nelle altre due.
- Quando pubblichi, il trio arriva in diretta sul nostro [Discord](https://discord.gg/RAG7nnrNGP), in #community-decks, e chi ti segue riceve un avviso se sei Creator, Autore, Pro o Staff.
- Nel tuo account vedi le visite, i codici copiati e i clic dei tuoi trii: sono stime, come quelle dei mazzi singoli.

## Per chi fa dirette {#dirette}

Ogni mazzo torneo ha gli stessi strumenti dei mazzi singoli, nel menu "Per le dirette" della sua pagina:

- un **link breve**, originsmeta.com/d/ seguito dal codice del trio, da dire in diretta;
- il **comando !deck** per Nightbot, StreamElements e Fossabot, che scrive in chat il trio e le sue tre Leggendarie;
- un **overlay per OBS** con i tre mazzi, verticale o orizzontale;
- un'**immagine** del trio da scaricare in 16:9 o 9:16.

Comando e overlay li vede solo chi ha pubblicato il trio. La [guida alle dirette](/it/guides/streaming-tools) spiega passo per passo come aggiungerli.

## Partecipa {#partecipa}

Costruisci i tuoi tre mazzi nel [deck builder](/it/deck-builder), pubblicali e manda il link alla tua squadra prima del torneo. Sii fra i primi a pubblicare nei [Mazzi torneo](/it/decks/tournament).`,
      `## Mazos de torneo {#mazos-torneo}

En un torneo Conquest como la Crimson Cup no llevas un mazo, llevas tres. Hasta ahora OriginsMeta solo tenía mazos individuales, así que un trío había que publicarlo como tres páginas separadas, cada una con su guía. Ahora el menú [Mazos](/es/decks) tiene dos partes: **Mazos individuales** y **[Mazos de torneo](/es/decks/tournament)**.

Un mazo de torneo son tres mazos publicados juntos, con **una sola guía** para todo el trío: el plan de juego de los tres mazos y el papel de cada uno (cuándo lo eliges, qué enfrentamientos cubre), más puntos fuertes, puntos débiles, enfrentamientos y notas si quieres añadirlos.

## Cómo se publica un mazo de torneo {#publicar}

1. Abre el [deck builder](/es/deck-builder) y cambia a **Torneo (3 mazos)**. El botón "Publica un mazo de torneo" de la página [Mazos de torneo](/es/decks/tournament) lo abre ya en ese modo.
2. Construye los mazos A, B y C. La tabla debajo de los mazos dice cuántas cartas distintas tiene cada par.
3. Cuando los tres mazos estén completos y cumplan las reglas, pulsa **Publicar los 3 mazos**.
4. Ponle un nombre al trío, escribe el plan de juego y el papel de cada mazo, y publica.

Tienes que [iniciar sesión](/es/login). Tus mazos de torneo están en [tu cuenta](/es/account), donde puedes editarlos, ocultarlos o eliminarlos, y en tu perfil público. Cada cuenta puede publicar tantos mazos de torneo como mazos individuales (5 para las cuentas de la comunidad, 20 para los Autores, sin límite para Creators, Pro y Staff), contados aparte.

## Las reglas Conquest, comprobadas por el sitio {#reglas}

Cada trío cumple las reglas de la Crimson Cup, las mismas que ya usa el deck builder:

- **tres Legendarias distintas**, una por mazo;
- **al menos 8 cartas únicas distintas entre cada par de mazos**: cada carta cuenta una vez, Legendaria incluida, así que dos mazos pueden compartir como mucho 5 cartas.

Si un trío no las cumple, el botón se queda apagado y el deck builder te dice qué falla; el sitio lo vuelve a revisar al publicar. Nuestra [guía de Conquest](/es/guides/origins-tcg-conquest) explica cómo construir tres mazos que funcionen juntos.

## La página de un trío {#pagina-trio}

- Arriba el plan de juego y después **los tres mazos**: para cada uno su papel en el trío, las cartas completas, el **código del juego** para pegar en Origins TCG y "Abrir en el deck builder".
- Un recuadro con las reglas Conquest y las cartas distintas entre cada par de mazos.
- **Votos** de 1 a 5 estrellas, como en los mazos individuales (nunca en tu propio trío).
- La guía se escribe en un idioma y se **traduce sola** a los otros dos.
- Cuando publicas, el trío llega en directo a nuestro [Discord](https://discord.gg/RAG7nnrNGP), en #community-decks, y quien te sigue recibe un aviso si eres Creator, Autor, Pro o Staff.
- En tu cuenta ves las visitas, los códigos copiados y los clics de tus tríos: son estimaciones, como las de los mazos individuales.

## Para quien hace directos {#directos}

Cada mazo de torneo tiene las mismas herramientas que los mazos individuales, en el menú "Para directos" de su página:

- un **enlace corto**, originsmeta.com/d/ seguido del código del trío, para decirlo en directo;
- el **comando !deck** para Nightbot, StreamElements y Fossabot, que escribe en el chat el trío y sus tres Legendarias;
- un **overlay para OBS** con los tres mazos, vertical u horizontal;
- una **imagen** del trío para descargar en 16:9 o 9:16.

El comando y el overlay solo los ve quien publicó el trío. La [guía de los directos](/es/guides/streaming-tools) explica paso a paso cómo añadirlos.

## Participa {#participa}

Construye tus tres mazos en el [deck builder](/es/deck-builder), publícalos y manda el enlace a tu equipo antes del torneo. Sé de los primeros en publicar en [Mazos de torneo](/es/decks/tournament).`,
    ),
    faq: {
      en: [
        {
          q: "How do I publish three Conquest decks together on OriginsMeta?",
          a: "In the deck builder switch to Tournament mode, build decks A, B and C with three different Legendaries and at least 8 different cards between any two decks, then press \"Publish the 3 decks\" and write one guide for the set.",
        },
        {
          q: "Do tournament decks follow the Crimson Cup rules?",
          a: "Yes. Every set has three different Legendaries and at least 8 different unique cards between any two decks, Legendary included. The deck builder and the site check it before the set goes online.",
        },
      ],
      it: [
        {
          q: "Come pubblico tre mazzi Conquest insieme su OriginsMeta?",
          a: "Nel deck builder passa alla modalità Torneo, costruisci i mazzi A, B e C con tre Leggendarie diverse e almeno 8 carte diverse fra ogni coppia, poi premi \"Pubblica i 3 mazzi\" e scrivi una guida per il trio.",
        },
        {
          q: "I mazzi torneo rispettano le regole della Crimson Cup?",
          a: "Sì. Ogni trio ha tre Leggendarie diverse e almeno 8 carte uniche diverse fra ogni coppia di mazzi, Leggendaria compresa. Il deck builder e il sito lo controllano prima che il trio vada online.",
        },
      ],
      es: [
        {
          q: "¿Cómo publico tres mazos Conquest juntos en OriginsMeta?",
          a: "En el deck builder cambia al modo Torneo, construye los mazos A, B y C con tres Legendarias distintas y al menos 8 cartas distintas entre cada par, pulsa \"Publicar los 3 mazos\" y escribe una guía para el trío.",
        },
        {
          q: "¿Los mazos de torneo cumplen las reglas de la Crimson Cup?",
          a: "Sí. Cada trío tiene tres Legendarias distintas y al menos 8 cartas únicas distintas entre cada par de mazos, Legendaria incluida. El deck builder y el sitio lo revisan antes de que el trío se publique.",
        },
      ],
    },
    url: "/decks/tournament",
    source: "site",
  },
  {
    // Quarta news "Upgrade Meta" (richiesta di Pierluigi del 03/10/2026: "fai un articolo con gli update degli ultimi giorni
    // sul sito"): solo quello che è su main dopo la news del 29/09 (draft contro il Cervello e contro un amico, versioni dei
    // mazzi, Salva e Di tendenza, filtri di /cards, prima e dopo di MetaShifting, /analytics, codice dell'email, pagina
    // per il profilo pubblico, guida alle dirette, fumetti in più lingue). Fuori i commenti ai mazzi (ancora su un branch)
    // e i numeri degli interessati ad Analytics (non si mostrano). Copertina: key art ufficiale della Queen of Hearts
    // cyber, mai usata da altre news.
    slug: "upgrade-meta-1003",
    image: "/media/keyart-queen-of-hearts-cyber.webp",
    guides: ["streaming-tools", "origins-tcg-conquest"],
    date: "2026-10-03",
    title: n(
      "Upgrade Meta: draft against the Brain, deck versions, saved decks and new card filters",
      "Upgrade Meta: draft contro il Cervello, versioni dei mazzi, mazzi salvati e nuovi filtri delle carte",
      "Upgrade Meta: draft contra el Cerebro, versiones de los mazos, mazos guardados y nuevos filtros de cartas",
    ),
    metaTitle: n("Upgrade Meta: Origins TCG draft and deck versions", "Upgrade Meta: draft e versioni dei mazzi", "Upgrade Meta: draft y versiones de los mazos"),
    description: n(
      "New on OriginsMeta: an Origins TCG draft against our bot or a friend, deck updates for patch 0.7, saved and trending decks, new card filters.",
      "Novità su OriginsMeta: il draft di Origins TCG contro il nostro bot o un amico, mazzi aggiornabili alla 0.7, mazzi salvati e di tendenza, nuovi filtri.",
      "Novedades en OriginsMeta: draft de Origins TCG contra nuestro bot o un amigo, mazos actualizables a la 0.7, mazos guardados y en tendencia, nuevos filtros.",
    ),
    summary: n(
      "In the last few days OriginsMeta got a free Origins TCG draft, against our bot or against a friend, and you can now update your published decks to patch 0.7 without losing name, guide and votes. You can also save the decks you like, find the trending ones, filter cards by cost, keyword, power and health, and see the cards changed by each patch before and after.",
      "Negli ultimi giorni OriginsMeta si è preso un draft di Origins TCG gratuito, contro il nostro bot o contro un amico, e ora puoi aggiornare i tuoi mazzi pubblicati alla patch 0.7 senza perdere nome, guida e voti. Puoi anche salvare i mazzi che ti piacciono, trovare quelli di tendenza, filtrare le carte per costo, parola chiave, potenza e salute e vedere prima e dopo le carte cambiate da ogni patch.",
      "En los últimos días OriginsMeta estrena un draft de Origins TCG gratuito, contra nuestro bot o contra un amigo, y ahora puedes actualizar tus mazos publicados al parche 0.7 sin perder nombre, guía y votos. También puedes guardar los mazos que te gustan, ver los que son tendencia, filtrar las cartas por coste, palabra clave, poder y salud y ver el antes y el después de las cartas que cambia cada parche.",
    ),
    highlights: {
      en: [
        { label: "Draft", text: "three formats against the Brain, our bot, or against a friend in an online room", anchor: "draft" },
        { label: "Deck versions", text: "update a published deck to patch 0.7 and keep its name, guide and link", anchor: "deck-versions" },
        { label: "Saved and trending decks", text: "the Save button, the Trending and Most saved orders and the game version filter", anchor: "saved-decks" },
        { label: "Cards and MetaShifting", text: "filters by cost, keyword, power and health, and every patch before and after", anchor: "cards" },
        { label: "OriginsMeta Analytics", text: "our match tracker, paused since patch 0.7: tell us if you want it", anchor: "analytics" },
        { label: "Sign-in and profile", text: "the code from the email next to the link and a page of its own for your public profile", anchor: "account" },
        { label: "Guides and comics", text: "the guide to stream tools and comics drawn in more than one language", anchor: "guides-comics" },
      ],
      it: [
        { label: "Draft", text: "tre formati contro il Cervello, il nostro bot, o contro un amico in una stanza online", anchor: "draft" },
        { label: "Versioni dei mazzi", text: "aggiorna un mazzo pubblicato alla patch 0.7 tenendo nome, guida e link", anchor: "versioni-mazzi" },
        { label: "Mazzi salvati e di tendenza", text: "il tasto Salva, gli ordini Di tendenza e Più salvati e il filtro per versione del gioco", anchor: "mazzi-salvati" },
        { label: "Carte e MetaShifting", text: "filtri per costo, parola chiave, potenza e salute, e il prima e dopo di ogni patch", anchor: "carte" },
        { label: "OriginsMeta Analytics", text: "il nostro tracker delle partite, in pausa dalla patch 0.7: dicci se ti interessa", anchor: "analytics" },
        { label: "Accesso e profilo", text: "il codice dell'email accanto al link e una pagina tutta sua per il profilo pubblico", anchor: "account" },
        { label: "Guide e fumetti", text: "la guida agli strumenti per le dirette e i fumetti disegnati in più lingue", anchor: "guide-fumetti" },
      ],
      es: [
        { label: "Draft", text: "tres formatos contra el Cerebro, nuestro bot, o contra un amigo en una sala online", anchor: "draft" },
        { label: "Versiones de los mazos", text: "actualiza un mazo publicado al parche 0.7 sin perder nombre, guía y enlace", anchor: "versiones-mazos" },
        { label: "Mazos guardados y en tendencia", text: "el botón Guardar, los órdenes Tendencia y Más guardados y el filtro por versión del juego", anchor: "mazos-guardados" },
        { label: "Cartas y MetaShifting", text: "filtros por coste, palabra clave, poder y salud, y el antes y el después de cada parche", anchor: "cartas" },
        { label: "OriginsMeta Analytics", text: "nuestro tracker de partidas, en pausa desde el parche 0.7: dinos si te interesa", anchor: "analytics" },
        { label: "Acceso y perfil", text: "el código del correo junto al enlace y una página propia para tu perfil público", anchor: "cuenta" },
        { label: "Guías y cómics", text: "la guía de las herramientas para directos y los cómics dibujados en varios idiomas", anchor: "guias-comics" },
      ],
    },
    body: n(
      `## Draft against the Brain or a friend {#draft}

The [Draft](/en/draft) is a free way to build an Origins TCG deck from cards you pick one at a time. You choose your Legendary and your cards, then build a deck with the game's rules (1 Legendary and 12 cards, each counting twice: 25 cards). There are three formats:

- **Exchange**: you see 3 cards, keep one, give one to your opponent and the third is burned.
- **Triple**: 3 shared cards, one player picks, then the other, and the third is burned. You see everything your opponent takes.
- **Packs**: packs of 6 cards that you pass back and forth, like a paper TCG. You don't see your opponent's picks.

**Against the Brain** you play right away, with no account: the Brain is our bot and it only knows what a player in its seat would know. **Against a friend** you create a room and send the link or the code: the draft starts as soon as your friend joins, with a timer on every pick (when time runs out, the Brain picks for whoever hasn't chosen). You both need to be signed in.

At the end the Brain gives its verdict on both decks, from Outstanding to Weak, based on curve, removal and synergies: it's the bot's opinion, the real match is played in the game. You can copy the game code, open the deck in the [deck builder](/en/deck-builder) or challenge a friend on the same draft, with the same cards in the same order.

## Deck versions {#deck-versions}

After [patch 0.7](/en/news/patch-0-7) many published decks had cards that now cost more. You can now **update the cards of a published deck** and keep its name, guide, videos and link: on your deck's page, or in [your account](/en/account), press "Update to version 0.7", change the cards in the deck builder and save. Before saving you see what goes in and what comes out.

The previous versions stay on the deck's page, under "Versions of this deck", with their changes and their rating. Votes are never deleted: the rating shown is the one of the current version, while older votes stay with the version they were given to.

## Saved and trending decks {#saved-decks}

- **Save**: on every deck's page there's a button to save it. You'll find your saved decks in [your account](/en/account), under "Saved decks". Only you can see the list.
- **New orders** in [Decks](/en/decks): **Trending**, the decks that got the most attention this week (views, copied codes, votes and saves), and **Most saved**.
- **Game version**: the filter panel of Decks now has the game version, with the number of decks for each one. Every deck shows the patch it was built for.

## Cards and MetaShifting {#cards}

- In [Cards](/en/cards) there's a row of cost filters (0 to 6, and 7+) always in view, and under "More filters" the keyword and the power and health ranges, plus a button to clear them all.
- In [MetaShifting](/en/metashifting), every patch now opens with "Before and after": each card whose cost, power or health changed, side by side, with the changed values highlighted.

## OriginsMeta Analytics {#analytics}

[OriginsMeta Analytics](/en/analytics) is our Windows app that records your Origins TCG matches on its own while you play: the deck, the result, the Legendaries you faced, with an overlay above the game and for OBS. It's ready and it works, but since patch 0.7 the game no longer saves on your PC the match data the app read, so for now it's paused, and the win rate pages are switched off.

We want to show it to the Koin Games team and ask whether that data can be made available again. If you're interested, press **"Yes, I want it"** on the page: the more players ask, the more the request counts.

## Sign-in and profile {#account}

- **Code from the email**: the sign-in email now has a code next to the link. If the link opens in another browser (your phone, the Gmail app) or doesn't work, type the code in the sign-in panel, under "Already have the code from the email?".
- **Your public page**: in your account, under your public page, the "Edit my public page" button takes you to a page of its own with your bio, channels, photo and, for Creators, Authors, Pro players and Staff, the showcase.
- **Menu**: on a computer, Tier list and Deck builder open a submenu, with the tier list pages, Analytics and the Draft.

## Guides and comics {#guides-comics}

- A new guide: [streaming Origins TCG](/en/guides/streaming-tools), with the OBS overlay, the !deck chat command, the short links and the LIVE badge, step by step.
- Comics can now have versions drawn in each language: readers see the version drawn in their language instead of the automatic translation.
- The guides to the decks published before patch 0.7 keep their strategy as it was written, with a note at the top: the card tables show the new costs.

## Join in {#join}

[Sign up](/en/login) for free with Discord or your email, try the [Draft](/en/draft) and update your decks to patch 0.7. And [join our Discord](https://discord.gg/RAG7nnrNGP): everything that goes live on the site gets posted there.`,
      `## Draft contro il Cervello o contro un amico {#draft}

Il [Draft](/it/draft) è un modo gratuito per costruire un mazzo di Origins TCG con carte scelte una alla volta. Scegli la Leggendaria e le carte, poi costruisci il mazzo con le regole del gioco (1 Leggendaria e 12 carte, ognuna conta due volte: 25 carte). I formati sono tre:

- **Scambio**: vedi 3 carte, ne tieni una, una la regali all'avversario e la terza si brucia.
- **Tris**: 3 carte in comune, sceglie uno, poi l'altro, e la terza si brucia. Vedi tutto quello che prende l'avversario.
- **Buste**: buste da 6 carte che vi passate avanti e indietro, come in un TCG di carta. Le scelte dell'avversario non le vedi.

**Contro il Cervello** giochi subito, senza account: il Cervello è il nostro bot e sa solo quello che saprebbe un giocatore al suo posto. **Contro un amico** crei una stanza e mandi il link o il codice: il draft parte appena il tuo amico entra, con un tempo per ogni scelta (allo scadere sceglie il Cervello per chi non l'ha fatto). Serve l'accesso a tutti e due.

Alla fine il Cervello dà il suo giudizio sui due mazzi, da Eccezionale a Debole, in base a curva, rimozioni e sinergie: è l'opinione del bot, la partita vera si gioca nel gioco. Puoi copiare il codice del gioco, aprire il mazzo nel [deck builder](/it/deck-builder) o sfidare un amico sullo stesso draft, con le stesse carte nello stesso ordine.

## Versioni dei mazzi {#versioni-mazzi}

Dopo la [patch 0.7](/it/news/patch-0-7) molti mazzi pubblicati avevano carte che ora costano di più. Adesso puoi **aggiornare le carte di un mazzo pubblicato** tenendo nome, guida, video e link: nella pagina del tuo mazzo, o nel [tuo account](/it/account), premi "Aggiorna alla versione 0.7", cambia le carte nel deck builder e salva. Prima di salvare vedi che cosa entra e che cosa esce.

Le versioni precedenti restano nella pagina del mazzo, in "Versioni del mazzo", con i cambi e il loro voto. I voti non si cancellano mai: il voto mostrato è quello della versione in vigore, quelli vecchi restano alla versione a cui sono stati dati.

## Mazzi salvati e di tendenza {#mazzi-salvati}

- **Salva**: nella pagina di ogni mazzo c'è il tasto per salvarlo. I mazzi salvati li trovi nel [tuo account](/it/account), in "Mazzi salvati". L'elenco lo vedi solo tu.
- **Nuovi ordini** in [Mazzi](/it/decks): **Di tendenza**, i mazzi che hanno avuto più attenzione questa settimana (visite, codici copiati, voti e salvataggi), e **Più salvati**.
- **Versione del gioco**: nel pannello dei filtri di Mazzi c'è la versione del gioco, con il numero di mazzi di ognuna. Ogni mazzo mostra la patch per cui è stato costruito.

## Carte e MetaShifting {#carte}

- In [Carte](/it/cards) c'è una fila di filtri per costo (da 0 a 6, e 7+) sempre in vista, e in "Altri filtri" la parola chiave e gli intervalli di potenza e salute, più un tasto per azzerarli tutti.
- In [MetaShifting](/it/metashifting) ogni patch ora si apre con "Prima e dopo": ogni carta con costo, potenza o salute cambiati, affiancata, con i valori cambiati evidenziati.

## OriginsMeta Analytics {#analytics}

[OriginsMeta Analytics](/it/analytics) è la nostra app per Windows che registra da sola le tue partite di Origins TCG mentre giochi: il mazzo, l'esito, le Leggendarie che hai incontrato, con un overlay sopra il gioco e per OBS. È pronta e funziona, ma dalla patch 0.7 il gioco non salva più sul PC i dati delle partite che l'app leggeva, quindi per ora è in pausa e le pagine dei win rate sono spente.

Vogliamo mostrarla al team di Koin Games e chiedere se quei dati possono tornare disponibili. Se ti interessa, premi **"Sì, mi interessa"** sulla pagina: più giocatori lo chiedono, più la richiesta conta.

## Accesso e profilo {#account}

- **Codice dell'email**: l'email di accesso ora ha un codice accanto al link. Se il link si apre in un altro browser (il telefono, l'app di Gmail) o non funziona, scrivi il codice nel pannello di accesso, in "Hai già il codice dell'email?".
- **La tua pagina pubblica**: nel tuo account, sotto la tua pagina pubblica, il tasto "Modifica la mia pagina pubblica" porta a una pagina tutta sua con bio, canali, foto e, per Creator, Autori, Pro e Staff, la vetrina.
- **Menu**: dal computer, Tier list e Deck builder aprono un sottomenu, con le pagine della tier list, Analytics e il Draft.

## Guide e fumetti {#guide-fumetti}

- Una guida nuova: [le dirette su Origins TCG](/it/guides/streaming-tools), con l'overlay per OBS, il comando !deck in chat, i link brevi e il bollino LIVE, passo per passo.
- I fumetti ora possono avere una versione disegnata per ogni lingua: chi legge vede la versione disegnata nella sua lingua al posto della traduzione automatica.
- Le guide ai mazzi pubblicati prima della patch 0.7 tengono la strategia com'era stata scritta, con una nota in cima: le tabelle delle carte mostrano i costi nuovi.

## Partecipa {#partecipa}

[Iscriviti](/it/login) gratis con Discord o con la tua email, prova il [Draft](/it/draft) e aggiorna i tuoi mazzi alla patch 0.7. E [entra nel nostro Discord](https://discord.gg/RAG7nnrNGP): tutto quello che esce sul sito arriva anche lì.`,
      `## Draft contra el Cerebro o contra un amigo {#draft}

El [Draft](/es/draft) es una forma gratuita de construir un mazo de Origins TCG con cartas que eliges una a una. Eliges tu Legendaria y tus cartas, y luego construyes el mazo con las reglas del juego (1 Legendaria y 12 cartas, cada una cuenta dos veces: 25 cartas). Hay tres formatos:

- **Intercambio**: ves 3 cartas, te quedas una, le regalas otra a tu rival y la tercera se quema.
- **Trío**: 3 cartas en común, elige uno, luego el otro, y la tercera se quema. Ves todo lo que se lleva tu rival.
- **Sobres**: sobres de 6 cartas que os vais pasando, como en un TCG de papel. No ves lo que elige tu rival.

**Contra el Cerebro** juegas al momento, sin cuenta: el Cerebro es nuestro bot y solo sabe lo que sabría un jugador en su lugar. **Contra un amigo** creas una sala y envías el enlace o el código: el draft empieza en cuanto tu amigo entra, con un tiempo para cada elección (cuando se acaba, el Cerebro elige por quien no lo ha hecho). Los dos necesitáis iniciar sesión.

Al final el Cerebro da su veredicto sobre los dos mazos, de Excepcional a Débil, según la curva, las eliminaciones y las sinergias: es la opinión del bot, la partida de verdad se juega en el juego. Puedes copiar el código del juego, abrir el mazo en el [deck builder](/es/deck-builder) o retar a un amigo con el mismo draft, con las mismas cartas en el mismo orden.

## Versiones de los mazos {#versiones-mazos}

Después del [parche 0.7](/es/news/patch-0-7) muchos mazos publicados tenían cartas que ahora cuestan más. Ahora puedes **actualizar las cartas de un mazo publicado** sin perder nombre, guía, vídeos y enlace: en la página de tu mazo, o en [tu cuenta](/es/account), pulsa "Actualizar a la versión 0.7", cambia las cartas en el deck builder y guarda. Antes de guardar ves qué entra y qué sale.

Las versiones anteriores siguen en la página del mazo, en "Versiones del mazo", con sus cambios y su valoración. Los votos nunca se borran: la valoración que se muestra es la de la versión actual, y los votos antiguos se quedan con la versión a la que se dieron.

## Mazos guardados y en tendencia {#mazos-guardados}

- **Guardar**: en la página de cada mazo hay un botón para guardarlo. Tus mazos guardados están en [tu cuenta](/es/account), en "Mazos guardados". Solo tú ves la lista.
- **Nuevos órdenes** en [Mazos](/es/decks): **Tendencia**, los mazos que más atención han tenido esta semana (visitas, códigos copiados, votos y guardados), y **Más guardados**.
- **Versión del juego**: el panel de filtros de Mazos tiene ahora la versión del juego, con el número de mazos de cada una. Cada mazo muestra el parche para el que se construyó.

## Cartas y MetaShifting {#cartas}

- En [Cartas](/es/cards) hay una fila de filtros por coste (de 0 a 6, y 7+) siempre a la vista, y en "Más filtros" la palabra clave y los intervalos de poder y salud, además de un botón para borrarlos todos.
- En [MetaShifting](/es/metashifting) cada parche empieza ahora con "Antes y después": cada carta a la que le cambiaron el coste, el poder o la salud, lado a lado, con los valores cambiados resaltados.

## OriginsMeta Analytics {#analytics}

[OriginsMeta Analytics](/es/analytics) es nuestra app para Windows que registra sola tus partidas de Origins TCG mientras juegas: el mazo, el resultado, las Legendarias a las que te enfrentaste, con un overlay sobre el juego y para OBS. Está lista y funciona, pero desde el parche 0.7 el juego ya no guarda en tu PC los datos de las partidas que leía la app, así que por ahora está en pausa y las páginas de win rate están apagadas.

Queremos enseñársela al equipo de Koin Games y preguntar si esos datos pueden volver a estar disponibles. Si te interesa, pulsa **"Sí, la quiero"** en la página: cuantos más jugadores lo pidan, más cuenta la petición.

## Acceso y perfil {#cuenta}

- **Código del correo**: el correo de acceso trae ahora un código junto al enlace. Si el enlace se abre en otro navegador (el móvil, la app de Gmail) o no funciona, escribe el código en el panel de acceso, en "¿Ya tienes el código del correo?".
- **Tu página pública**: en tu cuenta, debajo de tu página pública, el botón "Editar mi página pública" lleva a una página propia con tu biografía, tus canales, tu foto y, para Creators, Autores, Pro y Staff, el escaparate.
- **Menú**: desde el ordenador, Tier list y Deck builder abren un submenú, con las páginas de la tier list, Analytics y el Draft.

## Guías y cómics {#guias-comics}

- Una guía nueva: [los directos de Origins TCG](/es/guides/streaming-tools), con el overlay para OBS, el comando !deck en el chat, los enlaces cortos y la etiqueta LIVE, paso a paso.
- Los cómics pueden tener ahora una versión dibujada para cada idioma: cada lector ve la versión dibujada en su idioma en lugar de la traducción automática.
- Las guías de los mazos publicados antes del parche 0.7 conservan la estrategia tal como se escribió, con una nota arriba: las tablas de cartas muestran los costes nuevos.

## Participa {#participa}

[Regístrate](/es/login) gratis con Discord o con tu correo electrónico, prueba el [Draft](/es/draft) y actualiza tus mazos al parche 0.7. Y [únete a nuestro Discord](https://discord.gg/RAG7nnrNGP): todo lo que se publica en el sitio llega también allí.`,
    ),
    faq: {
      en: [
        {
          q: "Is there a draft mode for Origins TCG?",
          a: "Not in the game yet, but OriginsMeta has a free one at originsmeta.com/en/draft: three formats against the Brain, our bot, with no account, or against a friend in an online room. At the end you can copy the game code of your deck.",
        },
        {
          q: "How do I update my published deck to patch 0.7?",
          a: "On your deck's page or in your account, press \"Update to version 0.7\", change the cards in the deck builder and save. Name, guide, videos and link stay the same, and the previous version stays on the page with its rating.",
        },
        {
          q: "Why are the win rates switched off?",
          a: "Since patch 0.7 the game no longer saves on your PC the match data that OriginsMeta Analytics read. The app is paused: if you want it, say so on the Analytics page, and we'll show it to Koin Games.",
        },
      ],
      it: [
        {
          q: "C'è una modalità draft per Origins TCG?",
          a: "Nel gioco non ancora, ma OriginsMeta ne ha una gratuita su originsmeta.com/it/draft: tre formati contro il Cervello, il nostro bot, senza account, o contro un amico in una stanza online. Alla fine puoi copiare il codice del gioco del tuo mazzo.",
        },
        {
          q: "Come aggiorno il mio mazzo pubblicato alla patch 0.7?",
          a: "Nella pagina del tuo mazzo o nel tuo account premi \"Aggiorna alla versione 0.7\", cambia le carte nel deck builder e salva. Nome, guida, video e link restano gli stessi, e la versione precedente resta nella pagina con il suo voto.",
        },
        {
          q: "Perché i win rate sono spenti?",
          a: "Dalla patch 0.7 il gioco non salva più sul PC i dati delle partite che OriginsMeta Analytics leggeva. L'app è in pausa: se ti interessa, diccelo dalla pagina Analytics, e la mostreremo a Koin Games.",
        },
      ],
      es: [
        {
          q: "¿Hay un modo draft para Origins TCG?",
          a: "En el juego todavía no, pero OriginsMeta tiene uno gratuito en originsmeta.com/es/draft: tres formatos contra el Cerebro, nuestro bot, sin cuenta, o contra un amigo en una sala online. Al final puedes copiar el código del juego de tu mazo.",
        },
        {
          q: "¿Cómo actualizo mi mazo publicado al parche 0.7?",
          a: "En la página de tu mazo o en tu cuenta pulsa \"Actualizar a la versión 0.7\", cambia las cartas en el deck builder y guarda. El nombre, la guía, los vídeos y el enlace no cambian, y la versión anterior sigue en la página con su valoración.",
        },
        {
          q: "¿Por qué están apagados los win rates?",
          a: "Desde el parche 0.7 el juego ya no guarda en tu PC los datos de las partidas que leía OriginsMeta Analytics. La app está en pausa: si te interesa, dínoslo en la página de Analytics y se la enseñaremos a Koin Games.",
        },
      ],
    },
    url: "/draft",
    source: "site",
  },
  {
    // Patch notes dell'aggiornamento del playtest della Demo 2.0 (richiesta di Pierluigi del 01/10/2026: "articolo subito").
    // Fonte: l'annuncio del team sul Discord ufficiale, incollato da Pierluigi; il 01/10 non c'è un post Steam (API Valve
    // ISteamNews controllata). I dieci bilanciamenti sono quelli della demo del 21/09 e della 0.7: le statistiche del sito
    // non cambiano. Le cinque modifiche che le note della demo non avevano (En Passant, Stordito, Tocco letale contro Scudo,
    // Boitata, Reflection) e i luoghi (Tectonic Decay nuovo, Ashen Grove tolto) non si scrivono nei dati finché non li
    // vediamo nella demo principale: il playtest è una build a parte.
    // 07/10/2026: i luoghi fuori dal pool della Crimson Cup sono nel post Steam del 05/10 (news crimson-cup-prizepool-qualifiers)
    slug: "playtest-patch-notes-1001",
    image: "/media/ss-board-combat.webp",
    cards: ["en-passant", "boitata", "reflection", "wicked-stepmother", "don-quixote", "twister-toss", "van-helsings-tools", "silver-bullet", "wooden-stake", "heroic-charge", "spellbook", "humpty", "mummy", "dorothy", "beauty", "christopher-robin", "magic-carpet", "quasimodo", "roo", "bagheera", "mind-palace"],
    guides: ["origins-tcg-ranked", "origins-tcg-locations", "steam-next-fest-2026", "play-the-demo"],
    date: "2026-10-01",
    updated: "2026-10-07",
    title: n(
      "Origins TCG playtest patch notes: missions split from ranked, two new locations, faster animations",
      "Patch notes del playtest di Origins TCG: missioni separate dalla classificata e due luoghi nuovi",
      "Notas del parche del playtest de Origins TCG: misiones separadas de la clasificatoria y dos ubicaciones nuevas",
    ),
    metaTitle: n(
      "Origins TCG playtest patch notes: missions and ranked",
      "Playtest di Origins TCG: missioni, classificata, luoghi",
      "Playtest de Origins TCG: misiones y clasificatoria",
    ),
    description: n(
      "Origins TCG playtest update of 1 October: PvE missions split from ranked, deck builder filters, two new locations, a tournament pool and new card fixes.",
      "Aggiornamento del playtest di Origins TCG del 1° ottobre: missioni solo PvE separate dalla classificata, deck builder, due luoghi nuovi e pool dei tornei.",
      "Actualización del playtest de Origins TCG del 1 de octubre: misiones PvE separadas de la clasificatoria, deck builder, 2 ubicaciones nuevas y pool de torneo.",
    ),
    summary: n(
      "Koin Games has updated the Demo 2.0 playtest build, its biggest update since 0.6.3. Missions become PvE only and no longer stand between you and ranked, the deck builder gets more filters and two locations arrive. The ten balance changes are the ones the main demo already has.",
      "Koin Games ha aggiornato la build del playtest della Demo 2.0, il suo aggiornamento più grande dalla 0.6.3. Le missioni diventano solo PvE e non bloccano più la classificata, il deck builder ha più filtri e arrivano due luoghi. I dieci bilanciamenti sono quelli che la demo principale ha già.",
      "Koin Games ha actualizado la build del playtest de la Demo 2.0, su mayor actualización desde la 0.6.3. Las misiones pasan a ser solo PvE y ya no te separan de la clasificatoria, el deck builder tiene más filtros y llegan dos ubicaciones. Los diez cambios de equilibrio son los que la demo principal ya tiene.",
    ),
    highlights: {
      en: [
        { label: "Missions and ranked are split", text: "missions are PvE only, ranked matchmaking whenever you like", anchor: "missions-ranked" },
        { label: "A deck builder with more filters", text: "keywords on hover, one or two copies shown clearly", anchor: "deck-builder" },
        { label: "World rank on the versus screen", text: "for Grandmaster players", anchor: "grandmaster" },
        { label: "Faster animations", text: "and a separate slider for voice volume", anchor: "speed-audio" },
        { label: "Ten balance changes", text: "all already in the main demo and on OriginsMeta", anchor: "balance" },
        { label: "Five card changes new in these notes", text: "En Passant, Stunned, Deathtouch, Boitata, Reflection", anchor: "new-changes" },
        { label: "Two new locations, one removed", text: "Ballroom and Tectonic Decay in, Ashen Grove out", anchor: "new-locations" },
        { label: "A location pool for tournaments", text: "room battles use it too", anchor: "tournament-pool" },
      ],
      it: [
        { label: "Missioni e classificata separate", text: "missioni solo PvE, matchmaking della classificata quando vuoi", anchor: "missioni-classificata" },
        { label: "Un deck builder con più filtri", text: "parole chiave al passaggio del mouse, una o due copie ben segnate", anchor: "deck-builder" },
        { label: "Rank mondiale nella schermata dello scontro", text: "per i giocatori Grandmaster", anchor: "grandmaster" },
        { label: "Animazioni più rapide", text: "e un cursore a parte per il volume delle voci", anchor: "velocita-audio" },
        { label: "Dieci bilanciamenti", text: "tutti già nella demo principale e su OriginsMeta", anchor: "bilanciamento" },
        { label: "Cinque modifiche nuove alle carte", text: "En Passant, Stordito, Tocco letale, Boitata, Reflection", anchor: "modifiche-nuove" },
        { label: "Due luoghi nuovi, uno tolto", text: "entrano Ballroom e Tectonic Decay, esce Ashen Grove", anchor: "luoghi-nuovi" },
        { label: "Un pool di luoghi per i tornei", text: "lo usano anche le partite nelle stanze", anchor: "pool-tornei" },
      ],
      es: [
        { label: "Misiones y clasificatoria separadas", text: "misiones solo PvE, emparejamiento de la clasificatoria cuando quieras", anchor: "misiones-clasificatoria" },
        { label: "Un deck builder con más filtros", text: "palabras clave al pasar el ratón, una o dos copias bien indicadas", anchor: "deck-builder" },
        { label: "Rango mundial en la pantalla del enfrentamiento", text: "para los jugadores Grandmaster", anchor: "grandmaster" },
        { label: "Animaciones más rápidas", text: "y un control aparte para el volumen de las voces", anchor: "velocidad-audio" },
        { label: "Diez cambios de equilibrio", text: "todos ya en la demo principal y en OriginsMeta", anchor: "equilibrio" },
        { label: "Cinco cambios nuevos en las cartas", text: "En Passant, Aturdido, Toque mortal, Boitata, Reflection", anchor: "cambios-nuevos" },
        { label: "Dos ubicaciones nuevas, una eliminada", text: "entran Ballroom y Tectonic Decay, sale Ashen Grove", anchor: "ubicaciones-nuevas" },
        { label: "Un pool de ubicaciones para los torneos", text: "también lo usan las partidas en sala", anchor: "pool-torneos" },
      ],
    },
    body: n(
      `## The playtest catches up with the demo {#playtest}

Koin Games has updated the Demo 2.0 playtest, the separate build you join through the official Discord. "This is our biggest update since 0.6.3", the team writes, and it warns that the build is fresh from development: there will be bugs and placeholder things. Many of the changes, the team adds, had already reached the main demo with [the update of 21 September](/en/news/demo-patch-notes-0921) and [patch 0.7](/en/news/patch-0-7).

## Missions and ranked are split {#missions-ranked}

Missions and bosses are now entirely PvE: you only face bots, and they serve only to unlock decks. They have their own Play button on the Missions screen, so the Play button on the home screen is now only for real matchmaking, which you can use whenever you like.

- You no longer have to finish all the missions before the ranked matchmaker will match you: it tries to find you a suitable opponent every time you play ranked. The team is still working on it.
- **In this playtest, deck missions can't be completed from ranked mode.** The team will turn that back on in a future build. If you still have decks to unlock, play the missions from the Missions area.
- The reward track spreads the prizes over more missions, and the Missions screen has a deck swap to change your deck.

How ranked works in the demo, and what we know of the ladder, is in [our ranked guide](/en/guides/origins-tcg-ranked).

## Deck builder, news feed and Grandmaster {#interface}

### A deck builder with more filters {#deck-builder}

A new toolbar with more filters. Hovering over a card in the collection shows its keywords. The deck now shows clearly which cards you have two copies of and which only one: new players were struggling with it.

### A news feed in the game {#news-feed}

The game has its own news feed: if you're reading the notes there, the team writes, you've already seen it.

### World rank on the versus screen {#grandmaster}

Players in the Grandmaster division, the top one, now show their world rank on the versus screen.

### Card grading: not yet {#grading}

The card grading visuals are not in this update, and the "How Grading Works" information you'll find is placeholder: the team asks you to ignore it. It does ask for feedback on the pack opening experience, on Discord.

## Speed and audio {#speed-audio}

Animations and the pauses between them are faster. "This still needs a lot more work", the team writes: speed remains one of its highest priorities. The voices are more professional and better mixed, and there is a separate slider for voice volume.

## Card balance: all already on OriginsMeta {#balance}

The ten balance changes in the notes are the ones the main demo received with the update of 21 September and with patch 0.7: card pages, the [deck builder](/en/deck-builder) and [MetaShifting](/en/metashifting) already use them. Format: mana · Power/Health for characters, mana only for spells.

| Card | Before | After | In the demo since |
| --- | --- | --- | --- |
| Dorothy | 5 · 1/1 | 4 · 1/1 | 21 September |
| Wicked Stepmother | 4 · 3/6 | 4 · 4/6 | 21 September |
| Beauty | 4 · 1/1 | 4 · 2/1 | 21 September |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | 21 September |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | 21 September |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | 21 September |
| Roo | 2 · 2/3 | 2 · 2/4 | 21 September |
| Bagheera | 1 · 1/1 | 2 · 1/1 | patch 0.7 |
| Spellbook | 3 | 4 | patch 0.7 |
| Mind Palace | 2 | 3 | patch 0.7 |

## Cards that change what they do {#card-changes}

### New in these notes {#new-changes}

Five changes don't appear in the demo patch notes of 21 and 29 September:

- **En Passant** can now target occupied spaces: if the space is occupied, your ally stays put but still deals its damage.
- **Stunned** is now removed at the end of combat.
- **Deathtouch** no longer destroys characters with Shield.
- **Boitata** should behave better, especially when both players have one.
- **Reflection** has slightly clearer wording; the team admits the card may need some surgery to become more intuitive.

We don't know yet whether they are already in the main demo: we'll check in the game before changing the card pages.

### Already in the demo {#already-in-demo}

- Don Quixote has Defender himself, as well as giving it to the enemies at his location (21 September: the demo notes only said he gained Defender).
- Twister Toss can move an ally into an occupied space, and the two swap places (patch 0.7).
- Van Helsing's Tools: Silver Bullet can hit barriers; Wooden Stake can target undamaged characters, but only works if the character is damaged when it resolves (21 September).
- Heroic Charge stacks properly when cast more than once (21 September).
- Spellbook and Humpty can no longer generate themselves as the random card (patch 0.7).
- Characters with Choose One can choose again if they return to your hand, and they keep their stats (21 September, for Frog Prince and Magic Carpet).
- Cards keep their stats in the graveyard: a buffed Mummy comes back with all its Power (21 September).

## Locations {#locations}

### Two new, one removed {#new-locations}

- **Ballroom** (new): after combat, for both players, a random character here returns to its owner's hand.
- **Tectonic Decay** (new): after combat, deal 1 damage to both barriers here.
- **Ashen Grove** (removed): when you played a character here, you discarded your rightmost card, then drew a card.

The notes compare the playtest with its previous build. Our [Locations page](/en/locations), the list of the Demo 2.0 as of 21 September, already has Ballroom and still has Ashen Grove, while Tectonic Decay is not there: we'll update it once we've seen which locations are in the main demo.

### Rarity and a tournament pool {#tournament-pool}

Location rarity is now a true rarity, common, rare, very rare or ultra rare, which no longer depends on how many locations exist in the game: the same change the demo got with patch 0.7.

Tournaments now have their own location pool, so locations can be included in or left out of competitions without changing everyday games. The first example is the [Crimson Cup](/en/news/crimson-cup-format-check-in): some of the swingiest locations are out of its pool. The team says the full list is in its latest announcement; we'll report it as soon as we've read it.

**Update, 7 October:** the list came with the Steam post of 5 October: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum and Nostradamus' Call are out of the Crimson Cup pool ([our article](/en/news/crimson-cup-prizepool-qualifiers#locations)).

In this build, room battles (Create/Join Room Battle) use the tournament pool: they're the way to practise with the Crimson Cup locations.

## What we don't know yet {#unknowns}

- Whether the five new card changes, Tectonic Decay and the removal of Ashen Grove are already in the main demo.
- Which locations are out of the Crimson Cup pool: answered on 5 October, see the update above.
- When deck missions will count again in ranked.
- The new wording of Reflection.

## What changes on OriginsMeta {#on-the-site}

- Card stats don't change: all ten balance changes have been in the card database, the deck builder and MetaShifting since 21 and 29 September.
- The pages of En Passant, Boitata and Reflection keep their current text until we read the new one in the game.
- The [Locations](/en/locations) page stays as it is until we've checked the new locations in the main demo.

## Where these notes come from {#sources}

The patch notes the team posted on the official [Origins TCG Discord](https://discord.gg/originstcg) on 1 October, with the playtest update; how to join the playtest is explained in the Discord channel demo-v2-playtest-instructions. As of 1 October they are not on Steam.`,
      `## Il playtest raggiunge la demo {#playtest}

Koin Games ha aggiornato il playtest della Demo 2.0, la build a parte a cui si accede dal Discord ufficiale. "È il nostro aggiornamento più grande dalla 0.6.3", scrive il team, e avverte che la build è fresca di sviluppo: ci saranno bug e cose provvisorie. Molte modifiche, aggiunge il team, erano già arrivate nella demo principale con [l'aggiornamento del 21 settembre](/it/news/demo-patch-notes-0921) e con la [patch 0.7](/it/news/patch-0-7).

## Missioni e classificata separate {#missioni-classificata}

Missioni e boss ora sono interamente PvE: si gioca solo contro i bot, e servono solo a sbloccare i mazzi. Hanno un tasto Gioca tutto loro nella schermata delle Missioni, così il tasto Gioca della schermata principale serve solo al matchmaking vero, che puoi usare quando vuoi.

- Non devi più finire tutte le missioni perché il matchmaking della classificata ti trovi un avversario: ci prova ogni volta che giochi una partita classificata. Il team ci sta ancora lavorando.
- **In questo playtest le missioni dei mazzi non si completano dalla classificata.** Il team le riattiverà in una build futura. Se hai ancora mazzi da sbloccare, gioca le missioni dall'area Missioni.
- Il percorso delle ricompense distribuisce i premi su più missioni, e la schermata delle Missioni ha un cambio mazzo.

Come funziona la classificata nella demo, e che cosa sappiamo della ladder, è nella [nostra guida alla classificata](/it/guides/origins-tcg-ranked).

## Deck builder, news e Grandmaster {#interfaccia}

### Un deck builder con più filtri {#deck-builder}

Una barra degli strumenti nuova con più filtri. Al passaggio del mouse su una carta della collezione compaiono le sue parole chiave. Il mazzo ora mostra chiaramente di quali carte hai due copie e di quali una sola: i giocatori nuovi ci inciampavano.

### Le news nel gioco {#news-gioco}

Il gioco ha un suo feed di notizie: se stai leggendo le note lì, scrive il team, l'hai già visto.

### Rank mondiale nella schermata dello scontro {#grandmaster}

I giocatori della divisione Grandmaster, la più alta, ora mostrano il loro rank mondiale nella schermata che precede la partita.

### Gradazione delle carte: non ancora {#gradazione}

La grafica della gradazione delle carte non è in questo aggiornamento, e le informazioni di "How Grading Works" sono provvisorie: il team chiede di ignorarle. Chiede invece pareri sull'apertura dei pacchetti, sul Discord.

## Velocità e audio {#velocita-audio}

Le animazioni e le pause fra l'una e l'altra sono più rapide. "C'è ancora molto da fare", scrive il team: la velocità resta una delle sue priorità più alte. Le voci sono più professionali e mixate meglio, e c'è un cursore a parte per il volume delle voci.

## Bilanciamento: già tutto su OriginsMeta {#bilanciamento}

Le dieci modifiche di bilanciamento delle note sono quelle che la demo principale ha ricevuto con l'aggiornamento del 21 settembre e con la patch 0.7: le schede carta, il [deck builder](/it/deck-builder) e il [MetaShifting](/it/metashifting) le usano già. Formato: mana · Potenza/Salute per i personaggi, solo il mana per le magie.

| Carta | Prima | Dopo | Nella demo dal |
| --- | --- | --- | --- |
| Dorothy | 5 · 1/1 | 4 · 1/1 | 21 settembre |
| Wicked Stepmother | 4 · 3/6 | 4 · 4/6 | 21 settembre |
| Beauty | 4 · 1/1 | 4 · 2/1 | 21 settembre |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | 21 settembre |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | 21 settembre |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | 21 settembre |
| Roo | 2 · 2/3 | 2 · 2/4 | 21 settembre |
| Bagheera | 1 · 1/1 | 2 · 1/1 | patch 0.7 |
| Spellbook | 3 | 4 | patch 0.7 |
| Mind Palace | 2 | 3 | patch 0.7 |

## Carte che cambiano effetto {#effetti}

### Nuove in queste note {#modifiche-nuove}

Cinque modifiche non compaiono nelle patch notes della demo del 21 e del 29 settembre:

- **En Passant** ora può bersagliare spazi occupati: se lo spazio è occupato, il tuo alleato resta dov'è ma infligge comunque i suoi danni.
- **Stordito** ora viene tolto alla fine del combattimento.
- **Tocco letale** non distrugge più i personaggi con Scudo.
- **Boitata** dovrebbe comportarsi meglio, soprattutto quando ce l'hanno tutti e due i giocatori.
- **Reflection** ha un testo un po' più chiaro; il team ammette che la carta potrebbe avere bisogno di un intervento più profondo per diventare più intuitiva.

Non sappiamo ancora se sono già nella demo principale: lo verificheremo nel gioco prima di cambiare le schede delle carte.

### Già nella demo {#gia-nella-demo}

- Don Quixote ha lui stesso Difensore, oltre a darlo ai nemici nel suo luogo (21 settembre: le note della demo dicevano solo che aveva ottenuto Difensore).
- Twister Toss può muovere un alleato in uno spazio occupato, e i due si scambiano di posto (patch 0.7).
- Van Helsing's Tools: Silver Bullet può colpire le barriere; Wooden Stake può bersagliare personaggi non danneggiati, ma funziona solo se il personaggio è danneggiato quando si risolve (21 settembre).
- Heroic Charge si somma come deve quando la giochi più di una volta (21 settembre).
- Spellbook e Humpty non possono più generare sé stessi come carta casuale (patch 0.7).
- I personaggi con Scegline uno possono scegliere di nuovo se tornano nella tua mano, e tengono le loro statistiche (21 settembre, per Frog Prince e Magic Carpet).
- Le carte conservano le statistiche nel cimitero: una Mummy potenziata torna con tutta la sua Potenza (21 settembre).

## Luoghi {#luoghi}

### Due nuovi, uno tolto {#luoghi-nuovi}

- **Ballroom** (nuovo): dopo il combattimento, per entrambi i giocatori, un personaggio casuale qui torna nella mano del suo proprietario.
- **Tectonic Decay** (nuovo): dopo il combattimento, infliggi 1 danno a entrambe le barriere qui.
- **Ashen Grove** (tolto): quando giocavi un personaggio qui, scartavi la carta più a destra e poi pescavi una carta.

Le note confrontano il playtest con la sua build precedente. La nostra pagina dei [Luoghi](/it/locations), l'elenco della Demo 2.0 al 21 settembre, ha già Ballroom e ha ancora Ashen Grove, mentre Tectonic Decay non c'è: la aggiorneremo quando avremo visto quali luoghi ci sono nella demo principale.

### Rarità e pool dei tornei {#pool-tornei}

La rarità dei luoghi ora è una rarità vera, comune, rara, molto rara o ultra rara, che non dipende più da quanti luoghi ci sono nel gioco: la stessa modifica arrivata nella demo con la patch 0.7.

I tornei ora hanno un loro pool di luoghi, così si possono includere o escludere luoghi dalle competizioni senza cambiare le partite di tutti i giorni. Il primo esempio è la [Crimson Cup](/it/news/crimson-cup-format-check-in): alcuni dei luoghi più capaci di ribaltare una partita sono fuori dal suo pool. Il team dice che l'elenco completo è nel suo ultimo annuncio; lo riporteremo appena l'avremo letto.

**Aggiornamento del 7 ottobre:** l'elenco è arrivato con il post Steam del 5 ottobre: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum e Nostradamus' Call sono fuori dal pool della Crimson Cup ([il nostro articolo](/it/news/crimson-cup-prizepool-qualifiers#luoghi)).

In questa build le partite nelle stanze (Create/Join Room Battle) usano il pool dei tornei: sono il modo per allenarsi con i luoghi della Crimson Cup.

## Cosa non sappiamo ancora {#cosa-non-sappiamo}

- Se le cinque modifiche nuove alle carte, Tectonic Decay e l'uscita di Ashen Grove sono già nella demo principale.
- Quali luoghi sono fuori dal pool della Crimson Cup: risposta arrivata il 5 ottobre, vedi l'aggiornamento qui sopra.
- Quando le missioni dei mazzi torneranno a contare in classificata.
- Il testo nuovo di Reflection.

## Cosa cambia su OriginsMeta {#sul-sito}

- Le statistiche delle carte non cambiano: le dieci modifiche di bilanciamento sono nel database carte, nel deck builder e nel MetaShifting dal 21 e dal 29 settembre.
- Le schede di En Passant, Boitata e Reflection tengono il testo attuale finché non leggiamo quello nuovo nel gioco.
- La pagina dei [Luoghi](/it/locations) resta com'è finché non avremo verificato i luoghi nuovi nella demo principale.

## Da dove arrivano queste note {#fonti}

Le patch notes che il team ha pubblicato sul [Discord ufficiale di Origins TCG](https://discord.gg/originstcg) il 1° ottobre, con l'aggiornamento del playtest; come entrare nel playtest lo spiega il canale Discord demo-v2-playtest-instructions. Al 1° ottobre non sono su Steam.`,
      `## El playtest alcanza a la demo {#playtest}

Koin Games ha actualizado el playtest de la Demo 2.0, la build aparte a la que se entra desde el Discord oficial. "Es nuestra mayor actualización desde la 0.6.3", escribe el equipo, y avisa de que la build viene recién salida de desarrollo: habrá errores y elementos provisionales. Muchos de los cambios, añade el equipo, ya habían llegado a la demo principal con [la actualización del 21 de septiembre](/es/news/demo-patch-notes-0921) y con el [parche 0.7](/es/news/patch-0-7).

## Misiones y clasificatoria separadas {#misiones-clasificatoria}

Las misiones y los jefes ahora son completamente PvE: solo te enfrentas a bots, y sirven solo para desbloquear mazos. Tienen su propio botón Jugar en la pantalla de Misiones, así que el botón Jugar de la pantalla principal queda solo para el emparejamiento real, que puedes usar cuando quieras.

- Ya no tienes que completar todas las misiones para que el emparejamiento de la clasificatoria te encuentre rival: lo intenta cada vez que juegas una partida clasificatoria. El equipo sigue trabajando en ello.
- **En este playtest las misiones de los mazos no se completan desde la clasificatoria.** El equipo las volverá a activar en una build futura. Si aún tienes mazos por desbloquear, juega las misiones desde el área de Misiones.
- El recorrido de recompensas reparte los premios entre más misiones, y la pantalla de Misiones tiene un cambio de mazo.

Cómo funciona la clasificatoria en la demo, y lo que sabemos de la ladder, está en [nuestra guía de la clasificatoria](/es/guides/origins-tcg-ranked).

## Deck builder, noticias y Grandmaster {#interfaz}

### Un deck builder con más filtros {#deck-builder}

Una barra de herramientas nueva con más filtros. Al pasar el ratón por una carta de la colección aparecen sus palabras clave. El mazo ahora muestra con claridad de qué cartas tienes dos copias y de cuáles una sola: a los jugadores nuevos les costaba verlo.

### Noticias dentro del juego {#noticias-juego}

El juego tiene su propio feed de noticias: si estás leyendo las notas allí, escribe el equipo, ya lo has visto.

### Rango mundial en la pantalla del enfrentamiento {#grandmaster}

Los jugadores de la división Grandmaster, la más alta, ahora muestran su rango mundial en la pantalla previa a la partida.

### Graduación de cartas: todavía no {#graduacion}

Los gráficos de la graduación de cartas no están en esta actualización, y la información de "How Grading Works" es provisional: el equipo pide que no le hagas caso. Sí pide opiniones sobre la apertura de sobres, en Discord.

## Velocidad y audio {#velocidad-audio}

Las animaciones y las pausas entre ellas son más rápidas. "Todavía hace falta mucho trabajo", escribe el equipo: la velocidad sigue siendo una de sus mayores prioridades. Las voces son más profesionales y están mejor mezcladas, y hay un control aparte para el volumen de las voces.

## Equilibrio: todo ya en OriginsMeta {#equilibrio}

Los diez cambios de equilibrio de las notas son los que la demo principal recibió con la actualización del 21 de septiembre y con el parche 0.7: las páginas de las cartas, el [deck builder](/es/deck-builder) y [MetaShifting](/es/metashifting) ya los usan. Formato: maná · Poder/Salud para los personajes, solo el maná para los hechizos.

| Carta | Antes | Después | En la demo desde |
| --- | --- | --- | --- |
| Dorothy | 5 · 1/1 | 4 · 1/1 | 21 de septiembre |
| Wicked Stepmother | 4 · 3/6 | 4 · 4/6 | 21 de septiembre |
| Beauty | 4 · 1/1 | 4 · 2/1 | 21 de septiembre |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | 21 de septiembre |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | 21 de septiembre |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | 21 de septiembre |
| Roo | 2 · 2/3 | 2 · 2/4 | 21 de septiembre |
| Bagheera | 1 · 1/1 | 2 · 1/1 | parche 0.7 |
| Spellbook | 3 | 4 | parche 0.7 |
| Mind Palace | 2 | 3 | parche 0.7 |

## Cartas que cambian lo que hacen {#efectos}

### Nuevos en estas notas {#cambios-nuevos}

Cinco cambios no aparecen en las notas del parche de la demo del 21 y del 29 de septiembre:

- **En Passant** ahora puede elegir como objetivo espacios ocupados: si el espacio está ocupado, tu aliado se queda donde está, pero inflige igualmente su daño.
- **Aturdido** ahora se quita al final del combate.
- **Toque mortal** ya no destruye a los personajes con Escudo.
- **Boitata** debería comportarse mejor, sobre todo cuando los dos jugadores tienen uno.
- **Reflection** tiene un texto algo más claro; el equipo admite que la carta quizá necesite una intervención más a fondo para ser más intuitiva.

Todavía no sabemos si ya están en la demo principal: lo comprobaremos en el juego antes de cambiar las páginas de las cartas.

### Ya en la demo {#ya-en-la-demo}

- Don Quixote tiene él mismo Defensor, además de dárselo a los enemigos de su ubicación (21 de septiembre: las notas de la demo solo decían que obtenía Defensor).
- Twister Toss puede mover a un aliado a un espacio ocupado, y los dos intercambian sus posiciones (parche 0.7).
- Van Helsing's Tools: Silver Bullet puede golpear barreras; Wooden Stake puede elegir como objetivo a personajes sin daño, pero solo funciona si el personaje está dañado cuando se resuelve (21 de septiembre).
- Heroic Charge se acumula como debe cuando lo juegas más de una vez (21 de septiembre).
- Spellbook y Humpty ya no pueden generarse a sí mismos como carta aleatoria (parche 0.7).
- Los personajes con Elige una pueden volver a elegir si regresan a tu mano, y conservan sus estadísticas (21 de septiembre, para Frog Prince y Magic Carpet).
- Las cartas conservan sus estadísticas en el cementerio: una Mummy potenciada vuelve con todo su Poder (21 de septiembre).

## Ubicaciones {#ubicaciones}

### Dos nuevas, una eliminada {#ubicaciones-nuevas}

- **Ballroom** (nueva): después del combate, para ambos jugadores, un personaje aleatorio de aquí vuelve a la mano de su dueño.
- **Tectonic Decay** (nueva): después del combate, inflige 1 de daño a las dos barreras de aquí.
- **Ashen Grove** (eliminada): cuando jugabas un personaje aquí, descartabas tu carta más a la derecha y luego robabas una carta.

Las notas comparan el playtest con su build anterior. Nuestra página de [Ubicaciones](/es/locations), la lista de la Demo 2.0 a 21 de septiembre, ya tiene Ballroom y todavía tiene Ashen Grove, mientras que Tectonic Decay no está: la actualizaremos cuando hayamos visto qué ubicaciones hay en la demo principal.

### Rareza y pool de torneo {#pool-torneos}

La rareza de las ubicaciones es ahora una rareza real, común, rara, muy rara o ultra rara, que ya no depende de cuántas ubicaciones hay en el juego: el mismo cambio que llegó a la demo con el parche 0.7.

Los torneos ahora tienen su propio pool de ubicaciones, así que se pueden incluir o excluir ubicaciones de las competiciones sin cambiar las partidas de cada día. El primer ejemplo es la [Crimson Cup](/es/news/crimson-cup-format-check-in): algunas de las ubicaciones más capaces de dar la vuelta a una partida están fuera de su pool. El equipo dice que la lista completa está en su último anuncio; la contaremos en cuanto la hayamos leído.

**Actualización del 7 de octubre:** la lista llegó con la publicación de Steam del 5 de octubre: Junkyard, Cloning Lab, Reflecting Pool, Amplifying Amphitheatre, Giant's Beacon, The Colosseum y Nostradamus' Call quedan fuera del pool de la Crimson Cup ([nuestro artículo](/es/news/crimson-cup-prizepool-qualifiers#ubicaciones)).

En esta build las partidas en sala (Create/Join Room Battle) usan el pool de torneo: son la forma de practicar con las ubicaciones de la Crimson Cup.

## Lo que todavía no sabemos {#lo-que-no-sabemos}

- Si los cinco cambios nuevos en las cartas, Tectonic Decay y la salida de Ashen Grove ya están en la demo principal.
- Qué ubicaciones están fuera del pool de la Crimson Cup: respondido el 5 de octubre, ver la actualización de arriba.
- Cuándo volverán a contar en la clasificatoria las misiones de los mazos.
- El nuevo texto de Reflection.

## Qué cambia en OriginsMeta {#en-el-sitio}

- Las estadísticas de las cartas no cambian: los diez cambios de equilibrio están en la base de datos de cartas, en el deck builder y en MetaShifting desde el 21 y el 29 de septiembre.
- Las páginas de En Passant, Boitata y Reflection mantienen su texto actual hasta que leamos el nuevo en el juego.
- La página de [Ubicaciones](/es/locations) se queda como está hasta que hayamos comprobado las ubicaciones nuevas en la demo principal.

## De dónde vienen estas notas {#fuentes}

Las notas del parche que el equipo publicó en el [Discord oficial de Origins TCG](https://discord.gg/originstcg) el 1 de octubre, con la actualización del playtest; cómo entrar en el playtest lo explica el canal de Discord demo-v2-playtest-instructions. A 1 de octubre no están en Steam.`,
    ),
    faq: {
      en: [
        {
          q: "Do you need to finish the missions to play ranked in the Origins TCG playtest?",
          a: "No. Since the playtest update of 1 October 2026 missions are PvE only and serve to unlock decks, and the ranked matchmaker matches you whenever you play ranked. In this playtest, though, deck missions can't be completed from ranked: play them from the Missions screen.",
        },
        {
          q: "Does the playtest update change card stats for the Crimson Cup?",
          a: "No. Its ten balance changes, such as Dorothy at 4 mana and Bagheera at 2, are the ones the main demo already received on 21 and 29 September 2026; patch 0.7 is the last balance patch before the tournament.",
        },
        {
          q: "How can you practise with the Crimson Cup locations?",
          a: "In the playtest build, room battles (Create/Join Room Battle) use the tournament location pool, from which some of the swingiest locations have been removed for the Crimson Cup.",
        },
      ],
      it: [
        {
          q: "Bisogna finire le missioni per giocare in classificata nel playtest di Origins TCG?",
          a: "No. Dall'aggiornamento del playtest del 1° ottobre 2026 le missioni sono solo PvE e servono a sbloccare i mazzi, e il matchmaking della classificata ti trova un avversario ogni volta che giochi in classificata. In questo playtest però le missioni dei mazzi non si completano dalla classificata: giocale dalla schermata delle Missioni.",
        },
        {
          q: "L'aggiornamento del playtest cambia le statistiche delle carte per la Crimson Cup?",
          a: "No. Le sue dieci modifiche di bilanciamento, come Dorothy a 4 mana e Bagheera a 2, sono quelle che la demo principale ha già ricevuto il 21 e il 29 settembre 2026; la patch 0.7 è l'ultima di bilanciamento prima del torneo.",
        },
        {
          q: "Come ci si allena con i luoghi della Crimson Cup?",
          a: "Nella build del playtest le partite nelle stanze (Create/Join Room Battle) usano il pool di luoghi dei tornei, da cui per la Crimson Cup sono stati tolti alcuni dei luoghi più capaci di ribaltare una partita.",
        },
      ],
      es: [
        {
          q: "¿Hay que completar las misiones para jugar la clasificatoria en el playtest de Origins TCG?",
          a: "No. Desde la actualización del playtest del 1 de octubre de 2026 las misiones son solo PvE y sirven para desbloquear mazos, y el emparejamiento de la clasificatoria te encuentra rival cada vez que juegas una partida clasificatoria. Eso sí, en este playtest las misiones de los mazos no se completan desde la clasificatoria: juégalas desde la pantalla de Misiones.",
        },
        {
          q: "¿La actualización del playtest cambia las estadísticas de las cartas para la Crimson Cup?",
          a: "No. Sus diez cambios de equilibrio, como Dorothy a 4 de maná y Bagheera a 2, son los que la demo principal ya recibió el 21 y el 29 de septiembre de 2026; el parche 0.7 es el último de equilibrio antes del torneo.",
        },
        {
          q: "¿Cómo se practica con las ubicaciones de la Crimson Cup?",
          a: "En la build del playtest, las partidas en sala (Create/Join Room Battle) usan el pool de ubicaciones de torneo, del que para la Crimson Cup se han quitado algunas de las ubicaciones más capaces de dar la vuelta a una partida.",
        },
      ],
    },
    url: "https://discord.gg/originstcg",
    source: "press",
  },
  {
    // Patch 0.7 del 29/09/2026 (richiesta di Pierluigi del 30/09: "uscita la patchnote, bisogna fare subito articolo").
    // Fonti: il post Steam del 29/09 alle 19:37 UTC (gid 1844751498235283, stesso testo che Pierluigi ha incollato, con in
    // più la frase "This time around we've focused on balance and card fixes") e l'immagine ufficiale "Steam Demo Update #2
    // – 0.7", che è la copertina. I conteggi dei mazzi sono una fotografia della tabella community_decks (mazzi pubblicati,
    // carte uniche per mazzo, come "Le più giocate") alle 00:13 del 30/09 ora italiana. Le carte che riportano una carta in
    // mano (White Queen, Stroke of Midnight, Koschei, Dracula) vengono dai loro testi, non dalle patch notes.
    slug: "patch-0-7",
    image: "/media/news-patch-07.webp",
    cards: ["twister-toss", "bagheera", "mind-palace", "spellbook", "humpty", "heroic-charge", "freeze", "dorothy", "boogeyman", "trash-for-treasure", "white-queen", "stroke-of-midnight", "koschei", "dracula"],
    guides: ["steam-next-fest-2026", "origins-tcg-conquest", "dorothy-combo-guide", "origins-tcg-locations"],
    date: "2026-09-29",
    title: n(
      "Patch 0.7, the last balance patch before the Crimson Cup: Twister Toss reworked, three cards cost more",
      "Patch 0.7, l'ultima di bilanciamento prima della Crimson Cup: Twister Toss rifatta, tre carte costano di più",
      "Parche 0.7, el último de equilibrio antes de la Crimson Cup: rework de Twister Toss y tres cartas más caras",
    ),
    metaTitle: n("Origins TCG patch 0.7 notes: Twister Toss and three nerfs", "Patch 0.7 di Origins TCG: Twister Toss e tre nerf", "Parche 0.7 de Origins TCG: Twister Toss y tres nerfs"),
    description: n(
      "Origins TCG patch 0.7, the last balance patch before the Crimson Cup: Twister Toss reworked, Bagheera, Mind Palace and Spellbook cost 1 more.",
      "Patch 0.7 di Origins TCG, l'ultima prima della Crimson Cup: Twister Toss rifatta, Bagheera, Mind Palace e Spellbook costano 1 in più, luoghi con rarità.",
      "Parche 0.7 de Origins TCG, el último antes de la Crimson Cup: rework de Twister Toss; Bagheera, Mind Palace y Spellbook cuestan 1 más.",
    ),
    summary: n(
      "Patch 0.7, the second update of the demo, is the last balance patch before the Crimson Cup. Twister Toss is reworked, Bagheera, Mind Palace and Spellbook cost 1 more mana, and locations now come up by rarity. It also fixes Humpty, Spellbook, Heroic Charge and multiple Defenders, and brings the game to 13 languages.",
      "La patch 0.7, secondo aggiornamento della demo, è l'ultima di bilanciamento prima della Crimson Cup. Twister Toss cambia effetto, Bagheera, Mind Palace e Spellbook costano 1 mana in più e i luoghi ora compaiono in base alla rarità. Corregge anche Humpty, Spellbook, Heroic Charge e i Difensori multipli, e porta il gioco a 13 lingue.",
      "El parche 0.7, la segunda actualización de la demo, es el último de equilibrio antes de la Crimson Cup. Twister Toss recibe un rework, Bagheera, Mind Palace y Spellbook cuestan 1 de maná más y las ubicaciones ahora aparecen según su rareza. También corrige Humpty, Spellbook, Heroic Charge y los Defensores múltiples, y lleva el juego a 13 idiomas.",
    ),
    highlights: {
      en: [
        { label: "The last balance patch before the Crimson Cup", text: "out on 29 September, three weeks before the first qualifier", anchor: "crimson-cup" },
        { label: "Twister Toss reworked", text: "it moves an ally to any space and swaps it with the card already there", anchor: "twister-toss" },
        { label: "Three cards cost 1 more", text: "Bagheera 2, Mind Palace 3, Spellbook 4", anchor: "costs" },
        { label: "Humpty and Spellbook no longer give themselves", anchor: "humpty-spellbook" },
        { label: "Full hand", text: "a returned card now burns instead of the ability fizzling", anchor: "full-hand" },
        { label: "Heroic Charge and Defender fixed", anchor: "bug-fixes" },
        { label: "Locations have a rarity", text: "common, rare, very rare or ultra rare", anchor: "locations" },
        { label: "13 languages in the game", anchor: "languages" },
        { label: "Boogeyman", text: "the notes say it changes, not how", anchor: "boogeyman" },
      ],
      it: [
        { label: "L'ultima patch di bilanciamento prima della Crimson Cup", text: "uscita il 29 settembre, tre settimane prima della prima qualificazione", anchor: "crimson-cup" },
        { label: "Twister Toss cambia effetto", text: "muove un alleato in qualsiasi spazio e lo scambia con la carta che c'è già", anchor: "twister-toss" },
        { label: "Tre carte costano 1 in più", text: "Bagheera 2, Mind Palace 3, Spellbook 4", anchor: "costi" },
        { label: "Humpty e Spellbook non danno più sé stessi", anchor: "humpty-spellbook" },
        { label: "Mano piena", text: "la carta riportata ora brucia invece di far fallire l'abilità", anchor: "mano-piena" },
        { label: "Heroic Charge e Difensori corretti", anchor: "bug" },
        { label: "I luoghi hanno una rarità", text: "comune, rara, molto rara o ultra rara", anchor: "luoghi" },
        { label: "13 lingue nel gioco", anchor: "lingue" },
        { label: "Boogeyman", text: "le note dicono che cambia, non come", anchor: "boogeyman" },
      ],
      es: [
        { label: "El último parche de equilibrio antes de la Crimson Cup", text: "salió el 29 de septiembre, tres semanas antes del primer clasificatorio", anchor: "crimson-cup" },
        { label: "Rework de Twister Toss", text: "mueve a un aliado a cualquier espacio y lo intercambia con la carta que ya está allí", anchor: "twister-toss" },
        { label: "Tres cartas cuestan 1 más", text: "Bagheera 2, Mind Palace 3, Spellbook 4", anchor: "costes" },
        { label: "Humpty y Spellbook ya no se dan a sí mismos", anchor: "humpty-spellbook" },
        { label: "Mano llena", text: "la carta devuelta ahora se quema en lugar de que la habilidad falle", anchor: "mano-llena" },
        { label: "Correcciones de Heroic Charge y Defensor", anchor: "errores" },
        { label: "Las ubicaciones tienen rareza", text: "común, rara, muy rara o ultra rara", anchor: "ubicaciones" },
        { label: "13 idiomas en el juego", anchor: "idiomas" },
        { label: "Boogeyman", text: "las notas dicen que cambia, no cómo", anchor: "boogeyman" },
      ],
    },
    body: n(
      `## The last balance patch before the Crimson Cup {#crimson-cup}

"This is the FINAL balance patch before the tournament", the team writes. The Crimson Cup starts on 20 October with the EMEA qualifier, during Steam Next Fest, and is played in three-deck Conquest ([the rules](/en/news/crimson-cup-format-check-in)). On 24 September the team had said the last balance patch would come two weeks before the festival: it arrived on 29 September, three weeks before. If the plan holds, these are the costs and stats the tournament will be played with.

The official image calls it Steam Demo Update #2, version 0.7: it is the second update of the demo, after [the one of 21 September](/en/news/demo-patch-notes-0921).

## All the balance changes {#balance}

Format: mana · Power/Health for characters, mana only for spells.

| Card | Before | After | What changes |
| --- | --- | --- | --- |
| Bagheera | 1 · 1/1 | 2 · 1/1 | costs 1 more |
| Mind Palace | 2 | 3 | costs 1 more |
| Spellbook | 3 | 4 | costs 1 more; its random spells can no longer be Spellbook |
| Twister Toss | 1 | 1 | reworked: moves an ally to any space, swapping it with the card already there |

No Legendary changes cost, stats or ability: Dorothy only gets a clearer explanation of her keywords.

## Twister Toss reworked {#twister-toss}

Until now Twister Toss, a 1-mana spell, did one thing: move an ally. After the rework it moves an ally to any space, and if another card is already there, the two swap places.

It can also target occupied spaces. The team gives two examples:

- move a character away and then right back in the same round;
- destroy your character with Trash for Treasure and immediately move another character into its space.

On OriginsMeta Twister Toss is in three published decks, among them the [Dorothy Combo](/en/guides/dorothy-combo-guide): Dorothy grows every time an ally moves. The patch notes don't give the new text of the card: its page shows the old one, with a warning, until we read the new one in the game.

## Three cards cost 1 more {#costs}

Among the 35 decks published on OriginsMeta (count at 00:13 CEST on 30 September), Mind Palace is in 22 and Spellbook in 17: they are the two most played cards on the site. Bagheera is in 13. The full ranking is in [the most played cards](/en/tier-list/most-played).

### Bagheera: 2 mana {#bagheera}

Bagheera stays a 1/1 whose On Reveal ability gives it +2⚔️/+2❤️ on a middle space. At 1 mana it was a 3/3 from the first round; now it comes down on round two at the earliest.

### Mind Palace: 3 mana {#mind-palace}

The spell that draws 2 cards now costs 3.

### Spellbook: 4 mana {#spellbook}

For the rest of the game Spellbook adds a random spell to your hand at the start of each round, to be played before combat or it is discarded. It now costs 4, and its random spells can no longer be Spellbook.

## Ability changes and fixes {#fixes}

### Humpty and Spellbook no longer give themselves {#humpty-spellbook}

The random cards they give you can no longer be themselves. Humpty's On Death ability adds a random card to your hand: it can no longer be Humpty. The random spell Spellbook adds every round can no longer be Spellbook.

### Full hand: a returned card burns {#full-hand}

When a card is returned to a hand that is already full, it now burns (it is lost) instead of the ability fizzling. Among the cards of the Demo 2.0, this concerns the ones that return a card to hand: White Queen and Stroke of Midnight, which return ANY character to its owner's hand, and Koschei and Dracula, which return themselves.

### Freeze! and Dorothy: keywords explained {#keywords}

Hovering over them now explains the keywords they use, and they turn up in the collection's keyword search.

## Bug fixes {#bug-fixes}

### Heroic Charge {#heroic-charge}

Heroic Charge gives allies +2⚔️ and Trample this round. If a character it buffed loses its abilities, the +2⚔️ now stays; Trample is still removed.

### More than one Defender {#defenders}

When you have more than one Defender at a location and one of them is stunned, the other one now always defends instead.

## Locations now have a rarity {#locations}

Every location is now common, rare, very rare or ultra rare, and the rarity decides how often it shows up. The team puts it this way: expect the familiar ones in most matches, and a few you'll only see "once in a blue moon". The patch notes don't say which location has which rarity: the [Locations](/en/locations) page lists all the locations of the Demo 2.0 with their effects, and we'll add the rarity as soon as we know it.

## 13 languages in the game {#languages}

The game now supports 13 languages: English, French, Italian, German, Spanish (Spain), Japanese, Korean, Polish, Portuguese (Brazil), Portuguese (Portugal), Russian, Simplified Chinese and Spanish (Latin America). On 30 September the Steam page lists the same 13 for the interface, with full audio in English only.

## Boogeyman {#boogeyman}

The summary at the top of the patch notes says that "Twister Toss, Heroic Charge and Boogeyman now behave differently", but no line of the notes says what changes for Boogeyman. Its On Reveal ability destroys the ally at its location with the lowest Power, even itself. We'll update this article when the team explains it.

## What we don't know yet {#unknowns}

- Which location has which rarity.
- The new text of Twister Toss, and whether a swap counts as one move or two for Dorothy.
- What changes for Boogeyman.

## What changes on OriginsMeta {#on-the-site}

- The pages of Bagheera, Mind Palace and Spellbook show the new cost, and every card in the patch has the change in its balance history, with a link to the Steam post.
- The page of Twister Toss still shows the old text, with a warning, until we read the new one in the game.
- [MetaShifting](/en/metashifting) lists patch 0.7 at the top, and the [deck builder](/en/deck-builder) uses the new costs: Bagheera is now a 2-drop in the mana curve.
- Published decks keep their list, with the date they were created and the patch live that day; their mana curve uses the new costs. The deck guides with these cards are updated.

## Where these notes come from {#sources}

- The official Steam post of 29 September, "A small demo update is about to land!", published before the servers went down for the patch.
- The number 0.7 and the name Steam Demo Update #2 come from the official image of the update, the cover of this article. Some creators had called the 21 September update "patch 0.7": on this site that one stays "Demo · 21 Sep".`,
      `## L'ultima patch di bilanciamento prima della Crimson Cup {#crimson-cup}

"Questa è l'ULTIMA patch di bilanciamento prima del torneo", scrive il team. La Crimson Cup parte il 20 ottobre con la qualificazione EMEA, durante lo Steam Next Fest, e si gioca in Conquest a tre mazzi ([le regole](/it/news/crimson-cup-format-check-in)). Il 24 settembre il team aveva detto che l'ultima patch di bilanciamento sarebbe arrivata due settimane prima del festival: è arrivata il 29 settembre, tre settimane prima. Se il programma regge, sono questi i costi e le statistiche con cui si giocherà il torneo.

L'immagine ufficiale la chiama Steam Demo Update #2, versione 0.7: è il secondo aggiornamento della demo, dopo [quello del 21 settembre](/it/news/demo-patch-notes-0921).

## Tutte le modifiche di bilanciamento {#bilanciamento}

Formato: mana · Potenza/Salute per i personaggi, solo il mana per le magie.

| Carta | Prima | Dopo | Cosa cambia |
| --- | --- | --- | --- |
| Bagheera | 1 · 1/1 | 2 · 1/1 | costa 1 in più |
| Mind Palace | 2 | 3 | costa 1 in più |
| Spellbook | 3 | 4 | costa 1 in più; le sue magie casuali non possono più essere Spellbook |
| Twister Toss | 1 | 1 | rifatta: muove un alleato in qualsiasi spazio, scambiandolo con la carta che c'è già |

Nessuna Leggendaria cambia costo, statistiche o abilità: Dorothy riceve solo una spiegazione più chiara delle sue parole chiave.

## Twister Toss cambia effetto {#twister-toss}

Finora Twister Toss, una magia da 1 mana, faceva una cosa sola: muovere un alleato. Dopo il rework muove un alleato in qualsiasi spazio e, se lì c'è già un'altra carta, le due si scambiano di posto.

Ora può anche bersagliare spazi occupati. Il team fa due esempi:

- spostare un personaggio e riportarlo indietro nello stesso round;
- distruggere un tuo personaggio con Trash for Treasure e spostarne subito un altro nel suo spazio.

Su OriginsMeta Twister Toss è in tre mazzi pubblicati, fra cui il [Dorothy Combo](/it/guides/dorothy-combo-guide): Dorothy cresce ogni volta che un alleato si muove. Le patch notes non danno il testo nuovo della carta: la sua scheda mostra quello vecchio, con un avviso, finché non leggiamo il nuovo nel gioco.

## Tre carte costano 1 in più {#costi}

Fra i 35 mazzi pubblicati su OriginsMeta (conteggio delle 00:13 del 30 settembre, ora italiana), Mind Palace è in 22 e Spellbook in 17: sono le due carte più giocate del sito. Bagheera è in 13. La classifica completa è nelle [carte più giocate](/it/tier-list/most-played).

### Bagheera: 2 mana {#bagheera}

Bagheera resta un 1/1: la sua abilità Alla rivelazione gli dà +2⚔️/+2❤️ su uno spazio centrale. A 1 mana era un 3/3 già al primo round; ora scende al secondo round, non prima.

### Mind Palace: 3 mana {#mind-palace}

La magia che pesca 2 carte ora costa 3.

### Spellbook: 4 mana {#spellbook}

Per il resto della partita Spellbook aggiunge alla tua mano una magia casuale all'inizio di ogni round, da giocare prima del combattimento, altrimenti viene scartata. Ora costa 4, e le sue magie casuali non possono più essere Spellbook.

## Abilità cambiate e correzioni {#correzioni}

### Humpty e Spellbook non danno più sé stessi {#humpty-spellbook}

Le carte casuali che ti danno non possono più essere loro stesse. L'abilità Alla morte di Humpty aggiunge alla tua mano una carta casuale: non può più essere Humpty. La magia casuale che Spellbook aggiunge a ogni round non può più essere Spellbook.

### Mano piena: la carta riportata brucia {#mano-piena}

Quando una carta viene riportata in una mano già piena, ora brucia (va persa) invece di far fallire l'abilità. Fra le carte della Demo 2.0 riguarda quelle che riportano una carta in mano: White Queen e Stroke of Midnight, che riportano QUALSIASI personaggio nella mano del suo proprietario, e Koschei e Dracula, che tornano loro stessi in mano.

### Freeze! e Dorothy: parole chiave spiegate {#parole-chiave}

Al passaggio del mouse ora spiegano le parole chiave che usano, e compaiono nella ricerca per parola chiave della collezione.

## Correzioni di bug {#bug}

### Heroic Charge {#heroic-charge}

Heroic Charge dà agli alleati +2⚔️ e Travolgere in questo round. Se un personaggio che ha potenziato perde le abilità, il +2⚔️ ora resta; Travolgere viene comunque tolto.

### Più Difensori nello stesso luogo {#difensori}

Se hai più Difensori in un luogo e uno di loro è stordito, ora a difendere è sempre l'altro.

## I luoghi hanno una rarità {#luoghi}

Ogni luogo ora ha una rarità, comune, rara, molto rara o ultra rara, che decide quanto spesso compare. Il team la spiega così: quelli familiari si vedranno nella maggior parte delle partite, alcuni solo molto di rado. Le patch notes non dicono quale luogo ha quale rarità: la pagina dei [Luoghi](/it/locations) li elenca tutti con i loro effetti, e aggiungeremo la rarità appena la conosceremo.

## 13 lingue nel gioco {#lingue}

Il gioco ora supporta 13 lingue: inglese, francese, italiano, tedesco, spagnolo (Spagna), giapponese, coreano, polacco, portoghese (Brasile), portoghese (Portogallo), russo, cinese semplificato e spagnolo (America latina). Il 30 settembre la pagina Steam elenca le stesse 13 per l'interfaccia, con l'audio completo solo in inglese.

## Boogeyman {#boogeyman}

Il riassunto in cima alle patch notes dice che "Twister Toss, Heroic Charge e Boogeyman ora si comportano in modo diverso", ma nessuna riga delle note spiega che cosa cambia per Boogeyman. La sua abilità Alla rivelazione distrugge l'alleato nel suo luogo con la ⚔️ più bassa, anche sé stesso. Aggiorneremo l'articolo quando il team lo spiegherà.

## Cosa non sappiamo ancora {#cosa-non-sappiamo}

- Quale luogo ha quale rarità.
- Il testo nuovo di Twister Toss, e se per Dorothy uno scambio di posto conta come uno o due movimenti.
- Che cosa cambia per Boogeyman.

## Cosa cambia su OriginsMeta {#sul-sito}

- Le schede di Bagheera, Mind Palace e Spellbook mostrano il costo nuovo, e ogni carta della patch ha la modifica nello storico dei bilanciamenti, con il link al post su Steam.
- La scheda di Twister Toss mostra ancora il testo vecchio, con un avviso, finché non leggiamo il nuovo nel gioco.
- Il [MetaShifting](/it/metashifting) mette la patch 0.7 in cima, e il [deck builder](/it/deck-builder) usa i costi nuovi: Bagheera ora conta come carta da 2 nella curva di mana.
- I mazzi pubblicati tengono la loro lista, con la data in cui sono stati creati e la patch in vigore quel giorno; la loro curva di mana usa i costi nuovi. Le guide ai mazzi con queste carte sono aggiornate.

## Da dove arrivano queste note {#fonti}

- Il post ufficiale su Steam del 29 settembre, "A small demo update is about to land!", pubblicato prima che i server si fermassero per la patch.
- Il numero 0.7 e il nome Steam Demo Update #2 vengono dall'immagine ufficiale dell'aggiornamento, la copertina di questo articolo. Alcuni creator avevano chiamato "patch 0.7" l'aggiornamento del 21 settembre: sul sito quello resta "Demo · 21 set".`,
      `## El último parche de equilibrio antes de la Crimson Cup {#crimson-cup}

"Este es el ÚLTIMO parche de equilibrio antes del torneo", escribe el equipo. La Crimson Cup empieza el 20 de octubre con el clasificatorio EMEA, durante el Steam Next Fest, y se juega en Conquest con tres mazos ([las reglas](/es/news/crimson-cup-format-check-in)). El 24 de septiembre el equipo había dicho que el último parche de equilibrio llegaría dos semanas antes del festival: llegó el 29 de septiembre, tres semanas antes. Si el plan se mantiene, estos son los costes y las estadísticas con los que se jugará el torneo.

La imagen oficial lo llama Steam Demo Update #2, versión 0.7: es la segunda actualización de la demo, después de [la del 21 de septiembre](/es/news/demo-patch-notes-0921).

## Todos los cambios de equilibrio {#equilibrio}

Formato: maná · Poder/Salud para los personajes, solo el maná para los hechizos.

| Carta | Antes | Después | Qué cambia |
| --- | --- | --- | --- |
| Bagheera | 1 · 1/1 | 2 · 1/1 | cuesta 1 más |
| Mind Palace | 2 | 3 | cuesta 1 más |
| Spellbook | 3 | 4 | cuesta 1 más; sus hechizos aleatorios ya no pueden ser Spellbook |
| Twister Toss | 1 | 1 | rework: mueve a un aliado a cualquier espacio y lo intercambia con la carta que ya está allí |

Ninguna Legendaria cambia de coste, estadísticas ni habilidad: Dorothy solo recibe una explicación más clara de sus palabras clave.

## Rework de Twister Toss {#twister-toss}

Hasta ahora Twister Toss, un hechizo de coste 1, hacía una sola cosa: mover a un aliado. Tras el rework mueve a un aliado a cualquier espacio y, si ya hay otra carta allí, las dos intercambian sus posiciones.

Ahora también puede elegir como objetivo espacios ocupados. El equipo da dos ejemplos:

- mover a un personaje y devolverlo a su sitio en la misma ronda;
- destruir a tu personaje con Trash for Treasure y mover de inmediato a otro personaje a su espacio.

En OriginsMeta Twister Toss está en tres mazos publicados, entre ellos el [Dorothy Combo](/es/guides/dorothy-combo-guide): Dorothy crece cada vez que un aliado se mueve. Las notas del parche no dan el nuevo texto de la carta: su página muestra el antiguo, con un aviso, hasta que leamos el nuevo en el juego.

## Tres cartas cuestan 1 más {#costes}

De los 35 mazos publicados en OriginsMeta (recuento a las 00:13 CEST del 30 de septiembre), Mind Palace está en 22 y Spellbook en 17: son las dos cartas más jugadas del sitio. Bagheera está en 13. La clasificación completa está en [las cartas más jugadas](/es/tier-list/most-played).

### Bagheera: coste 2 {#bagheera}

Bagheera sigue siendo un 1/1 cuya habilidad Al revelar le da +2⚔️/+2❤️ en un espacio central. Con coste 1 era un 3/3 desde la primera ronda; ahora llega en la segunda ronda como pronto.

### Mind Palace: coste 3 {#mind-palace}

El hechizo que roba 2 cartas ahora cuesta 3.

### Spellbook: coste 4 {#spellbook}

Durante el resto de la partida, Spellbook añade un hechizo aleatorio a tu mano al comienzo de cada ronda, que debes jugar antes del combate o se descarta. Ahora cuesta 4, y sus hechizos aleatorios ya no pueden ser Spellbook.

## Cambios de habilidad y correcciones {#correcciones}

### Humpty y Spellbook ya no se dan a sí mismos {#humpty-spellbook}

Las cartas aleatorias que te dan ya no pueden ser ellas mismas. La habilidad Al morir de Humpty añade una carta aleatoria a tu mano: ya no puede ser Humpty. El hechizo aleatorio que Spellbook añade cada ronda ya no puede ser Spellbook.

### Mano llena: la carta devuelta se quema {#mano-llena}

Cuando una carta se devuelve a una mano que ya está llena, ahora se quema (se pierde) en lugar de que la habilidad falle. Entre las cartas de la Demo 2.0, afecta a las que devuelven una carta a la mano: White Queen y Stroke of Midnight, que devuelven a CUALQUIER personaje a la mano de su dueño, y Koschei y Dracula, que vuelven ellos mismos a la mano.

### Freeze! y Dorothy: palabras clave explicadas {#palabras-clave}

Al pasar el ratón por encima ahora explican las palabras clave que usan, y aparecen en la búsqueda por palabra clave de la colección.

## Corrección de errores {#errores}

### Heroic Charge {#heroic-charge}

Heroic Charge da a los aliados +2⚔️ y Arrollar esta ronda. Si un personaje al que ha potenciado pierde sus habilidades, el +2⚔️ ahora se mantiene; Arrollar se sigue quitando.

### Varios Defensores en la misma ubicación {#defensores}

Si tienes varios Defensores en una ubicación y uno de ellos está aturdido, ahora defiende siempre el otro.

## Las ubicaciones tienen rareza {#ubicaciones}

Cada ubicación es ahora común, rara, muy rara o ultra rara, y la rareza decide con qué frecuencia aparece. El equipo lo explica así: las conocidas saldrán en la mayoría de las partidas, y algunas solo muy de vez en cuando. Las notas del parche no dicen qué rareza tiene cada ubicación: la página de [Ubicaciones](/es/locations) las muestra todas con sus efectos, y añadiremos la rareza en cuanto la conozcamos.

## 13 idiomas en el juego {#idiomas}

El juego ahora admite 13 idiomas: inglés, francés, italiano, alemán, español (España), japonés, coreano, polaco, portugués (Brasil), portugués (Portugal), ruso, chino simplificado y español (Latinoamérica). El 30 de septiembre la página de Steam indica los mismos 13 para la interfaz, con audio completo solo en inglés.

## Boogeyman {#boogeyman}

El resumen al principio de las notas del parche dice que "Twister Toss, Heroic Charge y Boogeyman ahora se comportan de otra manera", pero ninguna línea de las notas explica qué cambia para Boogeyman. Su habilidad Al revelar destruye al aliado de su ubicación con menor ⚔️, incluso a sí mismo. Actualizaremos el artículo cuando el equipo lo explique.

## Lo que todavía no sabemos {#lo-que-no-sabemos}

- Qué rareza tiene cada ubicación.
- El nuevo texto de Twister Toss, y si para Dorothy un intercambio de posiciones cuenta como uno o dos movimientos.
- Qué cambia para Boogeyman.

## Qué cambia en OriginsMeta {#en-el-sitio}

- Las páginas de Bagheera, Mind Palace y Spellbook muestran el nuevo coste, y cada carta del parche tiene el cambio en su historial de equilibrio, con el enlace a la publicación de Steam.
- La página de Twister Toss sigue mostrando el texto antiguo, con un aviso, hasta que leamos el nuevo en el juego.
- [MetaShifting](/es/metashifting) pone el parche 0.7 arriba, y el [deck builder](/es/deck-builder) usa los nuevos costes: Bagheera ahora cuenta como carta de coste 2 en la curva de maná.
- Los mazos publicados conservan su lista, con la fecha en que se crearon y el parche vigente ese día; su curva de maná usa los nuevos costes. Las guías de mazos con estas cartas están actualizadas.

## De dónde vienen estas notas {#fuentes}

- La publicación oficial de Steam del 29 de septiembre, "A small demo update is about to land!", publicada antes de que los servidores se detuvieran para el parche.
- El número 0.7 y el nombre Steam Demo Update #2 vienen de la imagen oficial de la actualización, la portada de este artículo. Algunos creadores de contenido habían llamado "patch 0.7" a la actualización del 21 de septiembre: en este sitio esa sigue siendo "Demo · 21 sep".`,
    ),
    faq: {
      en: [
        {
          q: "What changed in Origins TCG patch 0.7?",
          a: "Twister Toss is reworked; Bagheera (1 → 2 mana), Mind Palace (2 → 3) and Spellbook (3 → 4) cost 1 more; locations now have a rarity that decides how often they show up; Humpty and Spellbook can no longer give themselves; a card returned to a full hand now burns; Heroic Charge and multiple Defenders are fixed; the game supports 13 languages.",
        },
        {
          q: "Is patch 0.7 the last balance patch before the Crimson Cup?",
          a: "Yes: the team calls it the final balance patch before the tournament. It came out on 29 September 2026; the Crimson Cup starts on 20 October with the EMEA qualifier, during Steam Next Fest.",
        },
        {
          q: "How does Twister Toss work after patch 0.7?",
          a: "It still costs 1 mana. It moves an ally to any space, and if another card is already there, the two swap places. It can also target occupied spaces: you can move a character away and back in the same round, or destroy one with Trash for Treasure and move another into its space.",
        },
      ],
      it: [
        {
          q: "Cosa cambia con la patch 0.7 di Origins TCG?",
          a: "Twister Toss cambia effetto; Bagheera (da 1 a 2 mana), Mind Palace (da 2 a 3) e Spellbook (da 3 a 4) costano 1 in più; i luoghi hanno una rarità che decide quanto spesso compaiono; Humpty e Spellbook non possono più dare sé stessi; una carta riportata in una mano piena ora brucia; si correggono Heroic Charge e i Difensori multipli; il gioco supporta 13 lingue.",
        },
        {
          q: "La patch 0.7 è l'ultima di bilanciamento prima della Crimson Cup?",
          a: "Sì: il team la chiama l'ultima patch di bilanciamento prima del torneo. È uscita il 29 settembre 2026; la Crimson Cup parte il 20 ottobre con la qualificazione EMEA, durante lo Steam Next Fest.",
        },
        {
          q: "Come funziona Twister Toss dopo la patch 0.7?",
          a: "Costa sempre 1 mana. Muove un alleato in qualsiasi spazio e, se lì c'è già un'altra carta, le due si scambiano di posto. Può anche bersagliare spazi occupati: puoi spostare un personaggio e riportarlo indietro nello stesso round, oppure distruggerne uno con Trash for Treasure e spostarne un altro nel suo spazio.",
        },
      ],
      es: [
        {
          q: "¿Qué cambia con el parche 0.7 de Origins TCG?",
          a: "Twister Toss recibe un rework; Bagheera (de 1 a 2 de maná), Mind Palace (de 2 a 3) y Spellbook (de 3 a 4) cuestan 1 más; las ubicaciones tienen una rareza que decide con qué frecuencia aparecen; Humpty y Spellbook ya no pueden darse a sí mismos; una carta devuelta a una mano llena ahora se quema; se corrigen Heroic Charge y los Defensores múltiples; el juego admite 13 idiomas.",
        },
        {
          q: "¿El parche 0.7 es el último de equilibrio antes de la Crimson Cup?",
          a: "Sí: el equipo lo llama el último parche de equilibrio antes del torneo. Salió el 29 de septiembre de 2026; la Crimson Cup empieza el 20 de octubre con el clasificatorio EMEA, durante el Steam Next Fest.",
        },
        {
          q: "¿Cómo funciona Twister Toss después del parche 0.7?",
          a: "Sigue costando 1 de maná. Mueve a un aliado a cualquier espacio y, si ya hay otra carta allí, las dos intercambian sus posiciones. También puede elegir como objetivo espacios ocupados: puedes mover a un personaje y devolverlo a su sitio en la misma ronda, o destruir a uno con Trash for Treasure y mover a otro a su espacio.",
        },
      ],
    },
    url: "https://store.steampowered.com/news/app/4429430/view/1844751498235283",
    source: "steam",
  },
  {
    // Terza news "Upgrade Meta" (richiesta di Pierluigi del 29/09/2026: "una newsletter con tutte le novità sviluppate sul
    // sito questa settimana", poi "rimuovi la parte del sito in spagnolo che abbiamo già annunciato"): solo quello che le
    // news del 24 e del 25/9 non raccontano (niente spagnolo, ricerca nel testo, tier list rifatta, Luoghi, Discord). La
    // sezione creator chiude con l'invito a scrivere a Pierluigi su Discord per diventare Creator (sua richiesta).
    // Permessi dei ruoli come in src/lib/community/badges.ts; copertina: key art ufficiale di Red, mai usata da altre news.
    slug: "upgrade-meta-0929",
    image: "/media/keyart-red-wide.webp",
    guides: ["origins-tcg-legendaries", "origins-tcg-ranked", "origins-tcg-conquest", "origins-tcg-kickstarter"],
    date: "2026-09-29",
    title: n(
      "Upgrade Meta: creator tools, follows and notifications, community guides and comics",
      "Upgrade Meta: strumenti per i creator, Segui e notifiche, guide della community e fumetti",
      "Upgrade Meta: herramientas para creadores, seguir y notificaciones, guías de la comunidad y cómics",
    ),
    metaTitle: n("Upgrade Meta: Origins TCG creator tools on OriginsMeta", "Upgrade Meta: gli strumenti per i creator", "Upgrade Meta: herramientas para creadores"),
    description: n(
      "New on OriginsMeta: creator profiles and directory, stream tools with !deck and an OBS overlay, follows, community guides and comics. Become a Creator.",
      "Novità su OriginsMeta: profili e directory dei creator, !deck e overlay per OBS nelle dirette, Segui, guide della community e fumetti. Diventa Creator.",
      "Novedades en OriginsMeta: perfiles y directorio de creadores, !deck y overlay para OBS en directo, seguir, guías de la comunidad y cómics. Hazte Creator.",
    ),
    summary: n(
      "This week OriginsMeta got a whole section for the people who make content about Origins TCG: showcase profiles, the creators directory, tools for streams, deck stats, community guides and comics published straight on the site. You can now follow your favourite players and get notified when they publish or go live. Want to become a Creator? Write to Pierluigi on our Discord.",
      "Questa settimana OriginsMeta ha una sezione tutta per chi crea contenuti su Origins TCG: profili vetrina, la directory dei creator, strumenti per le dirette, statistiche dei mazzi, guide della community e fumetti pubblicati direttamente sul sito. Ora puoi anche seguire i tuoi giocatori preferiti e ricevere un avviso quando pubblicano o vanno in diretta. Vuoi diventare Creator? Scrivi a Pierluigi sul nostro Discord.",
      "Esta semana OriginsMeta estrena una sección para quienes crean contenido sobre Origins TCG: perfiles escaparate, el directorio de creadores, herramientas para directos, estadísticas de los mazos, guías de la comunidad y cómics publicados directamente en el sitio. Ahora también puedes seguir a tus jugadores favoritos y recibir un aviso cuando publican o empiezan un directo. ¿Quieres ser Creator? Escribe a Pierluigi en nuestro Discord.",
    ),
    highlights: {
      en: [
        { label: "Creator profiles", text: "a showcase page, the short link originsmeta.com/@name and the creators directory", anchor: "profiles" },
        { label: "Stream tools", text: "the !deck chat command, an OBS overlay, the deck image and the LIVE badge", anchor: "streams" },
        { label: "Publish more", text: "videos and links on decks, deck stats, Legendary artwork, guides, comics and tournaments", anchor: "publish" },
        { label: "Become a Creator", text: "write to Pierluigi on our Discord", anchor: "become-a-creator" },
        { label: "Follow and notifications", text: "decks, guides, comics and streams from the profiles you follow", anchor: "follow" },
        { label: "Roles and achievements", text: "Staff, Creator, Author, Pro and Community, achievements on every profile, messages to the staff", anchor: "roles" },
        { label: "Decks, tier lists and guides", text: "the best decks right now, signed tier lists, three new guides and the Kickstarter date", anchor: "decks-guides" },
      ],
      it: [
        { label: "Profili dei creator", text: "una pagina vetrina, il link breve originsmeta.com/@nome e la directory dei creator", anchor: "profili" },
        { label: "Strumenti per le dirette", text: "il comando !deck in chat, l'overlay per OBS, l'immagine del mazzo e il bollino LIVE", anchor: "dirette" },
        { label: "Pubblica di più", text: "video e link nei mazzi, statistiche, artwork della Leggendaria, guide, fumetti e tornei", anchor: "pubblica" },
        { label: "Diventa Creator", text: "scrivi a Pierluigi sul nostro Discord", anchor: "diventa-creator" },
        { label: "Segui e notifiche", text: "mazzi, guide, fumetti e dirette dei profili che segui", anchor: "segui" },
        { label: "Ruoli e traguardi", text: "Staff, Creator, Autore, Pro e Community, traguardi su ogni profilo, messaggi allo staff", anchor: "ruoli" },
        { label: "Mazzi, tier list e guide", text: "i migliori mazzi del momento, le tier list firmate, tre guide nuove e la data del Kickstarter", anchor: "mazzi-guide" },
      ],
      es: [
        { label: "Perfiles de creadores", text: "una página escaparate, el enlace corto originsmeta.com/@nombre y el directorio de creadores", anchor: "perfiles" },
        { label: "Herramientas para directos", text: "el comando !deck en el chat, un overlay para OBS, la imagen del mazo y la etiqueta LIVE", anchor: "directos" },
        { label: "Publica más", text: "vídeos y enlaces en los mazos, estadísticas, artwork de la Legendaria, guías, cómics y torneos", anchor: "publica" },
        { label: "Hazte Creator", text: "escribe a Pierluigi en nuestro Discord", anchor: "hazte-creator" },
        { label: "Seguir y notificaciones", text: "mazos, guías, cómics y directos de los perfiles que sigues", anchor: "seguir" },
        { label: "Roles y logros", text: "Staff, Creator, Autor, Pro y Community, logros en cada perfil, mensajes al staff", anchor: "roles" },
        { label: "Mazos, tier lists y guías", text: "los mejores mazos del momento, tier lists firmadas, tres guías nuevas y la fecha del Kickstarter", anchor: "mazos-guias" },
      ],
    },
    body: n(
      `## Creator profiles {#profiles}

If you make content about Origins TCG (streams, videos, guides, decks), OriginsMeta now has a place for you. Profiles with the Creator, Author, Pro or Staff role get a **showcase page**: a cover (one of 8 backgrounds or your own image), a bigger photo, an accent colour, a short tagline, your favourite Legendary, a featured deck and a featured video, your stream schedule (shown in each visitor's time zone), plus your bio, channels and the languages you create in. Everyone can upload a profile photo.

Every profile also has a **short link** to share: originsmeta.com/@yourname. And the [Creators and authors](/en/creators) page gathers everyone with one of these roles who has filled in a bio or a channel, with filters by role, language and platform.

## Stream tools {#streams}

- **The \`!deck\` chat command**: add it to Nightbot, StreamElements or Fossabot and your chat gets your latest published deck, with its Legendary, the link and the game code.
- **An OBS overlay** that shows your deck on stream, vertical or horizontal, and updates by itself when you publish a new one.
- **The deck image**, ready for social posts, 16:9 thumbnails and 9:16 stories.
- **The LIVE badge**: when you're streaming Origins TCG on Twitch, it appears next to your name on decks, profiles and in the directory. The [Live](/en/live) page shows who's streaming right now, and the calendar strip at the top says "Live now".

You'll find everything under "For streamers" on the page of each of your decks.

## Publish more {#publish}

- **Videos and links on decks**: up to 3 YouTube or Twitch videos and 5 links on every deck, with a player that loads only when you click.
- **Deck stats**: in your account you see views, game code copies, link clicks and video plays for each of your decks, over 7 days, 30 days and in total. Only you and the staff see them.
- **Legendary artwork**: Creators can put their own artwork of the Legendary on their decks. The official card stays on the card page.
- **Community guides**: Authors, Creators, Pro players and Staff publish guides straight on the site, translated automatically into the other two languages. Everyone else can still [send us a guide](/en/guides/submit).
- **Comics**: Creators publish their comics among the news, with the text translated automatically.
- **Tournaments**: Creators, Pro players and Staff can put their public tournaments on the calendar, with their own cover.

## Become a Creator {#become-a-creator}

The Creator role is assigned by the OriginsMeta staff. If you make content about Origins TCG and want to become a Creator, **write to Pierluigi on [our Discord](https://discord.gg/RAG7nnrNGP)**.

## Follow and notifications {#follow}

With an account you can **follow** the profiles with the Creator, Author, Pro or Staff role. When they publish a deck, a guide or a comic, or go live on Twitch, you get a notification in the envelope at the top of the site. You'll find the profiles you follow in [your account](/en/account). Notifications stay on the site: no emails.

## Roles and achievements {#roles}

- **Five roles**, with their tag next to the name: Staff, Creator, Author, Pro and Community.
- **Achievements** on every profile, such as First deck, Crowd favorite, Deck of the month and Tournament won.
- **Messages to the staff**: from your account you can write to us and read our replies, feedback included.

## Decks, tier lists and guides {#decks-guides}

- In [Decks](/en/decks), the best Origins TCG decks right now, ranked by the community's votes.
- In the [community tier list](/en/tier-list/community), the tier lists signed by Staff, Creators, Authors and Pro players.
- Tier lists, cards, decks and the deck builder now start with the content, with more compact titles.
- Three new guides: [the 11 Legendaries](/en/guides/origins-tcg-legendaries), [ranked](/en/guides/origins-tcg-ranked) and [Conquest](/en/guides/origins-tcg-conquest).
- The [Kickstarter guide](/en/guides/origins-tcg-kickstarter) has the date confirmed by Koin Games' CEO: 27 October.

## Join in {#join}

[Sign up](/en/login) for free with Discord or your email, publish your decks and follow the players you like. And [join our Discord](https://discord.gg/RAG7nnrNGP): everything that goes live on the site gets posted there.`,
      `## Profili dei creator {#profili}

Se crei contenuti su Origins TCG (dirette, video, guide, mazzi), OriginsMeta ora ha un posto per te. I profili con il ruolo Creator, Autore, Pro o Staff hanno una **pagina vetrina**: copertina (uno degli 8 sfondi o un'immagine tua), foto più grande, colore d'accento, una frase breve, la Leggendaria del cuore, un mazzo e un video in evidenza, gli orari delle dirette (nel fuso orario di chi guarda), più bio, canali e lingue in cui crei. La foto del profilo la può caricare chiunque.

Ogni profilo ha anche un **link breve** da condividere: originsmeta.com/@tuonome. E la pagina [Creator e autori](/it/creators) raccoglie tutti quelli con uno di questi ruoli che hanno scritto una bio o aggiunto un canale, con i filtri per ruolo, lingua e piattaforma.

## Strumenti per le dirette {#dirette}

- **Il comando \`!deck\` in chat**: aggiungilo a Nightbot, StreamElements o Fossabot e la tua chat riceve l'ultimo mazzo che hai pubblicato, con la Leggendaria, il link e il codice del gioco.
- **Un overlay per OBS** che mostra il tuo mazzo in diretta, verticale od orizzontale, e si aggiorna da solo quando ne pubblichi uno nuovo.
- **L'immagine del mazzo**, pronta per i social, le miniature 16:9 e le storie 9:16.
- **Il bollino LIVE**: quando trasmetti Origins TCG su Twitch compare accanto al tuo nome nei mazzi, nei profili e nella directory. La pagina [Live](/it/live) mostra chi è in diretta adesso, e la striscia del calendario in alto dice "Ora live".

Trovi tutto sotto "Per le dirette" nella pagina di ogni tuo mazzo.

## Pubblica di più {#pubblica}

- **Video e link nei mazzi**: fino a 3 video di YouTube o Twitch e 5 link su ogni mazzo, con un lettore che si carica solo al clic.
- **Statistiche dei mazzi**: nel tuo account vedi visite, copie del codice, clic sui link e video visti di ogni tuo mazzo, negli ultimi 7 giorni, 30 giorni e in totale. Le vedete solo tu e lo staff.
- **Artwork della Leggendaria**: i Creator possono mettere sui loro mazzi un artwork proprio della Leggendaria. La carta ufficiale resta nella sua scheda.
- **Guide della community**: Autori, Creator, Pro e Staff pubblicano le guide direttamente sul sito, tradotte in automatico nelle altre due lingue. Tutti gli altri possono sempre [mandarci una guida](/it/guides/submit).
- **Fumetti**: i Creator pubblicano i loro fumetti fra le news, con i testi tradotti in automatico.
- **Tornei**: Creator, Pro e Staff mettono i loro tornei pubblici nel calendario, con una copertina propria.

## Diventa Creator {#diventa-creator}

Il ruolo Creator lo assegna lo staff di OriginsMeta. Se crei contenuti su Origins TCG e vuoi diventare Creator, **scrivi a Pierluigi sul [nostro Discord](https://discord.gg/RAG7nnrNGP)**.

## Segui e notifiche {#segui}

Con un account puoi **seguire** i profili con il ruolo Creator, Autore, Pro o Staff. Quando pubblicano un mazzo, una guida o un fumetto, o vanno in diretta su Twitch, ricevi un avviso nella busta in alto nel sito. I profili che segui li trovi nel [tuo account](/it/account). Le notifiche restano sul sito: niente email.

## Ruoli e traguardi {#ruoli}

- **Cinque ruoli**, con il tag accanto al nome: Staff, Creator, Autore, Pro e Community.
- **Traguardi** su ogni profilo, come Primo mazzo, Mazzo apprezzato, Mazzo del mese e Torneo vinto.
- **Messaggi allo staff**: dal tuo account puoi scriverci e leggere le nostre risposte, anche ai feedback.

## Mazzi, tier list e guide {#mazzi-guide}

- In [Mazzi](/it/decks), i migliori mazzi di Origins TCG del momento, in ordine di voto della community.
- Nella [tier list della community](/it/tier-list/community), le tier list firmate da Staff, Creator, Autori e Pro.
- Tier list, carte, mazzi e deck builder ora partono dai contenuti, con titoli più compatti.
- Tre guide nuove: [le 11 Leggendarie](/it/guides/origins-tcg-legendaries), [la classificata](/it/guides/origins-tcg-ranked) e [il Conquest](/it/guides/origins-tcg-conquest).
- La [guida al Kickstarter](/it/guides/origins-tcg-kickstarter) ha la data confermata dal CEO di Koin Games: il 27 ottobre.

## Partecipa {#partecipa}

[Iscriviti](/it/login) gratis con Discord o con la tua email, pubblica i tuoi mazzi e segui i giocatori che ti piacciono. E [entra nel nostro Discord](https://discord.gg/RAG7nnrNGP): tutto quello che esce sul sito arriva anche lì.`,
      `## Perfiles de creadores {#perfiles}

Si creas contenido sobre Origins TCG (directos, vídeos, guías, mazos), OriginsMeta ahora tiene un lugar para ti. Los perfiles con el rol Creator, Autor, Pro o Staff tienen una **página escaparate**: portada (uno de los 8 fondos o una imagen propia), foto más grande, color de acento, una frase breve, tu Legendaria favorita, un mazo y un vídeo destacados, el horario de tus directos (en la zona horaria de quien lo mira), además de tu biografía, tus canales y los idiomas en los que creas. Cualquier persona puede subir su foto de perfil.

Cada perfil tiene también un **enlace corto** para compartir: originsmeta.com/@tunombre. Y la página [Creadores y autores](/es/creators) reúne a todas las personas con uno de estos roles que han escrito una biografía o añadido un canal, con filtros por rol, idioma y plataforma.

## Herramientas para directos {#directos}

- **El comando \`!deck\` en el chat**: añádelo a Nightbot, StreamElements o Fossabot y tu chat recibe el último mazo que publicaste, con su Legendaria, el enlace y el código del juego.
- **Un overlay para OBS** que muestra tu mazo en directo, en vertical u horizontal, y se actualiza solo cuando publicas uno nuevo.
- **La imagen del mazo**, lista para redes sociales, miniaturas 16:9 e historias 9:16.
- **La etiqueta LIVE**: cuando transmites Origins TCG en Twitch aparece junto a tu nombre en los mazos, los perfiles y el directorio. La página [Live](/es/live) muestra quién está en directo ahora, y la franja del calendario de arriba dice "En directo".

Lo encontrarás todo en "Para directos", en la página de cada uno de tus mazos.

## Publica más {#publica}

- **Vídeos y enlaces en los mazos**: hasta 3 vídeos de YouTube o Twitch y 5 enlaces en cada mazo, con un reproductor que solo se carga al hacer clic.
- **Estadísticas de los mazos**: en tu cuenta ves las visitas, las copias del código, los clics en los enlaces y las reproducciones de vídeo de cada uno de tus mazos, en los últimos 7 días, 30 días y en total. Solo las ves tú y el staff.
- **Artwork de la Legendaria**: los Creators pueden poner en sus mazos un artwork propio de la Legendaria. La carta oficial sigue en su ficha.
- **Guías de la comunidad**: Autores, Creators, Pro y Staff publican guías directamente en el sitio, traducidas automáticamente a los otros dos idiomas. Los demás pueden seguir [enviándonos una guía](/es/guides/submit).
- **Cómics**: los Creators publican sus cómics entre las noticias, con los textos traducidos automáticamente.
- **Torneos**: Creators, Pro y Staff ponen sus torneos públicos en el calendario, con una portada propia.

## Hazte Creator {#hazte-creator}

El rol Creator lo asigna el staff de OriginsMeta. Si creas contenido sobre Origins TCG y quieres ser Creator, **escribe a Pierluigi en [nuestro Discord](https://discord.gg/RAG7nnrNGP)**.

## Seguir y notificaciones {#seguir}

Con una cuenta puedes **seguir** los perfiles con el rol Creator, Autor, Pro o Staff. Cuando publican un mazo, una guía o un cómic, o empiezan un directo en Twitch, recibes un aviso en el sobre de la parte superior del sitio. Los perfiles que sigues están en [tu cuenta](/es/account). Las notificaciones se quedan en el sitio: nada de correos.

## Roles y logros {#roles}

- **Cinco roles**, con su etiqueta junto al nombre: Staff, Creator, Autor, Pro y Community.
- **Logros** en cada perfil, como Primer mazo, Mazo favorito, Mazo del mes y Torneo ganado.
- **Mensajes al staff**: desde tu cuenta puedes escribirnos y leer nuestras respuestas, también a tus comentarios.

## Mazos, tier lists y guías {#mazos-guias}

- En [Mazos](/es/decks), los mejores mazos de Origins TCG del momento, ordenados por los votos de la comunidad.
- En la [tier list de la comunidad](/es/tier-list/community), las tier lists firmadas por Staff, Creators, Autores y Pro.
- Las tier lists, las cartas, los mazos y el deck builder ahora empiezan por el contenido, con títulos más compactos.
- Tres guías nuevas: [las 11 Legendarias](/es/guides/origins-tcg-legendaries), [la clasificatoria](/es/guides/origins-tcg-ranked) y [el Conquest](/es/guides/origins-tcg-conquest).
- La [guía del Kickstarter](/es/guides/origins-tcg-kickstarter) tiene la fecha confirmada por el CEO de Koin Games: el 27 de octubre.

## Participa {#participa}

[Regístrate](/es/login) gratis con Discord o con tu correo electrónico, publica tus mazos y sigue a los jugadores que te gustan. Y [únete a nuestro Discord](https://discord.gg/RAG7nnrNGP): todo lo que se publica en el sitio llega también allí.`,
    ),
    faq: {
      en: [
        {
          q: "How do I become a Creator on OriginsMeta?",
          a: "The Creator role is assigned by the staff: if you make content about Origins TCG, write to Pierluigi on the OriginsMeta Discord (discord.gg/RAG7nnrNGP).",
        },
        {
          q: "How do I show my deck on stream?",
          a: "Open the page of your deck and go to \"For streamers\": you'll find the !deck chat command for Nightbot, StreamElements or Fossabot, the OBS overlay and the deck image.",
        },
        {
          q: "Who can I follow on OriginsMeta?",
          a: "With an account you can follow the profiles with the Creator, Author, Pro or Staff role and get a notification on the site when they publish a deck, a guide or a comic, or go live on Twitch.",
        },
      ],
      it: [
        {
          q: "Come si diventa Creator su OriginsMeta?",
          a: "Il ruolo Creator lo assegna lo staff: se crei contenuti su Origins TCG, scrivi a Pierluigi sul Discord di OriginsMeta (discord.gg/RAG7nnrNGP).",
        },
        {
          q: "Come mostro il mio mazzo in diretta?",
          a: "Apri la pagina del tuo mazzo e vai su \"Per le dirette\": trovi il comando !deck per Nightbot, StreamElements o Fossabot, l'overlay per OBS e l'immagine del mazzo.",
        },
        {
          q: "Chi posso seguire su OriginsMeta?",
          a: "Con un account puoi seguire i profili con il ruolo Creator, Autore, Pro o Staff e ricevere un avviso sul sito quando pubblicano un mazzo, una guida o un fumetto, o vanno in diretta su Twitch.",
        },
      ],
      es: [
        {
          q: "¿Cómo me hago Creator en OriginsMeta?",
          a: "El rol Creator lo asigna el staff: si creas contenido sobre Origins TCG, escribe a Pierluigi en el Discord de OriginsMeta (discord.gg/RAG7nnrNGP).",
        },
        {
          q: "¿Cómo muestro mi mazo en directo?",
          a: "Abre la página de tu mazo y ve a \"Para directos\": encontrarás el comando !deck para Nightbot, StreamElements o Fossabot, el overlay para OBS y la imagen del mazo.",
        },
        {
          q: "¿A quién puedo seguir en OriginsMeta?",
          a: "Con una cuenta puedes seguir los perfiles con el rol Creator, Autor, Pro o Staff y recibir un aviso en el sitio cuando publican un mazo, una guía o un cómic, o empiezan un directo en Twitch.",
        },
      ],
    },
    url: "/creators",
    source: "site",
  },
  {
    // Seconda news "Upgrade Meta" (richiesta di Pierluigi del 25/09/2026): lo spagnolo, i testi ufficiali delle carte
    // nelle tre lingue, due anticipazioni (l'overlay, uno strumento di gioco per tutti, volutamente vago per scelta di Pierluigi, e il
    // mazzo della settimana), il grazie alla community e i link per partecipare.
    slug: "upgrade-meta-0925",
    image: "/media/keyart-queen-of-hearts-wide.webp",
    guides: ["play-the-demo", "origins-tcg-explained"],
    date: "2026-09-25",
    title: n(
      "Upgrade Meta: OriginsMeta speaks Spanish, every card in three languages and what's coming next",
      "Upgrade Meta: OriginsMeta parla spagnolo, tutte le carte in tre lingue e le prossime novità",
      "Upgrade Meta: OriginsMeta habla español, todas las cartas en tres idiomas y lo que viene",
    ),
    metaTitle: n("Upgrade Meta: OriginsMeta for Origins TCG, now in Spanish", "Upgrade Meta: OriginsMeta per Origins TCG ora in spagnolo", "Upgrade Meta: OriginsMeta para Origins TCG, ya en español"),
    description: n(
      "OriginsMeta is now in Spanish too, and every Demo 2.0 card has the game's official text in three languages. Plus a first look at what we're building next.",
      "OriginsMeta ora è anche in spagnolo, e ogni carta della Demo 2.0 ha il testo ufficiale del gioco in tre lingue. E un primo sguardo a cosa stiamo preparando.",
      "OriginsMeta ya está en español, y cada carta de la Demo 2.0 tiene el texto oficial del juego en tres idiomas. Además, un vistazo a lo que estamos preparando.",
    ),
    summary: n(
      "OriginsMeta now speaks Spanish too, and every Demo 2.0 card shows the game's official text in English, Italian and Spanish. We're also working on an overlay, a game tool for every player, and on ways to reward what you create: the first idea is a deck of the week chosen by your votes. Thank you for your support: at the end of the article you'll find everything you need to join in.",
      "OriginsMeta ora parla anche spagnolo, e ogni carta della Demo 2.0 mostra il testo ufficiale del gioco in inglese, italiano e spagnolo. Stiamo lavorando a un overlay, uno strumento di gioco per tutti, e a un modo per premiare quello che create: la prima idea è un mazzo della settimana scelto con i vostri voti. Grazie del sostegno: in fondo all'articolo trovate tutto quello che serve per partecipare.",
      "OriginsMeta ya habla español, y cada carta de la Demo 2.0 muestra el texto oficial del juego en inglés, italiano y español. También estamos trabajando en un overlay, una herramienta de juego para todos, y en formas de premiar tus creaciones: la primera idea es un mazo de la semana elegido con los votos de la comunidad. Gracias por el apoyo: al final del artículo tienes todo lo necesario para participar.",
    ),
    highlights: {
      en: [
        { label: "Spanish is here", text: "the whole site, guides and news included, and community deck guides translated automatically", anchor: "spanish" },
        { label: "Every card, three languages", text: "the game's official Italian and Spanish text, checked on all 122 Demo 2.0 cards", anchor: "cards" },
        { label: "An overlay for everyone", text: "a game tool for every player, in the works: we'll show it when it's ready", anchor: "overlay" },
        { label: "Deck of the week", text: "chosen by your votes: our first idea to reward what you create", anchor: "deck-of-the-week" },
        { label: "Thank you", text: "to everyone who signed up, published decks, voted and wrote to us", anchor: "thanks" },
        { label: "Join in", text: "sign up, build a deck, make your tier list, come to our Discord", anchor: "join" },
      ],
      it: [
        { label: "Lo spagnolo è arrivato", text: "tutto il sito, guide e news comprese, e le guide dei mazzi della community tradotte in automatico", anchor: "spagnolo" },
        { label: "Ogni carta in tre lingue", text: "i testi ufficiali italiani e spagnoli del gioco, controllati su tutte le 122 carte della Demo 2.0", anchor: "carte" },
        { label: "Un overlay per tutti", text: "uno strumento di gioco per tutti i giocatori, a cui stiamo lavorando: lo mostriamo quando è pronto", anchor: "overlay" },
        { label: "Il mazzo della settimana", text: "scelto con i vostri voti: la prima idea per premiare quello che create", anchor: "mazzo-della-settimana" },
        { label: "Grazie", text: "a chi si è iscritto, ha pubblicato, ha votato e ci ha scritto", anchor: "grazie" },
        { label: "Partecipa", text: "iscriviti, costruisci un mazzo, crea la tua tier list, vieni sul nostro Discord", anchor: "partecipa" },
      ],
      es: [
        { label: "Llega el español", text: "todo el sitio, guías y noticias incluidas, y las guías de los mazos de la comunidad traducidas automáticamente", anchor: "espanol" },
        { label: "Cada carta, en tres idiomas", text: "el texto oficial del juego en italiano y en español, revisado en las 122 cartas de la Demo 2.0", anchor: "cartas" },
        { label: "Un overlay para todos", text: "una herramienta de juego para todos los jugadores, en la que estamos trabajando: la mostraremos cuando esté lista", anchor: "overlay" },
        { label: "El mazo de la semana", text: "elegido con los votos de la comunidad: nuestra primera idea para premiar tus creaciones", anchor: "mazo-de-la-semana" },
        { label: "Gracias", text: "a quienes se registraron, publicaron, votaron y nos escribieron", anchor: "gracias" },
        { label: "Participa", text: "regístrate, construye un mazo, crea tu tier list y únete a nuestro Discord", anchor: "participa" },
      ],
    },
    body: n(
      `## Spanish is here {#spanish}

As of 25 September 2026, OriginsMeta is also in Spanish: cards, decks, guides, news, tier lists, the deck builder and tournaments. Switch language with EN · IT · ES at the top of every page (on a phone, inside Menu). We write in neutral Spanish, for players in Spain and Latin America, and card names stay in English, as in the game.

Community decks speak every language too: the author writes the guide in their own language, the site translates it into the other two, says so on the page and links to the original. A deck published in Italian can now be read in English and Spanish too.

## Every card, three languages {#cards}

On 25 September we opened the demo in Spanish and in Italian and read the 122 cards of the collection one by one. The Italian and Spanish texts you now find in the [card list](/en/cards) are the game's official ones: 101 Spanish and 88 Italian texts were different from our translations, and they have been replaced.

The keywords use the game's official terms too: On Reveal is "Alla rivelazione" in Italian and "Al revelar" in Spanish. On the Italian and Spanish pages you'll find the same terms in the keyword tags on each card's page, in the guides and in the news. Created cards and removed cards don't appear in the game's collection, and we haven't checked the [Locations](/en/locations) in the game yet: their Italian and Spanish text is ours, written with the game's glossary.

## An overlay for everyone {#overlay}

We're working on an overlay: a game tool for every Origins TCG player, not just for those who stream. We'd rather show it than describe it: we'll tell you more as soon as we have something worth seeing.

## Deck of the week {#deck-of-the-week}

We want to reward the people who create, and give more visibility to your decks, guides and tier lists. The first idea is a deck of the week, chosen by your star ratings. In the meantime, if you try a community deck, rate it: the top-rated decks already show up on the [tier list](/en/tier-list).

## Thank you {#thanks}

OriginsMeta went online on 15 September. In ten days you signed up, published decks, voted and wrote to us with ideas and corrections, and several recent changes started with your messages. Thank you: this site grows with you.

## Join in {#join}

- [Sign up](/en/login): free, with Discord or with your email, no password needed. With an account you can publish your decks, vote and save your tier lists.
- [Build a deck](/en/deck-builder): free, even without an account. Copy the game code or, with an account, publish the deck on the site with your guide.
- [Make your tier list](/en/tier-list/create) and see the [community tier list](/en/tier-list/community), which becomes a real ranking once 5 lists are saved.
- [Join our Discord](https://discord.gg/RAG7nnrNGP): new articles and guides arrive there as soon as they go live. The [official Origins TCG Discord](https://discord.gg/originstcg) is Koin Games' server, for announcements and tournament sign-ups.`,
      `## Lo spagnolo è arrivato {#spagnolo}

Dal 25 settembre 2026 OriginsMeta è anche in spagnolo: carte, mazzi, guide, news, tier list, deck builder e tornei. La lingua si cambia con EN · IT · ES in alto su ogni pagina (sul telefono dentro Menu). È uno spagnolo neutro, per chi gioca in Spagna e in America Latina, e i nomi delle carte restano in inglese, come nel gioco.

Anche i mazzi della community parlano tre lingue: l'autore scrive la guida nella sua lingua, il sito la traduce nelle altre due, lo segnala sulla pagina e mette il link all'originale. Un mazzo pubblicato in italiano ora si legge anche in inglese e in spagnolo.

## Ogni carta in tre lingue {#carte}

Il 25 settembre abbiamo aperto la demo in spagnolo e in italiano e letto una per una le 122 carte della collezione. I testi italiani e spagnoli che trovi nella [lista carte](/it/cards) sono quelli ufficiali del gioco: 101 testi spagnoli e 88 italiani erano diversi dalle nostre traduzioni e sono stati sostituiti.

Anche le parole chiave usano i termini ufficiali del gioco: On Reveal in italiano è "Alla rivelazione", in spagnolo "Al revelar". Gli stessi termini li trovi nelle etichette delle parole chiave nella pagina di ogni carta, nelle guide e nelle news. Le carte generate e le carte rimosse non compaiono nella collezione del gioco, e i [Luoghi](/it/locations) non li abbiamo ancora confrontati nel gioco: il loro testo italiano e spagnolo lo scriviamo noi, con il glossario del gioco.

## Un overlay per tutti {#overlay}

Stiamo lavorando a un overlay: uno strumento di gioco per tutti i giocatori di Origins TCG, non solo per chi fa dirette. Preferiamo mostrarlo piuttosto che raccontarlo: ve ne parliamo appena abbiamo qualcosa che valga la pena vedere.

## Il mazzo della settimana {#mazzo-della-settimana}

Vogliamo premiare chi crea e dare più visibilità ai mazzi, alle guide e alle tier list della community. La prima idea è un mazzo della settimana, scelto in base alle stelle che ricevono i mazzi. Intanto, se provi un mazzo della community, votalo: i mazzi più votati compaiono già nella [tier list](/it/tier-list).

## Grazie {#grazie}

OriginsMeta è online dal 15 settembre. In dieci giorni vi siete iscritti, avete pubblicato mazzi, votato e ci avete mandato idee e correzioni: parecchie novità di questi giorni sono nate dai vostri messaggi. Grazie: questo sito cresce insieme a voi.

## Partecipa {#partecipa}

- [Iscriviti](/it/login): è gratis, con Discord o con la tua email, senza password. Con un account pubblichi i tuoi mazzi, voti e salvi le tue tier list.
- [Costruisci un mazzo](/it/deck-builder): gratis, anche senza account. Copia il codice del gioco oppure, con un account, pubblica il mazzo sul sito con la tua guida.
- [Crea la tua tier list](/it/tier-list/create) e guarda la [tier list della community](/it/tier-list/community), che diventa una classifica vera a partire da 5 liste salvate.
- [Entra nel nostro Discord](https://discord.gg/RAG7nnrNGP): le news e le guide nuove arrivano lì appena escono. Il [Discord ufficiale di Origins TCG](https://discord.gg/originstcg) è il server di Koin Games, per gli annunci e le iscrizioni ai tornei.`,
      `## Llega el español {#espanol}

Desde el 25 de septiembre de 2026 OriginsMeta también está en español: cartas, mazos, guías, noticias, tier lists, el deck builder y los torneos. Cambia de idioma con EN · IT · ES en la parte superior de cada página (en el teléfono, dentro de Menú). Es un español neutro, para quienes juegan en España y en América Latina, y los nombres de las cartas siguen en inglés, como en el juego.

Los mazos de la comunidad también hablan tres idiomas: el autor escribe la guía en su idioma, el sitio la traduce a los otros dos, lo indica en la página y enlaza el original. Un mazo publicado en italiano ahora también se lee en inglés y en español.

## Cada carta, en tres idiomas {#cartas}

El 25 de septiembre abrimos la demo en español y en italiano y leímos una por una las 122 cartas de la colección. Los textos en español y en italiano que ves en la [lista de cartas](/es/cards) son los oficiales del juego: 101 textos en español y 88 en italiano eran distintos de nuestras traducciones, y los hemos sustituido.

Las palabras clave también usan los términos oficiales del juego: On Reveal es "Al revelar" en español y "Alla rivelazione" en italiano. Encontrarás los mismos términos en las etiquetas de palabras clave de la página de cada carta, en las guías y en las noticias. Las cartas creadas y las retiradas no aparecen en la colección del juego, y las [Ubicaciones](/es/locations) aún no las hemos comparado en el juego: su texto en español y en italiano lo escribimos nosotros, con el glosario del juego.

## Un overlay para todos {#overlay}

Estamos trabajando en un overlay: una herramienta de juego para todos los jugadores de Origins TCG, no solo para quienes transmiten sus partidas. Preferimos mostrarlo antes que contarlo: te daremos más detalles en cuanto tengamos algo que valga la pena ver.

## El mazo de la semana {#mazo-de-la-semana}

Queremos premiar a quienes crean contenido y dar más visibilidad a los mazos, las guías y las tier lists de la comunidad. La primera idea es un mazo de la semana, elegido según las estrellas que reciben los mazos. Mientras tanto, si pruebas un mazo de la comunidad, valóralo: los mazos mejor valorados ya aparecen en la [tier list](/es/tier-list).

## Gracias {#gracias}

OriginsMeta está en línea desde el 15 de septiembre. En diez días, la comunidad se registró, publicó mazos, votó y nos escribió con ideas y correcciones: varias novedades de estos días nacieron de esos mensajes. Gracias: este sitio crece con toda la comunidad.

## Participa {#participa}

- [Regístrate](/es/login): es gratis, con Discord o con tu correo electrónico, sin contraseña. Con una cuenta publicas tus mazos, votas y guardas tus tier lists.
- [Construye un mazo](/es/deck-builder): gratis, incluso sin cuenta. Copia el código del juego o, con una cuenta, publica el mazo en el sitio con tu guía.
- [Crea tu tier list](/es/tier-list/create) y mira la [tier list de la comunidad](/es/tier-list/community), que se convierte en una clasificación de verdad a partir de 5 listas guardadas.
- [Únete a nuestro Discord](https://discord.gg/RAG7nnrNGP): las noticias y las guías nuevas llegan allí en cuanto se publican. El [Discord oficial de Origins TCG](https://discord.gg/originstcg) es el servidor de Koin Games, para anuncios e inscripciones a torneos.`,
    ),
    faq: {
      en: [
        {
          q: "Is OriginsMeta available in Spanish?",
          a: "Yes, since 25 September 2026: the whole site, with guides, news, tier lists and the deck builder. Switch language with EN · IT · ES at the top of the page; community deck guides are translated automatically.",
        },
        {
          q: "Are the Italian and Spanish card texts official?",
          a: "Yes, for the 122 Demo 2.0 cards: we read them in the game on 25 September 2026. Created and removed cards are not in the game's collection and the Locations have not been checked in the game yet, so their Italian and Spanish text is our translation with the game's glossary.",
        },
        {
          q: "How do I publish a deck on OriginsMeta?",
          a: "Build it in the deck builder, sign in with Discord or your email and press Publish on the site: a short game plan is required, the rest of the guide is optional.",
        },
      ],
      it: [
        {
          q: "OriginsMeta è disponibile in spagnolo?",
          a: "Sì, dal 25 settembre 2026: tutto il sito, con guide, news, tier list e deck builder. La lingua si cambia con EN · IT · ES in alto; le guide dei mazzi della community vengono tradotte in automatico.",
        },
        {
          q: "I testi italiani e spagnoli delle carte sono ufficiali?",
          a: "Sì, per le 122 carte della Demo 2.0: li abbiamo letti nel gioco il 25 settembre 2026. Carte generate e carte rimosse non sono nella collezione del gioco e i Luoghi non li abbiamo ancora confrontati nel gioco: il loro testo è una nostra traduzione con il glossario del gioco.",
        },
        {
          q: "Come pubblico un mazzo su OriginsMeta?",
          a: "Costruiscilo nel deck builder, accedi con Discord o con la tua email e premi Pubblica sul sito: serve un breve piano di gioco, il resto della guida è facoltativo.",
        },
      ],
      es: [
        {
          q: "¿OriginsMeta está disponible en español?",
          a: "Sí, desde el 25 de septiembre de 2026: todo el sitio, con guías, noticias, tier lists y el deck builder. Cambia de idioma con EN · IT · ES arriba en la página; las guías de los mazos de la comunidad se traducen automáticamente.",
        },
        {
          q: "¿Los textos de las cartas en español e italiano son oficiales?",
          a: "Sí, para las 122 cartas de la Demo 2.0: los leímos en el juego el 25 de septiembre de 2026. Las cartas creadas y las retiradas no están en la colección del juego, y las Ubicaciones aún no las hemos comparado en el juego: su texto es una traducción nuestra con el glosario del juego.",
        },
        {
          q: "¿Cómo publico un mazo en OriginsMeta?",
          a: "Créalo en el deck builder, accede con Discord o con tu correo electrónico y pulsa Publicar en el sitio: hace falta un breve plan de juego; el resto de la guía es opcional.",
        },
      ],
    },
    url: "/cards",
    source: "site",
  },
  {
    // Annuncio sul Discord ufficiale del 24/09/2026 ("BIG CRIMSON CUP ANNOUNCEMENT"), passato da Pierluigi, più il post
    // su X dello stesso giorno. La copertina è un ritaglio 16:9 della grafica ufficiale dei premi (crediti della carta interi).
    slug: "crimson-cup-format-check-in",
    image: "/media/news-crimson-cup-rules.webp",
    guides: ["steam-next-fest-2026", "origins-tcg-conquest"],
    date: "2026-09-24",
    // 30/09/2026: l'ultima patch di bilanciamento è uscita il 29/09 (patch 0.7): "In breve", sezione #balance e "Cosa non sappiamo"
    // 07/10/2026: post Steam del 05/10 (news crimson-cup-prizepool-qualifiers): montepremi, due qualificazioni in più e sette
    // luoghi esclusi; "In breve", sezioni #check-in e #prizes, "Cosa non sappiamo", description con le qualificazioni dal 19
    updated: "2026-10-07",
    title: n(
      "Crimson Cup rules: three-deck Conquest, decklists hidden until the top 4 and a check-in you can't miss",
      "Regole della Crimson Cup: Conquest a tre mazzi, liste segrete fino alla top 4 e check-in obbligatorio",
      "Reglas de la Crimson Cup: Conquest con tres mazos, listas ocultas hasta el top 4 y check-in obligatorio",
    ),
    // Pagina primaria sulla Crimson Cup (mappa delle query del 25/09/2026): il title porta regole, date, premi e check-in;
    // le altre pagine sulla coppa (annuncio del 9/9, aggiornamento della demo) nominano la coppa ma non questi dettagli.
    metaTitle: n("Origins TCG Crimson Cup: rules, dates, prizes, check-in", "Crimson Cup di Origins TCG: regole, date, premi, check-in", "Crimson Cup de Origins TCG: reglas, fechas y premios"),
    description: n(
      "Origins TCG Crimson Cup rules: three-deck Conquest, 8 unique cards between decks, qualifiers on 19–22 October, prizes worth $10,000 and check-in times.",
      "Regole della Crimson Cup di Origins TCG: Conquest a tre mazzi, 8 carte uniche fra i mazzi, qualificazioni dal 19 al 22 ottobre, premi per 10.000 $ e check-in.",
      "Crimson Cup de Origins TCG: Conquest con 3 mazos, 8 cartas únicas entre mazos, clasificatorios del 19 al 22 de octubre, premios por 10.000 dólares y check-in.",
    ),
    summary: n(
      "After the player survey, Koin Games has set the Crimson Cup rules: three-deck Conquest, at least 8 unique cards between each pair of decks, decklists hidden until the top 4 and no ban in best-of-five matches. Check-in opens two hours before each qualifier and closes five minutes before the start, together with deck submission: miss it and you don't play. The tournament runs on the demo, not on the playtest.",
      "Dopo il sondaggio tra i giocatori, Koin Games ha fissato le regole della Crimson Cup: Conquest a tre mazzi, almeno 8 carte uniche fra ogni coppia di mazzi, liste segrete fino alla top 4 e niente ban nelle partite al meglio delle cinque. Il check-in apre due ore prima di ogni qualificazione e chiude cinque minuti prima dell'inizio, insieme alla consegna dei mazzi: chi lo salta non gioca. Il torneo si gioca sulla demo, non sul playtest.",
      "Tras la encuesta entre los jugadores, Koin Games ha fijado las reglas de la Crimson Cup: Conquest con tres mazos, al menos 8 cartas únicas entre cada par de mazos, listas ocultas hasta el top 4 y ningún ban en los enfrentamientos al mejor de cinco. El check-in abre dos horas antes de cada clasificatorio y cierra cinco minutos antes del inicio, junto con la entrega de mazos: si te lo saltas, no juegas. El torneo se juega en la demo, no en el playtest.",
    ),
    highlights: {
      en: [
        { label: "Three-deck Conquest", text: "at least 8 unique cards between each pair of decks", anchor: "format" },
        { label: "Decklists hidden until the top 4", text: "in the ban you only see the Legendary", anchor: "decklists" },
        { label: "Best-of-five without a ban", text: "you have to win with all three decks", anchor: "best-of-five" },
        { label: "Check-in", text: "opens two hours before, closes five minutes before the start with deck submission", anchor: "check-in" },
        { label: "Practise on the demo", text: "the playtest will get updates the tournament won't have", anchor: "demo-playtest" },
        { label: "Last balance patch", text: "out on 29 September: patch 0.7", anchor: "balance" },
        { label: "Prizes", text: "10,000 dollars; the full breakdown came on 5 October", anchor: "prizes" },
      ],
      it: [
        { label: "Conquest a tre mazzi", text: "almeno 8 carte uniche fra ogni coppia di mazzi", anchor: "formato" },
        { label: "Liste segrete fino alla top 4", text: "nel ban si vede solo la Leggendaria", anchor: "liste" },
        { label: "Al meglio delle cinque senza ban", text: "bisogna vincere con tutti e tre i mazzi", anchor: "al-meglio-delle-cinque" },
        { label: "Check-in", text: "apre due ore prima, chiude cinque minuti prima dell'inizio con la consegna dei mazzi", anchor: "check-in" },
        { label: "Allenarsi sulla demo", text: "il playtest avrà aggiornamenti che il torneo non avrà", anchor: "demo-playtest" },
        { label: "Ultima patch di bilanciamento", text: "uscita il 29 settembre: è la patch 0.7", anchor: "bilanciamento" },
        { label: "Premi", text: "10.000 dollari; la ripartizione completa è arrivata il 5 ottobre", anchor: "premi" },
      ],
      es: [
        { label: "Conquest con tres mazos", text: "al menos 8 cartas únicas entre cada par de mazos", anchor: "formato" },
        { label: "Listas ocultas hasta el top 4", text: "en el ban solo ves la Legendaria", anchor: "listas" },
        { label: "Al mejor de cinco sin ban", text: "tienes que ganar con los tres mazos", anchor: "al-mejor-de-cinco" },
        { label: "Check-in", text: "abre dos horas antes y cierra cinco minutos antes del inicio, con la entrega de mazos", anchor: "check-in" },
        { label: "Entrena en la demo", text: "el playtest tendrá actualizaciones que el torneo no tendrá", anchor: "demo-playtest" },
        { label: "Último parche de equilibrio", text: "salió el 29 de septiembre: es el parche 0.7", anchor: "equilibrio" },
        { label: "Premios", text: "10.000 dólares; el reparto completo llegó el 5 de octubre", anchor: "premios" },
      ],
    },
    body: n(
      `## Three-deck Conquest {#format}

A few days ago Koin Games ran a survey among players, and this announcement settles the format: the Crimson Cup uses Conquest with three decks. Between each pair of decks there must be at least 8 unique cards.

Every deck has 13 different cards: the Legendary and twelve base cards, whose second copy the game adds on its own. Our reading is that two decks can share at most 5 cards, but the announcement does not spell out how unique cards are counted. At Big Bob's Playtest Battle in August the rule was at least nine cards of difference.

## Decklists hidden until the top 4 {#decklists}

Decks stay private until the top 4. When you ban one of your opponent's decks, you only see its Legendary.

## Best-of-five: no ban, win with all three {#best-of-five}

Best-of-five matches have no ban: to take the match you have to win with all three decks. In the first announcement, on 9 September, best-of-five was the grand final, with best-of-three matches before it.

## Check-in: be on time {#check-in}

The planned schedule for each qualifier:

1. Check-in opens two hours before the tournament starts.
2. Check-in and deck submission close five minutes before the official start.
3. A short window lets players on the waitlist claim the free spots, first come, first served.
4. The tournament introduction.
5. Matches start as soon as the introduction is over.

If you don't check in, you can't play. For the EMEA qualifier on 20 October, which starts at 7pm CEST, that means checking in between 5pm and 6:55pm CEST. The AMER qualifier is on the 21st and the APAC one on the 22nd: times and spots are in our [Steam Next Fest guide](/en/guides/steam-next-fest-2026).

**Update, 7 October:** there are now five qualifiers. On 5 October Koin added AMER on 19 October at 7pm EST and EMEA on 22 October at 7pm CEST, and its new calendar graphic puts the AMER qualifier of the 21st at 9pm EST, with 32 advancing instead of 64 and 96 wild cards instead of 128. Seven locations are also out of the tournament pool. Everything is in [our article on the prize pool and the new qualifiers](/en/news/crimson-cup-prizepool-qualifiers).

## Demo or playtest: where to practise {#demo-playtest}

- The **demo** has the tournament card list. Ranked switches on there for Steam Next Fest, with new ranked rewards. This is the build to practise on.
- The **playtest** is the same as the demo today, with ranked already on and a few minor changes. It will get more updates and will be different from the tournament build.

You can play both, but the tournament is held on the main demo and only with the cards available there.

## The last balance patch {#balance}

The last balance patch will arrive two weeks before Steam Next Fest, which starts on 19 October. We will track it card by card in [MetaShifting](/en/metashifting).

**Update, 30 September:** the last balance patch came out earlier than announced, on 29 September. It is [patch 0.7](/en/news/patch-0-7), which the team calls the final balance patch before the tournament: Twister Toss is reworked, and Bagheera, Mind Palace and Spellbook cost 1 more.

## Prizes {#prizes}

The official post on X talks about a 10,000-dollar prize pool, and the Discord announcement says the exact prize pool will be shared next week. In September Koin described prizes worth 10,000 dollars in total, between an exclusive 1/1 promo card, other promo cards, digital packs, Alpha boxes and cases, and cash ([our article](/en/news/biggest-tournament-ever)).

**Update, 7 October:** the breakdown arrived on 5 October. The winner takes a 1/1 Dracula promo card, two booster box cases and $1,500 in cash; promo cards go down to the top 32 and packs to the top 256. The full table is in [our article on the prize pool](/en/news/crimson-cup-prizepool-qualifiers#prizes).

## What we don't know yet {#unknowns}

- The exact prize pool, due next week: it came on 5 October, see the update above.
- How the unique cards between two decks are counted.

## Where this comes from {#sources}

- The "Big Crimson Cup announcement" posted on the official Origins TCG Discord on 24 September, which also points to a new video going over the tournament details.
- The [Origins TCG post on X](https://x.com/origins_tcg/status/2103111100321677670) of the same day, with the 10,000-dollar prize pool.`,
      `## Conquest a tre mazzi {#formato}

Nei giorni scorsi Koin Games ha fatto un sondaggio tra i giocatori, e questo annuncio chiude la questione del formato: la Crimson Cup si gioca in Conquest con tre mazzi. Fra ogni coppia di mazzi servono almeno 8 carte uniche.

Ogni mazzo ha 13 carte diverse: la Leggendaria e dodici carte base, di cui il gioco aggiunge da solo la seconda copia. La nostra lettura è che due mazzi possano avere in comune al massimo 5 carte, ma l'annuncio non dice come si contano le carte uniche. A Big Bob's Playtest Battle, ad agosto, la regola era di almeno nove carte di differenza.

## Liste segrete fino alla top 4 {#liste}

I mazzi restano privati fino alla top 4. Quando si banna un mazzo dell'avversario, se ne vede solo la Leggendaria.

## Al meglio delle cinque: niente ban, si vince con tutti e tre {#al-meglio-delle-cinque}

Le partite al meglio delle cinque si giocano senza ban: per vincere il match bisogna vincere con tutti e tre i mazzi. Nel primo annuncio, il 9 settembre, al meglio delle cinque era la finalissima, con partite al meglio delle tre prima.

## Check-in: puntuali {#check-in}

Il programma previsto per ogni qualificazione:

1. Due ore prima dell'inizio apre il check-in.
2. Cinque minuti prima dell'inizio ufficiale chiudono il check-in e la consegna dei mazzi.
3. Una breve finestra permette a chi è in lista d'attesa di prendere i posti liberi, in ordine di arrivo.
4. La presentazione del torneo.
5. Le partite partono appena finisce la presentazione.

Chi non fa il check-in non gioca. Per la qualificazione EMEA del 20 ottobre, che parte alle 19 ora italiana, vuol dire fare il check-in fra le 17 e le 18:55. L'AMER è il 21 e l'APAC il 22: orari e posti sono nella nostra [guida allo Steam Next Fest](/it/guides/steam-next-fest-2026).

**Aggiornamento del 7 ottobre:** le qualificazioni ora sono cinque. Il 5 ottobre Koin ha aggiunto AMER il 19 ottobre alle 19 EST ed EMEA il 22 ottobre alle 19 CEST, e la sua nuova grafica del calendario mette la qualificazione AMER del 21 alle 21 EST, con 32 che passano invece di 64 e 96 wild card invece di 128. Anche sette luoghi sono fuori dal pool del torneo. Tutto nel [nostro articolo sul montepremi e sulle nuove qualificazioni](/it/news/crimson-cup-prizepool-qualifiers).

## Demo o playtest: dove allenarsi {#demo-playtest}

- La **demo** ha la lista carte del torneo. Lì la classificata si accende per lo Steam Next Fest, con nuove ricompense. È la build su cui allenarsi.
- Il **playtest** oggi è uguale alla demo, con la classificata già attiva e qualche piccola modifica. Riceverà altri aggiornamenti e sarà diverso dalla build del torneo.

Si possono giocare tutti e due, ma il torneo si gioca sulla demo principale e solo con le carte che ci sono lì.

## L'ultima patch di bilanciamento {#bilanciamento}

L'ultima patch di bilanciamento arriverà due settimane prima dello Steam Next Fest, che parte il 19 ottobre. La seguiremo carta per carta in [MetaShifting](/it/metashifting).

**Aggiornamento del 30 settembre:** l'ultima patch di bilanciamento è uscita prima del previsto, il 29 settembre. È la [patch 0.7](/it/news/patch-0-7), che il team chiama l'ultima patch di bilanciamento prima del torneo: Twister Toss cambia effetto, e Bagheera, Mind Palace e Spellbook costano 1 in più.

## I premi {#premi}

Il post ufficiale su X parla di un montepremi da 10.000 dollari, e l'annuncio su Discord dice che la ripartizione esatta arriverà la settimana prossima. A settembre Koin aveva descritto premi per un valore complessivo di 10.000 dollari, fra una carta promo 1/1 esclusiva, altre carte promo, pacchetti digitali, box e case Alpha e premi in denaro ([il nostro articolo](/it/news/biggest-tournament-ever)).

**Aggiornamento del 7 ottobre:** la ripartizione è arrivata il 5 ottobre. Chi vince prende una carta promo Dracula 1/1, due case di booster box e 1.500 $ in contanti; le carte promo arrivano fino alla top 32 e i pacchetti fino alla top 256. La tabella completa è nel [nostro articolo sul montepremi](/it/news/crimson-cup-prizepool-qualifiers#premi).

## Cosa non sappiamo ancora {#da-sapere}

- La ripartizione esatta dei premi, attesa la settimana prossima: è arrivata il 5 ottobre, vedi l'aggiornamento qui sopra.
- Come si contano le carte uniche fra due mazzi.

## Da dove arriva {#fonti}

- Il "Big Crimson Cup announcement" pubblicato sul Discord ufficiale di Origins TCG il 24 settembre, che rimanda anche a un nuovo video con i dettagli del torneo.
- Il [post di Origins TCG su X](https://x.com/origins_tcg/status/2103111100321677670) dello stesso giorno, con il montepremi da 10.000 dollari.`,
      `## Conquest con tres mazos {#formato}

Hace unos días Koin Games hizo una encuesta entre los jugadores, y este anuncio zanja la cuestión del formato: la Crimson Cup se juega en Conquest con tres mazos. Entre cada par de mazos tiene que haber al menos 8 cartas únicas.

Cada mazo tiene 13 cartas distintas: la Legendaria y doce cartas base, cuya segunda copia añade el propio juego. Nuestra interpretación es que dos mazos pueden compartir como máximo 5 cartas, pero el anuncio no aclara cómo se cuentan las cartas únicas. En Big Bob's Playtest Battle, en agosto, la regla era de al menos nueve cartas de diferencia.

## Listas ocultas hasta el top 4 {#listas}

Los mazos siguen siendo privados hasta el top 4. Cuando baneas uno de los mazos de tu rival, solo ves su Legendaria.

## Al mejor de cinco: sin ban, se gana con los tres {#al-mejor-de-cinco}

Los enfrentamientos al mejor de cinco no tienen ban: para llevarte el enfrentamiento tienes que ganar con los tres mazos. En el primer anuncio, del 9 de septiembre, el formato al mejor de cinco estaba reservado a la gran final, con enfrentamientos al mejor de tres antes.

## Check-in: llega a tiempo {#check-in}

El programa previsto para cada clasificatorio:

1. El check-in abre dos horas antes del inicio del torneo.
2. El check-in y la entrega de mazos cierran cinco minutos antes del inicio oficial.
3. Un breve plazo permite a los jugadores en lista de espera ocupar las plazas libres, por orden de llegada.
4. La presentación del torneo.
5. Las partidas empiezan en cuanto termina la presentación.

Si no haces el check-in, no puedes jugar. Para el clasificatorio EMEA del 20 de octubre, que empieza a las 19:00 CEST, eso significa hacer el check-in entre las 17:00 y las 18:55 CEST. El clasificatorio AMER es el 21 y el APAC el 22: los horarios y las plazas están en nuestra [guía del Steam Next Fest](/es/guides/steam-next-fest-2026).

**Actualización del 7 de octubre:** ahora los clasificatorios son cinco. El 5 de octubre Koin añadió AMER el 19 de octubre a las 19:00 EST y EMEA el 22 de octubre a las 19:00 CEST, y su nueva imagen del calendario pone el clasificatorio AMER del 21 a las 21:00 EST, con 32 que pasan en lugar de 64 y 96 wild cards en lugar de 128. También siete ubicaciones quedan fuera del pool del torneo. Todo está en [nuestro artículo sobre la bolsa de premios y los nuevos clasificatorios](/es/news/crimson-cup-prizepool-qualifiers).

## Demo o playtest: dónde entrenar {#demo-playtest}

- La **demo** tiene la lista de cartas del torneo. Allí la clasificatoria se activa para el Steam Next Fest, con nuevas recompensas de clasificatoria. Es la build en la que hay que entrenar.
- El **playtest** hoy es igual que la demo, con la clasificatoria ya activa y algunos cambios menores. Recibirá más actualizaciones y será distinto de la build del torneo.

Puedes jugar a los dos, pero el torneo se juega en la demo principal y solo con las cartas disponibles en ella.

## El último parche de equilibrio {#equilibrio}

El último parche de equilibrio llegará dos semanas antes del Steam Next Fest, que empieza el 19 de octubre. Lo seguiremos carta por carta en [MetaShifting](/es/metashifting).

**Actualización del 30 de septiembre:** el último parche de equilibrio salió antes de lo anunciado, el 29 de septiembre. Es el [parche 0.7](/es/news/patch-0-7), que el equipo llama el último parche de equilibrio antes del torneo: Twister Toss recibe un rework, y Bagheera, Mind Palace y Spellbook cuestan 1 más.

## Premios {#premios}

La publicación oficial en X habla de una bolsa de premios de 10.000 dólares, y el anuncio en Discord dice que el reparto exacto de la bolsa de premios se dará a conocer la próxima semana. En septiembre Koin describió premios por un valor total de 10.000 dólares, entre una carta promo 1/1 exclusiva, otras cartas promo, sobres digitales, cajas y cases de Alpha, y dinero en efectivo ([nuestro artículo](/es/news/biggest-tournament-ever)).

**Actualización del 7 de octubre:** el reparto llegó el 5 de octubre. El ganador se lleva una carta promo Dracula 1/1, dos cases de cajas de sobres y 1.500 dólares en efectivo; las cartas promo llegan hasta el top 32 y los sobres hasta el top 256. La tabla completa está en [nuestro artículo sobre la bolsa de premios](/es/news/crimson-cup-prizepool-qualifiers#premios).

## Lo que aún no sabemos {#lo-que-no-sabemos}

- El reparto exacto de la bolsa de premios, previsto para la próxima semana: llegó el 5 de octubre, ver la actualización de arriba.
- Cómo se cuentan las cartas únicas entre dos mazos.

## De dónde viene {#fuentes}

- El "Big Crimson Cup announcement" publicado en el Discord oficial de Origins TCG el 24 de septiembre, que también remite a un nuevo video con los detalles del torneo.
- La [publicación de Origins TCG en X](https://x.com/origins_tcg/status/2103111100321677670) del mismo día, con la bolsa de premios de 10.000 dólares.`,
    ),
    faq: {
      en: [
        {
          q: "How many unique cards do Crimson Cup decks need?",
          a: "At least 8 unique cards between each pair of decks, says the 24 September announcement. Every deck has 13 different cards: our reading is that two decks can share at most 5 of them.",
        },
        {
          q: "When is the Crimson Cup check-in?",
          a: "It opens two hours before each qualifier and closes five minutes before the start, together with deck submission. If you miss it you can't play: for the EMEA qualifier at 7pm CEST, check in between 5pm and 6:55pm CEST.",
        },
        {
          q: "Which build is the Crimson Cup played on?",
          a: "On the main demo, with only the cards available there. The playtest will get more updates and will differ from the tournament build.",
        },
      ],
      it: [
        {
          q: "Quante carte uniche servono fra i mazzi della Crimson Cup?",
          a: "Almeno 8 fra ogni coppia di mazzi, dice l'annuncio del 24 settembre. Ogni mazzo ha 13 carte diverse: la nostra lettura è che due mazzi possano averne in comune al massimo 5.",
        },
        {
          q: "Quando si fa il check-in della Crimson Cup?",
          a: "Apre due ore prima di ogni qualificazione e chiude cinque minuti prima dell'inizio, insieme alla consegna dei mazzi. Chi lo salta non gioca: per la qualificazione EMEA delle 19 il check-in va dalle 17 alle 18:55, ora italiana.",
        },
        {
          q: "Su quale build si gioca la Crimson Cup?",
          a: "Sulla demo principale, solo con le carte che ci sono lì. Il playtest riceverà altri aggiornamenti e sarà diverso dalla build del torneo.",
        },
      ],
      es: [
        {
          q: "¿Cuántas cartas únicas necesitan los mazos de la Crimson Cup?",
          a: "Al menos 8 cartas únicas entre cada par de mazos, según el anuncio del 24 de septiembre. Cada mazo tiene 13 cartas distintas: nuestra interpretación es que dos mazos pueden compartir como máximo 5.",
        },
        {
          q: "¿Cuándo es el check-in de la Crimson Cup?",
          a: "Abre dos horas antes de cada clasificatorio y cierra cinco minutos antes del inicio, junto con la entrega de mazos. Si te lo saltas, no puedes jugar: para el clasificatorio EMEA de las 19:00 CEST, haz el check-in entre las 17:00 y las 18:55 CEST.",
        },
        {
          q: "¿En qué build se juega la Crimson Cup?",
          a: "En la demo principal, solo con las cartas disponibles allí. El playtest recibirá más actualizaciones y será distinto de la build del torneo.",
        },
      ],
    },
    url: "https://x.com/origins_tcg/status/2103111100321677670",
    source: "press",
  },
  {
    // Prima news sulle novità del sito ("Upgrade Meta", richiesta di Pierluigi del 24/09/2026): le funzioni andate
    // online dal 22 al 24 settembre, il grazie a coachcronos per la diretta e a chi ha mandato un feedback.
    slug: "upgrade-meta-0924",
    image: "/media/keyart-mulan-wide.webp",
    guides: ["on-reveal-midrange-guide", "king-of-value-trade-guide", "dorothy-combo-guide", "trick-or-treat-legion-guide", "origins-tcg-locations"],
    date: "2026-09-24",
    // 27/09/2026: i ruoli rifatti (Staff, Creator, Autore, Pro, Community) cambiano il filtro raccontato qui; paragrafo
    // "Aggiornamento del 27 settembre" in fondo alla sezione dei mazzi (decisione di Pierluigi del 27/09)
    updated: "2026-09-27",
    title: n(
      "Upgrade Meta: card text search, a rebuilt tier list, Locations and our own Discord",
      "Upgrade Meta: la ricerca nel testo delle carte, la tier list rifatta, i Luoghi e il nostro Discord",
      "Upgrade Meta: búsqueda en el texto de las cartas, tier list renovada, Ubicaciones y nuestro Discord",
    ),
    metaTitle: n("Upgrade Meta: what's new on OriginsMeta for Origins TCG", "Upgrade Meta: novità di OriginsMeta per Origins TCG", "Upgrade Meta: novedades de OriginsMeta para Origins TCG"),
    description: n(
      "Three days of OriginsMeta updates: card text search, a rebuilt tier list, Locations, public profiles and our own Discord. Thank you, coachcronos.",
      "Tre giorni di novità su OriginsMeta: ricerca nel testo delle carte, tier list rifatta, Luoghi, profili pubblici e il nostro Discord. Grazie, coachcronos.",
      "En tres días OriginsMeta estrena búsqueda en el texto de las cartas, tier list renovada, Ubicaciones, perfiles públicos y su Discord. Gracias, coachcronos.",
    ),
    summary: n(
      "OriginsMeta changed a lot in three days: the deck builder now searches card text, the tier list shows three sources side by side, and Locations, public profiles and our own Discord server have arrived. Thanks to coachcronos for the stream and to everyone who wrote to us: many of these changes started as your requests.",
      "In tre giorni OriginsMeta è cambiato parecchio: nel deck builder ora si cerca anche nel testo delle carte, la tier list ha tre fonti a vista, e sono arrivati i Luoghi, i profili pubblici e il nostro server Discord. Grazie a coachcronos per la diretta e a chi ci ha scritto: molte di queste novità sono nate dalle vostre richieste.",
      "OriginsMeta ha cambiado mucho en tres días: el deck builder ahora busca en el texto de las cartas, la tier list muestra tres fuentes una junto a otra y han llegado las Ubicaciones, los perfiles públicos y nuestro propio servidor de Discord. Gracias a coachcronos por la transmisión y a todos los que nos han escrito: muchos de estos cambios nacieron de sus peticiones.",
    ),
    highlights: {
      en: [
        { label: "Search the card text", text: "in the deck builder and the card database: type Reveal and the On Reveal cards remain", anchor: "search" },
        { label: "A rebuilt tier list", text: "OriginsMeta, Community and Most played side by side, MetaShifting on its own page", anchor: "tier-list" },
        { label: "Locations", text: "the 44 locations of Demo 2.0, searchable and filterable", anchor: "locations" },
        { label: "Decks, guides and profiles", text: "author type filter, date and patch on every deck, public profiles, four new guides", anchor: "decks" },
        { label: "Cards checked in the game", text: "all 122 cards compared one by one, plus the 21 September patch", anchor: "cards" },
        { label: "An easier site to read", text: "new logo, cards that flip, a calendar that scrolls", anchor: "look" },
        { label: "Our own Discord", text: "logo in the menu, new articles and guides posted automatically", anchor: "discord" },
        { label: "Thank you, coachcronos", text: "for the 23 September stream", anchor: "thanks-coachcronos" },
        { label: "Thank you for writing to us", text: "and from today you can leave your name in the feedback box", anchor: "thanks-feedback" },
      ],
      it: [
        { label: "Cerca nel testo delle carte", text: "nel deck builder e nel database: scrivi Reveal e restano le carte con un'abilità Alla rivelazione", anchor: "ricerca" },
        { label: "Tier list rifatta", text: "OriginsMeta, Community e Le più giocate a vista, MetaShifting su una pagina sua", anchor: "tier-list" },
        { label: "I Luoghi", text: "i 44 luoghi della Demo 2.0 da cercare e filtrare", anchor: "luoghi" },
        { label: "Mazzi, guide e profili", text: "filtro per tipo di autore, data e patch su ogni mazzo, profili pubblici, quattro guide nuove", anchor: "mazzi" },
        { label: "Carte verificate sul gioco", text: "tutte le 122 carte confrontate una per una, più la patch del 21 settembre", anchor: "carte" },
        { label: "Un sito più leggibile", text: "logo nuovo, carte che si girano, calendario che scorre", anchor: "grafica" },
        { label: "Il nostro Discord", text: "loghino nel menu, news e guide nuove annunciate da sole", anchor: "discord" },
        { label: "Grazie, coachcronos", text: "per la diretta del 23 settembre", anchor: "grazie-coachcronos" },
        { label: "Grazie a chi ci scrive", text: "e da oggi nel pop-up dei feedback puoi lasciare il tuo nome", anchor: "grazie-feedback" },
      ],
      es: [
        {
          label: "Busca en el texto de las cartas",
          text: "en el deck builder y en la base de datos de cartas: escribe Reveal y quedan las cartas con una habilidad Al revelar",
          anchor: "busqueda",
        },
        { label: "Una tier list renovada", text: "OriginsMeta, Comunidad y Las más jugadas una junto a otra, MetaShifting en su propia página", anchor: "tier-list" },
        { label: "Ubicaciones", text: "las 44 ubicaciones de la Demo 2.0, con búsqueda y filtros", anchor: "ubicaciones" },
        { label: "Mazos, guías y perfiles", text: "filtro por tipo de autor, fecha y parche en cada mazo, perfiles públicos, cuatro guías nuevas", anchor: "mazos" },
        { label: "Cartas verificadas en el juego", text: "las 122 cartas comparadas una por una, más el parche del 21 de septiembre", anchor: "cartas" },
        { label: "Un sitio más fácil de leer", text: "logo nuevo, cartas que se giran, un calendario que se desplaza", anchor: "aspecto" },
        { label: "Nuestro propio Discord", text: "logo en el menú, artículos y guías nuevos publicados automáticamente", anchor: "discord" },
        { label: "Gracias, coachcronos", text: "por la transmisión del 23 de septiembre", anchor: "gracias-coachcronos" },
        { label: "Gracias por escribirnos", text: "y desde hoy puedes dejar tu nombre en el buzón de comentarios", anchor: "gracias-comentarios" },
      ],
    },
    body: n(
      `## Search the card text {#search}

The first message that reached us through the feedback box asked for something precise: while building a deck around Mulan, the person who wrote wanted to see only the cards with On Reveal by typing "Reveal" in the search, as you can in the game. Now you can.

- The [deck builder](/en/deck-builder) search looks at the name, the saga and the **card text**. Type "Reveal" and the On Reveal cards remain: there are 33 in the current demo.
- Capitals and accents don't matter, and with several words you get the cards that contain all of them, for example "reveal damage".
- Below the filters you see how many cards are left, with "Clear filters"; when nothing matches, the builder says so instead of showing an empty list.
- The same search works in the [card database](/en/cards) and in the "Search a card" box at the top of every page. On the Italian site it also reads the English text of the game, so "draw" works there too.

## A rebuilt tier list {#tier-list}

The [tier list](/en/tier-list) now shows three sources side by side, each with its own page:

- **OriginsMeta**: tiers come only from tournament results, so they arrive after the Crimson Cup; meanwhile the page shows the top-rated decks and the cards that appear in the most decks.
- **[Community](/en/tier-list/community)**: the average of the tier lists saved by members, which becomes a ranking from 5 lists up.
- **[Most played](/en/tier-list/most-played)**: how many published decks each card appears in. That is popularity, not win rate.

The balance tracker has its own page, [MetaShifting](/en/metashifting), with the most recent patch first. In the [tier list maker](/en/tier-list/create) cards really drag now; on a phone there is the S A B C D bar, and with an account you can save your list, which then counts in the community tier list.

## Locations {#locations}

A new [Locations](/en/locations) page: the 44 locations of Demo 2.0, with search by name and effect, filters by effect family (damage, mana, movement and more) and the cards they mention linked to their pages. To see how they change a match, read the [Locations guide](/en/guides/origins-tcg-locations).

## Decks, guides and profiles {#decks}

- In [Decks](/en/decks) the filters are always visible, with a new one for the **author type**: Staff, Pro, Influencer, Community. Decks sort newest first, and each one shows its creation date and the game version it was built on.
- Every member has a **public page** with their published decks and saved tier lists.
- The deck builder has four buttons: Publish on the site, Save privately (the deck stays in your profile and only you can see it), Share, Clear deck. The deck you are building saves itself in your browser.
- Four new guides to the decks Davdas published: [On Reveal Mid Range](/en/guides/on-reveal-midrange-guide) with Mulan, [King of Value Trade](/en/guides/king-of-value-trade-guide), [Dorothy Combo](/en/guides/dorothy-combo-guide) and [The Trick-or-Treat Legion](/en/guides/trick-or-treat-legion-guide).
- Wrote a guide yourself? [Send it to us](/en/guides/submit): we read it and, with your permission, publish it under your name.

**Update, 27 September:** the filter is now called **Role**, and the roles are Staff, Creator, Author, Pro and Community: the Influencer tag no longer exists. The person who published a deck is under **Published by**.

## Cards checked in the game {#cards}

On 22 September we compared all 122 cards of Demo 2.0 with the game's collection, one by one: costs, stats and alignments all matched, 16 texts did not, and now they are the game's. The database also has the [21 September demo patch](/en/news/demo-patch-notes-0921) with the 14 cards it changes, and the top of the deck builder says which game version the cards are up to date with. Today we also fixed the keywords of Queen of Hearts and Bagheera, which had fallen behind their text.

## An easier site to read {#look}

The logo is now a hand-drawn lettering. On deck pages the cards are shown whole and, with a mouse, flip over to show their text; the card preview keeps only what you need (name, type, alignment and effect). The calendar under the slider really scrolls now, slowly, and the home page header is shorter, so the news fits on the first screen.

## Our own Discord {#discord}

OriginsMeta has its own Discord server. The Discord logo is in the top menu (on a phone, inside "Menu") and the invite is at the end of every article. New articles and guides are posted there automatically as soon as they go live on the site. The [official Origins TCG Discord](https://discord.gg/originstcg) is still Koin Games' server, for announcements, AMAs and tournament sign-ups.

## Thank you, coachcronos {#thanks-coachcronos}

On 23 September coachcronos hosted us live on his Twitch channel, with Davdas and Pierluigi, to talk about the site and Origins TCG with his chat. Thank you from the heart: for the space, for the enthusiasm he brings to the game and for introducing us to his community. Several changes in this article started on that stream: deck filters that are always visible, the author type filter and "Send us your guide".

## Thank you for writing to us {#thanks-feedback}

The feedback box has been open for a few days and the staff reads every message. Card text search started that way, from an unsigned message: thank you, whoever you are. From today the box also has a field for your name or nickname, optional, so we know who to thank (we never publish it without asking you). Keep writing to us: from the feedback box at the bottom right, with [Send us your guide](/en/guides/submit) or on our Discord.`,
      `## Cerca nel testo delle carte {#ricerca}

Il primo messaggio arrivato dal pop-up dei feedback chiedeva una cosa precisa: mentre costruiva un mazzo con Mulan, chi ci ha scritto voleva vedere solo le carte con un'abilità Alla rivelazione (On Reveal) scrivendo "Reveal" nella ricerca, come si fa nel gioco. Ora si può.

- La ricerca del [deck builder](/it/deck-builder) guarda il nome, la saga e il **testo della carta**. Scrivi "Reveal" e restano le carte con un'abilità Alla rivelazione: nella demo attuale sono 33.
- Cerca anche nel testo inglese del gioco: "pesca" e "draw" trovano le stesse carte.
- Maiuscole e accenti non contano, e con più parole restano le carte che le contengono tutte, per esempio "reveal danni".
- Sotto i filtri compare quante carte restano, con "Azzera i filtri"; se nessuna carta corrisponde, il builder lo dice invece di mostrare una lista vuota.
- La stessa ricerca vale nel [database carte](/it/cards) e nella casella "Cerca una carta" in alto su ogni pagina.

## Tier list rifatta {#tier-list}

La [tier list](/it/tier-list) ora ha tre fonti a vista, ognuna con la sua pagina:

- **OriginsMeta**: le fasce vengono solo dai risultati dei tornei, quindi arrivano dopo la Crimson Cup; intanto la pagina mostra i mazzi più votati e le carte più presenti nei mazzi.
- **[Community](/it/tier-list/community)**: la media delle tier list salvate dagli iscritti, che diventa una classifica da 5 liste in su.
- **[Le più giocate](/it/tier-list/most-played)**: in quanti mazzi pubblicati compare ogni carta. È popolarità, non win rate.

Il tracker dei bilanciamenti ha una pagina sua, [MetaShifting](/it/metashifting), con le patch dalla più recente. Nel tool [Crea la tua tier list](/it/tier-list/create) le carte si trascinano davvero; col dito c'è la barra S A B C D, e con un account puoi salvare la tua lista, che poi conta nella tier list della community.

## I Luoghi {#luoghi}

Nuova pagina [Luoghi](/it/locations): i 44 luoghi della Demo 2.0, con la ricerca per nome ed effetto, i filtri per famiglia di effetti (danni, mana, movimento e altri) e le carte citate collegate alla loro scheda. Per capire come cambiano una partita c'è la [guida ai Luoghi](/it/guides/origins-tcg-locations).

## Mazzi, guide e profili {#mazzi}

- In [Mazzi](/it/decks) i filtri sono sempre visibili, con quello nuovo per **tipo di autore**: Staff, Pro, Influencer, Community. I mazzi si ordinano dal più recente e ognuno mostra la data di creazione e la versione del gioco in cui è nato.
- Ogni iscritto ha una **pagina pubblica** con i mazzi pubblicati e le tier list salvate.
- Nel deck builder i tasti sono quattro: Pubblica sul sito, Salva privato (il mazzo resta nel tuo profilo e lo vedi solo tu), Condividi, Svuota mazzo. Il mazzo che stai costruendo si salva da solo nel browser.
- Quattro nuove guide ai mazzi pubblicati da Davdas: [On Reveal Mid Range](/it/guides/on-reveal-midrange-guide) con Mulan, [King of Value Trade](/it/guides/king-of-value-trade-guide), [Dorothy Combo](/it/guides/dorothy-combo-guide) e [The Trick-or-Treat Legion](/it/guides/trick-or-treat-legion-guide).
- Hai scritto una guida? [Mandacela](/it/guides/submit): la leggiamo e, con il tuo permesso, la pubblichiamo con la tua firma.

**Aggiornamento del 27 settembre:** il filtro ora si chiama **Ruolo**, e i ruoli sono Staff, Creator, Autore, Pro e Community: il tag Influencer non esiste più. Chi ha pubblicato un mazzo si cerca con **Pubblicato da**.

## Carte verificate sul gioco {#carte}

Il 22 settembre abbiamo confrontato una per una tutte le 122 carte della Demo 2.0 con la collezione del gioco: costi, statistiche e allineamenti coincidevano, 16 testi no, e ora sono quelli del gioco. Nel database c'è anche la [patch della demo del 21 settembre](/it/news/demo-patch-notes-0921) con le 14 carte che cambiano, e in testa al deck builder c'è scritto a che versione del gioco sono aggiornate le carte. Oggi abbiamo sistemato anche le parole chiave di Queen of Hearts e Bagheera, rimaste indietro rispetto al testo.

## Un sito più leggibile {#grafica}

Il logo è diventato un lettering disegnato. Nelle schede dei mazzi le carte sono intere e, col mouse, si girano mostrando il testo; l'anteprima delle carte tiene solo quello che serve (nome, tipo, allineamento ed effetto). Il calendario sotto lo slider ora scorre davvero, piano, e la testata della home è più bassa, così le news entrano nella prima schermata.

## Il nostro Discord {#discord}

OriginsMeta ha un suo server Discord. Il loghino di Discord è nel menu in alto (sul telefono dentro "Menu") e l'invito è in fondo a ogni news. Lì arrivano da sole le news e le guide nuove, appena escono sul sito. Il [Discord ufficiale di Origins TCG](https://discord.gg/originstcg) resta il server di Koin Games, per annunci, AMA e iscrizioni ai tornei.

## Grazie, coachcronos {#grazie-coachcronos}

Il 23 settembre coachcronos ci ha ospitati in diretta sul suo canale Twitch, con Davdas e Pierluigi, a parlare del sito e di Origins TCG con la sua chat. Grazie di cuore: per lo spazio, per l'entusiasmo con cui racconta il gioco e per averci fatto conoscere la sua community. Parecchie novità di questo articolo sono nate da quella diretta: i filtri dei mazzi sempre visibili, il filtro per tipo di autore e "Mandaci la tua guida".

## Grazie a chi ci scrive {#grazie-feedback}

Il pop-up "Dicci la tua" è aperto da pochi giorni e ogni messaggio lo legge lo staff. La ricerca nel testo delle carte è nata così, da un messaggio senza firma: grazie, chiunque tu sia. Da oggi nel pop-up c'è anche un campo per il nome o nickname, facoltativo, così sappiamo chi ringraziare (non lo pubblichiamo mai senza chiedertelo). Continua a scriverci: dal pop-up in basso a destra, con [Mandaci la tua guida](/it/guides/submit) o sul nostro Discord.`,
      `## Busca en el texto de las cartas {#busqueda}

El primer mensaje que nos llegó por el buzón de comentarios pedía algo muy concreto: mientras construía un mazo en torno a Mulan, quien nos escribió quería ver solo las cartas con una habilidad Al revelar (On Reveal) escribiendo "Reveal" en la búsqueda, como se puede hacer en el juego. Ahora ya se puede.

- La búsqueda del [deck builder](/es/deck-builder) mira el nombre, la saga y el **texto de la carta**. Escribe "Reveal" y quedan las cartas con una habilidad Al revelar: en la demo actual hay 33.
- Las mayúsculas y los acentos no cuentan, y con varias palabras obtienes las cartas que las contienen todas, por ejemplo "reveal daño".
- Debajo de los filtros ves cuántas cartas quedan, con "Borrar filtros"; si ninguna carta coincide, el deck builder te lo dice en lugar de mostrar una lista vacía.
- La misma búsqueda funciona en la [base de datos de cartas](/es/cards) y en el buscador "Busca una carta" que está arriba en todas las páginas. En el sitio en italiano también lee el texto en inglés del juego, así que allí también funciona "draw".

## Una tier list renovada {#tier-list}

La [tier list](/es/tier-list) ahora muestra tres fuentes una junto a otra, cada una con su propia página:

- **OriginsMeta**: los niveles salen solo de los resultados de los torneos, así que llegarán después de la Crimson Cup; mientras tanto, la página muestra los mazos mejor valorados y las cartas que aparecen en más mazos.
- **[Comunidad](/es/tier-list/community)**: la media de las tier lists que guardan los miembros, que se convierte en una clasificación a partir de 5 listas.
- **[Las más jugadas](/es/tier-list/most-played)**: en cuántos mazos publicados aparece cada carta. Eso es popularidad, no win rate.

El seguimiento de los cambios de equilibrio tiene su propia página, [MetaShifting](/es/metashifting), con el parche más reciente primero. En la herramienta [Crea tu tier list](/es/tier-list/create) las cartas ahora se arrastran de verdad; en el teléfono tienes la barra S A B C D, y con una cuenta puedes guardar tu lista, que luego cuenta en la tier list de la comunidad.

## Ubicaciones {#ubicaciones}

Nueva página [Ubicaciones](/es/locations): las 44 ubicaciones de la Demo 2.0, con búsqueda por nombre y efecto, filtros por familia de efectos (daño, maná, movimiento y más) y las cartas que mencionan enlazadas a sus páginas. Para ver cómo cambian una partida, lee la [guía de las Ubicaciones](/es/guides/origins-tcg-locations).

## Mazos, guías y perfiles {#mazos}

- En [Mazos](/es/decks) los filtros están siempre a la vista, con uno nuevo por **tipo de autor**: Staff, Pro, Influencer, Community. Los mazos se ordenan del más reciente al más antiguo, y cada uno muestra su fecha de creación y la versión del juego en la que se creó.
- Cada miembro tiene una **página pública** con sus mazos publicados y sus tier lists guardadas.
- El deck builder tiene cuatro botones: Publicar en el sitio, Guardar en privado (el mazo se queda en tu perfil y solo lo ves tú), Compartir, Vaciar el mazo. El mazo que estás construyendo se guarda automáticamente en tu navegador.
- Cuatro guías nuevas de los mazos que publicó Davdas: [On Reveal Mid Range](/es/guides/on-reveal-midrange-guide) con Mulan, [King of Value Trade](/es/guides/king-of-value-trade-guide), [Dorothy Combo](/es/guides/dorothy-combo-guide) y [The Trick-or-Treat Legion](/es/guides/trick-or-treat-legion-guide).
- ¿Escribiste una guía? [Envíanosla](/es/guides/submit): la leemos y, con tu permiso, la publicamos con tu firma.

**Actualización del 27 de septiembre:** el filtro ahora se llama **Rol**, y los roles son Staff, Creator, Autor, Pro y Community: la etiqueta Influencer ya no existe. Quien publicó un mazo se busca con **Publicado por**.

## Cartas verificadas en el juego {#cartas}

El 22 de septiembre comparamos una por una las 122 cartas de la Demo 2.0 con la colección del juego: costes, estadísticas y alineamientos coincidían en todas; 16 textos no, y ahora son los del juego. La base de datos también incluye el [parche de la demo del 21 de septiembre](/es/news/demo-patch-notes-0921) con las 14 cartas que cambia, y en la parte superior del deck builder se indica a qué versión del juego están actualizadas las cartas. Hoy también hemos corregido las palabras clave de Queen of Hearts y Bagheera, que se habían quedado desfasadas respecto a su texto.

## Un sitio más fácil de leer {#aspecto}

El logo ahora es un lettering dibujado a mano. En las páginas de los mazos las cartas se ven enteras y, al pasar el cursor por encima, se giran para mostrar su texto; la vista previa de las cartas muestra solo lo necesario (nombre, tipo, alineamiento y efecto). El calendario bajo el carrusel ahora se desplaza de verdad, despacio, y la cabecera de la página de inicio es más baja, así que las noticias caben en la primera pantalla.

## Nuestro propio Discord {#discord}

OriginsMeta tiene su propio servidor de Discord. El logo de Discord está en el menú superior (en el teléfono, dentro de "Menú") y la invitación está al final de cada artículo. Los artículos y las guías nuevos se publican allí automáticamente en cuanto salen en el sitio. El [Discord oficial de Origins TCG](https://discord.gg/originstcg) sigue siendo el servidor de Koin Games, para anuncios, AMA e inscripciones a torneos.

## Gracias, coachcronos {#gracias-coachcronos}

El 23 de septiembre coachcronos nos invitó a su canal de Twitch, con Davdas y Pierluigi, para hablar en directo del sitio y de Origins TCG con su chat. Gracias de corazón: por el espacio, por el entusiasmo que aporta al juego y por presentarnos a su comunidad. Varias novedades de este artículo nacieron en esa transmisión: los filtros de mazos siempre a la vista, el filtro por tipo de autor y "Envíanos tu guía".

## Gracias por escribirnos {#gracias-comentarios}

El buzón de comentarios lleva abierto pocos días y el equipo lee cada mensaje. La búsqueda en el texto de las cartas nació así, de un mensaje sin firma: gracias, seas quien seas. Desde hoy el buzón también tiene un campo opcional para tu nombre o apodo, para que sepamos a quién dar las gracias (nunca lo publicamos sin preguntarte). Sigue escribiéndonos: desde el buzón de comentarios, abajo a la derecha, con [Envíanos tu guía](/es/guides/submit) o en nuestro Discord.`,
    ),
    faq: {
      en: [
        {
          q: "How do I find the On Reveal cards in the deck builder?",
          a: "Type Reveal in the deck builder search: the cards with On Reveal in their text remain. The search looks at the name, the saga and the card text, and works the same way in the card database.",
        },
        {
          q: "How do I join the OriginsMeta Discord?",
          a: "Use the Discord logo in the top menu (on a phone, inside Menu) or the button at the end of every article. It is the OriginsMeta server, separate from the official Origins TCG Discord run by Koin Games.",
        },
        {
          q: "How can I suggest a change to the site?",
          a: "Use the feedback box at the bottom right: one sentence is enough, name and email are optional. Guides go through Send us your guide, in the Guides section.",
        },
      ],
      it: [
        {
          q: "Come trovo nel deck builder le carte con un'abilità Alla rivelazione?",
          a: "Scrivi rivelazione (o Reveal) nella ricerca del deck builder: restano le carte con un'abilità Alla rivelazione. La ricerca guarda il nome, la saga e il testo della carta, anche in inglese, e funziona allo stesso modo nel database carte.",
        },
        {
          q: "Come entro nel Discord di OriginsMeta?",
          a: "Dal loghino di Discord nel menu in alto (sul telefono dentro Menu) o dal tasto in fondo a ogni news. È il server di OriginsMeta, diverso dal Discord ufficiale di Origins TCG gestito da Koin Games.",
        },
        {
          q: "Come suggerisco una novità per il sito?",
          a: "Dal pop-up Dicci la tua, in basso a destra: basta una frase, nome ed email sono facoltativi. Le guide si mandano da Mandaci la tua guida, nella sezione Guide.",
        },
      ],
      es: [
        {
          q: "¿Cómo encuentro las cartas con una habilidad Al revelar en el deck builder?",
          a: "Escribe revelar (o Reveal) en la búsqueda del deck builder: quedan las cartas con una habilidad Al revelar. La búsqueda mira el nombre, la saga y el texto de la carta, y funciona igual en la base de datos de cartas.",
        },
        {
          q: "¿Cómo me uno al Discord de OriginsMeta?",
          a: "Usa el logo de Discord del menú superior (en el teléfono, dentro de Menú) o el botón al final de cada artículo. Es el servidor de OriginsMeta, distinto del Discord oficial de Origins TCG, que gestiona Koin Games.",
        },
        {
          q: "¿Cómo puedo sugerir un cambio en el sitio?",
          a: "Usa el buzón de comentarios, abajo a la derecha: basta con una frase, y el nombre y el correo electrónico son opcionales. Las guías se envían con Envíanos tu guía, en la sección Guías.",
        },
      ],
    },
    url: "/deck-builder",
    source: "site",
  },
  {
    slug: "demo-patch-notes-0921",
    image: "/cards/cover/dorothy.webp",
    cards: ["dorothy", "wicked-stepmother", "christopher-robin", "guy-of-gisborne", "quasimodo", "beauty", "magic-carpet", "roo", "itsy-bitsy-spider", "silver-bullet", "don-quixote", "heroic-charge", "frog-prince", "wooden-stake"],
    guides: ["steam-next-fest-2026"],
    date: "2026-09-21",
    // 25/09/2026 (Ondata 2, COMP-08): la nota sul nome "patch 0.7" che usano alcuni creator, nel testo e nelle FAQ.
    // 30/09/2026: il numero 0.7 è ufficialmente quello dell'aggiornamento successivo, del 29/09 (news `patch-0-7`).
    updated: "2026-09-30",
    title: n(
      "Origins TCG demo patch notes, 21 September: Dorothy costs 4, 14 cards change and The Gallows is fixed",
      "Patch notes della demo del 21 settembre: Dorothy costa 4, cambiano 14 carte e The Gallows è corretto",
      "Notas del parche de la demo del 21 de septiembre: Dorothy cuesta 4, cambian 14 cartas y se corrige The Gallows",
    ),
    metaTitle: n("Origins TCG demo patch notes, 21 September", "Patch notes della demo di Origins TCG del 21/9", "Origins TCG: notas del parche de la demo, 21 de septiembre"),
    description: n(
      "The Origins TCG demo patch of 21 September: Dorothy down to 4 mana, stat and text changes for 14 cards, two game rules and The Gallows location.",
      "La patch della demo di Origins TCG del 21 settembre: Dorothy a 4 mana, statistiche e testi di 14 carte, due regole di gioco e il luogo The Gallows.",
      "Parche de la demo de Origins TCG del 21 de septiembre: Dorothy cuesta 4, estadísticas y textos de 14 cartas, dos reglas de juego y la ubicación The Gallows.",
    ),
    summary: n(
      "The balance changes of the 21 September demo update, compared to the last playtest build: Dorothy drops to 4 mana, eight cards change stats, Itsy Bitsy Spider turns Evil, six cards change what they do, and two game rules and The Gallows are fixed.",
      "Le modifiche di bilanciamento dell'aggiornamento della demo del 21 settembre, rispetto all'ultima build del playtest: Dorothy scende a 4 mana, otto carte cambiano statistiche, Itsy Bitsy Spider diventa Malvagia, sei carte cambiano effetto, e si correggono due regole di gioco e The Gallows.",
      "Los cambios de equilibrio de la actualización de la demo del 21 de septiembre, comparados con la última build del playtest: Dorothy baja a 4 de maná, ocho cartas cambian sus estadísticas, Itsy Bitsy Spider pasa a ser Evil, seis cartas cambian lo que hacen, y se corrigen dos reglas de juego y The Gallows.",
    ),
    highlights: {
      en: [
        { label: "Dorothy costs 4", text: "one mana less for the Legendary that grows every time an ally moves", anchor: "dorothy" },
        { label: "Wicked Stepmother up to 4 Power", text: "the Deathtouch Legendary goes from 3/6 to 4/6", anchor: "wicked-stepmother" },
        { label: "Christopher Robin back to 5/4", text: "the stats he had before patch 0.6.3", anchor: "christopher-robin" },
        { label: "Five more stat changes", text: "Guy of Gisborne, Quasimodo, Beauty, Magic Carpet and Roo", anchor: "stats" },
        { label: "Itsy Bitsy Spider turns Evil", text: "from Neutral, with every Evil synergy that follows", anchor: "itsy-bitsy-spider" },
        { label: "Six cards change what they do", text: "Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet, Wooden Stake", anchor: "text-changes" },
        { label: "Two game rules", text: "stats kept in the graveyard, Before combat ahead of Temporary discards", anchor: "rules" },
        { label: "The Gallows fixed", text: "no more destroying at the location a character is moved to", anchor: "the-gallows" },
      ],
      it: [
        { label: "Dorothy costa 4", text: "un mana in meno per la Leggendaria che cresce ogni volta che un alleato si muove", anchor: "dorothy" },
        { label: "Wicked Stepmother sale a 4 di Potenza", text: "la Leggendaria con Tocco letale passa da 3/6 a 4/6", anchor: "wicked-stepmother" },
        { label: "Christopher Robin torna 5/4", text: "le statistiche che aveva prima della patch 0.6.3", anchor: "christopher-robin" },
        { label: "Altre cinque carte cambiano statistiche", text: "Guy of Gisborne, Quasimodo, Beauty, Magic Carpet e Roo", anchor: "statistiche" },
        { label: "Itsy Bitsy Spider diventa Malvagia", text: "da Neutrale, con tutte le sinergie Malvagie che ne seguono", anchor: "itsy-bitsy-spider" },
        { label: "Sei carte cambiano effetto", text: "Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet, Wooden Stake", anchor: "effetti" },
        { label: "Due regole di gioco", text: "statistiche conservate nel cimitero, Before combat prima degli scarti Temporary", anchor: "regole" },
        { label: "The Gallows corretto", text: "non distrugge più nel luogo in cui il personaggio viene spostato", anchor: "the-gallows" },
      ],
      es: [
        { label: "Dorothy cuesta 4", text: "un maná menos para la Legendaria que crece cada vez que un aliado se mueve", anchor: "dorothy" },
        { label: "Wicked Stepmother sube a 4 de Poder", text: "la Legendaria con Toque mortal pasa de 3/6 a 4/6", anchor: "wicked-stepmother" },
        { label: "Christopher Robin vuelve a 5/4", text: "las estadísticas que tenía antes del parche 0.6.3", anchor: "christopher-robin" },
        { label: "Otros cinco cambios de estadísticas", text: "Guy of Gisborne, Quasimodo, Beauty, Magic Carpet y Roo", anchor: "estadisticas" },
        { label: "Itsy Bitsy Spider pasa a ser Evil", text: "de Neutral, con todas las sinergias Evil que eso implica", anchor: "itsy-bitsy-spider" },
        { label: "Seis cartas cambian lo que hacen", text: "Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet, Wooden Stake", anchor: "efectos" },
        { label: "Dos reglas de juego", text: "las estadísticas se conservan en el cementerio, Before combat antes de los descartes de Temporary", anchor: "reglas" },
        { label: "Se corrige The Gallows", text: "ya no destruye en la ubicación a la que se mueve un personaje", anchor: "the-gallows" },
      ],
    },
    body: n(
      `## All the stat changes {#stats}

The numbers are compared to the last playtest build, 0.6.3: the same stats the card database on this site used until this patch. Format: mana · Power/Health; ★ marks the Legendaries.

| Card | Before | After | What changes |
| --- | --- | --- | --- |
| Dorothy ★ | 5 · 1/1 | 4 · 1/1 | costs 1 less |
| Wicked Stepmother ★ | 4 · 3/6 | 4 · 4/6 | +1 Power |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | back to the stats before 0.6.3 |
| Guy of Gisborne | 6 · 3/3 | 6 · 4/4 | +1 Power, +1 Health |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | +1 Power, −1 Health |
| Beauty | 4 · 1/1 | 4 · 2/1 | +1 Power |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | +1 Power, and a new rule on its buffs |
| Roo | 2 · 2/3 | 2 · 2/4 | +1 Health |
| Itsy Bitsy Spider | 0 · 1/1, Neutral | 0 · 1/1, Evil | changes alignment |

## The two Legendaries {#legendaries}

### Dorothy costs 4 {#dorothy}

Dorothy can Move each round and has +1/+1 for each time an ally moved this game. At 4 mana she comes down one round earlier, with one more round to grow. In the same patch Roo, a 2-mana character with Move, gains 1 Health.

### Wicked Stepmother up to 4 Power {#wicked-stepmother}

The Legendary with Deathtouch, whose On Reveal gives Deathtouch to your Evil characters, goes from 3/6 to 4/6.

## Christopher Robin back to 5/4 {#christopher-robin}

Patch 0.6.3 had turned him from 5/4 into 4/5, sturdier but hitting softer. The demo patch puts the old stats back. This line is in the patch notes posted on the official Discord, not in the Steam post.

## Itsy Bitsy Spider turns Evil {#itsy-bitsy-spider}

The 0-mana 1/1 goes from Neutral to Evil. It matters for every card that counts Evil characters: Wicked Stepmother's On Reveal, for one, now gives it Deathtouch too.

## Six cards change what they do {#text-changes}

### Silver Bullet {#silver-bullet}

It can now target barriers as well as characters.

### Don Quixote {#don-quixote}

He gained Defender: that is all the patch notes say about him.

### Heroic Charge {#heroic-charge}

The spell gives allies +2 Power and Trample this round. When it is repeated, the +2 Power buff now applies again.

### Frog Prince and Magic Carpet {#frog-prince-magic-carpet}

Both have a "Choose One" On Reveal. Buffs they already had are no longer cleared when they are played, and if they go back to hand they can choose again. Magic Carpet also gains 1 Power.

### Wooden Stake {#wooden-stake}

It can now target characters at full Health, but it still fails if the target is not damaged by the time it reveals.

## Two game rules {#rules}

### Stats stay in the graveyard {#graveyard}

A character's stats are no longer reset in the graveyard. A buffed character with Rebirth comes back to the board still buffed, though at 1 Health.

### Before combat, then Temporary discards {#before-combat}

"Before combat" abilities now trigger before Temporary cards are discarded.

## The Gallows {#the-gallows}

The location always destroys the enemy across from the space a character entered. If an On Reveal ability moves that character to a different location, The Gallows no longer destroys the opposing character at the new location.

## Where these notes come from {#sources}

- The official Steam post of 21 September, the one announcing the update, lists the stat changes and the six cards that change what they do, "compared to the latest playtest build". The team's Reddit post says the same.
- The version posted on the official Discord adds Christopher Robin, the two game rules and The Gallows. We report it in full.

The patch has no version number: the team calls it the demo patch notes of 21 September. Some creators called it "patch 0.7", but that number is not in the official posts about this update. On this site it appears as "Demo · 21 Sep".

**Update, 25 September:** we added the note on the name "patch 0.7", which some creators use for this update.

**Update, 30 September:** the number 0.7 officially belongs to the next update, Steam Demo Update #2 of 29 September, the last balance patch before the Crimson Cup: all its changes are in [the patch 0.7 notes](/en/news/patch-0-7). The stats in this article are the ones before that patch.

## What changes on OriginsMeta {#on-the-site}

- Every card page shows the new stats and the change in its balance history, with a link to the Steam post.
- [MetaShifting](/en/metashifting) lists the patch next to the playtest ones.
- The [deck builder](/en/deck-builder) uses the new costs: Dorothy now counts as a 4-drop in the mana curve.
- The official text of the six cards that change what they do will be updated when the community card database imports the patch. Until then, the balance history on each card page explains the change.

Everything else in the update, from the new interface to ranked mode at Steam Next Fest, is in [the article on the first big demo update](/en/news/demo-first-big-update).`,
      `## Tutte le modifiche alle statistiche {#statistiche}

I numeri sono confrontati con l'ultima build del playtest, la 0.6.3: le stesse statistiche che il database carte del sito usava fino a questa patch. Formato: mana · Potenza/Salute; ★ indica le Leggendarie.

| Carta | Prima | Dopo | Cosa cambia |
| --- | --- | --- | --- |
| Dorothy ★ | 5 · 1/1 | 4 · 1/1 | costa 1 in meno |
| Wicked Stepmother ★ | 4 · 3/6 | 4 · 4/6 | +1 Potenza |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | torna alle statistiche prima della 0.6.3 |
| Guy of Gisborne | 6 · 3/3 | 6 · 4/4 | +1 Potenza, +1 Salute |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | +1 Potenza, −1 Salute |
| Beauty | 4 · 1/1 | 4 · 2/1 | +1 Potenza |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | +1 Potenza, e una regola nuova sui potenziamenti |
| Roo | 2 · 2/3 | 2 · 2/4 | +1 Salute |
| Itsy Bitsy Spider | 0 · 1/1, Neutrale | 0 · 1/1, Malvagia | cambia allineamento |

## Le due Leggendarie {#leggendarie}

### Dorothy costa 4 {#dorothy}

Dorothy può muoversi a ogni round e ha +1/+1 per ogni volta che un alleato si è mosso nella partita. A 4 mana scende un round prima, con un round in più per crescere. Nella stessa patch Roo, un personaggio da 2 mana con Muovere, guadagna 1 di Salute.

### Wicked Stepmother sale a 4 di Potenza {#wicked-stepmother}

La Leggendaria con Tocco letale, la cui abilità Alla rivelazione dà Tocco letale ai tuoi personaggi Malvagi, passa da 3/6 a 4/6.

## Christopher Robin torna 5/4 {#christopher-robin}

La patch 0.6.3 lo aveva portato da 5/4 a 4/5, più resistente ma meno incisivo. La patch della demo rimette le vecchie statistiche. Questa riga è nelle patch notes pubblicate sul Discord ufficiale, non nel post su Steam.

## Itsy Bitsy Spider diventa Malvagia {#itsy-bitsy-spider}

La 1/1 da 0 mana passa da Neutrale a Malvagia. Conta per tutte le carte che guardano ai personaggi Malvagi: l'abilità Alla rivelazione di Wicked Stepmother, per esempio, ora dà Tocco letale anche a lei.

## Sei carte cambiano effetto {#effetti}

### Silver Bullet {#silver-bullet}

Ora può colpire anche le barriere, oltre ai personaggi.

### Don Quixote {#don-quixote}

Ha ottenuto Difensore: è tutto quello che le patch notes dicono di lui.

### Heroic Charge {#heroic-charge}

La magia dà agli alleati +2 Potenza e Travolgere per il round. Quando viene ripetuta, il bonus di +2 Potenza ora si applica di nuovo.

### Frog Prince e Magic Carpet {#frog-prince-magic-carpet}

Hanno entrambi un'abilità Alla rivelazione a scelta ("Choose One"). Quando vengono giocati non perdono più i potenziamenti che avevano già, e se tornano in mano possono scegliere di nuovo. Magic Carpet guadagna anche 1 di Potenza.

### Wooden Stake {#wooden-stake}

Ora può bersagliare personaggi con la Salute piena, ma fallisce comunque se il bersaglio non è danneggiato quando si rivela.

## Due regole di gioco {#regole}

### Le statistiche restano nel cimitero {#cimitero}

Le statistiche di un personaggio non si azzerano più nel cimitero. Un personaggio potenziato con Rinascita torna sul tabellone ancora potenziato, anche se con 1 di Salute.

### Prima il Before combat, poi gli scarti Temporary {#before-combat}

Le abilità "Before combat" ora si attivano prima che le carte Temporary vengano scartate.

## The Gallows {#the-gallows}

Il luogo distrugge sempre il nemico di fronte allo spazio in cui è entrato il personaggio. Se un'abilità Alla rivelazione sposta quel personaggio in un altro luogo, The Gallows non distrugge più il personaggio avversario nel nuovo luogo.

## Da dove arrivano queste note {#fonti}

- Il post ufficiale su Steam del 21 settembre, quello che annuncia l'aggiornamento, elenca le modifiche alle statistiche e le sei carte che cambiano effetto, "rispetto all'ultima build del playtest". Il post del team su Reddit dice lo stesso.
- La versione pubblicata sul Discord ufficiale aggiunge Christopher Robin, le due regole di gioco e The Gallows. La riportiamo per intero.

La patch non ha un numero di versione: il team la chiama patch notes della demo del 21 settembre. Alcuni creator la chiamavano "patch 0.7", ma quel numero non c'è nei post ufficiali su questo aggiornamento. Sul sito compare come "Demo · 21 set".

**Aggiornamento del 25 settembre:** abbiamo aggiunto la nota sul nome "patch 0.7", che alcuni creator usano per questo aggiornamento.

**Aggiornamento del 30 settembre:** il numero 0.7 è ufficialmente quello dell'aggiornamento successivo, lo Steam Demo Update #2 del 29 settembre, l'ultima patch di bilanciamento prima della Crimson Cup: tutte le sue modifiche sono nelle [patch notes della 0.7](/it/news/patch-0-7). Le statistiche di questo articolo sono quelle di prima di quella patch.

## Cosa cambia su OriginsMeta {#sul-sito}

- Ogni scheda carta mostra le statistiche nuove e la modifica nello storico dei bilanciamenti, con il link al post su Steam.
- Il [MetaShifting](/it/metashifting) elenca la patch accanto a quelle del playtest.
- Il [deck builder](/it/deck-builder) usa i costi nuovi: Dorothy ora conta come carta da 4 nella curva di mana.
- Il testo ufficiale delle sei carte che cambiano effetto sarà aggiornato quando il database carte della community importerà la patch. Fino ad allora lo storico dei bilanciamenti di ogni scheda spiega la modifica.

Tutto il resto dell'aggiornamento, dall'interfaccia nuova alla classificata allo Steam Next Fest, è nell'[articolo sul primo grande aggiornamento della demo](/it/news/demo-first-big-update).`,
      `## Todos los cambios de estadísticas {#estadisticas}

Los números se comparan con la última build del playtest, la 0.6.3: las mismas estadísticas que usaba la base de datos de cartas de este sitio hasta este parche. Formato: maná · Poder/Salud; ★ marca las Legendarias.

| Carta | Antes | Después | Qué cambia |
| --- | --- | --- | --- |
| Dorothy ★ | 5 · 1/1 | 4 · 1/1 | cuesta 1 menos |
| Wicked Stepmother ★ | 4 · 3/6 | 4 · 4/6 | +1 Poder |
| Christopher Robin | 4 · 4/5 | 4 · 5/4 | vuelve a las estadísticas de antes de la 0.6.3 |
| Guy of Gisborne | 6 · 3/3 | 6 · 4/4 | +1 Poder, +1 Salud |
| Quasimodo | 3 · 2/5 | 3 · 3/4 | +1 Poder, −1 Salud |
| Beauty | 4 · 1/1 | 4 · 2/1 | +1 Poder |
| Magic Carpet | 4 · 3/4 | 4 · 4/4 | +1 Poder, y una regla nueva sobre sus buffs |
| Roo | 2 · 2/3 | 2 · 2/4 | +1 Salud |
| Itsy Bitsy Spider | 0 · 1/1, Neutral | 0 · 1/1, Evil | cambia de alineamiento |

## Las dos Legendarias {#legendarias}

### Dorothy cuesta 4 {#dorothy}

Dorothy puede usar Mover en cada ronda y tiene +1/+1 por cada vez que un aliado se movió en esta partida. Con coste 4 se puede jugar una ronda antes, con una ronda más para crecer. En el mismo parche Roo, un personaje de coste 2 con Mover, gana 1 de Salud.

### Wicked Stepmother sube a 4 de Poder {#wicked-stepmother}

La Legendaria con Toque mortal, cuya habilidad Al revelar da Toque mortal a tus personajes Evil, pasa de 3/6 a 4/6.

## Christopher Robin vuelve a 5/4 {#christopher-robin}

El parche 0.6.3 lo había cambiado de 5/4 a 4/5: más resistente, pero con menos pegada. El parche de la demo recupera las estadísticas anteriores. Esta línea está en las notas del parche publicadas en el Discord oficial, no en la publicación de Steam.

## Itsy Bitsy Spider pasa a ser Evil {#itsy-bitsy-spider}

La 1/1 de coste 0 pasa de Neutral a Evil. Importa para todas las cartas que cuentan personajes Evil: la habilidad Al revelar de Wicked Stepmother, por ejemplo, ahora también le da Toque mortal a ella.

## Seis cartas cambian lo que hacen {#efectos}

### Silver Bullet {#silver-bullet}

Ahora puede tener como objetivo barreras, además de personajes.

### Don Quixote {#don-quixote}

Ahora tiene Defensor: es todo lo que dicen de él las notas del parche.

### Heroic Charge {#heroic-charge}

El hechizo da a los aliados +2 de Poder y Arrollar durante esta ronda. Cuando se repite, el buff de +2 de Poder ahora se vuelve a aplicar.

### Frog Prince y Magic Carpet {#frog-prince-magic-carpet}

Las dos cartas tienen una habilidad Al revelar de "Choose One". Al jugarlas ya no pierden los buffs que tenían, y si vuelven a la mano pueden elegir de nuevo. Magic Carpet también gana 1 de Poder.

### Wooden Stake {#wooden-stake}

Ahora puede tener como objetivo personajes con la Salud completa, pero sigue fallando si el objetivo no está dañado en el momento en que se revela.

## Dos reglas de juego {#reglas}

### Las estadísticas se mantienen en el cementerio {#cementerio}

Las estadísticas de un personaje ya no se restablecen en el cementerio. Un personaje con buffs y Renacer vuelve al tablero con sus buffs, aunque con 1 de Salud.

### Primero Before combat, luego los descartes de Temporary {#before-combat}

Las habilidades "Before combat" ahora se activan antes de que se descarten las cartas Temporary.

## The Gallows {#the-gallows}

La ubicación siempre destruye al enemigo situado frente al espacio en el que entró un personaje. Si una habilidad Al revelar mueve a ese personaje a otra ubicación, The Gallows ya no destruye al personaje rival en la nueva ubicación.

## De dónde vienen estas notas {#fuentes}

- La publicación oficial de Steam del 21 de septiembre, la que anuncia la actualización, enumera los cambios de estadísticas y las seis cartas que cambian lo que hacen, "en comparación con la última build del playtest". La publicación del equipo en Reddit dice lo mismo.
- La versión publicada en el Discord oficial añade Christopher Robin, las dos reglas de juego y The Gallows. La reproducimos completa.

El parche no tiene número de versión: el equipo lo llama las notas del parche de la demo del 21 de septiembre. Algunos creadores de contenido lo llamaban "patch 0.7", pero ese número no está en las publicaciones oficiales sobre esta actualización. En este sitio aparece como "Demo · 21 sep".

**Actualización del 25 de septiembre:** hemos añadido la nota sobre el nombre "patch 0.7", que algunos creadores de contenido usan para esta actualización.

**Actualización del 30 de septiembre:** el número 0.7 corresponde oficialmente a la actualización siguiente, la Steam Demo Update #2 del 29 de septiembre, el último parche de equilibrio antes de la Crimson Cup: todos sus cambios están en [las notas del parche 0.7](/es/news/patch-0-7). Las estadísticas de este artículo son las de antes de ese parche.

## Qué cambia en OriginsMeta {#en-el-sitio}

- Cada página de carta muestra las nuevas estadísticas y el cambio en su historial de equilibrio, con un enlace a la publicación de Steam.
- [MetaShifting](/es/metashifting) muestra el parche junto a los del playtest.
- El [deck builder](/es/deck-builder) usa los nuevos costes: Dorothy ahora cuenta como carta de coste 4 en la curva de maná.
- El texto oficial de las seis cartas que cambian lo que hacen se actualizará cuando la base de datos de cartas de la comunidad importe el parche. Hasta entonces, el historial de equilibrio de cada página de carta explica el cambio.

Todo lo demás de la actualización, desde la nueva interfaz hasta la clasificatoria en el Steam Next Fest, está en [el artículo sobre la primera gran actualización de la demo](/es/news/demo-first-big-update).`,
    ),
    faq: {
      en: [
        { q: "What changed in the Origins TCG demo patch of 21 September?", a: "Dorothy costs 4 instead of 5; Wicked Stepmother, Christopher Robin, Guy of Gisborne, Quasimodo, Beauty, Magic Carpet and Roo change stats; Itsy Bitsy Spider becomes Evil; Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet and Wooden Stake change what they do; two game rules and The Gallows location are fixed." },
        { q: "Is this Origins TCG patch 0.7?", a: "No. Some creators called it patch 0.7, but this update has no version number: the team calls it the demo patch notes of 21 September 2026, with the changes compared to the last playtest build, 0.6.3. Patch 0.7 is the next update, Steam Demo Update #2 of 29 September 2026." },
        { q: "Should I build my Crimson Cup decks on these stats?", a: "On those of patch 0.7, which came after this one: on 29 September 2026 the team released it as the final balance patch before the tournament, with Twister Toss reworked and Bagheera, Mind Palace and Spellbook costing 1 more. The tentative card list of the Crimson Cup arrived with the 21 September update; the tournament runs from 20 to 25 October 2026." },
      ],
      it: [
        { q: "Cosa cambia con la patch della demo di Origins TCG del 21 settembre?", a: "Dorothy costa 4 invece di 5; Wicked Stepmother, Christopher Robin, Guy of Gisborne, Quasimodo, Beauty, Magic Carpet e Roo cambiano statistiche; Itsy Bitsy Spider diventa Malvagia; Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet e Wooden Stake cambiano effetto; si correggono due regole di gioco e il luogo The Gallows." },
        { q: "È la patch 0.7 di Origins TCG?", a: "No. Alcuni creator la chiamavano patch 0.7, ma questo aggiornamento non ha un numero di versione: il team lo chiama patch notes della demo del 21 settembre 2026, con le modifiche confrontate con l'ultima build del playtest, la 0.6.3. La patch 0.7 è l'aggiornamento successivo, lo Steam Demo Update #2 del 29 settembre 2026." },
        { q: "Devo costruire i mazzi per la Crimson Cup su queste statistiche?", a: "Su quelle della patch 0.7, arrivata dopo: il 29 settembre 2026 il team l'ha pubblicata come ultima patch di bilanciamento prima del torneo, con Twister Toss rifatta e Bagheera, Mind Palace e Spellbook che costano 1 in più. La lista carte provvisoria della Crimson Cup è arrivata con l'aggiornamento del 21 settembre; il torneo si gioca dal 20 al 25 ottobre 2026." },
      ],
      es: [
        {
          q: "¿Qué cambia con el parche de la demo de Origins TCG del 21 de septiembre?",
          a: "Dorothy cuesta 4 en lugar de 5; Wicked Stepmother, Christopher Robin, Guy of Gisborne, Quasimodo, Beauty, Magic Carpet y Roo cambian sus estadísticas; Itsy Bitsy Spider pasa a ser Evil; Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet y Wooden Stake cambian lo que hacen; se corrigen dos reglas de juego y la ubicación The Gallows.",
        },
        {
          q: "¿Es el parche 0.7 de Origins TCG?",
          a: "No. Algunos creadores de contenido lo llamaban patch 0.7, pero esta actualización no tiene número de versión: el equipo la llama las notas del parche de la demo del 21 de septiembre de 2026, con los cambios comparados con la última build del playtest, la 0.6.3. El parche 0.7 es la actualización siguiente, la Steam Demo Update #2 del 29 de septiembre de 2026.",
        },
        {
          q: "¿Debo construir mis mazos para la Crimson Cup con estas estadísticas?",
          a: "Con las del parche 0.7, que llegó después: el 29 de septiembre de 2026 el equipo lo publicó como el último parche de equilibrio antes del torneo, con un rework de Twister Toss y un coste 1 más alto para Bagheera, Mind Palace y Spellbook. La lista provisional de cartas de la Crimson Cup llegó con la actualización del 21 de septiembre; el torneo se juega del 20 al 25 de octubre de 2026.",
        },
      ],
    },
    url: "https://store.steampowered.com/news/app/4429430/view/1844115010502611",
    source: "steam",
  },
  {
    slug: "demo-first-big-update",
    image: "/media/news-play-collect-trade.webp",
    guides: ["play-the-demo", "steam-next-fest-2026", "collector-economy", "origins-tcg-ranked"],
    date: "2026-09-21",
    // 30/09/2026: la patch di bilanciamento di cui parlava il team è uscita (0.7 del 29/09): paragrafo nella sezione Crimson Cup e FAQ
    updated: "2026-09-30",
    title: n(
      "Origins TCG's first big demo update: new UI, test packs, ranked at Next Fest and the Crimson Cup card list",
      "Il primo grande aggiornamento della demo di Origins TCG: pacchetti di prova, classificata e Crimson Cup",
      "La primera gran actualización de la demo de Origins TCG: sobres de prueba, clasificatoria y Crimson Cup",
    ),
    // Senza "Crimson Cup" dal 25/09/2026: sulla coppa vince l'articolo delle regole; qui restano interfaccia, pacchetti e classificata.
    // "Interfaccia"/"interfaz" come nelle description; in ogni lingua la classificata arriva col Next Fest, non il 21/9.
    metaTitle: n("Origins TCG demo update: new UI, test packs, ranked", "Origins TCG aggiorna la demo: interfaccia e classificata", "Origins TCG actualiza la demo: interfaz y clasificatoria"),
    description: n(
      "Origins TCG demo update of 21 September: new UI, test packs, the Crimson Cup card list, progress kept from demo and playtest, ranked at Next Fest.",
      "Aggiornamento della demo di Origins TCG del 21/9: nuova interfaccia, pacchetti di prova, lista carte Crimson Cup, progressi salvi e classificata al Next Fest.",
      "Demo de Origins TCG, 21 de septiembre: nueva interfaz, sobres de prueba, lista de la Crimson Cup, progreso guardado y clasificatoria en el Next Fest.",
    ),
    summary: n(
      "Koin Games updated the free Origins TCG demo on 21 September: a new interface and board, a collectors tutorial, test packs and the tentative Crimson Cup card list, with everyone's progress kept. Ranked mode switches on with Steam Next Fest.",
      "Il 21 settembre Koin Games ha aggiornato la demo gratuita di Origins TCG: interfaccia e tabellone nuovi, un tutorial per collezionisti, pacchetti di prova e la lista carte provvisoria della Crimson Cup, con i progressi di tutti salvi. La classificata parte con lo Steam Next Fest.",
      "Koin Games actualizó la demo gratuita de Origins TCG el 21 de septiembre: nueva interfaz y nuevo tablero, un tutorial para coleccionistas, sobres de prueba y la lista provisional de cartas de la Crimson Cup, sin que nadie pierda su progreso. La clasificatoria se activa con el Steam Next Fest.",
    ),
    highlights: {
      en: [
        { label: "New interface and board", text: "the screens around the match and the board are redrawn", anchor: "new-interface" },
        { label: "Collectors tutorial", text: "how collecting works, explained in the game", anchor: "collectors-tutorial" },
        { label: "Test packs", text: "packs to open inside the demo", anchor: "test-packs" },
        { label: "New voice lines", anchor: "voice-lines" },
        { label: "Balance changes", text: "Dorothy costs 4 and 14 cards change: full patch notes", anchor: "balance" },
        { label: "Ranked at Steam Next Fest", text: "from 19 October, with exclusive rewards", anchor: "ranked" },
        { label: "Crimson Cup card list", text: "tentative, tournament decks can be built now", anchor: "crimson-cup" },
        { label: "Progress kept", text: "whichever is further ahead between demo and playtest", anchor: "progress" },
        { label: "Playtest", text: "no new content, polish update later in the week", anchor: "playtest" },
      ],
      it: [
        { label: "Interfaccia e tabellone nuovi", text: "schermate della partita e tabellone ridisegnati", anchor: "interfaccia" },
        { label: "Tutorial per collezionisti", text: "come funziona il collezionare, spiegato nel gioco", anchor: "tutorial-collezionisti" },
        { label: "Pacchetti di prova", text: "da aprire dentro la demo", anchor: "pacchetti-di-prova" },
        { label: "Nuove voci", anchor: "nuove-voci" },
        { label: "Modifiche di bilanciamento", text: "Dorothy costa 4 e cambiano 14 carte: le patch notes complete", anchor: "bilanciamento" },
        { label: "Classificata allo Steam Next Fest", text: "dal 19 ottobre, con ricompense esclusive", anchor: "classificata" },
        { label: "Lista carte della Crimson Cup", text: "provvisoria, i mazzi per il torneo si preparano già", anchor: "crimson-cup" },
        { label: "Progressi salvi", text: "vale il percorso più avanzato tra demo e playtest", anchor: "progressi" },
        { label: "Playtest", text: "niente contenuti nuovi, rifinitura più avanti in settimana", anchor: "playtest" },
      ],
      es: [
        { label: "Nueva interfaz y nuevo tablero", text: "se rediseñan las pantallas en torno a la partida y el tablero", anchor: "nueva-interfaz" },
        { label: "Tutorial para coleccionistas", text: "cómo funciona el coleccionismo, explicado en el juego", anchor: "tutorial-coleccionistas" },
        { label: "Sobres de prueba", text: "sobres para abrir dentro de la demo", anchor: "sobres-de-prueba" },
        { label: "Nuevas líneas de voz", anchor: "lineas-de-voz" },
        { label: "Cambios de equilibrio", text: "Dorothy cuesta 4 y cambian 14 cartas: las notas del parche completas", anchor: "equilibrio" },
        { label: "Clasificatoria en el Steam Next Fest", text: "desde el 19 de octubre, con recompensas exclusivas", anchor: "clasificatoria" },
        { label: "Lista de cartas de la Crimson Cup", text: "provisional, ya se pueden construir los mazos del torneo", anchor: "crimson-cup" },
        { label: "Progreso conservado", text: "cuenta el más avanzado entre demo y playtest", anchor: "progreso" },
        { label: "Playtest", text: "sin contenido nuevo, la actualización de pulido llega más adelante en la semana", anchor: "playtest" },
      ],
    },
    body: n(
      `## What changes in the demo {#demo-changes}

The team calls it "the first big update to the Origins demo", and the word *first* suggests more will follow before the festival.

### A new interface and board {#new-interface}

The screens around the match have been upgraded and the game board has a new look.

### A collectors tutorial {#collectors-tutorial}

It explains the key aspects of collecting, the side that sets Origins apart from other digital card games: cards you open, own and trade. Our [collector economy guide](/en/guides/collector-economy) goes through the model step by step.

### Test packs {#test-packs}

Packs to open inside the demo, to try the collecting side of the game before the full launch.

### New voice lines {#voice-lines}

The update adds new voice lines; the announcement says nothing more about them.

### Balance changes {#balance}

The details came out the same evening, in the Steam post and on Discord: Dorothy drops to 4 mana, eight cards change stats, Itsy Bitsy Spider turns Evil, six cards change what they do, and two game rules and The Gallows location are fixed. Everything is in [the patch notes article](/en/news/demo-patch-notes-0921), and already in [MetaShifting](/en/metashifting) and in the balance history of every card it touches.

## Ranked mode opens with Steam Next Fest {#ranked}

The team will turn ranked mode on "with the start of Steam Next Fest", with exclusive ranked rewards whose details have not been announced. The festival runs from Monday 19 October 2026 at 10:00 Pacific time to Monday 26 October. When the ladder opens to everyone, OriginsMeta's first real [tier list](/en/tier-list) starts too, built on the results.

## The Crimson Cup card list is in the game {#crimson-cup}

The update also carries the tentative card list of the Crimson Cup, the biggest tournament Koin Games has run so far, from 20 to 25 October: regional qualifiers on the 20th, 21st and 22nd, then playoffs and finals, in the Conquest format, best of three, with a best-of-five grand final. The prizes are worth 10,000 dollars in total, between cash, promo cards, packs and Alpha Edition boxes: it is not a cash prize pool.

"Barring upcoming balance patches, you can start cooking decks for the tournament", the team writes. Two tools to start with:

- the [deck builder](/en/deck-builder), whose tournament mode checks the Conquest rules while you build;
- the [Steam Next Fest guide](/en/guides/steam-next-fest-2026), with dates, times and how to sign up on Discord.

**Update, 30 September:** the balance patch came on 29 September. [Patch 0.7](/en/news/patch-0-7), which the team calls the final balance patch before the tournament, reworks Twister Toss and makes Bagheera, Mind Palace and Spellbook cost 1 more.

## Progress: what you keep {#progress}

This was the question left open. On 16 September a staff message on Discord had confirmed that [deck unlocks and boss progress would move from Demo 1 to Demo 2](/en/news/demo-2-progress-carryover), but it said nothing about the closed playtest. Now the team is explicit: whoever played the demo, the playtest or both keeps the progress of whichever is further ahead, "so no one will have to unlock cards again".

It matters because unlocking is slow. In the playtest every deck opens after three ranked wins plus a win against an AI boss, the path players had called punishing in the [feedback of 14 September](/en/news/playtest-feedback-deck-unlock).

## And the playtest? {#playtest}

Whoever plays the closed playtest gets no new decks, cards or bosses with this update. The polish part reaches the playtest later this week, together with other changes the team wants to test with players: anyone grinding ranked matches there will have to wait a few days.

## What we don't know yet {#open-questions}

- What the exclusive ranked rewards are.
- Whether deckbuilding is already open to everyone in the public demo: the announcement does not say.

**Update, 22 September:** two questions are answered. The balance details are out ([patch notes](/en/news/demo-patch-notes-0921)), and the announcement is now on Steam too, where it was published at 21:59 UTC on 21 September.

## The rumour that got it right {#rumour}

Last week a line went around on social media about a "Demo Season 2" coming the following week, with new decks, new rewards and a first taste of collecting. We [reported it as a rumour](/en/news/demo-2-animations-and-fixes), because no official post confirmed it. The timing and the collecting part turned out to be right.`,
      `## Cosa cambia nella demo {#cosa-cambia}

Il team lo chiama "il primo grande aggiornamento della demo di Origins", e quel *primo* lascia intendere che altri seguiranno prima del festival.

### Interfaccia e tabellone nuovi {#interfaccia}

Le schermate intorno alla partita sono state rinnovate e il tabellone ha un aspetto nuovo.

### Un tutorial per collezionisti {#tutorial-collezionisti}

Spiega gli aspetti chiave del collezionare, la parte che distingue Origins dagli altri giochi di carte digitali: carte che si aprono, si possiedono e si scambiano. La nostra [guida all'economia da collezione](/it/guides/collector-economy) spiega il modello passo per passo.

### Pacchetti di prova {#pacchetti-di-prova}

Pacchetti da aprire dentro la demo, per provare il lato collezionistico del gioco prima dell'uscita completa.

### Nuove voci {#nuove-voci}

L'aggiornamento aggiunge nuove voci al gioco; l'annuncio non dice altro.

### Modifiche di bilanciamento {#bilanciamento}

Il dettaglio è uscito la sera stessa, nel post su Steam e sul Discord: Dorothy scende a 4 mana, otto carte cambiano statistiche, Itsy Bitsy Spider diventa Malvagia, sei carte cambiano effetto, e si correggono due regole di gioco e il luogo The Gallows. È tutto nell'[articolo sulle patch notes](/it/news/demo-patch-notes-0921), e già nel [MetaShifting](/it/metashifting) e nello storico di ogni carta toccata.

## La classificata parte con lo Steam Next Fest {#classificata}

Il team accenderà la modalità classificata "con l'inizio dello Steam Next Fest", con ricompense esclusive i cui dettagli non sono ancora stati annunciati. Il festival va da lunedì 19 ottobre 2026 alle 19:00 italiane a lunedì 26 ottobre. Quando la ladder si apre a tutti parte anche la prima vera [tier list](/it/tier-list) di OriginsMeta, costruita sui risultati.

## La lista carte della Crimson Cup è nel gioco {#crimson-cup}

L'aggiornamento contiene anche la lista carte provvisoria della Crimson Cup, il torneo più grande organizzato finora da Koin Games, dal 20 al 25 ottobre: qualificazioni regionali il 20, 21 e 22, poi playoff e finali, in formato Conquest al meglio delle tre partite, con la finalissima al meglio delle cinque. I premi valgono 10.000 dollari in tutto, tra denaro, carte promo, pacchetti e box dell'Alpha Edition: non è un montepremi in contanti.

"Salvo le prossime patch di bilanciamento, potete iniziare a preparare i mazzi per il torneo", scrive il team. Due strumenti per cominciare:

- il [deck builder](/it/deck-builder), che in modalità torneo controlla le regole del Conquest mentre costruisci;
- la [guida allo Steam Next Fest](/it/guides/steam-next-fest-2026), con date, orari e come iscriversi su Discord.

**Aggiornamento del 30 settembre:** la patch di bilanciamento è arrivata il 29 settembre. La [patch 0.7](/it/news/patch-0-7), che il team chiama l'ultima patch di bilanciamento prima del torneo, cambia l'effetto di Twister Toss e fa costare 1 in più Bagheera, Mind Palace e Spellbook.

## I progressi: cosa si conserva {#progressi}

Era la domanda rimasta aperta. Il 16 settembre un messaggio dello staff su Discord aveva confermato che [gli sblocchi dei mazzi e i progressi contro i boss sarebbero passati dalla Demo 1 alla Demo 2](/it/news/demo-2-progress-carryover), ma del playtest chiuso non diceva nulla. Ora il team è esplicito: chi ha giocato la demo, il playtest o entrambi conserva i progressi del percorso più avanzato, "così nessuno dovrà sbloccare di nuovo le carte".

Conta perché sbloccare è lento. Nel playtest ogni mazzo si apre dopo tre vittorie in classificata più una vittoria contro un boss IA, il percorso che i giocatori avevano definito punitivo nel [feedback del 14 settembre](/it/news/playtest-feedback-deck-unlock).

## E il playtest? {#playtest}

Chi gioca il playtest chiuso non riceve nuovi mazzi, carte o boss con questo aggiornamento. La parte di rifinitura arriva sul playtest più avanti in settimana, insieme ad altre novità che il team vuole provare con i giocatori: chi macina partite classificate lì dovrà pazientare qualche giorno.

## Cosa non sappiamo ancora {#domande-aperte}

- In cosa consistono le ricompense esclusive della classificata.
- Se il deck builder è già aperto a tutti nella demo pubblica: l'annuncio non lo dice.

**Aggiornamento del 22 settembre:** due risposte sono arrivate. Il dettaglio del bilanciamento è pubblico (le [patch notes](/it/news/demo-patch-notes-0921)) e l'annuncio ora c'è anche su Steam, dove è uscito alle 23:59 italiane del 21 settembre.

## Il rumor che ci aveva preso {#rumor}

La settimana scorsa girava sui social una frase su una "Demo Season 2" in arrivo la settimana successiva, con nuovi mazzi, nuove ricompense e un primo assaggio del collezionare. L'avevamo [riportata come rumor](/it/news/demo-2-animations-and-fixes), perché nessun post ufficiale la confermava. I tempi e la parte sul collezionismo si sono rivelati giusti.`,
      `## Qué cambia en la demo {#cambios-en-la-demo}

El equipo la llama "la primera gran actualización de la demo de Origins", y la palabra *primera* hace pensar que habrá más antes del festival.

### Nueva interfaz y nuevo tablero {#nueva-interfaz}

Las pantallas en torno a la partida se han renovado y el tablero de juego tiene un aspecto nuevo.

### Un tutorial para coleccionistas {#tutorial-coleccionistas}

Explica los aspectos clave del coleccionismo, la faceta que distingue a Origins de otros juegos de cartas digitales: cartas que abres, posees e intercambias. Nuestra [guía de la economía de coleccionismo](/es/guides/collector-economy) explica el modelo paso a paso.

### Sobres de prueba {#sobres-de-prueba}

Sobres para abrir dentro de la demo, para probar la faceta coleccionable del juego antes del lanzamiento completo.

### Nuevas líneas de voz {#lineas-de-voz}

La actualización añade nuevas líneas de voz; el anuncio no dice nada más sobre ellas.

### Cambios de equilibrio {#equilibrio}

Los detalles salieron esa misma noche, en la publicación de Steam y en Discord: Dorothy baja a 4 de maná, ocho cartas cambian sus estadísticas, Itsy Bitsy Spider pasa a ser Evil, seis cartas cambian lo que hacen, y se corrigen dos reglas de juego y la ubicación The Gallows. Todo está en [el artículo de las notas del parche](/es/news/demo-patch-notes-0921), y ya en [MetaShifting](/es/metashifting) y en el historial de equilibrio de cada carta afectada.

## La clasificatoria se abre con el Steam Next Fest {#clasificatoria}

El equipo activará la clasificatoria "con el inicio del Steam Next Fest", con recompensas exclusivas de clasificatoria cuyos detalles no se han anunciado. El festival va del lunes 19 de octubre de 2026 a las 10:00, hora del Pacífico, al lunes 26 de octubre. Cuando la ladder se abra a todos, arrancará también la primera [tier list](/es/tier-list) de verdad de OriginsMeta, construida a partir de los resultados.

## La lista de cartas de la Crimson Cup ya está en el juego {#crimson-cup}

La actualización también incluye la lista provisional de cartas de la Crimson Cup, el torneo más grande que Koin Games ha organizado hasta ahora, del 20 al 25 de octubre: clasificatorios regionales los días 20, 21 y 22, y después playoffs y finales, en formato Conquest al mejor de tres, con una gran final al mejor de cinco. Los premios valen 10.000 dólares en total, entre dinero en efectivo, cartas promo, sobres y cajas de la Alpha Edition: no es una bolsa de premios en efectivo.

"Salvo próximos parches de equilibrio, ya se pueden empezar a preparar mazos para el torneo", escribe el equipo. Dos herramientas para empezar:

- el [deck builder](/es/deck-builder), cuyo modo torneo comprueba las reglas de Conquest mientras construyes;
- la [guía del Steam Next Fest](/es/guides/steam-next-fest-2026), con fechas, horarios y cómo inscribirse en Discord.

**Actualización del 30 de septiembre:** el parche de equilibrio llegó el 29 de septiembre. El [parche 0.7](/es/news/patch-0-7), que el equipo llama el último parche de equilibrio antes del torneo, hace un rework de Twister Toss y sube en 1 el coste de Bagheera, Mind Palace y Spellbook.

## El progreso: qué conservas {#progreso}

Era la pregunta que quedaba abierta. El 16 de septiembre, un mensaje del staff en Discord había confirmado que [los desbloqueos de mazos y el progreso contra los jefes pasarían de la Demo 1 a la Demo 2](/es/news/demo-2-progress-carryover), pero no decía nada del playtest cerrado. Ahora el equipo lo deja claro: quien haya jugado a la demo, al playtest o a ambos conserva el progreso del que esté más avanzado, "para que nadie tenga que volver a desbloquear cartas".

Importa porque desbloquear es lento. En el playtest cada mazo se abre tras tres victorias en clasificatoria más una victoria contra un jefe de la IA, el recorrido que los jugadores habían calificado de punitivo en los [comentarios del 14 de septiembre](/es/news/playtest-feedback-deck-unlock).

## ¿Y el playtest? {#playtest}

Quien juega al playtest cerrado no recibe nuevos mazos, cartas ni jefes con esta actualización. La parte de pulido llega al playtest más adelante esta semana, junto con otros cambios que el equipo quiere probar con los jugadores: quien esté encadenando partidas de clasificatoria allí tendrá que esperar unos días.

## Lo que aún no sabemos {#preguntas-abiertas}

- Cuáles son las recompensas exclusivas de la clasificatoria.
- Si la construcción de mazos ya está abierta a todos en la demo pública: el anuncio no lo dice.

**Actualización del 22 de septiembre:** dos preguntas ya tienen respuesta. Los detalles del equilibrio ya se conocen ([notas del parche](/es/news/demo-patch-notes-0921)), y el anuncio ahora también está en Steam, donde se publicó a las 21:59 UTC del 21 de septiembre.

## El rumor que acertó {#rumor}

La semana pasada circuló en redes sociales una frase sobre una "Demo Season 2" que llegaría la semana siguiente, con nuevos mazos, nuevas recompensas y una primera muestra del coleccionismo. La [publicamos como rumor](/es/news/demo-2-animations-and-fixes), porque ninguna publicación oficial la confirmaba. Los plazos y la parte del coleccionismo resultaron ser correctos.`,
    ),
    faq: {
      en: [
        { q: "Do I lose my progress with the Origins TCG demo update?", a: "No. Whoever played the demo, the closed playtest or both keeps the progress of whichever is further ahead, so no cards have to be unlocked again (team announcement of 21 September 2026)." },
        { q: "When does ranked mode start in the Origins TCG demo?", a: "With the start of Steam Next Fest, on Monday 19 October 2026, with exclusive ranked rewards whose details have not been announced yet." },
        { q: "Can I already build decks for the Crimson Cup?", a: "Yes: the tentative card list of the tournament has been in the game since the update of 21 September, and patch 0.7 of 29 September is the final balance patch before the Crimson Cup, which runs from 20 to 25 October 2026." },
        { q: "What changes for playtest players?", a: "No new decks, cards or bosses for now: the polish update reaches the playtest later in the week of 21 September, together with other changes to test." },
      ],
      it: [
        { q: "Con l'aggiornamento della demo di Origins TCG perdo i progressi?", a: "No. Chi ha giocato la demo, il playtest chiuso o entrambi conserva i progressi del percorso più avanzato, quindi nessuna carta va sbloccata di nuovo (annuncio del team del 21 settembre 2026)." },
        { q: "Quando parte la classificata nella demo di Origins TCG?", a: "Con l'inizio dello Steam Next Fest, lunedì 19 ottobre 2026, con ricompense esclusive i cui dettagli non sono ancora stati annunciati." },
        { q: "Si possono già preparare i mazzi per la Crimson Cup?", a: "Sì: la lista carte provvisoria del torneo è nel gioco dall'aggiornamento del 21 settembre, e la patch 0.7 del 29 settembre è l'ultima di bilanciamento prima della Crimson Cup, dal 20 al 25 ottobre 2026." },
        { q: "Cosa cambia per chi gioca il playtest?", a: "Per ora nessun nuovo mazzo, carta o boss: l'aggiornamento di rifinitura arriva sul playtest più avanti nella settimana del 21 settembre, insieme ad altre novità da provare." },
      ],
      es: [
        {
          q: "¿Pierdo mi progreso con la actualización de la demo de Origins TCG?",
          a: "No. Quien haya jugado a la demo, al playtest cerrado o a ambos conserva el progreso del que esté más avanzado, así que no hay que volver a desbloquear ninguna carta (anuncio del equipo del 21 de septiembre de 2026).",
        },
        {
          q: "¿Cuándo empieza la clasificatoria en la demo de Origins TCG?",
          a: "Con el inicio del Steam Next Fest, el lunes 19 de octubre de 2026, con recompensas exclusivas de clasificatoria cuyos detalles aún no se han anunciado.",
        },
        {
          q: "¿Ya puedo construir mazos para la Crimson Cup?",
          a: "Sí: la lista provisional de cartas del torneo está en el juego desde la actualización del 21 de septiembre, y el parche 0.7 del 29 de septiembre es el último de equilibrio antes de la Crimson Cup, que se juega del 20 al 25 de octubre de 2026.",
        },
        {
          q: "¿Qué cambia para los jugadores del playtest?",
          a: "Por ahora, ni mazos, ni cartas ni jefes nuevos: la actualización de pulido llega al playtest más adelante en la semana del 21 de septiembre, junto con otros cambios para probar.",
        },
      ],
    },
    url: "https://store.steampowered.com/news/app/4429430/view/1844115010502611",
    source: "steam",
  },
  {
    slug: "forum-bugs-before-demo-2",
    // Capsula ufficiale della pagina Steam (le segnalazioni vengono dal forum Steam). Prima ss-board-mill.webp, che
    // mostra le targhette con i nomi dei giocatori (da ritagliare per le condizioni di Koin) e il watermark senza didascalia.
    image: "/media/capsule-main.webp",
    cards: ["spellbook", "golden-egg", "golden-goose", "black-knight"],
    guides: ["play-the-demo"],
    date: "2026-09-20",
    updated: "2026-09-21",
    title: n(
      "Stuck matches, the egg at the Colosseum and a rematch button: the weekend's reports",
      "Partite bloccate, l'uovo al Colosseum e il tasto rivincita: le segnalazioni del fine settimana",
      "Partidas bloqueadas, el huevo en el Colosseum y un botón de revancha: los reportes del fin de semana",
    ),
    metaTitle: n("Origins TCG bugs: stuck matches, Colosseum, Golden Egg", "Bug di Origins TCG: partite bloccate e uovo al Colosseum", "Bugs de Origins TCG: partidas bloqueadas y Golden Egg"),
    description: n(
      "Three Origins TCG forum reports of 19–20 September: a match stuck on waiting, the Golden Egg at the Colosseum and a rematch button for private matches.",
      "Tre segnalazioni del 19–20 settembre sul forum di Origins TCG: partita bloccata su waiting, il Golden Egg al Colosseum e il tasto rivincita nelle private.",
      "Tres reportes del foro de Origins TCG del 19–20 de septiembre: partida bloqueada en waiting, Golden Egg en el Colosseum y revancha en partidas privadas.",
    ),
    summary: n(
      "Three new threads on the Steam forum between 19 and 20 September, none answered by the team yet: a match that freezes after combat, a Golden Egg that behaves oddly at the Colosseum and a request for a rematch button in private matches.",
      "Tre nuovi thread sul forum Steam tra il 19 e il 20 settembre, ancora senza risposta del team: una partita che si blocca dopo il combattimento, un Golden Egg che al Colosseum si comporta in modo strano e la richiesta di un tasto rivincita nelle partite private.",
      "Tres hilos nuevos en el foro de Steam entre el 19 y el 20 de septiembre, todavía sin respuesta del equipo: una partida que se congela después del combate, un Golden Egg que se comporta de forma extraña en el Colosseum y la petición de un botón de revancha en las partidas privadas.",
    ),
    highlights: {
      en: [
        { label: "A match stuck on \"waiting\"", text: "after combat, reported on 20 September; a player tied it to Spellbook", anchor: "stuck-match" },
        { label: "The Golden Egg at the Colosseum", text: "the Golden Goose it summoned dealt no damage in combat", anchor: "golden-egg" },
        { label: "A rematch button", text: "requested for private matches, with a deck change inside the lobby", anchor: "rematch" },
        { label: "What the team has said", text: "its last replies on the forum date back to 16 September", anchor: "team" },
      ],
      it: [
        { label: "Una partita bloccata su \"waiting\"", text: "dopo il combattimento, segnalata il 20 settembre; un giocatore la lega a Spellbook", anchor: "partita-bloccata" },
        { label: "Il Golden Egg al Colosseum", text: "la Golden Goose evocata non ha inflitto danni in combattimento", anchor: "golden-egg" },
        { label: "Un tasto rivincita", text: "chiesto per le partite private, con il cambio di mazzo nella stanza", anchor: "rivincita" },
        { label: "Cosa ha detto il team", text: "le sue ultime risposte sul forum sono del 16 settembre", anchor: "team" },
      ],
      es: [
        { label: "Una partida bloqueada en \"waiting\"", text: "después del combate, reportada el 20 de septiembre; un jugador la relaciona con Spellbook", anchor: "partida-bloqueada" },
        { label: "El Golden Egg en el Colosseum", text: "la Golden Goose que invocó no infligió daño en el combate", anchor: "golden-egg" },
        { label: "Un botón de revancha", text: "pedido para las partidas privadas, con cambio de mazo dentro de la sala", anchor: "revancha" },
        { label: "Lo que ha dicho el equipo", text: "sus últimas respuestas en el foro son del 16 de septiembre", anchor: "equipo" },
      ],
    },
    body: n(
      `## A match stuck on "waiting" {#stuck-match}

On 20 September a player reported a match that froze after the combat phase: the screen stayed on "waiting" well past the timer, while everything else was still clickable and the match could still be conceded.

Another player replied that it is a known bug tied to Spellbook and that it should be fixed in "demo season 2 next week". That answer came from a player, not from the team, and at the time it was not an announcement.

**Update, 21 September:** the [first big demo update](/en/news/demo-first-big-update) did arrive the following day. The list of fixes has not been published yet, so we cannot say whether this bug is among them.

## The Golden Egg at the Colosseum {#golden-egg}

On 19 September another player described a combat at the Colosseum location:

1. their Golden Egg was broken by Black Knight's On Reveal, which deals 2 damage to the enemy across from it;
2. the egg summoned the Golden Goose, a 5/5, in the same space;
3. in combat the Goose dealt no damage: Black Knight, a 2/2, survived, and the Goose was left at 5/3.

It looks like the rule developer Fenchurch explained on the forum on 15 September: a character summoned halfway through combat, in the space it lands on, does not attack until the next round. Being summoned does not protect it from damage, which accounts for the 5/3. What the Colosseum adds is not clear yet: the thread has no answer so far.

## A rematch button for private matches {#rematch}

The third thread is a request: a "play again" or "rematch" button at the end of a private match, and the option to change decks without leaving the private lobby.

## What the team has said so far {#team}

The last replies from the team on the forum date back to 16 September: [faster animations and the Off With Your Head! bug](/en/news/demo-2-animations-and-fixes), and [the rework of the boss fight AI](/en/news/demo-2-boss-ai-rework).`,
      `## Una partita bloccata su "waiting" {#partita-bloccata}

Il 20 settembre un giocatore ha segnalato una partita che si è fermata dopo la fase di combattimento: lo schermo è rimasto su "waiting" ben oltre il tempo del turno, mentre tutto il resto era ancora cliccabile e la partita si poteva ancora abbandonare.

Un altro giocatore ha risposto che è un bug noto legato a Spellbook e che dovrebbe essere corretto nella "demo season 2 la settimana prossima". La risposta veniva da un giocatore, non dal team, e in quel momento non era un annuncio.

**Aggiornamento del 21 settembre:** il [primo grande aggiornamento della demo](/it/news/demo-first-big-update) è arrivato davvero il giorno dopo. L'elenco delle correzioni non è ancora stato pubblicato, quindi non possiamo dire se questo bug sia tra quelli sistemati.

## Il Golden Egg al Colosseum {#golden-egg}

Il 19 settembre un altro giocatore ha descritto un combattimento al luogo Colosseum:

1. il suo Golden Egg è stato rotto dall'abilità Alla rivelazione del Black Knight, che infligge 2 danni al nemico di fronte;
2. l'uovo ha evocato la Golden Goose, una 5/5, nello stesso spazio;
3. in combattimento la Goose non ha inflitto danni: il Black Knight, un 2/2, è sopravvissuto e la Goose è rimasta 5/3.

Somiglia alla regola spiegata sul forum dallo sviluppatore Fenchurch il 15 settembre: un personaggio evocato a metà combattimento, nello spazio in cui compare, non attacca fino al round successivo. L'evocazione però non lo mette al riparo dai danni, e questo spiega il 5/3. Cosa aggiunga il Colosseum non è ancora chiaro: il thread per ora non ha risposte.

## Un tasto rivincita per le partite private {#rivincita}

Il terzo thread è una richiesta: un tasto "gioca ancora" o "rivincita" alla fine di una partita privata, e la possibilità di cambiare mazzo senza uscire dalla stanza privata.

## Cosa ha detto il team finora {#team}

Le ultime risposte del team sul forum risalgono al 16 settembre: [animazioni più veloci e il bug di Off With Your Head!](/it/news/demo-2-animations-and-fixes), e [il rework dell'IA delle boss fight](/it/news/demo-2-boss-ai-rework).`,
      `## Una partida bloqueada en "waiting" {#partida-bloqueada}

El 20 de septiembre un jugador informó sobre una partida que se quedó congelada después de la fase de combate: la pantalla siguió en "waiting" mucho después de agotarse el tiempo del turno, mientras todo lo demás seguía respondiendo a los clics y todavía se podía abandonar la partida.

Otro jugador respondió que es un bug conocido relacionado con Spellbook y que debería corregirse en la "demo season 2 la semana que viene". Esa respuesta vino de un jugador, no del equipo, y en ese momento no era un anuncio.

**Actualización del 21 de septiembre:** la [primera gran actualización de la demo](/es/news/demo-first-big-update) sí llegó al día siguiente. La lista de correcciones todavía no se ha publicado, así que no podemos decir si este bug está entre los corregidos.

## El Golden Egg en el Colosseum {#golden-egg}

El 19 de septiembre otro jugador describió un combate en la ubicación Colosseum:

1. la habilidad Al revelar del Black Knight, que inflige 2 de daño al enemigo que tiene enfrente, rompió su Golden Egg;
2. el huevo invocó a la Golden Goose, una 5/5, en el mismo espacio;
3. en el combate la Goose no infligió daño: el Black Knight, un 2/2, sobrevivió, y la Goose se quedó en 5/3.

Se parece a la regla que el desarrollador Fenchurch explicó en el foro el 15 de septiembre: un personaje invocado a mitad del combate, en el espacio en el que aparece, no ataca hasta la ronda siguiente. Ser invocado no lo protege del daño, y eso explica el 5/3. Lo que añade el Colosseum todavía no está claro: por ahora el hilo no tiene respuestas.

## Un botón de revancha para las partidas privadas {#revancha}

El tercer hilo es una petición: un botón de "jugar de nuevo" o "revancha" al final de una partida privada, y la opción de cambiar de mazo sin salir de la sala privada.

## Lo que ha dicho el equipo hasta ahora {#equipo}

Las últimas respuestas del equipo en el foro son del 16 de septiembre: [animaciones más rápidas y el bug de Off With Your Head!](/es/news/demo-2-animations-and-fixes), y [el rework de la IA de los combates contra jefes](/es/news/demo-2-boss-ai-rework).`,
    ),
    url: "https://steamcommunity.com/app/4429430/discussions/0/570423638738992342/",
    source: "steam",
  },
  {
    slug: "demo-2-progress-carryover",
    image: "/media/ss-legendary-winnie.webp",
    guides: ["play-the-demo", "steam-next-fest-2026"],
    date: "2026-09-16",
    updated: "2026-09-21",
    title: n(
      "Demo 2.0 keeps your Demo 1 deck and boss unlocks",
      "La Demo 2.0 mantiene gli sblocchi di mazzi e boss della Demo 1",
      "La Demo 2.0 conserva tus desbloqueos de mazos y jefes de la Demo 1",
    ),
    metaTitle: n("Origins TCG Demo 2.0 keeps your Demo 1 unlocks", "Demo 2.0 di Origins TCG: sblocchi della Demo 1 salvi", "Origins TCG: la Demo 2.0 conserva tu progreso"),
    description: n(
      "A Koin Games staff message on Discord, 16 September: deck unlocks and boss progress from the Origins TCG Demo 1 carry over to Demo 2.",
      "Messaggio dello staff Koin su Discord del 16 settembre: gli sblocchi dei mazzi e i progressi contro i boss della Demo 1 di Origins TCG passano alla Demo 2.",
      "Mensaje del staff de Koin Games en Discord del 16 de septiembre: los desbloqueos de mazos y jefes de la Demo 1 de Origins TCG pasan a la Demo 2.",
    ),
    summary: n(
      "On 16 September a Koin Games staff member wrote on the official Discord that Demo 2 carries over the deck unlocks and boss progress earned in Demo 1. On 21 September the team extended the promise to the closed playtest.",
      "Il 16 settembre un membro dello staff di Koin Games ha scritto sul Discord ufficiale che la Demo 2 mantiene gli sblocchi dei mazzi e i progressi contro i boss ottenuti nella Demo 1. Il 21 settembre il team ha esteso la promessa al playtest chiuso.",
      "El 16 de septiembre un miembro del staff de Koin Games escribió en el Discord oficial que la Demo 2 conserva los desbloqueos de mazos y el progreso contra los jefes conseguidos en la Demo 1. El 21 de septiembre el equipo extendió la promesa al playtest cerrado.",
    ),
    highlights: {
      en: [
        { label: "Demo 1 unlocks carry over", text: "deck unlocks and boss progress, a staff member wrote on Discord on 16 September", anchor: "staff" },
        { label: "Why it mattered", text: "in the playtest every deck takes three ranked wins and a win against a boss", anchor: "why" },
        { label: "The playtest counts too", text: "since 21 September you keep the progress of whichever is further ahead", anchor: "update" },
      ],
      it: [
        { label: "Gli sblocchi della Demo 1 restano", text: "mazzi e progressi contro i boss, ha scritto lo staff su Discord il 16 settembre", anchor: "staff" },
        { label: "Perché contava", text: "nel playtest ogni mazzo chiede tre vittorie in classificata e una contro un boss", anchor: "perche" },
        { label: "Conta anche il playtest", text: "dal 21 settembre si conservano i progressi del percorso più avanzato", anchor: "aggiornamento" },
      ],
      es: [
        { label: "Los desbloqueos de la Demo 1 se conservan", text: "mazos y progreso contra los jefes, escribió el staff en Discord el 16 de septiembre", anchor: "staff" },
        { label: "Por qué importaba", text: "en el playtest cada mazo pide tres victorias en clasificatoria y una contra un jefe", anchor: "por-que" },
        { label: "También cuenta el playtest", text: "desde el 21 de septiembre conservas el progreso del que esté más avanzado", anchor: "actualizacion" },
      ],
    },
    body: n(
      `## What the staff wrote {#staff}

"Demo V2 deck will carry over your V1 deck unlock/boss progress": this is the message a member of the Origins staff posted on the official Discord in the evening of 16 September, replying to players who asked whether everyone would have to start over. A screenshot of the message was shared on Reddit the next morning.

## Why it mattered {#why}

In the playtest every deck is unlocked with three ranked wins plus a win against an AI boss, the path players had called punishing in the [feedback of 14 September](/en/news/playtest-feedback-deck-unlock). Having to repeat it from zero with Demo 2 was the main worry. Until that message, the answer going around in the community was the opposite one.

## What was still open {#open}

The message spoke of Demo 1 and Demo 2 only. Whether the progress earned in the closed playtest would count as well was not written in any official post, so at the time we kept the two apart.

## Update, 21 September {#update}

The question is closed. Announcing [the first big demo update](/en/news/demo-first-big-update), the team wrote that whoever played the demo, the playtest or both keeps the progress of whichever is further ahead, "so no one will have to unlock cards again".`,
      `## Cosa ha scritto lo staff {#staff}

"Demo V2 deck will carry over your V1 deck unlock/boss progress", cioè la Demo 2 mantiene gli sblocchi dei mazzi e i progressi contro i boss della Demo 1: è il messaggio che un membro dello staff di Origins ha pubblicato sul Discord ufficiale la sera del 16 settembre, rispondendo ai giocatori che chiedevano se si sarebbe ricominciato da zero. Lo screenshot del messaggio è stato condiviso su Reddit la mattina dopo.

## Perché contava {#perche}

Nel playtest ogni mazzo si sblocca con tre vittorie in classificata più una vittoria contro un boss IA, il percorso che i giocatori avevano definito punitivo nel [feedback del 14 settembre](/it/news/playtest-feedback-deck-unlock). Doverlo rifare da capo con la Demo 2 era il timore principale. Fino a quel messaggio, nella community circolava la risposta opposta.

## Cosa restava aperto {#aperto}

Il messaggio parlava solo di Demo 1 e Demo 2. Se contassero anche i progressi fatti nel playtest chiuso non era scritto in nessun post ufficiale, quindi allora abbiamo tenuto le due cose separate.

## Aggiornamento del 21 settembre {#aggiornamento}

La questione è chiusa. Annunciando [il primo grande aggiornamento della demo](/it/news/demo-first-big-update), il team ha scritto che chi ha giocato la demo, il playtest o entrambi conserva i progressi del percorso più avanzato, "così nessuno dovrà sbloccare di nuovo le carte".`,
      `## Lo que escribió el staff {#staff}

"Demo V2 deck will carry over your V1 deck unlock/boss progress", es decir, la Demo 2 conserva los desbloqueos de mazos y el progreso contra los jefes de la Demo 1: es el mensaje que un miembro del staff de Origins publicó en el Discord oficial la noche del 16 de septiembre, en respuesta a los jugadores que preguntaban si todos tendrían que empezar de cero. Una captura del mensaje se compartió en Reddit a la mañana siguiente.

## Por qué importaba {#por-que}

En el playtest cada mazo se desbloquea con tres victorias en clasificatoria más una victoria contra un jefe controlado por la IA, el camino que los jugadores habían calificado de castigador en el [feedback del 14 de septiembre](/es/news/playtest-feedback-deck-unlock). Tener que repetirlo desde cero con la Demo 2 era la principal preocupación. Hasta ese mensaje, la respuesta que circulaba en la comunidad era la contraria.

## Lo que quedaba abierto {#abierto}

El mensaje hablaba solo de la Demo 1 y la Demo 2. Ninguna publicación oficial decía si también contaría el progreso conseguido en el playtest cerrado, así que en aquel momento mantuvimos las dos cosas separadas.

## Actualización del 21 de septiembre {#actualizacion}

La cuestión está cerrada. Al anunciar [la primera gran actualización de la demo](/es/news/demo-first-big-update), el equipo escribió que quien haya jugado la demo, el playtest o ambos conserva el progreso del que esté más avanzado, "así nadie tendrá que volver a desbloquear las cartas".`,
    ),
    url: "https://discord.gg/originstcg",
    source: "press",
  },
  {
    slug: "demo-2-boss-ai-rework",
    image: "/cards/cover/dracula.webp",
    guides: ["play-the-demo"],
    date: "2026-09-16",
    updated: "2026-09-21",
    title: n(
      "Koin will rework the boss fight AI in Demo 2.0",
      "Koin rifarà l'IA delle boss fight nella Demo 2.0",
      "Koin rehará la IA de los combates contra jefes en la Demo 2.0",
    ),
    // Al futuro, come il titolo e i punti "In breve": il rifacimento dell'IA è promesso per la Demo v2, non ancora fatto.
    metaTitle: n("Origins TCG: Koin will rework the boss AI for Demo 2.0", "Origins TCG: Koin rifarà l'IA dei boss nella Demo 2.0", "Origins TCG: Koin rehará la IA de los jefes en la Demo 2.0"),
    description: n(
      "Developer Fenchurch confirms on the Steam forum a rework of the Origins TCG boss fight AI in Demo v2, after a report on the Dracula mission boss.",
      "Lo sviluppatore Fenchurch conferma sul forum Steam il rework dell'IA delle boss fight di Origins TCG nella Demo v2, dopo una segnalazione sul boss Dracula.",
      "El desarrollador Fenchurch confirma en el foro de Steam un rework de la IA de los jefes de Origins TCG en la Demo v2, tras un reporte sobre el jefe Dracula.",
    ),
    summary: n(
      "A player described the Dracula mission boss winning every random roll. Koin Games developer Fenchurch replied on the Steam forum that the boss fight AI is being reworked for Demo v2, and that bosses and card unlocking will keep changing.",
      "Un giocatore ha raccontato un boss Dracula delle missioni che vince ogni tiro casuale. Lo sviluppatore di Koin Games Fenchurch ha risposto sul forum Steam che l'IA delle boss fight verrà rifatta per la Demo v2, e che boss e sblocco delle carte continueranno a cambiare.",
      "Un jugador describió cómo Dracula, el jefe de las misiones, ganaba todas las tiradas aleatorias. Fenchurch, desarrollador de Koin Games, respondió en el foro de Steam que la IA de los combates contra jefes se está rehaciendo para la Demo v2, y que los jefes y el desbloqueo de cartas seguirán cambiando.",
    ),
    highlights: {
      en: [
        { label: "The report", text: "Dracula, the boss of the missions, seemed to win every random roll", anchor: "report" },
        { label: "Boss AI rework promised for Demo v2", text: "confirmed by developer Fenchurch on 16 September", anchor: "answer" },
        { label: "Why it matters", text: "bosses are part of the path that unlocks decks", anchor: "why" },
        { label: "After the 21 September update", text: "the announcement does not mention the bosses", anchor: "next" },
      ],
      it: [
        { label: "La segnalazione", text: "Dracula, il boss delle missioni, sembrava vincere ogni tiro casuale", anchor: "segnalazione" },
        { label: "IA dei boss da rifare nella Demo v2", text: "lo ha confermato lo sviluppatore Fenchurch il 16 settembre", anchor: "risposta" },
        { label: "Perché conta", text: "i boss fanno parte del percorso che sblocca i mazzi", anchor: "perche" },
        { label: "Dopo l'aggiornamento del 21 settembre", text: "l'annuncio non parla dei boss", anchor: "dopo" },
      ],
      es: [
        { label: "El reporte", text: "Dracula, el jefe de las misiones, parecía ganar todas las tiradas aleatorias", anchor: "reporte" },
        { label: "IA de los jefes, prometida para la Demo v2", text: "lo confirmó el desarrollador Fenchurch el 16 de septiembre", anchor: "respuesta" },
        { label: "Por qué importa", text: "los jefes forman parte del camino que desbloquea los mazos", anchor: "por-que" },
        { label: "Tras la actualización del 21 de septiembre", text: "el anuncio no menciona a los jefes", anchor: "despues" },
      ],
    },
    body: n(
      `## The report {#report}

On 15 September a player posted on the Steam forum an account of four games against Dracula, the boss of the demo missions. The earlier bosses, they wrote, were strong but fair: all beaten at the first try with the premade decks unlocked just before them. Dracula, instead, seemed to get every "random" effect right:

- pumpkins always hitting the barrier with the least health;
- spells that deal 6 damage at random always landing on the strongest minion with 6 Health or less;
- random discards always taking the most dangerous card in hand;
- random summons always in the best space.

## The team's answer {#answer}

Developer Fenchurch replied on 16 September: "Our boss fight AI will be getting a re-work in Demo v2". He added that the team will keep watching and changing how boss fights and card unlocking work.

It is not the first change to the bosses. The playtest patch notes 0.6.3 of 27 August had already given them "new upgraded bot intelligence", asking players whether they had become smarter or dumber.

## Why it matters {#why}

Bosses are part of the unlock path: in the playtest a deck opens after three ranked wins and a win against an AI boss. A boss that feels unfair slows down the whole collection. It is the second time in a week that this path comes back from the feedback threads, after [the reply of 14 September](/en/news/playtest-feedback-deck-unlock) about making those matches PvE only.

## Update, 21 September: what came next {#next}

On 21 September the [first big demo update](/en/news/demo-first-big-update) arrived. The announcement does not mention the bosses: whether the new AI is already in it is not known yet.`,
      `## La segnalazione {#segnalazione}

Il 15 settembre un giocatore ha raccontato sul forum Steam quattro partite contro Dracula, il boss delle missioni della demo. I boss precedenti, ha scritto, erano forti ma corretti: tutti battuti al primo tentativo con i mazzi pronti sbloccati poco prima. Dracula invece sembrava azzeccare ogni effetto "casuale":

- le zucche colpivano sempre la barriera con meno vita;
- le magie che infliggono 6 danni a caso finivano sempre sul personaggio più forte con 6 di vita o meno;
- gli scarti casuali prendevano sempre la carta più pericolosa in mano;
- le evocazioni casuali comparivano sempre nello spazio migliore.

## La risposta del team {#risposta}

Lo sviluppatore Fenchurch ha risposto il 16 settembre: "Our boss fight AI will be getting a re-work in Demo v2", cioè l'IA delle boss fight verrà rifatta nella Demo v2. Ha aggiunto che il team continuerà a osservare e a cambiare il funzionamento dei boss e dello sblocco delle carte.

Non è il primo intervento sui boss. Le patch notes del playtest 0.6.3, del 27 agosto, avevano già dato ai boss una "nuova intelligenza potenziata", chiedendo ai giocatori se fossero diventati più svegli o più tonti.

## Perché conta {#perche}

I boss fanno parte del percorso di sblocco: nel playtest un mazzo si apre dopo tre vittorie in classificata e una vittoria contro un boss IA. Un boss che sembra scorretto rallenta tutta la collezione. È la seconda volta in una settimana che questo percorso torna dai thread di feedback, dopo [la risposta del 14 settembre](/it/news/playtest-feedback-deck-unlock) sull'idea di rendere quelle partite solo PvE.

## Aggiornamento del 21 settembre: cosa è successo dopo {#dopo}

Il 21 settembre è arrivato il [primo grande aggiornamento della demo](/it/news/demo-first-big-update). L'annuncio non parla dei boss: se la nuova IA ci sia già non si sa ancora.`,
      `## El reporte {#reporte}

El 15 de septiembre un jugador publicó en el foro de Steam el relato de cuatro partidas contra Dracula, el jefe de las misiones de la demo. Los jefes anteriores, escribió, eran fuertes pero justos: todos derrotados al primer intento con los mazos preconstruidos desbloqueados justo antes. Dracula, en cambio, parecía acertar con cada efecto "aleatorio":

- las calabazas siempre golpeaban la barrera con menos salud;
- los hechizos que infligen 6 de daño al azar siempre caían sobre el personaje más fuerte con 6 de Salud o menos;
- los descartes aleatorios siempre se llevaban la carta más peligrosa de la mano;
- las invocaciones aleatorias siempre aparecían en el mejor espacio.

## La respuesta del equipo {#respuesta}

El desarrollador Fenchurch respondió el 16 de septiembre: "Our boss fight AI will be getting a re-work in Demo v2", es decir, la IA de los combates contra jefes se rehará en la Demo v2. Añadió que el equipo seguirá observando y cambiando cómo funcionan los combates contra jefes y el desbloqueo de cartas.

No es el primer cambio en los jefes. Las notas del parche 0.6.3 del playtest, del 27 de agosto, ya les habían dado una "nueva inteligencia de bot mejorada", y preguntaban a los jugadores si se habían vuelto más inteligentes o más tontos.

## Por qué importa {#por-que}

Los jefes forman parte del camino de desbloqueo: en el playtest un mazo se abre tras tres victorias en clasificatoria y una victoria contra un jefe controlado por la IA. Un jefe que parece injusto frena toda la colección. Es la segunda vez en una semana que este camino vuelve a salir en los hilos de feedback, después de [la respuesta del 14 de septiembre](/es/news/playtest-feedback-deck-unlock) sobre hacer esas partidas solo PvE.

## Actualización del 21 de septiembre: lo que pasó después {#despues}

El 21 de septiembre llegó la [primera gran actualización de la demo](/es/news/demo-first-big-update). El anuncio no menciona a los jefes: todavía no se sabe si la nueva IA ya está incluida.`,
    ),
    url: "https://steamcommunity.com/app/4429430/discussions/0/617711086156930951/",
    source: "steam",
  },
  {
    slug: "demo-2-animations-and-fixes",
    image: "/media/ss-board-draw.webp",
    cards: ["off-with-your-head", "christopher-robin"],
    guides: ["play-the-demo"],
    date: "2026-09-16",
    updated: "2026-09-21",
    title: n(
      "Before Demo 2.0: faster animations confirmed, Off With Your Head! bug on the fix list",
      "Prima della Demo 2.0: animazioni più rapide confermate, il bug di Off With Your Head! da correggere",
      "Antes de la Demo 2.0: se confirman animaciones más rápidas y se corregirá el bug de Off With Your Head!",
    ),
    metaTitle: n("Origins TCG: faster animations, Off With Your Head! fix", "Origins TCG: animazioni rapide, bug di Off With Your Head!", "Origins TCG: animaciones rápidas, bug de Off With Your Head!"),
    description: n(
      "What the Origins TCG team confirmed on 16 September: faster animations, the Off With Your Head! bug fixed with Demo v2, audio reports, and a rumour.",
      "Cosa ha confermato il team di Origins TCG il 16 settembre: animazioni più veloci, il bug di Off With Your Head! corretto con la Demo v2, l'audio e un rumor.",
      "Lo que confirmó el equipo de Origins TCG el 16 de septiembre: animaciones más rápidas, bug de Off With Your Head! corregido con la Demo v2, audio y un rumor.",
    ),
    summary: n(
      "On 16 September the team confirmed on the Steam forum that animations will be sped up and that the invisible copies of Off With Your Head! are a known bug, fixed with Demo v2. Meanwhile a rumour about a \"Demo Season 2\" was going around.",
      "Il 16 settembre il team ha confermato sul forum Steam che le animazioni verranno velocizzate e che le copie invisibili di Off With Your Head! sono un bug noto, corretto con la Demo v2. Intanto sui social girava un rumor su una \"Demo Season 2\".",
      "El 16 de septiembre el equipo confirmó en el foro de Steam que las animaciones se acelerarán y que las copias invisibles de Off With Your Head! son un bug conocido que se corrige con la Demo v2. Mientras tanto circulaba un rumor sobre una \"Demo Season 2\".",
    ),
    highlights: {
      en: [
        { label: "Faster animations", text: "the staff says they will be sped up in an upcoming update", anchor: "animations" },
        { label: "The Off With Your Head! bug", text: "semi-invisible copies, a known bug to be fixed with Demo v2", anchor: "off-with-your-head" },
        { label: "Audio", text: "the reports go to the audio team", anchor: "audio" },
        { label: "The \"Demo Season 2\" rumour", text: "it had the timing right: the demo update arrived on 21 September", anchor: "rumour" },
      ],
      it: [
        { label: "Animazioni più veloci", text: "lo staff dice che arriveranno con un prossimo aggiornamento", anchor: "animazioni" },
        { label: "Il bug di Off With Your Head!", text: "copie semi-invisibili, un bug noto da correggere con la Demo v2", anchor: "off-with-your-head" },
        { label: "Audio", text: "le segnalazioni passano al team audio", anchor: "audio" },
        { label: "Il rumor della \"Demo Season 2\"", text: "ci aveva preso sui tempi: l'aggiornamento della demo è arrivato il 21 settembre", anchor: "rumor" },
      ],
      es: [
        { label: "Animaciones más rápidas", text: "el staff dice que llegarán con una próxima actualización", anchor: "animaciones" },
        { label: "El bug de Off With Your Head!", text: "copias semiinvisibles, un bug conocido que se corregirá con la Demo v2", anchor: "off-with-your-head" },
        { label: "Audio", text: "los reportes pasan al equipo de audio", anchor: "audio" },
        { label: "El rumor de la \"Demo Season 2\"", text: "acertó con los tiempos: la actualización de la demo llegó el 21 de septiembre", anchor: "rumor" },
      ],
    },
    body: n(
      `## Faster animations {#animations}

"Animations need to be sped up 100–200%": the thread opened on 11 September got mostly agreeing replies, with one player saying the speed is fine as it is. On 16 September a member of the staff answered that the team has acknowledged the need to speed up animations and that "it'll be amended in an upcoming update".

## The Off With Your Head! bug {#off-with-your-head}

A new player described copies of Christopher Robin appearing without artwork, with only Power and Health visible. Developer Fenchurch identified the card behind it: Off With Your Head!, which destroys an ally and summons a basic copy of it in every other location. The semi-invisible copies are a known bug, and "it will be fixed when we release Demo v2 here really soon".

## Audio {#audio}

To a player who had listed several bugs, Fenchurch replied that the audio reports would be passed on to the audio team.

## The "Demo Season 2" rumour {#rumour}

In the same days a line went around on social media: a "Demo Season 2" coming the following week, with new decks, new rewards and a first taste of collecting. No official post on Steam, on Discord or on origins-tcg.com confirmed it, so we reported it as a rumour and kept to the official dates, Steam Next Fest from 19 to 26 October.

**Update, 21 September:** the rumour had the timing right. The [first big demo update](/en/news/demo-first-big-update) arrived on 21 September with a collectors tutorial and test packs. The list of fixes has not been published yet, so we cannot say whether the Off With Your Head! bug is among them.`,
      `## Animazioni più veloci {#animazioni}

"Le animazioni vanno accelerate del 100–200%": il thread aperto l'11 settembre ha raccolto quasi solo risposte d'accordo, con un giocatore che trova la velocità giusta così. Il 16 settembre un membro dello staff ha risposto che il team ha preso atto della richiesta e che le animazioni saranno velocizzate "in un aggiornamento in arrivo".

## Il bug di Off With Your Head! {#off-with-your-head}

Un giocatore alle prime armi ha descritto copie di Christopher Robin comparse senza illustrazione, con visibili solo attacco e vita. Lo sviluppatore Fenchurch ha individuato la carta responsabile: Off With Your Head!, che distrugge un alleato ed evoca una sua copia base in ogni altro luogo. Le copie semi-invisibili sono un bug noto, che "verrà corretto con l'uscita della Demo v2, molto presto".

## Audio {#audio}

A un giocatore che aveva elencato diversi bug, Fenchurch ha risposto che le segnalazioni sull'audio sarebbero passate al team audio.

## Il rumor della "Demo Season 2" {#rumor}

Negli stessi giorni girava sui social una frase: una "Demo Season 2" in arrivo la settimana successiva, con nuovi mazzi, nuove ricompense e un primo assaggio del collezionare. Nessun post ufficiale su Steam, su Discord o su origins-tcg.com la confermava, quindi l'abbiamo riportata come rumor e siamo rimasti alle date ufficiali, lo Steam Next Fest dal 19 al 26 ottobre.

**Aggiornamento del 21 settembre:** il rumor ci aveva preso sui tempi. Il [primo grande aggiornamento della demo](/it/news/demo-first-big-update) è arrivato il 21 settembre, con un tutorial per collezionisti e pacchetti di prova. L'elenco delle correzioni non è ancora stato pubblicato, quindi non possiamo dire se il bug di Off With Your Head! sia tra quelli sistemati.`,
      `## Animaciones más rápidas {#animaciones}

"Hay que acelerar las animaciones un 100–200 %": el hilo abierto el 11 de septiembre recibió sobre todo respuestas a favor, con un jugador que opina que la velocidad está bien como está. El 16 de septiembre un miembro del staff respondió que el equipo ha tomado nota de la necesidad de acelerar las animaciones y que "se corregirá en una próxima actualización".

## El bug de Off With Your Head! {#off-with-your-head}

Un jugador novato describió copias de Christopher Robin que aparecían sin ilustración, en las que solo se veían el Poder y la Salud. El desarrollador Fenchurch identificó la carta responsable: Off With Your Head!, que destruye a un aliado e invoca una copia básica suya en cada una de las demás ubicaciones. Las copias semiinvisibles son un bug conocido, que "se corregirá cuando lancemos la Demo v2, muy pronto".

## Audio {#audio}

A un jugador que había enumerado varios bugs, Fenchurch le respondió que los reportes sobre el audio se pasarían al equipo de audio.

## El rumor de la "Demo Season 2" {#rumor}

Esos mismos días circulaba una frase en redes sociales: una "Demo Season 2" para la semana siguiente, con mazos nuevos, recompensas nuevas y una primera muestra del coleccionismo. Ninguna publicación oficial en Steam, en Discord ni en origins-tcg.com la confirmaba, así que la publicamos como rumor y nos atuvimos a las fechas oficiales: el Steam Next Fest, del 19 al 26 de octubre.

**Actualización del 21 de septiembre:** el rumor acertó con los tiempos. La [primera gran actualización de la demo](/es/news/demo-first-big-update) llegó el 21 de septiembre con un tutorial para coleccionistas y sobres de prueba. La lista de correcciones todavía no se ha publicado, así que no podemos decir si el bug de Off With Your Head! está entre los corregidos.`,
    ),
    url: "https://steamcommunity.com/app/4429430/discussions/0/617710833111225236/",
    source: "steam",
  },
  {
    slug: "davdas-3-pigs-mid-range",
    image: "/cards/cover/three-not-so-little-pigs.webp",
    cards: ["three-not-so-little-pigs", "bagheera", "rumple", "axe-throw", "mind-palace", "piglet", "big-bad-wolf", "wicked-witch-of-the-west", "en-passant", "ali-baba", "frog-prince", "impundulu", "ellen-trechend"],
    guides: ["three-pigs-midrange-guide", "three-pigs-midrange-matchups"],
    date: "2026-09-15",
    title: n(
      "3 Pigs Mid Range: a Three Not So Little Pigs midrange deck for ladder and competitive play",
      "3 Pigs Mid Range: un mazzo midrange dei Three Not So Little Pigs per la ladder e il gioco competitivo",
      "3 Pigs Mid Range: un mazo midrange de Three Not So Little Pigs para la ladder y el juego competitivo",
    ),
    // Title e description dal 25/09/2026 (prima il titolo usciva tagliato con "…"): senza il nome dell'autore, regola del
    // 16/09. La news resta l'annuncio (mappa delle query, C34): il nome del mazzo con la Leggendaria o l'archetipo è il
    // title della scheda del mazzo e della guida, qui c'è solo la notizia del mazzo nuovo dello staff. "Ladder e
    // competitivo" sono i tipi del mazzo (Ladder, Competitive): "tornei" è un tipo a sé, che questo mazzo non ha.
    metaTitle: n("New Origins TCG staff deck: 3 Pigs Mid Range", "Nuovo mazzo dello staff per Origins TCG: 3 Pigs Mid Range", "Nuevo mazo del staff para Origins TCG: 3 Pigs Mid Range"),
    description: n(
      "A midrange Origins TCG deck led by Three Not So Little Pigs, for ladder and competitive play: take the board early, win a location, close with En Passant.",
      "Un mazzo midrange di Origins TCG guidato dai Three Not So Little Pigs, per ladder e competitivo: prendi il tabellone, vinci un luogo, chiudi con En Passant.",
      "Un mazo midrange de Origins TCG con Three Not So Little Pigs, para ladder y competitivo: domina el tablero, gana una ubicación y cierra con En Passant.",
    ),
    summary: n(
      "The second deck by Davdas, OriginsMeta staff, is a midrange list led by Three Not So Little Pigs, tagged for ladder and competitive play. The plan: take the board in the first rounds, win at least one location, then close with En Passant, Ellen Trechend's Trample and the Lightning Strikes that Impundulu generates. The deck page has the full list with composition charts, the author's mulligan notes, the game code and the button to open it in the deck builder, and two guides on how to play it.",
      "Il secondo mazzo di Davdas, staff di OriginsMeta, è una lista midrange guidata dai Three Not So Little Pigs, segnata per la ladder e il gioco competitivo. Il piano: prendere il tabellone nei primi round, vincere almeno un luogo e chiudere con En Passant, Ellen Trechend con Travolgere e i Lightning Strike generati da Impundulu. Nella scheda trovi la lista completa con i grafici di composizione, le note di mulligan dell'autore, il codice del gioco e il tasto per aprirla nel deck builder, e due guide su come giocarla.",
      "El segundo mazo de Davdas, del staff de OriginsMeta, es una lista midrange liderada por Three Not So Little Pigs y etiquetada para la ladder y el juego competitivo. El plan: hacerse con el tablero en las primeras rondas, ganar al menos una ubicación y cerrar con En Passant, Ellen Trechend con Arrollar y los Lightning Strike que genera Impundulu. En la ficha del mazo tienes la lista completa con los gráficos de composición, las notas de mulligan del autor, el código del juego y el botón para abrirla en el deck builder, además de dos guías sobre cómo jugarla.",
    ),
    url: "/decks/community/3-pigs-mid-range-6311",
    source: "staff",
  },
  {
    slug: "davdas-healing-healsing",
    image: "/cards/cover/van-helsing.webp",
    cards: ["van-helsing", "baby-bear", "scarecrow", "shahrazad", "ali-baba", "jill", "phuong-hoang", "jekyll", "boitata", "tin-woodman", "spellbook", "searing-light", "forbidden-knowledge"],
    guides: ["healing-healsing-guide", "healing-healsing-matchups"],
    date: "2026-09-15",
    title: n(
      "Healing Healsing, the first community deck: a Van Helsing control list for the ladder",
      "Healing Healsing, il primo mazzo della community: una lista controllo di Van Helsing per la ladder",
      "Healing Healsing, el primer mazo de la comunidad: una lista de control de Van Helsing para la ladder",
    ),
    // L'annuncio, come per 3 Pigs (C34): solo i fatti della news (primo mazzo pubblicato sul sito, Leggendaria, tipo
    // di mazzo quando ci sta), senza l'autore e senza il nome del mazzo in testa, che spetta al title della scheda.
    metaTitle: n("First Origins TCG deck on OriginsMeta: Van Helsing control", "Primo mazzo di Origins TCG su OriginsMeta: Van Helsing", "Primer mazo de Origins TCG en OriginsMeta: Van Helsing"),
    description: n(
      "The first deck published on OriginsMeta: a Van Helsing control list for the Origins TCG ladder that heals through damage and resets the board late.",
      "Il primo mazzo pubblicato su OriginsMeta: una lista controllo di Van Helsing per la ladder di Origins TCG che cura i danni e azzera il tabellone.",
      "El primer mazo publicado en OriginsMeta: una lista de control de Van Helsing para la ladder de Origins TCG que cura el daño y vacía el tablero al final.",
    ),
    summary: n(
      "The first deck published on OriginsMeta is by Davdas, OriginsMeta staff: a control list led by Van Helsing for the ranked ladder. The plan: take early value with Spellbook and Ali Baba, heal through the damage while Phuong Hoang grows with every heal, then reach round 8 or 9 and reset the board with Forbidden Knowledge. The deck page has the full list with composition charts, the author's mulligan notes, the game code and the button to open it in the deck builder, and two guides on how to play it.",
      "Il primo mazzo pubblicato su OriginsMeta è di Davdas, staff del sito: una lista controllo guidata da Van Helsing per la ladder classificata. Il piano: prendere valore presto con Spellbook e Ali Baba, curare i danni mentre Phuong Hoang cresce a ogni cura, poi arrivare al round 8 o 9 e azzerare il tabellone con Forbidden Knowledge. Nella scheda trovi la lista completa con i grafici di composizione, le note di mulligan dell'autore, il codice del gioco e il tasto per aprirla nel deck builder, e due guide su come giocarla.",
      "El primer mazo publicado en OriginsMeta es de Davdas, del staff del sitio: una lista de control liderada por Van Helsing para la ladder clasificatoria. El plan: sacar valor pronto con Spellbook y Ali Baba, aguantar el daño a base de curaciones mientras Phuong Hoang crece con cada una, y luego llegar a la ronda 8 o 9 y vaciar el tablero con Forbidden Knowledge. En la ficha del mazo tienes la lista completa con los gráficos de composición, las notas de mulligan del autor, el código del juego y el botón para abrirla en el deck builder, además de dos guías sobre cómo jugarla.",
    ),
    url: "/decks/community/healing-healsing-9411",
    source: "staff",
  },
  {
    slug: "playtest-feedback-deck-unlock",
    image: "/media/ss-collection.webp",
    cards: ["humpty", "spellbook", "asanbosam"],
    guides: ["play-the-demo"],
    date: "2026-09-14",
    title: n(
      "Playtest feedback: Koin reads the Steam forum and may move deck unlocks to PvE",
      "Feedback del playtest: Koin legge il forum Steam e valuta di spostare gli sblocchi dei mazzi nel PvE",
      "Feedback del playtest: Koin lee el foro de Steam y podría llevar los desbloqueos de mazos al PvE",
    ),
    metaTitle: n("Origins TCG playtest: Koin may move deck unlocks to PvE", "Playtest di Origins TCG: sblocco dei mazzi forse in PvE", "Playtest de Origins TCG: Koin estudia desbloqueos en PvE"),
    description: n(
      "Origins TCG playtest feedback: deck unlocks take three ranked wins and a boss; developer Fenchurch says Koin reads the forum and may make them PvE-only.",
      "Feedback del playtest di Origins TCG: un mazzo si sblocca con tre vittorie in classificata e un boss; Koin valuta di rendere quelle partite solo PvE.",
      "Feedback del playtest de Origins TCG: un mazo se desbloquea con tres victorias en clasificatoria y un jefe; Koin estudia que esas partidas sean solo PvE.",
    ),
    summary: n(
      "In the current playtest you unlock a deck by winning three ranked matches and then beating an AI boss; players call it punishing when they meet full collections with a starter deck. Developer Fenchurch replied that the team reads every Steam forum post and is considering making deck-unlock matches PvE-only. Also reported: cards that generate random cards (Humpty, Spellbook) can add extra Legendaries to a deck, requests to redesign Spellbook, and Asanbosam's On Reveal not repeating at the Cloning Lab location.",
      "Nel playtest attuale un mazzo si sblocca vincendo tre partite classificate e poi battendo un boss IA; i giocatori lo trovano punitivo quando incontrano collezioni complete con un mazzo iniziale. Lo sviluppatore Fenchurch ha risposto che il team legge ogni post del forum Steam e valuta di rendere le partite di sblocco solo PvE. Segnalati anche: le carte che generano carte casuali (Humpty, Spellbook) possono aggiungere Leggendarie extra al mazzo, richieste di ridisegnare Spellbook e l'abilità Alla rivelazione di Asanbosam che non si ripete nel luogo Cloning Lab.",
      "En el playtest actual desbloqueas un mazo ganando tres partidas clasificatorias y derrotando después a un jefe controlado por la IA; los jugadores lo consideran castigador cuando se cruzan con colecciones completas llevando un mazo inicial. El desarrollador Fenchurch respondió que el equipo lee todas las publicaciones del foro de Steam y está estudiando que las partidas de desbloqueo sean solo PvE. También se señalaron: las cartas que generan cartas aleatorias (Humpty, Spellbook), que pueden añadir Legendarias de más a un mazo; las peticiones de rediseñar Spellbook; y la habilidad Al revelar de Asanbosam, que no se repite en la ubicación Cloning Lab.",
    ),
    url: "https://steamcommunity.com/app/4429430/discussions/0/617711086156647978/",
    source: "steam",
  },
  {
    slug: "kickstarter-ama-pre-registration",
    image: "/media/ls-two-ways.webp",
    date: "2026-09-10",
    title: n(
      "Kickstarter AMA held: pre-registration open, Alpha Edition boxes preorder-only",
      "AMA sul Kickstarter: pre-registrazione aperta, box Alpha Edition solo in preordine",
      "AMA sobre el Kickstarter: prerregistro abierto y cajas de la Alpha Edition solo en preventa",
    ),
    summary: n(
      "Koin Games answered questions about the upcoming Kickstarter on the official Discord on 10 September. The campaign date is still unannounced; the official pre-registration page offers 15% off at launch for a 1 dollar deposit, fully refundable before launch. The Origins Myths & Legends Alpha Edition comes as collector packs of 5 cards (at least one Rare or better guaranteed), boxes of 24 packs and cases of 6 boxes; boxes and cases are preorder-only and the print run will not be repeated. Cards trade on the Steam Community Market; mobile pack opening is planned for 2027.",
      "Il 10 settembre Koin Games ha risposto sul Discord ufficiale alle domande sul Kickstarter in arrivo. La data della campagna non è ancora annunciata; la pagina ufficiale di pre-registrazione offre il 15% di sconto al lancio con un deposito di 1 dollaro, rimborsabile prima del lancio. La Origins Myths & Legends Alpha Edition si compone di pacchetti collector da 5 carte (almeno una Rara o superiore garantita), box da 24 pacchetti e case da 6 box; box e case sono solo in preordine e la tiratura non verrà ripetuta. Le carte si scambiano sul Mercato della Comunità di Steam; l'apertura dei pacchetti su mobile è prevista per il 2027.",
      "El 10 de septiembre Koin Games respondió en el Discord oficial a las preguntas sobre el próximo Kickstarter. La fecha de la campaña aún no se ha anunciado; la página oficial de prerregistro ofrece un 15 % de descuento en el lanzamiento a cambio de un depósito de 1 dólar, reembolsable por completo antes del lanzamiento. La Origins Myths & Legends Alpha Edition se compone de sobres collector de 5 cartas (con al menos una Rara o superior garantizada), cajas de 24 sobres y cases de 6 cajas; las cajas y los cases solo se venden en preventa y la tirada no se repetirá. Las cartas se intercambian en el Mercado de la Comunidad de Steam; la apertura de sobres en dispositivos móviles está prevista para 2027.",
    ),
    metaTitle: n("Kickstarter AMA: Alpha boxes are preorder-only", "AMA Kickstarter: box Alpha solo in preordine", "AMA Kickstarter: cajas Alpha solo en preventa"),
    description: n(
      "Origins TCG Kickstarter AMA of 10 September: 15% off for a refundable 1 dollar deposit, preorder-only Alpha boxes. The date and every update are in our guide.",
      "L'AMA sul Kickstarter di Origins TCG del 10 settembre: 15% di sconto con 1 dollaro rimborsabile e box Alpha solo in preordine. Data e novità nella guida.",
      "AMA del Kickstarter de Origins TCG del 10 de septiembre: 15 % de descuento por 1 dólar reembolsable y cajas Alpha en preventa. Fecha y novedades, en la guía.",
    ),
    guides: ["origins-tcg-kickstarter", "collector-economy"],
    url: "https://founder.origins-tcg.com/",
    source: "press",
  },
  {
    slug: "gameplay-trailer",
    image: "/media/news-trailer.webp",
    guides: ["origins-tcg-explained"],
    date: "2026-09-03",
    title: n("Official gameplay trailer released on YouTube", "Trailer di gameplay ufficiale su YouTube", "Tráiler oficial de gameplay publicado en YouTube"),
    metaTitle: n("Origins TCG official gameplay trailer on YouTube", "Trailer di gameplay ufficiale di Origins TCG su YouTube", "Tráiler oficial de gameplay de Origins TCG en YouTube"),
    description: n(
      "The first official Origins TCG gameplay trailer is on YouTube: the quickest way to see the pace of a match and the interface before Demo 2.0.",
      "Il primo trailer ufficiale di gameplay di Origins TCG è su YouTube: il modo più rapido per vedere ritmo di gioco e interfaccia prima della Demo 2.0.",
      "El primer tráiler oficial de gameplay de Origins TCG está en YouTube: la forma más rápida de ver el ritmo de una partida y la interfaz antes de la Demo 2.0.",
    ),
    summary: n(
      "The first trailer dedicated to gameplay is up on the official Origins TCG YouTube channel: the quickest way to see the pace of a match and the interface before Demo 2.0 arrives at Steam Next Fest.",
      "Il primo trailer dedicato al gameplay è sul canale YouTube ufficiale Origins TCG: il modo più rapido per vedere il ritmo di una partita e l'interfaccia prima che la Demo 2.0 arrivi allo Steam Next Fest.",
      "El primer tráiler dedicado al gameplay ya está en el canal oficial de YouTube de Origins TCG: la forma más rápida de ver el ritmo de una partida y la interfaz antes de que la Demo 2.0 llegue al Steam Next Fest.",
    ),
    url: "https://www.youtube.com/watch?v=7EFg0DN9MnI",
    source: "press",
  },
  {
    // Fino al 25/09/2026 il riassunto diceva "come riportato dal sito community World of Origins" e `url` era la sua
    // pagina delle news: tolti tutti e due quando il sito ha smesso di nominarlo (decisione di Pierluigi). Una fonte
    // pubblica alternativa per la vittoria di itzBolt non l'abbiamo trovata (il post Steam ufficiale del 25/08, news
    // `big-bobs-playtest-battle`, annuncia il torneo, non il risultato; niente su X, YouTube o altri siti), quindi il
    // riassunto dice che il risultato è quello condiviso dalla community e che un post ufficiale non l'abbiamo trovato:
    // il dato resta dichiarato come non ufficiale, senza nominare il sito. Niente "Fonte" e pill neutra "News" finché
    // Pierluigi non decide che cosa farne (tenerla così, citare un post del Discord ufficiale o toglierla).
    slug: "itzbolt-wins-conquest",
    image: "/media/ss-board-hand-full.webp",
    guides: ["steam-next-fest-2026"],
    date: "2026-08-28",
    title: n("itzBolt wins Big Bob's Playtest Battle, the first Conquest tournament", "itzBolt vince il Big Bob's Playtest Battle, primo torneo Conquest", "itzBolt gana el Big Bob's Playtest Battle, el primer torneo Conquest"),
    metaTitle: n("Origins TCG: itzBolt wins the first Conquest tournament", "Origins TCG: itzBolt vince il primo torneo Conquest", "Origins TCG: itzBolt gana el primer torneo Conquest"),
    description: n(
      "itzBolt won Big Bob's Playtest Battle, the first Origins TCG tournament in Conquest format, played on the 0.6.3 playtest with best-of-three matches.",
      "itzBolt ha vinto Big Bob's Playtest Battle, il primo torneo di Origins TCG in formato Conquest, giocato sul playtest 0.6.3 con partite al meglio delle tre.",
      "itzBolt ganó el Big Bob's Playtest Battle, el primer torneo de Origins TCG en formato Conquest, jugado en el playtest 0.6.3 con partidas al mejor de tres.",
    ),
    summary: n(
      "The community tournament played on the 0.6.3 playtest build with full deckbuilding and the Conquest format (several decks with different Legendaries, best-of-3) was won by itzBolt, according to the results shared by the community (we have not found an official post with the result). It was the first public test of the format that Koin has since chosen for the Crimson Cup.",
      "Il torneo community giocato sulla build 0.6.3 del playtest con deckbuilding completo e formato Conquest (più mazzi con Leggendarie diverse, al meglio delle tre) è stato vinto da itzBolt, secondo i risultati condivisi dalla community (non abbiamo trovato un post ufficiale con il risultato). È stato il primo test pubblico del formato che Koin ha poi scelto per la Crimson Cup.",
      "El torneo de la comunidad jugado en la build 0.6.3 del playtest, con construcción de mazos completa y formato Conquest (varios mazos con Legendarias distintas, al mejor de tres), lo ganó itzBolt, según los resultados que compartió la comunidad (no hemos encontrado una publicación oficial con el resultado). Fue la primera prueba pública del formato que Koin ha elegido después para la Crimson Cup.",
    ),
    source: "press",
  },
  {
    // Il primo annuncio (post Steam del 9/9). Dal 25/09/2026 ha un testo a sezioni con gli stessi fatti del riassunto,
    // una riga in cima che porta alle regole definitive del 24/9 (`crimson-cup-format-check-in`, la pagina primaria
    // sulla Crimson Cup, mappa delle query C12) e il paragrafo di aggiornamento in fondo. Title e sottotitoli raccontano
    // l'annuncio: "regole, date, premi" restano a quell'articolo. L'aggiornamento, testo compreso, l'ha approvato
    // Pierluigi il 25/09/2026, in deroga alla regola della KB (§1 p.34, 24/9) per cui le news vecchie restano com'erano.
    // 07/10/2026: anche la guida al Conquest, perché la sezione "Aggiornamento del 25 settembre" racconta il formato a tre mazzi e
    // perché le news sulla coppa con le due guide (regole, montepremi) altrimenti tolgono questo annuncio dalle correlate delle
    // regole del 24/9 (relatedNews.test.ts: regole e annuncio restano l'una fra le correlate dell'altro)
    slug: "biggest-tournament-ever",
    image: "/media/news-crimson-cup.webp",
    guides: ["steam-next-fest-2026", "origins-tcg-conquest"],
    date: "2026-09-09",
    updated: "2026-09-25",
    title: n("Crimson Cup announced: the biggest tournament ever for Steam Next Fest", "Annunciata la Crimson Cup: il torneo più grande di sempre per lo Steam Next Fest", "Anunciada la Crimson Cup: el torneo más grande de la historia para el Steam Next Fest"),
    metaTitle: n("Crimson Cup announced for Steam Next Fest", "Annunciata la Crimson Cup per il Next Fest", "Anunciada la Crimson Cup para el Next Fest"),
    description: n(
      "On 9 September Koin Games announced the Origins TCG Crimson Cup: 20–25 October, regional qualifiers, prizes worth $10,000. Updated with the final rules.",
      "Il 9 settembre Koin Games ha annunciato la Crimson Cup di Origins TCG: 20–25 ottobre, qualificazioni per regione, premi per 10.000 $. Con le regole finali.",
      "Crimson Cup de Origins TCG, anunciada el 9 de septiembre: del 20 al 25 de octubre, clasificatorios por región, 10.000 dólares en premios y las reglas finales.",
    ),
    summary: n(
      "A multi-day event from 20 to 25 October: qualifiers for each of the three major regions on the 20th, 21st and 22nd, then playoffs and finals. Prizes worth $10,000: an exclusive 1/1 promo card, other promo cards, digital packs, Alpha boxes and cases, and cash prizes. Sign-ups on Discord; creators can request wildcard invites straight into the playoffs.",
      "Un evento su più giorni dal 20 al 25 ottobre: qualificazioni per le tre macro-regioni il 20, 21 e 22, poi playoff e finali. Premi per un valore complessivo di 10.000 $: una carta promo 1/1 esclusiva, altre carte promo, pacchetti digitali, box e case Alpha, premi in denaro. Iscrizioni su Discord; i creator possono chiedere inviti wildcard diretti ai playoff.",
      "Un evento de varios días, del 20 al 25 de octubre: clasificatorios para cada una de las tres grandes regiones los días 20, 21 y 22, y después playoffs y finales. Premios por valor de 10.000 dólares: una carta promo 1/1 exclusiva, otras cartas promo, sobres digitales, cajas y cases Alpha y premios en efectivo. Inscripciones en Discord; los creadores de contenido pueden pedir invitaciones wildcard directas a los playoffs.",
    ),
    highlights: {
      en: [
        { label: "20–25 October", text: "qualifiers for the three major regions on the 20th, 21st and 22nd, then playoffs and finals", anchor: "dates" },
        { label: "Prizes worth $10,000", text: "a 1/1 promo card, other promo cards, digital packs, Alpha boxes and cases, cash", anchor: "prizes" },
        { label: "Sign-ups on Discord", text: "creators can ask for a wildcard straight into the playoffs", anchor: "sign-ups" },
        { label: "The final rules", text: "three-deck Conquest and a mandatory check-in, set on 24 September", anchor: "update" },
      ],
      it: [
        { label: "Dal 20 al 25 ottobre", text: "qualificazioni per le tre macro-regioni il 20, 21 e 22, poi playoff e finali", anchor: "date" },
        { label: "Premi per 10.000 $", text: "una carta promo 1/1, altre carte promo, pacchetti digitali, box e case Alpha, denaro", anchor: "premi" },
        { label: "Iscrizioni su Discord", text: "i creator possono chiedere una wildcard diretta ai playoff", anchor: "iscrizioni" },
        { label: "Le regole definitive", text: "Conquest a tre mazzi e check-in obbligatorio, fissati il 24 settembre", anchor: "aggiornamento" },
      ],
      es: [
        { label: "Del 20 al 25 de octubre", text: "clasificatorios para las tres grandes regiones los días 20, 21 y 22, y después playoffs y finales", anchor: "fechas" },
        { label: "Premios por valor de 10.000 dólares", text: "una carta promo 1/1, otras cartas promo, sobres digitales, cajas y cases Alpha, dinero en efectivo", anchor: "premios" },
        { label: "Inscripciones en Discord", text: "los creadores de contenido pueden pedir una wildcard directa a los playoffs", anchor: "inscripciones" },
        { label: "Las reglas definitivas", text: "Conquest con tres mazos y check-in obligatorio, fijados el 24 de septiembre", anchor: "actualizacion" },
      ],
    },
    body: n(
      `Rules, format and check-in, as set on 24 September: [Crimson Cup rules](/en/news/crimson-cup-format-check-in).

## What Koin announced on 9 September {#dates}

On 9 September Koin Games announced on Steam its biggest tournament ever: a multi-day event during Steam Next Fest, from 20 to 25 October 2026.

1. **Qualifiers**, one for each of the three major regions, on 20, 21 and 22 October.
2. **Playoffs and finals** after the qualifiers.

## The prizes announced {#prizes}

The prizes are worth $10,000 in total and come in several forms:

- an exclusive 1/1 promo card;
- other promo cards;
- digital packs;
- Alpha boxes and cases;
- cash prizes.

## Sign-ups and wildcards {#sign-ups}

Sign-ups are on the [official Origins TCG Discord](https://discord.gg/originstcg). Content creators can ask for a wildcard invite that takes them straight into the playoffs.

## Update of 25 September 2026 {#update}

This article reports the first announcement, of 9 September. On 24 September, after a survey among players, Koin Games set the format: three-deck Conquest, at least 8 unique cards between each pair of decks, decklists hidden until the top 4 and no ban in best-of-five matches. Check-in is mandatory: it opens two hours before each qualifier and closes five minutes before the start, together with deck submission. The tournament is played on the main demo, and the exact prize pool was promised for the following week.

The rules, the check-in times and what we don't know yet are in [our article on the Crimson Cup rules](/en/news/crimson-cup-format-check-in); dates, spots per region and how to prepare are in our [Steam Next Fest 2026 guide](/en/guides/steam-next-fest-2026).`,
      `Regole, formato e check-in, fissati il 24 settembre: [regole della Crimson Cup](/it/news/crimson-cup-format-check-in).

## Cosa ha annunciato Koin il 9 settembre {#date}

Il 9 settembre Koin Games ha annunciato su Steam il suo torneo più grande di sempre: un evento su più giorni durante lo Steam Next Fest, dal 20 al 25 ottobre 2026.

1. **Qualificazioni**, una per ciascuna delle tre macro-regioni, il 20, il 21 e il 22 ottobre.
2. **Playoff e finali** dopo le qualificazioni.

## I premi annunciati {#premi}

I premi valgono in tutto 10.000 $ e sono di più tipi:

- una carta promo 1/1 esclusiva;
- altre carte promo;
- pacchetti digitali;
- box e case Alpha;
- premi in denaro.

## Iscrizioni e wildcard {#iscrizioni}

Le iscrizioni sono sul [Discord ufficiale di Origins TCG](https://discord.gg/originstcg). I creator possono chiedere un invito wildcard che li porta direttamente ai playoff.

## Aggiornamento del 25 settembre 2026 {#aggiornamento}

Questo articolo racconta il primo annuncio, del 9 settembre. Il 24 settembre, dopo un sondaggio tra i giocatori, Koin Games ha fissato il formato: Conquest a tre mazzi, almeno 8 carte uniche fra ogni coppia di mazzi, liste segrete fino alla top 4 e niente ban nelle partite al meglio delle cinque. Il check-in è obbligatorio: apre due ore prima di ogni qualificazione e chiude cinque minuti prima dell'inizio, insieme alla consegna dei mazzi. Il torneo si gioca sulla demo principale, e la ripartizione esatta dei premi è stata promessa per la settimana successiva.

Regole, orari del check-in e cosa non sappiamo ancora sono nel [nostro articolo sulle regole della Crimson Cup](/it/news/crimson-cup-format-check-in); date, posti per regione e come prepararsi nella nostra [guida allo Steam Next Fest 2026](/it/guides/steam-next-fest-2026).`,
      `Reglas, formato y check-in, fijados el 24 de septiembre: [reglas de la Crimson Cup](/es/news/crimson-cup-format-check-in).

## Lo que anunció Koin el 9 de septiembre {#fechas}

El 9 de septiembre Koin Games anunció en Steam su torneo más grande hasta la fecha: un evento de varios días durante el Steam Next Fest, del 20 al 25 de octubre de 2026.

1. **Clasificatorios**, uno para cada una de las tres grandes regiones, los días 20, 21 y 22 de octubre.
2. **Playoffs y finales** después de los clasificatorios.

## Los premios anunciados {#premios}

Los premios suman un valor de 10.000 dólares y son de varios tipos:

- una carta promo 1/1 exclusiva;
- otras cartas promo;
- sobres digitales;
- cajas y cases Alpha;
- premios en efectivo.

## Inscripciones y wildcards {#inscripciones}

Las inscripciones están en el [Discord oficial de Origins TCG](https://discord.gg/originstcg). Los creadores de contenido pueden pedir una invitación wildcard que los lleva directamente a los playoffs.

## Actualización del 25 de septiembre de 2026 {#actualizacion}

Este artículo cuenta el primer anuncio, del 9 de septiembre. El 24 de septiembre, tras una encuesta entre los jugadores, Koin Games fijó el formato: Conquest con tres mazos, al menos 8 cartas únicas entre cada par de mazos, listas ocultas hasta el top 4 y ningún ban en los enfrentamientos al mejor de cinco. El check-in es obligatorio: abre dos horas antes de cada clasificatorio y cierra cinco minutos antes del inicio, junto con la entrega de mazos. El torneo se juega en la demo principal, y el reparto exacto de la bolsa de premios se prometió para la semana siguiente.

Las reglas, los horarios del check-in y lo que aún no sabemos están en [nuestro artículo sobre las reglas de la Crimson Cup](/es/news/crimson-cup-format-check-in); las fechas, las plazas por región y cómo prepararte, en nuestra [guía del Steam Next Fest 2026](/es/guides/steam-next-fest-2026).`,
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1843481262690278",
    source: "steam",
  },
  {
    slug: "patch-0-6-3",
    image: "/media/ss-board-ley-line.webp",
    cards: ["king-arthur", "merlin", "lancelot", "old-macdonald", "bandersnatch", "bigfoot", "bagheera", "christopher-robin", "sandman", "scarecrow", "merlins-prophecy", "blow-the-house-down", "bridge-troll", "rumple", "thumbelina", "white-queen"],
    // la cronologia della roadmap elenca le patch del playtest una per una; la guida del Next Fest racconta a cosa servivano
    guides: ["roadmap-and-dates", "steam-next-fest-2026"],
    date: "2026-08-27",
    // Nomi delle carte in inglese anche in italiano (docs/testi-di-gioco.md): "King Arthur", non più "Re Artù".
    title: n("Playtest patch 0.6.3: sixteen cards tuned, King Arthur up to 7/7", "Patch 0.6.3 del playtest: sedici carte ritoccate, King Arthur a 7/7", "Parche 0.6.3 del playtest: dieciséis cartas ajustadas, King Arthur sube a 7/7"),
    metaTitle: n("Origins TCG patch 0.6.3: King Arthur up to 7/7, 16 cards", "Patch 0.6.3 di Origins TCG: King Arthur a 7/7, 16 carte", "Parche 0.6.3 de Origins TCG: King Arthur a 7/7, 16 cartas"),
    description: n(
      "Origins TCG playtest patch 0.6.3, 27 August: buffs to King Arthur, Merlin and Lancelot, nerfs to Bandersnatch and Bigfoot, three reworks, smarter bosses.",
      "Patch 0.6.3 del playtest di Origins TCG, 27 agosto: buff a King Arthur, Merlin e Lancelot, nerf a Bandersnatch e Bigfoot, tre carte riviste, boss più furbi.",
      "Parche 0.6.3 de Origins TCG (playtest, 27 de agosto): buffs a King Arthur, Merlin y Lancelot, nerfs a Bandersnatch y Bigfoot, tres reworks, jefes más listos.",
    ),
    summary: n(
      "A tuning-and-fixes patch, used for Big Bob's tournament two days later. Buffs to King Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll and Blow the House Down; nerfs to Bandersnatch, Bigfoot, Scarecrow and Merlin's Prophecy; Bagheera, Christopher Robin and Sandman reworked. Bosses got smarter AI.",
      "Una patch di tuning e correzioni, usata per il torneo di Big Bob due giorni dopo. Buff a King Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll e Blow the House Down; nerf a Bandersnatch, Bigfoot, Scarecrow e Merlin's Prophecy; Bagheera, Christopher Robin e Sandman rivisti. I boss hanno un'IA più intelligente.",
      "Un parche de ajustes y correcciones, usado en el torneo de Big Bob dos días después. Buffs a King Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll y Blow the House Down; nerfs a Bandersnatch, Bigfoot, Scarecrow y Merlin's Prophecy; rework de Bagheera, Christopher Robin y Sandman. Los jefes tienen una IA más inteligente.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1842212951301184",
    source: "steam",
  },
  {
    slug: "big-bobs-playtest-battle",
    image: "/media/ss-versus.webp",
    guides: ["steam-next-fest-2026", "origins-tcg-conquest"],
    date: "2026-08-25",
    title: n("Big Bob's Playtest Battle brings the Conquest format", "Big Bob's Playtest Battle porta il formato Conquest", "Big Bob's Playtest Battle trae el formato Conquest"),
    metaTitle: n("Big Bob's Playtest Battle brings Conquest to Origins TCG", "Big Bob's Playtest Battle: il Conquest arriva su Origins TCG", "Big Bob's Playtest Battle: el Conquest llega a Origins TCG"),
    description: n(
      "Big Bob's Playtest Battle, 28 August: the first Origins TCG tournament in Conquest format, best-of-three single elimination, with Next Fest wildcards.",
      "Big Bob's Playtest Battle, 28 agosto: il primo torneo Conquest di Origins TCG, al meglio delle tre a eliminazione diretta, con wildcard per il Next Fest.",
      "Big Bob's Playtest Battle, 28 de agosto: el primer torneo Conquest de Origins TCG, al mejor de tres y eliminación directa, con wildcards para el Next Fest.",
    ),
    summary: n(
      "Tournament on 28 August on the playtest build with full deckbuilding. Best-of-3, single elimination, and the first use of Conquest: submit several decks with different Legendaries and at least nine different cards, ban one of your opponent's. Prizes: wildcards for the Next Fest tournament and Collector Packs.",
      "Torneo il 28 agosto sulla build del playtest con deckbuilding completo. Best-of-3, eliminazione diretta e primo uso del Conquest: si registrano più mazzi con Leggendarie diverse e almeno nove carte differenti, si banna un mazzo avversario. Premi: wildcard per il torneo del Next Fest e Collector Pack.",
      "Torneo el 28 de agosto en la build del playtest con construcción de mazos completa. Al mejor de tres, eliminación directa y primer uso del Conquest: presentas varios mazos con Legendarias distintas y al menos nueve cartas diferentes, y vetas uno de los mazos de tu rival. Premios: wildcards para el torneo del Next Fest y Collector Packs.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1841579228677617",
    source: "steam",
  },
  {
    slug: "patch-0-6-2",
    image: "/media/ss-board-reveals.webp",
    cards: ["mulan", "queen-of-hearts", "ellen-trechend", "van-helsings-tools", "banshee", "piglet", "wicked-witch-of-the-west", "three-not-so-little-pigs", "bandersnatch", "basilisk", "brides-of-dracula", "card-soldier", "flying-monkey", "guy-of-gisborne", "humpty", "huntsman", "imhotep", "kanga", "little-lamb", "marian", "pegasus", "stroke-of-midnight"],
    guides: ["roadmap-and-dates", "steam-next-fest-2026"],
    date: "2026-08-21",
    title: n("Playtest patch 0.6.2: balance pass on 23 cards", "Patch 0.6.2 del playtest: bilanciamento di 23 carte", "Parche 0.6.2 del playtest: cambios de equilibrio en 23 cartas"),
    metaTitle: n("Origins TCG patch 0.6.2 notes: 23 cards rebalanced", "Patch 0.6.2 di Origins TCG: 23 carte ribilanciate", "Parche 0.6.2 de Origins TCG: 23 cartas reequilibradas"),
    description: n(
      "Origins TCG playtest patch 0.6.2, 21 August: Mulan gains Double Attack, Queen of Hearts drops to 4 mana, Van Helsing's Tools is free. 23 cards changed.",
      "Patch 0.6.2 del playtest di Origins TCG, 21 agosto: Mulan ottiene Doppio attacco, la Queen of Hearts scende a 4 mana, Van Helsing's Tools è gratis.",
      "Parche 0.6.2 del playtest de Origins TCG, 21 de agosto: Mulan obtiene Ataque doble, Queen of Hearts baja a 4 de maná y Van Helsing's Tools es gratis.",
    ),
    summary: n(
      "Eight cards changed what their ability does. Mulan gains Double Attack, the Queen of Hearts drops to 4 Mana 3/3 with First Strike, Ellen Trechend becomes an 8-Mana 3/3 that grows +3/+3 per enemy. Van Helsing's Tools is free but the Silver Bullet deals 1. The collection is now scoped to the ten playtest decks.",
      "Otto carte hanno cambiato abilità. Mulan ottiene Doppio attacco, la Queen of Hearts scende a 4 Mana 3/3 con Primo colpo, Ellen Trechend diventa un 3/3 da 8 Mana che cresce +3/+3 per nemico. Van Helsing's Tools è gratis ma la Silver Bullet fa 1 danno. La collezione è ora limitata ai dieci mazzi del playtest.",
      "Ocho cartas cambiaron lo que hace su habilidad. Mulan obtiene Ataque doble, la Queen of Hearts baja a 4 de maná y 3/3 con Primer golpe, Ellen Trechend pasa a ser una 3/3 de 8 de maná que crece +3/+3 por enemigo. Van Helsing's Tools es gratis, pero la Silver Bullet inflige 1 de daño. La colección se limita ahora a los diez mazos del playtest.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1841579228669961",
    source: "steam",
  },
  {
    slug: "patch-0-6-1-ranked",
    image: "/media/news-patch-061.webp",
    cards: ["huntsman", "mowgli", "first-aid", "count-orlok", "bandersnatch", "genie", "mind-palace", "koschei"],
    guides: ["roadmap-and-dates", "steam-next-fest-2026", "origins-tcg-ranked"],
    date: "2026-08-14",
    title: n("Patch 0.6.1: ranked ladder, Grandmaster leaderboard, three decks retuned", "Patch 0.6.1: ladder classificata, classifica Grandmaster, tre mazzi ritoccati", "Parche 0.6.1: ladder clasificatoria, ranking Grandmaster y tres mazos reajustados"),
    metaTitle: n("Patch 0.6.1: ranked ladder and Grandmaster", "Patch 0.6.1: classificata e Grandmaster", "Parche 0.6.1: clasificatoria y Grandmaster"),
    description: n(
      "Origins TCG patch 0.6.1, 14 August: ranked mode with a world leaderboard for the Grandmaster division, quality-of-life options, Huntsman at 6 mana.",
      "Patch 0.6.1 di Origins TCG, 14 agosto: arriva la classificata con una classifica mondiale per la divisione Grandmaster, più comodità e Huntsman a 6 mana.",
      "Parche 0.6.1 de Origins TCG, 14 de agosto: llega la clasificatoria con ranking mundial para la división Grandmaster, calidad de vida y Huntsman a 6 de maná.",
    ),
    summary: n(
      "Ranked mode arrives with a world leaderboard for the Grandmaster division, plus quality of life: skip the tutorial, preview the opponent's Legendary during mulligan, mute emotes. Huntsman moves to 6 Mana 6/6; Swarm, Evil and Discard each swap one card.",
      "Arriva la modalità classificata con una classifica mondiale per la divisione Grandmaster, più comodità: salta il tutorial, anteprima della Leggendaria avversaria durante il mulligan, silenzia le emote. Huntsman passa a 6 Mana 6/6; Swarm, Evil e Discard cambiano una carta ciascuno.",
      "Llega el modo clasificatorio con un ranking mundial para la división Grandmaster, además de mejoras de calidad de vida: saltar el tutorial, ver la Legendaria del rival durante el mulligan y silenciar los emotes. Huntsman pasa a 6 de maná, 6/6; Swarm, Evil y Discard cambian una carta cada uno.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1840944183780414",
    source: "steam",
  },
  {
    slug: "demo-2-playtest",
    image: "/media/news-demo2-playtest.webp",
    guides: ["play-the-demo", "steam-next-fest-2026"],
    date: "2026-08-05",
    title: n("Demo 2.0 playtest: 5 new decks, 70+ new cards, deckbuilding", "Playtest della Demo 2.0: 5 nuovi mazzi, oltre 70 carte nuove, deckbuilding", "Playtest de la Demo 2.0: 5 mazos nuevos, más de 70 cartas nuevas y construcción de mazos"),
    metaTitle: n("Origins TCG Demo 2.0 playtest: 5 decks, 70+ cards", "Playtest della Demo 2.0 di Origins TCG: 5 mazzi, 70+ carte", "Playtest de la Demo 2.0 de Origins TCG: 5 mazos, 70+ cartas"),
    description: n(
      "The Origins TCG update for Steam Next Fest goes to community playtests from 7 August: 5 new decks, 70+ new cards and deckbuilding, open to all via Discord.",
      "L'aggiornamento di Origins TCG per lo Steam Next Fest va nei playtest dal 7 agosto: 5 mazzi nuovi, oltre 70 carte e deckbuilding, aperti a tutti su Discord.",
      "La actualización de Origins TCG para el Next Fest, en playtests abiertos por Discord desde el 7 de agosto: 5 mazos, más de 70 cartas y construcción de mazos.",
    ),
    summary: n(
      "The update that will ship for Steam Next Fest in October goes to community playtests, starting Friday 7 August at 9pm UTC with a game night. Open to everyone through Discord.",
      "L'aggiornamento che uscirà per lo Steam Next Fest di ottobre va nei playtest della community, da venerdì 7 agosto alle 21 UTC con una game night. Aperto a tutti tramite Discord.",
      "La actualización que saldrá para el Steam Next Fest de octubre llega a los playtests de la comunidad, a partir del viernes 7 de agosto a las 21:00 UTC con una noche de partidas. Abierto a todos a través de Discord.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1840310314338383",
    source: "steam",
  },
  {
    slug: "demo-stats-ama",
    image: "/media/news-card-party.webp",
    guides: ["play-the-demo", "roadmap-and-dates"],
    date: "2026-07-21",
    title: n("First demo numbers: 1,000+ players, 13,000+ matches, 1h51m median", "Primi numeri della demo: oltre 1.000 giocatori, 13.000 partite, mediana 1h51m", "Primeras cifras de la demo: más de 1.000 jugadores, más de 13.000 partidas y 1h51m de mediana"),
    metaTitle: n("Origins TCG demo numbers: 1,000+ players, 13,000+ matches", "Demo di Origins TCG: oltre 1.000 giocatori e 13.000 partite", "Demo de Origins TCG: 1.000+ jugadores y 13.000+ partidas"),
    description: n(
      "Six days after launch, the Origins TCG demo passed 1,000 players and 13,000 matches, with a 1h51m median. Plus an AMA, a first tournament and Card Party.",
      "Sei giorni dopo il lancio, la demo di Origins TCG supera i 1.000 giocatori e le 13.000 partite, mediana 1h51m. In arrivo un AMA, un torneo e il Card Party.",
      "Seis días después de salir, la demo de Origins TCG supera los 1.000 jugadores y las 13.000 partidas, mediana 1h51m. Llegan un AMA, un torneo y la Card Party.",
    ),
    summary: n(
      "Six days after launch the team shares the demo stats and lines up an AMA with CEO Tim Jooste and head of game design Kevin Lambert (22 July), the first demo tournament (24 July) and a booth at Card Party in Fort Lauderdale (24–26 July).",
      "Sei giorni dopo il lancio il team condivide i numeri della demo e annuncia un AMA con il CEO Tim Jooste e il capo del game design Kevin Lambert (22 luglio), il primo torneo della demo (24 luglio) e uno stand al Card Party di Fort Lauderdale (24–26 luglio).",
      "Seis días después del lanzamiento, el equipo comparte las estadísticas de la demo y anuncia un AMA con el CEO Tim Jooste y el responsable de diseño de juego Kevin Lambert (22 de julio), el primer torneo de la demo (24 de julio) y un stand en la Card Party de Fort Lauderdale (del 24 al 26 de julio).",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1838407329269463",
    source: "steam",
  },
  {
    slug: "demo-live",
    image: "/media/news-demo-live.webp",
    guides: ["play-the-demo", "roadmap-and-dates"],
    date: "2026-07-16",
    title: n("The Origins TCG demo is live on Steam", "La demo di Origins TCG è disponibile su Steam", "La demo de Origins TCG ya está disponible en Steam"),
    // La guida play-the-demo è la pagina primaria su "demo di Origins TCG" (download, come si gioca): qui l'angolo è l'uscita.
    metaTitle: n("Origins TCG demo launches with exclusive collectibles", "Esce la demo di Origins TCG, con collezionabili esclusivi", "Sale la demo de Origins TCG, con coleccionables exclusivos"),
    description: n(
      "The free Origins TCG demo is live on Steam, with exclusive collectibles that won't be available later and will become tradeable when the full game launches.",
      "La demo gratuita di Origins TCG è su Steam, con collezionabili esclusivi che poi non saranno più disponibili e diventeranno scambiabili al lancio del gioco.",
      "La demo gratuita de Origins TCG ya está en Steam, con coleccionables exclusivos que no volverán y que se podrán intercambiar cuando salga el juego completo.",
    ),
    summary: n(
      "Free demo with exclusive collectibles that will not be available later and will be tradeable on the Steam marketplace once the full game launches. Launch party on Discord the same day.",
      "Demo gratuita con collezionabili esclusivi che non saranno più disponibili in seguito e saranno scambiabili sul marketplace Steam al lancio del gioco completo. Festa di lancio su Discord lo stesso giorno.",
      "Demo gratuita con coleccionables exclusivos que no estarán disponibles más adelante y que se podrán intercambiar en el mercado de Steam cuando se lance el juego completo. Fiesta de lanzamiento en Discord el mismo día.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1838407329257018",
    source: "steam",
  },
  {
    slug: "creator-program",
    image: "/media/keyart-robin-hood.webp",
    guides: ["steam-next-fest-2026", "roadmap-and-dates"],
    date: "2026-08-19",
    title: n("Creator Program announced, details in a Discord AMA", "Annunciato il Creator Program, dettagli in un AMA su Discord", "Anunciado el Creator Program, con los detalles en un AMA en Discord"),
    metaTitle: n("Origins TCG Creator Program announced, AMA on Discord", "Creator Program di Origins TCG: annuncio e AMA su Discord", "Creator Program de Origins TCG: anuncio y AMA en Discord"),
    description: n(
      "Koin Games opens the Origins TCG Creator Program ahead of Steam Next Fest. Details came in an AMA on 19 August, recorded on Discord. OriginsMeta applied.",
      "Koin Games apre il Creator Program di Origins TCG prima dello Steam Next Fest: dettagli nell'AMA del 19 agosto, su Discord. OriginsMeta ha fatto domanda.",
      "Koin Games abre el Creator Program de Origins TCG antes del Steam Next Fest: detalles en el AMA del 19 de agosto, en Discord. OriginsMeta envió su solicitud.",
    ),
    summary: n(
      "Koin Games opens a creator program ahead of Steam Next Fest. Details were given in an AMA on 19 August at 8pm UTC; the recording is on Discord. OriginsMeta has applied.",
      "Koin Games apre un programma per creator in vista dello Steam Next Fest. I dettagli sono stati dati in un AMA il 19 agosto alle 20 UTC; la registrazione è su Discord. OriginsMeta ha fatto richiesta.",
      "Koin Games abre un programa para creadores de contenido de cara al Steam Next Fest. Los detalles se dieron en un AMA el 19 de agosto a las 20:00 UTC; la grabación está en Discord. OriginsMeta ha presentado su solicitud.",
    ),
    url: "https://egamers.io/origins-tcg-launches-creator-program-ama-set-for-aug-19/",
    source: "press",
  },
  {
    slug: "community-open",
    image: "/media/news-community-open.webp",
    guides: ["roadmap-and-dates", "play-the-demo"],
    date: "2026-06-03",
    title: n("Official Discord opens to everyone", "Il Discord ufficiale apre a tutti", "El Discord oficial se abre a todos"),
    metaTitle: n("Origins TCG official Discord opens to everyone", "Il Discord ufficiale di Origins TCG apre a tutti", "El Discord oficial de Origins TCG se abre a todos"),
    description: n(
      "The official Origins TCG Discord, home of the early alpha testers, opens to everyone, with a demo announced as coming soon and a first look at collectibles.",
      "Il Discord ufficiale di Origins TCG, che ospitava i tester dell'alpha, apre a tutti, con una demo annunciata in arrivo e un primo sguardo ai collezionabili.",
      "El Discord oficial de Origins TCG, que acogía a los testers de la alfa, se abre a todos, con una demo anunciada y un primer vistazo a los coleccionables.",
    ),
    summary: n(
      "The server that hosted the early alpha testers opens up, with a demo announced as coming soon and a first look at the collectibles.",
      "Il server che ospitava i tester dell'alpha si apre a tutti, con una demo annunciata in arrivo e un primo sguardo ai collezionabili.",
      "El servidor que acogía a los primeros testers de la alfa se abre a todos, con una demo anunciada para muy pronto y un primer vistazo a los coleccionables.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1834602721185275",
    source: "steam",
  },
  {
    slug: "metal-cards-tease",
    image: "/media/ls-real-collecting.webp",
    guides: ["collector-economy", "roadmap-and-dates"],
    date: "2026-03-13",
    title: n("Physical metal cards teased by the CEO", "Il CEO mostra carte fisiche in metallo", "El CEO adelanta cartas físicas de metal"),
    metaTitle: n("Origins TCG physical metal cards teased by the CEO", "Carte in metallo di Origins TCG: il teaser del CEO", "Cartas de metal de Origins TCG: el adelanto del CEO"),
    description: n(
      "Koin Games CEO Tim Jooste was filmed with metal collectible cards based on Origins TCG. No product or date announced: a signal of intent, nothing more yet.",
      "Il CEO di Koin Games Tim Jooste è stato filmato con carte da collezione in metallo di Origins TCG. Nessun prodotto né data: per ora solo un'intenzione.",
      "El CEO de Koin Games, Tim Jooste, fue grabado con cartas coleccionables de metal de Origins TCG. Sin producto ni fecha: por ahora, solo una intención.",
    ),
    summary: n(
      "Tim Jooste was filmed with metal collectible cards based on the game's IP. No product or date announced: a signal of intent from a digital-first studio.",
      "Tim Jooste è stato filmato con carte da collezione in metallo basate sull'IP del gioco. Nessun prodotto né data annunciati: un segnale di intenzione da uno studio nato digitale.",
      "Tim Jooste fue grabado con cartas coleccionables de metal basadas en la IP del juego. No se ha anunciado ningún producto ni fecha: una señal de intenciones de un estudio nacido en lo digital.",
    ),
    url: "https://playtoearn.com/news/origins-tcg-teases-physical-metal-cards-as-koin-games-eyes-real-world-expansion",
    source: "press",
  },
  {
    slug: "steam-page-live",
    image: "/media/news-steam-page.webp",
    guides: ["roadmap-and-dates", "play-the-demo"],
    date: "2026-05-06",
    title: n("Steam page live: wishlist open, demo on the way", "Pagina Steam online: wishlist aperta, demo in arrivo", "Página de Steam publicada: lista de deseados abierta y demo en camino"),
    metaTitle: n("Origins TCG Steam page live: wishlist open", "Pagina Steam di Origins TCG online: wishlist aperta", "Página de Steam de Origins TCG: lista de deseados abierta"),
    description: n(
      "The Origins TCG Steam page goes live and the wishlist opens, with the team's first post: fast tactical matches and collecting modelled on physical TCGs.",
      "Va online la pagina Steam di Origins TCG e si apre la wishlist, con il primo post del team: partite tattiche veloci e collezione modellata sui TCG fisici.",
      "La página de Origins TCG en Steam ya está publicada y abre la lista de deseados: partidas tácticas rápidas y coleccionismo inspirado en los TCG físicos.",
    ),
    summary: n(
      "First Steam post from the team: a trading card game built around fast tactical matches and a collectible system modelled on physical TCGs.",
      "Primo post su Steam del team: un gioco di carte costruito su partite tattiche veloci e un sistema da collezione modellato sui TCG fisici.",
      "Primera publicación del equipo en Steam: un juego de cartas coleccionables construido en torno a partidas tácticas rápidas y a un sistema de coleccionismo que toma como modelo los TCG físicos.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1832065502808213",
    source: "steam",
  },
];

export const news: NewsItem[] = raw.map(withFrench);

export const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date));

export function getNews(slug: string): NewsItem | undefined {
  return news.find((item) => item.slug === slug);
}

/** Percorso della pagina dell'articolo, senza prefisso lingua (lo aggiunge `href`). */
export function newsPath(item: NewsItem): string {
  return `/news/${item.slug}`;
}

/** Minuti di lettura dell'articolo (riassunto + testo), a 200 parole al minuto, mai meno di uno. */
export function newsReadTime(item: NewsItem, locale: Locale): number {
  const words = `${item.summary[locale]} ${item.body?.[locale] ?? ""}`.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Date delle versioni tradotte, una sola regola per news e guide (revisione dell'Ondata 1, 25/09/2026): la data di
 * pubblicazione (`datePublished`, "Pubblicato il") resta quella originale dell'articolo in ogni lingua; la data di
 * modifica di una lingua nata dopo gli articoli non va mai prima del giorno in cui quella lingua è andata online.
 * Vale per lo spagnolo, dal 25/09/2026, e per il francese, dal 07/10/2026: gli stessi giorni di `LOCALE_SINCE` in
 * src/lib/lastmod.ts, che vale per la sitemap (lo controlla `newsMeta.test.ts`). Inglese e italiano sono le lingue
 * degli originali.
 * La usano la pagina della news (con `newsDates`: dati strutturati, Open Graph e firma) e `getGuides` in guides.ts.
 * Il giorno è scritto qui e non importato da lastmod.ts perché `node --test` carica news.ts senza risolvere gli
 * import senza estensione.
 */
export const TRANSLATED_SINCE: Partial<Record<Locale, string>> = { es: "2026-09-25", fr: "2026-10-07" };

/** Data di modifica (giorno ISO) di un articolo nella lingua `locale`, secondo la regola qui sopra. */
export function modifiedIn(locale: Locale, day: string): string {
  const since = TRANSLATED_SINCE[locale];
  return since && day < since ? since : day;
}

/**
 * Date di una news nella lingua `locale`, come le usa la sua pagina (firma, dati strutturati, Open Graph): `published`
 * è la data dell'articolo, `modified` segue `modifiedIn`. `translated` dice che `modified` è solo il giorno in cui è
 * nata la traduzione, senza un aggiornamento del testo: la firma scrive "Traducido el …" e non "Actualizado", che per
 * la regola delle news rimanda al paragrafo "Actualización del …" (revisione dell'Ondata 1, 25/09/2026).
 */
export function newsDates(item: NewsItem, locale: Locale): { published: string; modified: string; translated: boolean } {
  const own = item.updated ?? item.date;
  const modified = modifiedIn(locale, own);
  return { published: item.date, modified, translated: modified !== own };
}
