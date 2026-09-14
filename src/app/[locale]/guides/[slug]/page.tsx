import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { getGuide, guideSlugs } from "@/lib/content/guides";
import { Markdown } from "@/components/Markdown";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => guideSlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const g = getGuide(locale, slug);
  if (!g) return {};
  const m = pageMeta(locale, `/guides/${g.slug}`, `${g.title} · ${dict.guides.title}`, g.excerpt, g.image);
  return m;
}

export default async function GuidePage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const g = getGuide(locale, slug);
  if (!g) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={href(locale, "/guides")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.guides.title}
        </Link>
      </p>
      <header className="mt-6">
        <p className="kicker text-mint">
          {g.readTime} {d.guides.readTime} · {d.common.updated} {formatDate(locale, g.updated)}
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-chalk sm:text-5xl">{g.title}</h1>
        <p className="mt-4 text-lg text-chalk-muted">{g.excerpt}</p>
      </header>
      {g.image ? (
        <div className="hero-art mt-8" style={{ transform: "none" }}>
          <Image src={g.image} alt="" width={1600} height={900} sizes="(max-width: 768px) 92vw, 720px" className="w-full" priority />
        </div>
      ) : null}
      <article className="card-ivory mt-8 p-6 sm:p-10">
        <Markdown source={g.body} />
        <p className="mt-8 border-t border-ink/15 pt-4 text-xs text-ink-muted">{d.common.notAffiliated}</p>
      </article>
    </div>
  );
}
