/**
 * Test delle anteprime delle carte fuori dal testo (`cardPeek.ts`, GEO-01) con il runner integrato di Node:
 * `node --test src/lib/cardPeek.test.ts`. Come per gli altri test, l'import ha l'estensione `.ts`.
 *
 * Controlla che i pannelli costruiti nel browser siano identici a quelli che fino al 25/09/2026 arrivavano dal server
 * (stesse classi, stesso annidamento: gli stili di globals.css non cambiano), che le trasformazioni usate davvero da
 * `Markdown.tsx` (`linkMentionsInHtml`) e da `CardMentions.tsx` (`mentionParts`) lascino nel testo, nelle tre lingue,
 * la frase dell'autore parola per parola, e misura su un paragrafo quante parole erano anteprime prima e quante ora.
 * Niente jsdom (nessuna dipendenza nuova): basta un documento finto che sa creare elementi e scriverli in HTML.
 * Dati delle carte: quelli del database del sito al 25/09/2026 (Robin Hood, En Passant, Barry, Mulan).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildDeckPeek,
  buildMentionPreview,
  cardLinkPattern,
  deckPeekOf,
  hasPeek,
  linkMentionsInHtml,
  mentionDescription,
  mentionHtml,
  mentionParts,
  readPeek,
  sharedPeeks,
  type MentionPeek,
  type MentionTarget,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./cardPeek.ts";

/* Documento finto: attributi scritti con `class` per primo e gli altri in ordine alfabetico, così il confronto con il
   markup di prima non dipende dall'ordine in cui il costruttore li imposta. */
const VOID = new Set(["img"]);
class FakeElement {
  tag: string;
  attrs = new Map<string, string>();
  children: (FakeElement | string)[] = [];
  constructor(tag: string) {
    this.tag = tag;
  }
  get className() {
    return this.attrs.get("class") ?? "";
  }
  set className(v: string) {
    this.attrs.set("class", v);
  }
  setAttribute(name: string, value: string) {
    this.attrs.set(name, String(value));
  }
  append(...nodes: (FakeElement | string)[]) {
    this.children.push(...nodes);
  }
  get outerHTML(): string {
    const names = [...this.attrs.keys()].sort((a, b) => (a === "class" ? -1 : b === "class" ? 1 : a.localeCompare(b)));
    const attrs = names.map((n) => ` ${n}="${this.attrs.get(n)!.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`).join("");
    if (VOID.has(this.tag)) return `<${this.tag}${attrs}>`;
    const inner = this.children.map((c) => (typeof c === "string" ? c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : c.outerHTML)).join("");
    return `<${this.tag}${attrs}>${inner}</${this.tag}>`;
  }
}
const doc = { createElement: (tag: string) => new FakeElement(tag) } as unknown as Document;
const html = (el: unknown) => (el as FakeElement).outerHTML;

const robinHood: MentionPeek = {
  name: "Robin Hood",
  legendary: true,
  art: "/cards/robin-hood.webp",
  kicker: "Unit · Legendary · Sherwood",
  mana: 8,
  stats: "4/4",
  ability: "Snipe 3\nOn Reveal: Deal 2 damage to all enemies.",
  labels: { preview: "Card preview", mana: "Mana", stats: "Power/Health" },
};
const enPassant: MentionPeek = {
  name: "En Passant",
  art: "/cards/en-passant.webp",
  kicker: "Spell · Other",
  mana: 3,
  ability: "Move an ally. Deal damage equal to its ⚔️ to the character across from it.",
  labels: { preview: "Card preview", mana: "Mana" },
};

