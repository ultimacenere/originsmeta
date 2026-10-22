/**
 * Partite contro i bot (14/10/2026, Pierluigi: le partite contro i bot "devono non solo essere rimosse dalle statistiche
 * ma anche non devono più essere registrate", e "devi fare in modo che il tracker legga i nomi"). Funzioni pure, senza
 * Electron né Node.
 *
 * Come funziona: nella schermata VS la finestra nascosta dello scanner ritaglia il nome dell'avversario (in basso a
 * destra, `VS_OPP_NAME` in recognize.ts), il processo principale lo legge con l'OCR di Windows (main/ocr.ts) e qui si
 * decide solo **bot sì o no**: il nome letto non si salva, non si mostra e non esce dal PC; resta l'esito (`VersusName`).
 * Una partita contro un bot non entra nello storico e non parte per il sito (main.ts).
 *
 * Bot riconosciuti:
 * - i nomi di `bot-names.json` (dal 14/10/2026 Big Bob, il manichino "La pratica rende perfetti", comandante H0001 nei dati
 *   del gioco; l'elenco degli altri nomi dei bot si aggiunge lì);
 * - ogni nome con "(BOT)" dopo: i boss ("RED (BOT)" della Battaglia Boss dell'11/10/2026).
 * Il confronto è sul nome intero (lettere e cifre, maiuscole), con le confusioni dell'OCR più comuni (`nameKey`): un
 * pezzo di nome non basta, così un giocatore che si chiama "Big Bobby" resta una persona.
 */
import BOT_NAME_LIST from "./bot-names.json";

/** Le cifre che l'OCR scambia con le lettere (0/O, 1/I, 5/S, 8/B). */
const OCR_FOLD: Record<string, string> = { "0": "O", "1": "I", "5": "S", "8": "B" };

/** La chiave di un nome: solo lettere e cifre, maiuscole, senza accenti, con le confusioni dell'OCR ripiegate. */
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/[0158]/g, (c) => OCR_FOLD[c] ?? c);
}

/** I nomi dei bot come chiavi (`nameKey`), dai nomi di `bot-names.json`. */
export function botKeys(names: readonly string[]): Set<string> {
  return new Set(names.map(nameKey).filter((k) => k.length >= 3));
}

const DEFAULT_KEYS = botKeys(BOT_NAME_LIST as string[]);

/** "(BOT)" in fondo al nome, anche letto male: parentesi quadre o graffe, O letta come 0 o Q, spazi in mezzo. */
const BOT_TAG = /[([{]\s*B\s*[O0Q]\s*T\s*[)\]}]\s*$/i;

/** Il testo letto dall'OCR è il nome di un bot? (Più righe: basta una.) */
export function isBotName(text: string, keys: ReadonlySet<string> = DEFAULT_KEYS): boolean {
  const lines = text.split(/[\r\n|]+/).map((l) => l.trim()).filter(Boolean);
  return lines.some((l) => BOT_TAG.test(l) || keys.has(nameKey(l)));
}

/** Una schermata VS letta: quando e se l'avversario è un bot. Mai il nome. */
export type VersusName = { ms: number; bot: boolean };

/** Quanto prima della fine si cerca la schermata VS della partita: una partita dura 10–15 minuti. */
export const VERSUS_LOOKBACK_MS = 40 * 60_000;
/** Letture dello stesso nome a meno di questo intervallo sono la stessa schermata VS. */
export const SAME_VERSUS_MS = 20_000;

/** Le letture della schermata VS più recente prima di `endMs` (entro `VERSUS_LOOKBACK_MS`): quelle a meno di `SAME_VERSUS_MS` dall'ultima. */
function lastVersus<T extends { ms: number }>(reads: readonly T[], endMs: number): T[] {
  const before = reads.filter((r) => r.ms <= endMs && r.ms >= endMs - VERSUS_LOOKBACK_MS);
  if (!before.length) return [];
  const last = Math.max(...before.map((r) => r.ms));
  return before.filter((r) => last - r.ms <= SAME_VERSUS_MS);
}

/**
 * La partita finita a `endMs` era contro un bot? Vale la schermata VS più recente prima della fine (entro
 * `VERSUS_LOOKBACK_MS`); di una schermata letta più volte basta una lettura "bot". Senza schermata VS letta: false (la
 * partita si registra come prima).
 */
export function botMatch(reads: readonly VersusName[], endMs: number): boolean {
  return lastVersus(reads, endMs).some((r) => r.bot);
}

/**
 * Una lettura della zona sopra il mio ritratto nella schermata VS (22/10/2026): quando e se c'era una lega (partita
 * classificata, src/lib/tracker/queue.ts). Mai quale lega.
 */
export type LeagueRead = { ms: number; league: boolean };

/**
 * La partita finita a `endMs` era una classificata? Come `botMatch`: vale la schermata VS più recente prima della fine
 * e basta una lettura con la lega (la scritta entra con un'animazione: i primi ritagli possono non averla). Senza
 * schermata VS letta: false, cioè coda "normal".
 */
export function leagueMatch(reads: readonly LeagueRead[], endMs: number): boolean {
  return lastVersus(reads, endMs).some((r) => r.league);
}
