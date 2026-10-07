import type { Locale } from "./i18n";

/**
 * Date `lastmod` della sitemap (Ondata 1 del piano SEO/GEO, 25/09/2026: TECH-06, SCHEDE-09, RIV-01, GEO-11).
 *
 * Google usa `lastmod` solo se lo trova "costantemente e verificabilmente preciso": prima la sitemap dava a 406
 * pagine la stessa data fissa (SITE_UPDATED) e alle schede spagnole, nate il 25/09, date di agosto. Da qui ogni URL
 * dichiara il giorno più recente fra quelli che ne hanno cambiato davvero il contenuto:
 *   - il modello della pagina (`PAGE_UPDATED`, dalla storia del repository);
 *   - i suoi dati (data della news, `updated` della guida, patch che hanno toccato la carta, `updated_at` di un mazzo…),
 *     che raccoglie `src/lib/sitemapEntries.ts` (dal 25/09/2026 le sitemap sono divise per sezione e lingua);
 *   - due soglie: il giorno in cui la lingua è nata (`LOCALE_SINCE`) e l'ultimo cambio che ha toccato i link di
 *     tutte le pagine (`SITE_WIDE_CHANGE`).
 * Mai nel futuro (si taglia a oggi) e mai con un orario: solo il giorno (aaaa-mm-gg), perché "2026-09-25T12:00Z"
 * letto alle 9 del mattino sarebbe una data che non è ancora arrivata.
 * Funzioni pure, senza import di dati, così si provano con `node --test src/lib/lastmod.test.ts`.
 */

/** Un giorno in formato ISO, senza orario: "2026-09-25". */
export type Day = string;

/** Primo giorno online di ogni lingua: nessuna pagina può dichiararsi cambiata prima di esistere. */
export const LOCALE_SINCE: Record<Locale, Day> = { en: "2026-09-15", it: "2026-09-15", es: "2026-09-25", fr: "2026-10-07" };

/**
 * Soglia comune a tutte le pagine: il 25/09/2026 lo spagnolo ha aggiunto a ogni URL l'hreflang `es` (e la voce del
 * selettore della lingua), cioè un cambio dei segnali di lingua di tutto il sito; il 07/10/2026 il francese ha fatto lo
 * stesso con l'hreflang `fr`.
 * Si sposta SOLO quando nasce una lingua nuova o cambia l'hreflang di tutte le pagine. Mai per i link di navigazione
 * nell'header o nel footer (la colonna "Esplora" compresa) né per altri ritocchi del contorno: Google non li considera
 * un cambio del contenuto, e portare ogni URL allo stesso giorno per il contorno toglierebbe credibilità al lastmod
 * (lo stesso difetto della vecchia SITE_UPDATED, TECH-06). Per tutto il resto contano le date delle pagine e dei loro
 * modelli (`PAGE_UPDATED`). Il test la vuole uguale alla nascita della lingua più recente: se un giorno si sposta per
 * un cambio di hreflang senza lingue nuove, si aggiorna anche il test, spiegando perché.
 */
export const SITE_WIDE_CHANGE: Day = "2026-10-07";

/** Ogni news ha una pagina propria dal 21/09/2026: prima esisteva solo la scheda nell'elenco. */
export const NEWS_PAGES_SINCE: Day = "2026-09-21";

/**
 * Ultimo cambio del modello di ogni pagina (testi fissi, sezioni, link, dati mostrati), letto dalla storia del
 * repository. Da aggiornare nello stesso commit che cambia il modello; i ritocchi solo grafici non contano.
 * Le pagine senza dati propri (FAQ, chi siamo, deck builder…) hanno solo questa data.
 */