describe("buildMentionPreview: lo stesso pannello che prima mandava il server", () => {
  test("Leggendaria con illustrazione, costo, statistiche e testo", () => {
    assert.equal(
      html(buildMentionPreview(doc, robinHood, "card-peek-1")),
      '<span class="card-mention-preview" id="card-peek-1" role="tooltip"><span class="card-mention-panel is-legendary">' +
        '<span class="sr-only">Card preview: </span><span class="card-mention-art is-legendary"><img alt="" decoding="async" loading="lazy" src="/cards/robin-hood.webp"></span>' +
        '<span class="card-mention-body"><span class="card-mention-name"><span class="legendary-star" aria-hidden="true">★</span>Robin Hood</span>' +
        '<span class="kicker block text-[0.62rem] text-pale-muted">Unit · Legendary · Sherwood</span>' +
        '<span class="card-mention-stats"><span class="stat-pill bg-mint font-bold text-ink">8 <small>Mana</small></span>' +
        '<span class="stat-pill bg-night-3 text-pale">4/4 <small>Power/Health</small></span></span>' +
        '<span class="card-mention-text">Snipe 3\nOn Reveal: Deal 2 damage to all enemies.</span></span></span></span>',
    );
  });
  test("senza illustrazione: le iniziali al suo posto", () => {
    const barry: MentionPeek = { name: "Barry", initials: "B", kicker: "Unit · Myth & folklore", mana: 3, stats: "2/3", labels: { preview: "Card preview", mana: "Mana", stats: "Power/Health" } };
    assert.match(html(buildMentionPreview(doc, barry, "x")), /<span class="card-mention-art"><span class="card-mention-art-empty" aria-hidden="true">B<\/span><\/span>/);
    assert.match(html(buildMentionPreview(doc, barry, "x")), /Unit · Myth &amp; folklore/);
  });
  test("senza statistiche: la riga «statistiche non ancora pubblicate»", () => {
    const bare: MentionPeek = { name: "Carta di prova", kicker: "Unit", labels: { preview: "Card preview", unknown: "stats not yet published" } };
    const out = html(buildMentionPreview(doc, bare, "x"));
    assert.match(out, /<span class="block font-mono text-\[11px\] text-pale-muted">stats not yet published<\/span>/);
    assert.doesNotMatch(out, /card-mention-stats|card-mention-text/);
  });
  test("il testo della carta resta testo: niente HTML interpretato", () => {
    const out = html(buildMentionPreview(doc, { ...enPassant, ability: "<b>x</b>" }, "x"));
    assert.match(out, /&lt;b&gt;x&lt;\/b&gt;/);
  });
});

describe("buildDeckPeek e deckPeekOf: il pannello di CardPeek", () => {
  test("Leggendaria: stesso markup di prima, costo in testa e allineamento", () => {
    const peek = deckPeekOf({
      name: "Robin Hood",
      legendary: true,
      mana: 8,
      power: 4,
      health: 4,
      image: "/cards/robin-hood.webp",
      thumb: "/cards/sm/robin-hood.webp",
      ability: "Snipe 3\nOn Reveal: Deal 2 damage to all enemies.",
      typeLabel: "Unit",
      alignment: "good",
      alignmentLabel: "Good",
    });
    assert.equal(
      html(buildDeckPeek(doc, peek)),
      '<span class="deck-peek-panel is-legendary"><img class="deck-peek-art" alt="" decoding="async" loading="lazy" src="/cards/robin-hood.webp">' +
        '<span class="deck-peek-body"><span class="flex items-start gap-2"><span class="deck-peek-mana shrink-0">8</span>' +
        '<span class="deck-peek-name min-w-0 self-center"><span class="legendary-star" aria-hidden="true">★</span>Robin Hood</span></span>' +
        '<span class="deck-peek-tags"><span class="deck-peek-stats">4 / 4</span><span class="deck-peek-type">Unit</span>' +
        '<span class="deck-peek-align is-good">Good</span></span>' +
        '<span class="deck-peek-text">Snipe 3\nOn Reveal: Deal 2 damage to all enemies.</span></span></span>',
    );
  });
  test("magia senza potenza: niente pastiglia delle statistiche, miniatura se manca la carta intera", () => {
    const peek = deckPeekOf({ name: "En Passant", mana: 3, thumb: "/cards/sm/en-passant.webp", typeLabel: "Spell", alignment: "neutral", alignmentLabel: "Neutral" });
    assert.equal(peek.art, "/cards/sm/en-passant.webp");
    const out = html(buildDeckPeek(doc, peek));
    assert.doesNotMatch(out, /deck-peek-stats|deck-peek-text|legendary-star/);
    assert.match(out, /<span class="deck-peek-panel">/);
  });
  test("nell'attributo solo i campi del pannello, non il resto della carta del builder", () => {
    const builderCard = { name: "Mulan", slug: "mulan", key: "C00001", type: "unit", mana: 4, power: 2, health: 4, ability: "Double Attack", alignment: "good" as const };
    const peek = deckPeekOf(builderCard);
    assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(peek))).sort(), ["ability", "mana", "name", "stats"]);
    assert.equal(peek.align, undefined, "senza etichetta l'allineamento non si mostra, come prima");
  });
  test("hasPeek: le carte inserite a mano senza nulla da mostrare non hanno anteprima", () => {
    assert.equal(hasPeek({ name: "Carta a mano" }), false);
    assert.equal(hasPeek({ name: "Carta a mano", power: 0 }), true);
  });
});

