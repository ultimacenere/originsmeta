import type { LabLegendary, LabMatchup, LabTierOrNone } from "@/lib/tierLab/types";

/**
 * «La mano del meta» (prototipo 1 della tier list, 27/11/2026, branch claude/tierlist-lab): numeri e frasi del fascicolo,
 * funzioni pure usate sia dal server (testo nell'HTML) sia dall'ispezione nel browser. Testi solo in italiano per il
 * prototipo: in produzione vanno nei file delle otto lingue.
 */

export const TIER_ORDER: LabTierOrNone[] = ["S", "A", "B", "C", "D", "unranked"];

export const tierName = (t: LabTierOrNone) => (t === "unranked" ? "Senza fascia" : `Fascia ${t}`);
export const tierLetter = (t: LabTierOrNone) => (t === "unranked" ? "–" : t);

/** che cosa vuol dire la fascia, in poche parole (la regola del 9/11, tierRule.ts) */
export const tierMeaning: Record<LabTierOrNone, string> = {
  S: "Anche nel caso peggiore vince più di metà delle partite",
  A: "Vince almeno metà delle partite",
  B: "Fra il 45% e il 50%",
  C: "Fra il 40% e il 45%",
  D: "Sotto il 40%",
  unranked: "Giocata troppo poco per una fascia",
};

export function pct(locale: string, x: number, digits = 1): string {
  return `${(x * 100).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function num(locale: string, n: number): string {
  // "always": anche 1.647 col separatore (in italiano Intl lo mette solo da 10.000)
  return n.toLocaleString(locale, { useGrouping: "always" } as Intl.NumberFormatOptions);
}

export function avg(locale: string, n: number): string {
  return n.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function dayMonth(locale: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
}

/** Perché la carta sta nella sua fascia: una frase per il ladder e, se c'è, una per la Crimson Cup. */
export function tierReason(locale: string, l: LabLegendary): string[] {
  const o = l.official;
  const { r, lo, games } = o.rate;
  const g = num(locale, games);
  const out: string[] = [];
  switch (o.ladderTier) {
    case "S":
      out.push(`Anche nel caso peggiore vince più di metà delle partite: il bordo basso è ${pct(locale, lo)} su ${g} partite.`);
      break;
    case "A":
      out.push(`Vince il ${pct(locale, r)} di ${g} partite, ma nel caso peggiore (${pct(locale, lo)}) scende sotto il 50%.`);
      break;
    case "B":
      out.push(`Sotto il 50% ma sopra il 45%: vince il ${pct(locale, r)} di ${g} partite.`);
      break;
    case "C":
      out.push(`Sotto il 45% ma sopra il 40%: vince il ${pct(locale, r)} di ${g} partite.`);
      break;
    case "D":
      out.push(`Sotto il 40%: vince il ${pct(locale, r)} di ${g} partite.`);
      break;
    default:
      out.push(`Nella patch è stata giocata troppo poco per avere una fascia: ${g} partite, ${pct(locale, r)} vinte.`);
  }
  const c = o.crimson;
  if (o.boosted && c && o.ladderTier === o.tier) {
    out.push(`Bannata nel ${pct(locale, c.banRate, 0)} delle partite della Crimson Cup e arrivata in finale: salirebbe di una fascia, ma è già in ${tierLetter(o.tier)}.`);
  } else if (o.boosted && c) {
    out.push(
      `Bannata nel ${pct(locale, c.banRate, 0)} delle partite della Crimson Cup e arrivata in finale: sale di una fascia, dalla ${tierLetter(o.ladderTier)} alla ${tierLetter(o.tier)}.`,
    );
  } else if (c && o.changedAfterCrimson && c.banRate >= 0.3 && c.finalists > 0) {
    out.push(`Nella Crimson Cup era bannata nel ${pct(locale, c.banRate, 0)} delle partite, ma la carta è cambiata dopo il torneo: il torneo non conta.`);
  }
  return out;
}

/** La frase corta dell'etichetta in mano. */
export function shortLabel(locale: string, l: LabLegendary): string {
  return `${pct(locale, l.official.rate.r)} · ${num(locale, l.official.rate.games)} partite`;
}

/**
 * Gli scontri con un intervallo abbastanza stretto da dire qualcosa (al massimo ±12 punti): i 3 vinti più spesso e i 3
 * persi più spesso. Il criterio resta nel codice, non si scrive sulla pagina.
 */
export function bestWorst(ms: LabMatchup[] | undefined): { beats: LabMatchup[]; suffers: LabMatchup[] } {
  const ok = (ms ?? []).filter((m) => m.games > 0 && m.hi - m.lo <= 0.24);
  const beats = ok.filter((m) => m.r > 0.5).sort((a, b) => b.r - a.r || b.games - a.games).slice(0, 3);
  const suffers = ok.filter((m) => m.r < 0.5).sort((a, b) => a.r - b.r || b.games - a.games).slice(0, 3);
  return { beats, suffers };
}

export const changeKind: Record<LabLegendary["changes"][number]["kind"], string> = {
  buff: "Potenziata",
  nerf: "Indebolita",
  rework: "Rifatta",
  deck: "Mazzo",
};
