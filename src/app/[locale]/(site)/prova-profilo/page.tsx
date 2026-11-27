import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { PROTO_PROFILES } from "@/lib/profileProto/load";
import { PROTO_VARIANTS, protoMeta } from "@/lib/profileProto/variants";
import { ProtoPicker } from "@/components/profileProto/ProtoPicker";

/* Indice dei prototipi della pagina utente (26/11/2026). Noindex, nessun link dal sito. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return protoMeta(pageMeta(locale, "/prova-profilo", "Prova profilo · tre prototipi", "Prototipi della pagina utente di OriginsMeta: non indicizzati."));
}

export default async function ProtoIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await resolveLocale(params);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="t-page">La pagina utente: tre prototipi</h1>
      <p className="mt-2 max-w-2xl text-chalk">Profili veri, letti dal sito. Scegli una strada e un profilo: tutto si clicca. Dove un dato non esiste ancora, la pagina lo dice.</p>
      <ol className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {PROTO_VARIANTS.map((v) => (
          <li key={v.id} className="card-night flex flex-col gap-3 p-5">
            <p className="pen-num text-3xl text-mint">{v.n}</p>
            <h2 className="t-section">{v.name}</h2>
            <p className="text-sm text-chalk">{v.idea}</p>
            <ul className="mt-auto flex flex-col gap-1.5 pt-2 text-sm">
              {PROTO_PROFILES.map((p) => (
                <li key={p.username}>
                  <Link href={href(locale, `/prova-profilo/${v.id}/${p.username}`)} prefetch={false} className="link-mint font-bold">
                    {p.username}
                  </Link>{" "}
                  <span className="text-pale-muted">· {p.note}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <ProtoPicker locale={locale} />
    </div>
  );
}
