import { supabasePublic, type Db } from "@/lib/supabase/public";
import { locales, type Locale } from "@/lib/i18n";
import { MAX_PUBLISHED_DECKS, type CommunityDeck, type Guide, type Profile } from "./types";
import { guideLocales, type DeckTranslations } from "./deckTranslation";

/*
 * Mazzi privati ('draft', "Salva privato" del deck builder, 21/09/2026): ogni lettura pubblica filtra su
 * status = 'published' in modo esplicito, anche se il client anonimo non vedrebbe comunque i mazzi altrui.
 * La policy di select mostra al proprietario anche i suoi non pubblicati, quindi una lista pubblica letta
 * con la sessione dell'utente senza questo filtro li farebbe trapelare. Controllato il 21/09/2026: /decks,
 * "altri mazzi della community" e la sitemap passano da qui; decksWithCard, le pagine autore e /api/ask
 * non leggono community_decks (dati statici). Solo listUserDecks restituisce tutti gli stati, ed è usata
 * dal solo profilo con la sessione del proprietario.
 */
const PUBLISHED = "published";

const DECK_SELECT =
  "id, slug, owner, name, legendary, cards, custom_cards, archetype, deck_types, video_url, guide, code_om, status, created_at, updated_at, profile:profiles!community_decks_owner_fkey(username, display_name, avatar_url, badge)";

/*
 * Traduzioni automatiche delle guide (colonna `translations`, 25/09/2026). Finché la migrazione non è applicata
 * la colonna non esiste e PostgREST risponde 42703: allora si rifà la lettura senza, una volta per istanza, così
 * il sito non resta senza mazzi se il codice arriva online prima dello schema.
 */
let hasTranslations = true;
type ReadResult = { data: unknown; error: { code?: string; message: string } | null };

async function readWithTranslations(base: string, run: (select: string) => PromiseLike<ReadResult>): Promise<ReadResult> {
  const res = await run(hasTranslations ? `${base}, translations` : base);
  if (res.error && hasTranslations && (res.error.code === "42703" || res.error.message.includes("translations"))) {
    hasTranslations = false;
    console.error("[community] manca la colonna community_decks.translations: va applicato supabase/schema.sql");
    return run(base);
  }
  return res;
}

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
  const { data, error } = await readWithTranslations(DECK_SELECT, (sel) =>
    client.from("community_decks").select(sel).eq("status", PUBLISHED).order("created_at", { ascending: false }).limit(limit),
  );
  if (error) console.error("[community] listPublishedDecks:", error.message);
  if (error || !data) return [];
  return withRatings(client, data as unknown as CommunityDeck[]);
}

export async function getCommunityDeck(slug: string): Promise<CommunityDeck | null> {
  const client = supabasePublic();
  if (!client) return null;
  const { data, error } = await readWithTranslations(DECK_SELECT, (sel) => client.from("community_decks").select(sel).eq("slug", slug).eq("status", PUBLISHED).maybeSingle());
  if (error || !data) return null;
  const [deck] = await withRatings(client, [data as unknown as CommunityDeck]);
  return deck;
}

/** Tutti i mazzi di un utente, anche nascosti e privati (draft): richiede il client con la sessione dell'utente. */
export async function listUserDecks(client: Db, userId: string): Promise<CommunityDeck[]> {
  const { data, error } = await readWithTranslations(DECK_SELECT, (sel) => client.from("community_decks").select(sel).eq("owner", userId).order("updated_at", { ascending: false }));
  if (error || !data) return [];
  return withRatings(client, data as unknown as CommunityDeck[]);
}

/**
 * Quanti mazzi pubblicati (compresi i nascosti) ha un utente e quanti ne può avere (Pierluigi, 23/09/2026:
 * "mazzi 5 massimo per utente normale, per staff, influencer e pro senza limiti"). Il tetto vero lo impone il
 * trigger `enforce_deck_limit` di supabase/schema.sql: questa lettura serve al sito, per fermarsi prima e
 * spiegare il perché invece di mostrare un errore del database. I mazzi privati ('draft') non entrano nel
 * conto: hanno il loro tetto (MAX_PRIVATE_DECKS). Richiede il client con la sessione dell'utente.
 */
