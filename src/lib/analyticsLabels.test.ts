/**
 * Test della pagina dell'app, /tracker dal 12/10/2026 (prima /analytics; 02/10/2026, dal 10/10/2026 la pagina del
 * download con la guida all'installazione):
 * `node --test src/lib/analyticsLabels.test.ts`.
 * - Titolo e description nei limiti di Google (le regole di `pageTitle` e `cleanDescription`, come hubMeta.test.ts:
 *   un titolo con "OriginsMeta" dentro resta com'è, quindi entro 60 caratteri; description fra 120 e 158).
 * - Sempre "non affiliato a Koin Games", nessuna parola su bot o persone (regola del tracker), l'informativa nelle tre
 *   lingue con il contatto per farsi cancellare.
 * - Gli stessi valori del blocco INTERESSE ANALYTICS di schema.sql (lingue, posizioni del tasto, forma del numero del
 *   browser) e le immagini nelle tre lingue dell'app (il francese usa quelle inglesi).
 * - Dal 10/10/2026: il download da GitHub Releases, la guida (cinque passi dal 12/10/2026) uguale nelle quattro lingue (segnaposto,
 *   ancora), niente più "in pausa" nei testi della SERP, la tipografia francese.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { TRACKER_DOWNLOAD_FILE, trackerInstallHref, analyticsInterestPrivacy, analyticsLabels, interestCount, trackerDownloadHref } from "./analyticsLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { TRACKER_DOWNLOAD_URL } from "./trackerDownload.ts";

const LOCALES = ["en", "it", "es", "fr", "pt", "de"] as const;
/** lingua degli screenshot: l'app non ha il francese, la pagina francese mostra quelli inglesi (come SHOT_LOCALE della pagina) */
const SHOT = { en: "en", it: "it", es: "es", fr: "en", pt: "en", de: "en" } as const;
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

    test(`${l}: guida all'installazione in sette passi, con il download e il collegamento all'account`, () => {
      const steps = x.install.steps;
      // dal 15/10/2026 sette passi, uno per ogni punto in cui si perde chi scarica, ognuno con il suo "Se ti blocchi qui"
      assert.equal(steps.length, 7);
      assert.equal(x.install.path.length, steps.length);
      assert.match(x.install.anchor, /^[a-z-]+$/);
      assert.equal(trackerInstallHref(l), `/${l}/tracker#${x.install.anchor}`);
      // {file} solo nel passo 2 (il download, con il tasto), {link} solo nel passo 5 (il collegamento); passi e aiuti corti
      steps.forEach((s, i) => {
        assert.equal(s.text.includes("{file}"), i === 1, `passo ${i + 1}: {file}`);
        assert.equal(s.text.includes("{link}"), i === 4, `passo ${i + 1}: {link}`);
        assert.ok(s.title && s.text.length > 40 && s.text.length <= 320, `passo ${i + 1}: ${s.text.length}`);
        assert.ok(s.hint.length > 40 && s.hint.length <= 240, `passo ${i + 1}, aiuto: ${s.hint.length}`);
      });
      // passo 1 l'accesso, 3 lo zip, 4 l'avviso di Windows con i due clic dello schema, 6 lo scanner
      assert.match(steps[0].text, /Discord/);
      assert.match(steps[2].hint, /zip/);
      assert.ok(steps[3].hint.includes(x.install.smartscreen.more) && steps[3].hint.includes(x.install.smartscreen.run), "passo 4");
      assert.match(steps[5].title + steps[5].text, /scanner|escáner/i);
      for (const v of Object.values(x.install.smartscreen)) assert.ok(typeof v === "string" && v.length > 0);
      assert.match(x.install.started, /3/);
      // requisiti in una riga, file dell'app, Setup, la X che chiude l'app fra i problemi
      assert.match(x.install.needs, /Windows 10/);
      assert.match(x.install.needs, /Steam/);
      assert.match(x.install.needs, /OriginsMeta/);
      assert.match(steps[3].text, /OriginsMeta Tracker\.exe/);
      assert.match(steps[6].text, /Setup/);
      assert.equal(x.install.tips.items.length, 3);
      assert.ok(x.install.tips.items.some((tip) => /X|croix/.test(tip)));
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

    test(`${l}: le immagini della pagina`, () => {
      const s = SHOT[l];
      for (const f of [`app-overview-${s}.webp`, `app-matches-${s}.webp`, `overlay-${s}.webp`, `app-link-${s}.webp`]) assert.ok(fs.existsSync(new URL(`../../public/media/analytics/${f}`, import.meta.url)), f);
    });
  }
});

describe("analytics: download e tipografia", () => {
  test("lo zip dell'ultima versione su GitHub Releases, con il nome citato nella guida", () => {
    assert.match(TRACKER_DOWNLOAD_URL, /^https:\/\/github\.com\/ultimacenere\/originsmeta\/releases\/latest\/download\//);
    assert.ok(TRACKER_DOWNLOAD_URL.endsWith(`/${TRACKER_DOWNLOAD_FILE}`));
  });

  // 12/10/2026 (Pierluigi: "solo i registrati al sito possono scaricare l'app"): l'indirizzo dello zip lo conosce solo la
  // rotta /api/tracker/download; i testi e le pagine non lo contengono, e il tasto porta alla rotta con la lingua
  test("download solo con l'accesso: l'indirizzo dello zip solo nella rotta", () => {
    const src = (p: string) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
    for (const p of ["./analyticsLabels.ts", "../app/[locale]/(site)/tracker/page.tsx", "../app/[locale]/(site)/analytics/page.tsx", "../components/TrackerDownloadButton.tsx"]) {
      assert.ok(!src(p).includes("releases/latest"), p);
      assert.ok(!src(p).includes("trackerDownload\""), p);
    }
    assert.ok(src("../app/api/tracker/download/route.ts").includes("TRACKER_DOWNLOAD_URL"));
    for (const l of LOCALES) assert.equal(trackerDownloadHref(l), `/api/tracker/download?lang=${l}`);
  });

  test("download solo con l'accesso: tasto e riga per chi non l'ha fatto, collegamento obbligatorio", () => {
    for (const l of LOCALES) {
      const x = analyticsLabels[l];
      assert.ok(x.download.signIn.length > 0 && x.download.account.includes("OriginsMeta"), l);
      const link = x.install.steps.find((s: { text: string }) => s.text.includes("{link}"));
      assert.ok(link && link.text.includes("OriginsMeta"), l);
      assert.ok(!/optional|facoltativ|opcional|facultati/i.test(link!.text), l);
    }
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
    assert.match(block, /locale in \('en', 'it', 'es', 'fr', 'pt', 'de'\)/);
    assert.match(block, /source in \('top', 'bottom'\)/);
    assert.ok(block.includes("'^[0-9a-f]{32}$'"));
    assert.ok(component.includes("/^[0-9a-f]{32}$/"));
    assert.ok(component.includes('placement: "top" | "bottom"'));
  });
});
