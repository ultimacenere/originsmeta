/*
 * Broadcasting OM, estensione Twitch (05/11/2026): parti comuni a overlay e configurazione.
 *
 * - lingua di chi guarda (parametro "language" che Twitch passa all'iframe; en, it, es, fr, pt, de, ru, zh-cn, ripiego
 *   en) e testi dell'estensione;
 * - controlli sui dati della rete (carte e stato della diretta): niente entra nel DOM senza passare da qui, e il DOM si
 *   costruisce solo con createElement/textContent (funzione el), mai con innerHTML;
 * - chiamate a https://originsmeta.com, l'unico dominio nelle allowlist della console;
 * - il codice del gioco ("Copia mazzo"), calcolato qui come fa il sito (src/lib/deckcode.ts, encodeGameCode).
 *
 * La forma dello stato è ExtState di src/lib/broadcast/live.ts (versione 1): parseState ripete i controlli di
 * parseExtState (un test del sito le confronta), così un messaggio diverso si ignora invece di rompere la pagina.
 */
(function () {
  "use strict";

  // Solo per le prove in locale (dev/): con data-om-base="local" su localhost le chiamate vanno al server di prova.
  var LOCAL = document.documentElement.getAttribute("data-om-base") === "local" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  var BASE = LOCAL ? window.location.origin : "https://originsmeta.com";
  var SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var KEY_RE = /^C\d{4,6}_[A-Z]{2}(?:_V\d{5})?$/;
  var IMAGE_RE = /^\/cards\/(?:art\/)?[a-z0-9-]{1,80}\.webp$/;
  var CHANNEL_RE = /^\d{1,20}$/;
  var LANGS = ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"];
  var NB = "\u00a0";

  var TEXTS = {
    en: {
      tab: "Decks",
      tabAria: "Open the players' decks",
      plateAria: "{name}'s decks",
      deck: "Deck {n}",
      inPlay: "In play",
      copy: "Copy deck",
      copied: "Copied!",
      noCode: "Code not available",
      codeLabel: "Deck code",
      close: "Close",
      closeCard: "Close the card",
      left: "{left}/{total} left",
      legendary: "Legendary",
      cardPage: "Card page on originsmeta.com",
      leaving: "opens originsmeta.com outside Twitch",
      footer: "OriginsMeta · not affiliated with Koin Games",
      cfgTitle: "Broadcasting OM",
      cfgIntro: "Your viewers open both players' decks over the stream and copy the game code, live with your tournament's control room.",
      cfgStep1a: "On ",
      cfgStep1b: ", log in and press “Go live” in the “Live from the site” box.",
      cfgStep2: "In the same box press “Link a Twitch channel”: you get a code that lasts 10 minutes.",
      cfgStep3: "Type it below and press Link.",
      cfgLabel: "Code from the control room",
      cfgButton: "Link",
      cfgBusy: "Linking…",
      cfgDone: "Linked to {user}'s control room. Your viewers see the decks as soon as the control room is live with some decks.",
      cfgDoneNoUser: "Channel linked.",
      cfgFormat: "The code is 8 letters and numbers, like ABCD-EFGH.",
      cfgNotReady: "Twitch has not authorized the extension yet: reload the page.",
      cfgErr_invalid_code: "Wrong or expired code: create a new one in the control room.",
      cfgErr_forbidden: "Only the channel owner can link it.",
      cfgErr_unavailable: "The service is not answering: try again in a few minutes.",
      cfgErr_too_many: "That control room already has 10 linked channels: unlink one first.",
      cfgErr_error: "Something went wrong: try again.",
      cfgNote: "In OBS keep the Broadcasting OM overlay (the address the control room gives you): the extension makes its player plates clickable for your viewers."
    },
    it: {
      tab: "Mazzi",
      tabAria: "Apri i mazzi dei giocatori",
      plateAria: "I mazzi di {name}",
      deck: "Mazzo {n}",
      inPlay: "In campo",
      copy: "Copia mazzo",
      copied: "Copiato!",
      noCode: "Codice non disponibile",
      codeLabel: "Codice del mazzo",
      close: "Chiudi",
      closeCard: "Chiudi la carta",
      left: "{left}/{total} rimaste",
      legendary: "Leggendaria",
      cardPage: "Scheda della carta su originsmeta.com",
      leaving: "apre originsmeta.com fuori da Twitch",
      footer: "OriginsMeta · non affiliato a Koin Games",
      cfgTitle: "Broadcasting OM",
      cfgIntro: "Chi guarda apre i mazzi dei due giocatori sopra la diretta e copia il codice del gioco, in tempo reale con la regia del tuo torneo.",
      cfgStep1a: "Su ",
      cfgStep1b: " fai l'accesso e premi «Accendi la diretta» nel riquadro «In diretta dal sito».",
      cfgStep2: "Nello stesso riquadro premi «Collega un canale Twitch»: ricevi un codice che vale 10 minuti.",
      cfgStep3: "Scrivilo qui sotto e premi Collega.",
      cfgLabel: "Codice della regia",
      cfgButton: "Collega",
      cfgBusy: "Collego…",
      cfgDone: "Collegato alla regia di {user}. Chi guarda vede i mazzi appena la regia è in diretta con dei mazzi.",
      cfgDoneNoUser: "Canale collegato.",
      cfgFormat: "Il codice è di 8 lettere e numeri, come ABCD-EFGH.",
      cfgNotReady: "Twitch non ha ancora autorizzato l'estensione: ricarica la pagina.",
      cfgErr_invalid_code: "Codice sbagliato o scaduto: creane uno nuovo nella regia.",
      cfgErr_forbidden: "Solo chi ha il canale può collegarlo.",
      cfgErr_unavailable: "Il servizio non risponde: riprova fra qualche minuto.",
      cfgErr_too_many: "Quella regia ha già 10 canali collegati: scollegane uno.",
      cfgErr_error: "Qualcosa è andato storto: riprova.",
      cfgNote: "In OBS tieni l'overlay di Broadcasting OM (l'indirizzo che ti dà la regia): l'estensione rende cliccabili per chi guarda le sue targhette dei giocatori."
    },
    es: {
      tab: "Mazos",
      tabAria: "Abre los mazos de los jugadores",
      plateAria: "Los mazos de {name}",
      deck: "Mazo {n}",
      inPlay: "En juego",
      copy: "Copiar mazo",
      copied: "¡Copiado!",
      noCode: "Código no disponible",
      codeLabel: "Código del mazo",
      close: "Cerrar",
      closeCard: "Cerrar la carta",
      left: "Quedan {left}/{total}",
      legendary: "Legendaria",
      cardPage: "Ficha de la carta en originsmeta.com",
      leaving: "abre originsmeta.com fuera de Twitch",
      footer: "OriginsMeta · no afiliado a Koin Games",
      cfgTitle: "Broadcasting OM",
      cfgIntro: "Tu público abre los mazos de los dos jugadores sobre el directo y copia el código del juego, en tiempo real con la sala de control (Control room) de tu torneo.",
      cfgStep1a: "En ",
      cfgStep1b: ", inicia sesión y pulsa «Go live» en el recuadro «Live from the site».",
      cfgStep2: "En el mismo recuadro pulsa «Link a Twitch channel»: recibes un código válido durante 10 minutos.",
      cfgStep3: "Escríbelo aquí abajo y pulsa Vincular.",
      cfgLabel: "Código de la sala de control",
      cfgButton: "Vincular",
      cfgBusy: "Vinculando…",
      cfgDone: "Vinculado a la sala de control de {user}. Tu público ve los mazos en cuanto la sala de control está en directo con mazos.",
      cfgDoneNoUser: "Canal vinculado.",
      cfgFormat: "El código tiene 8 letras y números, como ABCD-EFGH.",
      cfgNotReady: "Twitch aún no ha autorizado la extensión: recarga la página.",
      cfgErr_invalid_code: "Código incorrecto o caducado: crea uno nuevo en la sala de control.",
      cfgErr_forbidden: "Solo el dueño del canal puede vincularlo.",
      cfgErr_unavailable: "El servicio no responde: inténtalo de nuevo en unos minutos.",
      cfgErr_too_many: "Esa sala de control ya tiene 10 canales vinculados: desvincula uno.",
      cfgErr_error: "Algo salió mal: inténtalo de nuevo.",
      cfgNote: "En OBS mantén el overlay de Broadcasting OM (la dirección que te da la sala de control): la extensión hace clicables para tu público sus placas de jugadores."
    },
    fr: {
      tab: "Decks",
      tabAria: "Ouvrir les decks des joueurs",
      plateAria: "Les decks de {name}",
      deck: "Deck {n}",
      inPlay: "En jeu",
      copy: "Copier le deck",
      copied: "Copié" + NB + "!",
      noCode: "Code non disponible",
      codeLabel: "Code du deck",
      close: "Fermer",
      closeCard: "Fermer la carte",
      left: "{left}/{total} restantes",
      legendary: "Légendaire",
      cardPage: "Fiche de la carte sur originsmeta.com",
      leaving: "ouvre originsmeta.com hors de Twitch",
      footer: "OriginsMeta · non affilié à Koin Games",
      cfgTitle: "Broadcasting OM",
      cfgIntro: "Votre public ouvre les decks des deux joueurs par-dessus le live et copie le code du jeu, en direct avec la régie (Control room) de votre tournoi.",
      cfgStep1a: "Sur ",
      cfgStep1b: ", connectez-vous et appuyez sur «" + NB + "Go live" + NB + "» dans l'encadré «" + NB + "Live from the site" + NB + "».",
      cfgStep2: "Dans le même encadré, appuyez sur «" + NB + "Link a Twitch channel" + NB + "»" + NB + ": vous recevez un code valable 10 minutes.",
      cfgStep3: "Saisissez-le ci-dessous et appuyez sur Associer.",
      cfgLabel: "Code de la régie",
      cfgButton: "Associer",
      cfgBusy: "Association…",
      cfgDone: "Chaîne associée à la régie de {user}. Votre public voit les decks dès que la régie est en direct avec des decks.",
      cfgDoneNoUser: "Chaîne associée.",
      cfgFormat: "Le code compte 8 lettres et chiffres, comme ABCD-EFGH.",
      cfgNotReady: "Twitch n'a pas encore autorisé l'extension" + NB + ": rechargez la page.",
      cfgErr_invalid_code: "Code erroné ou expiré" + NB + ": créez-en un nouveau dans la régie.",
      cfgErr_forbidden: "Seul le propriétaire de la chaîne peut l'associer.",
      cfgErr_unavailable: "Le service ne répond pas" + NB + ": réessayez dans quelques minutes.",
      cfgErr_too_many: "Cette régie a déjà 10 chaînes associées" + NB + ": dissociez-en une.",
      cfgErr_error: "Un problème est survenu" + NB + ": réessayez.",
      cfgNote: "Dans OBS, gardez l'overlay de Broadcasting OM (l'adresse donnée par la régie)" + NB + ": l'extension rend ses plaques des joueurs cliquables pour votre public."
    },
    pt: {
      tab: "Decks",
      tabAria: "Abrir os decks dos jogadores",
      plateAria: "Os decks de {name}",
      deck: "Deck {n}",
      inPlay: "Em jogo",
      copy: "Copiar deck",
      copied: "Copiado!",
      noCode: "Código indisponível",
      codeLabel: "Código do deck",
      close: "Fechar",
      closeCard: "Fechar a carta",
      left: "{left}/{total} restantes",
      legendary: "Lendária",
      cardPage: "Página da carta no originsmeta.com",
      leaving: "abre o originsmeta.com fora da Twitch",
      footer: "OriginsMeta · não afiliado à Koin Games",
      cfgTitle: "Broadcasting OM",
      cfgIntro: "Quem assiste abre os decks dos dois jogadores sobre a live e copia o código do jogo, em tempo real com o painel de controle (Control room) do seu torneio.",
      cfgStep1a: "No ",
      cfgStep1b: ", faça login e clique em “Go live” no quadro “Live from the site”.",
      cfgStep2: "No mesmo quadro, clique em “Link a Twitch channel”: você recebe um código válido por 10 minutos.",
      cfgStep3: "Digite o código aqui embaixo e clique em Vincular.",
      cfgLabel: "Código do painel de controle",
      cfgButton: "Vincular",
      cfgBusy: "Vinculando…",
      cfgDone: "Vinculado ao painel de controle de {user}. Quem assiste vê os decks assim que o painel estiver ao vivo com decks.",
      cfgDoneNoUser: "Canal vinculado.",
      cfgFormat: "O código tem 8 letras e números, como ABCD-EFGH.",
      cfgNotReady: "A Twitch ainda não autorizou a extensão: recarregue a página.",
      cfgErr_invalid_code: "Código errado ou expirado: crie um novo no painel de controle.",
      cfgErr_forbidden: "Só o dono do canal pode vincular.",
      cfgErr_unavailable: "O serviço não está respondendo: tente de novo em alguns minutos.",
      cfgErr_too_many: "Esse painel de controle já tem 10 canais vinculados: desvincule um.",
      cfgErr_error: "Algo deu errado: tente de novo.",
      cfgNote: "No OBS, mantenha o overlay do Broadcasting OM (o endereço que o painel de controle te dá): a extensão torna clicáveis as placas dos jogadores para quem assiste."
    },
    de: {
      tab: "Decks",
      tabAria: "Decks der Spieler öffnen",
      plateAria: "Decks von {name}",
      deck: "Deck {n}",
      inPlay: "Im Spiel",
      copy: "Deck kopieren",
      copied: "Kopiert!",
      noCode: "Code nicht verfügbar",
      codeLabel: "Deck-Code",
      close: "Schließen",
      closeCard: "Karte schließen",
      left: "{left}/{total} übrig",
      legendary: "Legendär",
      cardPage: "Kartenseite auf originsmeta.com",
      leaving: "öffnet originsmeta.com außerhalb von Twitch",
      footer: "OriginsMeta · nicht mit Koin Games verbunden",
      cfgTitle: "Broadcasting OM",
      cfgIntro: "Deine Zuschauer öffnen die Decks beider Spieler über dem Stream und kopieren den Spielcode, live mit der Regie (Control room) deines Turniers.",
      cfgStep1a: "Melde dich auf ",
      cfgStep1b: " an und klicke im Feld „Live from the site“ auf „Go live“.",
      cfgStep2: "Klicke im selben Feld auf „Link a Twitch channel“: Du bekommst einen Code, der 10 Minuten gilt.",
      cfgStep3: "Gib ihn hier unten ein und klicke auf Verbinden.",
      cfgLabel: "Code aus der Regie",
      cfgButton: "Verbinden",
      cfgBusy: "Verbinde…",
      cfgDone: "Mit der Regie von {user} verbunden. Deine Zuschauer sehen die Decks, sobald die Regie mit Decks live ist.",
      cfgDoneNoUser: "Kanal verbunden.",
      cfgFormat: "Der Code hat 8 Buchstaben und Ziffern, zum Beispiel ABCD-EFGH.",
      cfgNotReady: "Twitch hat die Erweiterung noch nicht autorisiert: Lade die Seite neu.",
      cfgErr_invalid_code: "Falscher oder abgelaufener Code: Erstelle in der Regie einen neuen.",
      cfgErr_forbidden: "Nur wem der Kanal gehört, kann ihn verbinden.",
      cfgErr_unavailable: "Der Dienst antwortet gerade nicht: Versuche es in ein paar Minuten erneut.",
      cfgErr_too_many: "Diese Regie hat schon 10 verbundene Kanäle: Trenne zuerst einen.",
      cfgErr_error: "Etwas ist schiefgelaufen: Versuche es erneut.",
      cfgNote: "Behalte in OBS das Overlay von Broadcasting OM (die Adresse aus der Regie): Die Erweiterung macht seine Spielerschilder für deine Zuschauer klickbar."
    },
    ru: {
      tab: "Колоды",
      tabAria: "Открыть колоды игроков",
      plateAria: "Колоды игрока {name}",
      deck: "Колода {n}",
      inPlay: "В игре",
      copy: "Копировать колоду",
      copied: "Скопировано!",
      noCode: "Код недоступен",
      codeLabel: "Код колоды",
      close: "Закрыть",
      closeCard: "Закрыть карту",
      left: "Осталось {left}/{total}",
      legendary: "Легендарная",
      cardPage: "Страница карты на originsmeta.com",
      leaving: "открывает originsmeta.com вне Twitch",
      footer: "OriginsMeta · не связан с Koin Games",
      cfgTitle: "Broadcasting OM",
      cfgIntro: "Зрители открывают колоды обоих игроков поверх трансляции и копируют код игры — в реальном времени вместе с пультом (Control room) вашего турнира.",
      cfgStep1a: "На ",
      cfgStep1b: " войдите в аккаунт и нажмите «Go live» в блоке «Live from the site».",
      cfgStep2: "В том же блоке нажмите «Link a Twitch channel»: вы получите код, который действует 10 минут.",
      cfgStep3: "Введите его ниже и нажмите «Связать».",
      cfgLabel: "Код с пульта",
      cfgButton: "Связать",
      cfgBusy: "Связываю…",
      cfgDone: "Канал связан с пультом {user}. Зрители увидят колоды, как только пульт выйдет в эфир с колодами.",
      cfgDoneNoUser: "Канал связан.",
      cfgFormat: "Код состоит из 8 букв и цифр, например ABCD-EFGH.",
      cfgNotReady: "Twitch ещё не авторизовал расширение: перезагрузите страницу.",
      cfgErr_invalid_code: "Неверный или просроченный код: создайте новый на пульте.",
      cfgErr_forbidden: "Связать канал может только его владелец.",
      cfgErr_unavailable: "Сервис сейчас не отвечает: попробуйте через несколько минут.",
      cfgErr_too_many: "К этому пульту уже привязано 10 каналов: отвяжите один.",
      cfgErr_error: "Что-то пошло не так: попробуйте ещё раз.",
      cfgNote: "В OBS оставьте оверлей Broadcasting OM (адрес с пульта): расширение делает таблички игроков кликабельными для зрителей."
    },
    "zh-cn": {
      tab: "卡组",
      tabAria: "打开选手的卡组",
      plateAria: "{name} 的卡组",
      deck: "卡组 {n}",
      inPlay: "场上",
      copy: "复制卡组",
      copied: "已复制！",
      noCode: "暂无代码",
      codeLabel: "卡组代码",
      close: "关闭",
      closeCard: "关闭卡牌",
      left: "剩余 {left}/{total}",
      legendary: "传说",
      cardPage: "originsmeta.com 上的卡牌页面",
      leaving: "将在 Twitch 之外打开 originsmeta.com",
      footer: "OriginsMeta · 与 Koin Games 无关联",
      cfgTitle: "Broadcasting OM",
      cfgIntro: "观众可以在直播画面上打开两位选手的卡组并复制游戏代码，与你的赛事导播台（Control room）实时同步。",
      cfgStep1a: "在 ",
      cfgStep1b: " 登录，并在“Live from the site”框中点击“Go live”。",
      cfgStep2: "在同一个框中点击“Link a Twitch channel”：你会得到一个 10 分钟内有效的代码。",
      cfgStep3: "在下方输入代码并点击“关联”。",
      cfgLabel: "导播台代码",
      cfgButton: "关联",
      cfgBusy: "正在关联…",
      cfgDone: "已关联到 {user} 的导播台。导播台带着卡组开播后，观众就能看到卡组。",
      cfgDoneNoUser: "频道已关联。",
      cfgFormat: "代码由 8 个字母和数字组成，例如 ABCD-EFGH。",
      cfgNotReady: "Twitch 尚未授权此扩展：请刷新页面。",
      cfgErr_invalid_code: "代码错误或已过期：请在导播台重新生成。",
      cfgErr_forbidden: "只有频道主可以关联。",
      cfgErr_unavailable: "服务暂时没有响应：请几分钟后再试。",
      cfgErr_too_many: "该导播台已关联 10 个频道：请先取消关联一个。",
      cfgErr_error: "出了点问题：请重试。",
      cfgNote: "在 OBS 中保留 Broadcasting OM 的叠加层（导播台给你的地址）：扩展会让观众可以点击其中的选手名牌。"
    }
  };

  /** La lingua dal parametro "language" dell'iframe (es. "it", "zh-cn", "pt-br"), poi da quella del browser; ripiego en. */
  function detectLang() {
    var candidates = [];
    try {
      candidates.push(new URLSearchParams(window.location.search).get("language") || "");
    } catch {
      /* niente parametri */
    }
    candidates.push(navigator.language || "");
    for (var i = 0; i < candidates.length; i++) {
      var c = String(candidates[i]).toLowerCase();
      if (c.slice(0, 2) === "zh") return "zh-cn";
      var two = c.slice(0, 2);
      if (LANGS.indexOf(two) >= 0) return two;
    }
    return "en";
  }

  var lang = detectLang();
  document.documentElement.lang = lang === "zh-cn" ? "zh-Hans" : lang;

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
  function slugOk(s) {
    return typeof s === "string" && s.length <= 80 && SLUG_RE.test(s);
  }
  var CTRL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g;
  /** Testo pulito dai caratteri di controllo e di direzione, al massimo `max` caratteri; null se non è un testo. */
  function text(v, max) {
    if (typeof v !== "string" || v.length > max * 4) return null;
    return Array.from(v.replace(CTRL, "")).slice(0, max).join("");
  }

  /**
   * La tabella delle carte di /api/broadcast/ext/cards/<lingua>, controllata voce per voce: {slug: {name, cost, spell,
   * legendary, power, health, alignment, text, image, art, key}} più le etichette. Le voci con un'altra forma si scartano.
   */
  function parseCards(raw) {
    var out = { labels: { unit: "Unit", spell: "Spell", good: "Good", evil: "Evil", neutral: "Neutral" }, cards: {} };
    if (!raw || typeof raw !== "object" || raw.v !== 1 || !raw.cards || typeof raw.cards !== "object") return out;
    if (raw.labels && typeof raw.labels === "object") {
      ["unit", "spell", "good", "evil", "neutral"].forEach(function (k) {
        var v = text(raw.labels[k], 30);
        if (v) out.labels[k] = v;
      });
    }
    Object.keys(raw.cards).forEach(function (slug) {
      if (!slugOk(slug)) return;
      var c = raw.cards[slug];
      if (!Array.isArray(c) || c.length < 11) return;
      var name = text(c[0], 80);
      if (!name) return;
      var num = function (v) {
        return v === null ? null : isInt(v, -99, 99) ? v : undefined;
      };
      var cost = num(c[1]);
      var power = num(c[4]);
      var health = num(c[5]);
      if (cost === undefined || power === undefined || health === undefined) return;
      out.cards[slug] = {
        slug: slug,
        name: name,
        cost: cost,
        spell: c[2] === 1,
        legendary: c[3] === 1,
        power: power,
        health: health,
        alignment: c[6] === "good" || c[6] === "evil" || c[6] === "neutral" ? c[6] : "",
        text: text(c[7], 1200) || "",
        image: typeof c[8] === "string" && IMAGE_RE.test(c[8]) ? BASE + c[8] : null,
        art: typeof c[9] === "string" && IMAGE_RE.test(c[9]) ? BASE + c[9] : null,
        key: typeof c[10] === "string" && KEY_RE.test(c[10]) ? c[10] : null
      };
    });
    return out;
  }

  /** Lo stato della diretta (ExtState v1) se ha la forma attesa, altrimenti null: stessi controlli di parseExtState. */
  function parseState(r) {
    if (!r || typeof r !== "object") return null;
    if (r.v !== 1 || !r.t || typeof r.t !== "object" || !Array.isArray(r.p) || r.p.length !== 2) return null;
    var name = text(r.t.n, 40);
    var no = text(r.t.no, 12);
    var ph = text(r.t.ph, 28);
    if (name === null || no === null || ph === null || !(r.t.bo === 1 || r.t.bo === 3 || r.t.bo === 5)) return null;
    var players = [];
    for (var i = 0; i < 2; i++) {
      var p = r.p[i];
      if (!p || typeof p !== "object") return null;
      var n = text(p.n, 24);
      var ti = text(p.t, 40);
      if (n === null || ti === null || !isInt(p.s, 0, 3) || !Array.isArray(p.d) || p.d.length < 1 || p.d.length > 4 || !isInt(p.a, 0, p.d.length - 1)) return null;
      var decks = [];
      for (var j = 0; j < p.d.length; j++) {
        var d = p.d[j];
        if (!d || typeof d !== "object") return null;
        var dn = text(d.n, 24);
        if (dn === null || !(d.l === null || slugOk(d.l))) return null;
        if (!Array.isArray(d.c) || d.c.length > 12) return null;
        for (var k = 0; k < d.c.length; k++) if (!slugOk(d.c[k])) return null;
        if (!d.p || typeof d.p !== "object" || Array.isArray(d.p)) return null;
        var played = {};
        var keys = Object.keys(d.p);
        for (var q = 0; q < keys.length; q++) {
          if (!slugOk(keys[q]) || !isInt(d.p[keys[q]], 1, 2)) return null;
          played[keys[q]] = d.p[keys[q]];
        }
        decks.push({ n: dn, l: d.l, c: d.c.slice(), p: played });
      }
      players.push({ n: n, t: ti, s: p.s, a: p.a, d: decks });
    }
    return { v: 1, t: { n: name, no: no, ph: ph, bo: r.t.bo }, p: players };
  }

  var LIVE_ID_RE = /^[a-z0-9]{12}$/;

  /** Il messaggio di PubSub {t: "bc", id, v, at, s | r} già controllato: {id, v, state | null, refetch}, o null. */
  function parseMessage(message) {
    if (typeof message !== "string" || message.length > 12000) return null;
    var m;
    try {
      m = JSON.parse(message);
    } catch {
      return null;
    }
    if (!m || typeof m !== "object" || m.t !== "bc" || !isInt(m.v, 0, 2147483647) || !(typeof m.id === "string" && LIVE_ID_RE.test(m.id))) return null;
    if (m.r === 1) return { id: m.id, v: m.v, refetch: true, state: null };
    if (m.s === null) return { id: m.id, v: m.v, refetch: false, state: null };
    var state = parseState(m.s);
    return state ? { id: m.id, v: m.v, refetch: false, state: state } : null;
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

  /** Un link verso originsmeta.com nella lingua di chi guarda: nuova scheda, rel noopener, e l'avviso che si esce da Twitch. */
  function siteLink(path, label, cls) {
    var siteLang = lang === "zh-cn" ? "zh-cn" : lang;
    return el("a", { cls: cls || "bo-link", attrs: { href: "https://originsmeta.com/" + siteLang + path, target: "_blank", rel: "noopener noreferrer", title: t("leaving") } }, [
      label,
      el("span", { cls: "bo-ext", text: " ↗", attrs: { "aria-hidden": "true" } }),
      el("span", { cls: "bo-sr", text: " (" + t("leaving") + ")" })
    ]);
  }

  /* ---------- codice del gioco (come encodeGameCode di src/lib/deckcode.ts) ---------- */

  function keyNumber(key) {
    var m = /^C(\d+)/i.exec(key);
    return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
  }
  function utf8ToBase64(s) {
    var bytes = new TextEncoder().encode(s);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  /** "KGBLDC" + base64("v1|KEY|…") + ":" + primi 4 byte di SHA-256, con le chiavi in ordine di numero. Promise<string>. */
  function encodeGameCode(keys) {
    var norm = keys.map(function (k) {
      return k.indexOf("_V") >= 0 ? k : k + "_V00000";
    });
    var sorted = norm
      .slice()
      .sort(function (a, b) {
        return keyNumber(a) - keyNumber(b);
      })
      .map(function (k) {
        return /_V00000$/.test(k) ? k.split("_V")[0] : k;
      });
    var payload = "v1|" + sorted.join("|");
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload)).then(function (digest) {
      var check = Array.prototype.map
        .call(new Uint8Array(digest.slice(0, 4)), function (b) {
          return ("0" + b.toString(16)).slice(-2);
        })
        .join("");
      return "KGBLDC" + utf8ToBase64(payload) + ":" + check;
    });
  }

  window.BO = {
    BASE: BASE,
    lang: lang,
    TEXTS: TEXTS,
    t: t,
    el: el,
    channelOk: function (id) {
      return typeof id === "string" && CHANNEL_RE.test(id);
    },
    parseCards: parseCards,
    parseState: parseState,
    parseMessage: parseMessage,
    liveIdOk: function (id) {
      return typeof id === "string" && LIVE_ID_RE.test(id);
    },
    getJson: getJson,
    siteLink: siteLink,
    encodeGameCode: encodeGameCode
  };
})();
