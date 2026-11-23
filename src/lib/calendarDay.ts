/**
 * Il giorno del cubetto-data nella striscia del calendario (24/11/2026, Pierluigi: "Sì, correggilo").
 *
 * I tornei della community hanno un orario vero (`starts_at`, con il fuso), ma /api/calendar è in cache ed è uguale per
 * tutti, e ne prendeva il giorno in UTC: il torneo di ChillGiver del 28/11 alle 23:00 UTC compariva come "28 nov" anche
 * in Italia, dove parte il 29 a mezzanotte. Ora la rotta manda anche l'orario (`startsAt`) e il giorno lo calcola il
 * browser, nel fuso di chi guarda. Gli eventi ufficiali di events.ts hanno solo la data e restano come sono.
 *
 * Il modulo non importa niente perché entra nel bundle del browser (TickerMarquee): i18n.ts, che si porta dietro tutti i
 * dizionari, ne riesporta `monthShort` e `dayNumber`, così il mese del cubetto è scritto allo stesso modo ovunque.
 */

/** Il mese abbreviato nella lingua della pagina ("nov", "11月") di una data aaaa-mm-gg; un orario ISO completo si legge in UTC. */
export function monthShort(locale: string, iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00Z" : ""));
  return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(d).replace(".", "");
}

/** Il numero del giorno ("9", "28") di una data aaaa-mm-gg. */
export function dayNumber(iso: string): string {
  return String(Number(iso.slice(8, 10)));
}

/** Il giorno (aaaa-mm-gg) di un orario ISO nel fuso indicato, altrimenti in quello del browser; null se non si legge. */
export function localDay(iso: string, timeZone?: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
    const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const day = `${pick("year")}-${pick("month")}-${pick("day")}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
  } catch {
    // fuso sconosciuto: chi chiama tiene il giorno che aveva
    return null;
  }
}

/** Data, numero e mese del cubetto per un orario ISO, nel fuso di chi guarda (o in quello indicato); null se non si legge. */
export function calendarCube(iso: string, locale: string, timeZone?: string): { date: string; day: string; month: string } | null {
  const date = localDay(iso, timeZone);
  if (!date) return null;
  try {
    return { date, day: dayNumber(date), month: monthShort(locale, date) };
  } catch {
    // lingua che Intl non conosce: resta il giorno calcolato dal sito
    return null;
  }
}
