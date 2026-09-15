@AGENTS.md

# OriginsMeta — note per Claude

Sito fan non ufficiale su Origins TCG (Koin Games), due lingue (en/it; il francese è stato ritirato il 15/09/2026, i testi FR restano nei dati), Next.js 16 + Tailwind 4, deploy su Vercel da GitHub `ultimacenere/originsmeta`. Proprietario: Pierluigi Cella. Contatto pubblico: staff@originsmeta.com.

## Regole del progetto

- Rispondere e commentare in italiano; i contenuti del sito sono in inglese e italiano e vanno sempre aggiornati insieme (`en` è il tipo di riferimento per i dizionari).
- Niente dati inventati: carte, statistiche, date ed eventi vengono solo dalle fonti ufficiali (pagina Steam, patch notes su Steam, Discord, comunicati). Le stat attuali sono quelle della patch 0.6.3 del playtest (27/08/2026).
- La dicitura "non affiliato a Koin Games" non si toglie mai.
- Nessuna dipendenza nuova senza motivo. Le pagine editoriali restano statiche; la parte community (account, mazzi pubblicati, voti) usa Supabase (`src/lib/supabase/`, `src/lib/community/`, schema in `supabase/schema.sql`) e solo `/account` e le pagine di modifica sono renderizzate sul server; `/decks` e le pagine `/decks/community/[slug]` sono ISR. Le funzioni future (tier list votata, tracker prezzi Steam Market) seguono lo stesso schema: tabella + policy RLS + Server Action, senza rompere la generazione statica.
- Segreti: `.env.local` (non committato) contiene la password del database per `scripts/db-migrate.mjs`; URL e chiave publishable di Supabase sono pubblici e hanno un default in `src/lib/supabase/env.ts`. Mai inserire il Client Secret di Discord o altri segreti nel codice: vanno solo nella dashboard Supabase.
- Prima di ogni push: `npm run build` deve passare senza errori.

## Decisioni di prodotto (note Granola 3.0 e 4.0, 15/09/2026)

- Menu: News · Tier list · Guide · Carte · Mazzi · Tornei ed Eventi. La sezione dei bilanciamenti si chiama **MetaShift**.
- Home above the fold: news del giorno + MetaShift + tier list; ricerca carte sempre visibile nell'header; calendario come striscia scorrevole (`EventTicker`), non come blocco statico.
- Tier list in tre sezioni (mazzi, leggendarie, carte base); mazzi con tag obbligatori (leggendaria, archetipo, creator); collegamenti incrociati tier list → mazzo → carta → guida.
- Colore dominante degli accenti: menta del logo (i competitor usano viola/rosa). Font: Unbounded (display), Manrope (testo).
- Analytics: Vercel Web Analytics + Speed Insights; niente GA4 per ora.
- Deck builder (`/deck-builder`, `src/lib/deckrules.ts`, `src/lib/deckcode.ts`, `src/components/DeckBuilder.tsx`): regole 1 Leggendaria + 12 carte base ×2 = 25 (fonte AMA Koin); formato codice del gioco KGBLDC decifrato (vedi README); campo `key` delle carte da popolare con gli ID ufficiali man mano che vengono appresi; la regola Conquest sul conteggio delle carte diverse va confermata con il regolamento.
- Community (15/09/2026): accesso senza password (Discord OAuth + magic link via Supabase Auth), pubblicazione dei mazzi dal deck builder con guida obbligatoria (piano di gioco) e sezioni facoltative, voto 1–5 stelle (uno per utente, mai sul proprio mazzo), profilo `/account` con modifica/nascondi/elimina. I testi delle guide sono testo semplice (niente Markdown/HTML) per evitare XSS. Provider Discord e SMTP di produzione vanno configurati nella dashboard Supabase (vedi README).

## Struttura

- `src/app/[locale]/…` pagine; il layout radice sta sotto `[locale]` (html lang per lingua). `src/app/global-not-found.tsx` gestisce i 404 fuori dalle lingue.
- `next.config.ts` reindirizza `/` alla lingua del browser.
- `src/lib/i18n.ts` locali, `href()`, `alternatesFor()`; `src/lib/page.ts` helper `resolveLocale` e `pageMeta`.
- Dati in `src/lib/data/*.ts`, guide in `src/lib/content/guides.ts`, media in `public/media/`.
- Community: `src/app/auth/callback/route.ts` (ritorno OAuth/magic link), `src/proxy.ts` (refresh sessione solo su `/account` e modifica mazzo), `src/app/[locale]/{login,account,decks/publish,decks/community/[slug]}`; componenti `LoginPanel`, `AccountMenu`, `PublishDeckForm`, `StarRating`, `OwnerActions`. Tipi delle tabelle in `src/lib/supabase/database.ts` (da aggiornare con lo schema).

## Palette ("ink & mint")

Sfondo viola inchiostro (`felt`), carte avorio (`ivory`), accento dominante menta (`mint`), giallo citrino solo per leggendarie ed evento evidenziato (`gold`), magenta per nerf e avvisi (`crimson`). Font: Unbounded (display), Manrope (testo), JetBrains Mono (numeri).
