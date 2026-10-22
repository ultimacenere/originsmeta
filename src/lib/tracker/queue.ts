/**
 * Coda della partita per le statistiche del sito (tracker/overlay, 30/09/2026): "ranked" (classificata) o "normal".
 * Richiesta di Pierluigi del 30/09/2026: i win rate di mazzi e carte "sono molto importanti e dobbiamo averli"; per ora
 * contano tutte le partite, quando ci sarà molta più utenza si terranno solo le classificate.
 *
 * **Come si riconosce la classificata (22/10/2026)**: dalla **schermata VS**. Nella classificata sopra il ritratto di
 * ciascun giocatore c'è la sua lega ("IRON II"); nelle altre partite (allenamento, Battaglia Boss, partite della demo
 * prima della 0.7.1) lì non c'è niente. Verificato su 16 schermate VS salvate dallo scanner fra il 10 e il 12/10/2026
 * (11 classificate del playtest, 5 no). Lo scanner ritaglia la zona sopra il **mio** ritratto e la legge con l'OCR di
 * Windows (tracker/src/frames, main/frames.ts): `isLeagueText` dice se c'è una scritta, mai quale; la lega letta non si
 * salva, non si mostra e non esce dal PC.
 *
 * Perché non dai file del gioco: con la demo 0.7.1 (15/10/2026, "Ranked is here!") il gioco non scrive niente che
 * distingua la classificata. `BattleMode` delle statistiche resta "0", i replay non ci sono più dalla patch 0.7 e la
 * cache di Beamable non ha punti né leghe (controllato sul PC di Pierluigi il 22/10/2026). Per questo fino alla 0.4.8
 * dell'app tutte le partite arrivavano al sito come "normal" (4.721 su 4.721 al 22/10/2026). I due segnali dei file
 * restano per il giorno in cui i replay tornassero.
 *
 * Regola del tracker (Pierluigi, 29/09/2026): **mai dire se l'avversario è un bot o una persona**. Il risultato è solo
 * "ranked" o "normal", mai la modalità ("BotBattle") né un segnale bot. La lega che conta è la mia, mai quella
 * dell'avversario. Le partite contro i bot non si registrano affatto (0.4.7), quindi una classificata contro un bot non
 * diventa "normal". La coda non si mostra partita per partita (né nell'app né sul sito): serve solo a filtrare le
 * statistiche anonime.
 */

export const TRACK_QUEUES = ["ranked", "normal"] as const;
export type TrackQueue = (typeof TRACK_QUEUES)[number];

/** Valori di `BattleMode` della classificata: con la 0.7.1 resta "0" anche in classificata, quindi nessuno. */
export const RANKED_BATTLE_MODES: readonly string[] = [];

/** Modalità del nome del replay che valgono classificata (i replay non ci sono più dalla patch 0.7). */
export const RANKED_MODE = /rank/i;

/**
 * Il testo letto dall'OCR sopra il mio ritratto della schermata VS è una lega? Basta una parola di almeno tre lettere:
 * le divisioni sotto il Grandmaster non sono tutte note e i numeri romani l'OCR li perde ("IRON II" si legge "IRON").
 * Dove la lega non c'è, la zona è sfondo o un pezzo del personaggio e l'OCR non legge niente.
 */
export function isLeagueText(text: string | null | undefined): boolean {
  return typeof text === "string" && /\p{L}{3,}/u.test(text);
}

export function matchQueue(input: {
  mode: string | null | undefined;
  battleMode: string | null | undefined;
  /** La lega sopra il mio ritratto nella schermata VS della partita (`isLeagueText`); null o assente se non letta. */
  league?: boolean | null;
}): TrackQueue {
  if (input.league === true) return "ranked";
  const battle = input.battleMode?.trim() ?? "";
  if (battle && RANKED_BATTLE_MODES.includes(battle)) return "ranked";
  if (input.mode && RANKED_MODE.test(input.mode)) return "ranked";
  return "normal";
}

export const isTrackQueue = (v: unknown): v is TrackQueue => typeof v === "string" && (TRACK_QUEUES as readonly string[]).includes(v);
