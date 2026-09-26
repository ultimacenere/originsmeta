import type { Locale } from "./i18n";

/**
 * Etichette del profilo pubblico e delle funzioni per i creator (pacchetto CREATOR, 26/09/2026): modulo "Il tuo
 * profilo" in /account, bio e canali su /u, icone accanto al nome nei mazzi, badge LIVE, directory /creators, riga
 * della privacy, voce del footer. Stanno qui e non nei dizionari (stesso schema di feedbackLabels.ts e loginLabels.ts):
 * l'inglese è il tipo di riferimento, italiano e spagnolo si scrivono insieme. Spagnolo neutro con il tú
 * (docs/spagnolo.md). Il file importa solo un tipo: si può passare ai componenti del browser senza i dizionari.
 *
 * I nomi delle piattaforme (Twitch, YouTube…) sono marchi e restano uguali in ogni lingua: stanno in
 * `LINK_KIND_NAMES` di src/lib/community/profileLinks.ts; qui c'è solo "Sito web". Segnaposto fra graffe: {n},
 * {platform}, {viewers}, {name}.
 */

/** Etichette dei canali, anche nei componenti del browser (icone accanto al nome in /decks). */
export type ChannelLabels = {
  /** nome del tipo `website` */
  website: string;
  /** avviso per i lettori di schermo: il link apre una nuova scheda */
  newTab: string;
  /** nome dell'elenco dei canali ("Canali di {name}") */
  listOf: string;
};

/** Badge "in diretta" (caricato nel browser da /api/live). */
export type LiveLabels = {
  badge: string;
  /** descrizione del link: {viewers} */
  title: string;
};

export type ProfileFormLabels = {
  title: string;
  intro: string;
  bio: string;
  bioHint: string;
  bioPlaceholder: string;
  langs: string;
  langsHint: string;
  channels: string;
  channelsHint: string;
  kind: string;
  url: string;
  add: string;
  remove: string;
  moveUp: string;
  save: string;
  saving: string;
  saved: string;
  viewPage: string;
  shortLink: string;
  shortLinkHint: string;
  copy: string;
  copied: string;
  /** colonne non ancora nel database (migrazione da applicare) */
  missing: string;
  /** lettura del profilo fallita: il modulo non si mostra */
  readError: string;
  errors: {
    bioLong: string;
    /** {platform} */
    invalid: string;
    http: string;
    shortener: string;
    long: string;
    kind: string;
    tooMany: string;
    notLoggedIn: string;
    db: string;
    disabled: string;
  };
};

export type DirectoryLabels = {
  kicker: string;
  h1: string;
  /** title della SERP: con "Origins TCG" dentro (pageTitle aggiunge " · OriginsMeta" se ci sta) */
  metaTitle: string;
  /** 120–158 caratteri */
  description: string;
  intro: string;
  order: string;
  lang: string;
  platform: string;
  all: string;
  /** {n} */
  results: string;
  noResults: string;
  /** {n} */
  decksMany: string;
  deckOne: string;
  noDecks: string;
  profile: string;
  empty: string;
  inviteTitle: string;
  inviteText: string;
  inviteMail: string;
  inviteMailSubject: string;
  inviteGuide: string;
  /** nome della lista nei dati strutturati */
  listName: string;
};

export type CreatorLabels = {
  channels: ChannelLabels;
  live: LiveLabels;
  form: ProfileFormLabels;
  profile: {
    /** "Contenuti in" + lingue */
    langs: string;
    organizedTitle: string;
    organizedIntro: string;
    /** "Tutti i creator" (link alla directory) */
    directoryLink: string;
  };
  directory: DirectoryLabels;
  /** nomi delle lingue dei contenuti, nella loro lingua */
  langNames: Record<"en" | "it" | "es", string>;
  /** paragrafo della pagina privacy (#profile) */
  privacy: string;
  /** voce della colonna "Esplora" del footer */
  footer: string;
};

