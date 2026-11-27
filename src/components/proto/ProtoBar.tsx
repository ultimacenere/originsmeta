import Link from "@/components/IntentLink";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";

/**
 * Cornice comune dei prototipi del rework di Analytics (26/11/2026): solo in italiano, mai indicizzati, con una
 * striscia in cima che dice che è un prototipo, che cosa è dato vero e che cosa è provvisorio.
 */

export async function protoLocale(params: LocaleParams) {
  const r = await resolveLocale(params);
  if (r.locale !== "it") notFound();
  return r;
}

export function protoMeta(path: string, title: string, description: string): Metadata {
  return pageMeta("it", path, title, description, undefined, { noindex: true, languages: ["it"] });
}

export function ProtoBar({ name, real, provisional }: { name: string; real: string; provisional?: string }) {
  return (
    <div className="mb-6 rounded-xl border-2 border-gold/60 bg-night/80 px-4 py-3 text-sm text-chalk">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded-full bg-gold px-2.5 py-0.5 font-display text-xs font-bold text-ink">Prototipo</span>
        <span className="font-display font-semibold text-sky">{name}</span>
        <Link href="/it/proto/analytics" className="ml-auto text-mint underline-offset-2 hover:underline">
          Tutti e tre
        </Link>
      </p>
      <p className="mt-2 text-pale">
        <b className="text-good">Dati veri:</b> {real}
      </p>
      {provisional ? (
        <p className="mt-1 text-pale">
          <b className="text-gold">Provvisorio:</b> {provisional}
        </p>
      ) : null}
    </div>
  );
}
