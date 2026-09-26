/**
 * Video delle guide editoriali (campo `videos` di `Guide`, pacchetto VIDEO del 26/09/2026) con il runner integrato di
 * Node: `node --test src/lib/content/guideVideos.test.ts`. Il 26/09/2026 nessuna guida ha video (non si citano video
 * che non esistono): il test protegge quelli che arriveranno. In ogni lingua: indirizzo riconosciuto (YouTube o Twitch),
 * ancora `before` presente nel testo di quella lingua, miniatura salvata in public/, data di caricamento in ISO 8601,
 * e VideoObject soltanto quando titolo, miniatura e data ci sono davvero. Stesso hook di risoluzione dei moduli di
 * guides.test.ts (Node ≥ 22.15).
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.(?:[cm]?[jt]sx?|json)$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    const resolved = next(specifier, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const guidesModule: typeof import("./guides") = await import("./guides.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const videosModule: typeof import("../videos") = await import("../videos.ts");

const { getGuides } = guidesModule;
const { guideVideoLayout, guideVideoLd, isIsoDate, parseVideoUrl } = videosModule;
const locales = ["en", "it", "es"] as const;
const publicFile = (p: string) => new URL(`../../../public${p}`, import.meta.url);

describe("video delle guide", () => {
  for (const locale of locales) {
    test(`${locale}: ogni video si riconosce, sta dove è indicato e ha dati veri`, () => {
      for (const g of getGuides(locale)) {
        const videos = g.videos ?? [];
        if (!videos.length) continue;
        const layout = guideVideoLayout(g.body, videos, locale);
        const inline = layout.segments.flatMap((s) => (s.kind === "videos" ? s.items : []));
        assert.equal(layout.top.length + layout.end.length + inline.length, videos.length, `${g.slug}: un video non è di YouTube o Twitch`);
        for (const v of videos) {
          const where = `${locale}/${g.slug} ${v.url}`;
          assert.ok(parseVideoUrl(v.url), `${where}: indirizzo non riconosciuto`);
          const anchor = v.before?.[locale];
          if (anchor) assert.ok(inline.some((x) => x.video === v), `${where}: l'ancora {#${anchor}} non c'è nel testo`);
          if (v.thumbnail) assert.ok(v.thumbnail.startsWith("/") && existsSync(publicFile(v.thumbnail)), `${where}: miniatura ${v.thumbnail} non in public/`);
          if (v.uploadDate) assert.ok(isIsoDate(v.uploadDate), `${where}: data di caricamento non ISO 8601`);
          if (v.title && v.thumbnail && v.uploadDate) assert.ok(guideVideoLd(v, "https://originsmeta.com"), `${where}: VideoObject mancante`);
        }
      }
    });
  }
});
