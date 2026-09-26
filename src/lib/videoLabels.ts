import type { Locale } from "./i18n";

/**
 * Testi del pacchetto VIDEO (26/09/2026): il lettore "a clic" (`VideoEmbed`), i blocchi Video e Risorse della scheda
 * di un mazzo (`DeckMedia`), i campi del modulo di pubblicazione (`DeckMediaFields`) e il paragrafo della privacy
 * (`videoPrivacyText`, a parte: lo legge solo la pagina /privacy). Stanno qui e non nei dizionari, come
 * `entityLabels.ts`: un modulo solo, nelle tre lingue insieme; `en` è il tipo di riferimento. I componenti client non
 * importano questo file: ricevono dal server solo le etichette della loro lingua (`videoFormLabels`, `.player`).
 * Segnaposto fra graffe: {title}, {provider}, {kind}, {time}, {n}, {host}, {sites}; li riempie `fillVideoLabel` di
 * src/lib/videos.ts. Nessun import a runtime: il test in videos.test.ts lo carica con `node --test`.
 */
const en = {
  player: {
    /** nome accessibile del tasto di riproduzione */
    play: "Play the video: {title} ({provider})",
    /** nome accessibile del tasto quando il riquadro è troppo piccolo per Twitch e il clic apre Twitch */
    openTwitch: "Open on Twitch (new tab): {title}",
    providers: { youtube: "YouTube", twitch: "Twitch" },
    kinds: { video: "video", short: "Short", vod: "VOD", clip: "clip" },
    from: "from {time}",
    /** riga sotto l'anteprima, prima del clic */
    consent: "Loading the video means accepting {provider}'s cookies.",
    privacy: "Privacy",
    openOn: "Open on {provider}",
    /** Twitch non riproduce un embed più piccolo di 400×300: in un riquadro più piccolo il video si apre su Twitch */
    narrow: "This Twitch video opens on Twitch: the player needs more room.",
    videoN: "Video {n}",
  },
  deck: {
    videoOne: "Video",
    videoMany: "Videos",
    resources: "Resources",
    resourcesNote: "Links chosen by the deck's author. They lead outside OriginsMeta.",
  },
  form: {
    videosTitle: "Videos",
    videosHint:
      "Up to 3: YouTube (videos, Shorts, streams) or Twitch (VODs, highlights and clips). On the deck page a video loads only when the reader presses play.",
    videoUrl: "Video {n}",
    videoPlaceholder: "https://www.youtube.com/watch?v=… · https://www.twitch.tv/videos/…",
    start: "Start at",
    startPlaceholder: "12:30",
    startHint: "Optional: 12 = minute 12, 12:30 = 12 minutes and 30 seconds. A time in the link (t=…) works too.",
    videoTitle: "Title (optional)",
    videoTitlePlaceholder: "Deck tech, match against Swarm…",
    recognized: "Recognized: {provider} {kind}",
    recognizedFrom: "from {time}",
    /** sotto un link twitch.tv/videos/…: le trasmissioni passate scadono, gli highlight no */
    vodExpires: "If it's a past broadcast, it expires on Twitch after 7–60 days: for a lasting video use a Highlight or YouTube.",
    notRecognized: "Not a video we can embed: paste a YouTube video or a Twitch VOD or clip. Channels and other links go in Resources.",
    startInvalid: "Write the start time as 12, 12:30 or 1:02:03.",
    clipNoStart: "Twitch clips always play from the beginning.",
    addVideo: "+ Add a video",
    linksTitle: "Resources",
    linksHint: "Up to 5 links, https only, from these sites: {sites}. They appear in a Resources box under the guide, never inside its text.",
    linkLabel: "Link text",
    linkLabelPlaceholder: "Full VOD, my Discord…",
    linkUrl: "Address",
    linkOk: "Allowed site: {host}",
    linkHost: "This site (or this kind of redirect link) is not on the list.",
    linkInvalid: "Not a valid address (https://…).",
    addLink: "+ Add a link",
    remove: "Remove",
    /** nome accessibile del tasto "Remove" di una riga */
    removeRow: "Remove row {n}",
  },
  /** errori della Server Action (codici di `readDeckMedia`), mostrati sopra il tasto di pubblicazione; {n} = riga */
  errors: {
    video: "Video {n}: paste the link of a YouTube video or of a Twitch VOD or clip.",
    videoStart: "Video {n}: write the start time as 12, 12:30 or 1:02:03.",
    link: "Resource {n}: the address is missing or not valid (https://…).",
    linkHost: "Resource {n}: this site is not on the list of allowed sites.",
    /** colonne del database non ancora create (migrazione da applicare): si salva solo un video semplice */
    mediaUnavailable:
      "Extra videos, start times, titles and resources are not active yet: keep a single video without start time or title and remove the links, or try again later.",
  },
};

