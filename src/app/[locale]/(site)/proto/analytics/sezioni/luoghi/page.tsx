import Link from "next/link";
import { protoMeta } from "@/components/proto/ProtoBar";
import { V2Intro, V2Slots, type Slot } from "@/components/proto/sezioni/V2Slots";

/* Sezione «Luoghi» del prototipo a sezioni (27/11/2026): i luoghi in campo dal Tracker 2.0. Nessun sito lo fa. */

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni/luoghi", "Analytics: luoghi (prototipo)", "Prototipo: come i luoghi cambiano le partite di Origins TCG, dal Tracker 2.0.");
}

const SLOTS: Slot[] = [
  { title: "Le Leggendarie su ogni luogo", text: "Per ogni luogo, le Leggendarie che rendono sopra e sotto il loro solito win rate, contate da tutti e due i lati.", status: "certo", shape: "grid" },
  { title: "Luoghi che decidono", text: "Quanto spesso la corsia di un luogo decide la partita. Chi conquista il luogo si ricava dalle torri, se Koin conferma l'ordine delle corsie.", status: "koin", shape: "bars" },
  { title: "Quanto esce ogni luogo", text: "In quante partite compare ogni luogo e in quale corsia.", status: "certo", shape: "bars" },
  { title: "Carte e luoghi", text: "Le carte che rendono di più su un luogo preciso.", status: "certo", shape: "grid" },
];

export default function Luoghi() {
  return (
    <div>
      <V2Intro title="Luoghi" lead="Come i luoghi cambiano le partite. Nessun sito di statistiche lo fa ancora: sarebbe una cosa solo nostra." />
      <V2Slots slots={SLOTS} />
      <p className="sez-note mt-4">
        I 44 luoghi con i loro effetti sono già nella pagina{" "}
        <Link href="/it/locations" className="link-mint">
          Luoghi
        </Link>
        .
      </p>
    </div>
  );
}
