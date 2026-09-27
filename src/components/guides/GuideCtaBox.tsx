"use client";

import Link from "next/link";
import { useGuideViewer } from "./useGuideViewer";

type Box = { title: string; text: string; button: string; href: string };

/**
 * Il riquadro sotto l'intro di /guides (pacchetto GUIDE, 27/09/2026): per tutti "Mandaci la tua guida" (diretta Twitch del
 * 23/09/2026, il modulo va al canale dello staff); per chi ha un ruolo che pubblica le guide (Autore, Creator, Pro,
 * Staff, admin: `canPublishGuides`) diventa "Scrivi una guida" e porta a /guides/new. La pagina è statica (ISR): il ruolo
 * lo legge il browser (`useGuideViewer`), quindi il primo disegno è sempre quello per tutti.
 */
export function GuideCtaBox({ submit, write }: { submit: Box; write: Box }) {
  const viewer = useGuideViewer();
  const box = viewer?.canPublish ? write : submit;
  return (
    <section className="card-night mt-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6" aria-live="polite">
      <div className="min-w-0 flex-1 basis-72">
        <h2 className="t-item">{box.title}</h2>
        <p className="mt-1 text-pale-muted">{box.text}</p>
      </div>
      <Link className="btn btn-primary shrink-0" href={box.href} prefetch={false}>
        {box.button} →
      </Link>
    </section>
  );
}
