import type { Dictionary } from "@/lib/i18n";
import { roundLabel, roundsOf } from "@/lib/tournament/bracket";
import { fill, type TournamentMatch } from "@/lib/tournament/types";

type Names = Map<string, string>;

/**
 * Tabellone a eliminazione diretta: una colonna per turno, partite distribuite in altezza, vincitore in oro.
 * Server component senza librerie; la griglia scorre in orizzontale dentro il proprio contenitore.
 * `highlight` evidenzia le partite di un giocatore (per esempio chi guarda).
 */
export function Bracket({ matches, names, dict, highlight }: { matches: TournamentMatch[]; names: Names; dict: Dictionary; highlight?: string | null }) {
  const x = dict.tournaments;
  if (!matches.length) return null;
  const size = matches.filter((m) => m.round === 1).length * 2;
  const total = roundsOf(size);
  const rounds: TournamentMatch[][] = [];
  for (let r = 1; r <= total; r++) rounds.push(matches.filter((m) => m.round === r).sort((a, b) => a.position - b.position));
  const label = (r: number) => {
    const l = roundLabel(r, size);
    return typeof l === "string" ? x.rounds[l] : fill(x.rounds.of, { n: l.of });
  };
  const final = rounds[total - 1]?.[0];
  const champion = final && final.winner && (final.status === "confirmed" || final.status === "bye") ? final.winner : null;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-6">
        {rounds.map((list, i) => (
          <section key={i} className="flex w-60 flex-col">
            <h3 className="kicker mb-3 text-pale-muted">{label(i + 1)}</h3>
            <ol className="flex flex-1 flex-col justify-around gap-3">
              {list.map((m) => (
                <MatchBox key={m.id} m={m} names={names} dict={dict} highlight={highlight} />
              ))}
            </ol>
          </section>
        ))}
        {champion ? (
          <section className="flex w-60 flex-col">
            <h3 className="kicker mb-3 text-gold">{x.winner}</h3>
            <div className="flex flex-1 items-center">
              <p className="w-full rounded-lg border-2 border-gold bg-gold/15 p-3 text-center font-display text-lg font-extrabold text-gold">★ {names.get(champion) ?? "?"}</p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Row({ id, score, winner, bye, names, dict, me }: { id: string | null; score: number | null; winner: boolean; bye: boolean; names: Names; dict: Dictionary; me: boolean }) {
  const x = dict.tournaments;
  const name = bye ? "bye" : id ? names.get(id) ?? "?" : x.tbd;
  return (
    <p className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm ${winner ? "font-bold text-good" : bye || !id ? "text-pale-muted" : "text-pale"} ${me ? "bg-mint/10" : ""}`}>
      <span className="truncate">{name}</span>
      {score !== null ? <span className="font-mono text-xs">{score}</span> : null}
    </p>
  );
}

export function MatchBox({ m, names, dict, highlight }: { m: TournamentMatch; names: Names; dict: Dictionary; highlight?: string | null }) {
  const x = dict.tournaments;
  const mine = Boolean(highlight && (m.player_a === highlight || m.player_b === highlight));
  const border = m.status === "disputed" ? "border-bad" : m.status === "reported" ? "border-gold" : mine ? "border-mint" : "border-sky";
  return (
    <li className={`overflow-hidden rounded-lg border-2 bg-night-2/70 ${border}`}>
      <Row id={m.player_a} score={m.score_a} winner={Boolean(m.winner) && m.winner === m.player_a} bye={false} names={names} dict={dict} me={highlight === m.player_a && Boolean(highlight)} />
      <div className="mx-3 border-t border-sky/40" />
      <Row id={m.player_b} score={m.score_b} winner={Boolean(m.winner) && m.winner === m.player_b} bye={m.status === "bye"} names={names} dict={dict} me={highlight === m.player_b && Boolean(highlight)} />
      {m.status === "reported" || m.status === "disputed" ? <p className={`px-3 pb-1.5 font-mono text-[10px] uppercase ${m.status === "disputed" ? "text-bad" : "text-gold"}`}>{x.manage.statuses[m.status]}</p> : null}
      {m.forfeit ? <p className="px-3 pb-1.5 font-mono text-[10px] uppercase text-pale-muted">{x.manage.forfeit}</p> : null}
    </li>
  );
}
