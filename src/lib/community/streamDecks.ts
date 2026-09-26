import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { supabasePublic, type Db } from "@/lib/supabase/public";
import { rowOrThrow, rowsOrThrow } from "./queries";
import type { CommunityDeck } from "./types";

/**
 * Letture per gli strumenti delle dirette (pacchetto STREAM, 26/09/2026; regole in src/lib/stream.ts): link breve
 * /d/<slug>, comando di chat /api/chat/deck, overlay /overlay/deck e immagine /api/deck-image. Solo mazzi PUBBLICATI
 * (filtro esplicito, come in queries.ts), con il client anonimo: niente sessione, niente bozze né mazzi nascosti.
 * Più leggere di `getCommunityDeck`: niente guida, traduzioni e voti, che qui non servono (il comando di chat può
 * essere chiamato da un bot a ogni messaggio). Un errore del database si lancia (`CommunityReadError`): ogni rotta
 * decide che cosa mostrare.
 *
 * Due client. Quello di `supabasePublic` tiene le risposte 60 s nella cache dei dati di Next e, alla scadenza, serve
 * ancora la copia vecchia mentre la rinnova: va bene per il link breve e per l'immagine (che ha la versione del mazzo
 * nell'indirizzo). Il comando di chat e l'overlay promettono "entro un minuto": sommata alla cache della CDN e al giro
 * dell'overlay, quella cache li portava a due minuti e più, con il mazzo vecchio in chat. Per loro c'è `freshClient`,
 * senza cache dei dati ma con una copia in memoria di 5 secondi (`memoFetch`, contro le richieste a raffica con
 * parametri inventati): le loro rotte sono già dinamiche, e la CDN tiene la risposta del comando 20 s.
 */
const PUBLISHED = "published";

const STREAM_SELECT =
  "id, slug, owner, name, legendary, cards, custom_cards, archetype, created_at, updated_at, profile:profiles!community_decks_owner_fkey(username, display_name, avatar_url, badge)";

export type StreamDeck = Pick<CommunityDeck, "id" | "slug" | "owner" | "name" | "legendary" | "cards" | "custom_cards" | "archetype" | "created_at" | "updated_at" | "profile">;

/**
 * Micro-cache in memoria delle letture di `freshClient` (revisione dell'integrazione dei pacchetti creator). Comando di
 * chat e overlay sono rotte pubbliche dinamiche e la CDN distingue le risposte per indirizzo completo: con un parametro
 * inventato (?u=nome&x=<caso>) ogni richiesta arrivava al database. Qui la stessa lettura di Supabase (stesso indirizzo,
 * cioè stesso utente o slug e stesse colonne, e stesse intestazioni Accept e Prefer) si serve dalla memoria per
 * `FRESH_TTL_MS`, poi si rilegge: al massimo una lettura ogni 5 secondi per utente o mazzo, per istanza, qualunque sia il
 * resto dell'indirizzo. Scadenza vera, non la cache dei dati di Next (`next: { revalidate }`): quella, scaduta, serve
 * ancora la copia vecchia mentre la rinnova, e dopo una pausa lunga il primo !deck avrebbe mandato in chat il mazzo di
 * prima. Solo GET con risposta 200 (gli errori non si tengono); al massimo `FRESH_MAX` voci, le più vecchie escono per
 * prime. I 5 secondi si sommano ai 20 della CDN del comando (un mazzo nuovo in chat entro mezzo minuto) e al giro di 60
 * secondi dell'overlay.
 */
const FRESH_TTL_MS = 5_000;
const FRESH_MAX = 300;
type FreshEntry = { at: number; status: number; statusText: string; headers: [string, string][]; body: string };
const freshMemo = new Map<string, FreshEntry>();

async function memoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (method !== "GET") return fetch(input, { ...init, cache: "no-store" });
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  const key = `${url}\n${headers.get("accept") ?? ""}\n${headers.get("prefer") ?? ""}`;
  const now = Date.now();
  const hit = freshMemo.get(key);
  if (hit && now - hit.at < FRESH_TTL_MS) return new Response(hit.body, { status: hit.status, statusText: hit.statusText, headers: hit.headers });
  const res = await fetch(input, { ...init, cache: "no-store" });
  if (res.status !== 200) return res;
  const body = await res.text();
  // il corpo è già decodificato: via le intestazioni che parlano di quello originale
  const kept = [...res.headers].filter(([k]) => k !== "content-encoding" && k !== "content-length");
  freshMemo.delete(key);
  freshMemo.set(key, { at: now, status: res.status, statusText: res.statusText, headers: kept, body });
  for (const old of freshMemo.keys()) {
    if (freshMemo.size <= FRESH_MAX) break;
    freshMemo.delete(old);
  }
  return new Response(body, { status: res.status, statusText: res.statusText, headers: kept });
}

/** Client anonimo come `supabasePublic`, ma senza la cache dei dati di Next (solo per rotte dinamiche): `memoFetch`. */
function freshClient(): Db | null {
  if (!supabaseEnabled) return null;
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: memoFetch },
  });
}

/**
 * Un mazzo pubblicato dal suo slug; null se non c'è (o non è pubblicato) o se la community è spenta. `fresh`: lettura
 * senza cache (comando di chat e overlay); senza, la copia di al massimo un minuto (immagine).
 */
export async function getStreamDeck(slug: string, { fresh = false }: { fresh?: boolean } = {}): Promise<StreamDeck | null> {
  const client = fresh ? freshClient() : supabasePublic();
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
 * L'ultimo mazzo pubblicato di un utente, per il comando !deck e per l'overlay con ?u=: il più recente per data di
 * creazione (`created_at`, lo stesso ordine di /decks e del profilo /u). Non `updated_at`: il trigger
 * `touch_deck_updated_at` lo sposta a ogni modifica (guida, video, tipi, nascondi e ripubblica), e un refuso corretto
 * nella guida di un mazzo vecchio avrebbe cambiato mazzo all'overlay in piena diretta. Distingue "utente inesistente" da
 * "nessun mazzo", così lo streamer capisce se ha sbagliato il nome. Sempre senza cache (`freshClient`). Quando esisterà
 * un "mazzo in evidenza" scelto dal creator, andrà letto qui per primo.
 */
export async function latestDeckOfUser(username: string): Promise<LatestDeck> {
  const client = freshClient();
  if (!client) return { user: "missing" };
  const profile = rowOrThrow<{ id: string }>("latestDeckOfUser (profilo)", await client.from("profiles").select("id").eq("username", username).maybeSingle());
  if (!profile) return { user: "missing" };
  const res = await client
    .from("community_decks")
    .select(STREAM_SELECT)
    .eq("owner", profile.id)
    .eq("status", PUBLISHED)
    .order("created_at", { ascending: false })
    .limit(1);
  const [deck] = rowsOrThrow<StreamDeck>("latestDeckOfUser (mazzi)", res);
  return { user: "found", deck: deck ?? null };
}
