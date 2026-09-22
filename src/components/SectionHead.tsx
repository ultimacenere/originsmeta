import Link from "next/link";

export function SectionHead({
  kicker,
  title,
  sub,
  link,
}: {
  kicker?: string;
  title: string;
  sub?: string;
  link?: { href: string; label: string };
}) {
  // Titolo di sezione della scala per ruolo (globals.css): .t-section in gesso, kicker sempre menta.
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {kicker ? <p className="kicker text-mint">{kicker}</p> : null}
        <h2 className="t-section mt-1">{title}</h2>
        {sub ? <p className="mt-2 text-chalk-muted">{sub}</p> : null}
      </div>
      {link ? (
        <Link href={link.href} className="btn btn-ghost text-xs">
          {link.label} →
        </Link>
      ) : null}
    </div>
  );
}
