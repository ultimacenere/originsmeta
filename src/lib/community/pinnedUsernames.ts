import { authors } from "../data/authorsCore";
import { HERO_STREAMS } from "../officialLive";

/**
 * Nomi utente scritti nel codice del sito (23/10/2026, cambio del nome dal profilo): chi li ha non li cambia da solo,
 * perché la funzione legata al nome smetterebbe di riconoscerlo. Sono le dirette della home (`HERO_STREAMS` di
 * officialLive.ts: il canale ufficiale sempre, i cast dei tornei finché non è finito il loro periodo) e gli autori della
 * redazione con un account (`username` di authorsCore.ts: la pagina /u porta alla pagina autore). Il modulo lo dice e
 * rimanda allo staff, che cambia il nome con scripts/set-username.mjs e aggiorna il codice nello stesso giorno.
 * Il nome mostrato resta libero.
 */
export function pinnedUsernames(now = Date.now()): Set<string> {
  const names = new Set<string>();
  for (const s of HERO_STREAMS) {
    const to = s.to ? Date.parse(s.to) : NaN;
    if (!s.to || !Number.isFinite(to) || to >= now) names.add(s.username);
  }
  for (const a of authors) if (a.username) names.add(a.username);
  return names;
}

export function usernamePinned(username: string | null | undefined, now = Date.now()): boolean {
  return Boolean(username) && pinnedUsernames(now).has(String(username));
}
