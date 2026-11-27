import Link from "next/link";
import { formatDate, formatDateShort, href, type Locale } from "@/lib/i18n";
import type { ProtoData } from "@/lib/profileProto/load";
import type { Card, ChangeKind } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { getDictionary } from "@/lib/i18n";
import { achievementLabels } from "@/lib/achievementLabels";
import { ACHIEVEMENT_LOOK, type AchievementId } from "@/lib/community/achievements";
import { twitchLogin } from "@/lib/community/profileLinks";
import { getProfileByUsername } from "@/lib/community/queries";
import { creatorLabels } from "@/lib/creatorLabels";
import { cardImageAlt } from "@/lib/cardPage";
import { GameCard } from "@/components/GameCard";
import { AchievementIcon } from "@/components/achievements/AchievementIcon";
import { FollowButton } from "@/components/follow/FollowButton";
import { LiveBadge } from "@/components/LiveBadge";
import { buildStory, statDiff, type Chapter, type Touched, type Updated } from "./logic";
import { InkDefs, Stamp } from "./Stamps";
import { PatchFilter } from "./PatchFilter";
import { PatchCardButton } from "./PatchCardButton";
import "./patch.css";

/*
  Prototipo 3, «Le patch» (27/11/2026): la storia di un iscritto patch per patch, con i timbri delle patch vissute in
  testata e un capitolo per patch, dalla più recente: mazzi pubblicati e aggiornati, tier list, guide, traguardi e
  le carte dei suoi mazzi che la patch ha cambiato. Testi in italiano (prototipo).
*/

const KIND: Record<Exclude<ChangeKind, "deck">, { label: string; cls: string }> = {
  buff: { label: "Buff", cls: "patch-kind-buff" },
  nerf: { label: "Nerf", cls: "patch-kind-nerf" },
  rework: { label: "Rework", cls: "patch-kind-rework" },
};
const STAT_NAME = { mana: "Mana", power: "Potenza", health: "Salute" } as const;

const day = (locale: Locale, iso: string) => formatDateShort(locale, iso.slice(0, 10));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Thumb({ card, locale, size = "md" }: { card: Card | null; locale: Locale; size?: "sm" | "md" }) {
  if (!card) return null;
  const src = card.thumb ?? card.image;
  const w = size === "sm" ? "w-9" : "w-12";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={cardImageAlt(card, locale)} loading="lazy" decoding="async" className={`${w} aspect-[480/690] shrink-0 object-contain`} />
  ) : null;
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={88} height={88} referrerPolicy="no-referrer" className="size-[72px] shrink-0 rounded-full bg-felt-soft object-cover ring-[3px] ring-sky sm:size-[88px]" />
  ) : (
    <span aria-hidden="true" className="grid size-[72px] shrink-0 place-items-center rounded-full bg-night-2 font-title text-3xl text-sky ring-[3px] ring-sky sm:size-[88px]">
      {initial}
    </span>
  );
}

function StatLine({ t }: { t: Touched }) {
  const d = statDiff(t.change.from, t.change.to);
  const parts = (Object.keys(d) as (keyof typeof d)[]).flatMap((k) => (d[k] ? [`${STAT_NAME[k]} ${d[k]![0] ?? "–"} → ${d[k]![1] ?? "–"}`] : []));
  if (t.change.alignment) parts.push("Allineamento cambiato");
  return <span className="font-mono text-sm text-pale">{parts.length ? parts.join(" · ") : "Statistiche invariate, testo cambiato"}</span>;
}

function KindPill({ kind }: { kind: ChangeKind }) {
  if (kind === "deck") return null;
  return <span className={`patch-kind ${KIND[kind].cls}`}>{KIND[kind].label}</span>;
}

