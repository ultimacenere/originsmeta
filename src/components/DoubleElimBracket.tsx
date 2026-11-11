import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { deCount, deRound, deSlotOf, deWinnerTo, type DePlan, type DeStage } from "@/lib/tournament/doubleElim";
import type { DoubleElimLabels } from "@/lib/tournament/doubleElimLabels";
import { groupLetter } from "@/lib/tournament/formats";
import { fill, type TournamentMatch } from "@/lib/tournament/types";
import { MatchBox } from "./Bracket";

type Open = { linkBase: string; viewer?: string | null; all?: boolean };

/** Scheda dei tabelloni: "A-w" (vincenti del tabellone A), "A-l" (perdenti), dal parametro `?b=`. */
export type DePanel = { pool: number; stage: DeStage };

export function dePanelId(p: DePanel): string {
  return `${groupLetter(p.pool)}-${p.stage === "upper" ? "w" : "l"}`;
}

/** Legge `?b=`; se manca o non vale, la scheda di chi guarda (la sua partita più avanzata) o i vincenti del tabellone A. */
export function dePanelOf(raw: string | undefined, plan: DePlan, matches: TournamentMatch[], viewer: string | null): DePanel {
  const m = /^([A-Z]{1,2})-([wl])$/.exec(raw ?? "");
  if (m) {
    const pool = [...Array(plan.pools).keys()].find((p) => groupLetter(p) === m[1]);
    if (pool !== undefined) return { pool, stage: m[2] === "w" ? "upper" : "lower" };
  }
  if (viewer) {
    const mine = matches.filter((x) => (x.stage === "upper" || x.stage === "lower") && (x.player_a === viewer || x.player_b === viewer)).sort((a, b) => b.round - a.round)[0];
    const s = mine ? deSlotOf(plan, mine) : null;
    if (s) return { pool: s.pool, stage: s.stage };
  }
  return { pool: 0, stage: "upper" };
}

/** Nome di una scheda: "Tabellone A · Vincenti"; con un solo tabellone (11/11/2026) "Tabellone dei vincenti". */
function panelName(l: DoubleElimLabels, plan: DePlan, p: DePanel): string {
  if (plan.pools === 1) return p.stage === "upper" ? l.upperBracket : l.lowerBracket;
  return `${fill(l.pool, { letter: groupLetter(p.pool) })} · ${p.stage === "upper" ? l.upper : l.lower}`;
}

/** I qualificati di un lato di un tabellone, nell'ordine delle partite dell'ultimo turno. */
function qualifiedIn(plan: DePlan, matches: TournamentMatch[], pool: number, stage: DeStage): string[] {
  return matches
    .filter((m) => {
      const s = deSlotOf(plan, m);
      return s && s.pool === pool && s.stage === stage && m.winner && (m.status === "confirmed" || m.status === "bye") && deWinnerTo(plan, s) === "qualified";
    })
    .sort((a, b) => a.position - b.position)
    .map((m) => m.winner as string);
}

/**
 * I qualificati di una qualificazione senza fase finale (11/11/2026): sono il risultato del torneo, quindi stanno tutti
 * insieme sopra i tabelloni, un riquadro per lato (e per tabellone), ognuno con quanti ne mancano. Server component.
 */
