import type { Locale } from "./i18n";

/**
 * Etichette del profilo pubblico e delle funzioni per i creator (pacchetto CREATOR, 26/09/2026): modulo "Il tuo
 * profilo" in /account, bio e canali su /u, icone accanto al nome nei mazzi, badge LIVE, directory /creators, riga
 * della privacy, voce del footer. Stanno qui e non nei dizionari (stesso schema di feedbackLabels.ts e loginLabels.ts):
 * l'inglese è il tipo di riferimento, italiano e spagnolo si scrivono insieme. Spagnolo neutro con il tú
 * (docs/spagnolo.md). Il file importa solo un tipo: si può passare ai componenti del browser senza i dizionari.
 *
 * Nell'interfaccia la parola "creator" non c'è (commit f22e427: si confondeva con il tag Autore): la directory si
 * chiama "Autori e streamer" (l'indirizzo resta /creators); il nome definitivo lo decide Pierluigi.
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
    /** indirizzo non valido scelto come sito web */
    invalidWebsite: string;
    http: string;
    shortener: string;
    redirect: string;
    /** sito web su un host di una piattaforma che ha un tipo suo: {platform} */
    platform: string;
    long: string;
    kind: string;
    tooMany: string;
    /** due salvataggi a pochi secondi l'uno dall'altro */
    tooFast: string;
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
  /** voce "tutte" del filtro per lingua */
  allLangs: string;
  /** voce "tutte" del filtro per piattaforma (in spagnolo cambia il genere) */
  allPlatforms: string;
  /** {n} */
  results: string;
  resultsOne: string;
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
    /** link alla directory */
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
      "Your bio, channels and languages appear on your public page. If you have an author tag (Author, Influencer, Pro, Staff) they also appear on the authors and streamers page, and your first three channels next to your name on your decks.",
    bio: "Bio",
    bioHint: "Plain text, up to 280 characters. No links here: channels go below.",
    bioPlaceholder: "E.g. Italian streamer, control decks and Crimson Cup prep every Tuesday night.",
    langs: "Languages of your content",
    langsHint: "Used by the language filter on the authors and streamers page.",
    channels: "Your channels",
    channelsHint:
      "Up to 8. Paste the channel address, or just the name for Twitch, YouTube, X, TikTok, Instagram and Kick. With an author tag, the first three appear next to your name on your decks.",
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
      invalidWebsite: "This is not a valid website address.",
      http: "The address must start with https://.",
      shortener: "No shortened links (bit.ly, tinyurl…): paste the real address.",
      redirect: "No redirect links: paste the address of the page itself.",
      platform: "This is a {platform} address: choose {platform} as the platform.",
      long: "This address is too long.",
      kind: "Choose a platform.",
      tooMany: "Up to 8 channels.",
      tooFast: "You just saved: wait a few seconds and try again.",
      notLoggedIn: "Sign in to edit your profile.",
      db: "We couldn't save your profile. Try again in a moment.",
      disabled: "Accounts are not available right now.",
    },
  },
  profile: {
    langs: "Content in",
    organizedTitle: "Organized tournaments",
    organizedIntro: "Public tournaments run on OriginsMeta, most recent first.",
    directoryLink: "All authors and streamers",
  },
  directory: {
    kicker: "Community",
    h1: "Origins TCG authors and streamers",
    metaTitle: "Origins TCG authors and streamers",
    description:
      "Streamers, YouTubers and players who make Origins TCG content: their channels, languages, decks published on OriginsMeta and who is live on Twitch now.",
    intro:
      "Everyone with an author tag on OriginsMeta (Author, Influencer, Pro, Staff) who has filled in their public profile. Filter by language and platform; whoever is live on Origins TCG right now shows the LIVE badge.",
    order: "Order: first people who make content in this page's language, then those with more published decks, then by name.",
    lang: "Language",
    platform: "Platform",
    allLangs: "All",
    allPlatforms: "All",
    results: "{n} profiles",
    resultsOne: "1 profile",
    noResults: "No profile matches these filters.",
    decksMany: "{n} decks",
    deckOne: "1 deck",
    noDecks: "No decks yet",
    profile: "See profile",
    empty: "Origins TCG authors and streamers will appear here: the page fills up as the staff assigns author tags and their holders fill in their public profile.",
    inviteTitle: "Do you make Origins TCG content?",
    inviteText:
      "Ask for the Author tag: no cap on published decks, tournaments on the site calendar with your own cover and, once your public profile is filled in, your card on this page.",
    inviteMail: "Write to us",
    inviteMailSubject: "Author tag on OriginsMeta",
    inviteGuide: "Send us a guide",
    listName: "Origins TCG authors and streamers on OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español" },
  privacy:
    "Public profile. The bio, channels and languages you write under \"Your public profile\" (My profile) are public: they appear on your /u page and, if you have an author tag, on the authors and streamers page and next to your name on your decks. You can change or delete them at any time. For people with an author tag and a Twitch channel, our server asks Twitch whether the channel is live on Origins TCG (public channel data) at most once every 90 seconds, when someone opens a page that shows the badge; your browser does not contact Twitch until you open the link.",
  footer: "Authors and streamers",
};

