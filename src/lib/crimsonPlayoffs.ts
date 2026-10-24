/*
  Playoff della Crimson Cup (25/10/2026). Pierluigi, sul tabellone di Tourney Bot: "tabellone delle semifinali, possiamo
  riportarlo sul sito fatto meglio e mi dici se ci sono dei nostri ragazzi iscritti da noi ancora in game?".

  Tourney Bot è il bot dei tornei del Discord ufficiale di Origins TCG: il suo visualizzatore legge una risposta pubblica,
  https://tourneybot.gg/api/v1/tourneys/<id>, con il torneo, i giocatori e le partite. Qui la si trasforma nel tabellone
  del sito, con funzioni pure (test in crimsonPlayoffs.test.ts, sulla fotografia di src/lib/data/crimsonPlayoffsSnapshot.json).

  Com'è fatta la risposta (doppia eliminazione da 256 posti, letta il 25/10/2026):
  - `games[].round` è il turno DENTRO il suo lato: 1–8 nel tabellone vincenti, 1–14 in quello dei perdenti. La risposta non
    dice il lato: un giocatore senza sconfitte gioca nel tabellone vincenti, uno con una sconfitta in quello dei perdenti,
    la gran finale mette di fronte il vincitore dei vincenti e quello dei perdenti. Si contano le sconfitte turno per
    turno, prima le partite fra imbattuti (chi perde al turno 2 dei vincenti gioca il turno 2 dei perdenti).
  - `winner` è l'id Discord del vincitore, come `player1.user_id` o `player2.user_id` (numeri che hanno perso le ultime
    cifre: si confrontano solo fra loro). L'id Discord vero di ogni giocatore sta in `players[].realUserId`.
  - Le partite con un solo giocatore noto ("Winner of #480") nella risposta non ci sono: il sito dice chi aspetta e in
    quale turno, senza inventare l'abbinamento.

  Le finali: i playoff mandano quattro giocatori alle finali del 25 ottobre (calendario ufficiale, events.ts). In una
  doppia eliminazione gli ultimi quattro in corsa sono i due della finale dei vincenti (perdere lì li manda alla finale dei
  perdenti, quando ne restano tre) e i due vincitori del turno dei perdenti che porta da sei a quattro, il 2R-4 (12 con 8
  turni dei vincenti).
*/

export type Side = "winners" | "losers" | "grand";

export type PoMatch = {
  /** numero della partita in Tourney Bot (#509) */
  id: number;
  side: Side;
  /** turno dentro il lato (1 = il primo); la gran finale è 1 (2 se si rigioca) */
  round: number;
  /** posti dei due giocatori (`players[].id` di Tourney Bot) */
  a: number | null;
  b: number | null;
  sa: number;
  sb: number;
  /** posto del vincitore, null finché la partita non è finita */
  w: number | null;
};

export type PoPlayer = {
  seat: number;
  name: string;
  /** id Discord vero (solo dalla risposta dal vivo: la fotografia nel repository non lo porta) */
  discord?: string;
  wins: number;
  losses: number;
  alive: boolean;
  /** la partita della seconda sconfitta */
  out?: { match: number; side: Side; round: number; by: number | null };
  /** partita con tutti e due i giocatori e senza risultato */
  open?: number;
  /** dove aspetta l'avversario, se è in corsa e non ha una partita aperta */
  next?: { side: Side; round: number };
};

export type Playoffs = {
  id: number;
  name: string;
  startTime: string;
  bestOf: number;
  /** posti del tabellone (256) */
  size: number;
  /** turni del tabellone vincenti (8 con 256 posti) */
  wbRounds: number;
  /** turni del tabellone perdenti (2 × 8 − 2 = 14) */
  lbRounds: number;
  /** partite in ordine: lato (vincenti, perdenti, gran finale), turno, numero */
  matches: PoMatch[];
  /** giocatori in ordine di posto */
  players: PoPlayer[];
  /** i quattro delle finali: dalla finale dei vincenti e dal turno 2R-4 dei perdenti (posti, in ordine di partita) */
  finalists: { winners: number[]; losers: number[] };
  /** quando la risposta è stata letta (ISO) */
  fetchedAt: string | null;
};

const SIDE_ORDER: Record<Side, number> = { winners: 0, losers: 1, grand: 2 };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const int = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" ? v : typeof v === "number" ? String(v) : null);

