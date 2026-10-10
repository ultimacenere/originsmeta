/**
 * Il pannello del mazzo, "Deck tracker" (10/10/2026; dati da main/deckTracker.ts): la stessa pagina nella finestra
 * accanto al gioco (dati dal suo preload, `window.deckApi`) e nella sorgente per OBS (/overlay/deck, dati da
 * `deck.json` ogni 2 secondi). Parametro dell'indirizzo per OBS: `lang` (en, it, es).
 *
 * In alto la Leggendaria intera con il nome del mazzo e il record, poi le 12 carte per costo con le copie (le giocate in
 * questa partita si spengono), poi l'avversario: Leggendaria e carte rivelate. Le carte sono sempre intere (immagini di
 * originsmeta.com, mai ritagliate: i crediti restano). Sempre "non affiliato a Koin Games".
 */
import type { DeckApi, DeckCard, DeckTrackerView } from "../shared/types";

declare global {
  interface Window {
    deckApi?: DeckApi;
  }
}

type Lang = "en" | "it" | "es";
const asked = new URLSearchParams(location.search).get("lang");
const lang: Lang = asked === "en" || asked === "it" || asked === "es" ? asked : /^it\b/i.test(navigator.language) ? "it" : /^es\b/i.test(navigator.language) ? "es" : "en";
document.documentElement.lang = lang;
document.body.classList.add(window.deckApi ? "in-window" : "in-obs");

const LABELS = {
  en: {
    title: "Deck tracker",
    choose: "Choose a deck in the game",
    record: "This deck",
    round: (n: number) => `Round ${n}`,
    waiting: "Waiting for a match",
    finished: "Last match",
    opponent: "Opponent",
    seen: "Cards revealed",
    none: "None yet",
    played: (p: number, c: number) => `${p} of ${c} played`,
    legendaryPlayed: "played",
    noScanner: "Live updates need the screen scanner (staff test).",
    brand: "Analytics · not affiliated with Koin Games",
  },
  it: {
    title: "Deck tracker",
    choose: "Scegli un mazzo nel gioco",
    record: "Questo mazzo",
    round: (n: number) => `Round ${n}`,
    waiting: "In attesa di una partita",
    finished: "Ultima partita",
    opponent: "Avversario",
    seen: "Carte rivelate",
    none: "Ancora nessuna",
    played: (p: number, c: number) => `${p} giocate su ${c}`,
    legendaryPlayed: "giocata",
    noScanner: "Gli aggiornamenti dal vivo vogliono lo scanner dello schermo (in prova con lo staff).",
    brand: "Analytics · non affiliato a Koin Games",
  },
  es: {
    title: "Deck tracker",
    choose: "Elige un mazo en el juego",
    record: "Este mazo",
    round: (n: number) => `Ronda ${n}`,
    waiting: "Esperando una partida",
    finished: "Última partida",
    opponent: "Rival",
    seen: "Cartas reveladas",
    none: "Ninguna todavía",
    played: (p: number, c: number) => `${p} jugadas de ${c}`,
    legendaryPlayed: "jugada",
    noScanner: "Las actualizaciones en vivo necesitan el escáner de pantalla (en prueba con el staff).",
    brand: "Analytics · sin afiliación con Koin Games",
  },
} as const;
const L = LABELS[lang];

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const pct = (w: number, n: number) => (n ? `${Math.round((100 * w) / n)}%` : "—");

/** Una carta intera con l'immagine del sito (senza rete resta la cornice). */
const cardImg = (c: DeckCard | null, cls = "") =>
  c?.slug
    ? `<span class="cardimg${c.legendary ? " is-legendary" : ""} ${cls}"><img src="https://originsmeta.com/cards/${esc(c.slug)}.webp" alt="" draggable="false" /></span>`
    : `<span class="cardimg empty ${cls}" aria-hidden="true"></span>`;

/** Una riga del mazzo: miniatura, costo, nome, copie (pallini: pieni = ancora da giocare). */
function row(c: DeckCard, live: boolean) {
  const left = c.copies - c.played;
  const dots = Array.from({ length: c.copies }, (_, i) => `<i class="${i < left ? "on" : ""}"></i>`).join("");
  return `<li class="card${live && left === 0 ? " done" : ""}${c.spell ? " spell" : ""}" title="${esc(L.played(c.played, c.copies))}">
      ${cardImg(c, "mini")}
      <span class="mana">${c.mana ?? "–"}</span>
      <span class="name">${c.legendary ? `<span class="star" aria-hidden="true">★</span>` : ""}${esc(c.name)}</span>
      <span class="dots" aria-label="${esc(L.played(c.played, c.copies))}">${dots}</span>
    </li>`;
}

const root = document.getElementById("deck")!;
root.addEventListener(
  "error",
  (e) => {
    if (e.target instanceof HTMLImageElement) e.target.closest(".cardimg")?.classList.add("noimg");
  },
  true,
);

let drawn = "";
function render(v: DeckTrackerView) {
  const key = JSON.stringify({ ...v, updatedAt: null });
  if (key === drawn) return;
  drawn = key;
  const live = v.live;
  const inMatch = Boolean(live?.inMatch);
  const status = !v.scanner ? "" : live ? (inMatch && live.round ? L.round(live.round) : L.finished) : L.waiting;
  const head = v.deck
    ? `<div class="hero">
        ${cardImg(v.deck.legendary, live && v.deck.legendary?.played ? "big done" : "big")}
        <div class="meta">
          <div class="dname">${esc(v.deck.name ?? v.deck.legendary?.name ?? "?")}</div>
          ${v.deck.legendary && v.deck.name ? `<div class="leg"><span class="star" aria-hidden="true">★</span>${esc(v.deck.legendary.name)}</div>` : ""}
          ${live && v.deck.legendary?.played ? `<div><span class="tag">${esc(L.legendaryPlayed)}</span></div>` : ""}
          ${v.record ? `<div class="rec"><span class="k">${esc(L.record)}</span><span class="v">${v.record.wins}–${v.record.losses}</span><span class="pct">${pct(v.record.wins, v.record.games)}</span></div>` : ""}
          ${status ? `<div class="status${inMatch ? " is-live" : ""}">${inMatch ? `<span class="dot" aria-hidden="true"></span>` : ""}${esc(status)}</div>` : ""}
        </div>
      </div>
      <ul class="list">${v.deck.cards.map((c) => row(c, Boolean(live))).join("")}</ul>`
    : `<p class="muted pad">${esc(L.choose)}</p>`;
  const opp = live
    ? `<section class="opp">
        <h2>${esc(L.opponent)}</h2>
        ${live.opponent.legendary ? `<div class="hero small">${cardImg(live.opponent.legendary, "mid")}<div class="meta"><div class="leg"><span class="star" aria-hidden="true">★</span>${esc(live.opponent.legendary.name)}</div></div></div>` : ""}
        <h3>${esc(L.seen)}</h3>
        ${live.opponent.seen.length ? `<ul class="list">${live.opponent.seen.map((c) => row({ ...c, played: 0 }, false)).join("")}</ul>` : `<p class="muted">${esc(L.none)}</p>`}
      </section>`
    : "";
  root.innerHTML = `
    <header class="top"><img src="logo-originsmeta-sm.webp" alt="OriginsMeta" draggable="false" /><span>${esc(L.title)}</span></header>
    ${head}
    ${opp}
    ${v.scanner ? "" : `<p class="fine">${esc(L.noScanner)}</p>`}
    <footer class="brand">${esc(L.brand)}</footer>`;
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
