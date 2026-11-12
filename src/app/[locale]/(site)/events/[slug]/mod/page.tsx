import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { isEventSlug } from "@/lib/event/server";
import { EVENT_LOCALE, eventPath } from "@/lib/event/links";
import { EventModPanel } from "@/components/event/EventModPanel";

/**
 * Pannello del mod di un canale per il giveaway di un evento (10/11/2026): mai indicizzato, nessun dato nell'HTML. Il
 * link del mod sta nel frammento dell'indirizzo (#k=…), che non arriva al server. La chat del canale la legge il
 * browser del mod (useTwitchChat), i codici li dà il database (community_event_assign).
 */
// guscio statico: nessun dato nell'HTML (lo legge il browser con le Server Action)
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export const metadata: Metadata = { title: { absolute: "Pannello del mod · OriginsMeta" }, robots: { index: false, follow: false } };

export default async function EventModPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isEventSlug(slug)) notFound();
  if (locale !== EVENT_LOCALE) redirect(eventPath(slug, "/mod"));
  return <EventModPanel slug={slug} />;
}
