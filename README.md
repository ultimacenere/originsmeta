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
| Carte: dati di gioco importati da World of Origins | `src/lib/data/woo-cards.json` (generato da `npm run import:woo`) |
| Carte: saghe, origini e traduzioni italiane | `src/lib/data/card-lore.ts` |
| Carte: storico bilanciamenti (patch notes ufficiali) | `src/lib/data/card-history.ts` |
| Carte: tipi, saghe, patch e unione dei tre file | `src/lib/data/cards.ts` |
| Eventi e tornei | `src/lib/data/events.ts` |
| Mazzi (tag: leggendaria, archetipo, creator) | `src/lib/data/decks.ts` |
| Tier list (mazzi, leggendarie, carte base) | `src/lib/data/tierlist.ts` |
| News (riassunti + link alla fonte; per i mazzi pubblicati qui `source: "community"` o `"staff"`, url interno e guide collegate) | `src/lib/data/news.ts` |
| Guide (Markdown, EN/IT, con categoria e tag di collegamento) | `src/lib/content/guides.ts` |
| Immagini ufficiali ottimizzate | `public/media/` |
| Palette e componenti CSS | `src/app/globals.css` |
| Schema del database community (tabelle, trigger, policy RLS) | `supabase/schema.sql` (+ `scripts/db-migrate.mjs`) |
| Tipi delle tabelle per supabase-js | `src/lib/supabase/database.ts` |
| Client Supabase (browser, server, pubblico) e flag di attivazione | `src/lib/supabase/` |
| Pubblicazione, modifica, voti (Server Action) e letture | `src/lib/community/` |

### Aggiungere una carta

