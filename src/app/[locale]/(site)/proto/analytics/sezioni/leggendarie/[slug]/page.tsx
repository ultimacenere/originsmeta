import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { GameCardFace } from "@/components/GameCard";
import { protoMeta } from "@/components/proto/ProtoBar";
import { Band, MoveTag, SezHead, WrBar } from "@/components/proto/sezioni/parts";
import { CopyCode } from "@/components/proto/sezioni/leggendarie/CopyCode";
import { cardsOfLegendary, gameInput, type CardWith, type ProtoMatchup } from "@/lib/proto/analyticsProto";
import { cardOf, deckLinks, gamesText, legendaryLine, listKeyOf, loadAll, loadSez, moveOf, pctText, pointsText, publishedByList, sezHref, type Sez } from "@/lib/proto/sezioni";
import type { ChangeKind } from "@/lib/data/cards";
import "@/components/proto/sezioni/leggendarie/leggendarie.css";

/*
  Pagina di una Leggendaria nel prototipo «Analytics a sezioni» (27/11/2026; rifinita lo stesso giorno, Pierluigi: "Sì,
  rifiniamo" con telefono, grafica e contenuti). Fasce come /analytics di oggi: in cima la carta e le tre cose da sapere,
  poi le carte che porta (dalle liste esatte registrate: quanto spesso, e al tocco come vanno le liste con e senza), contro
  chi vince e contro chi soffre (a due lati), le sue liste migliori da copiare e le quattro patch del Tracker con le
  modifiche di Koin a lei e alle sue carte.
*/

const L = {
  back: "Tutte le Leggendarie",
  wr: "Vittorie",
  share: "In campo",
  shareSub: "delle partite",
  rank: "In classifica",
  rankSub: (n: number) => `su ${n}, nel caso peggiore`,
  move: "Sulla patch prima",
  moveSub: (label: string) => `rispetto a ${label}`,
  moveNone: "prima patch con i suoi numeri",
  range: (lo: string, hi: string) => `fra ${lo} e ${hi}`,
  /* frasi da sapere */
  briefWr: (name: string, wr: string, games: string, rank: number, n: number) => (
    <>
      <b>{name}</b> vince il <b>{wr}</b> delle partite ({games}): <b>{rank}ª</b> su {n} nel caso peggiore.
    </>
  ),
  briefCard: (card: string, w: string, wo: string, sure: boolean) => (
    <>
      La carta che pesa di più è <b>{card}</b>: con lei le liste vincono il <b>{w}</b>, senza il <b>{wo}</b>
      {sure ? "." : " (differenza non ancora netta)."}
    </>
  ),
  briefWorst: (opp: string, wr: string, games: string) => (
    <>
      Soffre di più contro <b>{opp}</b>: vince il <b>{wr}</b> ({games}).
    </>
  ),
  briefBest: (opp: string, wr: string, games: string) => (
    <>
      Va meglio contro <b>{opp}</b>: vince il <b>{wr}</b> ({games}).
    </>
  ),
  cardsTitle: "Le carte che porta",
  cardsBrief: (games: string) => `Dalle liste esatte registrate con questa Leggendaria (${games}). Il numero è quanto spesso c'è la carta; tocca una carta per vedere come vanno le liste con e senza.`,
  cardsNone: "Nessuna lista esatta registrata in questa patch.",
  inLists: (p: string) => `nel ${p}`,
  always: "sempre",
  withW: "Con la carta",
  withoutW: "Senza",
  diff: (p: string) => `Differenza: ${p}`,
  diffUnsure: "Differenza non ancora netta.",
  more: (n: number) => `Mostra le altre ${n}`,
  others: (n: number) => `Anche, più di rado (${n})`,
  vsTitle: "Contro chi vince e contro chi soffre",
  vsBrief: "Gli scontri contati da tutti e due i lati: la percentuale è quanto vince lei.",
  best: "Vince contro",
  worst: "Soffre contro",
  vsNone: "Nessuno scontro registrato.",
  listsTitle: "Le sue liste migliori",
  listsBrief: "Le liste esatte con almeno 5 partite e il risultato migliore nel caso peggiore, pronte da copiare.",
  listsNone: "Nessuna lista esatta registrata in questa patch.",
  listName: (i: number) => `Lista ${i}`,
  published: (name: string, author: string | null) => (author ? `Pubblicata come «${name}» da ${author}` : `Pubblicata come «${name}»`),
  open: "Apri il mazzo",
  builder: "Apri nel deck builder",
  timeTitle: "Nel tempo",
  timeBrief: "Le quattro patch del Tracker, con le modifiche di Koin a lei e alle carte che porta più spesso.",
  noData: "nessun numero",
  noChange: "nessuna modifica",
  chartAria: (name: string) => `Win rate di ${name} nelle patch del Tracker`,
  kinds: { buff: "Buff", nerf: "Nerf", rework: "Rework", deck: "Mazzo" } as Record<ChangeKind, string>,
  none: "I numeri del Tracker non rispondono: riprova fra qualche minuto.",
};

