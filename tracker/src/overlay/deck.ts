/**
 * Il pannello del mazzo, "Deck tracker" (10/10/2026; dati da main/deckTracker.ts): la stessa pagina nella finestra
 * accanto al gioco (dati dal suo preload, `window.deckApi`) e nella sorgente per OBS (/overlay/deck, dati da
 * `deck.json` ogni 2 secondi). Parametri dell'indirizzo per OBS: `lang` (en, it, es) e `view=opp`.
 *
 * Disegno di Davdas dell'11/10/2026 (note Granola "tracker": "colpo d'occhio immediato, non lettura"):
 * - il mio mazzo: le 12 carte grandi in una griglia per costo (4 × 3, dall'11/10 sera 3 per fila su 4 file), che si scuriscono man mano che le peschi (metà
 *   delle copie: un po' scura; tutte: scura) con il contatore "1/2"; sotto, la Leggendaria a parte (si scurisce quando la
 *   peschi, con uno zoom) e un riquadro con le carte ancora nel mazzo e la vita dell'eroe;
 * - l'avversario (`view=opp`, finestra separata, un po' più piccola): Leggendaria e vita a sinistra, a destra le carte
 *   rivelate che compaiono una alla volta (si parte vuoti, mai caselle vuote).
 * Niente scorrimento: la finestra prende l'altezza del contenuto (`deckApi.fit`), la larghezza la sceglie il giocatore e
 * le carte la seguono. Niente cornice di Windows né titolo (Pierluigi, 11/10: "togliere la barra di Windows e il titolo
 * del deck"): nella finestra il pannello si trascina da qualunque punto e ha una × che compare al passaggio del mouse. Le carte sono sempre intere (immagini di originsmeta.com, mai ritagliate: i crediti restano).
 *
 * Template (0.4.1, 12/10/2026, disegni di Pierluigi; parametro `layout`, anche per OBS): `classic` è tutto quello qui
 * sopra; `strips` ("Fasce in alto") mette in una fila sola le 12 carte e la Leggendaria del mio mazzo, e la Leggendaria
 * e le carte rivelate dell'avversario ("no, solo le 12 carte e la leggendaria"); `columns` ("Colonne ai lati") ha a
 * sinistra il mio mazzo con le carte ancora nel mazzo e a destra Leggendaria e carte rivelate dell'avversario, le sue
 * carte rimanenti e il mana dei due con la freccia del combattimento (copre il pannello del mana del gioco).
 * La dicitura "non affiliato a Koin Games" resta solo nella sorgente per OBS, cioè quando il pannello va in onda: nelle
 * finestre accanto al gioco, che vede solo il giocatore, non c'è (Pierluigi, 11/10/2026: "togliamola dai due deck,
 * dobbiamo recuperare più spazio possibile"; la dicitura resta nella finestra principale dell'app).
 */
import type { DeckApi, DeckCard, DeckTrackerView } from "../shared/types";

declare global {
  interface Window {
    deckApi?: DeckApi;
  }
}

type Lang = "en" | "it" | "es";
const params = new URLSearchParams(location.search);
const asked = params.get("lang");
/** `view=opp`: il pannello delle carte dell'avversario (11/10/2026, finestra separata); altrimenti il mio mazzo. */
const view: "me" | "opp" = params.get("view") === "opp" ? "opp" : "me";
const lang: Lang = asked === "en" || asked === "it" || asked === "es" ? asked : /^it\b/i.test(navigator.language) ? "it" : /^es\b/i.test(navigator.language) ? "es" : "en";
document.documentElement.lang = lang;
document.body.classList.add(window.deckApi ? "in-window" : "in-obs");
if (view === "opp") document.body.classList.add("is-opp");
type Layout = "classic" | "strips" | "columns";
const asked2 = params.get("layout");
const layout: Layout = asked2 === "strips" || asked2 === "columns" ? asked2 : "classic";
document.body.classList.add(`layout-${layout}`);

const LABELS = {
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
    brand: "Tracker · sin afiliación con Koin Games",
  },
} as const;
const L = LABELS[lang];
if (view === "opp") document.title = L.oppTitle;

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** Una carta intera con l'immagine del sito (senza rete resta la cornice con il nome). */
const cardImg = (c: DeckCard | null) =>
  c?.slug
    ? `<span class="cardimg${c.legendary ? " is-legendary" : ""}"><img src="https://originsmeta.com/cards/${esc(c.slug)}.webp" alt="${esc(c.name)}" draggable="false" /><span class="cname">${esc(c.name)}</span></span>`
    : `<span class="cardimg empty" aria-hidden="true"></span>`;

