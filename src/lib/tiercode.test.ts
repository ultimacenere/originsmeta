/**
 * Test del codice delle tier list personalizzate (`tiercode.ts`) con il runner integrato di Node:
 * `node --test src/lib/tiercode.test.ts`. Node 24 esegue il TypeScript direttamente: per questo l'import ha
 * l'estensione `.ts` e il file usa solo sintassi cancellabile (come `tournament/bracket.test.ts`).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  TITLE_MAX,
  cleanTitle,
  decodeTierCode,
  emptyBoard,
  encodeTierCode,
  isEmptyBoard,
  moveCard,
  rankedCount,
  tierListText,
  tierOf,
  unranked,
  type TierBoard,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in bracket.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./tiercode.ts";

const legendaries = new Set(["dorothy", "mulan", "merlin", "dracula", "three-not-so-little-pigs"]);
const baseCards = new Set(["aladdin", "baloo", "bagheera", "big-bad-wolf"]);
const known = { legendaries, cards: baseCards };

function board(tiers: Partial<TierBoard["tiers"]>, title = ""): TierBoard {
  const b = emptyBoard();
  return { title, tiers: { ...b.tiers, ...tiers } };
}

describe("encodeTierCode / decodeTierCode", () => {
  test("andata e ritorno con titolo accentato ed emoji", () => {
    const b = board({ S: ["dorothy", "mulan"], A: ["merlin"], D: ["dracula"] }, "La mia lista più bella 🐷");
    const code = encodeTierCode("legendaries", b);
    assert.ok(code.startsWith("TL1.l."));
    const back = decodeTierCode(code, known);
    assert.deepEqual(back, { kind: "legendaries", board: b });
  });

  test("i campi vuoti in coda si omettono", () => {
    assert.equal(encodeTierCode("legendaries", board({ S: ["dorothy", "mulan"], A: ["merlin"] })), "TL1.l..dorothy~mulan.merlin");
    assert.equal(encodeTierCode("cards", emptyBoard()), "TL1.c");
  });

  test("un link intero, un hash o un codice con percentuali si leggono", () => {
    const code = encodeTierCode("cards", board({ B: ["baloo", "aladdin"] }, "Top"));
    const url = `https://originsmeta.com/it/tier-list/create#${code}`;
    assert.deepEqual(decodeTierCode(url, known)?.board.tiers.B, ["baloo", "aladdin"]);
    assert.deepEqual(decodeTierCode(`#${code}`, known)?.board.title, "Top");
    assert.deepEqual(decodeTierCode(code.replace(/~/g, "%7E"), known)?.board.tiers.B, ["baloo", "aladdin"]);
    // in mezzo a un messaggio: il codice finisce al primo spazio
    assert.deepEqual(decodeTierCode(`guarda qui ${url} e dimmi`, known)?.board.tiers.B, ["baloo", "aladdin"]);
  });

  test("slug sconosciuti, di un'altra scheda, malformati o doppi si scartano", () => {
    const res = decodeTierCode("TL1.l..dorothy~carta-inventata~aladdin~Mulan~dorothy.mulan~dorothy", known);
    assert.deepEqual(res?.board.tiers, { S: ["dorothy"], A: ["mulan"], B: [], C: [], D: [] });
  });

  test("senza elenco delle voci valide si controlla solo la forma", () => {
    assert.deepEqual(decodeTierCode("TL1.c..qualunque-cosa~x--y")?.board.tiers.S, ["qualunque-cosa"]);
  });

  test("punti finali tagliati da una chat: stesso risultato", () => {
    const code = encodeTierCode("legendaries", board({ C: ["merlin"] }));
    // titolo, S, A e B vuoti: quattro campi vuoti fra il tipo e la C
    assert.equal(code, "TL1.l.....merlin");
    assert.deepEqual(decodeTierCode(`${code}...`, known)?.board.tiers.C, ["merlin"]);
  });

  test("versione o tipo sconosciuti, testo senza codice: null", () => {
    assert.equal(decodeTierCode("TL2.l..dorothy", known), null);
    assert.equal(decodeTierCode("TL1.x..dorothy", known), null);
    assert.equal(decodeTierCode("TL1", known), null);
    assert.equal(decodeTierCode("", known), null);
    assert.equal(decodeTierCode("OM1.eyJuIjoiIn0", known), null);
  });

  test("un titolo illeggibile diventa vuoto, le fasce restano", () => {
    const res = decodeTierCode("TL1.l.____.dorothy", known);
    assert.equal(res?.board.title, "");
    assert.deepEqual(res?.board.tiers.S, ["dorothy"]);
  });
});

describe("cleanTitle", () => {
  test("toglie caratteri di controllo e spazi doppi, taglia a TITLE_MAX", () => {
    assert.equal(cleanTitle("  Ciao\n\tmondo  "), "Ciao mondo");
    assert.equal(cleanTitle("x".repeat(100)).length, TITLE_MAX);
  });
  test("toglie i caratteri di direzione, lascia le emoji composte", () => {
    assert.equal(cleanTitle("‮Lista‬ di ⁦Davdas⁩ ‎!"), "Lista di Davdas !");
    const family = "\u{1F468}‍\u{1F469}‍\u{1F467}";
    assert.equal(cleanTitle(`Top ${family}`), `Top ${family}`);
  });
});

describe("moveCard", () => {
  const b = board({ S: ["dorothy", "mulan"], A: ["merlin"] });

  test("in fondo a una fascia, davanti a una carta, fra le non classificate", () => {
    assert.deepEqual(moveCard(b, "dracula", "A").tiers.A, ["merlin", "dracula"]);
    assert.deepEqual(moveCard(b, "merlin", "S", "mulan").tiers, { ...b.tiers, S: ["dorothy", "merlin", "mulan"], A: [] });
    assert.deepEqual(moveCard(b, "mulan", null).tiers.S, ["dorothy"]);
  });

  test("riordino nella stessa fascia", () => {
    assert.deepEqual(moveCard(b, "mulan", "S", "dorothy").tiers.S, ["mulan", "dorothy"]);
    assert.deepEqual(moveCard(b, "dorothy", "S", null).tiers.S, ["mulan", "dorothy"]);
  });

  test("davanti a sé stessa non cambia nulla, e l'originale resta intatto", () => {
    assert.equal(moveCard(b, "dorothy", "S", "dorothy"), b);
    moveCard(b, "dorothy", "D");
    assert.deepEqual(b.tiers.S, ["dorothy", "mulan"]);
  });
});

describe("letture", () => {
  const b = board({ S: ["dorothy"], B: ["merlin", "mulan"] });
  test("tierOf, unranked, rankedCount, isEmptyBoard", () => {
    assert.equal(tierOf(b, "merlin"), "B");
    assert.equal(tierOf(b, "dracula"), null);
    assert.deepEqual(unranked(b, ["dracula", "dorothy", "mulan", "three-not-so-little-pigs"]), ["dracula", "three-not-so-little-pigs"]);
    assert.equal(rankedCount(b), 3);
    assert.equal(isEmptyBoard(emptyBoard()), true);
    assert.equal(isEmptyBoard(board({}, "Solo il titolo")), false);
  });
});

describe("tierListText", () => {
  test("una riga per fascia, stella sulle Leggendarie, trattino sulle vuote", () => {
    const names: Record<string, { name: string; legendary?: boolean }> = {
      dorothy: { name: "Dorothy", legendary: true },
      baloo: { name: "Baloo" },
    };
    const text = tierListText(board({ S: ["dorothy", "baloo", "sparita"] }), (s) => names[s], "La mia lista", "Fatta su OriginsMeta");
    assert.equal(text, ["La mia lista", "S: ★ Dorothy, Baloo", "A: —", "B: —", "C: —", "D: —", "", "Fatta su OriginsMeta"].join("\n"));
  });
});
