/**
 * Test degli strumenti per le dirette (`stream.ts`): `node --test src/lib/stream.test.ts`.
 * Link breve, comando di chat, overlay e immagine del mazzo: le regole, senza database.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  CHAT_MAX,
  DECK_IMAGE_FORMATS,
  botCommands,
  chatEndpoint,
  chatLine,
  chatSafe,
  deckImageAlt,
  deckImageCacheControl,
  deckImageFilename,
  deckImageFormat,
  deckImagePath,
  deckOgImage,
  displayHost,
  fill,
  firstParam,
  imageVersion,
  isDeckSlug,
  normalizeUsername,
  overlayLayout,
  overlayUrl,
  pickLang,
  shortLinkTarget,
  shortLinkUrl,
  sortByCost,
  splitColumns,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./stream.ts";
// Le etichette vere, per controllare che le righe della chat stiano nel limite in tutte le lingue.
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { streamLabels } from "./streamLabels.ts";

const SITE = "https://originsmeta.com";
const locales = ["en", "it", "es"] as const;
/** Un codice del gioco vero nella forma (13 chiavi): la lunghezza conta per il limite dei 400 caratteri. */
const GAME_CODE = `KGBLDC${Buffer.from(`v1|${Array.from({ length: 13 }, (_, i) => `C${String(100 + i).padStart(5, "0")}_MB`).join("|")}`).toString("base64")}:0a1b2c3d`;

describe("indirizzi", () => {
  test("slug dei mazzi: lettere minuscole, cifre e trattini, senza trattini ai bordi", () => {
    assert.equal(isDeckSlug("spellcast-merlin-ab12"), true);
    assert.equal(isDeckSlug("control-2c2b"), true);
    assert.equal(isDeckSlug("a"), true);
    assert.equal(isDeckSlug("Spellcast"), false);
    assert.equal(isDeckSlug("-ab12"), false);
    assert.equal(isDeckSlug("ab12-"), false);
    assert.equal(isDeckSlug("../etc"), false);
    assert.equal(isDeckSlug("a b"), false);
    assert.equal(isDeckSlug("x".repeat(91)), false);
    assert.equal(isDeckSlug(undefined), false);
  });

  test("nome utente: senza @, in minuscolo, solo la forma dei nomi del sito", () => {
    assert.equal(normalizeUsername("coachcrono"), "coachcrono");
    assert.equal(normalizeUsername(" @CoachCrono "), "coachcrono");
    assert.equal(normalizeUsername("robip-origins"), "robip-origins");
    assert.equal(normalizeUsername("coach crono"), null);
    assert.equal(normalizeUsername("coach_crono"), null);
    assert.equal(normalizeUsername(""), null);
    assert.equal(normalizeUsername(null), null);
  });

  test("lingua dal parametro, con ripiego", () => {
    assert.equal(pickLang("it", locales, "en"), "it");
    assert.equal(pickLang("ES", locales, "en"), "es");
    assert.equal(pickLang("it-IT", locales, "en"), "it");
    assert.equal(pickLang("fr", locales, "en"), "en");
    assert.equal(pickLang(undefined, locales, "it"), "it");
  });

  test("primo valore di un parametro di pagina", () => {
    assert.equal(firstParam("a"), "a");
    assert.equal(firstParam(["b", "c"]), "b");
    assert.equal(firstParam(undefined), undefined);
  });

  test("host senza protocollo per i testi", () => {
    assert.equal(displayHost("https://originsmeta.com"), "originsmeta.com");
    assert.equal(displayHost("http://localhost:3000/"), "localhost:3000");
  });

  test("link breve: scheda nella lingua data, con gli UTM delle dirette", () => {
    assert.equal(shortLinkUrl(SITE, "control-2c2b"), "https://originsmeta.com/d/control-2c2b");
    assert.equal(shortLinkTarget("it", "control-2c2b", new URLSearchParams()), "/it/decks/community/control-2c2b?utm_source=stream&utm_medium=shortlink");
  });

  test("link breve: gli UTM del link vincono e passano, gli altri parametri no", () => {
    const target = shortLinkTarget("es", "control-2c2b", new URLSearchParams("utm_source=youtube&utm_campaign=deck-tech&utm_source=x&ref=spam&om_auth=signup"));
    assert.equal(target, "/es/decks/community/control-2c2b?utm_source=youtube&utm_medium=shortlink&utm_campaign=deck-tech");
    // un UTM vuoto non cancella quello di default
    assert.equal(shortLinkTarget("en", "a", new URLSearchParams("utm_medium=")), "/en/decks/community/a?utm_source=stream&utm_medium=shortlink");
  });
});

