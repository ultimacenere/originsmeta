/**
 * Test del Kickstarter della Alpha Edition (26/10/2026): `node --test src/lib/kickstarter.test.ts`.
 * Il link di ogni tasto porta il nostro codice referral; promozione ed etichetta del tasto dipendono dalle date; i testi
 * delle sette lingue hanno la stessa forma dell'inglese, gli stessi segnaposto, la dichiarazione del link referral, la
 * dicitura "non affiliato" e titolo e description nei limiti di Google (regole di `pageTitle` e `cleanDescription` in
 * page.ts, che qui non si importa perché carica Next: come in hubMeta.test.ts).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  KICKSTARTER_PROJECT_URL,
  KICKSTARTER_PROMO_UNTIL,
  KICKSTARTER_REF,
  KICKSTARTER_URL,
  PULL_RATES,
  kickstarterLive,
  kickstarterPromoActive,
  kickstarterSliderPinned,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./kickstarter.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en } from "./kickstarterLabels-en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it } from "./kickstarterLabels-it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es } from "./kickstarterLabels-es.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { fr } from "./kickstarterLabels-fr.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { pt } from "./kickstarterLabels-pt.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { de } from "./kickstarterLabels-de.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { ru } from "./kickstarterLabels-ru.ts";

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { KICKSTARTER_TIERS, KICKSTARTER_TIERS_PUBLIC, formatUsd, tierRange } from "./kickstarterTiers.ts";
import {
  KICKSTARTER_BOX_TOTAL,
  KICKSTARTER_GOALS_REACHED_USD,
  KICKSTARTER_PROMOS,
  KICKSTARTER_PROMOS_READ,
  promoUnlocked,
  promosOf,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./kickstarterPromos.ts";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const all = { en, it, es, fr, pt, de, ru } as Record<string, unknown>;

describe("livelli della campagna", () => {
  type Tier = { name: string; usd: number; packs: number; items: string[]; verify?: string };
  const tiers = KICKSTARTER_TIERS as readonly Tier[];
  test("non si accendono finché un dato delle schede è da verificare", () => {
    if (KICKSTARTER_TIERS_PUBLIC) assert.deepEqual(tiers.filter((t) => t.verify).map((t) => t.name), []);
  });
  test("dal più economico, con pacchetti e contenuti", () => {
    assert.deepEqual(tiers.map((t) => t.usd), [...tiers.map((t) => t.usd)].sort((a, b) => a - b));
    for (const t of tiers) {
      assert.ok(t.packs > 0 && t.items.length > 0, t.name);
      assert.equal(new Set(t.items).size, t.items.length, `${t.name}: contenuti doppi`);
    }
    assert.deepEqual(tierRange(), { min: 24, max: 9999 });
  });
  test("prezzi in dollari nel formato della lingua", () => {
    assert.equal(formatUsd("en", 2499), "$2,499");
    // in italiano "24 USD" con lo spazio insecabile
    assert.match(formatUsd("it", 24), /^24\sUSD$/);
  });
  test("la seconda domanda delle FAQ è quella sul prezzo (la pagina la sostituisce con la forbice vera)", () => {
    for (const [locale, labels] of Object.entries(all)) {
      const l = labels as typeof en;
      assert.match(l.faq.items[1].a, /Koin/, `${locale}: la risposta provvisoria parla dei prezzi che pubblica Koin`);
      assert.match(l.tiers.faq, /\{min\}.*\{max\}/, `${locale}: forbice dei prezzi`);
    }
  });
});

/** Le foglie di un oggetto di testi: percorso → stringa (gli array con l'indice). */
function leaves(value: unknown, path = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof value === "string") out.set(path, value);
  else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, `${path}[${i}]`).forEach((s, p) => out.set(p, s)));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) leaves(v, path ? `${path}.${k}` : k).forEach((s, p) => out.set(p, s));
  return out;
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("link e date", () => {
  test("il link dei tasti è la campagna con il nostro codice referral", () => {
    assert.equal(KICKSTARTER_URL, `${KICKSTARTER_PROJECT_URL}?ref=${KICKSTARTER_REF}`);
    assert.match(KICKSTARTER_URL, /^https:\/\/www\.kickstarter\.com\/projects\/koingames\/origins-trading-card-game-alpha-edition\?ref=8h9kwh$/);
  });
  test("la promozione senza data di fine resta accesa, con la data si spegne alla fine", () => {
    assert.equal(kickstarterPromoActive(new Date("2027-06-01T00:00:00Z"), null), true);
    assert.equal(kickstarterPromoActive(new Date("2026-11-20T10:00:00Z"), "2026-11-20T12:00:00Z"), true);
    assert.equal(kickstarterPromoActive(new Date("2026-11-20T12:00:00Z"), "2026-11-20T12:00:00Z"), false);
  });
  test("lo slider della home resta fermo sulla slide del Kickstarter fino alla sua data, mai oltre la promozione", () => {
    assert.equal(kickstarterSliderPinned(new Date("2027-06-01T00:00:00Z"), null, null), true);
    assert.equal(kickstarterSliderPinned(new Date("2026-11-01T10:00:00Z"), "2026-11-01T12:00:00Z", null), true);
    assert.equal(kickstarterSliderPinned(new Date("2026-11-01T12:00:00Z"), "2026-11-01T12:00:00Z", null), false);
    assert.equal(kickstarterSliderPinned(new Date("2026-11-20T12:00:00Z"), null, "2026-11-20T12:00:00Z"), false);
  });
  test("il tasto dice Scegli la tua ricompensa Alpha dalla mezzanotte del 27 ottobre sulla costa est", () => {
    assert.equal(kickstarterLive(new Date("2026-10-27T03:59:59Z")), false);
    assert.equal(kickstarterLive(new Date("2026-10-27T04:00:00Z")), true);
  });
  test("le probabilità sono in ordine dalla più comune alla più rara", () => {
    const n = PULL_RATES.map((r: { every?: boolean; n?: number }) => (r.every ? 1 : (r.n ?? 0)));
    assert.deepEqual(n, [...n].sort((a, b) => a - b));
    assert.equal(PULL_RATES.at(-1)?.tier, "Storybook");
  });
});

