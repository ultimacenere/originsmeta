"use client";

import { useMounted } from "@/lib/useMounted";

/**
 * Solo l'ora (16:05) nell'ora locale di chi guarda, come `LocalTime`: il server e il primo render mostrano l'ora UTC con
 * l'etichetta, così l'HTML in cache è uguale per tutti; appena montato passa all'ora locale.
 */
export function ClockTime({ iso, locale, utcLabel }: { iso: string; locale: string; utcLabel: string }) {
  const mounted = useMounted();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const utc = `${new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone: "UTC" }).format(d)} ${utcLabel}`;
  const local = mounted ? new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(d) : null;
  return (
    <time dateTime={iso} title={utc}>
      {local ?? utc}
    </time>
  );
}
