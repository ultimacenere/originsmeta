import type { GameCardInput } from "@/game-card/model";

/**
 * Replay delle patch di /tier-list (prototipo del 26/11/2026, scelto da Pierluigi il 27/11): i dati che
 * `loadLegendaryReplay` (legendaries.ts, solo server) costruisce una volta e che il replay riceve già pronti, anche nei
 * componenti client. Niente numeri di persone: delle liste della community e dei voti si passano solo fascia e media.
 */

export type ReplayTier = "S" | "A" | "B" | "C" | "D";
export type ReplayTierOrNone = ReplayTier | "unranked";

/** Un win rate con l'intervallo di Wilson al 95% (0–1). */
export type ReplayRate = { games: number; wins: number; r: number; lo: number; hi: number };

export type ReplayMatchup = ReplayRate & { opponent: string };

/** La Leggendaria in una patch del Tracker, contando tutti e due i lati (`bothSides`). */
export type ReplayPatchStat = ReplayRate & {
  /** quota delle presenze in campo nella patch (0–1) */
  share: number;
  /** la fascia che darebbe la regola del 9/11 (ladder di questa patch, poi la Crimson Cup come allora) a questi numeri */
  ruleTier: ReplayTierOrNone;
  /** gli scontri contro le altre Leggendarie in quella patch, dal più giocato; specchi esclusi */
  matchups: ReplayMatchup[];
};

export type ReplayChange = {
  patch: string;
  patchLabel: string;
  kind: "buff" | "nerf" | "rework" | "deck";
  /** la nota ufficiale della modifica, nella lingua della pagina */
  note: string;
  from?: { mana?: number; power?: number; health?: number };
  to?: { mana?: number; power?: number; health?: number };
};

export type ReplayLegendary = {
  slug: string;
  name: string;
  /** scheda della carta, con la lingua */
  href: string;
  /** la carta del gioco (`GameCardFace`) */
  game: GameCardInput;
  /** carta da collezione ufficiale 480 px e 160 px, sola arte */
  image?: string;
  thumb?: string;
  art?: string;
  mana?: number;
  alignment?: "good" | "evil" | "neutral";
  /** la tier list di OriginsMeta, ferma alla lettura del 9/11 (tierlist.ts) */
  official: {
    tier: ReplayTierOrNone;
    /** la fascia del solo ladder, prima della Crimson Cup */
    ladderTier: ReplayTierOrNone;
    /** la Crimson Cup l'ha alzata di una fascia */
    boosted: boolean;
    rate: ReplayRate;
    /** posizione nella classifica ufficiale (1 = la migliore), per fascia e poi bordo basso */
    rank: number;
    crimson: { banRate: number; finalists: number } | null;
    changedAfterCrimson: boolean;
  };
  /** media delle tier list salvate dalla community (S=5 … D=1), se qualcuno l'ha classificata */
  community?: { tier: ReplayTier; avg: number };
  /** voti da 1 a 10: media e fascia (la fascia solo da 3 voti) */
  votes?: { tier?: ReplayTier; avg: number };
  /** in quanti mazzi pubblicati compare e posizione fra le Leggendarie */
  used: number;
  usedRank: number;
  /** le patch del Tracker, dalla più vecchia; mancano quelle in cui non è stata giocata */
  patches: Record<string, ReplayPatchStat>;
  /** modifiche ufficiali alla carta, dalla più vecchia (card-history.ts) */
  changes: ReplayChange[];
};

export type ReplayPatch = {
  id: string;
  label: string;
  date: string;
  /** le partite contate nel Tracker con la Leggendaria avversaria nota (ognuna una volta); 0 se il Tracker non ha letto */
  games: number;
  /** post Steam della patch */
  url: string;
  /** la news del sito sulla patch, con la lingua */
  news?: string;
  /** modifiche della patch a qualsiasi carta, quante */
  changeCount: number;
  /** le modifiche della patch per importanza (`patchChanges` di cards.ts), al massimo 8 */
  events: { slug: string; name: string; href: string; legendary: boolean; kind: ReplayChange["kind"]; note: string }[];
};

export type ReplayData = {
  locale: string;
  /** data della lettura delle fasce ufficiali (9/11) e patch da cui vengono */
  officialRead: string;
  officialReadLabel: string;
  officialPatch: string;
  officialGames: number;
  /** la news che spiega le fasce, con la lingua */
  officialNews: string;
  /** le patch del Tracker confrontate, dalla più vecchia (ea-1104 è quella delle fasce) */
  patches: ReplayPatch[];
  latestPatch: string;
  /** dalla migliore, nell'ordine della tier list ufficiale */
  legendaries: ReplayLegendary[];
  /** quando la pagina ha letto il Tracker */
  readAt: string;
  /** il Tracker non ha risposto: i numeri per patch mancano e la pagina lo dice */
  trackerMissing: boolean;
};