describe("mentionHtml e readPeek", () => {
  const attr = (s: string) => s.match(/data-peek="([^"]*)"/)?.[1]?.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  test("nel testo solo il link con il nome; i dati tornano intatti dall'attributo", () => {
    const tricky = { ...robinHood, ability: `Say "hi" & <go>, it's fine` };
    const out = mentionHtml("/es/cards/robin-hood", "Robin Hood", JSON.stringify(tricky));
    assert.equal(out.replace(/<[^>]+>/g, ""), "Robin Hood");
    assert.match(out, /^<span class="card-mention" data-peek="[^"]*"><a href="\/es\/cards\/robin-hood" class="card-mention-link">Robin Hood<\/a><\/span>$/);
    assert.deepEqual(readPeek<MentionPeek>(attr(out)), tricky);
  });
  test("le menzioni successive della stessa carta non ripetono i dati", () => {
    assert.equal(mentionHtml("/en/cards/robin-hood", "Robin Hood"), '<span class="card-mention"><a href="/en/cards/robin-hood" class="card-mention-link">Robin Hood</a></span>');
  });
  test("dati mancanti o rotti: nessun pannello (il link resta)", () => {
    assert.equal(readPeek(null), null);
    assert.equal(readPeek(""), null);
    assert.equal(readPeek("{rotto"), null);
    assert.equal(readPeek('{"kicker":"senza nome"}'), null);
    assert.equal(readPeek("[1,2]"), null);
  });
});

describe("cardLinkPattern: i link alle schede carta del Markdown nelle tre lingue", () => {
  const re = cardLinkPattern(["en", "it", "es"]);
  const matches = (s: string) => [...s.matchAll(re)].map((m) => [m[1], m[2], m[3] ?? ""]);
  test("en, it ed es, con la stella della Leggendaria scritta dopo", () => {
    assert.deepEqual(matches('<a href="/es/cards/dorothy">Dorothy</a> ★ y <a href="/it/cards/mulan">Mulan</a> e <a href="/en/cards/en-passant">En Passant</a>'), [
      ["dorothy", "Dorothy", " ★"],
      ["mulan", "Mulan", ""],
      ["en-passant", "En Passant", ""],
    ]);
  });
  test("le altre lingue e gli altri percorsi restano link semplici", () => {
    assert.deepEqual(matches('<a href="/fr/cards/mulan">Mulan</a> <a href="/es/decks/mulan">Mulan</a> <a href="https://example.com/es/cards/mulan">Mulan</a>'), []);
  });
});


describe("mentionDescription: la descrizione per i lettori di schermo", () => {
  test("dice quello che dice il pannello, in una frase", () => {
    assert.equal(mentionDescription(robinHood), "Card preview: Robin Hood. Unit · Legendary · Sherwood. 8 Mana, 4/4 Power/Health. Snipe 3 On Reveal: Deal 2 damage to all enemies.");
  });
  test("magia senza potenza e carta senza statistiche", () => {
    assert.equal(mentionDescription(enPassant), "Card preview: En Passant. Spell · Other. 3 Mana. Move an ally. Deal damage equal to its ⚔️ to the character across from it.");
    const bare: MentionPeek = { name: "Carta di prova", kicker: "Unità", labels: { preview: "Anteprima della carta", unknown: "statistiche non ancora pubblicate" } };
    assert.equal(mentionDescription(bare), "Anteprima della carta: Carta di prova. Unità. statistiche non ancora pubblicate");
  });
});

