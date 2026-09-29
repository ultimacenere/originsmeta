/**
 * Coda della partita per le statistiche del sito (tracker/overlay, 30/09/2026): "ranked" (classificata) o "normal".
 * Richiesta di Pierluigi del 30/09/2026: i win rate di mazzi e carte "sono molto importanti e dobbiamo averli"; per ora
 * contano tutte le partite, quando ci sarà molta più utenza si terranno solo le classificate.
 *
 * Si ricava da due segnali del gioco: la modalità scritta nel nome del replay (`replayFileInfo(...).mode`) e
 * `BattleMode` delle statistiche del profilo. Il 29/09/2026 la classificata era chiusa: tutte le partite viste erano
 * "BotBattle" con `BattleMode` = "0". Come si chiamano i replay della classificata e che valore prende `BattleMode` va
 * verificato quando apre (docs/tracker.md, "Coda"): fino ad allora vale "ranked" solo un nome con "rank" dentro.
 *
 * Regola del tracker (Pierluigi, 29/09/2026): **mai dire se l'avversario è un bot o una persona**. Il risultato è solo
 * "ranked" o "normal", mai la modalità ("BotBattle") né un segnale bot; "BotBattle" e ogni altro nome della coda
 * normale danno "normal". Attenzione alla verifica: se nella classificata le partite contro i bot avessero un nome
 * diverso da quelle contro le persone, la coda dovrà venire solo da `BattleMode`, altrimenti "normal" dentro la
 * classificata direbbe "bot". Per lo stesso motivo la coda non si mostra partita per partita (né nell'app né sul sito):
 * serve solo a filtrare le statistiche anonime.
 */

export const TRACK_QUEUES = ["ranked", "normal"] as const;
export type TrackQueue = (typeof TRACK_QUEUES)[number];

/** Valori di `BattleMode` della classificata: da scrivere quando la classificata apre e si vede il valore vero. */
export const RANKED_BATTLE_MODES: readonly string[] = [];

/** Modalità del nome del replay che valgono classificata (da confermare sui replay veri della classificata). */
export const RANKED_MODE = /rank/i;

export function matchQueue(input: { mode: string | null | undefined; battleMode: string | null | undefined }): TrackQueue {
  const battle = input.battleMode?.trim() ?? "";
  if (battle && RANKED_BATTLE_MODES.includes(battle)) return "ranked";
  if (input.mode && RANKED_MODE.test(input.mode)) return "ranked";
  return "normal";
}

export const isTrackQueue = (v: unknown): v is TrackQueue => typeof v === "string" && (TRACK_QUEUES as readonly string[]).includes(v);
