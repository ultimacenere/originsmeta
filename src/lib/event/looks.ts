/**
 * Pezzi della grafica della pagina di un evento ("Locandina", scelta da Pierluigi il 14/11/2026 fra tre prove
 * dell'11/11: le altre due, "Ruota" e "Arcade", non ci sono più). Li usano la pagina (EventShow) e la testata di regia
 * e pannello del mod (EventTool).
 */
export type EventSectionId = "giocatori" | "mazzi" | "classifica" | "abbinamenti" | "giveaway" | "codice";

/** La riga piccola sopra il titolo di ogni sezione. */
export const SECTION_KICKERS: Record<EventSectionId, string> = {
  giocatori: "Il cast",
  mazzi: "L'arsenale",
  classifica: "Chi comanda",
  abbinamenti: "Gli scontri",
  giveaway: "Il bottino",
  codice: "Hai vinto?",
};

/** Testo leggibile su un colore pieno (#rrggbb): inchiostro sui chiari, gesso sugli scuri. */
export function inkOn(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return "#d9dfe8";
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140 ? "#16102a" : "#d9dfe8";
}

/** Il nome dell'evento su due righe: l'ultima parola va nella seconda ("Attrix" / "Showmatch"). */
export function splitEventName(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return [name.trim(), ""];
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}
