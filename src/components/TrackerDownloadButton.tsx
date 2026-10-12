"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Il tasto del download di OriginsMeta Analytics (12/10/2026, Pierluigi: "solo i registrati al sito possono scaricare
 * l'app"). Porta sempre alla rotta /api/tracker/download, che decide: zip con l'accesso fatto, pagina di accesso senza.
 * La pagina /analytics resta statica: l'HTML ha il testo per chi non ha fatto l'accesso ("Accedi per scaricarla"), e qui
 * nel browser, letta la sessione, il tasto diventa "Scarica OriginsMeta Analytics" con l'evento `analytics_download`
 * (che conta solo i download veri, non i giri verso l'accesso).
 */
export function TrackerDownloadButton({
  href,
  label,
  signInLabel,
  placement,
}: {
  href: string;
  label: string;
  signInLabel: string;
  placement: "top" | "install";
}) {
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
  return (
    <a
      href={href}
      className="btn btn-primary"
      rel="nofollow"
      data-om-event={signedIn ? "analytics_download" : undefined}
      data-om-placement={placement}
    >
      {signedIn ? `${label} ↓` : `${signInLabel} →`}
    </a>
  );
}
