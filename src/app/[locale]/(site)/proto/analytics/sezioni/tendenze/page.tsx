import Link from "next/link";
import { GameCardFace } from "@/components/GameCard";
import { protoMeta } from "@/components/proto/ProtoBar";
import { MoveTag, Spark } from "@/components/proto/sezioni/parts";
import { gameInput, protoNum, type Num } from "@/lib/proto/analyticsProto";
import { cardOf, gamesText, loadSez, moveOf, pctText, sezHref, type Move } from "@/lib/proto/sezioni";

/*
  Sezione «Chi sale e chi scende» del prototipo a sezioni (27/11/2026, Pierluigi: "Chi sale e chi scende"): le
  Leggendarie e le carte che si sono spostate fra la patch scelta e quella prima, e le modifiche di Koin della patch.
  Uno spostamento è colorato solo quando è netto (intervalli al 95% che non si toccano).
*/

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni/tendenze", "Analytics: chi sale e chi scende (prototipo)", "Prototipo: le Leggendarie e le carte di Origins TCG che salgono e scendono fra una patch e l'altra.");
}

const KIND: Record<string, string> = { buff: "Potenziata", nerf: "Indebolita", rework: "Rifatta", deck: "Cambio di mazzo" };

const L = {
  title: "Chi sale e chi scende",
  lead: (a: string, b: string) => `Dalla patch ${a} alla ${b}. In grigio gli spostamenti non ancora netti.`,
  first: "Questa è la prima patch con i numeri del Tracker: non c'è una patch prima con cui confrontarla.",
  legs: "Leggendarie: il win rate",
  legsLead: "Contato da tutti e due i lati. La linea mostra le quattro patch.",
  picks: "Carte: quanto si giocano",
  picksLead: "In quante partite è nel mazzo, prima e dopo.",
  more: "Più giocate",
  less: "Meno giocate",
  koin: "Cosa ha cambiato Koin in questa patch",
  koinLead: "Le carte toccate dalla patch, con il prima e il dopo nei mazzi.",
  noKoin: "Nessuna carta modificata in questa patch.",
  fresh: "Patch di pochi giorni: i numeri si muoveranno ancora.",
};

export default async function Tendenze({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sez = await loadSez(searchParams);
  if (!sez) return <p className="text-pale">I numeri del Tracker non rispondono: riprova fra qualche minuto.</p>;
  const { cur, prev, all } = sez;
  const h = (p: string) => sezHref(p, sez);
  if (!prev) {
    return (
      <div>
        <h2 className="sez-h2">{L.title}</h2>
        <p className="sez-lead">{L.first}</p>
      </div>
    );
  }

  const legRows = cur.legendaries
    .map((l) => ({ slug: l.slug, now: l as Num, m: moveOf(prev.legendaries.find((x) => x.slug === l.slug), l) }))
    .sort((a, b) => (b.m?.points ?? -999) - (a.m?.points ?? -999));

  // quota nei mazzi come proporzione con il suo intervallo: partite col la carta su partite della patch
  const shareNum = (deckGames: number | undefined, games: number) => protoNum(deckGames ?? 0, games);
  const cardMoves = cur.cards
    .filter((c) => !cardOf(c.slug)?.legendary && c.deck)
    .map((c) => {
      const before = prev.cards.find((x) => x.slug === c.slug);
      const m = moveOf(shareNum(before?.deck?.games, prev.games), shareNum(c.deck?.games, cur.games));
      return { c, m, wr: c.deck };
    })
    .filter((x): x is typeof x & { m: Move } => !!x.m && x.c.deck!.games >= 20);
  const more = [...cardMoves].filter((x) => x.m.points > 0).sort((a, b) => b.m.points - a.m.points).slice(0, 8);
  const less = [...cardMoves].filter((x) => x.m.points < 0).sort((a, b) => a.m.points - b.m.points).slice(0, 8);

  const changed = cur.cards
    .map((c) => ({ c, card: cardOf(c.slug) }))
    .filter((x) => x.card?.history.some((h) => h.patch === cur.patch));
  // l'ultima patch, ancora con molte meno partite della precedente
  const fresh = cur.patch === all.at(-1)?.patch && cur.games < prev.games / 2;

  return (
    <div>
      <h2 className="sez-h2">{L.title}</h2>
      <p className="sez-lead">{L.lead(prev.label, cur.label)}</p>
      {fresh ? <p className="pen-note mt-2 text-gold">{L.fresh}</p> : null}

      <section className="sez-section mt-8">
        <h3 className="font-display text-lg font-semibold text-chalk">{L.legs}</h3>
        <p className="sez-note">{L.legsLead}</p>
        <ul className="mt-3 grid gap-1">
          {legRows.map(({ slug, now, m }) => (
            <li key={slug}>
              <Link href={h(`/leggendarie/${slug}`)} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 sm:grid-cols-[minmax(0,1fr)_96px_110px_80px]">
                <span className="truncate font-display font-semibold text-chalk">{cardOf(slug)?.name}</span>
                <span className="hidden sm:block">
                  <Spark points={all.map((p) => p.legendaries.find((x) => x.slug === slug)?.r ?? null)} />
                </span>
                <span className="text-right">
                  <span className="sez-num">{m ? `${pctText(m.before.r)} → ${pctText(now.r)}` : pctText(now.r)}</span>
                  <span className="sez-note block">{gamesText(now.games)}</span>
                </span>
                <span className="text-right">
                  <MoveTag m={m} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="sez-section mt-10">
        <h3 className="font-display text-lg font-semibold text-chalk">{L.picks}</h3>
        <p className="sez-note">{L.picksLead}</p>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { t: L.more, rows: more },
            { t: L.less, rows: less },
          ].map((g) => (
            <div key={g.t} className="sez-panel">
              <p className="font-display font-semibold text-chalk">{g.t}</p>
              <ul className="mt-2 grid gap-2">
                {g.rows.map(({ c, m, wr }) => (
                  <li key={c.slug}>
                    <Link href={`/it/cards/${c.slug}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 hover:text-mint sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                      <span className="min-w-0 truncate font-display font-semibold text-chalk">{cardOf(c.slug)?.name}</span>
                      <span className="sez-note col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                        {pctText(m.before.r)} → {pctText(m.after.r)}
                        {wr ? ` · ${pctText(wr.r)} vinte` : ""}
                      </span>
                      <MoveTag m={m} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="sez-section mt-10">
        <h3 className="font-display text-lg font-semibold text-chalk">{L.koin}</h3>
        <p className="sez-note">{L.koinLead}</p>
        {changed.length ? (
          <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {changed.map(({ c, card }) => {
              const before = prev.cards.find((x) => x.slug === c.slug);
              const ch = card!.history.find((h) => h.patch === cur.patch)!;
              const m = moveOf(shareNum(before?.deck?.games, prev.games), shareNum(c.deck?.games, cur.games));
              return (
                <li key={c.slug} className="text-center">
                  <Link href={`/it/cards/${c.slug}`} className="block">
                    <GameCardFace input={gameInput(card!)} lang="it" />
                  </Link>
                  <p className={`pen-note mt-1 ${ch.kind === "buff" ? "text-good" : ch.kind === "nerf" ? "text-crimson" : "text-gold"}`}>{KIND[ch.kind] ?? ch.kind}</p>
                  <p className="sez-note">{ch.note?.it}</p>
                  {m ? (
                    <p className="mt-1 text-sm">
                      nei mazzi {pctText(m.before.r)} → {pctText(m.after.r)} <MoveTag m={m} />
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="sez-note mt-2">{L.noKoin}</p>
        )}
      </section>
    </div>
  );
}
