import { supabasePublic, type Db } from "@/lib/supabase/public";
import type { CommunityDeck } from "./types";

const DECK_SELECT =
  "id, slug, owner, name, legendary, cards, custom_cards, archetype, deck_type, video_url, guide, code_om, status, created_at, updated_at, profile:profiles!community_decks_owner_fkey(username, display_name, avatar_url, badge)";

async function withRatings(client: Db, decks: CommunityDeck[]): Promise<CommunityDeck[]> {
  if (!decks.length) return decks;
  const { data } = await client
    .from("deck_ratings")
    .select("deck_id, avg_stars, votes")
    .in(
      "deck_id",
      decks.map((d) => d.id),
    );
  const rows = (data ?? []) as { deck_id: string; avg_stars: number | string; votes: number | string }[];
  const map = new Map(rows.map((r) => [r.deck_id, { avg: Number(r.avg_stars), votes: Number(r.votes) }]));
  return decks.map((d) => ({ ...d, rating: map.get(d.id) ?? { avg: 0, votes: 0 } }));
}

/** Mazzi pubblicati, dal più recente; con autore e media voti. Vuoto se la community è spenta. */
export async function listPublishedDecks(limit = 200): Promise<CommunityDeck[]> {
  const client = supabasePublic();
  if (!client) return [];
  const { data, error } = await client.from("community_decks").select(DECK_SELECT).eq("status", "published").order("created_at", { ascending: false }).limit(limit);
  if (error) console.error("[community] listPublishedDecks:", error.message);
  if (error || !data) return [];
  return withRatings(client, data as unknown as CommunityDeck[]);
}

export async function getCommunityDeck(slug: string): Promise<CommunityDeck | null> {
  const client = supabasePublic();
  if (!client) return null;
  const { data, error } = await client.from("community_decks").select(DECK_SELECT).eq("slug", slug).eq("status", "published").maybeSingle();
  if (error || !data) return null;
  const [deck] = await withRatings(client, [data as unknown as CommunityDeck]);
  return deck;
}

/** Tutti i mazzi di un utente (anche nascosti): richiede il client con la sessione dell'utente. */
export async function listUserDecks(client: Db, userId: string): Promise<CommunityDeck[]> {
  const { data, error } = await client.from("community_decks").select(DECK_SELECT).eq("owner", userId).order("updated_at", { ascending: false });
  if (error || !data) return [];
  return withRatings(client, data as unknown as CommunityDeck[]);
}

/** Slug dei mazzi pubblicati (per la sitemap). */
export async function listPublishedSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const client = supabasePublic();
  if (!client) return [];
  const { data, error } = await client.from("community_decks").select("slug, updated_at").eq("status", "published").order("created_at", { ascending: false }).limit(1000);
  if (error) console.error("[community] listPublishedSlugs:", error.message);
  return (data ?? []) as { slug: string; updated_at: string }[];
}
