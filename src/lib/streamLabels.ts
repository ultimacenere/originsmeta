import type { Locale } from "./i18n";

/**
 * Testi degli strumenti per le dirette (pacchetto STREAM, 26/09/2026; regole in `stream.ts`): risposte del comando
 * di chat, overlay per OBS, immagine del mazzo, menu "Per le dirette" della scheda del mazzo e istruzioni in /account.
 * Stanno qui e non nei dizionari (come `communityPageLabels`): l'inglese è il tipo di riferimento, italiano e spagnolo
 * devono avere le stesse chiavi e gli stessi segnaposto (lo controlla `stream.test.ts`). Il file importa solo un tipo,
 * quindi lo leggono anche i test di Node e i componenti client senza trascinare i dizionari.
 *
 * Nomi delle carte e dei mazzi restano come sono; parole del gioco col glossario ufficiale (Leggendaria, Legendaria,
 * mazo, código del juego); spagnolo neutro col tú (docs/spagnolo.md). "Overlay" resta in inglese nelle tre lingue:
 * è la parola che usano OBS e gli streamer.
 */
const en = {
  /** risposte in testo semplice del comando !deck (Nightbot, StreamElements, Fossabot): mai oltre una riga */
  chat: {
    line: "{author}'s deck: {deck}",
    legendary: "Legendary",
    code: "Game code",
    noDecks: "{user} has no public decks on OriginsMeta yet.",
    noUser: "There is no OriginsMeta user called {user}.",
    noDeck: "Deck not found on OriginsMeta: check the link of the command.",
    usage: "Add ?u=<OriginsMeta username> or ?deck=<deck> to the link of the command.",
    unavailable: "OriginsMeta is not reachable right now: try again in a minute.",
  },
  /** pagina trasparente per OBS */
  overlay: {
    title: "Deck overlay",
    legendary: "Legendary",
    by: "by",
    cards: "Cards (×2)",
    noDeck: "Deck not found: check the link of the browser source.",
    noDecks: "{user} has no public decks yet: publish one on OriginsMeta and it shows up here within a minute.",
    noUser: "There is no OriginsMeta user called {user}.",
    usage: "Add ?u=<OriginsMeta username> to the link, or use /overlay/deck/<deck>.",
    unavailable: "OriginsMeta is not reachable right now: the overlay tries again every minute.",
  },
  /** immagine PNG del mazzo (next/og) */
  image: {
    kicker: "Origins TCG · Community deck",
    by: "by",
    legendary: "Legendary",
    cards: "Cards · 2 copies each",
    unofficial: "Unofficial fan site, not affiliated with Koin Games",
    alt: "Deck list of {deck}, {legendary} deck by {author}: the twelve cards with their mana cost.",
    altNoLegendary: "Deck list of {deck} by {author}: the cards with their mana cost.",
  },
  /** menu "Per le dirette" nella scheda del mazzo */
  tools: {
    summary: "For streamers: short link, chat command, OBS overlay, image",
    intro: "For streams and videos. Nothing to install: copy, paste and the deck is on screen.",
    shortLink: "Short link",
    shortLinkHint: "Say it on stream or put it in the video description: it opens this deck in the viewer's language.",
    chat: "Chat command for this deck",
    chatHint: "Type it in your Twitch chat as the channel owner or a moderator: from then on !deck answers with this deck, its short link and the game code.",
    nightbot: "Nightbot",
    streamelements: "StreamElements",
    overlay: "OBS overlay",
    overlayHint: "In OBS: Sources → + → Browser, paste the link and set {vw} × {vh} for the vertical one, {hw} × {hh} for the horizontal one. Transparent background, updated every minute.",
    vertical: "Vertical",
    horizontal: "Horizontal",
    open: "Preview",
    image: "Deck image",
    imageHint: "PNG ready for thumbnails, posts and stories: the Legendary, the twelve cards with their cost and the short link.",
    download16x9: "Download 16:9 (1280 × 720)",
    download9x16: "Download 9:16 (1080 × 1920)",
    copy: "Copy",
    copied: "Copied",
  },
  /** istruzioni nel pannello privato /account */
  account: {
    title: "Stream tools",
    intro: "A chat command and an OBS overlay that always show your latest published deck: publish or update a deck and they follow within a minute. Nothing to install.",
    noDecks: "They start working with your first published deck.",
    command: "Chat command !deck",
    commandHint: "Type the line of your bot in your Twitch chat, as the channel owner or a moderator. The answer: deck name, Legendary, short link and game code.",
    fossabot: "Fossabot (response of a command created in the dashboard)",
    langName: "English",
    langHint: "The answer is in {lang}: for another language change lang={code} at the end of the link (en, it, es).",
    overlay: "OBS overlay with your latest deck",
  },
};

