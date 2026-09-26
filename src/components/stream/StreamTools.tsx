"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import {
  botCommands,
  chatEndpoint,
  deckImagePath,
  fill,
  imageVersion,
  OVERLAY_SIZE,
  overlayUrl,
  shortLinkUrl,
  type DeckImageFormat,
  type OverlayLayout,
} from "@/lib/stream";
import type { StreamLabels } from "@/lib/streamLabels";
import { CopyButton } from "@/components/CopyButton";

/**
 * Strumenti per le dirette nell'interfaccia (pacchetto STREAM, 26/09/2026): il menu "Per le dirette" della scheda di
 * un mazzo (`DeckStreamTools`) e le istruzioni del pannello /account (`AccountStreamGuide`). Tutto in un <details>
 * chiuso, così la scheda del mazzo non si riempie di comandi per chi non fa dirette; si apre da solo per il
 * proprietario del mazzo (sessione letta nel browser: la scheda è ISR) e in /account per chi ha già un mazzo pubblicato.
 * Il contenuto si disegna solo alla prima apertura: nell'HTML della scheda (ISR, indicizzata) resta il solo titolo,
 * niente testo ripetuto su ogni mazzo né link verso l'overlay e le immagini da far seguire a Googlebot (quelli che
 * compaiono dopo hanno comunque nofollow, e robots.txt chiude /overlay/ e i download).
 *
 * Comando di chat e overlay di un mazzo preciso si offrono solo al suo proprietario: mettono in onda (e fanno scrivere
 * al bot, che è moderatore) il nome del mazzo e delle carte inserite a mano, testi che l'autore può cambiare quando
 * vuole. Agli altri restano link breve e immagini (una fotografia del mazzo), più il rimando agli strumenti del
 * proprio account, che seguono i propri mazzi.
 *
 * Indirizzi: quelli del sito (`site`, originsmeta.com) nel primo disegno; nel browser si passa all'indirizzo della
 * pagina, così nelle anteprime di Vercel e in locale i link copiati e le anteprime puntano allo stesso sito della demo.
 * In produzione i due indirizzi coincidono. Misura: `stream_tools_open`, `stream_tool_copy`, `deck_image_download`
 * (catalogo in src/lib/analytics.ts).
 */

type Placement = "deck_page" | "account";

/** L'indirizzo del sito da usare nei link: `site` sul server e al primo disegno, poi quello della pagina. */
function useSiteOrigin(site: string): string {
  const [origin, setOrigin] = useState(site);
  useEffect(() => {
    // letto dopo il montaggio per non cambiare il primo disegno (idratazione)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);
  return origin;
}

/** Una riga: etichetta, valore da copiare (a capo dove serve, mai più largo dello schermo), tasto Copia e anteprima. */
function CopyRow({
  label,
  value,
  tool,
  placement,
  copy,
  copied,
  preview,
}: {
  label: string;
  value: string;
  tool: string;
  placement: Placement;
  copy: string;
  copied: string;
  preview?: { href: string; label: string };
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center sm:gap-2">
      <span className="text-xs font-semibold text-pale-muted">{label}</span>
      <code className="min-w-0 break-all rounded-md bg-night-3 px-2 py-1 font-mono text-xs text-chalk">{value}</code>
      <span className="flex flex-wrap items-center gap-2">
        <CopyButton
          text={value}
          label={copy}
          copied={copied}
          ariaLabel={`${copy}: ${label}`}
          className="btn btn-ink text-xs"
          event={{ name: "stream_tool_copy", params: { tool, placement } }}
        />
        {preview ? (
          <a href={preview.href} target="_blank" rel="nofollow noopener" className="text-xs font-semibold text-mint underline-offset-2 hover:underline">
            {preview.label} ↗
          </a>
        ) : null}
      </span>
    </div>
  );
}

function Block({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="kicker text-mint">{title}</h3>
      {hint ? <p className="max-w-2xl text-xs text-pale-muted">{hint}</p> : null}
      {children}
    </section>
  );
}

/**
 * Il <details> dei due pannelli: conta l'apertura fatta a mano (non quella automatica) e disegna il contenuto solo
 * dalla prima apertura in poi (poi resta, così chiudere e riaprire non rifà niente).
 */
function StreamDetails({
  summary,
  placement,
  autoOpen,
  className,
  children,
}: {
  summary: ReactNode;
  placement: Placement;
  autoOpen: boolean;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const automatic = useRef(false);
  const counted = useRef(false);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (autoOpen && el && !el.open) {
      automatic.current = true;
      el.open = true;
    }
  }, [autoOpen]);
  return (
    <details
      ref={ref}
      className={className}
      onToggle={(e) => {
        if (!e.currentTarget.open) return;
        setOpened(true);
        if (automatic.current) {
          automatic.current = false;
          return;
        }
        if (counted.current) return;
        counted.current = true;
        trackEvent("stream_tools_open", { placement });
      }}
    >
      {summary}
      {opened ? children : null}
    </details>
  );
}

function overlayHint(labels: StreamLabels["tools"]): string {
  const v = OVERLAY_SIZE.vertical;
  const h = OVERLAY_SIZE.horizontal;
  return fill(labels.overlayHint, { vw: String(v.width), vh: String(v.height), hw: String(h.width), hh: String(h.height) });
}

/**
 * Menu "Per le dirette" nella scheda di un mazzo pubblicato: link breve e le due immagini da scaricare per tutti; per il
 * proprietario anche il comando di chat per questo mazzo e l'overlay per OBS (verticale e orizzontale), agli altri il
 * rimando agli strumenti del loro account. Chiuso per tutti, aperto da solo per il proprietario.
 */
export function DeckStreamTools({
  slug,
  ownerId,
  updatedAt,
  locale,
  site,
  labels,
}: {
  slug: string;
  ownerId: string;
  updatedAt: string;
  locale: string;
  site: string;
  labels: StreamLabels["tools"];
}) {
  const origin = useSiteOrigin(site);
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setIsOwner(data.session?.user.id === ownerId);
    });
    return () => {
      alive = false;
    };
  }, [ownerId]);

  const placement: Placement = "deck_page";
  const chat = botCommands(chatEndpoint(origin, { deck: slug }, locale));
  const overlay = (layout: OverlayLayout) => overlayUrl(origin, { deck: slug }, layout, locale);
  const version = imageVersion(updatedAt);
  const images: { format: DeckImageFormat; label: string }[] = [
    { format: "16x9", label: labels.download16x9 },
    { format: "9x16", label: labels.download9x16 },
  ];
  const row = { placement, copy: labels.copy, copied: labels.copied };

  return (
    <StreamDetails
      placement={placement}
      autoOpen={isOwner}
      className="card-night mt-6 p-4 text-sm"
      summary={
        <summary className="cursor-pointer marker:text-mint">
          <h2 className="inline font-body text-sm font-semibold text-pale">{labels.summary}</h2>
        </summary>
      }
    >
      <div className="mt-3 space-y-5">
        <p className="max-w-2xl text-xs text-pale-muted">{labels.intro}</p>
        <Block title={labels.shortLink} hint={labels.shortLinkHint}>
          <CopyRow {...row} label={labels.shortLink} value={shortLinkUrl(origin, slug)} tool="short_link" />
        </Block>
        {isOwner ? (
          <>
            <Block title={labels.chat} hint={labels.chatHint}>
              <CopyRow {...row} label={labels.nightbot} value={chat.nightbot} tool="chat_nightbot" />
              <CopyRow {...row} label={labels.streamelements} value={chat.streamelements} tool="chat_streamelements" />
            </Block>
            <Block title={labels.overlay} hint={overlayHint(labels)}>
              {(["vertical", "horizontal"] as const).map((layout) => (
                <CopyRow
                  {...row}
                  key={layout}
                  label={labels[layout]}
                  value={overlay(layout)}
                  tool={`overlay_${layout}`}
                  preview={{ href: overlay(layout), label: labels.open }}
                />
              ))}
            </Block>
          </>
        ) : null}
        <Block title={labels.image} hint={labels.imageHint}>
          <div className="flex flex-wrap gap-2">
            {images.map(({ format, label }) => (
              <a
                key={format}
                href={deckImagePath(slug, format, locale, version, true)}
                download
                rel="nofollow"
                className="btn btn-ink text-xs"
                onClick={() => trackEvent("deck_image_download", { format, placement })}
              >
                {label}
              </a>
            ))}
          </div>
        </Block>
        {isOwner ? null : (
          <p className="max-w-2xl text-xs text-pale-muted">
            {labels.ownerOnly}{" "}
            <a href={`/${locale}/account`} className="font-semibold text-mint underline-offset-2 hover:underline">
              {labels.accountLink}
            </a>
          </p>
        )}
      </div>
    </StreamDetails>
  );
}

