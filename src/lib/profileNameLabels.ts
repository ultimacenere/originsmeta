import type { Locale } from "./i18n";

/**
 * Testi del cambio di nome mostrato e nome utente (sezione #name di /account/profile e paragrafo #profile-name
 * dell'informativa), nelle sette lingue (23/10/2026). L'inglese è il tipo di riferimento. Segnaposto: {min}, {max},
 * {days}, {date}, {url}; si riempiono con `fillName`. Regole e numeri in src/lib/community/profileNames.ts.
 * Francese con lo spazio insecabile (U+00A0) prima di : ; ? ! e dentro « » (docs/francese.md).
 */
export type ProfileNameLabels = {
  /** titolo della sezione e voce dei salti in cima alla pagina */
  section: string;
  intro: string;
  displayLabel: string;
  /** {min} {max} */
  displayHint: string;
  usernameLabel: string;
  /** {min} {max} {days} */
  usernameHint: string;
  /** l'indirizzo della pagina con il nome scritto: {url} */
  preview: string;
  redirectNote: string;
  /** {date} */
  nextChange: string;
  /** il nome utente è scritto nel codice del sito (dirette in home, autori della redazione) */
  locked: string;
  /** conferma prima di cambiare il nome utente: {days} */
  confirmUsername: string;
  save: string;
  saving: string;
  saved: string;
  /** {url} */
  savedUsername: string;
  /** prima della migrazione */
  missing: string;
  readError: string;
  errors: {
    notLoggedIn: string;
    disabled: string;
    db: string;
    display: { invalid: string; reserved: string; lookalike: string; too_fast: string };
    username: { invalid: string; reserved: string; taken: string; too_soon: string };
  };
  /** paragrafo #profile-name dell'informativa */
  privacy: string;
};

const en: ProfileNameLabels = {
  section: "Name and username",
  intro: "Your display name is what people read next to your decks, guides and comments. Your username is the address of your page and of your short link.",
  displayLabel: "Display name",
  displayHint: "{min} to {max} characters. You can change it whenever you like.",
  usernameLabel: "Username",
  usernameHint: "{min} to {max} characters: lowercase letters, digits and hyphens. You can change it once every {days} days.",
  preview: "Your page: {url}",
  redirectNote: "If you change it, links to the old address lead to your new page and the old name stays yours: nobody else can take it.",
  nextChange: "You can change your username again from {date}.",
  locked: "Your username is tied to a feature of the site: to change it, write to the staff.",
  confirmUsername: "Change your username? You can change it again in {days} days.",
  save: "Save name",
  saving: "Saving…",
  saved: "Name saved.",
  savedUsername: "Name saved. Your page is now {url}: the other pages of the site update within a few minutes.",
  missing: "Changing your name is not active yet: please come back soon.",
  readError: "We could not read your profile. Reload the page.",
  errors: {
    notLoggedIn: "Sign in to change your name.",
    disabled: "Accounts are not active right now.",
    db: "We could not save. Try again in a moment.",
    display: {
      invalid: "The display name must be {min} to {max} characters long, with no invisible characters.",
      reserved: "This name contains a word reserved for the staff, the site or the game.",
      lookalike: "This name is the same as the username of a creator or of the staff.",
      too_fast: "You have just changed your name: try again in a few seconds.",
    },
    username: {
      invalid: "Use {min} to {max} characters among lowercase letters, digits and hyphens; a hyphen cannot be at the start, at the end or next to another one.",
      reserved: "This username is reserved.",
      taken: "This username is already taken.",
      too_soon: "You changed your username recently: you can change it again from {date}.",
    },
  },
  privacy:
    "Name and username. You choose your display name and your username under \"Name and username\" (My profile › Edit my public page): they are public, on your page and next to what you publish. When you change your username we keep the old one linked to your account, so that old links lead to your new page and nobody else takes it; it is deleted with your account. We also store the date of the last change, for the limit of one new username every 30 days.",
};

