"use client";

import Link from "next/link";
import { useComicViewer } from "./useComicViewer";

/**
 * "Pubblica un fumetto" (pacchetto FUMETTI, 29/09/2026): il riquadro compare solo a chi può pubblicare fumetti (Creator,
 * Staff, admin), in /news e in /news/comics. Le pagine sono ISR: il ruolo lo legge il browser (`useComicViewer`), quindi
 * per tutti gli altri, e al primo disegno, non c'è nulla.
 */
export function ComicCtaBox({ labels, href }: { labels: { title: string; text: string; button: string }; href: string }) {
  const viewer = useComicViewer();
  if (!viewer?.canPublish) return null;
  return (
    <section className="card-night mt-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6" aria-live="polite">
      <div className="min-w-0 flex-1 basis-72">
        <h2 className="t-item">{labels.title}</h2>
        <p className="mt-1 text-pale-muted">{labels.text}</p>
      </div>
      <Link className="btn btn-primary shrink-0" href={href} prefetch={false}>
        {labels.button} →
      </Link>
    </section>
  );
}
