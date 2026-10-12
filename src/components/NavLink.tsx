"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Voce di menu che sa se è la pagina corrente (rilievo GR-1 del 21/09/2026): l'header è statico e sta nel layout
 * radice, quindi il percorso si legge qui nel browser, in un componente minuscolo, senza rendere dinamico il resto.
 * La voce attiva riceve `aria-current="page"`; l'aspetto (riposo chalk, passaggio mint, attiva evidente) è della
 * classe `.nav-link` in globals.css. Una sezione resta accesa anche nelle sue sottopagine: /it/decks/community/x
 * accende "Mazzi", mentre /it/deck-builder non accende "Mazzi" (confronto per segmento intero, non per prefisso).
 * `also` (12/10/2026): altri indirizzi che accendono la voce, con le stesse regole; la voce principale di un sottomenu si
 * accende anche nelle pagine delle sue voci (/it/cards/x accende la voce delle guide, che contiene le Carte).
 */
export function NavLink({
  href,
  className = "",
  exact = false,
  also,
  children,
}: {
  href: string;
  className?: string;
  exact?: boolean;
  also?: string[];
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const matches = (h: string) => pathname === h || (!exact && pathname.startsWith(`${h}/`));
  const active = matches(href) || (also ?? []).some(matches);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={className ? `nav-link ${className}` : "nav-link"}>
      {children}
    </Link>
  );
}
