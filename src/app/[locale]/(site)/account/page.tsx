import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { getCard } from "@/lib/data/cards";
import { encodeOmCode } from "@/lib/deckcode";
import { currentUser } from "@/lib/supabase/server";
import { listUserDecks, publishedDeckLimit } from "@/lib/community/queries";
import { countEntries, listUserTierLists } from "@/lib/community/tierlists";
import { deleteTierList, setTierListStatus } from "@/lib/community/tierActions";
import { deleteDeck, setDeckStatus } from "@/lib/community/actions";
import type { CommunityDeck, Profile } from "@/lib/community/types";
import { listUserTournaments } from "@/lib/tournament/queries";
import { deleteTournament } from "@/lib/tournament/actions";
import { Avatar, SignOutButton } from "@/components/AccountMenu";
import { TournamentCard } from "@/components/TournamentCard";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

/** Bottone "Elimina": .btn-danger del design system (rosso "bad", 5,2:1 sul blu notte; cornice da 2 px come gli altri). */
const deleteBtn = "btn btn-danger text-xs";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, "/account", dict.community.account.title, dict.community.account.intro), robots: { index: false, follow: false } };
}

/** Nome della Leggendaria del mazzo, anche quando è una carta fuori dal nostro database. */
function legendaryName(deck: CommunityDeck): string {
  const leg = deck.legendary ? getCard(deck.legendary) : undefined;
  return leg?.name ?? deck.custom_cards.find((x) => x.slug === deck.legendary)?.name ?? deck.legendary ?? "—";
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
  const [allDecks, tournaments, tierLists, deckLimit] = await Promise.all([
    listUserDecks(supabase, user.id),
    listUserTournaments(supabase, user.id),
    listUserTierLists(supabase, user.id),
    publishedDeckLimit(supabase, user.id),
  ]);
  // I mazzi privati ("Salva privato" del deck builder, stato 'draft') hanno la loro sezione: niente voti né scheda pubblica.
  const decks = allDecks.filter((deck) => deck.status !== "draft");
  const drafts = allDecks.filter((deck) => deck.status === "draft");
  const x = d.tournaments;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.account}</p>
      <h1 className="t-page mt-2">{c.account.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{c.account.intro}</p>

      <section className="card-night mt-8 flex flex-wrap items-center gap-4 p-6">
        <Avatar profile={profile} name={name} size={56} />
        <div className="min-w-0 flex-1">
          <p className="kicker text-pale-muted">{c.account.signedInAs}</p>
          <p className="t-item">{name}</p>
          <p className="break-all font-mono text-xs text-pale-muted">
            {profile?.username ? `@${profile.username} · ` : ""}
            {user.email}
            {profile?.role === "admin" ? ` · ${c.account.role}: admin` : ""}
          </p>
        </div>
        {/* La pagina pubblica dell'iscritto (23/09/2026): questo pannello resta privato, quella si può mandare in giro. */}
        <div className="flex flex-wrap items-center gap-2">
          {profile?.username ? (
            <Link href={href(locale, `/u/${profile.username}`)} className="btn btn-ink text-xs">
              {c.account.publicPage}
            </Link>
          ) : null}
          <SignOutButton locale={locale} label={d.nav.logout} className="btn btn-ink text-xs" />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="t-section">{c.account.myDecks}</h2>
          <Link href={href(locale, "/deck-builder")} className="btn btn-primary text-xs">
            {d.nav.builder} →
          </Link>
        </div>
        {/* Quanti mazzi pubblicati si possono avere (Pierluigi, 23/09/2026): 5 per un account della community,
            senza tetto per Influencer, Pro e Staff. Scritto qui, non solo nell'errore al momento di pubblicare. */}
        <p className="mt-2 font-mono text-xs text-pale-muted">
          {Number.isFinite(deckLimit.cap)
            ? c.account.deckQuota.replace("{used}", String(deckLimit.used)).replace("{cap}", String(deckLimit.cap))
            : c.account.deckQuotaUnlimited.replace("{used}", String(deckLimit.used))}
        </p>
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
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {decks.map((deck) => {
              const viewHref = href(locale, `/decks/community/${deck.slug}`);
              return (
                <li key={deck.id} className="card-night flex flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`stat-pill text-[11px] font-semibold uppercase ${deck.status === "published" ? "bg-mint text-ink" : "bg-night-3 text-pale"}`}>{c.status[deck.status]}</span>
                    <span className="stat-pill bg-sky text-ink">{archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}</span>
                    <span className="stat-pill bg-gold text-ink">★ {legendaryName(deck)}</span>
                  </div>
                  <p className="t-item mt-3 leading-tight">{deck.name}</p>
                  <p className="mt-1 font-mono text-xs text-pale-muted">
                    {deck.rating?.votes ? `★ ${deck.rating.avg.toFixed(1)} · ${deck.rating.votes} ${deck.rating.votes === 1 ? c.vote : c.votes}` : c.noVotes} · {d.common.updated} {formatDate(locale, deck.updated_at.slice(0, 10))}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {deck.status === "published" ? (
                      <Link href={viewHref} className="btn btn-ink text-xs">
                        {c.account.view}
                      </Link>
                    ) : null}
                    <Link href={`${viewHref}/edit`} className="btn btn-ink text-xs">
                      {c.edit}
                    </Link>
                    <form action={setDeckStatus}>
                      <input type="hidden" name="id" value={deck.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="status" value={deck.status === "published" ? "hidden" : "published"} />
                      <button type="submit" className="btn btn-ink text-xs">
                        {deck.status === "published" ? c.hide : c.unhide}
                      </button>
                    </form>
                    {/* prima era un clic secco: ora chiede conferma, come i tornei */}
                    <form action={deleteDeck}>
                      <input type="hidden" name="id" value={deck.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <ConfirmButton label={c.delete} confirm={c.confirmDelete} className={deleteBtn} />
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Mazzi privati: "Salva privato" del deck builder (21/09/2026). Il salvataggio porta qui (#private). */}
      <section id="private" className="mt-12 scroll-mt-24">
        <h2 className="t-section">{c.account.privateTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{c.account.privateIntro}</p>
        {drafts.length === 0 ? (
          <div className="card-night mt-4 p-6">
            <p className="text-pale-muted">{c.account.noPrivate}</p>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {drafts.map((deck) => {
              const code = deck.code_om ?? encodeOmCode({ name: deck.name, legendary: deck.legendary, cards: deck.cards, customCards: deck.custom_cards });
              return (
                <li key={deck.id} className="card-night flex flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="stat-pill bg-night-3 text-[11px] font-semibold uppercase text-pale">{c.account.privateBadge}</span>
                    <span className="stat-pill bg-gold text-ink">★ {legendaryName(deck)}</span>
                  </div>
                  <p className="t-item mt-3 leading-tight">{deck.name}</p>
                  <p className="mt-1 font-mono text-xs text-pale-muted">
                    {d.common.updated} {formatDate(locale, deck.updated_at.slice(0, 10))}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {/* navigazione completa: il modulo di pubblicazione e il builder leggono il mazzo dall'indirizzo */}
                    <a href={`${href(locale, "/decks/publish")}?deck=${encodeURIComponent(code)}&draft=${deck.id}`} className="btn btn-primary text-xs">
                      {c.account.publish}
                    </a>
                    {/* ?draft: "Salva privato" nel builder aggiorna questo mazzo invece di crearne un altro */}
                    <a href={`${href(locale, "/deck-builder")}?draft=${deck.id}#${code}`} className="btn btn-ink text-xs">
                      {c.openInBuilder}
                    </a>
                    <form action={deleteDeck}>
                      <input type="hidden" name="id" value={deck.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="back" value="private" />
                      <ConfirmButton label={c.delete} confirm={c.account.confirmDeletePrivate} className={deleteBtn} />
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/*
        Le mie tier list (23/09/2026, §1 punto 27.5 della KB: "mazzi e tier list create visibili nel profilo di chi
        le ha create"). Una per scheda: salvarne un'altra dallo strumento sostituisce questa. Le pubblicate contano
        nella tier list della community; nascoste, restano solo qui.
      */}
      <section id="tierlists" className="mt-12 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="t-section">{c.account.myTierLists}</h2>
          <Link href={href(locale, "/tier-list/create")} className="btn btn-primary text-xs">
            {c.account.newTierList} →
          </Link>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{c.account.tierListsIntro}</p>
        {tierLists.length === 0 ? (
          <div className="card-night mt-4 p-6">
            <p className="text-pale-muted">{c.account.noTierLists}</p>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {tierLists.map((tl) => (
              <li key={tl.id} className="card-night flex flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="stat-pill bg-sky text-[11px] font-semibold uppercase text-ink">
                    {tl.kind === "legendaries" ? d.tierMaker.tabLegendaries : d.tierMaker.tabCards}
                  </span>
                  {tl.status === "hidden" ? <span className="stat-pill bg-night-3 text-[11px] font-semibold uppercase text-pale">{c.status.hidden}</span> : null}
                </div>
                <p className="t-item mt-3 leading-tight">{tl.title || d.tierMaker.h1}</p>
                <p className="mt-1 font-mono text-xs text-pale-muted">
                  {countEntries(tl.entries)} {c.account.rankedCards} · {d.common.updated} {formatDate(locale, tl.updated_at.slice(0, 10))}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {/* il codice TL1 nell'hash riapre esattamente questa lista nello strumento */}
                  <a href={`${href(locale, "/tier-list/create")}#${tl.code}`} className="btn btn-primary text-xs">
                    {c.account.openTierList}
                  </a>
                  <form action={setTierListStatus}>
                    <input type="hidden" name="id" value={tl.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="status" value={tl.status === "hidden" ? "published" : "hidden"} />
                    <button type="submit" className="btn btn-ink text-xs">
                      {tl.status === "hidden" ? c.unhide : c.hide}
                    </button>
                  </form>
                  <form action={deleteTierList}>
                    <input type="hidden" name="id" value={tl.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <ConfirmButton label={c.delete} confirm={c.account.confirmDeleteTierList} className={deleteBtn} />
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tournament Organizer: tornei organizzati e giocati */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="t-section">{x.account.title}</h2>
          <Link href={href(locale, "/tournaments/new")} className="btn btn-primary text-xs">
            {x.account.newCta} →
          </Link>
        </div>
        {tournaments.invited.length ? (
          <>
            <h3 className="mt-5 kicker text-gold">{x.account.invited}</h3>
            <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              {tournaments.invited.map((t) => (
                <li key={t.id}>
                  <TournamentCard t={t} locale={locale} dict={d} compact />
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {tournaments.organized.length === 0 && tournaments.playing.length === 0 && tournaments.invited.length === 0 ? (
          <div className="card-night mt-4 p-6">
            <p className="text-pale-muted">{x.account.none}</p>
          </div>
        ) : (
          <>
            {tournaments.organized.length ? (
              <>
                <h3 className="mt-5 kicker text-pale-muted">{x.account.organized}</h3>
                <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {tournaments.organized.map((t) => (
                    <li key={t.id} className="flex flex-col gap-2">
                      <TournamentCard t={t} locale={locale} dict={d} compact />
                      {t.status === "open" ? (
                        <form action={deleteTournament} className="self-end">
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <ConfirmButton label={x.account.delete} confirm={x.account.confirmDelete} className={deleteBtn} />
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
                <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
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
