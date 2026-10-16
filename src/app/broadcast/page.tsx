import type { Metadata } from "next";
import { headers } from "next/headers";
import { broadcastCatalog } from "@/lib/broadcast/catalog";
import type { RegiaLang } from "@/lib/broadcast/labels";
import { BroadcastRegia } from "@/components/broadcast/BroadcastRegia";

/**
 * Broadcasting OM, la regia (prototipo del 16/10/2026). Lingua della regia: ?lang=it|en, altrimenti quella del browser
 * (italiano per chi lo chiede per primo, inglese per gli altri), poi la sceglie chi la usa.
 */
export const metadata: Metadata = { title: "Broadcasting OM · Regia" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BroadcastRegiaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const asked = typeof sp.lang === "string" ? sp.lang : "";
  let ui: RegiaLang;
  if (asked === "it" || asked === "en") ui = asked;
  else ui = ((await headers()).get("accept-language") ?? "").trim().toLowerCase().startsWith("it") ? "it" : "en";
  return (
    <main lang={ui}>
      <BroadcastRegia catalog={broadcastCatalog()} initialUi={ui} />
    </main>
  );
}
