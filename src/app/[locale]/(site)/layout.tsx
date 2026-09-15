import { resolveLocale, type LocaleParams } from "@/lib/page";
import { EventTicker } from "@/components/EventTicker";

/**
 * Tutte le pagine tranne la home: striscia del calendario subito sotto l'header, poi il contenuto.
 * La home (gruppo "(home)") mette prima lo slider e poi la striscia.
 */
export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: LocaleParams }) {
  const { locale, dict } = await resolveLocale(params);
  return (
    <>
      <EventTicker locale={locale} dict={dict} />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
