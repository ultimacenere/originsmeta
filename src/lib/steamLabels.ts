import type { Locale } from "./i18n";
import type { SteamLinkOutcome } from "./steam/link";

/**
 * Testi dell'account Steam (09/11/2026) nelle otto lingue: sezione #steam di /account ("Il mio profilo"), etichetta che lì
 * prende il posto dell'indirizzo tecnico degli account nati con Steam, paragrafo #steam dell'informativa. I testi del
 * pannello di accesso ("Continua con Steam" e i suoi errori) stanno nei dizionari, sezione `auth`, come quelli di
 * Discord. L'inglese è il tipo di riferimento; {date} si riempie con la data nella lingua della pagina.
 * Francese con lo spazio insecabile (U+00A0) prima di : ; ? ! e dentro « » (docs/francese.md).
 */
export type SteamLabels = {
  /** titolo della sezione e voce dei salti in cima alla pagina */
  section: string;
  intro: string;
  /** frase in più quando l'accesso con Steam è attivo sul sito */
  introLogin: string;
  connect: string;
  /** stato con l'account collegato */
  connected: string;
  /** {date} */
  linkedOn: string;
  openProfile: string;
  unlink: string;
  confirmUnlink: string;
  /** account nato con Steam: niente "Scollega" */
  steamOnly: string;
  /** prima della migrazione */
  missing: string;
  readError: string;
  /** in /account e nel menu dell'account, al posto dell'indirizzo tecnico */
  accountLabel: string;
  /** esito del collegamento o dello scollegamento (`?steam=` nell'indirizzo) */
  outcomes: Record<SteamLinkOutcome, string>;
  /** paragrafo #steam dell'informativa */
  privacy: string;
};

const en: SteamLabels = {
  section: "Steam account",
  intro: "Connect your Steam account to your OriginsMeta profile. Steam only tells us your SteamID, the number of your Steam profile: no password, no access to your Steam account or your inventory.",
  introLogin: "With Steam connected you can also sign in with “Continue with Steam” on the sign-in page.",
  connect: "Connect Steam",
  connected: "Connected to the Steam account",
  linkedOn: "Connected since {date}",
  openProfile: "Open the Steam profile",
  unlink: "Disconnect Steam",
  confirmUnlink: "Disconnect your Steam account? You won't be able to sign in with Steam until you connect it again.",
  steamOnly: "You created this account with Steam: it's how you sign in, so the connection stays.",
  missing: "Connecting Steam isn't active on this site yet.",
  readError: "We can't read your Steam connection right now. Try again shortly.",
  accountLabel: "Steam account",
  outcomes: {
    linked: "Done: your Steam account is connected.",
    already: "This Steam account was already connected to your profile.",
    other: "Another Steam account is already connected to your profile: disconnect it before connecting a new one.",
    taken: "This Steam account is already connected to another OriginsMeta profile. If you created that one with Steam and don't use it, write to us.",
    cancelled: "Connection cancelled on Steam. You can try again whenever you like.",
    error: "Steam didn't confirm the connection. Try again shortly.",
    missing: "Connecting Steam isn't active on this site yet.",
    mismatch: "The connection was started from another account on this site: try again from here.",
    unlinked: "Steam account disconnected.",
    steamOnly: "You created this account with Steam: it's how you sign in, so the connection stays.",
  },
  privacy:
    "Steam account. If you connect Steam to your profile or sign in with “Continue with Steam”, Steam (Valve) confirms your SteamID, the public number of your Steam profile; we never receive your password or access to your Steam account. We store the SteamID and the date of the connection on Supabase: they are not public and are only used to sign you in. If you create your account with Steam, your display name starts from your Steam profile name (change it whenever you like) and the account gets a technical email address that receives no mail. A ten-minute technical cookie keeps track of the trip to Steam. You can disconnect Steam from your profile at any time; the SteamID is deleted with your account.",
};

