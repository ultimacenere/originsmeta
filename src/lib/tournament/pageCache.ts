import { refresh, revalidatePath, revalidateTag, updateTag } from "next/cache";
import { locales } from "@/lib/i18n";
import { revalidateSitemaps } from "@/lib/sitemapData";

/**
 * Cache della scheda torneo (27/11/2026, Harvest Bowl Qualifier 2: fino a 512 giocatori e 928 partite, con il rapporto
 * `80_Eventi/sicurezza-tornei-2026-11-15.md`). La parte uguale per tutti di un torneo pubblico (torneo, iscritti,
 * partite, arbitri, annunci) sta nella cache dei dati di Next per `TOURNAMENT_PAGE_TTL` secondi con l'etichetta
 * `tournamentTag(slug)`; i tornei del calendario per `LISTED_TOURNAMENTS_TTL` secondi. Le letture sono in pageData.ts.
 *
 * Qui come le Server Action la rinnovano (`refreshTournament`), al posto delle 24 `revalidatePath` più le sitemap che
 * ogni azione faceva prima. Tre tipi di cambiamento:
 * - `live` (referto, risultato dello staff, vittoria a tavolino, check-in, ritiro, sideboard): l'etichetta diventa
 *   vecchia con il profilo "max" (la visita dopo riceve la copia di prima e ne fa partire una nuova in background) e
 *   `refresh()` ridisegna la pagina di chi ha fatto l'azione. Quello che cambia per lui (la sua riga, le sue partite)
 *   la scheda lo legge comunque con la sua sessione, fuori dalla cache. Lista dei tornei, account e sitemap non
 *   cambiano con un risultato: non si toccano più. Nei giorni del torneo sono centinaia di azioni l'ora.
 * - `roster` (iscrizione, ritiro dalle iscrizioni, consegna dei mazzi): come `live`, più la lista /tournaments e i
 *   tornei del calendario, che mostrano quanti sono iscritti.
 * - `structure` (creazione, modifica, avvio, fine, annullamento, eliminazione, turni e fasi nuovi, arbitri, inviti):
 *   `updateTag`, che fa scadere subito la cache del torneo (la visita dopo aspetta i dati nuovi), più lista, account e
 *   sitemap come prima. Sono poche azioni, quasi tutte dello staff.
 * `updateTag` e `refresh` valgono solo nelle Server Action: questo modulo lo chiamano solo quelle.
 */

/** Secondi di validità della parte comune di un torneo pubblico. */
export const TOURNAMENT_PAGE_TTL = 15;
/** Secondi di validità dei tornei del calendario ("Altri tornei" in fondo alla scheda). */
export const LISTED_TOURNAMENTS_TTL = 60;
/** Etichetta dei tornei del calendario nella cache della scheda. */
export const LISTED_TOURNAMENTS_TAG = "tournaments-listed";

const SLUG_RE = /^[a-z0-9-]{1,120}$/;

/** Etichetta della cache di un torneo; per uno slug strano nessuna (niente da rinnovare). */
export function tournamentTag(slug: string): string | null {
  return SLUG_RE.test(slug) ? `tournament:${slug}` : null;
}

export type TournamentChange = "live" | "roster" | "structure";

export function refreshTournament(slug: string | null | undefined, change: TournamentChange): void {
  const tag = slug ? tournamentTag(slug) : null;
  if (change === "structure") {
    if (tag) updateTag(tag);
    revalidateTag(LISTED_TOURNAMENTS_TAG, "max");
    for (const l of locales) {
      revalidatePath(`/${l}/tournaments`);
      revalidatePath(`/${l}/account`);
    }
    // l'indice e tutte le sitemap divise (Ondata 2): revalidatePath("/sitemap.xml") rinfrescava solo l'indice
    revalidateSitemaps();
    return;
  }
  if (tag) revalidateTag(tag, "max");
  if (change === "roster") {
    revalidateTag(LISTED_TOURNAMENTS_TAG, "max");
    for (const l of locales) revalidatePath(`/${l}/tournaments`);
  }
  // la pagina di chi ha fatto l'azione si ridisegna con la risposta (prima lo faceva revalidatePath della scheda)
  refresh();
}
