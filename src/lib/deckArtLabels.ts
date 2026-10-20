import type { Locale } from "./i18n";

/**
 * Testi dell'artwork della Leggendaria di un mazzo (29/09/2026, Creator e Staff): il campo del modulo di pubblicazione
 * (`DeckArtField`), gli errori delle Server Action (`artFile`, `artRole`, `artUnavailable`) e la didascalia nella scheda
 * del mazzo. Un modulo solo nelle tre lingue, come videoLabels.ts; `en` è il tipo di riferimento. Segnaposto fra graffe:
 * {legendary}, {author}, {minw}, {minh}, {w}, {h}; li riempie `fillLabel` (deckQuality.ts). Nessun import a runtime: il
 * test in deckArt.test.ts lo carica con `node --test`.
 */
const en = {
  form: {
    title: "Legendary artwork",
    /** pastiglia accanto al titolo: chi può usare il campo */
    roles: "Creator and Staff",
    hint: "Replace the illustration of {legendary} on this deck with your own: on the deck page, in the deck lists, on your profile and in the tier lists. Card format 5:7, at least {minw} × {minh} px ({w} × {h} is ideal), PNG, JPG or WebP up to 2 MB: we crop it to 5:7 from the center. Only images that are yours or that you have the right to use. The official card stays on its own page and in the preview.",
    upload: "Upload the artwork",
    replace: "Change the artwork",
    uploading: "Uploading…",
    remove: "Use the official card",
    official: "Official card",
    custom: "Your artwork",
    /** lo staff che corregge il mazzo di un altro: può togliere l'artwork, non caricarne uno */
    notOwner: "Only whoever published the deck can upload its artwork; you can remove it here.",
    /** il proprietario che non ha (più) il ruolo: può togliere l'artwork che c'è */
    noRole: "The Legendary artwork is for Creators and Staff: here you can only remove it.",
    errors: {
      type: "This file is not a PNG, JPG or WebP image.",
      tooBig: "The image is too heavy even after compression: try a smaller one.",
      upload: "The upload didn't go through: check your connection and try again.",
      limit: "You have reached the limit of uploaded images: remove the ones you no longer use, or write to the staff.",
    },
  },
  /** errori della Server Action (codici di ActionState) */
  errors: {
    artFile: "The artwork can't be found or can't be used: upload it again, or use the official card.",
    artRole: "The Legendary artwork is for Creators and Staff.",
    artUnavailable: "Deck artwork can't be saved yet: try again in a few minutes, or publish with the official card.",
  },
  deck: {
    /** didascalia sotto l'artwork nella scheda del mazzo */
    caption: "Creator artwork",
    alt: "{legendary}: artwork of the deck by {author}",
  },
};

export type DeckArtLabels = typeof en;
/** Le etichette che servono al modulo (componente client): solo la lingua della pagina. */
export type DeckArtFormLabels = DeckArtLabels["form"] & { actionErrors: DeckArtLabels["errors"] };

const it: DeckArtLabels = {
  form: {
    title: "Artwork della Leggendaria",
    roles: "Creator e Staff",
    hint: "Sostituisci l'illustrazione di {legendary} su questo mazzo con la tua: nella scheda del mazzo, negli elenchi dei mazzi, sul tuo profilo e nelle tier list. Formato carta 5:7, almeno {minw} × {minh} px (l'ideale è {w} × {h}), PNG, JPG o WebP fino a 2 MB: la ritagliamo al centro in 5:7. Solo immagini tue o che hai il diritto di usare. La carta ufficiale resta nella sua scheda e nell'anteprima.",
    upload: "Carica l'artwork",
    replace: "Cambia l'artwork",
    uploading: "Caricamento…",
    remove: "Usa la carta ufficiale",
    official: "Carta ufficiale",
    custom: "Il tuo artwork",
    notOwner: "Solo chi ha pubblicato il mazzo può caricarne l'artwork; qui puoi toglierlo.",
    noRole: "L'artwork della Leggendaria è per i Creator e lo Staff: qui puoi solo toglierlo.",
    errors: {
      type: "Questo file non è un'immagine PNG, JPG o WebP.",
      tooBig: "L'immagine è troppo pesante anche dopo la compressione: provane una più piccola.",
      upload: "Il caricamento non è andato a buon fine: controlla la connessione e riprova.",
      limit: "Hai raggiunto il limite di immagini caricate: togli quelle che non usi più, o scrivi allo staff.",
    },
  },
  errors: {
    artFile: "L'artwork non si trova o non si può usare: caricalo di nuovo, oppure usa la carta ufficiale.",
    artRole: "L'artwork della Leggendaria è per i Creator e lo Staff.",
    artUnavailable: "L'artwork del mazzo non si può ancora salvare: riprova fra qualche minuto, oppure pubblica con la carta ufficiale.",
  },
  deck: {
    caption: "Artwork del creator",
    alt: "{legendary}: artwork del mazzo di {author}",
  },
};