const it: SteamLabels = {
  section: "Account Steam",
  intro: "Collega il tuo account Steam al profilo di OriginsMeta. Steam ci dice solo il tuo SteamID, il numero del tuo profilo Steam: niente password, niente accesso al tuo account Steam né al tuo inventario.",
  introLogin: "Con Steam collegato puoi entrare nel sito anche con “Continua con Steam”, dalla pagina di accesso.",
  connect: "Collega Steam",
  connected: "Collegato all'account Steam",
  linkedOn: "Collegato dal {date}",
  openProfile: "Apri il profilo Steam",
  unlink: "Scollega Steam",
  confirmUnlink: "Scollegare l'account Steam? Non potrai più entrare con Steam finché non lo colleghi di nuovo.",
  steamOnly: "Hai creato l'account con Steam: è il tuo modo per entrare, quindi il collegamento resta.",
  missing: "Il collegamento con Steam non è ancora attivo su questo sito.",
  readError: "Non riusciamo a leggere il collegamento con Steam. Riprova tra poco.",
  accountLabel: "Account Steam",
  outcomes: {
    linked: "Fatto: il tuo account Steam è collegato.",
    already: "Questo account Steam era già collegato al tuo profilo.",
    other: "Al tuo profilo è già collegato un altro account Steam: scollegalo prima di collegarne uno nuovo.",
    taken: "Questo account Steam è già collegato a un altro profilo di OriginsMeta. Se l'hai creato tu con Steam e non lo usi, scrivici.",
    cancelled: "Collegamento annullato su Steam. Puoi riprovare quando vuoi.",
    error: "Steam non ha confermato il collegamento. Riprova tra poco.",
    missing: "Il collegamento con Steam non è ancora attivo su questo sito.",
    mismatch: "Il collegamento era partito da un altro account del sito: riprova da qui.",
    unlinked: "Account Steam scollegato.",
    steamOnly: "Hai creato l'account con Steam: è il tuo modo per entrare, quindi il collegamento resta.",
  },
  privacy:
    "Account Steam. Se colleghi Steam al profilo o entri con “Continua con Steam”, Steam (Valve) ci conferma il tuo SteamID, il numero pubblico del tuo profilo Steam; non riceviamo mai la password né l'accesso al tuo account Steam. Conserviamo su Supabase lo SteamID e la data del collegamento: non sono pubblici e servono solo a farti entrare. Se crei l'account con Steam, il nome mostrato parte dal nome del tuo profilo Steam (lo cambi quando vuoi) e l'account ha un indirizzo email tecnico che non riceve posta. Un cookie tecnico di dieci minuti tiene il giro verso Steam. Puoi scollegare Steam dal profilo in qualsiasi momento; lo SteamID si cancella con l'account.",
};

