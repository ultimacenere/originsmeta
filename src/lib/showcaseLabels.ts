import type { Locale } from "./i18n";
import type { Accent, CoverPreset } from "./community/showcase";

/**
 * Etichette della vetrina dei profili (pacchetto VETRINA, 27/09/2026): foto profilo e "Personalizza la vetrina" in
 * /account, copertina, Leggendaria del cuore, mazzo e video in evidenza e orari delle dirette su /u, paragrafo della
 * privacy (#profile-media). Stesso schema di creatorLabels.ts: l'inglese è il tipo di riferimento, italiano e spagnolo
 * si scrivono insieme; spagnolo neutro con il tú (docs/spagnolo.md: "Legendaria", "mazo", "en directo" come nel
 * badge LIVE), tasti all'infinito come nel resto di /account ("Guardar el perfil", "Añadir un canal"). Il file importa
 * solo tipi: si può passare ai componenti del browser. Il credito della Leggendaria del cuore usa la formula delle schede
 * carta (`cardLabels[locale].creditText` in cardPage.ts).
 *
 * I nomi dei ruoli nei testi (Creator, Autore/Author/Autor, Pro, Staff) sono quelli di `community.badges` dei
 * dizionari: il test showcase.test.ts lo controlla. Segnaposto fra graffe: {max}, {min}, {tz}, {size}, {seconds}.
 */

export type AvatarLabels = {
  title: string;
  intro: string;
  /** da dove viene la foto di adesso */
  fromSite: string;
  fromDiscord: string;
  none: string;
  upload: string;
  uploading: string;
  remove: string;
  hint: string;
  /** testo del link al paragrafo della privacy (#profile-media) */
  privacyLink: string;
  saved: string;
  removed: string;
  /** colonne non ancora nel database (prima della migrazione) */
  missing: string;
  readError: string;
  errors: {
    type: string;
    tooBig: string;
    upload: string;
    limit: string;
    db: string;
    tooFast: string;
    notLoggedIn: string;
    disabled: string;
    missing: string;
    invalid: string;
  };
};

export type ShowcaseEditorLabels = {
  title: string;
  intro: string;
  /** la riga per chi non ha un ruolo con vetrina, seguita dal link alla casella messaggi (`askRole`) */
  notForRole: string;
  askRole: string;
  /** chi ha perso il ruolo e ha ancora dati della vetrina nella riga */
  clearIntro: string;
  clear: string;
  clearing: string;
  cleared: string;
  clearError: string;
  missing: string;
  readError: string;
  cover: string;
  coverHint: string;
  coverImage: string;
  coverUpload: string;
  coverUploading: string;
  coverImageHint: string;
  /** sfondo della pagina del profilo (27/09/2026) */
  background: string;
  backgroundHint: string;
  backgroundNone: string;
  backgroundImageHint: string;
  privacyLink: string;
  accent: string;
  accentHint: string;
  tagline: string;
  taglineHint: string;
  taglinePlaceholder: string;
  legendary: string;
  legendaryNone: string;
  legendaryHint: string;
  deck: string;
  deckNone: string;
  deckHint: string;
  noDecks: string;
  video: string;
  videoHint: string;
  videoPlaceholder: string;
  schedule: string;
  scheduleHint: string;
  day: string;
  time: string;
  duration: string;
  durationHint: string;
  addSlot: string;
  removeSlot: string;
  timezone: string;
  timezoneHint: string;
  save: string;
  saving: string;
  saved: string;
  viewPage: string;
  errors: {
    cover: string;
    coverImage: string;
    background: string;
    backgroundImage: string;
    accent: string;
    tagline: string;
    legendary: string;
    deck: string;
    video: string;
    timezone: string;
    timezoneRequired: string;
    scheduleDay: string;
    scheduleTime: string;
    scheduleDuration: string;
    scheduleTooMany: string;
    notLoggedIn: string;
    disabled: string;
    db: string;
    tooFast: string;
    missing: string;
    notAllowed: string;
    invalid: string;
    type: string;
    tooBig: string;
    upload: string;
    limit: string;
  };
};

export type ShowcaseViewLabels = {
  favorite: string;
  featuredDeck: string;
  featuredVideo: string;
  schedule: string;
  /** dopo il montaggio: orari nel fuso di chi guarda */
  inYourTz: string;
  /** prima del montaggio (HTML statico): orari nel fuso del creator */
  creatorTz: string;
  /** diretta in corso secondo gli orari (lo stato LIVE vero resta il badge accanto alla bio) */
  onNow: string;
};

export type ShowcaseLabels = {
  avatar: AvatarLabels;
  editor: ShowcaseEditorLabels;
  view: ShowcaseViewLabels;
  presets: Record<CoverPreset, string>;
  accents: Record<Accent, string>;
  /** paragrafo della pagina privacy (#profile-media) */
  privacy: string;
};

