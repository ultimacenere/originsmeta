import type { Json } from "@/lib/jsonld/entities";

/*
  Dati strutturati: qui solo il componente che scrive lo <script>. Entità del sito (OriginsMeta, Origins TCG, Koin
  Games), convenzione degli `@id` e costruttori dei nodi di pagina stanno in src/lib/jsonld/entities.ts, un modulo puro
  che si prova con `node --test` (dall'Ondata 2, 25/09/2026); gli eventi in src/lib/jsonld/events.ts. Questo file li
  riesporta tutti, così le pagine continuano a importare da "@/components/JsonLd" come prima.
*/
export * from "@/lib/jsonld/entities";

/** Dati strutturati schema.org inline (JSON-LD). Il `<` viene escapato per non chiudere lo script. */
export function JsonLd({ data }: { data: Json | Json[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
