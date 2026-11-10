import type { Dictionary, Locale } from "@/lib/i18n";
import { roundLabel } from "./bracket";
import { bracketRenumbered, championOf, groupLetter, openStageMatches, stageRounds } from "./formats";
import { formatLabels } from "./formatLabels";
import { stageLabels } from "./stageLabels";
import { fill, type TournamentMatch } from "./types";

/**
 * Come le pagine mostrano svizzera e gironi (09/11/2026): fasi, nomi delle partite e dei turni, pausa della fase finale,
 * semifinalisti. Da usare sul server (come stageNames.ts): ai componenti client si passano le stringhe.
 */
export type FormatView = {
  /** turni della svizzera o dei gironi creati finora e previsti */
  stageRounds: number;
  plannedRounds: number;
  /** partite del tabellone della fase finale, rinumerate dal turno 1, e il turno dopo cui cominciano */
  bracket: TournamentMatch[];
  base: number;
  /** ultimo turno del tabellone (la finale, per `final_best_of`): 0 finché non c'è */
  finalRound: number;
  /** primo turno della fase finale in pausa (numerazione vera), oppure null */
  holdFrom: number | null;
  /** posti della fase finale: la Top della svizzera o i qualificati dei gironi (null = svizzera senza Top) */
  cut: number | null;
  /** chi passa da ogni girone (gironi) o i posti della Top (svizzera) */
  qualify: number | null;
  /** semifinalisti e oltre (liste segrete: le loro liste sono pubbliche), come tm_in_top4 */
  top4: Set<string>;
  champion: string | null;
  open: number;
};

export function formatView(
  t: { format: string; top_cut?: number | null; top_cut_hold?: boolean; top_cut_released_at?: string | null; swiss_rounds?: number | null; group_advance?: number | null },
  matches: TournamentMatch[],
): FormatView {
  const { matches: bracket, base } = bracketRenumbered(matches);
  const finalRound = bracket.length ? base + Math.max(...bracket.map((m) => m.round)) : 0;
  const sr = stageRounds(matches);
  const plannedRounds = t.format === "swiss" ? (t.swiss_rounds ?? sr) : sr;
  const holdFrom = t.top_cut_hold && !t.top_cut_released_at && bracket.length ? base + 1 : null;
  const top4 = new Set<string>();
  if (finalRound) for (const m of matches) if (!m.stage && m.round >= finalRound - 1) for (const u of [m.player_a, m.player_b]) if (u) top4.add(u);
  const qualify = t.format === "groups" ? (t.group_advance ?? null) : (t.top_cut ?? null);
  const firstRound = bracket.filter((m) => m.round === 1);
  const cut = t.format === "groups" ? (firstRound.length ? firstRound.filter((m) => m.player_a).length + firstRound.filter((m) => m.player_b).length : null) : (t.top_cut ?? null);
  return { stageRounds: sr, plannedRounds, bracket, base, finalRound, holdFrom, cut, qualify, top4, champion: championOf(matches), open: openStageMatches(matches).length };
}

function plain(x: Dictionary["tournaments"], r: number, size: number): string {
  try {
    const l = roundLabel(r, size);
    return typeof l === "string" ? x.rounds[l] : fill(x.rounds.of, { n: l.of });
  } catch {
    return fill(x.match.round, { n: r });
  }
}

/** "Svizzera · Turno 3", "Girone B · Turno 2", "Top 8 · Semifinali", "Fase finale · Quarti di finale". */
export function formatMatchName(locale: Locale, x: Dictionary["tournaments"], format: string, view: FormatView, m: { round: number; stage?: string | null; grp?: number | null }): string {
  const fl = formatLabels[locale];
  if (m.stage === "swiss" || m.stage === "champion") return fill(fl.swissMatch, { n: m.round });
  if (m.stage === "group") return fill(fl.groupMatch, { letter: groupLetter(m.grp ?? 0), n: m.round });
  const size = view.bracket.filter((b) => b.round === 1).length * 2;
  const name = plain(x, m.round - view.base, size || 2);
  return format === "swiss" ? `${fill(stageLabels[locale].top, { n: view.cut ?? size })} · ${name}` : fill(fl.finalStageMatch, { round: name });
}

/** Nomi di tutte le partite per id (coda dello staff, turni). */
export function formatMatchNames(locale: Locale, x: Dictionary["tournaments"], format: string, view: FormatView, matches: TournamentMatch[]): Record<string, string> {
  return Object.fromEntries(matches.map((m) => [m.id, formatMatchName(locale, x, format, view, m)]));
}

/** Nome di un turno nella lista dello staff: "Svizzera · Turno 3", "Gironi · Turno 2", "Top 8 · Finale". */
export function formatRoundTitle(locale: Locale, x: Dictionary["tournaments"], format: string, view: FormatView, round: number): string {
  const fl = formatLabels[locale];
  if (view.finalRound && round > view.base) return formatMatchName(locale, x, format, view, { round, stage: null });
  return format === "groups" ? fill(fl.groupsRound, { n: round }) : fill(fl.swissMatch, { n: round });
}
