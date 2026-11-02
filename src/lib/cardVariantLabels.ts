import type { Locale } from "./i18n";

/**
 * Testi della sezione "Illustrazioni alternative" della scheda carta (02/11/2026, `src/lib/cardVariants.ts`), nelle sette
 * lingue; `en` è il tipo di riferimento. Nomi dei prodotti di Koin in inglese come li scrive Koin (Alpha Edition, Alpha
 * Alt-Art Promo Box, Golden Slab Promo, Premium Alternate Art Promo Set), termini dei testi già pubblicati sulle promo
 * (kickstarterLabels-*.ts: "custodia della gradazione", "estuche de calificación", "boîtier de gradation", "case de
 * graduação", "Grading-Slab", "кейс грейдинга") e dei glossari (Partie, партия, em partida). In francese lo spazio
 * insecabile prima di ":" è `\u00a0`; in russo i nomi delle carte non si declinano («карты Alice») e l'ancora è
 * traslitterata. Le frasi con il numero evitano gli accordi del russo ("…: {n}").
 */

const en = {
  title: "Alternate art",
  /** id della sezione, per il link dalla colonna della carta */
  anchor: "alternate-art",
  introOne: "One version of {name} with art different from the game card.",
  introMany: "{n} versions of {name} with art different from the game card.",
  /** che cosa sono, con il link alla guida sulla collezione */
  introNote: "They are collectible versions: the art does not change what the card does in a match.",
  collecting: "How collecting works",
  /** sotto la carta da collezione, nella colonna della carta */
  jumpOne: "1 alternate art",
  jumpMany: "{n} alternate arts",
  alpha: {
    title: "Alpha Edition",
    text: "Full-card art with the ALPHA mark, from Koin Games' media kit for creators.",
  },
  promos: {
    title: "Kickstarter promos",
    text: "Alpha Edition promo cards from the Kickstarter, in their grading case, as Koin shows them on the campaign page.",
    /** durante la campagna, verso la landing /kickstarter */
    link: "The promos in the Alpha Edition Kickstarter",
    /** dopo la campagna, verso la guida al Kickstarter */
    guideLink: "The Alpha promos in our Kickstarter guide",
  },
  group: {
    box: "Alpha Alt-Art Promo Box",
    golden: "Golden Slab Promo",
    oz: "Premium Alternate Art Promo Set",
    profile: "Numbered portrait",
    signed: "Signed portrait",
  },
  start: "From launch",
  goal: "Stretch goal: {usd}",
  artist: "Art by {name}",
  number: "M&L #{num}",
  altAlpha: "{name}, Origins TCG card in its ALPHA version with alternate art by {artist}, © Koin Games",
  altPromo: "{name}, Origins TCG Alpha Edition promo card with alternate art by {artist}, in its grading case, © Koin Games",
  credit: "Official Koin Games images; each card shows its illustrator.",
};

export type CardVariantLabels = typeof en;

