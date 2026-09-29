import type { ReactNode } from "react";

/**
 * I testi di una pagina, in fondo, dopo il contenuto (Pierluigi, 29/09/2026: "tutti i contenuti testuali ci creano un
 * problema dal punto di vista della navigabilità", per tier list, carte, mazzi e deck builder). Sotto il titolo restano
 * solo la navigazione e i tasti; introduzione, "In breve", fonte, stato, regole e note sui dati stanno qui, nell'HTML
 * come prima (contano per la SEO), dopo quello che si viene a cercare. Il contenitore dà solo lo stacco dal contenuto:
 * ogni testo tiene il suo stile.
 */
export function PageNotes({ children }: { children: ReactNode }) {
  return <div className="mt-12 min-w-0 break-words">{children}</div>;
}
