import Anthropic from "@anthropic-ai/sdk";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { locales, type Locale } from "@/lib/i18n";
import { indexNowEnabled, submitIndexNow } from "@/lib/indexnow";
import { revalidateSitemaps } from "@/lib/sitemapData";
import type { Db } from "@/lib/supabase/public";
import { namesIn } from "./deckTranslation";
import { officialNames, saveTranslations, translationEnabled } from "./translate";
import { translateGuideText } from "./guideTranslateCore";
import {
  communityGuideHash,
  communityGuideIndexing,
  guideTranslationDoc,
  missingGuideLocales,
  storedSections,
  type CommunityGuideTranslations,
  type GuideSectionText,
} from "./guides";

/**
 * Traduzione automatica delle guide della community (pacchetto GUIDE, 27/09/2026), come le guide dei mazzi
 * (translate.ts, stesse regole): dopo la pubblicazione o la modifica di una guida pubblicata, titolo (dal 29/09/2026),
 * riassunto e sezioni si traducono nelle altre lingue del sito con lo stesso modello, la stessa chiave
 * (ANTHROPIC_API_KEY: senza, nulla) e lo stesso glossario delle parole chiave (`TRANSLATION_RULES`); i nomi di carte e
 * luoghi non si traducono.
 *
 * - parte dopo la risposta al browser (`after()`, pagine di scrittura con `maxDuration = 300`), scrive con la sessione
 *   del proprietario (policy di community_guides, colonna `translations` nella grant di update; il trigger controlla le
 *   regole del testo);
 * - traduce solo le lingue che mancano o che sono rimaste indietro rispetto al testo, e in quelle solo le parti
 *   cambiate, a pezzi (`translateGuideText` in guideTranslateCore.ts, lo stesso codice dello script degli arretrati);
 * - prima di scrivere rilegge la guida: se nel frattempo l'autore l'ha cambiata la traduzione è vecchia e si lascia
 *   perdere (ci pensa il giro partito con la modifica); se non è più pubblicata non si scrive;
 * - nessuna eccezione verso chi pubblica: senza traduzione la pagina mostra l'originale con la nota ed è noindex in quella
 *   lingua, fuori da hreflang e sitemap. Gli arretrati e i nuovi tentativi: `node scripts/translate-guides.mjs`.
 */

type Row = { lang: Locale; title: string; summary: string; sections: GuideSectionText[]; translations: CommunityGuideTranslations | null; status: string; slug: string };

async function readRow(supabase: Db, guideId: string): Promise<Row | null> {
  const { data, error } = await supabase.from("community_guides").select("lang, title, summary, sections, translations, status, slug").eq("id", guideId).maybeSingle();
  if (error || !data) return null;
  const raw = data as unknown as Omit<Row, "sections" | "translations"> & { sections: unknown; translations: unknown };
  const translations = raw.translations && typeof raw.translations === "object" && !Array.isArray(raw.translations) ? (raw.translations as CommunityGuideTranslations) : null;
  return { ...raw, sections: storedSections(raw.sections), translations };
}

/** Traduce la guida nelle lingue che mancano e salva il risultato. Restituisce le lingue scritte. */
export async function translateCommunityGuide(supabase: Db, guideId: string): Promise<string[]> {
  const row = await readRow(supabase, guideId);
  if (!row || row.status !== "published" || !row.summary || !row.sections.length) return [];
  const targets = missingGuideLocales(row, locales);
  if (!targets.length) return [];

  const hash = communityGuideHash(row);
  const names = namesIn(guideTranslationDoc(row), officialNames);
  const done = await translateGuideText(new Anthropic({ maxRetries: 1 }), row, targets, names, {
    onError: (to, e) => console.error(`[guides] traduzione ${row.lang}→${to} non riuscita:`, e instanceof Error ? e.message : e),
  });
  let written = (Object.keys(done) as Locale[]).filter((l) => done[l]);
  if (!written.length) return [];

  // Rilettura: se la guida è cambiata (o non è più pubblicata) mentre traducevamo, queste traduzioni non servono.
  const fresh = await readRow(supabase, guideId);
  if (!fresh || fresh.status !== "published" || communityGuideHash(fresh) !== hash || fresh.title !== row.title) return [];
  const next: CommunityGuideTranslations = { ...(fresh.translations ?? {}), ...done };
  delete next[fresh.lang];
  const saved = await saveTranslations((t) => supabase.from("community_guides").update({ translations: t }).eq("id", guideId), next, written, "guides");
  if (!saved) return [];
  written = saved;
  // /guides dal 29/09/2026 elenca le guide della community (ISR): una traduzione nuova la fa entrare in quella lingua
  const paths = locales.flatMap((l) => [`/${l}/guides/community/${fresh.slug}`, `/${l}/guides/community`, `/${l}/guides`]);
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // fuori dalla richiesta la pagina si aggiorna comunque da sola (ISR)
    }
  }
  // la pagina esiste ora anche in queste lingue: sitemap aggiornata e avviso a IndexNow per le versioni indicizzabili
  revalidateSitemaps();
  const withNext = { ...fresh, translations: next };
  const ping = written.filter((l) => !communityGuideIndexing(withNext, locales, l).noindex);
  if (indexNowEnabled() && ping.length) await submitIndexNow(ping.map((l) => `/${l}/guides/community/${fresh.slug}`));
  return written;
}

/** Da chiamare dopo la pubblicazione o la modifica di una guida pubblicata. Senza chiave non fa nulla. */
export function translateCommunityGuideLater(supabase: Db, guideId: string): void {
  if (!translationEnabled()) return;
  const job = async () => {
    try {
      await translateCommunityGuide(supabase, guideId);
    } catch (e) {
      console.error("[guides] traduzione della guida non riuscita:", e instanceof Error ? e.message : e);
    }
  };
  try {
    after(job);
  } catch {
    void job();
  }
}
