import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { isEventSlug } from "@/lib/event/server";
import { EVENT_LOCALE, eventPath } from "@/lib/event/links";
import { EventControl } from "@/components/event/EventControl";

/**
 * Regia di un evento della community (10/11/2026): pagina dei caster, mai indicizzata e senza dati nell'HTML. Il link
 * della regia sta nel frammento dell'indirizzo (#k=…), che non arriva al server; lo staff entra senza link. Tutto il
 * resto lo fa EventControl con le Server Action di src/lib/event/actions.ts.
 */
// guscio statico: nessun dato nell'HTML (lo legge il browser con le Server Action)
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export const metadata: Metadata = { title: { absolute: "Regia · OriginsMeta" }, robots: { index: false, follow: false } };

export default async function EventControlPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isEventSlug(slug)) notFound();
  if (locale !== EVENT_LOCALE) redirect(eventPath(slug, "/regia"));
  return <EventControl slug={slug} />;
}
