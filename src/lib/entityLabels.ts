import type { Locale } from "./i18n";
import { RULES } from "./deckrules";

/**
 * Testi del pacchetto "dati strutturati del sito" dell'Ondata 2 del piano SEO/GEO (25/09/2026: GEO-08, HOME-09,
 * TOOL-05, TOOL-09, TOOL-13): la pagina /about (description, come verifichiamo i dati, fonti, disclaimer), i link fra
 * pagina autore, indice degli autori e profilo della community, descrizione e funzioni del deck builder nei dati
 * strutturati. Stanno qui e non nei dizionari, come `linkLabels.ts`: un modulo solo, nelle tre lingue insieme; `en` è il
 * tipo di riferimento. Solo fatti già scritti nel CLAUDE.md e nei dati del sito (nessun giudizio sulle carte).
 */
const en = {
  about: {
    /**
     * Meta description di /about e description del nodo AboutPage (120-158 caratteri), al posto di `about.description`
     * del dizionario, che dava come fonti solo Steam, le patch notes e Discord: la pagina dice anche la verifica nel
     * gioco (TOOL-13), e la description deve dire la stessa cosa. Dal 25/09/2026 (decisione di Pierluigi) né la pagina
     * né la description nominano la fonte dei dati importati delle carte: dicono solo che cosa è verificato nel gioco.
     */
    description:
      "Who runs OriginsMeta, the independent Origins TCG fan site: official sources, cards checked one by one in the game, and how to reach us.",
    /**
     * Al posto di `about.p2` del dizionario, che citava solo Steam e Discord come fonti dei numeri: le carte della
     * collezione del gioco sono verificate nel gioco (22/09/2026, testi italiani e spagnoli il 25/09/2026, ancora nella
     * demo; dal 28/10/2026 i testi non nominano più la demo come presente: le patch notes della 0.8 non toccano le carte).
     */
    p2: "We are players, not the publisher. Dates, rules and events come only from official sources; the cards in the game's collection were checked one by one in the game; and every page says when it was last updated.",
    /** riga con il link alla guida "che cos'è Origins TCG" (mappa delle query, C01): {link} è il testo del link */
    newToGame: "New to the game? Start with {link}.",
    newToGameLink: "what Origins TCG is",
    /** sezione nuova (HOME-09): come verifichiamo i dati, ancora #how-we-check (la cita `publishingPrinciples`) */
    checkTitle: "How we check our data",
    /**
     * I paragrafi della sezione. Nel terzo {date} e {count} arrivano da `cardsVerified` (src/lib/data/cards.ts, l'ultima
     * verifica carta per carta, la stessa del disclaimer del deck builder) e {textsDate} da `OFFICIAL_TEXTS_READ` qui
     * sotto: niente numeri scritti a mano che alla verifica successiva contraddirebbero FAQ e schede.
     */
    check: [
      "Dates, rules, events and balance changes come only from official sources: the Steam page, the patch notes on Steam, the official Discord and Koin Games' announcements. When a detail is only on Discord, the article says so.",
      "The balance changes of each new patch are copied from the official patch notes onto the card pages, with the date and the link to the post.",
      "On {date}, on Early Access version 0.8.2, we compared all {count} cards with the game's collection, one by one: costs, stats, rarities and alignments, and the texts in English, Italian, Spanish, French, Portuguese, German, Russian and Simplified Chinese, the game's own translations. Where the site had fallen behind, it now has the game's data and texts. The Italian and Spanish card texts have been the game's own since {textsDate}. We repeat the check after every patch.",
      "Created cards and removed cards are not in the game's collection, so they have not been checked in the game, and their pages say so: the texts of created cards are the ones in the game's files, while the texts of removed cards in languages other than English are ours, written with the game's glossary. The locations have not been checked one by one in the game yet either: the locations page will say when they are, and their effects in languages other than English are ours, with the same glossary. The sagas and the notes on each legend are ours too.",
    ],
    /** chiusura della sezione: {email} diventa il link mailto */
    checkErrors: "Found a mistake? Write to {email}: we fix it, and the page shows the new date.",
    /**
     * Al posto di `about.disclaimer` del dizionario, che parlava di "fair use" (una dottrina statunitense, per un uso che
     * in realtà Koin Games ha autorizzato). La non affiliazione resta, parola per parola, in testa. È la versione che si
     * pubblica finché Pierluigi non decide di rendere pubblico il permesso (`KOIN_PERMISSION_PUBLIC` qui sotto).
     */
    disclaimer:
      "OriginsMeta is not affiliated with, endorsed by or sponsored by Koin Games. Origins TCG is a trademark of its owner. Card names, artwork and game data belong to Koin Games; the official material on this site (card art, key art, screenshots) is used as content, to inform and comment, and never as OriginsMeta's own branding.",
    /**
     * La stessa frase con il permesso di Koin Games del 19/09/2026 (Kevin, CLAUDE.md): il rilievo HOME-09 la vuole solo
     * con l'OK di Pierluigi a renderlo pubblico. Pronta nelle tre lingue, si accende con `KOIN_PERMISSION_PUBLIC`.
     */
    disclaimerPermission:
      "OriginsMeta is not affiliated with, endorsed by or sponsored by Koin Games. Origins TCG is a trademark of its owner. Card names, artwork and game data belong to Koin Games; the official material on this site (card art, key art, screenshots) is used as content, with the permission Koin Games gave us on 19 September 2026, and never as OriginsMeta's own branding.",
  },
  author: {
    /** tasto dalla pagina autore al profilo pubblico /u/<username> (TOOL-09: i due profili si linkano) */
    communityProfile: "Community profile",
    /**
     * link all'indice /authors (TOOL-09: l'hub riceveva link quasi solo dalle pagine autore): su /about e, con le note di
     * integrazione del pacchetto, accanto alla firma in fondo a news e guide
     */
    allAuthors: "The whole editorial team",
  },
  builder: {
    /** descrizione del WebApplication del deck builder: i numeri arrivano da RULES (deckrules.ts) */
    appDescription:
      "Free deck builder for Origins TCG, the digital card game by Koin Games: it checks the deck rules ({legendary} Legendary plus {cards} base cards, each played as {copies} copies: {size} cards), reads and writes the in-game deck codes and checks {decks} decks together for the Conquest format of the Crimson Cup.",
    /** `featureList`: solo funzioni che DeckBuilder.tsx fa davvero */
    features: [
      "Deck rules check: {legendary} Legendary plus {cards} base cards, each played as {copies} copies ({size} cards)",
      "Import and export of Origins TCG in-game deck codes",
      "Conquest mode: {decks} decks checked together, a different Legendary in each and at least {min} unique cards between each pair",
      "Import and export of text decklists",
      "Mana curve of the deck",
      "Share link and automatic saving in the browser",
      "Private saving and publishing with a guide, with a free account",
    ],
  },
};

