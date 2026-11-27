import Link from "next/link";
import { formatDate, href, type Locale } from "@/lib/i18n";
import type { ProtoData } from "@/lib/profileProto/load";
import { getCard } from "@/lib/data/cards";
import { getProfileByUsername } from "@/lib/community/queries";
import { twitchLogin } from "@/lib/community/profileLinks";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { creatorLabels } from "@/lib/creatorLabels";
import { GameCard, GameCardFace } from "@/components/GameCard";
import { FollowButton } from "@/components/follow/FollowButton";
import { LiveBadge } from "@/components/LiveBadge";
import { ChannelLinks } from "@/components/ChannelLinks";
import { artUri } from "./art";
import { DECK_SIZE, RARITY_NAME, deckCount, nextStep, trophyDeck, type Copy, type TrophyCard } from "./rules";
import { TrophyGrid, type TrophyItem } from "./TrophyGrid";
import "./carte.css";

/*
  Prototipo 1 della pagina utente, «Il mazzo dei traguardi» (27/11/2026). Il profilo è un mazzo di Origins TCG:
  1 Leggendaria (la carta dell'iscritto, nostra) + 12 carte dei traguardi × 2 copie = 25 carte, come la regola del deck
  builder. Sotto, la collezione: i mazzi pubblicati con la carta del gioco della loro Leggendaria.
*/

const ROLE: Record<string, string> = { community: "Community", creator: "Creator", author: "Autore", pro: "Pro", staff: "Staff" };

