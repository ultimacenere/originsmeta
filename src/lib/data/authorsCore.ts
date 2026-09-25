import type { Locale } from "../i18n";

/*
  Gli autori del sito, senza nient'altro: questo modulo importa solo i tipi di i18n, così lo possono leggere il layout
  radice (i fondatori nel nodo Organization dei dati strutturati, src/lib/jsonld/entities.ts) e le pagine dinamiche
  senza caricare news e guide (Ondata 2, 25/09/2026). Le funzioni che leggono news e guide (chi firma cosa) stanno in
  authors.ts, che riesporta tutto quello che c'è qui: le pagine continuano a importare da "@/lib/data/authors".
*/

type L10n = Record<Locale, string> & { fr?: string };
const n = (en: string, it: string, es: string, fr?: string): L10n => (fr ? { en, it, es, fr } : { en, it, es });

export type Author = {
  slug: string;
  /**
   * nome completo con il nickname fra virgolette (Pierluigi, 24/09/2026: Pierluigi “Aldry” Cella, Luigi “Davdas”
   * Ragoni), usato nell'H1, nelle schede dell'indice, nelle firme di news e guide e nei dati strutturati
   */
  name: string;
  /** nome breve o nickname: firme, titoli delle sezioni ("Guide di {name}") */
  displayName: string;
  /** ruolo sul sito, una riga: "Fondatore" per tutti e due (Pierluigi, 24/09/2026), ed è l'unica descrizione nelle schede dell'indice */
  role: L10n;
  /** una riga sola: meta description del profilo (120-158 caratteri: oltre, Google taglia); nelle schede dell'indice non compare più */
  tagline: L10n;
  /** titolo per la SERP: `pageMeta` ci aggiunge il marchio quando manca, quindi il risultato finale deve stare in 60 caratteri */
  metaTitle: L10n;
  /**
   * biografia completa: deve spiegare la competenza, non raccontare la vita (3-5 frasi quando la scriviamo noi;
   * quella data dalla persona si pubblica così com'è, vedi il commento su `authors`)
   */
  bio: L10n;
  /**
   * Mese di ingresso nel progetto (ISO 8601 YYYY-MM: il giorno esatto non è documentato, quindi non
   * lo inventiamo). Non viene mostrato: serve solo a ordinare l'elenco degli autori.
   */
  joined: string;
  /** argomenti di competenza, in inglese: finiscono in `knowsAbout` del nodo Person */
  knowsAbout: string[];
  /**
   * Mazzi della community pubblicati da questa persona (slug e nome come sulla scheda del mazzo).
   * Sono dichiarati qui e non ricavati dalle guide: le guide le firma chi le ha scritte, il mazzo è
   * di chi lo ha pubblicato, e le due cose non coincidono. Fatto verificabile sul sito, perché la
   * scheda del mazzo porta il nome di chi lo ha pubblicato.
   */
  communityDecks?: { slug: string; name: string }[];
  /**
   * Nome utente dell'account della community (pagina /u/<username>), quando l'autore ne ha uno noto: la pagina autore
   * lo linka e, nei dati strutturati, il profilo della community e la pagina autore parlano della stessa Person
   * (`personId`, TOOL-09 dell'Ondata 2).
   */
  username?: string;
  /** contatti pubblici verificati; `mailto:` diventa `email`, i link http(s) diventano `sameAs` */
  links: { label: string; url: string }[];
};

/**
 * Chi firma i contenuti del sito. Solo fatti verificabili sul sito o nel repo: niente mestiere,
 * niente città, niente studi, niente aneddoti, niente date che non risultino da una fonte.
 * I requisiti editoriali di Google chiedono che si capisca chi scrive e perché sa di cosa parla:
 * la biografia spiega la competenza, non racconta la vita. Prima di aggiungere una frase su una
 * persona reale serve un riscontro pubblico; nel dubbio la frase non si scrive.
 * Unica eccezione: una biografia fornita dalla persona stessa, o da Pierluigi per lei, si pubblica così
 * com'è (in italiano parola per parola, in inglese tradotta), con mestiere e studi compresi. È il caso di
 * Davdas: testo dato da Pierluigi il 24/09/2026.
 */
