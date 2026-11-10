/**
 * Turni svizzeri, fase a gironi e sideboard (09/11/2026, richiesta di apix, organizzatore della community di Origins
 * TCG; Pierluigi: "Costruisci quello che ci ha chiesto"). Il giudice vero è il blocco "09/11/2026: SVIZZERA, GIRONI E
 * SIDEBOARD" di supabase/schema.sql: qui le stesse regole in TypeScript, per le pagine (classifica turno per turno,
 * gironi, nomi delle partite), per i test (formats.test.ts) e per gli script (swiss-dry-run.mjs confronta abbinamenti e
 * classifica con le funzioni del database).
 *
 * Scelte nostre, non regole del gioco (Origins TCG non ha un regolamento dei tornei svizzeri): spareggi e minimo del 33%
 * come nel regolamento dei tornei di Magic: The Gathering, bye che vale una vittoria, nessun pareggio (ogni partita ha un
 * vincitore, come nel resto del Tournament Organizer), ultimo spareggio l'id dell'utente.
 *
 * Funzioni pure, senza import a runtime: le usano pagine, componenti client, script e test.
 */

/** 10/11/2026: anche la qualificazione a doppia eliminazione (doubleElim.ts, blocco DOPPIA ELIMINAZIONE di schema.sql). */
export const FORMATS = ["single_elim", "swiss", "groups", "double_elim"] as const;
export type TournamentFormat = (typeof FORMATS)[number];

/** Formati con una prima fase (svizzera, gironi, qualificazione a doppia eliminazione) e la fase finale a tabellone. */
export function isStagedFormat(format: string | null | undefined): format is "swiss" | "groups" | "double_elim" {
  return format === "swiss" || format === "groups" || format === "double_elim";
}

/** Partita della prima fase (svizzera, gironi, vincenti o perdenti della doppia eliminazione). */
export function isStageMatch(m: { stage?: string | null }): boolean {
  return m.stage === "swiss" || m.stage === "group" || m.stage === "upper" || m.stage === "lower";
}

/** Turni svizzeri che l'organizzatore può scegliere (vincolo tournaments_swiss_rounds_check). */
export const SWISS_ROUNDS_RANGE = { min: 1, max: 15 } as const;
/** Giocatori per girone (N) e quanti ne passano (K) (vincoli tournaments_group_size_check e _group_advance_check). */
export const GROUP_SIZE_RANGE = { min: 3, max: 8, default: 4 } as const;
export const GROUP_ADVANCE_RANGE = { min: 1, max: 4, default: 2 } as const;
export const GROUP_SEEDINGS = ["snake", "random"] as const;
export type GroupSeeding = (typeof GROUP_SEEDINGS)[number];
/** Carte della sideboard (M) (vincolo tournaments_sideboard_check): un mazzo ha 12 carte base. */
export const SIDEBOARD_RANGE = { min: 1, max: 12, default: 5 } as const;

/** Punti per una vittoria (bye compreso); il pareggio non esiste. */
export const WIN_POINTS = 3;
/** Minimo delle percentuali negli spareggi (OMW%, GW%, OGW%), come nel regolamento di Magic. */
export const PCT_FLOOR = 0.33;
/** Passi massimi della ricerca degli abbinamenti senza rivincite (uguale a `budget` di tm_swiss_pairs). */
export const SWISS_PAIR_BUDGET = 5000;

/** Turni svizzeri proposti: log2 degli iscritti per eccesso, almeno 1 (come tm_swiss_default_rounds). */
export function defaultSwissRounds(players: number): number {
  const n = Math.max(players, 2);
  let k = 0;
  while (2 ** k < n && k < 15) k += 1;
  return Math.max(1, k);
}

/**
 * Abbinamenti di un turno svizzero, come tm_swiss_pairs (indici da 0, invece che da 1). I giocatori 0..n-1 sono in
 * ordine di classifica; `hadBye[i]` dice se i ha già avuto il bye; `played` le coppie già giocate. Restituisce il
 * compagno di ognuno (-1 = bye). Bye al più basso senza bye (se l'hanno avuto tutti, al più basso); poi ricerca in
 * profondità dall'alto senza rivincite, con un altro candidato al bye se quello non chiude; senza soluzione (o oltre
 * SWISS_PAIR_BUDGET passi) dall'alto preferendo chi non si è già incontrato.
 */
