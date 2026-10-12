/**
 * Solo per gli iscritti a OriginsMeta (0.4.0, 12/10/2026; docs/tracker.md, "Solo con l'account").
 *
 * Pierluigi: "ben inteso che solo i registrati al sito possono scaricare l'app e possono usarla, se non sono registrati
 * con il cazzo possono usarla!!". Senza un collegamento valido all'account l'app non fa niente: non legge i file del
 * gioco, non riprende lo schermo, non apre overlay, pannelli né la sorgente per OBS e non registra partite; mostra solo
 * la schermata di collegamento e il tasto per uscire.
 *
 * Il collegamento vale se il sito ha riconosciuto il token di recente: all'avvio e ogni `checkEveryMs` l'app lo
 * verifica (POST /api/tracker/sync con zero partite, `verifyToken` di sync.ts; vale anche ogni invio riuscito).
 * - token rifiutato (401: PC scollegato da /account/tracker, account eliminato) = l'app dimentica il token e si blocca;
 * - sito irraggiungibile o in errore = l'app continua per `graceMs` dall'ultima verifica riuscita (salvata cifrata con
 *   il collegamento, account.ts), poi si blocca finché non riesce a verificare (riprova ogni `retryLockedMs`). Così
 *   un'interruzione del sito non rompe le partite di nessuno.
 *
 * Funzioni pure: l'orologio e lo stato arrivano da fuori, i test girano senza Electron (access.test.ts).
 */

export const ACCESS = {
  /** Quanto l'app continua senza riuscire a verificare il token (sito giù, niente rete): 7 giorni. */
  graceMs: 7 * 24 * 3_600_000,
  /** Ogni quanto si ricontrolla il token con il sito, ad app sbloccata: 4 ore. */
  checkEveryMs: 4 * 3_600_000,
  /** Ad app bloccata perché la verifica non riesce, ogni quanto si riprova: 5 minuti. */
  retryLockedMs: 5 * 60_000,
  /** Una verifica "nel futuro" oltre questo margine (orologio spostato, file ritoccato) non vale. */
  skewMs: 10 * 60_000,
} as const;

/**
 * Perché l'app è bloccata:
 * - `never`: mai collegata (o scollegata da questo PC);
 * - `unlinked`: il sito ha rifiutato il token (scollegata da /account/tracker o account eliminato);
 * - `relink`: il collegamento salvato non si legge più su questo PC;
 * - `verify`: collegata ma mai verificata (collegamenti della 0.3.x) o con una verifica che non vale: aspetta il sito;
 * - `expired`: più di `graceMs` senza una verifica riuscita.
 */
export type LockReason = "never" | "unlinked" | "relink" | "verify" | "expired";

export type Access = { open: true; verifiedAt: string; graceUntil: string } | { open: false; reason: LockReason };

export type AccessInput = {
  linked: boolean;
  /** c'è un collegamento salvato che non si decifra (account.ts, `unreadable`) */
  unreadable: boolean;
  /** avviso già deciso dal processo principale ("unlinked" dopo un 401) */
  notice: "unlinked" | "relink" | null;
  /** ultima verifica riuscita del token, ISO */
  verifiedAt: string | null;
  now: number;
  graceMs?: number;
};

/** L'app è sbloccata solo con un collegamento verificato dal sito da meno di `graceMs`. */
export function decideAccess(i: AccessInput): Access {
  if (!i.linked) return { open: false, reason: i.unreadable || i.notice === "relink" ? "relink" : i.notice === "unlinked" ? "unlinked" : "never" };
  const at = i.verifiedAt ? Date.parse(i.verifiedAt) : NaN;
  if (!Number.isFinite(at) || at > i.now + ACCESS.skewMs) return { open: false, reason: "verify" };
  const grace = i.graceMs ?? ACCESS.graceMs;
  if (i.now - at > grace) return { open: false, reason: "expired" };
  return { open: true, verifiedAt: new Date(at).toISOString(), graceUntil: new Date(at + grace).toISOString() };
}

/** Esito di una verifica del token con il sito. */
export type VerifyOutcome = "ok" | "revoked" | "unreachable";

/**
 * La risposta del sito a una verifica (o a un invio) → esito. `reached: false` = nessuna risposta (rete assente, tempo
 * scaduto). 200 e 429 (tetto giornaliero delle partite, controllato dopo il token) = token valido; 401 = token
 * rifiutato; tutto il resto (503 prima della migrazione, 5xx, risposte inattese) = sito non utilizzabile adesso, cioè
 * tolleranza: un guasto del sito non deve bloccare nessuno.
 */
export function verifyOutcome(reached: boolean, status: number): VerifyOutcome {
  if (!reached) return "unreachable";
  if (status === 200 || status === 429) return "ok";
  if (status === 401) return "revoked";
  return "unreachable";
}

/**
 * Se è ora di verificare il token: subito la prima volta (e se l'orologio è tornato indietro), poi ogni `checkEveryMs`
 * con l'app sbloccata e l'ultima verifica riuscita, altrimenti ogni `retryLockedMs` (bloccata, o sito irraggiungibile
 * all'ultimo tentativo).
 */
export function checkDue(i: { linked: boolean; open: boolean; lastAttemptAt: number | null; lastFailed: boolean; now: number }): boolean {
  if (!i.linked) return false;
  if (i.lastAttemptAt === null || i.now < i.lastAttemptAt) return true;
  return i.now - i.lastAttemptAt >= (i.open && !i.lastFailed ? ACCESS.checkEveryMs : ACCESS.retryLockedMs);
}