export type EntityLabels = typeof en;

export const entityLabels: Record<Locale, EntityLabels> = {
  en,
  it: {
    about: {
      description:
        "Chi c'è dietro OriginsMeta, il sito fan indipendente su Origins TCG: fonti ufficiali, carte verificate una per una nel gioco e contatti.",
      p2: "Siamo giocatori, non l'editore. Date, regole ed eventi arrivano solo da fonti ufficiali; le carte della collezione del gioco sono state verificate una per una nel gioco; e ogni pagina dice quando è stata aggiornata.",
      newToGame: "Non conosci il gioco? Parti da {link}.",
      newToGameLink: "che cos'è Origins TCG",
      checkTitle: "Come verifichiamo i dati",
      check: [
        "Date, regole, eventi e bilanciamenti arrivano solo da fonti ufficiali: la pagina Steam, le patch notes su Steam, il Discord ufficiale e i comunicati di Koin Games. Quando un dettaglio c'è solo sul Discord, l'articolo lo dice.",
        "Le modifiche di bilanciamento di ogni patch nuova si trascrivono dalle patch notes ufficiali sulle schede delle carte, con la data e il link al post.",
        "In data {date}, sulla versione 0.8.2 dell'Accesso anticipato, abbiamo confrontato una per una tutte le {count} carte con la collezione del gioco: costi, statistiche, rarità e allineamenti, e i testi in inglese, italiano, spagnolo, francese, portoghese, tedesco, russo e cinese semplificato, cioè le traduzioni del gioco. Dove il sito era rimasto indietro, ora ha i dati e i testi del gioco. I testi italiani e spagnoli delle carte sono quelli del gioco dal {textsDate}. Rifacciamo la verifica dopo ogni patch.",
        "Le carte generate e le carte rimosse non sono nella collezione del gioco, quindi non sono state verificate nel gioco, e le loro schede lo dicono: i testi delle carte generate sono quelli dei file del gioco, mentre i testi delle carte rimosse nelle lingue diverse dall'inglese sono nostri, scritti con il glossario del gioco. Anche i luoghi non sono ancora stati verificati uno per uno nel gioco: la pagina dei luoghi dirà quando lo saranno, e i loro effetti nelle lingue diverse dall'inglese sono nostri, con lo stesso glossario. Sono nostre anche le saghe e le note su ogni leggenda.",
      ],
      checkErrors: "Hai trovato un errore? Scrivi a {email}: lo correggiamo, e la pagina mostra la nuova data.",
      disclaimer:
        "OriginsMeta non è affiliato a Koin Games, né approvato o sponsorizzato da Koin Games. Origins TCG è un marchio del suo titolare. Nomi delle carte, illustrazioni e dati di gioco appartengono a Koin Games; il materiale ufficiale sul sito (illustrazioni delle carte, key art, screenshot) è usato come contenuto, per informare e commentare, e mai come identità di OriginsMeta.",
      disclaimerPermission:
        "OriginsMeta non è affiliato a Koin Games, né approvato o sponsorizzato da Koin Games. Origins TCG è un marchio del suo titolare. Nomi delle carte, illustrazioni e dati di gioco appartengono a Koin Games; il materiale ufficiale sul sito (illustrazioni delle carte, key art, screenshot) è usato come contenuto, con il permesso che Koin Games ci ha dato il 19 settembre 2026, e mai come identità di OriginsMeta.",
    },
    author: {
      communityProfile: "Profilo nella community",
      allAuthors: "Tutta la redazione",
    },
    builder: {
      appDescription:
        "Deck builder gratuito per Origins TCG, il gioco di carte digitale di Koin Games: controlla le regole del mazzo ({legendary} Leggendaria più {cards} carte base, ognuna in {copies} copie: {size} carte), legge e scrive i codici dei mazzi del gioco e controlla {decks} mazzi insieme per il formato Conquest della Crimson Cup.",
      features: [
        "Controllo delle regole del mazzo: {legendary} Leggendaria più {cards} carte base, ognuna in {copies} copie ({size} carte)",
        "Importazione ed esportazione dei codici dei mazzi del gioco",
        "Modalità Conquest: {decks} mazzi controllati insieme, una Leggendaria diversa in ciascuno e almeno {min} carte uniche fra ogni coppia",
        "Importazione ed esportazione delle liste in testo",
        "Curva di mana del mazzo",
        "Link da condividere e salvataggio automatico nel browser",
        "Salvataggio privato e pubblicazione con una guida, con un account gratuito",
      ],
    },
  },
  es: {
    about: {
      description:
        "Quién hace OriginsMeta, el sitio fan independiente de Origins TCG: fuentes oficiales, cartas comprobadas una por una en el juego y contacto.",
      p2: "Somos jugadores, no la editora del juego. Las fechas, las reglas y los eventos vienen solo de fuentes oficiales; las cartas de la colección del juego se comprobaron una por una en el juego; y cada página indica cuándo se actualizó por última vez.",
      newToGame: "¿No conoces el juego? Empieza por {link}.",
      newToGameLink: "qué es Origins TCG",
      checkTitle: "Cómo comprobamos los datos",
      check: [
        "Las fechas, las reglas, los eventos y los cambios de equilibrio vienen solo de fuentes oficiales: la página de Steam, las notas del parche en Steam, el Discord oficial y los comunicados de Koin Games. Cuando un detalle solo está en Discord, el artículo lo dice.",
        "Los cambios de equilibrio de cada parche nuevo se copian de las notas oficiales del parche en las fichas de las cartas, con la fecha y el enlace a la publicación.",
        "El {date}, en la versión 0.8.2 del Acceso anticipado, comparamos una por una las {count} cartas con la colección del juego: costes, estadísticas, rarezas y alineamientos, y los textos en inglés, italiano, español, francés, portugués, alemán, ruso y chino simplificado, las traducciones del propio juego. Donde el sitio se había quedado atrás, ahora tiene los datos y los textos del juego. Los textos de las cartas en italiano y español son los del juego desde el {textsDate}. Repetimos la comprobación después de cada parche.",
        "Las cartas creadas y las cartas retiradas no están en la colección del juego, así que no se han verificado en el juego, y sus fichas lo dicen: los textos de las cartas creadas son los de los archivos del juego, mientras que los textos de las cartas retiradas en idiomas distintos del inglés son nuestros, escritos con el glosario del juego. Las ubicaciones tampoco se han verificado una por una en el juego todavía: la página de las ubicaciones dirá cuándo lo estén, y sus efectos en idiomas distintos del inglés son nuestros, con el mismo glosario. También son nuestras las sagas y las notas sobre cada leyenda.",
      ],
      checkErrors: "¿Has encontrado un error? Escribe a {email}: lo corregimos, y la página muestra la nueva fecha.",
      disclaimer:
        "OriginsMeta no está afiliado a Koin Games ni cuenta con su respaldo o patrocinio. Origins TCG es una marca de su titular. Los nombres de las cartas, las ilustraciones y los datos del juego pertenecen a Koin Games; el material oficial del sitio (ilustraciones de las cartas, key art, capturas de pantalla) se usa como contenido, para informar y comentar, y nunca como imagen de marca de OriginsMeta.",
      disclaimerPermission:
        "OriginsMeta no está afiliado a Koin Games ni cuenta con su respaldo o patrocinio. Origins TCG es una marca de su titular. Los nombres de las cartas, las ilustraciones y los datos del juego pertenecen a Koin Games; el material oficial del sitio (ilustraciones de las cartas, key art, capturas de pantalla) se usa como contenido, con el permiso que Koin Games nos dio el 19 de septiembre de 2026, y nunca como imagen de marca de OriginsMeta.",
    },
    author: {
      communityProfile: "Perfil en la comunidad",
      allAuthors: "Toda la redacción",
    },
    builder: {
      appDescription:
        "Deck builder gratuito para Origins TCG, el juego de cartas digital de Koin Games: comprueba las reglas del mazo ({legendary} Legendaria más {cards} cartas base, cada una en {copies} copias: {size} cartas), lee y escribe los códigos de mazo del juego y comprueba {decks} mazos a la vez para el formato Conquest de la Crimson Cup.",
      features: [
        "Comprobación de las reglas del mazo: {legendary} Legendaria más {cards} cartas base, cada una en {copies} copias ({size} cartas)",
        "Importación y exportación de los códigos de mazo del juego",
        "Modo Conquest: {decks} mazos comprobados a la vez, con una Legendaria distinta en cada uno y al menos {min} cartas únicas entre cada par",
        "Importación y exportación de listas en texto",
        "Curva de maná del mazo",
        "Enlace para compartir y guardado automático en el navegador",
        "Guardado privado y publicación con una guía, con una cuenta gratuita",
      ],
    },
  },
  fr: {
    about: {
      description:
        "Qui fait OriginsMeta, le site de fans indépendant sur Origins TCG : sources officielles, cartes vérifiées une par une dans le jeu et contact.",
      p2: "Nous sommes des joueurs, pas l'éditeur. Les dates, les règles et les événements viennent uniquement de sources officielles ; les cartes de la collection du jeu ont été vérifiées une par une dans le jeu ; et chaque page indique la date de sa dernière mise à jour.",
      newToGame: "Vous découvrez le jeu ? Commencez par {link}.",
      newToGameLink: "ce qu'est Origins TCG",
      checkTitle: "Comment nous vérifions nos données",
      check: [
        "Les dates, les règles, les événements et les changements d'équilibrage viennent uniquement de sources officielles : la page Steam, les notes de patch sur Steam, le Discord officiel et les communiqués de Koin Games. Quand un détail n'existe que sur Discord, l'article le précise.",
        "Les changements d'équilibrage de chaque nouveau patch sont recopiés des notes de patch officielles sur les pages des cartes, avec la date et le lien vers la publication.",
        "Le {date}, sur la version 0.8.2 de l'Accès anticipé, nous avons comparé une par une les {count} cartes avec la collection du jeu : coûts, statistiques, raretés et alignements, et les textes en français, anglais, italien, espagnol, portugais, allemand, russe et chinois simplifié, c'est-à-dire les traductions du jeu. Là où le site avait pris du retard, il a maintenant les données et les textes du jeu. Les textes des cartes en italien et en espagnol sont ceux du jeu depuis le {textsDate}. Nous refaisons la vérification après chaque patch.",
        "Les cartes créées et les cartes retirées ne sont pas dans la collection du jeu : elles n'ont donc pas été vérifiées dans le jeu, et leurs fiches le disent. Les textes des cartes créées sont ceux des fichiers du jeu, tandis que les textes des cartes retirées dans les langues autres que l'anglais sont les nôtres, écrits avec le glossaire du jeu. Les lieux n'ont pas encore été vérifiés un par un dans le jeu non plus : la page des lieux dira quand ce sera fait, et leurs effets dans les langues autres que l'anglais sont les nôtres, avec le même glossaire. Les sagas et les notes sur chaque légende sont aussi les nôtres.",
      ],
      checkErrors: "Vous avez trouvé une erreur ? Écrivez à {email} : nous la corrigeons, et la page affiche la nouvelle date.",
      disclaimer:
        "OriginsMeta n'est pas affilié à Koin Games, ni approuvé ou sponsorisé par Koin Games. Origins TCG est une marque de son propriétaire. Les noms des cartes, les illustrations et les données du jeu appartiennent à Koin Games ; le matériel officiel présent sur ce site (illustrations des cartes, key art, captures d'écran) est utilisé comme contenu, pour informer et commenter, et jamais comme identité visuelle d'OriginsMeta.",
      disclaimerPermission:
        "OriginsMeta n'est pas affilié à Koin Games, ni approuvé ou sponsorisé par Koin Games. Origins TCG est une marque de son propriétaire. Les noms des cartes, les illustrations et les données du jeu appartiennent à Koin Games ; le matériel officiel présent sur ce site (illustrations des cartes, key art, captures d'écran) est utilisé comme contenu, avec l'autorisation que Koin Games nous a donnée le 19 septembre 2026, et jamais comme identité visuelle d'OriginsMeta.",
    },
    author: {
      communityProfile: "Profil dans la communauté",
      allAuthors: "Toute la rédaction",
    },
    builder: {
      appDescription:
        "Deck builder gratuit pour Origins TCG, le jeu de cartes numérique de Koin Games : il vérifie les règles du deck ({legendary} Légendaire plus {cards} cartes de base, chacune en {copies} exemplaires : {size} cartes), lit et écrit les codes de deck du jeu et vérifie {decks} decks ensemble pour le format Conquest de la Crimson Cup.",
      features: [
        "Vérification des règles du deck : {legendary} Légendaire plus {cards} cartes de base, chacune en {copies} exemplaires ({size} cartes)",
        "Import et export des codes de deck du jeu Origins TCG",
        "Mode Conquest : {decks} decks vérifiés ensemble, une Légendaire différente dans chacun et au moins {min} cartes uniques entre chaque paire",
        "Import et export des listes de deck en texte",
        "Courbe de mana du deck",
        "Lien de partage et sauvegarde automatique dans le navigateur",
        "Sauvegarde privée et publication avec un guide, avec un compte gratuit",
      ],
    },
  },
  pt: {
    about: {
      description:
        "Quem faz o OriginsMeta, o site de fãs independente de Origins TCG: fontes oficiais, cartas verificadas uma a uma no jogo e contato.",
      p2: "Somos jogadores, não a editora do jogo. Datas, regras e eventos vêm só de fontes oficiais; as cartas da coleção do jogo foram verificadas uma a uma no jogo; e cada página informa quando foi atualizada pela última vez.",
      newToGame: "Não conhece o jogo? Comece por {link}.",
      newToGameLink: "o que é Origins TCG",
      checkTitle: "Como verificamos os dados",
      check: [
        "Datas, regras, eventos e mudanças de balanceamento vêm só de fontes oficiais: a página da Steam, as notas do patch na Steam, o Discord oficial e os comunicados da Koin Games. Quando um detalhe está só no Discord, o artigo diz isso.",
        "As mudanças de balanceamento de cada novo patch são copiadas das notas oficiais do patch para as páginas das cartas, com a data e o link para a publicação.",
        "Em {date}, na versão 0.8.2 do Acesso Antecipado, comparamos uma a uma todas as {count} cartas com a coleção do jogo: custos, estatísticas, raridades e alinhamentos, e os textos em inglês, italiano, espanhol, francês, português, alemão, russo e chinês simplificado, as traduções do próprio jogo. Onde o site tinha ficado para trás, agora ele tem os dados e os textos do jogo. Os textos das cartas em italiano e espanhol são os do jogo desde {textsDate}. Refazemos a verificação depois de cada patch.",
        "As cartas criadas e as cartas removidas não estão na coleção do jogo, por isso não foram verificadas no jogo, e as páginas delas dizem isso: os textos das cartas criadas são os dos arquivos do jogo, enquanto os textos das cartas removidas nos idiomas além do inglês são nossos, escritos com o glossário do jogo. Os locais também ainda não foram verificados um a um no jogo: a página dos locais vai dizer quando forem, e os efeitos deles nos idiomas além do inglês são nossos, com o mesmo glossário. As sagas e as notas sobre cada lenda também são nossas.",
      ],
      checkErrors: "Encontrou um erro? Escreva para {email}: nós corrigimos, e a página mostra a nova data.",
      disclaimer:
        "OriginsMeta não é afiliado à Koin Games, nem aprovado ou patrocinado pela Koin Games. Origins TCG é uma marca do seu titular. Os nomes das cartas, as ilustrações e os dados do jogo pertencem à Koin Games; o material oficial do site (ilustrações das cartas, key art, capturas de tela) é usado como conteúdo, para informar e comentar, e nunca como identidade visual do OriginsMeta.",
      disclaimerPermission:
        "OriginsMeta não é afiliado à Koin Games, nem aprovado ou patrocinado pela Koin Games. Origins TCG é uma marca do seu titular. Os nomes das cartas, as ilustrações e os dados do jogo pertencem à Koin Games; o material oficial do site (ilustrações das cartas, key art, capturas de tela) é usado como conteúdo, com a permissão que a Koin Games nos deu em 19 de setembro de 2026, e nunca como identidade visual do OriginsMeta.",
    },
    author: {
      communityProfile: "Perfil na comunidade",
      allAuthors: "Toda a equipe editorial",
    },
    builder: {
      appDescription:
        "Deck builder gratuito para Origins TCG, o jogo de cartas digital da Koin Games: verifica as regras do deck ({legendary} Lendária mais {cards} cartas base, cada uma em {copies} cópias: {size} cartas), lê e escreve os códigos de deck do jogo e verifica {decks} decks juntos para o formato Conquest da Crimson Cup.",
      features: [
        "Verificação das regras do deck: {legendary} Lendária mais {cards} cartas base, cada uma em {copies} cópias ({size} cartas)",
        "Importação e exportação dos códigos de deck do jogo Origins TCG",
        "Modo Conquest: {decks} decks verificados juntos, uma Lendária diferente em cada um e pelo menos {min} cartas únicas entre cada par",
        "Importação e exportação de listas de deck em texto",
        "Curva de mana do deck",
        "Link para compartilhar e salvamento automático no navegador",
        "Salvamento privado e publicação com um guia, com uma conta gratuita",
      ],
    },
  },
  // tedesco (20/10/2026): i testi tedeschi delle carte della collezione sono quelli del gioco, letti il 20/10/2026
  // (docs/tedesco.md); carte create e rimosse e luoghi restano nostri, e "So prüfen wir unsere Daten" lo dice
  de: {
    about: {
      description:
        "Wer OriginsMeta macht, die unabhängige Fanseite zu Origins TCG: offizielle Quellen, Karten einzeln im Spiel geprüft und Kontakt.",
      p2: "Wir sind Spieler, nicht der Publisher. Daten, Regeln und Events kommen nur aus offiziellen Quellen; die Karten der Sammlung des Spiels wurden einzeln im Spiel geprüft; und jede Seite sagt, wann sie zuletzt aktualisiert wurde.",
      newToGame: "Neu im Spiel? Hier erfährst du, {link}.",
      newToGameLink: "was Origins TCG ist",
      checkTitle: "So prüfen wir unsere Daten",
      check: [
        "Daten, Regeln, Events und Balance-Änderungen stammen nur aus offiziellen Quellen: der Steam-Seite, den Patchnotes auf Steam, dem offiziellen Discord und den Mitteilungen von Koin Games. Steht ein Detail nur im Discord, sagt der Artikel das.",
        "Die Balance-Änderungen jedes neuen Patches übertragen wir aus den offiziellen Patchnotes auf die Kartenseiten, mit Datum und Link zum Beitrag.",
        "Am {date} haben wir auf Version 0.8.2 des Early Access alle {count} Karten einzeln mit der Sammlung im Spiel verglichen: Kosten, Werte, Seltenheiten und Gesinnungen sowie die Texte auf Englisch, Italienisch, Spanisch, Französisch, Portugiesisch, Deutsch, Russisch und vereinfachtem Chinesisch, also die Übersetzungen des Spiels. Wo die Website zurücklag, hat sie jetzt die Daten und Texte des Spiels. Die italienischen und spanischen Kartentexte sind seit dem {textsDate} die des Spiels. Wir wiederholen die Prüfung nach jedem Patch.",
        "Erschaffene und entfernte Karten sind nicht in der Sammlung des Spiels, deshalb wurden sie nicht im Spiel geprüft, und ihre Seiten sagen das: Die Texte der erschaffenen Karten sind die aus den Dateien des Spiels, die Texte der entfernten Karten in anderen Sprachen als Englisch sind unsere, geschrieben mit dem Glossar des Spiels. Auch die Orte wurden noch nicht einzeln im Spiel geprüft: Die Seite der Orte wird sagen, wann es so weit ist, und ihre Effekte in anderen Sprachen als Englisch sind unsere, mit demselben Glossar. Auch die Sagen und die Notizen zu jeder Legende sind von uns.",
      ],
      checkErrors: "Einen Fehler gefunden? Schreib an {email}: Wir korrigieren ihn, und die Seite zeigt das neue Datum.",
      disclaimer:
        "OriginsMeta ist nicht mit Koin Games verbunden und wird von Koin Games weder unterstützt noch gesponsert. Origins TCG ist eine Marke ihres Inhabers. Kartennamen, Illustrationen und Spieldaten gehören Koin Games; das offizielle Material auf dieser Website (Kartenillustrationen, Key Art, Screenshots) wird als Inhalt verwendet, um zu informieren und zu kommentieren, und nie als eigenes Markenbild von OriginsMeta.",
      disclaimerPermission:
        "OriginsMeta ist nicht mit Koin Games verbunden und wird von Koin Games weder unterstützt noch gesponsert. Origins TCG ist eine Marke ihres Inhabers. Kartennamen, Illustrationen und Spieldaten gehören Koin Games; das offizielle Material auf dieser Website (Kartenillustrationen, Key Art, Screenshots) wird als Inhalt verwendet, mit der Erlaubnis, die uns Koin Games am 19. September 2026 gegeben hat, und nie als eigenes Markenbild von OriginsMeta.",
    },
    author: {
      communityProfile: "Profil in der Community",
      allAuthors: "Die ganze Redaktion",
    },
    builder: {
      appDescription:
        "Kostenloser Deckbuilder für Origins TCG, das digitale Kartenspiel von Koin Games: Er prüft die Deckregeln ({legendary} Legendäre plus {cards} Basiskarten, jede in {copies} Exemplaren: {size} Karten), liest und schreibt die Deckcodes des Spiels und prüft {decks} Decks zusammen für das Conquest-Format des Crimson Cup.",
      features: [
        "Prüfung der Deckregeln: {legendary} Legendäre plus {cards} Basiskarten, jede in {copies} Exemplaren ({size} Karten)",
        "Import und Export der Deckcodes von Origins TCG",
        "Conquest-Modus: {decks} Decks zusammen geprüft, in jedem eine andere Legendäre und mindestens {min} einzigartige Karten Unterschied zwischen je zwei Decks",
        "Import und Export von Decklists als Text",
        "Manakurve des Decks",
        "Link zum Teilen und automatisches Speichern im Browser",
        "Privates Speichern und Veröffentlichen mit einem Guide, mit einem kostenlosen Konto",
      ],
    },
  },
  // russo (20/10/2026, docs/russo.md): i testi russi delle carte della collezione sono quelli del gioco, letti la notte del
  // 20/10/2026; carte create e rimosse e luoghi restano nostri, e "Как мы проверяем данные" lo dice
  ru: {
    about: {
      description:
        "Кто делает OriginsMeta, независимый фан-сайт об Origins TCG: официальные источники, карты, проверенные в игре по одной, и контакты.",
      p2: "Мы игроки, а не издатель. Даты, правила и события берутся только из официальных источников; карты коллекции игры проверены в игре по одной; на каждой странице указано, когда она обновлялась в последний раз.",
      newToGame: "Впервые в игре? Начните с {link}.",
      newToGameLink: "рассказа о том, что такое Origins TCG",
      checkTitle: "Как мы проверяем данные",
      check: [
        "Даты, правила, события и балансные изменения берутся только из официальных источников: страницы Steam, патчноутов в Steam, официального Discord и объявлений Koin Games. Если какая-то деталь есть только в Discord, статья так и говорит.",
        "Балансные изменения каждого нового патча мы переносим из официальных патчноутов на страницы карт — с датой и ссылкой на пост.",
        "{date}, на версии 0.8.2 раннего доступа, мы сравнили с коллекцией в игре, одну за другой, все {count} карт: стоимость, характеристики, редкость и мировоззрение, а также тексты на английском, итальянском, испанском, французском, португальском, немецком, русском и упрощённом китайском — собственные переводы игры. Там, где сайт отставал, теперь данные и тексты игры. Тексты карт на итальянском и испанском взяты из игры с {textsDate}. Мы повторяем проверку после каждого патча.",
        "Созданных и удалённых карт нет в коллекции игры, поэтому в игре они не проверены, и их страницы об этом говорят: тексты созданных карт взяты из файлов игры, а тексты удалённых карт на языках, кроме английского, — наши, написанные с глоссарием игры. Локации тоже ещё не проверены в игре по одной: страница локаций скажет, когда это будет сделано, а их эффекты на языках, кроме английского, — наши, с тем же глоссарием. Саги и заметки о каждой легенде — тоже наши.",
      ],
      checkErrors: "Нашли ошибку? Напишите на {email}: мы её исправим, и на странице появится новая дата.",
      disclaimer:
        "OriginsMeta не связан с Koin Games, не одобрен и не спонсируется Koin Games. Origins TCG — товарный знак своего владельца. Названия карт, иллюстрации и игровые данные принадлежат Koin Games; официальные материалы на этом сайте (иллюстрации карт, ключевой арт, скриншоты) используются как контент, чтобы информировать и комментировать, и никогда — как фирменный стиль OriginsMeta.",
      disclaimerPermission:
        "OriginsMeta не связан с Koin Games, не одобрен и не спонсируется Koin Games. Origins TCG — товарный знак своего владельца. Названия карт, иллюстрации и игровые данные принадлежат Koin Games; официальные материалы на этом сайте (иллюстрации карт, ключевой арт, скриншоты) используются как контент с разрешения, которое Koin Games дала нам 19 сентября 2026, и никогда — как фирменный стиль OriginsMeta.",
    },
    author: {
      communityProfile: "Профиль в сообществе",
      allAuthors: "Вся редакция",
    },
    builder: {
      appDescription:
        "Бесплатный конструктор колод для Origins TCG, цифровой карточной игры от Koin Games: он проверяет правила колоды ({legendary} Легендарная и {cards} базовых карт, каждая в {copies} копиях: всего {size} карт), читает и создаёт коды колод игры и проверяет {decks} колоды вместе для формата Conquest турнира Crimson Cup.",
      features: [
        "Проверка правил колоды: {legendary} Легендарная и {cards} базовых карт, каждая в {copies} копиях ({size} карт)",
        "Импорт и экспорт кодов колод Origins TCG",
        "Режим Conquest: {decks} колоды проверяются вместе, в каждой своя Легендарная и не меньше {min} уникальных карт разницы между каждой парой",
        "Импорт и экспорт текстовых списков колод",
        "Кривая маны колоды",
        "Ссылка для обмена и автосохранение в браузере",
        "Приватное сохранение и публикация с гайдом — с бесплатным аккаунтом",
      ],
    },
  },
  // cinese semplificato (04/11/2026, docs/cinese.md): il gioco ha il cinese dalla patch 0.7, ma i testi cinesi delle carte
  // sono ancora una traduzione nostra PROVVISORIA (card-lore-zh-cn.ts), non letti nel gioco: "我们如何核实数据" lo dice
  "zh-cn": {
    about: {
      description:
        "OriginsMeta 是由玩家运营的 Origins TCG 独立粉丝网站：日期、规则和赛事只来自官方来源，游戏收藏中的卡牌已逐张在游戏中核对，每个页面都注明最后更新日期。本页介绍我们是谁、我们如何核实数据、遵循哪些编辑原则，以及如何联系我们。",
      p2: "我们是玩家，不是发行商。日期、规则和赛事只来自官方来源；游戏收藏中的卡牌已逐张在游戏中核对；每个页面都注明最后更新的时间。",
      newToGame: "刚接触这款游戏？从{link}开始。",
      newToGameLink: "了解 Origins TCG 是什么",
      checkTitle: "我们如何核实数据",
      check: [
        "日期、规则、赛事和平衡改动只来自官方来源：Steam 页面、Steam 上的补丁说明、官方 Discord 以及 Koin Games 的公告。如果某个细节只出现在 Discord 上，文章会注明。",
        "每个新补丁的平衡改动都从官方补丁说明抄录到卡牌页面上，并附上日期和公告链接。",
        "{date}，我们在抢先体验 0.8.2 版本上将全部 {count} 张卡牌与游戏中的收藏逐张比对：费用、数值、稀有度和阵营，以及游戏自带的英语、意大利语、西班牙语、法语、葡萄牙语、德语、俄语和简体中文文本。凡是本站落后的地方，现在都已采用游戏的数据和文本。意大利语和西班牙语的卡牌文本自 {textsDate}起就是游戏中的文本。每次补丁之后，我们都会重新核对。",
        "生成卡牌和已移除的卡牌不在游戏的收藏中，因此没有在游戏中核对，它们的页面也会说明这一点：生成卡牌的文本来自游戏文件，已移除卡牌除英语外各语言的文本则由我们按游戏的术语撰写。地点也还没有在游戏中逐个核对：地点页面会说明何时完成，它们除英语外各语言的效果由我们按同样的术语撰写。系列和每个传说的介绍也由我们撰写。",
      ],
      checkErrors: "发现错误？请写信至 {email}：我们会修正，页面也会显示新的日期。",
      disclaimer:
        "OriginsMeta 是非官方粉丝网站，与 Koin Games 无关联，也未获得 Koin Games 的认可或赞助。Origins TCG 是其所有者的商标。卡牌名称、插画和游戏数据归 Koin Games 所有；本站的官方素材（卡图、主视觉、截图）作为内容用于提供信息和评论，从不作为 OriginsMeta 自身的品牌形象。",
      disclaimerPermission:
        "OriginsMeta 是非官方粉丝网站，与 Koin Games 无关联，也未获得 Koin Games 的认可或赞助。Origins TCG 是其所有者的商标。卡牌名称、插画和游戏数据归 Koin Games 所有；本站的官方素材（卡图、主视觉、截图）经 Koin Games 于 2026年9月19日给予的许可作为内容使用，从不作为 OriginsMeta 自身的品牌形象。",
    },
    author: {
      communityProfile: "社区主页",
      allAuthors: "全体编辑",
    },
    builder: {
      appDescription:
        "Origins TCG（Koin Games 出品的数字卡牌游戏）的免费卡组构筑器：检查卡组规则（{legendary} 张传说卡加 {cards} 张基础卡，每张以 {copies} 份打出：共 {size} 张），读取和生成游戏内的卡组代码，并为 Crimson Cup 的 Conquest 赛制同时检查 {decks} 套卡组。",
      features: [
        "卡组规则检查：{legendary} 张传说卡加 {cards} 张基础卡，每张以 {copies} 份打出（共 {size} 张）",
        "导入和导出 Origins TCG 游戏内卡组代码",
        "Conquest 模式：同时检查 {decks} 套卡组，每套使用不同的传说卡，每两套之间至少有 {min} 张不同的卡牌",
        "导入和导出文本卡表",
        "卡组的法力曲线",
        "分享链接，并在浏览器中自动保存",
        "注册免费账户后可私密保存，或附上攻略发布",
      ],
    },
  },
};

