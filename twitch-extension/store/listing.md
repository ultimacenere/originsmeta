# Scheda dell'estensione su Twitch (14/10/2026)

Testi per la console di dev.twitch.tv (Extension → Version → Extension Details / Assets), in inglese, la lingua della
vetrina. Immagini in questa cartella (`node twitch-extension/dev/store-images.mjs`, screenshot con `shot`).
Regole di sempre: mai il nome né il dominio di World of Origins, sempre "not affiliated with Koin Games", mai dire che
cosa è un bot, mai nomi o rank di giocatori.

## Immagini

| Campo | File |
| --- | --- |
| Logo (100 × 100) | `logo-100.png` |
| Taskbar icon (24 × 24, la console la usa per le estensioni video) | `taskbar-24.png` |
| Discovery (300 × 200) | `discovery-300x200.png` |
| Screenshot (1024 × 768), in quest'ordine | `screenshot-4-…`, `screenshot-2-…`, `screenshot-1-…` (il 3, la finestra dell'app, fuori) |

## Campi

**Name**: OriginsMeta Deck tracker

**Summary** (massimo 140 caratteri: 126)

> Read the streamer's Origins TCG deck live: hover any card on the board, in hand or in the deck to see its art, stats and text.

**Description** (massimo 1024 caratteri: 824)

> Read the streamer's Origins TCG deck without asking in chat.
>
> - Hover a card on the board or in the streamer's hand to see the full card with cost, power, health and text.
> - Open the deck panel: the list with the copies still in the deck, updated live during the match.
> - Follow the opponent's Legendary and the cards they reveal, spells included.
> - Move the panels or hide them with one click.
> - Cards in English, Italian, Spanish and French.
>
> It shows only what the streamer's OriginsMeta Tracker already shows: never player names, ranks or match IDs. Viewers need no login, Bits or chat access.
>
> Streamers: install OriginsMeta Tracker (free, Windows), sign in on originsmeta.com, create a code in your account and paste it in the configuration page.
>
> OriginsMeta is an unofficial fan site, not affiliated with Koin Games.

**Viewer Summary** (massimo 140)

> Hover the cards on the board or in hand to read them, open the deck to see the copies left. Hide or move the panels anytime.

**Author Name**: OriginsMeta

**General Category**: Extension for Games (nella console in italiano: "Estensioni per i giochi") — **Game Category**: Origins TCG

**Support Email**: staff@originsmeta.com

**Privacy Policy URL**: https://originsmeta.com/en/privacy#tracker

**EULA / Terms of Service URL**: https://originsmeta.com/en/terms (pagina del 14/10/2026, da scrivere nella console dopo il deploy).

**Capabilities**: Request Identity Link = No, Chat Capabilities = No.

## Walkthrough Guide (per i revisori)

> 1. Install and activate the extension on a channel as Overlay 1.
> 2. The extension needs the streamer's OriginsMeta Tracker desktop app (Windows) running while they play Origins TCG. The review channel below has it set up and linked: open it while it is live with the game.
> 3. As a viewer: hover the cards on the board or in the streamer's hand to read them; the preview opens on the side of the video. Use the "Hide the panels" button at the top left to hide or show the panels. Drag a panel by its logo tab to move it; double-click the tab to put it back.
> 4. The deck panel lists the streamer's cards with the copies left; the strip at the top shows the opponent's Legendary and the cards they revealed.
> 5. The configuration page (streamer only) has three steps: install the app, create a code on originsmeta.com/account/tracker, paste the code and press "Link". It also lets the streamer choose the app's panels or the "Tab" view.
> 6. The only external link is "Card page on originsmeta.com ↗" in the card preview; it opens in a new tab.
>
> If the review channel is offline, please contact staff@originsmeta.com and we will go live for you.

**Change Log** (prima versione)

> First release: live deck, board and hand card previews, opponent's Legendary and revealed cards, movable panels, app-style panels and "Tab" view, four languages (EN, IT, ES, FR).

**Extension Review Channel URL**: il canale Twitch di Pierluigi (da confermare).
