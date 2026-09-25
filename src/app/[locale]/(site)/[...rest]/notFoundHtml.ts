import type { Locale } from "@/lib/i18n";

/**
 * La pagina 404 degli indirizzi che non esistono dentro le lingue (/es/pagina-inesistente, /it/cards/a/b…), scritta
 * come HTML completo dalla route accanto (RIV-02, TOOL-10: Ondata 1 del 25/09/2026). Funzioni pure, senza import
 * di dati: il comando dei test è in cima a `notFoundHtml.test.ts`.
 *
 * Perché non una pagina React: in Next 16.3 un `notFound()` lanciato da una pagina fa fallire la shell del rendering
 * sul server, e l'HTML diventa il guscio `<html id="__next_error__">` senza lang, senza H1 e senza testo (la 404
 * vera la disegna solo il browser, con JavaScript). Qui invece arrivano nell'HTML la lingua, il titolo, il testo, i
 * link e la dicitura "non affiliato a Koin Games"; un solo meta robots (noindex), nessun canonical né hreflang.
 */

/** Titolo neutro delle 404 (scheda del browser, anteprime): vale per carte, news, mazzi, profili e tornei. */
export const NOT_FOUND_TITLE: Record<Locale, string> = {
  en: "Page not found",
  it: "Pagina non trovata",
  es: "Página no encontrada",
};

/** "404 · Pagina non trovata · OriginsMeta": lo stesso titolo per le 404 di questa route e per quelle di notFound(). */
export function notFoundTitle(locale: Locale): string {
  return `404 · ${NOT_FOUND_TITLE[locale]} · OriginsMeta`;
}

/** Un blocco di testo con la sua lingua: fuori dalle lingue del sito ce n'è uno per lingua, come in global-not-found. */
export type NotFoundBlock = { lang: string; heading: string; text: string };

export type NotFoundLink = { href: string; label: string; primary?: boolean };

export type NotFoundPage = {
  lang: string;
  title: string;
  description: string;
  blocks: NotFoundBlock[];
  /** I tasti sotto il testo: home e database delle carte, oppure le tre lingue. */
  actions: NotFoundLink[];
  /** La riga di navigazione al posto dell'header, che qui non c'è. */
  nav: NotFoundLink[];
  /** La dicitura del footer ("non affiliato a Koin Games"), che non si toglie mai. */
  disclaimer: string;
};

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Testo sicuro dentro l'HTML e negli attributi. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

/*
  Colori della palette "ink & mint" (token di globals.css): sfondo felt, pannello blu notte con cornice celeste piena
  da 3 px, titolo celeste, testo grigio chiaro, link menta, tasto primario col gradiente --grad-ig e testo bianco.
  Font di sistema: quelli del sito arrivano da next/font, che una route non carica.
*/
const STYLE = [
  ":root{color-scheme:dark}",
  "*{box-sizing:border-box}",
  'body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:32px 16px;background:#150c2c;color:#d9dfe8;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
  "main{width:100%;max-width:36rem;padding:32px 24px;text-align:center;border:3px solid #3fc4e8;border-radius:16px;background:linear-gradient(180deg,#182238 0%,#121a2c 100%);color:#c8d1dd}",
  ".k{margin:0;font:600 .74rem/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;color:#31e3bd}",
  "h1,.h{margin:8px 0 0;font-size:1.6rem;line-height:1.25;font-weight:800;color:#3fc4e8}",
  ".h{margin-top:20px;font-size:1.1rem}",
  "p{margin:12px 0 0}",
  ".a{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:24px}",
  ".b{display:inline-flex;padding:10px 20px;border:2px solid #96a3b9;border-radius:999px;font-weight:700;font-size:.9rem;color:#d9dfe8;text-decoration:none}",
  ".b.p{border-color:transparent;background:linear-gradient(45deg,#f09433 0%,#e6683c 18%,#dc2743 40%,#cc2366 60%,#bc1888 80%,#833ab4 100%);color:#fff}",
  ".b:hover{border-color:#31e3bd}",
  "a:focus-visible{outline:2px solid #31e3bd;outline-offset:2px}",
  "nav{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 16px;font-size:.9rem}",
  "nav a{color:#31e3bd}",
  "footer{max-width:36rem;text-align:center;font-size:.8rem;color:#96a3b9}",
].join("");

const anchor = (l: NotFoundLink, cls?: string) => `<a${cls ? ` class="${cls}"` : ""} href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`;

/** L'HTML completo della 404: `<html lang>`, un solo meta robots (noindex), nessun canonical né hreflang. */
export function notFoundHtml(page: NotFoundPage): string {
  const blocks = page.blocks
    .map((b, i) => {
      // il primo titolo è l'H1; quelli delle altre lingue sono paragrafi con la stessa grafia, più piccoli
      const lang = b.lang === page.lang ? "" : ` lang="${escapeHtml(b.lang)}"`;
      const heading = i === 0 ? `<h1${lang}>${escapeHtml(b.heading)}</h1>` : `<p class="h"${lang}>${escapeHtml(b.heading)}</p>`;
      return `${heading}<p${lang}>${escapeHtml(b.text)}</p>`;
    })
    .join("");
  const actions = page.actions.map((a) => anchor(a, a.primary ? "b p" : "b")).join("");
  const nav = page.nav.map((n) => anchor(n)).join("");
  return [
    "<!DOCTYPE html>",
    `<html lang="${escapeHtml(page.lang)}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    '<meta name="robots" content="noindex">',
    '<link rel="icon" href="/icon.svg" type="image/svg+xml">',
    `<style>${STYLE}</style>`,
    "</head>",
    "<body>",
    `<main><p class="k">404</p>${blocks}<p class="a">${actions}</p></main>`,
    nav ? `<nav>${nav}</nav>` : "",
    `<footer>${escapeHtml(page.disclaimer)}</footer>`,
    "</body>",
    "</html>",
  ].join("");
}
