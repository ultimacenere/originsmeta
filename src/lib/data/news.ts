import type { Locale } from "../i18n";
import type { GuideSlug } from "../content/guides";

type L10n = Record<Locale, string> & { fr?: string };
const n = (en: string, it: string, es: string, fr?: string): L10n => (fr ? { en, it, es, fr } : { en, it, es });

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
  highlights?: Record<Locale, { label: string; text?: string; anchor: string }[]>;
  /** domande e risposte in fondo all'articolo, anche come dati strutturati FAQPage */
  faq?: Record<Locale, { q: string; a: string }[]>;
  /** slug dell'autore che firma (src/lib/data/authors.ts); se manca firma chi risponde dei contenuti */
  author?: string;
  /**
   * fonte: post ufficiale su Steam, stampa, oppure un mazzo pubblicato sul sito (url interno senza prefisso lingua).
   * Per le novità del sito (`source: "site"`) la fonte è l'articolo stesso: `url` è la pagina del sito di cui parla
   * di più (percorso interno senza prefisso lingua) e non compare come "Fonte".
   */
  url: string;
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

export const news: NewsItem[] = [
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
    guides: ["steam-next-fest-2026"],
    date: "2026-09-24",
    title: n(
      "Crimson Cup rules: three-deck Conquest, decklists hidden until the top 4 and a check-in you can't miss",
      "Regole della Crimson Cup: Conquest a tre mazzi, liste segrete fino alla top 4 e check-in obbligatorio",
      "Reglas de la Crimson Cup: Conquest con tres mazos, listas ocultas hasta el top 4 y check-in obligatorio",
    ),
    // Pagina primaria sulla Crimson Cup (mappa delle query del 25/09/2026): il title porta regole, date, premi e check-in;
    // le altre pagine sulla coppa (annuncio del 9/9, aggiornamento della demo) nominano la coppa ma non questi dettagli.
    metaTitle: n("Origins TCG Crimson Cup: rules, dates, prizes, check-in", "Crimson Cup di Origins TCG: regole, date, premi, check-in", "Crimson Cup de Origins TCG: reglas, fechas y premios"),
    description: n(
      "Origins TCG Crimson Cup rules: three-deck Conquest, 8 unique cards between decks, qualifiers on 20–22 October, prizes worth $10,000 and check-in times.",
      "Regole della Crimson Cup di Origins TCG: Conquest a tre mazzi, 8 carte uniche fra i mazzi, qualificazioni dal 20 al 22 ottobre, premi per 10.000 $ e check-in.",
      "Crimson Cup de Origins TCG: Conquest con 3 mazos, 8 cartas únicas entre mazos, clasificatorios del 20 al 22 de octubre, premios por 10.000 dólares y check-in.",
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
        { label: "Last balance patch", text: "two weeks before Steam Next Fest", anchor: "balance" },
        { label: "Prizes", text: "10,000 dollars, the exact prize pool next week", anchor: "prizes" },
      ],
      it: [
        { label: "Conquest a tre mazzi", text: "almeno 8 carte uniche fra ogni coppia di mazzi", anchor: "formato" },
        { label: "Liste segrete fino alla top 4", text: "nel ban si vede solo la Leggendaria", anchor: "liste" },
        { label: "Al meglio delle cinque senza ban", text: "bisogna vincere con tutti e tre i mazzi", anchor: "al-meglio-delle-cinque" },
        { label: "Check-in", text: "apre due ore prima, chiude cinque minuti prima dell'inizio con la consegna dei mazzi", anchor: "check-in" },
        { label: "Allenarsi sulla demo", text: "il playtest avrà aggiornamenti che il torneo non avrà", anchor: "demo-playtest" },
        { label: "Ultima patch di bilanciamento", text: "due settimane prima dello Steam Next Fest", anchor: "bilanciamento" },
        { label: "Premi", text: "10.000 dollari, la ripartizione esatta la settimana prossima", anchor: "premi" },
      ],
      es: [
        { label: "Conquest con tres mazos", text: "al menos 8 cartas únicas entre cada par de mazos", anchor: "formato" },
        { label: "Listas ocultas hasta el top 4", text: "en el ban solo ves la Legendaria", anchor: "listas" },
        { label: "Al mejor de cinco sin ban", text: "tienes que ganar con los tres mazos", anchor: "al-mejor-de-cinco" },
        { label: "Check-in", text: "abre dos horas antes y cierra cinco minutos antes del inicio, con la entrega de mazos", anchor: "check-in" },
        { label: "Entrena en la demo", text: "el playtest tendrá actualizaciones que el torneo no tendrá", anchor: "demo-playtest" },
        { label: "Último parche de equilibrio", text: "dos semanas antes del Steam Next Fest", anchor: "equilibrio" },
        { label: "Premios", text: "10.000 dólares; el reparto exacto de la bolsa de premios, la próxima semana", anchor: "premios" },
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

## Demo or playtest: where to practise {#demo-playtest}

- The **demo** has the tournament card list. Ranked switches on there for Steam Next Fest, with new ranked rewards. This is the build to practise on.
- The **playtest** is the same as the demo today, with ranked already on and a few minor changes. It will get more updates and will be different from the tournament build.

You can play both, but the tournament is held on the main demo and only with the cards available there.

## The last balance patch {#balance}

The last balance patch will arrive two weeks before Steam Next Fest, which starts on 19 October. We will track it card by card in [MetaShifting](/en/metashifting).

## Prizes {#prizes}

The official post on X talks about a 10,000-dollar prize pool, and the Discord announcement says the exact prize pool will be shared next week. In September Koin described prizes worth 10,000 dollars in total, between an exclusive 1/1 promo card, other promo cards, digital packs, Alpha boxes and cases, and cash ([our article](/en/news/biggest-tournament-ever)).

## What we don't know yet {#unknowns}

- The exact prize pool, due next week.
- How the unique cards between two decks are counted.
- The date of the last balance patch: the announcement only says two weeks before the festival.

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

## Demo o playtest: dove allenarsi {#demo-playtest}

- La **demo** ha la lista carte del torneo. Lì la classificata si accende per lo Steam Next Fest, con nuove ricompense. È la build su cui allenarsi.
- Il **playtest** oggi è uguale alla demo, con la classificata già attiva e qualche piccola modifica. Riceverà altri aggiornamenti e sarà diverso dalla build del torneo.

Si possono giocare tutti e due, ma il torneo si gioca sulla demo principale e solo con le carte che ci sono lì.

## L'ultima patch di bilanciamento {#bilanciamento}

L'ultima patch di bilanciamento arriverà due settimane prima dello Steam Next Fest, che parte il 19 ottobre. La seguiremo carta per carta in [MetaShifting](/it/metashifting).

## I premi {#premi}

Il post ufficiale su X parla di un montepremi da 10.000 dollari, e l'annuncio su Discord dice che la ripartizione esatta arriverà la settimana prossima. A settembre Koin aveva descritto premi per un valore complessivo di 10.000 dollari, fra una carta promo 1/1 esclusiva, altre carte promo, pacchetti digitali, box e case Alpha e premi in denaro ([il nostro articolo](/it/news/biggest-tournament-ever)).

## Cosa non sappiamo ancora {#da-sapere}

- La ripartizione esatta dei premi, attesa la settimana prossima.
- Come si contano le carte uniche fra due mazzi.
- La data dell'ultima patch di bilanciamento: l'annuncio dice solo due settimane prima del festival.

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

## Demo o playtest: dónde entrenar {#demo-playtest}

- La **demo** tiene la lista de cartas del torneo. Allí la clasificatoria se activa para el Steam Next Fest, con nuevas recompensas de clasificatoria. Es la build en la que hay que entrenar.
- El **playtest** hoy es igual que la demo, con la clasificatoria ya activa y algunos cambios menores. Recibirá más actualizaciones y será distinto de la build del torneo.

Puedes jugar a los dos, pero el torneo se juega en la demo principal y solo con las cartas disponibles en ella.

## El último parche de equilibrio {#equilibrio}

El último parche de equilibrio llegará dos semanas antes del Steam Next Fest, que empieza el 19 de octubre. Lo seguiremos carta por carta en [MetaShifting](/es/metashifting).

## Premios {#premios}

La publicación oficial en X habla de una bolsa de premios de 10.000 dólares, y el anuncio en Discord dice que el reparto exacto de la bolsa de premios se dará a conocer la próxima semana. En septiembre Koin describió premios por un valor total de 10.000 dólares, entre una carta promo 1/1 exclusiva, otras cartas promo, sobres digitales, cajas y cases de Alpha, y dinero en efectivo ([nuestro artículo](/es/news/biggest-tournament-ever)).

## Lo que aún no sabemos {#lo-que-no-sabemos}

- El reparto exacto de la bolsa de premios, previsto para la próxima semana.
- Cómo se cuentan las cartas únicas entre dos mazos.
- La fecha del último parche de equilibrio: el anuncio solo dice que llegará dos semanas antes del festival.

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

The patch has no version number: the team calls it the demo patch notes of 21 September. On this site it appears as "Demo · 21 Sep".

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

La patch non ha un numero di versione: il team la chiama patch notes della demo del 21 settembre. Sul sito compare come "Demo · 21 set".

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

El parche no tiene número de versión: el equipo lo llama las notas del parche de la demo del 21 de septiembre. En este sitio aparece como "Demo · 21 sep".

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
        { q: "Does this patch have a version number?", a: "No. The team calls it the demo patch notes of 21 September 2026, and the changes are compared to the last playtest build, 0.6.3." },
        { q: "Should I build my Crimson Cup decks on these stats?", a: "Yes: the tentative card list of the tournament arrived with the same update. The team warns that further balance patches can still come before the Crimson Cup, from 20 to 25 October 2026." },
      ],
      it: [
        { q: "Cosa cambia con la patch della demo di Origins TCG del 21 settembre?", a: "Dorothy costa 4 invece di 5; Wicked Stepmother, Christopher Robin, Guy of Gisborne, Quasimodo, Beauty, Magic Carpet e Roo cambiano statistiche; Itsy Bitsy Spider diventa Malvagia; Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet e Wooden Stake cambiano effetto; si correggono due regole di gioco e il luogo The Gallows." },
        { q: "Questa patch ha un numero di versione?", a: "No. Il team la chiama patch notes della demo del 21 settembre 2026, e le modifiche sono confrontate con l'ultima build del playtest, la 0.6.3." },
        { q: "Devo costruire i mazzi per la Crimson Cup su queste statistiche?", a: "Sì: la lista carte provvisoria del torneo è arrivata con lo stesso aggiornamento. Il team avverte che prima della Crimson Cup, dal 20 al 25 ottobre 2026, possono arrivare altre patch di bilanciamento." },
      ],
      es: [
        {
          q: "¿Qué cambia con el parche de la demo de Origins TCG del 21 de septiembre?",
          a: "Dorothy cuesta 4 en lugar de 5; Wicked Stepmother, Christopher Robin, Guy of Gisborne, Quasimodo, Beauty, Magic Carpet y Roo cambian sus estadísticas; Itsy Bitsy Spider pasa a ser Evil; Silver Bullet, Don Quixote, Heroic Charge, Frog Prince, Magic Carpet y Wooden Stake cambian lo que hacen; se corrigen dos reglas de juego y la ubicación The Gallows.",
        },
        {
          q: "¿Este parche tiene número de versión?",
          a: "No. El equipo lo llama las notas del parche de la demo del 21 de septiembre de 2026, y los cambios se comparan con la última build del playtest, la 0.6.3.",
        },
        {
          q: "¿Debo construir mis mazos para la Crimson Cup con estas estadísticas?",
          a: "Sí: la lista provisional de cartas del torneo llegó con la misma actualización. El equipo advierte que todavía pueden llegar más parches de equilibrio antes de la Crimson Cup, del 20 al 25 de octubre de 2026.",
        },
      ],
    },
    url: "https://store.steampowered.com/news/app/4429430/view/1844115010502611",
    source: "steam",
  },
  {
    slug: "demo-first-big-update",
    image: "/media/news-play-collect-trade.webp",
    guides: ["play-the-demo", "steam-next-fest-2026", "collector-economy"],
    date: "2026-09-21",
    updated: "2026-09-22",
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
        { q: "Can I already build decks for the Crimson Cup?", a: "Yes: the tentative card list of the tournament has been in the game since the update of 21 September. Balance patches can still change it before the Crimson Cup, which runs from 20 to 25 October 2026." },
        { q: "What changes for playtest players?", a: "No new decks, cards or bosses for now: the polish update reaches the playtest later in the week of 21 September, together with other changes to test." },
      ],
      it: [
        { q: "Con l'aggiornamento della demo di Origins TCG perdo i progressi?", a: "No. Chi ha giocato la demo, il playtest chiuso o entrambi conserva i progressi del percorso più avanzato, quindi nessuna carta va sbloccata di nuovo (annuncio del team del 21 settembre 2026)." },
        { q: "Quando parte la classificata nella demo di Origins TCG?", a: "Con l'inizio dello Steam Next Fest, lunedì 19 ottobre 2026, con ricompense esclusive i cui dettagli non sono ancora stati annunciati." },
        { q: "Si possono già preparare i mazzi per la Crimson Cup?", a: "Sì: la lista carte provvisoria del torneo è nel gioco dall'aggiornamento del 21 settembre. Le patch di bilanciamento possono ancora cambiarla prima della Crimson Cup, dal 20 al 25 ottobre 2026." },
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
          a: "Sí: la lista provisional de cartas del torneo está en el juego desde la actualización del 21 de septiembre. Los parches de equilibrio todavía pueden cambiarla antes de la Crimson Cup, que se juega del 20 al 25 de octubre de 2026.",
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
      "3 Pigs Mid Range : un deck midrange Three Not So Little Pigs pour le ladder et le jeu compétitif",
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
      "Le deuxième deck de Davdas, membre du staff d'OriginsMeta, est une liste midrange menée par Three Not So Little Pigs, prévue pour le ladder et le jeu compétitif. Le plan : prendre le plateau dans les premiers tours, gagner au moins un lieu, puis conclure avec En Passant, le Trample d'Ellen Trechend et les Lightning Strike générés par Impundulu. La page du deck contient la liste complète avec les graphiques de composition, les notes de mulligan de l'auteur, le code du jeu et le bouton pour l'ouvrir dans le deck builder, et deux guides pour le jouer.",
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
      "Healing Healsing, le premier deck de la communauté : une liste contrôle Van Helsing pour le ladder",
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
      "Le premier deck publié sur OriginsMeta est signé Davdas, membre du staff : une liste contrôle menée par Van Helsing pour le ladder classé. Le plan : prendre de la valeur tôt avec Spellbook et Ali Baba, soigner les dégâts pendant que Phuong Hoang grandit à chaque soin, puis atteindre le tour 8 ou 9 et remettre le plateau à zéro avec Forbidden Knowledge. La page du deck contient la liste complète avec les graphiques de composition, les notes de mulligan de l'auteur, le code du jeu et le bouton pour l'ouvrir dans le deck builder, et deux guides pour le jouer.",
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
      "Retours du playtest : Koin lit le forum Steam et envisage de déplacer les déblocages de decks en PvE",
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
      "Dans le playtest actuel, un deck se débloque en gagnant trois parties classées puis en battant un boss IA ; les joueurs trouvent cela punitif face à des collections complètes. Le développeur Fenchurch a répondu que l'équipe lit chaque post du forum Steam et envisage des parties de déblocage uniquement PvE. Signalés aussi : les cartes qui génèrent des cartes aléatoires (Humpty, Spellbook) peuvent ajouter des Légendaires, des demandes de refonte de Spellbook et l'On Reveal d'Asanbosam qui ne se répète pas au lieu Cloning Lab.",
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
      "AMA Kickstarter : préinscription ouverte, boîtes Alpha Edition en précommande uniquement",
    ),
    summary: n(
      "Koin Games answered questions about the upcoming Kickstarter on the official Discord on 10 September. The campaign date is still unannounced; the official pre-registration page offers 15% off at launch for a 1 dollar deposit, fully refundable before launch. The Origins Myths & Legends Alpha Edition comes as collector packs of 5 cards (at least one Rare or better guaranteed), boxes of 24 packs and cases of 6 boxes; boxes and cases are preorder-only and the print run will not be repeated. Cards trade on the Steam Community Market; mobile pack opening is planned for 2027.",
      "Il 10 settembre Koin Games ha risposto sul Discord ufficiale alle domande sul Kickstarter in arrivo. La data della campagna non è ancora annunciata; la pagina ufficiale di pre-registrazione offre il 15% di sconto al lancio con un deposito di 1 dollaro, rimborsabile prima del lancio. La Origins Myths & Legends Alpha Edition si compone di pacchetti collector da 5 carte (almeno una Rara o superiore garantita), box da 24 pacchetti e case da 6 box; box e case sono solo in preordine e la tiratura non verrà ripetuta. Le carte si scambiano sul Mercato della Comunità di Steam; l'apertura dei pacchetti su mobile è prevista per il 2027.",
      "El 10 de septiembre Koin Games respondió en el Discord oficial a las preguntas sobre el próximo Kickstarter. La fecha de la campaña aún no se ha anunciado; la página oficial de prerregistro ofrece un 15 % de descuento en el lanzamiento a cambio de un depósito de 1 dólar, reembolsable por completo antes del lanzamiento. La Origins Myths & Legends Alpha Edition se compone de sobres collector de 5 cartas (con al menos una Rara o superior garantizada), cajas de 24 sobres y cases de 6 cajas; las cajas y los cases solo se venden en preventa y la tirada no se repetirá. Las cartas se intercambian en el Mercado de la Comunidad de Steam; la apertura de sobres en dispositivos móviles está prevista para 2027.",
      "Le 10 septembre, Koin Games a répondu sur le Discord officiel aux questions sur le Kickstarter à venir. La date de la campagne n'est pas annoncée ; la page officielle de préinscription offre 15 % de réduction au lancement pour un dépôt de 1 dollar, remboursable avant le lancement. L'Alpha Edition Origins Myths & Legends se compose de packs collector de 5 cartes (au moins une Rare ou mieux garantie), de boîtes de 24 packs et de caisses de 6 boîtes ; boîtes et caisses sont en précommande uniquement, sans réimpression. Les cartes s'échangent sur le Marché de la communauté Steam ; l'ouverture de packs sur mobile est prévue pour 2027.",
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
    title: n("Official gameplay trailer released on YouTube", "Trailer di gameplay ufficiale su YouTube", "Tráiler oficial de gameplay publicado en YouTube", "Bande-annonce de gameplay officielle sur YouTube"),
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
      "La première bande-annonce consacrée au gameplay est sur la chaîne YouTube officielle Origins TCG : le moyen le plus rapide de voir le rythme d'une partie et l'interface avant la Demo 2.0 au Steam Next Fest.",
    ),
    url: "https://www.youtube.com/watch?v=7EFg0DN9MnI",
    source: "press",
  },
  {
    slug: "itzbolt-wins-conquest",
    image: "/media/ss-board-hand-full.webp",
    guides: ["steam-next-fest-2026"],
    date: "2026-08-28",
    title: n("itzBolt wins Big Bob's Playtest Battle, the first Conquest tournament", "itzBolt vince il Big Bob's Playtest Battle, primo torneo Conquest", "itzBolt gana el Big Bob's Playtest Battle, el primer torneo Conquest", "itzBolt remporte le Big Bob's Playtest Battle, premier tournoi Conquest"),
    metaTitle: n("Origins TCG: itzBolt wins the first Conquest tournament", "Origins TCG: itzBolt vince il primo torneo Conquest", "Origins TCG: itzBolt gana el primer torneo Conquest"),
    description: n(
      "itzBolt won Big Bob's Playtest Battle, the first Origins TCG tournament in Conquest format, played on the 0.6.3 playtest with best-of-three matches.",
      "itzBolt ha vinto Big Bob's Playtest Battle, il primo torneo di Origins TCG in formato Conquest, giocato sul playtest 0.6.3 con partite al meglio delle tre.",
      "itzBolt ganó el Big Bob's Playtest Battle, el primer torneo de Origins TCG en formato Conquest, jugado en el playtest 0.6.3 con partidas al mejor de tres.",
    ),
    summary: n(
      "The community tournament played on the 0.6.3 playtest build with full deckbuilding and the Conquest format (several decks with different Legendaries, best-of-3) was won by itzBolt, as reported by the World of Origins community site. It was the first public test of the format that Koin has since chosen for the Crimson Cup.",
      "Il torneo community giocato sulla build 0.6.3 del playtest con deckbuilding completo e formato Conquest (più mazzi con Leggendarie diverse, al meglio delle tre) è stato vinto da itzBolt, come riportato dal sito community World of Origins. È stato il primo test pubblico del formato che Koin ha poi scelto per la Crimson Cup.",
      "El torneo de la comunidad jugado en la build 0.6.3 del playtest, con construcción de mazos completa y formato Conquest (varios mazos con Legendarias distintas, al mejor de tres), lo ganó itzBolt, según informó el sitio de la comunidad World of Origins. Fue la primera prueba pública del formato que Koin ha elegido después para la Crimson Cup.",
      "Le tournoi communautaire joué sur la build 0.6.3 du playtest, avec deckbuilding complet et format Conquest (plusieurs decks aux Légendaires différentes, au meilleur des trois), a été remporté par itzBolt, comme le rapporte le site communautaire World of Origins. Premier test public du format retenu ensuite par Koin pour la Crimson Cup.",
    ),
    url: "https://worldoforigins.fun/news",
    source: "press",
  },
  {
    // Il primo annuncio (post Steam del 9/9). Dal 25/09/2026 ha un testo a sezioni con gli stessi fatti del riassunto,
    // una riga in cima che porta alle regole definitive del 24/9 (`crimson-cup-format-check-in`, la pagina primaria
    // sulla Crimson Cup, mappa delle query C12) e il paragrafo di aggiornamento in fondo. Title e sottotitoli raccontano
    // l'annuncio: "regole, date, premi" restano a quell'articolo. L'aggiornamento, testo compreso, l'ha approvato
    // Pierluigi il 25/09/2026, in deroga alla regola della KB (§1 p.34, 24/9) per cui le news vecchie restano com'erano.
    slug: "biggest-tournament-ever",
    image: "/media/news-crimson-cup.webp",
    guides: ["steam-next-fest-2026"],
    date: "2026-09-09",
    updated: "2026-09-25",
    title: n("Crimson Cup announced: the biggest tournament ever for Steam Next Fest", "Annunciata la Crimson Cup: il torneo più grande di sempre per lo Steam Next Fest", "Anunciada la Crimson Cup: el torneo más grande de la historia para el Steam Next Fest", "La Crimson Cup annoncée : le plus grand tournoi jamais organisé pour le Steam Next Fest"),
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
      "Un événement sur plusieurs jours du 20 au 25 octobre : qualifications pour les trois grandes régions les 20, 21 et 22, puis playoffs et finales. Des lots d'une valeur totale de 10 000 $ : une carte promo 1/1 exclusive, d'autres cartes promo, des packs numériques, des boîtes et cases Alpha, et des prix en argent. Inscriptions sur Discord ; les créateurs peuvent demander une invitation wildcard directe pour les playoffs.",
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
    title: n("Playtest patch 0.6.3: sixteen cards tuned, King Arthur up to 7/7", "Patch 0.6.3 del playtest: sedici carte ritoccate, King Arthur a 7/7", "Parche 0.6.3 del playtest: dieciséis cartas ajustadas, King Arthur sube a 7/7", "Patch 0.6.3 du playtest : seize cartes ajustées, le roi Arthur à 7/7"),
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
      "Un patch d'ajustements et de correctifs, utilisé pour le tournoi de Big Bob deux jours plus tard. Buffs pour le roi Arthur, Merlin, Lancelot, Old MacDonald, Rumple, Thumbelina, White Queen, Bridge Troll et Blow the House Down ; nerfs pour Bandersnatch, Bigfoot, Scarecrow et Merlin's Prophecy ; Bagheera, Christopher Robin et Sandman retravaillés. Les boss ont une IA plus maligne.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1842212951301184",
    source: "steam",
  },
  {
    slug: "big-bobs-playtest-battle",
    image: "/media/ss-versus.webp",
    guides: ["steam-next-fest-2026"],
    date: "2026-08-25",
    title: n("Big Bob's Playtest Battle brings the Conquest format", "Big Bob's Playtest Battle porta il formato Conquest", "Big Bob's Playtest Battle trae el formato Conquest", "Big Bob's Playtest Battle inaugure le format Conquest"),
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
      "Tournoi le 28 août sur la build du playtest avec deckbuilding complet. Best-of-3, élimination directe et première utilisation du Conquest : plusieurs decks avec des Légendaires différentes et au moins neuf cartes différentes, un ban chez l'adversaire. Récompenses : wildcards pour le tournoi du Next Fest et Collector Packs.",
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
    title: n("Playtest patch 0.6.2: balance pass on 23 cards", "Patch 0.6.2 del playtest: bilanciamento di 23 carte", "Parche 0.6.2 del playtest: cambios de equilibrio en 23 cartas", "Patch 0.6.2 du playtest : équilibrage de 23 cartes"),
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
      "Huit cartes ont changé de capacité. Mulan gagne Double Attaque, la Reine de Cœur passe à 4 Mana 3/3 avec Initiative, Ellen Trechend devient un 3/3 à 8 Mana qui grandit de +3/+3 par ennemi. Van Helsing's Tools est gratuit mais la Balle d'argent inflige 1. La collection est désormais limitée aux dix decks du playtest.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1841579228669961",
    source: "steam",
  },
  {
    slug: "patch-0-6-1-ranked",
    image: "/media/news-patch-061.webp",
    cards: ["huntsman", "mowgli", "first-aid", "count-orlok", "bandersnatch", "genie", "mind-palace", "koschei"],
    guides: ["roadmap-and-dates", "steam-next-fest-2026"],
    date: "2026-08-14",
    title: n("Patch 0.6.1: ranked ladder, Grandmaster leaderboard, three decks retuned", "Patch 0.6.1: ladder classificata, classifica Grandmaster, tre mazzi ritoccati", "Parche 0.6.1: ladder clasificatoria, ranking Grandmaster y tres mazos reajustados", "Patch 0.6.1 : ladder classé, classement Grandmaster, trois decks retouchés"),
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
      "Le mode classé arrive avec un classement mondial pour la division Grandmaster, plus du confort : passer le tutoriel, aperçu de la Légendaire adverse pendant le mulligan, couper les émotes. Huntsman passe à 6 Mana 6/6 ; Swarm, Evil et Discard échangent une carte chacun.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1840944183780414",
    source: "steam",
  },
  {
    slug: "demo-2-playtest",
    image: "/media/news-demo2-playtest.webp",
    guides: ["play-the-demo", "steam-next-fest-2026"],
    date: "2026-08-05",
    title: n("Demo 2.0 playtest: 5 new decks, 70+ new cards, deckbuilding", "Playtest della Demo 2.0: 5 nuovi mazzi, oltre 70 carte nuove, deckbuilding", "Playtest de la Demo 2.0: 5 mazos nuevos, más de 70 cartas nuevas y construcción de mazos", "Playtest de la Démo 2.0 : 5 nouveaux decks, plus de 70 cartes, deckbuilding"),
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
      "La mise à jour prévue pour le Steam Next Fest d'octobre part en playtests communautaires, dès le vendredi 7 août à 21 h UTC avec une game night. Ouvert à tous via Discord.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1840310314338383",
    source: "steam",
  },
  {
    slug: "demo-stats-ama",
    image: "/media/news-card-party.webp",
    guides: ["play-the-demo", "roadmap-and-dates"],
    date: "2026-07-21",
    title: n("First demo numbers: 1,000+ players, 13,000+ matches, 1h51m median", "Primi numeri della demo: oltre 1.000 giocatori, 13.000 partite, mediana 1h51m", "Primeras cifras de la demo: más de 1.000 jugadores, más de 13.000 partidas y 1h51m de mediana", "Premiers chiffres de la démo : 1 000+ joueurs, 13 000+ parties, médiane 1 h 51"),
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
      "Six jours après le lancement, l'équipe partage les chiffres de la démo et annonce un AMA avec le CEO Tim Jooste et le responsable du game design Kevin Lambert (22 juillet), le premier tournoi de la démo (24 juillet) et un stand au Card Party de Fort Lauderdale (24–26 juillet).",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1838407329269463",
    source: "steam",
  },
  {
    slug: "demo-live",
    image: "/media/news-demo-live.webp",
    guides: ["play-the-demo", "roadmap-and-dates"],
    date: "2026-07-16",
    title: n("The Origins TCG demo is live on Steam", "La demo di Origins TCG è disponibile su Steam", "La demo de Origins TCG ya está disponible en Steam", "La démo d'Origins TCG est disponible sur Steam"),
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
      "Démo gratuite avec des objets de collection exclusifs, indisponibles plus tard et échangeables sur le marketplace Steam au lancement du jeu complet. Soirée de lancement sur Discord le jour même.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1838407329257018",
    source: "steam",
  },
  {
    slug: "creator-program",
    image: "/media/keyart-robin-hood.webp",
    guides: ["steam-next-fest-2026", "roadmap-and-dates"],
    date: "2026-08-19",
    title: n("Creator Program announced, details in a Discord AMA", "Annunciato il Creator Program, dettagli in un AMA su Discord", "Anunciado el Creator Program, con los detalles en un AMA en Discord", "Creator Program annoncé, détails lors d'un AMA sur Discord"),
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
      "Koin Games ouvre un programme pour créateurs avant le Steam Next Fest. Les détails ont été donnés lors d'un AMA le 19 août à 20 h UTC ; l'enregistrement est sur Discord. OriginsMeta a candidaté.",
    ),
    url: "https://egamers.io/origins-tcg-launches-creator-program-ama-set-for-aug-19/",
    source: "press",
  },
  {
    slug: "community-open",
    image: "/media/news-community-open.webp",
    guides: ["roadmap-and-dates", "play-the-demo"],
    date: "2026-06-03",
    title: n("Official Discord opens to everyone", "Il Discord ufficiale apre a tutti", "El Discord oficial se abre a todos", "Le Discord officiel s'ouvre à tous"),
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
      "Le serveur qui accueillait les testeurs de l'alpha s'ouvre à tous, avec une démo annoncée et un premier aperçu des objets de collection.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1834602721185275",
    source: "steam",
  },
  {
    slug: "metal-cards-tease",
    image: "/media/ls-real-collecting.webp",
    guides: ["collector-economy", "roadmap-and-dates"],
    date: "2026-03-13",
    title: n("Physical metal cards teased by the CEO", "Il CEO mostra carte fisiche in metallo", "El CEO adelanta cartas físicas de metal", "Le CEO dévoile des cartes physiques en métal"),
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
      "Tim Jooste a été filmé avec des cartes de collection en métal basées sur l'univers du jeu. Ni produit ni date annoncés : un signal d'intention d'un studio né numérique.",
    ),
    url: "https://playtoearn.com/news/origins-tcg-teases-physical-metal-cards-as-koin-games-eyes-real-world-expansion",
    source: "press",
  },
  {
    slug: "steam-page-live",
    image: "/media/news-steam-page.webp",
    guides: ["roadmap-and-dates", "play-the-demo"],
    date: "2026-05-06",
    title: n("Steam page live: wishlist open, demo on the way", "Pagina Steam online: wishlist aperta, demo in arrivo", "Página de Steam publicada: lista de deseados abierta y demo en camino", "Page Steam en ligne : wishlist ouverte, démo en route"),
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
      "Premier message Steam de l'équipe : un jeu de cartes construit autour de parties tactiques rapides et d'un système de collection inspiré des TCG physiques.",
    ),
    url: "https://store.steampowered.com/news/app/4429430/view/1832065502808213",
    source: "steam",
  },
];

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
 * Oggi vale solo per lo spagnolo, dal 25/09/2026: lo stesso giorno di `LOCALE_SINCE.es` in src/lib/lastmod.ts, che
 * vale per la sitemap (lo controlla `newsMeta.test.ts`). Inglese e italiano sono le lingue degli originali.
 * La usano la pagina della news (con `newsDates`: dati strutturati, Open Graph e firma) e `getGuides` in guides.ts.
 * Il giorno è scritto qui e non importato da lastmod.ts perché `node --test` carica news.ts senza risolvere gli
 * import senza estensione.
 */
export const TRANSLATED_SINCE: Partial<Record<Locale, string>> = { es: "2026-09-25" };

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
