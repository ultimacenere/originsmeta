import { NextResponse } from "next/server";
import { locales } from "@/lib/i18n";
import { discordWebhookUrl, escapeDiscord, sendDiscordWebhook, type DiscordEmbedField, type DiscordFile } from "@/lib/discordWebhook";
import { captchaValido, indirizzoIp, limiteInvii, lunghezza, stessaOrigine, testoSemplice } from "@/lib/formGuard";
import {
  GUIDE_CODE_RE,
  GUIDE_DISCORD_RE,
  GUIDE_EMAIL_MAX,
  GUIDE_EMAIL_RE,
  GUIDE_NAME_MAX,
  GUIDE_NAME_MIN,
  GUIDE_TEXT_MAX,
  GUIDE_TEXT_MIN,
  GUIDE_TITLE_MAX,
  GUIDE_TITLE_MIN,
  guideLink,
  type GuideApiError,
} from "@/lib/guideSubmitLabels";

/**
 * "Mandaci la tua guida" (`src/components/GuideSubmitForm.tsx` in /guides/submit, diretta Twitch del 23/09/2026).
 * La guida va nel canale Discord PRIVATO dello staff, lo stesso del pop-up dei feedback, tramite webhook
 * (decisione di Pierluigi: "modulo nel canale staff"): nessun database, nessuna copia sul sito. Lo staff la legge,
 * la sistema e la pubblica a mano come le altre guide, in inglese e in italiano.
 *
 * GET  → { attivo }: il modulo lo chiede all'apertura, così non fa scrivere una guida che non arriverebbe.
 * POST { title, text, link?, code?, name, email?, discord?, consent, locale, token? } → { ok: true } oppure
 *      { errore: <codice> } (codici in `GuideApiError`, `src/lib/guideSubmitLabels.ts`).
 *
 * Difese come `/api/feedback` (`src/lib/formGuard.ts`): stessa origine e JSON, corpo limitato, validazione di ogni
 * campo, limite per indirizzo IP (3 guide all'ora), CAPTCHA Turnstile verificato con TURNSTILE_SECRET_KEY se c'è,
 * testo semplice con formattazione e menzioni di Discord annullate. Il messaggio è un embed con i dati e
 * un'anteprima; il testo completo va in un file .txt allegato, che Discord non interpreta.
 *
 * Variabile d'ambiente: DISCORD_FEEDBACK_WEBHOOK_URL (la stessa del feedback). A differenza del feedback, il
 * modulo NON si spegne con NEXT_PUBLIC_FEEDBACK=off: resta acceso dopo il rodaggio. Senza webhook la rotta
 * risponde 503 "disattivato" e il modulo propone l'email dello staff.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 3 guide all'ora per indirizzo IP: chi scrive una guida non ne manda dieci di fila. */
const limite = limiteInvii({ finestraMs: 60 * 60_000, massimo: 3 });
/** Corpo massimo: 20.000 caratteri di guida anche in un alfabeto non latino, più i campi brevi e il token. */
const MAX_CORPO = 120_000;
const MAX_TOKEN = 2_048;
/** Caratteri del testo mostrati nell'embed: il resto sta nel file allegato. */
const ANTEPRIMA = 1_000;
/** Celeste del sito (--color-sky #3fc4e8): nel canale le guide si distinguono dai feedback, che sono menta. */
const COLORE_CELESTE = 0x3fc4e8;

/** URL del webhook del canale privato dello staff, oppure null se manca (o non è un webhook Discord). */
function webhook(): string | null {
  return discordWebhookUrl("DISCORD_FEEDBACK_WEBHOOK_URL");
}

function errore(codice: GuideApiError, stato: number) {
  return NextResponse.json({ errore: codice }, { status: stato, headers: { "cache-control": "no-store" } });
}

/** Campo di una riga sola (titolo, firma): testo semplice senza a capo. */
function riga(v: unknown): string {
  return typeof v === "string" ? testoSemplice(v).replace(/\s+/g, " ") : "";
}

/** Nome del file allegato, dal titolo: minuscole senza accenti né simboli, per ritrovarlo fra i download. */
function nomeFile(titolo: string): string {
  const base = titolo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return `guida-${base || "senza-titolo"}.txt`;
}