const en: ShowcaseLabels = {
  avatar: {
    title: "Profile photo",
    intro: "Your photo on your public page, next to your name on your decks and in the menu at the top. If you sign in with the email link, you'll see your initial until you upload a photo.",
    fromSite: "Now: the photo you uploaded.",
    fromDiscord: "Now: your Discord photo.",
    none: "Now: your initial.",
    upload: "Upload a photo",
    uploading: "Uploading…",
    remove: "Remove the photo",
    hint: "Square, at least {size}×{size} px; PNG, JPEG or WebP up to 1 MB. Your browser crops it square and shrinks it to {size} px before uploading it (removing data such as the location).",
    privacyLink: "Privacy",
    saved: "Photo saved.",
    removed: "Photo removed: you have the Discord photo or your initial back.",
    missing: "Uploading a profile photo is coming soon: it will be available after the next site update.",
    readError: "We can't read your profile right now. Reload the page in a moment.",
    errors: {
      type: "Choose a PNG, JPEG or WebP image.",
      tooBig: "The image is still over 1 MB after shrinking it: try another one.",
      upload: "The upload didn't work. Try again in a moment.",
      limit: "The site didn't accept the image. Reload the page and try again; if it keeps happening, write to the staff.",
      db: "We couldn't save the photo. Try again in a moment.",
      tooFast: "You changed it a moment ago: try again in {seconds} s.",
      notLoggedIn: "Sign in to change your photo.",
      disabled: "Accounts are switched off right now.",
      missing: "Uploading a profile photo is coming soon.",
      invalid: "This file can't be used as a profile photo.",
    },
  },
  editor: {
    title: "Customize your showcase",
    intro: "Your public page becomes a showcase: cover, accent color, a line under your name, favorite Legendary, featured deck and video, stream schedule.",
    notForRole: "Customizing the showcase is for the Creator, Author, Pro and Staff roles. Do you make Origins TCG content?",
    askRole: "Write to the staff to ask for a role.",
    clearIntro: "Your showcase settings (cover, tagline, schedule…) are still saved, even though your role no longer shows them. You can remove them.",
    clear: "Remove the showcase data",
    clearing: "Removing…",
    cleared: "Showcase data removed.",
    clearError: "We couldn't remove the data. Try again in a moment.",
    missing: "The showcase is coming soon: it will be available after the next site update.",
    readError: "We can't read your showcase right now. Reload the page in a moment.",
    cover: "Cover",
    coverHint: "One of our backgrounds or your own image. Wide images work best: the page crops them to fit the top of your profile.",
    coverImage: "Your image",
    coverUpload: "Upload an image",
    coverUploading: "Uploading…",
    coverImageHint: "Recommended size {w}×{h} px (3:1, wide); PNG, JPEG or WebP up to 2 MB, shrunk in your browser to {size} px. Use your own image, or one you have the rights to.",
    background: "Background",
    backgroundHint: "The background of your whole profile page, behind everything and still while visitors scroll. None (the site's background), one of ours, or your own image: a dark veil keeps the text readable.",
    backgroundNone: "None",
    backgroundImageHint: "Recommended size {w}×{h} px or larger (16:9, landscape); PNG, JPEG or WebP up to 2 MB, shrunk in your browser to {size} px on the long side, never cropped. Use your own image, or one you have the rights to.",
    privacyLink: "Privacy",
    accent: "Accent color",
    accentHint: "For the frames and your name on the showcase.",
    tagline: "Tagline",
    taglineHint: "A line under your name, plain text, up to {max} characters.",
    taglinePlaceholder: "Midrange lover, streaming ranked every evening",
    legendary: "Favorite Legendary",
    legendaryNone: "None",
    legendaryHint: "Shown next to your name with the official card and its artist credit.",
    deck: "Featured deck",
    deckNone: "None",
    deckHint: "One of your published decks, at the top of the showcase.",
    noDecks: "Publish a deck to feature it here.",
    video: "Featured video",
    videoHint: "A YouTube video or Short, or a Twitch VOD or clip. It only loads when a visitor clicks play.",
    videoPlaceholder: "https://www.youtube.com/watch?v=…",
    schedule: "Stream schedule",
    scheduleHint: "Up to 7 time slots a week, in your time zone: every visitor sees them in theirs.",
    day: "Day",
    time: "Time",
    duration: "Minutes",
    durationHint: "optional, {min}-{max}",
    addSlot: "Add a time slot",
    removeSlot: "Remove",
    timezone: "Your time zone",
    timezoneHint: "The time zone of the times above. It's saved only with a schedule.",
    save: "Save the showcase",
    saving: "Saving…",
    saved: "Showcase saved.",
    viewPage: "See your page",
    errors: {
      cover: "Choose one of the backgrounds.",
      coverImage: "Upload the image again, or choose one of the backgrounds.",
      background: "Choose one of the backgrounds, or none.",
      backgroundImage: "Upload the image again, or choose one of the backgrounds.",
      accent: "Choose one of the colors.",
      tagline: "The tagline is too long.",
      legendary: "Choose a Legendary from the list.",
      deck: "Choose one of your published decks.",
      video: "Paste the link of a YouTube video or Short, or of a Twitch VOD or clip.",
      timezone: "Choose your time zone from the list.",
      timezoneRequired: "Choose your time zone for the schedule.",
      scheduleDay: "Choose the day.",
      scheduleTime: "Write the time as HH:MM.",
      scheduleDuration: "Minutes between {min} and {max}, or leave it empty.",
      scheduleTooMany: "Up to {max} time slots.",
      notLoggedIn: "Sign in to customize your showcase.",
      disabled: "Accounts are switched off right now.",
      db: "We couldn't save the showcase. Try again in a moment.",
      tooFast: "You saved a moment ago: try again in {seconds} s.",
      missing: "The showcase is coming soon.",
      notAllowed: "The showcase is for the Creator, Author, Pro and Staff roles.",
      invalid: "Check the fields marked in red.",
      type: "Choose a PNG, JPEG or WebP image.",
      tooBig: "The image is still over 2 MB after shrinking it: try another one.",
      upload: "The upload didn't work. Try again in a moment.",
      limit: "The site didn't accept the image. Reload the page and try again; if it keeps happening, write to the staff.",
    },
  },
  view: {
    favorite: "Favorite Legendary",
    featuredDeck: "Featured deck",
    featuredVideo: "Featured video",
    schedule: "Stream schedule",
    inYourTz: "In your time zone ({tz})",
    creatorTz: "{tz} time",
    onNow: "scheduled now",
  },
  presets: {
    aurora: "Aurora",
    "mint-tide": "Mint tide",
    "sky-crystal": "Sky crystal",
    "gold-stars": "Gold stars",
    "crimson-rays": "Magenta rays",
    "violet-nebula": "Violet nebula",
    "night-grid": "Night grid",
    sunset: "Sunset",
  },
  accents: {
    sky: "Sky (default)",
    mint: "Mint",
    gold: "Gold",
    crimson: "Magenta",
    violet: "Violet",
    coral: "Coral",
    green: "Green",
    peach: "Peach",
  },
  privacy:
    "Photos and showcase. If you upload a profile photo (any member) or a cover (Creator, Author, Pro and Staff roles), your browser crops and shrinks it and re-encodes it, which removes data such as the location, and then stores it in our Supabase storage, in a folder of your account: it is public and appears on your /u page, next to your name on your decks and tournaments and in the site menu. When you replace or remove it the site deletes the old file; copies already downloaded may stay in caches for up to an hour. The same goes for the cover you upload for a community guide (roles that publish guides) and for the Legendary artwork of one of your decks (Creator and Staff): they are public on the guide and on the deck, in the lists and when the link is shared, and the site deletes the file when you replace it or delete the guide or the deck. The staff can remove a photo, cover, artwork or tagline that breaks the site rules. The showcase settings (cover, accent color, tagline, favorite Legendary, featured deck and video, stream schedule with your time zone, which is saved only together with a schedule) are public on your /u page; each visitor sees the schedule in their own time zone, computed in their browser. You can change or remove everything from My profile › Edit my public page at any time, even if you no longer have the role.",
};

