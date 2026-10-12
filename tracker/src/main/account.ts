/**
 * Collegamento dell'app all'account OriginsMeta (Fase 3, 30/09/2026; docs/tracker.md, "Collegamento").
 *
 * Il giocatore crea un codice monouso su originsmeta.com/account/tracker e lo scrive nell'app; l'app lo scambia con un
 * token (POST /api/tracker/link). Il token si salva in `account.json`, nella cartella dei dati dell'app, **cifrato** con
 * `safeStorage` di Electron (su Windows la protezione dei dati DPAPI: lo decifra solo lo stesso utente di Windows su
 * questo PC). Se la cifratura non c'è, il token resta solo in memoria fino alla chiusura dell'app (`persisted: false`)
 * e non finisce mai in chiaro su disco. Il sito ne tiene solo l'impronta.
 *
 * Dalla 0.4.0 (12/10/2026, "Solo con l'account", access.ts) il file tiene anche l'ora dell'ultima verifica riuscita del
 * token con il sito (`verified`), cifrata come il token: da lì parte la tolleranza di 7 giorni con il sito
 * irraggiungibile. I file della 0.3.x non l'hanno: l'app verifica il token appena parte.
 *
 * La cifratura arriva da fuori (`Cipher`), così i test girano senza Electron.
 */
import fs from "node:fs";
import path from "node:path";

export type Cipher = {
  available(): boolean;
  encrypt(text: string): Buffer;
  decrypt(data: Buffer): string;
};

/** `verified`: ora dell'ultima verifica riuscita (ISO), cifrata; facoltativa (file della 0.3.x). */
type AccountFile = { v: 1; token: string; username: string | null; linkedAt: string; site: string; verified?: string };

const FILE = "account.json";
const TOKEN_RE = /^omt_[0-9a-f]{64}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

type Data = { token: string; username: string | null; linkedAt: string; site: string; verifiedAt: string | null };

export class Account {
  readonly dir: string;
  private readonly cipher: Cipher;
  private data: Data | null = null;
  private stored = false;
  private broken = false;

  constructor(dir: string, cipher: Cipher) {
    this.dir = dir;
    this.cipher = cipher;
  }

  /**
   * Legge il collegamento salvato; un file rotto o che non si decifra vale "non collegato". Se il file c'è ma il token
   * non si decifra più (`unreadable`: altro utente di Windows, o la chiave della cartella dei dati è cambiata, come
   * il 01/10/2026 col cambio di nome dell'app) l'interfaccia chiede di ricollegare: senza, l'app smetteva di mandare
   * le partite senza dirlo. Un'ora di verifica che non si decifra vale "mai verificato" (l'app verifica subito).
   */
  load(): void {
    this.data = null;
    this.stored = false;
    this.broken = false;
    let raw: Partial<AccountFile>;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(this.dir, FILE), "utf8")) as Partial<AccountFile>;
    } catch {
      return; // nessun collegamento (primo avvio) o file illeggibile
    }
    if (raw?.v !== 1 || typeof raw.token !== "string") return;
    try {
      const token = this.cipher.available() ? this.cipher.decrypt(Buffer.from(raw.token, "base64")) : "";
      if (!TOKEN_RE.test(token)) {
        this.broken = true;
        return;
      }
      this.data = { token, username: typeof raw.username === "string" ? raw.username : null, linkedAt: String(raw.linkedAt ?? ""), site: String(raw.site ?? ""), verifiedAt: this.readVerified(raw.verified) };
      this.stored = true;
    } catch {
      this.broken = true;
    }
  }

  private readVerified(value: unknown): string | null {
    if (typeof value !== "string" || !value) return null;
    try {
      const iso = this.cipher.decrypt(Buffer.from(value, "base64"));
      return ISO_RE.test(iso) ? iso : null;
    } catch {
      return null;
    }
  }

  get linked(): boolean {
    return this.data !== null;
  }

  /** C'è un collegamento salvato che su questo PC non si legge più: va rifatto con un codice nuovo. */
  get unreadable(): boolean {
    return this.broken;
  }

  get token(): string | null {
    return this.data?.token ?? null;
  }

  get username(): string | null {
    return this.data?.username ?? null;
  }

  get linkedAt(): string | null {
    return this.data?.linkedAt || null;
  }

  /** Il sito a cui l'app è collegata (quello di allora: le prove su un'anteprima non valgono per originsmeta.com). */
  get site(): string | null {
    return this.data?.site || null;
  }

  /** Ultima verifica riuscita del token con il sito (ISO), null se non ce n'è una valida. */
  get verifiedAt(): string | null {
    return this.data?.verifiedAt ?? null;
  }

  /** false se il token vale solo fino alla chiusura dell'app (cifratura assente). */
  get persisted(): boolean {
    return this.stored;
  }

  /** Salva il collegamento (appena dato dal sito: vale anche come verifica); restituisce `persisted`. */
  set(token: string, username: string | null, site: string, now = new Date()): boolean {
    if (!TOKEN_RE.test(token)) throw new Error("token non valido");
    this.data = { token, username, linkedAt: now.toISOString(), site, verifiedAt: now.toISOString() };
    this.broken = false;
    return this.write();
  }

  /** Il sito ha appena riconosciuto il token: si salva l'ora (riparte la tolleranza). */
  markVerified(now = new Date()): void {
    if (!this.data) return;
    this.data = { ...this.data, verifiedAt: now.toISOString() };
    if (!this.stored) return;
    try {
      this.write();
    } catch {
      // disco pieno o file bloccato: l'ora vale in memoria, si riscrive alla prossima verifica
      this.stored = true;
    }
  }

  private write(): boolean {
    const d = this.data!;
    this.stored = false;
    fs.mkdirSync(this.dir, { recursive: true });
    const file = path.join(this.dir, FILE);
    if (!this.cipher.available()) {
      fs.rmSync(file, { force: true });
      return false;
    }
    const out: AccountFile = {
      v: 1,
      token: this.cipher.encrypt(d.token).toString("base64"),
      username: d.username,
      linkedAt: d.linkedAt,
      site: d.site,
      ...(d.verifiedAt ? { verified: this.cipher.encrypt(d.verifiedAt).toString("base64") } : {}),
    };
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(out));
    fs.renameSync(tmp, file);
    this.stored = true;
    return true;
  }

  /** Dimentica il collegamento (il file sparisce). Lo storico delle partite sul PC resta. */
  clear(): void {
    this.data = null;
    this.stored = false;
    this.broken = false;
    fs.rmSync(path.join(this.dir, FILE), { force: true });
  }
}
