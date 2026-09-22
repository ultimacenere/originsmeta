"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Nasconde un blocco del layout sulle pagine il cui percorso finisce con `suffix` (per esempio l'invito
 * "Pubblica il tuo mazzo" del footer sul deck builder, dove porterebbe alla pagina stessa). Il footer resta
 * un server component: qui passa solo il contenuto già pronto.
 */
export function HideOnPath({ suffix, children }: { suffix: string; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.endsWith(suffix)) return null;
  return <>{children}</>;
}
