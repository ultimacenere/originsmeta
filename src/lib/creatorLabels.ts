import type { Locale } from "./i18n";

/**
 * Etichette del profilo pubblico e delle funzioni per i creator (pacchetto CREATOR, 26/09/2026): modulo "Il tuo
 * profilo" in /account, bio e canali su /u, icone accanto al nome nei mazzi, badge LIVE, directory /creators, riga
 * della privacy, voce del footer. Stanno qui e non nei dizionari (stesso schema di feedbackLabels.ts e loginLabels.ts):
 * l'inglese è il tipo di riferimento, italiano e spagnolo si scrivono insieme. Spagnolo neutro con il tú
 * (docs/spagnolo.md). Il file importa solo un tipo: si può passare ai componenti del browser senza i dizionari.
 *
 * Ruoli (27/09/2026, Pierluigi: "Ti ripeto i ruoli e tag: Staff, Creator, Autore, Community"; "Pro rimane, Influencer
 * scompare"): "Creator" torna nell'interfaccia come nome del ruolo, uguale nelle tre lingue; l'Autore è "Autore / Author
 * / Autor". I nomi dei ruoli nei testi qui sotto sono quelli di `community.badges` dei dizionari (il test lo controlla).
 * La directory si chiama "Creator e autori / Creators and authors / Creadores y autores" (l'indirizzo resta /creators).
 * Dal 25 al 27/09 l'id `creator` si mostrava come "Autore" e la parola "creator" era vietata qui (commit f22e427).
 *
 * I nomi delle piattaforme (Twitch, YouTube…) sono marchi e restano uguali in ogni lingua: stanno in
 * `LINK_KIND_NAMES` di src/lib/community/profileLinks.ts; qui c'è solo "Sito web". Segnaposto fra graffe: {n},
 * {platform}, {viewers}, {name}, {max} (caratteri della bio), {lines} (righe della bio), {authorDecks} (tetto ai
 * mazzi dell'Autore).
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
  /** avviso sotto la bio quando supera le righe ammesse (27/09/2026) */
  bioLinesOver: string;
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
  /** filtro per ruolo (27/09/2026) e la sua voce "tutti" */
  role: string;
  allRoles: string;
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

/** Voce "Ora live" della striscia del calendario (28/09/2026): compare solo se almeno un creator è in diretta. */
export type LiveStripLabels = {
  title: string;
  /** un solo creator in diretta: {name} */
  one: string;
  /** più creator in diretta: {n} */
  many: string;
};

/** Pagina /live con i creator in diretta (28/09/2026, idea di Davdas ripresa da Pierluigi). */
export type LivePageLabels = {
  kicker: string;
  h1: string;
  /** title della SERP: con "Origins TCG" dentro, entro 60 caratteri con " · OriginsMeta" */
  metaTitle: string;
  /** 120–158 caratteri */
  description: string;
  intro: string;
  loading: string;
  none: string;
  /** il sito non ha le chiavi di Twitch */
  off: string;
  /** "Spettatori: {viewers}" */
  viewers: string;
  profile: string;
  openTwitch: string;
  /** lettore a clic: nome accessibile del tasto, {name} */
  watch: string;
  /** titolo dell'iframe e didascalia: {name} */
  playerTitle: string;
  /** sotto il tasto, prima del clic */
  consent: string;
  privacy: string;
  /** riquadro sotto 400×300: la diretta si apre su Twitch */
  narrow: string;
  /** nome accessibile del tasto quando il clic apre Twitch: {name} */
  openAria: string;
  streamersTitle: string;
  streamersIntro: string;
  streamersEmpty: string;
  twitchChannel: string;
  howTo: string;
  allCreators: string;
};

export type CreatorLabels = {
  channels: ChannelLabels;
  live: LiveLabels;
  liveNow: { strip: LiveStripLabels; page: LivePageLabels };
  form: ProfileFormLabels;
  profile: {
    /** "Contenuti in" + lingue */
    langs: string;
    organizedTitle: string;
    /** link alla directory */
    directoryLink: string;
  };
  directory: DirectoryLabels;
  /** nomi delle lingue dei contenuti, nella loro lingua */
  langNames: Record<Locale, string>;
  /** paragrafo della pagina privacy (#profile) */
  privacy: string;
  /** voce della colonna "Esplora" del footer */
  footer: string;
};

const en: CreatorLabels = {
  channels: { website: "Website", newTab: "(opens in a new tab)", listOf: "{name}'s channels" },
  live: { badge: "LIVE", title: "Live on Twitch now: {viewers} viewers" },
  liveNow: {
    strip: { title: "Live now", one: "{name} is live", many: "{n} creators live" },
    page: {
      kicker: "Live on Twitch",
      h1: "Origins TCG creators live now",
      metaTitle: "Origins TCG creators live on Twitch now",
      description:
        "See which Origins TCG creators, authors, Pro players and staff are streaming on Twitch right now, and watch them live without leaving OriginsMeta.",
      intro:
        "Who among the people with the Creator, Author, Pro or Staff role on OriginsMeta is streaming Origins TCG on Twitch right now. The page updates by itself every minute.",
      loading: "Checking who's live…",
      none: "Nobody is streaming Origins TCG right now. Come back later: this page updates by itself.",
      off: "Live status isn't available right now.",
      viewers: "Viewers: {viewers}",
      profile: "Profile",
      openTwitch: "Open on Twitch",
      watch: "Watch {name}'s stream here",
      playerTitle: "{name} live on Twitch",
      consent: "Loading the stream means accepting Twitch's cookies.",
      privacy: "Privacy",
      narrow: "On a small screen the stream opens on Twitch.",
      openAria: "Open {name}'s stream on Twitch (new tab)",
      streamersTitle: "Streamers on OriginsMeta",
      streamersIntro: "Creators, authors, Pro players and staff with a Twitch channel in their profile: when they stream Origins TCG, they show up above.",
      streamersEmpty: "Nobody has added a Twitch channel to their profile yet.",
      twitchChannel: "Twitch channel",
      howTo:
        "Do you stream Origins TCG? Add your Twitch channel in your account, under “Edit my public page”. With the Creator, Author, Pro or Staff role you show up here while you're live in the Origins TCG category, or with “Origins TCG” in the stream title.",
      allCreators: "All creators and authors",
    },
  },
  form: {
    title: "Your public profile",
    intro:
      "Your bio, channels and languages appear on your public page. If you have the Creator, Author, Pro or Staff role they also appear on the Creators and authors page, and your first three channels next to your name on your decks.",
    bio: "Bio",
    bioHint: "Plain text, up to {max} characters and {lines} lines. No links here: channels go below.",
    bioLinesOver: "More than {lines} lines: when you save, the extra lines are joined to the last one.",
    bioPlaceholder: "E.g. Italian streamer, control decks and Crimson Cup prep every Tuesday night.",
    langs: "Languages of your content",
    langsHint: "Used by the language filter on the Creators and authors page.",
    channels: "Your channels",
    channelsHint:
      "Up to 8. Paste the channel address, or just the name for Twitch, YouTube, X, TikTok, Instagram and Kick. With the Creator, Author, Pro or Staff role, the first three appear next to your name on your decks.",
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
      bioLong: "Your bio is longer than {max} characters.",
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
    directoryLink: "All creators and authors",
  },
  directory: {
    kicker: "Community",
    h1: "Origins TCG creators and authors",
    metaTitle: "Origins TCG creators and authors",
    description:
      "Creators, authors and streamers who make Origins TCG content: their channels, languages, decks published on OriginsMeta and who is live on Twitch now.",
    intro:
      "Everyone on OriginsMeta with the Creator, Author, Pro or Staff role who has filled in their public profile. Filter by role, language and platform; whoever is live on Origins TCG right now shows the LIVE badge.",
    order: "Order: first people who make content in this page's language, then those with more published decks, then by name.",
    lang: "Language",
    platform: "Platform",
    role: "Role",
    allRoles: "All",
    allLangs: "All",
    allPlatforms: "All",
    results: "{n} profiles",
    resultsOne: "1 profile",
    noResults: "No profile matches these filters.",
    decksMany: "{n} decks",
    deckOne: "1 deck",
    noDecks: "No decks yet",
    profile: "See profile",
    empty: "Origins TCG creators and authors will appear here: the page fills up as the staff assigns roles and their holders fill in their public profile.",
    inviteTitle: "Do you make Origins TCG content?",
    inviteText:
      "Ask for a role. Creator: no cap on published decks and tournaments on the site calendar with your own cover. Author: up to {authorDecks} published decks. Once your public profile is filled in, your card appears on this page.",
    inviteMail: "Write to us",
    inviteMailSubject: "Creator or Author role on OriginsMeta",
    inviteGuide: "Send us a guide",
    listName: "Origins TCG creators and authors on OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français", pt: "Português", de: "Deutsch", ru: "Русский" },
  privacy:
    "Public profile. The bio, channels and languages you write under \"Your public profile\" (My profile › Edit my public page) are public: they appear on your /u page and, if you have the Creator, Author, Pro or Staff role, on the Creators and authors page and next to your name on your decks. You can change or delete them at any time. For people with one of these roles and a Twitch channel, our server asks Twitch whether the channel is live on Origins TCG (public channel data) at most once every 90 seconds, when someone opens a page that shows the badge; your browser does not contact Twitch until you open the link.",
  footer: "Creators and authors",
};