const it: ShowcaseLabels = {
  avatar: {
    title: "Foto profilo",
    intro: "La tua foto sulla pagina pubblica, accanto al tuo nome nei mazzi e nel menu in alto. Se entri con il link via email, vedi la tua iniziale finché non carichi una foto.",
    fromSite: "Adesso: la foto che hai caricato.",
    fromDiscord: "Adesso: la foto di Discord.",
    none: "Adesso: la tua iniziale.",
    upload: "Carica una foto",
    uploading: "Caricamento…",
    remove: "Togli la foto",
    hint: "Quadrata, almeno {size}×{size} px; PNG, JPEG o WebP fino a 1 MB. Il browser la ritaglia quadrata e la riduce a {size} px prima di caricarla (togliendo dati come la posizione).",
    privacyLink: "Privacy",
    saved: "Foto salvata.",
    removed: "Foto tolta: torna quella di Discord, o la tua iniziale.",
    missing: "La foto profilo caricata dal sito arriva presto: sarà disponibile dopo il prossimo aggiornamento del sito.",
    readError: "Non riusciamo a leggere il tuo profilo in questo momento. Ricarica la pagina fra poco.",
    errors: {
      type: "Scegli un'immagine PNG, JPEG o WebP.",
      tooBig: "Anche ridotta, l'immagine supera 1 MB: provane un'altra.",
      upload: "Il caricamento non è riuscito. Riprova fra poco.",
      limit: "Il sito non ha accettato l'immagine. Ricarica la pagina e riprova; se succede ancora, scrivi allo staff.",
      db: "Non siamo riusciti a salvare la foto. Riprova fra poco.",
      tooFast: "L'hai appena cambiata: riprova fra {seconds} s.",
      notLoggedIn: "Accedi per cambiare la tua foto.",
      disabled: "Gli account sono spenti in questo momento.",
      missing: "La foto profilo caricata dal sito arriva presto.",
      invalid: "Questo file non si può usare come foto profilo.",
    },
  },
  editor: {
    title: "Personalizza la vetrina",
    intro: "La tua pagina pubblica diventa una vetrina: copertina, colore d'accento, una frase sotto il nome, Leggendaria del cuore, mazzo e video in evidenza, orari delle dirette.",
    notForRole: "La personalizzazione della vetrina è per i ruoli Creator, Autore, Pro e Staff. Fai contenuti su Origins TCG?",
    askRole: "Scrivi allo staff per chiedere un ruolo.",
    clearIntro: "Le impostazioni della tua vetrina (copertina, frase, orari…) sono ancora salvate, anche se il tuo ruolo non le mostra più. Puoi toglierle.",
    clear: "Togli i dati della vetrina",
    clearing: "Rimozione…",
    cleared: "Dati della vetrina tolti.",
    clearError: "Non siamo riusciti a togliere i dati. Riprova fra poco.",
    missing: "La vetrina arriva presto: sarà disponibile dopo il prossimo aggiornamento del sito.",
    readError: "Non riusciamo a leggere la tua vetrina in questo momento. Ricarica la pagina fra poco.",
    cover: "Copertina",
    coverHint: "Uno dei nostri sfondi o un'immagine tua. Meglio un'immagine larga: la pagina la ritaglia per la testa del profilo.",
    coverImage: "La tua immagine",
    coverUpload: "Carica un'immagine",
    coverUploading: "Caricamento…",
    coverImageHint: "Misura consigliata {w}×{h} px (3:1, larga); PNG, JPEG o WebP fino a 2 MB, ridotta dal browser a {size} px. Usa un'immagine tua o di cui hai i diritti.",
    background: "Sfondo",
    backgroundHint: "Lo sfondo di tutta la pagina del tuo profilo, dietro a tutto e fermo mentre chi guarda scorre. Nessuno (lo sfondo del sito), uno dei nostri o un'immagine tua: una velatura scura tiene leggibili i testi.",
    backgroundNone: "Nessuno",
    backgroundImageHint: "Misura consigliata {w}×{h} px o più grande (16:9, orizzontale); PNG, JPEG o WebP fino a 2 MB, ridotta dal browser a {size} px sul lato lungo, mai ritagliata. Usa un'immagine tua o di cui hai i diritti.",
    privacyLink: "Privacy",
    accent: "Colore d'accento",
    accentHint: "Per le cornici e il tuo nome nella vetrina.",
    tagline: "Frase di presentazione",
    taglineHint: "Una riga sotto il tuo nome, testo semplice, fino a {max} caratteri.",
    taglinePlaceholder: "Amo il midrange, in diretta con la classificata ogni sera",
    legendary: "Leggendaria del cuore",
    legendaryNone: "Nessuna",
    legendaryHint: "Accanto al tuo nome, con la carta ufficiale e il credito dell'illustratore.",
    deck: "Mazzo in evidenza",
    deckNone: "Nessuno",
    deckHint: "Uno dei tuoi mazzi pubblicati, in cima alla vetrina.",
    noDecks: "Pubblica un mazzo per metterlo in evidenza qui.",
    video: "Video in evidenza",
    videoHint: "Un video o uno Short di YouTube, o un VOD o una clip di Twitch. Si carica solo quando chi guarda preme play.",
    videoPlaceholder: "https://www.youtube.com/watch?v=…",
    schedule: "Orari delle dirette",
    scheduleHint: "Fino a 7 orari alla settimana, nel tuo fuso: chi guarda li vede nel suo.",
    day: "Giorno",
    time: "Ora",
    duration: "Minuti",
    durationHint: "facoltativo, {min}-{max}",
    addSlot: "Aggiungi un orario",
    removeSlot: "Togli",
    timezone: "Il tuo fuso orario",
    timezoneHint: "Quello degli orari che scrivi qui sopra. Si salva solo insieme agli orari.",
    save: "Salva la vetrina",
    saving: "Salvataggio…",
    saved: "Vetrina salvata.",
    viewPage: "Vedi la tua pagina",
    errors: {
      cover: "Scegli uno degli sfondi.",
      coverImage: "Carica di nuovo l'immagine, o scegli uno degli sfondi.",
      background: "Scegli uno degli sfondi, o nessuno.",
      backgroundImage: "Carica di nuovo l'immagine, o scegli uno degli sfondi.",
      accent: "Scegli uno dei colori.",
      tagline: "La frase è troppo lunga.",
      legendary: "Scegli una Leggendaria dall'elenco.",
      deck: "Scegli uno dei tuoi mazzi pubblicati.",
      video: "Incolla il link di un video o di uno Short di YouTube, o di un VOD o di una clip di Twitch.",
      timezone: "Scegli il tuo fuso orario dall'elenco.",
      timezoneRequired: "Scegli il tuo fuso orario per gli orari.",
      scheduleDay: "Scegli il giorno.",
      scheduleTime: "Scrivi l'ora come HH:MM.",
      scheduleDuration: "Minuti fra {min} e {max}, oppure lascia vuoto.",
      scheduleTooMany: "Al massimo {max} orari.",
      notLoggedIn: "Accedi per personalizzare la vetrina.",
      disabled: "Gli account sono spenti in questo momento.",
      db: "Non siamo riusciti a salvare la vetrina. Riprova fra poco.",
      tooFast: "Hai appena salvato: riprova fra {seconds} s.",
      missing: "La vetrina arriva presto.",
      notAllowed: "La vetrina è per i ruoli Creator, Autore, Pro e Staff.",
      invalid: "Controlla i campi segnati in rosso.",
      type: "Scegli un'immagine PNG, JPEG o WebP.",
      tooBig: "Anche ridotta, l'immagine supera 2 MB: provane un'altra.",
      upload: "Il caricamento non è riuscito. Riprova fra poco.",
      limit: "Il sito non ha accettato l'immagine. Ricarica la pagina e riprova; se succede ancora, scrivi allo staff.",
    },
  },
  view: {
    favorite: "Leggendaria del cuore",
    featuredDeck: "Mazzo in evidenza",
    featuredVideo: "Video in evidenza",
    schedule: "Orari delle dirette",
    inYourTz: "Nel tuo fuso orario ({tz})",
    creatorTz: "Ora di {tz}",
    onNow: "in programma ora",
  },
  presets: {
    aurora: "Aurora",
    "mint-tide": "Marea menta",
    "sky-crystal": "Cristallo celeste",
    "gold-stars": "Stelle d'oro",
    "crimson-rays": "Raggi magenta",
    "violet-nebula": "Nebulosa viola",
    "night-grid": "Griglia notturna",
    sunset: "Tramonto",
  },
  accents: {
    sky: "Celeste (predefinito)",
    mint: "Menta",
    gold: "Oro",
    crimson: "Magenta",
    violet: "Viola",
    coral: "Corallo",
    green: "Verde",
    peach: "Pesca",
  },
  privacy:
    "Foto e vetrina. Se carichi una foto profilo (ogni iscritto) o una copertina (ruoli Creator, Autore, Pro e Staff), il tuo browser la ritaglia, la riduce e la ricodifica, togliendo dati come la posizione, e poi la salva nello spazio Supabase del sito, in una cartella del tuo account: è pubblica e compare sulla tua pagina /u, accanto al tuo nome nei mazzi e nei tornei e nel menu del sito. Quando la sostituisci o la togli, il sito cancella il file vecchio; le copie già scaricate possono restare nelle cache fino a un'ora. Lo stesso vale per la copertina che carichi per una guida della community (ruoli che pubblicano guide) e per l'artwork della Leggendaria di un tuo mazzo (Creator e Staff): sono pubblici sulla guida e sul mazzo, negli elenchi e quando si condivide il link, e il sito cancella il file quando lo sostituisci o elimini la guida o il mazzo. Lo staff può togliere una foto, una copertina, un artwork o una frase che non rispetta le regole del sito. Le impostazioni della vetrina (copertina, colore d'accento, frase di presentazione, Leggendaria del cuore, mazzo e video in evidenza, orari delle dirette con il tuo fuso orario, che si salva solo insieme agli orari) sono pubbliche sulla tua pagina /u; ogni visitatore vede gli orari nel suo fuso, calcolato nel suo browser. Puoi cambiare o togliere tutto da Il mio profilo › Modifica la mia pagina pubblica quando vuoi, anche se non hai più il ruolo.",
};

