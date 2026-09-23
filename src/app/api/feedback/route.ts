import { NextResponse } from "next/server";
import { locales, siteUrl } from "@/lib/i18n";
import { discordWebhookUrl, escapeDiscord, sendDiscordWebhook, type DiscordEmbedField } from "@/lib/discordWebhook";
import { captchaValido, indirizzoIp, limiteInvii, lunghezza, stessaOrigine, testoSemplice } from "@/lib/formGuard";
import { FEEDBACK_EMAIL_MAX, FEEDBACK_EMAIL_RE, FEEDBACK_MAX, FEEDBACK_MIN, feedbackEnabled, type FeedbackApiError } from "@/lib/feedbackLabels";

/**
 * Messaggi del pop-up dei feedback (`src/components/FeedbackWidget.tsx`, richiesta del 22/09/2026).
 * Il messaggio va in un canale Discord PRIVATO dello staff tramite webhook (decisione di Pierluigi): nessun
 * database, nessuna copia sul sito.
 *
 * GET  → { attivo }: il widget lo chiede prima di aprirsi da solo, così non propone un modulo che non arriverebbe.
 * POST { message, email?, page, locale, token? } → { ok: true } oppure { errore: <codice> } (codici in
 *      `FeedbackApiError`, `src/lib/feedbackLabels.ts`).
 *
 * Difese, in ordine: stessa origine e JSON (una pagina di un altro sito non può spedire a nome dei visitatori),
 * corpo piccolo, validazione (lunghezze, email se presente, pagina come semplice percorso), limite per
 * indirizzo IP (3 messaggi ogni 10 minuti, in memoria come `/api/ask`), CAPTCHA Turnstile verificato qui con
 * TURNSTILE_SECRET_KEY se configurata (stessa verifica di `/api/ask`). Il testo arriva a Discord come testo
 * semplice: tag HTML tolti, formattazione e menzioni annullate (`escapeDiscord`) e `allowed_mentions` vuoto.
 * Limite, CAPTCHA, origine e testo semplice stanno in `src/lib/formGuard.ts`, condivisi con il modulo delle guide.
 *
 * Variabili d'ambiente (Vercel → Settings → Environment Variables, poi un nuovo deploy):
 * - DISCORD_FEEDBACK_WEBHOOK_URL (solo server, segreto): URL del webhook del canale privato. Senza, la rotta
 *   risponde 503 "disattivato" e il widget lo dice apertamente, con le alternative (Discord, email dello staff).
 *   Lo usa anche "Mandaci la tua guida" (`/api/guide-submission`): non va tolta quando si spegne il feedback.
 * - NEXT_PUBLIC_FEEDBACK=off spegne widget e rotta dopo il rodaggio.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 3 messaggi ogni 10 minuti per indirizzo IP. */
const limite = limiteInvii({ finestraMs: 10 * 60_000, massimo: 3 });
/** Corpo massimo accettato: messaggio, email, pagina e token Turnstile ci stanno con largo margine. */
const MAX_CORPO = 8_000;
const MAX_PAGINA = 200;
const MAX_TOKEN = 2_048;
/** Colore menta del sito (--color-mint #31e3bd) per la barra laterale dell'embed. */
const COLORE_MENTA = 0x31e3bd;

/** URL del webhook, oppure null se il feedback è spento o la variabile manca (o non è un webhook Discord). */
function webhook(): string | null {
  return feedbackEnabled ? discordWebhookUrl("DISCORD_FEEDBACK_WEBHOOK_URL") : null;
}

function errore(codice: FeedbackApiError, stato: number) {
  return NextResponse.json({ errore: codice }, { status: stato, headers: { "cache-control": "no-store" } });
}

/** La pagina di provenienza è solo un percorso del sito (/it/cards/...): tutto il resto si scarta. */
function percorso(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const p = v.trim();
  return p.length <= MAX_PAGINA && /^\/[A-Za-z0-9\-._~/%]*$/.test(p) ? p : null;
}

export async function GET() {
  return NextResponse.json({ attivo: webhook() !== null }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const url = webhook();
  if (!url) return errore("disattivato", 503);

  // JSON obbligatorio: un modulo o una richiesta "semplice" di un altro sito non passano (servirebbe il preflight
  // CORS). Si confronta il solo tipo, prima del punto e virgola: `text/plain;charset=application/json` non passa.
  const tipo = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!stessaOrigine(req) || tipo !== "application/json") {
    return errore("richiesta", 400);
  }
  // corpo dichiarato troppo grande: si scarta prima di leggerlo
  if (Number(req.headers.get("content-length") ?? 0) > MAX_CORPO) return errore("lungo", 413);

  let corpo: { message?: unknown; email?: unknown; page?: unknown; locale?: unknown; token?: unknown };
  try {
    const grezzo = await req.text();
    if (grezzo.length > MAX_CORPO) return errore("lungo", 413);
    corpo = JSON.parse(grezzo);
  } catch {
    return errore("richiesta", 400);
  }
  if (!corpo || typeof corpo !== "object") return errore("richiesta", 400);

  const messaggio = typeof corpo.message === "string" ? testoSemplice(corpo.message) : "";
  if (lunghezza(messaggio) < FEEDBACK_MIN) return errore("corto", 400);
  if (lunghezza(messaggio) > FEEDBACK_MAX) return errore("lungo", 400);

  const email = typeof corpo.email === "string" ? corpo.email.trim() : "";
  if (email && (email.length > FEEDBACK_EMAIL_MAX || !FEEDBACK_EMAIL_RE.test(email))) return errore("email", 400);

  const pagina = percorso(corpo.page);
  const locale = (locales as readonly string[]).includes(String(corpo.locale)) ? String(corpo.locale) : "en";
  const token = typeof corpo.token === "string" && corpo.token.length <= MAX_TOKEN ? corpo.token : undefined;

  // conta solo i messaggi che partono davvero: chi sbaglia lunghezza, email o CAPTCHA, o incappa in un errore di
  // Discord, non si brucia i tentativi
  const ip = indirizzoIp(req);
  if (limite.troppi(ip)) return errore("troppe", 429);
  // controllo e registrazione senza un await in mezzo: le richieste in parallelo non passano tutte
  const inviato = limite.registra(ip);

  if (!(await captchaValido(token, ip, "feedback"))) {
    limite.annulla(ip, inviato);
    return errore("captcha", 403);
  }

  const adesso = new Date();
  const campi: DiscordEmbedField[] = [
    // il percorso è già ristretto a caratteri sicuri: resta un link cliccabile per lo staff
    { name: "Pagina", value: pagina ? `${siteUrl}${pagina}` : "(non indicata)" },
    { name: "Lingua", value: locale.toUpperCase(), inline: true },
  ];
  // l'email sta in un blocco di codice (testo letterale, senza spazi invisibili): lo staff la copia così com'è
  if (email) campi.push({ name: "Email (per rispondere)", value: `\`${email}\``, inline: true });
  // <t:…:F> è la data nel formato di Discord: ognuno la vede nel proprio fuso orario
  campi.push({ name: "Data", value: `<t:${Math.floor(adesso.getTime() / 1000)}:F>`, inline: true });

  const esito = await sendDiscordWebhook(url, {
    username: "OriginsMeta · feedback",
    embeds: [
      {
        title: "Nuovo feedback dal sito",
        description: escapeDiscord(messaggio),
        color: COLORE_MENTA,
        fields: campi,
        timestamp: adesso.toISOString(),
        footer: { text: "originsmeta.com · pop-up dei feedback" },
      },
    ],
  });
  if (!esito.ok) {
    limite.annulla(ip, inviato);
    return errore("invio", 502);
  }

  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