/** Nome mostrato: testo di un utente di Discord, quindi niente caratteri di controllo né invisibili, al massimo 40 caratteri. */
export function cleanName(raw: unknown): string {
  const s = typeof raw === "string" ? raw.slice(0, 200) : "";
  const clean = s.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, "").trim();
  if (!clean) return "?";
  return clean.length > 40 ? `${clean.slice(0, 39)}…` : clean;
}

/** Partite di un turno del tabellone vincenti con `size` posti (128, 64… 1). */
export const wbMatchesIn = (size: number, round: number) => Math.max(1, size >> round);
/** Partite di un turno del tabellone perdenti: i turni vanno a coppie (64, 64, 32, 32… 1, 1 con 256 posti). */
export const lbMatchesIn = (size: number, round: number) => Math.max(1, size >> (Math.floor((round + 1) / 2) + 1));
/** Il turno dei perdenti i cui vincitori vanno alle finali (da sei a quattro in corsa). */
export const lbTopFourRound = (wbRounds: number) => 2 * wbRounds - 4;

/** Dove finisce chi perde al turno `round` dei vincenti: turno 1 → 1, poi 2r − 2. */
export const dropRound = (round: number) => (round <= 1 ? 1 : 2 * round - 2);

/**
 * Ordine di gioco dei turni: vincenti 1, perdenti 1, vincenti 2, perdenti 2 e 3, vincenti 3, perdenti 4 e 5… Il turno r
 * dei vincenti sta fra il 2r−3 e il 2r−2 dei perdenti (dove scendono i suoi sconfitti). I numeri delle partite di Tourney
 * Bot non bastano: le partite del turno 4 dei perdenti hanno numeri più bassi di quelle del turno 3 dei vincenti.
 */
export const timeKey = (side: Side, round: number) => (side === "grand" ? 1000 + round : side === "winners" ? 2 * round - 2.5 : round);
const byTime = (x: PoMatch, y: PoMatch) => timeKey(x.side, x.round) - timeKey(y.side, y.round) || x.id - y.id;

/**
 * Legge la risposta di Tourney Bot (o la fotografia del repository, stessa forma). Restituisce null se non è una doppia
 * eliminazione leggibile: dati di terzi, si controlla tutto.
 */
