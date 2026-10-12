/**
 * I numeri derivati della pagina /analytics, design "Meta Snapshot v2.0" (12/10/2026, scelto da Pierluigi; specifica in
 * design/win-rate/01-meta-snapshot/README.md). Funzioni pure, senza import del sito (solo tipi): le prova
 * `node --test src/lib/tracker/snapshot.test.ts`.
 *
 * Il modo di leggere i numeri è uno solo in tutta la pagina: win rate, freccia sul 50% (punti di differenza), forbice
 * dell'intervallo di Wilson al 95% e partite accanto. Ciò che è "più forte" o in classifica si ordina per **win rate
 * prudente**, il bordo basso dell'intervallo: 57% su 54 partite non scavalca 58% su 214.
 *
 * Regole di Pierluigi (12/10/2026) che valgono anche qui: mai il numero di giocatori (le funzioni non lo ricevono), nessuna
 * etichetta "prime stime" e nessun testo su soglie. `THIN_GAMES` è solo un segnale visivo (il tratteggio dei quadrati
 * degli scontri) e la preferenza per lo "scontro più sbilanciato": non nasconde nessun numero.
 */
import type { Locale } from "../i18n";

/** Sotto queste partite il quadrato di uno scontro è tratteggiato (solo un segnale visivo). */
export const THIN_GAMES = 20;
const Z95 = 1.96;

export type Count = { games: number; wins: number };
export type Rated = Count & { r: number; lo: number; hi: number };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Intervallo di Wilson al 95% di `wins` su `games` (fra 0 e 1); senza partite tutto l'intervallo. */
export function wilson(wins: number, games: number, z = Z95): [number, number] {
  if (games <= 0) return [0, 1];
  const p = wins / games;
  const z2 = z * z;
  const d = 1 + z2 / games;
  const c = (p + z2 / (2 * games)) / d;
  const m = (z * Math.sqrt((p * (1 - p)) / games + z2 / (4 * games * games))) / d;
  return [Math.max(0, c - m), Math.min(1, c + m)];
}

/** Aggiunge win rate (`r`) e intervallo (`lo`, `hi`) a un conteggio. Senza partite r = 0,5. */
export function rated<T extends Count>(s: T): T & Rated {
  const [lo, hi] = wilson(s.wins, s.games);
  return { ...s, r: s.games > 0 ? s.wins / s.games : 0.5, lo, hi };
}

/** Ordine per win rate prudente (il bordo basso), poi per partite, poi per win rate. */
export const byPrudent = (a: Rated, b: Rated) => b.lo - a.lo || b.games - a.games || b.r - a.r;

/** Punti di differenza dal 50%, a un decimale (57,14% → 7,1). */
export const deltaPoints = (r: number) => Math.round((r - 0.5) * 1000) / 10;
export type Dir = "up" | "down" | "even";
/** Sopra, sotto o esattamente al 50% (dopo l'arrotondamento a un decimale, così freccia e numero dicono la stessa cosa). */
export function dirOf(r: number): Dir {
  const d = deltaPoints(r);
  return d > 0 ? "up" : d < 0 ? "down" : "even";
}

/**
 * Fasce del tabellone, dalla forbice: sopra il 50% anche nel caso peggiore, in vantaggio (sopra il 50% ma la forbice
 * lo tocca), in equilibrio (esattamente al 50%), in svantaggio, sotto il 50% anche nel caso migliore.
 */
export type Band = "up-sure" | "up" | "even" | "down" | "down-sure";
export const BANDS: readonly Band[] = ["up-sure", "up", "even", "down", "down-sure"];
export function band(s: Rated): Band {
  if (s.lo > 0.5) return "up-sure";
  if (s.hi < 0.5) return "down-sure";
  const d = dirOf(s.r);
  return d === "even" ? "even" : d;
}

/** Il giudizio di uno scontro, per il pannello: netto (forbice tutta da una parte), da confermare, in equilibrio. */
export type Verdict = "upSure" | "downSure" | "up" | "down" | "even";
export function verdictOf(s: Rated): Verdict {
  if (s.lo > 0.5) return "upSure";
  if (s.hi < 0.5) return "downSure";
  if (s.r >= 0.55) return "up";
  if (s.r <= 0.45) return "down";
  return "even";
}
/** "netto" quando la forbice sta tutta da una parte del 50%. */
export const isSure = (s: Rated) => s.lo > 0.5 || s.hi < 0.5;

