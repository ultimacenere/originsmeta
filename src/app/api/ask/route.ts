import { NextResponse } from "next/server";
import { locales, type Locale } from "@/lib/i18n";
import { rispondi, aiAttiva } from "@/lib/faq/ask";

/**
 * Domande della pagina FAQ. Riceve una domanda, la gira al modello insieme ai dati del nostro database
 * (vedi `src/lib/faq/`) e restituisce la risposta con le fonti.
 *
 * Difese, in ordine: lunghezza della domanda, CAPTCHA Turnstile (verificato qui con la chiave segreta,
 * a differenza dell'accesso dove lo verifica Supabase) e un limite di frequenza per indirizzo.
 * Senza `ANTHROPIC_API_KEY` la rotta risponde 503 e la pagina mostra solo le FAQ già approvate.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DOMANDA = 300;
const FINESTRA_MS = 60_000;
const MAX_PER_FINESTRA = 5;

/** Limite di frequenza in memoria: basta a fermare il rumore, si azzera a ogni riavvio dell'istanza. */
const recenti = new Map<string, number[]>();

function troppeRichieste(ip: string): boolean {
  const ora = Date.now();
  const precedenti = (recenti.get(ip) ?? []).filter((t) => ora - t < FINESTRA_MS);
  if (precedenti.length >= MAX_PER_FINESTRA) {
    recenti.set(ip, precedenti);
    return true;
  }
  precedenti.push(ora);
  recenti.set(ip, precedenti);
  if (recenti.size > 5000) recenti.clear(); // non lasciamo crescere la mappa all'infinito
  return false;
}

/** Verifica del token Turnstile con la chiave segreta (solo se configurata su Vercel). */
async function captchaValido(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // CAPTCHA non ancora acceso: la rotta resta usabile
  if (!token) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const esito = (await r.json()) as { success?: boolean };
    return Boolean(esito.success);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!aiAttiva()) return NextResponse.json({ errore: "disabilitato" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonimo";
  if (troppeRichieste(ip)) return NextResponse.json({ errore: "troppe" }, { status: 429 });

  let corpo: { domanda?: unknown; locale?: unknown; captcha?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ errore: "richiesta" }, { status: 400 });
  }

  const domanda = typeof corpo.domanda === "string" ? corpo.domanda.trim().slice(0, MAX_DOMANDA) : "";
  const locale = (locales as readonly string[]).includes(String(corpo.locale)) ? (corpo.locale as Locale) : "en";
  if (domanda.length < 5) return NextResponse.json({ errore: "corta" }, { status: 400 });

  if (!(await captchaValido(typeof corpo.captcha === "string" ? corpo.captcha : undefined, ip))) {
    return NextResponse.json({ errore: "captcha" }, { status: 403 });
  }

  const esito = await rispondi(domanda, locale);
  if (!esito.ok) {
    const stato = esito.motivo === "disabilitato" ? 503 : esito.dettaglio === "rate-limit" ? 429 : 502;
    return NextResponse.json({ errore: esito.motivo }, { status: stato });
  }

  return NextResponse.json({ risposta: esito.testo, fonti: esito.fonti });
}
