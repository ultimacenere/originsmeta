"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Turnstile } from "@/components/Turnstile";
import { DiscordButton } from "@/components/DiscordButton";
import { turnstileEnabled } from "@/lib/turnstile";

/**
 * Campo domanda della pagina FAQ. La risposta la costruisce il server dai dati del sito
 * (`/api/ask` → `src/lib/faq/`), qui si gestiscono solo attesa, errori e fonti.
 * I suggerimenti riempiono il campo, non lo sostituiscono: la domanda resta libera.
 *
 * Accessibilità: l'errore sta in un contenitore `role="alert"` e la risposta in uno `aria-live="polite"`,
 * tutti e due sempre presenti nella pagina (un'area live aggiunta insieme al suo testo spesso non viene
 * letta); il tasto porta `aria-busy` mentre la risposta arriva.
 */

type Fonte = { tipo: "card" | "guide" | "event"; slug: string; nome: string; href: string };

export type AskLabels = {
  placeholder: string;
  send: string;
  sending: string;
  suggestions: string;
  sources: string;
  disclaimer: string;
  errors: { corta: string; troppe: string; captcha: string; disabilitato: string; generico: string };
};

/** Le due strade quando l'assistente non risponde: il database carte e il Discord ufficiale. */
export type AskExits = { cardsLabel: string; cardsHref: string; discordLabel: string; discordHref: string };

type CodiceErrore = keyof AskLabels["errors"];

const MAX = 300;

export function AskBox({ locale, labels, suggerimenti, hrefPrefix, exits }: { locale: string; labels: AskLabels; suggerimenti: string[]; hrefPrefix: string; exits?: AskExits }) {
  const [domanda, setDomanda] = useState("");
  const [stato, setStato] = useState<"fermo" | "attesa">("fermo");
  const [risposta, setRisposta] = useState<{ testo: string; fonti: Fonte[] } | null>(null);
  const [errore, setErrore] = useState<CodiceErrore | null>(null);
  const [captcha, setCaptcha] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);

  async function chiedi(testo: string) {
    const q = testo.trim();
    if (q.length < 5) {
      setErrore("corta");
      return;
    }
    setStato("attesa");
    setErrore(null);
    setRisposta(null);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domanda: q, locale, captcha }),
      });
      if (!r.ok) {
        const { errore: codice } = (await r.json().catch(() => ({ errore: "generico" }))) as { errore?: string };
        setErrore(codice && codice in labels.errors ? (codice as CodiceErrore) : "generico");
        return;
      }
      const dati = (await r.json()) as { risposta: string; fonti: Fonte[] };
      setRisposta({ testo: dati.risposta, fonti: dati.fonti ?? [] });
    } catch {
      setErrore("generico");
    } finally {
      setStato("fermo");
    }
  }

  // Assistente spento o guasto: oltre al messaggio, le due strade che rispondono comunque.
  const conUscite = errore === "disabilitato" || errore === "generico";

  return (
    <div className="card-night p-5 sm:p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void chiedi(domanda);
        }}
      >
        <label htmlFor="faq-domanda" className="sr-only">
          {labels.placeholder}
        </label>
        <textarea
          id="faq-domanda"
          ref={campo}
          value={domanda}
          maxLength={MAX}
          rows={2}
          onChange={(e) => setDomanda(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void chiedi(domanda);
            }
          }}
          placeholder={labels.placeholder}
          className="w-full resize-y rounded-lg border border-felt-line bg-felt-deep px-3 py-2.5 text-base text-chalk focus:border-mint"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={stato === "attesa"} aria-busy={stato === "attesa"} className="btn btn-primary">
            {stato === "attesa" ? labels.sending : labels.send}
          </button>
          <span className="font-mono text-xs text-chalk-muted">
            {domanda.length}/{MAX}
          </span>
          {turnstileEnabled ? <Turnstile onToken={(t) => setCaptcha(t ?? "")} /> : null}
        </div>
      </form>

      <div className="mt-4">
        <p className="kicker text-chalk-muted">{labels.suggestions}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {suggerimenti.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => {
                  setDomanda(s);
                  campo.current?.focus();
                }}
                className="stat-pill border border-sky text-xs text-pale hover:border-mint hover:text-mint"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div role="alert">
        {errore ? (
          <div className="alert-bad mt-4">
            <p>{labels.errors[errore]}</p>
            {conUscite && exits ? (
              <p className="mt-3 flex flex-wrap items-center gap-2">
                <Link href={exits.cardsHref} className="btn btn-primary text-xs">
                  {exits.cardsLabel} →
                </Link>
                <DiscordButton href={exits.discordHref} size="sm">
                  {exits.discordLabel}
                </DiscordButton>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div aria-live="polite">
        {risposta ? (
          <div className="mt-5 border-t border-sky pt-5">
            <p className="whitespace-pre-line text-pale">{risposta.testo}</p>
            {risposta.fonti.length ? (
              <div className="mt-4">
                <p className="kicker text-chalk-muted">{labels.sources}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {risposta.fonti.map((f) => (
                    <li key={`${f.tipo}-${f.slug}`}>
                      <Link href={`${hrefPrefix}${f.href}`} className="btn btn-ghost text-xs">
                        {f.nome}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-4 text-xs text-chalk-muted">{labels.disclaimer}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
