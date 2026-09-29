import Anthropic from "@anthropic-ai/sdk";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { locales, type Locale } from "@/lib/i18n";
import { indexNowEnabled, submitIndexNow } from "@/lib/indexnow";
import { revalidateSitemaps } from "@/lib/sitemapData";
import type { Db } from "@/lib/supabase/public";
import { TRANSLATION_MODEL, namesIn, translateDocWith } from "./deckTranslation";
import { officialNames, translationEnabled } from "./translate";
import { translationMaxTokens } from "./guides";
import {
  COMIC_TRANSLATION_SYSTEM,
  comicHash,
  comicIndexing,
  comicPath,
  comicTextFromDoc,
  comicTranslationDoc,
  missingComicLocales,
  storedEditions,
  storedPages,
  type ComicEditions,
  type ComicPage,
  type ComicTranslation,
  type ComicTranslations,
} from "./comics";
import { editionsColumnMissing } from "./comicQueries";

/**
 * Traduzione automatica dei testi di un fumetto (pacchetto FUMETTI, 29/09/2026), come le guide della community
 * (guideTranslate.ts, stesse regole): dopo la pubblicazione o la modifica di un fumetto pubblicato, titolo, presentazione
 * e testi delle tavole si traducono nelle altre lingue del sito con lo stesso modello, la stessa chiave
 * (ANTHROPIC_API_KEY: senza, nulla) e lo stesso glossario; nomi di carte e luoghi e i balloon disegnati restano come sono.
 *
 * - parte dopo la risposta al browser (`after()`, pagine di scrittura con `maxDuration = 120`), una richiesta per lingua
 *   (i testi di un fumetto sono corti: 300 + 10 × 1500 caratteri al massimo), e scrive con la sessione del proprietario;
 * - traduce solo le lingue che mancano o che sono rimaste indietro rispetto al testo;
 * - prima di scrivere rilegge il fumetto: se nel frattempo è cambiato, o non è più pubblicato, lascia perdere;
 * - nessuna eccezione verso chi pubblica: senza traduzione la pagina mostra i testi originali con la nota ed è noindex
 *   in quella lingua, fuori da hreflang e sitemap;
 * - una lingua con la versione disegnata dall'autore (colonna `editions`, 30/09/2026) non si traduce: la pagina in
 *   quella lingua mostra la versione disegnata.
 */

type Row = { lang: Locale; title: string; summary: string; pages: ComicPage[]; translations: ComicTranslations | null; editions: ComicEditions; status: string; slug: string };

const ROW_COLUMNS = "lang, title, summary, pages, translations, status, slug, owner";

async function readRow(supabase: Db, comicId: string): Promise<Row | null> {
  const read = (columns: string) => supabase.from("community_comics").select(columns).eq("id", comicId).maybeSingle();
  let res = await read(`${ROW_COLUMNS}, editions`);
  // prima della migrazione del 30/09/2026 la colonna delle versioni disegnate non c'è: si legge senza
  if (editionsColumnMissing(res.error)) res = await read(ROW_COLUMNS);
  if (res.error || !res.data) return null;
  const raw = res.data as unknown as { lang: Locale; title: string; summary: string; pages: unknown; translations: unknown; editions?: unknown; status: string; slug: string; owner: string };
  const translations = raw.translations && typeof raw.translations === "object" && !Array.isArray(raw.translations) ? (raw.translations as ComicTranslations) : null;
  return {
    lang: raw.lang,
    title: raw.title,
    summary: raw.summary,
    pages: storedPages(raw.pages, raw.owner),
    translations,
    editions: storedEditions(raw.editions, raw.owner, raw.lang),
    status: raw.status,
    slug: raw.slug,
  };
}

/** Traduce il fumetto nelle lingue che mancano e salva il risultato. Restituisce le lingue scritte. */
export async function translateComic(supabase: Db, comicId: string): Promise<Locale[]> {
  const row = await readRow(supabase, comicId);
  if (!row || row.status !== "published" || !row.summary) return [];
  const targets = missingComicLocales(row, locales);
  if (!targets.length) return [];

  const hash = comicHash(row);
  const doc = comicTranslationDoc(row);
  const names = namesIn(doc, officialNames);
  const client = new Anthropic({ maxRetries: 1 });
  const results = await Promise.all(
    targets.map(async (to): Promise<[Locale, ComicTranslation] | null> => {
      try {
        const r = await translateDocWith(client, doc, row.lang, to, names, COMIC_TRANSLATION_SYSTEM, { maxTokens: translationMaxTokens(doc) });
        const comic = r ? comicTextFromDoc(r.doc, row) : null;
        return comic ? [to, { hash, at: new Date().toISOString(), model: r?.model ?? TRANSLATION_MODEL, comic }] : null;
      } catch (e) {
        console.error(`[comics] traduzione ${row.lang}→${to} non riuscita:`, e instanceof Error ? e.message : e);
        return null;
      }
    }),
  );
  const done = Object.fromEntries(results.filter((r): r is [Locale, ComicTranslation] => r !== null)) as ComicTranslations;
  const written = Object.keys(done) as Locale[];
  if (!written.length) return [];

  // Rilettura: se il fumetto è cambiato (o non è più pubblicato) mentre traducevamo, queste traduzioni non servono.
  const fresh = await readRow(supabase, comicId);
  if (!fresh || fresh.status !== "published" || comicHash(fresh) !== hash) return [];
  const next: ComicTranslations = { ...(fresh.translations ?? {}), ...done };
  delete next[fresh.lang];
  const { error } = await supabase.from("community_comics").update({ translations: next }).eq("id", comicId);
  if (error) {
    console.error("[comics] salvataggio delle traduzioni non riuscito:", error.message);
    return [];
  }
  // la presentazione tradotta compare nelle news e nella home di quella lingua
  const paths = locales.flatMap((l) => [`/${l}${comicPath(fresh.slug)}`, `/${l}/news/comics`, `/${l}/news`, `/${l}`]);
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // fuori dalla richiesta la pagina si aggiorna comunque da sola (ISR)
    }
  }
  revalidateSitemaps();
  const withNext = { ...fresh, translations: next };
  const ping = written.filter((l) => !comicIndexing(withNext, locales, l).noindex);
  if (indexNowEnabled() && ping.length) await submitIndexNow(ping.map((l) => `/${l}${comicPath(fresh.slug)}`));
  return written;
}

/** Da chiamare dopo la pubblicazione o la modifica di un fumetto pubblicato. Senza chiave non fa nulla. */
export function translateComicLater(supabase: Db, comicId: string): void {
  if (!translationEnabled()) return;
  const job = async () => {
    try {
      await translateComic(supabase, comicId);
    } catch (e) {
      console.error("[comics] traduzione del fumetto non riuscita:", e instanceof Error ? e.message : e);
    }
  };
  try {
    after(job);
  } catch {
    void job();
  }
}
