import Anthropic from "@anthropic-ai/sdk";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { locales, type Locale } from "@/lib/i18n";
import { indexNowEnabled, submitIndexNow } from "@/lib/indexnow";
import { revalidateSitemaps } from "@/lib/sitemapData";
import type { Db } from "@/lib/supabase/public";
import { namesIn, translateDocWith, type TranslationDoc } from "./deckTranslation";
import { officialNames, translationEnabled } from "./translate";
import {
  DECK_SET_TRANSLATION_SYSTEM,
  deckSetGuideHash,
  deckSetGuideText,
  deckSetIndexableLocales,
  missingSetLocales,
  type DeckSetGuide,
  type DeckSetGuideText,
  type DeckSetTranslations,
} from "./deckSets";

/**
 * Traduzione automatica della guida dei Mazzi torneo (04/10/2026), come i mazzi singoli (translate.ts): dopo la risposta
 * al browser, con la sessione del proprietario, solo le lingue che mancano o sono rimaste indietro (impronta
 * `deckSetGuideHash`), rilettura prima di scrivere, mai un'eccezione verso chi pubblica. Senza ANTHROPIC_API_KEY non fa
 * nulla e la pagina mostra l'originale con la sua nota.
 */

type Row = { guide: DeckSetGuide; translations: DeckSetTranslations | null; status: string; slug: string };

async function readRow(supabase: Db, id: string): Promise<Row | null> {
  const { data, error } = await supabase.from("community_deck_sets").select("guide, translations, status, slug").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as unknown as Row;
}

/** Traduce la guida del trio nelle lingue che mancano e salva il risultato. Restituisce le lingue scritte. */
export async function translateDeckSet(supabase: Db, id: string): Promise<string[]> {
  const row = await readRow(supabase, id);
  if (!row || !row.guide?.summary) return [];
  const targets = missingSetLocales(row, locales);
  if (!targets.length) return [];

  const hash = deckSetGuideHash(row.guide);
  const text = deckSetGuideText(row.guide) as TranslationDoc;
  const names = namesIn(text, officialNames);
  const client = new Anthropic({ maxRetries: 1 });
  const results = await Promise.all(
    targets.map((to) =>
      translateDocWith(client, text, row.guide.lang, to, names, DECK_SET_TRANSLATION_SYSTEM).catch((e: unknown) => {
        console.error(`[deck-sets] traduzione ${row.guide.lang}→${to} non riuscita:`, e instanceof Error ? e.message : e);
        return null;
      }),
    ),
  );

  // Rilettura: se la guida è cambiata mentre traducevamo, queste traduzioni sono già vecchie.
  const fresh = await readRow(supabase, id);
  if (!fresh || deckSetGuideHash(fresh.guide) !== hash) return [];
  const next: DeckSetTranslations = { ...(fresh.translations ?? {}) };
  delete next[fresh.guide.lang];
  const written: Locale[] = [];
  targets.forEach((to, i) => {
    const r = results[i];
    if (!r) return;
    next[to] = { hash, at: new Date().toISOString(), model: r.model, guide: r.doc as DeckSetGuideText };
    written.push(to);
  });
  if (!written.length) return [];
  const { error } = await supabase.from("community_deck_sets").update({ translations: next }).eq("id", id);
  if (error) {
    console.error("[deck-sets] salvataggio delle traduzioni non riuscito:", error.message);
    return [];
  }
  for (const l of locales) {
    try {
      revalidatePath(`/${l}/decks/tournament/${fresh.slug}`);
      revalidatePath(`/${l}/decks/tournament`);
    } catch {
      // fuori dalla richiesta la pagina si aggiorna comunque da sola (ISR)
    }
  }
  if (fresh.status === "published") {
    revalidateSitemaps();
    const indexable = new Set(deckSetIndexableLocales({ ...fresh, translations: next }, locales));
    const ping = written.filter((l) => indexable.has(l));
    if (indexNowEnabled() && ping.length) await submitIndexNow(ping.map((l) => `/${l}/decks/tournament/${fresh.slug}`));
  }
  return written;
}

/** Da chiamare dopo la pubblicazione o la modifica: traduce dopo la risposta al browser. Senza chiave non fa nulla. */
export function translateDeckSetLater(supabase: Db, id: string): void {
  if (!translationEnabled()) return;
  const job = async () => {
    try {
      await translateDeckSet(supabase, id);
    } catch (e) {
      console.error("[deck-sets] traduzione della guida non riuscita:", e instanceof Error ? e.message : e);
    }
  };
  try {
    after(job);
  } catch {
    void job();
  }
}
