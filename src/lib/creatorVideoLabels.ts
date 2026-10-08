import type { Locale } from "./i18n";

/**
 * Etichette del carosello "Video dei creator" della home (08/10/2026, src/lib/creatorVideos.ts). Come creatorLabels.ts:
 * qui e non nei dizionari, l'inglese è il tipo di riferimento, le quattro lingue si scrivono insieme. Segnaposto: {name}.
 */
export type CreatorVideoLabels = {
  title: string;
  sub: string;
  /** link alla directory /creators */
  all: string;
  /** "di {name}" sotto il video, link al profilo */
  by: string;
  prev: string;
  next: string;
  /** nome accessibile dell'elenco scorrevole */
  list: string;
};

export const creatorVideoLabels: Record<Locale, CreatorVideoLabels> = {
  en: {
    title: "Creator videos",
    sub: "The latest Origins TCG videos from the creators on OriginsMeta, straight from their YouTube channels.",
    all: "All creators",
    by: "by {name}",
    prev: "Previous videos",
    next: "Next videos",
    list: "Origins TCG videos from the creators",
  },
  it: {
    title: "Video dei creator",
    sub: "Gli ultimi video su Origins TCG dei creator di OriginsMeta, direttamente dai loro canali YouTube.",
    all: "Tutti i creator",
    by: "di {name}",
    prev: "Video precedenti",
    next: "Video successivi",
    list: "Video su Origins TCG dei creator",
  },
  es: {
    title: "Videos de los creadores",
    sub: "Los últimos videos de Origins TCG de los creadores de OriginsMeta, directamente desde sus canales de YouTube.",
    all: "Todos los creadores",
    by: "de {name}",
    prev: "Videos anteriores",
    next: "Videos siguientes",
    list: "Videos de Origins TCG de los creadores",
  },
  fr: {
    title: "Vidéos des créateurs",
    sub: "Les dernières vidéos sur Origins TCG des créateurs d'OriginsMeta, directement depuis leurs chaînes YouTube.",
    all: "Tous les créateurs",
    by: "par {name}",
    prev: "Vidéos précédentes",
    next: "Vidéos suivantes",
    list: "Vidéos sur Origins TCG des créateurs",
  },
};