/**
 * Il permesso di Koin Games del 19/09/2026 nel disclaimer di /about: spento finché Pierluigi non dà l'OK a renderlo
 * pubblico (rilievo HOME-09). Con `true` la pagina usa `disclaimerPermission` al posto di `disclaimer`, nelle tre lingue;
 * in tutte e due le versioni la non affiliazione resta in testa e il "fair use" non c'è più (lo controlla un test).
 */
export const KOIN_PERMISSION_PUBLIC = false;

/** Il disclaimer di /about nella lingua della pagina, secondo `KOIN_PERMISSION_PUBLIC`. */
export function aboutDisclaimer(locale: Locale): string {
  const a = entityLabels[locale].about;
  return KOIN_PERMISSION_PUBLIC ? a.disclaimerPermission : a.disclaimer;
}

/**
 * Giorno in cui abbiamo letto nel gioco i testi italiani e spagnoli delle carte e li abbiamo messi sul sito (CLAUDE.md:
 * "Dal 25/09/2026 anche `it` ed `es` sono i testi ufficiali letti nel gioco"). Da spostare accanto a `cardsVerified` in
 * src/lib/data/cards.ts quando quel file cambia per altro; qui perché il pacchetto non tocca i dati delle carte.
 */
export const OFFICIAL_TEXTS_READ = "2026-09-25";

