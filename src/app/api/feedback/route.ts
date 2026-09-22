import { NextResponse } from "next/server";
import { locales, siteUrl } from "@/lib/i18n";
import { discordWebhookUrl, escapeDiscord, sendDiscordWebhook, type DiscordEmbedField } from "@/lib/discordWebhook";
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
 *
 * Variabili d'ambiente (Vercel → Settings → Environment Variables, poi un nuovo deploy):
 * - DISCORD_FEEDBACK_WEBHOOK_URL (solo server, segreto): URL del webhook del canale privato. Senza, la rotta
 *   risponde 503 "disattivato" e il widget lo dice apertamente, con le alternative (Discord, email dello staff).
 * - NEXT_PUBLIC_FEEDBACK=off spegne widget e rotta dopo il rodaggio.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FINESTRA_MS = 10 * 60_000;
const MAX_PER_FINESTRA = 3;
/** Corpo massimo accettato: messaggio, email, pagina e token Turnstile ci stanno con largo margine. */
const MAX_CORPO = 8_000;
const MAX_PAGINA = 200;
const MAX_TOKEN = 2_048;
/** Colore menta del sito (--color-mint #31e3bd) per la barra laterale dell'embed. */
const COLORE_MENTA = 0x31e3bd;

/** Limite di frequenza in memoria: basta a fermare il rumore, si azzera a ogni riavvio dell'istanza. */
const recenti = new Map<string, number[]>();
/** Indirizzi tenuti al massimo: oltre, si tolgono i più vecchi (la Map conserva l'ordine d'inserimento). */
const MAX_INDIRIZZI = 5000;

function inFinestra(ip: string): number[] {
  const ora = Date.now();
  return (recenti.get(ip) ?? []).filter((t) => ora - t < FINESTRA_MS);
}

/** Vero se l'indirizzo ha già mandato il massimo dei messaggi nella finestra. Non conta nulla: vedi `registraInvio`. */
function troppiMessaggi(ip: string): boolean {
  // gli indirizzi scaduti si tolgono subito: la mappa tiene solo quelli degli ultimi 10 minuti (vedi l'informativa)
  const ora = Date.now();
  for (const [chiave, tempi] of recenti) if (tempi.every((t) => ora - t >= FINESTRA_MS)) recenti.delete(chiave);
  return inFinestra(ip).length >= MAX_PER_FINESTRA;
}

/**
 * Conta un messaggio valido subito dopo il controllo (prima di CAPTCHA e invio, così cento richieste in parallelo
 * non passano tutte); se il CAPTCHA fallisce o Discord lo rifiuta, `annullaInvio` lo toglie: un token scaduto o
 * un errore di Discord non bruciano uno dei tre tentativi di chi scrive. L'indirizzo si reinserisce in coda, così
 * i più vecchi sono i primi a uscire quando la mappa è piena (niente più `clear()`, che azzerava il conteggio di
 * tutti e si poteva provocare apposta).
 */
function registraInvio(ip: string): number {
  const adesso = Date.now();
  const tempi = [...inFinestra(ip), adesso];
  recenti.delete(ip);
  recenti.set(ip, tempi);
  while (recenti.size > MAX_INDIRIZZI) {
    const primo = recenti.keys().next().value;
    if (primo === undefined) break;
    recenti.delete(primo);
  }
  return adesso;
}

function annullaInvio(ip: string, quando: number) {
  const tempi = recenti.get(ip);
  if (!tempi) return;
  const i = tempi.indexOf(quando);
  if (i >= 0) tempi.splice(i, 1);
  if (!tempi.length) recenti.delete(ip);
}

/** Il CAPTCHA del pannello si vede ma non si verifica: lo diciamo nei log, una volta per istanza. */
let avvisoCaptcha = false;

/** Verifica del token Turnstile con la chiave segreta (solo se configurata su Vercel): stessa logica di /api/ask. */
async function captchaValido(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Senza chiave segreta il widget (acceso da NEXT_PUBLIC_TURNSTILE_SITE_KEY) resta di facciata: va impostata su Vercel
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !avvisoCaptcha) {
      avvisoCaptcha = true;
      console.error("[feedback] TURNSTILE_SECRET_KEY mancante: il CAPTCHA del pannello non viene verificato");
    }
    return true; // CAPTCHA non ancora acceso: la rotta resta usabile
  }
  if (!token) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const esito = (await r.json()) as { success?: boolean };
    return Boolean(esito.success);
  } catch {
    return false;
  }
}

/** URL del webhook, oppure null se il feedback è spento o la variabile manca (o non è un webhook Discord). */
function webhook(): string | null {
  return feedbackEnabled ? discordWebhookUrl("DISCORD_FEEDBACK_WEBHOOK_URL") : null;
}

function errore(codice: FeedbackApiError, stato: number) {
  return NextResponse.json({ errore: codice }, { status: stato, headers: { "cache-control": "no-store" } });
}

/**
 * Testo semplice: fine riga uniformi, niente caratteri di controllo né caratteri invisibili di direzione,
 * niente tag HTML, al massimo una riga vuota di fila. Il resto (formattazione Discord, menzioni) lo annulla
 * `escapeDiscord` al momento dell'invio.
 */
function testoSemplice(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/<\/?[a-z][a-z0-9-]*(?:\s[^<>]*)?\/?>/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Lunghezza in caratteri visibili (un'emoji conta uno), come il contatore del widget. */
const lunghezza = (s: string) => Array.from(s).length;

/** La pagina di provenienza è solo un percorso del sito (/it/cards/...): tutto il resto si scarta. */
function percorso(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const p = v.trim();
  return p.length <= MAX_PAGINA && /^\/[A-Za-z0-9\-._~/%]*$/.test(p) ? p : null;
}

/** Stessa origine: se il browser dichiara da dove arriva la richiesta, deve essere questo sito. */
function stessaOrigine(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonimo";
  if (troppiMessaggi(ip)) return errore("troppe", 429);
  // controllo e registrazione senza un await in mezzo: le richieste in parallelo non passano tutte
  const inviato = registraInvio(ip);

  if (!(await captchaValido(token, ip))) {
    annullaInvio(ip, inviato);
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
    annullaInvio(ip, inviato);
    return errore("invio", 502);
  }

  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
