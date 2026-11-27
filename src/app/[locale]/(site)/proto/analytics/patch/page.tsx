import type { LocaleParams } from "@/lib/page";
import { ProtoBar, protoLocale, protoMeta } from "@/components/proto/ProtoBar";
import { PatchProof } from "@/components/proto/patch/PatchProof";
import { readPatchProof } from "@/lib/proto/patch";

/*
  Prototipo C del rework di Analytics, «Le patch alla prova» (26/11/2026): le modifiche di Koin (MetaShifting) con i
  numeri del Tracker della patch prima e di quella dopo. Solo in italiano, noindex, per l'anteprima del branch.
*/

export const revalidate = 300;

export function generateMetadata() {
  return protoMeta(
    "/proto/analytics/patch",
    "Le patch alla prova",
    "Ogni modifica di Koin a Origins TCG con il prima e il dopo dal Tracker: chi è salito, chi è sceso e se il nerf ha funzionato.",
  );
}

export default async function PatchProofPage({ params }: { params: LocaleParams }) {
  await protoLocale(params);
  const data = await readPatchProof();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ProtoBar
        name="C · Le patch alla prova"
        real="win rate e partite del Tracker nelle quattro patch (dalla 0.7 al 23 novembre), modifiche dalle patch notes ufficiali."
        provisional="le carte mostrano le statistiche subito dopo la modifica, ma il testo è quello di oggi; la patch del 23/11 ha pochi giorni di partite."
      />
      <h1 className="t-page text-sky">Le patch alla prova</h1>
      <p className="mt-2 max-w-2xl text-pale">Che cosa ha cambiato Koin, e che cosa è successo davvero nelle partite dopo.</p>
      <div className="mt-6">
        {data ? <PatchProof data={data} /> : <p className="text-pale-muted">Le statistiche del Tracker non rispondono: riprova fra qualche minuto.</p>}
      </div>
    </div>
  );
}
