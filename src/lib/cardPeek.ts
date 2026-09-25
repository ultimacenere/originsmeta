/**
 * Anteprime delle carte fuori dal testo della pagina (GEO-01 e DECKS-07 dell'analisi SEO/GEO del 25/09/2026).
 *
 * Fino al 25/09/2026 il pannello dell'anteprima (illustrazione, tipo, costo, statistiche e testo della carta) stava
 * nell'HTML in mezzo alla frase, nascosto dal CSS. Chi legge l'HTML senza CSS (GPTBot, ClaudeBot, PerplexityBot, gli
 * estrattori di testo, in parte Google) leggeva "…legends reimagined: Robin Hood Card preview: ★ Robin Hood Unit ·
 * Legendary · Sherwood 8 Mana…": fino al 47% delle parole di una guida e il 69% di /decks erano testi di carte ripetuti.
 * Ora nell'HTML resta solo il link con il nome della carta (il collegamento interno non cambia); i dati del pannello
 * stanno in un attributo `data-peek` (JSON: un attributo non è testo della pagina) e il pannello lo crea il browser la
 * prima volta che il mouse passa sulla carta o il nome riceve il focus (`CardMentionEdges`), nello stesso posto e con
 * le stesse classi di prima: CSS di globals.css, correzione ai bordi e comportamento su touch restano quelli di sempre.
 *
 * Perché un attributo per elemento e non un JSON unico per pagina: vale allo stesso modo per l'HTML del Markdown (news
 * e guide), per i componenti server (`CardMentions`, `CardChip`) e per quelli client (`DeckExplorer`, `DeckBuilder`,
 * `TierExplorer`, `TierListMaker`), resta attaccato all'elemento con la navigazione lato client e i rimontaggi di
 * React, e non c'è un registro di pagina da tenere allineato. Nei testi (Markdown e `CardMentions`) i dati stanno solo
 * sulla prima menzione di ogni carta; le anteprime di `CardPeek` li portano ognuna, perché le liste dei componenti
 * client si filtrano e la prima copia può sparire.
 *
 * Qui ci sono solo parti pure, condivise fra server e browser e provate da `cardPeek.test.ts`: i dati dei due
 * pannelli, la menzione in HTML per il Markdown, l'espressione dei link alle carte e i costruttori dei pannelli.
 * Nessun import: il database carte resta fuori dal bundle client.
 */

/** Il minimo che serve all'anteprima di `CardPeek`: `BuilderCard` lo soddisfa già, `CardChip` lo ricava dalla carta. */
export type PeekCard = {
  name: string;
  legendary?: boolean;
  mana?: number;
  power?: number;
  health?: number;
  /** carta ufficiale intera (480 px) */
  image?: string;
  /** stessa carta a 160 px, se manca quella grande */
  thumb?: string;
  /** testo dell'abilità già nella lingua della pagina */
  ability?: string;
  typeLabel?: string;
  alignment?: "good" | "evil" | "neutral";
  alignmentLabel?: string;
};

/** C'è qualcosa da mostrare? Le carte inserite a mano (senza testo, statistiche né immagine) non hanno anteprima. */
export function hasPeek(card: PeekCard): boolean {
  return Boolean(card.ability || card.power !== undefined || card.image || card.thumb);
}

/** Dati del pannello `.deck-peek` (chip, elenco dei mazzi, righe del deck builder, tier list), già nella lingua della pagina. */
export type DeckPeek = {
  name: string;
  legendary?: boolean;
  /** carta intera, o la miniatura se manca */
  art?: string;
  mana?: number;
  /** potenza e salute già scritte: "4 / 4" */
  stats?: string;
  type?: string;
  align?: "good" | "evil" | "neutral";
  alignLabel?: string;
  ability?: string;
};