export type StreamLabels = typeof en;

const it: StreamLabels = {
  chat: {
    line: "Mazzo di {author}: {deck}",
    legendary: "Leggendaria",
    code: "Codice del gioco",
    noDecks: "{user} non ha ancora mazzi pubblici su OriginsMeta.",
    noUser: "Su OriginsMeta non c'è nessun utente {user}.",
    noDeck: "Mazzo non trovato su OriginsMeta: controlla il link del comando.",
    usage: "Aggiungi al link del comando ?u=<nome utente di OriginsMeta> oppure ?deck=<mazzo>.",
    unavailable: "OriginsMeta non risponde in questo momento: riprova fra un minuto.",
  },
  overlay: {
    title: "Overlay del mazzo",
    legendary: "Leggendaria",
    by: "di",
    cards: "Carte (×2)",
    noDeck: "Mazzo non trovato: controlla il link della fonte browser.",
    noDecks: "{user} non ha ancora mazzi pubblici: pubblicane uno su OriginsMeta e comparirà qui entro un minuto.",
    noUser: "Su OriginsMeta non c'è nessun utente {user}.",
    usage: "Aggiungi al link ?u=<nome utente di OriginsMeta>, oppure usa /overlay/deck/<mazzo>.",
    unavailable: "OriginsMeta non risponde in questo momento: l'overlay riprova ogni minuto.",
  },
  image: {
    kicker: "Origins TCG · Mazzo della community",
    by: "di",
    legendary: "Leggendaria",
    cards: "Carte · 2 copie ciascuna",
    unofficial: "Sito di fan non ufficiale, non affiliato a Koin Games",
    alt: "Lista del mazzo {deck}, mazzo di {legendary} di {author}: le dodici carte con il costo in mana.",
    altNoLegendary: "Lista del mazzo {deck} di {author}: le carte con il costo in mana.",
  },
  tools: {
    summary: "Per le dirette: link breve, comando di chat, overlay per OBS, immagine",
    intro: "Per chi fa dirette e video. Niente da installare: copi, incolli e il mazzo è in scena.",
    shortLink: "Link breve",
    shortLinkHint: "Da dire in diretta o da mettere nella descrizione del video: apre questo mazzo nella lingua di chi guarda.",
    chat: "Comando di chat per questo mazzo",
    chatHint: "Scrivilo nella chat di Twitch da proprietario del canale o da moderatore: da lì in poi !deck risponde con questo mazzo, il link breve e il codice del gioco.",
    nightbot: "Nightbot",
    streamelements: "StreamElements",
    overlay: "Overlay per OBS",
    overlayHint: "In OBS: Fonti → + → Browser, incolla il link e imposta {vw} × {vh} per quello verticale, {hw} × {hh} per quello orizzontale. Sfondo trasparente, si aggiorna ogni minuto.",
    vertical: "Verticale",
    horizontal: "Orizzontale",
    open: "Anteprima",
    image: "Immagine del mazzo",
    imageHint: "PNG pronto per miniature, post e storie: la Leggendaria, le dodici carte con il costo e il link breve.",
    download16x9: "Scarica 16:9 (1280 × 720)",
    download9x16: "Scarica 9:16 (1080 × 1920)",
    copy: "Copia",
    copied: "Copiato",
  },
  account: {
    title: "Strumenti per le dirette",
    intro: "Un comando di chat e un overlay per OBS che mostrano sempre il tuo ultimo mazzo pubblicato: pubblichi o aggiorni un mazzo e loro lo seguono entro un minuto. Niente da installare.",
    noDecks: "Funzionano dal tuo primo mazzo pubblicato.",
    command: "Comando di chat !deck",
    commandHint: "Scrivi la riga del tuo bot nella chat di Twitch, da proprietario del canale o da moderatore. La risposta: nome del mazzo, Leggendaria, link breve e codice del gioco.",
    fossabot: "Fossabot (risposta di un comando creato dalla dashboard)",
    langName: "italiano",
    langHint: "La risposta è in {lang}: per un'altra lingua cambia lang={code} in fondo al link (en, it, es).",
    overlay: "Overlay per OBS con il tuo ultimo mazzo",
  },
};