export const cardVariantLabels: Record<Locale, CardVariantLabels> = {
  en,
  it: {
    title: "Illustrazioni alternative",
    anchor: "illustrazioni-alternative",
    introOne: "Una versione della carta {name} con un'illustrazione diversa da quella del gioco.",
    introMany: "{n} versioni della carta {name} con un'illustrazione diversa da quella del gioco.",
    introNote: "Sono versioni da collezione: l'illustrazione non cambia che cosa fa la carta in partita.",
    collecting: "Come funziona la collezione",
    jumpOne: "1 illustrazione alternativa",
    jumpMany: "{n} illustrazioni alternative",
    alpha: {
      title: "Alpha Edition",
      text: "Illustrazioni a tutta carta con il segno ALPHA, dal media kit di Koin Games per i creator.",
    },
    promos: {
      title: "Promo del Kickstarter",
      text: "Carte promo della Alpha Edition del Kickstarter, nella custodia della gradazione, come le mostra Koin sulla pagina della campagna.",
      link: "Le promo nel Kickstarter della Alpha Edition",
      guideLink: "Le promo Alpha nella nostra guida al Kickstarter",
    },
    group: {
      box: "Alpha Alt-Art Promo Box",
      golden: "Golden Slab Promo",
      oz: "Premium Alternate Art Promo Set",
      profile: "Ritratto numerato",
      signed: "Ritratto firmato",
    },
    start: "Dal lancio",
    goal: "Stretch goal: {usd}",
    artist: "Illustrazione di {name}",
    number: "M&L #{num}",
    altAlpha: "{name}, carta di Origins TCG nella versione ALPHA con illustrazione alternativa di {artist}, © Koin Games",
    altPromo: "{name}, carta promo della Alpha Edition di Origins TCG con illustrazione alternativa di {artist}, nella custodia della gradazione, © Koin Games",
    credit: "Immagini ufficiali di Koin Games; ogni carta riporta il suo illustratore.",
  },
  es: {
    title: "Ilustraciones alternativas",
    anchor: "ilustraciones-alternativas",
    introOne: "Una versión de la carta {name} con una ilustración distinta de la del juego.",
    introMany: "{n} versiones de la carta {name} con una ilustración distinta de la del juego.",
    introNote: "Son versiones de colección: la ilustración no cambia lo que hace la carta en la partida.",
    collecting: "Cómo funciona el coleccionismo",
    jumpOne: "1 ilustración alternativa",
    jumpMany: "{n} ilustraciones alternativas",
    alpha: {
      title: "Alpha Edition",
      text: "Ilustraciones a carta completa con la marca ALPHA, del media kit de Koin Games para creadores.",
    },
    promos: {
      title: "Promos del Kickstarter",
      text: "Cartas promo de la Alpha Edition del Kickstarter, en su estuche de calificación, como las muestra Koin en la página de la campaña.",
      link: "Las promos en el Kickstarter de la Alpha Edition",
      guideLink: "Las promos Alpha en nuestra guía del Kickstarter",
    },
    group: {
      box: "Alpha Alt-Art Promo Box",
      golden: "Golden Slab Promo",
      oz: "Premium Alternate Art Promo Set",
      profile: "Retrato numerado",
      signed: "Retrato firmado",
    },
    start: "Desde el lanzamiento",
    goal: "Stretch goal: {usd}",
    artist: "Ilustración de {name}",
    number: "M&L #{num}",
    altAlpha: "{name}, carta de Origins TCG en su versión ALPHA con ilustración alternativa de {artist}, © Koin Games",
    altPromo: "{name}, carta promo de la Alpha Edition de Origins TCG con ilustración alternativa de {artist}, en su estuche de calificación, © Koin Games",
    credit: "Imágenes oficiales de Koin Games; cada carta indica su ilustrador.",
  },
  fr: {
    title: "Illustrations alternatives",
    anchor: "illustrations-alternatives",
    introOne: "Une version de la carte {name} avec une illustration différente de celle du jeu.",
    introMany: "{n} versions de la carte {name} avec une illustration différente de celle du jeu.",
    introNote: "Ce sont des versions de collection\u00a0: l'illustration ne change pas ce que fait la carte en partie.",
    collecting: "Comment fonctionne la collection",
    jumpOne: "1 illustration alternative",
    jumpMany: "{n} illustrations alternatives",
    alpha: {
      title: "Alpha Edition",
      text: "Illustrations pleine carte avec la marque ALPHA, issues du kit média de Koin Games pour les créateurs.",
    },
    promos: {
      title: "Promos du Kickstarter",
      text: "Cartes promo de l'Alpha Edition du Kickstarter, dans leur boîtier de gradation, telles que Koin les montre sur la page de la campagne.",
      link: "Les promos dans le Kickstarter de l'Alpha Edition",
      guideLink: "Les promos Alpha dans notre guide du Kickstarter",
    },
    group: {
      box: "Alpha Alt-Art Promo Box",
      golden: "Golden Slab Promo",
      oz: "Premium Alternate Art Promo Set",
      profile: "Portrait numéroté",
      signed: "Portrait signé",
    },
    start: "Dès le lancement",
    goal: "Stretch goal\u00a0: {usd}",
    // "par" e non "de": davanti a un nome che comincia per vocale ci vorrebbe l'elisione ("d'Estevao", "d'Alina")
    artist: "Illustrée par {name}",
    number: "M&L #{num}",
    altAlpha: "{name}, carte d'Origins TCG en version ALPHA, illustration alternative par {artist}, © Koin Games",
    altPromo: "{name}, carte promo de l'Alpha Edition d'Origins TCG, illustration alternative par {artist}, dans son boîtier de gradation, © Koin Games",
    credit: "Images officielles de Koin Games\u00a0; chaque carte indique son illustrateur.",
  },
  pt: {
    title: "Ilustrações alternativas",
    anchor: "ilustracoes-alternativas",
    introOne: "Uma versão da carta {name} com uma ilustração diferente da do jogo.",
    introMany: "{n} versões da carta {name} com uma ilustração diferente da do jogo.",
    introNote: "São versões colecionáveis: a ilustração não muda o que a carta faz em partida.",
    collecting: "Como funciona a coleção",
    jumpOne: "1 ilustração alternativa",
    jumpMany: "{n} ilustrações alternativas",
    alpha: {
      title: "Alpha Edition",
      text: "Ilustrações de carta inteira com a marca ALPHA, do media kit da Koin Games para criadores.",
    },
    promos: {
      title: "Promos do Kickstarter",
      text: "Cartas promo da Alpha Edition do Kickstarter, no case de graduação, como a Koin as mostra na página da campanha.",
      link: "As promos no Kickstarter da Alpha Edition",
      guideLink: "As promos Alpha no nosso guia do Kickstarter",
    },
    group: {
      box: "Alpha Alt-Art Promo Box",
      golden: "Golden Slab Promo",
      oz: "Premium Alternate Art Promo Set",
      profile: "Retrato numerado",
      signed: "Retrato autografado",
    },
    start: "Desde o lançamento",
    goal: "Stretch goal: {usd}",
    artist: "Ilustração de {name}",
    number: "M&L #{num}",
    altAlpha: "{name}, carta de Origins TCG na versão ALPHA com ilustração alternativa de {artist}, © Koin Games",
    altPromo: "{name}, carta promo da Alpha Edition de Origins TCG com ilustração alternativa de {artist}, no case de graduação, © Koin Games",
    credit: "Imagens oficiais da Koin Games; cada carta indica o seu ilustrador.",
  },
  de: {
    title: "Alternative Illustrationen",
    anchor: "alternative-illustrationen",
    introOne: "Eine Version der Karte {name} mit einer anderen Illustration als im Spiel.",
    introMany: "{n} Versionen der Karte {name} mit einer anderen Illustration als im Spiel.",
    introNote: "Es sind Sammlerversionen: Die Illustration ändert nichts daran, was die Karte in der Partie macht.",
    collecting: "So funktioniert das Sammeln",
    jumpOne: "1 alternative Illustration",
    jumpMany: "{n} alternative Illustrationen",
    alpha: {
      title: "Alpha Edition",
      text: "Illustrationen über die ganze Karte mit dem ALPHA-Zeichen, aus dem Media Kit von Koin Games für Creator.",
    },
    promos: {
      title: "Kickstarter-Promos",
      text: "Promokarten der Alpha Edition aus dem Kickstarter, im Grading-Slab, wie Koin sie auf der Kampagnenseite zeigt.",
      link: "Die Promos im Kickstarter der Alpha Edition",
      guideLink: "Die Alpha-Promos in unserem Kickstarter-Guide",
    },
    group: {
      box: "Alpha Alt-Art Promo Box",
      golden: "Golden Slab Promo",
      oz: "Premium Alternate Art Promo Set",
      profile: "Nummeriertes Porträt",
      signed: "Signiertes Porträt",
    },
    start: "Ab dem Start",
    goal: "Stretch Goal: {usd}",
    artist: "Illustration von {name}",
    number: "M&L #{num}",
    altAlpha: "{name}, Karte aus Origins TCG in der ALPHA-Version mit alternativer Illustration von {artist}, © Koin Games",
    altPromo: "{name}, Promokarte der Alpha Edition von Origins TCG mit alternativer Illustration von {artist}, im Grading-Slab, © Koin Games",
    credit: "Offizielle Bilder von Koin Games; auf jeder Karte steht ihr Illustrator.",
  },
  ru: {
    title: "Альтернативные иллюстрации",
    anchor: "alternativnye-illyustratsii",
    introOne: "Версия карты {name} с иллюстрацией, отличной от игровой.",
    introMany: "Версии карты {name} с иллюстрацией, отличной от игровой: {n}.",
    introNote: "Это коллекционные версии: иллюстрация не меняет того, что карта делает в партии.",
    collecting: "Как устроено коллекционирование",
    jumpOne: "Альтернативная иллюстрация",
    jumpMany: "Альтернативные иллюстрации: {n}",
    alpha: {
      title: "Alpha Edition",
      text: "Иллюстрации на всю карту со знаком ALPHA, из медиакита Koin Games для авторов контента.",
    },
    promos: {
      title: "Промо Kickstarter",
      text: "Промокарты Alpha Edition с Kickstarter в кейсе грейдинга — так их показывает Koin на странице кампании.",
      link: "Промо в Kickstarter Alpha Edition",
      guideLink: "Промо Alpha в нашем гайде по Kickstarter",
    },
    group: {
      box: "Alpha Alt-Art Promo Box",
      golden: "Golden Slab Promo",
      oz: "Premium Alternate Art Promo Set",
      profile: "Нумерованный портрет",
      signed: "Портрет с автографом",
    },
    start: "С запуска",
    goal: "Цель кампании: {usd}",
    artist: "Художник: {name}",
    number: "M&L #{num}",
    altAlpha: "{name}, карта Origins TCG в версии ALPHA с альтернативной иллюстрацией, художник: {artist}, © Koin Games",
    altPromo: "{name}, промокарта Alpha Edition Origins TCG с альтернативной иллюстрацией, художник: {artist}, в кейсе грейдинга, © Koin Games",
    credit: "Официальные изображения Koin Games; на каждой карте указан её художник.",
  },
};
