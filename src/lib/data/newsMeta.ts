import type { Locale } from "../i18n";
import type { NewsItem } from "./news";

/**
 * Controlli SEO delle news, come funzioni pure (analisi SEO/GEO del 25/09/2026, NEWS-02): fino ad allora 17 news
 * non avevano né title per la SERP né description, e il loro title usciva tagliato con "…". Li usa
 * `newsMeta.test.ts`, che fallisce appena una news esce dai limiti o rimanda a qualcosa che non esiste. Qui niente
 * import di Next né dei dizionari: il file si carica anche con `node --test`.
 */

/** Limiti: gli stessi di `src/lib/page.ts` (TITLE_MAX, DESCRIPTION_MAX) e di `headline` nella pagina della news. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 158;
export const HEADLINE_MAX = 110;

/**
 * Quello che serve a `newsProblems` oltre alla news. La regola del titolo non è copiata qui: il test passa la
 * `pageTitle` vera di page.ts (ricostruita dal sorgente, perché page.ts importa Next e non si carica in
 * `node --test`), così se la regola cambia i controlli cambiano con lei.
 */
export type NewsChecks = {
  /** titolo finale in SERP a partire dal `metaTitle`: `pageTitle` di src/lib/page.ts */
  pageTitle: (title: string) => string;
  /** slug delle guide che esistono (`guideSlugs` di guides.ts) */
  guides: ReadonlySet<string>;
  /** le news del sito, per controllare i link verso altri articoli e le loro ancore */
  news: readonly NewsItem[];
  /** primi segmenti dei percorsi del sito (cards, decks, metashifting…); se manca, quei link non si controllano */
  sections?: ReadonlySet<string>;
};

