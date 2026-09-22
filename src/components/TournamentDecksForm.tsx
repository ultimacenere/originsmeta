"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { submitDecks, type TournamentActionState } from "@/lib/tournament/actions";
import { fill } from "@/lib/tournament/types";

type Props = {
  locale: string;
  tournamentId: string;
  required: number;
  initialCodes: string[];
  labels: Dictionary["tournaments"];
  builderHref: string;
  backHref: string;
};

/**
 * Consegna dei mazzi con i codici OriginsMeta (fase 1). Nella fase 4 questo modulo verrà affiancato dal
 * deck builder dedicato al torneo, che compila i codici da solo.
 */
export function TournamentDecksForm({ locale, tournamentId, required, initialCodes, labels, builderHref, backHref }: Props) {
  const x = labels;
  const d = x.deckPage;
  const [state, formAction, pending] = useActionState<TournamentActionState, FormData>(submitDecks, {});
  const errorText = state.error ? (x.errors[state.error as keyof typeof x.errors] ?? x.errors.db) : null;
  return (
    <form action={formAction} className="card-night grid gap-5 p-6 sm:p-8">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="tournament_id" value={tournamentId} />
      <p className="text-sm text-pale-muted">{d.intro}</p>
      <label className="block text-sm">
        <span className="kicker text-mint">{d.codes}</span>
        <textarea
          name="codes"
          rows={required + 2}
          defaultValue={initialCodes.join("\n")}
          spellCheck={false}
          className="mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 font-mono text-xs text-pale focus:border-mint"
          placeholder="https://originsmeta.com/…/deck-builder#…"
        />
        <span className="mt-1 block text-xs text-pale-muted">{fill(d.required, { n: required })}</span>
      </label>
      {state.ok ? (
        <p role="status" className="text-sm font-semibold text-good">
          {d.saved}
        </p>
      ) : null}
      {errorText ? (
        <p role="alert" className="text-sm text-bad">
          {errorText}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn btn-mint text-xs">
          {pending ? d.submitting : d.submit}
        </button>
        <Link href={builderHref} className="btn btn-ink text-xs">
          {d.builder}
        </Link>
        <Link href={backHref} className="btn btn-ghost text-xs">
          {d.back}
        </Link>
      </div>
    </form>
  );
}
