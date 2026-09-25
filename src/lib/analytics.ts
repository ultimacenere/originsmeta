/**
 * Eventi di Google Analytics 4 (richiesta di Pierluigi del 25/09/2026): servono a seguire dalla dashboard
 * le azioni che contano, senza doverle contare a mano sul database.
 *
 * Quattro eventi, tutti inviati dal browser al momento del successo dell'azione:
 * - `sign_up` (evento raccomandato da GA4): nuova iscrizione al sito, parametro `method` = discord | email;
 * - `deck_created`: un mazzo salvato nel profilo dal deck builder ("Salva privato"), quindi creato ma non pubblico;
 * - `deck_published`: un mazzo pubblicato nel database mazzi, con archetipo e tipi dichiarati;
 * - `tierlist_created`: una tier list salvata nel profilo, parametro `kind` = cards | legendaries.
 *
 * `window.gtag` esiste solo dopo "Accetta tutto" nel banner cookie (vedi `components/GoogleAnalytics.tsx`):
 * senza consenso queste funzioni non fanno nulla, come deve essere. In GA4 gli eventi compaiono in
 * Report → Coinvolgimento → Eventi entro 24 ore (in "Tempo reale" subito) e lì si possono marcare come
 * "eventi chiave" per averli nei rapporti principali.
 */

export type EventoSito = "sign_up" | "deck_created" | "deck_published" | "tierlist_created";

type Parametri = Record<string, string | number | boolean>;

/** Manda un evento a GA4, se il visitatore ha accettato i cookie statistici. Non lancia mai eccezioni. */
export function traccia(evento: EventoSito, parametri: Parametri = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", evento, parametri);
  } catch {
    /* un errore di analytics non deve mai rompere l'azione dell'utente */
  }
}

/**
 * Come `traccia`, ma aspetta che gtag sia caricato: gli script di GA4 partono "afterInteractive" e un evento
 * inviato subito dopo il ritorno dall'accesso arriverebbe troppo presto. Riprova per pochi secondi, poi lascia perdere.
 */
export function tracciaQuandoPronto(evento: EventoSito, parametri: Parametri = {}, tentativi = 20): void {
  if (typeof window === "undefined") return;
  if (window.gtag) {
    traccia(evento, parametri);
    return;
  }
  if (tentativi <= 0) return;
  window.setTimeout(() => tracciaQuandoPronto(evento, parametri, tentativi - 1), 250);
}