export function swissPairs(n: number, hadBye: boolean[], played: [number, number][]): number[] {
  if (n < 1) return [];
  if (n === 1) return [-1];
  // dentro si lavora da 1, come nell'SQL: 0 = libero, -1 = bye
  const seen = new Uint8Array(n * n + n + 1);
  const at = (i: number, j: number) => (i - 1) * n + j;
  for (const [a, b] of played) {
    const i = a + 1;
    const j = b + 1;
    if (i >= 1 && i <= n && j >= 1 && j <= n) {
      seen[at(i, j)] = 1;
      seen[at(j, i)] = 1;
    }
  }
  let byes: number[] = [];
  if (n % 2 === 1) {
    for (let k = n; k >= 1; k--) if (!hadBye[k - 1]) byes.push(k);
    if (!byes.length) for (let k = n; k >= 1; k--) byes.push(k);
  } else byes = [0];

  let steps = 0;
  const out = (partner: number[]) => partner.slice(1).map((p) => (p > 0 ? p - 1 : -1));

  for (const bye of byes) {
    const partner = new Array<number>(n + 1).fill(0);
    const cand = new Array<number>(n + 1).fill(0);
    if (bye > 0) partner[bye] = -1;
    const stack: number[] = [];
    let i = 1;
    let ok = false;
    for (;;) {
      while (i <= n && partner[i] !== 0) i += 1;
      if (i > n) {
        ok = true;
        break;
      }
      steps += 1;
      if (steps > SWISS_PAIR_BUDGET) break;
      let pick = 0;
      for (let j = Math.max(cand[i], i) + 1; j <= n; j++) {
        if (partner[j] === 0 && !seen[at(i, j)]) {
          pick = j;
          break;
        }
      }
      if (pick > 0) {
        partner[i] = pick;
        partner[pick] = i;
        cand[i] = pick;
        stack.push(i);
        i += 1;
      } else {
        cand[i] = 0;
        if (!stack.length) break;
        const k = stack.pop() as number;
        const j = partner[k];
        partner[k] = 0;
        partner[j] = 0;
        i = k;
      }
    }
    if (ok) return out(partner);
    if (steps > SWISS_PAIR_BUDGET) break;
  }

  const bye = byes[0];
  const partner = new Array<number>(n + 1).fill(0);
  if (bye > 0) partner[bye] = -1;
  for (let i = 1; i <= n; i++) {
    if (partner[i] !== 0) continue;
    let pick = 0;
    for (let j = i + 1; j <= n; j++) {
      if (partner[j] === 0 && !seen[at(i, j)]) {
        pick = j;
        break;
      }
    }
    if (!pick) {
      for (let j = i + 1; j <= n; j++) {
        if (partner[j] === 0) {
          pick = j;
          break;
        }
      }
    }
    if (!pick) throw new Error("pairing_failed");
    partner[i] = pick;
    partner[pick] = i;
  }
  return out(partner);
}

/** Le coppie dei compagni di `swissPairs` (indice più basso prima) e il bye, nell'ordine dei tavoli del database. */
export function pairsOf(partner: number[]): { tables: [number, number][]; bye: number | null } {
  const tables: [number, number][] = [];
  let bye: number | null = null;
  partner.forEach((p, i) => {
    if (p < 0) bye = i;
    else if (p > i) tables.push([i, p]);
  });
  return { tables, bye };
}

/* ---------- classifica ---------- */

export type FormatMatch = {
  id?: string;
  round: number;
  position: number;
  player_a: string | null;
  player_b: string | null;
  winner: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
  stage?: string | null;
  grp?: number | null;
};

export type StandingRow = {
  user_id: string;
  /** girone (null in svizzera) */
  grp: number | null;
  /** posizione, da 1 (nel girone per i gironi) */
  rank: number;
  points: number;
  wins: number;
  losses: number;
  byes: number;
  played: number;
  /** percentuali da 0 a 1, arrotondate a 6 decimali come nel database */
  mw: number;
  gw: number;
  omw: number;
  ogw: number;
  dropped: boolean;
};

const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

/**
 * Classifica come tm_standings: partite svizzere e dei gironi chiuse (confermate o bye) fino al turno `upTo` (tutte se
 * manca). `dropped` sono i giocatori ritirati; `include` aggiunge a zero chi non ha ancora una partita chiusa (per
 * mostrare tutti gli iscritti, in fondo: il database li elenca solo dopo la prima partita).
 */
