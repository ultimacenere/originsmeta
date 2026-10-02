import type { Metadata } from "next";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { followLabels } from "@/lib/followLabels";
import { creatorLabels } from "@/lib/creatorLabels";
import { videoPrivacyText } from "@/lib/videoLabels";
import { deckStatsPrivacy } from "@/lib/deckStatsLabels";
import { inboxLabels } from "@/lib/inboxLabels";
import { showcaseLabels } from "@/lib/showcaseLabels";
import { achievementLabels } from "@/lib/achievementLabels";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { comicLabels } from "@/lib/comicLabels";
import { trackerPrivacy } from "@/lib/trackerLabels";
import { draftPrivacy } from "@/lib/draftLabels";
import { analyticsInterestPrivacy } from "@/lib/analyticsLabels";

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
          {d.privacy.feedback}{" "}
          {/* casella messaggi (pacchetto INBOX): il feedback mandato con l'accesso fatto è collegato all'account */}
          {inboxLabels[locale].privacyFeedback} (
          <a href="#messages" className="link-mint">
            {inboxLabels[locale].privacyFeedbackLink}
          </a>
          ).
        </p>
        {/* Modulo "Mandaci la tua guida" (23/09/2026): l'ancora #guide è il link "Informativa privacy" del modulo. */}
        <p id="guide" className="mt-6 scroll-mt-24">
          {d.privacy.guides}
        </p>
        {/* Profilo pubblico e stato in diretta (pacchetto CREATOR, 26/09/2026) */}
        <p id="profile" className="mt-6 scroll-mt-24">
          {creatorLabels[locale].privacy}
        </p>
        {/* Foto profilo caricate e vetrina (pacchetto VETRINA, 27/09/2026): testo in src/lib/showcaseLabels.ts */}
        <p id="profile-media" className="mt-6 scroll-mt-24">
          {showcaseLabels[locale].privacy}
        </p>
        {/* Statistiche dei mazzi per gli autori (pacchetto STATS, 26/09/2026): totali per mazzo, senza dati personali. */}
        <p id="deck-stats" className="mt-6 scroll-mt-24">
          {deckStatsPrivacy[locale]}
        </p>
        {/* Traguardi e numeri pubblici della vetrina (pacchetto TRAGUARDI, 27/09/2026): testo in src/lib/achievementLabels.ts */}
        <p id="profile-stats" className="mt-6 scroll-mt-24">
          {achievementLabels[locale].privacy}
        </p>
        {/* Casella messaggi utente ↔ staff (26/09/2026, pacchetto INBOX): testo in src/lib/inboxLabels.ts, ancora #messages */}
        <p id="messages" className="mt-6 scroll-mt-24">
          {inboxLabels[locale].privacy}
        </p>
        {/* "Segui" e notifiche (pacchetto SEGUI, 27/09/2026): testo in src/lib/followLabels.ts, ancora #follows */}
        <p id="follows" className="mt-6 scroll-mt-24">
          {followLabels[locale].privacy}
        </p>
        {/* Fumetti dei creator (pacchetto FUMETTI, 29/09/2026): testo in src/lib/comicLabels.ts, ancora #community-comics */}
        <p id="community-comics" className="mt-6 scroll-mt-24">
          {comicLabels[locale].privacy}
        </p>
        {/* Guide della community (pacchetto GUIDE, 27/09/2026): testo in src/lib/communityGuideLabels.ts, ancora #community-guides */}
        <p id="community-guides" className="mt-6 scroll-mt-24">
          {communityGuideLabels[locale].privacy}
        </p>
        {/* App OriginsMeta Tracker e statistiche anonime delle partite (tracker/overlay, 30/09/2026): testo in
            src/lib/trackerLabels.ts, ancora #tracker (link da /account/tracker) */}
        <p id="tracker" className="mt-6 scroll-mt-24">
          {trackerPrivacy[locale]}
        </p>
        {/* Interesse per OriginsMeta Analytics (02/10/2026, tasto della pagina /analytics) */}
        <p id="analytics-interest" className="mt-6 scroll-mt-24">
          {analyticsInterestPrivacy[locale]}
        </p>
        {/* Draft contro un amico (02/10/2026, fase 2 del draft): testo in src/lib/draftLabels.ts, ancora #draft */}
        <p id="draft" className="mt-6 scroll-mt-24">
          {draftPrivacy[locale]}
        </p>
      </article>
    </div>
  );
}
