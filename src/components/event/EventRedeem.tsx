"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatCode, isCodeShape, normalizeCode } from "@/lib/event/codes";
import { eventLabels as L, fillEvent } from "@/lib/event/labels";
import { eventPath } from "@/lib/event/links";
import { myCodes, redeemCode } from "@/lib/event/actions";
import type { RedeemStatus } from "@/lib/event/types";
import { trackNamedEvent } from "@/lib/analytics";
import { useEventData } from "./EventLive";

/**
 * Riscatto di un codice del giveaway (10/11/2026). Dalle note: "Il codice viene riscattato sulla pagina Origins Meta:
 * registrazione + inserimento stringa", "Il sito risponde con istruzioni per ritirare il pacchetto fisico",
 * "Obiettivo: 125+ nuovi iscritti al sito". Senza accesso il codice resta nel browser (un'ora) mentre si accede o ci si
 * iscrive, e al ritorno la pagina scorre qui con il codice già scritto. La pagina resta ISR: la sessione si legge qui.
 */

const PENDING_TTL_MS = 3600_000;
const pendingKey = (slug: string) => `originsmeta.event.${slug}.code`;

function readPending(slug: string): string | null {
  try {
    const raw = localStorage.getItem(pendingKey(slug));
    if (!raw) return null;
    const { code, at } = JSON.parse(raw) as { code?: string; at?: number };
    if (typeof code !== "string" || typeof at !== "number" || Date.now() - at > PENDING_TTL_MS) {
      localStorage.removeItem(pendingKey(slug));
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

function writePending(slug: string, code: string | null) {
  try {
    if (code) localStorage.setItem(pendingKey(slug), JSON.stringify({ code, at: Date.now() }));
    else localStorage.removeItem(pendingKey(slug));
  } catch {
    /* storage bloccato: il codice va riscritto dopo l'accesso */
  }
}

function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      queueMicrotask(() => setSignedIn(false));
      return;
    }
    let alive = true;
    sb.auth
      .getSession()
      .then(({ data: { session } }) => alive && setSignedIn(Boolean(session?.user)))
      .catch(() => alive && setSignedIn(false));
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_e, session) => alive && setSignedIn(Boolean(session?.user)));
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  return signedIn;
}

const fmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

export function EventRedeem({ slug, kicker }: { slug: string; kicker?: string }) {
  const data = useEventData();
  const signedIn = useSignedIn();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<RedeemStatus | "shape" | null>(null);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<{ code: string; at: string }[]>([]);
  const box = useRef<HTMLElement>(null);
  const router = useRouter();

  // al ritorno dall'accesso: il codice scritto prima torna nel campo e la pagina scorre qui
  useEffect(() => {
    const pending = readPending(slug);
    if (!pending) return;
    queueMicrotask(() => {
      setCode(formatCode(pending));
      box.current?.scrollIntoView({ block: "center" });
    });
  }, [slug]);

  useEffect(() => {
    if (signedIn) void myCodes(slug).then(setMine);
  }, [signedIn, slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeShape(code)) {
      setStatus("shape");
      return;
    }
    if (!signedIn) {
      writePending(slug, normalizeCode(code));
      trackNamedEvent("event_redeem_signin", { placement: "event_page" });
      router.push(`/it/login?next=${encodeURIComponent(eventPath(slug))}`);
      return;
    }
    setBusy(true);
    try {
      const r = await redeemCode(slug, code);
      setStatus(r);
      trackNamedEvent("event_code_redeem", { result: r });
      if (r === "ok" || r === "mine") {
        writePending(slug, null);
        setMine(await myCodes(slug));
      }
    } catch {
      setStatus("unavailable");
    } finally {
      setBusy(false);
    }
  };

  const pickup = data.config.pickup || L.redeem.pickupPending;
  const message = status === "shape" ? L.redeem.shape : status ? fillEvent(L.redeem.result[status], { max: data.config.maxCodesPerUser }) : null;
  const good = status === "ok" || status === "mine";

  return (
    <section ref={box} id="codice" className="ev-redeem card-night scroll-mt-24 p-5 sm:p-6" aria-labelledby="ev-redeem">
      {kicker ? <p className="ev-head-k">{kicker}</p> : null}
      <h2 id="ev-redeem" className="ev-redeem-title t-section text-sky">
        {L.redeem.title}
      </h2>
      <p className="mt-2 text-pale">{L.redeem.intro}</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1 text-sm text-pale">
          {L.redeem.label}
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().slice(0, 24));
              setStatus(null);
            }}
            placeholder={L.redeem.placeholder}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            aria-describedby="ev-redeem-msg"
            aria-invalid={status && !good ? true : undefined}
            className="mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 font-mono text-lg tracking-[0.15em] text-chalk placeholder:text-pale-muted/60 focus:border-mint"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy || signedIn === null || !code.trim()}>
          {busy ? L.redeem.working : signedIn === false ? L.redeem.signIn : L.redeem.submit}
        </button>
      </form>
      {signedIn === false ? <p className="mt-2 text-xs text-pale-muted">{L.redeem.signInNote}</p> : null}
      <p id="ev-redeem-msg" role="status" className={`mt-3 min-h-5 text-sm font-bold ${good ? "text-mint" : "text-gold"}`}>
        {message}
      </p>
      {good || mine.length ? (
        <div className="mt-3 rounded-xl border-2 border-mint bg-night-2/70 p-4">
          {mine.length ? (
            <>
              <p className="text-xs uppercase tracking-wider text-pale-muted">{L.redeem.mine}</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {mine.map((m) => (
                  <li key={m.code} className="rounded-md bg-night-3 px-2 py-1 font-mono text-sm text-chalk">
                    {formatCode(m.code)} <span className="text-xs text-pale-muted">· {fmt.format(Date.parse(m.at))}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="mt-3 font-display text-sm font-bold text-sky">{L.redeem.pickup}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-pale">{pickup}</p>
        </div>
      ) : null}
    </section>
  );
}
