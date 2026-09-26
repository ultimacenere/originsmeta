import { supabasePublic, type Db } from "@/lib/supabase/public";
import { CommunityReadError } from "./queries";
import { VETRINA_COLUMNS, toVetrina, type Vetrina, type VetrinaRow } from "./showcase";

/**
 * Letture della vetrina dei profili (pacchetto VETRINA, 27/09/2026; regole in showcase.ts, SQL in
 * supabase/wave2-VETRINA.sql). Come creators.ts: nelle pagine ISR un errore del database lancia (Next tiene la pagina di
 * prima), tranne le colonne che ancora non esistono (codice online prima della migrazione: errore 42703, o 42P01 se
 * mancasse la tabella). Allora si risponde "nessuna vetrina" e /u resta com'era; lo stato vale `MISSING_RETRY_MS`, poi si
 * riprova, così dopo la migrazione un'istanza accesa torna a leggere da sola.
 */

type ReadError = { code?: string; message: string } | null;

const MISSING_RETRY_MS = 5 * 60_000;
const state = { missingUntil: 0, logged: false };

const COLUMN_NAMES = VETRINA_COLUMNS.split(", ").join("|");
const MISSING_RE = new RegExp(`(${COLUMN_NAMES}).*does not exist`);

/** Le colonne della vetrina mancano ancora? (migrazione non applicata) Lo si scrive nei log una volta sola. */
export function vetrinaMissing(error: ReadError): boolean {
  if (!error) return false;
  const missing = error.code === "42703" || error.code === "42P01" || MISSING_RE.test(error.message);
  if (missing) {
    state.missingUntil = Date.now() + MISSING_RETRY_MS;
    if (!state.logged) {
      state.logged = true;
      console.error("[community] mancano le colonne della vetrina dei profili: va applicata la migrazione del pacchetto VETRINA (supabase/wave2-VETRINA.sql)");
    }
  }
  return missing;
}

/**
 * La vetrina di un profilo per la pagina /u (client anonimo, cache dei dati di Next). null se il profilo non c'è o se le
 * colonne mancano; con un altro errore lancia. Chi chiama la usa solo per i ruoli con vetrina.
 */
export async function getProfileVetrina(profileId: string): Promise<Vetrina | null> {
  const client = supabasePublic();
  if (!client || Date.now() < state.missingUntil) return null;
  const res = await client.from("profiles").select(VETRINA_COLUMNS).eq("id", profileId).maybeSingle();
  if (vetrinaMissing(res.error)) return null;
  if (res.error) throw new CommunityReadError("getProfileVetrina", res.error.message);
  return res.data ? toVetrina(res.data as unknown as Partial<VetrinaRow>, profileId) : null;
}

export type OwnVetrina = {
  /** `missing`: colonne non ancora nel database; `error`: lettura fallita (i moduli non si mostrano) */
  status: "ok" | "missing" | "error";
  vetrina: Vetrina | null;
  username: string | null;
  badge: string | null;
  role: string | null;
  /** la foto mostrata adesso (quella caricata, o quella di Discord, o nessuna) */
  avatarUrl: string | null;
};

/**
 * La propria vetrina, per /account (client con la sessione, pagina dinamica): legge sempre, anche dopo un 42703 (appena
 * la migrazione è applicata i moduli compaiono). Un errore non rompe la pagina.
 */
export async function getOwnVetrina(client: Db, userId: string): Promise<OwnVetrina> {
  const res = await client.from("profiles").select(`username, badge, role, avatar_url, ${VETRINA_COLUMNS}`).eq("id", userId).maybeSingle();
  if (res.error) {
    const missing = vetrinaMissing(res.error);
    if (!missing) console.error("[community] getOwnVetrina:", res.error.message);
    const base = await client.from("profiles").select("username, badge, role, avatar_url").eq("id", userId).maybeSingle();
    const row = base.data as { username: string | null; badge: string | null; role: string | null; avatar_url: string | null } | null;
    return { status: missing ? "missing" : "error", vetrina: null, username: row?.username ?? null, badge: row?.badge ?? null, role: row?.role ?? null, avatarUrl: row?.avatar_url ?? null };
  }
  const row = res.data as unknown as (Partial<VetrinaRow> & { username: string | null; badge: string | null; role: string | null; avatar_url: string | null }) | null;
  if (!row) return { status: "error", vetrina: null, username: null, badge: null, role: null, avatarUrl: null };
  return { status: "ok", vetrina: toVetrina(row, userId), username: row.username, badge: row.badge, role: row.role, avatarUrl: row.avatar_url };
}

/** I mazzi pubblicati dell'utente, per scegliere quello in evidenza (dal più recente). Vuoto con un errore. */
export async function listOwnPublishedDecks(client: Db, userId: string): Promise<{ id: string; name: string; legendary: string | null }[]> {
  const { data, error } = await client
    .from("community_decks")
    .select("id, name, legendary")
    .eq("owner", userId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[community] listOwnPublishedDecks:", error.message);
    return [];
  }
  return (data ?? []) as { id: string; name: string; legendary: string | null }[];
}
