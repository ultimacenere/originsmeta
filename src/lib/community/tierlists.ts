import { supabasePublic, type Db } from "@/lib/supabase/public";
import type { TierListRow } from "@/lib/supabase/database";
import { TIERS, type Tier, type TierBoard, type TierKind } from "@/lib/tiercode";

/**
 * Tier list della community (23/09/2026, §1 punto 27.1 della KB). Le tier list che gli utenti salvano dal tool
 * `/tier-list/create` alimentano una classifica unica: per ogni carta si fa la media delle fasce ricevute
 * (S=5, A=4, B=3, C=2, D=1) e la si rimette in una fascia. La media la calcola la vista `tier_card_scores`
 * di supabase/schema.sql; la soglia sta qui, così si cambia senza toccare il database.
 *
 * Questa classifica è dichiaratamente l'opinione della community, non un dato del gioco: la tier list ufficiale
 * (/tier-list) resta separata e aspetta i risultati dei tornei ufficiali.
 */

/** Punteggio di ogni fascia: la S vale 5, la D vale 1. Cambiare qui cambia anche la vista SQL. */
export const TIER_SCORE: Record<Tier, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };

/**
 * Quante persone devono aver classificato una carta perché entri nelle fasce. Sotto questa soglia la carta
 * resta fra le "non ancora classificate": con un voto solo la classifica sarebbe quella di una persona.
 * Parte da 1 perché la funzione è appena nata e le tier list salvate sono poche; si alza quando cresceranno.
 */
export const MIN_TIER_VOTES = 1;

export type CommunityTierScore = { slug: string; avg: number; votes: number; tier: Tier };

/** La fascia che corrisponde a una media: 4,5 e oltre è S, sotto 1,5 è D. */
export function tierFromScore(avg: number): Tier {
  if (avg >= 4.5) return "S";
  if (avg >= 3.5) return "A";
  if (avg >= 2.5) return "B";
  if (avg >= 1.5) return "C";
  return "D";
}

/** Punteggi della community per un tipo di tier list, dal più alto; vuoto se la community è spenta. */
export async function communityScores(kind: TierKind): Promise<CommunityTierScore[]> {
  const client = supabasePublic();
  if (!client) return [];
  const { data, error } = await client.from("tier_card_scores").select("slug, avg_score, votes").eq("kind", kind);
  if (error) {
    console.error("[community] communityScores:", error.message);
    return [];
  }
  return ((data ?? []) as { slug: string; avg_score: number | string; votes: number | string }[])
    .map((r) => {
      const avg = Number(r.avg_score);
      return { slug: r.slug, avg, votes: Number(r.votes), tier: tierFromScore(avg) };
    })
    .filter((r) => r.votes >= MIN_TIER_VOTES)
    .sort((a, b) => b.avg - a.avg || b.votes - a.votes || a.slug.localeCompare(b.slug));
}

/** Quante tier list pubblicate ci sono per un tipo: è il "quante persone hanno votato" della pagina. */
export async function communityTierCount(kind: TierKind): Promise<number> {
  const client = supabasePublic();
  if (!client) return 0;
  const { count } = await client.from("tier_lists").select("id", { count: "exact", head: true }).eq("kind", kind).eq("status", "published");
  return count ?? 0;
}

/** I punteggi divisi per fascia, nell'ordine delle fasce: quel che la pagina disegna. */
export function byTier(scores: CommunityTierScore[]): Record<Tier, CommunityTierScore[]> {
  const out = { S: [], A: [], B: [], C: [], D: [] } as Record<Tier, CommunityTierScore[]>;
  for (const s of scores) out[s.tier].push(s);
  return out;
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
  const { data, error } = await client.from("tier_lists").select(TIER_LIST_SELECT).eq("owner", userId).eq("status", "published").order("kind");
  if (error || !data) return [];
  return data as unknown as TierListRow[];
}

/** Le fasce di una riga salvata, ripulite: solo le cinque lettere e solo elenchi di stringhe. */
export function boardEntries(board: TierBoard): Record<Tier, string[]> {
  const out = {} as Record<Tier, string[]>;
  for (const t of TIERS) out[t] = board.tiers[t] ?? [];
  return out;
}

/** Quante carte contiene una tier list salvata (per la riga di riepilogo nel profilo). */
export function countEntries(entries: Record<string, string[]> | null | undefined): number {
  if (!entries) return 0;
  return TIERS.reduce((n, t) => n + (Array.isArray(entries[t]) ? entries[t].length : 0), 0);
}
