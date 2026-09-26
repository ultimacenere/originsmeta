"use client";

import { useMounted } from "@/lib/useMounted";
import { timeZoneName, upcomingSlots, weekdayName, type ScheduleEntry } from "@/lib/community/showcase";
import { fillShowcase, type ShowcaseViewLabels } from "@/lib/showcaseLabels";
import { LiveBadge } from "@/components/LiveBadge";

type Row = { key: string; day: string; time: string; end?: string; ongoing: boolean };

/** Ora "HH:MM" più `minutes`, sull'orologio di 24 ore (la fine di una diretta che passa la mezzanotte). */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Le righe nel fuso del creator: l'HTML statico, uguale per tutti (niente differenze di idratazione). */
function creatorRows(entries: readonly ScheduleEntry[], locale: string): Row[] {
  return entries.map((e) => ({ key: `${e.day}-${e.time}`, day: weekdayName(locale, e.day), time: e.time, ...(e.minutes ? { end: addMinutes(e.time, e.minutes) } : {}), ongoing: false }));
}

/** Le righe nel fuso di chi guarda, dalla prossima diretta (quelle in corso per prime). */
function viewerRows(entries: readonly ScheduleEntry[], tz: string, locale: string): Row[] {
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const day = new Intl.DateTimeFormat(locale, { weekday: "long" });
  const cap = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
  return upcomingSlots(entries, tz, Date.now()).map((s) => ({
    key: `${s.entry.day}-${s.entry.time}`,
    day: cap(day.format(new Date(s.start))),
    time: time.format(new Date(s.start)),
    ...(s.end ? { end: time.format(new Date(s.end)) } : {}),
    ongoing: s.ongoing,
  }));
}

/**
 * Orari delle dirette sulla vetrina /u (pacchetto VETRINA, 27/09/2026). Il creator li scrive nel suo fuso; qui, come
 * `LocalTime` per i tornei, il server e il primo render mostrano l'ora del creator con il nome del fuso, poi il browser
 * passa al fuso di chi guarda (giorno e ora della prossima diretta di ogni voce, calcolati con `upcomingSlots`). Con il
 * badge LIVE (Twitch, /api/live) compare "In diretta ora", che porta al canale.
 */
export function ScheduleView({
  entries,
  tz,
  locale,
  labels,
  username,
  live,
  titleStyle,
}: {
  entries: ScheduleEntry[];
  /** fuso del creator (uno di `TIMEZONES`) */
  tz: string;
  locale: string;
  labels: ShowcaseViewLabels;
  username: string;
  /** il profilo ha un canale Twitch: si chiede lo stato in diretta */
  live: boolean;
  titleStyle?: { color: string };
}) {
  const mounted = useMounted();
  let rows = creatorRows(entries, locale);
  let note = fillShowcase(labels.creatorTz, { tz: timeZoneName(tz) });
  if (mounted) {
    try {
      const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      rows = viewerRows(entries, tz, locale);
      note = fillShowcase(labels.inYourTz, { tz: timeZoneName(viewerTz) });
    } catch {
      // un fuso che il browser non conosce: restano gli orari del creator
    }
  }
  if (!entries.length) return null;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="kicker text-mint" style={titleStyle}>
          {labels.schedule}
        </h2>
        {live ? <LiveBadge username={username} labels={{ badge: labels.liveNow, title: labels.liveNowTitle }} placement="profile" /> : null}
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <li key={r.key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="text-pale">{r.day}</span>
            <span className="flex items-center gap-2 font-mono text-chalk">
              {r.ongoing ? <span className="stat-pill bg-crimson-deep text-[11px] text-chalk">{labels.onNow}</span> : null}
              {r.time}
              {r.end ? `–${r.end}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-pale-muted">{note}</p>
    </div>
  );
}
