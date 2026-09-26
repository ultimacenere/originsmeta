import { supabasePublic } from "@/lib/supabase/public";
import { rowOrThrow, rowsOrThrow } from "./queries";
import type { CommunityDeck } from "./types";

/**
 * Letture per gli strumenti delle dirette (pacchetto STREAM, 26/09/2026; regole in src/lib/stream.ts): link breve
 * /d/<slug>, comando di chat /api/chat/deck, overlay /overlay/deck e immagine /api/deck-image. Solo mazzi PUBBLICATI
 * (filtro esplicito, come in queries.ts), con il client anonimo: niente sessione, niente bozze né mazzi nascosti.
 * Più leggere di `getCommunityDeck`: niente guida, traduzioni e voti, che qui non servono (il comando di chat può
 * essere chiamato da un bot a ogni messaggio). Le risposte di Supabase restano 60 s nella cache dei dati di Next
 * (`supabasePublic`). Un errore del database si lancia (`CommunityReadError`): ogni rotta decide che cosa mostrare.
 */
const PUBLISHED = "published";

const STREAM_SELECT =
  "id, slug, owner, name, legendary, cards, custom_cards, archetype, created_at, updated_at, profile:profiles!community_decks_owner_fkey(username, display_name, avatar_url, badge)";

export type StreamDeck = Pick<CommunityDeck, "id" | "slug" | "owner" | "name" | "legendary" | "cards" | "custom_cards" | "archetype" | "created_at" | "updated_at" | "profile">;

/** Un mazzo pubblicato dal suo slug; null se non c'è (o non è pubblicato) o se la community è spenta. */
export async function getStreamDeck(slug: string): Promise<StreamDeck | null> {
  const client = supabasePublic();
  if (!client) return null;
  const res = await client.from("community_decks").select(STREAM_SELECT).eq("slug", slug).eq("status", PUBLISHED).maybeSingle();
  return rowOrThrow<StreamDeck>("getStreamDeck", res);
}

/** Lo slug di un mazzo pubblicato, se esiste (per il link breve: basta sapere che c'è). */
export async function publishedDeckExists(slug: string): Promise<boolean> {
  const client = supabasePublic();
  if (!client) return false;
  const res = await client.from("community_decks").select("slug").eq("slug", slug).eq("status", PUBLISHED).maybeSingle();
  return rowOrThrow<{ slug: string }>("publishedDeckExists", res) !== null;
}

export type LatestDeck = { user: "missing" } | { user: "found"; deck: StreamDeck | null };

/**
 * L'ultimo mazzo pubblicato di un utente (il più recente fra creati e modificati: `updated_at`, che non si sposta con
 * voti e traduzioni), per il comando !deck e per l'overlay con ?u=. Distingue "utente inesistente" da "nessun mazzo",
 * così lo streamer capisce se ha sbagliato il nome. Quando esisterà un "mazzo in evidenza" scelto dal creator, andrà
 * letto qui per primo.
 */
export async function latestDeckOfUser(username: string): Promise<LatestDeck> {
  const client = supabasePublic();
  if (!client) return { user: "missing" };
  const profile = rowOrThrow<{ id: string }>("latestDeckOfUser (profilo)", await client.from("profiles").select("id").eq("username", username).maybeSingle());
  if (!profile) return { user: "missing" };
  const res = await client
    .from("community_decks")
    .select(STREAM_SELECT)
    .eq("owner", profile.id)
    .eq("status", PUBLISHED)
    .order("updated_at", { ascending: false })
    .limit(1);
  const [deck] = rowsOrThrow<StreamDeck>("latestDeckOfUser (mazzi)", res);
  return { user: "found", deck: deck ?? null };
}