const it: CreatorLabels = {
  channels: { website: "Sito web", newTab: "(si apre in una nuova scheda)", listOf: "Canali di {name}" },
  live: { badge: "LIVE", title: "In diretta su Twitch ora: {viewers} spettatori" },
  liveNow: {
    strip: { title: "Ora live", one: "{name} è in diretta", many: "{n} creator in diretta" },
    page: {
      kicker: "Dirette su Twitch",
      h1: "Creator di Origins TCG in diretta ora",
      metaTitle: "Creator di Origins TCG in diretta su Twitch",
      description:
        "Scopri quali creator, autori, Pro e staff di Origins TCG sono in diretta su Twitch in questo momento e guardali senza lasciare OriginsMeta.",
      intro:
        "Chi fra le persone con il ruolo Creator, Autore, Pro o Staff su OriginsMeta sta trasmettendo Origins TCG su Twitch in questo momento. La pagina si aggiorna da sola ogni minuto.",
      loading: "Controllo chi è in diretta…",
      none: "In questo momento nessuno sta trasmettendo Origins TCG. Torna più tardi: la pagina si aggiorna da sola.",
      off: "Lo stato delle dirette non è disponibile in questo momento.",
      viewers: "Spettatori: {viewers}",
      profile: "Profilo",
      openTwitch: "Apri su Twitch",
      watch: "Guarda qui la diretta di {name}",
      playerTitle: "{name} in diretta su Twitch",
      consent: "Caricando la diretta accetti i cookie di Twitch.",
      privacy: "Privacy",
      narrow: "Su uno schermo piccolo la diretta si apre su Twitch.",
      openAria: "Apri su Twitch la diretta di {name} (nuova scheda)",
      streamersTitle: "Gli streamer di OriginsMeta",
      streamersIntro: "Creator, autori, Pro e staff con un canale Twitch nel profilo: quando trasmettono Origins TCG compaiono qui sopra.",
      streamersEmpty: "Nessuno ha ancora aggiunto un canale Twitch al profilo.",
      twitchChannel: "Canale Twitch",
      howTo:
        "Trasmetti Origins TCG? Aggiungi il tuo canale Twitch nel tuo account, in “Modifica la mia pagina pubblica”. Con il ruolo Creator, Autore, Pro o Staff compari qui mentre sei in diretta nella categoria Origins TCG, oppure con “Origins TCG” nel titolo.",
      allCreators: "Tutti i creator e gli autori",
    },
  },
  form: {
    title: "Il tuo profilo pubblico",
    intro:
      "Bio, canali e lingue compaiono sulla tua pagina pubblica. Se hai il ruolo Creator, Autore, Pro o Staff anche nella pagina Creator e autori, e i primi tre canali accanto al tuo nome nei tuoi mazzi.",
    bio: "Bio",
    bioHint: "Testo semplice, al massimo {max} caratteri e {lines} righe. Niente link qui: i canali vanno sotto.",
    bioLinesOver: "Più di {lines} righe: quando salvi, quelle in più si uniscono all'ultima.",
    bioPlaceholder: "Es. Streamer italiano, mazzi control e preparazione alla Crimson Cup il martedì sera.",
    langs: "Lingue dei tuoi contenuti",
    langsHint: "Servono al filtro per lingua della pagina Creator e autori.",
    channels: "I tuoi canali",
    channelsHint:
      "Fino a 8. Incolla l'indirizzo del canale, o solo il nome per Twitch, YouTube, X, TikTok, Instagram e Kick. Con il ruolo Creator, Autore, Pro o Staff i primi tre compaiono accanto al tuo nome nei tuoi mazzi.",
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
      bioLong: "La bio supera i {max} caratteri.",
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
    directoryLink: "Tutti i creator e gli autori",
  },
  directory: {
    kicker: "Community",
    h1: "Creator e autori di Origins TCG",
    metaTitle: "Creator e autori di Origins TCG",
    description:
      "Creator, autori e streamer che fanno contenuti su Origins TCG: i loro canali, le lingue, i mazzi pubblicati su OriginsMeta e chi è in diretta su Twitch.",
    intro:
      "Tutte le persone con il ruolo Creator, Autore, Pro o Staff su OriginsMeta che hanno compilato il profilo pubblico. Filtra per ruolo, lingua e piattaforma; chi è in diretta su Origins TCG in questo momento ha il bollino LIVE.",
    order: "Ordine: prima chi fa contenuti nella lingua di questa pagina, poi chi ha pubblicato più mazzi, poi per nome.",
    lang: "Lingua",
    platform: "Piattaforma",
    role: "Ruolo",
    allRoles: "Tutti",
    allLangs: "Tutte",
    allPlatforms: "Tutte",
    results: "{n} profili",
    resultsOne: "1 profilo",
    noResults: "Nessun profilo corrisponde ai filtri.",
    decksMany: "{n} mazzi",
    deckOne: "1 mazzo",
    noDecks: "Ancora nessun mazzo",
    profile: "Vedi il profilo",
    empty: "Qui arriveranno i creator e gli autori di Origins TCG: la pagina si riempie man mano che lo staff assegna i ruoli e chi li ha compila il profilo pubblico.",
    inviteTitle: "Fai contenuti su Origins TCG?",
    inviteText:
      "Chiedi un ruolo. Creator: nessun tetto ai mazzi pubblicati e tornei nel calendario del sito con la tua copertina. Autore: fino a {authorDecks} mazzi pubblicati. Compilato il profilo pubblico, la tua scheda compare in questa pagina.",
    inviteMail: "Scrivici",
    inviteMailSubject: "Ruolo Creator o Autore su OriginsMeta",
    inviteGuide: "Mandaci una guida",
    listName: "Creator e autori di Origins TCG su OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français", pt: "Português", de: "Deutsch", ru: "Русский" },
  privacy:
    "Profilo pubblico. La bio, i canali e le lingue che scrivi in «Il tuo profilo pubblico» (Il mio profilo › Modifica la mia pagina pubblica) sono pubblici: compaiono sulla tua pagina /u e, se hai il ruolo Creator, Autore, Pro o Staff, nella pagina Creator e autori e accanto al tuo nome nei tuoi mazzi. Puoi cambiarli o cancellarli quando vuoi. Per chi ha uno di questi ruoli e un canale Twitch, il nostro server chiede a Twitch se il canale è in diretta su Origins TCG (dati pubblici del canale) al massimo una volta ogni 90 secondi, quando qualcuno apre una pagina con il bollino; il tuo browser non contatta Twitch finché non apri il link.",
  footer: "Creator e autori",
};

