/**
 * "Segui" (pacchetto SEGUI, 27/09/2026): le regole in funzioni pure, senza import (`node --test
 * src/lib/community/follows.test.ts`). Pierluigi, 27/09/2026, alle proposte per i profili dei ruoli con vetrina: "OK A
 * TUTTO, OTTIMO!!", fra cui "Segui" con un avviso quando un creator pubblica un mazzo o va in diretta.
 *
 * - Si seguono solo i profili vetrina (Creator, Autore, Pro, Staff: `isShowcaseBadge` di badges.ts), mai se stessi, al
 *   massimo `FOLLOW_MAX` profili a testa. Lo decide il database (supabase/wave2-SEGUI.sql: policy e trigger
 *   `guard_follow`); il sito lo sa per mostrare il tasto solo dove serve.
 * - Ognuno vede solo chi segue lui: il numero dei follower di un profilo è pubblico solo come conteggio (RPC
 *   `follow_state`), letto nel browser, così /u e le schede dei mazzi restano ISR.
 * - Chi non ha fatto l'accesso va alla pagina di accesso e poi torna dov'era (`loginReturnHref`).
 */

/** Quanti profili si possono seguire al massimo (uguale nel trigger `guard_follow`). */
export const FOLLOW_MAX = 500;

/** Stato del tasto "Segui": follower del profilo, se chi guarda lo segue già, se il profilo si può seguire. */
export type FollowState = { followers: number; following: boolean; followable: boolean };

const count = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : typeof v === "string" && /^\d{1,9}$/.test(v) ? Number(v) : 0;

/** Lo stato dalla risposta della RPC `follow_state` (jsonb). Valori strani valgono zero o false; senza un oggetto, null. */
export function parseFollowState(json: unknown): FollowState | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  return { followers: count(o.followers), following: o.following === true, followable: o.followable === true };
}

/** Lo stato dopo un clic, prima che il database risponda (il numero non scende mai sotto zero). */
export function toggledState(state: FollowState, follow: boolean): FollowState {
  if (state.following === follow) return state;
  return { ...state, following: follow, followers: Math.max(0, state.followers + (follow ? 1 : -1)) };
}

/** Errori del tasto e dell'elenco "Chi segui", con un messaggio per ciascuno nelle etichette. */
export type FollowErrorCode = "notLoggedIn" | "notFollowable" | "self" | "tooMany" | "unavailable" | "db";

/** Gli errori che il database solleva con `raise exception '<codice>'` (trigger `guard_follow`). */
const RAISED: Record<string, FollowErrorCode> = {
  follow_self: "self",
  not_followable: "notFollowable",
  too_many_follows: "tooMany",
};

/**
 * Dall'errore di Supabase al codice del sito. Tabella o funzione mancante (migrazione non applicata: 42P01, 42883,
 * PGRST202, PGRST205) → `unavailable`; policy che rifiuta la riga (42501: un profilo che non si può seguire, scritto
 * via API) → `notFollowable`; vincolo "non se stessi" (23514) → `self`.
 */
export function followErrorCode(error: { message?: string | null; code?: string | null } | null | undefined): FollowErrorCode {
  if (!error) return "db";
  const code = error.code ?? "";
  if (["42P01", "42883", "42703", "PGRST200", "PGRST202", "PGRST205"].includes(code)) return "unavailable";
  const msg = (error.message ?? "").trim();
  if (Object.hasOwn(RAISED, msg)) return RAISED[msg];
  if (code === "42501") return "notFollowable";
  if (code === "23514") return "self";
  return "db";
}

/** Il "segui" c'era già (chiave doppia): per il sito è un successo, non un errore. */
export function alreadyFollowing(error: { code?: string | null } | null | undefined): boolean {
  return error?.code === "23505";
}

/**
 * La pagina di accesso con il ritorno alla pagina in cui si è premuto "Segui". Solo percorsi interni (come `safeNext`
 * di /auth/callback): qualunque altra cosa torna al profilo.
 */
export function loginReturnHref(locale: string, path: string | null | undefined): string {
  const back = typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : `/${locale}/account`;
  return `/${locale}/login?next=${encodeURIComponent(back)}`;
}

/** Riempie i segnaposto {nome} di un'etichetta. */
export function fillFollow(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => (Object.hasOwn(values, key) ? String(values[key]) : all));
}

/** "1 follower" / "12 follower": l'etichetta al singolare o al plurale, con il numero intero. */
export function followersText(labels: { followersOne: string; followersMany: string }, n: number): string {
  const v = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  return v === 1 ? labels.followersOne : fillFollow(labels.followersMany, { n: v });
}
