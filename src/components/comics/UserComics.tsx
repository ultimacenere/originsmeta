import Link from "next/link";
import { formatDate, href, type Locale } from "@/lib/i18n";
import type { ComicFeedCard } from "@/lib/community/comics";
import { comicLabels } from "@/lib/comicLabels";
import { NewsCover } from "../NewsCover";

/**
 * I fumetti pubblicati da un iscritto sulla sua pagina /u (pacchetto FUMETTI, 29/09/2026), come le sue guide: copertina,
 * data, titolo e presentazione, dal più recente. Niente se non ne ha.
 */
export function UserComics({ locale, comics }: { locale: Locale; comics: readonly ComicFeedCard[] }) {
  if (!comics.length) return null;
  const L = comicLabels[locale];
  return (
    <section className="profile-panel card-night mt-2.5 p-4 sm:p-5" aria-labelledby="user-comics-title">
      <h2 id="user-comics-title" className="t-panel">
        {L.profile.title}
      </h2>
      <ul className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {comics.map((c) => (
          <li key={c.slug} className="min-w-0">
            <Link href={href(locale, c.path)} prefetch={false} className="card-inset card-night-hover flex h-full min-w-0 flex-col p-4">
              {c.image ? <NewsCover src={c.image} /> : null}
              <p className="kicker mt-3 text-pale-muted">
                {L.pill} · {formatDate(locale, c.date.slice(0, 10))}
              </p>
              <h3 className="t-item mt-1 break-words leading-tight" lang={c.titleLang}>
                {c.title}
              </h3>
              <p className="mt-1 line-clamp-3 break-words text-sm text-pale-muted" lang={c.summaryLang}>
                {c.summary}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
