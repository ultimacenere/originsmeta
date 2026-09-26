"use client";

import { useMounted } from "@/lib/useMounted";

/**
 * Data e ora di un messaggio nell'ora locale di chi legge, come `LocalTime` dei tornei ma più corta (giorno e ora, non
 * il giorno della settimana per esteso). Il server e il primo render mostrano l'ora UTC con l'etichetta, così non ci
 * sono differenze di idratazione; appena montato, il componente passa all'ora locale.
 */
export function InboxTime({ iso, locale, utcLabel, className = "" }: { iso: string; locale: string; utcLabel: string; className?: string }) {
  const mounted = useMounted();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const format = (timeZone?: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", ...(timeZone ? { timeZone } : {}) }).format(d);
  const utc = `${format("UTC")} ${utcLabel}`;
  return (
    <time dateTime={iso} className={className} title={utc}>
      {mounted ? format() : utc}
    </time>
  );
}