export const PAGE_UPDATED = {
  "/": "2026-09-30", // 30/09: prima slide con la copertina della patch 0.7 e il tasto all'articolo; FUMETTI: i fumetti dei creator fra le news in evidenza e in bacheca (ISR); Ondata 3: invito alla tier list della community (TierInvite); Ondata 1: title sul marchio, "In breve"
  "/news": "2026-09-29", // FUMETTI: i fumetti dei creator nell'elenco (ISR) e il link a /news/comics; Ondata 1: title senza "patch notes", link a MetaShifting; 25/09: news senza fonte citabile senza "Fonte"
  "/news/comics": "2026-09-29", // FUMETTI: nascita dell'elenco dei fumetti dei creator
  "/news/comics/[slug]": "2026-09-30", // 30/09: versioni disegnate in altre lingue (tavole, titolo, presentazione e copertina della lingua della pagina) e 308 dagli indirizzi dei fumetti uniti; FUMETTI: nascita delle pagine dei fumetti
  "/news/[slug]": "2026-09-25", // Ondata 2: firma con la Person unica e "Tutti gli autori", Event della Crimson Cup; via World of Origins
  "/guides": "2026-09-29", // 29/09: titoli delle guide della community tradotti; un elenco solo, guide della redazione e della community insieme dalla più recente (Pierluigi: niente divisione), pagina in ISR; GUIDE: sezione "Guide della community" e riquadro "Scrivi una guida"; Ondata 1: title e description
  "/guides/community": "2026-09-29", // 29/09: titoli tradotti nelle schede; GUIDE: nascita dell'elenco delle guide della community
  "/guides/community/[slug]": "2026-09-29", // 29/09: titolo tradotto (H1, title, dati strutturati); niente più "Guida della community" nel kicker e nelle briciole, copertina caricata; GUIDE: nascita delle guide della community
  "/guides/[slug]": "2026-09-25", // Ondata 2: firma e "Tutti gli autori", Event del Next Fest, Davdas linkato nelle sue guide
  "/cards": "2026-09-29", // 29/09: sotto il titolo solo il tasto "Esplora i luoghi", introduzione e note in fondo; Ondata 1: archivio delle carte rimosse; 25/09: righe dei dati senza World of Origins (solo verificato/patch notes)
  "/cards/[slug]": "2026-10-06", // 06/10: riquadro "Voti alle carte" (voto da 1 a 10 e fascia nella tier list dei voti); Ondata 2: mazzi, frase d'attacco, In breve, JSON-LD a due nodi; 25/09: via World of Origins e "Carte collegate"
  "/locations": "2026-09-30", // 30/09: nota in fondo sulla rarità dei luoghi (patch 0.7); 71a6dad: effetti con il glossario ufficiale del gioco; 25/09: riga della fonte senza World of Origins
  "/decks": "2026-10-04", // 04/10: schede "Mazzi singoli · Mazzi torneo" in cima; 30/09: filtro per versione del gioco nel pannello, con tutte le versioni; 29/09: via il riquadro "Pubblica il tuo mazzo" (resta il tasto), tasto verso i migliori mazzi, classifica dopo l'elenco, introduzione e In breve in fondo; ruoli del 27/09: filtri "Ruolo" e "Pubblicato da", Creator e Autore nelle pastiglie; CREATOR: ruolo, canali e LIVE accanto al nome; Ondata 3: i migliori mazzi di Origins TCG adesso; Ondata 2: ItemList con la soglia di qualità
  "/decks/[slug]": "2026-09-27", // ruoli del 27/09: "Pubblicato da" al posto di "Autore"; 63fa759
  "/decks/tournament": "2026-10-04", // 04/10: nascita dei Mazzi torneo (tre mazzi Conquest con una guida)
  "/decks/tournament/[slug]": "2026-10-04", // 04/10: nascita della scheda del mazzo torneo
  "/decks/community/[slug]": "2026-09-27", // ruoli del 27/09: pastiglia Creator/Autore accanto al nome, "chi ha pubblicato il mazzo" nelle note della guida e delle risorse; CREATOR: ruolo, canali e LIVE accanto al nome; VIDEO: lettore a clic e risorse; STREAM: menu "Per le dirette" e og:image dalla lista del mazzo; Ondata 2: soglia di qualità, JSON-LD di autore e carte, altri mazzi per Leggendaria
  "/deck-builder": "2026-09-30", // 30/09: nota dati con la patch 0.7, uscita dopo la verifica sul gioco; Ondata 2: WebApplication nei dati strutturati
  "/draft": "2026-10-02", // 02/10: nascita del draft contro il Cervello (tre formati); fase 2: "Contro un amico" con le stanze online
  "/tier-list": "2026-10-06", // 06/10: scheda "Voti alle carte" nella testata e riquadro di rimando; 02/10: la quarta scheda diventa "Analytics"; 30/09: quarta scheda "Win rate" nella testata; ruoli del 27/09: pastiglia Creator/Autore accanto al nome nei mazzi più votati; Ondata 3: mazzi più votati solo fra le schede indicizzabili; Ondata 1: In breve dai dati
  "/tier-list/community": "2026-10-06", // 06/10: scheda "Voti alle carte" nella testata; 02/10: la quarta scheda diventa "Analytics"; 30/09: quarta scheda "Win rate" nella testata; 29/09: testi in fondo, un solo link verso la tier list di OriginsMeta; ruoli del 27/09 nelle tier list firmate; Ondata 3: tier list firmate; Ondata 2: ItemList delle carte
  "/tier-list/votes": "2026-10-06", // 06/10: nascita della tier list dei voti alle carte (voti da 1 a 10 degli iscritti)
  "/tier-list/most-played": "2026-10-06", // 06/10: scheda "Voti alle carte" nella testata; 02/10: la quarta scheda diventa "Analytics"; 30/09: quarta scheda "Win rate" nella testata; Ondata 2: ItemList delle carte più giocate
  "/tier-list/create": "2026-10-06", // 06/10: scheda "Voti alle carte" nella testata; 02/10: la quarta scheda diventa "Analytics"; 30/09: quarta scheda "Win rate" nella testata; Ondata 1: H1
  "/analytics": "2026-10-02", // 02/10: nascita della pagina di OriginsMeta Analytics (al posto di /tier-list/win-rate)
  "/metashifting": "2026-09-25", // Ondata 1: title "patch notes" e riga sull'ultima patch
  "/tournaments": "2026-09-25", // Ondata 2: formato della Crimson Cup con orari e fusi, voci collegate agli Event
  "/tournaments/[slug]": "2026-09-25", // Ondata 2: Event solo per i tornei pubblici, organizzatore per @id
  "/faq": "2026-09-30", // 30/09: patch 0.7, risposte "languages" (13 lingue) e "where-cards"; 28/09: risposta "kickstarter" con la data confermata dal CEO di Koin Games; Ondata 3: 15 risposte, ognuna con la sua pagina primaria; Ondata 1: H1, link alle news
  "/about": "2026-09-25", // Ondata 2: description, come verifichiamo i dati, disclaimer, link agli autori; 25/09: via World of Origins da fonti e metodo
  "/authors": "2026-09-27", // 27/09: la pagina si chiama Redazione (decisione di Pierluigi); Ondata 2: voci collegate alle Person
  "/authors/[slug]": "2026-09-27", // 27/09: "Tutta la redazione"; Ondata 2: Person unica, link al profilo della community, tagline di Davdas
  "/u/[username]": "2026-09-27", // 27/09, profili: VETRINA (copertina, accento, frase, Leggendaria del cuore, mazzo e video in evidenza, orari), SEGUI (tasto Segui), TRAGUARDI (traguardi, numeri pubblici della vetrina, tornei in evidenza), GUIDE (guide della community); ruoli del 27/09 (Creator, Autore) e bio da 600 caratteri; CREATOR: bio, canali e lingue, sameAs, tornei organizzati; Ondata 2: noindex senza contenuti, ProfilePage
  "/creators": "2026-09-27", // ruoli del 27/09: "Creator e autori", filtro per ruolo; CREATOR: nascita della directory
} as const satisfies Record<string, Day>;

