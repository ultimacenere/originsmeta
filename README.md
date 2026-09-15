# OriginsMeta

Sito community non ufficiale su **Origins TCG** (Koin Games): database carte, mazzi, tier list, tracker delle patch, calendario tornei e guide. Due lingue: inglese (`/en`) e italiano (`/it`); il francese è stato ritirato (i vecchi link /fr reindirizzano a /en) e i testi FR restano nei file dati per un eventuale ritorno. Online su [originsmeta.com](https://originsmeta.com).

## Stack

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4, `marked` per le guide in Markdown.
- I contenuti editoriali (carte, news, tier list, guide, mazzi del playtest) stanno in `src/lib/data/*.ts` e `src/lib/content/guides.ts`: pagine statiche.
- La parte community (account, mazzi pubblicati dagli utenti con guida, voti 1–5 stelle) sta su **Supabase** (Postgres + Auth), vedi sotto.
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
| Schema del database community (tabelle, trigger, policy RLS) | `supabase/schema.sql` (+ `scripts/db-migrate.mjs`) |
| Tipi delle tabelle per supabase-js | `src/lib/supabase/database.ts` |
| Client Supabase (browser, server, pubblico) e flag di attivazione | `src/lib/supabase/` |
| Pubblicazione, modifica, voti (Server Action) e letture | `src/lib/community/` |

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

## Community: account, mazzi pubblicati, voti

- Progetto Supabase `originsmeta` (org "Cobram Developing", regione eu-west-1, piano Free). URL e chiave publishable hanno un default in `src/lib/supabase/env.ts` (sono pubblici per costruzione: i permessi li danno le policy RLS); `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` li sovrascrivono, `NEXT_PUBLIC_COMMUNITY=off` spegne tutta la parte community. Vedi `.env.example`.
- **Schema** in `supabase/schema.sql` (idempotente): `profiles` (creato da un trigger a ogni nuovo utente: username unico, nome, avatar, id Discord, ruolo `user`/`admin`), `community_decks` (mazzo + guida JSON + video + `code_om`, stato `published`/`hidden`/`draft`), `deck_votes` (una riga per utente e mazzo, 1–5 stelle), vista `deck_ratings` (media e numero voti), `deck_reports`. Le policy RLS: i mazzi pubblicati li leggono tutti, solo il proprietario (o un admin) li modifica/nasconde/elimina; un utente vota una volta per mazzo, mai il proprio. Per applicare lo schema: `node scripts/db-migrate.mjs` (legge password e host del pooler da `.env.local`; in alternativa incollare il file nell'SQL Editor di Supabase). Per nominare un admin: `update public.profiles set role = 'admin' where username = '…';`.
- **Accesso** (`/login`, `src/components/LoginPanel.tsx`): Discord (OAuth) oppure link usa e getta via email (magic link). Nessuna password. Il ritorno passa da `src/app/auth/callback/route.ts`, che scambia il codice con la sessione e rimanda a `next`. I cookie di sessione li gestisce `@supabase/ssr`; `src/proxy.ts` li rinfresca solo sulle pagine renderizzate sul server (`/account`, modifica mazzo). L'header mostra lo stato di accesso con `AccountMenu` (idratato lato client: le pagine restano statiche).
- **Configurazione Auth su Supabase** (Authentication → URL Configuration): Site URL `https://originsmeta.com`; redirect consentiti `https://originsmeta.com/**`, `https://www.originsmeta.com/**`, `https://originsmeta.vercel.app/**`, `http://localhost:3000/**`. **Discord**: creare un'applicazione su discord.com/developers → OAuth2 → copiare Client ID e Client Secret, aggiungere il redirect `https://obpnprlzxrlbvncpqlpq.supabase.co/auth/v1/callback`; poi su Supabase Authentication → Sign In / Providers → Discord: abilitare e incollare ID e secret. Finché non è fatto, il bottone Discord risponde "non disponibile" e resta il link via email (provider attivato e testato il 15/09/2026). **Email**: il mittente predefinito di Supabase è limitato (poche email l'ora, solo per sviluppo). In produzione (dal 15/09/2026) le email partono dalla casella Register `staff@originsmeta.com` via SMTP autenticato: Authentication → Emails → SMTP Settings con host `smtp.securemail.pro`, porta 465, username `staff@originsmeta.com`, password della casella. Non usare `authsmtp.register.it` come host: è lo stesso server, ma il suo certificato TLS è intestato a `smtp.mail.webnode.com` / `*.securemail.pro` e Supabase rifiuta la connessione (errore `x509: certificate is valid for…` nei log Auth). Il dominio ha già MX e SPF di Register, quindi non servono record DNS. Brevo era la prima scelta ma la generazione della chiave SMTP falliva lato Brevo. Limite Supabase: una richiesta di link per indirizzo al minuto (la pagina di accesso lo spiega) e 30 email l'ora complessive (alzabile in Rate Limits).
- **Pubblicazione** (`/decks/publish`, `src/components/PublishDeckForm.tsx`): dal deck builder il bottone "Pubblica sul sito" passa il mazzo nell'hash (`#OM1…`); la pagina chiede l'accesso se serve (il mazzo resta in `localStorage` nel frattempo), poi nome, archetipo, lingua della guida, piano di gioco (obbligatorio), punti di forza/deboli, mulligan, combo, matchup, note e video. La Server Action `publishDeck` (`src/lib/community/actions.ts`) rivalida il mazzo contro il database carte (`checkDeck`), genera lo slug e inserisce la riga. Pagina pubblica `/decks/community/[slug]` (ISR, 60 s) con voto a stelle (`StarRating`), video YouTube incorporato, "Apri nel deck builder", comandi del proprietario (`OwnerActions`: modifica, nascondi, elimina). `/account` elenca i mazzi dell'utente con stato e valutazione. I mazzi pubblicati compaiono anche in `/decks` (ISR, 5 min) con la media voti e nella sitemap.
- Le pagine `/login`, `/decks/publish`, `/account` e le pagine di modifica sono `noindex`.

## Home, slider e grafici dei mazzi

- **Slider** (`src/components/HeroSlider.tsx`, home): immagini ufficiali del media kit con didascalie in `home.slides` dei dizionari; rotazione automatica, frecce (solo da tablet in su), puntini, tastiera e swipe; si ferma con il mouse, il focus e "riduci animazioni". La striscia del calendario sta **sotto** lo slider in home e subito sotto l'header nelle altre pagine: le pagine vivono nel gruppo di rotte `src/app/[locale]/(site)` (layout con `EventTicker` + `<main>`), la home in `src/app/[locale]/(home)`. Gli URL non cambiano.
- **Grafici di composizione** (`src/lib/deckstats.ts` + `src/components/DeckCharts.tsx`, SVG inline senza librerie) nelle schede mazzo del playtest e della community: curva di mana impilata (unità/magie, Leggendaria in oro), costo medio, carte giocabili entro il turno 3, potenza e salute totali, ciambella unità/magie con fasce di costo, carte per saga con sinergia con la Leggendaria, parole chiave, carta più cara/economica, riquadro "win rate" già predisposto per le API ufficiali. Scelte prese dal censimento delle pagine mazzo di hsreplay, untapped, marvelsnapzone, limitless, dreamborn, aetherhub (15/09/2026).

## Deck builder e codici-mazzo

- Pagina `/deck-builder` (client, senza backend): regole del gioco integrate (1 Leggendaria + 12 carte base diverse, seconda copia automatica = 25 carte), mazzo singolo o **modalità torneo** con tre mazzi e controllo Conquest (Leggendarie diverse, almeno N carte fisiche diverse tra due mazzi, N modificabile, default 9), curva di mana, salvataggio nel browser, link di condivisione, export testuale, invio via email e **"Pubblica sul sito"** (vedi sopra).
- Regole e validazioni in `src/lib/deckrules.ts`; codec in `src/lib/deckcode.ts`.
- **Formato del gioco** (`KGBLDC`): `KGBLDC` + base64("v1|CHIAVE|CHIAVE…") + ":" + checksum (primi 4 byte di SHA-256 del payload, esadecimale). Le chiavi sono ID interni delle carte (es. `C00042_MB`, variante cosmetica `_V00002`), ordinate per numero. L'export in questo formato richiede il campo `key` sulle carte in `cards.ts`: per ora sconosciuto; l'import di un codice del gioco mostra le chiavi non abbinate e permette di inviarci l'abbinamento ("Insegnaci gli ID ufficiali").
- **Formato OriginsMeta** (`OM1.`): base64url di JSON con nome, leggendaria, carte e carte personalizzate; usato per i link di condivisione (`/deck-builder#OM1.…`).

## Analytics

Vercel Web Analytics e Speed Insights sono inclusi nel layout (senza cookie, nessun banner). Vanno abilitati una volta nel progetto Vercel (tab Analytics e Speed Insights). GA4 non è attivo: richiederebbe il consenso cookie.

## Convenzioni

- Ogni dato ha una fonte ufficiale (pagina Steam, patch notes, Discord). Se un dato non è verificato non entra.
- Sempre presente la dicitura di non affiliazione con Koin Games (header, footer, about).
- Le immagini ufficiali arrivano dal media kit di Koin Games e restano di loro proprietà.