const es: DeckArtLabels = {
  form: {
    title: "Arte de la Legendaria",
    roles: "Creator y Staff",
    hint: "Cambia la ilustración de {legendary} en este mazo por la tuya: en la ficha del mazo, en las listas de mazos, en tu perfil y en las tier lists. Formato carta 5:7, al menos {minw} × {minh} px (lo ideal es {w} × {h}), PNG, JPG o WebP de hasta 2 MB: la recortamos al centro en 5:7. Solo imágenes tuyas o que tengas derecho a usar. La carta oficial se queda en su ficha y en la vista previa.",
    upload: "Sube el arte",
    replace: "Cambia el arte",
    uploading: "Subiendo…",
    remove: "Usa la carta oficial",
    official: "Carta oficial",
    custom: "Tu arte",
    notOwner: "Solo quien publicó el mazo puede subir su arte; aquí puedes quitarlo.",
    noRole: "El arte de la Legendaria es para los Creators y el Staff: aquí solo puedes quitarlo.",
    errors: {
      type: "Este archivo no es una imagen PNG, JPG o WebP.",
      tooBig: "La imagen pesa demasiado incluso después de comprimirla: prueba con una más pequeña.",
      upload: "La subida no salió bien: revisa la conexión y vuelve a intentarlo.",
      limit: "Llegaste al límite de imágenes subidas: quita las que ya no uses, o escribe al staff.",
    },
  },
  errors: {
    artFile: "El arte no se encuentra o no se puede usar: súbelo de nuevo, o usa la carta oficial.",
    artRole: "El arte de la Legendaria es para los Creators y el Staff.",
    artUnavailable: "El arte del mazo aún no se puede guardar: vuelve a intentarlo en unos minutos, o publica con la carta oficial.",
  },
  deck: {
    caption: "Arte del creador",
    alt: "{legendary}: arte del mazo de {author}",
  },
};

const fr: DeckArtLabels = {
  form: {
    title: "Artwork de la Légendaire",
    roles: "Creator et Staff",
    hint: "Remplacez l'illustration de {legendary} sur ce deck par la vôtre : sur la page du deck, dans les listes de decks, sur votre profil et dans les tier lists. Format carte 5:7, au moins {minw} × {minh} px ({w} × {h} est l'idéal), PNG, JPG ou WebP jusqu'à 2 Mo : nous la recadrons au centre en 5:7. Uniquement des images qui vous appartiennent ou que vous avez le droit d'utiliser. La carte officielle reste sur sa propre page et dans l'aperçu.",
    upload: "Importer l'artwork",
    replace: "Changer l'artwork",
    uploading: "Envoi en cours…",
    remove: "Utiliser la carte officielle",
    official: "Carte officielle",
    custom: "Votre artwork",
    notOwner: "Seule la personne qui a publié le deck peut importer son artwork ; vous pouvez le retirer ici.",
    noRole: "L'artwork de la Légendaire est réservé aux Creators et au Staff : ici, vous pouvez seulement le retirer.",
    errors: {
      type: "Ce fichier n'est pas une image PNG, JPG ou WebP.",
      tooBig: "L'image est trop lourde même après compression : essayez-en une plus petite.",
      upload: "L'envoi a échoué : vérifiez votre connexion et réessayez.",
      limit: "Vous avez atteint la limite d'images importées : retirez celles que vous n'utilisez plus, ou écrivez au staff.",
    },
  },
  errors: {
    artFile: "L'artwork est introuvable ou inutilisable : importez-le de nouveau, ou utilisez la carte officielle.",
    artRole: "L'artwork de la Légendaire est réservé aux Creators et au Staff.",
    artUnavailable: "L'artwork du deck ne peut pas encore être enregistré : réessayez dans quelques minutes, ou publiez avec la carte officielle.",
  },
  deck: {
    caption: "Artwork du Creator",
    alt: "{legendary} : artwork du deck de {author}",
  },
};

const pt: DeckArtLabels = {
  form: {
    title: "Artwork da Lendária",
    roles: "Creator e Staff",
    hint: "Substitua a ilustração de {legendary} neste deck pela sua: na página do deck, nas listas de decks, no seu perfil e nas tier lists. Formato de carta 5:7, no mínimo {minw} × {minh} px (o ideal é {w} × {h}), PNG, JPG ou WebP de até 2 MB: cortamos no centro em 5:7. Só imagens suas ou que você tenha o direito de usar. A carta oficial continua na página dela e na prévia.",
    upload: "Enviar o artwork",
    replace: "Trocar o artwork",
    uploading: "Enviando…",
    remove: "Usar a carta oficial",
    official: "Carta oficial",
    custom: "Seu artwork",
    notOwner: "Só quem publicou o deck pode enviar o artwork dele; aqui você pode removê-lo.",
    noRole: "O artwork da Lendária é para Creators e Staff: aqui você só pode removê-lo.",
    errors: {
      type: "Este arquivo não é uma imagem PNG, JPG ou WebP.",
      tooBig: "A imagem continua pesada demais mesmo depois da compressão: tente uma menor.",
      upload: "O envio não deu certo: verifique sua conexão e tente de novo.",
      limit: "Você chegou ao limite de imagens enviadas: remova as que não usa mais, ou escreva para o staff.",
    },
  },
  errors: {
    artFile: "O artwork não foi encontrado ou não pode ser usado: envie de novo, ou use a carta oficial.",
    artRole: "O artwork da Lendária é para Creators e Staff.",
    artUnavailable: "O artwork do deck ainda não pode ser salvo: tente de novo em alguns minutos, ou publique com a carta oficial.",
  },
  deck: {
    caption: "Artwork do Creator",
    alt: "{legendary}: artwork do deck de {author}",
  },
};

