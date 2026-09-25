#!/usr/bin/env node
/**
 * Controlla che i mazzi della community linkati dalle guide esistano ancora: `node scripts/check-guide-decks.mjs`.
 *
 * Le guide sono statiche e linkano le schede `/xx/decks/community/<slug>` scritte a mano (la guida alle Leggendarie e
 * quella al Conquest dell'Ondata 3 ne linkano 20, più i `tags.communityDecks` delle guide ai mazzi). Se un autore
 * nasconde o cancella un mazzo, la guida resta con un link rotto e con numeri che non tornano, e i test non lo vedono
 * (controllano solo la forma dello slug). Questo script legge i mazzi pubblicati come li legge chiunque (chiave
 * pubblica di Supabase, policy RLS: solo lettura) e segnala gli slug delle guide che non ci sono. Esce con 1 se ne
 * manca qualcuno. Stampa anche quanti mazzi sono pubblicati e l'ora dell'ultimo, per ricontare le fotografie datate
 * delle guide (numeri della community fissati a una data e un'ora).
 */
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const env = read("src/lib/supabase/env.ts");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.match(/supabaseUrl\s*=[^"]*"([^"]+)"/)?.[1];
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.match(/supabaseKey\s*=[^"]*"([^"]+)"/)?.[1];
if (!url || !key) throw new Error("Configurazione pubblica di Supabase non trovata in src/lib/supabase/env.ts");

const r = await fetch(`${url}/rest/v1/community_decks?select=slug,created_at&status=eq.published&order=created_at.asc`, {
  headers: { apikey: key },
});
if (!r.ok) throw new Error(`Supabase ha risposto ${r.status}`);
const decks = await r.json();
const published = new Set(decks.map((d) => d.slug));

const files = ["src/lib/content/guides.ts", "src/lib/content/guides-es.ts"];
const linked = new Map();
for (const file of files) {
  const text = read(file);
  for (const m of text.matchAll(/\/decks\/community\/([a-z0-9-]+)/g)) linked.set(m[1], file);
  for (const m of text.matchAll(/communityDecks:[^\]]*\]/g))
    for (const s of m[0].matchAll(/slug: "([a-z0-9-]+)"/g)) linked.set(s[1], file);
}

const missing = [...linked].filter(([slug]) => !published.has(slug));
console.log(`Mazzi pubblicati: ${decks.length} (l'ultimo creato il ${decks.at(-1)?.created_at ?? "—"})`);
console.log(`Mazzi linkati dalle guide: ${linked.size}`);
if (missing.length) {
  console.log("Non più pubblicati (nascosti, cancellati o slug sbagliato):");
  for (const [slug, file] of missing) console.log(`  ${slug}  (${file})`);
  process.exit(1);
}
console.log("Tutti i mazzi linkati dalle guide sono pubblicati.");
