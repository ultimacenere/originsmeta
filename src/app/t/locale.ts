import type { Locale } from "@/lib/i18n";

/**
 * Lingua dei link brevi dei tornei (/t/<tag> e /t/<tag>/<codice>), che non hanno la lingua nel percorso (RIV-10,
 * TECH-11: Ondata 1 del 25/09/2026). Prima guardavano solo se la prima lingua del browser era l'italiano, quindi
 * chi legge lo spagnolo finiva sempre in inglese.
 *
 * Qui si scorre tutto l'header Accept-Language in ordine di preferenza (il peso `q`, a parità l'ordine scritto) e
 * vince la prima lingua del sito; catalano, galiziano e basco valgono spagnolo, come nel redirect della radice in
 * next.config.ts (che però guarda solo la prima lingua: lì c'è soltanto un'espressione regolare sull'header).
 * Nessuna lingua del sito nell'elenco: `fallback` (l'inglese).
 * Funzione pura, con le lingue passate da fuori: si prova con `node --test src/app/t/locale.test.ts` senza caricare
 * i dizionari.
 */

/** Lingue che non sono del sito ma che chi le usa legge in una del sito. */
export const LANGUAGE_ALIASES: Readonly<Record<string, Locale>> = { ca: "es", gl: "es", eu: "es" };

export function preferredLocale<L extends string>(header: string | null | undefined, supported: readonly L[], fallback: L, aliases: Readonly<Record<string, L>> = {}): L {
  const ranked = (header ?? "")
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { base: tag.trim().split("-")[0] ?? "", weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((x) => x.base && x.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { base } of ranked) {
    if ((supported as readonly string[]).includes(base)) return base as L;
    const alias = aliases[base];
    if (alias) return alias;
  }
  return fallback;
}
