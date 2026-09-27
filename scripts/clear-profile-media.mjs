// Strumento dello staff per la vetrina dei profili (pacchetto VETRINA, 27/09/2026): toglie la foto caricata, la copertina
// caricata o la frase di presentazione di un utente (per esempio un'immagine offensiva), e trova i file del bucket
// `profile-media` che nessun profilo usa più. La foto profilo la carica ogni iscritto e compare in tutto il sito (mazzi,
// tornei, header, /creators, dati strutturati): dal sito lo staff non la può cambiare, perché la policy "users edit own
// profile" vale solo per la propria riga.
//
// Uso (dal checkout con .env.local, come set-badge.mjs):
//   node scripts/clear-profile-media.mjs <username|email> [--avatar] [--cover] [--tagline] [--all] [--dry-run]
//     --avatar   toglie la foto caricata (torna quella di Discord, o l'iniziale) e cancella i file di <id>/avatar
//     --cover    toglie la copertina caricata (resta lo sfondo predefinito) e cancella i file di <id>/cover
//     --tagline  toglie la frase di presentazione
//     --all      tutto quello della vetrina (anche colore, Leggendaria, mazzo e video in evidenza, orari) più la foto
//     senza opzioni mostra che cosa c'è, senza cambiare nulla
//   node scripts/clear-profile-media.mjs --orphans [--hours <n>] [--dry-run]
//     i file che nessun profilo usa (caricati e mai salvati, sostituiti, di account cancellati) più vecchi di n ore
//     (24 di default: un file appena caricato può essere in attesa del salvataggio), e chi supera il tetto dei 12 file
//
// Il database si aggiorna con la connessione diretta (password in .env.local): auth.uid() è nullo, quindi il trigger
// guard_profile_vetrina lascia passare lo script e, togliendo la foto, rimette in avatar_url quella di Discord. I file si
// cancellano con l'API dello Storage e la chiave service_role (SUPABASE_SERVICE_ROLE_KEY in .env.local, mai su Vercel né
// con NEXT_PUBLIC_): un `delete from storage.objects` non toglierebbe l'oggetto dallo storage. Senza la chiave lo script
// aggiorna il profilo ed elenca i file da cancellare a mano (dashboard Supabase → Storage → profile-media).
import { readFileSync } from "node:fs";
import pg from "pg";

