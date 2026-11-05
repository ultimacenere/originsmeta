/**
 * Test di Broadcasting OM "in diretta dal sito" e dell'estensione Twitch (05/11/2026): `node --test src/lib/broadcast/live.test.ts`.
 * - live.ts: id della diretta, immagini caricate ("om:<impronta>"), stato per l'estensione, messaggio di PubSub (5 KB).
 * - twitch-broadcast/common.js, il JavaScript del pacchetto dell'estensione, caricato in una sandbox: stessi controlli
 *   di parseExtState, stesso messaggio, stesso codice del gioco di src/lib/deckcode.ts, testi in tutte le lingue.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  IMAGE_REF_PREFIX,
  LIVE_IMAGE_MAX,
  LIVE_STATE_MAX,
  PUBSUB_MAX,
  extHasDecks,
  extStateOf,
  imageRef,
  isLiveId,
  isLiveImageData,
  jsonBytes,
  liveImageUrl,
  parseExtState,
  pubsubMessage,
  refHash,
  resolveLiveImages,
  sha256Hex,
  uploadedImages,
  withImageRefs,
  type ExtState,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./live.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { cleanImage, decodeState, emptyState, encodeState, sanitizeState, type BroadcastState } from "./state.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { demoState } from "./demo.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { encodeGameCode } from "../deckcode.ts";

const HASH = "a".repeat(64);
const DATA = "data:image/webp;base64,UklGRhYAAABXRUJQVlA4TAoAAAAvAAAAAAfQ//73vw==";
const anyCard = () => true;

function withSponsors(state: BroadcastState, logos: string[]): BroadcastState {
  return { ...state, sponsors: { ...state.sponsors, on: true, items: logos.map((logo, i) => ({ name: `S${i}`, kind: "logo" as const, logo, url: "" })) } };
}

describe("id e immagini della diretta", () => {
  test("id: 12 caratteri fra a-z e 0-9", () => {
    assert.equal(isLiveId("abcdefgh1234"), true);
    for (const bad of ["ABCDEFGH1234", "abc", "abcdefgh12345", "abcdefgh123-", null, 12]) assert.equal(isLiveId(bad), false);
  });

  test("immagini accettate: PNG, JPEG, WebP in base64 entro il tetto del database, mai SVG", () => {
    assert.equal(isLiveImageData(DATA), true);
    assert.equal(isLiveImageData("data:image/png;base64,QUJD"), true);
    assert.equal(isLiveImageData("data:image/svg+xml;base64,PHN2Zz4="), false);
    assert.equal(isLiveImageData("data:text/html;base64,PGI+"), false);
    assert.equal(isLiveImageData(`data:image/png;base64,${"A".repeat(LIVE_IMAGE_MAX)}`), false);
    assert.equal(LIVE_IMAGE_MAX, 200_000, "uguale al vincolo di broadcast_images");
    assert.equal(LIVE_STATE_MAX, 8192, "uguale al vincolo di broadcast_lives");
  });

  test("l'impronta è lo sha256 del data URL, come nel database", async () => {
    assert.equal(await sha256Hex(DATA), createHash("sha256").update(DATA, "utf8").digest("hex"));
  });

  test("riferimenti om:<impronta>", () => {
    assert.equal(imageRef(HASH), IMAGE_REF_PREFIX + HASH);
    assert.equal(refHash(imageRef(HASH)), HASH);
    assert.equal(refHash("om:xyz"), null);
    assert.equal(refHash("https://example.com/a.png"), null);
  });

  test("lo stato salvato porta i riferimenti, non i data URL; un'immagine senza impronta si toglie", () => {
    const s = withSponsors(emptyState("it"), [DATA, "https://example.com/logo.png", "data:image/png;base64,QUJD"]);
    assert.deepEqual(uploadedImages(s), [DATA, "data:image/png;base64,QUJD"]);
    const saved = withImageRefs(s, new Map([[DATA, HASH]]));
    assert.deepEqual(
      saved.sponsors.items.map((x) => x.logo),
      [imageRef(HASH), "https://example.com/logo.png", ""],
    );
    const empty = emptyState();
    assert.equal(withImageRefs(empty, new Map()), empty, "senza immagini caricate lo stato resta lo stesso oggetto");
  });

  test("sanitizeState tiene i riferimenti validi e scarta gli altri (cleanImage)", () => {
    assert.equal(cleanImage(imageRef(HASH)), imageRef(HASH));
    assert.equal(cleanImage("om:zz"), "");
    const clean = sanitizeState(withSponsors(emptyState(), [imageRef(HASH), "om:../../x", "javascript:alert(1)"]), anyCard);
    assert.deepEqual(
      clean.sponsors.items.map((x) => x.logo),
      [imageRef(HASH), "", ""],
    );
  });

  test("l'overlay trasforma i riferimenti negli indirizzi delle immagini della diretta", () => {
    const s = resolveLiveImages(withSponsors(emptyState(), [imageRef(HASH), "https://example.com/a.png", "om:rotto"]), "abcdefgh1234");
    assert.deepEqual(
      s.sponsors.items.map((x) => x.logo),
      [liveImageUrl("abcdefgh1234", HASH), "https://example.com/a.png", ""],
    );
    assert.equal(liveImageUrl("abcdefgh1234", HASH), `/api/broadcast/live/image/${HASH}?id=abcdefgh1234`);
  });

  test("lo stato pieno (due giocatori, quattro mazzi pieni, nomi al massimo) sta nel tetto del database", () => {
    const s = demoState("it");
    const deck = { name: "N".repeat(24), legendary: "a".repeat(40), cards: Array.from({ length: 12 }, (_, i) => `${"b".repeat(30)}-${i}`), played: {} as Record<string, number> };
    const full: BroadcastState = { ...s, players: [{ ...s.players[0], decks: [deck, deck, deck, deck] }, { ...s.players[1], decks: [deck, deck, deck, deck] }] };
    assert.ok(jsonBytes(withImageRefs(full, new Map())) <= LIVE_STATE_MAX, `${jsonBytes(full)} byte`);
  });
});

describe("stato per l'estensione e messaggio di PubSub", () => {
  test("dalla partita di prova: giocatori, mazzi, copie giocate; niente sponsor né lingua", () => {
    const s = demoState("it");
    const ext = extStateOf(s);
    assert.equal(ext.v, 1);
    assert.equal(ext.p[0].n, s.players[0].name);
    assert.equal(ext.p[1].a, s.players[1].active);
    assert.deepEqual(ext.p[1].d[s.players[1].active].p, s.players[1].decks[s.players[1].active].played);
    assert.equal(JSON.stringify(ext).includes("sponsor"), false);
    assert.equal(extHasDecks(ext), true);
    assert.equal(extHasDecks(extStateOf(emptyState())), false);
    assert.deepEqual(parseExtState(JSON.parse(JSON.stringify(ext))), ext);
  });

  test("il messaggio della partita di prova sta nei 5 KB e porta id e versione", () => {
    const msg = pubsubMessage("abcdefgh1234", 7, "2026-11-05T20:00:00.000Z", extStateOf(demoState("en")));
    assert.ok(new TextEncoder().encode(msg).length <= PUBSUB_MAX);
    const m = JSON.parse(msg);
    assert.deepEqual([m.t, m.id, m.v, typeof m.s], ["bc", "abcdefgh1234", 7, "object"]);
    assert.equal(pubsubMessage("abcdefgh1234", 8, "x", null), JSON.stringify({ t: "bc", id: "abcdefgh1234", v: 8, at: "x", s: null }));
  });

  test("oltre i 5 KB il messaggio dice solo di rileggere lo stato", () => {
    const long = (n: number) => `${"x".repeat(60)}-${n}`;
    const deck = { n: "N".repeat(24), l: long(99), c: Array.from({ length: 12 }, (_, i) => long(i)), p: {} };
    const huge: ExtState = { v: 1, t: { n: "T", no: "", ph: "", bo: 3 }, p: [{ n: "A", t: "", s: 0, a: 0, d: [deck, deck, deck, deck] }, { n: "B", t: "", s: 0, a: 0, d: [deck, deck, deck, deck] }] };
    const msg = JSON.parse(pubsubMessage("abcdefgh1234", 9, "x", huge));
    assert.deepEqual(msg, { t: "bc", id: "abcdefgh1234", v: 9, at: "x", r: 1 });
  });

  test("parseExtState rifiuta le forme sbagliate", () => {
    const ok = extStateOf(demoState("en"));
    const clone = () => JSON.parse(JSON.stringify(ok)) as ExtState;
    const bad: ((s: ExtState) => void)[] = [
      (s) => ((s as { v: number }).v = 2),
      (s) => (s.p[0].s = 4),
      (s) => (s.p[0].a = 9),
      (s) => (s.p[0].d = [...s.p[0].d, ...s.p[0].d]),
      (s) => (s.p[0].d[0].c = ["Non Uno Slug"]),
      (s) => (s.p[0].d[0].p = { [s.p[0].d[0].c[0] ?? "x"]: 3 }),
      (s) => ((s.t as { bo: number }).bo = 2),
      (s) => (s.p = [s.p[0]] as unknown as ExtState["p"]),
    ];
    for (const mutate of bad) {
      const s = clone();
      mutate(s);
      assert.equal(parseExtState(s), null);
    }
    const ctl = clone();
    ctl.p[0].n = "A\u202eB\u0000C";
    assert.equal(parseExtState(ctl)?.p[0].n, "ABC", "caratteri di controllo e di direzione tolti");
  });
});

/* ---------------- il JavaScript del pacchetto dell'estensione ---------------- */

