/**
 * Test dell'area account (06/11/2026): `node --test src/lib/accountPages.test.ts`.
 * Tracker e Twitch stanno in due pagine e hanno due codici della stessa forma: i testi devono dire sempre di quale si sta
 * parlando. La pagina Twitch prende i passi dalla guida di /for-creators, quindi quella deve restare di sei passi, con il
 * quarto (il codice) che porta alla pagina. Le schede hanno un'etichetta in ogni lingua.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { accountLabels } from "./accountLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { trackerLabels, trackerPrivacy } from "./trackerLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { twitchAccountLabels } from "./twitchAccountLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { TWITCH_EXTENSION_URL } from "./forCreators.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en } from "./forCreatorsLabels-en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it } from "./forCreatorsLabels-it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es } from "./forCreatorsLabels-es.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { fr } from "./forCreatorsLabels-fr.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { pt } from "./forCreatorsLabels-pt.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { de } from "./forCreatorsLabels-de.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { ru } from "./forCreatorsLabels-ru.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { zhCn } from "./forCreatorsLabels-zh-cn.ts";

const locales = ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"] as const;
const guides = { en, it, es, fr, pt, de, ru, "zh-cn": zhCn };
const root = new URL("../../", import.meta.url);
const file = (path: string) => readFileSync(new URL(path, root), "utf8");

/** Le foglie di un oggetto di testi: percorso → stringa. */
function leaves(value: unknown, path = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof value === "string") out.set(path, value);
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) leaves(v, path ? `${path}.${k}` : k).forEach((s, p) => out.set(p, s));
  return out;
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

type Step = { text: string; link?: { label: string; path: string } };
type Tool = { id: string; steps: Step[]; stuck: string[] };

describe("testi di /account/twitch", () => {
  test("ogni lingua ha la forma e i segnaposto dell'inglese", () => {
    const base = leaves(twitchAccountLabels.en);
    for (const l of locales) {
      const got = leaves(twitchAccountLabels[l]);
      assert.deepEqual([...got.keys()].sort(), [...base.keys()].sort(), l);
      for (const [path, text] of base) {
        assert.ok((got.get(path) ?? "").trim().length > 0, `${l} ${path}`);
        assert.deepEqual(placeholders(got.get(path) ?? ""), placeholders(text), `${l} ${path}`);
      }
    }
  });

  test("i due codici non si confondono: tasto, titolo e riga sotto il tasto sono diversi", () => {
    for (const l of locales) {
      const app = trackerLabels[l].link;
      const twitch = twitchAccountLabels[l].extension;
      for (const key of ["create", "yourCode", "note"] as const) assert.notEqual(app[key], twitch[key], `${l} ${key}`);
      assert.match(twitch.create, /Twitch/, l);
      assert.match(twitch.yourCode, /Twitch/, l);
      assert.match(twitch.note, /Twitch/, l);
      assert.doesNotMatch(app.create, /Twitch/, l);
    }
  });

  test("il francese ha lo spazio insecabile davanti a due punti e punto di domanda", () => {
    for (const text of [...leaves(twitchAccountLabels.fr).values(), trackerLabels.fr.twitchNotice]) {
      assert.doesNotMatch(text, / [:;?]| !(?!deck)/, text);
    }
  });
});

describe("guida di /for-creators usata dalla pagina", () => {
  test("sei passi: il primo apre l'estensione, il quarto porta al codice in /account/twitch", () => {
    for (const l of locales) {
      const tool = (guides[l].tools.items as Tool[]).find((t) => t.id === "twitch");
      assert.ok(tool, l);
      assert.equal(tool.steps.length, 6, l);
      assert.equal(tool.steps[0].link?.path, TWITCH_EXTENSION_URL, l);
      assert.equal(tool.steps[3].link?.path, "/account/twitch", l);
      assert.ok(tool.stuck.length > 0, l);
      assert.doesNotMatch(JSON.stringify(tool), /account\/tracker/, l);
    }
  });
});

describe("Tracker e Twitch in due pagine", () => {
  const tracker = file("src/app/[locale]/(site)/account/tracker/page.tsx");

  test("la pagina del Tracker non crea codici per Twitch e rimanda alla pagina nuova", () => {
    assert.doesNotMatch(tracker, /createTwitchCode|readTwitchLink|unlinkTwitch/);
    assert.match(tracker, /"\/account\/twitch"/);
    assert.match(tracker, /"#twitch"/);
    assert.match(file("src/app/[locale]/(site)/account/page.tsx"), /"#stream-tools"/);
  });

  test("l'informativa dice dove si collega e si scollega il canale", () => {
    for (const l of locales) {
      const text = trackerPrivacy[l];
      assert.equal(text.split("/account/twitch").length, 3, l);
      assert.ok(text.includes("/account/tracker"), l);
      assert.doesNotMatch(text, /PC[A-Z]/, l);
    }
  });

  test("proxy, estensione e guide portano alla pagina giusta", () => {
    assert.match(file("src/proxy.ts"), /\/account\/twitch"/);
    assert.match(file("twitch-extension/config.js"), /siteLink\("\/account\/twitch"/);
    for (const guide of ["guides", "guides-es", "guides-fr", "guides-pt", "guides-de", "guides-ru", "guides-zh-cn-b"]) {
      assert.doesNotMatch(file(`src/lib/content/${guide}.ts`), /\/account#stream-tools/, guide);
    }
  });
});

describe("schede dell'account", () => {
  test("ogni lingua ha tutte le etichette", () => {
    const base = leaves(accountLabels.en);
    for (const l of locales) {
      const got = leaves(accountLabels[l]);
      assert.deepEqual([...got.keys()].sort(), [...base.keys()].sort(), l);
      for (const text of got.values()) assert.ok(text.trim().length > 0, l);
    }
  });
});