/**
 * Una carta del mio mazzo: il numero in alto dice quante copie sono ancora nel mazzo (Pierluigi, 12/10/2026: "deve
 * partire da 2 e poi ogni volta che la carta viene pescata decrescere prima ad 1 e poi quando a zero diventare scura
 * la carta"; la Leggendaria parte da 1). Il numero c'è sempre, anche fuori partita; la carta resta accesa finché ne
 * resta una e diventa scura a zero, senza più il numero (11/10 sera: prima la carta si spegneva a metà dopo la prima
 * pescata e il numero compariva solo da lì). Una copia in mano e non ancora giocata accende il bordo menta.
 */
function myCard(c: DeckCard, live: boolean, cls = "") {
  const left = live ? Math.max(0, c.copies - c.drawn) : c.copies;
  const inHand = live ? Math.max(0, c.drawn - c.played) : 0;
  const state = left === 0 ? " out" : "";
  const hand = inHand > 0 ? " inhand" : "";
  const tip = live ? `${c.name} · ${L.cardState(left, inHand, c.drawn - inHand)}` : c.name;
  const count = left > 0 ? `<span class="left" aria-hidden="true">${left}</span>` : "";
  return `<li class="gc${state}${hand}${cls}" title="${esc(tip)}">${cardImg(c)}${count}</li>`;
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

const root = document.getElementById("deck")!;
root.addEventListener(
  "error",
  (e) => {
    if (e.target instanceof HTMLImageElement) e.target.closest(".cardimg")?.classList.add("noimg");
  },
  true,
);

/** La finestra alta come il contenuto (niente barra di scorrimento); in OBS non serve. */
function fit() {
  if (!window.deckApi) return;
  // dal fondo del pannello: sopra c'è anche la linguetta (margine in alto del pannello)
  window.deckApi.fit(Math.ceil(root.getBoundingClientRect().bottom + 8));
}
new ResizeObserver(fit).observe(root);
root.addEventListener("click", (e) => {
  if (e.target instanceof HTMLElement && e.target.id === "close") window.deckApi?.close();
});

/** "rimasto/massimo" del mana, o un trattino quando non si legge. */
const manaText = (m: { current: number; max: number } | null) => (m ? `${m.current}<small>/${m.max}</small>` : "–");

/** La freccia del combattimento: trattini e punta, come nel pannello del gioco; verso sinistra è la stessa girata. */
const arrowSvg = (d: "left" | "right" | null) =>
  `<svg class="arrow${d === "left" ? " is-left" : ""}${d ? "" : " is-unknown"}" viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h8M14 8h8M26 8h18" /><path d="M42 2l12 6-12 6z" /></svg>`;

/**
 * Il pannello dell'avversario a L (11/10/2026 sera, disegno di Pierluigi sul tabellone: "è lo spazio che abbiamo a
 * nostra disposizione"; "pannello unico a L, e leggi anche la direzione"): il braccio in alto, a sinistra dell'angolo,
 * ha la Leggendaria dell'avversario con le barriere e le carte rimanenti (stima dalla sua mano, detta nel suggerimento: 12/10/2026, prima le
 * carte viste); la colonna sul bordo destro sta sopra il pannello "MANA
 * DATA" del gioco: le carte rivelate dall'avversario, 4 per fila, che compaiono una alla volta, e sotto il mana rimostrato
 * (mana dell'avversario con la tacca magenta, la freccia del combattimento, il mio mana con la tacca azzurra). Dal 12/10
 * (Pierluigi: "allunga orizzontalmente il riquadro, metti le carte in fila da quattro e i mana li sposti sotto le carte
 * uscite") largo 480 punti, con il mana sotto le carte (prima sopra) e 4 carte per fila (prima 3).
 * L'angolo in basso a sinistra è trasparente e lascia passare i clic al gioco (`deckApi.hit`).
 */
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
const seenCard = (c: DeckCard) => `<li class="gc" title="${esc(c.name)}">${cardImg(c)}${c.copies > 1 ? `<span class="left">×${c.copies}</span>` : ""}</li>`;

function oppPanel(v: DeckTrackerView, close: string, fine: string) {
  const live = v.live;
  const seen = live?.opponent.seen ?? [];
  const leg = live?.opponent.legendary ?? null;
  return `<div class="lpanel">
    <section class="arm">
      <div class="gc legend">${leg ? cardImg(leg) : `<span class="cardimg back" aria-hidden="true">?</span>`}</div>
      <div class="stats">${stat(lifePips(live ? live.life.opp : null), L.life)}${stat(live?.opponent.deckLeft !== null && live?.opponent.deckLeft !== undefined ? String(live.opponent.deckLeft) : "–", L.oppLeft, L.oppLeftTip)}</div>
    </section>
    <section class="col">
      ${close}
      ${seen.length ? `<ul class="grid">${seen.map(seenCard).join("")}</ul>` : `<p class="muted waiting">${esc(L.oppWaiting)}</p>`}
      ${manaBox(live)}
      ${fine}
    </section>
  </div>`;
}

/** Il logo di OriginsMeta, piccolo, nei template nuovi (il marchio sul tracker è "indispensabile": note del 12/10). */
const miniLogo = `<img class="mini-logo" src="logo-originsmeta-sm.webp" alt="OriginsMeta" width="48" height="15" draggable="false" />`;

/**
 * Le carte del mio mazzo nei template nuovi: la Leggendaria per prima, poi le 12 per costo. `zoom` la fa saltare
 * nel momento in cui la peschi, come nel classico.
 */
function myCards(v: DeckTrackerView, zoom: string) {
  const leg = v.deck?.legendary ?? null;
  const live = Boolean(v.live);
  return `${leg ? myCard(leg, live, ` leg${zoom}`) : `<li class="gc leg">${cardImg(null)}</li>`}${(v.deck?.cards ?? []).map((c) => myCard(c, live)).join("")}`;
}

/** Leggendaria e carte rivelate dell'avversario nei template nuovi (la Leggendaria coperta finché non si vede). */
function oppCards(v: DeckTrackerView) {
  const leg = v.live?.opponent.legendary ?? null;
  return `<li class="gc leg">${leg ? cardImg(leg) : `<span class="cardimg back" aria-hidden="true">?</span>`}</li>${(v.live?.opponent.seen ?? []).map(seenCard).join("")}`;
}

/** "Fasce in alto": una fila sola, il logo piccolo in basso a destra. */
function stripPanel(v: DeckTrackerView, zoom: string, close: string, grip: string, fine: string) {
  const seen = v.live?.opponent.seen.length ?? 0;
  const row =
    view === "opp" ? `${oppCards(v)}${seen ? "" : `<li class="swait">${esc(L.oppWaiting)}</li>`}`
    : v.deck ? myCards(v, zoom)
    : `<li class="swait">${esc(L.choose)}</li>`;
  return `${close}<ul class="srow">${row}</ul><div class="sfoot">${miniLogo}</div>${fine}${grip}`;
}

/** "Colonne ai lati": logo in testa, carte 4 per fila, sotto i numeri (e il mana per l'avversario). */
function columnPanel(v: DeckTrackerView, zoom: string, close: string, grip: string, fine: string) {
  const live = v.live;
  let body: string;
  if (view === "opp") {
    const left = live?.opponent.deckLeft;
    body = `<ul class="cgrid">${oppCards(v)}</ul>${live?.opponent.seen.length ? "" : `<p class="muted cwait">${esc(L.oppWaiting)}</p>`}
      ${stat(left !== null && left !== undefined ? String(left) : "–", L.oppLeft, L.oppLeftTip)}
      ${manaBox(live)}`;
  } else if (v.deck) {
    const total = (v.deck.legendary?.copies ?? 0) + v.deck.cards.reduce((n, c) => n + c.copies, 0);
    body = `<ul class="cgrid">${myCards(v, zoom)}</ul>${deckLeftStat(live?.deckLeft ?? null, total)}`;
  } else body = `<p class="muted pad">${esc(L.choose)}</p>`;
  return `<div class="chead">${miniLogo}${close}</div>${body}${fine}${grip}`;
}

/**
 * Nella finestra il pannello a L ha l'angolo vuoto: lì i clic passano al gioco. Il processo principale ignora il mouse
 * finché il puntatore non è sopra il braccio o la colonna (con `forward` i movimenti arrivano lo stesso).
 */
// tutorial della finestra principale (12/10/2026): il pannello si illumina e dice come si chiama, per farsi trovare
root.dataset.spot = L.spot(view === "opp");
window.deckApi?.onSpot((on) => document.body.classList.toggle("spot", on));

// maniglia del Deck tracker (12/10/2026): la larghezza la cambia il processo principale finché il tasto è premuto
if (window.deckApi && (view === "me" || layout !== "classic")) {
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !(e.target instanceof Element) || e.target.id !== "grip") return;
    e.target.setPointerCapture(e.pointerId);
    window.deckApi?.resize(true);
  });
  const end = () => window.deckApi?.resize(false);
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
}