I dati di gioco (nome, costo, statistiche, testo inglese, tag, rarità, allineamento, ID ufficiale, carte collegate) arrivano dal database community [World of Origins](https://worldoforigins.fun): `npm run import:woo` scarica i chunk del sito, prende la patch più recente e riscrive `src/lib/data/woo-cards.json` (122 carte della Demo 2.0, 86 rimosse nelle build precedenti, 22 carte create), stampando le differenze rispetto all'import precedente e controllando che lo storico scritto a mano coincida con le statistiche per patch. Per ogni carta nuova o con testo cambiato va aggiornato `src/lib/data/card-lore.ts` (saga, una riga sull'origine in EN e IT, traduzione italiana del testo; le parole chiave restano in inglese). I bilanciamenti trascritti dalle patch notes stanno in `src/lib/data/card-history.ts`, per slug. Le pagine `/cards` (filtri per tipo, saga, allineamento, rarità, carte rimosse) e `/cards/[slug]` (testo EN/IT, carte collegate, storico) e la sitemap si aggiornano da sole. Nessuna immagine viene importata.

### Aggiungere un mazzo

In `src/lib/data/decks.ts` aggiungi un oggetto a `decks` con `slug`, `name`, `archetype` (chiave di `archetypeLabels`), `creator` (nome, url, video), `source` (`playtest` / `official` / `community`), `legendary` (slug della carta, se nota) e le carte note. La pagina `/decks`, la scheda `/decks/[slug]`, i collegamenti dalle carte e la sitemap si aggiornano da soli.

### Aggiornare la tier list

In `src/lib/data/tierlist.ts` sposta gli slug tra i tier S–D delle tre sezioni (mazzi, leggendarie, carte base) e aggiorna `updated`. Ogni spostamento va spiegato in una news.

### Immagini delle carte

Le illustrazioni ufficiali arrivano dal materiale Koin (archivio in `G:\Il mio Drive\OriginsMeta\10_Materiale_Koin`, con le condizioni d'uso). Non si copiano a mano: le genera

```
npm run import:art -- --src "<cartella dei PNG delle carte>"
```

che scrive quattro derivati per carta in `public/` e il manifest generato `src/lib/data/card-art.json`, indicizzato per chiave ufficiale (`C00064_MB`, la stessa dei codici mazzo). `cards.ts` legge il manifest e popola da solo i campi della carta:

| File | Campo | Dove si vede |
| --- | --- | --- |
| `public/cards/<slug>.webp` (480 px) | `image` | carta da collezione nella scheda carta, anteprima social |
| `public/cards/sm/<slug>.webp` (160 px) | `thumb` | chip (`CardArt`), griglia di `/cards`, tier list |
| `public/cards/art/<slug>.webp` (560 px) | `art` | finestra d'arte della carta di gioco (`GameCard`) |
| `public/cards/cover/<slug>.webp` (1200×675) | `cover` | solo Leggendarie: copertina dei mazzi della community |

I PNG originali non entrano nel repo (610 MB). Lo script importa solo la variante base `V00000`, elenca le varianti alternative nel manifest senza convertirle, e salta le carte che il database non conosce. Le carte senza illustrazione mostrano da sole la cornice con le iniziali.

I crediti stampati sulle carte (illustratore e numero di collezione) stanno in `src/lib/data/card-credits.ts`, scritto a mano: vanno sempre mostrati accanto all'illustrazione.

**La carta di gioco** (`src/components/GameCard.tsx`, stili `.game-card` in `globals.css`) è disegnata da noi con i dati del database — quindi anche in italiano — e usa solo la finestra d'arte: la cornice, la palette e il testo sono del sito. La carta ufficiale dentro lo slab resta `CardArt`.

**Copertina dei mazzi della community**: è automatica, l'illustrazione della Leggendaria del mazzo (`cover`). Nessuno la sceglie, né in `/decks` né nell'anteprima social della scheda mazzo.

### Aggiungere una guida

In `src/lib/content/guides.ts` aggiungi lo slug a `guideSlugs` e la voce nelle mappe `en` e `it`, con `category` e i `tags` (mazzi e carte collegati). Il corpo è Markdown; i link interni vanno scritti con il prefisso lingua (`/en/…`, `/it/…`). Per una guida a un mazzo della community usa `tags.communityDecks` (slug della scheda `/decks/community/[slug]` e nome del mazzo): la guida mostra il mazzo tra i correlati e la scheda del mazzo mostra la guida in "Guide correlate", senza leggere Supabase (la guida resta statica). Prime guide di questo tipo: le quattro sui mazzi di Davdas (16/09/2026).

### Aggiungere una news

In `src/lib/data/news.ts`: `slug`, `date` (data dell'evento), `title` e `summary` in EN/IT (l'helper `n` richiede anche il FR), `image` obbligatoria (media kit in `public/media/` o miniatura YouTube ufficiale), `url` e `source`: `steam` per i post ufficiali, `press` per stampa e siti community esterni, `community` per i mazzi della community. In quest'ultimo caso `url` è il percorso interno senza lingua (es. `/decks/community/<slug>`) e il link diventa "Apri il mazzo" (`src/components/NewsLinks.tsx`). Campi facoltativi: `cards` (chip delle carte) e `guides` (slug delle guide del sito, elencate sotto la news in home e in /news). Le due news più recenti vanno in evidenza in home.

## Deploy e dominio

- Progetto Vercel `originsmeta` nel team "Ultima Cenere's projects", collegato a GitHub `ultimacenere/originsmeta` (branch `main` = produzione). URL Vercel: https://originsmeta.vercel.app
- Dominio principale `originsmeta.com` (Register.it): record **A `@` → 216.150.1.1** (Vercel; il legacy 76.76.21.21 funziona ancora). `www.originsmeta.com` è un redirect verso l'apex configurato su Vercel: record **CNAME `www` → 4cb33c26b92bb944.vercel-dns-016.com** (valore indicato da Vercel per questo progetto; il legacy cname.vercel-dns.com funziona ancora).
- Push da questa cartella: il repo ha un credential helper locale che legge il token GitHub dal file usato da transferbeat; il token deve avere `Contents: Read and write` sul repo.

## Community: account, mazzi pubblicati, voti

- Progetto Supabase `originsmeta` (org "Cobram Developing", regione eu-west-1, piano Free). URL e chiave publishable hanno un default in `src/lib/supabase/env.ts` (sono pubblici per costruzione: i permessi li danno le policy RLS); `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` li sovrascrivono, `NEXT_PUBLIC_COMMUNITY=off` spegne tutta la parte community. Vedi `.env.example`.
- **Schema** in `supabase/schema.sql` (idempotente): `profiles` (creato da un trigger a ogni nuovo utente: username unico, nome, avatar, id Discord, ruolo `user`/`admin`), `community_decks` (mazzo + guida JSON + video + `code_om`, stato `published`/`hidden`/`draft`), `deck_votes` (una riga per utente e mazzo, 1–5 stelle), vista `deck_ratings` (media e numero voti), `deck_reports`. Le policy RLS: i mazzi pubblicati li leggono tutti, solo il proprietario (o un admin) li modifica/nasconde/elimina; un utente vota una volta per mazzo, mai il proprio. Per applicare lo schema: `node scripts/db-migrate.mjs` (legge password e host del pooler da `.env.local`; in alternativa incollare il file nell'SQL Editor di Supabase). Per nominare un admin: `node scripts/make-admin.mjs <utente>`. Dal 15/09/2026 (note 5.0): `community_decks.deck_types` (uno o più tra ladder / competitive / fun / tournament, caselle nel modulo di pubblicazione; la vecchia colonna `deck_type` resta inutilizzata) e `profiles.badge` (community / influencer / pro / staff), assegnato solo dallo staff con `node scripts/set-badge.mjs <utente> <tag>`; un trigger rifiuta il cambio di tag da parte degli utenti.
- **Accesso** (`/login`, `src/components/LoginPanel.tsx`): Discord (OAuth) oppure link usa e getta via email (magic link). Nessuna password. Il ritorno passa da `src/app/auth/callback/route.ts`, che scambia il codice con la sessione e rimanda a `next`. I cookie di sessione li gestisce `@supabase/ssr`; `src/proxy.ts` li rinfresca solo sulle pagine renderizzate sul server (`/account`, modifica mazzo). L'header mostra lo stato di accesso con `AccountMenu` (idratato lato client: le pagine restano statiche).
- **Configurazione Auth su Supabase** (Authentication → URL Configuration): Site URL `https://originsmeta.com`; redirect consentiti `https://originsmeta.com/**`, `https://www.originsmeta.com/**`, `https://originsmeta.vercel.app/**`, `http://localhost:3000/**`. **Discord**: creare un'applicazione su discord.com/developers → OAuth2 → copiare Client ID e Client Secret, aggiungere il redirect `https://obpnprlzxrlbvncpqlpq.supabase.co/auth/v1/callback`; poi su Supabase Authentication → Sign In / Providers → Discord: abilitare e incollare ID e secret. Finché non è fatto, il bottone Discord risponde "non disponibile" e resta il link via email (provider attivato e testato il 15/09/2026). **Email**: il mittente predefinito di Supabase è limitato (poche email l'ora, solo per sviluppo). In produzione (dal 15/09/2026) le email partono dalla casella Register `staff@originsmeta.com` via SMTP autenticato: Authentication → Emails → SMTP Settings con host `smtp.securemail.pro`, porta 465, username `staff@originsmeta.com`, password della casella. Non usare `authsmtp.register.it` come host: è lo stesso server, ma il suo certificato TLS è intestato a `smtp.mail.webnode.com` / `*.securemail.pro` e Supabase rifiuta la connessione (errore `x509: certificate is valid for…` nei log Auth). Il dominio ha già MX e SPF di Register, quindi non servono record DNS. Brevo era la prima scelta ma la generazione della chiave SMTP falliva lato Brevo. Limite Supabase: una richiesta di link per indirizzo al minuto (la pagina di accesso lo spiega) e 30 email l'ora complessive (alzabile in Rate Limits).
- **Pubblicazione** (`/decks/publish`, `src/components/PublishDeckForm.tsx`): dal deck builder il bottone "Pubblica sul sito" passa il mazzo nell'hash (`#OM1…`); la pagina chiede l'accesso se serve (il mazzo resta in `localStorage` nel frattempo), poi nome, archetipo, lingua della guida, piano di gioco (obbligatorio), punti di forza/deboli, mulligan, combo, matchup, note e video. La Server Action `publishDeck` (`src/lib/community/actions.ts`) rivalida il mazzo contro il database carte (`checkDeck`), genera lo slug e inserisce la riga. Pagina pubblica `/decks/community/[slug]` (ISR, 60 s) con voto a stelle (`StarRating`), video YouTube incorporato, "Apri nel deck builder", comandi del proprietario (`OwnerActions`: modifica, nascondi, elimina). `/account` elenca i mazzi dell'utente con stato e valutazione. I mazzi pubblicati compaiono anche in `/decks` (ISR, 5 min) con la media voti e nella sitemap.
- **Nomi di carta nelle guide** (richiesta di Davdas, sviluppato il 16/09/2026): nella scheda `/decks/community/[slug]` i nomi ufficiali delle carte citati nel piano di gioco e nelle sezioni della guida diventano link alla scheda carta con anteprima al passaggio del mouse o al focus da tastiera (costo, potenza/salute, tipo, Leggendaria, saga, testo nella lingua della pagina, segnaposto illustrazione `CardArt`). Il riconoscimento sta in `src/lib/cardlinks.ts` (funzione pura `linkCardNames`: carte attive token compresi, corrispondenza più lunga, confini di parola Unicode, apostrofi dritti e tipografici, nomi di una sola parola solo con l'iniziale maiuscola; solo lato server, il database carte non va nel bundle client), il rendering in `src/components/CardMentions.tsx` (nodi React, mai HTML; pannello CSS `.card-mention*` in `globals.css`, nascosto su touch dove il tocco apre la scheda carta) più il client component minuscolo `CardMentionEdges`, che sposta il pannello quando sfonderebbe i bordi della finestra. Gli estratti in `/decks` e in home e le guide editoriali in Markdown non sono toccati; il modulo è pronto per i commenti.
- Le pagine `/login`, `/decks/publish`, `/account` e le pagine di modifica sono `noindex`.

### CAPTCHA sull'accesso (Turnstile, dal 20/09/2026)

Dal 17/09/2026 dei bot chiedevano link di accesso in continuazione: 54 account finti in due giorni, nessuno con un accesso, e altrettante email non richieste partite dal nostro SMTP. Il modulo email di `LoginPanel` è ora protetto da **Cloudflare Turnstile**. La verifica del token la fa **Supabase**, non il sito: nel codice servono solo il widget (`src/components/Turnstile.tsx`) e il `captchaToken` passato a `signInWithOtp` (`src/lib/turnstile.ts` per la configurazione). Discord non ne ha bisogno: l'autenticazione avviene sul loro dominio.

**Interruttore**: senza `NEXT_PUBLIC_TURNSTILE_SITE_KEY` il widget non compare e l'accesso si comporta esattamente come prima. È voluto: permette di pubblicare il codice prima di accendere il CAPTCHA.

**Come si accende, in quest'ordine** (invertirlo blocca l'accesso a tutti):

1. **Cloudflare** (serve un account gratuito): dash.cloudflare.com → Turnstile → Add widget. Nome `originsmeta-login`, modalità **Managed**, domini `originsmeta.com`, `www.originsmeta.com`, `originsmeta.vercel.app`, `localhost`, `127.0.0.1`. Si ottengono una **Site Key** (pubblica) e una **Secret Key** (privata).
2. **Vercel**: Settings → Environment Variables → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = la Site Key, su tutti gli ambienti; poi un nuovo deploy (la variabile finisce nel bundle, serve ricostruire). Da qui il widget compare e manda il token, che Supabase per ora ignora.
3. **Supabase**: Authentication → Attack protection → Enable CAPTCHA protection, provider **Turnstile**, incollare la **Secret Key**. Da questo momento le richieste senza token vengono rifiutate.
4. Nella stessa dashboard, Authentication → Rate Limits: abbassare le email l'ora (era 30) per limitare i danni di un eventuale aggiro.

**Verifica**: aprire `/it/login` in finestra anonima, controllare che il widget compaia e che il bottone del link via email si attivi solo dopo la spunta; poi chiedere un link a un proprio indirizzo. In locale si può usare la chiave di prova `1x00000000000000000000AA` in `.env.local`.

**Pulizia degli account già creati dai bot**: nessuno di loro ha mai fatto un accesso, quindi si riconoscono con `last_sign_in_at is null` e nessun mazzo, voto o torneo. La cancellazione va fatta con una query su `auth.users` (cancella a cascata profilo e contenuti collegati), salvando prima un backup.

## Tournament Organizer (dal 16/09/2026)

- **Cos'è**: tornei creati dagli utenti loggati (`/tournaments/new`, richiesta del "coach" e di Davdas), iscrizione con l'account del sito dalla scheda `/tournaments/[slug]` (ISR 60 s, rigenerata dalle Server Action), consegna obbligatoria dei mazzi prima dell'avvio (`/tournaments/[slug]/deck`: codici OriginsMeta `OM1…`, uno per mazzo; nel Conquest `conquest_decks` mazzi con Leggendarie diverse e almeno `conquest_min_different` carte diverse, controllati con `checkDeck` + `validateConquest`), tag unico `OM-XXXX` e link breve `/t/<tag>` (`src/app/t/[tag]/route.ts`, lingua dal browser). Solo Influencer/Pro/Staff (o admin) pubblicano il torneo sul calendario (`listed`, trigger + filtro a lettura) e caricano una copertina propria (bucket Storage pubblico `tournament-covers`, upload dal browser con riduzione a 1600 px WebP, policy per tag e cartella `<user_id>/`); gli altri scelgono dal media kit (`COVER_PRESETS`). Decisioni di Pierluigi del 16/09/2026: screenshot dei referti privati (parti, organizzatore, staff), liste visibili all'avversario dalla partita e pubbliche a torneo finito, upload copertine solo per i tag autorizzati.
- **Schema** (`supabase/schema.sql`, in coda): `tournaments`, `tournament_players`, `tournament_decks`, `tournament_matches` (tutte le partite create all'avvio; slot successivo = round+1, position/2, lato position%2) e le RPC `security definer` `join_tournament`, `leave_tournament`, `submit_tournament_decks` (lock `for update` sul torneo, eseguibili solo da `authenticated`: `revoke … from anon`). RLS: letture pubbliche; `tournaments` scrivibile dall'organizzatore per i campi descrittivi e cancellabile solo finché `open`; `tournament_players`, `tournament_decks`, `tournament_matches` si scrivono solo via RPC; le liste le vedono proprietario, organizzatore, admin, avversario (`is_opponent_of`) e tutti a torneo `finished`. Il blocco Storage sta in un `DO … EXCEPTION`: se la connessione non può creare bucket e policy, lo script stampa un avviso e vanno creati dalla dashboard con gli stessi nomi. `scripts/set-badge.mjs` toglie dal calendario i tornei di chi torna community.
- **Codice**: `src/lib/tournament/` (`types.ts` costanti e tipi, `util.ts` validazione del modulo, `queries.ts`, `actions.ts`, `bracket.ts` motore puro del tabellone con `bracket.test.ts`, eseguito con `npm test` da Node 24 senza flag); componenti `TournamentForm`, `JoinTournament` (scopre l'utente nel browser come `StarRating`), `TournamentCard`, `TournamentDecksForm`, `TagSearch`, `LocalTime` (ora locale dopo il mount, UTC nell'HTML statico), `ConfirmButton`; sezioni in `/tournaments` (ora ISR) e in `/account`; `src/proxy.ts` copre `new`, `:slug/manage`, `:slug/deck`, `:slug/match/:id`. Le Server Action accettano al massimo 1 MB: i file passano dal browser allo Storage, al server arriva solo l'URL, verificato.
- **Motore del tabellone**: `bracketSize` (minima potenza di 2 ≥ iscritti), `seedOrder` (ordine standard 1,8,4,5,2,7,3,6…: i bye cadono sempre in `player_b` e solo al primo turno; con seeding casuale toccano a giocatori a caso), `nextSlot`, `validateScore` per Bo1/Bo3/Bo5, `standings`. Quando i bye superano un quarto dei posti (es. 5 iscritti su 8) due bye si incontrano per forza al secondo turno: l'ordine standard li riduce al minimo. La generazione autoritativa sarà nella RPC `start_tournament` (fase 2).
- **Gestione (fase 2, 16/09/2026)**: pagina `/tournaments/[slug]/manage` (organizzatore o admin, dinamica) con `ManagePanel`: iscritti con rimozione, avvio con ordine casuale (mescola) o manuale (frecce) e anteprima dei bye, risultati imposti per partita (punteggio Bo, forfait), scambio di due giocatori tra partite da giocare, chiusura con referto, annullamento; sotto, lo stesso `TournamentForm` in modalità `edit` (data, posti e regole bloccati a torneo avviato). Tabellone pubblico `Bracket.tsx` (colonne per turno, vincitore in oro). RPC in `schema.sql`: `bracket_order` (stessa definizione di `seedOrder`), `start_tournament` (crea tutte le partite, bye in `player_b`, esclude chi non ha consegnato i mazzi), `swap_players`, `report_match_result` (primo referto → `reported`; il secondo uguale conferma e propaga, diverso → `disputed`), `set_match_result` (organizzatore, con `forfeit`; rifiuta se la partita successiva è già iniziata), `drop_player` (walkover a torneo in corso), `finish_tournament`, `cancel_tournament`; `tm_propagate` interna. Verificate con una simulazione in transazione con rollback (`scratchpad`, 25 controlli).
- **Stanza partita (fase 3, 16/09/2026)**: `/tournaments/[slug]/match/[id]` (dinamica; solo i due giocatori, l'organizzatore e gli admin, gli altri vengono rimandati alla scheda) con `MatchRoom`: mazzi dei due giocatori (la policy di `tournament_decks` li mostra all'avversario dalla partita), chat testuale in polling ogni 5 s sotto RLS (`tournament_messages`, scrittura solo con la RPC `send_message`: 500 caratteri, 20 al minuto per utente e partita, solo a torneo in corso), referto con doppia conferma (`report_match_result`) e screenshot: fino a 3 per giocatore, ridotti nel browser (`src/lib/shrinkImage.ts`) e caricati dal browser nel bucket privato `tournament-screenshots` al percorso `<match_id>/<user_id>/<1|2|3>.webp` (il limite è nel nome del file, controllato dalla policy); la pagina genera URL firmati (15 minuti) per le sole parti. La policy Storage passa dalla funzione `is_match_party_path`, che controlla che la cartella sia un uuid prima di interrogare `is_match_party`. Dalla scheda torneo chi gioca trova il bottone "La mia partita" (partita del turno più alto in cui compare). Realtime non è usato: per una chat a due il polling basta; se servirà, la tabella va aggiunta alla publication `supabase_realtime`.
- **Deck builder del torneo (fase 4, 16/09/2026)**: `/tournaments/[slug]/deck` monta `DeckBuilder` con la prop `preset` (modalità libero/Conquest bloccata, numero di mazzi `deckCount` da 1 a 4, carte diverse minime bloccate, memoria `localStorage` separata `originsmeta.tournament.<tag>`) e `onSubmit`: il bottone "Consegna i mazzi al torneo" sostituisce "Pubblica" e chiama la Server Action `submitDeckCodes` (stessa validazione `checkDeck` + `validateConquest` dei codici incollati, che restano disponibili in un riquadro a scomparsa). Le etichette e il pool di carte del builder sono in `src/lib/builderLabels.ts`, condivisi con `/deck-builder`. Il builder ora gestisce da 1 a 4 mazzi (tabella Conquest generata dagli indici).
- **Calendario (fase 5, 16/09/2026)**: `src/app/api/calendar/route.ts` (`revalidate = 300`) restituisce, per entrambe le lingue, i tornei `listed` aperti o in corso già nel formato della striscia (`TickerItem`, ora con il campo `date`); `TickerMarquee` li chiede nel browser dopo il primo render (`extraUrl` + `locale`), li fonde con gli eventi ufficiali in ordine di data e ricalcola "il prossimo". Il layout `(site)` non legge Supabase e le pagine editoriali restano statiche. Se il JSON non arriva, la striscia mostra i soli eventi ufficiali.
- **Tornei pubblici e privati a invito (16/09/2026, richiesta di Pierluigi)**: colonna `tournaments.visibility` (`public` / `private`). Un torneo privato non compare in liste, calendario, sitemap, "altri tornei" né nella ricerca per tag; le policy (`can_view_tournament`, funzione `security definer` usata da tornei, iscritti, partite e liste) lo mostrano solo a organizzatore, admin, iscritti e invitati; la scheda `/tournaments/[slug]` è quindi **dinamica** (sessione di chi guarda, `noindex` se privato) e sta nel matcher di `src/proxy.ts`; per gli altri è 404. Inviti in due modi: **link segreto** `/t/<tag>/<codice>` (codice in `tournament_secrets`, leggibile solo da organizzatore e admin; chi apre il link da loggato riceve una riga in `tournament_invites` con la RPC `redeem_invite` e viene portato alla scheda; `rotate_invite_code` genera un nuovo link e invalida il vecchio) oppure **per nome utente** dalla pagina di gestione (`invite_player`, `revoke_invite`). `join_tournament` rifiuta senza invito (`invite_required`); il trigger `protect_tournament_listing` blocca `listed` sui privati (`private_not_listed`). Gli inviti ricevuti compaiono nel profilo. Verificato con `scratchpad/sim-private.mjs` (19 controlli in transazione con rollback, impersonando i bot).
- **Avvio automatico (16/09/2026, richiesta di Pierluigi)**: la data di inizio è informativa. Il tabellone si genera da solo, con ordine casuale, appena tutti i posti sono occupati e tutti gli iscritti hanno consegnato i mazzi (`tm_autostart`, chiamata in coda a `join_tournament` e `submit_tournament_decks` con la riga del torneo già bloccata; la generazione vera è in `tm_start`, condivisa con `start_tournament` che resta l'avvio manuale dell'organizzatore, anche con meno giocatori e bye). Nel tabellone (`Bracket`, prop `open`) le partite sono link alla stanza: le proprie per chi gioca, tutte per organizzatore e admin; nella scheda c'è anche il bottone "La mia partita". Nella gestione, a torneo in corso, il tabellone è `BracketEditor` (client): un clic seleziona un giocatore, il secondo clic su un giocatore di una partita dello stesso turno ancora da giocare li scambia (`swap_players`); le partite refertate o confermate non si toccano.
- **Notifiche Discord**: variabile d'ambiente `DISCORD_WEBHOOK_URL` (solo server, MAI con prefisso `NEXT_PUBLIC_`), cioè l'URL del webhook del canale Discord del sito, da impostare su Vercel (Settings → Environment Variables). Senza, nessun messaggio (`src/lib/tournament/notify.ts`).
- **Bot di prova**: `node scripts/seed-bots.mjs <TAG> [n]` crea utenti finti (`bot<n>@bots.originsmeta.local`, profili `bot-<n>`) e li iscrive al torneo con liste legali già consegnate (Conquest compreso); `node scripts/seed-bots.mjs --remove` li elimina con tutto ciò che li riguarda. Solo per prove dello staff: scrive direttamente nel database scavalcando RLS e RPC.
- **Test end-to-end da fare a mano** (servono due account): creare un torneo da 8 con `/tournaments/new`, iscriversi con entrambi, consegnare i mazzi dal builder dedicato, avviare con ordine casuale (2 iscritti → nessun bye; con 6 su 8 → 2 bye), aprire "La mia partita", scambiarsi un messaggio, refertare lo stesso punteggio da entrambi (conferma automatica) o punteggi diversi (contestazione → override dall'organizzatore), chiudere con referto, controllare che le liste diventino pubbliche e che il torneo compaia nella striscia se `listed`.

## Home, slider e grafici dei mazzi

- **Slider** (`src/components/HeroSlider.tsx`, home): immagini ufficiali del media kit con didascalie in `home.slides` dei dizionari; rotazione automatica, frecce (solo da tablet in su), puntini, tastiera e swipe; si ferma con il mouse, il focus e "riduci animazioni". La striscia del calendario sta **sotto** lo slider in home e subito sotto l'header nelle altre pagine: le pagine vivono nel gruppo di rotte `src/app/[locale]/(site)` (layout con `EventTicker` + `<main>`), la home in `src/app/[locale]/(home)`. Gli URL non cambiano.
- **Grafici di composizione** (`src/lib/deckstats.ts` + `src/components/DeckCharts.tsx`, SVG inline senza librerie) nelle schede mazzo del playtest e della community: curva di mana impilata (unità/magie, Leggendaria in oro), costo medio, carte giocabili entro il turno 3, potenza e salute totali, ciambella unità/magie con fasce di costo, carte per saga con sinergia con la Leggendaria, parole chiave, carta più cara/economica, riquadro "win rate" già predisposto per le API ufficiali. Scelte prese dal censimento delle pagine mazzo di hsreplay, untapped, marvelsnapzone, limitless, dreamborn, aetherhub (15/09/2026).

## Deck builder e codici-mazzo

- Pagina `/deck-builder` (client, senza backend): regole del gioco integrate (1 Leggendaria + 12 carte base diverse, seconda copia automatica = 25 carte), mazzo singolo o **modalità torneo** con tre mazzi e controllo Conquest (Leggendarie diverse, almeno N carte fisiche diverse tra due mazzi, N modificabile, default 9), curva di mana, salvataggio automatico nel browser e quattro tasti (decisione di Pierluigi del 21/09/2026): **"Pubblica sul sito"** (vedi sopra), **"Salva privato"** (mazzo nel profilo con stato `draft`, non pubblico; aperto da `/account` con `?draft=<id>` si aggiorna invece di duplicarsi), **"Condividi"** (link, codice del gioco, codice OM, lista in testo e condivisione nativa del telefono) e **"Svuota mazzo"**. Un link a un mazzo (`#OM1…` o `?deck=`) si apre solo nella casella attiva; se la casella non era vuota, la copia resta in `<chiave>.prev` e il tasto "Torna al mazzo di prima" resta visibile finché non lo si usa o lo si scarta.
- Regole e validazioni in `src/lib/deckrules.ts`; codec in `src/lib/deckcode.ts`.
- **Formato del gioco** (`KGBLDC`): `KGBLDC` + base64("v1|CHIAVE|CHIAVE…") + ":" + checksum (primi 4 byte di SHA-256 del payload, esadecimale). Le chiavi sono ID interni delle carte (es. `C00042_MB`, variante cosmetica `_V00002`), ordinate per numero. Il campo `key` delle carte arriva dall'import di World of Origins (tutte le carte tranne Merry Man), quindi export e import dei codici del gioco funzionano; verificato su due codici reali del 03/09/2026 (decodifica corretta e ricodifica identica). Se un codice contiene chiavi non abbinate, restano visibili per poterle segnalare.
- **Formato OriginsMeta** (`OM1.`): base64url di JSON con nome, leggendaria, carte e carte personalizzate; usato per i link di condivisione (`/deck-builder#OM1.…`).

## Pagina FAQ e assistente (dal 20/09/2026)

`/faq` (EN e IT) ha due metà: in alto si può chiedere qualunque cosa, sotto stanno le risposte approvate.

- **Le risposte approvate** (`src/lib/content/faq.ts`) sono testo scritto da noi, in HTML statico e nei dati strutturati FAQPage: le legge anche Google e non costano nulla. Quando una domanda torna spesso, si scrive lì in EN e IT e smette di passare dal modello.
- **La domanda libera** passa da `/api/ask`. La risposta non viene dalla memoria del modello: `src/lib/faq/retrieve.ts` pesca dal nostro database le carte, le guide e gli eventi pertinenti e ne fa schede compatte; `src/lib/faq/ask.ts` le passa a `claude-opus-5` con l istruzione di usare solo quelle e di dire che non lo sa quando non bastano. Sotto la risposta compaiono le fonti come link alle nostre pagine. Vale anche qui la regola del progetto: nulla si inventa.
- **Difese**: domanda di 300 caratteri al massimo, CAPTCHA Turnstile verificato qui con `TURNSTILE_SECRET_KEY` (a differenza dell accesso, dove lo verifica Supabase), cinque domande al minuto per indirizzo IP.

**Per accendere l assistente** serve un passo manuale: Vercel → Settings → Environment Variables → `ANTHROPIC_API_KEY` (tipo **Secret**, tutti gli ambienti), presa da console.anthropic.com, poi un nuovo deploy. La chiave non va mai nel codice né in `.env.local` committato.

Senza chiave la pagina non si rompe: `/api/ask` risponde 503 e la pagina mostra solo le FAQ approvate con la riga "l assistente è spento". Stessa cosa se la chiave è sbagliata (un `AuthenticationError` viene trattato come assenza di chiave).

Per provare il recupero senza spendere: si aggiunge una rotta temporanea che chiama `contestoPer(domanda, "it")` e ne stampa fonti e testo. Attenzione, in App Router una cartella che inizia con `_` è privata e **non** diventa una rotta.

## Pop-up dei feedback (dal 22/09/2026)

Richiesta di Pierluigi e Davdas dopo la demo: nei primi giorni dopo il lancio chi arriva sul sito è motivato, quindi un pannello chiede "che cosa ti piace, che cosa manca, che cosa non funziona?". È una misura del rodaggio: **va spenta dopo**.

- **Widget** (`src/components/FeedbackWidget.tsx`, etichette e costanti in `src/lib/feedbackLabels.ts`, testi in `feedback` dei dizionari): bottone "Feedback" / "Dicci la tua" in basso a destra, montato nel layout radice e disegnato **solo se `/api/feedback` risponde attivo** (stato chiesto una volta dopo il banner dei cookie e ricordato per la scheda in `sessionStorage`, chiave `originsmeta.feedback.service`). Il pannello si apre da solo una volta per visitatore (chiave `originsmeta.feedback.v1` in `localStorage`), cinque secondi dopo la chiusura del banner dei cookie; mai mentre si scrive in un campo o si naviga con la tastiera (focus visibile su un elemento), mai sul deck builder sotto i 1024 px (lì il bottone sparisce, per la barra del mazzo). Aperto da solo non sposta il focus: lo annuncia un'area `aria-live`. Messaggio da 10 a 1000 caratteri, email facoltativa (serve solo a rispondere), CAPTCHA Turnstile se c'è `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- **Rotta** (`src/app/api/feedback/route.ts`): valida il testo, toglie l'HTML, annulla formattazione e menzioni di Discord (`escapeDiscord` in `src/lib/discordWebhook.ts`, più `allowed_mentions` vuoto), limita a 3 messaggi ogni 10 minuti per indirizzo IP (in memoria; un CAPTCHA fallito o un errore di Discord non consumano il tentativo), verifica il CAPTCHA con `TURNSTILE_SECRET_KEY` se c'è (se manca mentre c'è la site key, lo scrive una volta nei log: il widget sarebbe di facciata), poi manda un embed (testo, pagina, lingua, email se data, data) al canale Discord **privato** dello staff. Nessun database.
- **Variabili su Vercel** (Settings → Environment Variables, poi un nuovo deploy):
  - `DISCORD_FEEDBACK_WEBHOOK_URL` (segreto, solo server, mai `NEXT_PUBLIC_`): Discord → impostazioni del canale privato → Integrazioni → Webhook → Nuovo webhook → Copia URL. Senza (o con un URL che non è un webhook Discord) la rotta risponde 503 `disattivato` e il bottone non compare. Se il servizio si scopre spento al momento dell'invio, il pannello lo dice apertamente e propone staff@originsmeta.com (il Discord ufficiale del gioco è il server di Koin Games, non il posto per i commenti sul sito).
  - `TURNSTILE_SECRET_KEY` (segreto, solo server): la chiave segreta dello stesso widget Turnstile di `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Oggi sta solo nella dashboard di Supabase (per l'accesso): senza, il CAPTCHA del pannello e dell'assistente non viene verificato.
  - `NEXT_PUBLIC_FEEDBACK=off` spegne bottone, pannello e rotta. Acceso di default; entra nel codice alla build, quindi serve un deploy.
- La voce "Feedback" dell'informativa (`privacy.feedback`, ancora `/privacy#feedback`) resta anche a widget spento: i messaggi ricevuti stanno nel canale Discord.

## Cookie e GDPR

- Banner cookie (`src/components/CookieBanner.tsx`, testi in `cookies` dei dizionari) in fondo a tutte le pagine finché l'utente non sceglie "Accetta tutto" o "Solo necessari"; la scelta sta in `localStorage` (`originsmeta.consent.v1`) e si riapre da "Preferenze cookie" nel footer. Oggi il sito ha solo cookie tecnici (sessione Supabase dopo il login) e statistiche senza cookie, quindi il banner è informativo; strumenti futuri (es. GA4) vanno caricati solo se `getConsent() === "all"` (`src/lib/consent.ts`). La pagina Privacy elenca cookie, storage e YouTube in modalità nocookie.

## Analytics, Search Console e SEO

- Vercel Web Analytics e Speed Insights sono inclusi nel layout (senza cookie).
- **Google Analytics 4**: proprietà "OriginsMeta" (account Google ultimacenere@gmail.com, account GA 396971166, proprietà 554263065, stream web 15780517209, ID misurazione `G-9J5Q803XJS`). Il tag (`src/components/GoogleAnalytics.tsx`) parte solo con "Accetta tutto" nel banner cookie, con Consent Mode v2 (pubblicità sempre negata) e IP anonimizzato. L'ID ha un default nel layout e si può sovrascrivere con `NEXT_PUBLIC_GA_ID`. Esiste anche una proprietà "OriginsMeta" creata per errore sull'account pierluigicella85@gmail.com (dentro l'account GA "Frameplays", ID G-RCGV4S861S): non è usata dal sito e si può cestinare.
- **Search Console**: proprietà URL-prefix `https://originsmeta.com` sull'account ultimacenere@gmail.com, verificata con il meta tag `google-site-verification` nel layout (più il file `public/google10672860791f4a82.html`): non rimuoverli. Sitemap inviata il 15/09/2026.
- **SEO on-page**: `pageMeta` aggiunge "Origins TCG" ai title che non lo contengono e un'immagine social di default; i dati strutturati stanno in `src/components/JsonLd.tsx` (WebSite + Organization nel layout, Article per guide e mazzi community, Event per i tornei, BreadcrumbList per carte e mazzi). La sitemap usa le date reali di news, patch, mazzi e guide. Strategia e calendario editoriale: artifact "OriginsMeta SEO Playbook" (15/09/2026).

## Convenzioni

- Ogni dato ha una fonte ufficiale (pagina Steam, patch notes, Discord). Se un dato non è verificato non entra.
- Sempre presente la dicitura di non affiliazione con Koin Games (header, footer, about).
- Le immagini ufficiali arrivano dal media kit di Koin Games e restano di loro proprietà.
