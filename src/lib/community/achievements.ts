/**
 * Traguardi del profilo pubblico /u, numeri pubblici della vetrina e tornei in evidenza (pacchetto TRAGUARDI,
 * 27/09/2026; Pierluigi: "OK A TUTTO, OTTIMO!!" alle proposte per i profili: traguardi, numeri pubblici del creator se
 * lui vuole, tornei del creator in evidenza).
 *
 * Funzioni pure, senza import a runtime: `node --test src/lib/community/achievements.test.ts` le esegue senza il resto
 * del sito. Le letture stanno in achievementQueries.ts, i testi in src/lib/achievementLabels.ts, i componenti in
 * src/components/achievements/.
 *
 * TRAGUARDI. Si calcolano dai dati che ci sono già, tutti pubblici e verificabili da chiunque guardi il sito: nessuna
 * tabella nuova, niente da assegnare a mano. Metà dei fatti la pagina /u li ha già (profilo, mazzi pubblicati con i
 * voti, tier list pubbliche: `LocalFacts`); gli altri (tornei e "mazzo del mese") arrivano dalla funzione SQL
 * `profile_achievement_facts` (supabase/wave2-TRAGUARDI.sql: `RemoteFacts`). Finché la migrazione non c'è quei
 * traguardi semplicemente non compaiono. I traguardi si mostrano su OGNI profilo (anche della community), solo quelli
 * ottenuti, nell'ordine di `ACHIEVEMENTS`; i profili con vetrina li hanno più in grande.
 *
 * NUMERI PUBBLICI. Un profilo con vetrina che accende `profiles.show_stats` in /account mostra i totali dei suoi mazzi
 * pubblicati (mazzi, visite, copie del codice del gioco, voti ricevuti) letti da `profile_public_stats`, che restituisce
 * solo somme: le righe di `deck_stats_daily` per giorno e per mazzo restano private. Sono stime, come nel pannello
 * "Le tue statistiche".
 *
 * TORNEI IN EVIDENZA. Sulla vetrina, i tornei pubblici organizzati dal profilo: prima quelli aperti o in corso (con la
 * copertina, `safeCover`), poi i finiti con chi li ha vinti (`featuredTournaments`, `finalWinners`). Tornei e fatti dei
 * traguardi valgono solo con una finale valida e senza i bot di prova (`isSeedBot`).
 */

/* ---------- catalogo ---------- */

/** I traguardi, nell'ordine in cui si mostrano: iscrizione, mazzi, voti, tier list, tornei. */
export const ACHIEVEMENTS = [
  "demo2",
  "first_deck",
  "decks_5",
  "decks_10",
  "full_guide",
  "well_rated",
  "deck_of_month",
  "tier_list",
  "tournament_played",
  "tournament_organized",
  "tournament_won",
] as const;
export type AchievementId = (typeof ACHIEVEMENTS)[number];

/** Disegno della medaglia (componente AchievementIcon). */
export type AchievementIcon = "flag" | "cards" | "book" | "star" | "calendar" | "tiers" | "swords" | "bracket" | "trophy";

/**
 * Come si mostra ogni traguardo: disegno, numero scritto sulla medaglia (i traguardi dei mazzi), tono della cornice
 * (oro solo per il torneo vinto, come la stella del campione nel tabellone) e se può valere più volte ("×2").
 */
export const ACHIEVEMENT_LOOK: Record<AchievementId, { icon: AchievementIcon; mark?: string; tone: "sky" | "gold"; repeatable: boolean }> = {
  demo2: { icon: "flag", tone: "sky", repeatable: false },
  first_deck: { icon: "cards", mark: "1", tone: "sky", repeatable: false },
  decks_5: { icon: "cards", mark: "5", tone: "sky", repeatable: false },
  decks_10: { icon: "cards", mark: "10", tone: "sky", repeatable: false },
  full_guide: { icon: "book", tone: "sky", repeatable: false },
  well_rated: { icon: "star", tone: "sky", repeatable: true },
  deck_of_month: { icon: "calendar", tone: "sky", repeatable: true },
  tier_list: { icon: "tiers", tone: "sky", repeatable: false },
  tournament_played: { icon: "swords", tone: "sky", repeatable: true },
  tournament_organized: { icon: "bracket", tone: "sky", repeatable: true },
  tournament_won: { icon: "trophy", tone: "gold", repeatable: true },
};

/* ---------- soglie ---------- */

/**
 * "Dalla Demo 2.0": account creato prima dell'inizio dello Steam Next Fest, lunedì 19 ottobre 2026 alle 10:00 ora del
 * Pacifico (le 17:00 UTC, le 19:00 in Italia): lo stesso istante di `steamNextFest.startAt` in src/lib/data/events.ts
 * (il test lo controlla). Da lì in poi la demo è quella del Next Fest, con la classificata.
 */
