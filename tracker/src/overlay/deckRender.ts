/**
 * Il disegno dei pannelli del Deck tracker (dal 14/10/2026 in un modulo a sé: prima stava tutto in deck.ts). Lo usano
 * la pagina del pannello dell'app (deck.ts: finestra accanto al gioco e sorgente per OBS) e l'estensione Twitch
 * (twitchPanels.ts → twitch-extension/panels.js, Pierluigi: "non possiamo renderlo identico come visuale alla versione
 * del tracker scelto dall'utente?"), così chi guarda la diretta vede gli stessi pannelli dello streamer.
 *
 * Funzioni che restituiscono l'HTML del pannello (testi sempre passati da `esc`) più `paint`, che lo mette nella
 * radice e applica le larghezze delle barre e le illustrazioni (la CSP non ammette attributi style nell'HTML). Le carte
 * hanno `data-key` (la chiave del gioco), che l'estensione usa per l'anteprima al passaggio del mouse.
 * Il disegno e le sue ragioni sono descritti in testa a deck.ts.
 */
import type { DeckCard, DeckTrackerView, PanelCustom, PanelTemplate } from "../shared/types";

export type Lang = "en" | "it" | "es";
export type PanelSide = "me" | "opp";
export type PanelShape = Exclude<PanelTemplate, "classic">;

/** La forma del pannello: il classico (13/10/2026) è il mio mazzo come nelle Colonne e l'avversario come nelle Fasce. */
export const shapeOf = (layout: PanelTemplate, view: PanelSide): PanelShape => (layout === "classic" ? (view === "opp" ? "strips" : "columns") : layout);

