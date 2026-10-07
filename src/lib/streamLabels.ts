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
 * è la parola che usano OBS e gli streamer. La riga del comando di chat (`chat.line`) comincia sempre con il testo
 * fisso, mai con il nome dell'autore: una riga che comincia con un testo scritto da un utente è più facile da abusare.
 */
const en = {
  /** risposte in testo semplice del comando !deck (Nightbot, StreamElements, Fossabot): mai oltre una riga */
  chat: {
    line: "Deck by {author}: {deck}",
    legendary: "Legendary",
    code: "Game code",
    /** mazzo torneo (?set=, 04/10/2026): tre mazzi, niente codici del gioco */
    setLine: "Tournament deck by {author}: {set}",
    noDecks: "{user} has no public decks on OriginsMeta yet.",
    noUser: "There is no OriginsMeta user called {user}.",
    noDeck: "Deck not found on OriginsMeta: check the command's URL.",
    noSet: "Tournament deck not found on OriginsMeta: check the command's URL.",
    usage: "Add ?u=<OriginsMeta username>, ?deck=<deck> or ?set=<tournament deck> to the command's URL.",
    unavailable: "OriginsMeta is not reachable right now: try again in a minute.",
  },
  /** pagina trasparente per OBS */
  overlay: {
    title: "Deck overlay",
    legendary: "Legendary",
    by: "by",
    cards: "Cards (×2)",
    noDeck: "Deck not found: check the browser source URL.",
    noDecks: "{user} has no public decks yet: publish one on OriginsMeta and it shows up here within a minute.",
    noUser: "There is no OriginsMeta user called {user}.",
    usage: "Add ?u=<OriginsMeta username> to the URL, or use /overlay/deck/<deck>.",
    unavailable: "OriginsMeta is not reachable right now: the overlay tries again every minute.",
    unofficial: "Unofficial fan site, not affiliated with Koin Games",
    /** overlay di un mazzo torneo (/overlay/deck-set/<slug>, 04/10/2026) */
    set: "Tournament deck",
    deck: "Deck {letter}",
    noSet: "Tournament deck not found: check the browser source URL.",
  },
  /** immagine PNG del mazzo (next/og) */
  image: {
    kicker: "Origins TCG · Community deck",
    by: "by",
    legendary: "Legendary",
    cards: "Cards · 2 copies each",
    unofficial: "Unofficial fan site, not affiliated with Koin Games",
    alt: "Deck list of {deck} by {author}, with the Legendary {legendary}: the twelve cards and their mana cost.",
    altNoLegendary: "Deck list of {deck} by {author}: the cards and their mana cost.",
    /** immagine di un mazzo torneo (/api/deck-set-image, 04/10/2026) */
    setKicker: "Origins TCG · Tournament deck · Conquest",
    deck: "Deck {letter}",
    setAlt: "Tournament deck {set} by {author}: the lists of its three Conquest decks, with the Legendaries {legendaries} and the mana cost of every card.",
  },
  /** menu "Per le dirette" nella scheda del mazzo */
  tools: {
    summary: "For streamers: short link, chat command, OBS overlay, image",
    intro: "For streams and videos. Nothing to install: copy, paste and the deck is on screen.",
    shortLink: "Short link",
    shortLinkHint: "Say it on stream or put it in the video description: it opens this deck in the viewer's language.",
    chat: "Chat command for this deck",
    chatHint:
      "Type it in your Twitch chat as the channel owner or a moderator: from then on !deck answers with this deck, its short link and the game code. If !deck already exists, write edit instead of add (!commands edit for Nightbot, !command edit for StreamElements).",
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
    ownerOnly:
      "The chat command and the OBS overlay show text written by whoever published the deck, so they are offered on your own decks only. Your account has the ones that always follow your latest deck.",
    accountLink: "Stream tools in your account",
    copy: "Copy",
    copied: "Copied",
    /** menu di un mazzo torneo (04/10/2026) */
    setShortLinkHint: "Say it on stream or put it in the video description: it opens this tournament deck in the viewer's language.",
    setChat: "Chat command for this tournament deck",
    setChatHint:
      "Type it in your Twitch chat as the channel owner or a moderator: from then on !deck answers with this tournament deck, its three Legendaries and the short link (the game codes are on the page, one per deck). If !deck already exists, write edit instead of add (!commands edit for Nightbot, !command edit for StreamElements).",
    setImage: "Tournament deck image",
    setImageHint: "PNG ready for thumbnails, posts and stories: the three decks with their Legendary, their twelve cards with the cost and the short link.",
  },
  /** istruzioni nel pannello privato /account */
  account: {
    title: "Stream tools",
    intro: "A chat command and an OBS overlay that always show the deck you published most recently: publish a new one and they switch to it within a minute. Nothing to install.",
    noDecks: "They start working with your first published deck.",
    command: "Chat command !deck",
    commandHint:
      "Type your bot's line in your Twitch chat, as the channel owner or a moderator. The answer: deck name, Legendary, short link and game code. If !deck already exists, write edit instead of add (!commands edit, !command edit).",
    fossabot: "Fossabot (response of a command created in the dashboard)",
    langName: "English",
    langHint: "The answer is in {lang}: for another language change lang={code} at the end of the link (en, it, es, fr).",
    overlay: "OBS overlay with your latest deck",
  },
};