export function standings(matches: FormatMatch[], opts: { upTo?: number; dropped?: Iterable<string>; include?: { user_id: string; grp: number | null }[] } = {}): StandingRow[] {
  const dropped = new Set(opts.dropped ?? []);
  type Res = { opp: string | null; won: boolean; gf: number; ga: number; bye: boolean };
  const res = new Map<string, { grp: number | null; list: Res[] }>();
  const add = (uid: string, grp: number | null, r: Res) => {
    const cur = res.get(uid) ?? { grp: null, list: [] };
    if (grp !== null && (cur.grp === null || grp > cur.grp)) cur.grp = grp;
    cur.list.push(r);
    res.set(uid, cur);
  };
  for (const m of matches) {
    if (m.stage !== "swiss" && m.stage !== "group") continue;
    if (m.status !== "confirmed" && m.status !== "bye") continue;
    if (!m.winner || !m.player_a) continue;
    if (opts.upTo !== undefined && m.round > opts.upTo) continue;
    const grp = m.grp ?? null;
    add(m.player_a, grp, { opp: m.player_b, won: m.winner === m.player_a, gf: m.score_a ?? 0, ga: m.score_b ?? 0, bye: !m.player_b });
    if (m.player_b) add(m.player_b, grp, { opp: m.player_a, won: m.winner === m.player_b, gf: m.score_b ?? 0, ga: m.score_a ?? 0, bye: false });
  }
  const base = new Map<string, { grp: number | null; played: number; wins: number; losses: number; byes: number; gf: number; gp: number; mw: number; gw: number }>();
  for (const [uid, { grp, list }] of res) {
    const played = list.length;
    const wins = list.filter((r) => r.won).length;
    const gf = list.reduce((s, r) => s + r.gf, 0);
    const gp = list.reduce((s, r) => s + r.gf + r.ga, 0);
    base.set(uid, {
      grp,
      played,
      wins,
      losses: played - wins,
      byes: list.filter((r) => r.bye).length,
      gf,
      gp,
      mw: Math.max(wins / played, PCT_FLOOR),
      gw: gp > 0 ? Math.max(gf / gp, PCT_FLOOR) : PCT_FLOOR,
    });
  }
  const rows: StandingRow[] = [];
  for (const [uid, b] of base) {
    const opps = (res.get(uid)?.list ?? []).filter((r) => !r.bye && r.opp && base.has(r.opp)).map((r) => base.get(r.opp as string)!);
    const omw = opps.length ? opps.reduce((s, o) => s + o.mw, 0) / opps.length : PCT_FLOOR;
    const ogw = opps.length ? opps.reduce((s, o) => s + o.gw, 0) / opps.length : PCT_FLOOR;
    rows.push({ user_id: uid, grp: b.grp, rank: 0, points: b.wins * WIN_POINTS, wins: b.wins, losses: b.losses, byes: b.byes, played: b.played, mw: round6(b.mw), gw: round6(b.gw), omw: round6(omw), ogw: round6(ogw), dropped: dropped.has(uid) });
  }
  for (const p of opts.include ?? []) {
    if (base.has(p.user_id)) continue;
    rows.push({ user_id: p.user_id, grp: p.grp, rank: 0, points: 0, wins: 0, losses: 0, byes: 0, played: 0, mw: 0, gw: 0, omw: 0, ogw: 0, dropped: dropped.has(p.user_id) });
  }
  rows.sort(compareStanding);
  const next = new Map<number | null, number>();
  for (const r of rows) {
    const k = next.get(r.grp) ?? 1;
    r.rank = k;
    next.set(r.grp, k + 1);
  }
  return rows;
}

/** Ordine della classifica (dentro lo stesso girone): punti, OMW%, GW%, OGW%, id dell'utente. */
export function compareStanding(a: StandingRow, b: StandingRow): number {
  if (a.grp !== b.grp) return (a.grp ?? -1) - (b.grp ?? -1);
  return b.points - a.points || b.omw - a.omw || b.gw - a.gw || b.ogw - a.ogw || (a.user_id < b.user_id ? -1 : a.user_id > b.user_id ? 1 : 0);
}

/** Percentuale da mostrare: "62,5%" → qui solo il numero con un decimale (il simbolo lo mette l'etichetta). */
export function pct(x: number): string {
  return (Math.round(x * 1000) / 10).toFixed(1);
}

/* ---------- gironi ---------- */

/** Numero di gironi: iscritti / N per eccesso. */
export function groupCount(players: number, groupSize: number): number {
  return Math.max(1, Math.ceil(players / groupSize));
}

/**
 * Girone di ogni posizione dell'ordine di avvio (da 0), a serpentina: A B C C B A A B C… Con l'ordine casuale il database
 * mescola prima l'ordine; la distribuzione resta questa. Uguale a tm_groups_create.
 */
