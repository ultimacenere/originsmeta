"use client";

import { useParams } from "next/navigation";

/*
  Scheletro di caricamento delle pagine dell'account (17/10/2026, Pierluigi: "per accedere alla pagina profilo c'è un
  fastidioso delay e non c'è neanche una schermata di caricamento"). Lo mostra il `loading.tsx` di /account e delle sue
  sottopagine, mentre il server legge sessione e database: Next lo scarica in anticipo con il link, quindi al clic
  compare subito. Non va sulle pagine ISR (/u/<nome>: vedi lì perché). Client component solo per la lingua del testo per
  i lettori di schermo (loading.tsx non riceve i parametri). Blocchi blu notte, niente bianco; con "riduci animazioni"
  fermi (`motion-safe:`).
*/

const loadingText: Record<string, string> = {
  en: "Loading…",
  it: "Caricamento…",
  es: "Cargando…",
  fr: "Chargement…",
};

function Bar({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block rounded-md bg-night-3 motion-safe:animate-pulse ${className}`} />;
}

/** Griglia di schede vuote, come i mazzi e le tier list delle due pagine. */
function CardGrid({ count }: { count: number }) {
  return (
    <ul aria-hidden="true" className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="card-night flex gap-4 p-5">
          <Bar className="h-[110px] w-[78px] shrink-0" />
          <div className="min-w-0 flex-1 space-y-3">
            <Bar className="h-5 w-3/4" />
            <Bar className="h-4 w-1/3" />
            <Bar className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PageSkeleton() {
  const { locale } = useParams<{ locale?: string }>();
  const text = loadingText[locale ?? "en"] ?? loadingText.en;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6" role="status" aria-busy="true">
      <span className="sr-only">{text}</span>
      <Bar className="h-3 w-24" />
      <Bar className="mt-3 h-7 w-56" />
      <Bar className="mt-5 h-4 w-full max-w-xl" />
      <section aria-hidden="true" className="card-night mt-8 flex flex-wrap items-center gap-4 p-6">
        <span className="block size-16 shrink-0 rounded-full bg-night-3 motion-safe:animate-pulse" />
        <div className="min-w-0 flex-1 basis-56 space-y-3">
          <Bar className="h-6 w-48" />
          <Bar className="h-3 w-40" />
        </div>
        <div className="flex flex-col gap-2">
          <Bar className="h-8 w-36" />
          <Bar className="h-8 w-36" />
        </div>
      </section>
      <div className="mt-10">
        <Bar className="h-6 w-40" />
        <CardGrid count={4} />
      </div>
    </div>
  );
}