export type PageRoute = keyof typeof PAGE_UPDATED;

const DAY = /^(\d{4}-\d{2}-\d{2})/;

/** Il giorno di una data ISO o di un timestamp ("2026-09-24T16:59:00+02:00" → "2026-09-24"); undefined se non è una data. */
export function toDay(value: string | null | undefined): Day | undefined {
  const m = value ? DAY.exec(value.trim()) : null;
  return m && !Number.isNaN(Date.parse(`${m[1]}T00:00:00Z`)) ? m[1] : undefined;
}

/** Il giorno più recente fra quelli validi (le date ISO si confrontano come stringhe); undefined se non ce n'è nessuno. */
export function latestDay(values: Iterable<string | null | undefined>): Day | undefined {
  let best: Day | undefined;
  for (const v of values) {
    const d = toDay(v);
    if (d && (!best || d > best)) best = d;
  }
  return best;
}

/** Oggi in UTC, senza orario: il limite oltre il quale nessuna data può andare. */
export function todayUtc(now: Date = new Date()): Day {
  return now.toISOString().slice(0, 10);
}

/**
 * Il `lastmod` di un URL: il giorno più recente fra le date del contenuto, il giorno in cui la lingua è nata e
 * l'ultimo cambio di tutto il sito; poi tagliato a oggi, così una data scritta in anticipo non esce mai nel futuro.
 */
export function lastmodFor(locale: Locale, dates: Iterable<string | null | undefined>, today: Day): Day {
  const best = latestDay([...dates, LOCALE_SINCE[locale], SITE_WIDE_CHANGE]) ?? LOCALE_SINCE[locale];
  const limit = toDay(today) ?? best;
  return best > limit ? limit : best;
}

/** Il `lastmod` di una pagina: data del suo modello più le date dei dati che mostra. */
export function pageLastmod(route: PageRoute, locale: Locale, dates: Iterable<string | null | undefined>, today: Day): Day {
  return lastmodFor(locale, [PAGE_UPDATED[route], ...dates], today);
}