export const LABELS = {
  en: {
    choose: "Choose a deck in the game",
    round: (n: number) => `Round ${n}`,
    opponent: "Opponent",
    oppWaiting: "The opponent's cards show up here, one by one, during the match.",
    oppTitle: "OriginsMeta · Opponent",
    cardState: (left: number, hand: number, played: number) => [`${left} in deck`, hand ? `${hand} in hand` : "", played ? `${played} played` : ""].filter(Boolean).join(" · "),
    ofDeck: (n: number) => `of ${n}`,
    deckLeft: "In deck",
    life: "Barriers",
    oppLeft: "Cards left",
    resize: "Drag to resize",
    spot: (opp: boolean) => (opp ? "Opponent panel" : "Deck tracker"),
    oppLeftTip: "Estimate: cards the opponent drew, counted from the face-down cards in their hand",
    mana: "Mana",
    you: "You",
    combat: "Combat",
    dir: (d: "left" | "right") => (d === "left" ? "right to left" : "left to right"),
    noScanner: "Turn on the screen scanner in the app for live updates.",
    close: "Close",
    legendary: "Legendary",
    brand: "Tracker · not affiliated with Koin Games",
  },
  it: {
    choose: "Scegli un mazzo nel gioco",
    round: (n: number) => `Round ${n}`,
    opponent: "Avversario",
    oppWaiting: "Durante la partita qui compaiono, una alla volta, le carte dell'avversario.",
    oppTitle: "OriginsMeta · Avversario",
    cardState: (left: number, hand: number, played: number) => [`${left} nel mazzo`, hand ? `${hand} in mano` : "", played ? `${played} giocat${played === 1 ? "a" : "e"}` : ""].filter(Boolean).join(" · "),
    ofDeck: (n: number) => `su ${n}`,
    deckLeft: "Nel mazzo",
    life: "Barriere",
    oppLeft: "Carte rimanenti",
    resize: "Trascina per allargare",
    spot: (opp: boolean) => (opp ? "Pannello dell'avversario" : "Deck tracker"),
    oppLeftTip: "Stima: carte pescate dall'avversario, contate dalle carte coperte nella sua mano",
    mana: "Mana",
    you: "Tu",
    combat: "Combattimento",
    dir: (d: "left" | "right") => (d === "left" ? "da destra a sinistra" : "da sinistra a destra"),
    noScanner: "Accendi lo scanner dello schermo nell'app per gli aggiornamenti dal vivo.",
    close: "Chiudi",
    legendary: "Leggendaria",
    brand: "Tracker · non affiliato a Koin Games",
  },
  es: {
    choose: "Elige un mazo en el juego",
    round: (n: number) => `Ronda ${n}`,
    opponent: "Rival",
    oppWaiting: "Durante la partida aquí aparecen, una a una, las cartas del rival.",
    oppTitle: "OriginsMeta · Rival",
    cardState: (left: number, hand: number, played: number) => [`${left} en el mazo`, hand ? `${hand} en la mano` : "", played ? `${played} jugada${played === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · "),
    ofDeck: (n: number) => `de ${n}`,
    deckLeft: "En el mazo",
    life: "Barreras",
    oppLeft: "Cartas restantes",
    resize: "Arrastra para cambiar el ancho",
    spot: (opp: boolean) => (opp ? "Panel del rival" : "Deck tracker"),
    oppLeftTip: "Estimación: cartas robadas por el rival, contadas por las cartas boca abajo de su mano",
    mana: "Maná",
    you: "Tú",
    combat: "Combate",
    dir: (d: "left" | "right") => (d === "left" ? "de derecha a izquierda" : "de izquierda a derecha"),
    noScanner: "Activa el escáner de pantalla en la app para las actualizaciones en vivo.",
    close: "Cerrar",
    legendary: "Legendaria",
    brand: "Tracker · sin afiliación con Koin Games",
  },
} as const;

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/**
 * Il disegnatore di un pannello. `view`: il mio mazzo o l'avversario; `inWindow`: la finestra dell'app accanto al
 * gioco (con la × e la maniglia; senza, la sorgente per OBS o l'estensione Twitch, con la dicitura in fondo).
 */
export function createDeckRenderer(opts: { view: PanelSide; lang: Lang; inWindow: boolean }) {
  const { view, inWindow } = opts;
  const L = LABELS[opts.lang];
  const keyAttr = (c: DeckCard | null) => (c && /^C\d{5}_[A-Z]{2}$/.test(c.key) ? ` data-key="${c.key}"` : "");

  /** Una carta intera con l'immagine del sito (senza rete resta la cornice con il nome). */
  const cardImg = (c: DeckCard | null) =>
    c?.slug
      ? `<span class="cardimg${c.legendary ? " is-legendary" : ""}"><img src="https://originsmeta.com/cards/${esc(c.slug)}.webp" alt="${esc(c.name)}" draggable="false" /><span class="cname">${esc(c.name)}</span></span>`
      : `<span class="cardimg empty" aria-hidden="true"></span>`;

  /**
   * Una carta del mio mazzo: il numero in alto dice quante copie sono ancora nel mazzo (Pierluigi, 12/10/2026: "deve
   * partire da 2 e poi ogni volta che la carta viene pescata decrescere prima ad 1 e poi quando a zero diventare scura
   * la carta"; la Leggendaria parte da 1). Una copia in mano e non ancora giocata accende il bordo menta.
   */
  function myCard(c: DeckCard, live: boolean, cls = "") {
    const left = live ? Math.max(0, c.copies - c.drawn) : c.copies;
    const inHand = live ? Math.max(0, c.drawn - c.played) : 0;
    const state = left === 0 ? " out" : "";
    const hand = inHand > 0 ? " inhand" : "";
    const tip = live ? `${c.name} · ${L.cardState(left, inHand, c.drawn - inHand)}` : c.name;
    const count = left > 0 ? `<span class="left" aria-hidden="true">${left}</span>` : "";
    return `<li class="gc${state}${hand}${cls}" title="${esc(tip)}"${keyAttr(c)}>${cardImg(c)}${count}</li>`;
  }

  /** I due segmenti della vita dell'eroe (accesi: ancora da colpire; persi: magenta, come i danni nel gioco). */
  const lifePips = (n: number | null) =>
    `<span class="pips" aria-label="${esc(L.life)} ${n ?? "?"}/2">${[0, 1].map((i) => `<i class="${n === null ? "unk" : i < n ? "on" : "lost"}"></i>`).join("")}</span>`;

  const stat = (value: string, label: string, tip = "") => `<div class="stat"${tip ? ` title="${esc(tip)}"` : ""}><b>${value}</b><span>${esc(label)}</span></div>`;

  /** Le carte ancora nel mazzo, con la barra che si svuota (25 all'inizio). */
  function deckLeftStat(left: number | null, total: number) {
    if (left === null) return stat("–", L.deckLeft);
    const pct = total > 0 ? Math.round((Math.min(left, total) / total) * 100) : 0;
    return `<div class="stat deckleft"><b>${left}<small> ${esc(L.ofDeck(total))}</small></b><span class="bar" aria-hidden="true"><i data-w="${pct}"></i></span><span>${esc(L.deckLeft)}</span></div>`;
  }

  /** "rimasto/massimo" del mana, o un trattino quando non si legge. */
  const manaText = (m: { current: number; max: number } | null) => (m ? `${m.current}<small>/${m.max}</small>` : "–");

  /** La freccia del combattimento: trattini e punta, come nel pannello del gioco; verso sinistra è la stessa girata. */
  const arrowSvg = (d: "left" | "right" | null) =>
    `<svg class="arrow${d === "left" ? " is-left" : ""}${d ? "" : " is-unknown"}" viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h8M14 8h8M26 8h18" /><path d="M42 2l12 6-12 6z" /></svg>`;

  /** Il pannello del mana del gioco, rimostrato: avversario in alto, la freccia del combattimento, io in basso. */
  function manaBox(live: DeckTrackerView["live"]) {
    const dir = live?.direction ?? null;
    return `<div class="manabox" aria-label="${esc(L.mana)}">
        <div class="mrow is-opp"><i class="tick"></i><b>${manaText(live?.mana.opp ?? null)}</b><span>${esc(L.opponent)}</span></div>
        <div class="dir" title="${esc(dir ? `${L.combat}: ${L.dir(dir)}` : L.combat)}">${arrowSvg(dir)}<span>${esc(L.combat)}</span></div>
        <div class="mrow is-me"><i class="tick"></i><b>${manaText(live?.mana.me ?? null)}</b><span>${esc(L.you)}</span></div>
      </div>`;
  }

  /** Una carta rivelata dall'avversario, con le copie viste se più di una. */
  const seenCard = (c: DeckCard) => `<li class="gc" title="${esc(c.name)}"${keyAttr(c)}>${cardImg(c)}${c.copies > 1 ? `<span class="left">×${c.copies}</span>` : ""}</li>`;

  /**
   * Il marchio di OriginsMeta nei template (indispensabile sul tracker: note del 12/10). Dal 28/10/2026 una scritta, il
   * rombo menta e "OriginsMeta", come la linguetta dell'estensione Twitch: il logo in immagine, alto 11–14 px, non si
   * leggeva (Pierluigi: "fanno oggettivamente schifo così piccoli").
   */
  const miniLogo = `<span class="om-word"><i class="om-mark" aria-hidden="true"></i>OriginsMeta</span>`;

  /** Le carte del mio mazzo nei template nuovi: la Leggendaria per prima, poi le 12 per costo. */
  function myCards(v: DeckTrackerView, zoom: string) {
    const leg = v.deck?.legendary ?? null;
    const live = Boolean(v.live);
    return `${leg ? myCard(leg, live, ` leg${zoom}`) : `<li class="gc leg">${cardImg(null)}</li>`}${(v.deck?.cards ?? []).map((c) => myCard(c, live)).join("")}`;
  }

  /** Leggendaria e carte rivelate dell'avversario nei template nuovi (la Leggendaria coperta finché non si vede). */
  function oppCards(v: DeckTrackerView) {
    const leg = v.live?.opponent.legendary ?? null;
    return `<li class="gc leg"${keyAttr(leg)}>${leg ? cardImg(leg) : `<span class="cardimg back" aria-hidden="true">?</span>`}</li>${(v.live?.opponent.seen ?? []).map(seenCard).join("")}`;
  }

  /** Il contenuto della linguetta di Fasce e Colonne: la × sul lato esterno (solo nella finestra), il logo verso l'interno. */
  function tabContent() {
    const x = inWindow ? `<button type="button" class="tab-x" id="close" title="${esc(L.close)}" aria-label="${esc(L.close)}">×</button>` : "";
    return view === "opp" ? `${miniLogo}${x}` : `${x}${miniLogo}`;
  }

  /** "Fasce": una fila sola, chiusa su tutti i lati, con il logo (e la ×) in una linguetta fuori dalla fascia. */
  function stripPanel(v: DeckTrackerView, zoom: string, grip: string, fine: string) {
    const seen = v.live?.opponent.seen.length ?? 0;
    const row =
      view === "opp" ? `${oppCards(v)}${seen ? "" : `<li class="swait">${esc(L.oppWaiting)}</li>`}`
      : v.deck ? myCards(v, zoom)
      : `<li class="swait">${esc(L.choose)}</li>`;
    return `<div class="tab stab">${tabContent()}</div><ul class="srow">${row}</ul>${fine}${grip}`;
  }

  /** La Leggendaria a fascia, come le righe del deck builder del sito (illustrazione da `--row-art`, vedi `paint`). */
  function legBand(c: DeckCard | null, mine: boolean, live: boolean, zoom = "") {
    if (!c) return `<div class="legband unknown"><span class="ngem">?</span><span class="lb-name">${esc(L.legendary)}</span></div>`;
    const left = mine ? (live ? Math.max(0, c.copies - c.drawn) : c.copies) : 0;
    const inHand = mine && live ? Math.max(0, c.drawn - c.played) : 0;
    const state = `${mine && left === 0 ? " out" : ""}${inHand > 0 ? " inhand" : ""}${zoom}`;
    return `<div class="legband${state}"${c.slug ? ` data-art="${esc(c.slug)}"` : ""}${keyAttr(c)} title="${esc(c.name)}"><span class="ngem">${c.mana ?? "–"}</span><span class="lb-name">★ ${esc(c.name)}</span>${mine && left > 0 ? `<span class="lb-count">${left}</span>` : ""}</div>`;
  }

  /** "Colonne ai lati": logo in testa, la Leggendaria a fascia, le carte 4 per fila, sotto i numeri (e il mana per l'avversario). */
  function columnPanel(v: DeckTrackerView, zoom: string, grip: string, fine: string) {
    const live = v.live;
    let body: string;
    if (view === "opp") {
      const left = live?.opponent.deckLeft;
      const seen = live?.opponent.seen ?? [];
      body = `${legBand(live?.opponent.legendary ?? null, false, Boolean(live))}${seen.length ? `<ul class="cgrid">${seen.map(seenCard).join("")}</ul>` : `<p class="muted cwait">${esc(L.oppWaiting)}</p>`}
      ${stat(left !== null && left !== undefined ? String(left) : "–", L.oppLeft, L.oppLeftTip)}
      ${manaBox(live)}`;
    } else if (v.deck) {
      const total = (v.deck.legendary?.copies ?? 0) + v.deck.cards.reduce((n, c) => n + c.copies, 0);
      body = `${v.deck.legendary ? legBand(v.deck.legendary, true, Boolean(live), zoom) : ""}<ul class="cgrid">${v.deck.cards.map((c) => myCard(c, Boolean(live))).join("")}</ul>${deckLeftStat(live?.deckLeft ?? null, total)}`;
    } else body = `<p class="muted pad">${esc(L.choose)}</p>`;
    return `<div class="tab ctab">${tabContent()}</div>${body}${fine}${grip}`;
  }

  /** Una carta in riga, "solo nomi" del personalizzato: gemma del mana, nome, copie rimaste (le mie) o viste (dell'avversario). */
  function nameRow(c: DeckCard, mine: boolean, live: boolean, cls = "") {
    const left = mine ? (live ? Math.max(0, c.copies - c.drawn) : c.copies) : c.copies;
    const inHand = mine && live ? Math.max(0, c.drawn - c.played) : 0;
    const state = `${mine && left === 0 ? " out" : ""}${inHand > 0 ? " inhand" : ""}${c.legendary ? " is-leg" : ""}${cls}`;
    const count = mine ? (left > 0 ? String(left) : "") : c.copies > 1 ? `×${c.copies}` : "";
    const tip = mine && live ? `${c.name} · ${L.cardState(left, inHand, c.drawn - inHand)}` : c.name;
    return `<li class="nrow${state}" title="${esc(tip)}"${keyAttr(c)}><span class="ngem">${c.mana ?? "–"}</span><span class="nname">${c.legendary ? "★ " : ""}${esc(c.name)}</span><span class="ncount">${count}</span></li>`;
  }

  /** "Personalizzato": le opzioni di Setup decidono che cosa c'è e come. */
  function customPanel(v: DeckTrackerView, c: PanelCustom, zoom: string, close: string, grip: string, fine: string) {
    const live = v.live;
    const names = c.cards === "names";
    const items: string[] = [];
    const stats: string[] = [];
    let waiting = "";
    if (view === "opp") {
      const leg = live?.opponent.legendary ?? null;
      if (c.opp.legendary) {
        if (leg) items.push(names ? nameRow(leg, false, Boolean(live), " leg") : `<li class="gc leg"${keyAttr(leg)}>${cardImg(leg)}</li>`);
        else if (!names) items.push(`<li class="gc leg"><span class="cardimg back" aria-hidden="true">?</span></li>`);
      }
      const seen = live?.opponent.seen ?? [];
      items.push(...seen.map((x) => (names ? nameRow(x, false, Boolean(live)) : seenCard(x))));
      if (!seen.length) waiting = `<p class="muted cwait">${esc(L.oppWaiting)}</p>`;
      const left = live?.opponent.deckLeft;
      if (c.opp.deckLeft) stats.push(stat(left !== null && left !== undefined ? String(left) : "–", L.oppLeft, L.oppLeftTip));
      if (c.opp.life) stats.push(stat(lifePips(live ? live.life.opp : null), L.life));
      if (c.opp.mana) stats.push(manaBox(live));
    } else if (v.deck) {
      const leg = v.deck.legendary;
      const list: [DeckCard, string][] = [...(c.me.legendary && leg ? [[leg, ` leg${zoom}`] as [DeckCard, string]] : []), ...v.deck.cards.map((x) => [x, ""] as [DeckCard, string])];
      // carte finite nascoste: solo durante la partita (fuori partita ogni carta ha tutte le sue copie)
      const shown = c.hideOut && live ? list.filter(([x]) => x.copies - x.drawn > 0) : list;
      items.push(...shown.map(([x, cls]) => (names ? nameRow(x, true, Boolean(live), cls) : myCard(x, Boolean(live), cls))));
      const total = (leg?.copies ?? 0) + v.deck.cards.reduce((n, x) => n + x.copies, 0);
      if (c.me.deckLeft) stats.push(deckLeftStat(live?.deckLeft ?? null, total));
      if (c.me.life) stats.push(stat(lifePips(live ? live.life.me : null), L.life));
    } else waiting = `<p class="muted pad">${esc(L.choose)}</p>`;
    const list = items.length ? `<ul class="${names ? "nlist" : "cgrid"} ccards">${items.join("")}</ul>` : "";
    return `<div class="chead">${miniLogo}${close}</div><div class="cust or-${c.orientation === "horizontal" ? "h" : "v"}"><div class="cmain">${list}${waiting}</div>${stats.length ? `<div class="cstats">${stats.join("")}</div>` : ""}</div>${fine}${grip}`;
  }

  /**
   * Disegna il pannello nella radice (`.dt`): classi della forma, HTML, larghezze delle barre e illustrazioni delle
   * fasce. `zoom` (" just") fa saltare la Leggendaria nel momento in cui la peschi.
   */
  function paint(root: HTMLElement, layout: PanelTemplate, v: DeckTrackerView, zoom: string) {
    const shape = shapeOf(layout, view);
    const close = inWindow ? `<button type="button" class="x" id="close" title="${esc(L.close)}" aria-label="${esc(L.close)}">×</button>` : "";
    const fine = `${v.scanner ? "" : `<p class="fine">${esc(L.noScanner)}</p>`}${inWindow ? "" : `<footer class="brand">${esc(L.brand)}</footer>`}`;
    const grip = inWindow ? `<span class="grip" id="grip" title="${esc(L.resize)}" aria-hidden="true"></span>` : "";
    root.classList.add("panel-x");
    root.classList.remove("has-tab", "tab-below", "tab-right");
    if (shape === "custom" && v.custom) {
      // carte per fila e opacità come variabili CSS (la CSP non ammette attributi style nell'HTML)
      root.style.setProperty("--per-row", String(v.custom.perRow));
      root.style.setProperty("--bg-alpha", String(v.custom.opacity / 100));
      root.innerHTML = customPanel(v, v.custom, zoom, close, grip, fine);
    } else if (shape === "strips") {
      root.classList.add(view === "opp" ? "tab-below" : "has-tab");
      root.innerHTML = stripPanel(v, zoom, grip, fine);
    } else {
      root.classList.add("has-tab");
      if (view === "opp") root.classList.add("tab-right");
      root.innerHTML = columnPanel(v, zoom, grip, fine);
    }
    for (const el of root.querySelectorAll<HTMLElement>("[data-w]")) el.style.width = `${Number(el.dataset.w)}%`;
    // l'illustrazione delle fasce della Leggendaria (solo slug del sito: lettere, cifre e trattini)
    for (const el of root.querySelectorAll<HTMLElement>("[data-art]")) if (/^[a-z0-9-]+$/.test(el.dataset.art ?? "")) el.style.setProperty("--row-art", `url("https://originsmeta.com/cards/art/${el.dataset.art}.webp")`);
  }

  return { L, paint };
}