const BUCKET = "profile-media";
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const valueOf = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = flag("dry-run");
const orphans = flag("orphans");
const needle = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--hours");
if (!orphans && !needle) {
  console.error("Uso: node scripts/clear-profile-media.mjs <username|email> [--avatar] [--cover] [--tagline] [--all] [--dry-run]");
  console.error("     node scripts/clear-profile-media.mjs --orphans [--hours <n>] [--dry-run]");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const projectUrl = (env.NEXT_PUBLIC_SUPABASE_URL || (env.SUPABASE_PROJECT_REF ? `https://${env.SUPABASE_PROJECT_REF}.supabase.co` : "https://obpnprlzxrlbvncpqlpq.supabase.co")).replace(/\/+$/, "");
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();

/** Cancella i file con l'API dello Storage (a gruppi di 100); senza chiave li elenca soltanto. */
async function removeFiles(paths) {
  if (!paths.length) return;
  if (dryRun || !serviceKey) {
    console.log(dryRun ? "File che si cancellerebbero:" : "SUPABASE_SERVICE_ROLE_KEY assente in .env.local: cancella a mano (Storage → profile-media):");
    for (const p of paths) console.log(`  ${p}`);
    return;
  }
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const res = await fetch(`${projectUrl}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: batch }),
    });
    if (!res.ok) {
      console.error(`Storage: ${res.status} ${await res.text()}`);
      process.exitCode = 4;
      return;
    }
  }
  console.log(`File cancellati: ${paths.length}`);
}

try {
  if (orphans) {
    const hours = Number(valueOf("hours") ?? 24);
    if (!Number.isFinite(hours) || hours < 1) throw new Error("--hours vuole un numero di ore, almeno 1");
    // un file è in uso se è la foto o la copertina del profilo proprietario della cartella
    const r = await db.query(
      `select o.name, o.created_at, (storage.foldername(o.name))[1] as folder,
              exists (select 1 from public.profiles p where p.id::text = (storage.foldername(o.name))[1] and (p.avatar_path = o.name or p.cover_path = o.name)) as used
         from storage.objects o
        where o.bucket_id = $1
        order by o.created_at`,
      [BUCKET],
    );
    const perUser = new Map();
    for (const row of r.rows) perUser.set(row.folder, (perUser.get(row.folder) ?? 0) + 1);
    const crowded = [...perUser].filter(([, n]) => n > 12);
    if (crowded.length) console.log("Oltre il tetto dei 12 file:", crowded.map(([id, n]) => `${id} (${n})`).join(", "));
    const cutoff = Date.now() - hours * 3600_000;
    const stale = r.rows.filter((row) => !row.used && new Date(row.created_at).getTime() < cutoff).map((row) => row.name);
    console.log(`File nel bucket: ${r.rows.length}; non usati da più di ${hours} ore: ${stale.length}`);
    await removeFiles(stale);
  } else {
    const found = await db.query(
      `select p.id, p.username, p.display_name, p.badge, p.avatar_path, p.cover_path, p.tagline, u.email
         from public.profiles p join auth.users u on u.id = p.id
        where lower(p.username) = lower($1) or lower(u.email) = lower($1)`,
      [needle],
    );
    if (found.rows.length !== 1) {
      console.error(found.rows.length ? `Più profili per "${needle}": scrivi il nome utente esatto.` : `Nessun profilo con nome utente o email "${needle}".`);
      process.exitCode = 2;
    } else {
      const t = found.rows[0];
      console.log(`${t.display_name ?? t.username} (@${t.username}, ${t.email}, ${t.badge})`);
      console.log(`  foto caricata: ${t.avatar_path ?? "nessuna"}\n  copertina caricata: ${t.cover_path ?? "nessuna"}\n  frase: ${t.tagline ?? "nessuna"}`);
      const all = flag("all");
      const sets = [];
      if (all || flag("avatar")) sets.push("avatar_path = null");
      if (all || flag("cover")) sets.push("cover_path = null");
      if (all || flag("tagline")) sets.push("tagline = null");
      if (all) sets.push("cover_preset = null", "accent = null", "favorite_legendary = null", "featured_deck = null", "featured_video = null", "schedule = '[]'::jsonb", "schedule_tz = null");
      if (!sets.length) {
        console.log("Nessuna opzione: niente da cambiare (--avatar, --cover, --tagline, --all).");
      } else if (dryRun) {
        console.log(`Si scriverebbe: ${sets.join(", ")}`);
      } else {
        await db.query(`update public.profiles set ${sets.join(", ")} where id = $1`, [t.id]);
        console.log(`Profilo aggiornato: ${sets.join(", ")}`);
      }
      // i file delle cartelle svuotate (con --dry-run anche quello ancora in uso, che il salvataggio libererebbe)
      const kinds = [...(all || flag("avatar") ? ["avatar"] : []), ...(all || flag("cover") ? ["cover"] : [])];
      if (kinds.length) {
        const files = await db.query(
          `select o.name from storage.objects o
            where o.bucket_id = $1 and (storage.foldername(o.name))[1] = $2 and (storage.foldername(o.name))[2] = any($3)
              and ($4 or not exists (select 1 from public.profiles p where p.id = $2::uuid and (p.avatar_path = o.name or p.cover_path = o.name)))`,
          [BUCKET, t.id, kinds, dryRun],
        );
        await removeFiles(files.rows.map((f) => f.name));
      }
      if (sets.length && !dryRun) console.log("Le pagine si rinnovano da sole entro qualche minuto (ISR); /u/<nome> e /creators al giro successivo.");
    }
  }
} catch (e) {
  // prima della migrazione (colonne o bucket assenti) o un errore del database
  console.error(e.code === "42703" ? "Mancano le colonne della vetrina: applica prima la migrazione (blocco VETRINA di supabase/schema.sql)." : e.message);
  process.exitCode = 3;
} finally {
  await db.end();
}
