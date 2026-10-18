"use client";

import { useEffect, useMemo, useState } from "react";
import type { BroadcastCard, PeekLabels } from "@/lib/broadcast/catalog";
import { demoState } from "@/lib/broadcast/demo";
import { STORED_STATE_MAX, decodeState, preferStored, stateFromHash, type BroadcastState } from "@/lib/broadcast/state";
import { BROADCAST_STORAGE_KEY, backgroundSrc, openChannel, readStored } from "@/lib/broadcast/sync";
import { BroadcastOverlay } from "./BroadcastOverlay";

/**
 * Broadcasting OM, lato pubblico (/broadcast/live): la sorgente browser di OBS, 1920 × 1080, fondo trasparente.
 * Stato dall'hash dell'indirizzo (#s=…), altrimenti dall'ultima regia aperta in questo browser; poi si aggiorna da solo
 * a ogni modifica della regia (canale e localStorage) e a ogni cambio dell'hash. `?demo=1` mostra la partita di prova,
 * `?bg=<id>` mette dietro una schermata della partita (per provarlo senza OBS).
 */
export function BroadcastLive({ catalog: list, peekLabels }: { catalog: BroadcastCard[]; peekLabels: PeekLabels }) {
  const catalog = useMemo(() => new Map(list.map((c) => [c.slug, c])), [list]);
  const isCard = useMemo(() => (slug: string) => catalog.has(slug), [catalog]);
  const [state, setState] = useState<BroadcastState | null>(null);
  const [bg, setBg] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- lettura una tantum di indirizzo e localStorage al montaggio */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBg(backgroundSrc(params.get("bg")));
    // dal browser (regia aperta qui o nel dock di OBS): lo stato intero, immagini degli sponsor comprese
    const apply = (code: string | null) => {
      const next = decodeState(code, isCard, STORED_STATE_MAX);
      if (next) setState(next);
      return Boolean(next);
    };
    // dall'indirizzo: senza le immagini caricate, che si riprendono dal browser se è la stessa diretta
    const fromHash = () => {
      const next = preferStored(decodeState(stateFromHash(window.location.hash), isCard), decodeState(readStored(), isCard, STORED_STATE_MAX));
      if (next && stateFromHash(window.location.hash)) setState(next);
      return Boolean(next && stateFromHash(window.location.hash));
    };
    if (!fromHash()) {
      if (params.get("demo") === "1") setState(demoState((params.get("lang") as BroadcastState["lang"]) || "en"));
      else apply(readStored());
    }
    const channel = openChannel();
    if (channel) channel.onmessage = (e: MessageEvent) => typeof e.data === "string" && apply(e.data);
    const onStorage = (e: StorageEvent) => e.key === BROADCAST_STORAGE_KEY && apply(e.newValue);
    window.addEventListener("storage", onStorage);
    window.addEventListener("hashchange", fromHash);
    return () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [isCard]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!state) {
    return (
      <div className="bc-empty">
        <strong>Broadcasting OM</strong>
        <span>originsmeta.com/broadcast</span>
        <span>OriginsMeta · not affiliated with Koin Games</span>
      </div>
    );
  }
  return <BroadcastOverlay state={state} catalog={catalog} peekLabels={peekLabels} mode="live" background={bg} />;
}
