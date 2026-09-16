"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  className?: string;
  /** contenuto del pulsante (<summary>) */
  summary: ReactNode;
  summaryClassName?: string;
  summaryLabel?: string;
  children: ReactNode;
};

/**
 * <details> per i menu a tendina dell'header. L'header vive nel layout radice e sopravvive alla navigazione lato
 * client: un <details> aperto resterebbe aperto anche sulla pagina nuova. Qui si chiude al click su un link o un
 * pulsante del menu, al cambio di percorso, al click/tocco fuori e con Esc (rimettendo il focus sul pulsante).
 */
export function AutoCloseDetails({ className, summary, summaryClassName, summaryLabel, children }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  /* cambio di pagina: chiudi */
  useEffect(() => {
    const el = ref.current;
    if (el && el.open) el.open = false;
  }, [pathname]);

  /* click fuori ed Esc */
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = ref.current;
      if (el && el.open && e.target instanceof Node && !el.contains(e.target)) el.open = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const el = ref.current;
      if (e.key === "Escape" && el && el.open) {
        el.open = false;
        el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details
      ref={ref}
      className={className}
      onClick={(e) => {
        /* link o pulsante dentro il menu (non il <summary>): chiudi subito, la navigazione poi conferma */
        const target = e.target instanceof Element ? e.target.closest("a, button") : null;
        if (target && !target.closest("summary") && ref.current) ref.current.open = false;
      }}
    >
      <summary className={summaryClassName} aria-label={summaryLabel}>
        {summary}
      </summary>
      {children}
    </details>
  );
}
