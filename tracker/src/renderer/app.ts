/**
 * Interfaccia dell'app (senza Node: parla con il processo principale solo attraverso `window.tracker`, dal preload).
 * Lingua dal sistema: italiano, spagnolo, altrimenti inglese (glossario del sito: round/ronda, corsia/carril, carta
 * generata/creada). Nomi delle carte in inglese, come sul sito.
 *
 * Regole del tracker (docs/tracker.md): nessuna parola su bot o persone e nessun rank dell'avversario (i dati non li
 * hanno); dell'avversario si mostrano la Leggendaria e le carte che ha giocato, non il mazzo completo, che il gioco
 * non fa vedere (decisione aperta: il dato resta nello storico sul PC).
 */
import cardsTable from "../cards.json";
import type { AppState, TrackedMatch, TrackerApi } from "../shared/types";

declare global {
  interface Window {
    tracker: TrackerApi & { rendered(): void };
  }
}

type CardRow = { n: string; s: string; m: number | null; t: string; l: 0 | 1; a: 0 | 1 };
const CARDS = cardsTable as Record<string, CardRow>;

type Lang = "en" | "it" | "es";
const lang: Lang = /^it\b/i.test(navigator.language) ? "it" : /^es\b/i.test(navigator.language) ? "es" : "en";
document.documentElement.lang = lang;

