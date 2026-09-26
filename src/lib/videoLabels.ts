import type { Locale } from "./i18n";

/**
 * Testi del pacchetto VIDEO (26/09/2026): il lettore "a clic" (`VideoEmbed`), i blocchi Video e Risorse della scheda
 * di un mazzo (`DeckMedia`), i campi del modulo di pubblicazione (`DeckMediaFields`) e il paragrafo della privacy.
 * Stanno qui e non nei dizionari, come `entityLabels.ts`: un modulo solo, nelle tre lingue insieme; `en` è il tipo di
 * riferimento. Il file non importa nulla a runtime, quindi lo usano sia i componenti server sia quelli client.
 * Segnaposto fra graffe: {title}, {provider}, {kind}, {time}, {n}, {host}, {sites}.
 */
const en = {
  player: {
    /** nome accessibile del tasto di riproduzione */
    play: "Play the video: {title} ({provider})",
    providers: { youtube: "YouTube", twitch: "Twitch" },
    kinds: { video: "video", short: "Short", vod: "VOD", clip: "clip" },
    from: "from {time}",
    /** riga sotto l'anteprima, prima del clic */
    consent: "Loading the video means accepting {provider}'s cookies.",
    privacy: "Privacy",
    openOn: "Open on {provider}",
    /** Twitch non riproduce un embed più stretto di 400 px: sul telefono il video si apre su Twitch */
    narrow: "On small screens Twitch videos open on Twitch.",
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
    videosHint: "Up to 3: YouTube (videos, Shorts, streams) or Twitch (VODs and clips). On the deck page a video loads only when the reader presses play.",
    videoUrl: "Video {n}",
    videoPlaceholder: "https://www.youtube.com/watch?v=… · https://www.twitch.tv/videos/…",
    start: "Start at",
    startPlaceholder: "12:30",
    startHint: "Optional: 12 = minute 12, 12:30 = 12 minutes and 30 seconds. A time in the link (t=…) works too.",
    recognized: "Recognised: {provider} {kind}",
    recognizedFrom: "from {time}",
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
    linkHost: "This site is not on the list.",
    linkInvalid: "Not a valid address (https://…).",
    addLink: "+ Add a link",
    remove: "Remove",
    /** nome accessibile del tasto "Remove" di una riga */
    removeRow: "Remove row {n}",
  },
  /** errori della Server Action (codici di `readDeckMedia`), mostrati sopra il tasto di pubblicazione */
  errors: {
    video: "One of the videos is not a YouTube video or a Twitch VOD or clip.",
    videoStart: "Write the start time of the video as 12, 12:30 or 1:02:03.",
    link: "One of the resources has no valid address (https://…).",
    linkHost: "One of the resources points to a site that is not on the list.",
  },
  /** paragrafo della pagina privacy, ancora #video (link "Privacy" sotto ogni lettore) */
  privacy:
    "YouTube and Twitch videos: on deck pages and in guides, a video loads only when you press its play button. Until then the page sends no request to YouTube or Twitch: the preview is an OriginsMeta image. By pressing play you choose to load that service's player, which from then on receives your IP address and may set cookies or use your browser's storage under its own rules: YouTube (Google Ireland Ltd), in the privacy-enhanced mode of youtube-nocookie.com, or Twitch (Twitch Interactive, Inc., United States), which has no cookie-free mode. It applies only to the video you start and only on that page: reload it and the preview is back. On small screens a Twitch video opens on Twitch instead. The links in a deck's Resources box are chosen by its author and lead to outside sites with their own privacy rules.",
};

export type VideoLabels = typeof en;