const es: SteamLabels = {
  section: "Cuenta de Steam",
  intro: "Conecta tu cuenta de Steam a tu perfil de OriginsMeta. Steam solo nos dice tu SteamID, el número de tu perfil de Steam: ni contraseña ni acceso a tu cuenta de Steam o a tu inventario.",
  introLogin: "Con Steam conectado también puedes entrar con “Continuar con Steam” desde la página de acceso.",
  connect: "Conectar Steam",
  connected: "Conectado a la cuenta de Steam",
  linkedOn: "Conectado desde el {date}",
  openProfile: "Abrir el perfil de Steam",
  unlink: "Desconectar Steam",
  confirmUnlink: "¿Desconectar tu cuenta de Steam? No podrás entrar con Steam hasta que la vuelvas a conectar.",
  steamOnly: "Creaste esta cuenta con Steam: es tu forma de entrar, así que la conexión se queda.",
  missing: "La conexión con Steam todavía no está activa en este sitio.",
  readError: "No podemos leer tu conexión con Steam ahora mismo. Inténtalo de nuevo en un rato.",
  accountLabel: "Cuenta de Steam",
  outcomes: {
    linked: "Listo: tu cuenta de Steam está conectada.",
    already: "Esta cuenta de Steam ya estaba conectada a tu perfil.",
    other: "Tu perfil ya tiene otra cuenta de Steam conectada: desconéctala antes de conectar una nueva.",
    taken: "Esta cuenta de Steam ya está conectada a otro perfil de OriginsMeta. Si lo creaste tú con Steam y no lo usas, escríbenos.",
    cancelled: "Conexión cancelada en Steam. Puedes volver a intentarlo cuando quieras.",
    error: "Steam no confirmó la conexión. Inténtalo de nuevo en un rato.",
    missing: "La conexión con Steam todavía no está activa en este sitio.",
    mismatch: "La conexión se inició desde otra cuenta del sitio: vuelve a intentarlo desde aquí.",
    unlinked: "Cuenta de Steam desconectada.",
    steamOnly: "Creaste esta cuenta con Steam: es tu forma de entrar, así que la conexión se queda.",
  },
  privacy:
    "Cuenta de Steam. Si conectas Steam a tu perfil o entras con “Continuar con Steam”, Steam (Valve) nos confirma tu SteamID, el número público de tu perfil de Steam; nunca recibimos tu contraseña ni acceso a tu cuenta de Steam. Guardamos en Supabase el SteamID y la fecha de la conexión: no son públicos y solo sirven para que entres. Si creas tu cuenta con Steam, tu nombre visible parte del nombre de tu perfil de Steam (lo cambias cuando quieras) y la cuenta tiene una dirección de correo técnica que no recibe mensajes. Una cookie técnica de diez minutos acompaña el paso por Steam. Puedes desconectar Steam de tu perfil en cualquier momento; el SteamID se borra con tu cuenta.",
};

const fr: SteamLabels = {
  section: "Compte Steam",
  intro: "Associez votre compte Steam à votre profil OriginsMeta. Steam nous communique seulement votre SteamID, le numéro de votre profil Steam : ni mot de passe, ni accès à votre compte Steam ou à votre inventaire.",
  introLogin: "Avec Steam associé, vous pouvez aussi vous connecter avec « Continuer avec Steam » depuis la page de connexion.",
  connect: "Associer Steam",
  connected: "Associé au compte Steam",
  linkedOn: "Associé depuis le {date}",
  openProfile: "Ouvrir le profil Steam",
  unlink: "Dissocier Steam",
  confirmUnlink: "Dissocier votre compte Steam ? Vous ne pourrez plus vous connecter avec Steam tant que vous ne l'aurez pas associé de nouveau.",
  steamOnly: "Vous avez créé ce compte avec Steam : c'est votre façon de vous connecter, l'association reste donc en place.",
  missing: "L'association avec Steam n'est pas encore active sur ce site.",
  readError: "Impossible de lire votre association avec Steam pour le moment. Réessayez dans un instant.",
  accountLabel: "Compte Steam",
  outcomes: {
    linked: "C'est fait : votre compte Steam est associé.",
    already: "Ce compte Steam était déjà associé à votre profil.",
    other: "Un autre compte Steam est déjà associé à votre profil : dissociez-le avant d'en associer un nouveau.",
    taken: "Ce compte Steam est déjà associé à un autre profil OriginsMeta. Si vous l'avez créé avec Steam et ne l'utilisez pas, écrivez-nous.",
    cancelled: "Association annulée sur Steam. Vous pouvez réessayer quand vous voulez.",
    error: "Steam n'a pas confirmé l'association. Réessayez dans un instant.",
    missing: "L'association avec Steam n'est pas encore active sur ce site.",
    mismatch: "L'association a été lancée depuis un autre compte du site : réessayez d'ici.",
    unlinked: "Compte Steam dissocié.",
    steamOnly: "Vous avez créé ce compte avec Steam : c'est votre façon de vous connecter, l'association reste donc en place.",
  },
  privacy:
    "Compte Steam. Si vous associez Steam à votre profil ou vous connectez avec « Continuer avec Steam », Steam (Valve) nous confirme votre SteamID, le numéro public de votre profil Steam ; nous ne recevons jamais votre mot de passe ni l'accès à votre compte Steam. Nous conservons sur Supabase le SteamID et la date de l'association : ils ne sont pas publics et servent uniquement à vous connecter. Si vous créez votre compte avec Steam, votre nom affiché part du nom de votre profil Steam (modifiable à tout moment) et le compte reçoit une adresse e-mail technique qui ne reçoit aucun message. Un cookie technique de dix minutes accompagne le passage par Steam. Vous pouvez dissocier Steam de votre profil à tout moment ; le SteamID est supprimé avec votre compte.",
};

