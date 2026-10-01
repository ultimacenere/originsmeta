"use client";

import { useEffect } from "react";

/** Ancore che fino al 01/10/2026 stavano in /account e da allora stanno in /account/profile. */
const MOVED = new Set(["#profile", "#avatar", "#showcase", "#showcase-stats"]);

/**
 * I vecchi link /account#avatar, #showcase… (README, messaggi già mandati ai creator, segnalibri) portano alla nuova
 * pagina "Modifica la mia pagina pubblica": l'ancora non arriva al server, quindi il rimando lo fa il browser.
 */
export function AccountHashRedirect({ target }: { target: string }) {
  useEffect(() => {
    if (MOVED.has(window.location.hash)) window.location.replace(`${target}${window.location.hash}`);
  }, [target]);
  return null;
}
