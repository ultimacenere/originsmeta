/**
 * Tier list personalizzate (/tier-list/create): codice, spostamenti e testo da copiare.
 *
 * Modulo puro, senza import: lo usano il componente client `TierListMaker`, la pagina ufficiale della tier list
 * (per i colori delle fasce) e i test di Node (`node --test src/lib/tiercode.test.ts`). Non importa il database
 * carte: chi chiama passa l'elenco degli slug validi, così nel bundle del browser non entra nulla di pesante.
 *
 * Formato del codice (TL1), campi separati da un punto:
 *   TL1 . tipo . titolo . S . A . B . C . D
 *   - tipo: "l" per le Leggendarie, "c" per le carte base;
 *   - titolo: base64url del titolo in UTF-8, vuoto se non c'è;
 *   - fasce: slug separati da "~", nell'ordine in cui stanno nella fascia. I campi vuoti in coda si omettono.
 * Esempio: "TL1.l..dorothy~mulan.merlin" (niente titolo, S con Dorothy e Mulan, A con Merlin).
 *
 * Perché non base64 di un JSON come il codice OM1 del deck builder: con tutte le 111 carte base classificate il
 * JSON in base64 supera i 2.100 caratteri, oltre il limite di 2.000 di un messaggio Discord; così ne servono circa
 * 1.300. Gli slug sono fatti di [a-z0-9-], quindi punto e tilde non possono comparire dentro uno slug, e sono
 * caratteri che un indirizzo tiene così come sono (anche nell'hash, che il browser non manda al server).
 * Molti programmi di chat tagliano i punti finali di un link (li prendono per punteggiatura): la decodifica legge
 * i campi mancanti come fasce vuote, quindi il risultato non cambia.
 *
 * Lo stesso codice è anche il salvataggio nel browser (una chiave per scheda): chi legge un salvataggio passa dalla
 * stessa decodifica tollerante di chi apre un link.
 */

export const TIERS = ["S", "A", "B", "C", "D"] as const;
export type Tier = (typeof TIERS)[number];

/**
 * Le due schede della tier list personalizzata. Quando arriveranno gli archetipi dei mazzi (richiesta del 22/09/2026,
 * "in futuro") si aggiunge qui un terzo tipo, con la sua lettera in `KIND_CODE` e il suo elenco di voci valide:
 * formato, spostamenti e testo restano gli stessi.
 */
export type TierKind = "legendaries" | "cards";
export const TIER_KINDS: readonly TierKind[] = ["legendaries", "cards"];

export type TierBoard = { title: string; tiers: Record<Tier, string[]> };
export type DecodedTierList = { kind: TierKind; board: TierBoard };

export const TL_VERSION = "TL1";
/** Lunghezza massima del titolo (la stessa del nome di un mazzo nel deck builder). */
export const TITLE_MAX = 60;
/** Tetto di sicurezza sulle voci lette da un codice: le carte attive sono 122, un codice più lungo è sporco. */
const MAX_ENTRIES = 400;
/** Tetto sulla lunghezza del testo da decodificare, per non lavorare su incollate enormi. */
const MAX_INPUT = 12000;

const KIND_CODE: Record<TierKind, string> = { legendaries: "l", cards: "c" };
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/*
  Colori delle fasce, identici nella tier list ufficiale (/tier-list) e in quella personalizzata: stanno qui perché
  li importano sia la pagina (componente server) sia il componente client.
  Rampa dal più al meno: oro, menta, menta scura, blu notte con cornice celeste, magenta scuro. Ogni fascia si
  distingue dalla vicina (prima B e C erano due blu notte quasi uguali, 1,20:1 fra loro). Testo scuro (ink) sui tre
  fondi chiari (menta scura 6,0:1), gesso sui due fondi scuri; il magenta resta solo alla D ("da rifare"), nella
  versione scura delle pastiglie nerf: il gesso sul crimson pieno fa 3,99:1, sul crimson-deep 6,14:1. La cornice della
  C è un anello interno, così la casella non cambia misura.
*/
export const tierTone: Record<Tier, string> = {
  S: "bg-gold text-ink",
  A: "bg-mint text-ink",
  B: "bg-mint-deep text-ink",
  C: "bg-night-3 text-chalk ring-2 ring-inset ring-sky",
  D: "bg-crimson-deep text-chalk",
};

export function emptyBoard(): TierBoard {
  return { title: "", tiers: { S: [], A: [], B: [], C: [], D: [] } };
}

/**
 * Titolo pulito: niente caratteri di controllo né spazi doppi, al massimo `TITLE_MAX` caratteri. Via anche i
 * caratteri invisibili di direzione (U+200E/F, U+202A-202E, U+2066-2069, lo stesso insieme della rotta dei
 * feedback): in un titolo arrivato da un link potrebbero invertirlo o camuffarlo. Niente \p{Cf} generico: toglierebbe
 * lo ZWJ e romperebbe le emoji composte.
 */