/** Solo i campi che il pannello mostra: `BuilderCard` e le carte dei mazzi portano altro che nell'attributo non serve. */
export function deckPeekOf(card: PeekCard): DeckPeek {
  const align = card.alignmentLabel && card.alignment ? card.alignment : undefined;
  return {
    name: card.name,
    legendary: card.legendary || undefined,
    art: card.image ?? card.thumb,
    mana: card.mana,
    stats: card.power !== undefined ? `${card.power} / ${card.health ?? "?"}` : undefined,
    type: card.typeLabel || undefined,
    align,
    alignLabel: align ? card.alignmentLabel : undefined,
    ability: card.ability || undefined,
  };
}

/** Dati del pannello `.card-mention-preview` (nomi di carta nei testi), già nella lingua della pagina. */
export type MentionPeek = {
  name: string;
  legendary?: boolean;
  art?: string;
  /** iniziali al posto dell'illustrazione, quando manca */
  initials?: string;
  /** riga del tipo: "Unità · Leggendaria · Sherwood" */
  kicker: string;
  mana?: number;
  /** potenza e salute già scritte: "4/4" */
  stats?: string;
  ability?: string;
  /** etichette nella lingua della pagina, solo quelle che il pannello usa */
  labels: { preview: string; mana?: string; stats?: string; unknown?: string };
};

/** Legge `data-peek`; `null` se manca o non è un JSON con un nome (il pannello allora non si apre, il link resta). */
export function readPeek<T extends { name: string }>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    return data && typeof data === "object" && typeof (data as { name?: unknown }).name === "string" ? (data as T) : null;
  } catch {
    return null;
  }
}

/** Escape per testo e attributi dell'HTML costruito a mano. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * Menzione in HTML per il Markdown di news e guide: nel testo solo il link con il nome, i dati del pannello
 * nell'attributo. `linkHtml` è il testo del link già convertito da `marked` (quindi già escapato), `peekJson` il
 * JSON di `MentionPeek`: si scrive solo alla prima menzione di una carta in un testo (una guida cita la stessa carta
 * anche dieci volte), le altre lo prendono da quella con lo stesso `href` (`CardMentionEdges`).
 * `aria-describedby` lo aggiunge il browser quando crea il pannello: un riferimento a un id che non esiste ancora
 * sarebbe un errore di accessibilità.
 */
export function mentionHtml(href: string, linkHtml: string, peekJson?: string): string {
  const data = peekJson ? ` data-peek="${escapeHtml(peekJson)}"` : "";
  return `<span class="card-mention"${data}><a href="${escapeHtml(href)}" class="card-mention-link">${linkHtml}</a></span>`;
}

/**
 * Link a una scheda carta nell'HTML di `marked`, in tutte le lingue del sito (`locales` di i18n.ts: prima le lingue
 * erano scritte a mano, `en|it`, e le guide e le news spagnole restavano senza anteprime, RIV-03 ed ES-12).
 * Gruppi: slug, testo del link, stella della Leggendaria scritta dopo il nome.
 */
export function cardLinkPattern(locales: readonly string[]): RegExp {
  return new RegExp(`<a href="/(?:${locales.join("|")})/cards/([a-z0-9-]+)">([^<]*)</a>(\\s*★)?`, "g");
}

/*
  Costruttori dei pannelli, usati nel browser da `CardMentionEdges`. Markup e classi sono quelli che fino al
  25/09/2026 arrivavano già pronti dal server (CardMentions.tsx e CardPeek.tsx), così gli stili `.card-mention*` e
  `.deck-peek*` di globals.css non cambiano. Solo `textContent` e attributi: niente HTML interpretato.
*/
const KICKER = "kicker block text-[0.62rem] text-pale-muted";
const MANA_PILL = "stat-pill bg-mint font-bold text-ink";
const STAT_PILL = "stat-pill bg-night-3 text-pale";
const UNKNOWN = "block font-mono text-[11px] text-pale-muted";

type Child = Node | string;

