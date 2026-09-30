import { supabasePublic, type Db } from "@/lib/supabase/public";
import { locales } from "@/lib/i18n";
import type { CommunityDeck, Guide, Profile } from "./types";
import { normalizeBadge, publishedDeckCap, type Badge } from "./badges";
import type { DeckTranslations } from "./deckTranslation";
import { sitemapDecks, type SitemapDeck } from "./deckQuality";
import { guideTableMissing } from "./guides";
import { versionRatings, type DeckVersion } from "./deckVersions";

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
 * "Nessun risultato" e "errore" non sono la stessa cosa (DECKS-12, Ondata 2 del piano SEO/GEO, 25/09/2026).
 * Prima ogni lettura trasformava un errore del database o della rete in una lista vuota o in null: durante una
 * rigenerazione ISR la scheda di un mazzo diventava una 404 (`notFound()`), /decks un hub con 0 mazzi, i voti andavano
 * a 0 e la sitemap perdeva mazzi e profili fino alla rigenerazione successiva (un minuto per le schede, un'ora per la
 * sitemap), magari proprio mentre Googlebot passava. Ora un errore si lancia: Next non sostituisce la pagina e continua
 * a servire l'ultima versione generata bene, e riprova alla richiesta successiva (guida di Next 16,
 * node_modules/next/dist/docs/01-app/02-guides/incremental-static-regeneration.md, "Handling uncaught exceptions").
 * Lista vuota e null restano per le letture riuscite che non trovano nulla, e per la community spenta
 * (NEXT_PUBLIC_COMMUNITY=off, `supabasePublic()` null). Vale per le letture pubbliche; il pannello privato /account
 * (`listUserDecks`, dinamico) resta com'era.
 * Effetto collaterale voluto: una build con Supabase irraggiungibile (rete assente, progetto del piano Free in pausa)
 * fallisce invece di mettere online un /decks vuoto, e su Vercel resta attivo il deploy precedente. Per una build senza
 * rete (worktree offline, sandbox) si spegne la community: NEXT_PUBLIC_COMMUNITY=off, `supabasePublic()` null e liste
 * vuote come prima.
 */

/** Errore di una lettura della community: interrompe la generazione della pagina invece di renderla vuota. */
export class CommunityReadError extends Error {
  constructor(what: string, message: string) {
    super(`[community] ${what}: ${message}`);
    this.name = "CommunityReadError";
  }
}

type ReadResult = { data: unknown; error: { code?: string; message: string } | null };

/** Le righe di una lettura riuscita (anche nessuna); se la lettura è fallita lancia `CommunityReadError`. */
export function rowsOrThrow<T>(what: string, res: ReadResult): T[] {
  if (res.error) throw new CommunityReadError(what, res.error.message);
  return Array.isArray(res.data) ? (res.data as T[]) : [];
}

/** La riga di una lettura riuscita, o null se non c'è; se la lettura è fallita lancia `CommunityReadError`. */
export function rowOrThrow<T>(what: string, res: ReadResult): T | null {
  if (res.error) throw new CommunityReadError(what, res.error.message);
  return (res.data ?? null) as T | null;
}

/*
 * Traduzioni automatiche delle guide (colonna `translations`, 25/09/2026). Finché la migrazione non è applicata
 * la colonna non esiste e PostgREST risponde 42703: allora si rifà la lettura senza, così il sito non resta senza
 * mazzi se il codice arriva online prima dello schema. La colonna mancante si salta per `OPTIONAL_RETRY_MS` e poi si
 * riprova (come `MISSING_RETRY_MS` in creators.ts): dopo la migrazione un'istanza rimasta accesa torna a leggerla da
 * sola entro 5 minuti, senza un nuovo deploy (prima la saltava per sempre, fino al riavvio).
 * Lo stesso per video e risorse dei mazzi (colonne `videos` e `links`, supabase/schema.sql, blocco VIDEO, 26/09/2026): senza,
 * la scheda legge il vecchio `video_url` come primo video (`deckVideos` in src/lib/videos.ts) e non mostra risorse.
 * `groups`: i gruppi di colonne facoltative che la lettura vuole. Video e risorse ("media") li chiede solo la scheda di
 * un mazzo: le liste (/decks, tier list, profili, sitemap) non li mostrano e non li scaricano. L'artwork della Leggendaria
 * ("art", 29/09/2026) lo chiedono la scheda e le liste che mostrano la Leggendaria (non la sitemap).
 */
