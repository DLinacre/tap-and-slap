import Link from "next/link";

/** Branded 404 — never leave a visitor on a bare error page. */
export default function NotFound() {
  return (
    <main className="notfound">
      <div className="notfound__stage" aria-hidden="true">🕺</div>
      <h1 className="notfound__title">404 — SLAPPED OUT</h1>
      <p className="notfound__body">
        That page took a hit and didn&apos;t get back up. The dance floor is
        this way.
      </p>
      <Link className="neon-btn neon-btn--primary" href="/">
        ▶ BACK TO THE FLOOR
      </Link>
    </main>
  );
}
