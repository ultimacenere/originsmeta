import Link from "next/link";
import { GameCardFace } from "@/components/GameCard";
import { protoMeta } from "@/components/proto/ProtoBar";
import { CopyCode } from "@/components/proto/sezioni/CopyCode";
import { MoveTag, Spark, WrBar } from "@/components/proto/sezioni/parts";
import { gameInput } from "@/lib/proto/analyticsProto";
import { cardOf, deckLinks, gamesText, legendaryLine, listKeyOf, loadSez, moveOf, pctText, publishedByList, sezHref } from "@/lib/proto/sezioni";

/*
  Panoramica del prototipo «Analytics a sezioni» (27/11/2026): i numeri principali della patch e un assaggio di ogni
  sezione, ognuno col suo link. Tutto dal Tracker.
*/

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni", "Analytics: panoramica (prototipo)", "Prototipo: la panoramica di Analytics di OriginsMeta, con i numeri veri del Tracker.");
}

const L = {
  games: "Partite nella patch",
  strongest: "La più forte",
  strongestBoth: "La più forte e la più giocata",
  runnerUp: "Subito dietro",
  mostPlayed: "La più giocata",
  bestDeck: "Il mazzo migliore",
  share: (p: string) => `in campo nel ${p} delle partite`,
  movers: "Chi sale e chi scende",
  moversLead: "Le Leggendarie rispetto alla patch prima.",
  up: "Salgono",
  down: "Scendono",
  none: "Nessuno spostamento netto.",
  decks: "Mazzi da copiare",
  decksLead: "Le liste esatte che vincono di più, col caso peggiore davanti.",
  legs: "Le Leggendarie",
  legsLead: "Tocca una Leggendaria per le sue carte, i suoi scontri e le sue liste.",
  cards: "Le carte più giocate",
  cardsLead: "In quante partite c'è la carta, e come va.",
  all: "Vedi tutto",
  builder: "Apri nel deck builder",
  roundOf: (t: string) => `round ${t}`,
  sureNote: "In grigio gli spostamenti non ancora netti: gli intervalli al 95% si toccano ancora.",
};

