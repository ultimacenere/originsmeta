import Link from "next/link";
import { formatDate, href, type Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { comicRoleOf, listOwnComics } from "@/lib/community/comicQueries";
import { comicImageUrl, comicPath, comicPathOk } from "@/lib/community/comics";
import { deleteComic } from "@/lib/community/comicActions";
import { supabaseUrl } from "@/lib/supabase/env";
import { comicLabels } from "@/lib/comicLabels";
import { ConfirmButton } from "../ConfirmButton";

const statusStyle = { draft: "bg-night-3 text-pale", published: "bg-mint text-ink", hidden: "bg-crimson-deep text-chalk" } as const;

/**
 * "I miei fumetti" nel pannello privato /account (pacchetto FUMETTI, 29/09/2026; ancora #comics): bozze, pubblicati e
 * nascosti dallo staff, con Apri, Modifica ed Elimina, più il tasto "Pubblica un fumetto". Solo per chi può pubblicare
 * fumetti o ne ha già (un ruolo tolto non fa sparire i fumetti). Con la tabella che ancora non c'è non mostra nulla.
 */
export async function AccountComics({ locale, supabase, userId }: { locale: Locale; supabase: Db; userId: string }) {
  const [{ status, comics }, role] = await Promise.all([listOwnComics(supabase, userId), comicRoleOf(supabase, userId)]);
  if (status === "missing" || (!role.canPublish && !comics.length)) return null;
  const L = comicLabels[locale];
  return (
    <section id="comics" className="mt-12 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="t-section">{L.account.title}</h2>
        {role.canPublish ? (
          <Link href={href(locale, "/news/comics/new")} className="btn btn-primary text-xs">
            {L.account.write} →
          </Link>
        ) : null}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.account.intro}</p>
      {comics.length === 0 ? (
        <div className="card-night mt-4 p-6">
          <p className="text-pale-muted">{L.account.none}</p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {comics.map((c) => (
            <li key={c.id} className="card-night flex min-w-0 gap-4 p-4">
              {comicPathOk(c.cover_path, c.owner) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={comicImageUrl(c.cover_path, supabaseUrl)} alt="" width={160} height={90} loading="lazy" decoding="async" className="aspect-[16/9] w-32 shrink-0 rounded-md border-2 border-sky object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`stat-pill px-2 py-0.5 text-[10px] font-extrabold uppercase ${statusStyle[c.status]}`}>{L.account.status[c.status]}</span>
                  <span className="font-mono text-pale-muted">{formatDate(locale, (c.published_at ?? c.updated_at).slice(0, 10))}</span>
                </p>
                <p className="t-item mt-1 break-words text-base leading-tight">{c.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {c.status === "published" ? (
                    <Link href={href(locale, comicPath(c.slug))} className="btn btn-ghost text-xs">
                      {L.account.view}
                    </Link>
                  ) : null}
                  <Link href={href(locale, `${comicPath(c.slug)}/edit`)} className="btn btn-ink text-xs">
                    {L.account.edit}
                  </Link>
                  <form action={deleteComic}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <ConfirmButton label={L.owner.delete} confirm={L.owner.confirmDelete} className="btn btn-danger text-xs" />
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
