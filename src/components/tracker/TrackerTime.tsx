"use client";

import { useMounted } from "@/lib/useMounted";

/**
 * Data e ora brevi nell'ora locale di chi guarda (/account/tracker). Come `LocalTime`: il server e il primo render
 * mostrano l'ora UTC con "UTC", così l'idratazione non cambia nulla; appena montato, l'ora locale.
 */
export function TrackerTime({ iso, locale, className = "" }: { iso: string; locale: string; className?: string }) {
  const mounted = useMounted();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" };
  const utc = `${new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(d)} UTC`;
  return (
    <time dateTime={iso} className={className} title={utc}>
      {mounted ? new Intl.DateTimeFormat(locale, opts).format(d) : utc}
    </time>
  );
}
