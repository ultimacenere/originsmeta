"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GameCardFace } from "@/components/GameCard";
import type { GameCardInput } from "@/game-card/model";
import { WrBar } from "@/components/proto/sezioni/parts";
import { encodeGameCode, encodeOmCode } from "@/lib/deckcode";
import "./mazzi.css";

/*
  Elenco dei mazzi migliori da copiare (prototipo «Analytics a sezioni», 27/11/2026): filtro per Leggendaria, le prime
  15 liste del filtro, codice del gioco da copiare e deck builder.
*/

const L = {
  filter: "Filtra per Leggendaria",
  all: "Tutte",
  games: (n: number) => `${n.toLocaleString("it-IT")} ${n === 1 ? "partita" : "partite"}`,
  range: (lo: string, hi: string) => `fra ${lo} e ${hi}`,
  by: (a: string) => `di ${a}`,
  open: "Apri il mazzo",
  copy: "Copia codice del gioco",
  copied: "Copiato",
  builder: "Apri nel deck builder",
  more: (n: number) => `Mostra altre ${n}`,
  none: "Nessuna lista registrata per questa Leggendaria in questa patch.",
  thin: "poche partite",
};

export type MThumb = { slug: string; name: string; thumb: string | null; mana: number | null };
export type MLeg = { slug: string; name: string; art: string | null; input: GameCardInput };
export type MDeck = {
  id: string;
  legendary: string;
  cards: string[];
  games: number;
  wins: number;
  r: number;
  lo: number;
  hi: number;
  name: string;
  published: { slug: string; name: string; author: string | null } | null;
  /** chiavi del gioco della Leggendaria e delle 12 carte: il codice si calcola al clic */
  keys: string[] | null;
};

const pct = (r: number) => `${Math.round(r * 100)}%`;
const PAGE = 15;

export function MazziList({ decks, legs, legOrder, thumbs }: { decks: MDeck[]; legs: Record<string, MLeg>; legOrder: string[]; thumbs: Record<string, MThumb> }) {
  const [leg, setLeg] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const list = useMemo(() => (leg ? decks.filter((d) => d.legendary === leg) : decks), [decks, leg]);

  return (
    <div className="mt-4">
      <div className="mz-chips" role="group" aria-label={L.filter}>
        <button type="button" className={`mz-chip${leg === null ? " is-on" : ""}`} aria-pressed={leg === null} onClick={() => { setLeg(null); setShown(PAGE); }}>
          {L.all}
        </button>
        {legOrder.map((s) => (
          <button key={s} type="button" className={`mz-chip${leg === s ? " is-on" : ""}`} aria-pressed={leg === s} onClick={() => { setLeg(s); setShown(PAGE); }}>
            {legs[s]?.art ? (
              // eslint-disable-next-line @next/next/no-img-element -- ritratto tondo dall'arte della carta
              <img src={legs[s].art!} alt="" className="mz-chip-img" loading="lazy" decoding="async" />
            ) : null}
            {legs[s]?.name}
          </button>
        ))}
      </div>

      {list.length ? (
        <ol className="mt-5 grid grid-cols-1 gap-3">
          {list.slice(0, shown).map((d, i) => (
            <li key={d.id} className={`sez-panel mz-deck${d.games < 20 ? " is-thin" : ""}`}>
              <span className="pen-num mz-rank" aria-hidden="true">
                {i + 1}
              </span>
              <div className="mz-leg">{legs[d.legendary] ? <GameCardFace input={legs[d.legendary].input} lang="it" /> : null}</div>
              <div className="mz-main">
                <div className="mz-head">
                  <div className="min-w-0">
                    <p className="mz-name">
                      {d.published ? (
                        <Link href={`/it/decks/community/${d.published.slug}`} prefetch={false} className="hover:text-mint">
                          {d.name}
                        </Link>
                      ) : (
                        d.name
                      )}
                    </p>
                    {d.published?.author ? <p className="sez-note">{L.by(d.published.author)}</p> : null}
                  </div>
                  <div className="mz-wr">
                    <span className="sez-num text-2xl">{pct(d.r)}</span>
                    <span className="sez-note">
                      {L.games(d.games)}
                      {d.games < 20 ? ` · ${L.thin}` : ""}
                    </span>
                  </div>
                </div>
                <WrBar n={d} />
                <p className="sez-note mt-1">{L.range(pct(d.lo), pct(d.hi))}</p>
                <ul className="mz-cards">
                  {d.cards.map((s) => (
                    <li key={s}>
                      <Link href={`/it/cards/${s}`} prefetch={false} title={thumbs[s]?.name} className="mz-thumb">
                        {thumbs[s]?.thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element -- miniatura ufficiale 160 px
                          <img src={thumbs[s].thumb!} alt={thumbs[s].name} loading="lazy" decoding="async" />
                        ) : (
                          <span>{thumbs[s]?.name}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mz-actions">
                  {d.keys ? <CopyCode keys={d.keys} /> : null}
                  <Link href={`/it/deck-builder#${encodeOmCode({ name: d.name, legendary: d.legendary, cards: d.cards, customCards: [] })}`} prefetch={false} className="btn btn-ghost text-xs">
                    {L.builder}
                  </Link>
                  {d.published ? (
                    <Link href={`/it/decks/community/${d.published.slug}`} prefetch={false} className="text-sm text-mint underline-offset-2 hover:underline">
                      {L.open}
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="sez-note mt-5">{L.none}</p>
      )}
      {list.length > shown ? (
        <button type="button" className="btn btn-ghost mt-4 text-sm" onClick={() => setShown((n) => n + PAGE)}>
          {L.more(Math.min(PAGE, list.length - shown))}
        </button>
      ) : null}
    </div>
  );
}

function CopyCode({ keys }: { keys: string[] }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary text-xs"
      onClick={async () => {
        const code = await encodeGameCode(keys);
        try {
          await navigator.clipboard.writeText(code);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          window.prompt(L.copy, code);
        }
      }}
    >
      {done ? L.copied : L.copy}
    </button>
  );
}
