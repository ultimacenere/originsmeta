import type { ReactNode } from "react";

/** Logo Steam (tracciato Simple Icons), colorato con il colore del testo corrente. */
export function SteamLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} shrink-0 fill-current`}>
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
    </svg>
  );
}

export const isSteamUrl = (url?: string | null): boolean => /steampowered\.com|steamcommunity\.com/i.test(url ?? "");

/*
  Link esterni (tasti Steam e Discord, link ufficiali del footer, iscrizioni e fonti degli eventi).
  Si aprono in una nuova scheda: chi va su Steam o sul Discord ufficiale trova ancora OriginsMeta aperto
  quando torna. `noopener` toglie alla pagina esterna ogni accesso alla nostra; il referrer resta (solo il
  dominio, con la policy predefinita del browser: il sito non ne imposta un'altra) così le statistiche di
  traffico di Steam possono attribuire le visite a originsmeta.com. Per toglierlo basta aggiungere
  "noreferrer" qui sotto: vale per tutto il sito.
  L'avviso "si apre in una nuova scheda" per i lettori di schermo è un testo nascosto reso dal Footer (che sta
  in ogni pagina, nel layout della lingua) e richiamato con aria-describedby: così SteamButton e DiscordButton,
  usati anche in componenti client, non hanno bisogno del dizionario. Dove il dizionario c'è (Footer,
  EventCard) il testo sta direttamente nel link, in un <span class="sr-only">.
*/
export const NEW_TAB_HINT_ID = "om-new-tab-hint";
export const NEW_TAB_REL = "noopener";
export const newTabProps = { target: "_blank", rel: NEW_TAB_REL, "aria-describedby": NEW_TAB_HINT_ID } as const;
export const isExternalHref = (url?: string | null): boolean => /^https?:\/\//i.test(url ?? "");

/** Freccia "esce dal sito" accanto ai link testuali esterni: decorativa, il testo per i lettori di schermo è a parte. */
export function NewTabIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`${className} shrink-0`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 3.5h6v6M12.5 3.5 4 12" />
    </svg>
  );
}

/**
 * Tasto che porta su Steam, con i colori e la tipografia del negozio Steam (classi in globals.css):
 * "blue" = bottone Installa/Gioca, "green" = Aggiungi al carrello / demo, "dark" = link secondari (news, fonte).
 * Si apre in una nuova scheda (vedi sopra).
 */
export function SteamButton({
  href,
  children,
  variant = "blue",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "blue" | "green" | "dark";
  size?: "md" | "sm";
  className?: string;
}) {
  const cls = ["btn-steam", variant === "dark" ? "btn-steam-dark" : variant === "green" ? "btn-steam-green" : "", size === "sm" ? "btn-steam-sm" : "", className].filter(Boolean).join(" ");
  const external = isExternalHref(href);
  return (
    <a href={href} {...(external ? newTabProps : {})} className={cls}>
      <SteamLogo className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span>{children}</span>
    </a>
  );
}
