import Link from "@/components/IntentLink";
import type { LocaleParams } from "@/lib/page";
import { protoLocale, protoMeta } from "@/components/proto/ProtoBar";
import { readProtoAll } from "@/lib/proto/analyticsProto";

/*
  Indice dei tre prototipi del rework di Analytics (26/11/2026, Pierluigi: "Sì, 3 prototipi"). Solo in italiano, noindex,
  per l'anteprima Vercel del branch: nessun link dal sito.
*/

export const revalidate = 300;

export function generateMetadata() {
  return protoMeta("/proto/analytics", "Analytics: tre prototipi", "Tre prototipi per il nuovo Analytics di OriginsMeta, con i dati veri del Tracker.");
}

const PROTOS = [
  {
    href: "/it/proto/analytics/tavolo",
    letter: "A",
    name: "Il tavolo",
    idea: "Scegli la tua Leggendaria e quella che hai davanti: lo scontro si legge sul tavolo del gioco, con le carte vere e le torri.",
  },
  {
    href: "/it/proto/analytics/mazzo",
    letter: "B",
    name: "Il tuo mazzo",
    idea: "Incolla il codice del tuo mazzo: i numeri ti dicono carta per carta che cosa rende, cosa cambiare e contro chi giocarlo.",
  },
  {
    href: "/it/proto/analytics/patch",
    letter: "C",
    name: "Le patch alla prova",
    idea: "Ogni modifica di Koin con il prima e il dopo: chi è salito, chi è sceso e se il nerf ha funzionato, patch dopo patch.",
  },
] as const;

export default async function ProtoIndex({ params }: { params: LocaleParams }) {
  await protoLocale(params);
  const patches = await readProtoAll();
  const last = patches.at(-1);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="t-page text-sky">Analytics: tre prototipi</h1>
      <p className="mt-3 max-w-2xl text-pale">
        Tre strade diverse per lo stesso Analytics. Sono pagine vere del sito con i numeri veri del Tracker
        {last ? ` (${last.games.toLocaleString("it-IT")} partite nella patch ${last.label})` : ""}. Si provano anche dal telefono.
      </p>
      <ul className="mt-8 grid grid-cols-1 gap-4">
        {PROTOS.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="card-night group flex items-start gap-4 p-5 transition hover:border-mint">
              <span className="pen-num shrink-0 text-4xl leading-none text-gold">{p.letter}</span>
              <span>
                <span className="t-item block text-sky group-hover:text-mint">{p.name}</span>
                <span className="mt-1 block text-pale">{p.idea}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-pale-muted">Prototipi solo in italiano e non indicizzati: la versione scelta si scrive poi in tutte e otto le lingue.</p>
    </div>
  );
}
