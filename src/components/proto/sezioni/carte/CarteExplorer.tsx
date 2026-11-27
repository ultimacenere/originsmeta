"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GameCardFace } from "@/components/GameCard";
import type { GameCardInput } from "@/game-card/model";
import type { Num } from "@/lib/proto/analyticsProto";
import type { Move } from "@/lib/proto/sezioni";
import { MoveTag } from "@/components/proto/sezioni/parts";
import "./carte.css";

/*
  Carte del prototipo «Analytics a sezioni» (27/11/2026): tabella ordinabile e vista «Quando si gioca» (carte divise per
  round medio), filtro per costo in mana come nel gioco.
*/

const L = {
  views: "Vista",
  table: "Tabella",
  when: "Quando si gioca",
  mana: "Costo in mana",
  manaAll: "Tutti",
  card: "Carta",
  cost: "Mana",
  share: "Nei mazzi",
  deck: "Nel mazzo",
  played: "Giocata",
  turn: "Round",
  vsPrev: (label: string) => `Rispetto a ${label}`,
  sortBy: (c: string) => `Ordina per ${c}`,
  games: (n: number) => `${n.toLocaleString("it-IT")} ${n === 1 ? "partita" : "partite"}`,
  shareMoveSr: "quota nei mazzi",
  wrMoveSr: "win rate nel mazzo",
  round: (t: string) => `round ${t}`,
  buckets: {
    early: { title: "Inizio partita", sub: "Si giocano entro il round 3" },
    mid: { title: "Metà partita", sub: "Fra il round 3 e il 6" },
    late: { title: "Fine partita", sub: "Dopo il round 6" },
    never: { title: "Mai vista giocare", sub: "Nei mazzi, ma nessuna giocata registrata" },
  },
  inDecks: (p: string) => `nel ${p} dei mazzi`,
  none: "Nessuna carta con questo costo.",
};

export type CRow = {
  slug: string;
  name: string;
  mana: number | null;
  legendary: boolean;
  spell: boolean;
  input: GameCardInput;
  share: number;
  deck: Num;
  played: Num | null;
  turn: number | null;
  shareMove: Move | null;
  wrMove: Move | null;
};

