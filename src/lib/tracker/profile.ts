/**
 * Cache del profilo di Origins TCG (tracker/overlay, Fase 1, 29/09/2026): lettura pura dei JSON che il backend
 * Beamable salva in `%USERPROFILE%\AppData\LocalLow\Koin Games\Origins TCG\beamable\cache\<cid>\<realm>\<versione>\`
 * (fino al 27/10/2026 `Origins TCG Demo`). I nomi dei file sono impronte e cambiano da un account all'altro: i file si
 * riconoscono dal contenuto (`readStatsFile`, `readInventoryFile` restituiscono null per tutto il resto). Dettagli in
 * docs/tracker.md.
 *
 * - Statistiche (`results[0].stats`, coppie k/v): nella demo pochi secondi dopo la fine di ogni partita cambiavano
 *   `lastMatchPlayedDateTime` (UTC), `onboardingResults` (W e L, la più recente a sinistra; cresce, il 29/09/2026 era a
 *   24 esiti) e `onboardingLastMatchId`; `ActiveUserDeckIndex` cambia appena il giocatore sceglie il mazzo, prima
 *   della partita. **Il gioco completo (0.8.0, 27/10/2026) non scrive più le chiavi delle partite**: restano
 *   `ActiveUserDeckIndex` e `BattleMode`, e l'esito arriva solo dallo schermo. `results[0].id` è l'id dell'account:
 *   serve solo a riconoscere il giocatore nel replay e non esce da qui se non per quello.
 * - Inventario (`items`, gruppo `items.Deck.Web2Deck`): i mazzi, con `Config` = JSON {DisplayName, Cards[{CardKey}]}.
 *   `ActiveUserDeckIndex` è la posizione nell'ordine del file (confermato su tre mazzi il 29/09/2026).
 *
 * Nessun dato personale nei valori restituiti tranne `accountId` e `lastMatchId`, che l'app tiene solo in memoria:
 * dell'id della partita si salva un'impronta (`matchFingerprint` in match.ts), mai l'id.
 */

export type ProfileStats = {
  /** Solo per riconoscere il giocatore nel replay: mai salvato né mandato al sito. */
  accountId: string | null;
  /** Fine dell'ultima partita, ISO in UTC. */
  lastMatchAt: string | null;
  /** Esiti, il più recente a sinistra ("LWW…"). */
  results: string;
  /** Solo in memoria: del match si salva l'impronta. */
  lastMatchId: string | null;
  activeDeckIndex: number | null;
  battleMode: string | null;
};

export type GameDeck = {
  /** Posizione nell'inventario, quella di `ActiveUserDeckIndex`. */
  index: number;
  id: string;
  name: string | null;
  /** Mazzo iniziale della demo da cui nasce (D00001…), se c'è. */
  preset: string | null;
  /** Chiavi come nel file, con la variante (C00176_MC_V00000). */
  cards: string[];
  legendary: string | null;
};

const MATCH_KEYS = ["lastMatchPlayedDateTime", "onboardingResults"];
/**
 * Il file delle statistiche del gioco completo, senza le chiavi delle partite: mazzo scelto e modalità insieme. Uno solo
 * dei due non basta (altri file del profilo hanno `ActiveUserDeckIndex`). Fino al 28/10/2026 il file della release si
 * scartava e il tracker leggeva il mazzo dalla cache vecchia della demo.
 */
const DECK_KEYS = ["ActiveUserDeckIndex", "BattleMode"];

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const asRecord = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** Statistiche del profilo, oppure null se il testo non è il file delle statistiche (con le partite o con il mazzo scelto). */
export function readStatsFile(text: string): ProfileStats | null {
  const root = asRecord(parseJson(text));
  const first = asRecord(Array.isArray(root?.results) ? root.results[0] : null);
  if (!first || !Array.isArray(first.stats)) return null;
  const stats = new Map<string, string>();
  for (const s of first.stats) {
    const entry = asRecord(s);
    if (entry && typeof entry.k === "string") stats.set(entry.k, String(entry.v ?? ""));
  }
  if (!MATCH_KEYS.some((k) => stats.has(k)) && !DECK_KEYS.every((k) => stats.has(k))) return null;
  const at = stats.get("lastMatchPlayedDateTime");
  const index = Number(stats.get("ActiveUserDeckIndex"));
  const results = (stats.get("onboardingResults") ?? "").toUpperCase();
  return {
    accountId: typeof first.id === "number" || typeof first.id === "string" ? String(first.id) : null,
    lastMatchAt: at && Number.isFinite(Date.parse(at)) ? new Date(Date.parse(at)).toISOString() : null,
    results: /^[A-Z]*$/.test(results) ? results : "",
    lastMatchId: stats.get("onboardingLastMatchId") || null,
    activeDeckIndex: stats.has("ActiveUserDeckIndex") && Number.isInteger(index) && index >= 0 ? index : null,
    battleMode: stats.get("BattleMode") ?? null,
  };
}

