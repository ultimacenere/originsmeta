/**
 * Prove della pagina /twitch (12/11/2026): testi uguali per forma nelle otto lingue e corti come devono essere,
 * indirizzo dell'estensione uguale a quello delle guide di /for-creators, contatti veri.
 * `node --test src/lib/twitchSetup.test.ts`
 */
import assert from "node:assert/strict";
import { test } from "node:test";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { FOR_CREATORS_PATH, TWITCH_EXTENSION_URL } from "./forCreators.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en as fcEn } from "./forCreatorsLabels-en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it as fcIt } from "./forCreatorsLabels-it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es as fcEs } from "./forCreatorsLabels-es.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { fr as fcFr } from "./forCreatorsLabels-fr.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { pt as fcPt } from "./forCreatorsLabels-pt.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { de as fcDe } from "./forCreatorsLabels-de.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { ru as fcRu } from "./forCreatorsLabels-ru.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { zhCn as fcZhCn } from "./forCreatorsLabels-zh-cn.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { FULL_GUIDES_PATH, PC_STEPS, SETUP_CONTACTS, TWITCH_SETUP_PATH, TWITCH_STEPS, isDiscordUsername, stepNumber, twitchSetupTrack } from "./twitchSetup.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { fillName, twitchSetupLabels, type TwitchSetupLabels } from "./twitchSetupLabels.ts";

/** Le lingue del sito: scritte qui perché i18n.ts non si carica con node --test; la prima prova le confronta con i testi. */
const locales = ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"] as const;
type Locale = (typeof locales)[number];
type Guide = { id: string; steps: { text: string; link?: { path: string } }[] };
const forCreatorsLabels: Record<Locale, { tools: { items: Guide[] } }> = { en: fcEn, it: fcIt, es: fcEs, fr: fcFr, pt: fcPt, de: fcDe, ru: fcRu, "zh-cn": fcZhCn };

/** Tutte le chiavi di un oggetto, in profondità ("pc.steps.download.title"). */
function keysOf(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k));
}

/** Tutte le stringhe di un oggetto, con il percorso. */
function stringsOf(value: unknown, prefix = ""): [string, string][] {
  if (typeof value === "string") return [[prefix, value]];
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([k, v]) => stringsOf(v, prefix ? `${prefix}.${k}` : k));
}

const each = (fn: (l: Locale, L: TwitchSetupLabels) => void) => {
  for (const l of locales) fn(l, twitchSetupLabels[l]);
};

test("le otto lingue hanno le stesse chiavi e nessun testo vuoto", () => {
  assert.deepEqual(Object.keys(twitchSetupLabels).sort(), [...locales].sort());
  const ref = keysOf(twitchSetupLabels.en).sort();
  each((l, L) => {
    assert.deepEqual(keysOf(L).sort(), ref, `chiavi diverse in ${l}`);
    for (const [path, text] of stringsOf(L)) assert.ok(text.trim().length > 0 && text === text.trim(), `${l}.${path} vuoto o con spazi ai bordi`);
  });
});

test("ogni lingua ha i sette passi, numerati da 1 a 7 nell'ordine in cui si fanno", () => {
  assert.deepEqual([...PC_STEPS, ...TWITCH_STEPS].map(stepNumber), [1, 2, 3, 4, 5, 6, 7]);
  each((l, L) => {
    assert.deepEqual(Object.keys(L.pc.steps).sort(), [...PC_STEPS].sort(), `passi del PC in ${l}`);
    assert.deepEqual(Object.keys(L.twitch.steps).sort(), [...TWITCH_STEPS].sort(), `passi di Twitch in ${l}`);
  });
});

test("poco testo: titoli dei passi entro 30 caratteri, righe entro 190, presentazione entro 170", () => {
  each((l, L) => {
    for (const step of [...Object.values(L.pc.steps), ...Object.values(L.twitch.steps)]) {
      assert.ok(step.title.length <= 30, `${l}: titolo lungo "${step.title}" (${step.title.length})`);
      assert.ok(step.text.length <= 190, `${l}: riga lunga "${step.text.slice(0, 40)}…" (${step.text.length})`);
      assert.ok(!/[.:;,]$/.test(step.title), `${l}: titolo con la punteggiatura in fondo "${step.title}"`);
    }
    assert.ok(L.lead.length <= 170, `${l}: presentazione lunga (${L.lead.length})`);
    assert.ok(L.h1.length <= 48, `${l}: titolo della pagina lungo (${L.h1.length})`);
    assert.ok(L.done.text.length <= 120, `${l}: riga finale lunga (${L.done.text.length})`);
  });
});

