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

export const deckArtLabels: Record<Locale, DeckArtLabels> = { en, it, es };

/** Le etichette del modulo nella lingua della pagina, con gli errori delle Server Action. */
export function deckArtFormLabels(locale: Locale): DeckArtFormLabels {
  const L = deckArtLabels[locale];
  return { ...L.form, actionErrors: L.errors };
}
