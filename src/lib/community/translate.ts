import Anthropic from "@anthropic-ai/sdk";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { locales, type Locale } from "@/lib/i18n";
import { cards } from "@/lib/data/cards";
import { locations } from "@/lib/data/locations";
import { indexNowEnabled, submitIndexNow } from "@/lib/indexnow";
import { revalidateSitemaps } from "@/lib/sitemapData";
import type { Db } from "@/lib/supabase/public";
import type { Guide } from "./types";
import { guideHash, guideText, missingLocales, namesIn, translateGuideWith, type DeckTranslations } from "./deckTranslation";
import { refreshCardDecks } from "./decksByCard";
import { indexableLocales } from "./deckQuality";

/**
 * Dopo la pubblicazione o la modifica di un mazzo, la guida si traduce nelle altre lingue del sito
 * (Pierluigi, 25/09/2026). Il lavoro vero sta in `deckTranslation.ts`; qui c'è il giro del sito:
 *
 * - parte dopo la risposta al browser (`after()`): chi pubblica non aspetta il modello;
 * - scrive con la sessione del proprietario (le policy di community_decks), la stessa della Server Action;
 * - traduce solo le lingue che mancano o che sono rimaste indietro rispetto al testo (impronta `hash`);
 * - prima di scrivere rilegge la guida: se nel frattempo l'autore l'ha cambiata, la traduzione è vecchia e si
 *   lascia perdere (ci pensa il giro partito con la modifica);
 * - nessuna eccezione verso chi pubblica: se qualcosa va storto la pagina mostra l'originale con la sua nota, e
 *   `scripts/translate-decks.mjs` recupera gli arretrati.
 *
 * INTERRUTTORE: ANTHROPIC_API_KEY (Vercel → Settings → Environment Variables, tipo Secret), la stessa chiave
 * dell'assistente delle FAQ. Senza, non parte nulla e i mazzi restano nella lingua dell'autore.
 */

export function translationEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Nomi ufficiali che il modello non deve tradurre: carte (anche rimosse e create) e luoghi. */
const officialNames: string[] = [...new Set([...cards.map((c) => c.name), ...locations.map((l) => l.name)])];

type Row = { guide: Guide; translations: DeckTranslations | null; status: string; slug: string };

async function readRow(supabase: Db, deckId: string): Promise<Row | null> {
  const { data, error } = await supabase.from("community_decks").select("guide, translations, status, slug").eq("id", deckId).maybeSingle();
  if (error || !data) return null;
  return data as unknown as Row;
}

/** Traduce la guida del mazzo nelle lingue che mancano e salva il risultato. Restituisce le lingue scritte. */
export async function translateDeck(supabase: Db, deckId: string): Promise<string[]> {
  const row = await readRow(supabase, deckId);
  if (!row || row.status === "draft" || !row.guide?.summary) return [];
  const targets = missingLocales(row, locales);
  if (!targets.length) return [];

  const hash = guideHash(row.guide);
  const names = namesIn(guideText(row.guide), officialNames);
  const client = new Anthropic({ maxRetries: 1 });
  const results = await Promise.all(
    targets.map((to) =>
      translateGuideWith(client, row.guide, to, names).catch((e: unknown) => {
        console.error(`[decks] traduzione ${row.guide.lang}→${to} non riuscita:`, e instanceof Error ? e.message : e);
        return null;
      }),
    ),
  );

  // Rilettura: se la guida è cambiata mentre traducevamo, queste traduzioni sono già vecchie.
  const fresh = await readRow(supabase, deckId);
  if (!fresh || guideHash(fresh.guide) !== hash) return [];
  const next: DeckTranslations = { ...(fresh.translations ?? {}) };
  delete next[fresh.guide.lang];
  const written: string[] = [];
  targets.forEach((to, i) => {
    const r = results[i];
    if (!r) return;
    next[to] = { hash, at: new Date().toISOString(), model: r.model, guide: r.guide };
    written.push(to);
  });
  if (!written.length) return [];
  const { error } = await supabase.from("community_decks").update({ translations: next }).eq("id", deckId);
  if (error) {
    console.error("[decks] salvataggio delle traduzioni non riuscito:", error.message);
    return [];
  }
  for (const l of locales) {
    try {
      revalidatePath(`/${l}/decks/community/${fresh.slug}`);
      revalidatePath(`/${l}/decks`);
    } catch {
      // fuori dalla richiesta la pagina si aggiorna comunque da sola (ISR, al massimo un minuto)
    }
  }
  // Le schede carta linkano un mazzo solo nelle lingue in cui la sua pagina è indicizzabile (Ondata 2): una traduzione
  // nuova lo aggiunge alle schede di quella lingua, che si rigenerano alla visita successiva invece che entro un'ora.
  // Solo per i mazzi pubblicati: quelli nascosti non stanno sulle schede.
  if (fresh.status === "published") {
    try {
      refreshCardDecks();
    } catch {
      // fuori dalla richiesta: le schede si aggiornano comunque entro un'ora
    }
    // la scheda esiste ora anche in queste lingue: sitemap aggiornata (revalidateSitemaps non lancia mai) e avviso a
    // IndexNow, solo per le versioni indicizzabili. `next` e non `fresh.translations`, che sono quelle di prima.
    revalidateSitemaps();
    const indexable = new Set(indexableLocales({ ...fresh, translations: next }, locales));
    const ping = written.filter((l) => indexable.has(l as Locale));
    if (indexNowEnabled() && ping.length) await submitIndexNow(ping.map((l) => `/${l}/decks/community/${fresh.slug}`));
  }
  return written;
}

/** Da chiamare dopo la pubblicazione o la modifica: traduce dopo la risposta al browser. Senza chiave non fa nulla. */
export function translateDeckLater(supabase: Db, deckId: string): void {
  if (!translationEnabled()) return;
  const job = async () => {
    try {
      await translateDeck(supabase, deckId);
    } catch (e) {
      console.error("[decks] traduzione della guida non riuscita:", e instanceof Error ? e.message : e);
    }
  };
  try {
    after(job);
  } catch {
    void job();
  }
}
