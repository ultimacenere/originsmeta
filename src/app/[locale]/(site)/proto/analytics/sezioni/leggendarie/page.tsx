import Link from "next/link";
import type { ReactNode } from "react";
import { GameCardFace } from "@/components/GameCard";
import { protoMeta } from "@/components/proto/ProtoBar";
import { Band, MoveTag, SezHead, Spark, WrBar } from "@/components/proto/sezioni/parts";
import { gameInput, type ProtoLegendary } from "@/lib/proto/analyticsProto";
import { cardOf, gamesText, legendaryLine, loadSez, moveOf, pctText, sezHref, type Move, type Sez } from "@/lib/proto/sezioni";
import { band, BANDS, type Band as Fascia } from "@/lib/tracker/snapshot";
import "@/components/proto/sezioni/leggendarie/leggendarie.css";

/*
  Sezione «Leggendarie» del prototipo «Analytics a sezioni» (27/11/2026; rifinita lo stesso giorno, Pierluigi: "Sì,
  rifiniamo" con telefono, grafica e contenuti). Con la grafica di /analytics di oggi: il podio delle prime tre sul palco,
  poi le Leggendarie divise per fascia di risultato come il tabellone di oggi (dalla forbice al 95%, `band` di snapshot.ts),
  e la tabella completa chiusa in fondo. Contate a due lati, ordinate per il caso peggiore (bordo basso dell'intervallo).
*/

const L = {
  title: "Leggendarie",
  bandsTitle: "Per fascia di risultato",
  bandsLead: "La fascia la decide la forbice al 95%: «per certo» quando sta tutta da una parte del 50%.",
  bands: {
    "up-sure": "Sopra il 50% per certo",
    up: "Sopra il 50%",
    even: "Alla pari",
    down: "Sotto il 50%",
    "down-sure": "Sotto il 50% per certo",
  } as Record<Fascia, string>,
  tableTitle: "Tutta la classifica",
  tableLead: "Ordinate per il caso peggiore. Le righe più chiare hanno meno di 20 partite.",
  medals: ["1º", "2º", "3º"],
  share: (p: string) => `in campo nel ${p} delle partite`,
  shareShort: (p: string) => `in campo ${p}`,
  range: (lo: string, hi: string) => `fra ${lo} e ${hi}`,
  wr: "vittorie",
  prev: (label: string) => `Freccia: spostamento sulla patch ${label}, in grigio quando non è ancora netto.`,
  none: "I numeri del Tracker non rispondono: riprova fra qualche minuto.",
  aria: (name: string) => `Apri ${name}`,
  /* frasi da sapere */
  top: (name: string, wr: string, games: string, share: string) => (
    <>
      <b>{name}</b> è la più forte: vince il <b>{wr}</b> delle partite ({games}) ed è in campo nel <b>{share}</b>.
    </>
  ),
  played: (name: string, share: string) => (
    <>
      La più giocata è <b>{name}</b>, in campo nel <b>{share}</b> delle partite.
    </>
  ),
  rise: (name: string, pts: string, prev: string) => (
    <>
      Rispetto alla patch {prev} sale di più <b>{name}</b>: <b>{pts}</b>.
    </>
  ),
  fall: (name: string, pts: string, prev: string) => (
    <>
      Rispetto alla patch {prev} scende di più <b>{name}</b>: <b>{pts}</b>.
    </>
  ),
  noMove: (prev: string) => `Rispetto alla patch ${prev} nessuno spostamento è ancora netto.`,
  bottom: (name: string, wr: string, games: string) => (
    <>
      In fondo <b>{name}</b>: vince il <b>{wr}</b> ({games}).
    </>
  ),
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni/leggendarie", "Leggendarie · Analytics a sezioni", "Prototipo: la classifica delle Leggendarie di Origins TCG con i dati veri del Tracker.");
}

const pts = (m: Move) => `${m.points > 0 ? "+" : "−"}${Math.abs(m.points).toLocaleString("it-IT", { maximumFractionDigits: 1 })} punti`;

