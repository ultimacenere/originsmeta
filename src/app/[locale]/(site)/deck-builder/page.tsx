import type { Metadata } from "next";
import Link from "next/link";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { cards, sagas } from "@/lib/data/cards";
import type { BuilderCard } from "@/lib/deckrules";
import { RULES } from "@/lib/deckrules";
import { DeckBuilder } from "@/components/DeckBuilder";
import { contactEmail } from "@/components/Footer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/deck-builder", dict.builder.title, dict.builder.intro);
}

export default async function DeckBuilderPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const pool: BuilderCard[] = cards
    .filter((c) => c.status === "active" && c.type !== "token")
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      type: c.type,
      legendary: Boolean(c.legendary),
      mana: c.mana,
      power: c.power,
      health: c.health,
      sagaLabel: sagas[c.saga][locale],
      key: c.key,
    }));
  const b = d.builder;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.decks}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-mint sm:text-5xl">{b.title}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{b.intro}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <section className="felt-panel p-4">
          <h2 className="kicker text-chalk-muted">{b.rulesTitle}</h2>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-chalk">
            {b.rules.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-chalk-muted/80">{b.rulesSource}</p>
        </section>
        <Link href={href(locale, "/decks")} className="btn btn-ghost self-center">
          {d.decks.title} →
        </Link>
      </div>

      <div className="mt-8">
        <DeckBuilder
          pool={pool}
          contactEmail={contactEmail}
          shareBase={`${siteUrl}${href(locale, "/deck-builder")}`}
          publishHref={href(locale, "/decks/publish")}
          labels={{
            publish: b.publish,
            publishHint: b.publishHint,
            modeSingle: b.modeSingle,
            modeTournament: b.modeTournament,
            deckName: b.deckName,
            deckNamePlaceholder: b.deckNamePlaceholder,
            legendarySlot: b.legendarySlot,
            pickLegendary: b.pickLegendary,
            slots: b.slots,
            slotsHint: b.slotsHint,
            pool: b.pool,
            poolHint: b.poolHint,
            searchPool: b.searchPool,
            all: d.common.all,
            cost: b.cost,
            add: b.add,
            remove: b.remove,
            inDeck: b.inDeck,
            full: b.full,
            curve: b.curve,
            valid: b.valid,
            invalid: b.invalid,
            issues: b.issues,
            customTitle: b.customTitle,
            customHint: b.customHint,
            customName: b.customName,
            customCost: b.customCost,
            customLegendary: b.customLegendary,
            customAdd: b.customAdd,
            actions: b.actions,
            copyLink: b.copyLink,
            copied: b.copied,
            exportText: b.exportText,
            exportGame: b.exportGame,
            exportGameMissing: b.exportGameMissing,
            importTitle: b.importTitle,
            importHint: b.importHint,
            importButton: b.importButton,
            importOk: b.importOk,
            importUnknown: b.importUnknown,
            importError: b.importError,
            teachTitle: b.teachTitle,
            teachHint: b.teachHint,
            teachSend: b.teachSend,
            save: b.save,
            saved: b.saved,
            clear: b.clear,
            submit: b.submit,
            submitHint: b.submitHint,
            tournamentTitle: b.tournamentTitle,
            tournamentHint: b.tournamentHint,
            minDifferent: b.minDifferent,
            diffTable: b.diffTable,
            shared: b.shared,
            deckLabel: b.deckLabel,
            ok: b.ok,
            restored: b.restored,
            typeUnit: b.typeUnit,
            typeSpell: b.typeSpell,
            legendary: d.common.legendary,
            unit: d.common.unit,
            spell: d.common.spell,
          }}
        />
      </div>
      <p className="mt-6 text-xs text-chalk-muted/70">
        {RULES.deckSize} = {RULES.legendarySlots} + {RULES.distinctCards} × {RULES.copiesPerCard} · {d.common.notAffiliated}
      </p>
    </div>
  );
}