const it: ProfileNameLabels = {
  section: "Nome e nome utente",
  intro: "Il nome mostrato è quello che si legge accanto ai tuoi mazzi, alle guide e ai commenti. Il nome utente è l'indirizzo della tua pagina e del link breve.",
  displayLabel: "Nome mostrato",
  displayHint: "Da {min} a {max} caratteri. Puoi cambiarlo quando vuoi.",
  usernameLabel: "Nome utente",
  usernameHint: "Da {min} a {max} caratteri: lettere minuscole, cifre e trattini. Puoi cambiarlo una volta ogni {days} giorni.",
  preview: "La tua pagina: {url}",
  redirectNote: "Se lo cambi, i link al vecchio indirizzo portano alla pagina nuova e il vecchio nome resta tuo: nessun altro può prenderlo.",
  nextChange: "Potrai cambiare di nuovo il nome utente dal {date}.",
  locked: "Il tuo nome utente è collegato a una funzione del sito: per cambiarlo scrivi allo staff.",
  confirmUsername: "Vuoi cambiare il nome utente? Potrai cambiarlo di nuovo fra {days} giorni.",
  save: "Salva il nome",
  saving: "Salvataggio…",
  saved: "Nome salvato.",
  savedUsername: "Nome salvato. La tua pagina ora è {url}: le altre pagine del sito si aggiornano entro qualche minuto.",
  missing: "Il cambio del nome non è ancora attivo: torna fra poco.",
  readError: "Non è stato possibile leggere il tuo profilo. Ricarica la pagina.",
  errors: {
    notLoggedIn: "Accedi per cambiare il nome.",
    disabled: "Gli account non sono attivi in questo momento.",
    db: "Non è stato possibile salvare. Riprova fra poco.",
    display: {
      invalid: "Il nome mostrato va da {min} a {max} caratteri, senza caratteri invisibili.",
      reserved: "Questo nome contiene una parola riservata allo staff, al sito o al gioco.",
      lookalike: "Questo nome è uguale al nome utente di un creator o dello staff.",
      too_fast: "Hai appena cambiato nome: riprova fra qualche secondo.",
    },
    username: {
      invalid: "Usa da {min} a {max} caratteri fra lettere minuscole, cifre e trattini; un trattino non può stare all'inizio, alla fine o accanto a un altro.",
      reserved: "Questo nome utente è riservato.",
      taken: "Questo nome utente è già preso.",
      too_soon: "Hai cambiato nome utente da poco: potrai cambiarlo di nuovo dal {date}.",
    },
  },
  privacy:
    "Nome e nome utente. Il nome mostrato e il nome utente li scegli tu in «Nome e nome utente» (Il mio profilo › Modifica la mia pagina pubblica) e sono pubblici: sulla tua pagina e accanto a quello che pubblichi. Quando cambi il nome utente conserviamo quello vecchio collegato al tuo account, perché i vecchi link portino alla pagina nuova e nessun altro lo prenda; si cancella con l'account. Salviamo anche la data dell'ultimo cambio, per il limite di un nome utente nuovo ogni 30 giorni.",
};

