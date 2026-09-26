import { href, type Locale } from "@/lib/i18n";
import { videoLabels } from "@/lib/videoLabels";
import type { GuideSegment, GuideVideoItem } from "@/lib/videos";
import { Markdown } from "./Markdown";
import { VideoEmbed } from "./VideoEmbed";

type Common = {
  /** anteprima di riserva: la copertina della guida (la miniatura del video, se salvata nel sito, vince) */
  poster?: string;
  /** titolo di riserva: quello della guida */
  title: string;
  locale: Locale;
};

/**
 * Video di una guida editoriale (pacchetto VIDEO, 26/09/2026), col lettore a clic: niente richieste a YouTube o Twitch
 * prima del clic. Posizioni decise da `guideVideoLayout` (src/lib/videos.ts): in cima, in fondo o prima di un titolo.
 */
export function GuideVideoList({ items, poster, title, locale, className = "" }: Common & { items: GuideVideoItem[]; className?: string }) {
  if (!items.length) return null;
  const labels = videoLabels[locale].player;
  return (
    <div className={`grid grid-cols-1 gap-6 ${className}`}>
      {items.map(({ video, parsed }, i) => (
        <VideoEmbed
          key={`${parsed.url}-${i}`}
          video={parsed}
          title={video.title?.trim() || title}
          poster={video.thumbnail ?? poster}
          labels={labels}
          privacyHref={`${href(locale, "/privacy")}#video`}
          placement="guide"
        />
      ))}
    </div>
  );
}

/**
 * Il testo della guida con i video indicati da `before` fra un pezzo e l'altro, poi quelli in fondo (`at: "end"`).
 * Senza video è il solo `<Markdown>` di prima, con il testo intero.
 */
export function GuideBody({ segments, end, poster, title, locale }: Common & { segments: GuideSegment[]; end: GuideVideoItem[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.kind === "md" ? (
          <Markdown key={i} source={s.source} linkCards={locale} />
        ) : (
          <GuideVideoList key={i} items={s.items} poster={poster} title={title} locale={locale} className="my-8" />
        ),
      )}
      <GuideVideoList items={end} poster={poster} title={title} locale={locale} className="mt-8" />
    </>
  );
}
