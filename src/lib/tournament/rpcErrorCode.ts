/**
 * Il codice d'errore di una RPC dei tornei (`raise exception 'codice'`) dal messaggio che arriva da Supabase.
 *
 * Vince il codice più lungo contenuto nel messaggio (27/11/2026). Prima vinceva il primo dell'elenco: `not_found` sta
 * prima di `user_not_found` e lo contiene, quindi "aggiungi arbitro" con un nome che il sito non conosce diceva
 * "Torneo non trovato" (segnalato da apix su OM-XU74, "adding judges doesnt work"); lo stesso per inviti e
 * `checkin_not_open`. Funzione pura: test in rpcErrorCode.test.ts, che prova ogni codice di actions.ts.
 */
export function rpcErrorCode(message: string, codes: readonly string[]): string | null {
  let best: string | null = null;
  for (const k of codes) if (message.includes(k) && (best === null || k.length > best.length)) best = k;
  return best;
}