const es: ProfileNameLabels = {
  section: "Nombre y nombre de usuario",
  intro: "El nombre visible es el que se lee junto a tus mazos, guías y comentarios. El nombre de usuario es la dirección de tu página y de tu enlace corto.",
  displayLabel: "Nombre visible",
  displayHint: "De {min} a {max} caracteres. Puedes cambiarlo cuando quieras.",
  usernameLabel: "Nombre de usuario",
  usernameHint: "De {min} a {max} caracteres: letras minúsculas, cifras y guiones. Puedes cambiarlo una vez cada {days} días.",
  preview: "Tu página: {url}",
  redirectNote: "Si lo cambias, los enlaces a la dirección antigua llevan a tu página nueva y el nombre antiguo sigue siendo tuyo: nadie más puede usarlo.",
  nextChange: "Podrás cambiar de nuevo tu nombre de usuario a partir del {date}.",
  locked: "Tu nombre de usuario está ligado a una función del sitio: para cambiarlo, escribe al staff.",
  confirmUsername: "¿Quieres cambiar tu nombre de usuario? Podrás cambiarlo de nuevo dentro de {days} días.",
  save: "Guardar el nombre",
  saving: "Guardando…",
  saved: "Nombre guardado.",
  savedUsername: "Nombre guardado. Tu página ahora es {url}: las demás páginas del sitio se actualizan en unos minutos.",
  missing: "El cambio de nombre aún no está activo: vuelve pronto.",
  readError: "No hemos podido leer tu perfil. Vuelve a cargar la página.",
  errors: {
    notLoggedIn: "Inicia sesión para cambiar tu nombre.",
    disabled: "Las cuentas no están activas en este momento.",
    db: "No hemos podido guardar. Inténtalo de nuevo en un momento.",
    display: {
      invalid: "El nombre visible debe tener de {min} a {max} caracteres, sin caracteres invisibles.",
      reserved: "Este nombre contiene una palabra reservada al staff, al sitio o al juego.",
      lookalike: "Este nombre es igual al nombre de usuario de un creador o del staff.",
      too_fast: "Acabas de cambiar tu nombre: inténtalo de nuevo en unos segundos.",
    },
    username: {
      invalid: "Usa de {min} a {max} caracteres entre letras minúsculas, cifras y guiones; un guion no puede ir al principio, al final ni junto a otro.",
      reserved: "Este nombre de usuario está reservado.",
      taken: "Este nombre de usuario ya está en uso.",
      too_soon: "Has cambiado tu nombre de usuario hace poco: podrás cambiarlo de nuevo a partir del {date}.",
    },
  },
  privacy:
    "Nombre y nombre de usuario. El nombre visible y el nombre de usuario los eliges tú en «Nombre y nombre de usuario» (Mi perfil › Editar mi página pública) y son públicos: en tu página y junto a lo que publicas. Cuando cambias tu nombre de usuario guardamos el antiguo vinculado a tu cuenta, para que los enlaces antiguos lleven a tu página nueva y nadie más lo use; se borra con la cuenta. También guardamos la fecha del último cambio, por el límite de un nombre de usuario nuevo cada 30 días.",
};

