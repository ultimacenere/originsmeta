import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getGuides } from "@/lib/content/guides";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/guides", dict.guides.title, dict.guides.intro);
}

export default async function GuidesPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const guides = getGuides(locale);
  const categories = Object.entries(d.guides.categories) as [keyof typeof d.guides.categories, string][];
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.guides}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-mint sm:text-5xl">{d.guides.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.guides.intro}</p>
      <ul className="mt-6 flex flex-wrap gap-2" aria-label={d.guides.title}>
        {categories.map(([id, label]) => {
          const count = guides.filter((g) => g.category === id).length;
          return (
            <li key={id} className={`stat-pill border ${count ? "border-mint text-mint" : "border-felt-line text-chalk-muted/60"}`}>
              {label} · {count}
            </li>
          );
        })}
      </ul>
      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={href(locale, `/guides/${g.slug}`)} className="card-night card-night-hover flex h-full flex-col overflow-hidden">
              {g.image ? <Image src={g.image} alt="" width={1200} height={675} sizes="(max-width: 768px) 90vw, 30vw" className="aspect-[16/9] w-full object-cover" /> : null}
              <div className="flex flex-1 flex-col p-5">
                <p className="kicker text-pale-muted">
                  {d.guides.categories[g.category]} · {g.readTime} {d.guides.readTime} · {formatDate(locale, g.updated)}
                </p>
                <h2 className="mt-1 text-xl font-extrabold leading-tight text-mint">{g.title}</h2>
                <p className="mt-2 flex-1 text-sm text-pale-muted">{g.excerpt}</p>
                <span className="mt-4 font-display text-sm font-bold text-crimson">{d.common.readMore} →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
