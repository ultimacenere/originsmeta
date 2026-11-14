"use client";

import NextLink from "next/link";
import { useState, type ComponentProps } from "react";

type Props = ComponentProps<typeof NextLink>;

/**
 * Il `<Link>` del sito (14/11/2026, piano di riduzione dei costi, intervento 2): prefetch solo quando il visitatore mostra
 * l'intenzione di aprire il link (mouse sopra, dito che lo tocca, fuoco da tastiera), non appena il link entra nello
 * schermo come fa `next/link`.
 *
 * Perché: misurato il 14/11 su originsmeta.com in un browser pulito, scorrendo la pagina fino in fondo, i prefetch RSC
 * (`?_rsc=`) erano 99 richieste sulla home, 199 su /decks, 72 sulla scheda di un mazzo, su 150–410 richieste totali. Ogni
 * prefetch è una richiesta CDN pagata, anche se il visitatore non apre quel link; le richieste del ciclo 12/10–12/11
 * sono state 16,3 milioni (circa 90 per pagina vista) e hanno fatto scattare la CDN a tariffa fissa da 100 $ al mese.
 *
 * Come: la ricetta "Hover-triggered prefetch" della guida di Next 16 (docs/01-app/02-guides/prefetching.md): finché non
 * c'è l'intenzione `prefetch={false}`, poi il comportamento normale (`null`, o il valore passato). Il passaggio del mouse
 * anticipa il clic di qualche centinaio di millisecondi, abbastanza perché la pagina arrivi quasi sempre già pronta.
 * `prefetch={false}` passato da chi usa il componente resta com'è: nessun prefetch nemmeno al passaggio del mouse.
 * Si importa come `Link` (`import Link from "@/components/IntentLink"`), con le stesse props di `next/link`.
 */
export default function IntentLink({ prefetch, onMouseEnter, onTouchStart, onFocus, ...rest }: Props) {
  const [intent, setIntent] = useState(false);
  const wanted = prefetch === undefined ? null : prefetch;
  return (
    <NextLink
      {...rest}
      prefetch={prefetch === false || !intent ? false : wanted}
      onMouseEnter={(e) => {
        setIntent(true);
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        setIntent(true);
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        setIntent(true);
        onFocus?.(e);
      }}
    />
  );
}
