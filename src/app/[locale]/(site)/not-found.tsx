import Link from "next/link";
import { locale as rootLocale } from "next/root-params";
import { getDictionary, href, isLocale, defaultLocale } from "@/lib/i18n";

export default async function NotFound() {
  const raw = await rootLocale();
  const locale = typeof raw === "string" && isLocale(raw) ? raw : defaultLocale;
  const d = getDictionary(locale);
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="kicker text-mint">404</p>
      <h1 className="t-page mt-3">{d.notFound.title}</h1>
      <p className="mt-4 text-chalk-muted">{d.notFound.text}</p>
      <p className="mt-8 flex justify-center gap-3">
        <Link className="btn btn-primary" href={href(locale)}>{d.notFound.cta}</Link>
        <Link className="btn btn-ghost" href={href(locale, "/cards")}>{d.nav.cards}</Link>
      </p>
    </div>
  );
}