export type StreamLabels = typeof en;

const it: StreamLabels = {
  chat: {
    line: "Mazzo di {author}: {deck}",
    legendary: "Leggendaria",
    code: "Codice del gioco",
    setLine: "Mazzo torneo di {author}: {set}",
    noDecks: "{user} non ha ancora mazzi pubblici su OriginsMeta.",
    noUser: "Su OriginsMeta non c'è nessun utente {user}.",
    noDeck: "Mazzo non trovato su OriginsMeta: controlla il link del comando.",
    noSet: "Mazzo torneo non trovato su OriginsMeta: controlla il link del comando.",
    usage: "Aggiungi al link del comando ?u=<nome utente di OriginsMeta>, ?deck=<mazzo> oppure ?set=<mazzo torneo>.",
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
    unofficial: "Sito di fan non ufficiale, non affiliato a Koin Games",
    set: "Mazzo torneo",
    deck: "Mazzo {letter}",
    noSet: "Mazzo torneo non trovato: controlla il link della fonte browser.",
  },
  image: {
    kicker: "Origins TCG · Mazzo della community",
    by: "di",
    legendary: "Leggendaria",
    cards: "Carte · 2 copie ciascuna",
    unofficial: "Sito di fan non ufficiale, non affiliato a Koin Games",
    alt: "Lista del mazzo {deck} di {author}, con la Leggendaria {legendary}: le dodici carte con il costo in mana.",
    altNoLegendary: "Lista del mazzo {deck} di {author}: le carte con il costo in mana.",
    setKicker: "Origins TCG · Mazzo torneo · Conquest",
    deck: "Mazzo {letter}",
    setAlt: "Mazzo torneo {set} di {author}: le liste dei suoi tre mazzi Conquest, con le Leggendarie {legendaries} e il costo in mana di ogni carta.",
  },
  tools: {
    summary: "Per le dirette: link breve, comando di chat, overlay per OBS, immagine",
    intro: "Per chi fa dirette e video. Niente da installare: copi, incolli e il mazzo è in scena.",
    shortLink: "Link breve",
    shortLinkHint: "Da dire in diretta o da mettere nella descrizione del video: apre questo mazzo nella lingua di chi guarda.",
    chat: "Comando di chat per questo mazzo",
    chatHint:
      "Scrivilo nella chat di Twitch da proprietario del canale o da moderatore: da lì in poi !deck risponde con questo mazzo, il link breve e il codice del gioco. Se !deck esiste già, al posto di add scrivi edit (!commands edit per Nightbot, !command edit per StreamElements).",
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
    ownerOnly:
      "Il comando di chat e l'overlay per OBS mostrano i testi scritti da chi ha pubblicato il mazzo, per questo compaiono solo sui tuoi mazzi. Nel tuo account trovi quelli che seguono sempre il tuo ultimo mazzo.",
    accountLink: "Strumenti per le dirette nel tuo account",
    copy: "Copia",
    copied: "Copiato",
    setShortLinkHint: "Da dire in diretta o da mettere nella descrizione del video: apre questo mazzo torneo nella lingua di chi guarda.",
    setChat: "Comando di chat per questo mazzo torneo",
    setChatHint:
      "Scrivilo nella chat di Twitch da proprietario del canale o da moderatore: da lì in poi !deck risponde con questo mazzo torneo, le sue tre Leggendarie e il link breve (i codici del gioco sono nella scheda, uno per mazzo). Se !deck esiste già, al posto di add scrivi edit (!commands edit per Nightbot, !command edit per StreamElements).",
    setImage: "Immagine del mazzo torneo",
    setImageHint: "PNG pronto per miniature, post e storie: i tre mazzi con la loro Leggendaria, le dodici carte di ognuno con il costo e il link breve.",
  },
  account: {
    title: "Strumenti per le dirette",
    intro: "Un comando di chat e un overlay per OBS che mostrano sempre l'ultimo mazzo che hai pubblicato: ne pubblichi uno nuovo e passano a quello entro un minuto. Niente da installare.",
    noDecks: "Funzionano dal tuo primo mazzo pubblicato.",
    command: "Comando di chat !deck",
    commandHint:
      "Scrivi la riga del tuo bot nella chat di Twitch, da proprietario del canale o da moderatore. La risposta: nome del mazzo, Leggendaria, link breve e codice del gioco. Se !deck esiste già, al posto di add scrivi edit (!commands edit, !command edit).",
    fossabot: "Fossabot (risposta di un comando creato dalla dashboard)",
    langName: "italiano",
    langHint: "La risposta è in {lang}: per un'altra lingua cambia lang={code} in fondo al link (en, it, es, fr).",
    overlay: "Overlay per OBS con il tuo ultimo mazzo",
  },
};

