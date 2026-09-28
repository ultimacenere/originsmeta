"use client";

import { useMounted } from "@/lib/useMounted";

/**
 * Data e ora di un messaggio nell'ora locale di chi legge, come `LocalTime` dei tornei ma più corta (giorno e ora, non
 * il giorno della settimana per esteso). Il server e il primo render mostrano l'ora UTC con l'etichetta, così non ci
 * sono differenze di idratazione; appena montato, il componente passa all'ora locale.
 * Con `dateOnly` solo il giorno (28/09/2026: "Iniziata il …" di una conversazione tagliava la data in UTC, e un messaggio
 * mandato dall'Italia fra mezzanotte e le 2 risultava del giorno prima).
 */
export function InboxTime({ iso, locale, utcLabel, dateOnly = false, className = "" }: { iso: string; locale: string; utcLabel: string; dateOnly?: boolean; className?: string }) {
  const mounted = useMounted();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const style: Intl.DateTimeFormatOptions = dateOnly ? { dateStyle: "long" } : { dateStyle: "medium", timeStyle: "short" };
  const format = (timeZone?: string) => new Intl.DateTimeFormat(locale, { ...style, ...(timeZone ? { timeZone } : {}) }).format(d);
  const utc = `${format("UTC")} ${utcLabel}`;
  return (
    <time dateTime={iso} className={className} title={utc}>
      {mounted ? format() : utc}
    </time>
  );
}
