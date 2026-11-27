import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { ProtoBar } from "@/components/proto/ProtoBar";
import { SezNav } from "@/components/proto/sezioni/SezNav";
import { loadAll } from "@/lib/proto/sezioni";
import "@/components/proto/sezioni/sezioni.css";

/*
  Prototipo «Analytics a sezioni» (27/11/2026, Pierluigi: "Pagina di oggi, ma meglio", "sotto analytics diverse sezioni,
  in cui inseriamo le analisi"; poi "Sì, rifiniamo": telefono, grafica, contenuti). Con la grafica di /analytics di oggi
  (`.an-page`, fasce `.an-band` a tutta larghezza): testata, sottomenu delle sezioni e scelta della patch fermi in alto,
  poi le fasce di ogni sezione. Solo in italiano e noindex, per l'anteprima del branch.
*/

export default async function SezLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "it") notFound();
  const all = await loadAll();
  const patches = all.map((p) => ({ patch: p.patch, label: p.label, games: p.games }));
  return (
    <div className="an-page sez-page">
      <div className="an-wrap pt-8">
        <ProtoBar
          name="Analytics a sezioni"
          real="tutto quello che ha un numero viene dal Tracker (quattro patch, dalla 0.7 al 23 novembre), aggiornato ogni 5 minuti."
          provisional="«La partita» e «Luoghi» mostrano dove andranno i dati del Tracker 2.0: arrivano con la 0.9, senza numeri finché non ci sono."
        />
        <h1 className="t-page text-sky">Analytics</h1>
      </div>
      <Suspense fallback={<div className="sez-nav" />}>
        <SezNav patches={patches} />
      </Suspense>
      {children}
    </div>
  );
}
