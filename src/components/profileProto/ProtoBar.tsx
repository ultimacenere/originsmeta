import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { PROTO_VARIANTS, type ProtoVariant } from "@/lib/profileProto/variants";

/** Barra in cima ai prototipi: passa da una strada all'altra sullo stesso profilo, e torna all'indice. */
export function ProtoBar({ locale, variant, username }: { locale: Locale; variant: ProtoVariant; username: string }) {
  return (
    <nav aria-label="Prototipi" className="border-b-2 border-sky/40 bg-felt-deep">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2 text-sm sm:px-6">
        <Link href={href(locale, "/prova-profilo")} prefetch={false} className="shrink-0 font-display font-bold text-pale-muted hover:text-mint">
          Prototipi
        </Link>
        {PROTO_VARIANTS.map((v) => (
          <Link
            key={v.id}
            href={href(locale, `/prova-profilo/${v.id}/${username}`)}
            prefetch={false}
            aria-current={v.id === variant ? "page" : undefined}
            className={`shrink-0 rounded-full px-3 py-1 font-display font-bold ${v.id === variant ? "bg-mint text-ink" : "text-chalk hover:text-mint"}`}
          >
            {v.n} · {v.name}
          </Link>
        ))}
        <a href={href(locale, `/u/${username}`)} className="ml-auto shrink-0 text-pale-muted hover:text-mint">
          Pagina di oggi
        </a>
      </div>
    </nav>
  );
}
