/**
 * Test della pagina per i creator (30/10/2026): `node --test src/lib/forCreators.test.ts`.
 * I testi delle sette lingue hanno la stessa forma dell'inglese, gli stessi segnaposto e le stesse righe da copiare;
 * titolo e description stanno nei limiti di Google; ogni strumento ha la sua guida; i link interni portano a sezioni che
 * esistono; i file del media kit ci sono, con le misure dichiarate (scripts/creator-kit.mjs li rifà).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { KIT_COLORS, KIT_FILES, KIT_ZIP, TOOL_IDS, TWITCH_EXTENSION_URL, creatorApplyPath, fillCode, isExternal, kitFilePath } from "./forCreators.ts";
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

type Labels = typeof en;
type Step = { text: string; code?: string; codes?: { label: string; code: string }[]; link?: { label: string; path: string } };
type Tool = { id: string; steps: Step[]; stuck: string[]; more?: { path: string } };

const all: Record<string, Labels> = { en, it, es, fr, pt, de, ru };
const root = new URL("../../", import.meta.url);

/** Le foglie di un oggetto di testi: percorso → stringa (gli array con l'indice). */
function leaves(value: unknown, path = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof value === "string") out.set(path, value);
  else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, `${path}[${i}]`).forEach((s, p) => out.set(p, s)));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) leaves(v, path ? `${path}.${k}` : k).forEach((s, p) => out.set(p, s));
  return out;
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/** Le righe da copiare di una lingua, in ordine; la regia di Broadcasting OM ha la sua lingua (it, altrimenti en). */
function codes(l: Labels): string[] {
  const out: string[] = [];
  for (const t of l.tools.items as Tool[]) for (const s of t.steps) out.push(...(s.code ? [s.code] : []), ...(s.codes ?? []).map((c) => c.code));
  return out.map((c) => c.replace(/broadcast\?lang=(it|en)$/, "broadcast?lang=*"));
}

/** I link di una lingua: passi, voci, idee, ingressi. */
function links(l: Labels): string[] {
  const out: string[] = [];
  for (const t of l.tools.items as Tool[]) {
    for (const s of t.steps) if (s.link) out.push(s.link.path);
    if (t.more) out.push(t.more.path);
  }
  for (const p of l.perks.items as { link?: { path: string } }[]) if (p.link) out.push(p.link.path);
  for (const i of l.ideas.items) out.push(i.link.path);
  for (const s of l.join.steps as { link?: { path: string } }[]) if (s.link) out.push(s.link.path);
  return out;
}

/** Larghezza e altezza di un PNG, dall'intestazione IHDR. */
function pngSize(file: URL): { width: number; height: number } {
  const b = readFileSync(file);
  assert.equal(b.toString("ascii", 1, 4), "PNG", `${file.pathname} non è un PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

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
    test(`${locale}: le righe da copiare sono quelle dell'inglese`, () => {
      assert.deepEqual(codes(labels), codes(en));
      assert.deepEqual(labels.kit.lines.items.map((s: string) => s.match(/https:\/\/\S+/)?.[0]), en.kit.lines.items.map((s: string) => s.match(/https:\/\/\S+/)?.[0]));
    });
    test(`${locale}: titolo con "Origins TCG" entro 60 caratteri, description fra 120 e 158`, () => {
      assert.match(labels.meta.title, /Origins TCG/);
      assert.ok(labels.meta.title.length <= 60, `${locale} titolo di ${labels.meta.title.length} caratteri`);
      assert.ok(labels.meta.description.length >= 120 && labels.meta.description.length <= 158, `${locale} description di ${labels.meta.description.length} caratteri`);
    });
    test(`${locale}: una guida per strumento, nell'ordine della pagina, con passi e consigli`, () => {
      assert.deepEqual((labels.tools.items as Tool[]).map((t) => t.id), [...TOOL_IDS]);
      for (const t of labels.tools.items as Tool[]) {
        assert.ok(t.steps.length >= 2, `${locale} ${t.id}: pochi passi`);
        assert.ok(t.stuck.length >= 1, `${locale} ${t.id}: manca "se non funziona"`);
      }
    });
    test(`${locale}: il segnaposto del nome utente è quello che la nota dice di sostituire`, () => {
      assert.match(labels.you, /^[^\s{}]+$/);
      assert.ok(labels.notFilled.includes(labels.you), `${locale}: notFilled non nomina ${labels.you}`);
    });
    test(`${locale}: i link interni portano a sezioni che esistono, quelli esterni sono https`, () => {
      for (const p of links(labels)) {
        if (isExternal(p)) continue;
        assert.match(p, /^\/[a-z-]+/, `${locale}: link ${p}`);
        const section = p.slice(1).split(/[/?#]/)[0];
        assert.ok(existsSync(new URL(`src/app/[locale]/(site)/${section}`, root)), `${locale}: la sezione /${section} non esiste`);
      }
      const twitch = (labels.tools.items as Tool[]).find((t) => t.id === "twitch")!;
      assert.ok(twitch.steps.some((s) => s.link?.path === TWITCH_EXTENSION_URL), `${locale}: manca il link all'estensione Twitch`);
    });
    test(`${locale}: la dicitura non ufficiale nomina Koin Games`, () => {
      assert.match(labels.unofficial, /Koin Games/);
      assert.match(labels.join.body, /\n/);
    });
  }
});

describe("media kit e costanti", () => {
  test("ci sono tutti i file del kit, in ogni lingua, con le misure dichiarate", () => {
    for (const locale of Object.keys(all)) {
      for (const f of KIT_FILES) {
        const file = new URL(`public${kitFilePath(f.id, locale as "en")}`, root);
        assert.ok(existsSync(file), `manca ${file.pathname}`);
        assert.deepEqual(pngSize(file), { width: f.width, height: f.height }, `${f.id} ${locale}`);
      }
    }
    assert.ok(existsSync(new URL(`public${KIT_ZIP}`, root)), "manca lo zip del kit");
  });
  test("i colori sono esadecimali e uguali al README del kit", () => {
    const readme = readFileSync(new URL("public/media/creator-kit/README.txt", root), "utf8");
    for (const c of KIT_COLORS) {
      assert.match(c.hex, /^#[0-9A-F]{6}$/);
      assert.ok(readme.includes(c.hex), `${c.hex} non è nel README`);
    }
  });
  test("fillCode mette nome utente e lingua al posto dei segnaposto, il resto resta com'è", () => {
    assert.equal(fillCode("https://originsmeta.com/overlay/deck?u={user}&lang={lang}", { user: "coachcrono", lang: "it" }), "https://originsmeta.com/overlay/deck?u=coachcrono&lang=it");
    assert.equal(fillCode("!command add !deck ${customapi.https://x/?u={user}}", { user: "a", lang: "en" }), "!command add !deck ${customapi.https://x/?u=a}");
  });
  test("la richiesta del ruolo Creator apre la casella con il messaggio già scritto", () => {
    assert.equal(creatorApplyPath, "/account/messages?topic=creator#messages");
  });
});
