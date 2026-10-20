import type { Locale } from "./i18n";

/**
 * Testi delle versioni dei mazzi della community (pacchetto VERSIONI, 30/09/2026): il riquadro "Carte del mazzo" della
 * pagina di modifica, la striscia del deck builder quando aggiorna un mazzo pubblicato e il selettore delle versioni
 * nella scheda del mazzo. Un modulo solo nelle tre lingue, come deckArtLabels.ts; `en` è il tipo di riferimento.
 * Segnaposto fra graffe ({n}, {next}, {patch}, {date}, {from}, {to}, {name}, {avg}), riempiti da `fillLabel`
 * (deckQuality.ts). Nessun import a runtime: il test in deckVersions.test.ts lo carica con `node --test`.
 */
const en = {
  edit: {
    title: "Deck cards",
    /** versione in vigore, sopra il riquadro */
    current: "Version {n} · patch {patch} · these cards since {date}",
    intro:
      "A new patch is out? Change the cards here and keep name, guide, videos and link. New cards open version {next}: votes start again from zero, and the previous version stays on the deck page with its own votes.",
    openBuilder: "Change the cards in the deck builder",
    /** il tasto quando il mazzo è fermo a una patch precedente all'ultima (Pierluigi, 30/09/2026: "aggiorna a versione 0.7") */
    updateTo: "Update to version {patch}",
    /** sopra il tasto, nello stesso caso */
    outdated: "This deck was built for patch {old}: version {patch} is out.",
    changedTitle: "New cards, not saved yet",
    added: "In",
    removed: "Out",
    legendary: "Legendary: {from} → {to}",
    /** sotto il riepilogo delle carte nuove, prima del tasto "Salva" */
    saveNotice: "When you save, the deck becomes version {next} (patch {patch}) and voting starts again. The guide doesn't change by itself: check that it still matches the new cards.",
    discard: "Keep the current cards",
    same: "The deck builder sent back the same cards the deck already has: nothing changes.",
    invalid: "The cards in the link can't be read: the deck keeps its current cards.",
    unavailable: "Changing the cards isn't available yet: you can still edit name, guide and videos.",
  },
  builder: {
    /** striscia sopra il builder quando si arriva da "Cambia le carte" */
    banner: "You are updating the cards of “{name}”, a published deck. When you're done, go back to save: guide and votes stay where they are until then.",
    bannerNoName: "You are updating the cards of a published deck. When you're done, go back to save.",
    update: "Save to the published deck",
    cancel: "Stop updating",
  },
  deck: {
    /** accanto a "Patch" nel kicker della scheda */
    version: "Version {n}",
    title: "Versions of this deck",
    hint: "Votes count for the version in play. Earlier versions keep the cards and the votes they had.",
    current: "current",
    /** etichetta del selettore di una versione */
    option: "v{n} · {patch}",
    optionNoPatch: "v{n}",
    range: "{from} → {to}",
    since: "since {date}",
    votes: "{avg} ★ · {n} votes",
    oneVote: "{avg} ★ · 1 vote",
    noVotes: "No votes",
    changes: "Changes from v{n}",
    cards: "Cards of version {n}",
    openInBuilder: "Open v{n} in the deck builder",
  },
  errors: {
    versionsUnavailable: "Changing the cards isn't available yet: try again in a few minutes, or save without changing the cards.",
  },
};

export type DeckVersionLabels = typeof en;