type SP = Promise<Record<string, string | string[] | undefined>>;
type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const name = cardOf(slug)?.name ?? slug;
  return protoMeta(`/proto/analytics/sezioni/leggendarie/${slug}`, `${name} · Analytics a sezioni`, `Prototipo: i numeri di ${name} in Origins TCG con i dati veri del Tracker.`);
}

const THIN = 20;
const FIRST = 9;
const diffPts = (c: CardWith) => (c.without ? Math.round((c.with.r - c.without.r) * 100) : 0);
const sureDiff = (c: CardWith) => !!c.without && (c.with.lo > c.without.hi || c.with.hi < c.without.lo);

export default async function LeggendariaPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { slug } = await params;
  const card = cardOf(slug);
  if (!card?.legendary) notFound();
  const sez = await loadSez(searchParams);
  if (!sez) {
    return (
      <Band tone="stage" top>
        <p className="text-pale">{L.none}</p>
      </Band>
    );
  }
  const { cur, prev } = sez;
  const leg = cur.legendaries.find((l) => l.slug === slug);
  if (!leg) notFound();

  const ranked = [...cur.legendaries].sort((a, b) => b.lo - a.lo || b.games - a.games);
  const rank = ranked.findIndex((l) => l.slug === slug) + 1;
  const move = moveOf(prev?.legendaries.find((l) => l.slug === slug), leg);

  /* carte che porta: le più frequenti prima, le altre dietro un tasto, le rare in una riga chiusa */
  const carried = cardsOfLegendary(cur.lists, slug);
  const common = carried.cards.filter((c) => c.share >= 0.15).slice(0, 16);
  const first = common.slice(0, FIRST);
  const second = common.slice(FIRST);
  const rest = carried.cards.filter((c) => !common.includes(c));

  /* scontri */
  const mus = cur.matchups.filter((m) => m.a === slug && m.b !== slug && m.games > 0);
  const best = [...mus].sort((a, b) => b.lo - a.lo || b.games - a.games).slice(0, 4);
  const worst = [...mus].sort((a, b) => a.hi - b.hi || b.games - a.games).filter((m) => !best.includes(m)).slice(0, 4);

  /* le cose da sapere, la più importante per prima */
  const brief: ReactNode[] = [L.briefWr(card.name, pctText(leg.r), gamesText(leg.games), rank, ranked.length)];
  // la carta che pesa di più: fra quelle con almeno 20 partite con e senza, la differenza più grande (prima le nette)
  const weighed = common.filter((c) => c.without && c.with.games >= THIN && c.without.games >= THIN);
  const heavy = [...weighed].sort((a, b) => Number(sureDiff(b)) - Number(sureDiff(a)) || Math.abs(diffPts(b)) - Math.abs(diffPts(a)))[0];
  if (heavy?.without && diffPts(heavy) !== 0) brief.push(L.briefCard(cardOf(heavy.slug)?.name ?? heavy.slug, pctText(heavy.with.r), pctText(heavy.without.r), sureDiff(heavy)));
  const solidMus = mus.filter((m) => m.games >= THIN);
  const hardest = [...(solidMus.length ? solidMus : mus)].sort((a, b) => a.r - b.r)[0];
  const easiest = [...(solidMus.length ? solidMus : mus)].sort((a, b) => b.r - a.r)[0];
  if (hardest && hardest.r < 0.5) brief.push(L.briefWorst(cardOf(hardest.b)?.name ?? hardest.b, pctText(hardest.r), gamesText(hardest.games)));
  else if (easiest) brief.push(L.briefBest(cardOf(easiest.b)?.name ?? easiest.b, pctText(easiest.r), gamesText(easiest.games)));

  /* liste migliori: con almeno 5 partite, se ce ne sono */
  const own = cur.lists.filter((l) => l.legendary === slug);
  const solid = own.filter((l) => l.games >= 5);
  const lists = (solid.length ? solid : own).sort((a, b) => b.lo - a.lo || b.games - a.games).slice(0, 3);
  const published = await publishedByList();
  const listRows = await Promise.all(
    lists.map(async (l, i) => {
      const pub = published.get(listKeyOf(slug, l.cards))?.[0] ?? null;
      const links = await deckLinks(slug, l.cards, pub?.name ?? `${card.name} · ${L.listName(i + 1)}`);
      const sorted = [...l.cards].sort((a, b) => (cardOf(a)?.mana ?? 99) - (cardOf(b)?.mana ?? 99) || (cardOf(a)?.name ?? a).localeCompare(cardOf(b)?.name ?? b));
      return { l, pub, links, sorted };
    }),
  );

  /* nel tempo: le carte che porta più spesso nella patch scelta (almeno nella metà delle liste) */
  const all = await loadAll();
  const line = legendaryLine(all, slug);
  const core = new Set([slug, ...carried.cards.filter((c) => c.share >= 0.5).map((c) => c.slug)]);
  const time = all.map((p) => {
    const pt = line.find((x) => x.patch === p.patch) ?? null;
    const changes = [...core].flatMap((s) => (cardOf(s)?.history ?? []).filter((h) => h.patch === p.patch).map((h) => ({ slug: s, h })));
    return { p, pt, changes };
  });

  return (
    <>
      <Band tone="stage" top>
        <Link href={sezHref("/leggendarie", sez)} prefetch={false} className="link-mint text-sm font-bold">
          {L.back}
        </Link>
        <header className="lg-head mt-4">
          <div className="lg-head-card">
            <GameCardFace input={gameInput(card)} lang="it" />
          </div>
          <div className="min-w-0">
            <SezHead title={card.name} brief={brief} />
            <div className="lg-facts">
              <div className="lg-fact">
                <span>{L.wr}</span>
                <b className="sez-num">{pctText(leg.r, 1)}</b>
                <small>
                  {gamesText(leg.games)} · {L.range(pctText(leg.lo), pctText(leg.hi))}
                </small>
              </div>
              <div className="lg-fact">
                <span>{L.share}</span>
                <b className="sez-num">{pctText(leg.share, 1)}</b>
                <small>{L.shareSub}</small>
              </div>
              <div className="lg-fact">
                <span>{L.rank}</span>
                <b className="sez-num">{rank}ª</b>
                <small>{L.rankSub(ranked.length)}</small>
              </div>
              <div className="lg-fact">
                <span>{L.move}</span>
                <b className="sez-num">
                  <MoveTag m={move} />
                </b>
                <small>{prev && move ? L.moveSub(prev.label) : L.moveNone}</small>
              </div>
            </div>
            <div className="mt-4 max-w-md">
              <WrBar n={leg} />
            </div>
          </div>
        </header>
      </Band>

      <Band tone="felt">
        <SezHead title={L.cardsTitle} brief={carried.games ? [L.cardsBrief(gamesText(carried.games))] : [L.cardsNone]} />
        {carried.games ? (
          <>
            <ul className="lg-cards">
              {first.map((c) => (
                <CarriedCard key={c.slug} c={c} />
              ))}
            </ul>
            {second.length ? (
              <details className="lg-more">
                <summary>{L.more(second.length)}</summary>
                <ul className="lg-cards">
                  {second.map((c) => (
                    <CarriedCard key={c.slug} c={c} />
                  ))}
                </ul>
              </details>
            ) : null}
            {rest.length ? (
              <details className="lg-more">
                <summary>{L.others(rest.length)}</summary>
                <p className="sez-note mt-2">{rest.map((c) => `${cardOf(c.slug)?.name ?? c.slug} (${pctText(c.share)})`).join(", ")}.</p>
              </details>
            ) : null}
          </>
        ) : null}
      </Band>

      <Band tone="deep">
        <SezHead title={L.vsTitle} brief={[L.vsBrief]} />
        {mus.length ? (
          <div className="lg-vs">
            <VsList title={L.best} rows={best} sez={sez} tone="sez-up" />
            <VsList title={L.worst} rows={worst} sez={sez} tone="sez-down" />
          </div>
        ) : (
          <p className="sez-note">{L.vsNone}</p>
        )}
      </Band>

      <Band tone="felt">
        <SezHead title={L.listsTitle} brief={[listRows.length ? L.listsBrief : L.listsNone]} />
        {listRows.length ? (
          <div className="lg-lists">
            {listRows.map(({ l, pub, links, sorted }, i) => (
              <article key={l.cards.join(",")} className={`an-panel lg-listcard${l.games < THIN ? " sez-thin" : ""}`}>
                <div className="lg-list-head">
                  <span className="lg-list-name">{pub ? pub.name : L.listName(i + 1)}</span>
                  <span className="text-sm text-pale">
                    <span className="sez-num text-lg">{pctText(l.r)}</span> · {gamesText(l.games)} · {L.range(pctText(l.lo), pctText(l.hi))}
                  </span>
                </div>
                {pub ? <p className="sez-note mt-1">{L.published(pub.name, pub.author)}</p> : null}
                <ul className="lg-thumbs">
                  {sorted.map((s) => {
                    const c = cardOf(s);
                    return (
                      <li key={s}>
                        <Link href={`/it/cards/${s}`} prefetch={false} title={c?.name ?? s}>
                          {c?.thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element -- miniatura ufficiale da 160 px, già in WebP
                            <img src={c.thumb} alt={c.name} loading="lazy" decoding="async" width={160} height={230} />
                          ) : (
                            <span className="lg-thumb-none">{c?.name ?? s}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="lg-actions">
                  {links.code ? <CopyCode code={links.code} /> : null}
                  <Link href={links.builder} prefetch={false} className="btn btn-ghost text-xs">
                    {L.builder}
                  </Link>
                  {pub ? (
                    <Link href={`/it/decks/community/${pub.slug}`} prefetch={false} className="btn btn-ghost text-xs">
                      {L.open}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </Band>

      <Band tone="deep">
        <SezHead title={L.timeTitle} brief={[L.timeBrief]} />
        <TimeChart points={time.map(({ p, pt }) => ({ label: p.label, r: pt?.r ?? null }))} marks={time.map((t) => t.changes.length > 0)} aria={L.chartAria(card.name)} />
        <ul className="lg-time">
          {[...time].reverse().map(({ p, pt, changes }) => (
            <li key={p.patch} className="lg-time-row">
              <span className="lg-time-patch">{p.label}</span>
              <span className="text-sm">
                {pt ? (
                  <>
                    <span className="sez-num">{pctText(pt.r)}</span> <span className="text-pale-muted">{gamesText(pt.games)}</span>
                  </>
                ) : (
                  <span className="text-pale-muted">{L.noData}</span>
                )}
              </span>
              <span className="text-sm text-pale">{pt ? `${L.share.toLowerCase()} ${pctText(pt.share)}` : ""}</span>
              <ul className="lg-changes">
                {changes.length ? (
                  changes.map(({ slug: s, h }, k) => (
                    <li key={`${s}-${k}`}>
                      <span className={`lg-kind ${h.kind === "buff" ? "is-buff" : h.kind === "nerf" ? "is-nerf" : "is-other"}`}>{L.kinds[h.kind] ?? h.kind}</span>
                      <b className="text-chalk">{cardOf(s)?.name ?? s}</b>: {h.note.it ?? h.note.en}
                    </li>
                  ))
                ) : (
                  <li className="text-pale-muted">{L.noChange}</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      </Band>
    </>
  );
}

/** Una carta che la Leggendaria porta: carta del gioco e quota; al tocco, come vanno le liste con e senza. */
function CarriedCard({ c }: { c: CardWith }) {
  const info = cardOf(c.slug);
  if (!info) return null;
  const sure = sureDiff(c);
  const d = diffPts(c);
  return (
    <li>
      <details className="lg-card">
        <summary>
          {sure ? <span className={`pen-note ${d > 0 ? "is-up" : "is-down"}`}>{pointsText(d)}</span> : null}
          <span className="lg-card-face">
            <GameCardFace input={gameInput(info)} lang="it" />
          </span>
          <span className="lg-card-share">
            <b>{c.share >= 0.995 ? L.always : L.inLists(pctText(c.share))}</b>
          </span>
        </summary>
        <div className="lg-card-pop">
          <p>
            {L.withW} <b>{pctText(c.with.r)}</b> <small>({gamesText(c.with.games)})</small>
          </p>
          {c.without ? (
            <p>
              {L.withoutW} <b>{pctText(c.without.r)}</b> <small>({gamesText(c.without.games)})</small>
            </p>
          ) : null}
          {c.without ? <p className="lg-card-diff">{sure ? L.diff(pointsText(d)) : L.diffUnsure}</p> : null}
        </div>
      </details>
    </li>
  );
}

/** Il win rate sulle quattro patch: linea grande con i valori scritti, il 50% tratteggiato, un segno dove Koin ha cambiato qualcosa. */
function TimeChart({ points, marks, aria }: { points: { label: string; r: number | null }[]; marks: boolean[]; aria: string }) {
  const W = 640;
  const H = 190;
  const padX = 48;
  const padT = 30;
  const padB = 34;
  const vals = points.map((p) => p.r).filter((v): v is number => v !== null);
  if (vals.length < 1) return null;
  const min = Math.min(0.3, ...vals) - 0.02;
  const max = Math.max(0.7, ...vals) + 0.02;
  const n = points.length;
  const x = (i: number) => (n > 1 ? padX + (i * (W - 2 * padX)) / (n - 1) : W / 2);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const path = points.map((p, i) => (p.r === null ? null : `${x(i)},${y(p.r)}`)).filter(Boolean).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lg-chart" role="img" aria-label={aria}>
      <line x1={padX - 20} x2={W - padX + 20} y1={y(0.5)} y2={y(0.5)} stroke="rgba(255,255,255,.3)" strokeDasharray="5 5" />
      <text x={padX - 24} y={y(0.5) + 4} textAnchor="end" className="lg-chart-axis">
        50%
      </text>
      <polyline points={path} fill="none" stroke="var(--color-sky)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.label}>
          {marks[i] ? <rect x={x(i) - 7} y={H - padB + 6} width="14" height="14" rx="3" fill="var(--color-gold)" opacity="0.85" /> : null}
          <text x={x(i)} y={H - 6} textAnchor="middle" className="lg-chart-label">
            {p.label}
          </text>
          {p.r !== null ? (
            <>
              <circle cx={x(i)} cy={y(p.r)} r="6" fill={i === n - 1 ? "var(--color-mint)" : "var(--color-sky)"} stroke="#110a26" strokeWidth="2" />
              <text x={x(i)} y={y(p.r) - 12} textAnchor="middle" className="lg-chart-val">
                {Math.round(p.r * 100)}%
              </text>
            </>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

function VsList({ title, rows, sez, tone }: { title: string; rows: ProtoMatchup[]; sez: Sez; tone: string }) {
  return (
    <div>
      <h3 className={tone}>{title}</h3>
      <ul>
        {rows.map((m) => {
          const opp = cardOf(m.b);
          return (
            <li key={m.b}>
              <Link href={sezHref(`/leggendarie/${m.b}`, sez)} prefetch={false} className={`lg-vs-row${m.games < THIN ? " sez-thin" : ""}`}>
                <span className="lg-face" aria-hidden="true">
                  {opp?.art ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ritaglio tondo dell'arte, WebP piccolo
                    <img src={opp.art} alt="" loading="lazy" decoding="async" />
                  ) : null}
                </span>
                <span className="truncate font-display font-semibold text-chalk">{opp?.name ?? m.b}</span>
                <WrBar n={m} />
                <span className="lg-vs-num">
                  <span className="sez-num">{pctText(m.r)}</span>
                  <small>{gamesText(m.games)}</small>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
