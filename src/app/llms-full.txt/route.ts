import { llmsFull } from "@/lib/llms";

/**
 * /llms-full.txt: il testo completo del sito per i modelli linguistici (Ondata 3 del piano SEO/GEO, 25/09/2026,
 * GEO-04): guide e news in inglese in Markdown pulito, più le carte della Demo 2.0 con il testo ufficiale. Il
 * contenuto lo scrive `src/lib/llms.ts`; l'indice breve resta public/llms.txt, che ci rimanda.
 *
 * Statico, generato alla build: guide, news e carte cambiano solo con un deploy (niente dati della community).
 * `noindex` nell'header: il file ripete parola per parola le pagine del sito, e nei risultati di ricerca devono
 * uscire quelle (con titolo, lingua e dati strutturati), non una copia in testo; i modelli che lo chiedono lo leggono
 * comunque, perché noindex non ne blocca la lettura. È testo semplice in UTF-8: il Markdown si legge anche così.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsFull(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-robots-tag": "noindex",
    },
  });
}