function el(doc: Document, tag: string, className: string, ...children: Child[]): HTMLElement {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

/** Elemento con attributi, nell'ordine dato (le immagini: `loading` prima di `src`, così la pigrizia vale da subito). */
function withAttrs<T extends Element>(node: T, attrs: [string, string][]): T {
  for (const [name, value] of attrs) node.setAttribute(name, value);
  return node;
}

function star(doc: Document): HTMLElement {
  return withAttrs(el(doc, "span", "legendary-star", "★"), [["aria-hidden", "true"]]);
}

function art(doc: Document, className: string, src: string): HTMLElement {
  return withAttrs(el(doc, "img", className), [
    ["alt", ""],
    ["loading", "lazy"],
    ["decoding", "async"],
    ["src", src],
  ]);
}

/** Pannello `.card-mention-preview` di un nome di carta nel testo; `id` è quello che il link cita in `aria-describedby`. */
export function buildMentionPreview(doc: Document, d: MentionPeek, id: string): HTMLElement {
  const leg = d.legendary ? " is-legendary" : "";
  const picture = d.art ? art(doc, "", d.art) : withAttrs(el(doc, "span", "card-mention-art-empty", d.initials ?? ""), [["aria-hidden", "true"]]);
  const hasStats = d.mana !== undefined || d.stats !== undefined;
  const stats = hasStats
    ? el(
        doc,
        "span",
        "card-mention-stats",
        ...(d.mana !== undefined ? [el(doc, "span", MANA_PILL, `${d.mana} `, el(doc, "small", "", d.labels.mana ?? ""))] : []),
        ...(d.stats !== undefined ? [el(doc, "span", STAT_PILL, `${d.stats} `, el(doc, "small", "", d.labels.stats ?? ""))] : []),
      )
    : el(doc, "span", UNKNOWN, d.labels.unknown ?? "");
  const body = el(
    doc,
    "span",
    "card-mention-body",
    el(doc, "span", "card-mention-name", ...(d.legendary ? [star(doc)] : []), d.name),
    el(doc, "span", KICKER, d.kicker),
    stats,
    ...(d.ability ? [el(doc, "span", "card-mention-text", d.ability)] : []),
  );
  const panel = el(doc, "span", `card-mention-panel${leg}`, el(doc, "span", "sr-only", `${d.labels.preview}: `), el(doc, "span", `card-mention-art${leg}`, picture), body);
  return withAttrs(el(doc, "span", "card-mention-preview", panel), [
    ["role", "tooltip"],
    ["id", id],
  ]);
}

/** Contenuto del segnaposto `.deck-peek` di `CardPeek`: metà carta, metà nome, costo, statistiche, tipo, allineamento e testo. */
export function buildDeckPeek(doc: Document, d: DeckPeek): HTMLElement {
  const tags = el(
    doc,
    "span",
    "deck-peek-tags",
    ...(d.stats !== undefined ? [el(doc, "span", "deck-peek-stats", d.stats)] : []),
    ...(d.type ? [el(doc, "span", "deck-peek-type", d.type)] : []),
    ...(d.align && d.alignLabel ? [el(doc, "span", `deck-peek-align is-${d.align}`, d.alignLabel)] : []),
  );
  const body = el(
    doc,
    "span",
    "deck-peek-body",
    el(
      doc,
      "span",
      "flex items-start gap-2",
      ...(d.mana !== undefined ? [el(doc, "span", "deck-peek-mana shrink-0", String(d.mana))] : []),
      el(doc, "span", "deck-peek-name min-w-0 self-center", ...(d.legendary ? [star(doc)] : []), d.name),
    ),
    tags,
    ...(d.ability ? [el(doc, "span", "deck-peek-text", d.ability)] : []),
  );
  return el(doc, "span", `deck-peek-panel${d.legendary ? " is-legendary" : ""}`, ...(d.art ? [art(doc, "deck-peek-art", d.art)] : []), body);
}
