import Link from "next/link";
import { protoMeta } from "@/components/proto/ProtoBar";
import { MoveTag, Spark, WrBar } from "@/components/proto/sezioni/parts";
import { cardOf, gamesText, legendaryLine, loadSez, moveOf, pctText, sezHref } from "@/lib/proto/sezioni";
import "@/components/proto/sezioni/leggendarie/leggendarie.css";

/*
  Sezione «Leggendarie» del prototipo «Analytics a sezioni» (27/11/2026): la classifica della patch scelta, contata a
  due lati, ordinata per il caso peggiore (bordo basso dell'intervallo al 95%), con lo spostamento sulla patch prima e la
  linea sulle quattro patch del Tracker. Ogni riga apre la pagina della Leggendaria.
*/

const L = {
  title: "Leggendarie",
  lead: "Ordinate per il caso peggiore: in cima chi vince anche nell'ipotesi meno favorevole. Contano tutti e due i lati di ogni partita.",
  share: (p: string) => `in campo nel ${p} delle partite`,
  wr: "vittorie",
  prev: (label: string) => `Lo spostamento è sulla patch ${label}; in grigio quando non è ancora netto.`,
  none: "I numeri del Tracker non rispondono: riprova fra qualche minuto.",
  aria: (name: string) => `Apri ${name}`,
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni/leggendarie", "Leggendarie · Analytics a sezioni", "Prototipo: la classifica delle Leggendarie di Origins TCG con i dati veri del Tracker.");
}

export default async function LeggendariePage({ searchParams }: { searchParams: SP }) {
  const sez = await loadSez(searchParams);
  if (!sez) return <p className="text-pale">{L.none}</p>;
  const { all, cur, prev } = sez;
  const rows = [...cur.legendaries].sort((a, b) => b.lo - a.lo || b.games - a.games);
  return (
    <section className="sez-section" aria-labelledby="lg-h">
      <h2 id="lg-h" className="sez-h2">
        {L.title}
      </h2>
      <p className="sez-lead">{L.lead}</p>
      <ol className="lg-list">
        {rows.map((l, i) => {
          const card = cardOf(l.slug);
          const line = legendaryLine(all, l.slug);
          const points = all.map((p) => line.find((x) => x.patch === p.patch)?.r ?? null);
          const move = moveOf(prev?.legendaries.find((x) => x.slug === l.slug), l);
          return (
            <li key={l.slug}>
              <Link href={sezHref(`/leggendarie/${l.slug}`, sez)} prefetch={false} className={`lg-row${l.games < 20 ? " sez-thin" : ""}`} aria-label={L.aria(card?.name ?? l.slug)}>
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
                  <b>{card?.name ?? l.slug}</b>
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
                  <MoveTag m={move} />
                </span>
                <span className="lg-spark">
                  <Spark points={points} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {prev ? <p className="sez-note mt-3">{L.prev(prev.label)}</p> : null}
    </section>
  );
}
