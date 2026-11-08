import type { Dictionary, Locale } from "@/lib/i18n";
import { roundLabel } from "./bracket";
import { matchStage, podLetter, type StagePlan } from "./stages";
import { stageLabels } from "./stageLabels";
import { fill } from "./types";

/**
 * Nome di una partita nel torneo (08/11/2026): "Bracket C · Turno 2", "Bracket C · Finale del bracket",
 * "Top 16 · Quarti di finale", oppure, senza fase finale, il nome di sempre ("Semifinali", "Turno dei 32"). Da usare sul
 * server: le etichette di tutte le lingue non vanno nei chunk del browser, ai componenti client si passano le stringhe.
 */
export function stageMatchName(locale: Locale, x: Dictionary["tournaments"], plan: StagePlan, round: number, position: number): string {
  const s = stageLabels[locale];
  const st = matchStage(plan, round, position);
  const plain = (r: number, size: number) => {
    try {
      const l = roundLabel(r, size);
      return typeof l === "string" ? x.rounds[l] : fill(x.rounds.of, { n: l.of });
    } catch {
      return fill(x.match.round, { n: r });
    }
  };
  if (st.phase === "single") return plain(round, plan.size);
  if (st.phase === "top") return `${fill(s.top, { n: plan.topCut ?? 0 })} · ${plain(st.round, plan.topCut ?? 2)}`;
  return `${fill(s.pod, { letter: podLetter(st.pod) })} · ${st.last ? s.podFinal : fill(s.podRound, { n: st.round })}`;
}

/** Nomi di tutte le partite, per id: le liste dello staff (coda, turni) li mostrano senza ricalcolarli nel browser. */
export function stageMatchNames(locale: Locale, x: Dictionary["tournaments"], plan: StagePlan, matches: { id: string; round: number; position: number }[]): Record<string, string> {
  return Object.fromEntries(matches.map((m) => [m.id, stageMatchName(locale, x, plan, m.round, m.position)]));
}

/** Nome di un turno intero nella lista dello staff: "Turno 2", "Turno 4 · Finale del bracket", "Top 16 · Quarti di finale". */
export function stageRoundTitle(locale: Locale, x: Dictionary["tournaments"], plan: StagePlan, round: number): string {
  const s = stageLabels[locale];
  if (plan.topRound === null) return fill(x.manage.roundTitle, { n: round });
  if (round >= plan.topRound) return stageMatchName(locale, x, plan, round, 0);
  return round === plan.podRounds ? `${fill(x.manage.roundTitle, { n: round })} · ${s.podFinal}` : fill(x.manage.roundTitle, { n: round });
}
