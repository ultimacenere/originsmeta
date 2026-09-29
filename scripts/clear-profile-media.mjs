// Strumento dello staff per la vetrina dei profili (pacchetto VETRINA, 27/09/2026): toglie la foto caricata, la copertina
// caricata o la frase di presentazione di un utente (per esempio un'immagine offensiva), e trova i file del bucket
// `profile-media` che nessun profilo usa più. La foto profilo la carica ogni iscritto e compare in tutto il sito (mazzi,
// tornei, header, /creators, dati strutturati): dal sito lo staff non la può cambiare, perché la policy "users edit own
// profile" vale solo per la propria riga.
//
// Dal 29/09/2026 (blocchi IMMAGINI e FUMETTI di supabase/schema.sql) nello stesso bucket ci sono anche le copertine
// caricate delle guide della community (<id>/guide), gli artwork della Leggendaria dei mazzi (<id>/deck) e tavole e
// copertine dei fumetti (<id>/comic): --orphans le conta come in uso (funzione profile_media_in_use del database) e le
// opzioni --guide-covers e --deck-art tolgono le prime due. Un fumetto da togliere lo nasconde lo staff dal sito, o lo
// elimina (con i suoi file). Una copia di questo script precedente al 29/09 NON le conosce e con --orphans le
// cancellerebbe: usarlo solo da un checkout aggiornato.
//
// Uso (dal checkout con .env.local, come set-badge.mjs):
//   node scripts/clear-profile-media.mjs <username|email> [--avatar] [--cover] [--background] [--tagline] [--all]
//                                        [--guide-covers] [--deck-art] [--dry-run]
//     --avatar        toglie la foto caricata (torna quella di Discord, o l'iniziale) e cancella i file di <id>/avatar
//     --cover         toglie la copertina caricata (resta lo sfondo predefinito) e cancella i file di <id>/cover
//     --tagline       toglie la frase di presentazione
//     --all           tutto quello della vetrina (anche colore, Leggendaria, mazzo e video in evidenza, orari) più la foto
//     --guide-covers  toglie le copertine caricate da tutte le sue guide (tornano quella del media kit che avevano scelto)
//                     e cancella i file di <id>/guide
//     --deck-art      toglie l'artwork della Leggendaria da tutti i suoi mazzi (torna la carta ufficiale) e cancella i file
//                     di <id>/deck
//     senza opzioni mostra che cosa c'è, senza cambiare nulla
//   node scripts/clear-profile-media.mjs --orphans [--hours <n>] [--dry-run]
//     i file che nessuno usa (caricati e mai salvati, sostituiti, di guide e mazzi eliminati, di account cancellati) più
//     vecchi di n ore (24 di default: un file appena caricato può essere in attesa del salvataggio), e chi supera il tetto
//     dei file (12, o 60 per i ruoli con vetrina e gli admin)
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
  console.error("Uso: node scripts/clear-profile-media.mjs <username|email> [--avatar] [--cover] [--background] [--tagline] [--all] [--guide-covers] [--deck-art] [--dry-run]");
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
    // un file è in uso se è la foto, la copertina o lo sfondo del profilo proprietario della cartella, la copertina di una
    // sua guida o l'artwork di un suo mazzo: la stessa funzione della policy di cancellazione (blocco IMMAGINI)
    const r = await db.query(
      `select o.name, o.created_at, (storage.foldername(o.name))[1] as folder, public.profile_media_in_use(o.name) as used
         from storage.objects o
        where o.bucket_id = $1
        order by o.created_at`,
      [BUCKET],
    );
    const perUser = new Map();
    for (const row of r.rows) perUser.set(row.folder, (perUser.get(row.folder) ?? 0) + 1);
    // il tetto della policy di caricamento: 60 file per i ruoli con vetrina e gli admin, 12 per gli altri
    const roles = await db.query(`select id::text as id, badge, role from public.profiles where id::text = any($1)`, [[...perUser.keys()]]);
    const capOf = new Map(roles.rows.map((p) => [p.id, p.role === "admin" || ["creator", "author", "pro", "staff"].includes(p.badge) ? 60 : 12]));
    // la cartella dei fumetti ha un tetto suo (300) e non conta in quello della vetrina (blocco FUMETTI)
    const perUserNoComics = new Map();
    for (const row of r.rows) if (row.name.split("/")[1] !== "comic") perUserNoComics.set(row.folder, (perUserNoComics.get(row.folder) ?? 0) + 1);
    const crowded = [...perUserNoComics].filter(([id, n]) => n > (capOf.get(id) ?? 12));
    if (crowded.length) console.log("Oltre il tetto dei file:", crowded.map(([id, n]) => `${id} (${n} su ${capOf.get(id) ?? 12})`).join(", "));
    const cutoff = Date.now() - hours * 3600_000;
    const stale = r.rows.filter((row) => !row.used && new Date(row.created_at).getTime() < cutoff).map((row) => row.name);
    console.log(`File nel bucket: ${r.rows.length}; non usati da più di ${hours} ore: ${stale.length}`);
    await removeFiles(stale);
  } else {
    const found = await db.query(
      `select p.id, p.username, p.display_name, p.badge, p.avatar_path, p.cover_path, p.background_path, p.tagline, u.email
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
      // copertine delle guide e artwork dei mazzi (29/09/2026)
      const guideCovers = await db.query(`select slug, cover_path from public.community_guides where owner = $1 and cover_path is not null order by slug`, [t.id]);
      const deckArt = await db.query(`select slug, art_path from public.community_decks where owner = $1 and art_path is not null order by slug`, [t.id]);
      console.log(`  guide con la copertina caricata: ${guideCovers.rows.map((g) => g.slug).join(", ") || "nessuna"}`);
      console.log(`  mazzi con l'artwork della Leggendaria: ${deckArt.rows.map((d) => d.slug).join(", ") || "nessuno"}`);
      const all = flag("all");
      const sets = [];
      if (all || flag("avatar")) sets.push("avatar_path = null");
      if (all || flag("cover")) sets.push("cover_path = null");
      if (all || flag("background")) sets.push("background_path = null");
      if (all || flag("tagline")) sets.push("tagline = null");
      if (all) sets.push("cover_preset = null", "background_preset = null", "accent = null", "favorite_legendary = null", "featured_deck = null", "featured_video = null", "schedule = '[]'::jsonb", "schedule_tz = null");
      const guidesToo = flag("guide-covers");
      const decksToo = flag("deck-art");
      if (!sets.length && !guidesToo && !decksToo) {
        console.log("Nessuna opzione: niente da cambiare (--avatar, --cover, --tagline, --all, --guide-covers, --deck-art).");
      } else if (dryRun) {
        if (sets.length) console.log(`Si scriverebbe: ${sets.join(", ")}`);
        if (guidesToo) console.log(`Si toglierebbe la copertina caricata da ${guideCovers.rows.length} guide`);
        if (decksToo) console.log(`Si toglierebbe l'artwork da ${deckArt.rows.length} mazzi`);
      } else {
        if (sets.length) {
          await db.query(`update public.profiles set ${sets.join(", ")} where id = $1`, [t.id]);
          console.log(`Profilo aggiornato: ${sets.join(", ")}`);
        }
        // con la connessione diretta auth.uid() è nullo: i trigger delle guide e dei mazzi lasciano passare lo script
        if (guidesToo) {
          const g = await db.query(`update public.community_guides set cover_path = null where owner = $1 and cover_path is not null`, [t.id]);
          console.log(`Copertine caricate tolte da ${g.rowCount} guide (resta quella del media kit che avevano scelto)`);
        }
        if (decksToo) {
          const d = await db.query(`update public.community_decks set art_path = null where owner = $1 and art_path is not null`, [t.id]);
          console.log(`Artwork tolto da ${d.rowCount} mazzi (torna la carta ufficiale)`);
        }
      }
      // i file delle cartelle svuotate (con --dry-run anche quelli ancora in uso, che il salvataggio libererebbe)
      const kinds = [
        ...(all || flag("avatar") ? ["avatar"] : []),
        ...(all || flag("cover") ? ["cover"] : []),
        ...(all || flag("background") ? ["background"] : []),
        ...(guidesToo ? ["guide"] : []),
        ...(decksToo ? ["deck"] : []),
      ];
      if (kinds.length) {
        const files = await db.query(
          `select o.name from storage.objects o
            where o.bucket_id = $1 and (storage.foldername(o.name))[1] = $2 and (storage.foldername(o.name))[2] = any($3)
              and ($4 or not public.profile_media_in_use(o.name))`,
          [BUCKET, t.id, kinds, dryRun],
        );
        await removeFiles(files.rows.map((f) => f.name));
      }
      if ((sets.length || guidesToo || decksToo) && !dryRun) console.log("Le pagine si rinnovano da sole entro qualche minuto (ISR); /u/<nome> e /creators al giro successivo.");
    }
  }
} catch (e) {
  // prima della migrazione (colonne o bucket assenti) o un errore del database
  console.error(
    e.code === "42703" || e.code === "42883"
      ? "Mancano colonne o funzioni del database: applica prima la migrazione (blocchi VETRINA e IMMAGINI di supabase/schema.sql)."
      : e.message,
  );
  process.exitCode = 3;
} finally {
  await db.end();
}