test("titolo e descrizione per i motori: gioco nel titolo, misure giuste", () => {
  each((l, L) => {
    const { title, description } = L.meta;
    assert.match(title, /Origins TCG/, `${l}: il titolo non nomina il gioco`);
    // pageTitle aggiunge " · OriginsMeta" se il totale resta entro 60 caratteri: il titolo da solo non li supera mai
    assert.ok(title.length <= 60, `${l}: titolo di ${title.length} caratteri`);
    const [min, max] = l === "zh-cn" ? [45, 100] : [120, 158];
    assert.ok(description.length >= min && description.length <= max, `${l}: descrizione di ${description.length} caratteri (${min}–${max})`);
    assert.match(description, /Origins TCG/, `${l}: la descrizione non nomina il gioco`);
    assert.match(description, /Twitch/, `${l}: la descrizione non nomina Twitch`);
  });
});

test("i nomi dei tasti sono quelli delle guide di /for-creators", () => {
  // l'app Tracker è in inglese, italiano e spagnolo: nelle altre lingue il tasto del layout è quello inglese
  const layoutButton: Record<Locale, string> = { en: "Create your layout", it: "Crea il tuo layout", es: "Crea tu layout", fr: "Create your layout", pt: "Create your layout", de: "Create your layout", ru: "Create your layout", "zh-cn": "Create your layout" };
  each((l, L) => {
    assert.ok(L.pc.steps.layout.text.includes(layoutButton[l]), `${l}: manca il tasto "${layoutButton[l]}"`);
    assert.ok(L.pc.steps.run.text.includes("OriginsMeta Tracker.exe"), `${l}: manca il nome del file da aprire`);
    assert.ok(L.twitch.steps.install.text.includes("OriginsMeta Deck tracker"), `${l}: manca il nome dell'estensione`);
    // ogni tasto fra virgolette deve comparire, uguale, anche nelle guide lunghe della stessa lingua
    const guides = forCreatorsLabels[l].tools.items.filter((t) => t.id === "tracker" || t.id === "twitch");
    const long = guides.flatMap((t) => t.steps.map((s) => s.text)).join("\n");
    const quoted = [...Object.values(L.pc.steps), ...Object.values(L.twitch.steps)].flatMap((s) => [...s.text.matchAll(/[«“„]\s?([^»”“]+?)\s?[»”“]/g)].map((m) => m[1]));
    assert.ok(quoted.length >= 8, `${l}: pochi tasti fra virgolette (${quoted.length})`);
    for (const q of quoted) {
      if (q === layoutButton[l]) continue; // "Crea il tuo layout" sta nell'app, le guide lunghe non lo nominano
      assert.ok(long.includes(q), `${l}: il tasto "${q}" non è scritto così nelle guide di /for-creators`);
    }
  });
});

test("l'indirizzo dell'estensione è lo stesso delle guide di /for-creators", () => {
  assert.equal(TWITCH_SETUP_PATH, "/twitch");
  assert.ok(FULL_GUIDES_PATH.startsWith(FOR_CREATORS_PATH + "#"));
  each((l) => {
    const twitch = forCreatorsLabels[l].tools.items.find((t) => t.id === "twitch");
    assert.ok(twitch, `${l}: guida dell'estensione mancante`);
    const links = twitch.steps.flatMap((s) => (s.link ? [s.link.path] : []));
    assert.ok(links.includes(TWITCH_EXTENSION_URL), `${l}: la guida lunga porta a un altro indirizzo`);
  });
});

test("contatti: nomi veri, nomi utente Discord validi o assenti, mai inventati a metà", () => {
  assert.ok(SETUP_CONTACTS.length >= 2);
  for (const c of SETUP_CONTACTS) {
    assert.ok(c.name.trim().length > 1);
    if (c.discord !== null) assert.ok(isDiscordUsername(c.discord), `nome utente Discord non valido: ${c.discord}`);
  }
  assert.ok(SETUP_CONTACTS.some((c) => c.discord), "serve almeno un contatto con il nome utente");
  assert.equal(isDiscordUsername("aldrymus"), true);
  assert.equal(isDiscordUsername("Aldry#1234"), false);
  assert.equal(isDiscordUsername("a..b"), false);
  each((l, L) => {
    assert.ok(L.help.copyAria.includes("{name}"), `${l}: manca {name} nel nome del tasto Copia`);
    assert.ok(fillName(L.help.copyAria, "Aldry").includes("Aldry"));
  });
});

test("francese: spazio insecabile prima di : ? ! ; e dentro le virgolette", () => {
  for (const [path, text] of stringsOf(twitchSetupLabels.fr)) {
    assert.ok(!/ [:?!;]/.test(text), `fr.${path}: spazio normale prima della punteggiatura alta`);
    assert.ok(!/« /.test(text) && !/ »/.test(text), `fr.${path}: spazio normale dentro le virgolette`);
  }
});

test("la misura dei link porta l'evento e il posto", () => {
  assert.deepEqual(twitchSetupTrack("extension"), { "data-om-event": "twitch_setup_click", "data-om-target": "extension" });
});
