import Anthropic from "@anthropic-ai/sdk";
import { contestoPer, type Fonte } from "./retrieve";
import type { Locale } from "@/lib/i18n";

/**
 * Risposta a una domanda sulla base del NOSTRO database: le carte, le guide e gli eventi pertinenti
 * vengono raccolti da `retrieve.ts` e passati al modello, che può usare solo quelli. Se la risposta non è
 * nei dati, il modello deve dirlo: la regola del progetto è che nulla si inventa.
 *
 * La chiave sta in `ANTHROPIC_API_KEY` (dashboard Vercel, mai nel codice). Senza chiave la funzione non
 * fallisce: risponde `disabilitato`, e la pagina mostra solo le FAQ già approvate.
 */

const MODELLO = "claude-opus-5";

/** Il modello risponde a chi gioca, con i nostri dati e i nostri limiti. */
function istruzioni(locale: Locale): string {
  const lingua = ({ en: "inglese", it: "italiano", es: "spagnolo (neutro, con il tú)" } as Record<string, string>)[locale] ?? "inglese";
  return `Sei l'assistente di OriginsMeta, sito community non ufficiale su Origins TCG di Koin Games.
Rispondi in ${lingua}, a chi gioca, in modo diretto e concreto.

REGOLE, in ordine di importanza:
1. Usa SOLO i dati che trovi in "DATI". Non aggiungere carte, statistiche, date, prezzi o regole che non sono lì.
2. Se i dati non bastano a rispondere, dillo in una frase e indica dove guardare sul sito. Non tirare a indovinare:
   una risposta sbagliata su una statistica vale meno di un "non lo so".
3. Non inventare nomi di carte. Se una carta non è nei dati, non esiste per te.
4. Cita i nomi delle carte esattamente come sono scritti nei dati.
5. Le statistiche sono quelle della patch 0.6.3 del playtest: dillo se la domanda riguarda numeri.
6. Sei una fonte non ufficiale: per regolamenti, date e annunci rimanda alle fonti ufficiali di Koin.
7. Se la domanda non riguarda Origins TCG, rispondi che ti occupi solo di questo gioco. Non sei un assistente
   generico e non scrivi testi, codice o traduzioni su richiesta.
8. Da 3 a 8 righe. Niente elenco puntato se bastano due frasi. Niente formule di cortesia e niente premesse:
   parti dalla risposta.
9. Quando il giudizio è tuo e non un fatto del database ("conviene", "è forte"), dillo: chi legge deve capire
   che cosa è un dato e che cosa è una lettura nostra.`;
}

export type Risposta =
  | { ok: true; testo: string; fonti: Fonte[]; token: { in: number; out: number } }
  | { ok: false; motivo: "disabilitato" | "vuota" | "errore"; dettaglio?: string };

export function aiAttiva(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function rispondi(domanda: string, locale: Locale): Promise<Risposta> {
  if (!aiAttiva()) return { ok: false, motivo: "disabilitato" };

  const { testo: dati, fonti } = contestoPer(domanda, locale);
  const client = new Anthropic();

  try {
    const res = await client.messages.create({
      model: MODELLO,
      max_tokens: 700,
      // le istruzioni non cambiano mai: restano in cache e non si pagano a ogni domanda
      system: [{ type: "text", text: istruzioni(locale), cache_control: { type: "ephemeral" } }],
      // la risposta è breve e ancorata ai dati: non serve far ragionare a lungo il modello
      output_config: { effort: "low" },
      messages: [{ role: "user", content: `DATI:\n${dati}\n\nDOMANDA: ${domanda}` }],
    });

    if (res.stop_reason === "refusal") return { ok: false, motivo: "vuota" };
    const testo = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!testo) return { ok: false, motivo: "vuota" };

    // Si citano solo le fonti che la risposta nomina davvero.
    const citate = fonti.filter((f) => testo.toLowerCase().includes(f.nome.toLowerCase()));
    return {
      ok: true,
      testo,
      fonti: citate.length ? citate : fonti.slice(0, 3),
      token: { in: res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0), out: res.usage.output_tokens },
    };
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { ok: false, motivo: "errore", dettaglio: "rate-limit" };
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, motivo: "disabilitato" };
    if (e instanceof Anthropic.APIError) return { ok: false, motivo: "errore", dettaglio: `api-${e.status}` };
    return { ok: false, motivo: "errore" };
  }
}