const LABELS = {
  en: {
    listening: "Tracking your matches",
    waiting: "Waiting for Origins TCG",
    activeDeck: "Deck selected in the game",
    noDeck: "No deck selected yet",
    today: "Today",
    recorded: "Matches recorded",
    record: "Wins–losses",
    winRate: "Win rate",
    byDeck: "Your decks",
    byDeckSub: "Recorded matches, by the deck you played.",
    deck: "Deck",
    games: "Games",
    vs: "Opponents' Legendaries",
    vsSub: "Results from your side, with the Legendary you had.",
    oppLegendary: "Legendary",
    with: "With",
    matches: "Matches",
    matchesSub: "Newest first. Open a match to see it round by round.",
    noMatches: "No match recorded yet: play one and it shows up here a few seconds after it ends.",
    rounds: (n: number) => `${n} ${n === 1 ? "round" : "rounds"}`,
    plays: (n: number) => `${n} plays`,
    noReplay: "result and deck only",
    round: "Round",
    you: "You",
    opponent: "Opponent",
    created: "created card",
    lane: (n: number) => `lane ${n}`,
    oppPlayed: "Cards the opponent played",
    none: "none",
    code: "Game code",
    copy: "Copy",
    copied: "Copied",
    history: "Results according to the game",
    historySub: (n: number, w: number) => `The game keeps the results of all your matches (${n}, ${w} won). The tracker also recovers the result of matches played while it was off, only win or loss.`,
    missed: (n: number) => `${n} ${n === 1 ? "match" : "matches"} played with the tracker off`,
    startup: "Start with Windows",
    dataFolder: "Open the data folder",
    privacy: "The tracker only reads the files Origins TCG saves on this PC and never touches the game. Your matches stay on this PC.",
    unofficial: "OriginsMeta is an unofficial fan site, not affiliated with Koin Games.",
    win: "win",
    loss: "loss",
    unknown: "?",
    noToday: "no matches yet",
    problems: {
      noGame: "I can't find Origins TCG's files on this PC yet. The tracker starts on its own as soon as the game writes them: open the game and play a match.",
      badReplay: "The replay of the last match can't be read: a patch may have changed its format. The match is saved with its result and deck.",
      error: "Error reading the game's files: trying again shortly.",
    },
  },
  it: {
    listening: "Sto registrando le tue partite",
    waiting: "In attesa di Origins TCG",
    activeDeck: "Mazzo scelto nel gioco",
    noDeck: "Nessun mazzo scelto per ora",
    today: "Oggi",
    recorded: "Partite registrate",
    record: "Vittorie–sconfitte",
    winRate: "Win rate",
    byDeck: "I tuoi mazzi",
    byDeckSub: "Partite registrate, per il mazzo che hai giocato.",
    deck: "Mazzo",
    games: "Partite",
    vs: "Leggendarie avversarie",
    vsSub: "Esito dal tuo lato, con la Leggendaria che avevi tu.",
    oppLegendary: "Leggendaria",
    with: "Con",
    matches: "Partite",
    matchesSub: "Dalla più recente. Apri una partita per vederla round per round.",
    noMatches: "Nessuna partita registrata per ora: giocane una e compare qui pochi secondi dopo la fine.",
    rounds: (n: number) => `${n} round`,
    plays: (n: number) => `${n} giocate`,
    noReplay: "solo esito e mazzo",
    round: "Round",
    you: "Tu",
    opponent: "Avversario",
    created: "carta generata",
    lane: (n: number) => `corsia ${n}`,
    oppPlayed: "Carte giocate dall'avversario",
    none: "nessuna",
    code: "Codice del gioco",
    copy: "Copia",
    copied: "Copiato",
    history: "Esiti secondo il gioco",
    historySub: (n: number, w: number) => `Il gioco conserva gli esiti di tutte le tue partite (${n}, ${w} vinte). Il tracker recupera l'esito anche delle partite giocate mentre era spento, solo vittoria o sconfitta.`,
    missed: (n: number) => `${n} ${n === 1 ? "partita giocata" : "partite giocate"} a tracker spento`,
    startup: "Avvia con Windows",
    dataFolder: "Apri la cartella dei dati",
    privacy: "Il tracker legge solo i file che Origins TCG salva su questo PC e non tocca mai il gioco. Le tue partite restano su questo PC.",
    unofficial: "OriginsMeta è un sito fan non ufficiale, non affiliato a Koin Games.",
    win: "vittoria",
    loss: "sconfitta",
    unknown: "?",
    noToday: "nessuna partita",
    problems: {
      noGame: "Non trovo ancora i file di Origins TCG su questo PC. Il tracker parte da solo appena il gioco li scrive: apri il gioco e gioca una partita.",
      badReplay: "Il replay dell'ultima partita non si legge: forse una patch ne ha cambiato il formato. La partita è salvata con esito e mazzo.",
      error: "Errore nella lettura dei file del gioco: riprovo fra poco.",
    },
  },
  es: {
    listening: "Registrando tus partidas",
    waiting: "Esperando a Origins TCG",
    activeDeck: "Mazo elegido en el juego",
    noDeck: "Todavía no has elegido mazo",
    today: "Hoy",
    recorded: "Partidas registradas",
    record: "Victorias–derrotas",
    winRate: "Win rate",
    byDeck: "Tus mazos",
    byDeckSub: "Partidas registradas, según el mazo que jugaste.",
    deck: "Mazo",
    games: "Partidas",
    vs: "Legendarias rivales",
    vsSub: "Resultado desde tu lado, con la Legendaria que llevabas.",
    oppLegendary: "Legendaria",
    with: "Con",
    matches: "Partidas",
    matchesSub: "De la más reciente. Abre una partida para verla ronda a ronda.",
    noMatches: "Todavía no hay partidas registradas: juega una y aparecerá aquí unos segundos después del final.",
    rounds: (n: number) => `${n} ${n === 1 ? "ronda" : "rondas"}`,
    plays: (n: number) => `${n} jugadas`,
    noReplay: "solo resultado y mazo",
    round: "Ronda",
    you: "Tú",
    opponent: "Rival",
    created: "carta creada",
    lane: (n: number) => `carril ${n}`,
    oppPlayed: "Cartas que jugó el rival",
    none: "ninguna",
    code: "Código del juego",
    copy: "Copiar",
    copied: "Copiado",
    history: "Resultados según el juego",
    historySub: (n: number, w: number) => `El juego guarda los resultados de todas tus partidas (${n}, ${w} ganadas). El tracker también recupera el resultado de las partidas jugadas con él apagado, solo victoria o derrota.`,
    missed: (n: number) => `${n} ${n === 1 ? "partida jugada" : "partidas jugadas"} con el tracker apagado`,
    startup: "Iniciar con Windows",
    dataFolder: "Abrir la carpeta de datos",
    privacy: "El tracker solo lee los archivos que Origins TCG guarda en este PC y nunca toca el juego. Tus partidas se quedan en este PC.",
    unofficial: "OriginsMeta es un sitio fan no oficial, sin afiliación con Koin Games.",
    win: "victoria",
    loss: "derrota",
    unknown: "?",
    noToday: "ninguna partida",
    problems: {
      noGame: "Todavía no encuentro los archivos de Origins TCG en este PC. El tracker empieza solo en cuanto el juego los escribe: abre el juego y juega una partida.",
      badReplay: "No se puede leer la repetición de la última partida: quizá un parche cambió su formato. La partida se guarda con su resultado y su mazo.",
      error: "Error al leer los archivos del juego: vuelvo a intentarlo en un momento.",
    },
  },
} as const;
const L = LABELS[lang];

