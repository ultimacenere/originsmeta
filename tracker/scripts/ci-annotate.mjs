// Per GitHub Actions (.github/workflows/tracker-linux.yml, 13/11/2026): i test falliti di `node --test` (uscita TAP,
// quella di default senza terminale) come annotazioni del job. I registri di Actions si leggono solo con l'accesso al
// repository, le annotazioni no: così l'errore si vede anche dalla pagina pubblica del run e dall'API.
//
//   node scripts/ci-annotate.mjs test.log
import fs from "node:fs";

const lines = fs.readFileSync(process.argv[2], "utf8").split(/\r?\n/);
/** I caratteri che i comandi di Actions vogliono codificati. */
const enc = (s) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
/** Il titolo è una proprietà del comando: anche `:` e `,` vanno codificati. */
const encTitle = (s) => enc(s).replace(/:/g, "%3A").replace(/,/g, "%2C");
let shown = 0;
for (let i = 0; i < lines.length && shown < 10; i++) {
  const m = /^\s*not ok \d+ - (.*)$/.exec(lines[i]);
  if (!m) continue;
  const block = [];
  for (let j = i + 1; j < lines.length && j < i + 60 && !/^\s*\.\.\.\s*$/.test(lines[j]); j++) block.push(lines[j].trim());
  // il gruppo che fallisce perché è fallito un suo test: basta il test
  if (block.some((l) => /failureType: 'subtestsFailed'/.test(l))) continue;
  console.log(`::error title=${encTitle(m[1].slice(0, 120))}::${enc(block.join("\n").slice(0, 3500))}`);
  shown++;
}
// il reporter "spec" (quello di default di Node 24 anche senza terminale) mette i test falliti in fondo, dopo
// "✖ failing tests:": si manda quel pezzo, o le ultime righe se l'errore è arrivato prima dei test
if (!shown) {
  const at = lines.findIndex((l) => /failing tests:/.test(l));
  const tail = at >= 0 ? lines.slice(at, at + 80) : lines.slice(-40);
  console.log(`::error title=npm test::${enc(tail.join("\n").slice(0, 3500))}`);
}
