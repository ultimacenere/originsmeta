"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DROP_MAX_H_VAR, panelRoom } from "@/lib/dropPanel";

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
 *
 * Il pannello non esce mai dallo schermo (12/11/2026): la tendina "Menu" del telefono era alta 923 px, l'header è fisso
 * in cima e il pannello non scorreva, quindi su un telefono da 667 px gli ultimi 290 px non si raggiungevano (Tornei,
 * Mercato, Chi siamo, il selettore lingua, Discord, "Dona ora"), su uno da 844 px gli ultimi 110. Il pannello (il figlio
 * accanto al <summary>) porta la classe `.drop-fit` di globals.css, che gli dà lo scorrimento interno e un'altezza
 * massima letta dalla variabile `--drop-max-h`; qui la variabile si calcola dallo spazio vero fra il tasto e il fondo
 * dello schermo (`panelRoom` in src/lib/dropPanel.ts), perché sopra l'header può esserci la barra del Kickstarter, che
 * scorre via: prima che il menu si apra (al clic sul tasto, così il primo disegno è già giusto) e, a menu aperto, quando
 * la pagina scorre o lo schermo cambia misura (rotazione, barra degli indirizzi del telefono che entra ed esce). Senza
 * JavaScript vale l'altezza di riserva di `.drop-fit`, calcolata per l'header già in cima. Vale per i tre menu
 * dell'header: Menu del telefono, menu dell'account, lingua (che sul telefono in orizzontale uscivano anche loro).
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

  /* lo spazio fra il tasto e il fondo dello schermo, scritto nella variabile che `.drop-fit` legge */
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // il <details> è alto quanto il suo tasto: il pannello è in posizione assoluta, aperto o chiuso
    const room = panelRoom({ innerHeight: window.innerHeight, visualHeight: window.visualViewport?.height, summaryBottom: el.getBoundingClientRect().bottom });
    el.style.setProperty(DROP_MAX_H_VAR, `${room}px`);
  }, []);

  /* a menu aperto: la pagina scorre (l'header sale fino in cima) o lo schermo cambia misura */
  useEffect(() => {
    let frame = 0;
    const onChange = () => {
      if (frame || !ref.current?.open) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (ref.current?.open) fit();
      });
    };
    // aperto prima che la pagina fosse pronta (il <details> si apre anche senza JavaScript): il conto si fa adesso
    if (ref.current?.open) fit();
    const visual = window.visualViewport;
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, { passive: true });
    visual?.addEventListener("resize", onChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange);
      visual?.removeEventListener("resize", onChange);
    };
  }, [fit]);

  return (
    <details
      ref={ref}
      className={className}
      onClick={(e) => {
        /* link o pulsante dentro il menu (non il <summary>): chiudi subito, la navigazione poi conferma */
        const target = e.target instanceof Element ? e.target.closest("a, button") : null;
        if (target && !target.closest("summary") && ref.current) ref.current.open = false;
      }}
      onToggle={() => {
        const el = ref.current;
        if (!el?.open) return;
        fit();
        // riaperto, il pannello riparte dall'alto: Chrome ricorda fin dove si era scesi, gli altri browser no
        el.querySelectorAll(":scope > :not(summary)").forEach((panel) => panel.scrollTo(0, 0));
      }}
    >
      {/* il calcolo parte al clic sul tasto, prima che il browser apra il <details>: niente salto di altezza al primo disegno */}
      <summary className={summaryClassName} aria-label={summaryLabel} onClick={fit}>
        {summary}
      </summary>
      {children}
    </details>
  );
}