export function snakeGroups(players: number, groups: number): number[] {
  return Array.from({ length: players }, (_, p) => {
    const row = Math.floor(p / groups);
    const idx = p % groups;
    return row % 2 === 0 ? idx : groups - 1 - idx;
  });
}

/** Il girone ha senso? Almeno 2 giocatori per girone, più di quanti ne passano, e almeno 2 qualificati in tutto. */
export function groupsProblem(players: number, groupSize: number, advance: number): "groups_too_small" | null {
  const g = groupCount(players, groupSize);
  const min = Math.floor(players / g);
  if (min < 2 || min <= advance || g * advance < 2) return "groups_too_small";
  return null;
}

/**
 * Calendario all'italiana di un girone di `m` giocatori (posti da 0) col metodo del cerchio, come tm_groups_create: con
 * m dispari si aggiunge un posto vuoto (chi lo incontra riposa). Turni da 0; per ogni turno le coppie [a, b] dei tavoli.
 */
export function roundRobin(m: number): [number, number][][] {
  const mm = m + (m % 2);
  const rounds: [number, number][][] = [];
  for (let r = 0; r <= mm - 2; r++) {
    const pairs: [number, number][] = [];
    for (let k = 0; k <= mm / 2 - 1; k++) {
      const sa = k === 0 ? 0 : ((k - 1 + r) % (mm - 1)) + 1;
      const sb = ((mm - 2 - k + r) % (mm - 1)) + 1;
      if (sa < m && sb < m) pairs.push([sa, sb]);
    }
    rounds.push(pairs);
  }
  return rounds;
}

/** Lettera del girone: 0 → A, 25 → Z, 26 → AA (come i bracket). */
export function groupLetter(grp: number): string {
  const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return grp < a.length ? a[grp] : `${a[Math.floor(grp / a.length) - 1]}${a[grp % a.length]}`;
}

/**
 * Chi passa dai gironi, nell'ordine dei seed della fase finale (come start_final_stage): i primi `advance` di ogni girone
 * ancora in gara; prima tutti i primi, poi i secondi…; a pari piazzamento per % di vittorie, GW%, OMW% e girone.
 */
export function groupQualifiers(rows: StandingRow[], advance: number): StandingRow[] {
  const place = new Map<StandingRow, number>();
  const seen = new Map<number | null, number>();
  for (const r of [...rows].filter((x) => !x.dropped).sort(compareStanding)) {
    const k = (seen.get(r.grp) ?? 0) + 1;
    seen.set(r.grp, k);
    place.set(r, k);
  }
  return [...place.entries()]
    .filter(([, k]) => k <= advance)
    .sort(([a, ka], [b, kb]) => ka - kb || b.mw - a.mw || b.gw - a.gw || b.omw - a.omw || (a.grp ?? 0) - (b.grp ?? 0))
    .map(([r]) => r);
}

/** I primi `cut` della classifica svizzera ancora in gara: i seed della Top. */
export function swissQualifiers(rows: StandingRow[], cut: number): StandingRow[] {
  return [...rows]
    .filter((r) => !r.dropped)
    .sort(compareStanding)
    .slice(0, cut);
}

/* ---------- partite per fase ---------- */

/** Partite del tabellone a eliminazione diretta (la Top o la fase finale): stage null. */
export function bracketPart<T extends { stage?: string | null }>(matches: T[]): T[] {
  return matches.filter((m) => !m.stage);
}

/** Le partite del tabellone rinumerate dal turno 1, per il componente del tabellone di sempre. */
export function bracketRenumbered<T extends { round: number; position: number; stage?: string | null }>(matches: T[]): { matches: T[]; base: number } {
  const b = bracketPart(matches);
  if (!b.length) return { matches: [], base: 0 };
  const base = Math.min(...b.map((m) => m.round)) - 1;
  return { matches: b.map((m) => ({ ...m, round: m.round - base })).sort((x, y) => x.round - y.round || x.position - y.position), base };
}

/** Ultimo turno del tabellone (la finale, per `final_best_of`); 0 se il tabellone non c'è ancora. Uguale a tm_need. */
export function finalRoundOf(format: string, matches: { round: number; stage?: string | null }[]): number {
  const b = isStagedFormat(format) ? bracketPart(matches) : matches;
  return b.reduce((max, m) => Math.max(max, m.round), 0);
}

/** Turni della prima fase giocati o in corso (il più alto). */
export function stageRounds(matches: { round: number; stage?: string | null }[]): number {
  return matches.reduce((max, m) => (isStageMatch(m) ? Math.max(max, m.round) : max), 0);
}

