/**
 * Altezza dei pannelli delle tendine dell'header (12/11/2026): Menu del telefono, menu dell'account, lingua
 * (`AutoCloseDetails`, classe `.drop-fit` di globals.css). La tendina "Menu" era più alta dello schermo dei telefoni e
 * non scorreva: l'header è fisso in cima, quindi scorrere la pagina non la muoveva e le ultime voci non si
 * raggiungevano. Ora il pannello scorre dentro e non è mai più alto dello spazio fra il suo tasto e il fondo dello
 * schermo. Qui la parte pura del calcolo, provata in dropPanel.test.ts.
 */

/** La variabile CSS che `.drop-fit` legge come altezza massima; la scrive `AutoCloseDetails` sul suo <details>. */
export const DROP_MAX_H_VAR = "--drop-max-h";

/** I pannelli stanno 8 px sotto il loro tasto (`mt-2` nei tre menu dell'header). */
export const PANEL_GAP = 8;
/** Il pannello si ferma a 12 px dal fondo dello schermo: il bordo in basso e l'ombra restano visibili. */
export const PANEL_BOTTOM_MARGIN = 12;
/**
 * Sotto questa altezza il pannello non scende, anche se il conto dà meno (pagina ingrandita con le dita, schermo
 * bassissimo): quattro voci del menu restano sempre visibili, e il resto si scorre.
 */
export const PANEL_MIN_HEIGHT = 160;

/**
 * Quanti pixel può essere alto il pannello: dallo spazio sotto il tasto (`summaryBottom`, il fondo del <summary> nello
 * schermo) al fondo dello schermo, meno il distacco dal tasto e il margine in basso. L'altezza dello schermo è la più
 * piccola fra `innerHeight` e quella dello schermo visibile (`visualViewport`, che sul telefono segue la barra degli
 * indirizzi e la tastiera): se una delle due manca o non è un numero vale l'altra. Sempre un intero, mai sotto
 * `PANEL_MIN_HEIGHT`.
 */
export function panelRoom({ innerHeight, visualHeight, summaryBottom }: { innerHeight: number; visualHeight?: number | null; summaryBottom: number }): number {
  const heights = [innerHeight, visualHeight].filter((h): h is number => typeof h === "number" && Number.isFinite(h) && h > 0);
  if (!heights.length || !Number.isFinite(summaryBottom)) return PANEL_MIN_HEIGHT;
  const room = Math.floor(Math.min(...heights) - summaryBottom - PANEL_GAP - PANEL_BOTTOM_MARGIN);
  return Math.max(PANEL_MIN_HEIGHT, room);
}