const en: CreatorLabels = {
  channels: { website: "Website", newTab: "(opens in a new tab)", listOf: "{name}'s channels" },
  live: { badge: "LIVE", title: "Live on Twitch now: {viewers} viewers" },
  form: {
    title: "Your public profile",
    intro:
      "Your bio, channels and languages appear on your public page. If you have an author tag (Author, Influencer, Pro, Staff) they also appear on the creators page and next to your name on your decks.",
    bio: "Bio",
    bioHint: "Plain text, up to 280 characters. No links here: channels go below.",
    bioPlaceholder: "E.g. Italian streamer, control decks and Crimson Cup prep every Tuesday night.",
    langs: "Languages of your content",
    langsHint: "Used by the language filter on the creators page.",
    channels: "Your channels",
    channelsHint:
      "Up to 8. Paste the channel address, or just the name for Twitch, YouTube, X, TikTok, Instagram and Kick. The first three appear next to your name on your decks.",
    kind: "Platform",
    url: "Address or name",
    add: "Add a channel",
    remove: "Remove",
    moveUp: "Move up",
    save: "Save profile",
    saving: "Saving…",
    saved: "Profile saved.",
    viewPage: "See your public page",
    shortLink: "Your short link",
    shortLinkHint: "Say it on stream or put it in your panels: it opens your page in the viewer's language.",
    copy: "Copy",
    copied: "Copied",
    missing: "The public profile is coming soon: it will be available after the next site update.",
    readError: "We can't read your profile right now. Reload the page in a moment.",
    errors: {
      bioLong: "Your bio is longer than 280 characters.",
      invalid: "This is not a {platform} channel address.",
      http: "The address must start with https://.",
      shortener: "No shortened links (bit.ly, tinyurl…): paste the real address.",
      long: "This address is too long.",
      kind: "Choose a platform.",
      tooMany: "Up to 8 channels.",
      notLoggedIn: "Sign in to edit your profile.",
      db: "We couldn't save your profile. Try again in a moment.",
      disabled: "Accounts are not available right now.",
    },
  },
  profile: {
    langs: "Content in",
    organizedTitle: "Tournaments organized",
    organizedIntro: "Public tournaments run on OriginsMeta, most recent first.",
    directoryLink: "All creators",
  },
  directory: {
    kicker: "Community",
    h1: "Origins TCG creators and streamers",
    metaTitle: "Origins TCG creators and streamers",
    description:
      "Streamers, YouTubers and players who make Origins TCG content: their channels, languages, decks published on OriginsMeta and who is live on Twitch now.",
    intro:
      "Everyone with an author tag on OriginsMeta: Author, Influencer, Pro and Staff. Filter by language and platform; whoever is live on Origins TCG right now shows the LIVE badge.",
    order: "Order: first creators who make content in this page's language, then those with more published decks, then by name.",
    lang: "Language",
    platform: "Platform",
    all: "All",
    results: "{n} creators",
    noResults: "No creator matches these filters.",
    decksMany: "{n} decks",
    deckOne: "1 deck",
    noDecks: "No decks yet",
    profile: "See profile",
    empty: "Origins TCG creators will appear here: the page fills up as the staff assigns the first author tags.",
    inviteTitle: "Do you make Origins TCG content?",
    inviteText:
      "Ask for the Author tag: no cap on published decks, tournaments on the site calendar with your own cover, your card on this page, and your deck guides translated automatically into Italian and Spanish.",
    inviteMail: "Write to us",
    inviteMailSubject: "Author tag on OriginsMeta",
    inviteGuide: "Send us a guide",
    listName: "Origins TCG creators on OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español" },
  privacy:
    "Public profile. The bio, channels and languages you write under \"Your public profile\" (Profile page) are public: they appear on your /u page and, if you have an author tag, on the creators page and next to your name on your decks. You can change or delete them at any time. For people with an author tag and a Twitch channel, our server asks Twitch every few minutes whether the channel is live on Origins TCG (public channel data); your browser does not contact Twitch until you open the link.",
  footer: "Creators and streamers",
};