if (window.deckApi && view === "opp" && layout === "classic") {
  let over = true;
  const set = (on: boolean) => {
    if (on === over) return;
    over = on;
    window.deckApi?.hit(on);
  };
  document.addEventListener("mousemove", (e) => set(e.target instanceof Element && Boolean(e.target.closest(".arm, .col"))));
  document.addEventListener("mouseleave", () => set(false));
  set(false);
  // trascinamento (12/10/2026): lo fa il processo principale, la pagina dice solo quando comincia e quando finisce
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !(e.target instanceof Element) || e.target.closest(".x") || !e.target.closest(".arm, .col")) return;
    e.target.setPointerCapture(e.pointerId);
    window.deckApi?.drag(true);
  });
  const end = () => window.deckApi?.drag(false);
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
}

let drawnKey = "";
/** La Leggendaria era già pescata al giro prima: lo zoom solo nel momento della pesca. */
let legendaryWasOut = false;
function render(v: DeckTrackerView) {
  const key = JSON.stringify({ ...v, updatedAt: null });
  if (key === drawnKey) return;
  drawnKey = key;
  const live = v.live;
  const close = window.deckApi ? `<button type="button" class="x" id="close" title="${esc(L.close)}" aria-label="${esc(L.close)}">×</button>` : "";
  const fine = `${v.scanner ? "" : `<p class="fine">${esc(L.noScanner)}</p>`}${window.deckApi ? "" : `<footer class="brand">${esc(L.brand)}</footer>`}`;
  if (layout !== "classic") {
    const leg = v.deck?.legendary ?? null;
    const legOut = Boolean(live && leg && leg.drawn >= 1);
    const zoom = view === "me" && legOut && !legendaryWasOut ? " just" : "";
    legendaryWasOut = legOut;
    const grip = window.deckApi ? `<span class="grip" id="grip" title="${esc(L.resize)}" aria-hidden="true"></span>` : "";
    // la radice della pagina (#deck, .dt) è il pannello
    root.classList.add("panel-x");
    root.innerHTML = (layout === "strips" ? stripPanel : columnPanel)(v, zoom, close, grip, fine);
    for (const el of root.querySelectorAll<HTMLElement>("[data-w]")) el.style.width = `${Number(el.dataset.w)}%`;
    fit();
    return;
  }
  let body: string;
  if (view === "opp") {
    root.innerHTML = oppPanel(v, close, fine);
    fit();
    return;
  } else if (v.deck) {
    const leg = v.deck.legendary;
    const legOut = Boolean(live && leg && leg.drawn >= 1);
    const zoom = legOut && !legendaryWasOut ? " just" : "";
    legendaryWasOut = legOut;
    body = `<ul class="grid">${v.deck.cards.map((c) => myCard(c, Boolean(live))).join("")}</ul>
      <div class="foot">
        <ul class="legcol">${leg ? myCard(leg, Boolean(live), zoom) : `<li class="gc">${cardImg(null)}</li>`}</ul>
        <div class="stats">${deckLeftStat(live?.deckLeft ?? null, (leg?.copies ?? 0) + v.deck.cards.reduce((n, c) => n + c.copies, 0))}${stat(lifePips(live ? live.life.me : null), L.life)}</div>
      </div>`;
  } else body = `<p class="muted pad">${esc(L.choose)}</p>`;
  // la linguetta stile cartella in alto a sinistra, con il logo e la X per chiudere (12/10/2026, note Granola "pagina
  // winrate": il marchio OriginsMeta sul tracker è "indispensabile"); in OBS senza la X
  const tab = `<div class="tab"><img src="logo-originsmeta-sm.webp" alt="OriginsMeta" width="64" height="20" draggable="false" />${window.deckApi ? `<button type="button" class="tab-x" id="close" title="${esc(L.close)}" aria-label="${esc(L.close)}">×</button>` : ""}</div>`;
  root.classList.add("has-tab");
  // la maniglia per allargare il pannello (le finestre trasparenti non si ridimensionano dai bordi)
  const grip = window.deckApi ? `<span class="grip" id="grip" title="${esc(L.resize)}" aria-hidden="true"></span>` : "";
  root.innerHTML = `${tab}${body}${fine}${grip}`;
  // la larghezza della barra dal JavaScript: la CSP non ammette attributi style nell'HTML
  for (const el of root.querySelectorAll<HTMLElement>("[data-w]")) el.style.width = `${Number(el.dataset.w)}%`;
  fit();
}

if (window.deckApi) {
  window.deckApi.onView(render);
  void window.deckApi.getView().then((v) => v && render(v));
} else {
  const load = async () => {
    try {
      const res = await fetch("deck.json", { cache: "no-store" });
      if (res.ok) render((await res.json()) as DeckTrackerView);
    } catch {
      // app chiusa: resta l'ultimo stato
    }
  };
  void load();
  setInterval(load, 2000);
}
