/**
 * Riquadri che si aprono da soli (05/11/2026): il riquadro dei feedback (FeedbackWidget, un minuto dopo il banner dei
 * cookie), il popup di un torneo (TournamentPromo, pochi secondi dopo) e, dal 09/11/2026, il popup "collega Steam" per
 * gli iscritti (SteamPromo). Uno alla volta: chi sta per aprirsi aspetta finché un altro è aperto, come aspetta chi sta
 * scrivendo in un campo o navigando con la tastiera (`isBusy`).
 * Lo stato sta nel modulo, quindi vale per la scheda e sopravvive ai cambi di pagina (i componenti sono nel layout).
 */
const openPanels = new Set<string>();

/** Segna un riquadro aperto o chiuso, anche quando l'ha aperto la persona. */
export function setPanelOpen(id: string, open: boolean): void {
  if (open) openPanels.add(id);
  else openPanels.delete(id);
}

/** C'è aperto un riquadro diverso da `id`. */
export function otherPanelOpen(id: string): boolean {
  for (const p of openPanels) if (p !== id) return true;
  return false;
}

/**
 * Chi sta scrivendo in un campo (ricerca, deck builder, modulo) o sta navigando con la tastiera (un elemento ha il
 * focus visibile, per esempio una carta in mano nella tier list personalizzabile) non va interrotto. Il focus
 * lasciato su un link o un bottone da un clic del mouse non conta: lì `:focus-visible` è falso.
 */
export function isBusy(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || el === document.body) return false;
  if (el.isContentEditable || /^(?:INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return true;
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}