export const videoLabels: Record<Locale, VideoLabels> = {
  en,
  it: {
    player: {
      play: "Riproduci il video: {title} ({provider})",
      providers: { youtube: "YouTube", twitch: "Twitch" },
      kinds: { video: "video", short: "Short", vod: "VOD", clip: "clip" },
      from: "dal minuto {time}",
      consent: "Caricando il video accetti i cookie di {provider}.",
      privacy: "Privacy",
      openOn: "Apri su {provider}",
      narrow: "Sugli schermi piccoli i video di Twitch si aprono su Twitch.",
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
      videosHint: "Fino a 3: YouTube (video, Shorts, dirette) o Twitch (VOD e clip). Nella pagina del mazzo il video si carica solo quando chi legge preme play.",
      videoUrl: "Video {n}",
      videoPlaceholder: "https://www.youtube.com/watch?v=… · https://www.twitch.tv/videos/…",
      start: "Minuto di partenza",
      startPlaceholder: "12:30",
      startHint: "Facoltativo: 12 = minuto 12, 12:30 = 12 minuti e 30 secondi. Va bene anche il minuto nel link (t=…).",
      recognized: "Riconosciuto: {kind} {provider}",
      recognizedFrom: "dal minuto {time}",
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
      linkHost: "Questo sito non è nell'elenco.",
      linkInvalid: "Indirizzo non valido (https://…).",
      addLink: "+ Aggiungi un link",
      remove: "Togli",
      removeRow: "Togli la riga {n}",
    },
    errors: {
      video: "Uno dei video non è un video YouTube né un VOD o una clip di Twitch.",
      videoStart: "Scrivi il minuto di partenza del video come 12, 12:30 o 1:02:03.",
      link: "Una delle risorse non ha un indirizzo valido (https://…).",
      linkHost: "Una delle risorse porta a un sito che non è nell'elenco.",
    },
    privacy:
      "Video di YouTube e Twitch: nelle schede dei mazzi e nelle guide un video si carica solo quando premi il suo tasto di riproduzione. Fino ad allora la pagina non manda nessuna richiesta a YouTube né a Twitch: l'anteprima è un'immagine di OriginsMeta. Premendo play scegli di caricare il lettore del servizio, che da quel momento riceve il tuo indirizzo IP e può impostare cookie o usare la memoria del browser secondo le sue regole: YouTube (Google Ireland Ltd), nella modalità a privacy avanzata di youtube-nocookie.com, oppure Twitch (Twitch Interactive, Inc., Stati Uniti), che non ha una modalità senza cookie. Vale solo per il video che avvii e solo in quella pagina: ricaricandola torna l'anteprima. Sugli schermi piccoli un video di Twitch si apre invece su Twitch. I link nel riquadro “Risorse” di un mazzo li sceglie il suo autore e portano a siti esterni con le loro regole sulla privacy.",
  },
  es: {
    player: {
      play: "Reproducir el video: {title} ({provider})",
      providers: { youtube: "YouTube", twitch: "Twitch" },
      kinds: { video: "video", short: "Short", vod: "VOD", clip: "clip" },
      from: "desde el minuto {time}",
      consent: "Al cargar el video aceptas las cookies de {provider}.",
      privacy: "Privacidad",
      openOn: "Abrir en {provider}",
      narrow: "En pantallas pequeñas, los videos de Twitch se abren en Twitch.",
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
      videosHint: "Hasta 3: YouTube (videos, Shorts, directos) o Twitch (VOD y clips). En la página del mazo el video se carga solo cuando quien lee pulsa play.",
      videoUrl: "Video {n}",
      videoPlaceholder: "https://www.youtube.com/watch?v=… · https://www.twitch.tv/videos/…",
      start: "Minuto de inicio",
      startPlaceholder: "12:30",
      startHint: "Opcional: 12 = minuto 12, 12:30 = 12 minutos y 30 segundos. También vale el minuto del enlace (t=…).",
      recognized: "Reconocido: {kind} de {provider}",
      recognizedFrom: "desde el minuto {time}",
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
      linkHost: "Este sitio no está en la lista.",
      linkInvalid: "Dirección no válida (https://…).",
      addLink: "+ Añadir un enlace",
      remove: "Quitar",
      removeRow: "Quitar la fila {n}",
    },
    errors: {
      video: "Uno de los videos no es un video de YouTube ni un VOD o clip de Twitch.",
      videoStart: "Escribe el minuto de inicio del video como 12, 12:30 o 1:02:03.",
      link: "Uno de los recursos no tiene una dirección válida (https://…).",
      linkHost: "Uno de los recursos lleva a un sitio que no está en la lista.",
    },
    privacy:
      "Videos de YouTube y Twitch: en las páginas de los mazos y en las guías, un video se carga solo cuando pulsas su botón de reproducción. Hasta entonces la página no envía ninguna petición a YouTube ni a Twitch: la vista previa es una imagen de OriginsMeta. Al pulsar play eliges cargar el reproductor del servicio, que desde ese momento recibe tu dirección IP y puede instalar cookies o usar el almacenamiento del navegador según sus propias reglas: YouTube (Google Ireland Ltd), en el modo de privacidad mejorada de youtube-nocookie.com, o Twitch (Twitch Interactive, Inc., Estados Unidos), que no tiene un modo sin cookies. Vale solo para el video que inicias y solo en esa página: si la recargas, vuelve la vista previa. En pantallas pequeñas, un video de Twitch se abre directamente en Twitch. Los enlaces del recuadro “Recursos” de un mazo los elige su autor y llevan a sitios externos con sus propias reglas de privacidad.",
  },
};

/** Sostituisce i segnaposto {chiave} di un testo; i valori non passano da `replace` (niente `$&` interpretati). */
export function fillVideoLabel(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