/** Partite ancora aperte della prima fase. */
export function openStageMatches<T extends { stage?: string | null; status: string }>(matches: T[]): T[] {
  return matches.filter((m) => isStageMatch(m) && (m.status === "pending" || m.status === "reported" || m.status === "disputed"));
}

/** Il vincitore di una svizzera senza Top (riga `champion` scritta da finish_tournament), oppure null. */
export function championOf(matches: { stage?: string | null; winner: string | null }[]): string | null {
  return matches.find((m) => m.stage === "champion")?.winner ?? null;
}

/**
 * La partita "di adesso" di un giocatore. Nel tabellone e in svizzera è quella del turno più alto; nei gironi, dove le
 * partite nascono tutte all'avvio, la prima ancora aperta (pronta per prima), poi quella del turno più alto.
 */
export function currentMatchOf<T extends { round: number; player_a: string | null; player_b: string | null; status: string; stage?: string | null; ready_at?: string | null }>(matches: T[], uid: string): T | undefined {
  const mine = matches.filter((m) => (m.player_a === uid || m.player_b === uid) && m.stage !== "champion").sort((a, b) => b.round - a.round);
  const bracket = mine.find((m) => !m.stage);
  if (bracket) return bracket;
  const open = mine
    .filter((m) => m.stage === "group" && (m.status === "pending" || m.status === "reported" || m.status === "disputed"))
    .sort((a, b) => Number(!a.ready_at) - Number(!b.ready_at) || a.round - b.round);
  return open[0] ?? mine[0];
}

/* ---------- sideboard ---------- */

export type SideProblem = "side_count" | "side_invalid" | "side_in_deck";

/**
 * Riserva valida per i mazzi consegnati: al massimo `max` carte, slug validi senza doppioni e nessuna carta già in un
 * mazzo o Leggendaria di un mazzo (nel gioco ogni carta vale due copie: le copie si contano su mazzo + riserva).
 * `isBaseCard` (facoltativo) controlla che sia una carta base vera del database carte. Uguale a
 * submit_tournament_sideboard, che però non conosce il database carte.
 */
export function sideboardProblem(side: string[], decks: { legendary: string | null; cards: string[] }[], max: number, isBaseCard?: (slug: string) => boolean): SideProblem | null {
  if (side.length > max) return "side_count";
  if (new Set(side).size !== side.length) return "side_invalid";
  if (side.some((s) => !/^[a-z0-9-]{1,80}$/.test(s) || (isBaseCard && !isBaseCard(s)))) return "side_invalid";
  const used = new Set(decks.flatMap((d) => [...d.cards, ...(d.legendary ? [d.legendary] : [])]));
  if (side.some((s) => used.has(s))) return "side_in_deck";
  return null;
}

export type SideSwap = { out: string; in: string };

/**
 * Scambi validi per una partita: ogni carta che esce sta nel mazzo, ogni carta che entra sta nella riserva, niente
 * doppioni, non più delle carte della riserva (come declare_side_swaps). Il mazzo dopo gli scambi resta di 12 carte base
 * diverse più la Leggendaria.
 */
export function swapsProblem(swaps: SideSwap[], deckCards: string[], side: string[], max: number): "bad_side_swap" | null {
  if (swaps.length > Math.min(max, side.length)) return "bad_side_swap";
  const outs = new Set(swaps.map((s) => s.out));
  const ins = new Set(swaps.map((s) => s.in));
  if (outs.size !== swaps.length || ins.size !== swaps.length) return "bad_side_swap";
  if (swaps.some((s) => !deckCards.includes(s.out) || !side.includes(s.in))) return "bad_side_swap";
  return null;
}

/** Le carte del mazzo dopo gli scambi (stesso ordine, la carta che entra al posto di quella che esce). */
export function applySwaps(deckCards: string[], swaps: SideSwap[]): string[] {
  const map = new Map(swaps.map((s) => [s.out, s.in]));
  return deckCards.map((c) => map.get(c) ?? c);
}

/* ---------- formato in un clic ---------- */

/**
 * "Usa il formato Svizzera + Top 8": svizzera con i turni proposti dal numero di iscritti, Top 8 dopo una pausa (la
 * svizzera il sabato, la Top la domenica, come nella riunione del 5–6/10/2026), al meglio delle 3, check-in e 15 minuti
 * di assenza. Mazzi e posti restano quelli scelti.
 */
export const SWISS_PRESET = {
  format: "swiss",
  size: 64,
  swiss_rounds: null,
  top_cut: 8,
  top_cut_hold: true,
  best_of: 3,
  final_best_of: null,
  checkin: true,
  no_show_minutes: 15,
} as const;
