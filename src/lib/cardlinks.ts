import { cards, type Card } from "./data/cards";

/**
 * Nomi di carta nei testi liberi della community (guide dei mazzi; in futuro i commenti).
 *
 * `linkCardNames(testo)` spezza una stringa di testo semplice in tratti: stringhe da mostrare così come sono e
 * menzioni `{ slug, name, text }` da trasformare in link alla scheda della carta (vedi `components/CardMentions.tsx`).
 * Il testo non viene mai normalizzato né interpretato come HTML: si restituiscono solo porzioni dell'originale,
 * a-capo compresi, quindi `whitespace-pre-line` continua a funzionare.
 *
 * Regole di riconoscimento:
 * - candidati: le carte con `status === "active"`, carte create (token) comprese perché le guide le citano;
 *   i nomi precedenti (`formerName`) non contano;
 * - vince la corrispondenza più lunga: i nomi stanno nell'alternanza ordinati per lunghezza decrescente, così
 *   "Merlin's Prophecy" batte "Merlin", "Jack-in-the-Box" batte "Jack" e "Not So Little Pig" batte "Little Pig";
 * - confini di parola Unicode: subito prima e subito dopo il nome non ci deve essere una lettera o una cifra
 *   (`\p{L}`, `\p{N}`), quindi "Dracula's" collega "Dracula", "d'Aladdin" collega "Aladdin" e "Little Pigs" non
 *   collega "Little Pig";
 * - nomi di più parole: maiuscole libere ("first aid" → First Aid); nomi di una sola parola: l'iniziale deve essere
 *   maiuscola come nel nome ufficiale, per non collegare parole comuni (beast, mouse, garlic, pumpkin…);
 * - l'apostrofo del nome vale sia dritto (') sia tipografico (’); uno spazio nel nome vale una sequenza di spazi bianchi;
 * - si collegano tutte le occorrenze; i caratteri speciali dei nomi ("Freeze!", "Off With Your Head!") sono escapati,
 *   quindi "Freeze" senza punto esclamativo non è la carta;
 * - i nomi ufficiali sono in inglese anche nelle guide italiane.
 *
 * La mappa e l'espressione regolare si costruiscono una volta sola al caricamento del modulo.
 * Solo lato server: importa il database carte, che non deve finire nel bundle client.
 */

/** Tratto di testo riconosciuto come carta: `text` è la porzione originale scritta dall'utente, `name` il nome ufficiale. */
export type CardMention = { slug: string; name: string; text: string };
/** Tratto di testo semplice oppure menzione di una carta. */
export type CardTextSegment = string | CardMention;

const WORD = "\\p{L}\\p{N}";

/** Escapa un carattere letterale fuori da una classe: con il flag `u` sono ammessi solo gli escape dei caratteri di sintassi (non `\-`). */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

/** Escapa un carattere dentro una classe `[...]`. */
function escapeClassChar(ch: string): string {
  return /[\\\]^-]/.test(ch) ? `\\${ch}` : ch;
}

/** Chiave di confronto tra testo trovato e nome ufficiale: apostrofi e spazi normalizzati, minuscolo. */
function nameKey(s: string): string {
  return s.trim().replace(/’/g, "'").replace(/\s+/g, " ").toLowerCase();
}

/** Espressione regolare (come stringa) di un nome, secondo le regole in testa al file. */
function namePattern(name: string): string {
  const chars = [...name.trim()];
  const multiWord = chars.some((ch) => /\s/u.test(ch));
  return chars
    .map((ch, i) => {
      if (/\s/u.test(ch)) return "\\s+";
      if (ch === "'" || ch === "’") return "['’]";
      const lower = ch.toLowerCase();
      const upper = ch.toUpperCase();
      const caseFree = multiWord || i > 0;
      if (caseFree && lower !== upper && [...lower].length === 1 && [...upper].length === 1) {
        return `[${escapeClassChar(upper)}${escapeClassChar(lower)}]`;
      }
      return escapeRegExp(ch);
    })
    .join("");
}

const candidates: Card[] = cards.filter((c) => c.status === "active" && c.name.trim());
const byKey = new Map<string, Card>(candidates.map((c) => [nameKey(c.name), c]));
const alternatives = [...candidates]
  .sort((a, b) => [...b.name].length - [...a.name].length)
  .map((c) => namePattern(c.name))
  .join("|");
const pattern = new RegExp(`(?<![${WORD}])(?:${alternatives})(?![${WORD}])`, "gu");

/** Spezza il testo in tratti semplici e menzioni di carte; senza carte restituisce il testo intero in un solo tratto. */
export function linkCardNames(text: string): CardTextSegment[] {
  const out: CardTextSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const card = byKey.get(nameKey(m[0]));
    if (!card) continue;
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    out.push({ slug: card.slug, name: card.name, text: m[0] });
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
