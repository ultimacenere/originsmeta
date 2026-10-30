"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { fillCode } from "@/lib/forCreators";
import type { Locale } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

/*
  Le righe da copiare della pagina per i creator (/for-creators, 30/10/2026), con il nome utente già dentro quando chi
  legge ha fatto l'accesso (Pierluigi: "a prova di scemo"). La pagina resta statica: il nome lo legge il browser, una
  volta sola per tutte le righe (promessa condivisa), come AccountMenu nell'header. Senza accesso al posto di {user}
  resta il segnaposto della lingua ("TUO-NOME-UTENTE").
*/

let usernamePromise: Promise<string | null> | null = null;

function loadUsername(): Promise<string | null> {
  usernamePromise ??= (async () => {
    const sb = supabaseBrowser();
    if (!sb) return null;
    const {
      data: { session },
    } = await sb.auth.getSession();
    const id = session?.user?.id;
    if (!id) return null;
    const { data } = await sb.from("profiles").select("username").eq("id", id).maybeSingle();
    return (data as { username?: string | null } | null)?.username || null;
  })().catch(() => null);
  return usernamePromise;
}

/** Il nome utente di chi legge: undefined finché non si sa, null senza accesso. */
function useMyUsername(): string | null | undefined {
  const [name, setName] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    loadUsername().then((n) => alive && setName(n));
    return () => {
      alive = false;
    };
  }, []);
  return name;
}

/** Una riga da copiare: etichetta facoltativa (il nome del bot), il testo in monospazio e il tasto "Copia". */
export function CreatorCode({
  code,
  lang,
  placeholder,
  label,
  copy,
  copied,
  tool,
}: {
  code: string;
  lang: Locale;
  /** al posto di {user} senza accesso */
  placeholder: string;
  label?: string;
  copy: string;
  copied: string;
  /** strumento per l'evento stream_tool_copy (placement for_creators) */
  tool: string;
}) {
  const user = useMyUsername();
  const text = fillCode(code, { user: user || placeholder, lang });
  return (
    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 rounded-lg border-2 border-felt-line bg-felt-deep/70 p-2">
      {label ? <span className="font-mono text-[11px] uppercase tracking-wider text-mint">{label}</span> : null}
      <code className="min-w-0 flex-1 basis-56 break-all font-mono text-xs text-chalk sm:text-sm">{text}</code>
      <CopyButton
        text={text}
        label={copy}
        copied={copied}
        ariaLabel={label ? `${copy}: ${label}` : undefined}
        event={{ name: "stream_tool_copy", params: { tool, placement: "for_creators" } }}
      />
    </div>
  );
}

/** La riga sopra le guide: "hanno già il tuo nome utente" oppure come riempirle (con il link per accedere). */
export function CreatorUserNote({ filled, notFilled, signIn, loginHref }: { filled: string; notFilled: string; signIn: string; loginHref: string }) {
  const user = useMyUsername();
  if (user === undefined) return <p className="min-h-6 text-sm text-pale-muted" aria-hidden="true" />;
  if (user) return <p className="text-sm text-mint">{filled.replace("{user}", user)}</p>;
  return (
    <p className="text-sm text-pale">
      {notFilled}{" "}
      <Link href={loginHref} prefetch={false} className="link-mint font-bold">
        {signIn} →
      </Link>
    </p>
  );
}
