/*
 * OriginsMeta Deck tracker, estensione Twitch: parti comuni a overlay, versione mobile e configurazione.
 *
 * - lingua dello spettatore (parametro "language" che Twitch passa all'iframe; en/it/es/fr, ripiego en) e testi;
 * - controlli sui dati che arrivano dalla rete (carte e stato dal vivo): niente entra nel DOM senza essere passato da
 *   qui, e il DOM si costruisce solo con createElement/textContent (funzione el), mai con innerHTML;
 * - chiamate a https://originsmeta.com (l'unico dominio nelle allowlist della console).
 *
 * La forma dello stato è quella di src/lib/tracker/live.ts del sito (LiveState, versione 1): parseState ne ripete i
 * controlli, così un messaggio diverso viene ignorato invece di rompere la pagina.
 */
(function () {
  "use strict";

  var BASE = "https://originsmeta.com";
  var KEY_RE = /^C\d{5}_[A-Z]{2}$/;
  var SLUG_RE = /^[a-z0-9-]{1,80}$/;
  var IMAGE_RE = /^\/cards\/[a-z0-9-]{1,80}\.webp$/;
  var CHANNEL_RE = /^\d{1,20}$/;
  var LANGS = ["en", "it", "es", "fr"];
  var LIMITS = { deckCards: 13, seen: 30, name: 40, copies: 3 };

  var TEXTS = {
    en: {
      tab: "Deck",
      tabAria: "Open the streamer's deck",
      deckTitle: "Streamer's deck",
      close: "Close",
      closeCard: "Close the card",
      round: "Round {n}",
      deckLeft: "{n} cards in the deck",
      deckLeftOne: "1 card in the deck",
      opponent: "Opponent",
      oppDeckLeft: "{n} in the deck",
      noSeen: "No cards revealed yet",
      hint: "Hover or tap a card to read it",
      legendary: "Legendary",
      unit: "Unit",
      spell: "Spell",
      token: "Created card",
      cost: "Cost",
      power: "Power",
      health: "Health",
      unknown: "Unknown card",
      rowLeft: "{left} of {copies} left in the deck",
      rowPlayed: "{n} played",
      seenCopies: "seen {n} times",
      seenOnce: "seen once",
      legendLeft: "in the deck",
      legendDrawn: "drawn",
      legendPlayed: "played",
      cardPage: "Card page on originsmeta.com",
      leaving: "opens originsmeta.com outside Twitch",
      footer: "OriginsMeta · not affiliated with Koin Games",
      waiting: "The streamer's deck shows up here when OriginsMeta Tracker is on.",
      // configurazione
      cfgTitle: "OriginsMeta Deck tracker",
      cfgIntro: "Your viewers open your deck on top of the stream and read the cards live.",
      cfgStep1: "Link OriginsMeta Tracker to your account on originsmeta.com.",
      cfgStep2a: "On ",
      cfgStep2b: ", in the “Twitch extension” box, create a code.",
      cfgStep3: "Type the code here and press “Link”.",
      cfgLabel: "Code from originsmeta.com",
      cfgButton: "Link",
      cfgBusy: "Linking…",
      cfgDone: "Channel linked to {user}",
      cfgDoneNoUser: "Channel linked",
      cfgFormat: "The code has 8 letters and numbers, like ABCD-EFGH.",
      cfgNotReady: "Twitch hasn't authorized the extension yet: wait a moment and try again.",
      cfgErr_invalid_code: "Wrong or expired code: create a new one on originsmeta.com.",
      cfgErr_forbidden: "Only the streamer of this channel can link it.",
      cfgErr_unavailable: "The service isn't available right now. Please try again later.",
      cfgErr_error: "Something went wrong. Please try again.",
      cfgNote: "The extension shows only what the Deck tracker already shows on stream: your deck with the copies left, the round, the opponent's Legendary and the cards they reveal. Never names, ranks or match identifiers.",
      appHide: "Hide the panels",
      appShow: "Show the panels",
      cfgModeTitle: "How your viewers see the deck",
      cfgModeApp: "Like the app",
      cfgModeAppHint: "The same panels as OriginsMeta Tracker, in the same places and with the style you chose in the app. Hide the app's panels from your OBS scene, so viewers don't see them twice.",
      cfgModeTab: "Tab",
      cfgModeTabHint: "A small “Deck” tab on the left of the video that viewers open when they want.",
      cfgModeSaved: "Saved: viewers will see it in a few seconds.",
      cfgModeError: "Couldn't save the choice. Please try again."
    },
    it: {
      tab: "Mazzo",
      tabAria: "Apri il mazzo dello streamer",
      deckTitle: "Mazzo dello streamer",
      close: "Chiudi",
      closeCard: "Chiudi la carta",
      round: "Turno {n}",
      deckLeft: "{n} carte nel mazzo",
      deckLeftOne: "1 carta nel mazzo",
      opponent: "Avversario",
      oppDeckLeft: "{n} nel mazzo",
      noSeen: "Nessuna carta rivelata",
      hint: "Passa sopra o tocca una carta per leggerla",
      legendary: "Leggendaria",
      unit: "Unità",
      spell: "Magia",
      token: "Carta generata",
      cost: "Costo",
      power: "Potenza",
      health: "Salute",
      unknown: "Carta sconosciuta",
      rowLeft: "{left} di {copies} ancora nel mazzo",
      rowPlayed: "{n} giocate",
      seenCopies: "vista {n} volte",
      seenOnce: "vista una volta",
      legendLeft: "nel mazzo",
      legendDrawn: "pescata",
      legendPlayed: "giocata",
      cardPage: "Scheda su originsmeta.com",
      leaving: "apre originsmeta.com fuori da Twitch",
      footer: "OriginsMeta · non affiliato a Koin Games",
      waiting: "Il mazzo dello streamer compare qui quando OriginsMeta Tracker è acceso.",
      cfgTitle: "OriginsMeta Deck tracker",
      cfgIntro: "I tuoi spettatori aprono il tuo mazzo sopra la diretta e leggono le carte dal vivo.",
      cfgStep1: "Collega OriginsMeta Tracker al tuo account su originsmeta.com.",
      cfgStep2a: "Su ",
      cfgStep2b: ", nel riquadro “Estensione Twitch”, crea il codice.",
      cfgStep3: "Scrivi qui il codice e premi “Collega”.",
      cfgLabel: "Codice di originsmeta.com",
      cfgButton: "Collega",
      cfgBusy: "Collegamento…",
      cfgDone: "Canale collegato a {user}",
      cfgDoneNoUser: "Canale collegato",
      cfgFormat: "Il codice ha 8 lettere e numeri, come ABCD-EFGH.",
      cfgNotReady: "Twitch non ha ancora autorizzato l'estensione: aspetta un momento e riprova.",
      cfgErr_invalid_code: "Codice sbagliato o scaduto: creane uno nuovo su originsmeta.com.",
      cfgErr_forbidden: "Solo lo streamer di questo canale può collegarlo.",
      cfgErr_unavailable: "Il servizio non è disponibile in questo momento. Riprova più tardi.",
      cfgErr_error: "Qualcosa non ha funzionato. Riprova.",
      cfgNote: "L'estensione mostra solo quello che il Deck tracker mostra già in diretta: il tuo mazzo con le copie rimaste, il turno, la Leggendaria dell'avversario e le carte che rivela. Mai nomi, rank o identificativi delle partite.",
      appHide: "Nascondi i pannelli",
      appShow: "Mostra i pannelli",
      cfgModeTitle: "Come vedono il mazzo i tuoi spettatori",
      cfgModeApp: "Come l'app",
      cfgModeAppHint: "Gli stessi pannelli di OriginsMeta Tracker, negli stessi punti e con lo stile che hai scelto nell'app. Togli i pannelli dell'app dalla scena di OBS, così chi guarda non li vede due volte.",
      cfgModeTab: "Linguetta",
      cfgModeTabHint: "Una piccola linguetta “Mazzo” a sinistra del video, che chi guarda apre quando vuole.",
      cfgModeSaved: "Salvato: gli spettatori lo vedono fra pochi secondi.",
      cfgModeError: "Non è stato possibile salvare la scelta. Riprova."
    },
    es: {
      tab: "Mazo",
      tabAria: "Abrir el mazo del streamer",
      deckTitle: "Mazo del streamer",
      close: "Cerrar",
      closeCard: "Cerrar la carta",
      round: "Ronda {n}",
      deckLeft: "{n} cartas en el mazo",
      deckLeftOne: "1 carta en el mazo",
      opponent: "Rival",
      oppDeckLeft: "{n} en el mazo",
      noSeen: "Aún no ha revelado cartas",
      hint: "Pasa el ratón o toca una carta para leerla",
      legendary: "Legendaria",
      unit: "Unidad",
      spell: "Hechizo",
      token: "Carta creada",
      cost: "Coste",
      power: "Poder",
      health: "Salud",
      unknown: "Carta desconocida",
      rowLeft: "{left} de {copies} aún en el mazo",
      rowPlayed: "{n} jugadas",
      seenCopies: "vista {n} veces",
      seenOnce: "vista una vez",
      legendLeft: "en el mazo",
      legendDrawn: "robada",
      legendPlayed: "jugada",
      cardPage: "Ficha en originsmeta.com",
      leaving: "abre originsmeta.com fuera de Twitch",
      footer: "OriginsMeta · no afiliado a Koin Games",
      waiting: "El mazo del streamer aparece aquí cuando OriginsMeta Tracker está encendido.",
      cfgTitle: "OriginsMeta Deck tracker",
      cfgIntro: "Tus espectadores abren tu mazo sobre el directo y leen las cartas en vivo.",
      cfgStep1: "Vincula OriginsMeta Tracker a tu cuenta en originsmeta.com.",
      cfgStep2a: "En ",
      cfgStep2b: ", en el recuadro “Extensión de Twitch”, crea el código.",
      cfgStep3: "Escribe aquí el código y pulsa “Vincular”.",
      cfgLabel: "Código de originsmeta.com",
      cfgButton: "Vincular",
      cfgBusy: "Vinculando…",
      cfgDone: "Canal vinculado a {user}",
      cfgDoneNoUser: "Canal vinculado",
      cfgFormat: "El código tiene 8 letras y números, como ABCD-EFGH.",
      cfgNotReady: "Twitch aún no ha autorizado la extensión: espera un momento y vuelve a intentarlo.",
      cfgErr_invalid_code: "Código incorrecto o caducado: crea uno nuevo en originsmeta.com.",
      cfgErr_forbidden: "Solo el streamer de este canal puede vincularlo.",
      cfgErr_unavailable: "El servicio no está disponible en este momento. Vuelve a intentarlo más tarde.",
      cfgErr_error: "Algo ha fallado. Vuelve a intentarlo.",
      cfgNote: "La extensión muestra solo lo que el Deck tracker ya muestra en directo: tu mazo con las copias que quedan, la ronda, la Legendaria del rival y las cartas que revela. Nunca nombres, rangos ni identificadores de partidas.",
      appHide: "Ocultar los paneles",
      appShow: "Mostrar los paneles",
      cfgModeTitle: "Cómo ve el mazo tu público",
      cfgModeApp: "Como la app",
      cfgModeAppHint: "Los mismos paneles de OriginsMeta Tracker, en los mismos sitios y con el estilo que elegiste en la app. Quita los paneles de la app de tu escena de OBS para que tu público no los vea dos veces.",
      cfgModeTab: "Pestaña",
      cfgModeTabHint: "Una pequeña pestaña “Mazo” a la izquierda del vídeo, que tu público abre cuando quiere.",
      cfgModeSaved: "Guardado: tu público lo verá en unos segundos.",
      cfgModeError: "No se ha podido guardar la elección. Vuelve a intentarlo."
    },
    fr: {
      tab: "Deck",
      tabAria: "Ouvrir le deck du streamer",
      deckTitle: "Deck du streamer",
      close: "Fermer",
      closeCard: "Fermer la carte",
      round: "Tour {n}",
      deckLeft: "{n} cartes dans le deck",
      deckLeftOne: "1 carte dans le deck",
      opponent: "Adversaire",
      oppDeckLeft: "{n} dans le deck",
      noSeen: "Aucune carte révélée",
      hint: "Survolez ou touchez une carte pour la lire",
      legendary: "Légendaire",
      unit: "Unité",
      spell: "Sort",
      token: "Carte créée",
      cost: "Coût",
      power: "Puissance",
      health: "Santé",
      unknown: "Carte inconnue",
      rowLeft: "{left} sur {copies} encore dans le deck",
      rowPlayed: "{n} jouée(s)",
      seenCopies: "vue {n} fois",
      seenOnce: "vue une fois",
      legendLeft: "dans le deck",
      legendDrawn: "piochée",
      legendPlayed: "jouée",
      cardPage: "Fiche sur originsmeta.com",
      leaving: "ouvre originsmeta.com hors de Twitch",
      footer: "OriginsMeta · non affilié à Koin Games",
      waiting: "Le deck du streamer s'affiche ici quand OriginsMeta Tracker est allumé.",
      cfgTitle: "OriginsMeta Deck tracker",
      cfgIntro: "Vos spectateurs ouvrent votre deck par-dessus le live et lisent les cartes en direct.",
      cfgStep1: "Associez OriginsMeta Tracker à votre compte sur originsmeta.com.",
      cfgStep2a: "Sur ",
      cfgStep2b: ", dans l'encadré « Extension Twitch », créez le code.",
      cfgStep3: "Saisissez le code ici et appuyez sur « Associer ».",
      cfgLabel: "Code d'originsmeta.com",
      cfgButton: "Associer",
      cfgBusy: "Association…",
      cfgDone: "Chaîne associée à {user}",
      cfgDoneNoUser: "Chaîne associée",
      cfgFormat: "Le code compte 8 lettres et chiffres, comme ABCD-EFGH.",
      cfgNotReady: "Twitch n'a pas encore autorisé l'extension : patientez un instant et réessayez.",
      cfgErr_invalid_code: "Code erroné ou expiré : créez-en un nouveau sur originsmeta.com.",
      cfgErr_forbidden: "Seul le streamer de cette chaîne peut l'associer.",
      cfgErr_unavailable: "Le service n'est pas disponible pour le moment. Réessayez plus tard.",
      cfgErr_error: "Une erreur s'est produite. Réessayez.",
      cfgNote: "L'extension affiche uniquement ce que le Deck tracker montre déjà en live : votre deck avec les copies restantes, le tour, la Légendaire de l'adversaire et les cartes qu'il révèle. Jamais de noms, de rangs ni d'identifiants de parties.",
      appHide: "Masquer les panneaux",
      appShow: "Afficher les panneaux",
      cfgModeTitle: "Comment votre public voit le deck",
      cfgModeApp: "Comme l'application",
      cfgModeAppHint: "Les mêmes panneaux qu'OriginsMeta Tracker, aux mêmes endroits et avec le style choisi dans l'application. Retirez les panneaux de l'application de votre scène OBS, pour que votre public ne les voie pas deux fois.",
      cfgModeTab: "Onglet",
      cfgModeTabHint: "Un petit onglet « Deck » à gauche de la vidéo, que votre public ouvre quand il le souhaite.",
      cfgModeSaved: "Enregistré : votre public le verra dans quelques secondes.",
      cfgModeError: "Impossible d'enregistrer le choix. Réessayez."
    }
  };

  /** La lingua dal parametro "language" dell'iframe (es. "it", "es-mx"), poi da quella del browser; ripiego en. */
  function detectLang() {
    var candidates = [];
    try {
      candidates.push(new URLSearchParams(window.location.search).get("language") || "");
    } catch (e) {
      /* niente parametri */
    }
    candidates.push(document.documentElement.getAttribute("data-lang") || "");
    for (var i = 0; i < candidates.length; i++) {
      var two = String(candidates[i]).slice(0, 2).toLowerCase();
      if (LANGS.indexOf(two) >= 0) return two;
    }
    return "en";
  }

  var lang = detectLang();
  document.documentElement.lang = lang;

  /** Un testo nella lingua, con i segnaposto {nome} sostituiti. */
  function t(id, vars) {
    var s = (TEXTS[lang] && TEXTS[lang][id]) || TEXTS.en[id] || id;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return s;
  }

  /** createElement con classe, attributi e figli (stringhe = testo). Mai HTML. */
  function el(tag, opts, children) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) node.className = opts.cls;
    if (opts.text != null) node.textContent = String(opts.text);
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(function (k) {
        if (opts.attrs[k] != null) node.setAttribute(k, String(opts.attrs[k]));
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function isInt(n, min, max) {
    return typeof n === "number" && Math.floor(n) === n && n >= min && n <= max;
  }
  function isKey(k) {
    return typeof k === "string" && KEY_RE.test(k);
  }
  /** Toglie i caratteri di controllo e di direzione del testo, taglia alla lunghezza data. */
  function cleanText(s, max) {
    if (typeof s !== "string") return "";
    return s.replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, "").trim().slice(0, max);
  }

  /**
   * La tabella delle carte di /api/twitch/cards/<lingua>, controllata voce per voce: {chiave: {name, slug, type, cost,
   * power, health, legendary, text, image}}. Le voci con una forma diversa si scartano.
   */
  function parseCards(raw) {
    var out = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    Object.keys(raw).forEach(function (key) {
      if (!isKey(key)) return;
      var c = raw[key];
      if (!Array.isArray(c) || c.length < 9) return;
      var name = cleanText(c[0], 80);
      if (!name || typeof c[1] !== "string" || !SLUG_RE.test(c[1])) return;
      if (c[2] !== "unit" && c[2] !== "spell" && c[2] !== "token") return;
      var num = function (v) {
        return v === null ? null : isInt(v, -99, 99) ? v : undefined;
      };
      var cost = num(c[3]);
      var power = num(c[4]);
      var health = num(c[5]);
      if (cost === undefined || power === undefined || health === undefined) return;
      var image = typeof c[8] === "string" && IMAGE_RE.test(c[8]) ? BASE + c[8] : null;
      out[key] = {
        key: key,
        name: name,
        slug: c[1],
        type: c[2],
        cost: cost,
        power: power,
        health: health,
        legendary: c[6] === 1,
        text: typeof c[7] === "string" ? c[7].replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f‪-‮⁦-⁩]/g, "").slice(0, 1200) : "",
        image: image
      };
    });
    return out;
  }

  /** Lo stato dal vivo (LiveState v1) se ha la forma attesa, altrimenti null: stessi controlli di parseLiveState. */
  function parseState(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (raw.v !== 1) return null;
    var deck = null;
    if (raw.deck !== null) {
      var d = raw.deck;
      if (!d || typeof d !== "object" || !Array.isArray(d.cards) || d.cards.length > LIMITS.deckCards) return null;
      if (d.name !== null && d.name !== undefined && typeof d.name !== "string") return null;
      if (d.legendary !== null && d.legendary !== undefined && !isKey(d.legendary)) return null;
      var cards = [];
      for (var i = 0; i < d.cards.length; i++) {
        var c = d.cards[i];
        if (!Array.isArray(c) || c.length !== 4 || !isKey(c[0]) || !isInt(c[1], 0, LIMITS.copies) || !isInt(c[2], 0, LIMITS.copies) || !isInt(c[3], 0, LIMITS.copies)) return null;
        cards.push({ key: c[0], copies: c[1], drawn: c[2], played: c[3] });
      }
      deck = { name: cleanText(d.name, LIMITS.name) || null, legendary: d.legendary || null, cards: cards };
    }
    var live = null;
    if (raw.live !== null) {
      var l = raw.live;
      if (!l || typeof l !== "object" || typeof l.inMatch !== "boolean") return null;
      if (l.round !== null && !isInt(l.round, 0, 50)) return null;
      if (l.deckLeft !== null && !isInt(l.deckLeft, 0, 60)) return null;
      var o = l.opp;
      if (!o || typeof o !== "object" || !Array.isArray(o.seen) || o.seen.length > LIMITS.seen) return null;
      if (o.legendary !== null && !isKey(o.legendary)) return null;
      if (o.deckLeft !== null && !isInt(o.deckLeft, 0, 60)) return null;
      var seen = [];
      for (var j = 0; j < o.seen.length; j++) {
        var s = o.seen[j];
        if (!Array.isArray(s) || s.length !== 2 || !isKey(s[0]) || !isInt(s[1], 1, 20)) return null;
        seen.push({ key: s[0], n: s[1] });
      }
      live = { inMatch: l.inMatch, round: l.round, deckLeft: l.deckLeft, opp: { legendary: o.legendary, deckLeft: o.deckLeft, seen: seen } };
    }
    return { deck: deck, live: live };
  }

  /** Un'ora ISO in millisecondi, 0 se manca o non si legge. */
  function timeOf(at) {
    if (typeof at !== "string" || at.length > 40) return 0;
    var ms = Date.parse(at);
    return isFinite(ms) ? ms : 0;
  }

  /** Il messaggio di PubSub ({t: "state", at, s}) già controllato: {at, state} o null. */
  function parseMessage(message) {
    if (typeof message !== "string" || message.length > 12000) return null;
    var m;
    try {
      m = JSON.parse(message);
    } catch (e) {
      return null;
    }
    if (!m || typeof m !== "object" || m.t !== "state") return null;
    var state = parseState(m.s);
    return state ? { at: timeOf(m.at), state: state, raw: m.s } : null;
  }

  /** GET JSON da originsmeta.com, con tempo massimo. */
  function getJson(path, timeoutMs) {
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 10000) : null;
    return fetch(BASE + path, { method: "GET", credentials: "omit", signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
  }

  /** Il link di una pagina di originsmeta.com nella lingua dello spettatore (sempre in una nuova scheda). */
  function siteUrl(path) {
    return BASE + "/" + lang + path;
  }

  /** Un link verso originsmeta.com: nuova scheda, rel noopener, e l'avviso che si esce da Twitch. */
  function siteLink(path, label, cls) {
    var a = el("a", {
      cls: cls || "om-link",
      attrs: { href: siteUrl(path), target: "_blank", rel: "noopener noreferrer", title: t("leaving") }
    }, [label, el("span", { cls: "om-ext", text: " ↗", attrs: { "aria-hidden": "true" } }), el("span", { cls: "om-sr", text: " (" + t("leaving") + ")" })]);
    return a;
  }

  window.OM = {
    BASE: BASE,
    lang: lang,
    t: t,
    el: el,
    isKey: isKey,
    channelOk: function (id) {
      return typeof id === "string" && CHANNEL_RE.test(id);
    },
    parseCards: parseCards,
    parseState: parseState,
    parseMessage: parseMessage,
    timeOf: timeOf,
    getJson: getJson,
    siteUrl: siteUrl,
    siteLink: siteLink,
    slugOk: function (s) {
      return typeof s === "string" && SLUG_RE.test(s);
    }
  };
})();