type OptionalGroup = "translations" | "media" | "art" | "version";
/** Per quanto tempo, dopo un 42703, un gruppo di colonne non si chiede più (poi si riprova). */
const OPTIONAL_RETRY_MS = 5 * 60_000;
/** `missingUntil`: fino a quando il gruppo si considera mancante (0: si legge). */
const optionalColumns: { id: OptionalGroup; columns: string[]; missingUntil: number }[] = [
  { id: "translations", columns: ["translations"], missingUntil: 0 },
  { id: "media", columns: ["videos", "links"], missingUntil: 0 },
  // artwork della Leggendaria dei Creator (blocco IMMAGINI, 29/09/2026): la scheda, /decks, i profili e le tier list
  { id: "art", columns: ["art_path"], missingUntil: 0 },
  // versione delle carte (blocco VERSIONI, 30/09/2026): chi mostra la patch del mazzo la ricava da cards_updated_at
  { id: "version", columns: ["version", "cards_updated_at"], missingUntil: 0 },
];

async function readWithTranslations(
  base: string,
  run: (select: string) => PromiseLike<ReadResult>,
  groups: readonly OptionalGroup[] = ["translations"],
): Promise<ReadResult> {
  for (;;) {
    const now = Date.now();
    const active = optionalColumns.filter((g) => now >= g.missingUntil && groups.includes(g.id));
    const res = await run([base, ...active.flatMap((g) => g.columns)].join(", "));
    const err = res.error;
    const missing = err ? active.find((g) => g.columns.some((c) => err.message.includes(c)) && (err.code === "42703" || err.message.includes("does not exist"))) : undefined;
    if (!missing) return res;
    // ogni giro toglie un gruppo da `active`: il ciclo finisce
    missing.missingUntil = now + OPTIONAL_RETRY_MS;
    console.error(`[community] manca la colonna community_decks.${missing.columns.join("/")}: va applicato supabase/schema.sql`);
  }
}

/**
 * Media voti dei mazzi. Nelle pagine pubbliche un errore si lancia: meglio la pagina di prima che voti a 0.
 * `lenient` solo per il pannello privato (/account, dinamico, niente ISR): lì resta il comportamento di prima.
 */
async function withRatings(client: Db, decks: CommunityDeck[], lenient = false): Promise<CommunityDeck[]> {
  if (!decks.length) return decks;
  const res = await client
    .from("deck_ratings")
    .select("deck_id, avg_stars, votes")
    .in(
      "deck_id",
      decks.map((d) => d.id),
    );
  if (lenient && res.error) console.error("[community] deck_ratings:", res.error.message);
  const rows = lenient && res.error ? [] : rowsOrThrow<{ deck_id: string; avg_stars: number | string; votes: number | string }>("deck_ratings", res);
  const map = new Map(rows.map((r) => [r.deck_id, { avg: Number(r.avg_stars), votes: Number(r.votes) }]));
  return decks.map((d) => ({ ...d, rating: map.get(d.id) ?? { avg: 0, votes: 0 } }));
}

/**
 * Mazzi pubblicati, dal più recente; con autore e media voti. Vuoto se la community è spenta; con un errore lancia.
 * Chi chiede lo stesso `limit` condivide la stessa risposta nella cache dei dati di Next (60 s, `supabasePublic`):
 * /decks, le tier list e le schede dei mazzi usano il valore di default, quindi una lettura sola al minuto.
 */
export async function listPublishedDecks(limit = 200): Promise<CommunityDeck[]> {
  const client = supabasePublic();
  if (!client) return [];
  const res = await readWithTranslations(
    DECK_SELECT,
    (sel) => client.from("community_decks").select(sel).eq("status", PUBLISHED).order("created_at", { ascending: false }).limit(limit),
    ["translations", "art", "version"],
  );
  return withRatings(client, rowsOrThrow<CommunityDeck>("listPublishedDecks", res));
}

/** Un mazzo pubblicato; null solo se la lettura riesce e il mazzo non c'è (o non è pubblicato): allora è una 404 vera. */
export async function getCommunityDeck(slug: string): Promise<CommunityDeck | null> {
  const client = supabasePublic();
  if (!client) return null;
  const res = await readWithTranslations(DECK_SELECT, (sel) => client.from("community_decks").select(sel).eq("slug", slug).eq("status", PUBLISHED).maybeSingle(), [
    "translations",
    "media",
    "art",
    "version",
  ]);
  const deck = rowOrThrow<CommunityDeck>("getCommunityDeck", res);
  if (!deck) return null;
  const [rated] = await withRatings(client, [deck]);
  return rated;
}

