"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GameCardFace } from "@/components/GameCard";
import type { GameCardInput } from "@/game-card/model";
import { WrBar } from "@/components/proto/sezioni/parts";
import { encodeGameCode, encodeOmCode } from "@/lib/deckcode";
import "./mazzi.css";

/*
  Mazzi migliori da copiare (prototipo «Analytics a sezioni», 27/11/2026; rifinitura del 27/11: telefono, grafica,
  contenuti). `MazziTop`: i primi tre in evidenza, con la Leggendaria come carta del gioco e le 12 carte in miniatura
  leggibili (4 per riga). `MazziList`: tutte le altre liste, compatte, con le carte come nomi e gemma del mana; filtro per
  Leggendaria. Codice del gioco calcolato al clic e deck builder.
*/

const L = {
  filter: "Filtra per Leggendaria",
  all: "Tutte",
  games: (n: number) => `${n.toLocaleString("it-IT")} ${n === 1 ? "partita" : "partite"}`,
  range: (lo: string, hi: string) => `fra ${lo} e ${hi}`,
  worst: (lo: string) => `almeno ${lo} nel caso peggiore`,
  by: (a: string) => `di ${a}`,
  open: "Apri il mazzo",
  copy: "Copia codice del gioco",
  copied: "Copiato",
  builder: "Apri nel deck builder",
  more: (n: number) => `Mostra altre ${n}`,
  none: "Nessuna lista registrata per questa Leggendaria in questa patch.",
  thin: "poche partite",
  wins: "vinte",
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
const PAGE = 12;

const builderHref = (d: MDeck) => `/it/deck-builder#${encodeOmCode({ name: d.name, legendary: d.legendary, cards: d.cards, customCards: [] })}`;

function DeckName({ d }: { d: MDeck }) {
  return d.published ? (
    <Link href={`/it/decks/community/${d.published.slug}`} prefetch={false} className="hover:text-mint">
      {d.name}
    </Link>
  ) : (
    <>{d.name}</>
  );
}

function Actions({ d }: { d: MDeck }) {
  return (
    <div className="mz-actions">
      {d.keys ? <CopyCode keys={d.keys} /> : null}
      <Link href={builderHref(d)} prefetch={false} className="btn btn-ghost text-xs">
        {L.builder}
      </Link>
    </div>
  );
}

/** I primi tre mazzi in evidenza. */
export function MazziTop({ decks, legs, thumbs }: { decks: MDeck[]; legs: Record<string, MLeg>; thumbs: Record<string, MThumb> }) {
  return (
    <ol className="mz-top">
      {decks.map((d, i) => (
        <li key={d.id} className="an-panel mz-top-item">
          <span className="pen-num mz-top-rank" aria-hidden="true">
            {i + 1}
          </span>
          <div className="mz-top-head">
            <div className="mz-top-leg">{legs[d.legendary] ? <GameCardFace input={legs[d.legendary].input} lang="it" /> : null}</div>
            <div className="min-w-0">
              <p className="mz-name">
                <DeckName d={d} />
              </p>
              {d.published?.author ? <p className="sez-note">{L.by(d.published.author)}</p> : null}
              <div className="an-big-wr">
                {Math.round(d.r * 100)}
                <small>%</small>
              </div>
              <p className="sez-note">
                {L.games(d.games)}
                {d.games < 20 ? ` · ${L.thin}` : ""}
              </p>
              <p className="sez-note">{L.worst(pct(d.lo))}</p>
            </div>
          </div>
          <WrBar n={d} />
          <ul className="mz-thumbs">
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
          <Actions d={d} />
        </li>
      ))}
    </ol>
  );
}

/** Tutte le altre liste, compatte, con il filtro per Leggendaria. Con «Tutte» salta le prime `skip` (già in evidenza). */
export function MazziList({ decks, legs, legOrder, thumbs, skip }: { decks: MDeck[]; legs: Record<string, MLeg>; legOrder: string[]; thumbs: Record<string, MThumb>; skip: number }) {
  const [leg, setLeg] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const list = useMemo(() => (leg ? decks.filter((d) => d.legendary === leg) : decks.slice(skip)), [decks, leg, skip]);
  const rankOf = useMemo(() => new Map(decks.map((d, i) => [d.id, i + 1])), [decks]);

  return (
    <div>
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
        <ol className="mz-list">
          {list.slice(0, shown).map((d) => (
            <li key={d.id} className={`mz-row${d.games < 20 ? " is-thin" : ""}`}>
              <div className="mz-row-head">
                <span className="mz-row-rank" aria-hidden="true">
                  {rankOf.get(d.id)}
                </span>
                {legs[d.legendary]?.art ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ritratto tondo dall'arte della Leggendaria
                  <img src={legs[d.legendary].art!} alt="" className="mz-row-img" loading="lazy" decoding="async" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="mz-name is-small">
                    <DeckName d={d} />
                  </p>
                  {d.published?.author ? <p className="sez-note truncate">{L.by(d.published.author)}</p> : null}
                </div>
                <div className="mz-wr">
                  <span className="sez-num text-xl">{pct(d.r)}</span>
                  <span className="sez-note">{L.games(d.games)}</span>
                </div>
              </div>
              <WrBar n={d} />
              <ul className="mz-names">
                {d.cards.map((s) => (
                  <li key={s}>
                    <Link href={`/it/cards/${s}`} prefetch={false} className="mz-cardname">
                      <span className="mz-gem" aria-hidden="true">
                        {thumbs[s]?.mana ?? "–"}
                      </span>
                      <span className="truncate">{thumbs[s]?.name ?? s}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Actions d={d} />
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