describe("comando di chat", () => {
  test("testo degli utenti: una riga, senza variabili dei bot né comandi in testa", () => {
    assert.equal(chatSafe("  Spell\ncast\t deck "), "Spell cast deck");
    assert.equal(chatSafe("/ban someone"), "ban someone");
    assert.equal(chatSafe(".timeout x 600"), "timeout x 600");
    assert.equal(chatSafe("!deck"), "deck");
    assert.equal(chatSafe("Pay $(urlfetch https://evil) now"), "Pay $ urlfetch https://evil) now");
    assert.equal(chatSafe("${customapi.x}"), "$ customapi.x}");
    assert.equal(chatSafe(`a${String.fromCharCode(0x200b)}b${String.fromCharCode(0x202e)}c${String.fromCharCode(0x2028)}d`), "a b c d");
    assert.equal(chatSafe("x".repeat(70), 60).length, 60);
    assert.ok(chatSafe("x".repeat(70), 60).endsWith("…"));
  });

  test("segnaposto senza interpretare i $ del testo", () => {
    assert.equal(fill("{a} e {b} {c}", { a: "$&", b: "$1" }), "$& e $1 {c}");
  });

  test("riga completa: mazzo, Leggendaria, link breve e codice del gioco", () => {
    const line = chatLine(
      { name: "Spellcast", author: "coachcrono", slug: "spellcast-ab12", legendary: "Merlin", gameCode: GAME_CODE },
      streamLabels.it.chat,
      "originsmeta.com",
    );
    assert.equal(line, `Mazzo di coachcrono: Spellcast (Leggendaria: Merlin) → originsmeta.com/d/spellcast-ab12 · Codice del gioco: ${GAME_CODE}`);
    assert.ok(line.length <= CHAT_MAX);
  });

  test("il codice resta fuori se la riga supera il limite, o se non ha la forma del gioco", () => {
    const deck = { name: "Spellcast", author: "coachcrono", slug: "spellcast-ab12", legendary: "Merlin", gameCode: GAME_CODE };
    const short = chatLine(deck, streamLabels.en.chat, "originsmeta.com", 150);
    assert.equal(short, "coachcrono's deck: Spellcast (Legendary: Merlin) → originsmeta.com/d/spellcast-ab12");
    const bad = chatLine({ ...deck, gameCode: "KGBLDC not a code" }, streamLabels.en.chat, "originsmeta.com");
    assert.ok(!bad.includes("KGBLDC"));
    const none = chatLine({ ...deck, legendary: null, gameCode: null }, streamLabels.es.chat, "originsmeta.com");
    assert.equal(none, "Mazo de coachcrono: Spellcast → originsmeta.com/d/spellcast-ab12");
  });

  test("nomi lunghissimi: la riga resta sotto i 400 caratteri in tutte le lingue", () => {
    for (const l of locales) {
      const line = chatLine(
        { name: "N".repeat(200), author: "A".repeat(200), slug: `${"s".repeat(80)}-ab12`, legendary: "L".repeat(200), gameCode: GAME_CODE },
        streamLabels[l].chat,
        "originsmeta.com",
      );
      assert.ok(line.length <= CHAT_MAX, `${l}: ${line.length}`);
      assert.ok(!line.startsWith("/") && !line.startsWith("."));
    }
  });

  test("indirizzi del comando e comandi dei bot", () => {
    const url = chatEndpoint(SITE, { user: "coachcrono" }, "it");
    assert.equal(url, "https://originsmeta.com/api/chat/deck?u=coachcrono&lang=it");
    assert.equal(chatEndpoint(SITE, { deck: "control-2c2b" }, "en"), "https://originsmeta.com/api/chat/deck?deck=control-2c2b&lang=en");
    const cmd = botCommands(url);
    assert.equal(cmd.nightbot, "!commands add !deck $(urlfetch https://originsmeta.com/api/chat/deck?u=coachcrono&lang=it)");
    assert.equal(cmd.streamelements, "!command add !deck ${customapi.https://originsmeta.com/api/chat/deck?u=coachcrono&lang=it}");
    assert.equal(cmd.fossabot, "$(customapi https://originsmeta.com/api/chat/deck?u=coachcrono&lang=it)");
  });
});

describe("overlay", () => {
  test("orientamento: verticale di default", () => {
    assert.equal(overlayLayout(undefined), "vertical");
    assert.equal(overlayLayout("vertical"), "vertical");
    assert.equal(overlayLayout("H"), "horizontal");
    assert.equal(overlayLayout("horizontal"), "horizontal");
    assert.equal(overlayLayout("qualcosa"), "vertical");
  });

  test("indirizzi dell'overlay", () => {
    assert.equal(overlayUrl(SITE, { deck: "control-2c2b" }, "vertical", "it"), "https://originsmeta.com/overlay/deck/control-2c2b?layout=vertical&lang=it");
    assert.equal(overlayUrl(SITE, { user: "coachcrono" }, "horizontal", "es"), "https://originsmeta.com/overlay/deck?u=coachcrono&layout=horizontal&lang=es");
  });
});

