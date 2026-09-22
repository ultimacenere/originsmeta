import type { ChangeKind } from "@/lib/data/cards";

/** Fondali per le mini carte senza illustrazione, uno per saga. */
export const sagaHue: Record<string, string> = {
  arthurian: "linear-gradient(160deg,#2b3a8f,#0e071f)",
  wonderland: "linear-gradient(160deg,#c81e7a,#0e071f)",
  "hundred-acre-wood": "linear-gradient(160deg,#c4a516,#0e071f)",
  oz: "linear-gradient(160deg,#17a689,#0e071f)",
  sherwood: "linear-gradient(160deg,#2f7d32,#0e071f)",
  gothic: "linear-gradient(160deg,#7a1330,#0e071f)",
  "jungle-book": "linear-gradient(160deg,#4f7d1e,#0e071f)",
  "fairy-tale": "linear-gradient(160deg,#8a5cc9,#0e071f)",
  "nursery-rhyme": "linear-gradient(160deg,#d98a2b,#0e071f)",
  "myth-folklore": "linear-gradient(160deg,#3e6ea8,#0e071f)",
  "african-folklore": "linear-gradient(160deg,#b8641c,#0e071f)",
  "american-tales": "linear-gradient(160deg,#9c4a2a,#0e071f)",
  "classic-literature": "linear-gradient(160deg,#6b4f9e,#0e071f)",
  "ballad-of-mulan": "linear-gradient(160deg,#c8281e,#0e071f)",
  "arabian-nights": "linear-gradient(160deg,#2a9d8f,#0e071f)",
  "baker-street": "linear-gradient(160deg,#5b5b5b,#0e071f)",
  other: "linear-gradient(160deg,#3a2a60,#0e071f)",
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * Tag autore dei mazzi community, colori forti da memorizzare. Mappa nuova, dettata da Pierluigi il 23/09/2026
 * (supera quella di Davdas del 15/09: Staff menta, Pro rosa, Influencer oro):
 * Staff scritta nera su giallo (12,3:1), Community com'era (gesso su night-3, 8,6:1), Pro rosso su azzurro
 * (`.badge-pro`, 5,2:1), Influencer gradiente stile Instagram con scritta bianca (`.badge-ig`, come i bottoni
 * primari). Le due varianti con gradiente e con colori fuori palette stanno in globals.css, non in utility.
 * Chi è Staff non mostra anche "Community"; il tag community di default non si mostra affatto.
 */
export const badgeStyle: Record<string, string> = {
  staff: "bg-gold text-ink",
  pro: "badge-pro",
  influencer: "badge-ig",
  community: "bg-night-3 text-pale",
};
/** Tag autore più grandi e marcati (richiesta di Davdas). */
export const badgePill = "stat-pill px-3 py-1 text-xs font-extrabold uppercase tracking-wider";

/**
 * Pastiglie di allineamento (Good / Evil / Neutral): tinte tenui con testo scuro, così non si confondono con le
 * pastiglie dei cambi (fondi saturi, `changeStyle`). Contrasti misurati: Good ink su mint-soft 15,3:1,
 * Evil ink su crimson-soft 12,1:1 (prima magenta su magenta al 15%, 2,7:1), Neutral pale su night-3 8,6:1.
 */
export const alignStyle: Record<string, string> = {
  good: "bg-mint-soft text-ink",
  evil: "bg-crimson-soft text-ink",
  neutral: "bg-night-3 text-pale",
};

/**
 * Pastiglie dei cambi di bilanciamento: UNA sola mappa per tutto il sito, usata da ChangeChip (home, tier list,
 * scheda carta) e da CardExplorer (database carte). Prima erano due mappe diverse e lo stesso "buff" aveva due
 * colori su due pagine (in ChangeChip era `bg-felt`, di fatto invisibile: 1,2:1 sul pannello).
 * Fondi pieni, contrasti misurati: buff ink su menta 11,3:1, nerf gesso su crimson-deep 6,1:1, rework ink su oro
 * 12,3:1, deck (cambio alle regole di costruzione) neutro, gesso su night-3 9,8:1.
 */
export const changeStyle: Record<ChangeKind, string> = {
  buff: "bg-mint text-ink",
  nerf: "bg-crimson-deep text-chalk",
  rework: "bg-gold text-ink",
  deck: "bg-night-3 text-chalk",
};