export type VideoLabels = typeof en;

export const videoLabels: Record<Locale, VideoLabels> = {
  en,
  it: {
    player: {
      play: "Riproduci il video: {title} ({provider})",
      openTwitch: "Apri su Twitch (nuova scheda): {title}",
      providers: { youtube: "YouTube", twitch: "Twitch" },
      kinds: { video: "video", short: "Short", vod: "VOD", clip: "clip" },
      from: "dal minuto {time}",
      consent: "Caricando il video accetti i cookie di {provider}.",
      privacy: "Privacy",
      openOn: "Apri su {provider}",
      narrow: "Questo video di Twitch si apre su Twitch: il lettore ha bisogno di più spazio.",
      videoN: "Video {n}",
    },
    deck: {
      videoOne: "Video",
      videoMany: "Video",
      resources: "Risorse",
      resourcesNote: "Link scelti dall'autore del mazzo. Portano fuori da OriginsMeta.",
    },
    form: {
      videosTitle: "Video",
      videosHint:
        "Fino a 3: YouTube (video, Shorts, dirette) o Twitch (VOD, momenti salienti e clip). Nella pagina del mazzo il video si carica solo quando chi legge preme play.",
      videoUrl: "Video {n}",
      videoPlaceholder: "https://www.youtube.com/watch?v=… · https://www.twitch.tv/videos/…",
      start: "Minuto di partenza",
      startPlaceholder: "12:30",
      startHint: "Facoltativo: 12 = minuto 12, 12:30 = 12 minuti e 30 secondi. Va bene anche il minuto nel link (t=…).",
      videoTitle: "Titolo (facoltativo)",
      videoTitlePlaceholder: "Deck tech, partita contro Swarm…",
      recognized: "Video riconosciuto ({provider}, {kind})",
      recognizedFrom: "dal minuto {time}",
      vodExpires: "Se è una trasmissione passata, su Twitch scade dopo 7–60 giorni: per un video che resta usa un momento saliente (Highlight) o YouTube.",
      notRecognized: "Non è un video che possiamo incorporare: incolla un video YouTube o un VOD o una clip di Twitch. Canali e altri link vanno nelle Risorse.",
      startInvalid: "Scrivi il minuto come 12, 12:30 o 1:02:03.",
      clipNoStart: "Le clip di Twitch partono sempre dall'inizio.",
      addVideo: "+ Aggiungi un video",
      linksTitle: "Risorse",
      linksHint: "Fino a 5 link, solo https, da questi siti: {sites}. Compaiono in un riquadro Risorse sotto la guida, mai dentro il testo.",
      linkLabel: "Testo del link",
      linkLabelPlaceholder: "VOD completo, il mio Discord…",
      linkUrl: "Indirizzo",
      linkOk: "Sito ammesso: {host}",
      linkHost: "Questo sito (o questo tipo di link che rimanda altrove) non è nell'elenco.",
      linkInvalid: "Indirizzo non valido (https://…).",
      addLink: "+ Aggiungi un link",
      remove: "Togli",
      removeRow: "Togli la riga {n}",
    },
    errors: {
      video: "Video {n}: incolla il link di un video YouTube o di un VOD o una clip di Twitch.",
      videoStart: "Video {n}: scrivi il minuto di partenza come 12, 12:30 o 1:02:03.",
      link: "Risorsa {n}: l'indirizzo manca o non è valido (https://…).",
      linkHost: "Risorsa {n}: questo sito non è nell'elenco dei siti ammessi.",
      mediaUnavailable:
        "Video in più, minuti di partenza, titoli e risorse non sono ancora attivi: lascia un solo video senza minuto né titolo e togli i link, oppure riprova più tardi.",
    },
  },
  es: {
    player: {
      play: "Reproducir el video: {title} ({provider})",
      openTwitch: "Abrir en Twitch (pestaña nueva): {title}",
      providers: { youtube: "YouTube", twitch: "Twitch" },
      kinds: { video: "video", short: "Short", vod: "VOD", clip: "clip" },
      from: "desde el minuto {time}",
      consent: "Al cargar el video aceptas las cookies de {provider}.",
      privacy: "Privacidad",
      openOn: "Abrir en {provider}",
      narrow: "Este video de Twitch se abre en Twitch: el reproductor necesita más espacio.",
      videoN: "Video {n}",
    },
    deck: {
      videoOne: "Video",
      videoMany: "Videos",
      resources: "Recursos",
      resourcesNote: "Enlaces elegidos por el autor del mazo. Llevan fuera de OriginsMeta.",
    },
    form: {
      videosTitle: "Videos",
      videosHint:
        "Hasta 3: YouTube (videos, Shorts, directos) o Twitch (VOD, destacados y clips). En la página del mazo el video se carga solo cuando quien lee pulsa play.",
      videoUrl: "Video {n}",
      videoPlaceholder: "https://www.youtube.com/watch?v=… · https://www.twitch.tv/videos/…",
      start: "Minuto de inicio",
      startPlaceholder: "12:30",
      startHint: "Opcional: 12 = minuto 12, 12:30 = 12 minutos y 30 segundos. También vale el minuto del enlace (t=…).",
      videoTitle: "Título (opcional)",
      videoTitlePlaceholder: "Deck tech, partida contra Swarm…",
      recognized: "Reconocido: {kind} de {provider}",
      recognizedFrom: "desde el minuto {time}",
      vodExpires: "Si es una emisión anterior, en Twitch caduca a los 7–60 días: para un video que se quede, usa un destacado (Highlight) o YouTube.",
      notRecognized: "No es un video que podamos insertar: pega un video de YouTube o un VOD o clip de Twitch. Los canales y otros enlaces van en Recursos.",
      startInvalid: "Escribe el minuto como 12, 12:30 o 1:02:03.",
      clipNoStart: "Los clips de Twitch siempre empiezan desde el principio.",
      addVideo: "+ Añadir un video",
      linksTitle: "Recursos",
      linksHint: "Hasta 5 enlaces, solo https, de estos sitios: {sites}. Aparecen en un recuadro Recursos debajo de la guía, nunca dentro del texto.",
      linkLabel: "Texto del enlace",
      linkLabelPlaceholder: "VOD completo, mi Discord…",
      linkUrl: "Dirección",
      linkOk: "Sitio permitido: {host}",
      linkHost: "Este sitio (o este tipo de enlace que redirige a otro) no está en la lista.",
      linkInvalid: "Dirección no válida (https://…).",
      addLink: "+ Añadir un enlace",
      remove: "Quitar",
      removeRow: "Quitar la fila {n}",
    },
    errors: {
      video: "Video {n}: pega el enlace de un video de YouTube o de un VOD o clip de Twitch.",
      videoStart: "Video {n}: escribe el minuto de inicio como 12, 12:30 o 1:02:03.",
      link: "Recurso {n}: falta la dirección o no es válida (https://…).",
      linkHost: "Recurso {n}: este sitio no está en la lista de sitios permitidos.",
      mediaUnavailable:
        "Los videos adicionales, los minutos de inicio, los títulos y los recursos todavía no están activos: deja un solo video sin minuto ni título y quita los enlaces, o vuelve a intentarlo más tarde.",
    },
  },
};