const it: DeckVersionLabels = {
  edit: {
    title: "Carte del mazzo",
    current: "Versione {n} · patch {patch} · queste carte dal {date}",
    intro:
      "È uscita una patch? Cambia qui le carte e tieni nome, guida, video e link. Con carte nuove si apre la versione {next}: i voti ripartono da zero e la versione di prima resta nella scheda del mazzo con i suoi voti.",
    openBuilder: "Cambia le carte nel deck builder",
    updateTo: "Aggiorna alla versione {patch}",
    outdated: "Questo mazzo è fatto per la patch {old}: è uscita la versione {patch}.",
    changedTitle: "Carte nuove, non ancora salvate",
    added: "Entrano",
    removed: "Escono",
    legendary: "Leggendaria: {from} → {to}",
    saveNotice: "Salvando, il mazzo diventa la versione {next} (patch {patch}) e i voti ripartono. La guida non cambia da sola: controlla che vada ancora bene per le carte nuove.",
    discard: "Tieni le carte di adesso",
    same: "Dal deck builder sono tornate le stesse carte che il mazzo ha già: non cambia niente.",
    invalid: "Le carte del link non si leggono: il mazzo tiene quelle di adesso.",
    unavailable: "Il cambio delle carte non è ancora disponibile: nome, guida e video si modificano lo stesso.",
  },
  builder: {
    banner: "Stai aggiornando le carte di “{name}”, un mazzo pubblicato. Quando hai finito torna indietro a salvare: fino ad allora guida e voti restano come sono.",
    bannerNoName: "Stai aggiornando le carte di un mazzo pubblicato. Quando hai finito torna indietro a salvare.",
    update: "Salva nel mazzo pubblicato",
    cancel: "Smetti di aggiornare",
  },
  deck: {
    version: "Versione {n}",
    title: "Versioni del mazzo",
    hint: "I voti valgono per la versione in vigore. Le versioni di prima tengono le carte e i voti che avevano.",
    current: "attuale",
    option: "v{n} · {patch}",
    optionNoPatch: "v{n}",
    range: "{from} → {to}",
    since: "dal {date}",
    votes: "{avg} ★ · {n} voti",
    oneVote: "{avg} ★ · 1 voto",
    noVotes: "Nessun voto",
    changes: "Cambi rispetto alla v{n}",
    cards: "Carte della versione {n}",
    openInBuilder: "Apri la v{n} nel deck builder",
  },
  errors: {
    versionsUnavailable: "Il cambio delle carte non è ancora disponibile: riprova fra qualche minuto, o salva senza cambiare le carte.",
  },
};

const es: DeckVersionLabels = {
  edit: {
    title: "Cartas del mazo",
    current: "Versión {n} · parche {patch} · estas cartas desde el {date}",
    intro:
      "¿Salió un parche? Cambia aquí las cartas y conserva nombre, guía, videos y enlace. Con cartas nuevas se abre la versión {next}: los votos vuelven a cero y la versión anterior sigue en la página del mazo con sus votos.",
    openBuilder: "Cambiar las cartas en el deck builder",
    updateTo: "Actualizar a la versión {patch}",
    outdated: "Este mazo está hecho para el parche {old}: salió la versión {patch}.",
    changedTitle: "Cartas nuevas, aún sin guardar",
    added: "Entran",
    removed: "Salen",
    legendary: "Legendaria: {from} → {to}",
    saveNotice: "Al guardar, el mazo pasa a ser la versión {next} (parche {patch}) y la votación empieza de nuevo. La guía no cambia sola: revisa que siga valiendo para las cartas nuevas.",
    discard: "Conservar las cartas actuales",
    same: "El deck builder devolvió las mismas cartas que ya tiene el mazo: no cambia nada.",
    invalid: "No se pueden leer las cartas del enlace: el mazo conserva las actuales.",
    unavailable: "El cambio de cartas aún no está disponible: puedes editar igual nombre, guía y videos.",
  },
  builder: {
    banner: "Estás actualizando las cartas de “{name}”, un mazo publicado. Cuando termines, vuelve para guardar: hasta entonces la guía y los votos siguen igual.",
    bannerNoName: "Estás actualizando las cartas de un mazo publicado. Cuando termines, vuelve para guardar.",
    update: "Guardar en el mazo publicado",
    cancel: "Dejar de actualizar",
  },
  deck: {
    version: "Versión {n}",
    title: "Versiones del mazo",
    hint: "Los votos cuentan para la versión vigente. Las versiones anteriores conservan sus cartas y sus votos.",
    current: "actual",
    option: "v{n} · {patch}",
    optionNoPatch: "v{n}",
    range: "{from} → {to}",
    since: "desde el {date}",
    votes: "{avg} ★ · {n} votos",
    oneVote: "{avg} ★ · 1 voto",
    noVotes: "Sin votos",
    changes: "Cambios respecto a la v{n}",
    cards: "Cartas de la versión {n}",
    openInBuilder: "Abrir la v{n} en el deck builder",
  },
  errors: {
    versionsUnavailable: "El cambio de cartas aún no está disponible: vuelve a intentarlo en unos minutos o guarda sin cambiar las cartas.",
  },
};

