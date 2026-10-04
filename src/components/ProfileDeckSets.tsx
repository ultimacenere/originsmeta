import Link from "next/link";
import { formatDate, href, type Dictionary, type Locale } from "@/lib/i18n";
import { getCard } from "@/lib/data/cards";
import { listDeckSetsByOwner } from "@/lib/community/deckSetQueries";
import { deckLetter, deckSetLabels } from "@/lib/deckSetLabels";

/**
 * I mazzi torneo pubblicati di un iscritto sul suo profilo /u (04/10/2026), dal più recente: le tre Leggendarie in
 * miniatura, nome, voti e data. Niente sezione se non ne ha. La lettura lancia sugli errori come le altre del profilo
 * (ISR: resta la pagina di prima); la tabella che non c'è ancora vale "nessun trio".
 */
export async function ProfileDeckSets({ ownerId, locale, dict }: { ownerId: string; locale: Locale; dict: Dictionary }) {
  const sets = await listDeckSetsByOwner(ownerId);
  if (!sets.length) return null;
  const S = deckSetLabels[locale];
  return (
    <section className="card-night mt-2.5 p-4 sm:p-5">
      <h2 className="t-panel">{S.profile.title}</h2>
      <ul className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {sets.map((set) => (
          <li key={set.id} className="card-inset p-4">
            <div className="flex gap-1.5">
              {set.decks.map((deck, i) => {
                const card = getCard(deck.legendary);
                return card?.thumb ? (
                  // carta intera rimpicciolita, senza ritagli: i crediti impressi restano
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={card.thumb} alt={`${deckLetter(i)}: ${card.name}`} width={160} height={230} loading="lazy" decoding="async" className="h-[72px] w-auto rounded" />
                ) : null;
              })}
            </div>
            <Link href={href(locale, `/decks/tournament/${set.slug}`)} className="t-item mt-2 block leading-tight hover:text-mint">
              {set.name}
            </Link>
            <p className="mt-1 font-mono text-xs text-pale-muted">
              {dict.common.createdOn} {formatDate(locale, set.created_at.slice(0, 10))}
              {set.rating?.votes ? ` · ★ ${set.rating.avg.toFixed(1)} (${set.rating.votes})` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
