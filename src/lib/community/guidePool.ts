import { cards } from "@/lib/data/cards";

/**
 * Le carte che si possono collegare a una guida della community (pacchetto GUIDE, 27/09/2026): le attive, comprese le
 * carte create (le guide le citano), senza le rimosse; Leggendarie per prime, poi in ordine di nome. Solo nome, slug e
 * Leggendaria: il modulo nel browser non riceve il database carte.
 */
export function guidePool(): { slug: string; name: string; legendary: boolean }[] {
  return cards
    .filter((c) => c.status === "active")
    .map((c) => ({ slug: c.slug, name: c.name, legendary: Boolean(c.legendary) }))
    .sort((a, b) => Number(b.legendary) - Number(a.legendary) || a.name.localeCompare(b.name));
}
