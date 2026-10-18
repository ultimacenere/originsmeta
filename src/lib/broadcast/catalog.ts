import { activeCards, type Alignment } from "@/lib/data/cards";
import { getDictionary } from "@/lib/i18n";
import { BROADCAST_LANGS, type BroadcastLang } from "./state";

/**
 * Catalogo delle carte per Broadcasting OM: solo quello che serve a disegnare una riga della lista e l'anteprima
 * (nome, costo, magia o unità, Leggendaria, miniatura e carta intera con i crediti stampati) più la chiave ufficiale
 * per il codice del gioco. Lo prepara il server e arriva al browser come prop: lo stato della diretta porta solo gli
 * slug. Solo carte attive (niente carte create né rimosse: non stanno in un mazzo).
 */
export type BroadcastCard = {
  slug: string;
  name: string;
  mana?: number;
  spell: boolean;
  legendary: boolean;
  key?: string;
  thumb?: string;
  image?: string;
  /** finestra d'illustrazione (560 px): sfondo sfumato della riga e miniatura, come nel deck builder */
  art?: string;
  power?: number;
  health?: number;
  alignment?: Alignment;
  /** testo della carta in ognuna delle quattro lingue dell'overlay */
  ability?: Partial<Record<BroadcastLang, string>>;
};

/** Etichette dell'anteprima (tipo e allineamento) nelle lingue dell'overlay, dai dizionari del sito. */
export type PeekLabels = Record<BroadcastLang, { unit: string; spell: string; good: string; evil: string; neutral: string }>;

export function broadcastPeekLabels(): PeekLabels {
  return Object.fromEntries(
    BROADCAST_LANGS.map((l) => {
      const c = getDictionary(l).common;
      return [l, { unit: c.unit, spell: c.spell, good: c.good, evil: c.evil, neutral: c.neutral }];
    }),
  ) as PeekLabels;
}

export function broadcastCatalog(): BroadcastCard[] {
  return activeCards.map((c) => ({
    slug: c.slug,
    name: c.name,
    ...(c.mana !== undefined ? { mana: c.mana } : {}),
    spell: c.type === "spell",
    legendary: Boolean(c.legendary),
    ...(c.key ? { key: c.key } : {}),
    ...(c.thumb ? { thumb: c.thumb } : {}),
    ...(c.image ? { image: c.image } : {}),
    ...(c.art ? { art: c.art } : {}),
    ...(c.power !== undefined ? { power: c.power } : {}),
    ...(c.health !== undefined ? { health: c.health } : {}),
    ...(c.alignment ? { alignment: c.alignment } : {}),
    ...(c.ability ? { ability: Object.fromEntries(BROADCAST_LANGS.filter((l) => c.ability?.[l]).map((l) => [l, c.ability?.[l] as string])) } : {}),
  }));
}
