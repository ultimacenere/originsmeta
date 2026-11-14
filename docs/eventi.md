# Eventi della community (Attrix Showmatch del 16/11/2026)

Richiesta di Pierluigi del 10/11/2026: "una royale rumble tra i creators italiani con giveaway di oltre 125 pacchetti di carte di origins, noi gestiamo tutta la infrastruttura". Specifiche dalle note Granola "sito roadmap" del 10/11/2026 (stato e punti aperti nella KB, §1, blocco 🎁).

## Che cosa c'è

| Pezzo | Indirizzo | Chi |
|---|---|---|
| Pagina dell'evento | `/it/events/attrix-showmatch`, link breve **originsmeta.com/showmatch** | tutti (solo italiano: le altre lingue rimandano qui) |
| Regia | `/it/events/attrix-showmatch/regia#k=<link della regia>` | i caster; lo staff entra senza link con l'accesso fatto |
| Pannello del mod | `/it/events/attrix-showmatch/mod#k=<link del canale>` | il mod di ogni canale del giveaway |
| Overlay per OBS | `/overlay/event/attrix-showmatch` | i creator (sorgente browser, sfondo trasparente) |
| Comando di chat | `/api/events/attrix-showmatch/chat` | Nightbot, StreamElements, Fossabot |

- **Pagina**: talent (foto, bio, link; sfocati fino a `revealAt`), mazzi (carte, "Copia codice del gioco", deck builder, facce dei giocatori dopo la ruota), classifica svizzera, abbinamenti, countdown del giveaway (canale attivo e tempo che resta), come funziona, riscatto dei codici. ISR ogni 60 secondi; la parte che cambia in diretta il browser la rilegge ogni 10 secondi da `/api/events/<slug>` (la CDN la tiene 5 secondi).
- **Regia**: ruota dei mazzi (un giro = un mazzo per la prossima coppia, i giri finiscono con i mazzi), "Crea abbinamenti" (turno svizzero: il primo a caso, poi per punti, senza rivincite e senza due giocatori con lo stesso mazzo quando si può), risultati con un clic, orologio del giveaway (avvia, salta, pausa, riprendi, ferma, riparti da uno slot), codici, link dei mod, chi ha riscattato, configurazione in JSON, link della regia, "Togli i dati dei vincitori" e "Azzera le prove" (solo staff). "Azzera le prove" (14/11/2026, Pierluigi: "resetta pagina regia ed evento che facciamo prove") riporta ruota, turni e risultati all'inizio, con una conferma; configurazione, codici e link dei mod restano, i codici già dati restano dati. Con il giveaway avviato, anche in pausa o finito, non si può: prima "Ferma tutto". Il tasto lo vede solo lo staff e la Server Action rifiuta chi entra con il link dei caster (`resetState` in engine.ts, test in `event.test.ts`).
- **Pannello del mod**: "Collega la chat" (lettura anonima della chat del canale dal browser del mod, niente account né token), durante il suo slot raccoglie chi scrive il comando; allo scadere estrae i vincitori e chiede i codici al sito (nello stesso passaggio una vincita a persona, in tutto l'evento quante ne dice `maxWinsPerViewer`: chi è al tetto viene sostituito da solo), poi "Copia il messaggio" da mandare in privato su Twitch a ogni vincitore. "Sostituisci" se un vincitore non risponde, "Aggiungi un vincitore a mano" se il mod usa il giveaway del suo bot, "Prova senza codici" per provare prima della diretta.
- **Riscatto**: serve un account (Discord, email o Steam); senza accesso il codice resta nel browser un'ora mentre ci si iscrive. Un codice per account (`maxCodesPerUser`), 10 tentativi sbagliati l'ora.

## Online ma non annunciato (12/11/2026)

Pierluigi: "metti online queste pagine, ovviamente non linkarle ai menu ma manteniamole non visibili" ("questa sera con dav ci lavoriamo"). Dal 12/11/2026 il codice dell'evento è su main: pagina (dal 14/11 con la grafica Locandina), regia, pannello del mod, overlay e comando di chat.

- **Nascosto vuol dire**: nessun menu, footer, calendario, sitemap, news, popup o informativa linka o nomina l'evento, e la pagina è noindex finché lo slug non è in `EVENT_ANNOUNCED` (`src/lib/event/links.ts`). Lo controlla `event.test.ts`. Regia e pannello del mod sono noindex da sempre; l'overlay ha `X-Robots-Tag`.
- **Non è una pagina chiusa**: chi ha l'indirizzo, o `originsmeta.com/showmatch`, la apre. Finché l'evento non è creato nel database (migrazione, poi "Crea l'evento" dalla regia) la pagina risponde 404.
- **Per annunciarlo**: lo slug in `EVENT_ANNOUNCED` e, nello stesso commit, i link dal sito (calendario, news, popup: decide Pierluigi). L'informativa `#event-giveaway` non nomina nessun evento e può restare così.

## Prima dell'evento, in ordine

1. **Migrazione** (PowerShell, dal worktree o dal checkout aggiornato, con `.env.local`): `node scripts/event-dry-run.mjs` (66 controlli, rollback; blocca le scritture sui profili per pochi secondi) poi `node scripts/db-migrate.mjs`. Il sito regge senza: la pagina risponde 404 e la regia dice "non ancora attivo".
2. **Pierluigi** (admin) apre `/it/events/attrix-showmatch/regia` con l'accesso fatto → "Crea l'evento".
3. Nella sezione **Configurazione** incolla il JSON (modello qui sotto) → "Salva la configurazione". Gli errori dicono il campo; gli avvisi in giallo non bloccano.
4. **Codici**: "Genera codici" (le note dicono 150 per 125 pacchetti; al massimo 500).
5. **Link dei mod**: "Crea i link dei canali nuovi" (uno per canale degli slot) → "Copia link" e mandarlo al mod del canale.
6. **Link della regia** (in fondo, solo staff): "Copia link" e mandarlo ai caster. Se gira troppo: "Cambia il link della regia".
7. Ai **creator**: l'overlay `https://originsmeta.com/overlay/event/attrix-showmatch` (sorgente browser, per esempio 800 × 220) e il comando per Nightbot: `!commands add !showmatch $(urlfetch https://originsmeta.com/api/events/attrix-showmatch/chat)`.
8. Ai **mod**: aprire il link qualche minuto prima, "Collega la chat" e "Prova senza codici" per vedere che legge il comando.
9. **Dopo le prove**, da staff: "Azzera le prove" in fondo alla regia (con il giveaway avviato prima "Ferma tutto").

## Configurazione

Date in ISO con il fuso (`+01:00` a novembre). I nomi da svelare stanno solo nel database: la lettura pubblica li nasconde fino a `revealAt` (anche il loro canale negli slot), quindi questo JSON **non va nel repository** (che è pubblico) se contiene nomi non ancora annunciati.

```json
{
  "name": "Attrix Showmatch",
  "tagline": "I creator italiani di Origins TCG si sfidano in diretta su Twitch.",
  "startsAt": "2026-11-16T18:00:00+01:00",
  "endsAt": null,
  "keyword": "!codice",
  "maxCodesPerUser": 1,
  "redeemUntil": null,
  "mirror": "avoid",
  "rounds": null,
  "pickup": "Per ricevere il pacchetto nel gioco, quando Koin Games lo rilascerà, collega il tuo account Steam al profilo di OriginsMeta (Il mio profilo, sezione Steam).",
  "talent": [
    { "id": "atrix", "name": "Atrix", "role": "host", "twitch": "nome_canale", "bio": "…", "photo": "https://…" },
    { "id": "caster-1", "name": "…", "role": "caster", "twitch": "…", "revealAt": "2026-11-15T18:00:00+01:00" },
    { "id": "giocatore-1", "name": "…", "role": "player", "twitch": "…", "bio": "…", "links": [{ "label": "YouTube", "url": "https://…" }], "user": "nome-utente-sul-sito", "revealAt": "2026-11-12T18:00:00+01:00" }
  ],
  "decks": [
    { "id": "mazzo-1", "name": "Nome del mazzo", "code": "KGBLDC…", "color": "#e53935" }
  ],
  "pairs": [],
  "slots": [
    { "channel": "nome_canale", "packs": 7, "minutes": 7.5 },
    { "channel": "caster_uno", "packs": 5, "minutes": 7.5 },
    { "channel": "caster_due", "packs": 5, "minutes": 7.5, "together": true }
  ],
  "finalDraw": { "packs": 10, "text": "A fine evento tutti gli iscritti a OriginsMeta partecipano in automatico all'estrazione di 10 pacchetti." }
}
```

- `role`: `player` (gioca), `caster`, `host` (conduce), `guest` (ospite che non gioca). `id`: minuscole, cifre e trattini, mai da cambiare dopo la ruota.
- `photo`: facoltativa; senza, la foto del profilo Twitch. `user`: il nome utente sul sito, per il link al profilo.
- `decks[].code`: il codice del gioco (quello che si copia dal deck builder); `color`: il colore dello spicchio della ruota.
- `pairs`: coppie decise prima (`[["id1", "id2"], …]`); vuoto = la ruota estrae anche le coppie.
- `mirror`: `avoid` evita negli abbinamenti due giocatori con lo stesso mazzo; `allow` no.
- `slots`: i passaggi del giveaway in ordine, con canale, pacchetti e minuti; si susseguono senza pause. I minuti possono avere i secondi (`7.5` = 7 minuti e 30, dal 14/11/2026: lo schema di Dav per l'Attrix Showmatch è di 16 blocchi da 7:30, due ore in tutto). `"together": true` fa partire lo slot insieme a quello prima, con la stessa durata: è il blocco dei due caster, ognuno con il suo canale, i suoi pacchetti e il suo mod. Pagina, overlay, comando di chat e regia lo mostrano come un passaggio solo ("NerDeku e Nimer", "5 pacchetti per canale"); nel database restano due slot, quindi il pannello di ogni mod e i codici funzionano come sempre, senza migrazione.
- `finalDraw`: facoltativo, l'estrazione dopo l'evento (`packs` e `text`, una frase su chi partecipa). La pagina la mostra dopo i passaggi e la conta nei pacchetti in palio; i codici che servono sono quelli dei passaggi più questi. Il sito non fa l'estrazione: la fa lo staff dopo l'evento.
- `pickup`: come si riceve il pacchetto; è anche l'ultimo passo di "Come funziona il giveaway".

## Durante

- Ruota: "Gira la ruota" una volta per mazzo; "Annulla l'ultimo giro" finché non parte il primo turno.
- "Crea abbinamenti (turno N)" solo con tutti i risultati del turno prima; "Vince …" segna il risultato (un secondo clic lo toglie); "Annulla il turno N" solo senza risultati.
- Giveaway: "Avvia il giveaway" una volta, poi l'orologio va da solo; "Salta al prossimo", "Pausa" e "Riprendi" per i ritardi; "Riparti da questo slot" per rimettere a posto.

## Dopo

- Il testo `pickup` dice a chi ha riscattato come ricevere il pacchetto; chi ha riscattato è nella sezione **Riscatti** della regia (nome utente): gli si scrive dalla casella messaggi del sito ("Scrivi a questo utente" su `/u/<nome>`).
- A pacchetti consegnati, da staff: "Togli i dati dei vincitori" (lo promette l'informativa, `#event-giveaway` di /privacy).
- `redeemUntil` chiude il riscatto.

## Codice

Regole pure in `src/lib/event/` (`config.ts`, `engine.ts`, `swiss.ts` con gli abbinamenti della svizzera del Tournament Organizer, `src/lib/tournament/formats.ts`, `clock.ts`, `codes.ts`, `chat.ts`, `view.ts`, test in `event.test.ts`), letture in `server.ts`, Server Action in `actions.ts`, testi in `labels.ts` (solo italiano), indirizzi in `links.ts`; componenti in `src/components/event/`; pagine in `src/app/[locale]/(site)/events/[slug]/` e `src/app/overlay/event/[slug]/`; rotte in `src/app/api/events/[slug]/`. SQL nel blocco `-- ===== 10/11/2026: EVENTI DELLA COMMUNITY =====` di `supabase/schema.sql`, prova a secco `scripts/event-dry-run.mjs`. Informativa in `src/lib/eventPrivacy.ts` (otto lingue). Eventi di misura: `event_channel_click`, `event_code_redeem`, `event_redeem_signin`.

## Grafica della pagina: la Locandina (14/11/2026)

L'11/11 Pierluigi aveva chiesto "un taglio e una grafica più accattivante" e le prove erano tre (A Locandina, B Ruota, C Arcade, su `/it/events/<slug>/prova/<a|b|c>`). Il 14/11 ha scelto: "per la pagina pubblica importa la grafica locandina". Da allora la pagina vera `/it/events/<slug>` è la Locandina e le prove non ci sono più: gli indirizzi `/prova/…` rimandano alla pagina (redirect in `next.config.ts`).

- **Com'è**: manifesto da serata di gala. Titolo enorme col gradiente, seconda parola su una fascia menta storta, bollo giallo con la data, raggi dal basso, muro delle facce a destra, due nastri che scorrono; sezioni con il numero a contorno, cartellini dei talent con la foto quadrata, strisce dei mazzi inclinate, "VS" nei tavoli.
- **Com'è fatta**: `events/[slug]/page.tsx` legge l'evento e passa tutto a `EventShow.tsx` (la pagina con le classi `ev-*`); `event-show.css` è la struttura, `event-look-a.css` la pelle (regole fuori dai layer di Tailwind, così vincono sulle utility dei componenti condivisi), `src/lib/event/looks.ts` ha le righe piccole sopra i titoli, `inkOn` e `splitEventName`. Regia e pannello del mod usano la stessa pelle (`EventTool`). Solo palette e font del sito, nessun materiale Koin; decorazioni nascoste ai lettori di schermo; con "riduci animazioni" tutto fermo; nessuno scorrimento orizzontale a 375 px.
- **La fascia dell'orologio**: prima dell'evento, sotto la testata, c'è un conto alla rovescia a riquadri (giorni, ore, minuti, secondi; ai lettori di schermo una frase che cambia una volta al minuto); quando il giveaway è partito la fascia sale sopra la testata (`EventClockBanner` con `slot="top"`), così chi arriva dalla chat di Twitch vede subito canale e tempo che manca.
- **Le sezioni dei talent** seguono i ruoli della configurazione, in quest'ordine: chi conduce (`host`), caster, giocatori, ospiti. Una sezione senza nessuno non compare.

I tagli B e C sono nella storia del repository (fino al commit e8f888c). Scatti delle tre prove in `design/eventi/` (cartella non tracciata).

### Regia e pannello del mod nello stile della Locandina (11/11/2026)

Pierluigi, dopo aver visto le tre prove: "seguendo lo stile della prima rifammi anche le altre due" (regia e pannello del mod) "e rendimele artifacts condivisibili". Le due pagine di lavoro hanno ora la grafica della Locandina: testata a manifesto raccolta (la riga piccola dice che pagina è e per chi, il titolo è il nome dell'evento), pannelli con l'ombra piena, numeri a contorno solo dove l'ordine è quello della serata.

- **Regia** (`EventControl.tsx`): 01 la ruota in grande sul suo palco (bordo giallo), con accanto il cartello giallo del mazzo appena uscito e i mazzi estratti a strisce; 02 turni e risultati, ogni tavolo con il "VS" (si tocca chi ha vinto) e la classifica; 03 giveaway, con il tabellone (canale e tempo) e gli slot; sotto, "Dietro le quinte": codici, link dei mod, riscatti, configurazione, link della regia.
- **Pannello del mod** (`EventModPanel.tsx`): 01 i tuoi slot (stato, partecipanti, chat), 02 vincitori e codici (una riga per codice, verde quando è riscattato), poi la prova senza codici.
- Pezzi comuni in `EventTool.tsx` (`ToolShell`, `ToolHero`, `ToolHead`), stili in `event-tools.css` sotto `.ev--a.ev-tool`. Le pagine `regia/page.tsx` e `mod/page.tsx` non hanno più il contenitore: lo mette il componente, perché la testata va a tutta larghezza. Logica, Server Action e testi dei tasti non sono cambiati.

### Il giorno si sa, l'ora no

`startsAt` a **mezzanotte, ora italiana** (per il 16 novembre: `2026-11-15T23:00:00.000Z`) vuol dire "il giorno si sa, l'ora no" (`startHasTime` in `clock.ts`): il bollo della testata mostra solo "16 nov", il conto alla rovescia solo i giorni ("05 giorni", "domani" ai lettori di schermo quando manca un giorno) e la riga "Inizio" della pagina di prima solo la data. Con un orario vero tutto torna com'era.

### Artifact condivisibili

Tre fotografie delle pagine, pubblicate come artifact di claude.ai (private finché Pierluigi non le condivide): pagina pubblica nel taglio Locandina, regia e pannello del mod, con una fascia "Anteprima" che dice che i dati sono di prova. Indirizzi, script e istruzioni per rifarle in `G:\Il mio Drive\OriginsMeta\80_Eventi\attrix-showmatch\artifact\LEGGIMI.md` (fuori dal repository).

## Decisioni della riunione dell'11/11 (12/11/2026)

Nota Granola "riunione per attrix" dell'11/11/2026 (18:26). Nel codice dal 12/11:

- **Più vincite per spettatore** ("ogni partecipante può vincere più pacchetti"): `maxWinsPerViewer` in configurazione
  (da 1 a 60; senza, 1 come prima). Nello stesso passaggio la stessa persona vince comunque una volta sola (indice unico
  `slug, slot, impronta`), e `maxCodesPerUser` (codici per account, ora fino a 60) va tenuto almeno uguale: la regia
  avvisa se è più basso. Per l'Attrix Showmatch tutti e due a 60, cioè nessun tetto oltre "una per passaggio". La pagina
  dice "Puoi vincere più di una volta durante la serata, ma non due volte nello stesso passaggio".
- **Nuova estrazione** ("ogni 3 partite si può fare uno spin per cambiare mazzo", "nessun giocatore può ricevere lo
  stesso mazzo due volte"): nella regia, a estrazione finita e a turno chiuso, compare "Nuova estrazione". Tutti i mazzi
  tornano sulla ruota e ogni giro dà a una coppia un mazzo che nessuno dei due ha già avuto (`firstGroup` di
  engine.ts: cerca ogni volta una soluzione completa, quindi la ruota non resta mai senza uscita; se non esiste, "Non
  c'è modo di dare a tutti un mazzo che non hanno già avuto"). Le coppie si rimescolano a ogni estrazione (quelle
  decise in `pairs` restano insieme quando si può). "Annulla l'ultimo giro" vale finché dopo quel giro non è nato un
  turno; un'estrazione aperta e ancora vuota si richiude con lo stesso tasto. Sulla pagina i mazzi mostrano chi li ha
  nell'estrazione in corso (appena aperta tornano "Da assegnare con la ruota"), la classifica il mazzo di adesso, gli
  abbinamenti il mazzo che il giocatore aveva in quel turno (`deckByPlayerAt`). Nessuna modifica al database: `draw`
  e `afterRound` stanno nello stato JSON.
- **Foto dei creator**: `photo` accetta anche un file del sito, `/media/events/<evento>/<file>.webp` (`photoUrl`
  in config.ts). Le 18 immagini mandate dagli organizzatori su Discord l'11/11 sono in
  `80_Eventi/attrix-showmatch/foto/` sul Drive (originali, ritagli quadrati 512 px, foglio numerato, script). Chi è chi
  lo dice Pierluigi: i volti non si abbinano ai nomi da soli. Il 12/11 ha mandato in chat le foto una per una con il
  nome del creator: `foto-da-chat.mjs` le ritrova nell'archivio come stessa immagine (impronta percettiva) e scrive
  `foto/mappa.json` (numero della foto → id del talent); `applica-foto.mjs` copia i ritagli in
  `public/media/events/attrix-showmatch/` con nomi che non dicono chi sono (`p-<impronta del file>.webp`) e scrive
  `photo` nella configurazione sul Drive e nell'anteprima locale. Chi non è nella mappa tiene la foto di Twitch. I dieci
  file sono nel repository dal 12/11/2026, quando Pierluigi ha detto di mettere online le pagine (i nomi dei file non
  dicono chi sono). Dal 14/11 sono undici: una foto arrivata in chat fuori dall'archivio si aggiunge agli originali, si
  ritaglia da sola con `ritaglia-una.mjs` e si copia qui con lo stesso tipo di nome (`trova-foto.mjs` dice prima se è già
  nell'archivio). Il repository è pubblico: la foto di un creator ancora da svelare non si committa prima del reveal.
- **Il codice in privato su Twitch lo manda il mod, non il sito**: il pannello prepara il messaggio ("Copia il
  messaggio") e il mod lo incolla nel sussurro. Le note dicono "il sito invia automaticamente": non è così. L'invio
  automatico vorrebbe l'accesso con Twitch di ogni mod (permesso per i sussurri) e ha i limiti di Twitch sui sussurri.
- **Da decidere**, dalle stesse note: se tenere pubblico chi ha vinto ogni partita ("troppo competitiva"; la classifica
  per ora resta), il nome del comando (oggi `!codice`, campo `keyword`) e i cambi alla lineup (chi entra e chi esce
  sta nella KB, non qui: il repository è pubblico).
- Per OBS c'è già l'overlay `/overlay/event/attrix-showmatch` (solo l'orologio del giveaway, sfondo trasparente): non
  serve ritagliare la pagina.
