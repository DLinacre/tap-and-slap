# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| `main` (latest) | ✅ |

## Reporting a vulnerability

**Please do NOT open a public issue for security problems.** Instead email the
maintainers privately, or use GitHub's **Report a vulnerability** tool on the
repository's *Security* tab (Advisories → New draft security advisory).

When reporting, include:

1. A short description of the issue and its impact.
2. The affected file/endpoint and version (commit SHA).
3. Steps to reproduce or a proof of concept.
4. Any suggested fix, if you have one.

You should receive an acknowledgement within 72 hours, and a fix plan within
7 days. Security issues are handled before feature work.

## Scope

In scope: the web application (auth, score submission, API endpoints), the
authentication flow, and any client-side secrets handling.

Out of scope: the leaderboard integrity model itself (guest spoofing) — this is
a known, documented trade-off of the MVP; see `docs/05-security-quality.md` §1.

## Security practices (summary)

- All API input validated with Zod; passwords bcrypt-hashed (cost 12).
- JWT sessions (HttpOnly cookies), rate-limited auth & score endpoints.
- Server-side run integrity checks reject impossible scores.
- Security headers incl. CSP, `X-Frame-Options: DENY`, `nosniff`.
- Secrets live in environment variables only — `.env` is never committed.
- Dependencies updated automatically via Dependabot (`.github/dependabot.yml`).
