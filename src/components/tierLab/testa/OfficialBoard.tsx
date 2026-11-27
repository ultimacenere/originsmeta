import Link from "@/components/IntentLink";
import { GameCardFace } from "@/components/GameCard";
import { tierTone } from "@/lib/tiercode";
import type { Locale } from "@/lib/i18n";
import type { LabData, LabTierOrNone } from "@/lib/tierLab/types";
import "./testa.css";

/*
  La tier list ufficiale in chiaro, sotto il gioco e nell'HTML del server (SEO e GEO, e per chi non vuole giocare):
  le 12 Leggendarie nelle fasce pubblicate il 9/11, in stile schermata di fine partita, con win rate e partite.
*/

const ROWS: LabTierOrNone[] = ["S", "A", "B", "C", "D", "unranked"];

export function OfficialBoard({ data, locale, patchLabel }: { data: LabData; locale: Locale; patchLabel: string }) {
  const pct = new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const pct0 = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const num = new Intl.NumberFormat(locale);
  return (
    <section id="legendaries" className="tlv-board" aria-labelledby="tlv-board-title">
      <h2 id="tlv-board-title" className="t-section text-sky">
        La tier list delle Leggendarie
      </h2>
      <p className="tlv-board-intro">
        Fasce pubblicate il {data.officialReadLabel} sui numeri della patch del {patchLabel}: {num.format(data.officialGames)} partite registrate dal Tracker.{" "}
        <Link href={data.officialNews} className="text-mint underline">
          Come sono nate
        </Link>
        .
      </p>
      <ol className="tlv-rows">
        {ROWS.map((t) => {
          const legs = data.legendaries.filter((l) => l.official.tier === t);
          if (legs.length === 0) return null;
          return (
            <li key={t} className="tlv-row">
              <span className={`tlv-row-tier ${t === "unranked" ? "is-none" : tierTone[t]}`}>{t === "unranked" ? "Senza fascia" : t}</span>
              <ol className="tlv-row-legs">
                {legs.map((l) => (
                  <li key={l.slug} className="tlv-leg">
                    <span className="tlv-leg-n">{l.official.rank}</span>
                    <span className="tlv-leg-card" aria-hidden>
                      <GameCardFace input={l.game} lang={locale} />
                    </span>
                    <span className="tlv-leg-text">
                      <Link href={l.href} className="tlv-leg-name">
                        {l.name}
                      </Link>
                      <span className="tlv-leg-wr">
                        <b>{pct.format(l.official.rate.r)}</b> su {num.format(l.official.rate.games)} partite
                      </span>
                      <span className="tlv-leg-ci">
                        intervallo {pct.format(l.official.rate.lo)}–{pct.format(l.official.rate.hi)}
                        {l.official.boosted && l.official.crimson ? ` · +1 dalla Crimson Cup (bannata nel ${pct0.format(l.official.crimson.banRate)} dei casi, in finale)` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </li>
          );
        })}
      </ol>
      <p className="tlv-board-method">
        Come si legge: S quando anche il bordo basso dell&apos;intervallo al 95% sta sopra il 50%, A dal 50%, B dal 45%, C dal 40%, D sotto. Una fascia in più a
        chi alla Crimson Cup è stata bannata spesso ed è arrivata in finale. Win rate contando tutti e due i lati di ogni partita. Gli scontri del gioco qui sopra
        vengono dalla stessa patch, con le partite registrate anche dopo il {data.officialReadLabel}.
      </p>
    </section>
  );
}