const pt: SteamLabels = {
  section: "Conta Steam",
  intro: "Conecte sua conta Steam ao seu perfil do OriginsMeta. A Steam só nos informa o seu SteamID, o número do seu perfil Steam: nada de senha, nada de acesso à sua conta Steam ou ao seu inventário.",
  introLogin: "Com a Steam conectada, você também pode entrar com “Continuar com a Steam” na página de login.",
  connect: "Conectar a Steam",
  connected: "Conectado à conta Steam",
  linkedOn: "Conectado desde {date}",
  openProfile: "Abrir o perfil Steam",
  unlink: "Desconectar a Steam",
  confirmUnlink: "Desconectar sua conta Steam? Você não vai poder entrar com a Steam até conectá-la de novo.",
  steamOnly: "Você criou esta conta com a Steam: é o seu jeito de entrar, então a conexão fica.",
  missing: "A conexão com a Steam ainda não está ativa neste site.",
  readError: "Não conseguimos ler sua conexão com a Steam agora. Tente de novo daqui a pouco.",
  accountLabel: "Conta Steam",
  outcomes: {
    linked: "Pronto: sua conta Steam está conectada.",
    already: "Esta conta Steam já estava conectada ao seu perfil.",
    other: "Outra conta Steam já está conectada ao seu perfil: desconecte-a antes de conectar uma nova.",
    taken: "Esta conta Steam já está conectada a outro perfil do OriginsMeta. Se foi você que o criou com a Steam e não o usa, escreva para nós.",
    cancelled: "Conexão cancelada na Steam. Você pode tentar de novo quando quiser.",
    error: "A Steam não confirmou a conexão. Tente de novo daqui a pouco.",
    missing: "A conexão com a Steam ainda não está ativa neste site.",
    mismatch: "A conexão começou a partir de outra conta do site: tente de novo por aqui.",
    unlinked: "Conta Steam desconectada.",
    steamOnly: "Você criou esta conta com a Steam: é o seu jeito de entrar, então a conexão fica.",
  },
  privacy:
    "Conta Steam. Se você conectar a Steam ao seu perfil ou entrar com “Continuar com a Steam”, a Steam (Valve) nos confirma o seu SteamID, o número público do seu perfil Steam; nunca recebemos sua senha nem acesso à sua conta Steam. Guardamos no Supabase o SteamID e a data da conexão: não são públicos e servem só para você entrar. Se você criar a conta com a Steam, o nome exibido parte do nome do seu perfil Steam (você muda quando quiser) e a conta tem um endereço de e-mail técnico que não recebe mensagens. Um cookie técnico de dez minutos acompanha a passagem pela Steam. Você pode desconectar a Steam do seu perfil a qualquer momento; o SteamID é apagado junto com a conta.",
};

