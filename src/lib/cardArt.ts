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

/** Tag autore dei mazzi community: Staff giallo acceso con scritta nera (richiesta di Pierluigi, 15/09/2026), Pro celeste, Influencer magenta. */
export const badgeStyle: Record<string, string> = {
  staff: "bg-gold text-ink font-bold",
  pro: "bg-sky text-ink font-bold",
  influencer: "bg-crimson text-chalk font-bold",
  community: "bg-night-3 text-pale",
};

/** Pill di allineamento (Good / Evil / Neutral) sugli elementi avorio. */
export const alignStyle: Record<string, string> = {
  good: "bg-mint-soft text-ink",
  evil: "bg-crimson/15 text-crimson",
  neutral: "bg-night-3 text-pale-muted",
};