export const DEMO2_CUTOFF = "2026-10-19T17:00:00Z";

/** Mazzi pubblicati che servono per i tre traguardi dei mazzi. */
export const DECK_MILESTONES = { first_deck: 1, decks_5: 5, decks_10: 10 } as const;

/** "Mazzo apprezzato": un mazzo pubblicato con almeno 5 voti e una media di almeno 4,5 stelle (deck_ratings, due decimali). */
export const WELL_RATED = { minVotes: 5, minAvg: 4.5 } as const;

/**
 * "Mazzo del mese": il mazzo pubblicato con più voti positivi (almeno `DECK_OF_MONTH_MIN_STARS` stelle) ricevuti in un
 * mese UTC già chiuso, con almeno `DECK_OF_MONTH_MIN_VOTES` voti positivi in quel mese (pari merito compresi). Contano
 * solo i voti positivi (revisione del 27/09/2026): tre voti da una stella non fanno un mazzo "del mese". Gli stessi
 * numeri stanno in `profile_achievement_facts` (supabase/wave2-TRAGUARDI.sql), e il test li confronta.
 */
export const DECK_OF_MONTH_MIN_VOTES = 3;
export const DECK_OF_MONTH_MIN_STARS = 4;

/**
 * I profili dei bot di prova dello staff (scripts/seed-bots.mjs: nome utente `bot-<n>`, `bot-<n>-<k>` se il nome era
 * già preso da handle_new_user): i tornei con un bot iscritto non danno traguardi e non compaiono fra i tornei conclusi
 * della vetrina (dati di prova, non risultati veri). La stessa espressione sta in `profile_achievement_facts`.
 */
export const SEED_BOT_USERNAME = "^bot-[0-9]+(-[0-9]+)?$";
const SEED_BOT_RE = new RegExp(SEED_BOT_USERNAME);

/** Un profilo creato da scripts/seed-bots.mjs (dal nome utente). */
export function isSeedBot(username: string | null | undefined): boolean {
  return typeof username === "string" && SEED_BOT_RE.test(username);
}

/** "Prima tier list": una tier list pubblica con almeno una carta classificata. */
export const TIER_LIST_MIN_CARDS = 1;

/* ---------- fatti ---------- */

/** I fatti che la pagina /u ha già: data d'iscrizione, mazzi pubblicati (con voti e guida), tier list pubbliche. */
export type LocalFacts = {
  /** profiles.created_at */
  memberSince: string | null;
  /** i mazzi pubblicati: data di creazione, voti ricevuti, media, guida sopra la soglia di deckQuality.ts */
  decks: readonly { created_at: string; votes: number; avg: number; fullGuide: boolean }[];
  /** le tier list pubbliche: data di creazione e carte classificate */
  tierLists: readonly { created_at: string; ranked: number }[];
};

/** Quante volte, e il giorno della prima finale (ISO), per tornei giocati, organizzati e vinti. */
export type TournamentFact = { count: number; first: string | null };

/** I fatti della funzione SQL `profile_achievement_facts`. */
export type RemoteFacts = {
  played: TournamentFact;
  organized: TournamentFact;
  won: TournamentFact;
  /** mesi 'YYYY-MM' in cui un mazzo del profilo è stato il più votato, in ordine */
  topMonths: string[];
};

/** Un traguardo ottenuto: data (giorno UTC 'YYYY-MM-DD') se si sa, quante volte, mesi del "mazzo del mese". */
export type Earned = { id: AchievementId; date: string | null; count: number; months: string[] };

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Il giorno UTC ('YYYY-MM-DD') di una data ISO, o null se non è una data. */
export function dayOf(iso: string | null | undefined): string | null {
  if (typeof iso !== "string" || !iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
}

/** Un intero non negativo (anche scritto come stringa, come a volte PostgREST restituisce i bigint), o null. */
function count(value: unknown): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? n : null;
}

function tournamentFact(value: unknown): TournamentFact | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const n = count(v.count);
  if (n === null) return null;
  const first = typeof v.first === "string" && dayOf(v.first) ? v.first : null;
  return { count: n, first: n > 0 ? first : null };
}

/**
 * La risposta di `profile_achievement_facts` ricontrollata (difesa in lettura): null se non ha la forma attesa, così
 * una risposta strana non inventa traguardi. I mesi fuori formato si scartano.
 */
export function parseRemoteFacts(raw: unknown): RemoteFacts | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const played = tournamentFact(r.played);
  const organized = tournamentFact(r.organized);
  const won = tournamentFact(r.won);
  if (!played || !organized || !won) return null;
  const months = Array.isArray(r.top_months) ? r.top_months.filter((m): m is string => typeof m === "string" && MONTH_RE.test(m)) : [];
  return { played, organized, won, topMonths: [...new Set(months)].sort() };
}