const LEGENDARY = /_[A-Z]C(?:_V\d+)?$/;

/** Mazzi dell'inventario, oppure null se il testo non è l'inventario con i mazzi. */
export function readInventoryFile(text: string): GameDeck[] | null {
  const root = asRecord(parseJson(text));
  if (!root || !Array.isArray(root.items)) return null;
  const group = root.items.map(asRecord).find((g) => g?.id === "items.Deck.Web2Deck");
  if (!group || !Array.isArray(group.items)) return null;
  return group.items.map((raw, index) => {
    const item = asRecord(raw) ?? {};
    const props = new Map<string, string>();
    for (const p of Array.isArray(item.properties) ? item.properties : []) {
      const prop = asRecord(p);
      if (prop && typeof prop.name === "string") props.set(prop.name, String(prop.value ?? ""));
    }
    const config = asRecord(parseJson(props.get("Config") ?? "")) ?? {};
    // `CardId: 0` non è una carta: il gioco ci tiene un segnaposto ("Tower_V00000", visto il 12/10/2026 in un mazzo da
    // 12 carte), che il Deck tracker mostrava come una tredicesima casella vuota da 2 copie
    const cards = (Array.isArray(config.Cards) ? config.Cards : [])
      .map(asRecord)
      .filter((c) => c?.CardId !== 0)
      .map((c) => c?.CardKey)
      .filter((k): k is string => typeof k === "string" && k.length > 0);
    return {
      index,
      id: String(item.id ?? index),
      name: typeof config.DisplayName === "string" ? config.DisplayName : null,
      preset: props.get("DeckPresetKey") || null,
      cards,
      legendary: cards.find((k) => LEGENDARY.test(k)) ?? null,
    };
  });
}

export type MatchEnd = {
  endedAt: string | null;
  /** Esito dell'ultima partita; null se la stringa degli esiti non lo dice con certezza. */
  result: "W" | "L" | null;
  /** Solo in memoria (vedi `ProfileStats.lastMatchId`). */
  matchId: string | null;
  deckIndex: number | null;
  /** Esiti di partite finite mentre il tracker non guardava, dal più recente al più vecchio (senza mazzo né ora). */
  missed: string;
};

/**
 * Esito dell'ultima partita confrontando due stringhe di esiti: il primo carattere se la nuova allunga la vecchia (le
 * lettere in più oltre la prima sono partite perse per strada, per esempio con il tracker spento); altrimenti nessun
 * esito certo. La usa anche l'app all'avvio, con la stringa salvata l'ultima volta.
 */
export function resultsDelta(prevResults: string, curResults: string): { result: MatchEnd["result"]; missed: string } {
  if (curResults.length <= prevResults.length || !curResults.endsWith(prevResults)) return { result: null, missed: "" };
  const added = curResults.slice(0, curResults.length - prevResults.length);
  return { result: added[0] === "W" || added[0] === "L" ? added[0] : null, missed: added.slice(1) };
}

/** Una partita nuova fra due letture delle statistiche, o null: cambiano l'ora o l'id dell'ultima partita. */
export function detectMatchEnd(prev: ProfileStats | null, cur: ProfileStats): MatchEnd | null {
  if (!prev) return null;
  if (cur.lastMatchAt === prev.lastMatchAt && cur.lastMatchId === prev.lastMatchId) return null;
  const { result, missed } = resultsDelta(prev.results, cur.results);
  return { endedAt: cur.lastMatchAt, result, matchId: cur.lastMatchId, deckIndex: cur.activeDeckIndex, missed };
}
