# Eventi della community (Royale Rumble del 16/11/2026)

Richiesta di Pierluigi del 10/11/2026: "una royale rumble tra i creators italiani con giveaway di oltre 125 pacchetti di carte di origins, noi gestiamo tutta la infrastruttura". Specifiche dalle note Granola "sito roadmap" del 10/11/2026 (stato e punti aperti nella KB, §1, blocco 🎁).

## Che cosa c'è

| Pezzo | Indirizzo | Chi |
|---|---|---|
| Pagina dell'evento | `/it/events/royale-rumble`, link breve **originsmeta.com/rumble** | tutti (solo italiano: le altre lingue rimandano qui) |
| Regia | `/it/events/royale-rumble/regia#k=<link della regia>` | i caster; lo staff entra senza link con l'accesso fatto |
| Pannello del mod | `/it/events/royale-rumble/mod#k=<link del canale>` | il mod di ogni canale del giveaway |
| Overlay per OBS | `/overlay/event/royale-rumble` | i creator (sorgente browser, sfondo trasparente) |
| Comando di chat | `/api/events/royale-rumble/chat` | Nightbot, StreamElements, Fossabot |

- **Pagina**: talent (foto, bio, link; sfocati fino a `revealAt`), mazzi (carte, "Copia codice del gioco", deck builder, facce dei giocatori dopo la ruota), classifica svizzera, abbinamenti, countdown del giveaway (canale attivo e tempo che resta), come funziona, riscatto dei codici. ISR ogni 60 secondi; la parte che cambia in diretta il browser la rilegge ogni 10 secondi da `/api/events/<slug>` (la CDN la tiene 5 secondi).
- **Regia**: ruota dei mazzi (un giro = un mazzo per la prossima coppia, i giri finiscono con i mazzi), "Crea abbinamenti" (turno svizzero: il primo a caso, poi per punti, senza rivincite e senza due giocatori con lo stesso mazzo quando si può), risultati con un clic, orologio del giveaway (avvia, salta, pausa, riprendi, ferma, riparti da uno slot), codici, link dei mod, chi ha riscattato, configurazione in JSON, link della regia e "Togli i dati dei vincitori" (solo staff).
- **Pannello del mod**: "Collega la chat" (lettura anonima della chat del canale dal browser del mod, niente account né token), durante il suo slot raccoglie chi scrive il comando; allo scadere estrae i vincitori e chiede i codici al sito (una vincita a persona in tutto l'evento: chi ha già vinto altrove viene sostituito da solo), poi "Copia il messaggio" da mandare in privato su Twitch a ogni vincitore. "Sostituisci" se un vincitore non risponde, "Aggiungi un vincitore a mano" se il mod usa il giveaway del suo bot, "Prova senza codici" per provare prima della diretta.
- **Riscatto**: serve un account (Discord, email o Steam); senza accesso il codice resta nel browser un'ora mentre ci si iscrive. Un codice per account (`maxCodesPerUser`), 10 tentativi sbagliati l'ora.

## Prima dell'evento, in ordine

1. **Migrazione** (PowerShell, dal worktree o dal checkout aggiornato, con `.env.local`): `node scripts/event-dry-run.mjs` (66 controlli, rollback; blocca le scritture sui profili per pochi secondi) poi `node scripts/db-migrate.mjs`. Il sito regge senza: la pagina risponde 404 e la regia dice "non ancora attivo".
2. **Pierluigi** (admin) apre `/it/events/royale-rumble/regia` con l'accesso fatto → "Crea l'evento".
3. Nella sezione **Configurazione** incolla il JSON (modello qui sotto) → "Salva la configurazione". Gli errori dicono il campo; gli avvisi in giallo non bloccano.
4. **Codici**: "Genera codici" (le note dicono 150 per 125 pacchetti; al massimo 500).
5. **Link dei mod**: "Crea i link dei canali nuovi" (uno per canale degli slot) → "Copia link" e mandarlo al mod del canale.
6. **Link della regia** (in fondo, solo staff): "Copia link" e mandarlo ai caster. Se gira troppo: "Cambia il link della regia".
7. Ai **creator**: l'overlay `https://originsmeta.com/overlay/event/royale-rumble` (sorgente browser, per esempio 800 × 220) e il comando per Nightbot: `!commands add !rumble $(urlfetch https://originsmeta.com/api/events/royale-rumble/chat)`.
8. Ai **mod**: aprire il link qualche minuto prima, "Collega la chat" e "Prova senza codici" per vedere che legge il comando.

## Configurazione

Date in ISO con il fuso (`+01:00` a novembre). I nomi da svelare stanno solo nel database: la lettura pubblica li nasconde fino a `revealAt` (anche il loro canale negli slot), quindi questo JSON **non va nel repository** (che è pubblico) se contiene nomi non ancora annunciati.

```json
{
  "name": "Royale Rumble",
  "tagline": "I creator italiani di Origins TCG si sfidano in diretta su Twitch.",
  "startsAt": "2026-11-16T18:00:00+01:00",
  "endsAt": null,
  "keyword": "!codice",
  "maxCodesPerUser": 1,
  "redeemUntil": null,
  "mirror": "avoid",
  "rounds": null,
  "pickup": "Testo da mostrare dopo il riscatto: come si riceve il pacchetto fisico (da definire con Koin).",
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
    { "channel": "nome_canale", "packs": 7, "minutes": 6 }
  ]
}
```

- `role`: `player` (gioca), `caster`, `host` (conduce), `guest` (ospite che non gioca). `id`: minuscole, cifre e trattini, mai da cambiare dopo la ruota.
- `photo`: facoltativa; senza, la foto del profilo Twitch. `user`: il nome utente sul sito, per il link al profilo.
- `decks[].code`: il codice del gioco (quello che si copia dal deck builder); `color`: il colore dello spicchio della ruota.
- `pairs`: coppie decise prima (`[["id1", "id2"], …]`); vuoto = la ruota estrae anche le coppie.
- `mirror`: `avoid` evita negli abbinamenti due giocatori con lo stesso mazzo; `allow` no.
- `slots`: i passaggi del giveaway in ordine, con canale, pacchetti e minuti; si susseguono senza pause.

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
