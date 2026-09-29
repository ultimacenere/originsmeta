import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href, localeNames, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { comicRoleOf } from "@/lib/community/comicQueries";
import { comicLabels, COMIC_LANG_NAMES } from "@/lib/comicLabels";
import { ComicEditor } from "@/components/comics/ComicEditor";

type Params = Promise<{ locale: string }>;

/** Pagina privata e dinamica: dipende da chi ha fatto l'accesso e dal suo ruolo. */
export const dynamic = "force-dynamic";
/** Dopo la pubblicazione i testi si traducono dentro `after()` (una richiesta per lingua, testi corti): 120 secondi bastano. */
export const maxDuration = 120;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = comicLabels[locale];
  return { ...pageMeta(locale, "/news/comics/new", L.newTitle, L.newDescription), robots: { index: false, follow: false } };
}

/**
 * "Pubblica un fumetto" (pacchetto FUMETTI, 29/09/2026): il modulo per chi ha il ruolo Creator o Staff (o è admin:
 * `canPublishComics`). Chi non ha il ruolo trova il perché; chi non ha fatto l'accesso va al login e torna qui.
 */
export default async function NewComicPage({ params }: { params: Params }) {
  const { locale, dict: d } = await resolveLocale(params);
  const L = comicLabels[locale];
  const { supabase, user } = await currentUser();
  if (!supabase) notFound();
  const path = href(locale, "/news/comics/new");
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(path)}`);
  const role = await comicRoleOf(supabase, user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">
        <Link href={href(locale, "/news")} className="hover:underline">
          {d.nav.news}
        </Link>
      </p>
      <h1 className="t-page mt-2">{L.newTitle}</h1>
      {role.canPublish ? (
        <>
          <p className="mt-4 max-w-3xl text-chalk-muted">{L.newIntro}</p>
          <div className="mt-8">
            <ComicEditor locale={locale} mode="create" labels={{ editor: L.editor, errors: L.errors }} langs={locales.map((l) => [l, localeNames[l]])} langNames={COMIC_LANG_NAMES[locale]} />
          </div>
        </>
      ) : (
        <section className="card-night mt-8 p-6">
          <h2 className="t-item">{L.notAllowed.title}</h2>
          <p className="mt-2 text-pale-muted">{L.notAllowed.text}</p>
        </section>
      )}
    </div>
  );
}