const fr: ProfileNameLabels = {
  section: "Nom et nom d'utilisateur",
  intro: "Le nom affiché est celui que l'on lit à côté de vos decks, de vos guides et de vos commentaires. Le nom d'utilisateur est l'adresse de votre page et de votre lien court.",
  displayLabel: "Nom affiché",
  displayHint: "De {min} à {max} caractères. Vous pouvez le changer quand vous voulez.",
  usernameLabel: "Nom d'utilisateur",
  usernameHint: "De {min} à {max} caractères : lettres minuscules, chiffres et tirets. Vous pouvez le changer une fois tous les {days} jours.",
  preview: "Votre page : {url}",
  redirectNote: "Si vous le changez, les liens vers l'ancienne adresse mènent à votre nouvelle page et l'ancien nom reste à vous : personne d'autre ne peut le prendre.",
  nextChange: "Vous pourrez changer à nouveau votre nom d'utilisateur à partir du {date}.",
  locked: "Votre nom d'utilisateur est lié à une fonction du site : pour le changer, écrivez au staff.",
  confirmUsername: "Changer votre nom d'utilisateur ? Vous pourrez le changer à nouveau dans {days} jours.",
  save: "Enregistrer le nom",
  saving: "Enregistrement…",
  saved: "Nom enregistré.",
  savedUsername: "Nom enregistré. Votre page est maintenant {url} : les autres pages du site se mettent à jour en quelques minutes.",
  missing: "Le changement de nom n'est pas encore actif : revenez bientôt.",
  readError: "Nous n'avons pas pu lire votre profil. Rechargez la page.",
  errors: {
    notLoggedIn: "Connectez-vous pour changer votre nom.",
    disabled: "Les comptes ne sont pas actifs pour le moment.",
    db: "Nous n'avons pas pu enregistrer. Réessayez dans un instant.",
    display: {
      invalid: "Le nom affiché doit compter de {min} à {max} caractères, sans caractères invisibles.",
      reserved: "Ce nom contient un mot réservé au staff, au site ou au jeu.",
      lookalike: "Ce nom est identique au nom d'utilisateur d'un créateur ou du staff.",
      too_fast: "Vous venez de changer de nom : réessayez dans quelques secondes.",
    },
    username: {
      invalid: "Utilisez de {min} à {max} caractères parmi les lettres minuscules, les chiffres et les tirets ; un tiret ne peut être ni au début, ni à la fin, ni à côté d'un autre.",
      reserved: "Ce nom d'utilisateur est réservé.",
      taken: "Ce nom d'utilisateur est déjà pris.",
      too_soon: "Vous avez changé de nom d'utilisateur récemment : vous pourrez le changer à nouveau à partir du {date}.",
    },
  },
  privacy:
    "Nom et nom d'utilisateur. Vous choisissez le nom affiché et le nom d'utilisateur sous « Nom et nom d'utilisateur » (Mon profil › Modifier ma page publique) ; ils sont publics, sur votre page et à côté de ce que vous publiez. Quand vous changez de nom d'utilisateur, nous gardons l'ancien lié à votre compte, pour que les anciens liens mènent à votre nouvelle page et que personne d'autre ne le prenne ; il est supprimé avec le compte. Nous gardons aussi la date du dernier changement, pour la limite d'un nouveau nom d'utilisateur tous les 30 jours.",
};

const pt: ProfileNameLabels = {
  section: "Nome e nome de usuário",
  intro: "O nome de exibição é o que aparece ao lado dos seus decks, guias e comentários. O nome de usuário é o endereço da sua página e do seu link curto.",
  displayLabel: "Nome de exibição",
  displayHint: "De {min} a {max} caracteres. Você pode mudá-lo quando quiser.",
  usernameLabel: "Nome de usuário",
  usernameHint: "De {min} a {max} caracteres: letras minúsculas, números e hifens. Você pode mudá-lo uma vez a cada {days} dias.",
  preview: "Sua página: {url}",
  redirectNote: "Se você mudar, os links para o endereço antigo levam à sua nova página e o nome antigo continua sendo seu: ninguém mais pode usá-lo.",
  nextChange: "Você poderá mudar o nome de usuário de novo a partir de {date}.",
  locked: "Seu nome de usuário está ligado a uma função do site: para mudá-lo, escreva para o staff.",
  confirmUsername: "Mudar o nome de usuário? Você poderá mudá-lo de novo daqui a {days} dias.",
  save: "Salvar o nome",
  saving: "Salvando…",
  saved: "Nome salvo.",
  savedUsername: "Nome salvo. Sua página agora é {url}: as outras páginas do site se atualizam em alguns minutos.",
  missing: "A mudança de nome ainda não está ativa: volte em breve.",
  readError: "Não foi possível ler o seu perfil. Recarregue a página.",
  errors: {
    notLoggedIn: "Entre para mudar o seu nome.",
    disabled: "As contas não estão ativas no momento.",
    db: "Não foi possível salvar. Tente de novo em instantes.",
    display: {
      invalid: "O nome de exibição deve ter de {min} a {max} caracteres, sem caracteres invisíveis.",
      reserved: "Este nome contém uma palavra reservada ao staff, ao site ou ao jogo.",
      lookalike: "Este nome é igual ao nome de usuário de um criador ou do staff.",
      too_fast: "Você acabou de mudar de nome: tente de novo em alguns segundos.",
    },
    username: {
      invalid: "Use de {min} a {max} caracteres entre letras minúsculas, números e hifens; um hífen não pode ficar no início, no fim nem ao lado de outro.",
      reserved: "Este nome de usuário é reservado.",
      taken: "Este nome de usuário já está em uso.",
      too_soon: "Você mudou o nome de usuário há pouco: poderá mudá-lo de novo a partir de {date}.",
    },
  },
  privacy:
    "Nome e nome de usuário. Você escolhe o nome de exibição e o nome de usuário em “Nome e nome de usuário” (Meu perfil › Editar minha página pública) e eles são públicos: na sua página e ao lado do que você publica. Quando você muda o nome de usuário, guardamos o antigo ligado à sua conta, para que os links antigos levem à sua nova página e ninguém mais o use; ele é apagado com a conta. Também guardamos a data da última mudança, para o limite de um nome de usuário novo a cada 30 dias.",
};

