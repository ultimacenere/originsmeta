import type { Dictionary } from "./i18n";

/**
 * Etichette del pannello di accesso (`src/components/LoginPanel.tsx`), che compare in quattro punti:
 * /login, /tournaments/new, /decks/publish e la modifica di un mazzo. Stanno qui, e non nel componente,
 * per lo stesso motivo di `builderLabels.ts`: un file "use client" non va importato dai server component,
 * e così una nuova etichetta si aggiunge in un posto solo.
 */
export type LoginLabels = {
  discord: string;
  or: string;
  email: string;
  emailPlaceholder: string;
  magicLink: string;
  sending: string;
  sent: string;
  error: string;
  providerError: string;
  rateLimited: string;
  captchaError: string;
  disabled: string;
  backHint: string;
};

export function loginLabels(dict: Dictionary): LoginLabels {
  const a = dict.auth;
  return {
    discord: a.discord,
    or: a.or,
    email: a.email,
    emailPlaceholder: a.emailPlaceholder,
    magicLink: a.magicLink,
    sending: a.sending,
    sent: a.sent,
    error: a.error,
    providerError: a.providerError,
    rateLimited: a.rateLimited,
    captchaError: a.captchaError,
    disabled: a.disabled,
    backHint: a.backHint,
  };
}