const es: CreatorLabels = {
  channels: { website: "Sitio web", newTab: "(se abre en una pestaña nueva)", listOf: "Canales de {name}" },
  live: { badge: "LIVE", title: "En directo en Twitch ahora: {viewers} espectadores" },
  liveNow: {
    strip: { title: "En directo", one: "{name} está en directo", many: "{n} creadores en directo" },
    page: {
      kicker: "Directos en Twitch",
      h1: "Creadores de Origins TCG en directo ahora",
      metaTitle: "Creadores de Origins TCG en directo en Twitch",
      description:
        "Descubre qué creadores, autores, Pro y staff de Origins TCG están en directo en Twitch ahora mismo y míralos sin salir de OriginsMeta.",
      intro:
        "Quién de las personas con el rol Creator, Autor, Pro o Staff en OriginsMeta está transmitiendo Origins TCG en Twitch ahora mismo. La página se actualiza sola cada minuto.",
      loading: "Comprobando quién está en directo…",
      none: "Ahora mismo nadie está transmitiendo Origins TCG. Vuelve más tarde: la página se actualiza sola.",
      off: "El estado de los directos no está disponible ahora mismo.",
      viewers: "Espectadores: {viewers}",
      profile: "Perfil",
      openTwitch: "Abrir en Twitch",
      watch: "Mira aquí el directo de {name}",
      playerTitle: "{name} en directo en Twitch",
      consent: "Al cargar el directo aceptas las cookies de Twitch.",
      privacy: "Privacidad",
      narrow: "En una pantalla pequeña, el directo se abre en Twitch.",
      openAria: "Abrir en Twitch el directo de {name} (pestaña nueva)",
      streamersTitle: "Los streamers de OriginsMeta",
      streamersIntro: "Creadores, autores, Pro y staff con un canal de Twitch en su perfil: cuando transmiten Origins TCG, aparecen aquí arriba.",
      streamersEmpty: "Nadie ha añadido todavía un canal de Twitch a su perfil.",
      twitchChannel: "Canal de Twitch",
      howTo:
        "¿Transmites Origins TCG? Añade tu canal de Twitch en tu cuenta, en “Editar mi página pública”. Con el rol Creator, Autor, Pro o Staff apareces aquí mientras estás en directo en la categoría Origins TCG, o con “Origins TCG” en el título.",
      allCreators: "Todos los creadores y autores",
    },
  },
  form: {
    title: "Tu perfil público",
    intro:
      "Tu bio, tus canales y tus idiomas aparecen en tu página pública. Si tienes el rol Creator, Autor, Pro o Staff, también en la página Creadores y autores, y tus tres primeros canales junto a tu nombre en tus mazos.",
    bio: "Bio",
    bioHint: "Texto simple, hasta {max} caracteres y {lines} líneas. Sin enlaces aquí: los canales van abajo.",
    bioLinesOver: "Más de {lines} líneas: al guardar, las que sobran se unen a la última.",
    bioPlaceholder: "Ej.: streamer en español, mazos de control y preparación para la Crimson Cup los martes por la noche.",
    langs: "Idiomas de tu contenido",
    langsHint: "Sirven para el filtro por idioma de la página Creadores y autores.",
    channels: "Tus canales",
    channelsHint:
      "Hasta 8. Pega la dirección del canal, o solo el nombre para Twitch, YouTube, X, TikTok, Instagram y Kick. Con el rol Creator, Autor, Pro o Staff, los tres primeros aparecen junto a tu nombre en tus mazos.",
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
      bioLong: "Tu bio supera los {max} caracteres.",
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
    directoryLink: "Todos los creadores y autores",
  },
  directory: {
    kicker: "Comunidad",
    h1: "Creadores y autores de Origins TCG",
    metaTitle: "Creadores y autores de Origins TCG",
    description:
      "Creadores, autores y streamers que crean contenido de Origins TCG: sus canales, sus idiomas, los mazos que publican en OriginsMeta y quién está en directo.",
    intro:
      "Todas las personas con el rol Creator, Autor, Pro o Staff en OriginsMeta que han completado su perfil público. Filtra por rol, idioma y plataforma; quien está en directo con Origins TCG ahora mismo lleva la etiqueta LIVE.",
    order: "Orden: primero quien crea contenido en el idioma de esta página, luego quien ha publicado más mazos y después por nombre.",
    lang: "Idioma",
    platform: "Plataforma",
    role: "Rol",
    allRoles: "Todos",
    allLangs: "Todos",
    allPlatforms: "Todas",
    results: "{n} perfiles",
    resultsOne: "1 perfil",
    noResults: "Ningún perfil coincide con estos filtros.",
    decksMany: "{n} mazos",
    deckOne: "1 mazo",
    noDecks: "Todavía sin mazos",
    profile: "Ver el perfil",
    empty: "Aquí aparecerán los creadores y autores de Origins TCG: la página se llena a medida que el staff asigna los roles y quienes los tienen completan su perfil público.",
    inviteTitle: "¿Creas contenido de Origins TCG?",
    inviteText:
      "Pide un rol. Creator: sin límite de mazos publicados y torneos en el calendario del sitio con tu propia portada. Autor: hasta {authorDecks} mazos publicados. Con tu perfil público completo, tu ficha aparece en esta página.",
    inviteMail: "Escríbenos",
    inviteMailSubject: "Rol Creator o Autor en OriginsMeta",
    inviteGuide: "Envíanos una guía",
    listName: "Creadores y autores de Origins TCG en OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français", pt: "Português", de: "Deutsch", ru: "Русский" },
  privacy:
    "Perfil público. La bio, los canales y los idiomas que escribes en «Tu perfil público» (Mi perfil › Editar mi página pública) son públicos: aparecen en tu página /u y, si tienes el rol Creator, Autor, Pro o Staff, en la página Creadores y autores y junto a tu nombre en tus mazos. Puedes cambiarlos o borrarlos cuando quieras. Para quien tiene uno de estos roles y un canal de Twitch, nuestro servidor pregunta a Twitch si el canal está en directo con Origins TCG (datos públicos del canal) como mucho una vez cada 90 segundos, cuando alguien abre una página con la etiqueta; tu navegador no contacta con Twitch hasta que abres el enlace.",
  footer: "Creadores y autores",
};

