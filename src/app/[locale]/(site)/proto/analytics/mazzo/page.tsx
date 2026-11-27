import type { LocaleParams } from "@/lib/page";
import { ProtoBar, protoLocale, protoMeta } from "@/components/proto/ProtoBar";
import { gameInput, readProtoPatch, type ProtoPatch, type ProtoPatchStats } from "@/lib/proto/analyticsProto";
import { activeCards } from "@/lib/data/cards";
import type { MCard, MPatch } from "@/lib/proto/mazzo";
import { MazzoLab } from "@/components/proto/mazzo/MazzoLab";

/*
  Prototipo B del rework di Analytics, «Il tuo mazzo» (26/11/2026, Pierluigi: "Sì, 3 prototipi"). Si parte dal mazzo di
  chi guarda (codice del gioco o una delle liste più giocate) e i numeri del Tracker lo correggono carta per carta, con
  le note a penna del sito. Solo in italiano, noindex, per l'anteprima del branch.
*/

export const revalidate = 300;

export function generateMetadata() {
  return protoMeta("/proto/analytics/mazzo", "Il tuo mazzo · prototipo", "Incolla il codice del tuo mazzo: i numeri del Tracker lo correggono carta per carta.");
}

const PATCHES: ProtoPatch[] = ["ea-1123", "ea-1117"];

function slim(p: ProtoPatchStats): MPatch {
  return {
    patch: p.patch,
    label: p.label,
    games: p.games,
    lists: p.lists.map(({ legendary, cards, games, wins, r, lo, hi }) => ({ legendary, cards, games, wins, r, lo, hi })),
    matchups: p.matchups.map(({ a, b, games, wins, r, lo, hi }) => ({ a, b, games, wins, r, lo, hi })),
    legendaries: p.legendaries.map(({ slug, share, games, wins, r, lo, hi }) => ({ slug, share, games, wins, r, lo, hi })),
    cards: p.cards.map(({ slug, avgTurn }) => ({ slug, avgTurn })),
  };
}

export default async function MazzoProto({ params }: { params: LocaleParams }) {
  await protoLocale(params);
  const read = await Promise.all(PATCHES.map((p) => readProtoPatch(p)));
  const patches = read.filter((p): p is ProtoPatchStats => !!p).map(slim);
  const cards: MCard[] = activeCards
    .filter((c) => c.key)
    .map((c) => ({ slug: c.slug, key: c.key ?? null, name: c.name, mana: c.mana ?? null, legendary: !!c.legendary, input: gameInput(c) }));
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ProtoBar
        name="B · Il tuo mazzo"
        real="le liste esatte di 13 carte registrate dal Tracker nelle patch EA · 23 nov e EA · 17 nov, gli scontri contati a due lati e il round medio delle carte giocate."
        provisional="i consigli «togli e metti» sono confronti fra liste vere, non una previsione: con poche partite cambiano in fretta."
      />
      <h1 className="t-page text-sky">Il tuo mazzo</h1>
      <p className="mt-2 max-w-2xl text-pale">Incolla il codice del gioco o parti da una lista giocata: i numeri del Tracker lo correggono carta per carta.</p>
      {patches.length ? <MazzoLab patches={patches} cards={cards} /> : <p className="mt-8 text-pale">I numeri del Tracker in questo momento non rispondono: riprova fra qualche minuto.</p>}
    </div>
  );
}