export default async function Panoramica({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sez = await loadSez(searchParams);
  if (!sez) return <p className="text-pale">I numeri del Tracker non rispondono: riprova fra qualche minuto.</p>;
  const { cur, prev, all } = sez;
  const h = (p: string) => sezHref(p, sez);
  const prudent = [...cur.legendaries].sort((a, b) => b.lo - a.lo);
  const strongest = prudent[0];
  const mostPlayedRaw = [...cur.legendaries].sort((a, b) => b.games - a.games)[0];
  // se la più giocata è anche la più forte, il secondo riquadro mostra chi le sta subito dietro
  const sameTop = mostPlayedRaw?.slug === strongest?.slug;
  const mostPlayed = sameTop ? prudent[1] : mostPlayedRaw;
  const lists = [...cur.lists].sort((a, b) => b.lo - a.lo).slice(0, 3);
  const published = await publishedByList();
  const listRows = await Promise.all(
    lists.map(async (l) => {
      const pub = published.get(listKeyOf(l.legendary, l.cards))?.[0] ?? null;
      const name = pub?.name ?? `${cardOf(l.legendary)?.name ?? l.legendary}`;
      return { l, pub, name, links: await deckLinks(l.legendary, l.cards, name) };
    }),
  );
  const moves = prev
    ? cur.legendaries
        .map((l) => ({ l, m: moveOf(prev.legendaries.find((x) => x.slug === l.slug), l) }))
        .filter((x): x is { l: (typeof cur.legendaries)[number]; m: NonNullable<ReturnType<typeof moveOf>> } => !!x.m)
    : [];
  const ups = moves.filter((x) => x.m.points > 0).sort((a, b) => b.m.points - a.m.points).slice(0, 3);
  const downs = moves.filter((x) => x.m.points < 0).sort((a, b) => a.m.points - b.m.points).slice(0, 3);
  const topCards = cur.cards.filter((c) => !cardOf(c.slug)?.legendary && c.deck).slice(0, 6);

  return (
    <div>
      {/* i numeri della patch */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="sez-panel">
          <p className="sez-note">{L.games}</p>
          <p className="sez-num mt-1 text-3xl">{cur.games.toLocaleString("it-IT")}</p>
          <p className="sez-note">{cur.label}</p>
        </div>
        {strongest ? <LegCell title={sameTop ? L.strongestBoth : L.strongest} slug={strongest.slug} r={strongest.r} games={strongest.games} sub={L.share(pctText(strongest.share))} href={h(`/leggendarie/${strongest.slug}`)} /> : null}
        {mostPlayed ? <LegCell title={sameTop ? L.runnerUp : L.mostPlayed} slug={mostPlayed.slug} r={mostPlayed.r} games={mostPlayed.games} sub={L.share(pctText(mostPlayed.share))} href={h(`/leggendarie/${mostPlayed.slug}`)} /> : null}
        {listRows[0] ? (
          <Link href={h("/mazzi")} className="sez-panel block hover:border-mint">
            <p className="sez-note">{L.bestDeck}</p>
            <p className="mt-1 font-display text-lg font-semibold text-chalk">{listRows[0].name}</p>
            <p className="sez-num text-2xl">{pctText(listRows[0].l.r)}</p>
            <p className="sez-note">{gamesText(listRows[0].l.games)}</p>
          </Link>
        ) : null}
      </div>

      {/* chi sale e chi scende */}
      {prev ? (
        <section className="sez-section mt-10">
          <Head title={L.movers} lead={`${L.moversLead} (${prev.label} → ${cur.label})`} href={h("/tendenze")} />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              { t: L.up, rows: ups },
              { t: L.down, rows: downs },
            ].map((g) => (
              <div key={g.t} className="sez-panel">
                <p className="font-display font-semibold text-chalk">{g.t}</p>
                {g.rows.length ? (
                  <ul className="mt-2 grid gap-2">
                    {g.rows.map(({ l, m }) => (
                      <li key={l.slug}>
                        <Link href={h(`/leggendarie/${l.slug}`)} className="flex items-center gap-3 hover:text-mint">
                          <Portrait slug={l.slug} />
                          <span className="min-w-0 flex-1 truncate font-display font-semibold text-chalk">{cardOf(l.slug)?.name}</span>
                          <Spark points={legendaryLine(all, l.slug).map((p) => p.r)} width={72} height={24} />
                          <MoveTag m={m} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="sez-note mt-2">{L.none}</p>
                )}
              </div>
            ))}
          </div>
          <p className="sez-note mt-2">{L.sureNote}</p>
        </section>
      ) : null}

      {/* mazzi da copiare */}
      <section className="sez-section mt-10">
        <Head title={L.decks} lead={L.decksLead} href={h("/mazzi")} />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {listRows.map(({ l, pub, name, links }) => (
            <div key={listKeyOf(l.legendary, l.cards)} className="sez-panel flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-16 shrink-0">{cardOf(l.legendary) ? <GameCardFace input={gameInput(cardOf(l.legendary)!)} lang="it" /> : null}</div>
                <div className="min-w-0">
                  {pub ? (
                    <Link href={`/it/decks/community/${pub.slug}`} className="block truncate font-display font-semibold text-chalk hover:text-mint">
                      {name}
                    </Link>
                  ) : (
                    <p className="truncate font-display font-semibold text-chalk">{name}</p>
                  )}
                  {pub?.author ? <p className="sez-note truncate">{pub.author}</p> : null}
                  <p className="sez-num text-xl">{pctText(l.r)}</p>
                  <p className="sez-note">{gamesText(l.games)}</p>
                </div>
              </div>
              <WrBar n={l} />
              <div className="mt-auto flex flex-wrap gap-2">
                {links.code ? <CopyCode code={links.code} /> : null}
                <Link href={links.builder} prefetch={false} className="btn btn-ghost text-xs">
                  {L.builder}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* le leggendarie */}
      <section className="sez-section mt-10">
        <Head title={L.legs} lead={L.legsLead} href={h("/leggendarie")} />
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {prudent.map((l) => (
            <li key={l.slug}>
              <Link href={h(`/leggendarie/${l.slug}`)} className="sez-panel flex items-center gap-3 hover:border-mint">
                <Portrait slug={l.slug} />
                <span className="min-w-0">
                  <span className="block truncate font-display font-semibold text-chalk">{cardOf(l.slug)?.name}</span>
                  <span className={`sez-num ${l.games < 20 ? "opacity-60" : ""}`}>{pctText(l.r)}</span> <span className="sez-note">{gamesText(l.games)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* le carte */}
      <section className="sez-section mt-10">
        <Head title={L.cards} lead={L.cardsLead} href={h("/carte")} />
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {topCards.map((c) => {
            const card = cardOf(c.slug);
            if (!card) return null;
            return (
              <li key={c.slug} className="text-center">
                <Link href={`/it/cards/${c.slug}`} className="block">
                  <GameCardFace input={gameInput(card)} lang="it" />
                </Link>
                <p className="sez-num mt-1">{pctText(c.deckShare)}</p>
                <p className="sez-note">
                  {c.deck ? `${pctText(c.deck.r)} vinte` : ""}
                  {c.avgTurn ? ` · ${L.roundOf(c.avgTurn.toLocaleString("it-IT", { maximumFractionDigits: 1 }))}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Head({ title, lead, href }: { title: string; lead: string; href: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="sez-h2">{title}</h2>
        <p className="sez-lead">{lead}</p>
      </div>
      <Link href={href} className="link-mint text-sm font-bold">
        {L.all}
      </Link>
    </div>
  );
}

function Portrait({ slug }: { slug: string }) {
  const art = cardOf(slug)?.art ?? cardOf(slug)?.thumb;
  return (
    <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/25 bg-night-3">
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element -- ritaglio tondo dell'arte, WebP piccolo
        <img src={art} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-[50%_20%]" />
      ) : null}
    </span>
  );
}

function LegCell({ title, slug, r, games, sub, href }: { title: string; slug: string; r: number; games: number; sub: string; href: string }) {
  return (
    <Link href={href} className="sez-panel block hover:border-mint">
      <p className="sez-note">{title}</p>
      <div className="mt-1 flex items-center gap-2">
        <Portrait slug={slug} />
        <p className="min-w-0 truncate font-display text-lg font-semibold text-chalk">{cardOf(slug)?.name}</p>
      </div>
      <p className="sez-num mt-1 text-2xl">{pctText(r)}</p>
      <p className="sez-note">
        {gamesText(games)} · {sub}
      </p>
    </Link>
  );
}
