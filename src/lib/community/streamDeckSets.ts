import { supabasePublic } from "@/lib/supabase/public";
import { rowOrThrow } from "./queries";
import { freshClient } from "./streamDecks";
import { deckSetTableMissing, type CommunityDeckSet } from "./deckSets";

/**
 * Letture dei Mazzi torneo per gli strumenti delle dirette (04/10/2026, gli stessi dei mazzi singoli: regole in
 * src/lib/stream.ts): link breve /d/<slug>, comando di chat /api/chat/deck?set=, overlay /overlay/deck-set/<slug> e
 * immagine /api/deck-set-image/<slug>. Stesso stile di streamDecks.ts: client anonimo, solo trii PUBBLICATI (filtro
 * esplicito), niente guida, traduzioni, video né voti, che qui non servono. Un errore del database si lancia
 * (`CommunityReadError`); la tabella che non c'è ancora (migrazione non applicata, `deckSetTableMissing`) vale "il trio
 * non esiste", senza errore. `fresh` come in streamDecks.ts: comando e overlay leggono senza la cache dei dati di Next
 * (`freshClient`, copia in memoria di 5 s), link breve e immagine con la copia di al massimo un minuto.
 */
const PUBLISHED = "published";

const STREAM_SET_SELECT =
  "id, slug, owner, name, decks, legendaries, created_at, updated_at, profile:profiles!community_deck_sets_owner_fkey(username, display_name, avatar_url, badge)";

export type StreamDeckSet = Pick<CommunityDeckSet, "id" | "slug" | "owner" | "name" | "decks" | "legendaries" | "created_at" | "updated_at" | "profile">;

/** Un mazzo torneo pubblicato dal suo slug; null se non c'è, non è pubblicato, la tabella manca o la community è spenta. */
export async function getStreamDeckSet(slug: string, { fresh = false }: { fresh?: boolean } = {}): Promise<StreamDeckSet | null> {
  const client = fresh ? freshClient() : supabasePublic();
  if (!client) return null;
  const res = await client.from("community_deck_sets").select(STREAM_SET_SELECT).eq("slug", slug).eq("status", PUBLISHED).maybeSingle();
  if (deckSetTableMissing(res.error)) return null;
  return rowOrThrow<StreamDeckSet>("getStreamDeckSet", res);
}

/** true se c'è un mazzo torneo pubblicato con questo slug (per il link breve: basta sapere che c'è). */
export async function publishedDeckSetExists(slug: string): Promise<boolean> {
  const client = supabasePublic();
  if (!client) return false;
  const res = await client.from("community_deck_sets").select("slug").eq("slug", slug).eq("status", PUBLISHED).maybeSingle();
  if (deckSetTableMissing(res.error)) return false;
  return rowOrThrow<{ slug: string }>("publishedDeckSetExists", res) !== null;
}
