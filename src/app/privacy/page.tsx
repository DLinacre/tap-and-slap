import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Tap & Slap privacy policy — what data the game stores, why, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <main className="info-page">
      <h1>Privacy</h1>
      <p className="info-page__updated">Last updated: 2026-08-03</p>

      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Guest scores.</strong> If you play without an account, your
          scores are stored with a random guest identifier generated in your
          browser. We cannot identify you from it.
        </li>
        <li>
          <strong>Accounts (optional).</strong> If you register, we store your
          email, chosen username, and a bcrypt-hashed password (never the
          password itself). Accounts exist so your name can appear on the
          leaderboard.
        </li>
        <li>
          <strong>Local settings.</strong> Volume, timing calibration and your
          best scores are kept in your browser&apos;s local storage and never
          leave your device.
        </li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>No advertising trackers, cross-site tracking or cookie banners.</li>
        <li>No analytics by default (privacy-friendly analytics may be added later; this page will be updated first).</li>
        <li>We never sell or share personal data.</li>
      </ul>

      <h2>Deleting your data</h2>
      <p>
        Guest data: clear your browser storage for this site. Account data:
        open an issue on the{" "}
        <a href="https://github.com/DLinacre/tap-and-slap/issues" target="_blank" rel="noreferrer">
          GitHub repository
        </a>{" "}
        and the maintainers will delete your account and scores.
      </p>

      <p className="info-page__back">
        <Link href="/">← Back to the game</Link>
      </p>
    </main>
  );
}