export const authors: Author[] = [
  {
    slug: "pierluigi-cella",
    name: "Pierluigi “Aldry” Cella",
    displayName: "Pierluigi",
    role: n("Founder", "Fondatore", "Fundador"),
    tagline: n(
      "Founder of OriginsMeta: he opened the site in September 2026 and signs the news, the guides, the roadmap and the card economy pieces.",
      "Fondatore di OriginsMeta: ha aperto il sito a settembre 2026 e firma le news, le guide, la roadmap e i testi sull'economia delle carte.",
      "Fundador de OriginsMeta: abrió el sitio en septiembre de 2026 y firma las noticias, las guías, la hoja de ruta y los textos sobre la economía de las cartas.",
    ),
    metaTitle: n("Pierluigi “Aldry” Cella, Origins TCG guides · OriginsMeta", "Pierluigi “Aldry” Cella, guide Origins TCG · OriginsMeta", "Pierluigi “Aldry” Cella, guías de Origins TCG · OriginsMeta"),
    bio: n(
      "Pierluigi “Aldry” Cella is one of the founders of OriginsMeta: he opened the site in September 2026 to gather in one place what the sources of Origins TCG publish in scattered pieces. The rule the site works by is his: every date, every statistic and every rule comes from an official source — the Steam page, the patch notes, the official Discord — and every page carries the date it was last updated, so that any reader can check it. On OriginsMeta he signs the news, the guides, the roadmap and the pieces on the card economy. The rest of the editorial line is his too: no invented data, no card art taken from other sites, and the reminder that OriginsMeta is not affiliated with Koin Games on every page. You can write to him at staff@originsmeta.com.",
      "Pierluigi “Aldry” Cella è uno dei fondatori di OriginsMeta: ha aperto il sito a settembre 2026 per raccogliere in un posto solo quello che le fonti di Origins TCG pubblicano sparso. È sua la regola con cui lavora il sito: ogni data, ogni statistica e ogni regola arrivano da una fonte ufficiale — la pagina Steam, le patch notes, il Discord ufficiale — e ogni pagina porta la data dell'ultimo aggiornamento, così chi legge può verificare. Su OriginsMeta firma le news, le guide, la roadmap e i testi sull'economia delle carte. È suo anche il resto della linea editoriale: nessun dato inventato, nessuna illustrazione presa da altri siti e, su ogni pagina, la precisazione che OriginsMeta non è affiliato a Koin Games. Gli si può scrivere a staff@originsmeta.com.",
      "Pierluigi “Aldry” Cella es uno de los fundadores de OriginsMeta: abrió el sitio en septiembre de 2026 para reunir en un solo lugar lo que las fuentes de Origins TCG publican de forma dispersa. La regla con la que trabaja el sitio es suya: cada fecha, cada estadística y cada regla proceden de una fuente oficial —la página de Steam, las notas de los parches, el Discord oficial— y cada página indica la fecha de su última actualización, para que cualquier lector pueda comprobarlo. En OriginsMeta firma las noticias, las guías, la hoja de ruta y los textos sobre la economía de las cartas. También es suyo el resto de la línea editorial: ningún dato inventado, ninguna ilustración tomada de otros sitios y, en cada página, el aviso de que OriginsMeta no está afiliado a Koin Games. Puedes escribirle a staff@originsmeta.com.",
    ),
    joined: "2026-09",
    knowsAbout: ["Origins TCG", "Koin Games", "Trading card games", "Digital card game economy", "Game release roadmaps"],
    links: [{ label: "staff@originsmeta.com", url: "mailto:staff@originsmeta.com" }],
  },
  {
    // Lo slug è il nickname pubblico, non il nome anagrafico: finisce nell'URL indicizzato.
    slug: "davdas",
    // Nome completo con il nickname, come lo ha chiesto Pierluigi il 24/09/2026 (prima compariva solo "Davdas").
    name: "Luigi “Davdas” Ragoni",
    displayName: "Davdas",
    role: n("Founder", "Fondatore", "Fundador"),
    // Tagline riscritta con l'Ondata 2 (TOOL-09, 25/09/2026): "i primi due mazzi" era vero ma incompleto, ora i mazzi
    // sono di più. Nessun numero scritto a mano (tornerebbe vecchio al mazzo successivo): l'elenco sta in `communityDecks`.
    tagline: n(
      "Founder of OriginsMeta: he has published community decks here since the very first, Healing Healsing, and his game notes are the basis of our deck guides.",
      "Fondatore di OriginsMeta: pubblica mazzi della community sul sito dal primo, Healing Healsing, e le sue note di gioco sono la base delle guide ai mazzi.",
      "Fundador de OriginsMeta: publica aquí mazos de la comunidad desde el primero, Healing Healsing, y sus notas de juego son la base de las guías de mazos.",
    ),
    metaTitle: n("Luigi “Davdas” Ragoni, Origins TCG decks · OriginsMeta", "Luigi “Davdas” Ragoni, mazzi di Origins TCG", "Luigi “Davdas” Ragoni, mazos de Origins TCG · OriginsMeta"),
    // Biografia data da Pierluigi il 24/09/2026: l'italiano è il suo testo parola per parola, l'inglese è tradotto.
    bio: n(
      "Luigi Ragoni is an actor, director, trainer and artistic director. Born on 2 August 1982, he graduated as an actor from the Civica Scuola Paolo Grassi in Milan at the age of 25. He began his career touring Italy with a range of stage productions, moving on to television, film and radio, and developed his teaching skills working in theatres, academies, universities and high schools. Fascinated by the world of digital entertainment, he put his theatre experience to work for several international companies, becoming the artistic director of many events and shows. For more than 15 years he has worked as an entertainment consultant, host, writer, interviewer and speaker. His credits include hosting and casting major events for some of the most famous and successful games, such as Hearthstone, FIFA, eFootball, Valorant, Clash Royale, Brawl Stars and many more.",
      "Luigi Ragoni è un attore, regista, formatore e direttore artistico. Nato il 2 agosto 1982 si diploma come attore alla Civica Scuola Paolo Grassi di Milano a 25 anni. Inizia la professione girando l’Italia con vari spettacoli teatrali, passando per la tv, il cinema e la radio, sviluppa le sue capacità di insegnamento lavorando in teatri, accademie, atenei e licei. Affascinato dal mondo dell’intrattenimento digitale porta le proprie esperienze teatrali al servizio di alcune aziende internazionali diventando il direttore artistico di molti eventi e programmi. Da più di 15 anni lavora come consulente in ambito spettacolistico, presentatore, autore, intervistatore e speaker. Ha al suo attivo la presentazione e il cast di grandi eventi di alcuni dei giochi più famosi e di successo come: Hearthstone, FIFA, eFootball, Valorant, Clash Royale, Brawl Stars e molti altri.",
      "Luigi Ragoni es actor, director, formador y director artístico. Nacido el 2 de agosto de 1982, se graduó como actor en la Civica Scuola Paolo Grassi de Milán a los 25 años. Comenzó su carrera recorriendo Italia con diversas producciones teatrales, pasó después por la televisión, el cine y la radio, y desarrolló sus habilidades docentes trabajando en teatros, academias, universidades y escuelas secundarias. Fascinado por el mundo del entretenimiento digital, puso su experiencia teatral al servicio de varias empresas internacionales y se convirtió en director artístico de numerosos eventos y programas. Desde hace más de 15 años trabaja como consultor de entretenimiento, presentador, autor, entrevistador y locutor. En su trayectoria figuran la presentación y el casting de grandes eventos de algunos de los juegos más famosos y exitosos, como Hearthstone, FIFA, eFootball, Valorant, Clash Royale, Brawl Stars y muchos más.",
    ),
    joined: "2026-09",
    knowsAbout: ["Origins TCG", "Deck building", "Community deck lists", "Card game tournaments"],
    // Tutti i mazzi pubblicati da Davdas (account luigidavdasragoni), in ordine di pubblicazione: elenco
    // riallineato con il database il 25/09/2026. Quando ne pubblica altri vanno aggiunti qui.
    communityDecks: [
      { slug: "healing-healsing-9411", name: "Healing Healsing" },
      { slug: "3-pigs-mid-range-6311", name: "3 Pigs Mid Range" },
      { slug: "on-reveal-mid-range-772e", name: "On Reveal Mid Range" },
      { slug: "dorothy-combo-7503", name: "Dorothy Combo" },
      { slug: "king-of-value-trade-fd14", name: "King of Value Trade" },
      { slug: "the-trick-or-treat-legion-72c4", name: "The Trick-or-Treat Legion" },
    ],
    // l'account da cui pubblica i mazzi (vedi il commento qui sopra): pagina pubblica /u/luigidavdasragoni
    username: "luigidavdasragoni",
    links: [],
  },
];

export function getAuthor(slug: string): Author | undefined {
  return authors.find((a) => a.slug === slug);
}

/**
 * Il nickname fra le virgolette del nome completo ("Aldry" in Pierluigi “Aldry” Cella): è l'`alternateName` della
 * Person nei dati strutturati (prima lo era `displayName`, cioè "Pierluigi", che non è un altro nome).
 */
export function nicknameOf(a: Author): string | undefined {
  return a.name.match(/“([^”]+)”/)?.[1];
}

/**
 * L'autore a cui appartiene un account della community, se c'è (`username`). Serve al profilo pubblico /u/<username>
 * per usare la stessa Person della pagina autore e per linkarla.
 */
export function authorByUsername(username: string | null | undefined): Author | undefined {
  return username ? authors.find((a) => a.username === username) : undefined;
}

/**
 * I fondatori del sito: gli autori con il ruolo "Founder" (Pierluigi, 24/09/2026: "Fondatore" per tutti e due). Li
 * dichiara `founder` nel nodo Organization di OriginsMeta (src/lib/jsonld/entities.ts).
 */
export const founders: Author[] = authors.filter((a) => a.role.en === "Founder");