/**
 * Francese (07/10/2026, docs/francese.md): "vous", ruoli Creator / Auteur / Pro / Staff, la directory è "Créateurs et
 * auteurs" (footer dentro H1 e title, come nelle altre lingue); spazio insecabile prima di : ; ? !
 */
const fr: CreatorLabels = {
  channels: { website: "Site web", newTab: "(s'ouvre dans un nouvel onglet)", listOf: "Chaînes de {name}" },
  live: { badge: "LIVE", title: "En direct sur Twitch : {viewers} spectateurs" },
  liveNow: {
    strip: { title: "En direct", one: "{name} est en direct", many: "{n} créateurs en direct" },
    page: {
      kicker: "En direct sur Twitch",
      h1: "Créateurs d'Origins TCG en direct",
      metaTitle: "Créateurs d'Origins TCG en direct sur Twitch",
      description:
        "Découvrez quels créateurs, auteurs, joueurs Pro et staff d'Origins TCG sont en direct sur Twitch en ce moment, et regardez-les sans quitter OriginsMeta.",
      intro:
        "Qui, parmi les personnes ayant le rôle Creator, Auteur, Pro ou Staff sur OriginsMeta, diffuse Origins TCG sur Twitch en ce moment. La page se met à jour toute seule chaque minute.",
      loading: "Vérification des lives en cours…",
      none: "Personne ne diffuse Origins TCG en ce moment. Revenez plus tard : cette page se met à jour toute seule.",
      off: "L'état des lives n'est pas disponible pour le moment.",
      viewers: "Spectateurs : {viewers}",
      profile: "Profil",
      openTwitch: "Ouvrir sur Twitch",
      watch: "Regarder le live de {name} ici",
      playerTitle: "{name} en direct sur Twitch",
      consent: "Charger le live, c'est accepter les cookies de Twitch.",
      privacy: "Confidentialité",
      narrow: "Sur un petit écran, le live s'ouvre sur Twitch.",
      openAria: "Ouvrir le live de {name} sur Twitch (nouvel onglet)",
      streamersTitle: "Les streamers d'OriginsMeta",
      streamersIntro: "Créateurs, auteurs, joueurs Pro et staff avec une chaîne Twitch dans leur profil : quand ils diffusent Origins TCG, ils apparaissent ci-dessus.",
      streamersEmpty: "Personne n'a encore ajouté de chaîne Twitch à son profil.",
      twitchChannel: "Chaîne Twitch",
      howTo:
        "Vous diffusez Origins TCG ? Ajoutez votre chaîne Twitch dans votre compte, sous « Modifier ma page publique ». Avec le rôle Creator, Auteur, Pro ou Staff, vous apparaissez ici pendant que vous êtes en direct dans la catégorie Origins TCG, ou avec « Origins TCG » dans le titre du stream.",
      allCreators: "Tous les créateurs et auteurs",
    },
  },
  form: {
    title: "Votre profil public",
    intro:
      "Votre bio, vos chaînes et vos langues apparaissent sur votre page publique. Si vous avez le rôle Creator, Auteur, Pro ou Staff, elles apparaissent aussi sur la page Créateurs et auteurs, et vos trois premières chaînes à côté de votre nom sur vos decks.",
    bio: "Bio",
    bioHint: "Texte simple, jusqu'à {max} caractères et {lines} lignes. Pas de liens ici : les chaînes vont plus bas.",
    bioLinesOver: "Plus de {lines} lignes : à l'enregistrement, les lignes en trop sont jointes à la dernière.",
    bioPlaceholder: "Ex. Streamer francophone, decks control et préparation de la Crimson Cup le mardi soir.",
    langs: "Langues de vos contenus",
    langsHint: "Utilisées par le filtre par langue de la page Créateurs et auteurs.",
    channels: "Vos chaînes",
    channelsHint:
      "Jusqu'à 8. Collez l'adresse de la chaîne, ou seulement le nom pour Twitch, YouTube, X, TikTok, Instagram et Kick. Avec le rôle Creator, Auteur, Pro ou Staff, les trois premières apparaissent à côté de votre nom sur vos decks.",
    kind: "Plateforme",
    url: "Adresse ou nom",
    add: "Ajouter une chaîne",
    remove: "Retirer",
    moveUp: "Monter",
    save: "Enregistrer le profil",
    saving: "Enregistrement…",
    saved: "Profil enregistré.",
    viewPage: "Voir votre page publique",
    shortLink: "Votre lien court",
    shortLinkHint: "À dire en live ou à mettre dans vos panneaux : il ouvre votre page dans la langue du visiteur.",
    copy: "Copier",
    copied: "Copié",
    missing: "Le profil public arrive bientôt : il sera disponible après la prochaine mise à jour du site.",
    readError: "Nous ne pouvons pas lire votre profil pour le moment. Rechargez la page dans un instant.",
    errors: {
      bioLong: "Votre bio dépasse {max} caractères.",
      invalid: "Ce n'est pas l'adresse d'une chaîne {platform}.",
      invalidWebsite: "Ce n'est pas une adresse de site web valide.",
      http: "L'adresse doit commencer par https://.",
      shortener: "Pas de liens raccourcis (bit.ly, tinyurl…) : collez l'adresse réelle.",
      redirect: "Pas de liens de redirection : collez l'adresse de la page elle-même.",
      platform: "C'est une adresse {platform} : choisissez {platform} comme plateforme.",
      long: "Cette adresse est trop longue.",
      kind: "Choisissez une plateforme.",
      tooMany: "Au plus 8 chaînes.",
      tooFast: "Vous venez d'enregistrer : attendez quelques secondes et réessayez.",
      notLoggedIn: "Connectez-vous pour modifier votre profil.",
      db: "Nous n'avons pas pu enregistrer votre profil. Réessayez dans un instant.",
      disabled: "Les comptes ne sont pas disponibles pour le moment.",
    },
  },
  profile: {
    langs: "Contenus en",
    organizedTitle: "Tournois organisés",
    directoryLink: "Tous les créateurs et auteurs",
  },
  directory: {
    kicker: "Communauté",
    h1: "Créateurs et auteurs d'Origins TCG",
    metaTitle: "Créateurs et auteurs d'Origins TCG",
    description:
      "Les créateurs, auteurs et streamers d'Origins TCG : leurs chaînes, leurs langues, leurs decks publiés sur OriginsMeta et qui est en direct sur Twitch.",
    intro:
      "Toutes les personnes ayant le rôle Creator, Auteur, Pro ou Staff sur OriginsMeta qui ont rempli leur profil public. Filtrez par rôle, langue et plateforme ; qui est en direct sur Origins TCG en ce moment porte le badge LIVE.",
    order: "Ordre : d'abord les personnes qui font du contenu dans la langue de cette page, puis celles qui ont publié le plus de decks, puis par nom.",
    lang: "Langue",
    platform: "Plateforme",
    role: "Rôle",
    allRoles: "Tous",
    allLangs: "Toutes",
    allPlatforms: "Toutes",
    results: "{n} profils",
    resultsOne: "1 profil",
    noResults: "Aucun profil ne correspond à ces filtres.",
    decksMany: "{n} decks",
    deckOne: "1 deck",
    noDecks: "Pas encore de deck",
    profile: "Voir le profil",
    empty: "Les créateurs et auteurs d'Origins TCG apparaîtront ici : la page se remplit à mesure que le staff attribue les rôles et que leurs titulaires remplissent leur profil public.",
    inviteTitle: "Vous créez du contenu sur Origins TCG ?",
    inviteText:
      "Demandez un rôle. Creator : aucun plafond de decks publiés, et des tournois au calendrier du site avec votre propre couverture. Auteur : jusqu'à {authorDecks} decks publiés. Une fois votre profil public rempli, votre fiche apparaît sur cette page.",
    inviteMail: "Écrivez-nous",
    inviteMailSubject: "Rôle Creator ou Auteur sur OriginsMeta",
    inviteGuide: "Envoyez-nous un guide",
    listName: "Créateurs et auteurs d'Origins TCG sur OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français", pt: "Português", de: "Deutsch", ru: "Русский" },
  privacy:
    "Profil public. La bio, les chaînes et les langues que vous écrivez sous « Votre profil public » (Mon profil › Modifier ma page publique) sont publiques : elles apparaissent sur votre page /u et, si vous avez le rôle Creator, Auteur, Pro ou Staff, sur la page Créateurs et auteurs et à côté de votre nom sur vos decks. Vous pouvez les changer ou les supprimer à tout moment. Pour les personnes ayant l'un de ces rôles et une chaîne Twitch, notre serveur demande à Twitch si la chaîne est en direct sur Origins TCG (données publiques de la chaîne) au plus une fois toutes les 90 secondes, quand quelqu'un ouvre une page qui affiche le badge ; votre navigateur ne contacte pas Twitch tant que vous n'ouvrez pas le lien.",
  footer: "Créateurs et auteurs",
};