type BOApi = {
  lang: string;
  TEXTS: Record<string, Record<string, string>>;
  parseState: (raw: unknown) => unknown;
  parseMessage: (m: unknown) => unknown;
  parseCards: (raw: unknown) => { labels: Record<string, string>; cards: Record<string, { key: string | null; image: string | null }> };
  encodeGameCode: (keys: string[]) => Promise<string>;
  t: (id: string, vars?: Record<string, string | number>) => string;
};

function loadCommon(language = "en"): BOApi {
  const code = readFileSync(new URL("../../../twitch-broadcast/common.js", import.meta.url), "utf8");
  const sandbox: Record<string, unknown> = {
    document: { documentElement: { getAttribute: () => null, lang: "" } },
    navigator: { language: "en" },
    location: { hostname: "abc.ext-twitch.tv", search: `?language=${language}`, origin: "https://abc.ext-twitch.tv" },
    URLSearchParams,
    TextEncoder,
    crypto: globalThis.crypto,
    btoa,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.BO as BOApi;
}
const plain = (v: unknown) => JSON.parse(JSON.stringify(v ?? null));

describe("twitch-broadcast/common.js", () => {
  const BO = loadCommon();

  test("parseState fa gli stessi controlli di parseExtState", () => {
    const ok = extStateOf(demoState("it"));
    assert.deepEqual(plain(BO.parseState(plain(ok))), plain(parseExtState(plain(ok))));
    const samples: unknown[] = [null, 3, {}, { ...plain(ok), v: 2 }];
    const mut = (f: (s: ExtState) => void) => {
      const s = plain(ok) as ExtState;
      f(s);
      return s;
    };
    samples.push(
      mut((s) => (s.p[1].s = 9)),
      mut((s) => (s.p[1].a = -1)),
      mut((s) => (s.p[0].d[0].l = "Big Bad")),
      mut((s) => (s.p[0].d[0].p = { abc: 0 })),
      mut((s) => (s.p[0].n = "x".repeat(40))),
      mut((s) => (s.t.ph = "y\u200b".repeat(5))),
    );
    for (const s of samples) assert.deepEqual(plain(BO.parseState(s)), plain(parseExtState(s)), JSON.stringify(s).slice(0, 80));
  });

  test("parseMessage legge il messaggio di pubsubMessage, anche quello da rileggere", () => {
    const ext = extStateOf(demoState("en"));
    const m = plain(BO.parseMessage(pubsubMessage("abcdefgh1234", 5, "2026-11-05T20:00:00.000Z", ext)));
    assert.deepEqual(m, { id: "abcdefgh1234", v: 5, refetch: false, state: plain(parseExtState(plain(ext))) });
    assert.deepEqual(plain(BO.parseMessage(JSON.stringify({ t: "bc", id: "abcdefgh1234", v: 6, at: "x", r: 1 }))), { id: "abcdefgh1234", v: 6, refetch: true, state: null });
    assert.deepEqual(plain(BO.parseMessage(pubsubMessage("abcdefgh1234", 7, "x", null))), { id: "abcdefgh1234", v: 7, refetch: false, state: null });
    for (const bad of ["{", JSON.stringify({ t: "state", id: "abcdefgh1234", v: 1, s: null }), JSON.stringify({ t: "bc", v: 1, s: null }), JSON.stringify({ t: "bc", id: "abcdefgh1234", v: -1, s: null })]) {
      assert.equal(BO.parseMessage(bad), null, bad);
    }
  });

  test("il codice del gioco è lo stesso del sito (encodeGameCode)", async () => {
    const keys = ["C00115_MC", "C00245_MB", "C00013_SB", "C00029_MB", "C00202_MB", "C00015_SB", "C00064_MB", "C00021_MB", "C00109_MB", "C00006_MB", "C00173_MB", "C00125_MB", "C00258_MB_V00011"];
    assert.equal(await BO.encodeGameCode(keys), await encodeGameCode(keys));
  });

  test("tabella delle carte: voci sbagliate scartate, immagini solo da /cards/ di originsmeta.com", () => {
    const t = BO.parseCards({
      v: 1,
      labels: { unit: "Unità", spell: "Magia", good: "Good", evil: "Evil", neutral: "Neutral" },
      cards: {
        alice: ["Alice", 2, 0, 0, 2, 3, "good", "Testo", "/cards/alice.webp", "/cards/art/alice.webp", "C00012_MB"],
        rotta: ["X", "due", 0, 0, 1, 1, "", "", null, null, null],
        "Non Slug": ["Y", 1, 0, 0, 1, 1, "", "", null, null, null],
        fuori: ["Z", 1, 0, 0, 1, 1, "", "", "https://evil.example/x.webp", "javascript:alert(1)", "<b>"],
      },
    });
    assert.deepEqual(Object.keys(t.cards).sort(), ["alice", "fuori"]);
    assert.equal(t.cards.alice.image, "https://originsmeta.com/cards/alice.webp");
    assert.equal(t.cards.alice.key, "C00012_MB");
    assert.deepEqual([t.cards.fuori.image, t.cards.fuori.key], [null, null]);
    assert.equal(t.labels.unit, "Unità");
  });

  test("testi: le stesse chiavi in tutte le otto lingue, segnaposto uguali, francese con lo spazio insecabile", () => {
    const langs = Object.keys(BO.TEXTS);
    assert.deepEqual(langs, ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"]);
    const keys = Object.keys(BO.TEXTS.en).sort();
    const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const l of langs) {
      assert.deepEqual(Object.keys(BO.TEXTS[l]).sort(), keys, l);
      for (const k of keys) {
        assert.ok(BO.TEXTS[l][k].trim(), `${l}.${k} vuoto`);
        assert.equal(holes(BO.TEXTS[l][k]), holes(BO.TEXTS.en[k]), `${l}.${k}: segnaposto`);
      }
    }
    for (const k of keys) assert.ok(!/ [:;!?»]|« /.test(BO.TEXTS.fr[k]), `fr.${k}: serve lo spazio insecabile`);
    for (const l of langs) assert.match(BO.TEXTS[l].footer, /Koin Games/, `${l}: la dicitura su Koin Games`);
  });

  test("lingua dall'iframe di Twitch: zh-cn e zh-tw in cinese semplificato, lingue sconosciute in inglese", () => {
    assert.equal(loadCommon("zh-cn").lang, "zh-cn");
    assert.equal(loadCommon("zh-tw").lang, "zh-cn");
    assert.equal(loadCommon("pt-br").lang, "pt");
    assert.equal(loadCommon("ja").lang, "en");
    assert.equal(loadCommon("it").t("deck", { n: 2 }), "Mazzo 2");
  });
});

describe("l'indirizzo della regia resta corto anche con la diretta accesa", () => {
  test("i riferimenti alle immagini passano dall'indirizzo e tornano uguali", () => {
    const s = withSponsors(demoState("it"), [imageRef(HASH)]);
    assert.deepEqual(decodeState(encodeState(s), anyCard)?.sponsors.items[0].logo, imageRef(HASH));
  });
});
