import type { LocaleParams } from "@/lib/page";
import { getCard } from "@/lib/data/cards";
import { ProtoBar, protoLocale, protoMeta } from "@/components/proto/ProtoBar";
import { cardsOfLegendary, gameInput, readProtoPatch, type ProtoPatch } from "@/lib/proto/analyticsProto";
import { Tavolo, type TavoloCard, type TavoloPatch } from "@/components/proto/tavolo/Tavolo";

/*
  Prototipo A del rework di Analytics (26/11/2026): «Il tavolo». Lo scontro fra due Leggendarie letto sul tavolo del
  gioco, con le carte del gioco (via libera di Koin alla grafica, 13/11/2026). Dati veri: scontri a due lati e carte
  delle liste esatte registrate dal Tracker nelle ultime due patch.
*/

export const revalidate = 300;

export function generateMetadata() {
  return protoMeta("/proto/analytics/tavolo", "Il tavolo: prototipo di Analytics", "Prototipo: lo scontro fra due Leggendarie di Origins TCG sul tavolo del gioco, con i dati veri del Tracker.");
}

const PATCHES: ProtoPatch[] = ["ea-1123", "ea-1117"];
const HAND = 8;

export default async function TavoloPage({ params }: { params: LocaleParams }) {
  await protoLocale(params);
  const read = await Promise.all(PATCHES.map((p) => readProtoPatch(p)));
  const cards: Record<string, TavoloCard> = {};
  const addCard = (slug: string) => {
    if (cards[slug]) return;
    const c = getCard(slug);
    if (c) cards[slug] = { slug, name: c.name, input: gameInput(c), art: c.art ?? c.thumb ?? null };
  };
  const data: TavoloPatch[] = [];
  for (const p of read) {
    if (!p) continue;
    const turn = new Map(p.cards.map((c) => [c.slug, c.avgTurn]));
    const hands: TavoloPatch["hands"] = {};
    for (const l of p.legendaries) {
      addCard(l.slug);
      const { games, cards: list } = cardsOfLegendary(p.lists, l.slug);
      const top = list.slice(0, HAND);
      for (const c of top) addCard(c.slug);
      hands[l.slug] = { games, cards: top.map((c) => ({ ...c, turn: turn.get(c.slug) ?? null })) };
    }
    data.push({ patch: p.patch, label: p.label, games: p.games, matchedGames: p.matchedGames, legendaries: p.legendaries, matchups: p.matchups, hands });
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ProtoBar
        name="A · Il tavolo"
        real="scontri contati a due lati e carte delle liste esatte registrate dal Tracker nelle patch del 23 e del 17 novembre, aggiornati ogni 5 minuti."
        provisional="torri, mana e luoghi round per round: arrivano con il Tracker V2 e la 0.9, qui c'è solo il posto."
      />
      {data.length ? <Tavolo data={data} cards={cards} /> : <p className="text-pale">I numeri del Tracker non rispondono: riprova fra qualche minuto.</p>}
    </div>
  );
}
