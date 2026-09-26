import type { Metadata } from "next";
import { cleanDescription, pageTitle } from "@/lib/page";

/**
 * Metadati delle pagine private della casella messaggi (conversazione, area staff): titolo con `pageTitle` come ogni
 * pagina del sito, ma niente canonical né hreflang (sono pagine personali, dietro l'accesso) e noindex, nofollow come
 * /account. Il titolo resta generico: l'oggetto di una conversazione non finisce nella cronologia del browser.
 */
export function privateInboxMeta(title: string, description: string): Metadata {
  return {
    title: { absolute: pageTitle(title) },
    description: cleanDescription(description),
    robots: { index: false, follow: false },
  };
}
