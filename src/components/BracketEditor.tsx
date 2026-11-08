"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { roundLabel, roundsOf } from "@/lib/tournament/bracket";
import { fill, type TournamentMatch } from "@/lib/tournament/types";
import { swapPlayers } from "@/lib/tournament/actions";
import { BracketTabs, type BracketTab } from "./BracketTabs";

/** Un pezzo del tabellone (08/11/2026): un bracket della qualificazione o la fase finale, con le partite già rinumerate. */
export type EditorGroup = BracketTab & { matches: TournamentMatch[]; roundNames?: string[]; championLabel?: string };

type Props = {
  id: string;
  slug: string;
  matches: TournamentMatch[];
  names: Record<string, string>;
  labels: Dictionary["tournaments"];
  /** base del link alla stanza partita (l'organizzatore le apre tutte) */
  linkBase: string;
  /** torneo con la fase finale: una scheda per pezzo; lo scambio vale anche fra bracket diversi dello stesso turno */
  groups?: EditorGroup[];
  initialGroup?: string;
  tabsLabel?: string;
  mineLabel?: string;
};
type Selection = { matchId: string; round: number; uid: string } | null;

/**
 * Tabellone dell'organizzatore (pagina di gestione, torneo in corso): stessa griglia del tabellone pubblico, ma i
 * giocatori delle partite ancora da giocare sono cliccabili. Primo clic: selezione (evidenziata in menta); secondo
 * clic su un altro giocatore di una partita dello stesso turno: scambio (RPC swap_players, con lock sul torneo);
 * clic sullo stesso giocatore: annulla. Le partite già refertate o confermate non si toccano. Con la fase finale
 * (08/11/2026) le schede dividono bracket e Top; la selezione resta passando da una scheda all'altra.
 */