const de: SteamLabels = {
  section: "Steam-Konto",
  intro: "Verbinde dein Steam-Konto mit deinem OriginsMeta-Profil. Steam teilt uns nur deine SteamID mit, die Nummer deines Steam-Profils: kein Passwort, kein Zugriff auf dein Steam-Konto oder dein Inventar.",
  introLogin: "Mit verbundenem Steam kannst du dich auf der Anmeldeseite auch mit „Weiter mit Steam“ anmelden.",
  connect: "Steam verbinden",
  connected: "Verbunden mit dem Steam-Konto",
  linkedOn: "Verbunden seit {date}",
  openProfile: "Steam-Profil öffnen",
  unlink: "Steam trennen",
  confirmUnlink: "Dein Steam-Konto trennen? Du kannst dich dann nicht mehr mit Steam anmelden, bis du es wieder verbindest.",
  steamOnly: "Du hast dieses Konto mit Steam erstellt: So meldest du dich an, deshalb bleibt die Verbindung bestehen.",
  missing: "Die Verbindung mit Steam ist auf dieser Seite noch nicht aktiv.",
  readError: "Wir können deine Steam-Verbindung gerade nicht lesen. Versuch es gleich noch einmal.",
  accountLabel: "Steam-Konto",
  outcomes: {
    linked: "Erledigt: Dein Steam-Konto ist verbunden.",
    already: "Dieses Steam-Konto war schon mit deinem Profil verbunden.",
    other: "Mit deinem Profil ist schon ein anderes Steam-Konto verbunden: Trenne es, bevor du ein neues verbindest.",
    taken: "Dieses Steam-Konto ist schon mit einem anderen OriginsMeta-Profil verbunden. Wenn du das mit Steam erstellt hast und nicht nutzt, schreib uns.",
    cancelled: "Verbindung auf Steam abgebrochen. Du kannst es jederzeit noch einmal versuchen.",
    error: "Steam hat die Verbindung nicht bestätigt. Versuch es gleich noch einmal.",
    missing: "Die Verbindung mit Steam ist auf dieser Seite noch nicht aktiv.",
    mismatch: "Die Verbindung wurde von einem anderen Konto dieser Seite gestartet: Versuch es hier noch einmal.",
    unlinked: "Steam-Konto getrennt.",
    steamOnly: "Du hast dieses Konto mit Steam erstellt: So meldest du dich an, deshalb bleibt die Verbindung bestehen.",
  },
  privacy:
    "Steam-Konto. Wenn du Steam mit deinem Profil verbindest oder dich mit „Weiter mit Steam“ anmeldest, bestätigt uns Steam (Valve) deine SteamID, die öffentliche Nummer deines Steam-Profils; dein Passwort oder Zugriff auf dein Steam-Konto bekommen wir nie. Wir speichern die SteamID und das Datum der Verbindung bei Supabase: Sie sind nicht öffentlich und dienen nur deiner Anmeldung. Erstellst du dein Konto mit Steam, übernimmt der Anzeigename den Namen deines Steam-Profils (jederzeit änderbar), und das Konto bekommt eine technische E-Mail-Adresse, die keine Post empfängt. Ein technisches Cookie von zehn Minuten begleitet den Weg über Steam. Du kannst Steam jederzeit von deinem Profil trennen; die SteamID wird mit deinem Konto gelöscht.",
};

const ru: SteamLabels = {
  section: "Аккаунт Steam",
  intro: "Привяжите аккаунт Steam к профилю OriginsMeta. Steam сообщает нам только ваш SteamID — номер вашего профиля Steam: никакого пароля и никакого доступа к вашему аккаунту Steam или инвентарю.",
  introLogin: "С привязанным Steam вы сможете входить на сайт и через «Продолжить через Steam» на странице входа.",
  connect: "Привязать Steam",
  connected: "Привязан аккаунт Steam",
  linkedOn: "Привязан с {date}",
  openProfile: "Открыть профиль Steam",
  unlink: "Отвязать Steam",
  confirmUnlink: "Отвязать аккаунт Steam? Входить через Steam будет нельзя, пока вы не привяжете его снова.",
  steamOnly: "Вы создали этот аккаунт через Steam: это ваш способ входа, поэтому привязка остаётся.",
  missing: "Привязка Steam на этом сайте пока не работает.",
  readError: "Не удаётся прочитать привязку Steam. Попробуйте чуть позже.",
  accountLabel: "Аккаунт Steam",
  outcomes: {
    linked: "Готово: аккаунт Steam привязан.",
    already: "Этот аккаунт Steam уже был привязан к вашему профилю.",
    other: "К вашему профилю уже привязан другой аккаунт Steam: отвяжите его, прежде чем привязывать новый.",
    taken: "Этот аккаунт Steam уже привязан к другому профилю OriginsMeta. Если вы создали его через Steam и не пользуетесь им, напишите нам.",
    cancelled: "Привязка отменена в Steam. Попробовать снова можно в любой момент.",
    error: "Steam не подтвердил привязку. Попробуйте чуть позже.",
    missing: "Привязка Steam на этом сайте пока не работает.",
    mismatch: "Привязку начали из другого аккаунта сайта: попробуйте снова отсюда.",
    unlinked: "Аккаунт Steam отвязан.",
    steamOnly: "Вы создали этот аккаунт через Steam: это ваш способ входа, поэтому привязка остаётся.",
  },
  privacy:
    "Аккаунт Steam. Если вы привязываете Steam к профилю или входите через «Продолжить через Steam», Steam (Valve) подтверждает нам ваш SteamID — публичный номер вашего профиля Steam; ваш пароль и доступ к аккаунту Steam мы не получаем никогда. Мы храним в Supabase SteamID и дату привязки: они не публичны и нужны только для входа. Если вы создаёте аккаунт через Steam, отображаемое имя берётся из имени вашего профиля Steam (его можно изменить в любой момент), а у аккаунта есть технический адрес электронной почты, на который письма не приходят. Технический cookie на десять минут сопровождает переход в Steam. Отвязать Steam от профиля можно в любой момент; SteamID удаляется вместе с аккаунтом.",
};

