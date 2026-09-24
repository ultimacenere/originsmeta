import Link from "next/link";
import { badgeStyle } from "@/lib/cardArt";
import type { Dictionary } from "@/lib/i18n";
import type { TierDeckEntry } from "@/lib/tierTypes";

/**
 * Mazzi pubblicati nella sezione Tier list (24/09/2026): letti da Supabase come /decks, non più scritti a mano in
 * `tierlist.ts` (prima la pagina ne mostrava 2 su 14). Ogni voce porta alla scheda del mazzo: Leggendaria con la
 * cornice oro, nome, archetipo, autore con il tag (Staff, Pro, Influencer) e il voto con il numero di voti.
 */
export function TierDeckList({ decks, dict: d, locale }: { decks: TierDeckEntry[]; dict: Dictionary; locale: string }) {
  const oneDecimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <ul className="tier-decks">
      {decks.map((dk) => (
        <li key={dk.slug} className="min-w-0">
          <Link href={dk.href} className="tier-deck">
            {dk.legendary?.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dk.legendary.thumb} alt="" width={160} height={230} loading="lazy" decoding="async" />
            ) : (
              <span aria-hidden="true" className="row-span-2" />
            )}
            <span className="tier-deck-name">{dk.name}</span>
            <span className="tier-deck-meta">
              {dk.legendary ? `${dk.legendary.name} · ` : ""}
              {dk.archetypeLabel} · {dk.creator}
              {dk.badge !== "community" ? <span className={`stat-pill ml-1.5 px-1.5 py-0 text-[10px] font-extrabold uppercase ${badgeStyle[dk.badge] ?? ""}`}>{dk.badgeLabel}</span> : null}
              <br />
              {dk.rating.votes ? (
                <>
                  <span className="text-gold" aria-hidden="true">
                    ★
                  </span>{" "}
                  {oneDecimal.format(dk.rating.avg)} · {dk.rating.votes} {dk.rating.votes === 1 ? d.community.vote : d.community.votes}
                </>
              ) : (
                d.community.noVotes
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
