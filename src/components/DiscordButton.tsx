import type { ReactNode } from "react";
import { isExternalHref, newTabProps } from "./SteamButton";

/** Logo Discord "Clyde" (tracciato Simple Icons), colorato con il colore del testo corrente. */
export function DiscordLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} shrink-0 fill-current`}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

export const isDiscordUrl = (url?: string | null): boolean => /discord\.(gg|com)/i.test(url ?? "");

/**
 * Tasto che porta su Discord, con i colori e la tipografia di Discord (classi in globals.css):
 * "blurple" = azione principale (#5865F2), "grey" = secondaria (#4E5058), come nell'app Discord.
 * Con un indirizzo esterno (il caso normale: invito o canale) si apre in una nuova scheda, con l'avviso per i
 * lettori di schermo (vedi `newTabProps` in SteamButton.tsx). Il clic lo misura `onDocumentClick` (discord_click,
 * con il nostro server distinto da quello ufficiale): vedi la nota in SteamButton.tsx.
 */
export function DiscordButton({
  href,
  children,
  variant = "blurple",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "blurple" | "grey";
  size?: "md" | "sm";
  className?: string;
}) {
  const cls = ["btn-discord", variant === "grey" ? "btn-discord-grey" : "", size === "sm" ? "btn-discord-sm" : "", className].filter(Boolean).join(" ");
  const external = isExternalHref(href);
  return (
    <a href={href} {...(external ? newTabProps : {})} className={cls} data-om-cta="button">
      <DiscordLogo className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span>{children}</span>
    </a>
  );
}

/**
 * Solo il logo, nello stesso blurple dei tasti (loghino dell'header, richiesta di Pierluigi del 24/09/2026).
 * Il logo è muto: il nome del link lo dà `label`, più l'avviso della nuova scheda di `newTabProps`.
 */
export function DiscordIconLink({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return (
    <a href={href} {...newTabProps} aria-label={label} title={label} className={`btn-discord btn-discord-icon ${className}`} data-om-cta="icon">
      <DiscordLogo className="h-4 w-4" />
    </a>
  );
}
