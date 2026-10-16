import { activeCards } from "@/lib/data/cards";

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
};

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
  }));
}
