import { dayNumber, href, monthShort, type Dictionary, type Locale } from "@/lib/i18n";
import { upcomingEvents } from "@/lib/data/events";
import { creatorLabels } from "@/lib/creatorLabels";
import { TickerMarquee, type TickerItem } from "./TickerMarquee";

/** Striscia scorrevole con i prossimi eventi: cubetto-data + nome; il prossimo evento è evidenziato in giallo. */
export function EventTicker({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const events = upcomingEvents();
  const items: TickerItem[] = events.map((e, i) => ({
    key: e.slug,
    // l'evento con una pagina sua sul sito (il Kickstarter, 01/11/2026) porta lì, gli altri alla loro scheda di /tournaments
    href: e.page ? href(locale, e.page.path) : `${href(locale, "/tournaments")}#${e.slug}`,
    date: e.start,
    day: dayNumber(e.start),
    month: monthShort(locale, e.start),
    title: e.title[locale],
    where: e.where[locale],
    isNext: i === 0,
  }));
  // Senza eventi ufficiali in arrivo la striscia resta (01/11/2026: finita la Crimson Cup era sparita del tutto, e con lei
  // i tornei della community e "Ora live" che arrivano nel browser): al posto delle date l'invito a organizzare un torneo,
  // che sparisce appena c'è un torneo della community in calendario.
  const empty: TickerItem = {
    key: "organize",
    href: href(locale, "/tournaments/new"),
    date: "",
    day: "+",
    month: "",
    title: dict.tournaments.organizeCta,
    where: dict.events.communityBadge,
    isNext: false,
  };
  // i tornei della community pubblicati sul calendario si aggiungono nel browser da /api/calendar (il layout resta statico);
  // "Ora live" accanto al logo del gioco, solo quando qualcuno è in diretta, da /api/live nel browser (28/09/2026)
  const live = { ...creatorLabels[locale].liveNow.strip, href: href(locale, "/live") };
  return (
    <TickerMarquee
      items={items}
      empty={empty}
      ariaLabel={dict.common.calendar}
      nextLabel={dict.common.next}
      prevLabel={dict.common.scrollLeft}
      nextBtnLabel={dict.common.scrollRight}
      extraUrl="/api/calendar"
      locale={locale}
      live={live}
    />
  );
}
