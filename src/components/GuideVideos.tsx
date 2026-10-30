import { Fragment, type ReactNode } from "react";
import { href, type Locale } from "@/lib/i18n";
import { videoLabels } from "@/lib/videoLabels";
import { splitAfterSection, type GuideSegment, type GuideVideoItem } from "@/lib/videos";
import { Markdown } from "./Markdown";
import { VideoEmbed } from "./VideoEmbed";

type Common = {
  /** titolo di riserva: quello della guida */
  title: string;
  locale: Locale;
};

/**
 * Video di una guida editoriale (pacchetto VIDEO, 26/09/2026), col lettore a clic: niente richieste a YouTube o Twitch
 * prima del clic. Posizioni decise da `guideVideoLayout` (src/lib/videos.ts): in cima, in fondo o prima di un titolo.
 * Anteprima: la miniatura del video salvata nel sito (`thumbnail`), altrimenti quella di YouTube dall'ottimizzatore del
 * sito o il riquadro con la piattaforma; mai la copertina della guida, che è materiale del media kit e non un tasto.
 */
export function GuideVideoList({ items, title, locale, className = "" }: Common & { items: GuideVideoItem[]; className?: string }) {
  if (!items.length) return null;
  const labels = videoLabels[locale].player;
  return (
    <div className={`grid grid-cols-1 gap-6 ${className}`}>
      {items.map(({ video, parsed }, i) => (
        <VideoEmbed
          key={`${parsed.url}-${i}`}
          video={parsed}
          title={parsed.title || title}
          poster={video.thumbnail}
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
 * Senza video è il solo `<Markdown>` di prima, con il testo intero. `insert` mette un blocco della pagina alla fine della
 * sezione con quell'ancora (`splitAfterSection`): le promo Alpha nella guida al Kickstarter.
 */
export function GuideBody({ segments, end, title, locale, insert }: Common & { segments: GuideSegment[]; end: GuideVideoItem[]; insert?: { anchor: string; node: ReactNode } }) {
  return (
    <>
      {segments.map((s, i) => {
        if (s.kind !== "md") return <GuideVideoList key={i} items={s.items} title={title} locale={locale} className="my-8" />;
        const parts = insert ? splitAfterSection(s.source, insert.anchor) : null;
        if (!parts) return <Markdown key={i} source={s.source} linkCards={locale} />;
        return (
          <Fragment key={i}>
            <Markdown source={parts[0]} linkCards={locale} />
            {insert?.node}
            {parts[1].trim() ? <Markdown source={parts[1]} linkCards={locale} /> : null}
          </Fragment>
        );
      })}
      <GuideVideoList items={end} title={title} locale={locale} className="mt-8" />
    </>
  );
}