/**
 * Portoghese del Brasile (20/10/2026, docs/portoghese.md): "você", ruoli Creator / Autor / Pro / Staff (la parola
 * "função" per il ruolo), la directory è "Criadores e autores" (footer dentro H1 e title, come nelle altre lingue).
 */
const pt: CreatorLabels = {
  channels: { website: "Site", newTab: "(abre em uma nova aba)", listOf: "Canais de {name}" },
  live: { badge: "LIVE", title: "Ao vivo na Twitch agora: {viewers} espectadores" },
  liveNow: {
    strip: { title: "Ao vivo agora", one: "{name} está ao vivo", many: "{n} criadores ao vivo" },
    page: {
      kicker: "Ao vivo na Twitch",
      h1: "Criadores de Origins TCG ao vivo agora",
      metaTitle: "Criadores de Origins TCG ao vivo na Twitch",
      description:
        "Veja quais criadores, autores, jogadores Pro e staff de Origins TCG estão ao vivo na Twitch agora e assista às lives sem sair do OriginsMeta.",
      intro:
        "Quem, entre as pessoas com a função Creator, Autor, Pro ou Staff no OriginsMeta, está transmitindo Origins TCG na Twitch agora. A página se atualiza sozinha a cada minuto.",
      loading: "Verificando quem está ao vivo…",
      none: "Ninguém está transmitindo Origins TCG agora. Volte mais tarde: esta página se atualiza sozinha.",
      off: "O status das lives não está disponível no momento.",
      viewers: "Espectadores: {viewers}",
      profile: "Perfil",
      openTwitch: "Abrir na Twitch",
      watch: "Assistir aqui à live de {name}",
      playerTitle: "{name} ao vivo na Twitch",
      consent: "Ao carregar a live, você aceita os cookies da Twitch.",
      privacy: "Privacidade",
      narrow: "Em uma tela pequena, a live abre na Twitch.",
      openAria: "Abrir a live de {name} na Twitch (nova aba)",
      streamersTitle: "Os streamers do OriginsMeta",
      streamersIntro: "Criadores, autores, jogadores Pro e staff com um canal da Twitch no perfil: quando transmitem Origins TCG, aparecem aqui em cima.",
      streamersEmpty: "Ninguém adicionou um canal da Twitch ao perfil ainda.",
      twitchChannel: "Canal da Twitch",
      howTo:
        "Você transmite Origins TCG? Adicione o seu canal da Twitch na sua conta, em “Editar minha página pública”. Com a função Creator, Autor, Pro ou Staff, você aparece aqui enquanto estiver ao vivo na categoria Origins TCG, ou com “Origins TCG” no título da live.",
      allCreators: "Todos os criadores e autores",
    },
  },
  form: {
    title: "O seu perfil público",
    intro:
      "A sua bio, os seus canais e os seus idiomas aparecem na sua página pública. Se você tem a função Creator, Autor, Pro ou Staff, eles também aparecem na página Criadores e autores, e os seus três primeiros canais ao lado do seu nome nos seus decks.",
    bio: "Bio",
    bioHint: "Texto simples, até {max} caracteres e {lines} linhas. Sem links aqui: os canais vão abaixo.",
    bioLinesOver: "Mais de {lines} linhas: ao salvar, as linhas a mais são unidas à última.",
    bioPlaceholder: "Ex.: streamer brasileiro, decks de controle e preparação para a Crimson Cup toda terça à noite.",
    langs: "Idiomas do seu conteúdo",
    langsHint: "Usados pelo filtro por idioma da página Criadores e autores.",
    channels: "Os seus canais",
    channelsHint:
      "Até 8. Cole o endereço do canal, ou só o nome para Twitch, YouTube, X, TikTok, Instagram e Kick. Com a função Creator, Autor, Pro ou Staff, os três primeiros aparecem ao lado do seu nome nos seus decks.",
    kind: "Plataforma",
    url: "Endereço ou nome",
    add: "Adicionar um canal",
    remove: "Remover",
    moveUp: "Mover para cima",
    save: "Salvar o perfil",
    saving: "Salvando…",
    saved: "Perfil salvo.",
    viewPage: "Ver a sua página pública",
    shortLink: "O seu link curto",
    shortLinkHint: "Para falar na live ou colocar nos seus painéis: abre a sua página no idioma de quem o usa.",
    copy: "Copiar",
    copied: "Copiado",
    missing: "O perfil público chega em breve: ficará disponível com a próxima atualização do site.",
    readError: "Não conseguimos ler o seu perfil agora. Recarregue a página daqui a pouco.",
    errors: {
      bioLong: "A sua bio passa de {max} caracteres.",
      invalid: "Este não é o endereço de um canal do {platform}.",
      invalidWebsite: "Este não é um endereço de site válido.",
      http: "O endereço deve começar com https://.",
      shortener: "Nada de links encurtados (bit.ly, tinyurl…): cole o endereço real.",
      redirect: "Nada de links de redirecionamento: cole o endereço da própria página.",
      platform: "Este é um endereço do {platform}: escolha {platform} como plataforma.",
      long: "Este endereço é longo demais.",
      kind: "Escolha uma plataforma.",
      tooMany: "No máximo 8 canais.",
      tooFast: "Você acabou de salvar: espere alguns segundos e tente de novo.",
      notLoggedIn: "Entre para editar o seu perfil.",
      db: "Não foi possível salvar o seu perfil. Tente de novo daqui a pouco.",
      disabled: "As contas não estão disponíveis no momento.",
    },
  },
  profile: {
    langs: "Conteúdo em",
    organizedTitle: "Torneios organizados",
    directoryLink: "Todos os criadores e autores",
  },
  directory: {
    kicker: "Comunidade",
    h1: "Criadores e autores de Origins TCG",
    metaTitle: "Criadores e autores de Origins TCG",
    description:
      "Criadores, autores e streamers que fazem conteúdo de Origins TCG: os seus canais, idiomas, decks publicados no OriginsMeta e quem está ao vivo na Twitch.",
    intro:
      "Todas as pessoas com a função Creator, Autor, Pro ou Staff no OriginsMeta que preencheram o perfil público. Filtre por função, idioma e plataforma; quem está ao vivo com Origins TCG agora aparece com o selo LIVE.",
    order: "Ordem: primeiro quem faz conteúdo no idioma desta página, depois quem publicou mais decks, depois por nome.",
    lang: "Idioma",
    platform: "Plataforma",
    role: "Função",
    allRoles: "Todas",
    allLangs: "Todos",
    allPlatforms: "Todas",
    results: "{n} perfis",
    resultsOne: "1 perfil",
    noResults: "Nenhum perfil corresponde a estes filtros.",
    decksMany: "{n} decks",
    deckOne: "1 deck",
    noDecks: "Nenhum deck ainda",
    profile: "Ver o perfil",
    empty: "Os criadores e autores de Origins TCG vão aparecer aqui: a página se preenche à medida que o staff atribui as funções e quem as tem preenche o perfil público.",
    inviteTitle: "Você faz conteúdo de Origins TCG?",
    inviteText:
      "Peça uma função. Creator: sem limite de decks publicados e torneios no calendário do site com a sua própria capa. Autor: até {authorDecks} decks publicados. Com o perfil público preenchido, o seu cartão aparece nesta página.",
    inviteMail: "Escreva para nós",
    inviteMailSubject: "Função Creator ou Autor no OriginsMeta",
    inviteGuide: "Envie um guia para nós",
    listName: "Criadores e autores de Origins TCG no OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français", pt: "Português", de: "Deutsch", ru: "Русский" },
  privacy:
    "Perfil público. A bio, os canais e os idiomas que você escreve em “Perfil público” (Meu perfil › Editar minha página pública) são públicos: aparecem na sua página /u e, se você tem a função Creator, Autor, Pro ou Staff, na página Criadores e autores e ao lado do seu nome nos seus decks. Você pode alterá-los ou apagá-los quando quiser. Para quem tem uma dessas funções e um canal da Twitch, o nosso servidor pergunta à Twitch se o canal está ao vivo com Origins TCG (dados públicos do canal) no máximo uma vez a cada 90 segundos, quando alguém abre uma página que mostra o selo; o seu navegador não entra em contato com a Twitch até você abrir o link.",
  footer: "Criadores e autores",
};

