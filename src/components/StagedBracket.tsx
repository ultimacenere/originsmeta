import type { Dictionary, Locale } from "@/lib/i18n";
import { fill, type TournamentMatch } from "@/lib/tournament/types";
import { podLetter, podMatches, podOf, podWinner, podsDone, topMatches, type StagePlan } from "@/lib/tournament/stages";
import { stageLabels } from "@/lib/tournament/stageLabels";
import { Bracket } from "./Bracket";
import { BracketTabs, type BracketTab } from "./BracketTabs";

type Open = { linkBase: string; viewer?: string | null; all?: boolean };

/** Nomi dei turni di un bracket della qualificazione: "Turno 1" … e l'ultimo "Finale del bracket". */
export function podRoundNames(locale: Locale, plan: StagePlan): string[] {
  const s = stageLabels[locale];
  return Array.from({ length: plan.podRounds }, (_, i) => (i + 1 === plan.podRounds ? s.podFinal : fill(s.podRound, { n: i + 1 })));
}

/**
 * Tabellone di un torneo con la qualificazione a bracket e la fase finale (08/11/2026): una scheda per bracket (A, B, …)
 * e una per la Top N, ognuna con il tabellone di sempre (`Bracket`) sulle partite rinumerate da stages.ts. Server
 * component: i pannelli stanno tutti nell'HTML, `BracketTabs` sceglie quale si vede. Si apre sul bracket di chi guarda
 * (o sulla Top se ci è arrivato), altrimenti sul primo bracket ancora in gioco; a qualificazioni finite sulla Top.
 */
export function StagedBracket({ matches, plan, names, dict, locale, open, holdFrom }: { matches: TournamentMatch[]; plan: StagePlan; names: Map<string, string>; dict: Dictionary; locale: Locale; open?: Open; holdFrom: number | null }) {
  const s = stageLabels[locale];
  const cut = plan.topCut ?? 0;
  const topRound = plan.topRound ?? 1;
  const viewer = open?.viewer ?? null;
  const myPod = podOf(matches, plan, viewer);
  const inTop = Boolean(viewer && matches.some((m) => m.round >= topRound && (m.player_a === viewer || m.player_b === viewer)));
  const done = podsDone(matches, plan);
  const winners = Array.from({ length: plan.pods }, (_, p) => podWinner(matches, plan, p));
  const firstOpen = winners.findIndex((w) => !w);
  // a Top avviata, chi non gioca in un bracket (spettatori, staff, eliminati) la vede per prima
  const topLive = matches.some((m) => m.round >= topRound && (m.ready_at || m.status === "confirmed"));
  const myPodOpen = myPod !== null && !winners[myPod];
  const initial = inTop || done === plan.pods || (topLive && !myPodOpen) ? "top" : myPod !== null ? podLetter(myPod) : podLetter(Math.max(0, firstOpen));
  const tabs: BracketTab[] = [
    ...winners.map((w, p) => ({ id: podLetter(p), short: podLetter(p), label: fill(s.pod, { letter: podLetter(p) }), done: Boolean(w), mine: p === myPod })),
    { id: "top", short: fill(s.top, { n: cut }), label: fill(s.top, { n: cut }), top: true, mine: inTop },
  ];
  const roundNames = podRoundNames(locale, plan);
  const topList = topMatches(matches, plan);
  const filled = topList.filter((m) => m.round === 1).reduce((n, m) => n + (m.player_a ? 1 : 0) + (m.player_b ? 1 : 0), 0);

  return (
    <div>
      <p className="mb-3 text-sm text-pale-muted">
        <span className="font-mono text-pale">{fill(s.podsStatus, { done, total: plan.pods })}</span>
        {holdFrom !== null ? <span className="ml-2 text-gold">· {fill(s.holdStatus, { n: cut })}</span> : null}
      </p>
      <BracketTabs tabs={tabs} initial={initial} label={s.tabsLabel} mineLabel={s.yours}>
        {[
          ...winners.map((_, p) => (
            <div key={podLetter(p)}>
              <h3 className="kicker mb-2 text-mint">{fill(s.pod, { letter: podLetter(p) })}</h3>
              <Bracket matches={podMatches(matches, plan, p)} names={names} dict={dict} open={open} roundNames={roundNames} championLabel={fill(s.podWinner, { n: cut })} />
            </div>
          )),
          <div key="top">
            <h3 className="kicker mb-2 text-gold">{fill(s.top, { n: cut })}</h3>
            {filled < cut ? <p className="mb-3 text-sm text-pale-muted">{fill(s.topWaiting, { n: cut })}</p> : null}
            {holdFrom !== null ? <p className="mb-3 rounded-lg border-2 border-gold bg-gold/10 px-3 py-2 text-sm text-pale">{fill(s.holdRule, { n: cut })}</p> : null}
            <Bracket matches={topList} names={names} dict={dict} open={open} />
          </div>,
        ]}
      </BracketTabs>
    </div>
  );
}
