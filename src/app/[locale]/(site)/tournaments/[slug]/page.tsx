import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, href, siteUrl, type Dictionary } from "@/lib/i18n";
import { pageMeta, pageTitleWith, resolveLocale } from "@/lib/page";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { getInviteCode, getTournament, listListedTournaments, listMatches, listPlayers, listVisibleDecks } from "@/lib/tournament/queries";
import { roundLabel } from "@/lib/tournament/bracket";
import { bestOfLabel, fill, tournamentInviteLink, tournamentShortLink, type TournamentMatch, type TournamentPlayer } from "@/lib/tournament/types";
import { Bracket } from "@/components/Bracket";
import { authorHandle, authorName } from "@/lib/community/util";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { decodeOmCode } from "@/lib/deckcode";
import { getCard } from "@/lib/data/cards";
import { Avatar } from "@/components/AccountMenu";
import { CopyButton } from "@/components/CopyButton";
import { DiscordButton } from "@/components/DiscordButton";
import { JoinTournament } from "@/components/JoinTournament";
import { LocalTime } from "@/components/LocalTime";
import { TournamentCard } from "@/components/TournamentCard";
import { CardMentions } from "@/components/CardMentions";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { CardChip } from "@/components/CardChip";
import { JsonLd, breadcrumbs, videoGameId } from "@/components/JsonLd";

