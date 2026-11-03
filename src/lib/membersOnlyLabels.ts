import type { Locale } from "./i18n";

/**
 * Testi della pagina sfocata delle sezioni riservate agli iscritti (03/11/2026, src/lib/membersOnly.ts). Il titolo è
 * quello chiesto da Pierluigi, "registrati per accedere a questa sezione"; l'account si crea al primo accesso dalla
 * pagina di login (Discord o link via email), quindi un tasto solo per registrarsi e accedere.
 */
export type MembersOnlyLabels = { kicker: string; title: string; text: string; cta: string; metaDescription: string };

export const membersOnlyLabels: Record<Locale, MembersOnlyLabels> = {
  en: {
    kicker: "Members only",
    title: "Sign up to access this section",
    text: "The account is free and takes a moment: with Discord or your email, no password.",
    cta: "Sign up or sign in",
    metaDescription: "A section of OriginsMeta for members: sign up for free with Discord or your email to access it.",
  },
  it: {
    kicker: "Riservato agli iscritti",
    title: "Registrati per accedere a questa sezione",
    text: "L'account è gratuito e si crea in un attimo: con Discord o con la tua email, senza password.",
    cta: "Registrati o accedi",
    metaDescription: "Una sezione di OriginsMeta per gli iscritti: registrati gratis con Discord o con la tua email per accedervi.",
  },
  es: {
    kicker: "Solo para miembros",
    title: "Regístrate para acceder a esta sección",
    text: "La cuenta es gratuita y se crea en un momento: con Discord o con tu email, sin contraseña.",
    cta: "Regístrate o accede",
    metaDescription: "Una sección de OriginsMeta para miembros: regístrate gratis con Discord o con tu email para acceder.",
  },
  fr: {
    kicker: "Réservé aux membres",
    title: "Inscrivez-vous pour accéder à cette section",
    text: "Le compte est gratuit et se crée en un instant : avec Discord ou votre e-mail, sans mot de passe.",
    cta: "S'inscrire ou se connecter",
    metaDescription: "Une section d'OriginsMeta réservée aux membres : inscrivez-vous gratuitement avec Discord ou votre e-mail pour y accéder.",
  },
  pt: {
    kicker: "Só para membros",
    title: "Cadastre-se para acessar esta seção",
    text: "A conta é gratuita e é criada num instante: com o Discord ou com o seu email, sem senha.",
    cta: "Cadastre-se ou entre",
    metaDescription: "Uma seção do OriginsMeta para membros: cadastre-se de graça com o Discord ou com o seu email para acessar.",
  },
  de: {
    kicker: "Nur für Mitglieder",
    title: "Registriere dich, um diesen Bereich zu öffnen",
    text: "Das Konto ist kostenlos und in einem Moment erstellt: mit Discord oder deiner E-Mail, ohne Passwort.",
    cta: "Registrieren oder anmelden",
    metaDescription: "Ein Bereich von OriginsMeta für Mitglieder: Registriere dich kostenlos mit Discord oder deiner E-Mail, um ihn zu öffnen.",
  },
  ru: {
    kicker: "Только для участников",
    title: "Зарегистрируйтесь, чтобы открыть этот раздел",
    text: "Аккаунт бесплатный и создаётся за минуту: через Discord или по email, без пароля.",
    cta: "Зарегистрироваться или войти",
    metaDescription: "Раздел OriginsMeta для участников: зарегистрируйтесь бесплатно через Discord или по email, чтобы открыть его.",
  },
};