/**
 * Tedesco (20/10/2026, docs/tedesco.md): "du" minuscolo, ruoli Creator / Autor / Pro / Staff ("Rolle" per il ruolo),
 * la directory è "Creator und Autoren" (footer dentro H1 e title, come nelle altre lingue).
 */
const de: CreatorLabels = {
  channels: { website: "Website", newTab: "(öffnet sich in einem neuen Tab)", listOf: "Kanäle von {name}" },
  live: { badge: "LIVE", title: "Jetzt live auf Twitch: {viewers} Zuschauer" },
  liveNow: {
    strip: { title: "Jetzt live", one: "{name} ist live", many: "{n} Creator live" },
    page: {
      kicker: "Live auf Twitch",
      h1: "Creator von Origins TCG jetzt live",
      metaTitle: "Creator von Origins TCG live auf Twitch",
      description:
        "Sieh nach, welche Creator, Autoren, Pro-Spieler und Staff von Origins TCG gerade auf Twitch streamen, und schau live zu, ohne OriginsMeta zu verlassen.",
      intro:
        "Wer von den Personen mit der Rolle Creator, Autor, Pro oder Staff auf OriginsMeta gerade Origins TCG auf Twitch streamt. Die Seite aktualisiert sich jede Minute von selbst.",
      loading: "Wir prüfen, wer live ist…",
      none: "Gerade streamt niemand Origins TCG. Schau später wieder vorbei: Diese Seite aktualisiert sich von selbst.",
      off: "Der Live-Status ist gerade nicht verfügbar.",
      viewers: "Zuschauer: {viewers}",
      profile: "Profil",
      openTwitch: "Auf Twitch öffnen",
      watch: "Den Stream von {name} hier ansehen",
      playerTitle: "{name} live auf Twitch",
      consent: "Wenn du den Stream lädst, akzeptierst du die Cookies von Twitch.",
      privacy: "Datenschutz",
      narrow: "Auf einem kleinen Bildschirm öffnet sich der Stream auf Twitch.",
      openAria: "Den Stream von {name} auf Twitch öffnen (neuer Tab)",
      streamersTitle: "Die Streamer auf OriginsMeta",
      streamersIntro: "Creator, Autoren, Pro-Spieler und Staff mit einem Twitch-Kanal im Profil: Wenn sie Origins TCG streamen, erscheinen sie hier oben.",
      streamersEmpty: "Noch niemand hat einen Twitch-Kanal zu seinem Profil hinzugefügt.",
      twitchChannel: "Twitch-Kanal",
      howTo:
        "Du streamst Origins TCG? Füge deinen Twitch-Kanal in deinem Konto hinzu, unter „Meine öffentliche Seite bearbeiten“. Mit der Rolle Creator, Autor, Pro oder Staff erscheinst du hier, während du in der Kategorie Origins TCG live bist oder „Origins TCG“ im Titel des Streams steht.",
      allCreators: "Alle Creator und Autoren",
    },
  },
  form: {
    title: "Dein öffentliches Profil",
    intro:
      "Deine Bio, deine Kanäle und deine Sprachen erscheinen auf deiner öffentlichen Seite. Mit der Rolle Creator, Autor, Pro oder Staff erscheinen sie auch auf der Seite Creator und Autoren, und deine ersten drei Kanäle neben deinem Namen bei deinen Decks.",
    bio: "Bio",
    bioHint: "Reiner Text, höchstens {max} Zeichen und {lines} Zeilen. Keine Links hier: Die Kanäle kommen darunter.",
    bioLinesOver: "Mehr als {lines} Zeilen: Beim Speichern werden die überzähligen Zeilen an die letzte angehängt.",
    bioPlaceholder: "Z. B. deutscher Streamer, Control-Decks und Vorbereitung auf die Crimson Cup jeden Dienstagabend.",
    langs: "Sprachen deiner Inhalte",
    langsHint: "Für den Sprachfilter der Seite Creator und Autoren.",
    channels: "Deine Kanäle",
    channelsHint:
      "Bis zu 8. Füge die Adresse des Kanals ein, oder bei Twitch, YouTube, X, TikTok, Instagram und Kick nur den Namen. Mit der Rolle Creator, Autor, Pro oder Staff erscheinen die ersten drei neben deinem Namen bei deinen Decks.",
    kind: "Plattform",
    url: "Adresse oder Name",
    add: "Kanal hinzufügen",
    remove: "Entfernen",
    moveUp: "Nach oben",
    save: "Profil speichern",
    saving: "Wird gespeichert…",
    saved: "Profil gespeichert.",
    viewPage: "Deine öffentliche Seite ansehen",
    shortLink: "Dein Kurzlink",
    shortLinkHint: "Zum Sagen im Stream oder für deine Panels: Er öffnet deine Seite in der Sprache der Person, die ihn nutzt.",
    copy: "Kopieren",
    copied: "Kopiert",
    missing: "Das öffentliche Profil kommt bald: Es ist mit dem nächsten Update der Website verfügbar.",
    readError: "Wir können dein Profil gerade nicht lesen. Lade die Seite gleich noch einmal.",
    errors: {
      bioLong: "Deine Bio ist länger als {max} Zeichen.",
      invalid: "Das ist keine Adresse eines {platform}-Kanals.",
      invalidWebsite: "Das ist keine gültige Website-Adresse.",
      http: "Die Adresse muss mit https:// beginnen.",
      shortener: "Keine gekürzten Links (bit.ly, tinyurl…): Füge die echte Adresse ein.",
      redirect: "Keine Weiterleitungslinks: Füge die Adresse der Seite selbst ein.",
      platform: "Das ist eine {platform}-Adresse: Wähle {platform} als Plattform.",
      long: "Diese Adresse ist zu lang.",
      kind: "Wähle eine Plattform.",
      tooMany: "Höchstens 8 Kanäle.",
      tooFast: "Du hast gerade gespeichert: Warte ein paar Sekunden und versuch es noch einmal.",
      notLoggedIn: "Melde dich an, um dein Profil zu bearbeiten.",
      db: "Wir konnten dein Profil nicht speichern. Versuch es gleich noch einmal.",
      disabled: "Konten sind gerade nicht verfügbar.",
    },
  },
  profile: {
    langs: "Inhalte auf",
    organizedTitle: "Organisierte Turniere",
    directoryLink: "Alle Creator und Autoren",
  },
  directory: {
    kicker: "Community",
    h1: "Creator und Autoren von Origins TCG",
    metaTitle: "Creator und Autoren von Origins TCG",
    description:
      "Creator, Autoren und Streamer, die Inhalte zu Origins TCG machen: ihre Kanäle, Sprachen, auf OriginsMeta veröffentlichten Decks und wer gerade live ist.",
    intro:
      "Alle Personen mit der Rolle Creator, Autor, Pro oder Staff auf OriginsMeta, die ihr öffentliches Profil ausgefüllt haben. Filtere nach Rolle, Sprache und Plattform; wer gerade mit Origins TCG live ist, trägt das LIVE-Abzeichen.",
    order: "Reihenfolge: zuerst Personen mit Inhalten in der Sprache dieser Seite, dann die mit mehr veröffentlichten Decks, dann nach Name.",
    lang: "Sprache",
    platform: "Plattform",
    role: "Rolle",
    allRoles: "Alle",
    allLangs: "Alle",
    allPlatforms: "Alle",
    results: "{n} Profile",
    resultsOne: "1 Profil",
    noResults: "Kein Profil passt zu diesen Filtern.",
    decksMany: "{n} Decks",
    deckOne: "1 Deck",
    noDecks: "Noch keine Decks",
    profile: "Profil ansehen",
    empty: "Hier erscheinen die Creator und Autoren von Origins TCG: Die Seite füllt sich, sobald das Staff die Rollen vergibt und die Personen mit einer Rolle ihr öffentliches Profil ausfüllen.",
    inviteTitle: "Du machst Inhalte zu Origins TCG?",
    inviteText:
      "Frag nach einer Rolle. Creator: keine Obergrenze für veröffentlichte Decks und Turniere im Kalender der Website mit deinem eigenen Titelbild. Autor: bis zu {authorDecks} veröffentlichte Decks. Sobald dein öffentliches Profil ausgefüllt ist, erscheint deine Karte auf dieser Seite.",
    inviteMail: "Schreib uns",
    inviteMailSubject: "Rolle Creator oder Autor auf OriginsMeta",
    inviteGuide: "Schick uns einen Guide",
    listName: "Creator und Autoren von Origins TCG auf OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français", pt: "Português", de: "Deutsch", ru: "Русский" },
  privacy:
    "Öffentliches Profil. Die Bio, die Kanäle und die Sprachen, die du unter „Dein öffentliches Profil“ (Mein Profil › Meine öffentliche Seite bearbeiten) einträgst, sind öffentlich: Sie erscheinen auf deiner /u-Seite und, wenn du die Rolle Creator, Autor, Pro oder Staff hast, auf der Seite Creator und Autoren und neben deinem Namen bei deinen Decks. Du kannst sie jederzeit ändern oder löschen. Bei Personen mit einer dieser Rollen und einem Twitch-Kanal fragt unser Server höchstens alle 90 Sekunden bei Twitch nach, ob der Kanal mit Origins TCG live ist (öffentliche Daten des Kanals), wenn jemand eine Seite öffnet, die das Abzeichen zeigt; dein Browser kontaktiert Twitch erst, wenn du den Link öffnest.",
  footer: "Creator und Autoren",
};