export function DeQualified({ matches, plan, names, labels, viewer }: { matches: TournamentMatch[]; plan: DePlan; names: Map<string, string>; labels: DoubleElimLabels; viewer?: string | null }) {
  const l = labels;
  const groups: { key: string; name: string; list: string[] }[] = [];
  for (let p = 0; p < plan.pools; p++)
    for (const stage of ["upper", "lower"] as const) groups.push({ key: dePanelId({ pool: p, stage }), name: panelName(l, plan, { pool: p, stage }), list: qualifiedIn(plan, matches, p, stage) });
  const total = groups.reduce((n, g) => n + g.list.length, 0);
  return (
    <section className="mb-6 rounded-xl border-2 border-gold bg-gold/5 p-4">
      <h3 className="t-item text-gold">
        {l.qualifiedTitle} <span className="font-mono text-sm">{total}/{plan.pools * plan.qualify * 2}</span>
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.key}>
            <h4 className="kicker text-pale-muted">
              {g.name} <span className="font-mono">{g.list.length}/{plan.qualify}</span>
            </h4>
            {g.list.length ? (
              <ol className="mt-2 flex flex-wrap gap-1.5">
                {g.list.map((u) => (
                  <li key={u} className={`max-w-full truncate rounded-lg border-2 border-gold bg-gold/10 px-2 py-1 text-xs font-semibold text-gold ${u === viewer ? "ring-2 ring-mint" : ""}`}>
                    ★ {names.get(u) ?? "?"}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 font-mono text-xs text-pale-muted">—</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Nome di un turno dentro un lato: "Turno 2", e l'ultimo "Turno di qualificazione". */
function roundName(l: DoubleElimLabels, plan: DePlan, stage: DeStage, local: number): string {
  const last = stage === "upper" ? plan.upperRounds : plan.lowerRounds;
  return local === last ? l.qualifyingRound : fill(l.round, { n: local });
}

/**
 * Qualificazione a doppia eliminazione (10/11/2026): una fila di schede (vincenti e perdenti di ogni tabellone) e, sotto,
 * solo la scheda scelta, con una colonna per turno e l'ultima con i qualificati. Le schede sono link (`?b=A-w#bracket`):
 * il server disegna una scheda alla volta, perché due tabelloni da 512 sono 1856 partite e tutte insieme peserebbero
 * troppo sulla pagina. Server component.
 */
export function DoubleElimBracket({ matches, plan, names, dict, labels, panel, hrefFor, open }: { matches: TournamentMatch[]; plan: DePlan; names: Map<string, string>; dict: Dictionary; labels: DoubleElimLabels; panel: DePanel; hrefFor: (id: string) => string; open?: Open }) {
  const l = labels;
  const viewer = open?.viewer ?? null;
  const de = matches.filter((m) => m.stage === "upper" || m.stage === "lower");
  const done = de.filter((m) => m.status === "confirmed" || m.status === "bye").length;
  const qualifiedOf = (pool: number, stage: DeStage) => qualifiedIn(plan, de, pool, stage);
  let totalQualified = 0;
  for (let p = 0; p < plan.pools; p++) totalQualified += qualifiedOf(p, "upper").length + qualifiedOf(p, "lower").length;
  const mineIn = (pool: number, stage: DeStage) => Boolean(viewer && de.some((m) => m.grp === pool && m.stage === stage && (m.player_a === viewer || m.player_b === viewer)));
  const tabs: { id: string; label: string; on: boolean; mine: boolean; full: boolean }[] = [];
  for (let p = 0; p < plan.pools; p++)
    for (const stage of ["upper", "lower"] as const) {
      const id = dePanelId({ pool: p, stage });
      tabs.push({ id, label: panelName(l, plan, { pool: p, stage }), on: p === panel.pool && stage === panel.stage, mine: mineIn(p, stage), full: qualifiedOf(p, stage).length === plan.qualify });
    }
  const rounds = panel.stage === "upper" ? plan.upperRounds : plan.lowerRounds;
  const columns: { name: string; list: TournamentMatch[] }[] = [];
  for (let local = 1; local <= rounds; local++) {
    const round = deRound(plan, panel.stage, local);
    const c = deCount(plan, panel.stage, local);
    const lo = panel.pool * c;
    columns.push({
      name: roundName(l, plan, panel.stage, local),
      list: de.filter((m) => m.stage === panel.stage && m.round === round && m.position >= lo && m.position < lo + c).sort((a, b) => a.position - b.position),
    });
  }
  const qualified = qualifiedOf(panel.pool, panel.stage);

  return (
    <div>
      <p className="mb-3 text-sm text-pale-muted">
        <span className="font-mono text-pale">{fill(l.status, { done, total: de.length })}</span>
        <span className="ml-2 font-mono">· {fill(l.qualifiedStatus, { done: totalQualified, total: plan.pools * plan.qualify * 2 })}</span>
      </p>
      <nav aria-label={l.tabsLabel} className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={hrefFor(t.id)}
            scroll={false}
            aria-current={t.on ? "page" : undefined}
            className={`rounded-lg border-2 px-3 py-1.5 text-xs font-semibold ${t.on ? "border-mint bg-mint/15 text-pale" : "border-sky text-pale-muted hover:border-mint hover:text-pale"}`}
          >
            {t.full ? "✓ " : ""}
            {t.label}
            {t.mine ? <span className="ml-1.5 rounded bg-mint px-1.5 py-px font-mono text-[10px] font-bold uppercase text-ink">{l.yours}</span> : null}
          </Link>
        ))}
      </nav>
      <h3 className="kicker mb-2 text-mint">{panelName(l, plan, panel)}</h3>
      <div className="relative">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-6">
            {columns.map((col, i) => (
              <section key={i} className="flex w-60 flex-col">
                <h4 className="kicker mb-3 text-pale-muted">{col.name}</h4>
                <ol className="flex flex-1 flex-col justify-around gap-3">
                  {col.list.map((m) => (
                    <MatchBox key={m.id} m={m} names={names} dict={dict} highlight={viewer} open={open} />
                  ))}
                </ol>
              </section>
            ))}
            <section className="flex w-60 flex-col">
              <h4 className="kicker mb-3 text-gold">
                {l.qualified} <span className="font-mono">{qualified.length}/{plan.qualify}</span>
              </h4>
              <ol className="flex flex-col gap-1.5">
                {qualified.map((u) => (
                  <li key={u} className={`truncate rounded-lg border-2 border-gold bg-gold/10 px-3 py-1.5 text-sm font-semibold text-gold ${u === viewer ? "ring-2 ring-mint" : ""}`}>
                    ★ {names.get(u) ?? "?"}
                  </li>
                ))}
              </ol>
            </section>
            <div className="w-6 shrink-0" aria-hidden="true" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-night-2 to-transparent" aria-hidden="true" />
      </div>
    </div>
  );
}