const es: StreamLabels = {
  chat: {
    line: "Mazo de {author}: {deck}",
    legendary: "Legendaria",
    code: "Código del juego",
    noDecks: "{user} todavía no tiene mazos públicos en OriginsMeta.",
    noUser: "En OriginsMeta no hay ningún usuario {user}.",
    noDeck: "No se encontró el mazo en OriginsMeta: revisa el enlace del comando.",
    usage: "Añade al enlace del comando ?u=<nombre de usuario de OriginsMeta> o ?deck=<mazo>.",
    unavailable: "OriginsMeta no responde en este momento: vuelve a intentarlo en un minuto.",
  },
  overlay: {
    title: "Overlay del mazo",
    legendary: "Legendaria",
    by: "de",
    cards: "Cartas (×2)",
    noDeck: "No se encontró el mazo: revisa el enlace de la fuente de navegador.",
    noDecks: "{user} todavía no tiene mazos públicos: publica uno en OriginsMeta y aparecerá aquí en menos de un minuto.",
    noUser: "En OriginsMeta no hay ningún usuario {user}.",
    usage: "Añade al enlace ?u=<nombre de usuario de OriginsMeta>, o usa /overlay/deck/<mazo>.",
    unavailable: "OriginsMeta no responde en este momento: el overlay vuelve a intentarlo cada minuto.",
  },
  image: {
    kicker: "Origins TCG · Mazo de la comunidad",
    by: "de",
    legendary: "Legendaria",
    cards: "Cartas · 2 copias de cada una",
    unofficial: "Sitio de fans no oficial, sin afiliación con Koin Games",
    alt: "Lista del mazo {deck}, mazo de {legendary} de {author}: las doce cartas con su coste de maná.",
    altNoLegendary: "Lista del mazo {deck} de {author}: las cartas con su coste de maná.",
  },
  tools: {
    summary: "Para directos: enlace corto, comando de chat, overlay para OBS, imagen",
    intro: "Para quienes hacen directos y videos. Nada que instalar: copias, pegas y el mazo sale en pantalla.",
    shortLink: "Enlace corto",
    shortLinkHint: "Para decirlo en directo o ponerlo en la descripción del video: abre este mazo en el idioma de quien lo mira.",
    chat: "Comando de chat para este mazo",
    chatHint: "Escríbelo en el chat de Twitch como dueño del canal o moderador: a partir de ahí, !deck responde con este mazo, el enlace corto y el código del juego.",
    nightbot: "Nightbot",
    streamelements: "StreamElements",
    overlay: "Overlay para OBS",
    overlayHint: "En OBS: Fuentes → + → Navegador, pega el enlace y pon {vw} × {vh} para el vertical, {hw} × {hh} para el horizontal. Fondo transparente, se actualiza cada minuto.",
    vertical: "Vertical",
    horizontal: "Horizontal",
    open: "Vista previa",
    image: "Imagen del mazo",
    imageHint: "PNG listo para miniaturas, publicaciones e historias: la Legendaria, las doce cartas con su coste y el enlace corto.",
    download16x9: "Descargar 16:9 (1280 × 720)",
    download9x16: "Descargar 9:16 (1080 × 1920)",
    copy: "Copiar",
    copied: "Copiado",
  },
  account: {
    title: "Herramientas para directos",
    intro: "Un comando de chat y un overlay para OBS que muestran siempre tu último mazo publicado: publicas o actualizas un mazo y lo siguen en menos de un minuto. Nada que instalar.",
    noDecks: "Funcionan a partir de tu primer mazo publicado.",
    command: "Comando de chat !deck",
    commandHint: "Escribe la línea de tu bot en el chat de Twitch, como dueño del canal o moderador. La respuesta: nombre del mazo, Legendaria, enlace corto y código del juego.",
    fossabot: "Fossabot (respuesta de un comando creado en el panel)",
    langName: "español",
    langHint: "La respuesta está en {lang}: para otro idioma cambia lang={code} al final del enlace (en, it, es).",
    overlay: "Overlay para OBS con tu último mazo",
  },
};

export const streamLabels: Record<Locale, StreamLabels> = { en, it, es };