/**
 * I paragrafi di "Come verifichiamo i dati" con i segnaposto riempiti: `date` e `textsDate` già formattati nella lingua
 * della pagina (`formatDate`), `count` il numero di carte confrontate. Un segnaposto sconosciuto resta com'è, così un
 * test lo vede.
 */
export function aboutChecks(locale: Locale, values: { date: string; count: number; textsDate: string }): string[] {
  const v: Record<string, string> = { date: values.date, count: String(values.count), textsDate: values.textsDate };
  return entityLabels[locale].about.check.map((p) => p.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m));
}

/** I numeri delle regole del mazzo, dai valori veri di RULES: così descrizione e funzioni non restano indietro. */
const ruleVars: Record<string, number> = {
  legendary: RULES.legendarySlots,
  cards: RULES.distinctCards,
  copies: RULES.copiesPerCard,
  size: RULES.deckSize,
  decks: RULES.conquestDecks,
  min: RULES.conquestMinDifferent,
};

const withRules = (template: string): string => template.replace(/\{(\w+)\}/g, (m, k: string) => (k in ruleVars ? String(ruleVars[k]) : m));

/** Descrizione e funzioni del deck builder nei dati strutturati (WebApplication), nella lingua della pagina. */
export function deckBuilderApp(locale: Locale): { description: string; features: string[] } {
  const b = entityLabels[locale].builder;
  return { description: withRules(b.appDescription), features: b.features.map(withRules) };
}
