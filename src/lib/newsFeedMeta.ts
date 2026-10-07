import type { Locale } from "./i18n";

/**
 * Percorso ed etichette dei feed RSS delle news (Ondata 2, 25/09/2026), senza i dati: le importano anche il layout di
 * ogni pagina (il `<link rel="alternate">` del feed) e chi ha bisogno solo dell'indirizzo, senza portarsi dietro le
 * news, gli autori e la lettura dei file che servono a costruire il feed (`newsFeed.ts`).
 */

/** Percorso del feed di una lingua: /en/news/feed.xml. */
export function newsFeedPath(locale: Locale): string {
  return `/${locale}/news/feed.xml`;
}

/**
 * Titolo e descrizione del canale nelle lingue del sito ("patch notes" in italiano, "notas del parche" in spagnolo,
 * "notes de patch" in francese, come in docs/spagnolo.md e docs/francese.md; "sito di fan" / "sitio de fans" / "site
 * de fans" come nei dizionari; "Actus" è il nome francese della sezione). La descrizione dice sempre che il sito non è
 * affiliato a Koin Games. Il titolo serve anche al `<link rel="alternate">` delle pagine.
 */
export const newsFeedLabels: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Origins TCG news · OriginsMeta",
    description: "Origins TCG news from OriginsMeta: patch notes, events, demo updates and new features on the site. Unofficial fan site, not affiliated with Koin Games.",
  },
  it: {
    title: "News su Origins TCG · OriginsMeta",
    description: "Le news di OriginsMeta su Origins TCG: patch notes, eventi, novità della demo e del sito. Sito di fan non ufficiale, non affiliato a Koin Games.",
  },
  es: {
    title: "Noticias de Origins TCG · OriginsMeta",
    description: "Noticias de Origins TCG en OriginsMeta: notas del parche, eventos, novedades de la demo y del sitio. Sitio de fans no oficial, no afiliado a Koin Games.",
  },
  fr: {
    title: "Actus Origins TCG · OriginsMeta",
    description: "Les actus d'OriginsMeta sur Origins TCG : notes de patch, événements, nouveautés de la démo et du site. Site de fans non officiel, non affilié à Koin Games.",
  },
};
