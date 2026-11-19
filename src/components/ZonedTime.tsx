"use client";

import { useMounted } from "@/lib/useMounted";

/**
 * Giorno e ora nell'ora di chi guarda, con il nome del fuso ("sab 28 nov, 16:00 CET"), per la pagina dell'Harvest Bowl
 * (19/11/2026; l'analisi del sito segnalava l'ora dei tornei senza fuso). Server e primo render: niente (le ore fisse
 * UTC/ET/CET sono già scritte accanto), così l'HTML statico è uguale per tutti e non ci sono differenze di idratazione.
 */
export function ZonedTime({ iso, locale, className = "" }: { iso: string; locale: string; className?: string }) {
  const mounted = useMounted();
  const d = new Date(iso);
  if (!mounted || Number.isNaN(d.getTime())) return null;
  const text = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(d);
  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  );
}
