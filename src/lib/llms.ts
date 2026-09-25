import { siteUrl } from "./i18n";
import { cards, cardsVerified, latestPatch, patchLabel, patches, type Card, type PatchId } from "./data/cards";
import { newsPath, sortedNews, type NewsItem } from "./data/news";
import { getGuides, type Guide } from "./content/guides";
import { authorOfGuide, authorOfNews } from "./data/authors";

/**
 * I due file per i modelli linguistici (Ondata 3 del piano SEO/GEO, 25/09/2026: GEO-04, SCHEDE-16, GUIDE-13).
 *
 * - `/llms.txt` (public/llms.txt) è l'indice scritto a mano: che cos'è il sito, i fatti chiave con la data, le pagine
 *   nelle tre lingue. Due sue sezioni però vengono dai dati, perché non restino indietro dopo una patch o una guida
 *   nuova: "## Legendaries" (una riga per Leggendaria: costo, Potenza/Salute, allineamento, testo, link alla scheda) e
 *   "## Guides" (tutte le guide in inglese con l'estratto). Le scrive `node scripts/llms-txt.mjs` (con `--check` non
 *   scrive e dice solo se il file è allineato), e `llms.test.ts` fallisce se il file non è allineato ai dati (il test
 *   gira in `npm test` solo se è elencato nello script "test" di package.json, che nomina i file uno per uno): va
 *   rilanciato dopo ogni patch che tocca una Leggendaria e dopo ogni guida nuova.
 * - `/llms-full.txt` (src/app/llms-full.txt/route.ts) è il testo completo, generato alla build: tutte le guide e le news
 *   in inglese (titolo, date, firma, indirizzo, Markdown pulito), le carte della collezione della Demo 2.0 con il testo
 *   ufficiale e, a parte, le carte create, dette non verificate nel gioco (decisione di Pierluigi del 25/09/2026: il
 *   sito dice che cosa è verificato nel gioco e non nomina la fonte dell'import). "Pulito" vuol dire: niente ancore
 *   `{#…}`, titoli abbassati sotto quelli del documento, link interni assoluti. Le anteprime delle carte non ci sono
 *   perché il Markdown dei testi non le contiene: le aggiunge solo la pagina (Markdown.tsx), nell'HTML.
 *
 * Solo inglese: è la lingua di riferimento del sito, e i modelli la leggono comunque; ogni pagina esiste anche in
 * italiano e spagnolo con lo stesso slug, e il file lo dice. Import relativi, per `node --test`.
 */

/** Percorso di llms-full.txt, lo stesso della rotta. */
export const LLMS_FULL_PATH = "/llms-full.txt";

/** Le sezioni di public/llms.txt scritte dai dati (titolo `## …` esatto). */
export const LLMS_GENERATED = { legendaries: "Legendaries", guides: "Guides" } as const;

const ALIGNMENT: Record<string, string> = { good: "Good", evil: "Evil", neutral: "Neutral" };

/** Data per esteso all'inglese britannico, come nei testi del sito: "21 September 2026". */
export function longDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

/**
 * Le emoji delle statistiche in parole, come le legge chi non vede l'icona: "+1⚔️/+1❤️" → "+1 Power/+1 Health",
 * "[2⚔️/2❤️]" → "[2 Power/2 Health]", "la ⚔️ più bassa" → "the lowest Power". Vale per i testi delle carte e per le
 * tabelle delle guide.
 */
export function statWords(text: string): string {
  return text
    .replace(/(\d?)\u2694\uFE0F?/g, (_, d: string) => (d ? `${d} Power` : "Power"))
    .replace(/(\d?)\u2764\uFE0F?/g, (_, d: string) => (d ? `${d} Health` : "Health"));
}

/** Testo ufficiale di una carta in una riga di testo semplice: statistiche in parole, le righe della carta in frasi. */
export function plainCardText(text: string): string {
  return statWords(text)
    .split(/\s*\n\s*/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (/[.!?:]$/.test(line) ? line : `${line}.`))
    .join(" ");
}

