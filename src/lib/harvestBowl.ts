/**
 * Harvest Bowl (28–29/11/2026), il torneo di Koin Games ospitato sulla piattaforma tornei del sito: la pagina evento
 * /[lingua]/events/harvest-bowl (19/11/2026, piano dell'analisi profonda del 19/11, cantiere B1 di `sito.md`: "pagina
 * Harvest Bowl in 8 lingue, due qualificazioni, finale, orari per fuso, link ai due tornei"). File puro, senza import.
 *
 * Fonte dei fatti: il post Steam di Koin del 13/11/2026 alle 20:57 UTC "Our next tournament is coming: The Harvest Bowl"
 * (`steamPost`) e le schede dei due tornei sul database (letti il 19/11): orari, formato, regole dei mazzi, premi.
 * I tornei dell'evento si leggono dal database: slug che inizia con `tournamentPrefix` e organizzatore fra `organizers`
 * (così la finale, quando apix la crea dal modulo, entra da sola nella pagina e nella bacheca).
 */

export const HARVEST_BOWL = {
  slug: "harvest-bowl",
  /** percorso senza lingua */
  path: "/events/harvest-bowl",
  /** pagina indicizzata, in sitemap e in calendario; false = noindex e fuori da sitemap (una riga per spegnerla) */
  indexable: true,
  tournamentPrefix: "harvest-bowl-",
  /** nomi utente degli organizzatori: solo i loro tornei col prefisso fanno parte dell'evento */
  organizers: ["apixtwts"],
  /** le tre tappe, con gli orari del post Steam (UTC) */
  stages: [
    { key: "q1", slug: "harvest-bowl-qualifier-1", startsAt: "2026-11-28T15:00:00Z" },
    { key: "q2", slug: "harvest-bowl-qualifier-2", startsAt: "2026-11-28T21:00:00Z" },
    { key: "final", slug: null, startsAt: "2026-11-29T15:00:00Z" },
  ] as const,
  /** fine indicativa della giornata finale (per i dati strutturati) */
  endsAt: "2026-11-29T23:00:00Z",
  seatsPerQualifier: 512,
  qualifyPerQualifier: 64,
  finalPlayers: 128,
  topCut: 8,
  sideboard: 3,
  bestOf: 3,
  rulebook: "https://pitch.com/v/harvest-bowl-rulebook-ch382z",
  faq: "https://docs.google.com/document/d/13Q4xOMS8AmpGMryrq6E27BHZx_jILQ68Jmt2ioWBofw/edit?usp=sharing",
  steamPost: "https://store.steampowered.com/news/app/4429430/view/1849192144189171",
  discord: "https://discord.gg/originstcg",
  image: "/media/og.jpg",
} as const;

export type HarvestStageKey = (typeof HARVEST_BOWL.stages)[number]["key"];

/** Il torneo fa parte dell'evento: slug col prefisso e organizzatore fra quelli dell'evento. */
export function isHarvestTournament(t: { slug: string; profile?: { username?: string | null } | null }): boolean {
  const u = t.profile?.username ?? "";
  return t.slug.startsWith(HARVEST_BOWL.tournamentPrefix) && (HARVEST_BOWL.organizers as readonly string[]).includes(u);
}

/** La tappa di un torneo dell'evento: le qualificazioni per slug, tutto il resto è la finale. */
export function stageOf(slug: string): HarvestStageKey {
  const s = HARVEST_BOWL.stages.find((x) => x.slug === slug);
  return s ? s.key : "final";
}

/** Ore fisse dei fusi del post Steam (ET e CET), in 24 ore, per i testi che non dipendono dal browser. */
export function fixedTimes(iso: string): { utc: string; et: string; cet: string } {
  const d = new Date(iso);
  const f = (tz: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).format(d);
  return { utc: f("UTC"), et: f("America/New_York"), cet: f("Europe/Paris") };
}
