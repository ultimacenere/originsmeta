import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href, type Locale } from "@/lib/i18n";
import { cleanDescription, pageTitle, resolveLocale, type LocaleParams } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { fillTracker, trackerLabels } from "@/lib/trackerLabels";
import { analyticsInstallHref } from "@/lib/analyticsLabels";
import { analyticsAccess } from "@/lib/community/analyticsAccess";
import { readOwnMatches, readTrackerDevices } from "@/lib/community/trackerQueries";
import { forgetTrackerMatches, revokeTrackerDevice } from "@/lib/community/trackerActions";
import { personalStats, recentMatches, type OwnMatch, type Record3 } from "@/lib/tracker/personal";
import { percent } from "@/lib/tracker/stats";
import { getCardByKey, patchLabel, patchOrder, type PatchId } from "@/lib/data/cards";
import { CardName } from "@/components/CardChip";
import { ConfirmButton } from "@/components/ConfirmButton";
import { TrackerCodeBox } from "@/components/tracker/TrackerCodeBox";
import { TrackerTime } from "@/components/tracker/TrackerTime";

/**
 * OriginsMeta Tracker sul sito (tracker/overlay, Fase 3, 30/09/2026; docs/tracker.md): pagina privata, dinamica,
 * noindex, fuori da sitemap e hreflang. Codice per collegare l'app, PC collegati (scollega), statistiche personali delle
 * partite arrivate dall'app, cancellazione di tutte le partite. Chi non ha fatto l'accesso va alla pagina di accesso e
 * poi torna qui. Regole del tracker: niente bot o persone, niente rank dell'avversario, niente coda partita per partita.
 */
export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = trackerLabels[locale].meta;
  return { title: { absolute: pageTitle(L.title) }, description: cleanDescription(L.description), robots: { index: false, follow: false } };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const isPatch = (p: string | null): p is PatchId => p !== null && (patchOrder as readonly string[]).includes(p);

function Legendary({ cardKey, locale, legendaryLabel }: { cardKey: string | null; locale: Locale; legendaryLabel: string }) {
  const card = cardKey ? getCardByKey(cardKey) : undefined;
  if (!card) return <span className="text-pale-muted">{cardKey ?? "—"}</span>;
  return (
    <Link href={href(locale, `/cards/${card.slug}`)} prefetch={false} className="link-mint font-semibold">
      <CardName name={card.name} legendary={card.legendary} legendaryLabel={legendaryLabel} />
    </Link>
  );
}

function WinRate({ r }: { r: Record3 }) {
  const p = percent(r.wins, r.games);
  return (
    <span className="flex items-center gap-2">
      <span className="block h-2 rounded-r bg-mint" style={{ width: `${Math.max(p ?? 0, 2)}px` }} aria-hidden="true" />
      <span className="font-mono text-xs text-pale">{p === null ? "—" : `${p}%`}</span>
    </span>
  );
}

