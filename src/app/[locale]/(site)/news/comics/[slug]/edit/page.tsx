import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href, localeNames, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { comicRoleOf, getComicForEdit } from "@/lib/community/comicQueries";
import { comicPath } from "@/lib/community/comics";
import { deleteComic, setComicStatus } from "@/lib/community/comicActions";
import { comicLabels } from "@/lib/comicLabels";
import { ComicEditor } from "@/components/comics/ComicEditor";
import { ConfirmButton } from "@/components/ConfirmButton";

type Params = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";
/** Dopo una modifica di un fumetto pubblicato i testi cambiati si ritraducono dentro `after()` (vedi /news/comics/new). */
export const maxDuration = 120;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await resolveLocale(params);
  const L = comicLabels[locale];
  return { ...pageMeta(locale, `${comicPath(slug)}/edit`, L.editTitle, L.newDescription), robots: { index: false, follow: false } };
}

/**
 * Modifica di un fumetto (pacchetto FUMETTI, 29/09/2026): tavole, testi e copertina li cambia solo il proprietario (anche
 * una bozza); lo staff da qui nasconde un fumetto o lo rimette online, e lo può eliminare. Le policy RLS mostrano bozze e
 * nascosti solo al proprietario e allo staff: a chiunque altro la pagina risponde 404.
 */
export default async function EditComicPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const L = comicLabels[locale];
  const { supabase, user } = await currentUser();
  if (!supabase) notFound();
  const path = href(locale, `${comicPath(slug)}/edit`);
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(path)}`);

  const [{ status, comic }, role] = await Promise.all([getComicForEdit(supabase, slug), comicRoleOf(supabase, user.id)]);
  if (status === "missing") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="card-night p-6 text-pale-muted">{L.page.unavailable}</p>
      </div>
    );
  }
  if (!comic || (comic.owner !== user.id && !role.staff)) notFound();
  const owner = comic.owner === user.id;
  const saved = (await searchParams).saved === "1";
  const publicHref = href(locale, comicPath(comic.slug));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={`${href(locale, "/account")}#comics`} className="text-chalk-muted hover:text-chalk">
          ← {d.community.account.title}
        </Link>
      </p>
      <h1 className="t-page mt-4">{L.editTitle}</h1>
      <p className="mt-3 break-words text-chalk-muted">
        {comic.status === "published" ? (
          <Link href={publicHref} className="text-mint underline-offset-2 hover:underline">
            {comic.title} →
          </Link>
        ) : (
          comic.title
        )}
      </p>
      {owner ? (
        <div className="mt-8">
          <ComicEditor
            locale={locale}
            mode="edit"
            initial={{ id: comic.id, status: comic.status, lang: comic.lang, title: comic.title, summary: comic.summary, pages: comic.pages, cover_path: comic.cover_path }}
            labels={{ editor: L.editor, errors: L.errors }}
            langs={locales.map((l) => [l, localeNames[l]])}
            justSaved={saved}
          />
        </div>
      ) : null}

      {/* Fuori dal modulo (niente moduli annidati): eliminazione e, per lo staff, nascondere e rimettere online */}
      <div className="mt-10 flex flex-wrap items-center gap-2 border-t-2 border-night-3 pt-6">
        {role.staff && comic.status !== "draft" ? (
          <form action={setComicStatus}>
            <input type="hidden" name="id" value={comic.id} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="status" value={comic.status === "hidden" ? "published" : "hidden"} />
            <input type="hidden" name="back" value={path} />
            <button type="submit" className="btn btn-ink text-xs">
              {comic.status === "hidden" ? L.owner.unhide : L.owner.hide}
            </button>
          </form>
        ) : null}
        <form action={deleteComic}>
          <input type="hidden" name="id" value={comic.id} />
          <input type="hidden" name="locale" value={locale} />
          <ConfirmButton label={L.owner.delete} confirm={L.owner.confirmDelete} className="btn btn-danger text-xs" />
        </form>
      </div>
    </div>
  );
}