const de: DeckArtLabels = {
  form: {
    title: "Artwork der Legendären",
    roles: "Creator und Staff",
    hint: "Ersetze die Illustration von {legendary} in diesem Deck durch deine eigene: auf der Deckseite, in den Decklisten, in deinem Profil und in den Tier-Lists. Kartenformat 5:7, mindestens {minw} × {minh} px (ideal sind {w} × {h}), PNG, JPG oder WebP bis 2 MB: Wir schneiden es mittig auf 5:7 zu. Nur Bilder, die dir gehören oder die du verwenden darfst. Die offizielle Karte bleibt auf ihrer eigenen Seite und in der Vorschau.",
    upload: "Artwork hochladen",
    replace: "Artwork ändern",
    uploading: "Wird hochgeladen …",
    remove: "Offizielle Karte verwenden",
    official: "Offizielle Karte",
    custom: "Dein Artwork",
    notOwner: "Nur wer das Deck veröffentlicht hat, kann ein Artwork hochladen; hier kannst du es entfernen.",
    noRole: "Das Artwork der Legendären ist für Creator und Staff: Hier kannst du es nur entfernen.",
    errors: {
      type: "Diese Datei ist kein PNG-, JPG- oder WebP-Bild.",
      tooBig: "Das Bild ist auch nach der Komprimierung zu groß: Versuch es mit einem kleineren.",
      upload: "Der Upload hat nicht geklappt: Prüfe deine Verbindung und versuch es noch einmal.",
      limit: "Du hast die Höchstzahl hochgeladener Bilder erreicht: Entferne die, die du nicht mehr brauchst, oder schreib dem Staff.",
    },
  },
  errors: {
    artFile: "Das Artwork wurde nicht gefunden oder kann nicht verwendet werden: Lade es erneut hoch oder verwende die offizielle Karte.",
    artRole: "Das Artwork der Legendären ist für Creator und Staff.",
    artUnavailable: "Das Artwork des Decks kann noch nicht gespeichert werden: Versuch es in ein paar Minuten noch einmal oder veröffentliche mit der offiziellen Karte.",
  },
  deck: {
    caption: "Artwork des Creators",
    alt: "{legendary}: Artwork des Decks von {author}",
  },
};

const ru: DeckArtLabels = {
  form: {
    title: "Арт Легендарной карты",
    roles: "Creator и Staff",
    hint: "Замените иллюстрацию карты {legendary} в этой колоде своей: на странице колоды, в списках колод, в вашем профиле и в тир-листах. Формат карты 5:7, не меньше {minw} × {minh} px (идеально {w} × {h}), PNG, JPG или WebP до 2 МБ: мы обрежем изображение до 5:7 по центру. Только ваши изображения или те, которые вы вправе использовать. Официальная карта остаётся на своей странице и в превью.",
    upload: "Загрузить арт",
    replace: "Заменить арт",
    uploading: "Загружаем…",
    remove: "Использовать официальную карту",
    official: "Официальная карта",
    custom: "Ваш арт",
    notOwner: "Загрузить арт может только тот, кто опубликовал колоду; здесь вы можете его убрать.",
    noRole: "Арт Легендарной карты доступен ролям Creator и Staff: здесь его можно только убрать.",
    errors: {
      type: "Этот файл не является изображением PNG, JPG или WebP.",
      tooBig: "Изображение слишком тяжёлое даже после сжатия: попробуйте поменьше.",
      upload: "Загрузка не прошла: проверьте соединение и попробуйте ещё раз.",
      limit: "Вы достигли лимита загруженных изображений: удалите те, что больше не используете, или напишите команде Staff.",
    },
  },
  errors: {
    artFile: "Арт не найден или его нельзя использовать: загрузите его заново или используйте официальную карту.",
    artRole: "Арт Легендарной карты доступен ролям Creator и Staff.",
    artUnavailable: "Арт колоды пока нельзя сохранить: попробуйте через несколько минут или опубликуйте с официальной картой.",
  },
  deck: {
    caption: "Арт от Creator",
    alt: "{legendary}: арт колоды, автор {author}",
  },
};

export const deckArtLabels: Record<Locale, DeckArtLabels> = { en, it, es, fr, pt, de, ru };

/** Le etichette del modulo nella lingua della pagina, con gli errori delle Server Action. */
export function deckArtFormLabels(locale: Locale): DeckArtFormLabels {
  const L = deckArtLabels[locale];
  return { ...L.form, actionErrors: L.errors };
}
