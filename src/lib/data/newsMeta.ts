import type { Locale } from "../i18n";
import type { NewsItem } from "./news";

/**
 * Controlli SEO delle news, come funzioni pure (analisi SEO/GEO del 25/09/2026, NEWS-02): fino ad allora 17 news
 * non avevano né title per la SERP né description, e il loro title usciva tagliato con "…". Li usa
 * `newsMeta.test.ts`, che gira in `npm test` e fallisce appena una news esce dai limiti o rimanda a qualcosa che
 * non esiste. Qui niente import di Next né dei dizionari: il file si carica anche con `node --test`.
 */

/** Limiti: gli stessi di `src/lib/page.ts` (TITLE_MAX, DESCRIPTION_MAX) e di `headline` nella pagina della news. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 158;
export const HEADLINE_MAX = 110;

/** Separatore dei titoli, uguale a quello di page.ts. */
export const TITLE_SEP = " · ";

/**
 * Titolo finale in SERP, con la regola di `pageTitle` (src/lib/page.ts): senza "Origins TCG" né "OriginsMeta" riceve
 * " · Origins TCG", poi " · OriginsMeta" se ci sta nei 60 caratteri. È ripetuta qui perché page.ts non si carica in
 * `node --test` (importa next/navigation e i dizionari senza estensione): il test controlla che limiti e
 * separatore di page.ts siano ancora questi.
 */
export function serpTitle(title: string): string {
  const trimmed = title.trim();
  const withKeyword = /origins tcg|originsmeta/i.test(trimmed) ? trimmed : `${trimmed}${TITLE_SEP}Origins TCG`;
  if (/originsmeta/i.test(withKeyword)) return withKeyword;
  const withBrand = `${withKeyword}${TITLE_SEP}OriginsMeta`;
  return withBrand.length <= TITLE_MAX ? withBrand : withKeyword;
}

/** Percorsi dei link interni di un testo Markdown (`](/…)`), per controllare il prefisso della lingua. */
export function internalLinks(markdown: string): string[] {
  return [...markdown.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
}

/**
 * Problemi di una news, uno per voce ("slug [lingua]: cosa non va"); vuoto se è tutto a posto. Per ogni lingua:
 * titolo entro 110 caratteri, riassunto, `metaTitle` che in SERP resta entro 60, `description` fra 120 e 158,
 * testo presente se c'è nelle altre lingue, ancore dell'"In breve" che esistono nel testo della stessa lingua e link
 * interni con il prefisso della lingua. Poi le guide collegate, che devono esistere (`guides` = slug delle guide).
 */
export function newsProblems(item: NewsItem, locales: readonly Locale[], guides: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const at = (locale: Locale, msg: string) => out.push(`${item.slug} [${locale}]: ${msg}`);
  for (const l of locales) {
    const title = item.title[l];
    if (!title) at(l, "manca il titolo");
    else if (title.length > HEADLINE_MAX) at(l, `titolo di ${title.length} caratteri, oltre ${HEADLINE_MAX}`);
    if (!item.summary[l]) at(l, "manca il riassunto");

    // `?.` anche se il tipo li vuole: senza, una news scritta male farebbe cadere il test con un TypeError muto.
    const meta = item.metaTitle?.[l];
    if (!meta) at(l, "manca metaTitle");
    else if (serpTitle(meta).length > TITLE_MAX) at(l, `title in SERP di ${serpTitle(meta).length} caratteri, oltre ${TITLE_MAX}: "${serpTitle(meta)}"`);
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
      if (path !== `/${l}` && !path.startsWith(`/${l}/`)) at(l, `link interno senza il prefisso /${l}: ${path}`);
    }
  }
  for (const g of item.guides ?? []) if (!guides.has(g)) out.push(`${item.slug}: la guida "${g}" non esiste`);
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
