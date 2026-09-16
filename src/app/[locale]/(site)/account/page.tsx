import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { getCard } from "@/lib/data/cards";
import { currentUser } from "@/lib/supabase/server";
import { listUserDecks } from "@/lib/community/queries";
import { deleteDeck, setDeckStatus } from "@/lib/community/actions";
import type { Profile } from "@/lib/community/types";
import { listUserTournaments } from "@/lib/tournament/queries";
import { deleteTournament } from "@/lib/tournament/actions";
import { Avatar, SignOutButton } from "@/components/AccountMenu";
import { TournamentCard } from "@/components/TournamentCard";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, "/account", dict.community.account.title, dict.community.account.intro), robots: { index: false, follow: false } };
}

export default async function AccountPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const c = d.community;
  const { supabase, user } = await currentUser();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="card-night p-6 text-pale-muted">{c.account.disabled}</p>
      </div>
    );
  }
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, "/account"))}`);

  const { data: profileRow } = await supabase.from("profiles").select("username, display_name, avatar_url, role, created_at").eq("id", user.id).maybeSingle();
  const profile = (profileRow as (Profile & { role: string; created_at: string }) | null) ?? null;
  const name = profile?.display_name || profile?.username || user.email?.split("@")[0] || "player";
  const [decks, tournaments] = await Promise.all([listUserDecks(supabase, user.id), listUserTournaments(supabase, user.id)]);
  const x = d.tournaments;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.account}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{c.account.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{c.account.intro}</p>

      <section className="card-night mt-8 flex flex-wrap items-center gap-4 p-6">
        <Avatar profile={profile} name={name} size={56} />
        <div className="min-w-0 flex-1">
          <p className="kicker text-pale-muted">{c.account.signedInAs}</p>
          <p className="font-display text-2xl font-extrabold text-sky">{name}</p>
          <p className="font-mono text-xs text-pale-muted">
            {profile?.username ? `@${profile.username} · ` : ""}
            {user.email}
            {profile?.role === "admin" ? ` · ${c.account.role}: admin` : ""}
          </p>
        </div>
        <SignOutButton locale={locale} label={d.nav.logout} className="btn btn-ink text-xs" />
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-sky">{c.account.myDecks}</h2>
          <Link href={href(locale, "/deck-builder")} className="btn btn-mint text-xs">
            {d.nav.builder} →
          </Link>
        </div>
        {decks.length === 0 ? (
          <div className="card-night mt-4 p-6">
            <p className="text-pale-muted">{c.account.noDecks}</p>
            <p className="mt-3">
              <Link href={href(locale, "/deck-builder")} className="btn btn-ink text-xs">
                {c.account.noDecksCta}
              </Link>
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {decks.map((deck) => {
              const leg = deck.legendary ? getCard(deck.legendary) : undefined;
              const legName = leg?.name ?? deck.custom_cards.find((x) => x.slug === deck.legendary)?.name ?? deck.legendary ?? "—";
              const viewHref = href(locale, `/decks/community/${deck.slug}`);
              return (
                <li key={deck.id} className="card-night flex flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`stat-pill text-[11px] font-semibold uppercase ${deck.status === "published" ? "bg-mint-deep text-chalk" : "bg-chalk/10 text-pale"}`}>{c.status[deck.status]}</span>
                    <span className="stat-pill border border-sky text-pale">{archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}</span>
                    <span className="stat-pill bg-gold/50 text-pale">★ {legName}</span>
                  </div>
                  <p className="mt-3 font-display text-xl font-extrabold leading-tight text-sky">{deck.name}</p>
                  <p className="mt-1 font-mono text-xs text-pale-muted">
                    {deck.rating?.votes ? `★ ${deck.rating.avg.toFixed(1)} · ${deck.rating.votes} ${deck.rating.votes === 1 ? c.vote : c.votes}` : c.noVotes} · {d.common.updated} {formatDate(locale, deck.updated_at.slice(0, 10))}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sky pt-3">
                    {deck.status === "published" ? (
                      <Link href={viewHref} className="btn btn-ink text-xs">
                        {c.account.view}
                      </Link>
                    ) : null}
                    <Link href={`${viewHref}/edit`} className="btn border border-sky text-xs text-pale">
                      {c.edit}
                    </Link>
                    <form action={setDeckStatus}>
                      <input type="hidden" name="id" value={deck.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="status" value={deck.status === "published" ? "hidden" : "published"} />
                      <button type="submit" className="btn border border-sky text-xs text-pale">
                        {deck.status === "published" ? c.hide : c.unhide}
                      </button>
                    </form>
                    <form action={deleteDeck}>
                      <input type="hidden" name="id" value={deck.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <button type="submit" className="btn border border-crimson/40 text-xs text-crimson hover:bg-crimson hover:text-chalk">
                        {c.delete}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Tournament Organizer: tornei organizzati e giocati */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-sky">{x.account.title}</h2>
          <Link href={href(locale, "/tournaments/new")} className="btn btn-mint text-xs">
            {x.account.newCta} →
          </Link>
        </div>
        {tournaments.organized.length === 0 && tournaments.playing.length === 0 ? (
          <div className="card-night mt-4 p-6">
            <p className="text-pale-muted">{x.account.none}</p>
          </div>
        ) : (
          <>
            {tournaments.organized.length ? (
              <>
                <h3 className="mt-5 kicker text-pale-muted">{x.account.organized}</h3>
                <ul className="mt-3 grid gap-4 md:grid-cols-2">
                  {tournaments.organized.map((t) => (
                    <li key={t.id} className="flex flex-col gap-2">
                      <TournamentCard t={t} locale={locale} dict={d} compact />
                      {t.status === "open" ? (
                        <form action={deleteTournament} className="self-end">
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <ConfirmButton label={x.account.delete} confirm={x.account.confirmDelete} className="btn border border-crimson/40 text-xs text-crimson hover:bg-crimson hover:text-chalk" />
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {tournaments.playing.length ? (
              <>
                <h3 className="mt-6 kicker text-pale-muted">{x.account.playing}</h3>
                <ul className="mt-3 grid gap-4 md:grid-cols-2">
                  {tournaments.playing.map((t) => (
                    <li key={t.id}>
                      <TournamentCard t={t} locale={locale} dict={d} compact />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