/** Le etichette che servono al modulo di pubblicazione (client): passate dal server, nella sola lingua della pagina. */
export type VideoFormLabels = {
  form: VideoLabels["form"];
  errors: VideoLabels["errors"];
  providers: VideoLabels["player"]["providers"];
  kinds: VideoLabels["player"]["kinds"];
};

export function videoFormLabels(locale: Locale): VideoFormLabels {
  const L = videoLabels[locale];
  return { form: L.form, errors: L.errors, providers: L.player.providers, kinds: L.player.kinds };
}

/**
 * Paragrafo della pagina privacy, ancora #video (link "Privacy" sotto ogni lettore). L'anteprima prima del clic è
 * un'immagine servita da OriginsMeta: la miniatura salvata nel sito (guide), la miniatura di YouTube passata
 * dall'ottimizzatore di immagini del sito, oppure un riquadro con il nome della piattaforma (Twitch).
 */
export const videoPrivacyText: Record<Locale, string> = {
  en: "YouTube and Twitch videos: on deck pages and in guides, a video loads only when you press its play button. Until then the page sends no request to YouTube or Twitch: the preview is an image served by OriginsMeta (for a YouTube video, its thumbnail, which our server fetches from YouTube without sending anything about you). By pressing play you choose to load that service's player, which from then on receives your IP address and may set cookies or use your browser's storage under its own rules: YouTube (Google Ireland Ltd), in the privacy-enhanced mode of youtube-nocookie.com, or Twitch (Twitch Interactive, Inc., United States), which has no cookie-free mode. It applies only to the video you start and only on that page: reload it and the preview is back. When the player would be too small, a Twitch video opens on Twitch instead. The links in a deck's Resources box are chosen by its author and lead to outside sites with their own privacy rules.",
  it: "Video di YouTube e Twitch: nelle schede dei mazzi e nelle guide un video si carica solo quando premi il suo tasto di riproduzione. Fino ad allora la pagina non manda nessuna richiesta a YouTube né a Twitch: l'anteprima è un'immagine servita da OriginsMeta (per un video di YouTube la sua miniatura, che il nostro server scarica da YouTube senza inviare nulla che ti riguardi). Premendo play scegli di caricare il lettore del servizio, che da quel momento riceve il tuo indirizzo IP e può impostare cookie o usare la memoria del browser secondo le sue regole: YouTube (Google Ireland Ltd), nella modalità a privacy avanzata di youtube-nocookie.com, oppure Twitch (Twitch Interactive, Inc., Stati Uniti), che non ha una modalità senza cookie. Vale solo per il video che avvii e solo in quella pagina: ricaricandola torna l'anteprima. Quando il lettore sarebbe troppo piccolo, un video di Twitch si apre invece su Twitch. I link nel riquadro “Risorse” di un mazzo li sceglie il suo autore e portano a siti esterni con le loro regole sulla privacy.",
  es: "Videos de YouTube y Twitch: en las páginas de los mazos y en las guías, un video se carga solo cuando pulsas su botón de reproducción. Hasta entonces la página no envía ninguna petición a YouTube ni a Twitch: la vista previa es una imagen servida por OriginsMeta (para un video de YouTube, su miniatura, que nuestro servidor descarga de YouTube sin enviar nada sobre ti). Al pulsar play eliges cargar el reproductor del servicio, que desde ese momento recibe tu dirección IP y puede instalar cookies o usar el almacenamiento del navegador según sus propias reglas: YouTube (Google Ireland Ltd), en el modo de privacidad mejorada de youtube-nocookie.com, o Twitch (Twitch Interactive, Inc., Estados Unidos), que no tiene un modo sin cookies. Vale solo para el video que inicias y solo en esa página: si la recargas, vuelve la vista previa. Cuando el reproductor quedaría demasiado pequeño, un video de Twitch se abre directamente en Twitch. Los enlaces del recuadro “Recursos” de un mazo los elige su autor y llevan a sitios externos con sus propias reglas de privacidad.",
};
