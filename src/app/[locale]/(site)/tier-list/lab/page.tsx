import type { Metadata } from "next";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { loadLabData } from "@/lib/tierLab/data";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return pageMeta(locale, "/tier-list/lab", "Tier list: tre prototipi", "Prototipi della tier list di OriginsMeta: non indicizzati.", undefined, { noindex: true, languages: [] });
}

export default async function LabIndex({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const data = await loadLabData(locale);
  const rows = data.legendaries.map((l) =>
    [
      l.name,
      l.official.tier,
      (l.official.rate.r * 100).toFixed(1),
      l.community?.tier,
      l.votes?.avg,
      l.used,
      ...data.patches.map((p) => {
        const s = l.patches[p.id];
        return s ? `${p.id}:${s.ruleTier}:${(s.r * 100).toFixed(1)}:${s.games}:${(s.share * 100).toFixed(1)}%:mu${s.matchups.length}` : `${p.id}:-`;
      }),
      l.changes.map((c) => c.patch).join("/"),
    ].join(" | "),
  );
  return (
    <div>
      {rows.map((r) => (
        <p key={r} className="text-xs text-pale">
          {r}
        </p>
      ))}
    </div>
  );
}
