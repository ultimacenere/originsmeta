/** Test delle partite contro i bot (botNames.ts): `npm test` nella cartella tracker/. */
import { test } from "node:test";
import assert from "node:assert/strict";
import names from "./bot-names.json";
import { botKeys, botMatch, isBotName, leagueMatch, nameKey, SAME_VERSUS_MS, VERSUS_LOOKBACK_MS } from "./botNames";

test("Big Bob è nell'elenco dei bot", () => {
  assert.ok((names as string[]).some((n) => nameKey(n) === "BIGBOB"));
});

test("nomi dei bot letti dall'OCR sulle schermate VS del 10-12/10", () => {
  // letture vere dell'OCR di Windows sui fotogrammi salvati (ritaglio raddrizzato e ingrandito)
  assert.equal(isBotName("BIG BOB"), true);
  assert.equal(isBotName("Big Bob"), true);
  assert.equal(isBotName("B1G B0B"), true);
  assert.equal(isBotName("a (BOT)"), true); // "RED (BOT)" della Battaglia Boss, col teschio letto come "a"
  assert.equal(isBotName("RED (B0T)"), true);
  assert.equal(isBotName("TINY [BOT]"), true);
  assert.equal(isBotName("ANDRA\nAPPENA USCITO"), false);
});

test("le persone restano persone: un pezzo del nome di un bot non basta", () => {
  for (const human of ["ANDRA", "TREVOR", "UAXCUI", "BIG BOBBY", "BOBBIG", "ROBOT", "BOTTE", "BOT TEAM", ""]) assert.equal(isBotName(human), false, human);
});

test("elenco: nomi interi, maiuscole, accenti e confusioni dell'OCR", () => {
  const keys = botKeys(["Señor Crab", "Ollie", "x"]);
  assert.equal(isBotName("SENOR CRAB", keys), true);
  assert.equal(isBotName("0LLIE", keys), true);
  assert.equal(isBotName("OLLIES", keys), false);
  // nomi troppo corti non entrano: farebbero bot chiunque si chiami così
  assert.equal(isBotName("X", keys), false);
});

test("la partita è contro un bot se lo è la sua schermata VS, la più recente prima della fine", () => {
  const end = 1_000_000_000;
  const vsBot = end - 12 * 60_000;
  // una schermata VS letta tre volte: basta una lettura "bot"
  assert.equal(botMatch([{ ms: vsBot, bot: false }, { ms: vsBot + 700, bot: true }, { ms: vsBot + 1400, bot: false }], end), true);
  // dopo la partita contro il bot, una contro una persona: vale la schermata VS più recente
  assert.equal(botMatch([{ ms: vsBot - 15 * 60_000, bot: true }, { ms: vsBot, bot: false }], end), false);
  // la schermata VS di una partita dopo la fine non conta
  assert.equal(botMatch([{ ms: end + 1000, bot: true }], end), false);
  // troppo vecchia: non è la schermata di questa partita
  assert.equal(botMatch([{ ms: end - VERSUS_LOOKBACK_MS - 1, bot: true }], end), false);
  // nessuna schermata VS letta: si registra come prima
  assert.equal(botMatch([], end), false);
  // una lettura "bot" di una schermata VS precedente, più di SAME_VERSUS_MS prima dell'ultima, non conta
  assert.equal(botMatch([{ ms: vsBot - SAME_VERSUS_MS - 1, bot: true }, { ms: vsBot, bot: false }], end), false);
});

test("classificata se la schermata VS della partita aveva la lega sopra il mio ritratto (22/10/2026)", () => {
  const end = 1_000_000_000;
  const vs = end - 12 * 60_000;
  // la scritta entra con un'animazione: il primo ritaglio non la vede, il secondo sì
  assert.equal(leagueMatch([{ ms: vs, league: false }, { ms: vs + 600, league: true }], end), true);
  // allenamento dopo una classificata: vale la schermata VS più recente
  assert.equal(leagueMatch([{ ms: vs - 15 * 60_000, league: true }, { ms: vs, league: false }], end), false);
  // nessuna schermata VS letta (scanner spento): coda normale
  assert.equal(leagueMatch([], end), false);
  // la schermata di una partita dopo la fine, o troppo vecchia, non conta
  assert.equal(leagueMatch([{ ms: end + 1000, league: true }], end), false);
  assert.equal(leagueMatch([{ ms: end - VERSUS_LOOKBACK_MS - 1, league: true }], end), false);
});
