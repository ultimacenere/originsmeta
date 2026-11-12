/**
 * Prove di grafica della pagina di un evento (11/11/2026, Pierluigi: "riusciamo a dargli un taglio e una grafica più
 * accattivante? rendiamola più bella e divertente, fai qualche tentativo"). Tre tagli della stessa pagina, con gli
 * stessi dati e le stesse sezioni: A "Locandina" (manifesto da serata di gala), B "Ruota" (game show, la ruota dei
 * mazzi al centro), C "Arcade" (schermata di selezione dei personaggi). Si guardano su /it/events/<slug>/prova/<a|b|c>;
 * la pagina vera cambia solo quando Pierluigi ne sceglie una.
 */
export const EVENT_LOOKS = ["a", "b", "c"] as const;
export type EventLook = (typeof EVENT_LOOKS)[number];

export function isEventLook(v: string): v is EventLook {
  return (EVENT_LOOKS as readonly string[]).includes(v);
}

export const LOOK_NAMES: Record<EventLook, string> = { a: "Locandina", b: "Ruota", c: "Arcade" };

export type EventSectionId = "giocatori" | "mazzi" | "classifica" | "abbinamenti" | "giveaway" | "codice";

/** La riga piccola sopra il titolo di ogni sezione: cambia tono con il taglio (i titoli veri restano gli stessi). */
export const LOOK_KICKERS: Record<EventLook, Record<EventSectionId, string>> = {
  a: { giocatori: "Il cast", mazzi: "L'arsenale", classifica: "Chi comanda", abbinamenti: "Gli scontri", giveaway: "Il bottino", codice: "Hai vinto?" },
  b: { giocatori: "I concorrenti", mazzi: "Gira la ruota", classifica: "Chi sta vincendo", abbinamenti: "Chi sfida chi", giveaway: "Si vince così", codice: "Hai vinto?" },
  c: { giocatori: "Player select", mazzi: "Loadout", classifica: "High scores", abbinamenti: "Versus", giveaway: "Bonus stage", codice: "Enter code" },
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