const it: CreatorLabels = {
  channels: { website: "Sito web", newTab: "(si apre in una nuova scheda)", listOf: "Canali di {name}" },
  live: { badge: "LIVE", title: "In diretta su Twitch ora: {viewers} spettatori" },
  form: {
    title: "Il tuo profilo pubblico",
    intro:
      "Bio, canali e lingue compaiono sulla tua pagina pubblica. Se hai un tag autore (Autore, Influencer, Pro, Staff) anche nella pagina dei creator e accanto al tuo nome nei mazzi.",
    bio: "Bio",
    bioHint: "Testo semplice, al massimo 280 caratteri. Niente link qui: i canali vanno sotto.",
    bioPlaceholder: "Es. Streamer italiano, mazzi control e preparazione alla Crimson Cup il martedì sera.",
    langs: "Lingue dei tuoi contenuti",
    langsHint: "Servono al filtro per lingua della pagina dei creator.",
    channels: "I tuoi canali",
    channelsHint:
      "Fino a 8. Incolla l'indirizzo del canale, o solo il nome per Twitch, YouTube, X, TikTok, Instagram e Kick. I primi tre compaiono accanto al tuo nome nei mazzi.",
    kind: "Piattaforma",
    url: "Indirizzo o nome",
    add: "Aggiungi un canale",
    remove: "Togli",
    moveUp: "Sposta su",
    save: "Salva il profilo",
    saving: "Salvataggio…",
    saved: "Profilo salvato.",
    viewPage: "Vedi la tua pagina pubblica",
    shortLink: "Il tuo link breve",
    shortLinkHint: "Da dire in diretta o da mettere nei pannelli: apre la tua pagina nella lingua di chi lo usa.",
    copy: "Copia",
    copied: "Copiato",
    missing: "Il profilo pubblico arriva a breve: sarà disponibile con il prossimo aggiornamento del sito.",
    readError: "In questo momento non riusciamo a leggere il tuo profilo. Ricarica la pagina tra poco.",
    errors: {
      bioLong: "La bio supera i 280 caratteri.",
      invalid: "Questo non è l'indirizzo di un canale {platform}.",
      http: "L'indirizzo deve cominciare con https://.",
      shortener: "Niente link accorciati (bit.ly, tinyurl…): incolla l'indirizzo vero.",
      long: "Indirizzo troppo lungo.",
      kind: "Scegli la piattaforma.",
      tooMany: "Al massimo 8 canali.",
      notLoggedIn: "Accedi per modificare il profilo.",
      db: "Non è stato possibile salvare il profilo. Riprova tra poco.",
      disabled: "Gli account non sono disponibili in questo momento.",
    },
  },
  profile: {
    langs: "Contenuti in",
    organizedTitle: "Tornei organizzati",
    organizedIntro: "I tornei pubblici organizzati su OriginsMeta, dal più recente.",
    directoryLink: "Tutti i creator",
  },
  directory: {
    kicker: "Community",
    h1: "Creator e streamer di Origins TCG",
    metaTitle: "Creator e streamer di Origins TCG",
    description:
      "Streamer, youtuber e giocatori che fanno contenuti su Origins TCG: i loro canali, le lingue, i mazzi pubblicati su OriginsMeta e chi è in diretta su Twitch.",
    intro:
      "Tutte le persone con un tag autore su OriginsMeta: Autore, Influencer, Pro e Staff. Filtra per lingua e piattaforma; chi è in diretta su Origins TCG in questo momento ha il bollino LIVE.",
    order: "Ordine: prima chi fa contenuti nella lingua di questa pagina, poi chi ha pubblicato più mazzi, poi per nome.",
    lang: "Lingua",
    platform: "Piattaforma",
    all: "Tutte",
    results: "{n} creator",
    noResults: "Nessun creator corrisponde ai filtri.",
    decksMany: "{n} mazzi",
    deckOne: "1 mazzo",
    noDecks: "Ancora nessun mazzo",
    profile: "Vedi il profilo",
    empty: "Qui arriveranno i creator di Origins TCG: la pagina si riempie man mano che lo staff assegna i primi tag autore.",
    inviteTitle: "Fai contenuti su Origins TCG?",
    inviteText:
      "Chiedi il tag Autore: nessun tetto ai mazzi pubblicati, tornei nel calendario del sito con la tua copertina, la tua scheda in questa pagina e le guide dei tuoi mazzi tradotte in automatico in inglese e spagnolo.",
    inviteMail: "Scrivici",
    inviteMailSubject: "Tag Autore su OriginsMeta",
    inviteGuide: "Mandaci una guida",
    listName: "I creator di Origins TCG su OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español" },
  privacy:
    "Profilo pubblico. La bio, i canali e le lingue che scrivi in «Il tuo profilo pubblico» (pagina Profilo) sono pubblici: compaiono sulla tua pagina /u e, se hai un tag autore, nella pagina dei creator e accanto al tuo nome nei mazzi. Puoi cambiarli o cancellarli quando vuoi. Per chi ha un tag autore e un canale Twitch, il nostro server chiede a Twitch ogni pochi minuti se il canale è in diretta su Origins TCG (dati pubblici del canale); il tuo browser non contatta Twitch finché non apri il link.",
  footer: "Creator e streamer",
};

