/**
 * Numeri della dashboard privata di Pierluigi (22/10/2026: "vorrei crearne una con i numeri che mi interessano di
 * originsmeta": visite giornaliere, iscrizioni, download del tracker, deck creati). Iscrizioni, download e mazzi li dà la
 * funzione `kpi_daily` del database (blocco "22/10/2026: NUMERI DELLA DASHBOARD" di supabase/schema.sql) attraverso la
 * rotta /api/staff/kpi, solo con il segreto del cron; le visite le legge Claude da Vercel Web Analytics. La dashboard è
 * una pagina privata su claude.ai, aggiornata ogni mattina. Il numero di persone iscritte non si mostra mai sul sito.
 * Funzioni pure, nessun import: `node --test src/lib/kpi.test.ts`.
 */

/** Il primo giorno del sito online (15/09/2026): la dashboard parte da qui. */
export const KPI_SINCE = "2026-09-15";
/** Al massimo tanti giorni per richiesta: uguale in `kpi_daily`. */
export const KPI_MAX_DAYS = 400;

/** Un giorno (di Roma) della dashboard. */
export type KpiDay = {
  day: string;
  signups: number;
  trackerDownloads: number;
  trackerNewAccounts: number;
  trackerClicksNoLogin: number;
  decksCreated: number;
  decksPublished: number;
  deckSetsCreated: number;
};

/** Il parametro `from` della rotta: un giorno aaaa-mm-gg valido, altrimenti il giorno del lancio. */
export function kpiFrom(raw: string | null | undefined): string {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return KPI_SINCE;
  const d = new Date(`${raw}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== raw ? KPI_SINCE : raw;
}

const int = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
};

/** Le righe di `kpi_daily` → giorni della dashboard; le righe senza un giorno valido si scartano. */
export function kpiDays(rows: unknown): KpiDay[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r): KpiDay[] => {
    const x = (r ?? {}) as Record<string, unknown>;
    const day = typeof x.day === "string" ? x.day.slice(0, 10) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return [];
    return [
      {
        day,
        signups: int(x.signups),
        trackerDownloads: int(x.tracker_downloads),
        trackerNewAccounts: int(x.tracker_new_accounts),
        trackerClicksNoLogin: int(x.tracker_clicks_no_login),
        decksCreated: int(x.decks_created),
        decksPublished: int(x.decks_published),
        deckSetsCreated: int(x.deck_sets_created),
      },
    ];
  });
}
