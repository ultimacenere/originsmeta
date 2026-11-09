/**
 * Account nati con Steam (09/11/2026): chi entra la prima volta con "Continua con Steam" ha un account del sito come chi
 * entra con Discord o con l'email. Supabase Auth vuole un indirizzo email: il sito ne dà uno tecnico, che non riceve
 * posta e che nessuno può indovinare (`steamAccountEmail`: SteamID64 più una parte casuale, dominio .local), quindi
 * nessuno può creare in anticipo l'account Steam di un altro con il link via email. Il legame fra l'account e Steam sta
 * nella tabella steam_links (blocco "09/11/2026: STEAM" di supabase/schema.sql), scritta subito dopo la creazione.
 *
 * Nome mostrato e nome utente partono dal nome del profilo Steam (`steamSignupNames`), con le regole dei nomi del sito
 * (src/lib/community/profileNames.ts): un nome che non va bene (parole dello staff, caratteri invisibili, troppo corto)
 * non si usa e il database sceglie "player" come per gli altri accessi. Si cambiano poi da /account/profile#name.
 *
 * Funzioni pure tranne `fetchSteamPersona` (che riceve `fetch`): test in steam.test.ts.
 */
import { checkDisplayName, checkUsername, cleanDisplayName } from "../community/profileNames";

/**
 * Dominio degli indirizzi tecnici. Stesso testo nell'espressione di steam_account_only (blocco STEAM di schema.sql),
 * che lo usa per non lasciare scollegare Steam a chi non ha altri modi per entrare (steam.test.ts le confronta).
 */
export const STEAM_ACCOUNT_EMAIL_DOMAIN = "steam.originsmeta.local";
/** steam-<SteamID64>-<16 caratteri esadecimali>@steam.originsmeta.local */
export const STEAM_ACCOUNT_EMAIL_PATTERN = "^steam-7656119[0-9]{10}-[0-9a-f]{16}@steam\\.originsmeta\\.local$";
const accountEmailRe = new RegExp(STEAM_ACCOUNT_EMAIL_PATTERN);

/** Indirizzo tecnico di un account nuovo nato con Steam (`random`: 16 caratteri esadecimali, per i test). */
export function steamAccountEmail(steamId: string, random?: string): string {
  let tail = random;
  if (!tail) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    tail = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `steam-${steamId}-${tail}@${STEAM_ACCOUNT_EMAIL_DOMAIN}`;
}

/** L'indirizzo è quello tecnico di un account nato con Steam? (In /account al suo posto si scrive "Steam".) */
export function isSteamAccountEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && accountEmailRe.test(email.toLowerCase());
}

/** Il nome del profilo Steam dalla pagina pubblica in XML (`<steamID><![CDATA[nome]]></steamID>`), o null. */
export function parsePersonaXml(xml: string): string | null {
  const m = /<steamID>\s*<!\[CDATA\[([\s\S]{0,200}?)\]\]>\s*<\/steamID>/.exec(xml.slice(0, 20000));
  const name = m?.[1]?.trim();
  return name ? name : null;
}

/**
 * Nome del profilo Steam, letto dalla sua pagina pubblica in XML (nessuna chiave: nome e foto di un profilo Steam sono
 * sempre pubblici, anche quando il profilo è privato). Se Steam non risponde in fretta, null: l'account nasce lo stesso.
 */
export async function fetchSteamPersona(steamId: string, fetchImpl: typeof fetch = fetch, timeoutMs = 4000): Promise<string | null> {
  try {
    const res = await fetchImpl(`https://steamcommunity.com/profiles/${steamId}/?xml=1`, {
      headers: { accept: "application/xml,text/xml" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return parsePersonaXml(await res.text());
  } catch {
    return null;
  }
}

/** Il nome utente come lo costruirebbe handle_new_user (schema.sql): minuscole, il resto in trattini, niente trattini ai bordi. */
export function usernameFromPersona(persona: string): string {
  return persona
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * I metadati dell'account nuovo da cui handle_new_user prende i nomi: `full_name` (nome mostrato) e `user_name` (base del
 * nome utente; se è preso il database aggiunge -1, -2…). Solo nomi che rispettano le regole del sito.
 */
export function steamSignupNames(persona: string | null): { full_name?: string; user_name: string } {
  const display = persona ? cleanDisplayName(persona) : "";
  const user = persona ? usernameFromPersona(persona) : "";
  const userOk = user !== "" && checkUsername(user) === "ok" && !/--/.test(user);
  return {
    ...(display && checkDisplayName(display) === "ok" ? { full_name: display } : {}),
    user_name: userOk ? user : "player",
  };
}