/** Percorsi dei link interni di un testo Markdown (`](/…)`), per controllare prefisso della lingua e destinazione. */
export function internalLinks(markdown: string): string[] {
  return [...markdown.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
}

/** Ancora generata da un titolo, con la stessa regola di `slugify` in Markdown.tsx (qui sul Markdown, non sull'HTML). */
function slugify(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ancore dei titoli `##` e `###` di un testo: quella scritta come `{#ancora}` o, se manca, quella generata dal titolo. */
export function anchorsOf(markdown: string): Set<string> {
  const out = new Set<string>();
  for (const m of markdown.matchAll(/^#{2,3} +(.+?)\s*$/gm)) {
    const explicit = m[1].match(/\{#([a-z0-9-]+)\}$/);
    out.add(explicit ? explicit[1] : slugify(m[1]));
  }
  return out;
}

const MONTHS: Record<Locale, readonly string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  it: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
};

/**
 * Come si apre il paragrafo di aggiornamento di una news (regola di CLAUDE.md: `updated` va con un paragrafo
 * "Aggiornamento del …"), nelle forme già usate negli articoli: "Update, 21 September" o "Update of 25 September",
 * "Aggiornamento del 21 settembre", "Actualización del 21 de septiembre".
 */
export function updateMarkers(locale: Locale, isoDate: string): string[] {
  const day = Number(isoDate.slice(8, 10));
  const month = MONTHS[locale][Number(isoDate.slice(5, 7)) - 1];
  if (locale === "it") return [`Aggiornamento del ${day} ${month}`];
  if (locale === "es") return [`Actualización del ${day} de ${month}`];
  return [`Update, ${day} ${month}`, `Update of ${day} ${month}`];
}

/**
 * Cosa non va in un link interno scritto nel testo di una news in `locale`, o `undefined` se va bene: prefisso della
 * lingua, news e guide che esistono (con l'ancora, per gli articoli), prima parte del percorso fra le sezioni del sito.
 */
export function linkProblem(path: string, locale: Locale, checks: NewsChecks): string | undefined {
  if (path !== `/${locale}` && !path.startsWith(`/${locale}/`) && !path.startsWith(`/${locale}#`)) return `link interno senza il prefisso /${locale}: ${path}`;
  const [route, anchor] = path.slice(locale.length + 1).split("#");
  const [section, slug] = route.split("/").filter(Boolean);
  if (!section) return undefined;
  if (section === "news" && slug) {
    const target = checks.news.find((n) => n.slug === slug);
    if (!target) return `link a una news che non esiste: ${path}`;
    if (anchor && !anchorsOf(target.body?.[locale] ?? "").has(anchor)) return `link a un'ancora che non c'è nella news: ${path}`;
    return undefined;
  }
  // /guides/submit è il modulo "Mandaci la tua guida", non una guida
  if (section === "guides" && slug) return checks.guides.has(slug) || slug === "submit" ? undefined : `link a una guida che non esiste: ${path}`;
  if (checks.sections && !checks.sections.has(section)) return `link a una sezione che non esiste: ${path}`;
  return undefined;
}

/**
 * Problemi di una news, uno per voce ("slug [lingua]: cosa non va"); vuoto se è tutto a posto. Per ogni lingua:
 * titolo entro 110 caratteri, riassunto, `metaTitle` che in SERP contiene "Origins TCG" e resta entro 60,
 * `description` fra 120 e 158, testo presente se c'è nelle altre lingue, ancore dell'"In breve" scritte nel testo
 * della stessa lingua, link interni verso pagine che esistono e, se la news è stata aggiornata, il paragrafo
 * dell'aggiornamento con la sua data. Poi le guide collegate, che devono esistere.
 */
export function newsProblems(item: NewsItem, locales: readonly Locale[], checks: NewsChecks): string[] {
  const out: string[] = [];
  const at = (locale: Locale, msg: string) => out.push(`${item.slug} [${locale}]: ${msg}`);
  for (const l of locales) {
    const title = item.title[l];
    if (!title) at(l, "manca il titolo");
    else if (title.length > HEADLINE_MAX) at(l, `titolo di ${title.length} caratteri, oltre ${HEADLINE_MAX}`);
    if (!item.summary[l]) at(l, "manca il riassunto");

    // `?.` anche se il tipo li vuole: senza, una news scritta male farebbe cadere il test con un TypeError muto.
    const meta = item.metaTitle?.[l];
    const serp = meta ? checks.pageTitle(meta) : "";
    if (!meta) at(l, "manca metaTitle");
    else if (!/origins tcg/i.test(serp)) at(l, `title in SERP senza "Origins TCG": "${serp}"`);
    else if (serp.length > TITLE_MAX) at(l, `title in SERP di ${serp.length} caratteri, oltre ${TITLE_MAX}: "${serp}"`);
    const desc = item.description?.[l];
    if (!desc) at(l, "manca description");
    else if (desc.length < DESCRIPTION_MIN || desc.length > DESCRIPTION_MAX) at(l, `description di ${desc.length} caratteri, fuori da ${DESCRIPTION_MIN}-${DESCRIPTION_MAX}`);

    const body = item.body?.[l] ?? "";
    if (item.body && !body) at(l, "manca il testo in questa lingua");
    if (item.highlights && !item.highlights[l]?.length) at(l, "manca l'In breve in questa lingua");
    for (const h of item.highlights?.[l] ?? []) {
      if (!body.includes(`{#${h.anchor}}`)) at(l, `l'ancora #${h.anchor} dell'In breve non c'è nel testo`);
    }
    for (const path of internalLinks(body)) {
      const problem = linkProblem(path, l, checks);
      if (problem) at(l, problem);
    }
    if (body && item.updated && item.updated !== item.date) {
      const markers = updateMarkers(l, item.updated);
      if (!markers.some((m) => body.includes(m))) at(l, `aggiornata il ${item.updated} ma il testo non ha il paragrafo "${markers[0]}…"`);
    }
  }
  if (item.updated && item.updated < item.date) out.push(`${item.slug}: updated (${item.updated}) prima di date (${item.date})`);
  for (const g of item.guides ?? []) if (!checks.guides.has(g)) out.push(`${item.slug}: la guida "${g}" non esiste`);
  return out;
}

/** metaTitle usati da più di una news nella stessa lingua: ogni pagina deve avere il suo title. */
export function duplicateMetaTitles(items: readonly NewsItem[], locales: readonly Locale[]): string[] {
  const out: string[] = [];
  for (const l of locales) {
    const seen = new Map<string, string>();
    for (const item of items) {
      const key = item.metaTitle?.[l]?.trim().toLowerCase();
      if (!key) continue;
      const other = seen.get(key);
      if (other) out.push(`[${l}] "${item.metaTitle[l]}" è sia di ${other} sia di ${item.slug}`);
      else seen.set(key, item.slug);
    }
  }
  return out;
}