export default async function TrackerAccountPage({ params, searchParams }: { params: LocaleParams; searchParams: Search }) {
  const { locale, dict: d } = await resolveLocale(params);
  const sp = await searchParams;
  const L = trackerLabels[locale];
  const S = L.stats;
  const { supabase, user } = await currentUser();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="card-night p-6 text-pale-muted">{L.unavailable}</p>
      </div>
    );
  }
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, "/account/tracker"))}`);
  // in prova dal 10/10/2026 (ANALYTICS_PUBLIC spento): solo Creator, Autore, Pro, Staff e admin, gli altri ricevono un 404
  if (!(await analyticsAccess())) notFound();

  const [devices, matches] = await Promise.all([readTrackerDevices(supabase), readOwnMatches(supabase, user.id)]);
  const unavailable = devices.status !== "ok" || matches.status !== "ok";
  const own: OwnMatch[] = matches.status === "ok" ? matches.data : [];
  const stats = personalStats(own);
  const recent = recentMatches(own, 20);
  const legendaryLabel = d.common.legendary;
  const wl = (r: Record3) => `${r.wins}–${r.losses}`;
  const forgot = Number(one(sp.forgot));
  const privacyHref = `${href(locale, "/privacy")}#tracker`;
  const th = "kicker px-3 py-2 text-left text-chalk-muted";
  const td = "border-t border-night-3 px-3 py-2 align-middle";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={href(locale, "/account")} prefetch={false} className="link-mint font-bold">
          ← {L.back}
        </Link>
      </p>
      <p className="kicker mt-6 text-mint">{L.kicker}</p>
      <h1 className="t-page mt-2">{L.h1}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{L.intro}</p>
      {/* Al posto del vecchio "l'app è in prova" (10/10/2026): chi non ha ancora l'app va al download e alla guida */}
      <p className="mt-2 max-w-2xl text-sm text-pale-muted">
        {L.install}{" "}
        <Link href={analyticsInstallHref(locale)} prefetch={false} className="link-mint font-bold">
          {L.installLink} →
        </Link>
      </p>

      {unavailable ? (
        <p className="card-night mt-8 p-6 text-pale-muted">{L.unavailable}</p>
      ) : (
        <>
          <section id="link" className="mt-10 scroll-mt-24">
            <h2 className="t-section">{L.link.title}</h2>
            <ol className="mt-3 max-w-2xl list-decimal space-y-1 pl-5 text-sm text-pale">
              {L.link.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-3 max-w-2xl text-sm text-chalk-muted">
              {L.link.consent}{" "}
              <Link href={privacyHref} prefetch={false} className="link-mint">
                {L.link.consentLink}
              </Link>
              .
            </p>
            <TrackerCodeBox labels={L.link} locale={locale} />
          </section>

          <section id="devices" className="mt-12 scroll-mt-24">
            <h2 className="t-section">{L.devices.title}</h2>
            {one(sp.done) === "revoke" ? <p className="mt-3 text-sm text-good">{L.devices.done}</p> : null}
            {one(sp.error) === "revoke" ? <p className="mt-3 text-sm text-bad">{L.devices.error}</p> : null}
            {devices.status === "ok" && devices.data.length ? (
              <ul className="mt-4 grid grid-cols-1 gap-3">
                {devices.data.map((dev) => (
                  <li key={dev.id} className="card-night flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-pale">{dev.name}</p>
                      <p className="font-mono text-xs text-pale-muted">
                        {L.devices.linked} <TrackerTime iso={dev.created_at} locale={locale} /> ·{" "}
                        {dev.last_seen_at ? (
                          <>
                            {L.devices.lastSync} <TrackerTime iso={dev.last_seen_at} locale={locale} />
                          </>
                        ) : (
                          L.devices.never
                        )}
                      </p>
                    </div>
                    <form action={revokeTrackerDevice}>
                      <input type="hidden" name="id" value={dev.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <ConfirmButton label={L.devices.unlink} confirm={L.devices.confirm} className="btn btn-ink text-xs" />
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="card-night mt-4 p-6">
                <p className="text-pale-muted">{L.devices.empty}</p>
              </div>
            )}
          </section>

          <section id="stats" className="mt-12 scroll-mt-24">
            <h2 className="t-section">{S.title}</h2>
            {own.length === 0 ? (
              <div className="card-night mt-4 p-6">
                <p className="text-pale-muted">{S.empty}</p>
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="card-night p-4">
                    <p className="font-display text-2xl font-extrabold text-chalk">{stats.games}</p>
                    <p className="text-xs text-pale-muted">{S.games}</p>
                  </div>
                  <div className="card-night p-4">
                    <p className="font-display text-2xl font-extrabold text-chalk">{wl(stats)}</p>
                    <p className="text-xs text-pale-muted">{S.record}</p>
                  </div>
                  <div className="card-night p-4">
                    <p className="font-display text-2xl font-extrabold text-chalk">{stats.games ? `${percent(stats.wins, stats.games)}%` : "—"}</p>
                    <p className="text-xs text-pale-muted">{S.winRate}</p>
                  </div>
                  <div className="card-night p-4">
                    <p className="font-mono text-sm font-bold text-chalk">{stats.lastAt ? <TrackerTime iso={stats.lastAt} locale={locale} /> : "—"}</p>
                    <p className="text-xs text-pale-muted">{S.last}</p>
                  </div>
                </div>
                {stats.unknown ? <p className="mt-2 text-xs text-pale-muted">{fillTracker(S.unknown, { n: stats.unknown })}</p> : null}

                {stats.decks.length ? (
                  <div className="card-night mt-6 p-5">
                    <h3 className="t-item">{S.decksTitle}</h3>
                    <p className="mt-1 text-xs text-pale-muted">{S.decksNote}</p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th scope="col" className={th}>{S.deck}</th>
                            <th scope="col" className={`${th} text-right`}>{S.matches}</th>
                            <th scope="col" className={`${th} text-right`}>{S.wl}</th>
                            <th scope="col" className={th}>{S.winRate}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.decks.map((deck) => (
                            <tr key={deck.key}>
                              <td className={td}>
                                <span className="block font-semibold text-pale">{deck.name ?? getCardByKey(deck.legendary ?? "")?.name ?? S.unknownDeck}</span>
                                <span className="text-xs">
                                  <Legendary cardKey={deck.legendary} locale={locale} legendaryLabel={legendaryLabel} />
                                </span>
                              </td>
                              <td className={`${td} text-right font-mono`}>{deck.games}</td>
                              <td className={`${td} text-right font-mono`}>{wl(deck)}</td>
                              <td className={td}>
                                <WinRate r={deck} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {stats.opponents.length ? (
                  <div className="card-night mt-6 p-5">
                    <h3 className="t-item">{S.opponentsTitle}</h3>
                    <p className="mt-1 text-xs text-pale-muted">{S.opponentsNote}</p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th scope="col" className={th}>{S.legendary}</th>
                            <th scope="col" className={`${th} text-right`}>{S.matches}</th>
                            <th scope="col" className={`${th} text-right`}>{S.wl}</th>
                            <th scope="col" className={th}>{S.winRate}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.opponents.map((o) => (
                            <tr key={o.legendary}>
                              <td className={td}>
                                <Legendary cardKey={o.legendary} locale={locale} legendaryLabel={legendaryLabel} />
                              </td>
                              <td className={`${td} text-right font-mono`}>{o.games}</td>
                              <td className={`${td} text-right font-mono`}>{wl(o)}</td>
                              <td className={td}>
                                <WinRate r={o} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                <div className="card-night mt-6 p-5">
                  <h3 className="t-item">{S.recentTitle}</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th scope="col" className={th}>{S.when}</th>
                          <th scope="col" className={th}>{S.result}</th>
                          <th scope="col" className={th}>{S.deck}</th>
                          <th scope="col" className={th}>{S.opponent}</th>
                          <th scope="col" className={`${th} text-right`}>{S.rounds}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map((m) => (
                          <tr key={m.id}>
                            <td className={`${td} whitespace-nowrap font-mono text-xs text-pale-muted`}>
                              <TrackerTime iso={m.ended_at ?? m.created_at} locale={locale} />
                              {isPatch(m.patch) ? <span className="block">{fillTracker(S.patch, { patch: patchLabel(m.patch, locale) })}</span> : null}
                            </td>
                            <td className={td}>
                              <span
                                className={`inline-grid h-6 w-6 place-items-center rounded-md font-mono text-xs font-bold ${m.result === "W" ? "bg-good text-ink" : m.result === "L" ? "bg-bad text-ink" : "bg-night-3 text-pale"}`}
                                title={m.result === "W" ? S.winLong : m.result === "L" ? S.lossLong : undefined}
                              >
                                {m.result === "W" ? S.win : m.result === "L" ? S.loss : S.unknownResult}
                              </span>
                            </td>
                            <td className={td}>
                              <span className="block text-pale">{m.deck_name ?? getCardByKey(m.deck_legendary ?? "")?.name ?? S.unknownDeck}</span>
                            </td>
                            <td className={td}>{m.opponent_legendary ? <Legendary cardKey={m.opponent_legendary} locale={locale} legendaryLabel={legendaryLabel} /> : <span className="text-pale-muted">—</span>}</td>
                            <td className={`${td} text-right font-mono`}>{m.turns ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="mt-3 max-w-2xl text-xs text-pale-muted">{S.note}</p>
              </>
            )}
          </section>

          <section id="data" className="mt-12 scroll-mt-24">
            <h2 className="t-section">{L.data.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.data.body}</p>
            {Number.isInteger(forgot) && forgot >= 0 && one(sp.forgot) !== undefined ? <p className="mt-3 text-sm text-good">{fillTracker(L.data.done, { n: forgot })}</p> : null}
            {one(sp.error) === "forget" ? <p className="mt-3 text-sm text-bad">{L.data.error}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {own.length ? (
                <form action={forgetTrackerMatches}>
                  <input type="hidden" name="locale" value={locale} />
                  <ConfirmButton label={L.data.forget} confirm={L.data.confirm} className="btn btn-danger text-xs" />
                </form>
              ) : null}
              <Link href={privacyHref} prefetch={false} className="link-mint text-sm">
                {L.data.privacy}
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
