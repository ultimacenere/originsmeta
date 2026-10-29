/**
 * Indirizzi e chiave del browser del Theory craft (29/10/2026), in un modulo senza il database carte: li importano anche
 * il menu e il deck builder nel browser. Le regole stanno in `theoryCraft.ts`.
 */
export const THEORY_PATH = "/theory-craft";
export const THEORY_DECKS_PATH = "/theory-craft/decks";
/** salvataggio del browser separato dal deck builder: un mazzo theory craft non sostituisce quelli del builder */
export const THEORY_STORAGE_KEY = "originsmeta.theorycraft.v1";
