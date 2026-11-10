import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { fill, type TournamentMatch } from "@/lib/tournament/types";
import { groupLetter } from "@/lib/tournament/formats";
import type { FormatLabels } from "@/lib/tournament/formatLabels";

type Props = {
  matches: TournamentMatch[];
  names: Map<string, string>;
  /** turni previsti (svizzera) o del calendario dei gironi */
  total: number;
  groups: boolean;
  dict: Dictionary;
  labels: FormatLabels;
  /** link alle stanze: le proprie per chi gioca, tutte per lo staff */
  open: { linkBase: string; viewer: string | null; all: boolean };
};

/**
 * Turni della svizzera o dei gironi (09/11/2026): un riquadro a fisarmonica per turno, aperto quello in corso, con le
 * partite (nei gironi con la lettera del girone), il punteggio e il link alla stanza per chi gioca e per lo staff.
 */
export function FormatRounds({ matches, names, total, groups, dict, labels, open }: Props) {
  const fl = labels;
  const x = dict.tournaments;
  const stage = matches.filter((m) => m.stage === "swiss" || m.stage === "group");
  if (!stage.length) return null;
  const rounds = [...new Set(stage.map((m) => m.round))].sort((a, b) => a - b);
  const live = rounds.find((r) => stage.some((m) => m.round === r && (m.status === "pending" || m.status === "reported" || m.status === "disputed"))) ?? rounds.at(-1);
  const name = (id: string | null) => (id ? (names.get(id) ?? "?") : x.tbd);
  return (
    <div className="mt-3 grid gap-2">
      {rounds.map((r) => {
        const list = stage.filter((m) => m.round === r).sort((a, b) => a.position - b.position);
        const done = list.filter((m) => m.status === "confirmed" || m.status === "bye").length;
        const mineHere = open.viewer ? list.some((m) => m.player_a === open.viewer || m.player_b === open.viewer) : false;
        return (
          <details key={r} open={r === live} className="group rounded-lg border-2 border-sky bg-night-2/60 p-3">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
              <span className="t-item text-base">{groups ? fill(fl.groupsRound, { n: r }) : total ? fill(fl.swissRoundOf, { n: r, total }) : fill(fl.swissRound, { n: r })}</span>
              <span className="font-mono text-[11px] text-pale-muted">{fill(fl.roundDone, { done, total: list.length })}</span>
              {mineHere ? <span className="stat-pill bg-mint !px-2 !py-0 text-[10px] font-bold uppercase text-ink">{x.match.you}</span> : null}
              <span aria-hidden="true" className="ml-auto font-mono text-sky transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {list.map((m) => {
                const mine = Boolean(open.viewer && (m.player_a === open.viewer || m.player_b === open.viewer));
                const link = m.status !== "bye" && m.player_a && m.player_b && (open.all || mine);
                const body = (
                  <>
                    {groups && m.grp != null ? <span className="font-mono text-[10px] uppercase text-mint">{fill(fl.group, { letter: groupLetter(m.grp) })}</span> : null}
                    <span className="flex items-center justify-between gap-2">
                      <span className={`min-w-0 truncate ${m.winner && m.winner === m.player_a ? "font-bold text-good" : "text-pale"}`}>{name(m.player_a)}</span>
                      <span className="font-mono text-xs text-pale-muted">{m.status === "bye" ? "" : (m.score_a ?? "·")}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={`min-w-0 truncate ${m.status === "bye" ? "text-pale-muted" : m.winner && m.winner === m.player_b ? "font-bold text-good" : "text-pale"}`}>{m.status === "bye" ? fl.bye : name(m.player_b)}</span>
                      <span className="font-mono text-xs text-pale-muted">{m.status === "bye" ? "" : (m.score_b ?? "·")}</span>
                    </span>
                    {m.status === "disputed" || m.status === "reported" ? <span className="font-mono text-[10px] uppercase text-gold">{x.manage.statuses[m.status]}</span> : null}
                  </>
                );
                const cls = `flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-sm ${mine ? "border-mint bg-mint/10" : "border-sky/60 bg-night/60"}`;
                return (
                  <li key={m.id}>
                    {link ? (
                      <Link href={`${open.linkBase}${m.id}`} className={`${cls} hover:border-mint`}>
                        {body}
                      </Link>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