const es: StreamLabels = {
  chat: {
    line: "Mazo de {author}: {deck}",
    legendary: "Legendaria",
    code: "Código del juego",
    setLine: "Mazo de torneo de {author}: {set}",
    noDecks: "{user} todavía no tiene mazos públicos en OriginsMeta.",
    noUser: "En OriginsMeta no hay ningún usuario {user}.",
    noDeck: "No se encontró el mazo en OriginsMeta: revisa el enlace del comando.",
    noSet: "No se encontró el mazo de torneo en OriginsMeta: revisa el enlace del comando.",
    usage: "Añade al enlace del comando ?u=<nombre de usuario de OriginsMeta>, ?deck=<mazo> o ?set=<mazo de torneo>.",
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
    unofficial: "Sitio de fans no oficial, sin afiliación con Koin Games",
    set: "Mazo de torneo",
    deck: "Mazo {letter}",
    noSet: "No se encontró el mazo de torneo: revisa el enlace de la fuente de navegador.",
  },
  image: {
    kicker: "Origins TCG · Mazo de la comunidad",
    by: "de",
    legendary: "Legendaria",
    cards: "Cartas · 2 copias de cada una",
    unofficial: "Sitio de fans no oficial, sin afiliación con Koin Games",
    alt: "Lista del mazo {deck} de {author}, con la Legendaria {legendary}: las doce cartas con su coste de maná.",
    altNoLegendary: "Lista del mazo {deck} de {author}: las cartas con su coste de maná.",
    setKicker: "Origins TCG · Mazo de torneo · Conquest",
    deck: "Mazo {letter}",
    setAlt: "Mazo de torneo {set} de {author}: las listas de sus tres mazos de Conquest, con las Legendarias {legendaries} y el coste de maná de cada carta.",
  },
  tools: {
    summary: "Para directos: enlace corto, comando de chat, overlay para OBS, imagen",
    intro: "Para quienes hacen directos y videos. Nada que instalar: copias, pegas y el mazo sale en pantalla.",
    shortLink: "Enlace corto",
    shortLinkHint: "Para decirlo en directo o ponerlo en la descripción del video: abre este mazo en el idioma de quien lo mira.",
    chat: "Comando de chat para este mazo",
    chatHint:
      "Escríbelo en el chat de Twitch como dueño del canal o moderador: a partir de ahí, !deck responde con este mazo, el enlace corto y el código del juego. Si !deck ya existe, en lugar de add escribe edit (!commands edit para Nightbot, !command edit para StreamElements).",
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
    ownerOnly:
      "El comando de chat y el overlay para OBS muestran los textos que escribe quien publicó el mazo, por eso solo aparecen en tus mazos. En tu cuenta tienes los que siguen siempre tu último mazo.",
    accountLink: "Herramientas para directos en tu cuenta",
    copy: "Copiar",
    copied: "Copiado",
    setShortLinkHint: "Para decirlo en directo o ponerlo en la descripción del video: abre este mazo de torneo en el idioma de quien lo mira.",
    setChat: "Comando de chat para este mazo de torneo",
    setChatHint:
      "Escríbelo en el chat de Twitch como dueño del canal o moderador: a partir de ahí, !deck responde con este mazo de torneo, sus tres Legendarias y el enlace corto (los códigos del juego están en la página, uno por mazo). Si !deck ya existe, en lugar de add escribe edit (!commands edit para Nightbot, !command edit para StreamElements).",
    setImage: "Imagen del mazo de torneo",
    setImageHint: "PNG listo para miniaturas, publicaciones e historias: los tres mazos con su Legendaria, las doce cartas de cada uno con su coste y el enlace corto.",
  },
  account: {
    title: "Herramientas para directos",
    intro: "Un comando de chat y un overlay para OBS que muestran siempre el último mazo que publicaste: publicas uno nuevo y pasan a ese en menos de un minuto. Nada que instalar.",
    noDecks: "Funcionan a partir de tu primer mazo publicado.",
    command: "Comando de chat !deck",
    commandHint:
      "Escribe la línea de tu bot en el chat de Twitch, como dueño del canal o moderador. La respuesta: nombre del mazo, Legendaria, enlace corto y código del juego. Si !deck ya existe, en lugar de add escribe edit (!commands edit, !command edit).",
    fossabot: "Fossabot (respuesta de un comando creado en el panel)",
    langName: "español",
    langHint: "La respuesta está en {lang}: para otro idioma cambia lang={code} al final del enlace (en, it, es, fr).",
    overlay: "Overlay para OBS con tu último mazo",
  },
};