/**
 * Istruzioni per le dirette nel pannello privato /account: il comando !deck per Nightbot, StreamElements e Fossabot e
 * l'overlay per OBS, sempre sull'ultimo mazzo pubblicato dell'utente (?u=<nome utente>). Lingua della risposta: quella
 * della pagina (lang=…), con la frase che spiega come cambiarla.
 */
export function AccountStreamGuide({
  username,
  locale,
  site,
  hasDecks,
  labels,
  tools,
}: {
  username: string;
  locale: string;
  site: string;
  hasDecks: boolean;
  labels: StreamLabels["account"];
  tools: StreamLabels["tools"];
}) {
  const origin = useSiteOrigin(site);
  const placement: Placement = "account";
  const bots = botCommands(chatEndpoint(origin, { user: username }, locale));
  const row = { placement, copy: tools.copy, copied: tools.copied };
  return (
    <StreamDetails
      placement={placement}
      autoOpen={hasDecks}
      className="card-night mt-12 p-5 sm:p-6"
      summary={
        <summary className="cursor-pointer">
          <h2 className="t-section inline">{labels.title}</h2>
        </summary>
      }
    >
      <div className="mt-3 space-y-6">
        <p className="max-w-2xl text-sm text-chalk-muted">{labels.intro}</p>
        {hasDecks ? null : <p className="rounded-lg border-2 border-gold bg-gold/10 p-3 text-xs text-pale">{labels.noDecks}</p>}
        <Block title={labels.command} hint={labels.commandHint}>
          <CopyRow {...row} label={tools.nightbot} value={bots.nightbot} tool="chat_nightbot" />
          <CopyRow {...row} label={tools.streamelements} value={bots.streamelements} tool="chat_streamelements" />
          <CopyRow {...row} label={labels.fossabot} value={bots.fossabot} tool="chat_fossabot" />
          <p className="text-xs text-pale-muted">{fill(labels.langHint, { lang: labels.langName, code: locale })}</p>
        </Block>
        <Block title={labels.overlay} hint={overlayHint(tools)}>
          {(["vertical", "horizontal"] as const).map((layout) => {
            const url = overlayUrl(origin, { user: username }, layout, locale);
            return <CopyRow {...row} key={layout} label={tools[layout]} value={url} tool={`overlay_${layout}`} preview={{ href: url, label: tools.open }} />;
          })}
        </Block>
      </div>
    </StreamDetails>
  );
}