/**
 * Tutti i mazzi di un utente, anche nascosti e privati (draft): richiede il client con la sessione dell'utente.
 * È la sola lettura del pannello privato /account, renderizzato a ogni richiesta e fuori da ISR e sitemap: qui un
 * errore resta una lista vuota come prima del 25/09/2026 (la pagina di errore di Next non spiegherebbe di più).
 */
export async function listUserDecks(client: Db, userId: string): Promise<CommunityDeck[]> {
  const { data, error } = await readWithTranslations(DECK_SELECT, (sel) => client.from("community_decks").select(sel).eq("owner", userId).order("updated_at", { ascending: false }), [
    "translations",
    "version",
  ]);
  if (error) console.error("[community] listUserDecks:", error.message);
  if (error || !Array.isArray(data)) return [];
  return withRatings(client, data as CommunityDeck[], true);
}

/**
 * Quanti mazzi pubblicati (compresi i nascosti) ha un utente e quanti ne può avere: 5 per la community, 20 per
 * l'Autore, nessun tetto per Creator, Pro, Staff e admin (`publishedDeckCap` in badges.ts, ruoli del 27/09/2026). Il
 * tetto vero lo impone il trigger `enforce_deck_limit` di supabase/schema.sql: questa lettura serve al sito, per
 * fermarsi prima e spiegare il perché invece di mostrare un errore del database. I mazzi privati ('draft') non entrano
 * nel conto: hanno il loro tetto (MAX_PRIVATE_DECKS). `badge` è il tag già normalizzato, per scegliere il messaggio.
 * Richiede il client con la sessione dell'utente.
 */
export async function publishedDeckLimit(client: Db, userId: string): Promise<{ used: number; cap: number; badge: Badge }> {
  const { count } = await client.from("community_decks").select("id", { count: "exact", head: true }).eq("owner", userId).neq("status", "draft");
  const { data } = await client.from("profiles").select("role, badge").eq("id", userId).maybeSingle();
  const p = data as { role: string | null; badge: string | null } | null;
  return { used: count ?? 0, cap: publishedDeckCap(p), badge: normalizeBadge(p?.badge) };
}

/**
 * Profilo pubblico di un utente dal suo nome utente (pagina /u/<username>, 23/09/2026). Il nome utente lo
 * assegna il trigger `handle_new_user` alla registrazione ed è unico: è l'indirizzo pubblico della persona.
 * null solo se il profilo non esiste (404 vera); con un errore lancia.
 */
export async function getProfileByUsername(username: string): Promise<(Profile & { id: string; created_at: string }) | null> {
  const client = supabasePublic();
  if (!client) return null;
  const res = await client.from("profiles").select("id, username, display_name, avatar_url, badge, created_at").eq("username", username).maybeSingle();
  return rowOrThrow<Profile & { id: string; created_at: string }>("getProfileByUsername", res);
}

/** Mazzi pubblicati di un utente, dal più recente: quel che si vede sulla sua pagina pubblica. Con un errore lancia. */
export async function listDecksByOwner(userId: string, limit = 50): Promise<CommunityDeck[]> {
  const client = supabasePublic();
  if (!client) return [];
  const res = await readWithTranslations(
    DECK_SELECT,
    (sel) => client.from("community_decks").select(sel).eq("owner", userId).eq("status", PUBLISHED).order("created_at", { ascending: false }).limit(limit),
    ["translations", "art", "version"],
  );
  return withRatings(client, rowsOrThrow<CommunityDeck>("listDecksByOwner", res));
}

type UserRow = { updated_at: string; profile: { username: string | null } | null };

/**
 * Nomi utente delle pagine profilo da mettere in sitemap: chi ha almeno un mazzo pubblicato, una tier list salvata o
 * una guida della community pubblicata, la stessa regola del noindex della pagina (`profileIndexable` in
 * deckQuality.ts, 25/09/2026: prima c'erano solo i profili con un mazzo; le guide dal 27/09/2026).
 * La data è la più recente fra mazzi, tier list e guide. Con un errore lancia: la sitemap resta quella di prima. La
 * tabella delle guide che non c'è ancora (migrazione del pacchetto GUIDE non applicata) vale "nessuna guida".
 */
