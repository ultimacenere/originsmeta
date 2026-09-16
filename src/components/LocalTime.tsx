"use client";

import { useMounted } from "@/lib/useMounted";

/**
 * Data e ora di un torneo nell'ora locale di chi guarda. Il server (e il primo render nel browser) mostra
 * l'ora UTC con l'etichetta "UTC", così l'HTML statico è uguale per tutti e non ci sono differenze
 * di idratazione; appena montato, il componente passa all'ora locale.
 */
export function LocalTime({ iso, locale, utcLabel, className = "" }: { iso: string; locale: string; utcLabel: string; className?: string }) {
  const mounted = useMounted();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const utc = `${new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(d)} ${utcLabel}`;
  const local = mounted ? new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(d) : null;
  return (
    <time dateTime={iso} className={className} title={utc}>
      {local ?? utc}
    </time>
  );
}