describe("promo Alpha (30/10/2026)", () => {
  type Promo = { name: string; card: string; image: string; artist: string; group: "box" | "golden" | "oz" | "profile"; goal?: number; signed?: true };
  const promos = KICKSTARTER_PROMOS as readonly Promo[];
  const publicDir = new URL("../../public", import.meta.url);
  const cardSlugs = new Set((JSON.parse(readFileSync(new URL("./data/woo-cards.json", import.meta.url), "utf8")).cards as { slug: string }[]).map((c) => c.slug));

  test("la promozione in home e la barra finiscono alla chiusura della campagna, il 2 dicembre alle 08:01 UTC", () => {
    assert.equal(Date.parse(KICKSTARTER_PROMO_UNTIL ?? ""), Date.parse("2026-12-02T08:01:00Z"));
  });
  test("ogni promo ha la sua immagine in public/ e una carta del database, e nessuna immagine è in più", () => {
    for (const p of promos) {
      assert.ok(existsSync(new URL(`.${p.image}`, `${publicDir.href}/`)), `${p.image} manca`);
      assert.ok(cardSlugs.has(p.card), `${p.name}: carta ${p.card} che non esiste`);
      assert.ok(p.artist.length > 2, `${p.name}: illustratore`);
    }
    const files = readdirSync(new URL("./media/kickstarter/promos", `${publicDir.href}/`)).sort();
    assert.deepEqual(files, promos.map((p) => p.image.split("/").at(-1)).sort());
  });
  test("niente Morgan le Fay, Red né Tigger: Koin non le ha ancora annunciate", () => {
    for (const p of promos) {
      assert.ok(!["morgan-le-fay", "red", "tigger"].includes(p.card), `${p.name}: promo non ancora annunciata`);
      assert.doesNotMatch(p.image, /morgan|tigger|-red\.webp$/i);
    }
  });
  test("stretch goal della scatola in ordine, dal lancio all'ultima soglia di Koin", () => {
    const goals = promosOf("box").map((p: Promo) => p.goal ?? -1);
    assert.equal(goals[0], 0);
    assert.deepEqual(goals, [...goals].sort((a, b) => a - b));
    assert.equal(goals.at(-1), KICKSTARTER_BOX_TOTAL.usd);
    assert.ok(goals.includes(KICKSTARTER_GOALS_REACHED_USD), "la soglia raggiunta è quella di uno stretch goal");
    assert.deepEqual(promosOf("box").filter((p: Promo) => promoUnlocked(p)).map((p: Promo) => p.name), ["Van Helsing", "Sherlock", "Watson", "Queen of Hearts", "Mulan"]);
    assert.match(KICKSTARTER_PROMOS_READ, /^\d{4}-\d{2}-\d{2}$/);
  });
  test("solo i profili hanno la versione firmata, e una sola", () => {
    assert.deepEqual(promos.filter((p) => p.signed).map((p) => `${p.group} ${p.card}`), ["profile winnie-the-pooh"]);
  });
  test("l'ancora della sezione nella guida è un'ancora valida in ogni lingua", () => {
    for (const [locale, labels] of Object.entries(all)) assert.match((labels as typeof en).promos.guideAnchor, /^[a-z0-9-]+$/, locale);
  });
});

describe("testi nelle sette lingue", () => {
  const base = leaves(en);
  for (const [locale, labels] of Object.entries(all)) {
    test(`${locale}: stessa forma e stessi segnaposto dell'inglese, niente testi vuoti`, () => {
      const mine = leaves(labels);
      assert.deepEqual([...mine.keys()].sort(), [...base.keys()].sort());
      for (const [path, text] of mine) {
        assert.ok(text.trim().length > 0, `${locale} ${path} vuoto`);
        assert.deepEqual(placeholders(text), placeholders(base.get(path) ?? ""), `${locale} ${path}: segnaposto diversi`);
      }
    });
    test(`${locale}: titolo con "Origins TCG" entro 60 caratteri, description fra 120 e 158`, () => {
      const l = labels as typeof en;
      assert.match(l.meta.title, /Origins TCG/);
      assert.ok(l.meta.title.length <= 60, `${locale} titolo di ${l.meta.title.length} caratteri`);
      assert.ok(l.meta.description.length >= 120 && l.meta.description.length <= 158, `${locale} description di ${l.meta.description.length} caratteri`);
    });
    test(`${locale}: la dichiarazione del link referral e la dicitura non ufficiale ci sono`, () => {
      const l = labels as typeof en;
      assert.match(l.disclosure, /OriginsMeta/);
      assert.match(l.disclosure, /Koin Games/);
      assert.match(l.unofficial, /Koin Games/);
      assert.ok(l.stickyNote.length > 0 && l.stickyNote.length <= 60, `${locale} nota della barra troppo lunga`);
      // il nome del sito della community non compare sulle pagine (regola del 25/09/2026)
      for (const text of leaves(labels).values()) assert.doesNotMatch(text, /world ?of ?origins|worldoforigins/i);
    });
  }
});
