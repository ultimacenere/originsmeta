/**
 * Avviso "messaggi non disponibili" delle pagine della casella (26/09/2026, pacchetto INBOX): migrazione non ancora
 * applicata, community spenta o database che non risponde. La pagina resta in piedi e non dà un 404.
 */
export function InboxUnavailable({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="card-night p-6 text-pale-muted">{text}</p>
    </div>
  );
}
