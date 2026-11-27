import Link from "next/link";
import { notFound } from "next/navigation";
import { GameCardFace } from "@/components/GameCard";
import { protoMeta } from "@/components/proto/ProtoBar";
import { MoveTag, Spark, WrBar } from "@/components/proto/sezioni/parts";
import { CopyCode } from "@/components/proto/sezioni/leggendarie/CopyCode";
import { cardsOfLegendary, gameInput, type ProtoMatchup } from "@/lib/proto/analyticsProto";
import { cardOf, deckLinks, gamesText, legendaryLine, listKeyOf, loadAll, loadSez, moveOf, pctText, pointsText, publishedByList, sezHref, type Sez } from "@/lib/proto/sezioni";
import type { ChangeKind } from "@/lib/data/cards";
import "@/components/proto/sezioni/leggendarie/leggendarie.css";

/*
  Pagina di una Leggendaria nel prototipo «Analytics a sezioni» (27/11/2026): i suoi numeri nella patch scelta, le carte
  che porta (dalle liste esatte registrate, con e senza), contro chi vince e contro chi soffre (a due lati), le sue liste
  migliori da copiare e come è andata sulle quattro patch del Tracker, con le modifiche di Koin a lei e alle sue carte.
*/

const L = {
  back: "Tutte le Leggendarie",
  wr: "Vittorie",
  share: "In campo",
  shareSub: "delle partite",
  rank: "In classifica",
  rankSub: (n: number) => `su ${n}, per il caso peggiore`,
  move: "Sulla patch prima",
  moveSub: (label: string) => `rispetto a ${label}`,
  moveNone: "prima patch con i suoi numeri",
  range: (lo: string, hi: string) => `fra ${lo} e ${hi}`,
  cardsTitle: "Le carte che porta",
  cardsLead: (games: string) => `Dalle liste esatte registrate con questa Leggendaria (${games}). Per ogni carta: quanto spesso c'è e come vanno le liste con e senza.`,
  cardsNone: "Nessuna lista esatta registrata in questa patch.",
  inLists: (p: string) => `in ${p} delle liste`,
  withW: "con",
  withoutW: "senza",
  always: "c'è sempre",
  others: "Anche, più di rado:",
  vsTitle: "Contro chi vince e contro chi soffre",
  vsLead: "Gli scontri contati da tutti e due i lati: la percentuale è quanto vince lei.",
  best: "Vince contro",
  worst: "Soffre contro",
  vsNone: "Nessuno scontro registrato.",
  listsTitle: "Le sue liste migliori",
  listsLead: "Le liste esatte con almeno 5 partite e il risultato migliore nel caso peggiore, pronte da copiare.",
  listsNone: "Nessuna lista esatta registrata in questa patch.",
  listName: (i: number) => `Lista ${i}`,
  published: (name: string, author: string | null) => (author ? `Pubblicata come «${name}» da ${author}` : `Pubblicata come «${name}»`),
  open: "Apri il mazzo",
  builder: "Apri nel deck builder",
  timeTitle: "Nel tempo",
  timeLead: "Le quattro patch del Tracker, con le modifiche di Koin a lei e alle carte che porta più spesso.",
  noData: "nessun numero",
  noChange: "nessuna modifica",
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

export default async function LeggendariaPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { slug } = await params;
  const card = cardOf(slug);
  if (!card?.legendary) notFound();
  const sez = await loadSez(searchParams);
  if (!sez) return <p className="text-pale">{L.none}</p>;
  const { cur, prev } = sez;
  const leg = cur.legendaries.find((l) => l.slug === slug);
  if (!leg) notFound();

  const ranked = [...cur.legendaries].sort((a, b) => b.lo - a.lo || b.games - a.games);
  const rank = ranked.findIndex((l) => l.slug === slug) + 1;
  const move = moveOf(prev?.legendaries.find((l) => l.slug === slug), leg);

  /* carte che porta */
  const carried = cardsOfLegendary(cur.lists, slug);
  const shown = carried.cards.filter((c) => c.share >= 0.15).slice(0, 16);
  const rest = carried.cards.filter((c) => !shown.includes(c));

  /* scontri */
  const mus = cur.matchups.filter((m) => m.a === slug && m.b !== slug && m.games > 0);
  const best = [...mus].sort((a, b) => b.lo - a.lo || b.games - a.games).slice(0, 4);
  const worst = [...mus].sort((a, b) => a.hi - b.hi || b.games - a.games).filter((m) => !best.includes(m)).slice(0, 4);

  /* liste migliori */
  // le liste con almeno 5 partite, se ce ne sono: una partita vinta su una non è una lista "migliore"
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
    <div>
      <Link href={sezHref("/leggendarie", sez)} prefetch={false} className="link-mint text-sm font-bold">
        {L.back}
      </Link>

      <header className="lg-head mt-4">
        <div className="lg-head-card">
          <GameCardFace input={gameInput(card)} lang="it" />
        </div>
        <div>
          <h2 className="lg-head-name">{card.name}</h2>
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

      <section className="sez-section mt-10" aria-labelledby="lg-cards-h">
        <h2 id="lg-cards-h" className="sez-h2">
          {L.cardsTitle}
        </h2>
        {carried.games ? (
          <>
            <p className="sez-lead">{L.cardsLead(gamesText(carried.games))}</p>
            <ul className="lg-cards">
              {shown.map((c) => {
                const info = cardOf(c.slug);
                if (!info) return null;
                const up = c.without && c.with.lo > c.without.hi;
                const down = c.without && c.with.hi < c.without.lo;
                return (
                  <li key={c.slug} className="lg-card">
                    {up || down ? <span className={`pen-note ${up ? "is-up" : "is-down"}`}>{pointsText(Math.round((c.with.r - (c.without?.r ?? 0)) * 100))}</span> : null}
                    <div className="lg-card-face">
                      <GameCardFace input={gameInput(info)} lang="it" />
                    </div>
                    <p className="lg-card-num">
                      <b>{c.share >= 0.995 ? L.always : L.inLists(pctText(c.share))}</b>
                      <br />
                      {L.withW} <b>{pctText(c.with.r)}</b> <small>({gamesText(c.with.games)})</small>
                      {c.without ? (
                        <>
                          <br />
                          {L.withoutW} <b>{pctText(c.without.r)}</b> <small>({gamesText(c.without.games)})</small>
                        </>
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ul>
            {rest.length ? (
              <p className="sez-note mt-4">
                {L.others} {rest.map((c) => `${cardOf(c.slug)?.name ?? c.slug} (${pctText(c.share)})`).join(", ")}.
              </p>
            ) : null}
          </>
        ) : (
          <p className="sez-lead">{L.cardsNone}</p>
        )}
      </section>

      <section className="sez-section" aria-labelledby="lg-vs-h">
        <h2 id="lg-vs-h" className="sez-h2">
          {L.vsTitle}
        </h2>
        <p className="sez-lead">{L.vsLead}</p>
        {mus.length ? (
          <div className="lg-vs">
            <VsList title={L.best} rows={best} sez={sez} tone="sez-up" />
            <VsList title={L.worst} rows={worst} sez={sez} tone="sez-down" />
          </div>
        ) : (
          <p className="sez-note mt-3">{L.vsNone}</p>
        )}
      </section>

      <section className="sez-section" aria-labelledby="lg-lists-h">
        <h2 id="lg-lists-h" className="sez-h2">
          {L.listsTitle}
        </h2>
        <p className="sez-lead">{L.listsLead}</p>
        {listRows.length ? (
          <div className="lg-lists">
            {listRows.map(({ l, pub, links, sorted }, i) => (
              <article key={l.cards.join(",")} className={`sez-panel${l.games < THIN ? " sez-thin" : ""}`}>
                <div className="lg-list-head">
                  <span className="lg-list-name">{pub ? pub.name : L.listName(i + 1)}</span>
                  <span className="text-sm text-pale">
                    <span className="sez-num">{pctText(l.r)}</span> · {gamesText(l.games)} · {L.range(pctText(l.lo), pctText(l.hi))}
                  </span>
                </div>
                {pub ? <p className="sez-note mt-1">{L.published(pub.name, pub.author)}</p> : null}
                <ul className="lg-chips">
                  {sorted.map((s) => {
                    const c = cardOf(s);
                    return (
                      <li key={s} className="lg-chip">
                        <i>{c?.mana ?? "?"}</i>
                        {c?.name ?? s}
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
        ) : (
          <p className="sez-note mt-3">{L.listsNone}</p>
        )}
      </section>

      <section className="sez-section" aria-labelledby="lg-time-h">
        <h2 id="lg-time-h" className="sez-h2">
          {L.timeTitle}
        </h2>
        <p className="sez-lead">{L.timeLead}</p>
        <div className="mt-3">
          <Spark points={all.map((p) => line.find((x) => x.patch === p.patch)?.r ?? null)} width={220} height={48} />
        </div>
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
              <span className="text-sm text-pale">{pt ? pctText(pt.share) : ""}</span>
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
      </section>
    </div>
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