/** Tipo della carta in parole: "Legendary unit", "Spell", "Created card". */
function kindOf(card: Card): string {
  if (card.type === "token") return "Created card";
  const kind = card.type === "spell" ? "spell" : "unit";
  return card.legendary ? `Legendary ${kind}` : kind[0].toUpperCase() + kind.slice(1);
}

/** Indirizzo assoluto della scheda di una carta, in inglese. */
export const cardUrl = (slug: string) => `${siteUrl}/en/cards/${slug}`;

/**
 * Una riga per carta, uguale in llms.txt e in llms-full.txt: nome con il link alla scheda, tipo, costo, statistiche,
 * allineamento e testo ufficiale inglese (quello letto nel gioco quando c'è, vedi cards.ts).
 */
export function cardLine(card: Card): string {
  const facts = [kindOf(card)];
  if (card.mana !== undefined) facts.push(`${card.mana} mana`);
  if (card.power !== undefined && card.health !== undefined) facts.push(`${card.power} Power / ${card.health} Health`);
  if (card.alignment) facts.push(ALIGNMENT[card.alignment] ?? card.alignment);
  const text = card.ability?.en?.trim() && card.ability.en.trim() !== "-" ? plainCardText(card.ability.en) : "No ability.";
  return `- [${card.name}](${cardUrl(card.slug)}): ${facts.join(", ")}. ${text}`;
}

const byName = (a: Card, b: Card) => a.name.localeCompare(b.name, "en");

/** Le Leggendarie in gioco nella Demo 2.0, in ordine alfabetico. */
export function activeLegendaries(list: readonly Card[] = cards): Card[] {
  return list.filter((c) => c.status === "active" && c.legendary && c.type !== "token").sort(byName);
}

/**
 * Patch dei dati delle carte, detta per esteso e senza ripetere la data: "demo patch of 21 September 2026" per le patch
 * della demo senza numero di versione (id `demo-…`, etichetta "Demo · 21 Sep"), "patch 0.6.3 of 27 August 2026" per
 * quelle con il numero.
 */
export function patchLine(id: PatchId = latestPatch): string {
  const date = longDate(patches[id].date);
  if (/^\d+(?:\.\d+)+$/.test(id)) return `patch ${id} of ${date}`;
  return id.startsWith("demo-") ? `demo patch of ${date}` : `patch of ${date} (${patchLabel(id, "en")})`;
}

/**
 * Markdown di una guida o di una news pronto per llms-full.txt: via le ancore `{#…}` dei titoli, titoli abbassati di
 * `depth` livelli (il documento ha già `#`, `##` e `###`), link interni resi assoluti, statistiche in parole
 * (`statWords`), righe vuote ripetute ridotte.
 */
