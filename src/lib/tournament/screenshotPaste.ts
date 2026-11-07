/**
 * Screenshot incollato nella stanza partita (07/11/2026, richiesta di Gami durante EndGame First Blood): cosa fare di un
 * Ctrl+V. Gli stessi tipi del selettore file e del bucket `tournament-screenshots` (il test li confronta con schema.sql);
 * la dimensione la controlla `upload` di MatchRoom, che è lo stesso percorso del selettore.
 */
export const SCREENSHOT_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SCREENSHOT_ACCEPT = SCREENSHOT_TYPES.join(",");

export type PastedScreenshot<T> = { kind: "none" } | { kind: "bad" } | { kind: "image"; file: T };

/**
 * `files` sono i file negli appunti, `hasText` se c'è anche del testo, `inTextField` se il cursore è in un campo. Incollare
 * del testo nella chat resta incollare del testo, anche quando gli appunti portano pure un'immagine (una copia da Word).
 */
export function pastedScreenshot<T extends { type: string }>(files: readonly T[], hasText: boolean, inTextField: boolean): PastedScreenshot<T> {
  if (!files.length || (inTextField && hasText)) return { kind: "none" };
  const file = files.find((f) => SCREENSHOT_TYPES.includes(f.type));
  return file ? { kind: "image", file } : { kind: "bad" };
}