describe("sharedPeeks: su /decks i dati di una carta ripetuta una volta sola", () => {
  const card = (name: string, ability = "x") => ({ name, ability });
  test("la prima copia porta i dati, le altre identiche li citano; le carte senza doppioni restano fuori", () => {
    const a1 = card("Mulan");
    const b = card("Barry");
    const a2 = card("Mulan");
    const a3 = card("Mulan");
    const shares = sharedPeeks([a1, b, a2, a3], (c) => c.name, (c) => JSON.stringify(c));
    assert.equal(shares.get(a1), "first");
    assert.equal(shares.get(a2), "copy");
    assert.equal(shares.get(a3), "copy");
    assert.equal(shares.has(b), false);
  });
  test("stessa carta con dati diversi: porta i suoi; lo stesso oggetto due volte non si cita da solo", () => {
    const a1 = card("Mulan");
    const other = card("Mulan", "altro testo");
    const shares = sharedPeeks([a1, other, a1], (c) => c.name, (c) => JSON.stringify(c));
    assert.equal(shares.size, 0);
  });
});

/* Menzioni del Markdown (`linkMentionsInHtml`) e dei testi della community (`mentionParts`) con una ricerca finta al
   posto del database: le stesse funzioni che usano `Markdown.tsx` e `CardMentions.tsx`. */
const mulan: MentionPeek = { name: "Mulan", kicker: "Unit · Myth & folklore", mana: 4, stats: "2/4", labels: { preview: "Card preview", mana: "Mana", stats: "Power/Health" } };
const fixtures: Record<string, { legendary?: boolean; peek: MentionPeek }> = {
  "robin-hood": { legendary: true, peek: robinHood },
  mulan: { peek: mulan },
  "en-passant": { peek: enPassant },
};
function finder(locale: string) {
  const asked: string[] = [];
  const find = (slug: string): MentionTarget | undefined => {
    const f = fixtures[slug];
    if (!f) return undefined;
    const peek = () => {
      asked.push(slug);
      return JSON.stringify(f.peek);
    };
    return { slug, legendary: f.legendary, href: `/${locale}/cards/${slug}`, peek };
  };
  return { find, asked };
}
const LINKS = cardLinkPattern(["en", "it", "es"]);
const textOf = (s: string) => s.replace(/<[^>]+>/g, "");
const dataCount = (s: string) => (s.match(/data-peek=/g) ?? []).length;

/* La frase che definisce il gioco nella guida "Origins TCG explained", nelle tre lingue, come la scrive `marked`. */
const definition: Record<string, string> = {
  en: '<p>Its cast is made of public-domain legends reimagined in one original world: <a href="/en/cards/robin-hood">Robin Hood</a>, <a href="/en/cards/mulan">Mulan</a>, the Queen of Hearts and many more.</p>',
  it: '<p>I personaggi sono leggende di pubblico dominio reinterpretate in un unico mondo originale: <a href="/it/cards/robin-hood">Robin Hood</a>, <a href="/it/cards/mulan">Mulan</a>, la Regina di Cuori e molti altri.</p>',
  es: '<p>Sus personajes son leyendas de dominio público reinventadas en un único mundo original: <a href="/es/cards/robin-hood">Robin Hood</a>, <a href="/es/cards/mulan">Mulan</a>, Queen of Hearts y muchas más.</p>',
};

