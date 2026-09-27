import Link from "next/link";
import { formatDate, getDictionary, href, type Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { guideRoleOf, listGuidesByOwner, listOwnGuides } from "@/lib/community/guideQueries";
import { fillLabel } from "@/lib/community/deckQuality";
import { deleteCommunityGuide } from "@/lib/community/guideActions";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { ConfirmButton } from "../ConfirmButton";
import { CommunityGuideCard } from "./CommunityGuideList";

const statusStyle = { draft: "bg-night-3 text-pale", published: "bg-mint text-ink", hidden: "bg-crimson-deep text-chalk" } as const;

/**
 * "Le mie guide" nel pannello privato /account (pacchetto GUIDE, 27/09/2026; ancora #guides): bozze, pubblicate e
 * nascoste dallo staff, con Apri, Modifica ed Elimina, più il tasto "Scrivi una guida". Solo per chi può pubblicare
 * guide o ne ha già (un ruolo tolto non fa sparire le guide scritte). Legge con la sessione dell'utente; con la tabella
 * che ancora non c'è non mostra nulla.
 */
export async function AccountGuides({ locale, supabase, userId }: { locale: Locale; supabase: Db; userId: string }) {
  const [{ status, guides }, role] = await Promise.all([listOwnGuides(supabase, userId), guideRoleOf(supabase, userId)]);
  if (status === "missing" || (!role.canPublish && !guides.length)) return null;
  const L = communityGuideLabels[locale];
  const d = getDictionary(locale);
  return (
    <section id="guides" className="mt-12 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="t-section">{L.account.title}</h2>
        {role.canPublish ? (
          <Link href={href(locale, "/guides/new")} className="btn btn-primary text-xs">
            {L.account.write} →
          </Link>
        ) : null}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.account.intro}</p>
      {guides.length === 0 ? (
        <div className="card-night mt-4 p-6">
          <p className="text-pale-muted">{L.account.none}</p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {guides.map((g) => {
            const view = href(locale, `/guides/community/${g.slug}`);
            return (
              <li key={g.id} className="card-night flex min-w-0 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`stat-pill text-[11px] font-semibold uppercase ${statusStyle[g.status]}`}>{L.account.status[g.status]}</span>
                  <span className="stat-pill bg-sky text-ink">{d.guides.categories[g.category]}</span>
                  <span className="stat-pill bg-night-3 font-mono text-pale">{g.lang.toUpperCase()}</span>
                </div>
                <p className="t-item mt-3 break-words leading-tight">{g.title}</p>
                <p className="mt-1 font-mono text-xs text-pale-muted">
                  {fillLabel(L.account.words, { n: String(g.words ?? 0) })} · {d.common.updated} {formatDate(locale, g.updated_at.slice(0, 10))}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {g.status === "published" ? (
                    <Link href={view} className="btn btn-ink text-xs">
                      {L.account.view}
                    </Link>
                  ) : null}
                  <Link href={`${view}/edit`} className="btn btn-ink text-xs">
                    {L.account.edit}
                  </Link>
                  <form action={deleteCommunityGuide}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <ConfirmButton label={L.owner.delete} confirm={L.owner.confirmDelete} className="btn btn-danger text-xs" />
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Le guide pubblicate di un iscritto sulla sua pagina pubblica /u/<nome> (ISR): niente se non ne ha. Le schede portano
 * alle guide; il riassunto è nella lingua della pagina quando la traduzione c'è.
 */
export async function UserGuides({ locale, ownerId }: { locale: Locale; ownerId: string }) {
  const guides = await listGuidesByOwner(ownerId, 24);
  if (!guides.length) return null;
  const L = communityGuideLabels[locale];
  const d = getDictionary(locale);
  return (
    <section className="mt-12" aria-labelledby="user-guides-title">
      <h2 id="user-guides-title" className="t-section">
        {L.profile.title}
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {guides.map((g) => (
          <li key={g.id} className="min-w-0">
            <CommunityGuideCard guide={g} locale={locale} categoryLabel={d.guides.categories[g.category]} showAuthor={false} />
          </li>
        ))}
      </ul>
    </section>
  );
}
