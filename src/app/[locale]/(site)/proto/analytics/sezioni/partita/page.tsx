import { protoMeta } from "@/components/proto/ProtoBar";
import { V2Intro, V2Slots, type Slot } from "@/components/proto/sezioni/V2Slots";

/* Sezione «La partita» del prototipo a sezioni (27/11/2026): i dati del Tracker 2.0 sul ritmo della partita. */

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni/partita", "Analytics: la partita (prototipo)", "Prototipo: torri, mana, round e mulligan delle partite di Origins TCG, dal Tracker 2.0.");
}

const SLOTS: Slot[] = [
  { title: "Curva della vittoria", text: "Chi è avanti di tanti punti di torre a un certo round, quanto spesso vince.", status: "certo", shape: "line" },
  { title: "Quanto dura una partita", text: "Round e minuti per Leggendaria, e quante partite finiscono con una resa: i mazzi più veloci e quelli più lenti.", status: "certo", shape: "bars" },
  { title: "Mana sul tavolo", text: "Quanto mana si usa round per round e quanto ne resta inutilizzato, per Leggendaria.", status: "certo", shape: "bars" },
  { title: "Mulligan e mano iniziale", text: "Le carte che conviene tenere e quelle da cambiare, con il win rate di chi le tiene. La mano completa dopo il mulligan va chiesta a Koin.", status: "koin", shape: "grid" },
  { title: "Primo o secondo", text: "Quanto conta aprire il round, in generale e per Leggendaria.", status: "koin", shape: "split" },
  { title: "Carte che muoiono e carte create", text: "Le carte che muoiono più spesso, quelle create in partita e i danni alle torri.", status: "certo", shape: "bars" },
];

export default function Partita() {
  return (
    <div>
      <V2Intro title="La partita" lead="Il ritmo delle partite: torri, mana, round e mulligan, contati su tutte le partite registrate." />
      <V2Slots slots={SLOTS} />
    </div>
  );
}
