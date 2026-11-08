/**
 * Qualificazione a bracket e fase finale (top cut) di un torneo a eliminazione diretta, con la pausa prima della fase
 * finale e il ban di un mazzo (08/11/2026, il torneo da 256 della community italiana del 28/11/2026: 16 bracket da 16 e
 * Top 16, Bo3 Conquest a tre mazzi con un ban).
 *
 * Un tabellone da 256 a eliminazione diretta è già questo formato: i primi quattro turni sono 16 bracket da 16 (le
 * posizioni consecutive del primo turno), gli ultimi quattro la Top 16. Il database non ha tabelloni separati (blocco
 * "08/11/2026: BRACKET E TOP CUT" di supabase/schema.sql): qui si calcola solo come mostrarlo a pezzi, con le stesse
 * regole di `tm_top_round`, `tm_held` e `tm_ban_applies` (stages.test.ts confronta i numeri con l'SQL).
 *
 * Funzioni pure, senza import a runtime: le usano pagine, componenti, gli script e i test.
 */

/** Fasi finali proposte nel modulo (vincolo tournaments_top_cut_check). */
export const TOP_CUTS = [4, 8, 16, 32] as const;
export type TopCut = (typeof TOP_CUTS)[number];

export type StagePlan = {
  /** posti del tabellone (potenza di 2: partite del primo turno × 2) */
  size: number;
  totalRounds: number;
  /** null = un tabellone solo: niente fase finale, o tabellone non più grande della fase finale */
  topCut: number | null;
  /** bracket della qualificazione (tanti quanti i posti della fase finale; 0 senza fase finale) */
  pods: number;
  /** posti di ogni bracket */
  podSize: number;
  /** turni della qualificazione */
  podRounds: number;
  /** primo turno della fase finale (null senza fase finale) */
  topRound: number | null;
};

function log2(n: number): number {
  let k = 0;
  while (2 ** k < n) k += 1;
  return k;
}

/** Piano del tabellone: `size` è il numero di posti del tabellone generato, `topCut` la fase finale scelta (o null). */
export function stagePlan(size: number, topCut: number | null | undefined): StagePlan {
  const totalRounds = size >= 2 ? log2(size) : 0;
  const cut = topCut && (TOP_CUTS as readonly number[]).includes(topCut) ? topCut : null;
  if (!cut || size <= cut) return { size, totalRounds, topCut: null, pods: 0, podSize: size, podRounds: totalRounds, topRound: null };
  const podSize = size / cut;
  const podRounds = log2(podSize);
  return { size, totalRounds, topCut: cut, pods: cut, podSize, podRounds, topRound: podRounds + 1 };
}

/** Piano dalle partite del tabellone (posti = partite del primo turno × 2). */
export function planOf(matches: { round: number }[], topCut: number | null | undefined): StagePlan {
  return stagePlan(matches.filter((m) => m.round === 1).length * 2, topCut);
}

export type MatchStage =
  /** un bracket della qualificazione: `pod` da 0, `round` da 1 a podRounds; `last` = finale del bracket */
  | { phase: "pod"; pod: number; round: number; last: boolean }
  /** fase finale: `round` da 1 a log2(topCut) */
  | { phase: "top"; round: number; rounds: number }
  /** tabellone unico */
  | { phase: "single"; round: number };

export function matchStage(plan: StagePlan, round: number, position: number): MatchStage {
  if (plan.topRound === null) return { phase: "single", round };
  if (round >= plan.topRound) return { phase: "top", round: round - plan.topRound + 1, rounds: plan.totalRounds - plan.podRounds };
  const perPod = plan.podSize / 2 ** round;
  return { phase: "pod", pod: Math.floor(position / perPod), round, last: round === plan.podRounds };
}

/** Lettera del bracket: 0 → A, 25 → Z, 26 → AA (con la fase finale più grande, 32, si arriva ad AF). */
export function podLetter(pod: number): string {
  const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return pod < a.length ? a[pod] : `${a[Math.floor(pod / a.length) - 1]}${a[pod % a.length]}`;
}

type Positioned = { round: number; position: number };

/** Le partite del bracket `pod`, rinumerate come un tabellone a sé (turni 1..podRounds, posizioni da 0). */
export function podMatches<T extends Positioned>(matches: T[], plan: StagePlan, pod: number): T[] {
  if (plan.topRound === null) return [];
  const out: T[] = [];
  for (const m of matches) {
    if (m.round >= plan.topRound) continue;
    const perPod = plan.podSize / 2 ** m.round;
    if (Math.floor(m.position / perPod) !== pod) continue;
    out.push({ ...m, position: m.position - pod * perPod });
  }
  return out.sort((x, y) => x.round - y.round || x.position - y.position);
}

/** Le partite della fase finale, rinumerate come un tabellone a sé (turni da 1). */
export function topMatches<T extends Positioned>(matches: T[], plan: StagePlan): T[] {
  if (plan.topRound === null) return [];
  const top = plan.topRound;
  return matches
    .filter((m) => m.round >= top)
    .map((m) => ({ ...m, round: m.round - top + 1 }))
    .sort((x, y) => x.round - y.round || x.position - y.position);
}