/* ---------- calcolo ---------- */

/** Le date valide, come giorni UTC, in ordine. */
function sortedDays(values: readonly (string | null | undefined)[]): string[] {
  return values.map(dayOf).filter((d): d is string => d !== null).sort();
}

/**
 * I traguardi ottenuti, nell'ordine di `ACHIEVEMENTS`. `remote` null (funzione SQL non ancora nel database, o risposta
 * non valida): niente traguardi dei tornei né "mazzo del mese", gli altri sì.
 */
export function earnedAchievements(local: LocalFacts, remote: RemoteFacts | null): Earned[] {
  const got = new Map<AchievementId, Omit<Earned, "id">>();
  const add = (id: AchievementId, date: string | null, times = 1, months: string[] = []) => got.set(id, { date, count: times, months });

  const joined = dayOf(local.memberSince);
  if (joined && local.memberSince && Date.parse(local.memberSince) < Date.parse(DEMO2_CUTOFF)) add("demo2", joined);

  // il primo, il quinto, il decimo mazzo pubblicato fra quelli che ci sono oggi (un mazzo nascosto non conta più)
  const deckDays = sortedDays(local.decks.map((d) => d.created_at));
  for (const id of ["first_deck", "decks_5", "decks_10"] as const) {
    const n = DECK_MILESTONES[id];
    if (deckDays.length >= n) add(id, deckDays[n - 1]);
  }

  const guides = sortedDays(local.decks.filter((d) => d.fullGuide).map((d) => d.created_at));
  if (guides.length) add("full_guide", guides[0]);

  const rated = local.decks.filter((d) => d.votes >= WELL_RATED.minVotes && d.avg >= WELL_RATED.minAvg);
  if (rated.length) add("well_rated", null, rated.length);

  if (remote?.topMonths.length) add("deck_of_month", null, remote.topMonths.length, remote.topMonths);

  const lists = sortedDays(local.tierLists.filter((t) => t.ranked >= TIER_LIST_MIN_CARDS).map((t) => t.created_at));
  if (lists.length) add("tier_list", lists[0]);

  if (remote) {
    const tournaments = [
      ["tournament_played", remote.played],
      ["tournament_organized", remote.organized],
      ["tournament_won", remote.won],
    ] as const;
    for (const [id, fact] of tournaments) if (fact.count > 0) add(id, dayOf(fact.first), fact.count);
  }

  return ACHIEVEMENTS.flatMap((id) => {
    const e = got.get(id);
    return e ? [{ id, ...e }] : [];
  });
}

/* ---------- numeri pubblici ---------- */

/** I totali di `profile_public_stats`: mazzi pubblicati, visite, copie del codice del gioco, voti ricevuti. */
export type PublicStats = { decks: number; views: number; codeCopies: number; votes: number; since: string | null };

/**
 * La risposta di `profile_public_stats` (un elenco di righe, al massimo una) ricontrollata. null se non c'è una riga
 * (profilo senza show_stats o senza ruolo con vetrina), se la forma è sbagliata o se non ci sono mazzi pubblicati:
 * quattro zeri sulla vetrina non dicono nulla.
 */
export function parsePublicStats(raw: unknown): PublicStats | null {
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const decks = count(r.decks);
  const views = count(r.views);
  const codeCopies = count(r.code_copies);
  const votes = count(r.votes);
  if (decks === null || views === null || codeCopies === null || votes === null || decks === 0) return null;
  return { decks, views, codeCopies, votes, since: typeof r.since === "string" ? dayOf(r.since) : null };
}

/* ---------- tornei in evidenza ---------- */

type TournamentLike = { id: string; status: string; starts_at: string };

/** Quanti tornei finiti si mostrano sulla vetrina (i più recenti): la sezione sta in alto e non deve spingere giù i mazzi. */
export const FINISHED_SHOWN = 4;

/** Quanti tornei finiti si leggono per trovarne `FINISHED_SHOWN` con un vincitore vero (senza bot di prova). */
export const FINISHED_FETCH = 12;

/** Quanti tornei in corso e quanti aperti si leggono (i più vicini). */
export const UPCOMING_FETCH = 12;

/** Quanti tornei in arrivo o in corso si mostrano, con la copertina grande: tre file da due sul desktop. */
export const UPCOMING_SHOWN = 6;

/**
 * Dopo quanti giorni dalla data d'inizio un torneo ancora "open" non si mostra più: non si è riempito e nessuno l'ha
 * avviato, e sulla vetrina, con la copertina grande in cima, sembrerebbe vivo. Resta raggiungibile da /tournaments.
 */
