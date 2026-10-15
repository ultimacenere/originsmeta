"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/** La sessione del sito letta nel browser (la pagina /tracker resta statica): false finché non si sa. */
function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth
      .getSession()
      .then(({ data: { session } }) => alive && setSignedIn(Boolean(session?.user)))
      .catch(() => undefined);
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (alive) setSignedIn(Boolean(session?.user));
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  return signedIn;
}

/**
 * Il tasto del download di OriginsMeta Tracker (12/10/2026, Pierluigi: "solo i registrati al sito possono scaricare
 * l'app"). Porta sempre alla rotta /api/tracker/download, che decide: zip con l'accesso fatto, pagina di accesso senza.
 * La pagina /tracker resta statica: l'HTML ha il testo per chi non ha fatto l'accesso ("Accedi per scaricarla"), e qui
 * nel browser, letta la sessione, il tasto diventa "Scarica OriginsMeta Tracker" con l'evento `analytics_download`
 * (che conta solo i download veri, non i giri verso l'accesso).
 *
 * Dal 15/10/2026 (Pierluigi: "chi scarica deve arrivare fino all'app collegata"), con `next`: dopo il clic di chi ha
 * fatto l'accesso compare la riga "Download partito… passo 3" e la pagina scorre al passo dell'estrazione. Si scorre
 * e basta, senza cambiare l'indirizzo: un cambio di pagina potrebbe interrompere il download appena partito.
 */
export function TrackerDownloadButton({
  href,
  label,
  signInLabel,
  placement,
  next,
}: {
  href: string;
  label: string;
  signInLabel: string;
  placement: "top" | "install";
  /** il passo dopo il download: id dell'elemento a cui scorrere e la riga da mostrare */
  next?: { id: string; label: string };
}) {
  const signedIn = useSignedIn();
  const [started, setStarted] = useState(false);
  const nextId = next?.id;
  useEffect(() => {
    if (!started || !nextId) return;
    const t = window.setTimeout(() => document.getElementById(nextId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 1200);
    return () => window.clearTimeout(t);
  }, [started, nextId]);
  return (
    <span className="inline-flex flex-col items-start gap-2">
      <a
        href={href}
        className="btn btn-primary"
        rel="nofollow"
        data-om-event={signedIn ? "analytics_download" : undefined}
        data-om-placement={placement}
        onClick={() => {
          if (signedIn) setStarted(true);
        }}
      >
        {signedIn ? `${label} ↓` : `${signInLabel} →`}
      </a>
      {started && next ? (
        <a href={`#${next.id}`} className="link-mint text-sm font-bold" role="status">
          {next.label}
        </a>
      ) : null}
    </span>
  );
}

/**
 * Il passo 1 della guida (15/10/2026): a chi non ha fatto l'accesso il tasto verso la pagina di accesso (che poi torna
 * alla guida), a chi l'ha fatto una riga che lo manda al passo 2.
 */
export function TrackerSignInStep({ loginHref, signInLabel, signedInLabel }: { loginHref: string; signInLabel: string; signedInLabel: string }) {
  const signedIn = useSignedIn();
  if (signedIn)
    return (
      <p className="font-bold text-mint" role="status">
        ✓ {signedInLabel}
      </p>
    );
  return (
    <a href={loginHref} className="btn btn-ghost" rel="nofollow">
      {signInLabel} →
    </a>
  );
}
