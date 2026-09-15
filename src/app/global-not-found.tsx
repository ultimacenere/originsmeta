import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 · OriginsMeta",
  description: "This page does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center px-6">
        <div className="card-ivory max-w-md p-8 text-center">
          <p className="kicker text-crimson">404</p>
          <h1 className="mt-2 text-3xl font-extrabold">This card does not exist.</h1>
          <p className="mt-3 text-ink-muted">The page you asked for is not on the table.</p>
          <p className="mt-6 flex flex-wrap justify-center gap-3">
            <a className="btn btn-ink" href="/en">English</a>
            <a className="btn btn-ink" href="/it">Italiano</a>
          </p>
        </div>
      </body>
    </html>
  );
}
