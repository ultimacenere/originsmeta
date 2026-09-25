import { supabasePublic, type Db } from "@/lib/supabase/public";
import type { TierListRow } from "@/lib/supabase/database";
import { TIERS, type Tier, type TierBoard, type TierKind } from "@/lib/tiercode";
import { rankedCount } from "@/lib/tierstats";
import { rowsOrThrow } from "./queries";

/**
 * Tier list della community. Le tier list che gli iscritti salvano dal tool `/tier-list/create` alimentano una
 * classifica unica: per ogni carta la media delle fasce ricevute (S=5 … D=1), il numero di voti e la distribuzione.
 * Dal 24/09/2026 (riprogettazione della sezione, §1 punto 32 della KB) i numeri li calcola il sito, con
 * `aggregateLists` di `src/lib/tierstats.ts` (funzione pura, con test): la vista SQL `tier_card_scores` dava media e
 * voti ma non la distribuzione per fascia, che ora il dettaglio di ogni carta mostra.
 *
 * È dichiaratamente l'opinione di chi frequenta il sito, non un dato del gioco: la tier list di OriginsMeta
 * (/tier-list) resta separata e aspetta i risultati dei tornei ufficiali.
 */

export type PublishedTierList = {
  owner: string;
  kind: TierKind;
  entries: unknown;
  updated_at: string;
  /** titolo scelto dall'autore e codice TL1: le tier list firmate di /tier-list/community si aprono nel tool (Ondata 3) */
  title: string;
  code: string;
  /** chi l'ha salvata: nome, nome utente e tag autore (le tier list firmate, `signedTierLists` in tierstats.ts) */
  profile: { username: string | null; display_name: string | null; badge: string | null } | null;
};

/** Le tier list pubblicate, di entrambi i tipi: le legge chiunque (policy di select di `tier_lists` e di `profiles`). */
export async function listPublishedTierLists(): Promise<PublishedTierList[]> {
  const client = supabasePublic();
  if (!client) return [];
  // Con un errore lancia (DECKS-12): la rigenerazione fallisce e restano le tier list di prima, non una classifica vuota.
  // `owner` serve a communitySample (tierstats.ts): persone e liste salvate. Titolo, codice e profilo (Ondata 3) servono
  // alle tier list firmate di /tier-list/community: stessa lettura, niente query in più.
  // Limite da tenere d'occhio: la cache dei dati di Next non conserva risposte oltre i 2 MB, e con `entries` e `code` una
  // lista di carte base pesa circa 3 KB. Verso le 650 liste la risposta non resterebbe più in cache (una lettura a ogni
  // rigenerazione di ognuna delle tre pagine): a quel punto `title` e `code` vanno letti solo per le righe firmate.
  const res = await client
    .from("tier_lists")
    .select("owner, kind, entries, updated_at, title, code, profile:profiles!tier_lists_owner_fkey(username, display_name, badge)")
    .eq("status", "published")
    .limit(5000);
  return rowsOrThrow<PublishedTierList>("listPublishedTierLists", res);
}

/**
 * Solo chi ha salvato e quale scheda, per le tier list pubblicate: bastano ai conteggi dell'invito della home
 * (`tierListCounts`, rotta /api/tier-list-counts), senza scaricare fasce, codici e profili. Con un errore lancia (DECKS-12).
 */
export async function listTierListOwners(): Promise<{ owner: string; kind: TierKind }[]> {
  const client = supabasePublic();
  if (!client) return [];
  const res = await client.from("tier_lists").select("owner, kind").eq("status", "published").limit(5000);
  return rowsOrThrow<{ owner: string; kind: TierKind }>("listTierListOwners", res);
}

const TIER_LIST_SELECT = "id, owner, kind, title, code, entries, status, created_at, updated_at";

/** Le tier list di un utente (tutte, anche nascoste): richiede il client con la sua sessione. */
export async function listUserTierLists(client: Db, userId: string): Promise<TierListRow[]> {
  const { data, error } = await client.from("tier_lists").select(TIER_LIST_SELECT).eq("owner", userId).order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as TierListRow[];
}

/** Le tier list pubblicate di un utente, per la sua pagina pubblica. */
export async function listPublicTierLists(userId: string): Promise<TierListRow[]> {
  const client = supabasePublic();
  if (!client) return [];
  // Con un errore lancia (DECKS-12), come le letture di queries.ts: il profilo pubblico tiene la versione di prima.
  const res = await client.from("tier_lists").select(TIER_LIST_SELECT).eq("owner", userId).eq("status", "published").order("kind");
  return rowsOrThrow<TierListRow>("listPublicTierLists", res);
}

/** Le fasce di una riga salvata, ripulite: solo le cinque lettere e solo elenchi di stringhe. */
export function boardEntries(board: TierBoard): Record<Tier, string[]> {
  const out = {} as Record<Tier, string[]>;
  for (const t of TIERS) out[t] = board.tiers[t] ?? [];
  return out;
}

/**
 * Quante carte contiene una tier list salvata (per la riga di riepilogo nel profilo e in /account). Stesso conto delle
 * tier list firmate di /tier-list/community (`rankedCount`: carte distinte), così la stessa lista non ha due numeri sotto
 * la stessa etichetta "carte classificate" (revisione dell'Ondata 3).
 */
export function countEntries(entries: Record<string, string[]> | null | undefined): number {
  return rankedCount(entries);
}