const it: CreatorLabels = {
  channels: { website: "Sito web", newTab: "(si apre in una nuova scheda)", listOf: "Canali di {name}" },
  live: { badge: "LIVE", title: "In diretta su Twitch ora: {viewers} spettatori" },
  form: {
    title: "Il tuo profilo pubblico",
    intro:
      "Bio, canali e lingue compaiono sulla tua pagina pubblica. Se hai un tag autore (Autore, Influencer, Pro, Staff) anche nella pagina Autori e streamer, e i primi tre canali accanto al tuo nome nei tuoi mazzi.",
    bio: "Bio",
    bioHint: "Testo semplice, al massimo 280 caratteri. Niente link qui: i canali vanno sotto.",
    bioPlaceholder: "Es. Streamer italiano, mazzi control e preparazione alla Crimson Cup il martedì sera.",
    langs: "Lingue dei tuoi contenuti",
    langsHint: "Servono al filtro per lingua della pagina Autori e streamer.",
    channels: "I tuoi canali",
    channelsHint:
      "Fino a 8. Incolla l'indirizzo del canale, o solo il nome per Twitch, YouTube, X, TikTok, Instagram e Kick. Con un tag autore i primi tre compaiono accanto al tuo nome nei tuoi mazzi.",
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
      invalidWebsite: "Questo non è un indirizzo di sito web valido.",
      http: "L'indirizzo deve cominciare con https://.",
      shortener: "Niente link accorciati (bit.ly, tinyurl…): incolla l'indirizzo vero.",
      redirect: "Niente link di reindirizzamento: incolla l'indirizzo della pagina vera.",
      platform: "Questo è un indirizzo di {platform}: scegli {platform} come piattaforma.",
      long: "Indirizzo troppo lungo.",
      kind: "Scegli la piattaforma.",
      tooMany: "Al massimo 8 canali.",
      tooFast: "Hai appena salvato: aspetta qualche secondo e riprova.",
      notLoggedIn: "Accedi per modificare il profilo.",
      db: "Non è stato possibile salvare il profilo. Riprova tra poco.",
      disabled: "Gli account non sono disponibili in questo momento.",
    },
  },
  profile: {
    langs: "Contenuti in",
    organizedTitle: "Tornei organizzati",
    organizedIntro: "I tornei pubblici organizzati su OriginsMeta, dal più recente.",
    directoryLink: "Tutti gli autori e gli streamer",
  },
  directory: {
    kicker: "Community",
    h1: "Autori e streamer di Origins TCG",
    metaTitle: "Autori e streamer di Origins TCG",
    description:
      "Streamer, youtuber e giocatori che fanno contenuti su Origins TCG: i loro canali, le lingue, i mazzi pubblicati su OriginsMeta e chi è in diretta su Twitch.",
    intro:
      "Tutte le persone con un tag autore su OriginsMeta (Autore, Influencer, Pro, Staff) che hanno compilato il profilo pubblico. Filtra per lingua e piattaforma; chi è in diretta su Origins TCG in questo momento ha il bollino LIVE.",
    order: "Ordine: prima chi fa contenuti nella lingua di questa pagina, poi chi ha pubblicato più mazzi, poi per nome.",
    lang: "Lingua",
    platform: "Piattaforma",
    allLangs: "Tutte",
    allPlatforms: "Tutte",
    results: "{n} profili",
    resultsOne: "1 profilo",
    noResults: "Nessun profilo corrisponde ai filtri.",
    decksMany: "{n} mazzi",
    deckOne: "1 mazzo",
    noDecks: "Ancora nessun mazzo",
    profile: "Vedi il profilo",
    empty: "Qui arriveranno gli autori e gli streamer di Origins TCG: la pagina si riempie man mano che lo staff assegna i tag autore e chi li ha compila il profilo pubblico.",
    inviteTitle: "Fai contenuti su Origins TCG?",
    inviteText:
      "Chiedi il tag Autore: nessun tetto ai mazzi pubblicati, tornei nel calendario del sito con la tua copertina e, compilato il profilo pubblico, la tua scheda in questa pagina.",
    inviteMail: "Scrivici",
    inviteMailSubject: "Tag Autore su OriginsMeta",
    inviteGuide: "Mandaci una guida",
    listName: "Autori e streamer di Origins TCG su OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español" },
  privacy:
    "Profilo pubblico. La bio, i canali e le lingue che scrivi in «Il tuo profilo pubblico» (Il mio profilo) sono pubblici: compaiono sulla tua pagina /u e, se hai un tag autore, nella pagina Autori e streamer e accanto al tuo nome nei tuoi mazzi. Puoi cambiarli o cancellarli quando vuoi. Per chi ha un tag autore e un canale Twitch, il nostro server chiede a Twitch se il canale è in diretta su Origins TCG (dati pubblici del canale) al massimo una volta ogni 90 secondi, quando qualcuno apre una pagina con il bollino; il tuo browser non contatta Twitch finché non apri il link.",
  footer: "Autori e streamer",
};