export function parsePlayoffs(raw: unknown): Playoffs | null {
  if (!isObj(raw) || !isObj(raw.tourney) || !Array.isArray(raw.games) || !Array.isArray(raw.players)) return null;
  const t = raw.tourney;
  const id = int(t.id);
  const size = int(t.participant_size);
  if (id === null || size === null || size < 8 || size > 4096 || (size & (size - 1)) !== 0) return null;
  const wbRounds = Math.log2(size);
  const lbRounds = 2 * wbRounds - 2;

  const players = new Map<number, PoPlayer>();
  for (const p of raw.players) {
    if (!isObj(p)) continue;
    const seat = int(p.id);
    if (seat === null || seat < 1 || players.has(seat)) continue;
    const discord = str(p.realUserId);
    players.set(seat, { seat, name: cleanName(p.name), ...(discord && /^\d{5,25}$/.test(discord) ? { discord } : {}), wins: 0, losses: 0, alive: true });
  }

  type Raw = { id: number; round: number; a: number | null; b: number | null; sa: number; sb: number; w: number | null };
  const seen = new Set<number>();
  const games: Raw[] = [];
  for (const g of raw.games) {
    if (!isObj(g)) continue;
    const gid = int(g.id);
    const round = int(g.round);
    if (gid === null || round === null || round < 1 || seen.has(gid)) continue;
    const side = (v: unknown) => {
      if (!isObj(v)) return { seat: null, score: 0, user: null };
      const seat = int(v.id);
      return { seat: seat !== null && players.has(seat) ? seat : null, score: Math.max(0, int(v.score) ?? 0), user: str(v.user_id) };
    };
    const p1 = side(g.player1);
    const p2 = side(g.player2);
    if (p1.seat === null && p2.seat === null) continue;
    const winner = str(g.winner);
    let w: number | null = null;
    if (winner) {
      if (p1.seat !== null && winner === p1.user) w = p1.seat;
      else if (p2.seat !== null && winner === p2.user) w = p2.seat;
    }
    seen.add(gid);
    games.push({ id: gid, round, a: p1.seat, b: p2.seat, sa: p1.score, sb: p2.score, w });
  }

  // Lato di ogni partita, turno per turno, con le sconfitte dei turni prima. È dei vincenti la partita fra due giocatori
  // senza sconfitte, tranne quando tutti e due giocano anche un'altra partita dello stesso turno: al turno 1 chi perde nei
  // vincenti gioca subito il turno 1 dei perdenti, quindi lì si incontrano due che compaiono due volte (nei vincenti chi
  // vince compare una volta sola). Al turno 2 chi scende dai vincenti trova chi ha già una sconfitta del turno 1. La gran
  // finale è la partita del vincitore dei vincenti dopo la sua finale.
  const losses = new Map<number, number>();
  const lost = (s: number | null) => (s === null ? 0 : losses.get(s) ?? 0);
  const matches: PoMatch[] = [];
  let wbChampion: number | null = null;
  const rounds = [...new Set(games.map((g) => g.round))].sort((x, y) => x - y);
  for (const r of rounds) {
    const inRound = games.filter((g) => g.round === r).sort((x, y) => x.id - y.id);
    const count = new Map<number, number>();
    for (const g of inRound) for (const s of [g.a, g.b]) if (s !== null) count.set(s, (count.get(s) ?? 0) + 1);
    const twice = (s: number | null) => s !== null && (count.get(s) ?? 0) > 1;
    const isWinners = (g: Raw) =>
      r <= wbRounds && lost(g.a) === 0 && lost(g.b) === 0 && g.a !== wbChampion && g.b !== wbChampion && !(twice(g.a) && twice(g.b));
    const unbeaten = inRound.filter(isWinners);
    const rest = inRound.filter((g) => !unbeaten.includes(g));
    const record = (g: Raw, side: Side) => {
      const m: PoMatch = { ...g, side, round: side === "grand" ? 0 : g.round };
      matches.push(m);
      if (m.w !== null) {
        const loser = m.w === m.a ? m.b : m.a;
        if (loser !== null) losses.set(loser, lost(loser) + 1);
        if (side === "winners" && r === wbRounds) wbChampion = m.w;
      }
    };
    for (const g of unbeaten) record(g, "winners");
    for (const g of rest) record(g, wbChampion !== null && (g.a === wbChampion || g.b === wbChampion) ? "grand" : "losers");
  }
  // la gran finale: 1, e 2 se si rigioca
  matches
    .filter((m) => m.side === "grand")
    .sort((x, y) => x.id - y.id)
    .forEach((m, i) => (m.round = i + 1));
  matches.sort((x, y) => SIDE_ORDER[x.side] - SIDE_ORDER[y.side] || x.round - y.round || x.id - y.id);

  // Statistiche dei giocatori, nell'ordine in cui si giocano le partite (`timeKey`: la seconda sconfitta è davvero l'ultima).
  const chrono = [...matches].sort(byTime);
  const last = new Map<number, PoMatch>();
  for (const m of chrono) {
    for (const s of [m.a, m.b]) if (s !== null && m.w !== null) last.set(s, m);
    if (m.w === null) {
      if (m.a !== null && m.b !== null) {
        players.get(m.a)!.open = m.id;
        players.get(m.b)!.open = m.id;
      }
      continue;
    }
    const loser = m.w === m.a ? m.b : m.a;
    players.get(m.w)!.wins++;
    if (loser !== null) {
      const p = players.get(loser)!;
      p.losses++;
      if (p.losses >= 2 && !p.out) {
        p.alive = false;
        p.out = { match: m.id, side: m.side, round: m.round, by: m.w };
      }
    }
  }
  for (const p of players.values()) {
    if (!p.alive || p.open !== undefined) continue;
    const m = last.get(p.seat);
    if (!m) {
      p.next = { side: "winners", round: 2 }; // un passaggio libero al primo turno
      continue;
    }
    const won = m.w === p.seat;
    if (m.side === "winners") p.next = won ? (m.round < wbRounds ? { side: "winners", round: m.round + 1 } : { side: "grand", round: 1 }) : { side: "losers", round: dropRound(m.round) };
    else if (m.side === "losers") p.next = m.round < lbRounds ? { side: "losers", round: m.round + 1 } : { side: "grand", round: 1 };
    else p.next = { side: "grand", round: m.round + 1 };
  }

  // I quattro delle finali.
  const wbFinal = matches.find((m) => m.side === "winners" && m.round === wbRounds);
  const fromWinners = wbFinal && wbFinal.a !== null && wbFinal.b !== null ? [wbFinal.a, wbFinal.b] : [];
  const fromLosers = wbRounds >= 3 ? matches.filter((m) => m.side === "losers" && m.round === lbTopFourRound(wbRounds) && m.w !== null).map((m) => m.w as number) : [];

  return {
    id,
    name: cleanName(t.name),
    startTime: str(t.start_time) ?? "",
    bestOf: Math.max(1, int(t.best_of) ?? 1),
    size,
    wbRounds,
    lbRounds,
    matches,
    players: [...players.values()].sort((x, y) => x.seat - y.seat),
    finalists: { winners: fromWinners, losers: fromLosers },
    fetchedAt: str(raw.fetchedAt),
  };
}