export function cleanMarkdown(md: string, depth = 2): string {
  return statWords(md)
    .replace(/\r\n/g, "\n")
    .replace(/^(#{1,6}[ \t].*?)[ \t]*\{#[A-Za-z0-9_-]+\}[ \t]*$/gm, "$1")
    .replace(/^(#{1,6})(?=[ \t])/gm, (hashes: string) => "#".repeat(Math.min(6, hashes.length + depth)))
    .replace(/\]\((\/[^)\s]*)\)/g, (_, path: string) => `](${siteUrl}${path})`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Domande e risposte in fondo a un testo, in righe "Q:" / "A:". */
function qa(list: { q: string; a: string }[] | undefined): string[] {
  if (!list?.length) return [];
  return ["Questions and answers:", "", ...list.flatMap((f) => [`Q: ${f.q}`, `A: ${f.a}`, ""])];
}

function guideBlock(g: Guide): string {
  const dates = [g.published ? `Published: ${longDate(g.published)}` : undefined, `Updated: ${longDate(g.updated)}`, `By ${authorOfGuide(g).name}`];
  const deck = g.deckList?.length
    ? [
        `Deck list: ${g.deckList
          .map((s, i) => {
            const name = cards.find((c) => c.slug === s)?.name ?? s;
            return i === 0 ? `${name} (Legendary)` : name;
          })
          .join(", ")}.`,
        "",
      ]
    : [];
  return [`### ${g.title}`, "", `URL: ${siteUrl}/en/guides/${g.slug}`, dates.filter(Boolean).join(" · "), "", g.excerpt, "", ...deck, cleanMarkdown(g.body), "", ...qa(g.faq)]
    .join("\n")
    .trim();
}

function newsBlock(n: NewsItem): string {
  const dates = [`Published: ${longDate(n.date)}`, n.updated && n.updated !== n.date ? `Updated: ${longDate(n.updated)}` : undefined, `By ${authorOfNews(n).name}`];
  // la fonte come la mostra la pagina: post ufficiale o stampa; per un mazzo la sua scheda; le novità del sito nessuna.
  // `url` può mancare (con il ritiro della fonte dell'import, 25/09/2026, una news di stampa è rimasta senza fonte
  // pubblica da citare): allora niente riga "Source", come sulla pagina, che non mostra nessun link "Fonte".
  const url: string | undefined = n.url;
  const source = !url
    ? undefined
    : n.source === "steam" || n.source === "press"
      ? `Source: ${url}`
      : (n.source === "community" || n.source === "staff") && url.startsWith("/")
        ? `Deck page: ${siteUrl}/en${url}`
        : undefined;
  const body = n.body?.en ? cleanMarkdown(n.body.en) : "";
  return [
    `### ${n.title.en}`,
    "",
    `URL: ${siteUrl}/en${newsPath(n)}`,
    dates.filter(Boolean).join(" · "),
    ...(source ? [source] : []),
    "",
    n.summary.en,
    "",
    ...(body ? [body, ""] : []),
    ...qa(n.faq?.en),
  ]
    .join("\n")
    .trim();
}

export type LlmsFullData = { guides: Guide[]; news: NewsItem[]; cards: readonly Card[] };

/** Titolo della sezione delle carte create in llms-full.txt: fuori dalle carte della Demo 2.0, dette non verificate. */
export const CREATED_TITLE = "Created cards, not checked in the game";

/** Il testo completo di llms-full.txt. Funzione pura sui dati passati: la rotta le dà quelli veri. */
export function llmsFullText(data: LlmsFullData): string {
  const inPlay = data.cards.filter((c) => c.status === "active" && c.type !== "token");
  const created = data.cards.filter((c) => c.status === "active" && c.type === "token").sort(byName);
  const legendaries = activeLegendaries(data.cards);
  const units = inPlay.filter((c) => !c.legendary && c.type === "unit").sort(byName);
  const spells = inPlay.filter((c) => !c.legendary && c.type === "spell").sort(byName);
  const cardSection = (title: string, list: Card[], intro?: string) => [`### ${title} (${list.length})`, "", ...(intro ? [intro, ""] : []), ...list.map(cardLine), ""];

  const lines = [
    "# OriginsMeta: full text",
    "",
    "> Every guide and news article of OriginsMeta in English, as plain Markdown, followed by every card of the Origins TCG Demo 2.0 collection with its official English text, plus the created cards (not checked in the game). OriginsMeta is an unofficial fan site about Origins TCG, the digital trading card game by Koin Games, and is not affiliated with Koin Games.",
    "",
    `- Short index: ${siteUrl}/llms.txt`,
    `- Generated from the site's data at every deploy: ${data.guides.length} guides, ${data.news.length} news articles, ${inPlay.length} cards of the Demo 2.0 collection and ${created.length} created cards.`,
    `- Card data: latest patch (${patchLine()}); the ${cardsVerified.count} cards of the Demo 2.0 collection were checked one by one in the game on ${longDate(cardsVerified.date)}. Created cards are not in the game's collection, so they have not been checked in the game.`,
    "- Every guide and article is also on the site in Italian (/it/) and Spanish (/es/), with the same slug.",
    "- For rules, dates and announcements the official sources win: the Steam pages of Origins TCG, Koin Games' posts and the official Discord.",
    "- Card art and card text © Koin Games.",
    "",
    "## Guides",
    "",
    ...data.guides.flatMap((g) => [guideBlock(g), ""]),
    "## News",
    "",
    ...data.news.flatMap((n) => [newsBlock(n), ""]),
    "## Cards",
    "",
    `The ${inPlay.length} cards of the Demo 2.0 collection, checked in the game on ${longDate(cardsVerified.date)}, then the created cards. One Legendary plus twelve different base cards, each played in two copies, make a 25-card deck. Power is the damage a unit deals, Health the damage it can take.`,
    "",
    ...cardSection("Demo 2.0 Legendaries", legendaries),
    ...cardSection("Demo 2.0 units", units),
    ...cardSection("Demo 2.0 spells", spells),
    ...cardSection(
      CREATED_TITLE,
      created,
      "Cards that other cards create during a match (Van Helsing's Tools, Zombie…). They are not in the game's collection, so their stats and texts have not been checked in the game, and they are not counted among the Demo 2.0 cards above.",
    ),
  ];
  // statistiche in parole anche in riassunti, estratti e risposte, non solo nel Markdown dei testi
  return `${statWords(lines.join("\n")).replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

/** llms-full.txt con i dati veri del sito: guide nell'ordine della pagina /guides, news dalla più recente. */
export function llmsFull(): string {
  return llmsFullText({ guides: getGuides("en"), news: sortedNews, cards });
}

/* ---------- le sezioni di public/llms.txt scritte dai dati ---------- */

/** Corpo di "## Legendaries": una riga per Leggendaria in gioco. */
export function legendariesSection(list: readonly Card[] = cards): string {
  const legendaries = activeLegendaries(list);
  return [
    `The ${legendaries.length} Legendaries of the Demo 2.0: every deck is led by one of them. Data of the latest patch (${patchLine()}). Each card page is also in Italian (/it/cards/…) and Spanish (/es/cards/…) with the same slug, the official text in that language and the balance history.`,
    "",
    ...legendaries.map(cardLine),
  ].join("\n");
}

/**
 * Ordine delle guide in llms.txt: prima quelle sul gioco, sugli eventi e sull'economia (le domande di chi arriva dal
 * nome del gioco), poi le guide ai mazzi; dentro ogni gruppo l'ordine della pagina /guides.
 */
const CATEGORY_ORDER: Guide["category"][] = ["game", "events", "rank", "economy", "archetypes", "decks", "interviews"];

/** Corpo di "## Guides": tutte le guide in inglese, con l'estratto. */
export function guidesSection(guides: Guide[] = getGuides("en")): string {
  const rank = (g: Guide) => {
    const i = CATEGORY_ORDER.indexOf(g.category);
    return i < 0 ? CATEGORY_ORDER.length : i;
  };
  const ordered = guides.map((g, i) => ({ g, i })).sort((a, b) => rank(a.g) - rank(b.g) || a.i - b.i);
  return [
    "Every OriginsMeta guide in English, the game first and then the deck guides; each one is also in Italian (/it/guides/…) and Spanish (/es/guides/…) with the same slug.",
    "",
    ...ordered.map(({ g }) => `- [${g.title}](${siteUrl}/en/guides/${g.slug}): ${g.excerpt}`),
  ].join("\n");
}

/**
 * Sostituisce il corpo di una sezione `## titolo` di un testo Markdown, fino alla sezione `## ` successiva. La sezione
 * deve esistere: la aggiunge chi scrive llms.txt, dove vuole che stia; da lì in poi il contenuto lo danno i dati.
 * Le righe restano con il fine riga del file (CRLF nella copia di lavoro su Windows, LF nel repository).
 */
export function replaceSection(text: string, heading: string, body: string): string {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const start = lines.indexOf(`## ${heading}`);
  if (start < 0) throw new Error(`Sezione "## ${heading}" non trovata`);
  let end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  if (end < 0) end = lines.length;
  const tail = end < lines.length ? [""] : [];
  const out = [...lines.slice(0, start + 1), "", ...body.replace(/\r\n/g, "\n").trim().split("\n"), ...tail, ...lines.slice(end)];
  return out.join("\n").replace(/\n*$/, "\n").replace(/\n/g, eol);
}

/** llms.txt con le sezioni generate allineate ai dati di oggi. */
export function syncLlmsTxt(text: string): string {
  return replaceSection(replaceSection(text, LLMS_GENERATED.legendaries, legendariesSection()), LLMS_GENERATED.guides, guidesSection());
}