type Decided = Positioned & { winner: string | null; status: string };

/** Vincitore del bracket (finale del bracket chiusa con un vincitore), oppure null. */
export function podWinner(matches: Decided[], plan: StagePlan, pod: number): string | null {
  if (plan.topRound === null) return null;
  const f = matches.find((m) => m.round === plan.podRounds && m.position === pod);
  return f && f.winner && (f.status === "confirmed" || f.status === "bye") ? f.winner : null;
}

/** Quanti bracket hanno già il vincitore. */
export function podsDone(matches: Decided[], plan: StagePlan): number {
  let n = 0;
  for (let p = 0; p < plan.pods; p++) if (podWinner(matches, plan, p)) n += 1;
  return n;
}

/** Il bracket di un giocatore: quello della sua partita del primo turno (null se non gioca o senza fase finale). */
export function podOf(matches: (Positioned & { player_a: string | null; player_b: string | null })[], plan: StagePlan, uid: string | null | undefined): number | null {
  if (!uid || plan.topRound === null) return null;
  const m = matches.find((x) => x.round === 1 && (x.player_a === uid || x.player_b === uid));
  if (!m) return null;
  const s = matchStage(plan, m.round, m.position);
  return s.phase === "pod" ? s.pod : null;
}

/**
 * Primo turno in pausa: la fase finale finché lo staff non la avvia (come `tm_held`), altrimenti null. Le partite della
 * fase finale in pausa hanno i giocatori ma non `ready_at`.
 */
export function holdRound(t: { top_cut_hold?: boolean | null; top_cut_released_at?: string | null }, plan: StagePlan): number | null {
  return t.top_cut_hold && !t.top_cut_released_at && plan.topRound !== null ? plan.topRound : null;
}

/** La partita è ferma per la pausa: nella fase finale in pausa e non ancora pronta. */
export function isHeld(m: { round: number; ready_at?: string | null }, held: number | null): boolean {
  return held !== null && m.round >= held && !m.ready_at;
}

/**
 * Il ban vale in questa partita (come `tm_ban_applies`): Conquest con il ban e, dopo il ban, almeno tanti mazzi quante le
 * vittorie che servono. Tre mazzi al meglio delle 3: sì (si vince con i due rimasti); al meglio delle 5: no.
 */
export function banApplies(t: { deck_ban?: boolean | null; deck_mode: string; conquest_decks: number }, need: number): boolean {
  return Boolean(t.deck_ban) && t.deck_mode === "conquest" && t.conquest_decks - 1 >= need;
}

/** Ban di una partita come li restituisce `match_bans`: deck e legendary vuoti finché il ban dell'avversario è nascosto. */
export type MatchBan = { user_id: string; target: string; deck: number | null; legendary: string | null; created_at: string };

export type BanState = {
  /** il mio ban (null se non ho ancora bannato) */
  mine: MatchBan | null;
  /** il ban dell'avversario sul mio mazzo (null se non ha ancora bannato) */
  theirs: MatchBan | null;
  /** hanno bannato tutti e due: si gioca */
  done: boolean;
};

/** Stato dei ban per chi gioca (`me` è uno dei due) o per lo staff (`me` = player_a per leggere dal lato a). */
export function banState(bans: MatchBan[], me: string, opponent: string | null): BanState {
  const mine = bans.find((b) => b.user_id === me) ?? null;
  const theirs = opponent ? (bans.find((b) => b.user_id === opponent) ?? null) : null;
  return { mine, theirs, done: Boolean(mine && theirs) };
}

/** Indici dei mazzi con cui gioca chi ha `count` mazzi, togliendo quello bannato (se noto). */
export function remainingDecks(count: number, banned: number | null | undefined): number[] {
  return Array.from({ length: count }, (_, i) => i).filter((i) => i !== banned);
}

export type BanTally = { legendary: string; bans: number; chances: number };

/** Ban rate di una Leggendaria: ban fatti su occasioni di bannarla (0 se non c'erano occasioni). */
export function banRate(t: Pick<BanTally, "bans" | "chances">): number {
  return t.chances > 0 ? t.bans / t.chances : 0;
}

/** Un ban fermo da più di tanti minuti finisce nella coda "Da sistemare" dello staff. */
export const BAN_WAIT_MINUTES = 10;

/**
 * Il formato del torneo del 28/11/2026 in un clic nel modulo: 256 posti in 16 bracket da 16, Top 16 dopo una pausa,
 * Conquest a tre mazzi con un ban (8 carte uniche come alla Crimson Cup), al meglio delle 3 anche in finale (con tre
 * mazzi al meglio delle 5 il ban non varrebbe), check-in, liste segrete, 15 minuti di assenza.
 */
export const BRACKETS_PRESET = {
  size: 256,
  top_cut: 16,
  top_cut_hold: true,
  deck_ban: true,
  deck_mode: "conquest",
  conquest_decks: 3,
  conquest_min_different: 8,
  best_of: 3,
  final_best_of: null,
  checkin: true,
  hidden_decklists: true,
  no_show_minutes: 15,
} as const;