const fr: DeckVersionLabels = {
  edit: {
    title: "Cartes du deck",
    current: "Version {n} · patch {patch} · ces cartes depuis le {date}",
    intro:
      "Un nouveau patch est sorti ? Changez les cartes ici et gardez le nom, le guide, les vidéos et le lien. De nouvelles cartes ouvrent la version {next} : les votes repartent de zéro, et la version précédente reste sur la page du deck avec ses propres votes.",
    openBuilder: "Changer les cartes dans le deck builder",
    updateTo: "Mettre à jour vers la version {patch}",
    outdated: "Ce deck a été construit pour le patch {old} : la version {patch} est sortie.",
    changedTitle: "Nouvelles cartes, pas encore enregistrées",
    added: "Entrent",
    removed: "Sortent",
    legendary: "Légendaire : {from} → {to}",
    saveNotice: "En enregistrant, le deck devient la version {next} (patch {patch}) et les votes repartent de zéro. Le guide ne change pas tout seul : vérifiez qu'il correspond encore aux nouvelles cartes.",
    discard: "Garder les cartes actuelles",
    same: "Le deck builder a renvoyé les mêmes cartes que celles du deck : rien ne change.",
    invalid: "Les cartes du lien sont illisibles : le deck garde ses cartes actuelles.",
    unavailable: "Le changement de cartes n'est pas encore disponible : vous pouvez tout de même modifier le nom, le guide et les vidéos.",
  },
  builder: {
    banner: "Vous mettez à jour les cartes de « {name} », un deck publié. Quand vous avez terminé, revenez en arrière pour enregistrer : jusque-là, le guide et les votes restent en place.",
    bannerNoName: "Vous mettez à jour les cartes d'un deck publié. Quand vous avez terminé, revenez en arrière pour enregistrer.",
    update: "Enregistrer dans le deck publié",
    cancel: "Arrêter la mise à jour",
  },
  deck: {
    version: "Version {n}",
    title: "Versions de ce deck",
    hint: "Les votes comptent pour la version en vigueur. Les versions précédentes gardent leurs cartes et leurs votes.",
    current: "actuelle",
    option: "v{n} · {patch}",
    optionNoPatch: "v{n}",
    range: "{from} → {to}",
    since: "depuis le {date}",
    votes: "{avg} ★ · {n} votes",
    oneVote: "{avg} ★ · 1 vote",
    noVotes: "Aucun vote",
    changes: "Changements par rapport à la v{n}",
    cards: "Cartes de la version {n}",
    openInBuilder: "Ouvrir la v{n} dans le deck builder",
  },
  errors: {
    versionsUnavailable: "Le changement de cartes n'est pas encore disponible : réessayez dans quelques minutes, ou enregistrez sans changer les cartes.",
  },
};