export const STALE_OPEN_DAYS = 7;

/**
 * I tornei organizzati divisi per la vetrina.
 * - `upcoming`: aperti e in corso, prima quelli in corso, poi per data d'inizio (il più vicino per primo), al massimo
 *   `UPCOMING_SHOWN`; fuori gli aperti con la data d'inizio passata da più di `STALE_OPEN_DAYS` giorni.
 * - `finished`: finiti CON un vincitore (`hasWinner`: finale valida e nessun bot di prova, vedi achievementQueries.ts),
 *   dal più recente, al massimo `FINISHED_SHOWN`. Un torneo segnato "finito" senza finale giocata non compare.
 * Gli annullati restano fuori.
 */
export function featuredTournaments<T extends TournamentLike>(
  list: readonly T[],
  opts: { now: number; hasWinner: (id: string) => boolean },
): { upcoming: T[]; finished: T[] } {
  const time = (t: T) => {
    const v = Date.parse(t.starts_at);
    return Number.isFinite(v) ? v : 0;
  };
  const staleBefore = opts.now - STALE_OPEN_DAYS * 86_400_000;
  const upcoming = list
    .filter((t) => t.status === "running" || (t.status === "open" && time(t) >= staleBefore))
    .sort((a, b) => (a.status === b.status ? time(a) - time(b) : a.status === "running" ? -1 : 1))
    .slice(0, UPCOMING_SHOWN);
  const finished = list
    .filter((t) => t.status === "finished" && opts.hasWinner(t.id))
    .sort((a, b) => time(b) - time(a))
    .slice(0, FINISHED_SHOWN);
  return { upcoming, finished };
}

/**
 * La copertina di un torneo da mostrare sulla vetrina: una copertina del media kit (`presets`) o un file caricato nella
 * cartella dell'organizzatore nel bucket delle copertine (`uploadPrefix` = URL pubblico di `<organizer>/`, stesso nome
 * di file ammesso da `checkCover` in src/lib/tournament/util.ts); altrimenti `fallback`. `cover_url` non ha vincoli nel
 * database e si può scrivere via API saltando `checkCover`: senza questo controllo un indirizzo qualsiasi (un pixel di
 * tracciamento, un'immagine fuori luogo) finirebbe sul profilo pubblico.
 */
export function safeCover(url: string | null | undefined, presets: readonly string[], uploadPrefix: string, fallback: string): string {
  const v = typeof url === "string" ? url.trim() : "";
  if (presets.includes(v)) return v;
  const file = v.slice(uploadPrefix.length);
  // un nome di file vero: niente "." o ".." (il browser li risolverebbe fuori dalla cartella dell'organizzatore)
  if (uploadPrefix && v.startsWith(uploadPrefix) && /^[A-Za-z0-9._-]{1,80}$/.test(file) && !/^\.+$/.test(file)) return v;
  return fallback;
}

/** Una partita in posizione 0 del tabellone (una per turno): l'ultima è la finale. */
export type FinalRow = { tournament_id: string; round: number; position: number; winner: string | null; status: string };

/**
 * Chi ha vinto ogni torneo: il vincitore della partita in posizione 0 dell'ultimo turno, se è confermata o un bye (la
 * regola di `standings` in src/lib/tournament/bracket.ts e di `finish_tournament`). Le righe in altre posizioni si
 * ignorano; un torneo senza vincitore non compare.
 */
export function finalWinners(rows: readonly FinalRow[]): Map<string, string> {
  const last = new Map<string, FinalRow>();
  for (const r of rows) {
    if (r.position !== 0 || !Number.isInteger(r.round)) continue;
    const cur = last.get(r.tournament_id);
    if (!cur || r.round > cur.round) last.set(r.tournament_id, r);
  }
  const out = new Map<string, string>();
  for (const [id, r] of last) if (r.winner && (r.status === "confirmed" || r.status === "bye")) out.set(id, r.winner);
  return out;
}

/* ---------- lettura del database ---------- */

/**
 * La funzione SQL non c'è (ancora): PostgREST risponde 404 / PGRST202, Postgres 42883 (funzione) o 42703 (colonna,
 * per `profiles.show_stats`). Allora il sito resta com'era, senza errori, e riprova più tardi.
 */
export function isMissing(res: { status?: number | null; error?: { code?: string | null; message?: string | null } | null } | null | undefined): boolean {
  if (!res?.error) return false;
  const code = res.error.code ?? "";
  return res.status === 404 || code === "PGRST202" || code === "42883" || code === "42703" || code === "42P01";
}

/** Sostituisce i segnaposto `{nome}` (senza interpretare i `$` di `replace`). */
export function fillAchievement(template: string, vars: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
