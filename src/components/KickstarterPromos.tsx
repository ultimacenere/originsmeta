import Image from "next/image";
import { formatDate, type Locale } from "@/lib/i18n";
import { fillKs, kickstarterLabels, type KickstarterLabels } from "@/lib/kickstarterLabels";
import { KICKSTARTER_BOX_TOTAL, KICKSTARTER_PROMOS_READ, PROMO_IMAGE_SIZE, promosOf, promoUnlocked, type KickstarterPromo, type KickstarterPromoGroup } from "@/lib/kickstarterPromos";
import { formatUsd } from "@/lib/kickstarterTiers";

/*
  Le promo della Alpha Edition (30/10/2026, src/lib/kickstarterPromos.ts): sulla landing /kickstarter, sotto i livelli, e
  nella guida al Kickstarter, dopo la sezione delle promo (lì senza il testo della scatola, che la guida ha già). Componente server, nessun link (sulla landing l'unico obiettivo
  resta il tasto verso la campagna). Prima la Alpha Alt-Art Promo Box con gli stretch goal raggiunti in vista e gli altri
  a scomparsa (la pagina resta corta sul telefono), poi le promo dei livelli. Immagini intere, crediti impressi compresi;
  sotto ogni carta nome e illustratore.
*/

type Variant = "landing" | "guide";

const PILL = "mt-1.5 inline-block rounded-full px-2 py-0.5 font-mono text-[11px] font-bold leading-tight";

function status(p: KickstarterPromo, k: KickstarterLabels["promos"], locale: Locale): { text: string; className: string } | null {
  if (p.signed) return { text: k.signed, className: "bg-gold text-ink" };
  if (p.group !== "box") return null;
  if (p.goal === 0) return { text: k.box.start, className: "bg-mint text-ink" };
  if (promoUnlocked(p)) return { text: k.box.unlocked, className: "bg-mint text-ink" };
  return { text: fillKs(k.box.goal, { usd: formatUsd(locale, p.goal ?? 0) }), className: "border-2 border-sky text-chalk" };
}

/** Sotto i 640 px una fila che scorre di lato (la sezione resta corta sul telefono), da 640 px la griglia di `cols`. */
function PromoGrid({ promos, k, locale, cols, sizes }: { promos: KickstarterPromo[]; k: KickstarterLabels["promos"]; locale: Locale; cols: string; sizes: string }) {
  return (
    <ul className={`mt-4 flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:gap-x-3 sm:gap-y-5 sm:overflow-visible sm:pb-0 ${cols}`}>
      {promos.map((p) => {
        const s = status(p, k, locale);
        return (
          <li key={p.image} className="w-[28%] min-w-0 shrink-0 snap-start sm:w-auto">
            <Image src={p.image} {...PROMO_IMAGE_SIZE} alt={fillKs(k.alt, { name: p.name })} sizes={sizes} className="h-auto w-full" />
            <p className="mt-2 font-display text-xs font-bold text-sky sm:text-sm">{p.name}</p>
            <p className="font-mono text-[11px] leading-snug text-pale-muted">{fillKs(k.artist, { name: p.artist })}</p>
            {s ? <span className={`${PILL} ${s.className}`}>{s.text}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function KickstarterPromos({ locale, variant }: { locale: Locale; variant: Variant }) {
  const k = kickstarterLabels[locale].promos;
  const landing = variant === "landing";
  const box = promosOf("box");
  const reached = box.filter((p) => promoUnlocked(p) || p.goal === 0);
  const locked = box.filter((p) => !reached.includes(p));
  const lockedGoals = new Set(locked.map((p) => p.goal)).size;
  // sulla landing ogni gruppo è un pannello; nella guida il testo sta già in un pannello, quindi niente cornici annidate
  const panel = landing ? "card-night min-w-0 p-5" : "min-w-0";
  const boxCols = landing ? "sm:grid-cols-4 lg:grid-cols-6" : "sm:grid-cols-5";
  const boxSizes = landing ? "(min-width: 1024px) 180px, (min-width: 640px) 22vw, 30vw" : "(min-width: 640px) 120px, 30vw";
  // sulla landing i pannelli dei livelli stanno uno per riga fino a 1024 px, poi tre affiancati
  const groupCols = landing ? "sm:grid-cols-5 lg:grid-cols-3" : "sm:grid-cols-5";
  const groupSizes = landing ? "(min-width: 1024px) 110px, (min-width: 640px) 18vw, 30vw" : "(min-width: 640px) 120px, 30vw";
  const groups: { group: Exclude<KickstarterPromoGroup, "box">; title: string; text: string }[] = [
    { group: "golden", title: k.golden.title, text: k.golden.text },
    { group: "oz", title: k.oz.title, text: k.oz.text },
    { group: "profile", title: k.profiles.title, text: fillKs(k.profiles.text, { date: formatDate(locale, KICKSTARTER_PROMOS_READ) }) },
  ];
  return (
    <div className={landing ? "mt-5 grid gap-4" : "my-8 grid gap-8"}>
      <div className={panel}>
        <h3 className="t-item">{k.box.title}</h3>
        {/* nella guida lo dice già il paragrafo sopra la tabella degli stretch goal */}
        {landing ? <p className="mt-2 max-w-3xl text-pale">{fillKs(k.box.text, { n: KICKSTARTER_BOX_TOTAL.cards, max: formatUsd(locale, KICKSTARTER_BOX_TOTAL.usd) })}</p> : null}
        <PromoGrid promos={reached} k={k} locale={locale} cols={boxCols} sizes={boxSizes} />
        {locked.length ? (
          <details className="mt-5">
            <summary className="cursor-pointer font-display text-sm font-bold text-mint hover:text-chalk">{fillKs(k.box.more, { n: lockedGoals })}</summary>
            <PromoGrid promos={locked} k={k} locale={locale} cols={boxCols} sizes={boxSizes} />
          </details>
        ) : null}
        <p className="mt-4 text-xs text-pale-muted">{fillKs(k.box.status, { date: formatDate(locale, KICKSTARTER_PROMOS_READ) })}</p>
      </div>
      <div className={landing ? "grid grid-cols-1 items-start gap-4 lg:grid-cols-3" : "grid gap-8"}>
        {groups.map((g) => (
          <div key={g.group} className={panel}>
            <h3 className="t-item">{g.title}</h3>
            <p className="mt-2 text-pale">{g.text}</p>
            <PromoGrid promos={promosOf(g.group)} k={k} locale={locale} cols={groupCols} sizes={groupSizes} />
          </div>
        ))}
      </div>
      <p className="text-xs text-pale-muted">{k.credit}</p>
    </div>
  );
}