const es: CreatorLabels = {
  channels: { website: "Sitio web", newTab: "(se abre en una pestaña nueva)", listOf: "Canales de {name}" },
  live: { badge: "LIVE", title: "En directo en Twitch ahora: {viewers} espectadores" },
  form: {
    title: "Tu perfil público",
    intro:
      "Tu bio, tus canales y tus idiomas aparecen en tu página pública. Si tienes una etiqueta de autor (Autor, Influencer, Pro, Staff), también en la página Autores y streamers, y tus tres primeros canales junto a tu nombre en tus mazos.",
    bio: "Bio",
    bioHint: "Texto simple, hasta 280 caracteres. Sin enlaces aquí: los canales van abajo.",
    bioPlaceholder: "Ej.: streamer en español, mazos de control y preparación para la Crimson Cup los martes por la noche.",
    langs: "Idiomas de tu contenido",
    langsHint: "Sirven para el filtro por idioma de la página Autores y streamers.",
    channels: "Tus canales",
    channelsHint:
      "Hasta 8. Pega la dirección del canal, o solo el nombre para Twitch, YouTube, X, TikTok, Instagram y Kick. Con una etiqueta de autor, los tres primeros aparecen junto a tu nombre en tus mazos.",
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
      invalidWebsite: "Esta no es una dirección de sitio web válida.",
      http: "La dirección debe empezar por https://.",
      shortener: "Nada de enlaces acortados (bit.ly, tinyurl…): pega la dirección real.",
      redirect: "Nada de enlaces de redirección: pega la dirección de la página real.",
      platform: "Esta es una dirección de {platform}: elige {platform} como plataforma.",
      long: "La dirección es demasiado larga.",
      kind: "Elige la plataforma.",
      tooMany: "Hasta 8 canales.",
      tooFast: "Acabas de guardar: espera unos segundos y vuelve a intentarlo.",
      notLoggedIn: "Inicia sesión para editar tu perfil.",
      db: "No se pudo guardar el perfil. Inténtalo de nuevo en un momento.",
      disabled: "Las cuentas no están disponibles en este momento.",
    },
  },
  profile: {
    langs: "Contenido en",
    organizedTitle: "Torneos organizados",
    organizedIntro: "Los torneos públicos organizados en OriginsMeta, del más reciente al más antiguo.",
    directoryLink: "Todos los autores y streamers",
  },
  directory: {
    kicker: "Comunidad",
    h1: "Autores y streamers de Origins TCG",
    metaTitle: "Autores y streamers de Origins TCG",
    description:
      "Streamers, youtubers y jugadores que crean contenido de Origins TCG: sus canales, sus idiomas, los mazos que publican en OriginsMeta y quién está en directo.",
    intro:
      "Todas las personas con una etiqueta de autor en OriginsMeta (Autor, Influencer, Pro, Staff) que han completado su perfil público. Filtra por idioma y plataforma; quien está en directo con Origins TCG ahora mismo lleva la etiqueta LIVE.",
    order: "Orden: primero quien crea contenido en el idioma de esta página, luego quien ha publicado más mazos y después por nombre.",
    lang: "Idioma",
    platform: "Plataforma",
    allLangs: "Todos",
    allPlatforms: "Todas",
    results: "{n} perfiles",
    resultsOne: "1 perfil",
    noResults: "Ningún perfil coincide con estos filtros.",
    decksMany: "{n} mazos",
    deckOne: "1 mazo",
    noDecks: "Todavía sin mazos",
    profile: "Ver el perfil",
    empty: "Aquí aparecerán los autores y streamers de Origins TCG: la página se llena a medida que el staff asigna las etiquetas de autor y quienes las tienen completan su perfil público.",
    inviteTitle: "¿Creas contenido de Origins TCG?",
    inviteText:
      "Pide la etiqueta de Autor: sin límite de mazos publicados, torneos en el calendario del sitio con tu propia portada y, con tu perfil público completo, tu ficha en esta página.",
    inviteMail: "Escríbenos",
    inviteMailSubject: "Etiqueta de Autor en OriginsMeta",
    inviteGuide: "Envíanos una guía",
    listName: "Autores y streamers de Origins TCG en OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español" },
  privacy:
    "Perfil público. La bio, los canales y los idiomas que escribes en «Tu perfil público» (Mi perfil) son públicos: aparecen en tu página /u y, si tienes una etiqueta de autor, en la página Autores y streamers y junto a tu nombre en tus mazos. Puedes cambiarlos o borrarlos cuando quieras. Para quien tiene una etiqueta de autor y un canal de Twitch, nuestro servidor pregunta a Twitch si el canal está en directo con Origins TCG (datos públicos del canal) como mucho una vez cada 90 segundos, cuando alguien abre una página con la etiqueta; tu navegador no contacta con Twitch hasta que abres el enlace.",
  footer: "Autores y streamers",
};

export const creatorLabels: Record<Locale, CreatorLabels> = { en, it, es };

/** Sostituisce i segnaposto {chiave} di un'etichetta. */
export function fillCreator(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.hasOwn(values, key) ? String(values[key]) : match));
}