function UpdatedRow({ u, locale }: { u: Updated; locale: Locale }) {
  return (
    <li className="py-2">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <Link href={href(locale, `/decks/community/${u.deck.slug}`)} prefetch={false} className="font-display font-bold text-chalk hover:text-mint">
          {u.deck.name}
        </Link>
        <span className="font-mono text-sm text-sky">
          v{u.from} → v{u.to}
        </span>
        <span className="text-sm text-pale-muted">{day(locale, u.at)}</span>
      </p>
      {u.legendary ? (
        <p className="mt-1 text-sm text-pale">
          Leggendaria: {u.legendary.from?.name ?? "nessuna"} → <span className="text-gold">{u.legendary.to?.name ?? "nessuna"}</span>
        </p>
      ) : null}
      {u.added.length || u.removed.length ? (
        <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Carte entrate e uscite">
          {u.added.map((c, i) => (
            <li key={`a${i}`}>
              <Link href={href(locale, `/cards/${c.slug}`)} prefetch={false} className="patch-in">
                <span aria-hidden="true">+</span>
                <span className="sr-only">Entra</span> {c.name}
              </Link>
            </li>
          ))}
          {u.removed.map((c, i) => (
            <li key={`r${i}`}>
              <Link href={href(locale, `/cards/${c.slug}`)} prefetch={false} className="patch-out">
                <span aria-hidden="true">−</span>
                <span className="sr-only">Esce</span> {c.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : !u.legendary ? (
        <p className="mt-1 text-sm text-pale-muted">Stesse carte, ordine diverso.</p>
      ) : null}
    </li>
  );
}

function TouchedRow({ t, ch, locale }: { t: Touched; ch: Chapter; locale: Locale }) {
  const note = t.change.note[locale] ?? t.change.note.en;
  return (
    <li className="py-2">
      <PatchCardButton
        label={`${t.card.name}: ${KIND[t.change.kind as keyof typeof KIND]?.label ?? ""} nella patch ${ch.patch.label}`}
        trigger={
          <span className="flex items-center gap-3 text-left">
            <Thumb card={t.card} locale={locale} />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className={`font-display font-bold ${t.card.legendary ? "text-gold" : "text-chalk"}`}>{t.card.name}</span>
                <KindPill kind={t.change.kind} />
              </span>
              <span className="mt-0.5 block">
                <StatLine t={t} />
              </span>
            </span>
          </span>
        }
      >
        <div className="grid gap-5 sm:grid-cols-[220px_1fr] sm:items-start">
          <div className="mx-auto w-[200px] sm:w-[220px]">
            <span role="img" aria-label={cardImageAlt(t.card, locale)} className="block">
              <GameCard card={t.card} locale={locale} />
            </span>
            <p className="mt-2 text-center text-xs text-pale-muted">La carta di oggi</p>
          </div>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <span className="t-item">{t.card.name}</span>
              <KindPill kind={t.change.kind} />
            </p>
            <p className="mt-1 text-sm text-pale-muted">
              Patch {ch.patch.label.includes("·") ? ch.patch.label.split(" · ")[0] : ch.patch.label} · {formatDate(locale, ch.patch.startDay)}
            </p>
            <p className="mt-3">
              <StatLine t={t} />
            </p>
            <p className="mt-3 text-chalk">{note}</p>
            <p className="mt-4 text-sm text-pale">Nei suoi mazzi: {t.decks.map((d) => d.deck.name).join(", ")}</p>
            <Link href={href(locale, `/cards/${t.card.slug}`)} prefetch={false} className="btn btn-ink mt-4 inline-flex min-h-11 items-center">
              Scheda della carta
            </Link>
          </div>
        </div>
      </PatchCardButton>
      <ul className="mt-1 space-y-0.5 pl-[60px] text-sm">
        {t.decks.map((d) => (
          <li key={d.deck.id} className="text-pale">
            <Link href={href(locale, `/decks/community/${d.deck.slug}`)} prefetch={false} className="link-mint">
              {d.deck.name}
            </Link>{" "}
            <span className="text-pale-muted">
              {d.days === null ? "· ancora con la lista di prima" : d.days === 0 ? "· aggiornato lo stesso giorno" : `· aggiornato ${plural(d.days, "giorno", "giorni")} dopo`}
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

function ChapterBody({ ch, locale }: { ch: Chapter; locale: Locale }) {
  const ach = achievementLabels[locale].achievements.items;
  const other = ch.milestones.filter((m) => m.kind === "tierlist" || m.kind === "guide" || m.kind === "joined");
  const trophies = ch.milestones.filter((m) => m.kind === "achievement");
  return (
    <div className="space-y-6 px-4 pb-5 sm:px-6">
      {ch.published.length ? (
        <section data-k="deck">
          <h3 className="t-panel">Mazzi pubblicati</h3>
          <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {ch.published.map((p) => (
              <li key={p.deck.id}>
                <Link href={href(locale, `/decks/community/${p.deck.slug}`)} prefetch={false} className="group flex min-h-11 items-center gap-3">
                  <Thumb card={p.deck.legendary} locale={locale} />
                  <span className="min-w-0">
                    <span className="block truncate font-display font-bold text-chalk group-hover:text-mint">{p.deck.name}</span>
                    <span className="block truncate text-sm text-pale-muted">
                      {archetypeLabels[p.deck.archetype]?.[locale] ?? p.deck.archetype} · {day(locale, p.at)}
                      {p.deck.theory ? " · Theory craft" : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {ch.updated.length ? (
        <section data-k="deck">
          <h3 className="t-panel">Mazzi aggiornati</h3>
          <ul className="mt-1 divide-y divide-sky/15">
            {ch.updated.map((u) => (
              <UpdatedRow key={`${u.deck.id}-${u.to}`} u={u} locale={locale} />
            ))}
          </ul>
        </section>
      ) : null}
      {ch.touched.length ? (
        <section data-k="balance">
          <h3 className="t-panel">La patch nei suoi mazzi</h3>
          <ul className="mt-1 divide-y divide-sky/15">
            {ch.touched.map((t) => (
              <TouchedRow key={t.card.slug} t={t} ch={ch} locale={locale} />
            ))}
          </ul>
        </section>
      ) : null}
      {trophies.length ? (
        <section data-k="achievement">
          <h3 className="t-panel">Traguardi</h3>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
            {trophies.map((m) => {
              const look = ACHIEVEMENT_LOOK[m.achievement as AchievementId];
              return (
                <li key={m.key} className="flex items-center gap-2.5">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-full ${look.tone === "gold" ? "bg-gold/15 text-gold" : "bg-sky/15 text-sky"}`}>
                    <AchievementIcon icon={look.icon} mark={look.mark} className="size-6" />
                  </span>
                  <span>
                    <span className="block font-display font-bold text-chalk">{ach[m.achievement as AchievementId]?.name ?? m.title}</span>
                    <span className="block text-sm text-pale-muted">{m.detail ?? day(locale, m.at)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      {other.length ? (
        <section data-k="other">
          <ul className="space-y-2">
            {other.map((m) => (
              <li key={m.key} className="flex flex-wrap items-baseline gap-x-2">
                {m.href ? (
                  <Link href={href(locale, m.href)} prefetch={false} className="font-display font-bold text-chalk hover:text-mint">
                    {m.title}
                  </Link>
                ) : (
                  <span className="font-display font-bold text-chalk">{m.title}</span>
                )}
                <span className="text-sm text-pale-muted">
                  {m.detail ? `${m.detail} · ` : ""}
                  {day(locale, m.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function summaryOf(ch: Chapter): string {
  const bits: string[] = [];
  if (ch.published.length) bits.push(plural(ch.published.length, "mazzo pubblicato", "mazzi pubblicati"));
  if (ch.updated.length) bits.push(plural(ch.updated.length, "aggiornamento", "aggiornamenti"));
  if (ch.touched.length) bits.push(plural(ch.touched.length, "carta cambiata", "carte cambiate"));
  const trophies = ch.milestones.filter((m) => m.kind === "achievement").length;
  if (trophies) bits.push(plural(trophies, "traguardo", "traguardi"));
  return bits.join(" · ");
}

function range(ch: Chapter, locale: Locale): string {
  const from = formatDateShort(locale, ch.patch.startDay);
  if (ch.patch.current) return `in corso dal ${from}`;
  const end = new Date(ch.patch.end!).toISOString().slice(0, 10);
  return `${from} – ${formatDateShort(locale, end)}`;
}

/** I capitoli in ordine, con le patch vuote consecutive unite in una riga sottile. */
type Row = { kind: "chapter"; ch: Chapter; index: number } | { kind: "thin"; chs: Chapter[] };
function rowsOf(chapters: Chapter[]): Row[] {
  const rows: Row[] = [];
  chapters.forEach((ch, i) => {
    if (!ch.empty) return rows.push({ kind: "chapter", ch, index: i });
    const last = rows[rows.length - 1];
    if (last?.kind === "thin") last.chs.push(ch);
    else rows.push({ kind: "thin", chs: [ch] });
  });
  return rows;
}

export async function PatchView({ data, locale }: { data: ProtoData; locale: Locale }) {
  const ach = achievementLabels[locale].achievements.items;
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  const story = buildStory(data, locale, {
    achievement: (id) => ach[id as AchievementId]?.name ?? id,
    months: (m) => monthFmt.format(new Date(`${m}-15T12:00:00Z`)),
  });
  const profile = data.showcase ? await getProfileByUsername(data.username).catch(() => null) : null;
  const live = data.showcase && data.channels !== null && twitchLogin(data.channels.links) !== null;
  const c = getDictionary(locale).community;
  const rows = rowsOf(story.chapters);
  const openId = (story.chapters.find((ch) => ch.patch.current && !ch.empty) ?? story.chapters.find((ch) => !ch.empty))?.patch.id;
  const counts = {
    all: 0,
    deck: story.chapters.reduce((n, ch) => n + ch.published.length + ch.updated.length, 0),
    balance: story.chapters.reduce((n, ch) => n + ch.touched.length, 0),
    achievement: story.chapters.reduce((n, ch) => n + ch.milestones.filter((m) => m.kind === "achievement").length, 0),
  };
  const stampIndex = new Map(story.chapters.map((ch, i) => [ch.patch.id, story.chapters.length - 1 - i]));

  return (
    <div className="patch-root mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <InkDefs />
      <header>
        <div className="flex items-center gap-4 sm:gap-5">
          <Avatar src={data.avatarUrl} name={data.name} />
          <div className="min-w-0">
            <h1 className="t-page break-words">{data.name}</h1>
            <p className="text-sm text-pale-muted">
              @{data.username} · iscritto dal {formatDate(locale, data.createdAt.slice(0, 10))}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2.5">
              {data.badge !== "community" ? <span className={`${badgePill} ${badgeStyle[data.badge]}`}>{c.badges[data.badge]}</span> : null}
              {live ? <LiveBadge username={data.username} labels={creatorLabels[locale].live} placement="profile" size="md" /> : null}
            </p>
          </div>
        </div>
        {profile ? <FollowButton profileId={profile.id} name={data.name} badge={data.badge} locale={locale} placement="profile" className="mt-4" /> : null}

        <section aria-label="Timbri delle patch" className="mt-7">
          <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
            {[...story.chapters].reverse().map((ch, i) => (
              <li key={ch.patch.id}>
                <a
                  href={`#patch-${ch.patch.id}`}
                  className="patch-stamp-link"
                  aria-label={`${ch.patch.label}: ${ch.stamped ? "timbro" : "nessuna attività"}`}
                  title={`${ch.patch.label}${ch.stamped ? "" : " · niente in questa patch"}`}
                >
                  <Stamp ch={ch} index={i} locale={locale} />
                </a>
              </li>
            ))}
            {story.inStep ? (
              <li className="ml-2">
                <span className="patch-seal" title="Ha aggiornato i mazzi colpiti prima della patch dopo, ogni volta">
                  Sempre al passo
                </span>
              </li>
            ) : null}
          </ol>
          <p className="mt-3 font-display text-lg font-bold text-chalk">
            {plural(story.lived, "patch vissuta", "patch vissute")} · {story.stamps ? plural(story.stamps, "timbro", "timbri") : "ancora nessun timbro"}
          </p>
          <p className="mt-1 text-xs text-pale-muted">
            Provvisorio: un timbro per ogni patch in cui ha pubblicato o aggiornato un mazzo, salvato una tier list, pubblicato una guida o preso un traguardo.
            {story.inStep ? " «Sempre al passo»: ha aggiornato ogni mazzo colpito prima della patch dopo." : ""}
          </p>
        </section>
      </header>

      <div className="mt-10">
        <PatchFilter counts={counts}>
          <ol className="patch-line">
            {rows.map((row) =>
              row.kind === "thin" ? (
                <li key={row.chs[0].patch.id} className="patch-thin">
                  {row.chs.map((ch) => (
                    <span key={ch.patch.id} id={`patch-${ch.patch.id}`} className="scroll-mt-24">
                      {ch.patch.label}
                    </span>
                  ))}
                  <span className="text-pale-muted">· {row.chs.length === 1 ? "niente in questa patch" : "niente in queste patch"}</span>
                </li>
              ) : (
                <li key={row.ch.patch.id} id={`patch-${row.ch.patch.id}`} className="patch-chapter scroll-mt-24">
                  <span className="patch-dot" aria-hidden="true">
                    <Stamp ch={row.ch} index={stampIndex.get(row.ch.patch.id) ?? 0} locale={locale} size={44} />
                  </span>
                  <details open={row.ch.patch.id === openId} className="card-night patch-details">
                    <summary className="patch-summary">
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-3">
                          <span className="t-section">{row.ch.patch.label}</span>
                          <span className="text-sm text-pale-muted">{range(row.ch, locale)}</span>
                        </span>
                        {summaryOf(row.ch) ? <span className="mt-0.5 block text-sm text-pale">{summaryOf(row.ch)}</span> : null}
                      </span>
                      <span className="patch-toggle" aria-hidden="true" />
                    </summary>
                    <ChapterBody ch={row.ch} locale={locale} />
                  </details>
                </li>
              ),
            )}
          </ol>
        </PatchFilter>
        {story.touchedAny ? (
          <p className="mt-6 text-xs text-pale-muted">
            Provvisorio: «La patch nei suoi mazzi» guarda solo i mazzi pubblicati oggi, con le carte della versione in vigore all&apos;inizio della patch. Non sappiamo quando un mazzo è stato nascosto.
          </p>
        ) : null}
      </div>
    </div>
  );
}
