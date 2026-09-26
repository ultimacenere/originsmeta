/**
 * Strumenti per le dirette (pacchetto STREAM, richiesta di Pierluigi del 26/09/2026: funzioni per i creator, il primo
 * è coachcrono su Twitch). Quattro strumenti, tutti sui mazzi pubblicati della community e senza account:
 *
 *   1. link breve  originsmeta.com/d/<slug>   → /<lingua del browser>/decks/community/<slug>, con gli UTM delle dirette
 *                                                (utm_source=stream, utm_medium=shortlink): src/app/d/[slug]/route.ts
 *   2. comando di chat  /api/chat/deck?u=<nome>[&lang=it]  oppure  ?deck=<slug>: una riga di testo semplice sotto i
 *                                                400 caratteri per Nightbot, StreamElements e Fossabot
 *                                                (src/app/api/chat/deck/route.ts)
 *   3. overlay per OBS  /overlay/deck/<slug>  e  /overlay/deck?u=<nome>  (?layout=vertical|horizontal, ?lang=): pagina
 *                                                trasparente senza il layout del sito, aggiornata ogni 60 s
 *                                                (src/app/overlay/…)
 *   4. immagine del mazzo  /api/deck-image/<slug>?format=og|16x9|9x16&lang=it  (next/og): miniature, post e og:image
 *                                                della scheda del mazzo (src/app/api/deck-image/[slug]/route.tsx)
 *
 * Il "codice corto" del mazzo è lo slug (niente tabelle nuove). Qui stanno le regole, in funzioni pure senza import a
 * runtime (solo tipi): le prova `node --test src/lib/stream.test.ts`. Le etichette nelle tre lingue sono in
 * `streamLabels.ts`, le letture del database in `src/lib/community/streamDecks.ts`.
 */

/* ---------- indirizzi ---------- */