/* ---------- aiuti ---------- */

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const card = (key: string | null) => (key ? CARDS[key] : undefined);
const pct = (w: number, n: number) => (n ? Math.round((100 * w) / n) : 0);
const star = (key: string | null) => (card(key)?.l ? '<span class="star" aria-hidden="true">★</span>' : "");
const gem = (key: string | null) => `<span class="gem">${card(key)?.m ?? "?"}</span>`;
const cardName = (key: string | null) => {
  if (!key) return `<span class="gen">${esc(L.created)}</span>`;
  const c = card(key);
  if (!c) return esc(key);
  // un link vero (va a capo con il testo); il clic lo apre nel browser predefinito attraverso il processo principale
  return c.a ? `<a href="https://originsmeta.com/${lang}/cards/${esc(c.s)}" data-link>${esc(c.n)}</a>` : esc(c.n);
};
const resChip = (r: TrackedMatch["result"]) => (r === "W" ? `<span class="res W" title="${esc(L.win)}">${lang === "en" ? "W" : "V"}</span>` : r === "L" ? `<span class="res L" title="${esc(L.loss)}">${lang === "en" ? "L" : lang === "it" ? "S" : "D"}</span>` : `<span class="res X">${L.unknown}</span>`);
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(lang === "en" ? "en-GB" : lang, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
const deckLabel = (m: TrackedMatch) => m.deck.name ?? card(m.deck.legendary)?.n ?? "?";

function groupBy<T>(list: T[], keyOf: (x: T) => string) {
  const map = new Map<string, T[]>();
  for (const x of list) map.set(keyOf(x), [...(map.get(keyOf(x)) ?? []), x]);
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}
const wl = (list: TrackedMatch[]) => {
  const w = list.filter((m) => m.result === "W").length;
  const l = list.filter((m) => m.result === "L").length;
  return { w, l, n: list.length };
};

/* ---------- parti della pagina ---------- */

function top(s: AppState) {
  const ok = s.status.cache;
  return `<header class="top">
      <div class="brand"><img src="../icon.ico" alt="" /><h1>OriginsMeta <span>Tracker</span></h1></div>
      <span class="pill ${ok ? "ok" : "wait"}">${esc(ok ? L.listening : L.waiting)}</span>
    </header>
    ${s.status.problem ? `<p class="problem">${esc(L.problems[s.status.problem])}</p>` : ""}`;
}

function now(s: AppState) {
  const all = wl(s.matches);
  const today = new Date().toDateString();
  const t = wl(s.matches.filter((m) => m.endedAt && new Date(m.endedAt).toDateString() === today));
  const d = s.activeDeck;
  const deck = d ? `${star(d.legendary)}${esc(d.name ?? card(d.legendary)?.n ?? "?")}` : esc(L.noDeck);
  return `<section class="now" aria-label="${esc(L.today)}">
      <div class="tile"><span class="v text">${deck}</span><span class="l">${esc(L.activeDeck)}${d?.legendary ? ` · ${esc(card(d.legendary)?.n ?? "")}` : ""}</span></div>
      <div class="tile"><span class="v">${t.n ? `${t.w}–${t.l}` : "—"}</span><span class="l">${esc(L.today)}${t.n ? "" : ` · ${esc(L.noToday)}`}</span></div>
      <div class="tile"><span class="v">${all.n}</span><span class="l">${esc(L.recorded)} · ${all.w}–${all.l}</span></div>
      <div class="tile"><span class="v">${all.n ? `${pct(all.w, all.n)}%` : "—"}</span><span class="l">${esc(L.winRate)}</span></div>
    </section>`;
}

function decks(s: AppState) {
  const rows = groupBy(s.matches, deckLabel).map(([name, list]) => {
    const r = wl(list);
    const legendary = list[0].deck.legendary;
    const rate = pct(r.w, r.n);
    return `<tr><td><span class="name">${star(legendary)}${esc(name)}</span></td><td class="num">${r.n} · ${r.w}–${r.l}</td><td><span class="bar"><i style="width:${Math.max(rate, 2)}px"></i><b>${rate}%</b></span></td></tr>`;
  });
  return `<section class="panel"><h2>${esc(L.byDeck)}</h2><p class="sub">${esc(L.byDeckSub)}</p>
      ${rows.length ? `<div class="scroll"><table><thead><tr><th>${esc(L.deck)}</th><th class="num">${esc(L.games)}</th><th>${esc(L.winRate)}</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>` : `<p class="empty">—</p>`}
    </section>`;
}

function opponents(s: AppState) {
  const withOpp = s.matches.filter((m) => m.opponent?.legendary);
  const rows = groupBy(withOpp, (m) => m.opponent!.legendary!).map(([key, list]) => {
    const r = wl(list);
    const mine = groupBy(list, (m) => m.deck.legendary ?? "?").map(([k, sub]) => {
      const x = wl(sub);
      return `${esc(card(k)?.n ?? k)} ${x.w}–${x.l}`;
    });
    return `<tr><td><span class="name">${star(key)}${cardName(key)}</span></td><td class="num">${r.w}–${r.l}</td><td class="sub">${mine.join("<br>")}</td></tr>`;
  });
  return `<section class="panel"><h2>${esc(L.vs)}</h2><p class="sub">${esc(L.vsSub)}</p>
      ${rows.length ? `<div class="scroll"><table><thead><tr><th>${esc(L.oppLegendary)}</th><th class="num">${lang === "en" ? "W–L" : lang === "it" ? "V–S" : "V–D"}</th><th>${esc(L.with)}</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>` : `<p class="empty">—</p>`}
    </section>`;
}

const openMatches = new Set<string>();
// la partita più recente è aperta finché il giocatore non apre o chiude qualcosa da sé
let userToggled = false;

function matchRow(m: TrackedMatch, index: number) {
  const rounds = m.turns ?? 0;
  const cell = (t: number, me: boolean) => {
    const ps = m.plays.filter((p) => p.turn === t && p.me === me);
    if (!ps.length) return `<td class="none"></td>`;
    return `<td class="${me ? "me" : "opp"}">${ps.map((p) => `<span class="play">${gem(p.card)}${star(p.card)}${cardName(p.card)}${p.lane === null ? "" : `<span class="lane-tag">${esc(L.lane(p.lane + 1))}</span>`}</span>`).join("")}</td>`;
  };
  const oppPlayed = [...new Set(m.plays.filter((p) => !p.me && p.card).map((p) => p.card as string))];
  const nums = Array.from({ length: rounds }, (_, i) => i + 1);
  const opp = m.opponent?.legendary ?? null;
  const open = openMatches.has(m.id) || (!userToggled && index === 0);
  return `<details class="match" data-id="${esc(m.id)}"${open ? " open" : ""}>
      <summary><span class="m-when">${esc(when(m.endedAt))}</span><span class="m-title">${resChip(m.result)} ${star(m.deck.legendary)}${esc(deckLabel(m))}${opp ? `<span class="vs">vs</span>${star(opp)}${esc(card(opp)?.n ?? opp)}` : ""}</span><span class="m-meta">${m.turns ? `${esc(L.rounds(m.turns))} · ${esc(L.plays(m.plays.length))}` : esc(L.noReplay)}</span></summary>
      <div class="m-body">
        ${rounds ? `<div class="scroll"><table class="timeline"><thead><tr><th class="who">${esc(L.round)}</th>${nums.map((t) => `<th>${t}</th>`).join("")}</tr></thead><tbody><tr><th class="who">${esc(L.you)}</th>${nums.map((t) => cell(t, true)).join("")}</tr><tr><th class="who">${esc(L.opponent)}</th>${nums.map((t) => cell(t, false)).join("")}</tr></tbody></table></div>` : ""}
        ${m.opponent ? `<div><p class="sub">${esc(L.oppPlayed)}</p><div class="chips">${oppPlayed.length ? oppPlayed.map((k) => `<span class="chip">${gem(k)}${star(k)}${esc(card(k)?.n ?? k)}</span>`).join("") : `<span class="sub">${esc(L.none)}</span>`}</div></div>` : ""}
        ${m.deck.code ? `<div class="row"><span class="sub">${esc(L.code)}</span><code class="code">${esc(m.deck.code)}</code><button type="button" class="btn" data-copy="${esc(m.deck.code)}">${esc(L.copy)}</button></div>` : ""}
      </div>
    </details>`;
}

function matches(s: AppState) {
  return `<section class="panel"><h2>${esc(L.matches)}</h2><p class="sub">${esc(L.matchesSub)}</p>
      ${s.matches.length ? `<div class="matches">${s.matches.map(matchRow).join("")}</div>` : `<p class="empty">${esc(L.noMatches)}</p>`}
    </section>`;
}

function history(s: AppState) {
  if (!s.history) return "";
  const chronological = [...s.history].reverse();
  const w = chronological.filter((r) => r === "W").length;
  const missed = s.missed.length;
  return `<section class="panel"><h2>${esc(L.history)}</h2><p class="sub">${esc(L.historySub(chronological.length, w))}</p>
      <div class="strip">${chronological.map((r) => resChip(r === "W" || r === "L" ? r : null)).join("")}</div>
      ${missed ? `<p class="sub">${esc(L.missed(missed))}</p>` : ""}
    </section>`;
}

function footer(s: AppState) {
  return `<footer class="foot">
      <div class="row"><label class="switch"><input type="checkbox" id="startup"${s.openAtLogin ? " checked" : ""} /> ${esc(L.startup)}</label><button type="button" class="btn" id="folder">${esc(L.dataFolder)}</button></div>
      <p class="fine">${esc(L.privacy)}</p>
      <p class="fine">${esc(L.unofficial)} · v${esc(s.version)}</p>
    </footer>`;
}

/* ---------- disegno ed eventi ---------- */

const root = document.getElementById("app")!;
let first = true;

function render(s: AppState) {
  const scroll = window.scrollY;
  root.innerHTML = [top(s), now(s), `<div class="cols">${decks(s)}${opponents(s)}</div>`, matches(s), history(s), footer(s)].join("");
  window.scrollTo(0, scroll);
  if (first) {
    first = false;
    window.tracker.rendered();
  }
}

root.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest<HTMLAnchorElement>("a[data-link]");
  if (link) {
    e.preventDefault();
    return void window.tracker.openLink(link.href);
  }
  const copy = target.closest<HTMLButtonElement>("[data-copy]");
  if (copy) {
    try {
      await navigator.clipboard.writeText(copy.dataset.copy!);
      copy.textContent = L.copied;
    } catch {
      const code = copy.parentElement?.querySelector("code");
      if (code) getSelection()?.selectAllChildren(code);
    }
    setTimeout(() => (copy.textContent = L.copy), 1500);
    return;
  }
  if (target.id === "folder") void window.tracker.openDataFolder();
});
root.addEventListener("change", async (e) => {
  const t = e.target as HTMLInputElement;
  if (t.id === "startup") t.checked = await window.tracker.setOpenAtLogin(t.checked);
});
// clic sul riepilogo di una partita: la scelta del giocatore vale anche dopo i ridisegni
root.addEventListener("click", (e) => {
  const summary = (e.target as HTMLElement).closest("summary");
  const d = summary?.parentElement as HTMLDetailsElement | null;
  if (!d?.dataset.id) return;
  userToggled = true;
  if (d.open) openMatches.delete(d.dataset.id); // sta per chiudersi
  else openMatches.add(d.dataset.id);
});

window.tracker.onState(render);
void window.tracker.getState().then((s) => s && render(s));
