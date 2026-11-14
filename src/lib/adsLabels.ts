/**
 * Testi della pubblicità con Nitro (14/11/2026), otto lingue: la scritta sopra gli spazi nel testo (`label`) e il
 * paragrafo `#ads` dell'informativa (`privacy`, mostrato solo con gli annunci accesi). Il nome del link dei cookie è
 * quello del piede (`cookies.manage` dei dizionari): il test lo controlla. Nessun import a runtime.
 */
import type { Locale } from "./i18n";

export type AdsLabels = {
  /** Sopra ogni spazio nel testo: un annuncio si deve riconoscere */
  label: string;
  /** Paragrafo #ads dell'informativa privacy */
  privacy: string;
};

export const adsLabels = {
  en: {
    label: "Advertisement",
    privacy:
      "Advertising. Some pages show ads from Nitro (NitroPay), the advertising network of Overwolf Ltd. (Israel), which assigns them through a real-time auction among its advertising partners. To show and measure ads, Nitro and its partners use cookies and similar technologies and receive technical data such as your IP address, your browser and the page you are reading; some of them may be located outside the European Union. Where the GDPR applies, Nitro's consent window (IAB TCF) opens on your first visit: there you choose which purposes and partners to allow, and the same window asks for your consent to Google Analytics. You can change your choices at any time with “Cookie preferences” at the bottom of every page. Elsewhere ads are shown without that window; if you are in California you can opt out with the “Do Not Sell My Personal Information” link, which appears only there. We never pass your account data (email, username, profile) to Nitro or to advertisers. Nitro's privacy policy: nitropay.com/privacy.",
  },
  it: {
    label: "Pubblicità",
    privacy:
      "Pubblicità. Alcune pagine mostrano annunci di Nitro (NitroPay), la rete pubblicitaria di Overwolf Ltd. (Israele), che li assegna con un'asta in tempo reale fra i suoi partner pubblicitari. Per mostrare e misurare gli annunci, Nitro e i suoi partner usano cookie e tecnologie simili e ricevono dati tecnici come l'indirizzo IP, il browser e la pagina che stai leggendo; alcuni possono trovarsi fuori dall'Unione europea. Dove vale il GDPR, alla prima visita si apre la finestra del consenso di Nitro (IAB TCF): lì scegli quali finalità e quali partner permettere, e la stessa finestra chiede il tuo consenso per Google Analytics. Puoi cambiare le tue scelte quando vuoi con “Preferenze cookie” in fondo a ogni pagina. Altrove gli annunci compaiono senza quella finestra; se sei in California puoi opporti con il link “Do Not Sell My Personal Information”, che compare solo lì. I dati del tuo account (email, nome utente, profilo) non li passiamo mai a Nitro né agli inserzionisti. Informativa di Nitro: nitropay.com/privacy.",
  },
  es: {
    label: "Publicidad",
    privacy:
      "Publicidad. Algunas páginas muestran anuncios de Nitro (NitroPay), la red publicitaria de Overwolf Ltd. (Israel), que los asigna mediante una subasta en tiempo real entre sus socios publicitarios. Para mostrar y medir los anuncios, Nitro y sus socios usan cookies y tecnologías similares y reciben datos técnicos como tu dirección IP, tu navegador y la página que estás leyendo; algunos pueden estar fuera de la Unión Europea. Donde se aplica el RGPD, en tu primera visita se abre la ventana de consentimiento de Nitro (IAB TCF): ahí eliges qué finalidades y qué socios permitir, y la misma ventana te pide el consentimiento para Google Analytics. Puedes cambiar tus elecciones cuando quieras con “Preferencias de cookies” al final de cada página. En otros lugares los anuncios aparecen sin esa ventana; si estás en California puedes oponerte con el enlace “Do Not Sell My Personal Information”, que solo aparece allí. Nunca pasamos los datos de tu cuenta (correo, nombre de usuario, perfil) a Nitro ni a los anunciantes. Política de privacidad de Nitro: nitropay.com/privacy.",
  },
  fr: {
    label: "Publicité",
    privacy:
      "Publicité. Certaines pages affichent des annonces de Nitro (NitroPay), le réseau publicitaire d'Overwolf Ltd. (Israël), qui les attribue par une enchère en temps réel entre ses partenaires publicitaires. Pour afficher et mesurer les annonces, Nitro et ses partenaires utilisent des cookies et des technologies similaires et reçoivent des données techniques comme votre adresse IP, votre navigateur et la page que vous lisez ; certains peuvent se trouver hors de l'Union européenne. Là où le RGPD s'applique, la fenêtre de consentement de Nitro (IAB TCF) s'ouvre lors de votre première visite : vous y choisissez les finalités et les partenaires que vous autorisez, et la même fenêtre vous demande votre consentement pour Google Analytics. Vous pouvez modifier vos choix à tout moment avec « Préférences de cookies » en bas de chaque page. Ailleurs, les annonces s'affichent sans cette fenêtre ; si vous êtes en Californie, vous pouvez vous y opposer avec le lien « Do Not Sell My Personal Information », qui n'apparaît que là-bas. Nous ne transmettons jamais les données de votre compte (e-mail, nom d'utilisateur, profil) à Nitro ni aux annonceurs. Politique de confidentialité de Nitro : nitropay.com/privacy.",
  },
  pt: {
    label: "Publicidade",
    privacy:
      "Publicidade. Algumas páginas mostram anúncios da Nitro (NitroPay), a rede de publicidade da Overwolf Ltd. (Israel), que os atribui por meio de um leilão em tempo real entre seus parceiros de publicidade. Para mostrar e medir os anúncios, a Nitro e seus parceiros usam cookies e tecnologias semelhantes e recebem dados técnicos como o seu endereço IP, o seu navegador e a página que você está lendo; alguns podem estar fora da União Europeia. Onde o RGPD se aplica, na sua primeira visita abre-se a janela de consentimento da Nitro (IAB TCF): nela você escolhe quais finalidades e quais parceiros permitir, e a mesma janela pede o seu consentimento para o Google Analytics. Você pode mudar suas escolhas quando quiser em “Preferências de cookies”, no fim de cada página. Em outros lugares os anúncios aparecem sem essa janela; se você está na Califórnia, pode se opor pelo link “Do Not Sell My Personal Information”, que só aparece lá. Nunca passamos os dados da sua conta (e-mail, nome de usuário, perfil) à Nitro nem aos anunciantes. Política de privacidade da Nitro: nitropay.com/privacy.",
  },
  de: {
    label: "Anzeige",
    privacy:
      "Werbung. Einige Seiten zeigen Anzeigen von Nitro (NitroPay), dem Werbenetzwerk von Overwolf Ltd. (Israel), das sie in einer Echtzeit-Auktion unter seinen Werbepartnern vergibt. Um Anzeigen zu zeigen und zu messen, verwenden Nitro und seine Partner Cookies und ähnliche Technologien und erhalten technische Daten wie deine IP-Adresse, deinen Browser und die Seite, die du gerade liest; einige von ihnen können außerhalb der Europäischen Union sitzen. Wo die DSGVO gilt, öffnet sich bei deinem ersten Besuch das Einwilligungsfenster von Nitro (IAB TCF): Dort wählst du, welche Zwecke und welche Partner du erlaubst, und dasselbe Fenster fragt nach deiner Einwilligung für Google Analytics. Deine Auswahl kannst du jederzeit mit „Cookie-Einstellungen“ unten auf jeder Seite ändern. Anderswo erscheinen die Anzeigen ohne dieses Fenster; wenn du in Kalifornien bist, kannst du über den Link „Do Not Sell My Personal Information“ widersprechen, der nur dort erscheint. Die Daten deines Kontos (E-Mail, Benutzername, Profil) geben wir nie an Nitro oder an Werbetreibende weiter. Datenschutzerklärung von Nitro: nitropay.com/privacy.",
  },
  ru: {
    label: "Реклама",
    privacy:
      "Реклама. На некоторых страницах показывается реклама Nitro (NitroPay) — рекламной сети Overwolf Ltd. (Израиль), которая распределяет её через аукцион в реальном времени между своими рекламными партнёрами. Чтобы показывать и измерять рекламу, Nitro и её партнёры используют файлы cookie и похожие технологии и получают технические данные: ваш IP-адрес, браузер и страницу, которую вы читаете; некоторые из них могут находиться за пределами Европейского союза. Там, где действует GDPR, при первом посещении открывается окно согласия Nitro (IAB TCF): в нём вы выбираете, какие цели и каких партнёров разрешить, и это же окно спрашивает ваше согласие на Google Analytics. Изменить выбор можно в любой момент через «Настройки cookie» внизу каждой страницы. В других регионах реклама показывается без этого окна; если вы находитесь в Калифорнии, вы можете отказаться через ссылку «Do Not Sell My Personal Information», которая появляется только там. Данные вашего аккаунта (почту, имя пользователя, профиль) мы никогда не передаём ни Nitro, ни рекламодателям. Политика конфиденциальности Nitro: nitropay.com/privacy.",
  },
  "zh-cn": {
    label: "广告",
    privacy:
      "广告。部分页面会显示 Nitro（NitroPay）的广告。Nitro 是 Overwolf Ltd.（以色列）旗下的广告网络，通过实时竞价在其广告合作伙伴之间分配广告。为了展示和衡量广告，Nitro 及其合作伙伴会使用 Cookie 和类似技术，并接收技术数据，例如你的 IP 地址、浏览器和你正在阅读的页面；其中一些合作伙伴可能位于欧盟以外。在适用 GDPR 的地区，你第一次访问时会打开 Nitro 的同意窗口（IAB TCF）：你可以在其中选择允许哪些用途和哪些合作伙伴，同一个窗口也会征求你对 Google Analytics 的同意。你可以随时通过每个页面底部的“Cookie 偏好设置”更改你的选择。在其他地区，广告会在没有该窗口的情况下显示；如果你在加利福尼亚州，可以通过只在那里出现的“Do Not Sell My Personal Information”链接选择退出。我们绝不会把你的账户数据（电子邮件、用户名、个人资料）提供给 Nitro 或广告主。Nitro 的隐私政策：nitropay.com/privacy。",
  },
} as const satisfies Record<Locale, AdsLabels>;
