import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { fill } from "@/lib/cardPage";
import { cardVariantLabels, type CardVariantLabels } from "@/lib/cardVariantLabels";
import { altArtCount, type AlphaVariant, type CardAltArts } from "@/lib/cardVariants";
import { kickstarterPromoActive } from "@/lib/kickstarter";
import { kickstarterLabels } from "@/lib/kickstarterLabels";
import { PROMO_IMAGE_SIZE, type KickstarterPromo } from "@/lib/kickstarterPromos";
import { formatUsd } from "@/lib/kickstarterTiers";

/*
  Sezione "Illustrazioni alternative" della scheda carta (02/11/2026, src/lib/cardVariants.ts), subito sotto la scheda.
  Due gruppi, Alpha Edition (varianti con il segno ALPHA) e promo del Kickstarter, ognuno con la sua riga; immagini intere
  con i crediti impressi e sotto ognuna l'illustratore, come vuole la regola del materiale Koin. Sotto i 640 px una fila
  che scorre di lato, come le promo della landing; da 640 px la griglia. Niente /_next/image: le WebP da 480 px bastano
  fino a 240 px a doppia densità e non costano trasformazioni. Componente server, nessuno stato.
*/

const GRID = "mt-3 flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:gap-x-4 sm:gap-y-6 sm:overflow-visible sm:pb-0 lg:grid-cols-5";
const ITEM = "w-[42%] min-w-0 shrink-0 snap-start sm:w-auto";
// Le varianti non sono alte uguali (l'illustrazione esce dalla cornice, da 480×559 a 480×698): ogni immagine sta intera in
// un riquadro con le proporzioni della più alta, appoggiata in basso, così immagini e didascalie di una fila si allineano.
// Le promo, tutte nella stessa custodia, hanno il riquadro della custodia.
const ART_ALPHA = "aspect-[480/700] h-auto w-full object-contain object-bottom";
const ART_PROMO = "aspect-[480/778] h-auto w-full object-contain object-bottom";
const PILL = "mt-1.5 inline-block rounded-full px-2 py-0.5 font-mono text-[11px] font-bold leading-tight";

function AlphaItem({ v, name, l }: { v: AlphaVariant; name: string; l: CardVariantLabels }) {
  return (
    <li className={ITEM}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={v.image} width={v.width} height={v.height} alt={fill(l.altAlpha, { name, artist: v.credit.illus })} loading="lazy" decoding="async" className={ART_ALPHA} />
      <p className="mt-2 text-xs leading-snug text-pale">{fill(l.artist, { name: v.credit.illus })}</p>
      {v.credit.num ? <p className="font-mono text-[11px] text-pale-muted">{fill(l.number, { num: v.credit.num })}</p> : null}
    </li>
  );
}

function PromoItem({ p, name, l, locale }: { p: KickstarterPromo; name: string; l: CardVariantLabels; locale: Locale }) {
  const group = p.group === "profile" ? (p.signed ? l.group.signed : l.group.profile) : l.group[p.group];
  // lo stretch goal solo per la scatola: lo stato (sbloccato o no) cambia con la campagna e lo dice la landing
  const goal = p.group === "box" ? (p.goal ? fill(l.goal, { usd: formatUsd(locale, p.goal) }) : l.start) : undefined;
  return (
    <li className={ITEM}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.image} {...PROMO_IMAGE_SIZE} alt={fill(l.altPromo, { name, artist: p.artist })} loading="lazy" decoding="async" className={ART_PROMO} />
      <p className="mt-2 font-display text-xs font-bold leading-snug text-sky">{group}</p>
      <p className="text-xs leading-snug text-pale">{fill(l.artist, { name: p.artist })}</p>
      {goal ? <span className={`${PILL} border-2 border-sky text-chalk`}>{goal}</span> : null}
    </li>
  );
}

export function CardAltArt({ name, locale, arts }: { name: string; locale: Locale; arts: CardAltArts }) {
  const n = altArtCount(arts);
  if (!n) return null;
  const l = cardVariantLabels[locale];
  // Durante la campagna le promo portano alla landing (il tasto verso Kickstarter con il nostro link referral sta lì);
  // dopo, alla sezione delle promo della guida, che resta.
  const live = kickstarterPromoActive(new Date());
  const promoHref = live ? `${href(locale, "/kickstarter")}#promos` : `${href(locale, "/guides/origins-tcg-kickstarter")}#${kickstarterLabels[locale].promos.guideAnchor}`;
  return (
    <section id={l.anchor} className="mt-10 scroll-mt-24" aria-labelledby={`${l.anchor}-title`}>
      <h2 id={`${l.anchor}-title`} className="t-section">
        {l.title}
      </h2>
      <p className="mt-2 max-w-2xl text-pale">
        {fill(n === 1 ? l.introOne : l.introMany, { name, n })} {l.introNote}{" "}
        <Link href={href(locale, "/guides/collector-economy")} className="link-mint font-bold">
          {l.collecting} →
        </Link>
      </p>
      {arts.alpha.length ? (
        <div className="mt-6">
          <h3 className="t-item">{l.alpha.title}</h3>
          <p className="mt-1 max-w-2xl text-sm text-pale-muted">{l.alpha.text}</p>
          <ul className={GRID}>
            {arts.alpha.map((v) => (
              <AlphaItem key={v.id} v={v} name={name} l={l} />
            ))}
          </ul>
        </div>
      ) : null}
      {arts.promos.length ? (
        <div className="mt-6">
          <h3 className="t-item">{l.promos.title}</h3>
          <p className="mt-1 max-w-2xl text-sm text-pale-muted">{l.promos.text}</p>
          <ul className={GRID}>
            {arts.promos.map((p) => (
              <PromoItem key={p.image} p={p} name={name} l={l} locale={locale} />
            ))}
          </ul>
          <p className="mt-4 text-sm">
            {live ? (
              <Link href={promoHref} className="link-mint font-bold" data-om-event="kickstarter_landing_open" data-om-placement="card">
                {l.promos.link} →
              </Link>
            ) : (
              <Link href={promoHref} className="link-mint font-bold">
                {l.promos.guideLink} →
              </Link>
            )}
          </p>
        </div>
      ) : null}
      <p className="mt-4 text-xs text-pale-muted">{l.credit}</p>
    </section>
  );
}
