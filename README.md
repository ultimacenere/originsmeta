# OriginsMeta

Sito community non ufficiale su **Origins TCG** (Koin Games): database carte, mazzi, tier list, tracker delle patch, calendario tornei e guide. Due lingue: inglese (`/en`) e italiano (`/it`); il francese è stato ritirato (i vecchi link /fr reindirizzano a /en) e i testi FR restano nei file dati per un eventuale ritorno. Online su [originsmeta.com](https://originsmeta.com).

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
| Testi dell'interfaccia (EN/IT) | `src/lib/dictionaries/{en,it}.ts` |
| Carte, statistiche, storico patch, saghe | `src/lib/data/cards.ts` |
| Eventi e tornei | `src/lib/data/events.ts` |
| Mazzi (tag: leggendaria, archetipo, creator) | `src/lib/data/decks.ts` |
| Tier list (mazzi, leggendarie, carte base) | `src/lib/data/tierlist.ts` |
| News (riassunti + link alla fonte) | `src/lib/data/news.ts` |
| Guide (Markdown, EN/IT, con categoria e tag di collegamento) | `src/lib/content/guides.ts` |
| Immagini ufficiali ottimizzate | `public/media/` |
| Palette e componenti CSS | `src/app/globals.css` |

### Aggiungere una carta

In `src/lib/data/cards.ts` aggiungi un oggetto all'array `cards` con `slug`, `name`, `type` (`unit` / `spell` / `token`), `saga`, statistiche e `history` (una voce per patch, con `from`/`to` e nota in tre lingue). Le pagine `/cards` e `/cards/[slug]` e il tracker delle patch si aggiornano da soli; la sitemap pure.

### Aggiungere un mazzo

In `src/lib/data/decks.ts` aggiungi un oggetto a `decks` con `slug`, `name`, `archetype` (chiave di `archetypeLabels`), `creator` (nome, url, video), `source` (`playtest` / `official` / `community`), `legendary` (slug della carta, se nota) e le carte note. La pagina `/decks`, la scheda `/decks/[slug]`, i collegamenti dalle carte e la sitemap si aggiornano da soli.

### Aggiornare la tier list

In `src/lib/data/tierlist.ts` sposta gli slug tra i tier S–D delle tre sezioni (mazzi, leggendarie, carte base) e aggiorna `updated`. Ogni spostamento va spiegato in una news.

### Immagini delle carte

Quando disponibili, salvale in `public/cards/<slug>.webp` e imposta `image` sulla carta in `cards.ts`; senza immagine le schede mostrano una cornice con le iniziali.

### Aggiungere una guida

In `src/lib/content/guides.ts` aggiungi lo slug a `guideSlugs` e la voce nelle mappe `en` e `it`, con `category` e i `tags` (mazzi e carte collegati). Il corpo è Markdown.

## Deploy e dominio

- Progetto Vercel `originsmeta` nel team "Ultima Cenere's projects", collegato a GitHub `ultimacenere/originsmeta` (branch `main` = produzione). URL Vercel: https://originsmeta.vercel.app
- Dominio principale `originsmeta.com` (Register.it): record **A `@` → 216.150.1.1** (Vercel; il legacy 76.76.21.21 funziona ancora). `www.originsmeta.com` è un redirect verso l'apex configurato su Vercel: record **CNAME `www` → 4cb33c26b92bb944.vercel-dns-016.com** (valore indicato da Vercel per questo progetto; il legacy cname.vercel-dns.com funziona ancora).
- Push da questa cartella: il repo ha un credential helper locale che legge il token GitHub dal file usato da transferbeat; il token deve avere `Contents: Read and write` sul repo.

## Analytics

Vercel Web Analytics e Speed Insights sono inclusi nel layout (senza cookie, nessun banner). Vanno abilitati una volta nel progetto Vercel (tab Analytics e Speed Insights). GA4 non è attivo: richiederebbe il consenso cookie.

## Convenzioni

- Ogni dato ha una fonte ufficiale (pagina Steam, patch notes, Discord). Se un dato non è verificato non entra.
- Sempre presente la dicitura di non affiliazione con Koin Games (header, footer, about).
- Le immagini ufficiali arrivano dal media kit di Koin Games e restano di loro proprietà.