/** Host mostrato nei testi (chat, overlay, immagine): il link si legge meglio senza "https://", e Twitch lo rende cliccabile. */
export function displayHost(site: string): string {
  return site.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/**
 * Slug di un mazzo della community (`newSlug` in util.ts: nome ridotto a lettere minuscole, cifre e trattini, più
 * quattro caratteri casuali). Controllo di forma prima di una lettura o di un redirect: niente barre, punti o spazi.
 */
export function isDeckSlug(raw: unknown): raw is string {
  return typeof raw === "string" && raw.length <= 90 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(raw);
}

/**
 * Nome utente di OriginsMeta scritto da uno streamer nel link del comando o dell'overlay: senza "@", in minuscolo
 * (il trigger `handle_new_user` li crea così: lettere minuscole, cifre e trattini). null se la forma non torna.
 */
export function normalizeUsername(raw: string | null | undefined): string | null {
  const u = (raw ?? "").trim().replace(/^@+/, "").toLowerCase();
  return u.length <= 80 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(u) ? u : null;
}

/** Una lingua del sito dal parametro `lang` (en, it, es; anche "it-IT"); altrimenti `fallback`. */
export function pickLang<L extends string>(raw: string | null | undefined, supported: readonly L[], fallback: L): L {
  const base = (raw ?? "").trim().toLowerCase().split(/[-_]/)[0];
  return (supported as readonly string[]).includes(base) ? (base as L) : fallback;
}

/** Il primo valore di un parametro di `searchParams` di una pagina (stringa, elenco o assente). */
export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Gli UTM che il link breve aggiunge quando il link non ne porta di suoi. */
export const STREAM_UTM = { utm_source: "stream", utm_medium: "shortlink" } as const;

/**
 * Destinazione del link breve /d/<slug>: la scheda del mazzo nella lingua scelta, con gli UTM delle dirette. Gli UTM
 * scritti nel link vincono su quelli di default e passano tutti (un creator può scrivere /d/<slug>?utm_source=youtube
 * nella descrizione di un video); gli altri parametri si scartano. Di ogni parametro vale il primo valore.
 */
export function shortLinkTarget(locale: string, slug: string, incoming: URLSearchParams): string {
  const utm = new Map<string, string>(Object.entries(STREAM_UTM));
  const seen = new Set<string>();
  for (const [k, v] of incoming) {
    if (!/^utm_[a-z_]{1,30}$/.test(k) || seen.has(k)) continue;
    seen.add(k);
    const value = v.trim().slice(0, 100);
    if (value) utm.set(k, value);
  }
  return `/${locale}/decks/community/${slug}?${new URLSearchParams([...utm]).toString()}`;
}

/** Link breve completo (da copiare) e da mostrare (senza protocollo). */
export function shortLinkUrl(site: string, slug: string): string {
  return `${site.replace(/\/+$/, "")}/d/${slug}`;
}

/* ---------- comando di chat ---------- */

/** Limite della risposta: Nightbot taglia oltre i 400 caratteri, StreamElements e Twitch ne accettano 500. */
export const CHAT_MAX = 400;

/**
 * Testo scritto da un utente (nome del mazzo, nome dell'autore) pronto per la chat di Twitch: una riga, niente
 * caratteri di controllo né invisibili, niente variabili dei bot (`$(…)`, `${…}`) e niente comandi in testa (una
 * risposta che comincia con "/" o "." Twitch la leggerebbe come un comando del bot, che è moderatore), al massimo
 * `max` caratteri con l'ellissi.
 */
export function chatSafe(text: string, max = 60): string {
  let t = String(text ?? "")
    // controlli (Cc) e formato (Cf: a capo invisibili, direzione del testo, spazi larghi zero, trattino morbido)
    .replace(/[\p{Cc}\p{Cf}]/gu, " ")
    .replace(/\$\s*[({]/g, "$ ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[/.\\!]+\s*/, "")
    .trim();
  if (t.length > max) t = `${t.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
  return t;
}

/** Sostituisce i segnaposto {nome} senza interpretare i `$` del testo (i nomi li scrivono gli utenti). */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (Object.hasOwn(values, key) ? values[key] : m));
}

export type ChatDeck = { name: string; author: string; slug: string; legendary?: string | null; gameCode?: string | null };
export type ChatLabels = { line: string; legendary: string; code: string };

/**
 * La riga del comando !deck: "Mazzo di coachcrono: Spellcast (Leggendaria: Merlin) → originsmeta.com/d/spellcast-ab12
 * · Codice del gioco: KGBLDC…". Il codice del gioco c'è solo se tutto sta in `max` caratteri (un codice di 13 carte è
 * lungo circa 190); altrimenti resta il link, che porta al tasto "Copia codice del gioco" della scheda.
 */
export function chatLine(deck: ChatDeck, labels: ChatLabels, host: string, max = CHAT_MAX): string {
  const head = fill(labels.line, { author: chatSafe(deck.author, 40) || "player", deck: chatSafe(deck.name, 60) || deck.slug });
  const legendary = deck.legendary ? chatSafe(deck.legendary, 40) : "";
  const base = `${head}${legendary ? ` (${labels.legendary}: ${legendary})` : ""} → ${host}/d/${deck.slug}`;
  const code = deck.gameCode && /^KGBLDC[A-Za-z0-9+/=]+:[0-9a-f]{8}$/.test(deck.gameCode) ? deck.gameCode : null;
  const full = code ? `${base} · ${labels.code}: ${code}` : base;
  if (full.length <= max) return full;
  return base.length <= max ? base : `${base.slice(0, max - 1)}…`;
}

/** Indirizzo del comando di chat: per un utente (il suo ultimo mazzo) o per un mazzo preciso. */
export function chatEndpoint(site: string, target: { user: string } | { deck: string }, lang: string): string {
  const q = "user" in target ? `u=${encodeURIComponent(target.user)}` : `deck=${encodeURIComponent(target.deck)}`;
  return `${site.replace(/\/+$/, "")}/api/chat/deck?${q}&lang=${encodeURIComponent(lang)}`;
}

/**
 * I comandi pronti da incollare nella chat (da proprietario del canale o moderatore) o nella dashboard del bot.
 * Nightbot: `$(urlfetch URL)`; StreamElements: `${customapi.URL}`; Fossabot: `$(customapi URL)` come risposta di un
 * comando creato dalla dashboard.
 */
export function botCommands(url: string, trigger = "!deck"): { nightbot: string; streamelements: string; fossabot: string } {
  return {
    nightbot: `!commands add ${trigger} $(urlfetch ${url})`,
    streamelements: `!command add ${trigger} \${customapi.${url}}`,
    fossabot: `$(customapi ${url})`,
  };
}

/* ---------- overlay per OBS ---------- */

export type OverlayLayout = "vertical" | "horizontal";

/** Orientamento dell'overlay dal parametro `layout` (anche h, v, landscape, portrait); verticale di default. */
export function overlayLayout(raw: string | null | undefined): OverlayLayout {
  const v = (raw ?? "").trim().toLowerCase();
  return ["horizontal", "h", "landscape", "row", "orizzontale", "horizontal-strip"].includes(v) ? "horizontal" : "vertical";
}

/** Indirizzo dell'overlay di un mazzo preciso o dell'ultimo mazzo di un utente (`?u=`). */
export function overlayUrl(site: string, target: { deck: string } | { user: string }, layout: OverlayLayout, lang: string): string {
  const base = site.replace(/\/+$/, "");
  const query = `layout=${layout}&lang=${encodeURIComponent(lang)}`;
  return "deck" in target ? `${base}/overlay/deck/${target.deck}?${query}` : `${base}/overlay/deck?u=${encodeURIComponent(target.user)}&${query}`;
}

/** Misura consigliata della sorgente browser in OBS per ogni orientamento (larghezza × altezza, in pixel). */
export const OVERLAY_SIZE: Record<OverlayLayout, { width: number; height: number }> = {
  vertical: { width: 360, height: 1000 },
  horizontal: { width: 1600, height: 300 },
};

/** Secondi fra un aggiornamento e l'altro dell'overlay (la pagina rilegge il mazzo senza ricaricarsi). */
export const OVERLAY_REFRESH_SECONDS = 60;

/* ---------- lista delle carte ---------- */

export type ListCard = { name: string; mana?: number; custom?: boolean };

/** Carte del mazzo per costo (le carte senza costo noto in fondo), poi per nome: l'ordine del gioco e della scheda. */
export function sortByCost<T extends ListCard>(cards: readonly T[]): T[] {
  return [...cards].sort((a, b) => (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name, "en"));
}

/** Divide una lista in `columns` colonne consecutive (la prima riceve le carte in più): 12 carte in 2 colonne da 6. */
export function splitColumns<T>(list: readonly T[], columns: number): T[][] {
  const n = Math.max(1, Math.floor(columns));
  const size = Math.ceil(list.length / n);
  const out: T[][] = [];
  for (let i = 0; i < n; i++) out.push(list.slice(i * size, (i + 1) * size));
  return out;
}

/* ---------- immagine del mazzo ---------- */

/** Formati dell'immagine: og per l'anteprima social della scheda, 16:9 per le miniature, 9:16 per storie e short. */
export const DECK_IMAGE_FORMATS = {
  og: { width: 1200, height: 630 },
  "16x9": { width: 1280, height: 720 },
  "9x16": { width: 1080, height: 1920 },
} as const;
export type DeckImageFormat = keyof typeof DECK_IMAGE_FORMATS;

/** Formato dal parametro `format` (anche 16:9, 9:16, story, thumbnail); og di default. */
export function deckImageFormat(raw: string | null | undefined): DeckImageFormat {
  const v = (raw ?? "").trim().toLowerCase().replace(":", "x");
  if (v === "16x9" || v === "thumbnail" || v === "youtube" || v === "landscape") return "16x9";
  if (v === "9x16" || v === "story" || v === "vertical" || v === "portrait") return "9x16";
  return "og";
}

/**
 * Versione dell'immagine dalla data dell'ultima modifica del mazzo (in base 36): entra nell'indirizzo, così la cache
 * lunga della CDN e quella di Discord e X si rinnovano quando l'autore cambia il mazzo. Senza data valida: "".
 */
export function imageVersion(updatedAt: string | null | undefined): string {
  const t = Date.parse(updatedAt ?? "");
  return Number.isFinite(t) ? Math.floor(t / 1000).toString(36) : "";
}

/** Indirizzo (relativo al sito) dell'immagine del mazzo; `download` la fa scaricare con un nome di file. */
export function deckImagePath(slug: string, format: DeckImageFormat, lang: string, version?: string, download = false): string {
  const q = new URLSearchParams({ format, lang });
  if (version) q.set("v", version);
  if (download) q.set("download", "1");
  return `/api/deck-image/${slug}?${q.toString()}`;
}

/**
 * L'og:image della scheda di un mazzo: l'immagine 1200×630 nella lingua della pagina, con la versione dalla data di
 * modifica (anteprima aggiornata su Discord e X dopo una modifica del mazzo) e le sue misure.
 */
export function deckOgImage(slug: string, updatedAt: string, lang: string): { url: string; width: number; height: number } {
  return { url: deckImagePath(slug, "og", lang, imageVersion(updatedAt)), ...DECK_IMAGE_FORMATS.og };
}

/** Testo alternativo dell'immagine del mazzo (descrive l'immagine): con la Leggendaria se c'è. */
export function deckImageAlt(labels: { alt: string; altNoLegendary: string }, v: { deck: string; author: string; legendary?: string | null }): string {
  return v.legendary ? fill(labels.alt, { deck: v.deck, legendary: v.legendary, author: v.author }) : fill(labels.altNoLegendary, { deck: v.deck, author: v.author });
}

/** Nome del file scaricato: originsmeta-<slug>-16x9.png. */
export function deckImageFilename(slug: string, format: DeckImageFormat): string {
  return `originsmeta-${slug}-${format}.png`;
}

/**
 * Le intestazioni di cache dell'immagine. Con la versione nell'indirizzo l'immagine non cambia più: cache lunga (un
 * giorno in CDN, una settimana servita mentre si rigenera). Senza versione (un link scritto a mano) solo dieci minuti,
 * perché il mazzo può cambiare. Sostituiscono quelle di default di next/og (un anno, "immutable").
 */
export function deckImageCacheControl(versioned: boolean): string {
  return versioned ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" : "public, max-age=300, s-maxage=600, stale-while-revalidate=3600";
}