type SortKey = "name" | "mana" | "share" | "deck" | "played" | "turn" | "move";
const MANA = [0, 1, 2, 3, 4, 5, 6, 7] as const; // 7 = 7 o più
const pct = (r: number, d = 0) => `${(r * 100).toLocaleString("it-IT", { maximumFractionDigits: d, minimumFractionDigits: d })}%`;
const dec = (t: number) => t.toLocaleString("it-IT", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const bucketOf = (t: number | null) => (t === null ? "never" : t <= 3 ? "early" : t <= 6 ? "mid" : "late");

export function CarteExplorer({ rows, prevLabel }: { rows: CRow[]; prevLabel: string | null }) {
  const [view, setView] = useState<"table" | "when">("table");
  const [mana, setMana] = useState<number | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "share", desc: true });

  const filtered = useMemo(() => (mana === null ? rows : rows.filter((r) => (mana === 7 ? (r.mana ?? 0) >= 7 : r.mana === mana))), [rows, mana]);
  const sorted = useMemo(() => {
    const v = (r: CRow): number | string => {
      switch (sort.key) {
        case "name":
          return r.name;
        case "mana":
          return r.mana ?? -1;
        case "share":
          return r.share;
        case "deck":
          return r.deck.r;
        case "played":
          return r.played?.r ?? -1;
        case "turn":
          return r.turn ?? 99;
        case "move":
          return r.shareMove?.points ?? -999;
      }
    };
    return [...filtered].sort((a, b) => {
      const x = v(a);
      const y = v(b);
      const c = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
      return (sort.desc ? -c : c) || b.share - a.share;
    });
  }, [filtered, sort]);

  const th = (key: SortKey, label: string, cls = "") => (
    <th scope="col" className={cls} aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button type="button" className="ct-sort" aria-label={L.sortBy(label)} onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== "name" && key !== "mana" && key !== "turn" }))}>
        {label}
        {sort.key === key ? <span aria-hidden="true">{sort.desc ? " ▾" : " ▴"}</span> : null}
      </button>
    </th>
  );

  return (
    <div className="mt-4">
      <div className="ct-bar">
        <div className="ct-views" role="group" aria-label={L.views}>
          {(["table", "when"] as const).map((k) => (
            <button key={k} type="button" className={`ct-view${view === k ? " is-on" : ""}`} aria-pressed={view === k} onClick={() => setView(k)}>
              {k === "table" ? L.table : L.when}
            </button>
          ))}
        </div>
        <div className="ct-mana" role="group" aria-label={L.mana}>
          <button type="button" className={`ct-gem is-all${mana === null ? " is-on" : ""}`} aria-pressed={mana === null} onClick={() => setMana(null)}>
            {L.manaAll}
          </button>
          {MANA.map((m) => (
            <button key={m} type="button" className={`ct-gem${mana === m ? " is-on" : ""}`} aria-pressed={mana === m} aria-label={`${L.cost} ${m === 7 ? "7+" : m}`} onClick={() => setMana(mana === m ? null : m)}>
              {m === 7 ? "7+" : m}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length ? <p className="sez-note mt-4">{L.none}</p> : null}

      {view === "table" && filtered.length ? (
        <div className="ct-table-wrap">
          <table className="ct-table">
            <thead>
              <tr>
                {th("name", L.card, "ct-name-col")}
                {th("mana", L.cost, "max-sm:hidden")}
                {th("share", L.share)}
                {th("deck", L.deck)}
                {th("played", L.played, "max-sm:hidden")}
                {th("turn", L.turn)}
                {prevLabel ? th("move", L.vsPrev(prevLabel), "max-md:hidden") : null}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.slug} className={r.deck.games < 20 ? "sez-thin" : undefined}>
                  <th scope="row" className="ct-name-col">
                    <Link href={`/it/cards/${r.slug}`} prefetch={false} className="ct-name">
                      {r.legendary ? <span className="legendary-star" aria-hidden="true">★</span> : null}
                      {r.name}
                    </Link>
                  </th>
                  <td className="max-sm:hidden">
                    <span className="ct-cost">{r.mana ?? "–"}</span>
                  </td>
                  <td>
                    <span className="sez-num">{pct(r.share, 1)}</span>
                    <span className="ct-sub">{L.games(r.deck.games)}</span>
                  </td>
                  <td>
                    <span className="sez-num">{pct(r.deck.r)}</span>
                    <span className="ct-sub">{L.games(r.deck.games)}</span>
                  </td>
                  <td className="max-sm:hidden">
                    {r.played ? (
                      <>
                        <span className="sez-num">{pct(r.played.r)}</span>
                        <span className="ct-sub">{L.games(r.played.games)}</span>
                      </>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td>
                    <span className="sez-num">{r.turn !== null ? dec(r.turn) : "–"}</span>
                  </td>
                  {prevLabel ? (
                    <td className="max-md:hidden">
                      <span className="ct-moves">
                        <span>
                          <span className="sr-only">{L.shareMoveSr}: </span>
                          <MoveTag m={r.shareMove} />
                          <span className="ct-sub">{L.share.toLowerCase()}</span>
                        </span>
                        <span>
                          <span className="sr-only">{L.wrMoveSr}: </span>
                          <MoveTag m={r.wrMove} />
                          <span className="ct-sub">win rate</span>
                        </span>
                      </span>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {view === "when" && filtered.length ? (
        <div className="mt-5 flex flex-col gap-8">
          {(["early", "mid", "late", "never"] as const).map((b) => {
            const list = filtered.filter((r) => bucketOf(r.turn) === b).sort((x, y) => y.share - x.share);
            if (!list.length) return null;
            return (
              <section key={b} aria-labelledby={`ct-b-${b}`}>
                <h3 id={`ct-b-${b}`} className="font-display text-lg font-bold text-chalk">
                  {L.buckets[b].title} <span className="sez-note font-normal">· {L.buckets[b].sub}</span>
                </h3>
                <ul className="ct-hand">
                  {list.map((r) => (
                    <li key={r.slug} className={r.deck.games < 20 ? "sez-thin" : undefined}>
                      <Link href={`/it/cards/${r.slug}`} prefetch={false} className="ct-card" aria-label={r.name}>
                        <GameCardFace input={r.input} lang="it" />
                        {r.turn !== null ? <span className="pen-note ct-turn">{L.round(dec(r.turn))}</span> : null}
                      </Link>
                      <p className="ct-cap">
                        {L.inDecks(pct(r.share))}
                        <br />
                        <span className="sez-num">{pct(r.deck.r)}</span> · {L.games(r.deck.games)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
