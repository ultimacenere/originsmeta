import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternatesFor, getDictionary, isLocale, ogLocale, siteUrl, type Dictionary, type Locale } from "./i18n";

export type LocaleParams = Promise<{ locale: string }>;

/** Immagine social di riserva quando la pagina non ne ha una propria (1200×630, la key art ufficiale). */
export const defaultOgImage = "/media/og.jpg";

/** Dimensioni reali di `defaultOgImage`: le dichiariamo perché i social non debbano scaricarla per sapere come impaginarla. */
const defaultOgSize = { width: 1200, height: 630 };

/** Testo alternativo di `defaultOgImage` (descrive l'immagine, non la pagina). Lo usa anche il layout. */
export const defaultOgAlt: Record<Locale, string> = {
  en: "Origins TCG key art: a blonde heroine among cards flying across a pink and purple background, next to the Origins Trading Card Game logo.",
  it: "Key art di Origins TCG: un'eroina bionda tra le carte in volo su uno sfondo rosa e viola, accanto al logo Origins Trading Card Game.",
  es: "Key art de Origins TCG: una heroína rubia entre cartas que vuelan sobre un fondo rosa y morado, junto al logo de Origins Trading Card Game.",
};

/** Oltre i ~160 caratteri Google taglia lo snippet: teniamo un margine. */
export const DESCRIPTION_MAX = 158;

/** Oltre i ~60 caratteri Google taglia il titolo in SERP: è il limite entro cui deve stare il titolo finale. */
export const TITLE_MAX = 60;

/** Separatore dei titoli, uguale ovunque (il template del layout usa lo stesso). */
const SEP = " · ";

/**
 * Titolo finale della pagina: unico punto di verità.
 *
 * Perché esiste: prima il titolo nasceva in due posti che non si parlavano — qui veniva aggiunto
 * "· Origins TCG" e il template del layout (`title.template` in `[locale]/layout.tsx`) aggiungeva
 * "· OriginsMeta". Risultato: titoli da 80 caratteri, con "Origins TCG" ripetuto, tagliati in SERP.
 * Da qui in poi il titolo lo calcola solo questa funzione e `pageMeta` lo restituisce come
 * `title: { absolute }`, forma che disattiva il template: il layout resta com'è, semplicemente
 * non si applica più. Chi scrive una pagina nuova non deve aggiungere nessun marchio a mano.
 *
 * La regola, in ordine:
 *  1. se il titolo contiene già "Origins TCG" o "OriginsMeta", resta com'è (niente marchio doppio);
 *  2. altrimenti riceve " · Origins TCG", che è la parola chiave con cui il sito vuole essere trovato;
 *  3. poi, se ancora non contiene "OriginsMeta" e il risultato finale sta entro TITLE_MAX caratteri,
 *     riceve anche " · OriginsMeta"; se non ci sta, il marchio si sacrifica prima della parola chiave.
 *
 * Quindi: un titolo che contiene già "Origins TCG" deve stare da solo entro 60 caratteri, uno che non
 * lo contiene entro 46 (46 + " · Origins TCG" = 60). Funzione pura: stesso titolo, stesso risultato.
 */
export function pageTitle(title: string): string {
  const trimmed = title.trim();
  const withKeyword = /origins tcg|originsmeta/i.test(trimmed) ? trimmed : `${trimmed}${SEP}Origins TCG`;
  if (/originsmeta/i.test(withKeyword)) return withKeyword;
  const withBrand = `${withKeyword}${SEP}OriginsMeta`;
  return withBrand.length <= TITLE_MAX ? withBrand : withKeyword;
}

/**
 * Titolo di una pagina il cui nome lo scrive un utente (mazzo della community, torneo): il nome può
 * essere lungo quanto vuole, quindi la coda ("· Mazzo della community", "· Tornei") si sacrifica prima
 * del nome, e se non basta il nome stesso viene accorciato all'ultima parola intera con l'ellissi.
 * Senza questo, un mazzo chiamato per esteso produce un titolo tagliato a metà da Google.
 */