export async function GET() {
  return NextResponse.json({ attivo: webhook() !== null }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const url = webhook();
  if (!url) return errore("disattivato", 503);

  // JSON obbligatorio e stessa origine: una pagina di un altro sito non può spedire guide a nome dei visitatori
  const tipo = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!stessaOrigine(req) || tipo !== "application/json") {
    return errore("richiesta", 400);
  }
  // corpo dichiarato troppo grande: si scarta prima di leggerlo
  if (Number(req.headers.get("content-length") ?? 0) > MAX_CORPO) return errore("lungo", 413);

  let corpo: {
    title?: unknown;
    text?: unknown;
    link?: unknown;
    code?: unknown;
    name?: unknown;
    email?: unknown;
    discord?: unknown;
    consent?: unknown;
    locale?: unknown;
    token?: unknown;
  };
  try {
    const grezzo = await req.text();
    if (grezzo.length > MAX_CORPO) return errore("lungo", 413);
    corpo = JSON.parse(grezzo);
  } catch {
    return errore("richiesta", 400);
  }
  if (!corpo || typeof corpo !== "object") return errore("richiesta", 400);

  // Validazione nell'ordine dei campi del modulo, che fa gli stessi controlli prima di spedire
  const titolo = riga(corpo.title);
  if (lunghezza(titolo) < GUIDE_TITLE_MIN || lunghezza(titolo) > GUIDE_TITLE_MAX) return errore("titolo", 400);

  const linkGrezzo = typeof corpo.link === "string" ? corpo.link.trim() : "";
  const testo = typeof corpo.text === "string" ? testoSemplice(corpo.text) : "";
  if (lunghezza(testo) > GUIDE_TEXT_MAX) return errore("lungo", 400);
  // con un link la guida vive altrove: il testo può anche mancare
  if (!linkGrezzo && lunghezza(testo) < GUIDE_TEXT_MIN) return errore("corto", 400);
  const link = linkGrezzo ? guideLink(linkGrezzo) : null;
  if (linkGrezzo && !link) return errore("link", 400);

  const codice = typeof corpo.code === "string" ? corpo.code.trim() : "";
  if (codice && !GUIDE_CODE_RE.test(codice)) return errore("codice", 400);

  const firma = riga(corpo.name);
  if (lunghezza(firma) < GUIDE_NAME_MIN || lunghezza(firma) > GUIDE_NAME_MAX) return errore("firma", 400);

  const email = typeof corpo.email === "string" ? corpo.email.trim() : "";
  if (email && (email.length > GUIDE_EMAIL_MAX || !GUIDE_EMAIL_RE.test(email))) return errore("email", 400);
  const discord = typeof corpo.discord === "string" ? corpo.discord.trim() : "";
  if (discord && !GUIDE_DISCORD_RE.test(discord)) return errore("discord", 400);

  // l'autorizzazione a pubblicare è la casella del modulo: senza, la guida non parte
  if (corpo.consent !== true) return errore("consenso", 400);

  const locale = (locales as readonly string[]).includes(String(corpo.locale)) ? String(corpo.locale) : "en";
  const token = typeof corpo.token === "string" && corpo.token.length <= MAX_TOKEN ? corpo.token : undefined;

  // conta solo le guide che partono davvero: un CAPTCHA fallito o un errore di Discord non bruciano i tentativi
  const ip = indirizzoIp(req);
  if (limite.troppi(ip)) return errore("troppe", 429);
  // controllo e registrazione senza un await in mezzo: le richieste in parallelo non passano tutte
  const inviato = limite.registra(ip);

  if (!(await captchaValido(token, ip, "guide"))) {
    limite.annulla(ip, inviato);
    return errore("captcha", 403);
  }

  const adesso = new Date();
  const caratteri = Array.from(testo);
  const tagliato = caratteri.length > ANTEPRIMA;
  const anteprima = tagliato ? `${caratteri.slice(0, ANTEPRIMA).join("").trimEnd()}…` : testo;
  const descrizione = testo
    ? `${escapeDiscord(anteprima)}${tagliato ? "\n\n_Il testo completo è nel file allegato._" : ""}`
    : "_Nessun testo: la guida è al link._";

  // titolo e firma sono testo dell'utente: formattazione e menzioni annullate come nel testo
  const campi: DiscordEmbedField[] = [
    { name: "Titolo", value: escapeDiscord(titolo) },
    { name: "Firma", value: escapeDiscord(firma), inline: true },
    { name: "Lingua del sito", value: locale.toUpperCase(), inline: true },
    { name: "Caratteri", value: String(caratteri.length), inline: true },
  ];
  // link, codice e contatti in blocchi di codice: testo letterale da copiare, niente link cliccabili
  if (link) campi.push({ name: "Link", value: `\`${link}\`` });
  if (codice) campi.push({ name: "Codice del mazzo", value: `\`${codice}\`` });
  if (email) campi.push({ name: "Email (per rispondere)", value: `\`${email}\``, inline: true });
  if (discord) campi.push({ name: "Discord (per rispondere)", value: `\`${discord}\``, inline: true });
  if (!email && !discord) campi.push({ name: "Contatti", value: "Nessuno: non ha lasciato né email né Discord." });
  campi.push({
    name: "Autorizzazione",
    value: "Ha dichiarato che la guida è sua (o di chi gli ha dato il permesso) e ne autorizza la pubblicazione, anche rivista e tradotta, con la firma indicata.",
  });
  // <t:…:F> è la data nel formato di Discord: ognuno la vede nel proprio fuso orario
  campi.push({ name: "Data", value: `<t:${Math.floor(adesso.getTime() / 1000)}:F>`, inline: true });

  // Il testo completo, così com'è: in un file Discord non interpreta formattazione né menzioni
  const files: DiscordFile[] = testo
    ? [
        {
          name: nomeFile(titolo),
          content: [titolo, "", `Firma: ${firma}`, ...(link ? [`Link: ${link}`] : []), ...(codice ? [`Codice del mazzo: ${codice}`] : []), "", testo, ""].join("\n"),
        },
      ]
    : [];

  const esito = await sendDiscordWebhook(
    url,
    {
      username: "OriginsMeta · guide",
      embeds: [
        {
          title: "Nuova guida dal sito",
          description: descrizione,
          color: COLORE_CELESTE,
          fields: campi,
          timestamp: adesso.toISOString(),
          footer: { text: "originsmeta.com · Mandaci la tua guida" },
        },
      ],
    },
    { files, timeoutMs: 8000 },
  );
  if (!esito.ok) {
    limite.annulla(ip, inviato);
    return errore("invio", 502);
  }

  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