const de: ProfileNameLabels = {
  section: "Name und Benutzername",
  intro: "Der Anzeigename steht neben deinen Decks, Guides und Kommentaren. Der Benutzername ist die Adresse deiner Seite und deines Kurzlinks.",
  displayLabel: "Anzeigename",
  displayHint: "{min} bis {max} Zeichen. Du kannst ihn jederzeit ändern.",
  usernameLabel: "Benutzername",
  usernameHint: "{min} bis {max} Zeichen: Kleinbuchstaben, Ziffern und Bindestriche. Du kannst ihn einmal alle {days} Tage ändern.",
  preview: "Deine Seite: {url}",
  redirectNote: "Wenn du ihn änderst, führen Links auf die alte Adresse zu deiner neuen Seite, und der alte Name bleibt deiner: Niemand sonst kann ihn nehmen.",
  nextChange: "Du kannst deinen Benutzernamen ab dem {date} wieder ändern.",
  locked: "Dein Benutzername ist mit einer Funktion der Seite verknüpft: Schreib dem Staff, um ihn zu ändern.",
  confirmUsername: "Benutzernamen ändern? Du kannst ihn erst in {days} Tagen wieder ändern.",
  save: "Namen speichern",
  saving: "Wird gespeichert…",
  saved: "Name gespeichert.",
  savedUsername: "Name gespeichert. Deine Seite ist jetzt {url}: Die anderen Seiten der Website aktualisieren sich in wenigen Minuten.",
  missing: "Die Namensänderung ist noch nicht aktiv: Schau bald wieder vorbei.",
  readError: "Wir konnten dein Profil nicht lesen. Lade die Seite neu.",
  errors: {
    notLoggedIn: "Melde dich an, um deinen Namen zu ändern.",
    disabled: "Konten sind gerade nicht aktiv.",
    db: "Speichern hat nicht geklappt. Versuch es gleich noch einmal.",
    display: {
      invalid: "Der Anzeigename muss {min} bis {max} Zeichen lang sein, ohne unsichtbare Zeichen.",
      reserved: "Dieser Name enthält ein Wort, das dem Staff, der Website oder dem Spiel vorbehalten ist.",
      lookalike: "Dieser Name ist gleich dem Benutzernamen eines Creators oder des Staffs.",
      too_fast: "Du hast deinen Namen gerade erst geändert: Versuch es in ein paar Sekunden noch einmal.",
    },
    username: {
      invalid: "Verwende {min} bis {max} Zeichen aus Kleinbuchstaben, Ziffern und Bindestrichen; ein Bindestrich darf nicht am Anfang, am Ende oder neben einem anderen stehen.",
      reserved: "Dieser Benutzername ist reserviert.",
      taken: "Dieser Benutzername ist schon vergeben.",
      too_soon: "Du hast deinen Benutzernamen erst vor Kurzem geändert: Du kannst ihn ab dem {date} wieder ändern.",
    },
  },
  privacy:
    "Name und Benutzername. Anzeigename und Benutzername wählst du unter „Name und Benutzername“ (Mein Profil › Meine öffentliche Seite bearbeiten); sie sind öffentlich, auf deiner Seite und neben dem, was du veröffentlichst. Wenn du deinen Benutzernamen änderst, behalten wir den alten mit deinem Konto verknüpft, damit alte Links zu deiner neuen Seite führen und niemand sonst ihn nimmt; er wird mit dem Konto gelöscht. Wir speichern außerdem das Datum der letzten Änderung, für die Grenze von einem neuen Benutzernamen alle 30 Tage.",
};

