import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 · OriginsMeta",
  description: "This page does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center px-6">
        <div className="card-night max-w-md p-8 text-center">
          <p className="kicker text-crimson">404</p>
          <h1 className="mt-2 text-3xl font-extrabold">This card does not exist.</h1>
          <p className="mt-3 text-pale-muted">The page you asked for is not on the table.</p>
          <p className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="btn btn-ink" href="/en">English</Link>
            <Link className="btn btn-ink" href="/it">Italiano</Link>
          </p>
        </div>
      </body>
    </html>
  );
}
