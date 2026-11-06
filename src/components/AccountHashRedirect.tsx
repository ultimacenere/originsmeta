"use client";

import { useEffect } from "react";

/**
 * Ancore che sono andate in un'altra pagina dell'account: i vecchi link (README, messaggi già mandati ai creator, guide,
 * segnalibri) devono continuare a portare al posto giusto. L'ancora non arriva al server, quindi il rimando lo fa il
 * browser. Dal 01/10/2026 /account#avatar, #showcase… portano a "Modifica la mia pagina pubblica"; dal 06/11/2026
 * /account#stream-tools e #tracker, e /account/tracker#twitch, alle pagine Tracker e Twitch.
 */
export function AccountHashRedirect({ moved }: { moved: Record<string, string> }) {
  useEffect(() => {
    const target = moved[window.location.hash];
    if (target) window.location.replace(target);
  }, [moved]);
  return null;
}