export default async function LeggendariePage({ searchParams }: { searchParams: SP }) {
  const sez = await loadSez(searchParams);
  if (!sez) {
    return (
      <Band tone="stage" top>
        <p className="text-pale">{L.none}</p>
      </Band>
    );
  }
  const { all, cur, prev } = sez;
  const rows = [...cur.legendaries].sort((a, b) => b.lo - a.lo || b.games - a.games);
  const moves = new Map(rows.map((l) => [l.slug, moveOf(prev?.legendaries.find((x) => x.slug === l.slug), l)]));
  const name = (slug: string) => cardOf(slug)?.name ?? slug;

  /* le cose da sapere, la più importante per prima */
  const brief: ReactNode[] = [];
  const top = rows[0];
  const mostPlayed = [...rows].sort((a, b) => b.games - a.games)[0];
  if (top) brief.push(L.top(name(top.slug), pctText(top.r), gamesText(top.games), pctText(top.share)));
  if (mostPlayed && mostPlayed.slug !== top?.slug) brief.push(L.played(name(mostPlayed.slug), pctText(mostPlayed.share)));
  if (prev) {
    const sure = rows.flatMap((l) => {
      const m = moves.get(l.slug);
      return m && m.sure ? [{ l, m }] : [];
    });
    const rise = [...sure].sort((a, b) => b.m.points - a.m.points)[0];
    const fall = [...sure].sort((a, b) => a.m.points - b.m.points)[0];
    if (rise && rise.m.points > 0) brief.push(L.rise(name(rise.l.slug), pts(rise.m), prev.label));
    else if (fall && fall.m.points < 0) brief.push(L.fall(name(fall.l.slug), pts(fall.m), prev.label));
    else brief.push(L.noMove(prev.label));
  }
  const bottom = rows.at(-1);
  if (bottom && bottom.slug !== top?.slug && brief.length < 3) brief.push(L.bottom(name(bottom.slug), pctText(bottom.r), gamesText(bottom.games)));

  const podium = rows.slice(0, 3);
  const groups = BANDS.map((b) => ({ b, legs: rows.filter((l) => band(l) === b) })).filter((g) => g.legs.length);

  return (
    <>
      <Band tone="stage" top>
        <SezHead title={L.title} brief={brief} />
        <div className={`an-podium has-${podium.length}`}>
          {podium.map((l, i) => {
            const card = cardOf(l.slug);
            return (
              <article key={l.slug} className={`an-pod is-p${i + 1}`}>
                <Link href={sezHref(`/leggendarie/${l.slug}`, sez)} prefetch={false} className="an-pod-card" aria-label={L.aria(name(l.slug))}>
                  {card ? <GameCardFace input={gameInput(card)} lang="it" /> : null}
                </Link>
                <div className="an-panel an-pod-plate">
                  <span className="an-medal">{L.medals[i]}</span>
                  <h3>{name(l.slug)}</h3>
                  <div className="an-big-wr">
                    {(l.r * 100).toLocaleString("it-IT", { maximumFractionDigits: 1 })}
                    <small>%</small>
                  </div>
                  <WrBar n={l} className="mx-auto mt-2 max-w-[200px]" />
                  <div className="an-pod-meta">
                    {gamesText(l.games)} · {L.range(pctText(l.lo), pctText(l.hi))}
                    <br />
                    {L.share(pctText(l.share))} · <MoveTag m={moves.get(l.slug) ?? null} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Band>

      <Band tone="felt">
        <SezHead title={L.bandsTitle} brief={[L.bandsLead]} />
        <div className="lg-bands">
          {groups.map(({ b, legs }) => (
            <section key={b} className={`lg-band is-${b}`} aria-label={L.bands[b]}>
              <h3 className="lg-band-title">
                {L.bands[b]} <span>{legs.length}</span>
              </h3>
              <ul className="lg-band-cards">
                {legs.map((l) => (
                  <BandCard key={l.slug} l={l} sez={sez} move={moves.get(l.slug) ?? null} />
                ))}
              </ul>
            </section>
          ))}
        </div>
        {prev ? <p className="sez-note mt-4">{L.prev(prev.label)}</p> : null}
      </Band>

      <Band tone="deep">
        <details className="lg-table">
          <summary>
            <span className="sez-h2">{L.tableTitle}</span>
            <span className="sez-note">{L.tableLead}</span>
          </summary>
          <ol className="lg-list">
            {rows.map((l, i) => {
              const card = cardOf(l.slug);
              const line = legendaryLine(all, l.slug);
              const points = all.map((p) => line.find((x) => x.patch === p.patch)?.r ?? null);
              return (
                <li key={l.slug}>
                  <Link href={sezHref(`/leggendarie/${l.slug}`, sez)} prefetch={false} className={`lg-row${l.games < 20 ? " sez-thin" : ""}`} aria-label={L.aria(name(l.slug))}>
                    <span className="lg-rank" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="lg-face" aria-hidden="true">
                      {card?.art ? (
                        // eslint-disable-next-line @next/next/no-img-element -- ritaglio tondo dell'arte, WebP piccolo
                        <img src={card.art} alt="" loading="lazy" decoding="async" />
                      ) : null}
                    </span>
                    <span className="lg-name">
                      <b>{name(l.slug)}</b>
                      <span>{L.share(pctText(l.share))}</span>
                    </span>
                    <span className="lg-wr">
                      <span className="lg-wr-top">
                        <span>
                          <span className="sez-num">{pctText(l.r)}</span> {L.wr}
                        </span>
                        <span>{gamesText(l.games)}</span>
                      </span>
                      <WrBar n={l} />
                    </span>
                    <span className="lg-move">
                      <MoveTag m={moves.get(l.slug) ?? null} />
                    </span>
                    <span className="lg-spark">
                      <Spark points={points} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </details>
      </Band>
    </>
  );
}

function BandCard({ l, sez, move }: { l: ProtoLegendary; sez: Sez; move: Move | null }) {
  const card = cardOf(l.slug);
  return (
    <li className={`lg-bcard${l.games < 20 ? " sez-thin" : ""}`}>
      <Link href={sezHref(`/leggendarie/${l.slug}`, sez)} prefetch={false} aria-label={L.aria(card?.name ?? l.slug)}>
        <span className="lg-bcard-face">{card ? <GameCardFace input={gameInput(card)} lang="it" /> : null}</span>
        <span className="lg-bcard-wr">
          <span className="sez-num">{pctText(l.r)}</span> <MoveTag m={move} />
        </span>
        <span className="lg-bcard-sub">
          {gamesText(l.games)} · {L.shareShort(pctText(l.share))}
        </span>
      </Link>
    </li>
  );
}