const monthName = (ym: string) => new Intl.DateTimeFormat("it", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-15T12:00:00Z`));
const whenText = (locale: Locale, when: string | null) => (when ? (when.length === 7 ? `Presa a ${monthName(when)}` : `Presa il ${formatDate(locale, when)}`) : "Presa");
const decimal = (n: number) => n.toFixed(1).replace(".", ",");

function trophyFace(c: TrophyCard, locale: Locale) {
  return (
    <GameCardFace
      lang={locale}
      className={`ct-r-${c.rarity}`}
      input={{
        slug: `ct-${c.id}`,
        name: c.name,
        type: "spell",
        cost: c.count,
        power: null,
        health: null,
        legendary: false,
        alignment: null,
        text: `×1 · ${c.copies[0].rule}\n×2 · ${c.copies[1].rule}`,
        art: artUri(c.id),
      }}
    />
  );
}

function Pips({ c, size = "sm" }: { c: TrophyCard; size?: "sm" | "lg" }) {
  return (
    <span className={`ct-pips ct-pips--${size} ct-r-${c.rarity}`} aria-hidden="true">
      <span className={c.count >= 1 ? "is-on" : ""} />
      <span className={c.count >= 2 ? "is-on" : ""} />
    </span>
  );
}

function CopyRow({ n, copy, locale }: { n: 1 | 2; copy: Copy; locale: Locale }) {
  return (
    <li className="flex gap-3">
      <span className={`ct-copy-mark${copy.got ? " is-on" : ""}`} aria-hidden="true">
        ×{n}
      </span>
      <span className="min-w-0">
        <span className="block font-display font-bold text-chalk">{copy.rule}</span>
        <span className={`block text-sm ${copy.got ? "text-mint" : "text-pale-muted"}`}>{copy.got ? whenText(locale, copy.when) : copy.missing}</span>
      </span>
    </li>
  );
}

function Detail({ c, locale }: { c: TrophyCard; locale: Locale }) {
  return (
    <div className="ct-detail">
      <div className={`ct-detail-card${c.count ? "" : " is-off"}`} aria-hidden="true">
        {trophyFace(c, locale)}
      </div>
      <div className="min-w-0">
        <h2 className="t-section text-sky">{c.name}</h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-pale">
          <Pips c={c} size="lg" />
          <span>
            {RARITY_NAME[c.rarity]} · <span className="tabular-nums">{c.count}</span> su 2
          </span>
        </p>
        <ul className="mt-4 space-y-3">
          <CopyRow n={1} copy={c.copies[0]} locale={locale} />
          <CopyRow n={2} copy={c.copies[1]} locale={locale} />
        </ul>
      </div>
    </div>
  );
}

function CountBar({ n }: { n: number }) {
  return (
    <div className="ct-count" role="img" aria-label={`${n} carte su ${DECK_SIZE}`}>
      {Array.from({ length: DECK_SIZE }, (_, i) => (
        <span key={i} className={i === 0 ? "is-leg" : i < n ? "is-on" : ""} />
      ))}
    </div>
  );
}

export async function CarteView({ data, locale }: { data: ProtoData; locale: Locale }) {
  const cards = trophyDeck(data);
  const n = deckCount(cards);
  const votes = data.decks.reduce((s, d) => s + d.rating.votes, 0);
  const role = ROLE[data.badge] ?? "Community";

  // l'illustrazione della carta dell'iscritto: la Leggendaria del cuore, altrimenti quella dei suoi mazzi più usata
  const usage = new Map<string, number>();
  for (const d of data.decks) if (d.legendary) usage.set(d.legendary.slug, (usage.get(d.legendary.slug) ?? 0) + 1);
  const topLegendary = [...usage.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const heart = getCard(data.vetrina?.favoriteLegendary ?? "") ?? getCard(topLegendary ?? "");
  const art = heart?.art ?? artUri("me");

  // l'id del profilo serve solo a "Segui" (ProtoData non lo porta); solo per i ruoli con vetrina
  const profileId = data.showcase ? ((await getProfileByUsername(data.username).catch(() => null))?.id ?? null) : null;
  const links = data.channels?.links ?? [];
  const live = data.showcase && twitchLogin(links) !== null;
  const L = creatorLabels[locale];

  const items: TrophyItem[] = cards.map((c) => ({
    id: c.id,
    taken: c.count > 0,
    label: `${c.name}, ${RARITY_NAME[c.rarity]}, ${c.count} su 2. ${nextStep(c)}.`,
    face: <span key={`f-${c.id}`} className="block">{trophyFace(c, locale)}</span>,
    under: (
      <span key={`u-${c.id}`} className="ct-under">
        <span className="flex items-center gap-1.5">
          <Pips c={c} />
          <span className="font-mono text-xs font-bold text-chalk">×{c.count}</span>
        </span>
        <span className={`ct-under-step ${c.count === 2 ? "text-mint" : "text-pale-muted"}`}>{nextStep(c)}</span>
      </span>
    ),
    detail: <Detail key={`d-${c.id}`} c={c} locale={locale} />,
  }));

  const decks = data.decks.filter((d) => d.legendary);

  return (
    <div className="ct-page mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        {/* la carta dell'iscritto: la Leggendaria del mazzo */}
        <header className="ct-me-col lg:sticky lg:top-24">
          <div className="ct-me-card" role="img" aria-label={`Carta di ${data.name}: ${n} carte su ${DECK_SIZE}, ${data.decks.length} mazzi, ${votes} voti ricevuti`}>
            <GameCardFace
              lang={locale}
              className="ct-me"
              input={{
                slug: "ct-me",
                name: data.name,
                type: "unit",
                cost: n,
                power: data.decks.length,
                health: votes,
                legendary: true,
                alignment: null,
                text: `${role}\ndal ${formatDate(locale, data.createdAt.slice(0, 10))}`,
                art,
              }}
            />
          </div>
          <div className="mt-5 text-center lg:text-left">
            <h1 className="t-page break-words text-sky">{data.name}</h1>
            <p className="font-mono text-sm text-pale-muted">@{data.username}</p>
            {data.badge !== "community" || live ? (
              <p className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {data.badge !== "community" ? <span className={`${badgePill} ${badgeStyle[data.badge]}`}>{role}</span> : null}
                {live ? <LiveBadge username={data.username} labels={L.live} placement="profile" size="md" /> : null}
              </p>
            ) : null}
            {profileId ? <FollowButton profileId={profileId} name={data.name} badge={data.badge} locale={locale} placement="profile" className="mt-3" /> : null}
            {links.length ? (
              <div className="ct-links mt-3 flex justify-center lg:justify-start">
                <ChannelLinks links={links} labels={L.channels} ownerName={data.name} placement="profile" variant="compact" me />
              </div>
            ) : null}
          </div>
        </header>

        <div className="mt-8 min-w-0 lg:mt-0">
          {/* il mazzo dei traguardi */}
          <section aria-labelledby="ct-deck" className="card-night p-3 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="ct-deck" className="t-section text-sky">
                Il mazzo dei traguardi
              </h2>
              <p className="font-mono text-lg font-bold text-chalk">
                {n}
                <span className="text-pale-muted"> / {DECK_SIZE}</span>
              </p>
            </div>
            <CountBar n={n} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-pale-muted">Provvisorio: regole nuove dei traguardi.</p>
              {n <= 3 ? <span className="pen-note is-quiet">collezione appena iniziata</span> : n === DECK_SIZE ? <span className="pen-note">mazzo completo</span> : null}
            </div>
            <TrophyGrid items={items} />
          </section>

          {/* la collezione: i mazzi pubblicati */}
          {decks.length ? (
            <section aria-labelledby="ct-coll" className="mt-10">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="ct-coll" className="t-section text-sky">
                  La collezione
                </h2>
                <p className="font-mono text-sm text-pale-muted">{decks.length === 1 ? "1 mazzo" : `${decks.length} mazzi`}</p>
              </div>
              <ul className="ct-coll mt-4">
                {decks.map((d) => (
                  <li key={d.id} className="ct-coll-item">
                    <Link href={href(locale, `/decks/community/${d.slug}`)} prefetch={false} className="ct-coll-link">
                      <GameCard card={d.legendary!} locale={locale} />
                      <span className="mt-2 block line-clamp-2 font-display text-sm font-bold leading-snug text-sky">{d.name}</span>
                      <span className="mt-0.5 block font-mono text-xs text-pale-muted">
                        {d.rating.votes ? (
                          <>
                            <span className="text-gold" aria-hidden="true">
                              ★
                            </span>{" "}
                            {decimal(d.rating.avg)} · {d.rating.votes === 1 ? "1 voto" : `${d.rating.votes} voti`}
                          </>
                        ) : (
                          "Nessun voto"
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