export function BracketEditor({ id, slug, matches, names, labels, linkBase, groups, initialGroup, tabsLabel, mineLabel }: Props) {
  const x = labels;
  const m = x.manage;
  const router = useRouter();
  const [sel, setSel] = useState<Selection>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!matches.length) return null;
  // il turno vero della partita (nelle schede della fase finale i turni ripartono da 1)
  const realRound = new Map(matches.map((mt) => [mt.id, mt.round]));
  const swappable = (mt: TournamentMatch) => mt.status === "pending" && Boolean(mt.player_a && mt.player_b);
  const nameOf = (uid: string | null, bye: boolean) => (bye ? "bye" : uid ? names[uid] ?? "?" : x.tbd);

  const click = (mt: TournamentMatch, uid: string) => {
    if (!swappable(mt) || pending) return;
    setError(null);
    setNotice(null);
    const round = realRound.get(mt.id) ?? mt.round;
    if (!sel) {
      setSel({ matchId: mt.id, round, uid });
      return;
    }
    if (sel.uid === uid) {
      setSel(null);
      return;
    }
    if (sel.round !== round) {
      setError(x.errors.bad_swap);
      return;
    }
    const other = sel.uid;
    start(async () => {
      const r = await swapPlayers(id, slug, other, uid);
      if (r.error) {
        setError(x.errors[r.error as keyof typeof x.errors] ?? x.errors.db);
        return;
      }
      setSel(null);
      setNotice(m.swapDone);
      router.refresh();
    });
  };

  const grid = (list: TournamentMatch[], roundNames?: string[], championLabel?: string) => {
    const size = list.filter((mt) => mt.round === 1).length * 2;
    if (size < 2) return null;
    const total = roundsOf(size);
    const rounds = Array.from({ length: total }, (_, i) => list.filter((mt) => mt.round === i + 1).sort((a, b) => a.position - b.position));
    const label = (r: number) => {
      if (roundNames?.[r - 1]) return roundNames[r - 1];
      const l = roundLabel(r, size);
      return typeof l === "string" ? x.rounds[l] : fill(x.rounds.of, { n: l.of });
    };
    const final = rounds[total - 1]?.[0];
    const champion = final && final.winner && (final.status === "confirmed" || final.status === "bye") ? final.winner : null;
    return (
      <div className="mt-3 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-6">
          {rounds.map((rl, i) => (
            <section key={i} className="flex w-60 flex-col">
              <h3 className="kicker mb-3 text-pale-muted">{label(i + 1)}</h3>
              <ol className="flex flex-1 flex-col justify-around gap-3">
                {rl.map((mt) => {
                  const can = swappable(mt);
                  const border = mt.status === "disputed" ? "border-bad" : mt.status === "reported" ? "border-gold" : can ? "border-sky" : "border-sky/60";
                  const slot = (uid: string | null, score: number | null, bye: boolean) => {
                    const winner = Boolean(mt.winner) && mt.winner === uid && uid !== null;
                    const selected = sel?.uid === uid && uid !== null;
                    const cls = `flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm ${winner ? "font-bold text-good" : bye || !uid ? "text-pale-muted" : "text-pale"} ${selected ? "bg-mint/20 ring-2 ring-inset ring-mint" : can ? "hover:bg-mint/10" : ""}`;
                    const inner = (
                      <>
                        <span className="truncate">{nameOf(uid, bye)}</span>
                        {score !== null ? <span className="font-mono text-xs">{score}</span> : null}
                      </>
                    );
                    return can && uid ? (
                      <button type="button" onClick={() => click(mt, uid)} disabled={pending} className={`${cls} cursor-pointer`} aria-pressed={selected}>
                        {inner}
                      </button>
                    ) : (
                      <p className={cls}>{inner}</p>
                    );
                  };
                  return (
                    <li key={mt.id} className={`overflow-hidden rounded-lg border-2 bg-night-2/70 ${border}`}>
                      {slot(mt.player_a, mt.score_a, false)}
                      <div className="mx-3 border-t border-sky/40" />
                      {slot(mt.player_b, mt.score_b, mt.status === "bye")}
                      <div className="flex items-center justify-between px-3 pb-1.5">
                        <span className={`font-mono text-[10px] uppercase ${mt.status === "disputed" ? "text-bad" : mt.status === "reported" ? "text-gold" : "text-pale-muted"}`}>
                          {m.statuses[mt.status]}
                          {mt.forfeit ? ` · ${m.forfeit}` : ""}
                        </span>
                        {mt.status !== "bye" && (mt.player_a || mt.player_b) ? (
                          <Link href={`${linkBase}${mt.id}`} className="font-mono text-[10px] uppercase text-mint hover:underline">
                            {x.openMatch} →
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
          {champion ? (
            <section className="flex w-60 flex-col">
              <h3 className="kicker mb-3 text-gold">{championLabel ?? x.winner}</h3>
              <div className="flex flex-1 items-center">
                <p className="w-full rounded-lg border-2 border-gold bg-gold/15 p-3 text-center font-display text-lg font-extrabold text-gold">★ {names[champion] ?? "?"}</p>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div>
      <p className={`mt-1 text-sm ${sel ? "font-semibold text-mint" : "text-pale-muted"}`}>{sel ? fill(m.swapSelected, { name: names[sel.uid] ?? "?" }) : m.swapClickHint}</p>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-bad">
          {error}
        </p>
      ) : null}
      {notice && !error ? (
        <p role="status" className="mt-1 text-sm text-good">
          {notice}
        </p>
      ) : null}
      {groups?.length ? (
        <div className="mt-3">
          <BracketTabs tabs={groups} initial={initialGroup ?? groups[0].id} label={tabsLabel ?? x.bracket} mineLabel={mineLabel ?? ""}>
            {groups.map((g) => (
              <div key={g.id}>
                <h3 className={`kicker ${g.top ? "text-gold" : "text-mint"}`}>{g.label}</h3>
                {grid(g.matches, g.roundNames, g.championLabel)}
              </div>
            ))}
          </BracketTabs>
        </div>
      ) : (
        grid(matches)
      )}
    </div>
  );
}