describe("lista delle carte", () => {
  test("per costo, poi per nome; senza costo in fondo", () => {
    const sorted = sortByCost([{ name: "Zorro", mana: 2 }, { name: "Custom" }, { name: "Alice", mana: 2 }, { name: "Beowulf", mana: 1 }]);
    assert.deepEqual(
      sorted.map((c) => c.name),
      ["Beowulf", "Alice", "Zorro", "Custom"],
    );
  });

  test("colonne consecutive, la prima con le carte in più", () => {
    assert.deepEqual(splitColumns([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 2), [
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
    ]);
    assert.deepEqual(splitColumns([1, 2, 3], 2), [[1, 2], [3]]);
    assert.deepEqual(splitColumns([1, 2], 1), [[1, 2]]);
  });
});

describe("immagine del mazzo", () => {
  test("formati e misure", () => {
    assert.equal(deckImageFormat(undefined), "og");
    assert.equal(deckImageFormat("16:9"), "16x9");
    assert.equal(deckImageFormat("9x16"), "9x16");
    assert.equal(deckImageFormat("story"), "9x16");
    assert.equal(deckImageFormat("boh"), "og");
    assert.deepEqual(DECK_IMAGE_FORMATS["16x9"], { width: 1280, height: 720 });
    assert.deepEqual(DECK_IMAGE_FORMATS["9x16"], { width: 1080, height: 1920 });
  });

  test("versione dalla data di modifica: cambia con la data, vuota senza data", () => {
    const a = imageVersion("2026-09-25T12:07:40.094454+00:00");
    const b = imageVersion("2026-09-25T12:07:41.094454+00:00");
    assert.match(a, /^[0-9a-z]+$/);
    assert.notEqual(a, b);
    assert.equal(imageVersion("non è una data"), "");
    assert.equal(imageVersion(null), "");
  });

  test("og:image della scheda: formato og con versione, e testo alternativo", () => {
    const og = deckOgImage("control-2c2b", "2026-09-25T12:07:40.094454+00:00", "it");
    assert.equal(og.width, 1200);
    assert.equal(og.height, 630);
    assert.match(og.url, /^\/api\/deck-image\/control-2c2b\?format=og&lang=it&v=[0-9a-z]+$/);
    assert.equal(
      deckImageAlt(streamLabels.it.image, { deck: "CONTROL", author: "magicofhandss", legendary: "Van Helsing" }),
      "Lista del mazzo CONTROL, mazzo di Van Helsing di magicofhandss: le dodici carte con il costo in mana.",
    );
    assert.equal(deckImageAlt(streamLabels.en.image, { deck: "X", author: "y", legendary: null }), "Deck list of X by y: the cards with their mana cost.");
  });

  test("indirizzo, nome del file e cache", () => {
    assert.equal(deckImagePath("control-2c2b", "og", "it", "t3abc"), "/api/deck-image/control-2c2b?format=og&lang=it&v=t3abc");
    assert.equal(deckImagePath("control-2c2b", "9x16", "es", "", true), "/api/deck-image/control-2c2b?format=9x16&lang=es&download=1");
    assert.equal(deckImageFilename("control-2c2b", "16x9"), "originsmeta-control-2c2b-16x9.png");
    assert.match(deckImageCacheControl(true), /s-maxage=86400/);
    assert.match(deckImageCacheControl(false), /s-maxage=600/);
    assert.doesNotMatch(deckImageCacheControl(true), /immutable/);
  });
});

describe("etichette", () => {
  test("le tre lingue hanno le stesse chiavi dell'inglese", () => {
    const keys = (o: object, prefix = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
    const en = keys(streamLabels.en).sort();
    for (const l of locales) assert.deepEqual(keys(streamLabels[l]).sort(), en, l);
  });

  test("i segnaposto delle etichette sono gli stessi nelle tre lingue", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    const walk = (a: Record<string, unknown>, b: Record<string, unknown>, path: string) => {
      for (const [k, v] of Object.entries(a)) {
        if (typeof v === "string") assert.equal(placeholders(b[k] as string), placeholders(v), `${path}${k}`);
        else if (v && typeof v === "object") walk(v as Record<string, unknown>, b[k] as Record<string, unknown>, `${path}${k}.`);
      }
    };
    for (const l of ["it", "es"] as const) walk(streamLabels.en, streamLabels[l], `${l}.`);
  });
});
