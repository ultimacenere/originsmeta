import type { Metadata } from "next";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { creatorLabels } from "@/lib/creatorLabels";
import { videoPrivacyText } from "@/lib/videoLabels";
import { deckStatsPrivacy } from "@/lib/deckStatsLabels";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, "/privacy", dict.privacy.title, dict.privacy.body), robots: { index: false, follow: true } };
}

export default async function PrivacyPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.footer.legal}</p>
      <h1 className="t-page mt-2">{d.privacy.title}</h1>
      <article className="card-night mt-8 p-6 text-lg leading-relaxed text-pale sm:p-10">
        <p>{d.privacy.body}</p>
        <p className="mt-6">{d.privacy.accounts}</p>
        <p className="mt-6">{d.privacy.cookies}</p>
        {/* Video a clic di YouTube e Twitch e risorse dei mazzi (26/09/2026): l'ancora #video è il link "Privacy" sotto
            ogni lettore (VideoEmbed). Il testo sta in src/lib/videoLabels.ts. */}
        <p id="video" className="mt-6 scroll-mt-24">
          {videoPrivacyText[locale]}
        </p>
        {/* Pop-up dei feedback (22/09/2026): l'ancora #feedback è il link "Privacy" del pannello. Resta anche a
            widget spento, perché i messaggi già ricevuti stanno nel canale Discord dello staff. */}
        <p id="feedback" className="mt-6 scroll-mt-24">
          {d.privacy.feedback}
        </p>
        {/* Modulo "Mandaci la tua guida" (23/09/2026): l'ancora #guide è il link "Informativa privacy" del modulo. */}
        <p id="guide" className="mt-6 scroll-mt-24">
          {d.privacy.guides}
        </p>
        {/* Profilo pubblico e stato in diretta (pacchetto CREATOR, 26/09/2026) */}
        <p id="profile" className="mt-6 scroll-mt-24">
          {creatorLabels[locale].privacy}
        </p>
        {/* Statistiche dei mazzi per gli autori (pacchetto STATS, 26/09/2026): totali per mazzo, senza dati personali. */}
        <p id="deck-stats" className="mt-6 scroll-mt-24">
          {deckStatsPrivacy[locale]}
        </p>
      </article>
    </div>
  );
}
