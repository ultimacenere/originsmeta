import type { Metadata } from "next";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { activeCards } from "@/lib/data/cards";
import { draftLabels } from "@/lib/draftLabels";
import { draftPool } from "@/lib/draft/pool";
import { normalizeRoomCode } from "@/lib/draft/online";
import { loadDraftRoom } from "@/lib/draft/onlineActions";
import { currentUser } from "@/lib/supabase/server";
import { fill } from "@/lib/tournament/types";
import { DraftRoom } from "@/components/draft/DraftRoom";
import type { DraftUiCard } from "@/components/draft/DraftBoard";

/*
  Stanza del draft online (fase 2, 02/10/2026): pagina privata e dinamica (legge la sessione), noindex. Il link si
  manda all'avversario; chi non ha fatto l'accesso vede il tasto per farlo e torna qui. Lo stato arriva solo come vista
  del proprio posto (onlineActions.ts).
*/
export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string; code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const { locale } = await resolveLocale(Promise.resolve({ locale: p.locale }));
  const x = draftLabels[locale].online.meta;
  const code = normalizeRoomCode(p.code) ?? "";
  return pageMeta(locale, `/draft/r/${code}`, fill(x.title, { code }), x.description, undefined, { noindex: true });
}

export default async function DraftRoomPage({ params }: { params: Params }) {
  const p = await params;
  const { locale, dict: d } = await resolveLocale(Promise.resolve({ locale: p.locale }));
  const x = draftLabels[locale];
  const O = x.online;
  const code = normalizeRoomCode(p.code);
  const path = href(locale, `/draft/r/${code ?? p.code}`);
  const draftHref = href(locale, "/draft");
  const { user } = await currentUser();
  const result = code && user ? await loadDraftRoom(code) : null;

  let body: React.ReactNode;
  if (!code) {
    body = <Notice text={O.notFound} draftHref={draftHref} label={O.newDraft} />;
  } else if (!user) {
    body = (
      <section className="felt-panel-mint max-w-2xl space-y-4 p-5">
        <h2 className="t-section">{O.vsFriend}</h2>
        <p className="text-sm text-chalk">{O.signinNeeded}</p>
        <a href={`${href(locale, "/login")}?next=${encodeURIComponent(path)}`} className="btn btn-primary">
          {O.signin}
        </a>
      </section>
    );
  } else if (!result || !result.ok) {
    const err = result && !result.ok ? result.error : "generic";
    const text = err === "not_found" ? O.notFound : ((O.errors as Record<string, string>)[err] ?? O.errors.generic);
    body = <Notice text={text} draftHref={draftHref} label={O.newDraft} />;
  } else {
    const bySlug = new Map(activeCards.map((c) => [c.slug, c]));
    const cards: DraftUiCard[] = draftPool().map((c) => {
      const card = bySlug.get(c.slug)!;
      return { ...c, name: card.name, key: card.key, image: card.image, thumb: card.thumb, ability: card.ability?.[locale] };
    });
    body = (
      <DraftRoom
        initial={result}
        cards={cards}
        labels={x}
        builderHref={href(locale, "/deck-builder")}
        draftHref={draftHref}
        roomBase={href(locale, "/draft/r")}
        roomUrl={`${siteUrl}${path}`}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{x.kicker}</p>
      <h1 className="t-page mt-2">{x.h1}</h1>
      <div className="mt-6">{body}</div>
      <p className="mt-12 text-xs text-chalk-muted">{d.common.notAffiliated}</p>
    </div>
  );
}

function Notice({ text, draftHref, label }: { text: string; draftHref: string; label: string }) {
  return (
    <section className="felt-panel max-w-2xl space-y-4 p-5">
      <h2 className="t-section">{text}</h2>
      <a href={draftHref} className="btn btn-ghost">
        {label}
      </a>
    </section>
  );
}
