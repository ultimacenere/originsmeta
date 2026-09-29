import type Anthropic from "@anthropic-ai/sdk";
import type { Locale } from "../i18n";
import { STRATEGY_GUIDE_TRANSLATION_SYSTEM, TRANSLATION_MODEL, translateDocWith } from "./deckTranslation";
import {
  assembleGuideTranslation,
  communityGuideHash,
  planGuideTranslation,
  translationMaxTokens,
  type CommunityGuideTranslation,
  type CommunityGuideTranslations,
  type GuideSectionText,
} from "./guides";

/**
 * Traduzione di una guida della community a pezzi (pacchetto GUIDE, 27/09/2026, dopo i rilievi sulla lunghezza): una
 * guida arriva a circa 49 mila caratteri, quattro volte una guida di mazzo, e in una richiesta sola la risposta
 * supererebbe il tempo della funzione e il tetto dei token. Per ogni lingua:
 *
 * - le parti già tradotte e rimaste uguali (impronte `parts` della traduzione salvata, anche vecchia) si riusano: una
 *   correzione in una sezione ritraduce solo quella sezione, non tutta la guida;
 * - le parti da tradurre vanno in gruppi di al massimo 8000 caratteri (`planGuideTranslation`), una richiesta per
 *   gruppo con `max_tokens` calcolato dalla lunghezza (`translationMaxTokens`); i gruppi di tutte le lingue partono
 *   insieme, al massimo `TRANSLATION_CONCURRENCY` alla volta;
 * - i pezzi si riuniscono, si puliscono e si ricontrollano con le regole del testo semplice (`assembleGuideTranslation`):
 *   se un gruppo non riesce la lingua resta senza traduzione (meglio l'originale con la nota che una traduzione a metà),
 *   e al tentativo successivo si riusano comunque le parti già salvate.
 *
 * Puro a runtime (solo `deckTranslation.ts` e `guides.ts`, a loro volta puri; il client dell'API arriva da fuori): lo
 * usano il sito (`guideTranslate.ts`, dentro `after()`), lo script `scripts/translate-guides.mjs` (arretrati e nuovi
 * tentativi) e i test (guides.test.ts, con un client finto).
 */

export type GuideSource = { lang: Locale; title: string; summary: string; sections: GuideSectionText[]; translations?: CommunityGuideTranslations | null };

/** Richieste all'API in corso insieme, per una guida (tutte le lingue). */
export const TRANSLATION_CONCURRENCY = 4;
/** Tempo massimo di una richiesta (un gruppo di 8000 caratteri si traduce in meno di un minuto). */
export const CHUNK_TIMEOUT_MS = 120_000;

/** Esegue `jobs` con al massimo `limit` in corso insieme; i risultati nello stesso ordine. */
export async function runLimited<T>(jobs: readonly (() => Promise<T>)[], limit: number): Promise<T[]> {
  const out = new Array<T>(jobs.length);
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const i = next++;
      out[i] = await jobs[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, jobs.length)) }, worker));
  return out;
}

/**
 * Traduce la guida `g` nelle lingue `targets` e restituisce le traduzioni riuscite, pronte da salvare in
 * `translations` (impronta del testo, data, modello, impronte delle parti, testo). `names`: nomi di carte e luoghi
 * trovati nel testo, che restano in inglese. Nessuna eccezione: un errore di rete o dell'API fa saltare la lingua
 * (`onError` lo riceve per i log).
 */
export async function translateGuideText(
  client: Anthropic,
  g: GuideSource,
  targets: readonly Locale[],
  names: readonly string[],
  opts: { concurrency?: number; onError?: (to: Locale, e: unknown) => void; now?: () => string } = {},
): Promise<Partial<Record<Locale, CommunityGuideTranslation>>> {
  const hash = communityGuideHash(g);
  const plans = targets.filter((to) => to !== g.lang).map((to) => ({ to, plan: planGuideTranslation(g, g.translations?.[to]) }));
  // una lingua con un gruppo fallito non manda gli altri suoi gruppi: tanto non si salverebbe
  const failed = new Set<Locale>();
  const jobs = plans.flatMap(({ to, plan }) =>
    plan.chunks.map((doc) => async () => {
      if (failed.has(to)) return null;
      try {
        const r = await translateDocWith(client, doc, g.lang, to, names, STRATEGY_GUIDE_TRANSLATION_SYSTEM, { maxTokens: translationMaxTokens(doc), timeoutMs: CHUNK_TIMEOUT_MS });
        if (!r) failed.add(to);
        return r;
      } catch (e) {
        failed.add(to);
        opts.onError?.(to, e);
        return null;
      }
    }),
  );
  const results = await runLimited(jobs, opts.concurrency ?? TRANSLATION_CONCURRENCY);

  const out: Partial<Record<Locale, CommunityGuideTranslation>> = {};
  let at = 0;
  for (const { to, plan } of plans) {
    const mine = results.slice(at, at + plan.chunks.length);
    at += plan.chunks.length;
    if (failed.has(to)) continue;
    const text = assembleGuideTranslation(g, plan, mine.map((r) => r?.doc ?? null));
    if (!text) continue;
    const model = mine.find((r) => r?.model)?.model ?? g.translations?.[to]?.model ?? TRANSLATION_MODEL;
    // `title_hash` solo con il titolo tradotto: il database vuole le due chiavi insieme (blocco TITOLI TRADOTTI)
    out[to] = { hash, at: opts.now ? opts.now() : new Date().toISOString(), model, parts: plan.parts, ...(text.title !== undefined ? { title_hash: plan.titleHash } : {}), guide: text };
  }
  return out;
}
