import { fillLabel } from "@/lib/community/deckQuality";
import { comicImageUrl, type ComicPage } from "@/lib/community/comics";
import type { ComicLabels } from "@/lib/comicLabels";

/**
 * Le tavole di un fumetto una sotto l'altra (pacchetto FUMETTI, 29/09/2026): si leggono scorrendo, come una striscia,
 * larghe fino a 720 px (le tavole sono larghe 1080: sugli schermi densi restano nitide). Larghezza e altezza vere
 * riservano lo spazio (niente salti della pagina mentre si caricano); la prima si carica subito, le altre quando
 * arrivano. Ogni tavola apre il file a grandezza piena in una scheda nuova (lo zoom del browser). Il testo alternativo è
 * il testo della tavola nella lingua della pagina, quando c'è; la trascrizione completa sta sotto le tavole.
 * `<img>` e non next/image: i file stanno nello Storage di Supabase e sono già ridotti e ricodificati al caricamento.
 */
export function ComicStrip({ pages, texts, base, labels }: { pages: readonly ComicPage[]; texts: readonly string[]; base: string; labels: ComicLabels["page"] }) {
  const total = String(pages.length);
  return (
    <ol className="mx-auto flex max-w-[720px] flex-col gap-3">
      {pages.map((p, i) => {
        const n = String(i + 1);
        const text = (texts[i] ?? "").replace(/\s+/g, " ").trim();
        const alt = text ? fillLabel(labels.pageAltText, { n, total, text: text.length > 400 ? `${text.slice(0, 399)}…` : text }) : fillLabel(labels.pageAlt, { n, total });
        const src = comicImageUrl(p.path, base);
        return (
          <li key={p.path}>
            <a href={src} target="_blank" rel="noopener" className="block overflow-hidden rounded-lg border-2 border-sky" title={fillLabel(labels.open, { n })}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} width={p.width} height={p.height} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} decoding="async" className="block h-auto w-full" />
            </a>
          </li>
        );
      })}
    </ol>
  );
}