const es: ShowcaseLabels = {
  avatar: {
    title: "Foto de perfil",
    intro: "Tu foto en tu página pública, junto a tu nombre en tus mazos y en el menú de arriba. Si entras con el enlace por correo, verás tu inicial hasta que subas una foto.",
    fromSite: "Ahora: la foto que subiste.",
    fromDiscord: "Ahora: tu foto de Discord.",
    none: "Ahora: tu inicial.",
    upload: "Subir una foto",
    uploading: "Subiendo…",
    remove: "Quitar la foto",
    hint: "Cuadrada, de al menos {size}×{size} px; PNG, JPEG o WebP de hasta 1 MB. Tu navegador la recorta cuadrada y la reduce a {size} px antes de subirla (quitando datos como la ubicación).",
    privacyLink: "Privacidad",
    saved: "Foto guardada.",
    removed: "Foto quitada: vuelves a tener la foto de Discord o tu inicial.",
    missing: "Subir una foto de perfil desde el sitio llega pronto: estará disponible después de la próxima actualización del sitio.",
    readError: "No podemos leer tu perfil en este momento. Vuelve a cargar la página en un rato.",
    errors: {
      type: "Elige una imagen PNG, JPEG o WebP.",
      tooBig: "Incluso reducida, la imagen pasa de 1 MB: prueba con otra.",
      upload: "No se pudo subir. Vuelve a intentarlo en un rato.",
      limit: "El sitio no aceptó la imagen. Vuelve a cargar la página e inténtalo otra vez; si sigue pasando, escribe al staff.",
      db: "No pudimos guardar la foto. Vuelve a intentarlo en un rato.",
      tooFast: "La acabas de cambiar: vuelve a intentarlo en {seconds} s.",
      notLoggedIn: "Inicia sesión para cambiar tu foto.",
      disabled: "Las cuentas están desactivadas en este momento.",
      missing: "Subir una foto de perfil desde el sitio llega pronto.",
      invalid: "Este archivo no se puede usar como foto de perfil.",
    },
  },
  editor: {
    title: "Personaliza tu vitrina",
    intro: "Tu página pública se convierte en una vitrina: portada, color de acento, una frase bajo tu nombre, Legendaria favorita, mazo y video destacados, horarios de tus directos.",
    notForRole: "Personalizar la vitrina es para los roles Creator, Autor, Pro y Staff. ¿Haces contenido sobre Origins TCG?",
    askRole: "Escribe al staff para pedir un rol.",
    clearIntro: "Los ajustes de tu vitrina (portada, frase, horarios…) siguen guardados, aunque tu rol ya no los muestra. Puedes quitarlos.",
    clear: "Quitar los datos de la vitrina",
    clearing: "Quitando…",
    cleared: "Datos de la vitrina quitados.",
    clearError: "No pudimos quitar los datos. Vuelve a intentarlo en un rato.",
    missing: "La vitrina llega pronto: estará disponible después de la próxima actualización del sitio.",
    readError: "No podemos leer tu vitrina en este momento. Vuelve a cargar la página en un rato.",
    cover: "Portada",
    coverHint: "Uno de nuestros fondos o una imagen tuya. Mejor una imagen ancha: la página la recorta para la parte de arriba de tu perfil.",
    coverImage: "Tu imagen",
    coverUpload: "Subir una imagen",
    coverUploading: "Subiendo…",
    coverImageHint: "Tamaño recomendado {w}×{h} px (3:1, ancha); PNG, JPEG o WebP de hasta 2 MB, reducida por tu navegador a {size} px. Usa una imagen tuya o de la que tengas los derechos.",
    background: "Fondo",
    backgroundHint: "El fondo de toda la página de tu perfil, detrás de todo y quieto mientras quien la visita se desplaza. Ninguno (el fondo del sitio), uno de los nuestros o una imagen tuya: un velo oscuro mantiene legibles los textos.",
    backgroundNone: "Ninguno",
    backgroundImageHint: "Tamaño recomendado {w}×{h} px o mayor (16:9, horizontal); PNG, JPEG o WebP de hasta 2 MB, reducida por tu navegador a {size} px en el lado largo, nunca recortada. Usa una imagen tuya o de la que tengas los derechos.",
    privacyLink: "Privacidad",
    accent: "Color de acento",
    accentHint: "Para los marcos y tu nombre en la vitrina.",
    tagline: "Frase de presentación",
    taglineHint: "Una línea bajo tu nombre, texto simple, hasta {max} caracteres.",
    taglinePlaceholder: "Fan del midrange, en directo con la clasificatoria cada noche",
    legendary: "Legendaria favorita",
    legendaryNone: "Ninguna",
    legendaryHint: "Junto a tu nombre, con la carta oficial y el crédito de quien la ilustró.",
    deck: "Mazo destacado",
    deckNone: "Ninguno",
    deckHint: "Uno de tus mazos publicados, arriba en la vitrina.",
    noDecks: "Publica un mazo para destacarlo aquí.",
    video: "Video destacado",
    videoHint: "Un video o un Short de YouTube, o un VOD o un clip de Twitch. Solo se carga cuando quien mira pulsa reproducir.",
    videoPlaceholder: "https://www.youtube.com/watch?v=…",
    schedule: "Horarios de los directos",
    scheduleHint: "Hasta 7 horarios a la semana, en tu zona horaria: quien mira los ve en la suya.",
    day: "Día",
    time: "Hora",
    duration: "Minutos",
    durationHint: "opcional, {min}-{max}",
    addSlot: "Añadir un horario",
    removeSlot: "Quitar",
    timezone: "Tu zona horaria",
    timezoneHint: "La de los horarios que escribes arriba. Solo se guarda junto con los horarios.",
    save: "Guardar la vitrina",
    saving: "Guardando…",
    saved: "Vitrina guardada.",
    viewPage: "Ver tu página",
    errors: {
      cover: "Elige uno de los fondos.",
      coverImage: "Vuelve a subir la imagen o elige uno de los fondos.",
      background: "Elige uno de los fondos, o ninguno.",
      backgroundImage: "Vuelve a subir la imagen o elige uno de los fondos.",
      accent: "Elige uno de los colores.",
      tagline: "La frase es demasiado larga.",
      legendary: "Elige una Legendaria de la lista.",
      deck: "Elige uno de tus mazos publicados.",
      video: "Pega el enlace de un video o un Short de YouTube, o de un VOD o un clip de Twitch.",
      timezone: "Elige tu zona horaria de la lista.",
      timezoneRequired: "Elige tu zona horaria para los horarios.",
      scheduleDay: "Elige el día.",
      scheduleTime: "Escribe la hora como HH:MM.",
      scheduleDuration: "Minutos entre {min} y {max}, o déjalo vacío.",
      scheduleTooMany: "Como máximo {max} horarios.",
      notLoggedIn: "Inicia sesión para personalizar tu vitrina.",
      disabled: "Las cuentas están desactivadas en este momento.",
      db: "No pudimos guardar la vitrina. Vuelve a intentarlo en un rato.",
      tooFast: "Acabas de guardar: vuelve a intentarlo en {seconds} s.",
      missing: "La vitrina llega pronto.",
      notAllowed: "La vitrina es para los roles Creator, Autor, Pro y Staff.",
      invalid: "Revisa los campos marcados en rojo.",
      type: "Elige una imagen PNG, JPEG o WebP.",
      tooBig: "Incluso reducida, la imagen pasa de 2 MB: prueba con otra.",
      upload: "No se pudo subir. Vuelve a intentarlo en un rato.",
      limit: "El sitio no aceptó la imagen. Vuelve a cargar la página e inténtalo otra vez; si sigue pasando, escribe al staff.",
    },
  },
  view: {
    favorite: "Legendaria favorita",
    featuredDeck: "Mazo destacado",
    featuredVideo: "Video destacado",
    schedule: "Horarios de los directos",
    inYourTz: "En tu zona horaria ({tz})",
    creatorTz: "Hora de {tz}",
    onNow: "programado ahora",
  },
  presets: {
    aurora: "Aurora",
    "mint-tide": "Marea menta",
    "sky-crystal": "Cristal celeste",
    "gold-stars": "Estrellas doradas",
    "crimson-rays": "Rayos magenta",
    "violet-nebula": "Nebulosa violeta",
    "night-grid": "Cuadrícula nocturna",
    sunset: "Atardecer",
  },
  accents: {
    sky: "Celeste (predeterminado)",
    mint: "Menta",
    gold: "Dorado",
    crimson: "Magenta",
    violet: "Violeta",
    coral: "Coral",
    green: "Verde",
    peach: "Salmón",
  },
  privacy:
    "Fotos y vitrina. Si subes una foto de perfil (cualquier miembro) o una portada (roles Creator, Autor, Pro y Staff), tu navegador la recorta, la reduce y la vuelve a codificar, quitando datos como la ubicación, y luego se guarda en el almacenamiento Supabase del sitio, en una carpeta de tu cuenta: es pública y aparece en tu página /u, junto a tu nombre en tus mazos y torneos y en el menú del sitio. Cuando la cambias o la quitas, el sitio borra el archivo anterior; las copias ya descargadas pueden quedar en caché hasta una hora. Lo mismo vale para la portada que subes para una guía de la comunidad (roles que publican guías) y para el arte de la Legendaria de uno de tus mazos (Creator y Staff): son públicos en la guía y en el mazo, en las listas y al compartir el enlace, y el sitio borra el archivo cuando lo cambias o eliminas la guía o el mazo. El staff puede quitar una foto, una portada, un arte o una frase que no respete las reglas del sitio. Los ajustes de la vitrina (portada, color de acento, frase de presentación, Legendaria favorita, mazo y video destacados, horarios de los directos con tu zona horaria, que solo se guarda junto con los horarios) son públicos en tu página /u; cada visitante ve los horarios en su zona horaria, calculada en su navegador. Puedes cambiar o quitar todo desde Mi perfil › Editar mi página pública cuando quieras, aunque ya no tengas el rol.",
};

