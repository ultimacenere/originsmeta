"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CopyButton } from "./CopyButton";
import { DiscordButton } from "./DiscordButton";

export type NewDeckLabels = { title: string; text: string; copyLink: string; copied: string; discord: string; close: string };

/**
 * Ricompensa dopo la pubblicazione (UX-10). publishDeck porta alla scheda con `?new=1`: se chi guarda è il
 * proprietario, in cima compare il pannello "il tuo mazzo è online" con il link da copiare e il tasto Discord,
 * perché è lì che arrivano i primi voti. La scheda è ISR: la query la legge il browser (leggerla sul server
 * renderebbe la pagina dinamica) e subito dopo la toglie dall'indirizzo, così né un ricaricamento né un link
 * copiato dalla barra riaprono il pannello.
 */
export function NewDeckBanner({ ownerId, url, discordHref, labels }: { ownerId: string; url: string; discordHref: string; labels: NewDeckLabels }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // letto nell'effetto perché nel render di una navigazione lato client (router.push da PublishDeckForm)
    // l'indirizzo è ancora quello vecchio. Nel doppio giro dello Strict Mode il primo consuma ?new=1 e il
    // secondo non lo trova più: per questo niente flag di annullamento sulla promessa.
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") !== "1") return;
    params.delete("new");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
    supabaseBrowser()
      ?.auth.getSession()
      .then(({ data }) => {
        if (data.session?.user.id === ownerId) setShow(true);
      });
  }, [ownerId]);

  if (!show) return null;
  return (
    <section className="card-night relative mt-6 p-5 pr-12 sm:p-6 sm:pr-14" role="status" aria-live="polite">
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label={labels.close}
        title={labels.close}
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-lg leading-none text-pale-muted hover:bg-night-3 hover:text-pale"
      >
        ×
      </button>
      <p className="t-item">{labels.title}</p>
      <p className="mt-1 max-w-2xl text-pale">{labels.text}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <CopyButton text={url} label={labels.copyLink} copied={labels.copied} className="btn btn-primary text-xs" />
        <DiscordButton href={discordHref} size="sm">
          {labels.discord}
        </DiscordButton>
      </div>
    </section>
  );
}