const es: CreatorLabels = {
  channels: { website: "Sitio web", newTab: "(se abre en una pestaña nueva)", listOf: "Canales de {name}" },
  live: { badge: "LIVE", title: "En directo en Twitch ahora: {viewers} espectadores" },
  form: {
    title: "Tu perfil público",
    intro:
      "Tu bio, tus canales y tus idiomas aparecen en tu página pública. Si tienes una etiqueta de autor (Autor, Influencer, Pro, Staff), también en la página de creadores y junto a tu nombre en tus mazos.",
    bio: "Bio",
    bioHint: "Texto simple, hasta 280 caracteres. Sin enlaces aquí: los canales van abajo.",
    bioPlaceholder: "Ej.: streamer en español, mazos de control y preparación para la Crimson Cup los martes por la noche.",
    langs: "Idiomas de tu contenido",
    langsHint: "Sirven para el filtro por idioma de la página de creadores.",
    channels: "Tus canales",
    channelsHint:
      "Hasta 8. Pega la dirección del canal, o solo el nombre para Twitch, YouTube, X, TikTok, Instagram y Kick. Los tres primeros aparecen junto a tu nombre en tus mazos.",
    kind: "Plataforma",
    url: "Dirección o nombre",
    add: "Añadir un canal",
    remove: "Quitar",
    moveUp: "Subir",
    save: "Guardar el perfil",
    saving: "Guardando…",
    saved: "Perfil guardado.",
    viewPage: "Ver tu página pública",
    shortLink: "Tu enlace corto",
    shortLinkHint: "Para decirlo en directo o ponerlo en tus paneles: abre tu página en el idioma de quien lo usa.",
    copy: "Copiar",
    copied: "Copiado",
    missing: "El perfil público llega pronto: estará disponible con la próxima actualización del sitio.",
    readError: "Ahora mismo no podemos leer tu perfil. Vuelve a cargar la página en un momento.",
    errors: {
      bioLong: "Tu bio supera los 280 caracteres.",
      invalid: "Esta no es la dirección de un canal de {platform}.",
      http: "La dirección debe empezar por https://.",
      shortener: "Nada de enlaces acortados (bit.ly, tinyurl…): pega la dirección real.",
      long: "La dirección es demasiado larga.",
      kind: "Elige la plataforma.",
      tooMany: "Hasta 8 canales.",
      notLoggedIn: "Inicia sesión para editar tu perfil.",
      db: "No se pudo guardar el perfil. Inténtalo de nuevo en un momento.",
      disabled: "Las cuentas no están disponibles en este momento.",
    },
  },
  profile: {
    langs: "Contenido en",
    organizedTitle: "Torneos organizados",
    organizedIntro: "Los torneos públicos organizados en OriginsMeta, del más reciente al más antiguo.",
    directoryLink: "Todos los creadores",
  },
  directory: {
    kicker: "Comunidad",
    h1: "Creadores de contenido de Origins TCG",
    metaTitle: "Creadores de contenido de Origins TCG",
    description:
      "Streamers, youtubers y jugadores que crean contenido de Origins TCG: sus canales, sus idiomas, los mazos que publican en OriginsMeta y quién está en directo.",
    intro:
      "Todas las personas con una etiqueta de autor en OriginsMeta: Autor, Influencer, Pro y Staff. Filtra por idioma y plataforma; quien está en directo con Origins TCG ahora mismo lleva la etiqueta LIVE.",
    order: "Orden: primero quien crea contenido en el idioma de esta página, luego quien ha publicado más mazos y después por nombre.",
    lang: "Idioma",
    platform: "Plataforma",
    all: "Todos",
    results: "{n} creadores",
    noResults: "Ningún creador coincide con estos filtros.",
    decksMany: "{n} mazos",
    deckOne: "1 mazo",
    noDecks: "Todavía sin mazos",
    profile: "Ver el perfil",
    empty: "Aquí aparecerán los creadores de Origins TCG: la página se llena a medida que el staff asigna las primeras etiquetas de autor.",
    inviteTitle: "¿Creas contenido de Origins TCG?",
    inviteText:
      "Pide la etiqueta de Autor: sin límite de mazos publicados, torneos en el calendario del sitio con tu propia portada, tu ficha en esta página y las guías de tus mazos traducidas automáticamente al inglés y al italiano.",
    inviteMail: "Escríbenos",
    inviteMailSubject: "Etiqueta de Autor en OriginsMeta",
    inviteGuide: "Envíanos una guía",
    listName: "Los creadores de Origins TCG en OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español" },
  privacy:
    "Perfil público. La bio, los canales y los idiomas que escribes en «Tu perfil público» (página Perfil) son públicos: aparecen en tu página /u y, si tienes una etiqueta de autor, en la página de creadores y junto a tu nombre en tus mazos. Puedes cambiarlos o borrarlos cuando quieras. Para quien tiene una etiqueta de autor y un canal de Twitch, nuestro servidor pregunta a Twitch cada pocos minutos si el canal está en directo con Origins TCG (datos públicos del canal); tu navegador no contacta con Twitch hasta que abres el enlace.",
  footer: "Creadores de contenido",
};

export const creatorLabels: Record<Locale, CreatorLabels> = { en, it, es };

/** Sostituisce i segnaposto {chiave} di un'etichetta. */
export function fillCreator(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.hasOwn(values, key) ? String(values[key]) : match));
}
