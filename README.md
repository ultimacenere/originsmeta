# OriginsMeta

Sito community non ufficiale su **Origins TCG** (Koin Games): database carte, mazzi, tier list, tracker delle patch, calendario tornei e guide. Tre lingue: inglese (`/en`), italiano (`/it`), francese (`/fr`). Online su [originsmeta.com](https://originsmeta.com).

## Stack

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4, `marked` per le guide in Markdown.
- Nessun database: i contenuti stanno in `src/lib/data/*.ts` e `src/lib/content/guides.ts`.
- Hosting: Vercel, collegato al repo GitHub `ultimacenere/originsmeta`. Ogni push su `main` ripubblica.

## Comandi

```bash
npm install
npm run dev     # http://localhost:3000 (la radice reindirizza alla lingua del browser)
npm run build   # build di produzione, da lanciare prima di ogni push
npm run lint
```

## Dove si aggiorna cosa

| Cosa | File |
| --- | --- |
| Testi dell'interfaccia (3 lingue) | `src/lib/dictionaries/{en,it,fr}.ts` |
| Carte, statistiche, storico patch, saghe | `src/lib/data/cards.ts` |
| Eventi e tornei | `src/lib/data/events.ts` |
| Archetipi dei mazzi | `src/lib/data/decks.ts` |
| News (riassunti + link alla fonte) | `src/lib/data/news.ts` |
| Guide (Markdown, 3 lingue) | `src/lib/content/guides.ts` |
| Immagini ufficiali ottimizzate | `public/media/` |
| Palette e componenti CSS | `src/app/globals.css` |

### Aggiungere una carta

In `src/lib/data/cards.ts` aggiungi un oggetto all'array `cards` con `slug`, `name`, `type` (`unit` / `spell` / `token`), `saga`, statistiche e `history` (una voce per patch, con `from`/`to` e nota in tre lingue). Le pagine `/cards` e `/cards/[slug]` e il tracker delle patch si aggiornano da soli; la sitemap pure.

### Aggiungere una guida

In `src/lib/content/guides.ts` aggiungi lo slug a `guideSlugs` e la voce nelle tre mappe `en`, `it`, `fr`. Il corpo è Markdown.

## Convenzioni

- Ogni dato ha una fonte ufficiale (pagina Steam, patch notes, Discord). Se un dato non è verificato non entra.
- Sempre presente la dicitura di non affiliazione con Koin Games (header, footer, about).
- Le immagini ufficiali arrivano dal media kit di Koin Games e restano di loro proprietà.
