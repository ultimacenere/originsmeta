/**
 * Test della vetrina dei profili (pacchetto VETRINA, 27/09/2026): `node --test src/lib/community/showcase.test.ts`.
 * Regole pure di showcase.ts e profileMedia.ts (immagini caricate, copertine, colori d'accento e contrasti, frase,
 * orari delle dirette e fusi orari, modulo di /account, lettura della riga), etichette EN/IT/ES e SQL del pacchetto
 * (supabase/wave2-VETRINA.sql, o in fondo a schema.sql dopo l'integrazione): stessi elenchi e limiti del codice,
 * grant per colonna accettata da scripts/schema-guard.mjs, funzioni security definer con search_path fissato.
 *
 * showcase.ts è scritto per Next (import senza estensione): come deckQuality.test.ts, prima di caricarlo il test
 * registra un piccolo hook di risoluzione dei moduli di Node che aggiunge `.ts` agli import senza estensione.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PROFILES_GRANTS, PROFILES_REVOKE, schemaProblems, singleDollarLines, sqlStatements } from "../../../scripts/schema-guard.mjs";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const srcUrl = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const spec = specifier.startsWith("@/") ? new URL(specifier.slice(2), srcUrl).href : specifier;
    if ((/^\.\.?\//.test(spec) || spec.startsWith("file:")) && !/\.(?:[cm]?[jt]sx?|json)$/.test(spec)) {
      try {
        return next(`${spec}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    return next(spec, context);
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const S: typeof import("./showcase") = await import("./showcase.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const B: typeof import("./badges") = await import("./badges.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const labelsModule: typeof import("../showcaseLabels") = await import("../showcaseLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { en }: typeof import("../dictionaries/en") = await import("../dictionaries/en.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { it }: typeof import("../dictionaries/it") = await import("../dictionaries/it.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { es }: typeof import("../dictionaries/es") = await import("../dictionaries/es.ts");

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const USER = "0f8b9c2e-1a2b-4c3d-8e9f-a0b1c2d3e4f5";
const OTHER = "11111111-2222-4333-8444-555555555555";
const ms = (iso: string) => Date.parse(iso);

describe("immagini caricate (profileMedia.ts)", () => {
  test("percorso nella cartella dell'utente, con il tipo giusto e un nome scelto dal sito", () => {
    assert.ok(S.mediaPathOk(USER, "avatar", `${USER}/avatar/0b6f3c1e-9d7a-4f1e-8c55-2a0e7d9b1c33.webp`));
    assert.ok(S.mediaPathOk(USER, "cover", `${USER}/cover/abcdefgh.jpg`));
    assert.ok(S.mediaPathOk(USER, "cover", `${USER}/cover/abcdefgh.jpeg`));
    assert.ok(S.mediaPathOk(USER, "avatar", `${USER}/avatar/abcdefgh.png`));
    assert.ok(!S.mediaPathOk(USER, "avatar", `${OTHER}/avatar/abcdefgh.webp`), "cartella di un altro");
    assert.ok(!S.mediaPathOk(USER, "avatar", `${USER}/cover/abcdefgh.webp`), "tipo di immagine sbagliato");
    assert.ok(!S.mediaPathOk(USER, "avatar", `${USER}/avatar/abcdefgh.gif`), "estensione non ammessa");
    assert.ok(!S.mediaPathOk(USER, "avatar", `${USER}/avatar/short.webp`), "nome troppo corto");
    assert.ok(!S.mediaPathOk(USER, "avatar", `${USER}/avatar/../../x/abcdefgh.webp`));
    assert.ok(!S.mediaPathOk(USER, "avatar", `${USER}/avatar/sub/abcdefgh.webp`));
    assert.ok(!S.mediaPathOk(USER.toUpperCase(), "avatar", `${USER.toUpperCase()}/avatar/abcdefgh.webp`), "gli id si scrivono in minuscolo");
    assert.ok(!S.mediaPathOk("non-un-id", "avatar", "non-un-id/avatar/abcdefgh.webp"));
    assert.ok(!S.mediaPathOk(USER, "avatar", null));
    assert.ok(S.anyMediaPathOk("avatar", `${OTHER}/avatar/abcdefgh.webp`));
    assert.ok(!S.anyMediaPathOk("avatar", "https://evil.example/a.webp"));
  });
  test("estensione dal tipo del file e indirizzo pubblico", () => {
    assert.equal(S.mediaExtension("image/webp"), "webp");
    assert.equal(S.mediaExtension("image/jpeg"), "jpg");
    assert.equal(S.mediaExtension("image/png"), "png");
    assert.equal(S.mediaExtension("image/gif"), null);
    assert.equal(S.mediaPublicUrl("https://x.supabase.co/", "a/b.webp"), "https://x.supabase.co/storage/v1/object/public/profile-media/a/b.webp");
  });
  test("foto mostrata: prima quella caricata, poi avatar_url, altrimenti nessuna", () => {
    const base = "https://x.supabase.co";
    const path = `${USER}/avatar/abcdefgh.webp`;
    assert.equal(S.avatarSrc({ avatar_path: path, avatar_url: "https://cdn.discordapp.com/a.png" }, base), `${base}/storage/v1/object/public/profile-media/${path}`);
    assert.equal(S.avatarSrc({ avatar_path: null, avatar_url: "https://cdn.discordapp.com/a.png" }, base), "https://cdn.discordapp.com/a.png");
    assert.equal(S.avatarSrc({ avatar_path: "https://evil.example/x.webp", avatar_url: "https://cdn.discordapp.com/a.png" }, base), "https://cdn.discordapp.com/a.png", "un percorso che non torna non passa");
    assert.equal(S.avatarSrc({ avatar_url: null }, base), null);
    assert.equal(S.avatarSrc(null, base), null);
  });
});

describe("copertine e colori d'accento", () => {
  const css = read("../../app/globals.css");
  const token = (name: string) => new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`).exec(css)?.[1];
  test("otto sfondi preimpostati, id unici, quello predefinito fra loro", () => {
    assert.equal(S.COVER_PRESETS.length, 8);
    assert.equal(new Set(S.COVER_PRESETS).size, 8);
    assert.ok(S.isCoverPreset(S.DEFAULT_COVER_PRESET));
    assert.ok(!S.isCoverPreset("keyart"));
  });
  test("gli sfondi sono solo gradienti e SVG in linea: nessuna immagine esterna né materiale Koin", () => {
    for (const p of S.COVER_PRESETS) {
      const style = S.coverStyle(p);
      const urls = [...style.backgroundImage.matchAll(/url\("([^"]*)"\)/g)].map((m) => m[1]);
      for (const u of urls) {
        assert.ok(u.startsWith("data:image/svg+xml,"), `${p}: ${u.slice(0, 40)}`);
        assert.ok(!u.includes("#"), `${p}: i colori dentro l'SVG vanno codificati`);
        assert.match(decodeURIComponent(u.slice("data:image/svg+xml,".length)), /^<svg xmlns='http:\/\/www\.w3\.org\/2000\/svg' .*<\/svg>$/);
      }
      assert.doesNotMatch(style.backgroundImage, /\/media\/|\/cards\/|https?:\/\/(?!www\.w3\.org)/, p);
      // tanti strati quanti le misure e le posizioni
      const layers = style.backgroundImage.split(/,(?![^(]*\))/).length;
      assert.ok(layers >= 1);
      assert.equal(style.backgroundSize.split(",").length, style.backgroundPosition.split(",").length, p);
    }
  });
  test("da sei a otto colori d'accento, tutti leggibili sul blu notte (almeno 4,5:1)", () => {
    assert.ok(S.ACCENTS.length >= 6 && S.ACCENTS.length <= 8);
    const night = token("night");
    const night2 = token("night-2");
    assert.ok(night && night2, "token night in globals.css");
    for (const a of S.ACCENTS) {
      assert.match(S.ACCENT_HEX[a], /^#[0-9a-f]{6}$/);
      assert.ok(S.contrastRatio(S.ACCENT_HEX[a], night!) >= 4.5, `${a} su night: ${S.contrastRatio(S.ACCENT_HEX[a], night!).toFixed(2)}`);
      assert.ok(S.contrastRatio(S.ACCENT_HEX[a], night2!) >= 4.5, `${a} su night-2`);
    }
  });
  test("i colori della palette del sito sono i suoi token (violetto e pesca schiariti apposta)", () => {
    const same: Record<string, string> = { sky: "sky", mint: "mint", gold: "gold", crimson: "pink", coral: "bad", green: "good" };
    for (const [accent, name] of Object.entries(same)) assert.equal(S.ACCENT_HEX[accent as keyof typeof S.ACCENT_HEX], token(name), accent);
  });
  test("accento predefinito (celeste): nessuno stile in più", () => {
    assert.equal(S.accentBorder(null), undefined);
    assert.equal(S.accentBorder("sky"), undefined);
    assert.deepEqual(S.accentBorder("mint"), { borderColor: S.ACCENT_HEX.mint });
    assert.deepEqual(S.accentText("violet"), { color: S.ACCENT_HEX.violet });
  });
  test("rapporto di contrasto: nero su bianco 21:1, un colore con se stesso 1:1", () => {
    assert.equal(Math.round(S.contrastRatio("#000000", "#ffffff")), 21);
    assert.equal(S.contrastRatio("#31e3bd", "#31e3bd"), 1);
  });
});

describe("frase di presentazione", () => {
  test("testo semplice su una riga, invisibili tolti, vuota = nessuna", () => {
    assert.deepEqual(S.cleanTagline("  Midrange   lover \n streaming  "), { ok: true, value: "Midrange lover streaming" });
    assert.deepEqual(S.cleanTagline("a​b‮c"), { ok: true, value: "abc" });
    assert.deepEqual(S.cleanTagline("   "), { ok: true, value: null });
    assert.deepEqual(S.cleanTagline(undefined), { ok: true, value: null });
    assert.deepEqual(S.cleanTagline("<b>ciao</b>"), { ok: true, value: "<b>ciao</b>" }, "le parentesi restano testo: React lo scrive come testo");
  });
  test("80 caratteri al massimo (un'emoji conta uno), oltre è un errore e non un taglio", () => {
    assert.equal(S.TAGLINE_MAX, 80);
    assert.deepEqual(S.cleanTagline("x".repeat(80)), { ok: true, value: "x".repeat(80) });
    assert.deepEqual(S.cleanTagline(`${"x".repeat(79)}🔥`), { ok: true, value: `${"x".repeat(79)}🔥` });
    assert.deepEqual(S.cleanTagline("x".repeat(81)), { ok: false, error: "long" });
    assert.deepEqual(S.cleanTagline("x".repeat(100_000)), { ok: false, error: "long" });
  });
});

describe("orari delle dirette", () => {
  test("righe del modulo: le vuote si saltano, ordine per giorno e ora, niente doppioni", () => {
    const res = S.parseScheduleRows(["4", "0", "2", "0"], ["21:00", "20:30", "", "20:30"], ["120", "", "60", ""]);
    assert.deepEqual(res, {
      ok: true,
      value: [
        { day: 0, time: "20:30" },
        { day: 4, time: "21:00", minutes: 120 },
      ],
    });
  });
  test("errori riga per riga: giorno, ora, durata", () => {
    const res = S.parseScheduleRows(["7", "1", "2"], ["21:00", "25:00", "21:00"], ["", "", "10"]);
    assert.equal(res.ok, false);
    assert.deepEqual(!res.ok && res.errors, [
      { index: 0, error: "day" },
      { index: 1, error: "time" },
      { index: 2, error: "duration" },
    ]);
    const long = S.parseScheduleRows(["1"], ["21:00"], ["721"]);
    assert.equal(long.ok, false);
    assert.deepEqual(S.parseScheduleRows(["1"], ["21:00"], ["720"]), { ok: true, value: [{ day: 1, time: "21:00", minutes: 720 }] });
  });
  test("al massimo sette orari", () => {
    const days = ["0", "1", "2", "3", "4", "5", "6", "0"];
    const times = ["20:00", "20:00", "20:00", "20:00", "20:00", "20:00", "20:00", "22:00"];
    const res = S.parseScheduleRows(days, times, []);
    assert.equal(res.ok, false);
    assert.ok(!res.ok && res.tooMany);
    assert.equal(S.parseScheduleRows(days.slice(0, 7), times.slice(0, 7), []).ok, true);
  });
  test("orari letti dal database: quello che non torna si scarta", () => {
    const raw = [
      { day: 2, time: "18:00" },
      { day: 7, time: "18:00" },
      { day: 1, time: "9:00" },
      { day: 1, time: "21:00", minutes: 90 },
      { day: 1, time: "21:00", minutes: 5 },
      { day: 1, time: "22:00", extra: true },
      "lunedì",
      null,
      { day: 1.5, time: "21:00" },
      { day: 3, time: "21:00", minutes: 60 },
    ];
    assert.deepEqual(S.storedSchedule(raw), [
      { day: 1, time: "21:00", minutes: 90 },
      { day: 2, time: "18:00" },
      { day: 3, time: "21:00", minutes: 60 },
    ]);
    assert.deepEqual(S.storedSchedule("[]"), []);
    assert.deepEqual(S.storedSchedule(null), []);
  });
  test("ora da orologio → istante, con l'ora legale", () => {
    assert.equal(S.zonedTimeToUtc(2026, 7, 1, 21, 0, "Europe/Rome"), ms("2026-07-01T19:00:00Z"), "CEST, +2");
    assert.equal(S.zonedTimeToUtc(2026, 1, 15, 21, 0, "Europe/Rome"), ms("2026-01-15T20:00:00Z"), "CET, +1");
    assert.equal(S.zonedTimeToUtc(2026, 7, 1, 21, 0, "America/New_York"), ms("2026-07-02T01:00:00Z"), "EDT, -4");
    assert.equal(S.zonedTimeToUtc(2026, 7, 1, 21, 0, "America/Argentina/Buenos_Aires"), ms("2026-07-02T00:00:00Z"), "-3 tutto l'anno");
    assert.equal(S.zonedTimeToUtc(2026, 7, 1, 21, 0, "UTC"), ms("2026-07-01T21:00:00Z"));
    // la notte in cui si va avanti le 02:30 non esistono: diventano le 03:30 (01:30 UTC)
    assert.equal(S.zonedTimeToUtc(2026, 3, 29, 2, 30, "Europe/Rome"), ms("2026-03-29T01:30:00Z"));
    // la notte in cui si torna indietro le 02:30 esistono due volte: una delle due
    assert.ok([ms("2026-10-25T00:30:00Z"), ms("2026-10-25T01:30:00Z")].includes(S.zonedTimeToUtc(2026, 10, 25, 2, 30, "Europe/Rome")));
  });
  test("prossima diretta dal punto di vista di un istante (giorno 0 = lunedì)", () => {
    const mon21 = { day: 0, time: "21:00" };
    // domenica 27/09/2026 alle 20:00 a Roma → lunedì 28 alle 21:00 (19:00 UTC)
    assert.deepEqual(S.nextSlot(mon21, "Europe/Rome", ms("2026-09-27T18:00:00Z")), { start: ms("2026-09-28T19:00:00Z"), ongoing: false });
    // lunedì alle 21:30, senza durata: la settimana dopo
    assert.deepEqual(S.nextSlot(mon21, "Europe/Rome", ms("2026-09-28T19:30:00Z")), { start: ms("2026-10-05T19:00:00Z"), ongoing: false });
    // con due ore di durata è in corso
    assert.deepEqual(S.nextSlot({ ...mon21, minutes: 120 }, "Europe/Rome", ms("2026-09-28T19:30:00Z")), {
      start: ms("2026-09-28T19:00:00Z"),
      end: ms("2026-09-28T21:00:00Z"),
      ongoing: true,
    });
    // domenica alle 23:00 per due ore: lunedì alle 00:30 è ancora in corso (è cominciata "ieri")
    assert.deepEqual(S.nextSlot({ day: 6, time: "23:00", minutes: 120 }, "Europe/Rome", ms("2026-09-27T22:30:00Z")), {
      start: ms("2026-09-27T21:00:00Z"),
      end: ms("2026-09-27T23:00:00Z"),
      ongoing: true,
    });
    // la domenica dopo il ritorno all'ora solare (25/10/2026): 21:00 a Roma = 20:00 UTC
    assert.deepEqual(S.nextSlot({ day: 6, time: "21:00" }, "Europe/Rome", ms("2026-10-20T10:00:00Z")), { start: ms("2026-10-25T20:00:00Z"), ongoing: false });
    // un fuso a ovest: lunedì 21:00 a Città del Messico (-6) = martedì 03:00 UTC
    assert.deepEqual(S.nextSlot(mon21, "America/Mexico_City", ms("2026-09-27T18:00:00Z")), { start: ms("2026-09-29T03:00:00Z"), ongoing: false });
  });
  test("le prossime dirette: quelle in corso per prime, poi dalla più vicina", () => {
    const entries = [
      { day: 4, time: "21:00" },
      { day: 0, time: "21:00", minutes: 120 },
      { day: 1, time: "18:00" },
    ];
    const slots = S.upcomingSlots(entries, "Europe/Rome", ms("2026-09-28T19:30:00Z"));
    assert.deepEqual(
      slots.map((s) => [s.entry.day, s.ongoing]),
      [
        [0, true],
        [1, false],
        [4, false],
      ],
    );
  });
  test("nomi dei giorni dalla lingua della pagina, con l'iniziale maiuscola", () => {
    assert.equal(S.weekdayName("en", 2), "Wednesday");
    assert.equal(S.weekdayName("it", 0), "Lunedì");
    assert.equal(S.weekdayName("es", 6), "Domingo");
  });
  test("fusi fra cui scegliere: nomi IANA veri, senza doppioni, con i paesi delle tre lingue", () => {
    assert.equal(new Set(S.TIMEZONES).size, S.TIMEZONES.length);
    for (const tz of S.TIMEZONES) assert.doesNotThrow(() => new Intl.DateTimeFormat("en", { timeZone: tz }), tz);
    for (const tz of ["Europe/Rome", "Europe/Madrid", "America/Mexico_City", "America/Argentina/Buenos_Aires", "Europe/London", "America/New_York"]) assert.ok(S.isTimeZone(tz), tz);
    assert.equal(S.timeZoneName("America/Mexico_City"), "America/Mexico City");
  });
});

describe("modulo \"Personalizza la vetrina\"", () => {
  const ctx = { userId: USER, isLegendary: (slug: string) => slug === "merlin" || slug === "queen-of-hearts", deckIds: new Set(["3c9a6f7e-0b1d-4e2f-9a3b-5c6d7e8f9a0b"]) };
  const base = {
    cover: "",
    coverPath: "",
    accent: "",
    tagline: "",
    favoriteLegendary: "",
    featuredDeck: "",
    featuredVideo: "",
    days: [] as string[],
    times: [] as string[],
    durations: [] as string[],
    timezone: "",
  };
  test("tutto compilato: i valori da salvare, nella forma canonica", () => {
    const res = S.parseShowcaseForm(
      {
        ...base,
        cover: "violet-nebula",
        accent: "mint",
        tagline: "  In diretta ogni sera  ",
        favoriteLegendary: "merlin",
        featuredDeck: "3c9a6f7e-0b1d-4e2f-9a3b-5c6d7e8f9a0b",
        featuredVideo: "https://youtu.be/dQw4w9WgXcQ?t=42",
        days: ["0", "3"],
        times: ["21:00", "18:30"],
        durations: ["120", ""],
        timezone: "Europe/Rome",
      },
      ctx,
    );
    assert.deepEqual(res, {
      ok: true,
      value: {
        cover_preset: "violet-nebula",
        cover_path: null,
        accent: "mint",
        tagline: "In diretta ogni sera",
        favorite_legendary: "merlin",
        featured_deck: "3c9a6f7e-0b1d-4e2f-9a3b-5c6d7e8f9a0b",
        featured_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        schedule: [
          { day: 0, time: "21:00", minutes: 120 },
          { day: 3, time: "18:30" },
        ],
        schedule_tz: "Europe/Rome",
      },
    });
  });
  test("vuoto: nessuna scelta (copertina predefinita), niente orari", () => {
    assert.deepEqual(S.parseShowcaseForm(base, ctx), {
      ok: true,
      value: { cover_preset: null, cover_path: null, accent: null, tagline: null, favorite_legendary: null, featured_deck: null, featured_video: null, schedule: [], schedule_tz: null },
    });
  });
  test("copertina caricata: solo un file nella propria cartella, e allora niente sfondo preimpostato", () => {
    const own = `${USER}/cover/abcdefgh.webp`;
    const ok = S.parseShowcaseForm({ ...base, cover: "image", coverPath: own }, ctx);
    assert.ok(ok.ok && ok.value.cover_path === own && ok.value.cover_preset === null);
    const other = S.parseShowcaseForm({ ...base, cover: "image", coverPath: `${OTHER}/cover/abcdefgh.webp` }, ctx);
    assert.deepEqual(!other.ok && other.errors, { cover: "image" });
    const url = S.parseShowcaseForm({ ...base, cover: "image", coverPath: "https://evil.example/a.webp" }, ctx);
    assert.deepEqual(!url.ok && url.errors, { cover: "image" });
    const preset = S.parseShowcaseForm({ ...base, cover: "sunset", coverPath: own }, ctx);
    assert.ok(preset.ok && preset.value.cover_path === null, "con uno sfondo scelto il percorso si ignora");
  });
  test("valori fuori dagli elenchi: errori campo per campo, e nulla si salva", () => {
    const res = S.parseShowcaseForm(
      {
        ...base,
        cover: "keyart",
        accent: "white",
        tagline: "x".repeat(81),
        favoriteLegendary: "wolf",
        featuredDeck: "3c9a6f7e-0b1d-4e2f-9a3b-000000000000",
        featuredVideo: "https://www.twitch.tv/coachcrono",
        days: ["1"],
        times: ["21:00"],
        durations: [""],
        timezone: "Mars/Olympus",
      },
      ctx,
    );
    assert.deepEqual(!res.ok && res.errors, { cover: "invalid", accent: "invalid", tagline: "long", legendary: "invalid", deck: "invalid", video: "invalid", timezone: "invalid" });
  });
  test("orari senza fuso: il fuso serve", () => {
    const res = S.parseShowcaseForm({ ...base, days: ["1"], times: ["21:00"], durations: [""] }, ctx);
    assert.deepEqual(!res.ok && res.errors, { timezone: "required" });
    // anche con una riga sbagliata: l'errore della riga e quello del fuso insieme
    const bad = S.parseShowcaseForm({ ...base, days: ["1"], times: ["25:00"], durations: [""] }, ctx);
    assert.deepEqual(!bad.ok && bad.errors, { schedule: [{ index: 0, error: "time" }], timezone: "required" });
  });
  test("fuso senza orari: non si salva (è pubblico e direbbe solo dove vive chi salva)", () => {
    // il modulo manda sempre il fuso del browser: senza orari va ignorato, anche se è nell'elenco o non lo è
    for (const timezone of ["America/Bogota", "Europe/Rome", "Mars/Olympus", ""]) {
      const res = S.parseShowcaseForm({ ...base, cover: "aurora", accent: "sky", timezone }, ctx);
      assert.ok(res.ok, timezone);
      assert.equal(res.value.schedule_tz, null, timezone);
      assert.deepEqual(res.value.schedule, [], timezone);
    }
    // righe tutte vuote (nessuna ora scritta) = nessun orario
    const empty = S.parseShowcaseForm({ ...base, days: ["0", "3"], times: ["", " "], durations: ["", ""], timezone: "Europe/Madrid" }, ctx);
    assert.ok(empty.ok && empty.value.schedule_tz === null && empty.value.schedule.length === 0);
  });
  test("salvataggio identico a quello che c'è: si riconosce", () => {
    const res = S.parseShowcaseForm({ ...base, cover: "aurora", days: ["1"], times: ["21:00"], durations: ["90"], timezone: "Europe/Madrid" }, ctx);
    assert.ok(res.ok);
    const row = { ...res.value, avatar_path: null, schedule: [{ day: 1, time: "21:00", minutes: 90 }] };
    assert.ok(S.sameShowcaseValue(row, res.value));
    assert.ok(!S.sameShowcaseValue({ ...row, accent: "gold" }, res.value));
    assert.ok(!S.sameShowcaseValue({ ...row, schedule: [] }, res.value));
    assert.ok(!S.sameShowcaseValue({ ...row, schedule: [{ day: 1, time: "21:00", minutes: 90 }, { day: 9, time: "x" }] }, res.value), "una voce non valida nel database va riscritta");
  });
  test("vetrina vuota e dati rimasti (chi perde il ruolo li può togliere)", () => {
    // la vetrina vuota tocca tutte le colonne della vetrina tranne la foto, che è di tutti
    assert.deepEqual(Object.keys(S.EMPTY_SHOWCASE).sort(), S.VETRINA_COLUMNS.split(", ").filter((c) => c !== "avatar_path").sort());
    assert.deepEqual(S.EMPTY_SHOWCASE.schedule, []);
    assert.ok(Object.entries(S.EMPTY_SHOWCASE).every(([k, v]) => (k === "schedule" ? Array.isArray(v) : v === null)));
    assert.equal(S.hasShowcaseData(null), false);
    assert.equal(S.hasShowcaseData({ ...S.EMPTY_SHOWCASE, avatar_path: `${USER}/avatar/abcdefgh.webp` }), false, "la foto non conta");
    assert.equal(S.hasShowcaseData({ ...S.EMPTY_SHOWCASE, tagline: "ciao" }), true);
    assert.equal(S.hasShowcaseData({ ...S.EMPTY_SHOWCASE, schedule_tz: "Europe/Rome" }), true, "anche un valore che la pagina non mostrerebbe");
    assert.equal(S.hasShowcaseData({ ...S.EMPTY_SHOWCASE, schedule: [{ day: 9 }] }), true);
    assert.equal(S.hasShowcaseData({ ...S.EMPTY_SHOWCASE, cover_preset: "keyart" }), true);
  });
  test("limite di frequenza: secondi che mancano, arrotondati in su", () => {
    const now = ms("2026-09-27T10:00:10.000Z");
    assert.equal(S.retryAfterSeconds(null, 10_000, now), 0);
    assert.equal(S.retryAfterSeconds("non una data", 10_000, now), 0);
    assert.equal(S.retryAfterSeconds("2026-09-27T10:00:00.000Z", 10_000, now), 0, "passati 10 s esatti");
    assert.equal(S.retryAfterSeconds("2026-09-27T10:00:01.000Z", 10_000, now), 1);
    assert.equal(S.retryAfterSeconds("2026-09-27T10:00:05.500Z", 10_000, now), 6);
    assert.equal(S.retryAfterSeconds("2026-09-27T10:00:10.000Z", 10_000, now), 10);
  });
});

describe("vetrina letta dal database", () => {
  test("ogni campo ricontrollato; gli orari senza fuso non si mostrano", () => {
    const v = S.toVetrina(
      {
        avatar_path: `${OTHER}/avatar/abcdefgh.webp`,
        cover_preset: "keyart",
        cover_path: `${USER}/cover/abcdefgh.webp`,
        accent: "gold",
        tagline: "Ciao​ mondo",
        favorite_legendary: "Merlin!",
        featured_deck: "non-un-id",
        featured_video: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
        schedule: [{ day: 0, time: "21:00" }],
        schedule_tz: null,
      },
      USER,
    );
    assert.deepEqual(v, {
      avatarPath: null,
      coverPreset: null,
      coverPath: `${USER}/cover/abcdefgh.webp`,
      accent: "gold",
      tagline: "Ciao mondo",
      favoriteLegendary: null,
      featuredDeck: null,
      featuredVideo: { provider: "youtube", kind: "short", id: "dQw4w9WgXcQ", url: "https://www.youtube.com/shorts/dQw4w9WgXcQ" },
      schedule: [],
      scheduleTz: null,
    });
    assert.deepEqual(S.toVetrina({ schedule: [{ day: 0, time: "21:00" }], schedule_tz: "Europe/Rome" }, USER).schedule, [{ day: 0, time: "21:00" }]);
    assert.deepEqual(S.toVetrina(null, USER).schedule, []);
  });
});

describe("etichette EN/IT/ES", () => {
  const { showcaseLabels, fillShowcase } = labelsModule;
  type Tree = { [k: string]: string | Tree };
  const keys = (t: Tree, prefix = ""): string[] => Object.entries(t).flatMap(([k, v]) => (typeof v === "string" ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`)));
  const leaves = (t: Tree): [string, string][] => Object.entries(t).flatMap(([k, v]) => (typeof v === "string" ? [[k, v] as [string, string]] : leaves(v)));
  const at = (t: Tree, path: string) => path.split(".").reduce<string | Tree>((x, k) => (x as Tree)[k], t) as string;
  test("stesse chiavi nelle tre lingue, nessun testo vuoto, stessi segnaposto dell'inglese", () => {
    const ref = keys(showcaseLabels.en as unknown as Tree).sort();
    for (const l of ["it", "es"] as const) {
      assert.deepEqual(keys(showcaseLabels[l] as unknown as Tree).sort(), ref, l);
      for (const k of ref) {
        const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
        assert.deepEqual(ph(at(showcaseLabels[l] as unknown as Tree, k)), ph(at(showcaseLabels.en as unknown as Tree, k)), `${l}.${k}`);
      }
    }
    for (const l of ["en", "it", "es"] as const) for (const [k, v] of leaves(showcaseLabels[l] as unknown as Tree)) assert.ok(v.trim(), `${l}.${k}`);
  });
  test("un nome per ogni sfondo e per ogni colore", () => {
    for (const l of ["en", "it", "es"] as const) {
      assert.deepEqual(Object.keys(showcaseLabels[l].presets).sort(), [...S.COVER_PRESETS].sort(), l);
      assert.deepEqual(Object.keys(showcaseLabels[l].accents).sort(), [...S.ACCENTS].sort(), l);
    }
  });
  test("i ruoli si chiamano come nei dizionari (Creator, Autore/Author/Autor, Pro, Staff)", () => {
    const dicts = { en, it, es };
    for (const l of ["en", "it", "es"] as const) {
      const names = dicts[l].community.badges;
      for (const text of [showcaseLabels[l].editor.notForRole, showcaseLabels[l].editor.errors.notAllowed]) {
        for (const b of B.SHOWCASE_BADGES) assert.ok(text.includes(names[b]), `${l}: ${names[b]} in "${text}"`);
      }
    }
  });
  test("niente nomi vietati sulle pagine e spagnolo con il tú", () => {
    const all = JSON.stringify(showcaseLabels);
    assert.doesNotMatch(all, /world ?of ?origins|worldoforigins/i);
    assert.doesNotMatch(all, /influencer/i);
    assert.doesNotMatch(JSON.stringify(showcaseLabels.es), /\b(vosotros|vuestr[oa]s?|usted)\b/i);
  });
  test("segnaposto: i valori entrano come testo", () => {
    assert.equal(fillShowcase("{a} e {b}", { a: "$&", b: 2 }), "$& e 2");
    assert.equal(fillShowcase("{manca}", {}), "{manca}");
  });
});

describe("pagine: privacy e /account", () => {
  test("la privacy ha il paragrafo delle foto e della vetrina (#profile-media)", () => {
    const privacy = read("../../app/[locale]/(site)/privacy/page.tsx");
    assert.match(privacy, /id="profile-media"/);
    assert.match(privacy, /showcaseLabels\[locale\]\.privacy/);
  });
});

/*
  SQL del pacchetto: nasce in supabase/wave2-VETRINA.sql e l'integrazione lo accoda a schema.sql. Il test legge lo schema
  completo (con il blocco già dentro o, finché non c'è, con il file accodato) e controlla che dica le stesse cose del codice.
*/
describe("database: supabase/wave2-VETRINA.sql", () => {
  const MARKER = "-- ===== 27/09/2026: VETRINA =====";
  const schema = read("../../../supabase/schema.sql");
  const fileUrl = new URL("../../../supabase/wave2-VETRINA.sql", import.meta.url);
  const block = schema.includes(MARKER) ? schema.slice(schema.indexOf(MARKER)) : existsSync(fileUrl) ? readFileSync(fileUrl, "utf8") : "";
  const full = schema.includes(MARKER) ? schema : `${schema}\n${block}`;
  const stmts = sqlStatements(block);
  const fullStmts = sqlStatements(full);
  const one = (re: RegExp) => {
    const found = stmts.filter((s) => re.test(s));
    assert.equal(found.length, 1, `${re}: ${found.length} istruzioni`);
    return found[0];
  };
  const quoted = (s: string) => [...s.matchAll(/'([a-z_-]+)'/g)].map((m) => m[1]);

  test("il blocco c'è, comincia con il suo titolo e si può applicare dopo lo schema", () => {
    assert.ok(block.startsWith(MARKER), "il file comincia con il titolo del blocco");
    assert.deepEqual(schemaProblems(full), []);
    assert.deepEqual(singleDollarLines(block), []);
  });
  test("dopo la revoke di 6c6756d e dopo il blocco CREATOR; nessuna revoke su profiles", () => {
    const at = fullStmts.findIndex((s) => s.startsWith("alter table public.profiles add column if not exists avatar_path"));
    assert.ok(at > fullStmts.lastIndexOf(PROFILES_REVOKE));
    assert.ok(at > fullStmts.indexOf(PROFILES_GRANTS[1]));
    assert.deepEqual(
      stmts.filter((s) => /^revoke\b/.test(s) && /\bpublic\.profiles\b/.test(s)),
      [],
    );
  });
  test("grant per colonna: esattamente le colonne della vetrina, quella che schema-guard conosce", () => {
    const grant = one(/^grant update \(.*\) on public\.profiles to authenticated$/);
    assert.equal(grant, PROFILES_GRANTS[2]);
    const cols = /\(([^)]+)\)/.exec(grant)![1].split(", ");
    assert.deepEqual(cols, S.VETRINA_COLUMNS.split(", "));
    for (const c of cols) assert.ok(stmts.some((s) => s.startsWith(`alter table public.profiles add column if not exists ${c} `)), c);
  });
  test("elenchi e limiti uguali al codice", () => {
    assert.deepEqual(quoted(one(/add constraint profiles_cover_preset_check/)).slice(0), [...S.COVER_PRESETS]);
    assert.deepEqual(quoted(one(/add constraint profiles_accent_check/)), [...S.ACCENTS]);
    one(/add constraint profiles_avatar_path_check/);
    one(/add constraint profiles_cover_path_check/);
    // dal testo del file (sqlStatements scrive tutto in minuscolo): la stessa espressione del codice, lettera per lettera
    assert.ok(block.includes(`avatar_path ~ ('^' || id::text || '/avatar/${S.MEDIA_FILE_RE}$')`));
    assert.ok(block.includes(`cover_path ~ ('^' || id::text || '/cover/${S.MEDIA_FILE_RE}$')`));
    assert.ok(one(/add constraint profiles_tagline_check/).includes(`public.deck_text_ok(tagline, ${S.TAGLINE_MAX})`));
    const schedule = one(/^create or replace function public\.profile_schedule_ok\(/);
    assert.ok(schedule.includes(`jsonb_array_length(s) > ${S.SCHEDULE_MAX}`));
    const entry = one(/^create or replace function public\.profile_schedule_entry_ok\(/);
    assert.ok(entry.includes(`between ${S.DURATION_MIN} and ${S.DURATION_MAX}`));
    assert.ok(entry.includes("'^[0-6]$'"));
    const bucket = one(/insert into storage\.buckets/);
    assert.ok(bucket.includes(`'profile-media', 'profile-media', true, ${S.COVER_MAX_BYTES}, array[${S.MEDIA_TYPES.map((t) => `'${t}'`).join(",")}]`));
    const upload = one(/create policy "profile media upload"/);
    // niente peso nella policy: lo Storage la prova prima di ricevere il file, senza metadati (sarebbe sempre 0)
    assert.doesNotMatch(upload, /metadata/);
    assert.ok(upload.includes(`public.profile_media_count() < ${S.MEDIA_FILES_MAX}`));
    // il fuso c'è se e solo se ci sono orari (è pubblico)
    assert.ok(one(/add constraint profiles_schedule_check/).includes("((schedule = '[]'::jsonb) = (schedule_tz is null))"));
    const guard = one(/^create or replace function public\.guard_profile_vetrina\(/);
    assert.ok(guard.includes(`profile_media_ok(new.avatar_path, ${S.AVATAR_MAX_BYTES})`));
    assert.ok(guard.includes(`profile_media_ok(new.cover_path, ${S.COVER_MAX_BYTES})`));
  });
  test("i fusi dell'elenco rispettano il vincolo del database", () => {
    one(/add constraint profiles_schedule_tz_check/);
    // dal testo del file: sqlStatements scrive tutto in minuscolo
    const m = /schedule_tz ~ '([^']+)'/.exec(block);
    assert.ok(m);
    const re = new RegExp(m[1]);
    for (const tz of S.TIMEZONES) assert.match(tz, re);
    for (const bad of ["Europe", "europe/rome", "Europe/Rome; drop", "../etc"]) assert.doesNotMatch(bad, re);
  });
  test("i ruoli con vetrina sono quelli di badges.ts (trigger e policy della copertina)", () => {
    const guard = one(/^create or replace function public\.guard_profile_vetrina\(/);
    const inTrigger = /old\.badge not in \(([^)]*)\)/.exec(guard);
    assert.ok(inTrigger);
    assert.deepEqual(quoted(inTrigger[1]).sort(), [...B.SHOWCASE_BADGES].sort());
    const inPolicy = /p\.badge in \(([^)]*)\) or p\.role = 'admin'/.exec(one(/create policy "profile media upload"/));
    assert.ok(inPolicy);
    assert.deepEqual(quoted(inPolicy[1]).sort(), [...B.SHOWCASE_BADGES].sort());
    // la foto aggiorna il lastmod di /u solo per i ruoli con vetrina
    const inLastmod = /if new\.badge in \(([^)]*)\) then new\.showcase_updated_at := now\(\)/.exec(guard);
    assert.ok(inLastmod);
    assert.deepEqual(quoted(inLastmod[1]).sort(), [...B.SHOWCASE_BADGES].sort());
  });
  test("date delle modifiche: le scrive solo il trigger, separate per foto e vetrina", () => {
    const guard = one(/^create or replace function public\.guard_profile_vetrina\(/);
    for (const c of ["avatar_updated_at", "vetrina_updated_at"]) {
      one(new RegExp(`^alter table public\\.profiles add column if not exists ${c} timestamptz$`));
      assert.ok(guard.includes(`new.${c} := now()`), c);
      // nessuna grant: l'utente non le scrive (la grant per colonna è esattamente VETRINA_COLUMNS)
      assert.ok(!S.VETRINA_COLUMNS.includes(c), c);
    }
    assert.ok(guard.includes("if new.avatar_path is distinct from old.avatar_path then new.avatar_updated_at := now()"));
    // la vetrina (tutte le colonne tranne la foto) scrive vetrina_updated_at e il lastmod
    const tuple = /if \(new\.([a-z_, .]+)\) is distinct from \(old\.[a-z_, .]+\) then new\.vetrina_updated_at := now\(\); new\.showcase_updated_at := now\(\)/.exec(guard);
    assert.ok(tuple, "tupla della vetrina");
    assert.deepEqual(
      tuple[1].split(", new.").sort(),
      S.VETRINA_COLUMNS.split(", ").filter((c) => c !== "avatar_path").sort(),
    );
  });
  test("bucket: lettura e cancellazione per cartella (e admin), mai il file in uso del proprietario della cartella", () => {
    const readPolicy = one(/create policy "profile media owners read"/);
    assert.ok(readPolicy.includes("((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())"));
    const del = one(/create policy "profile media owners delete"/);
    assert.ok(del.includes("((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())"));
    assert.ok(del.includes("p.id::text = (storage.foldername(name))[1] and (p.avatar_path = name or p.cover_path = name)"));
    assert.ok(!stmts.some((s) => /^create policy .* on storage\.objects for update/.test(s) && s.includes("profile-media")), "niente update");
  });
  test("lo strumento dello staff svuota le stesse colonne (scripts/clear-profile-media.mjs)", () => {
    const script = read("../../../scripts/clear-profile-media.mjs");
    for (const c of S.VETRINA_COLUMNS.split(", ")) assert.match(script, new RegExp(`"${c} = (null|'\\[\\]'::jsonb)"`), c);
    assert.match(script, /\/storage\/v1\/object\/\$\{BUCKET\}/);
    // i file si tolgono con l'API dello Storage: una delete sulla tabella lascerebbe l'oggetto (i commenti lo spiegano)
    const code = script
      .split(/\r?\n/)
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    assert.doesNotMatch(code, /delete from storage\.objects/i);
  });
  test("il trigger difende ogni campo della vetrina tranne la foto, che è di tutti", () => {
    const guard = one(/^create or replace function public\.guard_profile_vetrina\(/);
    for (const c of S.VETRINA_COLUMNS.split(", ")) {
      if (c === "avatar_path") continue;
      const check = c === "schedule" ? "new.schedule <> '[]'::jsonb and new.schedule is distinct from old.schedule" : `new.${c} is not null and new.${c} is distinct from old.${c}`;
      assert.ok(guard.includes(check), c);
    }
    assert.ok(!guard.includes("new.avatar_path is not null and new.avatar_path is distinct from old.avatar_path)"), "la foto non è riservata ai ruoli");
    assert.ok(guard.includes("d.owner = new.id and d.status = 'published'"), "mazzo in evidenza: suo e pubblicato");
    assert.ok(stmts.includes("create trigger profiles_guard_vetrina before update on public.profiles for each row execute function public.guard_profile_vetrina()"));
  });
  test("funzioni con search_path fissato; una sola security definer, limitata al proprio profilo; execute solo a chi serve", () => {
    const defs = stmts.filter((s) => /^create or replace function public\./.test(s));
    assert.ok(defs.length >= 7);
    for (const f of defs) assert.match(f, /set search_path = /, f.slice(0, 80));
    // il trigger e i controlli sui file girano con i privilegi di chi salva (vede la sua cartella): nessuna RLS saltata
    assert.deepEqual(
      defs.filter((f) => f.includes("security definer")).map((f) => /^create or replace function public\.([a-z_]+)\(/.exec(f)?.[1]),
      ["profile_discord_avatar"],
    );
    assert.ok(one(/^create or replace function public\.profile_discord_avatar\(/).includes("when auth.uid() is not null and auth.uid() <> uid and not public.is_admin() then null"));
    assert.ok(stmts.includes("revoke all on function public.guard_profile_vetrina() from public, anon, authenticated"));
    for (const f of ["profile_media_url(text)", "profile_media_ok(text, bigint)", "profile_media_count()", "profile_discord_avatar(uuid)", "profile_schedule_ok(jsonb)", "profile_schedule_entry_ok(jsonb)"]) {
      assert.ok(stmts.includes(`revoke all on function public.${f} from public, anon`), f);
      assert.ok(stmts.includes(`grant execute on function public.${f} to authenticated, service_role`), f);
    }
  });
  test("indirizzo pubblico delle foto uguale a quello del codice (progetto di env.ts)", () => {
    const env = read("../supabase/env.ts");
    const url = /NEXT_PUBLIC_SUPABASE_URL \|\| "([^"]+)"/.exec(env)?.[1];
    assert.ok(url);
    const fn = one(/^create or replace function public\.profile_media_url\(/);
    assert.ok(fn.includes(`'${S.mediaPublicUrl(url, "")}' || p`), fn);
  });
  test("togliendo la foto torna solo un indirizzo di Discord (i metadati li cambia l'utente)", () => {
    const m = /when m ~ '([^']+)' then m end/.exec(block);
    assert.ok(m);
    const re = new RegExp(m[1]);
    assert.match("https://cdn.discordapp.com/avatars/123456789/abcdef0123.png", re);
    assert.match("https://media.discordapp.net/avatars/1/a.webp?size=64", re);
    for (const bad of ["https://evil.example/a.png", "https://cdn.discordapp.com.evil.example/a.png", "http://cdn.discordapp.com/a.png", "https://cdn.discordapp.com/a.png?x=1", "https://cdn.discordapp.com/a b.png"]) assert.doesNotMatch(bad, re, bad);
  });
});
