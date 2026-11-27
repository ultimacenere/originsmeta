import Link from "next/link";
import { GameCardFace } from "@/components/GameCard";
import { protoMeta } from "@/components/proto/ProtoBar";
import { CopyCode } from "@/components/proto/sezioni/CopyCode";
import { Band, MoveTag, SezHead, Spark, WrBar } from "@/components/proto/sezioni/parts";
import { gameInput } from "@/lib/proto/analyticsProto";
import { cardOf, deckLinks, gamesText, listKeyOf, loadSez, moveOf, pctText, publishedByList, sezHref } from "@/lib/proto/sezioni";

/*
  Panoramica del prototipo «Analytics a sezioni» (27/11/2026, rifinita lo stesso giorno: "Telefono, Grafica, Contenuti").
  Fasce come /analytics di oggi: la patch in breve (frasi calcolate e numeri principali), il podio delle Leggendarie, chi
  sale e chi scende, i mazzi da copiare, le carte più giocate. Ogni fascia porta alla sua sezione.
*/

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni", "Analytics: panoramica (prototipo)", "Prototipo: la panoramica di Analytics di OriginsMeta, con i numeri veri del Tracker.");
}

const L = {
  brief: "La patch in breve",
  games: "Partite registrate",
  legsGames: (n: string) => `${n} con la Leggendaria avversaria nota`,
  strongestLine: (name: string, p: string, g: string, both: boolean, share: string) =>
    both ? (
      <>
        <b>{name}</b> è la Leggendaria più forte ed è anche la più giocata: vince il <b>{p}</b> ({g}) ed è in campo nel {share} delle partite.
      </>
    ) : (
      <>
        <b>{name}</b> è la Leggendaria più forte: vince il <b>{p}</b> ({g}).
      </>
    ),
  moverLine: (name: string, from: string, to: string, prev: string, up: boolean) => (
    <>
      <b>{name}</b> {up ? "sale" : "scende"} più di tutte dalla patch {prev}: da {from} a <b>{to}</b>.
    </>
  ),
  deckLine: (name: string, p: string, g: string) => (
    <>
      La lista migliore è <b>{name}</b>: vince il <b>{p}</b> ({g}).
    </>
  ),
  podium: "Il podio delle Leggendarie",
  podiumNote: "Ordinate per il caso peggiore: conta il bordo basso dell'intervallo al 95%, così una Leggendaria con poche partite non sale per caso.",
  medals: ["1º", "2º", "3º"],
  movers: "Chi sale e chi scende",
  up: "Salgono",
  down: "Scendono",
  sureNote: "In grigio gli spostamenti non ancora netti: gli intervalli al 95% si toccano ancora.",
  decks: "Mazzi da copiare",
  cards: "Le carte più giocate",
  cardsNote: "La percentuale grande dice in quante partite c'è la carta.",
  all: "Vedi tutto",
  builder: "Apri nel deck builder",
  won: (p: string) => `${p} vinte`,
  round: (t: string) => `round ${t}`,
};

