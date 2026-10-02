import { MEDIA_FILE_RE, UUID_RE, mediaPublicUrl } from "./profileMedia";
import { canUseDeckArt } from "./badges";

/**
 * Artwork della Leggendaria di un mazzo (29/09/2026, Pierluigi: "diamo la possibilità [ai creator] quando sviluppano un
 * deck di sostituire l'artwork della leggendaria per quel deck così da caratterizzare il loro lavoro … solo per i creator
 * e con le misure per sostituire l'artwork della carta"). Il file lo carica il browser nel bucket `profile-media`, nella
 * cartella `<id>/deck/` del proprietario (mai attraverso le Server Action), e il mazzo ne salva il percorso in
 * `community_decks.art_path`. Le stesse regole stanno nel blocco IMMAGINI di supabase/schema.sql (vincolo
 * `community_decks_art_path_check`, trigger `guard_deck_art`, policy del bucket): deckArt.test.ts le confronta.
 *
 * L'artwork prende il posto dell'illustrazione ufficiale solo sul mazzo (scheda, elenchi, profilo, tier list); la carta
 * ufficiale resta nella scheda della carta e nell'anteprima al passaggio del mouse. Funzioni pure: `node --test` le esegue.
 */

/** Cartella del bucket con gli artwork dei mazzi. */
export const DECK_ART_FOLDER = "deck";
/** Misura consigliata: le proporzioni delle carte del gioco (5:7), il doppio della carta intera più grande del sito. */
export const DECK_ART_SIZE = { width: 750, height: 1050 } as const;
/** Misura minima consigliata: sotto, sulla scheda del mazzo e sugli schermi densi si vede sgranato. */
export const DECK_ART_MIN = { width: 480, height: 672 } as const;
/** Proporzioni del ritaglio al centro fatto dal browser prima del caricamento. */
export const DECK_ART_ASPECT = DECK_ART_SIZE.width / DECK_ART_SIZE.height;
/** Peso massimo, uguale al limite del bucket e al controllo del trigger. */
export const DECK_ART_MAX_BYTES = 2 * 1024 * 1024;

const ANY_OWNER_PATH = new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/${DECK_ART_FOLDER}/${MEDIA_FILE_RE}$`);

/**
 * Il percorso di un artwork è nella cartella dei mazzi di un utente (`<id>/deck/<file>`, al massimo 200 caratteri) e, con
 * `owner`, di QUEL proprietario. Senza `owner` basta una cartella valida: la Server Action di modifica non conosce il
 * proprietario prima di scrivere, e il vincolo del database vuole comunque la sua cartella.
 */
export function deckArtPathOk(path: unknown, owner?: string): path is string {
  if (typeof path !== "string" || path.length > 200 || !ANY_OWNER_PATH.test(path)) return false;
  return owner === undefined || (UUID_RE.test(owner) && path.startsWith(`${owner}/`));
}

/**
 * Mazzi con l'artwork sospeso dallo staff: il sito mostra la carta ufficiale, il file e `art_path` restano (basta togliere
 * lo slug per rimetterlo). Il Merlin di Vega, sospeso il 01/10/2026 in attesa dei permessi, è tornato online il 02/10/2026.
 */
export const DECK_ART_HIDDEN: ReadonlySet<string> = new Set<string>([]);

/**
 * L'indirizzo dell'artwork da mostrare per un mazzo, o null: serve un percorso valido nella cartella del proprietario e un
 * proprietario che OGGI è Creator o Staff (chi perde il ruolo torna alla carta ufficiale senza perdere il file; le
 * letture pubbliche portano il tag, non il ruolo di admin). `base` = URL del progetto Supabase (src/lib/supabase/env.ts).
 */
export function deckArtUrl(deck: { owner: string; slug?: string; art_path?: string | null; profile?: { badge?: string | null } | null }, base: string): string | null {
  if (deck.slug && DECK_ART_HIDDEN.has(deck.slug)) return null;
  if (!canUseDeckArt(deck.profile?.badge) || !deckArtPathOk(deck.art_path, deck.owner)) return null;
  return mediaPublicUrl(base, deck.art_path);
}

/**
 * Il campo `art_path` del modulo di pubblicazione: `undefined` se il modulo non l'aveva (chi non ha il ruolo, o lo staff
 * che corregge un mazzo altrui: l'artwork resta com'è), `null` per tornare alla carta ufficiale, il percorso se valido;
 * `false` per un valore che non è un percorso ammesso.
 */
export function readDeckArtField(raw: unknown): string | null | undefined | false {
  if (raw === null || raw === undefined) return undefined;
  const value = String(raw).trim();
  if (!value) return null;
  return deckArtPathOk(value) ? value : false;
}

/**
 * La colonna `art_path` non c'è ancora (codice online prima della migrazione del blocco IMMAGINI): PostgREST risponde
 * PGRST204 ("Could not find the 'art_path' column…"), Postgres 42703.
 */
export function missingArtColumn(error: { code?: string; message?: string } | null | undefined): boolean {
  return Boolean(error && (error.code === "PGRST204" || error.code === "42703") && /\bart_path\b/.test(error.message ?? ""));
}

/** Errore del trigger `guard_deck_art` (ruolo mancante o file assente) → codice del modulo. */
export function deckArtErrorCode(error: { message?: string } | null | undefined): "artRole" | "artFile" | null {
  const m = error?.message ?? "";
  if (m.includes("deck_art_role")) return "artRole";
  if (m.includes("deck_art_file") || m.includes("community_decks_art_path_check")) return "artFile";
  return null;
}
