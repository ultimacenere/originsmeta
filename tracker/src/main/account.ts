/**
 * Collegamento dell'app all'account OriginsMeta (Fase 3, 30/09/2026; docs/tracker.md, "Collegamento").
 *
 * Il giocatore crea un codice monouso su originsmeta.com/account/tracker e lo scrive nell'app; l'app lo scambia con un
 * token (POST /api/tracker/link). Il token si salva in `account.json`, nella cartella dei dati dell'app, **cifrato** con
 * `safeStorage` di Electron (su Windows la protezione dei dati DPAPI: lo decifra solo lo stesso utente di Windows su
 * questo PC). Se la cifratura non c'è, il token resta solo in memoria fino alla chiusura dell'app (`persisted: false`)
 * e non finisce mai in chiaro su disco. Il sito ne tiene solo l'impronta.
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

type AccountFile = { v: 1; token: string; username: string | null; linkedAt: string; site: string };

const FILE = "account.json";
const TOKEN_RE = /^omt_[0-9a-f]{64}$/;

export class Account {
  readonly dir: string;
  private readonly cipher: Cipher;
  private data: { token: string; username: string | null; linkedAt: string; site: string } | null = null;
  private stored = false;

  constructor(dir: string, cipher: Cipher) {
    this.dir = dir;
    this.cipher = cipher;
  }

  /** Legge il collegamento salvato; un file rotto o che non si decifra (altro utente di Windows) vale "non collegato". */
  load(): void {
    this.data = null;
    this.stored = false;
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(this.dir, FILE), "utf8")) as Partial<AccountFile>;
      if (raw?.v !== 1 || typeof raw.token !== "string" || !this.cipher.available()) return;
      const token = this.cipher.decrypt(Buffer.from(raw.token, "base64"));
      if (!TOKEN_RE.test(token)) return;
      this.data = { token, username: typeof raw.username === "string" ? raw.username : null, linkedAt: String(raw.linkedAt ?? ""), site: String(raw.site ?? "") };
      this.stored = true;
    } catch {
      // nessun collegamento (primo avvio) o file illeggibile
    }
  }

  get linked(): boolean {
    return this.data !== null;
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

  /** false se il token vale solo fino alla chiusura dell'app (cifratura assente). */
  get persisted(): boolean {
    return this.stored;
  }

  /** Salva il collegamento; restituisce `persisted`. */
  set(token: string, username: string | null, site: string, now = new Date()): boolean {
    if (!TOKEN_RE.test(token)) throw new Error("token non valido");
    this.data = { token, username, linkedAt: now.toISOString(), site };
    this.stored = false;
    fs.mkdirSync(this.dir, { recursive: true });
    const file = path.join(this.dir, FILE);
    if (!this.cipher.available()) {
      fs.rmSync(file, { force: true });
      return false;
    }
    const out: AccountFile = { v: 1, token: this.cipher.encrypt(token).toString("base64"), username, linkedAt: this.data.linkedAt, site };
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(out));
    fs.renameSync(tmp, file);
    this.stored = true;
    return true;
  }

  /** Dimentica il collegamento (il file sparisce). */
  clear(): void {
    this.data = null;
    this.stored = false;
    fs.rmSync(path.join(this.dir, FILE), { force: true });
  }
}
