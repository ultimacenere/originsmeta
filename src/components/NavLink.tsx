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
 */
export function NavLink({ href, className = "", exact = false, children }: { href: string; className?: string; exact?: boolean; children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const active = pathname === href || (!exact && pathname.startsWith(`${href}/`));
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={className ? `nav-link ${className}` : "nav-link"}>
      {children}
    </Link>
  );
}