export function cleanTitle(title: string): string {
  return Array.from(
    String(title ?? "")
      .replace(/\p{Cc}/gu, " ")
      .replace(/[‎‏‪-‮⁦-⁩]/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  )
    .slice(0, TITLE_MAX)
    .join("")
    .trim();
}

/** Carte già in una fascia. */
export function rankedCount(board: TierBoard): number {
  return TIERS.reduce((n, t) => n + board.tiers[t].length, 0);
}

/** Niente carte nelle fasce e niente titolo: è la tier list di partenza. */
export function isEmptyBoard(board: TierBoard): boolean {
  return rankedCount(board) === 0 && !cleanTitle(board.title);
}

/** Fascia in cui sta una carta, `null` se è fra le non classificate. */
export function tierOf(board: TierBoard, slug: string): Tier | null {
  return TIERS.find((t) => board.tiers[t].includes(slug)) ?? null;
}

/** Carte non classificate: quelle dell'elenco `pool` che non stanno in nessuna fascia, nell'ordine di `pool`. */
export function unranked(board: TierBoard, pool: readonly string[]): string[] {
  const placed = new Set(TIERS.flatMap((t) => board.tiers[t]));
  return pool.filter((s) => !placed.has(s));
}

/**
 * Sposta una carta. `to` è la fascia di arrivo (`null` = fra le non classificate, che non hanno un ordine proprio);
 * `before` è la carta davanti alla quale metterla (`null` o una carta che non sta nella fascia = in fondo).
 * Restituisce una tier list nuova e non tocca quella ricevuta. Spostare una carta davanti a sé stessa non cambia nulla.
 */
export function moveCard(board: TierBoard, slug: string, to: Tier | null, before: string | null = null): TierBoard {
  if (before === slug) return board;
  const tiers = { ...board.tiers };
  for (const t of TIERS) if (tiers[t].includes(slug)) tiers[t] = tiers[t].filter((s) => s !== slug);
  if (to) {
    const list = [...tiers[to]];
    const at = before ? list.indexOf(before) : -1;
    if (at >= 0) list.splice(at, 0, slug);
    else list.push(slug);
    tiers[to] = list;
  }
  return { ...board, tiers };
}

/* ---------- codice TL1 ---------- */

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  // `fatal`: una sequenza UTF-8 rotta fa scartare il titolo invece di riempirlo di caratteri sostitutivi
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** Codice TL1 di una tier list: va dopo il # del link condiviso ed è anche il salvataggio del browser. */
export function encodeTierCode(kind: TierKind, board: TierBoard): string {
  const title = cleanTitle(board.title);
  const seen = new Set<string>();
  const groups = TIERS.map((t) =>
    board.tiers[t]
      .filter((s) => {
        if (!SLUG_RE.test(s) || seen.has(s)) return false;
        seen.add(s);
        return true;
      })
      .join("~"),
  );
  const parts = [TL_VERSION, KIND_CODE[kind], title ? toBase64Url(title) : "", ...groups];
  // campi vuoti in coda: non servono (la decodifica li legge come vuoti) e un punto finale si perde facilmente
  while (parts.length > 2 && !parts[parts.length - 1]) parts.pop();
  return parts.join(".");
}

/**
 * Legge un codice TL1 da un testo qualsiasi: il codice nudo, l'hash (#TL1…) o un link intero, anche con le
 * percentuali di un'app che lo ha codificato. Restituisce `null` se non c'è un codice TL1 leggibile.
 * Tollerante: con `known` si tengono solo gli slug di quell'elenco (le carte uscite dal gioco o di un'altra scheda
 * si scartano), i doppioni valgono una volta sola (vince la prima fascia), un titolo illeggibile diventa vuoto.
 */
export function decodeTierCode(input: string, known?: Partial<Record<TierKind, ReadonlySet<string>>>): DecodedTierList | null {
  let text = String(input ?? "").slice(0, MAX_INPUT);
  try {
    text = decodeURIComponent(text);
  } catch {
    /* percentuali rotte: si prova con il testo com'è */
  }
  const at = text.indexOf(`${TL_VERSION}.`);
  if (at < 0) return null;
  // il codice finisce al primo carattere che non gli appartiene (spazio, virgolette, parentesi, fine riga)
  const code = text.slice(at).match(/^[A-Za-z0-9._~-]+/)?.[0] ?? "";
  const [, kindCode = "", titleCode = "", ...groups] = code.split(".");
  const kind = (Object.keys(KIND_CODE) as TierKind[]).find((k) => KIND_CODE[k] === kindCode);
  if (!kind) return null;

  const board = emptyBoard();
  if (titleCode) {
    try {
      board.title = cleanTitle(fromBase64Url(titleCode));
    } catch {
      board.title = "";
    }
  }
  const allowed = known?.[kind];
  const seen = new Set<string>();
  TIERS.forEach((tier, i) => {
    for (const slug of (groups[i] ?? "").split("~")) {
      if (seen.size >= MAX_ENTRIES) return;
      if (!slug || !SLUG_RE.test(slug) || seen.has(slug) || (allowed && !allowed.has(slug))) continue;
      seen.add(slug);
      board.tiers[tier].push(slug);
    }
  });
  return { kind, board };
}

/* ---------- testo da copiare ---------- */

/**
 * La tier list in testo, una riga per fascia, pronta da incollare su Discord:
 *   Titolo
 *   S: ★ Dorothy, ★ Mulan
 *   A: —
 * La stella segna le Leggendarie, come nel resto del sito; le fasce vuote hanno un trattino, così la scala si legge
 * sempre intera. Le carte non classificate non compaiono. `footer`, se c'è, va in fondo dopo una riga vuota.
 */
export function tierListText(
  board: TierBoard,
  nameOf: (slug: string) => { name: string; legendary?: boolean } | undefined,
  heading: string,
  footer?: string,
): string {
  const lines: string[] = [];
  if (heading.trim()) lines.push(heading.trim());
  for (const t of TIERS) {
    const names = board.tiers[t].flatMap((slug) => {
      const card = nameOf(slug);
      return card ? [`${card.legendary ? "★ " : ""}${card.name}`] : [];
    });
    lines.push(`${t}: ${names.length ? names.join(", ") : "—"}`);
  }
  if (footer?.trim()) lines.push("", footer.trim());
  return lines.join("\n");
}
