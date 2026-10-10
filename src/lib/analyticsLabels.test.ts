/**
 * Test della pagina /analytics (02/10/2026; dal 10/10/2026 la pagina del download con la guida all'installazione):
 * `node --test src/lib/analyticsLabels.test.ts`.
 * - Titolo e description nei limiti di Google (le regole di `pageTitle` e `cleanDescription`, come hubMeta.test.ts:
 *   un titolo con "OriginsMeta" dentro resta com'è, quindi entro 60 caratteri; description fra 120 e 158).
 * - Sempre "non affiliato a Koin Games", nessuna parola su bot o persone (regola del tracker), l'informativa nelle tre
 *   lingue con il contatto per farsi cancellare.
 * - Gli stessi valori del blocco INTERESSE ANALYTICS di schema.sql (lingue, posizioni del tasto, forma del numero del
 *   browser) e le immagini nelle tre lingue dell'app (il francese usa quelle inglesi).
 * - Dal 10/10/2026: il download da GitHub Releases, la guida in nove passi uguale nelle quattro lingue (segnaposto,
 *   ancora), niente più "in pausa" nei testi della SERP, la tipografia francese.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { TRACKER_DOWNLOAD_FILE, TRACKER_DOWNLOAD_URL, analyticsInstallHref, analyticsInterestPrivacy, analyticsLabels, interestCount } from "./analyticsLabels.ts";

const LOCALES = ["en", "it", "es", "fr"] as const;
/** lingua degli screenshot: l'app non ha il francese, la pagina francese mostra quelli inglesi (come SHOT_LOCALE della pagina) */
const SHOT = { en: "en", it: "it", es: "es", fr: "en" } as const;
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
      // dal 10/10/2026 l'app si scarica: niente più "in pausa" nella SERP né nella pagina
      assert.ok(!/paus/i.test(`${x.meta.title} ${x.meta.description} ${x.lead}`), x.meta.description);
    });

    test(`${l}: guida all'installazione in nove passi, con il download e il collegamento all'account`, () => {
      const steps = x.install.steps;
      assert.equal(steps.length, 9);
      assert.match(x.install.anchor, /^[a-z-]+$/);
      assert.equal(analyticsInstallHref(l), `/${l}/analytics#${x.install.anchor}`);
      // {file} solo nel passo 2 (il download, con il tasto), {link} solo nel passo 6 (il collegamento)
      steps.forEach((s, i) => {
        assert.equal(s.text.includes("{file}"), i === 1, `passo ${i + 1}: {file}`);
        assert.equal(s.text.includes("{link}"), i === 5, `passo ${i + 1}: {link}`);
        assert.ok(s.title && s.text.length > 40, `passo ${i + 1}`);
      });
      // requisiti, file dell'app, la X che chiude tutto
      assert.match(steps[0].text, /Windows 10/);
      assert.match(steps[0].text, /Steam/);
      assert.match(steps[3].text, /OriginsMeta Analytics\.exe/);
      assert.match(steps[8].text, /X|croix/);
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
      const s = SHOT[l];
      for (const f of [`app-overview-${s}.webp`, `app-matches-${s}.webp`, `overlay-${s}.webp`]) assert.ok(fs.existsSync(new URL(`../../public/media/analytics/${f}`, import.meta.url)), f);
    });
  }
});

describe("analytics: download e tipografia", () => {
  test("lo zip dell'ultima versione su GitHub Releases, con il nome citato nella guida", () => {
    assert.match(TRACKER_DOWNLOAD_URL, /^https:\/\/github\.com\/ultimacenere\/originsmeta\/releases\/latest\/download\//);
    assert.ok(TRACKER_DOWNLOAD_URL.endsWith(`/${TRACKER_DOWNLOAD_FILE}`));
  });

  test("francese: spazio insecabile prima di : ; ? ! e dentro « » (docs/francese.md)", () => {
    const texts: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === "string") texts.push(v);
      else if (v && typeof v === "object") for (const w of Object.values(v)) walk(w);
    };
    walk(analyticsLabels.fr);
    texts.push(analyticsInterestPrivacy.fr);
    for (const t of texts) {
      assert.ok(!/ [:;?!»]/.test(t) && !/« /.test(t), t);
    }
  });
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
    assert.match(block, /locale in \('en', 'it', 'es', 'fr'\)/);
    assert.match(block, /source in \('top', 'bottom'\)/);
    assert.ok(block.includes("'^[0-9a-f]{32}$'"));
    assert.ok(component.includes("/^[0-9a-f]{32}$/"));
    assert.ok(component.includes('placement: "top" | "bottom"'));
  });
});