const pt: DeckVersionLabels = {
  edit: {
    title: "Cartas do deck",
    current: "Versão {n} · patch {patch} · estas cartas desde {date}",
    intro:
      "Saiu um patch novo? Troque as cartas aqui e mantenha nome, guia, vídeos e link. Cartas novas abrem a versão {next}: os votos começam de novo do zero, e a versão anterior continua na página do deck com os votos dela.",
    openBuilder: "Trocar as cartas no deck builder",
    updateTo: "Atualizar para a versão {patch}",
    outdated: "Este deck foi montado para o patch {old}: a versão {patch} já saiu.",
    changedTitle: "Cartas novas, ainda não salvas",
    added: "Entram",
    removed: "Saem",
    legendary: "Lendária: {from} → {to}",
    saveNotice: "Ao salvar, o deck vira a versão {next} (patch {patch}) e a votação começa de novo. O guia não muda sozinho: confira se ele ainda combina com as cartas novas.",
    discard: "Manter as cartas atuais",
    same: "O deck builder devolveu as mesmas cartas que o deck já tem: nada muda.",
    invalid: "Não dá para ler as cartas do link: o deck mantém as cartas atuais.",
    unavailable: "A troca de cartas ainda não está disponível: você ainda pode editar nome, guia e vídeos.",
  },
  builder: {
    banner: "Você está atualizando as cartas de “{name}”, um deck publicado. Quando terminar, volte para salvar: até lá, guia e votos ficam onde estão.",
    bannerNoName: "Você está atualizando as cartas de um deck publicado. Quando terminar, volte para salvar.",
    update: "Salvar no deck publicado",
    cancel: "Parar de atualizar",
  },
  deck: {
    version: "Versão {n}",
    title: "Versões deste deck",
    hint: "Os votos contam para a versão em vigor. As versões anteriores mantêm as cartas e os votos que tinham.",
    current: "atual",
    option: "v{n} · {patch}",
    optionNoPatch: "v{n}",
    range: "{from} → {to}",
    since: "desde {date}",
    votes: "{avg} ★ · {n} votos",
    oneVote: "{avg} ★ · 1 voto",
    noVotes: "Nenhum voto",
    changes: "Mudanças em relação à v{n}",
    cards: "Cartas da versão {n}",
    openInBuilder: "Abrir a v{n} no deck builder",
  },
  errors: {
    versionsUnavailable: "A troca de cartas ainda não está disponível: tente de novo em alguns minutos, ou salve sem trocar as cartas.",
  },
};

const de: DeckVersionLabels = {
  edit: {
    title: "Karten des Decks",
    current: "Version {n} · Patch {patch} · diese Karten seit {date}",
    intro:
      "Ein neuer Patch ist da? Ändere hier die Karten und behalte Name, Guide, Videos und Link. Neue Karten eröffnen Version {next}: Die Bewertungen beginnen wieder bei null, und die vorherige Version bleibt mit ihren eigenen Bewertungen auf der Deckseite.",
    openBuilder: "Karten im Deck builder ändern",
    updateTo: "Auf Version {patch} aktualisieren",
    outdated: "Dieses Deck wurde für Patch {old} gebaut: Version {patch} ist erschienen.",
    changedTitle: "Neue Karten, noch nicht gespeichert",
    added: "Rein",
    removed: "Raus",
    legendary: "Legendäre: {from} → {to}",
    saveNotice: "Beim Speichern wird das Deck zu Version {next} (Patch {patch}) und die Bewertung beginnt von vorn. Der Guide ändert sich nicht von selbst: Prüfe, ob er noch zu den neuen Karten passt.",
    discard: "Aktuelle Karten behalten",
    same: "Der Deck builder hat dieselben Karten zurückgeschickt, die das Deck schon hat: Es ändert sich nichts.",
    invalid: "Die Karten im Link können nicht gelesen werden: Das Deck behält seine aktuellen Karten.",
    unavailable: "Das Ändern der Karten ist noch nicht verfügbar: Name, Guide und Videos kannst du trotzdem bearbeiten.",
  },
  builder: {
    banner: "Du aktualisierst die Karten von „{name}“, einem veröffentlichten Deck. Wenn du fertig bist, geh zurück und speichere: Bis dahin bleiben Guide und Bewertungen, wie sie sind.",
    bannerNoName: "Du aktualisierst die Karten eines veröffentlichten Decks. Wenn du fertig bist, geh zurück und speichere.",
    update: "Im veröffentlichten Deck speichern",
    cancel: "Aktualisierung beenden",
  },
  deck: {
    version: "Version {n}",
    title: "Versionen dieses Decks",
    hint: "Die Bewertungen zählen für die aktuelle Version. Frühere Versionen behalten die Karten und Bewertungen, die sie hatten.",
    current: "aktuell",
    option: "v{n} · {patch}",
    optionNoPatch: "v{n}",
    range: "{from} → {to}",
    since: "seit {date}",
    votes: "{avg} ★ · {n} Bewertungen",
    oneVote: "{avg} ★ · 1 Bewertung",
    noVotes: "Keine Bewertungen",
    changes: "Änderungen gegenüber v{n}",
    cards: "Karten der Version {n}",
    openInBuilder: "v{n} im Deck builder öffnen",
  },
  errors: {
    versionsUnavailable: "Das Ändern der Karten ist noch nicht verfügbar: Versuch es in ein paar Minuten noch einmal oder speichere, ohne die Karten zu ändern.",
  },
};

