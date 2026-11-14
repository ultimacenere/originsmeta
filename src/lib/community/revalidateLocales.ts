import { revalidatePath } from "next/cache";
import { pathInAllLocales } from "./localePaths";

/**
 * Rinnova `path` in tutte le lingue (da una Server Action). Un percorso che non è dei nostri (`pathInAllLocales` null)
 * si rinnova solo se comincia con "/", come facevano le azioni prima.
 */
export function revalidateInAllLocales(path: unknown): void {
  if (typeof path !== "string") return;
  const all = pathInAllLocales(path);
  if (all) for (const p of all) revalidatePath(p);
  else if (path.startsWith("/")) revalidatePath(path);
}
