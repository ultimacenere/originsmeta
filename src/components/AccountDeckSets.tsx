import Link from "next/link";
import { formatDate, href, type Dictionary, type Locale } from "@/lib/i18n";
import { getCard } from "@/lib/data/cards";
import type { Db } from "@/lib/supabase/public";
import { deckSetLimit, listUserDeckSets } from "@/lib/community/deckSetQueries";
import { deleteDeckSet, setDeckSetStatus } from "@/lib/community/deckSetActions";
import { deckLetter, deckSetLabels } from "@/lib/deckSetLabels";
import { fillLabel } from "@/lib/community/deckQuality";
import { deckStatsLabels } from "@/lib/deckStatsLabels";
import { ConfirmButton } from "./ConfirmButton";

/**
 * "I tuoi mazzi torneo" in /account (04/10/2026, ancora #tournament-decks): i trii dell'utente, anche nascosti, con apri,
 * modifica, nascondi o rimetti online ed elimina, e il tetto (lo stesso numero dei mazzi singoli, contato a parte).
 */
export async function AccountDeckSets({ locale, supabase, userId, dict }: { locale: Locale; supabase: Db; userId: string; dict: Dictionary }) {
  const S = deckSetLabels[locale];
  const c = dict.community;
  const [sets, limit] = await Promise.all([listUserDeckSets(supabase, userId), deckSetLimit(supabase, userId)]);
  const stats = await readSetStats(supabase, sets.map((x) => x.id));
  const SL = deckStatsLabels[locale];
  return (
    <section id="tournament-decks" className="mt-12 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="t-section">{S.account.title}</h2>
        <Link href={`${href(locale, "/deck-builder")}?mode=tournament`} className="btn btn-primary text-xs">
          {dict.nav.builder} →
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{S.account.intro}</p>
      {Number.isFinite(limit.cap) && limit.cap < 2147483647 ? (
        <p className="mt-1 font-mono text-xs text-pale-muted">{fillLabel(S.account.limit, { used: String(limit.used), cap: String(limit.cap) })}</p>
      ) : null}
      {sets.length === 0 ? (
        <div className="card-night mt-4 p-6">
          <p className="text-pale-muted">{S.account.empty}</p>
          <p className="mt-3">
            <Link href={`${href(locale, "/deck-builder")}?mode=tournament`} className="btn btn-ink text-xs">
              {S.account.cta}
            </Link>
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {sets.map((set) => {
            const viewHref = href(locale, `/decks/tournament/${set.slug}`);
            return (
              <li key={set.id} className="card-night flex flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`stat-pill text-[11px] font-semibold uppercase ${set.status === "published" ? "bg-mint text-ink" : "bg-night-3 text-pale"}`}>
                    {set.status === "published" ? c.status.published : S.owner.hidden}
                  </span>
                  {set.decks.map((deck, i) => (
                    <span key={i} className="stat-pill bg-gold text-ink">
                      {deckLetter(i)} ★ {getCard(deck.legendary)?.name ?? deck.legendary}
                    </span>
                  ))}
                </div>
                <p className="t-item mt-3 leading-tight">{set.name}</p>
                <p className="mt-1 font-mono text-xs text-pale-muted">
                  {set.rating?.votes ? `★ ${set.rating.avg.toFixed(1)} · ${set.rating.votes} ${set.rating.votes === 1 ? c.vote : c.votes}` : c.noVotes} · {dict.common.updated}{" "}
                  {formatDate(locale, set.updated_at.slice(0, 10))}
                </p>
                {stats ? (
                  <p className="mt-1 font-mono text-xs text-pale" title={SL.estimate}>
                    {SL.views} {stats.get(set.id)?.views ?? 0} · {SL.codeCopies} {stats.get(set.id)?.code_copies ?? 0} · {SL.linkClicks} {stats.get(set.id)?.link_clicks ?? 0} · {SL.videoPlays}{" "}
                    {stats.get(set.id)?.video_plays ?? 0}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {set.status === "published" ? (
                    <Link href={viewHref} className="btn btn-ink text-xs">
                      {S.account.view}
                    </Link>
                  ) : null}
                  <Link href={`${viewHref}/edit`} className="btn btn-ink text-xs">
                    {S.owner.edit}
                  </Link>
                  <form action={setDeckSetStatus}>
                    <input type="hidden" name="id" value={set.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="status" value={set.status === "published" ? "hidden" : "published"} />
                    <button type="submit" className="btn btn-ink text-xs">
                      {set.status === "published" ? S.owner.hide : S.owner.unhide}
                    </button>
                  </form>
                  <form action={deleteDeckSet}>
                    <input type="hidden" name="id" value={set.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <ConfirmButton label={S.owner.delete} confirm={S.owner.confirmDelete} className="btn btn-danger text-xs" />
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

type SetTotals = { views: number; code_copies: number; link_clicks: number; video_plays: number };

/**
 * Totali delle statistiche dei trii dell'utente (deck_set_stats_daily, letta con la sua sessione: la policy fa vedere solo i
 * suoi). Sono stime, come quelle dei mazzi singoli. null se la tabella non si legge (migrazione non applicata).
 */
async function readSetStats(supabase: Db, ids: string[]): Promise<Map<string, SetTotals> | null> {
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from("deck_set_stats_daily").select("set_id, views, code_copies, link_clicks, video_plays").in("set_id", ids).limit(5000);
  if (error) return null;
  const out = new Map<string, SetTotals>();
  for (const r of (data ?? []) as (SetTotals & { set_id: string })[]) {
    const t = out.get(r.set_id) ?? { views: 0, code_copies: 0, link_clicks: 0, video_plays: 0 };
    t.views += r.views;
    t.code_copies += r.code_copies;
    t.link_clicks += r.link_clicks;
    t.video_plays += r.video_plays;
    out.set(r.set_id, t);
  }
  return out;
}
