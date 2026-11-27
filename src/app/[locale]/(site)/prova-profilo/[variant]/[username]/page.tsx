import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta, resolveLocale } from "@/lib/page";
import { loadProto } from "@/lib/profileProto/load";
import { PROTO_VARIANTS, protoMeta, type ProtoVariant } from "@/lib/profileProto/variants";
import { ProtoBar } from "@/components/profileProto/ProtoBar";
import { CarteView } from "@/components/profileProto/carte/CarteView";
import { OndaView } from "@/components/profileProto/onda/OndaView";
import { PatchView } from "@/components/profileProto/patch/PatchView";

/*
  Prototipi della pagina utente (26/11/2026): tre direzioni sui profili veri, letti in sola lettura. Noindex, fuori da
  sitemap e hreflang, nessun link dal sito: si arriva solo dall'indice /prova-profilo dell'anteprima.
*/
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ locale: string; variant: string; username: string }>;

const isVariant = (v: string): v is ProtoVariant => PROTO_VARIANTS.some((x) => x.id === v);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { variant, username } = await params;
  const { locale } = await resolveLocale(params);
  const v = PROTO_VARIANTS.find((x) => x.id === variant);
  return protoMeta(pageMeta(locale, `/prova-profilo/${variant}/${username}`, `Prova profilo · ${v?.name ?? ""} · ${username}`, "Prototipo della pagina utente di OriginsMeta: non indicizzato."));
}

export default async function ProtoProfilePage({ params }: { params: Params }) {
  const { variant, username } = await params;
  const { locale } = await resolveLocale(params);
  if (!isVariant(variant)) notFound();
  const data = await loadProto(username);
  if (!data) notFound();
  const View = variant === "carte" ? CarteView : variant === "onda" ? OndaView : PatchView;
  return (
    <>
      <ProtoBar locale={locale} variant={variant} username={data.username} />
      <View data={data} locale={locale} />
    </>
  );
}
