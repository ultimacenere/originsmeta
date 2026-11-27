import { protoMeta } from "@/components/proto/ProtoBar";
import { CarteExplorer, type CRow } from "@/components/proto/sezioni/carte/CarteExplorer";
import { gameInput, protoNum } from "@/lib/proto/analyticsProto";
import { cardOf, loadSez, moveOf } from "@/lib/proto/sezioni";

/*
  Prototipo «Analytics a sezioni», sezione Carte (27/11/2026). Le carte della patch scelta: in quante partite sono nel
  mazzo, come vanno nel mazzo e quando vengono giocate, quando si giocano (round medio) e come si sono mosse rispetto alla
  patch precedente. Dati del Tracker, lato di chi registra.
*/

const L = {
  title: "Carte",
  meta: "Carte: prototipo di Analytics",
  description: "Prototipo: le carte di Origins TCG nel Tracker, quanto si giocano, come vanno e in che round entrano in campo.",
  lead: "Quanto ogni carta è nei mazzi, come vanno i mazzi che la portano e in che round si gioca di solito.",
  notes: [
    "«Nei mazzi»: la quota delle partite registrate in cui la carta era nel mazzo di chi registra. «Nel mazzo» e «Giocata»: il win rate di quelle partite e di quelle in cui la carta è stata giocata davvero.",
    "Il round medio è quello delle partite in cui la carta è stata giocata. Le carte create da altre carte (Zombie, Broomstick…) non sono nei mazzi e qui non compaiono.",
    "I numeri sono dal lato di chi registra la partita: del mazzo avversario si vedono solo le carte che gioca.",
  ],
  empty: "I numeri del Tracker non rispondono: riprova fra qualche minuto.",
};

export const revalidate = 300;

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni/carte", L.meta, L.description);
}

export default async function CartePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sez = await loadSez(searchParams);
  if (!sez) return <p className="text-pale">{L.empty}</p>;
  const { cur, prev } = sez;
  const before = new Map((prev?.cards ?? []).map((c) => [c.slug, c]));

  const rows: CRow[] = cur.cards.flatMap((c) => {
    const card = cardOf(c.slug);
    if (!card || card.type === "token" || !c.deck) return [];
    const b = before.get(c.slug);
    return [
      {
        slug: c.slug,
        name: card.name,
        mana: card.mana ?? null,
        legendary: !!card.legendary,
        spell: card.type === "spell",
        input: gameInput(card),
        share: c.deckShare,
        deck: c.deck,
        played: c.played,
        turn: c.avgTurn,
        shareMove: b?.deck && prev ? moveOf(protoNum(b.deck.games, prev.games), protoNum(c.deck.games, cur.games)) : null,
        wrMove: moveOf(b?.deck, c.deck),
      },
    ];
  });

  return (
    <div>
      <section className="sez-section" aria-labelledby="ct-h">
        <h2 id="ct-h" className="sez-h2">
          {L.title}
        </h2>
        <p className="sez-lead">{L.lead}</p>
        <CarteExplorer rows={rows} prevLabel={prev?.label ?? null} />
      </section>
      <div className="mt-8 flex flex-col gap-1">
        {L.notes.map((n) => (
          <p key={n} className="sez-note">
            {n}
          </p>
        ))}
      </div>
    </div>
  );
}
