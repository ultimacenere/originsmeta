/**
 * Test della pagina /analytics (02/10/2026): `node --test src/lib/analyticsLabels.test.ts`.
 * - Titolo e description nei limiti di Google (le regole di `pageTitle` e `cleanDescription`, come hubMeta.test.ts:
 *   un titolo con "OriginsMeta" dentro resta com'è, quindi entro 60 caratteri; description fra 120 e 158).
 * - Sempre "non affiliato a Koin Games", nessuna parola su bot o persone (regola del tracker), l'informativa nelle tre
 *   lingue con il contatto per farsi cancellare.
 * - Gli stessi valori del blocco INTERESSE ANALYTICS di schema.sql (lingue, posizioni del tasto, forma del numero del
 *   browser) e le immagini nelle tre lingue.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { analyticsInterestPrivacy, analyticsLabels, interestCount } from "./analyticsLabels.ts";

const LOCALES = ["en", "it", "es"] as const;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 158;

describe("analytics: testi della pagina", () => {
  for (const l of LOCALES) {
    const x = analyticsLabels[l];
    test(`${l}: titolo e description per la SERP`, () => {
      assert.ok(x.meta.title.includes("OriginsMeta") && x.meta.title.includes("Origins TCG"), x.meta.title);
      assert.ok(x.meta.title.length <= TITLE_MAX, `${x.meta.title.length}: ${x.meta.title}`);
      assert.ok(x.meta.description.length >= DESC_MIN && x.meta.description.length <= DESC_MAX, `${x.meta.description.length}: ${x.meta.description}`);
      assert.ok(x.meta.description.includes("Origins TCG"));
    });

    test(`${l}: non affiliato a Koin Games, nessuna parola su bot o persone, conteggio`, () => {
      assert.match(x.koin.unofficial, /Koin Games/);
      const all = JSON.stringify(x);
      // parole intere anche con le lettere accentate ("botón" non è "bot"): confini Unicode, non \b
      const whole = (w: string, flags = "iu") => new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, flags);
      for (const word of [whole("bots?"), whole("AI", "u"), whole("IA", "u"), whole("humans?"), whole("umani?"), whole("humanos?"), whole("persona")]) assert.ok(!word.test(all), String(word));
      assert.equal(interestCount(x.interest, 1), x.interest.countOne);
      assert.ok(interestCount(x.interest, 42).includes("42"));
    });

    test(`${l}: informativa con il contatto e l'indirizzo della pagina`, () => {
      assert.ok(analyticsInterestPrivacy[l].includes("staff@originsmeta.com"));
      assert.ok(analyticsInterestPrivacy[l].includes("/analytics"));
      assert.ok(/IP/.test(analyticsInterestPrivacy[l]));
    });

    test(`${l}: le tre immagini della pagina`, () => {
      for (const f of [`app-overview-${l}.webp`, `app-matches-${l}.webp`, `overlay-${l}.webp`]) assert.ok(fs.existsSync(new URL(`../../public/media/analytics/${f}`, import.meta.url)), f);
    });
  }
});

describe("analytics: come il blocco INTERESSE ANALYTICS di schema.sql", () => {
  const sql = fs.readFileSync(new URL("../../supabase/schema.sql", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const at = sql.indexOf("-- ===== 02/10/2026: INTERESSE ANALYTICS =====");
  const block = sql.slice(at, sql.indexOf("\n-- ===== ", at + 10) < 0 ? undefined : sql.indexOf("\n-- ===== ", at + 10));
  const component = fs.readFileSync(new URL("../components/AnalyticsInterest.tsx", import.meta.url), "utf8");

  test("blocco presente, tabella senza accesso diretto, funzioni per anon", () => {
    assert.ok(at > 0);
    assert.match(block, /revoke all on public\.analytics_interest from anon, authenticated;/);
    assert.match(block, /grant execute on function public\.analytics_interest_add\(text, text, text\) to anon, authenticated;/);
    assert.match(block, /grant execute on function public\.analytics_interest_count\(\) to anon, authenticated;/);
  });

  test("stesse lingue, stesse posizioni del tasto, stesso numero del browser", () => {
    assert.match(block, /locale in \('en', 'it', 'es'\)/);
    assert.match(block, /source in \('top', 'bottom'\)/);
    assert.ok(block.includes("'^[0-9a-f]{32}$'"));
    assert.ok(component.includes("/^[0-9a-f]{32}$/"));
    assert.ok(component.includes('placement: "top" | "bottom"'));
  });
});