const ru: ProfileNameLabels = {
  section: "Имя и имя пользователя",
  intro: "Отображаемое имя видно рядом с вашими колодами, гайдами и комментариями. Имя пользователя — это адрес вашей страницы и короткой ссылки.",
  displayLabel: "Отображаемое имя",
  displayHint: "От {min} до {max} символов. Его можно менять когда угодно.",
  usernameLabel: "Имя пользователя",
  usernameHint: "От {min} до {max} символов: строчные латинские буквы, цифры и дефисы. Его можно менять раз в {days} дней.",
  preview: "Ваша страница: {url}",
  redirectNote: "Если вы его смените, ссылки на старый адрес будут вести на новую страницу, а старое имя останется за вами: никто другой не сможет его занять.",
  nextChange: "Снова сменить имя пользователя можно будет с {date}.",
  locked: "Ваше имя пользователя связано с функцией сайта: чтобы его сменить, напишите команде Staff.",
  confirmUsername: "Сменить имя пользователя? Снова сменить его можно будет через {days} дней.",
  save: "Сохранить имя",
  saving: "Сохранение…",
  saved: "Имя сохранено.",
  savedUsername: "Имя сохранено. Ваша страница теперь {url}: остальные страницы сайта обновятся в течение нескольких минут.",
  missing: "Смена имени пока не работает: загляните чуть позже.",
  readError: "Не удалось прочитать ваш профиль. Обновите страницу.",
  errors: {
    notLoggedIn: "Войдите, чтобы сменить имя.",
    disabled: "Аккаунты сейчас не работают.",
    db: "Не удалось сохранить. Попробуйте ещё раз чуть позже.",
    display: {
      invalid: "Отображаемое имя должно быть длиной от {min} до {max} символов, без невидимых символов.",
      reserved: "В этом имени есть слово, зарезервированное за Staff, сайтом или игрой.",
      lookalike: "Это имя совпадает с именем пользователя автора или Staff.",
      too_fast: "Вы только что сменили имя: попробуйте ещё раз через несколько секунд.",
    },
    username: {
      invalid: "Используйте от {min} до {max} символов: строчные латинские буквы, цифры и дефисы; дефис не может стоять в начале, в конце или рядом с другим дефисом.",
      reserved: "Это имя пользователя зарезервировано.",
      taken: "Это имя пользователя уже занято.",
      too_soon: "Вы недавно сменили имя пользователя: снова сменить его можно будет с {date}.",
    },
  },
  privacy:
    "Имя и имя пользователя. Отображаемое имя и имя пользователя вы выбираете в разделе «Имя и имя пользователя» (Мой профиль › Редактировать мою публичную страницу); они публичны: видны на вашей странице и рядом с тем, что вы публикуете. Когда вы меняете имя пользователя, мы храним старое вместе с вашим аккаунтом, чтобы старые ссылки вели на новую страницу и никто другой его не занял; оно удаляется вместе с аккаунтом. Мы также храним дату последней смены — для ограничения в одно новое имя пользователя раз в 30 дней.",
};

export const profileNameLabels: Record<Locale, ProfileNameLabels> = { en, it, es, fr, pt, de, ru };

/** Riempie i segnaposto {chiave} di un testo. */
export function fillName(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