export async function publishedDeckLimit(client: Db, userId: string): Promise<{ used: number; cap: number }> {
  const { count } = await client.from("community_decks").select("id", { count: "exact", head: true }).eq("owner", userId).neq("status", "draft");
  const { data } = await client.from("profiles").select("role, badge").eq("id", userId).maybeSingle();
  const p = data as { role: string; badge: string } | null;
  const unlimited = p?.role === "admin" || ["creator", "influencer", "pro", "staff"].includes(p?.badge ?? "");
  return { used: count ?? 0, cap: unlimited ? Infinity : MAX_PUBLISHED_DECKS };
}

/**
 * Profilo pubblico di un utente dal suo nome utente (pagina /u/<username>, 23/09/2026). Il nome utente lo
 * assegna il trigger `handle_new_user` alla registrazione ed è unico: è l'indirizzo pubblico della persona.
 */
export async function getProfileByUsername(username: string): Promise<(Profile & { id: string; created_at: string }) | null> {
  const client = supabasePublic();
  if (!client) return null;
  const { data, error } = await client.from("profiles").select("id, username, display_name, avatar_url, badge, created_at").eq("username", username).maybeSingle();
  if (error || !data) return null;
  return data as unknown as Profile & { id: string; created_at: string };
}

/** Mazzi pubblicati di un utente, dal più recente: quel che si vede sulla sua pagina pubblica. */
export async function listDecksByOwner(userId: string, limit = 50): Promise<CommunityDeck[]> {
  const client = supabasePublic();
  if (!client) return [];
  const { data, error } = await readWithTranslations(DECK_SELECT, (sel) =>
    client.from("community_decks").select(sel).eq("owner", userId).eq("status", PUBLISHED).order("created_at", { ascending: false }).limit(limit),
  );
  if (error || !data) return [];
  return withRatings(client, data as unknown as CommunityDeck[]);
}

/** Nomi utente con almeno un mazzo pubblicato: le pagine profilo che vale la pena mettere in sitemap. */
export async function listPublicProfiles(): Promise<{ username: string; updated_at: string }[]> {
  const client = supabasePublic();
  if (!client) return [];
  const { data } = await client
    .from("community_decks")
    .select("updated_at, profile:profiles!community_decks_owner_fkey(username)")
    .eq("status", PUBLISHED)
    .order("updated_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as unknown as { updated_at: string; profile: { username: string | null } | null }[];
  const seen = new Map<string, string>();
  for (const r of rows) {
    const u = r.profile?.username;
    if (u && !seen.has(u)) seen.set(u, r.updated_at);
  }
  return Array.from(seen, ([username, updated_at]) => ({ username, updated_at }));
}

/**
 * Slug dei mazzi pubblicati (per la sitemap), con le lingue in cui la guida si legge davvero: quella dell'autore
 * più le traduzioni aggiornate (25/09/2026). Le altre versioni della pagina sono noindex e fuori dalla sitemap.
 */
export async function listPublishedSlugs(): Promise<{ slug: string; updated_at: string; locales: Locale[] }[]> {
  const client = supabasePublic();
  if (!client) return [];
  const { data, error } = await readWithTranslations("slug, updated_at, guide", (sel) =>
    client.from("community_decks").select(sel).eq("status", PUBLISHED).order("created_at", { ascending: false }).limit(1000),
  );
  if (error) console.error("[community] listPublishedSlugs:", error.message);
  const rows = (data ?? []) as { slug: string; updated_at: string; guide: Guide; translations?: DeckTranslations | null }[];
  return rows.map((r) => ({ slug: r.slug, updated_at: r.updated_at, locales: guideLocales(r, locales) }));
}