type Params = Promise<{ locale: string; slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

/**
 * Scheda del torneo, renderizzata sul server a ogni richiesta con la sessione di chi guarda: le policy RLS
 * mostrano i tornei privati solo a organizzatore, admin, iscritti e invitati (per gli altri: 404). I tornei
 * pubblici restano indicizzabili; quelli privati sono noindex.
 *
 * In cima (21/09/2026): dopo la creazione (?new=1, solo per l'organizzatore) il pannello "Torneo creato" con il
 * link da incollare su Discord e un messaggio pronto (UX-9); a torneo in corso, per chi gioca ed è ancora in
 * gara, il banner "Il tabellone è partito" con il link alla sua partita (UX-8). Il link breve /t/<tag> è sempre
 * visibile in chiaro con il tasto Copia.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const t = await getTournament(slug, await supabaseServer());
  if (!t) return {};
  const meta = pageMeta(locale, `/tournaments/${t.slug}`, pageTitleWith(t.name, dict.tournaments.kicker), t.description || dict.tournaments.sectionIntro, t.cover_url ?? undefined);
  return t.visibility === "private" ? { ...meta, robots: { index: false, follow: false } } : meta;
}

function PlayerRow({ p, dict }: { p: TournamentPlayer; dict: Awaited<ReturnType<typeof resolveLocale>>["dict"] }) {
  const name = authorName(p.profile);
  const badge = p.profile?.badge && p.profile.badge !== "community" ? p.profile.badge : null;
  return (
    <li className="flex items-center gap-2 rounded-lg border border-sky bg-night-2/60 px-3 py-2 text-sm">
      <Avatar profile={p.profile} name={name} size={24} />
      <span className={`min-w-0 truncate ${p.status === "registered" ? "text-pale" : "text-pale-muted line-through"}`}>{name}</span>
      {badge ? <span className={`${badgePill} ${badgeStyle[badge] ?? badgeStyle.community} !px-2 !py-0.5 !text-[10px]`}>{dict.community.badges[badge as keyof typeof dict.community.badges] ?? badge}</span> : null}
      {p.decks_submitted ? <span className="ml-auto font-mono text-[11px] text-good">✓</span> : null}
    </li>
  );
}

/** Nome del turno ("Semifinali", "Turno dei 16"…) dalla dimensione del tabellone; se i dati sono strani, "Turno N". */
function roundName(x: Dictionary["tournaments"], round: number, matches: TournamentMatch[]): string {
  const size = matches.filter((m) => m.round === 1).length * 2;
  try {
    const l = roundLabel(round, size);
    return typeof l === "string" ? x.rounds[l] : fill(x.rounds.of, { n: l.of });
  } catch {
    return fill(x.match.round, { n: round });
  }
}

export default async function TournamentPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { locale, dict: d } = await resolveLocale(params);
  const x = d.tournaments;
  const { supabase: client, user } = await currentUser();
  if (!client) notFound();
  const t = await getTournament(slug, client);
  if (!t) notFound();

  const [players, matches, others, decks, inviteCode] = await Promise.all([
    listPlayers(t.id, client),
    listMatches(t.id, client),
    listListedTournaments(30),
    t.status === "finished" ? listVisibleDecks(t.id, client) : Promise.resolve([]),
    // il codice del link d'invito lo leggono solo organizzatore e admin (policy): per gli altri è null
    getInviteCode(client, t.id),
  ]);
  const inviteLink = inviteCode ? tournamentInviteLink(siteUrl, t.tag, inviteCode) : null;
  const active = players.filter((p) => p.status === "registered");
  const registeredIds = active.map((p) => p.user_id);
  const submittedIds = active.filter((p) => p.decks_submitted).map((p) => p.user_id);
  const nameOf = new Map(players.map((p) => [p.user_id, authorName(p.profile)]));
  const organizer = authorName(t.profile);
  const handle = authorHandle(t.profile);
  const badge = t.profile?.badge && t.profile.badge !== "community" ? t.profile.badge : null;
  const path = href(locale, `/tournaments/${t.slug}`);
  const pageUrl = `${siteUrl}${path}`;
  const shortLink = tournamentShortLink(siteUrl, t.tag);
  const viewer = user?.id ?? null;

  // Banner "il tabellone è partito" (UX-8): la partita del turno più alto di chi guarda, se è ancora da giocare.
  // Chi ha perso (ultima partita confermata) o ha vinto la finale non vede il banner.
  const myMatch = viewer && t.status === "running" && registeredIds.includes(viewer) ? [...matches].filter((m) => m.player_a === viewer || m.player_b === viewer).sort((a, b) => b.round - a.round)[0] : undefined;
  const liveMatch = myMatch && (myMatch.status === "pending" || myMatch.status === "reported" || myMatch.status === "disputed") ? myMatch : undefined;
  const liveOpponent = liveMatch ? (liveMatch.player_a === viewer ? liveMatch.player_b : liveMatch.player_a) : null;

  // Pannello "Torneo creato" (UX-9): solo per l'organizzatore appena arrivato dalla creazione. Per un torneo
  // privato il link da condividere è quello d'invito (il link breve porterebbe a un 404 chi non è invitato).
  const cp = x.createdPanel;
  const shareLink = t.visibility === "private" ? inviteLink : shortLink;
  const justCreated = sp.new === "1" && viewer !== null && viewer === t.organizer && Boolean(shareLink);
  let readyMessage = "";
  if (justCreated && shareLink) {
    // messaggio nella lingua dei testi del torneo; la data nel formato <t:…:F> di Discord, che ogni lettore vede nel suo fuso
    const td = getDictionary(t.lang).tournaments;
    const unix = Math.floor(new Date(t.starts_at).getTime() / 1000);
    readyMessage = fill(td.createdPanel.message, {
      name: t.name,
      format: `${td.formats[t.format]} · ${td.deckModes[t.deck_mode]} · ${bestOfLabel(td, t.best_of)}`,
      slots: t.size,
      date: `<t:${unix}:F>`,
      link: shareLink,
    });
  }

  // Dati strutturati (Ondata 2, GEO-09): un Event solo per i tornei pubblici (i privati sono noindex e visibili solo a
  // chi è invitato). L'`@id` è legato al link breve /t/<tag>, uguale in ogni lingua; l'organizzatore è la persona che
  // l'ha creato, con la sua pagina pubblica quando ha un nome utente; iscriversi è gratis, qui sulla scheda.
  const organizerUrl = t.profile?.username ? `${siteUrl}${href(locale, `/u/${t.profile.username}`)}` : undefined;
  const event: Record<string, unknown> | null =
    t.visibility === "public"
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          "@id": `${shortLink}#event`,
          name: t.name,
          description: (t.description || x.sectionIntro).slice(0, 300),
          startDate: t.starts_at,
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          eventStatus: t.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
          location: { "@type": "VirtualLocation", url: pageUrl },
          organizer: organizerUrl ? { "@type": "Person", name: organizer, url: organizerUrl } : { "@type": "Person", name: organizer },
          url: pageUrl,
          inLanguage: t.lang,
          image: t.cover_url ? (t.cover_url.startsWith("/") ? `${siteUrl}${t.cover_url}` : t.cover_url) : `${siteUrl}/media/og.jpg`,
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", url: pageUrl },
          maximumAttendeeCapacity: t.size,
          about: { "@id": videoGameId },
        }
      : null;
  const crumbs = breadcrumbs([{ name: "OriginsMeta", path: href(locale) }, { name: d.events.title, path: href(locale, "/tournaments") }, { name: t.name, path }]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd data={event ? [event, crumbs] : [crumbs]} />
      <p className="text-sm">
        <Link href={href(locale, "/tournaments")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.events.title}
        </Link>
      </p>

      {justCreated && shareLink ? (
        <section className="card-night mt-6 p-5 sm:p-6" aria-label={cp.kicker}>
          <p className="kicker text-mint">✓ {cp.kicker}</p>
          {/* titolo come paragrafo: l'H1 della pagina è il nome del torneo, più sotto */}
          <p className="t-section mt-1">{cp.title}</p>
          <p className="mt-2 max-w-3xl text-sm text-pale-muted">{t.visibility === "private" ? cp.introPrivate : cp.intro}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="max-w-full break-all rounded-lg border-2 border-sky bg-night px-3 py-2 font-mono text-sm text-chalk">{shareLink}</code>
            <CopyButton text={shareLink} label={cp.copyLink} copied={x.copied} className="btn btn-primary text-xs" />
          </div>
          <label className="mt-5 block">
            <span className="kicker text-mint">{cp.messageLabel}</span>
            <textarea readOnly defaultValue={readyMessage} rows={5} className="mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 font-mono text-xs text-pale" />
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <CopyButton text={readyMessage} label={cp.copyMessage} copied={x.copied} className="btn btn-ink text-xs" />
            <span className="text-xs text-pale-muted">{cp.dateHint}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-sky/40 pt-4 text-sm">
            <Link href={`${path}/manage`} className="link-mint font-semibold">
              {x.manageCta} →
            </Link>
            <Link href={path} className="text-chalk-muted hover:text-chalk">
              {cp.close}
            </Link>
          </div>
        </section>
      ) : null}

      {liveMatch ? (
        <section className="card-night mt-6 flex flex-wrap items-center justify-between gap-4 p-5" aria-label={x.statuses.running}>
          <div className="min-w-0">
            <p className="kicker text-mint">
              {x.statuses.running} · {roundName(x, liveMatch.round, matches)}
            </p>
            <p className="mt-1 font-display text-lg font-extrabold text-chalk">{liveOpponent ? x.liveBanner.title : x.liveBanner.titleWaiting}</p>
            {liveOpponent ? <p className="mt-1 text-sm text-pale">{fill(x.liveBanner.detail, { name: nameOf.get(liveOpponent) ?? "?" })}</p> : null}
          </div>
          <Link href={`${path}/match/${liveMatch.id}`} className="btn btn-primary">
            {x.liveBanner.cta}
          </Link>
        </section>
      ) : null}

      <article className="card-night mt-6 overflow-hidden">
        <div className="relative aspect-[16/6] w-full bg-night-2">
          {t.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.cover_url} alt="" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="stat-pill bg-night-3 text-[11px] font-semibold uppercase text-pale">{x.statuses[t.status]}</span>
            {t.visibility === "private" ? <span className="stat-pill bg-gold text-[11px] font-bold uppercase text-ink">{x.privatePill}</span> : null}
          </div>
          <span className="stat-pill absolute right-4 top-4 bg-mint text-sm font-bold text-ink">{t.tag}</span>
        </div>

        <div className="p-6 sm:p-8">
          <p className="kicker text-mint">{x.kicker}</p>
          <h1 className="t-page mt-2">{t.name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-pale-muted">
            <Avatar profile={t.profile} name={organizer} size={32} />
            <span>
              {x.organizedBy} <strong className="text-pale">{organizer}</strong>
              {handle ? <span className="font-mono text-xs"> {handle}</span> : null}
            </span>
            {badge ? <span className={`${badgePill} ${badgeStyle[badge] ?? badgeStyle.community}`}>{d.community.badges[badge as keyof typeof d.community.badges] ?? badge}</span> : null}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="stat-pill border-2 border-sky text-pale">
              {x.startsAt}: <LocalTime iso={t.starts_at} locale={locale} utcLabel={x.utc} />
            </span>
            <span className="stat-pill bg-night-3 text-pale">{x.formats[t.format]}</span>
            <span className="stat-pill bg-night-3 text-pale">{x.deckModes[t.deck_mode]}</span>
            <span className="stat-pill bg-night-3 text-pale">{bestOfLabel(x, t.best_of)}</span>
            <span className="stat-pill border-2 border-sky font-mono text-pale">
              {active.length} {x.of} {t.size} {x.players}
            </span>
          </div>
          {t.deck_mode === "conquest" ? <p className="mt-2 text-sm text-pale-muted">{fill(x.conquestRule, { n: t.conquest_decks, min: t.conquest_min_different })}</p> : null}

          {/* Link breve sempre in chiaro (UX-9): è quello da incollare su Discord */}
          <div className="mt-5 rounded-lg border-2 border-sky bg-night-2/70 p-3">
            <p className="kicker text-mint">{x.shortLinkLabel}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="max-w-full break-all rounded bg-night px-2 py-1 font-mono text-sm text-chalk">{shortLink}</code>
              <CopyButton text={shortLink} label={x.copyLink} copied={x.copied} className="btn btn-ink text-xs" />
              <CopyButton text={t.tag} label={`${x.copyTag} ${t.tag}`} copied={x.copied} className="btn btn-ghost text-xs" />
            </div>
            <p className="mt-2 text-xs text-pale-muted">{x.shortLinkHint}</p>
          </div>
          {t.discord_url ? (
            <div className="mt-3">
              <DiscordButton href={t.discord_url} size="sm">
                {x.discord}
              </DiscordButton>
            </div>
          ) : null}
          {t.visibility === "private" ? (
            <div className="mt-3 rounded-lg border-2 border-gold bg-gold/10 p-3 text-sm text-pale">
              <p className="font-semibold text-gold">{x.privatePill}</p>
              <p className="mt-1 text-xs text-pale-muted">{x.privateHint}</p>
              {inviteLink ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="max-w-full break-all rounded bg-night px-2 py-1 font-mono text-xs text-pale">{inviteLink}</code>
                  <CopyButton text={inviteLink} label={x.manage.copyInvite} copied={x.copied} className="btn btn-gold text-xs" />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 rounded-xl border-2 border-sky bg-night-2/80 p-5">
            <JoinTournament
              id={t.id}
              slug={t.slug}
              status={t.status}
              players={active.length}
              size={t.size}
              registeredIds={registeredIds}
              submittedIds={submittedIds}
              organizerId={t.organizer}
              viewerId={viewer}
              loginHref={`${href(locale, "/login")}?next=${encodeURIComponent(path)}`}
              deckHref={`${path}/deck`}
              manageHref={`${path}/manage`}
              matches={matches.map((m) => ({ id: m.id, round: m.round, a: m.player_a, b: m.player_b }))}
              matchHrefBase={`${path}/match/`}
              labels={x}
            />
          </div>

          {t.description ? (
            <section className="mt-8">
              <h2 className="kicker text-mint">{x.about}</h2>
              <p className="mt-2 whitespace-pre-line text-pale">
                <CardMentions text={t.description} locale={locale} dict={d} id="tm-about" />
              </p>
            </section>
          ) : null}
          {t.rules ? (
            <section className="mt-6">
              <h2 className="kicker text-mint">{x.rules}</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-pale">
                <CardMentions text={t.rules} locale={locale} dict={d} id="tm-rules" />
              </p>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="t-section">
              {x.registered} <span className="font-mono text-sm font-normal text-pale-muted">{active.length}/{t.size}</span>
            </h2>
            {players.length ? (
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((p) => (
                  <PlayerRow key={p.user_id} p={p} dict={d} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-pale-muted">{x.noPlayers}</p>
            )}
          </section>

          {/* ancora #bracket: la usano i messaggi Discord del tabellone (src/lib/tournament/notify.ts) */}
          <section id="bracket" className="mt-8 scroll-mt-24">
            <h2 className="t-section">{x.bracket}</h2>
            {t.status === "open" || !matches.length ? (
              <p className="mt-2 text-sm text-pale-muted">{x.bracketSoon}</p>
            ) : (
              <div className="mt-3">
                {/* le partite sono link alla stanza: le proprie per chi gioca, tutte per organizzatore e admin (chi legge il codice d'invito) */}
                <Bracket matches={matches} names={nameOf} dict={d} open={{ linkBase: `${path}/match/`, viewer, all: Boolean(inviteCode) }} />
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="t-section">{x.decklists}</h2>
            {decks.length ? (
              <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {decks.map((row) => (
                  <li key={row.user_id} className="rounded-lg border-2 border-sky bg-night-2/70 p-3">
                    <p className="t-item text-base">{nameOf.get(row.user_id) ?? "?"}</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {row.codes.map((code, i) => {
                        const deck = decodeOmCode(code);
                        const leg = deck?.legendary ? getCard(deck.legendary) : undefined;
                        return (
                          <li key={i} className="flex flex-wrap items-center gap-2">
                            {leg ? <CardChip slug={leg.slug} locale={locale} /> : null}
                            <Link href={`${href(locale, "/deck-builder")}#${code}`} className="btn btn-ink text-xs">
                              {d.community.openInBuilder}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-pale-muted">{x.decklistsHidden}</p>
            )}
          </section>

          {t.report ? (
            <section className="mt-8 rounded-xl border-2 border-gold bg-gold/10 p-5">
              <h2 className="kicker text-gold">{x.report}</h2>
              <p className="mt-2 whitespace-pre-line text-pale">
                <CardMentions text={t.report} locale={locale} dict={d} id="tm-report" />
              </p>
            </section>
          ) : null}
          <CardMentionEdges />
        </div>
      </article>

      {others.filter((o) => o.id !== t.id).length ? (
        <section className="mt-10">
          <h2 className="t-section">{x.others}</h2>
          <ul className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {others
              .filter((o) => o.id !== t.id)
              .slice(0, 6)
              .map((o) => (
                <li key={o.id}>
                  <TournamentCard t={o} locale={locale} dict={d} compact />
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
