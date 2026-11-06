import type { Locale } from "./i18n";

/**
 * Testi dell'area account (06/11/2026, Pierluigi: "dobbiamo sistemare un po di pagine, i profili personali e dobbiamo
 * dividere bene istruzioni e codici per il tracker e le istruzioni per il layover di twitch"): le schede in cima a
 * /account, /account/profile, /account/messages, /account/tracker e /account/twitch, e le voci dell'indice fisso di
 * /account che non stanno già nei dizionari. "Il mio profilo" è `nav.account`, "In questa pagina" è
 * `community.account.profilePage.jump`, mazzi, tier list, guide e fumetti sono le voci di `nav`.
 */
export type AccountLabels = {
  tabs: {
    /** nome della barra per i lettori di schermo */
    aria: string;
    /** /account/profile: nome breve del tasto "Modifica la mia pagina pubblica" */
    public: string;
    messages: string;
  };
  index: { private: string; saved: string; stats: string; tournaments: string; following: string };
};

export const accountLabels: Record<Locale, AccountLabels> = {
  en: {
    tabs: { aria: "Your account", public: "Public page", messages: "Messages" },
    index: { private: "Private", saved: "Saved", stats: "Stats", tournaments: "Tournaments", following: "Following" },
  },
  it: {
    tabs: { aria: "Il tuo account", public: "Pagina pubblica", messages: "Messaggi" },
    index: { private: "Privati", saved: "Salvati", stats: "Statistiche", tournaments: "Tornei", following: "Chi segui" },
  },
  es: {
    tabs: { aria: "Tu cuenta", public: "Página pública", messages: "Mensajes" },
    index: { private: "Privados", saved: "Guardados", stats: "Estadísticas", tournaments: "Torneos", following: "A quién sigues" },
  },
  fr: {
    tabs: { aria: "Votre compte", public: "Page publique", messages: "Messages" },
    index: { private: "Privés", saved: "Favoris", stats: "Statistiques", tournaments: "Tournois", following: "Abonnements" },
  },
  pt: {
    tabs: { aria: "Sua conta", public: "Página pública", messages: "Mensagens" },
    index: { private: "Privados", saved: "Salvos", stats: "Estatísticas", tournaments: "Torneios", following: "Quem você segue" },
  },
  de: {
    tabs: { aria: "Dein Konto", public: "Öffentliche Seite", messages: "Nachrichten" },
    index: { private: "Privat", saved: "Gespeichert", stats: "Statistiken", tournaments: "Turniere", following: "Wem du folgst" },
  },
  ru: {
    tabs: { aria: "Ваш аккаунт", public: "Публичная страница", messages: "Сообщения" },
    index: { private: "Приватные", saved: "Сохранённые", stats: "Статистика", tournaments: "Турниры", following: "Подписки" },
  },
  "zh-cn": {
    tabs: { aria: "你的账号", public: "公开主页", messages: "消息" },
    index: { private: "私密", saved: "已收藏", stats: "数据", tournaments: "锦标赛", following: "我的关注" },
  },
};
