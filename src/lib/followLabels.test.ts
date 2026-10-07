/**
 * Test delle etichette del pacchetto SEGUI (27/09/2026): `followLabels.ts` e `followNavLabels.ts`, con il runner
 * integrato di Node: `node --test src/lib/followLabels.test.ts`. Stesse chiavi e stessi segnaposto nelle tre lingue,
 * niente testi vuoti, ruoli chiamati come nei dizionari, spagnolo col tú, numeri uguali al codice (90 giorni, 10
 * minuti), e la privacy che dice quello che il pacchetto fa.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { fillFollowLabel, followLabels } from "./followLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { followNavLabels, followNavLabelsFor } from "./followNavLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { NOTIFICATION_EVENT_RETENTION_DAYS, NOTIFICATION_KINDS, NOTIFICATION_RETENTION_DAYS } from "./community/notifications.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en as dictEn } from "./dictionaries/en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it as dictIt } from "./dictionaries/it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es as dictEs } from "./dictionaries/es.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { fr as dictFr } from "./dictionaries/fr.ts";

const dictionaries = { en: dictEn, it: dictIt, es: dictEs, fr: dictFr } as const;
type Tree = { [key: string]: string | Tree };

function leaves(obj: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(key, v);
    else for (const [kk, vv] of leaves(v, key)) out.set(kk, vv);
  }
  return out;
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

for (const [title, all] of [
  ["followLabels", followLabels],
  ["followNavLabels", followNavLabels],
] as const) {
  describe(title, () => {
    const en = leaves(all.en as unknown as Tree);
    for (const locale of ["it", "es"] as const) {
      test(`${locale}: stesse chiavi e stessi segnaposto dell'inglese, nessun testo vuoto`, () => {
        const other = leaves(all[locale] as unknown as Tree);
        assert.deepEqual([...other.keys()].sort(), [...en.keys()].sort());
        for (const [key, text] of other) {
          assert.ok(text.trim(), `${locale} ${key} vuota`);
          assert.deepEqual(placeholders(text), placeholders(en.get(key) ?? ""), `${locale} ${key}: segnaposto diversi`);
        }
      });
    }
    test("spagnolo col tú (docs/spagnolo.md): niente usted né vosotros", () => {
      for (const [key, text] of leaves(all.es as unknown as Tree)) assert.doesNotMatch(text, /\b(usted|ustedes|vosotros|podéis|tenéis|seguís)\b/i, key);
    });
  });
}

describe("contenuti", () => {
  test("un'etichetta per ogni tipo di avviso", () => {
    for (const [locale, l] of Object.entries(followLabels)) assert.deepEqual(Object.keys(l.notifications.kinds).sort(), [...NOTIFICATION_KINDS].sort(), locale);
  });
  test("ruoli chiamati come nei dizionari (Creator uguale nelle tre lingue), niente Influencer", () => {
    for (const [locale, l] of Object.entries(followLabels)) {
      const badges = dictionaries[locale as keyof typeof dictionaries].community.badges;
      for (const key of ["account.intro", "privacy"]) {
        const text = leaves(l as unknown as Tree).get(key) ?? "";
        for (const role of ["creator", "author", "pro", "staff"] as const) assert.ok(text.includes(badges[role]), `${locale} ${key}: manca il ruolo ${badges[role]}`);
      }
      for (const [key, text] of leaves(l as unknown as Tree)) assert.doesNotMatch(text, /influencer/i, `${locale} ${key}`);
    }
  });
  test("numeri uguali al codice: avvisi per 90 giorni, registro degli invii per 180, Twitch ogni 10 minuti (vercel.json)", () => {
    for (const [locale, l] of Object.entries(followLabels)) {
      assert.ok(l.privacy.includes(String(NOTIFICATION_RETENTION_DAYS)), `${locale}: privacy senza i ${NOTIFICATION_RETENTION_DAYS} giorni`);
      assert.ok(l.privacy.includes(String(NOTIFICATION_EVENT_RETENTION_DAYS)), `${locale}: privacy senza il registro di ${NOTIFICATION_EVENT_RETENTION_DAYS} giorni`);
      assert.ok(l.notifications.intro.includes(String(NOTIFICATION_RETENTION_DAYS)), `${locale}: intro senza i giorni`);
      assert.match(l.privacy, /\b10\b/, `${locale}: privacy senza i 10 minuti del cron`);
      assert.match(l.privacy, /Twitch/, locale);
      assert.match(l.privacy, /Supabase/, locale);
    }
  });
  test("nome accessibile del tasto: comincia con il testo visibile (WCAG 2.5.3, Label in Name)", () => {
    for (const [locale, l] of Object.entries(followNavLabels)) {
      const name = (t: string) => fillFollowLabel(t, { name: "Vega" }).toLowerCase();
      assert.ok(name(l.followAria).startsWith(l.follow.toLowerCase()), `${locale} followAria`);
      assert.ok(name(l.loginAria).startsWith(l.follow.toLowerCase()), `${locale} loginAria`);
      assert.ok(name(l.followingAria).startsWith(l.following.toLowerCase()), `${locale} followingAria`);
    }
  });
  test("followNavLabelsFor: lingua sconosciuta → inglese; fillFollowLabel lascia i segnaposto sconosciuti", () => {
    assert.equal(followNavLabelsFor("it").follow, "Segui");
    assert.equal(followNavLabelsFor("es").follow, "Seguir");
    assert.equal(followNavLabelsFor("de").follow, "Follow");
    assert.equal(followNavLabelsFor("fr").follow, "Suivre");
    assert.equal(followNavLabelsFor("toString").follow, "Follow");
    assert.equal(fillFollowLabel("{name} · {x}", { name: "Vega" }), "Vega · {x}");
  });
});
