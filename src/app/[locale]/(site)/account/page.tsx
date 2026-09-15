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
import { Avatar, SignOutButton } from "@/components/AccountMenu";

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
        <p className="card-ivory p-6 text-ink-muted">{c.account.disabled}</p>
      </div>
    );
  }
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, "/account"))}`);

  const { data: profileRow } = await supabase.from("profiles").select("username, display_name, avatar_url, role, created_at").eq("id", user.id).maybeSingle();
  const profile = (profileRow as (Profile & { role: string; created_at: string }) | null) ?? null;
  const name = profile?.display_name || profile?.username || user.email?.split("@")[0] || "player";
  const decks = await listUserDecks(supabase, user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.account}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-chalk sm:text-5xl">{c.account.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{c.account.intro}</p>

      <section className="card-ivory mt-8 flex flex-wrap items-center gap-4 p-6">
        <Avatar profile={profile} name={name} size={56} />
        <div className="min-w-0 flex-1">
          <p className="kicker text-ink-muted">{c.account.signedInAs}</p>
          <p className="font-display text-2xl font-extrabold text-ink">{name}</p>
          <p className="font-mono text-xs text-ink-muted">
            {profile?.username ? `@${profile.username} · ` : ""}
            {user.email}
            {profile?.role === "admin" ? ` · ${c.account.role}: admin` : ""}
          </p>
        </div>
        <SignOutButton locale={locale} label={d.nav.logout} className="btn btn-ink text-xs" />
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-chalk">{c.account.myDecks}</h2>
          <Link href={href(locale, "/deck-builder")} className="btn btn-mint text-xs">
            {d.nav.builder} →
          </Link>
        </div>
        {decks.length === 0 ? (
          <div className="card-ivory mt-4 p-6">
            <p className="text-ink-muted">{c.account.noDecks}</p>
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
                <li key={deck.id} className="card-ivory flex flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`stat-pill text-[11px] font-semibold uppercase ${deck.status === "published" ? "bg-mint-deep text-ivory" : "bg-ink/10 text-ink"}`}>{c.status[deck.status]}</span>
                    <span className="stat-pill border border-ink/20 text-ink">{archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}</span>
                    <span className="stat-pill bg-gold/50 text-ink">★ {legName}</span>
                  </div>
                  <p className="mt-3 font-display text-xl font-extrabold leading-tight text-ink">{deck.name}</p>
                  <p className="mt-1 font-mono text-xs text-ink-muted">
                    {deck.rating?.votes ? `★ ${deck.rating.avg.toFixed(1)} · ${deck.rating.votes} ${deck.rating.votes === 1 ? c.vote : c.votes}` : c.noVotes} · {d.common.updated} {formatDate(locale, deck.updated_at.slice(0, 10))}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
                    {deck.status === "published" ? (
                      <Link href={viewHref} className="btn btn-ink text-xs">
                        {c.account.view}
                      </Link>
                    ) : null}
                    <Link href={`${viewHref}/edit`} className="btn border border-ink/30 text-xs text-ink">
                      {c.edit}
                    </Link>
                    <form action={setDeckStatus}>
                      <input type="hidden" name="id" value={deck.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="status" value={deck.status === "published" ? "hidden" : "published"} />
                      <button type="submit" className="btn border border-ink/30 text-xs text-ink">
                        {deck.status === "published" ? c.hide : c.unhide}
                      </button>
                    </form>
                    <form action={deleteDeck}>
                      <input type="hidden" name="id" value={deck.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <button type="submit" className="btn border border-crimson/40 text-xs text-crimson-deep hover:bg-crimson hover:text-ivory">
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
    </div>
  );
}