describe("linkMentionsInHtml: le menzioni del Markdown di news e guide", () => {
  for (const locale of ["en", "it", "es"]) {
    test(`${locale}: nel testo resta la frase dell'autore, i link diventano menzioni con i dati`, () => {
      const { find } = finder(locale);
      const out = linkMentionsInHtml(definition[locale], LINKS, find, "Legendary");
      assert.equal(textOf(out.html), textOf(definition[locale]));
      assert.equal(out.cards, 2);
      assert.equal(dataCount(out.html), 2);
      assert.match(out.html, new RegExp(`<span class="card-mention" data-peek="[^"]*"><a href="/${locale}/cards/robin-hood" class="card-mention-link">Robin Hood</a></span>`));
    });
  }
  test("i dati solo alla prima menzione, i titoli e le carte sconosciute restano come sono", () => {
    const { find, asked } = finder("en");
    const src =
      '<h2 id="x"><a href="/en/cards/robin-hood">Robin Hood</a></h2>' +
      '<p><a href="/en/cards/robin-hood">Robin Hood</a> first, <a href="/en/cards/robin-hood">Robin Hood</a> again and <a href="/en/cards/nessuna">Nessuna</a>.</p>' +
      '<table><tr><td><a href="/en/cards/en-passant">En Passant</a></td></tr></table>';
    const out = linkMentionsInHtml(src, LINKS, find, "Legendary");
    assert.ok(out.html.startsWith('<h2 id="x"><a href="/en/cards/robin-hood">Robin Hood</a></h2>'), "il titolo non cambia");
    assert.match(out.html, /<a href="\/en\/cards\/nessuna">Nessuna<\/a>/);
    assert.equal(dataCount(out.html), 2);
    assert.deepEqual(asked, ["robin-hood", "en-passant"], "i dati si calcolano una volta per carta");
    assert.equal(out.cards, 2);
    assert.equal(textOf(out.html), textOf(src));
  });
  test("la stella scritta dopo una Leggendaria passa davanti, con il testo per i lettori di schermo", () => {
    const { find } = finder("it");
    const out = linkMentionsInHtml('<ul><li><a href="/it/cards/robin-hood">Robin Hood</a> ★</li><li><a href="/it/cards/mulan">Mulan</a> ★</li></ul>', LINKS, find, "Leggendaria");
    assert.match(out.html, /^<ul><li><span class="legendary-star" aria-hidden="true">★<\/span><span class="card-mention" data-peek="[^"]*"><a href="\/it\/cards\/robin-hood"/);
    assert.match(out.html, /<\/a><\/span><span class="sr-only"> \(Leggendaria\)<\/span><\/li>/);
    assert.equal(textOf(out.html), "★Robin Hood (Leggendaria)Mulan ★", "una stella dopo una carta non Leggendaria resta dov'è");
  });
});

describe("mentionParts: le menzioni dei testi della community", () => {
  test("i pezzi rifanno il testo, i dati solo alla prima menzione, le carte sconosciute tornano testo", () => {
    const { find, asked } = finder("es");
    const segments = ["Juega ", { slug: "robin-hood", text: "Robin Hood" }, " y luego ", { slug: "robin-hood", text: "Robin Hood" }, " con ", { slug: "nessuna", text: "Nessuna" }, "."];
    const parts = mentionParts(segments, find);
    assert.equal(parts.map((p) => (typeof p === "string" ? p : p.text)).join(""), "Juega Robin Hood y luego Robin Hood con Nessuna.");
    const mentions = parts.filter((p) => typeof p !== "string");
    assert.equal(mentions.length, 2);
    assert.equal(mentions[0].href, "/es/cards/robin-hood");
    assert.ok(mentions[0].peek && !mentions[1].peek);
    assert.deepEqual(asked, ["robin-hood"]);
  });
});

describe("quota di parole delle anteprime in un paragrafo (misura di GEO-01)", () => {
  // Prima: link + pannello nell'HTML (il pannello di prima è quello di buildMentionPreview, identico per il primo test
  // di questo file). Ora: l'HTML che esce davvero da linkMentionsInHtml, la funzione del Markdown.
  // parole = pezzi con almeno una lettera o una cifra (la virgola dopo un link non è una parola)
  const words = (s: string) =>
    s
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .split(/\s+/)
      .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  for (const locale of ["en", "it", "es"]) {
    test(`${locale}: la frase che definisce il gioco`, (t) => {
      const src = definition[locale];
      let n = 0;
      const before = src.replace(
        LINKS,
        (_m, slug: string, text: string) =>
          `<span class="card-mention"><a href="/${locale}/cards/${slug}" class="card-mention-link">${text}</a>${html(buildMentionPreview(doc, fixtures[slug].peek, `m${++n}`))}</span>`,
      );
      const after = linkMentionsInHtml(src, LINKS, finder(locale).find, "Legendary").html;
      const share = (s: string) => 1 - words(src) / words(s);
      t.diagnostic(`parole: prima ${words(before)} (anteprime ${Math.round(share(before) * 100)}%), ora ${words(after)} (anteprime ${Math.round(share(after) * 100)}%)`);
      assert.ok(share(before) > 0.5, "prima più di metà delle parole erano anteprime");
      assert.equal(words(after), words(src));
    });
  }
});