/** Partite di un lato e di un turno. */
export const matchesIn = (p: Playoffs, side: Side, round: number) => p.matches.filter((m) => m.side === side && m.round === round);

/** Il percorso di un giocatore, in ordine di gioco. */
export const pathOf = (p: Playoffs, seat: number) => p.matches.filter((m) => m.a === seat || m.b === seat).sort(byTime);

/** I quattro delle finali sono tutti noti. */
export const topFourDecided = (p: Playoffs) => p.finalists.winners.length === 2 && p.finalists.losers.length === 2;

/**
 * Chi è ancora in corsa, dai più avanti: prima chi non ha sconfitte, poi per turno raggiunto (partita aperta o attesa) e
 * vittorie; a parità, per nome.
 */
export function aliveRanked(p: Playoffs): PoPlayer[] {
  const reach = (pl: PoPlayer) => {
    const at = reachedOf(p, pl);
    return at ? timeKey(at.side, at.round) : -10;
  };
  return p.players
    .filter((pl) => pl.alive)
    .sort((x, y) => x.losses - y.losses || reach(y) - reach(x) || y.wins - x.wins || x.name.localeCompare(y.name));
}

/** Partite aperte, le più importanti prima: gran finale, poi i turni più avanti (a parità, prima i vincenti). */
export function openMatches(p: Playoffs): PoMatch[] {
  return p.matches.filter((m) => m.w === null && m.a !== null && m.b !== null).sort((x, y) => byTime(y, x));
}

/** Chi aspetta l'avversario in un turno (in corsa, senza partita aperta). */
export const waitingIn = (p: Playoffs, side: Side, round: number) => p.players.filter((pl) => pl.alive && pl.next?.side === side && pl.next.round === round);

/** Turno raggiunto dal giocatore: l'ultimo in cui ha giocato o in cui è atteso (per l'eliminato, quello dell'eliminazione). */
export function reachedOf(p: Playoffs, pl: PoPlayer): { side: Side; round: number } | null {
  if (pl.out) return { side: pl.out.side, round: pl.out.round };
  if (pl.open !== undefined) {
    const m = p.matches.find((x) => x.id === pl.open);
    if (m) return { side: m.side, round: m.round };
  }
  return pl.next ?? null;
}

/** I turni da mostrare nella "corsa alle finali": gli ultimi quattro dei vincenti (dagli ottavi) e gli ultimi sei dei perdenti. */
export const stretchRounds = (p: Playoffs) => ({
  winners: Array.from({ length: Math.min(4, p.wbRounds) }, (_, i) => p.wbRounds - Math.min(4, p.wbRounds) + 1 + i),
  losers: Array.from({ length: Math.min(6, p.lbRounds) }, (_, i) => p.lbRounds - Math.min(6, p.lbRounds) + 1 + i),
});

/** Forma compatta per il browser: niente id Discord, solo quello che serve all'esploratore del tabellone. */
export type PoCompact = {
  players: { seat: number; name: string; w: number; l: number; alive: boolean }[];
  /** [id, lato (0 vincenti, 1 perdenti, 2 gran finale), turno, a, b, sa, sb, vincitore] con 0 al posto di un posto vuoto */
  matches: [number, 0 | 1 | 2, number, number, number, number, number, number][];
};

export function compact(p: Playoffs): PoCompact {
  return {
    players: p.players.map((pl) => ({ seat: pl.seat, name: pl.name, w: pl.wins, l: pl.losses, alive: pl.alive })),
    matches: p.matches.map((m) => [m.id, SIDE_ORDER[m.side] as 0 | 1 | 2, m.round, m.a ?? 0, m.b ?? 0, m.sa, m.sb, m.w ?? 0]),
  };
}