export async function listPublicProfiles(): Promise<{ username: string; updated_at: string }[]> {
  const client = supabasePublic();
  if (!client) return [];
  const [decks, tiers, guides] = await Promise.all([
    client
      .from("community_decks")
      .select("updated_at, profile:profiles!community_decks_owner_fkey(username)")
      .eq("status", PUBLISHED)
      .order("updated_at", { ascending: false })
      .limit(500),
    client
      .from("tier_lists")
      .select("updated_at, profile:profiles!tier_lists_owner_fkey(username)")
      .eq("status", PUBLISHED)
      .order("updated_at", { ascending: false })
      .limit(1000),
    client
      .from("community_guides")
      .select("updated_at, profile:profiles!community_guides_owner_fkey(username)")
      .eq("status", PUBLISHED)
      .order("updated_at", { ascending: false })
      .limit(1000),
  ]);
  const guideRows = guideTableMissing(guides.error) ? [] : rowsOrThrow<UserRow>("listPublicProfiles (guide)", guides);
  const rows = [...rowsOrThrow<UserRow>("listPublicProfiles (mazzi)", decks), ...rowsOrThrow<UserRow>("listPublicProfiles (tier list)", tiers), ...guideRows];
  const latest = new Map<string, string>();
  for (const r of rows) {
    const u = r.profile?.username;
    if (u && (latest.get(u) ?? "") < r.updated_at) latest.set(u, r.updated_at);
  }
  return Array.from(latest, ([username, updated_at]) => ({ username, updated_at })).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

/**
 * I mazzi per la sitemap (`sitemapDecks` in deckQuality.ts, con test): `decks` sono i mazzi da elencare, ognuno con le
 * lingue in cui la scheda si indicizza (quella dell'autore più le traduzioni aggiornate, 25/09/2026, e solo se la guida
 * supera la soglia di parole); `latest` è la data dell'ultimo mazzo pubblicato o modificato, anche sotto soglia, per il
 * lastmod di /decks e delle tier list, che mostrano tutti i mazzi. Con un errore lancia.
 */
export async function listPublishedDeckIndex(): Promise<{ decks: SitemapDeck[]; latest?: string }> {
  const client = supabasePublic();
  if (!client) return { decks: [] };
  const res = await readWithTranslations("slug, updated_at, guide", (sel) =>
    client.from("community_decks").select(sel).eq("status", PUBLISHED).order("created_at", { ascending: false }).limit(1000),
  );
  const rows = rowsOrThrow<{ slug: string; updated_at: string; guide: Guide; translations?: DeckTranslations | null }>("listPublishedDeckIndex", res);
  return sitemapDecks(rows, locales);
}

/**
 * Le versioni di prima delle carte di un mazzo (blocco VERSIONI, 30/09/2026), dalla più recente, ognuna con la media dei
 * voti che aveva (i voti restano in deck_votes con la loro `version`). Vuoto se il mazzo non è mai cambiato o se la
 * migrazione non c'è ancora (tabella o colonna mancante); con un altro errore lancia, come le altre letture pubbliche.
 */
export async function listDeckVersions(deckId: string): Promise<DeckVersion[]> {
  const client = supabasePublic();
  if (!client) return [];
  const res = await client
    .from("community_deck_versions")
    .select("version, legendary, cards, custom_cards, code_om, started_at, ended_at")
    .eq("deck_id", deckId)
    .order("version", { ascending: false })
    .limit(50);
  if (versionsMissing(res.error)) return [];
  const rows = rowsOrThrow<Omit<DeckVersion, "rating">>("listDeckVersions", res);
  if (!rows.length) return [];
  const votes = await client.from("deck_votes").select("version, stars").eq("deck_id", deckId).lte("version", rows[0].version).limit(10000);
  const ratings = versionRatings(rowsOrThrow<{ version: number; stars: number }>("listDeckVersions (voti)", votes));
  return rows.map((r) => ({ ...r, rating: ratings.get(r.version) ?? { avg: 0, votes: 0 } }));
}

/** Tabella delle versioni o colonna `version` dei voti non ancora nel database (blocco VERSIONI non applicato). */
export function versionsMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /community_deck_versions|\bversion\b|cards_updated_at/.test(error.message ?? "") && /does not exist|could not find/i.test(error.message ?? "");
}