/** Francese (07/10/2026, docs/francese.md): "vous", la vetrina è la "vitrine", "à la une" per "in evidenza"; spazio insecabile prima di : ; ? ! */
const fr: ShowcaseLabels = {
  avatar: {
    title: "Photo de profil",
    intro: "Votre photo sur votre page publique, à côté de votre nom sur vos decks et dans le menu en haut. Si vous vous connectez avec le lien par e-mail, vous verrez votre initiale jusqu'à ce que vous importiez une photo.",
    fromSite: "Actuellement : la photo que vous avez importée.",
    fromDiscord: "Actuellement : votre photo Discord.",
    none: "Actuellement : votre initiale.",
    upload: "Importer une photo",
    uploading: "Envoi en cours…",
    remove: "Retirer la photo",
    hint: "Carrée, au moins {size}×{size} px ; PNG, JPEG ou WebP jusqu'à 1 Mo. Votre navigateur la recadre au carré et la réduit à {size} px avant de l'envoyer (en retirant des données comme la position).",
    privacyLink: "Confidentialité",
    saved: "Photo enregistrée.",
    removed: "Photo retirée : vous retrouvez votre photo Discord ou votre initiale.",
    missing: "L'import d'une photo de profil arrive bientôt : il sera disponible après la prochaine mise à jour du site.",
    readError: "Nous ne pouvons pas lire votre profil pour le moment. Rechargez la page dans un instant.",
    errors: {
      type: "Choisissez une image PNG, JPEG ou WebP.",
      tooBig: "Même réduite, l'image dépasse 1 Mo : essayez-en une autre.",
      upload: "L'envoi a échoué. Réessayez dans un instant.",
      limit: "Le site n'a pas accepté l'image. Rechargez la page et réessayez ; si cela se reproduit, écrivez au staff.",
      db: "Nous n'avons pas pu enregistrer la photo. Réessayez dans un instant.",
      tooFast: "Vous venez de la changer : réessayez dans {seconds} s.",
      notLoggedIn: "Connectez-vous pour changer votre photo.",
      disabled: "Les comptes sont désactivés pour le moment.",
      missing: "L'import d'une photo de profil arrive bientôt.",
      invalid: "Ce fichier ne peut pas servir de photo de profil.",
    },
  },
  editor: {
    title: "Personnaliser votre vitrine",
    intro: "Votre page publique devient une vitrine : couverture, couleur d'accent, une phrase sous votre nom, Légendaire préférée, deck et vidéo à la une, horaires de stream.",
    notForRole: "La personnalisation de la vitrine est réservée aux rôles Creator, Auteur, Pro et Staff. Vous créez du contenu sur Origins TCG ?",
    askRole: "Écrivez au staff pour demander un rôle.",
    clearIntro: "Les réglages de votre vitrine (couverture, phrase, horaires…) sont toujours enregistrés, même si votre rôle ne les affiche plus. Vous pouvez les retirer.",
    clear: "Retirer les données de la vitrine",
    clearing: "Suppression…",
    cleared: "Données de la vitrine retirées.",
    clearError: "Nous n'avons pas pu retirer les données. Réessayez dans un instant.",
    missing: "La vitrine arrive bientôt : elle sera disponible après la prochaine mise à jour du site.",
    readError: "Nous ne pouvons pas lire votre vitrine pour le moment. Rechargez la page dans un instant.",
    cover: "Couverture",
    coverHint: "L'un de nos fonds ou votre propre image. Les images larges rendent mieux : la page les recadre pour le haut de votre profil.",
    coverImage: "Votre image",
    coverUpload: "Importer une image",
    coverUploading: "Envoi en cours…",
    coverImageHint: "Taille recommandée {w}×{h} px (3:1, au format large) ; PNG, JPEG ou WebP jusqu'à 2 Mo, réduite par votre navigateur à {size} px. Utilisez votre propre image, ou une image dont vous avez les droits.",
    background: "Arrière-plan",
    backgroundHint: "L'arrière-plan de toute votre page de profil, derrière tout le reste et fixe pendant que les visiteurs font défiler la page. Aucun (le fond du site), l'un des nôtres ou votre propre image : un voile sombre garde le texte lisible.",
    backgroundNone: "Aucun",
    backgroundImageHint: "Taille recommandée {w}×{h} px ou plus (16:9, paysage) ; PNG, JPEG ou WebP jusqu'à 2 Mo, réduite par votre navigateur à {size} px sur le grand côté, jamais recadrée. Utilisez votre propre image, ou une image dont vous avez les droits.",
    privacyLink: "Confidentialité",
    accent: "Couleur d'accent",
    accentHint: "Pour les cadres et votre nom sur la vitrine.",
    tagline: "Phrase de présentation",
    taglineHint: "Une ligne sous votre nom, en texte simple, jusqu'à {max} caractères.",
    taglinePlaceholder: "Fan de midrange, en direct en classé tous les soirs",
    legendary: "Légendaire préférée",
    legendaryNone: "Aucune",
    legendaryHint: "Affichée à côté de votre nom avec la carte officielle et le crédit de son illustrateur.",
    deck: "Deck à la une",
    deckNone: "Aucun",
    deckHint: "L'un de vos decks publiés, en haut de la vitrine.",
    noDecks: "Publiez un deck pour le mettre à la une ici.",
    video: "Vidéo à la une",
    videoHint: "Une vidéo ou un Short YouTube, ou une VOD ou un clip Twitch. Elle ne se charge que quand un visiteur clique sur lecture.",
    videoPlaceholder: "https://www.youtube.com/watch?v=…",
    schedule: "Horaires de stream",
    scheduleHint: "Jusqu'à 7 créneaux par semaine, dans votre fuseau horaire : chaque visiteur les voit dans le sien.",
    day: "Jour",
    time: "Heure",
    duration: "Minutes",
    durationHint: "facultatif, {min}-{max}",
    addSlot: "Ajouter un créneau",
    removeSlot: "Retirer",
    timezone: "Votre fuseau horaire",
    timezoneHint: "Celui des horaires ci-dessus. Il n'est enregistré qu'avec des horaires.",
    save: "Enregistrer la vitrine",
    saving: "Enregistrement…",
    saved: "Vitrine enregistrée.",
    viewPage: "Voir votre page",
    errors: {
      cover: "Choisissez l'un des fonds.",
      coverImage: "Importez l'image de nouveau, ou choisissez l'un des fonds.",
      background: "Choisissez l'un des fonds, ou aucun.",
      backgroundImage: "Importez l'image de nouveau, ou choisissez l'un des fonds.",
      accent: "Choisissez l'une des couleurs.",
      tagline: "La phrase est trop longue.",
      legendary: "Choisissez une Légendaire dans la liste.",
      deck: "Choisissez l'un de vos decks publiés.",
      video: "Collez le lien d'une vidéo ou d'un Short YouTube, ou d'une VOD ou d'un clip Twitch.",
      timezone: "Choisissez votre fuseau horaire dans la liste.",
      timezoneRequired: "Choisissez votre fuseau horaire pour les horaires.",
      scheduleDay: "Choisissez le jour.",
      scheduleTime: "Écrivez l'heure au format HH:MM.",
      scheduleDuration: "Minutes entre {min} et {max}, ou laissez vide.",
      scheduleTooMany: "Au plus {max} créneaux.",
      notLoggedIn: "Connectez-vous pour personnaliser votre vitrine.",
      disabled: "Les comptes sont désactivés pour le moment.",
      db: "Nous n'avons pas pu enregistrer la vitrine. Réessayez dans un instant.",
      tooFast: "Vous venez d'enregistrer : réessayez dans {seconds} s.",
      missing: "La vitrine arrive bientôt.",
      notAllowed: "La vitrine est réservée aux rôles Creator, Auteur, Pro et Staff.",
      invalid: "Vérifiez les champs marqués en rouge.",
      type: "Choisissez une image PNG, JPEG ou WebP.",
      tooBig: "Même réduite, l'image dépasse 2 Mo : essayez-en une autre.",
      upload: "L'envoi a échoué. Réessayez dans un instant.",
      limit: "Le site n'a pas accepté l'image. Rechargez la page et réessayez ; si cela se reproduit, écrivez au staff.",
    },
  },
  view: {
    favorite: "Légendaire préférée",
    featuredDeck: "Deck à la une",
    featuredVideo: "Vidéo à la une",
    schedule: "Horaires de stream",
    inYourTz: "Dans votre fuseau horaire ({tz})",
    creatorTz: "Heure de {tz}",
    onNow: "prévu en ce moment",
  },
  presets: {
    aurora: "Aurore",
    "mint-tide": "Marée menthe",
    "sky-crystal": "Cristal céleste",
    "gold-stars": "Étoiles d'or",
    "crimson-rays": "Rayons magenta",
    "violet-nebula": "Nébuleuse violette",
    "night-grid": "Grille nocturne",
    sunset: "Coucher de soleil",
  },
  accents: {
    sky: "Céleste (par défaut)",
    mint: "Menthe",
    gold: "Or",
    crimson: "Magenta",
    violet: "Violet",
    coral: "Corail",
    green: "Vert",
    peach: "Pêche",
  },
  privacy:
    "Photos et vitrine. Si vous importez une photo de profil (tout membre) ou une couverture (rôles Creator, Auteur, Pro et Staff), votre navigateur la recadre, la réduit et la réencode, ce qui retire des données comme la position, puis la stocke dans notre espace Supabase, dans un dossier de votre compte : elle est publique et apparaît sur votre page /u, à côté de votre nom sur vos decks et vos tournois et dans le menu du site. Quand vous la remplacez ou la retirez, le site supprime l'ancien fichier ; les copies déjà téléchargées peuvent rester dans les caches jusqu'à une heure. Il en va de même pour la couverture que vous importez pour un guide de la communauté (rôles qui publient des guides) et pour l'artwork de la Légendaire de l'un de vos decks (Creator et Staff) : ils sont publics sur le guide et sur le deck, dans les listes et quand le lien est partagé, et le site supprime le fichier quand vous le remplacez ou supprimez le guide ou le deck. Le staff peut retirer une photo, une couverture, un artwork ou une phrase qui ne respecte pas les règles du site. Les réglages de la vitrine (couverture, couleur d'accent, phrase de présentation, Légendaire préférée, deck et vidéo à la une, horaires de stream avec votre fuseau horaire, enregistré seulement avec des horaires) sont publics sur votre page /u ; chaque visiteur voit les horaires dans son propre fuseau, calculé dans son navigateur. Vous pouvez tout changer ou retirer depuis Mon profil › Modifier ma page publique à tout moment, même si vous n'avez plus le rôle.",
};

export const showcaseLabels: Record<Locale, ShowcaseLabels> = { en, it, es, fr };

/** Sostituisce i segnaposto {chiave}; i valori non passano da `replace` (niente `$&` interpretati). */
export function fillShowcase(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.hasOwn(values, key) ? String(values[key]) : match));
}
