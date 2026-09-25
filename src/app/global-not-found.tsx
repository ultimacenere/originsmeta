import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 · OriginsMeta",
  description: "This page does not exist. · Questa pagina non esiste. · Esta página no existe.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center px-6">
        <div className="card-night max-w-md p-8 text-center">
          <p className="kicker text-mint">404</p>
          <h1 className="mt-2 text-3xl font-extrabold">This card does not exist.</h1>
          <p className="mt-3 text-pale-muted">The page you asked for is not on the table.</p>
          {/* fuori dalle lingue non c'è un locale: il messaggio sta in tutte e tre */}
          <p className="mt-4 text-pale-muted" lang="it">
            <span className="block font-display font-bold text-sky">Questa carta non esiste.</span>
            La pagina che hai chiesto non è sul tavolo.
          </p>
          <p className="mt-4 text-pale-muted" lang="es">
            <span className="block font-display font-bold text-sky">Esta carta no existe.</span>
            La página que buscas no está sobre la mesa.
          </p>
          <p className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="btn btn-ink" href="/en">English</Link>
            <Link className="btn btn-ink" href="/it">Italiano</Link>
            <Link className="btn btn-ink" href="/es">Español</Link>
          </p>
        </div>
      </body>
    </html>
  );
}
