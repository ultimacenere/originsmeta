/**
 * Difese comuni delle rotte che ricevono un modulo pubblico e lo girano al canale Discord privato dello staff:
 * il pop-up dei feedback (`src/app/api/feedback/route.ts`, 22/09/2026) e "Mandaci la tua guida"
 * (`src/app/api/guide-submission/route.ts`, 23/09/2026). Solo lato server. `/api/ask` ha ancora le sue copie di
 * limite e CAPTCHA.
 */

/**
 * Limite di frequenza in memoria per indirizzo IP: basta a fermare il rumore, si azzera a ogni riavvio
 * dell'istanza. Ogni rotta ha il suo (una Map per chiamata).
 *
 * `registra` conta un invio valido subito dopo il controllo di `troppi` (prima di CAPTCHA e invio, così cento
 * richieste in parallelo non passano tutte); se il CAPTCHA fallisce o Discord rifiuta il messaggio, `annulla` lo
 * toglie: un token scaduto o un errore di Discord non bruciano un tentativo di chi scrive. L'indirizzo si
 * reinserisce in coda, così i più vecchi sono i primi a uscire quando la mappa è piena (niente `clear()`, che
 * azzerava il conteggio di tutti e si poteva provocare apposta).
 */
export function limiteInvii({ finestraMs, massimo, maxIndirizzi = 5000 }: { finestraMs: number; massimo: number; maxIndirizzi?: number }) {
  const recenti = new Map<string, number[]>();

  function inFinestra(ip: string): number[] {
    const ora = Date.now();
    return (recenti.get(ip) ?? []).filter((t) => ora - t < finestraMs);
  }

  return {
    /** Vero se l'indirizzo ha già mandato il massimo nella finestra. Non conta nulla: vedi `registra`. */
    troppi(ip: string): boolean {
      // gli indirizzi scaduti si tolgono subito: la mappa tiene solo quelli dell'ultima finestra (vedi l'informativa)
      const ora = Date.now();
      for (const [chiave, tempi] of recenti) if (tempi.every((t) => ora - t >= finestraMs)) recenti.delete(chiave);
      return inFinestra(ip).length >= massimo;
    },
    /** Conta un invio e restituisce il suo momento, da passare ad `annulla` se poi non parte. */
    registra(ip: string): number {
      const adesso = Date.now();
      const tempi = [...inFinestra(ip), adesso];
      recenti.delete(ip);
      recenti.set(ip, tempi);
      while (recenti.size > maxIndirizzi) {
        const primo = recenti.keys().next().value;
        if (primo === undefined) break;
        recenti.delete(primo);
      }
      return adesso;
    },
    annulla(ip: string, quando: number) {
      const tempi = recenti.get(ip);
      if (!tempi) return;
      const i = tempi.indexOf(quando);
      if (i >= 0) tempi.splice(i, 1);
      if (!tempi.length) recenti.delete(ip);
    },
  };
}

/** Rotte che hanno già scritto nei log che il CAPTCHA non viene verificato: una volta per istanza, per rotta. */
const avvisiCaptcha = new Set<string>();

/**
 * Verifica del token Turnstile con la chiave segreta, solo se TURNSTILE_SECRET_KEY è configurata su Vercel
 * (stessa logica di /api/ask). Senza chiave la rotta resta usabile e, se il widget è acceso da
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY, lo dice nei log: il CAPTCHA del modulo sarebbe di facciata.
 */
export async function captchaValido(token: string | undefined, ip: string, rotta: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !avvisiCaptcha.has(rotta)) {
      avvisiCaptcha.add(rotta);
      console.error(`[${rotta}] TURNSTILE_SECRET_KEY mancante: il CAPTCHA del modulo non viene verificato`);
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

/** Stessa origine: se il browser dichiara da dove arriva la richiesta, deve essere questo sito. */
export function stessaOrigine(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Indirizzo IP di chi scrive, per il solo limite di frequenza (non viene mai inviato con il messaggio). */
export function indirizzoIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonimo";
}

/**
 * Testo semplice: fine riga uniformi, niente caratteri di controllo né caratteri invisibili di direzione,
 * niente tag HTML, al massimo una riga vuota di fila. Il resto (formattazione Discord, menzioni) lo annulla
 * `escapeDiscord` al momento dell'invio.
 */
export function testoSemplice(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f‎‏‪-‮⁦-⁩]/g, "")
    .replace(/<\/?[a-z][a-z0-9-]*(?:\s[^<>]*)?\/?>/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Lunghezza in caratteri visibili (un'emoji conta uno), come i contatori dei moduli. */
export const lunghezza = (s: string) => Array.from(s).length;
