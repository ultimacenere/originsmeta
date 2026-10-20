# Portoghese del Brasile: regole per scrivere e tradurre (dal 20/10/2026)

Dal 20 ottobre 2026 OriginsMeta è in cinque lingue: inglese (riferimento), italiano, spagnolo, francese e portoghese.
Richiesta di Pierluigi del 20/10/2026 ("procediamo con la lingua portoghese"), scelte: **portoghese del Brasile**,
indirizzo `/pt`, testi delle carte **letti nel gioco** prima di scrivere il resto. Ogni contenuto nuovo (news, guide,
carte, luoghi, eventi, testi dell'interfaccia) si scrive nelle cinque lingue nella stessa sessione, con la stessa cura
SEO. Questo file raccoglie le scelte fatte per il portoghese, perché restino uguali da una sessione all'altra.

## Varietà, tono e lingua della pagina

- **Portoghese del Brasile** (il Brasile manda più visitatori del Portogallo: 11 contro 7 al giorno a metà ottobre 2026),
  scritto in modo che in Portogallo si legga senza fatica: niente gergo regionale, niente gírias.
- Si dà del **você** al lettore, come il gioco ("Quando você joga um feitiço"), mai "tu". Frasi brevi, dirette, stessa
  voce dell'inglese. OriginsMeta parla al "nós".
- Indirizzo `/pt`, `hreflang="pt"` (lingua senza paese, così copre anche il Portogallo), `<html lang="pt-BR">`,
  `og:locale` `pt_BR`, date con `Intl` in `pt-BR`.
- Titoli e intestazioni con la sola iniziale maiuscola ("As 11 Lendárias de Origins TCG").
- Tipografia: niente spazi speciali; virgolette "…"; puntini `…`. Numeri: migliaia col punto ("10.000"), decimali con la
  virgola ("3,5"), percentuali "98%". Date "25 de setembro de 2026" (mesi minuscoli), orari "19:00 CEST" come nelle
  altre lingue. Importi: "10.000 dólares" (o "US$ 10.000" nelle tabelle).
- Maiuscole: "Origins TCG", "Koin Games", "Steam", "Discord" come i marchi; giorni e mesi minuscoli.

## Cosa non si traduce

- **Nomi delle carte, dei luoghi, dei mazzi della community, di prodotti ed eventi**: Merlin, Queen of Hearts,
  Van Helsing's Tools, Wonderland, "Healing Healsing", Steam Next Fest, Crimson Cup, Demo 2.0, MetaShifting, Conquest.
  Il sito trasforma da solo i nomi delle carte in link: vanno scritti esattamente come nel database. La Crimson Cup nel
  gioco in portoghese si chiama **Copa Crimson**: sul sito resta "Crimson Cup" come nelle altre lingue (è il nome che si
  cerca), e dove serve si dice una volta "a Crimson Cup (Copa Crimson no jogo)".
- **Gergo** che i giocatori brasiliani usano in inglese: deck (maschile, "o deck"; il gioco dice "Os meus decks"),
  decklist, tier list, meta, midrange, combo, buff, nerf, rework, win rate, ladder, "deck move" (l'archetipo Move/Combo).
  "Deck builder" è il nome dello strumento (il gioco ha "Construtor de decks": nel testo si può dire "o construtor de
  decks"). Le etichette di allineamento sul sito restano **Good / Evil / Neutral** come nelle altre lingue; nel testo si
  scrive come il gioco: "um personagem Bom", "os seus personagens Malignos" (il gioco non mostra Neutral).
- Segnaposto tra graffe ({n}, {lang}, {from}…), emoji e notazioni delle statistiche ("+2⚔️/+2❤️", "[5⚔️/3❤️]").

## Testi di gioco: il glossario del gioco (letto il 20/10/2026)

Il gioco **è tradotto in portoghese del Brasile** ("Português - Brasil (Portuguese - Brazil)" in Configurações → Mudar
idioma). Il 20/10/2026 abbiamo letto nel gioco le 122 carte della collezione della Demo 2.0 (demo 0.7.1, testi della
patch 0.7, tasto "Não obtidas" acceso): trascrizione in `docs/testi-ufficiali/pt.tsv`, scritte in `card-lore-pt.ts` da
`node scripts/official-texts.mjs pt --apply`, `pt` in `officialTextLocales` (`cards.ts`). Carte create e rimosse (la
collezione non le mostra) e i 44 luoghi sono una traduzione nostra, con questo glossario.

| inglese | portoghese (gioco) |
|---|---|
| On Reveal: | Ao revelar: |
| On Death: | Ao morrer: |
| On Kill: | Ao matar: |
| Shield | Escudo |
| Trample | Atropelar |
| Deathtouch | Toque mortífero |
| Defender | Defensor |
| Rebirth | Renascimento |
| First Strike | Primeiro golpe |
| Double Attack | Ataque duplo |
| Snipe 2 | Tiro certeiro 2 |
| Move (parola chiave) | Mover |
| Move an ally / I move / After I move | Move um aliado / me movo / Depois de me mover |
| I can Move each round | Posso me Mover a cada rodada |
| Stun ANY character | Atordoa QUALQUER personagem |
| space | espaço ("um espaço aleatório", "um espaço central", "o meu espaço anterior", "nesse espaço") |
| location | local ("outro local aleatório", "este local", "nesse local") |
| barrier / opponent's barrier | barreira / barreira do oponente ("a sua barreira") |
| graveyard, board, hand | cemitério, tabuleiro, mão |
| top of your deck | topo do seu deck |
| a Good / Evil character (nel testo) | um personagem Bom / os seus personagens Bons, os seus personagens Malignos |
| ANY, ALL | QUALQUER, TODOS / TODAS (corsivo maiuscolo nel gioco) |
| Choose one: … OR … | Escolhe uma: … OU … |
| deal 3 damage | Causa 3 de dano ("1 de dano") |
| heal 3 damage from | Cura 3 de dano de |
| return … to its owner's hand | Devolve … à mão do seu dono |
| random | aleatório / aleatória |
| permanently | permanentemente |
| this round, each round, next round | nesta rodada, a cada rodada, na próxima rodada |
| before / after combat, start of the round | antes do combate / depois do combate, no início da rodada |
| in front of me | à minha frente |
| ability, happens, repeat it | habilidade, acontece, repete-a |
| +1 mana | +1 de mana |
| Summon, Draw, Discard, Destroy, Give | Invoca, Compra, Descarta, Destrói, Dá |
| Ruin this location | Arruína este local |
| Power, Health | Poder, Vida |
| Rarity: Common, Rare, Epic, Legendary | Raridade: Comum, Rara, Épica, Lendária |
| Type: unit, spell | Tipo: Personagem, Feitiço |
| Alignment: Good, Evil | Alinhamento: Bom, Maligno |
| Ongoing | Ongoing (resta in inglese, come nelle altre lingue) |

Stile dei testi delle carte, come nel gioco: **terza persona del presente** per l'effetto ("Causa 3 de dano", "Compra
uma carta", "Dá Escudo"), il personaggio parla in prima persona al maschile ("Quando sou descartado", "recebo +1⚔️",
"me movo"); ⚔️ e ❤️ restano come nelle altre lingue ("+2⚔️/+2❤️", "o meu ⚔️", "o seu ⚔️"); la parola chiave ha la
maiuscola anche a metà frase ("com Atropelar"). Le carte create hanno il genere che usa il gioco: "uma Broomstick",
"um Mouse", "um Golden Goose", "um Merry Man", "um Little Lamb", "um Musketeer", "três Pumpkins".

Altre parole dell'interfaccia del gioco (20/10/2026): Construtor de decks, Os meus decks, Adicionar deck, Cartas,
Versos das cartas, Não obtidas, Filtrar cartas, Mercado (Em breve), Pacotes de teste, Missões, A minha liga (IRON II),
O meu comandante, O meu deck, Trocar de deck, Modo de jogo: **Competitivo** (la classificata), Copa Crimson, Kickstarter
"Confira", Configurações, Mudar idioma.

Nelle tre guide introduttive (`origins-tcg-explained`, `play-the-demo`, `origins-tcg-locations`) la prima citazione di
ogni parola chiave porta il nome inglese tra parentesi: "Ao revelar (On Reveal)". Quando la parola chiave sta per
"l'abilità" si scrive "a sua habilidade Ao revelar", mai "o seu On Reveal".

## Glossario editoriale (EN → PT)

| inglese | portoghese | nota |
|---|---|---|
| deck, decklist | deck, lista do deck / decklist | "o deck"; mai "baralho" |
| deck builder | Deck builder (nome dello strumento), "construtor de decks" nel testo | |
| card, base card | carta, carta base | |
| Legendary | Lendária (maiuscola, come "Leggendaria"); "uma Lendária" | plurale Lendárias |
| created card (token) | carta criada | IT "carta generata", ES "carta creada" |
| unit, spell | personagem (unidade), feitiço | il tipo del gioco è "Personagem" |
| character, ally, enemy | personagem, aliado, inimigo | |
| barrier | barreira | |
| location | local | sezione "Locais" |
| lane, space | local / linha, espaço | "espaço" come il gioco |
| mana, cost | mana, custo | |
| Power, Health | Poder, Vida | |
| round, turn, combat | rodada, turno, combate | |
| hand, graveyard | mão, cemitério | |
| draw, discard, summon, destroy, heal | comprar, descartar, invocar, destruir, curar | |
| deal X damage | causar X de dano | |
| patch, patch notes | patch (maschile: "o patch 0.7"), notas do patch | |
| balance change, buff, nerf, rework | mudança de balanceamento, buff, nerf, rework | |
| ranked | ranqueada / modo Competitivo ("a ranqueada", "o modo Competitivo do jogo") | |
| qualifier | classificatória ("a classificatória EMEA") | |
| best-of-three / five | melhor de três / de cinco (MD3, MD5) | |
| prize pool | premiação ("10.000 dólares em prêmios") | |
| pack, box | pacote, caixa de boosters | il gioco: "Pacotes de teste" |
| wishlist (Steam) | lista de desejos | |
| In brief (riquadro "In breve") | Em resumo | |
| sign in (tasto dell'header) | Entrar | nel testo "fazer login" / "entrar" |
| sign out | Sair | |
| published by | Publicado por | mai Criador né Autor |
| Creator (ruolo) | Creator | nome del ruolo uguale in tutte le lingue |
| Author (ruolo) | Autor | |
| Staff, Pro, Community (ruoli) | Staff, Pro, Comunidade | |
| comic (fumetto dei creator) | quadrinhos (HQ) | sezione "Quadrinhos" |
| follow / followers | seguir / seguidores | |
| inbox, message | mensagens, mensagem | |
| showcase (vetrina del profilo) | vitrine | |
| achievement (traguardo) | conquista | |
| most played | as mais jogadas | |
| featured | em destaque | |
| demo | demo | |
| free-to-compete | free-to-compete (gergo del gioco) | |
| win rate | win rate (taxa de vitória) | |
| donate | Doar | |

Sezioni: Notícias · Tier list · Database (Guias, Cartas, Locais) · Analytics (Analytics, Tracker) · Decks · Deck builder ·
Torneios e eventos · FAQ · Sobre · Autores · Criadores · Quadrinhos · Draft.

## Dove sta il portoghese nel codice

Come il francese (vedi `docs/francese.md`), con la chiave `pt`:

- Interfaccia: `src/lib/dictionaries/pt.ts` (tipo `Dictionary` = struttura di `en.ts`).
- News: solo i testi in `src/lib/data/news-pt.ts` (`ptText`, per slug: `title`, `metaTitle`, `description`, `summary`,
  `body`, `highlights`, `faq`), uniti da `news.ts`; la build fallisce se manca una news.
- Guide: solo i testi in `src/lib/content/guides-pt.ts` (`ptText`: `title`, `metaTitle`, `excerpt`, `faq`, `body`).
- Carte: `src/lib/data/card-lore-pt.ts` (`origin` e `text` per slug); storico in `card-history.ts` (`note.pt`).
- Luoghi, eventi, autori, archetipi, FAQ, etichette (`src/lib/*Labels.ts`, `cardPage.ts`, `cardTitles.ts`): chiave
  `pt` accanto a `fr`.
- Pastiglie delle parole chiave (`keywordLabels.ts`) e glossario del traduttore dei mazzi (`GAME_KEYWORDS` in
  `deckTranslation.ts`): colonna `pt` con i nomi del gioco, un test li tiene uguali.

## SEO del portoghese

- Stesse regole delle altre lingue: `metaTitle` con "Origins TCG" entro 60 caratteri (meglio entro 46, così ci sta
  " · OriginsMeta"), description 120–158, H1 delle news entro 110, un solo H1 per pagina.
- Link interni sempre con `/pt/…`; ancore `{#…}` tradotte in slug portoghesi senza accenti ("em-resumo",
  "o-que-muda"), e ogni `highlights[].anchor` deve esistere nel `body` portoghese della stessa news.
- La radice `/` manda a `/pt` i browser in portoghese (pt-BR e pt-PT, `next.config.ts`).
- Date di news e guide tradotte: la pubblicazione resta quella dell'originale, la modifica della versione portoghese non
  va mai prima del 20/10/2026 (`TRANSLATED_SINCE.pt` = `LOCALE_SINCE.pt`); nella firma "Traduzido em 20 de outubro de
  2026". Il paragrafo degli aggiornamenti veri si apre con "Atualização de 25 de setembro" (`updateMarkers`).
- Parole che cercano i giocatori: "Origins TCG", "deck", "cartas", "guia", "tier list", "demo", "torneio", "patch",
  "jogo de cartas", "meta", "melhores decks", "Koin Games".
