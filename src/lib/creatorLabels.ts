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
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français" },
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
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français" },
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
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français" },
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
  langNames: { en: "English", it: "Italiano", es: "Español", fr: "Français" },
  privacy:
    "Profil public. La bio, les chaînes et les langues que vous écrivez sous « Votre profil public » (Mon profil › Modifier ma page publique) sont publiques : elles apparaissent sur votre page /u et, si vous avez le rôle Creator, Auteur, Pro ou Staff, sur la page Créateurs et auteurs et à côté de votre nom sur vos decks. Vous pouvez les changer ou les supprimer à tout moment. Pour les personnes ayant l'un de ces rôles et une chaîne Twitch, notre serveur demande à Twitch si la chaîne est en direct sur Origins TCG (données publiques de la chaîne) au plus une fois toutes les 90 secondes, quand quelqu'un ouvre une page qui affiche le badge ; votre navigateur ne contacte pas Twitch tant que vous n'ouvrez pas le lien.",
  footer: "Créateurs et auteurs",
};

export const creatorLabels: Record<Locale, CreatorLabels> = { en, it, es, fr };

/** Sostituisce i segnaposto {chiave} di un'etichetta. */
export function fillCreator(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.hasOwn(values, key) ? String(values[key]) : match));
}