// Francese dal 07/10/2026 (docs/francese.md): vous, "deck de tournoi" per il mazzo torneo, "overlay OBS", "outils de
// streaming"; i nomi dei bot e delle piattaforme restano; la riga della chat comincia col testo fisso come le altre.
const fr: StreamLabels = {
  chat: {
    line: "Deck de {author} : {deck}",
    legendary: "Légendaire",
    code: "Code du jeu",
    setLine: "Deck de tournoi de {author} : {set}",
    noDecks: "{user} n'a pas encore de deck public sur OriginsMeta.",
    noUser: "Il n'y a aucun utilisateur {user} sur OriginsMeta.",
    noDeck: "Deck introuvable sur OriginsMeta : vérifiez l'URL de la commande.",
    noSet: "Deck de tournoi introuvable sur OriginsMeta : vérifiez l'URL de la commande.",
    usage: "Ajoutez ?u=<nom d'utilisateur OriginsMeta>, ?deck=<deck> ou ?set=<deck de tournoi> à l'URL de la commande.",
    unavailable: "OriginsMeta ne répond pas pour le moment : réessayez dans une minute.",
  },
  overlay: {
    title: "Overlay du deck",
    legendary: "Légendaire",
    by: "par",
    cards: "Cartes (×2)",
    noDeck: "Deck introuvable : vérifiez l'URL de la source navigateur.",
    noDecks: "{user} n'a pas encore de deck public : publiez-en un sur OriginsMeta et il apparaîtra ici en moins d'une minute.",
    noUser: "Il n'y a aucun utilisateur {user} sur OriginsMeta.",
    usage: "Ajoutez ?u=<nom d'utilisateur OriginsMeta> à l'URL, ou utilisez /overlay/deck/<deck>.",
    unavailable: "OriginsMeta ne répond pas pour le moment : l'overlay réessaie chaque minute.",
    unofficial: "Site de fans non officiel, non affilié à Koin Games",
    set: "Deck de tournoi",
    deck: "Deck {letter}",
    noSet: "Deck de tournoi introuvable : vérifiez l'URL de la source navigateur.",
  },
  image: {
    kicker: "Origins TCG · Deck de la communauté",
    by: "par",
    legendary: "Légendaire",
    cards: "Cartes · 2 exemplaires chacune",
    unofficial: "Site de fans non officiel, non affilié à Koin Games",
    alt: "Liste du deck {deck} de {author}, avec la Légendaire {legendary} : les douze cartes et leur coût en mana.",
    altNoLegendary: "Liste du deck {deck} de {author} : les cartes et leur coût en mana.",
    setKicker: "Origins TCG · Deck de tournoi · Conquest",
    deck: "Deck {letter}",
    setAlt: "Deck de tournoi {set} de {author} : les listes de ses trois decks Conquest, avec les Légendaires {legendaries} et le coût en mana de chaque carte.",
  },
  tools: {
    summary: "Pour les streamers : lien court, commande de chat, overlay OBS, image",
    intro: "Pour les streams et les vidéos. Rien à installer : copiez, collez, et le deck est à l'écran.",
    shortLink: "Lien court",
    shortLinkHint: "À dire en stream ou à mettre dans la description de la vidéo : il ouvre ce deck dans la langue du spectateur.",
    chat: "Commande de chat pour ce deck",
    chatHint:
      "Tapez-la dans votre chat Twitch en tant que propriétaire de la chaîne ou modérateur : dès lors, !deck répond avec ce deck, son lien court et le code du jeu. Si !deck existe déjà, écrivez edit à la place de add (!commands edit pour Nightbot, !command edit pour StreamElements).",
    nightbot: "Nightbot",
    streamelements: "StreamElements",
    overlay: "Overlay OBS",
    overlayHint: "Dans OBS : Sources → + → Navigateur, collez le lien et réglez {vw} × {vh} pour le vertical, {hw} × {hh} pour l'horizontal. Fond transparent, mis à jour chaque minute.",
    vertical: "Vertical",
    horizontal: "Horizontal",
    open: "Aperçu",
    image: "Image du deck",
    imageHint: "PNG prêt pour les miniatures, les posts et les stories : la Légendaire, les douze cartes avec leur coût et le lien court.",
    download16x9: "Télécharger en 16:9 (1280 × 720)",
    download9x16: "Télécharger en 9:16 (1080 × 1920)",
    ownerOnly:
      "La commande de chat et l'overlay OBS affichent des textes écrits par la personne qui a publié le deck : ils ne sont donc proposés que sur vos propres decks. Votre compte a ceux qui suivent toujours votre dernier deck.",
    accountLink: "Outils de streaming dans votre compte",
    copy: "Copier",
    copied: "Copié",
    setShortLinkHint: "À dire en stream ou à mettre dans la description de la vidéo : il ouvre ce deck de tournoi dans la langue du spectateur.",
    setChat: "Commande de chat pour ce deck de tournoi",
    setChatHint:
      "Tapez-la dans votre chat Twitch en tant que propriétaire de la chaîne ou modérateur : dès lors, !deck répond avec ce deck de tournoi, ses trois Légendaires et le lien court (les codes du jeu sont sur la page, un par deck). Si !deck existe déjà, écrivez edit à la place de add (!commands edit pour Nightbot, !command edit pour StreamElements).",
    setImage: "Image du deck de tournoi",
    setImageHint: "PNG prêt pour les miniatures, les posts et les stories : les trois decks avec leur Légendaire, leurs douze cartes avec le coût et le lien court.",
  },
  account: {
    title: "Outils de streaming",
    intro: "Une commande de chat et un overlay OBS qui affichent toujours le dernier deck que vous avez publié : publiez-en un nouveau et ils passent dessus en moins d'une minute. Rien à installer.",
    noDecks: "Ils fonctionnent dès votre premier deck publié.",
    command: "Commande de chat !deck",
    commandHint:
      "Tapez la ligne de votre bot dans votre chat Twitch, en tant que propriétaire de la chaîne ou modérateur. La réponse : nom du deck, Légendaire, lien court et code du jeu. Si !deck existe déjà, écrivez edit à la place de add (!commands edit, !command edit).",
    fossabot: "Fossabot (réponse d'une commande créée dans le tableau de bord)",
    langName: "français",
    langHint: "La réponse est en {lang} : pour une autre langue, changez lang={code} à la fin du lien (en, it, es, fr).",
    overlay: "Overlay OBS avec votre dernier deck",
  },
};

export const streamLabels: Record<Locale, StreamLabels> = { en, it, es, fr };
