/** I tre prototipi della pagina utente (26/11/2026). */
export const PROTO_VARIANTS = [
  { id: "carte", n: 1, name: "Il mazzo dei traguardi", idea: "I traguardi diventano carte del gioco: un mazzo da completare, 1 Leggendaria e 12 carte ×2." },
  { id: "onda", n: 2, name: "In onda", idea: "Il profilo come la grafica di un torneo in diretta: i mazzi dell'iscritto e come vanno nel ladder." },
  { id: "patch", n: 3, name: "Le patch", idea: "La storia del giocatore patch per patch: cosa ha costruito e cosa il bilanciamento ha cambiato nei suoi mazzi." },
] as const;
export type ProtoVariant = (typeof PROTO_VARIANTS)[number]["id"];

/** Metadati dei prototipi: niente hreflang, niente indicizzazione, niente link seguiti. */
export function protoMeta<M extends { alternates?: { canonical?: unknown } | null }>(meta: M): M {
  return { ...meta, alternates: meta.alternates ? { canonical: meta.alternates.canonical } : meta.alternates, robots: { index: false, follow: false } } as M;
}