/**
 * Russo (20/10/2026, docs/russo.md): "вы" minuscolo, ruoli Creator / Автор / Pro / Staff ("Роль" per il ruolo),
 * la directory è "Креаторы и авторы" (footer dentro H1 e title, come nelle altre lingue).
 */
const ru: CreatorLabels = {
  channels: { website: "Сайт", newTab: "(откроется в новой вкладке)", listOf: "Каналы {name}" },
  live: { badge: "LIVE", title: "Сейчас в эфире на Twitch: зрителей — {viewers}" },
  liveNow: {
    strip: { title: "Сейчас в эфире", one: "{name} в эфире", many: "Креаторов в эфире: {n}" },
    page: {
      kicker: "В эфире на Twitch",
      h1: "Креаторы Origins TCG сейчас в эфире",
      metaTitle: "Креаторы Origins TCG в эфире на Twitch",
      description:
        "Узнайте, кто из креаторов, авторов, Pro-игроков и Staff Origins TCG сейчас стримит на Twitch, и смотрите эфир, не уходя с OriginsMeta.",
      intro:
        "Кто из участников OriginsMeta с ролью Creator, Автор, Pro или Staff прямо сейчас стримит Origins TCG на Twitch. Страница обновляется сама каждую минуту.",
      loading: "Проверяем, кто в эфире…",
      none: "Сейчас никто не стримит Origins TCG. Загляните позже: страница обновляется сама.",
      off: "Статус эфиров сейчас недоступен.",
      viewers: "Зрителей: {viewers}",
      profile: "Профиль",
      openTwitch: "Открыть на Twitch",
      watch: "Смотреть стрим {name} здесь",
      playerTitle: "{name} в эфире на Twitch",
      consent: "Загружая стрим, вы принимаете cookie-файлы Twitch.",
      privacy: "Конфиденциальность",
      narrow: "На маленьком экране стрим откроется на Twitch.",
      openAria: "Открыть стрим {name} на Twitch (новая вкладка)",
      streamersTitle: "Стримеры на OriginsMeta",
      streamersIntro: "Креаторы, авторы, Pro-игроки и Staff с каналом Twitch в профиле: когда они стримят Origins TCG, они появляются выше.",
      streamersEmpty: "Пока никто не добавил канал Twitch в свой профиль.",
      twitchChannel: "Канал Twitch",
      howTo:
        "Вы стримите Origins TCG? Добавьте свой канал Twitch в аккаунте, в разделе «Редактировать мою публичную страницу». С ролью Creator, Автор, Pro или Staff вы появитесь здесь, пока ведёте эфир в категории Origins TCG или с «Origins TCG» в названии стрима.",
      allCreators: "Все креаторы и авторы",
    },
  },
  form: {
    title: "Ваш публичный профиль",
    intro:
      "Ваше описание, каналы и языки видны на вашей публичной странице. С ролью Creator, Автор, Pro или Staff они появляются и на странице «Креаторы и авторы», а первые три канала — рядом с вашим именем на ваших колодах.",
    bio: "О себе",
    bioHint: "Простой текст, не больше {max} символов и {lines} строк. Без ссылок: каналы указываются ниже.",
    bioLinesOver: "Больше {lines} строк: при сохранении лишние строки будут присоединены к последней.",
    bioPlaceholder: "Например: стример из России, контроль-колоды и подготовка к Crimson Cup каждый вторник вечером.",
    langs: "Языки вашего контента",
    langsHint: "Для фильтра по языку на странице «Креаторы и авторы».",
    channels: "Ваши каналы",
    channelsHint:
      "До 8. Вставьте адрес канала, а для Twitch, YouTube, X, TikTok, Instagram и Kick достаточно имени. С ролью Creator, Автор, Pro или Staff первые три канала появляются рядом с вашим именем на ваших колодах.",
    kind: "Платформа",
    url: "Адрес или имя",
    add: "Добавить канал",
    remove: "Удалить",
    moveUp: "Выше",
    save: "Сохранить профиль",
    saving: "Сохраняем…",
    saved: "Профиль сохранён.",
    viewPage: "Ваша публичная страница",
    shortLink: "Ваша короткая ссылка",
    shortLinkHint: "Назовите её на стриме или добавьте в панели: она открывает вашу страницу на языке зрителя.",
    copy: "Копировать",
    copied: "Скопировано",
    missing: "Публичный профиль скоро появится: он станет доступен после следующего обновления сайта.",
    readError: "Сейчас не удаётся загрузить ваш профиль. Обновите страницу чуть позже.",
    errors: {
      bioLong: "Описание длиннее {max} символов.",
      invalid: "Это не адрес канала {platform}.",
      invalidWebsite: "Это не корректный адрес сайта.",
      http: "Адрес должен начинаться с https://.",
      shortener: "Без сокращённых ссылок (bit.ly, tinyurl…): вставьте настоящий адрес.",
      redirect: "Без ссылок-переадресаций: вставьте адрес самой страницы.",
      platform: "Это адрес {platform}: выберите платформу {platform}.",
      long: "Этот адрес слишком длинный.",
      kind: "Выберите платформу.",
      tooMany: "Не больше 8 каналов.",
      tooFast: "Вы только что сохранили: подождите несколько секунд и попробуйте ещё раз.",
      notLoggedIn: "Войдите, чтобы редактировать профиль.",
      db: "Не удалось сохранить профиль. Попробуйте ещё раз чуть позже.",
      disabled: "Аккаунты сейчас недоступны.",
    },
  },
  profile: {
    langs: "Контент на языках:",
    organizedTitle: "Организованные турниры",
    directoryLink: "Все креаторы и авторы",
  },
  directory: {
    kicker: "Сообщество",
    h1: "Креаторы и авторы Origins TCG",
    metaTitle: "Креаторы и авторы Origins TCG",
    description:
      "Креаторы, авторы и стримеры, которые делают контент по Origins TCG: их каналы, языки, колоды на OriginsMeta и кто сейчас в эфире на Twitch.",
    intro:
      "Все участники OriginsMeta с ролью Creator, Автор, Pro или Staff, заполнившие публичный профиль. Фильтруйте по роли, языку и платформе; у тех, кто сейчас в эфире с Origins TCG, стоит значок LIVE.",
    order: "Порядок: сначала те, кто делает контент на языке этой страницы, затем те, у кого больше опубликованных колод, затем по имени.",
    lang: "Язык",
    platform: "Платформа",
    role: "Роль",
    allRoles: "Все",
    allLangs: "Все",
    allPlatforms: "Все",
    results: "Профилей: {n}",
    resultsOne: "1 профиль",
    noResults: "Под эти фильтры не подходит ни один профиль.",
    decksMany: "Колод: {n}",
    deckOne: "1 колода",
    noDecks: "Колод пока нет",
    profile: "Смотреть профиль",
    empty: "Здесь появятся креаторы и авторы Origins TCG: страница заполняется по мере того, как Staff назначает роли, а их обладатели заполняют публичный профиль.",
    inviteTitle: "Вы делаете контент по Origins TCG?",
    inviteText:
      "Попросите роль. Creator: без ограничения на опубликованные колоды и турниры в календаре сайта со своей обложкой. Автор: до {authorDecks} опубликованных колод. Как только публичный профиль заполнен, ваша карточка появится на этой странице.",
    inviteMail: "Написать нам",
    inviteMailSubject: "Роль Creator или Автор на OriginsMeta",
    inviteGuide: "Прислать нам гайд",
    listName: "Креаторы и авторы Origins TCG на OriginsMeta",
  },
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français", pt: "Português", de: "Deutsch", ru: "Русский" },
  privacy:
    "Публичный профиль. Описание, каналы и языки, которые вы указываете в разделе «Ваш публичный профиль» (Мой профиль › Редактировать мою публичную страницу), публичны: они видны на вашей странице /u и, если у вас роль Creator, Автор, Pro или Staff, на странице «Креаторы и авторы» и рядом с вашим именем на ваших колодах. Вы можете изменить или удалить их в любой момент. Для участников с одной из этих ролей и каналом Twitch наш сервер не чаще раза в 90 секунд спрашивает у Twitch, идёт ли на канале эфир по Origins TCG (публичные данные канала), когда кто-то открывает страницу со значком; ваш браузер не обращается к Twitch, пока вы не откроете ссылку.",
  footer: "Креаторы и авторы",
};

export const creatorLabels: Record<Locale, CreatorLabels> = { en, it, es, fr, pt, de, ru };

/** Sostituisce i segnaposto {chiave} di un'etichetta. */
export function fillCreator(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.hasOwn(values, key) ? String(values[key]) : match));
}