const ru: DeckVersionLabels = {
  edit: {
    title: "Карты колоды",
    current: "Версия {n} · патч {patch} · эти карты с {date}",
    intro:
      "Вышел новый патч? Измените карты здесь и сохраните название, гайд, видео и ссылку. Новые карты открывают версию {next}: оценки начинаются с нуля, а предыдущая версия остаётся на странице колоды со своими оценками.",
    openBuilder: "Изменить карты в конструкторе колод",
    updateTo: "Обновить до версии {patch}",
    outdated: "Эта колода собрана для патча {old}: вышла версия {patch}.",
    changedTitle: "Новые карты, ещё не сохранены",
    added: "Добавлены",
    removed: "Убраны",
    legendary: "Легендарная карта: {from} → {to}",
    saveNotice: "После сохранения колода станет версией {next} (патч {patch}), и оценки начнутся заново. Гайд сам не меняется: проверьте, что он всё ещё подходит к новым картам.",
    discard: "Оставить текущие карты",
    same: "Конструктор колод вернул те же карты, что уже есть в колоде: ничего не меняется.",
    invalid: "Карты из ссылки не читаются: колода сохраняет текущие карты.",
    unavailable: "Изменение карт пока недоступно: название, гайд и видео по-прежнему можно редактировать.",
  },
  builder: {
    banner: "Вы обновляете карты опубликованной колоды «{name}». Когда закончите, вернитесь, чтобы сохранить: до этого гайд и оценки остаются как есть.",
    bannerNoName: "Вы обновляете карты опубликованной колоды. Когда закончите, вернитесь, чтобы сохранить.",
    update: "Сохранить в опубликованную колоду",
    cancel: "Прекратить обновление",
  },
  deck: {
    version: "Версия {n}",
    title: "Версии этой колоды",
    hint: "Оценки учитываются для действующей версии. Прежние версии сохраняют свои карты и оценки.",
    current: "текущая",
    option: "v{n} · {patch}",
    optionNoPatch: "v{n}",
    range: "{from} → {to}",
    since: "с {date}",
    votes: "{avg} ★ · оценок: {n}",
    oneVote: "{avg} ★ · 1 оценка",
    noVotes: "Нет оценок",
    changes: "Изменения по сравнению с v{n}",
    cards: "Карты версии {n}",
    openInBuilder: "Открыть v{n} в конструкторе колод",
  },
  errors: {
    versionsUnavailable: "Изменение карт пока недоступно: попробуйте через несколько минут или сохраните, не меняя карты.",
  },
};

export const deckVersionLabels: Record<Locale, DeckVersionLabels> = { en, it, es, fr, pt, de, ru };
