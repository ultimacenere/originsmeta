import { protoMeta } from "@/components/proto/ProtoBar";
import { Band, SezHead } from "@/components/proto/sezioni/parts";
import { CarteExplorer, type CRow } from "@/components/proto/sezioni/carte/CarteExplorer";
import { gameInput, protoNum } from "@/lib/proto/analyticsProto";
import { cardOf, gamesText, loadSez, moveOf, pctText } from "@/lib/proto/sezioni";

/*
  Prototipo «Analytics a sezioni», sezione Carte (27/11/2026; rifinitura dello stesso giorno, Pierluigi: telefono,
  grafica, contenuti). Le carte della patch scelta: in quante partite sono nel mazzo, come vanno, in che round si giocano e
  come si sono mosse rispetto alla patch precedente. In cima le frasi da sapere; la vista di partenza è «Quando si gioca»,
  la tabella è la seconda. Dati del Tracker, lato di chi registra.
*/

const L = {
  title: "Carte",
  meta: "Carte: prototipo di Analytics",
  description: "Prototipo: le carte di Origins TCG nel Tracker, quanto si giocano, come vanno e in che round entrano in campo.",
  mostPlayed: (name: string, p: string, games: string) => (
    <>
      La carta più giocata è <b>{name}</b>: è nel mazzo nel <b>{p}</b> delle partite ({games}).
    </>
  ),
  bestWin: (name: string, p: string, games: string) => (
    <>
      Fra le carte molto giocate vince di più <b>{name}</b>: <b>{p}</b> su {games}.
    </>
  ),
  latest: (name: string, t: string) => (
    <>
      Si gioca più tardi <b>{name}</b>: in media al round <b>{t}</b>.
    </>
  ),
  notes: [
    "«Nei mazzi»: la quota delle partite registrate in cui la carta era nel mazzo di chi registra. «Nel mazzo» e «Giocata»: il win rate di quelle partite e di quelle in cui la carta è stata giocata davvero.",
    "Il round medio è quello delle partite in cui la carta è stata giocata. Le carte create da altre carte (Zombie, Broomstick…) non sono nei mazzi e qui non compaiono.",
    "I numeri sono dal lato di chi registra la partita: del mazzo avversario si vedono solo le carte che gioca.",
  ],
  empty: "I numeri del Tracker non rispondono: riprova fra qualche minuto.",
};

export const revalidate = 300;
/** «Molto giocata»: almeno il 10% delle partite e 100 partite. */
const MANY_SHARE = 0.1;
const MANY_GAMES = 100;

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni/carte", L.meta, L.description);
}

export default async function CartePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sez = await loadSez(searchParams);
  if (!sez)
    return (
      <Band tone="stage" top>
        <p className="text-pale">{L.empty}</p>
      </Band>
    );
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

  // le frasi da sapere (le Leggendarie restano fuori: sono in ogni mazzo della loro Leggendaria)
  const base = rows.filter((r) => !r.legendary);
  const brief = [];
  const most = [...base].sort((a, b) => b.share - a.share)[0];
  if (most) brief.push(L.mostPlayed(most.name, pctText(most.share), gamesText(most.deck.games)));
  const best = base.filter((r) => r.share >= MANY_SHARE && r.deck.games >= MANY_GAMES).sort((a, b) => b.deck.lo - a.deck.lo)[0];
  if (best && best.slug !== most?.slug) brief.push(L.bestWin(best.name, pctText(best.deck.r), gamesText(best.deck.games)));
  const late = base.filter((r) => r.turn !== null && (r.played?.games ?? 0) >= 50).sort((a, b) => (b.turn ?? 0) - (a.turn ?? 0))[0];
  if (late?.turn) brief.push(L.latest(late.name, late.turn.toLocaleString("it-IT", { maximumFractionDigits: 1 })));

  return (
    <>
      <Band tone="stage" top>
        <SezHead title={L.title} brief={brief} />
        <CarteExplorer rows={rows} prevLabel={prev?.label ?? null} />
      </Band>
      <Band tone="deep">
        <div className="flex flex-col gap-1">
          {L.notes.map((n) => (
            <p key={n} className="sez-note">
              {n}
            </p>
          ))}
        </div>
      </Band>
    </>
  );
}