/* ---------- assi ---------- */

export type Axis = { min: number; max: number };
/** La scala più stretta, centrata sul 50%, che contiene tutti i valori: 25–75%, poi 10–90%, poi 0–100%. */
export function axisFor(values: readonly number[], candidates: readonly Axis[] = [{ min: 0.25, max: 0.75 }, { min: 0.1, max: 0.9 }, { min: 0, max: 1 }]): Axis {
  return candidates.find((a) => values.every((v) => v >= a.min - 1e-9 && v <= a.max + 1e-9)) ?? { min: 0, max: 1 };
}
/** Posizione (0–100) di un valore sulla scala. */
export const pos = (v: number, axis: Axis) => clamp(((v - axis.min) / (axis.max - axis.min)) * 100, 0, 100);
/** Le tacche di una scala: 10 punti, 20 sopra la scala più larga. */
export function ticks(axis: Axis): number[] {
  const step = axis.max - axis.min > 0.6 ? 0.25 : axis.max - axis.min > 0.3 ? 0.1 : 0.05;
  const out: number[] = [];
  for (let v = 0.5; v >= axis.min - 1e-9; v -= step) out.unshift(Math.round(v * 100) / 100);
  for (let v = 0.5 + step; v <= axis.max + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

/* ---------- scontri ---------- */

export type Matchup = Count & { legendary: string; opponent: string };
export type RatedMatchup = Matchup & Rated;

/**
 * Lo scontro più sbilanciato: fra quelli con almeno `THIN_GAMES` partite se ce ne sono, il più lontano dal 50%, poi il
 * più giocato. Mai uno specchio né uno scontro senza partite; null se non ce n'è nessuno.
 */
export function notableMatchup<T extends RatedMatchup>(list: readonly T[]): T | null {
  const ok = list.filter((m) => m.legendary !== m.opponent && m.games > 0);
  ok.sort(
    (x, y) =>
      Number(y.games >= THIN_GAMES) - Number(x.games >= THIN_GAMES) ||
      Math.abs(y.r - 0.5) - Math.abs(x.r - 0.5) ||
      y.games - x.games ||
      (x.legendary + x.opponent).localeCompare(y.legendary + y.opponent),
  );
  return ok[0] ?? null;
}

/**
 * Le Leggendarie della tabella degli scontri: solo quelle che compaiono in uno scontro con partite (da una parte o
 * dall'altra), le più giocate prima (partite della Leggendaria, poi partite negli scontri).
 */
export function matchupOrder(matchups: readonly Matchup[], legendaryGames: ReadonlyMap<string, number>): string[] {
  const inMu = new Map<string, number>();
  for (const m of matchups) {
    if (m.games <= 0) continue;
    inMu.set(m.legendary, (inMu.get(m.legendary) ?? 0) + m.games);
    inMu.set(m.opponent, (inMu.get(m.opponent) ?? 0) + m.games);
  }
  return [...inMu.keys()].sort((a, b) => (legendaryGames.get(b) ?? 0) - (legendaryGames.get(a) ?? 0) || (inMu.get(b) ?? 0) - (inMu.get(a) ?? 0) || a.localeCompare(b));
}

export type CellKind = "mirror" | "none" | "thin" | "ok";
export type GridCell = Rated & { a: string; b: string; kind: CellKind };

/** La tabella completa (righe = la Leggendaria di chi registra, colonne = quella dall'altra parte), con le celle vuote. */
export function matchupGrid(matchups: readonly Matchup[], order: readonly string[]): GridCell[][] {
  const byPair = new Map(matchups.map((m) => [`${m.legendary}|${m.opponent}`, m]));
  return order.map((a) =>
    order.map((b) => {
      const m = byPair.get(`${a}|${b}`);
      const c = rated({ games: m?.games ?? 0, wins: m?.wins ?? 0 });
      const kind: CellKind = a === b ? "mirror" : c.games === 0 ? "none" : c.games < THIN_GAMES ? "thin" : "ok";
      return { ...c, a, b, kind };
    }),
  );
}

/**
 * "Vince contro / Soffre contro" di una riga della tabella: le avversarie sopra il 50% per bordo basso decrescente,
 * quelle sotto per bordo alto crescente (la forbice, non la percentuale nuda), al massimo `max` per parte.
 */
export function vsLists(row: readonly GridCell[], max = 3): { best: GridCell[]; worst: GridCell[] } {
  const real = row.filter((c) => c.kind === "ok" || c.kind === "thin");
  const best = real.filter((c) => c.r > 0.5).sort((x, y) => y.lo - x.lo || y.r - x.r || y.games - x.games).slice(0, max);
  const worst = real.filter((c) => c.r < 0.5).sort((x, y) => x.hi - y.hi || x.r - y.r || y.games - x.games).slice(0, max);
  return { best, worst };
}

/** Intensità del colore di un quadrato (0,1–0,62), più tenue sotto `THIN_GAMES`; 0 per specchi e celle vuote. */
export function tintAlpha(c: GridCell): number {
  if (c.kind === "mirror" || c.kind === "none") return 0;
  const a = Math.min(0.62, Math.abs(c.r - 0.5) * 3.6 + 0.1) * (c.kind === "thin" ? 0.65 : 1);
  return Math.round(a * 100) / 100;
}

/* ---------- nomi corti e sigle (tabella degli scontri) ---------- */

const NUMBER_WORDS = new Set(["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]);
/**
 * Nome corto per le colonne della tabella: intero fino a 12 caratteri, altrimenti la prima parola; l'ultima se la prima
 * è corta o un numero ("Three Not So Little Pigs" → "Pigs").
 */
export function shortName(name: string): string {
  if (name.length <= 12) return name;
  const words = name.split(/\s+/);
  return words[0].length > 3 && !NUMBER_WORDS.has(words[0].toLowerCase()) ? words[0] : words[words.length - 1];
}

/** Sigle di tre lettere, tutte diverse (MER, DRA, QUE…): prima parola, poi ultima parola, poi iniziali, poi un numero. */
export function legendaryCodes(names: readonly string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    const words = name.toUpperCase().replace(/[^A-Z ]/g, "").split(/\s+/).filter(Boolean);
    const joined = words.join("");
    const first = (words[0] ?? "").slice(0, 3);
    const last = (words[words.length - 1] ?? "").slice(0, 3);
    const cands = [
      ...(NUMBER_WORDS.has((words[0] ?? "").toLowerCase()) ? [last, first] : [first, last]),
      words.length >= 3 ? words.slice(0, 3).map((w) => w[0]).join("") : "",
      joined.slice(0, 2) + (joined[joined.length - 1] ?? ""),
    ].filter((c) => c.length === 3);
    let code = cands.find((c) => !used.has(c));
    for (let i = 2; !code; i++) {
      const next = `${joined.slice(0, 2).padEnd(2, "X")}${i}`;
      if (!used.has(next)) code = next;
    }
    used.add(code);
    return code;
  });
}

/* ---------- carte ---------- */

export type CardRow = { card: string; deck: Rated | null; played: (Rated & { avgTurn: number | null }) | null };

/**
 * Le tre carte in evidenza, tutte diverse: la più presente nei mazzi, quella che vince di più quando giocata (per win
 * rate prudente) e quella che cambia di più la partita (giocata meno nel mazzo, solo con almeno `THIN_GAMES` partite
 * per parte: sotto, la differenza è rumore). Ognuna può mancare.
 */
export function cardHighlights<T extends CardRow>(cards: readonly T[]): { most: T | null; win: T | null; swing: T | null } {
  const used = new Set<string>();
  const take = (list: T[]) => {
    const c = list.find((x) => !used.has(x.card)) ?? null;
    if (c) used.add(c.card);
    return c;
  };
  const most = take(cards.filter((c) => c.deck && c.deck.games > 0).sort((a, b) => b.deck!.games - a.deck!.games || a.card.localeCompare(b.card)));
  const win = take(cards.filter((c) => c.played && c.played.games > 0).sort((a, b) => byPrudent(a.played!, b.played!) || a.card.localeCompare(b.card)));
  const swing = take(
    cards
      .filter((c) => c.deck && c.played && c.deck.games >= THIN_GAMES && c.played.games >= THIN_GAMES && c.played.r - c.deck.r > 0)
      .sort((a, b) => b.played!.r - b.deck!.r - (a.played!.r - a.deck!.r) || a.card.localeCompare(b.card)),
  );
  return { most, win, swing };
}

/* ---------- storie della patch ---------- */

/**
 * "Da tenere d'occhio": la Leggendaria con il win rate più alto fra quelle sopra il 50% che vincono più della più
 * solida ma stanno dietro nel win rate prudente (campione più piccolo). Null se non c'è.
 */
export function watchLegendary<T extends Rated & { legendary: string }>(sorted: readonly T[]): T | null {
  const top = sorted[0];
  if (!top) return null;
  return sorted.filter((s) => s !== top && s.r > 0.5 && s.r > top.r).sort((a, b) => b.r - a.r || b.games - a.games)[0] ?? null;
}

/* ---------- mappa del meta ---------- */

export type MapPoint = { key: string; label: string; share: number; r: number };
export type MapLayout = {
  W: number;
  H: number;
  box: { l: number; t: number; w: number; h: number };
  xTicks: { x: number; v: number }[];
  yTicks: { y: number; v: number }[];
  /** riga del 50% e linea della quota "giusta" (1 / numero di Leggendarie) */
  midY: number;
  avgX: number;
  dots: { key: string; x: number; y: number; dir: Dir }[];
  labels: { key: string; x: number; y: number; anchor: "start" | "middle" | "end"; text: string }[];
  quadrants: { x: number; y: number; anchor: "start" | "end"; good: boolean; text: string }[];
};

/**
 * La mappa del meta (quota di gioco in orizzontale, win rate in verticale), disegnata su una larghezza fissa: la pagina
 * ne mette due, stretta e larga, e il CSS mostra quella giusta. Le etichette si spostano finché non toccano punti,
 * altre etichette o i nomi dei quadranti (stima della larghezza: 6,3 px a carattere).
 */
export function metaMapLayout(points: readonly MapPoint[], opts: { W: number; narrow: boolean; quadrants: readonly [string, string, string, string] }): MapLayout {
  const { W, narrow } = opts;
  const H = narrow ? 330 : 360;
  const m = { t: 18, r: narrow ? 12 : 24, b: 40, l: 40 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const maxShare = Math.max(0.05, (Math.ceil((Math.max(0, ...points.map((p) => p.share)) * 100 + 2) / 5) * 5) / 100);
  const axisY = axisFor(points.map((p) => p.r), [{ min: 0.35, max: 0.65 }, { min: 0.2, max: 0.8 }, { min: 0, max: 1 }]);
  const stepY = axisY.max - axisY.min > 0.6 ? 0.25 : axisY.max - axisY.min > 0.4 ? 0.1 : 0.05;
  const X = (v: number) => m.l + (v / maxShare) * iw;
  const Y = (v: number) => m.t + (1 - (clamp(v, axisY.min, axisY.max) - axisY.min) / (axisY.max - axisY.min)) * ih;
  const avg = points.length ? 1 / points.length : 0;
  const yTicks: MapLayout["yTicks"] = [];
  for (let v = axisY.min; v <= axisY.max + 1e-9; v += stepY) yTicks.push({ y: Y(v), v: Math.round(v * 100) });
  const stepX = maxShare > 0.5 ? 0.1 : 0.05;
  const xTicks: MapLayout["xTicks"] = [];
  for (let v = 0; v <= maxShare + 1e-9; v += stepX) xTicks.push({ x: X(v), v: Math.round(v * 100) });

  const qw = (t: string) => t.length * 6.4 + 8;
  const Q = opts.quadrants;
  const quadrants: MapLayout["quadrants"] = [
    { x: m.l + 6, y: m.t + 14, anchor: "start", good: true, text: Q[0] },
    { x: m.l + iw - 4, y: m.t + 14, anchor: "end", good: true, text: Q[1] },
    { x: m.l + 6, y: m.t + ih - 8, anchor: "start", good: false, text: Q[2] },
    { x: m.l + iw - 4, y: m.t + ih - 8, anchor: "end", good: false, text: Q[3] },
  ];
  type Box = { x: number; y: number; w: number; h: number };
  const boxes: Box[] = [
    { x: m.l, y: m.t, w: qw(Q[0]), h: 18 },
    { x: m.l + iw - qw(Q[1]), y: m.t, w: qw(Q[1]), h: 18 },
    { x: m.l, y: m.t + ih - 22, w: qw(Q[2]), h: 18 },
    { x: m.l + iw - qw(Q[3]), y: m.t + ih - 22, w: qw(Q[3]), h: 18 },
  ];
  const hit = (b: Box) =>
    b.x < m.l || b.x + b.w > m.l + iw + m.r - 2 || b.y < 2 || b.y + b.h > m.t + ih || boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
  const dots = points.map((p) => ({ key: p.key, x: X(p.share), y: Y(p.r), dir: dirOf(p.r) }));
  dots.forEach((d) => boxes.push({ x: d.x - 9, y: d.y - 9, w: 18, h: 18 }));
  const labels: MapLayout["labels"] = [];
  [...points]
    .map((p, i) => ({ p, d: dots[i] }))
    .sort((a, b) => b.p.share - a.p.share || a.p.key.localeCompare(b.p.key))
    .forEach(({ p, d }) => {
      const w = p.label.length * 6.3 + 4;
      const h = 14;
      const o = 11;
      const cx = clamp(d.x - w / 2, m.l, m.l + iw - w);
      const cand: [number, number, "start" | "middle" | "end"][] = [
        [d.x + o, d.y - 7, "start"],
        [d.x - o - w, d.y - 7, "end"],
        [cx, d.y - o - 13, "middle"],
        [cx, d.y + o - 1, "middle"],
        [d.x + o, d.y - 22, "start"],
        [d.x + o, d.y + 8, "start"],
        [d.x - o - w, d.y - 22, "end"],
        [d.x - o - w, d.y + 8, "end"],
      ];
      // punti sovrapposti (stesse partite e stesso win rate): le etichette si impilano sopra e sotto
      for (let k = 1; k <= 6; k++) cand.push([d.x + o, d.y - 7 + 15 * k, "start"], [d.x + o, d.y - 7 - 15 * k, "start"], [d.x - o - w, d.y - 7 + 15 * k, "end"]);
      const pick = cand.find(([x, y]) => !hit({ x, y, w, h })) ?? cand[0];
      const b = { x: pick[0], y: pick[1], w, h };
      boxes.push(b);
      labels.push({ key: p.key, x: b.x + (pick[2] === "end" ? w : pick[2] === "middle" ? w / 2 : 0), y: b.y + 11, anchor: pick[2], text: p.label });
    });
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return {
    W,
    H,
    box: { l: m.l, t: m.t, w: iw, h: ih },
    xTicks: xTicks.map((t) => ({ ...t, x: r1(t.x) })),
    yTicks: yTicks.map((t) => ({ ...t, y: r1(t.y) })),
    midY: r1(Y(0.5)),
    avgX: r1(X(avg)),
    dots: dots.map((d) => ({ ...d, x: r1(d.x), y: r1(d.y) })),
    labels: labels.map((l) => ({ ...l, x: r1(l.x), y: r1(l.y) })),
    quadrants: quadrants.map((q) => ({ ...q, x: r1(q.x), y: r1(q.y) })),
  };
}

/* ---------- numeri nella lingua della pagina ---------- */

const TAG: Record<Locale, string> = { en: "en-GB", it: "it-IT", es: "es-ES", fr: "fr-FR" };
/** In francese lo spazio delle migliaia e quello prima del "%" sono insecabili (U+00A0, docs/francese.md). */
const fixSpaces = (s: string) => s.replace(/[   ]/g, " ");

/** Numero intero: "1,240", "1.240", "1240" (spagnolo: 4 cifre senza separatore), "1 240" con lo spazio insecabile. */
export function fmtInt(n: number, locale: Locale): string {
  const s = new Intl.NumberFormat(TAG[locale], { useGrouping: locale === "es" ? "min2" : "always", maximumFractionDigits: 0 }).format(n);
  return locale === "fr" ? fixSpaces(s) : s;
}
/** Numero con decimali fissi ("3,5"). */
export function fmtDec(n: number, locale: Locale, digits = 1): string {
  return new Intl.NumberFormat(TAG[locale], { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}
/** Il segno "%" della lingua: attaccato in inglese e italiano, con lo spazio insecabile in spagnolo e francese ("98 %"). */
export const pctUnit = (locale: Locale) => (locale === "es" || locale === "fr" ? " %" : "%");
/** Percentuale di una quota fra 0 e 1, solo il numero ("57,1"), con `digits` decimali. */
export const pctNum = (r: number, locale: Locale, digits = 1) => fmtDec(r * 100, locale, digits);
/** Percentuale completa ("57,1%", "57,1 %"). */
export const pct = (r: number, locale: Locale, digits = 1) => pctNum(r, locale, digits) + pctUnit(locale);
/** Differenza dal 50% con il segno ("+7,1", "−3,0", "0,0"; il meno tipografico). */
export function deltaText(r: number, locale: Locale): string {
  const d = deltaPoints(r);
  return `${d > 0 ? "+" : d < 0 ? "−" : ""}${fmtDec(Math.abs(d), locale, 1)}`;
}