export function pageTitleWith(name: string, suffix: string): string {
  const full = `${name.trim()}${SEP}${suffix}`;
  if (pageTitle(full).length <= TITLE_MAX) return full;
  if (pageTitle(name.trim()).length <= TITLE_MAX) return name.trim();
  // Resta solo il nome, ancora troppo lungo: lo tagliamo lasciando spazio al marchio che pageTitle aggiunge.
  const room = TITLE_MAX - `${SEP}Origins TCG`.length - 1;
  const cut = name.trim().slice(0, room);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length).trim()}…`;
}

/**
 * Ripulisce un testo qualsiasi (excerpt, piano di gioco di un mazzo, corpo di una guida) perché possa
 * fare da meta description: collassa spazi e a capo in uno spazio solo, toglie il marcatore di elenco
 * iniziale ("- ", "• ", "1. ") e, se resta più lungo di `max`, taglia all'ultimo confine di parola
 * aggiungendo l'ellissi, senza lasciare punteggiatura appesa.
 * Funzione pura: stesso testo in ingresso, stesso testo in uscita.
 */
export function cleanDescription(text: string, max: number = DESCRIPTION_MAX): string {
  const flat = text
    .replace(/\s+/g, " ")
    .replace(/^ ?(?:[-*•‣–—]|\d+[.)])\s+/, "")
    .trim();
  if (flat.length <= max) return flat;
  // max - 1 perché l'ellissi conta: il risultato non deve mai superare `max`.
  const cut = flat.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  // Se nel tratto tagliato non c'è uno spazio ragionevolmente avanti, tagliamo di netto (parole lunghissime).
  const head = space > (max - 1) * 0.6 ? cut.slice(0, space) : cut;
  return `${head.replace(/[\s,;:.!?…–—-]+$/, "")}…`;
}

export async function resolveLocale(params: LocaleParams): Promise<{ locale: Locale; dict: Dictionary }> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, dict: getDictionary(locale) };
}

export type PageMetaOptions = {
  type?: "website" | "article";
  published?: string;
  modified?: string;
  /**
   * Dimensioni reali dell'immagine social, quando la pagina ne passa una che non è 1200×630:
   * le copertine delle carte sono 1200×675, le illustrazioni delle carte sono verticali (480×690).
   * Senza questo dato non dichiariamo larghezza e altezza: un numero sbagliato farebbe impaginare
   * male l'anteprima, mentre l'assenza fa solo scaricare l'immagine al crawler.
   */
  imageSize?: { width: number; height: number };
  /** Testo alternativo dell'immagine social: descrive l'immagine, non la pagina. */
  imageAlt?: string;
  /**
   * Lingue in cui la pagina esiste davvero nella sua lingua, quando non sono tutte: gli hreflang elencano solo
   * quelle. Serve ai mazzi della community, la cui guida si legge nella lingua dell'autore e nelle traduzioni.
   */
  languages?: readonly Locale[];
  /** Versione da non indicizzare (resta navigabile e i link si seguono): per esempio una guida non ancora tradotta. */
  noindex?: boolean;
};

/**
 * Metadati di pagina: titolo finale calcolato da `pageTitle` e restituito come `title: { absolute }`
 * (così il template del layout non lo tocca più), descrizione normalizzata e accorciata,
 * canonical + hreflang, Open Graph e Twitter con immagine (di default og.jpg).
 * Le pagine passano il titolo "nudo": il marchio lo aggiunge `pageTitle`, mai il chiamante.
 */
export function pageMeta(locale: Locale, path: string, title: string, description: string, image?: string, opts: PageMetaOptions = {}): Metadata {
  const url = `${siteUrl}/${locale}${path}`;
  const fullTitle = pageTitle(title);
  const desc = cleanDescription(description);
  const img = image ?? defaultOgImage;
  // L'immagine di riserva la conosciamo: le sue misure si dichiarano anche quando la pagina la passa a mano.
  const size = opts.imageSize ?? (img === defaultOgImage ? defaultOgSize : undefined);
  const alt = opts.imageAlt ?? (image ? title : defaultOgAlt[locale]);
  const ogImage = { url: img, alt, ...size };
  const base = { title: fullTitle, description: desc, url, locale: ogLocale[locale], siteName: "OriginsMeta", images: [ogImage] };
  return {
    // `absolute`: il titolo è già completo, il template `%s · OriginsMeta` del layout non deve applicarsi.
    title: { absolute: fullTitle },
    description: desc,
    alternates: { canonical: url, ...alternatesFor(path, opts.languages) },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: opts.type === "article" ? { ...base, type: "article", publishedTime: opts.published, modifiedTime: opts.modified } : { ...base, type: "website" },
    twitter: { card: "summary_large_image", title: fullTitle, description: desc, images: [ogImage] },
  };
}
