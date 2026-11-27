import Link from "@/components/IntentLink";
import { protoMeta } from "@/components/proto/ProtoBar";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { MoveTag, WrBar } from "@/components/proto/sezioni/parts";
import { MazziList, type MDeck, type MThumb, type MLeg } from "@/components/proto/sezioni/mazzi/MazziList";
import { archetypeLabels } from "@/lib/data/decks";
import { gameInput } from "@/lib/proto/analyticsProto";
import { cardOf, gamesText, listKeyOf, loadSez, moveOf, pctText, publishedByList } from "@/lib/proto/sezioni";

/*
  Prototipo «Analytics a sezioni», sezione Mazzi (27/11/2026). I mazzi migliori da copiare: le liste esatte registrate dal
  Tracker nella patch scelta, ordinate per win rate prudente (bordo basso dell'intervallo al 95%), con il codice del gioco
  e il deck builder; sotto, gli archetipi.
*/

const L = {
  title: "Mazzi migliori da copiare",
  meta: "Mazzi migliori da copiare: prototipo di Analytics",
  description: "Prototipo: le liste esatte di Origins TCG che vincono di più nel Tracker, con il codice del gioco da copiare.",
  lead: "Le liste esatte, tutte e 13 le carte uguali, registrate dal Tracker in questa patch. Prima quelle che vincono di più anche nel caso peggiore: una lista con poche partite resta sotto finché non le accumula.",
  archTitle: "Archetipi",
  archLead: "Come vanno i tipi di mazzo. Quota: le partite giocate con quell'archetipo.",
  archNote: "L'archetipo è quello che il Tracker assegna alla partita quando la registra, non quello scelto da chi ha pubblicato il mazzo.",
  share: "delle partite",
  vsPrev: (label: string) => `rispetto a ${label}`,
  arrows: (label: string) => `Le frecce: punti di win rate rispetto a ${label}, colorate solo quando lo spostamento è netto.`,
  legendsLink: "Le carte di ogni Leggendaria sono nella sezione",
  legends: "Leggendarie",
  empty: "I numeri del Tracker non rispondono: riprova fra qualche minuto.",
};

export const revalidate = 300;
const PER_LEGENDARY = 30;

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni/mazzi", L.meta, L.description);
}

export default async function MazziPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sez = await loadSez(searchParams);
  if (!sez) return <p className="text-pale">{L.empty}</p>;
  const { cur, prev } = sez;
  const published = await publishedByList();

  const lists = [...cur.lists].sort((a, b) => b.lo - a.lo || b.games - a.games);
  const thumbs: Record<string, MThumb> = {};
  const legs: Record<string, MLeg> = {};
  const decks: MDeck[] = [];
  const perLeg = new Map<string, number>();
  for (const l of lists) {
    const leg = cardOf(l.legendary);
    if (!leg) continue;
    // al massimo 30 liste per Leggendaria: il filtro ne mostra 15 alla volta e la pagina resta leggera
    const seen = perLeg.get(l.legendary) ?? 0;
    if (seen >= PER_LEGENDARY) continue;
    perLeg.set(l.legendary, seen + 1);
    if (!legs[l.legendary]) legs[l.legendary] = { slug: leg.slug, name: leg.name, art: leg.art ?? leg.thumb ?? null, input: gameInput(leg) };
    for (const s of l.cards) {
      if (thumbs[s]) continue;
      const c = cardOf(s);
      if (c) thumbs[s] = { slug: s, name: c.name, thumb: c.thumb ?? null, mana: c.mana ?? null };
    }
    const cards = [...l.cards].sort((a, b) => (thumbs[a]?.mana ?? 99) - (thumbs[b]?.mana ?? 99) || (thumbs[a]?.name ?? a).localeCompare(thumbs[b]?.name ?? b));
    const pub = published.get(listKeyOf(l.legendary, l.cards))?.[0] ?? null;
    const name = pub?.name ?? `${leg.name} · lista ${decks.filter((d) => d.legendary === l.legendary).length + 1}`;
    const keys = [l.legendary, ...cards].map((x) => cardOf(x)?.key);
    decks.push({ id: listKeyOf(l.legendary, l.cards), legendary: l.legendary, cards, games: l.games, wins: l.wins, r: l.r, lo: l.lo, hi: l.hi, name, published: pub, keys: keys.every(Boolean) ? (keys as string[]) : null });
  }
  const legOrder = Object.keys(legs).sort((a, b) => decks.filter((d) => d.legendary === b).reduce((s, d) => s + d.games, 0) - decks.filter((d) => d.legendary === a).reduce((s, d) => s + d.games, 0));

  const archs = cur.archetypes.map((a) => {
    const before = prev?.archetypes.find((x) => x.archetype === a.archetype) ?? null;
    return { a, share: cur.games ? a.games / cur.games : 0, move: moveOf(before, a) };
  });

  return (
    <div>
      <section className="sez-section" aria-labelledby="mz-h">
        <h2 id="mz-h" className="sez-h2">
          {L.title}
        </h2>
        <p className="sez-lead">{L.lead}</p>
        <MazziList decks={decks} legs={legs} legOrder={legOrder} thumbs={thumbs} />
      </section>

      {archs.length ? (
        <section className="sez-section" aria-labelledby="mz-arch">
          <h2 id="mz-arch" className="sez-h2">
            {L.archTitle}
          </h2>
          <p className="sez-lead">{L.archLead}</p>
          <ul className="mt-4 grid grid-cols-1 gap-2">
            {archs.map(({ a, share, move }) => {
              const name = archetypeLabels[a.archetype]?.it ?? a.archetype;
              return (
                <li key={a.archetype} className={`sez-panel grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 ${a.games < 20 ? "sez-thin" : ""}`}>
                  <ArchetypeIcon id={a.archetype} size="md" />
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-chalk">{name}</p>
                    <p className="sez-note">
                      {pctText(share)} {L.share} · {gamesText(a.games)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="sez-num text-xl">{pctText(a.r)}</p>
                    {prev ? (
                      <p className="sez-note" title={L.vsPrev(prev.label)}>
                        <MoveTag m={move} />
                      </p>
                    ) : null}
                  </div>
                  <WrBar n={a} className="col-span-3" />
                </li>
              );
            })}
          </ul>
          <p className="sez-note mt-3">{L.archNote}</p>
          {prev ? <p className="sez-note mt-1">{L.arrows(prev.label)}</p> : null}
        </section>
      ) : null}
      <p className="sez-note mt-8">
        {L.legendsLink}{" "}
        <Link href="/it/proto/analytics/sezioni/leggendarie" className="text-mint underline-offset-2 hover:underline">
          {L.legends}
        </Link>
        .
      </p>
    </div>
  );
}
