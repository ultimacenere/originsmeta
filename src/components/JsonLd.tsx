import { siteUrl } from "@/lib/i18n";

type Json = Record<string, unknown>;

/** Dati strutturati schema.org inline (JSON-LD). Il `<` viene escapato per non chiudere lo script. */
export function JsonLd({ data }: { data: Json | Json[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function breadcrumbs(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${siteUrl}${it.path}` })),
  };
}

export const organization: Json = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "OriginsMeta",
  url: siteUrl,
  logo: `${siteUrl}/media/origins-icon.png`,
  email: "staff@originsmeta.com",
};

export function website(locale: string, description: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/${locale}#website`,
    name: "OriginsMeta",
    url: `${siteUrl}/${locale}`,
    inLanguage: locale,
    description,
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/${locale}/cards?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}
