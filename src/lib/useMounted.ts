import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false durante il render sul server e l'idratazione, true dopo: permette di leggere
 * window/localStorage direttamente nel render senza differenze tra server e client.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
