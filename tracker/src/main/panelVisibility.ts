/**
 * Che cosa fare di una finestra sopra il gioco (pannelli e overlay) a ogni giro di `syncPanelVisibility` (16/10/2026).
 *
 * Pierluigi: "a volte scompaiono i layer anche con disattivato il flag di farli sparire fuori dal game, per rimetterli
 * devo sflaggare e riflaggare". Per Electron la finestra era ancora visibile (`isVisible` è vero anche per una finestra
 * minimizzata o coperta), quindi l'app non faceva niente: il pannello era stato minimizzato (Win+D, Win+M, clic
 * sull'icona nella barra delle applicazioni) o era finito sotto il gioco, che l'aveva scavalcato fra le finestre in
 * primo piano. Togliere e rimettere la spunta lo nascondeva e lo rimostrava, cioè lo riportava su: ora lo fa l'app da
 * sola, con `show` (rimette anche una finestra minimizzata) e `raise` (di nuovo in primo piano, sopra le altre, senza
 * prendere il fuoco). Mai mentre il giocatore ci sta lavorando (`focused`) o la sta allargando (`busy`).
 */
export type LayerState = { visible: boolean; minimized: boolean; focused: boolean; busy: boolean };
export type LayerAction = "show" | "hide" | "raise" | null;

export function layerAction(want: boolean, s: LayerState): LayerAction {
  if (!want) return s.visible ? "hide" : null;
  if (!s.visible || s.minimized) return "show";
  if (s.focused || s.busy) return null;
  return "raise";
}