export default async function Panoramica({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sez = await loadSez(searchParams);
  if (!sez)
    return (
      <Band top tone="stage">
        <p className="text-pale">I numeri del Tracker non rispondono: riprova fra qualche minuto.</p>
      </Band>
    );
  const { cur, prev, all } = sez;
  const h = (p: string) => sezHref(p, sez);
  const prudent = [...cur.legendaries].sort((a, b) => b.lo - a.lo);
  const strongest = prudent[0];
  const mostPlayed = [...cur.legendaries].sort((a, b) => b.games - a.games)[0];
  const sameTop = mostPlayed?.slug === strongest?.slug;

  const published = await publishedByList();
  const lists = [...cur.lists].sort((a, b) => b.lo - a.lo).slice(0, 3);
  const listRows = await Promise.all(
    lists.map(async (l, i) => {
      const pub = published.get(listKeyOf(l.legendary, l.cards))?.[0] ?? null;
      const name = pub?.name ?? `${cardOf(l.legendary)?.name ?? l.legendary} · lista ${i + 1}`;
      return { l, pub, name, links: await deckLinks(l.legendary, l.cards, name) };
    }),
  );

  const moves = prev
    ? cur.legendaries.flatMap((l) => {
        const m = moveOf(prev.legendaries.find((x) => x.slug === l.slug), l);
        return m ? [{ l, m }] : [];
      })
    : [];
  const ups = moves.filter((x) => x.m.points > 0).sort((a, b) => b.m.points - a.m.points).slice(0, 3);
  const downs = moves.filter((x) => x.m.points < 0).sort((a, b) => a.m.points - b.m.points).slice(0, 3);
  const bigMove = [...moves].sort((a, b) => Math.abs(b.m.points) - Math.abs(a.m.points))[0];
  const topCards = cur.cards.filter((c) => !cardOf(c.slug)?.legendary && c.deck).slice(0, 6);
  const name = (slug: string) => cardOf(slug)?.name ?? slug;

  const brief = [
    strongest ? L.strongestLine(name(strongest.slug), pctText(strongest.r), gamesText(strongest.games), sameTop, pctText(strongest.share)) : null,
    bigMove && prev ? L.moverLine(name(bigMove.l.slug), pctText(bigMove.m.before.r), pctText(bigMove.m.after.r), prev.label, bigMove.m.points > 0) : null,
    listRows[0] ? L.deckLine(listRows[0].name, pctText(listRows[0].l.r), gamesText(listRows[0].l.games)) : null,
  ].filter(Boolean);

  return (
    <>
      <Band top tone="stage">
        <SezHead title={L.brief} brief={brief} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="sez-panel">
            <p className="sez-note">{L.games}</p>
            <p className="sez-num mt-1 text-3xl">{cur.games.toLocaleString("it-IT")}</p>
            <p className="sez-note">{L.legsGames(cur.matchedGames.toLocaleString("it-IT"))}</p>
          </div>
          {[strongest, sameTop ? prudent[1] : mostPlayed].filter(Boolean).map((l, i) => (
            <Link key={l!.slug} href={h(`/leggendarie/${l!.slug}`)} className="sez-panel block hover:border-mint">
              <p className="sez-note">{i === 0 ? (sameTop ? "La più forte e la più giocata" : "La più forte") : sameTop ? "Subito dietro" : "La più giocata"}</p>
              <p className="mt-1 truncate font-display text-lg font-semibold text-chalk">{name(l!.slug)}</p>
              <p className="sez-num text-2xl">{pctText(l!.r)}</p>
              <p className="sez-note">{gamesText(l!.games)}</p>
            </Link>
          ))}
          {listRows[0] ? (
            <Link href={h("/mazzi")} className="sez-panel block hover:border-mint">
              <p className="sez-note">Il mazzo migliore</p>
              <p className="mt-1 truncate font-display text-lg font-semibold text-chalk">{listRows[0].name}</p>
              <p className="sez-num text-2xl">{pctText(listRows[0].l.r)}</p>
              <p className="sez-note">{gamesText(listRows[0].l.games)}</p>
            </Link>
          ) : null}
        </div>
      </Band>

      {prudent.length >= 3 ? (
        <Band tone="felt">
          <SezHead title={L.podium} brief={[]} action={<Link href={h("/leggendarie")} className="link-mint text-sm font-bold">{L.all}</Link>} />
          <div className="an-podium has-3">
            {prudent.slice(0, 3).map((l, i) => (
              <article key={l.slug} className={`an-pod is-p${i + 1}`}>
                <Link href={h(`/leggendarie/${l.slug}`)} prefetch={false} className="an-pod-card">
                  {cardOf(l.slug) ? <GameCardFace input={gameInput(cardOf(l.slug)!)} lang="it" /> : null}
                </Link>
                <div className="an-panel an-pod-plate">
                  <span className="an-medal">{L.medals[i]}</span>
                  <h3>{name(l.slug)}</h3>
                  <div className="an-big-wr">
                    {Math.round(l.r * 1000) / 10}
                    <small>%</small>
                  </div>
                  <WrBar n={l} className="mt-2" />
                  <p className="sez-note mt-2">
                    {gamesText(l.games)} · fra {pctText(l.lo)} e {pctText(l.hi)}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="sez-note mx-auto mt-4 max-w-2xl text-center">{L.podiumNote}</p>
        </Band>
      ) : null}

      {prev ? (
        <Band tone="deep">
          <SezHead
            title={L.movers}
            brief={[`Dalla patch ${prev.label} alla ${cur.label}.`]}
            action={<Link href={h("/tendenze")} className="link-mint text-sm font-bold">{L.all}</Link>}
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              { t: L.up, rows: ups },
              { t: L.down, rows: downs },
            ].map((g) => (
              <div key={g.t} className="sez-panel">
                <p className="font-display font-semibold text-chalk">{g.t}</p>
                <ul className="mt-2 grid gap-2">
                  {g.rows.map(({ l, m }) => (
                    <li key={l.slug}>
                      <Link href={h(`/leggendarie/${l.slug}`)} className="flex items-center gap-3 hover:text-mint">
                        <Portrait slug={l.slug} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display font-semibold text-chalk">{name(l.slug)}</span>
                          <span className="sez-note">
                            {pctText(m.before.r)} → {pctText(m.after.r)}
                          </span>
                        </span>
                        <span className="hidden sm:block">
                          <Spark points={all.map((p) => p.legendaries.find((x) => x.slug === l.slug)?.r ?? null)} width={64} height={24} />
                        </span>
                        <MoveTag m={m} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="sez-note mt-2">{L.sureNote}</p>
        </Band>
      ) : null}

      <Band tone="felt">
        <SezHead title={L.decks} brief={[]} action={<Link href={h("/mazzi")} className="link-mint text-sm font-bold">{L.all}</Link>} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {listRows.map(({ l, pub, name: deckName, links }) => (
            <div key={listKeyOf(l.legendary, l.cards)} className="sez-panel flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-20 shrink-0">{cardOf(l.legendary) ? <GameCardFace input={gameInput(cardOf(l.legendary)!)} lang="it" /> : null}</div>
                <div className="min-w-0">
                  {pub ? (
                    <Link href={`/it/decks/community/${pub.slug}`} className="block truncate font-display font-semibold text-chalk hover:text-mint">
                      {deckName}
                    </Link>
                  ) : (
                    <p className="truncate font-display font-semibold text-chalk">{deckName}</p>
                  )}
                  {pub?.author ? <p className="sez-note truncate">{pub.author}</p> : null}
                  <p className="sez-num text-2xl">{pctText(l.r)}</p>
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
      </Band>

      <Band tone="deep">
        <SezHead title={L.cards} brief={[L.cardsNote]} action={<Link href={h("/carte")} className="link-mint text-sm font-bold">{L.all}</Link>} />
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {topCards.map((c) => {
            const card = cardOf(c.slug);
            if (!card) return null;
            return (
              <li key={c.slug} className="text-center">
                <Link href={`/it/cards/${c.slug}`} className="block">
                  <GameCardFace input={gameInput(card)} lang="it" />
                </Link>
                <p className="sez-num mt-1 text-lg">{pctText(c.deckShare)}</p>
                <p className="sez-note">
                  {c.deck ? L.won(pctText(c.deck.r)) : ""}
                  {c.avgTurn ? ` · ${L.round(c.avgTurn.toLocaleString("it-IT", { maximumFractionDigits: 1 }))}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </Band>
    </>
  );
}

function Portrait({ slug }: { slug: string }) {
  const art = cardOf(slug)?.art ?? cardOf(slug)?.thumb;
  return (
    <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/25 bg-night-3">
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element -- ritaglio tondo dell'arte, WebP piccolo
        <img src={art} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-[50%_20%]" />
      ) : null}
    </span>
  );
}
