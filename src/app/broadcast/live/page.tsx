import type { Metadata } from "next";
import { broadcastCatalog, broadcastPeekLabels } from "@/lib/broadcast/catalog";
import { BroadcastLive } from "@/components/broadcast/BroadcastLive";

/**
 * Broadcasting OM, l'overlay (prototipo del 16/10/2026): sorgente browser di OBS a 1920 × 1080, fondo trasparente.
 * Pagina statica: lo stato arriva nel browser (hash, regia aperta nello stesso browser), mai dal server.
 */
export const metadata: Metadata = { title: "Broadcasting OM · Live" };

export default function BroadcastLivePage() {
  return <BroadcastLive catalog={broadcastCatalog()} peekLabels={broadcastPeekLabels()} />;
}
