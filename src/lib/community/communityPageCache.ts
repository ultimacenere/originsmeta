import { unstable_cache } from "next/cache";
import { getPublishedGuide, listPublishedGuides } from "./guideQueries";
import { getDeckSet, listPublishedDeckSets } from "./deckSetQueries";
import { listPublishedComics } from "./comicQueries";
import { authorName } from "./util";

/**
 * Letture delle guide della community (/guides/community/<slug>) e dei mazzi torneo (/decks/tournament/<slug>) con una
 * scadenza lunga (piano costi dell'08/11/2026, intervento 1, fatto il 14/11/2026). Stesso motivo e stesso schema di
 * deckPageData.ts: con `supabasePublic()` (fetch a 60 secondi) le pagine si rigeneravano ogni minuto qualunque fosse il
 * loro `revalidate`; dentro `unstable_cache` vale solo `COMMUNITY_PAGE_REVALIDATE`.
 *
 * Le rigenerazioni su richiesta, già presenti e controllate il 14/11/2026, in tutte le lingue:
 * - guide: pubblicazione, modifica, cambio di stato, eliminazione (guideActions.ts) e traduzioni (guideTranslate.ts);
 * - mazzi torneo: pubblicazione, modifica, stato, eliminazione (deckSetActions.ts), traduzioni (deckSetTranslate.ts) e,
 *   dal 14/11, i voti in tutte le lingue (`voteDeckSet`, prima solo quella da cui si votava).
 * `revalidatePath` fa scadere anche queste voci (tag impliciti della pagina). Restano indietro fino a 12 ore, accettato:
 * nome e badge dell'autore cambiati nel profilo, e gli "altri mazzi torneo" in fondo alla pagina con i loro voti.
 */

/** Secondi di validità: 12 ore, lo stesso numero che le due pagine scrivono per esteso nel loro `revalidate`. */
export const COMMUNITY_PAGE_REVALIDATE = 43_200;

/** Chiavi delle voci: DA AGGIORNARE (v2…) quando cambia la forma dei dati restituiti (vedi deckPageData.ts). */
const GUIDE_KEY = "guide-page-v1";
const GUIDE_LIST_KEY = "guide-page-others-v1";
const SET_KEY = "deck-set-page-v1";
const SET_OTHERS_KEY = "deck-set-others-v1";

/** Un mazzo torneo ridotto per il blocco "Altri mazzi torneo". */
export type OtherDeckSet = { id: string; slug: string; name: string; rating?: { avg: number; votes: number }; author: string };

const cachedGuide = unstable_cache((slug: string) => getPublishedGuide(slug), [GUIDE_KEY], { revalidate: COMMUNITY_PAGE_REVALIDATE });

/** L'elenco leggero delle guide pubblicate ("Altre guide" in fondo alla pagina): qualche centinaio di KB, una voce sola. */
const cachedGuideList = unstable_cache(() => listPublishedGuides(), [GUIDE_LIST_KEY], { revalidate: COMMUNITY_PAGE_REVALIDATE });

const cachedSet = unstable_cache((slug: string) => getDeckSet(slug), [SET_KEY], { revalidate: COMMUNITY_PAGE_REVALIDATE });

/** I nove più recenti: la pagina toglie sé stessa e ne mostra otto. */
const cachedOthers = unstable_cache(
  async (): Promise<OtherDeckSet[]> =>
    (await listPublishedDeckSets()).slice(0, 9).map((x) => ({ id: x.id, slug: x.slug, name: x.name, rating: x.rating, author: authorName(x.profile) })),
  [SET_OTHERS_KEY],
  { revalidate: COMMUNITY_PAGE_REVALIDATE },
);

/** Una guida pubblicata; null se non c'è (404 vera). Con un errore lancia. */
export function guidePageData(slug: string) {
  return cachedGuide(slug);
}

/** Le guide pubblicate (elenco leggero), per "Altre guide". Con un errore lancia. */
export function guideListForPage() {
  return cachedGuideList();
}

/** Un mazzo torneo pubblicato; null se non c'è (404 vera). Con un errore lancia. */
export function deckSetPageData(slug: string) {
  return cachedSet(slug);
}

/**
 * Home (14/11/2026): dichiarava `revalidate = 300`, ma i fumetti letti con `supabasePublic()` la facevano rigenerare
 * ogni minuto. Ora 30 minuti, quanto la lettura dei video dei creator (creatorVideoQueries.ts): i fumetti la rinnovano
 * subito in tutte le lingue (`revalidatePath("/<lingua>")` in comicActions.ts e comicTranslate.ts). Resta indietro fino a
 * 30 minuti, accettato, solo ciò che dipende dall'ora: la fine della promozione del Kickstarter e lo slider fermo.
 */
export const HOME_REVALIDATE = 1800;
const HOME_COMICS_KEY = "home-comics-v1";

const cachedHomeComics = unstable_cache((limit: number) => listPublishedComics(limit), [HOME_COMICS_KEY], { revalidate: HOME_REVALIDATE });

/** I fumetti più recenti per la home. Con un errore lancia (resta la home di prima). */
export function homeComics(limit: number) {
  return cachedHomeComics(limit);
}

/** Gli altri mazzi torneo più recenti, ridotti. Con un errore lancia. */
export function otherDeckSets(): Promise<OtherDeckSet[]> {
  return cachedOthers();
}