const zhCn: SteamLabels = {
  section: "Steam 账号",
  intro: "把你的 Steam 账号关联到 OriginsMeta 个人资料。Steam 只会告诉我们你的 SteamID，也就是你 Steam 个人资料的编号：不涉及密码，也无法访问你的 Steam 账号或库存。",
  introLogin: "关联 Steam 后，你也可以在登录页面点击“使用 Steam 继续”登录本站。",
  connect: "关联 Steam",
  connected: "已关联 Steam 账号",
  linkedOn: "关联于 {date}",
  openProfile: "打开 Steam 个人资料",
  unlink: "解除 Steam 关联",
  confirmUnlink: "要解除 Steam 账号的关联吗？重新关联之前，你将无法使用 Steam 登录。",
  steamOnly: "你是用 Steam 创建这个账号的：这是你的登录方式，所以关联会保留。",
  missing: "本站尚未开放 Steam 关联功能。",
  readError: "暂时无法读取你的 Steam 关联，请稍后再试。",
  accountLabel: "Steam 账号",
  outcomes: {
    linked: "完成：你的 Steam 账号已关联。",
    already: "这个 Steam 账号已经关联到你的个人资料。",
    other: "你的个人资料已经关联了另一个 Steam 账号：请先解除关联，再关联新的账号。",
    taken: "这个 Steam 账号已关联到另一个 OriginsMeta 个人资料。如果那是你用 Steam 创建但不再使用的账号，请联系我们。",
    cancelled: "已在 Steam 上取消关联。你可以随时再试一次。",
    error: "Steam 没有确认这次关联，请稍后再试。",
    missing: "本站尚未开放 Steam 关联功能。",
    mismatch: "这次关联是从本站的另一个账号发起的：请在这里重新操作。",
    unlinked: "已解除 Steam 账号的关联。",
    steamOnly: "你是用 Steam 创建这个账号的：这是你的登录方式，所以关联会保留。",
  },
  privacy:
    "Steam 账号。如果你把 Steam 关联到个人资料，或使用“使用 Steam 继续”登录，Steam（Valve）会向我们确认你的 SteamID，即你 Steam 个人资料的公开编号；我们永远不会收到你的密码，也无法访问你的 Steam 账号。我们在 Supabase 上保存 SteamID 和关联日期：这些信息不公开，只用于让你登录。如果你用 Steam 创建账号，显示名称会取自你的 Steam 个人资料名称（可随时修改），账号会使用一个不接收邮件的技术性电子邮件地址。一个有效期十分钟的技术性 cookie 会记录前往 Steam 的过程。你可以随时从个人资料中解除 Steam 关联；SteamID 会随账号一起删除。",
};

export const steamLabels: Record<Locale, SteamLabels> = { en, it, es, fr, pt, de, ru, "zh-cn": zhCn };
