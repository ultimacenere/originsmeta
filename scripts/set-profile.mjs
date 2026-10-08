// Scrive bio, canali e lingue dei contenuti del profilo pubblico di un iscritto, al posto suo e con il suo permesso
// (08/10/2026, richiesta di Pierluigi per coachcrono: "ci ha dato via libera per collegare il suo twitch e il suo youtube").
// Sono gli stessi tre campi che l'utente cambia da /account/profile: lo script li controlla con le stesse regole del
// modulo (`parseProfileForm` di src/lib/community/profileLinks.ts: bio di 600 caratteri e 12 a capo, canali nella forma
// canonica della piattaforma, al massimo 8) e i vincoli del database li ricontrollano.
// Uso: node scripts/set-profile.mjs <username> <file.json> [--apply] [--env <.env.local>]
// Il file: { "bio": "…", "links": [{ "kind": "twitch", "url": "…" }], "content_langs": ["it"] }. Senza --apply è una
// prova: mostra prima e dopo e non scrive. Ruolo e vetrina non si toccano (ruolo: scripts/set-badge.mjs).
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { parseProfileForm } from "../src/lib/community/profileLinks.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const apply = args.includes("--apply");
const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--env");
const [username, file] = positional;
if (!username || !file) {
  console.error("Uso: node scripts/set-profile.mjs <username> <file.json> [--apply] [--env <.env.local>]");
  process.exit(1);
}

const spec = JSON.parse(readFileSync(path.resolve(file), "utf8"));
const parsed = parseProfileForm({
  bio: String(spec.bio ?? ""),
  langs: Array.isArray(spec.content_langs) ? spec.content_langs : [],
  kinds: (spec.links ?? []).map((l) => l.kind),
  urls: (spec.links ?? []).map((l) => l.url),
});
if (!parsed.ok) {
  console.error("Il file non passa i controlli del modulo del profilo:", JSON.stringify(parsed.errors));
  process.exit(1);
}
const value = parsed.value;

// .env.local: quello indicato, quello del repo o quello del checkout principale (i worktree non lo hanno).
function envFile() {
  const candidates = [opt("--env"), path.join(root, ".env.local")];
  try {
    const common = execSync("git rev-parse --path-format=absolute --git-common-dir", { cwd: root, encoding: "utf8" }).trim();
    candidates.push(path.join(path.dirname(common), ".env.local"));
  } catch {}
  const found = candidates.find((f) => f && existsSync(f));
  if (!found) throw new Error(".env.local non trovato: indicarlo con --env <file>");
  return found;
}
const env = Object.fromEntries(
  readFileSync(envFile(), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = new pg.Client({
  host: env.SUPABASE_DB_HOST || `db.${env.SUPABASE_PROJECT_REF}.supabase.co`,
  port: Number(env.SUPABASE_DB_PORT || 5432),
  user: env.SUPABASE_DB_USER || "postgres",
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await db.connect();
try {
  const r = await db.query("select id, username, display_name, badge, bio, links, content_langs from public.profiles where username = $1", [username.toLowerCase()]);
  const p = r.rows[0];
  if (!p) {
    console.error(`Nessun profilo con nome utente "${username}".`);
    process.exitCode = 2;
  } else {
    console.log(`${p.display_name ?? p.username} (@${p.username}, ruolo ${p.badge ?? "community"})`);
    console.log("  bio prima:  ", JSON.stringify(p.bio));
    console.log("  bio dopo:   ", JSON.stringify(value.bio));
    console.log("  canali prima:", JSON.stringify(p.links));
    console.log("  canali dopo: ", JSON.stringify(value.links));
    console.log("  lingue:      ", JSON.stringify(p.content_langs), "→", JSON.stringify(value.content_langs));
    if (!apply) {
      console.log("Prova a secco: niente scritto. Per scrivere, rilanciare con --apply.");
    } else {
      await db.query("update public.profiles set bio = $1, links = $2::jsonb, content_langs = $3::text[] where id = $4", [
        value.bio,
        JSON.stringify(value.links),
        value.content_langs,
        p.id,
      ]);
      console.log(`Fatto. Pagina pubblica: https://originsmeta.com/it/u/${p.username} (si aggiorna entro qualche minuto).`);
    }
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 4;
} finally {
  await db.end();
}
